import cv2, sys, numpy as np
sr = cv2.dnn_superres.DnnSuperResImpl_create(); sr.readModel(sys.argv[3]); sr.setModel("edsr", 4)
im = cv2.imread(sys.argv[1]); H, W = im.shape[:2]
# tile to keep memory sane
T = 240; P = 12; out = np.zeros((H * 4, W * 4, 3), np.uint8)
for y in range(0, H, T):
    for x in range(0, W, T):
        x0, y0 = max(0, x - P), max(0, y - P); x1, y1 = min(W, x + T + P), min(H, y + T + P)
        r = sr.upsample(im[y0:y1, x0:x1])
        ox, oy = (x - x0) * 4, (y - y0) * 4; w, h = min(T, W - x) * 4, min(T, H - y) * 4
        out[y * 4:y * 4 + h, x * 4:x * 4 + w] = r[oy:oy + h, ox:ox + w]
cv2.imwrite(sys.argv[2], out)
