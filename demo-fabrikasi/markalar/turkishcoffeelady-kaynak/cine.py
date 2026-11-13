"""Sinematik fon: render/bd-<tat>.jpg → render/bdc-<tat>.jpg. Şehir çizimi kenarlarda kararır, kaidenin
arkasında tadın renginde sıcak bir hale, alt kısım koyu sıcak zemine yumuşakça geçer (3B zeminle dikişsiz)."""
import numpy as np
from PIL import Image, ImageFilter
from label import CANS
FLOOR = np.array([34, 27, 22], float)
for key, C in CANS.items():
    im = Image.open(f"render/bd-{key}.jpg").convert("RGB")
    a = np.asarray(im).astype(float)
    H, W = a.shape[:2]
    y = np.linspace(0, 1, H)[:, None, None]
    x = np.linspace(0, 1, W)[None, :, None]
    band = np.array(C["band"], float)
    # karartma: merkezde (kaidenin arkası) aydınlık, kenarlara doğru koyu
    d = np.sqrt(((x - 0.5) / 0.42) ** 2 + ((y - 0.5) / 0.55) ** 2)
    light = 0.30 + 0.62 * np.exp(-d ** 2 * 1.4)
    lum = a.mean(2, keepdims=True)
    a = (a * 0.8 + lum * 0.2) * light
    # tadın renginde sıcak hale
    halo = np.exp(-(((x - 0.5) / 0.2) ** 2 + ((y - 0.6) / 0.22) ** 2))
    a = a + (band * 0.35 + np.array([255, 220, 170]) * 0.65) * halo * 0.22
    # alt: koyu zemin (yumuşak ufuk)
    t = np.clip((y - 0.6) / 0.14, 0, 1) ** 1.4
    floor = FLOOR + np.array([90, 72, 52]) * np.exp(-(((x - 0.5) / 0.28) ** 2)) * np.clip(1 - (y - 0.7) / 0.3, 0, 1)
    a = a * (1 - t) + floor * t
    out = Image.fromarray(a.clip(0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.2))
    out.save(f"render/bdc-{key}.jpg", quality=92)
    print(key)
