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
SIG = VARIANT == 'signature'      # ilk BMW salonu: MTG MOTORS Signature Gallery
LIGHTBOX = (1.02, -D + 3.8, 4.6, 4.2) if LOUNGE else (CAR[0], CAR[1], 7.2, 4.2)

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

def slab_floor(tag, x0, x1, z0, z1, sw, sd, mat=None, group=None, y=0., joint=None):
    """x0 < x1, z0 > z1 (z öne doğru büyür). Plakalar alana tam bölünür."""
    nx, nz = max(1, round((x1 - x0) / sw)), max(1, round((z0 - z1) / sd))
    w, d = (x1 - x0) / nx, (z0 - z1) / nz
    jt = JOINT if joint is None else joint
    for i in range(nx):
        for j in range(nz):
            m = mat or (M['porcelain'] if RNG.random() < .55 else M['porcelain2'])
            plane_h(f'{tag}_{i}_{j}', w - jt, d - jt, x0 + w * (i + .5), y, z0 - d * (j + .5), m, group if group is not None else BAKE['floor'], origin=rand_origin())

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
HUB_SPOTS = []                 # koridor gömme spotları (x, z)
def build_hub():
    LM_BOUNDS.update(floor=(-HUB_W_OUT, HUB_W_OUT, -HUB_D, 0.), ax=(-HUB_W_OUT, HUB_W_OUT), az=(-REC_D, 0.))
    # --- zemin: resepsiyon 12 × 8 plaka (2.725 × 1.25 m), koridor 2 × 40 plaka (3.0 × 1.3 m) + bronz şeritler
    # sıcak fildişi mermer, büyük plaka (3.0 × 1.5), 2 mm derz; cilalı (sitede altında Reflector)
    M['hub_floor'] = pbr('hub_floor', 'ivory_marble', '#ffffff', rough=.18, normal=.3, coat=.45, coat_rough=.05)
    TILE['hub_floor'] = (3.0, 3.0)
    slab_floor('RecSlab', -HUB_XI, HUB_XI, 0., -REC_D, 2.725, 1.25, mat=M['hub_floor'], joint=.002)
    slab_floor('CorSlab', -CW, CW, -REC_D, -HUB_D, 3.0, 1.3, mat=M['hub_floor'], joint=.002)
    # modül sınırlarında enine bronz kakma (koridor ritmi) + resepsiyon çevresinde bronz bordür
    for r in range(N_ROWS + 1):
        box(f'MTG_RunnerX_{r}', 4.4, .004, .02, 0, .002, -REC_D - 13.0 * r, M['bronze'], PLAIN)
    for nm_, sx_, sz_, cx_, cz_ in (('F', 2 * HUB_XI - 1.2, .02, 0, -.6), ('B', 2 * HUB_XI - 1.2, .02, 0, -REC_D + .6),
                                    ('L', .02, REC_D - 1.2, -HUB_XI + .6, -REC_D / 2), ('R', .02, REC_D - 1.2, HUB_XI - .6, -REC_D / 2)):
        box(f'MTG_RecInlay_{nm_}', sx_, .004, sz_, cx_, .002, cz_, M['bronze'], PLAIN)
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
    # --- resepsiyon yan duvarları: traverten paneller + ortada dikey ceviz çıta bölümü (LED derzli)
    for sx, grp in ((-1, BAKE['wall_l']), (1, BAKE['wall_r'])):
        xw = sx * HUB_XI
        wall_x(f'RecWall_Core{sx}', xw, -sx, -REC_D, 0, 0, WALL_TOP, M['reveal'], DARK)
        stone_panels(f'RecTravS{sx}', ('x', xw, -sx), [(-REC_D, -6.2, .06, H - .05, 3, 2), (-3.8, 0, .06, H - .05, 3, 2)],
                     [M['trav_a'], M['trav_b'], M['trav_c']], grp)
        zs_ = [-6.2 + .075 * (k + .5) for k in range(int(2.4 / .075))]
        for k, zc_ in enumerate(zs_):
            box(f'RecSlat{sx}_{k}', .04, H, .045, xw - sx * .04, H / 2, zc_, M['walnut'], grp, origin=(0, 0, zc_))
        for z_ in (-6.2, -3.8):
            box(f'RecLed{sx}_{z_:.0f}_Chan', .03, H - .3, .05, xw - sx * .015, H / 2, z_, M['reveal'], DARK)
            box(f'MTG_LED_RecW{sx}_{abs(z_):.0f}', .01, H - .3, .012, xw - sx * .03, H / 2, z_, M['ledSoft'], EMISSIVE)
    # --- koridor sonu (z = −62): koyu taş vurgu duvarı + büyük marka yazısı
    box('EndCore', 2 * CW + .4, WALL_TOP, .02, 0, WALL_TOP / 2, -HUB_D + .01, M['reveal'], DARK)
    stone_panels('EndDark', ('z', -HUB_D + .02, +1), [(-CW - .2, CW + .2, .06, H - .05, 2, 2)], [M['marble']], BAKE['back'], depth=.03, gap=.004)
    for sx in (-1, 1):
        box(f'MTG_EndFrame{sx}', .04, H - .1, .06, sx * (CW + .2), H / 2, -HUB_D + .08, M['champagne'], PLAIN)
    text_mesh('MTG_EndBrand', 'MTG  |  MOTORS', .36, 0, 3.15, -HUB_D + .05 + .03, M['champagne'], PLAIN, depth=.015, tracking=1.18)
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
        # ritmik gömme spotlar: kenar panellerde 2.6 m arayla (vitrin önlerini ve zemindeki bronz çizgiyi yalar)
        for k in range(20):
            z_ = -REC_D - 1.3 - 2.6 * k
            for o_ in (disc(f'MTG_CorSpot{sx}_{k}', .055, 0, H - .001, sx * 2.25, z_, M['led'], EMISSIVE, n=24),
                       disc(f'MTG_CorSpotRim{sx}_{k}', .075, .055, H - .0012, sx * 2.25, z_, M['bronze'], PLAIN, n=24)):
                for f_ in o_.data.polygons: f_.flip()
            HUB_SPOTS.append((sx * 2.25, z_))
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
        planter(sx * 2.2, -HUB_D + .9, 1.5, f'EndPlanter{i}', h=.8, r=.34, plant='potted_plant_04')
    # modül sınırlarında (taş pilastrların önünde) koyu taş saksılarda bitkiler: koridora ritim ve doğal katman
    for r in range(1, N_ROWS):
        for sx in (-1, 1):
            planter(sx * 2.3, -REC_D - 13.0 * r, 1.3, f'CorPlanter{r}{sx}', h=.62, r=.26, plant='potted_plant_02' if (r + sx) % 2 else 'potted_plant_04')
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
    area('L_EndWash', 0, H - .05, -HUB_D + .3, 2 * CW, .05, 520, '#ffe6c8', aim=(0, 0, -HUB_D + .02), spread=60, glossy=False)
    for i, (x_, z_) in enumerate(HUB_SPOTS):          # gömme spotlar: zeminde yumuşak ışık havuzları (ritim)
        bpy.ops.object.light_add(type='SPOT', location=P(x_, H - .02, z_))
        l_ = bpy.context.active_object; l_.name = f'L_CorSpot{i}'; l_.data.energy = 140; l_.data.color = hexrgb('#ffe2bd')
        l_.data.spot_size = math.radians(48); l_.data.spot_blend = .7; l_.data.shadow_soft_size = .05; l_.rotation_euler = (0, 0, 0)
        try: l_.visible_glossy = False
        except Exception: pass
        LIGHTS.append(l_)
    for sx in (-1, 1):                                  # resepsiyon ceviz bölümleri: üstten yıkama
        area(f'L_RecSlat{sx}', sx * (HUB_XI - .25), H - .05, -5.0, .05, 2.4, 260, '#ffd6a0', aim=(sx * HUB_XI, 1.2, -5.0), spread=45, glossy=False)
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

