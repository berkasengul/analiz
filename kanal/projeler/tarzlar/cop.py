# Çöp adam tarzı: "22 Nisan 1453 — gemiler karadan Haliç'e" (18 sn)
import math, sys
from fmtlib import *

INK = "#1B1B1B"; PAPER = "#FBF8F1"; WATER = "#BFDDF2"; WAVE = "#2F74B5"; WOOD = "#C98B4E"; GROUND = "#EDE3CC"
WL = 850                      # su seviyesi
DUR = 18.0
BG = None

def gy(x):
    if x < 300: return min(1180, 860 + (300 - x) * .7)
    if x <= 3500: return 860 - 300 * (.5 - .5 * math.cos(2 * math.pi * (x - 300) / 3200))
    if x < 4180: return min(1180, 860 + (x - 3500) * .7)
    return max(790, 1180 - (x - 4180) * 3.2)
def slope(x): return math.atan2(gy(x + 60) - gy(x - 60), 120)

def ship_x(t):
    if t < 1: return 620
    if t < 9: p = prog(t, 1, 9); return 620 + 1330 * smooth(p)
    if t < 9.6: return 1950
    if t < 12.9: p = prog(t, 9.6, 12.9); return 1950 + 1610 * p * p
    return 3560 + 260 * eout(prog(t, 12.9, 14.2))
def ship_pose(t):
    x = ship_x(t); land = gy(x) - 16; sea = WL + 22 + 4 * math.sin(2.2 * t)
    if land < sea: return x, land, slope(x)
    return x, sea, .03 * math.sin(1.7 * t)
def cam(t):
    sx = ship_x(t); lead = 520 * smooth(prog(t, 11.4, 13.2))
    return clamp(sx - 760 + lead, -120, 4720 - W)

