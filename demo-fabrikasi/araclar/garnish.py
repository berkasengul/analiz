"""Nota malzemeleri: markanın malzemeli ürün fotoğrafından (şişenin iki yanında çiçek, meyve, baharat…)
şişe çıkarılır, sol ve sağ taraftaki malzemeler ayrı saydam katmanlar olarak kesilir. Sitede 3B sahnede
şişenin iki yanında, fotoğraftaki yerlerinde süzülürler (hope-demo/src/Garnish.jsx).

Kurallar: markalar/<marka>-kurallar.json → "foto": {"garnish": [["regex", n]]}  (n: o ürünün kaçıncı görseli)
Çıktı: markalar/<marka>-foto/garnish/<ürün>-L.webp, -R.webp ve meta.json'a "garnish":
    {"parts": [{"file": "garnish/<ürün>-L.webp", "x", "y", "w", "h"}]}
    x, y: katmanın merkezinin şişenin tabanının ortasına uzaklığı, w, h: boyutu; hepsi şişe boyuna oranla
    (y yukarı pozitif). Şişe kesilen yerde kalan düz kenar 3B şişenin arkasında kalır.

Kullanım: python3 demo-fabrikasi/araclar/garnish.py mes-bisous
"""
import glob
import json
import os
import re
import sys

import cv2
import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
if len(sys.argv) < 2:
    sys.exit(__doc__)
SLUG = sys.argv[1]
MARKA = os.path.join(HERE, "..", "markalar")
SRC = os.path.join(MARKA, f"{SLUG}-shopify", "images")
OUT = os.path.join(MARKA, f"{SLUG}-foto")
RULES = json.load(open(os.path.join(MARKA, f"{SLUG}-kurallar.json"), encoding="utf-8")).get("foto", {})


def alpha(im):
    from rembg import new_session, remove
    global SESSION
    try:
        SESSION
    except NameError:
        SESSION = new_session("isnet-general-use")
    return np.asarray(remove(im.convert("RGB"), session=SESSION, only_mask=True)).astype(np.float32) / 255


def bottle_box(a):
    """Şişe: görüntünün ortasına yakın, en uzun dikey kesintisiz maske sütunlarının oluşturduğu blok."""
    m = a > 0.5
    h, w = m.shape
    run = np.zeros(w, int)
    top = np.zeros(w, int)
    bot = np.zeros(w, int)
    for x in range(w):
        ys = np.where(m[:, x])[0]
        if len(ys) < 2:
            continue
        # en uzun kesintisiz parça
        br = np.where(np.diff(ys) > 3)[0]
        starts = np.r_[0, br + 1]
        ends = np.r_[br, len(ys) - 1]
        k = np.argmax(ys[ends] - ys[starts])
        run[x], top[x], bot[x] = ys[ends[k]] - ys[starts[k]], ys[starts[k]], ys[ends[k]]
    tall = run > 0.5 * run.max()
    # ortadaki en geniş kesintisiz sütun bloğu
    xs = np.where(tall)[0]
    if not len(xs):
        return None
    groups = np.split(xs, np.where(np.diff(xs) > 2)[0] + 1)
    g = max(groups, key=lambda g: len(g) - abs((g[0] + g[-1]) / 2 - w / 2) * 0.3)
    x0, x1 = g[0], g[-1]
    # kapak (dar) dahil: şişenin tepesi ortadaki sütunların en üstü
    y0 = int(np.percentile(top[x0:x1 + 1], 5))
    y1 = int(np.median(bot[x0:x1 + 1]))
    return x0, y0, x1, y1


def main():
    meta_p = os.path.join(OUT, "meta.json")
    meta = json.load(open(meta_p, encoding="utf-8"))
    os.makedirs(os.path.join(OUT, "garnish"), exist_ok=True)
    for handle in meta:
        n = next((v for rx, v in RULES.get("garnish", []) if re.search(rx, handle)), None)
        if not n:
            continue
        files = sorted(glob.glob(os.path.join(SRC, handle, "*")), key=lambda f: int(os.path.basename(f).split(".")[0]))
        if len(files) < n:
            continue
        im = Image.open(files[n - 1]).convert("RGB")
        im.thumbnail((1600, 1600))
        a = alpha(im)
        box = bottle_box(a)
        if not box:
            print(handle, "şişe bulunamadı")
            continue
        x0, y0, x1, y1 = box
        bh = y1 - y0
        bcx = (x0 + x1) / 2
        rgb = np.asarray(im)
        parts = []
        # Şişenin kenarından biraz içeri kadar alınır (3B şişe kesik kenarı örter).
        pad = int(0.04 * (x1 - x0))
        cut = int(0.012 * (x1 - x0)) + 2  # şişenin kenar şeridi (yansıyan kenar) alınmaz
        for side, sl in (("L", slice(0, x0 - cut)), ("R", slice(x1 + cut, a.shape[1]))):
            al = np.zeros_like(a)
            al[:, sl] = a[:, sl]
            m = (al > 0.5).astype(np.uint8)
            k, lab, st, _ = cv2.connectedComponentsWithStats(m, 8)
            keep = [i for i in range(1, k) if st[i, cv2.CC_STAT_AREA] > 0.002 * m.size]
            if not keep:
                continue
            al = al * np.isin(lab, keep)
            # Kesik kenar yumuşak: şişe tarafındaki şeritte saydamlığa geçiş.
            if side == "L":
                ramp = np.clip((x0 - cut - np.arange(a.shape[1])) / max(1, pad), 0, 1)
            else:
                ramp = np.clip((np.arange(a.shape[1]) - (x1 + cut)) / max(1, pad), 0, 1)
            al = al * ramp[None, :]
            ys, xs = np.where(al > 0.05)
            if not len(xs) or xs.max() - xs.min() < 0.1 * bh:
                continue
            bx0, bx1, by0, by1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
            rgba = np.dstack([rgb, (al * 255).astype(np.uint8)])[by0:by1, bx0:bx1]
            f = f"garnish/{handle}-{side}.webp"
            Image.fromarray(rgba).save(os.path.join(OUT, f), quality=86, method=5)
            parts.append({"file": f, "x": round(((bx0 + bx1) / 2 - bcx) / bh, 4), "y": round((y1 - (by0 + by1) / 2) / bh, 4),
                          "w": round((bx1 - bx0) / bh, 4), "h": round((by1 - by0) / bh, 4)})
        meta[handle]["garnish"] = {"parts": parts}
        print(handle, "şişe", box, "katman", len(parts))
    json.dump(meta, open(meta_p, "w", encoding="utf-8"), ensure_ascii=False, indent=1)


if __name__ == "__main__":
    main()
