# Çizgi film sahnesi: 29 Mayıs 1453 şafağı, Osmanlı ordugâhı. Fatih ve yeniçeri konuşuyor.
# Kullanım: python3 sahne_fatih.py tts   → sesler + zaman çizelgesi
#           python3 sahne_fatih.py stills 3 9   |   python3 sahne_fatih.py   → video
import json, math, os, sys, subprocess, hashlib, wave, urllib.request, time
from fmtlib import *
from cizgi import fillo, OL, minaret
import karakter as K

KEY = open(f"{D}/../.xi").read().strip()
VOICES = {"N": ("KTXKO43nOuyC5Akqu7yX", 1.1), "F": ("7VqWGAWwo2HMrylfKrcm", 1.0), "Y": ("nBnvrVUbHrIrA5DpT4vp", 1.05)}
# (konuşan, metin, alt yazı, çekim, fatih ifadesi, yeniçeri ifadesi)
LINES = [
    ("N", "Yirmi dokuz Mayıs, bin dört yüz elli üç. Şafaktan önce, Osmanlı ordugâhı.", "29 Mayıs 1453 · Osmanlı ordugâhı", "wide", "normal", "normal"),
    ("Y", "Sultanım! Elli üç gündür bu surların önündeyiz. Askerler yorgun.", "53 gündür surların önündeyiz.", "Y", "normal", "kizgin"),
    ("F", "Biliyorum. Ama bu gece, son gece.", "Bu gece, son gece.", "F", "normal", "normal"),
    ("Y", "Peki ya surlar yine dayanırsa?", "Ya surlar yine dayanırsa?", "two", "normal", "kizgin"),
    ("N", "Rivayete göre Fatih şöyle cevap verdi:", "Rivayete göre...", "F", "kizgin", "normal"),
    ("F", "Ya ben o şehri alırım, ya o şehir beni alır.", "Ya ben o şehri alırım, ya o şehir beni.", "Fc", "kizgin", "normal"),
    ("Y", "Emredersiniz Sultanım! Şafakla birlikte!", "Emredersiniz Sultanım!", "Y", "gulen", "gulen"),
    ("N", "Ve birkaç saat sonra, şehrin kapıları açıldı.", "Birkaç saat sonra kapılar açıldı.", "city", "gulen", "gulen"),
]
T_DIR = f"{D}/out/sahne_tts"; os.makedirs(T_DIR, exist_ok=True)
SR = 44100

def synth(who, text):
    vid, sp = VOICES[who]
    mp3 = f"{T_DIR}/{who}_{hashlib.sha1(text.encode()).hexdigest()[:12]}.mp3"
    if os.path.exists(mp3) and os.path.getsize(mp3) > 1000: return mp3
    body = json.dumps({"text": text, "model_id": "eleven_v4", "language_code": "tr",
                       "voice_settings": {"stability": .45, "similarity_boost": .8, "style": .35, "use_speaker_boost": True, "speed": sp}}).encode()
    for k in range(6):
        try:
            req = urllib.request.Request(f"https://api.elevenlabs.io/v1/text-to-speech/{vid}?output_format=mp3_44100_128", body, {"xi-api-key": KEY, "Content-Type": "application/json"})
            open(mp3, "wb").write(urllib.request.urlopen(req, timeout=120).read()); return mp3
        except Exception as e:
            err = e; time.sleep(3 * 2 ** k)
    raise RuntimeError(err)