def stick(c, hip, feet, lean, d, hands=None, hat="sarik", face="norm", s=1., t=0, sweat=False):
    """hip: kalça, feet: iki ayak, lean: öne eğilme (rad), d: yön (+1 sağ), hands: iki el noktası."""
    hx, hy = hip; L = 74 * s
    sh = (hx + d * math.sin(lean) * L, hy - math.cos(lean) * L)
    hc = (hx + d * math.sin(lean) * (L + 30 * s), hy - math.cos(lean) * (L + 30 * s)); r = 23 * s
    pk = paint(INK, 1, 6.5 * s)
    for fx_, fy_ in feet:                 # bacaklar (diz öne)
        mx, my = (hx + fx_) / 2, (hy + fy_) / 2
        kx, ky = mx + d * 7 * s, my
        pth = skia.Path(); pth.moveTo(hx, hy); pth.lineTo(kx, ky); pth.lineTo(fx_, fy_); c.drawPath(pth, pk)
    c.drawLine(hx, hy, sh[0], sh[1], pk)
    if hands is None: hands = [(sh[0] - 14 * s, sh[1] + 60 * s), (sh[0] + 14 * s, sh[1] + 60 * s)]
    for (ex, ey) in hands:                # kollar (dirsekli)
        dx, dy = ex - sh[0], ey - sh[1]; dist = math.hypot(dx, dy); Lr = 36 * s
        if dist > 2 * Lr: ex, ey = sh[0] + dx / dist * 2 * Lr, sh[1] + dy / dist * 2 * Lr; dist = 2 * Lr
        h_ = math.sqrt(max(0, Lr * Lr - (dist / 2) ** 2)); mx, my = (sh[0] + ex) / 2, (sh[1] + ey) / 2
        nx, ny = -dy / (dist + 1e-6), dx / (dist + 1e-6)
        if ny < 0: nx, ny = -nx, -ny      # dirsek aşağı
        pth = skia.Path(); pth.moveTo(*sh); pth.lineTo(mx + nx * h_, my + ny * h_); pth.lineTo(ex, ey); c.drawPath(pth, pk)
    c.drawCircle(hc[0], hc[1], r, paint(PAPER)); c.drawCircle(hc[0], hc[1], r, pk)
    ex = hc[0] + d * 8 * s
    if face == "shock":
        for k in (-1, 1): c.drawCircle(ex + k * 7 * s, hc[1] - 3 * s, 5.5 * s, paint("#FFFFFF")); c.drawCircle(ex + k * 7 * s, hc[1] - 3 * s, 5.5 * s, paint(INK, 1, 2.2 * s)); c.drawCircle(ex + k * 7 * s + d * 1.5, hc[1] - 3 * s, 2.2 * s, paint(INK))
        c.drawCircle(ex, hc[1] + 10 * s, 4.5 * s, paint(INK, 1, 2.5 * s))
    else:
        for k in (-1, 1): c.drawCircle(ex + k * 6 * s, hc[1] - 3 * s, 2.8 * s, paint(INK))
        pth = skia.Path()
        if face == "happy": pth.moveTo(ex - 8 * s, hc[1] + 6 * s); pth.quadTo(ex, hc[1] + 15 * s, ex + 8 * s, hc[1] + 6 * s)
        elif face == "effort": pth.moveTo(ex - 7 * s, hc[1] + 10 * s); pth.lineTo(ex + 7 * s, hc[1] + 9 * s)
        else: pth.moveTo(ex - 6 * s, hc[1] + 9 * s); pth.quadTo(ex, hc[1] + 12 * s, ex + 6 * s, hc[1] + 9 * s)
        c.drawPath(pth, paint(INK, 1, 2.6 * s))
    if hat == "sarik":                    # beyaz sarık
        rr = skia.RRect.MakeRectXY(skia.Rect.MakeXYWH(hc[0] - r * 1.05, hc[1] - r * 1.55, r * 2.1, r * .95), r * .45, r * .45)
        c.drawRRect(rr, paint("#FFFFFF")); c.drawRRect(rr, paint(INK, 1, 4 * s))
        c.drawLine(hc[0] - r * .8, hc[1] - r * 1.1, hc[0] + r * .8, hc[1] - r * 1.25, paint(INK, .5, 2.5 * s))
    elif hat == "migfer":                 # Bizans miğferi
        pth = skia.Path(); pth.addArc(skia.Rect.MakeXYWH(hc[0] - r * 1.1, hc[1] - r * 1.25, r * 2.2, r * 2.1), 180, 180); pth.close()
        c.drawPath(pth, paint("#A9B1BA")); c.drawPath(pth, paint(INK, 1, 4 * s))
        c.drawLine(hc[0], hc[1] - r * 1.25, hc[0] - d * 2, hc[1] - r * 1.9, paint("#C8322B", 1, 8 * s))
    if sweat:
        for k in range(2):
            ph = (t * 1.6 + k * .5) % 1
            sx_, sy_ = hc[0] - d * (r + 8 + 6 * k), hc[1] - r * .4 + ph * 34
            pth = skia.Path(); pth.moveTo(sx_, sy_ - 9); pth.quadTo(sx_ + 6, sy_ + 2, sx_, sy_ + 5); pth.quadTo(sx_ - 6, sy_ + 2, sx_, sy_ - 9)
            c.drawPath(pth, paint("#4A9BE0", 1 - ph))
    return {"head": hc, "sh": sh}

def walker(c, x, t, lean, d=1, hands=None, amp=18, phase=None, ground=gy, **kw):
    ph = (x / 32) if phase is None else phase
    f1 = x + d * amp * math.sin(ph); f2 = x - d * amp * math.sin(ph)
    l1 = 10 * max(0, math.cos(ph)) * (amp > 0); l2 = 10 * max(0, -math.cos(ph)) * (amp > 0)
    hip = (x, ground(x) - 68 - 2.5 * abs(math.sin(ph)) * (amp > 0))
    return stick(c, hip, [(f1, ground(f1) - l1), (f2, ground(f2) - l2)], lean, d, hands, t=t, **kw)

