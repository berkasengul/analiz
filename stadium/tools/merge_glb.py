"""Flatten a GLB (e.g. converted from SketchUp) into one mesh with one primitive per material.

Usage: python3 -I tools/merge_glb.py in.glb out.glb [--drop "Material A" "Material B" ...]
- bakes every node transform into the vertices (output is in metres, Y up, as the root node defines)
- merges all primitives that share a material (12k draw calls -> ~50)
- drops primitives whose material name is listed after --drop
- prints a per-material bounding box so the model can be aligned
"""
import json, struct, sys
import numpy as np

args = sys.argv[1:]
src, dst = args[0], args[1]
drop = set(args[args.index('--drop') + 1:]) if '--drop' in args else set()

b = open(src, 'rb').read()
jl = struct.unpack('<I', b[12:16])[0]
J = json.loads(b[20:20 + jl])
binoff = 20 + jl + 8
BIN = b[binoff:binoff + struct.unpack('<I', b[20 + jl:24 + jl])[0]]

CT = {5120: np.int8, 5121: np.uint8, 5122: np.int16, 5123: np.uint16, 5125: np.uint32, 5126: np.float32}
NC = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4, 'MAT4': 16}


def read(ai):
    a = J['accessors'][ai]; bv = J['bufferViews'][a['bufferView']]
    dt = np.dtype(CT[a['componentType']]); n = NC[a['type']]
    off = bv.get('byteOffset', 0) + a.get('byteOffset', 0); stride = bv.get('byteStride', 0) or dt.itemsize * n
    raw = np.frombuffer(BIN, dtype=np.uint8, count=stride * (a['count'] - 1) + dt.itemsize * n, offset=off)
    if stride == dt.itemsize * n:
        return raw.view(dt).reshape(a['count'], n).astype(np.float64 if dt == np.float32 else np.int64)
    out = np.empty((a['count'], n), dtype=dt)
    for i in range(a['count']):
        out[i] = np.frombuffer(raw[i * stride:i * stride + dt.itemsize * n].tobytes(), dtype=dt)
    return out.astype(np.float64 if dt == np.float32 else np.int64)


def local(nd):
    if 'matrix' in nd:
        return np.array(nd['matrix'], dtype=np.float64).reshape(4, 4).T
    M = np.eye(4)
    if 'scale' in nd: M = np.diag(list(nd['scale']) + [1]) @ M
    if 'rotation' in nd:
        x, y, z, w = nd['rotation']
        R = np.array([[1 - 2 * (y * y + z * z), 2 * (x * y - z * w), 2 * (x * z + y * w)], [2 * (x * y + z * w), 1 - 2 * (x * x + z * z), 2 * (y * z - x * w)], [2 * (x * z - y * w), 2 * (y * z + x * w), 1 - 2 * (x * x + y * y)]])
        Rm = np.eye(4); Rm[:3, :3] = R; M = Rm @ M
    if 'translation' in nd:
        T = np.eye(4); T[:3, 3] = nd['translation']; M = T @ M
    return M


groups = {}  # material -> lists
stack = [(n, np.eye(4)) for n in J['scenes'][J.get('scene', 0)]['nodes']]
while stack:
    ni, parent = stack.pop()
    nd = J['nodes'][ni]; W = parent @ local(nd)
    for c in nd.get('children', []): stack.append((c, W))
    if 'mesh' not in nd: continue
    Nm = np.linalg.inv(W[:3, :3]).T
    flip = np.linalg.det(W[:3, :3]) < 0
    for p in J['meshes'][nd['mesh']]['primitives']:
        if p.get('mode', 4) != 4: continue
        mat = p.get('material', -1)
        mname = J['materials'][mat].get('name', '') if mat >= 0 else ''
        if mname in drop: continue
        P = read(p['attributes']['POSITION'])
        P = (W[:3, :3] @ P.T).T + W[:3, 3]
        N = read(p['attributes']['NORMAL']) if 'NORMAL' in p['attributes'] else None
        if N is not None:
            N = (Nm @ N.T).T; N /= np.maximum(np.linalg.norm(N, axis=1, keepdims=True), 1e-12)
        UV = read(p['attributes']['TEXCOORD_0']) if 'TEXCOORD_0' in p['attributes'] else None
        I = read(p['indices']).reshape(-1) if 'indices' in p else np.arange(len(P))
        I = I.reshape(-1, 3)
        if flip: I = I[:, [0, 2, 1]]
        g = groups.setdefault(mat, {'P': [], 'N': [], 'UV': [], 'I': [], 'n': 0, 'hasN': True, 'hasUV': True})
        g['P'].append(P); g['N'].append(N); g['UV'].append(UV); g['I'].append(I + g['n']); g['n'] += len(P)
        g['hasN'] &= N is not None; g['hasUV'] &= UV is not None

