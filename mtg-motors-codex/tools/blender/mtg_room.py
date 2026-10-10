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

def pbr(name, folder=None, color='#ffffff', rough=.5, metal=0., normal=1., coat=0., use_map=True):
    m = bpy.data.materials.new('MTG_' + name); m.use_nodes = True
    nt = m.node_tree; b = nt.nodes['Principled BSDF']
    b.inputs['Metallic'].default_value = metal
    b.inputs['Roughness'].default_value = rough
    b.inputs['Base Color'].default_value = (*hexrgb(color), 1)
    if coat:
        b.inputs['Coat Weight'].default_value = coat; b.inputs['Coat Roughness'].default_value = .03
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
            nt.links.new(rt.outputs['Color'], b.inputs['Roughness'])
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
    'floor':     pbr('floor', 'showroom_floor', '#c4c1bc', normal=.25),
    'travertine': pbr('travertine', 'travertine_panel', '#d6cfc3', normal=.55),
    'micro':     pbr('microcement', 'microcement', '#f2eee8', normal=.45),
    'walnut':    pbr('walnut', 'smoked_walnut_veneer', '#ffffff', normal=.5),
    'ceiling':   pbr('ceiling', None, '#1d1e21', rough=.88),
    'reveal':    pbr('reveal', None, '#0b0b0c', rough=.9),
    'black':     pbr('black', None, '#0e0f10', rough=.35, metal=.5),
    'plinth':    pbr('plinth', None, '#121315', rough=.5, metal=.2),
    'metal':     pbr('metal', None, '#b9b4ab', rough=.32, metal=1.),
    'bronze':    pbr('bronze', None, '#3a3027', rough=.42, metal=.85),
    'fabric':    pbr('fabric', 'velour_velvet', '#b8b1a6', rough=.97, normal=.55, use_map=False),   # sitedeki gibi: renk düz, kadife yalnız normal
    'planter':   pbr('planter', 'microcement', '#8c877f', rough=.9, normal=.6),
    'soil':      pbr('soil', None, '#2a2522', rough=1.),
    'glass':     glass('glass'),
    'led':       emissive('led', '#fff4e4', 30.),
    'ledSoft':   emissive('ledSoft', '#ffeedd', 14.),
    'diffuser':  emissive('diffuser', '#fffaf3', 9.),
}
# dokular için gerçek ölçü (m): bir doku tekrarının kapladığı alan
TILE = {'floor': (2.4, 2.4), 'travertine': (1.2, 2.4), 'micro': (2.4, 2.4), 'walnut': (1.0, 1.0),
        'fabric': (.33, .33), 'planter': (.6, .6)}

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

# ---------------- mimari ----------------
# zemin: büyük ebat cilalı taş (doku 2.4 m = 2 × 2 adet 1.2 m karo); derzler sol duvardan başlar
plane_h('MTG_Floor', W, D, 0, 0, -D / 2, M['floor'], BAKE['floor'], origin=(-W / 2, 0, 0))

# arka duvar: traverten paneller (gerçek derz: 6 mm gölge boşluğu, panel 1.2 × 2.36 m)
BZ = -D
box('Wall_Back_Core', W, H + .1, .02, 0, (H + .1) / 2, BZ + .01, M['reveal'], DARK)
trav_x1 = XR if LOUNGE else 1.9                          # araç odasında sağ arka ceviz panelle biter
xa = XL
n_cols = max(1, round((trav_x1 - xa) / 1.2))
pw = (trav_x1 - xa) / n_cols
row_h = (H - .06 - .05) / 2
for i in range(n_cols):
    for j in range(2):
        cx_ = xa + pw * (i + .5); cy = .06 + row_h * (j + .5)
        box(f'Trav_{i}_{j}', pw - .006, row_h - .006, .03, cx_, cy, BZ + .035, M['travertine'], BAKE['back'],
            origin=(xa + pw * i, .06 + row_h * j, 0), bevel=.0015, seg=1)
