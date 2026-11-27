# Scene with the Bold Istanbul can in place of the bag.
# usage: compose.py scene.png can_rgb.png out.png  (scene can be any width; geometry is from the 1672 px reference)
import cv2, numpy as np, sys
scene = cv2.imread(sys.argv[1]).astype(np.float32); H, W = scene.shape[:2]; k = W / 1672.0
can = cv2.imread(sys.argv[2]).astype(np.float32)
S = lambda v: int(round(v * k))
out = scene.copy()
_m = np.zeros((H, W), np.uint8)
cv2.rectangle(_m, (S(806), S(100)), (S(1134), S(782)), 255, -1)
cv2.fillPoly(_m, [np.array([[S(808), S(772)], [S(1132), S(772)], [S(1150), S(856)], [S(800), S(856)]], np.int32)], 255)
telea = cv2.inpaint(scene.astype(np.uint8), _m, max(3, S(9)), cv2.INPAINT_TELEA).astype(np.float32)
y0, y1 = S(98), S(860)
# side slivers: mirror the neighbouring background outward
for (xa, xb, axis) in [(S(806), S(850), S(806)), (S(1090), S(1134), S(1134))]:
    for x in range(xa, xb):
        sx = 2 * axis - x
        out[y0:y1, x] = scene[y0:y1, sx]
# top band above the can and the lower left sliver (saucer level): smooth fill
out[S(98):S(160), S(806):S(1134)] = telea[S(98):S(160), S(806):S(1134)]
out[S(640):S(790), S(806):S(850)] = telea[S(640):S(790), S(806):S(850)]
# centre of the marble below the bag: smooth fill plus a little grain
c0, c1 = S(806), S(1134)
# marble under the bag: follow the slanted front lip, blend the columns left and right of the bag
lip = lambda x: (852 + (x / k - 640) * 0.0773) * k
xl, xr = S(790), S(1150)
ys = np.arange(H)
def col(x0, x1, xa):
    # median along lines parallel to the lip, smoothed so beans and highlights do not streak
    c = np.zeros((H, 3), np.float32)
    for y in range(H):
        d = lip(xa) - y
        rows = [scene[int(np.clip(lip(x) - d, 0, H - 1)), x] for x in range(x0, x1, max(1, S(2)))]
        c[y] = np.median(np.array(rows), 0)
    return cv2.GaussianBlur(c[:, None, :], (0, 0), 7 * k)[:, 0]
cl, crr = col(S(776), S(806), xl - S(10)), col(S(1134), S(1164), xr + S(10))
fillm = np.zeros((H, W), np.float32)
rng = np.random.default_rng(2)
for x in range(S(806), S(1134)):
    yb = int(lip(x)) - 1
    t = (x - xl) / (xr - xl)
    for y in range(S(770), yb):
        d = lip(x) - y
        sl = int(np.clip(lip(xl - S(10)) - d, 0, H - 1)); sr = int(np.clip(lip(xr + S(10)) - d, 0, H - 1))
        v = cl[sl] * (1 - t) + crr[sr] * t
        out[y, x] = v + rng.normal(0, 2.0)
    fillm[S(770):yb, x] = 1
# feather the edit back into the original
em = np.zeros((H, W), np.float32)
em[y0:y1, S(806):S(1134)] = 1
em = cv2.GaussianBlur(em, (0, 0), max(1, 2 * k))
em2 = fillm.copy()
em2 = cv2.GaussianBlur(em2, (0, 0), max(1, 6 * k))
em = np.maximum(em, em2)[..., None]
out = scene * (1 - em) + out * em

# --- can matte (geometric body + coffee mound)
ci = can; h, w = ci.shape[:2]
b, gr, r = ci[..., 0], ci[..., 1], ci[..., 2]; L = (b + gr + r) / 3
a = cv2.imread("re/can_a_body.png", 0).astype(np.float32) / 255 if False else None
cx, hw = 257.5, 123.5
xs = np.arange(w)
body = np.zeros((h, w), np.float32)
Lr = L
edges = {}
for y in range(16, 80):
    gx = np.abs(np.diff(Lr[y])); e = [x for x in range(110, 410) if gx[x] > 22]
    if e and e[-1] - e[0] > 150: edges[y] = (e[0], e[-1] + 1)
for y in range(16, 640):
    if y >= 80: l, rr = cx - hw, cx + hw
    elif y in edges: l, rr = edges[y]
    else: continue
    body[y] = np.clip(np.minimum(xs - l + 0.5, rr - xs + 0.5), 0, 1)
