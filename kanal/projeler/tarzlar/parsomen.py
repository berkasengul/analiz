# Eski parşömen (portolan) harita tarzı: Barbaros ve Preveze 1538
import json, math
from fmtlib import *

DATA = "/tmp/claude-0/-home-user-analiz/15f5e81a-2f5a-535e-8b53-dec004b93200/scratchpad/ist/data"
F_FELL = skia.Typeface.MakeFromFile(f"{D}/fonts/IMFeENrm28P.ttf")
F_FELLI = skia.Typeface.MakeFromFile(f"{D}/fonts/IMFeENit28P.ttf")
F_CIN = skia.Typeface.MakeFromFile(f"{D}/fonts/Cinzel.ttf")
INK = "#3A2716"; RED = "#9E2B1E"; GOLD = "#B8862E"; GREEN = "#4F6B3A"
LON0, LON1, LAT0, LAT1 = -2.0, 42.0, 29.5, 47.5
KX = math.cos(math.radians(38))
SC = 1720 / ((LON1 - LON0) * KX)
OX = (W - (LON1 - LON0) * KX * SC) / 2; OY = (H - (LAT1 - LAT0) * SC) / 2 + 30
def P(lon, lat): return OX + (lon - LON0) * KX * SC, OY + (LAT1 - lat) * SC

_land = None
def land_path():
    global _land
    if _land is None:
        g = json.load(open(f"{DATA}/ne_50m_land.geojson")); _land = skia.Path()
        for f in g["features"]:
            geo = f["geometry"]; polys = geo["coordinates"] if geo["type"] == "MultiPolygon" else [geo["coordinates"]]
            for poly in polys:
                for ring in poly:
                    if not any(LON0 - 8 < x < LON1 + 8 and LAT0 - 8 < y < LAT1 + 8 for x, y in ring): continue
                    for k, (x, y) in enumerate(ring):
                        (_land.moveTo if k == 0 else _land.lineTo)(*P(min(80, max(-40, x)), min(75, max(0, y))))
                    _land.close()
    return _land

