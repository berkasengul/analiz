# Üç yeni tarz için ortak araçlar: skia yüzeyi, yazı, kolaylaştırma, ffmpeg çıkışı
import math, os, subprocess, sys
import numpy as np, skia
from PIL import Image

W, H, FPS = 1920, 1080, 30
D = os.path.dirname(os.path.abspath(__file__))
F_HAND = skia.Typeface.MakeFromFile(f"{D}/fonts/PatrickHand.ttf")
F_CAV = skia.Typeface.MakeFromFile(f"{D}/fonts/Caveat.ttf")
def _tf(p):
    return skia.Typeface.MakeFromFile(p) if os.path.exists(p) else skia.Typeface.MakeDefault()
F_BOLD = _tf("/usr/share/fonts/opentype/inter/Inter-Bold.otf")
F_SEMI = _tf("/usr/share/fonts/opentype/inter/Inter-SemiBold.otf")
F_MED = _tf("/usr/share/fonts/opentype/inter/Inter-Medium.otf")
F_BLACK = _tf("/usr/share/fonts/opentype/inter/Inter-Black.otf")

def clamp(v, a=0., b=1.): return max(a, min(b, v))
def prog(t, a, b): return clamp((t - a) / (b - a)) if b > a else float(t >= a)
def eio(p): return 4 * p ** 3 if p < .5 else 1 - (-2 * p + 2) ** 3 / 2
def eout(p): return 1 - (1 - p) ** 3
def ein(p): return p ** 3
def smooth(p): return p * p * (3 - 2 * p)
def back(p, s=1.7):
    p = clamp(p); return 1 + (s + 1) * (p - 1) ** 3 + s * (p - 1) ** 2
def lerp(a, b, p): return a + (b - a) * p

def col(h, a=1.):
    h = h.lstrip("#"); r, g, b = int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)
    return skia.Color4f(r / 255, g / 255, b / 255, a)
def paint(h, a=1., stroke=0, cap=True):
    p = skia.Paint(AntiAlias=True); p.setColor4f(col(h, a))
    if stroke:
        p.setStyle(skia.Paint.kStroke_Style); p.setStrokeWidth(stroke)
        if cap: p.setStrokeCap(skia.Paint.kRound_Cap); p.setStrokeJoin(skia.Paint.kRound_Join)
    return p
def font(tf, size): f = skia.Font(tf, size); f.setSubpixel(True); f.setEdging(skia.Font.Edging.kAntiAlias); return f
def tw(s, tf, size): return font(tf, size).measureText(s)
def text(c, s, x, y, tf, size, h="#1A1A1A", a=1., align="left"):
    f = font(tf, size); w = f.measureText(s)
    if align == "center": x -= w / 2
    elif align == "right": x -= w
    c.drawString(s, x, y, f, paint(h, a)); return w

def trimmed(path, p):
    """Yolun ilk p oranını döndürür (TrimPathEffect p>=1'de None verdiği için korumalı)."""
    if p >= .999: return path
    if p <= 0: return None
    m = skia.PathMeasure(path, False); out = skia.Path(); left = 0
    lens = []
    while True:
        lens.append(m.getLength())
        if not m.nextContour(): break
    total = sum(lens); goal = total * p
    m = skia.PathMeasure(path, False); k = 0
    while True:
        L = lens[k]
        if goal <= 0: break
        seg = min(L, goal); m.getSegment(0, seg, out, True); goal -= seg; k += 1
        if not m.nextContour(): break
    return out
def path_end(path, p):
    """Yolun p oranındaki noktası (kalem ucu için)."""
    m = skia.PathMeasure(path, False); lens = []
    while True:
        lens.append(m.getLength())
        if not m.nextContour(): break
    total = sum(lens); goal = clamp(p) * total
    m = skia.PathMeasure(path, False); k = 0
    while True:
        if goal <= lens[k] or k == len(lens) - 1:
            pos, tan = m.getPosTan(min(goal, lens[k]))
            return (pos.x(), pos.y()) if pos is not None else None
        goal -= lens[k]; k += 1
        if not m.nextContour(): return None

def paper_texture(base="#FBF8F1", amt=7, seed=3):
    rng = np.random.default_rng(seed)
    n = rng.normal(0, 1, (H // 2, W // 2)).astype(np.float32)
    n = np.array(Image.fromarray(((n * 20) + 128).clip(0, 255).astype(np.uint8)).resize((W, H), Image.BILINEAR)).astype(np.float32) - 128
    b = np.array([int(base[i:i + 2], 16) for i in (1, 3, 5)], np.float32)
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    vig = 1 - .06 * (((xx - W / 2) / (W / 2)) ** 2 + ((yy - H / 2) / (H / 2)) ** 2)
    img = (b[None, None, :] * vig[..., None] + n[..., None] * amt / 20).clip(0, 255).astype(np.uint8)
    rgba = np.dstack([img, np.full((H, W), 255, np.uint8)])
    return skia.Image.fromarray(rgba, colorType=skia.ColorType.kRGBA_8888_ColorType)

class Out:
    def __init__(self, path, dur):
        self.path, self.n = path, int(round(dur * FPS))
        self.s = skia.Surface.MakeRaster(skia.ImageInfo.Make(W, H, skia.ColorType.kRGBA_8888_ColorType, skia.AlphaType.kPremul_AlphaType))
    def frame(self, f, draw):
        c = self.s.getCanvas(); c.clear(skia.Color4f(1, 1, 1, 1)); draw(c, f / FPS)
        return self.s.makeImageSnapshot().toarray(colorType=skia.ColorType.kRGBA_8888_ColorType)
    def run(self, draw, stills=None):
        if stills:
            for t in stills:
                Image.fromarray(self.frame(int(round(t * FPS)), draw)).convert("RGB").save(f"{self.path[:-4]}_{t:05.1f}.jpg", quality=90)
            return
        enc = subprocess.Popen(["ffmpeg", "-y", "-v", "error", "-f", "rawvideo", "-pix_fmt", "rgba", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
                                "-c:v", "libx264", "-preset", "medium", "-crf", "17", "-pix_fmt", "yuv420p", self.path], stdin=subprocess.PIPE)
        for f in range(self.n): enc.stdin.write(self.frame(f, draw).tobytes())
        enc.stdin.close(); enc.wait(); print("ok", self.path)

def main(out_path, dur, draw):
    o = Out(out_path, dur)
    if len(sys.argv) > 1 and sys.argv[1] == "stills": o.run(draw, [float(a) for a in sys.argv[2:]])
    else: o.run(draw)
