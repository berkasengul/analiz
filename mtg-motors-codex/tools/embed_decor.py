# models/decor/*.glb → models/decor/decor.js (base64). Site file:// ile açıldığında dekor buradan okunur.
# Kullanım (proje klasöründen): python3 tools/embed_decor.py
import base64, glob, os
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
dst = os.path.join(ROOT, 'models', 'decor', 'decor.js')
with open(dst, 'w') as f:
    f.write('// Dekor modelleri (Poly Haven, CC0) — file:// açılışı için gömülü kopya.\n')
    f.write('window.MTG_MODELS = window.MTG_MODELS || {};\n')
    for p in sorted(glob.glob(os.path.join(ROOT, 'models', 'decor', '*.glb'))):
        b64 = base64.b64encode(open(p, 'rb').read()).decode()
        f.write(f"window.MTG_MODELS['models/decor/{os.path.basename(p)}'] = '{b64}';\n")
print(dst, round(os.path.getsize(dst) / 1e6, 1), 'MB')
