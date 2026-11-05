# Sinematik harita katmanı: gerçek arazi atlasları + eğik kamera + atmosfer + ışıldayan öğeler
import math, os
from harita import *            # TERR, ROUTES, CITY, VIEWS, KX, W2, LAND_P, tr_up, akis_core
from PIL import Image as PImage
PImage.MAX_IMAGE_PIXELS = None
from arazi import ATLAS

# ---------- atlaslar (kenarları yumuşatılmış) ----------
_ATL = []
def atlases():
    if _ATL: return _ATL
    for nm, a0, a1, b0, b1, ppd, z, mk in ATLAS:
        p = f"{DATA}/atlas_{nm}.jpg"
        if not os.path.exists(p): continue
        im = np.asarray(PImage.open(p).convert("RGB"))
        h, w = im.shape[:2]
        f = max(8, int(min(w, h) * .04))
        ax = np.minimum(np.minimum(np.arange(w), np.arange(w)[::-1]) / f, 1)
        ay = np.minimum(np.minimum(np.arange(h), np.arange(h)[::-1]) / f, 1)
        al = (np.outer(ay, ax) * 255).astype(np.uint8) if nm != "dunya" else np.full((h, w), 255, np.uint8)
        rgba = np.dstack([im, al])
        img = skia.Image.fromarray(np.ascontiguousarray(rgba), colorType=skia.kRGBA_8888_ColorType).withDefaultMipmaps()
        _ATL.append((nm, a0, a1, b0, b1, ppd, img))
    return _ATL
MIP = skia.SamplingOptions(skia.FilterMode.kLinear, skia.MipmapMode.kLinear)

# ---------- eğik kamera ----------
def tilt_matrix(tl):
    """Düz ekran → eğik ekran. tl=0 düz, 1 tam eğik (ufuk üstte)."""
    m = skia.Matrix()
    if tl <= 1e-3: return m, 0.0
    top = .62 * H * tl; px = .34 * W * tl
    src = [skia.Point(-px, -top), skia.Point(W + px, -top), skia.Point(W + px, H), skia.Point(-px, H)]
    ty = 70 * tl; sq = 1 - .5 * tl
    dst = [skia.Point(W / 2 - (W / 2 + px) * sq, ty), skia.Point(W / 2 + (W / 2 + px) * sq, ty), skia.Point(W + px * .12, H), skia.Point(-px * .12, H)]
    m.setPolyToPoly(src, dst)
    return m, top

def world_rect_of_flat(cam, top):
    z = cam[2]; px = .34 * W * (top / (.62 * H)) if top else 0
    x0 = cam[0] + (-px - W / 2) / z; x1 = cam[0] + (W + px - W / 2) / z
    y0 = cam[1] + (-top - H / 2) / z; y1 = cam[1] + (H / 2) / z
    return x0, x1, y0, y1

class Proj:
    """dünya (lon,lat) → son ekran"""
    def __init__(self, cam, tl):
        self.cam = cam; self.M, self.top = tilt_matrix(tl); self.tl = tl
    def flat(self, lon, lat):
        x, y = W2(lon, lat); return W / 2 + (x - self.cam[0]) * self.cam[2], H / 2 + (y - self.cam[1]) * self.cam[2]
    def __call__(self, lon, lat):
        fx_, fy_ = self.flat(lon, lat); p = self.M.mapXY(fx_, fy_); return p.x(), p.y()
    def scale_at(self, lon, lat):
        fx_, fy_ = self.flat(lon, lat); a = self.M.mapXY(fx_, fy_); b = self.M.mapXY(fx_ + 10, fy_)
        return math.hypot(b.x() - a.x(), b.y() - a.y()) / 10

# ---------- bulut gölgeleri ----------
_CL = None
def clouds_img():
    global _CL
    if _CL is None:
        from scipy.ndimage import gaussian_filter
        rng = np.random.default_rng(11); n = 512
        a = gaussian_filter(rng.normal(0, 1, (n, n)), 22, mode="wrap") * 3 + gaussian_filter(rng.normal(0, 1, (n, n)), 7, mode="wrap")
        a = np.clip((a - .15) * 1.6, 0, 1)
        arr = np.zeros((n, n, 4), np.uint8); arr[..., 3] = (a * 90).astype(np.uint8)
        _CL = skia.Image.fromarray(arr, colorType=skia.kRGBA_8888_ColorType)
    return _CL

