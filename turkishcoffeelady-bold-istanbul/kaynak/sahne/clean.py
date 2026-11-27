import cv2, numpy as np, sys
im = cv2.imread(sys.argv[1]); H, W = im.shape[:2]
lab = cv2.cvtColor(im, cv2.COLOR_BGR2LAB); L = lab[:, :, 0].astype(np.float32)
bg = cv2.medianBlur(lab[:, :, 0], 31).astype(np.float32)
mask = np.zeros((H, W), np.uint8)
def text(x0, y0, x1, y1, thr=22):
    d = (L - bg)[y0:y1, x0:x1]
    m = (d > thr).astype(np.uint8) * 255
    mask[y0:y1, x0:x1] |= m
def box(x0, y0, x1, y1):
    mask[y0:y1, x0:x1] = 255
text(30, 12, 1650, 78)
text(0, 76, W, 90, 8)
text(95, 150, 190, 185)
text(95, 190, 530, 585, 18)
text(95, 590, 445, 630)
text(70, 878, 810, 922, 12)
text(0, 908, 1360, 922, 6)
box(1452, 878, 1648, 934)
mask = cv2.dilate(mask, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7)))
cv2.imwrite(sys.argv[3], mask)
out = cv2.inpaint(im, mask, 6, cv2.INPAINT_TELEA)
# soften the filled areas a little so the strokes do not leave ghosts
blur = cv2.GaussianBlur(out, (0, 0), 3)
mf = cv2.GaussianBlur(mask, (0, 0), 3).astype(np.float32)[..., None] / 255
out = (out * (1 - mf * 0.7) + blur * mf * 0.7).astype(np.uint8)
cv2.imwrite(sys.argv[2], out)
