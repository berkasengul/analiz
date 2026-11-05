#!/usr/bin/env python3
"""Türkler Anadolu'ya nasıl geldi? — kodla çizilmiş harita animasyonu.
  python3 render_turk.py stills 12.5 40 ...   # kontrol kareleri
  python3 render_turk.py render 4             # tam video
"""
import json, re, subprocess, wave
from harita import *

MODE = sys.argv[1] if len(sys.argv) > 1 else "stills"
FPS = 30
OUT = f"{V}/out"; os.makedirs(OUT, exist_ok=True)
TL = json.load(open(f"{V}/tts/timeline.json")); ITEMS = TL["items"]; DUR = TL["total"]; NFR = int(DUR * FPS)
BEATS = [it for it in ITEMS if "i" in it]
for k, b in enumerate(BEATS):
    b["end"] = BEATS[k + 1]["t"] - .05 if k + 1 < len(BEATS) else b["t"] + b["d"] + .4
END0 = BEATS[-1]["t"] + BEATS[-1]["d"] + .6

# ---------- alt yazı kelime zamanları ----------
def norm(w): return re.sub(r"[^\wçğıöşüâîû]", "", w.lower())
def caption_words(b):
    toks = re.findall(r"\*[^*]+\*|[^\s*]+", b["cap"]); words = []
    for tok in toks:
        if tok.startswith("*"): words += [(w, "i") for w in tok.strip("*").split()]
        else: words.append((tok, "b"))
    low = b["say"].lower(); L = max(1, len(low)); out = []; last = 0.0
    for k, (w, kind) in enumerate(words):
        n = norm(w); pos = low.find(n[:5]) if len(n) >= 3 else -1
        frac = pos / L if pos >= 0 else None
        if frac is None or frac < last - .02: frac = min(.85, last + .12) if k else 0.0
        last = frac; out.append((w, kind, b["t"] + .05 + frac * b["d"] * .92))
    return out
for b in BEATS: b["words"] = caption_words(b)

# ---------- durum: öğeler, yıllar, görünümler, kartlar ----------
OBJ = {}          # anahtar -> [[açılış, kapanış]]
YEARS = []        # (t, sayı, metin)
DATES = []        # (t, metin)
ERAS = []         # (t, metin)
VIEWK = []        # (t, görünüm)
def on(k, t): OBJ.setdefault(k, []).append([t, None])
def off(k, t):
    for key, ivs in OBJ.items():
        if key.rstrip("!") == k.rstrip("!") or (k.startswith("lbl:") and key.startswith(k)):
            for iv in ivs:
                if iv[1] is None: iv[1] = t
cur = None
for b in BEATS:
    v = b["vis"]; t = b["t"]
    if v[0] != "map": continue
    if v[1] != cur: VIEWK.append((t, v[1])); cur = v[1]
    k = 0
    for op in v[2:]:
        if op == "clear":
            for key in list(OBJ): off(key, t)
        elif op[0] == "+": on(op[1:], t + .35 + .4 * k); k += 1
        elif op[0] == "-": off(op[1:], t + .1)
        elif op.startswith("year:"):
            val = op[5:]; num, txt = (val.split("=") + [None])[:2]
            YEARS.append((t, int(num), txt)); DATES.append((t, None))
        elif op.startswith("date:"): DATES.append((t, op[5:]))
        elif op.startswith("era:"): ERAS.append((t, op[4:]))
# kart / savaş bölgeleri
REG = []
for b in BEATS:
    v = b["vis"]
    if v[0] in ("card", "battle"):
        key = (v[0], v[1] if v[0] == "card" else "")
        if REG and REG[-1]["key"] == key and REG[-1]["beats"][-1] is PREV: REG[-1]["beats"].append(b)
        else: REG.append({"key": key, "beats": [b]})
    PREV = b
for r in REG: r["t0"] = r["beats"][0]["t"]; r["t1"] = r["beats"][-1]["end"]
def param(r, t):
    p = r["beats"][0]["vis"][-1]
    for b in r["beats"]:
        if t >= b["t"] - .05: p = b["vis"][-1]
    return p
def first_t(r, cond):
    for b in r["beats"]:
        if cond(b["vis"][-1]): return b["t"]
    return None

# ---------- kamera ----------
def camera(t):
    if not VIEWK: return view_cam("genel")
    i = max(0, max([j for j, (tk, _) in enumerate(VIEWK) if tk <= t] or [0]))
    tk, v = VIEWK[i]; c1 = view_cam(v)
    drift = 1 + .035 * eio(prog(t, tk, tk + 14))
    if i == 0: return (c1[0], c1[1], c1[2] * drift)
    c0 = view_cam(VIEWK[i - 1][1]); tp = VIEWK[i - 1][0]
    z0 = c0[2] * (1 + .035 * eio(prog(tk, tp, tp + 14)))
    p = eio(prog(t, tk - .2, tk + 1.8))
    # uzak geçişlerde önce biraz uzaklaş
    dz = math.dist(c0[:2], c1[:2]) / 20
    zm = math.exp(lerp(math.log(z0), math.log(c1[2] * drift), p)) / (1 + dz * math.sin(math.pi * p) * .6)
    return (lerp(c0[0], c1[0], p), lerp(c0[1], c1[1], p), zm)

