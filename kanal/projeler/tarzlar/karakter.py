# Karakter tasarımı: Fatih Sultan Mehmed ve Yeniçeri (çizgi film / kukla tarzı)
import math
from fmtlib import *
from cizgi import fillo, OL, arm

F_PLAY = skia.Typeface.MakeFromFile(f"{D}/fonts/PlayfairDisplay.ttf")
SKIN = "#EBB892"; SKIN_D = "#D29C76"; GOLD = "#D9A93A"

def face2(c, x, y, s=1., beard=None, must=None, nose="normal", expr="normal", blink=0, look=0, brow_col=None, talk=0.):
    T = lambda d: svgp(d, x, y, s)
    P = lambda px, py: (x + px * s, y + py * s)
    head = T("M -60 -44 C -64 -104 64 -104 60 -44 L 58 28 C 54 78 22 100 0 100 C -22 100 -54 78 -58 28 Z")
    fillo(c, head, SKIN)
    for sx in (-1, 1): fillo(c, T(f"M {sx * 58} -6 C {sx * 82} -14 {sx * 84} 26 {sx * 56} 28 Z"), SKIN, 3)
    c.save(); c.clipPath(head, doAntiAlias=True); c.drawPath(T("M 28 -90 C 70 -60 70 40 18 104 L 80 104 L 80 -90 Z"), paint(SKIN_D, .4)); c.restore()
    for sx in (-1, 1): c.drawCircle(*P(sx * 34, 18), 13 * s, paint("#E58F80", .35))   # yanak
    if beard:
        kind = beard[1]
        bd = {"short": "M -56 16 C -58 64 -30 104 0 108 C 30 104 58 64 56 16 C 40 42 22 50 0 50 C -22 50 -40 42 -56 16 Z",
              "long": "M -58 10 C -62 70 -38 150 0 168 C 38 150 62 70 58 10 C 40 40 22 52 0 52 C -22 52 -40 40 -58 10 Z"}[kind]
        fillo(c, T(bd), beard[0])
        for k in range(4): c.drawPath(T(f"M {-28 + k * 18} 74 Q {-26 + k * 17} 90 {-24 + k * 16} 100"), paint("#000000", .25, 2))
    # ağız (konuşurken sese göre açılır, yoksa ifadeye göre)
    if talk > .06:
        h_ = 8 + 30 * min(1, talk)
        mp = T(f"M -18 56 C -18 {56 - h_ * .25} 18 {56 - h_ * .25} 18 56 C 18 {56 + h_} -18 {56 + h_} -18 56 Z"); c.drawPath(mp, paint("#6E2A23")); c.drawPath(mp, paint(OL, 1, 3))
        c.drawPath(T(f"M -10 {56 + h_ * .7} Q 0 {56 + h_ * .45} 10 {56 + h_ * .7}"), paint("#D9647A", .9, 5))
    elif expr == "gulen":
        mp = T("M -24 50 Q 0 54 24 50 Q 20 80 0 82 Q -20 80 -24 50 Z"); c.drawPath(mp, paint("#6E2A23")); c.drawPath(mp, paint(OL, 1, 3))
        c.drawPath(T("M -20 52 Q 0 56 20 52 L 18 60 Q 0 63 -18 60 Z"), paint("#FFFFFF"))
    elif expr == "kizgin":
        c.drawPath(T("M -20 64 Q 0 54 20 64"), paint(OL, 1, 4))
    else:
        c.drawPath(T("M -16 58 Q 0 66 16 58"), paint(OL, 1, 3.5))
    if must:
        col_, kind = must
        if kind == "long":   # yeniçeri bıyığı: uzun, uçları kıvrık
            for sx in (-1, 1):
                mp = T(f"M 0 38 C {sx * 20} 30 {sx * 46} 34 {sx * 70} 54 C {sx * 84} 66 {sx * 92} 60 {sx * 90} 48 C {sx * 96} 66 {sx * 80} 80 {sx * 62} 66 C {sx * 44} 52 {sx * 20} 50 0 50 Z")
                fillo(c, mp, col_, 3)
        else:
            fillo(c, T("M -40 36 C -24 24 -8 26 0 32 C 8 26 24 24 40 36 C 26 44 10 42 0 40 C -10 42 -26 44 -40 36 Z"), col_, 3)
    # burun
    if nose == "hook":   # Fatih'in kemerli burnu
        np_ = T("M 2 -6 C 12 2 30 16 26 28 C 22 38 8 38 -2 34 C -6 32 -10 30 -12 28")
        c.drawPath(T("M 2 -6 C 12 2 30 16 26 28 C 22 38 8 38 -2 34 L -4 0 Z"), paint(SKIN_D, .5))
        c.drawPath(np_, paint(OL, 1, 3.5))
    else:
        c.drawPath(T("M 4 -4 C 14 14 22 24 10 30 C 4 33 -6 32 -10 28"), paint(OL, 1, 3.2))
    # gözler + kaşlar
    for sx in (-1, 1):
        ex, ey = sx * 25, -22
        if blink:
            c.drawPath(T(f"M {ex - 14} {ey + 2} Q {ex} {ey + 8} {ex + 14} {ey + 2}"), paint(OL, 1, 3.5))
        else:
            sq = 4 if expr == "kizgin" else (3 if expr == "gulen" else 0)
            e = T(f"M {ex - 15} {ey} C {ex - 15} {ey - 16 + sq} {ex + 15} {ey - 16 + sq} {ex + 15} {ey} C {ex + 15} {ey + 13 - sq} {ex - 15} {ey + 13 - sq} {ex - 15} {ey} Z")
            fillo(c, e, "#FFFFFF", 3)
            c.drawCircle(*P(ex + 4 * look, ey), 6.5 * s, paint("#2B1E16")); c.drawCircle(*P(ex + 4 * look + 2, ey - 2), 2 * s, paint("#FFFFFF"))
        bc = brow_col or OL
        if expr == "kizgin": a, b_ = (-34, -40) if sx < 0 else (-46, -34); ys = (ey - 26 + (10 if sx > 0 else 0), ey - 24 + (0 if sx > 0 else 10))
        if expr == "kizgin":
            inner, outer = ey - 28 + 12, ey - 34
            pth = T(f"M {ex - sx * 20} {inner} L {ex + sx * 20} {outer}") if True else None
        elif expr == "gulen": pth = T(f"M {ex - 20} {ey - 32} Q {ex} {ey - 46} {ex + 20} {ey - 32}")
        else: pth = T(f"M {ex - 20} {ey - 30} Q {ex} {ey - 40} {ex + 20} {ey - 30}")
        c.drawPath(pth, paint(bc, 1, 10)); c.drawPath(pth, paint(OL, .5, 2))

