"""Hope Istanbul konsept şişe etiketleri (100 ml Extrait de Parfum).

Markanın ürün fotoğrafına göre çizilmiştir (docs/reference): parlak altın
plaka, siyah sekiz köşeli yıldız, altın geçmeli çizgiler ve ortada siyah
kare içinde HOPE / ISTANBUL / koku adı / EXTRAIT DE PARFUM.

Doku bir atlas: sol yarı (u 0–0.5) ön etiket, sağ yarı (u 0.5–1) arka etiket
(koku piramidi, ilham aldığı yer ve İstanbul silueti). Arka etiketin silüet
bandı (üstten %44–%80) arka planda bulanık şehir olarak da kullanılır.

Ayarlar src/content.json\'dan okunur (CONTENT ortam değişkeniyle değiştirilebilir).
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
    y = text_c(d, S / 2, y, BRAND["wordmark"], fit(d, BRAND["wordmark"], "Cinzel-Medium.ttf", 420, 118, spacing=8), spacing=8) + 24
    y = text_c(d, S / 2, y, BRAND.get("submark", ""), font("OpenSans-Bold.ttf", 30), spacing=10) + 70
    if c.get("smallcaps"):
        y = small_caps(d, S / 2, y, c["name"], font("OpenSans-Bold.ttf", 38), font("OpenSans-Bold.ttf", 29), spacing=3) + 62
    else:
        f = fit(d, c["name"].upper(), "OpenSans-Bold.ttf", 400, 36, spacing=2)
        y = text_c(d, S / 2, y, c["name"].upper(), f, spacing=2) + 62
    text_c(d, S / 2, y, BRAND["concentration"], font("OpenSans-SemiBold.ttf", 27), spacing=2)
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
    text_c(d, S / 2, 930, f'{BRAND["wordmark"]} {BRAND.get("submark", "")}  ·  {BRAND["concentration"]}  ·  {BRAND["volume"]}', font("OpenSans-SemiBold.ttf", 17), spacing=3)
    shade = arr(m, 3)
    img = img * (1 - np.clip(shade * 1.2, 0, 0.7))[..., None]
    img = put(img, arr(m, 0.35), g)
    return img


# ================================================================ kokular
# Bütün ayarlar src/content.json'dan okunur: `labelBrand` (logo yazıları) ve
# her ürünün `label` alanı (stil, renkler, arka etiket sahnesi, koku piramidi).
import json

SCENES = {
    "han": scene_han, "palace": scene_palace, "peninsula": scene_peninsula, "walls": scene_walls,
    "tower": scene_tower, "galata": scene_galata, "hills": scene_hills, "sea": scene_sea,
    "none": lambda d: None,
}
CONTENT = os.path.join(HERE, "..", "src", "content.json")
BRAND = {}


def aspect_of(bottle, p):
    if p.get("form") == "tube":
        t = {**bottle["tube"], **p.get("tube", {})}
        return t["height"] / (math.pi * t["radius"])
    lab = {**bottle["label"], **p.get("bottle", {}).get("label", {})}
    return lab.get("height", lab.get("size", 1)) / lab.get("width", lab.get("size", 1))


def load(path=CONTENT):
    data = json.load(open(path, encoding="utf-8"))
    BRAND.update(data["labelBrand"])
    out = []
    for p in data["products"]:
        L = p["label"]
        out.append({
            "file": p["file"],
            "name": p["name"],
            "style": L.get("style", "star"),
            "plate": L["plate"] if L["plate"] == "gold" else tuple(L["plate"]),
            "star": tuple(L.get("star", (14, 12, 11))),
            "ink": tuple(L.get("ink", (226, 190, 110))),
            "smallcaps": L.get("smallcaps", False),
            "place": L.get("place", ""),
            "scene": SCENES[L.get("scene", "none")],
            "notes": [tuple(x) for x in L.get("pyramid", [])],
            "motif": L.get("motif", "halo"),
            "palette": [tuple(x) for x in L.get("palette", [(20, 20, 30), (200, 180, 255), (255, 255, 255)])],
            "concentration": L.get("concentration"),
            "collection": L.get("collection", ""),
            "sub": L.get("sub", ""),
            "claims": L.get("claims", []),
            "ingredients": L.get("ingredients", ""),
            "usage": L.get("usage", ""),
            # Tüpte doku yarım çevreye sarılır; şişede etiket en/boy oranı kadardır.
            "aspect": aspect_of(data["bottle"], p),
            "lv": L.get("lalive", {}),
            "volume": L.get("volume"),
        })
    return out


def classic(c, seed):
    """Sade etiket: düz plaka, ince çerçeve, marka ve koku adı (yeni markalar için başlangıç)."""
    cx = N / 2
    if c["plate"] == "gold":
        img = gold(seed)
    else:
        img = np.broadcast_to(np.array(c["plate"], np.float32), (N, N, 3)).copy()
        img *= smooth_noise(N, N, (6, 6), seed, 0.95, 1.05)[..., None]
    ink = np.array(c["ink"], np.float32)
    m, d = mask()
    d.rectangle([22 * K, 22 * K, N - 22 * K, N - 22 * K], outline=255, width=3 * K)
    d.rectangle([40 * K, 40 * K, N - 40 * K, N - 40 * K], outline=255, width=1 * K)
    y = 300
    y = text_c(d, S / 2, y, BRAND["wordmark"], fit(d, BRAND["wordmark"], "Cinzel-Medium.ttf", 760, 130, spacing=8), spacing=8) + 22
    if BRAND.get("submark"):
        y = text_c(d, S / 2, y, BRAND["submark"], font("OpenSans-Bold.ttf", 28), spacing=12) + 90
    d.line([((S / 2 - 90) * K, (y - 40) * K), ((S / 2 + 90) * K, (y - 40) * K)], fill=255, width=2 * K)
    y = text_c(d, S / 2, y, c["name"].upper(), fit(d, c["name"].upper(), "OpenSans-Bold.ttf", 640, 46, spacing=4), spacing=4) + 60
    text_c(d, S / 2, y, BRAND["concentration"], font("OpenSans-SemiBold.ttf", 26), spacing=4)
    text_c(d, S / 2, 900, BRAND["volume"], font("OpenSans-SemiBold.ttf", 20), spacing=3)
    return put(img, arr(m, 0.35), ink if c["plate"] != "gold" else np.array(BLACK, np.float32))


# ================================================================ sanat eseri stili
def _grad(c1, c2, ang, seed):
    ys, xs = np.mgrid[0:N, 0:N].astype(np.float32) / N
    t = np.clip(xs * math.cos(ang) + ys * math.sin(ang), 0, 1)
    t = t * smooth_noise(N, N, (5, 5), seed, 0.85, 1.15)
    t = np.clip(t, 0, 1)[..., None]
    return np.array(c1, np.float32) * (1 - t) + np.array(c2, np.float32) * t


def motif(kind, d, seed):
    """Her kokunun dijital sanat motifi (beyaz maske üzerine çizilir)."""
    rng = np.random.default_rng(seed)
    cx = N / 2
    if kind == "halo":  # Heroine: ışık halesi ve yükselen figür
        for r, w in ((380, 10), (300, 4), (220, 2)):
            d.ellipse([cx - r * K, 330 * K - r * K, cx + r * K, 330 * K + r * K], outline=255, width=w * K)
        d.polygon([(cx - 60 * K, 900 * K), (cx, 380 * K), (cx + 60 * K, 900 * K)], fill=255)
        d.ellipse([cx - 44 * K, 300 * K, cx + 44 * K, 388 * K], fill=255)
    elif kind == "waves":  # Collithereum: dalgalar ve servi sütunları
        for k in range(14):
            y = 520 + k * 34
            pts = [(x * K, (y + 22 * math.sin(x / 70 + k * 0.7)) * K) for x in range(0, S + 1, 16)]
            d.line(pts, fill=255, width=(3 + k % 3) * K)
        for x in (250, 512, 774):
            d.polygon([(x * K, 120 * K), ((x - 36) * K, 500 * K), ((x + 36) * K, 500 * K)], fill=255)
    elif kind == "strokes":  # Mood Canvas: fırça darbeleri
        for _ in range(26):
            x, y = rng.integers(60, S - 60), rng.integers(80, 900)
            L, a = rng.integers(160, 420), rng.uniform(-0.6, 0.6)
            w = rng.integers(18, 60)
            d.line([(x * K, y * K), ((x + L * math.cos(a)) * K, (y + L * math.sin(a)) * K)], fill=255, width=int(w * K))
    elif kind == "grid":  # Artificial Intelligence: devre ve ağ
        for i in range(0, S, 64):
            d.line([(i * K, 0), (i * K, N)], fill=90, width=K)
            d.line([(0, i * K), (N, i * K)], fill=90, width=K)
        nodes = [(rng.integers(1, 16) * 64, rng.integers(1, 15) * 64) for _ in range(40)]
        for (x1, y1), (x2, y2) in zip(nodes, nodes[1:]):
            d.line([(x1 * K, y1 * K), (x2 * K, y1 * K), (x2 * K, y2 * K)], fill=255, width=4 * K)
        for x, y in nodes:
            d.ellipse([(x - 10) * K, (y - 10) * K, (x + 10) * K, (y + 10) * K], fill=255)
    elif kind == "neon":  # Neon Nights: neon tüpler ve şehir ışıkları
        for k in range(7):
            y = 160 + k * 100
            d.rounded_rectangle([(120 + k * 20) * K, y * K, (900 - k * 30) * K, (y + 34) * K], radius=17 * K, outline=255, width=6 * K)
        for _ in range(60):
            x, y, r = rng.integers(0, S), rng.integers(0, S), rng.integers(4, 14)
            d.ellipse([(x - r) * K, (y - r) * K, (x + r) * K, (y + r) * K], fill=255)
    elif kind == "ink":  # Clean Slate: mürekkep lekesi
        for _ in range(9):
            x, y, r = rng.integers(280, 740), rng.integers(220, 700), rng.integers(60, 200)
            d.ellipse([(x - r) * K, (y - r) * K, (x + r) * K, (y + r) * K], fill=255)
        for _ in range(40):
            a, L = rng.uniform(0, math.tau), rng.integers(220, 460)
            x, y = cx / K + math.cos(a) * L, 460 + math.sin(a) * L
            r = rng.integers(5, 22)
            d.ellipse([(x - r) * K, (y - r) * K, (x + r) * K, (y + r) * K], fill=255)
    elif kind == "smoke":  # Immortal Shade / Satyr: kıvrılan duman
        for k in range(18):
            x0 = 200 + k * 36
            pts = [((x0 + 120 * math.sin(y / 110 + k * 0.5)) * K, y * K) for y in range(900, 60, -12)]
            d.line(pts, fill=255, width=(2 + k % 4) * K)
    elif kind == "spiral":  # Semazen: dönen etek ve spiral
        for k in range(160):
            a = k * 0.19
            r = 20 + k * 2.6
            x, y = cx / K + math.cos(a) * r, 470 + math.sin(a) * r * 0.55
            d.ellipse([(x - 7) * K, (y - 7) * K, (x + 7) * K, (y + 7) * K], fill=255)
        d.polygon([(cx - 240 * K, 820 * K), (cx, 300 * K), (cx + 240 * K, 820 * K)], outline=255, width=5 * K)
        d.rectangle([cx - 26 * K, 170 * K, cx + 26 * K, 300 * K], fill=255)
    elif kind == "letters":  # Tell Something: dağılan harfler
        f = font("Gloock-Regular.ttf", 64)
        for _ in range(70):
            ch = chr(rng.integers(65, 91))
            x, y = rng.integers(20, S - 60), rng.integers(40, 900)
            d.text((x * K, y * K), ch, font=f, fill=int(rng.integers(120, 256)))


def art_plate(c, seed, invert=False):
    """Dualite: ön yüz madde (açık), arka yüz ruh (ters renkler)."""
    bg1, bg2, ink = c["palette"]
    if invert:
        bg1, bg2, ink = ink, bg1, bg2
    img = _grad(bg1, bg2, 0.9 + seed * 0.3, seed)
    m, d = mask()
    motif(c["motif"], d, seed)
    a = arr(m, 0.8)
    glow = arr(m, 12)
    img = put(img, np.clip(glow * 0.6, 0, 1), np.array(ink, np.float32) * 0.7 + np.array(bg2, np.float32) * 0.3)
    img = put(img, a * 0.92, ink)
    # Dualite çizgisi: ortadan geçen ince ayrım, sağ yarı hafif koyu.
    xs = np.linspace(0, 1, N, dtype=np.float32)[None, :]
    img *= (1 - 0.18 * (xs > 0.5))[..., None]
    img *= smooth_noise(N, N, (60, 60), seed + 4, 0.96, 1.04)[..., None]
    return img


def art_front(c, seed):
    img = art_plate(c, seed)
    m, d = mask()
    d.rectangle([0, 790 * K, N, N], fill=255)
    img = put(img, arr(m, 0.5) * 0.9, BLACK)
    t, d = mask()
    d.rectangle([24 * K, 24 * K, N - 24 * K, N - 24 * K], outline=255, width=2 * K)
    text_c(d, S / 2, 812, BRAND["wordmark"], font("Cinzel-Medium.ttf", 30), spacing=14)
    name = c["name"].upper()
    text_c(d, S / 2, 858, name, fit(d, name, "Cinzel-Bold.ttf", 820, 52, spacing=5), spacing=5)
    sub = f'{c.get("collection") or BRAND.get("submark", "")}  ·  {c.get("concentration") or BRAND["concentration"]}'
    text_c(d, S / 2, 936, sub, font("OpenSans-SemiBold.ttf", 17), spacing=5)
    return put(img, arr(t, 0.35), (240, 236, 228))


def art_back(c, seed):
    img = art_plate(c, seed + 11, invert=True)
    m, d = mask()
    d.rounded_rectangle([160 * K, 160 * K, N - 160 * K, N - 160 * K], radius=20 * K, fill=255)
    img = put(img, arr(m, 2) * 0.82, BLACK)
    t, d = mask()
    y = 210
    y = text_c(d, S / 2, y, c["name"].upper(), fit(d, c["name"].upper(), "Cinzel-Bold.ttf", 600, 46, spacing=5), spacing=5) + 14
    y = text_c(d, S / 2, y, c["place"], font("OpenSans-SemiBold.ttf", 18), spacing=8) + 44
    for head, body in c["notes"]:
        y = text_c(d, S / 2, y, head, font("OpenSans-Bold.ttf", 16), spacing=7) + 10
        y = text_c(d, S / 2, y, body, fit(d, body, "Gloock-Regular.ttf", 620, 28)) + 26
    text_c(d, S / 2, 800, f'{BRAND["wordmark"]}  ·  {c.get("concentration") or BRAND["concentration"]}  ·  {BRAND["volume"]}', font("OpenSans-SemiBold.ttf", 15), spacing=3)
    return put(img, arr(t, 0.35), (240, 236, 228))


# ================================================================ krem tüpü stili
def olive_branch(d, x, y, s, ang, fill):
    """Zeytin dalı: ince sap ve karşılıklı yapraklar."""
    L = 520 * s
    ex, ey = x + math.cos(ang) * L, y + math.sin(ang) * L
    d.line([(x, y), (ex, ey)], fill=fill, width=int(6 * s))
    for k in range(1, 9):
        t = k / 9
        px, py = x + (ex - x) * t, y + (ey - y) * t
        for side in (-1, 1):
            a = ang + side * 0.9
            lx, ly = px + math.cos(a) * 110 * s, py + math.sin(a) * 110 * s
            w = 26 * s
            nx, ny = -math.sin(a) * w, math.cos(a) * w
            d.polygon([(px, py), ((px + lx) / 2 + nx, (py + ly) / 2 + ny), (lx, ly), ((px + lx) / 2 - nx, (py + ly) / 2 - ny)], fill=fill)
    for k in (3, 6):
        t = k / 9
        px, py = x + (ex - x) * t, y + (ey - y) * t + 40 * s
        d.ellipse([px - 22 * s, py - 30 * s, px + 22 * s, py + 30 * s], fill=fill)


def tube_panel(c, seed, back=False):
    """Tüpün yarısı (ön ya da arka). Uzun tuvale çizilir, sonra kareye sıkıştırılır;
    tüpe sarıldığında oranlar düzelir."""
    W_, H_ = N, int(N * c["aspect"])
    plate = np.array(c["plate"] if c["plate"] != "gold" else (236, 226, 204), np.float32)
    ink = tuple(int(v) for v in c["ink"])
    accent = tuple(int(v) for v in c["star"])
    img = Image.new("RGB", (W_, H_), tuple(int(v) for v in plate))
    tex = (smooth_noise(W_, H_, (8, 14), seed, 0.97, 1.03)[..., None] * np.asarray(img).astype(np.float32))
    img = Image.fromarray(np.clip(tex, 0, 255).astype(np.uint8))
    d = ImageDraw.Draw(img)
    cx = W_ / 2
    y = lambda f: int(H_ * f)
    def tc(text, fy, f, fill, spacing=0):
        widths = [d.textlength(ch, font=f) for ch in text]
        total = sum(widths) + spacing * K * (len(text) - 1)
        x = cx - total / 2
        for ch, w in zip(text, widths):
            d.text((x, fy), ch, font=f, fill=fill, anchor="ls")
            x += w + spacing * K
    if not back:
        # Üst kısım (tüpün yassı ucu): renkli bant ve zeytin dalı.
        d.rectangle([0, 0, W_, y(0.34)], fill=accent)
        olive_branch(d, cx - 260 * K, y(0.30), 0.9 * K, -0.55, tuple(int(v * 0.8 + 50) for v in plate))
        d.line([(0, y(0.345)), (W_, y(0.345))], fill=ink, width=3 * K)
        tc(BRAND["wordmark"], y(0.47), font("Gloock-Regular.ttf", 150), ink, spacing=2)
        tc(BRAND.get("submark", ""), y(0.505), font("OpenSans-SemiBold.ttf", 26), ink, spacing=12)
        name = c["name"]
        f = fit(d, name, "Gloock-Regular.ttf", 820, 96)
        tc(name, y(0.62), f, accent)
        if c["sub"]:
            tc(c["sub"].upper(), y(0.66), font("OpenSans-SemiBold.ttf", 26), ink, spacing=6)
        for i, claim in enumerate(c["claims"][:3]):
            tc(claim.upper(), y(0.74 + i * 0.035), font("OpenSans-Bold.ttf", 22), ink, spacing=5)
        tc(BRAND["volume"] if not c.get("volume") else c["volume"], y(0.93), font("OpenSans-SemiBold.ttf", 24), ink, spacing=4)
    else:
        d.rectangle([0, 0, W_, y(0.34)], fill=accent)
        tc(BRAND["wordmark"], y(0.44), font("Gloock-Regular.ttf", 80), ink, spacing=2)
        yy = y(0.5)
        for head, body in (("İÇİNDEKİLER", c["ingredients"]), ("KULLANIM", c["usage"])):
            tc(head, yy, font("OpenSans-Bold.ttf", 30), accent, spacing=8)
            yy += 58 * K
            words, line = body.split(), ""
            fnt = font("OpenSans-SemiBold.ttf", 32)
            for w in words:
                trial = (line + " " + w).strip()
                if d.textlength(trial, font=fnt) > W_ * 0.8:
                    tc(line, yy, fnt, ink); yy += 48 * K; line = w
                else:
                    line = trial
            if line:
                tc(line, yy, fnt, ink); yy += 48 * K
            yy += 44 * K
        tc(c["place"], y(0.93), font("OpenSans-SemiBold.ttf", 20), ink, spacing=6)
    return np.asarray(img.resize((N, N), Image.LANCZOS)).astype(np.float32)


# ================================================================ lalive stili
def ring_text(img, cx, cy, r, text, f, fill):
    """Rozet: çember üzerine dizilmiş yazı."""
    d = ImageDraw.Draw(img)
    total = sum(d.textlength(ch, font=f) for ch in text)
    ang = -math.pi / 2 - (total / r) / 2
    for ch in text:
        w = d.textlength(ch, font=f)
        a = ang + (w / 2) / r
        tile = Image.new("L", (int(f.size * 2), int(f.size * 2)), 0)
        ImageDraw.Draw(tile).text((f.size, f.size), ch, font=f, fill=255, anchor="mm")
        tile = tile.rotate(-math.degrees(a + math.pi / 2), resample=Image.BICUBIC)
        x, y = cx + math.cos(a) * r, cy + math.sin(a) * r
        img.paste(Image.new("RGB", tile.size, fill), (int(x - tile.width / 2), int(y - tile.height / 2)), tile)
        ang += w / r


def sprig(d, x, y, s, fill, ang=-1.2):
    """Logodaki i harfinin üstündeki küçük zeytin dalı."""
    ex, ey = x + math.cos(ang) * 70 * s, y + math.sin(ang) * 70 * s
    d.line([(x, y), (ex, ey)], fill=fill, width=max(2, int(4 * s)))
    for t, side in ((0.35, 1), (0.6, -1), (0.85, 1)):
        px, py = x + (ex - x) * t, y + (ey - y) * t
        a = ang + side * 0.9
        lx, ly = px + math.cos(a) * 30 * s, py + math.sin(a) * 30 * s
        nx, ny = -math.sin(a) * 8 * s, math.cos(a) * 8 * s
        d.polygon([(px, py), ((px + lx) / 2 + nx, (py + ly) / 2 + ny), (lx, ly), ((px + lx) / 2 - nx, (py + ly) / 2 - ny)], fill=fill)


def logo(img, cx, base, size, fill):
    """Marka logosu: labelBrand.logoFile varsa o görsel (renklendirilir), yoksa
    Marcellus ile yazı ve i'nin noktası yerine zeytin dalı."""
    if BRAND.get("logoFile"):
        path = os.path.join(HERE, "..", BRAND["logoFile"])
        m = Image.open(path).getchannel("A")
        h = int(size * K * 0.95)
        m = m.resize((int(m.width * h / m.height), h), Image.LANCZOS)
        x, y = int(cx - m.width / 2), int(base - h * 0.93)
        img.paste(Image.new("RGB", m.size, tuple(fill)), (x, y), m)
        return
    d = ImageDraw.Draw(img)
    f = font("Marcellus-Regular.ttf", size)
    word = "lalıve"
    total = d.textlength(word, font=f)
    x0 = cx - total / 2
    d.text((x0, base), word, font=f, fill=fill, anchor="ls")
    xi = x0 + d.textlength("lal", font=f) + d.textlength("ı", font=f) / 2
    sprig(d, xi - 2 * K * size / 100, base + f.getbbox("ı", anchor="ls")[1] - 4 * K * size / 100, size / 100 * K * 0.42, fill, ang=-1.05)


