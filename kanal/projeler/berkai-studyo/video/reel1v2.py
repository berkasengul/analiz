# BerkAİ Reel 1 v2 — premium: tam ekran net avatar + el kamerası hissi, yüzen kartlar, kelime kelime editoryal altyazı,
# vurgu kelimeleri serif italik, sonda Instagram yorum/DM animasyonu. Müzik yok; çok hafif UI sesleri.
import json, re, glob, subprocess, wave, os, math
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter
SP = "/tmp/claude-0/-home-user-analiz/15f5e81a-2f5a-535e-8b53-dec004b93200/scratchpad"; V4 = f"{SP}/v4"
REC = f"{SP}/kayit2/k.mp4"; AVP = f"{V4}/reel1v_av.mp4"; OLD = f"{SP}/sirket_video"
PRJ = "/home/user/analiz/kanal/projeler/berkai-studyo"; FA = "/home/user/analiz/kanal/arac/vid/assets/fonts/"
OUT = "/home/user/analiz/video_teslim/BerkAI_Reel1_Sirket.mp4"
W, H, FPS = 1080, 1920, 30
CREAM = (250, 246, 238); ORANGE = (255, 150, 60); INK = (16, 14, 12)
_fc = {}
def F(path, s):
    if (path, s) not in _fc: _fc[(path, s)] = ImageFont.truetype(path, s)
    return _fc[(path, s)]
SANS = FA + "InterTight800.ttf"; SANS6 = FA + "InterTight600.ttf"; SERIF = FA + "InstrumentSerifItalic.ttf"; MONO = FA + "JBMono.ttf"
def ease(p): p = max(0, min(1, p)); return 1 - (1 - p) ** 3
def spring(p):
    p = max(0, min(1, p)); return 1 - math.exp(-6 * p) * math.cos(9 * p)
D = float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", AVP]))
TOTAL = D + 1.8; N = int(TOTAL * FPS)
WD = json.load(open(f"{V4}/reel1v_stt.json"))
def nrm(s): return re.sub(r"[^\wçğıöşüâ]", "", s.lower())
def cue(w, n=1, d=-.08):
    c = 0
    for x in WD:
        if nrm(x["w"]) == w:
            c += 1
            if c == n: return x["s"] + d
    print("cue yok", w); return 0
FACE_Y = float(os.environ.get("FACE_Y", ".36"))   # yüzün kadrajdaki dikey konumu (oran)

class Reader:
    def __init__(s, path, size, ss=0): s.size = size; s.p = subprocess.Popen(["ffmpeg", "-v", "error", "-ss", str(ss), "-i", path, "-vf", f"fps={FPS}", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], stdout=subprocess.PIPE); s.last = None
    def next(s):
        b = s.p.stdout.read(s.size[0] * s.size[1] * 3)
        if len(b) == s.size[0] * s.size[1] * 3: s.last = Image.frombytes("RGB", s.size, b)
        return s.last
AV = Reader(AVP, (W, H)); RR = {}
def rec(t0, box):
    if t0 not in RR: RR[t0] = Reader(REC, (1920, 812), t0)
    return RR[t0].next().crop(box)
D1 = sorted(glob.glob(f"{OLD}/demo1/f_*.jpg"))
def demo(u): return Image.open(D1[min(len(D1) - 1, int((4 + u * .9) * 15))]).convert("RGB").crop((520, 60, 1640, 1020))
_c = {}
def phones():
    if "ph" not in _c:
        ims = sorted(glob.glob(f"{PRJ}/gunler/2026-11-11/03_musteri/ekran/*_telefon.jpg"))[:3]
        g = Image.new("RGB", (1080, 900), (236, 230, 220))
        for i, p in enumerate(ims):
            im = Image.open(p).convert("RGB"); im = im.crop((0, 0, im.width, int(im.width * 2.05))).resize((310, 636), Image.LANCZOS)
            m = Image.new("L", im.size, 0); ImageDraw.Draw(m).rounded_rectangle((0, 0, im.width - 1, im.height - 1), radius=34, fill=255)
            g.paste(im, (40 + i * 340, 130 + (40 if i == 1 else 0)), m)
        _c["ph"] = g
    return _c["ph"]
