# Soy ağacı / zaman çizelgesi tarzı: Osmanlı padişahları (1-10)
import math
from fmtlib import *

F_CIN = skia.Typeface.MakeFromFile(f"{D}/fonts/Cinzel.ttf")
F_PLAY = skia.Typeface.MakeFromFile(f"{D}/fonts/PlayfairDisplay.ttf")
F_PLAYI = skia.Typeface.MakeFromFile(f"{D}/fonts/PlayfairDisplay-Italic.ttf")
BG = "#0C1714"; GOLD = "#D4AF5A"; GOLD2 = "#F3D98E"; CREAM = "#F3EAD6"; MUTE = "#8FA39B"
S = [("Osman Gazi", "1299–1324"), ("Orhan Gazi", "1324–1362"), ("I. Murad", "1362–1389"), ("Yıldırım Bayezid", "1389–1402"), ("Çelebi Mehmed", "1413–1421"),
     ("II. Murad", "1421–1451"), ("Fatih Sultan Mehmed", "1451–1481"), ("II. Bayezid", "1481–1512"), ("Yavuz Sultan Selim", "1512–1520"), ("Kanuni Sultan Süleyman", "1520–1566")]
XS = [250, 605, 960, 1315, 1670]
def pos(i): return (XS[i], 470) if i < 5 else (XS[9 - i], 820)
_pat = None

def star8(c, x, y, r, pk):
    p = skia.Path()
    for k in range(16):
        a = math.radians(k * 22.5); rr = r if k % 2 == 0 else r * .62
        (p.moveTo if k == 0 else p.lineTo)(x + math.cos(a) * rr, y + math.sin(a) * rr)
    p.close(); c.drawPath(p, pk)

def pattern():
    global _pat
    if _pat: return _pat
    s = skia.Surface(W, H); c = s.getCanvas(); c.clear(col(BG))
    p = skia.Paint(); p.setShader(skia.GradientShader.MakeRadial(skia.Point(W / 2, H * .45), 1200, [col("#16302A").toColor(), col(BG).toColor()])); c.drawRect(skia.Rect.MakeWH(W, H), p)
    for yy in range(-60, H + 120, 120):
        for xx in range(-60, W + 120, 120):
            star8(c, xx + (60 if (yy // 120) % 2 else 0), yy, 40, paint(GOLD, .05, 2))
    _pat = s.makeImageSnapshot(); return _pat

def path_all():
    p = skia.Path(); p.moveTo(*pos(0))
    for i in range(1, 10):
        a, b = pos(i - 1), pos(i)
        if i == 5: p.cubicTo(a[0] + 240, a[1], b[0] + 240, b[1], *b)
        else: p.lineTo(*b)
    return p

def medal(c, x, y, i, hi, a=1.):
    r = 70 * (1.18 if hi else 1)
    if hi:
        g = paint(GOLD2, .45 * a); g.setMaskFilter(skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, 30)); c.drawCircle(x, y, r + 12, g)
    star8(c, x, y, r + 16, paint(GOLD, .9 * a)); star8(c, x, y, r + 16, paint("#3A2C10", a, 2))
    c.drawCircle(x, y, r, paint("#10231E", a)); c.drawCircle(x, y, r, paint(GOLD2 if hi else GOLD, a, 4)); c.drawCircle(x, y, r - 10, paint(GOLD, .6 * a, 1.5))
    text(c, str(i + 1), x, y + 26, F_CIN, 74 if hi else 64, GOLD2 if hi else GOLD, a, align="center")

def draw(c, t):
    c.drawImage(pattern(), 0, 0)
    text(c, "Osmanlı Padişahları", W / 2, 128, F_PLAY, 86, CREAM, align="center")
    text(c, "Kuruluştan Kanuni'ye · 1299–1566", W / 2, 186, F_PLAYI, 36, GOLD, align="center")
    for k in (-1, 1):
        x0 = W / 2 + k * 420; c.drawLine(x0, 172, x0 + k * 260, 172, paint(GOLD, .7, 2)); star8(c, x0 + k * 276, 172, 10, paint(GOLD))
    u = clamp(.15 + t / 10)   # büyüme oranı
    full = path_all(); tp = trimmed(full, u)
    c.drawPath(full, paint(GOLD, .15, 4))
    if tp is not None:
        g = paint(GOLD2, .5, 10); g.setMaskFilter(skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, 8)); c.drawPath(tp, g); c.drawPath(tp, paint(GOLD2, 1, 4))
    # Fetret
    fx, fy = 1560, 645
    text(c, "Fetret Devri", fx + 140, fy - 6, F_PLAYI, 30, MUTE, align="center"); text(c, "1402–1413", fx + 140, fy + 30, F_MED, 24, MUTE, align="center")
    m = skia.PathMeasure(full, False); L = m.getLength()
    # her düğümün yol üzerindeki oranı
    for i, (name, yrs) in enumerate(S):
        x, y = pos(i)
        # düğüm bu orana ulaştı mı?
        reached = i <= int(u * 9.0 + .2)
        hi = i == 6
        a = 1 if reached else .28
        medal(c, x, y, i, hi and reached, a)
        ny = y + (128 if not hi else 140)
        text(c, name, x, ny, F_PLAY, 34 if not hi else 38, CREAM if not hi else GOLD2, a, align="center")
        text(c, yrs, x, ny + 36, F_MED, 24, MUTE, a, align="center")
    # vurgu kartı
    x, y = pos(6)
    cx, cy = x + 160, y - 250
    card = skia.RRect.MakeRectXY(skia.Rect.MakeXYWH(cx, cy, 430, 132), 16, 16)
    c.drawRRect(card, paint("#0A1411", .92)); c.drawRRect(card, paint(GOLD, 1, 2))
    text(c, "1453", cx + 28, cy + 58, F_CIN, 44, GOLD2); text(c, "İstanbul'un Fethi", cx + 150, cy + 56, F_PLAY, 34, CREAM)
    text(c, "21 yaşında, 53 günlük kuşatmayla", cx + 28, cy + 104, F_MED, 24, MUTE)
    c.drawLine(x + 60, y - 70, cx + 20, cy + 132, paint(GOLD, .8, 2))

if __name__ == "__main__":
    main(f"{D}/out/soy.mp4", 15.0, draw)