def fatih_head(c, x, y, s=1., expr="normal", blink=0, look=0, talk=0.):
    face2(c, x, y, s, beard=("#3B2A1E", "short"), must=("#3B2A1E", "normal"), nose="hook", expr=expr, blink=blink, look=look, brow_col="#3B2A1E", talk=talk)
    T = lambda d: svgp(d, x, y - 18 * s, s)
    kav = T("M -84 -62 C -112 -150 -86 -250 0 -262 C 86 -250 112 -150 84 -62 C 40 -46 -40 -46 -84 -62 Z")
    fillo(c, kav, "#F6F3EC")
    for k in range(6): c.drawPath(T(f"M {-80 + k * 6} {-80 - k * 30} C {-30} {-60 - k * 34} {40} {-104 - k * 30} {82 - k * 8} {-84 - k * 28}"), paint(OL, .28, 2.5))
    top = T("M -26 -238 C -24 -282 24 -282 26 -238 Z"); fillo(c, top, "#B3262E", 3)     # kırmızı tepe
    # sorguç (mücevherli tüy)
    c.drawPath(T("M 30 -140 C 40 -200 70 -250 60 -300 C 50 -250 30 -210 20 -150 Z"), paint("#F2EFE6")); c.drawPath(T("M 30 -140 C 40 -200 70 -250 60 -300 C 50 -250 30 -210 20 -150 Z"), paint(OL, 1, 2.5))
    gem = T("M 26 -150 L 40 -132 L 26 -114 L 12 -132 Z"); fillo(c, gem, "#C9283A", 3); c.drawCircle(x + 26 * s, y - 150 * s, 4 * s, paint("#FFFFFF", .7))

