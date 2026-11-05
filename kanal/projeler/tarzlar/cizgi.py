# Çizgi film (kukla) tarzı: cami avlusu + konuşan karakterler, hepsi kodla
import math
from fmtlib import *

OL = "#1E1A17"          # dış çizgi
LW = 4.0

def fillo(c, p, color, w=LW, a=1.):
    c.drawPath(p, paint(color, a)); c.drawPath(p, paint(OL, 1, w))

def pointed_arch(x, y, w, h):
    """alt-sol (x,y), genişlik w, toplam yükseklik h: sivri (Osmanlı) kemer"""
    r = w * .62
    return svgp(f"M {x} {y} L {x} {y - h + w * .55} Q {x} {y - h + w * .1} {x + w / 2} {y - h} Q {x + w} {y - h + w * .1} {x + w} {y - h + w * .55} L {x + w} {y} Z")

def dome(c, cx, by, rx, ry, color="#8E9CB0", ribs=8, finial=True):
    p = svgp(f"M {cx - rx} {by} C {cx - rx} {by - ry * 1.32} {cx + rx} {by - ry * 1.32} {cx + rx} {by} Z")
    fillo(c, p, color)
    c.save(); c.clipPath(p, doAntiAlias=True)
    c.drawPath(svgp(f"M {cx + rx * .15} {by} C {cx + rx * .2} {by - ry * 1.1} {cx + rx} {by - ry * .9} {cx + rx} {by} Z"), paint("#6F7E94", .45))
    for k in range(1, ribs):
        u = k / ribs; x = cx - rx + 2 * rx * u
        c.drawPath(svgp(f"M {x} {by} Q {cx + (x - cx) * .55} {by - ry * .95} {cx} {by - ry * .99}"), paint(OL, .35, 2))
    c.restore()
    if finial:
        top = by - ry * .99
        c.drawLine(cx, top, cx, top - ry * .32 - 14, paint(OL, 1, 3))
        for k, r in enumerate((7, 5, 4)): c.drawCircle(cx, top - 8 - k * 11, r, paint("#D9A93A")); c.drawCircle(cx, top - 8 - k * 11, r, paint(OL, 1, 2))
    c.drawRect(skia.Rect.MakeLTRB(cx - rx - 6, by - 2, cx + rx + 6, by + 12), paint("#CDBF9F")); c.drawRect(skia.Rect.MakeLTRB(cx - rx - 6, by - 2, cx + rx + 6, by + 12), paint(OL, 1, 3))

def minaret(c, x, base, top, w=46):
    body = svgp(f"M {x - w / 2} {base} L {x - w * .42} {top} L {x + w * .42} {top} L {x + w / 2} {base} Z"); fillo(c, body, "#E8DEC6")
    c.drawRect(skia.Rect.MakeLTRB(x + w * .05, top, x + w * .42, base), paint("#CFC2A4", .7))
    for k in range(int((base - top) / 60)): c.drawLine(x - w * .42, top + 30 + k * 60, x + w * .42, top + 30 + k * 60, paint(OL, .25, 2))
    for yb in (top + (base - top) * .18, top + (base - top) * .45):
        bal = svgp(f"M {x - w * .85} {yb} L {x + w * .85} {yb} L {x + w * .55} {yb + 26} L {x - w * .55} {yb + 26} Z"); fillo(c, bal, "#DCD0B4", 3)
    cone = svgp(f"M {x - w * .5} {top} L {x} {top - w * 2.8} L {x + w * .5} {top} Z"); fillo(c, cone, "#8E9CB0", 3)
    c.drawLine(x, top - w * 2.8, x, top - w * 2.8 - 30, paint(OL, 1, 3)); c.drawCircle(x, top - w * 2.8 - 12, 6, paint("#D9A93A"))

