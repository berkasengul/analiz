# MTG MOTORS — showroom odası (Blender 4.2 / 5.x, arka planda çalışır)
#
# Sitedeki oda düzenini (index.html: ROOM_W=13, ROOM_D=13, HALL_H=4.8, kapı 2.6 × 3.1, z=-2.3)
# birebir ölçülerle modeller, ışığı Cycles ile "lightmap" olarak pişirir ve web için GLB verir.
# Bütün araç odaları aynı mimariyi paylaşır → tek room_car.glb; son oda → room_lounge.glb.
# Kodda kalanlar (hareketli / veriye bağlı): araç, sürgülü cam kapılar, bilgi totemi yazısı,
# marka paneli logosu, kamera, kartlar. GLB'de bunların yeri boş "çapa" (empty) nesnelerle işaretlidir.
#
# Kullanım (proje klasöründen, mtg-motors-codex/):
#   blender -b --factory-startup --python tools/blender/mtg_room.py -- --variant car --mode preview
#   blender -b --factory-startup --python tools/blender/mtg_room.py -- --variant car --mode full
#   blender -b --factory-startup --python tools/blender/mtg_room.py -- --variant lounge --mode full
# Seçenekler:
#   --repo DIR        proje klasörü (varsayılan: betiğin iki üstü)
#   --out DIR         çıktı (varsayılan: <repo>/models/rooms)
#   --extra-decor DIR Poly Haven glTF klasörü (meshopt açamayan Blender 4.2 için yedek dekor kaynağı)
#   --car FILE        önizlemede gösterilecek araç GLB (varsayılan: models/web/bmw-420i-coupe.glb)
#   --samples N       önizleme örnek sayısı (64)   --bake-samples N  bake örnek sayısı (192)
#   --lm-size N       zemin/duvar lightmap çözünürlüğü (2048)   --save-blend   .blend kaynağını da kaydet
#
# Koordinatlar: site (three.js, Y yukarı) (x, y, z) = Blender (x, -z, y). Oda yereldir: merkez x=0,
# ön cephe z=0, arka duvar z=-13. Kod GLB'yi roomCX(k) kadar kaydırır.
import bpy, bmesh, math, os, sys, json, time, re
from mathutils import Vector

# ---------------- argümanlar ----------------
argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
def opt(name, default=None, flag=False):
    if name in argv:
        if flag: return True
        return argv[argv.index(name) + 1]
    return default
HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(opt('--repo', os.path.join(HERE, '..', '..')))
OUT = os.path.abspath(opt('--out', os.path.join(REPO, 'models', 'rooms')))
VARIANT = opt('--variant', 'car')
MODE = opt('--mode', 'preview')
EXTRA_DECOR = opt('--extra-decor')
CAR_GLB = opt('--car', os.path.join(REPO, 'models', 'web', 'bmw-420i-coupe.glb'))
SAMPLES = int(opt('--samples', 64))
BAKE_SAMPLES = int(opt('--bake-samples', 192))
LM = int(opt('--lm-size', 2048))
PREVIEW_ONLY = opt('--views')
RES = tuple(int(v) for v in opt('--res', '1280x720').split('x'))            # örn. "bmw,wide"
os.makedirs(OUT, exist_ok=True)
T0 = time.time()
def log(*a): print('[MTG %5.1fs]' % (time.time() - T0), *a, flush=True)
log('Blender', bpy.app.version_string, '| variant', VARIANT, '| mode', MODE, '| repo', REPO)

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.unit_settings.system = 'METRIC'

# ---------------- ölçüler (index.html ile aynı) ----------------
W, D, H = 13.0, 13.0, 4.8
DOOR_W, DOOR_H, DOOR_Z = 2.6, 3.1, -2.3
HALF_T = .15                          # bölme duvarı 0.30 m; her oda kendi yarısını taşır
XL, XR = -W / 2 + HALF_T, W / 2 - HALF_T
CAR = (-1.0, -6.2)                    # CAR_OFF: oda merkezinin 1 m solu
CAR_YAW = math.atan2(-.55, -.84)      # buildStations: turn.rotation.y
LOUNGE = VARIANT == 'lounge'
HUB = VARIANT == 'hub'            # resepsiyon + ana koridor (araç modülleri koridora bağlanır)
FACADE = VARIANT == 'facade'      # dış cephe + içe çekilmiş giriş portalı
LIGHTBOX = (0.0, -D + 4.4, 6.0, 3.6) if LOUNGE else (CAR[0], CAR[1], 7.2, 4.2)

def P(x, y, z): return Vector((x, -z, y))

# nesne grupları
BAKE = {'floor': [], 'back': [], 'wall_l': [], 'wall_r': [], 'ceil': [], 'filler': []}
LM_BOUNDS = {'floor': (-W / 2, W / 2, -D, 0.), 'ax': (-W / 2, W / 2), 'az': (-D, 0.)}   # hub'da genişler
DARK = []                             # gölge boşlukları / kanallar: neredeyse siyah, bake gerekmez
PLAIN, EMISSIVE, ANCHORS, PROXY = [], [], [], []

# ---------------- malzemeler ----------------
def tex_path(folder, kind):
    for ext in ('webp', 'jpg', 'png'):
        p = os.path.join(REPO, 'textures', folder, f'{kind}.{ext}')
        if os.path.exists(p): return p
    return None

def img(path, noncolor=False):
    im = bpy.data.images.load(path, check_existing=True)
    if noncolor: im.colorspace_settings.name = 'Non-Color'
    return im

def hexrgb(h):
    h = h.lstrip('#'); c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(((v + .055) / 1.055) ** 2.4 if v > .04045 else v / 12.92 for v in c)   # sRGB → lineer

def pbr(name, folder=None, color='#ffffff', rough=.5, metal=0., normal=1., coat=0., use_map=True, rough_var=0., coat_rough=.03, rough_mul=1., micro=0.):
    m = bpy.data.materials.new('MTG_' + name); m.use_nodes = True
    nt = m.node_tree; b = nt.nodes['Principled BSDF']
    b.inputs['Metallic'].default_value = metal
    b.inputs['Roughness'].default_value = rough
    b.inputs['Base Color'].default_value = (*hexrgb(color), 1)
    if coat:
        b.inputs['Coat Weight'].default_value = coat; b.inputs['Coat Roughness'].default_value = coat_rough
    d = tex_path(folder, 'Diffuse') if folder else None
    if d and use_map:
        t = nt.nodes.new('ShaderNodeTexImage'); t.image = img(d)
        if color.lower() != '#ffffff':
            mix = nt.nodes.new('ShaderNodeMix'); mix.data_type = 'RGBA'; mix.blend_type = 'MULTIPLY'
            mix.inputs['Factor'].default_value = 1.0; mix.inputs[7].default_value = (*hexrgb(color), 1)
            nt.links.new(t.outputs['Color'], mix.inputs[6]); nt.links.new(mix.outputs[2], b.inputs['Base Color'])
        else:
            nt.links.new(t.outputs['Color'], b.inputs['Base Color'])
    if folder:
        r = tex_path(folder, 'Rough')
        if r and rough > .9 and not use_map: r = None      # dokusuz kumaş: sabit pürüzlülük
        if r:
            rt = nt.nodes.new('ShaderNodeTexImage'); rt.image = img(r, True)
            out = rt.outputs['Color']
            if rough_var or rough_mul != 1.:
                # büyük ölçekli pürüzlülük dalgalanması (yüzey "mükemmel shader" gibi durmasın)
                geo = nt.nodes.new('ShaderNodeNewGeometry')
                nz = nt.nodes.new('ShaderNodeTexNoise'); nz.inputs['Scale'].default_value = .9; nz.inputs['Detail'].default_value = 4.
                nt.links.new(geo.outputs['Position'], nz.inputs['Vector'])
                mr = nt.nodes.new('ShaderNodeMapRange')
                mr.inputs['To Min'].default_value = rough_mul * (1 - rough_var); mr.inputs['To Max'].default_value = rough_mul * (1 + rough_var)
                nt.links.new(nz.outputs['Fac'], mr.inputs['Value'])
                mm = nt.nodes.new('ShaderNodeMath'); mm.operation = 'MULTIPLY'; mm.use_clamp = True
                nt.links.new(out, mm.inputs[0]); nt.links.new(mr.outputs['Result'], mm.inputs[1]); out = mm.outputs[0]
            nt.links.new(out, b.inputs['Roughness'])
        n = tex_path(folder, 'nor_gl')
        if n and normal > 0:
            nt_ = nt.nodes.new('ShaderNodeTexImage'); nt_.image = img(n, True)
            nm = nt.nodes.new('ShaderNodeNormalMap'); nm.inputs['Strength'].default_value = normal
            nt.links.new(nt_.outputs['Color'], nm.inputs['Color']); nt.links.new(nm.outputs['Normal'], b.inputs['Normal'])
            if micro:
                # mikro yüzey: dokunun çok altındaki ölçekte ince kırılım (cilalı taşta "gerçek" ışık kırığı)
                geo = nt.nodes.new('ShaderNodeNewGeometry')
                mz = nt.nodes.new('ShaderNodeTexNoise'); mz.inputs['Scale'].default_value = 38.; mz.inputs['Detail'].default_value = 6.
                nt.links.new(geo.outputs['Position'], mz.inputs['Vector'])
                bp = nt.nodes.new('ShaderNodeBump'); bp.inputs['Strength'].default_value = micro; bp.inputs['Distance'].default_value = .0005
                nt.links.new(mz.outputs['Fac'], bp.inputs['Height']); nt.links.new(nm.outputs['Normal'], bp.inputs['Normal'])
                nt.links.new(bp.outputs['Normal'], b.inputs['Normal'])
    m['mtg'] = name                      # kod bu anahtarla kendi malzemesini atayabilir
    return m

def emissive(name, color, strength):
    m = bpy.data.materials.new('MTG_' + name); m.use_nodes = True
    b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*hexrgb(color), 1)
    b.inputs['Emission Color'].default_value = (*hexrgb(color), 1)
    b.inputs['Emission Strength'].default_value = strength
    m['mtg'] = name
    return m

def glass(name):
    m = bpy.data.materials.new('MTG_' + name); m.use_nodes = True
    b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*hexrgb('#d6e0e4'), 1)
    b.inputs['Roughness'].default_value = .02
    b.inputs['Transmission Weight'].default_value = 1.0
    b.inputs['IOR'].default_value = 1.45
    m['mtg'] = name
    return m

M = {
    # zemin: büyük ebat porselen plaka (2.6 × 1.3 m), iki hafif ton → doğal varyasyon
    'porcelain':  pbr('porcelain', 'porcelain_slab', '#ece7df', normal=.3, rough_var=.2, coat=.22, coat_rough=.1, micro=.06),   # cilalı porselen: ince cila + pürüzlülük dalgası
    'porcelain2': pbr('porcelain_b', 'porcelain_slab', '#e2ddd5', normal=.3, rough_var=.2, coat=.22, coat_rough=.11, micro=.06),
    'grout':      pbr('grout', None, '#625d58', rough=.85),
    'stage':      pbr('stage', 'porcelain_slab', '#4a4744', normal=.1, rough_var=.15, coat=.4, coat_rough=.11, micro=.05, use_map=False),   # cilalı grafit porselen
    'brand':      pbr('brand_brass', None, '#b8935f', rough=.38, metal=.75),
    # duvar taşları: çizgisiz plakalar, derz geometride; panel başına ton ve doku başlangıcı değişir
    'trav_a':     pbr('travertine_a', 'travertine_clean', '#efe8dc', normal=.65, rough_var=.3, micro=.12),
    'trav_b':     pbr('travertine_b', 'travertine_clean', '#e4dccf', normal=.65, rough_var=.3, micro=.12),
    'trav_c':     pbr('travertine_c', 'travertine_clean', '#eae1d2', normal=.65, rough_var=.3, micro=.12),
    'dark_a':     pbr('dark_stone', 'dark_stone', '#ffffff', normal=.6, rough_var=.35, coat=.18, coat_rough=.22, micro=.1),   # bilenmiş (honed) koyu taş
    'dark_b':     pbr('dark_stone_b', 'dark_stone', '#e9e5e1', normal=.6, rough_var=.35, coat=.18, coat_rough=.22, micro=.1),
    'warm':       pbr('warm_stone', 'warm_stone', '#ffffff', normal=.5),
    'micro':      pbr('microcement', 'microcement', '#efebe5', normal=.45),
    'walnut':     pbr('walnut', 'smoked_walnut_veneer', '#ffffff', normal=.7, rough_var=.25, coat=.3, coat_rough=.3, micro=.05),   # yağ cilalı ceviz: yumuşak parlama
    'travertine': pbr('travertine', 'travertine_clean', '#e8e0d3', normal=.5),
    'ceil_panel': pbr('ceiling_panel', 'microcement', '#3a3734', normal=.25, rough_mul=.55, rough_var=.25, micro=.04),   # koyu saten lake panel
    'reveal':     pbr('reveal', None, '#0b0b0c', rough=.9),
    'black':      pbr('black', None, '#0e0f10', rough=.35, metal=.5),
    'plinth':     pbr('plinth', None, '#121315', rough=.5, metal=.2),
    'metal':      pbr('metal', None, '#b9b4ab', rough=.28, metal=1.),
    'bronze':     pbr('bronze', None, '#5a4632', rough=.34, metal=1.),
    'bronze_lt':  pbr('bronze_light', None, '#9a7a55', rough=.3, metal=1.),
    'fabric':     pbr('fabric', 'velour_velvet', '#b3a998', rough=.97, normal=.8, use_map=False),   # bukle doku: renk düz, kadife yalnız normal
    'pillow_a':   pbr('pillow_rust', 'velour_velvet', '#7c4a35', rough=.95, normal=.7, use_map=False),
    'pillow_b':   pbr('pillow_char', 'velour_velvet', '#3a3a3c', rough=.95, normal=.7, use_map=False),
    'rug':        pbr('rug', 'velour_velvet', '#cdc2b1', rough=.98, normal=1., use_map=False),
    'rug_edge':   pbr('rug_edge', 'velour_velvet', '#8f8374', rough=.98, normal=1., use_map=False),
    'book_a':     pbr('book_cream', None, '#e6dfd1', rough=.6),
    'book_b':     pbr('book_black', None, '#1d1f22', rough=.5),
    'book_c':     pbr('book_tan', None, '#a0714f', rough=.55),
    'planter':    pbr('planter', 'microcement', '#8c877f', rough=.9, normal=.6),
    'soil':       pbr('soil', None, '#2a2522', rough=1.),
    'glass':      glass('glass'),
    'led':        emissive('led', '#fff4e4', 9.),     # geniş difüzörlü lineer armatür: yansıması patlamasın
    'led_line':   None,
    'ledSoft':    emissive('ledSoft', '#ffeedd', 14.),
    'ledRing':    emissive('ledRing', '#ffe6c4', 2.5),
    'halo':       emissive('halo', '#ffd8a6', 22.),
}
def diffuser_strip(name, color, peak):
    """lineer armatür difüzörü: enine profil (1 - u²)^1.5 → yansımada sert beyaz çizgi değil, yumuşak kenarlı ışık bandı."""
    m = emissive(name, color, peak); nt = m.node_tree; b = nt.nodes['Principled BSDF']
    tc = nt.nodes.new('ShaderNodeTexCoord'); sep = nt.nodes.new('ShaderNodeSeparateXYZ')
    nt.links.new(tc.outputs['Generated'], sep.inputs['Vector'])
    m1 = nt.nodes.new('ShaderNodeMath'); m1.operation = 'MULTIPLY_ADD'; m1.inputs[1].default_value = 2.; m1.inputs[2].default_value = -1.
    nt.links.new(sep.outputs['Y'], m1.inputs[0])                       # u: -1..1 (enine)
    m2 = nt.nodes.new('ShaderNodeMath'); m2.operation = 'POWER'; m2.inputs[1].default_value = 2.
    nt.links.new(m1.outputs[0], m2.inputs[0])
    m3 = nt.nodes.new('ShaderNodeMath'); m3.operation = 'SUBTRACT'; m3.inputs[0].default_value = 1.; m3.use_clamp = True
    nt.links.new(m2.outputs[0], m3.inputs[1])
    m4 = nt.nodes.new('ShaderNodeMath'); m4.operation = 'POWER'; m4.inputs[1].default_value = 1.5
    nt.links.new(m3.outputs[0], m4.inputs[0])
    m5 = nt.nodes.new('ShaderNodeMath'); m5.operation = 'MULTIPLY'; m5.inputs[1].default_value = peak
    nt.links.new(m4.outputs[0], m5.inputs[0]); nt.links.new(m5.outputs[0], b.inputs['Emission Strength'])
    return m