box('Back_Skirt_Reveal', W, .06, .03, 0, .03, BZ + .03, M['reveal'], DARK)

# yan duvarlar (mikro çimento). Sol: kapılı (önceki odadan gelinen), sağ: araç odasında kapılı (sonraki oda)
DOOR_HOLE = (DOOR_Z - DOOR_W / 2, DOOR_Z + DOOR_W / 2, 0., DOOR_H)
wall_x('Wall_L', XL, +1, -D, 0, 0, H + .1, M['micro'], BAKE['wall_l'], holes=[DOOR_HOLE])
wall_x('Wall_R', XR, -1, -D, 0, 0, H + .1, M['micro'], BAKE['wall_r'], holes=[] if LOUNGE else [DOOR_HOLE])
# kapı boşluğu dönüşleri (duvar kalınlığının bu odaya ait yarısı) — siyah metal kasa
FRAMES = []
for side, xw in ((-1, XL), (+1, XR)):
    if LOUNGE and side > 0: continue
    xc = xw + side * HALF_T / 2
    g = [box(f'Frame_{side}_a', HALF_T + .01, DOOR_H, .06, xc, DOOR_H / 2, DOOR_HOLE[1] + .03, M['black'], None),
         box(f'Frame_{side}_b', HALF_T + .01, DOOR_H, .06, xc, DOOR_H / 2, DOOR_HOLE[0] - .03, M['black'], None),
         box(f'Frame_{side}_c', HALF_T + .01, .06, DOOR_W + .12, xc, DOOR_H + .03, DOOR_Z, M['black'], None)]
    FRAMES.append((side, g))
for side, g in FRAMES:
    PLAIN.append(join(g, 'MTG_DoorFrame_' + ('L' if side < 0 else 'R')))
# süpürgelik gölge boşluğu (yan duvar dibinde 4 cm)
for side, xw in ((-1, XL), (+1, XR)):
    for z0, z1 in ((-D, DOOR_HOLE[0]), (DOOR_HOLE[1], 0)) if not (LOUNGE and side > 0) else ((-D, 0),):
        box(f'Skirt_{side}', .012, .04, z1 - z0, xw - side * .006, .02, (z0 + z1) / 2, M['reveal'], DARK)

# ilk odada sol duvarda kapı yok: boşluğu kapatan dolgu (kod oda 0'da gösterir, diğerlerinde gizler)
filler = box('MTG_WallL_Filler', .02, DOOR_H, DOOR_W, XL - .01 - .005, DOOR_H / 2, DOOR_Z, M['micro'], BAKE['filler'])
filler.hide_render = True            # ana bake'te kapı açık kabul edilir

# ceviz lamel duvar (araç odası, sağ arka) — oturma köşesinin arka planı
if not LOUNGE:
    wx0, wx1 = trav_x1, XR
    box('Walnut_Back', wx1 - wx0, H, .03, (wx0 + wx1) / 2, H / 2, BZ + .035, M['reveal'], DARK)   # lameller arası koyu derz
    pitch, sw = .075, .045
    n = int((wx1 - wx0 - .02) / pitch)
    off = (wx1 - wx0 - n * pitch) / 2
    for i in range(n):
        box(f'Slat_{i}', sw, H - .1, .028, wx0 + off + pitch * (i + .5), H / 2, BZ + .064, M['walnut'], BAKE['back'],
            origin=(wx0 + off + pitch * i, 0, 0))

# ---------------- tavan ----------------
# antrasit tavan + gömme ışık kasası (0.28 m derin, siyah iç yüzler) + lineer LED kanalları + çevre gölge boşluğu
lx, lz, lw, ld = LIGHTBOX
CH = H
holes_z = []
# tavan düzlemi kasa boşluğuyla (4 parça)
def ceil_quad(name, x0, x1, z0, z1):
    return poly_mesh(name, [(x0, CH, z0), (x1, CH, z0), (x1, CH, z1), (x0, CH, z1)], [(0, 1, 2, 3)], M['ceiling'], BAKE['ceil'], tile=(2.4, 2.4))
