"""Kart görselleri için sinematik son işlem: kutunun etrafında ışık, kenarlarda karanlık, tepeden yumuşak huzme,
alt kısım koyu (kart yazısı için). render/out/card-<tat>.png → render/out/cardg-<tat>.jpg"""
import sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from label import CANS
for key, C in CANS.items():
    im = Image.open(f"render/out/card-{key}.png").convert("RGB")
    W, H = im.size
    a = np.asarray(im).astype(float) / 255
    y = np.linspace(0, 1, H)[:, None, None]; x = np.linspace(0, 1, W)[None, :, None]
    # odak: kutu ve kaide (x=.5, y≈.45)
    d = np.sqrt(((x - 0.5) / 0.36) ** 2 + ((y - 0.47) / 0.5) ** 2)
    v = 0.18 + 0.82 * np.exp(-d ** 2 * 1.25)
    a = a * v
    # huzme
    beam = Image.new("L", (W, H), 0); dr = ImageDraw.Draw(beam)
    dr.polygon([(W * 0.44, 0), (W * 0.56, 0), (W * 0.82, H * 0.66), (W * 0.18, H * 0.66)], fill=70)
    beam = np.asarray(beam.filter(ImageFilter.GaussianBlur(W * 0.05))).astype(float)[..., None] / 255
    beam = beam * np.clip(y / 0.5, 0, 1) ** 0.8
    warm = np.array([1.0, 0.93, 0.8])
    a = a + beam * warm * 0.55 * (1 - a)
    # renk: sıcak, hafif kontrast; gölgelerde tadın rengi
    band = np.array(C["band"], float) / 255
    a = a ** 1.06
    a = a + (1 - a) * 0 + (band * 0.08) * (1 - a.mean(2, keepdims=True))
    # alt: yazı için karanlık
    a = a * (1 - 0.65 * np.clip((y - 0.78) / 0.22, 0, 1) ** 1.2)
    out = Image.fromarray((a.clip(0, 1) * 255).astype(np.uint8))
    out.save(f"render/out/cardg-{key}.jpg", quality=92)
    print(key)
