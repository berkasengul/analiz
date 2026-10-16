# MTG MOTORS — Brütalist galeri (lobi + beton geçiş portalı + 12 m yüksekliğinde ana salon), ışık haritası fırınlı tek GLB.
# Site ölçüleri (index.html): cephe z = 0, iç alan |x| < 16.35, z 0 … −62; araç modülleri koridor (|x| < 3) iki yanında 13 m aralıkla.
# Kullanım: blender -b --factory-startup --python tools/blender/mtg_brutal.py -- --out DIR [--lm 2048] [--bake-samples 64] [--preview]
# Çıktı: room_brutal.glb + room_brutal_lm_{floor,walls,ceiling}.webp (sitedeki lightmap yükleyicisiyle aynı extras: lightmap, lmScale)
import bpy, bmesh, math, os, sys, time
import numpy as np
from mathutils import Vector

argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
def opt(k, d=None): return argv[argv.index(k) + 1] if k in argv else d
OUT = opt('--out', '/tmp/brutal'); os.makedirs(OUT, exist_ok=True)
LM = int(opt('--lm', '2048')); BAKE_SAMPLES = int(opt('--bake-samples', '64')); PREVIEW = '--preview' in argv
HERE = os.path.dirname(os.path.abspath(__file__)); TEX = os.path.join(HERE, '..', '..', 'textures')
T0 = time.time()
def log(*a): print('[BRUTAL %6.1fs]' % (time.time() - T0), *a, flush=True)
bpy.ops.wm.read_factory_settings(use_empty=True); sc = bpy.context.scene

# ---------------- ölçüler (site koordinatı: x sağ, y yukarı, z sokağa doğru; Blender'a P() ile) ----------------
XI = 16.35                     # iç yan duvar yüzü
REC_D = 10.0                   # lobi derinliği (z 0 … −10)
WALL_T = 1.2                   # geçiş duvarı kalınlığı (z −10 … −11.2)
HALL_Z0, HALL_Z1 = -REC_D - WALL_T, -62.0
LOBBY_H, HALL_H = 4.8, 12.0
PORT_W, PORT_H = 6.0, 4.8      # beton geçiş portalı (koridor)
BEAM_W, BEAM_D = .7, 1.5       # tavan kirişleri
ROOM_D, CORR = 13.0, 3.0
def P(x, y, z): return (x, -z, y)

def hexrgb(h):
    h = h.lstrip('#'); c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return [v / 12.92 if v <= .04045 else ((v + .055) / 1.055) ** 2.4 for v in c]

def pbr(name, tex=None, color='#ffffff', rough=.5, metal=0., normal=.4, coat=0.):
    m = bpy.data.materials.new(name); m.use_nodes = True; nt = m.node_tree; b = nt.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*hexrgb(color), 1); b.inputs['Roughness'].default_value = rough; b.inputs['Metallic'].default_value = metal
    if coat: b.inputs['Coat Weight'].default_value = coat; b.inputs['Coat Roughness'].default_value = .08
    if tex:
        def img(fn, cs):
            p = os.path.join(TEX, tex, fn)
            if not os.path.exists(p): return None
            n = nt.nodes.new('ShaderNodeTexImage'); n.image = bpy.data.images.load(p, check_existing=True); n.image.colorspace_settings.name = cs
            uv = nt.nodes.new('ShaderNodeUVMap'); uv.uv_map = 'UVMap'; nt.links.new(uv.outputs['UV'], n.inputs['Vector']); return n
        d = img('Diffuse.webp', 'sRGB'); r = img('Rough.webp', 'Non-Color'); nm = img('nor_gl.webp', 'Non-Color')
        if d: nt.links.new(d.outputs['Color'], b.inputs['Base Color'])
        if r: nt.links.new(r.outputs['Color'], b.inputs['Roughness'])
        if nm:
            nn = nt.nodes.new('ShaderNodeNormalMap'); nn.uv_map = 'UVMap'; nn.inputs['Strength'].default_value = normal
            nt.links.new(nm.outputs['Color'], nn.inputs['Color']); nt.links.new(nn.outputs['Normal'], b.inputs['Normal'])
    return m

