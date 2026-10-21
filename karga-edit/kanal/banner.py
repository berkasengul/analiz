"""Karga Zihni - YouTube banner (2560x1440, safe area 1546x423 centred)."""
import sys, math, random
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageChops

S = sys.argv[1]
OUT = f"{S}/banner"
POSE = f"{S}/poses/karga-pozlari-v1"
FD = f"{S}/fonts"
W, H = 2560, 1440
SX0, SY0, SX1, SY1 = (W - 1546) // 2, (H - 423) // 2, (W + 1546) // 2, (H + 423) // 2
ORANGE = (255, 122, 36); GOLD = (255, 190, 110); CREAM = (250, 243, 228)
rnd = random.Random(7)

def F(name, size, wght=None):
    f = ImageFont.truetype(f"{FD}/{name}", size)
    if wght:
        try: f.set_variation_by_axes([wght])
        except Exception: pass
    return f

# ---------- background ----------
yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
d = np.sqrt(((xx - W * 0.5) / (W * 0.55)) ** 2 + ((yy - H * 0.5) / (H * 0.42)) ** 2)
d = np.clip(d, 0, 1) ** 1.3
bg = np.array((26, 31, 54), np.float32) * (1 - d[..., None]) + np.array((5, 6, 12), np.float32) * d[..., None]
# warm glow behind the title
g = np.exp(-(((xx - 1420) / 620) ** 2 + ((yy - 720) / 260) ** 2))
bg += g[..., None] * np.array((70, 30, 8), np.float32)
grain = np.random.default_rng(3).normal(0, 3.2, (H, W, 1)).astype(np.float32)
c = Image.fromarray(np.clip(bg + grain, 0, 255).astype(np.uint8)).convert("RGBA")

def glow_layer(draw_fn, blur=(14, 4), strength=(1.4, 1.0)):
    lay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw_fn(ImageDraw.Draw(lay))
    out = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    for r, k in zip(blur, strength):
        gl = lay.filter(ImageFilter.GaussianBlur(r))
        gl.putalpha(gl.getchannel("A").point(lambda v, k=k: min(255, int(v * k))))
        out.alpha_composite(gl)
    out.alpha_composite(lay)
    return out

# ---------- perspective grid floor ----------
def grid(dr):
    hy = 905  # horizon
    for i in range(-30, 31):
        x_b = W / 2 + i * 150
        dr.line([(W / 2 + i * 14, hy), (x_b, H + 200)], fill=(255, 122, 36, 38), width=2)
    z = 1.0
    while z < 40:
        y = hy + 520 / z
        if y > H: z *= 1.25; continue
        a = int(min(55, 12 + 400 / (z * 6)))
        dr.line([(0, y), (W, y)], fill=(255, 122, 36, a), width=2)
        z *= 1.25
c.alpha_composite(glow_layer(grid, blur=(6,), strength=(1.0,)))
# fade the grid into the horizon
fade = Image.new("RGBA", (W, H), (0, 0, 0, 0))
fa = (np.clip((905 + 60 - np.arange(H)) / 60, 0, 1) * 0).astype(np.uint8)

# ---------- wireframe 3D shapes ----------
def project(pts, cx, cy, s, rx, ry):
    out = []
    for x, y, z in pts:
        x, z = x * math.cos(ry) + z * math.sin(ry), -x * math.sin(ry) + z * math.cos(ry)
        y, z = y * math.cos(rx) - z * math.sin(rx), y * math.sin(rx) + z * math.cos(rx)
        p = 4 / (4 + z)
        out.append((cx + x * s * p, cy + y * s * p))
    return out

