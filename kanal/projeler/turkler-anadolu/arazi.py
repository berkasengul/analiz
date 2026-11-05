# Gerçekçi arazi dokusu: AWS terrarium yükseklik karoları → eşdikdörtgen ızgara → kabartma + renk
import os, math, sys, json, urllib.request
import numpy as np
from concurrent.futures import ThreadPoolExecutor
from PIL import Image
from scipy.ndimage import map_coordinates, gaussian_filter, zoom as nzoom
Image.MAX_IMAGE_PIXELS = None
V = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(os.path.dirname(V), "ist", "data")
TILES = f"{DATA}/elev"; os.makedirs(TILES, exist_ok=True)

def tile(z, x, y):
    p = f"{TILES}/{z}_{x}_{y}.png"
    if not os.path.exists(p):
        for k in range(4):
            try:
                urllib.request.urlretrieve(f"https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png", p); break
            except Exception:
                if k == 3: raise
    a = np.asarray(Image.open(p).convert("RGB"), dtype=np.float32)
    return a[..., 0] * 256 + a[..., 1] + a[..., 2] / 256 - 32768

def merc(lon, lat, z):
    n = 2 ** z * 256
    x = (lon + 180) / 360 * n
    y = (1 - math.log(math.tan(math.radians(lat)) + 1 / math.cos(math.radians(lat))) / math.pi) / 2 * n
    return x, y

