#!/usr/bin/env python3
"""Karga Zihni — "Akış" stili motion-graphics motoru (skia).

Referans: Efe Cpp — "Kendi Kendine Çalışan Bir Yapay Zeka Şirketi Kurdum" (açık zemin, tek kamera,
blur-in yazı, çizilen diyagramlar, odak geçişleri). Ayrıntılar: STIL-AKIS.md

Bu dosya 3D Showroom videosunun ilk 46 saniyesini anlatıma kelime kelime senkron olarak yeniden kurar,
sonuna abone ol kapanışını ekler.

  python3 -I render_akis.py <varlik_klasoru> stills 3.4 9.5 ...   # tek kareler (PNG)
  python3 -I render_akis.py <varlik_klasoru> render [cekirdek]      # tam video

<varlik_klasoru>: fonts/ (InterTight500/600/800, InstrumentSerifItalic, JBMono .ttf),
src/showroom_v2.mp4 (ham video), src/audio48.wav, src/transcript.json (transcribe.py çıktısı).
Gerekenler: pip install skia-python numpy (Linux'ta libegl1 da gerekir), ffmpeg.
"""
import json
import math
import os
import subprocess
import sys
import wave
from contextlib import contextmanager

import numpy as np
import skia

A = os.path.abspath(sys.argv[1])
MODE = sys.argv[2] if len(sys.argv) > 2 else "stills"
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = f"{A}/akis/out"
os.makedirs(OUT, exist_ok=True)
W, H, FPS = 1920, 1080, 60
SRC = f"{A}/src/showroom_v2.mp4"
SRC_FPS = 30
SRC_CROP = (0, 108, 1920, 864)          # eski kurgunun üst/alt bantları dışındaki temiz ekran kaydı
VOICE_END = 45.80                       # anlatım burada kesilir ("Önce kısaca showroomu gezelim.")
DUR = 53.6
NFR = int(DUR * FPS)

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

# ================= ekran kaydı (kaynak video) =================
class Footage:
    """Kaynak videodan ardışık kare okur; aynı kare birden çok çıktı karesinde tekrar kullanılır."""
    def __init__(self):
        self.p = None; self.idx = -1; self.img = None; self.cache = {}
    def _open(self, i):
        if self.p: self.p.kill()
        x, y, w, h = SRC_CROP
        self.p = subprocess.Popen(["ffmpeg", "-v", "error", "-ss", f"{i / SRC_FPS:.4f}", "-i", SRC, "-vf", f"crop={w}:{h}:{x}:{y}",
                                   "-f", "rawvideo", "-pix_fmt", "rgba", "-"], stdout=subprocess.PIPE)
        self.idx = i - 1
    def at(self, t):
        i = int(t * SRC_FPS + 1e-6)
        if self.p is None or i < self.idx or i > self.idx + 90: self._open(i)
        x, y, w, h = SRC_CROP
        while self.idx < i:
            b = self.p.stdout.read(w * h * 4)
            if len(b) < w * h * 4: break
            self.idx += 1
            if self.idx == i:
                arr = np.frombuffer(b, np.uint8).reshape(h, w, 4)
                self.img = skia.Image.fromarray(arr.copy(), colorType=skia.kRGBA_8888_ColorType).withDefaultMipmaps()
        return self.img
    def still(self, t):
        if t not in self.cache:
            f = Footage(); self.cache[t] = f.at(t); f.p.kill()
        return self.cache[t]

FOOT = None

# ================= kamera =================
# (zaman, merkez_x, merkez_y, zoom) — dünya koordinatı. Ardışık iki anahtar arası ease-in-out.
BROW = dict(x=-800, y=-388, w=1600, h=776, bar=56)          # tarayıcı penceresi (dünya)
BC = (0, -388 + 56 + 360)                                    # tarayıcı içerik merkezi
ZF = 1920 * 0.955 / 1600                                     # içerik ekranı doldurur
ORG = (2700, 0)
ZIP = (2700, 1500)
TL = (0, 1500)
CAM = [
    (0.0, 0, -60, 0.78), (7.3, 0, -40, 0.80), (9.85, 0, -30, 0.82),
    (10.6, BC[0], BC[1], ZF), (16.9, BC[0], BC[1], ZF * 1.05),
    (17.5, 250, 60, ZF * 1.28), (20.6, 230, 55, ZF * 1.33),
    (21.75, 0, 0, 1.0), (26.85, 0, 0, 1.04),
    (27.45, ORG[0], ORG[1], 1.0), (33.70, ORG[0], ORG[1], 1.05),
    (34.30, ZIP[0], ZIP[1], 1.0), (36.40, ZIP[0], ZIP[1], 1.04),
    (37.05, TL[0], TL[1], 1.0), (43.6, TL[0], TL[1], 1.06),
]
def camera(t):
    if t <= CAM[0][0]: k = CAM[0]; return k[1], k[2], k[3]
    for a, b in zip(CAM, CAM[1:]):
        if a[0] <= t <= b[0]:
            p = eio(prog(t, a[0], b[0]))
            # zoom üstel olarak değişir: yakınlaşma hızı sabit hissedilir
            z = math.exp(lerp(math.log(a[3]), math.log(b[3]), p))
            return lerp(a[1], b[1], p), lerp(a[2], b[2], p), z
    k = CAM[-1]; return k[1], k[2], k[3]

def world_to_screen(cam, x, y):
    cx, cy, z = cam
    return (x - cx) * z + W / 2, (y - cy) * z + H / 2

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

# ================= ses efekti işaretleri (görüntüyle birlikte tanımlanır) =================
SFX = []   # (zaman, tür, kazanç)
def sfx(t, kind, g=1.0): SFX.append((t, kind, g))