CUBE_V = [(x, y, z) for x in (-1, 1) for y in (-1, 1) for z in (-1, 1)]
CUBE_E = [(a, b) for a in range(8) for b in range(a + 1, 8) if sum(CUBE_V[a][k] != CUBE_V[b][k] for k in range(3)) == 1]
t = (1 + 5 ** .5) / 2
ICO_V = [(-1, t, 0), (1, t, 0), (-1, -t, 0), (1, -t, 0), (0, -1, t), (0, 1, t), (0, -1, -t), (0, 1, -t), (t, 0, -1), (t, 0, 1), (-t, 0, -1), (-t, 0, 1)]
ICO_V = [(x / 1.9, y / 1.9, z / 1.9) for x, y, z in ICO_V]
ICO_E = [(a, b) for a in range(12) for b in range(a + 1, 12) if abs(math.dist(ICO_V[a], ICO_V[b]) - 2 / 1.9) < 1e-3]

def shapes(dr):
    for cx, cy, s, rx, ry, V, E, col, wd in [
        (380, 560, 120, 0.5, 0.6, CUBE_V, CUBE_E, GOLD + (190,), 3),
        (2400, 300, 90, 0.3, 0.4, ICO_V, ICO_E, GOLD + (170,), 3),
        (2420, 860, 58, 0.7, 1.1, CUBE_V, CUBE_E, ORANGE + (150,), 2),
        (150, 860, 48, 0.4, 0.2, ICO_V, ICO_E, ORANGE + (140,), 2),
    ]:
        P = project(V, cx, cy, s, rx, ry)
        for a, b in E:
            dr.line([P[a], P[b]], fill=col, width=wd)
        for p in P:
            dr.ellipse((p[0] - 4, p[1] - 4, p[0] + 4, p[1] + 4), fill=CREAM + (220,))
c.alpha_composite(glow_layer(shapes))

# ---------- floating UI line-art (browser windows, code, cursor) ----------
def ui(dr):
    def browser(x, y, w, h, a):
        dr.rounded_rectangle((x, y, x + w, y + h), 14, outline=CREAM + (a,), width=3)
        dr.line([(x, y + 34), (x + w, y + 34)], fill=CREAM + (a,), width=3)
        for i in range(3): dr.ellipse((x + 16 + i * 22, y + 11, x + 28 + i * 22, y + 23), outline=CREAM + (a,), width=2)
        dr.rectangle((x + 20, y + 54, x + w * .45, y + h - 20), outline=ORANGE + (a,), width=2)
        for k in range(4):
            yy_ = y + 60 + k * 26
            if yy_ < y + h - 24: dr.line([(x + w * .52, yy_), (x + w - 22 - k * 18, yy_)], fill=CREAM + (int(a * .7),), width=3)
    browser(230, 300, 330, 210, 120)
    browser(1960, 1000, 300, 190, 100)
    f = F("Montserrat.ttf", 64, 800)
    dr.text((560, 980), "</>", font=f, fill=ORANGE + (170,))
    dr.text((1900, 300), "{ }", font=f, fill=ORANGE + (150,))
    # cursor
    cx, cy = 2330, 420
    pts = [(0, 0), (0, 62), (16, 48), (28, 74), (38, 69), (26, 44), (46, 44)]
    dr.polygon([(cx + x, cy + y) for x, y in pts], outline=CREAM + (200,), fill=(0, 0, 0, 0))
    dr.line([(cx + x, cy + y) for x, y in pts + [pts[0]]], fill=CREAM + (200,), width=3)
    for ang in (-150, -110, -70):
        r0, r1 = 22, 46
        a = math.radians(ang)
        dr.line([(cx + r0 * math.cos(a), cy + r0 * math.sin(a)), (cx + r1 * math.cos(a), cy + r1 * math.sin(a))], fill=ORANGE + (220,), width=5)
    # sparkle dots
    for _ in range(70):
        x, y = rnd.randint(0, W), rnd.randint(380, 1060)
        if SX0 - 40 < x < SX1 + 40 and SY0 - 30 < y < SY1 + 30: continue
        r = rnd.choice((2, 2, 3, 4))
        dr.ellipse((x - r, y - r, x + r, y + r), fill=GOLD + (rnd.randint(60, 170),))
