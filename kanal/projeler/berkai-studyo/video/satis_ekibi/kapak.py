# Satış ekibi videosu: 3 kapak (1280x720)
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageEnhance
import os
S = os.path.dirname(os.path.abspath(__file__))
F = "/home/user/analiz/kanal/arac/vid/assets/fonts"
OT = "/home/user/analiz/kanal/projeler/berkai-studyo/gunler/2026-11-13/06_mudur/ofis_test"
D = "/home/user/analiz/video_teslim"
W, H = 1280, 720
ORANGE = (242, 140, 40); INK = (27, 34, 64); GREEN = (34, 170, 90)
def font(n, s): return ImageFont.truetype(f"{F}/{n}", s)
ANTON = lambda s: font("Anton.ttf", s); IT8 = lambda s: font("InterTight800.ttf", s)

def fit(im, w, h, cx=.5, cy=.5):
    k = max(w / im.width, h / im.height); im = im.resize((int(im.width * k) + 1, int(im.height * k) + 1), Image.LANCZOS)
    ox = int((im.width - w) * cx); oy = int((im.height - h) * cy); return im.crop((ox, oy, ox + w, oy + h))

def shadow_text(c, xy, s, f, col=(255, 255, 255)):
    lay = Image.new("RGBA", c.size, (0, 0, 0, 0)); d = ImageDraw.Draw(lay)
    d.text((xy[0] + 4, xy[1] + 8), s, font=f, fill=(0, 0, 0, 170)); lay = lay.filter(ImageFilter.GaussianBlur(10))
    c.alpha_composite(lay); ImageDraw.Draw(c).text(xy, s, font=f, fill=col, stroke_width=3, stroke_fill=(0, 0, 0))

def tag(c, x, y, s, size, bg=ORANGE, fg=(255, 255, 255), rot=-3, padx=26, pady=10):
    f = ANTON(size); bb = f.getbbox(s); w = bb[2] - bb[0] + 2 * padx; h = bb[3] - bb[1] + 2 * pady
    lay = Image.new("RGBA", (w + 60, h + 60), (0, 0, 0, 0)); d = ImageDraw.Draw(lay)
    d.rounded_rectangle((30, 30, 30 + w, 30 + h), 14, fill=bg + (255,)); d.text((30 + padx - bb[0], 30 + pady - bb[1]), s, font=f, fill=fg)
    lay = lay.rotate(-rot, Image.BICUBIC, expand=True)
    sh = Image.new("RGBA", lay.size, (0, 0, 0, 0)); sh.putalpha(lay.getchannel("A").point(lambda a: a * .55)); sh = sh.filter(ImageFilter.GaussianBlur(12))
    c.alpha_composite(sh, (x - 30 + 6, y - 30 + 14)); c.alpha_composite(lay, (x - 30, y - 30)); return w

def card(c, im, x, y, w, h, rot=0, r=18, border=6):
    im = fit(im, w, h).convert("RGBA"); m = Image.new("L", (w, h), 0); ImageDraw.Draw(m).rounded_rectangle((0, 0, w - 1, h - 1), r, fill=255)
    lay = Image.new("RGBA", (w + 2 * border, h + 2 * border), (0, 0, 0, 0))
    ImageDraw.Draw(lay).rounded_rectangle((0, 0, w + 2 * border - 1, h + 2 * border - 1), r + border, fill=(255, 255, 255, 255))
    lay.paste(im, (border, border), m); lay = lay.rotate(-rot, Image.BICUBIC, expand=True)
    sh = Image.new("RGBA", lay.size, (0, 0, 0, 0)); sh.putalpha(lay.getchannel("A").point(lambda a: a * .6)); sh = sh.filter(ImageFilter.GaussianBlur(20))
    c.alpha_composite(sh, (x + 8, y + 22)); c.alpha_composite(lay, (x, y))

