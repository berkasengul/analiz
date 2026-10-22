#!/usr/bin/env python3
"""Karga Zihni: "Net" thumbnail şablonu (1280x720, skia).

Formül (Efe Cpp kanalından uyarlandı, ayrıntı: THUMBNAIL-REHBERI.md):
  beyaz zemin + 2–3 kelimelik dev yazı (1. satır siyah, 2. satır turuncu kutuda beyaz)
  + sağda tek temiz nesne (laptop / tarayıcı) + çıkartma gibi kenarlıklı karga.

  python3 -I thumbnail_net.py <varlik_klasoru> <cikti_klasoru>

<varlik_klasoru>: fonts/Anton.ttf, poses/karga-pozlari-v1/*.png, thumb2/f_*.png (temiz ekran görüntüleri)
"""
import os
import sys

import numpy as np
import skia
from PIL import Image, ImageFilter

A = os.path.abspath(sys.argv[1])
OUT = os.path.abspath(sys.argv[2]) if len(sys.argv) > 2 else f"{A}/thumb2"
os.makedirs(OUT, exist_ok=True)
W, H = 1280, 720

ORANGE = "#FF6B12"   # kanal vurgu rengi: her thumbnail'de aynı
INK = "#0E1018"
NAVY = "#1A1F36"

def C(h, a=1.0):
    h = h.lstrip("#")
    return skia.Color4f(int(h[0:2], 16) / 255, int(h[2:4], 16) / 255, int(h[4:6], 16) / 255, a)

def paint(col, a=1.0, stroke=None):
    p = skia.Paint(AntiAlias=True); p.setColor4f(C(col, a))
    if stroke:
        p.setStyle(skia.Paint.kStroke_Style); p.setStrokeWidth(stroke); p.setStrokeJoin(skia.Paint.kRound_Join)
    return p

SAMP = skia.SamplingOptions(skia.FilterMode.kLinear, skia.MipmapMode.kLinear)
ANTON = skia.Typeface.MakeFromFile(f"{A}/fonts/Anton.ttf")
INTER = skia.Typeface.MakeFromFile(f"{A}/fonts/InterTight600.ttf")

def surface(w, h):
    return skia.Surface.MakeRaster(skia.ImageInfo.Make(w, h, skia.ColorType.kRGBA_8888_ColorType, skia.AlphaType.kPremul_AlphaType))

def to_skia(im):
    return skia.Image.fromarray(np.ascontiguousarray(np.asarray(im.convert("RGBA"))), colorType=skia.kRGBA_8888_ColorType).withDefaultMipmaps()

def shot(name, crop=None):
    from PIL import ImageEnhance
    im = Image.open(f"{A}/thumb2/{name}").convert("RGB")
    if crop: im = im.crop(crop)
    im = ImageEnhance.Brightness(im).enhance(1.12)   # koyu sahne beyaz zeminde sönük kalmasın
    return ImageEnhance.Color(im).enhance(1.12)

# ---------------- zemin ----------------
def background(c):
    c.clear(C("#FFFFFF"))
    p = skia.Paint()
    p.setShader(skia.GradientShader.MakeRadial(skia.Point(W * .62, H * .45), W * .85,
                [C("#FFFFFF").toColor(), C("#F4F4F6").toColor(), C("#E6E7EB").toColor()], [0, .6, 1]))
    c.drawRect(skia.Rect.MakeWH(W, H), p)

# ---------------- yazı ----------------
def ink_bounds(txt, f):
    """Metnin gerçek mürekkep sınırları (Ğ, İ noktaları dahil): (sol, üst, sağ, alt), taban çizgisine göre."""
    w = int(f.measureText(txt)) + 40; h = int(f.getSize() * 2)
    s = surface(w, h); cv = s.getCanvas(); cv.clear(C("#000000", 0))
    cv.drawString(txt, 20, h * .7, f, paint("#FFFFFF"))
    a = s.toarray()[..., 3]; ys, xs = np.nonzero(a > 8)
    return xs.min() - 20, ys.min() - h * .7, xs.max() - 20, ys.max() - h * .7

def fit(txt, size, maxw):
    f = skia.Font(ANTON, size)
    while f.measureText(txt) > maxw and size > 60:
        size -= 4; f = skia.Font(ANTON, size)
    return f

