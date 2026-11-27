# v1 (from 1.9 s) + matched dissolve + v2 (from 2.3 s): skips the shot where the spoon pours back into the bag
import cv2, numpy as np, subprocess, sys
def frames(p):
    c = cv2.VideoCapture(p); out = []
    while True:
        ok, f = c.read()
        if not ok: break
        out.append(f)
    return out
v1, v2 = frames("v1.mp4"), frames("v2.mp4")
W, H = 1920, 1080
def warp(f, s, tx, ty):
    M = np.float32([[s, 0, tx], [0, s, ty]])
    return cv2.warpAffine(f, M, (W, H), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)
sm = lambda t: t * t * (3 - 2 * t)
A = (1.15, -144.0, -150.0)      # v1 pushed in
B = (1.391, -421.8, -19.5)      # v2 framed to match v1 under A (bag front rim + width)
lerp = lambda a, b, k: tuple(x + (y - x) * k for x, y in zip(a, b))
I = (1.0, 0.0, 0.0)
s1, e1 = 47, len(v1)            # v1 1.9 s .. end
ramp0, ramp1 = e1 - 24, e1 - 12 # push-in on v1
x0 = e1 - 12                    # dissolve starts
s2 = 58                         # v2 2.3 s
relax = 20
seq = []
for i in range(s1, x0):
    k = sm(np.clip((i - ramp0) / (ramp1 - ramp0), 0, 1))
    seq.append(warp(v1[i], *lerp(I, A, k)))
for j in range(12):
    a = sm((j + 1) / 13)
    f1 = warp(v1[x0 + j], *A).astype(np.float32); f2 = warp(v2[s2 + j], *B).astype(np.float32)
    seq.append((f1 * (1 - a) + f2 * a).astype(np.uint8))
for j, i in enumerate(range(s2 + 12, len(v2))):
    k = sm(np.clip(j / relax, 0, 1))
    seq.append(warp(v2[i], *lerp(B, I, k)) if k < 1 else v2[i])
print("frames", len(seq), "duration", len(seq) / 25)
for name, size, crf in [("acilis-1920.mp4", (1920, 1080), 22), ("acilis-1280.mp4", (1280, 720), 23)]:
    p = subprocess.Popen(["ffmpeg", "-loglevel", "error", "-y", "-f", "rawvideo", "-pix_fmt", "bgr24", "-s", "1920x1080", "-r", "25", "-i", "-",
        "-vf", f"scale={size[0]}:{size[1]}:flags=lanczos,format=yuv420p", "-an", "-c:v", "libx264", "-preset", "slow", "-crf", str(crf),
        "-g", "6", "-keyint_min", "6", "-sc_threshold", "0", "-bf", "0", "-movflags", "+faststart", sys.argv[1] + "/" + name], stdin=subprocess.PIPE)
    for f in seq: p.stdin.write(f.tobytes())
    p.stdin.close(); p.wait()
