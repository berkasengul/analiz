# Gölge oyunu tarzı (Karagöz perdesi gibi): Nasreddin Hoca eşeğine ters biner
import math
from fmtlib import *

DARK = "#2A1408"
PL, PT, PR, PB = 110, 150, 1810, 990          # perde
F_CIN = skia.Typeface.MakeFromFile(f"{D}/fonts/Cinzel.ttf")
F_PLAY = skia.Typeface.MakeFromFile(f"{D}/fonts/PlayfairDisplay-Italic.ttf")
_tex = None

def leather(c, path, color, a=.9, holes=None):
    """Renkli, ışık geçiren deri parça: dolgu + koyu kenar + delik süsleri."""
    c.drawPath(path, paint(color, a))
    c.drawPath(path, paint(DARK, 1, 5))
    inner = paint("#000000", .18, 2.5); c.drawPath(path, inner)
    for (hx, hy, r) in (holes or []):
        c.drawCircle(hx, hy, r, paint("#FFF3CF", .95)); c.drawCircle(hx, hy, r, paint(DARK, .8, 1.5))

def limb(c, pts, w, color):
    p = skia.Path(); p.moveTo(*pts[0])
    for q in pts[1:]: p.lineTo(*q)
    c.drawPath(p, paint(DARK, 1, w + 10)); c.drawPath(p, paint(color, .85, w))
    for q in pts[1:-1]: c.drawCircle(*q, 6, paint(DARK)); c.drawCircle(*q, 2.5, paint("#E0B050"))   # eklem pimi

def dots(x0, y0, x1, y1, n, r=5):
    return [(x0 + (x1 - x0) * k / (n - 1), y0 + (y1 - y0) * k / (n - 1), r) for k in range(n)]

def donkey(c, X, Y, t, s=1.):
    T = lambda d: svgp(d, X, Y, s)
    sw = 6 * math.sin(t * 5)
    for lx, ph in ((-118, 0), (-92, 1.6), (108, 1.6), (134, 0)):     # bacaklar
        k = 14 * math.sin(t * 5 + ph)
        limb(c, [(X + lx * s, Y - 175 * s), (X + (lx + k * .4) * s, Y - 90 * s), (X + (lx + k) * s, Y - 8 * s)], 22 * s, "#8C7A6B")
    tail = T(f"M -150 -245 C -190 -235 {-200 + sw} -190 {-196 + sw} -140 L {-184 + sw} -140 C -186 -190 -176 -222 -148 -228 Z")
    leather(c, tail, "#6E5D50")
    body = T("M -158 -232 C -168 -305 -60 -326 40 -316 C 124 -310 170 -284 172 -232 C 176 -180 124 -158 40 -158 L -92 -158 C -152 -158 -152 -190 -158 -232 Z")
    leather(c, body, "#9C8877", holes=[(X + x_ * s, Y + y_ * s, r * s) for x_, y_, r in dots(-120, -190, 120, -190, 9, 6)])
    neck = T("M 118 -296 C 150 -336 172 -388 192 -406 C 208 -420 244 -424 274 -408 L 306 -372 C 316 -356 306 -340 290 -342 L 244 -350 C 218 -330 198 -290 168 -238 Z")
    leather(c, neck, "#9C8877")
    for d in ("M 200 -408 C 188 -440 184 -470 186 -490 C 200 -470 212 -440 214 -412 Z", "M 222 -412 C 222 -446 228 -478 238 -496 C 244 -470 240 -440 236 -412 Z"):
        leather(c, T(d), "#8C7A6B")
    c.drawCircle(X + 258 * s, Y - 388 * s, 7 * s, paint("#FFF3CF")); c.drawCircle(X + 258 * s, Y - 388 * s, 7 * s, paint(DARK, 1, 2))
    blanket = T("M -78 -318 L 64 -318 L 76 -226 L -90 -226 Z")
    leather(c, blanket, "#C2342B", .85, holes=[(X + x_ * s, Y + y_ * s, 5 * s) for x_, y_, r in dots(-76, -240, 66, -240, 7)])
    c.drawPath(T("M -70 -300 L 56 -300"), paint("#E8B23A", .9, 6 * s))

