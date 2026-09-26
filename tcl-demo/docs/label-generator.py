"""Turkish Coffee Lady konsept kutu etiketleri (250 ml slim kutu), v3.

Markanın paylaşılan ürün görseline (altın Silky Mardin, gümüş-mavi Bold
Istanbul) göre yeniden çizilmiştir: serif tat başlığı, "ICED TURKISH COFFEE",
buzlu kahveli İznik fincanı ve madalyonda Lady figürü, alt yarıda şehir
resmi (Istanbul suluboya, Mardin kabartma), tat tanımı ve hacim. Diğer üç tat
aynı tasarım dilinde konsept önerisidir.

Etiket kutuyu sarar: u = 0.5 ön yüz, u = 0.25 arka (besin değerleri),
u = 0.75 yan (dijital fal). Çıktı 2048×1418 JPG.

Kullanım: python3 label-generator.py <çıktı klasörü> [dosya adı filtresi]
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

W, H = 2048, 1418
K = 2
SW, SH = W * K, H * K
CX = W / 2

# Resim bandı (etiket koordinatı, üstten)
PAINT_Y0, PAINT_Y1 = 560, 1150

COBALT = (28, 62, 150)
TURQ = (40, 150, 170)
IZNIK_RED = (190, 40, 36)


def font(name, size):
    return ImageFont.truetype(os.path.join(FONTS, name), int(size * K))


def P(*v):
    return [x * K for x in v]


def layer(w=SW, h=SH):
    return Image.new("RGBA", (w, h), (0, 0, 0, 0))


def text_c(d, cx, y, s, f, fill, spacing=0):
    widths = [d.textlength(ch, font=f) for ch in s]
    total = sum(widths) + spacing * K * (len(s) - 1)
    x = cx * K - total / 2
    _, t, _, b = d.textbbox((0, 0), s, font=f)
    for ch, w in zip(s, widths):
        d.text((x, y * K - t), ch, font=f, fill=fill)
        x += w + spacing * K
    return y + (b - t) / K


def fit(d, s, name, width, start, spacing=0):
    size = start
    while size > 10:
        f = font(name, size)
        w = sum(d.textlength(ch, font=f) for ch in s) + spacing * K * (len(s) - 1)
        if w / K <= width:
            return f
        size -= 1
    return font(name, 10)


def smooth_noise(w, h, cells, seed, lo=0.0, hi=1.0):
    rng = np.random.default_rng(seed)
    small = rng.random((cells[1], cells[0])).astype(np.float32)
    img = Image.fromarray((small * 255).astype(np.uint8), "L").resize((w, h), Image.BICUBIC)
    a = np.asarray(img).astype(np.float32) / 255
    return lo + (hi - lo) * a


# ================================================================ zemin
def metallic_base(stops, seed, sheen=0.06):
    """Dikey renk geçişi + fırçalanmış metal dokusu."""
    ys = np.linspace(0, 1, SH)
    base = np.zeros((SH, 3), np.float32)
    pos = [s[0] for s in stops]
    for c in range(3):
        base[:, c] = np.interp(ys, pos, [s[1][c] for s in stops])
    img = np.repeat(base[:, None, :], SW, axis=1)
    rng = np.random.default_rng(seed)
    streak = rng.normal(0, 1, (SH, 1)).astype(np.float32) * 4 + rng.normal(0, 1.4, (SH, SW)).astype(np.float32)
    wave = smooth_noise(SW, SH, (10, 3), seed + 5, 1 - sheen, 1 + sheen)
    img = img * wave[..., None] + streak[..., None]
    return Image.fromarray(np.clip(img, 0, 255).astype(np.uint8), "RGB").convert("RGBA")


# ================================================================ suluboya
class Watercolor:
    """Beyaz kâğıt üzerine çarpma (multiply) karışımlı suluboya katmanları."""

    def __init__(self, w, h, seed):
        self.w, self.h = w, h
        self.rgb = np.ones((h, w, 3), np.float32)
        self.cover = np.zeros((h, w), np.float32)
        self.seed = seed

    @staticmethod
    def _draw(m):
        d = ImageDraw.Draw(m)
        d.ink = d.draw.draw_ink(255)  # varsayılan renk beyaz (maske)
        d.fill = True  # renk verilmeyen şekiller dolu çizilsin
        return d

    def wash(self, draw_fn, color, alpha=0.7, blur=1.2, edge=0.45, grain=0.35):
        m = Image.new("L", (self.w, self.h), 0)
        draw_fn(self._draw(m))
        m = m.filter(ImageFilter.GaussianBlur(blur))
        a = np.asarray(m).astype(np.float32) / 255
        wide = np.asarray(m.filter(ImageFilter.GaussianBlur(7))).astype(np.float32) / 255
        rim = np.clip(a - wide, 0, 1) * 2.2  # kenarda pigment birikmesi
        self.seed += 1
        pig = smooth_noise(self.w, self.h, (max(2, self.w // 60), max(2, self.h // 60)), self.seed, 1 - grain, 1)
        k = np.clip(a * min(1, alpha * 1.25) * pig + rim * edge * alpha, 0, 1)
        col = np.array(color, np.float32) / 255
        self.rgb *= 1 - k[..., None] * (1 - col)
        self.cover = np.maximum(self.cover, np.clip(k * 1.6, 0, 1))

    def paint(self, draw_fn, color, alpha=0.9):
        """Beyaz gibi açık renkler için örtücü (gouache) boya."""
        m = Image.new("L", (self.w, self.h), 0)
        draw_fn(self._draw(m))
        a = np.asarray(m.filter(ImageFilter.GaussianBlur(0.8))).astype(np.float32) / 255 * alpha
        col = np.array(color, np.float32) / 255
        self.rgb = self.rgb * (1 - a[..., None]) + col * a[..., None]
        self.cover = np.maximum(self.cover, a)

    def line(self, draw_fn, color, alpha=0.6):
        m = Image.new("L", (self.w, self.h), 0)
        draw_fn(self._draw(m))
        a = np.asarray(m.filter(ImageFilter.GaussianBlur(0.6))).astype(np.float32) / 255 * alpha
        col = np.array(color, np.float32) / 255
        self.rgb *= 1 - a[..., None] * (1 - col)
        self.cover = np.maximum(self.cover, a)

    def image(self, fade_top=120, fade_bottom=110):
        rng = np.random.default_rng(3)
        paper = rng.normal(0, 0.025, (self.h, self.w, 1)).astype(np.float32)
        rgb = np.clip(self.rgb + paper, 0, 1)
        ys = np.arange(self.h, dtype=np.float32)
        fade = np.clip(ys / fade_top, 0, 1) * np.clip((self.h - ys) / fade_bottom, 0, 1)
        ragged = smooth_noise(self.w, self.h, (self.w // 40, 6), 9, 0.75, 1.0)
        a = np.clip(self.cover * 1.7, 0, 1) * fade[:, None] * ragged
        out = np.dstack([rgb * 255, a * 255]).astype(np.uint8)
        return Image.fromarray(out, "RGBA")


def paint_istanbul(seed):
    w, h = W, PAINT_Y1 - PAINT_Y0
    wc = Watercolor(w, h, seed)
    rng = random.Random(seed)
    hz = 390  # su hattı

    wc.wash(lambda d: d.rectangle([0, 60, w, hz]), (200, 222, 240), 0.35, blur=30, edge=0)
    wc.wash(lambda d: [d.ellipse([x - 260, 250, x + 260, 440]) for x in range(0, w + 300, 330)], (170, 190, 200), 0.3, blur=10)

    def mosque(d, x, s, big=False):
        d.rectangle([x - 90 * s, hz - 80 * s, x + 90 * s, hz])
        d.pieslice([x - 62 * s, hz - 170 * s, x + 62 * s, hz - 46 * s], 180, 360)
        d.rectangle([x - 62 * s, hz - 108 * s, x + 62 * s, hz - 76 * s])
        for dx in (-78, 78):
            d.pieslice([x + dx * s - 26 * s, hz - 120 * s, x + dx * s + 26 * s, hz - 68 * s], 180, 360)
        for dx in ((-128, 128) if big else (-112,)):
            mx = x + dx * s
            d.rectangle([mx - 5 * s, hz - 250 * s, mx + 5 * s, hz])
            d.polygon([(mx - 7 * s, hz - 250 * s), (mx, hz - 300 * s), (mx + 7 * s, hz - 250 * s)])

    def back(d):
        for x in range(60, w, 360):
            mosque(d, x + rng.uniform(-40, 40), 0.75)
    wc.wash(back, (140, 160, 200), 0.65)

    def houses(d):
        for x in range(0, w, 46):
            hh = rng.uniform(40, 110)
            d.rectangle([x, hz - hh, x + 40, hz])
    wc.wash(houses, (232, 184, 112), 0.7)

    def houses2(d):
        for x in range(20, w, 90):
            hh = rng.uniform(30, 70)
            d.rectangle([x, hz - hh, x + 36, hz])
    wc.wash(houses2, (236, 150, 150), 0.6)

    for x0 in (620, 620 + w / 2):
        wc.wash(lambda d, x0=x0: mosque(d, x0, 1.25, big=True), (160, 176, 212), 0.85)
        wc.line(lambda d, x0=x0: d.arc([x0 - 77, hz - 212, x0 + 77, hz - 58], 190, 350, width=2), (80, 100, 140), 0.7)

    def galata(d, x):
        d.rectangle([x - 22, hz - 260, x + 22, hz])
        d.rectangle([x - 28, hz - 272, x + 28, hz - 258])
        d.polygon([(x - 26, hz - 272), (x, hz - 330), (x + 26, hz - 272)])
    for x0 in (1200, 1200 - w / 2):
        wc.wash(lambda d, x0=x0: galata(d, x0), (214, 200, 176), 0.8)
        wc.wash(lambda d, x0=x0: d.polygon([(x0 - 26, hz - 272), (x0, hz - 330), (x0 + 26, hz - 272)]), (90, 110, 150), 0.8)

    def trees(d):
        for x in range(0, w, 70):
            r = rng.uniform(18, 34)
            d.ellipse([x - r, hz - 30 - r, x + r, hz - 30 + r])
    wc.wash(trees, (96, 158, 92), 0.75)

    wc.wash(lambda d: d.rectangle([0, hz, w, h]), (130, 186, 228), 0.75, blur=4)
    wc.wash(lambda d: d.rectangle([0, hz + 60, w, h]), (100, 150, 210), 0.45, blur=20)

    def reflect(d):
        for _ in range(140):
            x, y = rng.uniform(0, w), rng.uniform(hz + 8, h - 20)
            d.line([x, y, x + rng.uniform(12, 40), y], width=3)
    wc.wash(reflect, (200, 170, 140), 0.35, blur=1, edge=0)

    def glints(d):
        for _ in range(220):
            x, y = rng.uniform(0, w), rng.uniform(hz + 10, h - 10)
            d.line([x, y, x + rng.uniform(10, 46), y], width=2)
    wc.paint(glints, (250, 252, 255), 0.55)

    def boats(d):
        for x in (360, 980, 1640):
            d.polygon([(x - 40, hz + 70), (x + 40, hz + 70), (x + 30, hz + 84), (x - 30, hz + 84)])
            d.rectangle([x - 18, hz + 56, x + 16, hz + 70])
    wc.paint(boats, (252, 252, 250), 0.9)
    return wc.image(fade_top=170)


def etched_mardin(seed):
    """Altın zemine kabartma gibi işlenmiş Mardin: koyu çizgi + açık vurgu."""
    w, h = W, PAINT_Y1 - PAINT_Y0
    rng = random.Random(seed)
    dark = Image.new("L", (w, h), 0)
    lite = Image.new("L", (w, h), 0)
    fill = Image.new("L", (w, h), 0)
    dd, dl, df = ImageDraw.Draw(dark), ImageDraw.Draw(lite), ImageDraw.Draw(fill)

    def both(fn):
        fn(dd, 0, 0)
        fn(dl, -1.5, -1.5)

    for off in (-w, 0, w):
        df.polygon([(off, h), (off, 330), (off + 500, 220), (off + 900, 170), (off + 1300, 190), (off + 1700, 260), (off + w, 330), (off + w, h)], fill=50)

    def castle(d, ox, oy):
        for off in (-w, 0, w):
            d.line([(off + 700 + ox, 160 + oy), (off + 1350 + ox, 160 + oy)], fill=255, width=3)
            for x in range(700, 1350, 36):
                d.rectangle([off + x + ox, 140 + oy, off + x + 20 + ox, 160 + oy], outline=255, width=2)
    both(castle)

    houses = []
    for row in range(7):
        y = 230 + row * 50
        for x in range(-60, w + 60, 78):
            if rng.random() < 0.82:
                houses.append((x + row * 22 + rng.uniform(-8, 8), y + rng.uniform(-6, 6), rng.uniform(56, 80), 44))

    def house_lines(d, ox, oy):
        for x, y, ww, hh in houses:
            for off in (-w, 0, w):
                X = x + off + ox
                d.rectangle([X, y + oy, X + ww, y + hh + oy], outline=255, width=2)
                for wx in range(int(X + 8), int(X + ww - 14), 20):
                    d.arc([wx, y + 12 + oy, wx + 12, y + 28 + oy], 180, 360, fill=255, width=2)
                    d.line([(wx, y + 20 + oy), (wx, y + 34 + oy)], fill=255, width=2)
                    d.line([(wx + 12, y + 20 + oy), (wx + 12, y + 34 + oy)], fill=255, width=2)
    both(house_lines)
    for x, y, ww, hh in houses:
        for off in (-w, 0, w):
            df.rectangle([x + off, y, x + off + ww, y + hh], fill=int(rng.uniform(20, 70)))

    def minaret(d, ox, oy):
        for x in (880, 880 - w / 2):
            d.rectangle([x - 14 + ox, 120 + oy, x + 14 + ox, 470 + oy], outline=255, width=2)
            d.rectangle([x - 22 + ox, 180 + oy, x + 22 + ox, 192 + oy], outline=255, width=2)
            d.arc([x - 16 + ox, 94 + oy, x + 16 + ox, 140 + oy], 180, 360, fill=255, width=2)
    both(minaret)

    def bridge(d, ox, oy):
        for off in (-w, 0, w):
            d.line([(off + ox, 520 + oy), (off + w + ox, 520 + oy)], fill=255, width=2)
            for x in range(0, w, 120):
                d.arc([off + x + ox, 470 + oy, off + x + 110 + ox, 580 + oy], 180, 360, fill=255, width=2)
    both(bridge)

    a_dark = np.asarray(dark.filter(ImageFilter.GaussianBlur(0.7))).astype(np.float32) / 255
    a_lite = np.asarray(lite.filter(ImageFilter.GaussianBlur(0.7))).astype(np.float32) / 255
    a_fill = np.asarray(fill.filter(ImageFilter.GaussianBlur(1.5))).astype(np.float32) / 255
    ys = np.arange(h, dtype=np.float32)
    fade = (np.clip((ys - 60) / 220, 0, 1) * np.clip((h - ys) / 140, 0, 1))[:, None]
    rgb = np.zeros((h, w, 3), np.float32)
    alpha = np.zeros((h, w), np.float32)
    for a, col, k in ((a_fill, (170, 120, 40), 0.35), (a_dark, (140, 96, 26), 0.55), (a_lite, (255, 238, 180), 0.5)):
        a = a * k * fade
        rgb = rgb * (1 - a[..., None]) + np.array(col, np.float32) * a[..., None]
        alpha = alpha + a * (1 - alpha)
    rgb = rgb / np.maximum(alpha[..., None], 1e-4) * np.clip(alpha[..., None] * 3, 0, 1) + (1 - np.clip(alpha[..., None] * 3, 0, 1)) * rgb
    return Image.fromarray(np.dstack([np.clip(rgb, 0, 255), alpha * 255]).astype(np.uint8), "RGBA")


def paint_zeugma(seed):
    w, h = W, PAINT_Y1 - PAINT_Y0
    wc = Watercolor(w, h, seed)
    rng = random.Random(seed)
    hz = 400
    wc.wash(lambda d: d.rectangle([0, 80, w, hz]), (226, 232, 206), 0.4, blur=30, edge=0)
    wc.wash(lambda d: [d.ellipse([x - 300, 280, x + 300, 460]) for x in range(0, w + 300, 360)], (160, 180, 120), 0.5, blur=6)

    def cols(d):
        for x in range(60, w, 170):
            hh = rng.uniform(140, 230)
            d.rectangle([x - 14, hz - hh, x + 14, hz])
            d.rectangle([x - 22, hz - hh - 16, x + 22, hz - hh])
    wc.paint(cols, (240, 230, 206), 0.9)
    wc.line(lambda d: [d.line([x + 14, hz - 220, x + 14, hz], width=2) for x in range(60, w, 170)], (120, 100, 70), 0.5)

    def pist(d):
        for x in range(40, w, 210):
            for k in range(6):
                cx, cy = x + k * 16, 250 + math.sin(k) * 14
                d.ellipse([cx - 10, cy - 14, cx + 10, cy + 14])
    wc.wash(pist, (150, 186, 90), 0.8)
    wc.wash(lambda d: d.rectangle([0, hz, w, 470]), (120, 176, 172), 0.7)
    tiles = [(176, 70, 52), (236, 222, 190), (80, 120, 70), (208, 160, 76)]
    for ci, col in enumerate(tiles):
        def mos(d, ci=ci):
            for i, x in enumerate(range(0, w, 14)):
                for j, y in enumerate(range(478, 548, 14)):
                    if ((i // 3 + j) % 4 == ci and (i + j) % 5) or (ci == 1 and (i + j) % 5 == 0):
                        d.rectangle([x + 1, y + 1, x + 12, y + 12])
        wc.paint(mos, col, 0.85)
    return wc.image(fade_top=170)


def paint_cappadocia(seed):
    w, h = W, PAINT_Y1 - PAINT_Y0
    wc = Watercolor(w, h, seed)
    wc.wash(lambda d: d.rectangle([0, 60, w, 420]), (238, 206, 214), 0.45, blur=30, edge=0)
    palette = [(220, 80, 70), (242, 186, 70), (40, 160, 160), (130, 100, 180), (232, 120, 160)]
    for i, col in enumerate(palette):
        def balloons(d, i=i):
            r2 = random.Random(seed + i)
            for _ in range(6):
                x, y, r = r2.uniform(0, w), r2.uniform(90, 300), r2.uniform(14, 30)
                d.ellipse([x - r, y - r, x + r, y + r * 1.15])
                d.rectangle([x - r * 0.2, y + r * 1.45, x + r * 0.2, y + r * 1.75])
        wc.wash(balloons, col, 0.85, blur=0.8)

    def chimneys(d, tone):
        r2 = random.Random(seed + 50)
        for x in range(0, w, 84):
            x += r2.uniform(-18, 18)
            hh, ww = r2.uniform(150, 280), r2.uniform(34, 56)
            pts = [(x - ww * (1 - t) ** 0.55, h - hh * t) for t in np.linspace(0, 1, 18)]
            pts += [(x + ww * (1 - t) ** 0.55, h - hh * t) for t in np.linspace(1, 0, 18)]
            if tone:
                d.ellipse([x - 18, h - hh - 16, x + 18, h - hh + 6])
            else:
                d.polygon(pts)
    wc.wash(lambda d: chimneys(d, 0), (226, 170, 140), 0.75)
    wc.wash(lambda d: chimneys(d, 1), (140, 96, 80), 0.6)
    return wc.image(fade_top=160)


def paint_aegean(seed):
    w, h = W, PAINT_Y1 - PAINT_Y0
    wc = Watercolor(w, h, seed)
    rng = random.Random(seed)
    hz = 360
    wc.wash(lambda d: d.rectangle([0, 60, w, hz]), (206, 226, 244), 0.45, blur=30, edge=0)
    wc.wash(lambda d: [d.ellipse([x - 280, 250, x + 280, 420]) for x in range(0, w + 300, 340)], (140, 176, 120), 0.55, blur=6)

    def pines(d):
        for x in range(20, w, 110):
            x += rng.uniform(-24, 24)
            hh = rng.uniform(90, 150)
            for i in range(4):
                ww = 36 - i * 7
                y = hz - i * hh * 0.22
                d.polygon([(x - ww, y), (x, y - hh * 0.34), (x + ww, y)])
    wc.wash(pines, (48, 110, 76), 0.8)
    wc.paint(lambda d: [d.rectangle([x - 20, hz - 130, x + 20, hz]) for x in (320, 980, 1560)], (250, 248, 240), 0.95)
    wc.line(lambda d: [d.line([x, hz - 124, x + math.cos(math.radians(a)) * 64, hz - 124 + math.sin(math.radians(a)) * 64], width=2)
                       for x in (320, 980, 1560) for a in range(15, 375, 60)], (80, 80, 90), 0.7)
    wc.wash(lambda d: d.rectangle([0, hz, w, h]), (70, 150, 206), 0.75, blur=4)
    wc.wash(lambda d: d.rectangle([0, hz + 80, w, h]), (40, 100, 170), 0.35, blur=20)
    wc.paint(lambda d: [d.polygon([(x, hz + 30), (x, hz + 90), (x + 42, hz + 90)]) for x in (640, 1240, 1820)], (255, 255, 255), 0.95)

    def glints(d):
        for _ in range(200):
            x, y = rng.uniform(0, w), rng.uniform(hz + 10, h - 10)
            d.line([x, y, x + rng.uniform(10, 46), y], width=2)
    wc.paint(glints, (240, 248, 255), 0.5)
    return wc.image(fade_top=160)


# ================================================================ İznik fincanı
def tulip(d, x, y, s, col, stem):
    d.line([x, y, x, y + 34 * s], fill=stem, width=max(1, int(3 * s)))
    d.ellipse([x - 9 * s, y - 16 * s, x + 9 * s, y + 4 * s], fill=col)
    d.polygon([(x - 9 * s, y - 6 * s), (x - 13 * s, y - 22 * s), (x - 3 * s, y - 12 * s)], fill=col)
    d.polygon([(x + 9 * s, y - 6 * s), (x + 13 * s, y - 22 * s), (x + 3 * s, y - 12 * s)], fill=col)
    d.polygon([(x - 3 * s, y - 14 * s), (x, y - 26 * s), (x + 3 * s, y - 14 * s)], fill=col)


def saz_leaf(d, x, y, length, ang, col):
    up, down = [], []
    for t in np.linspace(0, 1, 16):
        wv = math.sin(math.pi * t) * length * 0.16
        bx, by = x + math.cos(ang) * length * t, y + math.sin(ang) * length * t
        up.append((bx - math.sin(ang) * wv, by + math.cos(ang) * wv))
        down.append((bx + math.sin(ang) * wv, by - math.cos(ang) * wv))
    d.polygon(up + down[::-1], fill=col)


def rosette(d, x, y, r, col, center):
    for a in range(0, 360, 60):
        ra = math.radians(a)
        d.ellipse([x + math.cos(ra) * r - r * 0.55, y + math.sin(ra) * r - r * 0.55,
                   x + math.cos(ra) * r + r * 0.55, y + math.sin(ra) * r + r * 0.55], fill=col)
    d.ellipse([x - r * 0.6, y - r * 0.6, x + r * 0.6, y + r * 0.6], fill=center)


def lady(d, x, y, s):
    """Madalyondaki Lady figürü: başörtülü kadın, elinde fincan."""
    white = (250, 250, 252, 255)
    line = (40, 70, 140, 255)
    body = [(x - 34 * s, y + 62 * s), (x - 26 * s, y + 10 * s), (x - 14 * s, y - 8 * s), (x + 14 * s, y - 8 * s),
            (x + 26 * s, y + 10 * s), (x + 34 * s, y + 62 * s)]
    d.polygon(P(*[c for p in body for c in p]), fill=white, outline=line)
    d.ellipse(P(x - 17 * s, y - 44 * s, x + 17 * s, y - 2 * s), fill=white, outline=line, width=int(1.5 * K))
    d.polygon(P(x - 17 * s, y - 24 * s, x - 24 * s, y + 20 * s, x - 10 * s, y + 4 * s), fill=white, outline=line)
    d.ellipse(P(x - 9 * s, y - 33 * s, x + 9 * s, y - 11 * s), fill=(246, 228, 214, 255))
    d.arc(P(x - 20 * s, y + 6 * s, x + 12 * s, y + 36 * s), 20, 160, fill=line, width=int(1.5 * K))
    d.rectangle(P(x - 4 * s, y + 18 * s, x + 8 * s, y + 28 * s), fill=COBALT + (255,))
    for yy in (32, 44, 54):
        d.line(P(x - 22 * s, y + yy * s, x + 22 * s, y + (yy + 4) * s), fill=(120, 150, 200, 200), width=int(1 * K))


def iznik_cup(im, cx, top, scale=1.0):
    """Buzlu Türk kahvesi dolu İznik desenli fincan ve tabak."""
    s = scale
    L = layer()
    d = ImageDraw.Draw(L)
    blue = COBALT + (255,)
    red = IZNIK_RED + (255,)
    turq = TURQ + (255,)
    white = (252, 252, 254, 255)
    rim_y = top + 92 * s
    cup_w, cup_h, base_w = 150 * s, 230 * s, 100 * s

    # tabak
    sy = rim_y + cup_h - 20 * s
    d.ellipse(P(cx - 225 * s, sy - 10 * s, cx + 225 * s, sy + 110 * s), fill=white, outline=blue, width=int(5 * K))
    d.ellipse(P(cx - 200 * s, sy + 2 * s, cx + 200 * s, sy + 96 * s), outline=blue, width=int(10 * K))
    for a in range(0, 360, 10):
        ra = math.radians(a)
        px, py = cx + math.cos(ra) * 200 * s, sy + 49 * s + math.sin(ra) * 47 * s
        d.ellipse(P(px - 5 * s, py - 3 * s, px + 5 * s, py + 3 * s), fill=white)
    for a in range(5, 360, 20):
        ra = math.radians(a)
        px, py = cx + math.cos(ra) * 214 * s, sy + 50 * s + math.sin(ra) * 53 * s
        d.ellipse(P(px - 4 * s, py - 4 * s, px + 4 * s, py + 4 * s), fill=red)
    d.ellipse(P(cx - 120 * s, sy + 20 * s, cx + 120 * s, sy + 80 * s), fill=(236, 240, 248, 255), outline=blue, width=int(3 * K))

    # kulp
    d.arc(P(cx + 110 * s, rim_y + 30 * s, cx + 210 * s, rim_y + 170 * s), -85, 85, fill=blue, width=int(22 * K))
    d.arc(P(cx + 110 * s, rim_y + 30 * s, cx + 210 * s, rim_y + 170 * s), -85, 85, fill=white, width=int(10 * K))

    # gövde
    body = []
    for t in np.linspace(0, 1, 30):
        body.append((cx - cup_w + (cup_w - base_w) * t ** 1.6, rim_y + cup_h * t))
    for t in np.linspace(1, 0, 30):
        body.append((cx + cup_w - (cup_w - base_w) * t ** 1.6, rim_y + cup_h * t))
    flat = [c * K for p in body for c in p]
    d.polygon(flat, fill=white)

    pat = layer()
    dp = ImageDraw.Draw(pat)
    dp.rectangle(P(cx - 170 * s, rim_y, cx + 170 * s, rim_y + 30 * s), fill=blue)
    for x in np.arange(cx - 165 * s, cx + 170 * s, 22 * s):
        dp.arc(P(x, rim_y + 6 * s, x + 18 * s, rim_y + 26 * s), 180, 360, fill=white, width=int(2 * K))
    dp.rectangle(P(cx - 170 * s, rim_y + 30 * s, cx + 170 * s, rim_y + 36 * s), fill=red)
    for x in np.arange(cx - 180 * s, cx + 200 * s, 64 * s):
        saz_leaf(dp, x * K, (rim_y + 120 * s) * K, 70 * s * K, math.radians(-30), blue)
        saz_leaf(dp, (x + 30 * s) * K, (rim_y + 170 * s) * K, 56 * s * K, math.radians(-150), turq)
        tulip(dp, (x + 20 * s) * K, (rim_y + 70 * s) * K, 1.1 * s * K, red, (40, 110, 70, 255))
        rosette(dp, (x + 44 * s) * K, (rim_y + 190 * s) * K, 9 * s * K, blue, red)
    dp.rectangle(P(cx - 170 * s, rim_y + cup_h - 26 * s, cx + 170 * s, rim_y + cup_h), fill=blue)
    for x in np.arange(cx - 165 * s, cx + 170 * s, 18 * s):
        dp.ellipse(P(x, rim_y + cup_h - 18 * s, x + 8 * s, rim_y + cup_h - 10 * s), fill=white)
    mask = Image.new("L", (SW, SH), 0)
    ImageDraw.Draw(mask).polygon(flat, fill=255)
    pat.putalpha(ImageChops.multiply(pat.getchannel("A"), mask))
    L.alpha_composite(pat)

    # madalyon ve Lady
    my = rim_y + 124 * s
    d.ellipse(P(cx - 50 * s, my - 70 * s, cx + 50 * s, my + 70 * s), fill=(214, 232, 246, 255), outline=(200, 160, 80, 255), width=int(5 * K))
    d.ellipse(P(cx - 42 * s, my - 62 * s, cx + 42 * s, my + 62 * s), outline=blue, width=int(2 * K))
    lady(d, cx, my + 4 * s, 1.0 * s)

    # silindirik gölge
    x0, x1 = int((cx - cup_w) * K), int((cx + cup_w) * K)
    xs = np.linspace(-1, 1, x1 - x0).astype(np.float32)
    band = np.clip(xs * 0.3, 0, 1) + np.clip(-xs - 0.75, 0, 1) * 0.4
    m = np.asarray(mask).astype(np.float32)[:, x0:x1] / 255
    shade = np.zeros((SH, SW), np.float32)
    shade[:, x0:x1] = band[None, :] * m
    dark = Image.new("RGBA", (SW, SH), (20, 30, 60, 0))
    dark.putalpha(Image.fromarray((shade * 255).astype(np.uint8), "L"))
    L.alpha_composite(dark)
    d = ImageDraw.Draw(L)
    d.line(flat + flat[:2], fill=blue, width=int(3 * K))

    # ağız, kahve ve buz
    d.ellipse(P(cx - cup_w, rim_y - 28 * s, cx + cup_w, rim_y + 28 * s), fill=white, outline=blue, width=int(5 * K))
    d.ellipse(P(cx - cup_w + 12 * s, rim_y - 19 * s, cx + cup_w - 12 * s, rim_y + 19 * s), fill=(122, 70, 34, 255))
    d.ellipse(P(cx - 90 * s, rim_y - 12 * s, cx + 40 * s, rim_y + 10 * s), fill=(156, 98, 54, 255))
    for (ix, iy, sz, rot) in ((-66, -26, 62, -0.25), (6, -48, 70, 0.1), (62, -22, 56, 0.35)):
        x0_, y0_ = cx + ix * s, rim_y + iy * s
        z = sz * s
        c, sn = math.cos(rot), math.sin(rot)

        def R(px, py):
            return (x0_ + (px * c - py * sn), y0_ + (px * sn + py * c))
        top_f = [R(-z / 2, -z * 0.15), R(0, -z * 0.45), R(z / 2, -z * 0.15), R(0, z * 0.15)]
        left_f = [R(-z / 2, -z * 0.15), R(0, z * 0.15), R(0, z * 0.7), R(-z / 2, z * 0.4)]
        right_f = [R(0, z * 0.15), R(z / 2, -z * 0.15), R(z / 2, z * 0.4), R(0, z * 0.7)]
        for face, col in ((left_f, (214, 190, 170, 200)), (right_f, (186, 150, 120, 200)), (top_f, (244, 238, 230, 215))):
            d.polygon([v * K for p in face for v in p], fill=col)
        d.line([v * K for p in top_f + top_f[:1] for v in p], fill=(255, 250, 240, 255), width=int(2 * K))
        a, b = R(-z * 0.3, -z * 0.18), R(z * 0.05, -z * 0.34)
        d.line([a[0] * K, a[1] * K, b[0] * K, b[1] * K], fill=(255, 255, 255, 230), width=int(3 * K))
    d.line(P(cx - cup_w + 22 * s, rim_y + 44 * s, cx - cup_w + 34 * s, rim_y + 190 * s), fill=(255, 255, 255, 170), width=int(8 * K))

    shadow = L.getchannel("A").filter(ImageFilter.GaussianBlur(12 * K))
    sh_img = Image.new("RGBA", (SW, SH), (0, 0, 0, 0))
    sh_img.putalpha(shadow.point(lambda v: int(v * 0.22)))
    im.alpha_composite(sh_img, (0, 8 * K))
    im.alpha_composite(L)


# ================================================================ yan paneller
def back_panel(im, c):
    d = ImageDraw.Draw(im)
    ink = c["small"] + (255,)
    frame = c["title"] + (255,)
    bx, by, bw, bh = 330, 110, 380, 420
    d.rounded_rectangle(P(bx, by, bx + bw, by + bh), radius=14 * K, outline=frame, width=3 * K)
    x0 = bx + 20
    d.text(P(x0, by + 14), "Besin Değerleri", font=font("Gloock-Regular.ttf", 32), fill=frame)
    d.text(P(x0, by + 56), "100 ml için · örnek değerler", font=font("IBMPlexMono-Regular.ttf", 15), fill=ink)
    d.line(P(x0, by + 80, bx + bw - 20, by + 80), fill=frame, width=4 * K)
    milk = c["milk"]
    rows = [("Enerji", "34 kcal" if milk else "8 kcal"), ("Yağ", "1,1 g" if milk else "0,1 g"),
            ("Karbonhidrat", "4,6 g" if milk else "1,2 g"), ("  Şeker", "0 g"), ("Protein", "1,6 g" if milk else "0,3 g"),
            ("Kafein", "55 mg")]
    y = by + 90
    fr = font("IBMPlexSerif-Regular.ttf", 22)
    for k, v in rows:
        d.text(P(x0, y), k, font=fr, fill=ink)
        tw = d.textlength(v, font=fr) / K
        d.text(P(bx + bw - 20 - tw, y), v, font=fr, fill=ink)
        y += 34
        d.line(P(x0, y - 5, bx + bw - 20, y - 5), fill=ink[:3] + (110,), width=1 * K)
    y += 6
    for line in ["İçindekiler: su, Türk kahvesi" + (", süt," if milk else ","), "doğal aroma.", "*Konsept etiket."]:
        d.text(P(x0, y), line, font=font("IBMPlexSerif-Regular.ttf", 18), fill=ink)
        y += 23
    rnd = random.Random(3)
    x = bx - 150
    while x < bx - 30:
        w = rnd.choice((2, 3, 5))
        d.rectangle(P(x, by + bh - 110, x + w, by + bh - 40), fill=ink)
        x += w + rnd.choice((3, 4, 6))
    d.text(P(bx - 152, by + bh - 34), "8 690000 000000", font=font("IBMPlexMono-Regular.ttf", 14), fill=ink)


def evil_eye(im, x, y, r):
    L = layer()
    d = ImageDraw.Draw(L)
    for rr, col in ((r, (20, 60, 150)), (r * 0.72, (250, 250, 252)), (r * 0.5, (110, 170, 230)), (r * 0.26, (15, 15, 20))):
        d.ellipse(P(x - rr, y - rr, x + rr, y + rr), fill=col + (255,))
    d.ellipse(P(x - r * 0.18, y - r * 0.18, x - r * 0.04, y - r * 0.04), fill=(255, 255, 255, 230))
    im.alpha_composite(L)


def fal_panel(im, c):
    d = ImageDraw.Draw(im)
    fx = W * 0.75
    frame = c["title"] + (255,)
    ink = c["small"] + (255,)
    d.rounded_rectangle(P(fx - 190, 110, fx + 190, 530), radius=14 * K, outline=frame, width=3 * K)
    f = font("Gloock-Regular.ttf", 38)
    text_c(d, fx, 136, "Fincanını çevir,", f, frame)
    text_c(d, fx, 186, "falın hazır.", f, frame)
    evil_eye(im, fx - 120, 390, 34)
    d = ImageDraw.Draw(im)
    rnd = random.Random(7)
    qs, cell = 21, 8
    qx, qy = fx - 40, 290
    for i in range(qs):
        for j in range(qs):
            corner = (i < 7 and j < 7) or (i < 7 and j >= qs - 7) or (i >= qs - 7 and j < 7)
            if not corner and rnd.random() < 0.45:
                d.rectangle(P(qx + i * cell, qy + j * cell, qx + i * cell + cell - 1, qy + j * cell + cell - 1), fill=ink)
    for ox, oy in ((0, 0), (qs - 7, 0), (0, qs - 7)):
        x0, y0 = qx + ox * cell, qy + oy * cell
        d.rectangle(P(x0, y0, x0 + 7 * cell - 1, y0 + 7 * cell - 1), outline=ink, width=cell * K)
        d.rectangle(P(x0 + 2 * cell, y0 + 2 * cell, x0 + 5 * cell - 1, y0 + 5 * cell - 1), fill=ink)
    text_c(d, fx, 488, "Coffee Sayer AI", font("OpenSans-SemiBold.ttf", 22), ink)


# ================================================================ etiketler
GOLD = [(0, (236, 200, 96)), (0.35, (224, 180, 70)), (0.7, (206, 158, 52)), (1, (222, 182, 80))]
PEARL_BLUE = [(0, (232, 230, 216)), (0.4, (236, 236, 228)), (0.62, (220, 230, 238)), (1, (178, 208, 234))]

FLAVORS = [
    {
        "file": "bold-istanbul.jpg",
        "lines": ["BOLD", "ISTANBUL"],
        "descriptor": ["TRADITIONAL", "FLAVOR"],
        "title": (30, 58, 138),
        "small": (48, 50, 60),
        "base": PEARL_BLUE,
        "art": paint_istanbul,
        "milk": False,
    },
    {
        "file": "silky-mardin.jpg",
        "lines": ["SILKY", "MARDIN"],
        "descriptor": ["MILKY", "FLAVOR"],
        "title": (150, 26, 28),
        "small": (70, 44, 14),
        "base": GOLD,
        "art": etched_mardin,
        "milk": True,
    },
    {
        "file": "pistachio-zeugma.jpg",
        "lines": ["PISTACHIO", "ZEUGMA"],
        "descriptor": ["NUTTY", "FLAVOR"],
        "title": (46, 96, 40),
        "small": (48, 56, 40),
        "base": [(0, (226, 232, 206)), (0.45, (220, 228, 196)), (0.7, (206, 220, 180)), (1, (180, 204, 150))],
        "art": paint_zeugma,
        "milk": True,
    },
    {
        "file": "minty-cappadocia.jpg",
        "lines": ["MINTY", "CAPPADOCIA"],
        "descriptor": ["MINTY", "FLAVOR"],
        "title": (18, 110, 100),
        "small": (40, 56, 56),
        "base": [(0, (222, 240, 234)), (0.45, (214, 236, 228)), (0.7, (230, 214, 222)), (1, (236, 204, 196))],
        "art": paint_cappadocia,
        "milk": False,
    },
    {
        "file": "piney-aegean.jpg",
        "lines": ["PINEY", "AEGEAN"],
        "descriptor": ["MASTIC", "FLAVOR"],
        "title": (18, 78, 140),
        "small": (36, 48, 66),
        "base": [(0, (226, 236, 244)), (0.45, (216, 230, 242)), (0.7, (180, 208, 232)), (1, (130, 176, 218))],
        "art": paint_aegean,
        "milk": False,
    },
]


def render(c, idx):
    im = metallic_base(c["base"], idx, sheen=0.08 if c["art"] is etched_mardin else 0.05)
    art = c["art"](idx + 1)
    art = art.resize((SW, (PAINT_Y1 - PAINT_Y0) * K), Image.LANCZOS)
    im.alpha_composite(art, (0, PAINT_Y0 * K))

    d = ImageDraw.Draw(im)
    title = c["title"] + (255,)
    small = c["small"] + (255,)
    y = 150
    for line in c["lines"]:
        f = fit(d, line, "Cinzel-Bold.ttf", 540, 128, spacing=2)
        y = text_c(d, CX, y, line, f, title, spacing=2) + 26
    y += 18
    text_c(d, CX, y, "ICED TURKISH COFFEE", fit(d, "ICED TURKISH COFFEE", "OpenSans-SemiBold.ttf", 470, 46), small)
    iznik_cup(im, CX, y + 80, 1.08)
    d = ImageDraw.Draw(im)
    fy = 1150
    for line in c["descriptor"]:
        f = fit(d, line, "Cinzel-Bold.ttf", 420, 74, spacing=1)
        fy = text_c(d, CX, fy, line, f, title, spacing=1) + 14
    text_c(d, CX, fy + 16, "8.5 FL OZ (250 ml)", font("OpenSans-SemiBold.ttf", 34), small, spacing=1)

    back_panel(im, c)
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
