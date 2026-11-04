# Akış motorundan alınan ortak parçalar (render_akis.py)
import math, os, sys
from contextlib import contextmanager
import numpy as np
import skia
A = os.environ["AKIS_ASSETS"]
HERE = os.environ["AKIS_KANAL"]
W, H = 1920, 1080
# ================= palet =================
def C(h, a=1.0):
    h = h.lstrip("#")
    return skia.Color4f(int(h[0:2], 16) / 255, int(h[2:4], 16) / 255, int(h[4:6], 16) / 255, a)

BG = "#F6F4EF"        # sıcak kırık beyaz (referanstaki lavanta beyazın Karga karşılığı)
BG_EDGE = "#EAE6DE"
INK = "#14182B"       # lacivert-siyah yazı
NAVY = "#1A1F36"      # karga lacivert: üst düğümler, koyu kartlar
ORANGE = "#FF741E"    # atkı turuncusu: düğümler, butonlar
ORANGE_T = "#E2560A"  # açık zeminde okunur turuncu (italik vurgu kelimeleri)
LINE = "#FFC09A"      # bağlantı çizgileri
MUTED = "#7D8296"
SOFT = "#EFEBE4"      # kart içi boş alanlar
CARD = "#FFFFFF"

# ================= yardımcılar =================
def clamp(x, a=0.0, b=1.0): return max(a, min(b, x))
def prog(t, a, b): return clamp((t - a) / (b - a)) if b > a else float(t >= a)
def lerp(a, b, p): return a + (b - a) * p
def eout(x): return 1 - (1 - x) ** 4                     # yumuşak duruş (görünme)
def eio(x): return 4 * x ** 3 if x < .5 else 1 - (-2 * x + 2) ** 3 / 2   # kamera
def eback(x, s=1.6): x -= 1; return 1 + (s + 1) * x ** 3 + s * x ** 2

def paint(color, a=1.0, stroke=None, cap=True):
    p = skia.Paint(AntiAlias=True)
    p.setColor4f(C(color, a) if isinstance(color, str) else color)
    if stroke:
        p.setStyle(skia.Paint.kStroke_Style); p.setStrokeWidth(stroke)
        if cap: p.setStrokeCap(skia.Paint.kRound_Cap); p.setStrokeJoin(skia.Paint.kRound_Join)
    return p

TF = {}
def font(k, size):
    files = {"b": "InterTight800", "s": "InterTight600", "m": "InterTight500", "i": "InstrumentSerifItalic", "mono": "JBMono"}
    if k not in TF: TF[k] = skia.Typeface.MakeFromFile(f"{A}/fonts/{files[k]}.ttf")
    f = skia.Font(TF[k], size); f.setSubpixel(True); f.setEdging(skia.Font.Edging.kAntiAlias)
    return f

def text(c, s, x, y, k, size, color, a=1.0, align="left", track=0.0):
    f = font(k, size); w = f.measureText(s) + track * (len(s) - 1)
    if align == "center": x -= w / 2
    elif align == "right": x -= w
    if track:
        for ch in s:
            c.drawString(ch, x, y, f, paint(color, a)); x += f.measureText(ch) + track
    else:
        c.drawString(s, x, y, f, paint(color, a))
    return w

def tw(s, k, size): return font(k, size).measureText(s)

def rrect(c, x, y, w, h, r, color, a=1.0):
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect.MakeXYWH(x, y, w, h), r, r), paint(color, a))

def shadow(c, x, y, w, h, r, a=0.10, blur=26, dy=14):
    p = paint(NAVY, a); p.setMaskFilter(skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, blur))
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect.MakeXYWH(x, y + dy, w, h), r, r), p)

def card(c, x, y, w, h, r=18, color=CARD, a=1.0, sh=0.10):
    shadow(c, x, y, w, h, r, sh * a, 28, 16)
    shadow(c, x, y, w, h, r, sh * .6 * a, 4, 2)
    rrect(c, x, y, w, h, r, color, a)