def frame_rect(name, x0, x1, y0, y1, z, mullions, grp, face=.035, depth=.12):
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
    # vitrin üstünde bronz kanal + yukarı bakan LED: attika taşını aşağıdan sıyırır (gece cephe vurgusu)
    for sx in (-1, 1):
        x0, x1 = sorted((sx * VIT_X0, sx * VIT_X1))
        box(f'MTG_FacGrazerCh{sx}', x1 - x0, .05, .08, (x0 + x1) / 2, FAC_GLZ + .025, FAC_FZ + .04, M['bronze'], G('plain'))
        box(f'MTG_LED_FacGrazer{sx}', x1 - x0 - .1, .008, .03, (x0 + x1) / 2, FAC_GLZ + .054, FAC_FZ + .045, M['ledSoft'], G('emis'))
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
    M['paver'] = pbr('paver', 'pearl_porcelain', '#ffffff', rough=.55, normal=.4, coat=.08, coat_rough=.25)       # açık sıcak gri taş plak
    M['hedge'] = pbr('hedge', 'velour_velvet', '#27401f', rough=.95, normal=1.6, use_map=False)                      # yaprak dokusu: normal ile
    M['bark'] = pbr('bark', None, '#3a2f26', rough=.85)
    M['paver_dark'] = pbr('paver_dark', 'anthracite_stone', '#ffffff', rough=.3, normal=.3, coat=.25, coat_rough=.1)  # giriş halısı / bordür bandı
    TILE['paver'] = (2.4, 2.4); TILE['paver_dark'] = (2.4, 2.4)
    plane_h('MTG_PortFloor', 2 * PORT_X, FAC_FZ - PORT_Z, 0, .006, (FAC_FZ + PORT_Z) / 2, M['paver_dark'], G('floor'), origin=(-PORT_X, 0, 0))
    # plaza: 1.2 × 0.6 taş plaklar (bina önü → bordür); girişin önünde koyu taş "giriş halısı" + bronz çerçeve + zemine gömülü LED çizgiler
    PZ0, PZ1, CARPET = FAC_FZ, 9.25, 3.4
    if not proxy:
        slab_floor('MTG_Plaza', -FAC_XO - .3, -PORT_X, PZ1, PZ0, 1.2, .6, mat=M['paver'], group=G('floor'), y=.008, joint=.004)
        slab_floor('MTG_PlazaR', PORT_X, FAC_XO + .3, PZ1, PZ0, 1.2, .6, mat=M['paver'], group=G('floor'), y=.008, joint=.004)
        slab_floor('MTG_PlazaC', -PORT_X, PORT_X, PZ1, PZ0 + CARPET, 1.2, .6, mat=M['paver'], group=G('floor'), y=.008, joint=.004)
        slab_floor('MTG_Carpet', -PORT_X, PORT_X, PZ0 + CARPET, PZ0, 1.37, 1.13, mat=M['paver_dark'], group=G('floor'), y=.008, joint=.003)
        slab_floor('MTG_CurbBand', -FAC_XO - .3, FAC_XO + .3, 9.85, PZ1, 1.2, .6, mat=M['paver_dark'], group=G('floor'), y=.008, joint=.004)
        for sx in (-1, 1):
            box(f'MTG_CarpetEdge{sx}', .025, .004, CARPET, sx * PORT_X, .01, PZ0 + CARPET / 2, M['champagne'], G('plain'))
            box(f'MTG_LED_Path{sx}', .03, .006, CARPET - .3, sx * (PORT_X - .55), .011, PZ0 + CARPET / 2 + .1, M['ledSoft'], G('emis'))
        box('MTG_CarpetEdgeF', 2 * PORT_X + .03, .004, .025, 0, .01, PZ0 + CARPET, M['champagne'], G('plain'))
        box('MTG_Curb', 2 * FAC_XO + .6, .15, .25, 0, .075, 9.975, M['travertine'], G('plain'), tile=(1.2, 1.2))
    else:
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
        # portal ağzında bronz çerçeve (taş yüzünden 2 cm taşar) + yanakta gizli dikey LED (kapıyı sıcak ışıkla çerçeveler)
        box(f'MTG_PortFrame{sx}', .07, FAC_GLZ + .07, .05, sx * (PORT_X + .035), (FAC_GLZ + .07) / 2, FAC_FZ + .025, M['bronze'], G('plain'))
        box(f'MTG_LED_PortV{sx}', .012, FAC_GLZ - .3, .012, sx * (PORT_X - .015), FAC_GLZ / 2, FAC_FZ - .2, M['ledSoft'], G('emis'))
    box('MTG_PortFrameT', 2 * PORT_X + .14, .07, .05, 0, FAC_GLZ + .035, FAC_FZ + .025, M['bronze'], G('plain'))
    box('MTG_LED_PortH', 2 * PORT_X - .3, .012, .012, 0, FAC_GLZ - .015, FAC_FZ - .2, M['ledSoft'], G('emis'))
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
    if not proxy:
        # vitrin önünde alçak traverten saksılar (bitki + gizli yukarı ışık), köşelerde ağaç saksıları
        for sx in (-1, 1):
            for j, xc in enumerate((7.6, 13.4)):
                x_ = sx * xc
                box(f'MTG_FacPlanter{sx}_{j}', 3.2, .48, .7, x_, .24 + .008, FAC_FZ + .75, M['travertine'], G('plain'), tile=(1.2, 1.2), bevel=.01, seg=2)
                box(f'MTG_FacPlanterSoil{sx}_{j}', 3.06, .01, .56, x_, .48, FAC_FZ + .75, M['soil'], G('plain'))
                for k, dx in enumerate((-1.0, 0., 1.0)):        # budanmış şimşir: üç yumuşak blok, hafif yükseklik farkı
                    rounded_slab(f'MTG_FacHedge{sx}_{j}_{k}', .98, .5, .16, .42 + .05 * ((j + k) % 2), x_ + dx, .48, FAC_FZ + .75, M['hedge'], G('plain'), seg=6)
                box(f'MTG_LED_FacPlanter{sx}_{j}', 3.0, .008, .02, x_, .5, FAC_FZ + .42, M['ledSoft'], G('emis'))
            # köşelerde top budanmış ağaç (koyu bronz saksı, ince gövde, küresel taç): temiz, mimari peyzaj
            cylinder(f'MTG_FacTreePot{sx}', .62, .55, .62, sx * 17.75, .008, 3.2, M['bronze'], G('plain'), verts=48)
            cylinder(f'MTG_FacTreeTrunk{sx}', .06, .045, 2.1, sx * 17.75, .6, 3.2, M['bark'], G('plain'), verts=12)
            bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=4, radius=1.0, location=P(sx * 17.75, 3.35, 3.2))
            cn = bpy.context.active_object; cn.name = f'MTG_FacTreeCrown{sx}'; cn.scale = (1.0, 1.0, .92)
            bpy.ops.object.transform_apply(location=True, scale=True); bpy.ops.object.shade_smooth(); finish(cn, M['hedge'], G('plain'))
            # bordür boyunca alçak aydınlatma babaları (bronz gövde + ışık yarığı)
            for k in range(5):
                x_ = sx * (6.0 + 2.6 * k)
                cylinder(f'MTG_Bollard{sx}_{k}', .085, .085, .78, x_, .008, 8.85, M['bronze'], G('plain'), verts=24)
                cylinder(f'MTG_LED_Bollard{sx}_{k}', .087, .087, .05, x_, .66, 8.85, M['ledSoft'], G('emis'), verts=24)
            # sokak lambası: ince koyu bronz direk + lineer armatür (yola ve kaldırıma)
            cylinder(f'MTG_LampPole{sx}', .06, .075, 6.6, sx * 12.4, .008, 9.55, M['bronze'], G('plain'), verts=20)
            box(f'MTG_LampArm{sx}', .08, .06, 1.5, sx * 12.4, 6.55, 9.55 + .7, M['bronze'], G('plain'))
            box(f'MTG_LampHead{sx}', .18, .07, .9, sx * 12.4, 6.5, 9.55 + 1.2, M['bronze'], G('plain'))
            box(f'MTG_LED_LampHead{sx}', .14, .006, .82, sx * 12.4, 6.462, 9.55 + 1.2, M['led'], G('emis'))
    box('MTG_Roof', 2 * FAC_XO, .1, HUB_D, 0, FAC_TOP - .05, -HUB_D / 2, M['black'], G('plain'))
    if proxy:
        for o in tmp:
            o.name = 'PX_' + o.name; PROXY.append(o)
    else:
        LM_BOUNDS.update(floor=(-FAC_XO - .3, FAC_XO + .3, PORT_Z, 9.9), ax=(-FAC_XO, FAC_XO), az=(-HUB_D - .5, FAC_FZ + .05), h=FAC_COPE)

def facade_lights():
    # alacakaranlık gökyüzü: cepheye mavi saat ışığı
    # gece (mavi saatin sonu): gök ışığı düşük ve serin, cepheyi sıcak yapay ışıklar taşır (lüks marka filmi kontrastı)
    bg.inputs['Color'].default_value = (*hexrgb('#1c2536'), 1); bg.inputs['Strength'].default_value = .9
    area('L_SkyFill', 0, 14, 30, 60, 20, 6500, '#9fb2d6', aim=(0, 2, 0), glossy=False)       # gece göğünün ön cepheye çok hafif dolgusu
    def spot(name, x, y, z, aim, power, size_deg, color='#ffe2bd', blend=.6):
        bpy.ops.object.light_add(type='SPOT', location=P(x, y, z))
        l = bpy.context.active_object; l.name = name; l.data.energy = power; l.data.color = hexrgb(color)
        l.data.spot_size = math.radians(size_deg); l.data.spot_blend = blend; l.data.shadow_soft_size = .05
        d = P(*aim) - l.location; l.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler()
        try: l.visible_glossy = False
        except Exception: pass
        LIGHTS.append(l)
    for i, xc in enumerate((-16.35, -4.55, 4.55, 16.35)):           # kolon diplerinden taşı yalayan yukarı ışık
        spot(f'L_Up{i}', xc, .05, FAC_FZ + .55, (xc, FAC_TOP * .8, FAC_FZ), 2200, 48, blend=.95)
    for i, x in enumerate((-2.6, 0., 2.6)):                           # portal tavanındaki gömme spotlar
        for j, z in enumerate((-.75, .05)):
            spot(f'L_PortSpot{i}{j}', x, FAC_GLZ - .02, z, (x, 0, z), 260, 60, '#ffe6c8', .8)
    for sx in (-1, 1):                                                # vitrinlerin arkasındaki sıcak iç ışık
        area(f'L_VitInt{sx}', sx * 10.4, 4.6, -3.5, 9.5, 5.0, 3200, '#ffe6c4', glossy=False)        # içeriden taşan sıcak ışık
    area('L_Lobby', 0, 4.6, -5.0, 7.5, 5.0, 380, '#fff0dc', glossy=False)
    # giriş: portal yanaklarındaki dikey LED'ler + üst kenar, giriş halısındaki zemin çizgileri
    for sx in (-1, 1):
        area(f'L_PortV{sx}', sx * (PORT_X - .05), FAC_GLZ / 2, FAC_FZ - .2, .04, FAC_GLZ - .4, 260, '#ffd9a8', aim=(0, FAC_GLZ / 2, FAC_FZ - .2), spread=90, glossy=False)
        area(f'L_Path{sx}', sx * (PORT_X - .55), .06, FAC_FZ + 1.8, .05, 3.0, 45, '#ffdcb0', aim=(sx * (PORT_X - .55), 2, FAC_FZ + 1.8), spread=120, glossy=False)
        for j, xc in enumerate((7.6, 13.4)):            # saksılardan bitkilere ve cepheye yukarı ışık
            spot(f'L_Planter{sx}{j}', sx * xc, .52, FAC_FZ + .42, (sx * xc, 3.0, FAC_FZ), 220, 70, '#ffdcb0', .9)
        spot(f'L_Tree{sx}', sx * 17.75, .66, 3.2 + .7, (sx * 17.75, 3.4, 3.2), 420, 55, '#ffdcb0', .9)
        for k in range(5):                               # babalar: zeminde küçük sıcak ışık havuzları
            bpy.ops.object.light_add(type='POINT', location=P(sx * (6.0 + 2.6 * k), .66, 8.85))
            b_ = bpy.context.active_object; b_.name = f'L_Bollard{sx}{k}'; b_.data.energy = 9; b_.data.color = hexrgb('#ffcf96'); b_.data.shadow_soft_size = .05
            LIGHTS.append(b_)
        area(f'L_Lamp{sx}', sx * 12.4, 6.42, 9.55 + 1.2, .14, .8, 900, '#ffe8cc', spread=140, glossy=False)
    area('L_PortH', 0, FAC_GLZ - .05, FAC_FZ - .2, 2 * PORT_X - .4, .04, 320, '#ffd9a8', spread=90, glossy=False)
    for sx in (-1, 1):                                    # attika sıyırıcı ışıklar
        xc = sx * (VIT_X0 + VIT_X1) / 2
        area(f'L_Grazer{sx}', xc, FAC_GLZ + .07, FAC_FZ + .06, VIT_X1 - VIT_X0 - .2, .04, 900, '#ffdcb0', aim=(xc, FAC_TOP + 2, FAC_FZ - .05), spread=35, glossy=False)


# ---------------- CAM GEÇİŞ: aynı sıradaki komşu odalar arasında yan duvarda açıklık + cam panel ----------------
# Oda yereli: açıklık z −3.75 … −0.7 (3.05 m), yanında cam panel z −5.35 … −3.85; yükseklik 3.4 m. Sol (XL) ve sağ (XR)
# duvarlarda aynı z'de: komşu modüller paylaşılan duvarda birebir hizalanır. Kapalı uçta site 'MTG_PortalFill_*' gösterir.
PORTAL = (-5.35, -.7, 0., 3.4)                # duvar deliği (za, zb, ya, yb)
PORTAL_OPEN = (-3.75, -.7)                    # yürünebilir açıklık
PORTAL_FILLS = []                             # bake sırasında gizlenir (geçiş açıkken ışık komşuya akar)
def portal(side, fill_mat):
    x = XL if side < 0 else XR
    tag = 'L' if side < 0 else 'R'
    za, zb, ya, yb = PORTAL
    wt = .3                                    # duvar kalınlığı (iki modülün yarısı); kasa duvarı boydan boya sarar
    xc = x + (-side) * 0.0                     # duvar düzlemi
    br = M['bronze']
    for nm_, zc_, w_ in (('JambA', za + .04, .08), ('Mull', -3.8, .1), ('JambB', zb - .04, .08)):
        box(f'MTG_Portal{tag}_{nm_}', wt, yb, w_, xc, yb / 2, zc_, br, PLAIN)
    box(f'MTG_Portal{tag}_Head', wt, .1, zb - za, xc, yb + .05, (za + zb) / 2, br, PLAIN)
    box(f'MTG_Portal{tag}_Sill', wt, .004, PORTAL_OPEN[1] - PORTAL_OPEN[0], xc, .002, sum(PORTAL_OPEN) / 2, M['champagne'] if 'champagne' in M else br, PLAIN)
    box(f'MTG_Glass_Portal{tag}', .012, yb - .02, -3.85 - za - .08, xc, yb / 2, (za + .08 - 3.85) / 2, M['glass'], PLAIN)
    box(f'MTG_Portal{tag}_GlassRail', wt, .04, -3.85 - za, xc, .02, (za - 3.85) / 2, br, PLAIN)
    f = box(f'MTG_PortalFill_{tag}', .06, yb, zb - za, xc - side * .03, yb / 2, (za + zb) / 2, fill_mat, PLAIN)
    PORTAL_FILLS.append(f)
    # vekil komşu oda (bake: açıklıktan sızan ışık + cam arkasında derinlik); dışa aktarılmaz
    cx = side * W
    px_plane(f'NbFloor{tag}', W, D, cx, 0, -D / 2, M['porcelain'], None)
    px_plane(f'NbCeil{tag}', W, D, cx, H, -D / 2, M['ceil_panel'], None, down=True)
    px_box(f'NbBack{tag}', W, H, .05, cx, H / 2, -D, M['travertine'], None)
    px_box(f'NbFar{tag}', .05, H, D, cx + side * W / 2, H / 2, -D / 2, M['micro'], None)

