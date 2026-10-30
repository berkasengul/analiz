"""Birkaç sabit görünüşten (ön / 3/4 / yan / arka) 120 karelik turntable üretir.

Kullanım (store klasöründen):
    python3 tools/views_to_spin.py mavi-kareli

Girdi: assets/photo/<ad>/{on,yarim,yan,arka}.webp — arka planı temizlenmiş, figüre göre kırpılmış
görünüşler (sağa bakan 3/4 ve yan). Çıktı: assets/spin/<ad>/000..119.webp ve js/spins.js içinde
kayıt (kareler, en-boy oranı, zemin verisi).

Görünüşler aynı boya ölçeklenir, ayak tabanı aynı satıra ve gövde ekseni aynı sütuna hizalanır.
Komşu iki görünüş arasındaki açılar için iki yönde optik akış (DIS) hesaplanır; iki görüntü de
ara açıya bükülüp karıştırılır (tools/spin_interp.py ile aynı yöntem). Mevcut Tripo karelerinde
figür önce izleyicinin soluna döner; sağa bakan görünüşler 180–360°, aynaları 0–180° aralığına
yerleşir.
"""
import json
import os
import sys

import cv2
import numpy as np
from PIL import Image

STORE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SPINS = os.path.join(STORE, 'js', 'spins.js')
N = 120
H = 1528           # kare yüksekliği (mevcut modellerle aynı)
FIG_H = 1500       # baştan tabana figür boyu (piksel)
GROUND = 0.012     # taban satırının alttan payı (kare boyuna oran)
KEYS = [('on', 0), ('yarim', 35), ('yan', 90), ('arka', 180)]


