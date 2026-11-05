#!/usr/bin/env python3
"""SESA KIDS yapım hikâyesi — Karga Zihni "Akış" stili (STIL-AKIS.md).

  python3 -I render_sesa.py stills 3.2 40 120 ...   # kontrol kareleri
  python3 -I render_sesa.py render 4                # tam video (müzikli + müziksiz)

Zamanlar tts/timeline.json'dan (cümle başlangıçları) gelir; her cümle bir görsel olay üretir.
"""
import json, math, os, subprocess, sys, wave
V = os.path.dirname(os.path.abspath(__file__))
VID = os.path.join(os.path.dirname(V), "vid")
os.environ.setdefault("AKIS_ASSETS", f"{VID}/assets")
os.environ.setdefault("AKIS_KANAL", f"{VID}/karga/karga-edit")
sys.path.insert(0, VID)
IMG = f"{V}/img"
import numpy as np
import skia
from akis_core import *          # palet, yardımcılar, appear/fx, ikonlar, grow/node/line, cursor, grain
import akis_core as K

MODE = sys.argv[1] if len(sys.argv) > 1 else "stills"
FPS = int(os.environ.get("FPS", "30"))
OUT = f"{V}/out"; os.makedirs(OUT, exist_ok=True)
TL = json.load(open(f"{V}/tts/timeline.json"))
ITEMS = TL["items"]
DUR = TL["total"]
NFR = int(DUR * FPS)
STORE = "/home/user/analiz/store"

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


# ---------- ek ikonlar (Lucide tarzı) ----------
K.ICONS.update({
    "bag": '<path d="M5 8h14l-1 13H6z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
    "mail": '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3.5 6.5L12 13l8.5-6.5"/>',
    "table": '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9.5h18M3 15h18M9 4v16"/>',
    "eye": '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    "gem": '<path d="M6 3h12l3 6-9 12L3 9z"/><path d="M3 9h18M9 3l3 18 3-18"/>',
    "cake": '<path d="M4 21V12h16v9"/><path d="M4 16c2 1.5 4 1.5 6 0s4-1.5 6 0 4 1.5 4 0"/><path d="M12 12V8"/><path d="M12 4.5c.8.8.8 2 0 2.8-.8-.8-.8-2 0-2.8z"/>',
    "sofa": '<path d="M4 11V8a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v3"/><path d="M2 12a2 2 0 0 1 4 0v3h12v-3a2 2 0 0 1 4 0v6H2z"/><path d="M5 18v2M19 18v2"/>',
    "shoe": '<path d="M3 16v-5l4-1 3 3 4 1 6 1v3H3z"/><path d="M3 19h18"/>',
    "search": '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
    "globe": '<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18"/>',
    "phone": '<rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M11 18.5h2"/>',
    "qr": '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3M21 14v7h-4M17 21v-2"/>',
    "x": '<path d="M6 6l12 12M18 6L6 18"/>',
    "heart": '<path d="M12 20s-7-4.4-9-9a5 5 0 0 1 9-3 5 5 0 0 1 9 3c-2 4.6-9 9-9 9z"/>',
    "book": '<path d="M4 4.5h6a2 2 0 0 1 2 2V20a2 2 0 0 0-2-2H4z"/><path d="M20 4.5h-6a2 2 0 0 0-2 2V20a2 2 0 0 1 2-2h6z"/>',
    "users": '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><circle cx="17.5" cy="9" r="2.5"/><path d="M16 14.5a5 5 0 0 1 6 5.5"/>',
    "clock": '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    "send": '<path d="M21 3L10 14"/><path d="M21 3l-7 18-4-7-7-4z"/>',
    "film": '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 4v16M17 4v16M3 9h4M3 15h4M17 9h4M17 15h4"/>',
    "bulb": '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2V16h5v-.1c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z"/>',
    "coffee": '<path d="M4 9h13v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z"/><path d="M17 10h1.5a2.5 2.5 0 0 1 0 5H17"/><path d="M8 3c-.8 1 .8 2 0 3M12 3c-.8 1 .8 2 0 3"/>',
    "ruler": '<path d="M3 17L17 3l4 4L7 21z"/><path d="M7 13l2 2M10 10l2 2M13 7l2 2"/>',
    "map": '<path d="M9 4L3 6.5v13L9 17l6 3 6-2.5v-13L15 7z"/><path d="M9 4v13M15 7v13"/>',
    "wand": '<path d="M4 20L16 8"/><path d="M14 4v3M19 9h-3M17.5 5.5l-2 2"/>',
    "repeat": '<path d="M17 2l3 3-3 3"/><path d="M4 11V9a4 4 0 0 1 4-4h12"/><path d="M7 22l-3-3 3-3"/><path d="M20 13v2a4 4 0 0 1-4 4H4"/>',
})

# ---------- görseller ----------
_IM = {}
def im(path, maxw=1600):
    if path not in _IM: _IM[path] = load_image(path, maxw)
    return _IM[path]
def draw_img(c, path, x, y, w, h, r=16, a=1.0, fit="cover", maxw=1600):
    """cover: kutuyu doldurur (taşanı kırpar); contain: tamamı görünür (ortalanır)."""
    image = im(path, maxw); iw, ih = image.width(), image.height()
    if fit == "contain":
        k = min(w / iw, h / ih); dw, dh = iw * k, ih * k
        dst = skia.Rect.MakeXYWH(x + (w - dw) / 2, y + (h - dh) / 2, dw, dh); src = skia.Rect.MakeWH(iw, ih)
        p = skia.Paint(AntiAlias=True); p.setAlphaf(a); c.drawImageRect(image, src, dst, SAMP, p); return
    k = max(w / iw, h / ih); sw, sh = w / k, h / k
    src = skia.Rect.MakeXYWH((iw - sw) / 2, (ih - sh) / 2, sw, sh)
    c.save(); c.clipRRect(skia.RRect.MakeRectXY(skia.Rect.MakeXYWH(x, y, w, h), r, r), True)
    p = skia.Paint(AntiAlias=True); p.setAlphaf(a); c.drawImageRect(image, src, skia.Rect.MakeXYWH(x, y, w, h), SAMP, p); c.restore()

def avatar_k(c, cx, cy, r, a=1.0):
    c.save(); pth = skia.Path(); pth.addCircle(cx, cy, r); c.clipPath(pth, doAntiAlias=True)
    p = skia.Paint(AntiAlias=True); p.setAlphaf(a)
    c.drawImageRect(im(f"{os.environ['AKIS_KANAL']}/kanal/profil_A_turuncu_800.png", 400), skia.Rect.MakeXYWH(cx - r, cy - r, 2 * r, 2 * r), SAMP, p); c.restore()

# ---------- ekran kayıtları ----------
class Clip:
    def __init__(self, path, fps=30, size=(1600, 720), loop=False, crop=None):
        self.path, self.fps, self.loop, self.crop = path, fps, loop, crop
        self.w, self.h = (crop[2], crop[3]) if crop else size
        self.p = None; self.idx = -1; self.img = None
        self.n = int(float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path]).strip()) * fps) - 1
    def _open(self, i):
        if self.p: self.p.kill()
        vf = ["-vf", f"crop={self.crop[2]}:{self.crop[3]}:{self.crop[0]}:{self.crop[1]}"] if self.crop else []
        self.p = subprocess.Popen(["ffmpeg", "-v", "error", "-ss", f"{i / self.fps:.4f}", "-i", self.path, *vf, "-f", "rawvideo", "-pix_fmt", "rgba", "-"], stdout=subprocess.PIPE)
        self.idx = i - 1
    def at(self, t):
        i = int(max(0, t) * self.fps)
        i = i % self.n if self.loop else min(i, self.n)
        if self.p is None or i < self.idx or i > self.idx + 60: self._open(i)
        while self.idx < i:
            b = self.p.stdout.read(self.w * self.h * 4)
            if len(b) < self.w * self.h * 4: break
            self.idx += 1
            if self.idx == i:
                self.img = skia.Image.fromarray(np.frombuffer(b, np.uint8).reshape(self.h, self.w, 4).copy(), colorType=skia.kRGBA_8888_ColorType).withDefaultMipmaps()
        return self.img
CLIPS = {}
COFFEE = "/root/.claude/uploads/15f5e81a-2f5a-535e-8b53-dec004b93200/11dcbf9c-_POV-__You_just_ordered_the_most_aesthetic_coffee_of_your_life__Swipe_to_see_the_smoothest_che.mp4"
def clip(name):
    if name not in CLIPS:
        if name == "coffee":
            CLIPS[name] = Clip(COFFEE, 30, loop=False, crop=(285, 290, 370, 790)); CLIPS[name].start = CLIPS[name].n / 30 - 3.0
        elif name == "tripo":
            CLIPS[name] = Clip("/root/.claude/uploads/15f5e81a-2f5a-535e-8b53-dec004b93200/341c71c4-tripo-showcase-979b8497-7290-4dc7-ae52-8250bd765abb.mp4", 30, loop=True, crop=(240, 60, 600, 960))
        else:
            CLIPS[name] = Clip(f"{V}/assets/clips/{name}.mp4", 30, loop=(name == "hero"))
    return CLIPS[name]

# ---------- zaman çizelgesi → bölgeler ----------
BEATS = [it for it in ITEMS if "i" in it]
CHAPS = [it for it in ITEMS if "ch" in it]
for k, b in enumerate(BEATS):
    b["end"] = BEATS[k + 1]["t"] - 0.05 if k + 1 < len(BEATS) else b["t"] + b["d"] + 0.4
    b["ch"] = sum(1 for c in CHAPS if c["t"] <= b["t"])
def keyof(b):
    v = b["vis"]
    if v[0] == "browser": return ("browser", v[1])
    if v[0] in ("full", "shot", "phone", "clip", "doc", "list"): return (v[0], v[1])
    if v[0] == "ab": return (v[0], v[1], v[2])
    return (v[0],)
REG = []
for b in BEATS:
    k = (b["ch"],) + keyof(b)
    if REG and REG[-1]["key"] == k: REG[-1]["beats"].append(b)
    else: REG.append({"key": k, "beats": [b], "type": b["vis"][0]})
cnt = {}; seen = {}
for r in REG:
    ch = r["key"][0]
    if r["key"] in seen and r["type"] in ("sell", "rules", "feet"):   # aynı görsele geri dönülür
        r["x"], r["y"] = seen[r["key"]]
    else:
        n = cnt.get(ch, 0); cnt[ch] = n + 1
        r["x"], r["y"] = n * 3000, ch * 4000; seen[r["key"]] = (r["x"], r["y"])
    r["t0"] = r["beats"][0]["t"]; r["t1"] = r["beats"][-1]["end"]
    for b in r["beats"]: b["reg"] = r
OUT0 = BEATS[-1]["t"] + BEATS[-1]["d"] + 0.5        # kapanış başlangıcı

def param_at(r, t, default=0):
    """Bölgenin o andaki parametresi (vis[1]) — en son başlamış cümleninki."""
    v = default
    for b in r["beats"]:
        if t >= b["t"] - .05 and len(b["vis"]) > 1: v = b["vis"][1]
    return v
def first_t(r, cond):
    for b in r["beats"]:
        if cond(b["vis"][1] if len(b["vis"]) > 1 else None): return b["t"]
    return None

# ---------- kamera ----------
TLX = 1300  # zaman tüneli kart aralığı
def cam_target(b):
    r = b["reg"]
    if r["type"] == "tl": return (r["x"] + b["vis"][1] * TLX, r["y"], 1.0)
    if r["type"] == "focus": return (r["x"], r["y"], 1.0)
    return (r["x"], r["y"], 1.0)
CAMK = []
prev = None
for b in BEATS:
    tgt = cam_target(b)
    if prev is None: CAMK.append((0, *tgt)); prev = (b, tgt); continue
    pb, pt = prev
    if tgt != pt:
        if pb["ch"] != b["ch"]:           # bölüm geçişi: önceki kadrajda bekle, kararmada atla
            ch_t = max(c_["t"] for c_ in CHAPS if c_["t"] <= b["t"])
            CAMK.append((ch_t + 0.40, *pt)); CAMK.append((ch_t + 0.45, *tgt))
        else:
            CAMK.append((b["t"] - 0.25, *pt)); CAMK.append((b["t"] + 0.55, *tgt))
    prev = (b, tgt)
# her bölgede çok yavaş yakınlaşma (sakin hareket)
def camera(t):
    if t <= CAMK[0][0]: k = CAMK[0]; base = (k[1], k[2], k[3])
    else:
        base = (CAMK[-1][1], CAMK[-1][2], CAMK[-1][3])
        for a, b in zip(CAMK, CAMK[1:]):
            if a[0] <= t <= b[0]:
                p = eio(prog(t, a[0], b[0]))
                if b[1:] != a[1:] and b[0] - a[0] < 0.4: p = 1.0 if t >= b[0] - 1e-6 else 0.0
                base = (lerp(a[1], b[1], p), lerp(a[2], b[2], p), math.exp(lerp(math.log(a[3]), math.log(b[3]), p))); break
    # sabit kısımlarda hafif nefes alan yakınlaşma
    return base[0], base[1], base[2] * (1 + 0.012 * math.sin(t * 0.35))

# ---------- başlıklar (kelime kelime, söylendiği anda) ----------
import re
def norm(w): return re.sub(r"[^\wçğıöşüâîû]", "", w.lower())
def caption_words(b):
    cap = b["cap"]; say = b["say"]
    toks = re.findall(r"\*[^*]+\*|[^\s*]+", cap)
    words = []
    for tok in toks:
        if tok.startswith("*"):
            for w in tok.strip("*").split(): words.append((w, "i"))
        else: words.append((tok, "b"))
    low = say.lower(); L = max(1, len(low)); out = []; last = 0.0
    for k, (w, kind) in enumerate(words):
        n = norm(w); pos = low.find(n[:5]) if len(n) >= 3 else -1
        frac = pos / L if pos >= 0 else None
        if frac is None or frac < last - 0.02: frac = min(0.85, last + 0.12) if k else 0.0
        last = frac
        if b["vis"][0] == "focus": frac *= .55
        out.append((w, kind, b["t"] + 0.05 + frac * b["d"] * 0.92))
    return out
for b in BEATS: b["words"] = caption_words(b)

def caption(c, t, b, cx, base, size, color=INK):
    line(c, t, b["words"], cx, base, size, t1=b["end"] - 0.05, color=color)

# ---------- sahne bileşenleri ----------
def label(c, s, x, y, size=26, color=INK, k="s", align="center", a=1.0): text(c, s, x, y, k, size, color, a, align)

def chip(c, x, y, s, ic=None, col=ORANGE, size=24, dark=False):
    w = tw(s, "s", size) + (88 if ic else 48); h = size * 2.4
    shadow(c, x - w / 2, y - h / 2, w, h, h / 2, .16, 18, 8)
    rrect(c, x - w / 2, y - h / 2, w, h, h / 2, NAVY if dark else CARD)
    tx = x - w / 2 + 24
    if ic:
        c.drawCircle(x - w / 2 + h / 2 + 4, y, h * .36, paint(col)); icon(c, ic, x - w / 2 + h / 2 + 4, y, h * .42); tx = x - w / 2 + h + 14
    text(c, s, tx, y + size * .36, "s", size, "#FFFFFF" if dark else INK)
    return w

def browser(c, t, x, y, w, src, t0, url="sesakids.com.tr", still=None, a_st=None):
    """Tarayıcı penceresi (dünya). src: klip adı ya da görsel yolu."""
    h = w * 776 / 1600; bar = 56 * w / 1600
    card(c, x - w / 2, y - h / 2, w, h, 22 * w / 1600, sh=.16)
    for i, col in enumerate(("#FF5F57", "#FEBC2E", "#28C840")):
        c.drawCircle(x - w / 2 + (32 + i * 24) * w / 1600, y - h / 2 + bar / 2, 7 * w / 1600, paint(col))
    uw = 560 * w / 1600; ux = x - uw / 2
    rrect(c, ux, y - h / 2 + 12 * w / 1600, uw, bar - 24 * w / 1600, (bar - 24 * w / 1600) / 2, SOFT)
    n = int(len(url) * prog(t, t0 + .2, t0 + .9))
    fs = 19 * w / 1600
    icon(c, "lock", ux + 24 * w / 1600, y - h / 2 + bar / 2, 16 * w / 1600, MUTED, sw=2.4)
    text(c, url[:n], ux + 42 * w / 1600, y - h / 2 + bar / 2 + 7 * w / 1600, "m", fs, INK)
    cx0, cy0, cw, chh = x - w / 2, y - h / 2 + bar, w, h - bar
    c.save(); c.clipRRect(skia.RRect.MakeRectXY(skia.Rect.MakeXYWH(x - w / 2, y - h / 2, w, h), 22 * w / 1600, 22 * w / 1600), True)
    if src.endswith((".png", ".jpg", ".webp")):
        draw_img(c, src, cx0, cy0, cw, chh, 0)
    else:
        image = clip(src).at(t - t0)
        if image is not None: draw_img_rr(c, image, cx0, cy0, cw, chh, 0)
    c.restore()
    return h

def bubble(c, x, y, w, s_lines, who="user", a_t=None, size=28):
    lh = size * 1.4; h = len(s_lines) * lh + 44
    col = NAVY if who == "user" else CARD
    card(c, x, y, w, h, 26, color=col, sh=.12)
    for k, s in enumerate(s_lines):
        text(c, s, x + 28, y + 30 + size * .95 + k * lh, "s" if who == "user" else "m", size, "#FFFFFF" if who == "user" else INK)
    return h

def node_simple(c, t, t0, x, y, r, ic, col, lab=None, t1=None, done=None):
    node(c, t, t0, x, y, r, ic, col, lab, lsize=26, t1=t1, done=done)

# ---------- bölge çizimleri ----------
SPIN = lambda name, i=0: f"{STORE}/assets/spin/{name}/{i:03d}.webp"
TLIMG = ["b5a6c14_a", "c846f51_a", "31f6f23_a", "b09f8f1_b", "cdf0404_a", "92550bf_b", "3dd6cdb_a"]
TLDATE = ["1. sürüm", "2. sürüm", "3. sürüm", "4. sürüm", "5. sürüm", "6. sürüm", "7. sürüm"]
MONT = ["b5a6c14", "c846f51", "31f6f23", "b09f8f1", "cdf0404", "92550bf", "3dd6cdb", "60fa5d8", "7d729f1", "f5d032a", "e71fcdb", "ecce180", "338293f", "2f80f95", "0dcfddd"]
CHATS = [
    ("user", ["Selam! Mağazam için bir site yapalım mı?"]),
    ("user", ["3D scroll ürün satış web sitesi istiyorum."]),
    ("ai", ["Harika! Önce birkaç soru: ne satacaksın,", "kimler için ve markanın havası nasıl olsun?"]),
    ("user", ["Ayaklar kaideye otursun.", "Gözle değil, ölçerek yap."]),
    ("user", ["Kahveyi seçince altta bir paket çıkıyor.", "Benzerini yapabilir miyiz?"]),
]

def draw_region(c, t, r):
    typ = r["type"]; x0, y0 = r["x"], r["y"]; t0, t1 = r["t0"], r["t1"]
    if t < t0 - .3 or t > t1 + .6: return
    st = appear(t, t0, .55, t1, .35, rise=26)
    cur = [b for b in r["beats"] if b["t"] - .05 <= t]
    b = cur[-1] if cur else r["beats"][0]
    fn = SCENES.get(typ)
    if fn and st: fn(c, t, r, x0, y0, st, b)
    for bb in r["beats"]:
        if typ in ("focus",): caption(c, t, bb, x0, y0 + 30, 108)
        elif typ in ("full", "clip"): caption(c, t, bb, x0, y0 + 430, 74, color="#FFFFFF")
        elif typ in ("ab",): caption(c, t, bb, x0, y0 - 425, 64)
        elif typ == "outro": pass
        else: caption(c, t, bb, x0, y0 - 380, 70)

def sc_open(c, t, r, x, y, st, b):
    with fx(c, st, x, y - 150, (x - 300, y - 300, x + 300, y + 40)):
        g = paint(ORANGE, .28); g.setMaskFilter(skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, 30)); c.drawCircle(x, y - 150, 80, g)
        avatar_k(c, x, y - 160, 80)
        text(c, "Karga Zihni", x, y - 30, "s", 32, INK, align="center")

def sc_browser(c, t, r, x, y, st, b):
    src = r["key"][2]
    with fx(c, st, x, y + 60, (x - 700, y - 300, x + 700, y + 420)):
        browser(c, t, x, y + 70, 1360, src, r["t0"])
    pills = {"hero": [("orbit", "360° döner"), ("star", "Stüdyo ışığı")], "bag": [("bag", "Kaydır, çantaya at")], "cel": [("heart", "Teşekkür ekranı")],
             "tale": [("book", "Masal + sesli dinle")], "chat": [("msg", "Ürünleri tanıyan asistan")]}.get(src, [])
    for k, (ic, s) in enumerate(pills):
        ps = appear(t, r["t0"] + 1.2 + k * .6, .45, r["t1"], .3, rise=18)
        if ps:
            with fx(c, ps, x - 520 + k * 330, y + 440, (x - 900, y + 380, x + 900, y + 500)):
                chip(c, x - 480 + k * 360, y + 440, s, ic)

def sc_focus(c, t, r, x, y, st, b): pass

def sc_stat3(c, t, r, x, y, st, b):
    items = [("0", "satır kod"), ("1", "gün"), ("1", "sohbet")]
    for k, (n, s) in enumerate(items):
        ps = appear(t, r["t0"] + .3 + k * .45, .5, r["t1"], .3)
        if not ps: continue
        cx = x - 460 + k * 460
        with fx(c, ps, cx, y + 80, (cx - 200, y - 120, cx + 200, y + 280)):
            card(c, cx - 190, y - 90, 380, 330, 30)
            text(c, n, cx, y + 110, "b", 170, ORANGE if k != 0 else NAVY, align="center")
            text(c, s, cx, y + 190, "s", 34, MUTED, align="center")

def sc_roadmap(c, t, r, x, y, st, b):
    step = param_at(r, t)
    items = [("cube", "Nasıl yaptım"), ("info", "Hatalar"), ("tag", "Nasıl satarsın")]
    xs = [x - 520, x, x + 520]
    for k, (ic, s) in enumerate(items):
        tk = r["t0"] + .2 + k * .35
        if k: grow(c, [(xs[k - 1] + 80, y + 60), (xs[k] - 80, y + 60)], eout(prog(t, tk - .3, tk)))
        node(c, t, tk, xs[k], y + 60, 72, ic, ORANGE if k <= step else NAVY, s, lsize=30)
    # ilerleme halkası
    hx = xs[step]; q = eio(prog(t, b["t"], b["t"] + .4))
    c.drawCircle(hx, y + 60, 92 + 6 * math.sin(t * 3), paint(ORANGE, .5 * q, 3))

