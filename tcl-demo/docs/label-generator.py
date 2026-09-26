"""Turkish Coffee Lady konsept kutu etiketleri (250 ml slim kutu).

Bold Istanbul ve Silky Mardin, markanın paylaşılan ürün fotoğraflarındaki
kutulardan esinlenerek yeniden çizilmiştir (aynı yerleşim: başlık, "ICED
TURKISH COFFEE", İznik desenli fincan, şehir silueti, tat adı, hacim).
Diğer üç tat aynı tasarım dilinde konsept önerisidir.

Etiket kutuyu sarar: u = 0.5 ön yüz, u = 0.25 arka (besin değerleri),
u = 0.75 yan (dijital fal). Çıktı 2048×1418 JPG.

Kullanım: python3 label-generator.py <çıktı klasörü>
"""
import math
import os
import random
import sys

import numpy as np
from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
FONTS = os.path.join(HERE, "label-fonts")
OUT = sys.argv[1] if len(sys.argv) > 1 else "."

W, H = 2048, 1418  # son çözünürlük
K = 2  # süper örnekleme
SW, SH = W * K, H * K

BLUE = (31, 72, 150)
DARK = (44, 44, 52)


def font(name, size):
    return ImageFont.truetype(os.path.join(FONTS, name), int(size * K))


def P(*v):
    """Tasarım koordinatlarını süper örneklenmiş tuvale çevirir."""
    return [x * K for x in v]


# ---------------------------------------------------------------- zemin
def background(stops, seed):
    ys = np.linspace(0, 1, SH)[:, None]
    img = np.zeros((SH, 1, 3))
    pos = [s[0] for s in stops]
    for c in range(3):
        img[:, 0, c] = np.interp(ys[:, 0], pos, [s[1][c] for s in stops])
    img = np.repeat(img.astype(np.float32), SW, axis=1)
    # fırçalanmış metal: yatay ince çizgiler
    rng = np.random.default_rng(seed)
    streak = (rng.normal(0, 1, (SH, 1)) * 5).astype(np.float32) + rng.normal(0, 1.6, (SH, SW)).astype(np.float32)
    img = np.clip(img + streak[..., None], 0, 255)
    return Image.fromarray(img.astype(np.uint8), "RGB").convert("RGBA")


def edge_bands(im, color):
    d = ImageDraw.Draw(im)
    d.rectangle(P(0, 0, W, 16), fill=color + (255,))
    d.rectangle(P(0, H - 16, W, H), fill=color + (255,))
    d.line(P(0, 24, W, 24), fill=color + (140,), width=2 * K)
    d.line(P(0, H - 24, W, H - 24), fill=color + (140,), width=2 * K)


# ---------------------------------------------------------------- yardımcılar
def wrap_draw(fn, x, *args):
    """Silueti kutunun çevresinde kesintisiz sarması için üç kez çizer."""
    for off in (-W, 0, W):
        fn(x + off, *args)


def layer():
    return Image.new("RGBA", (SW, SH), (0, 0, 0, 0))


def watercolor(fill_layer, blur=6):
    """Dolguları hafifçe dağıtıp suluboya etkisi verir."""
    soft = fill_layer.filter(ImageFilter.GaussianBlur(blur * K))
    return Image.alpha_composite(soft, fill_layer)


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