def hoca(c, X, Y, t, s=1.):
    """Eşeğe ters binmiş Hoca (sola bakar). X,Y: eyer noktası."""
    T = lambda d: svgp(d, X, Y, s)
    leg = T("M -26 -6 L 22 -6 L 30 80 L 4 104 L -16 96 Z"); leather(c, leg, "#2F6B4F")
    leather(c, T("M 8 98 L -32 92 L -66 106 L -28 116 L 10 112 Z"), "#E8B23A", .9)
    robe = T("M -46 0 C -50 -60 -40 -120 -28 -150 L 34 -150 C 44 -110 54 -60 52 0 Z")
    leather(c, robe, "#2F7A57", holes=dots(X - 40 * s, Y - 14 * s, X + 44 * s, Y - 14 * s, 6, 5 * s))
    c.drawPath(T("M -2 -150 L 2 0"), paint("#E8B23A", .9, 8 * s))
    head = T("M 22 -160 C 28 -204 14 -232 -10 -232 C -30 -232 -40 -218 -42 -204 L -60 -188 C -64 -180 -56 -176 -46 -176 C -46 -164 -40 -156 -30 -150 Z")
    leather(c, head, "#D9A066", .85)
    beard = T("M -34 -176 C -60 -158 -58 -110 -30 -96 C -8 -108 4 -140 10 -160 Z"); leather(c, beard, "#ECE3D0", .9)
    c.drawCircle(X - 26 * s, Y - 206 * s, 5 * s, paint("#FFF3CF")); c.drawCircle(X - 26 * s, Y - 206 * s, 5 * s, paint(DARK, 1, 2))
    tur = T("M -52 -216 C -64 -284 46 -300 60 -232 C 62 -212 42 -204 0 -208 C -30 -208 -46 -206 -52 -216 Z")
    leather(c, tur, "#F1E6C8", .9)
    for k in range(4): c.drawPath(T(f"M {-46 + k * 6} {-226 - k * 14} C {-10} {-248 - k * 14} {30} {-250 - k * 12} {54 - k * 3} {-236 - k * 12}"), paint(DARK, .55, 2.5 * s))
    leather(c, T("M -14 -282 C -12 -310 18 -310 22 -282 Z"), "#C2342B", .9)
    wave = 10 * math.sin(t * 3)
    limb(c, [(X - 4 * s, Y - 130 * s), (X - 58 * s, Y - 168 * s), (X - 84 * s, Y - (226 + wave) * s)], 24 * s, "#2F7A57")
    c.drawCircle(X - 86 * s, Y - (234 + wave) * s, 13 * s, paint("#D9A066", .9)); c.drawCircle(X - 86 * s, Y - (234 + wave) * s, 13 * s, paint(DARK, 1, 4))
    c.drawLine(X - 88 * s, Y - (246 + wave) * s, X - 92 * s, Y - (272 + wave) * s, paint(DARK, 1, 7 * s))

def koylu(c, X, Y, t, s=1.):
    """Ayakta köylü (sola bakar)."""
    T = lambda d: svgp(d, X, Y, s)
    leather(c, T("M -46 -262 L 46 -262 L 58 -40 L 18 -30 L 0 -150 L -18 -30 L -58 -40 Z"), "#2C5DA8", holes=dots(X - 40 * s, Y - 250 * s, X + 40 * s, Y - 250 * s, 5, 5 * s))
    for fx in (-40, 38): leather(c, T(f"M {fx + 18} -40 L {fx - 22} -40 L {fx - 50} -20 L {fx - 14} -10 L {fx + 22} -16 Z"), "#C2342B", .9)
    leather(c, T("M -48 -432 L 48 -432 L 54 -252 L -54 -252 Z"), "#F1E6C8", .85)
    leather(c, T("M -48 -432 L -6 -432 L -14 -258 L -54 -258 Z"), "#C2342B", .85, holes=dots(X - 30 * s, Y - 410 * s, X - 34 * s, Y - 280 * s, 5, 5 * s))
    leather(c, T("M 48 -432 L 10 -432 L 16 -258 L 54 -258 Z"), "#C2342B", .85)
    c.drawPath(T("M -54 -268 L 54 -268"), paint("#E8B23A", .9, 12 * s))
    head = T("M 24 -440 C 30 -486 14 -512 -10 -512 C -32 -512 -42 -496 -44 -482 L -62 -466 C -66 -458 -58 -454 -48 -454 C -48 -444 -40 -436 -28 -430 Z")
    leather(c, head, "#D9A066", .85)
    leather(c, T("M -44 -462 C -62 -462 -70 -452 -74 -444 C -60 -448 -48 -446 -36 -450 Z"), "#3B2416", .95)
    c.drawCircle(X - 26 * s, Y - 488 * s, 5 * s, paint("#FFF3CF")); c.drawCircle(X - 26 * s, Y - 488 * s, 5 * s, paint(DARK, 1, 2))
    leather(c, T("M -34 -500 L 34 -500 C 30 -540 18 -590 4 -606 C -8 -596 -26 -560 -34 -500 Z"), "#8A5A2B", .9)
    g = 12 * math.sin(t * 2.4)
    limb(c, [(X - 20 * s, Y - 418 * s), (X - 66 * s, Y - (352 + g) * s), (X - 118 * s, Y - (384 + g) * s)], 24 * s, "#F1E6C8")
    c.drawCircle(X - 124 * s, Y - (388 + g) * s, 13 * s, paint("#D9A066", .9)); c.drawCircle(X - 124 * s, Y - (388 + g) * s, 13 * s, paint(DARK, 1, 4))

