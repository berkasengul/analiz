#!/usr/bin/env python3
"""Doksan Dokuz — "Akış" stili motor (Karga Zihni'nin karga-edit/render_akis.py motorundan uyarlandı).

Kurallar (STIL-AKIS.md):
- Açık krem zemin, tek vurgu rengi, kalın sans + anahtar kelimede italik serif.
- Yazı kelime kelime, anlatımın kelime zamanlarında blur-in ile gelir.
- Kesme yok: tek sonsuz tuval, kamera istasyondan istasyona kayar (hareket bulanıklığı).
  Bölüm arası kısa karartma + "Bölüm N: *ad*".
- Önemli cümlede odak geçişi: arka plan bulanıklaşır, cümle tek başına kalır.
- Ses: yalnızca pop / tık / zil / tuş. Whoosh, boom, riser YOK. Müzik konuşmanın altında kısılır.
- Her teslimde iki sürüm: hafif müzikli + müziksiz.

  python3 akis.py BUILD stills 3.5 20 61        # kontrol kareleri
  python3 akis.py BUILD render [cekirdek]       # tam video (müzikli + müziksiz)
BUILD içinde: vo/NN.mp3 + vo/NN.json (tts.py), img/ (fotoğraflar), fonts/ (InterTight500/600/800,
InstrumentSerifItalic, JBMono), avatar.png (kanal profil fotoğrafı).
"""
import json
import math
import os
import re
import subprocess
import sys
import wave
from contextlib import contextmanager

import numpy as np
import skia

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from script import SCENES  # noqa: E402

A = os.path.abspath(sys.argv[1]) if len(sys.argv) > 1 else os.path.join(HERE, "build")
MODE = sys.argv[2] if len(sys.argv) > 2 else "stills"
OUT = f"{A}/akis"
os.makedirs(OUT, exist_ok=True)
W, H = 1920, 1080
FPS = int(os.environ.get("FPS", "60"))

# ================= palet (Akış yapısı, Doksan Dokuz kırmızısı) =================
def C(h, a=1.0):
    h = h.lstrip("#")
    return skia.Color4f(int(h[0:2], 16) / 255, int(h[2:4], 16) / 255, int(h[4:6], 16) / 255, a)

BG = "#F6F4EF"
BG_EDGE = "#EAE6DE"
INK = "#14182B"
NAVY = "#1A1F36"
ACC = os.environ.get("ACCENT", "#E3262E")      # vurgu (Doksan Dokuz kırmızısı)
ACC_T = os.environ.get("ACCENT_T", "#C81E27")  # açık zeminde okunur vurgu (italik kelimeler)
LINE = "#F3B3AE"
MUTED = "#7D8296"
SOFT = "#EFEBE4"
CARD = "#FFFFFF"
GREEN = "#2E9E62"

# ================= yardımcılar =================
def clamp(x, a=0.0, b=1.0): return max(a, min(b, x))
def prog(t, a, b): return clamp((t - a) / (b - a)) if b > a else float(t >= a)
def lerp(a, b, p): return a + (b - a) * p
def eout(x): return 1 - (1 - x) ** 4
def eio(x): return 4 * x ** 3 if x < .5 else 1 - (-2 * x + 2) ** 3 / 2
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

def card(c, x, y, w, h, r=20, color=CARD, a=1.0, sh=0.10):
    shadow(c, x, y, w, h, r, sh * a, 28, 16)
    shadow(c, x, y, w, h, r, sh * .6 * a, 4, 2)
    rrect(c, x, y, w, h, r, color, a)

def appear(t, t0, dur=0.5, t1=None, out=0.35, rise=16, blur=14):
    if t0 is None or t < t0: return None
    p = eout(prog(t, t0, t0 + dur))
    a, b, dy, s = p, (1 - p) * blur, (1 - p) * rise, 1.06 - 0.06 * p
    if t1 is not None and t >= t1:
        q = eio(prog(t, t1, t1 + out))
        if q >= 1: return None
        a *= 1 - q; b += q * 16; s *= 1 + 0.03 * q; dy -= q * 8
    return a, b, dy, s

@contextmanager
def fx(c, st, px, py, bounds=None):
    a, b, dy, s = st
    if a > .999 and b < .25 and abs(dy) < .05 and abs(s - 1) < .001:
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

SAMP = skia.SamplingOptions(skia.FilterMode.kLinear, skia.MipmapMode.kLinear)

# ================= ikonlar =================
ICONS = {
    "check": '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    "ball": '<circle cx="12" cy="12" r="9"/><path d="M12 7.5l4 3-1.5 4.7h-5L8 10.5z"/><path d="M12 7.5V3.2M16 10.5l4.3-1.6M14.5 15.2l2.6 3.8M9.5 15.2l-2.6 3.8M8 10.5L3.7 8.9"/>',
    "trophy": '<path d="M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M7 6H4v1.5A3.5 3.5 0 0 0 7.5 11M17 6h3v1.5a3.5 3.5 0 0 1-3.5 3.5"/><path d="M12 14v4M8 21h8M9.5 18h5"/>',
    "calendar": '<rect x="3.5" y="5" width="17" height="15.5" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
    "pen": '<path d="M4 20l.6-4.2L16 4.4l3.6 3.6L8.2 19.4z"/><path d="M13.8 6.6l3.6 3.6"/>',
    "clock": '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    "msg": '<path d="M4 5h16v11H9l-5 4z"/>',
    "swap": '<path d="M4 8h13l-3-3M20 16H7l3 3"/>',
    "flag": '<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>',
    "plane": '<path d="M3 13l18-7-7 18-2.5-7.5z"/>',
    "star": '<path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9z"/>',
    "thumb": '<path d="M7 10.5v10H3.8v-10z"/><path d="M7 10.5l4.2-8c1.7 0 2.8 1.2 2.4 3l-.9 3.8h5.6c1.4 0 2.4 1.3 2.1 2.6l-1.6 7c-.2 1-1.1 1.6-2.1 1.6H7"/>',
    "bell": '<path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.8 2H4.2z"/><path d="M10 21a2.2 2.2 0 0 0 4 0"/>',
    "shirt": '<path d="M8 3l-5 3 2 4 2-1v12h10V9l2 1 2-4-5-3a4 4 0 0 1-8 0z"/>',
    "chart": '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    "book": '<path d="M4 4.5h6a2 2 0 0 1 2 2V20a2 2 0 0 0-2-2H4z"/><path d="M20 4.5h-6a2 2 0 0 0-2 2V20a2 2 0 0 1 2-2h6z"/>',
    "door": '<path d="M5 21V4h14v17"/><path d="M3 21h18"/><circle cx="15" cy="12.5" r=".9"/>',
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
    _ICON_IMG[key] = s.makeImageSnapshot().withDefaultMipmaps()
    return _ICON_IMG[key]

def icon(c, name, cx, cy, size, color="#FFFFFF", fill=False, a=1.0, sw=2.0):
    p = skia.Paint(AntiAlias=True); p.setAlphaf(a)
    c.drawImageRect(icon_img(name, color, fill, sw), skia.Rect.MakeXYWH(cx - size / 2, cy - size / 2, size, size), SAMP, p)

# ================= görseller =================
_IMG = {}
def photo_img(key):
    if key not in _IMG:
        from PIL import Image
        d = f"{A}/img"
        fn = next((f for f in os.listdir(d) if os.path.splitext(f)[0] == key and os.path.getsize(f"{d}/{f}") > 0), None)
        if fn is None:
            _IMG[key] = None
            return None
        im = Image.open(f"{d}/{fn}").convert("RGBA")
        if im.width > 1800: im = im.resize((1800, round(im.height * 1800 / im.width)), Image.LANCZOS)
        _IMG[key] = skia.Image.fromarray(np.ascontiguousarray(np.asarray(im)), colorType=skia.kRGBA_8888_ColorType).withDefaultMipmaps()
    return _IMG[key]

def draw_photo(c, key, x, y, w, h, r, crop=None, zoom=1.0, a=1.0):
    """crop: (fx, fy, fs) — odak noktası (0-1) ve çerçeve ölçeği (1 = en büyük kırpım)."""
    im = photo_img(key)
    if im is None:
        rrect(c, x, y, w, h, r, SOFT, a); icon(c, "shirt", x + w / 2, y + h / 2, min(w, h) * .3, "#C9C3B8", sw=1.5, a=a)
        return
    iw, ih = im.width(), im.height()
    fxp, fyp, fs = crop or (0.5, 0.5, 1.0)
    ar = w / h
    cw, ch = (ih * ar, ih) if iw / ih > ar else (iw, iw / ar)
    cw, ch = cw * fs / zoom, ch * fs / zoom
    sx = clamp(fxp * iw - cw / 2, 0, iw - cw); sy = clamp(fyp * ih - ch / 2, 0, ih - ch)
    c.save(); c.clipRRect(skia.RRect.MakeRectXY(skia.Rect.MakeXYWH(x, y, w, h), r, r), True)
    p = skia.Paint(AntiAlias=True); p.setAlphaf(a)
    c.drawImageRect(im, skia.Rect.MakeXYWH(sx, sy, cw, ch), skia.Rect.MakeXYWH(x, y, w, h), SAMP, p)
    c.restore()

def avatar_photo(c, key, cx, cy, r, crop=None, a=1.0, ring=ACC):
    g = paint(ring, .25 * a); g.setMaskFilter(skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, r * .35))
    c.drawCircle(cx, cy + r * .12, r, g)
    c.save(); pth = skia.Path(); pth.addCircle(cx, cy, r); c.clipPath(pth, doAntiAlias=True)
    draw_photo(c, key, cx - r, cy - r, 2 * r, 2 * r, 0, crop, a=a)
    c.restore()
    c.drawCircle(cx, cy, r, paint("#FFFFFF", a, max(4, r * .06)))

