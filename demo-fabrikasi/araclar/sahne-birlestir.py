"""Hazır sahne fotoğraflarına ürünün 3B görüntüsünü yerleştirir (kart görselleri).

Girdi:
  markalar/<marka>-foto/sahne-kaynak/<dosya>   ürünsüz sahne (kaidenin üstü boş)
  markalar/<marka>-foto/render3d/<handle>.webp  ürünün saydam 3B görüntüsü (kart-3b.py)
Kurallar: markalar/<marka>-kurallar.json → "foto.sceneArt":
  [{"match": "regex", "file": "pembe-gul.webp",
    "crop": [x0, y0, x1, y1],       # sahneden alınacak 3:4 bölge (orijinal piksel)
    "cx": 590, "base": 812,         # kaidenin üst yüzünün ortası: ürünün ayağı buraya oturur
    "h": 470,                        # 13,5 cm'lik (100 ml) şişenin boyu; diğer boylar foto.heights oranıyla
    "w": 560,                        # setler (yan yana birkaç ürün) için genişlik
    "glow": [255, 190, 120],         # ürünün arkasındaki hâle rengi (sahnenin ışığı)
    "dim": 0.42,                     # spot dışında sahnenin parlaklığı (1 = karartma yok)
    "tint": "palette",               # sahnenin renkli bölümünü ürünün rengine boya ("palette" ya da "#rrggbb")
    "tintHue": [40, 115]}]           # boyanacak renk aralığı (PIL HSV; yeşil ≈ 40-115)
Çıktı: markalar/<marka>-foto/sahne/<handle>.webp (kart-3b.py --stage çıktısının yerine geçer).

Kullanım: python3 demo-fabrikasi/araclar/sahne-birlestir.py turkan
"""
import glob
import json
import os
import re
import sys

import numpy as np
from PIL import Image, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
if len(sys.argv) < 2:
    sys.exit(__doc__)
SLUG = sys.argv[1]
MARKA = os.path.join(HERE, "..", "markalar")
FOTO = os.path.join(MARKA, f"{SLUG}-foto")
_R = json.load(open(os.path.join(MARKA, f"{SLUG}-kurallar.json"), encoding="utf-8"))
RULES = _R.get("foto", {})
PALETTE = _R.get("aktar", {}).get("palette", [])
OUT_W, OUT_H = 900, 1200


def height_cm(handle):
    return next((cm for rx, cm in RULES.get("heights", []) if re.search(rx, handle)), 13.5)