_bg = None
def parchment():
    global _bg
    if _bg is not None: return _bg
    rng = np.random.default_rng(5)
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    base = np.array([233, 212, 168], np.float32)[None, None, :] * np.ones((H, W, 1), np.float32)
    n = np.array(Image.fromarray((rng.normal(128, 40, (H // 4, W // 4))).clip(0, 255).astype(np.uint8)).resize((W, H), Image.BICUBIC)).astype(np.float32) - 128
    base += n[..., None] * .12
    for _ in range(14):                                  # lekeler
        cx, cy, r = rng.uniform(0, W), rng.uniform(0, H), rng.uniform(80, 340)
        d = np.exp(-(((xx - cx) ** 2 + (yy - cy) ** 2) / (2 * r * r)))
        base -= d[..., None] * np.array([18, 26, 40], np.float32) * rng.uniform(.3, 1)
    e = np.minimum.reduce([xx, yy, W - 1 - xx, H - 1 - yy]) / 140.0
    burn = np.clip(1 - e, 0, 1) ** 1.6
    base = base * (1 - burn[..., None] * .62) + np.array([70, 40, 15], np.float32) * burn[..., None] * .35
    img = base.clip(0, 255).astype(np.uint8)
    _bg = skia.Image.fromarray(np.dstack([img, np.full((H, W), 255, np.uint8)]), colorType=skia.ColorType.kRGBA_8888_ColorType)
    return _bg

def rose(c, x, y, r, rot=0):
    c.save(); c.translate(x, y); c.rotate(rot)
    c.drawCircle(0, 0, r * 1.08, paint(INK, 1, 3)); c.drawCircle(0, 0, r * .98, paint(INK, 1, 1.5))
    for k in range(32):
        a = math.radians(k * 11.25); c.drawLine(math.sin(a) * r * .98, -math.cos(a) * r * .98, math.sin(a) * r * (1.08 if k % 2 else 1.0), -math.cos(a) * r * (1.08 if k % 2 else 1.0), paint(INK, 1, 1.5))
    for k, (L, wd, ca, cb) in enumerate([(.62, .09, GREEN, "#7E9A62"), (.8, .12, RED, "#C9574A"), (1.0, .16, INK, GOLD)]):
        n = 8 if k == 0 else 8 if k == 1 else 4
        off = 22.5 if k == 0 else 45 if k == 1 else 0
        if k == 1: off = 45
        for j in range(n if k != 1 else 4):
            a = math.radians(off + j * (360 / (n if k != 1 else 4)))
            tip = (math.sin(a) * r * L, -math.cos(a) * r * L)
            side = (math.sin(a + math.pi / 2) * r * wd, -math.cos(a + math.pi / 2) * r * wd)
            p1 = skia.Path(); p1.moveTo(0, 0); p1.lineTo(*tip); p1.lineTo(*side); p1.close()
            p2 = skia.Path(); p2.moveTo(0, 0); p2.lineTo(*tip); p2.lineTo(-side[0], -side[1]); p2.close()
            c.drawPath(p1, paint(ca)); c.drawPath(p2, paint(cb)); c.drawPath(p1, paint(INK, 1, 1.5)); c.drawPath(p2, paint(INK, 1, 1.5))
    c.drawCircle(0, 0, r * .07, paint(GOLD)); c.drawCircle(0, 0, r * .07, paint(INK, 1, 2))
    for s_, a in (("K", 0), ("D", 90), ("G", 180), ("B", 270)):
        aa = math.radians(a); text(c, s_, math.sin(aa) * r * 1.26, -math.cos(aa) * r * 1.26 + 13, F_CIN, 36, RED if s_ == "K" else INK, align="center")
    c.restore()

def castle(c, x, y, s=1., color=RED):
    p = svgp("M -14 0 L -14 -18 L -18 -18 L -18 -26 L -12 -26 L -12 -22 L -6 -22 L -6 -26 L 0 -26 L 0 -34 L -4 -34 L -4 -40 L 2 -40 L 2 -36 L 6 -36 L 6 -40 L 12 -40 L 12 -34 L 8 -34 L 8 -26 L 18 -26 L 18 -18 L 14 -18 L 14 0 Z", x, y, s)
    c.drawPath(p, paint(color)); c.drawPath(p, paint(INK, 1, 1.6))
    c.drawPath(svgp("M -3 0 L -3 -8 C -3 -12 3 -12 3 -8 L 3 0 Z", x, y, s), paint(INK))

def ship(c, x, y, s=1., flip=False, flag=RED):
    T = lambda d: svgp(d, x, y, s, flip)
    c.drawPath(T("M -40 0 C -30 14 30 14 44 -2 L 30 -4 L -32 -4 Z"), paint("#8A5A2B")); c.drawPath(T("M -40 0 C -30 14 30 14 44 -2 L 30 -4 L -32 -4 Z"), paint(INK, 1, 2))
    c.drawPath(T("M -4 -4 L -4 -62"), paint(INK, 1, 2.5)); c.drawPath(T("M 18 -4 L 18 -44"), paint(INK, 1, 2))
    for d in ("M -4 -58 C 16 -50 16 -24 -4 -14 Z", "M 18 -40 C 32 -34 32 -18 18 -12 Z"):
        c.drawPath(T(d), paint("#F3E6C6")); c.drawPath(T(d), paint(INK, 1, 1.8))
    c.drawPath(T("M -4 -62 L 12 -66 L -4 -70 Z"), paint(flag))
    for k in range(6):
        bx, by = (x + (-28 + k * 11) * s * (-1 if flip else 1), y + 5 * s)
        c.drawLine(bx, by, bx - 6 * s * (-1 if flip else 1), by + 12 * s, paint(INK, 1, 1.4))

def mountains(c, pts):
    for lon, lat, s in pts:
        x, y = P(lon, lat)
        p = svgp("M -16 0 L 0 -20 L 16 0", x, y, s); c.drawPath(p, paint(INK, .8, 2))
        sh = svgp("M 0 -20 L 16 0 L 4 0 Z", x, y, s); c.drawPath(sh, paint(INK, .25))

def label(c, s, lon, lat, size, tf=None, color=INK, sp=0, align="center"):
    x, y = P(lon, lat)
    if sp:
        f = font(tf or F_FELLI, size); tot = sum(f.measureText(ch) for ch in s) + sp * (len(s) - 1)
        xx = x - tot / 2
        for ch in s: c.drawString(ch, xx, y, f, paint(color)); xx += f.measureText(ch) + sp
    else: text(c, s, x, y, tf or F_FELLI, size, color, align=align)

CITIES = [("Cezayir", 3.05, 36.75, -1), ("Tunus", 10.18, 36.80, -1), ("Venedik", 12.33, 45.44, 1), ("Preveze", 20.75, 38.96, 1),
          ("Rodos", 28.22, 36.43, 1), ("İstanbul", 28.97, 41.01, 1), ("İskenderiye", 29.92, 31.20, 1), ("Messina", 15.55, 38.19, 1)]
ROUTE = [(3.05, 36.95), (6.5, 37.6), (10.18, 37.05), (13.0, 36.8), (16.8, 37.4), (19.4, 38.4), (20.6, 38.9), (22.0, 37.3), (24.5, 36.4), (26.2, 37.8), (26.4, 40.1), (28.9, 40.9)]

def draw(c, t):
    c.drawImage(parchment(), 0, 0)
    lp = land_path()
    # rüzgâr gülü çizgileri
    sea = skia.Path(lp); sea.setFillType(skia.PathFillType.kInverseWinding)
    c.save(); c.clipPath(sea, doAntiAlias=True)
    c.drawRect(skia.Rect.MakeWH(W, H), paint("#8FA9A0", .30))
    for (lon, lat) in ((17.5, 33.6), (33.8, 34.2)):
        x, y = P(lon, lat)
        for k in range(32):
            a = math.radians(k * 11.25); colr = [INK, RED, GREEN][(0 if k % 4 == 0 else 1 if k % 2 == 0 else 2)]
            c.drawLine(x, y, x + math.sin(a) * 2600, y - math.cos(a) * 2600, paint(colr, .28, 1.3))
    c.restore()
    # kara
    c.drawPath(lp, paint("#F4E4BF", .45))
    c.save(); c.clipPath(sea, doAntiAlias=True)
    for w_, a_ in ((26, .07), (15, .1), (7, .16)): c.drawPath(lp, paint("#5C7A86", a_, w_))
    c.restore()
    c.drawPath(lp, paint(INK, 1, 2.2))
    mountains(c, [(31, 37.4, 1.2), (33, 37.1, 1.3), (35, 37.5, 1.2), (36.5, 38.6, 1.1), (34, 39.6, 1.0), (38.6, 39.2, 1.2), (40, 40.2, 1.1), (22.5, 41.8, 1.0), (24.5, 42.2, 1.1),
                  (20.4, 41.1, 1.0), (13.6, 42.3, 1.0), (15.8, 40.6, .9), (8, 45.8, 1.3), (10.5, 46.3, 1.3), (5, 34.4, 1.0), (1.5, 34.9, 1.1), (36.3, 34.2, 1.0)])
    # deniz adları
    label(c, "AKDENİZ", 26.5, 34.3, 60, F_FELLI, INK, sp=26); label(c, "(Bahr-i Sefîd)", 26.5, 33.5, 32, F_FELLI, "#5A4630")
    label(c, "KARADENİZ", 34.6, 43.2, 44, F_FELLI, INK, sp=14); label(c, "ADRİYATİK", 16.0, 42.7, 26, F_FELLI, INK, sp=6)
    label(c, "ANADOLU", 33.2, 38.6, 38, F_CIN, "#5A4630", sp=10); label(c, "RUMELİ", 23.5, 41.4, 30, F_CIN, "#5A4630", sp=8)
    label(c, "AFRİKA", 24.0, 30.6, 34, F_CIN, "#5A4630", sp=10)
    # rota (kesik mürekkep) + ilerleme
    rp = skia.Path(); rp.moveTo(*P(*ROUTE[0]))
    for i in range(1, len(ROUTE)):
        a, b = P(*ROUTE[i - 1]), P(*ROUTE[i]); m = ((a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + 6)
        rp.quadTo(m[0], m[1], *b)
    u = .78
    tp = trimmed(rp, u); pk = paint(RED, 1, 4.5); pk.setPathEffect(skia.DashPathEffect.Make([16, 10], 0))
    c.drawPath(tp, pk)
    e = path_end(rp, u)
    # şehirler
    for name, lon, lat, side in CITIES:
        x, y = P(lon, lat); castle(c, x, y + 4, .9)
        text(c, name, x + side * 26, y + 2, F_FELLI, 32, INK, align="left" if side > 0 else "right")
    # Preveze savaşı
    px, py = P(20.2, 38.6)
    for sgn in (-1, 1): c.drawLine(px - 26, py - 26 * sgn, px + 26, py + 26 * sgn, paint(RED, 1, 6))
    text(c, "1538", px - 40, py + 52, F_FELL, 30, RED)
    ship(c, *P(13.2, 36.2), 1.0, False, RED); ship(c, *P(21.8, 37.0), .8, True, "#1F4E8C"); ship(c, *P(6.2, 38.4), .8, False, RED)
    ship(c, e[0], e[1] - 6, 1.15, False, RED)
    rose(c, *P(17.5, 33.6), 104, 0)
    # kartuş
    cx, cy, cw, ch = 70, 840, 640, 172
    sc = svgp(f"M {cx + 20} {cy} L {cx + cw - 20} {cy} C {cx + cw} {cy} {cx + cw + 10} {cy + 20} {cx + cw - 6} {cy + 30} L {cx + cw - 6} {cy + ch - 30} C {cx + cw + 10} {cy + ch - 20} {cx + cw} {cy + ch} {cx + cw - 20} {cy + ch} L {cx + 20} {cy + ch} C {cx} {cy + ch} {cx - 10} {cy + ch - 20} {cx + 6} {cy + ch - 30} L {cx + 6} {cy + 30} C {cx - 10} {cy + 20} {cx} {cy} {cx + 20} {cy} Z")
    c.drawPath(sc, paint("#F2E2BC", .92)); c.drawPath(sc, paint(INK, 1, 3))
    c.drawRect(skia.Rect.MakeXYWH(cx + 22, cy + 16, cw - 44, ch - 32), paint(GOLD, 1, 2))
    text(c, "Barbaros'un Akdeniz'i", cx + cw / 2, cy + 82, F_FELLI, 58, INK, align="center")
    text(c, "PREVEZE DENİZ SAVAŞI · 1538", cx + cw / 2, cy + 134, F_CIN, 28, RED, align="center")
    # ölçek
    bx, by = 1380, 1000
    for k in range(5): c.drawRect(skia.Rect.MakeXYWH(bx + k * 70, by, 70, 12), paint(INK if k % 2 == 0 else "#F2E2BC"));
    c.drawRect(skia.Rect.MakeXYWH(bx, by, 350, 12), paint(INK, 1, 2)); text(c, "Mil", bx + 175, by - 12, F_FELLI, 28, INK, align="center")

if __name__ == "__main__":
    main(f"{D}/out/parsomen.mp4", 15.0, draw)
