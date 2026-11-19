# Stadyum uzun videosu kapakları (1280x720). İki seçenek: A "BU BİR WEB SİTESİ", B "3 STAT · 0 KOD".
# Girdi: $TH/k_*.png (kullanıcının ekran kaydından kareler), $TH/yuz_kesik.png (avatar karesi, arka planı silinmiş)
import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageEnhance
D = os.path.dirname(os.path.abspath(__file__))
TH = os.environ.get("TH", "/tmp/claude-0/-home-user-analiz/e274d3af-c40a-5d41-9c98-1b82ec1aae88/scratchpad/thumb")
OUT = f"{D}/kapak"; os.makedirs(OUT, exist_ok=True)
W, H = 1280, 720
BLACK = lambda s: ImageFont.truetype("/usr/share/fonts/opentype/inter/Inter-Black.otf", s)
YEL, WHT = (255, 214, 0), (255, 255, 255)

def kare(t, cx=0.5, zoom=1.0, cy=0.5):
    im = Image.open(f"{TH}/k_{t}.png").convert("RGB")  # 1920x814
    ch = int(814 / zoom); cw = int(ch * 16 / 9); x0 = int(min(max(0, cx * 1920 - cw / 2), 1920 - cw)); y0 = int(cy * (814 - ch))
    im = im.crop((x0, y0, x0 + cw, y0 + ch)).resize((W, H), Image.LANCZOS)
    im = ImageEnhance.Color(im).enhance(1.35); im = ImageEnhance.Contrast(im).enhance(1.12)
    return im.convert("RGBA")
def yuz(yuk):
    f = Image.open(f"{TH}/yuz_kesik.png").convert("RGBA").crop((0, 60, 1200, 700))  # baş ve omuzlar, mikrofon dışarıda
    a = f.getchannel("A"); m = Image.new("L", f.size, 255); dm = ImageDraw.Draw(m)
    for y in range(f.height - 120, f.height): dm.line([(0, y), (f.width, y)], fill=int(255 * (f.height - y) / 120))
    from PIL import ImageChops
    f.putalpha(ImageChops.multiply(a, m))
    sc = yuk / f.height; f = f.resize((int(f.width * sc), yuk), Image.LANCZOS)
    # beyaz dış hat: kanalın kapaklarındaki "kesik" görünümü
    a = f.getchannel("A"); kenar = a.filter(ImageFilter.MaxFilter(13)).filter(ImageFilter.GaussianBlur(1.5))
    out = Image.new("RGBA", f.size, (0, 0, 0, 0)); out.paste(Image.new("RGBA", f.size, (255, 255, 255, 255)), (0, 0), kenar); out.alpha_composite(f)
    return out
def golge(im, xy, metin, font, renk, kalin=10):
    d = ImageDraw.Draw(im)
    lay = Image.new("RGBA", im.size, (0, 0, 0, 0)); dl = ImageDraw.Draw(lay)
    dl.text((xy[0] + 6, xy[1] + 10), metin, font=font, fill=(0, 0, 0, 200)); im.alpha_composite(lay.filter(ImageFilter.GaussianBlur(8)))
    d.text(xy, metin, font=font, fill=renk, stroke_width=kalin, stroke_fill=(10, 10, 14))
