#!/usr/bin/env python3
"""Garden Motors dikey Shorts (1080x1920). python3 render_short.py stills 1 5 ... | render"""
import json, math, os, re, subprocess, sys, wave
import numpy as np, skia
V = os.path.dirname(os.path.abspath(__file__))
SR_ = os.path.join(os.path.dirname(V), "sr")
VID = os.path.join(os.path.dirname(V), "vid")
W, H, FPS = 1080, 1920, 30
TL = json.load(open(f"{V}/tts/timeline.json")); BEATS = [x for x in TL["items"] if "i" in x]; DUR = TL["total"]
for k, b in enumerate(BEATS): b["end"] = BEATS[k + 1]["t"] if k + 1 < len(BEATS) else DUR
ORANGE, INK, NAVY = "#FF741E", "#14182B", "#1A1F36"
def C(h, a=1.0): h = h.lstrip("#"); return skia.Color4f(int(h[0:2], 16) / 255, int(h[2:4], 16) / 255, int(h[4:6], 16) / 255, a)
def paint(col, a=1.0, stroke=None):
    p = skia.Paint(AntiAlias=True); p.setColor4f(C(col, a))
    if stroke: p.setStyle(skia.Paint.kStroke_Style); p.setStrokeWidth(stroke)
    return p
TF = {k: skia.Typeface.MakeFromFile(f"{VID}/assets/fonts/{f}.ttf") for k, f in (("b", "InterTight800"), ("i", "InstrumentSerifItalic"), ("a", "Anton"), ("m", "InterTight600"))}
def tr_up(w): return w.replace("i", "İ").replace("ı", "I").upper()
def font(k, s): f = skia.Font(TF[k], s); f.setSubpixel(True); return f
SAMP = skia.SamplingOptions(skia.FilterMode.kLinear, skia.MipmapMode.kNone)
def clamp(x, a=0.0, b=1.0): return max(a, min(b, x))
def prog(t, a, b): return clamp((t - a) / (b - a)) if b > a else float(t >= a)
def eout(x): return 1 - (1 - x) ** 3
def eback(x, s=1.7): x -= 1; return 1 + (s + 1) * x ** 3 + s * x ** 2

class Clip:
    def __init__(self, path):
        self.path = path
        w, h = map(int, subprocess.check_output(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height", "-of", "csv=p=0", path]).decode().split(","))
        self.w, self.h = w, h
        self.n = int(float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path])) * 30) - 1
        self.p = None; self.idx = -1; self.img = None
    def at(self, t):
        i = int(max(0, t) * 30) % self.n
        if self.p is None or i < self.idx or i > self.idx + 60:
            if self.p: self.p.kill()
            self.p = subprocess.Popen(["ffmpeg", "-v", "error", "-ss", f"{i / 30:.3f}", "-i", self.path, "-f", "rawvideo", "-pix_fmt", "rgba", "-"], stdout=subprocess.PIPE); self.idx = i - 1
        while self.idx < i:
            buf = self.p.stdout.read(self.w * self.h * 4)
            if len(buf) < self.w * self.h * 4: break
            self.idx += 1
            if self.idx == i: self.img = skia.Image.fromarray(np.frombuffer(buf, np.uint8).reshape(self.h, self.w, 4).copy(), colorType=skia.kRGBA_8888_ColorType)
        return self.img
CL = {}
def clip(n):
    if n not in CL: CL[n] = Clip(f"{SR_}/clips_u/{n}.mp4")
    return CL[n]
def cover(c, img, x, y, w, h, r=0, a=1.0, zoom=1.0):
    iw, ih = img.width(), img.height(); k = max(w / iw, h / ih) * zoom; sw, sh = w / k, h / k
    src = skia.Rect.MakeXYWH((iw - sw) / 2, (ih - sh) / 2, sw, sh)
    c.save()
    if r: c.clipRRect(skia.RRect.MakeRectXY(skia.Rect.MakeXYWH(x, y, w, h), r, r), True)
    p = skia.Paint(AntiAlias=True); p.setAlphaf(a); c.drawImageRect(img, src, skia.Rect.MakeXYWH(x, y, w, h), SAMP, p); c.restore()
