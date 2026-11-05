# Veri animasyonu: "Hangi devlet kaç yıl yaşadı?" (16 sn)
import math
from fmtlib import *

DUR = 16.0
BGC = "#0E1320"; INK = "#F3F4F7"; MUTED = "#9AA3B5"; FAINT = "#2A3247"; BAR = "#F28C28"; BAR2 = "#FFB066"
DATA = [("Bizans (Doğu Roma)", 395, 1453), ("Osmanlı", 1299, 1922), ("Abbasi", 750, 1258), ("Roma (Batı)", -27, 476),
        ("Memlük", 1250, 1517), ("Safevi", 1501, 1736), ("Anadolu Selçuklu", 1077, 1308), ("Göktürk", 552, 744)]
MAXY = 1100
X0, X1 = 600, 1760
def yr(y): return f"MÖ {-y}" if y < 0 else str(y)
def life(a, b): return b - a - (1 if a < 0 < b else 0)  # sıfır yılı yok
def years_at(t): return 1058 * eio(prog(t, 1.6, 11.6))

def draw(c, t):
    c.clear(col(BGC))
    p = skia.Paint(); p.setShader(skia.GradientShader.MakeRadial(skia.Point(W * .7, H * .2), 1300, [col("#1A2238").toColor(), col(BGC).toColor()]))
    c.drawRect(skia.Rect.MakeWH(W, H), p)
    a = eout(prog(t, .1, .7))
    text(c, "Hangi devlet kaç yıl yaşadı?", 110, 128, F_BLACK, 66, INK, a)
    text(c, "Kuruluştan yıkılışa, yaygın kabul gören tarihlere göre", 112, 182, F_MED, 30, MUTED, a)
    Y = years_at(t)
    # sayaç
    ca = eout(prog(t, 1.2, 1.8))
    text(c, f"{int(Y):,}".replace(",", "."), 1800, 132, F_BLACK, 84, BAR2, ca, align="right")
    text(c, "yıl geçti", 1800, 178, F_MED, 28, MUTED, ca, align="right")
    # ızgara
    ga = eout(prog(t, .6, 1.4))
    top, rh = 250, 88
    for v in range(0, 1001, 250):
        x = X0 + (X1 - X0) * v / MAXY
        c.drawLine(x, top - 20, x, top + rh * len(DATA) - 10, paint(FAINT, ga, 2, cap=False))
        text(c, str(v), x, top + rh * len(DATA) + 26, F_MED, 24, MUTED, ga, align="center")
    for k, (name, a_, b_) in enumerate(DATA):
        L = life(a_, b_); y = top + k * rh
        ra = eout(prog(t, .7 + k * .08, 1.2 + k * .08))
        if ra <= 0: continue
        text(c, name, X0 - 28, y + 38, F_SEMI, 34, INK, ra, align="right")
        done = Y >= L - .5
        if done:
            text(c, f"{yr(a_)}–{yr(b_)}", X0 - 28, y + 68, F_MED, 22, MUTED, eout(prog(t, 1.6 + (L / 1058) * 10, 2.0 + (L / 1058) * 10)), align="right")
        cur = min(Y, L); w = (X1 - X0) * cur / MAXY
        if w > 1:
            rr = skia.RRect.MakeRectXY(skia.Rect.MakeXYWH(X0, y + 8, w, 48), 6, 6)
            c.drawRRect(rr, paint(BAR if done else BAR2, ra))
            c.drawRect(skia.Rect.MakeXYWH(X0, y + 8, min(w, 6), 48), paint(BAR, ra))   # taban düz
        # bitiş anı: parlama + etiket
        tf = 1.6 + 10 * (1 - (1 - L / 1058))  # yaklaşık; asıl bitişi sayaçtan bul
        if done:
            # bitiş zamanını ikili aramayla bul
            lo, hi = 1.6, 11.6
            for _ in range(20):
                m = (lo + hi) / 2
                if years_at(m) >= L - .5: hi = m
                else: lo = m
            fin = hi; u = prog(t, fin, fin + .5)
            if u < 1:
                g = paint("#FFFFFF", .5 * (1 - u)); g.setMaskFilter(skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, 14))
                c.drawCircle(X0 + w, y + 32, 24 + 30 * u, g)
            lbl = f"{L:,} yıl".replace(",", ".")
            s = back(prog(t, fin, fin + .35))
            c.save(); c.translate(X0 + w + 18, y + 44); c.scale(s, s)
            text(c, lbl, 0, 0, F_BOLD, 34, INK)
            c.restore()
    na = eout(prog(t, 12.4, 13.0))
    if na > 0:
        text(c, "Not: Başlangıç ve bitiş yılları kaynağa göre değişebilir.", 112, 1040, F_MED, 24, MUTED, na)

if __name__ == "__main__":
    main(f"{D}/out/veri.mp4", DUR, draw)