# ---------- taban ----------
def draw_world(c, cam, t, tl=0.0, overlay=None):
    """Arazi + bulut gölgesi + (dünya uzayında) overlay(c, cam, t) — hepsi eğik kamerayla."""
    pr = Proj(cam, tl)
    c.clear(C("#0B1220"))
    if tl > 0:   # gökyüzü
        p = skia.Paint(); p.setShader(skia.GradientShader.MakeLinear([skia.Point(0, 0), skia.Point(0, 260)], [C("#0E1A2E").toColor(), C("#2B3A50").toColor()]))
        c.drawRect(skia.Rect.MakeWH(W, 260), p)
    c.save(); c.concat(pr.M)
    z = cam[2]
    c.save(); c.translate(W / 2, H / 2); c.scale(z, z); c.translate(-cam[0], -cam[1])
    vx0, vx1, vy0, vy1 = world_rect_of_flat(cam, pr.top)
    span_lon = (vx1 - vx0) / KX
    need_ppd = W / max(1e-6, span_lon)
    for nm, a0, a1, b0, b1, ppd, img in atlases():
        rx0, ry0 = W2(a0, b1); rx1, ry1 = W2(a1, b0)
        if rx1 < vx0 or rx0 > vx1 or ry1 < vy0 or ry0 > vy1: continue
        if nm != "dunya" and ppd > need_ppd * 6: pass
        if nm != "dunya" and ppd < need_ppd * .25 and False: continue
        pp = skia.Paint(AntiAlias=True)
        c.drawImageRect(img, skia.Rect.MakeLTRB(rx0, ry0, rx1, ry1), MIP, pp)
    # bulut gölgeleri (dünya uzayında kayar)
    cl = clouds_img(); sc = 18.0 / max(z, 1e-3) * 2.2
    m = skia.Matrix(); m.setScale(sc, sc); m.postTranslate(t * .9 / max(z, 1e-3) * 6, t * .35 / max(z, 1e-3) * 6)
    cp = skia.Paint(); cp.setShader(cl.makeShader(skia.TileMode.kRepeat, skia.TileMode.kRepeat, SAMP, m)); cp.setBlendMode(skia.BlendMode.kMultiply)
    c.drawRect(skia.Rect.MakeLTRB(vx0, vy0, vx1, vy1), cp)
    c.restore()
    if overlay: overlay(c, cam, t, pr)
    c.restore()
    # ufuk pusu
    if tl > 0:
        p = skia.Paint(); p.setShader(skia.GradientShader.MakeLinear([skia.Point(0, 40 * tl), skia.Point(0, 70 * tl + 360 * tl)],
                                     [C("#9FB4C8", .95).toColor(), C("#9FB4C8", .35).toColor(), C("#9FB4C8", 0).toColor()], [0, .35, 1]))
        c.drawRect(skia.Rect.MakeWH(W, 70 * tl + 360 * tl), p)
    return pr

def grade(c):
    # sıcak ton + vinyet
    p = skia.Paint(); p.setColor(C("#FFB46A", .07).toColor()); p.setBlendMode(skia.BlendMode.kSoftLight); c.drawRect(skia.Rect.MakeWH(W, H), p)
    p = skia.Paint(); p.setShader(skia.GradientShader.MakeRadial(skia.Point(W / 2, H * .55), W * .72, [C("#000000", 0).toColor(), C("#000000", .55).toColor()], [.55, 1]))
    c.drawRect(skia.Rect.MakeWH(W, H), p)

# ---------- ışıldayan öğeler (dünya uzayında, kamera matrisi altında çizilir) ----------
_TPC = {}
def _tpath(key):
    if key not in _TPC: _TPC[key] = terr_path(key)
    return _TPC[key]
GLOW = {"gokturk": "#5EA8FF", "uygur": "#3FD3B2", "karahanli": "#C08BFF", "gazneli": "#B7D96A", "selcuklu": "#FF8A3D", "bizans": "#E0679F",
        "abbasi": "#5FD08A", "anadolu": "#FF5A4A", "dan": "#FFD25A", "salt": "#5AC8FF", "meng": "#B58CFF", "artuk": "#FF7A5A", "caka": "#4FE0E0",
        "osmanli": "#FF5A4A", "bizans_s": "#E0679F"}
def terr_world(c, cam, key, a, grow, t):
    if a <= 0: return
    col = GLOW.get(key.rstrip("0123456789"), "#FF8A3D"); z = cam[2]
    name, pts, lab = TERR[key]; cx, cy = W2(*lab)
    pth = _tpath(key)
    c.save(); c.translate(W / 2, H / 2); c.scale(z, z); c.translate(-cam[0], -cam[1])
    if grow < 1:
        b = pth.getBounds(); R = math.hypot(max(b.right() - cx, cx - b.left()), max(b.bottom() - cy, cy - b.top())) * 1.05
        cp = skia.Path(); cp.addCircle(cx, cy, max(1e-4, R * eout(grow))); c.clipPath(cp, doAntiAlias=True)
    if not key.startswith("sehir"): c.clipPath(LAND_P, doAntiAlias=True)
    c.drawPath(pth, paint(col, .16 * a if not key.startswith("sehir") else .3 * a))
    g = paint(col, .55 * a, 14 / z); g.setMaskFilter(skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, 6 / z)); c.drawPath(pth, g)
    c.drawPath(pth, paint("#FFFFFF", .8 * a, 1.6 / z))
    c.drawPath(pth, paint(col, a, 3.2 / z))
    c.restore()

