# BerkAİ ofis videosu v4 — avatar her karede (köşe / tam ekran), kullanıcının ofis kaydı, açık renk Karga Zihni kartları,
# hızlı zoom geçişleri, altyazı yok, müzik yok (yalnızca hafif UI sesleri). Parça parça render: CHUNK=i/n
import json, os, re, glob, subprocess, wave, difflib, math
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

SP = "/tmp/claude-0/-home-user-analiz/15f5e81a-2f5a-535e-8b53-dec004b93200/scratchpad"
V4 = f"{SP}/v4"; AVD = f"{V4}/av"; HG = f"{SP}/heygen"; REC = f"{SP}/kayit2/k.mp4"; OLD = f"{SP}/sirket_video"
PRJ = "/home/user/analiz/kanal/projeler/berkai-studyo"; GUN = f"{PRJ}/gunler/2026-11-11"
W, H, FPS = 1920, 1080, 30
CREAM = (247, 243, 234); NAVY = (27, 34, 64); ORANGE = (242, 140, 40); INK = (18, 15, 13); MUTED = (120, 110, 100); LINE = (222, 213, 196)
FD = "/usr/share/fonts/opentype/inter/"
IB, IBo, IM, ISB = FD + "Inter-Black.otf", FD + "Inter-Bold.otf", FD + "Inter-Medium.otf", FD + "Inter-SemiBold.otf"
_fc = {}
def F(p, s):
    if (p, s) not in _fc: _fc[(p, s)] = ImageFont.truetype(p, s)
    return _fc[(p, s)]
def dur(p): return float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", p]))
def ease(p): p = max(0, min(1, p)); return 1 - (1 - p) ** 3
def eio(p): p = max(0, min(1, p)); return p * p * (3 - 2 * p)

# ---------- zaman çizelgesi ----------
ORDER = ["1", "n1", "2", "3", "4", "n2", "5", "6", "7", "7b", "n3", "8", "8x", "9", "9b", "n4", "10", "11", "12", "n5", "13", "14", "son"]
FIXED = {"8x": 5.0, "son": 5.0}
T0 = 1.6; GAP = .22
SEG = {}; t = T0
for k in ORDER:
    d_ = FIXED.get(k) or dur(f"{AVD}/{k}.mp4")
    SEG[k] = (t, t + d_); t += d_ + (GAP if k not in ("8x",) else .0)
TOTAL = SEG["son"][1]; N = int(round(TOTAL * FPS))
S = lambda k: SEG[k][0]; E = lambda k: SEG[k][1]
HASAV = lambda k: k in SEG and k not in FIXED
print("toplam", round(TOTAL, 1), "sn =", round(TOTAL / 60, 2), "dk")

# ---------- kelime zamanları (yalnızca kart/kesme zamanlaması için; altyazı yok) ----------
STT = json.load(open(f"{HG}/stt.json")); TXT = json.load(open(f"{HG}/metinler.json"))
def norm(s): return re.sub(r"[^\wçğıöşüâî]", "", s.lower().replace("İ", "i").replace("I", "ı"))
def align(k):
    sw = TXT[k].split(); ww = STT[k]; a = [norm(x) for x in sw]; b = [norm(x["w"]) for x in ww]
    st = [None] * len(sw)
    for tag, i1, i2, j1, j2 in difflib.SequenceMatcher(None, a, b, autojunk=False).get_opcodes():
        if tag == "equal":
            for o in range(i2 - i1): st[i1 + o] = ww[j1 + o]["s"]
        elif j2 > j1:
            s0, e0 = ww[j1]["s"], ww[j2 - 1]["e"]
            for o in range(i2 - i1): st[i1 + o] = s0 + (e0 - s0) * o / max(1, i2 - i1)
    last = 0.0
    for i in range(len(sw)):
        if st[i] is None: st[i] = last
        last = st[i]
    return [(sw[i], st[i] + S(k)) for i in range(len(sw))]
WORDS = {k: align(k) for k in ORDER if k in TXT and k in STT}
def c(k, word, n=1, d=-.12):
    cnt = 0
    for w, ts in WORDS.get(k, []):
        ok = (w.lower() == word.lower()) if re.search(r"[:;,.]", word) else (norm(w) == norm(word))
        if ok:
            cnt += 1
            if cnt == n: return ts + d
    print("!! cue yok", k, word, n); return (S(k) + E(k)) / 2