def alpha(ivs, t, fin=.8, fout=.6):
    a = 0.0
    for t0, t1 in ivs:
        if t < t0: continue
        v = eout(prog(t, t0, t0 + fin))
        if t1 is not None: v *= 1 - eio(prog(t, t1, t1 + fout))
        a = max(a, v)
    return a
def started(ivs, t):
    s = [t0 for t0, t1 in ivs if t0 <= t]
    return s[-1] if s else None

def latest(lst, t):
    v = None; tt = None
    for tk, *rest in lst:
        if tk <= t: v = rest; tt = tk
    return tt, v

# ---------- yıl kartuşu + zaman çizelgesi ----------
TL0, TL1 = 500, 1300
def year_card(c, t, dim):
    ty, yv = latest(YEARS, t)
    if yv is None: return
    a = eout(prog(t, YEARS[0][0], YEARS[0][0] + .6)) * (1 - dim)
    if a <= 0: return
    num, txt = yv
    i = [k for k, y in enumerate(YEARS) if y[0] == ty][0]
    prev = YEARS[i - 1][1] if i else num
    q = eio(prog(t, ty, ty + 1.1)); shown = round(lerp(prev, num, q))
    _, dv = latest(DATES, t); date = dv[0] if dv else None
    _, ev = latest(ERAS, t); era = ev[0] if ev else ""
    x, y = 60, 54
    w = 430
    card(c, x, y, w, 168 if not date else 196, 22, color="#FFF8EA", a=.94 * a, sh=.16)
    c.drawRect(skia.Rect.MakeXYWH(x, y + 20, 8, 128 if not date else 156), paint(RED, a))
    yy = y + 104
    if date:
        text(c, date, x + 34, y + 52, "s", 30, RED, a); yy = y + 134
    big = txt if (txt and q >= 1) else str(shown)
    text(c, big, x + 32, yy, "b", 78 if not txt or q < 1 else 50, PAPER_INK, a, track=-1)
    text(c, era, x + 34, yy + 42, "i", 36, ORANGE_T, a)
    # üst zaman çizelgesi
    bx, bw, by = 560, 1300, 76
    c.drawLine(bx, by, bx + bw, by, paint(PAPER_INK, .35 * a, 3))
    for yr in range(TL0, TL1 + 1, 100):
        xx = bx + bw * (yr - TL0) / (TL1 - TL0)
        c.drawLine(xx, by - 8, xx, by + 8, paint(PAPER_INK, .4 * a, 2))
        text(c, str(yr), xx, by + 34, "m", 20, PAPER_INK, .55 * a, align="center")
    cur = lerp(prev, num, q); xx = bx + bw * (clamp((cur - TL0) / (TL1 - TL0)))
    c.drawLine(bx, by, xx, by, paint(RED, .9 * a, 5))
    c.drawCircle(xx, by, 11, paint("#FFF8EA", a)); c.drawCircle(xx, by, 8, paint(RED, a))

# ---------- alt yazı ----------
def captions(c, t, light=False):
    for b in BEATS:
        if b["t"] - .2 <= t <= b["end"] + .4:
            line(c, t, b["words"], W / 2, H - 64, 54, t1=b["end"] - .05, color="#FFFFFF" if light else PAPER_INK, acc="#FFB27A" if light else ORANGE_T)

# ---------- kartlar ----------
def dimmer(c, a, col="#F3EAD6", amt=.86):
    c.drawRect(skia.Rect.MakeWH(W, H), paint(col, amt * a))

def chip(c, x, y, s, col=RED, size=30, a=1.0):
    w = tw(s, "s", size) + 48; h = size * 1.9
    rrect(c, x - w / 2, y - h / 2, w, h, h / 2, col, a); text(c, s, x, y + size * .36, "s", size, "#FFFFFF", a, align="center")

def card_title(c, t, r, a):
    p = param(r, t)
    text(c, "Türkler Anadolu'ya", W / 2, 420, "b", 128, PAPER_INK, a, align="center", track=-2)
    text(c, "nasıl geldi?", W / 2, 590, "i", 170, RED, a, align="center")
    q = eout(prog(t, r["t0"] + .6, r["t0"] + 1.2))
    for k, s in enumerate(["552 → 1176", "Ötüken → Konya", "~5.600 km"]):
        chip(c, W / 2 - 420 + k * 420, 720, s, [NAVY, RED, NAVY][k], 32, a * q)
    t1 = first_t(r, lambda v: v == 1)
    if t1 is not None:
        q2 = eback(prog(t, t1 + .3, t1 + .8))
        if q2 > 0:
            c.save(); c.translate(W / 2 + 560, 330); c.rotate(-8); c.scale(q2, q2)
            rrect(c, -190, -50, 380, 100, 50, ORANGE, a); text(c, "Kodla çizildi", 0, 14, "b", 40, "#FFFFFF", a, align="center")
            c.restore()

