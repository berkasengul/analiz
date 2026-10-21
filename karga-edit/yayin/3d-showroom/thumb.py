"""Karga Zihni - 3D Showroom thumbnail'leri (1280x720)."""
import sys, math
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageEnhance, ImageChops

S = sys.argv[1]
D = f"{S}/thumb"
POSE = f"{S}/poses/karga-pozlari-v1"
FD = f"{S}/fonts"
W, H = 1280, 720
ORANGE = (255, 110, 28)
NAVY = (14, 18, 34)
CREAM = (250, 244, 232)

def font(name, size): return ImageFont.truetype(f"{FD}/{name}", size)
LG = lambda s: font("LuckiestGuy.ttf", s)

def fill_crop(im, cx_frac=0.5, cy_frac=0.5, w=W, h=H):
    r = max(w / im.width, h / im.height)
    im = im.resize((int(im.width * r + 1), int(im.height * r + 1)), Image.LANCZOS)
    x = int((im.width - w) * cx_frac); y = int((im.height - h) * cy_frac)
    return im.crop((x, y, x + w, y + h))

def grade(im, sat=1.25, con=1.12, bri=1.0):
    im = ImageEnhance.Color(im).enhance(sat)
    im = ImageEnhance.Contrast(im).enhance(con)
    return ImageEnhance.Brightness(im).enhance(bri)

def vignette(im, k=0.55):
    yy, xx = np.mgrid[0:im.height, 0:im.width].astype(np.float32)
    d = np.sqrt(((xx - im.width / 2) / (im.width * .6)) ** 2 + ((yy - im.height / 2) / (im.height * .6)) ** 2)
    v = np.clip(1 - k * np.clip(d - 0.5, 0, 1) ** 1.2, 0, 1)[..., None]
    a = np.asarray(im.convert("RGB"), np.float32) * v
    return Image.fromarray(a.astype(np.uint8)).convert("RGBA")

def crow(name, h, glow=ORANGE, flip=False, glow_r=18, glow_k=1.8):
    im = Image.open(f"{POSE}/{name}").convert("RGBA"); im = im.crop(im.getbbox())
    im = im.resize((int(im.width * h / im.height), h), Image.LANCZOS)
    if flip: im = im.transpose(Image.FLIP_LEFT_RIGHT)
    pad = glow_r * 3
    a = Image.new("L", (im.width + pad * 2, im.height + pad * 2), 0); a.paste(im.getchannel("A"), (pad, pad))
    # solid white sticker outline + orange glow: reads at tiny sizes
    out = a.filter(ImageFilter.MaxFilter(9))
    g = a.filter(ImageFilter.GaussianBlur(glow_r)).point(lambda v: int(min(255, v * glow_k)))
    base = Image.new("RGBA", a.size, (0, 0, 0, 0))
    gl = Image.new("RGBA", a.size, glow + (0,)); gl.putalpha(g); base.alpha_composite(gl)
    st = Image.new("RGBA", a.size, (255, 255, 255, 0)); st.putalpha(out); base.alpha_composite(st)
    base.alpha_composite(im, (pad, pad))
    return base, pad

def text(txt, size, fill, stroke=10, stroke_fill=NAVY, shadow=10, rot=0, glow=None):
    f = LG(size)
    d = ImageDraw.Draw(Image.new("RGBA", (1, 1)))
    l, t, r, b = d.textbbox((0, 0), txt, font=f, stroke_width=stroke)
    pad = 60
    im = Image.new("RGBA", (r - l + pad * 2, b - t + pad * 2), (0, 0, 0, 0))
    dr = ImageDraw.Draw(im)
    if shadow:
        dr.text((pad - l + shadow * .6, pad - t + shadow), txt, font=f, fill=(0, 0, 0, 200), stroke_width=stroke, stroke_fill=(0, 0, 0, 200))
        im = im.filter(ImageFilter.GaussianBlur(3)); dr = ImageDraw.Draw(im)
    if glow:
        gl = Image.new("RGBA", im.size, (0, 0, 0, 0))
        ImageDraw.Draw(gl).text((pad - l, pad - t), txt, font=f, fill=glow, stroke_width=stroke + 6, stroke_fill=glow)
        im.alpha_composite(gl.filter(ImageFilter.GaussianBlur(16)))
    dr = ImageDraw.Draw(im)
    dr.text((pad - l, pad - t), txt, font=f, fill=fill, stroke_width=stroke, stroke_fill=stroke_fill)
    if rot: im = im.rotate(rot, Image.BICUBIC, expand=True)
    return im