M['led_line'] = diffuser_strip('led_line', '#fff4e4', 13.)

# dokular için gerçek ölçü (m): bir doku tekrarının kapladığı alan (anahtar = malzemenin 'mtg' adı)
TILE = {'stage': (6.0, 6.0), 'porcelain': (2.6, 2.6), 'porcelain_b': (2.6, 2.6), 'travertine': (2.4, 2.4),
        'travertine_a': (2.4, 2.4), 'travertine_b': (2.4, 2.4), 'travertine_c': (2.4, 2.4),
        'dark_stone': (2.4, 2.4), 'dark_stone_b': (2.4, 2.4), 'warm_stone': (1.2, 1.2),
        'microcement': (2.4, 2.4), 'walnut': (1.0, 1.0), 'ceiling_panel': (2.6, 2.6),
        'fabric': (.25, .25), 'pillow_rust': (.25, .25), 'pillow_char': (.25, .25),
        'rug': (.35, .35), 'rug_edge': (.35, .35), 'planter': (.6, .6)}

# ---------------- geometri yardımcıları ----------------
def link(o):
    if o.name not in scene.collection.objects: scene.collection.objects.link(o)

def world_uv(obj, tile, origin=(0., 0., 0.)):
    """UV0: site koordinatında kutu izdüşümü; doku gerçek ölçüde tekrarlar (tile = (u_m, v_m))."""
    tu, tv = tile; ox, oy, oz = origin
    me = obj.data; bm = bmesh.new(); bm.from_mesh(me)
    uvl = bm.loops.layers.uv.get('UVMap') or bm.loops.layers.uv.new('UVMap'); mw = obj.matrix_world; R = mw.to_3x3()
    for f in bm.faces:
        n = R @ f.normal; ax = max(range(3), key=lambda i: abs(n[i]))
        for l in f.loops:
            co = mw @ l.vert.co; sx, sy, sz = co.x - ox, co.z - oy, -co.y - oz      # site koordinatı
            if ax == 2:   u, v = sx, -sz           # yatay yüzey (zemin/tavan)
            elif ax == 1: u, v = sx, sy            # site z'ye dönük duvar (ön/arka)
            else:         u, v = -sz, sy           # site x'e dönük duvar (yan)
            l[uvl].uv = (u / tu, v / tv)
    bm.to_mesh(me); bm.free()

def finish(o, mat, group, tile=None, bevel=0., seg=2, origin=(0, 0, 0)):
    if mat: o.data.materials.append(mat)
    if bevel > 0:
        mod = o.modifiers.new('bv', 'BEVEL'); mod.width = bevel; mod.segments = seg; mod.limit_method = 'ANGLE'
        bpy.context.view_layer.objects.active = o; bpy.ops.object.modifier_apply(modifier=mod.name)
    key = mat.get('mtg') if mat else None
    world_uv(o, tile or TILE.get(key, (1., 1.)), origin)
    if group is not None: group.append(o)
    return o

def box(name, sx, sy, sz, x, y, z, mat, group, tile=None, bevel=0., seg=2, origin=(0, 0, 0)):
    """site ölçüsüyle kutu: sx genişlik (x), sy yükseklik (y), sz derinlik (site z); merkez (x, y, z)."""
    bpy.ops.mesh.primitive_cube_add(size=1, location=P(x, y, z))
    o = bpy.context.active_object; o.name = name
    o.scale = (sx, sz, sy); bpy.ops.object.transform_apply(scale=True)
    return finish(o, mat, group, tile, bevel, seg, origin)

def plane_h(name, sx, sz, x, y, z, mat, group, down=False, tile=None, origin=(0, 0, 0)):
    """yatay düzlem (zemin/tavan). down=True → normal aşağı (tavan)."""
    bpy.ops.mesh.primitive_plane_add(size=1, location=P(x, y, z))
    o = bpy.context.active_object; o.name = name
    o.scale = (sx, sz, 1); bpy.ops.object.transform_apply(scale=True)
    if down:
        for f in o.data.polygons: f.flip()
    return finish(o, mat, group, tile, origin=origin)

def poly_mesh(name, verts, faces, mat, group, tile=None, origin=(0, 0, 0)):
    """site koordinatlı köşelerle serbest mesh."""
    me = bpy.data.meshes.new(name); me.from_pydata([P(*v) for v in verts], [], faces); me.update()
    o = bpy.data.objects.new(name, me); link(o)
    return finish(o, mat, group, tile, origin=origin)

def wall_x(name, x, facing, z0, z1, y0, y1, mat, group, holes=()):
    """x sabit duvar yüzü (site z0..z1, y0..y1). facing=+1 → normal +x. holes: (za, zb, ya, yb)."""
    zs = sorted({z0, z1, *[h[0] for h in holes], *[h[1] for h in holes]})
    ys = sorted({y0, y1, *[h[2] for h in holes], *[h[3] for h in holes]})
    verts, faces, idx = [], [], {}
    def vi(z, y):
        if (z, y) not in idx: idx[(z, y)] = len(verts); verts.append((x, y, z))
        return idx[(z, y)]
    for i in range(len(zs) - 1):
        for j in range(len(ys) - 1):
            zc, yc = (zs[i] + zs[i + 1]) / 2, (ys[j] + ys[j + 1]) / 2
            if any(h[0] <= zc <= h[1] and h[2] <= yc <= h[3] for h in holes): continue
            q = [vi(zs[i], ys[j]), vi(zs[i + 1], ys[j]), vi(zs[i + 1], ys[j + 1]), vi(zs[i], ys[j + 1])]
            faces.append(q if facing > 0 else q[::-1])
    o = poly_mesh(name, verts, faces, mat, group)
    bpy.context.view_layer.objects.active = o; bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.select_all(action='SELECT'); bpy.ops.mesh.remove_doubles(threshold=1e-5)
    bpy.ops.object.mode_set(mode='OBJECT')
    # yön kontrolü: normaller istenen tarafa baksın
    n = o.data.polygons[0].normal
    if (n.x > 0) != (facing > 0):
        bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT'); bpy.ops.mesh.flip_normals(); bpy.ops.object.mode_set(mode='OBJECT')
    return o

def cylinder(name, r_bot, r_top, h, x, y0, z, mat, group, verts=48, tile=None):
    bpy.ops.mesh.primitive_cone_add(vertices=verts, radius1=r_bot, radius2=r_top, depth=h, location=P(x, y0 + h / 2, z))
    o = bpy.context.active_object; o.name = name
    return finish(o, mat, group, tile)

def join(objs, name):
    bpy.ops.object.select_all(action='DESELECT')
    for o in objs: o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    bpy.ops.object.join(); o = bpy.context.active_object; o.name = name
    return o

def anchor(name, x, y, z, yaw=0., **props):
    o = bpy.data.objects.new(name, None); link(o)
    o.location = P(x, y, z); o.rotation_euler = (0, 0, yaw); o.empty_display_size = .3
    for k, v in props.items(): o[k] = v
    ANCHORS.append(o); return o

# ---------------- mimari (2. aşama: derinlik, vurgu duvarları, mimari tavan) ----------------
import random
RNG = random.Random(7)                 # sabit tohum: her çalıştırmada aynı panel varyasyonu
BZ = -D
DOOR_HOLE = (DOOR_Z - DOOR_W / 2, DOOR_Z + DOOR_W / 2, 0., DOOR_H)
WALL_TOP = H + .15                     # duvarlar tavanın çevre gölge boşluğuna kadar uzanır
GLASS_X, GLASS_Z = .4, -9.8            # araç odası: arka sağdaki cam galeri kutusu (x ≥ 0.4, z ≤ -9.8)

def rand_origin():
    return (RNG.uniform(-3, 0), RNG.uniform(-3, 0), RNG.uniform(-3, 0))

def stone_panels(name, plane, rects, mats, group, depth=.03, gap=.006):
    """Taş kaplama: plane = ('z', yüz z, yön) arka duvar | ('x', yüz x, yön) yan duvar.
    rects: (a0, a1, y0, y1, sütun, sıra) — a, duvar boyunca eksen (x veya z)."""
    _, f, sgn = plane
    for ri, (a0, a1, y0, y1, nc, nr) in enumerate(rects):
        pw, rh = (a1 - a0) / nc, (y1 - y0) / nr
        for i in range(nc):
            for j in range(nr):
                m = mats[RNG.randrange(len(mats))]
                ac, yc, c = a0 + pw * (i + .5), y0 + rh * (j + .5), f + sgn * depth / 2
                if plane[0] == 'z':
                    box(f'{name}_{ri}_{i}_{j}', pw - gap, rh - gap, depth, ac, yc, c, m, group, origin=rand_origin(), bevel=.0015, seg=1)
                else:
                    box(f'{name}_{ri}_{i}_{j}', depth, rh - gap, pw - gap, c, yc, ac, m, group, origin=rand_origin(), bevel=.0015, seg=1)

def rounded_slab(name, w, d, r, h, x, y0, z, mat, group, seg=8, tile=None):
    """köşeleri yuvarlatılmış levha (halı, sehpa tablası): plan w × d, köşe yarıçapı r, kalınlık h."""
    pts = []
    for cx_, cz_, a0 in ((w / 2 - r, d / 2 - r, 0), (-w / 2 + r, d / 2 - r, 90), (-w / 2 + r, -d / 2 + r, 180), (w / 2 - r, -d / 2 + r, 270)):
        for k in range(seg + 1):
            a = math.radians(a0 + 90 * k / seg); pts.append((x + cx_ + r * math.cos(a), z + cz_ + r * math.sin(a)))
    n = len(pts)
    verts = [(px, y0, pz) for px, pz in pts] + [(px, y0 + h, pz) for px, pz in pts]
    faces = [tuple(range(n, 2 * n)), tuple(range(n - 1, -1, -1))] + [(i, (i + 1) % n, n + (i + 1) % n, n + i) for i in range(n)]
    o = poly_mesh(name, verts, faces, mat, group, tile=tile)
    fix_normals(o); return o

def disc(name, r_out, r_in, y, x, z, mat, group, n=128):
    """zemin halkası / disk (r_in = 0 → dolu disk), normal yukarı."""
    if r_in <= 0:
        verts = [(x, y, z)] + [(x + r_out * math.cos(2 * math.pi * i / n), y, z + r_out * math.sin(2 * math.pi * i / n)) for i in range(n)]
        faces = [(0, 1 + (i + 1) % n, 1 + i) for i in range(n)]
    else:
        verts = [(x + r * math.cos(2 * math.pi * i / n), y, z + r * math.sin(2 * math.pi * i / n)) for r in (r_out, r_in) for i in range(n)]
        faces = [(i, n + i, n + (i + 1) % n, (i + 1) % n) for i in range(n)]
    o = poly_mesh(name, verts, faces, mat, group)
    if o.data.polygons[0].normal.z < 0:
        for f in o.data.polygons: f.flip()
    return o

def fix_normals(o):
    bpy.context.view_layer.objects.active = o
    bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.mesh.normals_make_consistent(inside=False); bpy.ops.object.mode_set(mode='OBJECT')

def rotate_mesh(o, yaw=0., tilt=0., pivot=None):
    """mesh'i (dünyaya uygulanmış) kendi pivotu etrafında döndür: yaw = site y ekseni, tilt = site x ekseni."""
    from mathutils import Matrix
    c = pivot if pivot is not None else sum((v.co for v in o.data.vertices), Vector()) / len(o.data.vertices)
    R = Matrix.Rotation(yaw, 4, 'Z') @ Matrix.Rotation(tilt, 4, 'X')
    o.data.transform(Matrix.Translation(c) @ R @ Matrix.Translation(-c)); o.data.update()

FONT_PATHS = [os.path.join(HERE, 'assets', 'Cinzel-SemiBold.ttf'), 'C:/Windows/Fonts/georgia.ttf', 'C:/Windows/Fonts/times.ttf',
              '/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf']
def solid_text(name, body, size, depth, tracking, fonts):
    """Yazıyı kontur kontur katı yapar: dış konturlar birleşim, iç boşluklar fark (boolean, EXACT).
    Blender'ın yazı dolgusu tek-çift kuralı kullanır; Cinzel'in üst üste binen konturları (M, T, R) delik bırakır."""
    cu = bpy.data.curves.new(name + '_src', 'FONT'); cu.body = body; cu.size = size
    cu.align_x = 'CENTER'; cu.align_y = 'CENTER'; cu.space_character = tracking
    for fp in fonts:
        if os.path.exists(fp):
            try: cu.font = bpy.data.fonts.load(fp, check_existing=True); break
            except Exception: pass
    src = bpy.data.objects.new(name + '_src', cu); link(src)
    bpy.ops.object.select_all(action='DESELECT'); src.select_set(True); bpy.context.view_layer.objects.active = src
    bpy.ops.object.convert(target='CURVE'); src = bpy.context.active_object
    def pts(sp):
        return [p.co.xy for p in sp.bezier_points] if sp.type == 'BEZIER' else [p.co.xy for p in sp.points]
    def sarea(sp):
        q = pts(sp); return sum(q[i - 1].x * q[i].y - q[i].x * q[i - 1].y for i in range(len(q))) / 2
    sps = list(src.data.splines)
    outer_sign = 1 if sarea(max(sps, key=lambda s: abs(sarea(s)))) > 0 else -1
    solids = []
    for i, sp in enumerate(sps):
        hole = sarea(sp) * outer_sign < 0
        cd = bpy.data.curves.new(f'{name}_c{i}', 'CURVE'); cd.dimensions = '2D'; cd.fill_mode = 'BOTH'
        cd.extrude = depth / 2 * (1.6 if hole else 1.); cd.resolution_u = src.data.resolution_u
        ns = cd.splines.new('BEZIER'); ns.bezier_points.add(len(sp.bezier_points) - 1)
        for a, b in zip(sp.bezier_points, ns.bezier_points):
            b.co = a.co; b.handle_left_type = a.handle_left_type; b.handle_right_type = a.handle_right_type
            b.handle_left = a.handle_left; b.handle_right = a.handle_right
        ns.use_cyclic_u = True
        ob = bpy.data.objects.new(f'{name}_c{i}', cd); link(ob)
        bpy.ops.object.select_all(action='DESELECT'); ob.select_set(True); bpy.context.view_layer.objects.active = ob
        bpy.ops.object.convert(target='MESH'); ob = bpy.context.active_object
        solids.append((hole, ob))
    bpy.data.objects.remove(src, do_unlink=True)
    outers = [o for h, o in solids if not h]; holes = [o for h, o in solids if h]
    base = outers[0]
    bpy.context.view_layer.objects.active = base
    for op, objs in (('UNION', outers[1:]), ('DIFFERENCE', holes)):
        for ob in objs:
            m = base.modifiers.new('b', 'BOOLEAN'); m.operation = op; m.object = ob; m.solver = 'EXACT'
            bpy.ops.object.modifier_apply(modifier=m.name)
            bpy.data.objects.remove(ob, do_unlink=True)
    base.name = name
    return base