# ================= kelime eşleme =================
def norm(s):
    s = s.replace("İ", "i").replace("I", "ı").lower()
    return re.sub(r"[^\wçğıöşüâîûé]", "", s)

class Words:
    """Bir sahnenin seslendirme kelimeleri (mutlak zaman)."""
    def __init__(self, words, t0):
        self.w = [(a + t0, a + d + t0, norm(x), x) for a, d, x in words]

    def find(self, phrase, after=-1e9):
        toks = [norm(p) for p in phrase.split() if norm(p)]
        for i in range(len(self.w)):
            if self.w[i][0] < after - 1e-6: continue
            ok = all(i + j < len(self.w) and self.w[i + j][2].startswith(tk[:max(3, len(tk) - 2)]) if len(tk) > 2
                     else (i + j < len(self.w) and self.w[i + j][2] == tk) for j, tk in enumerate(toks))
            if ok: return self.w[i][0]
        return None

    def word_times(self, words, after):
        """Satırdaki her kelimeyi anlatımda sırayla bulur; bulunamazsa önceki kelimeden 0.14 sn sonra."""
        out, cur = [], after
        for wd in words:
            t = self.find(wd, cur - 0.05) if norm(wd) else None
            if t is None or t > cur + 3.0:
                t = cur + (0.14 if out else 0)
            out.append(t); cur = t
        return out

    @property
    def end(self):
        return self.w[-1][1] if self.w else 0

# ================= çizgi büyütme / düğüm =================
def grow(c, pts, p, color=LINE, sw=3.5, a=1.0, tip=True):
    if p <= 0: return
    path = skia.Path(); path.moveTo(*pts[0])
    for q in pts[1:]: path.lineTo(*q)
    pm = skia.PathMeasure(path, False); L = pm.getLength()
    seg = skia.Path(); pm.getSegment(0, L * p, seg, True)
    c.drawPath(seg, paint(color, a, sw))
    if tip and p < 1:
        pos, _ = pm.getPosTan(L * p)
        g = paint(ACC, .55 * a); g.setMaskFilter(skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, 9))
        c.drawCircle(pos.x(), pos.y(), 11, g)
        c.drawCircle(pos.x(), pos.y(), 4.5, paint("#FFFFFF", a))

def parse_words(s):
    """'Mourinho *öfkeli.*' -> [('Mourinho','b'), ('öfkeli.','i')]"""
    out, it = [], False
    for w in s.split():
        if w.startswith("*"): it = True
        out.append((w.replace("*", ""), "i" if it else "b"))
        if w.endswith("*"): it = False
    return out

def draw_line(c, t, words, times, cx, base, size, t1=None, color=INK, acc=ACC_T, align="center"):
    si = size * 1.2
    fs = [("i", si) if k == "i" else ("b", size) for _, k in words]
    ws = [tw(w, k, s) for (w, _), (k, s) in zip(words, fs)]
    sp = size * .27
    total = sum(ws) + sp * (len(ws) - 1)
    x = cx - total / 2 if align == "center" else (cx if align == "left" else cx - total)
    for (wd, k), t0, (fk, fsz), w in zip(words, times, fs, ws):
        st = appear(t, t0, 0.45, t1, 0.3, rise=10, blur=12)
        if st:
            with fx(c, st, x + w / 2, base - size * .35, (x, base - size * 1.1, x + w, base + size * .4)):
                text(c, wd, x, base, fk, fsz, acc if k == "i" else color, track=-size * .012 if k == "b" else 0)
        x += w + sp
    return total

SFX = []
def sfx(t, kind, g=1.0):
    if t is not None: SFX.append((t, kind, g))

def cursor(c, t, keys, clicks=(), t_out=None):
    if t < keys[0][0] - .25: return
    if t_out is not None and t > t_out + .3: return
    a = eout(prog(t, keys[0][0] - .25, keys[0][0])) * ((1 - eio(prog(t, t_out, t_out + .3))) if t_out else 1)
    x, y = keys[0][1], keys[0][2]
    for k0, k1 in zip(keys, keys[1:]):
        if t >= k0[0]:
            p = eio(prog(t, k0[0], k1[0])); x, y = lerp(k0[1], k1[1], p), lerp(k0[2], k1[2], p)
            y -= math.sin(p * math.pi) * 40
    s = 1.0
    for ck in clicks:
        if ck - .08 <= t <= ck + .25:
            s = 1 - .18 * math.sin(math.pi * prog(t, ck - .08, ck + .12))
            rr = eout(prog(t, ck, ck + .45))
            c.drawCircle(x, y, 10 + 34 * rr, paint(ACC, .45 * (1 - rr) * a, 3))
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

def name_pill(c, s, cx, y, size=26, dot=ACC, a=1.0):
    w = tw(s, "s", size) + 70; h = size * 2.1
    x = cx - w / 2
    shadow(c, x, y, w, h, h / 2, .16 * a, 18, 8)
    rrect(c, x, y, w, h, h / 2, CARD, a)
    c.drawCircle(x + 28, y + h / 2, 7, paint(dot, a))
    text(c, s, x + 46, y + h / 2 + size * .36, "s", size, INK, a)
    return w

# ================= öğeler =================
class El:
    """Plan girdisinden çizilebilir öğe. Zamanlar Scene.resolve ile çözülür."""
    def __init__(self, spec, sc):
        self.s = spec; self.sc = sc
        self.t0 = sc.when(spec.get("cue"), spec.get("at", 0.0))
        self.t1 = sc.when(spec.get("out"), None) if spec.get("out") else None
        self.setup()
    def setup(self): pass
    def g(self, k, d=None): return self.s.get(k, d)
    def sfx(self): sfx(self.t0, "pop", .4)


class Photo(El):
    def sfx(self): sfx(self.t0, "pop", .45)
    def draw(self, c, t):
        st = appear(t, self.t0, .55, self.t1, rise=26)
        if not st: return
        x, y, w, h = self.g("x", 0), self.g("y", 0), self.g("w", 600), self.g("h", 700)
        rot = self.g("rot", 0)
        X, Y = x - w / 2, y - h / 2
        with fx(c, st, x, y, (X - 60, Y - 60, X + w + 60, Y + h + 120)):
            c.save(); c.translate(x, y); c.rotate(rot); c.translate(-x, -y)
            pad = self.g("pad", 12)
            card(c, X - pad, Y - pad, w + 2 * pad, h + 2 * pad, 24, sh=.16)
            kb = 1 + 0.06 * prog(t, self.t0, self.t0 + 9)
            draw_photo(c, self.g("key"), X, Y, w, h, 16, self.g("crop"), kb)
            c.restore()
            if self.g("cap"):
                name_pill(c, self.g("cap"), x, Y + h + pad + 22)


class Line(El):
    def setup(self):
        self.words = parse_words(self.g("text"))
        self.times = self.sc.words.word_times([w for w, _ in self.words], self.t0) if self.g("sync", True) \
            else [self.t0 + i * .14 for i in range(len(self.words))]
    def sfx(self): sfx(self.times[0], "pop", .35)
    def draw(self, c, t):
        draw_line(c, t, self.words, self.times, self.g("x", 0), self.g("y", 0), self.g("size", 84), self.t1,
                  color=self.g("color", INK), align=self.g("align", "center"))


class Stat(El):
    def sfx(self):
        sfx(self.t0, "pop", .4)
        for k in range(10): sfx(self.t0 + .12 + k * .07, "tick", .35)
    def draw(self, c, t):
        st = appear(t, self.t0, .5, self.t1, rise=22)
        if not st: return
        x, y, w, h = self.g("x", 0), self.g("y", 0), self.g("w", 380), self.g("h", 300)
        X, Y = x - w / 2, y - h / 2
        with fx(c, st, x, y, (X, Y, X + w, Y + h)):
            card(c, X, Y, w, h, 26, sh=.12)
            v = self.g("val")
            p = eout(prog(t, self.t0 + .1, self.t0 + .9))
            if isinstance(v, (int, float)):
                s = f"{self.g('pre', '')}{int(round(v * p)) if isinstance(v, int) else round(v * p, 1)}"
            else:
                s = v
            size = self.g("size", 128)
            text(c, s, x, Y + h * .58, "b", size, INK, align="center", track=-size * .02)
            if self.g("suf"):
                text(c, self.g("suf"), x + tw(s, "b", size) / 2 + 10, Y + h * .58, "i", size * .6, ACC_T)
            text(c, self.g("label"), x, Y + h - 40, "s", 30, MUTED, align="center")
            rrect(c, X + 30, Y + 28, 56, 8, 4, ACC)