# ---------------------------------------------------------------- siluetler
def skyline_istanbul(im, rng):
    fills, lines = layer(), layer()
    df, dl = ImageDraw.Draw(fills), ImageDraw.Draw(lines)
    ink = (60, 96, 160, 210)
    # uzak tepeler
    for x in range(-200, W + 200, 260):
        h = rng.uniform(60, 120)
        df.ellipse(P(x - 220, 930 - h, x + 220, 930 + h), fill=(170, 195, 215, 90))

    def mosque(x, s):
        base = 1010
        df.rectangle(P(x - 90 * s, base - 70 * s, x + 90 * s, base), fill=(238, 226, 205, 220))
        df.pieslice(P(x - 62 * s, base - 140 * s, x + 62 * s, base - 16 * s), 180, 360, fill=(222, 214, 200, 235))
        dl.arc(P(x - 62 * s, base - 140 * s, x + 62 * s, base - 16 * s), 180, 360, fill=ink, width=2 * K)
        for dx in (-78, 78):
            df.pieslice(P(x + dx * s - 30 * s, base - 106 * s, x + dx * s + 30 * s, base - 46 * s), 180, 360, fill=(226, 216, 200, 230))
            dl.arc(P(x + dx * s - 30 * s, base - 106 * s, x + dx * s + 30 * s, base - 46 * s), 180, 360, fill=ink, width=2 * K)
        dl.rectangle(P(x - 90 * s, base - 70 * s, x + 90 * s, base), outline=ink, width=2 * K)
        for dx in (-120, 120) if s > 0.9 else (-110,):
            mx = x + dx * s
            df.rectangle(P(mx - 5 * s, base - 230 * s, mx + 5 * s, base), fill=(240, 232, 218, 235))
            dl.rectangle(P(mx - 5 * s, base - 230 * s, mx + 5 * s, base), outline=ink, width=1 * K)
            df.polygon(P(mx - 7 * s, base - 230 * s, mx, base - 270 * s, mx + 7 * s, base - 230 * s), fill=(90, 120, 170, 220))
        for wx in range(-70, 80, 28):
            dl.arc(P(x + wx * s, base - 50 * s, x + (wx + 14) * s, base - 30 * s), 180, 360, fill=ink, width=1 * K)

    def tower(x):
        base = 1010
        df.rectangle(P(x - 22, base - 190, x + 22, base), fill=(232, 220, 200, 230))
        dl.rectangle(P(x - 22, base - 190, x + 22, base), outline=ink, width=2 * K)
        df.polygon(P(x - 30, base - 190, x, base - 250, x + 30, base - 190), fill=(80, 110, 165, 230))
        for wy in range(base - 170, base - 20, 34):
            dl.rectangle(P(x - 6, wy, x + 6, wy + 14), outline=ink, width=1 * K)

    def trees(x):
        for i in range(5):
            r = rng.uniform(16, 30)
            df.ellipse(P(x + i * 22 - r, 1000 - r, x + i * 22 + r, 1000 + r), fill=(110, 160, 115, 150))

    for x in range(60, W, 330):
        wrap_draw(mosque, x + rng.uniform(-30, 30), rng.uniform(0.75, 1.1))
    for x in (380, 1320):
        wrap_draw(tower, x)
    for x in range(0, W, 170):
        wrap_draw(trees, x + rng.uniform(0, 60))
    # su
    for y in range(1016, 1190, 10):
        a = int(120 - (y - 1016) * 0.4)
        df.rectangle(P(0, y, W, y + 10), fill=(120, 170, 215, max(a, 40)))
    for _ in range(120):
        x, y = rng.uniform(0, W), rng.uniform(1030, 1180)
        dl.line(P(x, y, x + rng.uniform(20, 70), y), fill=(255, 255, 255, 150), width=2 * K)
    # vapur
    for x in (700, 1750):
        df.polygon(P(x - 60, 1080, x + 60, 1080, x + 45, 1100, x - 45, 1100), fill=(250, 250, 250, 230))
        df.rectangle(P(x - 30, 1062, x + 25, 1080), fill=(250, 250, 250, 230))
        dl.polygon(P(x - 60, 1080, x + 60, 1080, x + 45, 1100, x - 45, 1100), outline=ink, width=2 * K)
    im.alpha_composite(watercolor(fills, 5))
    im.alpha_composite(lines)


