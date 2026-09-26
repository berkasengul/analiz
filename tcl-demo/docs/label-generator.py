"""Turkish Coffee Lady konsept kutu etiketleri (250 ml slim kutu), v2.

Markanın paylaşılan güncel ürün görsellerindeki beyaz kutu tasarımından
esinlenerek yeniden çizilmiştir: mavi üst/alt bant ("GOOD COFFEE. GOOD
FORTUNE." / "SHAKE WELL. DRINK COLD."), TURKISH COFFEE Lady logosu, tat
adı, nazar boncuğu, gün batımında şehir resmi, tat tanımı ve notalar.
Bold Istanbul ve Silky Mardin görsellere göre; diğer üçü aynı dilde
konsept önerisidir.

Etiket kutuyu sarar: u = 0.5 ön yüz, u = 0.25 arka (besin değerleri),
u = 0.75 yan (dijital fal). Çıktı 2048×1418 JPG.

Kullanım: python3 label-generator.py <çıktı klasörü> [dosya adı filtresi]
"""
import math
import os
import random
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
FONTS = os.path.join(HERE, "label-fonts")
OUT = sys.argv[1] if len(sys.argv) > 1 else "."

W, H = 2048, 1418
K = 2  # süper örnekleme
SW, SH = W * K, H * K

BRAND_BLUE = (28, 78, 160)
BROWN = (104, 56, 28)
NAVY = (22, 40, 78)
DARK = (40, 40, 48)
GOLD = (200, 160, 80)

BAND = 104  # üst ve alt bant yüksekliği
# Şehir resimleri 560–990 aralığında çizilir, sonra etikette 520–1070
# aralığına dikey olarak esnetilerek yerleştirilir.
PAINT_TOP, PAINT_BOTTOM = 560, 990
BAND_TOP, BAND_BOTTOM = 520, 1070


def font(name, size):
    return ImageFont.truetype(os.path.join(FONTS, name), int(size * K))


def P(*v):
    return [x * K for x in v]


def layer():
    return Image.new("RGBA", (SW, SH), (0, 0, 0, 0))


def text_c(d, cx, y, s, f, fill, spacing=0):
    if spacing == 0:
        l, t, r, b = d.textbbox((0, 0), s, font=f)
        d.text((cx * K - (r - l) / 2 - l, y * K - t), s, font=f, fill=fill)
        return y + (b - t) / K
    widths = [d.textlength(ch, font=f) for ch in s]
    total = sum(widths) + spacing * K * (len(s) - 1)
    x = cx * K - total / 2
    _, t, _, b = d.textbbox((0, 0), s, font=f)
    for ch, w in zip(s, widths):
        d.text((x, y * K - t), ch, font=f, fill=fill)
        x += w + spacing * K
    return y + (b - t) / K


def fit(d, s, name, width, start):
    size = start
    while size > 10:
        f = font(name, size)
        l, _, r, _ = d.textbbox((0, 0), s, font=f)
        if (r - l) / K <= width:
            return f
        size -= 2
    return font(name, 10)


def gradient(stops, h, w):
    ys = np.linspace(0, 1, h)
    img = np.zeros((h, 3), np.float32)
    pos = [s[0] for s in stops]
    for c in range(3):
        img[:, c] = np.interp(ys, pos, [s[1][c] for s in stops])
    return np.repeat(img[:, None, :], w, axis=1)


# ---------------------------------------------------------------- zemin
def pearl_base(seed):
    img = gradient([(0, (250, 250, 248)), (0.5, (244, 245, 246)), (1, (236, 240, 244))], SH, SW)
    rng = np.random.default_rng(seed)
    img += rng.normal(0, 1.2, (SH, SW, 1)).astype(np.float32)
    return Image.fromarray(np.clip(img, 0, 255).astype(np.uint8), "RGB").convert("RGBA")


