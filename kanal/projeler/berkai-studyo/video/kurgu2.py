# BerkAİ ofis videosu v2 — premium/sade kurgu: avatar ~%20, ara görüntü ~%80, sol kartlar, günün saatleri, lofi, sıcak ton
import os
exec(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "kurgu.py")).read().split("# ---------- ekran öğeleri")[0])

_K = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "kurgu.py")).read()
exec(_K[_K.index("# ----- tek komut kartları (klip 2) -----"):_K.index("def prompt_card")])
exec(_K[_K.index("def grid("):_K.index("# ---------- kare kare")])
CREAM = (247, 243, 234); MUTED = (190, 180, 168); INK2 = (18, 15, 13)
ISB = "/usr/share/fonts/opentype/inter/Inter-SemiBold.otf"
F_SUB = F(ISB, 44)

# sessiz bölümler (günün saatleri)
SEC = []; t = V_END
for ad, sure, saat in (("musteri", 17.0, "14:05"), ("site", 28.0, "15:40"), ("mail", 9.0, "17:20"), ("mudur", 16.0, "18:45"), ("son", 10.0, "21:00")):
    SEC.append((ad, t, t + sure, saat)); t += sure
TOTAL = t; N = int(round(TOTAL * FPS)); SECD = {a: (b, e, s) for a, b, e, s in SEC}
print("toplam", round(TOTAL, 1))

W2 = {i: words(i) for i in (1, 2, 3)}
def wt(i, txt, n=1):
    c = 0
    for w in W2[i]:
        if w["text"].strip('.,?!"').lower() == txt.strip('.,?!"').lower():
            c += 1
            if c == n: return w["start"]
    raise KeyError(txt)

# ---------- katmanlar ----------
PIP_D = 400
def pip(f, avimg, t, t0, t1):
    size = PIP_D; cx, cy, r = 990, 600, 470
    face = avimg.crop((cx - r, cy - r, cx + r, cy + r)).resize((size, size), Image.LANCZOS)
    m = Image.new("L", (size * 2, size * 2), 0); ImageDraw.Draw(m).ellipse((0, 0, size * 2 - 1, size * 2 - 1), fill=255); m = m.resize((size, size), Image.LANCZOS)
    u = min(ease((t - t0) / .3), ease((t1 - t) / .25)); X = 24; Y = int(H - size + (1 - u) * (size + 20))
    sh_ = Image.new("RGBA", (W, H), (0, 0, 0, 0)); ImageDraw.Draw(sh_).ellipse((X - 6, Y - 6, X + size + 6, Y + size + 6), fill=(0, 0, 0, 110)); f.alpha_composite(sh_.filter(ImageFilter.GaussianBlur(14)))
    f.paste(face, (X, Y), m)

def lines_of(ws):
    L, cur = [], []
    for w in ws:
        cur.append(w)
        if w["text"].endswith((".", ",", "?")) or len(cur) >= 6: L.append(cur); cur = []
    if cur: L.append(cur)
    return L
LINES = []
for i, off in ((1, A0), (2, B0), (3, C0)):
    for ln in lines_of(W2[i]): LINES.append([dict(w, start=w["start"] + off, end=w["end"] + off) for w in ln])