def sc_idea(c, t, r, x, y, st, b):
    node(c, t, r["t0"] + .1, x - 260, y + 40, 90, "bulb", ORANGE, "Fikir", lsize=32)
    grow(c, [(x - 160, y + 40), (x + 160, y + 40)], eout(prog(t, r["t0"] + .6, r["t0"] + 1.1)))
    node(c, t, r["t0"] + 1.1, x + 260, y + 40, 90, "store", NAVY, "Pijama mağazası", lsize=32)

def sc_templates(c, t, r, x, y, st, b):
    foc = eio(prog(t, r["beats"][-1]["t"], r["beats"][-1]["t"] + .5)) if len(r["beats"]) > 1 else 0
    p = skia.Paint(); p.setAlphaf(1)
    if foc > .01: p.setImageFilter(skia.ImageFilters.Blur(8 * foc, 8 * foc))
    c.saveLayer(None, p)
    for j in range(2):
        for i in range(4):
            k = j * 4 + i; cx = x - 600 + i * 300 + 20; cy = y - 250 + j * 320
            ps = appear(t, r["t0"] + .2 + k * .06, .45)
            if not ps: continue
            with fx(c, ps, cx + 130, cy + 140, (cx, cy, cx + 260, cy + 290)):
                card(c, cx, cy, 260, 290, 16)
                rrect(c, cx + 14, cy + 14, 232, 140, 10, SOFT); icon(c, "bag", cx + 130, cy + 84, 56, "#C9C3B8", sw=1.6)
                rrect(c, cx + 18, cy + 174, 160, 16, 8, "#E4DFD6"); rrect(c, cx + 18, cy + 204, 100, 14, 7, SOFT); rrect(c, cx + 18, cy + 242, 84, 26, 13, "#E4DFD6")
    c.restore()
    if foc > 0:
        c.drawRect(skia.Rect.MakeXYWH(x - 1000, y - 600, 2000, 1200), paint(BG, .55 * foc))
        ps = appear(t, r["beats"][-1]["t"] + .2, .5)
        if ps:
            with fx(c, ps, x, y + 60, (x - 520, y - 200, x + 520, y + 300)):
                browser(c, t, x, y + 60, 900, "hero", r["beats"][-1]["t"])

def sc_chat(c, t, r, x, y, st, b):
    idxs = sorted({bb["vis"][1] for bb in r["beats"]})
    shown = [(i, first_t(r, lambda v, i=i: v == i)) for i in idxs]
    # pencere
    w, h = 1100, 640; wx, wy = x - w / 2, y - 280
    card(c, wx, wy, w, h, 30, sh=.14)
    c.drawCircle(wx + 50, wy + 46, 18, paint(ORANGE)); icon(c, "sparkle", wx + 50, wy + 46, 22)
    text(c, "Claude", wx + 82, wy + 55, "b", 26, INK); text(c, "ile sohbet", wx + 82 + tw("Claude", "b", 26) + 10, wy + 55, "m", 24, MUTED)
    c.drawLine(wx, wy + 92, wx + w, wy + 92, paint("#EFEBE4", 1, 2, cap=False))
    yy = wy + 124
    vis = [(i, ts) for i, ts in shown if ts is not None and t >= ts - .05]
    for i, ts in vis[-3:]:
        who, lines_ = CHATS[i]
        ps = appear(t, ts + .15, .45, rise=20)
        if not ps: continue
        size = 28
        bw = max(tw(s, "s", size) for s in lines_) + 60
        bx = wx + w - bw - 36 if who == "user" else wx + 36
        with fx(c, ps, bx + bw / 2, yy + 40, (bx, yy, bx + bw, yy + 160)):
            if who == "user" and i in (1, 3, 4):
                full = " / ".join(lines_); n = int(len(full) * prog(t, ts + .2, ts + .2 + len(full) * .035))
                typed = full[:n].split(" / ")
                hh = bubble(c, bx, yy, bw, typed + [""] * (len(lines_) - len(typed)), who, size=size)
            else:
                hh = bubble(c, bx, yy, bw, lines_, who, size=size)
        yy += hh + 22

def sc_brand(c, t, r, x, y, st, b):
    with fx(c, st, x, y, (x - 520, y - 260, x + 520, y + 330)):
        card(c, x - 500, y - 230, 1000, 520, 34)
        draw_img(c, f"{STORE}/assets/brand/logo-wordmark.png", x - 340, y - 190, 680, 170, 0, fit="contain")
    for k, (ic, s) in enumerate([("users", "2–12 yaş"), ("heart", "%100 pamuk"), ("star", "Premium vitrin")]):
        ps = appear(t, r["t0"] + .8 + k * .35, .45, r["t1"])
        if ps:
            with fx(c, ps, x - 330 + k * 330, y + 150, (x - 600, y + 90, x + 600, y + 210)):
                chip(c, x - 330 + k * 330, y + 150, s, ic, size=26)

def sc_loop(c, t, r, x, y, st, b):
    k = param_at(r, t)
    pts = [(x, y - 170), (x + 300, y + 230), (x - 300, y + 230)]
    labs = [("msg", "İste"), ("eye", "Gör"), ("pencil", "Düzelt")]
    tA = first_t(r, lambda v: v and v >= 3) or r["t0"] + 1
    for i in range(3):
        ti = (r["t0"] + .2) if i == 0 else tA + (i - 1) * .5
        a, bpt = pts[i], pts[(i + 1) % 3]
        if i < 2 or t > tA + 1.2:
            grow(c, [(a[0] + (bpt[0] - a[0]) * .22, a[1] + (bpt[1] - a[1]) * .22), (a[0] + (bpt[0] - a[0]) * .78, a[1] + (bpt[1] - a[1]) * .78)], eout(prog(t, ti + .3, ti + .8)))
        node(c, t, ti, a[0], a[1], 76, labs[i][0], ORANGE if i == 0 else NAVY, labs[i][1], lsize=30)
    if t > tA + 1.6:   # dönen nokta: döngü
        u = ((t - tA - 1.6) * .45) % 1; seg = int(u * 3); f = u * 3 - seg
        a, bpt = pts[seg], pts[(seg + 1) % 3]
        px, py = lerp(a[0], bpt[0], f), lerp(a[1], bpt[1], f)
        g = paint(ORANGE, .55); g.setMaskFilter(skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, 10)); c.drawCircle(px, py, 12, g)
        c.drawCircle(px, py, 5, paint("#FFFFFF"))

def sc_tl(c, t, r, x, y, st, b):
    n = len(TLIMG)
    xs = [x + i * TLX for i in range(n)]
    c.drawLine(xs[0] - 400, y + 360, xs[-1] + 400, y + 360, paint("#E2DDD3", 1, 4))
    for i in range(n):
        ti = first_t(r, lambda v, i=i: v == i)
        if ti is None: continue
        ps = appear(t, ti + .25, .55)
        if not ps: continue
        with fx(c, ps, xs[i], y, (xs[i] - 620, y - 330, xs[i] + 620, y + 420)):
            browser(c, t, xs[i], y, 1120, f"{V}/assets/tl/{TLIMG[i]}.png", ti, url="sesakids · sürüm " + str(i + 1))
            c.drawCircle(xs[i], y + 360, 14, paint(ORANGE)); c.drawCircle(xs[i], y + 360, 6, paint("#FFFFFF"))
            w = tw(TLDATE[i], "mono", 24) + 44
            rrect(c, xs[i] - w / 2, y + 384, w, 46, 23, NAVY)
            text(c, TLDATE[i], xs[i], y + 416, "mono", 24, "#FFFFFF", align="center")
        if i:
            grow(c, [(xs[i - 1] + 20, y + 360), (xs[i] - 20, y + 360)], eout(prog(t, ti - .2, ti + .5)), ORANGE, 4)

def sc_pipe(c, t, r, x, y, st, b):
    k = param_at(r, t)
    xs = [x - 600, x - 200, x + 200, x + 600]
    labs = [("Fotoğraf", None), ("Tripo", "cube"), ("3D dönüş", "orbit"), ("Sohbete at", "msg")]
    for i in range(4):
        ti = first_t(r, lambda v, i=i: v and v >= max(1, i)) if i else r["t0"]
        if ti is None or t < ti: continue
        if i: grow(c, [(xs[i - 1] + 120, y + 40), (xs[i] - 120, y + 40)], eout(prog(t, ti - .1, ti + .35)))
        ps = appear(t, ti + .15, .5)
        if not ps: continue
        with fx(c, ps, xs[i], y + 40, (xs[i] - 160, y - 180, xs[i] + 160, y + 300)):
            if i == 0:
                card(c, xs[i] - 110, y - 120, 220, 320, 22); draw_img(c, f"{V}/../mavi-kareli/on-gorunus.png", xs[i] - 100, y - 110, 200, 300, 16, fit="contain")
            elif i == 2:
                card(c, xs[i] - 120, y - 140, 240, 360, 22)
                image = clip("tripo").at(t - ti)
                if image is not None: draw_img_rr(c, image, xs[i] - 110, y - 130, 220, 340, 16)
            else:
                c.drawCircle(xs[i], y + 40, 92, paint(NAVY if i == 1 else ORANGE)); icon(c, labs[i][1], xs[i], y + 40, 84)
            text(c, labs[i][0], xs[i], y + 270, "s", 28, INK, align="center")

def sc_proc(c, t, r, x, y, st, b):
    k = param_at(r, t)
    # film şeridi: 8 kare
    for i in range(8):
        ps = appear(t, r["t0"] + .2 + i * .08, .45)
        if not ps: continue
        fxp = x - 700 + i * 175
        with fx(c, ps, fxp + 80, y - 40, (fxp, y - 200, fxp + 165, y + 120)):
            card(c, fxp, y - 200, 160, 300, 14)
            draw_img(c, SPIN("polis-arabalari", i * 15), fxp + 6, y - 194, 148, 288, 10, fit="contain", maxw=400)
            text(c, f"{i * 15:03d}", fxp + 80, y + 130, "mono", 18, MUTED, align="center")
    tk = first_t(r, lambda v: v and v >= 3)
    for j, s in enumerate(["Arka plan temizlendi", "Netleştirildi", "Renkler dengelendi"]):
        if tk is None: break
        tj = tk + .4 + j * .9
        ps = appear(t, tj, .45)
        if not ps: continue
        with fx(c, ps, x - 380 + j * 380, y + 260, (x - 900, y + 200, x + 900, y + 320)):
            chip(c, x - 380 + j * 380, y + 260, s, "check", size=24)

def sc_feet(c, t, r, x, y, st, b):
    k = param_at(r, t)
    img = SPIN("kalpli-kedi", 0)
    lift = 0 if k >= 2 else 46 * (1 if k == 0 else 1 - eio(prog(t, first_t(r, lambda v: v == 1) or 0, (first_t(r, lambda v: v == 1) or 0) + 1.6)))
    if k >= 2: lift = 0
    # kaide
    c.drawOval(skia.Rect.MakeXYWH(x - 210, y + 300, 420, 70), paint("#FFFFFF")); c.drawOval(skia.Rect.MakeXYWH(x - 210, y + 300, 420, 70), paint("#E2DDD3", 1, 3))
    c.drawOval(skia.Rect.MakeXYWH(x - 90, y + 318 - 4, 180, 28), paint(NAVY, .12 if lift > 10 else .28))
    draw_img(c, img, x - 150, y - 300 - lift, 300, 640, 0, fit="contain", maxw=600)
    if k == 0:
        q = .5 + .5 * math.sin(t * 5)
        c.drawLine(x + 190, y + 290 - lift + 40, x + 190, y + 330, paint(ORANGE, 1, 3))
        chip(c, x + 380, y + 300, "Havada!", "x", "#E5484D", 24)
    if k == 1:
        p = eio(prog(t, first_t(r, lambda v: v == 1), first_t(r, lambda v: v == 1) + .8))
        for e in (-1, 1):
            c.drawLine(x + e * 260, y + 335, x + e * 260 * (1 - .0), y + 335 - 300 * p, paint(LINE, 1, 3))
        chip(c, x + 400, y + 120, "Ölç: zemin hizası", "ruler", ORANGE, 24)
    if k >= 2:
        ps = appear(t, first_t(r, lambda v: v == 2) + .3, .45)
        if ps:
            with fx(c, ps, x + 380, y + 300, (x + 200, y + 250, x + 600, y + 350)):
                chip(c, x + 400, y + 300, "Tam basıyor", "check", "#2BB673", 24)