def ctext(d, cx, y, text, f, fill, spacing=0):
    widths = [d.textlength(ch, font=f) for ch in text]
    x = cx - (sum(widths) + spacing * K * (len(text) - 1)) / 2
    for ch, w in zip(text, widths):
        d.text((x, y), ch, font=f, fill=fill, anchor="ls")
        x += w + spacing * K


def wrap(d, text, f, width):
    out, line = [], ""
    for w in text.split():
        t = (line + " " + w).strip()
        if d.textlength(t, font=f) > width and line:
            out.append(line)
            line = w
        else:
            line = t
    return out + ([line] if line else [])


def lalive_panel(c, seed, back=False):
    """Lalive ambalajı (ürün fotoğraflarına göre): düz renk zemin, rozet,
    logo, İngilizce büyük harf ad, Türkçe küçük harf ad, içerik satırları."""
    L = c["lv"]
    W_, H_ = N, int(N * c["aspect"])
    bg = tuple(L.get("bg", (236, 226, 196)))
    ink = tuple(L.get("ink", (30, 56, 40)))
    layout = L.get("layout", "tube")
    img = Image.new("RGB", (W_, H_), bg)
    if L.get("bgBottom"):
        # Buzlu camın dibi: alt kısım daha açık ve sütlü.
        a = np.asarray(img).astype(np.float32)
        t = np.clip((np.arange(H_) / H_ - L.get("bgFrom", 0.86)) / (1 - L.get("bgFrom", 0.86)), 0, 1)[:, None, None]
        a = a * (1 - t) + np.array(L["bgBottom"], np.float32) * t
        img = Image.fromarray(a.astype(np.uint8))
    noise = smooth_noise(W_, H_, (6, 10), seed, 0.985, 1.015)[..., None]
    img = Image.fromarray(np.clip(np.asarray(img).astype(np.float32) * noise, 0, 255).astype(np.uint8))
    d = ImageDraw.Draw(img)
    cx = W_ / 2
    Y = lambda f: H_ * f
    serif, sans = "Marcellus-Regular.ttf", "Lato-Regular.ttf"

    if back:
        y = Y(L.get("backTop", 0.4))
        f_body = font(sans, L.get("backSize", 30))
        for block in L.get("back", []):
            head = block.get("head")
            if head:
                ctext(d, cx, y, head, font("Lato-Bold.ttf", L.get("backSize", 30)), ink, spacing=2)
                y += 44 * K
            for line in wrap(d, block["text"], f_body, W_ * L.get("backWidth", 0.82)):
                ctext(d, cx, y, line, f_body, ink)
                y += L.get("backSize", 30) * 1.32 * K
            y += 26 * K
        if L.get("volume"):
            ctext(d, cx, Y(L.get("backVolumeY", 0.95)), L["volume"], font(sans, L.get("backVolumeSize", 30)), ink)
        return np.asarray(img.resize((N, N), Image.LANCZOS)).astype(np.float32)

    badge_y = Y(L.get("badgeY", 0.3))
    if L.get("badge") is False:
        return front_body(img, L, cx, Y, bg, ink, H_, W_, serif, sans)
    ring_text(img, cx + L.get("badgeX", 0) * W_, badge_y, 78 * K, L.get("badge", "Doğal İçerikler · Doğal İçerikler · "), font(serif, 24), ink)
    d = ImageDraw.Draw(img)
    bx = cx + L.get("badgeX", 0) * W_
    if L.get("badgeIcon") == "drop":
        d.ellipse([bx - 16 * K, badge_y - 4 * K, bx + 16 * K, badge_y + 28 * K], outline=ink, width=2 * K)
        d.line([(bx - 15 * K, badge_y + 6 * K), (bx, badge_y - 26 * K), (bx + 15 * K, badge_y + 6 * K)], fill=ink, width=2 * K)
    else:
        sprig(d, bx - 10 * K, badge_y + 26 * K, 0.7 * K, ink, ang=-1.3)

    return front_body(img, L, cx, Y, bg, ink, H_, W_, serif, sans)


