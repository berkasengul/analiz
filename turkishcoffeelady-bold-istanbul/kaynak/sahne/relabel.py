# put the real Bold Istanbul can (front render with crisp text) into the video can crop, keeping the coffee mound in front
import cv2, numpy as np, sys
tex = cv2.imread("can/bold-istanbul-tex.png", cv2.IMREAD_UNCHANGED)
front = tex[:, :1280]
a = front[..., 3]
ys, xs = np.where(a > 128)
x0, x1, y0, y1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
can = front[y0:y1, x0:x1]
print("real can bbox", x0, x1, y0, y1, "aspect", (x1 - x0) / (y1 - y0))
def build(base_path, out_path, f):
    base = cv2.imread(base_path).astype(np.float32)
    h, w = base.shape[:2]
    cw = 247 * f; sc = cw / (x1 - x0)
    nw, nh = int(round((x1 - x0) * sc)), int(round((y1 - y0) * sc * 0.955))
    c = cv2.resize(can, (nw, nh), interpolation=cv2.INTER_AREA if sc < 1 else cv2.INTER_LANCZOS4).astype(np.float32)
    ox = int(round(257.5 * f - nw / 2)); oy = int(round(17 * f))
    ca = np.zeros((h, w), np.float32); cc = np.zeros_like(base)
    yy0, yy1 = oy, min(h, oy + nh)
    ca[yy0:yy1, ox:ox + nw] = c[: yy1 - yy0, :, 3] / 255
    cc[yy0:yy1, ox:ox + nw] = c[: yy1 - yy0, :, :3]
    # keep the coffee mound in front of the can base
    b, g, r = base[..., 0], base[..., 1], base[..., 2]; L = base.mean(2)
    ms = np.clip(((r - b) - 8) / 20, 0, 1) * (L < 180)
    ms[: int(540 * f)] = 0
    ms = cv2.GaussianBlur(ms, (0, 0), 2.2 * f)
    mound = np.clip((ms - 0.25) / 0.35, 0, 1)
    k = (ca * (1 - mound))[..., None]
    # match the scene: a touch cooler/darker than the studio render, light from the window side
    xs_ = (np.arange(w) - 257.5 * f) / (123.5 * f)
    shade = (1 - 0.10 * np.clip(-xs_, 0, 1) ** 2)[None, :, None]
    cc = cc * shade * np.array([1.0, 0.98, 0.95], np.float32)
    out = base * (1 - k) + cc * k
    cv2.imwrite(out_path, np.clip(out, 0, 255).astype(np.uint8))
build("re/can_rgb.png", "re/can_rgb2.png", 1)
build("re/can_x4.png", "re/can_x4_2.png", 4)
