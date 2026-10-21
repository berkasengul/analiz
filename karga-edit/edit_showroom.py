"""Karga Zihni - 'Karga_Zihni_3D_Showroom_Anlatima_Gore_v2' yeniden kurgu.
Kullanim:
  python3 -I edit_showroom.py <scratch> stills <t1> <t2> ...   # tek kare kontrol
  python3 -I edit_showroom.py <scratch> render [workers]        # tam render
"""
import sys, os, math, json, random, subprocess, wave
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageChops

S = sys.argv[1]
SRC = f"{S}/src/showroom_v2.mp4"
POSE = f"{S}/poses/karga-pozlari-v1"
FD = f"{S}/fonts"
OUT = f"{S}/edit/out"
os.makedirs(OUT, exist_ok=True)

W, H, FPS = 1920, 1080, 30
NFR = 11787
DUR = NFR / FPS
ORANGE = (255, 128, 40)
GLOW = (255, 110, 30)
GOLD = (255, 186, 96)
WHITE = (246, 242, 234)
NAVY_BG = ((30, 34, 54), (5, 6, 11))

# ============ helpers ============
def clamp(x, a=0.0, b=1.0): return max(a, min(b, x))
def prog(t, a, b): return clamp((t - a) / (b - a)) if b > a else float(t >= a)
def eo(x): return 1 - (1 - x) ** 3
def eio(x): return 4 * x ** 3 if x < .5 else 1 - (-2 * x + 2) ** 3 / 2
def eexp(x): return 1 if x >= 1 else 1 - 2 ** (-10 * x)
def eback(x, s=1.7):
    x -= 1
    return 1 + (s + 1) * x ** 3 + s * x ** 2
def spring(tau, amp=0.1, k=8, w=18):
    return 1.0 if tau < 0 else 1 - amp * math.exp(-k * tau) * math.cos(w * tau)
def smooth(x): x = clamp(x); return x * x * (3 - 2 * x)
def window(t, a, b, fin=0.3, fout=0.3):
    return min(smooth(prog(t, a, a + fin)), 1 - smooth(prog(t, b - fout, b)))

def F(name, size, wght=None):
    f = ImageFont.truetype(f"{FD}/{name}", size)
    if wght is not None:
        try: f.set_variation_by_axes([wght])
        except Exception: pass
    return f

_FC = {}
def SER(s): return _FC.setdefault(("ser", s), F("PlayfairItalic.ttf", s, 500))
def SANS(s, w=900): return _FC.setdefault(("sans", s, w), F("Montserrat.ttf", s, w))

def with_alpha(im, a):
    if a >= 0.999: return im
    im = im.copy(); im.putalpha(im.getchannel("A").point(lambda v: int(v * a))); return im

rng = np.random.default_rng(11)

# ============ backgrounds / finish ============
def radial(c_in, c_out, cx=0.5, cy=0.45, power=1.4):
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    d = np.sqrt(((xx / W - cx) * 1.6) ** 2 + ((yy / H - cy) * 1.1) ** 2)
    d = np.clip(d / 0.95, 0, 1) ** power
    a = np.array(c_in, np.float32); b = np.array(c_out, np.float32)
    return Image.fromarray((a * (1 - d[..., None]) + b * d[..., None]).astype(np.uint8)).convert("RGBA")

