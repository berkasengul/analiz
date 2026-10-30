# Paketin içine konan karekodlu masal kartları (PDF).
# Kullanım (store klasöründen):  python3 tools/masal_kartlari.py
# Üretir: tools/cikti/masal-kartlari-matbaa.pdf  (A6, 3 mm taşma payı, her sayfa bir kart: matbaa için)
#         tools/cikti/masal-kartlari-a4.pdf      (A4'e 4 kart, kesim çizgili: evde yazdırmak için)
# Karekod, sitedeki masal/<desen>/ sayfasını açar (config.js içindeki url ile).
import json, os, random, subprocess
from io import BytesIO
from PIL import Image
from reportlab.pdfgen import canvas
from reportlab.lib.units import mm
from reportlab.lib.utils import ImageReader, simpleSplit
from reportlab.lib.colors import HexColor, white
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.graphics.barcode.qr import QrCodeWidget
from reportlab.graphics.shapes import Drawing
from reportlab.graphics import renderPDF

STORE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FONTS = os.path.join(STORE, 'tools', 'fonts')
OUT = os.path.join(STORE, 'tools', 'cikti')
pdfmetrics.registerFont(TTFont('Fredoka', os.path.join(FONTS, 'Baloo2-Bold.ttf')))  # Fredoka'da ğ/ş/İ yok: yuvarlak hatlı Baloo 2
pdfmetrics.registerFont(TTFont('Nunito', os.path.join(FONTS, 'Nunito-SemiBold.ttf')))
pdfmetrics.registerFont(TTFont('NunitoX', os.path.join(FONTS, 'Nunito-ExtraBold.ttf')))

# Ürün ve masal verisini sitenin kendi dosyalarından oku
data = json.loads(subprocess.check_output(['node', '--input-type=module', '-e', '''
const {PRODUCTS}=await import('./js/products.js');const {STORIES}=await import('./js/stories.js');const {SITE}=await import('./js/config.js');
console.log(JSON.stringify({url:SITE.url,items:PRODUCTS.filter(p=>STORIES[p.id]).map(p=>({...STORIES[p.id],name:p.name,spin:p.spin,image:p.image,accent:p.accent}))}))'''], cwd=STORE))
BASE = data['url'].rstrip('/')
NAVY, NAVY2, GOLD, SOFT = HexColor('#2c2f72'), HexColor('#16183f'), HexColor('#ffd45c'), HexColor('#c9ccff')
W, H = 105 * mm, 148 * mm

def product_png(path):
    im = Image.open(os.path.join(STORE, path)).convert('RGBA')
    im = im.crop(im.getbbox())
    if im.height > 720: im = im.resize((round(im.width * 720 / im.height), 720), Image.LANCZOS)
    buf = BytesIO(); im.save(buf, 'PNG'); buf.seek(0)
    return ImageReader(buf), im.size

LOGO = ImageReader(os.path.join(STORE, 'assets', 'brand', 'logo-wordmark.png'))
LOGO_SIZE = Image.open(os.path.join(STORE, 'assets', 'brand', 'logo-wordmark.png')).size

def centered(c, text, font, size, y, color, x0=0, w=W):
    c.setFont(font, size); c.setFillColor(color)
    c.drawCentredString(x0 + w / 2, y, text)

