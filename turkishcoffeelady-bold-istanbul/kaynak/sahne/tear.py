import cv2, numpy as np
im = cv2.imread("re/hero_2560.png").astype(np.float32); H, W = im.shape[:2]
L = im.mean(2)
# bag edges on the crimp rows
row = L[195]; xs = np.where(row[1150:1800] > 120)[0] + 1150
x0, x1 = int(xs[0]), int(xs[-1]) + 1
y0, y1 = 172, 216
print("strip", x0, x1, y0, y1)
# strip layer (with a ragged tear line at its bottom)
pad = 6
sx0, sx1, sy0, sy1 = x0 - pad, x1 + pad, y0 - pad, y1 + 4
strip = im[sy0:sy1, sx0:sx1].copy()
a = np.zeros(strip.shape[:2], np.float32)
rng = np.random.default_rng(7)
tear = y1 - 1 + np.cumsum(rng.normal(0, 0.6, sx1 - sx0)); tear = np.clip(tear, y1 - 4, y1 + 3)
for i, x in enumerate(range(sx0, sx1)):
    for j, y in enumerate(range(sy0, sy1)):
        inside_x = np.clip(min(x - x0 + 0.5, x1 - x + 0.5), 0, 1)
        inside_y = np.clip(min(y - y0 + 1.5, tear[i] - y), 0, 1)
        a[j, i] = inside_x * inside_y
rgba = np.dstack([strip, a * 255]).astype(np.uint8)
cv2.imwrite("re/strip.png", rgba)
# torn hero: background in place of the strip, ragged white edge on the bag
out = im.copy()
lc = im[y0 - 4:y1 + 6, x0 - 30:x0 - 8].mean(1); rc = im[y0 - 4:y1 + 6, x1 + 8:x1 + 30].mean(1)
for i, x in enumerate(range(x0 - 8, x1 + 8)):
    t = (x - (x0 - 8)) / (x1 - x0 + 16)
    for j, y in enumerate(range(y0 - 4, y1 + 6)):
        if y >= tear[min(max(i - (x0 - 8 - sx0) * -1, 0), len(tear) - 1)] - 0.5 and x0 <= x < x1: continue
        out[y, x] = lc[j] * (1 - t) + rc[j] * t + rng.normal(0, 1.5)
# feather
m = np.zeros((H, W), np.float32); m[y0 - 4:y1 + 6, x0 - 8:x1 + 8] = 1
m = cv2.GaussianBlur(m, (0, 0), 1.2)[..., None]
out = im * (1 - m) + out * m
cv2.imwrite("re/hero_torn.png", np.clip(out, 0, 255).astype(np.uint8))