# ---------------- SIGNATURE GALLERY: ilk BMW salonu (oda yereli, modül 13 × 13, ön yüz z = 0) ----------------
# Konsept: koyu grafit taş zemin + aracın altında cilalı sergileme alanı (şampanya çerçeve), arka duvarda koyu mermer
# marka duvarı (3B şampanya harfler + PRIVATE COLLECTION, arkadan hale), iki yanda LED derzli ceviz çıtalar, sağda bronz
# çerçeveli cam bölmenin ardında "private vault" (ceviz lamel + arkadan ışıklı raflar), koyu mat tavanda araç üstü
# stüdyo ışık paneli, VIP lounge (deri kanepe, konyak koltuklar, mermer sehpa, çift halka avize).
SIG_YAW = -1.283                 # sitedeki PREM_YAW: araç önü (0.28, 0.96) → koridora ve sağa dönük
# glTF'ye birebir aktarılan PBR: doku doğrudan renk / pürüzlülük / normal girişine bağlı (ara düğüm yok; tools/make_marble.py)
# ---------------- ODA TEMALARI: ortak plan (zemin ızgarası, marka duvarı, vault, cam geçişler, kamera kadrajı) aynı;
# malzeme, ışık karakteri, tavan kurgusu, duvar detayı ve lounge her araç için ayrı. Ortak dil: MTG MOTORS harfleri +
# PRIVATE COLLECTION, cilalı sergileme alanı, gizli LED derzler, PBR taş/ahşap/metal, sıcak-kontrollü ışık.
#   floor/inlay/brand/stone/wood: doku klasörü (textures/), slab: zemin plaka ölçüsü (m), feature: duvar detayı
#   (slats ahşap çıta | planks geniş ahşap | fins metal kanat | fluted taş yiv), ceiling: tavan kurgusu, stage: sergileme alanı
#   accent: metal vurgu (çerçeve/raf/harf kasası), dark: koyu metal (dikme/kayıt), letters: (renk, ışıma rengi, ışıma)
#   light: bake ışık karakteri (renk + yoğunluklar), lounge: mobilya tipi
THEMES = {
    'sport': dict(      # BMW 420i Edition M Sport — çağdaş özel galeri: honlanmış grafit traverten zemin, antrasit taş sergileme
                        # alanı, doğal koyu taş marka duvarı, antrasit sıva, ölçülü koyu meşe paneller, ince şampanya metal, nötr ışık.
                        # Dekor sade: koltuk, saksı bitkisi, dijital ekran ve halka avize yok (araç tek odak)
        title='Sport Coupé Collection',
        floor=('graphite_travertine', .44, .04), slab=(3.25, 1.625), inlay=('anthracite_stone', .4, .1), stage='slab',
        brand='bmw_slab', brand_rough=.62, brand_coat=0., brand_grid=(4, 1, .006), vault_frame=(.025, .04), frame='#1c1c1d', stone='charcoal_plaster', wood='dark_oak', feature='planks',
        accent='#c9b893', dark='#34312d', ceil='#191919', ceiling='softbox', led='#f6f4f0', display=False,
        letters=('#d6c9ad', '#f4efe6', .8), halo=8.,
        light=dict(col='#f7f5f2', key=1700, slot=520, cove=420, brand=520, wash=420, world=('#18191b', .12)),
        lounge=dict(sofa=('black_leather', '#ffffff'), chairs=None, table='slab', pend='none',
                    rug=('#1a1a1a', '#3a3a3a'), plant=None)),
    'suv': dict(        # Ford Kuga — güçlü, doğal, sakin: mat sıcak grafit zemin, koyu grafit sergileme alanı, damarsız toprak gri taş
                        # levhalar (4 büyük panel), kömür sıva, koyu meşe paneller, ince koyu metal vitrin, nötr ışık; dekor sade
        title='Explorer SUV Lounge',
        floor=('warm_graphite', .46, .04), slab=(1.625, 1.625), inlay=('urban_dark', .42, .06), stage='slab',
        brand='kuga_slab', brand_rough=.62, brand_coat=0., brand_grid=(4, 1, .006), vault_frame=(.025, .04), frame='#1c1c1d',
        stone='charcoal_plaster', wood='dark_oak', feature='planks', display=False,
        accent='#c2ad85', dark='#2f2c28', ceil='#1b1a19', ceiling='beams', led='#f6f2ea',
        letters=('#d8c8a6', '#f2ead8', .8), halo=6.,
        light=dict(col='#f6f3ee', key=1900, slot=0, cove=460, brand=520, wash=440, world=('#19191a', .12)),
        lounge=dict(sofa=('fabric_grey', '#3a3836'), chairs=None, table='slab', pend='none',
                    rug=('#1c1b1a', '#3c3a37'), plant=None)),
    'urban': dict(      # VW Golf — şehirli, modern, derin; orman yeşili mermer, siyah meşe nervürler, pirinç, lineer ışık
        title='Urban Collection',
        floor=('urban_dark', .26, .3), slab=(2.6, 1.3), inlay=('verde_marble', .14, .6), stage='slab',
        brand='verde_marble', stone='forest_plaster', wood='black_oak', feature='ribs',
        accent='#c9a96a', dark='#2f2a22', ceil='#1b1e1c', ceiling='linear', led='#fff0dc',
        letters=('#d9bd84', '#ffd79a', 1.3), halo=16.,
        light=dict(col='#fff1df', key=0, slot=0, line=500, cove=460, brand=900, wash=520, world=('#161a18', .12)),
        lounge=dict(sofa=('fabric_grey', '#3b3f3c'), chairs='modern_arm_chair_01', table='modern_coffee_table_01', pend='bar',
                    rug=('#1f2421', '#4b524d'), plant='potted_plant_02')),
    'dynamic': dict(    # SEAT Ateca — genç, enerjik, şehirli; koyu beton + terracotta + bakır kanatlar, geometrik tavan
        title='Dynamic City Collection',
        floor=('concrete_dark', .3, .25), slab=(2.6, 2.6), inlay=('anthracite_stone', .2, .45), stage='slab',
        brand='anthracite_stone', stone='concrete_dark', wood=None, feature='fins', fin_bg='terracotta_plaster',
        accent='#c07a50', dark='#2c2a29', ceil='#262729', ceiling='geo', led='#fff1e4',
        letters=('#d08a5c', '#ffb07a', 1.4), halo=14.,
        light=dict(col='#fff0e2', key=0, slot=0, geo=380, cove=420, brand=850, wash=520, world=('#1e1e20', .14)),
        lounge=dict(sofa=('fabric_terracotta', '#a65a3c'), chairs='modern_arm_chair_01', table='modern_coffee_table_01', pend='none',
                    rug=('#2b2b2c', '#6b6865'), plant='potted_plant_04')),
    'compact': dict(    # Opel Corsa — genç, sıcak, butik; bordo mermer, bordo deri duvar panelleri, rose-gold, ışık halkası
        title='Compact Studio',
        floor=('warm_graphite', .26, .3), slab=(1.3, 1.3), inlay=('rosso_marble', .14, .6), stage='disc',
        brand='rosso_marble', stone='oxblood_plaster', wood=None, feature='panels', flute='oxblood_leather',
        accent='#d0a088', dark='#4a2c24', ceil='#1e1817', ceiling='halo', led='#ffe9dc',
        letters=('#e0b49c', '#ffc8a8', 1.3), halo=16.,
        light=dict(col='#ffeee2', key=0, slot=0, ring=1900, cove=500, brand=900, wash=520, world=('#1c1514', .12)),
        lounge=dict(sofa=None, chairs='modern_arm_chair_01', table='coffee_table_round_01', pend='none',
                    rug=('#241a19', '#5a403b'), plant='potted_plant_04')),
    'executive': dict(  # Mercedes E 180 — zarif yönetici sınıfı; Nero Marquina mermer, grafit traverten yivler, altın, kasetli tavan
        title='Executive Lounge',
        floor=('nero_marquina', .16, .5), slab=(1.625, 1.625), inlay=('graphite_marble', .12, .65), stage='disc',
        brand='nero_marquina', stone='graphite_travertine', wood=None, feature='fluted', flute='graphite_travertine',
        accent='#d6b26a', dark='#4a3b26', ceil='#1c1a18', ceiling='coffer', led='#ffe6c4',
        letters=('#e6c98e', '#ffd28c', 1.5), halo=20.,
        light=dict(col='#ffeccf', key=1900, slot=0, cove=600, brand=950, wash=560, world=('#1a1714', .12)),
        lounge=dict(sofa=('leather_cream', '#ffffff'), chairs='mid_century_lounge_chair', table='round', pend='rings',
                    rug=('#1d1b19', '#4d4740'), plant='potted_plant_02')),
    'sedan': dict(      # BMW 320i — premium sedan, iş dünyası; antrasit + mavi-gri, çelik kanatlar, uzun lineer ışık bıçakları
        title='Executive Sedan Gallery',
        floor=('anthracite_stone', .22, .35), slab=(3.25, 1.625), inlay=('navy_marble', .15, .55), stage='slab',
        brand='navy_marble', stone='bluegrey_plaster', wood=None, feature='blades', fin_bg='anthracite_stone',
        accent='#9aa3ad', dark='#2a2e33', ceil='#1f2226', ceiling='blades', led='#eef3ff',
        letters=('#d5d9de', '#dfe8ff', .9), halo=12.,
        light=dict(col='#f1f3fb', key=0, slot=560, line=380, cove=420, brand=800, wash=480, world=('#1b1d22', .13)),
        lounge=dict(sofa=('velvet_navy', '#2a3446'), chairs='mid_century_lounge_chair', table='slab', pend='bar',
                    rug=('#1f242b', '#4d545d'), plant='potted_plant_02')),
}
THEME_NAME = opt('--theme', 'sport')
ROOM_ID = f'room_{THEME_NAME}' if (SIG and opt('--theme')) else f'room_{VARIANT}'   # temalı salon: room_<tema>.glb
TH = THEMES[THEME_NAME]
def tex_mat(name, folder, rough, coat=0., normal=.4):
    return pbr(name, folder, '#ffffff', rough=rough, normal=normal, coat=coat, coat_rough=.08)
