"""Replace the base-colour texture of one material inside a self-contained .gltf JSON.
Usage: python3 -I tools/replace_texture.py model.gltf.json "material name" new_image.jpg
"""
import base64, json, sys
path, mname, img = sys.argv[1:4]
J = json.load(open(path))
m = next(m for m in J['materials'] if m.get('name') == mname)
ti = m['pbrMetallicRoughness']['baseColorTexture']['index']
ii = J['textures'][ti]['source']
mime = 'image/png' if img.lower().endswith('.png') else 'image/jpeg'
J['images'][ii] = {'mimeType': mime, 'uri': f'data:{mime};base64,' + base64.b64encode(open(img, 'rb').read()).decode()}
json.dump(J, open(path, 'w'), separators=(',', ':'))
print('replaced texture of', mname, '-> image', ii)