BG_DARK = radial(*NAVY_BG)
GRAIN = [Image.fromarray(rng.normal(128, 10, (H // 2, W // 2)).astype(np.uint8)).resize((W, H), Image.NEAREST).convert("RGB") for _ in range(4)]
_yy, _xx = np.mgrid[0:H, 0:W].astype(np.float32)
VIG = np.clip(1 - 0.5 * (np.sqrt(((_xx - W / 2) / (W * 0.62)) ** 2 + ((_yy - H / 2) / (H * 0.62)) ** 2) - 0.45).clip(0, 1) ** 1.3, 0, 1)[..., None].astype(np.float32)
del _yy, _xx

def finish(img, f, t):
    arr = np.asarray(img.convert("RGB"), np.float32)
    arr[..., 0] = np.roll(arr[..., 0], 1, axis=1); arr[..., 2] = np.roll(arr[..., 2], -1, axis=1)
    arr *= VIG
    arr = arr * np.array([1.02, 1.0, 0.98], np.float32) + np.array([1, 2, 5], np.float32)
    img = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8))
    img = Image.blend(img, ImageChops.soft_light(img, GRAIN[(f // 2) % 4]), 0.45)
    a = min(prog(t, 0, 0.5), 1 - prog(t, DUR - 1.0, DUR - 0.1))
    if a < 1: img = Image.blend(Image.new("RGB", (W, H)), img, clamp(a))
    return img

def light_leak(c, t, t0, t1, strength=0.3, y=0.3):
    p = prog(t, t0, t1)
    if p <= 0 or p >= 1: return
    blob = Image.new("RGB", (W // 8, H // 8), (0, 0, 0))
    d = ImageDraw.Draw(blob)
    cx = (-500 + (W + 1000) * eio(p)) / 8
    a = int(255 * strength * math.sin(math.pi * p))
    d.ellipse((cx - 65, H * y / 8 - 41, cx + 65, H * y / 8 + 41), fill=(a, int(a * .47), int(a * .16)))
    blob = blob.filter(ImageFilter.GaussianBlur(14)).resize((W, H), Image.BILINEAR)
    rgb = ImageChops.screen(c.convert("RGB"), blob)
    c.paste(rgb.convert("RGBA"))

# ============ crow ============
def load(name, h):
    im = Image.open(f"{POSE}/{name}").convert("RGBA")
    im = im.crop(im.getbbox()); r = h / im.height
    return im.resize((int(im.width * r), h), Image.LANCZOS)

POSES = {"anlatan": "01-anlatan.png", "isaret": "02-isaret-eden.png", "dusunen": "03-dusunen.png",
         "sasiran": "04-sasiran.png", "sevinen": "05-sevinen.png", "pc": "06-bilgisayarda.png"}
_CROW = {}
def crow_img(key, h):
    k = (key, h)
    if k not in _CROW:
        im = load(POSES[key], h)
        pad = 48
        a = Image.new("L", (im.width + pad * 2, im.height + pad * 2), 0); a.paste(im.getchannel("A"), (pad, pad))
        g = a.filter(ImageFilter.GaussianBlur(15)).point(lambda v: int(min(255, v * 1.6)))
        rl = Image.new("RGBA", a.size, ORANGE + (0,)); rl.putalpha(g)
        _CROW[k] = (im, rl, pad)
    return _CROW[k]

BOIL = [(0, 0, 0.0), (2, -1, 0.45), (-1, 2, -0.35), (1, 1, 0.2)]
def crow(c, key, cx, by, f, h=600, sqx=1.0, sqy=1.0, rot=0.0, alpha=1.0, flip=False, glow=0.8):
    im, rl, pad = crow_img(key, h)
    if flip: im = im.transpose(Image.FLIP_LEFT_RIGHT); rl = rl.transpose(Image.FLIP_LEFT_RIGHT)
    dx, dy, br = BOIL[(f // 4) % 4]
    def tf(img):
        return img.resize((max(1, int(img.width * sqx)), max(1, int(img.height * sqy))), Image.BICUBIC).rotate(br + rot, Image.BICUBIC, expand=True)
    a = tf(im); g = tf(rl)
    y = by - a.height + dy
    if glow > 0:
        c.alpha_composite(with_alpha(g, glow * alpha), (int(cx - g.width / 2 + dx), int(y - (g.height - a.height) / 2)))
    c.alpha_composite(with_alpha(a, alpha), (int(cx - a.width / 2 + dx), int(y)))

# line art (signature intro)
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
    return m, (order - order.min()) / np.ptp(order)

_LA = None
def lineart_layer(p, intensity=1.0):
    global _LA
    if _LA is None: _LA = make_lineart(crow_img("anlatan", 700)[0])
    M, O = _LA
    m = M * (O <= p); front = M * ((O > p - 0.04) & (O <= p))
    core = np.clip(m * 0.95 + front * 0.6, 0, 1)
    h, w = m.shape
    base = Image.fromarray((core * 255).astype(np.uint8))
    g1 = base.filter(ImageFilter.GaussianBlur(2.5))
    g2 = base.resize((w // 4, h // 4), Image.BILINEAR).filter(ImageFilter.GaussianBlur(6)).resize((w, h), Image.BILINEAR)
    lum = np.clip(np.asarray(base, np.float32) * 1.1 + np.asarray(g1, np.float32) * 0.9 + np.asarray(g2, np.float32) * 0.7, 0, 255) * intensity
    out = np.zeros((h, w, 4), np.uint8)
    hot = np.clip(np.asarray(base, np.float32) / 255, 0, 1)[..., None]
    out[..., :3] = (np.array(GOLD, np.float32) * (1 - hot * .5) + np.array([255, 240, 215], np.float32) * hot * .5).astype(np.uint8)
    out[..., 3] = lum.astype(np.uint8)
    return Image.fromarray(out)

# ============ typography ============
_TC = {}
def word_img(txt, fnt_key, fill, glow=None, track=0):
    k = (txt, fnt_key, fill, glow, track)
    if k in _TC: return _TC[k]
    kind, size = fnt_key[0], fnt_key[1]
    fnt = SER(size) if kind == "ser" else SANS(size, fnt_key[2] if len(fnt_key) > 2 else 900)
    d = ImageDraw.Draw(Image.new("RGBA", (1, 1)))
    l, t, r, b = d.textbbox((0, 0), txt, font=fnt)
    extra = track * max(0, len(txt) - 1)
    pad = 50
    im = Image.new("RGBA", (r - l + extra + pad * 2, b - t + pad * 2), (0, 0, 0, 0))
    dr = ImageDraw.Draw(im)
    if track:
        x = pad - l
        for ch in txt:
            dr.text((x, pad - t), ch, font=fnt, fill=fill); x += fnt.getlength(ch) + track
    else:
        dr.text((pad - l, pad - t), txt, font=fnt, fill=fill)
    sh = Image.new("RGBA", im.size, (0, 0, 0, 0)); sh.putalpha(im.getchannel("A").filter(ImageFilter.GaussianBlur(10)).point(lambda v: int(v * .55)))
    base = Image.new("RGBA", im.size, (0, 0, 0, 0)); base.alpha_composite(sh, (0, 4))
    if glow:
        for rad, mul in ((18, 1.4), (5, 1.0)):
            gl = Image.new("RGBA", im.size, glow + (0,)); gl.putalpha(im.getchannel("A").filter(ImageFilter.GaussianBlur(rad)).point(lambda v, m=mul: min(255, int(v * m))))
            base.alpha_composite(gl)
    base.alpha_composite(im)
    _TC[k] = (base, pad)
    return base, pad

def blur_in(c, img, x, y, t, t0, dur=0.35, rise=22, scale0=1.08, alpha=1.0):
    p = prog(t, t0, t0 + dur)
    if p <= 0 or alpha <= 0: return
    e = eexp(p)
    s = scale0 + (1 - scale0) * e
    im = img if abs(s - 1) < 1e-3 else img.resize((int(img.width * s), int(img.height * s)), Image.BICUBIC)
    br = (1 - e) * 12
    if br > 0.6: im = im.filter(ImageFilter.GaussianBlur(br))
    im = with_alpha(im, clamp(e * 1.2) * alpha)
    c.alpha_composite(im, (int(x - (im.width - img.width) / 2), int(y + rise * (1 - e) - (im.height - img.height) / 2)))

def title2(c, t, t0, t1, l1, l2, x, y, s1=96, s2=120, gap=None, align="left", fout=0.3):
    """Two-line kinetic title: italic serif + bold glowing sans."""
    a = 1 - smooth(prog(t, t1 - fout, t1))
    if a <= 0 or t < t0: return
    i1, p1 = word_img(l1, ("ser", s1), WHITE)
    i2, p2 = word_img(l2, ("sans", s2), ORANGE, glow=GLOW)
    gap = gap if gap is not None else int(s1 * 1.05)
    if align == "center":
        x1 = x - (i1.width - 2 * p1) / 2; x2 = x - (i2.width - 2 * p2) / 2
    elif align == "right":
        x1 = x - (i1.width - 2 * p1); x2 = x - (i2.width - 2 * p2)
    else:
        x1 = x2 = x
    blur_in(c, i1, x1 - p1, y - p1, t, t0, alpha=a)
    blur_in(c, i2, x2 - p2, y + gap - p2, t, t0 + 0.28, scale0=1.22, rise=0, alpha=a)

def chips(c, t, items, x, y, fout_t, size=40):
    """items: [(t_in, text)] pills stacked vertically."""
    a = 1 - smooth(prog(t, fout_t - 0.3, fout_t))
    if a <= 0: return
    yy = y
    for ti, txt in items:
        p = prog(t, ti, ti + 0.35)
        im, pad = word_img(txt, ("sans", size, 700), WHITE)
        w, h = im.width - 2 * pad + 70, size + 34
        if p > 0:
            e = eexp(p)
            pill = Image.new("RGBA", (w + 4, h + 4), (0, 0, 0, 0))
            d = ImageDraw.Draw(pill)
            d.rounded_rectangle((2, 2, w + 1, h + 1), h // 2, fill=(14, 16, 26, 210), outline=(255, 140, 60, 150), width=2)
            d.ellipse((24, h / 2 - 6, 36, h / 2 + 6), fill=ORANGE + (255,))
            pill.alpha_composite(im, (54 - pad, int(h / 2 + 2 - im.height / 2)))
            c.alpha_composite(with_alpha(pill, e * a), (int(x - 30 * (1 - e)), int(yy)))
        yy += h + 16

# ============ subtitles ============
TR = json.load(open(f"{S}/src/transcript.json"))
FIX = {"Cloud'a": "Claude'a", "Cloud": "Claude", "BMW'yu": "BMW'yi", "BMW'yı": "BMW'yi"}
def fixw(w):
    w = w.strip()
    for a, b in FIX.items():
        if w.startswith(a): w = b + w[len(a):]; break
    return w
PHRASES = []
for seg in TR:
    cur = []
    for wd in seg["words"]:
        txt = fixw(wd["w"])
        if not txt: continue
        if cur and (len(" ".join(c[0] for c in cur) + " " + txt) > 44 or wd["s"] - cur[-1][2] > 0.45):
            PHRASES.append(cur); cur = []
        cur.append((txt, wd["s"], wd["e"]))
        if txt.endswith((".", "?", "!")) and len(cur) >= 3:
            PHRASES.append(cur); cur = []
    if cur: PHRASES.append(cur)
SUBS = []
for i, ph in enumerate(PHRASES):
    s, e = ph[0][1], ph[-1][2]
    nxt = PHRASES[i + 1][0][1] if i + 1 < len(PHRASES) else e + 1
    e = min(e + 0.25, nxt) if nxt - e < 0.6 else e + 0.2
    txt = " ".join(w for w, _, _ in ph).rstrip(".")
    SUBS.append((s - 0.05, e, txt))
F_SUB = SANS(38, 600)
_SUBIMG = {}
def subtitle(c, t):
    for a, b, txt in SUBS:
        if a <= t < b:
            if txt not in _SUBIMG:
                d = ImageDraw.Draw(Image.new("RGBA", (1, 1)))
                l, tp, r, bt = d.textbbox((0, 0), txt, font=F_SUB)
                pad = 30
                im = Image.new("RGBA", (r - l + pad * 2, bt - tp + pad * 2), (0, 0, 0, 0))
                ImageDraw.Draw(im).text((pad - l, pad - tp), txt, font=F_SUB, fill=WHITE)
                sh = Image.new("RGBA", im.size, (0, 0, 0, 0)); sh.putalpha(im.getchannel("A").filter(ImageFilter.GaussianBlur(7)).point(lambda v: min(255, int(v * 1.3))))
                base = Image.new("RGBA", im.size, (0, 0, 0, 0)); base.alpha_composite(sh, (0, 3)); base.alpha_composite(sh); base.alpha_composite(im)
                _SUBIMG[txt] = base
            im = _SUBIMG[txt]
            al = min(prog(t, a, a + 0.1), 1 - prog(t, b - 0.08, b))
            bx0, by0 = int(W / 2 - im.width / 2 + 10), int(H - 82 - im.height / 2 + 12)
            reg = c.crop((bx0, by0, bx0 + im.width - 20, by0 + im.height - 24)).convert("L").resize((40, 4))
            lum = float(np.asarray(reg).mean())
            if lum > 110:
                box = Image.new("RGBA", (im.width - 20, im.height - 18), (0, 0, 0, 0))
                ImageDraw.Draw(box).rounded_rectangle((0, 0, box.width - 1, box.height - 1), 16, fill=(10, 11, 18, int(190 * al * clamp((lum - 110) / 40))))
                c.alpha_composite(box, (bx0, by0 - 2))
            c.alpha_composite(with_alpha(im, al), (int(W / 2 - im.width / 2), int(H - 82 - im.height / 2)))
            return

# ============ timeline ============
GEN = [(24.2, 27.2, "nasil"), (77.6, 96.6, "phoneA"), (96.6, 99.6, "check"), (153.0, 162.6, "ba"),
       (174.2, 177.2, "net"), (240.6, 244.7, "blender"), (244.7, 257.8, "baslangic"),
       (301.0, 309.6, "phoneB"), (309.6, 313.0, "ch08"), (334.6, 338.2, "warn"),
       (349.8, 357.8, "msg"), (390.0, DUR + 1, "outro")]
TR_D = 0.4

def refine_bounds():
    """Snap generated-segment boundaries to exact frames (classification at 30fps)."""
    path = f"{OUT}/gen_bounds.json"
    if os.path.exists(path): return json.load(open(path))
    def kind(a):
        def px(x, y): return a[y, x].astype(int)
        cream = np.abs(px(1500, 700) - [244, 238, 225]).sum() < 18 and np.abs(px(300, 950) - [244, 238, 225]).sum() < 18 and a[540, 2, 0] > 180
        nv = lambda x, y: np.abs(px(x, y) - [25, 39, 60]).sum() < 25
        if cream: return "G"
        if nv(960, 20) and nv(960, 950): return "G"
        return "S"
    out = []
    for a, b, name in GEN:
        res = []
        for edge, want in ((a, "G"), (b, "S")):
            if edge > DUR - 0.5: res.append(edge); continue
            t0 = max(0, edge - 0.5)
            raw = subprocess.run(["ffmpeg", "-v", "error", "-ss", f"{t0:.3f}", "-i", SRC, "-frames:v", "30", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], capture_output=True).stdout
            fr = np.frombuffer(raw, np.uint8).reshape(-1, H, W, 3)
            ks = [kind(x) for x in fr]
            idx = next((i for i, k in enumerate(ks) if k == want), None)
            res.append(round((round(t0 * FPS) + (idx if idx is not None else 15)) / FPS, 4))
        out.append([res[0], res[1], name])
    # consecutive generated segments share an edge
    for i in range(len(out) - 1):
        if abs(GEN[i][1] - GEN[i + 1][0]) < 1e-6: out[i][1] = out[i + 1][0]
    json.dump(out, open(path, "w"))
    return out

GENB = refine_bounds()

def gen_at(t):
    for a, b, n in GENB:
        if a <= t < b: return (a, b, n)
    return None

CHAPTERS = [(43.68, "01", "showroom turu"), (77.6, "02", "telefon görünümü"), (99.6, "03", "projeyi hazırla"),
            (140.24, "04", "galeriyi ve ilanı incele"), (182.16, "05", "3D model bul"), (221.36, "06", "mekânı kişiselleştir"),
            (259.8, "07", "sonucu kontrol et"), (309.6, "08", "bağlantıyla paylaş")]
CH_STING = [(t, n, s) for t, n, s in CHAPTERS if n not in ("02", "08")]

def chapter_now(t):
    cur = None
    for tc, n, s in CHAPTERS:
        if t >= tc: cur = (n, s)
    return cur

# ============ screen layout & camera ============
BOUNDS = json.load(open(f"{S}/src/bounds.json"))
LAYOUT = {"A": (0, 150, 1920, 972), "B": (0, 90, 1920, 1000), "C": (0, 136, 1920, 944), "D": (74, 90, 1842, 1010)}
def lay_of(bb):
    if not bb or bb == "empty": return None
    x0, y0, x1, y1 = bb
    if y1 - y0 < 600: return None
    if x0 > 50: return "D"
    if y0 == 136: return "C"
    if y0 == 108: return "A"
    if y0 == 90 and y1 <= 1010: return "B"
    return None
_LAYS = [lay_of(bb) for _, bb in BOUNDS]
def layout_at(t):
    i = int(t * 2)
    for d in (0, 1, -1, 2, -2, 3, -3, 4, -4):
        j = i + d
        if 0 <= j < len(_LAYS) and _LAYS[j]: return _LAYS[j]
    return "A"

# camera holds (t0, t1, zoom, focus_x, focus_y) in source pixel coords; zoom 1 = whole card
FULL = (1.42, 960, 560)
HOLDS = [
    (10.64, 17.0) + FULL, (45.9, 49.2, 1.28, 820, 600), (49.74, 53.0) + FULL,
    (53.3, 57.5, 1.5, 1560, 620), (57.9, 64.0, 1.42, 330, 560), (70.64, 76.9) + FULL,
    (103.7, 111.9, 1.22, 700, 450), (114.7, 120.0, 1.28, 640, 420), (130.8, 136.0, 1.8, 450, 470),
    (136.4, 140.1, 1.45, 620, 650), (143.4, 147.1, 1.22, 960, 560), (165.7, 173.7, 1.6, 650, 745),
    (187.6, 191.4, 1.4, 700, 380), (191.8, 194.3, 1.18, 700, 520), (203.1, 208.4, 1.55, 960, 650),
    (208.8, 214.4, 1.3, 700, 700), (226.0, 235.6) + FULL, (262.6, 268.1) + FULL,
    (268.2, 271.7, 1.65, 600, 330), (272.1, 278.8) + FULL, (289.9, 296.4, 1.5, 1560, 620),
    (315.1, 319.3, 1.28, 800, 500), (319.4, 323.0, 1.6, 420, 600), (340.8, 345.3, 1.35, 1250, 600),
    (357.9, 366.6) + FULL,
]
RAMP = 0.6

def camera(t, lay):
    x0, y0, x1, y1 = LAYOUT[lay]
    base = (1.0, (x0 + x1) / 2, (y0 + y1) / 2)
    z, fx, fy = base
    # gentle drift so nothing is ever fully static
    z = 1.0 + 0.025 * (0.5 - 0.5 * math.cos(t * 0.21))
    for a, b, hz, hx, hy in HOLDS:
        if a - 0.01 <= t <= b + RAMP:
            w = smooth(prog(t, a, a + RAMP)) * (1 - smooth(prog(t, b, b + RAMP)))
            hz += 0.03 * prog(t, a, b)  # slow push while holding
            z = z + (hz - z) * w; fx = fx + (hx - fx) * w; fy = fy + (hy - fy) * w
            break
    return z, fx, fy

CARD_MAXW, CARD_MAXH = 1780, 880
def shadow_tpl():
    im = Image.new("L", (400, 240), 0)
    ImageDraw.Draw(im).rounded_rectangle((60, 70, 340, 190), 10, fill=200)
    return im.filter(ImageFilter.GaussianBlur(22))
SHADOW = shadow_tpl()

def render_screen(src, t, f):
    lay = layout_at(t)
    x0, y0, x1, y1 = LAYOUT[lay]
    cw, ch = x1 - x0, y1 - y0
    s0 = min(CARD_MAXW / cw, CARD_MAXH / ch)
    z, fx, fy = camera(t, lay)
    s = s0 * z
    ax, ay = 960, 505
    # ambient background from the content
    crop = src.crop((x0, y0, x1, y1))
    amb = crop.resize((96, 54), Image.BILINEAR).filter(ImageFilter.GaussianBlur(3)).resize((W, H), Image.BILINEAR)
    amb = Image.blend(Image.new("RGB", (W, H), (6, 7, 12)), amb, 0.38).convert("RGBA")
    c = amb
    # card rect in screen coords
    def to_scr(px, py): return ((px - fx) * s + ax, (py - fy) * s + ay)
    sx0, sy0 = to_scr(x0, y0); sx1, sy1 = to_scr(x1, y1)
    # clamp so card never leaves empty gaps when zoomed (edges flush to screen)
    if sx1 - sx0 >= W:
        if sx0 > 0: d = sx0; sx0 -= d; sx1 -= d
        if sx1 < W: d = W - sx1; sx0 += d; sx1 += d
    if sy1 - sy0 >= H:
        if sy0 > 0: d = sy0; sy0 -= d; sy1 -= d
        if sy1 < H: d = H - sy1; sy0 += d; sy1 += d
    # shadow
    if sx0 > -40 and sy0 > -40:
        sh = SHADOW.resize((int((sx1 - sx0) * 400 / 280), int((sy1 - sy0) * 240 / 120)), Image.BILINEAR)
        lay_sh = Image.new("RGBA", sh.size, (0, 0, 0, 0)); lay_sh.putalpha(sh)
        c.alpha_composite(lay_sh, (int(sx0 - (sh.width - (sx1 - sx0)) / 2), int(sy0 - (sh.height - (sy1 - sy0)) / 2 + 25)))
    # visible part of the card
    vx0, vy0, vx1, vy1 = max(0, sx0), max(0, sy0), min(W, sx1), min(H, sy1)
    if vx1 - vx0 < 2 or vy1 - vy0 < 2: return c
    ssx = (x1 - x0) / (sx1 - sx0); ssy = (y1 - y0) / (sy1 - sy0)
    box = (x0 + (vx0 - sx0) * ssx, y0 + (vy0 - sy0) * ssy, x0 + (vx1 - sx0) * ssx, y0 + (vy1 - sy0) * ssy)
    ix0, iy0 = int(round(vx0)), int(round(vy0))
    tw, th = int(round(vx1)) - ix0, int(round(vy1)) - iy0
    part = src.resize((tw, th), Image.BICUBIC if s < 1.05 else Image.LANCZOS, box=box).convert("RGBA")
    # rounded corners where card corners are visible
    r = 18
    m = Image.new("L", (tw, th), 255)
    ImageDraw.Draw(m).rounded_rectangle((sx0 - ix0, sy0 - iy0, sx1 - ix0 - 1, sy1 - iy0 - 1), r, fill=255, outline=None)
    mk = Image.new("L", (tw, th), 0)
    ImageDraw.Draw(mk).rounded_rectangle((sx0 - ix0, sy0 - iy0, sx1 - ix0 - 1, sy1 - iy0 - 1), r, fill=255)
    part.putalpha(mk)
    c.alpha_composite(part, (ix0, iy0))
    if sx0 > -2 and sy0 > -2:
        ImageDraw.Draw(c).rounded_rectangle((sx0, sy0, sx1 - 1, sy1 - 1), r, outline=(255, 255, 255, 34), width=1)
    return c

# ============ overlays on screen segments ============
PEEKS = [  # (t0, t1, pose)
    (45.9, 49.3, "sasiran"), (64.3, 66.6, "dusunen"), (121.8, 124.0, "pc"), (147.3, 152.4, "anlatan"),
    (194.4, 200.0, "dusunen"), (214.8, 218.8, "anlatan"), (263.6, 268.0, "sevinen"), (279.0, 282.3, "dusunen"),
    (323.3, 326.5, "isaret"), (362.1, 366.7, "sevinen"), (382.7, 386.9, "isaret"),
]
def peek(c, t, f):
    for a, b, pose in PEEKS:
        if a <= t < b + 0.01:
            pin = prog(t, a, a + 0.45); pout = prog(t, b - 0.3, b)
            yoff = 420 * (1 - eback(pin, 1.5)) + 420 * eio(pout)
            sq = spring(t - a - 0.45, 0.07)
            talking = any(sa <= t < sb for sa, sb, _ in SUBS)
            bob = 4 * abs(math.sin(t * 7)) if talking else 0
            h = 340 if pose != "pc" else 300
            flip = pose in ("isaret",)
            crow(c, pose, 1690 if not flip else 1690, 1080 + 30 + yoff - bob, f, h, 2 - sq, sq, flip=flip, glow=0.7)
            return

CALLOUTS = [  # (t0, t1, line1, line2)
    (7.66, 10.3, "bir web sitesinin", "İÇİNDE"), (33.92, 36.5, "proje dosyası", "YORUMLARDA"),
    (45.95, 49.2, "fotoğraf değil,", "3D MODEL"), (57.74, 61.0, "ekspertiz", "PANELİ", "R"),
    (121.8, 124.0, "Claude ile", "DÜZENLE"), (194.4, 199.9, "sadece marka değil,", "DETAYLARA BAK"),
     (263.6, 267.9, "Mercedes'in yerinde", "ARTIK BMW"),
    (268.2, 271.7, "Garden Motors →", "MTG MOTORS", "R"), (362.08, 366.7, "anlatmakla kalma,", "GÖSTER"),
    (377.16, 379.3, "proje dosyası", "YORUMLARDA"), (382.7, 386.9, "sıradaki sektör?", "YORUMA YAZ"),
]
CHIPS = [
    (36.58, 43.5, [(38.2, "galeri adını değiştir"), (39.6, "yeni araç ekle"), (41.3, "bağlantıyla paylaş")]),
    (53.3, 57.5, [(53.9, "model"), (54.6, "kilometre"), (55.4, "fiyat")]),
    (226.08, 231.6, [(227.6, "duvarlar"), (228.3, "ışıklar"), (228.9, "zemin"), (229.8, "araçların yeri")]),
    (274.4, 278.9, [(274.9, "zemine oturmuş mu?"), (276.0, "boyutu uygun mu?"), (277.2, "kamera yakın mı?")]),
]
_LG = None
def left_grad(alpha):
    global _LG
    if _LG is None:
        a = (np.clip(1 - np.arange(W) / (W * 0.62), 0, 1) ** 1.3 * 228).astype(np.uint8)
        g = Image.new("RGBA", (W, H), (6, 7, 12, 0)); g.putalpha(Image.fromarray(np.repeat(a[None, :], H, 0)))
        _LG = g
    return with_alpha(_LG, alpha)

def overlays(c, t, f):
    for co in CALLOUTS:
        a, b, l1, l2 = co[:4]
        if a <= t < b:
            if len(co) > 4:
                c.alpha_composite(left_grad(window(t, a, b, 0.25, 0.3)).transpose(Image.FLIP_LEFT_RIGHT))
                title2(c, t, a, b, l1, l2, W - 90, 330, s1=84, s2=110, align="right")
            else:
                c.alpha_composite(left_grad(window(t, a, b, 0.25, 0.3)))
                title2(c, t, a, b, l1, l2, 90, 330, s1=84, s2=110)
    for a, b, items in CHIPS:
        if a <= t < b:
            c.alpha_composite(left_grad(window(t, a, b, 0.25, 0.3)))
            chips(c, t, items, 90, 330, b)
    peek(c, t, f)

def chapter_tag(c, t):
    ch = chapter_now(t)
    if not ch: return
    n, s = ch
    im, pad = word_img(f"{n}  ·  {s}", ("sans", 24, 600), (235, 232, 225))
    # hidden while the big chapter sting plays
    for tc, nn, ss in CH_STING:
        if tc <= t < tc + 2.0: return
    c.alpha_composite(with_alpha(im, 0.8), (64 - pad, 44 - pad))
    ImageDraw.Draw(c).rectangle((44, 44, 48, 72), fill=ORANGE + (255,))

def chapter_sting(c, t):
    for tc, n, s in CH_STING:
        if tc <= t < tc + 2.0:
            w = window(t, tc, tc + 2.0, 0.25, 0.35)
            dim = Image.new("RGBA", (W, H), (5, 6, 11, int(170 * w)))
            c.alpha_composite(dim)
            num, p1 = word_img(n, ("sans", 300), ORANGE, glow=GLOW)
            tit, p2 = word_img(s, ("ser", 104), WHITE)
            a = 1 - smooth(prog(t, tc + 1.65, tc + 2.0))
            blur_in(c, num, 140 - p1, 300 - p1, t, tc + 0.05, scale0=1.3, rise=0, alpha=a)
            blur_in(c, tit, 150 - p2, 640 - p2, t, tc + 0.3, alpha=a)
            pl = eexp(prog(t, tc + 0.45, tc + 0.9))
            ImageDraw.Draw(c).rectangle((158, 620, 158 + 380 * pl, 623), fill=ORANGE + (int(255 * a),))
            return

# ============ generated scenes ============
def phone_mock(screen_img, t, tilt):
    sw, sh = screen_img.size
    bez = 16
    w, h = sw + bez * 2, sh + bez * 2
    body = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(body)
    d.rounded_rectangle((0, 0, w - 1, h - 1), 64, fill=(16, 17, 22, 255), outline=(90, 92, 100, 255), width=3)
    m = Image.new("L", (sw, sh), 0); ImageDraw.Draw(m).rounded_rectangle((0, 0, sw - 1, sh - 1), 50, fill=255)
    sc = screen_img.convert("RGBA"); sc.putalpha(m)
    body.alpha_composite(sc, (bez, bez))
    d.rounded_rectangle((w / 2 - 62, bez + 12, w / 2 + 62, bez + 46), 17, fill=(0, 0, 0, 255))
    if tilt > 0.002:
        d0 = h * tilt
        src = [(0, 0), (w, 0), (w, h), (0, h)]; dst = [(0, d0), (w, 0), (w, h), (0, h - d0)]
        A, B = [], []
        for (x, y), (u, v) in zip(dst, src):
            A.append([x, y, 1, 0, 0, 0, -u * x, -u * y]); B.append(u)
            A.append([0, 0, 0, x, y, 1, -v * x, -v * y]); B.append(v)
        co = np.linalg.solve(np.array(A, float), np.array(B, float))
        body = body.transform((w, h), Image.PERSPECTIVE, tuple(co), Image.BICUBIC)
    return body

PHONE_BOX = (1170, 140, 1584, 988)
def scene_phone(src, t, f, a, b, variant):
    lt = t - a
    c = BG_DARK.copy()
    light_leak(c, t, a, a + 4, 0.22, 0.75)
    scr = src.crop(PHONE_BOX)
    pe = eexp(prog(lt, 0.0, 1.0))
    tilt = 0.08 * (1 - pe)
    ph = phone_mock(scr, t, tilt)
    sc = 0.98 + 0.02 * math.sin(lt * 0.8)
    ph = ph.resize((int(ph.width * sc), int(ph.height * sc)), Image.BICUBIC)
    cx = 1300 + 260 * (1 - pe); cy = 540 + 6 * math.sin(lt * 1.3) + 80 * (1 - pe)
    glow = Image.new("RGBA", (ph.width + 200, ph.height + 200), (0, 0, 0, 0))
    ImageDraw.Draw(glow).rounded_rectangle((100, 100, ph.width + 100, ph.height + 100), 70, fill=(255, 120, 40, 60))
    glow = glow.resize((glow.width // 6, glow.height // 6)).filter(ImageFilter.GaussianBlur(10)).resize((glow.width, glow.height), Image.BILINEAR)
    c.alpha_composite(glow, (int(cx - glow.width / 2), int(cy - glow.height / 2)))
    c.alpha_composite(with_alpha(ph, clamp(pe * 1.5)), (int(cx - ph.width / 2), int(cy - ph.height / 2)))
    if variant == "A":
        title2(c, t, a + 0.3, b + 1, "telefonda", "NASIL GÖRÜNÜYOR?", 110, 200, s1=88, s2=74)
        chips(c, t, [(84.7, "araçlar"), (85.6, "bilgi ekranları"), (86.6, "ekspertiz paneli")], 115, 470, b + 1)
        tagn = ("02", "telefon görünümü")
    else:
        title2(c, t, a + 0.3, b + 1, "eklediğimiz", "BMW MOBİLDE", 110, 200, s1=88, s2=96)
        chips(c, t, [(305.7, "ekrana sığıyor mu?"), (306.9, "paneller açılıyor mu?")], 115, 470, b + 1)
        tagn = None
    if tagn:
        im, pad = word_img(f"{tagn[0]}  ·  {tagn[1]}", ("sans", 24, 600), (235, 232, 225))
        c.alpha_composite(with_alpha(im, 0.8 * clamp(lt * 3)), (64 - pad, 44 - pad))
        ImageDraw.Draw(c).rectangle((44, 44, 48, 72), fill=ORANGE + (255,))
    pi = prog(lt, 0.8, 1.3)
    if pi > 0:
        crow(c, "isaret", 640 - 300 * (1 - eback(pi, 1.3)), 1050 - 3 * abs(math.sin(t * 6.5)), f, 420,
             2 - spring(lt - 1.3, .07), spring(lt - 1.3, .07), glow=0.75)
    return c

def scene_ba(src, t, f, a, b):
    lt = t - a
    c = BG_DARK.copy()
    before = src.crop((40, 280, 940, 686)); after = src.crop((980, 280, 1880, 686))
    cw = 1500; chh = int(406 * cw / 900)
    before = before.resize((cw, chh), Image.LANCZOS); after = after.resize((cw, chh), Image.LANCZOS)
    pe = eexp(prog(lt, 0, 0.8))
    x0 = (W - cw) // 2; y0 = 300 + int(40 * (1 - pe))
    # wipe: after revealed from right to left, sweeping twice
    if lt < 1.4: wp = 0.0
    elif lt < 3.0: wp = eio(prog(lt, 1.4, 3.0)) * 0.5
    elif lt < 4.0: wp = 0.5
    else: wp = 0.5 + 0.5 * eio(prog(lt, 4.0, 5.2))
    comp = before.copy()
    cut = int(cw * (1 - wp))
    if cut < cw: comp.paste(after.crop((cut, 0, cw, chh)), (cut, 0))
    comp = comp.convert("RGBA")
    m = Image.new("L", comp.size, 0); ImageDraw.Draw(m).rounded_rectangle((0, 0, cw - 1, chh - 1), 18, fill=255); comp.putalpha(m)
    sh = SHADOW.resize((int(cw * 400 / 280), int(chh * 240 / 120)), Image.BILINEAR)
    ls = Image.new("RGBA", sh.size, (0, 0, 0, 0)); ls.putalpha(sh)
    c.alpha_composite(ls, (int(x0 - (sh.width - cw) / 2), int(y0 - (sh.height - chh) / 2 + 25)))
    c.alpha_composite(with_alpha(comp, clamp(pe * 1.4)), (x0, y0))
    if 0 < wp < 1:
        lx = x0 + cut
        line = Image.new("RGBA", (40, chh + 40), (0, 0, 0, 0))
        ImageDraw.Draw(line).rectangle((18, 0, 21, chh + 40), fill=GOLD + (255,))
        gl = line.filter(ImageFilter.GaussianBlur(8))
        c.alpha_composite(gl, (lx - 20, y0 - 20)); c.alpha_composite(gl, (lx - 20, y0 - 20)); c.alpha_composite(line, (lx - 20, y0 - 20))
    # labels
    lb1, p1 = word_img("önce", ("ser", 54), WHITE); lb2, p2 = word_img("sonra", ("ser", 54), ORANGE)
    blur_in(c, lb1, x0 - p1, y0 + chh + 20 - p1, t, a + 0.6)
    blur_in(c, lb2, x0 + cw - (lb2.width - 2 * p2) - p2, y0 + chh + 20 - p2, t, a + 1.4)
    def row(t0, t1, l1, l2):
        al = 1 - smooth(prog(t, t1 - 0.25, t1))
        if al <= 0 or t < t0: return
        i1, p1 = word_img(l1, ("ser", 72), WHITE)
        i2, p2 = word_img(l2, ("sans", 84), ORANGE, glow=GLOW)
        w1, w2 = i1.width - 2 * p1, i2.width - 2 * p2
        x = (W - (w1 + 34 + w2)) / 2
        blur_in(c, i1, x - p1, 120 - p1, t, t0, alpha=al)
        blur_in(c, i2, x + w1 + 34 - p2, 112 - p2, t, t0 + 0.25, scale0=1.2, rise=0, alpha=al)
    row(a + 0.2, a + 4.8, "Mercedes →", "BMW 4 SERİSİ")
    row(a + 4.85, b + 1, "Garden Motors →", "MTG MOTORS")
    return c

def chapter_card(c, t, a, num, l1, l2=None):
    blur_in(c, word_img(num, ("sans", 330), ORANGE, glow=GLOW)[0], 140 - 50, 230 - 50, t, a + 0.15, scale0=1.3, rise=0)
    blur_in(c, word_img(l1, ("ser", 110), WHITE)[0], 160 - 50, 610 - 50, t, a + 0.45)
    pl = eexp(prog(t, a + 0.6, a + 1.0))
    ImageDraw.Draw(c).rectangle((168, 590, 168 + 420 * pl, 593), fill=ORANGE + (255,))
    if l2:
        blur_in(c, word_img(l2, ("sans", 40, 700), (230, 226, 218), track=6)[0], 165 - 50, 770 - 50, t, a + 0.8)

def scene_gen(src, t, f, seg):
    a, b, name = seg
    lt = t - a
    if name in ("phoneA", "phoneB"):
        return scene_phone(src, t, f, a, b, "A" if name == "phoneA" else "B")
    if name == "ba":
        return scene_ba(src, t, f, a, b)
    c = BG_DARK.copy()
    if name == "nasil":
        light_leak(c, t, a - 0.2, b + 0.5, 0.3, 0.25)
        cx, by = 560, 1000
        pd = eio(prog(lt, 0.0, 1.3)); alive = prog(lt, 1.3, 1.6)
        if alive < 1 and pd > 0:
            la = lineart_layer(pd, 1 - alive)
            c.alpha_composite(la, (int(cx - la.width / 2), int(by - la.height)))
        if alive > 0:
            sq = spring(lt - 1.3, 0.07)
            crow(c, "anlatan", cx, by - 5 * math.sin(t * 2.2), f, 700, 2 - sq, sq, alpha=eo(alive), glow=0.55 + 0.6 * (1 - alive))
            fl = 1 - prog(lt, 1.3, 1.6)
            if fl > 0: c.alpha_composite(Image.new("RGBA", (W, H), (255, 200, 150, int(60 * fl))))
        title2(c, t, a + 0.5, b + 1, "peki ben", "NASIL YAPTIM?", 960, 330, s1=110, s2=104)
    elif name == "check":
        light_leak(c, t, a, b + 1, 0.2, 0.7)
        title2(c, t, a + 0.1, b + 1, "küçük ekranda", "KONTROL LİSTESİ", 110, 170, s1=88, s2=84)
        chips(c, t, [(a + 0.3, "yazılar okunuyor mu?"), (a + 0.9, "araç ekrana sığıyor mu?"), (a + 1.5, "düğmeler rahat mı?")], 115, 450, b + 1, size=44)
        pi = prog(lt, 0.1, 0.5)
        crow(c, "dusunen", 1480 + 500 * (1 - eback(pi, 1.2)), 1000, f, 640, 1, spring(lt - 0.5, .05), glow=0.8)
    elif name == "net":
        title2(c, t, a + 0.15, b + 1, "uzun uzun değil,", "NET ANLAT", 1000, 330, s1=96, s2=130)
        blur_in(c, word_img("hangi araç? yerine ne gelecek?", ("sans", 38, 600), (220, 216, 208))[0], 1000 - 50, 600 - 50, t, a + 0.9)
        pi = prog(lt, 0.0, 0.45)
        crow(c, "anlatan", 560 - 500 * (1 - eback(pi, 1.3)), 1000 - 4 * abs(math.sin(t * 6.5)), f, 680, 2 - spring(lt - .45, .07), spring(lt - .45, .07), glow=0.8)
    elif name == "blender":
        light_leak(c, t, a, b + 1, 0.25, 0.7)
        title2(c, t, a + 0.15, b + 1, "renk ve malzeme", "BLENDER", 110, 330, s1=96, s2=150)
        blur_in(c, word_img("istersen sonradan düzenle", ("sans", 38, 600), (220, 216, 208))[0], 115 - 50, 640 - 50, t, a + 0.9)
        pi = prog(lt, 0.0, 0.5)
        crow(c, "pc", 1450 + 600 * (1 - eback(pi, 1.2)), 950 - abs(2 * math.sin(lt * 46)) * (lt > .7), f, 600, 1, spring(lt - .5, .05), glow=0.9)
    elif name == "baslangic":
        sw = 249.44 - a  # switch to sectors
        if lt < sw + 0.4:
            al = 1 - smooth(prog(lt, sw, sw + 0.4))
            title2(c, t, a + 0.15, a + sw + 0.4, "bu sadece", "BAŞLANGIÇ", 980, 360, s1=110, s2=124, fout=0.4)
            crow(c, "anlatan", 560, 1000 - 4 * abs(math.sin(t * 6.5)), f, 680, alpha=al * clamp(lt * 4), glow=0.8)
        if lt >= sw:
            st = a + sw
            title2(c, t, st + 0.1, b + 1, "aynı fikir,", "FARKLI SEKTÖRLER", W / 2, 120, s1=80, s2=96, align="center")
            items = [("otomobil galerisi", st + 0.6), ("kuyumcu", 252.84), ("ürün showroomu", 254.6)]
            bx = [230, 760, 1290]
            for i, (txt, ti) in enumerate(items):
                p = prog(t, ti, ti + 0.4)
                if p <= 0: continue
                e = eexp(p)
                card = Image.new("RGBA", (420, 220), (0, 0, 0, 0))
                d = ImageDraw.Draw(card)
                hl = (i == 1 and t > 252.84) or (i == 2 and t > 254.6) or (i == 0 and t < 252.84)
                d.rounded_rectangle((0, 0, 419, 219), 22, fill=(18, 20, 32, 230), outline=(ORANGE + (220,)) if hl else (255, 255, 255, 50), width=3 if hl else 1)
                im, pad = word_img(txt, ("ser", 52), WHITE if hl else (180, 178, 172))
                card.alpha_composite(im, (int(210 - im.width / 2), int(110 - im.height / 2)))
                c.alpha_composite(with_alpha(card, e), (bx[i], int(470 + 40 * (1 - e))))
                if i > 0:
                    ar, pa = word_img("→", ("sans", 70, 700), ORANGE)
                    c.alpha_composite(with_alpha(ar, e), (bx[i] - 92 - pa, 545 - pa))
            pi = prog(t, st + 0.3, st + 0.8)
            if pi > 0:
                crow(c, "sevinen", 1660, 1060 + 400 * (1 - eback(pi, 1.3)), f, 340, glow=0.8)
    elif name == "ch08":
        light_leak(c, t, a, b + 1, 0.3, 0.3)
        chapter_card(c, t, a, "08", "bağlantıyla paylaş", "NETLIFY İLE TEK LİNK")
        pi = prog(lt, 0.2, 0.7)
        crow(c, "isaret", 1500 + 600 * (1 - eback(pi, 1.2)), 1000, f, 560, flip=True, glow=0.8)
    elif name == "warn":
        title2(c, t, a + 0.15, b + 1, "dikkat:", "SON DOSYALARI YÜKLE", 830, 340, s1=110, s2=68)
        blur_in(c, word_img("paylaşmadan önce en güncel sürümü kontrol et", ("sans", 34, 600), (220, 216, 208))[0], 835 - 50, 560 - 50, t, a + 0.9)
        sq = spring(lt, 0.12, 7, 20)
        crow(c, "sasiran", 440, 1010, f, 660, 2 - sq, sq, glow=0.9)
        sh = math.exp(-lt * 9) * 10
        if sh > 0.5: c = c.transform((W, H), Image.AFFINE, (1, 0, random.uniform(-sh, sh), 0, 1, random.uniform(-sh, sh)), Image.BILINEAR)
    elif name == "msg":
        title2(c, t, a + 0.1, b + 1, "firmaya kısa bir", "DEMO MESAJI", 110, 120, s1=80, s2=96)
        msg = "Merhaba! Firmanız için 3D bir showroom örneği hazırladım. Kendi araçlarınızla görmek için: mtgmotors.netlify.app"
        n = int(len(msg) * clamp((t - (a + 0.8)) / 4.2))
        bw = 960
        bub = Image.new("RGBA", (bw, 300), (0, 0, 0, 0))
        d = ImageDraw.Draw(bub)
        pe = eexp(prog(lt, 0.5, 0.9))
        if pe > 0:
            d.rounded_rectangle((0, 0, bw - 1, 290), 30, fill=(28, 31, 46, 240), outline=(255, 255, 255, 40))
            fnt = SANS(36, 500)
            words = msg[:n].split(" "); lines, cur = [], ""
            for wd in words:
                if fnt.getlength(cur + " " + wd) > bw - 80: lines.append(cur); cur = wd
                else: cur = (cur + " " + wd).strip()
            lines.append(cur)
            for i, ln in enumerate(lines[:5]):
                if "netlify" in ln:
                    pre, _, post = ln.partition("mtgmotors")
                    d.text((40, 36 + i * 54), pre, font=fnt, fill=WHITE)
                    d.text((40 + fnt.getlength(pre), 36 + i * 54), "mtgmotors" + post, font=fnt, fill=ORANGE)
                else:
                    d.text((40, 36 + i * 54), ln, font=fnt, fill=WHITE)
            if n < len(msg) and (f // 8) % 2 == 0:
                lx = 40 + fnt.getlength(lines[-1]) + 4; ly = 36 + (len(lines) - 1) * 54
                d.rectangle((lx, ly + 4, lx + 3, ly + 44), fill=ORANGE + (255,))
            c.alpha_composite(with_alpha(bub, pe), (110, int(400 + 30 * (1 - pe))))
        pi = prog(lt, 0.2, 0.7)
        crow(c, "pc", 1520 + 600 * (1 - eback(pi, 1.2)), 960 - abs(2 * math.sin(lt * 46)) * (0.8 < lt < 5.2), f, 560, glow=0.9)
    elif name == "outro":
        light_leak(c, t, a - 0.3, a + 3.5, 0.3, 0.3)
        sq = spring(lt, 0.1)
        crow(c, "sevinen", 500, 1000, f, 680, 2 - sq, sq, glow=0.9)
        title2(c, t, a + 0.2, b + 2, "görüşürüz", "KARGA ZİHNİ", 950, 360, s1=110, s2=100)
        blur_in(c, word_img("yapay zekâyla fikirden gerçeğe", ("sans", 34, 600), (220, 216, 208))[0], 955 - 50, 640 - 50, t, a + 0.9)
    return c

# ============ transitions ============
def zoom_in(img, z, cx, cy):
    vw, vh = W / z, H / z
    box = (cx - vw * cx / W, cy - vh * cy / H, cx - vw * cx / W + vw, cy - vh * cy / H + vh)
    return img.resize((W, H), Image.BILINEAR, box=box)

def zoom_blur(img, cx, cy, amount, n=7):
    if amount < 0.01: return img
    acc = np.zeros((H, W, 3), np.float32)
    for i in range(n):
        acc += np.asarray(zoom_in(img, 1 + amount * i / (n - 1), cx, cy).convert("RGB"), np.float32)
    return Image.fromarray((acc / n).astype(np.uint8)).convert("RGBA")

def trans(A, B, p, style):
    if style == "zoom":
        if p < 0.5:
            q = eio(p * 2) ** 2
            return zoom_blur(zoom_in(A, 1 + 1.6 * q, 960, 540), 960, 540, 0.3 * q)
        q = 1 - eio((p - 0.5) * 2)
        return zoom_blur(zoom_in(B, 1 + 0.5 * q, 960, 540), 960, 540, 0.25 * q)
    e = eio(p)
    c = Image.new("RGBA", (W, H))
    c.alpha_composite(A, (int(-W * e), 0)); c.alpha_composite(B, (int(W * (1 - e)), 0))
    sp = math.sin(math.pi * p); k = int(1 + 80 * sp)
    if k > 2:
        arr = np.asarray(c.convert("RGB"), np.float32)
        cs = np.cumsum(np.pad(arr, ((0, 0), (k, 0), (0, 0)), mode="edge"), axis=1)
        c = Image.fromarray(((cs[:, k:] - cs[:, :-k]) / k).astype(np.uint8)).convert("RGBA")
    return c

def boundary_style(i): return "zoom" if i % 2 == 0 else "whip"

# ============ frame composer ============
class Renderer:
    def __init__(self):
        self.last_screen = None
    def screen_full(self, src, t, f):
        c = render_screen(src, t, f)
        overlays(c, t, f)
        chapter_sting(c, t)
        chapter_tag(c, t)
        return c
    def frame(self, src, f):
        t = f / FPS
        g = gen_at(t)
        # transitions at segment starts
        for i, (a, b, n) in enumerate(GENB):
            if a <= t < a + TR_D:
                prev = GENB[i - 1] if i > 0 and abs(GENB[i - 1][1] - a) < 1e-3 else None
                A = scene_gen(src, t, f, prev) if prev else (self.last_screen if self.last_screen is not None else scene_gen(src, t, f, (a, b, n)))
                out = trans(A, scene_gen(src, t, f, (a, b, n)), prog(t, a, a + TR_D), boundary_style(i))
                subtitle(out, t); return out
            if b <= t < b + TR_D and gen_at(t) is None:
                scr = self.screen_full(src, t, f); self.last_screen = scr
                out = trans(scene_gen(src, t, f, (a, b, n)), scr, prog(t, b, b + TR_D), boundary_style(i + 1))
                subtitle(out, t); return out
        if g:
            c = scene_gen(src, t, f, g)
        else:
            c = self.screen_full(src, t, f)
            self.last_screen = c
        subtitle(c, t)
        return c

# ============ audio ============
SR = 48000
def build_audio():
    wf = wave.open(f"{S}/src/audio48.wav")
    voice = np.frombuffer(wf.readframes(wf.getnframes()), np.int16).reshape(-1, 2).astype(np.float32).mean(1) / 32768
    n = int(DUR * SR) + SR
    voice = np.pad(voice, (0, max(0, n - len(voice))))[:n]
    r = np.random.default_rng(5)
    L = np.zeros(n, np.float32); R = np.zeros(n, np.float32)
    def add(sig, t, g=1.0, pan=0.0):
        i = int(t * SR); j = min(n, i + len(sig))
        if j <= i or i < 0: return
        L[i:j] += sig[: j - i] * g * (1 - max(0, pan)); R[i:j] += sig[: j - i] * g * (1 + min(0, pan))
    # --- music bed: warm keys + soft sub + brushed hat, 84 bpm, Am F C G
    bpm = 84; beat = 60 / bpm; bar = beat * 4
    roots = [(220.0, 261.63, 329.63), (174.61, 220.0, 261.63), (130.81, 164.81, 196.0), (196.0, 246.94, 293.66)]
    mus = np.zeros(n, np.float32)
    def put(i, sig):
        j = min(n, i + len(sig))
        if j > i >= 0: mus[i:j] += sig[: j - i]
    def keys(freqs, dur, vel=1.0):
        m = int(dur * SR); st = np.arange(m) / SR
        env = (1 - np.exp(-st * 30)) * np.exp(-st * 1.1)
        s = np.zeros(m, np.float32)
        for fr in freqs:
            s += (np.sin(2 * np.pi * fr * st) + 0.25 * np.sin(2 * np.pi * fr * 2 * st) * np.exp(-st * 3) + 0.06 * np.sin(2 * np.pi * fr * 3 * st) * np.exp(-st * 6))
        trem = 1 + 0.08 * np.sin(2 * np.pi * 4.5 * st)
        return (s * env * trem * 0.045 * vel).astype(np.float32)
    nb = int(DUR / bar) + 1
    for k in range(nb):
        ch = roots[k % 4]; t0 = k * bar
        i0 = int(t0 * SR)
        sig = keys(ch, bar * 1.15)
        put(i0, sig)
        for bt in (1.5, 2.5, 3.5):  # offbeat light stabs
            s2 = keys((ch[1] * 2, ch[2] * 2), beat * 0.9, 0.35)
            put(int((t0 + bt * beat) * SR), s2)
        m = int(bar * SR); st = np.arange(m) / SR
        sub = (np.sin(2 * np.pi * ch[0] / 2 * st) * np.minimum(1, st * 8) * np.exp(-st * 0.9) * 0.09).astype(np.float32)
        put(i0, sub)
        for bt in range(8):
            hm = int(0.08 * SR); hs = np.arange(hm) / SR
            hat = (np.diff(r.normal(0, 1, hm + 1)) * np.exp(-hs * 60) * (0.012 if bt % 2 else 0.006)).astype(np.float32)
            put(int((t0 + bt * beat / 2) * SR), hat)
    # music: intro/outro louder, ducked under voice
    env = np.abs(voice)
    k = int(0.05 * SR)
    env = np.convolve(env, np.ones(k) / k, "same")
    env = np.convolve(env, np.ones(int(0.3 * SR)) / int(0.3 * SR), "same")
    duck = 1 - 0.55 * np.clip(env / 0.03, 0, 1)
    tt = np.arange(n) / SR
    mgain = 0.55 * duck * np.minimum(1, tt / 2.0) * np.clip((DUR - tt) / 3.0, 0, 1)
    mus *= mgain
    L += mus; R += mus
    # --- sfx
    def lpnoise(m, a):
        x = r.normal(0, 1, m).astype(np.float32); y = np.empty_like(x); acc = 0.0
        for i in range(m): acc += a[i] * (x[i] - acc); y[i] = acc
        return y
    def impact(g=1.0):
        m = int(1.2 * SR); st = np.arange(m) / SR
        f = 40 + 80 * np.exp(-st * 18)
        s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-st * 3.5)
        nz = np.convolve(r.normal(0, 1, m), np.ones(40) / 40, "same") * np.exp(-st * 10) * 1.2
        return ((s + nz) * g).astype(np.float32)
    def whoosh(d=0.45):
        m = int(d * SR)
        y = lpnoise(m, np.sin(np.linspace(0, np.pi, m)) * 0.3 + 0.01)
        return (y * np.sin(np.linspace(0, np.pi, m)) ** 2 * 2.4).astype(np.float32)
    def riser(d=0.9):
        m = int(d * SR); st = np.arange(m) / SR
        y = lpnoise(m, np.linspace(0.005, 0.35, m) ** 1.5) * 2.4
        return ((y + np.sin(2 * np.pi * np.cumsum(np.linspace(200, 1200, m)) / SR) * 0.06) * (st / d) ** 2).astype(np.float32)
    def tick(fr=2200):
        m = int(0.06 * SR); st = np.arange(m) / SR
        return (np.sin(2 * np.pi * fr * st) * np.exp(-st * 90) * 0.22).astype(np.float32)
    def pop():
        m = int(0.12 * SR); st = np.arange(m) / SR
        return (np.sin(2 * np.pi * (380 + 700 * st / 0.12) * st) * np.exp(-st * 35) * 0.35).astype(np.float32)
    def shimmer(d):
        m = int(d * SR); st = np.arange(m) / SR
        s = sum(np.sin(2 * np.pi * fr * st) * (0.5 + 0.5 * np.sin(2 * np.pi * (3 + k) * st)) for k, fr in enumerate((1760, 2349, 2637, 3520)))
        return (s * np.sin(np.linspace(0, np.pi, m)) * 0.018).astype(np.float32)
    for i, (a, b, nme) in enumerate(GENB):
        add(whoosh(), a - 0.12, 0.5)
        if b < DUR - 1: add(whoosh(), b - 0.12, 0.45)
        if nme in ("nasil",): add(shimmer(1.4), a, 1.0); add(impact(0.4), a + 1.3)
        if nme in ("warn",): add(impact(0.7), a)
        if nme in ("ch08",): add(impact(0.5), a + 0.15)
        if nme in ("outro",): add(impact(0.5), a + 0.1)
    for tc, nn, ss in CH_STING:
        add(riser(0.8), tc - 0.75, 0.35); add(impact(0.55), tc + 0.05)
    for co in CALLOUTS:
        a = co[0]
        add(tick(), a, 0.8, -0.3); add(tick(1800), a + 0.28, 0.6, -0.3)
    for a, b, items in CHIPS:
        for ti, _ in items: add(tick(2600), ti, 0.5, -0.4)
    for a, b, pose in PEEKS:
        add(pop(), a + 0.1, 0.6, 0.4)
    for a, b, *_ in HOLDS:
        add(whoosh(0.35), a - 0.05, 0.12)
    mix = np.stack([L + voice * 1.0, R + voice * 1.0], 1)
    mix = np.tanh(mix * 1.05) * 0.95
    raw = f"{OUT}/mix_raw.wav"
    with wave.open(raw, "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((mix * 32767).astype(np.int16).tobytes())
    # music-free stem for the creator to add their own track
    mix2 = np.stack([L - mus + voice, R - mus + voice], 1); mix2 = np.tanh(mix2 * 1.05) * 0.95
    with wave.open(f"{OUT}/mix_nomusic_raw.wav", "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((mix2 * 32767).astype(np.int16).tobytes())
    return raw

# ============ rendering ============
def decode(f0, nf):
    p = subprocess.Popen(["ffmpeg", "-v", "error", "-ss", f"{f0 / FPS:.4f}", "-i", SRC, "-frames:v", str(nf), "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], stdout=subprocess.PIPE)
    while True:
        b = p.stdout.read(W * H * 3)
        if len(b) < W * H * 3: break
        yield Image.frombytes("RGB", (W, H), b)
    p.wait()

def render_chunk(args):
    k, f0, f1 = args
    out = f"{OUT}/chunk_{k:02d}.mp4"
    if os.path.exists(out + ".done"): return out
    rd = Renderer()
    enc = subprocess.Popen(["ffmpeg", "-y", "-v", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
                            "-c:v", "libx264", "-preset", "medium", "-crf", "17", "-pix_fmt", "yuv420p", "-g", "60", out], stdin=subprocess.PIPE)
    f = f0
    last = None
    for src in decode(f0, f1 - f0):
        img = finish(rd.frame(src, f), f, f / FPS)
        enc.stdin.write(img.tobytes()); last = img; f += 1
        if (f - f0) % 300 == 0: print(f"chunk {k}: {f - f0}/{f1 - f0}", flush=True)
    while f < f1:  # pad if decoder came up short
        enc.stdin.write(last.tobytes()); f += 1
    enc.stdin.close(); enc.wait()
    open(out + ".done", "w").write("ok")
    return out

def chunks(target=24.0):
    """Split only inside screen segments, far from any generated boundary."""
    edges = sorted({e for a, b, _ in GENB for e in (a, b)})
    cuts = [0]
    t = target
    while t < DUR - 5:
        ok = gen_at(t) is None and all(abs(t - e) > 1.5 for e in edges) and not any(tc - 1 <= t <= tc + 2.5 for tc, *_ in CH_STING)
        if ok:
            cuts.append(int(t * FPS)); t += target
        else:
            t += 0.5
    cuts.append(NFR)
    return [(i, cuts[i], cuts[i + 1]) for i in range(len(cuts) - 1)]

if __name__ == "__main__":
    mode = sys.argv[2]
    if mode == "stills":
        for ts in sys.argv[3:]:
            t = float(ts); f = int(round(t * FPS))
            rd = Renderer()
            # warm up last_screen for transitions
            src = next(decode(max(0, f - 20), 1))
            if gen_at(f / FPS - 0.5) is None: rd.frame(src, max(0, f - 15))
            src = next(decode(f, 1))
            finish(rd.frame(src, f), f, t).save(f"{OUT}/st_{t:07.2f}.png")
        print("ok")
    elif mode == "audio":
        print(build_audio())
    elif mode == "render":
        from multiprocessing import Pool
        nw = int(sys.argv[3]) if len(sys.argv) > 3 else 4
        cs = chunks()
        print("chunks", len(cs), flush=True)
        raw = build_audio()
        with Pool(nw) as pool:
            files = pool.map(render_chunk, cs, chunksize=1)
        lst = f"{OUT}/concat.txt"
        open(lst, "w").write("".join(f"file '{x}'\n" for x in files))
        subprocess.run(["ffmpeg", "-y", "-v", "error", "-f", "concat", "-safe", "0", "-i", lst, "-c", "copy", f"{OUT}/video_only.mp4"], check=True)
        for wavname, outname in (("mix_raw.wav", "Karga_Zihni_3D_Showroom_PREMIUM.mp4"), ("mix_nomusic_raw.wav", "Karga_Zihni_3D_Showroom_PREMIUM_muziksiz.mp4")):
            subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", f"{OUT}/video_only.mp4", "-i", f"{OUT}/{wavname}",
                            "-af", "highpass=f=60,acompressor=threshold=-20dB:ratio=2.5:attack=8:release=120,loudnorm=I=-14:TP=-1.2:LRA=9",
                            "-c:v", "copy", "-c:a", "aac", "-b:a", "256k", "-ar", "48000", "-shortest", "-movflags", "+faststart", f"{OUT}/{outname}"], check=True)
        print("done")
