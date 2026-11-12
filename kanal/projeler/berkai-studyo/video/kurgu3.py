# BerkAİ ofis videosu v3 — HeyGen avatar (4 parça) + klon ses (12 parça), 8–9 dk, sade/premium kurgu
import json, os, re, glob, subprocess, wave, difflib
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

SP = "/tmp/claude-0/-home-user-analiz/15f5e81a-2f5a-535e-8b53-dec004b93200/scratchpad"
D = f"{SP}/heygen"; V = f"{SP}/sirket_video"; PRJ = "/home/user/analiz/kanal/projeler/berkai-studyo"
W, H, FPS = 1920, 1080, 30
ORANGE = (242, 140, 40); CREAM = (247, 243, 234); MUTED = (190, 180, 168); INK2 = (18, 15, 13)
FD = "/usr/share/fonts/opentype/inter/"
IB, IBo, IM, ISB = FD + "Inter-Black.otf", FD + "Inter-Bold.otf", FD + "Inter-Medium.otf", FD + "Inter-SemiBold.otf"
_fc = {}
def F(p, s):
    if (p, s) not in _fc: _fc[(p, s)] = ImageFont.truetype(p, s)
    return _fc[(p, s)]
def sh(c): subprocess.run(c, shell=True, check=True)
def dur(p): return float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", p]))
def ease(p): p = max(0, min(1, p)); return 1 - (1 - p) ** 3
def back(p, s=1.6): p = max(0, min(1, p)); return max(.03, 1 + (s + 1) * (p - 1) ** 3 + s * (p - 1) ** 2)

# ---------- parçalar ve zaman çizelgesi ----------
ORDER = [("1", "a01.mp4"), ("2", "s02.wav"), ("3", "s03.wav"), ("4", "s04.wav"), ("5", "s05.wav"), ("6", "a06.mp4"),
         ("7", "s07.wav"), ("7b", "s07b.wav"), ("8", "s08.wav"), ("8x", None), ("9", "s09.wav"), ("9b", "s09b.wav"),
         ("10", "a10.mp4"), ("11", "s11.wav"), ("12", "s12.wav"), ("13", "s13.wav"), ("14", "a14.mp4"), ("son", None)]
GAP = {"1": .35, "2": .7, "3": .5, "4": .6, "5": .5, "6": .4, "7": .6, "7b": .6, "8": .3, "8x": .3, "9": .5, "9b": .6,
       "10": .5, "11": .6, "12": .6, "13": .5, "14": .2}
FIXED = {"8x": 9.0, "son": 6.0}          # sessiz: demo vitrini, bitiş kartı
T0 = 2.4                                 # soğuk açılış: ofise giriş
SEG = {}; t = T0
for k, f in ORDER:
    d_ = FIXED.get(k) or dur(f"{D}/{f}")
    SEG[k] = (t, t + d_); t += d_ + GAP.get(k, 0)
TOTAL = t; N = int(round(TOTAL * FPS))
print("toplam", round(TOTAL, 1), "sn =", round(TOTAL / 60, 2), "dk")

# ---------- kelime zamanları: whisper zamanı + senaryo metni ----------
STT = json.load(open(f"{D}/stt.json")); TXT = json.load(open(f"{D}/metinler.json"))
def norm(s): return re.sub(r"[^\wçğıöşüâî]", "", s.lower().replace("İ", "i").replace("I", "ı"))
def align(k):
    sw = [w for w in TXT[k].split()]; ww = STT[k]
    a = [norm(x) for x in sw]; b = [norm(x["w"]) for x in ww]
    st = [None] * len(sw); en = [None] * len(sw)
    for tag, i1, i2, j1, j2 in difflib.SequenceMatcher(None, a, b, autojunk=False).get_opcodes():
        if tag == "equal":
            for o in range(i2 - i1): st[i1 + o] = ww[j1 + o]["s"]; en[i1 + o] = ww[j1 + o]["e"]
        elif j2 > j1:   # yer değiştirme: aralığı eşit böl
            s0, e0 = ww[j1]["s"], ww[j2 - 1]["e"]; n = i2 - i1
            for o in range(n): st[i1 + o] = s0 + (e0 - s0) * o / max(1, n); en[i1 + o] = s0 + (e0 - s0) * (o + 1) / max(1, n)
    # boşlukları doldur
    last = 0.0
    for i in range(len(sw)):
        if st[i] is None:
            nxt = next((st[j] for j in range(i, len(sw)) if st[j] is not None), last + .3)
            st[i] = last; en[i] = max(last + .05, nxt)
        last = en[i]
    off = SEG[k][0]
    return [{"text": sw[i], "start": st[i] + off, "end": en[i] + off} for i in range(len(sw))]
WORDS = {k: align(k) for k, f in ORDER if k in TXT}
def cue(k, word, n=1, d=0.0):
    c = 0
    for w in WORDS[k]:
        if (w["text"].lower() == word.lower()) if re.search(r"[:;,.]", word) else (norm(w["text"]) == norm(word)):
            c += 1
            if c == n: return w["start"] + d
    raise KeyError((k, word, n))

def lines_of(ws):
    L, cur = [], []
    for w in ws:
        cur.append(w)
        if w["text"].endswith((".", ",", "?", ":", ";")) and len(cur) >= 2 or len(cur) >= 7: L.append(cur); cur = []
    if cur: L.append(cur)
    return L
LINES = [ln for k in WORDS for ln in lines_of(WORDS[k])]

