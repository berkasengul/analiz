"""Araç modeline ortam kapanması (AO) pişirir: tekerlek yuvaları, panel aralıkları, alt gövde ve iç mekân koyulaşır.
Araç turda yalnız dikey eksende döndüğü için zemin düzlemiyle birlikte pişirilen AO her açıda geçerlidir.

Kullanım (tools/car_ao.sh hattı içinde):
  blender -b --factory-startup --python tools/blender/car_ao.py -- düz.glb ao.json [örnek=64]
Girdi: dequantize edilmiş GLB (mesh adları M0, M1, …). Çıktı: {mesh adı: [x, y, z, ao, …]} (glTF yerel ekseni).
"""
import bpy, sys, json, math
from mathutils import Vector
argv = sys.argv[sys.argv.index('--') + 1:]
src, out = argv[0], argv[1]
samples = int(argv[2]) if len(argv) > 2 else 64
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=src)
meshes = [o for o in bpy.context.scene.objects if o.type == 'MESH']
# dünya sınırları → AO mesafesi araç boyuna göre (4.8 m araçta ~0.32 m)
pts = [o.matrix_world @ Vector(c) for o in meshes for c in o.bound_box]
lo = Vector((min(p.x for p in pts), min(p.y for p in pts), min(p.z for p in pts)))
hi = Vector((max(p.x for p in pts), max(p.y for p in pts), max(p.z for p in pts)))
L = max(hi.x - lo.x, hi.y - lo.y)
print('[AO] mesh', len(meshes), 'boy', round(L, 3))
# zemin: aracın altında, gölge/kapanma için
bpy.ops.mesh.primitive_plane_add(size=L * 4, location=((lo.x + hi.x) / 2, (lo.y + hi.y) / 2, lo.z))
sc = bpy.context.scene
sc.render.engine = 'CYCLES'; sc.cycles.device = 'CPU'; sc.cycles.samples = samples
sc.world = bpy.data.worlds.new('w'); sc.world.light_settings.distance = .068 * L
sc.render.bake.target = 'VERTEX_COLORS'
done = set()
for o in meshes:
    if o.data.name in done: continue
    done.add(o.data.name)
    ca = o.data.color_attributes.new('AO', 'FLOAT_COLOR', 'POINT')
    o.data.color_attributes.active_color = ca
    for m in o.data.materials:      # bake malzeme gerektirmez ama boş slotlar sorun çıkarabilir
        pass
bpy.ops.object.select_all(action='DESELECT')
for o in meshes: o.select_set(True)
bpy.context.view_layer.objects.active = meshes[0]
bpy.ops.object.bake(type='AO')
res = {}
for o in meshes:
    me = o.data
    if me.name in res: continue
    ca = me.color_attributes['AO']; flat = []
    for v, c in zip(me.vertices, ca.data):
        flat += [round(v.co.x, 6), round(v.co.z, 6), round(-v.co.y, 6), round(c.color[0], 3)]
    res[me.name] = flat
json.dump(res, open(out, 'w'))
print('[AO] yazıldı', out, len(res), 'mesh')
