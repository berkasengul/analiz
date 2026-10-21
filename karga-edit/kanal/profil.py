import sys, numpy as np
from PIL import Image, ImageDraw, ImageFilter
S = sys.argv[1]; OUT = f"{S}/profil"
N = 800
src = Image.open(f"{S}/poses/karga-pozlari-v1/01-anlatan.png").convert("RGBA")
head = src.crop((280, 60, 940, 720)).resize((700, 700), Image.LANCZOS)   # head + scarf

def radial(c_in, c_out, cy=0.42):
    yy, xx = np.mgrid[0:N, 0:N].astype(np.float32)
    d = np.clip(np.sqrt(((xx - N / 2) / (N * .55)) ** 2 + ((yy - N * cy) / (N * .55)) ** 2), 0, 1) ** 1.2
    a = np.array(c_in, np.float32) * (1 - d[..., None]) + np.array(c_out, np.float32) * d[..., None]
    return Image.fromarray(a.astype(np.uint8)).convert("RGBA")

def rim(im, color, r, k):
    a = im.getchannel("A")
    g = Image.new("RGBA", im.size, color + (0,)); g.putalpha(a.filter(ImageFilter.GaussianBlur(r)).point(lambda v: min(255, int(v * k))))
    return g

def outline(im, color, w):
    a = im.getchannel("A").filter(ImageFilter.MaxFilter(w))
    o = Image.new("RGBA", im.size, color + (0,)); o.putalpha(a); return o

def build(bg, ring=None, rimc=None, outl=None):
    c = bg.copy()
    lay = Image.new("RGBA", (N, N), (0, 0, 0, 0)); lay.paste(head, (40, 110), head)
    if rimc: c.alpha_composite(rim(lay, rimc, 22, 1.6))
    if outl: c.alpha_composite(outline(lay, outl, 11))
    c.alpha_composite(lay)
    m = Image.new("L", (N * 2, N * 2), 0); ImageDraw.Draw(m).ellipse((0, 0, N * 2 - 1, N * 2 - 1), fill=255); m = m.resize((N, N), Image.LANCZOS)
    if ring:
        rl = Image.new("RGBA", (N * 2, N * 2), (0, 0, 0, 0)); ImageDraw.Draw(rl).ellipse((14, 14, N * 2 - 15, N * 2 - 15), outline=ring + (255,), width=26)
        c.alpha_composite(rl.resize((N, N), Image.LANCZOS))
    out = Image.new("RGBA", (N, N), (0, 0, 0, 0)); out.paste(c, (0, 0), m)
    return c.convert("RGB"), out

ORANGE = (255, 116, 30); NAVY = (14, 18, 34)
opts = {
    "A_turuncu": build(radial((255, 150, 60), (226, 82, 14)), ring=None, outl=(250, 243, 228)),
    "B_koyu_isikli": build(radial((40, 46, 78), (7, 8, 16)), ring=ORANGE, rimc=ORANGE),
    "C_krem": build(radial((252, 246, 233), (236, 222, 196)), ring=ORANGE),
}
prev = Image.new("RGB", (3 * 300 + 40, 300 + 150), (24, 24, 28)); pd = ImageDraw.Draw(prev)
for i, (k, (sq, circ)) in enumerate(opts.items()):
    sq.save(f"{OUT}/profil_{k}_800.png")
    circ.save(f"{OUT}/profil_{k}_onizleme_yuvarlak.png")
    x = 10 + i * 310
    prev.paste(circ.resize((280, 280), Image.LANCZOS), (x, 10), circ.resize((280, 280), Image.LANCZOS))
    for j, s in enumerate((88, 40, 24)):
        sm = circ.resize((s, s), Image.LANCZOS); prev.paste(sm, (x + j * 100, 310 + (88 - s) // 2), sm)
    pd.text((x, 410), k, fill=(230, 230, 230))
prev.save(f"{OUT}/profil_karsilastirma.png"); print("ok")