def build_tts():
    t = .8; items = []; tracks = {k: [] for k in VOICES}
    for i, (who, text, cap, shot, fe, ye) in enumerate(LINES):
        raw = subprocess.check_output(["ffmpeg", "-v", "error", "-i", synth(who, text), "-ac", "1", "-ar", str(SR), "-f", "s16le", "-"])
        a = np.frombuffer(raw, np.int16); nz = np.nonzero(np.abs(a) > 400)[0]
        if len(nz): a = a[max(0, nz[0] - int(.03 * SR)):nz[-1] + int(.1 * SR)]
        d = len(a) / SR; items.append({"who": who, "t": round(t, 3), "d": round(d, 3), "cap": cap, "shot": shot, "fe": fe, "ye": ye})
        tracks[who].append((t, a)); t += d + (.45 if who != "N" else .6)
    total = t + 1.6
    mix = np.zeros(int(total * SR), np.float32); env = {}
    for who, lst in tracks.items():
        tr = np.zeros(int(total * SR), np.float32)
        for st, a in lst: k = int(st * SR); tr[k:k + len(a)] += a.astype(np.float32)
        mix += tr
        hop = SR // 30; n = len(tr) // hop
        e = np.sqrt(np.mean(tr[:n * hop].reshape(n, hop) ** 2, axis=1)); env[who] = (e / (np.percentile(e[e > 0], 95) + 1e-6)).clip(0, 1.2).round(3).tolist() if (e > 0).any() else [0] * n
    # hafif ortam: ateş çıtırtısı + rüzgâr (kodla)
    rng = np.random.default_rng(1); n = len(mix)
    wind = np.convolve(rng.normal(0, 1, n), np.ones(400) / 400, "same") * 900
    crack = (rng.random(n) < .0006) * rng.normal(0, 5000, n); crack = np.convolve(crack, np.exp(-np.arange(300) / 40), "same") * .25
    mix += wind + crack
    mix = (mix / max(1, np.abs(mix).max()) * 30000).astype(np.int16)
    with wave.open(f"{D}/out/sahne_ses.wav", "wb") as wf:
        wf.setnchannels(1); wf.setsampwidth(2); wf.setframerate(SR); wf.writeframes(mix.tobytes())
    json.dump({"total": total, "items": items, "env": env}, open(f"{D}/out/sahne_tl.json", "w"), ensure_ascii=False)
    print("toplam", round(total, 1), "sn")

# ---------------- arka plan: ordugâh ----------------
def tent(c, x, g, w, h, body, trim, roof=None):
    roof = roof or body
    wall = svgp(f"M {x - w / 2} {g} L {x - w / 2} {g - h * .55} L {x + w / 2} {g - h * .55} L {x + w / 2} {g} Z"); fillo(c, wall, body)
    door = svgp(f"M {x - w * .12} {g} L {x - w * .1} {g - h * .4} Q {x} {g - h * .5} {x + w * .1} {g - h * .4} L {x + w * .12} {g} Z"); fillo(c, door, "#3A2418", 3)
    rf = svgp(f"M {x - w * .6} {g - h * .52} L {x} {g - h} L {x + w * .6} {g - h * .52} Z"); fillo(c, rf, roof)
    n = max(5, int(w / 34))
    sc = skia.Path(); sc.moveTo(x - w * .6, g - h * .52)
    for k in range(n): x0 = x - w * .6 + w * 1.2 * k / n; sc.quadTo(x0 + w * .6 / n, g - h * .52 + 26, x0 + w * 1.2 / n, g - h * .52)
    sc.lineTo(x - w * .6, g - h * .52); c.drawPath(sc, paint(trim)); c.drawPath(sc, paint(OL, 1, 3))
    c.drawLine(x, g - h, x, g - h - 40, paint(OL, 1, 4)); c.drawCircle(x, g - h - 44, 8, paint("#D9A93A")); c.drawCircle(x, g - h - 44, 8, paint(OL, 1, 2))

def tug(c, x, g, h, t, ph=0):
    c.drawLine(x, g, x, g - h, paint(OL, 1, 8)); c.drawLine(x, g, x, g - h, paint("#7A4A26", 1, 4))
    sw = 8 * math.sin(t * 2 + ph)
    hair = svgp(f"M {x - 8} {g - h + 20} C {x - 30 + sw} {g - h + 70} {x - 24 + sw} {g - h + 130} {x - 10 + sw * 1.5} {g - h + 160} L {x + 10 + sw * 1.5} {g - h + 160} C {x + 24 + sw} {g - h + 130} {x + 30 + sw} {g - h + 70} {x + 8} {g - h + 20} Z")
    fillo(c, hair, "#E9E1CF", 3)
    c.drawCircle(x, g - h + 8, 14, paint("#D9A93A")); c.drawCircle(x, g - h + 8, 14, paint(OL, 1, 3))
    c.drawPath(svgp(f"M {x - 6} {g - h - 6} L {x} {g - h - 34} L {x + 6} {g - h - 6} Z"), paint("#D9A93A"))