# glTF'ye birebir aktarılan PBR: doku doğrudan renk / pürüzlülük / normal girişine bağlı (ara düğüm yok; tools/make_marble.py)
M['floor_a'] = tex_mat('floor_' + TH['floor'][0], TH['floor'][0], TH['floor'][1], TH['floor'][2], .35)
M['floor_b'] = M['floor_a']                                                        # plaka başına farklı doku başlangıcı (rand_origin)
M['floor_inlay'] = pbr('floor_inlay', TH['inlay'][0], '#ffffff', rough=TH['inlay'][1], normal=.25, coat=TH['inlay'][2], coat_rough=.04)
M['marble'] = pbr('brand_marble', TH['brand'], '#ffffff', rough=TH.get('brand_rough', .28), normal=.4, coat=TH.get('brand_coat', .4), coat_rough=.07)
M['champagne'] = pbr('champagne', None, TH['accent'], rough=.24, metal=1.)
M['bronze'] = pbr('bronze', None, TH['dark'], rough=.34, metal=1.)
if TH.get('frame'): M['frame'] = pbr('frame', None, TH['frame'], rough=.38, metal=.9)   # vitrin profili (koyu saten metal)
M['stone'] = tex_mat('wall_' + TH['stone'], TH['stone'], .55, 0., .55)
M['trav_a'] = M['trav_b'] = M['trav_c'] = M['travertine'] = M['stone']
if TH.get('wood'): M['walnut'] = pbr('wood_' + TH['wood'], TH['wood'], '#ffffff', rough=.5, normal=.7, coat=.3, coat_rough=.3)
M['fin_bg'] = tex_mat('finbg_' + TH.get('fin_bg', TH['stone']), TH.get('fin_bg', TH['stone']), .6, 0., .5)
M['flute'] = tex_mat('flute_' + TH.get('flute', TH['stone']), TH.get('flute', TH['stone']), .45, .1, .5)
M['ceil_panel'] = pbr('ceiling_panel', None, TH['ceil'], rough=.6)                 # saten lake panel (düz renk: glTF'ye birebir)
M['leather_cream'] = pbr('leather_cream', 'cream_leather', '#ffffff', rough=.55, normal=.6)          # gerçek deri dokusu + normal
M['leather_cognac'] = pbr('leather_cognac', 'velour_velvet', '#8a4b26', rough=.48, normal=.25, use_map=False, coat=.2, coat_rough=.3)
_sofa = TH['lounge']['sofa']
if _sofa:
    M['sofa'] = (pbr('sofa_' + _sofa[0], _sofa[0], '#ffffff', rough=.55, normal=.6) if tex_path(_sofa[0], 'Diffuse')
                 else pbr('sofa_' + _sofa[0], 'velour_velvet', _sofa[1], rough=.95, normal=.8, use_map=False))
M['rug'] = pbr('rug', 'velour_velvet', TH['lounge']['rug'][1], rough=.98, normal=1., use_map=False)
M['rug_edge'] = pbr('rug_edge', 'velour_velvet', TH['lounge']['rug'][0], rough=.98, normal=1., use_map=False)
M['softbox'] = emissive('softbox', TH['led'], 1.1)
M['shelf_led'] = emissive('shelf_led', TH['led'], 6.)
M['ledSoft'] = emissive('ledSoft', TH['led'], 14.)
M['led_line'] = diffuser_strip('led_line', TH['led'], 13.)
M['halo'] = emissive('halo', TH['letters'][1] if TH['halo'] else '#000000', TH['halo'])
for k_, t_ in (('floor_' + TH['floor'][0], (TH['slab'][0], TH['slab'][0])), ('floor_inlay', (2.6, 2.6)), ('brand_marble', (3.6, 3.6)),
               ('wall_' + TH['stone'], (2.4, 2.4)), ('finbg_' + TH.get('fin_bg', TH['stone']), (2.4, 2.4)),
               ('flute_' + TH.get('flute', TH['stone']), (1.2, 1.2)), ('wood_' + str(TH.get('wood')), (1.0, 1.0)),
               ('leather_cream', (.5, .5)), ('leather_cognac', (.4, .4)), ('sofa_' + str(_sofa and _sofa[0]), (.5, .5))):
    TILE[k_] = t_
SIG_ZONE = (-3.9, 1.3, -9.1, -2.6)            # sergileme alanı: zemin ızgarasına oturan 5.2 × 6.5 m cilalı plakalar

FEATURE = {   # (aralık, genişlik, derinlik, pah)
    'slats': (.075, .045, .04, 0.), 'planks': (.16, .15, .03, .004), 'fins': (.3, .025, .12, 0.),
    'blades': (.12, .02, .07, 0.), 'fluted': (.09, .08, .04, .03), 'ribs': (.3, .07, .1, .006), 'panels': (.62, .6, .035, .012)}
def feature_strip(tag, axis, c, a0, a1, face, group, accent_every=0):
    """tema duvar detayı. axis 'z': duvar z=c, x boyunca a0..a1, +z'ye bakar; axis 'x': duvar x=c, z boyunca, face (±1) yönüne bakar."""
    ft = TH['feature']
    pitch, sw, depth, bev = FEATURE[ft]
    metal = ft in ('fins', 'blades')
    if axis == 'z':
        box(f'{tag}_Back', a1 - a0, H, .02, (a0 + a1) / 2, H / 2, c + .01, M['fin_bg'] if metal else M['reveal'], group if metal else DARK, origin=rand_origin())
    else:
        box(f'{tag}_Back', .02, H, a1 - a0, c + face * .01, H / 2, (a0 + a1) / 2, M['fin_bg'] if metal else M['reveal'], group if metal else DARK, origin=rand_origin())
    n = int((a1 - a0 - .01) / pitch); off = (a1 - a0 - n * pitch) / 2
    for i in range(n):
        ac = accent_every and not metal and ft != 'panels' and i % accent_every == accent_every // 2
        m_ = M['champagne'] if metal else (M['bronze'] if ac else (M['flute'] if ft in ('fluted', 'panels') else M['walnut']))
        g_ = PLAIN if (metal or ac) else group
        u = a0 + off + pitch * (i + .5)
        if axis == 'z':
            box(f'{tag}_{i}', sw, H, depth, u, H / 2, c + .02 + depth / 2, m_, g_, bevel=bev, seg=3 if bev else 2, origin=(u - pitch / 2, 0, 0))
        else:
            box(f'{tag}_{i}', depth, H, sw, c + face * (.02 + depth / 2), H / 2, u, m_, g_, bevel=bev, seg=3 if bev else 2, origin=(0, 0, u))

def slats(tag, x0, x1, z, depth=.04, pitch=.075, sw=.045, y0=0., y1=None, bronze_every=0, group=None):
    """dikey ceviz çıtalar (arka duvar düzleminde, +z'ye bakar)."""
    y1 = y1 or H
    n = int((x1 - x0 - .01) / pitch); off = (x1 - x0 - n * pitch) / 2
    box(f'{tag}_Back', x1 - x0, y1 - y0, .02, (x0 + x1) / 2, (y0 + y1) / 2, z + .01, M['reveal'], DARK)
    for i in range(n):
        br = bronze_every and i % bronze_every == bronze_every // 2
        box(f'{tag}_{i}', sw, y1 - y0, depth, x0 + off + pitch * (i + .5), (y0 + y1) / 2, z + .02 + depth / 2,
            M['bronze'] if br else M['walnut'], PLAIN if br else (group if group is not None else BAKE['back']), origin=(x0 + off + pitch * i, 0, 0))

def led_v(name, x, z, y0=.15, y1=None, face='z'):
    """dikey gizli LED derzi (bronz kanal + ışık çizgisi)."""
    y1 = y1 or H - .15
    if face == 'z':
        box(name + '_Chan', .05, y1 - y0, .03, x, (y0 + y1) / 2, z + .015, M['reveal'], DARK)
        box('MTG_LED_' + name, .012, y1 - y0, .01, x, (y0 + y1) / 2, z + .03, M['ledSoft'], EMISSIVE)
    else:
        box(name + '_Chan', .03, y1 - y0, .05, x, (y0 + y1) / 2, z, M['reveal'], DARK)
        box('MTG_LED_' + name, .01, y1 - y0, .012, x + (.03 if x < 0 else -.03), (y0 + y1) / 2, z, M['ledSoft'], EMISSIVE)

def ring_pendant_at(x, y, z, r, tag):
    bpy.ops.mesh.primitive_torus_add(major_radius=r, minor_radius=.022, major_segments=128, minor_segments=12, location=P(x, y, z))
    t = bpy.context.active_object; t.name = f'MTG_{tag}'; bpy.ops.object.transform_apply(location=True); bpy.ops.object.shade_smooth()
    finish(t, M['champagne'], PLAIN)
    disc(f'MTG_{tag}_LED', r + .008, r - .014, y - .023, x, z, M['led'], EMISSIVE)
    for a in (30, 150, 270):
        cylinder(f'MTG_{tag}_wire{a}', .0025, .0025, H - y, x + r * math.cos(math.radians(a)), y, z + r * math.sin(math.radians(a)), M['black'], PLAIN, verts=6)

