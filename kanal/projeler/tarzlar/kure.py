# Dönen 3D dünya küresi: İpek Yolu (gerçek gölgeli kabartma dokusu, Natural Earth)
import math
from fmtlib import *

Image.MAX_IMAGE_PIXELS = None
TEX = np.array(Image.open(f"{D}/world_5400.jpg").convert("RGB")).astype(np.float32)
TH, TW = TEX.shape[:2]
# renk ayarı: denizi koyulaştır, karayı canlandır
_g = TEX / 255.
water = (_g[..., 2] > _g[..., 0] + .04) & (_g[..., 2] > .55)
_g[water] = _g[water] * np.array([.32, .48, .72]) + np.array([.0, .03, .08])
_g[~water] = np.clip((_g[~water] - .5) * 1.15 + .5, 0, 1) ** 1.1
TEX = (_g * 255).astype(np.uint8)
F_PLAY = skia.Typeface.MakeFromFile(f"{D}/fonts/PlayfairDisplay.ttf")
F_PLAYI = skia.Typeface.MakeFromFile(f"{D}/fonts/PlayfairDisplay-Italic.ttf")
CX, CY, R = 1230, 760, 820
GOLD = "#F5C451"

def rot(t): return 70 + 4 * math.sin(t * .25), 33 + 1.5 * math.sin(t * .2)
def project(lon, lat, l0, p0):
    la, ph, l0r, p0r = map(math.radians, (lon, lat, l0, p0))
    cosc = math.sin(p0r) * math.sin(ph) + math.cos(p0r) * math.cos(ph) * math.cos(la - l0r)
    x = R * math.cos(ph) * math.sin(la - l0r)
    y = R * (math.cos(p0r) * math.sin(ph) - math.sin(p0r) * math.cos(ph) * math.cos(la - l0r))
    return CX + x, CY - y, cosc

_yy, _xx = np.mgrid[-R:R + 1, -R:R + 1].astype(np.float32)
_rho = np.sqrt(_xx ** 2 + _yy ** 2); _in = _rho <= R
def globe_img(l0, p0):
    x = _xx / R; y = -_yy / R; rho = np.clip(_rho / R, 1e-6, 1)
    c_ = np.arcsin(np.clip(rho, 0, 1)); sc, cc = np.sin(c_), np.cos(c_)
    p0r, l0r = math.radians(p0), math.radians(l0)
    lat = np.arcsin(np.clip(cc * math.sin(p0r) + y * sc * math.cos(p0r) / rho, -1, 1))
    lon = l0r + np.arctan2(x * sc, rho * math.cos(p0r) * cc - y * math.sin(p0r) * sc)
    u = ((np.degrees(lon) + 180) % 360) / 360 * (TW - 1); v = (90 - np.degrees(lat)) / 180 * (TH - 1)
    col_ = TEX[v.astype(np.int32).clip(0, TH - 1), u.astype(np.int32).clip(0, TW - 1)].astype(np.float32)
    nz = np.sqrt(np.clip(1 - x * x - y * y, 0, 1))
    L = np.array([-.55, .45, .70]); L /= np.linalg.norm(L)
    lam = np.clip(x * L[0] + y * L[1] + nz * L[2], 0, 1)
    shade = .10 + .95 * lam ** .9
    col_ *= shade[..., None]
    fres = (1 - nz) ** 3
    col_ += fres[..., None] * np.array([70, 140, 255]) * .55
    spec = np.clip(x * L[0] + y * L[1] + nz * L[2], 0, 1) ** 40
    col_ += spec[..., None] * 60
    a = np.clip(R - _rho + .5, 0, 1) * 255
    rgba = np.dstack([col_.clip(0, 255).astype(np.uint8), a.astype(np.uint8)])
    return skia.Image.fromarray(np.ascontiguousarray(rgba), colorType=skia.ColorType.kRGBA_8888_ColorType, alphaType=skia.AlphaType.kUnpremul_AlphaType)

rng = np.random.default_rng(11)
STARS = [(rng.uniform(0, W), rng.uniform(0, H), rng.uniform(.4, 1.6), rng.uniform(.2, 1)) for _ in range(520)]
CITIES = [("Çang'an", 108.9, 34.3), ("Dunhuang", 94.7, 40.1), ("Kaşgar", 75.99, 39.47), ("Semerkant", 66.97, 39.65),           ("Merv", 61.83, 37.66), ("Bağdat", 44.36, 33.31), ("Halep", 37.16, 36.20), ("Konstantinopolis", 28.97, 41.01)]
ROUTE = [(108.9, 34.3), (103.8, 36.1), (94.7, 40.1), (89.2, 42.9), (82.9, 41.7), (75.99, 39.47), (71.5, 40.4), (66.97, 39.65), (64.42, 39.77),
         (61.83, 37.66), (54.4, 36.6), (51.4, 35.7), (44.36, 33.31), (40.1, 34.9), (37.16, 36.20), (32.9, 39.9), (28.97, 41.01)]