def card(c, it, bleed=0):
    """Kartı (0,0)–(W,H) alanına çizer; bleed kadar dışarı taşan arka plan."""
    rnd = random.Random(it['spin'])
    c.saveState()
    p = c.beginPath(); p.rect(-bleed, -bleed, W + 2 * bleed, H + 2 * bleed)
    c.clipPath(p, stroke=0, fill=0)
    c.linearGradient(0, H + bleed, 0, -bleed, (NAVY, NAVY2), extend=True)
    # Ürün renginde yumuşak ışık
    acc = HexColor(it['accent'])
    c.setFillColor(acc); c.setFillAlpha(0.22); c.circle(W * 0.92, H * 0.95, 48 * mm, stroke=0, fill=1)
    c.setFillAlpha(1)
    # Yıldızlar
    c.setFillColor(white)
    # Yazıların üstüne düşmesin: metin bantlarında yıldız yok
    clear = [(H - 44 * mm, H - 19 * mm), (2 * mm, 52 * mm)]
    n = 0
    while n < 40:
        x, y = rnd.uniform(-bleed, W + bleed), rnd.uniform(-bleed, H + bleed)
        if 6 * mm < x < W - 6 * mm and any(a < y < b for a, b in clear): continue
        if W - 54 * mm < x < W - 5 * mm and 50 * mm < y < H - 44 * mm: continue  # karekod
        n += 1
        c.setFillAlpha(rnd.uniform(.35, .9))
        c.circle(x, y, rnd.uniform(.18, .55) * mm, stroke=0, fill=1)
    c.setFillAlpha(1)
    # Ay
    c.setFillColor(GOLD); c.circle(12 * mm, H - 13 * mm, 5 * mm, stroke=0, fill=1)
    c.setFillColor(NAVY); c.circle(14.2 * mm, H - 11.8 * mm, 4.4 * mm, stroke=0, fill=1)
    c.restoreState()

    # Logo
    lw = 52 * mm; lh = lw * LOGO_SIZE[1] / LOGO_SIZE[0]
    c.drawImage(LOGO, (W - lw) / 2, H - 13 * mm - lh / 2, lw, lh, mask='auto')
    centered(c, 'BU PİJAMANIN BİR MASALI VAR', 'NunitoX', 7, H - 26 * mm, GOLD)
    # Başlık (en çok 2 satır)
    size = 17
    lines = simpleSplit(it['title'], 'Fredoka', size, W - 16 * mm)
    while len(lines) > 2: size -= 1; lines = simpleSplit(it['title'], 'Fredoka', size, W - 16 * mm)
    y = H - 34 * mm
    for ln in lines: centered(c, ln, 'Fredoka', size, y, white); y -= size * 1.15
    centered(c, f"Kahramanımız: {it['hero']}", 'Nunito', 8.5, y - 1 * mm, SOFT)

    # Orta: ürün görseli (solda) + karekod (sağda)
    top = y - 7 * mm
    img, (iw, ih) = product_png(it['image'])
    boxh = 52 * mm
    ph = boxh; pw = ph * iw / ih
    if pw > 34 * mm: pw = 34 * mm; ph = pw * ih / iw
    px = 9 * mm + (34 * mm - pw) / 2
    c.setFillColor(acc); c.setFillAlpha(.28); c.circle(9 * mm + 17 * mm, top - boxh * .55, 17 * mm, stroke=0, fill=1); c.setFillAlpha(1)
    c.drawImage(img, px, top - boxh + (boxh - ph) / 2, pw, ph, mask='auto')

    url = f"{BASE}/masal/{it['spin']}/"
    q = 40 * mm; qx = W - 9 * mm - q; qy = top - q - 1 * mm
    c.setFillColor(white); c.roundRect(qx - 2.5 * mm, qy - 2.5 * mm, q + 5 * mm, q + 5 * mm, 4 * mm, stroke=0, fill=1)
    w = QrCodeWidget(url, barLevel='M'); w.barBorder = 0
    b = w.getBounds(); bw, bh = b[2] - b[0], b[3] - b[1]
    d = Drawing(q, q, transform=[q / bw, 0, 0, q / bh, 0, 0]); d.add(w)
    renderPDF.draw(d, c, qx, qy)
    capy = qy - 8.5 * mm
    centered(c, 'Okut, masalını dinle!', 'Fredoka', 10.5, capy, GOLD, qx - 2.5 * mm, q + 5 * mm)

    # Masalın ilk cümlesi: merak uyandırır, devamı karekodda
    first = it['text'][0].split('. ')[0].rstrip('.') + '…'
    ts = 8.5
    tl = simpleSplit(first, 'Nunito', ts, W - 22 * mm)
    while len(tl) > 3: ts -= .5; tl = simpleSplit(first, 'Nunito', ts, W - 22 * mm)
    # Karekod yazısı ile alttaki kutu arasında dikey ortala
    lh = ts * 1.35
    ty = (capy - 3 * mm + 30 * mm) / 2 + (len(tl) * lh) / 2 - ts * .8
    c.setFont('Nunito', ts); c.setFillColor(SOFT)
    for ln in tl: c.drawCentredString(W / 2, ty, ln); ty -= ts * 1.35

    # Alt: uyumadan önce sor
    ay = 30 * mm
    c.setFillColor(white); c.setFillAlpha(.1); c.roundRect(8 * mm, 10 * mm, W - 16 * mm, ay - 10 * mm, 3.5 * mm, stroke=0, fill=1); c.setFillAlpha(1)
    centered(c, 'UYUMADAN ÖNCE SOR', 'NunitoX', 6.5, ay - 5.5 * mm, GOLD)
    qs = 9.5
    ql = simpleSplit(it['ask'], 'Nunito', qs, W - 24 * mm)
    while len(ql) > 2: qs -= .5; ql = simpleSplit(it['ask'], 'Nunito', qs, W - 24 * mm)
    yy = ay - 10.5 * mm
    for ln in ql: centered(c, ln, 'Nunito', qs, yy, white); yy -= qs * 1.25
    centered(c, url.replace('https://', '').replace('www.', ''), 'Nunito', 6.5, 5.2 * mm, SOFT)