# ---------- okuyucular ----------
class Reader:
    def __init__(self, path, size, rate=FPS): self.path, self.size, self.rate = path, size, rate; self.p = None; self.cur = -9; self.last = None
    def _open(self, ts):
        if self.p: self.p.kill()
        self.p = subprocess.Popen(["ffmpeg", "-v", "error", "-ss", f"{max(0, ts):.3f}", "-i", self.path, "-vf", f"fps={self.rate}", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"],
                                  stdout=subprocess.PIPE, bufsize=10 ** 8)
        self.cur = max(0, ts) - 1 / self.rate
    def get(self, ts):
        if self.p is None or ts < self.cur - .02 or ts > self.cur + .6: self._open(ts)
        n = self.size[0] * self.size[1] * 3
        while self.cur < ts - .5 / self.rate:
            b = self.p.stdout.read(n)
            if len(b) == n: self.last = Image.frombytes("RGB", self.size, b)
            self.cur += 1 / self.rate
            if len(b) < n: break
        return self.last
AVR = {}
def avf(k, t):
    if k not in AVR: AVR[k] = Reader(f"{AVD}/{k}.mp4", (W, H))
    return AVR[k].get(min(t - S(k), E(k) - S(k) - .04))
RECR = Reader(REC, (1920, 812))

# mail adresleri (OCR) — kullanıcı kaydında gizlenecek tek şey
MAILS = {float(k): v for k, v in json.load(open(f"{SP}/kayit2/mails.json")).items()}
MT = sorted(MAILS)
def mail_boxes(ts):
    out = []
    import bisect
    i = bisect.bisect_left(MT, ts - .45)
    while i < len(MT) and MT[i] <= ts + .45:
        out += MAILS[MT[i]]; i += 1
    return out
def pix(im, box):
    x0, y0, x1, y1 = [int(v) for v in box]; x0, y0 = max(0, x0), max(0, y0); x1, y1 = min(im.width, x1), min(im.height, y1)
    if x1 - x0 < 4 or y1 - y0 < 4: return
    r = im.crop((x0, y0, x1, y1)).resize((max(1, (x1 - x0) // 14), max(1, (y1 - y0) // 14)), Image.BILINEAR).resize((x1 - x0, y1 - y0), Image.NEAREST)
    im.paste(r, (x0, y0))

_cache = {}
def soft_of(im, dark=.35):
    s = im.resize((W // 10, H // 10), Image.BILINEAR).filter(ImageFilter.GaussianBlur(3)).resize((W, H), Image.BILINEAR)
    return Image.blend(s, Image.new("RGB", (W, H), INK), dark)
def rounded_mask(w, h, r):
    key = ("m", w, h, r)
    if key not in _cache:
        m = Image.new("L", (w * 2, h * 2), 0); ImageDraw.Draw(m).rounded_rectangle((0, 0, w * 2 - 1, h * 2 - 1), radius=r * 2, fill=255); _cache[key] = m.resize((w, h), Image.LANCZOS)
    return _cache[key]
def window(bg, im, scale=.9, cy=.5, r=20):
    w, h = int(im.width * scale), int(im.height * scale); x, y = (W - w) // 2, int(H * cy - h / 2)
    sh = Image.new("RGBA", (W, H), (0, 0, 0, 0)); ImageDraw.Draw(sh).rounded_rectangle((x + 4, y + 14, x + w + 4, y + h + 18), radius=r, fill=(0, 0, 0, 120))
    out = bg.convert("RGBA"); out.alpha_composite(sh.filter(ImageFilter.GaussianBlur(18)))
    out.paste(im.resize((w, h), Image.BILINEAR), (x, y), rounded_mask(w, h, r)); return out.convert("RGB")
def rec_frame(ts):
    im = RECR.get(ts).copy()
    for b in mail_boxes(ts): pix(im, (b[0] - 10, b[1] - 8, b[2] + 10, b[3] + 8))
    return im
def rec_shot(ts):
    im = rec_frame(ts); return window(soft_of(im), im, .92, .5)
D1 = sorted(glob.glob(f"{OLD}/demo1/f_*.jpg")); D2 = sorted(glob.glob(f"{OLD}/demo2/f_*.jpg"))
def img(p):
    if p not in _cache:
        if len(_cache) > 80: [_cache.pop(k) for k in list(_cache) if isinstance(k, str)][:40]
        _cache[p] = Image.open(p).convert("RGB")
    return _cache[p]
def demo(which, ts):
    L = D1 if which == "d1" else D2; x = max(0, min(len(L) - 1.001, ts * 15)); k = int(x); a = x - k
    return Image.blend(img(L[k]), img(L[min(len(L) - 1, k + 1)]), a)
def zoom(im, z, cx=.5, cy=.5):
    if abs(z - 1) < 1e-3: return im
    w, h = W / z, H / z; x0 = min(max(0, cx * W - w / 2), W - w); y0 = min(max(0, cy * H - h / 2), H - h)
    return im.crop((int(x0), int(y0), int(x0 + w), int(y0 + h))).resize((W, H), Image.BILINEAR)
EK = f"{GUN}/03_musteri/ekran"
def screenshot(name, ts, phone=False):
    key = ("ss", name)
    if key not in _cache:
        im = Image.open(f"{EK}/{name}.jpg").convert("RGB")
        if phone: im = im.crop((0, 0, im.width, min(im.height, int(im.width * 2.0))))
        else: im = im.crop((0, 0, im.width, min(im.height, int(im.width * 0.625))))
        bg = soft_of(im.resize((W, H)), .45)
        sc = (820 / im.height) if phone else (1500 / im.width)
        _cache[key] = window(bg, im.resize((int(im.width * sc), int(im.height * sc)), Image.LANCZOS), 1.0, .5, 26 if phone else 18)
    return zoom(_cache[key], 1.0 + .04 * min(1, ts / 6), .5, .45)
AD = json.load(open(f"{GUN}/03_musteri/adaylar.json"))["adaylar"]
def grid(ts):
    if "grid" not in _cache:
        ims = sorted(glob.glob(f"{EK}/*_masaustu.jpg"))[:12]
        g = Image.new("RGB", (W, H), (24, 20, 18)); cw, ch = 430, 245; dd = ImageDraw.Draw(g)
        names = {a.get("slug"): a for a in AD}
        for i, p_ in enumerate(ims):
            slug = os.path.basename(p_).split("_")[0]; a = names.get(slug, {})
            im = Image.open(p_).convert("RGB"); im = im.crop((0, 0, im.width, int(im.width * .57))).resize((cw, ch), Image.LANCZOS)
            x = 70 + (i % 4) * (cw + 18); y = 60 + (i // 4) * (ch + 88)
            g.paste(im, (x, y), rounded_mask(cw, ch, 12))
            pr = a.get("oncelik", "-"); col = {"A": ORANGE, "B": (230, 190, 90), "C": (190, 180, 168)}.get(pr, (150, 140, 130))
            dd.rounded_rectangle((x, y + ch + 10, x + 44, y + ch + 50), radius=10, fill=col)
            dd.text((x + 13, y + ch + 13), pr if pr in "ABC" else "–", font=F(IB, 26), fill=INK)
            dd.text((x + 58, y + ch + 14), (a.get("ad") or slug)[:26], font=F(ISB, 26), fill=CREAM)
        _cache["grid"] = g
    return zoom(_cache["grid"], 1.0 + .05 * min(1, ts / 8), .5, .5)
BGS = {}
def bg(key):
    if key not in BGS:
        src = {"ofis": 2.0, "konu": 30.0, "musteri": 100.0, "site": 124.0, "mail": 160.0, "mudur": 205.0, "pencere": 218.0}[key]
        BGS[key] = soft_of(rec_frame(src), .5)
    return BGS[key]

# ---------- katmanlar ----------
PIP_D = 380
def pip(f, av, t, t0, t1):
    size = PIP_D; cx, cy, r = 945, 470, 430
    face = av.crop((cx - r, cy - r, cx + r, cy + r)).resize((size, size), Image.BILINEAR)
    u = min(ease((t - t0) / .28), 1); X = 24; Y = int(H - size + (1 - u) * (size + 20))
    if "ps" not in _cache:
        s_ = Image.new("RGBA", (size + 80, size + 80), (0, 0, 0, 0)); ImageDraw.Draw(s_).ellipse((34, 40, size + 46, size + 52), fill=(0, 0, 0, 120)); _cache["ps"] = s_.filter(ImageFilter.GaussianBlur(14))
        m = Image.new("L", (size * 2, size * 2), 0); ImageDraw.Draw(m).ellipse((0, 0, size * 2 - 1, size * 2 - 1), fill=255); _cache["pm"] = m.resize((size, size), Image.LANCZOS)
    f.alpha_composite(_cache["ps"], (X - 40, Y - 40)); f.paste(face, (X, Y), _cache["pm"])

SFX = []   # (zaman, tür)
def card(f, t, t0, t1, title, items=(), x=80, y=150, w=700, sfx=True):
    """Açık renk kart: başlık + sırayla gelen maddeler; yeni gelen madde lacivert vurgulu."""
    if not (t0 <= t <= t1): return
    a = min(1, (t - t0) / .22, (t1 - t) / .22); dx = int((1 - ease((t - t0) / .32)) * -60)
    vis = [(s, ti) for s, ti in items if t >= ti]; h = 96 + 64 * len(vis) + (12 if vis else 0)
    lay = Image.new("RGBA", (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(lay)
    d.rounded_rectangle((x + dx + 6, y + 10, x + dx + w + 6, y + h + 10), radius=22, fill=(0, 0, 0, int(70 * a)))
    lay = lay.filter(ImageFilter.GaussianBlur(10)); d = ImageDraw.Draw(lay)
    d.rounded_rectangle((x + dx, y, x + dx + w, y + h), radius=22, fill=(*CREAM, int(250 * a)))
    d.text((x + dx + 34, y + 26), title, font=F(IB, 38), fill=(*NAVY, int(255 * a)))
    for k, (s, ti) in enumerate(vis):
        yy = y + 96 + k * 64; p = ease((t - ti) / .25); xx = x + dx + 22 + int((1 - p) * 40)
        hl = t - ti < 1.1
        if hl: d.rounded_rectangle((xx - 6, yy - 6, x + dx + w - 18, yy + 52), radius=14, fill=(*NAVY, int(255 * a * p)))
        d.ellipse((xx + 8, yy + 6, xx + 42, yy + 40), fill=(*ORANGE, int(255 * a * p)))
        d.line([(xx + 16, yy + 23), (xx + 23, yy + 31), (xx + 35, yy + 15)], fill=(255, 255, 255, int(255 * a * p)), width=4)
        d.text((xx + 58, yy + 4), s, font=F(ISB, 32), fill=((*CREAM, int(255 * a * p)) if hl else (*NAVY, int(255 * a * p))))
        if sfx and abs(t - ti) < .5 / FPS: SFX.append((ti, "tik"))
    f.alpha_composite(lay)

TEAMS = ["Konu", "Yapım", "Müşteri", "3D Site", "Mail", "Müdür"]
STEP = {"4": 1, "n2": 1, "5": 2, "7": 3, "7b": 3, "n3": 3, "8": 4, "8x": 4, "9": 5, "9b": 5, "n4": 5, "10": 6}
def stepper(f, k, t):
    act = STEP.get(k)
    if not act: return
    lay = Image.new("RGBA", (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(lay); fn = F(ISB, 24)
    ws = [d.textlength(f"{i + 1} · {n}", font=fn) + 40 for i, n in enumerate(TEAMS)]; tot = sum(ws) + 10 * 5; x = W / 2 - tot / 2; y = 34
    d.rounded_rectangle((x - 10, y - 8, x + tot + 10, y + 52), radius=30, fill=(*INK, 150))
    for i, n in enumerate(TEAMS):
        on = i + 1 == act; done = i + 1 < act
        d.rounded_rectangle((x, y, x + ws[i], y + 44), radius=22, fill=(*ORANGE, 255) if on else ((*CREAM, 60) if done else (0, 0, 0, 0)))
        d.text((x + 20, y + 8), f"{i + 1} · {n}", font=fn, fill=(*INK, 255) if on else (*CREAM, 230 if done else 150))
        x += ws[i] + 10
    f.alpha_composite(lay)

def title(f, t, t0, num, txt, hold=1.7):
    if not (t0 <= t <= t0 + hold): return
    p = ease((t - t0) / .3); a = min(1, (t0 + hold - t) / .25)
    lay = Image.new("RGBA", (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(lay)
    s = txt; fn = F(IB, 72); tw = d.textlength(s, font=fn); bw = tw + (150 if num else 90); x = W / 2 - bw / 2; y = 470 + int((1 - p) * 40)
    d.rounded_rectangle((x + 6, y + 12, x + bw + 6, y + 132), radius=34, fill=(0, 0, 0, int(90 * a)))
    lay = lay.filter(ImageFilter.GaussianBlur(12)); d = ImageDraw.Draw(lay)
    d.rounded_rectangle((x, y, x + bw, y + 120), radius=34, fill=(*CREAM, int(252 * a)))
    if num:
        d.ellipse((x + 26, y + 22, x + 102, y + 98), fill=(*ORANGE, int(255 * a)))
        d.text((x + 64 - d.textlength(num, font=F(IB, 48)) / 2, y + 30), num, font=F(IB, 48), fill=(255, 255, 255, int(255 * a)))
        d.text((x + 124, y + 18), s, font=fn, fill=(*NAVY, int(255 * a)))
    else: d.text((x + 45, y + 18), s, font=fn, fill=(*NAVY, int(255 * a)))
    f.alpha_composite(lay)

def paper(f, t, t0, t1, head, rows, box=(470, 150, 1830, 900), type_cps=0, fs=30, lh=44):
    if not (t0 <= t <= t1): return
    a = min(1, (t - t0) / .25, (t1 - t) / .25); x0, y0, x1, y1 = box; dy = int((1 - ease((t - t0) / .35)) * 50); y0 += dy; y1 += dy
    lay = Image.new("RGBA", (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(lay)
    d.rounded_rectangle((x0 + 6, y0 + 14, x1 + 6, y1 + 14), radius=24, fill=(0, 0, 0, int(90 * a))); lay = lay.filter(ImageFilter.GaussianBlur(14)); d = ImageDraw.Draw(lay)
    d.rounded_rectangle((x0, y0, x1, y1), radius=24, fill=(*CREAM, int(252 * a)))
    for i_, col in enumerate(((235, 95, 80), (240, 190, 70), (110, 190, 110))): d.ellipse((x0 + 28 + i_ * 26, y0 + 26, x0 + 44 + i_ * 26, y0 + 42), fill=(*col, int(255 * a)))
    d.text((x0 + 120, y0 + 18), head, font=F(ISB, 26), fill=(*MUTED, int(255 * a)))
    d.line((x0, y0 + 64, x1, y0 + 64), fill=(*LINE, int(255 * a)), width=2)
    chars = int((t - t0) * type_cps) if type_cps else 10 ** 9; y = y0 + 92
    for s, kind in rows:
        col = {"n": NAVY, "m": MUTED, "o": ORANGE}[kind]; fnt = F(IBo if kind == "o" else IM, fs)
        parts, cur = [], ""
        for wd in s.split():
            if d.textlength(cur + " " + wd, font=fnt) > x1 - x0 - 100: parts.append(cur); cur = wd
            else: cur = (cur + " " + wd).strip()
        parts.append(cur)
        for p_ in parts:
            if chars <= 0: break
            d.text((x0 + 50, y), p_[:chars], font=fnt, fill=(*col, int(255 * a))); chars -= len(p_); y += lh
        y += 10
        if y > y1 - 40: break
    f.alpha_composite(lay)

def big_list(f, t, t0, t1, head, items, x=520, w=1240):
    if not (t0 <= t <= t1): return
    a = min(1, (t - t0) / .25, (t1 - t) / .25)
    lay = Image.new("RGBA", (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(lay)
    d.text((x, 150), head, font=F(IB, 64), fill=(*CREAM, int(255 * a)))
    gap = 150 if len(items) <= 4 else 124
    for k, (h1, h2, tk) in enumerate(items):
        if t < tk - .05: continue
        if abs(t - tk) < .5 / FPS: SFX.append((tk, "tik"))
        p = ease((t - tk) / .3); xx = x + int((1 - p) * 80); y = 270 + k * gap; on = t - tk < 1.2
        d.rounded_rectangle((xx, y, xx + w, y + gap - 22), radius=22, fill=((*NAVY, int(250 * a * p)) if on else (*CREAM, int(250 * a * p))))
        d.ellipse((xx + 24, y + (gap - 22) / 2 - 38, xx + 100, y + (gap - 22) / 2 + 38), fill=(*ORANGE, int(255 * a * p)))
        d.text((xx + 62 - d.textlength(str(k + 1), font=F(IB, 44)) / 2, y + (gap - 22) / 2 - 28), str(k + 1), font=F(IB, 44), fill=(255, 255, 255, int(255 * a * p)))
        tc = CREAM if on else NAVY
        d.text((xx + 128, y + (18 if h2 else (gap - 22) / 2 - 26)), h1, font=F(IB, 42), fill=(*tc, int(255 * a * p)))
        if h2: d.text((xx + 130, y + 72), h2, font=F(IM, 28), fill=(*((200, 200, 210) if on else MUTED), int(255 * a * p)))
    f.alpha_composite(lay)

def bars(f, t, t0, t1):
    if not (t0 <= t <= t1): return
    vals = [("06.11", 435), ("04.11", 582), ("02.11", 309), ("31.10", 986), ("21.10", 231), ("15.10", 328), ("08.10", 525)]
    a = min(1, (t - t0) / .25, (t1 - t) / .25)
    lay = Image.new("RGBA", (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(lay)
    x0, y0, x1, y1 = 720, 170, 1830, 860
    d.rounded_rectangle((x0, y0, x1, y1), radius=24, fill=(*CREAM, int(250 * a)))
    d.text((x0 + 46, y0 + 34), "Kanalın son 7 videosu · izlenme", font=F(IB, 36), fill=(*NAVY, int(255 * a)))
    base = y1 - 100; mh = 420; bw = 104; ay = base - mh * 485 / 986
    for k, (lbl, v) in enumerate(vals[::-1]):
        p = ease((t - t0 - .2 - k * .09) / .5); hh = mh * v / 986 * p; x = x0 + 80 + k * 140; sector = lbl in ("02.11", "21.10")
        d.rounded_rectangle((x, base - hh, x + bw, base), radius=10, fill=((*(200, 190, 175),) if sector else (*NAVY,)) + (int(255 * a),))
        if p > .9: d.text((x + bw / 2 - d.textlength(str(v), font=F(IB, 28)) / 2, base - hh - 40), str(v), font=F(IB, 28), fill=(*NAVY, int(255 * a)))
        d.text((x + 18, base + 16), lbl, font=F(IM, 24), fill=(*MUTED, int(255 * a)))
    d.line((x0 + 50, ay, x1 - 50, ay), fill=(*ORANGE, int(255 * a)), width=3)
    d.text((x1 - 250, ay - 42), "ortalama 485", font=F(IB, 28), fill=(*ORANGE, int(255 * a)))
    d.text((x0 + 46, y1 - 50), "gri: başlığı sektör adıyla açılan videolar", font=F(IM, 24), fill=(*MUTED, int(255 * a)))
    f.alpha_composite(lay)

def timeline(f, t, t0, t1, steps):
    if not (t0 <= t <= t1): return
    a = min(1, (t - t0) / .25, (t1 - t) / .25)
    lay = Image.new("RGBA", (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(lay)
    d.rounded_rectangle((300, 300, 1820, 760), radius=26, fill=(*CREAM, int(250 * a)))
    d.text((360, 340), "Takip planı", font=F(IB, 46), fill=(*NAVY, int(255 * a)))
    x0, x1, y = 440, 1680, 540
    d.line((x0, y, x1, y), fill=(*LINE, int(255 * a)), width=6)
    for k, (lab, txt, tk) in enumerate(steps):
        if t < tk - .05: continue
        if abs(t - tk) < .5 / FPS: SFX.append((tk, "tik"))
        p = ease((t - tk) / .35); x = x0 + k * (x1 - x0) / (len(steps) - 1); r = 24 * p
        d.ellipse((x - r, y - r, x + r, y + r), fill=(*ORANGE, int(255 * a)))
        d.text((x - d.textlength(lab, font=F(IB, 40)) / 2, y - 90), lab, font=F(IB, 40), fill=(*NAVY, int(255 * a)))
        for j, l in enumerate(txt.split("\n")): d.text((x - d.textlength(l, font=F(IM, 28)) / 2, y + 44 + j * 36), l, font=F(IM, 28), fill=(*MUTED, int(255 * a)))
    f.alpha_composite(lay)

def chips(f, t, t0, t1, items, y=760):
    """Ortada yan yana kutucuklar (kimin işine yarar, ne lazım)."""
    if not (t0 <= t <= t1): return
    a = min(1, (t - t0) / .25, (t1 - t) / .25)
    lay = Image.new("RGBA", (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(lay); fn = F(IB, 40)
    ws = [d.textlength(s, font=fn) + 140 for s, _, _ in items]; tot = sum(ws) + 24 * (len(items) - 1); x = max(440, W / 2 - tot / 2 + 120)
    for (s, sub, tk), w_ in zip(items, ws):
        if t >= tk - .05:
            if abs(t - tk) < .5 / FPS: SFX.append((tk, "tik"))
            p = ease((t - tk) / .3); yy = y + int((1 - p) * 40)
            d.rounded_rectangle((x, yy, x + w_, yy + 150), radius=26, fill=(*CREAM, int(250 * a * p)))
            d.ellipse((x + 26, yy + 30, x + 60, yy + 64), fill=(*ORANGE, int(255 * a * p)))
            d.text((x + 76, yy + 22), s, font=fn, fill=(*NAVY, int(255 * a * p)))
            d.text((x + 28, yy + 90), sub, font=F(IM, 26), fill=(*MUTED, int(255 * a * p)))
        x += w_ + 24
    f.alpha_composite(lay)

# ---------- çekim planı ----------
SH = []   # (başlangıç, tür, argümanlar, hızlı_zoom)
def sh(t, kind, *args, whip=False): SH.append((t, kind, args, whip))
sh(0, "rec", 0.3)
k = "1"; sh(S(k), "av", 1.0, 1.06, whip=True); sh(c(k, "Akşam"), "rec", 9.0); sh(c(k, "on", 2), "grid"); sh(c(k, "iki"), "demo", "d1", 6.0)
sh(c(k, "dört", 2), "rec", 153.0); sh(c(k, "müdürün"), "rec", 199.0); sh(c(k, "Ofisi"), "rec", 0.5); sh(c(k, "bu", 2), "av", 1.12, 1.15)
k = "n1"; sh(S(k), "av", 1.0, 1.05, whip=True); sh(c(k, "Kafe"), "bg", "ofis"); sh(c(k, "Kod"), "av", 1.12, 1.14)
k = "2"; sh(S(k), "av", 1.0, 1.04, whip=True); sh(c(k, "ben"), "bg", "konu"); sh(c(k, "Altı"), "rec", 43.5); sh(c(k, "Sonra"), "av", 1.12, 1.14); sh(c(k, "Bir:") - .4, "bg", "ofis")
sh(c(k, "eski"), "rec", 28.5); sh(c(k, "Yapay"), "av", 1.0, 1.04)
k = "3"; sh(S(k), "rec", 116.0, whip=True); sh(c(k, "Masaya"), "rec", 4.0); sh(c(k, "Demo"), "rec", 127.5); sh(c(k, "Müdürün"), "rec", 199.0); sh(c(k, "Bu"), "av", 1.0, 1.05); sh(c(k, "Ama"), "rec", 140.0)
k = "4"; sh(S(k), "rec", 7.0, whip=True); sh(c(k, "son"), "bg", "konu"); sh(c(k, "Yani"), "av", 1.12, 1.15); sh(c(k, "Sonra"), "rec", 128 / 4 - 4.0); sh(c(k, "En", 2), "rec", 36.5)
sh(c(k, "Beş", 2), "rec", 16.0); sh(c(k, "Şu"), "av", 1.0, 1.05)
k = "n2"; sh(S(k), "av", 1.0, 1.05, whip=True); sh(c(k, "Kafe"), "bg", "konu"); sh(c(k, "Kural"), "av", 1.12, 1.14)
k = "5"; sh(S(k), "rec", 47.5, whip=True); sh(c(k, "Kritik"), "rec", 56.5); sh(c(k, "Mesela"), "bg", "konu"); sh(c(k, "Çünkü"), "av", 1.12, 1.15); sh(c(k, "Benim"), "rec", 73.0)
k = "6"; sh(S(k), "av", 1.0, 1.08, whip=True)
k = "7"; sh(S(k), "rec", 87.5, whip=True); sh(c(k, "Açılma"), "rec", 100.0); sh(c(k, "Bulduklarından"), "ss", "kapseramik_masaustu"); sh(c(k, "zeytinyağı"), "ssp", "coskun_telefon")
sh(c(k, "çikolata"), "ss", "oatolye_masaustu"); sh(c(k, "Sonra"), "grid"); sh(c(k, "İyi"), "av", 1.12, 1.15); sh(c(k, "ölçemediler") - .6, "rec", 106.0); sh(c(k, "kurumsal") - .8, "av", 1.0, 1.04)
k = "7b"; sh(S(k), "bg", "musteri", whip=True); sh(c(k, "Mesela"), "ss", "coskun_masaustu"); sh(c(k, "Açıkçası"), "av", 1.12, 1.15)
k = "n3"; sh(S(k), "av", 1.0, 1.05, whip=True); sh(c(k, "Önce"), "bg", "musteri"); sh(c(k, "Ölçütü"), "av", 1.12, 1.14)
k = "8"; sh(S(k), "rec", 116.5, whip=True); sh(c(k, "Biri"), "demo", "d1", 4.0); sh(c(k, "Siteyi"), "bg", "site"); sh(c(k, "İki", 2), "rec", 131.5)
sh(c(k, "Seramik"), "ss", "kapseramik_masaustu"); sh(c(k, "izinsiz"), "av", 1.12, 1.15)
k = "8x"; sh(S(k), "demo", "d2", 3.0, whip=True)
k = "9"; sh(S(k), "rec", 148.5, whip=True); sh(c(k, "Fiyat"), "rec", 176.5); sh(c(k, "hiçbiri"), "av", 1.12, 1.15)
k = "9b"; sh(S(k), "bg", "mail", whip=True); sh(c(k, "Takip"), "bg", "mail"); sh(c(k, "Yani"), "av", 1.0, 1.05)
k = "n4"; sh(S(k), "av", 1.0, 1.05, whip=True); sh(c(k, "Bir:") - .3, "bg", "mail"); sh(c(k, "Yapay"), "av", 1.12, 1.14)
k = "10"; sh(S(k), "rec", 188.5, whip=True); sh(c(k, "Çikolata"), "rec", 198.0); sh(c(k, "Yani"), "av", 1.12, 1.15)
k = "11"; sh(S(k), "rec", 215.5, whip=True); sh(c(k, "Tek"), "bg", "mudur"); sh(c(k, "Bu"), "av", 1.0, 1.05)
k = "12"; sh(S(k), "av", 1.0, 1.05, whip=True); sh(c(k, "Hız"), "rec", 192.0); sh(c(k, "Ve"), "av", 1.12, 1.15)
k = "n5"; sh(S(k), "av", 1.0, 1.05, whip=True); sh(c(k, "Claude") - .3, "bg", "pencere"); sh(c(k, "İlk"), "av", 1.12, 1.14)
k = "13"; sh(S(k), "bg", "ofis", whip=True); sh(c(k, "Kullandığım"), "av", 1.0, 1.05)
k = "14"; sh(S(k), "av", 1.0, 1.06, whip=True)
sh(S("son"), "bg", "pencere", whip=True)
SH.sort(key=lambda x: x[0])
def shot_at(t):
    cur = SH[0]
    for s_ in SH:
        if s_[0] <= t + 1e-6: cur = s_
        else: break
    return cur
for t_, k_, a_, w_ in SH:
    if w_: SFX.append((t_, "whoosh"))
def seg_of(t):
    best = None
    for k_ in ORDER:
        if t >= S(k_) - 1e-6: best = k_
    return best

PROMPT = [re.sub(r"\*\*|`", "", l.rstrip()) for l in open(f"{PRJ}/PROMPT.md").read().split("\n")[2:] if l.strip()][:10]
KOMUT = [l.rstrip() for l in open(f"{PRJ}/GUNLUK_KOMUT.md").read().split("```")[1].split("\n") if l.strip() and "charming-dirac" not in l][:16]
OAT = [a for a in AD if a.get("slug") == "coskun"]; CO = OAT[0] if OAT else {}

def base_of(t, shot):
    t0, kind, args, _ = shot; u = t - t0; k = seg_of(t) if t >= T0 else None
    if kind == "av":
        av = avf(k, t); z0, z1 = args; return zoom(av, z0 + (z1 - z0) * eio(u / 6), .49, .40)
    if kind == "rec": return rec_shot(args[0] + u)
    if kind == "demo": return zoom(demo(args[0], args[1] + u), 1.0 + .03 * min(1, u / 6))
    if kind == "grid": return grid(u)
    if kind == "ss": return screenshot(args[0], u)
    if kind == "ssp": return screenshot(args[0], u, phone=True)
    if kind == "bg": return zoom(bg(args[0]), 1.0 + .03 * min(1, u / 10))
    raise ValueError(kind)

def overlays(f, t, k):
    if k is None: return
    stepper(f, k, t)
    if k == "1":
        card(f, t, c(k, "Akşam"), c(k, "Ofisi") - .1, "Akşam masamda", [("5 video konusu", c(k, "beş")), ("14 site incelemesi", c(k, "on", 2)), ("2 tane 3D site", c(k, "iki")), ("4 mail taslağı", c(k, "dört", 2)), ("Müdürün raporu", c(k, "müdürün"))])
    if k == "n1":
        title(f, t, S(k) + .1, "", "Bu video kimin işine yarar?", 2.0)
        chips(f, t, c(k, "Kafe"), c(k, "Kod") - .1, [("Kafe", "rakip, menü, yorum", c(k, "Kafe")), ("Emlakçı", "ilan, mahalle", c(k, "emlakçıysanız")), ("Serbest çalışan", "müşteri, teklif", c(k, "serbest")), ("İçerik üreticisi", "konu, senaryo", c(k, "içerik"))], y=640)
        paper(f, t, c(k, "Kafe"), c(k, "Kod") - .1, "her sabah tekrar eden işler", [("aynı araştırma", "n"), ("aynı tablo", "n"), ("aynı mail", "n"), ("→ bir ekibe verilebilir", "o")], box=(560, 150, 1360, 520))
    if k == "2":
        paper(f, t, c(k, "ben"), c(k, "Altı") - .1, "PROMPT.md · Fable 5.2'ye verilen tek komut", [(p, "n") for p in PROMPT], box=(520, 150, 1840, 900), type_cps=170, fs=28, lh=40)
        card(f, t, c(k, "Altı"), c(k, "Sonra") - .1, "6 ekip", [("Konu bulan", c(k, "konu")), ("Videoyu hazırlayan", c(k, "videoyu")), ("Müşteri arayan", c(k, "müşteri")), ("3D site yapan", c(k, "3D", 2)), ("Mail yazan", c(k, "mail")), ("Müdür", c(k, "müdür"))])
        big_list(f, t, c(k, "Bir:") - .4, c(k, "eski") - .1, "3 kural", [("Boş iş yok", "her çıktı gerçekten kullanılacak bir dosya", c(k, "Bir:")), ("Uydurmak yok", "bulamadığını \"bulunamadı\" diye yaz", c(k, "İki:")), ("Gönder tuşu bende", "dışarıya hiçbir şey gitmez, mailler taslak", c(k, "Üç:"))])
        card(f, t, c(k, "eski"), c(k, "Yapay") - .1, "İlk gün verdiklerim", [("Kanalın kuralları", c(k, "kanalın")), ("Önceki videolarım", c(k, "önceki")), ("Satış notlarım", c(k, "satış"))])
    if k == "3":
        card(f, t, S(k) + .2, c(k, "Bu") - .1, "Neden 3D ofis?", [("Masaya yürü, iş açılsın", c(k, "Masaya")), ("Demo + ZIP indirme", c(k, "Demo")), ("Müdür odasında onay / ret", c(k, "Müdürün"))])
    if k == "4":
        title(f, t, S(k) + .1, "1", "Konu ekibi")
        bars(f, t, c(k, "son"), c(k, "Yani") - .1)
        card(f, t, c(k, "Sonra"), c(k, "Şu") - .1, "Gündem", [("Fable 5.2 yeni çıktı", c(k, "Feybıl")), ("Küçük kanal da izleniyor", c(k, "En", 2)), ("5 öneri, her biri kanıtlı", c(k, "Beş", 2)), ("1'ini kendileri eledi", c(k, "Birini"))])
    if k == "n2":
        title(f, t, S(k) + .1, "", "Senin işinde nasıl olur?", 1.8)
        big_list(f, t, c(k, "Kafe"), c(k, "Kural") - .1, "Konu ekibi, senin işinde", [("Kafe", "rakiplerin menüsü + yorumlar → bu haftanın paylaşımı", c(k, "Kafe")), ("Emlakçı", "hangi mahallede hangi ilan öne çıkıyor", c(k, "Emlakçıysanız")), ("Kural", "her öneri bir kaynakla gelir", c(k, "Kural"))])
    if k == "5":
        title(f, t, S(k) + .1, "2", "Yapım ekibi")
        card(f, t, S(k) + 1.9, c(k, "Mesela") - .1, "Tam paket", [("213 cümlelik senaryo", c(k, "iki")), ("3 başlık + açıklama", c(k, "üç")), ("3 kapak fikri + Shorts", c(k, "kapak")), ("Her bilginin yanında kaynak", c(k, "senaryodaki"))])
        paper(f, t, c(k, "Mesela"), c(k, "Çünkü") - .1, "arastirma_dogrulama.md", [("Fable 5.2'nin hızı (\"%30'a kadar\")", "o"), ("Kaynak: haber sitesi. Resmi duyuru açılamadı.", "m"), ("→ Videoda rakam söyleme. Önce doğrula.", "n")], box=(560, 300, 1700, 640))
    if k == "6": title(f, t, S(k) + 1.0, "", "Şimdi para kazanan taraf", 2.4)
    if k == "7":
        title(f, t, S(k) + .1, "3", "Müşteri bulma ekibi")
        card(f, t, S(k) + 1.9, c(k, "Bulduklarından") - .1, "14 gerçek site", [("Gerçek tarayıcıyla açıldı", c(k, "On")), ("Bilgisayar + telefon", c(k, "hem")), ("Hız, taşma, kırık bağlantı", c(k, "Açılma"))])
        card(f, t, c(k, "Bulduklarından"), c(k, "Sonra") - .1, "Bulduklarından", [("5 ürünün 5'i tükenmiş", c(k, "seramik")), ("Telefonda 5 sn, 270 istek", c(k, "zeytinyağı")), ("Site = logo + \"çok yakında\"", c(k, "çikolata"))], y=560)
        card(f, t, c(k, "Sonra"), c(k, "İyi") - .1, "Puanlama", [("3 A · 2 B · 2 C", c(k, "üç")), ("6'sı elendi: siteleri iyi", c(k, "Altısını"))], x=1120, y=760, w=660)
        card(f, t, c(k, "ölçemediler") - .6, c(k, "kurumsal") - .9, "Dürüstlük", [("1 site ölçülemedi → yazıldı", c(k, "ölçemediler")), ("Tek ölçüm: kendin dene", c(k, "tek")), ("Sadece kurumsal iletişim", c(k, "kurumsal"))])
    if k == "7b":
        rows = [("Öncelik:  A", "n"), ("İşletme:  " + CO.get("ad", "Coşkun Zeytincilik"), "n"), ("Altyapı:  WordPress + WooCommerce", "n"), ("Telefonda ilk görüntü:  5,0 sn · kırık bağlantı 0/20", "n"),
                ("Neden uygun:  en yavaş site; hasat kampanyası tek afişte", "n"), ("Demo fikri:  yanına hafif bir \"yeni hasat\" sayfası", "n"), ("İletişim:  info@coskunzeytincilik.com (kaynak: sitenin alt bilgisi)", "n"),
                ("Kural kontrolü:  Geçti — yasaklı değil, ret listesinde yok", "o"), ("Not:  cep telefonları kaydedilmedi; ajans imzası → yanına sayfa", "o")]
        paper(f, t, S(k) + .1, c(k, "Mesela") - .1, "aday_tablosu.csv · 1 satır", rows, box=(470, 110, 1800, 930), fs=30, lh=46)
        card(f, t, c(k, "Mesela"), c(k, "Açıkçası") - .1, "Ekibin notu", [("Cep telefonu kaydedilmedi", c(k, "kişisel")), ("Ajans imzası → yanına sayfa", c(k, "Sitenin"))])
    if k == "n3":
        title(f, t, S(k) + .1, "", "Serbest çalışıyorsan", 1.7)
        big_list(f, t, c(k, "Önce"), c(k, "Ölçütü") - .1, "Müşteri ekibine 3 şey ver", [("Kime satıyorsun?", "sektör + şehir", c(k, "Önce")), ("Ölçütün ne?", "neye bakınca \"bu işletmenin bana ihtiyacı var\" dersin", c(k, "Sonra")), ("Kuralların", "kime yazılmaz, hangi bilgi kullanılmaz", c(k, "En"))])
    if k == "8":
        title(f, t, S(k) + .1, "4", "3D site ekibi")
        card(f, t, S(k) + 1.9, c(k, "Siteyi") - .1, "2 demo site", [("En iyi 2 aday için", c(k, "En")), ("Tek fotoğraf yok, hepsi kod", c(k, "İçinde")), ("Bilinmeyen ürün adı uydurulmadı", c(k, "Ürün"))])
        big_list(f, t, c(k, "Siteyi"), c(k, "İki", 2) - .1, "Test eden çalışan · 8 kontrol", [("Konsol hatası yok · internetsiz çalışıyor", "", c(k, "konsolda")), ("Telefonda taşma yok · ilk görüntü < 3 sn", "", c(k, "telefonda")),
                 ("Kırık bağlantı yok · arama motoruna kapalı", "", c(k, "kırık")), ("\"Bağımsız konsept demo\" notu var", "", c(k, "altta"))], x=420, w=1380)
        card(f, t, c(k, "İki", 2), c(k, "Seramik") - .1, "Sonuç", [("16 / 16 kontrol geçti", c(k, "İki", 2) + .3)], w=560)
        card(f, t, c(k, "Seramik"), E(k), "Yapılmayan", [("El çizimi tabaklar kopyalanmadı", c(k, "Tabakların")), ("Önce izin mesajı", c(k, "izinsiz"))], y=600)
    if k == "8x": title(f, t, S(k) + .3, "", "2 demo · 16/16 kontrol", 3.6)
    if k == "9":
        title(f, t, S(k) + .1, "5", "Mail ekibi")
        card(f, t, S(k) + 1.9, E(k), "4 işletme, 4 ayrı mail", [("Her biri özel bir gözlemle", c(k, "her")), ("Fiyat yok, garanti yok", c(k, "Fiyat")), ("\"Bir daha yazmayayım mı?\" satırı", c(k, "En")), ("0 gönderildi", c(k, "hiçbiri"))])
    if k == "9b":
        mail = [("Konu: O Atölye için bir şey hazırladım: çekirdekten tablete, 3D", "o"), ("Merhaba,", "n"),
                ("Saatolog'daki söyleşinizi okudum: çekirdeği kendiniz kavurup taş değirmende bir gün öğüttüğünüzü. Sonra sitenize baktım; hâlâ \"çok yakında\" yazıyor.", "n"),
                ("O yolculuğu anlatan küçük bir 3D sayfa hazırladım. [DEMO LİNKİ]", "n"), ("Ürün adlarınızı bilmediğim için tablet bölümünü boş bıraktım; orası sizin listenizle dolar.", "n"),
                ("Bakıp ne düşündüğünüzü yazar mısınız?", "n"), ("Bir daha yazmamamı isterseniz \"yazma\" demeniz yeterli.", "m")]
        paper(f, t, S(k) + .1, c(k, "Takip") - .1, "o-atolye.md · TASLAK, gönderilmedi", mail, box=(470, 110, 1640, 930), fs=31, lh=46)
        timeline(f, t, c(k, "Takip"), c(k, "Yani") - .1, [("Gün 0", "ilk mail\n+ demo linki", c(k, "Takip")), ("Gün +4", "tek cümle\n+ 15 sn video", c(k, "Dördüncü")), ("Gün +7", "son mesaj", c(k, "Yedinci")), ("Sonra", "3 ay dokunma", c(k, "Cevap"))])
    if k == "n4":
        title(f, t, S(k) + .1, "", "Mail ekibini kurarken", 1.7)
        big_list(f, t, c(k, "Bir:") - .3, c(k, "Yapay") - .1, "2 kural", [("Sadece kurumsal adres", "işletmenin sitesinde yayınladığı; kişisel bilgi yok", c(k, "Bir:")), ("Toplu gönderim yok", "her maili sen oku, tek tek gönder", c(k, "İki:"))])
    if k == "10":
        title(f, t, S(k) + .1, "6", "Müdür odası")
        card(f, t, S(k) + 1.9, c(k, "Yani") - .1, "Müdürün 5 sorusu", [("Çikolata atölyesine mail?", c(k, "Çikolata")), ("Zeytinyağı firmasına?", c(k, "Zeytinyağı")), ("Adresi olmayan: 2 hafta bekle?", c(k, "Adresi")), ("Seramiğe izin mesajı?", c(k, "Seramik")), ("Onaylıyorum → dosyaya", c(k, "Ben"))])
    if k == "11":
        title(f, t, S(k) + .1, "", "Ertesi sabah", 1.7)
        paper(f, t, c(k, "Tek"), c(k, "Bu") - .1, "GUNLUK_KOMUT.md", [(l.lstrip("- "), "o" if (l.isupper() or l.endswith(":")) else "n") for l in KOMUT], box=(470, 110, 1840, 930), fs=24, lh=34, type_cps=200)
        card(f, t, c(k, "Bu"), E(k), "Her sabah", [("Dünkü rapor + kararlarım", c(k, "Bu") + .2), ("Zamanlanmış görev: kendiliğinden", c(k, "zamanlanmış"))])
    if k == "12":
        card(f, t, S(k) + .2, E(k), "Sınırlar", [("Hız ölçümü tek seferlik", c(k, "Hız")), ("Ürün adlarını ben tamamlarım", c(k, "Demo")), ("Sabah komut, akşam onay", c(k, "sabah")), ("Karar bende", c(k, "Yapay"))])
    if k == "n5":
        title(f, t, S(k) + .1, "", "Ne lazım?", 1.4)
        chips(f, t, c(k, "Claude") - .3, c(k, "İlk") - .1, [("Claude Code", "ekipleri kuran", c(k, "Claude")), ("Boş bir klasör", "dosyalar burada", c(k, "boş")), ("Kural dosyası", "iş + ekip + yasak", c(k, "kural"))], y=470)
    if k == "13":
        big_list(f, t, S(k) + .1, c(k, "Kullandığım") - .1, "Kendin kur · 4 adım", [("İşlerini yaz", "her iş bir ekip olsun", c(k, "Bir:")), ("Dosya iste", "rapor, tablo, taslak; sohbet değil", c(k, "İki:")),
                 ("Yasakları yaz", "uydurma yok, dışarı gönderme yok, kişisel bilgi yok", c(k, "Üç:")), ("Kararı sende tut", "müdür sana sorsun", c(k, "Dört:"))])
        card(f, t, c(k, "Kullandığım"), E(k), "Komutun tamamı", [("Açıklamada · kopyala", c(k, "Kullandığım") + .2)])
    if k == "son":
        u = t - S(k); a = ease(u / .5)
        lay = Image.new("RGBA", (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(lay)
        d.rounded_rectangle((360, 330, 1560, 700), radius=34, fill=(*CREAM, int(250 * a)))
        for s, fn, col, y in (("Sıradaki ekibi hangi işe kuralım?", F(IB, 64), NAVY, 410), ("Kafe · emlakçı · senin işin → yorumlara yaz", F(ISB, 36), ORANGE, 520), ("Komutun tamamı açıklamada", F(IM, 32), MUTED, 590)):
            tw = d.textlength(s, font=fn); d.text((W / 2 - tw / 2, y), s, font=fn, fill=(*col, int(255 * a)))
        f.alpha_composite(lay)

def whip(im, t):
    """Kesme noktasında hızlı zoom + hareket bulanıklığı."""
    best = None
    for t0, k_, a_, w_ in SH:
        if w_ and abs(t - t0) < .16: best = t0
    if best is None: return im
    q = 1 - abs(t - best) / .16; z = 1 + .16 * q
    im = zoom(im, z)
    if q > .15:
        s = im.resize((W // 6, H // 6), Image.BILINEAR).filter(ImageFilter.BoxBlur(2 + 4 * q)).resize((W, H), Image.BILINEAR)
        im = Image.blend(im, s, min(.85, q))
    return im

# ---------- render ----------
CH = os.environ.get("CHUNK", "0/1").split("/"); ci, cn = int(CH[0]), int(CH[1])
fa, fb = N * ci // cn, N * (ci + 1) // cn
PREV = [float(x) for x in os.environ.get("PREV", "").split(",") if x]
if PREV: frames = [int(round(x * FPS)) for x in PREV]
else: frames = range(fa, fb)
if not PREV:
    enc = subprocess.Popen(["ffmpeg", "-y", "-v", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
                            "-vf", "eq=contrast=1.03:saturation=1.05,colorbalance=rs=0.02:bs=-0.025:rh=0.015", "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p",
                            f"{V4}/part_{ci}.mp4"], stdin=subprocess.PIPE)
for i in frames:
    t = i / FPS; shot = shot_at(t); k = seg_of(t) if t >= T0 else None
    base = base_of(t, shot)
    base = whip(base, t)
    f = base.convert("RGBA")
    overlays(f, t, k)
    if k and HASAV(k) and shot[1] != "av" and S(k) <= t <= E(k) + GAP:
        pip(f, avf(k, min(t, E(k) - .05)), t, max(shot[0], S(k)), E(k))
    if PREV: f.convert("RGB").save(f"{V4}/p4_{t:06.1f}.jpg", quality=82); continue
    enc.stdin.write(f.convert("RGB").tobytes())
if not PREV:
    enc.stdin.close(); enc.wait()
    json.dump(sorted(set((round(a, 2), b) for a, b in SFX)), open(f"{V4}/sfx_{ci}.json", "w"))
    json.dump({k: [S(k), E(k)] for k in ORDER}, open(f"{V4}/segler.json", "w"))
    print("parça bitti", ci, fa, fb)