def build_signature(lounge=False):
    """lounge=True: aynı malzeme/mimari dilde dinlenme salonu (araç yerine merkezde VIP oturma grubu + kahve bankosu,
    sağ duvar bina sonu: geçişsiz). Araç odaları: iki yan duvarda da cam geçiş (sitede kapalı uçta dolgu gösterilir)."""
    # --- zemin: 3.25 × 1.625 m grafit taş plakalar, 2 mm derz; sergileme alanında daha cilalı koyu plakalar (2.6 × 1.3)
    slab_zone = not lounge and TH['stage'] == 'slab'
    zx0, zx1, zz0, zz1 = SIG_ZONE if slab_zone else (0., 0., 0., 0.)
    SW, SD = TH['slab']; J = .002
    for i in range(int(round(W / SW))):
        for j in range(int(round(D / SD))):
            x0, x1, z1, z0 = -W / 2 + SW * i, -W / 2 + SW * (i + 1), -SD * j, -SD * (j + 1)
            # sergileme alanıyla kesişen kısım kesilir (iki ızgara üst üste binmesin): plakayı alanın dışında kalan dikdörtgenlere böl
            rects = [(x0, x1, z0, z1)]
            out = []
            for (a0, a1, b0, b1) in rects:
                if a1 <= zx0 or a0 >= zx1 or b1 <= zz0 or b0 >= zz1: out.append((a0, a1, b0, b1)); continue
                if a0 < zx0: out.append((a0, zx0, b0, b1))
                if a1 > zx1: out.append((zx1, a1, b0, b1))
                ca0, ca1 = max(a0, zx0), min(a1, zx1)
                if b0 < zz0: out.append((ca0, ca1, b0, zz0))
                if b1 > zz1: out.append((ca0, ca1, zz1, b1))
            m = M['floor_a'] if RNG.random() < .55 else M['floor_b']
            for k, (a0, a1, b0, b1) in enumerate(out):
                ga0 = J / 2 if abs(a0 - x0) < 1e-6 else 0; ga1 = J / 2 if abs(a1 - x1) < 1e-6 else 0
                gb0 = J / 2 if abs(b0 - z0) < 1e-6 else 0; gb1 = J / 2 if abs(b1 - z1) < 1e-6 else 0
                plane_h(f'Slab_{i}_{j}_{k}', a1 - a0 - ga0 - ga1, b1 - b0 - gb0 - gb1, (a0 + a1 + ga0 - ga1) / 2, 0, (b0 + b1 + gb0 - gb1) / 2, m, BAKE['floor'], origin=rand_origin())
    nzx, nzz = (2, 5) if slab_zone else (0, 0)
    for i in range(nzx):
        for j in range(nzz):
            w_, d_ = (zx1 - zx0) / nzx, (zz1 - zz0) / nzz
            plane_h(f'Inlay_{i}_{j}', w_ - .002, d_ - .002, zx0 + w_ * (i + .5), 0, zz0 + d_ * (j + .5), M['floor_inlay'], BAKE['floor'], origin=rand_origin())
    plane_h('Floor_Grout', W, D, 0, -.002, -D / 2, M['grout'], DARK)
    # sergileme alanı çerçevesi: zemine gömülü 2 cm şampanya profil (platform değil, yüzeyle aynı seviyede)
    fw = .02
    for nm_, sx_, sz_, cx_, cz_ in () if not slab_zone else (('N', zx1 - zx0 + fw, fw, (zx0 + zx1) / 2, zz1), ('S', zx1 - zx0 + fw, fw, (zx0 + zx1) / 2, zz0),
                                    ('W', fw, zz1 - zz0, zx0, (zz0 + zz1) / 2), ('E', fw, zz1 - zz0, zx1, (zz0 + zz1) / 2)):
        box(f'MTG_StageFrame_{nm_}', sx_, .003, sz_, cx_, .0015, cz_, M['champagne'], PLAIN)
    if not lounge and TH['stage'] == 'disc':
        # yuvarlak sergileme platformu: zeminle aynı seviyede cilalı taş disk + metal kenar + çok ince ışık çizgisi
        disc('MTG_Stage', 3.2, 0, .004, CAR[0], CAR[1], M['floor_inlay'], PLAIN)
        disc('MTG_Stage_Rim', 3.24, 3.2, .0045, CAR[0], CAR[1], M['champagne'], PLAIN)
        disc('MTG_Stage_LED', 3.258, 3.248, .0045, CAR[0], CAR[1], M['ledSoft'], EMISSIVE)

    # --- arka duvar (z = −13): cam bölmeli private vault (sol, aracın arkası) | ceviz çıta | koyu mermer marka duvarı
    #     (orta: kahraman karede aracın tam arkasında) | ceviz çıta + dijital ekran (sağ)
    box('Wall_Back_Core', W, WALL_TOP, .02, 0, WALL_TOP / 2, BZ + .01, M['reveal'], DARK)
    BW0, BW1 = -2.23, 4.27                       # marka duvarı (merkez x ≈ 1.0)
    VX0, VX1 = XL, -2.9                          # vault (x)
    VZ = -10.6                                   # vault cam bölmesi (z)
    feature_strip('SlatM', 'z', BZ, VX1, BW0 - .12, +1, BAKE['back'])
    led_v('BackL', BW0 - .06, BZ)
    feature_strip('SlatR', 'z', BZ, BW1 + .12, XR, +1, BAKE['back'])
    led_v('BackR', BW1 + .06, BZ)
    # marka duvarı: 10 cm öne çıkan koyu mermer (3 × 2 panel), şampanya çerçeve, altta havada duran traverten bant
    MZ = BZ + .12
    box('BrandCore', BW1 - BW0, WALL_TOP, .1, (BW0 + BW1) / 2, WALL_TOP / 2, BZ + .07, M['reveal'], DARK)
    _bg = TH.get('brand_grid', (3, 2, .004))   # (sütun, sıra, derz): BMW'de 4 büyük dikey levha, 6 mm derz
    stone_panels('Marble', ('z', MZ, +1), [(BW0, BW1, .95, H - .05, _bg[0], _bg[1])], [M['marble']], BAKE['back'], depth=.03, gap=_bg[2])
    for nm_, sx_, sy_, cx_, cy_ in (('L', .04, H - .95, BW0 - .02, (H + .95) / 2), ('R', .04, H - .95, BW1 + .02, (H + .95) / 2)):
        box(f'MTG_BrandFrame_{nm_}', sx_, sy_, .06, cx_, cy_, MZ + .02, M['champagne'], PLAIN)
    box('MTG_BrandBand', BW1 - BW0 + .08, .03, .06, (BW0 + BW1) / 2, .95, MZ + .02, M['champagne'], PLAIN)
    # traverten bant (yerden 0.08 m kalkık, altında gizli LED)
    box('BrandPlinth_Shadow', BW1 - BW0 - .1, .08, .2, (BW0 + BW1) / 2, .04, MZ + .1, M['reveal'], DARK)
    stone_panels('BrandPlinth', ('z', MZ + .26, +1), [(BW0, BW1, .08, .9, 4, 1)], [M['trav_a'], M['trav_b'], M['trav_c']], BAKE['back'], depth=.26, gap=.004)
    box('MTG_LED_Plinth', BW1 - BW0 - .2, .01, .02, (BW0 + BW1) / 2, .07, MZ + .32, M['ledSoft'], EMISSIVE)
    # 3B harfler: şampanya metal, 4 cm kabartma + arkasında hale
    bx_ = (BW0 + BW1) / 2
    # harfler sitede üretilir (Cinzel konturlarından pahlı 3B metal harf + yumuşak gölge + arkadan ışık): fırında yazı gölgesi
    # olmaz, harf geometrisi bozulmaz, her ekranda keskin kalır. Burada yalnız yerleşim çapaları var.
    anchor('MTG_BrandText', bx_, 3.05, MZ + .03, mtg_anchor='brandtext', size=.5, line='MTG  |  MOTORS')
    anchor('MTG_BrandSubText', bx_, 2.36, MZ + .03, mtg_anchor='brandtext', size=.19, line='PRIVATE  COLLECTION')
    box('MTG_LED_BrandTop', BW1 - BW0 - .2, .01, .02, bx_, H - .02, MZ + .2, M['ledSoft'], EMISSIVE)
    # dijital ekran: sağ çıta alanında
    dx, dy = (BW1 + .12 + XR) / 2, 1.42
    if not lounge and TH.get('display', True):   # display=False: dijital ilan ekranı yok (bilgi sitedeki kartta)
        box('MTG_Display_Frame', .74, 2.02, .03, dx, dy, BZ + .085, M['bronze'], PLAIN)
        box('MTG_Display_Bezel', .68, 1.96, .02, dx, dy, BZ + .105, M['black'], PLAIN)
        anchor('MTG_Display', dx, dy, BZ + .116, mtg_anchor='display', w=.62, h=1.9)
    # private vault: arkada ceviz lamel + arkadan ışıklı bronz raflar, önde bronz çerçeveli cam bölme
    feature_strip('Vault', 'z', BZ, VX0, VX1, +1, BAKE['back'], accent_every=9)
    vcx = (VX0 + VX1) / 2
    for k, y in enumerate((1.0, 1.7, 2.4)):
        box(f'MTG_Shelf_{k}', VX1 - VX0 - .7, .025, .32, vcx, y, BZ + .26, M['champagne'], PLAIN)
        box(f'MTG_LED_Shelf_{k}', VX1 - VX0 - .8, .006, .02, vcx, y - .016, BZ + .38, M['shelf_led'], EMISSIVE)
    for k, (ox, y, dn, sc) in enumerate(((-.7, 1.0, 'brass_vase_02', .9), (.5, 1.0, 'ceramic_vase_01', .8), (-.2, 1.7, 'ceramic_vase_01', .7),
                                         (.7, 1.7, 'brass_vase_02', .7), (0.0, 2.4, 'brass_vase_02', .8))):
        anchor(f'MTG_Decor_Vault_{k}', vcx + ox, y + .0125, BZ + .26, yaw=k * .9, decor=dn, scale=sc)
    gw = VX1 - VX0
    box('MTG_Glass_Front', gw, H, .012, VX0 + gw / 2, H / 2, VZ, M['glass'], PLAIN)
    box('MTG_Glass_Side', .012, H, VZ - BZ - .05, VX1, H / 2, (VZ + BZ) / 2, M['glass'], PLAIN)
    fw_, fd_ = TH.get('vault_frame', (.06, .08)); fm_ = M.get('frame', M['bronze'])   # BMW: 2.5 cm ince koyu metal profil
    for k in range(4):
        box(f'MTG_Mullion_F{k}', fw_, H, fd_, VX0 + gw * k / 3 + (fw_ / 2 if k == 0 else -fw_ / 2 if k == 3 else 0), H / 2, VZ, fm_, PLAIN)
    for y in (fw_ / 2, H - fw_ / 2):
        box(f'MTG_Glass_Rail_{y:.0f}', gw, fw_, fd_, VX0 + gw / 2, y, VZ, fm_, PLAIN)
    box('MTG_Glass_Track_S', fw_, .006, VZ - BZ, VX1, .003, (VZ + BZ) / 2, fm_, PLAIN)

    # --- sol duvar (x = XL, +x'e bakar): traverten paneller + ceviz bant + dikey LED derzler; önde önceki salona cam geçiş
    wall_x('Wall_L_Core', XL, +1, -D, 0, 0, WALL_TOP, M['reveal'], DARK, holes=(PORTAL,))
    stone_panels('TravL', ('x', XL, +1), [(-D, -8.6, .06, H - .05, 3, 2), (-6.4, PORTAL[0], .06, H - .05, 1, 2), (PORTAL[1], 0, .06, H - .05, 1, 2),
                                          (PORTAL[0], PORTAL[1], PORTAL[3] + .1, H - .05, 3, 1)],
                 [M['trav_a'], M['trav_b'], M['trav_c']], BAKE['wall_l'])
    feature_strip('SlatLW', 'x', XL, -8.6, -6.4, +1, BAKE['wall_l'])          # tema detay bölümü
    for z_ in (-8.6, -6.4):
        led_v(f'LW{abs(z_):.0f}', XL + .02, z_, face='x')
    portal(-1, M['travertine'])                 # sol: önceki salondan cam geçiş (ilk salonda sitede kapalı dolgu)

    # --- sağ duvar (x = XR, −x'e bakar): lounge arkasında ceviz panel alanı + traverten, üstte duvar yıkayıcı
    RZ1 = PORTAL[0] - .15 if not lounge else -1.55      # ceviz alanın ön ucu
    wall_x('Wall_R_Core', XR, -1, -D, 0, 0, WALL_TOP, M['reveal'], DARK, holes=() if lounge else (PORTAL,))
    feature_strip('SlatRW', 'x', XR, -D + .3, RZ1, -1, BAKE['wall_r'], accent_every=11)
    if lounge:
        stone_panels('TravR', ('x', XR, -1), [(-1.4, 0, .06, H - .05, 1, 2)], [M['trav_a'], M['trav_b'], M['trav_c']], BAKE['wall_r'])
        led_v('RW', XR - .02, -1.48, face='x')
    else:
        stone_panels('TravR', ('x', XR, -1), [(PORTAL[1], 0, .06, H - .05, 1, 2), (PORTAL[0], PORTAL[1], PORTAL[3] + .1, H - .05, 3, 1)],
                     [M['trav_a'], M['trav_b'], M['trav_c']], BAKE['wall_r'])
        led_v('RW', XR - .02, PORTAL[0] - .1, face='x')
        portal(+1, M['travertine'])             # sağ: sonraki salona cam geçiş

    # --- medya duvarı (sağ duvar, lounge'un arkası): tema taşından yüzen panel + şampanya çerçeve + ince TV; ekran sitede
    #     odadaki aracın sinematik görüntüsünü oynatır (MTG_TV çapası). Panel tema duvar detayının önünde durur.
    if not lounge:
        TVZ, TVY = -9.75, 1.86
        PW_, PH_ = 2.75, 1.78
        fd_ = FEATURE[TH['feature']][2] + .03
        PX_ = XR - fd_ - .03                      # panelin ön yüzü
        box('MediaWall_Back', .05, PH_, PW_, PX_ + .025, TVY, TVZ, M['marble'], BAKE['wall_r'], origin=rand_origin())
        for nm_, sy_, sz_, cy_, cz_ in (('T', .03, PW_ + .06, TVY + PH_ / 2 + .015, TVZ), ('B', .03, PW_ + .06, TVY - PH_ / 2 - .015, TVZ),
                                        ('N', PH_, .03, TVY, TVZ - PW_ / 2 - .015), ('S', PH_, .03, TVY, TVZ + PW_ / 2 + .015)):
            box(f'MTG_MediaFrame_{nm_}', .07, sy_, sz_, PX_ + .015, cy_, cz_, M['champagne'], PLAIN)
        box('MTG_LED_Media', .012, .01, PW_ - .1, PX_ - .01, TVY - PH_ / 2 - .04, TVZ, M['ledSoft'], EMISSIVE)
        TW_, TH_ = 2.08, 1.17
        box('MTG_TV_Body', .035, TH_ + .02, TW_ + .02, PX_ - .0175 - .02, TVY, TVZ, M['black'], PLAIN)
        box('MTG_TV_Screen', .002, TH_, TW_, PX_ - .056, TVY, TVZ, M['black'], PLAIN)
        anchor('MTG_TV', PX_ - .058, TVY, TVZ, yaw=-math.pi / 2, mtg_anchor='tv', w=TW_, h=TH_)

    # --- ön yüz (koridor): cam vitrin + giriş açıklığı + taş pilastrlar (oda modülüyle aynı)
    OPEN_X1 = -2.2
    gx0_, gx1_ = OPEN_X1, XR
    box('MTG_Glass_Vitrine', gx1_ - gx0_, H, .014, (gx0_ + gx1_) / 2, H / 2, .0, M['glass'], PLAIN)
    for k in range(5):
        xm = gx0_ + (gx1_ - gx0_) * k / 4
        box(f'MTG_Vitrine_Mullion_{k}', .045 if k == 0 else .035, H, .08, xm, H / 2, .0, M['bronze'], PLAIN)
    box('MTG_Vitrine_Track', gx1_ - gx0_, .006, .06, (gx0_ + gx1_) / 2, .003, .0, M['bronze'], PLAIN)
    box('MTG_Threshold', OPEN_X1 - XL, .005, .05, (XL + OPEN_X1) / 2, .0025, .0, M['champagne'], PLAIN)
    for sx in (-1, 1):
        box(f'MTG_Pier_{sx}', .16, WALL_TOP, .34, sx * (W / 2 - .08), WALL_TOP / 2, .17 - .02, M['travertine'], PLAIN, tile=(1.2, 2.4))
        box(f'MTG_Pier_LED_{sx}', .012, H - .4, .012, sx * (W / 2 - .17), H / 2, .3, M['ledSoft'], EMISSIVE)

    # --- tavan (tema kurgusu): softbox | linear (enine LED hatlar) | blades (boyuna ışık bıçakları + çerçeve) | geo (çapraz
    #     LED şeritler) | halo (araç üstünde ışık halkası) | coffer (kasetli tavan) | beams (ahşap kirişler + softbox)
    LX, LZ = (4.45, -6.5) if not lounge else ((BW0 + BW1) / 2, -D + 3.6)    # oturma grubu merkezi
    cs = TH['ceiling'] if not lounge else 'softbox'
    SB = (CAR[0], CAR[1], 6.4, 3.4) if not lounge else (LX, LZ + .2, 4.6, 4.2)   # softbox (x, z, boy-z, en-x)
    if cs == 'coffer': SB = (CAR[0], CAR[1], 5.2, 3.9)
    has_sb = cs in ('softbox', 'beams', 'coffer')
    sbx0, sbx1, sbz0, sbz1 = SB[0] - SB[3] / 2, SB[0] + SB[3] / 2, SB[1] - SB[2] / 2, SB[1] + SB[2] / 2
    SLOTS_X = {'softbox': (-4.9, 3.1), 'blades': (-3.4, -1.7, -.3, 1.1, 3.0), 'beams': (), 'coffer': (), 'linear': (),
               'geo': (-4.9, 4.6), 'halo': (-4.9, 3.1)}[cs]
    LINES_Z = {'linear': tuple(-1.3 * k for k in range(1, 10)), 'blades': (-2.6, -10.4)}.get(cs, ())
    blade_z = (-10.4, -2.6)                      # blades: boyuna hatlar yalnız bu aralıkta (çerçeve)
    COVE_ = .16
    xs = sorted({XL + COVE_, XR - COVE_, *([sbx0 - .05, sbx1 + .05] if has_sb else []),
                 *[s_ - .04 for s_ in SLOTS_X], *[s_ + .04 for s_ in SLOTS_X]})
    zs = sorted({-D + COVE_, 0., *([sbz0 - .05, sbz1 + .05] if has_sb else []), *[-1.3 * k for k in range(1, 10)],
                 *[z_ - .04 for z_ in LINES_Z], *[z_ + .04 for z_ in LINES_Z], *(blade_z if cs == 'blades' else ())})
    for i in range(len(xs) - 1):
        for j in range(len(zs) - 1):
            xa, xb, za, zb = xs[i], xs[i + 1], zs[j], zs[j + 1]
            xc, zc = (xa + xb) / 2, (za + zb) / 2
            in_slot = any(abs(xc - s_) < .05 for s_ in SLOTS_X)
            if in_slot and (cs != 'blades' or blade_z[0] < zc < blade_z[1]): continue          # ışık kanalı
            if any(abs(zc - z_) < .05 for z_ in LINES_Z): continue
            if has_sb and sbx0 - .06 < xc < sbx1 + .06 and sbz0 - .06 < zc < sbz1 + .06: continue    # softbox açıklığı
            if xb - xa < .03 or zb - za < .03: continue
            box(f'CeilP_{i}_{j}', xb - xa - .01, .04, zb - za - .01, xc, H + .02, zc, M['ceil_panel'], BAKE['ceil'], origin=rand_origin())
    plane_h('Ceil_Void', W, D, 0, H + .09, -D / 2, M['reveal'], DARK, down=True)
    if has_sb:
        plane_h('MTG_Softbox', SB[3] - .04, SB[2] - .04, SB[0], H + .06, SB[1], M['softbox'], EMISSIVE, down=True)
        for nm_, sx_, sz_, cx_, cz_ in (('N', SB[3] + .1, .05, SB[0], sbz1 + .025), ('S', SB[3] + .1, .05, SB[0], sbz0 - .025),
                                        ('W', .05, SB[2], sbx0 - .025, SB[1]), ('E', .05, SB[2], sbx1 + .025, SB[1])):
            box(f'MTG_SoftboxFrame_{nm_}', sx_, .08, sz_, cx_, H + .0, cz_, M['champagne'], PLAIN)
    for i, s_ in enumerate(SLOTS_X):
        z0_, z1_ = blade_z if cs == 'blades' else (-D + .4, -.4)
        box(f'MTG_LED_Slot{i}', .05 if cs != 'blades' else .03, .012, z1_ - z0_, s_, H + .05, (z0_ + z1_) / 2, M['led_line'], EMISSIVE)
    for i, z_ in enumerate(LINES_Z):
        x0_, x1_ = (XL + COVE_ + .1, XR - COVE_ - .1) if cs == 'linear' else (SLOTS_X[0] - .04, SLOTS_X[-1] + .04)
        box(f'MTG_LED_Line{i}', x1_ - x0_, .012, .05, (x0_ + x1_) / 2, H + .05, z_, M['led_line'], EMISSIVE)
    if cs == 'geo':
        # çapraz LED şeritler: araç üstünden geçen dört paralel hat (35°), panellerin 1 cm altında, ince bakır kasa
        for i, off in enumerate((-2.4, -.8, .8, 2.4)):
            ln = 9.0
            st = box(f'MTG_LED_Geo{i}', ln, .014, .03, CAR[0] + off * .57, H - .012, CAR[1] + off * .82, M['ledSoft'], EMISSIVE)
            rotate_mesh(st, yaw=math.radians(35), pivot=P(CAR[0] + off * .57, H, CAR[1] + off * .82))
            fr = box(f'MTG_GeoFrame{i}', ln + .04, .008, .075, CAR[0] + off * .57, H - .004, CAR[1] + off * .82, M['champagne'], PLAIN)   # şeridin üstünde kasa plakası
            rotate_mesh(fr, yaw=math.radians(35), pivot=P(CAR[0] + off * .57, H, CAR[1] + off * .82))
    if cs == 'halo':
        # araç üstünde 2.6 m yarıçaplı ışık halkası: şampanya kasa + alt yüzde LED
        bpy.ops.mesh.primitive_torus_add(major_radius=2.6, minor_radius=.05, major_segments=192, minor_segments=12, location=P(CAR[0], H - .25, CAR[1]))
        t = bpy.context.active_object; t.name = 'MTG_HaloRing'; t.scale = (1, 1, .6); bpy.ops.object.transform_apply(location=True, scale=True)
        bpy.ops.object.shade_smooth(); finish(t, M['champagne'], PLAIN)
        for f_ in disc('MTG_LED_Halo', 2.63, 2.57, H - .284, CAR[0], CAR[1], M['ledSoft'], EMISSIVE, n=192).data.polygons: f_.flip()   # aşağı bakar
        for a in range(0, 360, 60):
            cylinder(f'MTG_Halo_wire{a}', .003, .003, .25, CAR[0] + 2.6 * math.cos(math.radians(a)), H - .25, CAR[1] + 2.6 * math.sin(math.radians(a)), M['black'], PLAIN, verts=6)
    if cs == 'beams':
        # koyu meşe kirişler (enine, 1.625 m aralık); softbox açıklığında kesilir
        for i, z_ in enumerate([-1.625 * k for k in range(1, 8)]):
            segs = [(XL, XR)]
            if sbz0 - .1 < z_ < sbz1 + .1: segs = [(XL, sbx0 - .08), (sbx1 + .08, XR)]
            for j, (xa_, xb_) in enumerate(segs):
                box(f'Beam_{i}_{j}', xb_ - xa_, .3, .2, (xa_ + xb_) / 2, H - .15, z_, M['walnut'], BAKE['ceil'], origin=rand_origin())
    if cs == 'coffer':
        # kasetli tavan: 2.6 m ızgarada 30 cm derin kirişler (açık renk lake), kiriş altında gizli ışık
        for i, x_ in enumerate([-W / 2 + 2.6 * k for k in range(1, 5)]):
            for j, (za_, zb_) in enumerate([(-D + COVE_, sbz0 - .1), (sbz1 + .1, 0.)] if sbx0 - .1 < x_ < sbx1 + .1 else [(-D + COVE_, 0.)]):
                box(f'CofX_{i}_{j}', .16, .3, zb_ - za_, x_, H - .15, (za_ + zb_) / 2, M['ceil_panel'], BAKE['ceil'], origin=rand_origin())
        for i, z_ in enumerate([-2.6 * k for k in range(1, 5)]):
            for j, (xa_, xb_) in enumerate([(XL + COVE_, sbx0 - .1), (sbx1 + .1, XR - COVE_)] if sbz0 - .1 < z_ < sbz1 + .1 else [(XL + COVE_, XR - COVE_)]):
                box(f'CofZ_{i}_{j}', xb_ - xa_, .3, .16, (xa_ + xb_) / 2, H - .15, z_, M['ceil_panel'], BAKE['ceil'], origin=rand_origin())
    for nm_, x_, z_, sx_, sz_ in (('B', 0, -D + COVE_ - .03, W - 2 * COVE_, .02), ('L', XL + COVE_ - .03, -D / 2, .02, D - .2), ('R', XR - COVE_ + .03, -D / 2, .02, D - .2)):
        box('MTG_LED_Cove' + nm_, sx_, .01, sz_, x_, H + .06, z_, M['ledSoft'], EMISSIVE)

    if lounge:
        sig_lounge_furniture(LX, LZ, VZ)
        anchor('MTG_Light', LX, H - .05, LZ, mtg_anchor='light', w=SB[3], h=SB[2])
        return dict(BW0=BW0, BW1=BW1, VX0=VX0, VX1=VX1, VZ=VZ, SB=SB, SLOTS_X=SLOTS_X, LX=LX, LZ=LZ, MZ=MZ, lounge=True,
                    cs=cs, has_sb=has_sb, LINES_Z=LINES_Z, blade_z=blade_z, pend='rings',
                    RINGS=((LX - .35, 3.05, LZ + .75), (LX + .3, 3.35, LZ + .75)))
    # --- VIP lounge (sağ, tema duvarının önünde): tema mobilyası (kanepe kumaşı/derisi, koltuk tipi, sehpa, avize)
    lg = TH['lounge']
    rug(LX + .1, LZ, 3.6, 3.9, tag='Rug')
    if lg['sofa']:
        fab = M['fabric']; M['fabric'] = M['sofa']
        sofa(XR - .62, LZ, -90, 3.4 if lg.get('boxes') else 3.0, 'Sofa')
        M['fabric'] = fab
    elif lg['chairs']:   # kompakt: kanepe yerine üçüncü koltuk (duvar önünde, salona bakar)
        anchor('MTG_Decor_Chair_C', XR - .95, 0, LZ, yaw=math.radians(-90), decor=lg['chairs'], scale=1.)
    if lg['chairs']:     # chairs=None: lounge yalnız kanepe + sehpa (sade; araçla yarışmaz)
        anchor('MTG_Decor_Chair_A', 2.75, 0, LZ + 1.15, yaw=math.radians(112), decor=lg['chairs'], scale=1.)
        anchor('MTG_Decor_Chair_B', 2.75, 0, LZ - 1.15, yaw=math.radians(68), decor=lg['chairs'], scale=1.)
    if lg['table'] in ('slab', 'round'):
        if lg['table'] == 'slab':
            rounded_slab('MTG_Table_Top', .8, 1.4, .12, .05, LX + .1, .34, LZ, M['marble'], PLAIN, tile=(1.2, 1.2))
            rounded_slab('MTG_Table_Base', .5, 1.05, .06, .34, LX + .1, 0, LZ, M['bronze'], PLAIN)
        else:
            cylinder('MTG_Table_Top', .62, .62, .05, LX + .1, .34, LZ, M['marble'], PLAIN, verts=96, tile=(1.2, 1.2))
            cylinder('MTG_Table_Base', .26, .34, .34, LX + .1, 0, LZ, M['champagne'], PLAIN, verts=64)
        for k, (w_, d_, t_, m_, a_) in enumerate(((.32, .24, .034, M['book_a'], 6), (.28, .21, .03, M['book_b'], -5))):
            b = box(f'MTG_Table_book{k}', w_, t_, d_, LX + .05, .39 + t_ / 2 + .034 * k, LZ - .3, m_, PLAIN, bevel=.003, seg=1)
            rotate_mesh(b, yaw=math.radians(a_))
        anchor('MTG_Decor_Table_vase', LX + .15, .39, LZ + .32, decor='brass_vase_02', scale=.85)
    else:
        anchor('MTG_Decor_Table', LX + .1, 0, LZ, yaw=math.radians(90), decor=lg['table'], scale=1.)
    if lg['pend'] == 'rings':
        ring_pendant_at(LX + .1, 3.15, LZ + .35, .52, 'Pendant')
        ring_pendant_at(LX + .1, 3.45, LZ - .3, .78, 'Pendant2')
    elif lg['pend'] == 'bar':     # lineer sarkıt: çelik kasa + altında LED, iki askı
        box('MTG_PendantBar', .07, .06, 1.8, LX + .1, 2.95, LZ, M['champagne'], PLAIN)
        box('MTG_LED_PendantBar', .045, .006, 1.74, LX + .1, 2.917, LZ, M['ledSoft'], EMISSIVE)
        for dz in (-.8, .8):
            cylinder(f'MTG_PendantBar_wire{dz:+.0f}', .0025, .0025, H - 2.98, LX + .1, 2.98, LZ + dz, M['black'], PLAIN, verts=6)
    if lg['plant']:      # plant=None: saksı bitkisi yok
        planter(XR - .6, -11.9, 1.6, 'Planter_B', h=.78, r=.32, plant=lg['plant'])
        planter(XL + .6, -6.0, 1.35, 'Planter_C', h=.72, plant=lg['plant'])        # geçişin önü boş kalır
        planter(XL + .6, VZ + .75, 1.5, 'Planter_D', h=.78, r=.32, plant='potted_plant_04')
    if lg.get('boxes'):            # SUV: duvar önünde uzun bitki kasaları (doğal doku)
        anchor('MTG_Decor_Box_A', XR - .45, 0, -1.6, yaw=math.radians(90), decor='planter_box_02', scale=1.)
        anchor('MTG_Decor_Box_B', BW1 + .9, 0, BZ + .5, yaw=0., decor='planter_box_02', scale=1.)

    # çapalar
    anchor('MTG_CarSpot', CAR[0], 0, CAR[1], yaw=SIG_YAW, mtg_anchor='car')
    anchor('MTG_Light', CAR[0], H - .05, CAR[1], mtg_anchor='light', w=SB[3], h=SB[2])

    # vekiller: koridor + karşı modül (bake'te koridordan gelen ışık)
    CORR_ = 6.0
    px_plane('CorrFloor', W, CORR_, 0, 0, CORR_ / 2, M['porcelain'], None, origin=(-W / 2, 0, 0))
    px_plane('CorrCeil', W, CORR_, 0, H, CORR_ / 2, M['ceil_panel'], None, down=True)
    px_box('CorrOppGlass', W - .3, H, .02, 0, H / 2, CORR_, M['glass'], None)
    px_box('CorrOppBack', W, H, .05, 0, H / 2, CORR_ + 6.5, M['travertine'], None, origin=(-W / 2, .06, 0))
    px_plane('CorrOppFloor', W, 6.5, 0, 0, CORR_ + 3.25, M['porcelain'], None)
    return dict(BW0=BW0, BW1=BW1, VX0=VX0, VX1=VX1, VZ=VZ, SB=SB, SLOTS_X=SLOTS_X, LX=LX, LZ=LZ, MZ=MZ, lounge=False,
                cs=cs, has_sb=has_sb, LINES_Z=LINES_Z, blade_z=blade_z, pend=lg['pend'])

