"""Mürekkep desenleri (kutu fotoğraflarından ~700 px) → 2048 px: Lanczos ölçek + kenar keskinleştirme.
Desen değişmez; yalnızca büyütmenin yumuşattığı mürekkep kenarları toparlanır."""
import glob, os
import numpy as np
from PIL import Image, ImageFilter
D = os.path.dirname(os.path.abspath(__file__)) + "/render/"
for f in sorted(glob.glob(D + "art/*.png")):
    im = Image.open(f).convert("RGB")
    s = 2048 / max(im.size)
    big = im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS)
    big = big.filter(ImageFilter.GaussianBlur(1.2))           # büyütme pikselleşmesini yumuşat
    big = big.filter(ImageFilter.UnsharpMask(radius=6, percent=90, threshold=2))
    a = np.asarray(big).astype(float) / 255
    a = np.clip((a - 0.5) * 1.08 + 0.5, 0, 1)                # mürekkep/kâğıt ayrımı +%8
    Image.fromarray((a * 255).astype(np.uint8)).save(D + "art2k/" + os.path.basename(f), optimize=True)
    print(os.path.basename(f), big.size)