gx0, gx1 = XL + .05, XR - .05          # duvarlardan 5 cm gölge boşluğu
gz0, gz1 = -D + .05, -.0
bx0, bx1, bz0, bz1 = lx - lw / 2, lx + lw / 2, lz - ld / 2, lz + ld / 2
ceil_quad('Ceil_A', gx0, gx1, gz0, bz0)
ceil_quad('Ceil_B', gx0, gx1, bz1, gz1)
ceil_quad('Ceil_C', gx0, bx0, bz0, bz1)
ceil_quad('Ceil_D', bx1, gx1, bz0, bz1)
# gölge boşluğu (çevre): tavan duvarlardan 5 cm ayrık; boşluğun 10 cm üstü koyu bant
for nm_, sx_, sz_, x_, z_ in (('L', .07, D, XL + .035, -D / 2), ('R', .07, D, XR - .035, -D / 2), ('B', W, .07, 0, -D + .035)):
    plane_h('Ceil_Gap_' + nm_, sx_, sz_, x_, CH + .1, z_, M['reveal'], DARK, down=True)
# ışık kasası iç yüzleri
DEP = .28
for sz_ in (-1, 1):
    box(f'Box_W{sz_}', lw + .04, DEP, .02, lx, CH + DEP / 2, lz + sz_ * (ld / 2 + .01), M['reveal'], DARK)
for sx_ in (-1, 1):
    box(f'Box_S{sx_}', .02, DEP, ld, lx + sx_ * (lw / 2 + .01), CH + DEP / 2, lz, M['reveal'], DARK)
dif = plane_h('MTG_Diffuser', lw, ld, lx, CH + DEP - .02, lz, M['diffuser'], EMISSIVE, down=True)
# lineer LED kanalları (x boyunca, gömme)
LED_Z = [-2.0, -11.2]
for i, z in enumerate(LED_Z):
    box(f'LED_Chan_{i}', W - 1.2, .05, .1, 0, CH - .025, z, M['reveal'], DARK)
    box(f'MTG_LED_{i}', W - 1.3, .012, .035, 0, CH - .056, z, M['led'], EMISSIVE)
# arka duvar yalayıcı (traverten üzerinde sıyırma ışığı)
box('Washer_Chan', W - .3, .06, .14, 0, CH - .03, -D + .2, M['reveal'], DARK)
box('MTG_LED_Washer', W - .4, .012, .03, 0, CH - .062, -D + .24, M['ledSoft'], EMISSIVE)

# ---------------- araç alanı / oturma köşesi ----------------
def sofa(x, z, yaw_deg=0., length=2.6, tag='Sofa'):
    parts = []
    parts.append(box(f'{tag}_plinth', length - .12, .08, .8, 0, .04, .02, M['plinth'], None))
    for sx in (-1, 1):
        parts.append(box(f'{tag}_seat{sx}', length / 2 - .2, .2, .78, sx * (length / 4 - .02), .31, .06, M['fabric'], None, bevel=.06, seg=4))
    parts.append(box(f'{tag}_base', length, .14, .95, 0, .15, 0, M['fabric'], None, bevel=.03, seg=3))
    parts.append(box(f'{tag}_back', length - .3, .36, .2, 0, .55, -.36, M['fabric'], None, bevel=.07, seg=4))
    for sd in (-1, 1):
        parts.append(box(f'{tag}_arm{sd}', .16, .5, .95, sd * (length / 2 - .08), .33, 0, M['fabric'], None, bevel=.04, seg=3))
    o = join(parts, 'MTG_' + tag)
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    o.location = P(x, 0, z); o.rotation_euler = (0, 0, math.radians(yaw_deg))
    PLAIN.append(o); return o

def block_table(x, z, tag='Table'):
    o = box('MTG_' + tag, .9, .35, .9, x, .175, z, M['travertine'], PLAIN, bevel=.015, seg=3, tile=(1.2, 2.4))
    anchor(f'MTG_Decor_{tag}_vase', x + .18, .35, z - .1, decor='ceramic_vase_01', scale=.85)
    return o