def shadow(c, x, y, w, h, r, a=.5, blur=40, dy=20):
    p = paint("#000000", a); p.setMaskFilter(skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, blur)); c.drawRRect(skia.RRect.MakeRectXY(skia.Rect.MakeXYWH(x, y + dy, w, h), r, r), p)
AVATAR = skia.Image.open(f"{VID}/karga/karga-edit/kanal/profil_A_turuncu_800.png")

# ---------- başlık: kelime kelime ----------
def words_of(b):
    toks = re.findall(r"\*[^*]+\*|[^\s*]+", b["cap"]); out = []
    for tok in toks:
        if tok.startswith("*"): out += [(w, "i") for w in tok.strip("*").split()]
        else: out.append((tok, "b"))
    n = len(out); return [(w, k, b["t"] + 0.05 + (j / max(1, n)) * min(b["d"] * .7, 1.6)) for j, (w, k) in enumerate(out)]
for b in BEATS: b["words"] = words_of(b)
def caption(c, t, b, cy):
    ws = b["words"]
    # iki satıra böl (genişlik 960)
    def wd(w, k): return font("i" if k == "i" else "a", 128 if k == "i" else 118).measureText(tr_up(w) if k == "b" else w)
    lines, cur, cw = [], [], 0
    for w in ws:
        ww = wd(w[0], w[1])
        if cur and cw + ww + 26 > 960: lines.append(cur); cur, cw = [], 0
        cur.append(w); cw += ww + 26
    if cur: lines.append(cur)
    y0 = cy - (len(lines) - 1) * 68
    for li, ln in enumerate(lines):
        tot = sum(wd(w, k) for w, k, _ in ln) + 26 * (len(ln) - 1); x = (W - tot) / 2; y = y0 + li * 136
        for w, k, t0 in ln:
            q = eback(prog(t, t0, t0 + .28)); ww = wd(w, k)
            if q > 0:
                s = tr_up(w) if k == "b" else w; f = font("i" if k == "i" else "a", 128 if k == "i" else 118)
                c.save(); c.translate(x + ww / 2, y - 36); c.scale(q, q); c.translate(-(x + ww / 2), -(y - 36))
                o = paint("#000000", .85, 16); o.setStrokeJoin(skia.Paint.kRound_Join)
                c.drawString(s, x, y, f, o); c.drawString(s, x, y, f, paint(ORANGE if k == "i" else "#FFFFFF"))
                c.restore()
            x += ww + 26

def beat_at(t):
    for b in BEATS:
        if t < b["end"]: return b
    return BEATS[-1]