def yeniceri_head(c, x, y, s=1., expr="normal", blink=0, look=0, talk=0.):
    T = lambda d: svgp(d, x, y, s)
    # börk: arkaya sarkan beyaz keçe
    flap = T("M -40 -110 C -90 -200 -150 -150 -120 40 C -110 90 -80 110 -70 80 C -84 0 -70 -80 -30 -100 Z"); fillo(c, flap, "#EFEBE1")
    face2(c, x, y, s, must=("#2A1E16", "long"), expr=expr, blink=blink, look=look, brow_col="#2A1E16", talk=talk)
    bork = T("M -62 -60 C -66 -120 -58 -230 -36 -260 C -10 -276 26 -270 40 -250 C 58 -200 66 -120 62 -60 C 30 -48 -30 -48 -62 -60 Z")
    fillo(c, bork, "#F2EEE4")
    band = T("M -64 -86 C -30 -98 30 -98 64 -86 L 62 -60 C 30 -48 -30 -48 -62 -60 Z"); fillo(c, band, GOLD, 3)
    spoon = T("M -10 -88 L 10 -88 L 14 -200 C 14 -220 -14 -220 -14 -200 Z"); fillo(c, spoon, "#E2B84A", 3)   # kaşıklık
    for k in range(3): c.drawCircle(x, y + (-118 - k * 30) * s, 5 * s, paint("#B3262E"))

def shoe(c, x, y, s, color, flip=False):
    sg = -1 if flip else 1
    p = svgp(f"M -26 0 C -26 -26 20 -30 30 -14 C 44 -10 60 -10 66 -20 C 70 0 50 8 20 8 L -20 8 C -26 8 -26 4 -26 0 Z", x, y, s, flip)
    fillo(c, p, color, 3)