def headline(c, l1, l2, x, y, s1=200, s2=176, maxw=560, pad=(24, 18), tilt=-2.0):
    """1. satır siyah, 2. satır turuncu kutuda beyaz (siyah ince kontur). y = 1. satırın mürekkep üstü."""
    f1 = fit(l1, s1, maxw); f2 = fit(l2, s2, maxw - 2 * pad[0])
    x0, t1, x1, b1 = ink_bounds(l1, f1)
    base1 = y - t1
    sh = paint("#000000", .12); sh.setMaskFilter(skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, 6))
    c.drawString(l1, x - x0 + 4, base1 + 6, f1, sh)
    c.drawString(l1, x - x0, base1, f1, paint(INK))
    l, t, r, b = ink_bounds(l2, f2)
    bw, bh = (r - l) + 2 * pad[0], (b - t) + 2 * pad[1]
    bx, by = x - 8, base1 + b1 + 24
    c.save(); c.rotate(tilt, bx + bw / 2, by + bh / 2)
    sp = paint("#000000", .25); sp.setMaskFilter(skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, 10))
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect.MakeXYWH(bx + 4, by + 10, bw, bh), 14, 14), sp)
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect.MakeXYWH(bx, by, bw, bh), 14, 14), paint(ORANGE))
    tx, base2 = bx + pad[0] - l, by + pad[1] - t
    c.drawString(l2, tx, base2, f2, paint(INK, 1, 9))
    c.drawString(l2, tx, base2, f2, paint("#FFFFFF"))
    c.restore()
    return by + bh

# ---------------- nesneler ----------------
def laptop_image(screen, url=None, sw=1100):
    """Düz (önden) laptop çizer; perspektif sonra uygulanır."""
    sh = int(sw * 0.625); bez = 22; base_h = 46
    s = surface(sw + 160, sh + base_h + 40)
    c = s.getCanvas(); c.clear(C("#000000", 0))
    ox = 80
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect.MakeXYWH(ox, 0, sw, sh), 30, 30), paint("#16171B"))
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect.MakeXYWH(ox + 2, 2, sw - 4, sh - 4), 28, 28), paint("#3A3C42", 1, 2))
    inner = skia.Rect.MakeXYWH(ox + bez, bez, sw - 2 * bez, sh - 2 * bez)
    c.save(); c.clipRRect(skia.RRect.MakeRectXY(inner, 8, 8), True)
    top = inner.top()
    if url:
        bar = 46
        c.drawRect(skia.Rect.MakeXYWH(inner.left(), top, inner.width(), bar), paint("#F1F2F4"))
        for i, col in enumerate(("#FF5F57", "#FEBC2E", "#28C840")): c.drawCircle(inner.left() + 26 + i * 22, top + bar / 2, 7, paint(col))
        ux = inner.left() + inner.width() / 2 - 230
        c.drawRRect(skia.RRect.MakeRectXY(skia.Rect.MakeXYWH(ux, top + 9, 460, bar - 18), 14, 14), paint("#FFFFFF"))
        c.drawString(url, ux + 22, top + bar / 2 + 7, skia.Font(INTER, 19), paint("#3B3F4C"))
        top += bar
    img = to_skia(screen)
    dst = skia.Rect.MakeLTRB(inner.left(), top, inner.right(), inner.bottom())
    # kaplama (cover)
    r = max(dst.width() / img.width(), dst.height() / img.height())
    sw_, sh_ = dst.width() / r, dst.height() / r
    src = skia.Rect.MakeXYWH((img.width() - sw_) / 2, (img.height() - sh_) / 2, sw_, sh_)
    c.drawImageRect(img, src, dst, SAMP)
    # cam parlaması
    gp = skia.Paint(); gp.setShader(skia.GradientShader.MakeLinear([skia.Point(inner.left(), inner.top()), skia.Point(inner.left() + inner.width() * .55, inner.bottom())],
                                                                    [C("#FFFFFF", .16).toColor(), C("#FFFFFF", 0).toColor()]))
    c.drawRect(inner, gp)
    c.restore()
    # alt gövde (alüminyum)
    by = sh - 2
    path = skia.Path(); path.moveTo(0, by); path.lineTo(sw + 160, by); path.lineTo(sw + 120, by + base_h); path.lineTo(40, by + base_h); path.close()
    bp = skia.Paint(AntiAlias=True); bp.setShader(skia.GradientShader.MakeLinear([skia.Point(0, by), skia.Point(0, by + base_h)],
                                                                                  [C("#E9EBEF").toColor(), C("#B8BCC4").toColor(), C("#8E939C").toColor()], [0, .55, 1]))
    c.drawPath(path, bp)
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect.MakeXYWH((sw + 160) / 2 - 90, by, 180, 12), 6, 6), paint("#A3A8B0"))
    return s.makeImageSnapshot().withDefaultMipmaps()