def route_world(c, cam, key, p, a, t, col="#FF5A3C"):
    if p <= 0 or a <= 0: return
    z = cam[2]
    pts = [W2(*q) for q in ROUTES[key]]
    S = []; n = len(pts)
    for i in range(n - 1):
        p0 = pts[max(0, i - 1)]; p1 = pts[i]; p2 = pts[i + 1]; p3 = pts[min(n - 1, i + 2)]
        for k in range(20):
            u = k / 20; u2, u3 = u * u, u * u * u
            S.append(tuple(.5 * ((2 * p1[j]) + (-p0[j] + p2[j]) * u + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * u2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * u3) for j in (0, 1)))
    S.append(pts[-1])
    L = [0]
    for a_, b_ in zip(S, S[1:]): L.append(L[-1] + math.dist(a_, b_))
    tot = L[-1]; cut = tot * eio(clamp(p))
    pth = skia.Path(); pth.moveTo(*S[0]); end = S[0]; ang = 0
    for i in range(1, len(S)):
        if L[i] <= cut: pth.lineTo(*S[i]); end = S[i]; ang = math.atan2(S[i][1] - S[i - 1][1], S[i][0] - S[i - 1][0])
        else:
            f = (cut - L[i - 1]) / max(1e-9, L[i] - L[i - 1]); end = (lerp(S[i - 1][0], S[i][0], f), lerp(S[i - 1][1], S[i][1], f))
            pth.lineTo(*end); ang = math.atan2(S[i][1] - S[i - 1][1], S[i][0] - S[i - 1][0]); break
    c.save(); c.translate(W / 2, H / 2); c.scale(z, z); c.translate(-cam[0], -cam[1])
    wd = 7 / z
    g = paint(col, .6 * a, wd * 3.2); g.setMaskFilter(skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, 7 / z)); c.drawPath(pth, g)
    c.drawPath(pth, paint("#2A0A04", .45 * a, wd * 1.5))
    c.drawPath(pth, paint(col, a, wd))
    # akan ışık atımları
    pl = paint("#FFE7C2", .95 * a, wd * .7); pl.setPathEffect(skia.DashPathEffect.Make([wd * 2.5, wd * 9], -(t * 60 / z) % (wd * 11.5))); c.drawPath(pth, pl)
    s = wd * 3.4
    c.save(); c.translate(*end); c.rotate(math.degrees(ang))
    hd = skia.Path(); hd.moveTo(s, 0); hd.lineTo(-s * .8, -s * .8); hd.lineTo(-s * .35, 0); hd.lineTo(-s * .8, s * .8); hd.close()
    gg = paint(col, .7 * a); gg.setMaskFilter(skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, 5 / z)); c.drawPath(hd, gg)
    c.drawPath(hd, paint(col, a)); c.drawPath(hd, paint("#FFFFFF", .8 * a, 1.2 / z))
    c.restore(); c.restore()

def polyline_world(c, cam, pts, a, col, wd_px, glow=True, dash=None, p=1.0):
    if a <= 0 or p <= 0: return
    z = cam[2]; P = [W2(*q) for q in pts]
    L = [0]
    for a_, b_ in zip(P, P[1:]): L.append(L[-1] + math.dist(a_, b_))
    cut = L[-1] * clamp(p)
    pth = skia.Path(); pth.moveTo(*P[0])
    for i in range(1, len(P)):
        if L[i] <= cut: pth.lineTo(*P[i])
        else:
            f = (cut - L[i - 1]) / max(1e-9, L[i] - L[i - 1]); pth.lineTo(lerp(P[i - 1][0], P[i][0], f), lerp(P[i - 1][1], P[i][1], f)); break
    c.save(); c.translate(W / 2, H / 2); c.scale(z, z); c.translate(-cam[0], -cam[1])
    wd = wd_px / z
    if glow:
        g = paint(col, .55 * a, wd * 3); g.setMaskFilter(skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, 6 / z)); c.drawPath(pth, g)
    pp = paint(col, a, wd)
    if dash: pp.setPathEffect(skia.DashPathEffect.Make([dash[0] / z, dash[1] / z], 0))
    c.drawPath(pth, pp)
    c.restore()

