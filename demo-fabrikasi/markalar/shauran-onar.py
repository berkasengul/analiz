"""Shauran: 3B doku atlası rötuşu (shopify-foto.py sonrası, shopify-aktar.py öncesi).

- Etiketin kenarında kalan stüdyo beyazı (glassAlpha etiket dikdörtgenini olduğu gibi bırakır) camın geri kalanı
  gibi yarı saydam olur: kapağın altında, rengi neredeyse beyaz ve doygunluğu düşük pikseller.
- Kapak (boyunun üstü) fotoğraftaki rose-gold tonuna çekilir: sahne ışığında turuncuya kaçmasın diye doygunluk
  azaltılır.
Kullanım: python3 demo-fabrikasi/markalar/shauran-onar.py
"""
import glob
import json
import os

import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
FOTO = os.path.join(HERE, "shauran-foto")
meta = json.load(open(os.path.join(FOTO, "meta.json"), encoding="utf-8"))
for f in sorted(glob.glob(os.path.join(FOTO, "labels", "*.webp"))):
    h = os.path.basename(f)[:-5]
    a = np.asarray(Image.open(f).convert("RGBA")).astype(np.float32)
    S = a.shape[0]
    neck = int((meta.get(h, {}).get("neck") or 0.25) * S)
    for x0 in (0, S):
        half = a[:, x0 : x0 + S]
        body = half[neck + S // 100 :]
        rgb = body[..., :3]
        white = (rgb.min(-1) > 196) & (rgb.max(-1) - rgb.min(-1) < 26) & (body[..., 3] > 200)
        body[white, :3] = 229
        body[white, 3] = 25
        cap = half[:neck]
        c = cap[..., :3]
        grey = c.mean(-1, keepdims=True)
        cap[..., :3] = grey + (c - grey) * 0.62 + np.array([6, 2, 0])
    Image.fromarray(a.clip(0, 255).astype(np.uint8)).save(f, quality=92, method=5)
    print(h, "tamam")
