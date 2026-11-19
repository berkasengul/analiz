# Kapak v2: sitenin kendisinden 2560x1440 render edilen net stat görüntüleriyle (tools/still.mjs).
# C: üç stat yan yana çapraz paneller "3 STAT · 0 KOD"  ·  A2: büyük RAMS Park + "BU BİR WEB SİTESİ" + yüz + Bilet Al butonu
import os, math
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageEnhance, ImageChops
D = os.path.dirname(os.path.abspath(__file__))
SP = "/tmp/claude-0/-home-user-analiz/e274d3af-c40a-5d41-9c98-1b82ec1aae88/scratchpad"
ST = os.environ.get("ST", f"{SP}/still"); TH = os.environ.get("TH", f"{SP}/thumb")
OUT = f"{D}/kapak"; os.makedirs(OUT, exist_ok=True)
W, H = 1280, 720
BLACK = lambda s: ImageFont.truetype("/usr/share/fonts/opentype/inter/Inter-Black.otf", s)
BOLD = lambda s: ImageFont.truetype("/usr/share/fonts/opentype/inter/Inter-Bold.otf", s)
YEL, WHT, INK = (255, 214, 0), (255, 255, 255), (10, 10, 14)

def foto(ad, olcek, cx=0.5, cy=0.5, w=W, h=H):
    im = Image.open(f"{ST}/{ad}.png").convert("RGB")
    im = im.resize((int(im.width * olcek), int(im.height * olcek)), Image.LANCZOS)
    x0 = int(min(max(0, cx * im.width - w / 2), im.width - w)); y0 = int(min(max(0, cy * im.height - h / 2), im.height - h))
    im = im.crop((x0, y0, x0 + w, y0 + h))
    im = ImageEnhance.Color(im).enhance(1.25); im = ImageEnhance.Contrast(im).enhance(1.08); im = im.filter(ImageFilter.UnsharpMask(2, 60, 2))
    return im.convert("RGBA")
def golge(im, xy, metin, font, renk, kalin=9):
    lay = Image.new("RGBA", im.size, (0, 0, 0, 0)); ImageDraw.Draw(lay).text((xy[0] + 5, xy[1] + 9), metin, font=font, fill=(0, 0, 0, 210))
    im.alpha_composite(lay.filter(ImageFilter.GaussianBlur(8)))
    ImageDraw.Draw(im).text(xy, metin, font=font, fill=renk, stroke_width=kalin, stroke_fill=INK)
def yuz(yuk):
    f = Image.open(f"{TH}/yuz_kesik.png").convert("RGBA").crop((0, 60, 1200, 700))
    m = Image.new("L", f.size, 255); dm = ImageDraw.Draw(m)
    for y in range(f.height - 120, f.height): dm.line([(0, y), (f.width, y)], fill=int(255 * (f.height - y) / 120))
    f.putalpha(ImageChops.multiply(f.getchannel("A"), m))
    sc = yuk / f.height; f = f.resize((int(f.width * sc), yuk), Image.LANCZOS)
    k = f.getchannel("A").filter(ImageFilter.MaxFilter(13)).filter(ImageFilter.GaussianBlur(1.5))
    o = Image.new("RGBA", f.size, (0, 0, 0, 0)); o.paste(Image.new("RGBA", f.size, WHT + (255,)), (0, 0), k); o.alpha_composite(f); return o
