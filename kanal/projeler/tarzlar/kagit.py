# Katmanlı kâğıt kesik (paralaks) tarzı: Kapadokya
import math
from fmtlib import *

F_PLAY = skia.Typeface.MakeFromFile(f"{D}/fonts/PlayfairDisplay.ttf")
F_PLAYI = skia.Typeface.MakeFromFile(f"{D}/fonts/PlayfairDisplay-Italic.ttf")
_tex = None

def ridge(base, amp, seed, xoff=0):
    rng = np.random.default_rng(seed); ph = rng.uniform(0, 6, 4)
    def f(x):
        x = x + xoff
        return base + amp * (.5 * math.sin(x / 210 + ph[0]) + .3 * math.sin(x / 97 + ph[1]) + .2 * math.sin(x / 43 + ph[2]))
    return f

def chimney(p, x, yb, bw, h, cap=True):
    q = svgp(f"M {x - bw} {yb} C {x - bw * .55} {yb - h * .35} {x - bw * .3} {yb - h * .8} {x - bw * .2} {yb - h} L {x + bw * .2} {yb - h} C {x + bw * .3} {yb - h * .8} {x + bw * .55} {yb - h * .35} {x + bw} {yb} Z")
    p.addPath(q)
    return (x, yb - h, bw) if cap else None

def layer(c, color, build, shadow=.35, sy=10, holes=None, caps_color=None, t=0):
    lp = skia.Paint(); lp.setImageFilter(skia.ImageFilters.DropShadow(0, sy, 12, 12, col("#2A1208", shadow).toColor()))
    c.saveLayer(None, lp)
    p = skia.Path(); caps = []; build(p, caps)
    pk = paint(color); pk.setPathEffect(skia.DiscretePathEffect.Make(9, .7, 3)); c.drawPath(p, pk)
    for (x, y, bw) in caps:
        cp = svgp(f"M {x - bw * .42} {y + 8} C {x - bw * .5} {y - bw * .22} {x + bw * .5} {y - bw * .22} {x + bw * .42} {y + 8} Z")
        c.drawPath(cp, paint(caps_color or "#4A2A22"))
    for (x, y, w_, h_) in (holes or []):
        hp = svgp(f"M {x - w_ / 2} {y} L {x - w_ / 2} {y - h_ + w_ / 2} C {x - w_ / 2} {y - h_ - w_ * .15} {x + w_ / 2} {y - h_ - w_ * .15} {x + w_ / 2} {y - h_ + w_ / 2} L {x + w_ / 2} {y} Z")
        c.drawPath(hp, paint("#2E1712", .85))
    c.save(); c.clipPath(p, doAntiAlias=True); c.drawImage(_tex, 0, 0, skia.SamplingOptions(), _mul); c.restore()
    c.restore()

_mul = skia.Paint(); _mul.setBlendMode(skia.BlendMode.kOverlay); _mul.setAlphaf(.45)

def balloon(c, x, y, s, cols, a=1.):
    T = lambda d: svgp(d, x, y, s)
    env = T("M 0 -120 C 62 -120 84 -76 78 -38 C 72 -6 34 22 16 40 L -16 40 C -34 22 -72 -6 -78 -38 C -84 -76 -62 -120 0 -120 Z")
    lp = skia.Paint(); lp.setImageFilter(skia.ImageFilters.DropShadow(0, 6 * s, 8 * s, 8 * s, col("#2A1208", .3).toColor())); lp.setAlphaf(a)
    c.saveLayer(None, lp)
    c.drawPath(env, paint(cols[0]))
    c.save(); c.clipPath(env, doAntiAlias=True)
    for k, cx_ in enumerate((-52, 0, 52)):
        c.drawPath(T(f"M {cx_ - 14} -130 C {cx_ - 20} -60 {cx_ - 12} 0 {cx_ * .3 - 6} 44 L {cx_ * .3 + 6} 44 C {cx_ + 12} 0 {cx_ + 20} -60 {cx_ + 14} -130 Z"), paint(cols[1]))
    c.drawRect(skia.Rect.MakeXYWH(x - 90 * s, y - 50 * s, 180 * s, 14 * s), paint(cols[2]))
    c.restore()
    for dx in (-12, 12): c.drawLine(x + dx * s, y + 40 * s, x + dx * .7 * s, y + 62 * s, paint("#4A2A22", 1, 2 * s))
    c.drawPath(T("M -14 60 L 14 60 L 11 82 L -11 82 Z"), paint("#7A4A2E"))
    c.restore()