def ship(c, x, y, ang, t, sail=1.):
    c.save(); c.translate(x, y); c.rotate(math.degrees(ang))
    pk = paint(INK, 1, 6)
    # direk ve yelken
    c.drawLine(-10, -78, -10, -350, paint(INK, 1, 8))
    sp = skia.Path(); sp.moveTo(-14, -330); sp.cubicTo(70 + 20 * sail, -300, 70 + 20 * sail, -150, -14, -118); sp.lineTo(-150, -125); sp.cubicTo(-120, -200, -120, -260, -150, -325); sp.close()
    c.drawPath(sp, paint("#FFFFFF")); c.drawPath(sp, pk)
    for k in range(2): c.drawLine(-140 + k * 6, -245 + k * 70, 40 + k * 10, -250 + k * 70, paint(INK, .35, 3))
    fl = skia.Path(); w_ = 8 * math.sin(t * 6); fl.moveTo(-10, -350); fl.quadTo(25, -360 + w_, 55, -340 + w_ * .5); fl.quadTo(25, -335 - w_, -10, -322); fl.close()
    c.drawPath(fl, paint("#D2352C")); c.drawPath(fl, paint(INK, 1, 4))
    # gövde
    hp = skia.Path(); hp.moveTo(-205, -86); hp.lineTo(205, -98); hp.quadTo(240, -112, 236, -128); hp.quadTo(230, -60, 150, 0); hp.lineTo(-150, 0); hp.quadTo(-200, -35, -205, -86); hp.close()
    c.drawPath(hp, paint(WOOD)); c.drawPath(hp, pk)
    for k, yy in enumerate((-60, -32)): c.drawLine(-188 + k * 14, yy, 190 - k * 18, yy - 4, paint(INK, .45, 3.5))
    for k in range(5):                    # kürek delikleri
        c.drawCircle(-120 + k * 60, -72, 6, paint(INK))
    c.restore()
def ship_pt(x, y, ang, lx, ly):
    ca, sa = math.cos(ang), math.sin(ang)
    return x + lx * ca - ly * sa, y + lx * sa + ly * ca

def bubble(c, s, ax, ay, t, t0, t1, side=1, size=42):
    if t < t0 or t > t1 + .25: return
    pop = back(prog(t, t0, t0 + .28)); fade = 1 - prog(t, t1, t1 + .25)
    f = font(F_HAND, size); w = f.measureText(s) + 48; h = size + 34
    bx = ax - (w * .22 if side > 0 else w * .78); by = ay - 70 - h
    c.save(); c.translate(ax, ay); c.scale(pop, pop); c.translate(-ax, -ay)
    pth = skia.Path(); pth.addRRect(skia.RRect.MakeRectXY(skia.Rect.MakeXYWH(bx, by, w, h), h / 2, h / 2))
    tail = skia.Path(); tx = ax + (14 if side > 0 else -14)
    tail.moveTo(tx - 16, by + h - 4); tail.lineTo(ax, ay - 12); tail.lineTo(tx + 16, by + h - 4); tail.close()
    pth = skia.Op(pth, tail, skia.PathOp.kUnion_PathOp) or pth
    c.drawPath(pth, paint("#FFFFFF", fade)); c.drawPath(pth, paint(INK, fade, 4.5))
    c.drawString(s, bx + 24, by + h / 2 + size * .34, f, paint(INK, fade))
    c.restore()

def roller(c, x):
    y = gy(x) - 7; c.drawCircle(x, y, 9, paint("#B07A44")); c.drawCircle(x, y, 9, paint(INK, 1, 3)); c.drawCircle(x, y, 3.5, paint(INK, .6, 2))
    c.drawLine(x - 4, y - 5, x + 1, y - 7, paint("#FFFFFF", .8, 2))

def cloud(c, x, y, s):
    pth = skia.Path()
    for dx, dy, r in ((0, 0, 34), (40, -18, 42), (88, -4, 36), (122, 10, 26), (-34, 12, 24)):
        pth.addCircle(x + dx * s, y + dy * s, r * s)
    u = skia.Path(); first = True
    pth2 = skia.Path()
    try: pth2 = skia.Op(pth, skia.Path(), skia.PathOp.kUnion_PathOp) or pth
    except Exception: pth2 = pth
    c.drawPath(pth2, paint("#FFFFFF")); c.drawPath(pth2, paint(INK, .55, 3.5))

