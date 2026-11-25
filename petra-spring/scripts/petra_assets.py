# Petra Spring ürün görselleri → public/ (dokular, arka yüzler, küçük resimler, fotoğraflar)
# Kaynak: usepetra.com/products.json ve ürün görselleri (SRC klasörüne indirilmiş: products.json, img/<handle>__<n>.<ext>)
# Kullanım: python3 scripts/petra_assets.py <SRC>
import sys, os, json, numpy as np
from PIL import Image
from scipy import ndimage

SRC = sys.argv[1]
PUB = os.path.join(os.path.dirname(__file__), '..', 'public')
ID = {
    'art-asma-oto-kokusu': 'art', 'star-light-asma-oto-kokusu': 'star-light', 'gulumse-asma-oto-kokusu': 'gulumse',
    'sirius-vatan-asma-oto-kokusu': 'sirius', 'anka-asma-oto-kokusu': 'anka', 'petra-x-oto-kokusu': 'petra-x',
    'electro': 'electro', 'forest-asma-oto-kokusu': 'forest', 'ocean-asma-oto-kokusu': 'ocean', 'free-asma-oto-kokusu': 'free',
    'star-dark-asma-oto-kokusu': 'star-dark', 'once-vatan-asma-oto-kokusu': 'once-vatan',
    'tutti-cam-sise-premium-kalici-araba-kokusu': 'cam-tutti', 'ocean-cam-sise-premium-kalici-araba-kokusu': 'cam-ocean',
    'aura-cam-sise-premium-kalici-araba-kokusu': 'cam-aura', 'yasemen-cam-sise-premium-kalici-araba-kokusu': 'cam-yasemen',
    'forest-cam-sise-premium-kalici-araba-kokusu': 'cam-forest',
    'kerasus-100ml-bambu-cubuklu-oda-kokusu': 'kerasus', 'miracle-100ml-bambu-cubuklu-oda-kokusu': 'miracle',
    'zeus-100ml-bambu-cubuklu-oda-kokusu': 'zeus', 'keops-100ml-bambu-cubuklu-oda-kokusu': 'keops',
    'agartha-100ml-bambu-cubuklu-oda-kokusu': 'agartha', 'petra-spring-paris-100ml-bambu-cubuklu-oda-kokusu': 'paris',
}
for d in ['tex', 'tex/back', 'tex/md', 'tex/mini', 'img/foto']:
    os.makedirs(os.path.join(PUB, d), exist_ok=True)

def save(im, path, q=84):
    im.save(os.path.join(PUB, path), 'WEBP', quality=q, method=6)

def cut(path, thr=236):
    """beyaz zeminli ambalaj fotoğrafı → saydam zeminli kesim (askı deliği de saydam)"""
    im = Image.open(path).convert('RGB')
    im = im.crop((4, 4, im.width - 4, im.height - 4))  # bazı arka yüz fotoğraflarında ince çerçeve var
    a = np.asarray(im).astype(np.int16)
    mx, mn = a.max(2), a.min(2)
    bgish = (mn >= thr) & (mx - mn < 14)
    lab, n = ndimage.label(bgish)
    border = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    bg = np.isin(lab, list(border))
    fg = ndimage.binary_opening(~bg, iterations=2)
    lab2, n2 = ndimage.label(fg)
    sizes = ndimage.sum(fg, lab2, range(1, n2 + 1))
    fg = lab2 == (int(np.argmax(sizes)) + 1)
    filled = ndimage.binary_fill_holes(fg)
    # askı deliği: üst kısımdaki küçük, beyaz delik saydam kalsın
    ys, xs = np.where(filled)
    top, h = ys.min(), ys.max() - ys.min()
    holes, nh = ndimage.label(filled & ~fg & bgish)
    for k in range(1, nh + 1):
        hy, hx = np.where(holes == k)
        if len(hy) < filled.sum() * 0.01 and hy.mean() < top + h * 0.14:
            filled[holes == k] = False
    alpha = ndimage.gaussian_filter(filled.astype(np.float32), 0.7)
    rgba = Image.fromarray(np.dstack([np.asarray(im), (alpha * 255).astype(np.uint8)]), 'RGBA')
    return rgba.crop(rgba.getbbox())

def thumb(im, size, path, q=82):
    t = im.copy(); t.thumbnail(size, Image.LANCZOS); save(t, path, q)

prods = json.load(open(os.path.join(SRC, 'products.json')))['products']
info = {}
for p in prods:
    h = p['handle']; pid = ID[h]
    imgs = sorted([f for f in os.listdir(os.path.join(SRC, 'img')) if f.startswith(h + '__')])
    f = lambda n: os.path.join(SRC, 'img', imgs[n])
    if pid in ('art', 'star-light', 'gulumse', 'sirius', 'anka', 'petra-x', 'electro', 'forest', 'ocean', 'free', 'star-dark', 'once-vatan'):
        fr = cut(f(0)); bk = cut(f(1))
        # ön ve arka aynı boyda olsun (3B kartın iki yüzü)
        W = 600; H = round(fr.height * W / fr.width)
        fr = fr.resize((W, H), Image.LANCZOS); bk = bk.resize((W, H), Image.LANCZOS)
        save(fr, f'tex/{pid}.webp', 88); save(bk, f'tex/back/{pid}.webp', 86)
        thumb(fr, (300, 700), f'tex/md/{pid}.webp'); thumb(fr, (90, 210), f'tex/mini/{pid}.webp')
        # zemin rengi: kartın üst başlık bölgesinin ortalaması
        a = np.asarray(fr.convert('RGB'))[int(H * 0.04):int(H * 0.16), int(W * 0.1):int(W * 0.9)].reshape(-1, 3)
        info[pid] = {'aspect': round(H / W, 3), 'head': '#%02x%02x%02x' % tuple(np.median(a, 0).astype(int))}
    else:
        # fotoğraflar: ürün çekimi (0) ve yaşam alanı (1)
        for n in (0, 1):
            im = Image.open(f(n)).convert('RGB'); im.thumbnail((1100, 1100), Image.LANCZOS)
            save(im, f'img/foto/{pid}-{n}.webp', 82)
        im = Image.open(f(0)).convert('RGB')
        thumb(im, (560, 560), f'tex/md/{pid}.webp'); thumb(im, (180, 180), f'tex/mini/{pid}.webp')
        a = np.asarray(im.resize((50, 50)))[:6].reshape(-1, 3)
        info[pid] = {'photoBg': '#%02x%02x%02x' % tuple(np.median(a, 0).astype(int))}
    info[pid].update(handle=h, title=p['title'], price=p['variants'][0]['price'])
json.dump(info, open(os.path.join(os.path.dirname(__file__), 'petra_info.json'), 'w'), ensure_ascii=False, indent=1)
print(json.dumps(info, ensure_ascii=False, indent=1))
