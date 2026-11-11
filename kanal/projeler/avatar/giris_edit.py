# BerkAİ: avatar giriş videosunun kanal tarzında kurgusu (B-roll montaj, kelime kelime alt yazı, zoom, glitch, abone ol)
import json, math, os, subprocess, wave
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageChops

S = "/tmp/claude-0/-home-user-analiz/15f5e81a-2f5a-535e-8b53-dec004b93200/scratchpad"
D = f"{S}/edit2"
SRC = "/root/.claude/uploads/15f5e81a-2f5a-535e-8b53-dec004b93200/ad13b66c-Yapay_Zekayla_Ni__Tarih_Kanal__Kurmak_720p_1.mp4"
W, H, FPS = 1920, 1080, 30
ORANGE = (242, 140, 40); RED = (225, 30, 35)
F_CAP = ImageFont.truetype("/usr/share/fonts/opentype/inter/Inter-Black.otf", 74)
F_POP = ImageFont.truetype("/home/user/analiz/kanal/arac/vid/assets/fonts/Anton.ttf", 190)
F_B = ImageFont.truetype("/usr/share/fonts/opentype/inter/Inter-Bold.otf", 40)
F_M = ImageFont.truetype("/usr/share/fonts/opentype/inter/Inter-Medium.otf", 26)
F_SB = ImageFont.truetype("/usr/share/fonts/opentype/inter/Inter-Black.otf", 44)
def sh(c): subprocess.run(c, shell=True, check=True)

WORDS = [w for w in json.load(open(f"{D}/stt.json"))["words"] if w.get("type") == "word"]
for w in WORDS:
    if w["text"].startswith("Cloud"): w["text"] = w["text"].replace("Cloud", "Claude")
DUR_AV = float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", SRC]))
T_OUT = 19.95                     # avatar biter, geçiş başlar
OUTRO = .9
TOTAL = T_OUT + OUTRO
N = int(round(TOTAL * FPS))

# ---------- kaynakları 1080p30'a çevir ----------
sh(f'ffmpeg -v error -y -i "{SRC}" -vf "scale={W}:{H}:flags=lanczos,fps={FPS}" -an -c:v libx264 -preset veryfast -crf 14 {D}/av1080.mp4')
C = f"{S}/tarih/clips"; FO = f"{S}/format/out"
BROLL = [(f"{C}/turk_malazgirt.mp4", 2.0), (f"{FO}/cop_adam.mp4", 12.6), (f"{FO}/beyaz_tahta.mp4", 9.4),
         (f"{FO}/sahne_fatih.mp4", 21.3), (f"{FO}/kusatma.mp4", 8.0), (f"{C}/fetih_gemiler.mp4", 3.0)]
B0, B1 = 1.00, 5.98
seg = (B1 - B0) / len(BROLL)
parts = []
for k, (f, off) in enumerate(BROLL):
    o = f"{D}/b{k}.mp4"
    sh(f'ffmpeg -v error -y -ss {off} -i "{f}" -t {seg:.3f} -an -vf "scale={W}:{H}:flags=lanczos,fps={FPS},format=yuv420p" -c:v libx264 -preset veryfast -crf 14 {o}')
    parts.append(o)
sh(f'ffmpeg -v error -y -ss 5 -i "{C}/fetih_saldiri.mp4" -t {OUTRO + .2} -an -vf "scale={W}:{H}:flags=lanczos,fps={FPS},format=yuv420p" -c:v libx264 -preset veryfast -crf 14 {D}/bout.mp4')

