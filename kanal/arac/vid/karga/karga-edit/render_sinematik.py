"""Karga Zihni - sinematik stil ornegi v2 (Isaac tarzi referans).
Kullanim: python3 -I render_v2.py <scratchpad> [kare numaralari...]
"""
import sys, math, random, subprocess, os, wave
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageChops

S = sys.argv[1]
POSE = f"{S}/poses/karga-pozlari-v1"
FD = f"{S}/fonts"
OUT = f"{S}/demo/out"
os.makedirs(OUT, exist_ok=True)

W, H, FPS = 1920, 1080, 30
DUR = 16.0
N = int(DUR * FPS)
ORANGE = (255, 128, 40)
GOLD = (255, 186, 96)
WHITE = (246, 242, 234)

def clamp(x, a=0.0, b=1.0): return max(a, min(b, x))
def prog(t, a, b): return clamp((t - a) / (b - a))
def eo(x): return 1 - (1 - x) ** 3
def eio(x): return 4 * x ** 3 if x < .5 else 1 - (-2 * x + 2) ** 3 / 2
def eexp(x): return 1 if x >= 1 else 1 - 2 ** (-10 * x)
def eback(x, s=1.7):
    x -= 1
    return 1 + (s + 1) * x ** 3 + s * x ** 2
def spring(tau, amp=0.1, k=8, w=18):
    return 1.0 if tau < 0 else 1 - amp * math.exp(-k * tau) * math.cos(w * tau)

def F(name, size, wght=None):
    f = ImageFont.truetype(f"{FD}/{name}", size)
    if wght is not None:
        try: f.set_variation_by_axes([wght])
        except Exception: pass
    return f

rng = np.random.default_rng(11)

# ---------------- backgrounds ----------------
def radial(c_in, c_out, cx=0.5, cy=0.45, power=1.4):
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    d = np.sqrt(((xx / W - cx) * 1.6) ** 2 + ((yy / H - cy) * 1.1) ** 2)
    d = np.clip(d / 0.95, 0, 1) ** power
    a = np.array(c_in, np.float32); b = np.array(c_out, np.float32)
    return Image.fromarray((a * (1 - d[..., None]) + b * d[..., None]).astype(np.uint8)).convert("RGBA")