def text_mesh(name, body, size, x, y, z, mat, group, depth=.012, offset=0., tracking=1.0):
    """duvara dik (site +z'ye bakan) 3B yazı; Cinzel yoksa sistemdeki serif yazı tipi."""
    o = solid_text(name, body, size, depth, tracking, FONT_PATHS)
    o.location = P(x, y, z); o.rotation_euler = (math.pi / 2, 0, 0)
    bpy.ops.object.select_all(action='DESELECT'); o.select_set(True); bpy.context.view_layer.objects.active = o
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.mesh.remove_doubles(threshold=1e-5); bpy.ops.mesh.normals_make_consistent(inside=False)
    bpy.ops.object.mode_set(mode='OBJECT')
    # ön / arka kapak yüzleri: yazı tipi konturunda yönü karışan üçgenleri konuma göre düzelt (ön = site +z = Blender −y)
    bm = bmesh.new(); bm.from_mesh(o.data)
    ys = [v.co.y for v in bm.verts]; y0, y1 = min(ys), max(ys)
    for f in bm.faces:
        fy = [v.co.y for v in f.verts]
        if max(fy) - min(fy) > 1e-5: continue
        want = -1 if abs(fy[0] - y0) < 1e-5 else (1 if abs(fy[0] - y1) < 1e-5 else 0)
        if want and f.normal.y * want < 0: f.normal_flip()
    bm.to_mesh(o.data); bm.free()
    for f in o.data.polygons: f.use_smooth = False
    o.data.materials.clear(); o.data.materials.append(mat)
    world_uv(o, (1., 1.))
    if group is not None: group.append(o)
    return o

def sofa(x, z, yaw_deg=0., length=2.8, tag='Sofa'):
    """alçak modüler kanepe: yüzen siyah kaide, 3 oturum minderi, eğik sırt minderleri, ince kollar, kırlentler."""
    parts = []
    parts.append(box(f'{tag}_plinth', length - .16, .07, .78, 0, .035, .02, M['plinth'], None))
    parts.append(box(f'{tag}_base', length, .16, .96, 0, .15, 0, M['fabric'], None, bevel=.025, seg=3))
    cw = (length - .36) / 3
    for k in range(3):
        parts.append(box(f'{tag}_seat{k}', cw - .012, .17, .74, -length / 2 + .18 + cw * (k + .5), .315, .08, M['fabric'], None, bevel=.065, seg=5))
    for k in range(3):
        b = box(f'{tag}_back{k}', cw - .02, .46, .2, -length / 2 + .18 + cw * (k + .5), .62, -.34, M['fabric'], None, bevel=.08, seg=5)
        rotate_mesh(b, tilt=math.radians(-10)); parts.append(b)
    for sd in (-1, 1):
        parts.append(box(f'{tag}_arm{sd}', .17, .52, .96, sd * (length / 2 - .085), .34, 0, M['fabric'], None, bevel=.05, seg=4))
    for k, (px, mat, ang) in enumerate(((-length / 2 + .45, M['pillow_a'], 12), (-length / 2 + .85, M['pillow_b'], -8), (length / 2 - .5, M['pillow_b'], 6))):
        pl = box(f'{tag}_pillow{k}', .46, .44, .14, px, .62, -.18, mat, None, bevel=.065, seg=6)
        rotate_mesh(pl, yaw=math.radians(ang), tilt=math.radians(-14)); parts.append(pl)
    o = join(parts, 'MTG_' + tag)
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    o.location = P(x, 0, z); o.rotation_euler = (0, 0, math.radians(yaw_deg))
    PLAIN.append(o); return o

def round_table(x, z, r=.52, h=.36, tag='Table'):
    """yuvarlak traverten sehpa (kalın tabla + geri çekik kaide) + kitaplar + bronz heykelcik + vazo."""
    disc_top = cylinder(f'MTG_{tag}_top', r, r, .06, x, h - .06, z, M['travertine'], PLAIN, verts=96, tile=(1.2, 1.2))
    cylinder(f'MTG_{tag}_base', r * .62, r * .62, h - .06, x, 0, z, M['travertine'], PLAIN, verts=96, tile=(1.2, 1.2))
    cylinder(f'MTG_{tag}_shadow', r * .6, r * .6, .012, x, 0, z, M['plinth'], PLAIN, verts=64)
    # kitap yığını (3 sert kapak), hafif dönük
    y = h; bx, bz = x - .16, z + .08
    for k, (w_, d_, t_, m_, a_) in enumerate(((.34, .25, .035, M['book_a'], 8), (.30, .22, .03, M['book_b'], -4), (.27, .2, .025, M['book_c'], 14))):
        b = box(f'MTG_{tag}_book{k}', w_, t_, d_, bx, y + t_ / 2, bz, m_, PLAIN, bevel=.003, seg=1)
        rotate_mesh(b, yaw=math.radians(a_)); y += t_
    # bronz heykelcik: yassı çakıl taşı + üstünde küçük küre (sade, heykelsi)
    bpy.ops.mesh.primitive_uv_sphere_add(segments=48, ring_count=24, radius=.1, location=P(x + .18, h + .045, z - .14))
    pe = bpy.context.active_object; pe.name = f'MTG_{tag}_sculpt'; pe.scale = (1.25, 1.0, .45)
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True); bpy.ops.object.shade_smooth()
    finish(pe, M['bronze_lt'], PLAIN)
    bpy.ops.mesh.primitive_uv_sphere_add(segments=32, ring_count=16, radius=.035, location=P(x + .2, h + .115, z - .13))
    ps = bpy.context.active_object; ps.name = f'MTG_{tag}_sculpt2'; bpy.ops.object.transform_apply(location=True); bpy.ops.object.shade_smooth()
    finish(ps, M['travertine'], PLAIN, tile=(.3, .3))
    anchor(f'MTG_Decor_{tag}_vase', x + .05, h, z - .3, decor='ceramic_vase_01', scale=.8)

def rug(x, z, w, d, tag='Rug'):
    """iki tonlu yün halı: koyu kenar bandı + açık iç alan, 1.2 cm kalınlık, yumuşak köşeler."""
    rounded_slab(f'MTG_{tag}_edge', w, d, .06, .008, x, 0, z, M['rug_edge'], PLAIN)
    rounded_slab(f'MTG_{tag}', w - .16, d - .16, .04, .012, x, 0, z, M['rug'], PLAIN)

def planter(x, z, sc, tag, h=.62, r=.3, plant='potted_plant_02'):
    cylinder(f'MTG_{tag}', r, r + .03, h, x, 0, z, M['planter'], PLAIN, verts=64)
    cylinder(f'MTG_{tag}_soil', r, r, .01, x, h - .02, z, M['soil'], PLAIN, verts=32)
    anchor(f'MTG_Decor_{tag}_plant', x, h - .3, z, yaw=(sum(map(ord, tag)) * 37 % 360) * math.pi / 180, decor=plant, scale=sc)

def ring_pendant(x, z, r=.5, tag='Pendant'):
    """bronz halka sarkıt (iç yüzü ışık), ince askılar."""
    y = H - 1.75
    bpy.ops.mesh.primitive_torus_add(major_radius=r, minor_radius=.018, major_segments=96, minor_segments=12, location=P(x, y, z))
    t = bpy.context.active_object; t.name = f'MTG_{tag}'; bpy.ops.object.transform_apply(location=True); bpy.ops.object.shade_smooth()
    finish(t, M['bronze_lt'], PLAIN)
    disc(f'MTG_{tag}_LED', r + .006, r - .012, y - .019, x, z, M['led'], EMISSIVE)
    for a in (0, 120, 240):
        cylinder(f'MTG_{tag}_wire{a}', .002, .002, 1.75, x + r * math.cos(math.radians(a)), y, z + r * math.sin(math.radians(a)), M['black'], PLAIN, verts=6)

def brand_wall(cx, cy, size, wall_z=None):
    """MTG | MOTORS: fırçalanmış bronz harfler, duvardan 4 cm ayrık, arkadan ışıklı (halo)."""
    zf = (BZ if wall_z is None else wall_z) + .05
    text_mesh('MTG_Brand', 'MTG  |  MOTORS', size, cx, cy, zf + .03, M['brand'], PLAIN, depth=.015, tracking=1.18)
    # halo: harflerin hemen arkasında aynı biçimde ışıklı kopya; önden görünmez, duvara ışık halesi düşürür
    text_mesh('MTG_Brand_Halo', 'MTG  |  MOTORS', size, cx, cy, zf + .018, M['halo'], EMISSIVE, depth=.002, tracking=1.18)

def px_box(name, *a, **k):
    o = box('PX_' + name, *a, **k); PROXY.append(o); return o
def px_plane(name, *a, **k):
    o = plane_h('PX_' + name, *a, **k); PROXY.append(o); return o

SLAB_W, SLAB_D, JOINT = 2.6, 1.3, .004      # ortak zemin plakası ve derz
COVE = .16                                  # tavan çevre gölge boşluğu

# ---------------- HUB: resepsiyon + ana koridor ----------------
# Dünya koordinatı (oda yereli değil): cephe z = 0, resepsiyon z 0 … −10, koridor |x| < 3, z −10 … −62.
# Araç modülleri koridorun iki yanına dizilir (modülün ön yüzü x = ±3'te, koridora bakar).
HUB_XI = 16.35                 # iç yan duvar yüzü (modül derinliği 13 + koridor yarısı 3 + duvar payı)
CW = 3.0                       # koridor yarı genişliği
REC_D = 10.0                   # resepsiyon derinliği
N_ROWS = 4                     # koridor boyunca modül sırası (her sırada sol + sağ modül)
HUB_D = REC_D + 13.0 * N_ROWS  # 62
HUB_W_OUT = HUB_XI + .15

def led_strip(name, x0, x1, z0, z1, y=None, mat=None):
    """tavana gömülü lineer armatür (x veya z boyunca)."""
    return box(name, x1 - x0, .012, z1 - z0, (x0 + x1) / 2, (y if y is not None else H + .05), (z0 + z1) / 2, mat or M['led_line'], EMISSIVE)

def slab_floor(tag, x0, x1, z0, z1, sw, sd):
    """x0 < x1, z0 > z1 (z öne doğru büyür). Plakalar alana tam bölünür."""
    nx, nz = max(1, round((x1 - x0) / sw)), max(1, round((z0 - z1) / sd))
    w, d = (x1 - x0) / nx, (z0 - z1) / nz
    for i in range(nx):
        for j in range(nz):
            m = M['porcelain'] if RNG.random() < .55 else M['porcelain2']
            plane_h(f'{tag}_{i}_{j}', w - JOINT, d - JOINT, x0 + w * (i + .5), 0, z0 - d * (j + .5), m, BAKE['floor'], origin=rand_origin())

def ceil_grid(tag, x0, x1, z0, z1, xs_, zs_, led_x=(), led_z=()):
    """koyu tavan panelleri: xs_/zs_ ızgara çizgileri; ışık hattı olan çizgilerde 8 cm kanal."""
    for i in range(len(xs_) - 1):
        for j in range(len(zs_) - 1):
            xa, xb = max(xs_[i], x0), min(xs_[i + 1], x1)
            za, zb = max(zs_[j + 1], z1), min(zs_[j], z0)
            if xb - xa < .05 or zb - za < .05: continue
            gx = lambda v: .04 if any(abs(v - q) < 1e-6 for q in led_x) else .01
            gz = lambda v: .04 if any(abs(v - q) < 1e-6 for q in led_z) else .01
            if xs_[i] > x0: xa += gx(xs_[i])
            if xs_[i + 1] < x1: xb -= gx(xs_[i + 1])
            if zs_[j + 1] > z1: za += gz(zs_[j + 1])
            if zs_[j] < z0: zb -= gz(zs_[j])
            box(f'{tag}_{i}_{j}', xb - xa, .04, zb - za, (xa + xb) / 2, H + .02, (za + zb) / 2, M['ceil_panel'], BAKE['ceil'], origin=rand_origin())