# ================= sahneler =================
def bg(c, cam, t):
    c.clear(C(BG))
    p = skia.Paint()
    p.setShader(skia.GradientShader.MakeRadial(skia.Point(W / 2, H * .42), W * .78, [C("#FBFAF7").toColor(), C(BG).toColor(), C(BG_EDGE).toColor()], [0, .55, 1]))
    c.drawRect(skia.Rect.MakeWH(W, H), p)
    # silik nokta ızgarası: dünya ile birlikte kayar, kamera hareketini hissettirir
    cx, cy, z = cam
    step = 64 * z
    ox = (W / 2 - cx * z) % step; oy = (H / 2 - cy * z) % step
    dp = paint(NAVY, .055)
    r = 1.6 * max(.6, z)
    pts = [skia.Point(ox + i * step, oy + j * step) for i in range(int(W / step) + 2) for j in range(int(H / step) + 2)]
    for q in pts: c.drawCircle(q.x(), q.y(), r, dp)

# ---- 0.0–7.4  açılış: karga + iki satır
def scene_open(c, t):
    if t > 7.6: return
    # kanal imzası: avatar + isim, sonra yukarı kayar
    st = appear(t, 0.05, 0.6, 4.35, 0.35)
    if st:
        up = eio(prog(t, 1.05, 1.6))
        y = lerp(H / 2 - 30, H / 2 - 190, up)
        r = lerp(86, 58, up)
        with fx(c, st, W / 2, y, (W / 2 - 300, y - 120, W / 2 + 300, y + 160)):
            g = paint(ORANGE, .28); g.setMaskFilter(skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, 30)); c.drawCircle(W / 2, y + 10, r, g)
            avatar(c, W / 2, y, r)
            text(c, "Karga Zihni", W / 2, y + r + 46, "s", lerp(34, 28, up), INK, align="center")
    line(c, t, [("Bugün", "b", 1.24), ("bir", "b", 2.52), ("otomobil", "i", 2.68), ("showroomu", "i", 3.22)], W / 2, H / 2 + 70, 92, t1=4.35)
    # 4.6–7.4  "Ama burası biraz farklı." arkada sıradan ilan kartları (odak dışı)
    if t > 5.1:
        foc = eio(prog(t, 6.3, 6.7))
        p = skia.Paint(); p.setAlphaf(1 - eio(prog(t, 7.15, 7.5)))
        if foc > .01: p.setImageFilter(skia.ImageFilters.Blur(10 * foc, 10 * foc))
        c.saveLayer(None, p)
        k = 0
        for j in range(2):
            for i in range(4):
                x = W / 2 - 4 * 300 / 2 + i * 300 + 10; y = H / 2 - 290 + j * 330
                st = appear(t, 5.30 + k * .07, .5)
                if st:
                    with fx(c, st, x + 140, y + 150, (x, y, x + 280, y + 300)):
                        card(c, x, y, 280, 300, 16)
                        rrect(c, x + 14, y + 14, 252, 150, 10, SOFT)
                        icon(c, "car", x + 140, y + 89, 64, "#C9C3B8", sw=1.6)
                        rrect(c, x + 18, y + 184, 170, 16, 8, "#E4DFD6"); rrect(c, x + 18, y + 214, 110, 14, 7, SOFT)
                        rrect(c, x + 18, y + 254, 90, 26, 13, "#E4DFD6")
                k += 1
        c.restore()
        if foc > 0:
            c.drawRect(skia.Rect.MakeWH(W, H), paint(BG, .45 * foc))
    line(c, t, [("Ama", "b", 4.62), ("burası", "b", 4.94), ("biraz", "i", 6.58), ("farklı.", "i", 6.86)], W / 2, H / 2 + 34, 104, t1=7.2)

for _t in (0.05, 1.24): sfx(_t, "pop", .5)
sfx(5.3, "cards", .6); sfx(6.55, "focus", .5)

# ---- 7.6–21.7  tarayıcı → ekran kaydı
URL = "gardenmotor.netlify.app"
def scene_browser(c, t, cam):
    if t < 7.55 or t > 27.4: return
    st = appear(t, 7.62, 0.6, rise=40)
    if t > 21.0: st = appear(t, 7.62, 0.6, 26.9, rise=40)
    if not st: return
    # 20.9'dan sonra pencere küçülür ve merkez kart olur (eşleşen geçiş)
    k = eio(prog(t, 20.85, 21.75))
    sc = lerp(1.0, 0.31, k)
    x, y, w, h, bar = BROW["x"], BROW["y"], BROW["w"], BROW["h"], BROW["bar"]
    c.save(); c.translate(0, lerp(0, -40, k)); c.scale(sc, sc)
    with fx(c, st, 0, 0, (x, y, x + w, y + h)):
        card(c, x, y, w, h, 22, sh=.16)
        # üst çubuk
        for i, col in enumerate(("#FF5F57", "#FEBC2E", "#28C840")):
            c.drawCircle(x + 32 + i * 24, y + bar / 2, 7, paint(col, lerp(1, 0, k)))
        ux, uw = x + w / 2 - 280, 560
        rrect(c, ux, y + 12, uw, bar - 24, (bar - 24) / 2, SOFT)
        n = int(len(URL) * prog(t, 7.9, 8.85))
        icon(c, "lock", ux + 24, y + bar / 2, 16, MUTED, sw=2.4)
        text(c, URL[:n], ux + 42, y + bar / 2 + 7, "m", 19, INK)
        if 7.9 < t < 9.6 and int(t * 2.4) % 2 == 0:
            cx_ = ux + 42 + tw(URL[:n], "m", 19) + 2
            c.drawRect(skia.Rect.MakeXYWH(cx_, y + bar / 2 - 10, 2, 20), paint(ORANGE))
        # içerik: ekran kaydı (21.0'dan sonra donmuş kare)
        im = FOOT.at(min(t, 20.7)) if t < 20.75 else FOOT.still(20.7)
        c.save(); c.clipRRect(skia.RRect.MakeRectXY(skia.Rect.MakeXYWH(x, y, w, h), 22, 22), True)
        draw_img_rr(c, im, x, y + bar, w, h - bar, 0)
        c.restore()
    c.restore()
    # başlık: pencerenin üstünde
    line(c, t, [("Her", "b", 8.28), ("şey", "b", 8.56), ("bir", "b", 8.76), ("web", "i", 9.00), ("sitesinin", "i", 9.24), ("içinde.", "b", 9.68)],
         0, y - 70, 74, t1=9.9)
    # merkez kart etiketi (hub)
    if k > .5:
        st2 = appear(t, 21.35, .45, 26.85)
        if st2:
            with fx(c, st2, 0, 150, (-200, 110, 200, 190)):
                text(c, "3D Showroom", 0, 166, "b", 30, INK, align="center")

