"""Stitch Esri World Imagery tiles around RAMS Park into one texture + metadata.
Usage: python3 tools/fetch_satellite.py   (writes assets/sat.jpg, assets/sat.json)
"""
import io, json, math, os, sys, time, urllib.request
from PIL import Image, ImageFilter

LAT0, LON0 = 41.103369, 28.9909522   # RAMS Park (OSM way 342828509)
Z, N = 18, 16                        # zoom, tiles per side -> 4096 px
OUT = os.path.join(os.path.dirname(__file__), '..', 'assets')
PREFIX = 'sat'
if len(sys.argv) >= 4: LAT0, LON0, PREFIX = float(sys.argv[1]), float(sys.argv[2]), sys.argv[3]
URL = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'

def deg2px(lat, lon, z):
    n = 256 * 2 ** z
    x = (lon + 180) / 360 * n
    y = (1 - math.asinh(math.tan(math.radians(lat))) / math.pi) / 2 * n
    return x, y

def px2deg(x, y, z):
    n = 256 * 2 ** z
    lon = x / n * 360 - 180
    lat = math.degrees(math.atan(math.sinh(math.pi * (1 - 2 * y / n))))
    return lat, lon

cx, cy = deg2px(LAT0, LON0, Z)
tx0, ty0 = int(cx // 256) - N // 2, int(cy // 256) - N // 2
img = Image.new('RGB', (N * 256, N * 256))
for j in range(N):
    for i in range(N):
        url = URL.format(z=Z, x=tx0 + i, y=ty0 + j)
        for attempt in range(4):
            try:
                req = urllib.request.Request(url, headers={'User-Agent': 'stadium-demo/1.0'})
                data = urllib.request.urlopen(req, timeout=30).read()
                img.paste(Image.open(io.BytesIO(data)).convert('RGB'), (i * 256, j * 256))
                break
            except Exception as e:
                time.sleep(1 + attempt)
        else:
            print('failed', url, file=sys.stderr)
    print('row', j + 1, '/', N, flush=True)

# feather the outer 12% into the mean colour so the edge disappears into the far ground
W = img.size[0]
mean = img.resize((1, 1), Image.LANCZOS).getpixel((0, 0))
mask = Image.new('L', img.size, 0)
m = int(W * 0.12)
mpx = mask.load()
for y in range(W):
    for x in range(W):
        d = min(x, y, W - 1 - x, W - 1 - y)
        mpx[x, y] = 255 if d >= m else int(255 * (d / m) ** 1.5)
bg = Image.new('RGB', img.size, mean)
img = Image.composite(img, bg, mask)
img.save(os.path.join(OUT, PREFIX + '.jpg'), quality=86, optimize=True, progressive=True)
img.resize((2048, 2048), Image.LANCZOS).save(os.path.join(OUT, PREFIX + '-2k.jpg'), quality=86, optimize=True, progressive=True)

# metres east/north (local tangent plane at LAT0/LON0) of each image corner
kx = 111320 * math.cos(math.radians(LAT0)); ky = 110574
def en(px, py):
    lat, lon = px2deg(tx0 * 256 + px, ty0 * 256 + py, Z)
    return [(lon - LON0) * kx, (lat - LAT0) * ky]
meta = {
    'size': W, 'mean': '#%02x%02x%02x' % mean,
    'tl': en(0, 0), 'tr': en(W, 0), 'bl': en(0, W), 'br': en(W, W),
    'source': 'Esri World Imagery (Esri, Maxar, Earthstar Geographics)',
}
json.dump(meta, open(os.path.join(OUT, PREFIX + '.json'), 'w'), indent=1)
print(json.dumps(meta))
