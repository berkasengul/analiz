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
import bpy, bmesh, math, os, sys, json, time
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
PREVIEW_ONLY = opt('--views')            # örn. "bmw,wide"
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
LIGHTBOX = (0.0, -D + 4.4, 6.0, 3.6) if LOUNGE else (CAR[0], CAR[1], 7.2, 4.2)

def P(x, y, z): return Vector((x, -z, y))

# nesne grupları
BAKE = {'floor': [], 'back': [], 'wall_l': [], 'wall_r': [], 'ceil': [], 'filler': []}
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

def pbr(name, folder=None, color='#ffffff', rough=.5, metal=0., normal=1., coat=0., use_map=True, rough_var=0., coat_rough=.03, rough_mul=1.):
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
    'porcelain':  pbr('porcelain', 'porcelain_slab', '#ece7df', normal=.3, rough_var=.15, coat=.25, coat_rough=.07),   # cilalı porselen: ince cila + pürüzlülük dalgası
    'porcelain2': pbr('porcelain_b', 'porcelain_slab', '#e2ddd5', normal=.3, rough_var=.15, coat=.25, coat_rough=.08),
    'grout':      pbr('grout', None, '#625d58', rough=.85),
    'stage':      pbr('stage', 'porcelain_slab', '#4f4c49', normal=.12, rough_var=.08, coat=.5, coat_rough=.06),   # cilalı grafit porselen
    'brand':      pbr('brand_brass', None, '#b8935f', rough=.38, metal=.75),
    # duvar taşları: çizgisiz plakalar, derz geometride; panel başına ton ve doku başlangıcı değişir
    'trav_a':     pbr('travertine_a', 'travertine_clean', '#efe8dc', normal=.65, rough_var=.25),
    'trav_b':     pbr('travertine_b', 'travertine_clean', '#e4dccf', normal=.65, rough_var=.25),
    'trav_c':     pbr('travertine_c', 'travertine_clean', '#eae1d2', normal=.65, rough_var=.25),
    'dark_a':     pbr('dark_stone', 'dark_stone', '#ffffff', normal=.55, rough_var=.3, coat=.15, coat_rough=.2),   # bilenmiş (honed) koyu taş
    'dark_b':     pbr('dark_stone_b', 'dark_stone', '#e9e5e1', normal=.55, rough_var=.3, coat=.15, coat_rough=.2),
    'warm':       pbr('warm_stone', 'warm_stone', '#ffffff', normal=.5),
    'micro':      pbr('microcement', 'microcement', '#efebe5', normal=.45),
    'walnut':     pbr('walnut', 'smoked_walnut_veneer', '#ffffff', normal=.6, rough_var=.2, coat=.3, coat_rough=.28),   # yağ cilalı ceviz: yumuşak parlama
    'travertine': pbr('travertine', 'travertine_clean', '#e8e0d3', normal=.5),
    'ceil_panel': pbr('ceiling_panel', 'microcement', '#3a3734', normal=.2, rough_mul=.55, rough_var=.2),   # koyu saten lake panel
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
    'ledSoft':    emissive('ledSoft', '#ffeedd', 14.),
    'ledRing':    emissive('ledRing', '#ffe6c4', 2.5),
    'halo':       emissive('halo', '#ffd8a6', 22.),
}
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
def text_mesh(name, body, size, x, y, z, mat, group, depth=.012, offset=0., tracking=1.0):
    """duvara dik (site +z'ye bakan) 3B yazı; Cinzel yoksa sistemdeki serif yazı tipi."""
    cu = bpy.data.curves.new(name, 'FONT'); cu.body = body; cu.size = size
    cu.align_x = 'CENTER'; cu.align_y = 'CENTER'; cu.extrude = depth / 2; cu.offset = offset
    cu.space_character = tracking
    for fp in FONT_PATHS:
        if os.path.exists(fp):
            try: cu.font = bpy.data.fonts.load(fp, check_existing=True); break
            except Exception: pass
    o = bpy.data.objects.new(name, cu); link(o)
    o.location = P(x, y, z); o.rotation_euler = (math.pi / 2, 0, 0)
    bpy.ops.object.select_all(action='DESELECT'); o.select_set(True); bpy.context.view_layer.objects.active = o
    bpy.ops.object.convert(target='MESH'); o = bpy.context.active_object; o.name = name
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.mesh.remove_doubles(threshold=1e-5); bpy.ops.mesh.normals_make_consistent(inside=False)
    bpy.ops.object.mode_set(mode='OBJECT')
    for f in o.data.polygons: f.use_smooth = False
    o.data.materials.clear(); o.data.materials.append(mat)
    world_uv(o, (1., 1.))
    if group is not None: group.append(o)
    return o

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

