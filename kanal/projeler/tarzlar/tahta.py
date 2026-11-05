# Beyaz tahta tarzı: "Ayasofya'nın 1.500 yılı" (18 sn)
import math
from fmtlib import *
import cop

INK = "#222222"; RED = "#D23A2E"; BLUE = "#2C6FB7"; GREEN = "#2E8B57"; GREY = "#8A8A8A"
DUR = 18.0
BG = None
GY = 780

def P(): return skia.Path()
def poly(pts):
    p = P(); p.moveTo(*pts[0])
    for q in pts[1:]: p.lineTo(*q)
    return p
def arch(x, y, w, h):          # alt kenarı açık kemerli pencere
    p = P(); p.moveTo(x, y + h); p.lineTo(x, y + w / 2); p.arcTo(skia.Rect.MakeXYWH(x, y, w, w), 180, 180, False); p.lineTo(x + w, y + h); return p

# --- 537: yapı ---
def wall_main(): return poly([(380, GY), (380, 560), (920, 560), (920, GY)])
def drum(): return poly([(470, 560), (470, 532), (830, 532), (830, 560)])
def dome():
    p = P(); p.addArc(skia.Rect.MakeXYWH(470, 532 - 150, 360, 300), 180, 180); return p
def annex_l():
    p = poly([(380, 640), (260, 640), (260, GY)]); q = P(); q.addArc(skia.Rect.MakeXYWH(260, 580, 240, 120), 180, 90); p.addPath(q); return p
def annex_r():
    p = poly([(920, 640), (1040, 640), (1040, GY)]); q = P(); q.addArc(skia.Rect.MakeXYWH(800, 580, 240, 120), 270, 90); p.addPath(q); return p
def windows():
    p = P()
    for k in range(9): p.addPath(arch(488 + k * 38, 540, 16, 18))
    for row, y in enumerate((590, 660)):
        for k in range(6):
            x = 412 + k * 82 + (0 if row == 0 else 0)
            if row == 1 and k in (2, 3): continue
            p.addPath(arch(x, y, 30, 46))
    p.addPath(arch(604, 690, 92, 90))
    for x in (290, 960):
        p.addPath(arch(x, 680, 30, 46))
    return p
def ground(): return poly([(110, GY), (420, GY + 2), (760, GY - 1), (1190, GY + 1)])
STRUCT = [(ground, 1.2, 1.7), (wall_main, 1.6, 2.6), (drum, 2.6, 3.0), (dome, 3.0, 3.9), (annex_l, 3.9, 4.5), (annex_r, 4.5, 5.1), (windows, 5.1, 6.4)]

# --- 1453: minareler + alem ---
def minaret(x, base, top):
    p = poly([(x - 11, base), (x - 11, top), (x + 11, top), (x + 11, base)])
    p.addPath(poly([(x - 18, top + 90), (x + 18, top + 90), (x + 18, top + 102), (x - 18, top + 102), (x - 18, top + 90)]))
    p.addPath(poly([(x - 15, top), (x, top - 62), (x + 15, top)]))
    return p
def alem():
    p = poly([(650, 382), (650, 350)]); q = P(); q.addArc(skia.Rect.MakeXYWH(636, 318, 30, 30), 60, 240); p.addPath(q); return p
MIN = [(lambda: minaret(205, GY, 330), 7.0, 7.6), (lambda: minaret(1095, GY, 330), 7.6, 8.2), (lambda: minaret(318, 640, 380), 8.2, 8.7),
       (lambda: minaret(982, 640, 380), 8.7, 9.2), (alem, 9.2, 9.5)]

# --- tabela ---
def sign(): return poly([(560, 800), (740, 800), (740, 862), (560, 862), (560, 800)])
def posts(): p = poly([(590, 862), (590, 905)]); p.addPath(poly([(710, 862), (710, 905)])); return p
SIGN = [(sign, 10.8, 11.3), (posts, 11.3, 11.5)]

_cache = {}
def path_of(fn):
    if fn not in _cache:
        p = fn()
        _cache[fn] = p
    return _cache[fn]

def stroke(c, fn, t, t0, t1, color=INK, w=5.5, pens=None):
    if t < t0: return
    p = path_of(fn); u = prog(t, t0, t1); tp = trimmed(p, u)
    if tp is None: return
    pk = paint(color, 1, w); pk.setPathEffect(skia.DiscretePathEffect.Make(14, .9, 7))
    c.drawPath(tp, pk)
    if pens is not None and u < 1:
        e = path_end(p, u)
        if e: pens.append((e, color))