BG_DARK = radial((30, 34, 54), (5, 6, 11))
GRAIN = [Image.fromarray(rng.normal(128, 11, (H // 2, W // 2)).astype(np.uint8)).resize((W, H), Image.NEAREST).convert("RGB") for _ in range(4)]
yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
VIG = np.clip(1 - 0.55 * (np.sqrt(((xx - W / 2) / (W * 0.62)) ** 2 + ((yy - H / 2) / (H * 0.62)) ** 2) - 0.45).clip(0, 1) ** 1.3, 0, 1)[..., None]
del yy, xx

def light_leak(c, t, t0, t1, strength=0.55, y=0.3):
    p = prog(t, t0, t1)
    if p <= 0 or p >= 1: return
    blob = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(blob)
    cx = -500 + (W + 1000) * eio(p)
    a = int(255 * strength * math.sin(math.pi * p))
    d.ellipse((cx - 520, H * y - 330, cx + 520, H * y + 330), fill=(255, 120, 40, a))
    d.ellipse((cx - 250, H * y - 160, cx + 250, H * y + 160), fill=(255, 190, 120, a))
    blob = blob.resize((W // 8, H // 8), Image.BILINEAR).filter(ImageFilter.GaussianBlur(14)).resize((W, H), Image.BILINEAR)
    rgb = ImageChops.screen(c.convert("RGB"), blob.convert("RGB")) if False else None
    arr = np.asarray(c, np.float32)
    add = np.asarray(blob, np.float32)
    arr[..., :3] = 255 - (255 - arr[..., :3]) * (255 - add[..., :3] * add[..., 3:] / 255) / 255
    c.paste(Image.fromarray(arr.astype(np.uint8)))

# ---------------- crow assets ----------------
def load(name, h):
    im = Image.open(f"{POSE}/{name}").convert("RGBA")
    im = im.crop(im.getbbox())
    r = h / im.height
    return im.resize((int(im.width * r), h), Image.LANCZOS)

CROW = {
    "anlatan": load("01-anlatan.png", 760),
    "isaret": load("02-isaret-eden.png", 470),
    "pc": load("06-bilgisayarda.png", 600),
    "sasiran": load("04-sasiran.png", 820),
}

def rim(im, color=ORANGE, r=16, strength=1.0):
    pad = r * 3
    a = Image.new("L", (im.width + pad * 2, im.height + pad * 2), 0)
    a.paste(im.getchannel("A"), (pad, pad))
    g = a.filter(ImageFilter.GaussianBlur(r)).point(lambda v: int(min(255, v * 1.6 * strength)))
    lay = Image.new("RGBA", a.size, color + (0,)); lay.putalpha(g)
    return lay, pad

RIMS = {k: rim(v) for k, v in CROW.items()}
BOIL = [(0, 0, 0.0), (2, -1, 0.45), (-1, 2, -0.35), (1, 1, 0.2)]

def crow(c, key, cx, by, f, scale=1.0, sqx=1.0, sqy=1.0, rot=0.0, alpha=1.0, flip=False, glow=0.8):
    im = CROW[key]; rl, pad = RIMS[key]
    if flip: im = im.transpose(Image.FLIP_LEFT_RIGHT); rl = rl.transpose(Image.FLIP_LEFT_RIGHT)
    dx, dy, br = BOIL[(f // 4) % 4]
    sx, sy = scale * sqx, scale * sqy
    def tf(img):
        w, h = int(img.width * sx), int(img.height * sy)
        return img.resize((max(1, w), max(1, h)), Image.BICUBIC).rotate(br + rot, Image.BICUBIC, expand=True)
    a = tf(im); g = tf(rl)
    x = cx - a.width / 2 + dx; y = by - a.height + dy
    if glow > 0:
        g.putalpha(g.getchannel("A").point(lambda v: int(v * glow * alpha)))
        c.alpha_composite(g, (int(cx - g.width / 2 + dx), int(y - (g.height - a.height) / 2)))
    if alpha < 1: a.putalpha(a.getchannel("A").point(lambda v: int(v * alpha)))
    c.alpha_composite(a, (int(x), int(y)))

# line-art version of the crow, drawn on progressively
def make_lineart(im):
    arr = np.asarray(im, np.float32)
    lum = arr[..., :3] @ np.array([.3, .59, .11], np.float32)
    alpha = arr[..., 3]
    lines = (alpha > 140) & (lum < 26)
    a8 = Image.fromarray((alpha > 128).astype(np.uint8) * 255)
    edge = np.asarray(ImageChops.subtract(a8.filter(ImageFilter.MaxFilter(5)), a8), np.float32) > 0
    m = (lines | edge).astype(np.float32)
    h, w = m.shape
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    nz = rng.normal(0, 1, (h // 40 + 2, w // 40 + 2)).astype(np.float32)
    nz = np.asarray(Image.fromarray(((nz - nz.min()) / np.ptp(nz) * 255).astype(np.uint8)).resize((w, h), Image.BICUBIC), np.float32) / 255
    order = 0.62 * (yy / h) + 0.38 * nz
    order = (order - order.min()) / np.ptp(order)
    return m, order

LA_M, LA_ORDER = make_lineart(CROW["anlatan"])

def lineart_layer(p, intensity=1.0):
    m = LA_M * (LA_ORDER <= p)
    # bright 'pen' front
    front = LA_M * ((LA_ORDER > p - 0.04) & (LA_ORDER <= p))
    core = np.clip(m * 0.95 + front * 0.6, 0, 1)
    h, w = m.shape
    base = Image.fromarray((core * 255).astype(np.uint8))
    g1 = base.filter(ImageFilter.GaussianBlur(4)); g2 = base.resize((w // 4, h // 4), Image.BILINEAR).filter(ImageFilter.GaussianBlur(6)).resize((w, h), Image.BILINEAR)
    g1 = base.filter(ImageFilter.GaussianBlur(2.5))
    lum = np.clip(np.asarray(base, np.float32) * 1.1 + np.asarray(g1, np.float32) * 0.9 + np.asarray(g2, np.float32) * 0.7, 0, 255) * intensity
    out = np.zeros((h, w, 4), np.uint8)
    col = np.array(GOLD, np.float32)
    hot = np.clip(np.asarray(base, np.float32) / 255, 0, 1)[..., None]
    rgb = col * (1 - hot * 0.5) + np.array([255, 240, 215], np.float32) * hot * 0.5
    out[..., :3] = rgb.astype(np.uint8)
    out[..., 3] = np.clip(lum, 0, 255).astype(np.uint8)
    return Image.fromarray(out)

# ---------------- typography ----------------
F_SER = lambda s: F("PlayfairItalic.ttf", s, 500)
F_SANS = lambda s, w=900: F("Montserrat.ttf", s, w)
F_SUB = F("Montserrat.ttf", 34, 600)

def word_img(txt, fnt, fill, glow=None, track=0):
    d = ImageDraw.Draw(Image.new("RGBA", (1, 1)))
    l, t, r, b = d.textbbox((0, 0), txt, font=fnt)
    extra = track * max(0, len(txt) - 1)
    pad = 60
    im = Image.new("RGBA", (r - l + extra + pad * 2, b - t + pad * 2), (0, 0, 0, 0))
    dr = ImageDraw.Draw(im)
    if track:
        x = pad - l
        for ch in txt:
            dr.text((x, pad - t), ch, font=fnt, fill=fill); x += fnt.getlength(ch) + track
    else:
        dr.text((pad - l, pad - t), txt, font=fnt, fill=fill)
    if glow:
        gl = Image.new("RGBA", im.size, glow + (0,)); gl.putalpha(im.getchannel("A").filter(ImageFilter.GaussianBlur(18)).point(lambda v: min(255, int(v * 1.5))))
        gl2 = Image.new("RGBA", im.size, glow + (0,)); gl2.putalpha(im.getchannel("A").filter(ImageFilter.GaussianBlur(5)))
        base = Image.new("RGBA", im.size, (0, 0, 0, 0)); base.alpha_composite(gl); base.alpha_composite(gl2); base.alpha_composite(im)
        im = base
    return im, pad

def blur_in(c, img, x, y, t, t0, dur=0.35, rise=24, scale0=1.08):
    """Premium text reveal: blur -> sharp, slight scale-down, fade, rise."""
    p = prog(t, t0, t0 + dur)
    if p <= 0: return
    e = eexp(p)
    s = scale0 + (1 - scale0) * e
    im = img
    if s != 1: im = img.resize((int(img.width * s), int(img.height * s)), Image.BICUBIC)
    br = (1 - e) * 14
    if br > 0.5: im = im.filter(ImageFilter.GaussianBlur(br))
    if e < 1: im = im.copy(); im.putalpha(im.getchannel("A").point(lambda v: int(v * clamp(e * 1.2))))
    c.alpha_composite(im, (int(x - (im.width - img.width) / 2), int(y + rise * (1 - e) - (im.height - img.height) / 2)))

SUBS = [
    (0.5, 2.3, "bir web sitesinin bu kadar etkileyici görünmesi için"),
    (2.3, 3.9, "büyük bütçe gerçekten şart mı?"),
    (4.6, 6.9, "ürün ön plana çıkarken"),
    (6.9, 9.2, "arka plandaki ışıklar onu destekliyor"),
    (9.9, 12.0, "ilk olarak talimatı hazırlıyoruz"),
    (12.6, 14.8, "ve sonuç... tam ekranda"),
]
SUB_IMGS = {}
def subtitle(c, t):
    for a, b, txt in SUBS:
        if a <= t < b:
            if txt not in SUB_IMGS:
                im, pad = word_img(txt, F_SUB, WHITE)
                sh = Image.new("RGBA", im.size, (0, 0, 0, 0)); sh.putalpha(im.getchannel("A").filter(ImageFilter.GaussianBlur(6)).point(lambda v: int(v * .8)))
                base = Image.new("RGBA", im.size, (0, 0, 0, 0)); base.alpha_composite(sh, (0, 3)); base.alpha_composite(im)
                SUB_IMGS[txt] = base
            im = SUB_IMGS[txt]
            al = min(prog(t, a, a + 0.12), 1 - prog(t, b - 0.1, b))
            if al < 1: im = im.copy(); im.putalpha(im.getchannel("A").point(lambda v: int(v * al)))
            c.alpha_composite(im, (int(W / 2 - im.width / 2), int(H - 150 - im.height / 2)))

# precomputed words
T_BB, _ = word_img("büyük bütçe", F_SER(118), WHITE)
T_SM, _ = word_img("ŞART MI?", F_SANS(150), ORANGE, glow=(255, 110, 30))
T_ISIK, _ = word_img("ışık +", F_SER(112), WHITE)
T_DER, _ = word_img("DERİNLİK", F_SANS(92), ORANGE, glow=(255, 110, 30))
T_ADIM, _ = word_img("adım", F_SER(120), WHITE)
T_01, _ = word_img("01", F_SANS(330), ORANGE, glow=(255, 110, 30))
T_TAL, _ = word_img("TALİMATI HAZIRLA", F_SANS(62, 800), WHITE, track=10)
T_VE, _ = word_img("ve sonuç", F_SER(150), WHITE)
T_Q, _ = word_img("?", F_SANS(260), ORANGE, glow=(255, 110, 30))

# ---------------- screen stand-in ----------------
THUMB = Image.open(f"{S}/yt/xhb_KI1HHt4.jpg").convert("RGB")
SITE = THUMB.crop((650, 320, 1240, 665))
CARD_W = 1100
SITE_C = SITE.resize((CARD_W, int(SITE.height * CARD_W / SITE.width)), Image.LANCZOS).filter(ImageFilter.UnsharpMask(2, 70, 2))
AMB = SITE.resize((W // 10, H // 10)).filter(ImageFilter.GaussianBlur(4)).resize((W, H), Image.BICUBIC)
AMB = Image.blend(AMB, Image.new("RGB", (W, H), (8, 8, 14)), 0.62).convert("RGBA")

def make_card():
    bar = 40
    w, h = CARD_W, SITE_C.height + bar
    body = Image.new("RGBA", (w, h), (24, 25, 30, 255))
    body.paste(SITE_C, (0, bar))
    d = ImageDraw.Draw(body)
    for i, col in enumerate([(255, 95, 87), (254, 188, 46), (40, 200, 64)]):
        d.ellipse((18 + i * 22, 14, 30 + i * 22, 26), fill=col)
    d.rounded_rectangle((w / 2 - 220, 9, w / 2 + 220, 31), 11, fill=(44, 46, 54))
    d.text((w / 2, 20), "mesbisous-3d-demo.vercel.app", font=F("Montserrat.ttf", 15, 500), fill=(180, 183, 190), anchor="mm")
    m = Image.new("L", (w * 2, h * 2), 0); ImageDraw.Draw(m).rounded_rectangle((0, 0, w * 2 - 1, h * 2 - 1), 28, fill=255)
    body.putalpha(m.resize((w, h), Image.LANCZOS))
    # thin light border
    ImageDraw.Draw(body).rounded_rectangle((0, 0, w - 1, h - 1), 14, outline=(255, 255, 255, 40), width=1)
    return body

CARD = make_card()
CARD_SH = Image.new("RGBA", (CARD.width + 300, CARD.height + 300), (0, 0, 0, 0))
ImageDraw.Draw(CARD_SH).rounded_rectangle((150, 175, CARD.width + 150, CARD.height + 175), 20, fill=(0, 0, 0, 170))
CARD_SH = CARD_SH.filter(ImageFilter.GaussianBlur(40))

def perspective(img, tilt):
    """Simple y-axis rotation feel: shrink right edge height by tilt (0..0.12)."""
    if tilt <= 0.001: return img
    w, h = img.size
    d = h * tilt
    # PIL transform maps output -> input; coeffs from 4 point pairs
    src = [(0, 0), (w, 0), (w, h), (0, h)]
    dst = [(0, 0), (w, d), (w, h - d), (0, h)]
    A = []; B = []
    for (x, y), (u, v) in zip(dst, src):
        A.append([x, y, 1, 0, 0, 0, -u * x, -u * y]); B.append(u)
        A.append([0, 0, 0, x, y, 1, -v * x, -v * y]); B.append(v)
    co = np.linalg.solve(np.array(A, float), np.array(B, float))
    return img.transform((w, h), Image.PERSPECTIVE, tuple(co), Image.BICUBIC)

# ---------------- scenes ----------------
def sceneA(t, f):
    c = BG_DARK.copy()
    light_leak(c, t, 0.2, 3.6, 0.28, 0.25)
    cx, by = 540, 990
    # line-art draws itself, then 'comes alive'
    pd = eio(prog(t, 0.15, 1.75))
    alive = prog(t, 1.75, 2.15)
    if alive < 1 and pd > 0:
        la = lineart_layer(pd, 1.0 - alive)
        c.alpha_composite(la, (int(cx - la.width / 2), int(by - la.height)))
    if alive > 0:
        sq = spring(t - 1.75, 0.07)
        crow(c, "anlatan", cx, by - 6 * math.sin(t * 2.2), f, 1.0, 2 - sq, sq, alpha=eo(alive), glow=0.55 + 0.6 * (1 - alive))
        # flash
        fl = (1 - prog(t, 1.75, 2.1)) * (t >= 1.75)
        if fl > 0:
            c.alpha_composite(Image.new("RGBA", (W, H), (255, 200, 150, int(70 * fl))))
    blur_in(c, T_BB, 960, 310, t, 2.35)
    blur_in(c, T_SM, 950, 440, t, 2.75, dur=0.3, scale0=1.25, rise=0)
    subtitle(c, t)
    return c

def sceneB(t, f):
    lt = t - 4.05
    c = AMB.copy()
    # slow parallax on ambient
    # card: settle from tilted & lower into flat, then slow push in
    pe = eexp(prog(lt, 0.0, 0.9))
    tilt = 0.10 * (1 - pe)
    push = 1 + 0.06 * eio(prog(lt, 0.8, 5.2))
    card = perspective(CARD, tilt)
    s = (0.9 + 0.1 * pe) * push
    cw, ch = int(card.width * s), int(card.height * s)
    card = card.resize((cw, ch), Image.BICUBIC)
    sh = CARD_SH.resize((int(CARD_SH.width * s), int(CARD_SH.height * s)), Image.BILINEAR)
    cx, cy = 1255, 500 + 60 * (1 - pe)
    c.alpha_composite(sh, (int(cx - sh.width / 2), int(cy - sh.height / 2)))
    c.alpha_composite(card, (int(cx - cw / 2), int(cy - ch / 2)))
    # glow ring around bottle label (screen-space, follows card)
    lx = cx + (257 + 18 * 590 / 1440 - 295) * CARD_W / 590 * s
    ly = cy + (40 / 2 + 150 - 58 * 590 / 1440 - SITE.height / 2) * CARD_W / 590 * s - 20 * s
    pr = eio(prog(lt, 2.3, 2.9))
    if pr > 0:
        ring = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        d = ImageDraw.Draw(ring)
        rx, ry = 150 * s, 85 * s
        d.arc((lx - rx, ly - ry, lx + rx, ly + ry), -200, -200 + 360 * pr, fill=GOLD + (255,), width=5)
        g = ring.filter(ImageFilter.GaussianBlur(9))
        c.alpha_composite(g); c.alpha_composite(g); c.alpha_composite(ring)
    # kinetic text on the left
    blur_in(c, T_ISIK, 50, 110, lt, 1.0)
    blur_in(c, T_DER, 40, 235, lt, 1.3, scale0=1.2, rise=0)
    # crow points at the card from bottom-left
    pi = prog(lt, 0.6, 1.1)
    if pi > 0:
        crow(c, "isaret", 330 - 260 * (1 - eback(pi, 1.4)), 1010 - 4 * abs(math.sin(lt * 6.5)) * (lt > 1.2), f, 1.0,
             2 - spring(lt - 1.1, .08), spring(lt - 1.1, .08), glow=0.75)
    subtitle(c, t)
    return c

def sceneC(t, f):
    lt = t - 9.6
    c = BG_DARK.copy()
    light_leak(c, t, 9.6, 12.4, 0.35, 0.7)
    blur_in(c, T_ADIM, 215, 120, lt, 0.15)
    blur_in(c, T_01, 175, 270, lt, 0.4, scale0=1.3, rise=0)
    blur_in(c, T_TAL, 205, 690, lt, 0.8, rise=16)
    # thin accent line
    pl = eexp(prog(lt, 0.9, 1.4))
    if pl > 0:
        ImageDraw.Draw(c).rectangle((270, 680, 270 + 520 * pl, 683), fill=ORANGE + (255,))
    pi = prog(lt, 0.2, 0.7)
    if pi > 0:
        typing = 2.0 * math.sin(lt * 46) * (lt > 0.8)
        crow(c, "pc", 1400 + 600 * (1 - eback(pi, 1.2)), 900 - abs(typing), f, 1.0, 1, spring(lt - 0.7, .05), glow=0.9)
    subtitle(c, t)
    return c

def sceneD(t, f):
    lt = t - 12.4
    c = BG_DARK.copy()
    # impact zoom + shake
    sq = spring(lt, 0.12, 7, 20)
    crow(c, "sasiran", 600, 1030, f, 1.0 + 0.05 * eo(prog(lt, 0, 2.5)), 2 - sq, sq, glow=0.7)
    blur_in(c, T_VE, 1060, 330, lt, 0.35)
    blur_in(c, T_Q, 1060 + T_VE.width - 95, 300, lt, 0.75, scale0=1.5, rise=0)
    subtitle(c, t)
    sh = math.exp(-lt * 9) * 14
    if sh > 0.5:
        c = c.transform((W, H), Image.AFFINE, (1, 0, random.uniform(-sh, sh), 0, 1, random.uniform(-sh, sh)), Image.BILINEAR)
    fl = 1 - prog(lt, 0, 0.18)
    if fl > 0: c.alpha_composite(Image.new("RGBA", (W, H), (255, 236, 220, int(200 * fl))))
    return c

# ---------------- transitions ----------------
def zoom_blur(img, cx, cy, amount, n=8):
    if amount < 0.01: return img
    acc = np.zeros((H, W, 3), np.float32)
    for i in range(n):
        z = 1 + amount * i / (n - 1)
        vw, vh = W / z, H / z
        box = (cx - vw * cx / W, cy - vh * cy / H, cx - vw * cx / W + vw, cy - vh * cy / H + vh)
        acc += np.asarray(img.resize((W, H), Image.BILINEAR, box=box).convert("RGB"), np.float32)
    return Image.fromarray((acc / n).astype(np.uint8)).convert("RGBA")

def zoom_in(img, z, cx, cy):
    vw, vh = W / z, H / z
    box = (cx - vw * cx / W, cy - vh * cy / H, cx - vw * cx / W + vw, cy - vh * cy / H + vh)
    return img.resize((W, H), Image.BICUBIC, box=box)

TA = (3.75, 4.25)   # zoom-through A -> B
TB = (9.35, 9.75)   # whip pan B -> C

def render(t, f):
    if t < TA[0]: return sceneA(t, f)
    if t < TA[1]:
        p = prog(t, *TA)
        if p < 0.5:
            q = eio(p * 2) ** 2
            a = zoom_in(sceneA(t, f), 1 + 2.2 * q, 1240, 540)
            return zoom_blur(a, 1240, 540, 0.35 * q)
        q = 1 - eio((p - 0.5) * 2)
        b = zoom_in(sceneB(t, f), 1 + 0.6 * q, 1255, 500)
        b = zoom_blur(b, 1255, 500, 0.3 * q)
        return b
    if t < TB[0]: return sceneB(t, f)
    if t < TB[1]:
        p = eio(prog(t, *TB))
        a, b = sceneB(t, f), sceneC(t, f)
        c = Image.new("RGBA", (W, H))
        c.alpha_composite(a, (int(-W * p), 0)); c.alpha_composite(b, (int(W * (1 - p)), 0))
        # directional blur
        sp = math.sin(math.pi * prog(t, *TB))
        k = int(1 + 90 * sp)
        if k > 2:
            arr = np.asarray(c.convert("RGB"), np.float32)
            cs = np.cumsum(np.pad(arr, ((0, 0), (k, 0), (0, 0)), mode="edge"), axis=1)
            arr = (cs[:, k:] - cs[:, :-k]) / k
            c = Image.fromarray(arr.astype(np.uint8)).convert("RGBA")
        return c
    if t < 12.4: return sceneC(t, f)
    return sceneD(t, f)

def finish(img, f, t):
    arr = np.asarray(img.convert("RGB"), np.float32)
    # subtle chromatic aberration
    arr[..., 0] = np.roll(arr[..., 0], 2, axis=1); arr[..., 2] = np.roll(arr[..., 2], -2, axis=1)
    arr *= VIG
    # warm grade: lift blacks slightly toward navy, warm highlights
    arr = arr * np.array([1.03, 1.0, 0.97], np.float32) + np.array([2, 3, 7], np.float32)
    img = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8))
    img = Image.blend(img, ImageChops.soft_light(img, GRAIN[(f // 2) % 4]), 0.6)
    a = min(prog(t, 0, 0.3), 1 - prog(t, DUR - 0.9, DUR - 0.2))
    if a < 1: img = Image.blend(Image.new("RGB", (W, H)), img, clamp(a))
    return img

def render_frame(f):
    t = f / FPS
    return finish(render(t, f), f, t)

# ---------------- audio ----------------
SR = 48000
def audio():
    n = int(DUR * SR)
    L = np.zeros(n, np.float32); R = np.zeros(n, np.float32)
    r = np.random.default_rng(5)
    tt = np.arange(n) / SR
    def add(sig, t, g=1.0, pan=0.0):
        i = int(t * SR); j = min(n, i + len(sig))
        if j <= i: return
        L[i:j] += sig[: j - i] * g * (1 - max(0, pan)); R[i:j] += sig[: j - i] * g * (1 + min(0, pan))
    def lp(x, a):
        y = np.empty_like(x); acc = 0.0
        for i in range(len(x)):
            acc += a * (x[i] - acc); y[i] = acc
        return y
    # music bed: slow minor chords, soft pad + pluck arps, 90 bpm feel
    chords = [(146.83, 174.61, 220.0), (116.54, 146.83, 174.61), (130.81, 164.81, 196.0), (110.0, 138.59, 164.81)]
    bar = 2.666
    pad = np.zeros(n, np.float32)
    for k in range(int(DUR / bar) + 1):
        ch = chords[k % 4]; t0 = k * bar
        i0 = int(t0 * SR); i1 = min(n, int((t0 + bar + 0.6) * SR))
        seg = tt[i0:i1] - t0
        env = np.minimum(1, seg / 0.8) * np.exp(-np.maximum(0, seg - bar) * 4)
        s = sum(np.sin(2 * np.pi * fr * seg + d) + 0.35 * np.sin(2 * np.pi * fr * 2.003 * seg) for fr, d in zip(ch, (0, 1, 2)))
        pad[i0:i1] += (s * env * 0.05).astype(np.float32)
        # arp plucks
        for j in range(8):
            fr = ch[j % 3] * (2 if j % 4 < 2 else 4)
            pt = t0 + j * bar / 8
            m = int(0.35 * SR); st = np.arange(m) / SR
            add((np.sin(2 * np.pi * fr * st) * np.exp(-st * 11) * 0.035).astype(np.float32), pt, 1, pan=(j % 2 - .5) * .6)
    # sub pulse
    for k in range(int(DUR / (bar / 2))):
        m = int(0.5 * SR); st = np.arange(m) / SR
        add((np.sin(2 * np.pi * 49 * st) * np.exp(-st * 6) * 0.12).astype(np.float32), k * bar / 2)
    L += pad; R += pad
    def impact(g=1.0):
        m = int(1.4 * SR); st = np.arange(m) / SR
        f = 38 + 80 * np.exp(-st * 18)
        s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-st * 3.2)
        nz = lp(r.normal(0, 1, m).astype(np.float32), 0.08) * np.exp(-st * 9) * 1.5
        return ((s + nz) * g).astype(np.float32)
    def riser(d):
        m = int(d * SR); st = np.arange(m) / SR
        x = r.normal(0, 1, m).astype(np.float32)
        y = np.empty_like(x); acc = 0.0
        cut = np.linspace(0.005, 0.35, m) ** 1.5
        for i in range(m):
            acc += cut[i] * (x[i] - acc); y[i] = acc
        tone = np.sin(2 * np.pi * np.cumsum(np.linspace(200, 1400, m)) / SR) * 0.08
        return ((y * 2.5 + tone) * (st / d) ** 2).astype(np.float32)
    def whoosh(d):
        m = int(d * SR)
        x = r.normal(0, 1, m).astype(np.float32)
        cut = np.sin(np.linspace(0, np.pi, m)) * 0.3 + 0.01
        y = np.empty_like(x); acc = 0.0
        for i in range(m):
            acc += cut[i] * (x[i] - acc); y[i] = acc
        return y * np.sin(np.linspace(0, np.pi, m)) ** 2 * 2.6
    def shimmer(d):
        m = int(d * SR); st = np.arange(m) / SR
        s = sum(np.sin(2 * np.pi * fr * st) * (0.5 + 0.5 * np.sin(2 * np.pi * (3 + k) * st)) for k, fr in enumerate((1760, 2349, 2637, 3520)))
        return (s * np.sin(np.linspace(0, np.pi, m)) * 0.02).astype(np.float32)
    def tick():
        m = int(0.06 * SR); st = np.arange(m) / SR
        return (np.sin(2 * np.pi * 2200 * st) * np.exp(-st * 90) * 0.25).astype(np.float32)
    add(shimmer(1.7), 0.15, 1.0)
    add(impact(0.5), 1.75)
    add(tick(), 2.35); add(impact(0.35), 2.75)
    add(riser(1.0), TA[0] - 0.75, 0.5)
    add(whoosh(0.5), TA[0], 0.5); add(impact(0.6), TA[0] + 0.25)
    add(tick(), 4.05 + 1.0, 1, -.3); add(tick(), 4.05 + 1.3, 1, -.3); add(shimmer(0.6), 4.05 + 2.3, 1.2, .3)
    add(whoosh(0.45), TB[0], 0.6)
    add(tick(), 9.75); add(impact(0.35), 10.0)
    add(riser(0.9), 12.4 - 0.85, 0.55)
    add(impact(1.0), 12.4)
    add(tick(), 12.75); add(impact(0.3), 13.15)
    mix = np.stack([L, R], 1)
    fade = np.minimum(1, np.minimum(tt / 0.3, (DUR - tt) / 1.0)).clip(0, 1)[:, None]
    mix = np.tanh(mix * 1.1 * fade) * 0.8
    path = f"{OUT}/v2_audio.wav"
    with wave.open(path, "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((mix * 32767).astype(np.int16).tobytes())
    return path

if __name__ == "__main__":
    only = sys.argv[2:]
    if only:
        for s_ in only:
            render_frame(int(s_)).save(f"{OUT}/v2_{int(s_):04d}.png")
        sys.exit(0)
    wav = audio()
    p = subprocess.Popen(["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
                          "-i", wav, "-c:v", "libx264", "-preset", "medium", "-crf", "17", "-pix_fmt", "yuv420p",
                          "-c:a", "aac", "-b:a", "256k", "-shortest", "-movflags", "+faststart", f"{OUT}/karga_sinematik_v2.mp4"], stdin=subprocess.PIPE)
    for f in range(N):
        p.stdin.write(render_frame(f).tobytes())
        if f % 60 == 0: print("frame", f, flush=True)
    p.stdin.close(); p.wait(); print("done")
