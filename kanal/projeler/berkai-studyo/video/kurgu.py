# BerkAİ: "Yapay zekâ ofisi" videosu — 3 HeyGen klibi + ofis turu + demo siteler + kartlar
import json, math, os, subprocess, wave, glob, re
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

S = "/tmp/claude-0/-home-user-analiz/15f5e81a-2f5a-535e-8b53-dec004b93200/scratchpad"
D = f"{S}/sirket_video"
UP = "/root/.claude/uploads/15f5e81a-2f5a-535e-8b53-dec004b93200"
CLIPS = [glob.glob(f"{UP}/e79fc98a-*")[0], glob.glob(f"{UP}/122644e6-*")[0], glob.glob(f"{UP}/25d9e23b-*")[0]]
W, H, FPS = 1920, 1080, 30
ORANGE = (242, 140, 40); RED = (225, 30, 35); INK = (16, 16, 20)
IB = "/usr/share/fonts/opentype/inter/Inter-Black.otf"; IBo = "/usr/share/fonts/opentype/inter/Inter-Bold.otf"; IM = "/usr/share/fonts/opentype/inter/Inter-Medium.otf"
ANTON = "/home/user/analiz/kanal/arac/vid/assets/fonts/Anton.ttf"
def F(p, s): return ImageFont.truetype(p, s)
F_CAP = F(IB, 70)
def sh(c): subprocess.run(c, shell=True, check=True)
def dur(p): return float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", p]))
def ease(p): p = max(0, min(1, p)); return 1 - (1 - p) ** 3
def back(p, s=1.7): p = max(0, min(1, p)); return max(.03, 1 + (s + 1) * (p - 1) ** 3 + s * (p - 1) ** 2)

# ---------- konuşma kelimeleri (STT) + düzeltmeler ----------
FIX = {"3D kural": "3 kural", "çıktığı": "çıktıyı", "şort.": "Shorts.", "direk": "direkt"}
def words(i):
    d = json.load(open(f"{D}/stt{i}.json")); ws = [dict(w) for w in d["words"] if w.get("type", "word") == "word"]
    out = []
    for w in ws:
        if w["text"].startswith("'") and out: out[-1]["text"] += w["text"].replace("'", "")
        else: out.append(w)
    for a, w in enumerate(out):
        if w["text"] == "3D" and a + 1 < len(out) and out[a + 1]["text"] == "kural": w["text"] = "3"
        if w["text"] == "çıktığı": w["text"] = "çıktıyı"
        if w["text"] == "şort.": w["text"] = "Shorts."
        if w["text"] == "direk": w["text"] = "direkt"
        if w["text"] == "Mailler" or w["text"].startswith("Maillar") or w["text"] == "Maillar": pass
        w["text"] = w["text"].replace("Maillar", "Mailler").replace("maillar", "mailler").replace("Fablea", "Fable'a")
    return out

# ---------- zaman çizelgesi ----------
D1, D2, D3 = (dur(c) for c in CLIPS)
A0 = 0.0; B0 = A0 + D1; C0 = B0 + D2; V_END = C0 + D3
# sessiz bölümler (müzik + yazı)
SEC = []
t = V_END
for ad, sure in (("musteri", 17.0), ("site", 30.0), ("mail", 9.0), ("mudur", 17.0), ("son", 11.0)):
    SEC.append((ad, t, t + sure)); t += sure
TOTAL = t; N = int(round(TOTAL * FPS))
SECD = {a: (b, e) for a, b, e in SEC}
print("toplam", round(TOTAL, 1))

# ---------- kaynaklar ----------
for i, c in enumerate(CLIPS):
    o = f"{D}/av{i + 1}.mp4"
    if not os.path.exists(o):
        sh(f'ffmpeg -v error -y -i "{c}" -vf "scale={W}:{H}:flags=lanczos,fps={FPS}" -an -c:v libx264 -preset veryfast -crf 14 {o}')

