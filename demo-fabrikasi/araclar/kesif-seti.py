"""Keşif seti bandı için katmanlar: markanın set fotoğrafındaki kutu (ör. altın "kitap") ve önündeki küçük
koku kutuları ayrı saydam görsellere kesilir. Sitede (ui/Discovery.jsx) kutular sırayla yükselip kitabın önüne
dizilir; üzerine gelince kokunun adı çıkar.

Kurallar: markalar/<marka>-kurallar.json → "kesif": {
    "handle": "discovery", "image": 1,                ürün ve kaçıncı görseli
    "boxes": [[x0, x1], ...],                          küçük kutuların yatay aralıkları (görsele oranla, soldan sağa)
    "y": [y0, y1],                                     küçük kutu sırasının dikey aralığı
    "book": [x0, y0, x1, y1],                          arkadaki büyük kutunun alanı (kutuların arkası dolgu)
    "names": ["ürün-handle", ...]                      küçük kutuların hangi kokular olduğu (soldan sağa)
}
Çıktı: markalar/<marka>-foto/kesif/{full,book,box-<n>}.webp ve kesif.json (yerler görsele oranla)

Kullanım: python3 demo-fabrikasi/araclar/kesif-seti.py mes-bisous
"""
import glob
import json
import os
import sys

import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
if len(sys.argv) < 2:
    sys.exit(__doc__)
SLUG = sys.argv[1]
MARKA = os.path.join(HERE, "..", "markalar")
K = json.load(open(os.path.join(MARKA, f"{SLUG}-kurallar.json"), encoding="utf-8"))["kesif"]
OUT = os.path.join(MARKA, f"{SLUG}-foto", "kesif")


def main():
    from rembg import new_session, remove

    files = sorted(glob.glob(os.path.join(MARKA, f"{SLUG}-shopify", "images", K["handle"], "*")), key=lambda f: int(os.path.basename(f).split(".")[0]))
    im = Image.open(files[K.get("image", 1) - 1]).convert("RGB")
    W, H = im.size
    a = np.asarray(remove(im, session=new_session("isnet-general-use"), only_mask=True)).astype(np.float32) / 255
    a = np.where(a > 0.5, a, 0)
    rgb = np.asarray(im).copy()
    os.makedirs(OUT, exist_ok=True)
    y0, y1 = int(K["y"][0] * H), int(K["y"][1] * H)
    full = np.dstack([rgb, (a * 255).astype(np.uint8)])
    bb = Image.fromarray(full).getchannel("A").getbbox()
    Image.fromarray(full).crop(bb).save(os.path.join(OUT, "full.webp"), quality=88)
    parts = []
    book_a = a.copy()
    for k, (x0, x1) in enumerate(K["boxes"]):
        X0, X1 = int(x0 * W), int(x1 * W)
        sub = np.zeros_like(a)
        sub[y0:y1, X0:X1] = a[y0:y1, X0:X1]
        ys, xs = np.where(sub > 0.05)
        bx0, bx1, by0, by1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
        Image.fromarray(np.dstack([rgb, (sub * 255).astype(np.uint8)])[by0:by1, bx0:bx1]).save(os.path.join(OUT, f"box-{k}.webp"), quality=88)
        parts.append({"file": f"kesif/box-{k}.webp", "handle": K["names"][k], "x": bx0 / W, "y": by0 / H, "w": (bx1 - bx0) / W, "h": (by1 - by0) / H})
        book_a[y0:y1, X0:X1] = 0
    # Büyük kutunun küçük kutuların arkasında kalan alt kısmı: üstteki satırın rengiyle aşağı doğru doldurulur.
    bx0, by0, bx1, by1 = (int(v * s) for v, s in zip(K["book"], (W, H, W, H)))
    ref = int(K["y"][0] * H) - 4
    for y in range(ref, by1):
        row = rgb[ref, bx0:bx1]
        rgb[y, bx0:bx1] = row
        book_a[y, bx0:bx1] = np.maximum(book_a[y, bx0:bx1], a[ref, bx0:bx1])
    book = np.dstack([rgb, (book_a * 255).astype(np.uint8)])
    Image.fromarray(book).save(os.path.join(OUT, "book.webp"), quality=88)
    meta = {"size": [W, H], "bbox": [bb[0] / W, bb[1] / H, bb[2] / W, bb[3] / H], "book": "kesif/book.webp", "full": "kesif/full.webp", "boxes": parts}
    json.dump(meta, open(os.path.join(OUT, "..", "kesif.json"), "w"), ensure_ascii=False, indent=1)
    print(len(parts), "kutu")


if __name__ == "__main__":
    main()