def skyline_mardin(im, rng):
    fills, lines = layer(), layer()
    df, dl = ImageDraw.Draw(fills), ImageDraw.Draw(lines)
    ink = (128, 84, 26, 190)
    # tepe ve kale
    for off in (-W, 0, W):
        df.polygon(P(off + 0, 1200, off + 0, 980, off + 420, 820, off + 900, 760, off + 1400, 800,
                     off + 1800, 900, off + W, 980, off + W, 1200), fill=(196, 146, 60, 70))
    for x in range(700, 1500, 40):
        dl.rectangle(P(x, 742, x + 22, 760), outline=ink, width=2 * K)
    dl.line(P(700, 760, 1500, 760), fill=ink, width=3 * K)

    def house(x, y, w, h):
        df.rectangle(P(x, y, x + w, y + h), fill=(222, 178, 92, 110))
        dl.rectangle(P(x, y, x + w, y + h), outline=ink, width=2 * K)
        for wx in range(int(x + 10), int(x + w - 20), 26):
            dl.arc(P(wx, y + h * 0.35, wx + 14, y + h * 0.35 + 20), 180, 360, fill=ink, width=2 * K)
            dl.line(P(wx, y + h * 0.35 + 10, wx, y + h * 0.35 + 28), fill=ink, width=2 * K)
            dl.line(P(wx + 14, y + h * 0.35 + 10, wx + 14, y + h * 0.35 + 28), fill=ink, width=2 * K)

    for row in range(5):
        y = 840 + row * 62
        for x in range(-40, W + 40, 95):
            if rng.random() < 0.85:
                wrap_draw(lambda xx, yy=y: house(xx, yy + rng.uniform(-10, 10), rng.uniform(70, 110), 58), x + row * 30)
    # merdiven
    for i in range(12):
        y = 1000 + i * 14
        for off in (0,):
            dl.line(P(off + 960 - i * 6, y, off + 1090 + i * 6, y), fill=ink, width=2 * K)
    im.alpha_composite(watercolor(fills, 3))
    im.alpha_composite(lines)