def draw(c, t):
    global _tex
    if _tex is None: _tex = paper_texture("#808080", amt=22, seed=4)
    # gökyüzü
    p = skia.Paint(); p.setShader(skia.GradientShader.MakeLinear([skia.Point(0, 0), skia.Point(0, 820)], [col("#6E6A9E").toColor(), col("#D98E86").toColor(), col("#FBD4A0").toColor()], [0, .55, 1]))
    c.drawRect(skia.Rect.MakeWH(W, H), p)
    g = skia.Paint(AntiAlias=True); g.setColor4f(col("#FFE9C2", .55)); g.setMaskFilter(skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, 60)); c.drawCircle(1340, 560, 190, g)
    c.drawCircle(1340, 560, 120, paint("#FFF1D6"))
    # paralaks: her katman farklı hızda kayar
    sh = lambda k: -t * (6 + 14 * k)
    # 1 uzak düzlük
    f1 = ridge(640, 26, 1)
    def b1(pp, caps):
        pp.moveTo(-20, H); [pp.lineTo(x, f1(x - sh(0))) for x in range(-20, W + 40, 20)]; pp.lineTo(W + 40, H); pp.close()
        for x, w_ in ((320, 190), (760, 140), (1080, 230), (1560, 170)):
            xx = x + sh(0); y0 = f1(x)
            pp.addPath(svgp(f"M {xx - 30} {y0 + 30} C {xx} {y0 - 20} {xx + 6} {y0 - 70} {xx + 26} {y0 - 74} L {xx + w_ - 26} {y0 - 78} C {xx + w_ - 6} {y0 - 70} {xx + w_} {y0 - 20} {xx + w_ + 30} {y0 + 30} Z"))
    layer(c, "#D9A08C", b1, .18, 6)
    for (x, y, s, cols, a) in ((470, 430, .55, ("#C9605A", "#E8C26A", "#5E7FA6"), .9), (980, 220, .42, ("#5E7FA6", "#F0E2C4", "#C9605A"), .85), (1640, 330, .5, ("#E8C26A", "#C9605A", "#5E7FA6"), .9)):
        balloon(c, x + sh(.6) + 8 * math.sin(t + x), y - t * 6, s, cols, a)
    # sis bandı
    m = skia.Paint(); m.setShader(skia.GradientShader.MakeLinear([skia.Point(0, 560), skia.Point(0, 760)], [col("#FFE7CF", 0).toColor(), col("#FFE7CF", .35).toColor()])); c.drawRect(skia.Rect.MakeXYWH(0, 560, W, 200), m)
    # 2 orta peri bacaları
    f2 = ridge(770, 30, 2)
    hol2 = []
    def b2(pp, caps):
        pp.moveTo(-20, H); [pp.lineTo(x, f2(x)) for x in range(-20, W + 40, 20)]; pp.lineTo(W + 40, H); pp.close()
        for x, bw, h in ((140, 70, 230), (300, 60, 300), (430, 80, 200), (840, 66, 260), (980, 54, 330), (1190, 72, 240), (1460, 60, 290), (1720, 76, 220)):
            xx = x + sh(1)
            r = chimney(pp, xx, f2(xx) + 10, bw, h); caps.append(r)
            hol2.append((xx - bw * .2, f2(xx) - h * .35, 14, 26)); hol2.append((xx + bw * .25, f2(xx) - h * .55, 12, 22))
    layer(c, "#C98468", b2, .3, 9, hol2, "#6A3A2E")
    m2 = skia.Paint(); m2.setShader(skia.GradientShader.MakeLinear([skia.Point(0, 700), skia.Point(0, 900)], [col("#FFE2C8", 0).toColor(), col("#FFE2C8", .22).toColor()])); c.drawRect(skia.Rect.MakeXYWH(0, 700, W, 200), m2)
    # 3 yakın peri bacaları
    f3 = ridge(900, 36, 3)
    hol3 = []
    def b3(pp, caps):
        pp.moveTo(-20, H); [pp.lineTo(x, f3(x)) for x in range(-20, W + 40, 20)]; pp.lineTo(W + 40, H); pp.close()
        for x, bw, h in ((40, 120, 420), (560, 110, 360), (1300, 130, 460), (1840, 110, 380)):
            xx = x + sh(2)
            r = chimney(pp, xx, f3(xx) + 20, bw, h); caps.append(r)
            hol3.extend([(xx - bw * .25, f3(xx) - h * .3, 24, 44), (xx + bw * .2, f3(xx) - h * .52, 20, 36), (xx - bw * .05, f3(xx) - 30, 34, 70)])
    layer(c, "#A35E48", b3, .4, 12, hol3, "#4A2620")
    balloon(c, 900 + sh(2.4) + 10 * math.sin(t * .8), 470 - t * 9, 1.15, ("#D9534A", "#F2C462", "#3E6A99"))
    # 4 ön plan
    f4 = ridge(1010, 22, 4)
    def b4(pp, caps):
        pp.moveTo(-20, H + 20); [pp.lineTo(x, f4(x)) for x in range(-20, W + 40, 20)]; pp.lineTo(W + 40, H + 20); pp.close()
        for x in (180, 260, 1500, 1580, 1660):
            xx = x + sh(3)
            for k in range(5):
                a = math.radians(-60 + k * 30); pp.addPath(svgp(f"M {xx - 4} {f4(xx)} L {xx + math.sin(a) * 70} {f4(xx) - math.cos(a) * 90} L {xx + 4} {f4(xx)} Z"))
    layer(c, "#5A2F27", b4, .5, 14)
    # başlık
    sh_ = paint("#3A1A10", .35); sh_.setMaskFilter(skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, 8))
    f = font(F_PLAY, 128); c.drawString("Kapadokya", 96, 214, f, sh_); c.drawString("Kapadokya", 90, 206, f, paint("#FFF6E8"))
    text(c, "Peri bacaları ve yeraltı şehirleri", 96, 270, F_PLAYI, 44, "#FFF0DC")

if __name__ == "__main__":
    main(f"{D}/out/kagit.mp4", 15.0, draw)