def cannon(c, x, g, s):
    T = lambda d: svgp(d, x, g, s)
    fillo(c, T("M -70 -40 L 90 -64 C 104 -66 108 -40 96 -34 L -66 -10 Z"), "#5A4F48", 3)
    for k in range(3): c.drawCircle(x + (-40 + k * 50) * s, g - 10 * s, 18 * s, paint("#6B4A2E")); c.drawCircle(x + (-40 + k * 50) * s, g - 10 * s, 18 * s, paint(OL, 1, 3))

_bg = None
def bg_static():
    global _bg
    if _bg: return _bg
    s = skia.Surface(int(W * 1.3), int(H * 1.3)); c = s.getCanvas(); c.translate(W * .15, H * .15)
    c.clear(skia.Color4f(0, 0, 0, 0))
    # uzak şehir: surlar, kuleler, kubbe (minaresiz Ayasofya)
    city = paint("#4B4C70")
    c.drawPath(svgp("M -300 560 C 100 520 500 470 900 470 C 1300 470 1700 500 2300 540 L 2300 700 L -300 700 Z"), paint("#5B5A7E"))
    dome_x = 1450
    c.drawPath(svgp(f"M {dome_x - 150} 455 C {dome_x - 150} 340 {dome_x + 150} 340 {dome_x + 150} 455 Z"), city)
    c.drawRect(skia.Rect.MakeLTRB(dome_x - 220, 450, dome_x + 220, 520), city)
    for bx, bw, bh in ((1150, 90, 60), (1700, 120, 70), (950, 70, 40), (1880, 80, 50)):
        c.drawRect(skia.Rect.MakeLTRB(bx - bw / 2, 500 - bh, bx + bw / 2, 520), city)
    wall = paint("#3E3F5E")
    c.drawRect(skia.Rect.MakeLTRB(-300, 520, 2300, 600), wall)
    for k in range(-6, 40):
        x = k * 70; c.drawRect(skia.Rect.MakeXYWH(x, 508, 36, 14), wall)
    for k in range(-2, 12):
        x = k * 230 + 40; c.drawRect(skia.Rect.MakeXYWH(x, 470, 70, 130), wall)
        for j in range(3): c.drawRect(skia.Rect.MakeXYWH(x + j * 26, 458, 18, 14), wall)
    # orta plan: tepe + çadırlar + toplar
    c.drawPath(svgp("M -300 640 C 200 600 700 620 1100 610 C 1500 600 1900 620 2300 610 L 2300 1500 L -300 1500 Z"), paint("#8C7A54"))
    for k, (x, w, h, body, trim, roof) in enumerate([(-120, 220, 200, "#EFE6D2", "#2F6B4F", "#2F6B4F"), (1980, 240, 210, "#EFE6D2", "#B3262E", "#B3262E"),
                                                    (1700, 180, 170, "#E6DCC4", "#2F6B4F", "#2F6B4F"), (160, 170, 160, "#E6DCC4", "#B3262E", "#B3262E")]):
        tent(c, x, 690, w, h, body, trim, roof)
    for x in (1060, 1250): cannon(c, x, 660, .9)
    # otağ (sultan çadırı)
    tent(c, 360, 780, 520, 420, "#B3262E", "#D9A93A", "#9A1E26")
    for k in range(6): c.drawLine(360 - 220 + k * 88, 780 - 220, 360 - 220 + k * 88, 780, paint("#D9A93A", .7, 4))
    # ön zemin
    fl = skia.Paint(); fl.setShader(skia.GradientShader.MakeLinear([skia.Point(0, 760), skia.Point(0, 1300)], [col("#A08B60").toColor(), col("#7E6B45").toColor()]))
    c.drawPath(svgp("M -300 790 C 300 770 900 780 1500 770 C 1900 765 2100 780 2300 775 L 2300 1500 L -300 1500 Z"), fl)
    c.drawPath(svgp("M -300 790 C 300 770 900 780 1500 770 C 1900 765 2100 780 2300 775"), paint(OL, 1, 4))
    rng = np.random.default_rng(3)
    for _ in range(60):
        x, y = rng.uniform(-200, 2200), rng.uniform(820, 1300)
        c.drawOval(skia.Rect.MakeXYWH(x, y, rng.uniform(20, 46), rng.uniform(8, 14)), paint("#6B5A3A", .5))
    _bg = s.makeImageSnapshot(); return _bg