def emissive(name, color, k):
    m = bpy.data.materials.new(name); m.use_nodes = True; b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (0, 0, 0, 1); b.inputs['Emission Color'].default_value = (*hexrgb(color), 1); b.inputs['Emission Strength'].default_value = k
    return m

M = {
    'floor': pbr('MTG_brut_floor', 'brut_floor', rough=.28, normal=.25, coat=.35),
    'concrete': pbr('MTG_brut_concrete', 'brut_concrete', rough=.85, normal=.6),
    'ceil': pbr('MTG_brut_ceiling', 'brut_concrete', rough=.9, normal=.6),
    'groove': pbr('MTG_reveal', None, '#121212', rough=.9),
    'bronze': pbr('MTG_bronze', None, '#5a4630', rough=.35, metal=1.),
    'led': emissive('MTG_ledSoft', '#ffe2bd', 10.),
    'sky': emissive('MTG_sky', '#eef3ff', 3.),
}

# ---------------- örgü: dörtgenler (UVMap metrik, lightmap atlas) ----------------
GROUPS = {'floor': [], 'walls': [], 'ceil': []}
PLAIN = []
def quad(name, vs, tex_uv, lm_uv, mat, group):
    bm = bmesh.new(); uvm = bm.loops.layers.uv.new('UVMap'); uvl = bm.loops.layers.uv.new('lightmap')
    f = bm.faces.new([bm.verts.new(P(*v)) for v in vs])
    for lp, v in zip(f.loops, vs): lp[uvm].uv = tex_uv(*v); lp[uvl].uv = lm_uv(*v)
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    o = bpy.data.objects.new(name, me); sc.collection.objects.link(o); me.materials.append(mat)
    (group if group is not None else PLAIN).append(o); return o

def box(name, sx, sy, sz, x, y, z, mat, group=None):
    bpy.ops.mesh.primitive_cube_add(size=1, location=P(x, y, z)); o = bpy.context.active_object; o.name = name
    o.scale = (sx, sz, sy); bpy.ops.object.transform_apply(scale=True); o.data.materials.append(mat)
    (group if group is not None else PLAIN).append(o); return o

# zemin: lobi + salon tek düzlem (|x| < XI, z 0 … −62)
FX, FZ = 2 * XI, 62.0
flm = lambda x, y, z: (.005 + .99 * (x + XI) / FX, .005 + .99 * (-z) / FZ)
fl = [(-XI, 0, 0), (XI, 0, 0), (XI, 0, -62), (-XI, 0, -62)]
quad('MTG_Floor', fl, lambda x, y, z: (x / 3, -z / 3), flm, M['floor'], GROUPS['floor'])

# duvar atlası (anizotrop satırlar): 0 arka (marka) duvarı, 1 geçiş duvarı salon yüzü, 2 geçiş duvarı lobi yüzü, 3 sol, 4 sağ
ROWS = [(0, FX, HALL_H), (1, FX, HALL_H), (2, FX, LOBBY_H), (3, 62., HALL_H), (4, 62., HALL_H)]
VTOT = sum(r[2] for r in ROWS); GAP = .012
def row_uv(row):
    _, ln, h = ROWS[row]; v0 = GAP + sum(r[2] for r in ROWS[:row]) / VTOT * (1 - GAP * (len(ROWS) + 1)) + GAP * row
    vh = h / VTOT * (1 - GAP * (len(ROWS) + 1))
    def f(a, y): return (.01 + .98 * a / ln, v0 + vh * y / h)
    return f