def bands(im, color):
    d = ImageDraw.Draw(im)
    d.rectangle(P(0, 0, W, BAND), fill=color + (255,))
    d.rectangle(P(0, H - BAND, W, H), fill=color + (255,))
    d.line(P(0, BAND + 6, W, BAND + 6), fill=GOLD + (255,), width=3 * K)
    d.line(P(0, H - BAND - 6, W, H - BAND - 6), fill=GOLD + (255,), width=3 * K)
    ft = font("OpenSans-Bold.ttf", 34)
    for cx in (W * 0.5, W * 0.5 - W / 3, W * 0.5 + W / 3):
        text_c(d, cx, BAND / 2 - 12, "GOOD COFFEE. GOOD FORTUNE.", ft, (255, 255, 255, 255), spacing=3)
        text_c(d, cx, H - BAND / 2 - 12, "SHAKE WELL. DRINK COLD.", ft, (255, 255, 255, 255), spacing=3)


# ---------------------------------------------------------------- resim yardımcıları
def wrap(fn, x, *a):
    for off in (-W, 0, W):
        fn(x + off, *a)


def paint_finish(fills, lines, sky, blur=3):
    """Gökyüzü + dolgular + çizgiler; üst kenarı beyaza doğru eritilir."""
    soft = fills.filter(ImageFilter.GaussianBlur(blur * K))
    art = Image.alpha_composite(sky, soft)
    art = Image.alpha_composite(art, fills)
    art = Image.alpha_composite(art, lines)
    rng = np.random.default_rng(11)
    a = np.array(art).astype(np.float32)
    a[..., :3] = np.clip(a[..., :3] + rng.normal(0, 6, (SH, SW, 1)).astype(np.float32), 0, 255)
    ys = np.arange(SH)
    y0, y1 = PAINT_TOP * K, PAINT_BOTTOM * K
    fade = (np.clip((ys - y0) / (90 * K), 0, 1) * (ys < y1)).astype(np.float32)
    a[..., 3] = a[..., 3] * fade[:, None]
    return Image.fromarray(a.astype(np.uint8), "RGBA")


def sky_layer(stops):
    img = np.zeros((SH, SW, 4), np.float32)
    h = (PAINT_BOTTOM - PAINT_TOP) * K
    img[PAINT_TOP * K:PAINT_BOTTOM * K, :, :3] = gradient(stops, h, SW)
    img[PAINT_TOP * K:PAINT_BOTTOM * K, :, 3] = 255
    return Image.fromarray(img.astype(np.uint8), "RGBA")


def sun(fills, x, y, r):
    g = layer()
    dg = ImageDraw.Draw(g)
    for i in range(10, 0, -1):
        rr = r * (1 + i * 0.35)
        dg.ellipse(P(x - rr, y - rr, x + rr, y + rr), fill=(255, 214, 150, int(18 + (10 - i) * 4)))
    dg.ellipse(P(x - r, y - r, x + r, y + r), fill=(255, 238, 190, 255))
    fills.alpha_composite(g.filter(ImageFilter.GaussianBlur(6 * K)))


def water(fills, lines, y0, y1, top, bottom, glint, rng):
    df, dl = ImageDraw.Draw(fills), ImageDraw.Draw(lines)
    for y in range(y0, y1, 6):
        t = (y - y0) / max(1, y1 - y0)
        c = tuple(int(top[i] + (bottom[i] - top[i]) * t) for i in range(3))
        df.rectangle(P(0, y, W, y + 6), fill=c + (255,))
    for _ in range(260):
        x, y = rng.uniform(0, W), rng.uniform(y0 + 4, y1 - 4)
        dl.line(P(x, y, x + rng.uniform(14, 60), y), fill=glint + (int(rng.uniform(90, 200)),), width=2 * K)