def skyline_zeugma(im, rng):
    fills, lines = layer(), layer()
    df, dl = ImageDraw.Draw(fills), ImageDraw.Draw(lines)
    ink = (60, 80, 40, 200)
    # Fırat
    for y in range(1060, 1190, 10):
        df.rectangle(P(0, y, W, y + 10), fill=(110, 160, 170, 90))
    # sütunlar ve kemerler
    def column(x, h):
        df.rectangle(P(x - 14, 1050 - h, x + 14, 1050), fill=(236, 226, 200, 220))
        dl.rectangle(P(x - 14, 1050 - h, x + 14, 1050), outline=ink, width=2 * K)
        df.rectangle(P(x - 22, 1050 - h - 16, x + 22, 1050 - h), fill=(226, 214, 186, 230))
        dl.rectangle(P(x - 22, 1050 - h - 16, x + 22, 1050 - h), outline=ink, width=2 * K)
        for fx in (-6, 0, 6):
            dl.line(P(x + fx, 1050 - h + 4, x + fx, 1046), fill=(60, 80, 40, 90), width=1 * K)

    for x in range(40, W, 150):
        wrap_draw(column, x + rng.uniform(-20, 20), rng.uniform(120, 220))
    for x in range(115, W, 300):
        wrap_draw(lambda xx: dl.arc(P(xx - 75, 850, xx + 75, 1000), 180, 360, fill=ink, width=3 * K), x)
    # mozaik bant (meander)
    tile = 14
    colors = [(170, 70, 50, 230), (236, 222, 190, 230), (70, 100, 60, 230), (200, 150, 70, 230)]
    for i, x in enumerate(range(0, W, tile)):
        for j, y in enumerate(range(1090, 1160, tile)):
            c = colors[(i // 3 + j) % 4] if (i + j) % 5 else colors[1]
            df.rectangle(P(x + 1, y + 1, x + tile - 1, y + tile - 1), fill=c)
    # fıstıklar
    for x in range(90, W, 260):
        for k in range(3):
            cx, cy = x + k * 26, 820 + (k % 2) * 18
            df.ellipse(P(cx - 14, cy - 20, cx + 14, cy + 20), fill=(150, 180, 90, 210))
            df.ellipse(P(cx - 10, cy - 20, cx + 10, cy - 4), fill=(140, 90, 120, 160))
    im.alpha_composite(watercolor(fills, 3))
    im.alpha_composite(lines)


def skyline_cappadocia(im, rng):
    fills, lines = layer(), layer()
    df, dl = ImageDraw.Draw(fills), ImageDraw.Draw(lines)
    ink = (120, 80, 60, 170)

    def chimney(x, h, w):
        pts = []
        for t in np.linspace(0, 1, 16):
            pts.append((x - w * (1 - t) ** 0.6, 1100 - h * t))
        for t in np.linspace(1, 0, 16):
            pts.append((x + w * (1 - t) ** 0.6, 1100 - h * t))
        flat = [c * K for p in pts for c in p]
        df.polygon(flat, fill=(232, 196, 170, 200))
        dl.line(flat + flat[:2], fill=ink, width=2 * K)
        df.ellipse(P(x - 22, 1100 - h - 20, x + 22, 1100 - h + 6), fill=(140, 100, 80, 230))

    for x in range(20, W, 110):
        wrap_draw(chimney, x + rng.uniform(-20, 20), rng.uniform(120, 260), rng.uniform(40, 62))
    df.rectangle(P(0, 1100, W, 1200), fill=(222, 186, 158, 170))
    # balonlar
    palette = [(214, 70, 60), (240, 180, 60), (40, 150, 150), (120, 90, 170)]
    for i, x in enumerate(range(120, W, 240)):
        if 860 < x < 1200:
            continue
        y = rng.uniform(700, 820)
        r = rng.uniform(26, 40)
        c = palette[i % len(palette)]
        df.ellipse(P(x - r, y - r, x + r, y + r * 1.1), fill=c + (220,))
        for sx in (-0.5, 0, 0.5):
            dl.arc(P(x + sx * r - r * 0.35, y - r, x + sx * r + r * 0.35, y + r * 1.1), 270, 90, fill=(255, 255, 255, 120), width=1 * K)
        dl.line(P(x - r * 0.5, y + r * 1.05, x - 6, y + r * 1.6), fill=(90, 70, 60, 200), width=1 * K)
        dl.line(P(x + r * 0.5, y + r * 1.05, x + 6, y + r * 1.6), fill=(90, 70, 60, 200), width=1 * K)
        df.rectangle(P(x - 7, y + r * 1.6, x + 7, y + r * 1.6 + 10), fill=(110, 80, 60, 230))
    im.alpha_composite(watercolor(fills, 4))
    im.alpha_composite(lines)


def skyline_aegean(im, rng):
    fills, lines = layer(), layer()
    df, dl = ImageDraw.Draw(fills), ImageDraw.Draw(lines)
    ink = (30, 70, 120, 200)
    for off in (-W, 0, W):
        df.polygon(P(off, 1060, off, 930, off + 500, 860, off + 1100, 900, off + 1600, 850, off + W, 930, off + W, 1060), fill=(150, 185, 130, 110))
    # çamlar
    def pine(x, h):
        for i in range(4):
            w = 46 - i * 9
            y = 1000 - i * h * 0.22
            df.polygon(P(x - w, y, x, y - h * 0.34, x + w, y), fill=(50, 105, 70, 200))
        df.rectangle(P(x - 4, 1000, x + 4, 1022), fill=(90, 60, 40, 220))

    for x in range(30, W, 140):
        wrap_draw(pine, x + rng.uniform(-30, 30), rng.uniform(110, 170))
    # yel değirmenleri
    def mill(x):
        df.rectangle(P(x - 26, 820, x + 26, 960), fill=(248, 246, 240, 240))
        dl.rectangle(P(x - 26, 820, x + 26, 960), outline=ink, width=2 * K)
        df.pieslice(P(x - 30, 790, x + 30, 850), 180, 360, fill=(90, 120, 170, 230))
        for a in range(0, 360, 60):
            r = math.radians(a + 15)
            dl.line(P(x, 815, x + math.cos(r) * 80, 815 + math.sin(r) * 80), fill=ink, width=2 * K)

    for x in (300, 1250, 1750):
        wrap_draw(mill, x)
    # deniz ve yelkenliler
    for y in range(1030, 1200, 10):
        df.rectangle(P(0, y, W, y + 10), fill=(40, 110, 175, 110 + (y - 1030) // 3))
    for _ in range(90):
        x, y = rng.uniform(0, W), rng.uniform(1040, 1190)
        dl.arc(P(x, y, x + 40, y + 12), 200, 340, fill=(255, 255, 255, 160), width=2 * K)
    for x in (620, 1560):
        df.polygon(P(x, 1000, x, 1060, x + 48, 1060), fill=(255, 255, 255, 240))
        df.polygon(P(x - 60, 1068, x + 70, 1068, x + 52, 1084, x - 44, 1084), fill=(250, 250, 250, 240))
    im.alpha_composite(watercolor(fills, 4))
    im.alpha_composite(lines)


# ---------------------------------------------------------------- fincan
def cup(im, cx, top):
    """İznik desenli, buzlu Türk kahvesi fincanı (ön yüz)."""
    L = layer()
    d = ImageDraw.Draw(L)
    blue, red = BLUE + (255,), (184, 44, 44, 255)
    rim_y = top + 70
    # tabak
    d.ellipse(P(cx - 185, rim_y + 205, cx + 185, rim_y + 290), fill=(250, 250, 252, 255), outline=blue, width=6 * K)
    d.ellipse(P(cx - 150, rim_y + 218, cx + 150, rim_y + 272), outline=blue, width=2 * K)
    for a in range(0, 360, 12):
        r = math.radians(a)
        px, py = cx + math.cos(r) * 167, rim_y + 247 + math.sin(r) * 36
        d.ellipse(P(px - 5, py - 3, px + 5, py + 3), fill=blue)
    # kulp
    d.arc(P(cx + 85, rim_y + 20, cx + 185, rim_y + 150), -80, 80, fill=blue, width=16 * K)
    d.arc(P(cx + 85, rim_y + 20, cx + 185, rim_y + 150), -80, 80, fill=(250, 250, 252, 255), width=6 * K)
    # gövde
    body = []
    for t in np.linspace(0, 1, 20):
        body.append((cx - 135 + 40 * t ** 2, rim_y + 225 * t))
    for t in np.linspace(1, 0, 20):
        body.append((cx + 115 - 40 * t ** 2, rim_y + 225 * t))
    flat = [c * K for p in body for c in p]
    d.polygon(flat, fill=(252, 252, 254, 255))
    # desen (gövde maskesiyle)
    pat = layer()
    dp = ImageDraw.Draw(pat)
    dp.rectangle(P(cx - 140, rim_y, cx + 120, rim_y + 22), fill=blue)
    dp.rectangle(P(cx - 140, rim_y + 22, cx + 120, rim_y + 28), fill=red)
    for x in range(int(cx - 150), int(cx + 130), 44):
        dp.arc(P(x, rim_y + 40, x + 40, rim_y + 120), 0, 180, fill=blue, width=4 * K)
        dp.ellipse(P(x + 14, rim_y + 60, x + 26, rim_y + 90), fill=blue)
        dp.line(P(x + 20, rim_y + 120, x + 20, rim_y + 200), fill=blue, width=3 * K)
        dp.ellipse(P(x + 10, rim_y + 150, x + 30, rim_y + 175), outline=red, width=3 * K)
    dp.rectangle(P(cx - 140, rim_y + 205, cx + 120, rim_y + 225), fill=blue)
    mask = Image.new("L", (SW, SH), 0)
    ImageDraw.Draw(mask).polygon(flat, fill=255)
    pat.putalpha(ImageChops.multiply(pat.getchannel("A"), mask))
    L.alpha_composite(pat)
    # madalyon
    d.ellipse(P(cx - 48, rim_y + 60, cx + 32, rim_y + 175), fill=(214, 230, 246, 255), outline=blue, width=5 * K)
    d.ellipse(P(cx - 38, rim_y + 70, cx + 22, rim_y + 165), outline=(255, 255, 255, 255), width=2 * K)
    # lale
    tx, ty = cx - 8, rim_y + 115
    d.ellipse(P(tx - 14, ty - 26, tx + 14, ty + 6), fill=red)
    d.polygon(P(tx - 14, ty - 12, tx - 20, ty - 34, tx - 4, ty - 20), fill=red)
    d.polygon(P(tx + 14, ty - 12, tx + 20, ty - 34, tx + 4, ty - 20), fill=red)
    d.line(P(tx, ty + 4, tx, ty + 40), fill=(60, 120, 80, 255), width=3 * K)
    d.polygon(P(tx, ty + 30, tx - 18, ty + 18, tx - 4, ty + 38), fill=(60, 120, 80, 255))
    d.line(flat + flat[:2], fill=blue, width=5 * K)
    # kahve ve buz
    d.ellipse(P(cx - 132, rim_y - 26, cx + 112, rim_y + 26), fill=(250, 250, 252, 255), outline=blue, width=5 * K)
    d.ellipse(P(cx - 118, rim_y - 18, cx + 98, rim_y + 18), fill=(84, 46, 22, 255))
    for (ix, iy, s) in ((-58, -6, 40), (-4, -20, 46), (46, -4, 38)):
        x0, y0 = cx + ix, rim_y + iy
        cube = [(x0 - s / 2, y0), (x0, y0 - s / 2.4), (x0 + s / 2, y0), (x0 + s / 2.2, y0 + s / 1.6), (x0 - s / 2.2, y0 + s / 1.6)]
        d.polygon([c * K for p in cube for c in p], fill=(226, 232, 238, 225), outline=(255, 255, 255, 240))
        d.line(P(x0 - s / 2, y0, x0 + s / 2, y0), fill=(255, 255, 255, 200), width=2 * K)
        d.polygon(P(x0 - s / 2.2, y0 + s / 1.6, x0 + s / 2.2, y0 + s / 1.6, x0 + s / 2.6, y0 + s / 1.1, x0 - s / 2.6, y0 + s / 1.1), fill=(150, 96, 56, 200))
    # parlama
    d.line(P(cx - 110, rim_y + 40, cx - 96, rim_y + 180), fill=(255, 255, 255, 170), width=8 * K)
    shadow = L.getchannel("A").filter(ImageFilter.GaussianBlur(10 * K))
    sh = Image.new("RGBA", (SW, SH), (0, 0, 0, 0))
    sh.putalpha(shadow.point(lambda a: int(a * 0.25)))
    im.alpha_composite(sh)
    im.alpha_composite(L)


# ---------------------------------------------------------------- yan paneller
def back_panel(im, c, milk):
    d = ImageDraw.Draw(im)
    bx, by, bw, bh = 290, 110, 440, 600
    d.rounded_rectangle(P(bx, by, bx + bw, by + bh), radius=18 * K, fill=(255, 255, 255, 190), outline=c["title"] + (255,), width=3 * K)
    x0 = bx + 26
    d.text(P(x0, by + 18), "Besin Değerleri", font=font("Gloock-Regular.ttf", 42), fill=DARK)
    d.text(P(x0, by + 72), "100 ml için · örnek değerler", font=font("IBMPlexMono-Regular.ttf", 18), fill=DARK)
    d.line(P(x0, by + 102, bx + bw - 26, by + 102), fill=DARK, width=5 * K)
    rows = [("Enerji", "34 kcal" if milk else "12 kcal"), ("Yağ", "1,1 g" if milk else "0,1 g"),
            ("Karbonhidrat", "4,6 g" if milk else "2,4 g"), ("  Şeker", "4,2 g" if milk else "2,1 g"),
            ("Protein", "1,6 g" if milk else "0,3 g"), ("Kafein", "55 mg")]
    y = by + 116
    fr = font("IBMPlexSerif-Regular.ttf", 28)
    for k, v in rows:
        d.text(P(x0, y), k, font=fr, fill=DARK)
        tw = d.textlength(v, font=fr) / K
        d.text(P(bx + bw - 26 - tw, y), v, font=fr, fill=DARK)
        y += 42
        d.line(P(x0, y - 6, bx + bw - 26, y - 6), fill=DARK + (120,), width=1 * K)
    y += 8
    lines = ["İçindekiler: su, Türk kahvesi" + (", süt," if milk else ","), "şeker, doğal aroma.", "", "*Konsept etiket; değerler örnektir."]
    for line in lines:
        d.text(P(x0, y), line, font=font("IBMPlexSerif-Regular.ttf", 22), fill=DARK)
        y += 28
    rnd = random.Random(3)
    x = bx + bw - 160
    while x < bx + bw - 30:
        w = rnd.choice((2, 3, 5))
        d.rectangle(P(x, by + bh - 62, x + w, by + bh - 20), fill=DARK)
        x += w + rnd.choice((3, 4, 6))


def fal_panel(im, c):
    d = ImageDraw.Draw(im)
    fx = W * 0.75
    d.rounded_rectangle(P(fx - 210, 110, fx + 210, 670), radius=18 * K, fill=(255, 255, 255, 170), outline=c["title"] + (255,), width=3 * K)
    f = font("Gloock-Regular.ttf", 50)
    text_c(d, fx, 140, "Fincanını", f, c["title"] + (255,))
    text_c(d, fx, 206, "çevir,", f, c["title"] + (255,))
    text_c(d, fx, 272, "falın hazır.", f, c["title"] + (255,))
    cy = 400
    ink = DARK + (255,)
    d.ellipse(P(fx - 90, cy + 40, fx + 90, cy + 64), outline=ink, width=3 * K)
    d.polygon(P(fx - 50, cy + 46, fx + 50, cy + 46, fx + 36, cy - 30, fx - 36, cy - 30), outline=ink, width=4 * K)
    rnd = random.Random(7)
    qs, cell = 21, 8
    qx, qy = fx - qs * cell / 2, cy + 90
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
        "title_lines": ["BOLD", "ISTANBUL"],
        "flavor_lines": ["TRADITIONAL", "FLAVOR"],
        "title": (30, 62, 132),
        "stops": [(0, (238, 241, 244)), (0.45, (226, 232, 238)), (0.75, (196, 216, 234)), (1, (170, 204, 232))],
        "band": (150, 165, 180),
        "skyline": skyline_istanbul,
        "milk": False,
    },
    {
        "file": "silky-mardin.jpg",
        "title_lines": ["SILKY", "MARDIN"],
        "flavor_lines": ["MILKY", "FLAVOR"],
        "title": (140, 28, 36),
        "stops": [(0, (238, 204, 120)), (0.5, (214, 164, 70)), (1, (186, 132, 52))],
        "band": (150, 105, 40),
        "skyline": skyline_mardin,
        "milk": True,
    },
    {
        "file": "pistachio-zeugma.jpg",
        "title_lines": ["PISTACHIO", "ZEUGMA"],
        "flavor_lines": ["PISTACHIO", "FLAVOR"],
        "title": (48, 88, 40),
        "stops": [(0, (232, 238, 214)), (0.5, (204, 220, 164)), (1, (172, 196, 124))],
        "band": (110, 135, 80),
        "skyline": skyline_zeugma,
        "milk": True,
    },
    {
        "file": "minty-cappadocia.jpg",
        "title_lines": ["MINTY", "CAPPADOCIA"],
        "flavor_lines": ["MINT &", "CARDAMOM"],
        "title": (22, 104, 96),
        "stops": [(0, (228, 244, 237)), (0.55, (196, 230, 214)), (1, (236, 210, 190))],
        "band": (110, 160, 145),
        "skyline": skyline_cappadocia,
        "milk": False,
    },
    {
        "file": "piney-aegean.jpg",
        "title_lines": ["PINEY", "AEGEAN"],
        "flavor_lines": ["MASTIC", "FLAVOR"],
        "title": (16, 80, 130),
        "stops": [(0, (238, 245, 251)), (0.5, (206, 226, 243)), (1, (120, 166, 210))],
        "band": (90, 130, 170),
        "skyline": skyline_aegean,
        "flavor_color": (255, 255, 255),
        "small_color": (240, 246, 252),
        "milk": False,
    },
]


def render(c, idx):
    rng = np.random.default_rng(idx + 1)
    im = background(c["stops"], idx)
    c["skyline"](im, rng)
    edge_bands(im, c["band"])
    d = ImageDraw.Draw(im)
    cx = W / 2
    title = c["title"] + (255,)
    y = 70
    for line in c["title_lines"]:
        f = fit(d, line, "Cinzel-Bold.ttf", 560, 124)
        y = text_c(d, cx, y, line, f, title) + 20
    y += 12
    text_c(d, cx, y, "ICED TURKISH COFFEE", font("OpenSans-Bold.ttf", 38), DARK + (255,), spacing=1)
    cup(im, cx, y + 70)
    d = ImageDraw.Draw(im)
    fy = 1170
    fcol = c.get("flavor_color", c["title"]) + (255,)
    for line in c["flavor_lines"]:
        f = fit(d, line, "Cinzel-Bold.ttf", 430, 70)
        fy = text_c(d, cx, fy, line, f, fcol) + 12
    text_c(d, cx, fy + 14, "8.5 FL OZ (250 ml)", font("OpenSans-SemiBold.ttf", 30), c.get("small_color", DARK) + (255,))
    back_panel(im, c, c["milk"])
    fal_panel(im, c)
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
