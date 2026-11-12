# BerkAİ Reel 1 v3 — bölünmüş ekran: üstte açık renk hareketli grafik (ekip düğüm şeması, kartlar, yorum/DM), altta göğüsten çekim avatar.
import json, re, glob, subprocess, wave, os, math
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter
SP = "/tmp/claude-0/-home-user-analiz/15f5e81a-2f5a-535e-8b53-dec004b93200/scratchpad"; V4 = f"{SP}/v4"
REC = f"{SP}/kayit2/k.mp4"; AVP = f"{V4}/reel1g_av.mp4"
PRJ = "/home/user/analiz/kanal/projeler/berkai-studyo"; FA = "/home/user/analiz/kanal/arac/vid/assets/fonts/"
OUT = "/home/user/analiz/video_teslim/BerkAI_Reel1_Ofis.mp4"
W, H, FPS = 1080, 1920, 30; TOPH = 900
BG = (246, 244, 240); INK = (24, 22, 28); GREY = (150, 145, 138); ORANGE = (245, 130, 40); LINE = (214, 208, 198)
_fc = {}
def F(p, s):
    if (p, s) not in _fc: _fc[(p, s)] = ImageFont.truetype(p, s)
    return _fc[(p, s)]
SANS = FA + "InterTight800.ttf"; SANS6 = FA + "InterTight600.ttf"; SERIF = FA + "InstrumentSerifItalic.ttf"; MONO = FA + "JBMono.ttf"
def ease(p): p = max(0, min(1, p)); return 1 - (1 - p) ** 3
def spring(p): p = max(0, min(1, p)); return 1 - math.exp(-6 * p) * math.cos(9 * p)
D = float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", AVP]))
TOTAL = D + 1.8; N = int(TOTAL * FPS)
WD = json.load(open(f"{V4}/reel1g_stt.json"))
def nrm(s): return re.sub(r"[^\wçğıöşüâ]", "", s.lower())
def cue(w, n=1, d=-.08):
    c = 0
    for x in WD:
        if nrm(x["w"]) == w:
            c += 1
            if c == n: return x["s"] + d
    print("cue yok", w, n); return 0
FX, FY, CW = float(os.environ.get("FX", "540")), float(os.environ.get("FY", "700")), float(os.environ.get("CW", "760"))

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
PROMPT = [re.sub(r"\*\*|`", "", l) for l in open(f"{PRJ}/PROMPT.md").read().split("\n")[2:] if l.strip()][:6]

def office(t0, cx=.5):
    """Kullanıcının ofis kaydı, üst alanı tam kaplar."""
    if t0 not in RR: RR[t0] = Reader(REC, (1920, 812), t0)
    im = RR[t0].next(); sc = TOPH / 812 * 1.06; im = im.resize((int(1920 * sc), int(812 * sc)), Image.BILINEAR)
    x0 = int(min(max(0, cx * im.width - W / 2), im.width - W)); y0 = (im.height - TOPH) // 2
    return im.crop((x0, y0, x0 + W, y0 + TOPH))