class Steps(El):
    """Akış zaman çizelgesi: halkalar, yıllar, uzayan çizgi."""
    def setup(self):
        self.items = [(a, b, self.sc.when(cue, self.g("at", 0) + i * 1.2)) for i, (a, b, cue) in enumerate(self.g("items"))]
    def sfx(self):
        for _, _, tt in self.items: sfx(tt, "step", .55)
    def draw(self, c, t):
        n = len(self.items); gap = self.g("gap", 470)
        ox, oy = self.g("x", 0), self.g("y", 60)
        xs = [ox + (i - (n - 1) / 2) * gap for i in range(n)]
        st = appear(t, self.items[0][2] - .4, .5)
        if not st: return
        with fx(c, st, ox, oy, (xs[0] - 80, oy - 10, xs[-1] + 80, oy + 10)):
            c.drawLine(xs[0], oy, xs[-1], oy, paint("#E2DDD3", 1, 4))
        for i, (yr, lab, t0) in enumerate(self.items):
            x = xs[i]
            st = appear(t, self.items[0][2] - .4 + i * .08, .5)
            if not st: continue
            with fx(c, st, x, oy, (x - 230, oy - 150, x + 230, oy + 190)):
                fill = eout(prog(t, t0, t0 + .45))
                c.drawCircle(x, oy, 54, paint(BG)); c.drawCircle(x, oy, 54, paint("#DCD6CB", 1, 3))
                if fill > 0:
                    gp = paint(ACC, .3 * fill); gp.setMaskFilter(skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, 22))
                    c.drawCircle(x, oy + 8, 54, gp)
                    c.drawCircle(x, oy, 54 * (.6 + .4 * fill), paint(ACC, fill))
                icon(c, self.g("icons", ["calendar"] * n)[i], x, oy, 46, "#FFFFFF" if fill > .5 else "#BDB6AA", sw=2)
                text(c, yr, x, oy - 84, "mono", 26, ACC_T if fill > .5 else MUTED, align="center")
                for li, ln in enumerate(wrap_words(lab, "b", 30, gap - 40)):
                    text(c, ln, x, oy + 106 + li * 38, "b", 30, INK if fill > .5 else MUTED, align="center")
            if i < n - 1:
                p = eio(prog(t, t0 + .2, self.items[i + 1][2] - .05))
                if p > 0: grow(c, [(x + 56, oy), (xs[i + 1] - 56, oy)], p, ACC, 4)


def wrap_words(s, k, size, maxw):
    out, cur = [], ""
    for w in s.split():
        tst = (cur + " " + w).strip()
        if tw(tst, k, size) <= maxw: cur = tst
        else:
            if cur: out.append(cur)
            cur = w
    if cur: out.append(cur)
    return out


class Nodes(El):
    """Fotoğraflı düğümler + merkez kart (üçgen)."""
    def setup(self):
        self.nodes = [(key, lab, x, y, self.sc.when(cue, 1 + i)) for i, (key, lab, x, y, cue) in enumerate(self.g("nodes"))]
        self.tc = self.sc.when(self.g("center_cue"), 3)
    def sfx(self):
        for n in self.nodes: sfx(n[4], "pop", .5)
        sfx(self.tc, "ding", .35)
    def draw(self, c, t):
        cx, cy = self.g("cx", 0), self.g("cy", 40)
        for i, (key, lab, x, y, t0) in enumerate(self.nodes):
            p = eout(prog(t, max(self.tc, t0) - .1, max(self.tc, t0) + .5))
            grow(c, [(cx, cy), (x, y)], p, LINE, 4)
        st = appear(t, self.tc, .5)
        if st:
            s = self.g("center")
            w = tw(s, "b", 46) + 90; h = 96
            with fx(c, st, cx, cy, (cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2)):
                card(c, cx - w / 2, cy - h / 2, w, h, h / 2, NAVY, sh=.2)
                text(c, s, cx, cy + 16, "b", 46, "#FFFFFF", align="center")
        for key, lab, x, y, t0 in self.nodes:
            st = appear(t, t0, .55)
            if not st: continue
            r = self.g("r", 120)
            with fx(c, st, x, y, (x - r - 120, y - r - 20, x + r + 120, y + r + 110)):
                avatar_photo(c, key, x, y, r, self.g("crops", {}).get(key))
                name_pill(c, lab, x, y + r + 20, 28)


class Score(El):
    def setup(self):
        self.evs = [(mn, tx, self.sc.when(cue, 1 + i)) for i, (mn, tx, cue) in enumerate(self.g("events"))]
        self.steps = [(self.sc.when(cue, None), h, a) for cue, h, a in self.g("steps", [])]
    def sfx(self):
        sfx(self.t0, "pop", .45)
        for e in self.evs: sfx(e[2], "pop", .35)
        for s in self.steps: sfx(s[0], "ding", .4)
    def draw(self, c, t):
        st = appear(t, self.t0, .55, self.t1, rise=24)
        if not st: return
        x, y = self.g("x", 0), self.g("y", -250)
        w, h = 1300, 200
        X, Y = x - w / 2, y - h / 2
        hs, as_ = self.g("start", (0, 0))
        flash = 0
        for ts, h_, a_ in self.steps:
            if ts is not None and t >= ts:
                hs, as_ = h_, a_
                flash = max(flash, 1 - prog(t, ts, ts + .45))
        with fx(c, st, x, y, (X, Y - 60, X + w, Y + h)):
            card(c, X, Y, w, h, 28, sh=.13)
            text(c, self.g("label"), x, Y - 26, "mono", 24, MUTED, align="center")
            text(c, self.g("home"), x - 210, y + 22, "b", 60, INK, align="right")
            text(c, self.g("away"), x + 210, y + 22, "b", 60, INK, align="left")
            sc = f"{hs} – {as_}"
            s = 1 + .14 * eback(flash) if flash > 0 else 1
            c.save(); c.translate(x, y); c.scale(s, s); c.translate(-x, -y)
            rrect(c, x - 150, y - 62, 300, 124, 24, SOFT)
            text(c, sc, x, y + 36, "b", 96, ACC_T if flash > 0 else INK, align="center")
            c.restore()
        for i, (mn, tx, t0) in enumerate(self.evs):
            st2 = appear(t, t0, .45, self.t1, rise=14)
            if not st2: continue
            ey = Y + h + 70 + i * 86
            hl = "ARDA" in tx.upper()
            with fx(c, st2, x, ey, (x - 520, ey - 40, x + 520, ey + 40)):
                bx = x - 520
                mw = tw(mn, "mono", 26)
                bw = mw + tw(tx, "s", 32) + 90
                shadow(c, bx, ey - 34, bw, 68, 34, .12, 16, 6)
                rrect(c, bx, ey - 34, bw, 68, 34, NAVY if hl else CARD)
                text(c, mn, bx + 30, ey + 10, "mono", 26, ACC if hl else ACC_T)
                text(c, tx, bx + 54 + mw, ey + 11, "s", 32, "#FFFFFF" if hl else INK)


class Bars(El):
    """İki taraflı karşılaştırma (Arda sahada / Arda yok)."""
    def setup(self):
        self.rows = [(lab, a, b, suf, self.sc.when(cue, 1 + i)) for i, (lab, a, b, suf, cue) in enumerate(self.g("rows"))]
    def sfx(self):
        for r in self.rows: sfx(r[4], "pop", .4)
    def draw(self, c, t):
        x, y = self.g("x", 0), self.g("y", -300)
        st = appear(t, self.t0, .5)
        if st:
            with fx(c, st, x, y, (x - 700, y - 60, x + 700, y + 30)):
                name_pill(c, self.g("left", "Arda sahada"), x - 330, y - 40, 28, ACC)
                name_pill(c, self.g("right", "Arda yok"), x + 330, y - 40, 28, MUTED)
        for i, (lab, a, b, suf, t0) in enumerate(self.rows):
            st = appear(t, t0, .5, rise=18)
            if not st: continue
            ry = y + 90 + i * self.g("gap", 150)
            with fx(c, st, x, ry, (x - 760, ry - 60, x + 760, ry + 60)):
                card(c, x - 760, ry - 58, 1520, 116, 22, sh=.08)
                text(c, lab, x, ry - 18, "s", 26, MUTED, align="center")
                p = eout(prog(t, t0 + .1, t0 + 1.0))
                m = max(a, b); maxw = 470
                wa, wb = maxw * a / m * p, maxw * b / m * p
                rrect(c, x - 70 - maxw, ry + 6, maxw, 22, 11, SOFT)
                rrect(c, x + 70, ry + 6, maxw, 22, 11, SOFT)
                rrect(c, x - 70 - wa, ry + 6, wa, 22, 11, ACC)
                rrect(c, x + 70, ry + 6, wb, 22, 11, "#9AA0B5")
                dec = self.g("dec", 1)
                fmt = (lambda v: f"{v * p:.{dec}f}".replace(".", ",")) if isinstance(a, float) else (lambda v: f"{int(round(v * p))}")
                text(c, f"{suf}{fmt(a)}", x - 90 - maxw, ry + 30, "b", 48, INK, align="right")
                text(c, f"{suf}{fmt(b)}", x + 90 + maxw, ry + 30, "b", 48, MUTED, align="left")