HUB_LED = []                   # (x0, x1, z0, z1) — ışık alanları için
def build_hub():
    LM_BOUNDS.update(floor=(-HUB_W_OUT, HUB_W_OUT, -HUB_D, 0.), ax=(-HUB_W_OUT, HUB_W_OUT), az=(-REC_D, 0.))
    # --- zemin: resepsiyon 12 × 8 plaka (2.725 × 1.25 m), koridor 2 × 40 plaka (3.0 × 1.3 m) + bronz şeritler
    slab_floor('RecSlab', -HUB_XI, HUB_XI, 0., -REC_D, 2.725, 1.25)
    slab_floor('CorSlab', -CW, CW, -REC_D, -HUB_D, 3.0, 1.3)
    plane_h('Floor_Grout', 2 * HUB_W_OUT, HUB_D, 0, -.002, -HUB_D / 2, M['grout'], DARK)
    for sx in (-1, 1):
        box(f'MTG_Runner_{sx}', .02, .004, HUB_D - REC_D - .4, sx * 2.2, .002, -(REC_D + HUB_D) / 2, M['bronze'], PLAIN)
    # --- resepsiyon arka duvarı (z = −10, koridor ağzının iki yanı): traverten paneller
    for sx in (-1, 1):
        xa, xb = sorted((sx * CW, sx * HUB_XI))
        box(f'RecBack_Core{sx}', xb - xa, WALL_TOP, .02, (xa + xb) / 2, WALL_TOP / 2, -REC_D + .01, M['reveal'], DARK)
        stone_panels(f'RecTrav{sx}', ('z', -REC_D + .02, +1), [(xa, xb, .06, H - .05, 10, 2)], [M['trav_a'], M['trav_b'], M['trav_c']], BAKE['back'])
        box(f'RecSkirt{sx}', xb - xa, .06, .03, (xa + xb) / 2, .03, -REC_D + .03, M['reveal'], DARK)
    # koridor ağzında bronz portal (ince çerçeve, koridorun başladığını vurgular)
    for sx in (-1, 1):
        box(f'MTG_Portal_{sx}', .08, H, .3, sx * (CW - .04), H / 2, -REC_D + .15, M['bronze'], PLAIN)
    # --- resepsiyon yan duvarları (mikro çimento)
    wall_x('RecWall_L', -HUB_XI, +1, -REC_D, 0, 0, WALL_TOP, M['micro'], BAKE['wall_l'])
    wall_x('RecWall_R', HUB_XI, -1, -REC_D, 0, 0, WALL_TOP, M['micro'], BAKE['wall_r'])
    # --- koridor sonu (z = −62): koyu taş vurgu duvarı + büyük marka yazısı
    box('EndCore', 2 * CW + .4, WALL_TOP, .02, 0, WALL_TOP / 2, -HUB_D + .01, M['reveal'], DARK)
    stone_panels('EndDark', ('z', -HUB_D + .02, +1), [(-CW - .2, CW + .2, .06, H - .05, 4, 2)], [M['dark_a'], M['dark_b']], BAKE['back'])
    text_mesh('MTG_EndBrand', 'MTG  |  MOTORS', .36, 0, 3.15, -HUB_D + .05 + .03, M['brand'], PLAIN, depth=.015, tracking=1.18)
    text_mesh('MTG_EndBrand_Halo', 'MTG  |  MOTORS', .36, 0, 3.15, -HUB_D + .05 + .018, M['halo'], EMISSIVE, depth=.002, tracking=1.18)
    box('MTG_End_Line', 2.6, .012, .02, 0, 2.62, -HUB_D + .06, M['bronze'], PLAIN)
    # --- tavan: resepsiyon ızgarası (x boyunca 3 ışık hattı) + koridor (boyuna 2 hat, kenarlarda gizli LED)
    rec_x = [-HUB_XI + 2.725 * k for k in range(13)]
    rec_z = [-1.25 * k for k in range(9)]
    rec_led_z = [-2.5, -5.0, -7.5]
    ceil_grid('RecCeil', -HUB_XI + COVE, HUB_XI - COVE, 0., -REC_D + COVE, rec_x, rec_z, led_z=rec_led_z)
    for i, z in enumerate(rec_led_z):
        led_strip(f'MTG_LED_Rec{i}', -HUB_XI + 2.0, HUB_XI - 2.0, z + .03, z - .03); HUB_LED.append((-HUB_XI + 2.0, HUB_XI - 2.0, z, z))
    cor_x = [-CW, -1.1, 1.1, CW]
    cor_z = [-REC_D - 2.6 * k for k in range(21)]
    ceil_grid('CorCeil', -CW + COVE, CW - COVE, -REC_D, -HUB_D + COVE, cor_x, cor_z, led_x=[-1.1, 1.1])
    for sx in (-1, 1):
        led_strip(f'MTG_LED_Cor{sx}', sx * 1.1 - .03, sx * 1.1 + .03, -REC_D - .3, -HUB_D + .5); HUB_LED.append((sx * 1.1, sx * 1.1, -REC_D - .3, -HUB_D + .5))
        box(f'MTG_LED_CorCove{sx}', .02, .01, HUB_D - REC_D - .4, sx * (CW - COVE + .03), H + .06, -(REC_D + HUB_D) / 2, M['ledSoft'], EMISSIVE)
    plane_h('Ceil_Void', 2 * HUB_W_OUT, HUB_D, 0, H + .09, -HUB_D / 2, M['reveal'], DARK, down=True)
    for nm_, x_, z_, sx_, sz_ in (('B', 0, -REC_D + COVE - .03, 2 * HUB_XI - 2 * COVE, .02),
                                  ('L', -HUB_XI + COVE - .03, -REC_D / 2, .02, REC_D - .2), ('R', HUB_XI - COVE + .03, -REC_D / 2, .02, REC_D - .2)):
        box('MTG_LED_RecCove' + nm_, sx_, .01, sz_, x_, H + .06, z_, M['ledSoft'], EMISSIVE)
    # --- resepsiyon: traverten banko + arkasında marka duvarı (sol), lounge (sağ), büyük bitkiler
    bx, bz = -9.6, -8.0               # banko geride: önde vitrin aracına yer
    box('MTG_Desk', 3.8, 1.05, .9, bx, .525 + .04, bz, M['travertine'], PLAIN, bevel=.012, seg=2, tile=(1.2, 2.4))
    box('MTG_Desk_Plinth', 3.6, .05, .8, bx, .025, bz, M['plinth'], PLAIN)
    box('MTG_Desk_Top', 3.9, .03, 1.0, bx, 1.1, bz - .02, M['dark_a'], PLAIN)
    box('MTG_Desk_LED', 3.5, .01, .02, bx, .05, bz + .41, M['ledSoft'], EMISSIVE)
    brand_wall(bx, 3.0, .34, wall_z=-REC_D)       # resepsiyon arka duvarı (z = −10)
    lx, lz = 9.6, -7.6
    rug(lx, lz, 4.4, 3.2, tag='RecRug')
    sofa(lx, -REC_D + 1.25, 0, 3.0, 'RecSofa')
    anchor('MTG_Decor_RecChair_L', lx - 1.9, 0, lz + .9, yaw=math.radians(140), decor='mid_century_lounge_chair', scale=1.)
    anchor('MTG_Decor_RecChair_R', lx + 1.9, 0, lz + .9, yaw=math.radians(220), decor='mid_century_lounge_chair', scale=1.)
    round_table(lx, lz + .1, tag='RecTable')
    ring_pendant(lx, lz + .1, .6, tag='RecPendant')
    for i, (px_, pz_) in enumerate(((-HUB_XI + .7, -REC_D + .7), (HUB_XI - .7, -REC_D + .7), (-4.6, -1.1), (4.6, -1.1))):
        planter(px_, pz_, 1.6, f'RecPlanter{i}', h=.8, r=.34)
    for i, sx in enumerate((-1, 1)):
        planter(sx * 2.2, -HUB_D + .9, 1.5, f'EndPlanter{i}', h=.8, r=.34)
    # --- vekiller: cam cephe + modüller (koridora açılan vitrinler, iç ışık, zemin, arka duvar)
    build_facade(proxy=True)          # yeni cephe (vitrinler + içe çekilmiş portal) bake'te vekil
    px_plane('Plaza', 60, 30, 0, -.02, 15, M['plinth'], None)
    for sx in (-1, 1):
        px_box(f'ModGlass{sx}', .02, H, HUB_D - REC_D, sx * CW, H / 2, -(REC_D + HUB_D) / 2, M['glass'], None)
        px_plane(f'ModFloor{sx}', 13, HUB_D - REC_D, sx * (CW + 6.5), 0, -(REC_D + HUB_D) / 2, M['porcelain'], None)
        px_plane(f'ModCeil{sx}', 13, HUB_D - REC_D, sx * (CW + 6.5), H, -(REC_D + HUB_D) / 2, M['ceil_panel'], None, down=True)
        px_box(f'ModBack{sx}', .05, H, HUB_D - REC_D, sx * HUB_XI, H / 2, -(REC_D + HUB_D) / 2, M['travertine'], None)
        for r in range(N_ROWS + 1):
            px_box(f'ModSide{sx}_{r}', 13, H, .05, sx * (CW + 6.5), H / 2, -REC_D - 13 * r, M['micro'], None)

def hub_lights():
    for i, (x0, x1, z0, z1) in enumerate(HUB_LED):
        if z0 == z1: area(f'L_HubLine_{i}', (x0 + x1) / 2, H + .03, z0, x1 - x0, .055, 900, '#fff4e6', spread=110, glossy=False)
        else: area(f'L_HubLine_{i}', x0, H + .03, (z0 + z1) / 2, .055, z0 - z1, 1500, '#fff4e6', spread=110, glossy=False)
    area('L_RecCove', 0, H + .02, -REC_D + COVE - .06, 2 * HUB_XI - 2 * COVE, .05, 1100, '#ffeedd', aim=(0, 0, -REC_D + .02), spread=60, glossy=False)
    for sx in (-1, 1):
        area(f'L_CorCove{sx}', sx * (CW - .1), H + .02, -(REC_D + HUB_D) / 2, .05, HUB_D - REC_D - .4, 900, '#ffeedd', aim=(sx * CW, 0, -(REC_D + HUB_D) / 2), spread=60, glossy=False)
        for r in range(N_ROWS):      # modüllerin kendi ışığı (koridora taşar)
            area(f'L_Mod{sx}_{r}', sx * (CW + 6.2), H - .05, -REC_D - 6.5 - 13 * r, 3.9, 7.2, 2400, '#fff6ec', glossy=False)
    area('L_EndWash', 0, H - .05, -HUB_D + .3, 2 * CW, .05, 380, '#ffeedd', aim=(0, 0, -HUB_D + .02), spread=60, glossy=False)
    bpy.ops.object.light_add(type='POINT', location=P(9.6, H - 1.8, -6.3))
    pl = bpy.context.active_object; pl.data.energy = 70; pl.data.color = hexrgb('#ffdcb4'); pl.data.shadow_soft_size = .08


# ---------------- CEPHE (facade): ön cephe, içe çekilmiş giriş portalı, yan cepheler ----------------
# Dünya koordinatı: bina iç cephe çizgisi z = 0, sokak z > 0. Konsept: açık traverten cephe, kolon aksları,
# girişin iki yanında vitrin, derin portal (ceviz tavan alnı + gömme spot), 3B marka harfleri.
FAC_XO = 16.8                  # taş dış yüzü (x)
FAC_FZ = .45                   # ön taş yüzü (z); cam z = 0.2'de taşın içine oturur
FAC_GLZ = 4.4                  # vitrin / portal açıklığının üstü
FAC_TOP = 5.9                  # attika üstü
FAC_COPE = 6.05                # koping üstü
PORT_X = 4.1                   # portal iç yarı genişliği
PORT_Z = -1.6                  # içe çekilmiş giriş cam duvarı
DOOR_HALF = 1.5                # sürgülü açıklık yarı genişliği (net geçiş 3.0 m)
VIT_X0, VIT_X1 = 5.0, 15.9     # vitrin açıklığı (|x|)
M['band'] = emissive('band', '#ffe6c4', 1.6)          # yan cephedeki buzlu ışık bandı

def frame_rect(name, x0, x1, y0, y1, z, mullions, grp, face=.05, depth=.12):
    """bronz profil çerçeve: çevre + ara dikmeler (görünür yüz 5 cm)."""
    box(f'{name}_B', x1 - x0, face, depth, (x0 + x1) / 2, y0 + face / 2, z, M['bronze'], grp)
    box(f'{name}_T', x1 - x0, face, depth, (x0 + x1) / 2, y1 - face / 2, z, M['bronze'], grp)
    for k in range(mullions + 2):
        x = x0 + (x1 - x0) * k / (mullions + 1)
        box(f'{name}_M{k}', face, y1 - y0, depth, min(max(x, x0 + face / 2), x1 - face / 2), (y0 + y1) / 2, z, M['bronze'], grp)

def build_facade(proxy=False):
    """proxy=True: hub bake'i için vekil (dışa aktarılmaz). Aksi halde room_facade.glb içeriği."""
    tmp = []
    G = (lambda k: tmp) if proxy else (lambda k: {'front': BAKE['back'], 'side_px': BAKE['wall_l'], 'side_nx': BAKE['wall_r'],
                                                  'floor': BAKE['floor'], 'ceil': BAKE['ceil'], 'plain': PLAIN, 'emis': EMISSIVE, 'dark': DARK}[k])
    trav = [M['trav_a'], M['trav_b'], M['trav_c']]
    # --- ön cephe taş: aks düzeni |x| 16.8 | 15.9 | 5.0 | 4.1 | 0; derzler kolon kenarlarıyla hizalı
    segs = [(-FAC_XO, -VIT_X1, 1), (-VIT_X1, -VIT_X0, 4), (-VIT_X0, -PORT_X, 1), (-PORT_X, PORT_X, 3),
            (PORT_X, VIT_X0, 1), (VIT_X0, VIT_X1, 4), (VIT_X1, FAC_XO, 1)]
    for i, (a, b, n) in enumerate(segs):
        stone_panels(f'MTG_FacAttic{i}', ('z', 0., +1), [(a, b, FAC_GLZ, FAC_TOP, n, 1)], trav, G('front'), depth=FAC_FZ, gap=.008)
        if n == 1:   # kolonlar (köşe + portal kolonları): üç sıra panel
            stone_panels(f'MTG_FacPier{i}', ('z', 0., +1), [(a, b, 0., FAC_GLZ, 1, 3)], trav, G('front'), depth=FAC_FZ, gap=.008)
            box(f'MTG_FacPierBack{i}', b - a, FAC_GLZ, .02, (a + b) / 2, FAC_GLZ / 2, -.01, M['travertine'], G('plain'), tile=(1.2, 1.2))   # içeriden görünen kolon arkası
            box(f'MTG_FacUplight{i}', .16, .012, .1, (a + b) / 2, .012, FAC_FZ + .3, M['ledSoft'], G('emis'))
    box('MTG_FacAtticBack', 2 * FAC_XO, FAC_TOP - FAC_GLZ, .02, 0, (FAC_GLZ + FAC_TOP) / 2, -.01, M['micro'], G('plain'))
    box('MTG_FacCoping', 2 * FAC_XO + .1, FAC_COPE - FAC_TOP, FAC_FZ + .08, 0, (FAC_TOP + FAC_COPE) / 2, FAC_FZ / 2, M['black'], G('plain'))
    # --- vitrinler: 22 mm cam + bronz çerçeve (3 bölme)
    for sx in (-1, 1):
        x0, x1 = sorted((sx * VIT_X0, sx * VIT_X1))
        box(f'MTG_VitSill{sx}', x1 - x0, .03, FAC_FZ + .02, (x0 + x1) / 2, .015, FAC_FZ / 2 - .01, M['travertine'], G('plain'), tile=(1.2, 1.2))
        box(f'MTG_Glass_Vit{sx}', x1 - x0, FAC_GLZ - .05, .022, (x0 + x1) / 2, .03 + (FAC_GLZ - .05) / 2, .2, M['glass'], G('plain'))
        frame_rect(f'MTG_VitFrame{sx}', x0, x1, .03, FAC_GLZ, .2, 2, G('plain'))
    # --- portal: taş yan yanaklar, ceviz tavan alnı + gömme spotlar, taş zemin, eşik
    for sx in (-1, 1):
        stone_panels(f'MTG_PortRet{sx}', ('x', sx * PORT_X, -sx), [(PORT_Z, FAC_FZ, 0., FAC_GLZ, 1, 3)], trav, G('plain'), depth=.03, gap=.008)
    plane_h('MTG_PortSoffit', 2 * PORT_X, FAC_FZ - PORT_Z, 0, FAC_GLZ, (FAC_FZ + PORT_Z) / 2, M['walnut'], G('ceil'), down=True, tile=(1., 1.))
    for i, x in enumerate((-2.6, 0., 2.6)):
        for j, z in enumerate((-.75, .05)):
            plane_h(f'MTG_PortSpot{i}{j}', .13, .13, x, FAC_GLZ - .004, z, M['led'], G('emis'), down=True)
    plane_h('MTG_PortFloor', 2 * PORT_X, FAC_FZ - PORT_Z, 0, .006, (FAC_FZ + PORT_Z) / 2, M['porcelain'], G('floor'), origin=(-PORT_X, 0, 0))
    plane_h('MTG_Apron', 2 * FAC_XO + .6, 2.75, 0, .008, FAC_FZ + 1.375, M['porcelain'], G('floor'), origin=(-FAC_XO, 0, 0))
    # --- giriş cam duvarı (z = PORT_Z): sabit yan paneller + tepe camı + ray kutusu + zemin rayı (kanatlar kodda kayar)
    zg = PORT_Z
    for sx in (-1, 1):
        x0, x1 = sorted((sx * DOOR_HALF, sx * PORT_X))
        box(f'MTG_Glass_Fixed{sx}', x1 - x0, 3.0, .022, (x0 + x1) / 2, 1.5, zg, M['glass'], G('plain'))
        frame_rect(f'MTG_FixFrame{sx}', x0, x1, 0., 3.0, zg, 0, G('plain'))
    box('MTG_Glass_Transom', 2 * PORT_X, FAC_GLZ - 3.1, .022, 0, (3.1 + FAC_GLZ) / 2, zg, M['glass'], G('plain'))
    box('MTG_TransomBar', 2 * PORT_X, .1, .14, 0, 3.05, zg, M['bronze'], G('plain'))
    box('MTG_TransomTop', 2 * PORT_X, .05, .12, 0, FAC_GLZ - .025, zg, M['bronze'], G('plain'))
    box('MTG_EntryHeader', 2 * PORT_X + .1, H + .2 - FAC_GLZ, .12, 0, (FAC_GLZ + H + .2) / 2, zg - .1, M['micro'], G('plain'))
    box('MTG_DoorRail', 2 * PORT_X - .1, .16, .14, 0, 3.0 - .08, zg - .16, M['black'], G('plain'))      # ray kutusu (iç tarafta)
    box('MTG_FloorTrack', 2 * PORT_X - .1, .004, .03, 0, .007, zg - .16, M['bronze'], G('plain'))
    box('MTG_Threshold', 2 * DOOR_HALF + .2, .012, .3, 0, .009, zg - .05, M['travertine'], G('plain'), tile=(1.2, 1.2))
    for sx in (-1, 1):
        box(f'MTG_Jamb{sx}', .06, FAC_GLZ, .14, sx * (PORT_X - .03), FAC_GLZ / 2, zg, M['bronze'], G('plain'))
    # --- tabela: taşa monte 3B harfler + arka hale ışığı (telefon yok)
    ty = (FAC_GLZ + FAC_TOP) / 2
    text_mesh('MTG_FacBrand', 'MTG  |  MOTORS', .74, 0, ty, FAC_FZ + .035, M['brand'], G('plain'), depth=.03, tracking=1.16)
    text_mesh('MTG_FacBrand_Halo', 'MTG  |  MOTORS', .74, 0, ty, FAC_FZ + .016, M['halo'], G('emis'), depth=.002, tracking=1.16)
    # --- yan cepheler: resepsiyon bölümü taş (sahte pencere yok); her oda ayrı taş kütle + buzlu ışık bandı; aralarda ışık derzi
    for sx in (-1, 1):
        gs = G('side_px') if sx > 0 else G('side_nx')
        xf = sx * FAC_XO
        box(f'FacSideCore{sx}', .02, FAC_TOP, HUB_D + FAC_FZ, xf - sx * .46, FAC_TOP / 2, -(HUB_D - FAC_FZ) / 2, M['reveal'], G('dark'))
        stone_panels(f'MTG_SideRec{sx}', ('x', xf - sx * .45, sx), [(0., FAC_FZ, 0., FAC_TOP, 1, 4), (-REC_D + .15, 0., 0., FAC_GLZ, 4, 3),
                                                                    (-REC_D + .15, 0., FAC_GLZ, FAC_TOP, 4, 1)], trav, gs, depth=.45, gap=.008)
        for r in range(N_ROWS + 1):
            zb = -REC_D - 13.0 * r
            box(f'FacJoint{sx}_{r}', .5, FAC_TOP, .3, xf - sx * .25, FAC_TOP / 2, zb, M['reveal'], G('dark'))
            box(f'MTG_FacJointLED{sx}_{r}', .02, FAC_TOP - .8, .04, xf - sx * .05, (FAC_TOP - .8) / 2 + .4, zb, M['ledSoft'], G('emis'))
            if r == N_ROWS: break
            z0, z1 = zb - 13.0 + .15, zb - .15
            stone_panels(f'MTG_SideMod{sx}_{r}', ('x', xf - sx * .45, sx), [(z0, z1, 0., 3.45, 5, 2), (z0, z1, FAC_GLZ, FAC_TOP, 5, 1)], trav, gs, depth=.45, gap=.008)
            box(f'MTG_SideBand{sx}_{r}', .02, FAC_GLZ - 3.45 - .1, z1 - z0 - .1, xf - sx * .25, (3.45 + FAC_GLZ) / 2, (z0 + z1) / 2, M['band'], G('plain'))
            for y in (3.45, FAC_GLZ):
                box(f'MTG_SideBandFr{sx}_{r}_{y}', .06, .05, z1 - z0, xf - sx * .22, y, (z0 + z1) / 2, M['bronze'], G('plain'))
        box(f'MTG_SideCoping{sx}', .55, FAC_COPE - FAC_TOP, HUB_D + FAC_FZ + .1, xf - sx * .22, (FAC_TOP + FAC_COPE) / 2, -(HUB_D - FAC_FZ) / 2, M['black'], G('plain'))
    box('MTG_FacBack', 2 * FAC_XO, FAC_TOP, .45, 0, FAC_TOP / 2, -HUB_D - .225, M['travertine'], G('plain'), tile=(2.4, 2.4))
    box('MTG_Roof', 2 * FAC_XO, .1, HUB_D, 0, FAC_TOP - .05, -HUB_D / 2, M['black'], G('plain'))
    if proxy:
        for o in tmp:
            o.name = 'PX_' + o.name; PROXY.append(o)
    else:
        LM_BOUNDS.update(floor=(-FAC_XO - .3, FAC_XO + .3, PORT_Z, FAC_FZ + 2.75), ax=(-FAC_XO, FAC_XO), az=(-HUB_D - .5, FAC_FZ + .05), h=FAC_COPE)