r0, r1, r2, r3, r4 = (row_uv(i) for i in range(5))
cuv = lambda s: (lambda x, y, z: (s[0](x, y, z) / 2.4, s[1](x, y, z) / 2.4))
# arka duvar (z = −62, +z'ye bakar)
quad('W_Back', [(-XI, 0, -62), (XI, 0, -62), (XI, HALL_H, -62), (-XI, HALL_H, -62)], lambda x, y, z: (x / 2.4, y / 2.4),
     lambda x, y, z: r0(x + XI, y), M['concrete'], GROUPS['walls'])
# geçiş duvarı salon yüzü (z = HALL_Z0, −z'ye bakar), portal boşluğu
zt = HALL_Z0
for nm, (xa, xb, ya, yb) in {'L': (-XI, -PORT_W / 2, 0, HALL_H), 'R': (PORT_W / 2, XI, 0, HALL_H), 'T': (-PORT_W / 2, PORT_W / 2, PORT_H, HALL_H)}.items():
    quad(f'W_TransH{nm}', [(xb, ya, zt), (xa, ya, zt), (xa, yb, zt), (xb, yb, zt)], lambda x, y, z: (x / 2.4, y / 2.4),
         lambda x, y, z: r1(x + XI, y), M['concrete'], GROUPS['walls'])
# geçiş duvarı lobi yüzü (z = −REC_D, +z'ye bakar)
zl = -REC_D
for nm, (xa, xb, ya, yb) in {'L': (-XI, -PORT_W / 2, 0, LOBBY_H), 'R': (PORT_W / 2, XI, 0, LOBBY_H)}.items():
    quad(f'W_TransL{nm}', [(xa, ya, zl), (xb, ya, zl), (xb, yb, zl), (xa, yb, zl)], lambda x, y, z: (x / 2.4, y / 2.4),
         lambda x, y, z: r2(x + XI, y), M['concrete'], GROUPS['walls'])
# yan duvarlar (sol x = −XI +x'e bakar; sağ x = XI −x'e bakar); lobide 4.8 m, salonda 12 m
for side, row in ((-1, r3), (1, r4)):
    x = side * XI
    for nm, (za, zb, h) in {'Lobby': (0, -REC_D, LOBBY_H), 'Hall': (HALL_Z0 + .001, -62, HALL_H)}.items():
        vs = [(x, 0, za), (x, 0, zb), (x, h, zb), (x, h, za)] if side < 0 else [(x, 0, zb), (x, 0, za), (x, h, za), (x, h, zb)]
        quad(f'W_Side{side}{nm}', vs, lambda x_, y, z: (-z / 2.4, y / 2.4), lambda x_, y, z: row(-z, y), M['concrete'], GROUPS['walls'])
    # geçiş duvarı kalınlığındaki yan şerit (salon duvarı lobi duvarına bağlanır)
    vs = [(x, 0, -REC_D), (x, 0, HALL_Z0), (x, HALL_H, HALL_Z0), (x, HALL_H, -REC_D)] if side < 0 else [(x, 0, HALL_Z0), (x, 0, -REC_D), (x, HALL_H, -REC_D), (x, HALL_H, HALL_Z0)]
    quad(f'W_SideStrip{side}', vs, lambda x_, y, z: (-z / 2.4, y / 2.4), lambda x_, y, z: row(-z, y), M['concrete'], GROUPS['walls'])

# tavanlar: lobi (4.8, aşağı bakar) + salon (12, aşağı bakar) + kirişler + portal yanakları — lightmap: otomatik paketleme
def ceil_quad(name, x0, x1, z0, z1, y):
    # köşe sırası aşağı bakan yüz verir
    return quad(name, [(x0, y, z0), (x0, y, z1), (x1, y, z1), (x1, y, z0)], lambda x, y_, z: (x / 2.4, -z / 2.4), lambda x, y_, z: (0, 0), M['ceil'], GROUPS['ceil'])