class Reader:
    def __init__(self, path):
        self.p = subprocess.Popen(["ffmpeg", "-v", "error", "-i", path, "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], stdout=subprocess.PIPE)
        self.last = None
    def next(self):
        b = self.p.stdout.read(W * H * 3)
        if len(b) == W * H * 3: self.last = Image.frombytes("RGB", (W, H), b)
        return self.last

# ---------- yardımcılar ----------
def ease(p): p = max(0, min(1, p)); return 1 - (1 - p) ** 3
def back(p, s=1.7): p = max(0, min(1, p)); return max(.03, 1 + (s + 1) * (p - 1) ** 3 + s * (p - 1) ** 2)
def zoom(img, z, cx=.5, cy=.42):
    if abs(z - 1) < 1e-3: return img
    w, h = W / z, H / z; x0 = min(max(0, cx * W - w / 2), W - w); y0 = min(max(0, cy * H - h / 2), H - h)
    return img.crop((int(x0), int(y0), int(x0 + w), int(y0 + h))).resize((W, H), Image.LANCZOS)

def zoom_at(t):
    z = 1.0 + .03 * min(1, t / 1.0)
    if 6.0 <= t < 8.4: z = 1.10 + .02 * ease((t - 6.0) / 2)                 # vurgu
    if 8.84 <= t < 10.9: z = 1.10 + .14 * back((t - 8.84) / .25)             # "konuşan ben de yapay zekâyım"
    if 10.9 <= t < 16.2: z = 1.06 + .03 * (t - 10.9) / 5
    if 16.2 <= t < 18.3: z = 1.0
    if t >= 18.3: z = 1.06 + .5 * ease((t - 19.3) / .65) * (t > 19.3)
    return z

def glitch(img, amt, seed):
    a = np.array(img); rng = np.random.default_rng(seed); out = a.copy()
    dx = int(14 * amt)
    out[..., 0] = np.roll(a[..., 0], dx, 1); out[..., 2] = np.roll(a[..., 2], -dx, 1)
    for _ in range(int(10 * amt)):
        y = rng.integers(0, H - 40); hh = rng.integers(6, 40); sft = rng.integers(-60, 60)
        out[y:y + hh] = np.roll(out[y:y + hh], int(sft * amt), 1)
    out[::4] = (out[::4] * .82).astype(np.uint8)
    return Image.fromarray(out)

# alt yazı satırları: en fazla 4 kelime, nokta/virgülde böl
LINES, cur = [], []
for w in WORDS:
    cur.append(w)
    if w["text"].endswith((".", ",")) or len(cur) >= 4: LINES.append(cur); cur = []
if cur: LINES.append(cur)

def captions(f, t):
    d = ImageDraw.Draw(f)
    ln = next((l for l in LINES if l[0]["start"] - .08 <= t <= l[-1]["end"] + .2), None)
    if not ln: return
    txt = [w["text"].upper().rstrip(".,") if False else w["text"].rstrip(".,") for w in ln]
    gap = 22; ws = [d.textlength(s, font=F_CAP) for s in txt]; tot = sum(ws) + gap * (len(ws) - 1)
    xc = W / 2
    if B0 <= t < B1: xc = max(W / 2, 24 + PIP_D + 40 + tot / 2)   # avatarın üstüne binmesin
    x = xc - tot / 2; y = 860
    pop = back((t - ln[0]["start"] + .08) / .18)
    for w, s, ww in zip(ln, txt, ws):
        on = t >= w["start"] - .02; cur_ = w["start"] - .02 <= t <= w["end"] + .04
        col = ORANGE if cur_ else ((255, 255, 255) if on else (235, 235, 235))
        sc = 1.0
        fnt = F_CAP if sc == 1 else ImageFont.truetype("/usr/share/fonts/opentype/inter/Inter-Black.otf", int(74 * sc * pop))
        yy = y - (74 * (sc - 1)) / 2
        d.text((x, yy), s, font=fnt, fill=col, stroke_width=7, stroke_fill=(10, 10, 12))
        x += ww + gap

def pop_text(f, t, s, t0, t1, y=430, col=(255, 255, 255), rot=-4):
    if not (t0 <= t <= t1 + .15): return
    p = back((t - t0) / .22); a = 1 - max(0, (t - t1) / .15)
    lay = Image.new("RGBA", (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(lay)
    tw = d.textlength(s, font=F_POP)
    d.text((W / 2 - tw / 2, y - 120), s, font=F_POP, fill=(*col, int(255 * a)), stroke_width=12, stroke_fill=(10, 10, 12, int(255 * a)))
    lay = lay.rotate(rot, center=(W / 2, y), resample=Image.BICUBIC)
    if p != 1:
        lay = lay.resize((int(W * p), int(H * p)), Image.LANCZOS); tmp = Image.new("RGBA", (W, H), (0, 0, 0, 0)); tmp.paste(lay, (int(W / 2 - W * p / 2), int(H / 2 - H * p / 2))); lay = tmp
    f.alpha_composite(lay)

PIP_D = 400                                  # referans: ekranın altına yaslı yuvarlak avatar
def pip(f, avimg, t):
    size = PIP_D; cx, cy, r = 955, 585, 460      # geniş kadraj: baş + omuz + eller
    face = avimg.crop((cx - r, cy - r, cx + r, cy + r)).resize((size, size), Image.LANCZOS)
    m = Image.new("L", (size * 2, size * 2), 0); ImageDraw.Draw(m).ellipse((0, 0, size * 2 - 1, size * 2 - 1), fill=255)
    m = m.resize((size, size), Image.LANCZOS)
    X = 24
    u = min(ease((t - B0) / .35), ease((B1 - t) / .3))   # alttan kayarak girer/çıkar
    Y = int(H - size + (1 - u) * (size + 20))
    sh_ = Image.new("RGBA", (W, H), (0, 0, 0, 0)); ImageDraw.Draw(sh_).ellipse((X - 6, Y - 6, X + size + 6, Y + size + 6), fill=(0, 0, 0, 120)); f.alpha_composite(sh_.filter(ImageFilter.GaussianBlur(14)))
    f.paste(face, (X, Y), m)

def name_tag(f, t, t0, t1):
    if not (t0 <= t <= t1): return
    a = min(1, (t - t0) / .3, (t1 - t) / .3); x0 = 80 - int((1 - ease((t - t0) / .35)) * 80)
    lay = Image.new("RGBA", (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(lay)
    d.rounded_rectangle((x0, 640, x0 + 470, 735), radius=14, fill=(16, 16, 20, int(235 * a)))
    d.rectangle((x0, 640, x0 + 12, 735), fill=(*ORANGE, int(255 * a)))
    d.text((x0 + 34, 650), "Berkay", font=F_B, fill=(255, 255, 255, int(255 * a)))
    d.text((x0 + 34, 697), "BerkAİ · yapay zekâ ile projeler", font=F_M, fill=(215, 215, 220, int(255 * a)))
    f.alpha_composite(lay)

def ai_badge(f, t, t0=9.65, t1=10.95):
    if not (t0 <= t <= t1): return
    p = back((t - t0) / .2); a = min(1, (t1 - t) / .2)
    lay = Image.new("RGBA", (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(lay)
    s = "YAPAY ZEKÂ AVATARI"; tw = d.textlength(s, font=F_SB); x0, y0 = W / 2 - (tw + 150) / 2, 120
    d.rounded_rectangle((x0, y0, x0 + tw + 150, y0 + 90), radius=45, fill=(*RED, int(240 * a)))
    d.rounded_rectangle((x0 + 14, y0 + 14, x0 + 104, y0 + 76), radius=14, fill=(255, 255, 255, int(255 * a)))
    d.text((x0 + 30, y0 + 18), "AI", font=F_SB, fill=(*RED, int(255 * a)))
    d.text((x0 + 124, y0 + 20), s, font=F_SB, fill=(255, 255, 255, int(255 * a)))
    if p != 1:
        lay = lay.resize((int(W * p), int(H * p)), Image.LANCZOS); tmp = Image.new("RGBA", (W, H), (0, 0, 0, 0)); tmp.paste(lay, (int(W / 2 - W * p / 2), int((y0 + 45) * (1 - p)))); lay = tmp
    f.alpha_composite(lay)

def soon_card(f, t, t0=11.9, t1=16.1, avimg=None):
    if not (t0 <= t <= t1): return
    k = ease((t - t0) / .4) * (1 - ease((t - (t1 - .35)) / .35))
    x0 = W - int(560 * k) - 20 + 0; y0 = 90
    lay = Image.new("RGBA", (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(lay)
    d.rounded_rectangle((x0, y0, x0 + 540, y0 + 150), radius=18, fill=(16, 16, 20, 238))
    d.rounded_rectangle((x0 + 20, y0 + 18, x0 + 140, y0 + 50), radius=16, fill=(*ORANGE, 255))
    d.text((x0 + 34, y0 + 20), "YAKINDA", font=ImageFont.truetype("/usr/share/fonts/opentype/inter/Inter-Black.otf", 22), fill=(255, 255, 255))
    d.text((x0 + 20, y0 + 64), "Bu avatarı nasıl yaptım?", font=F_B, fill=(255, 255, 255))
    d.text((x0 + 22, y0 + 112), "ve kanalı yapay zekâya nasıl devrettim", font=F_M, fill=(200, 200, 205))
    f.alpha_composite(lay)

def subscribe(f, t, t0=16.2, t1=18.25):
    if not (t0 <= t <= t1): return
    p = back((t - t0) / .3); a = min(1, (t1 - t) / .25)
    clicked = t > 17.15
    lay = Image.new("RGBA", (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(lay)
    bw, bh = 470, 112; x0, y0 = W / 2 - (bw + 140) / 2, 690
    col = (90, 90, 95) if clicked else RED
    d.rounded_rectangle((x0, y0, x0 + bw, y0 + bh), radius=56, fill=(*col, int(250 * a)))
    s = "ABONE OLUNDU" if clicked else "ABONE OL"; f_ = ImageFont.truetype("/usr/share/fonts/opentype/inter/Inter-Black.otf", 46)
    tw = d.textlength(s, font=f_); d.text((x0 + bw / 2 - tw / 2, y0 + 28), s, font=f_, fill=(255, 255, 255, int(255 * a)))
    bx, by = x0 + bw + 30, y0
    d.ellipse((bx, by, bx + bh, by + bh), fill=(255, 255, 255, int(250 * a)))
    ring = 14 * math.sin((t - 17.3) * 30) * max(0, 1 - (t - 17.3) / .6) if t > 17.3 else 0
    cxb, cyb = bx + bh / 2, by + bh / 2
    bell = [(cxb - 26, cyb + 18), (cxb - 22, cyb - 10), (cxb, cyb - 30), (cxb + 22, cyb - 10), (cxb + 26, cyb + 18)]
    rot = math.radians(ring)
    bell = [(cxb + (x - cxb) * math.cos(rot) - (y - cyb) * math.sin(rot), cyb + (x - cxb) * math.sin(rot) + (y - cyb) * math.cos(rot)) for x, y in bell]
    d.polygon(bell, fill=(20, 20, 24, int(255 * a))); d.ellipse((cxb - 7, cyb + 18, cxb + 7, cyb + 32), fill=(20, 20, 24, int(255 * a)))
    # imleç
    if 16.6 < t < 17.6:
        u = ease((t - 16.6) / .5); cx_ = x0 + bw * .7 + (1 - u) * 260; cy_ = y0 + bh * .6 + (1 - u) * 200
        cur = [(cx_, cy_), (cx_, cy_ + 54), (cx_ + 14, cy_ + 40), (cx_ + 26, cy_ + 66), (cx_ + 36, cy_ + 61), (cx_ + 24, cy_ + 36), (cx_ + 42, cy_ + 36)]
        d.polygon(cur, fill=(255, 255, 255, 255), outline=(10, 10, 10, 255))
        if 17.1 < t < 17.35:
            rr = 30 + 160 * (t - 17.1); d.ellipse((cx_ - rr / 2, cy_ - rr / 2, cx_ + rr / 2, cy_ + rr / 2), outline=(255, 255, 255, int(200 * (1 - (t - 17.1) / .25))), width=5)
    if p != 1:
        lay = lay.resize((int(W * p), int(H * p)), Image.LANCZOS); tmp = Image.new("RGBA", (W, H), (0, 0, 0, 0)); tmp.paste(lay, (int(W / 2 - W * p / 2), int((y0 + bh / 2) * (1 - p)))); lay = tmp
    f.alpha_composite(lay)

# ---------- kare kare kurgu ----------
av = Reader(f"{D}/av1080.mp4"); brs = [Reader(p) for p in parts]; bout = Reader(f"{D}/bout.mp4")
enc = subprocess.Popen(["ffmpeg", "-y", "-v", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
                        "-c:v", "libx264", "-preset", "medium", "-crf", "16", "-pix_fmt", "yuv420p", f"{D}/video_only.mp4"], stdin=subprocess.PIPE)
for i in range(N):
    t = i / FPS
    a_img = av.next()
    if t < T_OUT:
        base = zoom(a_img, zoom_at(t))
        if 8.84 <= t < 9.0 or 9.68 <= t < 9.85 or 10.42 <= t < 10.55:
            base = glitch(base, 1.0, i)
        if B0 <= t < B1:
            k = min(len(brs) - 1, int((t - B0) / seg)); b = brs[k].next()
            u = (t - B0 - k * seg) / seg
            base = zoom(b, 1.0 + .06 * u, .5, .5)
            if (t - B0 - k * seg) < 1 / FPS * 2: base = Image.blend(base, Image.new("RGB", (W, H), (255, 255, 255)), .35)   # kesme parlaması
        if t >= 19.3:   # çıkışta hareket bulanıklığı
            u = ease((t - 19.3) / .65)
            if u > .05: base = base.filter(ImageFilter.GaussianBlur(10 * u))
    else:
        b = bout.next(); u = (t - T_OUT) / OUTRO
        base = zoom(b, 1.25 - .25 * ease(u * 2), .5, .5)
        if u < .25: base = Image.blend(base, Image.new("RGB", (W, H), (255, 255, 255)), .7 * (1 - u / .25))
        if u > .75: base = Image.blend(base, Image.new("RGB", (W, H), (0, 0, 0)), (u - .75) / .25)
    f = base.convert("RGBA")
    if t < T_OUT:
        if B0 <= t < B1: pip(f, a_img, t)
        name_tag(f, t, .25, .98); name_tag(f, t, 6.1, 8.35)
        pop_text(f, t, "ÜCRETSİZ", 2.62, 3.70, y=420, col=(255, 255, 255), rot=-4)
        pop_text(f, t, "SADECE CLAUDE", 3.84, 5.30, y=420, col=ORANGE, rot=3)
        ai_badge(f, t); soon_card(f, t); subscribe(f, t)
        captions(f, t)
    enc.stdin.write(f.convert("RGB").tobytes())
enc.stdin.close(); enc.wait()

# ---------- ses: konuşma + müzik + efektler ----------
sr = 48000; n = int(TOTAL * sr)
raw = subprocess.check_output(["ffmpeg", "-v", "error", "-i", SRC, "-af", "loudnorm=I=-14:TP=-1.5:LRA=11", "-ac", "1", "-ar", str(sr), "-f", "s16le", "-"])
voice = np.zeros(n); v = np.frombuffer(raw, np.int16).astype(np.float64) / 32768; voice[:min(n, len(v))] = v[:n]
tt = np.arange(n) / sr; mus = np.zeros(n)
chords = [(146.83, 220.0, 293.66, 349.23), (116.54, 174.61, 233.08, 293.66), (130.81, 196.0, 261.63, 329.63), (110.0, 164.81, 220.0, 277.18)]
beat = 60 / 100
for k in range(int(TOTAL / (beat * 4)) + 1):
    fr = chords[k % 4]; i0 = int(k * beat * 4 * sr); L = min(n - i0, int(beat * 4.5 * sr))
    if L <= 0: continue
    s_ = np.arange(L) / sr; env = np.minimum(1, s_ / .3) * np.exp(-s_ * .35)
    mus[i0:i0 + L] += sum(np.sin(2 * np.pi * f_ * s_) for f_ in fr) * env * .03
    for j in range(8):
        p0 = i0 + int(j * beat / 2 * sr); Lp = min(n - p0, int(.25 * sr))
        if Lp <= 0: continue
        ps = np.arange(Lp) / sr; mus[p0:p0 + Lp] += np.sin(2 * np.pi * fr[(j * 3) % 4] * 2 * ps) * np.exp(-ps * 14) * .05
        if j % 2 == 0: mus[p0:p0 + Lp] += np.random.default_rng(j + k).normal(0, 1, Lp) * np.exp(-ps * 60) * .03
duck = 1 - .55 * np.clip(np.convolve(np.abs(voice), np.ones(int(.25 * sr)) / int(.25 * sr), "same") / .03, 0, 1)
mus *= duck * np.minimum(1, tt / .5) * np.clip((TOTAL - tt) / .5, 0, 1)
fx = np.zeros(n); rng = np.random.default_rng(3)
def add(sig, t0, g=1.):
    i = int(t0 * sr); j = min(n, i + len(sig))
    if j > i: fx[i:j] += sig[:j - i] * g
def whoosh(d=.45):
    m = int(d * sr); s_ = np.arange(m) / sr; nz = rng.normal(0, 1, m)
    nz = np.convolve(nz, np.ones(12) / 12, "same"); return nz * np.sin(np.pi * s_ / d) ** 2 * .35
def pop():
    m = int(.12 * sr); s_ = np.arange(m) / sr; return np.sin(2 * np.pi * (500 + 1200 * s_ / .12) * s_) * np.exp(-s_ * 35) * .4
def click():
    m = int(.04 * sr); s_ = np.arange(m) / sr; return (np.sin(2 * np.pi * 2800 * s_) + rng.normal(0, .5, m)) * np.exp(-s_ * 150) * .45
def glitchs(d=.16):
    m = int(d * sr); s_ = np.arange(m) / sr; return np.sign(np.sin(2 * np.pi * 90 * s_)) * rng.normal(0, 1, m) * .18
def ding():
    m = int(.8 * sr); s_ = np.arange(m) / sr; return (np.sin(2 * np.pi * 1318 * s_) + .5 * np.sin(2 * np.pi * 1976 * s_)) * np.exp(-s_ * 5) * .15
add(whoosh(), B0 - .2); [add(pop(), B0 + k * seg, .5) for k in range(1, len(BROLL))]
add(pop(), 2.62); add(pop(), 3.84); add(whoosh(.35), B1 - .1)
for t0 in (8.84, 9.68, 10.42): add(glitchs(), t0, 1.)
add(pop(), 11.9, .7); add(pop(), 16.2); add(click(), 17.15); add(ding(), 17.3)
add(whoosh(.7), 19.3, 1.3)
mix = voice * 1.0 + mus + fx
mix = mix / max(1, np.abs(mix).max() / .95)
st = (np.stack([mix, mix], 1) * 32767).astype(np.int16)
with wave.open(f"{D}/ses.wav", "wb") as wf: wf.setnchannels(2); wf.setsampwidth(2); wf.setframerate(sr); wf.writeframes(st.tobytes())
OUT = "/home/user/analiz/video_teslim/BerkAI_Giris_Edit.mp4"
sh(f'ffmpeg -v error -y -i {D}/video_only.mp4 -i {D}/ses.wav -map 0:v -map 1:a -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p -c:a aac -b:a 192k -shortest -movflags +faststart {OUT}')
print("ok", OUT)