def sig_lounge_furniture(LX, LZ, VZ):
    """dinlenme salonu: marka duvarının önünde krem deri kanepe (koridora bakar), iki konyak koltuk, mermer sehpa,
    çift halka avize; sağda traverten kahve bankosu + tabureler."""
    rug(LX, LZ + .6, 4.6, 3.6, tag='Rug')
    fab = M['fabric']; M['fabric'] = M['leather_cream']
    sofa(LX, LZ - .55, 0, 3.2, 'Sofa')
    M['fabric'] = fab
    anchor('MTG_Decor_Chair_L', LX - 1.85, 0, LZ + 1.45, yaw=math.radians(140), decor='mid_century_lounge_chair', scale=1.)
    anchor('MTG_Decor_Chair_R', LX + 1.85, 0, LZ + 1.45, yaw=math.radians(220), decor='mid_century_lounge_chair', scale=1.)
    rounded_slab('MTG_Table_Top', 1.4, .8, .12, .05, LX, .34, LZ + .75, M['marble'], PLAIN, tile=(1.2, 1.2))
    rounded_slab('MTG_Table_Base', 1.05, .5, .06, .34, LX, 0, LZ + .75, M['bronze'], PLAIN)
    for k, (w_, d_, t_, m_, a_) in enumerate(((.32, .24, .034, M['book_a'], 6), (.28, .21, .03, M['book_b'], -5))):
        b = box(f'MTG_Table_book{k}', w_, t_, d_, LX - .3, .39 + t_ / 2 + .034 * k, LZ + .7, m_, PLAIN, bevel=.003, seg=1)
        rotate_mesh(b, yaw=math.radians(a_))
    anchor('MTG_Decor_Table_vase', LX + .35, .39, LZ + .8, decor='brass_vase_02', scale=.85)
    ring_pendant_at(LX - .35, 3.15, LZ + .75, .52, 'Pendant')
    ring_pendant_at(LX + .3, 3.45, LZ + .75, .78, 'Pendant2')
    # traverten kahve bankosu (sağ duvara paralel), altında gizli LED; ceviz duvarın önünde
    bx, bz = XR - 1.75, -5.6
    box('MTG_Counter', .9, 1.05, 3.6, bx, .525, bz, M['travertine'], PLAIN, bevel=.02, seg=3, tile=(1.2, 2.4))
    box('MTG_Counter_Top', .98, .03, 3.68, bx, 1.065, bz, M['marble'], PLAIN, tile=(1.2, 1.2))
    box('MTG_Counter_Plinth', .8, .06, 3.5, bx, .03, bz, M['plinth'], PLAIN)
    box('MTG_Counter_LED', .02, .012, 3.4, bx - .46, .07, bz, M['ledSoft'], EMISSIVE)
    for i, dz in enumerate((-1.0, 0, 1.0)):
        anchor(f'MTG_Decor_Stool_{i}', bx - .95, 0, bz + dz, yaw=math.radians(90), decor='bar_chair_round_01', scale=1.)
    anchor('MTG_Decor_Counter_vase', bx, 1.08, bz - 1.3, decor='brass_vase_02', scale=.9)
    planter(XR - .6, -11.9, 1.6, 'Planter_B', h=.78, r=.32)
    planter(XL + .6, -6.0, 1.35, 'Planter_C', h=.72)
    planter(XL + .6, VZ + .75, 1.5, 'Planter_D', h=.78, r=.32, plant='potted_plant_04')