# --- yan duvarlar ---
# sol: mikro çimento (kapılı: önceki odadan gelinen kapı)
wall_x('Wall_L', XL, +1, -D, 0, 0, WALL_TOP, M['micro'], BAKE['wall_l'], holes=[DOOR_HOLE])
if not LOUNGE:
    # sağ: traverten paneller, kapı boşluğu çevresinde düzenli bölünmüş (sonraki odaya geçiş)
    wall_x('Wall_R_Core', XR, -1, -D, 0, 0, WALL_TOP, M['reveal'], DARK, holes=[DOOR_HOLE])
    stone_panels('TravR', ('x', XR, -1), [
        (-D, DOOR_HOLE[0], .06, H - .05, 8, 2),          # kapının arkası (z -13 → -3.6)
        (DOOR_HOLE[0], DOOR_HOLE[1], DOOR_H, H - .05, 2, 1),   # kapı üstü
        (DOOR_HOLE[1], 0, .06, H - .05, 1, 2),             # kapının önü
    ], [M['trav_a'], M['trav_b'], M['trav_c']], BAKE['wall_r'])
else:
    wall_x('Wall_R', XR, -1, -D, 0, 0, WALL_TOP, M['micro'], BAKE['wall_r'])

# kapı boşluğu kasaları: bronz (duvar kalınlığının bu odaya ait yarısı)
FRAMES = []
for side, xw in ((-1, XL), (+1, XR)):
    if LOUNGE and side > 0: continue
    xc = xw + side * HALF_T / 2
    g = [box(f'Frame_{side}_a', HALF_T + .04, DOOR_H, .05, xc - side * .02, DOOR_H / 2, DOOR_HOLE[1] + .025, M['bronze'], None),
         box(f'Frame_{side}_b', HALF_T + .04, DOOR_H, .05, xc - side * .02, DOOR_H / 2, DOOR_HOLE[0] - .025, M['bronze'], None),
         box(f'Frame_{side}_c', HALF_T + .04, .05, DOOR_W + .1, xc - side * .02, DOOR_H + .025, DOOR_Z, M['bronze'], None)]
    FRAMES.append((side, g))
for side, g in FRAMES:
    PLAIN.append(join(g, 'MTG_DoorFrame_' + ('L' if side < 0 else 'R')))
# süpürgelik gölge boşluğu (sol duvar dibinde 4 cm)
for z0, z1 in ((-D, DOOR_HOLE[0]), (DOOR_HOLE[1], 0)):
    box('Skirt_L', .012, .04, z1 - z0, XL + .006, .02, (z0 + z1) / 2, M['reveal'], DARK)

# ilk odada sol duvarda kapı yok: boşluğu kapatan dolgu (kod oda 0'da gösterir, diğerlerinde gizler)
filler = box('MTG_WallL_Filler', .02, DOOR_H, DOOR_W, XL - .01 - .005, DOOR_H / 2, DOOR_Z, M['micro'], BAKE['filler'])
filler.hide_render = True            # ana bake'te kapı açık kabul edilir

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
    box(f'MTG_LED_{i}', x1 - x0, .012, .055, (x0 + x1) / 2, CH + .05, z, M['led'], EMISSIVE)
# çevre gizli LED (panellerin üstünde, duvara bakan kenarda): görünmez, ışığı duvara düşer
for nm_, x_, z_, sx_, sz_ in (('B', 0, PZ0 - .03, PX1 - PX0, .02), ('L', PX0 - .03, -D / 2, .02, D - .2), ('R', PX1 + .03, -D / 2, .02, D - .2)):
    box('MTG_LED_Cove' + nm_, sx_, .01, sz_, x_, CH + .06, z_, M['ledSoft'], EMISSIVE)

# ---------------- araç alanı / cam galeri / oturma köşesi ----------------
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

def brand_wall(cx, cy, size):
    """MTG | MOTORS: fırçalanmış bronz harfler, duvardan 4 cm ayrık, arkadan ışıklı (halo)."""
    zf = BZ + .05
    text_mesh('MTG_Brand', 'MTG  |  MOTORS', size, cx, cy, zf + .03, M['brand'], PLAIN, depth=.015, tracking=1.18)
    # halo: harflerin hemen arkasında aynı biçimde ışıklı kopya; önden görünmez, duvara ışık halesi düşürür
    text_mesh('MTG_Brand_Halo', 'MTG  |  MOTORS', size, cx, cy, zf + .018, M['halo'], EMISSIVE, depth=.002, tracking=1.18)

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
def px_box(name, *a, **k):
    o = box('PX_' + name, *a, **k); PROXY.append(o); return o
