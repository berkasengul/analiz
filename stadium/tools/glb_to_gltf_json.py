"""Turn a GLB into a single self-contained .gltf JSON file (buffer + images as data: URIs).
Opaque PNG textures are re-encoded as JPEG (and capped at --max px) so the file stays small.
Needed because the artifact host serves .json but not .glb/.bin.

Usage: python3 -I tools/glb_to_gltf_json.py in.glb out.json [--max 1024] [--q 82]
"""
import base64, io, json, struct, sys
from PIL import Image

args = sys.argv[1:]
src, dst = args[0], args[1]
MAX = int(args[args.index('--max') + 1]) if '--max' in args else 1024
Q = int(args[args.index('--q') + 1]) if '--q' in args else 82

b = open(src, 'rb').read()
jl = struct.unpack('<I', b[12:16])[0]
J = json.loads(b[20:20 + jl])
o = 20 + jl
BIN = b[o + 8:o + 8 + struct.unpack('<I', b[o:o + 4])[0]]

img_views = set()
for im in J.get('images', []):
    if 'bufferView' not in im: continue
    bv = J['bufferViews'][im['bufferView']]; img_views.add(im['bufferView'])
    raw = BIN[bv.get('byteOffset', 0):bv.get('byteOffset', 0) + bv['byteLength']]
    pic = Image.open(io.BytesIO(raw)); pic.load()
    if max(pic.size) > MAX: pic.thumbnail((MAX, MAX), Image.LANCZOS)
    has_alpha = pic.mode in ('RGBA', 'LA', 'P') and pic.convert('RGBA').getextrema()[3][0] < 250
    out = io.BytesIO()
    if has_alpha: pic.convert('RGBA').save(out, 'PNG', optimize=True); mime = 'image/png'
    else: pic.convert('RGB').save(out, 'JPEG', quality=Q, optimize=True, progressive=True); mime = 'image/jpeg'
    im.pop('bufferView'); im['mimeType'] = mime
    im['uri'] = f'data:{mime};base64,' + base64.b64encode(out.getvalue()).decode()

# rebuild the geometry buffer without the image bytes
nb = bytearray(); remap = {}
for i, bv in enumerate(J['bufferViews']):
    if i in img_views: continue
    while len(nb) % 4: nb.append(0)
    s = bv.get('byteOffset', 0); nb.extend(BIN[s:s + bv['byteLength']])
    nbv = dict(bv); nbv['byteOffset'] = len(nb) - bv['byteLength']; remap[i] = len(remap); J['bufferViews'][i] = nbv
J['bufferViews'] = [J['bufferViews'][i] for i in sorted(remap)]
for a in J['accessors']:
    if 'bufferView' in a: a['bufferView'] = remap[a['bufferView']]
J['buffers'] = [{'byteLength': len(nb), 'uri': 'data:application/octet-stream;base64,' + base64.b64encode(bytes(nb)).decode()}]
open(dst, 'w').write(json.dumps(J, separators=(',', ':')))
print('wrote', dst, len(open(dst).read()) / 1e6, 'MB')
