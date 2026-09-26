"""Hope Istanbul konsept şişe dokuları (100 ml Extrait de Parfum).

Doku şişenin içini sarar: parfümün rengi, arka yüze işlenmiş İstanbul
silueti ve ön yüzde altın varaklı, Osmanlı kemeri biçiminde bir etiket.
u = 0.5 ön yüz (etiket), u = 0.25 koku piramidi, u = 0.75 hikâye paneli.
Silüet bandı (üstten %44–%78) arka planda bulanık şehir olarak da kullanılır.

Çıktı 2048×1024 JPG. Kullanım: python3 label-generator.py <çıktı klasörü>
"""
import math
import os
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
FONTS = os.path.join(HERE, "label-fonts")
OUT = sys.argv[1] if len(sys.argv) > 1 else "."

W, H = 2048, 1024
K = 2
SW, SH = W * K, H * K
SKY0, SKY1 = 0.44, 0.80  # silüet bandı (üstten oran)


def font(name, size):
    return ImageFont.truetype(os.path.join(FONTS, name), int(size * K))


def hexc(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def text_c(d, cx, y, s, f, fill=255, spacing=0):
    """Ortalanmış, harf aralıklı yazı. y üst kenar (doku pikseli)."""
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
    return lo + (hi - lo) * np.asarray(img).astype(np.float32) / 255


def mask():
    m = Image.new("L", (SW, SH), 0)
    d = ImageDraw.Draw(m)
    return m, d


def arr(m, blur=0):
    if blur:
        m = m.filter(ImageFilter.GaussianBlur(blur * K))
    return np.asarray(m).astype(np.float32) / 255


# ================================================================ sıvı
def liquid(top, bottom, seed):
    """Şişenin içi: dikey renk geçişi, cam kırılması çizgileri, hava payı."""
    ys = np.linspace(0, 1, SH, dtype=np.float32)[:, None]
    xs = np.linspace(0, 1, SW, dtype=np.float32)[None, :]
    t, b = np.array(top, np.float32), np.array(bottom, np.float32)
    k = np.clip((ys - 0.06) / 0.94, 0, 1) ** 0.9
    img = t * (1 - k[..., None]) + b * k[..., None]
    img = np.broadcast_to(img, (SH, SW, 3)).copy()
    # Kalın camın kırdığı ışık: şişe çevresinde yumuşak dikey bantlar.
    band = 0.5 + 0.5 * np.sin(xs * math.pi * 2 * 6 + 0.6) * np.sin(xs * math.pi * 2 * 2.3 + 1.1)
    streak = smooth_noise(SW, SH, (48, 2), seed, 0.96, 1.04)
    img *= (0.95 + 0.08 * band)[..., None] * streak[..., None]
    # Hava payı: en üstte sıvı biter, cam daha açık görünür.
    air = np.clip((0.055 - ys) / 0.02, 0, 1)
    img = img * (1 - air[..., None]) + np.array([232, 230, 226], np.float32) * air[..., None] * 0.9
    menisc = np.exp(-((ys - 0.058) / 0.006) ** 2)
    img += menisc[..., None] * 70
    # Tabana doğru koyulaşma.
    img *= (1 - 0.25 * np.clip((ys - 0.7) / 0.3, 0, 1))[..., None]
    img += np.random.default_rng(seed + 1).normal(0, 1.6, img.shape)
    return np.clip(img, 0, 255)


def gold(seed):
    """Altın varak rengi: yatay parıltı ve kıvrımlı yansıma."""
    xs = np.linspace(0, 1, SW, dtype=np.float32)[None, :]
    ys = np.linspace(0, 1, SH, dtype=np.float32)[:, None]
    s = 0.5 + 0.5 * np.sin(xs * 40 + ys * 9) * np.cos(xs * 13 - ys * 5)
    s = s * smooth_noise(SW, SH, (40, 20), seed, 0.8, 1.15)
    lo, hi = np.array([150, 104, 38], np.float32), np.array([255, 226, 150], np.float32)
    return lo + (hi - lo) * np.clip(s, 0, 1)[..., None]


def put(img, a, color):
    """a maskesiyle rengi karıştırır (color dizi ya da RGB)."""
    col = np.asarray(color, np.float32)
    return img * (1 - a[..., None]) + col * a[..., None]


# ================================================================ silüetler
def sky_y(v):
    return int((SKY0 + (SKY1 - SKY0) * v) * SH)


def dome(d, x, base, r, fill=255):
    d.pieslice([x - r, base - r, x + r, base + r], 180, 360, fill=fill)
    d.polygon([(x - r * 0.08, base - r), (x, base - r - r * 0.45), (x + r * 0.08, base - r)], fill=fill)


def minaret(d, x, base, h, w, fill=255):
    d.rectangle([x - w, base - h, x + w, base], fill=fill)
    d.rectangle([x - w * 1.6, base - h * 0.72, x + w * 1.6, base - h * 0.69], fill=fill)
    d.polygon([(x - w, base - h), (x, base - h - w * 7), (x + w, base - h)], fill=fill)


def mosque(d, x, base, s, fill=255):
    dome(d, x, base - 70 * s, 110 * s, fill)
    for k in (-1, 1):
        dome(d, x + k * 150 * s, base - 30 * s, 60 * s, fill)
        dome(d, x + k * 250 * s, base - 5 * s, 38 * s, fill)
    d.rectangle([x - 300 * s, base - 70 * s, x + 300 * s, base], fill=fill)
    for k in (-1, 1):
        minaret(d, x + k * 330 * s, base, 360 * s, 12 * s, fill)


def scene_peninsula(d, seed):
    """Tarihi Yarımada: Ayasofya ve Sultanahmet."""
    base = sky_y(0.95)
    for i in range(0, SW + 1, SW // 2):  # dokunun iki yarısında (yan panellerin arkası)
        mosque(d, i + 360, base, 1.25)
        mosque(d, i + 1500, base, 0.95)
        d.rectangle([i, base - 60, i + SW // 2, base], fill=255)
        for j in range(18):
            x = i + j * 120 + 20
            d.rectangle([x, base - 90 - (j * 37 % 60), x + 90, base], fill=255)


def scene_han(d, seed):
    """Kapalıçarşı hanı: kemerli revaklar ve kubbe dizileri."""
    base = sky_y(0.98)
    for x in range(0, SW, 240):
        d.rectangle([x, base - 420, x + 240, base], fill=255)
        dome(d, x + 120, base - 420, 100)
    m, dd = mask()
    for x in range(0, SW, 240):  # kemerleri boşalt
        dd.rectangle([x + 40, base - 250, x + 200, base], fill=255)
        dd.pieslice([x + 40, base - 330, x + 200, base - 170], 180, 360, fill=255)
    d.bitmap((0, 0), m, fill=0)
    for x in range(120, SW, 480):
        minaret(d, x, base - 380, 420, 13)


def scene_palace(d, seed):
    """İki kıta, bir aşk: Topkapı'nın Adalet Kulesi ve Boğaz köprüsü."""
    base = sky_y(0.9)
    for i in (0, SW // 2):
        x = i + 520
        d.rectangle([x - 45, base - 520, x + 45, base], fill=255)
        d.rectangle([x - 60, base - 560, x + 60, base - 520], fill=255)
        d.polygon([(x - 60, base - 560), (x, base - 820), (x + 60, base - 560)], fill=255)
        d.rectangle([x - 420, base - 150, x + 300, base], fill=255)
        for k in range(6):
            dome(d, x - 360 + k * 110, base - 150, 40)
        # Köprü: iki kule ve sarkan kablo.
        bx = i + 1450
        for k in (-1, 1):
            d.rectangle([bx + k * 330 - 14, base - 480, bx + k * 330 + 14, base + 40], fill=255)
        d.rectangle([bx - 600, base - 90, bx + 600, base - 70], fill=255)
        top = base - 480
        pts = [(bx - 600, base - 90), (bx - 330, top)]
        pts += [(bx + t, top + 330 * (1 - (t / 330) ** 2) * 0.9) for t in range(-330, 331, 15)]
        pts += [(bx + 330, top), (bx + 600, base - 90)]
        d.line(pts, fill=255, width=7)
    d.rectangle([0, base, SW, SH], fill=0)


def scene_walls(d, seed):
    """Fatih'in kaleleri: Rumeli Hisarı'nın kuleleri ve mazgallı surlar."""
    base = sky_y(0.98)
    for x in range(-100, SW + 100, 520):
        h = 520 + (x * 7 % 180)
        r = 110
        d.rectangle([x - r, base - h, x + r, base], fill=255)
        d.polygon([(x - r - 10, base - h), (x, base - h - 260), (x + r + 10, base - h)], fill=255)
        wall = base - 300
        d.rectangle([x + r, wall, x + 520 - r, base], fill=255)
        for mx in range(int(x + r), int(x + 520 - r), 44):
            d.rectangle([mx, wall - 34, mx + 24, wall], fill=255)


def scene_tower(d, seed):
    """Derin sır: denizin ortasında Kız Kulesi."""
    base = sky_y(0.72)
    for i in (0, SW // 2):
        x = i + 1240
        d.rectangle([x - 260, base - 90, x + 260, base], fill=255)
        d.rectangle([x - 70, base - 430, x + 70, base - 90], fill=255)
        d.rectangle([x - 100, base - 450, x + 100, base - 430], fill=255)
        d.polygon([(x - 90, base - 450), (x, base - 640), (x + 90, base - 450)], fill=255)
        d.rectangle([x + 70, base - 260, x + 200, base - 90], fill=255)
        dome(d, x + 135, base - 260, 65)
    rng = np.random.default_rng(seed)
    for _ in range(90):  # dalgalar
        x, y = rng.integers(0, SW), rng.integers(base + 20, sky_y(1.0))
        d.arc([x - 80, y - 14, x + 80, y + 14], 200, 340, fill=255, width=5)


# ================================================================ etiket
def arch_path(cx, top, bottom, half):
    """Sivri Osmanlı kemeri."""
    pts = []
    spring = top + half * 1.25
    for t in np.linspace(0, 1, 40):
        a = math.pi * 0.5 * t
        x = cx - half + half * (1 - math.cos(a)) * 0.98
        y = spring - (spring - top) * math.sin(a) ** 1.4
        pts.append((x, y))
    right = [(2 * cx - x, y) for x, y in reversed(pts)]
    return pts + right + [(cx + half, bottom), (cx - half, bottom)]


def tulip(d, x, y, s, fill=255, width=3):
    d.line([(x, y + 38 * s), (x, y + 70 * s)], fill=fill, width=int(width * K))
    d.polygon([(x, y - 30 * s), (x - 20 * s, y + 10 * s), (x - 8 * s, y + 38 * s), (x + 8 * s, y + 38 * s), (x + 20 * s, y + 10 * s)], fill=fill)
    d.polygon([(x - 8 * s, y + 38 * s), (x - 36 * s, y - 14 * s), (x - 20 * s, y + 40 * s)], fill=fill)
    d.polygon([(x + 8 * s, y + 38 * s), (x + 36 * s, y - 14 * s), (x + 20 * s, y + 40 * s)], fill=fill)


def label(c):
    """Ön yüz etiketi: koyu mine zemin + altın varak (iki maske)."""
    cx, top, bottom, half = W * 0.5, 150, 800, 250
    plate, dp = mask()
    dp.polygon([(x * K, y * K) for x, y in arch_path(cx, top, bottom, half)], fill=255)
    ink, d = mask()
    outer = [(x * K, y * K) for x, y in arch_path(cx, top, bottom, half)]
    inner = [(x * K, y * K) for x, y in arch_path(cx, top + 22, bottom - 18, half - 18)]
    d.line(outer + outer[:1], fill=255, width=5 * K)
    d.line(inner + inner[:1], fill=255, width=2 * K)
    tulip(d, cx * K, (top + 92) * K, 0.9 * K)
    y = top + 200
    y = text_c(d, cx, y, "HOPE", font("Cinzel-Bold.ttf", 96), spacing=16) + 18
    y = text_c(d, cx, y, "İSTANBUL", font("Cinzel-Medium.ttf", 30), spacing=14) + 36
    d.line([((cx - 120) * K, y * K), ((cx + 120) * K, y * K)], fill=255, width=2 * K)
    d.ellipse([(cx - 7) * K, (y - 7) * K, (cx + 7) * K, (y + 7) * K], fill=255)
    y += 34
    for line in c["lines"]:
        f = fit(d, line, "Cinzel-Bold.ttf", 400, 64, spacing=4)
        y = text_c(d, cx, y, line, f, spacing=4) + 16
    y += 18
    text_c(d, cx, y, "EXTRAIT DE PARFUM", font("OpenSans-SemiBold.ttf", 22), spacing=7)
    text_c(d, cx, bottom - 64, "100 ml e  3.4 FL.OZ", font("OpenSans-SemiBold.ttf", 20), spacing=3)
    return arr(plate, 0.6), arr(ink, 0.35)


def side_panel(c, cx, title, rows):
    """Arka yüze altın serigrafi ile basılmış yazı paneli."""
    ink, d = mask()
    y = 220
    y = text_c(d, cx, y, title, font("Cinzel-Bold.ttf", 34), spacing=8) + 22
    d.line([((cx - 90) * K, y * K), ((cx + 90) * K, y * K)], fill=255, width=2 * K)
    y += 30
    for head, body in rows:
        y = text_c(d, cx, y, head, font("OpenSans-SemiBold.ttf", 18), spacing=6) + 10
        for line in body:
            y = text_c(d, cx, y, line, font("Gloock-Regular.ttf", 30)) + 8
        y += 22
    return arr(ink, 0.3)


# ================================================================ kokular
PERFUMES = [
    {
        "file": "han.jpg",
        "lines": ["HAN"],
        "top": "#d4903f", "bottom": "#6b3210", "plate": "#241006",
        "scene": scene_han,
        "notes": [("TOP", ["Limon · Tarçın"]), ("HEART", ["Paçuli · Sedir"]), ("BASE", ["Kuru odun · Amber", "Misk"])],
        "story": ("KAPALIÇARŞI", [("ESİN", ["Baharat kokan", "han avluları"]), ("PARFÜMÖR", ["Gökhan Şimşek"])]),
    },
    {
        "file": "queen-of-palace.jpg",
        "lines": ["QUEEN OF", "PALACE"],
        "top": "#f5c3cc", "bottom": "#b4506d", "plate": "#330b19",
        "scene": scene_palace,
        "notes": [("TOP", ["Bergamot · Mango", "Frenk üzümü"]), ("HEART", ["Gül · Yasemin · İris"]), ("BASE", ["Vanilya · Amber", "Sandal ağacı"])],
        "story": ("İKİ KITA, BİR AŞK", [("KOLEKSİYON", ["Two Continents", "One Love"]), ("ESİN", ["Topkapı'nın", "sultanları"])]),
    },
    {
        "file": "narcissus.jpg",
        "lines": ["NARCISSUS"],
        "top": "#f7ecc0", "bottom": "#cfa94c", "plate": "#1f1706",
        "scene": scene_peninsula,
        "notes": [("TOP", ["Çarkıfelek · Mandalina", "Bergamot"]), ("HEART", ["Sümbülteber", "Beyaz çiçekler"]), ("BASE", ["Vanilya · Amber", "Beyaz misk"])],
        "story": ("TARİHİ YARIMADA", [("KOLEKSİYON", ["Historical", "Peninsula"]), ("PARFÜMÖR", ["Gökhan Şimşek"])]),
    },
    {
        "file": "grand-conqueror.jpg",
        "lines": ["GRAND", "CONQUEROR"],
        "top": "#d8d0e8", "bottom": "#6f5f98", "plate": "#171228",
        "scene": scene_walls,
        "notes": [("TOP", ["Bergamot · Mandalina", "Limon"]), ("HEART", ["İris · Yasemin"]), ("BASE", ["Günlük · Vetiver", "Amber"])],
        "story": ("FATİH'İN İZİNDE", [("ESİN", ["Liderliğin", "zamansız karizması"]), ("PARFÜMÖR", ["Gökhan Şimşek"])]),
    },
    {
        "file": "deep-secret.jpg",
        "lines": ["DEEP", "SECRET"],
        "top": "#78c6d2", "bottom": "#0f4262", "plate": "#04141e",
        "scene": scene_tower,
        "notes": [("TOP", ["Hibiskus · Şakayık", "Şeftali · Deniz"]), ("HEART", ["Yasemin · Menekşe", "Manolya"]), ("BASE", ["Misk · Amber", "Kaşmiran"])],
        "story": ("BOĞAZ'IN SIRRI", [("ESİN", ["Kız Kulesi'nin", "efsanesi"]), ("PARFÜMÖR", ["Julien Rasquinet"])]),
    },
]


def render(c, idx):
    img = liquid(hexc(c["top"]), hexc(c["bottom"]), idx + 10)
    # Silüet: sıvının içinden görünen koyu, altın kenarlı şehir.
    sky, d = mask()
    c["scene"](d, idx)
    s = arr(sky, 1.2)
    edge = np.clip(s - arr(sky.filter(ImageFilter.MinFilter(9)), 1.0), 0, 1)
    img = img * (1 - 0.42 * s[..., None])
    g = gold(idx)
    img = put(img, edge * 0.55, g)
    # Yan paneller ve ön etiket.
    notes = side_panel(c, W * 0.25, "NOTALAR", c["notes"])
    title, rows = c["story"]
    story = side_panel(c, W * 0.75, title, rows)
    panels = np.clip(notes + story, 0, 1)
    shade = np.asarray(Image.fromarray((panels * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(5 * K))).astype(np.float32) / 255
    img = img * (1 - np.clip(shade * 1.4, 0, 0.55))[..., None]
    img = put(img, panels * 0.95, g)
    plate, ink = label(c)
    img = put(img, plate * 0.9, hexc(c["plate"]))
    img = put(img, ink, g)
    out = Image.fromarray(np.clip(img, 0, 255).astype(np.uint8), "RGB").resize((W, H), Image.LANCZOS)
    path = os.path.join(OUT, c["file"])
    out.save(path, quality=88, optimize=True)
    return path


if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    only = sys.argv[2] if len(sys.argv) > 2 else None
    for i, c in enumerate(PERFUMES):
        if only and only not in c["file"]:
            continue
        print(render(c, i))
