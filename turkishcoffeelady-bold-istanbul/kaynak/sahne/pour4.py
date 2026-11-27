# Fixed opening film. Original 0-5.0 s -> spoon glides outside the bag -> tilts and pours a textured coffee stream
# into the empty space beside the bag (mound lowers) -> spoon rises away, dust circles the bag, camera pushes in ->
# matched dissolve into the original vortex at 8.1 s -> original to the end (can).
import cv2, numpy as np, subprocess, sys
OUT = sys.argv[1]
W, H, FPS = 1920, 1080, 30
cap = cv2.VideoCapture("full.mp4"); orig = []
while True:
    ok, f = cap.read()
    if not ok: break
    orig.append(f)
down = lambda f: cv2.resize(f, (W, H), interpolation=cv2.INTER_AREA)
plate = cv2.imread("plate.png").astype(np.float32)
sa = cv2.imread("spoon_a2.png", 0).astype(np.float32) / 255
spoon = cv2.imread("f5.0.png").astype(np.float32)
fi = spoon.astype(int)
heap = ((fi[..., 2] - fi[..., 0] > 22) & (sa > 0.5)).astype(np.uint8)
heap[:250] = 0; heap[:, 1290:] = 0
heap = cv2.morphologyEx(heap, cv2.MORPH_CLOSE, np.ones((7, 7), np.uint8))
hy, hx = np.where(heap > 0)
top = np.full(W, 10 ** 6); bot = np.zeros(W)
np.minimum.at(top, hx, hy); np.maximum.at(bot, hx, hy)
TIP = np.array([float(hx.min()) + 10, float(hy[np.argmin(hx)]) - 6])
PIV = np.array([1230.0, 300.0])
yy, xx = np.mgrid[0:H, 0:W]
# coffee texture for the stream
cx0, cy0 = int(hx.mean()), int(hy.mean())
tex = spoon[cy0 - 50:cy0 + 50, cx0 - 40:cx0 + 40].copy()
tex = np.clip(tex * 2.6 + np.array([4, 10, 22], np.float32), 0, 255)  # falling grains catch the light
tex = np.vstack([tex, tex[::-1]] * 8)
DX, DY = -480.0, -110.0
sm = lambda t: t * t * (3 - 2 * t)
rng = np.random.default_rng(9)
def spoon_layer(dx, dy, ang, low):
    # low: 0..1, how much of the mound above the bowl has poured away (top-down)
    a = sa.copy()
    if low > 0:
        cut = top[xx] + (bot[xx] - top[xx]) * 0.55 * low
        gone = (heap > 0) & (yy < cut)
        a = np.where(gone, 0, a)
        a = cv2.GaussianBlur(a, (0, 0), 0.8)
    M = cv2.getRotationMatrix2D((PIV[0], PIV[1]), ang, 1.0); M[:, 2] += (dx, dy)
    s = cv2.warpAffine(spoon, M, (W, H), flags=cv2.INTER_CUBIC)
    aa = cv2.warpAffine(a, M, (W, H), flags=cv2.INTER_LINEAR)[..., None]
    tip = M @ np.array([TIP[0], TIP[1], 1.0])
    return s, aa, tip