def cloud(c, x, y, s):
    p = skia.Path()
    for dx, dy, r in ((0, 0, 30), (40, -16, 38), (84, -4, 32), (116, 8, 24), (-30, 10, 22)): p.addCircle(x + dx * s, y + dy * s, r * s)
    p = skia.Op(p, skia.Path(), skia.PathOp.kUnion_PathOp) or p
    c.drawPath(p, paint("#FFFFFF")); c.drawPath(p, paint(OL, .6, 2.5))

def background(c):
    sk = skia.Paint(); sk.setShader(skia.GradientShader.MakeLinear([skia.Point(0, 0), skia.Point(0, 640)], [col("#3E94E3").toColor(), col("#8CC6F4").toColor()])); c.drawRect(skia.Rect.MakeWH(W, H), sk)
    cloud(c, 380, 60, 1.2); cloud(c, 1420, 40, 1.4); cloud(c, 1760, 150, .8)
    # ana cami kütlesi
    fillo(c, svgp("M 120 380 L 120 210 L 1140 210 L 1140 380 Z"), "#E3D5B6")
    for k in range(9): fillo(c, pointed_arch(170 + k * 108, 300, 46, 70), "#5B6B7E", 3)
    dome(c, 360, 210, 150, 95); dome(c, 900, 210, 150, 95)
    fillo(c, svgp("M 430 210 L 430 150 L 830 150 L 830 210 Z"), "#D8C8A6")
    for k in range(10): fillo(c, pointed_arch(450 + k * 38, 205, 20, 40), "#5B6B7E", 2)
    dome(c, 630, 150, 230, 170, ribs=12)
    minaret(c, 75, 640, 40, 42)
    minaret(c, 1190, 640, -40, 50)
    # revak (arkadlı avlu duvarı) + küçük kubbeler
    fillo(c, svgp("M -10 640 L -10 352 L 1930 352 L 1930 640 Z"), "#E9DCC0")
    for k in range(12):
        dome(c, 80 + k * 160, 352, 56, 34, "#97A5B8", ribs=5, finial=False)
    fillo(c, svgp("M -10 352 L 1930 352 L 1930 372 L -10 372 Z"), "#D5C6A5", 3)
    for k in range(12):
        x = 22 + k * 160
        ar = pointed_arch(x, 640, 116, 240); fillo(c, ar, "#B9AA8C")
        c.save(); c.clipPath(ar, doAntiAlias=True)
        c.drawRect(skia.Rect.MakeXYWH(x, 400, 116, 240), paint("#9C8D70", .7))
        fillo(c, pointed_arch(x + 34, 560, 48, 110), "#6E5F49", 2.5)          # içteki pencere
        c.restore()
        col_ = svgp(f"M {x - 18} 640 L {x - 14} 430 L {x + 0} 430 L {x + 4} 640 Z"); fillo(c, col_, "#F1E7D2", 3)
        c.drawRect(skia.Rect.MakeXYWH(x - 24, 418, 34, 14), paint("#DCCFB2")); c.drawRect(skia.Rect.MakeXYWH(x - 24, 418, 34, 14), paint(OL, 1, 2.5))
    # zemin taşları (perspektif)
    fl = skia.Paint(); fl.setShader(skia.GradientShader.MakeLinear([skia.Point(0, 640), skia.Point(0, H)], [col("#CFC7B6").toColor(), col("#E2DCCD").toColor()]))
    c.drawRect(skia.Rect.MakeLTRB(0, 640, W, H), fl); c.drawLine(0, 640, W, 640, paint(OL, 1, 4))
    vx, vy = 960, 300
    for k in range(-14, 15):
        x0 = 960 + k * 260; c.drawLine(vx + (x0 - vx) * (640 - vy) / (H - vy) , 640, x0, H, paint(OL, .28, 2))
    y = 640; d = 18
    while y < H: c.drawLine(0, y, W, y, paint(OL, .25, 2)); y += d; d *= 1.32
    c.drawRect(skia.Rect.MakeLTRB(0, 640, W, 690), paint("#8F8676", .22))   # revak gölgesi
    # şadırvan
    sx = 1340
    fillo(c, svgp(f"M {sx - 230} 700 L {sx + 230} 700 L {sx + 210} 760 L {sx - 210} 760 Z"), "#E7E0D2")
    for k in range(9): c.drawLine(sx - 200 + k * 50, 706, sx - 196 + k * 49, 754, paint(OL, .4, 2))
    for k, px in enumerate((-180, -60, 60, 180)):
        fillo(c, svgp(f"M {sx + px - 9} 700 L {sx + px - 7} 520 L {sx + px + 7} 520 L {sx + px + 9} 700 Z"), "#F3EEE3", 3)
    for k in range(3):
        a = pointed_arch(sx - 171 + k * 120, 600, 102, 80); c.drawPath(a, paint(OL, .9, 3))
    fillo(c, svgp(f"M {sx - 200} 700 L {sx - 200} 640 L {sx + 200} 640 L {sx + 200} 700 Z"), "#ECE6DA", 3)
    for k in range(6): c.drawCircle(sx - 150 + k * 60, 672, 7, paint("#C7A24A")); c.drawCircle(sx - 150 + k * 60, 672, 7, paint(OL, 1, 2))
    fillo(c, svgp(f"M {sx - 280} 530 L {sx + 280} 530 L {sx + 200} 470 L {sx - 200} 470 Z"), "#7E8DA2")
    dome(c, sx, 470, 120, 64, "#8E9CB0")
    # bank
    fillo(c, svgp("M 40 760 L 260 760 L 260 778 L 40 778 Z"), "#9A6B3E", 3)
    for x in (56, 236): fillo(c, svgp(f"M {x} 778 L {x + 10} 778 L {x + 10} 830 L {x} 830 Z"), "#7A5230", 3)
    fillo(c, svgp("M 40 716 L 260 716 L 260 730 L 40 730 Z"), "#9A6B3E", 3)