class Poll(El):
    def setup(self):
        self.opts = self.g("options")
    def sfx(self):
        for i in range(len(self.opts)): sfx(self.t0 + .3 + i * .35, "pop", .35)
    def draw(self, c, t):
        st = appear(t, self.t0, .55, self.t1, rise=24)
        if not st: return
        x, y = self.g("x", 0), self.g("y", 0)
        w, h = 1180, 520
        X, Y = x - w / 2, y - h / 2
        with fx(c, st, x, y, (X, Y, X + w, Y + h)):
            card(c, X, Y, w, h, 28, sh=.13)
            text(c, self.g("title"), X + 50, Y + 74, "b", 38, INK)
            text(c, self.g("sub", ""), X + w - 50, Y + 74, "mono", 22, MUTED, align="right")
            for i, (lab, pct) in enumerate(self.opts):
                ty = Y + 150 + i * 120
                p = eout(prog(t, self.t0 + .3 + i * .35, self.t0 + 1.4 + i * .35))
                text(c, lab, X + 50, ty + 10, "s", 30, INK if i == 0 else MUTED)
                rrect(c, X + 50, ty + 34, w - 260, 30, 15, SOFT)
                rrect(c, X + 50, ty + 34, max(30, (w - 260) * pct / 100 * p), 30, 15, ACC if i == 0 else "#B8B2A7")
                text(c, f"%{int(round(pct * p))}", X + w - 50, ty + 62, "b", 50, ACC_T if i == 0 else MUTED, align="right")


class Compare(El):
    def setup(self):
        self.rows = self.g("rows")
        span = max(2.5, (self.sc.vo_end - self.t0) * .85)
        self.times = [self.t0 + .6 + span * i / len(self.rows) for i in range(len(self.rows))]
    def sfx(self):
        sfx(self.t0, "pop", .45)
        for tt in self.times: sfx(tt, "pop", .35)
    def draw(self, c, t):
        st = appear(t, self.t0, .55)
        if not st: return
        x, y = self.g("x", 0), self.g("y", 0)
        with fx(c, st, x, y - 330, (x - 800, y - 480, x + 800, y - 180)):
            avatar_photo(c, self.g("lkey"), x - 560, y - 340, 105, self.g("lcrop"))
            avatar_photo(c, self.g("rkey"), x + 560, y - 340, 105, self.g("rcrop"))
            text(c, self.g("lname"), x - 560, y - 190, "b", 44, INK, align="center")
            text(c, self.g("rname"), x + 560, y - 190, "b", 44, INK, align="center")
            text(c, "vs", x, y - 320, "i", 70, ACC_T, align="center")
        for i, ((lab, a, b), t0) in enumerate(zip(self.rows, self.times)):
            st2 = appear(t, t0, .45, rise=14)
            if not st2: continue
            ry = y - 90 + i * 112
            with fx(c, st2, x, ry, (x - 760, ry - 50, x + 760, ry + 50)):
                card(c, x - 760, ry - 46, 1520, 92, 20, sh=.07)
                text(c, lab, x, ry + 9, "s", 24, MUTED, align="center")
                text(c, a, x - 560, ry + 14, "b", 40, INK, align="center")
                text(c, b, x + 560, ry + 14, "b", 40, INK, align="center")
                if a == b:
                    for sx_ in (-330, 330):
                        c.drawCircle(x + sx_, ry, 22, paint(ACC))
                        icon(c, "check", x + sx_, ry, 26, sw=3)


class Results(El):
    def setup(self):
        rows, prev = [], -1e9
        for i, (o, s_, r, cue) in enumerate(self.g("rows")):
            tt = max(self.sc.when(cue, 1 + i), prev + .45); prev = tt
            rows.append((o, s_, r, tt))
        self.rows = rows
    def sfx(self):
        for r in self.rows: sfx(r[3], "pop", .4)
    def draw(self, c, t):
        x, y = self.g("x", 0), self.g("y", -200)
        st = appear(t, self.t0, .5)
        if st:
            with fx(c, st, x, y - 120, (x - 600, y - 160, x + 600, y - 90)):
                text(c, self.g("title"), x, y - 110, "mono", 26, MUTED, align="center")
        for i, (opp, sc_, res, t0) in enumerate(self.rows):
            st2 = appear(t, t0, .5, rise=16)
            if not st2: continue
            ry = y + i * 150
            with fx(c, st2, x, ry, (x - 620, ry - 60, x + 620, ry + 60)):
                card(c, x - 660, ry - 56, 1320, 112, 24, sh=.09)
                text(c, "Türkiye", x - 230, ry + 16, "b", 46, INK, align="right")
                text(c, sc_ or "—", x, ry + 18, "b", 52, ACC_T, align="center")
                text(c, opp, x + 200, ry + 16, "b", 46, INK, align="left")
                bc = GREEN if res == "G" else ACC
                lab = "Galibiyet" if res == "G" else "Yenilgi"
                bw_ = tw(lab, "s", 22) + 40
                rrect(c, x + 630 - bw_, ry - 24, bw_, 48, 24, bc)
                text(c, lab, x + 630 - bw_ / 2, ry + 8, "s", 22, "#FFFFFF", align="center")


class Lineup(El):
    def setup(self):
        self.swap = self.sc.when(self.g("swap_cue"), 3)
    def sfx(self):
        sfx(self.t0, "pop", .45); sfx(self.swap, "click", .7); sfx(self.swap + .05, "ding", .3)
    def draw(self, c, t):
        st = appear(t, self.t0, .55, rise=24)
        if not st: return
        x, y = self.g("x", 0), self.g("y", 30)
        w, h = 900, 780
        X, Y = x - w / 2, y - h / 2
        with fx(c, st, x, y, (X, Y, X + w, Y + h)):
            card(c, X, Y, w, h, 28, sh=.13)
            px0, py0, px1, py1 = X + 50, Y + 50, X + w - 50, Y + h - 50
            rrect(c, px0, py0, px1 - px0, py1 - py0, 14, "#EEF2EA")
            lc = paint("#CFD8C9", 1, 3)
            c.drawRect(skia.Rect.MakeLTRB(px0, py0, px1, py1), lc)
            c.drawRect(skia.Rect.MakeLTRB(x - 170, py1 - 130, x + 170, py1), lc)
            c.drawArc(skia.Rect.MakeLTRB(x - 100, py0 - 100, x + 100, py0 + 100), 0, 180, False, lc)
            pos = [(.5, .9), (.15, .7), (.38, .73), (.62, .73), (.85, .7), (.3, .48), (.5, .53), (.7, .48), (.18, .2), (.5, .15), (.82, .2)]
            for i, (fx_, fy_) in enumerate(pos):
                px = px0 + (px1 - px0) * fx_; py = py0 + (py1 - py0) * fy_
                if i == 10:
                    sw = prog(t, self.swap, self.swap + .5)
                    col = ACC if sw < .5 else NAVY
                    c.drawCircle(px, py, 30, paint(col)); c.drawCircle(px, py, 30, paint("#FFFFFF", 1, 4))
                    nm = self.g("out_name") if sw < .5 else self.g("in_name")
                    aa = abs(1 - 2 * sw) if 0 < sw < 1 else 1
                    name_pill(c, nm, px - 60, py + 44, 24, col, aa)
                    if sw >= 1:
                        s = self.g("out_name"); ww = tw(s, "s", 22)
                        text(c, s, px - 60, py - 52, "s", 22, MUTED, align="center")
                        c.drawLine(px - 60 - ww / 2 - 6, py - 59, px - 60 + ww / 2 + 6, py - 59, paint(ACC, 1, 3))
                else:
                    c.drawCircle(px, py, 24, paint(NAVY)); c.drawCircle(px, py, 24, paint("#FFFFFF", 1, 3))
            text(c, self.g("title"), x, Y - 24, "mono", 24, MUTED, align="center")


