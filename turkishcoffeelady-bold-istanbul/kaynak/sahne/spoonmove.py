import cv2, numpy as np, subprocess
im = cv2.imread("f5.0.png").astype(np.float32); H, W = im.shape[:2]
a0 = cv2.imread("spoon_a.png", 0).astype(np.float32) / 255
a = a0.copy()
# keep only the handle corridor above the bowl
yy, xx = np.mgrid[0:H, 0:W]
p0, p1 = np.array([1240, 300.0]), np.array([1520, -20.0])
d = p1 - p0; t = np.clip(((xx - p0[0]) * d[0] + (yy - p0[1]) * d[1]) / (d @ d), 0, 1)
dist = np.hypot(xx - (p0[0] + t * d[0]), yy - (p0[1] + t * d[1]))
corridor = (dist < 30) | ((yy > 255) & (xx > 660) & (xx < 1300))
a = a * corridor
a[yy > 652] = 0
# the handle is ~95 px wide at the top; anything to its right in those rows is background
for y in range(0, 200):
    xs = np.where(a[y] > 0.5)[0]
    if len(xs): a[y, xs[0] + 95:] = 0
a = cv2.morphologyEx(a, cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (11, 11)))
a = cv2.GaussianBlur(a, (0, 0), 0.8)
# background plate without the spoon
hole = (cv2.dilate((np.maximum(a0, a) > 0.02).astype(np.uint8), np.ones((41, 41), np.uint8)) * 255)
hole[655:] = 0
# row-wise fill from the dark background left and right of the hole (no smearing of the bright bag rim)
plate = im.copy()
for y in range(H):
    xs = np.where(hole[y] > 0)[0]
    if not len(xs): continue
    l, r = max(0, xs[0] - 1), min(W - 1, xs[-1] + 1)
    lc = im[y, max(0, l - 12):l + 1].mean(0); rc = im[y, r:min(W, r + 13)].mean(0)
    t = np.linspace(0, 1, r - l + 1)[:, None]
    plate[y, l:r + 1] = lc * (1 - t) + rc * t
bl = cv2.GaussianBlur(plate, (0, 0), 18)
hm = cv2.GaussianBlur(hole.astype(np.float32) / 255, (0, 0), 8)[..., None]
plate = bl
plate = im * (1 - hm) + plate * hm
cv2.imwrite("plate.png", plate.astype(np.uint8)); cv2.imwrite("spoon_a2.png", (np.clip(a,0,1)*255).astype(np.uint8))
spoon = im.copy()
DX, DY = -560, -70
def place(dx, dy, ang=0.0):
    M = cv2.getRotationMatrix2D((960, 470), ang, 1.0); M[:, 2] += (dx, dy)
    s = cv2.warpAffine(spoon, M, (W, H), flags=cv2.INTER_CUBIC)
    aa = cv2.warpAffine(a, M, (W, H), flags=cv2.INTER_LINEAR)[..., None]
    return plate * (1 - aa) + s * aa
cv2.imwrite("start_new.png", place(DX, DY).astype(np.uint8))
# slide animation (0.9 s at 30 fps): gentle arc up and to the left
frames = []
for i in range(28):
    k = i / 27; e = k * k * (3 - 2 * k)
    lift = -60 * np.sin(np.pi * e)
    frames.append(place(DX * e, DY * e + lift).astype(np.uint8))
p = subprocess.Popen(["ffmpeg", "-loglevel", "error", "-y", "-f", "rawvideo", "-pix_fmt", "bgr24", "-s", f"{W}x{H}", "-r", "30", "-i", "-",
    "-c:v", "libx264", "-crf", "14", "-pix_fmt", "yuv420p", "slide.mp4"], stdin=subprocess.PIPE)
for f in frames: p.stdin.write(f.tobytes())
p.stdin.close(); p.wait()
cv2.imwrite("start_new_s.jpg", cv2.resize(place(DX, DY).astype(np.uint8), (960, 540)))
