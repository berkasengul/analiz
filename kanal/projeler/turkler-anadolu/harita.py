# Eski harita stili çizim çekirdeği: Natural Earth kara/göl/nehir + dağlar + dönem sınırları + yollar + şehirler
import json, math, os, sys
V = os.path.dirname(os.path.abspath(__file__))
VID = os.path.join(os.path.dirname(V), "vid")
os.environ.setdefault("AKIS_ASSETS", f"{VID}/assets")
os.environ.setdefault("AKIS_KANAL", f"{VID}/karga/karga-edit")
sys.path.insert(0, VID)
import numpy as np
import skia
from akis_core import *
import akis_core as K

DATA = os.path.join(os.path.dirname(V), "ist", "data")
KX = math.cos(math.radians(40))           # eşdikdörtgen izdüşüm, 40° enlemde düzeltilmiş
BBOX = (-12, 140, 8, 66)                  # lon0, lon1, lat0, lat1

# ---------- renkler ----------
SEA = "#C9DCDB"; SEA_D = "#AFC9CA"; LAND = "#EFE5CE"; LAND_D = "#E2D3B2"; SHORE = "#9C8A66"
RIVER = "#86AEB5"; MOUNT = "#A88D63"; PAPER_INK = "#3A2E22"; RED = "#B23A2E"
EMP = {"gokturk": "#3E6FB0", "uygur": "#2E8C7A", "karahanli": "#8A5BB5", "gazneli": "#6B7B3A", "selcuklu": "#D2601A",
       "bizans": "#7A2E5E", "anadolu": "#C0392B", "abbasi": "#2F6B4F", "dan": "#B8860B", "salt": "#2E7DA6", "meng": "#6D4C9F", "artuk": "#9B3F2A", "caka": "#1F7A8C"}

def tr_up(s): return s.replace("i", "İ").replace("ı", "I").upper()
def W2(lon, lat): return lon * KX, -lat

# ---------- veri → skia yolları (dünya birimi: derece) ----------
def _in_bbox(coords):
    lo0, lo1, la0, la1 = BBOX
    return any(lo0 - 20 < x < lo1 + 20 and la0 - 20 < y < la1 + 20 for x, y in coords)
def _poly_path(geoms):
    p = skia.Path(); p.setFillType(skia.PathFillType.kEvenOdd)
    for g in geoms:
        polys = g["coordinates"] if g["type"] == "MultiPolygon" else [g["coordinates"]]
        for poly in polys:
            for ring in poly:
                if not _in_bbox(ring): continue
                x, y = W2(*ring[0]); p.moveTo(x, y)
                for q in ring[1:]: p.lineTo(*W2(*q))
                p.close()
    return p
def _line_paths(feats):
    out = []
    for f in feats:
        g = f["geometry"]; lines = g["coordinates"] if g["type"] == "MultiLineString" else [g["coordinates"]]
        p = skia.Path()
        for ln in lines:
            if not _in_bbox(ln): continue
            p.moveTo(*W2(*ln[0]))
            for q in ln[1:]: p.lineTo(*W2(*q))
        out.append((f["properties"].get("name"), f["properties"].get("scalerank", 5), p))
    return out
land = json.load(open(f"{DATA}/ne_50m_land.geojson"))
LAND_P = _poly_path([f["geometry"] for f in land["features"]])
lakes = json.load(open(f"{DATA}/ne_50m_lakes.geojson"))
LAKE_P = _poly_path([f["geometry"] for f in lakes["features"] if f["geometry"]])
riv = json.load(open(f"{DATA}/ne_50m_rivers_lake_centerlines.geojson"))
RIVERS = [r for r in _line_paths([f for f in riv["features"] if f["geometry"]]) if r[2].countPoints() > 1]