# ---- görünme / kaybolma: referanstaki imza hareket (bulanık + saydam + hafif büyük -> net)
def appear(t, t0, dur=0.5, t1=None, out=0.35, rise=16, blur=14):
    if t < t0: return None
    p = eout(prog(t, t0, t0 + dur))
    a, b, dy, s = p, (1 - p) * blur, (1 - p) * rise, 1.06 - 0.06 * p
    if t1 is not None and t >= t1:
        q = eio(prog(t, t1, t1 + out))
        if q >= 1: return None
        a *= 1 - q; b += q * 16; s *= 1 + 0.03 * q; dy -= q * 8
    return a, b, dy, s

@contextmanager
def fx(c, st, px, py, bounds=None):
    """st: appear() çıktısı. (px, py) ölçek merkezi. bounds: katman sınırı (hız için)."""
    a, b, dy, s = st
    plain = a > .999 and b < .25 and abs(dy) < .05 and abs(s - 1) < .001
    if plain:
        yield; return
    p = skia.Paint(); p.setAlphaf(clamp(a))
    if b > .25: p.setImageFilter(skia.ImageFilters.Blur(b, b))
    if bounds is not None:
        x0, y0, x1, y1 = bounds; m = b * 3 + 30
        c.saveLayer(skia.Rect.MakeLTRB(x0 - m, y0 - m + min(0, dy), x1 + m, y1 + m + max(0, dy)), p)
    else:
        c.saveLayer(None, p)
    c.translate(px, py + dy); c.scale(s, s); c.translate(-px, -py)
    try:
        yield
    finally:
        c.restore()

# ================= ikonlar (24'lük kutuda, Lucide tarzı çizgi) =================
ICONS = {
    "star": '<path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9z"/>',
    "check": '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    "car": '<path d="M3.5 16.5v-4l2.2-5h12.6l2.2 5v4"/><path d="M3.5 12.5h17"/><circle cx="7.5" cy="16.5" r="2"/><circle cx="16.5" cy="16.5" r="2"/>',
    "store": '<path d="M3 9.5l1.7-5h14.6l1.7 5"/><path d="M3 9.5h18"/><path d="M5 9.5v10h14v-10"/><path d="M10 19.5v-5h4v5"/>',
    "key": '<circle cx="7.5" cy="15.5" r="4"/><path d="M10.5 12.5L20 3"/><path d="M16.5 6.5l2.5 2.5"/><path d="M14 9l2 2"/>',
    "tag": '<path d="M3 12V4h8l10 10-7 7z"/><circle cx="7.5" cy="7.5" r="1.4"/>',
    "cube": '<path d="M12 2.8l8.5 4.7v9L12 21.2l-8.5-4.7v-9z"/><path d="M3.5 7.5L12 12l8.5-4.5"/><path d="M12 12v9.2"/>',
    "pencil": '<path d="M4 20l.6-4.2L16 4.4l3.6 3.6L8.2 19.4z"/><path d="M13.8 6.6l3.6 3.6"/>',
    "link": '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
    "door": '<path d="M5 21V4h14v17"/><path d="M3 21h18"/><circle cx="15" cy="12.5" r=".9"/>',
    "orbit": '<circle cx="12" cy="12" r="3"/><path d="M12 3a9 9 0 0 1 9 9"/><path d="M12 21a9 9 0 0 1-9-9"/><path d="M18.5 5.5l2.5 6.5-6.5-2.5"/>',
    "info": '<circle cx="12" cy="12" r="9"/><path d="M12 11v5.5"/><path d="M12 7.6v.1"/>',
    "zip": '<path d="M6 2.5h8.5L19.5 7.5V21.5H6z"/><path d="M14 2.5v5.5h5.5"/><path d="M10.5 6v1.5M10.5 9.5V11M10.5 13v1.5"/><rect x="9" y="15.8" width="3" height="3" rx=".6"/>',
    "msg": '<path d="M4 5h16v11H9l-5 4z"/>',
    "lock": '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
    "pin": '<path d="M9 3h6l-1 6 3.5 3.5h-11L10 9z"/><path d="M12 12.5V21"/>',
    "thumb": '<path d="M7 10.5v10H3.8v-10z"/><path d="M7 10.5l4.2-8c1.7 0 2.8 1.2 2.4 3l-.9 3.8h5.6c1.4 0 2.4 1.3 2.1 2.6l-1.6 7c-.2 1-1.1 1.6-2.1 1.6H7"/>',
    "bell": '<path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.8 2H4.2z"/><path d="M10 21a2.2 2.2 0 0 0 4 0"/>',
    "sparkle": '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/>',
}
_ICON_IMG = {}
def icon_img(name, color, fill=False, sw=2.0):
    key = (name, color, fill, sw)
    if key in _ICON_IMG: return _ICON_IMG[key]
    body = ICONS[name]
    if fill: body = body.replace("<path ", f'<path fill="{color}" ', 1)
    svg = (f'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="{color}" '
           f'stroke-width="{sw}" stroke-linecap="round" stroke-linejoin="round">{body}</svg>').encode()
    dom = skia.SVGDOM.MakeFromStream(skia.MemoryStream(svg)); dom.setContainerSize(skia.Size(24, 24))
    S = 192
    s = skia.Surface.MakeRaster(skia.ImageInfo.Make(S, S, skia.ColorType.kRGBA_8888_ColorType, skia.AlphaType.kPremul_AlphaType))
    cv = s.getCanvas(); cv.clear(skia.Color4f(0, 0, 0, 0)); cv.scale(S / 24, S / 24); dom.render(cv)
    img = s.makeImageSnapshot().withDefaultMipmaps()
    _ICON_IMG[key] = img
    return img