def sky(c, t, total):
    u = smooth(prog(t, total - 9, total - 1))
    top = [lerp(a, b, u) for a, b in ((0x2B, 0x6A), (0x32, 0x8F), (0x60, 0xC8))]
    mid = [lerp(a, b, u) for a, b in ((0x8E, 0xF2), (0x5A, 0xB0), (0x7A, 0x7E))]
    hor = [lerp(a, b, u) for a, b in ((0xF2, 0xFF), (0xA6, 0xD9), (0x5A, 0x8A))]
    cc = lambda v: skia.Color4f(v[0] / 255, v[1] / 255, v[2] / 255, 1)
    p = skia.Paint(); p.setShader(skia.GradientShader.MakeLinear([skia.Point(0, -200), skia.Point(0, 640)], [cc(top).toColor(), cc(mid).toColor(), cc(hor).toColor()], [0, .6, 1]))
    c.drawRect(skia.Rect.MakeLTRB(-400, -400, W + 400, 900), p)
    g = skia.Paint(AntiAlias=True); g.setColor4f(col("#FFD58A", .45 + .4 * u)); g.setMaskFilter(skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, 70))
    c.drawCircle(1500, 560 - 90 * u, 140 + 60 * u, g)
    for k in range(30):
        x = (k * 397) % W; y = (k * 131) % 380
        c.drawCircle(x, y - 80, 1.6, paint("#FFFFFF", (1 - u) * .7))

def fire(c, x, g, t):
    for k in range(5): c.drawLine(x - 50 + k * 25, g, x - 20 + k * 10, g - 24, paint("#5A3A22", 1, 10))
    for k in range(3):
        f = 1 + .15 * math.sin(t * 9 + k * 2)
        h = (90 - k * 22) * f; w = 46 - k * 10
        col_ = ["#E8582A", "#F2A23A", "#FFE38A"][k]
        p = svgp(f"M {x - w} {g - 10} C {x - w} {g - h * .6} {x - 10 + 8 * math.sin(t * 7)} {g - h * .8} {x + 4 * math.sin(t * 11)} {g - h} C {x + 12} {g - h * .7} {x + w} {g - h * .5} {x + w} {g - 10} Z")
        c.drawPath(p, paint(col_))
    gl = skia.Paint(AntiAlias=True); gl.setColor4f(col("#FFB060", .25)); gl.setMaskFilter(skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, 60)); c.drawCircle(x, g - 50, 160, gl)

# ---------------- kamera + çizim ----------------
TL = None
def tl():
    global TL
    if TL is None: TL = json.load(open(f"{D}/out/sahne_tl.json"))
    return TL
FX, YX, GY, SC = 700, 1270, 1050, .92
SHOTS = {"wide": (960, 560, 1.0), "two": (985, 520, 1.12), "F": (FX + 60, 360, 1.7), "Fc": (FX + 20, 420, 2.0), "Y": (YX - 60, 360, 1.7), "city": (1400, 470, 1.25)}
def cam_at(t):
    items = tl()["items"]; cur = items[0]; prev = items[0]
    for it in items:
        if t >= it["t"] - .25: prev, cur = cur, it
    a = SHOTS[prev["shot"]]; b = SHOTS[cur["shot"]]; u = eio(prog(t, cur["t"] - .25, cur["t"] + .45))
    return [lerp(a[k], b[k], u) for k in range(3)], cur

