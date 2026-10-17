# Dış cephe ve çevre dokuları: Poly Haven (CC0) 2K kaynaklardan renk rampası ile türetilir.
#   facade_stone   ← plaster_grey_04  (ince gözenekli mimari beton / honlanmış kireç taşı; 1.5 m karo)
#   plaza_stone    ← rock_01          (açık sıcak gri, ince taneli honlanmış taş plak)
#   approach_stone ← rock_01          (giriş yaklaşım alanı: koyu grafit honlanmış granit)
#   sidewalk_tiles ← concrete_tiles_02 (meydan dışı kaldırım: açık beton karo)
# Kullanım: python3 tools/make_facade_textures.py <kaynak_klasör>   (klasörde <ad>_{Diffuse,Rough,nor_gl}.jpg)
import os, sys
import numpy as np
from PIL import Image
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'textures')
SRC = sys.argv[1]

def hexf(h):
    h = h.lstrip('#'); return np.array([int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)])

def make(src, dst, dark, light, contrast=1.0, size=2048, rough_add=0.):
    im = np.asarray(Image.open(os.path.join(SRC, f'{src}_Diffuse.jpg')).convert('RGB')) / 255.
    lum = im @ np.array([.299, .587, .114])
    lo, hi = np.percentile(lum, 1), np.percentile(lum, 99)
    t = np.clip((lum - lo) / max(hi - lo, 1e-4), 0, 1)
    t = np.clip(.5 + (t - .5) * contrast, 0, 1)
    col = hexf(dark) * (1 - t[..., None]) + hexf(light) * t[..., None]
    os.makedirs(os.path.join(ROOT, dst), exist_ok=True)
    sv = lambda a, n: Image.fromarray(a).resize((size, size), Image.LANCZOS).save(os.path.join(ROOT, dst, n), quality=90)
    sv((np.clip(col, 0, 1) * 255).astype(np.uint8), 'Diffuse.webp')
    r = np.asarray(Image.open(os.path.join(SRC, f'{src}_Rough.jpg')).convert('L')) / 255.
    sv((np.clip(r + rough_add, 0, 1) * 255).astype(np.uint8), 'Rough.webp')
    sv(np.asarray(Image.open(os.path.join(SRC, f'{src}_nor_gl.jpg')).convert('RGB')), 'nor_gl.webp')
    print('doku', dst, size)

make('plaster_grey_04', 'facade_stone', '#aba499', '#d3cdc3', .85)     # açık gri-bej kireç taşı / mimari beton: beyaz değil (ışıkta patlamaz)
make('rock_01', 'plaza_stone', '#a29d95', '#c2bdb4', .7)                # meydan plakları
make('rock_01', 'approach_stone', '#3b3a39', '#5a5856', .8)             # giriş yaklaşım alanı
make('concrete_tiles_02', 'sidewalk_tiles', '#9d9a95', '#bebab3', .8, size=1024)