def runes(c, x, y, w, h, a, seed=3):
    rng = np.random.default_rng(seed)
    rows = int(h // 52)
    for r_ in range(rows):
        xx = x + w - 18; yy = y + 30 + r_ * 52
        while xx > x + 24:
            g = rng.integers(0, 7); s = 15
            col = paint("#5A4A38", .85 * a, 3.2)
            if g == 0: c.drawLine(xx, yy - s, xx, yy + s, col); c.drawLine(xx, yy - s, xx - 10, yy, col)
            elif g == 1: c.drawLine(xx - 8, yy - s, xx - 8, yy + s, col); c.drawLine(xx - 8, yy, xx + 2, yy - 10, col); c.drawLine(xx - 8, yy, xx + 2, yy + 10, col)
            elif g == 2: c.drawLine(xx - 10, yy + s, xx, yy - s, col); c.drawLine(xx, yy - s, xx + 6, yy + s, col)
            elif g == 3: c.drawCircle(xx - 4, yy, 8, col); c.drawLine(xx - 4, yy + 8, xx - 4, yy + s, col)
            elif g == 4: c.drawLine(xx - 10, yy - s, xx + 4, yy + s, col); c.drawLine(xx + 4, yy - s, xx - 10, yy + s, col)
            elif g == 5: c.drawLine(xx - 6, yy - s, xx - 6, yy + s, col); c.drawLine(xx - 6, yy - 4, xx + 4, yy - s, col)
            else: c.drawLine(xx - 10, yy, xx + 4, yy, col); c.drawLine(xx - 3, yy - s, xx - 3, yy + s, col)
            xx -= 30
        if r_ % 3 == 2: c.drawCircle(xx + 14, yy, 3, paint("#5A4A38", .8 * a))

def card_yazit(c, t, r, a):
    x, y, w, h = 240, 150, 520, 780
    pth = skia.Path(); pth.moveTo(x, y + h); pth.lineTo(x, y + 140); pth.quadTo(x + w / 2, y - 60, x + w, y + 140); pth.lineTo(x + w, y + h); pth.close()
    sp = paint("#000000", .3 * a); sp.setMaskFilter(skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, 22)); c.save(); c.translate(10, 22); c.drawPath(pth, sp); c.restore()
    g = skia.Paint(AntiAlias=True); g.setShader(skia.GradientShader.MakeLinear([skia.Point(x, y), skia.Point(x + w, y + h)], [C("#CFC6B4", a).toColor(), C("#A99E88", a).toColor()]))
    c.drawPath(pth, g); c.drawPath(pth, paint("#6E6250", .8 * a, 4))
    c.save(); c.clipPath(pth, doAntiAlias=True); runes(c, x + 20, y + 150, w - 40, h - 190, a); c.restore()
    text(c, "Orhun Yazıtları", 900, 330, "b", 76, PAPER_INK, a)
    text(c, "Kül Tigin 732 · Bilge Kağan 735 · Moğolistan", 904, 395, "m", 32, MUTED, a)
    t1 = first_t(r, lambda v: v == 1)
    if t1 is not None:
        lines = ["“Üstte gök çökmedikçe,", "altta yer delinmedikçe,", "ey Türk milleti,", "ilini ve töreni", "kim bozabilir?”"]
        for k, s in enumerate(lines):
            q = eout(prog(t, t1 + .3 + k * .55, t1 + .9 + k * .55))
            text(c, s, 904, 520 + k * 78, "i", 66, RED if k == 2 else PAPER_INK, a * q)

def card_neden(c, t, r, a):
    p = param(r, t)
    text(c, "Neden batıya?", W / 2, 230, "b", 92, PAPER_INK, a, align="center")
    items = [("İklim", "Kuraklık, sert kışlar", "kar"), ("Nüfus", "Bozkır dar geldi", "insan"), ("Siyasi baskı", "Doğuda Çin, rakip boylar", "ok")]
    for k, (h1, h2, ic) in enumerate(items):
        if p < k + 1 and not (p == 0 and False): q = 0
        q = eback(prog(t, (first_t(r, lambda v, k=k: v >= k + 1) or 1e9) + .1, (first_t(r, lambda v, k=k: v >= k + 1) or 1e9) + .6))
        if q <= 0: continue
        cx = W / 2 - 520 + k * 520; cy = 560
        c.save(); c.translate(cx, cy); c.scale(q, q)
        card(c, -220, -200, 440, 400, 30, color="#FFF8EA", a=a, sh=.14)
        c.drawCircle(0, -80, 70, paint([NAVY, RED, ORANGE][k], a))
        wp = paint("#FFFFFF", a, 6)
        if ic == "kar":
            for ang in range(0, 180, 60):
                rad = math.radians(ang); c.drawLine(-36 * math.cos(rad), -80 - 36 * math.sin(rad), 36 * math.cos(rad), -80 + 36 * math.sin(rad), wp)
        elif ic == "insan":
            for dx in (-26, 0, 26): c.drawCircle(dx, -96, 11, paint("#FFFFFF", a)); c.drawArc(skia.Rect.MakeXYWH(dx - 16, -80, 32, 36), 180, 180, False, wp)
        else:
            c.drawLine(-34, -80, 30, -80, wp); c.drawLine(10, -100, 32, -80, wp); c.drawLine(10, -60, 32, -80, wp)
        text(c, h1, 0, 50, "b", 50, PAPER_INK, a, align="center"); text(c, h2, 0, 110, "m", 30, MUTED, a, align="center")
        c.restore()

