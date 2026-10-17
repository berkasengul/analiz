# models/web/*.glb → models/web/extra-models.js (base64). Site file:// ile açıldığında modeller buradan okunur.
# Kullanım (proje klasöründen): python3 tools/embed_models.py
import base64, os
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
names = ['bmw-420i-coupe.glb', 'vw-golf-7.glb', 'ford-kuga.glb']
dst = os.path.join(ROOT, 'models', 'web', 'extra-models.js')
with open(dst, 'w') as f:
    f.write('// Sayfa dosyadan (file://) açıldığında da yüklensin diye gömülü (base64) modeller.\n')
    f.write('window.MTG_MODELS = window.MTG_MODELS || {};\n')
    for n in names:
        b64 = base64.b64encode(open(os.path.join(ROOT, 'models', 'web', n), 'rb').read()).decode()
        f.write(f"window.MTG_MODELS['models/web/{n}'] = '{b64}';\n")
print(dst, round(os.path.getsize(dst) / 1e6, 1), 'MB')