class Reader:
    def __init__(self, path):
        self.p = subprocess.Popen(["ffmpeg", "-v", "error", "-i", path, "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], stdout=subprocess.PIPE); self.last = None
    def next(self):
        b = self.p.stdout.read(W * H * 3)
        if len(b) == W * H * 3: self.last = Image.frombytes("RGB", (W, H), b)
        return self.last

TOUR_FPS = 12
TOUR = sorted(glob.glob(f"{D}/ofis/f_*.jpg")); DEMO1 = sorted(glob.glob(f"{D}/demo1/f_*.jpg")); DEMO2 = sorted(glob.glob(f"{D}/demo2/f_*.jpg"))
_cache = {}
def img(path):
    if path not in _cache:
        if len(_cache) > 40: _cache.clear()
        _cache[path] = Image.open(path).convert("RGB")
    return _cache[path]

# Gizlenecek bölgeler (işletme adları, adresler) — tur saniyesine göre
BLUR = []; REC_BLUR = []; DEMO1_T0 = 4.0; DEMO2_T0 = 2.0
exec(open(f"{D}/blur.py").read()) if os.path.exists(f"{D}/blur.py") else None
def blur_regions(im, regs):
    for (x0, y0, x1, y1) in regs:
        box = im.crop((x0, y0, x1, y1)).resize((max(1, (x1 - x0) // 24), max(1, (y1 - y0) // 24)), Image.BILINEAR).resize((x1 - x0, y1 - y0), Image.BILINEAR).filter(ImageFilter.GaussianBlur(6))
        im.paste(box, (x0, y0))
    return im
def tour(ts):
    k = min(len(TOUR) - 1, max(0, int(round(ts * TOUR_FPS))))
    im = img(TOUR[k]).copy()
    for t0, t1, regs in BLUR:
        if t0 <= ts < t1: blur_regions(im, regs)
    return im
RECF = sorted(glob.glob(f"{S}/kullanici_kayit/f/f_*.jpg"))
def rec(ts):
    k = min(len(RECF) - 1, max(0, int(round(ts * 30))))
    im = img(RECF[k]).copy()
    for t0, t1, regs in REC_BLUR:
        if t0 <= ts < t1: blur_regions(im, regs)
    return im
def demo(lst, ts, regs=()):
    k = min(len(lst) - 1, max(0, int(round(ts * 15))))
    im = img(lst[k]).copy()
    return blur_regions(im, regs)

def zoom(im, z, cx=.5, cy=.5):
    if abs(z - 1) < 1e-3: return im
    w, h = W / z, H / z; x0 = min(max(0, cx * W - w / 2), W - w); y0 = min(max(0, cy * H - h / 2), H - h)
    return im.crop((int(x0), int(y0), int(x0 + w), int(y0 + h))).resize((W, H), Image.LANCZOS)

# ---------- ekran öğeleri ----------
PIP_D = 400
def pip(f, avimg, t, t0, t1):
    size = PIP_D; cx, cy, r = 990, 600, 470
    face = avimg.crop((cx - r, cy - r, cx + r, cy + r)).resize((size, size), Image.LANCZOS)
    m = Image.new("L", (size * 2, size * 2), 0); ImageDraw.Draw(m).ellipse((0, 0, size * 2 - 1, size * 2 - 1), fill=255); m = m.resize((size, size), Image.LANCZOS)
    u = min(ease((t - t0) / .35), ease((t1 - t) / .3)); X = 24; Y = int(H - size + (1 - u) * (size + 20))
    sh_ = Image.new("RGBA", (W, H), (0, 0, 0, 0)); ImageDraw.Draw(sh_).ellipse((X - 6, Y - 6, X + size + 6, Y + size + 6), fill=(0, 0, 0, 120)); f.alpha_composite(sh_.filter(ImageFilter.GaussianBlur(14)))
    f.paste(face, (X, Y), m)

def lines_of(ws):
    L, cur = [], []
    for w in ws:
        cur.append(w)
        if w["text"].endswith((".", ",", "?")) or len(cur) >= 4: L.append(cur); cur = []
    if cur: L.append(cur)
    return L
LINES = []
for i, off in ((1, A0), (2, B0), (3, C0)):
    for ln in lines_of(words(i)):
        LINES.append([dict(w, start=w["start"] + off, end=w["end"] + off) for w in ln])

def captions(f, t, pip_on):
    d = ImageDraw.Draw(f)
    ln = next((l for l in LINES if l[0]["start"] - .08 <= t <= l[-1]["end"] + .2), None)
    if not ln: return
    txt = [w["text"].rstrip(".,") for w in ln]
    gap = 20; ws = [d.textlength(s, font=F_CAP) for s in txt]; tot = sum(ws) + gap * (len(ws) - 1)
    xc = W / 2
    if pip_on: xc = max(W / 2, 24 + PIP_D + 40 + tot / 2)
    x = xc - tot / 2; y = 880
    for w, s, ww in zip(ln, txt, ws):
        cur_ = w["start"] - .02 <= t <= w["end"] + .04
        d.text((x, y), s, font=F_CAP, fill=ORANGE if cur_ else (255, 255, 255), stroke_width=7, stroke_fill=(10, 10, 12)); x += ww + gap

def pop_text(f, t, s, t0, t1, y=420, col=(255, 255, 255), rot=-3, size=170):
    if not (t0 <= t <= t1 + .15): return
    p = back((t - t0) / .22); a = 1 - max(0, (t - t1) / .15)
    lay = Image.new("RGBA", (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(lay); fnt = F(ANTON, size)
    tw = d.textlength(s, font=fnt)
    d.text((W / 2 - tw / 2, y - size * .62), s, font=fnt, fill=(*col, int(255 * a)), stroke_width=12, stroke_fill=(10, 10, 12, int(255 * a)))
    lay = lay.rotate(rot, center=(W / 2, y), resample=Image.BICUBIC)
    if p != 1:
        lay = lay.resize((int(W * p), int(H * p)), Image.LANCZOS); tmp = Image.new("RGBA", (W, H), (0, 0, 0, 0)); tmp.paste(lay, (int(W / 2 - W * p / 2), int(H / 2 - H * p / 2))); lay = tmp
    f.alpha_composite(lay)

def name_tag(f, t, t0, t1):
    if not (t0 <= t <= t1): return
    a = min(1, (t - t0) / .3, (t1 - t) / .3); x0 = 80 - int((1 - ease((t - t0) / .35)) * 80)
    lay = Image.new("RGBA", (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(lay)
    d.rounded_rectangle((x0, 660, x0 + 470, 755), radius=14, fill=(*INK, int(235 * a))); d.rectangle((x0, 660, x0 + 12, 755), fill=(*ORANGE, int(255 * a)))
    d.text((x0 + 34, 670), "Berkay", font=F(IBo, 40), fill=(255, 255, 255, int(255 * a)))
    d.text((x0 + 34, 717), "BerkAİ · yapay zekâ ile projeler", font=F(IM, 26), fill=(215, 215, 220, int(255 * a)))
    f.alpha_composite(lay)

def chip(f, t, s, t0, t1, x, y, col=ORANGE, size=46):
    """Sağ üstte sayaç etiketi."""
    if not (t0 <= t <= t1): return
    p = back((t - t0) / .25); a = min(1, (t1 - t) / .2)
    lay = Image.new("RGBA", (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(lay); fnt = F(IB, size)
    tw = d.textlength(s, font=fnt); w_ = tw + 60; h_ = size + 40
    d.rounded_rectangle((0, 0, w_, h_), radius=h_ // 2, fill=(*col, int(245 * a)))
    d.text((30, 14), s, font=fnt, fill=(255, 255, 255, int(255 * a)))
    c = lay.crop((0, 0, int(w_) + 1, int(h_) + 1)); c = c.resize((max(1, int(c.width * p)), max(1, int(c.height * p))), Image.LANCZOS)
    f.alpha_composite(c, (int(x - c.width / 2), int(y - c.height / 2)))

def card_bg(f, a=1.0):
    ov = Image.new("RGBA", (W, H), (12, 10, 9, int(170 * a))); f.alpha_composite(ov)

def section_title(f, t, t0, num, ad, alt, col):
    """Sessiz bölüm başında büyük başlık."""
    if not (t0 <= t <= t0 + 2.6): return
    p = ease((t - t0) / .35); a = min(1, (t0 + 2.6 - t) / .3)
    lay = Image.new("RGBA", (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(lay)
    x0 = 110 - int((1 - p) * 140); y0 = 120
    d.rounded_rectangle((x0, y0, x0 + 150, y0 + 150), radius=24, fill=(*col, int(250 * a)))
    fn = F(ANTON, 120); tw = d.textlength(num, font=fn); d.text((x0 + 75 - tw / 2, y0 + 2), num, font=fn, fill=(255, 255, 255, int(255 * a)))
    d.text((x0 + 185, y0 + 8), ad, font=F(ANTON, 96), fill=(255, 255, 255, int(255 * a)), stroke_width=6, stroke_fill=(10, 10, 12, int(200 * a)))
    d.text((x0 + 190, y0 + 118), alt, font=F(IBo, 34), fill=(240, 232, 220, int(255 * a)), stroke_width=4, stroke_fill=(10, 10, 12, int(180 * a)))
    f.alpha_composite(lay)

def big_line(f, t, s, t0, t1, y=880, size=64, col=(255, 255, 255)):
    """Sessiz bölümlerde alt yazı gibi büyük bilgi satırı."""
    if not (t0 <= t <= t1): return
    a = min(1, (t - t0) / .2, (t1 - t) / .2); dy = int((1 - ease((t - t0) / .3)) * 30)
    lay = Image.new("RGBA", (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(lay); fnt = F(IB, size)
    tw = d.textlength(s, font=fnt)
    d.rounded_rectangle((W / 2 - tw / 2 - 34, y - 18 + dy, W / 2 + tw / 2 + 34, y + size + 22 + dy), radius=18, fill=(*INK, int(215 * a)))
    d.text((W / 2 - tw / 2, y + dy), s, font=fnt, fill=(*col, int(255 * a)))
    f.alpha_composite(lay)

# ----- tek komut kartları (klip 2) -----
PROMPT = [l.rstrip() for l in open("/home/user/analiz/kanal/projeler/berkai-studyo/PROMPT.md").read().split("\n")[2:] if l.strip()][:8]
def clean_md(s): return re.sub(r"\*\*|`", "", s)
def prompt_card(f, t, t0, t1):
    if not (t0 <= t <= t1): return
    a = min(1, (t - t0) / .3, (t1 - t) / .3); card_bg(f, a)
    lay = Image.new("RGBA", (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(lay)
    x0, y0, x1, y1 = 470, 90, 1840, 800
    d.rounded_rectangle((x0, y0, x1, y1), radius=26, fill=(247, 243, 234, int(250 * a)))
    d.text((x0 + 50, y0 + 36), "FABLE 5.2'YE VERİLEN TEK KOMUT", font=F(IB, 30), fill=(*ORANGE, int(255 * a)))
    d.line((x0 + 50, y0 + 92, x1 - 50, y0 + 92), fill=(216, 205, 184, int(255 * a)), width=2)
    chars = int((t - t0) * 260); y = y0 + 120; fn = F(IM, 30)
    for ln in PROMPT:
        s = clean_md(ln)
        # satırı genişliğe göre böl
        parts, cur = [], ""
        for wd in s.split():
            if d.textlength(cur + " " + wd, font=fn) > x1 - x0 - 110: parts.append(cur); cur = wd
            else: cur = (cur + " " + wd).strip()
        parts.append(cur)
        for p_ in parts:
            if chars <= 0: break
            vis = p_[:chars]; chars -= len(p_)
            d.text((x0 + 50, y), vis, font=fn, fill=(30, 26, 23, int(255 * a))); y += 44
        y += 14
        if y > y1 - 60: break
    f.alpha_composite(lay)

TEAMS = [("1", "Konu ekibi", (232, 93, 47)), ("2", "Yapım ekibi", (230, 160, 40)), ("3", "Müşteri bulma", (60, 160, 110)),
         ("4", "3D site", (60, 130, 200)), ("5", "Mail", (200, 80, 140)), ("6", "Müdür", (210, 170, 60))]
def teams_card(f, t, t0, t1, times):
    if not (t0 <= t <= t1): return
    a = min(1, (t - t0) / .3, (t1 - t) / .3); card_bg(f, a)
    lay = Image.new("RGBA", (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(lay)
    d.text((560, 110), "6 EKİP", font=F(ANTON, 110), fill=(255, 255, 255, int(255 * a)))
    for k, ((n, ad, col), tk) in enumerate(zip(TEAMS, times)):
        if t < tk - .05: continue
        p = back((t - tk) / .25); cx = 560 + (k % 3) * 430; cy = 330 + (k // 3) * 230
        w_, h_ = 400 * p, 190 * p
        d.rounded_rectangle((cx, cy, cx + w_, cy + h_), radius=22, fill=(*col, int(245 * a)))
        if p > .7:
            d.text((cx + 26, cy + 14), n, font=F(ANTON, 90), fill=(255, 255, 255, int(255 * a)))
            d.text((cx + 26, cy + 120), ad, font=F(IB, 40), fill=(255, 255, 255, int(255 * a)))
    f.alpha_composite(lay)

RULES = [("BOŞ İŞ YOK", "her çıktıyı gerçekten kullanacağım"), ("UYDURMA YOK", "bulamadığını \"bulamadım\" diye yazacak"), ("GÖNDER TUŞU BENDE", "mailler taslak kalır, onayla gider")]
def rules_card(f, t, t0, t1, times):
    if not (t0 <= t <= t1): return
    a = min(1, (t - t0) / .3, (t1 - t) / .3); card_bg(f, a)
    lay = Image.new("RGBA", (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(lay)
    d.text((560, 110), "3 KURAL", font=F(ANTON, 110), fill=(255, 255, 255, int(255 * a)))
    for k, ((h1, h2), tk) in enumerate(zip(RULES, times)):
        if t < tk - .05: continue
        p = ease((t - tk) / .3); x = 560 + int((1 - p) * 120); y = 300 + k * 165
        d.rounded_rectangle((x, y, x + 1250, y + 140), radius=22, fill=(247, 243, 234, int(245 * a * p)))
        d.rounded_rectangle((x + 24, y + 26, x + 112, y + 114), radius=18, fill=(*ORANGE, int(255 * a * p)))
        d.text((x + 52, y + 26), str(k + 1), font=F(ANTON, 72), fill=(255, 255, 255, int(255 * a * p)))
        d.text((x + 140, y + 18), h1, font=F(IB, 50), fill=(30, 26, 23, int(255 * a * p)))
        d.text((x + 142, y + 82), h2, font=F(IM, 32), fill=(100, 90, 80, int(255 * a * p)))
    f.alpha_composite(lay)

FILES = [("kanal_kurallari.md", "Kanalın kuralları"), ("satis_tablosu.csv", "Satış tablom"), ("eski_mailler/", "Daha önce yazdığım mailler")]
def files_card(f, t, t0, t1, times):
    if not (t0 <= t <= t1): return
    a = min(1, (t - t0) / .3, (t1 - t) / .3); card_bg(f, a)
    lay = Image.new("RGBA", (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(lay)
    d.text((560, 110), "İLK GÜN VERDİKLERİM", font=F(ANTON, 100), fill=(255, 255, 255, int(255 * a)))
    for k, ((fn_, ad), tk) in enumerate(zip(FILES, times)):
        if t < tk - .05: continue
        p = back((t - tk) / .3); x = 560 + k * 420; y = 330
        w_, h_ = int(380 * p), int(420 * p)
        d.rounded_rectangle((x, y, x + w_, y + h_), radius=20, fill=(247, 243, 234, int(245 * a)))
        if p > .7:
            d.polygon([(x + w_ - 80, y), (x + w_, y + 80), (x + w_ - 80, y + 80)], fill=(216, 205, 184, int(255 * a)))
            d.rounded_rectangle((x + 30, y + 40, x + 200, y + 80), radius=10, fill=(*ORANGE, int(255 * a)))
            d.text((x + 44, y + 44), fn_.split(".")[-1].upper() if "." in fn_ else "KLASÖR", font=F(IB, 26), fill=(255, 255, 255, int(255 * a)))
            for j in range(5): d.rounded_rectangle((x + 30, y + 120 + j * 34, x + 330 - (j % 3) * 60, y + 136 + j * 34), radius=8, fill=(216, 205, 184, int(255 * a)))
            d.text((x + 30, y + 310), ad, font=F(IB, 30), fill=(30, 26, 23, int(255 * a)))
            d.text((x + 30, y + 355), fn_, font=F(IM, 24), fill=(120, 110, 100, int(255 * a)))
    f.alpha_composite(lay)

def clock(f, t, t0, t1):
    if not (t0 <= t <= t1): return
    p = ease((t - t0) / (t1 - t0 - .3)); mins = int(63 * p)
    lay = Image.new("RGBA", (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(lay)
    s = f"{mins} dk"; fn = F(ANTON, 200); tw = d.textlength(s, font=fn)
    d.text((W / 2 - tw / 2, 260), s, font=fn, fill=(255, 255, 255), stroke_width=12, stroke_fill=(10, 10, 12))
    s2 = "ve ofis hazır"; fn2 = F(IB, 60); tw2 = d.textlength(s2, font=fn2)
    if p > .95: d.text((W / 2 - tw2 / 2, 520), s2, font=fn2, fill=ORANGE, stroke_width=6, stroke_fill=(10, 10, 12))
    f.alpha_composite(lay)

def grid(t, t0):
    """Müşteri ekibinin ölçtüğü sitelerin ekran görüntüleri: bulanık, isimsiz."""
    ims = sorted(glob.glob("/home/user/analiz/kanal/projeler/berkai-studyo/gunler/2026-11-11/03_musteri/ekran/*_masaustu.jpg"))[:12]
    key = ("grid",)
    if key not in _cache:
        g = Image.new("RGB", (W, H), (20, 17, 15)); cw, chh = 440, 250
        for k, p_ in enumerate(ims):
            im = Image.open(p_).convert("RGB").resize((cw, chh), Image.LANCZOS)
            im = im.resize((cw // 14, chh // 14), Image.BILINEAR).resize((cw, chh), Image.BILINEAR)   # okunmaz
            x = 60 + (k % 4) * (cw + 20); y = 60 + (k // 4) * (chh + 70)
            g.paste(im, (x, y)); dd = ImageDraw.Draw(g)
            dd.rounded_rectangle((x, y + chh + 8, x + cw, y + chh + 52), radius=10, fill=(40, 34, 30))
            ms = ["telefonda 5,0 sn", "tükenmiş ürünler", "çok yakında", "kırık bağlantı", "site iyi · elendi", "site iyi · elendi",
                  "adres yok", "site iyi · elendi", "yavaş açılış", "site iyi · elendi", "site iyi · elendi", "ölçüldü"][k % 12]
            dd.text((x + 16, y + chh + 14), f"İşletme {k + 1} · {ms}", font=F(IBo, 24), fill=(235, 225, 210))
        _cache[key] = g
    return _cache[key].copy()

# ---------- kare kare ----------
avs = [Reader(f"{D}/av{i}.mp4") for i in (1, 2, 3)]
enc = subprocess.Popen(["ffmpeg", "-y", "-v", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
                        "-c:v", "libx264", "-preset", "medium", "-crf", "17", "-pix_fmt", "yuv420p", f"{D}/video_only.mp4"], stdin=subprocess.PIPE)
W2 = {i: words(i) for i in (1, 2, 3)}
def wt(i, txt, n=1):
    c = 0
    for w in W2[i]:
        if w["text"].strip('.,?!"').lower() == txt.strip('.,?!"').lower():
            c += 1
            if c == n: return w["start"]
    raise KeyError(txt)

# klip 1 eşlemeleri
a_konu = wt(1, "Kanal"); a_site = wt(1, "on", 2); a_demo = wt(1, "iki"); a_mail = wt(1, "dört", 2); a_mud = wt(1, "ve", 2); a_ofis = wt(1, "Hatta"); a_simdi = wt(1, "Şimdi"); a_abi = wt(1, "Abi")
# klip 2 eşlemeleri
b_prompt = wt(2, "Fable'a") - .3; b_ekip = wt(2, "6"); b_kural = wt(2, "3")
b_dosya = wt(2, "eski") - .3; b_saat = wt(2, "Sonra") ; b_end = D2
team_t = [B0 + wt(2, "konu"), B0 + wt(2, "yapım"), B0 + wt(2, "müşteri"), B0 + wt(2, "3D", 2), B0 + wt(2, "mail"), B0 + wt(2, "müdür")]
rule_t = [B0 + wt(2, "boş"), B0 + wt(2, "Uydurma"), B0 + wt(2, "Mailler")]
file_t = [B0 + wt(2, k) for k in ("Kanalın", "satış", "daha")]
# klip 3
c_yapim = wt(3, "İkinci")
print("zamanlar", a_konu, a_site, a_demo, a_mail, a_mud, a_ofis, a_simdi, a_abi, b_prompt, b_kural, b_dosya, b_saat, c_yapim)
if os.environ.get("DRY"): raise SystemExit

PREV = [float(x) for x in os.environ.get('PREV', '').split(',') if x]
frames = range(N)
for i in frames:
    t = i / FPS; pip_on = False; avimg = None
    if t < B0:                               # ---- KLİP 1
        avimg = avs[0].next(); u = t - A0
        if u < 4.6:
            base = zoom(tour(u * 1.0), 1.0 + .02 * u); pip_on = True
        elif u < a_konu - .1:
            base = zoom(avimg, 1.04 + .03 * (u - 4.6) / 4)
        elif u < a_site - .1:
            base = zoom(tour(8.5 + (u - a_konu)), 1.03); pip_on = True
        elif u < a_demo - .1:
            base = grid(u, a_site); pip_on = True
        elif u < a_mail - .1:
            base = demo(DEMO1, 5 + (u - a_demo) * 1.5, DEMO_BLUR); pip_on = True
        elif u < a_mud - .1:
            base = rec(40.3 + (u - a_mail)); pip_on = True
        elif u < a_ofis - .1:
            base = tour(84 + (u - a_mud)); pip_on = True
        elif u < a_simdi - .2:
            base = zoom(tour(100 + (u - a_ofis) * 1.2), 1.0 + .03 * (u - a_ofis)); pip_on = True
        else:
            z = 1.04
            if u >= a_abi - .05: z = 1.04 + .10 * back((u - a_abi + .05) / .25)
            if u >= a_abi + 2.0: z = 1.1
            base = zoom(avimg, z, .5, .4)
        if pip_on and (a_konu - .1 <= u < a_simdi - .2) and int(u * FPS) in [int(x * FPS) for x in (a_konu - .1, a_site - .1, a_demo - .1, a_mail - .1, a_mud - .1, a_ofis - .1)]:
            base = Image.blend(base, Image.new("RGB", (W, H), (255, 255, 255)), .35)
    elif t < C0:                              # ---- KLİP 2
        avimg = avs[1].next(); u = t - B0
        if u < b_prompt:
            base = zoom(avimg, 1.03 + .02 * u / 2)
        elif u < b_saat - .1:
            # kartlar: arka planda bulanık ofis
            base = tour(20 + u * .5).filter(ImageFilter.GaussianBlur(14)); pip_on = True
        else:
            base = tour(min(106, (u - b_saat) * 25)); pip_on = True   # hızlı tur: ofis hazır
    elif t < V_END:                           # ---- KLİP 3
        avimg = avs[2].next(); u = t - C0; pip_on = True
        if u < 6.8: base = rec(u)                                         # kullanıcı konu panelini açıyor
        elif u < c_yapim - .1: base = zoom(tour(15.5), 1.0 + .10 * ease((u - 6.8) / 8), .72, .45)   # konu paneli
        else: base = rec(min(38.3, 18 + (u - c_yapim)))                    # yapım paneli ve belgeleri
    else:                                     # ---- SESSİZ BÖLÜMLER
        ad = next(a for a, b, e in SEC if b <= t < e); b, e = SECD[ad]; u = t - b
        if ad == "musteri":
            base = rec(59.5 + u) if u < 12 else grid(u, 0)
        elif ad == "site":
            if u < 7: base = rec(8 + u) if u < 3 else rec(15 + (u - 3))
            else: base = demo(DEMO1, DEMO1_T0 + (u - 7) * .65, DEMO_BLUR)   # yalnız etiketsiz sahneler (meyve, kavurma, değirmen)
        elif ad == "mail": base = rec(37 + u)
        elif ad == "mudur": base = rec(74 + u)
        else: base = zoom(rec(min(95.5, 90 + u)), 1.0 + .02 * u)
        if u < 2 / FPS: base = Image.blend(base, Image.new("RGB", (W, H), (255, 255, 255)), .4)
    f = base.convert("RGBA")
    # ---- üst katman
    if t < B0:
        u = t
        if pip_on: pip(f, avimg, t, A0 if u < 4.6 else a_konu - .1, 4.6 if u < 4.6 else a_simdi - .2)
        pop_text(f, t, "17 ÇALIŞAN", 1.55, 2.95, col=(255, 255, 255), rot=-3)
        pop_text(f, t, "0 İNSAN", 3.05, 4.45, col=ORANGE, rot=3)
        name_tag(f, t, 4.8, 8.6)
        for s, a0 in (("5 video konusu", a_konu), ("14 site incelemesi", a_site), ("2 çalışan 3D site", a_demo), ("4 mail taslağı", a_mail), ("1 müdür raporu", a_mud)):
            chip(f, t, s, a0, a0 + 1.9, 1480, 120)
        pop_text(f, t, "OFİSİ DE ONLAR KURDU", a_ofis, a_ofis + 1.8, y=380, size=130, col=(255, 255, 255))
        pop_text(f, t, "\"SÜSLÜ BİR ANİMASYON\"", a_abi, a_abi + 2.0, y=330, size=120, col=(255, 255, 255), rot=-2)
        pop_text(f, t, "DOSYA YOKSA İŞ YOK", wt(1, "Dosya"), wt(1, "Dosya") + 1.6, y=330, size=130, col=ORANGE, rot=2)
        captions(f, t, pip_on)
    elif t < C0:
        u = t - B0
        prompt_card(f, t, B0 + b_prompt, B0 + b_ekip - .15)
        teams_card(f, t, B0 + b_ekip - .1, B0 + b_kural - .15, team_t)
        rules_card(f, t, B0 + b_kural - .1, B0 + b_dosya - .15, rule_t)
        files_card(f, t, B0 + b_dosya - .1, B0 + b_saat - .15, file_t)
        clock(f, t, B0 + b_saat + 1.2, C0)
        if pip_on: pip(f, avimg, t, B0 + b_prompt, C0 + .5)
        captions(f, t, pip_on)
    elif t < V_END:
        u = t - C0
        pip(f, avimg, t, C0 - .5, V_END)
        chip(f, t, "1 · KONU EKİBİ", C0 + .1, C0 + 3.5, 520, 110, col=TEAMS[0][2])
        pop_text(f, t, "485", C0 + wt(3, "485"), C0 + wt(3, "485") + 1.6, y=380, size=200, col=ORANGE)
        chip(f, t, "Sorun konu değil, başlık", C0 + wt(3, "Başlıklarda"), C0 + wt(3, "söyledi.", 2) + .8, 640, 110, col=INK, size=42)
        chip(f, t, "Şu an izlediğin video", C0 + wt(3, "Şu"), C0 + wt(3, "kendisi.") + .8, 600, 110, col=ORANGE)
        chip(f, t, "2 · YAPIM EKİBİ", C0 + c_yapim, C0 + c_yapim + 3.5, 520, 110, col=TEAMS[1][2])
        chip(f, t, "her bilginin yanında kaynak", C0 + wt(3, "Senaryodaki"), C0 + wt(3, "Çünkü") - .1, 640, 110, col=INK, size=42)
        captions(f, t, True)
    else:
        ad = next(a for a, b, e in SEC if b <= t < e); b, e = SECD[ad]
        if ad == "musteri":
            section_title(f, t, b, "3", "MÜŞTERİ BULMA", "3D siteye ihtiyacı olan gerçek işletmeler", TEAMS[2][2])
            big_line(f, t, "14 gerçek işletmenin sitesi açıldı ve ölçüldü", b + 2.8, b + 6.4)
            big_line(f, t, "bilgisayar + telefon · açılış süresi · kırık bağlantı", b + 6.5, b + 10.4)
            big_line(f, t, "6'sı elendi: siteleri zaten iyiydi", b + 11.2, b + 14.0)
            big_line(f, t, "3 güçlü aday kaldı · isimleri gizli", b + 14.1, e - .1, col=ORANGE)
        elif ad == "site":
            section_title(f, t, b, "4", "3D SİTE EKİBİ", "en iyi 2 aday için gerçek demo", TEAMS[3][2])
            big_line(f, t, "2 demo site · içinde tek fotoğraf yok, hepsi kodla çizildi", b + 8.3, b + 14.5)
            big_line(f, t, "8 kontrolün 8'i geçti: telefon, hız, kırık link, demo notu", b + 14.6, b + 21.8)
            big_line(f, t, "Her sitenin ZIP'i hazır → Netlify'a sürükle, yayında", b + 22.2, e - .2, col=ORANGE)
        elif ad == "mail":
            section_title(f, t, b, "5", "MAİL EKİBİ", "her işletmeye ona özel mesaj", TEAMS[4][2])
            big_line(f, t, "4 taslak · hepsi 80 kelimenin altında · fiyat yok", b + 2.6, b + 5.6)
            big_line(f, t, "0 gönderildi — gönder tuşu bende", b + 5.7, e - .1, col=ORANGE)
        elif ad == "mudur":
            section_title(f, t, b, "6", "MÜDÜR ODASI", "her şeyi toplayıp bana soruyor", TEAMS[5][2])
            big_line(f, t, "Günlük rapor + onayımı bekleyen 5 karar", b + 2.8, b + 8.4)
            big_line(f, t, "Yarın: tek komut, kaldığı yerden devam", b + 8.5, e - .1, col=ORANGE)
        else:
            u = t - b
            if u > 3.0:
                k = ease((u - 3.0) / .5); card_bg(f, k)
                lay = Image.new("RGBA", (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(lay)
                s = "Sıradaki ekibi hangi işe kuralım?"; fn = F(ANTON, 110); tw = d.textlength(s, font=fn)
                d.text((W / 2 - tw / 2, 300), s, font=fn, fill=(255, 255, 255, int(255 * k)))
                s = "Yorumlara yaz · komutun tamamı açıklamada"; fn = F(IBo, 46); tw = d.textlength(s, font=fn)
                d.text((W / 2 - tw / 2, 470), s, font=fn, fill=(*ORANGE, int(255 * k)))
                bw, bh = 470, 112; x0, y0 = W / 2 - bw / 2, 610; clicked = u > 7.2
                d.rounded_rectangle((x0, y0, x0 + bw, y0 + bh), radius=56, fill=(*((90, 90, 95) if clicked else RED), int(250 * k)))
                s = "ABONE OLUNDU" if clicked else "ABONE OL"; fn = F(IB, 46); tw = d.textlength(s, font=fn)
                d.text((x0 + bw / 2 - tw / 2, y0 + 28), s, font=fn, fill=(255, 255, 255, int(255 * k)))
                f.alpha_composite(lay)
            if u > e - b - .6: f = Image.blend(f.convert("RGB"), Image.new("RGB", (W, H), (0, 0, 0)), (u - (e - b - .6)) / .6).convert("RGBA")
    if PREV:
        if any(abs(t - x) < .5 / FPS for x in PREV): f.convert('RGB').save(f'{D}/prev_{t:.1f}.jpg', quality=85)
        if t > max(PREV): break
        continue
    enc.stdin.write(f.convert("RGB").tobytes())
enc.stdin.close(); enc.wait()
if PREV: raise SystemExit

# ---------- ses ----------
sr = 48000; n = int(TOTAL * sr)
voice = np.zeros(n)
for c, off in zip(CLIPS, (A0, B0, C0)):
    raw = subprocess.check_output(["ffmpeg", "-v", "error", "-i", c, "-af", "loudnorm=I=-14:TP=-1.5:LRA=11", "-ac", "1", "-ar", str(sr), "-f", "s16le", "-"])
    v = np.frombuffer(raw, np.int16).astype(np.float64) / 32768; i0 = int(off * sr); voice[i0:i0 + len(v)] = v[:n - i0]
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
        if j % 4 == 0 and k * beat * 4 >= V_END: mus[p0:p0 + Lp] += np.sin(2 * np.pi * 55 * ps) * np.exp(-ps * 18) * .08
duck = 1 - .6 * np.clip(np.convolve(np.abs(voice), np.ones(int(.25 * sr)) / int(.25 * sr), "same") / .03, 0, 1)
gain = np.where(tt >= V_END, 2.2, 1.0)        # konuşma yokken müzik öne çıkar
mus *= duck * gain * np.minimum(1, tt / .5) * np.clip((TOTAL - tt) / .8, 0, 1)
fx = np.zeros(n); rng = np.random.default_rng(3)
def add(sig, t0, g=1.):
    i = int(t0 * sr); j = min(n, i + len(sig))
    if j > i and i >= 0: fx[i:j] += sig[:j - i] * g
def whoosh(d=.45):
    m = int(d * sr); s_ = np.arange(m) / sr; nz = np.convolve(rng.normal(0, 1, m), np.ones(12) / 12, "same"); return nz * np.sin(np.pi * s_ / d) ** 2 * .35
def pop():
    m = int(.12 * sr); s_ = np.arange(m) / sr; return np.sin(2 * np.pi * (500 + 1200 * s_ / .12) * s_) * np.exp(-s_ * 35) * .4
def click():
    m = int(.04 * sr); s_ = np.arange(m) / sr; return (np.sin(2 * np.pi * 2800 * s_) + rng.normal(0, .5, m)) * np.exp(-s_ * 150) * .45
def type_(d):
    m = int(d * sr); out = np.zeros(m)
    for k in range(int(d * 14)):
        c = click() * .35; i = int(k / 14 * sr) + int(rng.integers(0, 600)); out[i:i + len(c)] += c[:max(0, m - i)]
    return out
add(pop(), 1.55); add(pop(), 3.05)
for a0 in (a_konu, a_site, a_demo, a_mail, a_mud): add(pop(), a0 - .1, .6)
add(whoosh(), a_ofis - .3); add(pop(), a_abi); add(pop(), wt(1, "Dosya")); add(whoosh(.6), B0 - .3, 1.2)
add(type_(min(6, b_ekip - b_prompt)), B0 + b_prompt + .2, .8)
for x in team_t + rule_t + file_t: add(pop(), x, .5)
add(whoosh(.5), B0 + b_saat - .2); add(whoosh(.6), C0 - .3, 1.2); add(pop(), C0 + wt(3, "485")); add(whoosh(.4), C0 + c_yapim - .2)
for a, b, e in SEC: add(whoosh(.6), b - .3, 1.3)
add(click(), SECD["son"][0] + 7.2)
mix = voice + mus + fx; mix = mix / max(1, np.abs(mix).max() / .95)
st = (np.stack([mix, mix], 1) * 32767).astype(np.int16)
with wave.open(f"{D}/ses.wav", "wb") as wf: wf.setnchannels(2); wf.setsampwidth(2); wf.setframerate(sr); wf.writeframes(st.tobytes())
OUT = "/home/user/analiz/video_teslim/BerkAI_Yapay_Zeka_Ofisi.mp4"
sh(f'ffmpeg -v error -y -i {D}/video_only.mp4 -i {D}/ses.wav -map 0:v -map 1:a -c:v libx264 -preset slow -crf 19 -pix_fmt yuv420p -c:a aac -b:a 192k -shortest -movflags +faststart {OUT}')
print("ok", OUT, round(TOTAL, 1))