# ---------------------------------------------------------------- şehirler
def paint_istanbul(rng):
    sky = sky_layer([(0, (126, 170, 214)), (0.35, (238, 188, 150)), (0.62, (246, 156, 84)), (1, (240, 140, 70))])
    fills, lines = layer(), layer()
    df, dl = ImageDraw.Draw(fills), ImageDraw.Draw(lines)
    sun(fills, 1180, 820, 34)
    sil = (58, 52, 86, 255)
    rim = (255, 170, 90, 200)
    horizon = 850

    def mosque(x, s):
        df.rectangle(P(x - 80 * s, horizon - 60 * s, x + 80 * s, horizon), fill=sil)
        df.pieslice(P(x - 56 * s, horizon - 124 * s, x + 56 * s, horizon - 12 * s), 180, 360, fill=sil)
        dl.arc(P(x - 56 * s, horizon - 124 * s, x + 56 * s, horizon - 12 * s), 200, 300, fill=rim, width=2 * K)
        for dx in (-66, 66):
            df.pieslice(P(x + dx * s - 26 * s, horizon - 92 * s, x + dx * s + 26 * s, horizon - 40 * s), 180, 360, fill=sil)
        for dx in (-108, 108):
            mx = x + dx * s
            df.rectangle(P(mx - 4 * s, horizon - 200 * s, mx + 4 * s, horizon), fill=sil)
            df.polygon(P(mx - 6 * s, horizon - 200 * s, mx, horizon - 236 * s, mx + 6 * s, horizon - 200 * s), fill=sil)

    def galata(x):
        df.rectangle(P(x - 26, horizon - 250, x + 26, horizon), fill=sil)
        df.rectangle(P(x - 32, horizon - 262, x + 32, horizon - 250), fill=sil)
        df.polygon(P(x - 30, horizon - 262, x, horizon - 330, x + 30, horizon - 262), fill=sil)
        dl.line(P(x + 26, horizon - 250, x + 26, horizon - 10), fill=rim, width=2 * K)
        for wy in range(horizon - 230, horizon - 30, 40):
            df.rectangle(P(x - 6, wy, x + 6, wy + 16), fill=(255, 200, 120, 230))

    for x in range(0, W, 38):
        h = rng.uniform(16, 50)
        df.rectangle(P(x, horizon - h, x + 34, horizon), fill=(96, 86, 120, 255))
    for x in range(120, W, 420):
        wrap(mosque, x + rng.uniform(-40, 40), rng.uniform(0.7, 1.0))
    wrap(galata, 1180)
    wrap(galata, 1180 - W / 2)
    water(fills, lines, horizon, PAINT_BOTTOM, (238, 150, 90), (90, 120, 170), (255, 210, 150), rng)
    for y in range(horizon + 6, PAINT_BOTTOM, 10):
        w = rng.uniform(20, 70)
        dl.line(P(1180 - w, y, 1180 + w, y), fill=(255, 220, 150, 170), width=3 * K)
    for x in (820, 1500, 300):
        df.polygon(P(x - 44, 900, x + 44, 900, x + 34, 916, x - 34, 916), fill=(250, 250, 250, 255))
        df.rectangle(P(x - 20, 886, x + 18, 900), fill=(250, 250, 250, 255))
        df.rectangle(P(x - 4, 872, x + 2, 886), fill=(40, 40, 50, 255))
    return paint_finish(fills, lines, sky)