# ---------- dağ sıraları (elle) ----------
RANGES = {
 "Altay": [(84, 51), (87, 50), (90, 49), (93, 47.5), (96, 46)],
 "Hangay": [(97, 48), (100, 47.5), (102, 46.8)],
 "Tanrı Dağları": [(70, 41.5), (74, 41.8), (78, 42.2), (82, 43), (86, 43.2), (89, 43)],
 "Pamir": [(71, 38.5), (73, 38), (74.5, 37.5)],
 "Hindukuş": [(66, 35), (69, 35.5), (71.5, 36.2)],
 "Kafkas": [(38.5, 44), (41, 43.3), (44, 42.8), (47, 42), (49, 41)],
 "Toros": [(29.5, 36.9), (32, 36.8), (34.5, 37.2), (36.5, 37.8), (38.5, 38.3)],
 "Zagros": [(45, 36.5), (47, 34.5), (49.5, 32), (52, 30)],
 "Elburz": [(48.5, 37), (51, 36.2), (54, 36.5), (57, 37.3)],
 "Kopet Dağ": [(55, 38.3), (58, 37.6), (60.5, 36.8)],
 "Doğu Anadolu": [(40, 39.6), (42, 39.4), (43.6, 39.8)],
}
# ---------- şehirler / yerler ----------
CITY = {
 "otuken": ("Ötüken", 47.2, 102.8), "orhun": ("Orhun Yazıtları", 47.55, 102.85), "kasgar": ("Kaşgar", 39.47, 75.99), "balasagun": ("Balasagun", 42.75, 75.25),
 "talas": ("Talas", 42.9, 71.37), "buhara": ("Buhara", 39.77, 64.42), "semerkant": ("Semerkant", 39.65, 66.96), "cend": ("Cend", 44.6, 64.4),
 "merv": ("Merv", 37.66, 62.19), "dandanakan": ("Dandanakan", 37.35, 61.6), "nisabur": ("Nişabur", 36.21, 58.80), "rey": ("Rey", 35.59, 51.43),
 "isfahan": ("İsfahan", 32.65, 51.67), "bagdat": ("Bağdat", 33.31, 44.36), "ani": ("Ani", 40.51, 43.57), "malazgirt": ("Malazgirt", 39.15, 42.54),
 "pasinler": ("Pasinler", 39.98, 41.67), "erzurum": ("Erzurum", 39.90, 41.27), "sivas": ("Sivas", 39.75, 37.02), "tokat": ("Tokat", 40.31, 36.55),
 "kayseri": ("Kayseri", 38.73, 35.48), "erzincan": ("Erzincan", 39.75, 39.49), "divrigi": ("Divriği", 39.37, 38.11), "diyarbakir": ("Diyarbakır", 37.91, 40.24),
 "mardin": ("Mardin", 37.31, 40.73), "hasankeyf": ("Hasankeyf", 37.71, 41.41), "konya": ("Konya", 37.87, 32.49), "iznik": ("İznik", 40.43, 29.72),
 "kostantiniyye": ("Konstantinopolis", 41.01, 28.98), "izmir": ("İzmir", 38.42, 27.14), "miryokefalon": ("Miryokefalon", 38.1, 30.7), "gazne": ("Gazne", 33.55, 68.42),
 "kudus": ("Kudüs", 31.78, 35.22), "eskisehir": ("Eskişehir", 39.78, 30.52), "kosedag": ("Kösedağ", 40.17, 38.08), "sogut": ("Söğüt", 40.02, 30.18), "antakya": ("Antakya", 36.2, 36.16), "trabzon": ("Trabzon", 41.0, 39.72),
}
# ---------- yaklaşık dönem sınırları (lon, lat) ----------
TERR = {
 "gokturk": ("Göktürk Kağanlığı", [(126, 47), (121, 51.5), (108, 53), (92, 53.5), (78, 54.5), (64, 52.5), (53, 49.5), (46, 47), (47.5, 43.5), (54, 42.5), (61, 40.5), (67, 38.5), (73, 39.5), (79, 41.2), (89, 42), (99, 40.5), (109, 41.5), (118, 42), (124, 44)], (88, 48.5)),
 "uygur": ("Uygur Kağanlığı", [(119, 49.5), (110, 52.5), (97, 52.5), (89, 50), (87, 45.5), (91, 42.5), (100, 41.2), (110, 41.8), (117, 44)], (101, 47)),
 "karahanli": ("Karahanlılar", [(81, 44.2), (74, 45.2), (66, 43.5), (62.5, 40.5), (65, 38), (70, 37.3), (76, 36.8), (80, 38.5), (82.5, 41.5)], (73, 41)),
 "gazneli": ("Gazneliler", [(54, 36.5), (59, 38.2), (64, 37.6), (68.5, 37.2), (72, 36), (75, 33.5), (76.5, 30), (73.5, 25.5), (67.5, 24.5), (61.5, 25.5), (57, 27.5), (53, 31)], (64, 32)),
 "selcuklu": ("Büyük Selçuklu Devleti", [(79, 40.5), (73, 43.5), (64, 44), (58, 42.3), (53.5, 39.8), (49, 41.8), (45.2, 41.6), (43.8, 39.8), (41.5, 38.1), (38.2, 37.1), (36.5, 36.4), (35.9, 34.6), (35.3, 32.6), (35, 31), (39, 29.6), (44, 29.8), (48.5, 29), (50.5, 27), (55, 26), (60, 26.2), (63.5, 29.5), (67, 33.5), (71.5, 36), (76, 37)], (55, 35.5)),
 "bizans": ("Bizans İmparatorluğu", [(19.4, 40.2), (19.8, 42.3), (22.5, 44.5), (28.6, 45.2), (29.6, 44.7), (28.1, 42.4), (29.4, 41.8), (31.5, 42.2), (36, 42.6), (41.6, 42), (44.5, 41.4), (44.6, 39.6), (43.2, 38), (40.2, 37.1), (36.6, 35.9), (35.6, 35.9), (32, 35.6), (29.2, 35.8), (26.8, 36.8), (25.8, 38.6), (26.2, 40), (23.5, 39.6), (22.4, 37), (21.2, 37.8), (20.2, 39.4)], (32.5, 39.2)),
 "bizans2": ("Bizans", [(19.4, 40.2), (19.8, 42.3), (22.5, 44.5), (28.6, 45.2), (29.6, 44.7), (28.1, 42.4), (29.4, 41.3), (31.5, 41.2), (33.5, 41.9), (35, 41.6), (32.5, 40.2), (30, 39.6), (28.6, 38.4), (29.4, 37.2), (29.2, 36.2), (27.2, 37), (26.2, 38.6), (26.2, 40), (23.5, 39.6), (22.4, 37), (21.2, 37.8), (20.2, 39.4)], (23.5, 41.8)),
 "abbasi": ("Abbasi Halifeliği", [(36, 37), (40, 37.5), (44, 37), (46.5, 34.5), (48.5, 31), (48, 29.5), (44, 29.8), (39, 29.6), (35, 31), (36.2, 33.5)], (42, 33.6)),
 "anadolu1": ("Anadolu Selçuklu", [(29.6, 40.6), (31.5, 40.7), (33, 40), (33.5, 38.6), (32, 38), (30, 38.5), (29.3, 39.6)], (31.4, 39.5)),
 "anadolu2": ("Anadolu Selçuklu", [(30.5, 39.6), (33, 39.8), (35, 39.4), (35.8, 38.2), (34.5, 37.2), (32, 36.9), (30.6, 37.8)], (33, 38.5)),
 "anadolu3": ("Anadolu Selçuklu", [(30, 39.9), (32.5, 40.3), (35, 40.2), (37.5, 40), (39, 39), (38.4, 37.9), (36, 37.3), (33.5, 36.9), (31.2, 36.9), (30.2, 37.9)], (34.3, 38.6)),
 "dan": ("Danişmendliler", [(34.5, 41), (37.5, 41.1), (38.6, 40.2), (37.8, 38.8), (35.6, 38.4), (34.4, 39.4)], (36.4, 39.8)),
 "salt": ("Saltuklular", [(40.2, 40.6), (42.2, 40.8), (42.6, 39.6), (40.6, 39.4)], (41.4, 40.1)),
 "meng": ("Mengücekliler", [(38.4, 40.1), (40.1, 40.2), (40.2, 39.3), (38.2, 39.1)], (39.2, 39.45)),
 "artuk": ("Artuklular", [(39.2, 38.4), (41.8, 38.3), (42.2, 37.1), (40, 36.8), (38.8, 37.4)], (40.5, 37.6)),
 "caka": ("Çaka Bey", [(26.2, 38.9), (27.6, 38.9), (27.6, 37.9), (26.4, 38)], (26.75, 38.75)),
}
# ---------- yollar ----------
ROUTES = {
 "goc_bati": [(102.8, 47.2), (95, 46), (86, 44.8), (78, 43.5), (71.4, 42.9), (64.4, 44.6)],
 "oguz_guney": [(64.4, 44.6), (64.4, 41.5), (63.5, 39.2), (62.2, 37.7)],
 "selcuk_bati": [(62.2, 37.7), (58.8, 36.2), (51.4, 35.6), (47, 36.2), (44.4, 38.4)],
 "bagdat": [(51.4, 35.6), (47.5, 34.2), (44.4, 33.3)],
 "akin1": [(47, 38.8), (44, 39.6), (41.7, 40)],
 "akin2": [(44, 38.5), (41, 38.2), (37.5, 38.6), (35.5, 38.7)],
 "bizans_dogu": [(29, 41), (32.5, 39.9), (36.5, 39.6), (40, 39.7), (42.4, 39.2)],
 "alparslan": [(37.2, 36.2), (38.8, 37.15), (41.5, 36.9), (43.1, 37.4), (44.5, 38.6), (42.7, 39.1)],
 "dag1": [(102.8, 47.2), (97, 45), (92, 43.5), (89.2, 42.9)],
 "dag2": [(102.8, 47.2), (95, 46.8), (86, 45.5), (78, 44)],
 "yay1": [(42.5, 39.3), (40, 39.9), (37.2, 39.8)],
 "yay2": [(42.2, 38.7), (39.5, 38.3), (35.6, 38.7)],
 "yay3": [(41.2, 39.8), (37, 40.5), (33.2, 40.3)],
 "yay4": [(40.2, 38.2), (35, 37.9), (30.8, 38.5)],
 "kervan": [(27.2, 38.4), (30.5, 38.2), (32.5, 37.9), (35.5, 38.7), (37.0, 39.75), (39.5, 39.75), (41.3, 39.9)],
 "manuel": [(29.0, 41.0), (29.6, 40.1), (30.2, 39.0), (30.65, 38.2)],
 "suleyman": [(42.5, 39.2), (39, 39.4), (35.5, 38.9), (32.5, 38.3), (29.8, 40.3)],
 "hacli": [(29.0, 41.0), (29.7, 40.4), (30.5, 39.8), (31.5, 38.8), (33.5, 37.5), (35.5, 37.0), (36.2, 36.2)],
 "konya": [(29.7, 40.4), (31, 39.2), (32.5, 37.9)],
 "dunya": [(102.8, 47.2), (86, 44.8), (71.4, 42.9), (64.4, 44.6), (62.2, 37.7), (51.4, 35.6), (44.4, 38.4), (42.5, 39.2), (36.5, 38.6), (32.5, 37.9)],
}
# görünümler: (merkez lon, merkez lat, yatay genişlik derece)
VIEWS = {
 "genel": (66, 41.5, 92), "asya": (92, 45.5, 46), "bozkir": (82, 45, 62), "orta": (66, 40.5, 34), "horasan": (60, 37.5, 26),
 "iran": (52, 36.5, 36), "batı": (47, 38, 40), "kafkas": (42.5, 39.3, 18), "anadolu": (34.5, 39, 21), "malazgirt": (42.4, 39.2, 7),
 "orta_anadolu": (31.2, 39.3, 11), "maveraunnehir": (65, 38.5, 38), "akdeniz": (36, 38, 36),
}