top = min(edges)
for y in range(top, top + 12):
    t = (y - (top + 11)) / 11.0; half = hw * 0.97 * np.sqrt(max(0, 1 - t * t))
    body[y] = np.minimum(body[y], np.clip(np.minimum(xs - (cx - half) + 0.5, (cx + half) - xs + 0.5), 0, 1))
# round base of the can: an ellipse arc instead of the straight crop edge
for x in range(int(cx - hw) - 1, int(cx + hw) + 2):
    u = np.clip((x - cx) / hw, -1, 1); yb = 626 + 11 * np.sqrt(1 - u * u)
    for y in range(int(yb) - 1, h):
        body[y, x] *= np.clip(yb - y + 0.5, 0, 1)
ms = np.clip(((r - b) - 8) / 20, 0, 1) * (L < 180)
ms = cv2.GaussianBlur(ms.astype(np.float32), (0, 0), 2.2)
mound = np.clip((ms - 0.25) / 0.35, 0, 1)
mound[:540] = 0
# soft, ragged lower edge instead of the straight crop line
edge = 630 + 6 * cv2.GaussianBlur(np.random.default_rng(5).normal(0, 1, (1, w)).astype(np.float32), (0, 0), 4)[0] * 3
for x in range(w):
    for y in range(int(edge[x]) - 4, h):
        mound[y, x] *= np.clip((edge[x] + 4 - y) / 8, 0, 1)
mound = cv2.GaussianBlur(mound, (0, 0), 0.6)
alpha = np.clip(np.maximum(body, mound), 0, 1)
# warm the right edge a touch (lantern side), cool shadow on the left
sc = 255 * k / 247.0
nw, nh = int(round(w * sc)), int(round(h * sc))
hi = cv2.imread(sys.argv[4]).astype(np.float32) if len(sys.argv) > 4 else ci
cr = cv2.resize(hi, (nw, nh), interpolation=cv2.INTER_AREA if hi.shape[1] > nw else cv2.INTER_LANCZOS4)
xr_ = np.arange(nw) / sc
ramp = np.clip((xr_ - cx) / hw, -1, 1)[None, :, None]
warm = np.array([0.86, 0.98, 1.12], np.float32); cool = np.array([1.04, 0.97, 0.9], np.float32)
tint = 1 + np.clip(ramp, 0, 1) ** 3 * (warm - 1) + np.clip(-ramp, 0, 1) ** 3 * (cool - 1) * 0.6
cr = np.clip(cr * tint * 0.95, 0, 255)
ar = np.clip(cv2.resize(alpha, (nw, nh), interpolation=cv2.INTER_LINEAR), 0, 1)
ox = int(round(970 * k - cx * sc)); oy = int(round(786 * k - 637 * sc))
def paste(img, a, ox, oy, op=1.0):
    global out
    hh, ww = a.shape
    x0, y0_ = max(0, ox), max(0, oy); x1, y1_ = min(W, ox + ww), min(H, oy + hh)
    sub = out[y0_:y1_, x0:x1]; aa = a[y0_ - oy:y1_ - oy, x0 - ox:x1 - ox, None] * op
    out[y0_:y1_, x0:x1] = sub * (1 - aa) + img[y0_ - oy:y1_ - oy, x0 - ox:x1 - ox] * aa
# soft contact shadow
sh = np.zeros((H, W), np.float32)
cv2.ellipse(sh, (S(970), S(783)), (S(240), S(10)), 0, 0, 360, 1, -1)
sh = cv2.GaussianBlur(sh, (0, 0), S(10))[..., None]
out = out * (1 - sh * 0.55)
# reflection on the marble: mirrored can, fading out
ref = cr[::-1].copy(); ra = ar[::-1].copy()
fade = np.clip(1 - np.arange(nh) / (nh * 0.13), 0, 1) ** 1.4
ra = ra * fade[:, None] * np.clip(np.arange(nh) / (14 * sc), 0, 1)[:, None] ** 0.8
ref = cv2.GaussianBlur(ref, (0, 0), max(1, 3.0 * k)); ra = cv2.GaussianBlur(ra, (0, 0), max(1, 3.0 * k))
paste(ref, ra, ox, int(round(786 * k)) - int(round(10 * sc)), 0.6)
paste(cr, ar, ox, oy)
cv2.imwrite(sys.argv[3], np.clip(out, 0, 255).astype(np.uint8), [cv2.IMWRITE_PNG_COMPRESSION, 3])