def gc(a, b, n=24):
    (l1, p1), (l2, p2) = [(math.radians(x), math.radians(y)) for x, y in (a, b)]
    v1 = np.array([math.cos(p1) * math.cos(l1), math.cos(p1) * math.sin(l1), math.sin(p1)])
    v2 = np.array([math.cos(p2) * math.cos(l2), math.cos(p2) * math.sin(l2), math.sin(p2)])
    out = []
    for k in range(n + 1):
        v = v1 * (1 - k / n) + v2 * (k / n); v /= np.linalg.norm(v)
        out.append((math.degrees(math.atan2(v[1], v[0])), math.degrees(math.asin(v[2]))))
    return out

def draw(c, t):
    p = skia.Paint(); p.setShader(skia.GradientShader.MakeRadial(skia.Point(CX, CY), 1300, [col("#0B1630").toColor(), col("#03050C").toColor()]))
    c.drawRect(skia.Rect.MakeWH(W, H), p)
    for x, y, r, a in STARS:
        tw_ = .6 + .4 * math.sin(t * 2 + x)
        c.drawCircle(x, y, r, paint("#FFFFFF", a * tw_))
    # atmosfer parıltısı
    g = skia.Paint(AntiAlias=True); g.setColor4f(col("#4AA3FF", .55)); g.setMaskFilter(skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, 38))
    c.drawCircle(CX, CY, R + 6, g)
    l0, p0 = rot(t)
    c.drawImage(globe_img(l0, p0), CX - R, CY - R)
    # rota
    pts = []
    for i in range(1, len(ROUTE)): pts += gc(ROUTE[i - 1], ROUTE[i])[(1 if i > 1 else 0):]
    path = skia.Path(); first = True
    for lon, lat in pts:
        x, y, cc = project(lon, lat, l0, p0)
        if cc < .05: first = True; continue
        (path.moveTo if first else path.lineTo)(x, y); first = False
    u = clamp(.35 + t / 10)
    tp = trimmed(path, u)
    if tp is not None:
        gl = paint(GOLD, .7, 22); gl.setMaskFilter(skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, 10)); c.drawPath(tp, gl)
        c.drawPath(tp, paint("#FFE7A3", 1, 6))
        e = path_end(path, u)
        if e:
            h = paint("#FFFFFF", .9); h.setMaskFilter(skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, 12)); c.drawCircle(*e, 20, h); c.drawCircle(*e, 7, paint("#FFFFFF"))
        for k in range(6):                            # ışık darbeleri
            q = (t * .12 + k / 6) % 1
            if q < u:
                pe = path_end(path, q)
                if pe: c.drawCircle(*pe, 4, paint("#FFF4CF", .9))
    for name, lon, lat in CITIES:
        x, y, cc = project(lon, lat, l0, p0)
        if cc < .15: continue
        a = clamp((cc - .15) * 3)
        c.drawCircle(x, y, 9, paint(GOLD, a)); c.drawCircle(x, y, 9, paint("#2A1A05", a, 2.5))
        sh = paint("#000000", .7 * a); sh.setMaskFilter(skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, 4))
        f = font(F_SEMI, 26); w_ = f.measureText(name)
        tx = x + 16; ty = y - 12
        if name in ("Bağdat", "Merv", "Kaşgar"): ty = y + 36
        c.drawString(name, tx + 1, ty + 2, f, sh); c.drawString(name, tx, ty, f, paint("#FFFFFF", a))
    sh2 = skia.Paint(); sh2.setShader(skia.GradientShader.MakeLinear([skia.Point(0, 0), skia.Point(900, 0)], [col('#03050C', .92).toColor(), col('#03050C', 0).toColor()])); c.drawRect(skia.Rect.MakeWH(900, H), sh2)
    # başlık
    text(c, "İpek Yolu", 90, 230, F_PLAY, 120, "#FFFFFF")
    text(c, "Doğu ile Batı'yı bağlayan ticaret ağı", 96, 290, F_PLAYI, 40, "#C9D6EE")
    c.drawRect(skia.Rect.MakeXYWH(96, 320, 120, 4), paint(GOLD))
    for k, (a_, b_) in enumerate([("ipek, baharat, kâğıt", "doğudan batıya"), ("cam, gümüş, at", "batıdan doğuya")]):
        y = 410 + k * 92
        c.drawCircle(108, y - 10, 8, paint(GOLD)); text(c, a_, 132, y, F_SEMI, 32, "#FFFFFF"); text(c, b_, 132, y + 36, F_MED, 26, "#8FA2C4")

if __name__ == "__main__":
    main(f"{D}/out/kure.mp4", 15.0, draw)