# ---------- kamera ----------
def view_cam(v):
    lon, lat, span = VIEWS[v] if isinstance(v, str) else v
    x, y = W2(lon, lat); return (x, y, W / (span * KX))
def s2(cam, lon, lat):
    x, y = W2(lon, lat); return W / 2 + (x - cam[0]) * cam[2], H / 2 + (y - cam[1]) * cam[2]

# ---------- çizimler ----------
_PAPER = None
def paper(c):
    global _PAPER
    if _PAPER is None:
        rng = np.random.default_rng(7)
        n = rng.normal(0, 1, (H // 3, W // 3)).astype(np.float32)
        from scipy.ndimage import gaussian_filter
        n = gaussian_filter(n, 2.2) * 2.4 + gaussian_filter(rng.normal(0, 1, (H // 3, W // 3)).astype(np.float32), 18) * 9
        a = np.clip(np.abs(n) * 9, 0, 34).astype(np.uint8)
        arr = np.zeros((H // 3, W // 3, 4), np.uint8); arr[..., 0] = 70; arr[..., 1] = 50; arr[..., 2] = 25; arr[..., 3] = a
        _PAPER = skia.Image.fromarray(arr, colorType=skia.kRGBA_8888_ColorType)
    p = skia.Paint(); p.setBlendMode(skia.BlendMode.kMultiply)
    c.drawImageRect(_PAPER, skia.Rect.MakeWH(W, H), SAMP, p)

def draw_base(c, cam, t=0.0):
    c.clear(C(SEA))
    p = skia.Paint(); p.setShader(skia.GradientShader.MakeRadial(skia.Point(W / 2, H / 2), W * .75, [C("#D6E6E4").toColor(), C(SEA).toColor(), C(SEA_D).toColor()], [0, .6, 1]))
    c.drawRect(skia.Rect.MakeWH(W, H), p)
    z = cam[2]
    c.save(); c.translate(W / 2, H / 2); c.scale(z, z); c.translate(-cam[0], -cam[1])
    # kıyı halesi (denizde koyu şerit)
    for wdt, al in ((26, .10), (12, .14), (5, .18)):
        hp = paint(SEA_D, al, wdt / z); hp.setMaskFilter(skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, 3 / z))
        c.drawPath(LAND_P, hp)
    # kara
    lp = skia.Paint(AntiAlias=True); lp.setShader(skia.GradientShader.MakeLinear([skia.Point(cam[0], cam[1] - H / z / 2), skia.Point(cam[0], cam[1] + H / z / 2)], [C(LAND).toColor(), C(LAND_D).toColor()]))
    c.drawPath(LAND_P, lp)
    c.drawPath(LAND_P, paint(SHORE, .85, 1.6 / z))
    # göller
    c.drawPath(LAKE_P, paint(SEA)); c.drawPath(LAKE_P, paint(SHORE, .8, 1.2 / z))
    # nehirler
    for name, rank, pth in RIVERS:
        wdt = (2.4 if rank <= 3 else 1.4) / z
        if z < 30 and rank > 4: continue
        c.drawPath(pth, paint(RIVER, .9, wdt))
    c.restore()
    # dağlar (ekran uzayında, sabit boy)
    msz = max(7, min(16, z * .35))
    for name, pts in RANGES.items():
        for (a, b) in zip(pts, pts[1:]):
            n = max(1, int(math.dist(a, b) / max(.35, 9 / z)))
            for k in range(n):
                f = (k + .5) / n; lon, lat = lerp(a[0], b[0], f), lerp(a[1], b[1], f)
                jit = math.sin(lon * 13.1 + lat * 7.7)
                x, y = s2(cam, lon + jit * .12, lat + math.cos(lon * 5.3) * .18)
                if -40 < x < W + 40 and -40 < y < H + 40: mountain(c, x, y, msz * (1 + .25 * jit))
    # deniz ve bölge adları
    for nm, lon, lat, sz in SEAS:
        if sz * cam[2] / 30 < 14: continue
        x, y = s2(cam, lon, lat)
        if -200 < x < W + 200 and -50 < y < H + 50:
            text(c, nm, x, y, "i", max(24, min(46, sz * cam[2] / 30)), "#4F7F86", .75, align="center")
    paper(c)

SEAS = [("Karadeniz", 34.5, 43.3, 40), ("Akdeniz", 30, 34, 40), ("Hazar Denizi", 51, 41.5, 34), ("Basra Körfezi", 51, 27.5, 26), ("Aral", 59.6, 45.2, 22),
        ("Ege Denizi", 25, 38.6, 26), ("Marmara", 28, 40.75, 18), ("Balkaş", 74.5, 46.6, 20)]

def mountain(c, x, y, s):
    pth = skia.Path(); pth.moveTo(x - s, y + s * .55); pth.lineTo(x, y - s * .75); pth.lineTo(x + s, y + s * .55)
    c.drawPath(pth, paint(MOUNT, .9, max(1.3, s * .14)))
    sh = skia.Path(); sh.moveTo(x, y - s * .75); sh.lineTo(x + s, y + s * .55); sh.lineTo(x + s * .25, y + s * .55); sh.close()
    c.drawPath(sh, paint(MOUNT, .28))

def terr_path(key):
    pts = TERR[key][1]; p = skia.Path()
    # yumuşak kenar: Catmull-Rom → kübik
    P = [W2(*q) for q in pts]; n = len(P)
    p.moveTo(*P[0])
    for i in range(n):
        p0, p1, p2, p3 = P[i - 1], P[i], P[(i + 1) % n], P[(i + 2) % n]
        c1 = (p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6); c2 = (p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6)
        p.cubicTo(*c1, *c2, *p2)
    p.close(); return p
_TP = {}
def draw_terr(c, cam, key, a, grow=1.0, t=0.0, label=True):
    if a <= 0: return
    if key not in _TP: _TP[key] = terr_path(key)
    col = EMP.get(key.rstrip("0123456789"), RED)
    name, pts, lab = TERR[key]
    z = cam[2]
    c.save(); c.translate(W / 2, H / 2); c.scale(z, z); c.translate(-cam[0], -cam[1])
    if grow < 1:   # merkezden büyüyerek yayılır
        cx, cy = W2(*lab); g = eout(grow)
        c.translate(cx, cy); c.scale(g, g); c.translate(-cx, -cy)
    c.clipPath(LAND_P, doAntiAlias=True)
    c.drawPath(_TP[key], paint(col, .20 * a))
    hp = paint(col, .35 * a, 9 / z); hp.setMaskFilter(skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, 4 / z)); c.drawPath(_TP[key], hp)
    bp = paint(col, .9 * a, 2.6 / z); bp.setPathEffect(skia.DashPathEffect.Make([10 / z, 6 / z], (t * 6) / z)); c.drawPath(_TP[key], bp)
    c.restore()
    if label:
        x, y = s2(cam, *lab)
        xs = [W2(*q)[0] for q in pts]; wpx = (max(xs) - min(xs)) * z
        size = max(15, min(42, z * .9, wpx * 1.25 / max(4, len(name))))
        la = a * eout(prog(grow, .5, 1))
        text(c, tr_up(name), x + 2, y + 2, "b", size, "#FFFFFF", .55 * la, align="center", track=size * .08)
        text(c, tr_up(name), x, y, "b", size, col, la, align="center", track=size * .08)

def draw_route(c, cam, key, p, col=RED, wdt=6, dash=True, a=1.0):
    if p <= 0 or a <= 0: return
    pts = [s2(cam, *q) for q in ROUTES[key]]
    # Catmull-Rom örnekle
    S = []
    n = len(pts)
    for i in range(n - 1):
        p0 = pts[max(0, i - 1)]; p1 = pts[i]; p2 = pts[i + 1]; p3 = pts[min(n - 1, i + 2)]
        for k in range(16):
            u = k / 16; u2, u3 = u * u, u * u * u
            S.append(tuple(.5 * ((2 * p1[j]) + (-p0[j] + p2[j]) * u + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * u2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * u3) for j in (0, 1)))
    S.append(pts[-1])
    L = [0]
    for a_, b_ in zip(S, S[1:]): L.append(L[-1] + math.dist(a_, b_))
    tot = L[-1]; cut = tot * eio(clamp(p))
    pth = skia.Path(); pth.moveTo(*S[0]); end = S[0]; ang = 0
    for i in range(1, len(S)):
        if L[i] <= cut: pth.lineTo(*S[i]); end = S[i]; ang = math.atan2(S[i][1] - S[i - 1][1], S[i][0] - S[i - 1][0])
        else:
            f = (cut - L[i - 1]) / max(1e-6, L[i] - L[i - 1]); end = (lerp(S[i - 1][0], S[i][0], f), lerp(S[i - 1][1], S[i][1], f))
            pth.lineTo(*end); ang = math.atan2(S[i][1] - S[i - 1][1], S[i][0] - S[i - 1][0]); break
    sh = paint("#3A2E22", .25 * a, wdt + 4); sh.setMaskFilter(skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, 4)); c.drawPath(pth, sh)
    pp = paint(col, a, wdt)
    if dash: pp.setPathEffect(skia.DashPathEffect.Make([wdt * 3.2, wdt * 1.6], 0))
    c.drawPath(pth, pp)
    # ok ucu
    s = wdt * 3.2; c.save(); c.translate(*end); c.rotate(math.degrees(ang))
    hd = skia.Path(); hd.moveTo(s, 0); hd.lineTo(-s * .7, -s * .75); hd.lineTo(-s * .35, 0); hd.lineTo(-s * .7, s * .75); hd.close()
    c.drawPath(hd, paint(col, a)); c.restore()

def draw_city(c, cam, key, a, t=0.0, big=False, side="r", col=PAPER_INK):
    if a <= 0: return
    name, lat, lon = CITY[key]; x, y = s2(cam, lon, lat)
    r = 9 if big else 7
    if big:
        q = (t * .8) % 1; c.drawCircle(x, y, r + 26 * q, paint(RED, .5 * (1 - q) * a, 3))
    c.drawCircle(x, y, r + 3, paint("#FFF8EA", a)); c.drawCircle(x, y, r, paint(RED if big else col, a))
    size = 30 if big else 25
    w = tw(name, "s", size)
    tx = x + 16 if side == "r" else (x - 16 - w if side == "l" else x - w / 2)
    ty = y + 9 if side in "rl" else (y - 22 if side == "u" else y + 44)
    rrect(c, tx - 8, ty - size * .82, w + 16, size * 1.12, 8, "#FFF8EA", .72 * a)
    text(c, name, tx, ty, "s", size, PAPER_INK, a)

def draw_label(c, cam, s, lon, lat, a, size=30, col="#6A5638", italic=True, track=None):
    if a <= 0: return
    x, y = s2(cam, lon, lat)
    text(c, s, x, y, "i" if italic else "s", size, col, a * .9, align="center", track=track if track is not None else (0 if italic else 3))
