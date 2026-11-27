import cv2, numpy as np
im = cv2.imread("f5.0.png"); H, W = im.shape[:2]
f = im.astype(int); b, g, r = f[..., 0], f[..., 1], f[..., 2]; L = f.mean(2)
m = np.full((H, W), cv2.GC_BGD, np.uint8)
# probable region: around bowl + handle corridor to the top right
poly = np.array([[660, 640], [700, 280], [1150, 230], [1380, 0], [1560, 0], [1300, 330], [1290, 470], [1000, 660]], np.int32)
cv2.fillPoly(m, [poly], cv2.GC_PR_FGD)
brown = (r - b > 25) & (L > 25)
m[brown & (m == cv2.GC_PR_FGD)] = cv2.GC_FGD
# silver handle core (bright, low saturation) inside corridor
silver = (L > 120) & (np.abs(r - b) < 60)
m[silver & (m == cv2.GC_PR_FGD)] = cv2.GC_FGD
# bag rim / opening is background
m[650:, :] = cv2.GC_BGD
bgm = np.zeros((1, 65)); fgm = np.zeros((1, 65))
cv2.grabCut(im, m, None, bgm, fgm, 6, cv2.GC_INIT_WITH_MASK)
a = np.where((m == 1) | (m == 3), 255, 0).astype(np.uint8)
n, l, st, _ = cv2.connectedComponentsWithStats(a); k = 1 + np.argmax(st[1:, 4]); a = np.where(l == k, 255, 0).astype(np.uint8)
a = cv2.morphologyEx(a, cv2.MORPH_CLOSE, np.ones((7, 7), np.uint8))
a = cv2.GaussianBlur(a, (0, 0), 1.2)
cv2.imwrite("spoon_a.png", a)
prev = (im * (a[..., None] / 255.0) + np.array([0, 200, 0]) * (1 - a[..., None] / 255.0)).astype(np.uint8)
cv2.imwrite("spoon_prev.jpg", cv2.resize(prev, (960, 540)))