def paste_c(c, im, cx, cy): c.alpha_composite(im, (int(cx - im.width / 2), int(cy - im.height / 2)))
def paste_l(c, im, x, cy, pad=60): c.alpha_composite(im, (int(x - pad), int(cy - im.height / 2)))

def browser(img, w, url="mtgmotors.netlify.app"):
    bar = int(w * 0.045)
    h = int(img.height * w / img.width) + bar
    body = Image.new("RGBA", (w, h), (28, 30, 36, 255))
    body.paste(img.resize((w, h - bar), Image.LANCZOS), (0, bar))
    d = ImageDraw.Draw(body)
    r = bar * 0.22
    for i, col in enumerate([(255, 95, 87), (254, 188, 46), (40, 200, 64)]):
        cx = bar * 0.6 + i * bar * 0.55; d.ellipse((cx - r, bar / 2 - r, cx + r, bar / 2 + r), fill=col)
    d.rounded_rectangle((w * 0.3, bar * 0.2, w * 0.7, bar * 0.8), bar * 0.3, fill=(50, 53, 62))
    f = font("Montserrat.ttf", int(bar * 0.42))
    try: f.set_variation_by_axes([600])
    except Exception: pass
    d.text((w / 2, bar / 2), url, font=f, fill=(215, 218, 225), anchor="mm")
    m = Image.new("L", (w * 2, h * 2), 0); ImageDraw.Draw(m).rounded_rectangle((0, 0, w * 2 - 1, h * 2 - 1), 28, fill=255)
    body.putalpha(m.resize((w, h), Image.LANCZOS))
    # white frame for pop
    fr = Image.new("RGBA", (w + 16, h + 16), (0, 0, 0, 0))
    ImageDraw.Draw(fr).rounded_rectangle((0, 0, w + 15, h + 15), 20, fill=(255, 255, 255, 255))
    fr.alpha_composite(body, (8, 8))
    return fr

def drop_shadow(im, r=24, off=(0, 18), a=170):
    pad = r * 3
    s = Image.new("RGBA", (im.width + pad * 2, im.height + pad * 2), (0, 0, 0, 0))
    m = Image.new("L", s.size, 0); m.paste(im.getchannel("A"), (pad, pad))
    sh = Image.new("RGBA", s.size, (0, 0, 0, 0)); sh.putalpha(m.filter(ImageFilter.GaussianBlur(r)).point(lambda v: int(v * a / 255)))
    s.alpha_composite(sh, off); s.alpha_composite(im, (pad, pad))
    return s, pad

def dark_bg():
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    d = np.clip(np.sqrt(((xx / W - .62) * 1.5) ** 2 + ((yy / H - .5) * 1.1) ** 2) / .9, 0, 1)
    a = np.array((40, 30, 40), np.float32) * (1 - d[..., None]) + np.array((6, 7, 12), np.float32) * d[..., None]
    return Image.fromarray(a.astype(np.uint8)).convert("RGBA")