def facade_lights():
    # alacakaranlık gökyüzü: cepheye mavi saat ışığı
    bg.inputs['Color'].default_value = (*hexrgb('#8d96a6'), 1); bg.inputs['Strength'].default_value = 2.6
    area('L_SkyFill', 0, 14, 30, 60, 20, 26000, '#c9d6ee', aim=(0, 2, 0), glossy=False)      # akşam göğünün ön cepheye yumuşak dolgusu
    def spot(name, x, y, z, aim, power, size_deg, color='#ffe2bd', blend=.6):
        bpy.ops.object.light_add(type='SPOT', location=P(x, y, z))
        l = bpy.context.active_object; l.name = name; l.data.energy = power; l.data.color = hexrgb(color)
        l.data.spot_size = math.radians(size_deg); l.data.spot_blend = blend; l.data.shadow_soft_size = .05
        d = P(*aim) - l.location; l.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler()
        try: l.visible_glossy = False
        except Exception: pass
        LIGHTS.append(l)
    for i, xc in enumerate((-16.35, -4.55, 4.55, 16.35)):           # kolon diplerinden taşı yalayan yukarı ışık
        spot(f'L_Up{i}', xc, .05, FAC_FZ + .55, (xc, FAC_TOP * .8, FAC_FZ), 1500, 52, blend=.95)
    for i, x in enumerate((-2.6, 0., 2.6)):                           # portal tavanındaki gömme spotlar
        for j, z in enumerate((-.75, .05)):
            spot(f'L_PortSpot{i}{j}', x, FAC_GLZ - .02, z, (x, 0, z), 260, 60, '#ffe6c8', .8)
    for sx in (-1, 1):                                                # vitrinlerin arkasındaki sıcak iç ışık
        area(f'L_VitInt{sx}', sx * 10.4, 4.6, -3.5, 9.5, 5.0, 1800, '#fff0dc', glossy=False)
    area('L_Lobby', 0, 4.6, -5.0, 7.5, 5.0, 380, '#fff0dc', glossy=False)


