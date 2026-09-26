"""Turkish Coffee Lady konsept şişe etiketi.

Siyah zemin + beyaz çizim; sitede zemin tat rengine, beyazlar `ink`
rengine boyanır. Etiket şişenin çevresini sarar:
  u=0.25 arka (içindekiler), u=0.5 ön (marka), u=0.75 yan (dijital fal).
Kullanım: python3 label-generator.py <font klasörü> <çıktı.png>
"""
import random
import sys

from PIL import Image, ImageDraw, ImageFont

FONTS = sys.argv[1]
OUT = sys.argv[2]
W, H = 2048, 836
WHITE = (255, 255, 255)

im = Image.new("RGB", (W, H), (0, 0, 0))
d = ImageDraw.Draw(im)


def font(name, size):
    return ImageFont.truetype(f"{FONTS}/{name}", size)


def text_c(cx, y, s, f, spacing=0, fill=WHITE):
    """cx merkezli, y üst kenarlı metin; harf aralığı destekli."""
    if spacing == 0:
        l, t, r, b = d.textbbox((0, 0), s, font=f)
        d.text((cx - (r - l) / 2 - l, y - t), s, font=f, fill=fill)
        return y + (b - t)
    widths = [d.textlength(ch, font=f) for ch in s]
    total = sum(widths) + spacing * (len(s) - 1)
    x = cx - total / 2
    _, t, _, b = d.textbbox((0, 0), s, font=f)
    for ch, w in zip(s, widths):
        d.text((x, y - t), ch, font=f, fill=fill)
        x += w + spacing
    return y + (b - t)


# ---------- üst ve alt süsleme bantları (tüm çevre boyunca) ----------
def band(y, flip=False):
    d.line([(0, y), (W, y)], fill=WHITE, width=3)
    d.line([(0, y + (14 if not flip else -14)), (W, y + (14 if not flip else -14))], fill=WHITE, width=1)
    step = 64
    my = y + (34 if not flip else -34)
    for x in range(0, W + step, step):
        # lale/baklava motifi
        d.polygon([(x, my - 12), (x + 9, my), (x, my + 12), (x - 9, my)], outline=WHITE, width=2)
        d.ellipse([x + step / 2 - 3, my - 3, x + step / 2 + 3, my + 3], fill=WHITE)


band(22)
band(H - 22, flip=True)

# ---------- ön yüz: marka (u = 0.5) ----------
cx = W * 0.5
cy = 150
d.ellipse([cx - 74, cy - 74, cx + 74, cy + 74], outline=WHITE, width=3)
d.ellipse([cx - 62, cy - 62, cx + 62, cy + 62], outline=WHITE, width=1)
# fincan ve tabak
d.rounded_rectangle([cx - 30, cy - 12, cx + 22, cy + 26], radius=10, outline=WHITE, width=4)
d.arc([cx + 12, cy - 4, cx + 40, cy + 18], -90, 90, fill=WHITE, width=4)
d.line([cx - 44, cy + 36, cx + 44, cy + 36], fill=WHITE, width=4)
for i, dx in enumerate((-14, 0, 14)):
    d.arc([cx + dx - 8, cy - 52, cx + dx + 8, cy - 22], 90 if i % 2 else 270, 270 if i % 2 else 90, fill=WHITE, width=3)

y = 252
y = text_c(cx, y, "TURKISH", font("Gloock-Regular.ttf", 88)) + 14
y = text_c(cx, y, "COFFEE", font("Gloock-Regular.ttf", 88)) + 16
y = text_c(cx, y, "LADY", font("Italiana-Regular.ttf", 58), spacing=24) + 28
d.line([cx - 150, y, cx - 24, y], fill=WHITE, width=2)
d.polygon([(cx, y - 8), (cx + 8, y), (cx, y + 8), (cx - 8, y)], fill=WHITE)
d.line([cx + 24, y, cx + 150, y], fill=WHITE, width=2)
y += 28
y = text_c(cx, y, "SOĞUK TÜRK KAHVESİ", font("IBMPlexMono-Bold.ttf", 30), spacing=5) + 16
y = text_c(cx, y, "COLD TURKISH COFFEE", font("IBMPlexMono-Regular.ttf", 22), spacing=4) + 26
text_c(cx, y, "250 ml  ·  EST. 2009", font("IBMPlexMono-Regular.ttf", 22), spacing=3)

