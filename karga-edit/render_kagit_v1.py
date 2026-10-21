"""Karga Zihni - stil ornegi (demo) render.
Kullanim: python3 -I render.py <scratchpad_dir>
Cikti: <scratchpad>/demo/out/karga_stil_ornegi.mp4
"""
import sys, math, random, subprocess, os, wave
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageChops

S = sys.argv[1]
POSE = f"{S}/poses/karga-pozlari-v1"
FONT = f"{S}/fonts"
OUT = f"{S}/demo/out"
os.makedirs(OUT, exist_ok=True)

W, H, FPS = 1920, 1080, 30
DUR = 15.0
N = int(DUR * FPS)

NAVY = (24, 32, 56)
ORANGE = (240, 92, 30)
CREAM = (244, 238, 225)

# ---------- helpers ----------
def clamp(x, a=0.0, b=1.0): return max(a, min(b, x))
def prog(t, a, b): return clamp((t - a) / (b - a))
def ease_out_cubic(x): return 1 - (1 - x) ** 3
def ease_in_out(x): return 4 * x ** 3 if x < .5 else 1 - (-2 * x + 2) ** 3 / 2
def ease_out_back(x, s=1.9):
    x -= 1
    return 1 + (s + 1) * x ** 3 + s * x ** 2

def font(name, size): return ImageFont.truetype(f"{FONT}/{name}", size)
def fontv(name, size, wght):
    f = ImageFont.truetype(f"{FONT}/{name}", size)
    try: f.set_variation_by_axes([wght])
    except Exception: pass
    return f

rng = np.random.default_rng(7)