def card_kitap(c, t, r, a):
    q = eback(prog(t, r["t0"] + .1, r["t0"] + .7))
    c.save(); c.translate(560, 560); c.rotate(-6); c.scale(q, q)
    sp = paint("#000000", .3 * a); sp.setMaskFilter(skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, 20)); c.drawRect(skia.Rect.MakeXYWH(-230, -300, 480, 620), sp)
    rrect(c, -240, -320, 480, 620, 14, "#7A2E2E", a); rrect(c, -220, -300, 440, 580, 10, "#8E3A34", a)
    c.drawRect(skia.Rect.MakeXYWH(-240, -320, 36, 620), paint("#5E2222", a))
    for yy in (-230, 190): c.drawLine(-170, yy, 200, yy, paint("#E2C27A", a, 4))
    text(c, "Dîvânu", 15, -110, "i", 76, "#F3DFA8", a, align="center"); text(c, "Lugâti't-Türk", 15, -20, "i", 76, "#F3DFA8", a, align="center")
    text(c, "Kaşgarlı Mahmud", 15, 90, "s", 34, "#F3DFA8", a, align="center")
    c.restore()
    text(c, "Türkçenin ilk sözlüğü", 1020, 460, "b", 66, PAPER_INK, a)
    text(c, "1072–1074 · Bağdat'ta tamamlandı", 1024, 530, "m", 34, MUTED, a)
    text(c, "Türk boylarının dilleri, atasözleri,", 1024, 620, "m", 34, PAPER_INK, .8 * a)
    text(c, "yaşadıkları yerlerin haritası", 1024, 668, "m", 34, PAPER_INK, .8 * a)

def card_turchia(c, t, r, a):
    q = eout(prog(t, r["t0"] + .2, r["t0"] + 1.4))
    text(c, "12. yüzyıl sonu · Avrupalı kaynaklarda Anadolu:", W / 2, 330, "m", 40, MUTED, a, align="center")
    c.save(); c.translate(W / 2, 560); s = .92 + .08 * q; c.scale(s, s)
    text(c, "TURCHIA", 0, 0, "i", 260, RED, a * q, align="center", track=10)
    c.restore()
    t1 = first_t(r, lambda v: v == 1)
    if t1 is not None:
        q2 = eback(prog(t, t1 + .5, t1 + 1.0))
        if q2 > 0:
            c.save(); c.translate(W / 2, 760); c.scale(q2, q2); chip(c, 0, 0, "= Türkiye", NAVY, 56, a); c.restore()

OZET = [("552", "Göktürk Kağanlığı"), ("840", "Batıya göç"), ("1040", "Dandanakan"), ("1071", "Malazgirt"), ("1077", "Anadolu Selçuklu"), ("1176", "Miryokefalon")]
def card_ozet(c, t, r, a):
    p = param(r, t)
    text(c, "600 yıllık yolculuk", W / 2, 260, "b", 84, PAPER_INK, a, align="center")
    x0, x1, y = 220, W - 220, 560
    c.drawLine(x0, y, x1, y, paint(PAPER_INK, .3 * a, 6))
    for k, (yr, s) in enumerate(OZET):
        tk = first_t(r, lambda v, k=k: v >= k + 1)
        if tk is None: continue
        q = eback(prog(t, tk + .05, tk + .5)); xx = lerp(x0, x1, k / (len(OZET) - 1))
        c.drawLine(x0, y, xx, y, paint(RED, a, 6))
        on_ = p == k + 1
        c.save(); c.translate(xx, y); c.scale(q, q)
        c.drawCircle(0, 0, 30 if on_ else 22, paint(RED if on_ else NAVY, a)); c.drawCircle(0, 0, 10, paint("#FFF8EA", a))
        text(c, yr, 0, -60, "b", 54 if on_ else 44, RED if on_ else PAPER_INK, a, align="center")
        text(c, s, 0, 80, "s", 30, PAPER_INK, a, align="center")
        c.restore()

CODE = ["kara = harita.yükle('ne_50m_land')", "çiz(kara, renk=KAĞIT, kıyı=KAHVE)", "", "selçuklu = sınır([(79, 40.5), (73, 43.5), ...])",
        "yol('göç', Ötüken → Cend → Merv → Konya)", "şehir('Malazgirt', 39.15, 42.54)", "", "savaş.bizans = bloklar(12, renk=MOR)", "savaş.selçuklu = hilal(10, renk=TURUNCU)"]