def planter(x, z, sc, tag):
    cylinder(f'MTG_{tag}', .30, .32, .6, x, 0, z, M['planter'], PLAIN, verts=64)
    cylinder(f'MTG_{tag}_soil', .3, .3, .01, x, .58, z, M['soil'], PLAIN, verts=32)
    anchor(f'MTG_Decor_{tag}_plant', x, .32, z, yaw=(sum(map(ord, tag)) * 37 % 360) * math.pi / 180, decor='potted_plant_02', scale=sc)

def pendant(x, z, length=1.8, tag='Pendant'):
    y = H - 1.6
    box(f'MTG_{tag}', length, .05, .08, x, y, z, M['black'], PLAIN)
    box(f'MTG_{tag}_LED', length - .04, .01, .05, x, y - .03, z, M['led'], EMISSIVE)
    for sx in (-.8, .8):
        cylinder(f'MTG_{tag}_wire{sx}', .003, .003, 1.6, x + sx * length / 1.8, y, z, M['black'], PLAIN, verts=6)

if not LOUNGE:
    # zemine gömülü fırçalanmış metal halka (r 3.42–3.47)
    N_ = 160
    rv = [(CAR[0] + r * math.cos(2 * math.pi * i / N_), .003, CAR[1] + r * math.sin(2 * math.pi * i / N_)) for r in (3.47, 3.42) for i in range(N_)]
    rf = [(i, (i + 1) % N_, N_ + (i + 1) % N_, N_ + i) for i in range(N_)]
    ring = poly_mesh('MTG_Ring', rv, rf, M['metal'], PLAIN)
    if ring.data.polygons[0].normal.z < 0:
        bpy.context.view_layer.objects.active = ring; bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT')
        bpy.ops.mesh.flip_normals(); bpy.ops.object.mode_set(mode='OBJECT')
    # cam bölme (oturma köşesi ile arka ofis arası): z=-10.2, x 1.8 → sağ duvar
    gz = -10.2; gx0_, gx1_ = 1.8, XR
    box('MTG_Glass_Partition', gx1_ - gx0_, H - .1, .012, (gx0_ + gx1_) / 2, H / 2, gz, M['glass'], PLAIN)
    box('MTG_Glass_Rail_B', gx1_ - gx0_, .05, .06, (gx0_ + gx1_) / 2, .025, gz, M['black'], PLAIN)
    box('MTG_Glass_Rail_T', gx1_ - gx0_, .05, .06, (gx0_ + gx1_) / 2, H - .025, gz, M['black'], PLAIN)
    box('MTG_Glass_Post', .04, H, .06, gx0_, H / 2, gz, M['black'], PLAIN)
    # cam arkası satış ofisi: alçak ceviz konsol + vazo
    box('MTG_Credenza', 2.4, .55, .5, 4.3, .315, -D + .36, M['walnut'], PLAIN, bevel=.006, seg=2, tile=(1., 1.))
    box('MTG_Credenza_Plinth', 2.3, .04, .44, 4.3, .02, -D + .36, M['plinth'], PLAIN)
    anchor('MTG_Decor_Credenza_vase', 3.6, .59, -D + .36, decor='brass_vase_02', scale=.9)
    # oturma grubu (cam bölmenin önü)
    sofa(4.3, gz + .75, 0)
    anchor('MTG_Decor_Chair', 2.6, 0, gz + 2.5, yaw=math.radians(150), decor='mid_century_lounge_chair', scale=1.)
    block_table(4.3, gz + 2.15)
    pendant(4.3, gz + 1.6)
    planter(XL + .55, -D + .8, 1.25, 'Planter_A')
    planter(XL + .55, -.9, 1.1, 'Planter_B')
    # kodun kullanacağı çapalar
    anchor('MTG_CarSpot', CAR[0], 0, CAR[1], yaw=CAR_YAW, mtg_anchor='car')
    anchor('MTG_Totem', -2.3, 0, -10.9, mtg_anchor='totem')
    anchor('MTG_BrandPanel', -.3, 2.65, -D + .05, mtg_anchor='brand', w=3.6, h=.7)
    anchor('MTG_Light', CAR[0], H - .27, CAR[1], mtg_anchor='light', w=lw, h=ld)
