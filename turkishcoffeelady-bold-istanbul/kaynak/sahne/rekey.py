# Replace the blue studio of the user's film with the Istanbul yali scene, keeping every motion.
import sys, cv2, numpy as np, subprocess
from PIL import Image
from rembg import new_session, remove
sys.path.insert(0, "re/tools")
OUT = sys.argv[1]; LIMIT = int(sys.argv[2]) if len(sys.argv) > 2 else 10 ** 9
ONLY = [int(x) for x in sys.argv[3].split(',')] if len(sys.argv) > 3 else None
W, H = 1920, 1080
sess = new_session("isnet-general-use")
bg0 = cv2.resize(cv2.imread("k/E.png"), (W, H), interpolation=cv2.INTER_AREA).astype(np.float32)
cap = cv2.VideoCapture("ref3/r.mp4"); fps = cap.get(cv2.CAP_PROP_FPS)
# background camera: (time s, zoom, blur sigma, centre x, centre y) as fractions
KEY = [(0, 1.0, 5, .5, .5), (2.0, 1.0, 5, .5, .5), (3.0, 1.7, 16, .5, .42), (7.0, 1.75, 16, .5, .42),
       (8.0, 1.25, 10, .5, .45), (9.0, 1.06, 7, .5, .5), (13.4, 1.0, 5, .5, .5)]
def cam(t):
    for (t0, *a), (t1, *b) in zip(KEY, KEY[1:]):
        if t <= t1:
            k = (t - t0) / (t1 - t0); k = k * k * (3 - 2 * k)
            return [x + (y - x) * k for x, y in zip(a, b)]
    return KEY[-1][1:]
def background(t):
    z, s, cx, cy = cam(t)
    M = np.float32([[z, 0, W / 2 - z * cx * W], [0, z, H / 2 - z * cy * H]])
    b = cv2.warpAffine(bg0, M, (W, H), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)
    return cv2.GaussianBlur(b, (0, 0), s)
def alpha(f, m, idx=0):
    f = f.astype(np.float32); b, g, r = f[..., 0], f[..., 1], f[..., 2]
    blue = (b - np.maximum(r, g)) / (b + 20); lum = f.mean(2)
    m = m.astype(np.float32) / 255
    ck = np.clip((0.16 - blue) / 0.10, 0, 1) * np.clip((lum - 18) / 40, 0, 1)
    strong = np.clip((m - 0.6) / 0.25, 0, 1)
    warm = np.clip(((r - b) - 6) / 20, 0, 1) * np.clip((lum - 15) / 25, 0, 1)
    bright = np.clip((lum - 95) / 30, 0, 1) * np.clip((0.34 - blue) / 0.10, 0, 1)
    a = np.maximum(np.maximum(ck * np.clip(m * 4, 0, 1) ** 0.5, strong), np.maximum(warm, bright))
    # keep only what is connected to the confident subject core (drops the old arch, which is never connected to it)
    metal = (blue > 0.1) & (lum < 170) & (warm < 0.3)   # bluish grey metal of the old arch
    core = ((m > 0.9) & ~metal).astype(np.uint8)
    core = cv2.morphologyEx(core, cv2.MORPH_OPEN, np.ones((5, 5), np.uint8))
    n, lab, st, _ = cv2.connectedComponentsWithStats(core)
    keep = np.zeros_like(core)
    if n > 1:
        big = st[1:, cv2.CC_STAT_AREA].max()
        for i in range(1, n):
            if st[i, cv2.CC_STAT_AREA] > 0.08 * big: keep[lab == i] = 1
    cand = (a > 0.45).astype(np.uint8)
    cand = cv2.morphologyEx(cand, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
    n2, lab2 = cv2.connectedComponents(cand)
    ids = np.unique(lab2[(keep > 0) & (cand > 0)]); ids = ids[ids > 0]
    grown = np.isin(lab2, ids).astype(np.uint8) | keep
    # growth may reach far only straight down (bag body below its opening), never up or sideways (old arch)
    near = cv2.dilate(keep, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (61, 61)))
    below = np.zeros_like(keep)
    if keep.any():
        ys, xs = np.where(keep > 0)
        below[ys.min():, max(0, xs.min() - 40):xs.max() + 40] = 1
    grown = grown & (near | below)
    zone = cv2.dilate(grown, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (31, 31)))
    zone = cv2.GaussianBlur(zone.astype(np.float32), (0, 0), 8)
    a = a * zone
    if 308 <= idx <= 360 and CANBOX is not None:
        x0, x1, y0, ybot = CANBOX
        band = np.zeros((H, W), np.float32)
        band[y0:, x0:x1] = 1
        band[ybot - 60:, :] = np.maximum(band[ybot - 60:, :], (keep[ybot - 60:, :] > 0) | (a[ybot - 60:, :] > 0.5))
        band = cv2.GaussianBlur(band, (0, 0), 3)
        a = a * band
    return np.clip(a, 0, 1)