if not HUB and not FACADE:
    # --- zemin: 2.6 × 1.3 m porselen plakalar, 3 mm derz; altında derz dolgusu ---
    SLAB_W, SLAB_D, JOINT = 2.6, 1.3, .004
    for i in range(int(round(W / SLAB_W))):
        for j in range(int(round(D / SLAB_D))):
            x0, z1 = -W / 2 + SLAB_W * i, -SLAB_D * j
            m = M['porcelain'] if RNG.random() < .55 else M['porcelain2']
            plane_h(f'Slab_{i}_{j}', SLAB_W - JOINT, SLAB_D - JOINT, x0 + SLAB_W / 2, 0, z1 - SLAB_D / 2, m, BAKE['floor'], origin=rand_origin())
    plane_h('Floor_Grout', W, D, 0, -.002, -D / 2, M['grout'], DARK)

    # --- arka duvar ---
    box('Wall_Back_Core', W, WALL_TOP, .02, 0, WALL_TOP / 2, BZ + .01, M['reveal'], DARK)
    box('Back_Skirt_Reveal', W, .06, .03, 0, .03, BZ + .03, M['reveal'], DARK)
    if not LOUNGE:
        # sol: koyu taş marka duvarı (1.35 × 2.36 m paneller) — marka yazısı + duvara gömülü ekran
        stone_panels('Dark', ('z', BZ + .02, +1), [(XL, GLASS_X, .06, H - .05, 5, 2)], [M['dark_a'], M['dark_b']], BAKE['back'])
        # sağ (cam galerinin arkası): güçlü ceviz lamel vurgu duvarı, her 9. lamel bronz
        wx0, wx1 = GLASS_X, XR
        box('Walnut_Back', wx1 - wx0, WALL_TOP, .03, (wx0 + wx1) / 2, WALL_TOP / 2, BZ + .035, M['reveal'], DARK)
        pitch, sw = .07, .042
        n = int((wx1 - wx0 - .02) / pitch); off = (wx1 - wx0 - n * pitch) / 2
        for i in range(n):
            m = M['bronze'] if i % 9 == 4 else M['walnut']
            box(f'Slat_{i}', sw, H, .04, wx0 + off + pitch * (i + .5), H / 2, BZ + .07, m, BAKE['back'] if m is M['walnut'] else PLAIN,
                origin=(wx0 + off + pitch * i, 0, 0))
        # lamel dibinde zemine gömülü ışık kanalı (lamelleri aşağıdan yalar)
        box('Slat_Floor_Chan', wx1 - wx0, .02, .08, (wx0 + wx1) / 2, .01, BZ + .14, M['reveal'], DARK)
        box('MTG_LED_SlatUp', wx1 - wx0 - .1, .01, .02, (wx0 + wx1) / 2, .022, BZ + .13, M['ledSoft'], EMISSIVE)
    else:
        stone_panels('Trav', ('z', BZ + .02, +1), [(XL, XR, .06, H - .05, 10, 2)], [M['trav_a'], M['trav_b'], M['trav_c']], BAKE['back'])

    # --- yan duvarlar (modül: komşu odalarla ortak, kapısız) ---
    wall_x('Wall_L', XL, +1, -D, 0, 0, WALL_TOP, M['micro'], BAKE['wall_l'])
    box('Skirt_L', .012, .04, D, XL + .006, .02, -D / 2, M['reveal'], DARK)
    if not LOUNGE:
        # sağ: traverten paneller (1.3 × 2.36 m), gerçek derz
        wall_x('Wall_R_Core', XR, -1, -D, 0, 0, WALL_TOP, M['reveal'], DARK)
        stone_panels('TravR', ('x', XR, -1), [(-D, 0, .06, H - .05, 10, 2)], [M['trav_a'], M['trav_b'], M['trav_c']], BAKE['wall_r'])
    else:
        wall_x('Wall_R', XR, -1, -D, 0, 0, WALL_TOP, M['micro'], BAKE['wall_r'])
        box('Skirt_R', .012, .04, D, XR - .006, .02, -D / 2, M['reveal'], DARK)

    # --- ön yüz (koridora bakan): yerden tavana cam vitrin + giriş açıklığı + modüller arası taş pilastrlar ---
    # Koridor yerel z = 0 … +6 (karşı odanın camına kadar). Giriş açıklığı solda (kahraman kamerası buradan girer).
    OPEN_X1 = -2.2                                    # açıklık: XL … OPEN_X1, cam: OPEN_X1 … XR
    gx0_, gx1_ = OPEN_X1, XR
    box('MTG_Glass_Vitrine', gx1_ - gx0_, H, .014, (gx0_ + gx1_) / 2, H / 2, .0, M['glass'], PLAIN)
    n_m = 4
    for k in range(n_m + 1):
        xm = gx0_ + (gx1_ - gx0_) * k / n_m
        box(f'MTG_Vitrine_Mullion_{k}', .045 if k == 0 else .035, H, .08, xm, H / 2, .0, M['bronze'], PLAIN)
    box('MTG_Vitrine_Track', gx1_ - gx0_, .006, .06, (gx0_ + gx1_) / 2, .003, .0, M['bronze'], PLAIN)
    # giriş eşiği: zemine gömülü bronz çizgi
    box('MTG_Threshold', OPEN_X1 - XL, .005, .05, (XL + OPEN_X1) / 2, .0025, .0, M['bronze'], PLAIN)
    # modül sınırında taş pilastr (yarısı bu modülde; komşusuyla birleşince 32 cm), koridora 30 cm taşar
    for sx in (-1, 1):
        box(f'MTG_Pier_{sx}', .16, WALL_TOP, .34, sx * (W / 2 - .08), WALL_TOP / 2, .17 - .02, M['travertine'], PLAIN, tile=(1.2, 2.4))
        box(f'MTG_Pier_LED_{sx}', .012, H - .4, .012, sx * (W / 2 - .17), H / 2, .3, M['ledSoft'], EMISSIVE)   # pilastrda dikey ışık çizgisi

    # ---------------- tavan: koyu paneller, derzlere gömülü lineer ışıklar, çevresel gizli LED ----------------
    CH = H
    # lineer ışık hatları (z, x0, x1): araç alanı üstünde 4 hat, cam galeride 2 hat (zemin ızgarasıyla aynı çizgilerde)
    if not LOUNGE:
        LED_LINES = [(-3.9, -4.6, 2.6), (-5.2, -4.6, 2.6), (-6.5, -4.6, 2.6), (-7.8, -4.6, 2.6),
                     (-10.4, GLASS_X + .5, XR - .45), (-11.7, GLASS_X + .5, XR - .45)]
    else:
        LED_LINES = [(-6.5, -4.6, 4.6), (-7.8, -4.6, 4.6), (-9.1, -4.6, 4.6), (-10.4, -4.6, 4.6)]
    LED_Z = sorted({z for z, _, _ in LED_LINES})
    COVE = .16                                       # çevre gölge boşluğu (gizli LED duvarı yalar)
    PX0, PX1, PZ0, PZ1 = XL + COVE, XR - COVE, -D + COVE, 0.
    xs = [-W / 2 + SLAB_W * k for k in range(int(round(W / SLAB_W)) + 1)]
    zs = [-SLAB_D * k for k in range(int(round(D / SLAB_D)) + 1)]
    def inset(line, is_z):
        if is_z and any(abs(line - z) < 1e-6 for z in LED_Z): return .04      # ışık hattı: 8 cm kanal
        return .01                                                              # normal derz: 2 cm
    for i in range(len(xs) - 1):
        for j in range(len(zs) - 1):
            xa, xb = max(xs[i], PX0), min(xs[i + 1], PX1)
            za, zb = max(zs[j + 1], PZ0), min(zs[j], PZ1)
            if xb - xa < .05 or zb - za < .05: continue
            xa += inset(xs[i], False) if xs[i] > PX0 else 0; xb -= inset(xs[i + 1], False) if xs[i + 1] < PX1 else 0
            za += inset(zs[j + 1], True) if zs[j + 1] > PZ0 else 0; zb -= inset(zs[j], True) if zs[j] < PZ1 else 0
            box(f'CeilP_{i}_{j}', xb - xa, .04, zb - za, (xa + xb) / 2, CH + .02, (za + zb) / 2, M['ceil_panel'], BAKE['ceil'], origin=rand_origin())
    plane_h('Ceil_Void', W, D, 0, CH + .09, -D / 2, M['reveal'], DARK, down=True)
    for i, (z, x0, x1) in enumerate(LED_LINES):
        box(f'MTG_LED_{i}', x1 - x0, .012, .06, (x0 + x1) / 2, CH + .05, z, M['led_line'], EMISSIVE)
    # çevre gizli LED (panellerin üstünde, duvara bakan kenarda): görünmez, ışığı duvara düşer
    for nm_, x_, z_, sx_, sz_ in (('B', 0, PZ0 - .03, PX1 - PX0, .02), ('L', PX0 - .03, -D / 2, .02, D - .2), ('R', PX1 + .03, -D / 2, .02, D - .2)):
        box('MTG_LED_Cove' + nm_, sx_, .01, sz_, x_, CH + .06, z_, M['ledSoft'], EMISSIVE)

    # ---------------- araç alanı / cam galeri / oturma köşesi ----------------
    if not LOUNGE:
        # sergi alanı: zemine gömülü koyu taş disk (r 3.0), fırçalanmış çelik kenar, çok ince ışık çizgisi
        disc('MTG_Stage', 3.0, 0, .004, CAR[0], CAR[1], M['stage'], PLAIN)
        disc('MTG_Stage_Rim', 3.035, 3.0, .0045, CAR[0], CAR[1], M['metal'], PLAIN)
        disc('MTG_Stage_LED', 3.052, 3.042, .0045, CAR[0], CAR[1], M['ledRing'], EMISSIVE)
        # cam galeri kutusu: yerden tavana cam (ön + sol yan), bronz ince dikmeler, zemine gömülü ray
        gw = XR - GLASS_X; n_p = 4
        box('MTG_Glass_Front', gw, CH, .012, GLASS_X + gw / 2, CH / 2, GLASS_Z, M['glass'], PLAIN)
        box('MTG_Glass_Side', .012, CH, -GLASS_Z - D + .05, GLASS_X, CH / 2, (GLASS_Z - D + .05) / 2, M['glass'], PLAIN)
        for k in range(n_p + 1):
            xm = GLASS_X + gw * k / n_p
            if k == n_p: break
            box(f'MTG_Mullion_F{k}', .035, CH, .07, xm, CH / 2, GLASS_Z, M['bronze'], PLAIN)
        box('MTG_Mullion_S', .035, CH, .07, GLASS_X, CH / 2, (GLASS_Z - D) / 2, M['bronze'], PLAIN)
        box('MTG_Glass_Track_F', gw, .006, .05, GLASS_X + gw / 2, .003, GLASS_Z, M['bronze'], PLAIN)
        box('MTG_Glass_Track_S', .05, .006, -GLASS_Z - D, GLASS_X, .003, (GLASS_Z - D) / 2, M['bronze'], PLAIN)
        # marka duvarı: yazı + duvara gömülü dijital bilgi ekranı (bronz çerçeve, siyah çerçeve, ekran)
        brand_wall(-3.0, 3.55, .30)
        dx, dy = -5.0, 1.32
        box('MTG_Display_Frame', .74, 2.02, .03, dx, dy, BZ + .065, M['bronze'], PLAIN)
        box('MTG_Display_Bezel', .68, 1.96, .02, dx, dy, BZ + .085, M['black'], PLAIN)
        # oturma köşesi (sağ ön, cam galerinin önünde): halı, kanepe, iki koltuk, sehpa, halka sarkıt, büyük bitki
        LX, LZ = 4.55, -6.4
        rug(LX, LZ, 3.2, 3.5)
        sofa(XR - .62, LZ, -90, 2.8)
        anchor('MTG_Decor_Chair_A', 3.05, 0, LZ + 1.05, yaw=math.radians(115), decor='mid_century_lounge_chair', scale=1.)
        anchor('MTG_Decor_Chair_B', 3.05, 0, LZ - 1.05, yaw=math.radians(65), decor='mid_century_lounge_chair', scale=1.)
        round_table(4.4, LZ)
        ring_pendant(4.4, LZ)
        planter(XR - .55, GLASS_Z + .6, 1.6, 'Planter_A', h=.78, r=.32)
        planter(XL + .55, -.9, 1.25, 'Planter_B', h=.7)
        planter(XL + .55, -D + .65, 1.35, 'Planter_C', h=.7)
        # kodun kullanacağı çapalar
        anchor('MTG_CarSpot', CAR[0], 0, CAR[1], yaw=CAR_YAW, mtg_anchor='car')
        anchor('MTG_SecondCar', (GLASS_X + XR) / 2 + .1, 0, (GLASS_Z - D) / 2 + .05, yaw=math.pi, mtg_anchor='car2')
        anchor('MTG_Display', dx, dy, BZ + .096, mtg_anchor='display', w=.62, h=1.9)
        anchor('MTG_Light', CAR[0], H - .05, CAR[1], mtg_anchor='light', w=7.2, h=3.9)
    else:
        lzc = -D + 4.4
        rug(0, lzc + .2, 4.4, 3.4)
        sofa(0, -D + 2.25, 0, 3.0, 'Sofa')
        anchor('MTG_Decor_Chair_L', -2.0, 0, lzc + 1.0, yaw=math.radians(140), decor='mid_century_lounge_chair', scale=1.)
        anchor('MTG_Decor_Chair_R', 2.0, 0, lzc + 1.0, yaw=math.radians(220), decor='mid_century_lounge_chair', scale=1.)
        round_table(0, lzc + .1)
        ring_pendant(0, lzc + .1, .6)
        brand_wall(0, 3.45, .42)
        # traverten kahve bankosu + tabureler
        bx, bz = W / 2 - 2.3, -D / 2 + .6
        box('MTG_Counter', .9, 1.05, 3.6, bx, .525, bz, M['travertine'], PLAIN, bevel=.02, seg=3, tile=(1.2, 2.4))
        box('MTG_Counter_Plinth', .8, .06, 3.5, bx, .03, bz, M['plinth'], PLAIN)
        box('MTG_Counter_LED', .02, .012, 3.4, bx - .46, .07, bz, M['ledSoft'], EMISSIVE)
        for i, dz in enumerate((-1.0, 0, 1.0)):
            anchor(f'MTG_Decor_Stool_{i}', bx - .95, 0, bz + dz, yaw=math.radians(90), decor='bar_chair_round_01', scale=1.)
        anchor('MTG_Decor_Counter_vase', bx, 1.05, bz - 1.3, decor='brass_vase_02', scale=.9)
        planter(-W / 2 + .8, -D + .8, 1.5, 'Planter_A', h=.78, r=.32)
        planter(W / 2 - .8, -D + .8, 1.5, 'Planter_B', h=.78, r=.32)
        anchor('MTG_Light', 0, H - .05, -8.45, mtg_anchor='light', w=9.2, h=3.9)

    # ---------------- vekiller: komşu odalar, cam cephe, ekran içeriği ----------------
    # Dışa aktarılmazlar (adları PX_). Bake'te ışığın kapıdan komşu odaya taşmasını,
    # önizlemede sitedeki kadrajı doğru göstermek için vardır.
    # koridor (modülün önü, yerel z 0 … +6) + karşı modülün cam vitrini: bake'te koridordan gelen ışık ve yansıma için
    CORR = 6.0
    px_plane('CorrFloor', W, CORR, 0, 0, CORR / 2, M['porcelain'], None, origin=(-W / 2, 0, 0))
    px_plane('CorrCeil', W, CORR, 0, H, CORR / 2, M['ceil_panel'], None, down=True)
    px_box('CorrOppGlass', W - .3, H, .02, 0, H / 2, CORR, M['glass'], None)
    px_box('CorrOppBack', W, H, .05, 0, H / 2, CORR + 6.5, M['travertine'], None, origin=(-W / 2, .06, 0))
    px_plane('CorrOppFloor', W, 6.5, 0, 0, CORR + 3.25, M['porcelain'], None)
    for sx in (-1, 1): px_box(f'CorrOppPier{sx}', .32, H, .34, sx * W / 2, H / 2, CORR - .17, M['travertine'], None)
    if not LOUNGE:
        # ekran içeriği (önizleme için; sitede ilan verisinden canvas ile çizilir)
        scr_img = os.path.join(HERE, 'assets', 'display_preview.png')
        sm = emissive('px_screen', '#ffffff', 1.6)
        if os.path.exists(scr_img):
            nt = sm.node_tree; b = nt.nodes['Principled BSDF']; t = nt.nodes.new('ShaderNodeTexImage'); t.image = img(scr_img)
            nt.links.new(t.outputs['Color'], b.inputs['Emission Color']); nt.links.new(t.outputs['Color'], b.inputs['Base Color'])
            b.inputs['Roughness'].default_value = .12
        scr = px_box('Display_Screen', .62, 1.9, .004, dx, dy, BZ + .097, sm, None)
        me = scr.data; uvl = me.uv_layers[0]
        for poly in me.polygons:          # ekran yüzü: 0..1 UV (doku tam otursun)
            for li in poly.loop_indices:
                co = me.vertices[me.loops[li].vertex_index].co
                uvl.data[li].uv = ((co.x - (dx - .31)) / .62, (co.z - (dy - .95)) / 1.9)
elif HUB:
    build_hub()
else:
    build_facade()

# ---------------- dekor (çapalara içe aktarılır; sadece bake gölgesi + önizleme, dışa aktarılmaz) ----------------
_decor_cache = {}
def import_model(path):
    before = set(bpy.data.objects)
    try:
        bpy.ops.import_scene.gltf(filepath=path)
    except Exception as e:
        for o in set(bpy.data.objects) - before: bpy.data.objects.remove(o, do_unlink=True)
        log('içe aktarılamadı:', os.path.basename(path), str(e).splitlines()[0][:90]); return None
    return [o for o in bpy.data.objects if o not in before]

def decor_sources(name):
    yield os.path.join(REPO, 'models', 'decor', name + '.glb')
    if EXTRA_DECOR:
        yield os.path.join(EXTRA_DECOR, name, name + '.gltf')
        yield os.path.join(EXTRA_DECOR, name + '.glb')

def place_decor(a):
    name = a['decor']
    for path in decor_sources(name):
        if not os.path.exists(path): continue
        objs = import_model(path)
        if not objs: continue
        for o in objs:
            if o.parent is None: o.parent = a
            o.matrix_parent_inverse.identity()
        a.scale = (a.get('scale', 1.),) * 3
        PROXY.extend(objs); return True
    log('dekor bulunamadı, kutu vekil:', name)
    return False

for a in list(ANCHORS):
    if 'decor' in a: place_decor(a)

# ---------------- araç (sadece önizleme + bake gölgesi) ----------------
CAR_MATS = {'blinn1SG': 'paint', 'Windows': 'glass', 'lambert6SG': 'gloss', 'lambert30SG': 'gloss', 'lambert22SG': 'mirror',
            'lambert4SG': 'tire', 'lambert5SG': 'matte', 'lambert7SG': 'rim', 'lambert8SG': 'caliper', 'lambert9SG': 'disc',
            'lambert3SG': 'chrome_dark', 'lambert2SG': 'chrome', 'lambert15SG': 'kidney', 'lambert25SG1': 'chrome_dark',
            # far: lambert10 = dış lens (+ tampon LED şeridi), HeadLights1 = iç gövde/reflektör, 13 = LED, 14 = iç çerçeve
            'lambert10SG': 'hl_lens', 'HeadLights1': 'hl_inner', 'lambert13SG': 'hl_led', 'lambert14SG': 'hl_bezel',
            # stop: dış kırmızı cam + iç parçalar
            'BrakeLights_Glass': 'tail_lens', 'lambert20SG': 'tail_inner', 'lambert21SG': 'tail_led',
            'lambert16SG': 'gloss', 'lambert17SG': 'chrome', 'lambert18SG': 'gloss', 'Plate_Recovered': 'plate'}
def car_kind(nm):
    base = re.sub(r'\.\d+$', '', nm)
    return next((v for k, v in CAR_MATS.items() if base.endswith('_' + k) or base == k), 'interior')

