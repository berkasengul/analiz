"""Ephemeral Dyadic kart görselleri: sinematik son işlem (vinyet, tepeden huzme, alt karartma).
render/out/card-<koku>.png → render/out/cardg-<koku>.jpg"""
import glob
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
for f in sorted(glob.glob("render/out/card-*.png")):
    key = f.split("card-")[1][:-4]
    im = Image.open(f).convert("RGB"); W, H = im.size
    a = np.asarray(im).astype(float) / 255
    y = np.linspace(0, 1, H)[:, None, None]; x = np.linspace(0, 1, W)[None, :, None]
    d = np.sqrt(((x - 0.5) / 0.4) ** 2 + ((y - 0.45) / 0.55) ** 2)
    a = a * (0.22 + 0.78 * np.exp(-d ** 2 * 1.2))
    beam = Image.new("L", (W, H), 0); dr = ImageDraw.Draw(beam)
    dr.polygon([(W * 0.45, 0), (W * 0.55, 0), (W * 0.76, H * 0.6), (W * 0.24, H * 0.6)], fill=60)
    beam = np.asarray(beam.filter(ImageFilter.GaussianBlur(W * 0.05))).astype(float)[..., None] / 255 * np.clip(y / 0.45, 0, 1)
    a = a + beam * np.array([1.0, 0.95, 0.86]) * 0.5 * (1 - a)
    a = a * (1 - 0.65 * np.clip((y - 0.78) / 0.22, 0, 1) ** 1.2)
    Image.fromarray((a.clip(0, 1) * 255).astype(np.uint8)).save(f"render/out/cardg-{key}.jpg", quality=92)
    print(key)