def subtitle(f, t, pip_on):
    ln = next((l for l in LINES if l[0]["start"] - .05 <= t <= l[-1]["end"] + .15), None)
    if not ln: return
    s = " ".join(w["text"] for w in ln).rstrip(",")
    lay = Image.new("RGBA", (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(lay)
    tw = d.textlength(s, font=F_SUB); xc = W / 2
    if pip_on: xc = max(W / 2, 24 + PIP_D + 50 + tw / 2)
    x, y = xc - tw / 2, 968
    d.text((x + 2, y + 3), s, font=F_SUB, fill=(0, 0, 0, 170))
    lay = lay.filter(ImageFilter.GaussianBlur(3)); d = ImageDraw.Draw(lay)
    d.text((x, y), s, font=F_SUB, fill=(255, 255, 255, 255))
    f.alpha_composite(lay)

def card(f, t, t0, t1, title, items=(), x=90, y=86, w=640):
    """Sol üstte sade kart. items: [(metin, görünme_zamanı)] — onay işaretiyle sırayla gelir."""
    if not (t0 <= t <= t1): return
    a = min(1, (t - t0) / .25, (t1 - t) / .25); dy = int((1 - ease((t - t0) / .3)) * 14)
    vis = [s for s, ti in items if t >= ti]
    h = 92 + 56 * len(vis) + (14 if vis else 0)
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
    d.text((x0 + 50, y0 + 11), s, font=fn, fill=(*CREAM, int(255 * a)))
    f.alpha_composite(lay)

def aroll(avimg, z=1.0):
    return zoom(avimg, z, .43, .44) if z > 1.001 else avimg

# klip 2 kartları için sade belge görünümü
def doc(f, t, t0, t1):
    if not (t0 <= t <= t1): return
    a = min(1, (t - t0) / .3, (t1 - t) / .3)
    lay = Image.new("RGBA", (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(lay)
    x0, y0, x1, y1 = 520, 110, 1830, 820
    d.rounded_rectangle((x0, y0, x1, y1), radius=22, fill=(*CREAM, int(248 * a)))
    d.text((x0 + 50, y0 + 34), "Fable 5.2'ye verilen tek komut", font=F(IBo, 32), fill=(*ORANGE, int(255 * a)))
    d.line((x0 + 50, y0 + 90, x1 - 50, y0 + 90), fill=(216, 205, 184, int(255 * a)), width=2)
    chars = int((t - t0) * 240); y = y0 + 118; fn = F(IM, 30)
    for ln in PROMPT:
        s = re.sub(r"\*\*|`", "", ln); parts, cur = [], ""
        for wd in s.split():
            if d.textlength(cur + " " + wd, font=fn) > x1 - x0 - 110: parts.append(cur); cur = wd
            else: cur = (cur + " " + wd).strip()
        parts.append(cur)
        for p_ in parts:
            if chars <= 0: break
            d.text((x0 + 50, y), p_[:chars], font=fn, fill=(30, 26, 23, int(255 * a))); chars -= len(p_); y += 44
        y += 14
        if y > y1 - 60: break
    f.alpha_composite(lay)

# ---------- zamanlar ----------
a_konu = wt(1, "Kanal"); a_site = wt(1, "on", 2); a_demo = wt(1, "iki"); a_mail = wt(1, "dört", 2); a_mud = wt(1, "ve", 2); a_ofis = wt(1, "Hatta"); a_simdi = wt(1, "Şimdi"); a_o = wt(1, "O")
b_prompt = wt(2, "Fable'a") - .3; b_ekip = wt(2, "6"); b_kural = wt(2, "3"); b_dosya = wt(2, "eski") - .3; b_yani = wt(2, "Yani"); b_saat = wt(2, "Sonra")
c_485 = wt(3, "Son"); c_ama = wt(3, "Ama"); c_yapim = wt(3, "İkinci"); c_cunku = wt(3, "Çünkü")
team_items = [("Konu ekibi", B0 + wt(2, "konu")), ("Yapım ekibi", B0 + wt(2, "yapım")), ("Müşteri bulma", B0 + wt(2, "müşteri")), ("3D site", B0 + wt(2, "3D", 2)), ("Mail", B0 + wt(2, "mail")), ("Müdür", B0 + wt(2, "müdür"))]
rule_items = [("Boş iş yok", B0 + wt(2, "boş")), ("Uydurma yok", B0 + wt(2, "Uydurma")), ("Gönder tuşu bende", B0 + wt(2, "Mailler"))]
file_items = [("Kanalın kuralları", B0 + wt(2, "Kanalın")), ("Satış tablom", B0 + wt(2, "satış")), ("Eski maillerim", B0 + wt(2, "daha"))]
day_items = [("5 video konusu", a_konu), ("14 site incelemesi", a_site), ("2 çalışan 3D site", a_demo), ("4 mail taslağı", a_mail), ("Müdürün raporu", a_mud)]

# ---------- kare kare ----------
avs = [Reader(f"{D}/av{i}.mp4") for i in (1, 2, 3)]
enc = subprocess.Popen(["ffmpeg", "-y", "-v", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
                        "-vf", "eq=contrast=1.03:saturation=1.05:gamma=0.99,colorbalance=rs=0.025:bs=-0.03:rm=0.015:bm=-0.015:rh=0.02:bh=-0.01",
                        "-c:v", "libx264", "-preset", "medium", "-crf", "17", "-pix_fmt", "yuv420p", f"{D}/video_only2.mp4"], stdin=subprocess.PIPE)
PREV = [float(x) for x in os.environ.get('PREV', '').split(',') if x]
for i in range(N):
    t = i / FPS; pip_on = False; avimg = None
    if t < B0:                                   # ---- KLİP 1
        avimg = avs[0].next(); u = t
        if u < 4.6: base = tour(u); pip_on = True
        elif u < a_konu - .1: base = aroll(avimg, 1.12)
        elif u < a_site - .1: base = tour(8.5 + (u - a_konu)); pip_on = True
        elif u < a_demo - .1: base = grid(u, a_site); pip_on = True
        elif u < a_mail - .1: base = demo(DEMO1, 5 + (u - a_demo) * 1.2, DEMO_BLUR); pip_on = True
        elif u < a_mud - .1: base = rec(40.3 + (u - a_mail)); pip_on = True
        elif u < a_ofis - .1: base = tour(84 + (u - a_mud)); pip_on = True
        elif u < a_simdi - .1: base = tour(100 + (u - a_ofis)); pip_on = True
        elif u < a_o - .1: base = aroll(avimg, 1.0)
        elif u < a_o + 2.3: base = aroll(avimg, 1.12)
        else: base = rec(18 + (u - a_o - 2.3)); pip_on = True
    elif t < C0:                                  # ---- KLİP 2
        avimg = avs[1].next(); u = t - B0
        if u < b_prompt: base = aroll(avimg, 1.12)
        elif u < b_ekip - .1: base = tour(20 + u * .4).filter(ImageFilter.GaussianBlur(10)); pip_on = True
        elif u < b_dosya - .1: base = tour(6 + (u - b_ekip) * .9); pip_on = True     # ekipler sayılırken ofiste yürüyüş
        elif u < b_yani - .1: base = rec(2 + (u - b_dosya) * .8); pip_on = True
        elif u < b_saat - .1: base = aroll(avimg, 1.0)
        else: base = tour(min(106, (u - b_saat) * 22)); pip_on = True
    elif t < V_END:                               # ---- KLİP 3
        avimg = avs[2].next(); u = t - C0
        if u < 6.0: base = rec(u); pip_on = True
        elif u < c_ama - .1: base = aroll(avimg, 1.12 if u < c_485 + 1.6 else 1.0)
        elif u < c_yapim - .1: base = zoom(tour(15.5), 1.0 + .08 * ease((u - c_ama) / 10), .72, .45); pip_on = True
        elif u < c_cunku - .1: base = rec(min(38.3, 18 + (u - c_yapim))); pip_on = True
        else: base = aroll(avimg, 1.12)
    else:                                         # ---- SESSİZ BÖLÜMLER
        ad = next(a for a, b, e, s in SEC if b <= t < e); b, e, saat = SECD[ad]; u = t - b
        if ad == "musteri": base = rec(59.5 + u) if u < 12 else grid(u, 0)
        elif ad == "site": base = (rec(8 + u) if u < 3 else rec(15 + (u - 3))) if u < 6 else demo(DEMO1, DEMO1_T0 + (u - 6) * .65, DEMO_BLUR)
        elif ad == "mail": base = rec(37 + u)
        elif ad == "mudur": base = rec(74 + u)
        else: base = zoom(rec(min(95.5, 90 + u)), 1.0 + .015 * u)
    f = base.convert("RGBA")
    # ---- üst katman
    if t < B0:
        if pip_on:
            seg0 = 0 if t < 4.6 else (a_konu - .1 if t < a_simdi else a_o + 2.3)
            seg1 = 4.6 if t < 4.6 else (a_simdi - .1 if t < a_simdi else B0 + .3)
            pip(f, avimg, t, seg0, seg1)
        card(f, t, 4.7, a_konu - .2, "Tek komut, tek gün", [("17 çalışan", 4.8), ("6 ekip", 5.6)])
        card(f, t, a_konu - .1, a_ofis - .2, "Akşam masamda", day_items)
        card(f, t, a_simdi, a_o - .2, "\"Süslü bir animasyon mu?\"", [("Her masada çıkan dosyayı açıyoruz", a_simdi + 1.2)])
    elif t < C0:
        u = t - B0
        clock_chip(f, t, B0 + .2, "09:10")
        if u >= b_prompt - .1 and u < b_ekip - .1: doc(f, t, B0 + b_prompt, B0 + b_ekip - .15)
        card(f, t, B0 + b_ekip - .1, B0 + b_kural - .15, "6 ekip", team_items)
        card(f, t, B0 + b_kural - .1, B0 + b_dosya - .15, "3 kural", rule_items, w=600)
        card(f, t, B0 + b_dosya - .1, B0 + b_yani - .2, "İlk gün verdiklerim", file_items)
        card(f, t, B0 + b_saat + 1.2, C0 - .1, "1 saat sonra", [("Ofis hazır", B0 + b_saat + 1.6)], w=460)
        if pip_on: pip(f, avimg, t, B0 + b_prompt, C0 + .3) if u < b_yani else pip(f, avimg, t, B0 + b_saat, C0 + .3)
    elif t < V_END:
        u = t - C0
        clock_chip(f, t, C0 + .2, "11:30")
        card(f, t, C0 + .3, C0 + 5.8, "1 · Konu ekibi", [("Trendler + rakipler + kanal verisi", C0 + 1.2)])
        card(f, t, C0 + c_485 - .1, C0 + c_ama - .2, "Kanalın son 7 videosu", [("Ortalama 485 izlenme", C0 + c_485 + 1.4), ("Sorun konu değil, başlık", C0 + c_485 + 6.0)])
        card(f, t, C0 + c_ama, C0 + c_yapim - .2, "Konu ekibinin önerisi", [("Fable 5.2 + yapay zekâ ekibi", C0 + c_ama + 6.0), ("Şu an izlediğin video", C0 + wt(3, "Şu"))])
        card(f, t, C0 + c_yapim, C0 + c_cunku - .2, "2 · Yapım ekibi", [("Senaryo, başlık, açıklama", C0 + wt(3, "Senaryo")), ("Kapak fikri, Shorts", C0 + wt(3, "kapak")), ("Her bilginin yanında kaynak", C0 + wt(3, "Senaryodaki"))])
        if pip_on: pip(f, avimg, t, C0 - .3 if u < 6 else (C0 + c_ama - .1 if u < c_cunku else 0), C0 + 6.0 if u < 6 else C0 + c_cunku - .1)
    else:
        ad = next(a for a, b, e, s in SEC if b <= t < e); b, e, saat = SECD[ad]; u = t - b
        clock_chip(f, t, b + .2, saat)
        if ad == "musteri":
            card(f, t, b + .3, e - .2, "3 · Müşteri bulma ekibi", [("14 gerçek işletmenin sitesi açıldı", b + 1.5), ("Telefon + bilgisayarda ölçüldü", b + 4.5), ("6'sı elendi: siteleri zaten iyi", b + 9.0), ("3 güçlü aday kaldı", b + 12.5)])
        elif ad == "site":
            card(f, t, b + .3, e - .2, "4 · 3D site ekibi", [("En iyi 2 aday için demo", b + 1.5), ("Tek fotoğraf yok, hepsi kod", b + 7.5), ("8 kontrolün 8'i geçti", b + 14.0), ("ZIP hazır → Netlify'a sürükle", b + 20.0)])
        elif ad == "mail":
            card(f, t, b + .3, e - .2, "5 · Mail ekibi", [("4 kişiye özel taslak", b + 1.4), ("Fiyat yok, garanti yok", b + 3.8), ("0 gönderildi, onay bende", b + 6.0)])
        elif ad == "mudur":
            card(f, t, b + .3, e - .2, "6 · Müdür odası", [("Günlük rapor", b + 1.5), ("Onayımı bekleyen 5 karar", b + 4.5), ("Yarın: tek komut, kaldığı yerden", b + 9.5)])
        else:
            if u > 2.0:
                k = ease((u - 2.0) / .6)
                ov = Image.new("RGBA", (W, H), (*INK2, int(170 * k))); f.alpha_composite(ov)
                lay = Image.new("RGBA", (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(lay)
                s = "Sıradaki ekibi hangi işe kuralım?"; fn = F(IBo, 76); tw = d.textlength(s, font=fn)
                d.text((W / 2 - tw / 2, 380), s, font=fn, fill=(*CREAM, int(255 * k)))
                s = "Yorumlara yaz · komutun tamamı açıklamada"; fn = F(IM, 38); tw = d.textlength(s, font=fn)
                d.text((W / 2 - tw / 2, 490), s, font=fn, fill=(*ORANGE, int(255 * k)))
                f.alpha_composite(lay)
            if u > e - b - .8: f = Image.blend(f.convert("RGB"), Image.new("RGB", (W, H), (0, 0, 0)), (u - (e - b - .8)) / .8).convert("RGBA")
    if t < V_END: subtitle(f, t, pip_on)
    if PREV:
        if any(abs(t - x) < .5 / FPS for x in PREV): f.convert('RGB').save(f'{D}/p2_{t:.1f}.jpg', quality=85)
        if t > max(PREV): break
        continue
    enc.stdin.write(f.convert("RGB").tobytes())
enc.stdin.close(); enc.wait()
if PREV: raise SystemExit

# ---------- ses: konuşma + lofi ----------
sr = 48000; n = int(TOTAL * sr); rng = np.random.default_rng(7)
voice = np.zeros(n)
for c, off in zip(CLIPS, (A0, B0, C0)):
    raw = subprocess.check_output(["ffmpeg", "-v", "error", "-i", c, "-af", "loudnorm=I=-14:TP=-1.5:LRA=11", "-ac", "1", "-ar", str(sr), "-f", "s16le", "-"])
    v = np.frombuffer(raw, np.int16).astype(np.float64) / 32768; i0 = int(off * sr); voice[i0:i0 + len(v)] = v[:n - i0]
tt = np.arange(n) / sr; mus = np.zeros(n)
bpm = 80; beat = 60 / bpm
chords = [(220.0, 261.63, 329.63, 392.0), (174.61, 220.0, 261.63, 329.63), (196.0, 246.94, 293.66, 349.23), (164.81, 207.65, 246.94, 329.63)]
def keys(fr, L):
    s_ = np.arange(L) / sr; env = np.minimum(1, s_ / .02) * np.exp(-s_ * 1.1); trem = 1 + .15 * np.sin(2 * np.pi * 4.5 * s_)
    return sum((np.sin(2 * np.pi * f_ * s_) + .25 * np.sin(4 * np.pi * f_ * s_)) for f_ in fr) * env * trem * .022
for k in range(int(TOTAL / (beat * 4)) + 1):
    i0 = int(k * beat * 4 * sr); L = min(n - i0, int(beat * 4.2 * sr))
    if L <= 0: continue
    mus[i0:i0 + L] += keys(chords[k % 4], L)
    for j in range(4):                                         # yumuşak davul
        p0 = i0 + int(j * beat * sr); Lp = min(n - p0, int(.35 * sr))
        if Lp <= 0: continue
        ps = np.arange(Lp) / sr
        if j % 2 == 0: mus[p0:p0 + Lp] += np.sin(2 * np.pi * (50 + 60 * np.exp(-ps * 30)) * ps) * np.exp(-ps * 9) * .16
        else: mus[p0:p0 + Lp] += rng.normal(0, 1, Lp) * np.exp(-ps * 22) * .035
        for h in (0, .5):
            q0 = p0 + int(h * beat * sr); Lq = min(n - q0, int(.05 * sr))
            if Lq > 0: mus[q0:q0 + Lq] += rng.normal(0, 1, Lq) * np.exp(-np.arange(Lq) / sr * 120) * .012
mus += np.convolve(rng.normal(0, 1, n) * (rng.random(n) > .9993), np.ones(30) / 30, "same") * .05   # plak cızırtısı
mus = np.convolve(mus, np.ones(6) / 6, "same")                                                       # yumuşat
duck = 1 - .55 * np.clip(np.convolve(np.abs(voice), np.ones(int(.3 * sr)) / int(.3 * sr), "same") / .03, 0, 1)
mus *= duck * np.where(tt >= V_END, 1.8, 1.0) * np.minimum(1, tt / 1.0) * np.clip((TOTAL - tt) / 1.0, 0, 1)
mix = voice + mus; mix = mix / max(1, np.abs(mix).max() / .95)
st = (np.stack([mix, mix], 1) * 32767).astype(np.int16)
with wave.open(f"{D}/ses2.wav", "wb") as wf: wf.setnchannels(2); wf.setsampwidth(2); wf.setframerate(sr); wf.writeframes(st.tobytes())
OUT = "/home/user/analiz/video_teslim/BerkAI_Yapay_Zeka_Ofisi_v2.mp4"
sh(f'ffmpeg -v error -y -i {D}/video_only2.mp4 -i {D}/ses2.wav -map 0:v -map 1:a -c:v libx264 -preset slow -crf 19 -pix_fmt yuv420p -c:a aac -b:a 192k -shortest -movflags +faststart {OUT}')
print("ok", OUT, round(TOTAL, 1))