def px_plane(name, *a, **k):
    o = plane_h('PX_' + name, *a, **k); PROXY.append(o); return o
for side in (-1, 1):
    if LOUNGE and side > 0: continue
    ox = side * W
    px_plane(f'NFloor{side}', W, D, ox, 0, -D / 2, M['porcelain'], None, origin=(ox - W / 2, 0, 0))
    px_plane(f'NCeil{side}', W, D, ox, H, -D / 2, M['ceil_panel'], None, down=True)
    px_box(f'NBack{side}', W, H, .05, ox, H / 2, -D - .025, M['travertine'], None, origin=(ox - W / 2, .06, 0))
    px_box(f'NWall{side}', .05, H, D, ox + side * (W / 2 - HALF_T + .025), H / 2, -D / 2, M['micro'], None)
for side in (-1, 1):
    if LOUNGE and side > 0: continue
    xw = side * (W / 2 + HALF_T)
    o = wall_x(f'PX_NHalf{side}', xw, side, -D, 0, 0, H, M['micro'], None, holes=[DOOR_HOLE]); PROXY.append(o)
# cam cephe (z=0) + oda sınırlarında taş kolonlar (buildBuilding ile aynı)
px_box('Facade_Glass', W - .7, H, .02, 0, H / 2, .0, M['glass'], None)
for sx in (-1, 1): px_box(f'Facade_Col{sx}', .35, H, .7, sx * (W / 2 - .175), H / 2, .05, M['travertine'], None)
px_plane('Plaza', 40, 20, 0, -.02, 10.5, M['plinth'], None)
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
            'lambert3SG': 'chrome', 'lambert2SG': 'chrome', 'lambert10SG': 'headlight', 'HeadLights1': 'headlight',
            'BrakeLights_Glass': 'taillight', 'Plate_Recovered': 'plate'}
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
        vo = nt.nodes.new('ShaderNodeTexVoronoi'); vo.inputs['Scale'].default_value = 2600.
        nt.links.new(geo.outputs['Position'], vo.inputs['Vector'])
        mix = nt.nodes.new('ShaderNodeMix'); mix.data_type = 'RGBA'; mix.inputs['Factor'].default_value = .12
        mix.inputs[6].default_value = (.5, .5, 1., 1.); nt.links.new(vo.outputs['Color'], mix.inputs[7])
        nm = nt.nodes.new('ShaderNodeNormalMap'); nm.inputs['Strength'].default_value = .35
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
        setv(**{'Base Color': (*hexrgb('#161616'), 1), 'Specular IOR Level': .35})
        rough_noise(.62, .82, 40.); noise_bump(260., .25, .0008)
    elif kind == 'rim':
        # cilalı gunmetal jant (sitedeki rimColor), şeffaf cila
        setv(**{'Base Color': (*hexrgb('#2a2c30'), 1), 'Metallic': 1., 'Roughness': .24, 'Coat Weight': .7, 'Coat Roughness': .04})
    elif kind == 'disc':
        setv(**{'Base Color': (*hexrgb('#7a7976'), 1), 'Metallic': 1., 'Roughness': .38, 'Anisotropic': .6})
    elif kind == 'caliper':
        setv(**{'Base Color': (*hexrgb('#1f4fd8'), 1), 'Roughness': .3, 'Coat Weight': 1., 'Coat Roughness': .05})
    elif kind == 'chrome':
        setv(**{'Base Color': (*hexrgb('#9a9da1'), 1), 'Metallic': 1., 'Roughness': .07})
    elif kind == 'mirror':
        setv(**{'Base Color': (*hexrgb('#d8dadc'), 1), 'Metallic': 1., 'Roughness': .02})
    elif kind == 'gloss':
        setv(**{'Base Color': (*hexrgb('#060607'), 1), 'Roughness': .12, 'Coat Weight': 1., 'Coat Roughness': .03})
    elif kind == 'matte':
        setv(**{'Base Color': (*hexrgb('#0e0e0f'), 1), 'Specular IOR Level': .4}); rough_noise(.5, .65, 30.)
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
            kind = next((v for k, v in CAR_MATS.items() if nm.endswith(k) or nm.endswith(k + '.001')), 'interior')
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
if not LOUNGE:
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
    area('L_Card_T', cx_ + 1.6, CH - .3, cz_ - 1.4, 2.6, .9, 45, '#fffaf2', aim=(cx_, 0, cz_), spread=70)
    # 6) kenar (rim) ışıkları: arkadan alçak, araç siluetini zeminden ayırır
    area('L_Rim_R', cx_ + 3.6, 1.5, cz_ - 3.2, 2.6, .5, 110, '#ffe9d0', aim=(cx_, .7, cz_), spread=45)
    area('L_Rim_B', cx_ - 1.2, 1.2, cz_ - 4.4, 3.0, .6, 110, '#fff1e2', aim=(cx_, .5, cz_), spread=60)
    # ışık bağlama: yansıma kartları ve kenar ışıkları yalnız ana araca etki eder
    # (cam galeri, zemin ve duvarlar bunları yansıtmaz → sahnede "görünmez stüdyo ışığı" izi kalmaz)
    try:
        rc = bpy.data.collections.new('MTG_CarReceivers')
        for o in CAR_MAIN: rc.objects.link(o)
        for nm in ('L_Card_L', 'L_Card_T', 'L_Rim_R', 'L_Rim_B'):
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
for side in (-1, 1):   # komşu odalar (vekil): kapıdan görünen alan aydınlık olsun
    if LOUNGE and side > 0: continue
    area(f'L_Neighbor{side}', side * W + CAR[0], CH - .05, CAR[1], 7.2, 3.9, 2400, '#fff6ec', glossy=False)
    area(f'L_NLinear{side}', side * W, CH - .06, -2.6, W - 1.3, .04, 520, '#fff4e4', spread=120, glossy=False)

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

