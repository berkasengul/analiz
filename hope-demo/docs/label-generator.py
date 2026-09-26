"""Hope Istanbul konsept şişe etiketleri (100 ml Extrait de Parfum).

Markanın ürün fotoğrafına göre çizilmiştir (docs/reference): parlak altın
plaka, siyah sekiz köşeli yıldız, altın geçmeli çizgiler ve ortada siyah
kare içinde HOPE / ISTANBUL / koku adı / EXTRAIT DE PARFUM.

Doku bir atlas: sol yarı (u 0–0.5) ön etiket, sağ yarı (u 0.5–1) arka etiket
(koku piramidi, ilham aldığı yer ve İstanbul silueti). Arka etiketin silüet
bandı (üstten %44–%80) arka planda bulanık şehir olarak da kullanılır.

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

S = 1024  # bir etiketin kenarı (doku pikseli)
K = 2  # süper örnekleme
N = S * K


def font(name, size):
    return ImageFont.truetype(os.path.join(FONTS, name), int(size * K))


def text_c(d, cx, y, s, f, fill=255, spacing=0):
    """Ortalanmış, harf aralıklı yazı. y üst kenar (etiket pikseli)."""
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
    while size > 8:
        f = font(name, size)
        w = sum(d.textlength(ch, font=f) for ch in s) + spacing * K * (len(s) - 1)
        if w / K <= width:
            return f
        size -= 1
    return font(name, 8)


def smooth_noise(w, h, cells, seed, lo=0.0, hi=1.0):
    rng = np.random.default_rng(seed)
    small = rng.random((cells[1], cells[0])).astype(np.float32)
    img = Image.fromarray((small * 255).astype(np.uint8), "L").resize((w, h), Image.BICUBIC)
    return lo + (hi - lo) * np.asarray(img).astype(np.float32) / 255


def mask():
    m = Image.new("L", (N, N), 0)
    return m, ImageDraw.Draw(m)


def arr(m, blur=0):
    if blur:
        m = m.filter(ImageFilter.GaussianBlur(blur * K))
    return np.asarray(m).astype(np.float32) / 255


def put(img, a, color):
    col = np.asarray(color, np.float32)
    return img * (1 - a[..., None]) + col * a[..., None]


def gold(seed, mirror=True):
    """Ayna gibi parlatılmış altın: yatay açık-koyu bantlar, hafif dalga."""
    ys = np.linspace(0, 1, N, dtype=np.float32)[:, None]
    xs = np.linspace(0, 1, N, dtype=np.float32)[None, :]
    if mirror:
        # Fotoğraftaki plakada alt ve üst kenarlar açık, orta sıcak altın.
        s = 0.55 + 0.35 * np.cos((ys - 0.5) * 5.4) * 0 + 0.3 * np.sin(ys * 7.5 + 0.8) + 0.12 * np.sin(xs * 3 + ys * 2)
    else:
        s = 0.5 + 0.5 * np.sin(xs * 40 + ys * 9) * np.cos(xs * 13 - ys * 5)
    s = np.clip(s * smooth_noise(N, N, (12, 12), seed, 0.9, 1.1), 0, 1)
    lo, mid, hi = np.array([168, 118, 36], np.float32), np.array([226, 180, 80], np.float32), np.array([255, 236, 170], np.float32)
    s3 = s[..., None]
    return np.where(s3 < 0.5, lo + (mid - lo) * s3 * 2, mid + (hi - mid) * (s3 - 0.5) * 2)


BLACK = (14, 12, 11)


# ================================================================ ön etiket
def star_points(c, r):
    """Sekiz köşeli yıldız: eksen hizalı kare + 45° dönük kare."""
    sq = [(c - r, c - r), (c + r, c - r), (c + r, c + r), (c - r, c + r)]
    rr = r * math.sqrt(2)
    di = [(c, c - rr), (c + rr, c), (c, c + rr), (c - rr, c)]
    return sq, di


def small_caps(d, cx, y, s, big, small, fill=255, spacing=2):
    """Büyük harfle başlayan küçük büyük harf (small caps) yazı."""
    parts = [(ch, big if (i == 0 or s[i - 1] == " ") else small) for i, ch in enumerate(s.upper())]
    widths = [d.textlength(ch, font=f) for ch, f in parts]
    total = sum(widths) + spacing * K * (len(parts) - 1)
    x = cx * K - total / 2
    base = y * K + big.getbbox("H")[3]
    for (ch, f), w in zip(parts, widths):
        d.text((x, base), ch, font=f, fill=fill, anchor="ls")
        x += w + spacing * K
    return y + big.getbbox("H")[3] / K


def front(c, seed):
    """Fotoğraftaki etiket: plaka, mine yıldız, altın geçme, siyah pano.

    `plate` "gold" (Queen of Palace gibi altın zemin) ya da bir renk (Narcissus
    gibi siyah zemin); `star` yıldızın mine rengi.
    """
    cx = N / 2
    gold_plate = c["plate"] == "gold"
    if gold_plate:
        img = gold(seed)
    else:
        img = np.broadcast_to(np.array(c["plate"], np.float32), (N, N, 3)).copy()
        img *= smooth_noise(N, N, (6, 6), seed, 0.94, 1.06)[..., None]
    pale = gold(seed + 3) * 0.55 + np.array([250, 232, 180], np.float32) * 0.45

    # Plakanın kenar çerçevesi.
    m, d = mask()
    d.rectangle([0, 0, N - 1, N - 1], outline=255, width=(3 if gold_plate else 14) * K)
    d.rectangle([34 * K, 34 * K, N - 34 * K, N - 34 * K], outline=255, width=3 * K)
    img = put(img, arr(m, 0.4) * (0.8 if gold_plate else 1), (90, 62, 20) if gold_plate else gold(seed + 1))

    # Mine yıldız (iki kare), ince altın kenarlı.
    r = 335 * K
    sq, di = star_points(cx, r)
    m, d = mask()
    d.polygon(sq, fill=255)
    d.polygon(di, fill=255)
    star = arr(m, 0.4)
    enamel = np.array(c["star"], np.float32) * smooth_noise(N, N, (8, 8), seed + 7, 0.9, 1.08)[..., None]
    img = put(img, star, enamel)
    edge = np.clip(star - arr(m.filter(ImageFilter.MinFilter(7)), 0.4), 0, 1)
    img = put(img, edge, gold(seed + 2))

    # Altın geçme şeritleri: yıldızın iç çizgileri ve kollardaki halkalar.
    g, d = mask()
    inset = 24 * K
    sq_in = [(cx - r + inset, cx - r + inset), (cx + r - inset, cx - r + inset), (cx + r - inset, cx + r - inset), (cx - r + inset, cx + r - inset)]
    rr = r * math.sqrt(2) - inset * math.sqrt(2)
    di_in = [(cx, cx - rr), (cx + rr, cx), (cx, cx + rr), (cx - rr, cx)]
    d.line(sq_in + sq_in[:1], fill=255, width=6 * K)
    d.line(di_in + di_in[:1], fill=255, width=6 * K)
    for k in range(8):
        a = k * math.pi / 4
        px, py = cx + math.cos(a) * r * 0.98, cx + math.sin(a) * r * 0.98
        rad = 130 * K
        d.ellipse([px - rad, py - rad, px + rad, py + rad], outline=255, width=22 * K)
        rad2 = 70 * K
        d.ellipse([px - rad2, py - rad2, px + rad2, py + rad2], outline=255, width=7 * K)
    geo = arr(g, 0.4) * star
    b, d = mask()
    for k in range(4):
        a = math.pi / 4 + k * math.pi / 2
        px, py = cx + math.cos(a) * r * 1.2, cx + math.sin(a) * r * 1.2
        s_ = 26 * K
        d.polygon([(px, py - s_), (px + s_, py), (px, py + s_), (px - s_, py)], fill=255)
    img = put(img, np.clip(geo + arr(b, 0.4) * star, 0, 1), pale)

    # Ortadaki siyah pano, çift altın çerçeve.
    half = 238 * K
    m, d = mask()
    d.rectangle([cx - half - 26 * K, cx - half - 26 * K, cx + half + 26 * K, cx + half + 26 * K], fill=255)
    img = put(img, arr(m, 0.4), BLACK)
    m, d = mask()
    d.rectangle([cx - half, cx - half, cx + half, cx + half], outline=255, width=5 * K)
    d.rectangle([cx - half - 26 * K, cx - half - 26 * K, cx + half + 26 * K, cx + half + 26 * K], outline=255, width=3 * K)

    # Yazılar.
    y = 340
    y = text_c(d, S / 2, y, "HOPE", font("Cinzel-Medium.ttf", 118), spacing=8) + 24
    y = text_c(d, S / 2, y, "ISTANBUL", font("OpenSans-Bold.ttf", 30), spacing=10) + 70
    if c.get("smallcaps"):
        y = small_caps(d, S / 2, y, c["name"], font("OpenSans-Bold.ttf", 38), font("OpenSans-Bold.ttf", 29), spacing=3) + 62
    else:
        f = fit(d, c["name"].upper(), "OpenSans-Bold.ttf", 400, 36, spacing=2)
        y = text_c(d, S / 2, y, c["name"].upper(), f, spacing=2) + 62
    text_c(d, S / 2, y, "EXTRAIT DE PARFUM", font("OpenSans-SemiBold.ttf", 27), spacing=2)
    img = put(img, arr(m, 0.35), gold(seed + 5))
    return img


# ================================================================ arka etiket
def dome(d, x, base, r):
    d.pieslice([x - r, base - r, x + r, base + r], 180, 360, fill=255)
    d.polygon([(x - r * 0.08, base - r), (x, base - r - r * 0.45), (x + r * 0.08, base - r)], fill=255)


def minaret(d, x, base, h, w):
    d.rectangle([x - w, base - h, x + w, base], fill=255)
    d.rectangle([x - w * 1.6, base - h * 0.72, x + w * 1.6, base - h * 0.69], fill=255)
    d.polygon([(x - w, base - h), (x, base - h - w * 7), (x + w, base - h)], fill=255)


def mosque(d, x, base, s):
    dome(d, x, base - 70 * s, 110 * s)
    for k in (-1, 1):
        dome(d, x + k * 150 * s, base - 30 * s, 60 * s)
    d.rectangle([x - 220 * s, base - 70 * s, x + 220 * s, base], fill=255)
    for k in (-1, 1):
        minaret(d, x + k * 250 * s, base, 330 * s, 11 * s)


def sky(v):
    return int((0.44 + 0.36 * v) * N)


def scene_han(d):
    base = sky(0.98)
    for x in range(0, N, 220):
        d.rectangle([x, base - 360, x + 220, base], fill=255)
        dome(d, x + 110, base - 360, 90)
    for x in range(110, N, 440):
        minaret(d, x, base - 330, 360, 12)


def scene_palace(d):
    base = sky(0.92)
    x = 420
    d.rectangle([x - 45, base - 500, x + 45, base], fill=255)
    d.rectangle([x - 60, base - 540, x + 60, base - 500], fill=255)
    d.polygon([(x - 60, base - 540), (x, base - 800), (x + 60, base - 540)], fill=255)
    d.rectangle([x - 420, base - 150, x + 300, base], fill=255)
    for k in range(6):
        dome(d, x - 360 + k * 110, base - 150, 40)
    bx = 1420
    top = base - 460
    for k in (-1, 1):
        d.rectangle([bx + k * 330 - 14, top, bx + k * 330 + 14, base], fill=255)
    d.rectangle([bx - 560, base - 90, bx + 560, base - 70], fill=255)
    pts = [(bx - 560, base - 90), (bx - 330, top)]
    pts += [(bx + t, top + 330 * (1 - (t / 330) ** 2) * 0.9) for t in range(-330, 331, 15)]
    pts += [(bx + 330, top), (bx + 560, base - 90)]
    d.line(pts, fill=255, width=7)


def scene_peninsula(d):
    base = sky(0.95)
    mosque(d, 560, base, 1.2)
    mosque(d, 1480, base, 0.95)
    d.rectangle([0, base - 50, N, base], fill=255)


def scene_walls(d):
    base = sky(0.98)
    for x in range(-100, N + 100, 520):
        h = 460 + (x * 7 % 160)
        d.rectangle([x - 100, base - h, x + 100, base], fill=255)
        d.polygon([(x - 110, base - h), (x, base - h - 240), (x + 110, base - h)], fill=255)
        wall = base - 280
        d.rectangle([x + 100, wall, x + 420, base], fill=255)
        for mx in range(x + 100, x + 420, 44):
            d.rectangle([mx, wall - 32, mx + 24, wall], fill=255)


def scene_tower(d):
    base = sky(0.72)
    x = N / 2
    d.rectangle([x - 240, base - 90, x + 240, base], fill=255)
    d.rectangle([x - 70, base - 420, x + 70, base - 90], fill=255)
    d.rectangle([x - 100, base - 440, x + 100, base - 420], fill=255)
    d.polygon([(x - 90, base - 440), (x, base - 620), (x + 90, base - 440)], fill=255)
    d.rectangle([x + 70, base - 250, x + 200, base - 90], fill=255)
    dome(d, x + 135, base - 250, 62)
    rng = np.random.default_rng(4)
    for _ in range(60):
        px, py = rng.integers(0, N), rng.integers(base + 20, sky(1.0))
        d.arc([px - 70, py - 12, px + 70, py + 12], 200, 340, fill=255, width=5)


def scene_galata(d):
    base = sky(0.96)
    x = 1100
    d.rectangle([x - 100, base - 440, x + 100, base], fill=255)
    d.rectangle([x - 120, base - 475, x + 120, base - 440], fill=255)
    d.polygon([(x - 110, base - 475), (x, base - 650), (x + 110, base - 475)], fill=255)
    for k in range(-9, 10):
        if abs(k) < 2:
            continue
        h = 180 + (k * 53 % 120)
        d.rectangle([x + k * 110 - 50, base - h, x + k * 110 + 50, base], fill=255)
        d.polygon([(x + k * 110 - 56, base - h), (x + k * 110, base - h - 50), (x + k * 110 + 56, base - h)], fill=255)


def scene_hills(d):
    """7 Tepe: tepelerin üzerinde camiler."""
    base = sky(1.0)
    pts = [(0, base)]
    for i in range(0, N + 1, 32):
        pts.append((i, base - 160 - 110 * math.sin(i / N * math.pi * 7) ** 2))
    pts.append((N, base))
    d.polygon(pts, fill=255)
    for i in range(7):
        x = (i + 0.5) / 7 * N
        mosque(d, x, base - 250, 0.38)


def scene_sea(d):
    """Denizaltı: dalgaların altında kabarcıklar."""
    base = sky(0.3)
    for k in range(10):
        y = base + k * 40
        pts = [(x, y + 18 * math.sin(x / 90 + k)) for x in range(0, N + 1, 24)]
        d.line(pts, fill=255, width=4)
    rng = np.random.default_rng(9)
    for _ in range(80):
        px, py, r = rng.integers(0, N), rng.integers(base + 40, sky(1.0)), rng.integers(6, 26)
        d.ellipse([px - r, py - r, px + r, py + r], outline=255, width=4)


def back(c, seed):
    """Arka etiket: siyah pano, altın silüet, koku piramidi ve hikâye."""
    img = np.broadcast_to(np.array(BLACK, np.float32), (N, N, 3)).copy()
    g = gold(seed, mirror=False)
    m, d = mask()
    d.rectangle([14 * K, 14 * K, N - 14 * K, N - 14 * K], outline=255, width=4 * K)
    d.rectangle([34 * K, 34 * K, N - 34 * K, N - 34 * K], outline=255, width=2 * K)
    img = put(img, arr(m, 0.4), g)
    # Silüet: yarı saydam altın.
    s, d = mask()
    c["scene"](d)
    img = put(img, arr(s, 1.0) * 0.55, np.array(c["star"], np.float32) * 1.1 + 20)
    edge = np.clip(arr(s, 0.8) - arr(s.filter(ImageFilter.MinFilter(7)), 0.8), 0, 1)
    img = put(img, edge * 0.7, g)
    # Yazılar.
    m, d = mask()
    y = 90
    y = text_c(d, S / 2, y, c["name"].upper(), fit(d, c["name"].upper(), "Cinzel-Bold.ttf", 700, 56, spacing=6), spacing=6) + 16
    y = text_c(d, S / 2, y, c["place"], font("OpenSans-SemiBold.ttf", 22), spacing=8) + 44
    for head, body in c["notes"]:
        y = text_c(d, S / 2, y, head, font("OpenSans-Bold.ttf", 18), spacing=7) + 12
        y = text_c(d, S / 2, y, body, font("Gloock-Regular.ttf", 32)) + 30
    text_c(d, S / 2, 930, "HOPE ISTANBUL  ·  EXTRAIT DE PARFUM  ·  100 ml e 3.4 FL.OZ", font("OpenSans-SemiBold.ttf", 17), spacing=3)
    shade = arr(m, 3)
    img = img * (1 - np.clip(shade * 1.2, 0, 0.7))[..., None]
    img = put(img, arr(m, 0.35), g)
    return img


# ================================================================ kokular
PERFUMES = [
    {"file": "han.jpg", "plate": (16, 14, 13), "star": (18, 92, 64), "name": "Han", "place": "KAPALIÇARŞI", "scene": scene_han,
     "notes": [("TOP", "Limon · Tarçın"), ("HEART", "Paçuli · Sedir"), ("BASE", "Kuru odun · Amber · Misk")]},
    {"file": "queen-of-palace.jpg", "plate": "gold", "star": (14, 12, 11), "name": "Queen of Palace", "place": "TWO CONTINENTS ONE LOVE", "scene": scene_palace,
     "notes": [("TOP", "Bergamot · Mango · Frenk üzümü"), ("HEART", "Gül · Yasemin · İris"), ("BASE", "Vanilya · Amber · Sandal")]},
    {"file": "narcissus.jpg", "plate": (16, 14, 13), "star": (122, 20, 40), "name": "Narcissus", "smallcaps": True, "place": "HISTORICAL PENINSULA", "scene": scene_peninsula,
     "notes": [("TOP", "Çarkıfelek · Mandalina"), ("HEART", "Sümbülteber · Beyaz çiçekler"), ("BASE", "Vanilya · Amber · Beyaz misk")]},
    {"file": "grand-conqueror.jpg", "plate": "gold", "star": (28, 44, 104), "name": "Grand Conqueror", "place": "RUMELİ HİSARI", "scene": scene_walls,
     "notes": [("TOP", "Bergamot · Mandalina · Limon"), ("HEART", "İris · Yasemin"), ("BASE", "Günlük · Vetiver · Amber")]},
    {"file": "deep-secret.jpg", "plate": (16, 14, 13), "star": (12, 92, 104), "name": "Deep Secret", "place": "KIZ KULESİ", "scene": scene_tower,
     "notes": [("TOP", "Hibiskus · Şakayık · Şeftali"), ("HEART", "Yasemin · Menekşe · Manolya"), ("BASE", "Misk · Amber · Kaşmiran")]},
    {"file": "neco.jpg", "plate": (16, 14, 13), "star": (160, 62, 30), "name": "N.E.C.O", "place": "GALATA · TOPHANE", "scene": scene_galata,
     "notes": [("TOP", "Bergamot · Greyfurt · Ardıç"), ("HEART", "Zencefil · Ahududu · Tarçın"), ("BASE", "Paçuli · Bal · Amber · Sandal")]},
    {"file": "forza.jpg", "plate": (16, 14, 13), "star": (78, 44, 126), "name": "Forza", "place": "7 TEPE", "scene": scene_hills,
     "notes": [("TOP", "Narenciye · Menekşe"), ("HEART", "Lavanta · Baharat"), ("BASE", "Sandal · Sedir · Beyaz misk")]},
    {"file": "submarine.jpg", "plate": (16, 14, 13), "star": (28, 84, 168), "name": "Submarine", "place": "BOĞAZ'IN DERİNLİKLERİ", "scene": scene_sea,
     "notes": [("TOP", "Limon · Armut · Portakal çiçeği"), ("HEART", "Pembe biber · Zencefil · Gül"), ("BASE", "Paçuli · Vetiver · Amber")]},
]


def render(c, idx):
    f = front(c, idx * 7 + 1)
    b = back(c, idx * 7 + 2)
    atlas = np.concatenate([f, b], axis=1)
    out = Image.fromarray(np.clip(atlas, 0, 255).astype(np.uint8), "RGB").resize((S * 2, S), Image.LANCZOS)
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
