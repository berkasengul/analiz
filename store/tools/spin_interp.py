"""Turntable karelerinin arasına hareket telafili ara kare ekler (60 → 120 kare).

Kullanım (store klasöründen):
    python3 tools/spin_interp.py                 # 120'den az karesi olan tüm modeller
    python3 tools/spin_interp.py gezegenler      # tek model

Her komşu kare çifti için iki yönde optik akış (DIS) hesaplanır; iki kare de tam ortadaki
açıya kaydırılıp şeffaflık ağırlıklı karıştırılır. Dönüş adımı yarıya iner (6° → 3°): model
dönerken kareler arasındaki geçiş çift görüntü (hayalet) bırakmaz, akıcı görünür.
Ardından `python3 tools/spin_ground.py --write` ile zemin ölçümleri yenilenmelidir.
"""
import json
import os
import sys

import cv2
import numpy as np
from PIL import Image

STORE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SPINS = os.path.join(STORE, 'js', 'spins.js')
TARGET = 120


def load(path):
    a = np.array(Image.open(path).convert('RGBA')).astype(np.float32) / 255.0
    return a


def gray(a):
    # Akış için nötr griye bindirilmiş görüntü: silüet kenarı da hareketi taşır
    rgb = a[..., :3] * a[..., 3:4] + 0.5 * (1 - a[..., 3:4])
    return cv2.cvtColor((rgb * 255).astype(np.uint8), cv2.COLOR_RGB2GRAY)


def warp(a, flow, t):
    h, w = a.shape[:2]
    gx, gy = np.meshgrid(np.arange(w, dtype=np.float32), np.arange(h, dtype=np.float32))
    mx = gx - t * flow[..., 0]
    my = gy - t * flow[..., 1]
    return cv2.remap(a, mx, my, cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=0)


def midpoint(a, b, dis):
    ga, gb = gray(a), gray(b)
    f_ab = dis.calc(ga, gb, None)
    f_ba = dis.calc(gb, ga, None)
    # Ortadaki karede p noktası, A'da p − ½·akış(A→B), B'de p − ½·akış(B→A) konumundadır
    wa = warp(a, f_ab, 0.5)
    wb = warp(b, f_ba, 0.5)
    aa, ab = wa[..., 3:4], wb[..., 3:4]
    s = aa + ab
    rgb = np.where(s > 1e-4, (wa[..., :3] * aa + wb[..., :3] * ab) / np.maximum(s, 1e-4), 0)
    alpha = np.clip(s / 2, 0, 1)
    out = np.concatenate([rgb, alpha], -1)
    return (np.clip(out, 0, 1) * 255 + 0.5).astype(np.uint8)


def main():
    text = open(SPINS).read()
    data = json.loads(text[text.index('{'):text.rindex('}') + 1])
    names = [a for a in sys.argv[1:] if not a.startswith('--')] or [k for k, v in data.items() if len(v['frames']) < TARGET]
    dis = cv2.DISOpticalFlow_create(cv2.DISOPTICAL_FLOW_PRESET_MEDIUM)
    for k in names:
        v = data[k]
        n = len(v['frames'])
        if n >= TARGET:
            print(k, 'zaten', n, 'kare')
            continue
        frames = [load(os.path.join(STORE, f)) for f in v['frames']]
        raw = [open(os.path.join(STORE, f), 'rb').read() for f in v['frames']]  # özgün kareler aynen korunur
        d = os.path.join(STORE, 'assets', 'spin', k)
        out = []
        for i in range(n):
            a = frames[i]
            b = frames[(i + 1) % n]
            mid = midpoint(a, b, dis)
            out.append(raw[i])
            out.append(mid)
        paths = []
        for j, im in enumerate(out):
            p = os.path.join(d, f'{j:03d}.webp')
            if isinstance(im, bytes):
                open(p, 'wb').write(im)
            else:
                Image.fromarray(im, 'RGBA').save(p, 'WEBP', quality=62, method=4)
            paths.append(f'assets/spin/{k}/{j:03d}.webp')
        v['frames'] = paths
        size = sum(os.path.getsize(os.path.join(d, f'{j:03d}.webp')) for j in range(len(out))) // 1024
        print(k, n, '->', len(out), 'kare,', size, 'KB', flush=True)
        open(SPINS, 'w').write(text[:text.index('export const SPINS')] + 'export const SPINS = '
                               + json.dumps(data, separators=(',', ':')) + ';\n')
        text = open(SPINS).read()


if __name__ == '__main__':
    main()