def frame(c, t):
    b = beat_at(t); typ, name, off = b["vis"][0], b["vis"][1], b["vis"][2]
    lt = t - b["t"] + off
    img = clip(name).at(lt)
    c.clear(C("#07080E"))
    # arka plan: aynı görüntü, bulanık ve koyu
    p = skia.Paint(); p.setImageFilter(skia.ImageFilters.Blur(46, 46))
    c.saveLayer(None, p); cover(c, img, -80, -80, W + 160, H + 160, zoom=1.0); c.restore()
    c.drawRect(skia.Rect.MakeWH(W, H), paint("#05060C", .5))
    pin = eout(prog(t, b["t"] - .02, b["t"] + .25))       # sahne girişi
    if typ == "phone":
        ph = 1270; pw = ph * img.width() / img.height(); x, y = (W - pw) / 2, 250
        s = .94 + .06 * pin
        c.save(); c.translate(W / 2, y + ph / 2); c.scale(s, s); c.translate(-W / 2, -(y + ph / 2))
        shadow(c, x - 18, y - 18, pw + 36, ph + 36, 70, .6); c.drawRRect(skia.RRect.MakeRectXY(skia.Rect.MakeXYWH(x - 18, y - 18, pw + 36, ph + 36), 70, 70), paint("#0B0D16"))
        cover(c, img, x, y, pw, ph, 54); c.restore()
        cap_y = 1760
    else:
        z = 1.0 + .06 * prog(t, b["t"], b["end"])
        ww, hh = 1040, 1040 * img.height() / img.width() if typ != "end" else 470
        hh = 700; bar = 78                  # tarayıcı penceresi: adres çubuğu + site görüntüsü
        x, y = (W - ww) / 2, 420
        s = .92 + .08 * pin
        c.save(); c.translate(W / 2, y + (hh + bar) / 2); c.scale(s, s); c.translate(-W / 2, -(y + (hh + bar) / 2))
        shadow(c, x, y, ww, hh + bar, 40, .6)
        c.drawRRect(skia.RRect.MakeRectXY(skia.Rect.MakeXYWH(x, y, ww, hh + bar), 40, 40), paint("#F4F2EE"))
        for k_, col in enumerate(("#FF5F57", "#FEBC2E", "#28C840")): c.drawCircle(x + 46 + k_ * 34, y + bar / 2, 11, paint(col))
        c.drawRRect(skia.RRect.MakeRectXY(skia.Rect.MakeXYWH(x + 170, y + 16, ww - 230, bar - 32), 23, 23), paint("#FFFFFF"))
        url = "gardenmtrs.netlify.app"; n = int(len(url) * prog(t, .1, .9)) if t < 1 else len(url)
        c.drawString(url[:n], x + 200, y + bar / 2 + 11, font("m", 32), paint(INK))
        c.save(); c.clipRRect(skia.RRect.MakeRectXY(skia.Rect.MakeXYWH(x, y, ww, hh + bar), 40, 40), True)
        cover(c, img, x, y + bar, ww, hh, 0, zoom=z); c.restore()
        c.drawRRect(skia.RRect.MakeRectXY(skia.Rect.MakeXYWH(x, y, ww, hh + bar), 40, 40), paint("#FFFFFF", .25, 3)); c.restore()
        cap_y = y + hh + bar + 250
    # ilk karede beyaz flaş + üstte rozet
    if t < .25: c.drawRect(skia.Rect.MakeWH(W, H), paint("#FFFFFF", .6 * (1 - t / .25)))
    # üst rozet: kanal
    c.save(); pth = skia.Path(); pth.addCircle(110, 170, 46); c.clipPath(pth, doAntiAlias=True)
    c.drawImageRect(AVATAR, skia.Rect.MakeXYWH(64, 124, 92, 92), SAMP); c.restore()
    c.drawCircle(110, 170, 46, paint("#FFFFFF", .9, 4))
    c.drawString("Karga Zihni", 176, 166, font("b", 38), paint("#FFFFFF"))
    c.drawString("Claude ile 3D web sitesi", 176, 208, font("m", 30), paint("#FFB27A"))
    # bitiş kartı
    if typ == "end":
        q = eback(prog(t, b["t"] + .3, b["t"] + .8))
        if q > 0:
            bw, bh = 640, 150; bx, by = (W - bw) / 2, 1500
            c.save(); c.translate(W / 2, by + bh / 2); c.scale(q, q); c.translate(-W / 2, -(by + bh / 2))
            shadow(c, bx, by, bw, bh, 75, .5); c.drawRRect(skia.RRect.MakeRectXY(skia.Rect.MakeXYWH(bx, by, bw, bh), 75, 75), paint(ORANGE))
            f = font("a", 86); s = "TAM VİDEO ↓" ; tw_ = f.measureText(s); c.drawString(s, W / 2 - tw_ / 2, by + 108, f, paint("#FFFFFF")); c.restore()
        # aşağıyı gösteren zıplayan ok
        k = (t * 2.2) % 1; ay = 1790 + 18 * math.sin(k * math.pi * 2)
        pth = skia.Path(); pth.moveTo(W / 2 - 40, ay - 30); pth.lineTo(W / 2, ay + 10); pth.lineTo(W / 2 + 40, ay - 30)
        c.drawPath(pth, paint("#FFFFFF", .95, 12))
    caption(c, t, b, (cap_y - 40 if typ == "end" else cap_y) if typ != "phone" else 1700)
    # ilerleme çubuğu
    c.drawRect(skia.Rect.MakeXYWH(0, 0, W, 10), paint("#FFFFFF", .2)); c.drawRect(skia.Rect.MakeXYWH(0, 0, W * t / DUR, 10), paint(ORANGE))