def render_view(name, pos, look, vfov=40., res=(1280, 720)):
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
    },
    'lounge': {
        'wide':   ((-1.0, 1.7, -1.0), (0.6, 1.4, -13), 52),
        'bar':    ((-2.5, 1.5, -3.5), (4.2, 1.0, -6.0), 46),
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

# duvar atlası: arka duvar, sol duvar, sağ duvar alt alta (her biri 13 × 4.9 m), aralarında boşluk
ATLAS_G = .02
ATLAS_S = (1 - 4 * ATLAS_G) / (3 * (H + .1))
def atlas_uv(row):
    def f(x, y, z):
        a = (x + W / 2) if row == 0 else (z + D)
        return (ATLAS_G + a * ATLAS_S, ATLAS_G * (row + 1) + (H + .1) * ATLAS_S * row + y * ATLAS_S)
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
    # pişirilen mimari: zemin, duvarlar (traverten + ceviz lamel + mikro çimento), tavan, kapı dolgusu
    # mobilya / dekor gölge verir ama kendi lightmap'i yoktur; araç gizlenir (turda 360° döner)
    planar_lm(BAKE['floor'], lambda x, y, z: ((x + W / 2) / W, (z + D) / D))
    planar_lm(BAKE['back'], atlas_uv(0), facing=(0, 0, 1))
    planar_lm(BAKE['wall_l'], atlas_uv(1), facing=(1, 0, 0))
    planar_lm(BAKE['wall_r'], atlas_uv(2), facing=(-1, 0, 0))
    planar_lm(BAKE['ceil'], lambda x, y, z: ((x + W / 2) / W, (z + D) / D), facing=(0, -1, 0))
    planar_lm(BAKE['filler'], lambda x, y, z: ((z - DOOR_HOLE[0]) / DOOR_W, y / DOOR_H))
    floor = join_group(BAKE['floor'], 'MTG_Floor')
    arch = join_group(BAKE['back'] + BAKE['wall_l'] + BAKE['wall_r'], 'MTG_Walls')
    ceil = join_group(BAKE['ceil'], 'MTG_Ceiling')
    fill = join_group(BAKE['filler'], 'MTG_WallL_Filler')
    PLAIN.append(join_group(DARK, 'MTG_Reveals'))
    for o in CAR_OBJS: o.hide_render = True
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
    fill.hide_render = False
    res['filler'] = denoise(bake(fill, (256, 256), 'filler'))
    # ortak ölçek: zemin ve duvarların %99.7'lik parlaklığı → 1.0 (tüm haritalar aynı birimde)
    scale = float(max(np.percentile(res['floor'].max(axis=2), 99.7), np.percentile(res['walls'].max(axis=2), 99.7))) or 1.
    name = f'room_{VARIANT}'
    for key, obj in (('floor', floor), ('walls', arch), ('ceiling', ceil), ('filler', fill)):
        obj['lightmap'] = save_lm(res[key], scale, f'{name}_lm_{key}.webp')
        obj['lmScale'] = scale
    for o in CAR_OBJS: o.hide_render = False
    for b, v in emis: b.inputs['Emission Strength'].default_value = v
    scene.cycles.sample_clamp_indirect = 10.
    return [floor, arch, ceil, fill]

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
