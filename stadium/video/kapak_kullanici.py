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
# her panelin üstüne kulüp logosu (gölgeli), stadın üstünde şehir kısmına
LOGO = os.environ.get("LOGO", "1") == "1"
if LOGO:
    ek = ekran.convert("RGBA")
    for i, ad in enumerate(("gs", "fb", "bjk")):
        lg = Image.open(f"{K}/_logo_{ad}.png").convert("RGBA"); lg = lg.crop(lg.getbbox())
        hh = 118; lg = lg.resize((round(lg.width * hh / lg.height), hh), Image.LANCZOS)
        x = i * pw + (pw - lg.width) // 2; y = 22
        gl = Image.new("RGBA", ek.size, (0, 0, 0, 0)); sh = Image.new("RGBA", lg.size, (0, 0, 0, 200)); sh.putalpha(lg.getchannel("A").point(lambda v: int(v * 0.75)))
        gl.alpha_composite(sh, (x + 3, y + 6)); ek.alpha_composite(gl.filter(ImageFilter.GaussianBlur(6)))
        ek.alpha_composite(lg, (x, y))
    ekran = ek.convert("RGB")
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
# canlılık yalnız ekrana ve odaya: kişi (yüz, kıyafet, el) orijinal haliyle kalır
canli = ImageEnhance.Color(out).enhance(1.28); canli = ImageEnhance.Contrast(canli).enhance(1.10); canli = ImageEnhance.Brightness(canli).enhance(1.03)
canli = canli.filter(ImageFilter.UnsharpMask(1.8, 55, 2))
km_kisi = np.asarray(kisi.filter(ImageFilter.GaussianBlur(2))).astype(float)[..., None] / 255
out = Image.fromarray(np.clip(np.asarray(canli).astype(float) * (1 - km_kisi) + np.asarray(out).astype(float) * km_kisi, 0, 255).astype(np.uint8))
ad = "kapak_I_kullanici_logolu" if LOGO else "kapak_H_kullanici_3stat"
out.save(f"{K}/{ad}.jpg", quality=95)
out.resize((1280, 720), Image.LANCZOS).save(f"{K}/{ad}_1280.jpg", quality=95)
print("ok")