class Versus(El):
    def sfx(self): sfx(self.t0, "pop", .45); sfx(self.t0 + .4, "pop", .45)
    def draw(self, c, t):
        x, y = self.g("x", 0), self.g("y", 0)
        for j, ((name, pts), dx) in enumerate(((self.g("a"), -380), (self.g("b"), 380))):
            st = appear(t, self.t0 + j * .4, .55, rise=24)
            if not st: continue
            with fx(c, st, x + dx, y, (x + dx - 330, y - 230, x + dx + 330, y + 230)):
                card(c, x + dx - 320, y - 220, 640, 440, 30, sh=.13)
                text(c, name, x + dx, y - 20, "b", 66, INK, align="center")
                text(c, pts, x + dx, y + 90, "i", 80, ACC_T if j else MUTED, align="center")
        st = appear(t, self.t0 + .8, .4)
        if st:
            with fx(c, st, x, y, (x - 70, y - 70, x + 70, y + 70)):
                c.drawCircle(x, y, 62, paint(ACC)); text(c, "vs", x, y + 14, "i", 54, "#FFFFFF", align="center")
        st = appear(t, self.t0, .5)
        if st:
            with fx(c, st, x, y - 300, (x - 400, y - 340, x + 400, y - 270)):
                text(c, self.g("label"), x, y - 290, "mono", 26, MUTED, align="center")


# ---- saha animasyonu (temsili)
PLAYS = {
    "ozil_counter": {
        "players": [("H", 4, [(0, .22, .55), (.3, .3, .55)]), ("H", 23, [(0, .35, .45), (.2, .5, .48), (.45, .62, .5)], "Özil"),
                    ("H", 7, [(0, .4, .15), (.4, .65, .2), (.75, .86, .38)]), ("H", 9, [(0, .45, .7), (.6, .72, .62)]),
                    ("A", 5, [(0, .3, .5), (.4, .4, .5)]), ("A", 4, [(0, .7, .35), (.6, .78, .45)]), ("A", 3, [(0, .72, .62), (.6, .8, .58)]),
                    ("K", 1, [(0, .97, .5), (.8, .94, .45)])],
        "ball": [((.22, .55), (.42, .47), .05, .2), ((.42, .47), (.62, .5), .2, .45), ((.62, .5), (.84, .38), .5, .72),
                 ((.84, .38), (.995, .47), .78, .86)],
        "goals": [(.86, "Ronaldo")],
    },
    "roma_assists": {
        "players": [("H", 15, [(0, .62, .3), (.08, .68, .22), (.5, .7, .1)], "Arda"), ("H", 9, [(0, .72, .55), (.2, .86, .48), (.5, .84, .52)]),
                    ("H", 22, [(0, .6, .62), (.5, .82, .62), (.75, .9, .58)]), ("A", 23, [(0, .8, .4), (.25, .86, .42)]),
                    ("A", 5, [(0, .84, .6), (.7, .88, .55)]), ("A", 6, [(0, .7, .45)]), ("K", 1, [(0, .97, .5), (.3, .95, .46), (.8, .96, .53)])],
        "ball": [((.62, .3), (.86, .48), .08, .22), ((.86, .48), (.995, .44), .24, .3), ((.7, .1), (.9, .58), .55, .72),
                 ((.9, .58), (.995, .55), .74, .8)],
        "goals": [(.3, "Endrick"), (.8, "Rüdiger")],
    },
    "leipzig": {
        "players": [("H", 15, [(0, .62, .42), (.1, .72, .45), (.5, .7, .5), (.65, .76, .42)], "Arda"), ("H", 8, [(0, .55, .6), (.5, .6, .55)]),
                    ("H", 20, [(0, .75, .65), (.25, .9, .55)]), ("A", 4, [(0, .82, .45), (.6, .84, .44)]), ("A", 5, [(0, .84, .6)]),
                    ("K", 1, [(0, .97, .5), (.2, .95, .48), (.7, .96, .5)])],
        "ball": [((.55, .6), (.72, .45), .02, .1), ((.72, .45), (.95, .5), .12, .18), ((.95, .5), (.9, .56), .18, .22),
                 ((.9, .56), (.995, .53), .23, .28), ((.6, .55), (.76, .42), .55, .65), ((.76, .42), (.995, .4), .67, .74)],
        "goals": [(.28, "Bernardo"), (.74, "Arda")],
    },
}

def _interp(keys, f):
    if f <= keys[0][0]: return keys[0][1], keys[0][2]
    for (f0, x0, y0), (f1, x1, y1) in zip(keys, keys[1:]):
        if f0 <= f <= f1:
            q = eio((f - f0) / (f1 - f0)); return lerp(x0, x1, q), lerp(y0, y1, q)
    return keys[-1][1], keys[-1][2]


class Pitch(El):
    def setup(self):
        self.play = PLAYS[self.g("play")]
        self.span_end = self.sc.vo_end - .3
    def f(self, t):
        return clamp((t - self.t0 - .5) / max(1.0, self.span_end - self.t0 - .5))
    def sfx(self):
        sfx(self.t0, "pop", .45)
        span = max(1.0, self.span_end - self.t0 - .5)
        for fe, _ in self.play["goals"]: sfx(self.t0 + .5 + fe * span, "ding", .45)
    def draw(self, c, t):
        st = appear(t, self.t0, .55, rise=24)
        if not st: return
        x, y = self.g("x", 0), self.g("y", 0)
        w, h = 1500, 860
        X, Y = x - w / 2, y - h / 2
        f = self.f(t)
        with fx(c, st, x, y, (X, Y, X + w, Y + h)):
            card(c, X, Y, w, h, 30, sh=.13)
            px0, py0, px1, py1 = X + 50, Y + 50, X + w - 50, Y + h - 50
            rrect(c, px0, py0, px1 - px0, py1 - py0, 16, "#EEF2EA")
            lc = paint("#CFD8C9", 1, 3)
            c.drawRect(skia.Rect.MakeLTRB(px0, py0, px1, py1), lc)
            mx = (px0 + px1) / 2; my = (py0 + py1) / 2
            c.drawLine(mx, py0, mx, py1, lc); c.drawCircle(mx, my, 95, lc)
            bh = (py1 - py0) * .6
            for side in (0, 1):
                xa = px0 if side == 0 else px1; sg = 1 if side == 0 else -1
                c.drawRect(skia.Rect.MakeLTRB(min(xa, xa + sg * 220), my - bh / 2, max(xa, xa + sg * 220), my + bh / 2), lc)
                c.drawRect(skia.Rect.MakeLTRB(min(xa, xa + sg * 80), my - bh / 4, max(xa, xa + sg * 80), my + bh / 4), lc)
            P = lambda a, b: (px0 + (px1 - px0) * a, py0 + (py1 - py0) * b)
            text(c, "temsili animasyon", X + w - 40, Y + h - 18, "mono", 18, MUTED, align="right")
            for (a, b, f0, f1) in self.play["ball"]:
                if f < f0: continue
                q = clamp((f - f0) / (f1 - f0))
                grow(c, [P(*a), P(*b)], q, ACC if b[0] > .99 else LINE, 5)
            for pl in self.play["players"]:
                team, num, keys = pl[0], pl[1], pl[2]
                X1, Y1 = P(*_interp(keys, f))
                star = len(pl) > 3
                if star:
                    gp = paint(ACC, .3); gp.setMaskFilter(skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, 16))
                    c.drawCircle(X1, Y1 + 4, 40, gp)
                col = NAVY if team == "H" else ("#B8B2A7" if team == "A" else "#6B7085")
                if star: col = ACC
                c.drawCircle(X1, Y1, 26, paint(col)); c.drawCircle(X1, Y1, 26, paint("#FFFFFF", 1, 3.5))
                text(c, str(num), X1, Y1 + 8, "b", 22, "#FFFFFF", align="center")
                if star: name_pill(c, pl[3], X1, Y1 - 92, 24)
            # top
            bx, by = None, None
            for (a, b, f0, f1) in self.play["ball"]:
                if f0 <= f <= f1:
                    q = eio((f - f0) / (f1 - f0)); bx, by = P(lerp(a[0], b[0], q), lerp(a[1], b[1], q)); break
                if f > f1: bx, by = P(*b)
            if bx is None: bx, by = P(*self.play["ball"][0][0])
            c.drawCircle(bx, by, 11, paint("#FFFFFF")); c.drawCircle(bx, by, 11, paint(INK, 1, 2.5))
        span = max(1.0, self.span_end - self.t0 - .5)
        for fe, who in self.play["goals"]:
            tg = self.t0 + .5 + fe * span
            st2 = appear(t, tg, .45, tg + 2.2 if fe < .5 else None, rise=20)
            if st2:
                s = f"Gol · {who}"
                gw = tw(s, "b", 40) + 120
                with fx(c, st2, x, Y - 10, (x - gw / 2, Y - 60, x + gw / 2, Y + 40)):
                    shadow(c, x - gw / 2, Y - 50, gw, 84, 42, .2, 20, 8)
                    rrect(c, x - gw / 2, Y - 50, gw, 84, 42, ACC)
                    icon(c, "ball", x - gw / 2 + 46, Y - 8, 40, sw=1.8)
                    text(c, s, x - gw / 2 + 84, Y + 6, "b", 40, "#FFFFFF")


