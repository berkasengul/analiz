"""Build the 2560x1280 photo3d texture (front | back) + rows/outline for Bold Istanbul."""
import json
import numpy as np
import cv2
from PIL import Image

SRC = "front_a.jpg"
AX_S, TOP_S, BOT_S = 799.5, 248, 1403  # source axis / top / bottom (px)
HALF = 1280
TOP_T, H_T = 52, 1186                    # target top + height of can in texture px
AX_T = 0.4992 * HALF
s = H_T / (BOT_S - TOP_S)

a = np.asarray(Image.open(SRC).convert("RGB")).astype(np.float32)
d = np.abs(a - 217).sum(2)

# ---- per-row radius from the left silhouette edge (shadow sits on the right)
rad = np.zeros(a.shape[0], np.float32)
for y in range(TOP_S, BOT_S + 1):
    xs = np.where(d[y, : int(AX_S)] > 14)[0]
    if len(xs):
        rad[y] = AX_S - xs.min() + 0.5
# smooth + clamp body to a straight wall
r_med = rad.copy()
for y in range(TOP_S + 2, BOT_S - 1):
    r_med[y] = np.median(rad[y - 2 : y + 3])
body = np.median(r_med[400:1250])
r_med = np.minimum(r_med, body)
rad = r_med

# ---- source alpha (symmetric silhouette, anti-aliased)
yy, xx = np.mgrid[0 : a.shape[0], 0 : a.shape[1]].astype(np.float32)
alpha = np.clip(rad[:, None] - np.abs(xx + 0.5 - AX_S), 0, 1)
alpha[: TOP_S - 1] = 0
alpha[BOT_S + 2 :] = 0

# ---- resample source into the front half
M = np.float32([[s, 0, AX_T - AX_S * s], [0, s, TOP_T - TOP_S * s]])
rgba = np.dstack([a, alpha * 255])
front = cv2.warpAffine(rgba, M, (HALF, HALF), flags=cv2.INTER_CUBIC, borderValue=(0, 0, 0, 0))
front = np.clip(front, 0, 255)

# ---- band geometry per target column (from the front render)
fr = front[..., :3]
lum = fr.mean(2)
navy = (fr[..., 2] > fr[..., 0] + 15) & (lum < 170) & (front[..., 3] > 200)
y_tb = (int(TOP_T + (250 - TOP_S) * s), int(TOP_T + (345 - TOP_S) * s))
y_bb = (int(TOP_T + (1285 - TOP_S) * s), int(TOP_T + (1385 - TOP_S) * s))
x0 = int(AX_T - body * s) + 2
x1 = int(AX_T + body * s) - 2
cols = range(x0, x1 + 1)
tb0 = {}; tb1 = {}; bb0 = {}; bb1 = {}
def longest_run(mask, gap=6):
    idx = np.where(mask)[0]
    if not len(idx): return None
    runs = []; a = b = idx[0]
    for v in idx[1:]:
        if v - b <= gap: b = v
        else: runs.append((a, b)); a = b = v
    runs.append((a, b))
    return max(runs, key=lambda r: r[1] - r[0])
for x in cols:
    r = longest_run(navy[y_tb[0] : y_tb[1], x])
    q = longest_run(navy[y_bb[0] : y_bb[1], x])
    if r and q and r[1] - r[0] > 30 and q[1] - q[0] > 30:
        tb0[x], tb1[x] = y_tb[0] + r[0], y_tb[0] + r[1]
        bb0[x], bb1[x] = y_bb[0] + q[0], y_bb[0] + q[1]
xs_ok = sorted(tb0)
def smooth(dct):
    xv = np.array(xs_ok, np.float32); yv = np.array([dct[x] for x in xs_ok], np.float32)
    keep = np.ones(len(xv), bool)
    for _ in range(6):
        c = np.polyfit((xv[keep] - AX_T) ** 2, yv[keep], 1)
        fit = np.polyval(c, (xv - AX_T) ** 2)
        res = np.abs(yv - fit)
        thr = max(1.5, np.percentile(res[keep], 60) * 2.5)
        keep = res < thr
    print('fit', c, keep.mean())
    allx = np.array(list(cols), np.float32)
    return dict(zip(list(cols), np.polyval(c, (allx - AX_T) ** 2).tolist()))
tb0, tb1, bb0, bb1 = map(smooth, (tb0, tb1, bb0, bb1))
xs_ok = list(cols)

# ---- shading from the plain cream strip just under the top band
ref = np.array([248, 245, 240], np.float32)
R_lab0 = body * s
shade = {}
for x in xs_ok:
    y = int(round(tb1[x])) + 4
    shade[x] = np.clip(fr[y : y + 10, x].mean(0) / ref, 0.2, 1.08)

# ---- front paper colour per row (unshaded), sampled near both label edges where there is no artwork
paper = {}
edge_cols = [x for x in xs_ok if 0.80 * R_lab0 <= abs(x + 0.5 - AX_T) <= 0.93 * R_lab0]
y_lo = int(round(min(tb1.values()))) + 1
y_hi = int(round(max(bb0.values())))
for y in range(y_lo, y_hi):
    vals = []
    for x in edge_cols:
        if tb1[x] < y < bb0[x]:
            px = fr[y, x] / shade[x]
            if px.mean() > 150:
                vals.append(px)
    if vals:
        paper[y] = np.median(np.array(vals), 0)