def card_kod(c, t, r, a):
    p = param(r, t)
    x, y, w, h = 90, 170, 860, 720
    card(c, x, y, w, h, 26, color=NAVY, a=a, sh=.25)
    for k, col in enumerate(("#FF5F57", "#FEBC2E", "#28C840")): c.drawCircle(x + 34 + k * 26, y + 32, 8, paint(col, a))
    text(c, "animasyon.py", x + w / 2, y + 40, "m", 24, "#9AA0B5", a, align="center")
    lines = CODE[:2] if p <= 1 else (CODE[:7] if p == 2 else CODE)
    tt = r["t0"]
    for k, s in enumerate(lines):
        q = prog(t, tt + .3 + k * .5, tt + .3 + k * .5 + len(s) * .025)
        col = "#8FD3FF" if "(" in s else "#E6E9F2"
        text(c, s[:int(len(s) * q)], x + 40, y + 110 + k * 62, "mono", 26, col, a)
    # sağda harita kendini çizer
    mx, my, mw, mh = 1010, 170, 820, 720
    card(c, mx, my, mw, mh, 26, color="#FFF8EA", a=a, sh=.2)
    c.save(); c.clipRRect(skia.RRect.MakeRectXY(skia.Rect.MakeXYWH(mx, my, mw, mh), 26, 26), True)
    cam = view_cam((62, 41, 70)); z = mw / (70 * KX)
    cam = (cam[0], cam[1], z)
    c.translate(mx + mw / 2 - W / 2, my + mh / 2 - H / 2)
    c.save(); c.translate(W / 2, H / 2); c.scale(z, z); c.translate(-cam[0], -cam[1])
    tp = prog(t, r["t0"] + .5, r["t0"] + 6)
    lp = paint(SHORE, a, 1.6 / z); te = skia.TrimPathEffect.Make(0, max(.001, min(.999, tp)))
    if te is not None and tp < .999: lp.setPathEffect(te)
    c.drawPath(LAND_P, paint(LAND, a * eout(prog(t, r["t0"] + 4, r["t0"] + 6))))
    c.drawPath(LAND_P, lp)
    c.restore()
    if p >= 2:
        t2 = first_t(r, lambda v: v >= 2)
        draw_terr(c, cam, "selcuklu", a, prog(t, t2 + .3, t2 + 1.8), t, label=False)
        draw_route(c, cam, "dunya", prog(t, t2 + .8, t2 + 3.5), wdt=5, a=a)
    c.restore()
    if p >= 3:
        t3 = first_t(r, lambda v: v >= 3); q = eback(prog(t, t3 + .2, t3 + .7))
        c.save(); c.translate(mx + mw - 190, my + mh - 150); c.scale(q, q)
        card(c, -150, -100, 300, 200, 18, color="#FFFFFF", a=a, sh=.2)
        for i in range(3):
            for j in range(2): rrect(c, -110 + i * 34, -50 + j * 30, 26, 18, 3, EMP["bizans"], a)
        for i in range(5):
            ang = math.radians(-60 + i * 30); c.drawRect(skia.Rect.MakeXYWH(40 + 50 * math.cos(ang) - 8, -20 + 60 * math.sin(ang) - 6, 16, 12), paint(ORANGE, a))
        text(c, "savaş şeması = kod", 0, 80, "s", 22, PAPER_INK, a, align="center")
        c.restore()

NASIL = ["Konunu ve önemli tarihleri yaz", "Haritada neyin, hangi sırayla görüneceğini anlat", "Ekran görüntüsüne bak, beğenmediğini söyle", "Bilgileri kaynaklardan kontrol et"]
def card_nasil(c, t, r, a):
    p = param(r, t)
    text(c, "Sen de yap", W / 2, 230, "b", 88, PAPER_INK, a, align="center")
    for k, s in enumerate(NASIL):
        tk = first_t(r, lambda v, k=k: v >= k + 1)
        if tk is None: continue
        q = eout(prog(t, tk + .05, tk + .5)); y = 360 + k * 130
        on_ = p == k + 1
        c.save(); c.translate(0, (1 - q) * 30)
        card(c, 360, y - 50, 1200, 100, 50, color=NAVY if on_ else "#FFF8EA", a=a * q, sh=.12)
        c.drawCircle(420, y, 32, paint(RED, a * q)); text(c, str(k + 1), 420, y + 12, "b", 34, "#FFFFFF", a * q, align="center")
        text(c, s, 480, y + 13, "s", 38, "#FFFFFF" if on_ else PAPER_INK, a * q)
        c.restore()

# ---------- Malazgirt savaş şeması (temsilî) ----------
BIZ = []   # (grup, x, y)  grup: 0 sol kanat, 1 merkez, 2 sağ kanat, 3 artçı
for g, cy in ((0, 330), (1, 540), (2, 750)):
    for i in range(3):
        for j in range(3): BIZ.append((g, 640 - i * 66, cy - 56 + j * 56))