class Outro(El):
    def setup(self):
        self.tb = self.sc.when("abone", self.sc.vo_end - 3)
    def sfx(self):
        tb = self.tb
        sfx(tb - .6, "pop", .6); sfx(tb + .35, "click", .8); sfx(tb + .37, "ding", .3)
        sfx(tb + 1.05, "click", .8); sfx(tb + 1.1, "ding", .45); sfx(tb + 1.75, "click", .8); sfx(tb + 1.8, "bell", .5)
    def draw(self, c, t):
        tb = self.tb
        x, y = self.g("x", 0), self.g("y", 200)
        R, PW = 92, 690
        cx = x - (PW - .8 * R) / 2
        pop = eback(prog(t, tb - .6, tb - .15))
        if pop <= 0: return
        pw = PW * eio(prog(t, tb - .2, tb + .3))
        if pw > 4:
            h = 150; Y = y - h / 2
            shadow(c, cx, Y, pw + R * .2, h, h / 2, .25, 30, 14)
            rrect(c, cx, Y, pw + R * .2, h, h / 2, "#FFFFFF")
            c.save(); c.clipRect(skia.Rect.MakeXYWH(cx, Y, pw + R * .2, h))
            ix = cx + R + 70
            liked = t >= tb + .37
            sl = 1 + .25 * math.sin(math.pi * prog(t, tb + .37, tb + .67))
            c.save(); c.translate(ix, y); c.scale(sl, sl); icon(c, "thumb", 0, 0, 52, NAVY, fill=liked, sw=2.2); c.restore()
            if liked:
                for k in range(8):
                    ang = k * math.pi / 4; rr = 30 + 40 * eout(prog(t, tb + .37, tb + .85))
                    c.drawCircle(ix + math.cos(ang) * rr, y + math.sin(ang) * rr, 4 * (1 - prog(t, tb + .37, tb + .85)), paint(ACC))
            c.save(); c.translate(ix + 70, y + 4); c.scale(1, -1); icon(c, "thumb", 0, 0, 52, "#9AA0B5", sw=2.2); c.restore()
            subbed = t >= tb + 1.07
            bx = ix + 140; bw = lerp(214, 264, eio(prog(t, tb + 1.07, tb + 1.4))); bh = 70
            rrect(c, bx, y - bh / 2, bw, bh, bh / 2, "#E7E3DB" if subbed else ACC)
            text(c, "Abone Olundu" if subbed else "Abone Ol", bx + bw / 2, y + 10, "b", 27, INK if subbed else "#FFFFFF", align="center")
            bellx = bx + bw + 62
            rang = t >= tb + 1.77
            wig = math.sin((t - tb - 1.77) * 38) * 18 * (1 - prog(t, tb + 1.77, tb + 2.35)) if rang else 0
            c.save(); c.translate(bellx, y - 22); c.rotate(wig); c.translate(-bellx, -(y - 22))
            icon(c, "bell", bellx, y, 54, NAVY, fill=rang, sw=2.2)
            c.restore(); c.restore()
        r = R * pop
        g = paint(ACC, .35); g.setMaskFilter(skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, 30)); c.drawCircle(cx, y, r, g)
        avatar_photo(c, "avatar", cx, y, r, ring=ACC)
        if pw > 300:
            ix = cx + R + 70; bx = ix + 140
            cursor(c, t, [(tb - .2, cx + 700, y + 330), (tb + .3, ix + 6, y + 10), (tb + .8, ix + 6, y + 10), (tb + 1.03, bx + 110, y + 16),
                          (tb + 1.5, bx + 110, y + 16), (tb + 1.75, bx + 300, y + 16), (tb + 2.35, bx + 330, y + 60)],
                   clicks=[tb + .35, tb + 1.05, tb + 1.77], t_out=tb + 2.6)


class Quote(El):
    """Odak geçişi: arka plan bulanıklaşır, alıntı kelime kelime ekranda (ekran uzayı)."""
    screen = True
    def setup(self):
        words = parse_words(self.g("text"))
        size = self.g("size", 92)
        # en fazla 4 kelimelik satırlar
        lines, cur = [], []
        for w in words:
            cur.append(w)
            if len(cur) == 4 or w[0].endswith((".", ",", "?", ":")) and len(cur) >= 2:
                lines.append(cur); cur = []
        if cur: lines.append(cur)
        self.lines = lines
        flat = [w for ln in lines for w, _ in ln]
        times = self.sc.words.word_times(flat, self.t0)
        self.ltimes, k = [], 0
        for ln in lines:
            self.ltimes.append(times[k:k + len(ln)]); k += len(ln)
        self.size = size
        self.f0 = times[0] - .3
        self.f1 = (self.t1 - .1) if self.t1 else self.sc.end - .25
        self.who_t = times[-1] + .3
    def sfx(self): pass
    def focus(self, t):
        return eio(prog(t, self.f0, self.f0 + .32)) * (1 - eio(prog(t, self.f1, self.f1 + .35)))
    def draw(self, c, t):
        if t < self.f0 or t > self.f1 + .4: return
        n = len(self.lines); lh = self.size * 1.25
        y0 = H / 2 - (n - 1) * lh / 2 + 10
        out = self.f1
        st = appear(t, self.f0, .4, out)
        if st:
            with fx(c, st, W / 2, y0 - self.size * 1.3, (W / 2 - 60, y0 - self.size * 2, W / 2 + 60, y0 - self.size * .7)):
                text(c, "“", W / 2, y0 - self.size * .55, "i", self.size * 2.2, ACC_T, align="center")
        for i, (ln, tm) in enumerate(zip(self.lines, self.ltimes)):
            draw_line(c, t, ln, tm, W / 2, y0 + i * lh + self.size * .4, self.size, out)
        st = appear(t, self.who_t, .45, out)
        if st:
            yy = y0 + n * lh + 30
            with fx(c, st, W / 2, yy, (W / 2 - 400, yy - 40, W / 2 + 400, yy + 60)):
                name_pill(c, self.g("who"), W / 2, yy, 26)


class Pill(El):
    """Altta beliren bilgi hapı (ekran uzayı)."""
    screen = True
    def draw(self, c, t):
        st = appear(t, self.t0, .45, self.t1 or self.sc.end - .3, .3, rise=20)
        if not st: return
        s = self.g("text"); f = 30; w = tw(s, "s", f) + 112; h = 72
        x = W / 2 - w / 2; y = H - 128
        with fx(c, st, W / 2, y + h / 2, (x, y, x + w, y + h)):
            shadow(c, x, y, w, h, h / 2, .22, 24, 12)
            rrect(c, x, y, w, h, h / 2, CARD)
            c.drawCircle(x + 38, y + h / 2, 24, paint(ACC))
            icon(c, self.g("icon", "calendar"), x + 38, y + h / 2, 28)
            text(c, s, x + 76, y + h / 2 + 11, "s", f, INK)


class ChapterTitle(El):
    def setup(self):
        name = self.g("name")
        self.words = [("Bölüm", "b"), (f"{int(self.g('n'))}:", "b")] + [(w, "i") for w in name.split()]
        self.times = [self.sc.start + .85 + i * .16 for i in range(len(self.words))]
    def sfx(self):
        sfx(self.times[0], "pop", .4); sfx(self.times[2], "pop", .4)
    def draw(self, c, t):
        draw_line(c, t, self.words, self.times, 0, 30, 104)


KINDS = {"photo": Photo, "line": Line, "stat": Stat, "steps": Steps, "nodes": Nodes, "score": Score, "bars": Bars, "poll": Poll,
         "compare": Compare, "results": Results, "lineup": Lineup, "versus": Versus, "pitch": Pitch, "outro": Outro,
         "quote": Quote, "pill": Pill}

# ================= zaman çizelgesi =================
from plan import CHAPTER_NAMES, PLAN  # noqa: E402

CHAPTER_DUR = 2.7
MOVE = 0.8           # kamera kayma süresi
LEAD_MOVE = 0.75     # kamera kayarken anlatım bekler
LEAD_CH = 0.35
TAIL = 0.45


class Scene:
    def __init__(self, i, sc, start, lead, meta, hold=0.0):
        self.i, self.sc, self.start, self.lead, self.meta = i, sc, start, lead, meta
        self.chapter = sc["v"] == "chapter"
        vo = meta["dur"] if meta else 0
        self.dur = CHAPTER_DUR if self.chapter else lead + vo + TAIL + hold
        self.end = start + self.dur
        self.vo_start = start + lead
        self.vo_end = self.vo_start + vo
        self.words = Words(meta["words"] if meta else [], self.vo_start)
        self.pos = (0, 0)

    def when(self, cue, default):
        """cue: anlatımdaki ifade; bulunamazsa default (vo başlangıcına göre sn) ya da None."""
        if cue:
            t = self.words.find(cue, self.vo_start - .1)
            if t is not None: return t
            print(f"  ! sahne {self.i}: '{cue}' bulunamadı", file=sys.stderr)
        if default is None: return None
        return self.vo_start + default