sfx(7.62, "whoosh", .35)
for i in range(len(URL)): sfx(7.9 + i * (0.95 / len(URL)), "type", .22)
sfx(10.05, "whoosh", .3); sfx(20.85, "whoosh", .45)

# ---- 10.6–20.8  ekran kaydı üstünde bilgi hapları (ekran uzayında)
PILLS = [(12.04, 13.4, "door", "Kapıdan içeri gir"), (13.62, 16.7, "orbit", "Aracın etrafında dolaş"), (17.04, 20.5, "info", "Bilgileri aç, incele")]
def pills(c, t):
    for t0, t1, ic, s in PILLS:
        st = appear(t, t0, .45, t1, .3, rise=20)
        if not st: continue
        f = 30; w = tw(s, "s", f) + 112; h = 72
        x = W / 2 - w / 2; y = H - 128
        with fx(c, st, W / 2, y + h / 2, (x, y, x + w, y + h)):
            shadow(c, x, y, w, h, h / 2, .22, 24, 12)
            rrect(c, x, y, w, h, h / 2, CARD)
            c.drawCircle(x + 38, y + h / 2, 24, paint(ORANGE))
            icon(c, ic, x + 38, y + h / 2, 28)
            text(c, s, x + 76, y + h / 2 + 11, "s", f, INK)
for t0, *_ in PILLS: sfx(t0, "pop", .45)

# ---- 20.9–26.9  merkez: showroom, uydular: firmalar, geri dönüşler
FIRMS = [(-640, 0, "store", "Oto galeri", 21.95), (640, -190, "car", "Yetkili bayi", 22.20), (640, 190, "key", "Kiralama", 22.45)]
FEED = [(23.40, "Bize de yapar mısın?"), (23.62, "Teklif alabilir miyiz?"), (23.84, "Nasıl yaptın bunu?")]
def scene_hub(c, t):
    if t < 21.4 or t > 27.6: return
    out = 26.9
    for i, (fx_, fy, ic, lab, t0) in enumerate(FIRMS):
        if fx_ < 0: pts = [(-260, 0), (fx_ + 58, 0)]
        else: pts = [(260, 0), (420, 0), (420, fy), (fx_ - 58, fy)]
        a = 1 - eio(prog(t, out, out + .35))
        grow(c, pts, eout(prog(t, t0 - .45, t0 + .05)), a=a)
        node(c, t, t0, fx_, fy, 56, ic, NAVY, lab, t1=out)
        tt, msg = FEED[i]
        st = appear(t, tt, .5, out, rise=22)
        if st:
            bw = tw(msg, "s", 24) + 56; bh = 64
            bx = fx_ - bw / 2; by = fy - 56 - 40 - bh
            with fx(c, st, fx_, by + bh, (bx, by, bx + bw, by + bh + 16)):
                card(c, bx, by, bw, bh, 18, sh=.14)
                pth = skia.Path(); pth.moveTo(fx_ - 12, by + bh - 1); pth.lineTo(fx_, by + bh + 14); pth.lineTo(fx_ + 12, by + bh - 1); pth.close()
                c.drawPath(pth, paint(CARD))
                c.drawCircle(bx + 24, by + bh / 2, 6, paint(ORANGE))
                text(c, msg, bx + 40, by + bh / 2 + 8, "s", 24, INK)
for f in FIRMS: sfx(f[4], "pop", .5)
for tt, _ in FEED: sfx(tt, "msg", .45)

# ---- 27.0–33.7  ağaç: şablon → galeriler, teklif kartı + imleç
KIDS = [("car", "Oto galeri", 28.30), ("store", "Yetkili bayi", 28.62), ("key", "Kiralama", 28.94), ("tag", "İkinci el", 29.26)]
def kid_positions(t, gap=250):
    shown = [k for k in KIDS if t >= k[2] - .05]
    n = len(shown)
    if n == 0: return []
    lay = lambda m: [(j - (m - 1) / 2) * gap for j in range(m)]
    p = eio(prog(t, shown[-1][2] - .05, shown[-1][2] + .5))
    prev, cur = lay(max(1, n - 1)), lay(n)
    xs = []
    for j in range(n):
        if j < n - 1 and n > 1: xs.append(lerp(prev[j], cur[j], p))
        else: xs.append(cur[j])
    return xs