def env(who, t):
    e = tl()["env"][who]; f = int(t * 30)
    return e[f] if 0 <= f < len(e) else 0

def blink(t, ph): return 1 if (t + ph) % 3.6 < .12 else 0

def draw(c, t):
    total = tl()["total"]
    (cx, cy, z), cur = cam_at(t)
    z *= 1 + .01 * t / 10
    c.save(); c.translate(W / 2, H / 2); c.scale(z, z); c.translate(-cx, -cy)
    # paralaks: gökyüzü daha az kayar
    c.save(); c.translate((cx - 960) * .5, (cy - 540) * .5); sky(c, t, total); c.restore()
    c.save(); c.translate((cx - 960) * .15, (cy - 540) * .15); c.drawImage(bg_static(), -W * .15, -H * .15); c.restore()
    for x, ph in ((90, 0), (640, 1.3), (1880, 2.2)): tug(c, x, 790, 300, t, ph)
    fire(c, 985, 850, t)
    for x in (FX, YX):
        sh = paint("#000000", .25); sh.setMaskFilter(skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, 16)); c.drawOval(skia.Rect.MakeXYWH(x - 180, GY - 26, 360, 52), sh)
    fe = cur["fe"]; ye = cur["ye"]
    ft = env("F", t); yt = env("Y", t)
    K.fatih(c, FX, GY, SC, fe, t, rose=False, talk=ft, blink=blink(t, .4), look=1, bob=4 * math.sin(t * 2) + 8 * ft)
    K.yeniceri(c, YX, GY, SC, ye, t, talk=yt, blink=blink(t, 1.9), look=-1, bob=4 * math.sin(t * 2.3 + 1) + 8 * yt, gesture=.6 * min(1, yt * 1.5) if cur["who"] == "Y" else 0)
    c.restore()
    # alt yazı
    if cur and t < cur["t"] + cur["d"] + .3 and t > cur["t"] - .1:
        cap = cur["cap"]; who = {"N": "", "F": "Fatih", "Y": "Yeniçeri"}[cur["who"]]
        f = font(F_BOLD, 46); w_ = f.measureText(cap) + 70
        r = skia.RRect.MakeRectXY(skia.Rect.MakeXYWH(W / 2 - w_ / 2, H - 150, w_, 84), 20, 20)
        c.drawRRect(r, paint("#0E0B08", .72))
        text(c, cap, W / 2, H - 94, F_BOLD, 46, "#FFFFFF", align="center")
        if who:
            fw = font(F_BOLD, 30).measureText(who) + 36
            rr = skia.RRect.MakeRectXY(skia.Rect.MakeXYWH(W / 2 - w_ / 2 + 20, H - 178, fw, 46), 12, 12)
            c.drawRRect(rr, paint("#B3262E" if cur["who"] == "F" else "#2C4F8C")); text(c, who, W / 2 - w_ / 2 + 38, H - 144, F_BOLD, 30, "#FFFFFF")
    a = 1 - prog(t, 0, .6);
    if a > 0: c.drawRect(skia.Rect.MakeWH(W, H), paint("#000000", a))
    a = prog(t, total - .7, total)
    if a > 0: c.drawRect(skia.Rect.MakeWH(W, H), paint("#000000", a))

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "tts": build_tts(); sys.exit()
    tot = tl()["total"]
    if len(sys.argv) > 1 and sys.argv[1] == "stills": main(f"{D}/out/sahne_fatih.mp4", tot, draw); sys.exit()
    main(f"{D}/out/sahne_fatih_v.mp4", tot, draw)
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", f"{D}/out/sahne_fatih_v.mp4", "-i", f"{D}/out/sahne_ses.wav", "-map", "0:v", "-map", "1:a",
                    "-c:v", "copy", "-c:a", "aac", "-b:a", "160k", "-shortest", "-movflags", "+faststart", f"{D}/out/sahne_fatih.mp4"], check=True)
    print("ok sahne_fatih.mp4")