def load_view(path):
    im = Image.open(path).convert('RGBA')
    a = np.array(im)
    ys, xs = np.nonzero(a[..., 3] > 40)
    a = a[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
    k = FIG_H / a.shape[0]
    a = cv2.resize(a, (round(a.shape[1] * k), FIG_H), interpolation=cv2.INTER_LANCZOS4)
    # Gövde ekseni: bacakların (alt yarı, tabanlar hariç) alfa ağırlık merkezi
    al = a[..., 3].astype(np.float32)
    band = al[int(FIG_H * 0.55):int(FIG_H * 0.9)]
    cx = float((band.sum(0) * np.arange(band.shape[1])).sum() / max(1, band.sum()))
    return a, cx


def place(a, cx, W):
    canvas = np.zeros((H, W, 4), np.uint8)
    bottom = H - round(GROUND * H)
    top = bottom - a.shape[0]
    x0 = round(W / 2 - cx)
    sx0, sx1 = max(0, -x0), min(a.shape[1], W - x0)
    canvas[top:bottom, x0 + sx0:x0 + sx1] = a[:, sx0:sx1]
    return canvas


def premul_gray(a):
    rgb = a[..., :3].astype(np.float32)
    al = a[..., 3:4].astype(np.float32) / 255
    g = cv2.cvtColor((rgb * al + 128 * (1 - al)).astype(np.uint8), cv2.COLOR_RGB2GRAY)
    return g


def warp(a, flow, t):
    h, w = flow.shape[:2]
    gx, gy = np.meshgrid(np.arange(w, dtype=np.float32), np.arange(h, dtype=np.float32))
    mx = gx + flow[..., 0] * t
    my = gy + flow[..., 1] * t
    rgb = a[..., :3].astype(np.float32) * (a[..., 3:4].astype(np.float32) / 255)
    pre = np.dstack([rgb, a[..., 3].astype(np.float32)])
    out = cv2.remap(pre, mx, my, cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=0)
    return out


def blend(A, B, fAB, fBA, t, span=90):
    # A'dan B'ye t oranında: A, B'ye doğru t kadar; B, A'ya doğru (1−t) kadar bükülür
    wa = warp(A, fBA, t)      # hedef pikselden A'ya bakan akış
    wb = warp(B, fAB, 1 - t)
    # Çift görüntü olmasın: her an tek görünüş baskın, geçiş aralığın ortasında kısa sürer
    win = min(0.3, 4.5 / span)  # yaklaşık bir karelik geçiş
    u = min(1.0, max(0.0, (t - 0.5 + win / 2) / win))
    s = 3 * u * u - 2 * u * u * u
    pre = wa * (1 - s) + wb * s
    # Geçiş karesinde silüet yarı saydam kalmasın: alfa ikisinin büyüğü
    al = np.clip(np.maximum(wa[..., 3], wb[..., 3]) if 0 < s < 1 else pre[..., 3], 0, 255)
    pre = pre.copy()
    mix_al = np.maximum(pre[..., 3:4], 1)
    pre[..., :3] = pre[..., :3] / mix_al * al[..., None]
    rgb = np.where(al[..., None] > 0.5, pre[..., :3] / np.maximum(al[..., None], 1) * 255, 0)
    return np.dstack([np.clip(rgb, 0, 255), al]).astype(np.uint8)


def main(name):
    src = os.path.join(STORE, 'assets', 'photo', name)
    views = {k: load_view(os.path.join(src, f'{k}.webp')) for k, _ in KEYS}
    W = int(max(a.shape[1] for a, _ in views.values()) * 1.08) // 2 * 2
    placed = {k: place(a, cx, W) for k, (a, cx) in views.items()}
    dis = cv2.DISOpticalFlow_create(cv2.DISOPTICAL_FLOW_PRESET_MEDIUM)
    flows = {}
    for (ka, _), (kb, _) in zip(KEYS, KEYS[1:]):
        ga, gb = premul_gray(placed[ka]), premul_gray(placed[kb])
        # Akış gürültüsü (yırtılma, çift yüz) olmasın: alan yumuşatılır ve bükme payı azaltılır
        sm = lambda f: cv2.GaussianBlur(f, (0, 0), 14) * 0.75
        flows[(ka, kb)] = (sm(dis.calc(ga, gb, None)), sm(dis.calc(gb, ga, None)))
    # Sağa bakış yönünde 0..180° dizisi
    seq = {}
    for deg in range(0, 181, 3):
        for (ka, a0), (kb, a1) in zip(KEYS, KEYS[1:]):
            if a0 <= deg <= a1:
                break
        t = (deg - a0) / (a1 - a0)
        if t < 1e-6:
            seq[deg] = placed[ka]
        elif t > 1 - 1e-6:
            seq[deg] = placed[kb]
        else:
            fAB, fBA = flows[(ka, kb)]
            seq[deg] = blend(placed[ka], placed[kb], fAB, fBA, t, a1 - a0)
    out_dir = os.path.join(STORE, 'assets', 'spin', name)
    os.makedirs(out_dir, exist_ok=True)
    frames = []
    for i in range(N):
        ang = i * 3
        if ang <= 180:
            img = seq[ang][:, ::-1]      # sola dönüş: sağa bakan görünüşün aynası
        else:
            img = seq[360 - ang]
        Image.fromarray(np.ascontiguousarray(img)).save(os.path.join(out_dir, f'{i:03d}.webp'), quality=88, method=6)
        frames.append(f'assets/spin/{name}/{i:03d}.webp')
    top = (H - round(GROUND * H) - FIG_H) / H
    entry = {'frames': frames, 'aspect': round(W / H, 4),
             'ground': {'g': GROUND, 'tilt': 0.1, 'feet': [], 'hw': 0.05, 'top': round(top, 4), 'soles': []}}
    s = open(SPINS, encoding='utf-8').read()
    head, body = s[:s.index('{')], s[s.index('{'):s.rindex('}') + 1]
    tail = s[s.rindex('}') + 1:]
    data = json.loads(body)
    data[name] = entry
    open(SPINS, 'w', encoding='utf-8').write(head + json.dumps(data, ensure_ascii=False, separators=(',', ':')) + tail)
    print(name, N, 'kare', f'{W}x{H}', 'aspect', entry['aspect'])


if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else 'mavi-kareli')
