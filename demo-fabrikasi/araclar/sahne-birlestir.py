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
    "glow": [255, 190, 120]}]        # ürünün arkasındaki hâle rengi (sahnenin ışığı)
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
RULES = json.load(open(os.path.join(MARKA, f"{SLUG}-kurallar.json"), encoding="utf-8")).get("foto", {})
OUT_W, OUT_H = 900, 1200


def height_cm(handle):
    return next((cm for rx, cm in RULES.get("heights", []) if re.search(rx, handle)), 13.5)


def warm(im, scene_rgb):
    """Ürün sahnenin ışığına uyar: rengi sahnenin ortalama tonuna doğru hafifçe çekilir."""
    a = np.asarray(im).astype(np.float32)
    tint = np.array(scene_rgb, np.float32) / max(1.0, max(scene_rgb))
    tint = 0.86 + 0.14 * tint  # hafif; ürünün kendi rengi baskın kalır
    tint = tint * np.array([1.0, 0.96, 0.88], np.float32)  # sahnelerin altın ışığı
    # Sahnedeki üstten gelen spot: ürün yanlara ve aşağıya doğru hafifçe kararır (yapıştırılmış
    # düz görüntü yerine hacimli durur).
    hh, ww = a.shape[:2]
    xs = np.abs(np.linspace(-1, 1, ww))[None, :]
    ys = np.linspace(0, 1, hh)[:, None]
    shade = (0.82 + 0.18 * (1 - xs**2)) * (1.0 - 0.16 * ys**1.5)
    a[..., :3] = np.clip(a[..., :3] * tint[None, None, :] * shade[..., None], 0, 255)
    return Image.fromarray(a.astype(np.uint8))


def place(scene, prod, cx, base, target_h=None, target_w=None, glow=None):
    """Ürünü kaideye oturtur: temas gölgesi, ürün ve üst yüzde silik yansıma."""
    if target_w:
        k = target_w / prod.width
    else:
        k = target_h / prod.height
    p = prod.resize((max(1, round(prod.width * k)), max(1, round(prod.height * k))), Image.LANCZOS)
    x = round(cx - p.width / 2)
    y = round(base - p.height)
    if glow:
        # Arka ışık: ürünün çevresinde sahnenin renginde yumuşak hâle (kenar ışığı).
        g = Image.new("L", scene.size, 0)
        g.paste(p.getchannel("A"), (x, y))
        g = g.filter(ImageFilter.GaussianBlur(p.width * 0.12))
        halo = Image.new("RGBA", scene.size, tuple(glow) + (255,))
        halo.putalpha(g.point(lambda v: int(v * 0.28)))
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
    renders = sorted(glob.glob(os.path.join(FOTO, "render3d", "*.webp")))
    os.makedirs(os.path.join(FOTO, "sahne"), exist_ok=True)
    done = 0
    for path in renders:
        h = os.path.basename(path)[:-5]
        art = next((a for a in arts if re.search(a["match"], h)), None)
        if not art:
            continue
        scene = Image.open(os.path.join(FOTO, "sahne-kaynak", art["file"])).convert("RGBA")
        mean = np.asarray(scene.convert("RGB").resize((64, 64))).reshape(-1, 3).mean(0)
        prod = warm(Image.open(path).convert("RGBA"), mean)
        group = re.search(RULES.get("noViews", "$^"), h)  # setler: yan yana birkaç ürün
        if group and art.get("w"):
            scene = place(scene, prod, art["cx"], art["base"], target_w=art["w"], glow=art.get("glow"))
        else:
            scene = place(scene, prod, art["cx"], art["base"], target_h=art["h"] * height_cm(h) / 13.5, glow=art.get("glow"))
        x0, y0, x1, y1 = art.get("crop", [0, 0, scene.width, scene.height])
        out = scene.crop((x0, y0, x1, y1)).convert("RGB").resize((OUT_W, OUT_H), Image.LANCZOS)
        out.save(os.path.join(FOTO, "sahne", f"{h}.webp"), quality=86, method=5)
        done += 1
        print("sahne", h, "←", art["file"])
    print(done, "kart sahnesi hazır")


if __name__ == "__main__":
    main()