def soft_office(t0):
    im = office(t0); s_ = im.resize((W // 8, TOPH // 8), Image.BILINEAR).filter(ImageFilter.GaussianBlur(2)).resize((W, TOPH), Image.BILINEAR)
    return Image.blend(s_, Image.new("RGB", (W, TOPH), BG), .55)
def label(g, txt, t, t0):
    p = ease((t - t0) / .3); lay = Image.new("RGBA", (W, TOPH), (0, 0, 0, 0)); d = ImageDraw.Draw(lay); fn = F(MONO, 30)
    tw = d.textlength(txt, font=fn); x = 40 + int((1 - p) * -40)
    d.rounded_rectangle((x, 40, x + tw + 70, 100), radius=30, fill=(16, 14, 12, int(215 * p)))
    d.ellipse((x + 22, 61, x + 40, 79), fill=(*ORANGE, int(255 * p))); d.text((x + 52, 50), txt, font=fn, fill=(255, 255, 255, int(255 * p)))
    g.alpha_composite(lay)
def shade(g):
    if "sh" not in _fc:
        m = Image.new("RGBA", (W, TOPH), (0, 0, 0, 0)); d = ImageDraw.Draw(m)
        for y in range(TOPH - 330, TOPH): d.line((0, y, W, y), fill=(0, 0, 0, int(170 * ((y - (TOPH - 330)) / 330) ** 1.5)))
        _fc["sh"] = m
    g.alpha_composite(_fc["sh"])

# ---- üst alan zemini
def top_bg():
    if "bg" in _fc: return _fc["bg"].copy()
    g = Image.new("RGB", (W, TOPH), BG); d = ImageDraw.Draw(g)
    for x in range(30, W, 44):
        for y in range(30, TOPH, 44): d.ellipse((x - 1.6, y - 1.6, x + 1.6, y + 1.6), fill=(228, 224, 216))
    _fc["bg"] = g; return g.copy()

TEAMS = [("KONU", (190, 170)), ("YAPIM", (890, 190)), ("MÜŞTERİ", (165, 400)), ("3D SİTE", (915, 420)), ("MAİL", (300, 630)), ("MÜDÜR", (780, 640))]
CX, CY = 540, 400
def diagram(g, t, acts, t0):
    lay = Image.new("RGBA", (W, TOPH), (0, 0, 0, 0)); d = ImageDraw.Draw(lay)
    a0 = ease((t - t0) / .4)
    # bağlantılar
    for k, (nm, (x, y)) in enumerate(TEAMS):
        on = acts[k] is not None and t >= acts[k]
        d.line((CX, CY, x, y), fill=((*ORANGE, 255) if on else (*LINE, int(255 * a0))), width=4 if on else 3)
    # parıltı + halka
    gl = Image.new("RGBA", (W, TOPH), (0, 0, 0, 0)); dg = ImageDraw.Draw(gl)
    pulse = 1 + .05 * math.sin(t * 3)
    dg.ellipse((CX - 260 * pulse, CY - 260 * pulse, CX + 260 * pulse, CY + 260 * pulse), fill=(*ORANGE, int(40 * a0)))
    lay.alpha_composite(gl.filter(ImageFilter.GaussianBlur(40)))
    d.ellipse((CX - 230, CY - 230, CX + 230, CY + 230), outline=(*ORANGE, int(160 * a0)), width=4)
    r = 90 * spring((t - t0) / .6); d.ellipse((CX - r, CY - r, CX + r, CY + r), fill=(*ORANGE, 255))
    if r > 40: tw = d.textlength("B", font=F(SANS, 96)); d.text((CX - tw / 2, CY - 62), "B", font=F(SANS, 96), fill=(255, 255, 255, 255))
    for k, (nm, (x, y)) in enumerate(TEAMS):
        p = spring((t - t0 - .15 - k * .08) / .5)
        if p <= .02: continue
        on = acts[k] is not None and t >= acts[k]; pa = ease((t - acts[k]) / .25) if on else 0
        fn = F(SANS, 34); tw = d.textlength(nm, font=fn); bw = tw + 100; s_ = .8 + .2 * min(1.05, p) + .08 * pa * (1 - ease((t - acts[k] - .25) / .4) if on else 0)
        bx0, by0 = x - bw * s_ / 2, y - 40 * s_
        d.rounded_rectangle((bx0 + 3, by0 + 8, bx0 + bw * s_ + 3, by0 + 80 * s_ + 8), radius=40 * s_, fill=(0, 0, 0, 25))
        d.rounded_rectangle((bx0, by0, bx0 + bw * s_, by0 + 80 * s_), radius=40 * s_, fill=((*INK, 255) if on else (255, 255, 255, 255)), outline=(*LINE, 255), width=2)
        d.ellipse((bx0 + 24 * s_, by0 + 26 * s_, bx0 + 52 * s_, by0 + 54 * s_), fill=((*ORANGE, 255) if on else (220, 216, 208, 255)))
        d.text((bx0 + 70 * s_, by0 + 18 * s_), nm, font=F(SANS, int(34 * s_)), fill=((255, 255, 255, 255) if on else (*GREY, 255)))
    g.alpha_composite(lay)

def window(g, im, t, t0, tag="", maxw=940, maxh=640, cy=410):
    sc = min(maxw / im.width, maxh / im.height); w, h = int(im.width * sc), int(im.height * sc); im = im.resize((w, h), Image.LANCZOS)
    p = spring((t - t0) / .55); s_ = .88 + .12 * min(1.03, p)
    tile = Image.new("RGBA", (w + 80, h + 100), (0, 0, 0, 0)); dt = ImageDraw.Draw(tile)
    dt.rounded_rectangle((40, 56, 40 + w, 56 + h), radius=30, fill=(0, 0, 0, 60)); tile = tile.filter(ImageFilter.GaussianBlur(18)); dt = ImageDraw.Draw(tile)
    dt.rounded_rectangle((34, 34, 46 + w, 46 + h), radius=34, fill=(255, 255, 255, 255))
    m = Image.new("L", (w, h), 0); ImageDraw.Draw(m).rounded_rectangle((0, 0, w - 1, h - 1), radius=28, fill=255); tile.paste(im, (40, 40), m)
    if tag:
        fn = F(MONO, 24); tw = dt.textlength(tag.upper(), font=fn); dt.rounded_rectangle((60, 60, 60 + tw + 34, 104), radius=22, fill=(20, 18, 16, 215)); dt.text((77, 67), tag.upper(), font=fn, fill=(255, 255, 255, 255))
    tile = tile.resize((int(tile.width * s_), int(tile.height * s_)), Image.BILINEAR)
    a = min(1, p * 1.5)
    if a < 1: tile.putalpha(tile.getchannel("A").point(lambda v: int(v * a)))
    g.alpha_composite(tile, (int(W / 2 - tile.width / 2), int(cy - tile.height / 2)))

def paper(u):
    g = Image.new("RGB", (1000, 640), (255, 255, 255)); d = ImageDraw.Draw(g)
    for i, col in enumerate(((235, 95, 80), (240, 190, 70), (110, 190, 110))): d.ellipse((36 + i * 30, 30, 54 + i * 30, 48), fill=col)
    d.text((150, 22), "PROMPT.md · tek komut", font=F(MONO, 26), fill=(150, 140, 128)); d.line((0, 74, 1000, 74), fill=(232, 226, 216), width=2)
    chars = int(u * 140); y = 100; fn = F(SANS6, 32)
    for ln in PROMPT:
        cur = ""; parts = []
        for w in ln.split():
            if d.textlength(cur + " " + w, font=fn) > 900: parts.append(cur); cur = w
            else: cur = (cur + " " + w).strip()
        parts.append(cur)
        for p in parts:
            if chars <= 0 or y > 590: break
            d.text((50, y), p[:chars], font=fn, fill=INK); chars -= len(p); y += 46
        y += 8
    return g
def listcard(title, rows, u):
    g = Image.new("RGB", (1000, 640), (255, 255, 255)); d = ImageDraw.Draw(g)
    d.text((56, 34), title, font=F(SERIF, 84), fill=INK)
    for i, (h1, h2) in enumerate(rows):
        p = ease((u - .25 - i * .45) / .3)
        if p <= 0: continue
        y = 170 + i * 150; x = 50 + int((1 - p) * 40)
        d.rounded_rectangle((x, y, 950, y + 130), radius=28, fill=(246, 244, 240))
        d.ellipse((x + 26, y + 35, x + 86, y + 95), fill=ORANGE); d.line([(x + 42, y + 65), (x + 53, y + 77), (x + 72, y + 53)], fill=(255, 255, 255), width=6)
        d.text((x + 112, y + 16), h1, font=F(SANS, 46), fill=INK); d.text((x + 112, y + 74), h2, font=F(SANS6, 32), fill=GREY)
    return g

ACCENT = {"şirket", "gerçekten", "komut", "senaryo", "3d", "mail", "rapor", "ben", "kod", "ofis", "kurdurdum", "kötü", "işine", "onaylarsın", "kendi"}
GR = []; cur = []
for x in WD:
    cur.append(x)
    if len(cur) >= 4 or x["w"].endswith((".", ",", "?")): GR.append(cur); cur = []
if cur: GR.append(cur)
def caption(g, t, light=False):
    gr = next((q for q in GR if q[0]["s"] - .08 <= t <= q[-1]["e"] + .3), None)
    if not gr: return
    lay = Image.new("RGBA", (W, TOPH), (0, 0, 0, 0)); d = ImageDraw.Draw(lay)
    ws = []
    for x in gr:
        w = x["w"].rstrip(".,?"); acc = nrm(w) in ACCENT; ws.append((w.lower() if acc else w, F(SERIF, 70) if acc else F(SANS, 52), acc, x["s"]))
    sp = 16; wd_ = [d.textlength(w, font=fn) for w, fn, a, s in ws]; tot = sum(wd_) + sp * (len(ws) - 1); x = W / 2 - tot / 2; y = 800
    for (w, fn, acc, s), ww in zip(ws, wd_):
        p = ease((t - s + .04) / .14)
        col = ORANGE if acc else (INK if light else (255, 255, 255)); yy = y - (10 if acc else 0) + int((1 - p) * 14)
        if p > 0:
            if not light: d.text((x + 2, yy + 4), w, font=fn, fill=(0, 0, 0, int(150 * p)))
            d.text((x, yy), w, font=fn, fill=(*col, int(255 * p)))
        x += ww + sp
    g.alpha_composite(lay)

def hook(g, t):
    a = min(1, (cue("tek") - t) / .3); lay = Image.new("RGBA", (W, TOPH), (0, 0, 0, 0)); d = ImageDraw.Draw(lay)
    p1 = ease(t / .35); p2 = ease((t - .35) / .35)
    s1 = "17 çalışan."; f1 = F(SANS, 150); tw = d.textlength(s1, font=f1); d.text((W / 2 - tw / 2 + 3, 236 + int((1 - p1) * 40)), s1, font=f1, fill=(0, 0, 0, int(140 * p1 * a))); d.text((W / 2 - tw / 2, 230 + int((1 - p1) * 40)), s1, font=f1, fill=(255, 255, 255, int(255 * p1 * a)))
    s2 = "0 insan."; f2 = F(SERIF, 190); tw = d.textlength(s2, font=f2); d.text((W / 2 - tw / 2 + 3, 406 + int((1 - p2) * 40)), s2, font=f2, fill=(0, 0, 0, int(150 * p2 * a))); d.text((W / 2 - tw / 2, 400 + int((1 - p2) * 40)), s2, font=f2, fill=(*ORANGE, int(255 * p2 * a)))
    g.alpha_composite(lay)
def question(g, t, t0):
    p = ease((t - t0) / .35); lay = Image.new("RGBA", (W, TOPH), (0, 0, 0, 0)); d = ImageDraw.Draw(lay)
    for s, fn, col, y in (("peki senin", F(SANS, 96), INK, 250), ("ne işine yarar?", F(SERIF, 140), ORANGE, 370)):
        tw = d.textlength(s, font=fn); d.text((W / 2 - tw / 2, y + int((1 - p) * 30)), s, font=fn, fill=(*col, int(255 * p)))
    g.alpha_composite(lay)
SFX = []
def cta(g, t, u):
    lay = Image.new("RGBA", (W, TOPH), (0, 0, 0, 0)); d = ImageDraw.Draw(lay)
    p = ease(u / .4); s = "yoruma yaz"; fn = F(SERIF, 130); tw = d.textlength(s, font=fn); d.text((W / 2 - tw / 2, 330 + int((1 - p) * 30)), s, font=fn, fill=(*INK, int(255 * p)))
    p2 = spring((u - .3) / .6); bx0, by0 = 80, 520 + int((1 - min(1, p2)) * 50)
    if p2 > .02:
        d.rounded_rectangle((bx0 + 3, by0 + 10, W - 80 + 3, by0 + 150 + 10), radius=75, fill=(0, 0, 0, 30))
        d.rounded_rectangle((bx0, by0, W - 80, by0 + 150), radius=75, fill=(255, 255, 255, 255), outline=(*LINE, 255), width=2)
        d.ellipse((bx0 + 24, by0 + 25, bx0 + 124, by0 + 125), fill=(238, 234, 226, 255)); d.text((bx0 + 54, by0 + 46), "B", font=F(SANS, 48), fill=(90, 80, 70, 255))
        typed = "OFİS"[:max(0, int((u - .9) / .12))]
        if typed:
            d.text((bx0 + 160, by0 + 34), typed, font=F(SANS, 76), fill=(*INK, 255))
            if len(typed) < 4 and int(u * 8) % 2 == 0: SFX.append((round(t, 2), "tik"))
        else: d.text((bx0 + 160, by0 + 48), "Yorum ekle…", font=F(SANS6, 50), fill=(*GREY, 255))
        if typed == "OFİS":
            d.ellipse((W - 80 - 130, by0 + 22, W - 80 - 24, by0 + 128), fill=(*ORANGE, 255))
            d.polygon([(W - 80 - 96, by0 + 52), (W - 80 - 50, by0 + 75), (W - 80 - 96, by0 + 98), (W - 80 - 86, by0 + 75)], fill=(255, 255, 255, 255))
    u3 = u - 1.8
    if u3 > 0:
        p3 = spring(u3 / .6); ny = int(-200 + 260 * min(1.04, p3))
        d.rounded_rectangle((60, ny + 8, W - 60, ny + 198), radius=46, fill=(0, 0, 0, 30))
        d.rounded_rectangle((60, ny, W - 60, ny + 190), radius=46, fill=(255, 255, 255, 255), outline=(*LINE, 255), width=2)
        d.rounded_rectangle((96, ny + 40, 206, ny + 150), radius=30, fill=(*ORANGE, 255)); d.text((129, ny + 58), "B", font=F(SANS, 64), fill=(255, 255, 255, 255))
        d.text((236, ny + 36), "berka.ai", font=F(SANS, 46), fill=(*INK, 255)); d.text((W - 230, ny + 42), "şimdi", font=F(SANS6, 36), fill=(*GREY, 255))
        d.text((236, ny + 100), "Komutun tamamı DM'inde", font=F(SANS6, 44), fill=(90, 84, 78, 255))
        if abs(u3) < .5 / FPS: SFX.append((round(t, 2), "pop"))
    g.alpha_composite(lay)

# ---- zaman planı
T_TEK, T_B = cue("tek"), [cue("biri", i) for i in range(1, 6)]
T_AKS, T_SON, T_PEKI, T_KAFE, T_ARA, T_KOD, CTA = cue("akşam"), cue("son"), cue("peki"), cue("kafe"), cue("araştırma"), cue("kod"), cue("komutun")
ACTS = [T_B[0], T_B[1], T_B[2], T_B[3], T_B[4], T_AKS]
PUNCH = [cue("ve"), T_SON, T_PEKI, T_KOD]
for ts in [T_TEK, T_B[0], T_AKS + 2.0, T_PEKI, T_KAFE, T_ARA, T_KOD]: SFX.append((ts, "pop"))

enc = subprocess.Popen(["ffmpeg", "-y", "-v", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
                        "-vf", "eq=contrast=1.03:saturation=1.05", "-c:v", "libx264", "-preset", "medium", "-crf", "17", "-pix_fmt", "yuv420p", f"{V4}/reel1o_video.mp4"], stdin=subprocess.PIPE)
PREV = [float(x) for x in os.environ.get("PREV", "").split(",") if x]
CH = (H - TOPH) / W
for i in range(N):
    t = i / FPS; av = AV.next()
    # alt: göğüsten çekim
    z = 1.0 + .006 * (1 + math.sin(t * .7))
    for pt in PUNCH:
        if pt <= t < pt + 1.5: z += .035
    cw = CW / z; ch = cw * CH; ox = 5 * math.sin(t * 1.3); oy = 4 * math.cos(t * 1.1)
    x0 = min(max(0, FX - cw / 2 + ox), W - cw); y0 = min(max(0, FY - ch * .42 + oy), H - ch)
    bot = av.crop((int(x0), int(y0), int(x0 + cw), int(y0 + ch))).resize((W, H - TOPH), Image.LANCZOS)
    f = Image.new("RGB", (W, H), BG); f.paste(bot, (0, TOPH))
    g = top_bg().convert("RGBA")
    if t < CTA:
        TEAMREC = [(3.4, .42, "KONU EKİBİ"), (44.0, .5, "YAPIM EKİBİ"), (88.0, .5, "MÜŞTERİ BULMA"), (118.0, .55, "3D SİTE EKİBİ"), (148.0, .5, "MAİL EKİBİ")]
        if t < T_TEK: g.paste(office(0.3), (0, 0)); g.alpha_composite(Image.new("RGBA", (W, TOPH), (0, 0, 0, 70))); shade(g); hook(g, t)
        elif t < T_B[0]: g.paste(soft_office(30.0), (0, 0)); window(g, paper(t - T_TEK), t, T_TEK, "", 960, 620, 400)
        elif t < T_AKS:
            k = max(j for j in range(5) if t >= T_B[j]); r0, cx, nm = TEAMREC[k]
            g.paste(office(r0, cx), (0, 0)); shade(g); label(g, nm, t, T_B[k])
        elif t < T_SON: g.paste(office(189.0, .5), (0, 0)); shade(g); label(g, "MÜDÜR ODASI", t, T_AKS)
        elif t < T_PEKI: diagram(g, t, [T_SON - 1] * 6, T_SON)
        elif t < T_KAFE: g.paste(office(0.8, .5), (0, 0)); g.alpha_composite(Image.new("RGBA", (W, TOPH), (*BG, 205))); question(g, t, T_PEKI)
        elif t < T_ARA: g.paste(soft_office(120.0), (0, 0)); window(g, listcard("senin işinde", [("Kafe", "rakip menü + yorum → paylaşım fikri"), ("Emlakçı", "mahalle mahalle ilan takibi"), ("Serbest çalışan", "müşteri adayı + teklif taslağı")], t - T_ARA + (T_ARA - T_KAFE) if False else t - T_KAFE), t, T_KAFE, "", 960, 620, 400)
        elif t < T_KOD: g.paste(office(119.0, .55), (0, 0)); shade(g); label(g, "HER SABAH HAZIR", t, T_ARA)
        else: g.paste(office(216.0, .5), (0, 0)); shade(g); label(g, "BERKAİ STÜDYO · İSTANBUL", t, T_KOD)
        if t >= T_TEK: caption(g, t, light=(T_B[0] > t) or (T_SON <= t < T_ARA))
    else: g.paste(soft_office(2.0), (0, 0)); cta(g, t, t - CTA)
    f.paste(g.convert("RGB"), (0, 0))
    if PREV:
        if any(abs(t - p) < .5 / FPS for p in PREV): f.save(f"{V4}/r3_{t:05.1f}.jpg", quality=80)
        if t > max(PREV): break
        continue
    enc.stdin.write(f.tobytes())
if PREV: raise SystemExit
enc.stdin.close(); enc.wait()
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
with wave.open(f"{V4}/reel1o.wav", "wb") as wf: wf.setnchannels(2); wf.setsampwidth(2); wf.setframerate(sr); wf.writeframes(st.tobytes())
subprocess.run(f"ffmpeg -v error -y -i {V4}/reel1o_video.mp4 -i {V4}/reel1o.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -shortest -movflags +faststart {OUT}", shell=True, check=True)
print("ok", OUT, round(TOTAL, 1))