_bg = None
def bg_image():
    global _bg
    if _bg is None:
        s = skia.Surface(W, H); background(s.getCanvas()); _bg = s.makeImageSnapshot()
    return _bg

# ---------------- karakterler ----------------
SKIN = "#EBB892"; SKIN_D = "#D29C76"
def face(c, x, y, s, mouth, blink, look=0, beard=None, brow=0., age=0):
    """x,y: yüz merkezi. mouth: 0..1 açıklık, blink: 0..1"""
    T = lambda d: svgp(d, x, y, s)
    head = T("M -62 -40 C -66 -100 66 -100 62 -40 L 60 30 C 56 78 22 98 0 98 C -22 98 -56 78 -60 30 Z")
    fillo(c, head, SKIN)
    for sx in (-1, 1): fillo(c, T(f"M {sx * 60} -6 C {sx * 84} -14 {sx * 86} 26 {sx * 58} 28 Z"), SKIN, 3)
    c.save(); c.clipPath(head, doAntiAlias=True); c.drawPath(T("M 30 -90 C 70 -60 70 40 20 100 L 80 100 L 80 -90 Z"), paint(SKIN_D, .45)); c.restore()
    if age:
        for k in range(3): c.drawPath(T(f"M {-30} {-58 + k * 9} Q 0 {-63 + k * 9} 30 {-58 + k * 9}"), paint(OL, .35, 2))
    if beard:
        bd = T("M -60 10 C -64 70 -40 150 0 168 C 40 150 64 70 60 10 C 40 40 22 52 0 52 C -22 52 -40 40 -60 10 Z") if beard[1] == "long" else \
             T("M -58 14 C -60 70 -32 112 0 116 C 32 112 60 70 58 14 C 40 40 22 50 0 50 C -22 50 -40 40 -58 14 Z")
        fillo(c, bd, beard[0])
        for k in range(5): c.drawPath(T(f"M {-36 + k * 18} {70} Q {-34 + k * 17} {100} {-30 + k * 15} {124 if beard[1] == 'long' else 98}"), paint(OL, .3, 2))
        fillo(c, T("M -40 34 C -24 22 -8 24 0 30 C 8 24 24 22 40 34 C 26 40 10 38 0 36 C -10 38 -26 40 -40 34 Z"), beard[0], 3)   # bıyık
    # ağız
    mo = 6 + 22 * mouth
    mp = T(f"M -18 52 Q 0 {52 + mo * .2} 18 52 Q 0 {52 + mo * 1.4} -18 52 Z")
    c.drawPath(mp, paint("#6E2A23")); c.drawPath(mp, paint(OL, 1, 3))
    # burun
    c.drawPath(T("M 4 -4 C 14 14 22 24 10 30 C 4 33 -6 32 -10 28"), paint(OL, 1, 3.2))
    # gözler
    for sx in (-1, 1):
        ex, ey = sx * 26, -22
        if blink > .5:
            c.drawPath(T(f"M {ex - 14} {ey + 2} Q {ex} {ey + 8} {ex + 14} {ey + 2}"), paint(OL, 1, 3.5))
        else:
            e = T(f"M {ex - 15} {ey} C {ex - 15} {ey - 16} {ex + 15} {ey - 16} {ex + 15} {ey} C {ex + 15} {ey + 14} {ex - 15} {ey + 14} {ex - 15} {ey} Z")
            fillo(c, e, "#FFFFFF", 3)
            c.drawCircle(x + (ex + 4 * look) * s, y + (ey + 1) * s, 6.5 * s, paint(OL))
            c.drawCircle(x + (ex + 4 * look + 2) * s, y + (ey - 1.5) * s, 2 * s, paint("#FFFFFF"))
        bb = ey - 24 - 6 * brow
        c.drawPath(T(f"M {ex - 20} {bb + (6 if sx < 0 else 0) * brow} Q {ex} {bb - 8} {ex + 20} {bb + (0 if sx < 0 else 6) * brow}"), paint(beard[0] if beard else OL, 1, 9))
        c.drawPath(T(f"M {ex - 20} {bb + (6 if sx < 0 else 0) * brow} Q {ex} {bb - 8} {ex + 20} {bb + (0 if sx < 0 else 6) * brow}"), paint(OL, .6, 2))

