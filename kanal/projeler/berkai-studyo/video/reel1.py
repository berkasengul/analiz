# BerkAİ Instagram Reel 1 — üstte ofis, altta avatar, büyük altyazı, sonda "yoruma CLAUDE yaz"
import json, re, glob, subprocess, wave, os
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter
SP = "/tmp/claude-0/-home-user-analiz/15f5e81a-2f5a-535e-8b53-dec004b93200/scratchpad"; V4 = f"{SP}/v4"
REC = f"{SP}/kayit2/k.mp4"; AVP = f"{V4}/reel1_av.mp4"; OLD = f"{SP}/sirket_video"
PRJ = "/home/user/analiz/kanal/projeler/berkai-studyo"
W, H, FPS = 1080, 1920, 30; TOP = 960
CREAM = (247, 243, 234); NAVY = (27, 34, 64); ORANGE = (242, 140, 40); INK = (18, 15, 13)
FD = "/usr/share/fonts/opentype/inter/"; _fc = {}
def F(n, s):
    if (n, s) not in _fc: _fc[(n, s)] = ImageFont.truetype(FD + n, s)
    return _fc[(n, s)]
def ease(p): p = max(0, min(1, p)); return 1 - (1 - p) ** 3
D = float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", AVP]))
END = 3.0; TOTAL = D + 0.6; N = int(TOTAL * FPS)
WD = json.load(open(f"{V4}/reel1_stt.json"))
def cue(w, n=1):
    c = 0
    for x in WD:
        if re.sub(r"[^\wçğıöşü]", "", x["w"].lower()) == w:
            c += 1
            if c == n: return x["s"] - .1
    print("cue yok", w); return 0

class Reader:
    def __init__(s, path, size, ss=0): s.size = size; s.p = subprocess.Popen(["ffmpeg", "-v", "error", "-ss", str(ss), "-i", path, "-vf", f"fps={FPS}", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], stdout=subprocess.PIPE); s.last = None
    def next(s):
        b = s.p.stdout.read(s.size[0] * s.size[1] * 3)
        if len(b) == s.size[0] * s.size[1] * 3: s.last = Image.frombytes("RGB", s.size, b)
        return s.last
AV = Reader(AVP, (1080, 1920))
RR = {}
def rec(t0, u, cx=.5):
    k = t0
    if k not in RR: RR[k] = Reader(REC, (1920, 812), t0)
    im = RR[k].next(); sc = TOP / im.height; im = im.resize((int(im.width * sc), TOP), Image.BILINEAR)
    x0 = int(min(max(0, cx * im.width - W / 2), im.width - W)); return im.crop((x0, 0, x0 + W, TOP))
D1 = sorted(glob.glob(f"{OLD}/demo1/f_*.jpg"))
def demo(u):
    im = Image.open(D1[min(len(D1) - 1, int((4 + u) * 15))]).convert("RGB"); sc = TOP / im.height
    im = im.resize((int(im.width * sc), TOP), Image.BILINEAR); x0 = int(im.width * .62 - W / 2); return im.crop((x0, 0, x0 + W, TOP))