def build(build_dir):
    scenes, t = [], 0.0
    prev_ch = True
    for i, sc in enumerate(SCENES):
        js = f"{build_dir}/vo/{i:02d}.json"
        meta = json.load(open(js)) if sc["vo"].strip() else None
        lead = 1.0 if i == 0 else (LEAD_CH if prev_ch else LEAD_MOVE)
        hold = sum(sp.get("sec", 0) for sp in PLAN.get(i, []) if sp["k"] == "hold")
        s = Scene(i, sc, t, lead, meta, hold)
        scenes.append(s); t = s.end
        prev_ch = s.chapter
    # istasyonlar: her bölüm ayrı bir bölge, bölüm içinde sahneler yan yana (zikzak)
    region, j = 0, 0
    for s in scenes:
        if s.chapter:
            region += 1; j = 0
            s.pos = (0, region * 3200)
        else:
            j += 1
            s.pos = (j * 2400, region * 3200 + (230 if j % 2 else -230))
    for s in scenes:
        specs = PLAN.get(s.i, [])
        s.els = [KINDS[sp["k"]](sp, s) for sp in specs if sp["k"] in KINDS]
        if s.chapter:
            s.els.append(ChapterTitle(dict(n=s.sc["n"], name=CHAPTER_NAMES.get(s.sc["n"], s.sc["name"])), s))
        s.cams = [sp for sp in specs if sp["k"] == "cam"]
    total = scenes[-1].end
    return scenes, total


def build_camera(scenes):
    keys = []
    prev = None
    for s in scenes:
        X, Y = s.pos
        if s.chapter:
            # karartmanın altında atla
            keys.append((s.start + .45, X, Y, 1.0)); keys.append((s.end, X, Y, 1.02))
            prev = (X, Y, 1.02); continue
        if prev is None:
            keys.append((s.start, X, Y, 1.0))
        else:
            keys.append((s.start, prev[0], prev[1], prev[2]))
            keys.append((s.start + MOVE, X, Y, 1.0))
        cx, cy, cz = X, Y, 1.0
        for cm in sorted(s.cams, key=lambda d: s.when(d.get("cue"), d.get("at", 0))):
            tc = s.when(cm.get("cue"), cm.get("at", 0))
            tc = max(tc, keys[-1][0] + .05)
            keys.append((tc, cx, cy, cz))
            cx, cy, cz = X + cm.get("x", 0), Y + cm.get("y", 0), cm.get("z", 1.0)
            keys.append((tc + cm.get("d", .8), cx, cy, cz))
        keys.append((max(s.end, keys[-1][0] + .05), cx, cy, cz * 1.03))
        prev = (cx, cy, cz * 1.03)
    return keys


def camera_at(keys, t):
    if t <= keys[0][0]: return keys[0][1:]
    lo, hi = 0, len(keys) - 1
    while hi - lo > 1:
        m = (lo + hi) // 2
        if keys[m][0] <= t: lo = m
        else: hi = m
    a, b = keys[lo], keys[hi]
    if t >= b[0]: return b[1:]
    p = eio(prog(t, a[0], b[0]))
    z = math.exp(lerp(math.log(a[3]), math.log(b[3]), p))
    return lerp(a[1], b[1], p), lerp(a[2], b[2], p), z


def dip(scenes, t):
    for s in scenes:
        if s.chapter and s.start - .1 <= t <= s.start + 1.2:
            return eio(prog(t, s.start, s.start + .4)) * (1 - eio(prog(t, s.start + .5, s.start + .85)))
    return 0.0