for j in range(3): BIZ.append((3, 330, 486 + j * 54))
NSEL = 15
def battle(c, t, r, a):
    p = param(r, t)
    def tp(k):
        v = first_t(r, lambda x: x >= k); return 1e9 if v is None else v
    q1 = eio(prog(t, tp(1), tp(1) + 3.0)); q2 = eio(prog(t, tp(2), tp(2) + 2.6))
    q3 = eio(prog(t, tp(3), tp(3) + 3.4)); q4 = eio(prog(t, tp(4), tp(4) + 2.4))
    c.drawRect(skia.Rect.MakeWH(W, H), paint("#EFE5CE", a))
    for k in range(10): mountain(c, 160 + k * 180, 205 + 12 * math.sin(k * 1.7), 24)
    c.drawPath(_river(), paint(RIVER, .8 * a, 6)); paper(c)
    text(c, "Malazgirt · 26 Ağustos 1071", W / 2, 120, "b", 46, PAPER_INK, a, align="center")
    text(c, "temsilî şema", W / 2, 162, "i", 30, MUTED, a, align="center")
    # Bizans merkezinin konumu
    bx = 640 + 380 * q1 + 140 * q2
    cx, cy = bx - 60, 540
    # --- Selçuklu atlıları
    for k in range(NSEL):
        y0 = 300 + k * (480 / (NSEL - 1)); x0 = 1240
        xr = x0 + 300 * q1 + 60 * q2                       # geri çekilir gibi
        th = math.radians(-150 + k * (300 / (NSEL - 1)))   # hilal: kuzey, doğu, güney
        R = lerp(360, 240, q4)
        xh, yh = cx + R * math.cos(th), cy + R * math.sin(th)
        X, Y = lerp(xr, xh, q3), lerp(y0, yh, q3)
        c.save(); c.translate(X, Y); c.rotate(math.degrees(th + math.pi) * q3)
        rrect(c, -20, -12, 40, 24, 6, ORANGE, a); c.drawLine(-12, 0, 12, 0, paint("#FFFFFF", .85 * a, 3)); c.restore()
    # --- Bizans
    lab = None
    for g, x, y in BIZ:
        switch = False
        if g == 3:   # artçı geride kalır, sonra çekilir
            X, Y, col, al = x + 120 * q1 - 160 * q3, y, EMP["bizans"], 1 - .5 * q3
        else:
            X = x + 380 * q1 + 140 * q2
            Y = y + (g - 1) * 90 * q2 - (g - 1) * 120 * q3
            X = lerp(X, cx + (X - cx) * .55, q4); Y = lerp(Y, cy + (Y - cy) * .55, q4)
            switch = g == 2 and x == 640 and q3 > .35
            col = ORANGE if switch else EMP["bizans"]; al = 1 - .3 * q4 if not switch else 1
            if switch and y == 750: lab = (X, Y)
        sc_ = 1 - .42 * q4
        rrect(c, X - 26 * sc_, Y - 18 * sc_, 52 * sc_, 36 * sc_, 6 * sc_, col, a * al)
        c.drawRect(skia.Rect.MakeXYWH(X - 21 * sc_, Y - 3 * sc_, 42 * sc_, 6 * sc_), paint("#FFFFFF", .55 * a * al))
    if lab and p >= 3 and q4 == 0:
        text(c, "taraf değiştirenler", lab[0] + 44, lab[1] + 10, "s", 28, ORANGE_T, a * eout(prog(q3, .4, .8)))
    # --- etiketler ve oklar
    la = a * (1 - q3)
    text(c, "BİZANS", 560 + 380 * q1, 250, "b", 38, EMP["bizans"], la, align="center", track=4)
    text(c, "SELÇUKLU", 1240 + 300 * q1, 250, "b", 38, ORANGE_T, la, align="center", track=4)
    if p == 0:
        q0 = eout(prog(t, r["t0"] + .4, r["t0"] + 1.1))
        text(c, "Bizans ordusu daha kalabalık (kaynaklara göre)", W / 2, 905, "i", 40, PAPER_INK, a * q0, align="center")
    if q1 > 0 and q3 < .6:
        arr(c, 1300, 850, 1620, 850, ORANGE_T, a * eout(q1) * (1 - q3 / .6), "geri çekilir gibi")
    if q2 > 0 and q3 < .6:
        arr(c, 640, 905, 1000, 905, EMP["bizans"], a * q2 * (1 - q3 / .6), "peşinden ilerler, saflar açılır")
    if q3 > 0:
        text(c, "hilal şeklinde kuşatma", W / 2, 262, "i", 46, ORANGE_T, a * q3 * (1 - q4), align="center")
    if q4 > 0:
        c.drawCircle(cx, cy, 130, paint(RED, .9 * a * q4, 6))
        rrect(c, cx - 170, cy + 150, 340, 64, 32, RED, a * q4)
        text(c, "İmparator esir", cx, cy + 194, "b", 36, "#FFFFFF", a * q4, align="center")