def scene_org(c, t):
    if t < 26.9 or t > 34.6: return
    ox, oy = ORG
    top = (ox, oy - 230)
    node(c, t, 27.25, top[0], top[1], 64, "cube", NAVY, None)
    st = appear(t, 27.4, .45)
    if st:
        with fx(c, st, top[0], top[1] + 110, (top[0] - 200, top[1] + 80, top[0] + 200, top[1] + 130)):
            text(c, "Senin şablonun", top[0], top[1] + 112, "b", 30, INK, align="center")
    xs = kid_positions(t)
    by = oy - 50; ky = oy + 70
    if xs:
        grow(c, [(top[0], top[1] + 130), (top[0], by)], eout(prog(t, 28.0, 28.3)), tip=False)
        span = max(abs(xs[0]), abs(xs[-1]))
        p = eout(prog(t, 28.05, 28.5))
        c.drawLine(ox - span * p, by, ox + span * p, by, paint(LINE, 1, 3.5))
        for j, ((ic, lab, t0), x) in enumerate(zip(KIDS, xs)):
            grow(c, [(ox + x, by), (ox + x, ky - 50)], eout(prog(t, t0 - .1, t0 + .15)), tip=False)
            node(c, t, t0, ox + x, ky, 50, ic, ORANGE, lab, lsize=24, done=31.35 + j * .12)
        for e in (-1, 1):
            if p < 1 and p > 0:
                g = paint(ORANGE, .5); g.setMaskFilter(skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, 9))
                c.drawCircle(ox + e * span * p, by, 10, g); c.drawCircle(ox + e * span * p, by, 4, paint("#FFFFFF"))
    # alt yazı (dünya uzayında, diyagramın altında)
    line(c, t, [("Farklı", "b", 28.26), ("galerilere", "b", 28.66), ("uyarla", "i", 29.24)], ox, oy + 290, 66, t1=29.62)
    line(c, t, [("Bir", "b", 29.78), ("hizmet", "i", 29.94), ("olarak", "b", 30.28), ("sun.", "i", 30.54)], ox, oy + 290, 66, t1=31.3)
    # teklif kartı (referanstaki "karar bekliyor" kartı)
    st = appear(t, 30.0, .5, 31.75, rise=20)
    if st:
        x, y, w, h = top[0] + 120, top[1] - 120, 430, 196
        with fx(c, st, x, y + h / 2, (x, y, x + w, y + h)):
            card(c, x, y, w, h, 20, sh=.14)
            c.drawCircle(x + 32, y + 36, 11, paint(ORANGE))
            text(c, "Yeni müşteri", x + 52, y + 44, "b", 22, INK)
            text(c, "teklif bekliyor", x + 52 + tw("Yeni müşteri", "b", 22) + 10, y + 44, "m", 20, MUTED)
            text(c, "3D showroom sitesi kurulumu", x + 26, y + 96, "s", 25, INK)
            pressed = t >= 30.95
            q = eback(prog(t, 30.95, 31.25)) if pressed else 0
            bw1 = 170
            rrect(c, x + 26, y + 124, bw1, 48, 24, ORANGE if not pressed else NAVY)
            if pressed:
                icon(c, "check", x + 26 + 34, y + 148, 26 * q, sw=3)
                text(c, "Kabul", x + 26 + 58, y + 156, "b", 21, "#FFFFFF")
            else:
                text(c, "Kabul et", x + 26 + bw1 / 2, y + 156, "b", 21, "#FFFFFF", align="center")
            rrect(c, x + 210, y + 124, 120, 48, 24, "#FFFFFF")
            c.drawRRect(skia.RRect.MakeRectXY(skia.Rect.MakeXYWH(x + 210, y + 124, 120, 48), 24, 24), paint("#DDD7CC", 1, 2))
            text(c, "Sonra", x + 270, y + 156, "s", 21, INK, align="center")
    cursor(c, t, [(30.25, top[0] + 640, top[1] + 160), (30.85, top[0] + 230, top[1] + 30), (31.6, top[0] + 260, top[1] + 60)], clicks=[30.92], t_out=31.75)

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

sfx(27.25, "pop", .5)
for k in KIDS: sfx(k[2], "pop", .45)
sfx(30.0, "msg", .45); sfx(30.92, "click", .8); sfx(31.35, "ding", .35)

# ---- odak geçişi yazıları (ekran uzayı, arka plan bulanık)
FOCUS = [(24.70, 26.80), (31.45, 33.72)]
def focus_amount(t):
    v = 0.0
    for a, b in FOCUS:
        v = max(v, eio(prog(t, a, a + .32)) * (1 - eio(prog(t, b, b + .35))))
    return v
def overlay_text(c, t):
    line(c, t, [("Nasıl", "b", 25.00), ("yaptığımı", "b", 25.22), ("paylaşıyorum.", "i", 26.08)], W / 2, H / 2 + 30, 100, t1=26.75)
    line(c, t, [("Sıfırdan", "b", 32.08), ("başlamana", "b", 32.50), ("gerek", "i", 33.14), ("yok.", "i", 33.36)], W / 2, H / 2 + 30, 104, t1=33.72)
sfx(24.7, "focus", .5); sfx(31.45, "focus", .5)

# ---- 34.3–36.6  zip dosyası yorumlara
def scene_zip(c, t):
    if t < 33.9 or t > 37.4: return
    ox, oy = ZIP
    # yorum kartı
    cx, cy, cw, ch = ox - 190, oy - 125, 640, 250
    st = appear(t, 35.38, .55, 36.55, rise=24)
    if st:
        with fx(c, st, cx + cw / 2, cy + ch / 2, (cx, cy, cx + cw, cy + ch)):
            card(c, cx, cy, cw, ch, 22, sh=.13)
            avatar(c, cx + 56, cy + 62, 30)
            text(c, "@kargazihni", cx + 102, cy + 56, "b", 25, INK)
            icon(c, "pin", cx + 102 + tw("@kargazihni", "b", 25) + 26, cy + 48, 20, MUTED, sw=2.2)
            text(c, "Sabitlendi", cx + 102 + tw("@kargazihni", "b", 25) + 42, cy + 56, "m", 21, MUTED)
            text(c, "Proje dosyası burada, indirip açabilirsiniz:", cx + 102, cy + 98, "m", 23, INK)
            hit = prog(t, 35.95, 36.25)
            lw = 420; lx, ly = cx + 102, cy + 128
            rrect(c, lx, ly, lw, 76, 16, SOFT)
            if hit > 0:
                g = paint(ORANGE, .35 * (1 - prog(t, 36.25, 36.6))); g.setMaskFilter(skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, 14))
                c.drawRRect(skia.RRect.MakeRectXY(skia.Rect.MakeXYWH(lx, ly, lw, 76), 16, 16), g)
                rrect(c, lx, ly, lw, 76, 16, "#FFFFFF")
                c.drawRRect(skia.RRect.MakeRectXY(skia.Rect.MakeXYWH(lx, ly, lw, 76), 16, 16), paint(ORANGE, eout(hit), 2.5))
            icon(c, "zip", lx + 40, ly + 38, 36, ORANGE, sw=1.8)
            text(c, "garden-motors.zip", lx + 72, ly + 34, "b", 22, INK)
            text(c, "drive.google.com/file/d/13W1…", lx + 72, ly + 60, "mono", 16, ORANGE_T)
    # zip kartı: soldan gelir, 35.82'de yorumun içine uçar
    st = appear(t, 34.52, .55, rise=24)
    if st:
        fly = eio(prog(t, 35.82, 36.22))
        if fly < 1:
            x0, y0 = ox - 560, oy - 90
            x1, y1 = cx + 102 + 40 - 90, cy + 128 + 38 - 90
            x = lerp(x0, x1, fly); y = lerp(y0, y1, fly) - math.sin(fly * math.pi) * 120
            s = lerp(1, .38, fly)
            with fx(c, (st[0] * (1 - prog(t, 36.1, 36.22)), st[1], st[2], st[3] * s), x + 90, y + 90, (x - 40, y - 40, x + 220, y + 260)):
                card(c, x, y, 180, 180, 30, sh=.16)
                icon(c, "zip", x + 90, y + 78, 84, ORANGE, sw=1.6)
                text(c, ".zip", x + 90, y + 152, "b", 24, INK, align="center")
    line(c, t, [("Proje", "b", 34.52), ("dosyası", "b", 34.84), ("yorumlarda.", "i", 35.38)], ox, oy - 250, 74, t1=36.45)