def tree(c, X, Y, s=1.):
    T = lambda d: svgp(d, X, Y, s)
    leather(c, T("M -18 0 L 18 0 L 12 -240 C 40 -290 70 -300 90 -320 L 84 -330 C 60 -312 36 -300 6 -270 L 0 -380 L -10 -380 L -14 -250 C -50 -280 -80 -300 -100 -330 L -108 -322 C -86 -290 -50 -260 -16 -232 Z"), "#6B4226")
    for (lx, ly, col_) in ((-110, -350, "#3E8A4F"), (90, -340, "#3E8A4F"), (-6, -410, "#4FA05E"), (-60, -420, "#C2342B"), (50, -420, "#E8B23A"), (-130, -420, "#E8B23A"), (120, -410, "#C2342B")):
        p = T(f"M {lx} {ly} C {lx - 40} {ly - 30} {lx - 30} {ly - 80} {lx} {ly - 96} C {lx + 30} {ly - 80} {lx + 40} {ly - 30} {lx} {ly} Z")
        leather(c, p, col_, .85, holes=[(X + lx * s, Y + (ly - 50) * s, 6 * s)])

def frame(c, t):
    global _tex
    if _tex is None: _tex = paper_texture("#F4D9A2", amt=10, seed=9)
    c.clear(col("#1A0C05"))
    c.save(); c.clipRect(skia.Rect.MakeLTRB(PL, PT, PR, PB)); c.drawImage(_tex, 0, 0)
    fl = 1 + .035 * math.sin(t * 7.3) + .02 * math.sin(t * 13.1)
    p = skia.Paint(); p.setShader(skia.GradientShader.MakeRadial(skia.Point(960, 560), 980, [col("#FFF0C4", .55 * fl).toColor(), col("#F0A848", .25).toColor(), col("#5A2A0C", .9).toColor()], [0, .55, 1]))
    c.drawRect(skia.Rect.MakeLTRB(PL, PT, PR, PB), p)
    c.restore()

def overlay(c, t):
    fl = 1 + .035 * math.sin(t * 7.3)
    p = skia.Paint(); p.setBlendMode(skia.BlendMode.kScreen)
    p.setShader(skia.GradientShader.MakeRadial(skia.Point(960, 520), 700, [col("#FFD890", .22 * fl).toColor(), col("#FFD890", 0).toColor()]))
    c.drawRect(skia.Rect.MakeLTRB(PL, PT, PR, PB), p)
    # ahşap çerçeve
    wood = paint("#3A1D0C"); fr = skia.Path(); fr.addRect(skia.Rect.MakeWH(W, H)); inner = skia.Path(); inner.addRect(skia.Rect.MakeLTRB(PL, PT, PR, PB))
    fr = skia.Op(fr, inner, skia.PathOp.kDifference_PathOp); c.drawPath(fr, wood)
    c.save(); c.clipPath(fr, doAntiAlias=True)
    for k in range(0, H, 9): c.drawLine(0, k, W, k + 3, paint("#2A1306", .35, 2))
    c.restore()
    c.drawRect(skia.Rect.MakeLTRB(PL - 14, PT - 14, PR + 14, PB + 14), paint("#C8932F", 1, 6))
    c.drawRect(skia.Rect.MakeLTRB(PL - 4, PT - 4, PR + 4, PB + 4), paint("#120804", 1, 8))
    # üst süs: lale dizisi
    for k in range(13):
        x = 200 + k * 128; y = 78
        tl = svgp("M 0 30 C -22 10 -20 -16 -10 -28 L 0 -12 L 10 -28 C 20 -16 22 10 0 30 Z", x, y, 1.2)
        c.drawPath(tl, paint("#C8932F")); c.drawPath(tl, paint("#120804", 1, 2.5))
        c.drawLine(x, y + 36, x, y + 52, paint("#C8932F", 1, 4))
    text(c, "HAYÂL-İ ZILL", 960, 1050, F_CIN, 34, "#C8932F", align="center")

def draw(c, t):
    frame(c, t)
    c.save(); c.clipRect(skia.Rect.MakeLTRB(PL, PT, PR, PB))
    # perde altı zemin
    gr = svgp("M 110 990 L 110 925 C 400 910 700 935 960 920 C 1250 905 1500 930 1810 915 L 1810 990 Z")
    c.drawPath(gr, paint("#3B2416", .92))
    lp = skia.Paint(); lp.setImageFilter(skia.ImageFilters.Blur(.9, .9)); c.saveLayer(skia.Rect.MakeLTRB(PL, PT, PR, PB), lp)
    tree(c, 300, 930, 1.05)
    X = 900 + 40 * math.sin(t * .5)
    # taşıma çubukları
    for x0, y0 in ((X - 20, 640), (X + 40, 720), (1420, 600)):
        c.drawLine(x0, y0, x0 + 80, 1010, paint("#1A0C05", .55, 7))
    donkey(c, X, 925, t, 1.0)
    hoca(c, X - 6, 925 - 318, t, 1.0)
    koylu(c, 1420, 932, t, 1.05)
    c.restore(); c.restore()
    overlay(c, t)

if __name__ == "__main__":
    main(f"{D}/out/golge.mp4", 15.0, draw)