def arr(c, x0, y0, x1, y1, col, a, label=None):
    if a <= 0: return
    c.drawLine(x0, y0, x1, y1, paint(col, a, 6)); c.drawLine(x1, y1, x1 - 22, y1 - 16, paint(col, a, 6)); c.drawLine(x1, y1, x1 - 22, y1 + 16, paint(col, a, 6))
    if label: text(c, label, (x0 + x1) / 2, y0 - 22, "i", 36, col, a, align="center")

def _river():
    p = skia.Path(); p.moveTo(-20, 940); p.cubicTo(400, 900, 700, 990, 1100, 930); p.cubicTo(1400, 890, 1700, 960, W + 20, 920); return p
def draw_arrow(c, x0, y0, x1, y1, col, a, label=None):
    c.drawLine(x0, y0, x1, y1, paint(col, a, 6)); c.drawLine(x1, y1, x1 - 22, y1 - 16, paint(col, a, 6)); c.drawLine(x1, y1, x1 - 22, y1 + 16, paint(col, a, 6))
    if label: text(c, label, (x0 + x1) / 2, y0 - 22, "i", 36, col, a, align="center")

CARD_FN = {"title": card_title, "yazit": card_yazit, "neden": card_neden, "kitap": card_kitap, "turchia": card_turchia, "ozet": card_ozet, "kod": card_kod, "nasil": card_nasil}

# ---------- kare ----------
def vignette(c):
    p = skia.Paint(); p.setShader(skia.GradientShader.MakeRadial(skia.Point(W / 2, H / 2), W * .72, [C("#000000", 0).toColor(), C("#2A1E10", .32).toColor()], [.62, 1]))
    c.drawRect(skia.Rect.MakeWH(W, H), p)

class Renderer:
    def __init__(self):
        self.s = skia.Surface.MakeRaster(skia.ImageInfo.Make(W, H, skia.ColorType.kRGBA_8888_ColorType, skia.AlphaType.kPremul_AlphaType))
        self.grain = make_grain()
    def frame(self, f):
        t = f / FPS; c = self.s.getCanvas(); cam = camera(t)
        draw_base(c, cam, t)
        for key, ivs in OBJ.items():
            kind, name = key.split(":", 1)
            a = alpha(ivs, t)
            if a <= 0: continue
            if kind == "emp": draw_terr(c, cam, name, a, prog(t, started(ivs, t) or 0, (started(ivs, t) or 0) + 1.6), t)
        for key, ivs in OBJ.items():
            kind, name = key.split(":", 1); a = alpha(ivs, t)
            if a <= 0: continue
            if kind == "route": draw_route(c, cam, name, prog(t, started(ivs, t) or 0, (started(ivs, t) or 0) + 2.4), a=a)
            elif kind == "lbl":
                s_, ll = name.split("@"); lon, lat = map(float, ll.split(","))
                draw_label(c, cam, s_, lon, lat, a, size=40)
        for key, ivs in OBJ.items():
            kind, name = key.split(":", 1); a = alpha(ivs, t, .5)
            if a <= 0 or kind != "city": continue
            big = name.endswith("!"); nm = name.rstrip("!")
            side = "l" if nm in ("konya", "kostantiniyye", "dandanakan", "miryokefalon", "talas", "rey") else ("u" if nm in ("erzincan",) else ("d" if nm in ("izmir", "sogut") else "r"))
            draw_city(c, cam, nm, a, t, big=big, side=side)
        vignette(c)
        # kartlar
        dim = 0.0
        for r in REG:
            a = eout(prog(t, r["t0"] - .2, r["t0"] + .3)) * (1 - eio(prog(t, r["t1"] + .05, r["t1"] + .45)))
            if a <= 0: continue
            dim = max(dim, a)
            if r["key"][0] == "battle": battle(c, t, r, a)
            else: dimmer(c, a); CARD_FN[r["key"][1]](c, t, r, a)
        year_card(c, t, dim)
        # alt yazı bandı
        p = skia.Paint(); p.setShader(skia.GradientShader.MakeLinear([skia.Point(0, H - 200), skia.Point(0, H)], [C("#F3EAD6", 0).toColor(), C("#F3EAD6", .85).toColor()]))
        c.drawRect(skia.Rect.MakeXYWH(0, H - 200, W, 200), p)
        captions(c, t)
        # kapanış
        if t > END0:
            q = eout(prog(t, END0, END0 + .8)); c.drawRect(skia.Rect.MakeWH(W, H), paint(NAVY, .92 * q))
            if q > .3:
                avatar_k(c, W / 2, 420, 110, q)
                line(c, t - END0, [("kuşlar", "b", 1.0), ("seni", "b", 1.2), ("bekliyor,", "b", 1.4), ("uç.", "i", 1.9)], W / 2, 680, 96, color="#F3EFE7", acc=ORANGE)
                text(c, "Karga Zihni", W / 2, 800, "s", 40, "#9AA0B5", q, align="center")
        if t < .5: c.drawRect(skia.Rect.MakeWH(W, H), paint("#000000", 1 - eio(prog(t, 0, .5))))
        if t > DUR - .45: c.drawRect(skia.Rect.MakeWH(W, H), paint("#000000", eio(prog(t, DUR - .45, DUR - .05))))
        c.drawImageRect(self.grain[f % len(self.grain)], skia.Rect.MakeWH(W, H), skia.SamplingOptions(), skia.Paint())
        return self.s
    def rgba(self, f): return self.frame(f).toarray()

