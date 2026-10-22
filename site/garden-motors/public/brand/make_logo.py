"""Garden Motors logosu: kullanıcının gönderdiği tabela görselinden yeniden çizim (240x60 → 2400x600).
Çıktılar: logo.png (siyah tabela, saydam köşeler) ve logo-transparent.png (zeminsiz, koyu yüzeyler için)."""
import sys
from PIL import Image, ImageDraw, ImageFont, ImageFilter

OUT = sys.argv[1]
W, H = 2400, 600
SS = 2                                    # süper örnekleme
GREEN = (36, 214, 52)
WHITE = (250, 250, 250)
SERIF = "/usr/share/fonts/truetype/liberation/LiberationSerif-Bold.ttf"

def draw(with_bg=True):
    w, h = W * SS, H * SS
    im = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    if with_bg:
        d.rounded_rectangle((6 * SS, 6 * SS, w - 6 * SS, h - 6 * SS), 46 * SS, fill=(6, 6, 6, 255), outline=(150, 150, 150, 255), width=6 * SS)
    # --- simge: iki yaprak + altında beyaz avuç (kavisli tabla) ---
    cx, base = 330 * SS, 330 * SS
    def leaf(x0, y0, x1, y1, rot):
        lw, lh = int(x1 - x0), int(y1 - y0)
        L = Image.new("RGBA", (lw * 2, lh * 2), (0, 0, 0, 0))
        ld = ImageDraw.Draw(L)
        ld.ellipse((lw // 2, lh // 2, lw * 3 // 2, lh * 3 // 2), fill=GREEN + (255,))
        ld.line((lw // 2 + lw * .12, lh * 3 // 2 - lh * .12, lw * 3 // 2 - lw * .15, lh // 2 + lh * .15), fill=(10, 90, 20, 255), width=max(2, 5 * SS))
        L = L.rotate(rot, Image.BICUBIC, expand=False)
        im.alpha_composite(L, (int(x0 - lw // 2), int(y0 - lh // 2)))
    leaf(cx - 175 * SS, base - 190 * SS, cx - 15 * SS, base - 95 * SS, 20)    # sol yaprak
    leaf(cx - 5 * SS, base - 255 * SS, cx + 165 * SS, base - 135 * SS, -5)    # sağ, daha yüksek yaprak
    d.line((cx - 10 * SS, base - 30 * SS, cx + 10 * SS, base - 150 * SS), fill=GREEN + (255,), width=12 * SS)   # sap
    # beyaz avuç: hafif kavisli, sağa uzanan tabla
    d.chord((cx - 210 * SS, base - 120 * SS, cx + 170 * SS, base + 70 * SS), 10, 170, fill=WHITE + (255,))
    d.chord((cx - 180 * SS, base - 150 * SS, cx + 140 * SS, base + 30 * SS), 10, 170, fill=(6, 6, 6, 255) if with_bg else (0, 0, 0, 0))
    # --- yazı: büyük G ve M, diğer harfler küçük büyük harf (small caps) ---
    X0, X1 = 580 * SS, 2310 * SS                     # yazı + alt çizgi alanı (orijinalde genişliğin ~%72'si)
    def width_at(k):
        bf, sf = ImageFont.truetype(SERIF, int(250 * k * SS)), ImageFont.truetype(SERIF, int(188 * k * SS))
        wd = lambda t: sum((bf if i == 0 else sf).getlength(c) + 4 * SS for i, c in enumerate(t))
        return wd("GARDEN") + 70 * k * SS + wd("MOTORS")
    k = (X1 - X0) / width_at(1.0)
    big = ImageFont.truetype(SERIF, int(250 * k * SS))
    small = ImageFont.truetype(SERIF, int(188 * k * SS))
    x, y_base = X0, 390 * SS
    def word(txt, x):
        for i, ch in enumerate(txt):
            f = big if i == 0 else small
            d.text((x, y_base), ch, font=f, fill=WHITE + (255,), anchor="ls")
            x += f.getlength(ch) + 4 * SS
        return x
    x = word("GARDEN", x)
    x += 70 * k * SS
    x_end = word("MOTORS", x)
    # yeşil alt çizgi (yazı genişliğinde)
    d.rectangle((X0, 445 * SS, x_end, 490 * SS), fill=GREEN + (255,))
    return im.resize((W, H), Image.LANCZOS), x_end / SS

full, x_end = draw(True)
full.save(f"{OUT}/logo.png")
tr, _ = draw(False)
tr.save(f"{OUT}/logo-transparent.png")
print("text ends at", x_end)