def signature_lights(g):
    # tema ışık karakteri: renk sıcaklığı + yoğunluklar (lounge varyantı eski Signature değerleriyle)
    Lt = TH['light'] if not g['lounge'] else dict(col='#ffe9cf', key=1500, slot=700, cove=600, brand=900, wash=650, world=('#2a2420', .15))
    col = Lt['col']
    bg.inputs['Color'].default_value = (*hexrgb(Lt['world'][0]), 1); bg.inputs['Strength'].default_value = Lt['world'][1]
    cx_, cz_ = CAR
    sb = g['SB']
    if g['has_sb'] and Lt.get('key'):
        # araç üstü stüdyo paneli: geniş, yumuşak
        area('L_Softbox', sb[0], H - .02, sb[1], sb[3] - .1, sb[2] - .1, Lt['key'], col, spread=120, glossy=False)
    for i, s_ in enumerate(g['SLOTS_X']):
        z0_, z1_ = g['blade_z'] if g['cs'] == 'blades' else (-D + .45, -.45)
        area(f'L_Slot{i}', s_, H + .03, (z0_ + z1_) / 2, .05, z1_ - z0_, Lt.get('slot', 700), col, spread=100, glossy=False)
    for i, z_ in enumerate(g['LINES_Z']):
        x0_, x1_ = (XL + .3, XR - .3) if g['cs'] == 'linear' else (g['SLOTS_X'][0], g['SLOTS_X'][-1])
        area(f'L_Line{i}', (x0_ + x1_) / 2, H + .03, z_, x1_ - x0_, .05, Lt.get('line', 400), col, spread=110, glossy=False)
    if g['cs'] == 'geo':
        for i, off in enumerate((-2.4, -.8, .8, 2.4)):
            l_ = area(f'L_Geo{i}', cx_ + off * .57, H - .03, cz_ + off * .82, 9.0, .05, Lt['geo'], col, spread=110, glossy=False)
            l_.rotation_euler = (0, 0, math.radians(35))
    if g['cs'] == 'halo':
        bpy.ops.object.light_add(type='AREA', location=P(cx_, H - .3, cz_))
        l_ = bpy.context.active_object; l_.name = 'L_Halo'; l_.data.shape = 'DISK'; l_.data.size = 5.2
        l_.data.energy = Lt['ring']; l_.data.color = hexrgb(col); l_.data.spread = math.radians(130)
        for attr, val in (('visible_camera', False), ('visible_glossy', False)):
            try: setattr(l_, attr, val)
            except Exception: pass
        LIGHTS.append(l_)
    # çevre gizli LED: duvarları yukarıdan yalar
    area('L_Cove_B', 0, H + .02, -D + .1, W - .4, .05, Lt['cove'] * 1.15, col, aim=(0, 0, -D + .02), spread=60, glossy=False)
    area('L_Cove_L', XL + .1, H + .02, -D / 2, .05, D - .3, Lt['cove'] * .85, col, aim=(XL + .02, 0, -D / 2), spread=60, glossy=False)
    area('L_Cove_R', XR - .1, H + .02, -D / 2, .05, D - .3, Lt['cove'], col, aim=(XR - .02, 0, -D / 2), spread=60, glossy=False)
    # marka duvarı: üstten sıyıran ışık + traverten bant altı
    bx_ = (g['BW0'] + g['BW1']) / 2
    area('L_BrandWash', bx_, H - .05, g['MZ'] + .28, g['BW1'] - g['BW0'] - .3, .06, Lt['brand'], col, aim=(bx_, 1.0, g['MZ']), spread=40, glossy=False)
    area('L_BrandPlinth', bx_, .06, g['MZ'] + .36, g['BW1'] - g['BW0'] - .3, .04, 160, '#ffcf96', aim=(bx_, 0, g['MZ'] + 1.0), spread=70, glossy=False)
    # dikey LED derzleri
    for nm_, x_, z_ in (('L_LedBL', g['BW0'] - .06, BZ + .06), ('L_LedBR', g['BW1'] + .06, BZ + .06)):
        area(nm_, x_, H / 2, z_, .03, H - .4, 120, '#ffcf96', aim=(x_, H / 2, BZ + 2), spread=120, glossy=False)
    # vault: lamel yukarı yıkama + raf ışıkları
    vx, vw = (g['VX0'] + g['VX1']) / 2, g['VX1'] - g['VX0']
    area('L_VaultUp', vx, .04, BZ + .2, vw - .2, .05, 260, '#ffcf96', aim=(vx, H, BZ + .12), spread=50, glossy=False)
    for k, y in enumerate((1.0, 1.7, 2.4)):
        area(f'L_Shelf{k}', vx, y - .03, BZ + .3, vw - .9, .2, 70, '#ffd6a0', aim=(vx, 0, BZ + .3), spread=110, glossy=False)
    # lounge: halka avizeler + sehpa üstüne sıcak spot
    rings = g.get('RINGS') or ((g['LX'] + .1, 3.05, g['LZ'] + .35), (g['LX'] + .1, 3.35, g['LZ'] - .3))
    if g['pend'] == 'bar': rings = ((g['LX'] + .1, 2.8, g['LZ'] - .4), (g['LX'] + .1, 2.8, g['LZ'] + .4))
    if g['pend'] == 'none': rings = ((g['LX'] + .1, 3.6, g['LZ']),)
    for nm_, (x_, y_, z_) in zip(('L_Ring1', 'L_Ring2'), rings):
        bpy.ops.object.light_add(type='POINT', location=P(x_, y_, z_))
        pl = bpy.context.active_object; pl.name = nm_; pl.data.energy = 110; pl.data.color = hexrgb('#ffcf98'); pl.data.shadow_soft_size = .3; LIGHTS.append(pl)
        try: pl.visible_glossy = False
        except Exception: pass
    # sağ ceviz duvar: üstten yıkama
    rz1 = PORTAL[0] if not g['lounge'] else -1.5
    area('L_WalnutWash', XR - .25, H - .05, (-D + rz1) / 2, .05, rz1 + D - .3, Lt['wash'], col, aim=(XR, 1.2, (-D + rz1) / 2), spread=45, glossy=False)
    # komşu salon (vekil) ışığı: cam geçişlerden
    area('L_NbL', -(W - 1), H - .1, -6.2, 6, 4, 1800, '#fff1e0', glossy=False)
    if not g['lounge']:
        area('L_NbR', W - 1, H - .1, -6.2, 6, 4, 1800, '#fff1e0', glossy=False)
    if g['lounge']:
        bx, bz = XR - 1.75, -5.6
        area('L_Counter', bx, H - .05, bz, 1.0, 3.6, 420, '#ffdcae', spread=90, glossy=False)
        # koridor (vekil) aşağıda; araç kartları yok
        for i, zc in enumerate((1.6, 4.4)):
            area(f'L_Corr_{i}', 0, H - .02, zc, W - .4, .05, 420, '#fff1e0', spread=110, glossy=False)
        area('L_CorrOpp', 0, H - .05, 6.0 + 4.5, 7.2, 3.9, 1600, '#fff1e0', glossy=False)
        return
    # araç: yansıma kartları + kenar ışığı (yalnız araca, önizleme)
    area('L_Card_L', cx_ - 4.6, 1.05, cz_ + 1.6, 6.0, 1.1, 85, '#fff5e8', aim=(cx_, .55, cz_), spread=70)
    area('L_Rim_B', cx_ + 1.2, 1.3, cz_ - 4.4, 3.4, .6, 140, '#ffe2c0', aim=(cx_, .5, cz_), spread=60)
    try:
        rc = bpy.data.collections.new('MTG_CarReceivers')
        for o in CAR_MAIN: rc.objects.link(o)
        for nm in ('L_Card_L', 'L_Rim_B'): bpy.data.objects[nm].light_linking.receiver_collection = rc
    except Exception as e:
        log('ışık bağlama yok:', str(e)[:60])
    # koridor (vekil)
    for i, zc in enumerate((1.6, 4.4)):
        area(f'L_Corr_{i}', 0, H - .02, zc, W - .4, .05, 420, '#fff1e0', spread=110, glossy=False)
    area('L_CorrOpp', 0, H - .05, 6.0 + 4.5, 7.2, 3.9, 1600, '#fff1e0', glossy=False)