# ---------- kaynak görüntüler ----------
for k, f in ORDER:
    if f and f.endswith(".mp4") and not os.path.exists(f"{D}/{k}_30.mp4"):
        sh(f'ffmpeg -v error -y -i {D}/{f} -vf "scale={W}:{H}:flags=lanczos,fps={FPS}" -an -c:v libx264 -preset veryfast -crf 14 {D}/{k}_30.mp4')
class Reader:
    def __init__(self, path):
        self.p = subprocess.Popen(["ffmpeg", "-v", "error", "-i", path, "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], stdout=subprocess.PIPE); self.last = None
    def next(self):
        b = self.p.stdout.read(W * H * 3)
        if len(b) == W * H * 3: self.last = Image.frombytes("RGB", (W, H), b)
        return self.last

_cache = {}
def img(path):
    if path not in _cache:
        if len(_cache) > 60: _cache.clear()
        _cache[path] = Image.open(path).convert("RGB")
    return _cache[path]
exec(open(f"{V}/blur.py").read())
PANEL = (1020, 150, 1920, 1080)   # ofis turundaki sağ panel: işletme adları
BLUR = BLUR + [(35.5, 42.5, [PANEL]), (45.5, 55.5, [PANEL]), (55.5, 69.5, [(0, 0, 1920, 1080)]), (71.5, 82.5, [PANEL]), (85.5, 100.5, [PANEL])]
REC_BLUR = REC_BLUR + [(40.0, 56.0, [(1000, 230, 1920, 950)])]
def blur_regions(im, regs):
    for (x0, y0, x1, y1) in regs:
        box = im.crop((x0, y0, x1, y1)).resize((max(1, (x1 - x0) // 24), max(1, (y1 - y0) // 24)), Image.BILINEAR).resize((x1 - x0, y1 - y0), Image.BILINEAR).filter(ImageFilter.GaussianBlur(6))
        im.paste(box, (x0, y0))
    return im
TOUR = sorted(glob.glob(f"{V}/ofis/f_*.jpg")); DEMO1 = sorted(glob.glob(f"{V}/demo1/f_*.jpg"))
RECF = sorted(glob.glob(f"{SP}/kullanici_kayit/f/f_*.jpg"))
def tour(ts):
    ts = max(0, min(106.9, ts)); im = img(TOUR[min(len(TOUR) - 1, int(round(ts * 12)))]).copy()
    for a, b, regs in BLUR:
        if a <= ts < b: blur_regions(im, regs)
    return im
def rec(ts):
    ts = max(0, min(95.5, ts)); im = img(RECF[min(len(RECF) - 1, int(round(ts * 30)))]).copy()
    for a, b, regs in REC_BLUR:
        if a <= ts < b: blur_regions(im, regs)
    return im
def demo(ts):
    ts = max(4.0, min(19.0, ts)); return blur_regions(img(DEMO1[min(len(DEMO1) - 1, int(round(ts * 15)))]).copy(), DEMO_BLUR)
def zoom(im, z, cx=.5, cy=.5):
    if abs(z - 1) < 1e-3: return im
    w, h = W / z, H / z; x0 = min(max(0, cx * W - w / 2), W - w); y0 = min(max(0, cy * H - h / 2), H - h)
    return im.crop((int(x0), int(y0), int(x0 + w), int(y0 + h))).resize((W, H), Image.BILINEAR)
def soft(im, r=14, k=.45):
    b = im.filter(ImageFilter.GaussianBlur(r)); return Image.blend(b, Image.new("RGB", (W, H), INK2), k)
def grid():
    if "grid" not in _cache:
        ims = sorted(glob.glob(f"{PRJ}/gunler/2026-11-11/03_musteri/ekran/*_masaustu.jpg"))[:12]
        g = Image.new("RGB", (W, H), (20, 17, 15)); cw, chh = 440, 250; dd = ImageDraw.Draw(g)
        for k, p_ in enumerate(ims):
            im = Image.open(p_).convert("RGB").resize((cw, chh), Image.LANCZOS)
            im = im.resize((cw // 14, chh // 14), Image.BILINEAR).resize((cw, chh), Image.BILINEAR)
            x = 60 + (k % 4) * (cw + 20); y = 60 + (k // 4) * (chh + 70); g.paste(im, (x, y))
            dd.rounded_rectangle((x, y + chh + 8, x + cw, y + chh + 52), radius=10, fill=(40, 34, 30))
            dd.text((x + 16, y + chh + 14), f"İşletme {k + 1} · ölçüldü", font=F(IBo, 24), fill=(235, 225, 210))
        _cache["grid"] = g
    return _cache["grid"].copy()

# ---------- katmanlar ----------
PIP_D = 380
def pip(f, avimg, t, t0, t1):
    size = PIP_D; cx, cy, r = 945, 470, 430
    face = avimg.crop((cx - r, cy - r, cx + r, cy + r)).resize((size, size), Image.LANCZOS)
    if "pm" not in _cache:
        m = Image.new("L", (size * 2, size * 2), 0); ImageDraw.Draw(m).ellipse((0, 0, size * 2 - 1, size * 2 - 1), fill=255); _cache["pm"] = m.resize((size, size), Image.LANCZOS)
    u = min(ease((t - t0) / .3), ease((t1 - t) / .25)); X = 24; Y = int(H - size + (1 - u) * (size + 20))
    s_ = Image.new("RGBA", (W, H), (0, 0, 0, 0)); ImageDraw.Draw(s_).ellipse((X - 6, Y - 6, X + size + 6, Y + size + 6), fill=(0, 0, 0, 110)); f.alpha_composite(s_.filter(ImageFilter.GaussianBlur(14)))
    f.paste(face, (X, Y), _cache["pm"])

def subtitle(f, t, pip_on):
    ln = next((l for l in LINES if l[0]["start"] - .05 <= t <= l[-1]["end"] + .15), None)
    if not ln: return
    s = " ".join(w["text"] for w in ln).rstrip(",;:")
    lay = Image.new("RGBA", (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(lay); fn = F(ISB, 44)
    tw = d.textlength(s, font=fn); xc = W / 2
    if pip_on: xc = max(W / 2, 24 + PIP_D + 50 + tw / 2)
    x, y = xc - tw / 2, 968
    d.text((x + 2, y + 3), s, font=fn, fill=(0, 0, 0, 170)); lay = lay.filter(ImageFilter.GaussianBlur(3)); d = ImageDraw.Draw(lay)
    d.text((x, y), s, font=fn, fill=(255, 255, 255, 255)); f.alpha_composite(lay)

def card(f, t, t0, t1, title, items=(), x=90, y=86, w=660):
    if not (t0 <= t <= t1): return
    a = min(1, (t - t0) / .25, (t1 - t) / .25); dy = int((1 - ease((t - t0) / .3)) * 14)
    vis = [s for s, ti in items if t >= ti]; h = 92 + 56 * len(vis) + (14 if vis else 0)
    lay = Image.new("RGBA", (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(lay)
    d.rounded_rectangle((x, y + dy, x + w, y + dy + h), radius=18, fill=(*INK2, int(222 * a)))
    d.rounded_rectangle((x, y + dy, x + 7, y + dy + h), radius=3, fill=(*ORANGE, int(255 * a)))
    d.text((x + 34, y + dy + 24), title, font=F(IBo, 38), fill=(*CREAM, int(255 * a)))
    for k, s in enumerate(vis):
        yy = y + dy + 98 + k * 56
        d.line([(x + 36, yy + 18), (x + 46, yy + 28), (x + 64, yy + 8)], fill=(*ORANGE, int(255 * a)), width=5)
        d.text((x + 84, yy), s, font=F(IM, 32), fill=(*MUTED, int(255 * a)))
    f.alpha_composite(lay)

def clock_chip(f, t, t0, s, hold=4.5):
    if not (t0 <= t <= t0 + hold): return
    a = min(1, (t - t0) / .25, (t0 + hold - t) / .3)
    lay = Image.new("RGBA", (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(lay); fn = F(ISB, 32)
    tw = d.textlength(s, font=fn); x0, y0 = W - 90 - tw - 70, 86
    d.rounded_rectangle((x0, y0, x0 + tw + 70, y0 + 60), radius=30, fill=(*INK2, int(215 * a)))
    d.ellipse((x0 + 22, y0 + 22, x0 + 38, y0 + 38), fill=(*ORANGE, int(255 * a)))
    d.text((x0 + 50, y0 + 11), s, font=fn, fill=(*CREAM, int(255 * a))); f.alpha_composite(lay)

def paper(f, t, t0, t1, head, rows, box=(470, 110, 1830, 840), type_cps=0, fs=30, lh=44):
    """Krem 'belge' kartı. rows: [(metin, renk_tipi)] ; type_cps>0 ise daktilo."""
    if not (t0 <= t <= t1): return
    a = min(1, (t - t0) / .3, (t1 - t) / .3); x0, y0, x1, y1 = box
    lay = Image.new("RGBA", (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(lay)
    d.rounded_rectangle((x0, y0, x1, y1), radius=22, fill=(*CREAM, int(248 * a)))
    d.text((x0 + 50, y0 + 34), head, font=F(IBo, 30), fill=(*ORANGE, int(255 * a)))
    d.line((x0 + 50, y0 + 88, x1 - 50, y0 + 88), fill=(216, 205, 184, int(255 * a)), width=2)
    chars = int((t - t0) * type_cps) if type_cps else 10 ** 9; y = y0 + 112; fn = F(IM, fs)
    for s, kind in rows:
        col = {"n": (30, 26, 23), "m": (120, 110, 100), "o": ORANGE, "x": (60, 52, 46)}[kind]
        fnt = F(IBo, fs) if kind == "o" else fn
        parts, cur = [], ""
        for wd in s.split():
            if d.textlength(cur + " " + wd, font=fnt) > x1 - x0 - 110: parts.append(cur); cur = wd
            else: cur = (cur + " " + wd).strip()
        parts.append(cur)
        for p_ in parts:
            if chars <= 0: break
            if "■" in p_:   # gizlenen kısım
                d.text((x0 + 50, y), p_[:chars].replace("■", " "), font=fnt, fill=(*col, int(255 * a)))
                pre = p_.split("■")[0]; bx = x0 + 50 + d.textlength(pre, font=fnt); nb = p_.count("■")
                d.rounded_rectangle((bx, y + 4, bx + nb * fs * .55, y + fs + 4), radius=6, fill=(60, 52, 46, int(235 * a)))
            else: d.text((x0 + 50, y), p_[:chars], font=fnt, fill=(*col, int(255 * a)))
            chars -= len(p_); y += lh
        y += 10
        if y > y1 - 50: break
    f.alpha_composite(lay)

def big_list(f, t, t0, t1, title, items, x=560):
    """Ortada büyük numaralı liste (kurallar, adımlar)."""
    if not (t0 <= t <= t1): return
    a = min(1, (t - t0) / .3, (t1 - t) / .3)
    lay = Image.new("RGBA", (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(lay)
    d.text((x, 120), title, font=F(IB, 64), fill=(*CREAM, int(255 * a)))
    gap = 150 if len(items) <= 3 else 128
    for k, (h1, h2, tk) in enumerate(items):
        if t < tk - .05: continue
        p = ease((t - tk) / .3); xx = x + int((1 - p) * 80); y = 250 + k * gap
        d.rounded_rectangle((xx, y, xx + 1220, y + gap - 22), radius=20, fill=(*CREAM, int(245 * a * p)))
        d.rounded_rectangle((xx + 22, y + 20, xx + 100, y + gap - 42), radius=16, fill=(*ORANGE, int(255 * a * p)))
        d.text((xx + 46, y + 22), str(k + 1), font=F(IB, 56), fill=(255, 255, 255, int(255 * a * p)))
        d.text((xx + 128, y + 16), h1, font=F(IB, 44), fill=(30, 26, 23, int(255 * a * p)))
        d.text((xx + 130, y + 70), h2, font=F(IM, 28), fill=(100, 90, 80, int(255 * a * p)))
    f.alpha_composite(lay)

def bars(f, t, t0, t1):
    """Kanalın son 7 videosu (herkese açık izlenmeler, vidIQ 11.11.2026)."""
    if not (t0 <= t <= t1): return
    vals = [("06.11", 435), ("04.11", 582), ("02.11", 309), ("31.10", 986), ("21.10", 231), ("15.10", 328), ("08.10", 525)]
    a = min(1, (t - t0) / .3, (t1 - t) / .3)
    lay = Image.new("RGBA", (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(lay)
    x0, y0, x1, y1 = 820, 150, 1830, 830
    d.rounded_rectangle((x0, y0, x1, y1), radius=22, fill=(*INK2, int(225 * a)))
    d.text((x0 + 44, y0 + 30), "Son 7 video · izlenme", font=F(IBo, 34), fill=(*CREAM, int(255 * a)))
    base = y1 - 90; mh = 430; bw = 96
    ay = base - mh * 485 / 986
    d.line((x0 + 40, ay, x1 - 40, ay), fill=(*ORANGE, int(200 * a)), width=2)
    d.text((x1 - 230, ay - 40), "ortalama 485", font=F(ISB, 26), fill=(*ORANGE, int(255 * a)))
    for k, (lbl, v) in enumerate(vals[::-1]):
        p = ease((t - t0 - .2 - k * .08) / .5); hh = mh * v / 986 * p; x = x0 + 70 + k * 132
        sector = lbl in ("02.11", "21.10")
        d.rounded_rectangle((x, base - hh, x + bw, base), radius=8, fill=((120, 110, 100) if sector else CREAM) + (int(240 * a),))
        if p > .9: d.text((x + bw / 2 - d.textlength(str(v), font=F(IBo, 26)) / 2, base - hh - 36), str(v), font=F(IBo, 26), fill=(*CREAM, int(255 * a)))
        d.text((x + 10, base + 18), lbl, font=F(IM, 24), fill=(*MUTED, int(255 * a)))
    d.text((x0 + 44, y1 - 46 + 4), "gri: başlığı sektör adıyla açılan videolar", font=F(IM, 22), fill=(*MUTED, int(255 * a)))
    f.alpha_composite(lay)

def timeline(f, t, t0, t1, steps):
    if not (t0 <= t <= t1): return
    a = min(1, (t - t0) / .3, (t1 - t) / .3)
    lay = Image.new("RGBA", (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(lay)
    x0, x1, y = 260, 1660, 470
    d.line((x0, y, x1, y), fill=(*CREAM, int(160 * a)), width=4)
    for k, (lab, txt, tk) in enumerate(steps):
        if t < tk - .05: continue
        p = back((t - tk) / .35); x = x0 + k * (x1 - x0) / (len(steps) - 1); r = 22 * p
        d.ellipse((x - r, y - r, x + r, y + r), fill=(*ORANGE, int(255 * a)))
        d.text((x - d.textlength(lab, font=F(IB, 44)) / 2, y - 100), lab, font=F(IB, 44), fill=(*CREAM, int(255 * a)))
        lines = txt.split("\n")
        for j, l in enumerate(lines):
            d.text((x - d.textlength(l, font=F(IM, 28)) / 2, y + 50 + j * 38), l, font=F(IM, 28), fill=(*MUTED, int(255 * a)))
    f.alpha_composite(lay)

def aroll(avimg, z=1.0): return zoom(avimg, z, .49, .40) if z > 1.001 else avimg

# ---------- içerik ----------
PROMPT = [re.sub(r"\*\*|`", "", l.rstrip()) for l in open(f"{PRJ}/PROMPT.md").read().split("\n")[2:] if l.strip()][:9]
KOMUT = [l.rstrip() for l in open(f"{PRJ}/GUNLUK_KOMUT.md").read().split("```")[1].split("\n") if l.strip()]
KOMUT = [l for l in KOMUT if "charming-dirac" not in l][:14]
S = lambda k: SEG[k][0]; E = lambda k: SEG[k][1]

# avatar okuyucuları (sırayla açılır)
AV = {}
def avframe(k, t):
    if k not in AV: AV[k] = [Reader(f"{D}/{k}_30.mp4"), -1]
    r = AV[k]; want = int((t - S(k)) * FPS)
    while r[1] < want: r[0].next(); r[1] += 1
    return r[0].last

# ---------- kare kare ----------
OUTV = f"{D}/video_only3.mp4"
enc = subprocess.Popen(["ffmpeg", "-y", "-v", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
                        "-vf", "eq=contrast=1.03:saturation=1.05:gamma=0.99,colorbalance=rs=0.025:bs=-0.03:rm=0.015:bm=-0.015:rh=0.02:bh=-0.01",
                        "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p", OUTV], stdin=subprocess.PIPE)
PREV = [float(x) for x in os.environ.get("PREV", "").split(",") if x]
def seg_of(t):
    best = None
    for k, _ in ORDER:
        if t >= S(k) - 1e-6: best = k
    return best

for i in range(N):
    t = i / FPS; k = seg_of(t) if t >= T0 else "pre"; pip_on = False; pip_rng = None
    u = t - (S(k) if k != "pre" else 0)
    if PREV and not any(abs(t - x) < .5 / FPS for x in PREV) and t < max(PREV):
        # önizlemede avatar okuyucularını yine de ilerlet
        if k in ("1", "6", "10", "14") and t <= E(k): avframe(k, t)
        continue
    if k == "pre":
        base = tour(u * 1.0)
    elif k == "1":
        av = avframe(k, min(t, E(k) - .01))
        c1, c2 = cue("1", "Akşam"), cue("1", "Ofisi")
        if t < c1 - .1: base = aroll(av, 1.0 if t < S(k) + 4.2 else 1.12)
        elif t < c2 - .1:
            pip_on = True; pip_rng = (c1 - .1, c2 - .1)
            if t < cue("1", "iki") - .1: base = grid() if t >= cue("1", "on", 2) - .1 else tour(8 + t - c1)
            elif t < cue("1", "dört", 2) - .1: base = demo(5 + (t - cue("1", "iki")) * 1.1)
            elif t < cue("1", "müdürün") - .1: base = rec(40.3 + t - cue("1", "dört", 2))
            else: base = tour(84 + t - cue("1", "müdürün"))
        elif t < c2 + 2.2: pip_on = True; pip_rng = (c2 - .1, c2 + 2.2); base = tour(100 + t - c2)
        else: base = aroll(av, 1.12 if t < cue("1", "komutu") else 1.0)
    elif k == "2":
        if t < cue("2", "Altı") - .1: base = soft(tour(20 + u * .3))
        elif t < cue("2", "Sonra") - .1: base = tour(6 + (t - cue("2", "Altı")) * .9)
        elif t < cue("2", "eski") - .1: base = soft(tour(30 + u * .2), 18, .55)
        else: base = rec(2 + (t - cue("2", "eski")) * .8)
    elif k == "3": base = rec(18 + u * .9) if u < 6 else tour(min(40, 0 + (u - 6) * 1.6))
    elif k == "4":
        if u < 6: base = rec(2 + u * .7)
        elif t < cue("4", "Sonra") - .1: base = soft(tour(8 + u * .2), 12, .4)
        elif t < cue("4", "Beş", 2) - .1: base = tour(6 + (t - cue("4", "Sonra")) * .8)
        else: base = rec(25 + (t - cue("4", "Beş", 2)) * .9)
    elif k == "5": base = tour(18 + u * .4) if u < 10 else (rec(25 + (u - 10) * .5) if u < 18 else soft(tour(26 + u * .1), 12, .45))
    elif k == "6": av = avframe(k, min(t, E(k) - .01)); base = aroll(av, 1.0 if u < 5.5 else 1.12)
    elif k == "7":
        if u < 9: base = rec(59.5 + u * .9)
        elif t < cue("7", "Bulduklarından") - .1: base = tour(30 + (u - 9) * .5)
        elif t < cue("7", "Sonra") - .1: base = zoom(grid(), 1.0 + .06 * ease((t - cue("7", "Bulduklarından")) / 18), .5, .45)
        else: base = rec(62 + (t - cue("7", "Sonra")) * .4) if t < cue("7", "ölçemediler") else tour(36 + (t - cue("7", "ölçemediler")) * .3)
    elif k == "7b": base = soft(rec(66 + u * .1), 16, .55)
    elif k == "8":
        if u < 7: base = tour(42 + u)
        elif t < cue("8", "Siteyi") - .1: base = demo(4 + (u - 7) * .6)
        elif t < cue("8", "Seramik") - .1: base = soft(tour(49 + u * .05), 14, .5)
        else: base = soft(tour(44 + (t - cue("8", "Seramik")) * .3), 12, .4)
    elif k == "8x": base = demo(4 + u * 1.6)
    elif k == "9": base = tour(72 + u * .4) if u < 12 else rec(40.3 + (u - 12) * .35)
    elif k == "9b": base = soft(tour(74 + u * .05), 16, .55)
    elif k == "10":
        av = avframe(k, min(t, E(k) - .01))
        if u < 3.2: base = aroll(av, 1.0)
        elif t < cue("10", "Ben") - .1: pip_on = True; pip_rng = (S(k) + 3.1, cue("10", "Ben") - .1); base = rec(76.5 + (u - 3.2) * .9)
        else: base = aroll(av, 1.12)
    elif k == "11": base = tour(84 + u * .6) if u < 8 else soft(tour(88 + u * .05), 16, .55)
    elif k == "12": base = rec(90 + u * .3) if u < 10 else tour(100 + (u - 10) * .8)
    elif k == "13": base = soft(tour(min(106, 60 + u * .4)), 18, .55)
    elif k == "14": av = avframe(k, min(t, E(k) - .01)); base = aroll(av, 1.0 if u < 4.5 else 1.12)
    else: base = soft(tour(min(106.5, 100 + u * .5)), 10, .35)
    f = base.convert("RGBA")

    # ----- üst katmanlar
    if k == "pre": clock_chip(f, t, .3, "08:40", hold=T0 + 1.5)
    if k == "1":
        card(f, t, cue("1", "Akşam") - .1, cue("1", "Ofisi") - .2, "Akşam masamda",
             [("5 video konusu", cue("1", "beş")), ("14 site incelemesi", cue("1", "on", 2)), ("2 tane 3D site", cue("1", "iki")), ("4 mail taslağı", cue("1", "dört", 2)), ("Müdürün raporu", cue("1", "müdürün"))])
    if k == "2":
        clock_chip(f, t, S(k) + .2, "09:10")
        paper(f, t, S(k) + .3, cue("2", "Altı") - .15, "Fable 5.2'ye verilen tek komut", [(p, "n") for p in PROMPT], box=(470, 170, 1830, 900), type_cps=150)
        card(f, t, cue("2", "Altı") - .1, cue("2", "Sonra") - .15, "6 ekip", [("Konu bulan", cue("2", "konu")), ("Videoyu hazırlayan", cue("2", "videoyu")),
             ("Müşteri arayan", cue("2", "müşteri")), ("3D site yapan", cue("2", "3D", 2)), ("Mail yazan", cue("2", "mail")), ("Müdür", cue("2", "müdür"))])
        big_list(f, t, cue("2", "Sonra") - .1, cue("2", "eski") - .15, "3 kural", [("Boş iş yok", "her çıktı gerçekten kullanılacak bir dosya", cue("2", "Bir:")),
                 ("Uydurmak yok", "bulamadığını \"bulunamadı\" diye yaz", cue("2", "İki:")), ("Gönder tuşu bende", "dışarıya hiçbir şey gitmez, mailler taslak", cue("2", "Üç:"))])
        card(f, t, cue("2", "eski") - .1, E(k), "İlk gün verdiklerim", [("Kanalın kuralları", cue("2", "kanalın")), ("Önceki videolarım", cue("2", "önceki")), ("Satış notlarım", cue("2", "satış"))])
    if k == "3":
        card(f, t, S(k) + .3, E(k), "Neden 3D ofis?", [("Masaya yürü, dosya açılsın", cue("3", "Masaya")), ("Demo + indirme bağlantısı", cue("3", "Demo")),
             ("Müdür odasında onay / ret", cue("3", "Müdürün")), ("Ofisi de Fable kodladı", cue("3", "Bu"))])
    if k == "4":
        clock_chip(f, t, S(k) + .2, "11:30")
        card(f, t, S(k) + .3, S(k) + 5.8, "1 · Konu ekibi", [("Kanal verisi + gündem + rakipler", S(k) + 1.2)])
        bars(f, t, S(k) + 6, cue("4", "Sonra") - .15)
        card(f, t, cue("4", "Sonra") - .1, E(k), "Gündem", [("Fable 5.2 yeni çıktı", cue("4", "Feybıl")), ("Küçük kanal da izleniyor", cue("4", "En", 2)),
             ("5 öneri, her biri kanıtlı", cue("4", "Beş", 2)), ("1'ini kendileri eledi", cue("4", "Birini")), ("1 numara: bu video", cue("4", "Şu"))])
    if k == "5":
        card(f, t, S(k) + .3, S(k) + 17.8, "2 · Yapım ekibi", [("213 cümlelik senaryo", cue("5", "iki")), ("3 başlık, açıklama", cue("5", "üç")),
             ("3 kapak fikri, Shorts", cue("5", "kapak")), ("Her bilginin yanında kaynak", cue("5", "senaryodaki"))])
        paper(f, t, cue("5", "Mesela") - .1, E(k), "arastirma_dogrulama.md", [("Fable 5.2'nin hızı (\"%30'a kadar\")", "o"), ("Kaynak: haber sitesi. Resmi duyuru açılamadı.", "m"),
              ("→ Videoda rakam söyleme. Önce doğrula.", "x")], box=(700, 220, 1830, 560))
    if k == "7":
        clock_chip(f, t, S(k) + .2, "14:05")
        card(f, t, S(k) + .3, cue("7", "Bulduklarından") - .15, "3 · Müşteri bulma", [("14 gerçek işletme sitesi", cue("7", "On")), ("Bilgisayar + telefon", cue("7", "hem")),
             ("Hız, taşma, kırık bağlantı", cue("7", "Açılma"))])
        card(f, t, cue("7", "Bulduklarından") - .1, cue("7", "Sonra") - .15, "Bulduklarından", [("5 ürünün 5'i tükenmiş", cue("7", "seramik")), ("Telefonda 5 sn, 270 istek", cue("7", "zeytinyağı")),
             ("Site = logo + \"çok yakında\"", cue("7", "çikolata"))])
        card(f, t, cue("7", "Sonra") - .1, E(k), "Puanlama", [("3 A · 2 B · 2 C", cue("7", "üç")), ("6'sı elendi: siteleri iyi", cue("7", "Altısını")),
             ("1'i ölçülemedi, yazıldı", cue("7", "ölçemediler")), ("Sadece kurumsal iletişim", cue("7", "kurumsal"))])
    if k == "7b":
        cols = [("Öncelik", "A"), ("İşletme", "■■■■■■■■■"), ("Altyapı", "WordPress + WooCommerce"), ("Telefonda ilk görüntü", "5,0 sn"), ("Kırık bağlantı", "0 / 20"),
                ("Neden uygun", "en yavaş site; hasat kampanyası tek afişte"), ("Demo fikri", "yanına hafif bir \"yeni hasat\" sayfası"), ("İletişim", "info@■■■■■■■ (kaynak: alt bilgi)"),
                ("Kural kontrolü", "Geçti: yasaklı değil, ret listesinde yok"), ("Not", "cep telefonları kaydedilmedi; ajans imzası → yanına sayfa")]
        rows = []
        for c, v in cols: rows.append((f"{c}:  {v}", "n"))
        paper(f, t, S(k) + .2, E(k), "aday_tablosu.csv · 1 satır", rows, box=(330, 100, 1590, 900), fs=30, lh=46)
    if k == "8":
        clock_chip(f, t, S(k) + .2, "15:40")
        card(f, t, S(k) + .3, cue("8", "Siteyi") - .15, "4 · 3D site ekibi", [("En iyi 2 aday için demo", cue("8", "En")), ("Tek fotoğraf yok, hepsi kod", cue("8", "İçinde")),
             ("Bilinmeyen ürün adı uydurulmadı", cue("8", "Ürün"))])
        big_list(f, t, cue("8", "Siteyi") - .1, cue("8", "Seramik") - .15, "Test eden çalışan: 8 kontrol",
                 [("Konsol hatası yok · internetsiz çalışıyor", "", cue("8", "konsolda")), ("Telefonda taşma yok · ilk görüntü < 3 sn", "", cue("8", "telefonda")),
                  ("Kırık bağlantı yok · arama motoruna kapalı", "", cue("8", "kırık")), ("\"Bağımsız konsept demo\" notu var", "", cue("8", "altta")),
                  ("16 / 16 geçti", "iki site × 8 kontrol", cue("8", "İki", 2))], x=350)
        card(f, t, cue("8", "Seramik") - .1, E(k), "Yapılmayan", [("El çizimi tabaklar kopyalanmadı", cue("8", "Tabakların")), ("Önce izin mesajı", cue("8", "izinsiz"))])
    if k == "9":
        clock_chip(f, t, S(k) + .2, "17:20")
        card(f, t, S(k) + .3, E(k), "5 · Mail ekibi", [("4 işletme, 4 ayrı mail", S(k) + 1), ("Her biri özel bir gözlemle", cue("9", "her")),
             ("Fiyat yok, garanti yok", cue("9", "Fiyat")), ("\"Bir daha yazmayayım mı?\" satırı", cue("9", "En")), ("0 gönderildi", cue("9", "hiçbiri"))])
    if k == "9b":
        mail = [("Konu: ■■■■■■■ için bir şey hazırladım: çekirdekten tablete, 3D", "o"), ("Merhaba,", "n"),
                ("■■■■■■■'daki söyleşinizi okudum: çekirdeği kendiniz kavurup taş değirmende bir gün öğüttüğünüzü. Sonra sitenize baktım; hâlâ \"çok yakında\" yazıyor.", "n"),
                ("O yolculuğu anlatan küçük bir 3D sayfa hazırladım. [DEMO LİNKİ]", "n"),
                ("Ürün adlarınızı bilmediğim için tablet bölümünü boş bıraktım; orası sizin listenizle dolar.", "n"),
                ("Bakıp ne düşündüğünüzü yazar mısınız?", "n"), ("Bir daha yazmamamı isterseniz \"yazma\" demeniz yeterli.", "m")]
        if t < cue("9b", "Takip") - .1: paper(f, t, S(k) + .2, cue("9b", "Takip") - .15, "TASLAK · gönderilmedi", mail, box=(380, 90, 1540, 900), fs=31, lh=46)
        else:
            timeline(f, t, cue("9b", "Takip") - .1, E(k), [("Gün 0", "ilk mail\n+ demo linki", cue("9b", "Takip")), ("Gün +4", "tek cümle\n+ 15 sn video", cue("9b", "Dördüncü")),
                     ("Gün +7", "son mesaj", cue("9b", "Yedinci")), ("Sonra", "3 ay dokunma", cue("9b", "Cevap"))])
    if k == "10":
        clock_chip(f, t, S(k) + .2, "18:45")
        card(f, t, S(k) + 3.2, cue("10", "Ben") - .15, "6 · Müdürün 5 sorusu", [("Çikolata atölyesine mail?", cue("10", "Çikolata")), ("Zeytinyağı firmasına?", cue("10", "Zeytinyağı")),
             ("Adresi olmayan: 2 hafta bekle?", cue("10", "Adresi")), ("Seramiğe izin mesajı?", cue("10", "Seramik"))])
    if k == "11":
        clock_chip(f, t, S(k) + .2, "Ertesi gün · 08:30")
        card(f, t, S(k) + .3, S(k) + 7.8, "Ertesi sabah", [("Dünkü rapor + kararlarım", cue("11", "Ekip")), ("Onaysız = onaylanmamış", cue("11", "Onaylamadığım"))], w=620)
        paper(f, t, S(k) + 8, E(k), "GUNLUK_KOMUT.md", [(l.lstrip("- "), "o" if l.isupper() or l.endswith(":") or l.startswith(("ÖNCE", "KURALLAR")) else "n") for l in KOMUT], fs=24, lh=34, type_cps=180)
    if k == "12":
        card(f, t, S(k) + .3, E(k), "Sınırlar", [("Hız ölçümü tek seferlik", cue("12", "Hız")), ("Ürün adlarını ben tamamlarım", cue("12", "Demo")),
             ("Sabah komut, akşam onay", cue("12", "sabah")), ("Karar bende", cue("12", "Yapay"))])
    if k == "13":
        clock_chip(f, t, S(k) + .2, "21:00")
        big_list(f, t, S(k) + .2, E(k) + .2, "Kendin kur: 4 adım", [("İşlerini yaz", "her iş bir ekip olsun", cue("13", "Bir:")), ("Dosya iste", "rapor, tablo, taslak; sohbet değil", cue("13", "İki:")),
                 ("Yasakları yaz", "uydurma yok, dışarı gönderme yok, kişisel bilgi yok", cue("13", "Üç:")), ("Kararı sende tut", "müdür sana sorsun", cue("13", "Dört:"))])
    if k == "son":
        kf = ease(u / .6)
        lay = Image.new("RGBA", (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(lay)
        for s, fn, col, y in (("Sıradaki ekibi hangi işe kuralım?", F(IBo, 76), CREAM, 380), ("Yorumlara yaz · komutun tamamı açıklamada", F(IM, 38), ORANGE, 490)):
            tw = d.textlength(s, font=fn); d.text((W / 2 - tw / 2, y), s, font=fn, fill=(*col, int(255 * kf)))
        f.alpha_composite(lay)
        if u > FIXED["son"] - 1.0: f = Image.blend(f.convert("RGB"), Image.new("RGB", (W, H), (0, 0, 0)), min(1, (u - (FIXED["son"] - 1.0)) / 1.0)).convert("RGBA")
    if pip_on and pip_rng: pip(f, avframe(k, t), t, *pip_rng)
    subtitle(f, t, pip_on)
    if PREV:
        f.convert("RGB").save(f"{D}/p3_{t:06.1f}.jpg", quality=82)
        if t >= max(PREV): break
        continue
    enc.stdin.write(f.convert("RGB").tobytes())
enc.stdin.close(); enc.wait()
if PREV: raise SystemExit

# ---------- ses: sadece konuşma (müzik yok) ----------
sr = 48000; n = int(TOTAL * sr); rng = np.random.default_rng(7); voice = np.zeros(n)
for k, f in ORDER:
    if not f: continue
    raw = subprocess.check_output(["ffmpeg", "-v", "error", "-i", f"{D}/{f}", "-af", "highpass=f=70,loudnorm=I=-15:TP=-1.5:LRA=9", "-ac", "1", "-ar", str(sr), "-f", "s16le", "-"])
    v = np.frombuffer(raw, np.int16).astype(np.float64) / 32768; i0 = int(S(k) * sr); voice[i0:i0 + len(v)] += v[:n - i0]
tt = np.arange(n) / sr; mus = np.zeros(n); beat = 60 / 80
chords = [(220.0, 261.63, 329.63, 392.0), (174.61, 220.0, 261.63, 329.63), (196.0, 246.94, 293.66, 349.23), (164.81, 207.65, 246.94, 329.63)]
def keys(fr, L):
    s_ = np.arange(L) / sr; env = np.minimum(1, s_ / .02) * np.exp(-s_ * 1.1); trem = 1 + .15 * np.sin(2 * np.pi * 4.5 * s_)
    return sum((np.sin(2 * np.pi * f_ * s_) + .25 * np.sin(4 * np.pi * f_ * s_)) for f_ in fr) * env * trem * .022
for kk in range(int(TOTAL / (beat * 4)) + 1):
    i0 = int(kk * beat * 4 * sr); L = min(n - i0, int(beat * 4.2 * sr))
    if L <= 0: continue
    mus[i0:i0 + L] += keys(chords[kk % 4], L)
    for j in range(4):
        p0 = i0 + int(j * beat * sr); Lp = min(n - p0, int(.35 * sr))
        if Lp <= 0: continue
        ps = np.arange(Lp) / sr
        if j % 2 == 0: mus[p0:p0 + Lp] += np.sin(2 * np.pi * (50 + 60 * np.exp(-ps * 30)) * ps) * np.exp(-ps * 9) * .16
        else: mus[p0:p0 + Lp] += rng.normal(0, 1, Lp) * np.exp(-ps * 22) * .035
        for h in (0, .5):
            q0 = p0 + int(h * beat * sr); Lq = min(n - q0, int(.05 * sr))
            if Lq > 0: mus[q0:q0 + Lq] += rng.normal(0, 1, Lq) * np.exp(-np.arange(Lq) / sr * 120) * .012
mus += np.convolve(rng.normal(0, 1, n) * (rng.random(n) > .9993), np.ones(30) / 30, "same") * .05
mus = np.convolve(mus, np.ones(6) / 6, "same")
env = np.convolve(np.abs(voice), np.ones(int(.3 * sr)) / int(.3 * sr), "same")
duck = 1 - .6 * np.clip(env / .03, 0, 1)
mus *= duck * .8 * np.minimum(1, tt / 1.0) * np.clip((TOTAL - tt) / 1.5, 0, 1)
mus *= 0  # kullanıcı isteği: müzik yok
mix = voice + mus; mix = mix / max(1, np.abs(mix).max() / .95)
st = (np.stack([mix, mix], 1) * 32767).astype(np.int16)
with wave.open(f"{D}/ses3.wav", "wb") as wf: wf.setnchannels(2); wf.setsampwidth(2); wf.setframerate(sr); wf.writeframes(st.tobytes())
OUT = "/home/user/analiz/video_teslim/BerkAI_Yapay_Zeka_Ofisi_v3.mp4"
sh(f'ffmpeg -v error -y -i {OUTV} -i {D}/ses3.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -shortest -movflags +faststart {OUT}')
# altyazı dosyası (YouTube'a ayrıca yüklenebilir)
def ts(x): h = int(x // 3600); m = int(x % 3600 // 60); s = x % 60; return f"{h:02d}:{m:02d}:{s:06.3f}".replace(".", ",")
with open("/home/user/analiz/video_teslim/BerkAI_Yapay_Zeka_Ofisi_v3.srt", "w") as fs_:
    for j, ln in enumerate(LINES, 1): fs_.write(f"{j}\n{ts(ln[0]['start'])} --> {ts(ln[-1]['end'] + .1)}\n{' '.join(w['text'] for w in ln)}\n\n")
json.dump({k: [round(S(k), 2), round(E(k), 2)] for k, _ in ORDER}, open(f"{D}/segler.json", "w"))
print("ok", OUT, round(TOTAL, 1))