def draw_perspective(c, img, quad, shadow=True):
    """img'i dört köşeye (sol üst, sağ üst, sağ alt, sol alt) yerleştirir."""
    w, h = img.width(), img.height()
    m = skia.Matrix()
    m.setPolyToPoly([skia.Point(0, 0), skia.Point(w, 0), skia.Point(w, h), skia.Point(0, h)], [skia.Point(*q) for q in quad])
    if shadow:
        (x0, y0), (x1, y1), (x2, y2), (x3, y3) = quad
        sp = paint("#000000", .28); sp.setMaskFilter(skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, 26))
        c.drawOval(skia.Rect.MakeLTRB(x3 + 30, max(y2, y3) - 30, x2 - 10, max(y2, y3) + 34), sp)
    c.save(); c.concat(m); c.drawImage(img, 0, 0, SAMP); c.restore()

def crow(name, h, flip=False, outline=10):
    im = Image.open(f"{A}/poses/karga-pozlari-v1/{name}").convert("RGBA"); im = im.crop(im.getbbox())
    h = int(h); im = im.resize((int(im.width * h / im.height), h), Image.LANCZOS)
    if flip: im = im.transpose(Image.FLIP_LEFT_RIGHT)
    pad = outline * 3
    canvas = Image.new("RGBA", (im.width + 2 * pad, im.height + 2 * pad), (0, 0, 0, 0))
    a = Image.new("L", canvas.size, 0); a.paste(im.split()[3], (pad, pad))
    ring = a.filter(ImageFilter.MaxFilter(outline * 2 + 1))
    white = Image.new("RGBA", canvas.size, (255, 255, 255, 255)); white.putalpha(ring)
    canvas = Image.alpha_composite(canvas, white)
    canvas.alpha_composite(im, (pad, pad))
    return to_skia(canvas), pad

def put_crow(c, name, x, y, h, flip=False, rot=0):
    img, pad = crow(name, h, flip)
    sp = skia.Paint(); sp.setImageFilter(skia.ImageFilters.DropShadow(6, 14, 14, 14, C("#000000", .30).toColor()))
    c.save(); c.rotate(rot, x + img.width() / 2, y + img.height() / 2)
    c.drawImage(img, x - pad, y - pad, SAMP, sp); c.restore()

def arrow(c, pts, col=ORANGE, w=22):
    """Kalın, el çizimi hissi veren ok (Efe'nin kırmızı okları gibi)."""
    path = skia.Path(); path.moveTo(*pts[0]); path.quadTo(*pts[1], *pts[2])
    p = paint(col, 1, w); p.setStrokeCap(skia.Paint.kRound_Cap)
    o = paint("#FFFFFF", 1, w + 12); o.setStrokeCap(skia.Paint.kRound_Cap)
    c.drawPath(path, o); c.drawPath(path, p)
    (x1, y1), (x2, y2) = pts[1], pts[2]
    import math
    ang = math.atan2(y2 - y1, x2 - x1); L = w * 2.4
    head = skia.Path(); head.moveTo(x2 + math.cos(ang) * L * .55, y2 + math.sin(ang) * L * .55)
    for d in (2.5, -2.5):
        head.lineTo(x2 + math.cos(ang + d) * L, y2 + math.sin(ang + d) * L)
    head.close()
    c.drawPath(head, paint("#FFFFFF", 1, 12)); c.drawPath(head, paint(col))