def ok(im, p0, p1, renk=YEL, kal=18):
    """Kalın kavisli ok (p0 → p1)."""
    d = ImageDraw.Draw(im); import math
    mx, my = (p0[0] + p1[0]) / 2, min(p0[1], p1[1]) - 60
    pts = [((1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * mx + t * t * p1[0], (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * my + t * t * p1[1]) for t in [i / 40 for i in range(41)]]
    for w, c in ((kal + 10, (10, 10, 14)), (kal, renk)): d.line(pts[:-3], fill=c, width=w, joint="curve")
    ax, ay = pts[-1]; bx, by = pts[-6]; ang = math.atan2(ay - by, ax - bx); L = 58
    tri = [(ax + 8 * math.cos(ang), ay + 8 * math.sin(ang)), (ax - L * math.cos(ang - 0.55), ay - L * math.sin(ang - 0.55)), (ax - L * math.cos(ang + 0.55), ay - L * math.sin(ang + 0.55))]
    d.polygon(tri, fill=(10, 10, 14)); tri2 = [(x + (ax - x) * 0.18, y + (ay - y) * 0.18) for x, y in tri]; d.polygon(tri2, fill=renk)

# ---- A: BU BİR WEB SİTESİ
im = kare(3, cx=0.522, zoom=1.06, cy=1.0)  # üst menü çubuğu dışarıda; "Bilet Al" ~ (600, 608)
g = Image.new("RGBA", (W, H), (0, 0, 0, 0)); dg = ImageDraw.Draw(g)
for x in range(W): dg.line([(x, 0), (x, H)], fill=(0, 0, 0, int(170 * max(0, 1 - x / 700) ** 1.4)))
im.alpha_composite(g)
golge(im, (44, 40), "BU BİR", BLACK(118), WHT); golge(im, (44, 165), "WEB", BLACK(150), YEL); golge(im, (44, 320), "SİTESİ", BLACK(150), YEL)
y = yuz(470); im.alpha_composite(y, (W - y.width + 170, H - y.height + 20))
ok(im, (395, 570), (525, 612))
etk = "OYUN DEĞİL"; f = BLACK(40); d = ImageDraw.Draw(im); tw = d.textlength(etk, font=f)
d.rounded_rectangle((44, 520, 44 + tw + 44, 590), 14, fill=(215, 30, 45)); d.text((66, 530), etk, font=f, fill=WHT)
im.convert("RGB").save(f"{OUT}/kapak_A_web_sitesi.jpg", quality=93)

# ---- B: 3 STAT · 0 KOD
im = Image.new("RGBA", (W, H), (12, 12, 16, 255))
paneller = [(3, 0.48, (169, 30, 45)), (72, 0.5, (255, 200, 0)), (136, 0.5, (235, 235, 235))]
pw = W // 3 + 60
for i, (t, cx, c) in enumerate(paneller):
    p = kare(t, cx=cx, zoom=1.6, cy=0.2).crop((W // 2 - pw // 2, 0, W // 2 + pw // 2, H))
    m = Image.new("L", (pw, H), 0); ImageDraw.Draw(m).polygon([(60, 0), (pw, 0), (pw - 60, H), (0, H)], fill=255)
    x = i * (W // 3) - 30; im.paste(p, (x, 0), m)
    ImageDraw.Draw(im).line([(x + pw - 60, H), (x + pw, 0)], fill=c, width=10)
g = Image.new("RGBA", (W, H), (0, 0, 0, 0)); dg = ImageDraw.Draw(g)
for yy in range(H): dg.line([(0, yy), (W, yy)], fill=(0, 0, 0, int(190 * max(0, 1 - yy / 330) ** 1.3) + int(235 * max(0, (yy - (H - 170)) / 170) ** 1.2)))
im.alpha_composite(g)
golge(im, (40, 30), "3 STAT", BLACK(150), WHT); golge(im, (40, 190), "0 KOD", BLACK(150), YEL)
y = yuz(430); im.alpha_composite(y, (W - y.width + 140, H - y.height + 20))
etk = "YAPAY ZEKÂ YAPTI"; f = BLACK(38); d = ImageDraw.Draw(im); tw = d.textlength(etk, font=f)
d.rounded_rectangle((44, 380, 44 + tw + 44, 448), 14, fill=(215, 30, 45)); d.text((66, 389), etk, font=f, fill=WHT)
im.convert("RGB").save(f"{OUT}/kapak_B_3stat_0kod.jpg", quality=93)
print("kapaklar:", sorted(os.listdir(OUT)))