def sc_smooth(c, t, r, x, y, st, b):
    for row, (n, lab) in enumerate([(6, "60 kare"), (12, "120 kare")]):
        yy = y - 120 + row * 300
        text(c, lab, x - 820, yy + 20, "b", 34, ORANGE_T if row else INK)
        for i in range(n):
            ps = appear(t, r["t0"] + .2 + row * (r["beats"][-1]["t"] - r["t0"]) + i * .05, .4)
            if not ps: continue
            w = 1300 / n - 12; xx = x - 600 + i * (w + 12)
            with fx(c, ps, xx + w / 2, yy, (xx, yy - 110, xx + w, yy + 110)):
                card(c, xx, yy - 110, w, 220, 12)
                draw_img(c, SPIN("gezegenler", (i * (120 // n)) % 120), xx + 4, yy - 106, w - 8, 212, 8, fit="contain", maxw=300)

def sc_sales(c, t, r, x, y, st, b):
    node(c, t, r["t0"] + .1, x, y + 60, 100, "store", NAVY, "Satış", lsize=32)
    for k, (dx, dy, ic, s) in enumerate([(-520, -40, "bag", "Sepet"), (520, -40, "table", "Sipariş"), (0, 330, "users", "Müşteri")]):
        tk = r["t0"] + .6 + k * .35
        grow(c, [(x + dx * .25, y + 60 + dy * .25), (x + dx * .8, y + 60 + dy * .8)], eout(prog(t, tk - .3, tk)))
        node(c, t, tk, x + dx, y + 60 + dy if dy < 0 else y + 60 + dy - 60, 64, ic, ORANGE, s, lsize=26)

def sc_coffee(c, t, r, x, y, st, b):
    # telefon: ilk cümlede fincan, ikinci cümlede ilham videosunun son 3 saniyesi ekranda oynar
    tb = r["beats"][-1]["t"] if len(r["beats"]) > 1 else r["t0"] + 2
    with fx(c, st, x, y + 40, (x - 220, y - 330, x + 220, y + 460)):
        card(c, x - 200, y - 320, 400, 720, 54, color=NAVY)
        sx, sy, sw, shh = x - 180, y - 300, 360, 680
        rrect(c, sx, sy, sw, shh, 40, "#FFFFFF")
        if t < tb:
            c.drawCircle(x, y - 40, 110, paint(SOFT)); icon(c, "coffee", x, y - 40, 130, NAVY, sw=1.6)
        else:
            cl = clip("coffee"); image = cl.at(cl.start + min(3.0, t - tb))
            c.save(); c.clipRRect(skia.RRect.MakeRectXY(skia.Rect.MakeXYWH(sx, sy, sw, shh), 40, 40), True)
            if image is not None:
                iw, ih = image.width(), image.height(); k = max(sw / iw, shh / ih); dw, dh = iw * k, ih * k
                c.drawImageRect(image, skia.Rect.MakeXYWH(sx + (sw - dw) / 2, sy + (shh - dh) / 2, dw, dh), SAMP, skia.Paint(AntiAlias=True))
            c.restore()
            text(c, "İlham: sosyal medyada gördüğüm bir uygulama demosu", x, y + 440, "m", 20, MUTED, align="center")

def sc_bags(c, t, r, x, y, st, b):
    for k, (col, lab, prod) in enumerate([("#8fb2ea", "Erkek", "kirmizi-ekose"), ("#f0a7cb", "Kız", "krem-cilekler")]):
        ps = appear(t, r["t0"] + .2 + k * .4, .5, r["t1"])
        if not ps: continue
        cx = x - 300 + k * 600
        with fx(c, ps, cx, y + 60, (cx - 240, y - 260, cx + 240, y + 380)):
            # çanta çizimi
            pth = skia.Path(); pth.moveTo(cx - 170, y - 100); pth.lineTo(cx + 170, y - 100); pth.lineTo(cx + 150, y + 300); pth.lineTo(cx - 150, y + 300); pth.close()
            shadow(c, cx - 170, y - 100, 340, 400, 20, .18, 30, 18)
            c.drawPath(pth, paint(col))
            hp = skia.Path(); hp.moveTo(cx - 70, y - 100); hp.cubicTo(cx - 70, y - 230, cx + 70, y - 230, cx + 70, y - 100)
            c.drawPath(hp, paint("#C9A86A", 1, 9))
            draw_img(c, f"{STORE}/assets/brand/logo-wordmark.png", cx - 130, y + 40, 260, 70, 0, fit="contain")
            draw_img(c, SPIN(prod, 0), cx - 50, y - 210, 100, 200, 0, fit="contain", maxw=300)
            text(c, lab, cx, y + 360, "b", 32, INK, align="center")

def sc_form(c, t, r, x, y, st, b):
    with fx(c, st, x, y + 40, (x - 520, y - 320, x + 520, y + 430)):
        card(c, x - 480, y - 300, 960, 700, 30)
        text(c, "Siparişi tamamla", x - 420, y - 220, "b", 38, INK)
        for k, (lab, val) in enumerate([("Ad soyad", "Ayşe Yılmaz"), ("Telefon", "0532 123 45 67"), ("İl / ilçe", "İstanbul / Ümraniye"), ("Adres", "Çakmak Mah. Varan Cd. No 1")]):
            yy = y - 160 + k * 105
            text(c, lab, x - 420, yy, "s", 22, MUTED)
            rrect(c, x - 420, yy + 14, 840, 60, 16, SOFT)
            n = int(len(val) * prog(t, r["t0"] + .4 + k * .5, r["t0"] + .9 + k * .5))
            text(c, val[:n], x - 396, yy + 54, "m", 26, INK)
        q = prog(t, r["t1"] - .8, r["t1"] - .5)
        rrect(c, x - 420, y + 290, 840, 74, 37, NAVY if q < 1 else "#2BB673")
        text(c, "Siparişi Onayla" if q < 1 else "Sipariş alındı ✓", x, y + 338, "b", 28, "#FFFFFF", align="center")

def sc_flow(c, t, r, x, y, st, b):
    k = param_at(r, t)
    xs = [x - 560, x, x + 560]
    labs = [("store", "Site"), ("table", "Google Tablo"), ("mail", "E-posta")]
    for i in range(3):
        ti = r["t0"] + .1 if i < 2 else (first_t(r, lambda v: v and v >= 3) or r["t1"])
        if i == 1: ti = r["t0"] + .7
        if i: grow(c, [(xs[i - 1] + 100, y - 40), (xs[i] - 100, y - 40)], eout(prog(t, ti - .35, ti)))
        node(c, t, ti, xs[i], y - 40, 84, labs[i][0], NAVY if i == 1 else ORANGE, labs[i][1], lsize=28)
    # tablo satırı
    ps = appear(t, r["t0"] + 1.4, .5)
    if ps:
        with fx(c, ps, x, y + 230, (x - 560, y + 150, x + 560, y + 320)):
            card(c, x - 540, y + 160, 1080, 150, 20)
            cols = ["Tarih", "Sipariş no", "Ad soyad", "Ürün", "Toplam"]; vals = ["30.10 14:02", "SK-V25WUD", "Ayşe Y.", "Mavi Kareli · 5-6", "449 TL"]
            for j, (h_, v_) in enumerate(zip(cols, vals)):
                xx = x - 510 + j * 210
                text(c, h_, xx, y + 200, "s", 20, MUTED); text(c, v_, xx, y + 250, "b", 22, INK)
            hl = 1 - prog(t, r["t0"] + 1.6, r["t0"] + 3.0)
            if hl > 0: rrect(c, x - 540, y + 218, 1080, 50, 0, ORANGE, .12 * hl)

def sc_member(c, t, r, x, y, st, b):
    with fx(c, st, x, y + 40, (x - 520, y - 260, x + 520, y + 360)):
        card(c, x - 460, y - 230, 920, 560, 34, color=NAVY)
        text(c, "SESA KIDS Kulübü", x, y - 120, "b", 46, "#FFFFFF", align="center")
        q = eback(prog(t, r["t0"] + .9, r["t0"] + 1.35))
        c.save(); c.translate(x, y + 40); c.scale(q, q)
        rrect(c, -190, -80, 380, 160, 80, ORANGE); text(c, "−100 TL", 0, 26, "b", 74, "#FFFFFF", align="center"); c.restore()
        text(c, "800 TL ve üzeri her alışverişte, üyelere özel", x, y + 220, "m", 28, "#C9CCE0", align="center")

def sc_assist(c, t, r, x, y, st, b):
    w, h = 900, 660; wx, wy = x - w / 2, y - 290
    card(c, wx, wy, w, h, 30, sh=.14)
    c.drawCircle(wx + 50, wy + 46, 18, paint(ORANGE)); icon(c, "msg", wx + 50, wy + 46, 20)
    text(c, "SESA Asistan", wx + 82, wy + 55, "b", 26, INK)
    ps = appear(t, r["t0"] + .3, .45)
    if ps:
        with fx(c, ps, wx + w - 300, wy + 150, (wx, wy + 100, wx + w, wy + 200)):
            bubble(c, wx + w - 470, wy + 110, 430, ["5 yaşında kızım için öner"], "user", size=26)
    ps = appear(t, r["t0"] + 1.3, .5)
    if ps:
        with fx(c, ps, x, wy + 330, (wx, wy + 220, wx + w, wy + 470)):
            for k, prod in enumerate(["krem-cilekler", "kalpli-kedi", "safari-dostlari"]):
                cx = wx + 40 + k * 280
                card(c, cx, wy + 230, 260, 230, 18)
                draw_img(c, SPIN(prod, 0), cx + 10, wy + 238, 240, 160, 12, fit="contain", maxw=300)
                text(c, "449 TL", cx + 130, wy + 435, "b", 24, INK, align="center")
    tb = r["beats"][-1]["t"]
    ps = appear(t, tb + .2, .45)
    if ps:
        with fx(c, ps, x, wy + 560, (wx, wy + 500, wx + w, wy + 620)):
            pressed = t > tb + 1.2
            rrect(c, x - 200, wy + 520, 400, 74, 37, "#2BB673" if pressed else NAVY)
            text(c, "Sepete eklendi ✓" if pressed else "Sepete ekle", x, wy + 568, "b", 26, "#FFFFFF", align="center")
        cursor(c, t, [(tb + .3, x + 400, wy + 700), (tb + 1.0, x + 40, wy + 560), (tb + 1.8, x + 60, wy + 580)], clicks=[tb + 1.12], t_out=tb + 2.2)

def sc_seo(c, t, r, x, y, st, b):
    k = param_at(r, t)
    # arama çubuğu
    with fx(c, st, x, y - 210, (x - 520, y - 270, x + 520, y - 150)):
        shadow(c, x - 500, y - 260, 1000, 96, 48, .14, 20, 8); rrect(c, x - 500, y - 260, 1000, 96, 48, CARD)
        icon(c, "search", x - 450, y - 212, 34, MUTED, sw=2.4)
        q = "çocuk pijama takımı"; n = int(len(q) * prog(t, r["t0"] + .3, r["t0"] + 1.4))
        text(c, q[:n], x - 410, y - 200, "m", 32, INK)
    for i, (ic, s) in enumerate([("book", "Ürün sayfaları"), ("map", "Site haritası"), ("info", "Sık sorulanlar"), ("sparkle", "Yapay zekâ aramaları")]):
        ti = first_t(r, lambda v, i=i: v is not None and v >= (1 if i == 0 else (3 if i >= 1 else 0)))
        if ti is None: continue
        ti += i * .35
        xx = x - 600 + i * 400
        grow(c, [(x, y - 150), (x, y - 60), (xx, y - 60), (xx, y + 20)], eout(prog(t, ti - .3, ti)), tip=False)
        node(c, t, ti, xx, y + 90, 64, ic, ORANGE, s, lsize=26)

def sc_map(c, t, r, x, y, st, b):
    with fx(c, st, x, y + 40, (x - 520, y - 300, x + 520, y + 380)):
        card(c, x - 500, y - 270, 1000, 600, 30)
        rrect(c, x - 470, y - 240, 940, 420, 20, "#E8EEF2")
        for i in range(6): c.drawLine(x - 470, y - 240 + i * 84, x + 470, y - 190 + i * 70, paint("#FFFFFF", 1, 10))
        for i in range(5): c.drawLine(x - 400 + i * 200, y - 240, x - 350 + i * 190, y + 180, paint("#FFFFFF", 1, 8))
        q = eback(prog(t, r["t0"] + .5, r["t0"] + .9))
        c.drawCircle(x, y - 40, 30 * q, paint(ORANGE)); c.drawCircle(x, y - 40, 11 * q, paint("#FFFFFF"))
        text(c, "Sesa Kids · Ümraniye, İstanbul", x, y + 250, "b", 30, INK, align="center")

def sc_idea2(c, t, r, x, y, st, b):
    node(c, t, r["t0"] + .1, x - 240, y + 40, 96, "bulb", ORANGE, "Fikir", lsize=30)
    tb = r["beats"][-1]["t"]
    grow(c, [(x - 130, y + 40), (x + 130, y + 40)], eout(prog(t, tb - .1, tb + .4)))
    node(c, t, tb + .35, x + 240, y + 40, 96, "book", NAVY, "Hikâye", lsize=30)

def sc_parents(c, t, r, x, y, st, b):
    node(c, t, r["t0"] + .1, x - 360, y + 40, 90, "users", NAVY, "Anne baba", lsize=30)
    node(c, t, r["t0"] + .5, x + 360, y + 40, 90, "heart", ORANGE, "Çocuk", lsize=30)
    tb = r["beats"][-1]["t"]
    grow(c, [(x - 250, y + 40), (x + 250, y + 40)], eout(prog(t, tb + .2, tb + .9)), ORANGE, 5)
    ps = appear(t, tb + .8, .5)
    if ps:
        with fx(c, ps, x, y - 50, (x - 200, y - 110, x + 200, y + 10)):
            chip(c, x, y - 50, "Her akşam bir an", "clock", size=26)

HEROES = [("kalpli-kedi", "Pamuk"), ("renkli-kediler", "Tarçın"), ("dama-is-makineleri", "Kepçe Kemal"), ("ayicikli-beyaz-ekose", "Ayı Bulut"),
          ("renkli-cilekler", "Tomurcuk"), ("polis-arabalari", "Komiser Bıdık"), ("ayicikli-bej-ekose", "Fındık"), ("safari-dostlari", "Zürafa Zeren"),
          ("gezegenler", "Kaşif Kuzey"), ("kirmizi-ekose", "Kaptan Kerem"), ("mavi-cizgili", "Kaptan Deniz"), ("krem-cilekler", "Tavşan Lale")]
def sc_heroes(c, t, r, x, y, st, b):
    hl = len(r["beats"]) > 1 and t >= r["beats"][1]["t"]
    for k, (sp, name) in enumerate(HEROES):
        ps = appear(t, r["t0"] + .2 + k * .07, .45)
        if not ps: continue
        cx = x - 842 + (k % 6) * 285; cy = y - 170 + (k // 6) * 360
        on = (not hl) or name in ("Komiser Bıdık", "Kaşif Kuzey")
        with fx(c, ps, cx + 130, cy + 150, (cx, cy, cx + 260, cy + 330)):
            card(c, cx, cy, 260, 320, 20, a=1)
            draw_img(c, SPIN(sp, 0), cx + 10, cy + 10, 240, 240, 14, fit="contain", maxw=300, a=1 if on else .35)
            text(c, name, cx + 130, cy + 292, "b", 24, INK if on else MUTED, align="center")
            if hl and on: c.drawRRect(skia.RRect.MakeRectXY(skia.Rect.MakeXYWH(cx - 4, cy - 4, 268, 328), 22, 22), paint(ORANGE, 1, 4))

def sc_ask(c, t, r, x, y, st, b):
    with fx(c, st, x, y + 40, (x - 620, y - 220, x + 620, y + 300)):
        card(c, x - 600, y - 200, 1200, 460, 34, color=NAVY)
        text(c, "UYUMADAN ÖNCE SOR", x, y - 90, "b", 26, ORANGE, align="center", track=3)
        s = "Bugün kime yardım ettin, minik komiser?"; n = int(len(s) * prog(t, r["t0"] + .6, r["t0"] + 2.2))
        text(c, s[:n], x, y + 40, "i", 64, "#FFFFFF", align="center")
        text(c, "— Komiser Bıdık’ın Son Devriyesi", x, y + 150, "m", 26, "#C9CCE0", align="center")

def sc_cards(c, t, r, x, y, st, b):
    with fx(c, st, x - 250, y + 40, (x - 560, y - 330, x + 60, y + 430)):
        shadow(c, x - 520, y - 320, 520, 740, 20, .2, 30, 16)
        draw_img(c, f"{V}/assets/img/qrcard.png", x - 520, y - 320, 520, 740, 16, fit="cover")
    tb = r["beats"][-1]["t"]
    ps = appear(t, tb + .1, .5)
    if ps:
        with fx(c, ps, x + 360, y + 40, (x + 160, y - 300, x + 560, y + 400)):
            card(c, x + 200, y - 280, 320, 620, 46, color=NAVY)
            rrect(c, x + 218, y - 262, 284, 584, 34, "#1F2440")
            icon(c, "qr", x + 360, y - 60, 120, "#FFFFFF", sw=1.6)
            sc = (t * 1.2) % 1
            c.drawLine(x + 280, y - 130 + 150 * sc, x + 440, y - 130 + 150 * sc, paint(ORANGE, 1, 4))
            q = prog(t, tb + 1.2, tb + 1.5)
            if q > 0:
                rrect(c, x + 240, y + 140, 240, 70, 35, ORANGE, q); text(c, "Masalı dinle ▶", x + 360, y + 185, "b", 22, "#FFFFFF", q, align="center")

FAILS = [("fail_mobile.png", "Telefonda çanta yok"), ("fail_four.png", "Dört çocuklu model"), ("fail_head.png", "Kafa değişimi"), ("real_head.png", "Gerçek modele dönüş")]
def sc_fails(c, t, r, x, y, st, b):
    k = param_at(r, t)
    for i, (img, lab) in enumerate(FAILS):
        ti = first_t(r, lambda v, i=i: v is not None and v >= i + 1)
        if ti is None and i > 0: continue
        if i == 0: ti = first_t(r, lambda v: v is not None and v >= 1)
        if ti is None: continue
        ps = appear(t, ti + .2, .5)
        if not ps: continue
        cx = x - 690 + i * 460
        with fx(c, ps, cx, y + 40, (cx - 210, y - 300, cx + 210, y + 400)):
            card(c, cx - 200, y - 280, 400, 560, 26)
            draw_img(c, f"{V}/assets/img/{img}", cx - 185, y - 265, 370, 470, 18, fit="contain" if i != 1 else "cover", maxw=900)
            text(c, lab, cx, y + 250, "b", 26, INK, align="center")
            good = i == 3
            fixed_t = None
            if i == 0: fixed_t = first_t(r, lambda v: v is not None and v >= 1)
            bq = eback(prog(t, ti + .5, ti + .85))
            col = "#2BB673" if good else "#E5484D"
            c.drawCircle(cx + 170, y - 250, 34 * bq, paint(col)); icon(c, "check" if good else "x", cx + 170, y - 250, 40 * bq, "#FFFFFF", sw=3)

def sc_lesson(c, t, r, x, y, st, b):
    for k, (ic, s) in enumerate([("msg", "Net söyle"), ("eye", "Ekran görüntüsü at"), ("check", "Kontrol et")]):
        tk = r["t0"] + .2 + k * .6
        if k: grow(c, [(x - 520 + (k - 1) * 520 + 90, y + 60), (x - 520 + k * 520 - 90, y + 60)], eout(prog(t, tk - .3, tk)))
        node(c, t, tk, x - 520 + k * 520, y + 60, 78, ic, ORANGE if k != 1 else NAVY, s, lsize=30)

STEPS = [("store", "İşletme seç"), ("cube", "Demo hazırla"), ("mail", "E-posta at"), ("tag", "Fiyat belirle"), ("repeat", "Takip et")]
def sc_sell(c, t, r, x, y, st, b):
    k = param_at(r, t)
    for i, (ic, s) in enumerate(STEPS):
        ps = appear(t, r["t0"] + .1 + i * .08, .45)
        if not ps: continue
        yy = y - 240 + i * 135
        with fx(c, ps, x, yy, (x - 520, yy - 60, x + 520, yy + 60)):
            on = i == k
            shadow(c, x - 460, yy - 52, 920, 104, 52, .14 if on else .06, 18, 8)
            rrect(c, x - 460, yy - 52, 920, 104, 52, NAVY if on else CARD)
            c.drawCircle(x - 404, yy, 36, paint(ORANGE if on or i < k else "#E2DDD3"))
            icon(c, "check" if i < k else ic, x - 404, yy, 36, "#FFFFFF")
            text(c, f"{i + 1}.  {s}", x - 340, yy + 12, "b", 34, "#FFFFFF" if on else (INK if i < k else MUTED))

def sc_targets(c, t, r, x, y, st, b):
    items = [("store", "Butik"), ("shoe", "Ayakkabıcı"), ("gem", "Kuyumcu"), ("sofa", "Mobilyacı"), ("car", "Oto galeri"), ("cake", "Pastane")]
    tb = r["beats"][1]["t"] if len(r["beats"]) > 1 else r["t0"]
    for k, (ic, s) in enumerate(items):
        node(c, t, tb + k * .25, x - 750 + k * 300, y + 20, 70, ic, NAVY if k % 2 else ORANGE, s, lsize=26)
    if len(r["beats"]) > 2:
        t3 = r["beats"][2]["t"]
        for k, (ic, s) in enumerate([("map", "Google Haritalar"), ("sparkle", "Instagram"), ("pin", "Mahallen")]):
            ps = appear(t, t3 + .3 + k * .4, .45)
            if ps:
                with fx(c, ps, x - 400 + k * 400, y + 300, (x - 800, y + 240, x + 800, y + 360)):
                    chip(c, x - 400 + k * 400, y + 300, s, ic, size=26)

def sc_demo(c, t, r, x, y, st, b):
    with fx(c, st, x - 440, y + 40, (x - 860, y - 240, x - 20, y + 330)):
        browser(c, t, x - 440, y + 20, 780, "hero", r["t0"], url="sesakids.com.tr")
        text(c, "Bu site", x - 440, y + 300, "b", 30, INK, align="center")
    grow(c, [(x - 30, y + 20), (x + 30, y + 20)], eout(prog(t, r["t0"] + .6, r["t0"] + 1.0)), ORANGE, 5)
    ps = appear(t, r["t0"] + 1.0, .5)
    if ps:
        with fx(c, ps, x + 440, y + 40, (x + 20, y - 240, x + 860, y + 330)):
            h = 780 * 776 / 1600
            card(c, x + 50, y + 20 - h / 2, 780, h, 18, sh=.16)
            rrect(c, x + 70, y + 20 - h / 2 + 40, 740, h - 60, 12, "#EFE6DA")
            text(c, "SENİN MÜŞTERİN", x + 440, y - 60, "b", 34, NAVY, align="center", track=2)
            text(c, "logo · renkler · ürünler", x + 440, y - 10, "m", 26, MUTED, align="center")
            icon(c, "wand", x + 440, y + 90, 80, ORANGE, sw=1.8)
            text(c, "Müşterinin demosu", x + 440, y + 300, "b", 30, INK, align="center")

MAIL = ["Merhaba, mağazanızın ürünlerini çok beğendim", "ve sizin için 3D bir vitrin denemesi hazırladım.", "",
        "Linkten bakabilirsiniz; beğenirseniz 10 dakikalık", "bir görüşmede detayları konuşalım. İyi çalışmalar!"]
def sc_mail(c, t, r, x, y, st, b):
    k = param_at(r, t)
    w, h = 1150, 690; wx, wy = x - w / 2, y - 300
    card(c, wx, wy, w, h, 26, sh=.14)
    rrect(c, wx, wy, w, 70, 26, NAVY); rrect(c, wx, wy + 40, w, 30, 0, NAVY)
    text(c, "Yeni ileti", wx + 32, wy + 46, "b", 26, "#FFFFFF")
    text(c, "Kime:", wx + 32, wy + 116, "s", 24, MUTED); text(c, "hello@markaniz.com", wx + 120, wy + 116, "m", 24, INK)
    text(c, "Konu:", wx + 32, wy + 164, "s", 24, MUTED)
    subj = "Yeni kutularınız için lansman sitesi"
    n = int(len(subj) * prog(t, r["t0"] + .3, r["t0"] + 1.4)); text(c, subj[:n], wx + 120, wy + 164, "b", 24, INK)
    c.drawLine(wx + 24, wy + 190, wx + w - 24, wy + 190, paint("#EFEBE4", 1, 2, cap=False))
    t2 = first_t(r, lambda v: v is not None and v >= 2); t3 = first_t(r, lambda v: v is not None and v >= 3)
    for li, s in enumerate(MAIL):
        ts = t2 if li < 3 else t3
        if ts is None: continue
        q = prog(t, ts + .2 + (li % 3) * .9, ts + .2 + (li % 3) * .9 + len(s) * .028)
        text(c, s[:int(len(s) * q)], wx + 40, wy + 250 + li * 50, "m", 28, INK)
    t4 = first_t(r, lambda v: v is not None and v >= 4)
    if t4 is not None:
        for j, (ic, s) in enumerate([("link", "demo bağlantısı"), ("film", "ekran-videosu.mp4")]):
            ps = appear(t, t4 + .3 + j * .4, .45)
            if ps:
                with fx(c, ps, wx + 200 + j * 330, wy + 560, (wx, wy + 520, wx + w, wy + 600)):
                    chip(c, wx + 200 + j * 330, wy + 560, s, ic, size=22)
        q = prog(t, t4 + 2.0, t4 + 2.3)
        rrect(c, wx + w - 220, wy + 530, 180, 64, 32, ORANGE if q < 1 else "#2BB673")
        icon(c, "send" if q < 1 else "check", wx + w - 175, wy + 562, 26)
        text(c, "Gönder" if q < 1 else "Gitti", wx + w - 150, wy + 571, "b", 24, "#FFFFFF")
        cursor(c, t, [(t4 + 1.1, wx + w + 120, wy + 760), (t4 + 1.9, wx + w - 120, wy + 565), (t4 + 2.6, wx + w - 100, wy + 590)], clicks=[t4 + 2.0], t_out=t4 + 3.0)

RULES = [(False, "Toplu reklam maili (spam)"), (True, "Her markaya kişisel mail"), (True, "Herkese açık iletişim adresi"), (True, "\"Konsept demo\" notu"), (True, "KVKK ve ticari ileti kurallarına uy"), (None, "Kazanç garantisi yok")]
def sc_rules(c, t, r, x, y, st, b):
    k = param_at(r, t)
    with fx(c, st, x, y + 40, (x - 560, y - 300, x + 560, y + 420)):
        card(c, x - 540, y - 280, 1080, 680, 30)
    for i, (ok, s) in enumerate(RULES):
        ti = first_t(r, lambda v, i=i: v is not None and v >= i + 1)
        if ti is None: continue
        ps = appear(t, ti + .2, .45)
        if not ps: continue
        yy = y - 205 + i * 104
        with fx(c, ps, x, yy, (x - 520, yy - 50, x + 520, yy + 50)):
            col = "#2BB673" if ok else ("#E5484D" if ok is False else ORANGE)
            c.drawCircle(x - 440, yy, 30, paint(col)); icon(c, "check" if ok else ("x" if ok is False else "info"), x - 440, yy, 34, "#FFFFFF", sw=3)
            text(c, s, x - 390, yy + 12, "b", 34, INK)
            if ok is False:
                p = eout(prog(t, ti + .6, ti + 1.0)); c.drawLine(x - 390, yy, x - 390 + tw(s, "b", 34) * p, yy, paint("#E5484D", 1, 4))

def sc_price(c, t, r, x, y, st, b):
    for k, (ic, s, sub) in enumerate([("wand", "Kurulum", "tek seferlik ücret"), ("repeat", "Bakım", "küçük aylık ücret")]):
        ps = appear(t, r["t0"] + .2 + k * .5, .5, r["t1"])
        if not ps: continue
        cx = x - 300 + k * 600
        with fx(c, ps, cx, y + 40, (cx - 260, y - 220, cx + 260, y + 300)):
            card(c, cx - 240, y - 200, 480, 420, 30)
            c.drawCircle(cx, y - 80, 66, paint(ORANGE if k == 0 else NAVY)); icon(c, ic, cx, y - 80, 64)
            text(c, s, cx, y + 60, "b", 44, INK, align="center"); text(c, sub, cx, y + 120, "m", 28, MUTED, align="center")
    tb = r["beats"][-1]["t"]
    ps = appear(t, tb + .3, .45)
    if ps and len(r["beats"]) > 1:
        with fx(c, ps, x, y + 330, (x - 500, y + 270, x + 500, y + 390)):
            chip(c, x, y + 330, "İlk müşterin = senin vitrinin", "star", size=28, dark=True)

def sc_follow(c, t, r, x, y, st, b):
    items = [("mail", "1. gün", "Kişisel mail"), ("clock", "7. gün", "Kibar hatırlatma"), ("check", "Evet!", "İlk müşteri"), ("star", "Sonra", "Referans")]
    for i, (ic, d, s) in enumerate(items):
        ti = r["t0"] + .2 + i * .5 if i < 2 else (r["beats"][-1]["t"] + (i - 2) * .6 if len(r["beats"]) > 2 else r["t0"] + 2 + i * .4)
        xx = x - 690 + i * 460
        if i: grow(c, [(xx - 460 + 80, y + 40), (xx - 80, y + 40)], eout(prog(t, ti - .3, ti)))
        node(c, t, ti, xx, y + 40, 72, ic, "#2BB673" if i == 2 else (ORANGE if i % 2 == 0 else NAVY), s, lsize=28)
        ps = appear(t, ti + .1, .4)
        if ps:
            with fx(c, ps, xx, y - 90, (xx - 100, y - 130, xx + 100, y - 60)):
                text(c, d, xx, y - 80, "mono", 24, ORANGE_T, align="center")
    if len(r["beats"]) > 1:
        t2 = r["beats"][1]["t"]; ps = appear(t, t2 + .3, .45, r["beats"][2]["t"] if len(r["beats"]) > 2 else None)
        if ps:
            with fx(c, ps, x, y + 300, (x - 400, y + 240, x + 400, y + 360)):
                chip(c, x, y + 300, "Hayır diyene ısrar yok", "x", "#E5484D", 26)

def sc_stats(c, t, r, x, y, st, b):
    items = [("13", "pijama, hepsi 3D"), ("1", "gün"), ("54", "kayıt"), ("0", "satır kod")]
    for k, (n, s) in enumerate(items):
        ps = appear(t, r["t0"] + .2 + k * .35, .5, r["t1"])
        if not ps: continue
        cx = x - 690 + k * 460
        with fx(c, ps, cx, y + 60, (cx - 210, y - 160, cx + 210, y + 280)):
            card(c, cx - 200, y - 140, 400, 400, 30)
            text(c, n, cx, y + 90, "b", 160, ORANGE if k % 2 == 0 else NAVY, align="center")
            text(c, s, cx, y + 180, "s", 30, MUTED, align="center")

def sc_done(c, t, r, x, y, st, b):
    feats = [("orbit", "3D vitrin"), ("bag", "Çanta animasyonu"), ("table", "Sipariş sistemi"), ("users", "Üyelik ve indirim"), ("msg", "Asistan"), ("book", "Masallar"), ("qr", "Karekodlu kartlar"), ("search", "Google'a hazır")]
    for k, (ic, s) in enumerate(feats):
        ps = appear(t, r["t0"] + .2 + k * .32, .45)
        if not ps: continue
        cx = x - 450 + (k % 2) * 900; cy = y - 220 + (k // 2) * 140
        with fx(c, ps, cx, cy, (cx - 420, cy - 55, cx + 420, cy + 55)):
            shadow(c, cx - 400, cy - 50, 800, 100, 50, .1, 16, 6); rrect(c, cx - 400, cy - 50, 800, 100, 50, CARD)
            c.drawCircle(cx - 345, cy, 34, paint(ORANGE)); icon(c, ic, cx - 345, cy, 36)
            text(c, s, cx - 290, cy + 12, "b", 32, INK)
            bq = eback(prog(t, r["t0"] + .5 + k * .32, r["t0"] + .85 + k * .32))
            c.drawCircle(cx + 345, cy, 26 * bq, paint("#2BB673")); icon(c, "check", cx + 345, cy, 30 * bq, "#FFFFFF", sw=3)

def sc_montage(c, t, r, x, y, st, b):
    tb = r["beats"][-1]["t"] if len(r["beats"]) > 1 else r["t0"]
    seq = [f"{h}_a" for h in MONT] + [f"{h}_b" for h in MONT[7:]]
    i = int(max(0, t - tb) / .32) % len(seq) if t >= tb else 0
    with fx(c, st, x, y + 40, (x - 720, y - 300, x + 720, y + 420)):
        browser(c, t, x, y + 40, 1300, f"{V}/assets/tl/{seq[i]}.png", r["t0"], url="sesakids · 54 kayıt")
    if t < tb:
        p = prog(t, r["t0"] + .3, tb)
        n = int(54 * eout(p))
        text(c, f"{n}", x, y + 470, "b", 64, ORANGE, align="center")
    else:
        w = 700; q = (t - tb) / (r["t1"] - tb + .001)
        rrect(c, x - w / 2, y + 430, w, 12, 6, "#E2DDD3"); rrect(c, x - w / 2, y + 430, w * clamp(q), 12, 6, ORANGE)

def sc_comment(c, t, r, x, y, st, b):
    with fx(c, st, x, y + 40, (x - 620, y - 220, x + 620, y + 300)):
        card(c, x - 600, y - 200, 1200, 420, 30)
        avatar_k(c, x - 510, y - 110, 44)
        text(c, "@izleyici", x - 450, y - 118, "b", 28, INK); text(c, "· şimdi", x - 450 + tw("@izleyici", "b", 28) + 12, y - 118, "m", 24, MUTED)
        s1 = "Ben olsam her ürüne video yorum eklerdim!"; n = int(len(s1) * prog(t, r["t0"] + .6, r["t0"] + 2.4))
        text(c, s1[:n], x - 450, y - 60, "m", 34, INK)
        icon(c, "thumb", x - 430, y + 60, 40, NAVY, sw=2.2); text(c, "128", x - 395, y + 72, "s", 26, MUTED)
        rrect(c, x - 290, y + 30, 160, 60, 30, SOFT); text(c, "Yanıtla", x - 210, y + 70, "s", 24, INK, align="center")

PROMPT_LINES = [("Marka adı: ", "[MARKA ADI]", "Sesa Kids"), ("Ne satıyorum: ", "[ÜRÜN TÜRÜ]", "çocuk pijaması"),
                ("Renklerim: ", "[ANA RENK]", "pembe ve mavi"), ("Hedef müşterim: ", "[KİM ALIYOR]", "anne babalar")]
def sc_prompt(c, t, r, x, y, st, b):
    k = param_at(r, t)
    t1 = first_t(r, lambda v: v is not None and v >= 1); t2 = first_t(r, lambda v: v is not None and v >= 2)
    t3 = first_t(r, lambda v: v is not None and v >= 3); t4 = first_t(r, lambda v: v is not None and v >= 4)
    slide = eio(prog(t, t2, t2 + .8)) if t2 is not None else 0
    dx = -330 * slide
    with fx(c, st, x + dx, y + 40, (x - 700, y - 330, x + 700, y + 430)):
        w, h = 900, 680; wx, wy = x - w / 2 + dx, y - 300
        card(c, wx, wy, w, h, 26, sh=.14)
        c.drawCircle(wx + 46, wy + 46, 20, paint(ORANGE)); icon(c, "book", wx + 46, wy + 46, 22)
        text(c, "PROMPT.md", wx + 80, wy + 56, "mono", 24, INK)
        rrect(c, wx + w - 190, wy + 24, 160, 46, 23, NAVY); text(c, "Kopyala", wx + w - 110, wy + 55, "b", 20, "#FFFFFF", align="center")
        c.drawLine(wx + 24, wy + 92, wx + w - 24, wy + 92, paint("#EFEBE4", 1, 2, cap=False))
        text(c, "Benim için premium, 3D vitrinli bir", wx + 40, wy + 150, "m", 28, INK)
        text(c, "ürün satış sitesi yapmanı istiyorum.", wx + 40, wy + 190, "m", 28, INK)
        for i, (lab, ph, val) in enumerate(PROMPT_LINES):
            yy = wy + 270 + i * 70
            text(c, lab, wx + 40, yy, "s", 28, MUTED)
            fx0 = wx + 40 + tw(lab, "s", 28)
            filled = t1 is not None and t >= t1 + .6 + i * .5
            s2 = val if filled else ph
            ww = tw(s2, "b", 28) + 24
            rrect(c, fx0 - 6, yy - 32, ww, 44, 10, "#FFF1E8" if not filled else "#EAF7EF")
            text(c, s2, fx0 + 6, yy, "b", 28, ORANGE_T if not filled else "#1E8E57")
        text(c, "+ 3D modeller · satış akışı · asistan · Google ...", wx + 40, wy + 600, "m", 24, MUTED)
    # Claude'a yapıştır
    if t2 is not None:
        ps = appear(t, t2 + .5, .55)
        if ps:
            cx = x + 470
            with fx(c, ps, cx, y + 40, (cx - 300, y - 300, cx + 300, y + 420)):
                card(c, cx - 280, y - 280, 560, 640, 30, sh=.14)
                c.drawCircle(cx - 230, y - 234, 18, paint(ORANGE)); icon(c, "sparkle", cx - 230, y - 234, 22)
                text(c, "Claude", cx - 200, y - 224, "b", 26, INK)
                bubble(c, cx - 240, y - 170, 480, ["PROMPT.md yapıştırıldı", "+ 6 ürün fotoğrafı"], "user", size=24)
                for j, sp in enumerate(["krem-cilekler", "kirmizi-ekose", "gezegenler"]):
                    q = appear(t, t2 + 1.2 + j * .2, .4)
                    if q:
                        with fx(c, q, cx - 160 + j * 160, y + 20, (cx - 300, y - 60, cx + 300, y + 110)):
                            card(c, cx - 225 + j * 160, y - 50, 130, 150, 14); draw_img(c, SPIN(sp, 0), cx - 220 + j * 160, y - 45, 120, 140, 10, fit="contain", maxw=300)
                q = appear(t, t2 + 2.6, .45)
                if q:
                    with fx(c, q, cx, y + 200, (cx - 260, y + 130, cx + 260, y + 300)):
                        bubble(c, cx - 240, y + 140, 420, ["Harika! Önce 3 kısa soru..."], "ai", size=24)
                if t3 is not None:
                    for j, (ic, s_) in enumerate([("eye", "Ekran görüntüsü at"), ("cube", "3D için Tripo")]):
                        q = appear(t, t3 + .3 + j * .5, .45)
                        if q:
                            with fx(c, q, cx, y + 300 + j * 0, (cx - 300, y + 260, cx + 300, y + 400)):
                                chip(c, cx - 130 + j * 270, y + 330, s_, ic, size=20)
    if t4 is not None:
        for j, (ic, s_) in enumerate([("table", "Sipariş sistemi"), ("msg", "Asistan"), ("search", "Google ayarları")]):
            q = appear(t, t4 + .3 + j * .35, .45)
            if q:
                with fx(c, q, x - 500 + j * 500, y + 470, (x - 900, y + 410, x + 900, y + 530)):
                    chip(c, x - 500 + j * 500, y + 470, s_ + "  ✓", ic, "#2BB673", 24)

def sc_tour(c, t, r, x, y, st, b):
    with fx(c, st, x, y + 40, (x - 820, y - 360, x + 820, y + 440)):
        browser(c, t, x, y + 50, 1560, "tour", r["t0"], url="sesakids.com.tr")

def sc_netlify(c, t, r, x, y, st, b):
    k = param_at(r, t)
    T = [first_t(r, lambda v, i=i: v is not None and v >= i) for i in range(5)]
    w, h = 1200, 640; wx, wy = x - w / 2, y - 290
    with fx(c, st, x, y + 30, (wx - 40, wy - 40, wx + w + 40, wy + h + 60)):
        card(c, wx, wy, w, h, 26, sh=.14)
        for i, col in enumerate(("#FF5F57", "#FEBC2E", "#28C840")): c.drawCircle(wx + 30 + i * 22, wy + 30, 7, paint(col))
        rrect(c, wx + w / 2 - 230, wy + 14, 460, 34, 17, SOFT); text(c, "app.netlify.com", wx + w / 2, wy + 38, "m", 19, INK, align="center")
        text(c, "Netlify", wx + 40, wy + 110, "b", 40, INK)
        rrect(c, wx + 210, wy + 80, 150, 40, 20, "#EAF7EF"); text(c, "Ücretsiz", wx + 285, wy + 107, "b", 20, "#1E8E57", align="center")
        on1 = T[1] is not None and t >= T[1]
        rrect(c, wx + w - 300, wy + 76, 260, 54, 27, ORANGE if not on1 else NAVY)
        text(c, "Yeni site ekle" if not on1 else "Elle yükle", wx + w - 170, wy + 111, "b", 22, "#FFFFFF", align="center")
        # bırakma alanı
        zx, zy, zw, zh = wx + 60, wy + 170, w - 120, 300
        if on1:
            p = skia.Paint(AntiAlias=True); p.setStyle(skia.Paint.kStroke_Style); p.setStrokeWidth(3); p.setColor4f(C(ORANGE))
            p.setPathEffect(skia.DashPathEffect.Make([14, 10], (t * 30) % 24))
            c.drawRRect(skia.RRect.MakeRectXY(skia.Rect.MakeXYWH(zx, zy, zw, zh), 24, 24), p)
            if T[2] is None or t < T[2]:
                text(c, "Sitenin klasörünü buraya sürükle ve bırak", x, zy + zh / 2 + 10, "s", 30, MUTED, align="center")
        # sürüklenen klasör
        if on1 and (T[2] is None or t < T[2] + .3):
            u = eio(prog(t, T[1] + 1.0, T[1] + 2.6))
            fxp = lerp(wx - 260, x - 60, u); fyp = lerp(wy + 560, zy + 90, u)
            card(c, fxp, fyp, 150, 120, 16, color="#FFF4EC", sh=.2)
            icon(c, "store", fxp + 75, fyp + 52, 54, ORANGE, sw=1.8)
            text(c, "galeri-demo", fxp + 75, fyp + 104, "b", 20, INK, align="center")
            cursor(c, t, [(T[1] + .8, fxp + 180, fyp + 200), (T[1] + 1.0, fxp + 120, fyp + 90), (T[1] + 2.6, x + 60, zy + 180)], t_out=T[1] + 3.0)
        # yükleme → yayında
        if T[2] is not None and t >= T[2]:
            q = eio(prog(t, T[2] + .2, T[2] + 1.6))
            rrect(c, zx + 120, zy + 110, zw - 240, 16, 8, "#E2DDD3"); rrect(c, zx + 120, zy + 110, (zw - 240) * q, 16, 8, ORANGE if q < 1 else "#2BB673")
            if q >= 1:
                text(c, "Yayında!", x, zy + 80, "b", 40, "#1E8E57", align="center")
                url = "random-name-123.netlify.app"
                if T[3] is not None and t >= T[3]:
                    target = "ornekgaleri.netlify.app"; n = int(len(target) * prog(t, T[3] + .6, T[3] + 2.0))
                    url = target[:n] + ("|" if n < len(target) and int(t * 3) % 2 == 0 else "") if n > 0 else url
                uw = tw(url, "mono", 30) + 90
                rrect(c, x - uw / 2, zy + 170, uw, 70, 35, "#FFFFFF")
                c.drawRRect(skia.RRect.MakeRectXY(skia.Rect.MakeXYWH(x - uw / 2, zy + 170, uw, 70), 35, 35), paint("#2BB673", 1, 3))
                icon(c, "link", x - uw / 2 + 40, zy + 205, 28, "#2BB673", sw=2.4)
                text(c, url, x - uw / 2 + 66, zy + 216, "mono", 30, INK)
                if T[3] is not None and t >= T[3]:
                    text(c, "Site ayarları → Site adını değiştir", x, zy + 290, "m", 24, MUTED, align="center")
    if T[4] is not None:
        ps = appear(t, T[4] + .3, .5)
        if ps:
            with fx(c, ps, x, y + 470, (x - 600, y + 400, x + 600, y + 540)):
                chip(c, x - 220, y + 470, "Maile ekle", "mail", size=26)
                chip(c, x + 220, y + 470, "Telefondan da açılır", "phone", size=26)

def sc_outro(c, t, r, x, y, st, b): pass

SCENES = {"open": sc_open, "browser": sc_browser, "focus": sc_focus, "stat3": sc_stat3, "roadmap": sc_roadmap, "idea": sc_idea, "templates": sc_templates,
          "chat": sc_chat, "brand": sc_brand, "loop": sc_loop, "tl": sc_tl, "pipe": sc_pipe, "proc": sc_proc, "feet": sc_feet, "smooth": sc_smooth,
          "sales": sc_sales, "coffee": sc_coffee, "bags": sc_bags, "form": sc_form, "flow": sc_flow, "member": sc_member, "assist": sc_assist,
          "seo": sc_seo, "map": sc_map, "idea2": sc_idea2, "parents": sc_parents, "heroes": sc_heroes, "ask": sc_ask, "cards": sc_cards,
          "fails": sc_fails, "lesson": sc_lesson, "sell": sc_sell, "targets": sc_targets, "demo": sc_demo, "mail": sc_mail, "rules": sc_rules,
          "price": sc_price, "follow": sc_follow, "stats": sc_stats, "done": sc_done, "montage": sc_montage, "comment": sc_comment, "outro": sc_outro, "prompt": sc_prompt, "tour": sc_tour, "netlify": sc_netlify}

# ===================== SHOWROOM VİDEOSU SAHNELERİ =====================
def P(name): return name if name.startswith("/") else f"{IMG}/{name}"

def mode_of(r):
    v = r["beats"][0]["vis"]; return v[1] if len(v) > 1 else 0

def kb_box(r, t, name, w, h):
    """Ken Burns: bölge boyunca yavaş yakınlaşma + kayma (resme göre yön)."""
    u = prog(t, r["t0"] - .3, r["t1"] + .6)
    sgn = 1 if (sum(map(ord, name)) % 2) else -1
    z = 1.0 + .08 * eio(u)
    return w * z, h * z, sgn * 40 * (u - .5), -14 * (u - .5)

def sc_full(c, t, r, x, y, st, b):
    name = r["key"][2]
    w, h, dx, dy = kb_box(r, t, name, 2010, 1131)
    with fx(c, st, x, y, (x - 1010, y - 570, x + 1010, y + 570)):
        c.save(); c.clipRect(skia.Rect.MakeXYWH(x - 1005, y - 566, 2010, 1132))
        draw_img(c, P(name), x - w / 2 + dx, y - h / 2 + dy, w, h, 0, maxw=1920)
        p = skia.Paint(); p.setShader(skia.GradientShader.MakeRadial(skia.Point(x, y - 60), 1250, [C("#000000", 0).toColor(), C("#000000", .42).toColor()], [.45, 1]))
        c.drawRect(skia.Rect.MakeXYWH(x - 1010, y - 570, 2020, 1140), p)
        p = skia.Paint(); p.setShader(skia.GradientShader.MakeLinear([skia.Point(0, y + 150), skia.Point(0, y + 560)], [C("#05060C", 0).toColor(), C("#05060C", .78).toColor()]))
        c.drawRect(skia.Rect.MakeXYWH(x - 1010, y + 150, 2020, 420), p)
        c.restore()

def sc_shot(c, t, r, x, y, st, b):
    name, url = r["key"][2], b["vis"][2] if len(b["vis"]) > 2 else "turkishcoffeelady.netlify.app"
    with fx(c, st, x, y + 60, (x - 760, y - 340, x + 760, y + 460)):
        browser(c, t, x, y + 70, 1440, P(name), r["t0"], url=url)

def sc_phone(c, t, r, x, y, st, b):
    name = r["key"][2]
    with fx(c, st, x, y + 40, (x - 330, y - 470, x + 330, y + 520)):
        g = paint(ORANGE, .22); g.setMaskFilter(skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, 80)); c.drawCircle(x, y + 40, 330, g)
        c.save(); c.rotate(-3 + 1.2 * math.sin(t * .6), x, y + 40)
        pw, ph = 352, 762; px, py = x - pw / 2, y + 90 - ph / 2
        shadow(c, px, py, pw, ph, 58, .35, 40, 24); rrect(c, px, py, pw, ph, 58, "#0B0D16")
        if name.startswith("@"):
            nm, off = name[1:].split(":"); cl = gm_clip(nm)
            image = cl.at(t - r["t0"] + float(off)) if cl is not None else im(P("3-telefon.jpg"), 900)
            if image is not None: draw_img_rr(c, image, px + 12, py + 12, pw - 24, ph - 24, 42)
        else:
            draw_img(c, P(name), px + 12, py + 12, pw - 24, ph - 24, 42, maxw=800)
        rrect(c, x - 60, py + 26, 120, 30, 15, "#0B0D16")
        c.restore()
    for k, (ic, s) in enumerate([("phone", "Telefonda da"), ("globe", "EN / TR")]):
        ps = appear(t, r["t0"] + .7 + k * .4, .45, r["t1"])
        if ps:
            xx = x - 560 if k == 0 else x + 560
            with fx(c, ps, xx, y + 40, (xx - 260, y - 20, xx + 260, y + 100)): chip(c, xx, y + 40, s, ic, size=28)

QUIZ = ("g_referans_referans.jpg", "g_referans_simdi_acilis.png")
def sc_quiz(c, t, r, x, y, st, b):
    k = param_at(r, t)
    t1 = first_t(r, lambda v: v is not None and v >= 1); t2 = first_t(r, lambda v: v is not None and v >= 2); t3 = first_t(r, lambda v: v is not None and v >= 3)
    blur = 22 * (1 - eio(prog(t, t1, t1 + .6))) if t1 is not None else 22
    for i, name in enumerate(QUIZ):
        cx = x - 470 + i * 940; cw, chh = 880, 495
        win = t3 is not None and t >= t3
        sc = 1 + (.05 * eback(prog(t, t3, t3 + .5)) if win and i == 1 else 0) - (.04 * eio(prog(t, t3, t3 + .5)) if win and i == 0 else 0)
        ps = appear(t, r["t0"] + .2 + i * .25, .5)
        if not ps: continue
        with fx(c, ps, cx, y + 60, (cx - 480, y - 240, cx + 480, y + 380)):
            c.save(); c.translate(cx, y + 60); c.scale(sc, sc); c.translate(-cx, -(y + 60))
            p = skia.Paint()
            if blur > .3: p.setImageFilter(skia.ImageFilters.Blur(blur, blur))
            card(c, cx - cw / 2 - 10, y + 60 - chh / 2 - 10, cw + 20, chh + 20, 26, sh=.18)
            c.saveLayer(skia.Rect.MakeXYWH(cx - cw / 2 - 60, y + 60 - chh / 2 - 60, cw + 120, chh + 120), p)
            draw_img(c, P(name), cx - cw / 2, y + 60 - chh / 2, cw, chh, 18, maxw=1600)
            c.restore()
            if win:
                col = "#2BB673" if i == 1 else "#9AA0B5"
                c.drawRRect(skia.RRect.MakeRectXY(skia.Rect.MakeXYWH(cx - cw / 2 - 10, y + 60 - chh / 2 - 10, cw + 20, chh + 20), 26, 26), paint(col, 1, 8))
                lab = "WEB SİTESİ" if i == 1 else "RENDER"
                wl = tw(lab, "b", 30) + 70
                rrect(c, cx - wl / 2, y + 60 + chh / 2 - 26, wl, 64, 32, col); text(c, lab, cx, y + 60 + chh / 2 + 17, "b", 30, "#FFFFFF", align="center")
            c.drawCircle(cx - cw / 2 + 50, y + 60 - chh / 2 + 50, 34, paint(NAVY if i == 0 else ORANGE)); text(c, "AB"[i], cx - cw / 2 + 50, y + 60 - chh / 2 + 62, "b", 34, "#FFFFFF", align="center")
            c.restore()
    if t2 is not None and t >= t2 and (t3 is None or t < t3 + .2):
        q = eback(prog(t, t2, t2 + .45)); fade = 1 - eio(prog(t, t3 - .1, t3 + .2)) if t3 else 1
        rr = 90 * q
        c.drawCircle(x, y + 60, rr + 8, paint("#FFFFFF", fade)); c.drawCircle(x, y + 60, rr, paint(ORANGE, fade))
        text(c, "?", x, y + 60 + 48 * q, "b", 140 * q, "#FFFFFF", fade, align="center")
        u = prog(t, t2, (t3 or t2 + 2.5))
        pth = skia.Path(); pth.addArc(skia.Rect.MakeXYWH(x - rr - 22, y + 60 - rr - 22, 2 * rr + 44, 2 * rr + 44), -90, 360 * (1 - u))
        c.drawPath(pth, paint(NAVY, fade, 6))

PHOTOS = [f"m_photos_bmw-420i-{i}.webp" for i in (1, 2, 3, 4)]
CUTS = ["m_cutouts_bmw-420i-on.webp", "m_cutouts_bmw-420i-yan.webp", "m_cutouts_bmw-420i-arka.webp"]
def sc_photos(c, t, r, x, y, st, b):
    k = param_at(r, t)
    T = [first_t(r, lambda v, i=i: v is not None and v >= i) for i in range(5)]
    g1 = eio(prog(t, T[1], T[1] + .7)) if T[1] is not None else 0          # yelpazeden ızgaraya
    g2 = eio(prog(t, T[2], T[2] + .7)) if T[2] is not None else 0          # sola kay
    g3 = eio(prog(t, T[3], T[3] + .6)) if T[3] is not None else 0          # kesilmiş araçlar
    g4 = eio(prog(t, T[4], T[4] + .6)) if T[4] is not None else 0          # 3D model
    fan = [(-330, -40, -9), (-110, -70, -3), (110, -60, 4), (330, -30, 10)]
    grid = [(-260, -150, 0), (260, -150, 0), (-260, 190, 0), (260, 190, 0)]
    for i, name in enumerate(PHOTOS if mode_of(r) < 3 else []):
        ps = appear(t, r["t0"] + .15 + i * .18, .45)
        if not ps: continue
        fx_, fy_, fr = fan[i]; gx, gy, gr = grid[i]
        px, py, rot = lerp(fx_, gx, g1), lerp(fy_, gy, g1), lerp(fr, gr, g1)
        sc = lerp(1, .62, g2); px = px * sc + lerp(0, -560, g2); py = py * sc + 60
        a = 1 - g3 * .65
        cw, chh = 480 * sc, 330 * sc
        with fx(c, ps, x + px, y + py, (x + px - 300, y + py - 230, x + px + 300, y + py + 230)):
            c.save(); c.rotate(rot, x + px, y + py)
            card(c, x + px - cw / 2 - 10, y + py - chh / 2 - 10, cw + 20, chh + 20, 12, a=a, sh=.16 * a)
            draw_img(c, P(name), x + px - cw / 2, y + py - chh / 2, cw, chh, 6, a=a, maxw=900)
            c.restore()
    if T[1] is not None and g2 < 1:
        ps = appear(t, T[1] + .6, .4, T[2])
        if ps:
            with fx(c, ps, x, y + 470, (x - 300, y + 420, x + 300, y + 520)): chip(c, x, y + 470, "4 ilan fotoğrafı", "info", size=26)
    if T[2] is not None and g3 < 1:
        grow(c, [(x - 220, y + 60), (x + 120, y + 60)], eout(prog(t, T[2] + .4, T[2] + .9)), ORANGE, 5)
        node(c, t, T[2] + .8, x + 380, y + 60, 110, "door", NAVY, "3D showroom?", lsize=32, t1=T[3])
    if T[3] is not None and g4 < 1:
        for i, name in enumerate(CUTS):
            ps = appear(t, T[3] + .2 + i * .3, .5, T[4])
            if not ps: continue
            cx = x + 40 + i * 330 if i else x + 40
            cx = x - 40 + i * 340
            with fx(c, ps, cx, y + 60, (cx - 200, y - 80, cx + 200, y + 200)):
                draw_img(c, P(name), cx - 165, y - 30, 330, 180, 0, fit="contain", maxw=900)
        ps = appear(t, T[3] + 1.2, .4, T[4])
        if ps:
            with fx(c, ps, x + 300, y + 300, (x, y + 250, x + 600, y + 350)): chip(c, x + 300, y + 300, "Arka plan temizlendi", "check", "#2BB673", 26)
    if T[4] is not None:
        ps = appear(t, T[4] + .2, .55)
        if ps:
            with fx(c, ps, x + 240, y + 60, (x - 400, y - 300, x + 900, y + 420)):
                browser(c, t, x + 250, y + 50, 1100, P("b_final_2_side_profile.jpg"), T[4], url="mtgmotors · BMW 420i")
            ps2 = appear(t, T[4] + .9, .4)
            if ps2:
                with fx(c, ps2, x + 250, y + 380, (x - 50, y + 330, x + 550, y + 430)): chip(c, x + 250, y + 380, "Gerçek 3D model · ilandaki kırmızı", "orbit", size=24)

CHATS_SR = [("user", ["Garden Motors için içinde gezilebilen", "3D bir showroom yapalım. İlanlar ekte."]),
            ("user", ["Galerinin önünden başlayalım, kapıdan", "girelim, her aracın kendi odası olsun."]),
            ("ai", ["Harika! Önce cepheyi kuralım,", "sonra her araca bir oda hazırlayalım."])]
def sc_chat2(c, t, r, x, y, st, b):
    shown = [(i, first_t(r, lambda v, i=i: v == i)) for i in (0, 1)]
    if shown[1][1] is not None: shown.append((2, shown[1][1] + 3.2))
    w, h = 1100, 640; wx, wy = x - w / 2, y - 280
    card(c, wx, wy, w, h, 30, sh=.14)
    c.drawCircle(wx + 50, wy + 46, 18, paint(ORANGE)); icon(c, "sparkle", wx + 50, wy + 46, 22)
    text(c, "Claude", wx + 82, wy + 55, "b", 26, INK); text(c, "ile sohbet", wx + 82 + tw("Claude", "b", 26) + 10, wy + 55, "m", 24, MUTED)
    c.drawLine(wx, wy + 92, wx + w, wy + 92, paint("#EFEBE4", 1, 2, cap=False))
    yy = wy + 124
    for i, ts in shown:
        if ts is None or t < ts: continue
        who, lines_ = CHATS_SR[i]
        ps = appear(t, ts + .15, .45, rise=20)
        if not ps: continue
        size = 30; bw = max(tw(s, "s", size) for s in lines_) + 60
        bx = wx + w - bw - 36 if who == "user" else wx + 36
        with fx(c, ps, bx + bw / 2, yy + 40, (bx, yy, bx + bw, yy + 160)):
            if who == "user":
                full = " / ".join(lines_); n = int(len(full) * prog(t, ts + .2, ts + .2 + len(full) * .03))
                typed = full[:n].split(" / ")
                hh = bubble(c, bx, yy, bw, typed + [""] * (len(lines_) - len(typed)), who, size=size)
            else: hh = bubble(c, bx, yy, bw, lines_, who, size=size)
        if False:
            for j, name in enumerate(PHOTOS[:3]):
                q = appear(t, ts + 1.6 + j * .15, .4)
                if q:
                    ix = bx + bw - 3 * 130 + j * 130
                    with fx(c, q, ix + 60, yy + hh + 50, (ix - 10, yy + hh, ix + 130, yy + hh + 110)): draw_img(c, P(name), ix, yy + hh + 12, 118, 80, 10, maxw=300)
            hh += 100
        yy += hh + 22

def sc_stat(c, t, r, x, y, st, b):
    if mode_of(r) == 0:
        items = [("~200", "değişiklik"), ("3", "galeri"), ("∞", "hata")]
        for k, (n, s) in enumerate(items):
            ps = appear(t, r["t0"] + .3 + k * .45, .5, r["t1"])
            if not ps: continue
            cx = x - 460 + k * 460
            with fx(c, ps, cx, y + 80, (cx - 200, y - 120, cx + 200, y + 280)):
                card(c, cx - 190, y - 90, 380, 330, 30)
                text(c, n, cx, y + 110, "b", 150 if k else 120, ORANGE if k != 1 else NAVY, align="center")
                text(c, s, cx, y + 190, "s", 34, MUTED, align="center")
        return
    rows = [("MTG Motors", 10, "10 gün", NAVY), ("Garden Motors", 4, "4 gün", NAVY), ("REF Luxury Cars", .1, "1 saat", ORANGE)]
    for k, (nm, d, lab, col) in enumerate(rows):
        tk = r["t0"] + .3 + k * .5 if k < 2 else (r["beats"][-1]["t"] + .3 if len(r["beats"]) > 1 else r["t0"] + 1.5)
        ps = appear(t, tk, .45)
        if not ps: continue
        yy = y - 160 + k * 170
        with fx(c, ps, x, yy, (x - 800, yy - 70, x + 800, yy + 70)):
            text(c, nm, x - 700, yy + 14, "b", 40, INK)
            bw = 820 * d / 10; q = eout(prog(t, tk + .1, tk + .9))
            rrect(c, x - 180, yy - 30, 820, 60, 30, "#E9E4DB"); rrect(c, x - 180, yy - 30, max(60, bw * q), 60, 30, col)
            text(c, lab, x - 180 + max(60, bw * q) + 24, yy + 14, "b", 40, col)

PIPE = [("globe", "Tarayıcı", "g_N_ic.png"), ("cube", "Blender'da oda", "g_Q_lobi_yakin.png"), ("bulb", "Işığı pişir", "g_oda_mercedes_logo_panel.png"), ("star", "Sitede göster", "g_arayuz_ui_hero.png")]
def sc_pipe2(c, t, r, x, y, st, b):
    nmax = max((bb["vis"][1] if len(bb["vis"]) > 1 else 0) for bb in r["beats"])
    xs = [x - 690 + (3 - nmax) * 230 + i * 460 for i in range(4)]
    for i, (ic, s, im_) in enumerate(PIPE):
        ti = first_t(r, lambda v, i=i: v is not None and v >= i)
        if ti is None: continue
        if i: grow(c, [(xs[i - 1] + 90, y - 80), (xs[i] - 90, y - 80)], eout(prog(t, ti, ti + .45)), ORANGE, 4)
        node(c, t, ti + .1, xs[i], y - 80, 72, ic, ORANGE if i else NAVY, s, lsize=28)
        ps = appear(t, ti + .45, .5)
        if ps:
            with fx(c, ps, xs[i], y + 230, (xs[i] - 220, y + 110, xs[i] + 220, y + 350)):
                card(c, xs[i] - 200, y + 120, 400, 225, 18); draw_img(c, P(im_), xs[i] - 192, y + 128, 384, 209, 12, maxw=800)
    t3 = first_t(r, lambda v: v is not None and v >= 3)
    if t3 is not None:
        ps = appear(t, t3 + 1.0, .45)
        if ps:
            with fx(c, ps, x, y + 440, (x - 500, y + 390, x + 500, y + 490)): chip(c, x, y + 440, "Her pazartesi ve perşembe", "check", "#2BB673", 28)

FLASH = ["b_preview_car_wide.jpg", "b_preview_lounge_bar.jpg", "b_v2_car_gallery.jpg", "b_v2_car_wide.jpg", "b_v2_car_lounge.jpg", "b_v3_3_lounge.jpg",
         "b_v3_2_side.jpg", "b_final_3_lounge_car.jpg", "b_v2_car_bmw.jpg", "b_preview_car_lounge.jpg", "b_v3_4_detail.jpg", "b_final_1_hero_front34.jpg"]
def sc_flash(c, t, r, x, y, st, b):
    i = int(max(0, t - r["t0"]) / .42) % len(FLASH)
    with fx(c, st, x, y + 60, (x - 760, y - 340, x + 760, y + 460)):
        browser(c, t, x, y + 70, 1440, P(FLASH[i]), r["t0"], url=f"blender · deneme {i + 1}")
    q = (t - r["t0"]) % .42
    if q < .06: c.drawRect(skia.Rect.MakeXYWH(x - 720, y - 280, 1440, 700), paint("#FFFFFF", .25 * (1 - q / .06)))

def sc_ab(c, t, r, x, y, st, b):
    A, B = r["key"][2], r["key"][3]; la, lb = b["vis"][3], b["vis"][4]
    w, h = 1520, 855; x0, y0 = x - w / 2, y + 60 - h / 2
    t0 = r["t0"]; sd = min(1.5, max(.6, (r["t1"] - t0) * .45)); s0 = min(.5, (r["t1"] - t0) * .15)
    sw = eio(prog(t, t0 + s0, t0 + s0 + sd))
    p = 1 - .5 * sw
    te = t0 + s0 + sd
    if t > te: p = .5 + .16 * math.sin((t - te) * .9) * eio(prog(t, te, te + 1.0))
    with fx(c, st, x, y + 60, (x0 - 30, y0 - 30, x0 + w + 30, y0 + h + 30)):
        card(c, x0 - 12, y0 - 12, w + 24, h + 24, 30, sh=.18)
        draw_img(c, P(B), x0, y0, w, h, 20, maxw=1920)
        c.save(); c.clipRect(skia.Rect.MakeXYWH(x0, y0, w * p, h)); draw_img(c, P(A), x0, y0, w, h, 20, maxw=1920); c.restore()
        hx = x0 + w * p
        c.drawLine(hx, y0, hx, y0 + h, paint("#FFFFFF", 1, 6, cap=False))
        shadow(c, hx - 40, y + 20, 80, 80, 40, .3, 16, 6); c.drawCircle(hx, y + 60, 40, paint("#FFFFFF"))
        text(c, "‹ ›", hx, y + 72, "b", 34, INK, align="center")
        for k, (s, col) in enumerate(((la, NAVY), (lb, ORANGE))):
            ww = tw(s, "b", 28) + 48
            xx = x0 + 24 if k == 0 else x0 + w - 24 - ww
            rrect(c, xx, y0 + 24, ww, 56, 28, col, .92); text(c, s, xx + ww / 2, y0 + 62, "b", 28, "#FFFFFF", align="center")

BUGS = {0: ("phone", "iPhone · Safari", "Sayfa kapandı: bellek yetmedi", "r"), 1: ("film", "Işık haritaları", "Telefon için fazla büyük dosyalar", "r"),
        2: ("check", "Çözüm", "Küçük doku · yarım ışık · sakin TV · sabit çözünürlük", "g"), 3: ("x", "contact-shadow.glsl", "// yorum satırı  )  parantezini yuttu", "r"),
        4: ("check", "Düzeltme", "Tek karakter → gölge geri geldi", "g"), 5: ("x", "Lavanta duvarlar", "Gece gökyüzünün yansıması duvara vuruyor", "r")}
def sc_bug(c, t, r, x, y, st, b):
    ks = sorted({bb["vis"][1] for bb in r["beats"]})
    if ks == [5]:
        with fx(c, st, x - 380, y + 60, (x - 900, y - 260, x + 140, y + 380)):
            card(c, x - 900, y - 240, 1040, 600, 26); draw_img(c, P("g_duvar_teshis_ab.jpg"), x - 885, y - 225, 1010, 570, 16, maxw=1300)
        t2 = r["beats"][-1]["t"] if len(r["beats"]) > 1 else None
        fixed = t2 is not None and t >= t2 + .8
        with fx(c, st, x + 500, y + 60, (x + 180, y - 120, x + 820, y + 240)):
            card(c, x + 190, y - 100, 620, 320, 26)
            col = "#2BB673" if fixed else "#E5484D"
            c.drawCircle(x + 260, y - 30, 34, paint(col)); icon(c, "check" if fixed else "x", x + 260, y - 30, 38, "#FFFFFF", sw=3)
            text(c, "Lavanta duvarlar", x + 316, y - 18, "b", 34, INK)
            text(c, "Sebep: gökyüzü yansıması" if not fixed else "Yansıma kapatıldı", x + 220, y + 80, "s", 30, MUTED)
            text(c, "taş kendi rengine döndü" if fixed else "", x + 220, y + 130, "s", 30, "#1E8E57")
        return
    cur = param_at(r, t)
    for j, kk in enumerate(ks):
        ti = first_t(r, lambda v, kk=kk: v == kk)
        if ti is None or t < ti: continue
        ic, title, sub, kind = BUGS[kk]
        ps = appear(t, ti + .15, .45)
        if not ps: continue
        yy = y - 250 + j * 128
        with fx(c, ps, x, yy, (x - 600, yy - 60, x + 600, yy + 60)):
            on = kk == cur
            shadow(c, x - 560, yy - 54, 1120, 108, 26, .16 if on else .07, 18, 8)
            rrect(c, x - 560, yy - 54, 1120, 108, 26, CARD)
            if on: c.drawRRect(skia.RRect.MakeRectXY(skia.Rect.MakeXYWH(x - 560, yy - 54, 1120, 108), 26, 26), paint(ORANGE, 1, 3))
            col = "#2BB673" if kind == "g" else "#E5484D"
            bq = eback(prog(t, ti + .3, ti + .6))
            c.drawCircle(x - 500, yy, 32 * bq, paint(col)); icon(c, ic if kind == "g" or ic == "x" else ic, x - 500, yy, 34 * bq, "#FFFFFF", sw=2.6)
            text(c, title, x - 446, yy - 6, "mono" if kk == 3 else "b", 30, INK)
            text(c, sub, x - 446, yy + 34, "mono" if kk == 3 else "m", 25, "#C0392B" if kk == 3 else MUTED)

TARGETS = [("car", "Oto galeri"), ("gem", "Kuyumcu"), ("sofa", "Mobilyacı"), ("store", "Emlak"), ("pin", "Tekne galerisi"), ("bag", "Mağaza")]
def sc_targets2(c, t, r, x, y, st, b):
    if mode_of(r) == 0:
        for k, (ic, s) in enumerate(TARGETS):
            tk = r["t0"] + .2 + k * .22 if k < 2 else (r["beats"][-1]["t"] + (k - 2) * .25 if len(r["beats"]) > 1 else r["t0"] + 1 + k * .2)
            node(c, t, tk, x - 750 + k * 300, y + 40, 72, ic, ORANGE if k % 2 == 0 else NAVY, s, lsize=26)
        return
    with fx(c, st, x - 420, y + 60, (x - 900, y - 260, x + 60, y + 380)):
        browser(c, t, x - 420, y + 60, 880, P("g_arayuz_ui2_ozet.png"), r["t0"], url="ilan sitesi · galeri mağazası")
    for k, (ic, s) in enumerate([("map", "Haritalarda: oto galeri"), ("search", "İlan sitesi mağaza sayfaları"), ("star", "Sitesi yok ya da eski olanlar")]):
        tk = r["t0"] + .6 + k * .5 if k < 2 else (r["beats"][-1]["t"] + .3 if len(r["beats"]) > 1 else r["t0"] + 2)
        ps = appear(t, tk, .45)
        if ps:
            yy = y - 100 + k * 150
            with fx(c, ps, x + 470, yy, (x + 60, yy - 60, x + 900, yy + 60)): chip(c, x + 470, yy, s, ic, ORANGE if k < 2 else "#2BB673", 28)

def sc_demo2(c, t, r, x, y, st, b):
    with fx(c, st, x - 440, y + 40, (x - 860, y - 240, x - 20, y + 330)):
        browser(c, t, x - 440, y + 20, 780, P("g_t5_sonra_acilis.png"), r["t0"], url="senin şablonun")
        text(c, "Senin şablonun", x - 440, y + 300, "b", 30, INK, align="center")
    grow(c, [(x - 30, y + 20), (x + 30, y + 20)], eout(prog(t, r["t0"] + .6, r["t0"] + 1.0)), ORANGE, 5)
    ps = appear(t, r["t0"] + 1.0, .5)
    if ps:
        with fx(c, ps, x + 440, y + 40, (x + 20, y - 240, x + 860, y + 330)):
            h = 780 * 776 / 1600
            card(c, x + 50, y + 20 - h / 2, 780, h, 18, sh=.16)
            rrect(c, x + 70, y + 20 - h / 2 + 40, 740, h - 60, 12, "#EFE6DA")
            text(c, "YENİ GALERİ", x + 440, y - 60, "b", 34, NAVY, align="center", track=2)
            text(c, "logo · araçlar · renkler", x + 440, y - 10, "m", 26, MUTED, align="center")
            icon(c, "wand", x + 440, y + 90, 80, ORANGE, sw=1.8)
            text(c, "Bir saatte yeni demo", x + 440, y + 300, "b", 30, INK, align="center")
    for k, (ic, s) in enumerate([("tag", "Galerinin adı"), ("car", "Kendi araçları"), ("pencil", "Renkleri")]):
        q = appear(t, r["t0"] + 1.6 + k * .3, .4)
        if q:
            with fx(c, q, x - 420 + k * 420, y + 420, (x - 800, y + 370, x + 800, y + 470)): chip(c, x - 420 + k * 420, y + 420, s, ic, size=26)

STEPS = [("store", "Galeri seç"), ("cube", "Demo hazırla"), ("globe", "Ücretsiz link al"), ("mail", "Kişisel e-posta"), ("repeat", "Takip et")]
MAIL = ["Merhaba, ilanlarınızı inceledim ve galeriniz için", "içinde gezilebilen 3D bir showroom denemesi hazırladım.", "",
        "Linkten bakabilirsiniz; beğenirseniz 10 dakikalık", "bir görüşmede detayları konuşalım. İyi çalışmalar!"]

PROMPT_SR = [("Galeri adı: ", "[GALERİ ADI]", "Garden Motors"), ("Şehir: ", "[ŞEHİR]", "İstanbul"),
             ("Araçlar: ", "[MARKA MODEL]", "Mercedes E 180"), ("Renkler: ", "[ANA RENK]", "yeşil ve siyah")]
def sc_prompt2(c, t, r, x, y, st, b):
    t1 = first_t(r, lambda v: v is not None and v >= 1); t2 = first_t(r, lambda v: v is not None and v >= 2); t3 = first_t(r, lambda v: v is not None and v >= 3)
    slide = eio(prog(t, t2, t2 + .8)) if t2 is not None else 0
    dx = -330 * slide
    with fx(c, st, x + dx, y + 40, (x - 700, y - 330, x + 700, y + 430)):
        w, h = 900, 680; wx, wy = x - w / 2 + dx, y - 300
        card(c, wx, wy, w, h, 26, sh=.14)
        c.drawCircle(wx + 46, wy + 46, 20, paint(ORANGE)); icon(c, "book", wx + 46, wy + 46, 22)
        text(c, "SHOWROOM-PROMPT.md", wx + 80, wy + 56, "mono", 24, INK)
        rrect(c, wx + w - 190, wy + 24, 160, 46, 23, NAVY); text(c, "Kopyala", wx + w - 110, wy + 55, "b", 20, "#FFFFFF", align="center")
        c.drawLine(wx + 24, wy + 92, wx + w - 24, wy + 92, paint("#EFEBE4", 1, 2, cap=False))
        text(c, "Benim için içinde gezilebilen, 3D bir", wx + 40, wy + 150, "m", 28, INK)
        text(c, "oto galeri showroom'u yapmanı istiyorum.", wx + 40, wy + 190, "m", 28, INK)
        for i, (lab, ph, val) in enumerate(PROMPT_SR):
            yy = wy + 270 + i * 70
            text(c, lab, wx + 40, yy, "s", 28, MUTED)
            fx0 = wx + 40 + tw(lab, "s", 28)
            filled = t1 is not None and t >= t1 + .6 + i * .5
            s2 = val if filled else ph
            ww = tw(s2, "b", 28) + 24
            rrect(c, fx0 - 6, yy - 32, ww, 44, 10, "#FFF1E8" if not filled else "#EAF7EF")
            text(c, s2, fx0 + 6, yy, "b", 28, ORANGE_T if not filled else "#1E8E57")
        text(c, "+ bina · araç odaları · ilan kartı · soru formu · telefon", wx + 40, wy + 600, "m", 24, MUTED)
    if t2 is not None:
        ps = appear(t, t2 + .5, .55)
        if ps:
            cx = x + 470
            with fx(c, ps, cx, y + 40, (cx - 300, y - 300, cx + 300, y + 420)):
                card(c, cx - 280, y - 280, 560, 640, 30, sh=.14)
                c.drawCircle(cx - 230, y - 234, 18, paint(ORANGE)); icon(c, "sparkle", cx - 230, y - 234, 22)
                text(c, "Claude", cx - 200, y - 224, "b", 26, INK)
                bubble(c, cx - 240, y - 170, 480, ["Prompt yapıştırıldı", "+ araç fotoğrafları"], "user", size=24)
                for j, sp in enumerate(["g_arayuz_ui_kart.png", "g_vitrin_g63_rampa.png", "g_gunduz_masaustu.jpg"]):
                    q = appear(t, t2 + 1.2 + j * .2, .4)
                    if q:
                        with fx(c, q, cx - 160 + j * 160, y + 20, (cx - 300, y - 60, cx + 300, y + 110)):
                            card(c, cx - 225 + j * 160, y - 50, 130, 100, 14); draw_img(c, P(sp), cx - 220 + j * 160, y - 45, 120, 90, 10, maxw=300)
                q = appear(t, t2 + 2.6, .45)
                if q:
                    with fx(c, q, cx, y + 160, (cx - 260, y + 90, cx + 260, y + 240)):
                        bubble(c, cx - 240, y + 100, 420, ["Harika! Önce birkaç soru..."], "ai", size=24)
                if t3 is not None:
                    for j, (ic, s_) in enumerate([("info", "Model lisansına bak"), ("eye", "Ekran görüntüsü at")]):
                        q = appear(t, t3 + .3 + j * .5, .45)
                        if q:
                            with fx(c, q, cx, y + 300, (cx - 300, y + 260, cx + 300, y + 400)): chip(c, cx, y + 260 + j * 76, s_, ic, size=22)

def sc_rstats(c, t, r, x, y, st, b):
    items = [("1", "ayar dosyası"), ("1", "komut"), ("~20 sn", "üretim"), ("0 TL", "Netlify")]
    for k, (n, s) in enumerate(items):
        ps = appear(t, r["t0"] + 1.2 + k * .45, .5, r["t1"])
        if not ps: continue
        cx = x - 690 + k * 460
        with fx(c, ps, cx, y + 60, (cx - 210, y - 160, cx + 210, y + 280)):
            card(c, cx - 200, y - 140, 400, 400, 30)
            text(c, n, cx, y + 90, "b", 140 if len(n) < 4 else 96, ORANGE if k % 2 == 0 else NAVY, align="center")
            text(c, s, cx, y + 180, "s", 30, MUTED, align="center")

MONT_SR = [("c_Dy_00.jpg", "1. gün"), ("c_Dh_00.jpg", "1. gün"), ("c_der2_10.jpg", "2. gün"), ("c_der2_11.jpg", "2. gün"), ("c_duv_00.jpg", "2. gün"),
           ("c_duv_01.jpg", "3. gün"), ("c_kol_20.jpg", "3. gün"), ("g_referans_simdi_acilis.png", "3. gün"), ("g_t5_sonra_acilis.png", "3. gün"),
           ("g_vitrin_bant_tas.png", "4. gün"), ("g_vitrin_vt_hero.png", "4. gün"), ("g_vitrin_g63_rampa.png", "4. gün"), ("g_gunduz_masaustu.jpg", "son hali")]
def sc_montage2(c, t, r, x, y, st, b):
    i = min(len(MONT_SR) - 1, int(max(0, t - r["t0"] - .3) / .55)) if (t - r["t0"]) < .55 * len(MONT_SR) + .3 else len(MONT_SR) - 1
    if t - r["t0"] > .55 * len(MONT_SR) + 1.5: i = int((t - r["t0"]) / .55) % len(MONT_SR)
    name, lab = MONT_SR[i]
    with fx(c, st, x, y + 40, (x - 760, y - 340, x + 760, y + 460)):
        browser(c, t, x, y + 40, 1400, P(name), r["t0"], url="turkishcoffeelady · " + lab)
    w = 900; q = clamp(i / (len(MONT_SR) - 1))
    rrect(c, x - w / 2, y + 440, w, 12, 6, "#E2DDD3"); rrect(c, x - w / 2, y + 440, w * q, 12, 6, ORANGE)
    text(c, lab, x, y + 500, "mono", 30, ORANGE_T, align="center")

def sc_comment2(c, t, r, x, y, st, b):
    with fx(c, st, x, y + 40, (x - 620, y - 220, x + 620, y + 300)):
        card(c, x - 600, y - 200, 1200, 420, 30)
        avatar_k(c, x - 510, y - 110, 44)
        text(c, "@izleyici", x - 450, y - 118, "b", 28, INK); text(c, "· şimdi", x - 450 + tw("@izleyici", "b", 28) + 12, y - 118, "m", 24, MUTED)
        s1 = ["Çanakkale'yi de yap!", "Kod bilmeden bu nasıl oluyor?"][mode_of(r)]; n = int(len(s1) * prog(t, r["t0"] + .6, r["t0"] + 2.2))
        text(c, s1[:n], x - 450, y - 60, "m", 36, INK)
        icon(c, "thumb", x - 430, y + 60, 40, NAVY, sw=2.2); text(c, ["214", "3"][mode_of(r)], x - 395, y + 72, "s", 26, MUTED)
        rrect(c, x - 290, y + 30, 160, 60, 30, SOFT); text(c, "Yanıtla", x - 210, y + 70, "s", 24, INK, align="center")

SCENES.update({"full": sc_full, "shot": sc_shot, "phone": sc_phone, "quiz": sc_quiz, "photos": sc_photos, "chat": sc_chat2, "stat": sc_stat,
               "pipe": sc_pipe2, "flash": sc_flash, "ab": sc_ab, "bug": sc_bug, "targets": sc_targets2, "demo": sc_demo2, "prompt": sc_prompt2,
               "rstats": sc_rstats, "montage": sc_montage2, "comment": sc_comment2})

# ---------- Garden Motors sürümü: canlı klip, Blender betiği, adımlar ----------
BUGS.update({6: ("x", "Titreyen duvarlar", "Kamera kıpırdayınca yanıp sönüyor", "r"), 7: ("check", "Çözüm", "Üst üste iki yüzey → birini 1 mm öne al", "g")})
GM_CLIPS = f"{V}/clips"
CLIP_FALLBACK = {"dis": "g_referans_simdi_acilis.png", "dis2": "g_r2_acilis.png", "giris": "g_t5_sonra_kapi.png", "oda1": "g_arayuz_ui_hero.png",
                 "oda2": "g_oda_mercedes_logo_panel.png", "oda3": "g_N_ic.png", "vitrin": "g_vitrin_vt_hero.png"}
def gm_clip(name):
    key = "gm_" + name
    if key not in CLIPS:
        CLIPS[key] = None
        for d in (f"{V}/clips_u", f"{V}/clips"):
            f = f"{d}/{name}.mp4"
            if os.path.exists(f):
                w, h = map(int, subprocess.check_output(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height", "-of", "csv=p=0", f]).decode().strip().split(","))
                CLIPS[key] = Clip(f, 30, size=(w, h), loop=True); break
    return CLIPS[key]
def sc_clip(c, t, r, x, y, st, b):
    name = r["key"][2]; off = .3
    if ":" in name: name, o = name.split(":"); off = float(o)
    cl = gm_clip(name)
    image = cl.at(t - r["t0"] + off) if cl is not None else im(P(CLIP_FALLBACK.get(name, "g_r2_acilis.png")), 1600)
    with fx(c, st, x, y, (x - 1010, y - 570, x + 1010, y + 570)):
        c.save(); c.clipRect(skia.Rect.MakeXYWH(x - 1005, y - 566, 2010, 1132))
        if image is not None:
            p = skia.Paint(); p.setImageFilter(skia.ImageFilters.Blur(40, 40))
            c.saveLayer(skia.Rect.MakeXYWH(x - 1005, y - 566, 2010, 1132), p); draw_img_rr(c, image, x - 1100, y - 620, 2200, 1240, 0); c.restore()
        c.drawRect(skia.Rect.MakeXYWH(x - 1010, y - 570, 2020, 1140), paint("#05060C", .45))
        u = prog(t, r["t0"] - .3, r["t1"] + .6); z = 1 + .03 * u
        asp = (cl.h / cl.w) if cl is not None else 9 / 16
        ww = (1700 if asp < .5 else 1500) * z; hh = ww * asp; cx, cy = x, y - 40
        shadow(c, cx - ww / 2, cy - hh / 2, ww, hh, 22, .5, 40, 20)
        if image is not None: draw_img_rr(c, image, cx - ww / 2, cy - hh / 2, ww, hh, 22)
        c.drawRRect(skia.RRect.MakeRectXY(skia.Rect.MakeXYWH(cx - ww / 2, cy - hh / 2, ww, hh), 22, 22), paint("#FFFFFF", .18, 2))
        p = skia.Paint(); p.setShader(skia.GradientShader.MakeLinear([skia.Point(0, y + 260), skia.Point(0, y + 560)], [C("#05060C", 0).toColor(), C("#05060C", .8).toColor()]))
        c.drawRect(skia.Rect.MakeXYWH(x - 1010, y + 260, 2020, 310), p)
        c.restore()

CODE = ["import bpy", "", "# 1) Oda: gerçek ölçülerle", "oda = yeni_oda(en=14.0, boy=9.0, yukseklik=5.2)", "duvar(oda, doku='tas_rock041')", "zemin(oda, doku='granit', parlaklik=.35)",
        "logo_paneli(oda, 'garden-motors.png')", "", "# 2) Işığı pişir (Cycles)", "isik_pisir(oda, cozunurluk=2048, ornek=192)", "", "# 3) Web için dışa aktar", "bpy.ops.export_scene.gltf(filepath='room_car.glb')"]
def sc_term(c, t, r, x, y, st, b):
    k = param_at(r, t)
    T = [first_t(r, lambda v, i=i: v is not None and v >= i) for i in range(6)]
    if k <= 0:
        with fx(c, st, x, y + 60, (x - 760, y - 300, x + 760, y + 420)):
            card(c, x - 700, y - 250, 1400, 640, 24, color="#2B2B2B", sh=.2)
            rrect(c, x - 700, y - 250, 1400, 48, 24, "#3C3C3C"); rrect(c, x - 700, y - 226, 1400, 24, 0, "#3C3C3C")
            text(c, "Blender", x - 670, y - 218, "b", 22, "#E8E8E8")
            draw_img(c, P("g_Q_lobi_yakin.png"), x - 680, y - 190, 1360, 560, 10, maxw=1400)
        q = appear(t, r["t0"] + .8, .45)
        if q:
            with fx(c, q, x, y + 440, (x - 400, y + 390, x + 400, y + 490)): chip(c, x, y + 440, "Hiç Blender bilmiyorum", "info", size=28)
        return
    # sol: kod editörü
    ed_x = x - 820 if k >= 3 else x - 640
    with fx(c, st, ed_x + 560, y + 60, (ed_x - 20, y - 300, ed_x + 1140, y + 430)):
        card(c, ed_x, y - 280, 1120, 690, 22, color="#1E1E1E", sh=.2)
        text(c, "galeri_oda.py", ed_x + 30, y - 240, "mono", 22, "#9CDCFE")
        for i, ln in enumerate(CODE):
            q = prog(t, T[1] + .3 + i * .22, T[1] + .5 + i * .22) if T[1] is not None else 0
            if q <= 0: continue
            col = "#6A9955" if ln.startswith("#") else ("#C586C0" if ln.startswith("import") else "#D4D4D4")
            hl = k >= 2 and ("isik_pisir" in ln or "export" in ln)
            if hl: rrect(c, ed_x + 20, y - 200 + i * 44 - 30, 1080, 40, 6, "#264F78")
            text(c, ln[:int(len(ln) * q)], ed_x + 34, y - 200 + i * 44, "mono", 24, col)
    if k == 2 or (k >= 2 and k < 3):
        for j, (ic, s_) in enumerate([("cube", "room_car.glb"), ("film", "isik_haritasi.webp")]):
            q = appear(t, T[2] + .6 + j * .4, .4)
            if q:
                with fx(c, q, x + 640, y - 40 + j * 110, (x + 380, y - 100, x + 900, y + 200)): chip(c, x + 640, y - 40 + j * 110, s_, ic, size=26)
    if k >= 3:
        px = x + 470
        q = appear(t, T[3] + .2, .5)
        if q:
            with fx(c, q, px, y - 80, (px - 420, y - 260, px + 420, y + 100)):
                card(c, px - 400, y - 250, 800, 320, 20, color="#012456", sh=.2)
                text(c, "Windows PowerShell", px - 370, y - 210, "s", 22, "#FFFFFF")
                cmd = '& "blender.exe" -b --python galeri_oda.py -- --mode preview'
                n = int(len(cmd) * prog(t, T[3] + .6, T[3] + 2.6))
                cut = cmd.index(' --python') + 1; lines_ = [cmd[:cut], cmd[cut:]]
                for i, ln in enumerate(lines_):
                    off = 0 if i == 0 else cut; shown = ln[:max(0, n - off)] if n > off else ""
                    text(c, ("PS> " if i == 0 else "    ") + shown, px - 370, y - 150 + i * 42, "mono", 23, "#EEEDF0")
        if k >= 4:
            q = appear(t, T[4] + .2, .45)
            if q:
                with fx(c, q, px, y + 200, (px - 420, y + 100, px + 420, y + 420)):
                    card(c, px - 400, y + 110, 800, 300, 20)
                    u1 = eio(prog(t, T[4] + .4, T[4] + 2.0)); u2 = eio(prog(t, T[4] + 2.2, T[4] + 4.5))
                    text(c, "Önizleme  · 2–5 dk", px - 370, y + 170, "b", 26, INK)
                    rrect(c, px - 370, y + 190, 740, 14, 7, "#E9E4DB"); rrect(c, px - 370, y + 190, 740 * u1, 14, 7, ORANGE)
                    text(c, "Tam pişirme · 15–40 dk", px - 370, y + 260, "b", 26, INK)
                    rrect(c, px - 370, y + 280, 740, 14, 7, "#E9E4DB"); rrect(c, px - 370, y + 280, 740 * u2, 14, 7, "#2BB673")
                    if u2 >= 1: text(c, "room_car.glb hazır ✓", px - 370, y + 360, "s", 26, "#1E8E57")
        if k >= 5:
            q = appear(t, T[5] + .2, .5)
            if q:
                with fx(c, q, x, y + 60, (x - 980, y - 320, x + 980, y + 440)):
                    c.drawRect(skia.Rect.MakeXYWH(x - 1000, y - 600, 2000, 1200), paint(BG, .82))
                    bubble(c, x - 760, y - 250, 640, ["Işık fazla sarı,", "zemin fazla parlak."], "user", size=30)
                    bubble(c, x - 760, y - 60, 640, ["Betiği güncelledim,", "tekrar çalıştır. ✓"], "ai", size=30)
                    card(c, x - 60, y - 250, 420, 240, 18); draw_img(c, P("c_duv_00.jpg"), x - 52, y - 242, 404, 224, 12, maxw=600)
                    card(c, x + 420, y - 250, 420, 240, 18); draw_img(c, P("c_duv_01.jpg"), x + 428, y - 242, 404, 224, 12, maxw=600)
                    grow(c, [(x + 365, y - 130), (x + 415, y - 130)], eout(prog(t, T[5] + .8, T[5] + 1.2)), ORANGE, 5)
                    text(c, "Önce", x + 150, y + 30, "s", 26, MUTED, align="center"); text(c, "Sonra", x + 630, y + 30, "s", 26, ORANGE_T, align="center")

HOWTO = [("sparkle", "Claude Code'u aç"), ("msg", "Prompt + ilan fotoğrafları"), ("cube", "3D model bul, lisansa bak"), ("bulb", "Blender betiği: ışığı pişir"),
         ("eye", "Ekran görüntüsü al, düzelt"), ("globe", "Netlify'a yükle, link al")]
def sc_howto(c, t, r, x, y, st, b):
    k = param_at(r, t)
    for i, (ic, s_) in enumerate(HOWTO):
        ps = appear(t, r["t0"] + .2 + i * .1, .45)
        if not ps: continue
        yy = y - 280 + i * 118
        with fx(c, ps, x, yy, (x - 560, yy - 56, x + 560, yy + 56)):
            on = i == k - 1; done = i < k - 1
            shadow(c, x - 500, yy - 48, 1000, 96, 48, .14 if on else .06, 18, 8)
            rrect(c, x - 500, yy - 48, 1000, 96, 48, NAVY if on else CARD)
            c.drawCircle(x - 446, yy, 34, paint(ORANGE if on or done else "#E2DDD3"))
            icon(c, "check" if done else ic, x - 446, yy, 34, "#FFFFFF")
            text(c, f"{i + 1}.  {s_}", x - 386, yy + 12, "b", 32, "#FFFFFF" if on else (INK if done else MUTED))

SCENES.update({"clip": sc_clip, "term": sc_term, "howto": sc_howto})


# ===================== TURKISH COFFEE LADY ayarları =====================
CHATS_SR = [("user", ["Sitelerinin linki ve yeni kutu duyurusu ekte.", "Ürünleri, renkleri ve metinleri topla."]),
            ("user", ["Her tat kendi şehrinde, mermer bir", "kaidede dönsün. Fiyat yok, lansman listesi."]),
            ("ai", ["Harika! Önce etiketleri çizelim,", "sonra kutuları 3D yapıp sahnelere koyalım."])]
PIPE = [("msg", "Ayar dosyası", "labels_bold-istanbul.webp"), ("cube", "Etiket + 3D kutu", "cut_silky-mardin.webp"), ("star", "Şehir + kaide", "sahne_minty-cappadocia.webp"), ("globe", "Netlify zip", "1-anasayfa.jpg")]
FLASH = ["sahne_bold-istanbul.webp", "sahne_silky-mardin.webp", "sahne_piney-aegean.webp", "sahne_minty-cappadocia.webp", "sahne_pistachio-zeugma.webp"]
TARGETS = [("coffee", "Kahve"), ("sparkle", "Parfüm"), ("heart", "Kozmetik"), ("gem", "Takı"), ("cake", "Çikolata"), ("bag", "İçecek")]
HOWTO = [("eye", "Yeni ürün duyuran markayı bul"), ("search", "Sitesine bak: lansman sayfası var mı?"), ("cube", "Ürün görsellerini ve çizimleri topla"),
         ("sparkle", "Claude Code + hazır prompt"), ("pencil", "Ekran görüntüsü al, düzelttir"), ("globe", "Netlify'a yükle, link al")]
MAIL = ["Merhaba, yeni buzlu Türk kahvesi serinizi görünce", "bu kutuların hak ettiği lansman sitesini hazırladım.", "",
        "Lansmandan önce 20 dakikalık bir görüntülü", "görüşmede canlı gösterebilir miyim? Sevgiler"]
STEPS = [("search", "Yeni ürünü olan marka"), ("cube", "3D lansman demosu"), ("globe", "Ücretsiz link"), ("mail", "Kişisel e-posta"), ("clock", "Lansmandan önce")]
MONT_SR = [("iced_0.jpg", "şu anki site"), ("iced_1.jpg", "şu anki ürünler"), ("labels_bold-istanbul.webp", "etiket"), ("cut_bold-istanbul.webp", "3D kutu"),
           ("sahne_bold-istanbul.webp", "sahne"), ("1-anasayfa.jpg", "3D site"), ("2-urun-detay.jpg", "hikâye"), ("4-lansman.jpg", "lansman"), ("6-koleksiyon.jpg", "koleksiyon")]
def sc_vs(c, t, r, x, y, st, b):
    A, B_ = gm_clip("eski_iced"), gm_clip("tcl_tour")
    with fx(c, st, x, y + 40, (x - 980, y - 400, x + 980, y + 480)):
        for k, (cl, lab, col) in enumerate(((A, "Şu anki site", NAVY), (B_, "Bizim 3D site", ORANGE))):
            cx = x - 470 + k * 940; w, h = 900, 506
            img = cl.at(t - r["t0"] + (2.0 if k == 0 else 6.0)) if cl is not None else None
            card(c, cx - w / 2 - 10, y + 60 - h / 2 - 10, w + 20, h + 20, 24, sh=.18)
            if img is not None: draw_img_rr(c, img, cx - w / 2, y + 60 - h / 2, w, h, 16)
            ww = tw(lab, "b", 32) + 60
            rrect(c, cx - ww / 2, y + 60 + h / 2 - 10, ww, 64, 32, col); text(c, lab, cx, y + 60 + h / 2 + 33, "b", 32, "#FFFFFF", align="center")
        c.drawCircle(x, y + 60, 54, paint("#FFFFFF")); text(c, "VS", x, y + 78, "b", 44, INK, align="center")
LBL = ["bold-istanbul", "silky-mardin", "piney-aegean", "minty-cappadocia", "pistachio-zeugma"]
def sc_labels(c, t, r, x, y, st, b):
    k = param_at(r, t)
    for i, n in enumerate(LBL):
        ps = appear(t, r["t0"] + .2 + i * .18, .45)
        if not ps: continue
        cx = x - 760 + i * 380
        with fx(c, ps, cx, y + 60, (cx - 200, y - 280, cx + 200, y + 420)):
            if k >= 1:   # kutu
                card(c, cx - 160, y - 230, 320, 560, 22); draw_img(c, P(f"cut_{n}.webp"), cx - 150, y - 220, 300, 540, 14, fit="contain", maxw=600)
            else:        # düz etiket
                card(c, cx - 175, y - 120, 350, 360, 18); draw_img(c, P(f"labels_{n}.webp"), cx - 165, y - 110, 330, 340, 10, fit="contain", maxw=900)
SCENES.update({"vs": sc_vs, "labels": sc_labels})

STEPS7 = [("search", "Markayı araştır"), ("repeat", "Şablondan başla"), ("pencil", "Etiketi çizdir"), ("cube", "3D kutu"), ("star", "Şehir + kaide"), ("globe", "Siteyi kur"), ("eye", "Kontrol ettir"), ("mail", "Yayınla + teklif")]
def sc_howto2(c, t, r, x, y, st, b):
    k = param_at(r, t)
    for i, (ic, s_) in enumerate(STEPS7):
        ps = appear(t, r["t0"] + .05 + i * .05, .35)
        if not ps: continue
        yy = y - 330 + i * 96
        with fx(c, ps, x, yy, (x - 560, yy - 50, x + 560, yy + 50)):
            on = i == k - 1; done = i < k - 1
            sc = 1.06 if on else 1.0
            c.save(); c.translate(x, yy); c.scale(sc, sc); c.translate(-x, -yy)
            shadow(c, x - 470, yy - 42, 940, 84, 42, .16 if on else .05, 18, 8)
            rrect(c, x - 470, yy - 42, 940, 84, 42, NAVY if on else CARD)
            c.drawCircle(x - 420, yy, 30, paint(ORANGE if on or done else "#E2DDD3"))
            icon(c, "check" if done else ic, x - 420, yy, 30, "#FFFFFF")
            text(c, f"{i + 1}.  {s_}", x - 370, yy + 11, "b", 30, "#FFFFFF" if on else (INK if done else MUTED))
            c.restore()
SCENES.update({"howto2": sc_howto2})

# ===================== v3: sohbet, teklif sayfası, üç başlık =====================
HOWTO = [("search", "Yeni ürün duyuran markayı bul"), ("sparkle", "Claude'a markayı araştırt"), ("pencil", "Hazır promptu doldur, görsel ekle"),
         ("eye", "Ekran görüntüsü aldır, düzelttir"), ("globe", "Netlify'a yükle, link al"), ("mail", "Kişisel mail + link")]
TARGETS = [("coffee", "Kahve"), ("sparkle", "Parfüm"), ("heart", "Kozmetik"), ("gem", "Takı"), ("cake", "Çikolata"), ("bag", "İçecek")]
BUGS.update({10: ("x", "Cam şişe", "Gerçek ürün: 250 ml ince alüminyum kutu", "r"), 11: ("check", "İnce kutu", "Duyurudaki fotoğrafı attım, tek mesajda düzeldi", "g")})
MONT_SR = [("1-anasayfa.jpg", "araştır"), ("ilk_surum.jpg", "şablon"), ("labels_bold-istanbul.webp", "etiket"), ("cut_bold-istanbul.webp", "3D kutu"),
           ("sahne_bold-istanbul.webp", "şehir + kaide"), ("2-urun-detay.jpg", "site"), ("3-telefon.jpg", "kontrol"), ("6-koleksiyon.jpg", "yayın"), ("teklif_p3.jpg", "teklif")]
TALKS = {
 9: [("user", ["Bu kahve markasına 3D bir", "lansman sitesi yapalım."]), ("ai", ["Harika! Önce markayı araştırayım."])],
 0: [("user", ["Turkish Coffee Lady'nin sitelerine ve", "Instagram'ına bak. Yeni ne var?"]),
     ("ai", ["1 Ekim'de buzlu Türk kahvesi serisini", "duyurmuşlar: 5 şehir, 5 tat, 250 ml kutu.", "Aralık'ta ABD'de satışa çıkıyor.", "Sitelerinde lansman sayfası yok."]),
     ("user", ["Süper. Bu kutular için bir", "lansman sitesi yapalım."])],
 1: [("user", ["Önceki soğuk kahve demomuzu şablon al,", "bu markaya uyarla."]),
     ("ai", ["İlk sürüm hazır: cam şişe, etiket,", "beş tat sahnesi."]),
     ("user", ["Ürün şişe değil! 250 ml ince kutu.", "Duyurudaki fotoğrafı ekledim."]),
     ("ai", ["Haklısın. İnce alüminyum kutu, açma", "halkası ve etiketle yeniden kurdum."])],
 2: [("user", ["Duyurudaki kutu tasarımını yeniden çiz.", "Şehirleri paketlerdeki çizimlerden al."]),
     ("ai", ["Etiketi düz açılım olarak çiziyorum:", "slogan, logo, tat adı, nazar, şehir."]),
     ("user", ["Arka yüz de olsun: şehrin hikâyesi", "ve tat profili."])],
 3: [("user", ["Her kutu kendi şehrinin önünde,", "premium bir kaidede dursun."]),
     ("ai", ["Şehir çizimi krem kâğıtta, kenarlar", "karanlık, kaidenin arkasında sıcak ışık."]),
     ("user", ["Kaide basit duruyor. Daha pahalı olsun."]),
     ("ai", ["Yivli mermer, pirinç başlık, tadın", "renginde halka, etrafta kahve çekirdeği."])],
 4: [("user", ["Kaydırınca kutular sırayla gelsin.", "Tıklayınca dönsün, hikâyesi açılsın."]),
     ("user", ["3 soruluk tat bulucu ekle. Fiyat yerine", "\"Lansman listesine katıl\" koy. EN + TR."]),
     ("ai", ["Tamam. Lansman bölümünü de ekliyorum:", "Aralık, 500 yıllık miras, belgesel."])],
 5: [("user", ["Her değişiklikten sonra masaüstü ve", "telefonda ekran görüntüsü al, kontrol et."]),
     ("ai", ["Telefonda tat bulucunun kenar boşluğu", "bozuk. Düzelttim, tekrar kontrol ettim."])],
 6: [("user", ["Markaya kısa bir mail yaz. Bir de 3", "paketli bir teklif dosyası hazırla."]),
     ("ai", ["Mail hazır: Türkçe ve İngilizce.", "Teklif: 3 paket, ek hizmetler, takvim,", "ödeme planı. PDF olarak verdim."])],
}
def talk_shown_before(conv, m, t0):
    return any(bb["t"] < t0 - .01 and bb["vis"][0] == "talk" and bb["vis"][1] == conv and bb["vis"][2] > m for bb in BEATS)
def sc_talk(c, t, r, x, y, st, b):
    conv = r["beats"][0]["vis"][1]
    for bb in r["beats"]:
        if t >= bb["t"] - .05: conv = bb["vis"][1]
    msgs = TALKS[conv]
    T, D = [], []
    end_prev = -9
    for m, (who, lines_) in enumerate(msgs):
        if talk_shown_before(conv, m, r["t0"]): T.append(r["t0"] - 5); D.append(0); continue
        ts = next((bb["t"] for bb in r["beats"] if bb["vis"][1] == conv and bb["vis"][2] > m), None)
        if ts is None: T.append(None); D.append(0); continue
        st0 = max(ts + .15, end_prev + .45)
        d = min(2.0, sum(map(len, lines_)) * .026) if who == "user" else .85
        T.append(st0); D.append(d); end_prev = st0 + d
    w, h = 1320, 780; wx, wy = x - w / 2, y - 350
    with fx(c, st, x, y + 40, (wx - 20, wy - 20, wx + w + 20, wy + h + 20)):
        card(c, wx, wy, w, h, 30, sh=.14)
        c.drawCircle(wx + 54, wy + 48, 20, paint(ORANGE)); icon(c, "sparkle", wx + 54, wy + 48, 24)
        text(c, "Claude", wx + 88, wy + 58, "b", 28, INK); text(c, "ile sohbet", wx + 88 + tw("Claude", "b", 28) + 10, wy + 58, "m", 26, MUTED)
        c.drawLine(wx, wy + 96, wx + w, wy + 96, paint("#EFEBE4", 1, 2, cap=False))
    size = 30; lh = size * 1.42
    top, bot = wy + 122, wy + h - 28
    hs = [len(l) * lh + 46 for _, l in msgs]
    tot = 0
    for m in range(len(msgs)):
        if T[m] is not None and t >= T[m]: tot += (hs[m] + 22) * eio(prog(t, T[m], T[m] + .35))
    scroll = max(0, tot - (bot - top))
    c.save(); c.clipRect(skia.Rect.MakeLTRB(wx, top - 8, wx + w, bot + 4))
    yy = top - scroll
    for m, (who, lines_) in enumerate(msgs):
        if T[m] is None or t < T[m]: continue
        ps = appear(t, T[m], .4, rise=18)
        if not ps: yy += hs[m] + 22; continue
        bw = max(tw(s_, "s" if who == "user" else "m", size) for s_ in lines_) + 64
        if who == "user":
            bx = wx + w - bw - 40
            full = " / ".join(lines_); n = int(len(full) * prog(t, T[m] + .1, T[m] + .1 + D[m]))
            typed = full[:n].split(" / ")
            with fx(c, ps, bx + bw / 2, yy + 40, (bx, yy, bx + bw, yy + hs[m])):
                rrect(c, bx, yy, bw, hs[m], 26, NAVY)
                for k2, s_ in enumerate(typed): text(c, s_, bx + 32, yy + 23 + size * .95 + k2 * lh, "s", size, "#FFFFFF")
        else:
            bx = wx + 96
            with fx(c, ps, bx + bw / 2, yy + 40, (wx, yy, bx + bw, yy + hs[m])):
                c.drawCircle(wx + 58, yy + 30, 20, paint(ORANGE)); icon(c, "sparkle", wx + 58, yy + 30, 22)
                if t < T[m] + D[m]:
                    rrect(c, bx, yy, 130, 64, 26, "#F2EEE7")
                    for j in range(3):
                        a_ = .35 + .65 * (.5 + .5 * math.sin((t - T[m]) * 9 - j * 1.1))
                        c.drawCircle(bx + 40 + j * 25, yy + 32, 7, paint(MUTED, a_))
                else:
                    q = eio(prog(t, T[m] + D[m], T[m] + D[m] + .3))
                    rrect(c, bx, yy, bw, hs[m], 26, "#F2EEE7")
                    for k2, s_ in enumerate(lines_): text(c, s_, bx + 32, yy + 23 + size * .95 + k2 * lh, "m", size, INK, q)
        yy += hs[m] + 22
    c.restore()

DOCS = {"teklif_p3.jpg": [(0, 0, 909, 1287), (70, 228, 256, 524), (326, 220, 258, 534), (585, 228, 256, 524), (62, 762, 786, 246)],
        "teklif_p4.jpg": [(0, 0, 909, 1287), (60, 176, 790, 150), (452, 330, 400, 410)]}
def sc_doc(c, t, r, x, y, st, b):
    name = r["key"][2]; R = DOCS[name]
    cur = prev = r["beats"][0]["vis"][2] if len(r["beats"][0]["vis"]) > 2 else 0; tc = r["t0"]
    for bb in r["beats"]:
        v = bb["vis"][2] if len(bb["vis"]) > 2 else 0
        if t >= bb["t"] - .05 and v != cur: prev, cur, tc = cur, v, bb["t"]
    u = eio(prog(t, tc, tc + .8))
    def view(i):
        rx, ry, rw, rh = R[i]; sc_ = min(1500 / rw, 740 / rh); return sc_, rx + rw / 2, ry + rh / 2
    s0, cx0, cy0 = view(prev); s1, cx1, cy1 = view(cur)
    sc_ = math.exp(lerp(math.log(s0), math.log(s1), u)); cx_, cy_ = lerp(cx0, cx1, u), lerp(cy0, cy1, u)
    fw, fh = 1700, 820; fx0, fy0 = x - fw / 2, y + 90 - fh / 2
    with fx(c, st, x, y + 90, (fx0 - 20, fy0 - 20, fx0 + fw + 20, fy0 + fh + 20)):
        card(c, fx0, fy0, fw, fh, 28, color="#E9E5DD", sh=.16)
        c.save(); c.clipRRect(skia.RRect.MakeRectXY(skia.Rect.MakeXYWH(fx0, fy0, fw, fh), 28, 28), True)
        pw, ph = 909 * sc_, 1287 * sc_; px, py = x - cx_ * sc_, y + 90 - cy_ * sc_
        shadow(c, px, py, pw, ph, 6, .25, 30, 12)
        draw_img(c, P(name), px, py, pw, ph, 4, maxw=1700)
        c.restore()

def sc_three(c, t, r, x, y, st, b):
    items = [("cube", "Nasıl yaptım"), ("sparkle", "Sen nasıl yaparsın"), ("tag", "Nasıl para kazanılır")]
    ws = b["words"] if "words" in b else []
    for k, (ic, s_) in enumerate(items):
        tk = r["t0"] + .4 + k * 1.3
        node(c, t, tk, x - 560 + k * 560, y + 20, 92, ic, ORANGE if k != 1 else NAVY, s_, lsize=34)

SCENES.update({"talk": sc_talk, "doc": sc_doc, "three": sc_three})

# ===================== v4: liste ve soru-cevap =====================
LISTS = {
 "tips": ("Claude ile 7 ipucu", [("eye", "Görsel ver, tarif etme"), ("pencil", "Tek mesajda tek iş iste"), ("repeat", "Beğenmediğini net söyle"),
          ("phone", "Telefonda da kontrol ettir"), ("cube", "İyi işi şablon yap"), ("star", "Küçük başla"), ("search", "Örnek göster")]),
 "where": ("Markaları nerede bulursun?", [("search", "Instagram'da yeni seri duyuranlar"), ("store", "Fuarlara katılan markalar"), ("bag", "Kendi mağazası olan küçük markalar")]),
 "extras": ("Ek işler", [("star", "Yeni ürün ekleme"), ("film", "Ürün videosu (sosyal medya)"), ("globe", "Yeni dil"), ("bag", "Mağazaya bağlama")]),
 "offer": ("Teklif dosyası", [("pencil", "Neler yapılacak"), ("clock", "Ne kadar sürecek"), ("check", "Nasıl ilerleyeceğiz")]),
 "pay": ("Ödemeyi böl", [("check", "Başlangıçta"), ("eye", "Önizlemede"), ("globe", "Yayında")]),
}
def sc_list(c, t, r, x, y, st, b):
    title, items = LISTS[r["key"][2]]
    k = 0
    for bb in r["beats"]:
        if t >= bb["t"] - .05 and len(bb["vis"]) > 2: k = bb["vis"][2]
    n = len(items); gap = 100 if n > 6 else (112 if n > 4 else 128)
    y0 = y - (n - 1) * gap / 2 + 60
    ps = appear(t, r["t0"] + .05, .4) if n <= 5 else 0
    if ps:
        with fx(c, ps, x, y0 - 120, (x - 600, y0 - 170, x + 600, y0 - 70)):
            text(c, title, x, y0 - 105, "b", 44, INK, align="center")
    for i, (ic, s_) in enumerate(items):
        ps = appear(t, r["t0"] + .2 + i * .12, .4)
        if not ps: continue
        yy = y0 + i * gap
        with fx(c, ps, x, yy, (x - 580, yy - 56, x + 580, yy + 56)):
            on = i == k - 1; done = 0 < k and i < k - 1
            sc_ = 1.05 if on else 1.0
            c.save(); c.translate(x, yy); c.scale(sc_, sc_); c.translate(-x, -yy)
            shadow(c, x - 520, yy - 46, 1040, 92, 46, .16 if on else .06, 18, 8)
            rrect(c, x - 520, yy - 46, 1040, 92, 46, NAVY if on else CARD)
            c.drawCircle(x - 466, yy, 32, paint(ORANGE if (on or done or k == 0) else "#E2DDD3"))
            icon(c, "check" if done else ic, x - 466, yy, 32, "#FFFFFF")
            text(c, s_, x - 410, yy + 12, "b", 34, "#FFFFFF" if on else (INK if (done or k == 0) else MUTED))
            c.restore()

QAS = [("Kod bilmem gerekiyor mu?", "Hayır. Ne istediğini Türkçe yazman yeterli."),
       ("İngilizce bilmem lazım mı?", "Hayır. Claude iki dilde de yazıyor."),
       ("Ne kadar sürüyor?", "İlk site birkaç gün. Şablonla sonrakiler çok daha hızlı."),
       ("Demo için para lazım mı?", "Hayır. Netlify'ın ücretsiz planı yeterli."),
       ("Telefonda çalışıyor mu?", "Evet. Her değişiklikte telefonda kontrol ettirdik."),
       ("Markanın logosunu kullanabilir miyim?", "Sadece o markaya teklif için, \"konsept demo\" notuyla."),
       ("Kaç markaya yazmalıyım?", "Toplu değil. Haftada birkaç marka, her birine özel demo."),
       ("Claude hata yaparsa?", "Ekran görüntüsünü at, neyin yanlış olduğunu yaz.")]
def sc_qa(c, t, r, x, y, st, b):
    cur = None; tc = r["t0"]
    for bb in r["beats"]:
        if t >= bb["t"] - .05: cur = bb["vis"][1]; tc = bb["t"]
    if cur is None: cur = r["beats"][0]["vis"][1]
    q, a = QAS[cur]
    with fx(c, st, x, y + 60, (x - 820, y - 260, x + 820, y + 400)):
        card(c, x - 800, y - 240, 1600, 600, 34, sh=.14)
        text(c, "SIK SORULANLAR", x - 720, y - 160, "b", 26, ORANGE_T, track=2)
        for j in range(len(QAS)):
            c.drawCircle(x + 700 - (len(QAS) - 1 - j) * 30, y - 170, 8, paint(ORANGE if j <= cur else "#E2DDD3"))
    pq = appear(t, tc + .05, .4, rise=20)
    if pq:
        with fx(c, pq, x, y - 40, (x - 780, y - 120, x + 780, y + 20)):
            c.drawCircle(x - 690, y - 52, 40, paint(NAVY)); text(c, "?", x - 690, y - 36, "b", 48, "#FFFFFF", align="center")
            text(c, q, x - 620, y - 34, "b", 56, INK)
    pa = appear(t, tc + 1.0, .45, rise=20)
    if pa:
        with fx(c, pa, x, y + 150, (x - 780, y + 70, x + 780, y + 230)):
            c.drawCircle(x - 690, y + 140, 40, paint(ORANGE)); icon(c, "check", x - 690, y + 140, 40, "#FFFFFF", sw=3)
            text(c, a, x - 620, y + 156, "m", 44, INK)

SCENES.update({"list": sc_list, "qa": sc_qa})


CLIP_FALLBACK.update({"tcl_tour": "1-anasayfa.jpg", "eski_iced": "iced_0.jpg"})

# ---------- bölüm kartları ----------
def chapter_dip(t):
    v = 0.0
    for chp in CHAPS:
        a = chp["t"]; v = max(v, eio(prog(t, a, a + .35)) * (1 - eio(prog(t, a + .6, a + .95))))
    return v
def chapter_cards(c, t):
    for chp in CHAPS:
        a = chp["t"]
        if a + .5 <= t <= a + 2.9:
            words = [(w, "b", a + .7 + k * .14) for k, w in enumerate(chp["ch"].split())] + [(w, "i", a + 1.05 + k * .2) for k, w in enumerate(chp["it"].split())]
            line(c, t, words, W / 2, H / 2 + 34, 108, t1=a + 2.45)

# ---------- kapanış (kanal sayfası + abone hapı) ----------
THUMBS = ["FINAL_1_laptop_galerilere_sun.jpg", "NET_A_bu_bir_web_sitesi.jpg", "NET_B_galeriler_bunu_istiyor.jpg", "NET_C_oyun_degil.jpg", "/home/user/analiz/video_teslim/M_bana_3d_magaza_yap.jpg", "/home/user/analiz/video_teslim/J_kod_yok_ama_hepsi_var.jpg"]
def channel_page(c, a):
    c.drawRect(skia.Rect.MakeWH(W, H), paint("#0D1020", a))
    p = skia.Paint(); p.setAlphaf(a * .38); p.setImageFilter(skia.ImageFilters.Blur(9, 9)); c.saveLayer(None, p)
    avatar_k(c, 260, 170, 70); text(c, "Karga Zihni", 360, 158, "b", 44, "#F3EFE7"); text(c, "@kargazihni  ·  3D web siteleri, yapay zekâ", 360, 200, "m", 22, "#9AA0B5")
    for i, n in enumerate(THUMBS):
        xx = 190 + (i % 3) * 520; yy = 360 + (i // 3) * 360
        draw_img(c, n if n.startswith("/") else f"{os.environ['AKIS_KANAL']}/yayin/3d-showroom/{n}", xx, yy, 490, 276, 14, maxw=640)
    c.restore()
def outro(c, t):
    s = t - OUT0
    if s < 0: return
    a = eio(prog(s, 0, .5)); channel_page(c, a)
    c.drawRect(skia.Rect.MakeWH(W, H), paint("#05060C", .6 * eio(prog(s, 4.8, 5.4))))
    R, PW = 92, 690; cx, cy = W / 2 - (PW - .8 * R) / 2, H / 2
    c.save(); c.translate(W / 2, H / 2); c.scale(1.4, 1.4); c.translate(-W / 2, -H / 2)
    pop = eback(prog(s, .6, 1.05)); shrink = eio(prog(s, 4.55, 4.95)); gone = eio(prog(s, 4.9, 5.2))
    if pop > 0 and gone < 1:
        pw = PW * eio(prog(s, 1.0, 1.5)) * (1 - shrink)
        if pw > 4:
            hh = 150; x = cx; y = cy - hh / 2
            shadow(c, x, y, pw + R * .2, hh, hh / 2, .5, 30, 14); rrect(c, x, y, pw + R * .2, hh, hh / 2, "#FFFFFF", 1 - gone)
            c.save(); c.clipRect(skia.Rect.MakeXYWH(x, y, pw + R * .2, hh))
            ix = cx + R + 70; liked = s >= 2.32
            c.save(); sl = 1 + .25 * math.sin(math.pi * prog(s, 2.32, 2.62)); c.translate(ix, cy); c.scale(sl, sl); icon(c, "thumb", 0, 0, 52, NAVY, fill=liked, sw=2.2); c.restore()
            c.save(); c.translate(ix + 70, cy + 4); c.scale(1, -1); icon(c, "thumb", 0, 0, 52, "#9AA0B5", sw=2.2); c.restore()
            subbed = s >= 3.02; bx = ix + 140; bw = lerp(214, 264, eio(prog(s, 3.02, 3.35))); bh = 70
            rrect(c, bx, cy - bh / 2, bw, bh, bh / 2, "#E7E3DB" if subbed else ORANGE)
            text(c, "Abone Olundu" if subbed else "Abone Ol", bx + bw / 2, cy + 10, "b", 27, INK if subbed else "#FFFFFF", align="center")
            bellx = bx + bw + 62; rang = s >= 3.72; wig = math.sin((s - 3.72) * 38) * 18 * (1 - prog(s, 3.72, 4.3)) if rang else 0
            c.save(); c.translate(bellx, cy - 22); c.rotate(wig); c.translate(-bellx, -(cy - 22)); icon(c, "bell", bellx, cy, 54, NAVY, fill=rang, sw=2.2); c.restore()
            c.restore()
        rr = R * pop * (1 - .25 * gone)
        if rr > 1:
            g = paint(ORANGE, .5 * (1 - gone)); g.setMaskFilter(skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, 30)); c.drawCircle(cx, cy, rr, g)
            avatar_k(c, cx, cy, rr, 1 - gone); c.drawCircle(cx, cy, rr, paint("#FFFFFF", 1 - gone, 5))
        if pw > 300:
            ix = cx + R + 70; bx = ix + 140
            cursor(c, s, [(1.75, cx + 700, cy + 330), (2.25, ix + 6, cy + 10), (2.75, ix + 6, cy + 10), (2.98, bx + 110, cy + 16), (3.45, bx + 110, cy + 16), (3.70, bx + 300, cy + 16), (4.3, bx + 330, cy + 60)], clicks=[2.30, 3.0, 3.72], t_out=4.4)
    c.restore()
    if s > 5.0:
        line(c, s, [("kuşlar", "b", 5.15), ("seni", "b", 5.35), ("bekliyor,", "b", 5.55), ("uç.", "i", 6.05)], W / 2, H / 2 + 30, 96, color="#F3EFE7", acc=ORANGE)

# ---------- ses efekti işaretleri ----------
SFX = []
for r in REG:
    SFX.append((r["t0"] + .15, "pop", .35))
for chp in CHAPS: SFX.append((chp["t"] + .7, "pop", .45))
SFX += [(OUT0 + .6, "pop", .7), (OUT0 + 2.30, "click", .8), (OUT0 + 2.32, "ding", .3), (OUT0 + 3.0, "click", .8), (OUT0 + 3.05, "ding", .45), (OUT0 + 3.72, "click", .8), (OUT0 + 3.75, "bell", .5)]

# ---------- kare ----------

# ===================== Tarih kanalı bölümü =====================
STEPS7 = [("search", "Konu ve kaynak"), ("pencil", "Sahnelere böl"), ("map", "Harita verisi"), ("cube", "Gerçek arazi"), ("eye", "Kamera + atmosfer"),
          ("star", "Savaş sahneleri"), ("msg", "Ses + altyazı"), ("film", "Render + yayın")]
TALKS = {
 0: [("user", ["Animasyonlar çok kalitesiz.", "Daha gerçekçi yapmamız lazım."]), ("ai", ["Haklısın. Gerçek yükseklik verisi,", "eğik kamera ve atmosfer ekleyelim."])],
 1: [("user", ["Türkler Anadolu'ya nasıl geldi?", "Bunun animasyonunu yapalım."]), ("ai", ["Önce olay listesini çıkarayım:", "552'den 1176'ya, tarih tarih."])],
 2: [("user", ["Renkler doğal olsun.", "Van Gölü de görünmüyor."]), ("ai", ["Bölgenin gerçek renklerini ekliyorum;", "gölleri düz su yüzeyinden buluyorum."])],
}
LISTS.update({
 "olaylar": ("Olay listesi", [("clock", "552 · Göktürk Kağanlığı"), ("repeat", "840 · Batıya göç"), ("star", "1040 · Dandanakan"), ("star", "1071 · Malazgirt"),
                              ("pin", "1077 · Anadolu Selçuklu"), ("star", "1176 · Miryokefalon")]),
 "ses": ("Ses ve altyazı", [("msg", "Metin"), ("sparkle", "Yapay zekâ seslendirme"), ("pencil", "Kelime kelime altyazı"), ("film", "Kodla üretilen müzik")]),
 "konu": ("Konu nereden bulunur?", [("clock", "Yıl dönümleri"), ("star", "Büyük savaşlar"), ("users", "Kuruluş hikâyeleri"), ("msg", "İzleyici yorumları")]),
 "gelir": ("Gelir yolları", [("film", "Reklam geliri (YouTube şartlarından sonra)"), ("users", "Kanal üyelikleri"), ("star", "Sponsorluklar"), ("pencil", "Animasyon hizmeti")]),
})
HOWTO = [("search", "Niş seç: dönem ya da bölge"), ("book", "Her hafta tek konu, sağlam kaynak"), ("map", "Tek görsel dil: aynı harita stili"),
         ("film", "8–10 dk uzun video + 1 Shorts"), ("star", "Merak uyandıran başlık + haritalı kapak"), ("repeat", "Düzenli yayın")]
BUGS.update({20: ("x", "“19 yaşında tahta çıktı”", "Doğum 1432, tahta çıkış 1451", "r"), 21: ("check", "Düzeltildi: 18 yaşında", "Tartışmalı yerlerde: kaynaklara göre", "g"),
             22: ("x", "Tibet bembeyaz", "Kar her yüksek yerdeydi", "r"), 23: ("check", "Düzeldi", "Kar sadece gerçek zirvelerde", "g"),
             24: ("x", "Hazar'da kare kare desen", "Kaba derinlik verisi", "r"), 25: ("check", "Düzeldi", "Derinlik yumuşatıldı", "g"),
             26: ("x", "Surlar denizin üstünde", "Elle verilen kaba koordinatlar", "r"), 27: ("check", "Surlar kıyıda", "Kıyı çizgisi yükseklik verisinden", "g")})
QAS = [("Kod bilmem gerekiyor mu?", "Hayır. Ne görmek istediğini anlatman yeterli."),
       ("Güçlü bilgisayar lazım mı?", "Hayır. Claude Code bulutta da çalışıyor; render orada yapıldı."),
       ("Bir video ne kadar sürüyor?", "İlk motor bir gün; sonraki konular çok daha hızlı."),
       ("Harita verisi ücretli mi?", "Hayır. Açık ve ücretsiz veriler kullanıldı."),
       ("Ses için neye dikkat etmeliyim?", "Kullandığın servisin ticari kullanım iznine bak."),
       ("Hangi konudan başlamalıyım?", "Bildiğin ve sevdiğin bir dönemden.")]
RULES = [(False, "Seri üretim, birbirinin aynısı videolar"), (True, "Her videoda özgün araştırma ve anlatım"), (True, "Bilgiyi kaynaktan kontrol et"),
         (True, "Gerçekçi yapay içerikte YouTube etiketi"), (True, "Açık veri, telifsiz müzik"), (None, "Kazanç garantisi yok")]
MONT_SR = [("harita_duz.jpg", "ilk deneme"), ("arazi_ham.jpg", "ilk arazi"), ("arazi_iyi.jpg", "doğal renkler"), ("egik.jpg", "eğik kamera"),
           ("egik2.jpg", "atmosfer"), ("savas_eski.jpg", "eski savaş"), ("son_hali.jpg", "son hali"), ("istanbul_arazi.jpg", "İstanbul"), ("fetih_sehir.jpg", "1453")]
CLIP_FALLBACK.update({"turk_malazgirt": "son_hali.jpg", "turk_genel": "egik2.jpg", "fetih_gemiler": "fetih_sehir.jpg", "fetih_saldiri": "fetih_sehir.jpg"})

def sc_three(c, t, r, x, y, st, b):
    items = [("cube", "Nasıl yaptık"), ("film", "Sonucu izle"), ("users", "Kanal nasıl kurulur")]
    for k, (ic, s_) in enumerate(items):
        node(c, t, r["t0"] + .4 + k * 1.3, x - 560 + k * 560, y + 20, 92, ic, ORANGE if k != 1 else NAVY, s_, lsize=34)

def sc_rstats(c, t, r, x, y, st, b):
    items = [("18.000", "kare"), ("5", "arazi katmanı"), ("1", "komut"), ("0", "hazır görsel")]
    for k, (n, s_) in enumerate(items):
        ps = appear(t, r["t0"] + .3 + k * .45, .5, r["t1"])
        if not ps: continue
        cx = x - 690 + k * 460
        with fx(c, ps, cx, y + 60, (cx - 210, y - 160, cx + 210, y + 280)):
            card(c, cx - 200, y - 140, 400, 400, 30)
            text(c, n, cx, y + 90, "b", 140 if len(n) < 4 else 96, ORANGE if k % 2 == 0 else NAVY, align="center")
            text(c, s_, cx, y + 180, "s", 30, MUTED, align="center")

CODE_T = ['("Hikâye Moğolistan bozkırlarında başlıyor.",', '  ("map", "asya", "+city:otuken")),', '',
          '("552\'de Bumin Kağan Göktürk Kağanlığı\'nı kurdu.",', '  ("map", "asya", "+emp:gokturk", "year:552")),', '',
          '("Anadolu yüzyıllardır Bizans\'ın toprağıydı.",', '  ("map", "anadolu", "+emp:bizans")),', '',
          '("26 Ağustos 1071. İki ordu karşılaştı.",', '  ("battle", 0)),']
def sc_editor(c, t, r, x, y, st, b):
    k = param_at(r, t)
    ex = x - 860 if k >= 3 else x - 640
    with fx(c, st, ex + 560, y + 60, (ex - 20, y - 300, ex + 1140, y + 430)):
        card(c, ex, y - 280, 1120, 690, 22, color="#1E1E1E", sh=.2)
        text(c, "script.py", ex + 30, y - 240, "mono", 22, "#9CDCFE")
        for i, ln in enumerate(CODE_T):
            q = prog(t, r["t0"] + .3 + i * .25, r["t0"] + .55 + i * .25)
            if q <= 0: continue
            col = "#CE9178" if ln.startswith('("') else "#D4D4D4"
            if k >= 2 and ("anadolu" in ln or "Bizans" in ln): rrect(c, ex + 20, y - 200 + i * 52 - 32, 1080, 44, 6, "#264F78")
            text(c, ln[:int(len(ln) * q)], ex + 34, y - 200 + i * 52, "mono", 24, col)
    if k >= 3:
        t3 = first_t(r, lambda v: v is not None and v >= 3); q = appear(t, t3 + .2, .5)
        if q:
            with fx(c, q, x + 520, y + 60, (x + 60, y - 200, x + 980, y + 320)):
                card(c, x + 80, y - 170, 880, 500, 20, sh=.2); draw_img(c, P("son_hali.jpg"), x + 92, y - 158, 856, 476, 12, maxw=1000)
SCENES.update({"three": sc_three, "rstats": sc_rstats, "editor": sc_editor})


# ===================== v2: Kanalımızı yapay zekâya devrettik =====================
STEPS7 = [("search", "Konu + kaynak"), ("pencil", "Sahneler"), ("map", "Harita"), ("cube", "Gerçek arazi"), ("eye", "Kamera + hareket"), ("msg", "Ses + kurgu")]
TALKS = {
 0: [("user", ["Bu tarih kanalını sana devrediyorum."]), ("ai", ["Tamam. Konu, metin, harita ve video benden;", "son kontrol ve yükleme senden."])],
 1: [("user", ["Her pazartesi ve perşembe", "bir tarih animasyonu hazırla."]), ("ai", ["Akışı kurdum: konu, metin, kaynak,", "animasyon, video. Hepsini hafızaya yazdım."])],
}
LISTS.update({
 "hafta": ("Haftalık akış", [("sparkle", "Pzt / Per: Claude videoyu hazırlar"), ("eye", "Sen kontrol edersin"), ("star", "Başlık + kapak seç, yükle"), ("msg", "Yorumlardan sıradaki konu")]),
 "ucretsiz": ("Ne kadar tutar?", [("map", "Harita verisi · ücretsiz"), ("cube", "Yükseklik verisi · ücretsiz"), ("film", "Kodla müzik · ücretsiz"),
                                  ("sparkle", "Claude · ücretsiz başla, düzenli üretim ücretli"), ("msg", "Ses · ücretsiz katman, lisansa bak")]),
 "buyume": ("Kanal nasıl büyür?", [("star", "Merak uyandıran başlık"), ("map", "Haritalı, tek tip kapak"), ("film", "Her videodan 1 Shorts"),
                                   ("clock", "Yıl dönümü takvimi"), ("msg", "Yorumlardan konu"), ("eye", "İstatistiğe bak")]),
})
HOWTO = [("search", "Niş seç"), ("star", "İsim + tek görsel dil"), ("film", "Uzun video + Shorts"), ("clock", "Haftada 2 video")]
QAS = [("Kod bilmem gerekiyor mu?", "Hayır. Ne görmek istediğini anlatman yeterli."),
       ("Güçlü bilgisayar lazım mı?", "Hayır. Claude Code bulutta da çalışıyor."),
       ("Bir video ne kadar sürüyor?", "İlk motor bir gün; sonraki konular çok daha hızlı."),
       ("Yüzümü göstermem gerekiyor mu?", "Hayır. Ses ve animasyon yeterli."),
       ("Hangi konudan başlamalıyım?", "Bildiğin ve sevdiğin bir dönemden.")]
PIPE = [("search", "Konu seç", "egik2.jpg"), ("pencil", "Metin + kaynak", "harita_duz.jpg"), ("map", "Animasyon", "son_hali.jpg"), ("film", "Video + Shorts", "fetih_sehir.jpg")]
def sc_rstats(c, t, r, x, y, st, b):
    items = [("2", "uzun video / hafta"), ("2", "Shorts / hafta"), ("0", "hazır görsel"), ("8–10", "dakika")]
    for k, (n, s_) in enumerate(items):
        ps = appear(t, r["t0"] + .3 + k * .45, .5, r["t1"])
        if not ps: continue
        cx = x - 690 + k * 460
        with fx(c, ps, cx, y + 60, (cx - 210, y - 160, cx + 210, y + 280)):
            card(c, cx - 200, y - 140, 400, 400, 30)
            text(c, n, cx, y + 90, "b", 140 if len(n) < 4 else 96, ORANGE if k % 2 == 0 else NAVY, align="center")
            text(c, s_, cx, y + 180, "s", 30, MUTED, align="center")
def sc_three(c, t, r, x, y, st, b):
    items = [("users", "Kanalı aç"), ("cube", "Animasyonu yap"), ("star", "Kanalı büyüt")]
    for k, (ic, s_) in enumerate(items):
        node(c, t, r["t0"] + .4 + k * 1.6, x - 560 + k * 560, y + 20, 92, ic, ORANGE if k != 1 else NAVY, s_, lsize=34)
SCENES.update({"three": sc_three, "rstats": sc_rstats})


# ----- v2 ekler -----
TALKS[2] = [("user", ["Şu konuyu haritalı bir animasyonla anlat.", "Önce olay listesini çıkar, sonra sahneleri öner."]),
            ("ai", ["Olay listesi hazır, tarihleri kontrol ettim.", "Sahne planı: bozkır, göç, savaş, fetih."])]
LISTS.update({
 "hafiza": ("Kanalın hafıza dosyası", [("msg", "Ton: samimi, net"), ("clock", "Süre: 8–10 dk"), ("map", "Harita ve renk stili"), ("book", "Kaynak kontrolü"), ("check", "Yapılan konular")]),
 "takvim": ("Yıl dönümü takvimi", [("star", "18 Mart · Çanakkale"), ("star", "29 Mayıs · İstanbul'un Fethi"), ("star", "26 Ağustos · Malazgirt"),
                                   ("star", "30 Ağustos · Zafer"), ("star", "29 Ekim · Cumhuriyet")]),
 "plan": ("İlk 10 video", [("check", "Türkler Anadolu'ya nasıl geldi?"), ("check", "İstanbul'un Fethi"), ("star", "Malazgirt: adım adım"), ("star", "Osmanlı'nın kuruluşu"),
                           ("star", "Çanakkale"), ("star", "Kurtuluş Savaşı"), ("star", "…ve izleyicinin seçtikleri")]),
 "hata": ("Sık yapılan hatalar", [("x", "Kaynağı kontrol etmemek"), ("x", "Her videoda farklı tarz"), ("x", "Düzensiz yayın"), ("x", "Uzun, boş giriş"), ("x", "Telifli müzik")]),
})
QAS += [("Videolar ne kadar uzun olmalı?", "Konuya göre; bizim formatımız 8–10 dakika."), ("Kaç videoda büyür?", "Kimse sayı veremez; büyüten süreklilik.")]


LISTS.update({
 "format": ("Format fikirleri", [("star", "Harita üzerinde bir savaş"), ("map", "Bir devletin doğuşu ve yayılışı"), ("pin", "Bir şehrin bin yılı"), ("clock", "Tarihte bugün")]),
 "otuz": ("İlk 30 gün", [("check", "1. hafta: kanal + 2 video"), ("film", "2. hafta: 2 video + Shorts"), ("eye", "3. hafta: istatistiğe bak"), ("msg", "4. hafta: izleyicinin konusu")]),
})


LISTS.update({"kaynak": ("Nasıl kontrol edilir?", [("book", "Ansiklopediler"), ("book", "Ders kitapları"), ("search", "Akademik kaynaklar"), ("check", "En az iki kaynak")])})
QAS += [("Yapay zekâ içerik yasak mı?", "Hayır; ama özgün, emekli ve doğru içerik şart.")]

class Renderer:
    def __init__(self):
        K.GRAIN = make_grain() if hasattr(K, "make_grain") else None
        self.grain = K.GRAIN
        self.s = skia.Surface.MakeRaster(skia.ImageInfo.Make(W, H, skia.ColorType.kRGBA_8888_ColorType, skia.AlphaType.kPremul_AlphaType))
    def frame(self, f):
        t = f / FPS; c = self.s.getCanvas()
        cam = camera(t); cam0 = camera(t - 1 / FPS)
        bg(c, cam, t)
        c.save(); c.translate(W / 2, H / 2); c.scale(cam[2], cam[2]); c.translate(-cam[0], -cam[1])
        for r in REG:
            if r["t0"] - .4 <= t <= r["t1"] + .7 and (r["x"] - 5200 < cam[0] < r["x"] + 5200 + (len(TLIMG) * TLX if r["type"] == "tl" else 0)) and abs(r["y"] - cam[1]) < 2500:
                draw_region(c, t, r)
        c.restore()
        vx = abs(cam[0] - cam0[0]) * cam[2] * (60 / FPS); vy = abs(cam[1] - cam0[1]) * cam[2] * (60 / FPS)
        sx, sy = vx * .45, vy * .45
        if sx > .6 or sy > .6:
            snap = self.s.makeImageSnapshot(); p = skia.Paint(); p.setImageFilter(skia.ImageFilters.Blur(min(sx, 60), min(sy, 60), skia.TileMode.kClamp)); c.drawImage(snap, 0, 0, SAMP, p)
        chapter_cards(c, t)
        d = chapter_dip(t)
        if d > 0: c.drawRect(skia.Rect.MakeWH(W, H), paint("#000000", d))
        outro(c, t)
        if t < .5: c.drawRect(skia.Rect.MakeWH(W, H), paint("#000000", 1 - eio(prog(t, 0, .5))))
        if t > DUR - .45: c.drawRect(skia.Rect.MakeWH(W, H), paint("#000000", eio(prog(t, DUR - .45, DUR - .05))))
        if self.grain: c.drawImageRect(self.grain[f % len(self.grain)], skia.Rect.MakeWH(W, H), skia.SamplingOptions(), skia.Paint())
        return self.s
    def rgba(self, f): return self.frame(f).toarray()

# ---------- ses: anlatım + (isteğe bağlı) sakin müzik + kısık efektler (whoosh/boom yok) ----------
SR = 48000
def build_audio(path, music=True):
    n = int(DUR * SR) + SR
    import wave as wv
    wf = wv.open(f"{V}/tts/voice.wav"); vsr = wf.getframerate(); v = np.frombuffer(wf.readframes(wf.getnframes()), np.int16).astype(np.float32) / 32768
    if vsr != SR: v = np.interp(np.arange(int(len(v) * SR / vsr)) / SR, np.arange(len(v)) / vsr, v).astype(np.float32)
    voice = np.zeros(n, np.float32); voice[:min(n, len(v))] = v[:n] * 1.1
    L = np.zeros(n, np.float32); R = np.zeros(n, np.float32); rng = np.random.default_rng(5)
    def add(sig, t, g=1.0, pan=0.0):
        i = int(t * SR); j = min(n, i + len(sig))
        if j <= i or i < 0: return
        L[i:j] += sig[:j - i] * g * (1 - max(0, pan)); R[i:j] += sig[:j - i] * g * (1 + min(0, pan))
    if music:
        bpm = 88; beat = 60 / bpm; bar = beat * 4
        chords = [(174.61, 220.0, 261.63, 329.63), (220.0, 261.63, 329.63, 392.0), (146.83, 174.61, 220.0, 261.63), (116.54, 146.83, 174.61, 220.0)]
        mus = np.zeros(n, np.float32)
        def put(t0, sig, g=1.0):
            i = int(t0 * SR); j = min(n, i + len(sig))
            if j > i >= 0: mus[i:j] += sig[:j - i] * g
        def pad(fr, d):
            m = int(d * SR); st = np.arange(m) / SR
            s = sum(np.sin(2 * np.pi * f * st + k) + .3 * np.sin(2 * np.pi * f * 2.003 * st) for k, f in enumerate(fr))
            return (s * np.minimum(1, st / .8) * np.minimum(1, (d - st) / .8) * .016).astype(np.float32)
        def pluck(f, d=.6):
            m = int(d * SR); st = np.arange(m) / SR
            return ((np.sin(2 * np.pi * f * st) + .35 * np.sin(4 * np.pi * f * st) * np.exp(-st * 8)) * np.exp(-st * 6) * .045).astype(np.float32)
        for k in range(int(DUR / bar) + 1):
            chd = chords[k % 4]; t0 = k * bar; put(t0, pad(chd, bar + .9))
            seq = [chd[2] * 2, chd[3] * 2, chd[1] * 2, chd[3] * 2, chd[2] * 2, chd[1] * 4, chd[3] * 2, chd[2] * 2]
            for i, fq in enumerate(seq): put(t0 + i * beat / 2, pluck(fq), .9 if i % 2 == 0 else .6)
        env = np.convolve(np.abs(voice), np.ones(int(.3 * SR)) / int(.3 * SR), "same")
        duck = 1 - .6 * np.clip(env / .025, 0, 1); tt = np.arange(n) / SR
        mus *= .85 * duck * np.minimum(1, tt / 1.5) * np.clip((DUR - tt) / 1.2, 0, 1) * (1 + .5 * (tt > OUT0))
        L += mus; R += mus
    def pop():
        m = int(.09 * SR); st = np.arange(m) / SR; return (np.sin(2 * np.pi * (520 + 900 * st / .09) * st) * np.exp(-st * 45) * .3).astype(np.float32)
    def click():
        m = int(.05 * SR); st = np.arange(m) / SR; return ((np.sin(2 * np.pi * 3200 * st) * .5 + rng.normal(0, 1, m) * .4) * np.exp(-st * 160) * .35).astype(np.float32)
    def ding(f=1318.5):
        m = int(.9 * SR); st = np.arange(m) / SR; return ((np.sin(2 * np.pi * f * st) + .4 * np.sin(2 * np.pi * f * 2.01 * st)) * np.exp(-st * 5) * .12).astype(np.float32)
    def bell():
        m = int(1.2 * SR); st = np.arange(m) / SR; return sum(np.sin(2 * np.pi * f * st) * np.exp(-st * d) for f, d in ((1760, 3), (2637, 4), (3520, 6))).astype(np.float32) * .05
    gen = {"pop": pop, "click": click, "ding": ding, "bell": bell}
    for t0, kind, g in SFX: add(gen[kind](), t0, g, (rng.random() - .5) * .3)
    mix = np.stack([L + voice, R + voice], 1); mix = np.tanh(mix * 1.05) * .95
    with wave.open(path, "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((mix * 32767).astype(np.int16).tobytes())
    return path

def render_chunk(args):
    k, f0, f1 = args
    out = f"{OUT}/part_{k:03d}.mp4"
    if os.path.exists(out + ".done"): return out
    rd = Renderer()
    enc = subprocess.Popen(["ffmpeg", "-y", "-v", "error", "-f", "rawvideo", "-pix_fmt", "rgba", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
                            "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p", "-g", str(FPS * 4), out], stdin=subprocess.PIPE)
    for f in range(f0, f1):
        enc.stdin.write(rd.rgba(f).tobytes())
        if (f - f0) % 300 == 0: print(f"parça {k}: {f - f0}/{f1 - f0}", flush=True)
    enc.stdin.close(); enc.wait(); open(out + ".done", "w").write("ok")
    return out

if __name__ == "__main__":
    if MODE == "stills":
        rd = Renderer(); from PIL import Image
        for ts in sys.argv[2:]:
            t = float(ts); Image.fromarray(rd.rgba(int(round(t * FPS)))).convert("RGB").save(f"{OUT}/still_{t:06.1f}.jpg", quality=88); print("ok", t)
    elif MODE == "info":
        print("süre", DUR, "kare", NFR, "bölge", len(REG), "bölüm", len(CHAPS))
        for r in REG: print(round(r["t0"], 1), r["key"])
    elif MODE == "render":
        from multiprocessing import Pool
        nproc = int(sys.argv[2]) if len(sys.argv) > 2 else 4
        n = 48; cuts = [round(i * NFR / n) for i in range(n + 1)]
        jobs = [(i, cuts[i], cuts[i + 1]) for i in range(n)]
        with Pool(nproc) as pool: parts = pool.map(render_chunk, jobs, chunksize=1)
        a1 = build_audio(f"{OUT}/ses_muzikli.wav"); a2 = build_audio(f"{OUT}/ses_muziksiz.wav", music=False)
        lst = f"{OUT}/list.txt"; open(lst, "w").write("".join(f"file '{p}'\n" for p in parts))
        final = f"{OUT}/TarihKanali.mp4"
        for wavp, fn in ((a1, final), (a2, final.replace(".mp4", "_muziksiz.mp4"))):
            subprocess.run(["ffmpeg", "-y", "-v", "error", "-f", "concat", "-safe", "0", "-i", lst, "-i", wavp, "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-c:a", "aac", "-b:a", "224k", "-shortest", "-movflags", "+faststart", fn], check=True)
        print(final)