def stream(base, tip, y0, y1, width, scroll, alpha=1.0):
    # textured falling column from y0 to y1 under the tip
    if y1 <= y0 + 2: return base
    out = base.copy()
    ys = np.arange(int(max(0, y0)), int(min(H, y1)))
    if not len(ys): return base
    for y in ys:
        t = (y - y0) / max(1, (y1 - y0))
        wdt = width * (1.0 - 0.35 * t) + 2
        xc = tip[0] + 6 * np.sin((y + scroll) * 0.02) * t
        x0, x1 = int(xc - wdt), int(xc + wdt) + 1
        if x1 <= 0 or x0 >= W: continue
        xs = np.arange(max(0, x0), min(W, x1))
        u = (xs - (xc - wdt)) / (2 * wdt)
        prof = np.exp(-((u - 0.5) / 0.28) ** 2)
        grain = rng.uniform(0.55, 1.0, len(xs))
        al = np.clip(prof * grain * alpha * (1 - 0.6 * t ** 3), 0, 1)
        tr = tex[int(y - scroll) % (tex.shape[0]), (np.arange(len(xs)) * tex.shape[1] // max(1, len(xs))) % tex.shape[1]]
        out[y, xs] = out[y, xs] * (1 - al[:, None]) + tr * al[:, None]
    # soft dust around the column
    m = np.zeros((H, W), np.float32)
    cv2.line(m, (int(tip[0]), int(y0)), (int(tip[0]), int(min(y1, H + 50))), 1.0, max(1, int(width * 2)))
    m = cv2.GaussianBlur(m, (0, 0), 14) * 0.22 * alpha
    col = np.array([30, 52, 92], np.float32)
    return out * (1 - m[..., None]) + col * m[..., None]
CEN = np.array([970.0, 860.0])
P = np.zeros((0, 2), np.float32); V = np.zeros((0, 2), np.float32); C = np.zeros((0, 3), np.float32)
pal = spoon[heap > 0]
def ring(n):
    global P, V, C
    ang = rng.uniform(0, 2 * np.pi, n); rad = rng.uniform(380, 600, n)
    p = CEN + np.column_stack([np.cos(ang) * rad, np.sin(ang) * rad * 0.5 - rng.uniform(0, 420, n)])
    t = np.column_stack([-np.sin(ang), np.cos(ang) * 0.5]); v = t * rng.uniform(18, 30, (n, 1))
    P = np.vstack([P, p]); V = np.vstack([V, v]); C = np.vstack([C, np.clip(pal[rng.integers(0, len(pal), n)] * 2.4 + 15, 0, 255)])
def step():
    global P, V, C
    prev = P.copy()
    if len(P):
        d = CEN - P; dist = np.hypot(d[:, 0], d[:, 1])[:, None] + 1
        V += d / dist * 1.2 + np.column_stack([-d[:, 1], d[:, 0]]) / dist * 1.8; V *= 0.95; P += V
    return prev
def dust(base, prev, k):
    lay = np.zeros((H, W, 3), np.float32); am = np.zeros((H, W), np.float32)
    for p0, p1, c in zip(prev.astype(int), P.astype(int), C):
        cv2.line(lay, tuple(p0), tuple(p1), c.tolist(), 1, cv2.LINE_AA); cv2.line(am, tuple(p0), tuple(p1), 1.0, 1, cv2.LINE_AA)
    haze = cv2.GaussianBlur(am, (0, 0), 16); hc = cv2.GaussianBlur(lay, (0, 0), 16) / (haze[..., None] + 1e-3)
    hk = np.clip(haze * 1.6 * k, 0, 0.6)[..., None]
    lay = cv2.GaussianBlur(lay, (0, 0), 1.6); am = cv2.GaussianBlur(am, (0, 0), 1.6)[..., None] * 0.35 * k
    out = base * (1 - hk) + hc * hk
    return out * (1 - am) + lay * am
def warp(f, s, tx, ty, scale_in=1.0):
    M = np.float32([[s / scale_in, 0, tx], [0, s / scale_in, ty]])
    return cv2.warpAffine(f, M, (W, H), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)
A = (1.24, -230.0, -256.0); B = (1.761, -832.6, -2.5)
seq = []
for i in range(150): seq.append(down(orig[i]))
for i in range(28):
    e = sm(i / 27); s_, a_, _ = spoon_layer(DX * e, DY * e - 60 * np.sin(np.pi * e), 0, 0)
    seq.append((plate * (1 - a_) + s_ * a_).astype(np.uint8))
# hold a beat outside the bag
s_, a_, _ = spoon_layer(DX, DY, 0, 0)
for i in range(8): seq.append((plate * (1 - a_) + s_ * a_).astype(np.uint8))
# the coffee lifts off the spoon as fine grains and swirls round the bag; the spoon drifts up and away
hm = heap.astype(np.float32)
hy2, hx2 = np.where(heap > 0)
pick = rng.choice(len(hx2), 9000, replace=False)
Q = np.column_stack([hx2[pick] + DX, hy2[pick] + DY]).astype(np.float32)
QC = np.clip(spoon[hy2[pick], hx2[pick]] * 1.9 + 8, 0, 255)
QV = np.column_stack([rng.normal(0, 1.2, len(Q)), rng.normal(-2.5, 1.0, len(Q))]).astype(np.float32)
born = rng.uniform(0, 14, len(Q))  # grains leave the heap progressively
NR = 30
for j in range(NR):
    k = sm(j / (NR - 1))
    dx, dy = DX - 40 * k, DY - 520 * k ** 1.6
    # heap fades as its grains lift off; the spoon itself fades out near the top
    a_h = cv2.warpAffine(hm, np.float32([[1, 0, dx], [0, 1, dy]]), (W, H))
    M = np.float32([[1, 0, dx], [0, 1, dy]])
    s_ = cv2.warpAffine(spoon, M, (W, H), flags=cv2.INTER_CUBIC)
    a_ = cv2.warpAffine(sa, M, (W, H))
    hfade = np.clip(1 - j / 14, 0, 1)
    a_ = a_ * (1 - a_h * (1 - hfade)) * (1 - sm(np.clip((j - 18) / 11, 0, 1)))
    fr = plate * (1 - a_[..., None]) + s_ * a_[..., None]
    live = born <= j
    prev = Q.copy()
    d = CEN - Q; dist = np.hypot(d[:, 0], d[:, 1])[:, None] + 1
    sw = 0.4 + 0.6 * k
    acc = (d / dist * 1.3 + np.column_stack([-d[:, 1], d[:, 0]]) / dist * 2.4) * sw
    QV[live] += acc[live]; QV[live] *= 0.94
    Q[live] += QV[live]
    # spoon-carried grains not yet released ride with the spoon
    Q[~live, 1] = (hy2[pick][~live] + dy); Q[~live, 0] = (hx2[pick][~live] + dx); prev[~live] = Q[~live]
    if j >= 10: ring(int(1300 * sm((j - 10) / (NR - 11))))
    lay = np.zeros((H, W, 3), np.float32); am = np.zeros((H, W), np.float32)
    for p0, p1, c, lv in zip(prev.astype(int), Q.astype(int), QC, live):
        if not lv: continue
        cv2.line(lay, tuple(p0), tuple(p1), c.tolist(), 1, cv2.LINE_AA); cv2.line(am, tuple(p0), tuple(p1), 1.0, 1, cv2.LINE_AA)
    lay = cv2.GaussianBlur(lay, (0, 0), 1.3); am = cv2.GaussianBlur(am, (0, 0), 1.3)
    haze = cv2.GaussianBlur(am, (0, 0), 14); hc = cv2.GaussianBlur(lay, (0, 0), 14) / (haze[..., None] + 1e-3)
    hk = np.clip(haze * 1.8, 0, 0.55)[..., None]
    fr = fr * (1 - hk) + hc * hk
    aa = np.clip(am * 0.8, 0, 0.8)[..., None]; fr = fr * (1 - aa) + lay * aa
    if j >= 10:
        _ = step(); fr = dust(fr, _, sm((j - 10) / (NR - 11)))
    T = (1 + (A[0] - 1) * k, A[1] * k, A[2] * k)
    seq.append(warp(fr.astype(np.uint8), *T))
NP = 8
o0 = int(round(8.1 * 30)); XF = 18
for j in range(XF):
    ring(1500); prev = step(); fr = dust(plate.copy(), prev, 1.0)
    ours = warp(fr.astype(np.uint8), *A).astype(np.float32)
    ori = warp(orig[o0 + j], *B, scale_in=2.0).astype(np.float32)
    al = sm((j + 1) / (XF + 1))
    seq.append((ours * (1 - al) + ori * al).astype(np.uint8))
RL = 24
for j, i in enumerate(range(o0 + XF, len(orig))):
    k = sm(min(1, j / RL)); T = (B[0] + (1 - B[0]) * k, B[1] * (1 - k), B[2] * (1 - k))
    seq.append(warp(orig[i], *T, scale_in=2.0) if k < 1 else down(orig[i]))
print("frames", len(seq), "sec", round(len(seq) / FPS, 2))
np.save("markers.npy", np.array([150, 178, 186, 186 + NR, 186 + NR + XF, len(seq)]))
for name, size, crf in [("acilis-1920.mp4", (1920, 1080), 21), ("acilis-1280.mp4", (1280, 720), 23)]:
    p = subprocess.Popen(["ffmpeg", "-loglevel", "error", "-y", "-f", "rawvideo", "-pix_fmt", "bgr24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
        "-vf", f"scale={size[0]}:{size[1]}:flags=lanczos,format=yuv420p", "-an", "-c:v", "libx264", "-preset", "slow", "-crf", str(crf),
        "-g", "6", "-keyint_min", "6", "-sc_threshold", "0", "-bf", "0", "-movflags", "+faststart", OUT + "/" + name], stdin=subprocess.PIPE)
    for fr_ in seq: p.stdin.write(fr_.tobytes())
    p.stdin.close(); p.wait()
