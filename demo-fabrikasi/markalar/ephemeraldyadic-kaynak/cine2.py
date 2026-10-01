"""Sinematik son işlem (siyah-beyaz mürekkep sahnesi; renk yalnız şişede) (referans: koyu, sıcak altın ışık):
- alan derinliği: maske (kaide + şişe) net, arka plan bulanık
- köşedeki lambadan (sağ üst) kaideye doğru hacimsel ışık huzmesi ve ışık kaynağının parlaması
- parlak yerlerde ışıma (bloom), sıcak renk ayarı (gölgeler kahve-siyah, ışıklar altın), siyah vinyet
Kullanım: python3 cine2.py <kip> → render/out/<kip>-<koku>.png (+ -mask.png) → render/out/<kip>g-<koku>.jpg"""
import glob, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
mode = sys.argv[1] if len(sys.argv) > 1 else "card"
for f in sorted(glob.glob(f"render/out/{mode}-*.png")):
    if f.endswith("-mask.png"):
        continue
    key = f.split(f"{mode}-")[1][:-4]
    im = Image.open(f).convert("RGB"); W, H = im.size
    a = np.asarray(im).astype(float) / 255
    y = np.linspace(0, 1, H)[:, None, None]; x = np.linspace(0, 1, W)[None, :, None]
    # alan derinliği
    try:
        mk = np.asarray(Image.open(f[:-4] + "-mask.png").convert("L")).astype(float)
        m = (mk > 6).astype(np.uint8) * 255
        m = Image.fromarray(m).filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.MinFilter(5)).filter(ImageFilter.GaussianBlur(3))
        m = np.asarray(m).astype(float)[..., None] / 255
    except FileNotFoundError:
        m = np.zeros((H, W, 1))
    blur = np.asarray(im.filter(ImageFilter.GaussianBlur(W * (0.007 if mode != "wall" else 0.004)))).astype(float) / 255
    a = a * m + blur * (1 - m)
    # dünya siyah-beyaz; renk yalnızca şişede (kaide de gri)
    g_ = a.mean(2, keepdims=True)
    try:
        col = np.asarray(Image.open(f[:-4] + "-mask.png").convert("RGB")).astype(float) / 255
        sat = (col.max(2, keepdims=True) - col.min(2, keepdims=True)) > 0.08  # maskede şişe renkli kalır (kaide düz beyaz)
        keep = np.asarray(Image.fromarray((sat[..., 0] * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.GaussianBlur(2))).astype(float)[..., None] / 255
    except FileNotFoundError:
        keep = np.zeros((H, W, 1))
    a = g_ + (a - g_) * keep
    # hacimsel huzme: sağ üst köşedeki lambadan kaideye
    src = (1.04 * W, -0.04 * H); dst = (0.5 * W, 0.62 * H) if mode != "wall" else (0.42 * W, 0.7 * H)
    beam = Image.new("L", (W, H), 0); dr = ImageDraw.Draw(beam)
    dx, dy = dst[0] - src[0], dst[1] - src[1]; L = (dx * dx + dy * dy) ** 0.5; nx, ny = -dy / L, dx / L
    w0, w1 = 0.05 * W, 0.24 * W
    dr.polygon([(src[0] + nx * w0, src[1] + ny * w0), (src[0] - nx * w0, src[1] - ny * w0), (dst[0] - nx * w1, dst[1] - ny * w1), (dst[0] + nx * w1, dst[1] + ny * w1)], fill=150)
    beam = np.asarray(beam.filter(ImageFilter.GaussianBlur(W * 0.04))).astype(float)[..., None] / 255
    # huzmede toz/kıvrım: yumuşak gürültü
    rng = np.random.default_rng(5)
    dust = Image.fromarray((rng.random((H // 8, W // 8)) * 255).astype(np.uint8)).resize((W, H), Image.BICUBIC).filter(ImageFilter.GaussianBlur(6))
    beam = beam * (0.75 + 0.5 * np.asarray(dust).astype(float)[..., None] / 255)
    a = a + beam * np.array([1.0, 0.99, 0.97]) * 0.42 * (1 - a * 0.6)
    # ışık kaynağının parlaması
    gx, gy = src[0] / W, src[1] / H
    flare = np.exp(-(((x - gx) / 0.16) ** 2 + ((y - gy) / 0.16 * (H / W)) ** 2))
    a = a + flare * np.array([1.0, 0.98, 0.95]) * 0.45
    # bloom
    hi = np.clip(a - 0.72, 0, 1) * 2.0 * (1 - 0.6 * m)
    bl = np.asarray(Image.fromarray((np.clip(hi, 0, 1) * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(W * 0.025))).astype(float) / 255
    a = a + bl * np.array([1.0, 0.98, 0.94]) * 0.22
    # renk: gölgeler sıcak siyah, ışıklar altın; kontrast
    lum = a.mean(2, keepdims=True)
    warm = np.clip((lum - 0.35) / 0.5, 0, 1)
    a = a * (1 + warm * (np.array([1.01, 1.0, 0.98]) - 1))
    a = np.clip(a, 0, 1); a = a ** 1.1; a = a + (a - 0.45) * 0.16
    # vinyet
    d = np.sqrt(((x - 0.5) / 0.6) ** 2 + ((y - 0.5) / 0.66) ** 2)
    a = a * (1 - 0.5 * np.clip((d - 0.55) / 0.8, 0, 1) ** 1.5)
    if mode == "card":
        a = a * (1 - 0.6 * np.clip((y - 0.8) / 0.2, 0, 1) ** 1.2)
    Image.fromarray((np.clip(a, 0, 1) * 255).astype(np.uint8)).save(f"render/out/{mode}g-{key}.jpg", quality=92)
    print(mode, key)