else:
    lzc = -D + 4.4
    sofa(0, -D + 2.2, 0, 3.0, 'Sofa')
    anchor('MTG_Decor_Chair_L', -2.3, 0, lzc + .8, yaw=math.radians(130), decor='mid_century_lounge_chair', scale=1.)
    anchor('MTG_Decor_Chair_R', 2.3, 0, lzc + .8, yaw=math.radians(230), decor='mid_century_lounge_chair', scale=1.)
    block_table(0, lzc)
    pendant(0, lzc - .2, 2.2)
    # traverten kahve bankosu + tabureler
    bx, bz = W / 2 - 2.3, -D / 2 + .6
    box('MTG_Counter', .9, 1.05, 3.6, bx, .525, bz, M['travertine'], PLAIN, bevel=.02, seg=3, tile=(1.2, 2.4))
    box('MTG_Counter_Plinth', .8, .06, 3.5, bx, .03, bz, M['plinth'], PLAIN)
    box('MTG_Counter_LED', .02, .012, 3.4, bx - .46, .07, bz, M['ledSoft'], EMISSIVE)
    for i, dz in enumerate((-1.0, 0, 1.0)):
        anchor(f'MTG_Decor_Stool_{i}', bx - .95, 0, bz + dz, yaw=math.radians(90), decor='bar_chair_round_01', scale=1.)
    anchor('MTG_Decor_Counter_vase', bx, 1.05, bz - 1.3, decor='brass_vase_02', scale=.9)
    planter(-W / 2 + .8, -D + .8, 1.3, 'Planter_A')
    planter(W / 2 - .8, -D + .8, 1.3, 'Planter_B')
    anchor('MTG_BrandPanel', 0, 3.0, -D + .05, mtg_anchor='brand', w=6.4, h=1.2)
    anchor('MTG_Light', lx, H - .27, lz, mtg_anchor='light', w=lw, h=ld)

# ---------------- vekiller: komşu odalar, cam cephe, totem, marka paneli ----------------
# Dışa aktarılmazlar (adları PX_). Bake'te ışığın kapıdan komşu odaya taşmasını ve totem gölgesini,
# önizlemede sitedeki kadrajı doğru göstermek için vardır.
def px_box(name, *a, **k):
    o = box('PX_' + name, *a, **k); PROXY.append(o); return o
def px_plane(name, *a, **k):
    o = plane_h('PX_' + name, *a, **k); PROXY.append(o); return o
for side in (-1, 1):
    if LOUNGE and side > 0: continue
    ox = side * W
    px_plane(f'NFloor{side}', W, D, ox, 0, -D / 2, M['floor'], None, origin=(ox - W / 2, 0, 0))
    px_plane(f'NCeil{side}', W, D, ox, H, -D / 2, M['ceiling'], None, down=True)
    px_box(f'NBack{side}', W, H, .05, ox, H / 2, -D - .025, M['travertine'], None, origin=(ox - W / 2, .06, 0))
    px_box(f'NWall{side}', .05, H, D, ox + side * (W / 2 - HALF_T + .025), H / 2, -D / 2, M['micro'], None)
# komşu odaların kendi yarım duvarları (kapı boşluklu), bu odanın duvarının arka yüzü
for side in (-1, 1):
    if LOUNGE and side > 0: continue
    xw = side * (W / 2 + HALF_T)
    o = wall_x(f'PX_NHalf{side}', xw, side, -D, 0, 0, H, M['micro'], None, holes=[DOOR_HOLE]); PROXY.append(o)