def orange_glow(c, cx, cy, rx, ry, a=150):
    g = Image.new("RGBA", (W // 4, H // 4), (0, 0, 0, 0))
    ImageDraw.Draw(g).ellipse(((cx - rx) / 4, (cy - ry) / 4, (cx + rx) / 4, (cy + ry) / 4), fill=ORANGE + (a,))
    c.alpha_composite(g.filter(ImageFilter.GaussianBlur(18)).resize((W, H), Image.BILINEAR))

HERO = Image.open(f"{D}/f_273.png").convert("RGB")      # BMW front, MTG Motors wall
HERO2 = Image.open(f"{D}/f_1.png").convert("RGB")       # BMW + info panel
MERC = Image.open(f"{D}/f_16.png").convert("RGB")       # grey Mercedes, Garden Motors

# ---------- V1: "BU BİR WEB SİTESİ!" ----------
def v1():
    c = dark_bg()
    orange_glow(c, 820, 420, 520, 300, 130)
    shot = grade(HERO.crop((300, 0, 1920, 822)), 1.3, 1.15, 1.08)
    br = browser(shot, 820).rotate(-3, Image.BICUBIC, expand=True)
    br, p = drop_shadow(br)
    c.alpha_composite(br, (int(860 - br.width / 2 + 30), int(455 - br.height / 2)))
    cr, cp = crow("02-isaret-eden.png", 520)
    c.alpha_composite(cr, (-40 - cp + 20, H - cr.height + cp + 40))
    t1 = text("BU BİR", 112, CREAM, rot=-3)
    t2 = text("WEB SİTESİ!", 132, ORANGE, stroke=12, rot=-3, glow=(255, 90, 0, 140))
    paste_l(c, t1, 470, 92)
    paste_l(c, t2, 420, 212)
    return vignette(c, 0.35)

# ---------- V2: ÖNCE / SONRA ----------
def place_h(img, box, h, cx):
    """crop box from img, scale to height h, return layer with its centre at cx."""
    im = img.crop(box); r = h / im.height
    im = im.resize((int(im.width * r), h), Image.LANCZOS)
    lay = Image.new("RGB", (W, H), (8, 9, 14)); lay.paste(im, (int(cx - im.width / 2), 0)); return lay
SIDE = Image.open(f"{D}/f_265.png").convert("RGB")
GLASS = Image.open(f"{D}/f_230.png").convert("RGB")
def v2():
    c = Image.new("RGBA", (W, H), (8, 9, 14, 255))
    left = grade(place_h(MERC, (520, 40, 1560, 738), H, 300), 0.2, 0.95, 0.7)
    right = grade(place_h(SIDE, (300, 40, 1500, 738), H, 900), 1.35, 1.15, 1.08)
    m = Image.new("L", (W, H), 0)
    ImageDraw.Draw(m).polygon([(640, 0), (W, 0), (W, H), (500, H)], fill=255)
    c.paste(left.convert("RGBA"), (0, 0))
    c.paste(right.convert("RGBA"), (0, 0), m)
    ln = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    ImageDraw.Draw(ln).line([(640, 0), (500, H)], fill=(255, 255, 255, 255), width=10)
    gl = Image.new("RGBA", (W, H), (0, 0, 0, 0)); ImageDraw.Draw(gl).line([(640, 0), (500, H)], fill=ORANGE + (255,), width=30)
    c.alpha_composite(gl.filter(ImageFilter.GaussianBlur(14))); c.alpha_composite(ln)
    t_on = text("ÖNCE", 74, CREAM, stroke=8, rot=4); paste_l(c, t_on, 40, 645)
    t_so = text("SONRA", 82, ORANGE, stroke=9, rot=-4, glow=(255, 90, 0, 120)); paste_l(c, t_so, 990, 645)
    cr, cp = crow("04-sasiran.png", 400)
    c.alpha_composite(cr, (int(560 - cr.width / 2), H - cr.height + cp + 40))
    t1 = text("3D SHOWROOM", 108, CREAM, rot=-2)
    paste_c(c, t1, 640, 88)
    t2 = text("YAPAY ZEKAYLA", 62, ORANGE, stroke=8, rot=-2, glow=(255, 90, 0, 120))
    paste_c(c, t2, 700, 188)
    return vignette(c, 0.3)

# ---------- V3: OYUN DEĞİL ----------
def v3():
    shot = grade(place_h(GLASS, (0, 30, 1700, 738), H, 760), 1.3, 1.2, 1.05)
    c = shot.convert("RGBA")
    a = (np.clip(1 - np.arange(W) / (W * 0.55), 0, 1) ** 1.1 * 230).astype(np.uint8)
    g = Image.new("RGBA", (W, H), (6, 7, 12, 0)); g.putalpha(Image.fromarray(np.repeat(a[None, :], H, 0))); c.alpha_composite(g)
    orange_glow(c, 900, 470, 380, 160, 70)
    c.alpha_composite(grade(place_h(GLASS, (0, 30, 1700, 738), H, 760), 1.3, 1.2, 1.05).convert("RGBA").crop((560, 0, W, H)).point(lambda v: v) if False else Image.new("RGBA", (1, 1)), (0, 0))
    t1 = text("OYUN", 150, CREAM, rot=-4)
    t2 = text("DEĞİL!", 150, ORANGE, stroke=12, rot=-4, glow=(255, 90, 0, 140))
    paste_l(c, t1, 50, 140); paste_l(c, t2, 40, 290)
    t3 = text("BU BİR WEB SİTESİ", 54, CREAM, stroke=7, rot=-4)
    paste_l(c, t3, 60, 420)
    cr, cp = crow("04-sasiran.png", 360, flip=True)
    c.alpha_composite(cr, (int(1150 - cr.width / 2), H - cr.height + cp + 50))
    return vignette(c, 0.4)

for name, fn in (("thumb_A_bu_bir_web_sitesi", v1), ("thumb_B_once_sonra", v2), ("thumb_C_oyun_degil", v3)):
    im = fn().convert("RGB")
    im.save(f"{D}/{name}.jpg", quality=92, optimize=True)
    im.resize((320, 180), Image.LANCZOS).save(f"{D}/{name}_small.jpg", quality=90)
print("ok")
