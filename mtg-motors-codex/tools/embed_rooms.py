# Blender oda GLB'lerini ve lightmap'leri models/rooms/rooms.js içine gömer.
# Site file:// ile (çift tıklayarak) açıldığında tarayıcı yerel dosyaları fetch edemez; bu dosya o durumda yüklenir.
# Kullanım (proje klasöründen): python3 tools/embed_rooms.py
import base64, json, os, glob
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
out = {}
for p in sorted(glob.glob(os.path.join(ROOT, 'models', 'rooms', 'room_*'))):
    name = 'models/rooms/' + os.path.basename(p)
    data = base64.b64encode(open(p, 'rb').read()).decode()
    if p.endswith('.glb'): out[name] = data
    elif p.endswith('.webp'): out[name] = 'data:image/webp;base64,' + data
dst = os.path.join(ROOT, 'models', 'rooms', 'rooms.js')
with open(dst, 'w') as f:
    f.write('// Otomatik üretildi: tools/embed_rooms.py — file:// açılışı için gömülü oda modelleri\n')
    f.write('window.MTG_ROOMS = ' + json.dumps(out) + ';\n')
print(dst, round(os.path.getsize(dst) / 1e6, 1), 'MB', len(out), 'dosya')