def car_material(kind, paint='#681824'):
    """Önizleme aracı malzemeleri (Cycles). Sitede aynı değerler MeshPhysicalMaterial'e taşınır."""
    key = 'car_' + kind + (paint if kind == 'paint' else '')
    if key in bpy.data.materials: return bpy.data.materials[key]
    m = bpy.data.materials.new(key); m.use_nodes = True
    nt = m.node_tree; b = nt.nodes['Principled BSDF']; I = b.inputs
    geo = nt.nodes.new('ShaderNodeNewGeometry')          # dünya koordinatı (m): ölçekten bağımsız mikro doku
    def setv(**kv):
        for k, v in kv.items(): I[k].default_value = v
    def noise_bump(scale, strength, dist=.001, target='Normal', detail=2.):
        nz = nt.nodes.new('ShaderNodeTexNoise'); nz.inputs['Scale'].default_value = scale; nz.inputs['Detail'].default_value = detail
        nt.links.new(geo.outputs['Position'], nz.inputs['Vector'])
        bp = nt.nodes.new('ShaderNodeBump'); bp.inputs['Strength'].default_value = strength; bp.inputs['Distance'].default_value = dist
        nt.links.new(nz.outputs['Fac'], bp.inputs['Height']); nt.links.new(bp.outputs['Normal'], I[target])
        return nz
    def rough_noise(lo, hi, scale):
        nz = nt.nodes.new('ShaderNodeTexNoise'); nz.inputs['Scale'].default_value = scale
        nt.links.new(geo.outputs['Position'], nz.inputs['Vector'])
        mr = nt.nodes.new('ShaderNodeMapRange'); mr.inputs['To Min'].default_value = lo; mr.inputs['To Max'].default_value = hi
        nt.links.new(nz.outputs['Fac'], mr.inputs['Value']); nt.links.new(mr.outputs['Result'], I['Roughness'])
    if kind == 'paint':
        # metalik baz: koyu kırmızı + ince pul (voronoi → normal sapması), üstte kalın şeffaf cila
        setv(**{'Base Color': (*hexrgb(paint), 1), 'Metallic': .62, 'Roughness': .34, 'Coat Weight': 1., 'Coat Roughness': .025,
                'Coat IOR': 1.5})
        vo = nt.nodes.new('ShaderNodeTexVoronoi'); vo.inputs['Scale'].default_value = 3200.
        nt.links.new(geo.outputs['Position'], vo.inputs['Vector'])
        mix = nt.nodes.new('ShaderNodeMix'); mix.data_type = 'RGBA'; mix.inputs['Factor'].default_value = .12
        mix.inputs[6].default_value = (.5, .5, 1., 1.); nt.links.new(vo.outputs['Color'], mix.inputs[7])
        nm = nt.nodes.new('ShaderNodeNormalMap'); nm.inputs['Strength'].default_value = .5
        nt.links.new(mix.outputs[2], nm.inputs['Color']); nt.links.new(nm.outputs['Normal'], I['Normal'])
        # cila: çok hafif portakal kabuğu (yansımalar cam gibi değil, gerçek boya gibi dalgalansın)
        noise_bump(55., .018, .0004, target='Coat Normal', detail=3.)
        # kenarlara doğru boya biraz koyulaşsın (flop) — layer weight
        lw = nt.nodes.new('ShaderNodeLayerWeight'); lw.inputs['Blend'].default_value = .35
        cr = nt.nodes.new('ShaderNodeMix'); cr.data_type = 'RGBA'
        cr.inputs[6].default_value = (*hexrgb(paint), 1); cr.inputs[7].default_value = (*[c * .35 for c in hexrgb(paint)], 1)
        nt.links.new(lw.outputs['Facing'], cr.inputs['Factor']); nt.links.new(cr.outputs[2], I['Base Color'])
    elif kind == 'glass':
        # hafif füme oto camı: yansıtır, içi seçilir (düz siyah değil)
        setv(**{'Base Color': (.55, .6, .6, 1), 'Roughness': .0, 'Transmission Weight': 1., 'IOR': 1.52})
    elif kind == 'tire':
        # kauçuk: koyu antrasit (saf siyah değil), hafif sheen, pürüzlülük dalgası + ince yüzey dokusu
        setv(**{'Base Color': (*hexrgb('#121212'), 1), 'Specular IOR Level': .3, 'Sheen Weight': .07, 'Sheen Roughness': .7})
        rough_noise(.6, .85, 35.); noise_bump(320., .3, .0006, detail=5.)
    elif kind == 'rim':
        # cilalı gunmetal jant (sitedeki rimColor), şeffaf cila
        setv(**{'Base Color': (*hexrgb('#2b2d31'), 1), 'Metallic': 1., 'Roughness': .2, 'Coat Weight': 1., 'Coat Roughness': .02})
    elif kind == 'disc':
        setv(**{'Base Color': (*hexrgb('#7a7976'), 1), 'Metallic': 1., 'Roughness': .38, 'Anisotropic': .6})
    elif kind == 'caliper':
        setv(**{'Base Color': (*hexrgb('#1f4fd8'), 1), 'Roughness': .3, 'Coat Weight': 1., 'Coat Roughness': .05})
    elif kind == 'chrome_dark':
        setv(**{'Base Color': (*hexrgb('#3b3d40'), 1), 'Metallic': 1., 'Roughness': .14})
    elif kind == 'kidney':
        setv(**{'Base Color': (*hexrgb('#b4b7bb'), 1), 'Metallic': 1., 'Roughness': .16})
    elif kind == 'hl_lens':
        # dış lens: berrak polikarbonat (şeffaf, keskin yansıma) — içerisi görünür
        setv(**{'Base Color': (1, 1, 1, 1), 'Roughness': .0, 'Transmission Weight': 1., 'IOR': 1.49})
    elif kind == 'hl_inner':
        # iç gövde: vakum metalize reflektör + koyu gövde karışımı (krom, hafif mat)
        setv(**{'Base Color': (*hexrgb('#a7abb0'), 1), 'Metallic': 1., 'Roughness': .1, 'Anisotropic': .4})
    elif kind == 'hl_led':
        # LED modülleri: kapalı far ama hafif ışık alan beyaz difüzör (gündüz farı izlenimi, çok düşük)
        setv(**{'Base Color': (*hexrgb('#eef3ff'), 1), 'Roughness': .3, 'Emission Color': (*hexrgb('#e8f0ff'), 1), 'Emission Strength': 1.6})
    elif kind == 'hl_bezel':
        setv(**{'Base Color': (*hexrgb('#0a0a0b'), 1), 'Roughness': .18, 'Coat Weight': .6})
    elif kind == 'tail_lens':
        setv(**{'Base Color': (*hexrgb('#b3141c'), 1), 'Roughness': .02, 'Transmission Weight': .92, 'IOR': 1.49})
    elif kind == 'tail_inner':
        setv(**{'Base Color': (*hexrgb('#3c1013'), 1), 'Metallic': 1., 'Roughness': .18})
    elif kind == 'tail_led':
        setv(**{'Base Color': (*hexrgb('#5e0a0e'), 1), 'Roughness': .3, 'Emission Color': (*hexrgb('#ff2a1f'), 1), 'Emission Strength': .35})
    elif kind == 'chrome':
        setv(**{'Base Color': (*hexrgb('#9a9da1'), 1), 'Metallic': 1., 'Roughness': .07})
    elif kind == 'mirror':
        setv(**{'Base Color': (*hexrgb('#d8dadc'), 1), 'Metallic': 1., 'Roughness': .02})
    elif kind == 'gloss':
        setv(**{'Base Color': (*hexrgb('#060607'), 1), 'Roughness': .12, 'Coat Weight': 1., 'Coat Roughness': .03})
    elif kind == 'matte':
        # tampon / hava girişi: dokulu mat plastik (ince tanecik), parlak siyahtan net ayrılır
        setv(**{'Base Color': (*hexrgb('#121213'), 1), 'Specular IOR Level': .4}); rough_noise(.52, .68, 30.); noise_bump(900., .2, .0003)
    elif kind == 'headlight':
        # far: krom reflektör + üstünde kalın şeffaf lens hissi (metal + kalın cila)
        setv(**{'Base Color': (*hexrgb('#8f959b'), 1), 'Metallic': .8, 'Roughness': .16, 'Coat Weight': 1., 'Coat Roughness': .0, 'Coat IOR': 1.55})
    elif kind == 'taillight':
        # stop: koyu kırmızı renkli cam, içten hafif derinlik
        setv(**{'Base Color': (*hexrgb('#8c0d12'), 1), 'Roughness': .04, 'Transmission Weight': .65, 'IOR': 1.5,
                'Coat Weight': 1., 'Coat Roughness': .0})
    elif kind == 'plate':
        setv(**{'Base Color': (*hexrgb('#e6e6e4'), 1), 'Roughness': .35, 'Coat Weight': .5})
    else:   # iç mekân: deri / plastik
        setv(**{'Base Color': (*hexrgb('#1b1a1a'), 1), 'Specular IOR Level': .4}); rough_noise(.45, .65, 20.)
    return m

def place_car(spot, yaw, paint='#681824', tag='Car'):
    """önizleme aracı: uzun kenar x'e, ön +x (sitedeki prepareCarModel), sonra yaw; zemine oturur."""
    if not os.path.exists(CAR_GLB): log('araç modeli yok:', CAR_GLB); return None
    objs = import_model(CAR_GLB)
    if not objs: return None
    meshes = [o for o in objs if o.type == 'MESH' and not any(s.material and s.material.name == 'Material' for s in o.material_slots)]
    for o in objs:
        if o.type == 'MESH' and o not in meshes: o.hide_render = True
    for o in meshes:
        for s in o.material_slots:
            nm = s.material.name if s.material else ''
            kind = car_kind(nm)
            s.material = car_material(kind, paint)
    bpy.context.view_layer.update()
    mn = Vector((1e9,) * 3); mx = -mn
    for o in meshes:
        for c in o.bound_box:
            w = o.matrix_world @ Vector(c); mn = Vector(map(min, mn, w)); mx = Vector(map(max, mx, w))
    size = mx - mn; ctr = (mn + mx) / 2
    root = bpy.data.objects.new(f'PX_{tag}Root', None); link(root)
    pivot = bpy.data.objects.new(f'PX_{tag}Pivot', None); link(pivot); pivot.parent = root
    for o in objs:
        if o.parent is None: o.parent = pivot; o.matrix_parent_inverse.identity()
    long_y = size.y > size.x
    L = max(size.x, size.y); s = 4.77 / L
    pivot.scale = (s,) * 3
    pivot.location = (-ctr.x * s, -ctr.y * s, -mn.z * s)
    root.rotation_euler = (0, 0, (math.pi / 2 if long_y else 0) + yaw)
    root.location = P(spot[0], .0045 if spot == CAR else 0., spot[1])   # lastik tabanı tam yüzeyde (havada durmasın)
    PROXY.extend(objs + [root, pivot]); CAR_OBJS.extend(objs)
    if tag == 'Car': CAR_MAIN.extend(objs)
    log(f'{tag} yerleşti, boy %.2f m' % (L * s))
    return root

CAR_OBJS, CAR_MAIN = [], []
if not LOUNGE and not HUB and not FACADE:
    place_car(CAR, CAR_YAW)
    c2 = bpy.data.objects['MTG_SecondCar']
    place_car((c2.location.x, -c2.location.y), c2.rotation_euler.z, paint='#34373c', tag='Car2')   # cam arkasında grafit ikinci araç

# ---------------- ışıklar (bake + önizleme) ----------------
world = bpy.data.worlds.new('MTG_Dusk'); scene.world = world; world.use_nodes = True
bg = world.node_tree.nodes['Background']; bg.inputs['Color'].default_value = (*hexrgb('#2c3546'), 1); bg.inputs['Strength'].default_value = .25
LIGHTS = []
def area(name, x, y, z, sx, sz, power, color='#fff3e6', aim=None, spread=180, glossy=True):
    """alan ışığı. glossy=False → yalnız aydınlatır, yansımada görünmez (yansımayı gerçek armatür yüzeyi verir)."""
    bpy.ops.object.light_add(type='AREA', location=P(x, y, z))
    l = bpy.context.active_object; l.name = name
    l.data.shape = 'RECTANGLE'; l.data.size = sx; l.data.size_y = sz
    l.data.energy = power; l.data.color = hexrgb(color); l.data.spread = math.radians(spread)
    if aim is not None:
        d = P(*aim) - l.location; l.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler()
    for attr, val in (('visible_camera', False), ('visible_glossy', glossy)):
        try: setattr(l, attr, val)
        except Exception: pass
    LIGHTS.append(l); return l

if not HUB and not FACADE:
    # 1) derz ışıkları: lineer armatürlerin gerçek aydınlatması. Yansımayı armatürün kendisi (MTG_LED) verir.
    for i, (z, x0, x1) in enumerate(LED_LINES):
        gallery = (not LOUNGE) and z < GLASS_Z
        area(f'L_Line_{i}', (x0 + x1) / 2, CH + .03, z, x1 - x0, .055, 300 if gallery else 480, '#fff4e6', spread=110, glossy=False)
    # 2) çevre gizli LED: duvarları yukarıdan sıyırır (traverten, koyu taş, ceviz, mikro çimento)
    area('L_Cove_B', 0, CH + .02, PZ0 - .06, PX1 - PX0, .05, 650, '#ffeedd', aim=(0, 0, -D + .02), spread=60, glossy=False)
    area('L_Cove_L', PX0 - .06, CH + .02, -D / 2, .05, D - .3, 380, '#ffeedd', aim=(XL + .02, 0, -D / 2), spread=60, glossy=False)
    area('L_Cove_R', PX1 + .06, CH + .02, -D / 2, .05, D - .3, 520, '#ffeedd', aim=(XR - .02, 0, -D / 2), spread=60, glossy=False)
    if not LOUNGE:
        cx_, cz_ = CAR
        # 3) ana ışık (key): aracın üstünde, hafif önden — büyük, yumuşak, yansımada görünmez
        area('L_Key', cx_ - .6, CH - .05, cz_ + .9, 5.2, 3.0, 950, '#fff3e4', aim=(cx_, 0, cz_ - .2), spread=95, glossy=False)
        # 4) dolgu (fill): cephe tarafından, göz hizasının üstünde, çok yumuşak ve düşük
        area('L_Fill', cx_ - 2.5, 2.4, -.6, 6., 2.4, 260, '#f2f0ec', aim=(cx_, .7, cz_), spread=120, glossy=False)
        # 5) yansıma kartları: kameradan görünmez, kaportada geniş ve yumuşak gradyan yansıma (stüdyo softbox)
        #    – omuz çizgisini ve kapı yüzeylerini tanımlar; düşük yoğunluk: patlamaz
        area('L_Card_L', cx_ - 4.8, 1.05, cz_ + 1.2, 6.0, 1.1, 85, '#fffaf2', aim=(cx_, .55, cz_), spread=70)   # göğüs hizası: kapıya yansır, ön cama değil
        area('L_Card_T', cx_ + 1.6, CH - .3, cz_ - 1.4, 2.6, .9, 28, '#fffaf2', aim=(cx_, 0, cz_), spread=70)
        # 6) kenar (rim) ışıkları: arkadan alçak, araç siluetini zeminden ayırır
        area('L_Card_S', cx_ + 1.9, .95, cz_ + 2.9, 5.2, .9, 55, '#fffaf2', aim=(cx_, .55, cz_), spread=60)   # kapı boyunca yumuşak yansıma bandı
        area('L_Rim_R', cx_ + 3.6, 1.5, cz_ - 3.2, 2.6, .5, 110, '#ffe9d0', aim=(cx_, .7, cz_), spread=45)
        area('L_Rim_B', cx_ - 1.2, 1.2, cz_ - 4.4, 3.0, .6, 110, '#fff1e2', aim=(cx_, .5, cz_), spread=60)
        # ışık bağlama: yansıma kartları ve kenar ışıkları yalnız ana araca etki eder
        # (cam galeri, zemin ve duvarlar bunları yansıtmaz → sahnede "görünmez stüdyo ışığı" izi kalmaz)
        try:
            rc = bpy.data.collections.new('MTG_CarReceivers')
            for o in CAR_MAIN: rc.objects.link(o)
            for nm in ('L_Card_L', 'L_Card_T', 'L_Card_S', 'L_Rim_R', 'L_Rim_B'):
                bpy.data.objects[nm].light_linking.receiver_collection = rc
        except Exception as e:
            log('ışık bağlama yok (Blender < 4.0?), kartlar her yüzeye etki eder:', str(e)[:60])
        area('L_SlatUp', (GLASS_X + XR) / 2, .03, BZ + .13, XR - GLASS_X - .1, .03, 140, '#ffdcb0', aim=((GLASS_X + XR) / 2, H, BZ + .1), spread=50, glossy=False)
        # cam galerideki ikinci araç: tepeden tek yumuşak ışık (arka hacim daha karanlık, katmanlı)
        c2 = bpy.data.objects['MTG_SecondCar'].location
        area('L_Car2', c2.x, CH - .05, -c2.y, 4.6, 2.0, 380, '#fff1e0', spread=100, glossy=False)
        pend = (4.4, -6.4)
    else:
        pend = (0, -D + 4.5)
    bpy.ops.object.light_add(type='POINT', location=P(pend[0], H - 1.8, pend[1]))
    pl = bpy.context.active_object; pl.name = 'L_Pendant'; pl.data.energy = 60; pl.data.color = hexrgb('#ffdcb4'); pl.data.shadow_soft_size = .08; LIGHTS.append(pl)
    try: pl.visible_glossy = False          # camda / boyada parlak küre yansıması bırakmasın
    except Exception: pass
    # koridor (vekil): boyuna iki lineer hat + karşı modülün ışığı (gerçek sahnedeki gibi koridor aydınlık)
    for i, zc in enumerate((1.6, 4.4)):
        area(f'L_Corr_{i}', 0, H - .02, zc, W - .4, .05, 420, '#fff4e6', spread=110, glossy=False)
    area('L_CorrOpp', 0, H - .05, CORR + 4.5, 7.2, 3.9, 2000, '#fff6ec', glossy=False)
elif HUB:
    hub_lights()
else:
    facade_lights()