def write(c, s, x, y, tf, size, color, t, t0, t1, pens=None, a=1.):
    if t < t0: return
    f = font(tf, size); w = f.measureText(s); u = prog(t, t0, t1)
    c.save(); c.clipRect(skia.Rect.MakeLTRB(x - 10, y - size * 1.2, x + w * u + 2, y + size * .5))
    c.drawString(s, x, y, f, paint(color, a)); c.restore()
    if pens is not None and u < 1: pens.append(((x + w * u, y - size * .25 + 6 * math.sin(u * 40)), color))

def pen(c, pos, color, a=1.):
    x, y = pos; c.save(); c.translate(x, y); c.rotate(-32)
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect.MakeXYWH(-9, -190, 32, 150), 10, 10), paint("#333438", a))
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect.MakeXYWH(-9, -190, 32, 46), 10, 10), paint(color, a))
    tip = poly([(-5, -42), (19, -42), (10, -6), (4, -6)]); tip.close(); c.drawPath(tip, paint("#DDDDDD", a))
    c.drawCircle(7, -4, 4, paint(color, a))
    c.drawRect(skia.Rect.MakeXYWH(-9, -120, 32, 6), paint("#FFFFFF", .25 * a))
    c.restore()

def wash(c, fn_list, color, a, closed=True):
    if a <= 0: return
    for fn in fn_list:
        p = skia.Path(path_of(fn)) if not callable(fn) or fn in _cache else skia.Path(fn())
        c.drawPath(p, paint(color, a))

