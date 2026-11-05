import os
V = os.path.dirname(os.path.abspath(__file__))
exec(open(f"{V}/thumb10_tarih.py").read().split("# H1:")[0])
from PIL import Image as PI
def strip_img(path, x0, x1, crop):
    a = PI.open(path).convert("RGB").crop(crop)
    return a
# T1: 4 TARZ — harita, çöp adam, beyaz tahta, veri
s = surface(W, H); c = s.getCanvas(); c.clear(C("#0B0D16"))
panels = [(f"{IMG}/son_hali.jpg", (300, 100, 1500, 1000)), (f"{IMG}/cop_adam.jpg", (500, 200, 1500, 1080)),
          (f"{IMG}/beyaz_tahta.jpg", (40, 60, 1290, 1080)), (f"{IMG}/veri.jpg", (60, 150, 1500, 1080))]
n = 4; sk = 70; wd = W / n
for k, (p, cr) in enumerate(panels):
    x0 = k * wd; pth = skia.Path()
    pth.moveTo(x0 + (sk if k else -5), 0); pth.lineTo(x0 + wd + sk + (5 if k == n - 1 else 0), 0); pth.lineTo(x0 + wd - sk + (60 if k == n - 1 else 0), H); pth.lineTo(x0 - sk - (60 if k == 0 else 0), H); pth.close()
    c.save(); c.clipPath(pth, doAntiAlias=True)
    img = strip_img(p, 0, 0, cr); iw = wd + 2 * sk + 40; ih = iw * img.height / img.width
    if ih < H: ih = H; iw = ih * img.width / img.height
    sk_img = skia.Image.fromarray(np.dstack([np.array(img), np.full((img.height, img.width), 255, np.uint8)]))
    c.drawImageRect(sk_img, skia.Rect.MakeXYWH(x0 + wd / 2 - iw / 2, (H - ih) / 2, iw, ih), skia.SamplingOptions(skia.FilterMode.kLinear))
    c.restore()
    if k: c.drawLine(x0 + sk, 0, x0 - sk, H, paint("#FFFFFF", 1, 7))
topshade(c, .9, 380)
outline_text(c, "TARİH KANALI", 40, 125, 104)
tag(c, 42, 158, "4 TARZ, 0 ÇİZİM", ORANGE, 100, -3)
f = skia.Font(INTER8, 30)
for k, lab in enumerate(["harita", "çöp adam", "beyaz tahta", "veri"]):
    x = k * wd + wd / 2 - 20; w_ = f.measureText(lab) + 44
    rrect(c, x - w_ / 2, H - 92, w_, 58, 29, "#FFFFFF" if k else ORANGE); c.drawString(lab, x - w_ / 2 + 22, H - 52, f, paint(INK if k else "#FFFFFF"))
claude_tile(c, W - 130, 40, 86)
out(s, "KD_T3_4_tarz.jpg")