# write a new GLB
out_bin = bytearray(); views = []; accs = []


def add_view(data, target=None):
    while len(out_bin) % 4: out_bin.append(0)
    off = len(out_bin); out_bin.extend(data)
    v = {'buffer': 0, 'byteOffset': off, 'byteLength': len(data)}
    if target: v['target'] = target
    views.append(v); return len(views) - 1


def add_acc(arr, ctype, typ, target, minmax=False):
    vi = add_view(arr.tobytes(), target)
    a = {'bufferView': vi, 'componentType': ctype, 'count': int(arr.shape[0]), 'type': typ}
    if minmax: a['min'] = arr.min(axis=0).tolist(); a['max'] = arr.max(axis=0).tolist()
    accs.append(a); return len(accs) - 1


prims = []
print('material bounds (metres):')
for mat, g in sorted(groups.items(), key=lambda kv: kv[0]):
    P = np.concatenate(g['P']).astype(np.float32); I = np.concatenate(g['I']).astype(np.uint32).reshape(-1)
    attrs = {'POSITION': add_acc(P, 5126, 'VEC3', 34962, True)}
    if g['hasN']: attrs['NORMAL'] = add_acc(np.concatenate(g['N']).astype(np.float32), 5126, 'VEC3', 34962)
    if g['hasUV']: attrs['TEXCOORD_0'] = add_acc(np.concatenate(g['UV']).astype(np.float32), 5126, 'VEC2', 34962)
    pr = {'attributes': attrs, 'indices': add_acc(I.reshape(-1, 1), 5125, 'SCALAR', 34963), 'mode': 4}
    if mat >= 0: pr['material'] = mat
    prims.append(pr)
    name = J['materials'][mat].get('name', '') if mat >= 0 else '(none)'
    print(f"  {name:32s} tris {len(I)//3:7d}  min {np.round(P.min(0),1)}  max {np.round(P.max(0),1)}")

# images: copy their bytes into the new buffer
images = []
for im in J.get('images', []):
    im = dict(im)
    if 'bufferView' in im:
        bv = J['bufferViews'][im['bufferView']]
        im['bufferView'] = add_view(BIN[bv.get('byteOffset', 0):bv.get('byteOffset', 0) + bv['byteLength']])
    images.append(im)

out = {'asset': {'version': '2.0', 'generator': 'merge_glb.py'}, 'scene': 0, 'scenes': [{'nodes': [0]}], 'nodes': [{'mesh': 0, 'name': 'model'}],
       'meshes': [{'primitives': prims}], 'accessors': accs, 'bufferViews': views, 'buffers': [{'byteLength': len(out_bin)}]}
for k in ('materials', 'textures', 'samplers'):
    if k in J: out[k] = J[k]
if images: out['images'] = images
js = json.dumps(out, separators=(',', ':')).encode()
while len(js) % 4: js += b' '
while len(out_bin) % 4: out_bin.append(0)
total = 12 + 8 + len(js) + 8 + len(out_bin)
with open(dst, 'wb') as f:
    f.write(struct.pack('<III', 0x46546C67, 2, total))
    f.write(struct.pack('<II', len(js), 0x4E4F534A)); f.write(js)
    f.write(struct.pack('<II', len(out_bin), 0x004E4942)); f.write(out_bin)
print('wrote', dst, total, 'bytes,', len(prims), 'primitives')
