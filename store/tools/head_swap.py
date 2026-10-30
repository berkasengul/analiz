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
    # Pijama (mavi + beyaz kareler): sıcak tonlu olmayan opak pikseller. Ten ve saç sıcak tonludur.
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    warm = (r > b + 18) & (r >= g)
    return (~warm) & (a[..., 3] > 128)


def warm_soft(a):
    # Ten/saç olasılığı (0–1), kenarları yumuşak
    r, b = a[..., 0], a[..., 2]
    w = np.clip((r - b - 8) / 22, 0, 1)
    return cv2.GaussianBlur(w.astype(np.float32), (0, 0), 1.2)


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


def swap(body, head, scale=None, profile=0.0):
    out = body.copy()
    bt, bn, bcx, bhw = landmarks(body)
    ht, hn, hcx, hhw = landmarks(head)
    s = scale if scale else (bn - bt) / max(1, hn - ht)
    # Fotoğraf kafası: tepe → yakanın biraz altı (boyun geçişi için pay)
    # Fotoğrafın yakası alınmaz: kafa çene/boyun hizasında biter, alttaki geçiş gövdenin boynundan gelir
    # Kafa boynuyla birlikte alınır (yakanın altına uzanır); fotoğrafın kendi yakası (mavi) atılır
    y_top = max(0, ht - 4)
    crop = head[y_top:hn + int((hn - ht) * 0.4)].copy()
    # Ten süzgeci yalnız boyun/yaka bölgesinde (göz bebekleri ve saç gölgeleri etkilenmesin)
    ry = np.arange(crop.shape[0], dtype=np.float32)[:, None]
    zone = np.clip((ry - (hn - y_top - (hn - ht) * 0.12)) / max(1, (hn - ht) * 0.06), 0, 1)
    crop[..., 3] = crop[..., 3] * (1 - zone * (1 - warm_soft(crop)))
    nh = max(1, round(crop.shape[0] * s))
    nw = max(1, round(crop.shape[1] * s))
    crop = cv2.resize(crop, (nw, nh), interpolation=cv2.INTER_AREA if s < 1 else cv2.INTER_CUBIC)
    crop[..., 3] = cv2.erode(crop[..., 3], np.ones((3, 3), np.uint8), iterations=2)  # saç kenarındaki açık hale
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
    band = max(4, int((bn - bt) * 0.16))
    cut = bn - band
    # Gövdenin kendi kafası ve boynu (mavi olmayan pikseller) yakanın üstünde tamamen silinir
    yy = np.arange(Hh, dtype=np.float32)[:, None]
    body_blue = bluish(out)
    # Profile yaklaştıkça gövdenin kendi boynu korunur, birleşim çene hizasına çıkar
    lim = bn + band * 0.8 - profile * (band * 1.8 + (bn - bt) * 0.08)
    erase = warm_soft(out) * np.clip((lim - yy) / max(1, band * 0.4), 0, 1)
    out[..., 3] = out[..., 3] * (1 - erase)
    canvas = np.zeros_like(out)
    sy0, sx0 = max(0, -y0), max(0, -x0)
    dy0, dx0 = max(0, y0), max(0, x0)
    hh = min(nh - sy0, Hh - dy0)
    ww = min(nw - sx0, Ww - dx0)
    canvas[dy0:dy0 + hh, dx0:dx0 + ww] = crop[sy0:sy0 + hh, sx0:sx0 + ww]
    # Boynun alt ucu yumuşakça biter
    end = dy0 + hh
    canvas[..., 3] *= np.clip((end - yy) / max(1, band), 0, 1)
    def over(top, bottom):
        ta, ba = top[..., 3] / 255, bottom[..., 3] / 255
        al = ta + ba * (1 - ta)
        rgb = (top[..., :3] * ta[..., None] + bottom[..., :3] * (ba * (1 - ta))[..., None]) / np.maximum(al, 1e-4)[..., None]
        return np.dstack([rgb, al * 255])
    res = over(canvas, out)
    # Yaka ve omuzlar (gövdenin mavi pikselleri) boynun önünde kalır: birleşim yeri yakanın altında saklanır
    collar = out.copy()
    collar[..., 3] = out[..., 3] * (1 - warm_soft(out)) * np.clip((yy - (cut - band)) / max(1, band * 0.5), 0, 1)
    res = over(collar, res)
    return res


def face_weight(i, n):
    # Yüzün göründüğü açılarda fotoğraf kafası; arkadan bakışta (yüz görünmez) gövdenin kendi kafası
    a = (i * 360 / n) % 360
    d = min(a, 360 - a)
    # Çift kafa (hayalet) olmasın: karışım yok, tam yan profilde (iki kafa da profil) tek karede geçiş
    return 1.0 if d < 89 else 0.0


def clean_head_index(i, n, keys=(0, 35, 90, 180)):
    # Fotoğraf dönüşünde iki görünüşün karıştığı geçiş karesi yerine komşu temiz kare
    def blended(j):
        a = (j * 360 / n) % 360
        d = min(a, 360 - a)
        for a0, a1 in zip(keys, keys[1:]):
            if a0 < d < a1:
                t = (d - a0) / (a1 - a0)
                win = min(0.3, 4.5 / (a1 - a0))
                return abs(t - 0.5) < win / 2 + 0.02
        return False
    for k in (0, -1, 1, -2, 2):
        if not blended((i + k) % n):
            return (i + k) % n
    return i


def main(body_dir, head_dir, out_dir, reverse=True):
    os.makedirs(out_dir, exist_ok=True)
    bs = sorted(glob.glob(os.path.join(body_dir, '*.webp')))
    hs = sorted(glob.glob(os.path.join(head_dir, '*.webp')))
    assert len(bs) == len(hs), (len(bs), len(hs))
    # Kafa ölçeği tüm karelerde aynı: önden görünümden bir kez hesaplanır
    b0, h0 = landmarks(load(bs[0])), landmarks(load(hs[0]))
    scale = (b0[1] - b0[0]) / max(1, h0[1] - h0[0])
    for i, (b, h) in enumerate(zip(bs, hs)):
        body = load(b)
        w = face_weight(i, len(bs))
        if w <= 0:
            r = body
        else:
            a = (i * 360 / len(bs)) % 360
            prof = 0.0  # boyun her açıda fotoğraf kafasından gelir (gövdenin çenesi görünmesin)
            # Tripo videosu ters yönde döner: kafa, ters açıdaki fotoğraf karesinden alınır
            j = (len(hs) - i) % len(hs) if reverse else i
            r = swap(body, load(hs[clean_head_index(j, len(hs))]), scale, prof)
            if w < 1:
                pa, pb = r[..., 3:4] / 255, body[..., 3:4] / 255
                al = pa * w + pb * (1 - w)
                rgb = (r[..., :3] * pa * w + body[..., :3] * pb * (1 - w)) / np.maximum(al, 1e-4)
                r = np.dstack([rgb, al[..., 0] * 255])
        Image.fromarray(np.clip(r, 0, 255).astype(np.uint8)).save(os.path.join(out_dir, os.path.basename(b)), quality=82, method=6)
    print('kafa değişti:', len(bs), 'kare →', out_dir)


if __name__ == '__main__':
    main(*sys.argv[1:4])