# ---------- ekran uzayı: işaretler, etiketler, birlikler ----------
def marker(c, pr, lon, lat, name, a, t, big=False, side="r"):
    if a <= 0: return
    x, y = pr(lon, lat)
    if not (-200 < x < W + 200 and -100 < y < H + 100): return
    r = 8 if big else 6
    if big:
        q = (t * .7) % 1; c.drawCircle(x, y, r + 30 * q, paint("#FF6A4A", .55 * (1 - q) * a, 3))
    g = paint("#FF6A4A" if big else "#FFE2B0", .7 * a); g.setMaskFilter(skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, 8)); c.drawCircle(x, y, r + 6, g)
    c.drawCircle(x, y, r + 2.5, paint("#101418", a)); c.drawCircle(x, y, r, paint("#FF6A4A" if big else "#FFF3DC", a))
    size = 30 if big else 25; w = tw(name, "s", size)
    tx = x + 18 if side == "r" else (x - 18 - w if side == "l" else x - w / 2)
    ty = y + 9 if side in "rl" else (y - 24 if side == "u" else y + 46)
    rrect(c, tx - 10, ty - size * .86, w + 20, size * 1.2, 9, "#0C1118", .62 * a)
    text(c, name, tx, ty, "s", size, "#F7F1E6", a)

def label_big(c, pr, s, lon, lat, a, size=38, col="#FFFFFF"):
    if a <= 0: return
    x, y = pr(lon, lat)
    sh = paint("#000000", .6 * a); f = font("b", size)
    t_ = tr_up(s); w = f.measureText(t_) + 3 * (len(t_) - 1)
    text(c, t_, x - w / 2 + 2, y + 3, "b", size, "#000000", .6 * a, track=3)
    text(c, t_, x - w / 2, y, "b", size, col, a, track=3)

def region_label(c, pr, s, lon, lat, a, size=40):
    if a <= 0: return
    x, y = pr(lon, lat)
    text(c, s, x + 2, y + 2, "i", size, "#000000", .55 * a, align="center")
    text(c, s, x, y, "i", size, "#F5E9D2", .92 * a, align="center")

def unit(c, x, y, s, col, a, flag=True, t=0.0, k=0):
    """Ayakta duran birlik figürü (billboard): gövde blok + mızrak sırası + sancak."""
    if a <= 0: return
    w, h = 46 * s, 26 * s
    sh = paint("#000000", .35 * a); sh.setMaskFilter(skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, 5 * s))
    c.drawOval(skia.Rect.MakeXYWH(x - w * .62, y - h * .18, w * 1.24, h * .55), sh)
    rrect(c, x - w / 2, y - h, w, h, 4 * s, col, a)
    rrect(c, x - w / 2, y - h, w, h * .32, 4 * s, "#FFFFFF", .18 * a)
    for i in range(6):
        xx = x - w / 2 + (i + .5) * w / 6
        c.drawLine(xx, y - h, xx, y - h - 16 * s, paint("#2B2B2B", .8 * a, 1.6 * s))
    if flag:
        fx_ = x - w / 2 + 4 * s; c.drawLine(fx_, y - h, fx_, y - h - 34 * s, paint("#1A1A1A", a, 2 * s))
        wv = math.sin(t * 6 + k) * 3 * s
        fl = skia.Path(); fl.moveTo(fx_, y - h - 34 * s); fl.lineTo(fx_ + 20 * s, y - h - 30 * s + wv); fl.lineTo(fx_, y - h - 24 * s); fl.close()
        c.drawPath(fl, paint(col, a)); c.drawPath(fl, paint("#FFFFFF", .5 * a, 1))

def dust(c, x, y, s, a, t, seed=0):
    if a <= 0: return
    rng = np.random.default_rng(seed)
    for i in range(7):
        ph = (t * .6 + rng.random()) % 1
        dx = (rng.random() - .5) * 60 * s - ph * 30 * s; dy = -ph * 26 * s
        r = (10 + 26 * ph) * s
        g = paint("#C8B08A", .22 * (1 - ph) * a); g.setMaskFilter(skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, r * .6))
        c.drawCircle(x + dx, y + dy, r, g)

def smoke_fire(c, x, y, s, a, t, seed=0, fire=True):
    if a <= 0: return
    rng = np.random.default_rng(seed)
    for i in range(9):
        ph = (t * .35 + rng.random()) % 1
        dx = (rng.random() - .5) * 20 * s + ph * 40 * s; dy = -ph * 120 * s
        r = (10 + 36 * ph) * s
        g = paint("#3A3632", .35 * (1 - ph) * a); g.setMaskFilter(skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, r * .7))
        c.drawCircle(x + dx, y + dy, r, g)
    if fire:
        for i in range(5):
            ph = (t * 1.8 + i / 5) % 1
            g = paint("#FF9A3C" if i % 2 else "#FFD36A", .8 * (1 - ph) * a); g.setMaskFilter(skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, 6 * s))
            c.drawCircle(x + math.sin(i * 2.1 + t * 7) * 6 * s, y - ph * 30 * s, (9 - 6 * ph) * s, g)
