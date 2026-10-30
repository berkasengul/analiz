"""Turntable karelerinde kafayı başka bir dönüşün (aynı açıdaki) kafasıyla değiştirir.

Kullanım (store klasöründen):
    python3 tools/head_swap.py <govde_klasoru> <kafa_klasoru> <cikti_klasoru>

Gövde: Tripo 3D dönüşü (tutarlı, akıcı); kafa: fotoğraf görünüşlerinden üretilmiş dönüş
(gerçek fotoğraf kalitesinde yüz). Her iki dizi de aynı açı düzenindedir (kare i = i·3°).
Her karede iki görüntüde de yaka çizgisi (mavi pijamanın başladığı satır) bulunur; fotoğraf
kafası, baş tepesinden yakaya olan boy eşitlenecek şekilde ölçeklenir, yatayda kafa merkezine
hizalanır. Gövdenin yaka üstündeki kafası silinir, yeni kafa yerleştirilir ve boyun bölgesinde
yumuşak bir geçişle birleştirilir; ten rengi gövdenin elleriyle uyumlu olacak şekilde dengelenir.
"""
import glob
import os
import sys

import cv2
import numpy as np
from PIL import Image


def load(f):
    return np.array(Image.open(f).convert('RGBA')).astype(np.float32)


def bluish(a):
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    return (b > r + 12) & (a[..., 3] > 128)


def landmarks(a):
    al = a[..., 3] > 128
    rows = np.nonzero(al.any(1))[0]
    top, bot = rows[0], rows[-1]
    H = bot - top
    blue = bluish(a)
    neck = None
    for y in range(top + int(H * 0.08), top + int(H * 0.35)):
        w = al[y].sum()
        if w and blue[y].sum() > 0.3 * w:
            neck = y
            break
    if neck is None:
        neck = top + int(H * 0.17)
    head = al[top:neck] & ~blue[top:neck]
    ys, xs = np.nonzero(head)
    cx = xs.mean() if len(xs) else al.shape[1] / 2
    hw = (np.percentile(xs, 97) - np.percentile(xs, 3)) if len(xs) else H * 0.12
    return top, neck, cx, hw


def skin_mean(a, y0, y1):
    reg = a[y0:y1]
    r, g, b, al = reg[..., 0], reg[..., 1], reg[..., 2], reg[..., 3]
    m = (al > 200) & (r > g) & (g > b) & (r - b > 25) & (r < 250)
    return reg[..., :3][m].mean(0) if m.sum() > 50 else None


def swap(body, head):
    out = body.copy()
    bt, bn, bcx, bhw = landmarks(body)
    ht, hn, hcx, hhw = landmarks(head)
    s = (bn - bt) / max(1, hn - ht)
    # Fotoğraf kafası: tepe → yakanın biraz altı (boyun geçişi için pay)
    pad = int((hn - ht) * 0.12)
    crop = head[max(0, ht - 4):hn + pad]
    nh = max(1, round(crop.shape[0] * s))
    nw = max(1, round(crop.shape[1] * s))
    crop = cv2.resize(crop, (nw, nh), interpolation=cv2.INTER_AREA if s < 1 else cv2.INTER_CUBIC)
    # Ten rengini gövdenin ellerine/boynuna yaklaştır
    bs = skin_mean(body, bt + int((bn - bt) * 0.5), bn + int((bn - bt) * 0.4))
    hs = skin_mean(crop, int(nh * 0.4), nh)
    if bs is not None and hs is not None:
        skin = (crop[..., 0] > crop[..., 1]) & (crop[..., 1] > crop[..., 2])
        k = np.clip(bs / np.maximum(hs, 1), 0.85, 1.15)
        crop[..., :3] = np.where(skin[..., None], np.clip(crop[..., :3] * (0.5 + 0.5 * k), 0, 255), crop[..., :3])
    y0 = bt - round(4 * s)
    x0 = round(bcx - hcx * s)
    Hh, Ww = out.shape[:2]
    # Gövdenin yaka üstündeki kafası silinir (omuzlar kalır)
    cut = bn - int((bn - bt) * 0.04)
    half = max(bhw, hhw * s) * 0.75
    xs = np.arange(Ww)
    zone = np.abs(xs - bcx) < half
    out[:cut, zone, 3] = 0
    # Yeni kafayı yerleştir; yaka bandında yumuşak geçiş
    canvas = np.zeros_like(out)
    sy0, sx0 = max(0, -y0), max(0, -x0)
    dy0, dx0 = max(0, y0), max(0, x0)
    hh = min(nh - sy0, Hh - dy0)
    ww = min(nw - sx0, Ww - dx0)
    canvas[dy0:dy0 + hh, dx0:dx0 + ww] = crop[sy0:sy0 + hh, sx0:sx0 + ww]
    band = max(4, int((bn - bt) * 0.10))
    yy = np.arange(Hh, dtype=np.float32)[:, None]
    wy = np.clip((bn + band * 0.2 - yy) / band, 0, 1)        # yakanın üstünde 1, altında 0
    ha = canvas[..., 3] / 255 * wy                            # kafanın örtme oranı
    ba = out[..., 3] / 255
    al = ha + ba * (1 - ha)
    rgb = (canvas[..., :3] * ha[..., None] + out[..., :3] * (ba * (1 - ha))[..., None]) / np.maximum(al, 1e-4)[..., None]
    res = np.dstack([rgb, al * 255])
    return res


def main(body_dir, head_dir, out_dir):
    os.makedirs(out_dir, exist_ok=True)
    bs = sorted(glob.glob(os.path.join(body_dir, '*.webp')))
    hs = sorted(glob.glob(os.path.join(head_dir, '*.webp')))
    assert len(bs) == len(hs), (len(bs), len(hs))
    for b, h in zip(bs, hs):
        r = swap(load(b), load(h))
        Image.fromarray(np.clip(r, 0, 255).astype(np.uint8)).save(os.path.join(out_dir, os.path.basename(b)), quality=82, method=6)
    print('kafa değişti:', len(bs), 'kare →', out_dir)


if __name__ == '__main__':
    main(*sys.argv[1:4])