ART0 = TOP_T + (700 - TOP_S) * s   # artwork band (sky/sunset/sea) on the front, target px
ART1 = TOP_T + (1105 - TOP_S) * s
ys_all = sorted(paper)
ys_p = [y for y in ys_all if y < ART0 or y > ART1]
arr = np.array([paper[y] for y in ys_p])
k = 12
arr = np.array([np.median(arr[max(0, i - k) : i + k + 1], 0) for i in range(len(arr))])
top_c = arr[[i for i, y in enumerate(ys_p) if y < ART0]][-20:].mean(0)
bot_i = [i for i, y in enumerate(ys_p) if y > ART1]
bot_c = arr[bot_i][:20].mean(0)
def paper_fn(y):
    if y < ART0 or y > ART1:
        i = int(np.clip(np.searchsorted(ys_p, y), 0, len(ys_p) - 1))
        return arr[i]
    t = (y - ART0) / (ART1 - ART0)
    t = t * t * (3 - 2 * t)
    return top_c * (1 - t) + bot_c * t
arr_s = np.array([paper_fn(y) for y in (ys_all[0], ys_all[-1])])
print("paper top", arr_s[0], "bottom", arr_s[-1])

# ---- back half: start from the front (lid + base metal), repaint bands + label
back = front.copy()
strip = cv2.cvtColor(cv2.imread("strip.png"), cv2.COLOR_BGR2RGB).astype(np.float32)
strip = cv2.GaussianBlur(strip, (0, 0), 1.6)
STRIP_BG = np.array([246, 242, 234], np.float32)
SH, SW = strip.shape[:2]
R_lab = body * s
for x in xs_ok:
    # band colour: median of navy (non-letter) pixels in this column
    col = fr[int(tb0[x]) : int(tb1[x]) + 1, x]
    col = col[col.mean(1) < 140]
    navy_c = np.median(col, 0) if len(col) else np.array([45, 52, 92], np.float32)
    col2 = fr[int(bb0[x]) : int(bb1[x]) + 1, x]
    col2 = col2[col2.mean(1) < 150]
    navy_b = np.median(col2, 0) if len(col2) else navy_c
    back[int(round(tb0[x])) : int(round(tb1[x])) + 1, x, :3] = navy_c
    back[int(round(bb0[x])) : int(round(bb1[x])) + 1, x, :3] = navy_b
    # label: cylindrical unwrap of the back strip (seen from behind -> left = -90deg)
    u = np.clip((x + 0.5 - AX_T) / R_lab, -0.9999, 0.9999)
    th = np.arcsin(u)
    sx = (th / np.pi + 0.5) * (SW - 1)
    ya, yb = int(round(tb1[x])) + 1, int(round(bb0[x]))
    ys = np.arange(ya, yb)
    f = (ys + 0.5 - (tb1[x] + 1)) / (bb0[x] - tb1[x] - 1)
    sy = np.clip(f, 0, 1) * (SH - 1)
    mapx = np.full((len(ys), 1), sx, np.float32)
    mapy = sy.astype(np.float32)[:, None]
    px = cv2.remap(strip, mapx, mapy, cv2.INTER_LINEAR)[:, 0]
    base = np.array([paper_fn(y) for y in ys], np.float32)
    px = px / STRIP_BG * base
    back[ya:yb, x, :3] = np.clip(px * shade[x], 0, 255)

tex = np.zeros((HALF, HALF * 2, 4), np.float32)
tex[:, :HALF] = front
tex[:, HALF:] = back
Image.fromarray(tex.astype(np.uint8), "RGBA").save("bold-istanbul-tex.png")
Image.fromarray(tex.astype(np.uint8), "RGBA").save("bold-istanbul-tex.webp", quality=92, method=6)

# ---- rows (240) + outline, normalised to the half texture
alpha_t = front[..., 3] / 255
rows = []
for i in range(240):
    y = int((i + 0.5) / 240 * HALF)
    xs = np.where(alpha_t[y] > 0.5)[0]
    rows.append(round(float((xs.max() - xs.min() + 1) / 2 / HALF), 4) if len(xs) else 0)
left, right = [], []
for y in range(TOP_T - 2, TOP_T + H_T + 3, 8):
    xs = np.where(alpha_t[min(y, HALF - 1)] > 0.5)[0]
    if len(xs):
        left.append([round(xs.min() / HALF, 4), round(y / HALF, 4)])
        right.append([round((xs.max() + 1) / HALF, 4), round(y / HALF, 4)])
outline = [left + right[::-1]]
json.dump({"rows": rows, "outline": outline, "axis": round(AX_T / HALF, 4)}, open("geom.json", "w"))
print("body radius px", body * s, "rows>0", sum(1 for r in rows if r), "max", max(rows))

# ---- 2D cut-out (for product section / cards), 458x1200 like the original
y0, y1 = TOP_T - 2, TOP_T + H_T + 3
xa, xb = int(AX_T - body * s) - 4, int(AX_T + body * s) + 5
cut = Image.fromarray(front[y0:y1, xa:xb].astype(np.uint8), "RGBA")
cut.thumbnail((458, 1200), Image.LANCZOS)
c2 = Image.new("RGBA", (458, 1200), (0, 0, 0, 0))
c2.alpha_composite(cut, ((458 - cut.width) // 2, (1200 - cut.height) // 2))
c2.save("cut-bold-istanbul.webp", quality=92)