sfx(34.52, "pop", .5); sfx(35.38, "msg", .5); sfx(35.82, "whoosh", .25); sfx(36.0, "ding", .45)

# ---- 36.6–43.4  zaman çizelgesi: bu videoda
STEPS = [("pencil", "Galeri adını değiştir", 37.80), ("car", "Yeni araç ekle", 39.48), ("link", "Bağlantıyla paylaş", 41.54)]
def scene_tl(c, t):
    if t < 36.2 or t > 43.8: return
    ox, oy = TL
    gap = 560
    xs = [ox - gap, ox, ox + gap]
    line(c, t, [("Bu", "b", 36.58), ("videoda", "b", 36.92), ("birlikte", "i", 37.32)], ox, oy - 250, 80)
    # arka iz (gri) + ilerleme (turuncu)
    st = appear(t, 36.95, .5)
    if st:
        with fx(c, st, ox, oy, (xs[0] - 80, oy - 10, xs[-1] + 80, oy + 10)):
            c.drawLine(xs[0], oy, xs[-1], oy, paint("#E2DDD3", 1, 4))
    for i, (ic, lab, t0) in enumerate(STEPS):
        x = xs[i]
        # boş halka
        st = appear(t, 37.0 + i * .1, .5)
        if not st: continue
        with fx(c, st, x, oy, (x - 220, oy - 120, x + 220, oy + 140)):
            fill = eout(prog(t, t0, t0 + .45))
            c.drawCircle(x, oy, 58, paint(BG))
            c.drawCircle(x, oy, 58, paint("#DCD6CB", 1, 3))
            if fill > 0:
                g = paint(ORANGE, .3 * fill); g.setMaskFilter(skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, 22))
                c.drawCircle(x, oy + 8, 58, g)
                c.drawCircle(x, oy, 58 * (.6 + .4 * fill), paint(ORANGE, fill))
            icon(c, ic, x, oy, 50, "#FFFFFF" if fill > .5 else "#BDB6AA", sw=2)
            text(c, f"0{i + 1}", x, oy - 86, "mono", 20, ORANGE_T if fill > .5 else MUTED, align="center")
            text(c, lab, x, oy + 108, "b", 30, INK if fill > .5 else MUTED, align="center")
        if i < 2:
            p = eio(prog(t, t0 + .2, STEPS[i + 1][2] - .05))
            if p > 0: grow(c, [(x + 60, oy), (xs[i + 1] - 60, oy)], p, ORANGE, 4)
for s in STEPS: sfx(s[2], "step", .6)

# ---- 43.3–46.3  karartma + bölüm kartı
def dip(t):
    return eio(prog(t, 43.25, 43.6)) * (1 - eio(prog(t, 43.85, 44.15)))
def scene_chapter(c, t):
    if t < 43.8 or t > 46.6: return
    line(c, t, [("Bölüm", "b", 43.95), ("1:", "b", 44.10), ("Showroom", "i", 44.70), ("turu", "i", 44.98)], W / 2, H / 2 + 34, 104, t1=46.0)
sfx(43.2, "riser", .5); sfx(43.95, "thump", .7)