def run(frames, out_fn):
    s = skia.Surface.MakeRaster(skia.ImageInfo.Make(W, H, skia.ColorType.kRGBA_8888_ColorType, skia.AlphaType.kPremul_AlphaType))
    for f in frames:
        frame(s.getCanvas(), f / FPS); out_fn(f, s.toarray())

def build_audio(path, music=True):
    SRa = 48000; n = int(DUR * SRa) + SRa
    wf = wave.open(f"{V}/tts/voice.wav"); vsr = wf.getframerate(); v = np.frombuffer(wf.readframes(wf.getnframes()), np.int16).astype(np.float32) / 32768
    v = np.interp(np.arange(int(len(v) * SRa / vsr)) / SRa, np.arange(len(v)) / vsr, v).astype(np.float32)
    voice = np.zeros(n, np.float32); voice[:min(n, len(v))] = v[:n] * 1.15
    mix = np.zeros(n, np.float32); tt = np.arange(n) / SRa
    if music:
        bpm = 104; beat = 60 / bpm
        chords = [(220.0, 261.63, 329.63), (174.61, 220.0, 261.63), (196.0, 246.94, 293.66), (164.81, 207.65, 246.94)]
        for k in range(int(DUR / (beat * 4)) + 1):
            ch = chords[k % 4]; t0 = k * beat * 4; m = int(beat * 4 * SRa) + 4000; st = np.arange(m) / SRa
            pad = sum(np.sin(2 * np.pi * f * st) for f in ch) * np.minimum(1, st / .3) * np.exp(-st * .4) * .02
            i = int(t0 * SRa); j = min(n, i + m); mix[i:j] += pad[:j - i]
            for q in range(4):   # hafif tık ritmi
                m2 = int(.08 * SRa); s2 = np.arange(m2) / SRa; kick = np.sin(2 * np.pi * (90 - 40 * s2 / .08) * s2) * np.exp(-s2 * 40) * .18
                i2 = int((t0 + q * beat) * SRa); j2 = min(n, i2 + m2); mix[i2:j2] += kick[:j2 - i2]
        env = np.convolve(np.abs(voice), np.ones(int(.25 * SRa)) / int(.25 * SRa), "same")
        mix *= (1 - .55 * np.clip(env / .03, 0, 1)) * np.clip((DUR - tt) / .8, 0, 1)
    # her sahne girişinde kısa "pop"
    for b in BEATS:
        m = int(.08 * SRa); st = np.arange(m) / SRa; pop = np.sin(2 * np.pi * (600 + 900 * st / .08) * st) * np.exp(-st * 50) * .12
        i = int(b["t"] * SRa); j = min(n, i + m); mix[i:j] += pop[:j - i]
    out = np.tanh((voice + mix) * 1.05) * .95; st2 = np.stack([out, out], 1)
    with wave.open(path, "wb") as w: w.setnchannels(2); w.setsampwidth(2); w.setframerate(SRa); w.writeframes((st2 * 32767).astype(np.int16).tobytes())

if __name__ == "__main__":
    if sys.argv[1] == "stills":
        from PIL import Image
        run([int(float(x) * FPS) for x in sys.argv[2:]], lambda f, a: Image.fromarray(a).convert("RGB").save(f"{V}/out/s_{f / FPS:05.1f}.jpg", quality=88))
    else:
        NF = int(DUR * FPS)
        enc = subprocess.Popen(["ffmpeg", "-y", "-v", "error", "-f", "rawvideo", "-pix_fmt", "rgba", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-", "-c:v", "libx264", "-preset", "medium", "-crf", "19", "-pix_fmt", "yuv420p", f"{V}/out/v.mp4"], stdin=subprocess.PIPE)
        run(range(NF), lambda f, a: enc.stdin.write(a.tobytes())); enc.stdin.close(); enc.wait()
        for m, fn in ((True, "muzikli"), (False, "muziksiz")):
            build_audio(f"{V}/out/a_{fn}.wav", m)
            subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", f"{V}/out/v.mp4", "-i", f"{V}/out/a_{fn}.wav", "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-shortest", "-movflags", "+faststart", f"/home/user/analiz/video_teslim/GardenMotors_Shorts_{fn}.mp4"], check=True)
        print("ok")