# ---------- arka yüz: içindekiler (u = 0.25) ----------
bx, bw, by, bh = W * 0.25 - 230, 460, 110, 600
d.rectangle([bx, by, bx + bw, by + bh], outline=WHITE, width=3)
f_h = font("Gloock-Regular.ttf", 44)
d.text((bx + 22, by + 16), "Besin Değerleri", font=f_h, fill=WHITE)
d.text((bx + 22, by + 72), "100 ml için · örnek değerler", font=font("IBMPlexMono-Regular.ttf", 20), fill=WHITE)
d.line([bx + 22, by + 104, bx + bw - 22, by + 104], fill=WHITE, width=6)
rows = [("Enerji", "24 kcal"), ("Yağ", "0,4 g"), ("Karbonhidrat", "4,2 g"), ("  Şeker", "3,8 g"),
        ("Protein", "0,9 g"), ("Tuz", "0,02 g"), ("Kafein", "60 mg")]
yy = by + 120
f_r = font("IBMPlexSerif-Regular.ttf", 30)
for k, v in rows:
    d.text((bx + 22, yy), k, font=f_r, fill=WHITE)
    tw = d.textlength(v, font=f_r)
    d.text((bx + bw - 22 - tw, yy), v, font=f_r, fill=WHITE)
    yy += 44
    d.line([bx + 22, yy - 6, bx + bw - 22, yy - 6], fill=WHITE, width=1)
yy += 10
f_s = font("IBMPlexSerif-Regular.ttf", 24)
for line in ["İçindekiler: su, Türk kahvesi,", "şeker, doğal aroma.", "", "Soğuk servis edin. Açtıktan", "sonra hemen tüketin.", "", "*Konsept etiket, değerler örnektir."]:
    d.text((bx + 22, yy), line, font=f_s, fill=WHITE)
    yy += 30

# ---------- yan: dijital fal (u = 0.75) ----------
fx = W * 0.75
text_c(fx, 120, "Fincanını", font("Gloock-Regular.ttf", 54))
text_c(fx, 186, "çevir,", font("Gloock-Regular.ttf", 54))
text_c(fx, 252, "falın hazır.", font("Gloock-Regular.ttf", 54))
# ters çevrilmiş fincan
cy2 = 440
d.ellipse([fx - 110, cy2 + 40, fx + 110, cy2 + 70], outline=WHITE, width=3)
d.polygon([(fx - 62, cy2 + 48), (fx + 62, cy2 + 48), (fx + 44, cy2 - 40), (fx - 44, cy2 - 40)], outline=WHITE, width=4)
d.line([fx - 44, cy2 - 40, fx + 44, cy2 - 40], fill=WHITE, width=4)
# QR benzeri desen (gerçek bir kod değildir)
random.seed(7)
qs, qx, qy, cell = 21, fx - 94, cy2 + 92, 9
for i in range(qs):
    for j in range(qs):
        corner = (i < 7 and j < 7) or (i < 7 and j >= qs - 7) or (i >= qs - 7 and j < 7)
        if corner:
            continue
        if random.random() < 0.45:
            d.rectangle([qx + i * cell, qy + j * cell, qx + i * cell + cell - 1, qy + j * cell + cell - 1], fill=WHITE)
for ox, oy in ((0, 0), (qs - 7, 0), (0, qs - 7)):
    x0, y0 = qx + ox * cell, qy + oy * cell
    d.rectangle([x0, y0, x0 + 7 * cell - 1, y0 + 7 * cell - 1], outline=WHITE, width=cell)
    d.rectangle([x0 + 2 * cell, y0 + 2 * cell, x0 + 5 * cell - 1, y0 + 5 * cell - 1], fill=WHITE)

# ---------- barkod (arka ile yan arasında) ----------
bx2 = W * 0.04
random.seed(3)
x = bx2
while x < bx2 + 150:
    w = random.choice((2, 3, 5, 7))
    d.rectangle([x, 500, x + w, 640], fill=WHITE)
    x += w + random.choice((3, 4, 6))
d.text((bx2 - 6, 648), "8 690000 000000", font=font("IBMPlexMono-Regular.ttf", 17), fill=WHITE)

im.save(OUT, optimize=True)
print("ok", OUT)