# ---------- paper background ----------
def make_paper():
    base = np.ones((H, W, 3), np.float32) * np.array(CREAM, np.float32)
    low = rng.normal(0, 1, (H // 60 + 2, W // 60 + 2)).astype(np.float32)
    low = np.array(Image.fromarray(((low - low.min()) / np.ptp(low) * 255).astype(np.uint8)).resize((W, H), Image.BICUBIC), np.float32) / 255 - .5
    fib = rng.normal(0, 1, (H, W)).astype(np.float32)
    fib = np.array(Image.fromarray(((fib - fib.min()) / np.ptp(fib) * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.7)), np.float32) / 255 - .5
    base += (low * 10 + fib * 9)[..., None]
    yy, xx = np.mgrid[0:H, 0:W]
    d = np.sqrt(((xx - W / 2) / (W / 2)) ** 2 + ((yy - H / 2) / (H / 2)) ** 2)
    base *= (1 - 0.10 * np.clip(d - 0.55, 0, 1) ** 1.5)[..., None]
    return Image.fromarray(np.clip(base, 0, 255).astype(np.uint8))

PAPER = make_paper()
GRAIN = []
for i in range(4):
    g = rng.normal(128, 9, (H // 2, W // 2)).astype(np.uint8)
    GRAIN.append(Image.fromarray(g).resize((W, H), Image.NEAREST).convert("RGB"))

def add_grain(img, f):
    g = GRAIN[(f // 2) % 4]
    return ImageChops.overlay(img, g) if False else Image.blend(img, ImageChops.soft_light(img, g), 0.55)

# ---------- crow with 'boil' (hand-drawn on twos feel) ----------
def load_crow(name, height):
    im = Image.open(f"{POSE}/{name}").convert("RGBA")
    im = im.crop(im.getbbox())
    r = height / im.height
    return im.resize((int(im.width * r), height), Image.LANCZOS)

CROWS = {
    "isaret": load_crow("02-isaret-eden.png", 640),
    "anlatan": load_crow("01-anlatan.png", 330),
    "pc": load_crow("06-bilgisayarda.png", 520),
    "sasiran": load_crow("04-sasiran.png", 600),
}
BOIL = [(0, 0, 0.0), (2, -1, 0.5), (-1, 2, -0.4), (1, 1, 0.25)]

def paste_crow(canvas, key, cx, by, t, f, appear_t, scale=1.0, flip=False, shadow=True):
    """cx = horizontal center, by = feet baseline."""
    p = prog(t, appear_t, appear_t + 0.45)
    if p <= 0: return
    s = scale * (0.6 + 0.4 * ease_out_back(p))
    breathe = 1 + 0.008 * math.sin(t * 2.6)
    im = CROWS[key]
    if flip: im = im.transpose(Image.FLIP_LEFT_RIGHT)
    dx, dy, rot = BOIL[(f // 4) % 4]
    w, h = int(im.width * s), int(im.height * s * breathe)
    im2 = im.resize((w, h), Image.BICUBIC).rotate(rot, Image.BICUBIC, expand=True)
    x = int(cx - im2.width / 2 + dx)
    y = int(by - im2.height + dy + (1 - ease_out_cubic(p)) * 60)
    if shadow:
        sw = int(w * 0.62)
        sh = Image.new("RGBA", (sw + 80, 110), (0, 0, 0, 0))
        ImageDraw.Draw(sh).ellipse((40, 40, sw + 40, 70), fill=(40, 30, 20, int(70 * p)))
        sh = sh.filter(ImageFilter.GaussianBlur(12))
        canvas.alpha_composite(sh, (int(cx - sh.width / 2), int(by - 58)))
    if p < 1:
        a = im2.getchannel("A").point(lambda v: int(v * clamp(p * 2.2)))
        im2.putalpha(a)
    canvas.alpha_composite(im2, (x, y))

def spring(tau, amp=0.12, k=8, w=18):
    if tau < 0: return 1.0
    return 1 - amp * math.exp(-k * tau) * math.cos(w * tau)

def crow_draw(canvas, key, cx, by, f, scale=1.0, sqx=1.0, sqy=1.0, rot=0.0, flip=False, shadow=True, sh_scale=1.0, alpha=1.0):
    im = CROWS[key]
    if flip: im = im.transpose(Image.FLIP_LEFT_RIGHT)
    dx, dy, brot = BOIL[(f // 4) % 4]
    w, h = int(im.width * scale * sqx), int(im.height * scale * sqy)
    im2 = im.resize((w, h), Image.BICUBIC).rotate(brot + rot, Image.BICUBIC, expand=True)
    if shadow and sh_scale > 0:
        sw = int(im.width * scale * 0.62 * sh_scale)
        sh = Image.new("RGBA", (sw + 80, 110), (0, 0, 0, 0))
        ImageDraw.Draw(sh).ellipse((40, 40, sw + 40, 70), fill=(40, 30, 20, int(70 * alpha * min(1, sh_scale))))
        sh = sh.filter(ImageFilter.GaussianBlur(12))
        canvas.alpha_composite(sh, (int(cx - sh.width / 2), int(by - 58)))
    if alpha < 1:
        im2.putalpha(im2.getchannel("A").point(lambda v: int(v * alpha)))
    canvas.alpha_composite(im2, (int(cx - im2.width / 2 + dx), int(by_ := by - im2.height + dy + (im2.height - h) / 2)))

def crow_scene1(c, t, f):
    """Hop in -> land squash -> surprised while title builds -> swap to pointing -> talk bob."""
    X0, X1, BY = -260, 520, 960
    if t < 0.12: return
    if t < 0.62:  # jump arc
        u = (t - 0.12) / 0.5
        x = X0 + (X1 - X0) * ease_out_cubic(u)
        hgt = 260 * 4 * u * (1 - u)
        st = 1 + 0.07 * math.sin(u * math.pi)
        crow_draw(c, "sasiran", x, BY - hgt, f, 1.0, 1 / st, st, rot=-8 * (1 - u), sh_scale=1 - hgt / 400)
        return
    land = t - 0.62
    key = "sasiran" if t < 1.62 else "isaret"
    sq = spring(land, 0.13)
    if t >= 1.62: sq = min(sq, spring(t - 1.62, 0.09, 9, 22))
    bob = 0 if t < 1.9 else 5 * abs(math.sin((t - 1.9) * 6.5)) * (0.6 + 0.4 * math.sin(t * 1.7))
    crow_draw(c, key, X1, BY - bob, f, 1.0, 2 - sq, sq)

# ---------- text ----------
def text_img(txt, fnt, fill, stroke=0, stroke_fill=None, shadow=None):
    d = ImageDraw.Draw(Image.new("RGBA", (1, 1)))
    l, t, r, b = d.textbbox((0, 0), txt, font=fnt, stroke_width=stroke)
    pad = 30
    im = Image.new("RGBA", (r - l + pad * 2, b - t + pad * 2), (0, 0, 0, 0))
    dr = ImageDraw.Draw(im)
    if shadow:
        sx, sy, sc = shadow
        dr.text((pad - l + sx, pad - t + sy), txt, font=fnt, fill=sc, stroke_width=stroke, stroke_fill=sc)
    dr.text((pad - l, pad - t), txt, font=fnt, fill=fill, stroke_width=stroke, stroke_fill=stroke_fill)
    return im, pad

def paste_slam(canvas, im, x, y, t, t0, rot=-2.0, dur=0.22):
    p = prog(t, t0, t0 + dur)
    if p <= 0: return
    s = 1.35 - 0.35 * ease_out_back(p, 2.4)
    r = rot * (1 - ease_out_cubic(p))
    w, h = int(im.width * s), int(im.height * s)
    im2 = im.resize((w, h), Image.BICUBIC).rotate(r, Image.BICUBIC, expand=True)
    if p < 1:
        im2.putalpha(im2.getchannel("A").point(lambda v: int(v * clamp(p * 3))))
    canvas.alpha_composite(im2, (int(x + im.width / 2 - im2.width / 2), int(y + im.height / 2 - im2.height / 2)))

# ---------- hand-drawn strokes (supersampled) ----------
def wobbly_line(x0, y0, x1, y1, seed, n=40, amp=5):
    r = random.Random(seed)
    ph = [r.uniform(0, 6.28) for _ in range(3)]
    pts = []
    for i in range(n + 1):
        u = i / n
        off = amp * (math.sin(u * 7 + ph[0]) * .6 + math.sin(u * 13 + ph[1]) * .3 + math.sin(u * 3 + ph[2]) * .5)
        pts.append((x0 + (x1 - x0) * u, y0 + (y1 - y0) * u + off - 10 * math.sin(u * math.pi) * 0.4))
    return pts

def wobbly_ellipse(cx, cy, rx, ry, seed, n=90, turns=1.12):
    r = random.Random(seed)
    ph = [r.uniform(0, 6.28) for _ in range(3)]
    pts = []
    for i in range(n + 1):
        u = i / n
        a = -2.2 + u * turns * 2 * math.pi
        k = 1 + 0.05 * math.sin(a * 2 + ph[0]) + 0.03 * math.sin(a * 5 + ph[1]) + 0.04 * u
        pts.append((cx + rx * k * math.cos(a), cy + ry * k * math.sin(a)))
    return pts

def draw_stroke(canvas, pts, p, color, width, alpha=255):
    if p <= 0: return
    k = max(2, int(len(pts) * clamp(p)))
    pts = pts[:k]
    xs, ys = [q[0] for q in pts], [q[1] for q in pts]
    m = width * 2
    x0, y0 = int(min(xs) - m), int(min(ys) - m)
    x1, y1 = int(max(xs) + m), int(max(ys) + m)
    SS = 3
    lay = Image.new("RGBA", ((x1 - x0) * SS, (y1 - y0) * SS), (0, 0, 0, 0))
    d = ImageDraw.Draw(lay)
    sp = [((x - x0) * SS, (y - y0) * SS) for x, y in pts]
    nlen = len(sp)
    for i in range(nlen - 1):
        taper = 0.75 + 0.25 * math.sin(math.pi * i / max(1, nlen - 1))
        wdt = width * SS * taper
        d.line([sp[i], sp[i + 1]], fill=color + (alpha,), width=int(wdt))
        r = wdt / 2
        d.ellipse((sp[i + 1][0] - r, sp[i + 1][1] - r, sp[i + 1][0] + r, sp[i + 1][1] + r), fill=color + (alpha,))
    lay = lay.resize((x1 - x0, y1 - y0), Image.LANCZOS)
    canvas.alpha_composite(lay, (x0, y0))

def arrow_pts(x0, y0, x1, y1, seed):
    r = random.Random(seed)
    pts = []
    for i in range(41):
        u = i / 40
        bend = math.sin(u * math.pi) * 45
        pts.append((x0 + (x1 - x0) * u + bend * 0.3, y0 + (y1 - y0) * u - bend + r.uniform(-.6, .6)))
    return pts

def draw_arrow(canvas, pts, p, color, width):
    draw_stroke(canvas, pts, p, color, width)
    if p >= 1:
        (ax, ay), (bx, by_) = pts[-6], pts[-1]
        ang = math.atan2(by_ - ay, bx - ax)
        for da in (2.6, -2.6):
            draw_stroke(canvas, [(bx, by_), (bx + 30 * math.cos(ang + da), by_ + 30 * math.sin(ang + da))], 1, color, width)

# ---------- fonts ----------
F_TITLE = font("LuckiestGuy.ttf", 150)
F_HAND = fontv("Caveat.ttf", 74, 700)
F_HAND_S = fontv("Caveat.ttf", 58, 700)
F_CAP = fontv("Baloo2.ttf", 58, 800)
F_TAG = fontv("Rubik.ttf", 30, 700)
F_NUM = font("LuckiestGuy.ttf", 300)
F_CH = font("LuckiestGuy.ttf", 120)

INK_SH = (6, 7, (14, 18, 34, 70))
T_WORDS = [("BÜYÜK", NAVY), ("BÜTÇE", NAVY), ("ŞART", ORANGE), ("MI?", ORANGE)]
T_IMGS = [text_img(w, F_TITLE, c, shadow=INK_SH) for w, c in T_WORDS]
NOTE1 = text_img("(spoiler: hayır)", F_HAND, NAVY)
TAG1 = text_img("KARGA ZİHNİ  ·  BÖLÜM 07", F_TAG, ORANGE)

# ---------- screen recording stand-in ----------
THUMB = Image.open(f"{S}/yt/xhb_KI1HHt4.jpg").convert("RGB")
SITE = THUMB.crop((650, 320, 1240, 665))
CW = 1440
SITE = SITE.resize((CW, int(SITE.height * CW / SITE.width)), Image.LANCZOS).filter(ImageFilter.UnsharpMask(2, 80, 2))
BAR = 46
BX, BY = (W - CW) // 2, (H - SITE.height - BAR) // 2

def make_browser():
    bw, bh = CW, SITE.height + BAR
    win = Image.new("RGBA", (bw, bh), (0, 0, 0, 0))
    m = Image.new("L", (bw * 2, bh * 2), 0)
    ImageDraw.Draw(m).rounded_rectangle((0, 0, bw * 2 - 1, bh * 2 - 1), 36, fill=255)
    m = m.resize((bw, bh), Image.LANCZOS)
    body = Image.new("RGBA", (bw, bh), (32, 34, 40, 255))
    body.paste(SITE, (0, BAR))
    d = ImageDraw.Draw(body)
    for i, c in enumerate([(255, 95, 87), (254, 188, 46), (40, 200, 64)]):
        d.ellipse((22 + i * 26, 16, 36 + i * 26, 30), fill=c)
    d.rounded_rectangle((bw / 2 - 260, 10, bw / 2 + 260, 36), 13, fill=(52, 55, 63))
    d.text((bw / 2, 23), "mesbisous-3d-demo.vercel.app", font=fontv("Rubik.ttf", 18, 500), fill=(190, 193, 200), anchor="mm")
    win.paste(body, (0, 0), m)
    sh = Image.new("RGBA", (bw + 160, bh + 160), (0, 0, 0, 0))
    ImageDraw.Draw(sh).rounded_rectangle((80, 95, bw + 80, bh + 95), 24, fill=(40, 30, 20, 95))
    sh = sh.filter(ImageFilter.GaussianBlur(28))
    return win, sh

BROWSER, BSHADOW = make_browser()

def world_scene2(t, f):
    c = PAPER.convert("RGBA")
    c.alpha_composite(BSHADOW, (BX - 80, BY - 80))
    c.alpha_composite(BROWSER, (BX, BY))
    return c

# label 'BALLE ROUGE' on bottle in world coordinates
LBL = (BX + 257 * CW / 590 + 18, BY + BAR + 150 * CW / 590 - 58)
NOTE2 = text_img("ışık + derinlik", F_HAND, (255, 255, 255), stroke=5, stroke_fill=(18, 22, 38))

def cap_img(txt, fill, sf):
    asc, desc = F_CAP.getmetrics()
    pad = 30
    wdt = int(F_CAP.getlength(txt)) + 14
    im = Image.new("RGBA", (wdt + pad * 2, asc + desc + pad * 2), (0, 0, 0, 0))
    ImageDraw.Draw(im).text((pad + 7, pad + asc), txt, font=F_CAP, fill=fill, anchor="ls", stroke_width=7, stroke_fill=sf)
    return im, pad

CAPTIONS = [
    (5.15, 8.4, "Ürün ön plana çıkarken", ["ön", "plana"]),
    (8.4, 11.0, "arka plandaki ışıklar onu destekliyor.", ["ışıklar"]),
]

_GRAD = None
def bottom_grad():
    global _GRAD
    if _GRAD is None:
        a = (np.clip((np.arange(H) - H * 0.62) / (H * 0.38), 0, 1) ** 1.6 * 150).astype(np.uint8)
        g = Image.new("RGBA", (W, H), (10, 12, 22, 0)); g.putalpha(Image.fromarray(np.repeat(a[:, None], W, 1)))
        _GRAD = g
    return _GRAD

def draw_caption(canvas, t):
    ga = min(prog(t, 5.0, 5.3), 1 - prog(t, 10.9, 11.2))
    if ga > 0:
        g = bottom_grad() if ga >= 1 else Image.blend(Image.new("RGBA", (W, H), (10, 12, 22, 0)), bottom_grad(), ga)
        canvas.alpha_composite(g)
    for a, b, txt, hi in CAPTIONS:
        if not (a <= t < b): continue
        words = txt.split()
        dur = (b - a) * 0.75
        x_imgs = []
        for i, w in enumerate(words):
            tw = a + dur * i / len(words)
            on = t >= tw
            col = ORANGE if (w.strip(".,").lower() in [h.lower() for h in hi] and on) else (255, 255, 255)
            im, pad = cap_img(w, col if on else (255, 255, 255, 120), (18, 22, 38, 255 if on else 110))
            x_imgs.append((im, pad, tw))
        total = sum(im.width - 2 * pad for im, pad, _ in x_imgs) + 18 * (len(x_imgs) - 1)
        x = (W - total) / 2
        p_in = ease_out_cubic(prog(t, a, a + 0.18))
        for im, pad, tw in x_imgs:
            pop = 1 + 0.06 * (1 - ease_out_cubic(prog(t, tw, tw + 0.15))) if t >= tw else 1
            iw, ih = int(im.width * pop), int(im.height * pop)
            im2 = im.resize((iw, ih), Image.BICUBIC) if pop != 1 else im
            canvas.alpha_composite(im2, (int(x - pad - (iw - im.width) / 2), int(H - 205 + (1 - p_in) * 25 - (ih - im.height) / 2)))
            x += im.width - 2 * pad + 18

# ---------- scenes ----------
def scene1(t, f):
    c = PAPER.convert("RGBA")
    crow_scene1(c, t, f)
    # title
    x0, y0 = 860, 250
    lay = [(0, 0), (1, 0), (0, 1), (1, 1)]
    ws = [T_IMGS[0][0].width - 60, T_IMGS[2][0].width - 60]
    pos = [(x0, y0), (x0 + ws[0] + 34, y0), (x0, y0 + 165), (x0 + ws[1] + 34, y0 + 165)]
    for i, ((im, pad), (px, py)) in enumerate(zip(T_IMGS, pos)):
        paste_slam(c, im, px - pad, py - pad, t, 0.55 + i * 0.28, rot=(-3, 2, -2, 3)[i])
    # underline under ŞART MI?
    ux0 = x0 - 5
    ux1 = x0 + ws[1] + 34 + T_IMGS[3][0].width - 60
    draw_stroke(c, wobbly_line(ux0, y0 + 345, ux1, y0 + 338, 3, amp=4), ease_in_out(prog(t, 1.75, 2.15)), ORANGE, 14)
    # tag
    p = ease_out_cubic(prog(t, 0.35, 0.8))
    if p > 0:
        im, pad = TAG1
        im = im.copy(); im.putalpha(im.getchannel("A").point(lambda v: int(v * p)))
        c.alpha_composite(im, (x0 - pad + int((1 - p) * -30), y0 - 95 - pad))
        draw_stroke(c, [(x0, y0 - 115), (x0 + 70 * p, y0 - 115)], 1, ORANGE, 6)
    # handwritten note + arrow
    pn = prog(t, 2.6, 3.1)
    if pn > 0:
        im, pad = NOTE1
        im = im.rotate(-4, Image.BICUBIC, expand=True)
        reveal = int(im.width * ease_out_cubic(pn))
        crop = im.crop((0, 0, max(1, reveal), im.height))
        c.alpha_composite(crop, (1180, 640))
        draw_arrow(c, arrow_pts(1195, 700, 1095, 618, 5), ease_in_out(prog(t, 2.9, 3.25)), NAVY, 6)
    return c

def camera(world, z, cx, cy):
    vw, vh = W / z, H / z
    cx = clamp(cx, vw / 2, W - vw / 2); cy = clamp(cy, vh / 2, H - vh / 2)
    box = (cx - vw / 2, cy - vh / 2, cx + vw / 2, cy + vh / 2)
    return world.resize((W, H), Image.BICUBIC, box=box), box

def scene2(t, f):
    lt = t - 4.6
    world = world_scene2(t, f)
    zp = ease_in_out(prog(lt, 0.9, 2.6))
    z = 1 + 0.38 * zp
    tx, ty = 960 + (LBL[0] + 60 - 960) * zp, 540 + (LBL[1] + 40 - 540) * zp
    # gentle drift
    z += 0.012 * lt
    c, box = camera(world, z, tx, ty)
    zz = W / (box[2] - box[0])
    sx, sy = (LBL[0] - box[0]) * zz, (LBL[1] - box[1]) * zz
    pc = ease_in_out(prog(lt, 2.7, 3.3))
    draw_stroke(c, wobbly_ellipse(sx, sy, 205, 105, 11), pc, (255, 255, 255), 13)
    draw_stroke(c, wobbly_ellipse(sx, sy, 205, 105, 11), pc, ORANGE, 8)
    pn = prog(lt, 3.3, 3.8)
    if pn > 0:
        im, pad = NOTE2
        im = im.rotate(5, Image.BICUBIC, expand=True)
        cr = im.crop((0, 0, max(1, int(im.width * ease_out_cubic(pn))), im.height))
        nx, ny = sx + 300, sy - 270
        c.alpha_composite(cr, (int(nx), int(ny)))
        draw_arrow(c, arrow_pts(nx + 30, ny + 100, sx + 170, sy - 80, 8), ease_in_out(prog(lt, 3.6, 3.95)), (255, 255, 255), 7)
    pu = prog(lt, 1.0, 1.5)
    if pu > 0:
        talking = any(a <= t < b for a, b, _, _ in CAPTIONS)
        bob = 4 * abs(math.sin(t * 7.0)) if talking else 0
        crow_draw(c, "anlatan", 1700, 1035 + 380 * (1 - ease_out_back(pu, 1.6)) - bob, f, 1.0,
                  rot=6 * (1 - pu), flip=True, shadow=False)
    draw_caption(c, t)
    return c

def scene3(t, f):
    lt = t - 11.2
    c = PAPER.convert("RGBA")
    pn = ease_out_back(prog(lt, 0.15, 0.55), 1.4)
    if pn > 0:
        im, pad = text_img("01", F_NUM, ORANGE, shadow=INK_SH)
        s = 0.7 + 0.3 * pn
        im2 = im.resize((int(im.width * s), int(im.height * s)), Image.BICUBIC).rotate(-4 * (1 - pn) + 2, Image.BICUBIC, expand=True)
        c.alpha_composite(im2, (int(300 - im2.width / 2 + im.width / 2 - 100), int(330 - im2.height / 2 + im.height / 2 - 60)))
    l1, _ = text_img("TALİMATI", F_CH, NAVY, shadow=INK_SH)
    l2, _ = text_img("HAZIRLA", F_CH, NAVY, shadow=INK_SH)
    paste_slam(c, l1, 560, 280, lt, 0.45, rot=-2)
    paste_slam(c, l2, 560, 410, lt, 0.7, rot=2)
    draw_stroke(c, wobbly_line(600, 585, 1075, 580, 21, amp=3), ease_in_out(prog(lt, 1.0, 1.35)), ORANGE, 12)
    pn2 = prog(lt, 1.5, 2.0)
    if pn2 > 0:
        im, pad = text_img("talimat metni yorumlarda", F_HAND_S, NAVY)
        cr = im.crop((0, 0, max(1, int(im.width * ease_out_cubic(pn2))), im.height))
        c.alpha_composite(cr.rotate(-2, Image.BICUBIC, expand=True), (585, 610))
    pi = prog(lt, 0.25, 0.75)
    if pi > 0:
        x = 1490 + 700 * (1 - ease_out_back(pi, 1.3))
        typing = 2.2 * math.sin(lt * 46) * (lt > 0.9)
        crow_draw(c, "pc", x, 900 - abs(typing), f, 1.0, 1, spring(lt - 0.75, 0.06), rot=-5 * (1 - pi))
    return c

def push(a_img, b_img, p, direction="up"):
    c = Image.new("RGBA", (W, H))
    e = ease_in_out(p)
    if direction == "up":
        c.alpha_composite(a_img, (0, int(-H * e)))
        c.alpha_composite(b_img, (0, int(H * (1 - e))))
    else:
        c.alpha_composite(a_img, (int(-W * e), 0))
        c.alpha_composite(b_img, (int(W * (1 - e)), 0))
    return c

T1 = (4.3, 4.85)   # scene1 -> scene2
T2 = (10.85, 11.4) # scene2 -> scene3

def render(t, f):
    if t < T1[0]: return scene1(t, f)
    if t < T1[1]: return push(scene1(t, f), scene2(max(t, 4.6), f), prog(t, *T1), "up")
    if t < T2[0]: return scene2(t, f)
    if t < T2[1]: return push(scene2(t, f), scene3(t, f), prog(t, *T2), "left")
    return scene3(t, f)

def render_frame(f):
    t = f / FPS
    in_tr = T1[0] <= t < T1[1] or T2[0] <= t < T2[1]
    if in_tr:  # motion blur on transitions
        acc = None
        K = 14
        for k in range(K):
            im = np.asarray(render(t + (k / K - 0.5) * 0.6 / FPS, f).convert("RGB"), np.float32)
            acc = im if acc is None else acc + im
        img = Image.fromarray((acc / K).astype(np.uint8))
    else:
        img = render(t, f).convert("RGB")
    img = add_grain(img, f)
    # fade in / out
    a = min(prog(t, 0, 0.25), 1 - prog(t, DUR - 0.5, DUR))
    if a < 1: img = Image.blend(Image.new("RGB", (W, H), (0, 0, 0)), img, a)
    return img

# ---------- sound design ----------
SR = 48000
def sfx_track():
    n = int(DUR * SR)
    out = np.zeros(n, np.float32)
    r = np.random.default_rng(3)
    def add(sig, t, g=1.0):
        i = int(t * SR); j = min(n, i + len(sig))
        out[i:j] += sig[: j - i] * g
    def thump(freq=110, d=0.18):
        tt = np.arange(int(d * SR)) / SR
        f = freq * (1 + 1.5 * np.exp(-tt * 40))
        s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 22)
        click = r.normal(0, 1, len(tt)) * np.exp(-tt * 300) * 0.25
        return (s + click).astype(np.float32)
    def whoosh(d=0.55, up=True):
        m = int(d * SR)
        x = r.normal(0, 1, m).astype(np.float32)
        env = np.sin(np.linspace(0, np.pi, m)) ** 2
        # moving one-pole lowpass
        y = np.zeros(m, np.float32); acc = 0.0
        cut = np.linspace(0.02, 0.25, m) if up else np.linspace(0.25, 0.02, m)
        cut = np.where(np.arange(m) < m / 2, cut, cut[::-1])
        for i in range(m):
            acc += cut[i] * (x[i] - acc); y[i] = acc
        return y * env * 2.2
    def scribble(d):
        m = int(d * SR)
        x = r.normal(0, 1, m).astype(np.float32)
        y = np.convolve(x, np.ones(6) / 6, "same") - np.convolve(x, np.ones(60) / 60, "same")
        mod = 0.55 + 0.45 * np.abs(np.sin(np.linspace(0, d * 2 * np.pi * 7, m)))
        env = np.minimum(1, np.linspace(0, 8, m)) * np.minimum(1, np.linspace(8, 0, m))
        return y * mod * env * 0.9
    def pop(d=0.09):
        tt = np.arange(int(d * SR)) / SR
        return (np.sin(2 * np.pi * (500 + 900 * tt / d) * tt) * np.exp(-tt * 45)).astype(np.float32) * 0.5
    add(pop(), 0.2, 0.6)
    for i in range(4): add(thump(95 + i * 8), 0.58 + i * 0.28, 0.85)
    add(scribble(0.42), 1.75, 0.5)
    add(scribble(0.55), 2.62, 0.35)
    add(whoosh(0.6), T1[0] - 0.05, 0.55)
    add(pop(), 4.6 + 1.2, 0.4)
    add(whoosh(1.6, True), 4.6 + 0.95, 0.12)
    add(scribble(0.6), 4.6 + 2.7, 0.5)
    add(scribble(0.5), 4.6 + 3.3, 0.35)
    add(whoosh(0.6, False), T2[0] - 0.05, 0.55)
    add(thump(70, 0.3), 11.2 + 0.2, 1.0)
    add(thump(100), 11.2 + 0.47, 0.8); add(thump(108), 11.2 + 0.72, 0.8)
    add(scribble(0.35), 11.2 + 1.0, 0.45)
    add(scribble(0.5), 11.2 + 1.5, 0.3)
    # room tone so silence isn't digital-dead
    out += r.normal(0, 1, n).astype(np.float32) * 0.0025
    out = np.tanh(out * 0.9) * 0.7
    st = np.stack([out, out], 1)
    pcm = (st * 32767).astype(np.int16)
    path = f"{OUT}/sfx.wav"
    with wave.open(path, "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
    return path

if __name__ == "__main__":
    only = sys.argv[2:]  # optional frame numbers for stills
    if only:
        for s in only:
            render_frame(int(s)).save(f"{OUT}/still_{int(s):04d}.png")
        sys.exit(0)
    wav = sfx_track()
    p = subprocess.Popen(["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
                          "-i", wav, "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p",
                          "-c:a", "aac", "-b:a", "192k", "-shortest", "-movflags", "+faststart", f"{OUT}/karga_stil_ornegi.mp4"], stdin=subprocess.PIPE)
    for f in range(N):
        p.stdin.write(render_frame(f).tobytes())
        if f % 60 == 0: print("frame", f, flush=True)
    p.stdin.close(); p.wait()
    print("done")
