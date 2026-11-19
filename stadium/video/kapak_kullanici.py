# Kullanıcının kendi tasarladığı kapağa (kapak/_kullanici_ham.jpg) üç stadın foto-gerçekçi görüntülerini TV ekranına yerleştirir,
# yazı/ok/el üstte kalır; sonra tüm kareye canlılık verilir.
import os, numpy as np
from PIL import Image, ImageFilter, ImageEnhance, ImageDraw
D = os.path.dirname(os.path.abspath(__file__)); K = f"{D}/kapak"
im = Image.open(f"{K}/_kullanici_ham.jpg").convert("RGB"); W, H = im.size  # 1672x941
X0, Y0, X1, Y1 = 138, 338, 1122, 800   # TV ekranının görünen alanı (bandın altı)
pw = (X1 - X0) // 3; ph = Y1 - Y0
ekran = Image.new("RGB", (X1 - X0, ph), (8, 8, 10))
for i, ad in enumerate(("rams", "fb", "bjk")):
    p = Image.open(f"{K}/_stad_foto_{ad}.png").convert("RGB")
    s = max(pw / p.width, ph / p.height) * 1.0; p = p.resize((round(p.width * s), round(p.height * s)), Image.LANCZOS)
    cy = {"rams": 0.47, "fb": 0.45, "bjk": 0.47}[ad]
    x0 = (p.width - pw) // 2; y0 = int(min(max(0, cy * p.height - ph / 2), p.height - ph))
    p = ImageEnhance.Color(p.crop((x0, y0, x0 + pw, y0 + ph))).enhance(1.15)
    ekran.paste(p, (i * pw, 0))
dd = ImageDraw.Draw(ekran)
for x in (pw, 2 * pw): dd.rectangle((x - 2, 0, x + 2, ph), fill=(8, 8, 10))
# korunacak katmanlar: kırmızı grafikler (bant, ok, etiket) + içlerindeki beyaz yazılar, ve kişi
a = np.asarray(im).astype(int); r, g, b = a[..., 0], a[..., 1], a[..., 2]
kirmizi = (r > 120) & (r > g * 1.7) & (r > b * 1.7)
km = Image.fromarray((kirmizi * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(9)).filter(ImageFilter.MinFilter(9))  # kapama: delikleri doldur
km = km.filter(ImageFilter.MaxFilter(31)).filter(ImageFilter.MinFilter(25))  # etiket içindeki beyaz harfler
from rembg import remove, new_session
kisi = remove(im, session=new_session("u2net_human_seg"), only_mask=True).filter(ImageFilter.MaxFilter(3))
koru = np.maximum(np.asarray(km), np.asarray(kisi)).astype(float) / 255
koru = np.asarray(Image.fromarray((koru * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.2))).astype(float) / 255
yeni = a.astype(float).copy()
e = np.asarray(ekran).astype(float)
bolge = yeni[Y0:Y1, X0:X1]; k = koru[Y0:Y1, X0:X1, None]
yeni[Y0:Y1, X0:X1] = e * (1 - k) + bolge * k
out = Image.fromarray(np.clip(yeni, 0, 255).astype(np.uint8))
# canlılık: doygunluk, kontrast, hafif netlik
out = ImageEnhance.Color(out).enhance(1.28); out = ImageEnhance.Contrast(out).enhance(1.10); out = ImageEnhance.Brightness(out).enhance(1.03)
out = out.filter(ImageFilter.UnsharpMask(1.8, 55, 2))
out.save(f"{K}/kapak_H_kullanici_3stat.jpg", quality=95)
out.resize((1280, 720), Image.LANCZOS).save(f"{K}/kapak_H_kullanici_3stat_1280.jpg", quality=95)
print("ok")