def draw(c, t):
    global BG
    if BG is None: BG = paper_texture("#FAFAF8", amt=3)
    c.drawImage(BG, 0, 0)
    pens = []
    z = 1 + .025 * smooth(prog(t, 15.8, 18))
    c.save(); c.translate(W / 2, H / 2); c.scale(z, z); c.translate(-W / 2, -H / 2)
    # başlık
    write(c, "Ayasofya'nın 1.500 yılı", 110, 150, F_CAV, 92, INK, t, .1, 1.2, pens)
    ul = poly([(112, 172), (420, 166), (760, 176)]); tp = trimmed(ul, prog(t, 1.0, 1.3))
    if tp is not None: c.drawPath(tp, paint(RED, 1, 6))
    # renk yıkamaları (çizgiden sonra)
    wa = .42 * smooth(prog(t, 6.2, 7.0))
    if wa > 0:
        for r in (skia.Rect.MakeLTRB(380, 560, 920, GY), skia.Rect.MakeLTRB(260, 640, 380, GY), skia.Rect.MakeLTRB(920, 640, 1040, GY), skia.Rect.MakeLTRB(470, 532, 830, 560)):
            c.drawRect(r, paint("#E7A792", wa))
        d = P(); d.addArc(skia.Rect.MakeXYWH(470, 382, 360, 300), 180, 180); d.close(); c.drawPath(d, paint("#9FB4CB", wa * 1.2))
        for rr in ((260, 580, 240, 120, 180), (800, 580, 240, 120, 270)):
            q = P(); q.moveTo(380 if rr[4] == 180 else 920, 640); q.arcTo(skia.Rect.MakeXYWH(*rr[:4]), rr[4], 90, False); q.close(); c.drawPath(q, paint("#9FB4CB", wa * 1.2))
    ma = .55 * smooth(prog(t, 9.2, 9.8))
    if ma > 0:
        for x, b, tp_ in ((205, GY, 330), (1095, GY, 330), (318, 640, 380), (982, 640, 380)):
            c.drawRect(skia.Rect.MakeLTRB(x - 11, tp_, x + 11, b), paint("#F4EEE6", 1))
            q = poly([(x - 15, tp_), (x, tp_ - 62), (x + 15, tp_)]); q.close(); c.drawPath(q, paint("#9FB4CB", ma))
    # minareler arkada kalsın: önce arka ikili
    for fn, a_, b_ in MIN[2:4]: stroke(c, fn, t, a_, b_, INK, 5, pens)
    for fn, a_, b_ in STRUCT: stroke(c, fn, t, a_, b_, INK, 5.5, pens)
    for fn, a_, b_ in MIN[:2] + MIN[4:]: stroke(c, fn, t, a_, b_, INK if fn is not alem else "#C9A227", 5, pens)
    # tabela
    if t > 10.8:
        sa = smooth(prog(t, 11.0, 11.4)); c.drawRect(skia.Rect.MakeLTRB(560, 800, 740, 862), paint("#FFFFFF", sa))
    for fn, a_, b_ in SIGN: stroke(c, fn, t, a_, b_, INK, 5, pens)
    wipe = prog(t, 13.4, 13.9)
    if t > 11.4 and wipe < 1:
        c.save(); c.clipRect(skia.Rect.MakeLTRB(560 + 180 * wipe, 800, 740, 862))
        write(c, "MÜZE", 650 - tw("MÜZE", F_HAND, 46) / 2, 848, F_HAND, 46, BLUE, t, 11.5, 12.0, pens); c.restore()
        if 0 < wipe < 1:                            # silgi
            ex = 560 + 180 * wipe; c.drawRRect(skia.RRect.MakeRectXY(skia.Rect.MakeXYWH(ex - 30, 790, 60, 82), 10, 10), paint("#3D5A80"))
            c.drawRect(skia.Rect.MakeXYWH(ex - 30, 790, 60, 20), paint("#E8E2D0"))
    write(c, "CAMİ", 650 - tw("CAMİ", F_HAND, 46) / 2, 848, F_HAND, 46, GREEN, t, 13.95, 14.5, pens)
    # turistler (1934)
    ta = prog(t, 11.6, 11.9)
    if ta > 0 and t < 13.4:
        c.save(); c.translate(0, 0)
        for k, x in enumerate((830, 935)):
            s_ = .72 * back(prog(t, 11.6 + k * .12, 11.95 + k * .12))
            if s_ <= 0: continue
            hip = (x, GY + 60 - 68 * s_)
            h = cop.stick(c, hip, [(x - 12 * s_, GY + 60), (x + 12 * s_, GY + 60)], 0, -1, [(x - 34 * s_, GY + 60 - 120 * s_), (x - 22 * s_, GY + 60 - 112 * s_)], hat=None, face="happy", s=s_)
            cx_, cy_ = x - 40 * s_, GY + 60 - 128 * s_
            c.drawRRect(skia.RRect.MakeRectXY(skia.Rect.MakeXYWH(cx_ - 18 * s_, cy_ - 12 * s_, 36 * s_, 26 * s_), 5, 5), paint("#333333"))
            c.drawCircle(cx_, cy_ + 1, 7 * s_, paint("#9FB4CB"))
            fl = (t * 3 + k * .5) % 1
            if fl < .18:
                for a in range(8):
                    ang = a * math.pi / 4; c.drawLine(cx_ - 30 + math.cos(ang) * 14, cy_ - 22 + math.sin(ang) * 14, cx_ - 30 + math.cos(ang) * 28, cy_ - 22 + math.sin(ang) * 28, paint("#E8B526", 1, 4))
        c.restore()
    # sağ liste
    X = 1270
    items = [("537", "Kilise olarak yapıldı", RED, 6.4, 7.2), ("1453", "Camiye çevrildi", GREEN, 9.6, 10.5), ("1934", "Müze oldu", BLUE, 12.1, 12.9), ("2020", "Yeniden cami", GREEN, 14.6, 15.4)]
    for k, (yr, s_, col_, a_, b_) in enumerate(items):
        y = 330 + k * 150
        write(c, yr, X, y, F_CAV, 84, col_, t, a_, a_ + .45, pens)
        write(c, s_, X, y + 54, F_HAND, 44, INK, t, a_ + .4, b_, pens)
        if k < 3 and t > b_:
            ap = poly([(X + 40, y + 76), (X + 34, y + 102)]); tp = trimmed(ap, prog(t, b_, b_ + .3))
            if tp is not None: c.drawPath(tp, paint(GREY, 1, 4))
    write(c, "* minareler zamanla eklendi", 115, 836, F_HAND, 32, GREY, t, 10.4, 10.9, pens)
    # kapanış: toplam süre
    write(c, "≈ 1.500 yıl, 4 dönem", X, 960, F_CAV, 70, RED, t, 15.8, 16.8, pens)
    ul2 = poly([(X - 10, 985), (X + 280, 978), (X + 560, 990)]); tp = trimmed(ul2, prog(t, 16.8, 17.2))
    if tp is not None: c.drawPath(tp, paint(RED, 1, 5))
    c.restore()
    if pens:
        pos, colr = pens[-1]
        pen(c, pos, colr)

if __name__ == "__main__":
    main(f"{D}/out/beyaz_tahta.mp4", DUR, draw)