ceil_quad('C_Lobby', -XI, XI, 0, -REC_D, LOBBY_H)
# salon tavanı: kiriş araları; orta şeritte (|x| < 2.2) ışıklık yarığı (tavan yok → gökyüzü paneli), sonda büyük ışıklık
beams_z = [HALL_Z0 - 6.5 * k for k in range(1, 8)]
SKY_X = 2.2
ceil_quad('C_HallL', -XI, -SKY_X, HALL_Z0, -54.0, HALL_H); ceil_quad('C_HallR', SKY_X, XI, HALL_Z0, -54.0, HALL_H)
ceil_quad('C_HallEndL', -XI, -9.0, -54.0, -62, HALL_H); ceil_quad('C_HallEndR', 9.0, XI, -54.0, -62, HALL_H)
for i, bz in enumerate(beams_z):
    box(f'C_Beam{i}', 2 * XI, BEAM_D, BEAM_W, 0, HALL_H - BEAM_D / 2, bz, M['ceil'], GROUPS['ceil'])
# ışıklık camı (emisyon) — yarık + sondaki büyük ışıklık
box('MTG_Sky_Slot', 2 * SKY_X, .05, HALL_Z0 - (-54.0), 0, HALL_H + .6, (HALL_Z0 - 54.0) / 2, M['sky'])
box('MTG_Sky_End', 18.0, .05, 8.0, 0, HALL_H + .6, -58.0, M['sky'])
for sx in (-1, 1):   # ışıklık kuyusu yan yüzleri (yarığın iki yanında 0.6 m beton bilezik)
    box(f'C_SlotSide{sx}', .2, .6, HALL_Z0 + 54.0, sx * (SKY_X + .1), HALL_H + .3, (HALL_Z0 - 54.0) / 2, M['ceil'], GROUPS['ceil'])
box('C_EndWell_L', .2, .6, 8.0, -9.1, HALL_H + .3, -58, M['ceil'], GROUPS['ceil']); box('C_EndWell_R', .2, .6, 8.0, 9.1, HALL_H + .3, -58, M['ceil'], GROUPS['ceil'])
box('C_EndWell_F', 18.2, .6, .2, 0, HALL_H + .3, -53.9, M['ceil'], GROUPS['ceil'])
# portal yanakları (geçiş duvarı kalınlığı) + tavan alnı
for sx in (-1, 1):
    x = sx * PORT_W / 2
    quad(f'C_PortJamb{sx}', [(x, 0, -REC_D), (x, 0, HALL_Z0), (x, PORT_H, HALL_Z0), (x, PORT_H, -REC_D)][::(1 if sx < 0 else -1)],
         lambda x_, y, z: (-z / 2.4, y / 2.4), lambda *a: (0, 0), M['concrete'], GROUPS['ceil'])
ceil_quad('C_PortHead', -PORT_W / 2, PORT_W / 2, -REC_D, HALL_Z0, PORT_H)
# portal: bronz iç çerçeve + yanaklarda dikey LED (geçişi vurgular)
for sx in (-1, 1):
    box(f'MTG_PortTrim{sx}', .06, PORT_H, WALL_T, sx * (PORT_W / 2 - .03), PORT_H / 2, (-REC_D + HALL_Z0) / 2, M['bronze'])
    box(f'MTG_LED_Port{sx}', .02, PORT_H - .4, .02, sx * (PORT_W / 2 - .07), PORT_H / 2, -REC_D - .05, M['led'])

# beton kalıp derzleri (yatay her 2.4 m, dikey her 4.8 m) + bağlantı delikleri yok (performans): tek birleşik örgü
def grooves():
    objs = []
    for y in np.arange(2.4, HALL_H, 2.4):
        objs.append(box(f'G_B{y:.1f}', 2 * XI, .02, .015, 0, y, -62 + .006, M['groove']))
        for sx in (-1, 1): objs.append(box(f'G_S{sx}{y:.1f}', .015, .02, 62 - REC_D - WALL_T, sx * (XI - .006), y, (HALL_Z0 - 62) / 2, M['groove']))
    for x in np.arange(-XI + 4.8, XI, 4.8): objs.append(box(f'G_BV{x:.1f}', .02, HALL_H, .015, x, HALL_H / 2, -62 + .006, M['groove']))
    for z in np.arange(HALL_Z0 - 4.8, -62, -4.8):
        for sx in (-1, 1): objs.append(box(f'G_SV{sx}{z:.1f}', .015, HALL_H, .02, sx * (XI - .006), HALL_H / 2, z, M['groove']))
    for o in objs: PLAIN.remove(o)
    bpy.ops.object.select_all(action='DESELECT')
    for o in objs: o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]; bpy.ops.object.join()
    j = bpy.context.active_object; j.name = 'MTG_Grooves'; PLAIN.append(j)
