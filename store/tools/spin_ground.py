"""Turntable karelerinden zemin hizası ölçer ve js/spins.js içine `ground` olarak yazar.

Kullanım (store klasöründen):
    python3 tools/spin_ground.py              # tüm modeller, sadece rapor
    python3 tools/spin_ground.py --write      # rapor + spins.js güncelle
    python3 tools/spin_ground.py gezegenler --write

Nasıl çalışır
-------------
Tripo videosu sabit bir kamerayla, dönen bir tablada çekilir. Bu yüzden:
  * Her ayağın gövdedeki yeri (x, z) sabittir; karedeki yatay konumu
        x(α) = x·cos α − z·sin α
    eğrisini izler (α = kare açısı). Her ayak tüm kareler boyunca ayrı ayrı izlenip
    bu eğriye en küçük kareler ile oturtulur.
  * Kamera hafif yukarıdan baktığı için kameraya yakın zemin noktası karede daha aşağıda
    görünür:  taban_boşluğu = g0 − tilt · derinlik(α).  Bu doğrusal ilişkiden kamera eğimi
    (tilt) ve ayağın karedeki taban yüksekliği (g0) bulunur.
  * Dönüş ekseninin zemine değdiği satır  g = min(g0) + tilt · E  (E: ayağın en öndeki
    noktasının ayak merkezinin önündeki ortalama payı). Bu satır tüm kareler için aynıdır;
    figürde bu satır kaidenin üst yüzeyine yerleştirilir, böylece ayaklar dönerken
    yukarı-aşağı oynamaz, havada kalmaz, gömülmez.
  * Gölgeler için her karede görünen taban lekeleri de kaydedilir (soles): karedeki yatay
    konum ve taban boşluğundan, ayağın kaide üzerindeki derinliği  z = (g − boşluk)/tilt − E
    olarak bulunur; gölge o karede çizilen ayağın tam altına düşer.
  * Her ayağın g0 farkı o ayağın kalkıklığıdır (pozdan gelen parmak ucu vb.): ayak zorla
    indirilmez, sadece gölgesi zayıflatılır.

Tüm uzunluklar karenin yüksekliğine oranlıdır (figürde 10.1 birim boy ile çarpılır).
"""
import json
import os
import sys

import numpy as np
from PIL import Image
from scipy import ndimage

STORE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SPINS = os.path.join(STORE, 'js', 'spins.js')
E = 0.04          # ayak ucu payı (boy oranı)
BAND = 0.07       # karenin altından incelenen bant
MIN_W = 0.018     # bundan dar lekeler ayak değil (kumaş kırıntısı)


def blobs(alpha):
    H, W = alpha.shape
    m = alpha > 128
    rows = np.where(m.sum(1) > 0)[0]
    yb = rows.max()
    top = yb - int(BAND * H)
    lab, nl = ndimage.label(m[top:yb + 1])
    out = []
    for L in range(1, nl + 1):
        ys, xs = np.where(lab == L)
        if len(xs) < 40 or (xs.max() - xs.min()) / H < MIN_W:
            continue
        out.append(dict(x=(xs.mean() - W / 2) / H, hw=(xs.max() - xs.min()) / 2 / H,
                        g=(H - 1 - (ys.max() + top)) / H))
    if out:
        gm = min(b['g'] for b in out)
        out = [b for b in out if b['g'] < gm + 0.045]
    return out


def fit(frames):
    n = len(frames)
    A = 2 * np.pi * np.arange(n) / n
    B = [blobs(np.array(Image.open(os.path.join(STORE, f)).convert('RGBA'))[..., 3]) for f in frames]
    f0 = sorted(B[0], key=lambda b: b['x'])
    P = ([np.array([f0[0]['x'], 0.0]), np.array([f0[-1]['x'], 0.0])] if len(f0) > 1
         else [np.array([-0.03, 0.0]), np.array([0.03, 0.0])])
    obs = [[], []]
    for _ in range(12):
        obs = [[], []]
        for i, bl in enumerate(B):
            c, s = np.cos(A[i]), np.sin(A[i])
            pred = [q[0] * c - q[1] * s for q in P]
            if len(bl) < 2 or abs(pred[0] - pred[1]) < 0.025:
                continue  # ayaklar üst üste: bu karede ayrı ayrı izlenemez
            for b in bl:
                j = int(np.argmin([abs(b['x'] - pp) for pp in pred]))
                if abs(b['x'] - pred[j]) < 0.04:
                    obs[j].append((i, b))
        newP = []
        for j in range(2):
            if len(obs[j]) < 6:
                newP.append(P[j])
                continue
            M = np.array([[np.cos(A[i]), -np.sin(A[i])] for i, _ in obs[j]])
            y = np.array([b['x'] for _, b in obs[j]])
            newP.append(np.linalg.lstsq(M, y, rcond=None)[0])
        done = all(np.allclose(a, b, atol=1e-5) for a, b in zip(P, newP))
        P = newP
        if done:
            break
    rows = [(j, P[j][0] * np.sin(A[i]) + P[j][1] * np.cos(A[i]), b['g'], b['hw'])
            for j in range(2) for i, b in obs[j]]
    R = np.array(rows)
    X = np.column_stack([R[:, 0] == 0, R[:, 0] == 1, -R[:, 1]]).astype(float)
    coef, *_ = np.linalg.lstsq(X, R[:, 2], rcond=None)
    rms = float(np.sqrt(((R[:, 2] - X @ coef) ** 2).mean()))
    # Her karede görünen ayak tabanları: [x, yarı genişlik, taban boşluğu] (gölgeler bunlardan çizilir)
    soles = [[round(float(v), 4) for b in bl for v in (b['x'], b['hw'], b['g'])] for bl in B]
    return dict(P=P, g0=coef[:2], tilt=float(coef[2]), rms=rms, hw=float(np.median(R[:, 3])),
                nobs=[len(o) for o in obs], soles=soles)


def main():
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    text = open(SPINS).read()
    data = json.loads(text[text.index('{'):text.rindex('}') + 1])
    res = {k: fit(data[k]['frames']) for k in (args or list(data))}
    good = [r['tilt'] for r in res.values() if r['rms'] < 0.007]
    tilt_med = float(np.median(good)) if good else 0.28
    for k, r in res.items():
        reliable = r['rms'] < 0.007 and abs(r['tilt'] - tilt_med) < 0.12
        tilt = r['tilt'] if reliable else tilt_med
        g0 = r['g0']
        base = float(min(g0))
        feet = [[round(float(q[0]), 4), round(float(q[1]), 4), round(float(g - base), 4)]
                for q, g in zip(r['P'], g0)]
        data[k]['ground'] = {'g': round(base + tilt * E, 4), 'tilt': round(tilt, 3),
                             'feet': feet, 'hw': round(r['hw'], 4), 'soles': r['soles']}
        data[k].pop('foot', None)
        lifted = [i for i, f in enumerate(feet) if f[2] > 0.012]
        print(f"{k:22s} g={data[k]['ground']['g']:.4f} tilt={tilt:.3f}{'' if reliable else ' (ortanca)'} "
              f"rms={r['rms']:.4f} ayaklar={feet} "
              f"{'iki ayak temas' if not lifted else 'kalkık ayak: ' + str(lifted)}")
    if '--write' in sys.argv:
        open(SPINS, 'w').write(text[:text.index('export const SPINS')] + 'export const SPINS = '
                               + json.dumps(data, separators=(',', ':')) + ';\n')
        print('spins.js güncellendi')


if __name__ == '__main__':
    main()