def badge_mail(c, x, y, s="Mail gönderildi", size=34):
    f = IT8(size); bb = f.getbbox(s); w = bb[2] + 110; h = size + 40
    lay = Image.new("RGBA", (w + 60, h + 60), (0, 0, 0, 0)); d = ImageDraw.Draw(lay)
    d.rounded_rectangle((30, 30, 30 + w, 30 + h), h // 2, fill=(255, 255, 255, 255))
    cx, cy, r = 30 + h // 2 + 4, 30 + h // 2, h // 2 - 9; d.ellipse((cx - r, cy - r, cx + r, cy + r), fill=GREEN + (255,))
    d.line([(cx - r * .45, cy + r * .02), (cx - r * .1, cy + r * .38), (cx + r * .5, cy - r * .35)], fill=(255, 255, 255), width=7, joint="curve")
    d.text((30 + h + 14, 30 + (h - size) // 2 - bb[1] + 2), s, font=f, fill=INK)
    lay = lay.rotate(4, Image.BICUBIC, expand=True)
    sh = Image.new("RGBA", lay.size, (0, 0, 0, 0)); sh.putalpha(lay.getchannel("A").point(lambda a: a * .5)); sh = sh.filter(ImageFilter.GaussianBlur(14))
    c.alpha_composite(sh, (x + 6, y + 14)); c.alpha_composite(lay, (x, y))

def avatar_panel(c, src, x0, feather=150):
    a = Image.open(src).convert("RGB"); w = W - x0
    a = fit(a.crop((520, 0, 1400, 1080)), w, H, cx=.5, cy=0)
    a = ImageEnhance.Contrast(a).enhance(1.06)
    m = Image.new("L", (w, H), 255); d = ImageDraw.Draw(m)
    for i in range(feather): d.line([(i, 0), (i, H)], fill=int(255 * (i / feather) ** 1.6))
    c.paste(a, (x0, 0), m)

def leftshade(c, a=.8, end=.65, col=(8, 6, 14)):
    lay = Image.new("RGBA", (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(lay); e = int(W * end)
    for x in range(e): d.line([(x, 0), (x, H)], fill=col + (int(255 * a * (1 - x / e) ** 1.3),))
    c.alpha_composite(lay)

def glow(c, cx, cy, r, col, a=.5):
    lay = Image.new("RGBA", (W, H), (0, 0, 0, 0)); ImageDraw.Draw(lay).ellipse((cx - r, cy - r, cx + r, cy + r), fill=col + (int(255 * a),))
    c.alpha_composite(lay.filter(ImageFilter.GaussianBlur(r * .45)))

AV = f"{S}/a12_10.png"
VIT = Image.open(f"{S}/h_19.png").convert("RGB").crop((610, 250, 1830, 936))      # pembe vitrin, tarayıcı + üst menü kesik
VIT2 = Image.open(f"{S}/h_21.png").convert("RGB").crop((610, 200, 1830, 886))     # papatya, sprey
ESKI = Image.open(f"{S}/eski.png").convert("RGB")
ex = ESKI.crop((0, 0, ESKI.width, 120)).filter(ImageFilter.GaussianBlur(14)); ESKI.paste(ex, (0, 0))  # üst menü + logo bulanık

def save(c, name):
    c.convert("RGB").save(f"{D}/{name}", quality=93); print(name)

# T1: BEN HİÇ YAPMADIM
c = Image.new("RGBA", (W, H), (20, 12, 22, 255))
c.paste(fit(VIT, W, H).filter(ImageFilter.GaussianBlur(18)), (0, 0)); c.alpha_composite(Image.new("RGBA", (W, H), (10, 6, 14, 150)))
glow(c, 380, 520, 330, (230, 90, 140), .45)
avatar_panel(c, AV, 760)
card(c, VIT, 34, 352, 600, 338, rot=-3)
shadow_text(c, (40, 6), "BEN", ANTON(170))
tag(c, 300, 30, "HİÇ", 150)
shadow_text(c, (40, 176), "YAPMADIM", ANTON(150))
badge_mail(c, 430, 590)
save(c, "BS_T1_ben_hic_yapmadim.jpg")

# T2: MÜŞTERİYİ O BULDU
c = Image.new("RGBA", (W, H), (0, 0, 0, 255))
c.paste(fit(Image.open(f"{OT}/ofis_musteri_masa.jpg").convert("RGB"), W, H, cx=.25, cy=.4), (0, 0))
leftshade(c, .85, .62)
avatar_panel(c, AV, 790)
shadow_text(c, (40, 150), "MÜŞTERİYİ", ANTON(150))
tag(c, 46, 360, "O BULDU", 140)
tag(c, 50, 580, "YAPAY ZEKÂ", 56, bg=(255, 255, 255), fg=INK, rot=2)
save(c, "BS_T2_musteriyi_o_buldu.jpg")

# T3: ESKİ SİTE → 3D
c = Image.new("RGBA", (W, H), (18, 14, 24, 255))
glow(c, 930, 420, 380, (230, 90, 140), .5); glow(c, 300, 460, 300, (120, 120, 140), .25)
e = ImageEnhance.Brightness(ImageEnhance.Color(ESKI).enhance(.25)).enhance(.75)
card(c, e, 30, 230, 460, 270, rot=-4)
card(c, VIT2, 630, 180, 600, 338, rot=3)
tag(c, 50, 214, "ESKİ", 70, bg=(90, 90, 100), rot=-6)
tag(c, 1090, 150, "3D", 110, rot=6)
d = ImageDraw.Draw(c); d.polygon([(510, 345), (575, 345), (575, 315), (635, 370), (575, 425), (575, 395), (510, 395)], fill=ORANGE + (255,), outline=(0, 0, 0), width=3)
shadow_text(c, (40, 0), "AYNI ÜRÜN", ANTON(140))
# sol altta yuvarlak avatar
a = fit(Image.open(AV).convert("RGB").crop((620, 40, 1300, 720)), 230, 230); m = Image.new("L", (230, 230), 0); ImageDraw.Draw(m).ellipse((0, 0, 229, 229), fill=255)
ring = Image.new("RGBA", (246, 246), (0, 0, 0, 0)); ImageDraw.Draw(ring).ellipse((0, 0, 245, 245), fill=(255, 255, 255, 255)); ring.paste(a, (8, 8), m)
c.alpha_composite(ring, (40, 466))
shadow_text(c, (330, 575), "BAMBAŞKA SİTE", ANTON(90), col=(255, 210, 160))
save(c, "BS_T3_ayni_urun_3d.jpg")