def paint_mardin(rng):
    sky = sky_layer([(0, (246, 226, 180)), (0.5, (238, 196, 120)), (1, (222, 170, 90))])
    fills, lines = layer(), layer()
    df, dl = ImageDraw.Draw(fills), ImageDraw.Draw(lines)
    sun(fills, 760, 640, 30)
    stone = [(214, 170, 104), (200, 152, 86), (226, 184, 120), (188, 140, 76)]
    ink = (120, 76, 34, 220)
    for off in (-W, 0, W):
        df.polygon(P(off, PAINT_BOTTOM, off, 820, off + 600, 700, off + 1100, 660, off + 1600, 720, off + W, 820, off + W, PAINT_BOTTOM),
                   fill=(206, 160, 96, 255))

    def house(x, y, w, h):
        c = stone[int(rng.integers(0, 4))]
        df.rectangle(P(x, y, x + w, y + h), fill=c + (255,))
        df.rectangle(P(x, y + h - 8, x + w, y + h), fill=(150, 104, 56, 200))
        for wx in range(int(x + 10), int(x + w - 16), 24):
            df.pieslice(P(wx, y + h * 0.3, wx + 14, y + h * 0.3 + 18), 180, 360, fill=(110, 70, 36, 230))
            df.rectangle(P(wx, y + h * 0.3 + 9, wx + 14, y + h * 0.3 + 26), fill=(110, 70, 36, 230))

    for row in range(6):
        y = 720 + row * 44
        for x in range(-40, W + 40, 84):
            if rng.random() < 0.8:
                wrap(lambda xx, yy=y: house(xx, yy + rng.uniform(-8, 8), rng.uniform(64, 96), 50), x + row * 24)

    def minaret(x):
        df.rectangle(P(x - 16, 600, x + 16, 900), fill=(232, 196, 136, 255))
        dl.rectangle(P(x - 16, 600, x + 16, 900), outline=ink, width=2 * K)
        df.rectangle(P(x - 24, 660, x + 24, 672), fill=(180, 130, 70, 255))
        df.pieslice(P(x - 18, 572, x + 18, 620), 180, 360, fill=(180, 130, 70, 255))
        for wy in range(700, 880, 40):
            df.pieslice(P(x - 6, wy, x + 6, wy + 22), 180, 360, fill=(110, 70, 36, 255))

    wrap(minaret, 880)
    wrap(minaret, 880 - W / 2)
    for x in (1080, 1080 - W / 2):
        df.rectangle(P(x - 70, 810, x + 70, 930), fill=(236, 200, 140, 255))
        df.pieslice(P(x - 40, 830, x + 40, 900), 180, 360, fill=(90, 56, 28, 255))
        df.rectangle(P(x - 40, 865, x + 40, 930), fill=(90, 56, 28, 255))
    for i in range(10):
        y = PAINT_BOTTOM - 60 + i * 6
        dl.line(P(1000 - i * 5, y, 1160 + i * 5, y), fill=ink, width=2 * K)
    return paint_finish(fills, lines, sky, blur=2)


