# Blender oda GLB'lerini ve lightmap'lerini oda başına bir models/rooms/<oda>.js dosyasına gömer.
# Site file:// ile (çift tıklayarak) açıldığında tarayıcı yerel dosyaları fetch edemez; her oda yalnız gerektiğinde
# kendi dosyasından yüklenir (tek dev dosya yerine: GitHub boyut sınırı ve gereksiz yükleme yok).
# Kullanım (proje klasöründen): python3 tools/embed_rooms.py
import base64, json, os, glob
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
RD = os.path.join(ROOT, 'models', 'rooms')
old = os.path.join(RD, 'rooms.js')
if os.path.exists(old): os.remove(old)                     # eski tek dosya
for glb in sorted(glob.glob(os.path.join(RD, 'room_*.glb'))):
    n = os.path.basename(glb)[:-4]
    out = {'models/rooms/' + n + '.glb': base64.b64encode(open(glb, 'rb').read()).decode()}
    for p in sorted(glob.glob(os.path.join(RD, n + '_lm_*.webp')) + glob.glob(os.path.join(RD, n + '_tv*.webp'))):   # lightmap + TV posteri
        out['models/rooms/' + os.path.basename(p)] = 'data:image/webp;base64,' + base64.b64encode(open(p, 'rb').read()).decode()
    dst = os.path.join(RD, n + '.js')
    with open(dst, 'w') as f:
        f.write('// Otomatik üretildi: tools/embed_rooms.py — file:// açılışı için gömülü oda modeli\n')
        f.write('window.MTG_ROOMS = Object.assign(window.MTG_ROOMS || {}, ' + json.dumps(out) + ');\n')
    print(os.path.basename(dst), round(os.path.getsize(dst) / 1e6, 1), 'MB')