def warm(im, scene_rgb):
    """Ürün spot ışığının altında: üstten aydınlık, sahnenin altın tonunda, kenarlarında ince ışık çizgisi."""
    a = np.asarray(im).astype(np.float32)
    tint = np.array(scene_rgb, np.float32) / max(1.0, max(scene_rgb))
    tint = (0.93 + 0.07 * tint) * np.array([1.0, 0.975, 0.93], np.float32)  # ürünün kendi rengi baskın kalır
    hh, ww = a.shape[:2]
    xs = np.abs(np.linspace(-1, 1, ww))[None, :]
    ys = np.linspace(0, 1, hh)[:, None]
    # Tepeden vuran spot: üst parlak, alt ve yanlar hafif gölgede (hacim).
    shade = (0.88 + 0.12 * (1 - xs**2)) * (1.02 - 0.18 * ys**1.4)
    a[..., :3] = a[..., :3] * tint[None, None, :] * shade[..., None]
    # Kenar ışığı: saydamlığın iç kenarında ince sıcak çizgi, ürün koyu zeminden ayrılır.
    al = Image.fromarray(a[..., 3].astype(np.uint8))
    er = al.filter(ImageFilter.MinFilter(max(3, (ww // 90) | 1)))
    rim = np.clip(np.asarray(al, np.float32) - np.asarray(er, np.float32), 0, 255) / 255
    rim = np.asarray(Image.fromarray((rim * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.2)), np.float32) / 255
    a[..., :3] += rim[..., None] * np.array([70, 60, 42], np.float32) * (1.1 - 0.6 * ys[..., None])
    out = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))
    return out


def hexrgb(h):
    return np.array([int(h[i:i + 2], 16) for i in (1, 3, 5)], np.float32)


def recolor(scene, color, hue=(40, 115)):
    """Sahnenin renkli bölümü (ör. kemerin içi) ürünün rengine boyanır; desen, doku ve ışık aynı kalır.
    `hue`: boyanacak renk aralığı (PIL HSV, 0-255; yeşil ≈ 40-115). Altın, mermer, beyaz çiçek dokunulmaz."""
    rgb = scene.convert("RGB")
    a = np.asarray(rgb).astype(np.float32) / 255
    hsv = np.asarray(rgb.convert("HSV")).astype(np.float32)
    H, S = hsv[..., 0], hsv[..., 1]
    lo, hi = hue
    m = np.clip((H - lo + 10) / 10, 0, 1) * np.clip((hi + 10 - H) / 10, 0, 1) * np.clip((S - 20) / 40, 0, 1)
    m = np.asarray(Image.fromarray((m * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(2)), np.float32) / 255
    L = a.max(-1)
    t = hexrgb(color) / 255
    t = t / max(t.max(), 1e-3)
    col = t[None, None, :] * np.clip(L[..., None] * 1.45, 0, 1)
    # Parlak yerler (spot) renkten sıcak beyaza döner: ışık hâlâ altın ışığı gibi durur.
    top = np.clip((L - 0.55) / 0.45, 0, 1)[..., None] ** 1.5
    col = col * (1 - top * 0.6) + np.array([1, 0.93, 0.8], np.float32) * L[..., None] * top * 0.6
    out = a * (1 - m[..., None]) + col * m[..., None]
    img = Image.fromarray((np.clip(out, 0, 1) * 255).astype(np.uint8)).convert("RGBA")
    return img


def spotlight(scene, cx, cy, pw, ph, base, dim):
    """Sahne kararır, ışık yalnızca ürüne ve kaidedeki ayak izine düşer; tepeden ince bir ışık konisi iner."""
    a = np.asarray(scene).astype(np.float32)
    H, W = a.shape[:2]
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    rx, ry = max(pw * 1.45, W * 0.2), ph * 0.95
    d = np.sqrt(((xx - cx) / rx) ** 2 + ((yy - cy) / ry) ** 2)
    t = np.clip((d - 0.5) / 0.8, 0, 1)
    spot = 1 - t * t * (3 - 2 * t)
    k = dim + (1 - dim) * spot
    # Işık konisi: tepeden ürüne doğru genişleyen yumuşak huzme.
    half = pw * 0.35 + (pw * 0.75) * np.clip(yy / max(1, base), 0, 1)
    cone = np.clip(1 - np.abs(xx - cx) / half, 0, 1) ** 1.6 * np.clip(yy / max(1, base), 0, 1) ** 0.7 * (yy < base)
    # Kaidede ışık havuzu.
    pool = np.clip(1 - np.sqrt(((xx - cx) / (pw * 1.05)) ** 2 + ((yy - base) / (pw * 0.2)) ** 2), 0, 1) ** 1.5
    light = np.array([255, 226, 180], np.float32)
    a[..., :3] = a[..., :3] * k[..., None] + (cone * 0.07 + pool * 0.22)[..., None] * light
    return Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))


def place(scene, prod, cx, base, target_h=None, target_w=None, glow=None, dim=0.42):
    """Ürünü kaideye oturtur: sahne kararır ve spot ürüne vurur; temas gölgesi, ürün, silik yansıma."""
    if target_w:
        k = target_w / prod.width
    else:
        k = target_h / prod.height
    p = prod.resize((max(1, round(prod.width * k)), max(1, round(prod.height * k))), Image.LANCZOS)
    p = p.filter(ImageFilter.UnsharpMask(radius=1.2, percent=60, threshold=2))
    x = round(cx - p.width / 2)
    y = round(base - p.height)
    scene = spotlight(scene, cx, base - p.height * 0.45, p.width, p.height, base, dim)
    if glow:
        # Arka ışık: ürünün çevresinde sahnenin renginde yumuşak hâle.
        g = Image.new("L", scene.size, 0)
        g.paste(p.getchannel("A"), (x, y))
        g = g.filter(ImageFilter.GaussianBlur(p.width * 0.14))
        halo = Image.new("RGBA", scene.size, tuple(glow) + (255,))
        halo.putalpha(g.point(lambda v: int(v * 0.32)))
        scene.alpha_composite(halo)
    # Temas gölgesi: ürünün ayağında koyu, yumuşak elips.
    sh = Image.new("L", scene.size, 0)
    sw, shh = int(p.width * 0.9), max(6, int(p.width * 0.1))
    from PIL import ImageDraw

    ImageDraw.Draw(sh).ellipse([cx - sw // 2, base - shh // 2, cx + sw // 2, base + shh // 2], fill=190)
    sh = sh.filter(ImageFilter.GaussianBlur(max(3, shh * 0.6)))
    dark = Image.new("RGBA", scene.size, (0, 0, 0, 255))
    dark.putalpha(sh)
    scene.alpha_composite(dark)
    # Parlak kaide yüzeyinde kısa, silik yansıma.
    refl = p.transpose(Image.FLIP_TOP_BOTTOM)
    ra = np.asarray(refl.getchannel("A")).astype(np.float32)
    fade = np.clip(1 - np.arange(refl.height) / (refl.height * 0.18), 0, 1)[:, None]
    refl.putalpha(Image.fromarray((ra * fade * 0.22).astype(np.uint8)))
    scene.alpha_composite(refl, (x, base))
    scene.alpha_composite(p, (x, y))
    return scene


def main():
    arts = RULES.get("sceneArt", [])
    # Net ürün için yüksek çözünürlüklü çekim (kart-3b.py --hd) varsa o kullanılır.
    renders = sorted(glob.glob(os.path.join(FOTO, "render3d", "*.webp")))
    hd = os.path.join(FOTO, "render3d-hd")
    os.makedirs(os.path.join(FOTO, "sahne"), exist_ok=True)
    done = 0
    for path in renders:
        h = os.path.basename(path)[:-5]
        art = next((a for a in arts if re.search(a["match"], h)), None)
        if not art:
            continue
        scene = Image.open(os.path.join(FOTO, "sahne-kaynak", art["file"])).convert("RGBA")
        glow = art.get("glow")
        if art.get("tint"):
            # "tint": "palette" → ürünün sitedeki rengi (aktar.palette), ya da doğrudan "#rrggbb".
            pal = next((c for c in PALETTE if re.search(c[0], h)), None)
            color = pal[1] if art["tint"] == "palette" and pal else art["tint"]
            if art["tint"] == "palette" and not pal:
                print("renk yok, atlandı:", h)
                continue
            scene = recolor(scene, color, tuple(art.get("tintHue", (40, 115))))
            glow = glow or (list(hexrgb(pal[2]).astype(int)) if pal else None)
        mean = np.asarray(scene.convert("RGB").resize((64, 64))).reshape(-1, 3).mean(0)
        src = os.path.join(hd, f"{h}.webp")
        prod = warm(Image.open(src if os.path.exists(src) else path).convert("RGBA"), mean)
        group = re.search(RULES.get("noViews", "$^"), h)  # setler: yan yana birkaç ürün
        if group and art.get("w"):
            scene = place(scene, prod, art["cx"], art["base"], target_w=art["w"], glow=glow, dim=art.get("dim", 0.42))
        else:
            scene = place(scene, prod, art["cx"], art["base"], target_h=art["h"] * height_cm(h) / 13.5, glow=glow, dim=art.get("dim", 0.42))
        x0, y0, x1, y1 = art.get("crop", [0, 0, scene.width, scene.height])
        out = scene.crop((x0, y0, x1, y1)).convert("RGB").resize((OUT_W, OUT_H), Image.LANCZOS)
        out.save(os.path.join(FOTO, "sahne", f"{h}.webp"), quality=90, method=5)
        done += 1
        print("sahne", h, "←", art["file"])
    print(done, "kart sahnesi hazır")
    backdrops([os.path.basename(r)[:-5] for r in renders])


def backdrops(handles):
    """Ana sayfadaki 3B serginin arka planı: ürünsüz sahne fotoğrafı (foto.backdropArt), gerekirse ürünün
    rengine boyanmış. fon/<ad>.webp + fon/fon.json (ürün → görsel, en-boy oranı, kaide çizgisi, orta, ürün boyu).
    Site ürünü bu kaidenin üstüne oturtur (Background.jsx)."""
    arts = RULES.get("backdropArt", [])
    if not arts:
        return
    out = os.path.join(FOTO, "fon")
    os.makedirs(out, exist_ok=True)
    meta, made = {}, {}
    for h in handles:
        art = next((a for a in arts if re.search(a["match"], h)), None)
        if not art:
            continue
        color = None
        if art.get("tint"):
            pal = next((c for c in PALETTE if re.search(c[0], h)), None)
            color = pal[1] if art["tint"] == "palette" and pal else (None if art["tint"] == "palette" else art["tint"])
        name = os.path.splitext(art["file"])[0] + (f"-{color[1:].lower()}" if color else "")
        if name not in made:
            im = Image.open(os.path.join(FOTO, "sahne-kaynak", art["file"])).convert("RGBA")
            if color:
                im = recolor(im, color, tuple(art.get("tintHue", (40, 115))))
            im.convert("RGB").save(os.path.join(out, f"{name}.webp"), quality=84, method=5)
            made[name] = im.size
        W, H = made[name]
        meta[h] = {"src": f"fon/{name}.webp", "aspect": round(W / H, 4), "base": round(art["base"] / H, 4),
                   "cx": round(art["cx"] / W, 4), "h": round(art["h"] * height_cm(h) / 13.5 / H, 4)}
    json.dump(meta, open(os.path.join(out, "fon.json"), "w"), indent=1)
    print(len(made), "arka plan sahnesi →", len(meta), "ürün")


if __name__ == "__main__":
    main()
