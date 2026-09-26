"""Lalive logosunun yeniden çizimi (markanın paylaşılan logo görseline göre).

Italiana yazı tipi kalınlaştırılır; "i" harfinin noktası yerine yukarı kıvrılan
yapraklı bir zeytin dalı çizilir. Çıktılar şeffaf PNG:
  logo-cream.png  koyu zeminler için (site başlığı)
  logo-green.png  açık zeminler için (etiketler)
Kullanım: python3 logo.py
"""
import math
import os

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
FONT = os.path.join(HERE, "..", "..", "..", "hope-demo", "docs", "label-fonts", "Italiana-Regular.ttf")
W, H = 2400, 900


def mask():
    m = Image.new("L", (W, H), 0)
    d = ImageDraw.Draw(m)
    f = ImageFont.truetype(FONT, 640)
    word = "lalıve"
    total = d.textlength(word, font=f)
    x0 = (W - total) / 2
    base = 700
    # Kalın gövdeler, ince yatay çizgiler: harfleri yalnızca yatayda kalınlaştır
    # (dikeyler kalınlaşır, yataylar ve kıl çizgiler ince kalır).
    t = Image.new("L", (W, H), 0)
    ImageDraw.Draw(t).text((x0, base), word, font=f, fill=255, anchor="ls")
    a = np.asarray(t)
    thick = a.copy()
    for dx in range(1, 13):
        thick = np.maximum(thick, np.roll(a, dx, axis=1))
    m.paste(Image.fromarray(thick), (0, 0))
    d = ImageDraw.Draw(m)
    # "i"nin noktası yerine dal.
    xi = x0 + d.textlength("lal", font=f) + d.textlength("ı", font=f) / 2
    top = base + f.getbbox("ı", anchor="ls")[1]
    pts = []
    for k in range(40):
        t = k / 39
        pts.append((xi + 6 + 70 * t ** 1.4, top - 30 - 250 * t))
    d.line(pts, fill=255, width=5)
    for k, t in enumerate((0.2, 0.38, 0.56, 0.74, 0.92)):
        i = int(t * 39)
        px, py = pts[i]
        side = -1 if k % 2 == 0 else 1
        a = -1.57 + side * 0.95 - 0.15  # yapraklar dalın iki yanında, yukarı doğru
        L = 78 - 7 * k
        lx, ly = px + math.cos(a) * L, py + math.sin(a) * L
        nx, ny = -math.sin(a) * 10, math.cos(a) * 10
        d.polygon([(px, py), ((px + lx) / 2 + nx, (py + ly) / 2 + ny), (lx, ly), ((px + lx) / 2 - nx, (py + ly) / 2 - ny)], fill=255)
    return m.filter(ImageFilter.GaussianBlur(0.6)).crop(m.getbbox())


def save(m, color, name):
    im = Image.new("RGBA", m.size, color + (0,))
    im.putalpha(m)
    im.save(os.path.join(HERE, name))


if __name__ == "__main__":
    m = mask()
    save(m, (236, 228, 204), "logo-cream.png")
    save(m, (20, 52, 36), "logo-green.png")
    print(m.size)