SAMP = skia.SamplingOptions(skia.FilterMode.kLinear, skia.MipmapMode.kLinear)
def icon(c, name, cx, cy, size, color="#FFFFFF", fill=False, a=1.0, sw=2.0):
    p = skia.Paint(AntiAlias=True); p.setAlphaf(a)
    c.drawImageRect(icon_img(name, color, fill, sw), skia.Rect.MakeXYWH(cx - size / 2, cy - size / 2, size, size), SAMP, p)

def load_image(path, maxw=None):
    from PIL import Image
    im = Image.open(path).convert("RGBA")
    if maxw and im.width > maxw: im = im.resize((maxw, round(im.height * maxw / im.width)), Image.LANCZOS)
    return skia.Image.fromarray(np.ascontiguousarray(np.asarray(im)), colorType=skia.kRGBA_8888_ColorType).withDefaultMipmaps()

_IMG = {}
def img(key):
    if key not in _IMG:
        paths = {"avatar": f"{HERE}/kanal/profil_A_turuncu_800.png"}
        if key.startswith("thumb:"): _IMG[key] = load_image(f"{HERE}/yayin/3d-showroom/{key[6:]}", 640)
        else: _IMG[key] = load_image(paths[key], 400)
    return _IMG[key]

def draw_img_rr(c, im, x, y, w, h, r, a=1.0):
    c.save(); c.clipRRect(skia.RRect.MakeRectXY(skia.Rect.MakeXYWH(x, y, w, h), r, r), True)
    p = skia.Paint(AntiAlias=True); p.setAlphaf(a)
    c.drawImageRect(im, skia.Rect.MakeXYWH(x, y, w, h), SAMP, p); c.restore()

def avatar(c, cx, cy, r, a=1.0):
    c.save(); path = skia.Path(); path.addCircle(cx, cy, r); c.clipPath(path, doAntiAlias=True)
    p = skia.Paint(AntiAlias=True); p.setAlphaf(a)
    c.drawImageRect(img("avatar"), skia.Rect.MakeXYWH(cx - r, cy - r, 2 * r, 2 * r), SAMP, p); c.restore()

# ================= çizgi büyütme =================
def grow(c, pts, p, color=LINE, sw=3.5, a=1.0, tip=True):
    if p <= 0: return
    path = skia.Path(); path.moveTo(*pts[0])
    for q in pts[1:]: path.lineTo(*q)
    pm = skia.PathMeasure(path, False); L = pm.getLength()
    seg = skia.Path(); pm.getSegment(0, L * p, seg, True)
    c.drawPath(seg, paint(color, a, sw))
    if tip and p < 1:
        pos, _ = pm.getPosTan(L * p)
        g = paint(ORANGE, .55 * a); g.setMaskFilter(skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, 9))
        c.drawCircle(pos.x(), pos.y(), 11, g)
        c.drawCircle(pos.x(), pos.y(), 4.5, paint("#FFFFFF", a))

