"""Her tadın sahnesi için arka plan dokusu: kendi şehrinin suluboya çizimi, tadın renginde hafif boyanmış krem kâğıt üzerinde."""
import json
import numpy as np
from PIL import Image, ImageFilter
from label import CANS, art_layer, multiply, feather
W, H = 2400, 1600
for key, C in CANS.items():
    band = np.array(C["band"], float)
    y = np.linspace(0, 1, H)[:, None, None]
    paper = np.array([248, 242, 230], float)
    tint = paper * 0.86 + band * 0.14
    bg = tint * (1 - y * 0.25) + paper * (y * 0.25)
    rng = np.random.default_rng(3)
    bg = bg + rng.normal(0, 2.2, (H, W, 1))
    B = Image.fromarray(np.clip(bg, 0, 255).astype(np.uint8).repeat(1, 1) if bg.shape[1] == W else np.clip(np.broadcast_to(bg, (H, W, 3)), 0, 255).astype(np.uint8))
    art = art_layer(key, 1150)
    art = feather(art, top=0.25, bottom=0.2, side=0.22)
    a2 = art.transpose(Image.FLIP_LEFT_RIGHT).resize((art.width * 2 // 3, art.height * 2 // 3))
    a2 = feather(a2, top=0.3, bottom=0.25, side=0.3)
    # yanlarda soluk, uzak tekrarlar (derinlik)
    fade = lambda im, k: Image.blend(Image.new("RGB", im.size, (255, 255, 255)), im, k)
    multiply(B, fade(a2, 0.45), (40, int(H * 0.66) - a2.height))
    multiply(B, fade(a2.transpose(Image.FLIP_LEFT_RIGHT), 0.45), (W - 40 - a2.width, int(H * 0.66) - a2.height))
    multiply(B, art, ((W - art.width) // 2, int(H * 0.70) - art.height))
    B = B.filter(ImageFilter.GaussianBlur(2.6))
    B.save(f"render/bd-{key}.jpg", quality=92)
    print(key, art.size)