def draw(c, t):
    global BG
    if BG is None: BG = paper_texture(PAPER)
    c.drawImage(BG, 0, 0)
    cx = cam(t)
    # bulutlar (yavaş)
    for k, (wx, wy, s) in enumerate(((900, 290, 1.0), (1500, 250, .8), (2300, 320, 1.1), (3150, 270, .9), (4000, 300, 1.0))):
        cloud(c, wx - cx * .25 + t * 8 - 200, wy, s)
    # uzak tepeler + Galata
    c.save(); c.translate(-cx * .5, 0)
    bp = skia.Path(); bp.moveTo(-200, 700)
    for X in range(-200, 4000, 40): bp.lineTo(X, 650 + 30 * math.sin(X / 260) + 18 * math.sin(X / 97))
    bp.lineTo(4000, 1100); bp.lineTo(-200, 1100); bp.close()
    c.drawPath(bp, paint("#E6E1D3"));
    edge = skia.Path(); edge.moveTo(-200, 650 + 30 * math.sin(-200 / 260) + 18 * math.sin(-200 / 97))
    for X in range(-200, 4000, 40): edge.lineTo(X, 650 + 30 * math.sin(X / 260) + 18 * math.sin(X / 97))
    c.drawPath(edge, paint("#8C877A", 1, 3.5))
    gx, gb = 2380, 650 + 30 * math.sin(2380 / 260) + 18 * math.sin(2380 / 97) + 6
    tw_ = skia.Path(); tw_.moveTo(gx - 34, gb); tw_.lineTo(gx - 28, gb - 190); tw_.lineTo(gx + 28, gb - 190); tw_.lineTo(gx + 34, gb); tw_.close()
    c.drawPath(tw_, paint("#F3EEE2")); c.drawPath(tw_, paint("#6E695D", 1, 4))
    cone = skia.Path(); cone.moveTo(gx - 36, gb - 190); cone.lineTo(gx, gb - 262); cone.lineTo(gx + 36, gb - 190); cone.close()
    c.drawPath(cone, paint("#B9876A")); c.drawPath(cone, paint("#6E695D", 1, 4))
    for k in range(3): c.drawLine(gx - 8, gb - 60 - k * 42, gx - 8, gb - 44 - k * 42, paint("#6E695D", 1, 4)); c.drawLine(gx + 8, gb - 60 - k * 42, gx + 8, gb - 44 - k * 42, paint("#6E695D", 1, 4))
    text(c, "Galata", gx, gb - 280, F_CAV, 44, "#6E695D", align="center")
    c.restore()

    c.save(); c.translate(-cx, 0)
    xs = list(range(int(cx) - 60, int(cx) + W + 80, 12))
    gp = skia.Path(); gp.moveTo(xs[0], 1200)
    for X in xs: gp.lineTo(X, gy(X))
    gp.lineTo(xs[-1], 1200); gp.close()
    c.drawPath(gp, paint(GROUND))
    for k, X in enumerate(range((int(cx) // 140) * 140, int(cx) + W + 140, 140)):   # çimen tutamları
        if X < 300 or 3500 < X < 4250: continue
        y = gy(X) + 26 + 14 * ((k * 7) % 3)
        for j in (-1, 0, 1): c.drawLine(X + j * 6, y, X + j * 10, y - 12, paint("#7D9A5A", .8, 3))
    # kara surları (karşı kıyı)
    if cx + W > 4250:
        wl, wr, top = 4330, 4720, 600
        c.drawRect(skia.Rect.MakeLTRB(wl, top, wr, 800), paint("#E9DDC4"))
        for k in range(int((wr - wl) / 46)):                # mazgallar
            c.drawRect(skia.Rect.MakeXYWH(wl + 6 + k * 46, top - 30, 28, 32), paint("#E9DDC4")); c.drawRect(skia.Rect.MakeXYWH(wl + 6 + k * 46, top - 30, 28, 32), paint(INK, 1, 5))
        c.drawRect(skia.Rect.MakeLTRB(wl, top, wr, 800), paint(INK, 1, 6))
        for row in range(4):
            yy = top + 40 + row * 45; c.drawLine(wl, yy, wr, yy, paint(INK, .25, 3))
            for k in range(8): xx = wl + 25 + k * 50 + (row % 2) * 25; c.drawLine(xx, yy, xx, yy + 45, paint(INK, .2, 3))
    # su
    above = skia.Path(); above.moveTo(xs[0], -10)
    for X in xs: above.lineTo(X, gy(X))
    above.lineTo(xs[-1], -10); above.close()
    wr = skia.Path(); wr.addRect(skia.Rect.MakeLTRB(xs[0], WL, xs[-1], 1200))
    wpth = skia.Op(wr, above, skia.PathOp.kIntersect_PathOp) or wr
    c.drawPath(wpth, paint(WATER, .88))
    for row in range(3):
        wp = skia.Path(); yy = WL + 8 + row * 55; first = True
        for X in range(int(cx) - 20, int(cx) + W + 40, 16):
            if gy(X) < yy + 6: first = True; continue
            Y = yy + 5 * math.sin(X / 38 + t * (2.2 + row * .4) + row)
            if first: wp.moveTo(X, Y); first = False
            else: wp.lineTo(X, Y)
        c.drawPath(wp, paint(WAVE, .75 - row * .2, 3.5))
    # zemin çizgisi (su üstü)
    lp = skia.Path(); first = True
    for X in xs:
        if gy(X) > WL + 2: first = True; continue
        if first: lp.moveTo(X, gy(X)); first = False
        else: lp.lineTo(X, gy(X))
    c.drawPath(lp, paint(INK, 1, 7))
    for X in range(320, 3440, 78):                       # yağlı kızak kütükleri
        if cx - 30 < X < cx + W + 30: roller(c, X)
    # yer adları
    text(c, "Boğaz", 120, 960, F_CAV, 58, WAVE, align="center")
    text(c, "Haliç", 3900, 1010, F_CAV, 64, WAVE, align="center")

    sx, sy, sa = ship_pose(t)
    # ikinci gemi sırada bekliyor (solda, suda)
    ship(c, -60, WL + 22 + 4 * math.sin(2.2 * t + 1), .03 * math.sin(1.7 * t + 1), t + .5)
    # itenler (geminin arkasında)
    stern = ship_pt(sx, sy, sa, -200, -60)
    for i in range(2):
        moving = t < 9
        px = (stern[0] - 70 - i * 70) if t < 9 else (ship_pt(*ship_pose(8.99), -200, -60)[0] - 70 - i * 70)
        hands = [(stern[0] - i * 70 + 4, stern[1] + 6), (stern[0] - i * 70 - 6, stern[1] + 16)] if moving else None
        walker(c, px, t, .5 if moving else 0, 1, hands, amp=18 if moving else 0, face="effort" if moving else "norm", sweat=moving)
    # çekenler (önde, halatla)
    bow = ship_pt(sx, sy, sa, 228, -120)
    rel = 9.5
    pulls = []
    for i in range(4):
        base = ship_x(min(t, rel)) + 300 + i * 95
        pulls.append(base)
    rope_a = 1 - prog(t, rel, rel + .35)
    pts = []
    for i, px in enumerate(pulls):
        hip_y = gy(px) - 68
        pts.append((px - 26, hip_y + 4))
    if rope_a > 0:
        rp = skia.Path(); rp.moveTo(*bow)
        for p_ in pts: rp.lineTo(*p_)
        c.drawPath(rp, paint("#8A5A2B", rope_a, 6))
    for i, px in enumerate(pulls):
        pulling = t < rel
        cheer = t > 10.4
        if pulling:
            hands = [pts[i], (pts[i][0] + 8, pts[i][1] - 2)]
            walker(c, px, t, .55, 1, hands, amp=20, face="effort", sweat=True)
        else:
            hy = gy(px) - 68 - 74
            up = 14 * math.sin(t * 9 + i)
            hands = [(px - 30, hy - 60 + up), (px + 30, hy - 60 - up)] if cheer else None
            walker(c, px, t, 0, -1 if cheer else 1, hands, amp=0, face="happy" if cheer else "norm")
    # gemi + gemideki denizci
    ship(c, sx, sy, sa, t)
    dk = ship_pt(sx, sy, sa, 90, -96)
    wave_hand = t > 14.2
    hy = dk[1] - 70 - 74
    mast = ship_pt(sx, sy, sa, -10, -200)
    hands = [(mast[0] + 4, mast[1] + 20), (dk[0] + 40, hy - 50 + 16 * math.sin(t * 10))] if wave_hand else [(mast[0] + 4, mast[1] + 20), (dk[0] + 26, dk[1] - 60)]
    sailor = stick(c, (dk[0], dk[1] - 70), [(dk[0] - 14, dk[1]), (dk[0] + 14, dk[1])], sa * .3, 1, hands, face="happy" if wave_hand else ("shock" if 6.4 < t < 8.8 else "norm"), t=t)
    # sıçrama
    if 13.0 < t < 15.0:
        u = prog(t, 13.0, 15.0); bx_ = ship_pt(sx, sy, sa, 210, 0)[0]
        for k in range(14):
            a = math.radians(30 + k * 9); v = 420 + (k * 37) % 160
            px_ = bx_ - 120 + k * 22 + math.cos(a) * v * u * .5; py_ = WL - math.sin(a) * v * u + 900 * u * u
            if py_ < WL + 10: c.drawCircle(px_, py_, 7 - 4 * u, paint("#FFFFFF")); c.drawCircle(px_, py_, 7 - 4 * u, paint(WAVE, 1, 2.5))
    # nöbetçi
    gxw = 4470
    if cx + W > 4300:
        shock = t > 12.5
        spear = [(gxw - 28, 600 - 120), (gxw + 20, 600 - 100)]
        stick(c, (gxw, 600 - 64), [(gxw - 13, 600 - 32), (gxw + 13, 600 - 32)], 0, -1, spear, hat="migfer", face="shock" if shock else "norm")
        c.drawLine(gxw - 34, 600 - 190, gxw - 22, 600 - 20, paint(INK, 1, 5));
        sp = skia.Path(); sp.moveTo(gxw - 36, 600 - 214); sp.lineTo(gxw - 44, 600 - 186); sp.lineTo(gxw - 28, 600 - 188); sp.close(); c.drawPath(sp, paint("#9AA3AD")); c.drawPath(sp, paint(INK, 1, 3.5))
        if shock:
            for k, a in enumerate((-.5, 0, .5)):
                pp = back(prog(t, 12.6 + k * .06, 12.9 + k * .06)); hx_, hy_ = gxw, 600 - 200
                c.drawLine(hx_ + math.sin(a) * 40, hy_ - math.cos(a) * 40 * pp, hx_ + math.sin(a) * 62 * pp, hy_ - math.cos(a) * 64 * pp, paint(INK, 1, 5))
    # balonlar (dünya koordinatında)
    lead = walker.__defaults__ and None
    lx = pulls[-1]; lhead = (lx + 30, gy(lx) - 68 - 104)
    bubble(c, "Zincir mi? Sorun değil!", lhead[0] - 10, lhead[1] - 6, t, .6, 3.3)
    pb = ship_x(min(t, 8.99)) - 270
    bubble(c, "Kızaklar yağlı, itin!", pb, gy(pb) - 190, t, 3.6, 6.1)
    bubble(c, "Biz denizde değil miydik?", sailor["head"][0] + 10, sailor["head"][1] - 18, t, 6.4, 8.8)
    bubble(c, "Bırakın!", lhead[0] - 10, lhead[1] - 6, t, 9.0, 10.4)
    bubble(c, "Bu ne?!", gxw - 20, 600 - 230, t, 12.7, 15.4, side=-1, size=50)
    bubble(c, "Haliç'teyiz!", sailor["head"][0] + 10, sailor["head"][1] - 18, t, 14.4, 17.6)
    c.restore()

    # başlık (ekran)
    a = prog(t, .1, .6)
    text(c, "22 Nisan 1453", 70, 118, F_CAV, 92, INK, a)
    ul = skia.Path(); ul.moveTo(72, 140); ul.cubicTo(200, 128, 330, 150, 520, 134)
    tp = trimmed(ul, prog(t, .4, 1.1))
    if tp is not None: c.drawPath(tp, paint("#D2352C", 1, 6))
    text(c, "Gemiler karadan Haliç'e", 74, 196, F_HAND, 44, "#4A4A4A", prog(t, .7, 1.2))

if __name__ == "__main__":
    main(f"{D}/out/cop_adam.mp4", DUR, draw)
