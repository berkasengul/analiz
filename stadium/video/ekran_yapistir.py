# Üretilen görselde monitörün içine sitenin gerçek 3'e bölünmüş ekranını perspektifle yapıştırır (yazılar bozulmasın diye).
# Kullanım: python3 -I ekran_yapistir.py girdi.png ekran.jpg cikti.png
import sys
import numpy as np
from PIL import Image, ImageFilter, ImageDraw
src, scr, out = sys.argv[1:4]
im = Image.open(src).convert("RGB"); W, H = im.size
# ekranın iç köşeleri (1376x768 görselde, elle ölçüldü): sol üst, sağ üst, sağ alt, sol alt
Q = [(110, 104), (972, 152), (972, 642), (118, 716)]
s = Image.open(scr).convert("RGB"); sw, sh = s.size
def coeffs(dst, srcp):  # dst -> src perspektif katsayıları (PIL.Image.transform için)
    A, B = [], []
    for (x, y), (u, v) in zip(dst, srcp):
        A.append([x, y, 1, 0, 0, 0, -u * x, -u * y]); B.append(u)
        A.append([0, 0, 0, x, y, 1, -v * x, -v * y]); B.append(v)
    return np.linalg.solve(np.array(A, float), np.array(B, float)).tolist()
c = coeffs(Q, [(0, 0), (sw, 0), (sw, sh), (0, sh)])
warp = s.transform((W, H), Image.PERSPECTIVE, c, Image.BICUBIC).filter(ImageFilter.GaussianBlur(0.5))
m = Image.new("L", (W, H), 0); ImageDraw.Draw(m).polygon(Q, fill=255); m = m.filter(ImageFilter.GaussianBlur(1.2))
a = np.asarray(im).astype(float); w = np.asarray(warp).astype(float); mk = np.asarray(m).astype(float) / 255
# parmak/ten ekrana biniyorsa onu koru (sağ alt köşe)
r, g, b = a[..., 0], a[..., 1], a[..., 2]
ten = (r > 110) & (r > g + 12) & (g > b) & (r - b > 30)
bolge = np.zeros_like(ten); bolge[600:, 780:] = True
koru = Image.fromarray(((ten & bolge) * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.GaussianBlur(1.5))
mk = mk * (1 - np.asarray(koru).astype(float) / 255)
# ekran parlaklığı: hafif yansıma için orijinalden %8
yeni = w * 0.92 + a * 0.08
o = a * (1 - mk[..., None]) + yeni * mk[..., None]
Image.fromarray(np.clip(o, 0, 255).astype(np.uint8)).save(out)
print("ok", out)