def cursor(c, x, y, s=2.6):
    pts = [(0, 0), (0, 30), (7.5, 23), (12.5, 34.5), (17.5, 32.5), (12.5, 21.5), (22, 21.5)]
    pth = skia.Path(); pth.moveTo(*pts[0])
    for q in pts[1:]: pth.lineTo(*q)
    pth.close()
    c.save(); c.translate(x, y); c.scale(s, s)
    sp = paint("#000000", .3); sp.setMaskFilter(skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, 2))
    c.save(); c.translate(1.5, 2.5); c.drawPath(pth, sp); c.restore()
    c.drawPath(pth, paint("#FFFFFF", 1, 4)); c.drawPath(pth, paint(INK)); c.restore()

def save(s, name):
    arr = s.toarray()
    Image.fromarray(arr).convert("RGB").save(f"{OUT}/{name}", quality=93)
    return f"{OUT}/{name}"

# ---------------- varyantlar ----------------
def place_laptop(c, lap, x0, y0, width, yaw=1.0):
    """Hafif perspektifli laptop: sol kenar biraz uzakta (yaw>0)."""
    lw, lh = lap.width(), lap.height(); k = width / lw; w, h = lw * k, lh * k
    d = 22 * yaw
    draw_perspective(c, lap, [(x0 + d, y0 + d), (x0 + w, y0), (x0 + w, y0 + h), (x0 + d * .4, y0 + h - d * .6)])
    return x0, y0, w, h

def variant_a():
    """BU BİR / WEB SİTESİ!  — tarayıcılı laptop (dış cephe), imleç, işaret eden karga."""
    s = surface(W, H); c = s.getCanvas(); background(c)
    lap = laptop_image(shot("f_8.png"), url="gardenmotor.netlify.app")
    x, y, w, h = place_laptop(c, lap, 575, 175, 690)
    cursor(c, 925, 365)
    headline(c, "BU BİR", "WEB SİTESİ!", 48, 70)
    put_crow(c, "02-isaret-eden.png", 140, 455, 290, rot=-3)
    return save(s, "NET_A_bu_bir_web_sitesi.jpg")

def variant_b():
    """GALERİLER / BUNU İSTİYOR!  — kırmızı BMW'li showroom, sevinen karga."""
    s = surface(W, H); c = s.getCanvas(); background(c)
    lap = laptop_image(shot("f_40.png", crop=(300, 40, 1560, 840)))
    place_laptop(c, lap, 575, 175, 690)
    headline(c, "GALERİLER", "BUNU İSTİYOR!", 48, 70)
    put_crow(c, "05-sevinen.png", 150, 445, 300, flip=False, rot=-3)
    return save(s, "NET_B_galeriler_bunu_istiyor.jpg")

def variant_c():
    """OYUN / DEĞİL!  — tarayıcıda showroom, şaşıran karga, ok."""
    s = surface(W, H); c = s.getCanvas(); background(c)
    lap = laptop_image(shot("f_0.5.png", crop=(120, 40, 1380, 830)), url="gardenmotor.netlify.app")
    place_laptop(c, lap, 560, 150, 690)
    bottom = headline(c, "OYUN", "DEĞİL!", 48, 60, s1=230, s2=210)
    arrow(c, [(260, bottom + 40), (380, bottom + 120), (540, bottom + 40)])
    put_crow(c, "04-sasiran.png", 1010, 400, 330, flip=True, rot=4)
    return save(s, "NET_C_oyun_degil.jpg")

def preview(paths):
    """YouTube ızgarasında küçük boyutta nasıl göründüğü (okunabilirlik testi)."""
    tw_, th_ = 360, 202
    sheet = Image.new("RGB", (20 + 3 * (tw_ + 20), th_ + 40), (15, 15, 15))
    for i, p in enumerate(paths):
        im = Image.open(p).resize((tw_, th_), Image.LANCZOS)
        sheet.paste(im, (20 + i * (tw_ + 20), 20))
    sheet.save(f"{OUT}/NET_onizleme_kucuk.jpg", quality=92)

if __name__ == "__main__":
    ps = [variant_a(), variant_b(), variant_c()]
    preview(ps)
    print("\n".join(ps))