def node(c, t, t0, x, y, r, ic, color=ORANGE, label=None, lsize=26, t1=None, done=None, glow=True):
    st = appear(t, t0, 0.55, t1)
    if not st: return
    with fx(c, st, x, y, (x - r - 160, y - r - 20, x + r + 160, y + r + 60)):
        if glow:
            g = paint(color, .22); g.setMaskFilter(skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, r * .45))
            c.drawCircle(x, y + r * .18, r * 1.0, g)
        c.drawCircle(x, y, r, paint(color))
        icon(c, ic, x, y, r * .95)
        if label: text(c, label, x, y + r + lsize * 1.35, "s", lsize, INK, align="center")
        if done is not None and t >= done:
            q = eback(prog(t, done, done + .35))
            bx, by = x + r * .72, y - r * .72
            c.drawCircle(bx, by, r * .34 * q, paint("#FFFFFF"))
            c.drawCircle(bx, by, r * .34 * q, paint(LINE, 1, 2))
            icon(c, "check", bx, by, r * .42 * q, ORANGE, sw=3)

# ================= kelime kelime yazı =================
def line(c, t, words, cx, base, size, t1=None, color=INK, acc=ORANGE_T, gap=None, align="center"):
    """words: [(kelime, 'b'|'i', zaman)]. Satır son haliyle önceden dizilir, her kelime söylendiği anda belirir."""
    si = size * 1.2
    fs = [("i", si) if k == "i" else ("b", size) for _, k, _ in words]
    ws = [tw(w, k, s) for (w, _, _), (k, s) in zip(words, fs)]
    sp = gap if gap is not None else size * .27
    total = sum(ws) + sp * (len(ws) - 1)
    x = cx - total / 2 if align == "center" else cx
    for (wd, k, t0), (fk, fsz), w in zip(words, fs, ws):
        st = appear(t, t0, 0.45, t1, 0.3, rise=10, blur=12)
        if st:
            with fx(c, st, x + w / 2, base - size * .35, (x, base - size * 1.1, x + w, base + size * .35)):
                text(c, wd, x, base, fk, fsz, acc if k == "i" else color, track=-size * .012 if k == "b" else 0)
        x += w + sp
    return total

def cursor(c, t, keys, clicks=(), t_out=None):
    if t < keys[0][0] - .25: return
    if t_out is not None and t > t_out + .3: return
    a = eout(prog(t, keys[0][0] - .25, keys[0][0])) * (1 - eio(prog(t, t_out, t_out + .3)) if t_out else 1)
    x, y = keys[0][1], keys[0][2]
    for k0, k1 in zip(keys, keys[1:]):
        if t >= k0[0]:
            p = eio(prog(t, k0[0], k1[0])); x, y = lerp(k0[1], k1[1], p), lerp(k0[2], k1[2], p)
            # hafif kavis
            y -= math.sin(p * math.pi) * 40
    s = 1.0
    for ck in clicks:
        if ck - .08 <= t <= ck + .25:
            s = 1 - .18 * math.sin(math.pi * prog(t, ck - .08, ck + .12))
            rr = eout(prog(t, ck, ck + .45))
            c.drawCircle(x, y, 10 + 34 * rr, paint(ORANGE, .45 * (1 - rr) * a, 3))
    pth = skia.Path()
    pts = [(0, 0), (0, 30), (7.5, 23), (12.5, 34.5), (17.5, 32.5), (12.5, 21.5), (22, 21.5)]
    pth.moveTo(*pts[0])
    for q in pts[1:]: pth.lineTo(*q)
    pth.close()
    c.save(); c.translate(x, y); c.scale(1.25 * s, 1.25 * s)
    sp = paint("#000000", .25 * a); sp.setMaskFilter(skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, 3))
    c.save(); c.translate(1.5, 2.5); c.drawPath(pth, sp); c.restore()
    c.drawPath(pth, paint("#FFFFFF", a, 4.5)); c.drawPath(pth, paint(INK, a))
    c.restore()

GRAIN = None
def make_grain():
    rng = np.random.default_rng(3); out = []
    for _ in range(6):
        n = rng.normal(0, 1, (H // 2, W // 2)).astype(np.float32)
        a = np.clip(n * 4 + 4, 0, 10).astype(np.uint8)
        arr = np.zeros((H // 2, W // 2, 4), np.uint8); arr[..., 3] = a
        out.append(skia.Image.fromarray(arr, colorType=skia.kRGBA_8888_ColorType))
    return out