def arm(c, pts, w, color, hand=True):
    p = skia.Path(); p.moveTo(*pts[0]); [p.lineTo(*q) for q in pts[1:]]
    c.drawPath(p, paint(OL, 1, w + 8)); c.drawPath(p, paint(color, 1, w))
    if hand:
        hx, hy = pts[-1]; h = svgp("M -16 -10 C -14 -26 14 -26 18 -8 L 22 10 C 18 22 -12 22 -16 8 Z", hx, hy, 1.0)
        fillo(c, h, SKIN, 3)

def hoca(c, x, by, t, talk):
    """Yaşlı bilge: beyaz kavuk, uzun gri sakal, yeşil kaftan."""
    bob = 3 * math.sin(t * 2.1)
    body = svgp(f"M {x - 150} {by} C {x - 150} {by - 300} {x - 120} {by - 420} {x - 70} {by - 440} L {x + 70} {by - 440} C {x + 120} {by - 420} {x + 150} {by - 300} {x + 150} {by} Z")
    fillo(c, body, "#4E7A52")
    inner = svgp(f"M {x - 60} {by} L {x - 58} {by - 430} L {x + 58} {by - 430} L {x + 60} {by} Z"); fillo(c, inner, "#B8342C")
    for k in range(9): c.drawLine(x - 56, by - 400 + k * 40, x + 56, by - 400 + k * 40, paint("#7E1F1A", .7, 4))
    fillo(c, svgp(f"M {x - 64} {by - 160} L {x + 64} {by - 160} L {x + 64} {by - 120} L {x - 64} {by - 120} Z"), "#3F6B44", 3)
    g = .5 + .5 * math.sin(t * 3)
    arm(c, [(x - 100, by - 400), (x - 90 + 8 * g * talk, by - 250), (x - 4 + 10 * g * talk, by - 262 - 26 * g * talk)], 46, "#4E7A52")
    fx, fy = x + 2 * math.sin(t * 1.3), by - 520 + bob
    face(c, fx, fy, 1.0, talk * (.5 + .5 * math.sin(t * 17) * math.sin(t * 7.3)), blink(t, .3), look=1, beard=("#B9B9B9", "long"), brow=.6, age=1)
    tur = svgp(f"M {fx - 86} {fy - 66} C {fx - 100} {fy - 170} {fx + 100} {fy - 170} {fx + 86} {fy - 66} C {fx + 40} {fy - 50} {fx - 40} {fy - 50} {fx - 86} {fy - 66} Z")
    fillo(c, tur, "#F4F1EA")
    for k in range(4): c.drawPath(svgp(f"M {fx - 80 + k * 8} {fy - 80 - k * 18} Q {fx} {fy - 100 - k * 22} {fx + 80 - k * 8} {fy - 80 - k * 18}"), paint(OL, .3, 2.5))
    c.drawCircle(fx + 30, fy - 104, 15, paint("#D97A2B")); c.drawCircle(fx + 30, fy - 104, 15, paint(OL, 1, 3)); c.drawCircle(fx + 30, fy - 104, 6, paint("#8A3A12"))

