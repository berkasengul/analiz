"""Kutu yüzeyindeki yoğuşma damlacıkları için tekrarlanan normal haritası.

Kullanım: python3 droplets-generator.py <çıktı.png>
"""
import sys

import numpy as np
from PIL import Image

N = 1024
rng = np.random.default_rng(5)
h = np.zeros((N, N), np.float32)
yy, xx = np.mgrid[0:N, 0:N].astype(np.float32)


def drop(cx, cy, r, stretch):
    # Kenarları sarmalanan (tile) yarım küre yükseklik alanı.
    dx = (xx - cx + N / 2) % N - N / 2
    dy = ((yy - cy + N / 2) % N - N / 2) / stretch
    d2 = (dx * dx + dy * dy) / (r * r)
    dome = np.sqrt(np.clip(1 - d2, 0, 1)) * r
    np.maximum(h, dome, out=h)


for _ in range(900):
    drop(rng.uniform(0, N), rng.uniform(0, N), rng.uniform(3, 9), rng.uniform(1.0, 1.3))
for _ in range(160):
    drop(rng.uniform(0, N), rng.uniform(0, N), rng.uniform(10, 22), rng.uniform(1.05, 1.5))
for _ in range(18):
    drop(rng.uniform(0, N), rng.uniform(0, N), rng.uniform(24, 34), rng.uniform(1.2, 1.8))

gx = (np.roll(h, -1, 1) - np.roll(h, 1, 1)) * 0.5
gy = (np.roll(h, -1, 0) - np.roll(h, 1, 0)) * 0.5
n = np.stack([-gx, gy, np.ones_like(h)], -1)
n /= np.linalg.norm(n, axis=-1, keepdims=True)
img = ((n * 0.5 + 0.5) * 255).astype(np.uint8)
Image.fromarray(img, "RGB").save(sys.argv[1], optimize=True)
print("ok", sys.argv[1])