grooves()
# duvar diplerinde gölge boşluğu (zemin ile beton arasında ince koyu çizgi: duvar 'yüzer')
for sx in (-1, 1): box(f'MTG_Gap{sx}', .04, .06, 62 - REC_D - WALL_T, sx * (XI - .02), .03, (HALL_Z0 - 62) / 2, M['groove'])
box('MTG_GapBack', 2 * XI, .06, .04, 0, .03, -62 + .02, M['groove'])
# yan duvarlarda modül sınırlarında gömme dikey ışık yarıkları (araç bölmelerini sessizce ayırır)
for k in range(5):
    z = HALL_Z0 - 13.0 * k + (0 if k else -.6)
    for sx in (-1, 1):
        box(f'MTG_LED_Wall{sx}{k}', .02, HALL_H - 1.0, .06, sx * (XI - .02), (HALL_H - 1.0) / 2 + .2, z, M['led'])
# lobi: monolit beton resepsiyon bankosu (bronz üst kenar) + tavanda iki lineer ışık
box('MTG_Desk', 4.6, 1.08, 1.1, -9.0, .54, -5.6, M['concrete']); box('MTG_DeskTop', 4.7, .03, 1.2, -9.0, 1.095, -5.6, M['bronze'])
for x in (-6.0, 6.0): box(f'MTG_LED_Lobby{x:+.0f}', .06, .02, 8.2, x, LOBBY_H - .01, -5.0, M['led'])

# marka yazısı çapaları (yazı sitede Cinzel konturlarından üretilir; boyut extras ile)
for nm, y, cap, w in (('MTG_BrandText', 7.2, .95, 10.4), ('MTG_BrandSubText', 5.95, .3, 7.4)):
    e = bpy.data.objects.new(nm, None); sc.collection.objects.link(e); e.location = P(0, y, -62 + .01)
    e['mtg_anchor'] = 'brandtext'; e['cap'] = cap; e['width'] = w

# ---------------- ışıklar (fırın) ----------------
def area(name, loc, size, energy, color='#fff3e4', aim=None, size_y=None):
    ld = bpy.data.lights.new(name, 'AREA'); ld.energy = energy; ld.color = hexrgb(color); ld.shape = 'RECTANGLE'
    ld.size = size; ld.size_y = size_y or size
    o = bpy.data.objects.new(name, ld); sc.collection.objects.link(o); o.location = P(*loc)
    if aim: o.rotation_euler = (Vector(P(*aim)) - Vector(P(*loc))).to_track_quat('-Z', 'Y').to_euler()
    o.visible_camera = False; return o
# ışıklık: orta yarık boyunca gün ışığı (serin), sonda büyük ışıklık marka duvarını yıkar
for i in range(7):
    z = HALL_Z0 - 3.25 - 6.5 * i
    area(f'L_Slot{i}', (0, HALL_H + .5, z), 3.6, 1400, '#eef2ff', aim=(0, 0, z), size_y=5.6)