PROMPT = [re.sub(r"\*\*|`", "", l) for l in open(f"{PRJ}/PROMPT.md").read().split("\n")[2:] if l.strip()][:6]
def paper(u):
    g = Image.new("RGB", (1000, 760), CREAM); d = ImageDraw.Draw(g)
    for i, col in enumerate(((235, 95, 80), (240, 190, 70), (110, 190, 110))): d.ellipse((36 + i * 30, 34, 54 + i * 30, 52), fill=col)
    d.text((150, 26), "PROMPT.md", font=F(MONO, 26), fill=(150, 140, 128)); d.line((0, 82, 1000, 82), fill=(226, 218, 204), width=2)
    chars = int(u * 130); y = 112; fn = F(SANS6, 32)
    for ln in PROMPT:
        cur = ""; parts = []
        for w in ln.split():
            if d.textlength(cur + " " + w, font=fn) > 900: parts.append(cur); cur = w
            else: cur = (cur + " " + w).strip()
        parts.append(cur)
        for p in parts:
            if chars <= 0 or y > 700: break
            d.text((50, y), p[:chars], font=fn, fill=(30, 28, 40)); chars -= len(p); y += 46
        y += 10
    return g

# ---- çekim planı: (başlangıç, bitiş, tür, arg, etiket)
C = lambda *a: cue(*a)
CARDS = [(C("tek"), C("biri"), "paper", None, "01 — tek komut"),
         (C("biri"), C("biri", 2), "rec", (8.0, (1100, 40, 1920, 700)), "02 — konu ekibi"),
         (C("biri", 2), C("biri", 3), "rec", (49.0, (1100, 40, 1920, 700)), "03 — yapım ekibi"),
         (C("biri", 3), C("biri", 4), "phones", None, "04 — müşteri bulma"),
         (C("biri", 4), C("biri", 5), "demo", None, "05 — 3d site"),
         (C("biri", 5), C("akşam"), "rec", (153.0, (1100, 40, 1920, 700)), "06 — mail ekibi"),
         (C("akşam"), C("son") , "rec", (199.0, (1100, 40, 1920, 700)), "07 — müdür"),
         (C("kafe"), C("araştırma"), "fayda", None, ""),
         (C("araştırma"), C("kod"), "hazir", None, ""),
         (C("kod"), C("komutun") - .1, "rec", (0.3, (300, 60, 1500, 760)), "kod bilmene gerek yok")]
PUNCH = [C("ve"), C("son"), C("peki"), C("kod")]      # avatara sert yakınlaşma anları
ACCENT = {"şirket", "gerçekten", "komut", "senaryo", "3d", "mail", "rapor", "ben", "kod", "şirket", "dmden", "kurdurdum", "kötü", "işine", "onaylarsın", "kendi"}
CTA = C("komutun")

# kelime grupları (2–3 kelime)
GR = []; cur = []
for x in WD:
    cur.append(x)
    if len(cur) >= 3 or x["w"].endswith((".", ",", "?")) or (len(cur) >= 2 and nrm(x["w"]) in ACCENT): GR.append(cur); cur = []
if cur: GR.append(cur)