def avatar_k(c, cx, cy, r, a=1.0):
    c.save(); pth = skia.Path(); pth.addCircle(cx, cy, r); c.clipPath(pth, doAntiAlias=True)
    p = skia.Paint(AntiAlias=True); p.setAlphaf(a)
    c.drawImageRect(img_k(), skia.Rect.MakeXYWH(cx - r, cy - r, 2 * r, 2 * r), SAMP, p); c.restore()
_K = None
def img_k():
    global _K
    if _K is None: _K = skia.Image.open(f"{os.environ['AKIS_KANAL']}/kanal/profil_A_turuncu_800.png")
    return _K

# ---------- ses ----------
SR = 48000
def build_audio(path, music=True):
    n = int(DUR * SR) + SR
    wf = wave.open(f"{V}/tts/voice.wav"); vsr = wf.getframerate(); v = np.frombuffer(wf.readframes(wf.getnframes()), np.int16).astype(np.float32) / 32768
    if vsr != SR: v = np.interp(np.arange(int(len(v) * SR / vsr)) / SR, np.arange(len(v)) / vsr, v).astype(np.float32)
    voice = np.zeros(n, np.float32); voice[:min(n, len(v))] = v[:n] * 1.1
    L = np.zeros(n, np.float32); R = np.zeros(n, np.float32)
    if music:   # sakin, belgesel havası: re minör pedal + yavaş arp
        beat = 60 / 72; bar = beat * 4
        chords = [(146.83, 174.61, 220.0, 293.66), (116.54, 146.83, 174.61, 233.08), (130.81, 164.81, 196.0, 261.63), (110.0, 138.59, 164.81, 220.0)]
        mus = np.zeros(n, np.float32)
        def put(t0, sig, g=1.0):
            i = int(t0 * SR); j = min(n, i + len(sig))
            if j > i >= 0: mus[i:j] += sig[:j - i] * g
        def pad(fr, d):
            m = int(d * SR); st = np.arange(m) / SR
            s = sum(np.sin(2 * np.pi * f * st + k) + .25 * np.sin(2 * np.pi * f * 2.002 * st) for k, f in enumerate(fr))
            return (s * np.minimum(1, st / 1.2) * np.minimum(1, (d - st) / 1.2) * .015).astype(np.float32)
        def pluck(f, d=1.2):
            m = int(d * SR); st = np.arange(m) / SR
            return ((np.sin(2 * np.pi * f * st) + .3 * np.sin(4 * np.pi * f * st) * np.exp(-st * 5)) * np.exp(-st * 3.2) * .04).astype(np.float32)
        for k in range(int(DUR / bar) + 1):
            chd = chords[k % 4]; t0 = k * bar; put(t0, pad(chd, bar + 1.2))
            for i, fq in enumerate([chd[0] * 2, chd[2] * 2, chd[3] * 2, chd[2] * 2]): put(t0 + i * beat, pluck(fq), .8)
            put(t0, pluck(chd[0] / 2, 2.5), 1.2)
        env = np.convolve(np.abs(voice), np.ones(int(.3 * SR)) / int(.3 * SR), "same")
        duck = 1 - .6 * np.clip(env / .025, 0, 1); tt = np.arange(n) / SR
        mus *= .9 * duck * np.minimum(1, tt / 2) * np.clip((DUR - tt) / 1.5, 0, 1) * (1 + .6 * (tt > END0))
        L += mus; R += mus
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
        print("süre", DUR, "kare", NFR, "kart", len(REG), "görünüm", len(VIEWK))
    elif MODE == "render":
        from multiprocessing import Pool
        nproc = int(sys.argv[2]) if len(sys.argv) > 2 else 4
        n = 48; cuts = [round(i * NFR / n) for i in range(n + 1)]
        with Pool(nproc) as pool: parts = pool.map(render_chunk, [(i, cuts[i], cuts[i + 1]) for i in range(n)], chunksize=1)
        a1 = build_audio(f"{OUT}/ses_muzikli.wav"); a2 = build_audio(f"{OUT}/ses_muziksiz.wav", music=False)
        lst = f"{OUT}/list.txt"; open(lst, "w").write("".join(f"file '{p}'\n" for p in parts))
        subprocess.run(["ffmpeg", "-y", "-v", "error", "-f", "concat", "-safe", "0", "-i", lst, "-c", "copy", f"{OUT}/video.mp4"], check=True)
        print("ok")
