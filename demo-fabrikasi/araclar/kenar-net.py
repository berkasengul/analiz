"""Düz blok (profiles.flat) için net silüet: kesilmiş fotoğraftan (cut/<ürün>.webp) sık noktalı dış kenar.

shopify-foto.py'nin kenarı yarı saydam cam köşelerinde (şeffaf şişe omzu) köşeyi kesip eğik bir omuz
çizebiliyor; düz blokta (flatBlock) seyrek noktalar yumuşatılınca köşeler pahlanıyor. Bu araç kenarı kesimin
saydamlığından yeniden çıkarır (alfa > 100, küçük boşluklar kapatılır), düz kenarlar boyunca ~5 pikselde bir nokta
koyar ve ilk kenarın sınır kutusuna oturtur (doku ile hizalı). shopify-foto.py'den sonra, aktar'dan önce:

    python3 demo-fabrikasi/araclar/kenar-net.py nishane
"""
import json
import os
import sys

import cv2
import numpy as np
from PIL import Image

if len(sys.argv) < 2:
    sys.exit(__doc__)
FOTO = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "markalar", f"{sys.argv[1]}-foto")
M = json.load(open(os.path.join(FOTO, "meta.json")))
for h, m in M.items():
    o = m.get("outline") or []
    if not o:
        continue
    if "outlineBox" not in m:
        pts = np.array([p for poly in o for p in poly])
        m["outlineBox"] = [float(v) for v in (*pts.min(0), *pts.max(0))]
    x0, y0, x1, y1 = m["outlineBox"]
    a = np.asarray(Image.open(os.path.join(FOTO, "cut", f"{h}.webp")).convert("RGBA"))[..., 3]
    H, W = a.shape
    mask = cv2.morphologyEx((a > 100).astype(np.uint8) * 255, cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8))
    cs, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    c = cv2.approxPolyDP(max(cs, key=cv2.contourArea), 1.2, True)[:, 0, :].astype(float)
    dense = []
    for i in range(len(c)):
        p, q = c[i], c[(i + 1) % len(c)]
        n = max(1, int(np.hypot(*(q - p)) / 5))
        dense += [p + (q - p) * k / n for k in range(n)]
    dense = np.array(dense)
    xs = x0 + dense[:, 0] / (W - 1) * (x1 - x0)
    ys = y0 + dense[:, 1] / (H - 1) * (y1 - y0)
    m["outline"] = [[[round(float(x), 4), round(float(y), 4)] for x, y in zip(xs, ys)]]
    print(f"{h:28s} {len(c):3d} köşe → {len(dense)} nokta")
json.dump(M, open(os.path.join(FOTO, "meta.json"), "w"))
