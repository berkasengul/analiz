# Firma logosu (Garden Motors şablon dili): serifli büyük harf (her kelimenin ilk harfi büyük, gerisi küçük büyük harf)
# + alt çizgi; simgesiz. Kullanım: firma_logo.py out.png "REF,LUXURY,CARS" "#f2efe8" "#c9a24b"
import sys
from PIL import Image, ImageDraw, ImageFont
out, words, CH, CL = sys.argv[1], sys.argv[2].split(','), sys.argv[3], sys.argv[4]
W, H, SS = 2400, 600, 3
im = Image.new('RGBA', (W * SS, H * SS), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
FB = '/usr/share/fonts/truetype/liberation/LiberationSerif-Bold.ttf'
def fonts(cap): return ImageFont.truetype(FB, int(cap / .66)), ImageFont.truetype(FB, int(cap / .66 * .752))
def width(cap):
    big, small = fonts(cap); w = 0
    for wi, word in enumerate(words):
        if wi: w += cap * 70 / 150
        for i, ch in enumerate(word): w += (big if i == 0 else small).getlength(ch) + 4 * SS
    return w - 4 * SS
cap = 190 * SS; avail = (W - 200) * SS
if width(cap) > avail: cap = cap * avail / width(cap)
big, small = fonts(cap); tw = width(cap); x0 = (W * SS - tw) / 2; base = 380 * SS; x = x0
for wi, word in enumerate(words):
    if wi: x += cap * 70 / 150
    for i, ch in enumerate(word):
        f = big if i == 0 else small; asc = f.getbbox('H')[1]
        d.text((x, base - (f.getbbox('H')[3] - asc) - asc), ch, font=f, fill=CH); x += f.getlength(ch) + 4 * SS
d.rectangle([x0, base + 40 * SS, x0 + tw, base + 62 * SS], fill=CL)
im.resize((W, H), Image.LANCZOS).save(out)