def ok(im, p0, p1, renk=YEL, kal=16):
    d = ImageDraw.Draw(im); mx, my = (p0[0] + p1[0]) / 2, min(p0[1], p1[1]) - 70
    pts = [((1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * mx + t * t * p1[0], (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * my + t * t * p1[1]) for t in [i / 40 for i in range(41)]]
    for w, c in ((kal + 10, INK), (kal, renk)): d.line(pts[:-3], fill=c, width=w, joint="curve")
    ax, ay = pts[-1]; bx, by = pts[-6]; a = math.atan2(ay - by, ax - bx); L = 56
    tri = [(ax + 8 * math.cos(a), ay + 8 * math.sin(a)), (ax - L * math.cos(a - .55), ay - L * math.sin(a - .55)), (ax - L * math.cos(a + .55), ay - L * math.sin(a + .55))]
    d.polygon(tri, fill=INK); d.polygon([(x + (ax - x) * .18, y + (ay - y) * .18) for x, y in tri], fill=renk)
def buton(im, cx, cy, metin="Bilet Al"):
    d = ImageDraw.Draw(im); f = BLACK(44); tw = d.textlength(metin, font=f); w, h = tw + 90, 82
    lay = Image.new("RGBA", im.size, (0, 0, 0, 0)); ImageDraw.Draw(lay).rounded_rectangle((cx - w / 2 + 4, cy - h / 2 + 10, cx + w / 2 + 4, cy + h / 2 + 10), 41, fill=(0, 0, 0, 170))
    im.alpha_composite(lay.filter(ImageFilter.GaussianBlur(10)))
    d.rounded_rectangle((cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2), 41, fill=(206, 18, 52), outline=(255, 120, 140), width=4)
    d.text((cx - tw / 2, cy - 30), metin, font=f, fill=WHT)
    x, y = cx + w / 2 - 34, cy + 6  # imleç
    d.polygon([(x, y), (x + 34, y + 20), (x + 16, y + 24), (x + 26, y + 44), (x + 18, y + 48), (x + 8, y + 28), (x - 2, y + 40)], fill=WHT, outline=INK, width=3)

# ---- C: 2x2 ızgara: sol üst yazı + yüz, diğer üç hücrede statların tamamı
im = Image.new("RGBA", (W, H), (8, 8, 12, 255)); TW, TH2, G = 636, 356, 8
P = [("rams_dis", 0.285, 0.5, 0.50, (196, 26, 48), (W - TW, 0)), ("fb_dis", 0.30, 0.5, 0.44, (255, 205, 0), (0, H - TH2)), ("bjk_dis", 0.29, 0.5, 0.56, (235, 235, 235), (W - TW, H - TH2))]
for ad, sc, cx, cy, c, (x, y) in P:
    p = foto(ad, sc, cx, cy, TW, TH2); im.paste(p, (x, y))
    ImageDraw.Draw(im).rectangle((x + 2, y + 2, x + TW - 3, y + TH2 - 3), outline=c, width=6)
d = ImageDraw.Draw(im); d.rectangle((0, 0, TW - 1, TH2 - 1), fill=(14, 14, 20))
for yy in range(TH2): d.line([(0, yy), (TW, yy)], fill=(18 + yy // 12, 18 + yy // 14, 30 + yy // 10))
golge(im, (34, 22), "3 STAT", BLACK(104), WHT); golge(im, (34, 136), "0 KOD", BLACK(104), YEL)
etk = "YAPAY ZEKÂ YAPTI"; fe = BLACK(27); tw = d.textlength(etk, font=fe)
d.rounded_rectangle((34, 272, 34 + tw + 36, 324), 12, fill=(215, 30, 45)); d.text((52, 279), etk, font=fe, fill=WHT)
y = yuz(300); m = Image.new("L", (TW, TH2), 0); ImageDraw.Draw(m).rectangle((0, 0, TW, TH2), fill=255)
lay = Image.new("RGBA", (TW, TH2), (0, 0, 0, 0)); lay.alpha_composite(y, (TW - y.width + 205, TH2 - y.height + 6)); im.alpha_composite(lay, (0, 0))
im.convert("RGB").save(f"{OUT}/kapak_C_3stat_net.jpg", quality=94)

# ---- A2: büyük RAMS Park
im = foto("rams_dis", 0.56, 0.47, 0.52)
g = Image.new("RGBA", (W, H), (0, 0, 0, 0)); dg = ImageDraw.Draw(g)
for x in range(W): dg.line([(x, 0), (x, H)], fill=(0, 0, 0, int(165 * max(0, 1 - x / 640) ** 1.5)))
im.alpha_composite(g)
golge(im, (40, 30), "BU BİR", BLACK(112), WHT); golge(im, (40, 150), "WEB", BLACK(146), YEL); golge(im, (40, 300), "SİTESİ", BLACK(146), YEL)
y = yuz(440); im.alpha_composite(y, (W - y.width + 175, H - y.height + 20))
buton(im, 600, 630); ok(im, (330, 560), (468, 625))
d = ImageDraw.Draw(im); etk = "OYUN DEĞİL"; fe = BLACK(38); tw = d.textlength(etk, font=fe)
d.rounded_rectangle((40, 480, 40 + tw + 44, 548), 14, fill=(215, 30, 45)); d.text((62, 489), etk, font=fe, fill=WHT)
im.convert("RGB").save(f"{OUT}/kapak_A2_web_sitesi_net.jpg", quality=94)
print(sorted(os.listdir(OUT)))