def genc(c, x, by, t, talk):
    """Genç adam: siyah sakal, sarık, koyu entari."""
    bob = 3 * math.sin(t * 2.4 + 1)
    body = svgp(f"M {x - 135} {by} C {x - 140} {by - 300} {x - 110} {by - 410} {x - 64} {by - 430} L {x + 64} {by - 430} C {x + 110} {by - 410} {x + 140} {by - 300} {x + 135} {by} Z")
    fillo(c, body, "#4A4A52")
    for k in range(8): c.drawCircle(x, by - 400 + k * 44, 5, paint(OL))
    c.drawLine(x, by - 430, x, by, paint(OL, .6, 3))
    for sx in (-1, 1): c.drawLine(x + sx * 70, by - 420, x + sx * 64, by - 60, paint("#7A4A26", 1, 10))
    g = .5 + .5 * math.sin(t * 2.6)
    arm(c, [(x + 100, by - 400), (x + 150, by - 290), (x + 120 - 30 * talk * g, by - 210 - 60 * talk * g)], 44, "#4A4A52")
    fx, fy = x - 2 * math.sin(t * 1.1), by - 510 + bob
    hood = svgp(f"M {fx - 92} {fy + 100} C {fx - 110} {fy - 40} {fx - 80} {fy - 140} {fx} {fy - 140} C {fx + 80} {fy - 140} {fx + 110} {fy - 40} {fx + 92} {fy + 100} Z")
    fillo(c, hood, "#D9D6CF")
    face(c, fx, fy, .98, talk * (.5 + .5 * math.sin(t * 15) * math.sin(t * 6.1)), blink(t, 1.7), look=-1, beard=("#1F1B19", "short"), brow=.2)
    hair = svgp(f"M {fx - 64} {fy - 50} C {fx - 70} {fy - 116} {fx + 70} {fy - 116} {fx + 64} {fy - 50} C {fx + 30} {fy - 74} {fx - 30} {fy - 74} {fx - 64} {fy - 50} Z")
    fillo(c, hair, "#1F1B19")

def blink(t, ph):
    u = (t + ph) % 3.4
    return 1 if u < .12 else 0

def draw(c, t):
    c.drawImage(bg_image(), 0, 0)
    # karakter gölgeleri
    for x in (520, 1080):
        sh = paint("#000000", .22); sh.setMaskFilter(skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, 14)); c.drawOval(skia.Rect.MakeXYWH(x - 170, 1050, 340, 50), sh)
    who = int(t / 2.5) % 2
    hoca(c, 520, 1110, t, 1 if who == 0 else 0)
    genc(c, 1080, 1110, t, 1 if who == 1 else 0)

if __name__ == "__main__":
    main(f"{D}/out/cizgi.mp4", 8.0, draw)