def front_body(img, L, cx, Y, bg, ink, H_, W_, serif, sans):
    layout = L.get("layout", "tube")
    d = ImageDraw.Draw(img)
    if layout == "vertical":
        # Dudak balmı: logo ve yazılar tüp boyunca, aşağıdan yukarı okunur.
        side = Image.new("RGB", (H_, W_), bg)
        sd = ImageDraw.Draw(side)
        logo(side, H_ * 0.34, W_ * 0.62, L.get("logoSize", 300), ink)
        sd = ImageDraw.Draw(side)
        x = H_ * 0.5
        sd.text((x, W_ * 0.7), L["en"], font=font(serif, 42), fill=ink, anchor="ls")
        sd.text((x, W_ * 0.78), L["tr"], font=font(serif, 40), fill=ink, anchor="ls")
        sd.text((x, W_ * 0.86), L.get("volume", ""), font=font(serif, 34), fill=ink, anchor="ls")
        side = side.rotate(90, expand=True)
        mask_ = Image.new("L", side.size, 0)
        diff = np.abs(np.asarray(side).astype(np.int16) - np.array(bg, np.int16)).sum(axis=2)
        mask_ = Image.fromarray((np.clip(diff * 4, 0, 255)).astype(np.uint8))
        img.paste(side, (0, 0), mask_)
    else:
        d = ImageDraw.Draw(img)
        if L.get("top"):
            # Üstteki küçük başlık (ör. NATURAL GLOW).
            ctext(d, cx, Y(L.get("topY", 0.12)), L["top"], font(sans, L.get("topSize", 30)), ink, spacing=5)
        logo(img, cx, Y(L.get("logoY", 0.52)), L.get("logoSize", 230), ink)
        d = ImageDraw.Draw(img)
        y = Y(L["enY"]) if L.get("enY") else Y(L.get("logoY", 0.52)) + 90 * K
        f_en = font(sans if L.get("enFont") == "sans" else serif, L.get("enSize", 44))
        ctext(d, cx, y, L["en"], f_en, ink, spacing=L.get("enSpacing", 5))
        y = Y(L["trY"]) if L.get("trY") else y + 58 * K
        f_tr = font(sans if L.get("trFont") == "sans" else serif, L.get("trSize", 38))
        ctext(d, cx, y, L["tr"], f_tr, ink, spacing=L.get("trSpacing", 3))
        y = Y(L["linesY"]) if L.get("linesY") else y + 110 * K
        f_lines = font(sans, L.get("lineSize", 44))
        for line in L.get("lines", []):
            ctext(d, cx, y, line, f_lines, ink)
            y += L.get("lineSize", 44) * 1.35 * K
        f_small = font(sans, L.get("smallSize", 24))
        for line in L.get("lines2", []):
            ctext(d, cx, y, line, f_small, ink)
            y += L.get("smallSize", 24) * 1.4 * K
        if L.get("volume") and L.get("frontVolume", True):
            ctext(d, cx, Y(L.get("volumeY", 0.88)), L["volume"], font("Lato-Bold.ttf", 42), ink)
    return np.asarray(img.resize((N, N), Image.LANCZOS)).astype(np.float32)


def render(c, idx):
    if c["style"] == "lalive":
        f, b = lalive_panel(c, idx * 7 + 1), lalive_panel(c, idx * 7 + 2, back=True)
    elif c["style"] == "tube":
        f, b = tube_panel(c, idx * 7 + 1), tube_panel(c, idx * 7 + 2, back=True)
    elif c["style"] == "art":
        f, b = art_front(c, idx * 7 + 1), art_back(c, idx * 7 + 2)
    else:
        f = (classic if c["style"] == "classic" else front)(c, idx * 7 + 1)
        b = back(c, idx * 7 + 2)
    atlas = np.concatenate([f, b], axis=1)
    out = Image.fromarray(np.clip(atlas, 0, 255).astype(np.uint8), "RGB").resize((S * 2, S), Image.LANCZOS)
    path = os.path.join(OUT, c["file"])
    out.save(path, quality=88, optimize=True)
    return path


if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    only = sys.argv[2] if len(sys.argv) > 2 else None
    PERFUMES = load(os.environ.get("CONTENT", CONTENT))
    for i, c in enumerate(PERFUMES):
        if only and only not in c["file"]:
            continue
        print(render(c, i))