c.alpha_composite(glow_layer(ui, blur=(10, 3), strength=(1.1, 0.8)))

# ---------- crow (full colour, rim lit) ----------
def crow(name, h):
    im = Image.open(f"{POSE}/{name}").convert("RGBA"); im = im.crop(im.getbbox())
    im = im.resize((int(im.width * h / im.height), h), Image.LANCZOS)
    pad = 60
    a = Image.new("L", (im.width + pad * 2, im.height + pad * 2), 0); a.paste(im.getchannel("A"), (pad, pad))
    base = Image.new("RGBA", a.size, (0, 0, 0, 0))
    for r, k in ((26, 1.3), (8, 1.4)):
        gl = Image.new("RGBA", a.size, ORANGE + (0,)); gl.putalpha(a.filter(ImageFilter.GaussianBlur(r)).point(lambda v, k=k: min(255, int(v * k)))); base.alpha_composite(gl)
    base.alpha_composite(im, (pad, pad))
    return base, pad

cr, cp = crow("06-bilgisayarda.png", 390)
# soft floor shadow
sh = Image.new("RGBA", (420, 80), (0, 0, 0, 0)); ImageDraw.Draw(sh).ellipse((20, 20, 400, 60), fill=(0, 0, 0, 150))
c.alpha_composite(sh.filter(ImageFilter.GaussianBlur(14)), (int(705 - 210), SY1 - 52))
c.alpha_composite(cr, (int(705 - cr.width / 2), SY1 - cr.height + cp + 8))

# line-art 'signature' crow on the far right (desktop/TV only)
def lineart(name, h):
    im = Image.open(f"{POSE}/{name}").convert("RGBA"); im = im.crop(im.getbbox())
    im = im.resize((int(im.width * h / im.height), h), Image.LANCZOS)
    arr = np.asarray(im, np.float32)
    lum = arr[..., :3] @ np.array([.3, .59, .11], np.float32)
    m = ((arr[..., 3] > 140) & (lum < 26)).astype(np.uint8) * 255
    a8 = Image.fromarray((arr[..., 3] > 128).astype(np.uint8) * 255)
    edge = ImageChops.subtract(a8.filter(ImageFilter.MaxFilter(5)), a8)
    m = ImageChops.lighter(Image.fromarray(m), edge)
    lay = Image.new("RGBA", im.size, GOLD + (0,)); lay.putalpha(m.point(lambda v: int(v * .55)))
    out = Image.new("RGBA", im.size, (0, 0, 0, 0))
    gl = lay.filter(ImageFilter.GaussianBlur(5)); out.alpha_composite(gl); out.alpha_composite(lay)
    return out
la = lineart("03-dusunen.png", 360)
c.alpha_composite(la, (W - la.width - 90, SY1 - la.height + 10))

# ---------- typography ----------
def text_img(txt, fnt, fill, glow=None, shadow=True, track=0):
    dd = ImageDraw.Draw(Image.new("RGBA", (1, 1)))
    l, t, r, b = dd.textbbox((0, 0), txt, font=fnt)
    extra = track * (len(txt) - 1)
    pad = 70
    im = Image.new("RGBA", (r - l + extra + pad * 2, b - t + pad * 2), (0, 0, 0, 0))
    dr = ImageDraw.Draw(im)
    x = pad - l
    if track:
        for ch in txt: dr.text((x, pad - t), ch, font=fnt, fill=fill); x += fnt.getlength(ch) + track
    else:
        dr.text((x, pad - t), txt, font=fnt, fill=fill)
    out = Image.new("RGBA", im.size, (0, 0, 0, 0))
    if shadow:
        s = Image.new("RGBA", im.size, (0, 0, 0, 0)); s.putalpha(im.getchannel("A").filter(ImageFilter.GaussianBlur(10)).point(lambda v: int(v * .7)))
        out.alpha_composite(s, (6, 12))
    if glow:
        for rr, k in ((30, 1.2), (9, 1.0)):
            gl = Image.new("RGBA", im.size, glow + (0,)); gl.putalpha(im.getchannel("A").filter(ImageFilter.GaussianBlur(rr)).point(lambda v, k=k: min(255, int(v * k)))); out.alpha_composite(gl)
    out.alpha_composite(im)
    return out, pad, r - l + extra