def grid():
    ims = sorted(glob.glob(f"{PRJ}/gunler/2026-11-11/03_musteri/ekran/*_telefon.jpg"))[:6]
    g = Image.new("RGB", (W, TOP), (24, 20, 18))
    for i, p in enumerate(ims):
        im = Image.open(p).convert("RGB"); im = im.crop((0, 0, im.width, int(im.width * 1.25))).resize((330, 412), Image.LANCZOS)
        g.paste(im, (30 + (i % 3) * 345, 50 + (i // 3) * 440))
    return g
PROMPT = [re.sub(r"\*\*|`", "", l) for l in open(f"{PRJ}/PROMPT.md").read().split("\n")[2:] if l.strip()][:7]
def paper(u):
    g = Image.new("RGB", (W, TOP), (34, 28, 24)); d = ImageDraw.Draw(g)
    d.rounded_rectangle((50, 60, W - 50, TOP - 60), radius=28, fill=CREAM)
    d.text((90, 95), "Claude'a verdiğim tek komut", font=F("Inter-Bold.otf", 40), fill=ORANGE)
    chars = int(u * 120); y = 170; fn = F("Inter-Medium.otf", 34)
    for ln in PROMPT:
        cur = ""; parts = []
        for w in ln.split():
            if d.textlength(cur + " " + w, font=fn) > W - 190: parts.append(cur); cur = w
            else: cur = (cur + " " + w).strip()
        parts.append(cur)
        for p in parts:
            if chars <= 0 or y > TOP - 120: break
            d.text((90, y), p[:chars], font=fn, fill=NAVY); chars -= len(p); y += 50
        y += 12
    return g

SH = [(0, "rec", 0.2, .5), (cue("tek"), "paper"), (cue("biri"), "rec", 8.0, .78), (cue("biri", 2), "rec", 49.0, .78), (cue("biri", 3), "grid"),
      (cue("biri", 4), "demo"), (cue("biri", 5), "rec", 153.0, .78), (cue("akşam"), "rec", 199.0, .78), (cue("kod"), "rec", 120.0, .5), (cue("kullandığım"), "end")]
def shot(t):
    c = SH[0]
    for s in SH:
        if s[0] <= t: c = s
    return c
LINES = []; cur = []
for x in WD:
    cur.append(x)
    if len(cur) >= 3 or x["w"].endswith((".", ",", "?")): LINES.append(cur); cur = []
if cur: LINES.append(cur)

enc = subprocess.Popen(["ffmpeg", "-y", "-v", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-", "-i", AVP, "-map", "0:v", "-map", "1:a",
                        "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k", "-af", "loudnorm=I=-14:TP=-1.5", "-shortest",
                        "-movflags", "+faststart", "/home/user/analiz/video_teslim/BerkAI_Reel1_Sirket.mp4"], stdin=subprocess.PIPE)
PREV = [float(x) for x in os.environ.get("PREV", "").split(",") if x]
for i in range(N):
    t = i / FPS; s = shot(t); u = t - s[0]
    av = AV.next()
    f = Image.new("RGB", (W, H), INK)
    # alt: avatar (yüz ortada)
    face = av.crop((198, 656, 882, 1264)).resize((W, H - TOP), Image.LANCZOS); f.paste(face, (0, TOP))
    kind = s[1]
    if kind == "rec": top = rec(s[2], u, s[3])
    elif kind == "paper": top = paper(u)
    elif kind == "grid": top = grid()
    elif kind == "demo": top = demo(u)
    else: top = Image.new("RGB", (W, TOP), (34, 28, 24))
    if top is not None:
        z = 1 + .04 * min(1, u / 3); w2, h2 = int(W / z), int(TOP / z); top = top.crop(((W - w2) // 2, (TOP - h2) // 2, (W + w2) // 2, (TOP + h2) // 2)).resize((W, TOP), Image.BILINEAR)
        if u < .12: top = Image.blend(top, Image.new("RGB", (W, TOP), (255, 255, 255)), (1 - u / .12) * .35)
        f.paste(top, (0, 0))
    lay = Image.new("RGBA", (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(lay)
    if t < 2.6 and kind != "end":   # kanca rozeti
        p = ease(t / .3); s_ = "17 ÇALIŞAN · 0 İNSAN"; fn = F("Inter-Black.otf", 64); tw = d.textlength(s_, font=fn)
        x = W / 2 - tw / 2 - 36; y = 90 + int((1 - p) * -40)
        d.rounded_rectangle((x, y, x + tw + 72, y + 104), radius=30, fill=(*ORANGE, int(255 * p))); d.text((x + 36, y + 14), s_, font=fn, fill=(255, 255, 255, int(255 * p)))
    if kind == "end":
        p = ease(u / .35); y0 = 240 + int((1 - p) * 120)
        d.rounded_rectangle((70, y0, W - 70, y0 + 470), radius=40, fill=(*CREAM, int(250 * p)))
        for s_, fn, col, yy in (("Yoruma yaz:", F("Inter-Bold.otf", 52), NAVY, 40), ("CLAUDE", F("Inter-Black.otf", 150), ORANGE, 110), ("komutun tamamı DM'de", F("Inter-Bold.otf", 52), NAVY, 300)):
            tw = d.textlength(s_, font=fn); d.text((W / 2 - tw / 2, y0 + yy), s_, font=fn, fill=(*col, int(255 * p)))
    else:   # büyük altyazı (ek yerinde)
        ln = next((l for l in LINES if l[0]["s"] - .05 <= t <= l[-1]["e"] + .12), None)
        if ln:
            fn = F("Inter-Black.otf", 74); s_ = " ".join(x["w"] for x in ln).replace("i", "İ").replace("ı", "I").upper().replace("ZEKAYA", "ZEKÂYA").rstrip(".,")
            tw = d.textlength(s_, font=fn); x = W / 2 - tw / 2; y = TOP - 50
            hit = any(k in s_ for k in ("CLAUDE", "17", "3D", "KOMUT", "RAPOR"))
            d.text((x, y), s_, font=fn, fill=(*(ORANGE if hit else (255, 255, 255)), 255), stroke_width=9, stroke_fill=(0, 0, 0, 255))
    fo = f.convert("RGBA"); fo.alpha_composite(lay); fo = fo.convert("RGB")
    if PREV:
        if any(abs(t - p) < .5 / FPS for p in PREV): fo.save(f"{V4}/r1_{t:05.1f}.jpg", quality=80)
        if t > max(PREV): break
        continue
    enc.stdin.write(fo.tobytes())
if not PREV: enc.stdin.close(); enc.wait(); print("ok", TOTAL)