# ---- 46.2–53.6  kapanış: kanal sayfası + abone ol hapı
def channel_page(c, t, a):
    c.drawRect(skia.Rect.MakeWH(W, H), paint("#0D1020", a))
    p = skia.Paint(); p.setAlphaf(a * .38); p.setImageFilter(skia.ImageFilters.Blur(9, 9))
    c.saveLayer(None, p)
    avatar(c, 260, 170, 70)
    text(c, "Karga Zihni", 360, 158, "b", 44, "#F3EFE7")
    text(c, "@kargazihni  ·  3D web siteleri, yapay zekâ", 360, 200, "m", 22, "#9AA0B5")
    for i, tb in enumerate(("Videolar", "Shorts", "Oynatma listeleri", "Topluluk")):
        text(c, tb, 190 + i * 210, 300, "s", 22, "#F3EFE7" if i == 0 else "#7F86A0")
    c.drawRect(skia.Rect.MakeXYWH(190, 316, tw("Videolar", "s", 22), 3), paint("#F3EFE7"))
    th = ["FINAL_1_laptop_galerilere_sun.jpg", "TEST_2_kapi_bu_bir_web_sitesi.jpg", "TEST_3_sen_de_yap.jpg",
          "thumb_A_bu_bir_web_sitesi.jpg", "thumb_B_once_sonra.jpg", "thumb_C_oyun_degil.jpg"]
    for i, n in enumerate(th):
        x = 190 + (i % 3) * 520; y = 360 + (i // 3) * 360
        draw_img_rr(c, img("thumb:" + n), x, y, 490, 276, 14)
        rrect(c, x, y + 292, 400, 18, 9, "#2A2F45"); rrect(c, x, y + 320, 240, 14, 7, "#22263A")
    c.restore()

def scene_outro(c, t):
    if t < 46.0: return
    a = eio(prog(t, 46.0, 46.5))
    # açık zeminden koyuya: yakınlaşan bulanık geçiş
    channel_page(c, t, a)
    c.drawRect(skia.Rect.MakeWH(W, H), paint("#05060C", .6 * eio(prog(t, 50.8, 51.4))))
    R = 92; PW = 690
    cx, cy = W / 2 - (PW - .8 * R) / 2, H / 2
    c.save(); c.translate(W / 2, H / 2); c.scale(1.4, 1.4); c.translate(-W / 2, -H / 2)
    try:
        pill(c, t, cx, cy, R, PW)
    finally:
        c.restore()

def pill(c, t, cx, cy, R, PW):
    pop = eback(prog(t, 46.6, 47.05))
    shrink = eio(prog(t, 50.55, 50.95))
    gone = eio(prog(t, 50.9, 51.2))
    if pop <= 0 or gone >= 1: return
    pw = PW * eio(prog(t, 47.0, 47.5)) * (1 - shrink)
    # hap
    if pw > 4:
        h = 150; x = cx; y = cy - h / 2
        shadow(c, x, y, pw + R * .2, h, h / 2, .5, 30, 14)
        rrect(c, x, y, pw + R * .2, h, h / 2, "#FFFFFF", 1 - gone)
        c.save(); c.clipRect(skia.Rect.MakeXYWH(x, y, pw + R * .2, h))
        ix = cx + R + 70
        liked = t >= 48.32
        lq = eback(prog(t, 48.32, 48.62))
        sl = 1 + .25 * math.sin(math.pi * prog(t, 48.32, 48.62))
        c.save(); c.translate(ix, cy); c.scale(sl, sl)
        icon(c, "thumb", 0, 0, 52, NAVY, fill=liked, sw=2.2)
        c.restore()
        if liked:
            for k in range(8):
                ang = k * math.pi / 4; rr = 30 + 40 * eout(prog(t, 48.32, 48.8))
                c.drawCircle(ix + math.cos(ang) * rr, cy + math.sin(ang) * rr, 4 * (1 - prog(t, 48.32, 48.8)), paint(ORANGE))
        c.save(); c.translate(ix + 70, cy + 4); c.scale(1, -1); icon(c, "thumb", 0, 0, 52, "#9AA0B5", sw=2.2); c.restore()
        subbed = t >= 49.02
        bx = ix + 140; bw = lerp(214, 264, eio(prog(t, 49.02, 49.35))); bh = 70
        sq = 1 - .06 * math.sin(math.pi * prog(t, 48.98, 49.2))
        c.save(); c.translate(bx + bw / 2, cy); c.scale(sq, sq); c.translate(-(bx + bw / 2), -cy)
        rrect(c, bx, cy - bh / 2, bw, bh, bh / 2, "#E7E3DB" if subbed else ORANGE)
        text(c, "Abone Olundu" if subbed else "Abone Ol", bx + bw / 2, cy + 10, "b", 27, INK if subbed else "#FFFFFF", align="center")
        c.restore()
        bellx = bx + bw + 62
        rang = t >= 49.72
        wig = math.sin((t - 49.72) * 38) * 18 * (1 - prog(t, 49.72, 50.3)) if rang else 0
        c.save(); c.translate(bellx, cy - 22); c.rotate(wig); c.translate(-bellx, -(cy - 22))
        icon(c, "bell", bellx, cy, 54, NAVY, fill=rang, sw=2.2)
        c.restore()
        c.restore()
    # avatar
    r = R * pop * (1 - .25 * gone)
    if r > 1:
        g = paint(ORANGE, .5 * (1 - gone)); g.setMaskFilter(skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, 30))
        c.drawCircle(cx, cy, r, g)
        avatar(c, cx, cy, r, 1 - gone)
        c.drawCircle(cx, cy, r, paint("#FFFFFF", 1 - gone, 5))
    if pw > 300:
        ix = cx + R + 70; bx = ix + 140
        cursor(c, t, [(47.75, cx + 700, cy + 330), (48.25, ix + 6, cy + 10), (48.75, ix + 6, cy + 10), (48.98, bx + 110, cy + 16),
                      (49.45, bx + 110, cy + 16), (49.70, bx + 300, cy + 16), (50.3, bx + 330, cy + 60)], clicks=[48.30, 49.0, 49.72], t_out=50.4)

def scene_quote(c, t):
    if t < 51.0: return
    line(c, t, [("kuşlar", "b", 51.15), ("seni", "b", 51.35), ("bekliyor,", "b", 51.55), ("uç.", "i", 52.05)], W / 2, H / 2 + 30, 96,
         color="#F3EFE7", acc=ORANGE)
sfx(46.05, "whoosh", .45); sfx(46.6, "pop", .7); sfx(47.0, "whoosh", .2)
sfx(48.30, "click", .8); sfx(48.32, "ding", .3); sfx(49.0, "click", .8); sfx(49.05, "ding", .45); sfx(49.72, "click", .8); sfx(49.75, "bell", .5)
sfx(50.55, "whoosh", .25); sfx(51.15, "thump", .5)