CANBOX = None
_c = cv2.VideoCapture("ref3/r.mp4"); _c.set(cv2.CAP_PROP_POS_FRAMES, 385); _ok, _f = _c.read()
if _ok:
    _f = cv2.resize(_f, (W, H), interpolation=cv2.INTER_AREA)
    _m = np.array(remove(Image.fromarray(_f[..., ::-1]), session=sess, only_mask=True))
    _a = alpha(_f, _m, 0) > 0.5
    _cols = np.where(_a[: int(H * 0.75)].sum(0) > 40)[0]
    _runs = np.split(_cols, np.where(np.diff(_cols) > 8)[0] + 1)
    _run = min(_runs, key=lambda r: abs((r[0] + r[-1]) / 2 - W / 2))
    _x0, _x1 = int(_run[0]), int(_run[-1])
    _rows = np.where(_a[:, _x0 + 10:_x1 - 10].mean(1) > 0.8)[0]
    CANBOX = (_x0 - 14, _x1 + 14, int(_rows.min()) - 12, int(_rows.max()))
    print("CANBOX", CANBOX, flush=True)
p = subprocess.Popen(["ffmpeg", "-loglevel", "error", "-y", "-f", "rawvideo", "-pix_fmt", "bgr24", "-s", f"{W}x{H}", "-r", str(fps), "-i", "-",
    "-an", "-c:v", "libx264", "-preset", "medium", "-crf", "16", "-pix_fmt", "yuv420p", OUT], stdin=subprocess.PIPE)
i = 0
while i < LIMIT:
    ok, fr = cap.read()
    if not ok: break
    if ONLY is not None and i not in ONLY:
        i += 1; continue
    fr = cv2.resize(fr, (W, H), interpolation=cv2.INTER_AREA)
    m = np.array(remove(Image.fromarray(fr[..., ::-1]), session=sess, only_mask=True))
    a = alpha(fr, m, i)
    a = cv2.GaussianBlur(a, (0, 0), 0.7)[..., None]
    t = i / fps
    bg = background(t)
    # light wrap: a touch of the background glow on the subject edges
    edge = np.clip(cv2.GaussianBlur(a, (0, 0), 6)[..., None] if a.ndim == 2 else cv2.GaussianBlur(a[..., 0], (0, 0), 6)[..., None], 0, 1)
    wrap = (1 - edge) * a * 0.25
    comp = fr * a + bg * (1 - a)
    comp = comp * (1 - wrap) + cv2.GaussianBlur(bg, (0, 0), 8) * wrap
    p.stdin.write(np.clip(comp, 0, 255).astype(np.uint8).tobytes())
    if ONLY is not None: cv2.imwrite(f"ref3/out/test_{i}.jpg", cv2.resize(np.clip(comp, 0, 255).astype(np.uint8), (640, 360)))
    if i % 25 == 0: print(i, flush=True)
    i += 1
p.stdin.close(); p.wait()
print("done", i)