# ---------------- render ayarları ----------------
scene.render.engine = 'CYCLES'
scene.cycles.device = 'CPU'
scene.cycles.samples = SAMPLES
scene.cycles.use_denoising = True
try: scene.cycles.denoiser = 'OPENIMAGEDENOISE'
except Exception: pass
scene.cycles.max_bounces = 6
scene.cycles.caustics_reflective = scene.cycles.caustics_refractive = False
scene.view_settings.view_transform = 'AgX'
try: scene.view_settings.look = 'AgX - Medium High Contrast'
except Exception: pass
scene.view_settings.exposure = -1.45
scene.cycles.filter_width = 1.6          # biraz yumuşak örnekleme: dijital keskinlik yerine fotoğraf yumuşaklığı
scene.cycles.max_bounces = 8; scene.cycles.glossy_bounces = 6; scene.cycles.transmission_bounces = 8
def setup_post():
    """çok hafif bloom (Fog Glow) + çok hafif vinyet. Blender 5.x'te derleyici API'si farklıysa atlanır."""
    try:
        scene.use_nodes = True; nt = scene.node_tree
        for n in list(nt.nodes): nt.nodes.remove(n)
        rl = nt.nodes.new('CompositorNodeRLayers'); comp = nt.nodes.new('CompositorNodeComposite')
        gl = nt.nodes.new('CompositorNodeGlare'); gl.glare_type = 'FOG_GLOW'; gl.quality = 'HIGH'
        gl.mix = -.93; gl.threshold = 1.2; gl.size = 8
        nt.links.new(rl.outputs['Image'], gl.inputs['Image'])
        # vinyet: elips maske → bulanık → çarp
        em = nt.nodes.new('CompositorNodeEllipseMask'); em.width = .92; em.height = .86
        bl = nt.nodes.new('CompositorNodeBlur'); bl.size_x = bl.size_y = 260; bl.use_relative = False
        nt.links.new(em.outputs['Mask'], bl.inputs['Image'])
        mr = nt.nodes.new('CompositorNodeMapRange'); mr.inputs['To Min'].default_value = .86; mr.inputs['To Max'].default_value = 1.
        nt.links.new(bl.outputs['Image'], mr.inputs['Value'])
        mul = nt.nodes.new('CompositorNodeMixRGB'); mul.blend_type = 'MULTIPLY'; mul.inputs[0].default_value = 1.
        nt.links.new(gl.outputs['Image'], mul.inputs[1]); nt.links.new(mr.outputs['Value'], mul.inputs[2])
        nt.links.new(mul.outputs['Image'], comp.inputs['Image'])
    except Exception as e:
        log('post-process atlandı:', str(e)[:80])

def render_view(name, pos, look, vfov=40., res=None):
    res = res or RES
    cd = bpy.data.cameras.new(name); cd.sensor_fit = 'VERTICAL'; cd.angle_y = math.radians(vfov)
    cam = bpy.data.objects.new(name, cd); link(cam)
    cam.location = P(*pos); d = P(*look) - cam.location
    cam.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler()
    scene.camera = cam
    scene.render.resolution_x, scene.render.resolution_y = res
    scene.render.filepath = os.path.join(OUT, f'preview_{VARIANT}_{name}.png')
    bpy.ops.render.render(write_still=True)
    log('önizleme', scene.render.filepath)

VIEWS = {
    'car': {   # kamera durağı: (araç.x − 3.6, 1.6, araç.z + 5.3)
        'bmw':     ((CAR[0] - 3.6, 1.6, CAR[1] + 5.3), (CAR[0] + .2, .75, CAR[1] - .4), 40),      # 1) ön 3/4 kahraman (sitedeki durak)
        'side':    ((CAR[0] + 3.2, 1.15, CAR[1] + 6.4), (CAR[0] - .4, .72, CAR[1] - .3), 46),    # 2) yandan geniş
        'lounge':  ((5.6, 1.4, -3.4), (-1.6, .85, -7.6), 50),                                   # 3) lounge + araç
        'detail':  ((-2.85, .78, -3.05), (-2.05, .48, -4.9), 30),                               # 4) far + ön jant yakın
        'wide':    ((5.4, 1.7, -.5), (-2.2, 1.45, -10.5), 54),
        'gallery': ((-2.6, 1.5, -3.2), (3.4, 1.2, -11.2), 46),
        'brand':   ((.8, 1.6, -5.6), (-3.4, 2.3, -13), 48),
        'overview': ((-3.0, 2.2, 2.4), (-1.2, .8, -7.0), 52),                                 # koridordan oda + araç
    },
    'lounge': {
        'wide':   ((-1.0, 1.7, 1.5), (0.6, 1.4, -13), 54),
        'bar':    ((-2.5, 1.5, -3.5), (4.2, 1.0, -6.0), 46),
    },
    'facade': {
        'ext34':  ((-31, 9.5, 33), (1, 2.4, -16), 36),
        'front':  ((0, 1.7, 24), (0, 3.0, 0), 38),
        'portal': ((0.3, 1.75, 6.0), (0, 1.65, -8), 44),
        'detail': ((-2.2, 1.6, 2.6), (1.0, 2.8, 0.4), 50),
        'side':   ((-34, 2.0, -20), (-16, 2.5, -30), 40),
    },
    'hub': {
        'reception': ((-2.0, 1.7, -2.4), (3.0, 1.4, -14), 60),
        'entry':     ((3.0, 1.7, -8.5), (-1.0, 1.8, 0.5), 58),
        'corridor':  ((0.4, 1.62, -12.5), (0, 1.4, -62), 50),
        'desk':      ((-4.5, 1.6, -2.2), (-9.6, 1.6, -9.5), 52),
    },
}[VARIANT]

def run_previews():
    setup_post()
    keys = PREVIEW_ONLY.split(',') if PREVIEW_ONLY else list(VIEWS)
    for k in keys:
        if k in VIEWS:
            pos, look, fov = VIEWS[k]; render_view(k, pos, look, fov)

# ---------------- lightmap bake ----------------
import numpy as np

def join_group(objs, name):
    objs = [o for o in objs if o.type == 'MESH']
    o = objs[0] if len(objs) == 1 else join(objs, name)
    o.name = name
    for uv in list(o.data.uv_layers):           # yalnız UVMap (doku) + lightmap kalsın
        if uv.name not in ('UVMap', 'lightmap'): o.data.uv_layers.remove(uv)
    return o

def planar_lm(objs, fn, facing=None):
    """lightmap UV: site koordinatından düzlemsel izdüşüm. fn(x, y, z) → (u, v).
    facing: izdüşüm yönü (site). Bu yöne sırtını dönen yüzler hiç görünmez (duvara yaslı arka yüzler);
    silinir — aksi halde ön yüzle aynı UV'ye düşüp lightmap'i karartırlar."""
    for obj in objs:
        me = obj.data
        if 'lightmap' not in me.uv_layers: me.uv_layers.new(name='lightmap')
        bm = bmesh.new(); bm.from_mesh(me); l = bm.loops.layers.uv['lightmap']
        if facing:
            R = obj.matrix_world.to_3x3(); fv = P(*facing)
            dead = [f for f in bm.faces if (R @ f.normal).dot(fv) < -.5]
            bmesh.ops.delete(bm, geom=dead, context='FACES')
        for f in bm.faces:
            for lp in f.loops:
                co = obj.matrix_world @ lp.vert.co
                lp[l].uv = fn(co.x, co.z, -co.y)
        bm.to_mesh(me); bm.free()

# duvar atlası: +z'ye bakan duvarlar (x boyunca), +x'e bakanlar ve −x'e bakanlar (z boyunca) alt alta
ATLAS_G = .02
def atlas_uv(row):
    ax0, ax1 = LM_BOUNDS['ax']; az0, az1 = LM_BOUNDS['az']
    HT = LM_BOUNDS.get('h', WALL_TOP)
    if 'h' in LM_BOUNDS:      # cephe: uzun-alçak yüzeyler → her satır kendi genişliğine yayılır (anizotrop texel)
        su = (1 - 2 * ATLAS_G) / ((ax1 - ax0) if row == 0 else (az1 - az0)); sv = (1 - 4 * ATLAS_G) / (3 * HT)
    else:
        su = sv = min((1 - 2 * ATLAS_G) / max(ax1 - ax0, az1 - az0), (1 - 4 * ATLAS_G) / (3 * HT))
    def f(x, y, z):
        a = (x - ax0) if row == 0 else (z - az0)
        return (ATLAS_G + a * su, ATLAS_G * (row + 1) + HT * sv * row + y * sv)
    return f

def bake(obj, size, label):
    """Yalnız ışık (doğrudan + dolaylı yayılı, albedo hariç) → lightmap UV. Ham float döner."""
    image = bpy.data.images.new('LM_' + label, size[0], size[1], float_buffer=True)
    nodes = []
    for slot in obj.material_slots:
        nt = slot.material.node_tree
        n = nt.nodes.new('ShaderNodeTexImage'); n.image = image; nt.nodes.active = n; nodes.append((nt, n))
    bpy.ops.object.select_all(action='DESELECT'); obj.select_set(True); bpy.context.view_layer.objects.active = obj
    scene.cycles.samples = BAKE_SAMPLES
    scene.render.bake.margin = 6
    t = time.time()
    bpy.ops.object.bake(type='DIFFUSE', pass_filter={'DIRECT', 'INDIRECT'}, uv_layer='lightmap', margin=6, use_clear=True)
    for nt, n in nodes: nt.nodes.remove(n)
    px = np.array(image.pixels[:], dtype=np.float32).reshape(size[1], size[0], 4)[..., :3]
    log(f'bake {label} {size[0]}x{size[1]} {time.time() - t:.0f}s, ort {px.mean():.3f}')
    return px

def denoise(rgb):
    """Bake gürültüsünü temizle: 3×3 medyan (tek parlak benekler) + ağırlıklı 5×5 bulanıklaştırma
    (UV kenarı taşmasını bake margin'i karşılar)."""
    st = np.stack([np.roll(np.roll(rgb, dy, 0), dx, 1) for dy in (-1, 0, 1) for dx in (-1, 0, 1)])
    rgb = np.median(st, axis=0)
    k = np.array([1, 4, 6, 4, 1], np.float32); k /= k.sum()
    for ax in (0, 1):
        rgb = sum(np.roll(rgb, s, axis=ax) * w for s, w in zip(range(-2, 3), k))
    return rgb

def save_lm(rgb, scale, fname):
    enc = np.clip(rgb / scale, 0, 1) ** (1 / 2.2)         # sRGB'ye yakın; kodda colorSpace = SRGB
    h, w = enc.shape[:2]
    im = bpy.data.images.new(fname, w, h, alpha=False)
    im.pixels = np.concatenate([enc, np.ones((h, w, 1), np.float32)], axis=2).ravel().tolist()
    path = os.path.join(OUT, fname)
    im.filepath_raw = path
    try:
        im.file_format = 'WEBP'; im.save()
    except Exception:
        path = path.rsplit('.', 1)[0] + '.png'; im.filepath_raw = path; im.file_format = 'PNG'; im.save()
    log('kaydedildi', os.path.basename(path)); return os.path.basename(path)

def full_build():
    # pişirilen mimari: zemin, duvarlar (taş / ceviz lamel / mikro çimento), tavan
    # mobilya / dekor gölge verir ama kendi lightmap'i yoktur; araçlar gizlenir (turda 360° döner)
    fx0, fx1, fz0, fz1 = LM_BOUNDS['floor']
    flat = lambda x, y, z: ((x - fx0) / (fx1 - fx0), (z - fz0) / (fz1 - fz0))
    planar_lm(BAKE['floor'], flat)
    planar_lm(BAKE['back'], atlas_uv(0), facing=(0, 0, 1))
    planar_lm(BAKE['wall_l'], atlas_uv(1), facing=(1, 0, 0))
    planar_lm(BAKE['wall_r'], atlas_uv(2), facing=(-1, 0, 0))
    planar_lm(BAKE['ceil'], flat, facing=(0, -1, 0))
    floor = join_group(BAKE['floor'], 'MTG_Floor')
    arch = join_group(BAKE['back'] + BAKE['wall_l'] + BAKE['wall_r'], 'MTG_Walls')
    ceil = join_group(BAKE['ceil'], 'MTG_Ceiling')
    PLAIN.append(join_group(DARK, 'MTG_Reveals'))
    for o in CAR_OBJS: o.hide_render = True
    # cephe: cam, içeriden gelen ışığı kostik beneklerle taşır → bake'te cam yok sayılır (ışık serbest geçer)
    glass_off = [o for o in scene.objects if FACADE and o.type == 'MESH' and any(sl.material and 'glass' in sl.material.name for sl in o.material_slots)]
    for o in glass_off: o.hide_render = True
    # ince LED / difüzör yüzeyleri bake'te parlama noktası (firefly) üretir; ışığı zaten alan ışıkları taşır
    emis = []
    for m in bpy.data.materials:
        b = m.node_tree.nodes.get('Principled BSDF') if m.use_nodes else None
        if b and b.inputs['Emission Strength'].default_value > 0:
            emis.append((b, b.inputs['Emission Strength'].default_value)); b.inputs['Emission Strength'].default_value = 0.
    scene.cycles.sample_clamp_indirect = 2.
    scene.cycles.sample_clamp_direct = 0.
    scene.cycles.blur_glossy = 1.          # zeminin parlak yansımasından gelen kostik benekleri yumuşat

    res = {}
    res['floor'] = denoise(bake(floor, (LM, LM), 'floor'))
    res['walls'] = denoise(bake(arch, (LM, LM), 'walls'))
    res['ceiling'] = denoise(bake(ceil, (LM // 2, LM // 2), 'ceiling'))
    # ortak ölçek: zemin ve duvarların %99.7'lik parlaklığı → 1.0 (tüm haritalar aynı birimde)
    scale = float(max(np.percentile(res['floor'].max(axis=2), 99.7), np.percentile(res['walls'].max(axis=2), 99.7))) or 1.
    name = f'room_{VARIANT}'
    for key, obj in (('floor', floor), ('walls', arch), ('ceiling', ceil)):
        obj['lightmap'] = save_lm(res[key], scale, f'{name}_lm_{key}.webp')
        obj['lmScale'] = scale
    for o in CAR_OBJS + glass_off: o.hide_render = False
    for b, v in emis: b.inputs['Emission Strength'].default_value = v
    scene.cycles.sample_clamp_indirect = 10.
    return [floor, arch, ceil]

def export(baked):
    # dışa aktarılanlar: adı MTG_ ile başlayan mimari, mobilya, ışık şeritleri ve çapalar (dekor/araç vekilleri hariç)
    for o in PROXY:
        try: bpy.data.objects.remove(o, do_unlink=True)
        except ReferenceError: pass
    bpy.ops.object.select_all(action='DESELECT')
    for o in scene.objects:
        if o.name.startswith('MTG_') and o.type in ('MESH', 'EMPTY'): o.select_set(True)
    path = os.path.join(OUT, f'room_{VARIANT}.glb')
    kw = dict(filepath=path, export_format='GLB', use_selection=True, export_extras=True, export_yup=True,
              export_apply=True, export_lights=False, export_cameras=False, export_texcoords=True, export_normals=True,
              export_image_format='WEBP')
    # sürümler arası seçenek farkları: tanınmayan seçeneği atıp yeniden dene (4.2 ↔ 5.x)
    for _ in range(len(kw)):
        try: bpy.ops.export_scene.gltf(**kw); break
        except TypeError as e:
            bad = next((k for k in list(kw) if k != 'filepath' and k in str(e)), None)
            if not bad: raise
            log('dışa aktarım seçeneği bu sürümde yok, atlandı:', bad); kw.pop(bad)
    log('GLB', path, '%.1f MB' % (os.path.getsize(path) / 1e6))
    json.dump({'variant': VARIANT, 'W': W, 'D': D, 'H': H, 'door': [DOOR_W, DOOR_H, DOOR_Z], 'car': CAR,
               'lightbox': LIGHTBOX, 'blender': bpy.app.version_string},
              open(os.path.join(OUT, f'room_{VARIANT}.json'), 'w'), indent=1)

if MODE == 'preview':
    run_previews()
elif MODE == 'full':
    baked = full_build()
    run_previews()
    if '--save-blend' in argv: bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT, f'room_{VARIANT}.blend'))
    export(baked)
log('bitti')