# cam cephe (z=0) + oda sınırlarında taş kolonlar (buildBuilding ile aynı)
px_box('Facade_Glass', W - .7, H, .02, 0, H / 2, .0, M['glass'], None)
for sx in (-1, 1): px_box(f'Facade_Col{sx}', .35, H, .7, sx * (W / 2 - .175), H / 2, .05, M['travertine'], None)
px_plane('Plaza', 40, 20, 0, -.02, 10.5, M['plinth'], None)
if not LOUNGE:
    # dijital totem (0.66 × 1.98 m) — kameraya dönük
    tx, tz = -2.3, -10.9; camx, camz = CAR[0] - 3.6, CAR[1] + 5.3
    t = px_box('Totem', .66, 1.98, .07, tx, 1.0, tz, M['black'], None)
    scr = px_box('Totem_Screen', .6, 1.9, .005, tx, 1.0, tz + .038, emissive('px_screen', '#1a1d22', 1.5), None)
    yaw = math.atan2(camx - tx, camz - tz)
    # kutuların konumu dünyaya uygulanmış; totemi kendi merkezi etrafında döndür
    for o in (t, scr):
        me = o.data; c = P(tx, 0, tz)
        for v in me.vertices:
            d = v.co - c; v.co = c + Vector((d.x * math.cos(yaw) - d.y * math.sin(yaw), d.x * math.sin(yaw) + d.y * math.cos(yaw), d.z))
    px_box('Totem_Base', .5, .03, .32, tx, .015, tz, M['black'], None)
bw, bh, by, bxp = (6.4, 1.2, 3.0, 0.) if LOUNGE else (3.6, .7, 2.65, -.3)
px_box('Brand_Halo', bw + .12, bh + .12, .004, bxp, by, -D + .052, emissive('px_halo', '#ffe7c8', 2.), None)
px_box('Brand_Plate', bw, bh, .04, bxp, by, -D + .075, M['bronze'], None)
px_box('Brand_Logo', bw * .6, bh * .28, .004, bxp, by, -D + .097, emissive('px_logo', '#f3dcb8', 6.), None)

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
def car_material(kind):
    spec = {'paint': dict(color='#681824', rough=.18, metal=.55, coat=1.), 'glass': None,
            'gloss': dict(color='#050506', rough=.08, metal=0., coat=1.), 'mirror': dict(color='#ffffff', rough=.02, metal=1.),
            'tire': dict(color='#141414', rough=.85), 'matte': dict(color='#0b0b0c', rough=.6), 'rim': dict(color='#141518', rough=.3, metal=.9),
            'caliper': dict(color='#1f4fd8', rough=.35), 'disc': dict(color='#6a6a6a', rough=.45, metal=.9), 'chrome': dict(color='#2a2b2e', rough=.15, metal=1.),
            'headlight': dict(color='#e8edf2', rough=.05, metal=.3), 'taillight': dict(color='#5a0508', rough=.08), 'plate': dict(color='#e8e8e8', rough=.5),
            'interior': dict(color='#141416', rough=.6)}[kind]
    key = 'car_' + kind
    if key in bpy.data.materials: return bpy.data.materials[key]
    if spec is None:
        m = glass(key); m.name = key; m.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value = (.05, .06, .07, 1); return m
    m = pbr(key, None, spec['color'], rough=spec['rough'], metal=spec.get('metal', 0.), coat=spec.get('coat', 0.)); m.name = key
    return m

