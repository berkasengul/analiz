# Oda temaları için doku türetme: mevcut taş/ahşap/sıva dokularının parlaklık deseni korunur, renk paleti değişir.
# Pürüzlülük ve normal haritası kaynaktan aynen kopyalanır (yüzey karakteri aynı, renk farklı).
# Kullanım (proje klasöründen): python3 tools/make_theme_textures.py
import os, shutil
import numpy as np
from PIL import Image
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'textures')

def hexf(h):
    h = h.lstrip('#'); return np.array([int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)])

def recolor(src, dst, dark, light, contrast=1.0, flip=False):
    """kaynak parlaklığını [dark, light] renk rampasına eşler (sRGB uzayında); contrast desenin şiddeti."""
    im = np.asarray(Image.open(os.path.join(ROOT, src, 'Diffuse.webp')).convert('RGB')) / 255.
    lum = im @ np.array([.299, .587, .114])
    lo, hi = np.percentile(lum, 1), np.percentile(lum, 99)
    t = np.clip((lum - lo) / max(hi - lo, 1e-4), 0, 1)
    t = np.clip(.5 + (t - .5) * contrast, 0, 1)
    if flip: t = 1 - t
    col = hexf(dark) * (1 - t[..., None]) + hexf(light) * t[..., None]
    os.makedirs(os.path.join(ROOT, dst), exist_ok=True)
    Image.fromarray((np.clip(col, 0, 1) * 255).astype(np.uint8)).save(os.path.join(ROOT, dst, 'Diffuse.webp'), quality=90)
    for k in ('Rough', 'nor_gl'):
        shutil.copy(os.path.join(ROOT, src, f'{k}.webp'), os.path.join(ROOT, dst, f'{k}.webp'))
    print('doku', dst)

recolor('microcement', 'concrete_dark', '#3a3b3d', '#5e6062', .9)          # SEAT: koyu antrasit beton
recolor('microcement', 'terracotta_plaster', '#6e3a28', '#93553b', .8)     # SEAT: terracotta sıva
recolor('microcement', 'bluegrey_plaster', '#3e4651', '#66707c', .8)       # BMW 320i: mavi-gri sıva
recolor('dark_stone', 'anthracite_stone', '#17191c', '#3c4046', 1.0)       # BMW 320i: antrasit taş zemin
recolor('porcelain_slab', 'urban_grey', '#8f9294', '#b9bbbc', 1.1)         # Golf: orta gri porselen
recolor('smoked_walnut_veneer', 'light_oak', '#a78a64', '#dcc7a6', .85)    # Golf / Corsa: açık meşe
recolor('smoked_walnut_veneer', 'dark_oak', '#2c2018', '#5e4532', .9)      # Kuga: koyu füme meşe
recolor('cream_leather', 'cognac_leather', '#5c2f18', '#8f5130', 1.0)      # Kuga: konyak deri
recolor('travertine_clean', 'ivory_travertine', '#d9cdb8', '#f3ece0', .8)  # Mercedes: fildişi traverten
recolor('warm_stone', 'sand_stone', '#ac9b84', '#c9baa3', .45)             # Kuga: sıcak kum taşı
recolor('porcelain_slab', 'pearl_porcelain', '#c9c4bc', '#e8e4dd', 1.0)    # Corsa: açık sıcak gri
recolor('cream_leather', 'black_leather', '#141312', '#3a3632', 1.0)       # BMW 420i: siyah deri (lounge)
# koyu premium odalar (2. tur)
recolor('microcement', 'charcoal_plaster', '#26231f', '#3d3832', .8)       # BMW 420i: sıcak kömür sıva
recolor('microcement', 'umber_plaster', '#35281f', '#52402e', .8)          # Kuga: koyu toprak sıva
recolor('dark_stone', 'slate_dark', '#1d1915', '#433a31', 1.0)              # Kuga: koyu arduvaz zemin
recolor('microcement', 'forest_plaster', '#1a241f', '#2d3b33', .8)         # Golf: orman yeşili sıva
recolor('smoked_walnut_veneer', 'black_oak', '#15110e', '#3a2f27', .9)     # Golf: siyah meşe nervürler
recolor('porcelain_slab', 'urban_dark', '#2a2c2e', '#45484b', 1.1)         # Golf: koyu gri porselen zemin
recolor('porcelain_slab', 'warm_graphite', '#2d2927', '#48423e', 1.0)      # Corsa: sıcak grafit zemin
recolor('microcement', 'oxblood_plaster', '#2a1514', '#40201d', .8)        # Corsa: bordo sıva
recolor('cream_leather', 'oxblood_leather', '#3a1413', '#6a2723', 1.0)     # Corsa: bordo deri duvar panelleri
recolor('travertine_clean', 'graphite_travertine', '#25221e', '#423d36', .9)   # Mercedes: grafit traverten yivler
