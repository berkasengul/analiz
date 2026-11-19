# Kapak v3 (gerçekçi): HeyGen görüntü üretimi (nano-banana-2) ile kullanıcının kendi fotoğrafı + sitenin net render'ı
# monitörde birleştirildi (kapak/_ham_gercekci_*.png; 3-4: ekran 3 stada bölünmüş, yüz kullanıcının kendi fotoğraflarıyla düzeltilmiş).
# Bu betik yalnızca yazıyı ekler.
import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageEnhance
D = os.path.dirname(os.path.abspath(__file__)); K = f"{D}/kapak"
W, H = 1280, 720
BLACK = lambda s: ImageFont.truetype("/usr/share/fonts/opentype/inter/Inter-Black.otf", s)
YEL, WHT, INK = (255, 214, 0), (255, 255, 255), (10, 10, 14)
def golge(im, xy, metin, font, renk, kalin=9):
    lay = Image.new("RGBA", im.size, (0, 0, 0, 0)); ImageDraw.Draw(lay).text((xy[0] + 5, xy[1] + 9), metin, font=font, fill=(0, 0, 0, 220))
    im.alpha_composite(lay.filter(ImageFilter.GaussianBlur(9)))
    ImageDraw.Draw(im).text(xy, metin, font=font, fill=renk, stroke_width=kalin, stroke_fill=INK)
for i, ad in ((1, "kapak_D_gercekci"), (2, "kapak_E_gercekci"), (3, "kapak_F_3stat_gercekci"), (4, "kapak_G_3stat_gercekci")):
    im = Image.open(f"{K}/_ham_gercekci_{i}.png").convert("RGB").resize((W, H), Image.LANCZOS)
    im = ImageEnhance.Contrast(im).enhance(1.06); im = ImageEnhance.Color(im).enhance(1.1); im = im.filter(ImageFilter.UnsharpMask(1.6, 50, 2)).convert("RGBA")
    g = Image.new("RGBA", (W, H), (0, 0, 0, 0)); dg = ImageDraw.Draw(g)
    for y in range(H): dg.line([(0, y), (W, y)], fill=(0, 0, 0, int(150 * max(0, 1 - y / 260) ** 1.6)))
    im.alpha_composite(g)
    golge(im, (34, 14), "BU BİR", BLACK(84), WHT); golge(im, (34, 104), "WEB SİTESİ", BLACK(112), YEL)
    d = ImageDraw.Draw(im); etk = "OYUN DEĞİL"; fe = BLACK(40); tw = d.textlength(etk, font=fe)
    d.rounded_rectangle((34, 628, 34 + tw + 44, 698), 14, fill=(215, 30, 45), outline=INK, width=4); d.text((56, 638), etk, font=fe, fill=WHT)
    im.convert("RGB").save(f"{K}/{ad}.jpg", quality=94)
print("ok")