def paint_zeugma(rng):
    sky = sky_layer([(0, (214, 228, 196)), (0.5, (236, 214, 160)), (1, (226, 184, 120))])
    fills, lines = layer(), layer()
    df, dl = ImageDraw.Draw(fills), ImageDraw.Draw(lines)
    sun(fills, 1240, 700, 28)
    horizon = 860
    for off in (-W, 0, W):
        df.polygon(P(off, horizon, off + 400, 780, off + 900, 800, off + 1400, 760, off + W, horizon), fill=(150, 170, 110, 255))
    ink = (70, 60, 40, 220)

    def column(x, h):
        df.rectangle(P(x - 13, horizon - h, x + 13, horizon), fill=(244, 232, 206, 255))
        df.rectangle(P(x - 20, horizon - h - 14, x + 20, horizon - h), fill=(230, 214, 184, 255))
        dl.line(P(x + 13, horizon - h, x + 13, horizon), fill=ink, width=2 * K)

    for x in range(60, W, 170):
        wrap(column, x + rng.uniform(-20, 20), rng.uniform(110, 190))
    for x in range(30, W, 230):
        for k in range(6):
            cx, cy = x + k * 18, 740 + math.sin(k) * 14
            df.ellipse(P(cx - 11, cy - 15, cx + 11, cy + 15), fill=(130, 170, 80, 255))
            df.ellipse(P(cx - 8, cy - 15, cx + 8, cy - 3), fill=(170, 90, 120, 220))
    water(fills, lines, horizon, 940, (120, 170, 160), (80, 130, 140), (230, 240, 220), rng)
    tile = 12
    colors = [(170, 70, 50, 255), (238, 224, 194, 255), (70, 110, 60, 255), (206, 156, 70, 255)]
    for i, x in enumerate(range(0, W, tile)):
        for j, y in enumerate(range(940, PAINT_BOTTOM, tile)):
            c = colors[(i // 3 + j) % 4] if (i + j) % 5 else colors[1]
            df.rectangle(P(x + 1, y + 1, x + tile - 1, y + tile - 1), fill=c)
    return paint_finish(fills, lines, sky)


def paint_cappadocia(rng):
    sky = sky_layer([(0, (186, 176, 222)), (0.45, (246, 190, 190)), (1, (250, 214, 170))])
    fills, lines = layer(), layer()
    df, dl = ImageDraw.Draw(fills), ImageDraw.Draw(lines)
    sun(fills, 1000, 760, 30)
    palette = [(214, 70, 60), (240, 180, 60), (40, 150, 150), (120, 90, 170), (230, 110, 150)]
    for i in range(26):
        x, y, r = rng.uniform(0, W), rng.uniform(600, 760), rng.uniform(12, 30)
        c = palette[i % len(palette)]
        df.ellipse(P(x - r, y - r, x + r, y + r * 1.1), fill=c + (255,))
        dl.arc(P(x - r * 0.4, y - r, x + r * 0.4, y + r * 1.1), 270, 90, fill=(255, 255, 255, 120), width=1 * K)
        df.rectangle(P(x - r * 0.2, y + r * 1.4, x + r * 0.2, y + r * 1.7), fill=(90, 60, 50, 255))

    def chimney(x, h, w):
        pts = []
        for t in np.linspace(0, 1, 18):
            pts.append((x - w * (1 - t) ** 0.55, PAINT_BOTTOM - h * t))
        for t in np.linspace(1, 0, 18):
            pts.append((x + w * (1 - t) ** 0.55, PAINT_BOTTOM - h * t))
        flat = [c * K for p in pts for c in p]
        df.polygon(flat, fill=(214, 150, 120, 255))
        dl.line(flat[: len(flat) // 2], fill=(250, 200, 160, 200), width=2 * K)
        df.ellipse(P(x - 20, PAINT_BOTTOM - h - 18, x + 20, PAINT_BOTTOM - h + 6), fill=(120, 80, 70, 255))

    for x in range(0, W, 90):
        wrap(chimney, x + rng.uniform(-20, 20), rng.uniform(110, 230), rng.uniform(36, 56))
    return paint_finish(fills, lines, sky)


def paint_aegean(rng):
    sky = sky_layer([(0, (150, 196, 236)), (0.5, (206, 228, 246)), (1, (240, 222, 190))])
    fills, lines = layer(), layer()
    df, dl = ImageDraw.Draw(fills), ImageDraw.Draw(lines)
    sun(fills, 1300, 680, 28)
    horizon = 840
    for off in (-W, 0, W):
        df.polygon(P(off, horizon, off, 780, off + 500, 720, off + 1000, 760, off + 1500, 700, off + W, 780, off + W, horizon),
                   fill=(120, 160, 110, 255))

    def pine(x, h):
        for i in range(4):
            w = 40 - i * 8
            y = horizon - i * h * 0.22
            df.polygon(P(x - w, y, x, y - h * 0.34, x + w, y), fill=(40, 96, 64, 255))

    for x in range(20, W, 120):
        wrap(pine, x + rng.uniform(-30, 30), rng.uniform(90, 150))

    def mill(x):
        df.rectangle(P(x - 22, 720, x + 22, horizon), fill=(252, 250, 244, 255))
        df.pieslice(P(x - 26, 694, x + 26, 744), 180, 360, fill=(70, 110, 170, 255))
        for a in range(0, 360, 60):
            r = math.radians(a + 20)
            dl.line(P(x, 716, x + math.cos(r) * 70, 716 + math.sin(r) * 70), fill=(80, 80, 90, 230), width=2 * K)

    for x in (300, 900, 1500):
        wrap(mill, x)
    water(fills, lines, horizon, PAINT_BOTTOM, (60, 150, 200), (30, 90, 160), (230, 245, 255), rng)
    for x in (620, 1180, 1760):
        df.polygon(P(x, 860, x, 920, x + 44, 920), fill=(255, 255, 255, 255))
        df.polygon(P(x - 50, 926, x + 60, 926, x + 44, 940, x - 36, 940), fill=(250, 250, 250, 255))
    return paint_finish(fills, lines, sky)


# ---------------------------------------------------------------- nazar
def evil_eye(im, x, y, r):
    L = layer()
    d = ImageDraw.Draw(L)
    for rr, c in ((r, (20, 60, 150)), (r * 0.72, (250, 250, 252)), (r * 0.5, (110, 170, 230)), (r * 0.26, (15, 15, 20))):
        d.ellipse(P(x - rr, y - rr, x + rr, y + rr), fill=c + (255,))
    d.ellipse(P(x - r * 0.9, y - r * 0.9, x - r * 0.1, y - r * 0.3), fill=(255, 255, 255, 60))
    d.ellipse(P(x - r * 0.18, y - r * 0.18, x - r * 0.04, y - r * 0.04), fill=(255, 255, 255, 230))
    sh = Image.new("RGBA", (SW, SH), (0, 0, 0, 0))
    sh.putalpha(L.getchannel("A").filter(ImageFilter.GaussianBlur(8 * K)).point(lambda a: int(a * 0.3)))
    im.alpha_composite(sh)
    im.alpha_composite(L)


# ---------------------------------------------------------------- paneller
def back_panel(im, c):
    d = ImageDraw.Draw(im)
    bx, by, bw, bh = 300, 150, 430, 390
    d.rounded_rectangle(P(bx, by, bx + bw, by + bh), radius=16 * K, outline=BRAND_BLUE + (255,), width=3 * K)
    x0 = bx + 22
    d.text(P(x0, by + 14), "Besin Değerleri", font=font("Gloock-Regular.ttf", 34), fill=NAVY)
    d.text(P(x0, by + 58), "100 ml için · örnek değerler", font=font("IBMPlexMono-Regular.ttf", 16), fill=DARK)
    d.line(P(x0, by + 84, bx + bw - 22, by + 84), fill=NAVY, width=4 * K)
    milk = c["milk"]
    rows = [("Enerji", "34 kcal" if milk else "8 kcal"), ("Yağ", "1,1 g" if milk else "0,1 g"),
            ("Karbonhidrat", "4,6 g" if milk else "1,2 g"), ("  Şeker", "0 g"), ("Protein", "1,6 g" if milk else "0,3 g"),
            ("Kafein", "55 mg")]
    y = by + 94
    fr = font("IBMPlexSerif-Regular.ttf", 23)
    for k, v in rows:
        d.text(P(x0, y), k, font=fr, fill=DARK)
        tw = d.textlength(v, font=fr) / K
        d.text(P(bx + bw - 22 - tw, y), v, font=fr, fill=DARK)
        y += 33
        d.line(P(x0, y - 5, bx + bw - 22, y - 5), fill=DARK + (110,), width=1 * K)
    y += 6
    for line in ["İçindekiler: su, Türk kahvesi" + (", süt," if milk else ","), "doğal aroma.  *Konsept etiket."]:
        d.text(P(x0, y), line, font=font("IBMPlexSerif-Regular.ttf", 19), fill=DARK)
        y += 24
    rnd = random.Random(3)
    x = bx - 150
    while x < bx - 30:
        w = rnd.choice((2, 3, 5))
        d.rectangle(P(x, by + bh - 110, x + w, by + bh - 40), fill=DARK)
        x += w + rnd.choice((3, 4, 6))
    d.text(P(bx - 152, by + bh - 34), "8 690000 000000", font=font("IBMPlexMono-Regular.ttf", 14), fill=DARK)


def fal_panel(im):
    d = ImageDraw.Draw(im)
    fx = W * 0.75
    d.rounded_rectangle(P(fx - 200, 150, fx + 200, 540), radius=16 * K, outline=BRAND_BLUE + (255,), width=3 * K)
    f = font("Gloock-Regular.ttf", 40)
    text_c(d, fx, 176, "Fincanını çevir,", f, NAVY + (255,))
    text_c(d, fx, 228, "falın hazır.", f, NAVY + (255,))
    evil_eye(im, fx - 130, 400, 36)
    d = ImageDraw.Draw(im)
    rnd = random.Random(7)
    qs, cell = 21, 8
    qx, qy = fx - 40, 300
    ink = DARK + (255,)
    for i in range(qs):
        for j in range(qs):
            corner = (i < 7 and j < 7) or (i < 7 and j >= qs - 7) or (i >= qs - 7 and j < 7)
            if not corner and rnd.random() < 0.45:
                d.rectangle(P(qx + i * cell, qy + j * cell, qx + i * cell + cell - 1, qy + j * cell + cell - 1), fill=ink)
    for ox, oy in ((0, 0), (qs - 7, 0), (0, qs - 7)):
        x0, y0 = qx + ox * cell, qy + oy * cell
        d.rectangle(P(x0, y0, x0 + 7 * cell - 1, y0 + 7 * cell - 1), outline=ink, width=cell * K)
        d.rectangle(P(x0 + 2 * cell, y0 + 2 * cell, x0 + 5 * cell - 1, y0 + 5 * cell - 1), fill=ink)


# ---------------------------------------------------------------- etiket
FLAVORS = [
    {
        "file": "bold-istanbul.jpg",
        "name": "BOLD ISTANBUL",
        "name_color": (26, 26, 34),
        "descriptor": "DARK & RICH",
        "notes": "100% Natural  |  Zero Sugar  |  Low Calorie",
        "paint": paint_istanbul,
        "milk": False,
    },
    {
        "file": "silky-mardin.jpg",
        "name": "SILKY MARDIN",
        "name_color": (40, 110, 190),
        "descriptor": "MILKY & CREAMY",
        "notes": "Pistachio  |  Cacao  |  Vanilla  |  Cardamom",
        "paint": paint_mardin,
        "milk": True,
    },
    {
        "file": "pistachio-zeugma.jpg",
        "name": "PISTACHIO ZEUGMA",
        "name_color": (52, 110, 48),
        "descriptor": "NUTTY & SMOOTH",
        "notes": "Pistachio  |  Menengiç  |  Zero Sugar",
        "paint": paint_zeugma,
        "milk": True,
    },
    {
        "file": "minty-cappadocia.jpg",
        "name": "MINTY CAPPADOCIA",
        "name_color": (20, 120, 110),
        "descriptor": "FRESH & COOL",
        "notes": "Mint  |  Cardamom  |  Zero Sugar",
        "paint": paint_cappadocia,
        "milk": False,
    },
    {
        "file": "piney-aegean.jpg",
        "name": "PINEY AEGEAN",
        "name_color": (20, 88, 150),
        "descriptor": "LIGHT & AROMATIC",
        "notes": "Mastic  |  Pine  |  Zero Sugar",
        "paint": paint_aegean,
        "milk": False,
    },
]


def render(c, idx):
    rng = np.random.default_rng(idx + 1)
    im = pearl_base(idx)
    art = c["paint"](rng).crop((0, PAINT_TOP * K, SW, PAINT_BOTTOM * K))
    art = art.resize((SW, (BAND_BOTTOM - BAND_TOP) * K), Image.LANCZOS)
    im.alpha_composite(art, (0, BAND_TOP * K))
    bands(im, BRAND_BLUE)
    d = ImageDraw.Draw(im)
    cx = W / 2
    y = 150
    y = text_c(d, cx, y, "TURKISH", font("Gloock-Regular.ttf", 84), BROWN + (255,), spacing=2) + 6
    y = text_c(d, cx, y, "COFFEE", font("Gloock-Regular.ttf", 84), BROWN + (255,), spacing=2) - 6
    y = text_c(d, cx + 10, y, "Lady", font("InstrumentSerif-Italic.ttf", 84), BROWN + (255,)) + 26
    text_c(d, cx, y, c["name"], fit(d, c["name"], "Cinzel-Bold.ttf", 540, 66), c["name_color"] + (255,))
    evil_eye(im, cx - 180, 640, 58)
    d = ImageDraw.Draw(im)
    y = BAND_BOTTOM + 22
    y = text_c(d, cx, y, "ICED TURKISH COFFEE", font("OpenSans-Bold.ttf", 44), NAVY + (255,), spacing=1) + 16
    y = text_c(d, cx, y, c["descriptor"], font("OpenSans-Bold.ttf", 46), BRAND_BLUE + (255,), spacing=2) + 20
    y = text_c(d, cx, y, c["notes"], font("OpenSans-SemiBold.ttf", 26), DARK + (255,)) + 18
    text_c(d, cx, y, "8.5 FL OZ (250 ml)", font("OpenSans-SemiBold.ttf", 32), NAVY + (255,))
    back_panel(im, c)
    fal_panel(im)
    out = im.convert("RGB").resize((W, H), Image.LANCZOS)
    path = os.path.join(OUT, c["file"])
    out.save(path, quality=88, optimize=True)
    return path


if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    only = sys.argv[2] if len(sys.argv) > 2 else None
    for i, c in enumerate(FLAVORS):
        if only and only not in c["file"]:
            continue
        print(render(c, i))