SIG_G = None
if SIG or LOUNGE:
    SIG_G = build_signature(lounge=LOUNGE)
elif not HUB and not FACADE:
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
    wall_x('Wall_L', XL, +1, -D, 0, 0, WALL_TOP, M['micro'], BAKE['wall_l'], holes=(PORTAL,))
    box('Skirt_L', .012, .04, D + PORTAL[0], XL + .006, .02, (-D + PORTAL[0]) / 2, M['reveal'], DARK)
    box('Skirt_L2', .012, .04, -PORTAL[1], XL + .006, .02, PORTAL[1] / 2, M['reveal'], DARK)
    portal(-1, M['micro'])                      # sol: önceki salondan cam geçiş
    if not LOUNGE:
        # sağ: traverten paneller (1.3 × 2.36 m), gerçek derz
        wall_x('Wall_R_Core', XR, -1, -D, 0, 0, WALL_TOP, M['reveal'], DARK, holes=(PORTAL,))
        stone_panels('TravR', ('x', XR, -1), [(-D, PORTAL[0], .06, H - .05, 7, 2), (PORTAL[1], 0, .06, H - .05, 1, 2),
                                              (PORTAL[0], PORTAL[1], PORTAL[3] + .1, H - .05, 3, 1)], [M['trav_a'], M['trav_b'], M['trav_c']], BAKE['wall_r'])
        portal(+1, M['travertine'])             # sağ: sonraki salona cam geçiş
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
        planter(XL + .55, -6.6, 1.25, 'Planter_B', h=.7)           # geçişin önünden alındı
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
if SIG:
    place_car(CAR, SIG_YAW, paint=opt('--paint', '#740913'))   # sitedeki BMW rengi (Aventurin kırmızısı)
elif not LOUNGE and not HUB and not FACADE:
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

if SIG or LOUNGE:
    signature_lights(SIG_G)
elif not HUB and not FACADE:
    # 1) derz ışıkları: lineer armatürlerin gerçek aydınlatması. Yansımayı armatürün kendisi (MTG_LED) verir.
    for i, (z, x0, x1) in enumerate(LED_LINES):
        gallery = (not LOUNGE) and z < GLASS_Z
        area(f'L_Line_{i}', (x0 + x1) / 2, CH + .03, z, x1 - x0, .055, 300 if gallery else 480, '#fff4e6', spread=110, glossy=False)
    # 2) çevre gizli LED: duvarları yukarıdan sıyırır (traverten, koyu taş, ceviz, mikro çimento)
    area('L_Cove_B', 0, CH + .02, PZ0 - .06, PX1 - PX0, .05, 650, '#ffeedd', aim=(0, 0, -D + .02), spread=60, glossy=False)
    area('L_Cove_L', PX0 - .06, CH + .02, -D / 2, .05, D - .3, 380, '#ffeedd', aim=(XL + .02, 0, -D / 2), spread=60, glossy=False)
    area('L_Cove_R', PX1 + .06, CH + .02, -D / 2, .05, D - .3, 520, '#ffeedd', aim=(XR - .02, 0, -D / 2), spread=60, glossy=False)
    # cam geçişlerden komşu salonun ışığı (vekil): açıklık ve cam panel çevresi karanlık kalmasın
    for sd_ in ((-1,) if LOUNGE else (-1, 1)):
        area(f'L_Nb{sd_}', sd_ * (W - 1), H - .1, -6.2, 6, 4, 1800, '#fff1e0', glossy=False)
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
    scene.render.filepath = os.path.join(OUT, f'preview_{ROOM_ID[5:]}_{name}.png')
    bpy.ops.render.render(write_still=True)
    log('önizleme', scene.render.filepath)

VIEWS = {
    'car': {   # kamera durağı: (araç.x − 3.6, 1.6, araç.z + 5.3)
        'bmw':     ((CAR[0] - 3.6, 1.6, CAR[1] + 5.3), (CAR[0] + .2, .75, CAR[1] - .4), 40),      # 1) ön 3/4 kahraman (sitedeki durak)
        'portal':  ((0.2, 1.6, -0.4), (6.35, 1.5, -2.6), 62),                                    # sağ duvardaki cam geçiş
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
        'hero':   ((-3.2, 1.6, -1.6), (.5, 1.55, -13), 46),       # sitedeki kahraman karesi
    },
    'signature': {
        'hero':   ((-3.5, 1.45, -.45), (-.85, .98, -6.0), 38),
        # sitedeki kahraman karenin arka plakası: aynı kamera, 3:1 (kart kaydırması + geniş ekranlar için yatay pay)
        'plate':  ((-3.5, 1.45, -.45), (-.85, .98, -6.0), 38),
        'wide':   ((5.6, 1.7, -.6), (-2.0, 1.6, -10.5), 56),
        'brand':  ((-1.0, 1.55, -6.2), (-1.05, 2.4, -13), 52),
        'lounge': ((-.6, 1.5, -3.2), (5.4, 1.1, -7.6), 50),
        'portalL': ((2.2, 1.6, -2.6), (-6.4, 1.5, -3.2), 56),     # sol cam geçiş (önceki salon)
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
    for o in PORTAL_FILLS: o.hide_render = True          # referans render'da geçişler açık
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
    for o in CAR_OBJS + PORTAL_FILLS: o.hide_render = True
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
    name = ROOM_ID
    for key, obj in (('floor', floor), ('walls', arch), ('ceiling', ceil)):
        obj['lightmap'] = save_lm(res[key], scale, f'{name}_lm_{key}.webp')
        obj['lmScale'] = scale
    for o in CAR_OBJS + glass_off + PORTAL_FILLS: o.hide_render = False
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
    path = os.path.join(OUT, f'{ROOM_ID}.glb')
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
              open(os.path.join(OUT, f'{ROOM_ID}.json'), 'w'), indent=1)

if MODE == 'preview':
    run_previews()
elif MODE == 'full':
    baked = full_build()
    run_previews()
    if '--save-blend' in argv: bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT, f'{ROOM_ID}.blend'))
    export(baked)
log('bitti')