# ================= kare birleştirici =================
GRAIN = None
def make_grain():
    rng = np.random.default_rng(3); out = []
    for _ in range(6):
        n = rng.normal(0, 1, (H // 2, W // 2)).astype(np.float32)
        a = np.clip(n * 4 + 4, 0, 10).astype(np.uint8)
        arr = np.zeros((H // 2, W // 2, 4), np.uint8); arr[..., 3] = a
        out.append(skia.Image.fromarray(arr, colorType=skia.kRGBA_8888_ColorType))
    return out

class Renderer:
    def __init__(self):
        global FOOT, GRAIN
        FOOT = Footage(); GRAIN = make_grain()
        self.s = skia.Surface.MakeRaster(skia.ImageInfo.Make(W, H, skia.ColorType.kRGBA_8888_ColorType, skia.AlphaType.kPremul_AlphaType))

    def frame(self, f):
        t = f / FPS
        c = self.s.getCanvas()
        cam = camera(t)
        cam0 = camera(t - 1 / FPS)
        bg(c, cam, t)
        # --- dünya katmanı
        c.save(); c.translate(W / 2, H / 2); c.scale(cam[2], cam[2]); c.translate(-cam[0], -cam[1])
        scene_browser(c, t, cam); scene_hub(c, t); scene_org(c, t); scene_zip(c, t); scene_tl(c, t)
        c.restore()
        # --- hareket bulanıklığı (kamera hızı) + odak bulanıklığı
        vx = abs(cam[0] - cam0[0]) * cam[2]; vy = abs(cam[1] - cam0[1]) * cam[2]
        vz = abs(math.log(cam[2] / cam0[2])) * W * .5
        foc = focus_amount(t)
        sx = math.hypot(vx * .45 + vz * .3, foc * 13); sy = math.hypot(vy * .45 + vz * .3, foc * 13)
        if sx > .6 or sy > .6:
            snap = self.s.makeImageSnapshot()
            p = skia.Paint(); p.setImageFilter(skia.ImageFilters.Blur(min(sx, 60), min(sy, 60), skia.TileMode.kClamp))
            c.drawImage(snap, 0, 0, SAMP, p)
        if foc > 0: c.drawRect(skia.Rect.MakeWH(W, H), paint(BG, .5 * foc))
        # --- ekran uzayı
        scene_open(c, t); pills(c, t); overlay_text(c, t); scene_chapter(c, t)
        d = dip(t)
        if d > 0: c.drawRect(skia.Rect.MakeWH(W, H), paint("#000000", d))
        scene_outro(c, t); scene_quote(c, t)
        if t > DUR - .45: c.drawRect(skia.Rect.MakeWH(W, H), paint("#000000", eio(prog(t, DUR - .45, DUR - .05))))
        # ince film greni (bantlaşmayı da kırar)
        c.drawImageRect(GRAIN[f % len(GRAIN)], skia.Rect.MakeWH(W, H), skia.SamplingOptions(), skia.Paint())
        return self.s

    def rgba(self, f):
        return self.frame(f).toarray()

# ================= ses =================
SR = 48000
def build_audio(path):
    n = int(DUR * SR) + SR
    wf = wave.open(f"{A}/src/audio48.wav")
    ch = wf.getnchannels()
    v = np.frombuffer(wf.readframes(int(VOICE_END * SR) + SR), np.int16).astype(np.float32) / 32768
    v = v.reshape(-1, ch).mean(1)[: int(VOICE_END * SR)]
    v[-int(.12 * SR):] *= np.linspace(1, 0, int(.12 * SR))
    voice = np.zeros(n, np.float32); voice[: len(v)] = v
    r = np.random.default_rng(5)
    L = np.zeros(n, np.float32); R = np.zeros(n, np.float32)
    def add(sig, t, g=1.0, pan=0.0):
        i = int(t * SR); j = min(n, i + len(sig))
        if j <= i or i < 0: return
        L[i:j] += sig[: j - i] * g * (1 - max(0, pan)); R[i:j] += sig[: j - i] * g * (1 + min(0, pan))
    # müzik: sakin, açık tonlu (Fmaj7 - Am7 - Dm9 - Bbmaj7), 92 bpm, yumuşak pluck + pad
    bpm = 92; beat = 60 / bpm; bar = beat * 4
    chords = [(174.61, 220.0, 261.63, 329.63), (220.0, 261.63, 329.63, 392.0), (146.83, 174.61, 220.0, 261.63), (116.54, 146.83, 174.61, 220.0)]
    mus = np.zeros(n, np.float32)
    def put(t0, sig, g=1.0):
        i = int(t0 * SR); j = min(n, i + len(sig))
        if j > i >= 0: mus[i:j] += sig[: j - i] * g
    def pad(fr, d):
        m = int(d * SR); st = np.arange(m) / SR
        s = sum(np.sin(2 * np.pi * f * st + k) + .3 * np.sin(2 * np.pi * f * 2.003 * st) for k, f in enumerate(fr))
        env = np.minimum(1, st / .8) * np.minimum(1, (d - st) / .8)
        return (s * env * .018).astype(np.float32)
    def pluck(f, d=.6):
        m = int(d * SR); st = np.arange(m) / SR
        return ((np.sin(2 * np.pi * f * st) + .35 * np.sin(4 * np.pi * f * st) * np.exp(-st * 8)) * np.exp(-st * 6) * .05).astype(np.float32)
    for k in range(int(DUR / bar) + 1):
        chd = chords[k % 4]; t0 = k * bar
        put(t0, pad(chd, bar + .9))
        seq = [chd[2] * 2, chd[3] * 2, chd[1] * 2, chd[3] * 2, chd[2] * 2, chd[1] * 4, chd[3] * 2, chd[2] * 2]
        for i, fq in enumerate(seq): put(t0 + i * beat / 2, pluck(fq), .9 if i % 2 == 0 else .6)
        m = int(bar * SR); st = np.arange(m) / SR
        put(t0, (np.sin(2 * np.pi * chd[0] / 2 * st) * np.minimum(1, st * 6) * np.exp(-st * .7) * .06).astype(np.float32))
    env = np.abs(voice); k = int(.3 * SR)
    env = np.convolve(env, np.ones(k) / k, "same")
    duck = 1 - .6 * np.clip(env / .025, 0, 1)
    tt = np.arange(n) / SR
    mus *= .9 * duck * np.minimum(1, tt / 1.5) * np.clip((DUR - tt) / 1.2, 0, 1) * (1 + .5 * (tt > 46.0))
    L += mus; R += mus
    # efektler
    def lp(m, a):
        x = r.normal(0, 1, m).astype(np.float32); y = np.empty_like(x); acc = 0.0
        for i in range(m): acc += a[i] * (x[i] - acc); y[i] = acc
        return y
    def whoosh(d=.5):
        m = int(d * SR); e = np.sin(np.linspace(0, np.pi, m))
        return (lp(m, e * .25 + .01) * e ** 2 * 2.2).astype(np.float32)
    def pop():
        m = int(.09 * SR); st = np.arange(m) / SR
        return (np.sin(2 * np.pi * (520 + 900 * st / .09) * st) * np.exp(-st * 45) * .3).astype(np.float32)
    def click():
        m = int(.05 * SR); st = np.arange(m) / SR
        return ((np.sin(2 * np.pi * 3200 * st) * .5 + r.normal(0, 1, m) * .4) * np.exp(-st * 160) * .35).astype(np.float32)
    def typ():
        m = int(.035 * SR); st = np.arange(m) / SR
        return (r.normal(0, 1, m) * np.exp(-st * 220) * .25).astype(np.float32)
    def ding(f=1318.5):
        m = int(.9 * SR); st = np.arange(m) / SR
        return ((np.sin(2 * np.pi * f * st) + .4 * np.sin(2 * np.pi * f * 2.01 * st)) * np.exp(-st * 5) * .12).astype(np.float32)
    def msg():
        a = ding(987.8)[: int(.25 * SR)]; b = ding(1318.5)
        out = np.zeros(int(.09 * SR) + len(b), np.float32); out[: len(a)] += a; out[int(.09 * SR):] += b; return out * .8
    def step():
        m = int(.5 * SR); st = np.arange(m) / SR
        return ((np.sin(2 * np.pi * 660 * st) + .5 * np.sin(2 * np.pi * 990 * st)) * np.exp(-st * 7) * .1).astype(np.float32)
    def thump():
        m = int(1.0 * SR); st = np.arange(m) / SR
        return (np.sin(2 * np.pi * np.cumsum(45 + 70 * np.exp(-st * 20)) / SR) * np.exp(-st * 4) * .5).astype(np.float32)
    def riser(d=.7):
        m = int(d * SR); st = np.arange(m) / SR
        return (lp(m, np.linspace(.004, .3, m) ** 1.5) * 2 * (st / d) ** 2).astype(np.float32)
    def focus():
        m = int(.6 * SR); st = np.arange(m) / SR
        return (lp(m, np.linspace(.2, .01, m)) * np.exp(-st * 5) * 1.2).astype(np.float32)
    def bell():
        m = int(1.2 * SR); st = np.arange(m) / SR
        return sum(np.sin(2 * np.pi * f * st) * np.exp(-st * d) for f, d in ((1760, 3), (2637, 4), (3520, 6))).astype(np.float32) * .05
    def cards():
        out = np.zeros(int(.9 * SR), np.float32)
        for i in range(8):
            p = pop() * .5; j = int(i * .07 * SR); out[j: j + len(p)] += p
        return out
    gen = {"whoosh": whoosh, "pop": pop, "click": click, "type": typ, "ding": ding, "msg": msg, "step": step, "thump": thump,
           "riser": riser, "focus": focus, "bell": bell, "cards": cards}
    for t0, kind, g in SFX:
        add(gen[kind](), t0 - (.25 if kind == "whoosh" else 0), g, (r.random() - .5) * .3)
    mix = np.stack([L + voice, R + voice], 1)
    mix = np.tanh(mix * 1.05) * .95
    with wave.open(path, "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((mix * 32767).astype(np.int16).tobytes())
    return path

# ================= render =================
def render_chunk(args):
    k, f0, f1 = args
    out = f"{OUT}/akis_{k:02d}.mp4"
    if os.path.exists(out + ".done"): return out
    rd = Renderer()
    enc = subprocess.Popen(["ffmpeg", "-y", "-v", "error", "-f", "rawvideo", "-pix_fmt", "rgba", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
                            "-c:v", "libx264", "-preset", "medium", "-crf", "16", "-pix_fmt", "yuv420p", "-g", "120", out], stdin=subprocess.PIPE)
    for f in range(f0, f1):
        enc.stdin.write(rd.rgba(f).tobytes())
        if (f - f0) % 300 == 0: print(f"parca {k}: {f - f0}/{f1 - f0}", flush=True)
    enc.stdin.close(); enc.wait()
    open(out + ".done", "w").write("ok")
    return out

if __name__ == "__main__":
    if MODE == "stills":
        rd = Renderer()
        from PIL import Image
        for ts in sys.argv[3:]:
            t = float(ts)
            Image.fromarray(rd.rgba(int(round(t * FPS)))).convert("RGB").save(f"{OUT}/still_{t:05.2f}.png")
            print("ok", t)
    elif MODE == "render":
        from multiprocessing import Pool
        nproc = int(sys.argv[3]) if len(sys.argv) > 3 else 4
        n = nproc * 3
        cuts = [round(i * NFR / n) for i in range(n + 1)]
        jobs = [(i, cuts[i], cuts[i + 1]) for i in range(n)]
        with Pool(nproc) as pool:
            parts = pool.map(render_chunk, jobs, chunksize=1)
        wav = build_audio(f"{OUT}/akis_ses.wav")
        lst = f"{OUT}/akis_list.txt"
        open(lst, "w").write("".join(f"file '{p}'\n" for p in parts))
        final = f"{OUT}/Karga_Zihni_Akis_Stili_Demo.mp4"
        subprocess.run(["ffmpeg", "-y", "-v", "error", "-f", "concat", "-safe", "0", "-i", lst, "-i", wav, "-map", "0:v", "-map", "1:a",
                        "-c:v", "copy", "-c:a", "aac", "-b:a", "256k", "-shortest", "-movflags", "+faststart", final], check=True)
        print(final)
    elif MODE == "audio":
        print(build_audio(f"{OUT}/akis_ses.wav"))