rng = np.random.default_rng(1)
GRAIN = [Image.fromarray((rng.normal(128, 18, (H // 2, W // 2))).clip(0, 255).astype(np.uint8), "L").resize((W, H)) for _ in range(6)]
VIG = Image.new("L", (W, H), 0)
_v = np.zeros((H, W)); yy, xx = np.mgrid[0:H, 0:W]; _v = ((xx - W / 2) / (W * .75)) ** 2 + ((yy - H * .45) / (H * .7)) ** 2
VIG = Image.fromarray((np.clip(_v, 0, 1) * 150).astype(np.uint8), "L")
SFX = []

def listcard(title, rows, u):
    g = Image.new("RGB", (1000, 700), CREAM); d = ImageDraw.Draw(g)
    d.text((56, 92), title, font=F(SERIF, 84), fill=(30, 28, 40))
    for i, (h1, h2) in enumerate(rows):
        p = ease((u - .25 - i * .45) / .3)
        if p <= 0: continue
        y = 220 + i * 150; x = 56 + int((1 - p) * 40)
        d.rounded_rectangle((x, y, 944, y + 136), radius=30, fill=(255, 255, 255))
        d.ellipse((x + 26, y + 38, x + 86, y + 98), fill=ORANGE); d.line([(x + 42, y + 68), (x + 53, y + 80), (x + 72, y + 56)], fill=(255, 255, 255), width=6)
        d.text((x + 112, y + 18), h1, font=F(SANS, 46), fill=(30, 28, 40)); d.text((x + 112, y + 76), h2, font=F(SANS6, 32), fill=(130, 120, 110))
    return g
def card_img(kind, arg, u):
    if kind == "fayda": return listcard("senin işinde", [("Kafe", "rakip menü + yorum → paylaşım fikri"), ("Emlakçı", "mahalle mahalle ilan takibi"), ("Serbest çalışan", "müşteri adayı + teklif taslağı")], u)
    if kind == "hazir": return listcard("sabah hazır gelir", [("Araştırma", "kaynaklı rapor"), ("Müşteri bulma", "incelenmiş aday listesi"), ("Mail", "kişiye özel taslak · onay sende")], u)
    if kind == "paper": return paper(u)
    if kind == "phones": return phones()
    if kind == "demo": return demo(u)
    return rec(arg[0], arg[1])

def place_card(f, im, t, t0, t1, tag, idx):
    w = 860; h = int(im.height * w / im.width); h = min(h, 640)
    im = im.resize((w, int(im.height * w / im.width)), Image.LANCZOS).crop((0, 0, w, h))
    pin = spring((t - t0) / .55); pout = ease((t1 - t) / .18)
    if pin < .02 or pout <= 0: return
    sc = (.86 + .14 * pin) * (.94 + .06 * pout); rot = (-2.2 if idx % 2 else 2.0) * (1 - pin) + (-.8 if idx % 2 else .8)
    m = Image.new("L", (w, h), 0); ImageDraw.Draw(m).rounded_rectangle((0, 0, w - 1, h - 1), radius=40, fill=255)
    tile = Image.new("RGBA", (w + 120, h + 160), (0, 0, 0, 0))
    sh = Image.new("RGBA", tile.size, (0, 0, 0, 0)); ImageDraw.Draw(sh).rounded_rectangle((60, 90, 60 + w, 90 + h), radius=40, fill=(0, 0, 0, 150))
    tile.alpha_composite(sh.filter(ImageFilter.GaussianBlur(26)))
    ImageDraw.Draw(tile).rounded_rectangle((54, 54, 66 + w, 66 + h), radius=46, fill=(255, 255, 255, 235))
    tile.paste(im, (60, 60), m)
    # etiket
    d = ImageDraw.Draw(tile); fn = F(MONO, 28); tw = d.textlength(tag.upper(), font=fn)
    if tag: d.rounded_rectangle((84, 84, 84 + tw + 40, 134), radius=25, fill=(16, 14, 12, 210)); d.text((104, 92), tag.upper(), font=fn, fill=(255, 255, 255, 255)) if tag else None
    tile = tile.resize((int(tile.width * sc), int(tile.height * sc)), Image.BILINEAR).rotate(rot, resample=Image.BICUBIC, expand=True)
    a = min(1, pin * 1.4) * pout
    if a < 1: tile.putalpha(tile.getchannel("A").point(lambda v: int(v * a)))
    cx, cy = W / 2, 1400 + int((1 - ease((t - t0) / .4)) * 120)
    f.alpha_composite(tile, (int(cx - tile.width / 2), int(cy - tile.height / 2)))
    if abs(t - t0) < .5 / FPS: SFX.append((t0, "pop"))

def captions(f, t, low):
    g = next((g for g in GR if g[0]["s"] - .08 <= t <= g[-1]["e"] + .25), None)
    if not g: return
    lay = Image.new("RGBA", (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(lay)
    words = []
    for x in g:
        w = x["w"].rstrip(".,?"); acc = nrm(w) in ACCENT
        fn = F(SERIF, 104) if acc else F(SANS, 78); words.append((w if not acc else w.lower(), fn, acc, x["s"]))
    sp = 22; widths = [d.textlength(w, font=fn) for w, fn, a, s in words]; tot = sum(widths) + sp * (len(words) - 1)
    x = W / 2 - tot / 2; y = 1790 if low else 1330
    sh = Image.new("RGBA", (W, H), (0, 0, 0, 0)); ds = ImageDraw.Draw(sh)
    for (w, fn, acc, s), ww in zip(words, widths):
        p = ease((t - s + .04) / .16)
        if p <= 0: x += ww + sp; continue
        dy = int((1 - p) * 26); yy = y + dy - (14 if acc else 0)
        ds.text((x + 3, yy + 6), w, font=fn, fill=(0, 0, 0, int(170 * p)))
        d.text((x, yy), w, font=fn, fill=((*ORANGE, int(255 * p)) if acc else (255, 255, 255, int(255 * p))))
        x += ww + sp
    f.alpha_composite(sh.filter(ImageFilter.GaussianBlur(7))); f.alpha_composite(lay)

def hook(f, t):
    if t > 2.4: return
    a = min(1, (2.4 - t) / .3); lay = Image.new("RGBA", (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(lay)
    p1 = ease(t / .35); p2 = ease((t - .35) / .35)
    s1 = "17 çalışan."; f1 = F(SANS, 132); tw = d.textlength(s1, font=f1)
    d.text((W / 2 - tw / 2 + 3, 1180 + int((1 - p1) * 40) + 7), s1, font=f1, fill=(0, 0, 0, int(120 * p1 * a)))
    d.text((W / 2 - tw / 2, 1180 + int((1 - p1) * 40)), s1, font=f1, fill=(255, 255, 255, int(255 * p1 * a)))
    s2 = "0 insan."; f2 = F(SERIF, 168); tw = d.textlength(s2, font=f2)
    d.text((W / 2 - tw / 2 + 3, 1318 + int((1 - p2) * 40) + 7), s2, font=f2, fill=(0, 0, 0, int(120 * p2 * a)))
    d.text((W / 2 - tw / 2, 1318 + int((1 - p2) * 40)), s2, font=f2, fill=(*ORANGE, int(255 * p2 * a)))
    f.alpha_composite(lay)

def cta(f, t):
    u = t - CTA
    if u < 0: return
    lay = Image.new("RGBA", (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(lay)
    # karartma
    k = ease(u / .5); d.rectangle((0, 0, W, H), fill=(10, 9, 8, int(120 * k)))
    # başlık
    p = ease((u - .1) / .4)
    s = "yoruma yaz"; fn = F(SERIF, 120); tw = d.textlength(s, font=fn); d.text((W / 2 - tw / 2, 1080 + int((1 - p) * 30)), s, font=fn, fill=(255, 255, 255, int(255 * p)))
    # yorum kutusu
    p2 = spring((u - .35) / .6); bx0, by0 = 90, 1250 + int((1 - min(1, p2)) * 60)
    if p2 > .02:
        d.rounded_rectangle((bx0 + 4, by0 + 10, W - 90 + 4, by0 + 150 + 10), radius=75, fill=(0, 0, 0, 90))
        d.rounded_rectangle((bx0, by0, W - 90, by0 + 150), radius=75, fill=(255, 255, 255, int(250 * min(1, p2))))
        d.ellipse((bx0 + 24, by0 + 25, bx0 + 124, by0 + 125), fill=(230, 222, 210, 255)); d.text((bx0 + 52, by0 + 46), "B", font=F(SANS, 48), fill=(80, 70, 60, 255))
        typed = "ŞİRKET"[:max(0, int((u - .9) / .09))]
        if typed:
            d.text((bx0 + 160, by0 + 36), typed, font=F(SANS, 72), fill=(16, 14, 12, 255))
            if len(typed) < 6 and int(u * 6) % 2 == 0: SFX.append((round(t, 2), "tik"))
        else: d.text((bx0 + 160, by0 + 48), "Yorum ekle…", font=F(SANS6, 50), fill=(160, 152, 140, 255))
        if typed == "ŞİRKET":
            d.ellipse((W - 90 - 130, by0 + 22, W - 90 - 24, by0 + 128), fill=(*ORANGE, 255))
            d.polygon([(W - 90 - 96, by0 + 52), (W - 90 - 50, by0 + 75), (W - 90 - 96, by0 + 98), (W - 90 - 86, by0 + 75)], fill=(255, 255, 255, 255))
    # DM bildirimi
    u3 = u - 2.1
    if u3 > 0:
        p3 = spring(u3 / .6); ny = int(-200 + 280 * min(1.04, p3))
        d.rounded_rectangle((60 + 4, ny + 10, W - 60 + 4, ny + 190 + 10), radius=46, fill=(0, 0, 0, 80))
        d.rounded_rectangle((60, ny, W - 60, ny + 190), radius=46, fill=(255, 255, 255, 245))
        d.rounded_rectangle((96, ny + 40, 206, ny + 150), radius=30, fill=(*ORANGE, 255)); d.text((128, ny + 58), "B", font=F(SANS, 64), fill=(255, 255, 255, 255))
        d.text((236, ny + 36), "berka.ai", font=F(SANS, 46), fill=(16, 14, 12, 255)); d.text((W - 230, ny + 42), "şimdi", font=F(SANS6, 36), fill=(150, 140, 130, 255))
        d.text((236, ny + 100), "Komutun tamamı DM'inde 📩".replace(" 📩", ""), font=F(SANS6, 44), fill=(80, 74, 68, 255))
        if abs(u3) < .5 / FPS: SFX.append((round(t, 2), "pop"))
    f.alpha_composite(lay)

enc = subprocess.Popen(["ffmpeg", "-y", "-v", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
                        "-vf", "eq=contrast=1.04:saturation=1.06,colorbalance=rs=0.02:bs=-0.02:rh=0.02", "-c:v", "libx264", "-preset", "medium", "-crf", "17", "-pix_fmt", "yuv420p",
                        f"{V4}/reel1v_video.mp4"], stdin=subprocess.PIPE)
PREV = [float(x) for x in os.environ.get("PREV", "").split(",") if x]
for i in range(N):
    t = i / FPS
    av = AV.next()
    # el kamerası hissi + vurgu yakınlaşmaları
    z = 1.0 + .012 * (1 + math.sin(t * .7))
    for pt in PUNCH:
        if pt <= t < pt + 1.6: z += .07
    ox = 7 * math.sin(t * 1.3) + 3 * math.sin(t * 3.1); oy = 6 * math.cos(t * 1.1)
    w2, h2 = W / z, H / z; x0 = (W - w2) / 2 + ox; y0 = H * FACE_Y - h2 * FACE_Y + oy
    base = av.crop((int(x0), int(y0), int(x0 + w2), int(y0 + h2))).resize((W, H), Image.BILINEAR)
    f = base.convert("RGBA")
    hook(f, t)
    low = False
    for k_, (t0, t1, kind, arg, tag) in enumerate(CARDS):
        if t0 <= t <= t1 + .2 and t < CTA:
            place_card(f, card_img(kind, arg, t - t0), t, t0, t1, tag, k_); low = True
    if t < CTA and t > 2.4: captions(f, t, low)
    cta(f, t)
    fr = f.convert("RGB")
    fr = Image.composite(Image.new("RGB", (W, H), (0, 0, 0)), fr, VIG)                     # vinyet
    fr = Image.blend(fr, Image.merge("RGB", [GRAIN[i % 6]] * 3), .045)                      # film greni
    if PREV:
        if any(abs(t - p) < .5 / FPS for p in PREV): fr.save(f"{V4}/r2_{t:05.1f}.jpg", quality=80)
        if t > max(PREV): break
        continue
    enc.stdin.write(fr.tobytes())
if PREV: raise SystemExit
enc.stdin.close(); enc.wait()
# ses: konuşma + çok hafif pop/tık
sr = 48000; n = int(TOTAL * sr)
raw = subprocess.check_output(["ffmpeg", "-v", "error", "-i", AVP, "-af", "highpass=f=70,loudnorm=I=-14:TP=-1.5", "-ac", "1", "-ar", str(sr), "-f", "s16le", "-"])
v = np.frombuffer(raw, np.int16).astype(np.float64) / 32768; mix = np.zeros(n); mix[:min(n, len(v))] += v[:n]
def pop():
    L = int(.09 * sr); tt = np.arange(L) / sr; return np.sin(2 * np.pi * (520 - 2600 * tt) * tt) * np.exp(-tt * 38) * .10
def tik():
    L = int(.03 * sr); tt = np.arange(L) / sr; return np.sin(2 * np.pi * 2200 * tt) * np.exp(-tt * 140) * .05
done = set()
for ts, kind in SFX:
    key = (round(ts, 1), kind)
    if key in done: continue
    done.add(key); s_ = pop() if kind == "pop" else tik(); i0 = int(ts * sr)
    if i0 + len(s_) < n: mix[i0:i0 + len(s_)] += s_
mix = mix / max(1, np.abs(mix).max() / .95); st = (np.stack([mix, mix], 1) * 32767).astype(np.int16)
with wave.open(f"{V4}/reel1v.wav", "wb") as wf: wf.setnchannels(2); wf.setsampwidth(2); wf.setframerate(sr); wf.writeframes(st.tobytes())
subprocess.run(f"ffmpeg -v error -y -i {V4}/reel1v_video.mp4 -i {V4}/reel1v.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -shortest -movflags +faststart {OUT}", shell=True, check=True)
print("ok", OUT, round(TOTAL, 1))