area('L_SkyEnd', (0, HALL_H + .5, -58), 16, 5200, '#f2f4ff', aim=(0, 0, -58), size_y=7)
area('L_BrandWash', (0, HALL_H - .6, -59.5), 14, 2600, '#fff1de', aim=(0, 5, -62), size_y=1.0)
# araç ışık havuzları (modül araç konumları; sitedeki carPos ile aynı)
def car_pos(k):
    half = 4; side, row = (-1, k) if k < half else (1, 7 - k)
    zc = -REC_D - ROOM_D / 2 - ROOM_D * row
    return (side * (CORR + 6.2), zc + (1 if side < 0 else -1))
for k in range(7):
    x, z = car_pos(k)
    area(f'L_Car{k}', (x, HALL_H - 1.6, z), 6.0, 2000, '#fff0dc', aim=(x, 0, z), size_y=3.6)
for x in (-6.0, 6.0): area(f'L_Lobby{x:+.0f}', (x, LOBBY_H - .05, -5.0), .3, 700, '#ffe8cc', aim=(x, 0, -5.0), size_y=8)
# duvar yalayıcılar: yan duvarları ve marka duvarını tepeden sıyırır → beton dokusu ve kalıp derzleri belirginleşir (sıcak)
for sx in (-1, 1):
    area(f'L_Graze{sx}', (sx * (XI - .5), HALL_H - .4, (HALL_Z0 - 62) / 2), .25, 2400, '#ffe6c8', aim=(sx * XI, 0, (HALL_Z0 - 62) / 2), size_y=48)
area('L_GrazeBack', (0, HALL_H - .4, -61.5), 30, 1800, '#ffe6c8', aim=(0, 0, -62), size_y=.25)
w = bpy.data.worlds.new('w'); sc.world = w; w.use_nodes = True
w.node_tree.nodes['Background'].inputs['Color'].default_value = (*hexrgb('#141820'), 1); w.node_tree.nodes['Background'].inputs['Strength'].default_value = .35

sc.render.engine = 'CYCLES'; sc.cycles.device = 'CPU'
sc.cycles.max_bounces = 5; sc.cycles.diffuse_bounces = 3; sc.cycles.glossy_bounces = 2
sc.cycles.caustics_reflective = False; sc.cycles.caustics_refractive = False; sc.cycles.sample_clamp_indirect = 3.; sc.cycles.blur_glossy = 1.
try: sc.view_settings.view_transform = 'AgX'; sc.view_settings.look = 'AgX - Medium High Contrast'
except Exception: pass

if PREVIEW:
    def preview(name, pos, look, lens):
        cd = bpy.data.cameras.new(name); cd.lens = lens; cd.clip_end = 300
        o = bpy.data.objects.new(name, cd); sc.collection.objects.link(o); o.location = P(*pos)
        o.rotation_euler = (Vector(P(*look)) - Vector(P(*pos))).to_track_quat('-Z', 'Y').to_euler(); sc.camera = o
        sc.render.resolution_x, sc.render.resolution_y = 960, 540; sc.cycles.samples = 24; sc.cycles.use_denoising = True
        sc.render.image_settings.file_format = 'JPEG'; sc.render.filepath = os.path.join(OUT, f'preview_{name}.jpg')
        bpy.ops.render.render(write_still=True); log('önizleme', name)
    preview('hall', (0, 1.7, -13), (0, 5, -62), 18)
    preview('lobby', (0, 1.7, -1), (0, 2.5, -30), 20)
    sys.exit(0)

# ---------------- fırın ----------------
def join_group(objs, name):
    bpy.ops.object.select_all(action='DESELECT')
    for o in objs: o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    if len(objs) > 1: bpy.ops.object.join()
    o = bpy.context.active_object; o.name = name; return o