def place_car():
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
            s.material = car_material(kind)
    bpy.context.view_layer.update()
    mn = Vector((1e9,) * 3); mx = -mn
    for o in meshes:
        for c in o.bound_box:
            w = o.matrix_world @ Vector(c); mn = Vector(map(min, mn, w)); mx = Vector(map(max, mx, w))
    size = mx - mn; ctr = (mn + mx) / 2
    root = bpy.data.objects.new('PX_CarRoot', None); link(root)
    pivot = bpy.data.objects.new('PX_CarPivot', None); link(pivot); pivot.parent = root
    for o in objs:
        if o.parent is None: o.parent = pivot; o.matrix_parent_inverse.identity()
    long_y = size.y > size.x
    L = max(size.x, size.y); s = 4.77 / L
    pivot.scale = (s,) * 3
    pivot.location = (-ctr.x * s, -ctr.y * s, -mn.z * s)
    # three: uzun kenar z ise +90° (ön +z → +x), sonra turn.rotation.y = CAR_YAW
    root.rotation_euler = (0, 0, (math.pi / 2 if long_y else 0) + CAR_YAW)
    # pivot konumu dönüşten önce uygulanmalı: pivot yerel ofseti → kök döner
    root.location = P(CAR[0], .012, CAR[1])
    PROXY.extend(objs + [root, pivot]); CAR_OBJS.extend(objs)
    log('araç yerleşti, boy %.2f m' % (L * s))
    return root

CAR_OBJS = []
car_root = None if LOUNGE else place_car()

# ---------------- ışıklar (bake + önizleme) ----------------
world = bpy.data.worlds.new('MTG_Dusk'); scene.world = world; world.use_nodes = True
bg = world.node_tree.nodes['Background']; bg.inputs['Color'].default_value = (*hexrgb('#2c3546'), 1); bg.inputs['Strength'].default_value = .25
LIGHTS = []
def area(name, x, y, z, sx, sz, power, color='#fff3e6', aim=None, spread=180):
    bpy.ops.object.light_add(type='AREA', location=P(x, y, z))
    l = bpy.context.active_object; l.name = name
    l.data.shape = 'RECTANGLE'; l.data.size = sx; l.data.size_y = sz
    l.data.energy = power; l.data.color = hexrgb(color); l.data.spread = math.radians(spread)
    if aim is not None:
        d = P(*aim) - l.location; l.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler()
    LIGHTS.append(l); return l
# ışık kasası: difüzör düzleminde aşağı bakan alan ışığı (≈ 1200 lux araç üstünde)
area('L_Lightbox', lx, CH + DEP - .03, lz, lw, ld, 2600 if not LOUNGE else 1700, '#fff6ec' if not LOUNGE else '#ffe9d2')
for i, z in enumerate(LED_Z):
    area(f'L_Linear_{i}', 0, CH - .06, z, W - 1.3, .04, 520, '#fff4e4', spread=120)
area('L_Washer', 0, CH - .07, -D + .24, W - .4, .03, 420, '#ffeedd', aim=(0, 0, -D + .2), spread=70)
for side in (-1, 1):   # komşu odaların ışık kasası (vekil)
    if LOUNGE and side > 0: continue
    area(f'L_Neighbor{side}', side * W + CAR[0], CH - .05, CAR[1], 7.2, 4.2, 2600, '#fff6ec')
    area(f'L_NLinear{side}', side * W, CH - .06, -2.0, W - 1.3, .04, 520, '#fff4e4', spread=120)
area('L_Pendant', 4.3 if not LOUNGE else 0, H - 1.64, -8.6 if not LOUNGE else -D + 4.2, 1.7, .04, 90, '#ffe7c8')

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
scene.view_settings.exposure = -1.6

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
        'bmw':    ((CAR[0] - 3.6, 1.6, CAR[1] + 5.3), (CAR[0] + .2, .75, CAR[1] - .4), 40),
        'wide':   ((5.6, 1.75, -.4), (-2.2, 1.3, -9.5), 52),
        'lounge': ((.2, 1.45, -4.6), (4.6, 1.0, -10.6), 46),
        'door':   ((-2.4, 1.6, -8.4), (XR, 1.45, -2.9), 50),
    },
    'lounge': {
        'wide':   ((-1.0, 1.7, -1.0), (0.6, 1.4, -13), 52),
        'bar':    ((-2.5, 1.5, -3.5), (4.2, 1.0, -6.0), 46),
    },
}[VARIANT]

def run_previews():
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
    planar_lm(BAKE['ceil'], lambda x, y, z: ((x + W / 2) / W, (z + D) / D))
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