os.makedirs(OUT, exist_ok=True)
items = data['items']
# 1) Matbaa: A6 + 3 mm taşma
B = 3 * mm
c = canvas.Canvas(os.path.join(OUT, 'masal-kartlari-matbaa.pdf'), pagesize=(W + 2 * B, H + 2 * B))
c.setTitle('SESA KIDS masal kartları (A6, 3 mm taşma)'); c.setAuthor('SESA KIDS')
for it in items:
    c.translate(B, B); card(c, it, bleed=B); c.showPage()
c.save()
# 2) Ev yazıcısı: A4'e 4 kart, kesim işaretli
A4W, A4H = 210 * mm, 297 * mm
s = 0.93; gap = 4 * mm
cw, ch = W * s, H * s
ox = (A4W - 2 * cw - gap) / 2; oy = (A4H - 2 * ch - gap) / 2
c = canvas.Canvas(os.path.join(OUT, 'masal-kartlari-a4.pdf'), pagesize=(A4W, A4H))
c.setTitle('SESA KIDS masal kartları (A4, 4 kart)'); c.setAuthor('SESA KIDS')
for i in range(0, len(items), 4):
    for k, it in enumerate(items[i:i + 4]):
        x = ox + (k % 2) * (cw + gap); y = oy + (1 - k // 2) * (ch + gap)
        c.saveState(); c.translate(x, y); c.scale(s, s); card(c, it); c.restoreState()
        c.setStrokeColor(HexColor('#999999')); c.setLineWidth(.3)
        for (cx, cy) in [(x, y), (x + cw, y), (x, y + ch), (x + cw, y + ch)]:
            c.line(cx - 3 * mm if cx == x else cx + 1 * mm, cy, cx - 1 * mm if cx == x else cx + 3 * mm, cy)
            c.line(cx, cy - 3 * mm if cy == y else cy + 1 * mm, cx, cy - 1 * mm if cy == y else cy + 3 * mm)
    c.setFont('Nunito', 7); c.setFillColor(HexColor('#888888'))
    c.drawCentredString(A4W / 2, 6 * mm, 'SESA KIDS masal kartları · köşe işaretlerinden kesin · paketin içine koyun')
    c.showPage()
c.save()
print('Kartlar:', len(items), '→', OUT)