def bake(obj, size, label):
    image = bpy.data.images.new('LM_' + label, size, size, float_buffer=True); nodes = []
    for slot in obj.material_slots:
        nt = slot.material.node_tree; n = nt.nodes.new('ShaderNodeTexImage'); n.image = image; nt.nodes.active = n; nodes.append((nt, n))
    bpy.ops.object.select_all(action='DESELECT'); obj.select_set(True); bpy.context.view_layer.objects.active = obj
    sc.cycles.samples = BAKE_SAMPLES; sc.render.bake.margin = 8; t = time.time()
    bpy.ops.object.bake(type='DIFFUSE', pass_filter={'DIRECT', 'INDIRECT'}, uv_layer='lightmap', margin=8, use_clear=True)
    for nt, n in nodes: nt.nodes.remove(n)
    px = np.array(image.pixels[:], dtype=np.float32).reshape(size, size, 4)[..., :3]
    log(f'bake {label} {size} {time.time() - t:.0f}s ort {px.mean():.3f}'); return px

def denoise(rgb):
    st = np.stack([np.roll(np.roll(rgb, dy, 0), dx, 1) for dy in (-1, 0, 1) for dx in (-1, 0, 1)]); rgb = np.median(st, axis=0)
    k = np.array([1, 4, 6, 4, 1], np.float32); k /= k.sum()
    for ax in (0, 1): rgb = sum(np.roll(rgb, s, axis=ax) * w_ for s, w_ in zip(range(-2, 3), k))
    return rgb

def save_lm(rgb, scale, fname):
    enc = np.clip(rgb / scale, 0, 1) ** (1 / 2.2); h, w_ = enc.shape[:2]
    im = bpy.data.images.new(fname, w_, h, alpha=False)
    im.pixels = np.concatenate([enc, np.ones((h, w_, 1), np.float32)], axis=2).ravel().tolist()
    im.filepath_raw = os.path.join(OUT, fname); im.file_format = 'WEBP'; im.save(); return fname

emis = []
for m in bpy.data.materials:
    b = m.node_tree.nodes.get('Principled BSDF') if m.use_nodes else None
    if b and b.inputs['Emission Strength'].default_value > 0: emis.append((b, b.inputs['Emission Strength'].default_value)); b.inputs['Emission Strength'].default_value = 0
floor = join_group(GROUPS['floor'], 'MTG_Floor')
walls = join_group(GROUPS['walls'], 'MTG_Walls')
ceil = join_group(GROUPS['ceil'], 'MTG_Ceiling')
# tavan + kirişler + portal yanakları: kutu yüzleri için otomatik lightmap paketleme
bpy.ops.object.select_all(action='DESELECT'); ceil.select_set(True); bpy.context.view_layer.objects.active = ceil
ceil.data.uv_layers.active = ceil.data.uv_layers['lightmap']
bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT')
bpy.ops.uv.lightmap_pack(PREF_CONTEXT='ALL_FACES', PREF_PACK_IN_ONE=True, PREF_NEW_UVLAYER=False, PREF_BOX_DIV=24, PREF_MARGIN_DIV=.25)
bpy.ops.object.mode_set(mode='OBJECT'); ceil.data.uv_layers.active = ceil.data.uv_layers['UVMap']
res = {'floor': denoise(bake(floor, LM, 'floor')), 'walls': denoise(bake(walls, LM, 'walls')), 'ceiling': denoise(bake(ceil, LM // 2, 'ceiling'))}
scale = float(max(np.percentile(res[k].max(axis=2), 99.7) for k in ('floor', 'walls'))) or 1.
for key, obj in (('floor', floor), ('walls', walls), ('ceiling', ceil)):
    obj['lightmap'] = save_lm(res[key], scale, f'room_brutal_lm_{key}.webp'); obj['lmScale'] = scale
for b, v in emis: b.inputs['Emission Strength'].default_value = v

for o in sc.objects: o.select_set(o.type in ('MESH', 'EMPTY'))
path = os.path.join(OUT, 'room_brutal.glb')
bpy.ops.export_scene.gltf(filepath=path, export_format='GLB', use_selection=True, export_extras=True, export_yup=True, export_apply=True,
                          export_lights=False, export_cameras=False, export_texcoords=True, export_normals=True, export_image_format='WEBP')
log('GLB', path, '%.1f MB' % (os.path.getsize(path) / 1e6)); log('bitti')