# ================= kare =================
GRAIN = None
def make_grain():
    rng = np.random.default_rng(3); out = []
    for _ in range(6):
        n = rng.normal(0, 1, (H // 2, W // 2)).astype(np.float32)
        arr = np.zeros((H // 2, W // 2, 4), np.uint8); arr[..., 3] = np.clip(n * 4 + 4, 0, 10).astype(np.uint8)
        out.append(skia.Image.fromarray(arr, colorType=skia.kRGBA_8888_ColorType))
    return out

def bg(c, cam):
    c.clear(C(BG))
    p = skia.Paint()
    p.setShader(skia.GradientShader.MakeRadial(skia.Point(W / 2, H * .42), W * .78,
                [C("#FBFAF7").toColor(), C(BG).toColor(), C(BG_EDGE).toColor()], [0, .55, 1]))
    c.drawRect(skia.Rect.MakeWH(W, H), p)
    cx, cy, z = cam
    step = 64 * z
    ox = (W / 2 - cx * z) % step; oy = (H / 2 - cy * z) % step
    dp = paint(NAVY, .055); r = 1.6 * max(.6, z)
    for i in range(int(W / step) + 2):
        for j in range(int(H / step) + 2):
            c.drawCircle(ox + i * step, oy + j * step, r, dp)


class Renderer:
    def __init__(self, build_dir):
        global GRAIN
        self.scenes, self.total = build(build_dir)
        self.keys = build_camera(self.scenes)
        GRAIN = make_grain()
        self.s = skia.Surface.MakeRaster(skia.ImageInfo.Make(W, H, skia.ColorType.kRGBA_8888_ColorType, skia.AlphaType.kPremul_AlphaType))
        self.quotes = [e for s in self.scenes for e in s.els if isinstance(e, Quote)]

    def active(self, t):
        return [s for s in self.scenes if s.start - 2.5 <= t <= s.end + 2.5]

    def frame(self, f):
        t = f / FPS
        c = self.s.getCanvas()
        cam = camera_at(self.keys, t); cam0 = camera_at(self.keys, t - 1 / FPS)
        bg(c, cam)
        act = self.active(t)
        c.save(); c.translate(W / 2, H / 2); c.scale(cam[2], cam[2]); c.translate(-cam[0], -cam[1])
        for s in act:
            c.save(); c.translate(*s.pos)
            for e in s.els:
                if not getattr(e, "screen", False): e.draw(c, t)
            c.restore()
        c.restore()
        vx = abs(cam[0] - cam0[0]) * cam[2]; vy = abs(cam[1] - cam0[1]) * cam[2]
        vz = abs(math.log(cam[2] / cam0[2])) * W * .5
        sc60 = 60 / FPS
        foc = max([q.focus(t) for q in self.quotes] + [0])
        sx = math.hypot((vx * .45 + vz * .3) / sc60, foc * 13); sy = math.hypot((vy * .45 + vz * .3) / sc60, foc * 13)
        if sx > .6 or sy > .6:
            snap = self.s.makeImageSnapshot()
            p = skia.Paint(); p.setImageFilter(skia.ImageFilters.Blur(min(sx, 60), min(sy, 60), skia.TileMode.kClamp))
            c.drawImage(snap, 0, 0, SAMP, p)
        if foc > 0: c.drawRect(skia.Rect.MakeWH(W, H), paint(BG, .55 * foc))
        for s in act:
            for e in s.els:
                if getattr(e, "screen", False): e.draw(c, t)
        d = dip(self.scenes, t)
        if d > 0: c.drawRect(skia.Rect.MakeWH(W, H), paint("#000000", d))
        if t > self.total - .5: c.drawRect(skia.Rect.MakeWH(W, H), paint("#000000", eio(prog(t, self.total - .5, self.total - .05))))
        if t < .35: c.drawRect(skia.Rect.MakeWH(W, H), paint("#000000", 1 - eio(prog(t, 0, .35))))
        c.drawImageRect(GRAIN[f % len(GRAIN)], skia.Rect.MakeWH(W, H), skia.SamplingOptions(), skia.Paint())
        return self.s

    def rgba(self, f):
        return self.frame(f).toarray()


# ================= ses =================
SR = 48000
def load_vo(path):
    raw = subprocess.check_output(["ffmpeg", "-v", "error", "-i", path, "-f", "f32le", "-ac", "1", "-ar", str(SR), "-"])
    return np.frombuffer(raw, np.float32).copy()

def build_audio(rd, path, music=True):
    global SFX
    SFX = []
    for s in rd.scenes:
        for e in s.els: e.sfx()
    dur = rd.total
    n = int(dur * SR) + SR
    voice = np.zeros(n, np.float32)
    for s in rd.scenes:
        if s.meta:
            v = load_vo(f"{A}/vo/{s.i:02d}.mp3"); i = int(s.vo_start * SR)
            j = min(n, i + len(v)); voice[i:j] += v[: j - i]
    pk = np.max(np.abs(voice)) or 1; voice = voice / pk * .89
    r = np.random.default_rng(5)
    L = np.zeros(n, np.float32); R = np.zeros(n, np.float32)
    def add(sig, t, g=1.0, pan=0.0):
        i = int(t * SR); j = min(n, i + len(sig))
        if j <= i or i < 0: return
        L[i:j] += sig[: j - i] * g * (1 - max(0, pan)); R[i:j] += sig[: j - i] * g * (1 + min(0, pan))
    # müzik: sakin, açık tonlu, 92 bpm, pad + pluck (Akış)
    bpm = 92; beat = 60 / bpm; bar = beat * 4
    chords = [(174.61, 220.0, 261.63, 329.63), (220.0, 261.63, 329.63, 392.0), (146.83, 174.61, 220.0, 261.63), (116.54, 146.83, 174.61, 220.0)]
    mus = np.zeros(n, np.float32)
    def put(t0, sig, g=1.0):
        i = int(t0 * SR); j = min(n, i + len(sig))
        if j > i >= 0: mus[i:j] += sig[: j - i] * g
    def pad(fr, d):
        m = int(d * SR); st = np.arange(m) / SR
        s = sum(np.sin(2 * np.pi * f * st + k) + .3 * np.sin(2 * np.pi * f * 2.003 * st) for k, f in enumerate(fr))
        return (s * np.minimum(1, st / .8) * np.minimum(1, (d - st) / .8) * .018).astype(np.float32)
    def pluck(f, d=.6):
        m = int(d * SR); st = np.arange(m) / SR
        return ((np.sin(2 * np.pi * f * st) + .35 * np.sin(4 * np.pi * f * st) * np.exp(-st * 8)) * np.exp(-st * 6) * .05).astype(np.float32)
    if music:
        for k in range(int(dur / bar) + 1):
            chd = chords[k % 4]; t0 = k * bar
            put(t0, pad(chd, bar + .9))
            seq = [chd[2] * 2, chd[3] * 2, chd[1] * 2, chd[3] * 2, chd[2] * 2, chd[1] * 4, chd[3] * 2, chd[2] * 2]
            for i, fq in enumerate(seq): put(t0 + i * beat / 2, pluck(fq), .9 if i % 2 == 0 else .6)
            m = int(bar * SR); st = np.arange(m) / SR
            put(t0, (np.sin(2 * np.pi * chd[0] / 2 * st) * np.minimum(1, st * 6) * np.exp(-st * .7) * .06).astype(np.float32))
        env = np.abs(voice); k = int(.3 * SR)
        env = np.convolve(env, np.ones(k, np.float32) / k, "same")
        duck = 1 - .6 * np.clip(env / .025, 0, 1)
        tt = np.arange(n) / SR
        mus *= .9 * duck * np.minimum(1, tt / 1.5) * np.clip((dur - tt) / 1.5, 0, 1)
        L += mus; R += mus
    # yalnızca kısa, yumuşak efektler
    def pop():
        m = int(.09 * SR); st = np.arange(m) / SR
        return (np.sin(2 * np.pi * (520 + 900 * st / .09) * st) * np.exp(-st * 45) * .3).astype(np.float32)
    def click():
        m = int(.05 * SR); st = np.arange(m) / SR
        return ((np.sin(2 * np.pi * 3200 * st) * .5 + r.normal(0, 1, m) * .4) * np.exp(-st * 160) * .35).astype(np.float32)
    def tick():
        m = int(.03 * SR); st = np.arange(m) / SR
        return (np.sin(2 * np.pi * 2400 * st) * np.exp(-st * 220) * .18).astype(np.float32)
    def ding(f=1318.5):
        m = int(.9 * SR); st = np.arange(m) / SR
        return ((np.sin(2 * np.pi * f * st) + .4 * np.sin(2 * np.pi * f * 2.01 * st)) * np.exp(-st * 5) * .12).astype(np.float32)
    def step():
        m = int(.5 * SR); st = np.arange(m) / SR
        return ((np.sin(2 * np.pi * 660 * st) + .5 * np.sin(2 * np.pi * 990 * st)) * np.exp(-st * 7) * .1).astype(np.float32)
    def bell():
        m = int(1.2 * SR); st = np.arange(m) / SR
        return sum(np.sin(2 * np.pi * f * st) * np.exp(-st * d) for f, d in ((1760, 3), (2637, 4), (3520, 6))).astype(np.float32) * .05
    gen = {"pop": pop, "click": click, "tick": tick, "ding": ding, "step": step, "bell": bell}
    for t0, kind, g in SFX:
        add(gen[kind](), t0, g, (r.random() - .5) * .3)
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
    rd = Renderer(A)
    enc = subprocess.Popen(["ffmpeg", "-y", "-v", "error", "-f", "rawvideo", "-pix_fmt", "rgba", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
                            "-c:v", "libx264", "-preset", "medium", "-crf", "17", "-pix_fmt", "yuv420p", "-g", str(FPS * 2), out],
                           stdin=subprocess.PIPE)
    for f in range(f0, f1):
        enc.stdin.write(rd.rgba(f).tobytes())
        if (f - f0) % 600 == 0: print(f"parca {k}: {f - f0}/{f1 - f0}", flush=True)
    enc.stdin.close(); enc.wait()
    open(out + ".done", "w").write("ok")
    return out


def srt(rd, path):
    def ts(x):
        h, rr = divmod(x, 3600); m, s = divmod(rr, 60)
        return f"{int(h):02d}:{int(m):02d}:{int(s):02d},{int(round((s % 1) * 1000)) % 1000:03d}"
    lines, n = [], 1
    for s in rd.scenes:
        if not s.meta: continue
        cur, c0 = [], None
        ws = s.words.w
        for j, (a, b, _, raw) in enumerate(ws):
            if c0 is None: c0 = a
            cur.append(raw)
            if len(" ".join(cur)) > 38 or raw.endswith((".", "?", "!", ":")) or j == len(ws) - 1 or b - c0 > 3.2:
                lines.append(f"{n}\n{ts(c0)} --> {ts(b + .1)}\n{' '.join(cur)}\n"); n += 1; cur, c0 = [], None
    open(path, "w", encoding="utf-8").write("\n".join(lines))


if __name__ == "__main__":
    if MODE == "stills":
        rd = Renderer(A)
        print(f"toplam {rd.total:.1f} sn")
        from PIL import Image
        for ts in sys.argv[3:]:
            t = float(ts)
            Image.fromarray(rd.rgba(int(round(t * FPS)))).convert("RGB").save(f"{OUT}/still_{t:06.2f}.jpg", quality=88)
            print("ok", t)
    elif MODE == "clip":
        # python3 akis.py BUILD clip 10 25  -> kısa önizleme (müzikli)
        t0, t1 = float(sys.argv[3]), float(sys.argv[4])
        rd = Renderer(A)
        wav = build_audio(rd, f"{OUT}/ses_onizleme.wav")
        out = f"{OUT}/onizleme_{t0:.0f}_{t1:.0f}.mp4"
        enc = subprocess.Popen(["ffmpeg", "-y", "-v", "error", "-f", "rawvideo", "-pix_fmt", "rgba", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
                                "-ss", str(t0), "-t", str(t1 - t0), "-i", wav, "-map", "0:v", "-map", "1:a", "-c:v", "libx264", "-preset", "fast",
                                "-crf", "20", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k", "-shortest", out], stdin=subprocess.PIPE)
        for f in range(int(t0 * FPS), int(t1 * FPS)):
            enc.stdin.write(rd.rgba(f).tobytes())
        enc.stdin.close(); enc.wait(); print(out)
    elif MODE == "render":
        from multiprocessing import Pool
        nproc = int(sys.argv[3]) if len(sys.argv) > 3 else os.cpu_count()
        rd = Renderer(A)
        NFR = int(rd.total * FPS)
        n = nproc * 4
        cuts = [round(i * NFR / n) for i in range(n + 1)]
        jobs = [(i, cuts[i], cuts[i + 1]) for i in range(n)]
        with Pool(nproc) as pool:
            parts = pool.map(render_chunk, jobs, chunksize=1)
        wav = build_audio(rd, f"{OUT}/ses_muzikli.wav")
        wav2 = build_audio(rd, f"{OUT}/ses_muziksiz.wav", music=False)
        srt(rd, f"{OUT}/altyazi.srt")
        lst = f"{OUT}/list.txt"
        open(lst, "w").write("".join(f"file '{p}'\n" for p in parts))
        final = f"{OUT}/Doksan_Dokuz_Arda_Ozil.mp4"
        for w_, o_ in ((wav, final), (wav2, final.replace(".mp4", "_muziksiz.mp4"))):
            subprocess.run(["ffmpeg", "-y", "-v", "error", "-f", "concat", "-safe", "0", "-i", lst, "-i", w_, "-map", "0:v", "-map", "1:a",
                            "-c:v", "copy", "-c:a", "aac", "-b:a", "256k", "-shortest", "-movflags", "+faststart", o_], check=True)
        print(final)