def fatih(c, x, g, s=1., expr="normal", t=0, rose=True, talk=0., blink=0, look=1, bob=0.):
    T = lambda d: svgp(d, x, g, s)
    shoe(c, x - 46 * s, g, s, "#E2B84A", True); shoe(c, x + 46 * s, g, s, "#E2B84A")
    outer = T("M -96 -560 C -150 -520 -180 -300 -200 -30 C -120 -12 120 -12 200 -30 C 180 -300 150 -520 96 -560 Z"); fillo(c, outer, "#8E1E2A")
    c.save(); c.clipPath(outer, doAntiAlias=True)
    for yy in range(-540, 0, 70):
        for xx in range(-200, 220, 70):
            ox = 35 if (yy // 70) % 2 else 0
            for d_ in ((-7, 0), (7, 0), (0, -11)): c.drawCircle(x + (xx + ox + d_[0]) * s, g + (yy + d_[1]) * s, 5 * s, paint(GOLD, .9))
    c.restore()
    inner = T("M -58 -540 L -62 -24 L 62 -24 L 58 -540 Z"); fillo(c, inner, "#E3B652")
    for k in range(7): c.drawLine(x - 40 * s, g + (-500 + k * 64) * s, x + 40 * s, g + (-500 + k * 64) * s, paint("#8E1E2A", 1, 6 * s)); c.drawCircle(x, g + (-500 + k * 64) * s, 6 * s, paint("#8E1E2A"))
    for sx in (-1, 1):   # kürk yaka ve kenarlar
        fur = T(f"M {sx * 58} -560 C {sx * 96} -560 {sx * 120} -540 {sx * 110} -470 L {sx * 86} -20 L {sx * 56} -20 L {sx * 60} -500 Z"); fillo(c, fur, "#6B4A2E", 3)
        for k in range(10): c.drawLine(x + sx * 64 * s, g + (-490 + k * 46) * s, x + sx * 82 * s, g + (-480 + k * 46) * s, paint("#4A3020", 1, 2.5 * s))
    sash = T("M -70 -300 L 70 -300 L 72 -258 L -72 -258 Z"); fillo(c, sash, "#2F6B4F", 3)
    # kollar: biri gül tutuyor, diğeri yanda
    arm(c, [(x - 140 * s, g - 500 * s), (x - 172 * s, g - 330 * s), (x - 150 * s, g - 200 * s)], 54 * s, "#8E1E2A")
    w = 6 * math.sin(t * 2)
    arm(c, [(x + 140 * s, g - 500 * s), (x + 130 * s, g - 360 * s), (x + 40 * s, g - (380 + w) * s)], 54 * s, "#8E1E2A")
    if rose:
        rx, ry = x + 30 * s, g - (420 + w) * s
        c.drawLine(rx, ry + 30 * s, x + 44 * s, g - (380 + w) * s, paint("#3E7A3A", 1, 5 * s))
        for k in range(5):
            a = k * 1.256; c.drawCircle(rx + math.cos(a) * 10 * s, ry + math.sin(a) * 10 * s, 13 * s, paint("#D9647A"))
        c.drawCircle(rx, ry, 10 * s, paint("#B83A55")); c.drawCircle(rx, ry, 22 * s, paint(OL, .8, 2.5))
    fatih_head(c, x + 3 * math.sin(t * 1.3) * s, g - (650 - bob) * s, s, expr, blink=blink, look=look, talk=talk)

def yeniceri(c, x, g, s=1., expr="normal", t=0, talk=0., blink=0, look=-1, bob=0., gesture=0.):
    T = lambda d: svgp(d, x, g, s)
    for sx in (-1, 1):   # çizmeler + şalvar
        fillo(c, T(f"M {sx * 50 - 30} -170 L {sx * 50 + 30} -170 L {sx * 50 + 26} -10 L {sx * 50 - 28} -10 Z"), "#B3262E", 3)
        shoe(c, x + sx * 50 * s, g, s * 1.05, "#3A2A20", sx < 0)
        fillo(c, T(f"M {sx * 50 - 28} -60 L {sx * 50 + 28} -60 L {sx * 50 + 26} -6 L {sx * 50 - 26} -6 Z"), "#3A2A20", 3)
    coat = T("M -90 -560 C -140 -520 -160 -360 -170 -160 C -100 -140 100 -140 170 -160 C 160 -360 140 -520 90 -560 Z"); fillo(c, coat, "#2C4F8C")
    for sx in (-1, 1):   # beline sıkıştırılmış etekler (kırmızı astar)
        fillo(c, T(f"M {sx * 40} -330 C {sx * 110} -320 {sx * 170} -240 {sx * 172} -160 C {sx * 130} -150 {sx * 90} -150 {sx * 60} -160 Z"), "#B3262E", 3)
    fillo(c, T("M -40 -560 L -44 -330 L 44 -330 L 40 -560 Z"), "#E8DCC0", 3)
    for k in range(5): c.drawCircle(x, g + (-530 + k * 44) * s, 6 * s, paint(GOLD)); c.drawCircle(x, g + (-530 + k * 44) * s, 6 * s, paint(OL, 1, 2))
    belt = T("M -96 -340 L 96 -340 L 98 -290 L -98 -290 Z"); fillo(c, belt, "#7A4A26", 3)
    for k in range(4): c.drawLine(x + (-80 + k * 50) * s, g - 336 * s, x + (-80 + k * 50) * s, g - 294 * s, paint(GOLD, 1, 4 * s))
    # kılıç (belde, çapraz)
    c.drawLine(x - 60 * s, g - 320 * s, x - 190 * s, g - 120 * s, paint(OL, 1, 22 * s)); c.drawLine(x - 60 * s, g - 320 * s, x - 190 * s, g - 120 * s, paint("#5A3A22", 1, 15 * s))
    fillo(c, T("M -70 -340 L -40 -350 L -36 -330 L -66 -318 Z"), GOLD, 3)
    # kollar: biri mızrak tutuyor
    arm(c, [(x - 130 * s, g - 500 * s), (x - 150 * s - 40 * gesture * s, g - 360 * s - 60 * gesture * s), (x - 80 * s - 150 * gesture * s, g - 310 * s - 200 * gesture * s)], 50 * s, "#2C4F8C")
    sx_ = x + 210 * s
    c.drawLine(sx_, g - 980 * s, sx_ - 10 * s, g, paint(OL, 1, 14 * s)); c.drawLine(sx_, g - 980 * s, sx_ - 10 * s, g, paint("#8A5A30", 1, 8 * s))
    fillo(c, T("M 200 -980 L 210 -1060 L 222 -980 Z"), "#B8C0C8", 3)
    arm(c, [(x + 130 * s, g - 500 * s), (x + 190 * s, g - 420 * s), (x + 206 * s, g - 520 * s)], 50 * s, "#2C4F8C")
    yeniceri_head(c, x - 3 * math.sin(t * 1.1) * s, g - (650 - bob) * s, s, expr, blink=blink, look=look, talk=talk)

def card_bg(c):
    p = skia.Paint(); p.setShader(skia.GradientShader.MakeRadial(skia.Point(W / 2, H * .45), 1200, [col("#FBF4E6").toColor(), col("#E8D9BC").toColor()])); c.drawRect(skia.Rect.MakeWH(W, H), p)
    for k in range(0, W, 60): c.drawLine(k, 0, k, H, paint("#C9B48E", .18, 1.5))
    for k in range(0, H, 60): c.drawLine(0, k, W, k, paint("#C9B48E", .18, 1.5))

def plate(c, s_, sub, x, y):
    f = font(F_PLAY, 54); w_ = f.measureText(s_) + 80
    r = skia.RRect.MakeRectXY(skia.Rect.MakeXYWH(x - w_ / 2, y - 62, w_, 92), 46, 46)
    c.drawRRect(r, paint("#2A1E16")); c.drawRRect(r, paint(GOLD, 1, 3))
    text(c, s_, x, y, F_PLAY, 54, "#F6EBD2", align="center")
    text(c, sub, x, y + 70, F_MED, 28, "#6B5A44", align="center")

def sheet1(c, t=0):
    card_bg(c)
    for x in (560, 1360):
        sh = paint("#000000", .22); sh.setMaskFilter(skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, 16)); c.drawOval(skia.Rect.MakeXYWH(x - 190, 868, 380, 54), sh)
    fatih(c, 560, 892, .82, "normal", t)
    yeniceri(c, 1360, 892, .82, "kizgin", t)
    plate(c, "Fatih Sultan Mehmed", "kavuk, sorguç, kürk yakalı kaftan, gül", 560, 990)
    plate(c, "Yeniçeri", "börk ve kaşıklık, uzun bıyık, mızrak", 1360, 990)

def sheet2(c, t=0):
    card_bg(c)
    text(c, "İfadeler", W / 2, 96, F_PLAY, 64, "#2A1E16", align="center")
    for k, (ex, lab) in enumerate((("normal", "normal"), ("kizgin", "kızgın"), ("gulen", "gülen"))):
        x = 360 + k * 600
        fatih_head(c, x - 135, 560, 1.25, ex)
        yeniceri_head(c, x + 145, 600, 1.25, ex)
        text(c, lab, x, 1000, F_PLAY, 46, "#6B5A44", align="center")
        if k < 2: c.drawLine(x + 300, 160, x + 300, 960, paint("#C9B48E", .8, 2))

if __name__ == "__main__":
    import sys
    for name, fn in (("karakter_tam", sheet1), ("karakter_ifade", sheet2)):
        s = skia.Surface.MakeRaster(skia.ImageInfo.Make(W, H, skia.ColorType.kRGBA_8888_ColorType, skia.AlphaType.kPremul_AlphaType))
        fn(s.getCanvas())
        Image.fromarray(s.makeImageSnapshot().toarray(colorType=skia.ColorType.kRGBA_8888_ColorType)).convert("RGB").save(f"{D}/out/{name}.jpg", quality=92)
    print("ok")