def dem(lon0, lon1, lat0, lat1, ppd, z):
    """Eşdikdörtgen yükseklik ızgarası (satır 0 = kuzey)."""
    x0, y0 = merc(lon0, lat1, z); x1, y1 = merc(lon1, lat0, z)
    tx0, ty0, tx1, ty1 = int(x0 // 256), int(y0 // 256), int(x1 // 256), int(y1 // 256)
    jobs = [(z, tx, ty) for ty in range(ty0, ty1 + 1) for tx in range(tx0, tx1 + 1)]
    with ThreadPoolExecutor(12) as ex: arrs = list(ex.map(lambda j: tile(*j), jobs))
    W_, H_ = (tx1 - tx0 + 1) * 256, (ty1 - ty0 + 1) * 256
    mos = np.zeros((H_, W_), np.float32)
    for (zz, tx, ty), a in zip(jobs, arrs): mos[(ty - ty0) * 256:(ty - ty0 + 1) * 256, (tx - tx0) * 256:(tx - tx0 + 1) * 256] = a
    w, h = int((lon1 - lon0) * ppd), int((lat1 - lat0) * ppd)
    lons = lon0 + (np.arange(w) + .5) / ppd; lats = lat1 - (np.arange(h) + .5) / ppd
    n = 2 ** z * 256
    mx = (lons + 180) / 360 * n - tx0 * 256
    my = (1 - np.log(np.tan(np.radians(lats)) + 1 / np.cos(np.radians(lats))) / np.pi) / 2 * n - ty0 * 256
    MX, MY = np.meshgrid(mx, my)
    return map_coordinates(mos, [MY, MX], order=1, mode="nearest")

def hillshade(h, ppd, lat_c, exag=1.0):
    # piksel boyu (m)
    dy = 111320 / ppd; dx = dy * math.cos(math.radians(lat_c))
    gy, gx = np.gradient(h * exag, dy, dx)
    out = 0
    for az, alt, w in ((315, 40, .55), (270, 50, .2), (0, 55, .25)):   # çok yönlü ışık
        az_r = math.radians(360 - az + 90); alt_r = math.radians(alt)
        slope = np.arctan(np.hypot(gx, gy)); aspect = np.arctan2(-gx, gy)
        s = np.sin(alt_r) * np.cos(slope) + np.cos(alt_r) * np.sin(slope) * np.cos(az_r - aspect)
        out = out + w * np.clip(s, 0, 1)
    return out

# renk durakları (m): ova → bozkır → dağ → kaya → kar
STOPS = [(-50, (78, 98, 60)), (0, (84, 104, 64)), (400, (112, 118, 78)), (1000, (142, 136, 104)), (1700, (138, 126, 106)),
         (2500, (120, 112, 104)), (3300, (134, 126, 118)), (4600, (150, 144, 138)), (5300, (232, 234, 238)), (7000, (250, 250, 252))]
def hypso(h):
    xs = np.array([s[0] for s in STOPS], np.float32); cs = np.array([s[1] for s in STOPS], np.float32)
    return np.stack([np.interp(h, xs, cs[:, k]) for k in range(3)], -1)

def sea_color(h):
    d = np.clip(-h / 2500, 0, 1)[..., None]
    shallow = np.array([46, 104, 128], np.float32); deep = np.array([12, 38, 66], np.float32)
    return shallow * (1 - d) + deep * d

def build(name, lon0, lon1, lat0, lat1, ppd, z, land_mask=None, base=None, exag=1.0, snow=True):
    out = f"{DATA}/atlas_{name}.jpg"
    if os.path.exists(out): return out
    h = dem(lon0, lon1, lat0, lat1, ppd, z)
    hs = hillshade(gaussian_filter(h, .6), ppd, (lat0 + lat1) / 2, exag)
    if land_mask is None: land = h > 0.5
    else: land = land_mask(lon0, lon1, lat0, lat1, h.shape, h)
    land = gaussian_filter(land.astype(np.float32), 1.3) > .5      # basamaksız kıyı
    col = hypso(np.maximum(h, 0))
    if base is not None:   # Natural Earth arazi örtüsü (çöl, orman) düşük frekans renk olarak
        b = base(lon0, lon1, lat0, lat1, h.shape).astype(np.float32)
        b = gaussian_filter(b, (2, 2, 0))
        lum = b.mean(-1, keepdims=True); chroma = b / np.maximum(lum, 1)
        col = col * (.6 + .4 * chroma)        # bölgenin rengi (çöl sarısı, orman yeşili), yükseklik tonu korunur
    shade = (.35 + .95 * hs)[..., None]
    landc = np.clip(col * shade, 0, 255)
    # ova tozu/doku
    rng = np.random.default_rng(1); noise = gaussian_filter(rng.normal(0, 1, h.shape), 1.2)[..., None]
    landc = np.clip(landc * (1 + .035 * noise), 0, 255)
    hw = np.minimum(h, -1)
    if "m" in LAKE and LAKE["m"].shape == h.shape: hw = np.where(LAKE["m"], np.minimum(hw, -180 - 60 * gaussian_filter(LAKE["m"].astype(np.float32), 4)), hw); LAKE.clear()
    hw = gaussian_filter(hw, min(40.0, max(3.0, ppd * .22)))   # kaba derinlik verisini yumuşat
    sea = sea_color(hw)
    sea = sea * (.92 + .1 * gaussian_filter(rng.normal(0, 1, h.shape), 6)[..., None])
    # kıyı: sığ su parlaması
    lm = land.astype(np.float32); glow = gaussian_filter(lm, 3 * ppd / 100 + 1.5)[..., None]
    sea = sea + np.array([18, 40, 42], np.float32) * np.clip(glow * 1.6, 0, 1) * np.clip(1 + hw[..., None] / 120, 0, 1)
    img = np.where(land[..., None], landc, sea)
    # kıyı çizgisi hafif koyu
    edge = np.clip(np.abs(gaussian_filter(lm, 1.0) - lm) * 3, 0, 1)[..., None]
    img = img * (1 - .25 * edge)
    Image.fromarray(np.clip(img, 0, 255).astype(np.uint8)).save(out, quality=93)
    return out

# ---------- Natural Earth yardımcıları ----------
from PIL import ImageDraw
_NE1 = None
NE1_BOX = (-12, 140, 8, 66, 30)
def ne_base(lon0, lon1, lat0, lat1, shape):
    global _NE1
    if _NE1 is None: _NE1 = Image.open(f"{DATA}/ne1/bolge.png").convert("RGB")
    L0, L1, A0, A1, k = NE1_BOX
    box = ((lon0 - L0) * k, (A1 - lat1) * k, (lon1 - L0) * k, (A1 - lat0) * k)
    return np.asarray(_NE1.resize((shape[1], shape[0]), Image.BICUBIC, box=box))
_GJ = {}
def _rings(name):
    if name not in _GJ:
        d = json.load(open(f"{DATA}/{name}.geojson")); rs = []
        for f in d["features"]:
            g = f["geometry"]
            if not g: continue
            polys = g["coordinates"] if g["type"] == "MultiPolygon" else [g["coordinates"]]
            for poly in polys:
                for k, ring in enumerate(poly): rs.append((k, ring))
        _GJ[name] = rs
    return _GJ[name]
def _raster(name, lon0, lon1, lat0, lat1, shape, holes=True):
    h, w = shape; im = Image.new("L", (w, h), 0); dr = ImageDraw.Draw(im)
    for k, ring in _rings(name):
        xs = [(x - lon0) / (lon1 - lon0) * w for x, y in ring]; ys = [(lat1 - y) / (lat1 - lat0) * h for x, y in ring]
        if max(xs) < 0 or min(xs) > w or max(ys) < 0 or min(ys) > h: continue
        dr.polygon(list(zip(xs, ys)), fill=0 if (k > 0 and holes) else 255)
    return np.asarray(im) > 127
from scipy.ndimage import binary_erosion
LAKE = {}
def mask_ne(lon0, lon1, lat0, lat1, shape, h=None):
    """Kıyı yükseklikten (ince), çukur karalar (Turfan vb.) Natural Earth'ten."""
    ne = _raster("ne_50m_land", lon0, lon1, lat0, lat1, shape)
    lake = _raster("ne_50m_lakes", lon0, lon1, lat0, lat1, shape, holes=False)
    if (lon1 - lon0) < 30: lake = flat_lake(h, lake)
    core = binary_erosion(ne, iterations=4)
    LAKE["m"] = lake
    return ((h > 0.5) | core) & ~lake
def flat_lake(h, ne_lake):
    from scipy.ndimage import binary_dilation, binary_opening, label as nlabel
    if not ne_lake.any(): return ne_lake
    gy, gx = np.gradient(h); fl = np.hypot(gx, gy) < .35
    near = binary_dilation(ne_lake, iterations=max(6, int(min(h.shape) * .02)))
    cand = binary_opening(fl & near, iterations=2)
    lab, n = nlabel(cand)
    keep = np.zeros_like(cand)
    for i in range(1, n + 1):
        m = lab == i
        if (m & ne_lake).sum() > .3 * m.sum() and m.sum() > 400: keep |= m
    return keep if keep.any() else ne_lake
def mask_dem(lon0, lon1, lat0, lat1, shape, h=None):
    lake = flat_lake(h, _raster("ne_50m_lakes", lon0, lon1, lat0, lat1, shape, holes=False))
    LAKE["m"] = lake
    return (h > 0.5) & ~lake

ATLAS = [  # ad, lon0, lon1, lat0, lat1, piksel/derece, karo zoom, maske
 ("dunya", -12, 140, 8, 66, 30, 6, "ne"),
 ("bolge", 18, 76, 26, 52, 80, 7, "ne"),
 ("anadolu", 24, 46, 34.5, 43.5, 190, 8, "ne"),
 ("malazgirt", 41.2, 43.9, 38.5, 39.9, 520, 10, "dem"),
 ("istanbul", 28.82, 29.14, 40.95, 41.15, 6400, 13, "dem"),
]
if __name__ == "__main__":
    import time
    for nm, a0, a1, b0, b1, ppd, z, mk in ATLAS:
        t0 = time.time()
        print(build(nm, a0, a1, b0, b1, ppd, z, mask_ne if mk == "ne" else mask_dem, ne_base if nm != "istanbul" else None), round(time.time() - t0, 1), flush=True)