TX = 905
MAXW = SX1 - 30 - TX
size = 200
while True:
    fL = F("LuckiestGuy.ttf", size)
    if fL.getlength("KARGA") + 36 + fL.getlength("ZİHNİ") <= MAXW: break
    size -= 4
k1, p1, w1 = text_img("KARGA", fL, CREAM)
k2, p2, w2 = text_img("ZİHNİ", fL, ORANGE, glow=(255, 100, 20))
print("title size", size)
ty = SY0 + 22
c.alpha_composite(k1, (TX - p1, ty - p1 + 10))
c.alpha_composite(k2, (TX + w1 + 36 - p2, ty - p2 + 10))
total_w = w1 + 40 + w2
fT = F("PlayfairItalic.ttf", 74, 500)
tag, pt, wt = text_img("kuşlar seni bekliyor,", fT, CREAM)
c.alpha_composite(tag, (TX + 6 - pt, ty + 202 - pt))
fT2 = F("PlayfairItalic.ttf", 74, 700)
tg2, pt2, wt2 = text_img("uç.", fT2, ORANGE, glow=(255, 100, 20))
dy = fT2.getbbox("uç.")[1] - fT.getbbox("kuşlar seni bekliyor,")[1]
c.alpha_composite(tg2, (TX + 6 + wt + 22 - pt2, ty + 202 + dy - pt2))
print("tagline ends at", TX + 6 + wt + 24 + wt2, "safe edge", SX1)
# accent line
ImageDraw.Draw(c).rounded_rectangle((TX + 8, ty + 312, TX + 140, ty + 318), 3, fill=ORANGE + (255,))
cs = 30
while True:
    chips, pc, wc = text_img("3D WEB SİTELERİ  •  YAPAY ZEKÂ  •  UYGULAMALAR", F("Montserrat.ttf", cs, 700), (220, 214, 202), shadow=False, track=2)
    if TX + 165 + wc <= SX1 - 30: break
    cs -= 1
print("chips size", cs)
c.alpha_composite(chips, (TX + 165 - pc, ty + 297 - pc))

# vignette
v = np.clip(1 - 0.45 * np.clip(np.sqrt(((xx - W / 2) / (W * .62)) ** 2 + ((yy - H / 2) / (H * .62)) ** 2) - .45, 0, 1) ** 1.3, 0, 1)[..., None]
final = Image.fromarray((np.asarray(c.convert("RGB"), np.float32) * v).astype(np.uint8))
final.save(f"{OUT}/karga_zihni_banner_2560x1440.jpg", quality=93, optimize=True)
final.save(f"{OUT}/karga_zihni_banner_2560x1440.png", optimize=True)

# previews: desktop (2560x423 band), mobile (safe area), TV (full) with guides
desk = final.crop((0, SY0, W, SY1))
mob = final.crop((SX0, SY0, SX1, SY1))
tv = final.copy(); dd = ImageDraw.Draw(tv)
dd.rectangle((SX0, SY0, SX1, SY1), outline=(0, 255, 120), width=4)
dd.rectangle((0, SY0, W, SY1), outline=(80, 160, 255), width=3)
pv = Image.new("RGB", (1280, 720 + 212 + 210 + 60), (20, 20, 20))
pv.paste(tv.resize((1280, 720)), (0, 0))
pv.paste(desk.resize((1280, 212)), (0, 740))
pv.paste(mob.resize((773, 212)), (0, 972))
pv.save(f"{OUT}/preview.jpg", quality=88)
print("ok")
