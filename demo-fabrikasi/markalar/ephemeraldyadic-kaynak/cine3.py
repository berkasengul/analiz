"""Sinematik ürün reklamı son işlemi (ışık hiyerarşisi: arka plan < kaide < şişe; renk filtresi yok).
- arka plan (maske dışı): pozlama ~%18 düşük, yalnızca çok hafif yumuşama (desen net okunur), nötr siyah-beyaz
- tepeden şişeye kontrollü ışık huzmesi: yumuşak kenarlı, hafif pus ve çok küçük toz; sıcak beyaz (~4000K)
- şişe: cam kenarlarında ince sıcak beyaz kontur (arkadan kenar ışığı); renk korunur
- düşük bloom (yalnız en parlak yerler), +%10 kontrast, siyahlar hafif aşağı, ~%10 vinyet
Kullanım: python3 cine3.py <kip> [koku-filtresi] → render/out/<kip>-<koku>.png (+ -mask.png) → <kip>g-<koku>.jpg"""
import glob, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
mode = sys.argv[1] if len(sys.argv) > 1 else "card"
only = sys.argv[2] if len(sys.argv) > 2 else ""
WARM = np.array([1.0, 0.93, 0.84])  # ~4000K
for f in sorted(glob.glob(f"render/out/{mode}-*.png")):
    if f.endswith("-mask.png") or only not in f:
        continue
    key = f.split(f"{mode}-")[1][:-4]
    im = Image.open(f).convert("RGB"); W, H = im.size
    a = np.asarray(im).astype(float) / 255
    y = np.linspace(0, 1, H)[:, None, None]; x = np.linspace(0, 1, W)[None, :, None]
    try:
        mrgb = Image.open(f[:-4] + "-mask.png").convert("RGB")
        mk = np.asarray(mrgb.convert("L")).astype(float)
        m = Image.fromarray(((mk > 6) * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(1.5))
        m = np.asarray(m).astype(float)[..., None] / 255
        col = np.asarray(mrgb).astype(float) / 255
        sat = ((col.max(2) - col.min(2)) > 0.08) | ((col.max(2) < 0.98) & (mk > 6))  # şişe (kaide düz beyaz)
        bm = Image.fromarray((sat * 255).astype(np.uint8)).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.MaxFilter(5))
        bottle = np.asarray(bm.filter(ImageFilter.GaussianBlur(1.2))).astype(float)[..., None] / 255
    except FileNotFoundError:
        m = np.zeros((H, W, 1)); bottle = np.zeros((H, W, 1)); bm = None
    # arka plan: çok hafif yumuşama + pozlama -%18 (desen okunur kalır)
    soft = np.asarray(im.filter(ImageFilter.GaussianBlur(max(1.2, W * 0.0022)))).astype(float) / 255
    a = a * m + soft * 0.82 * (1 - m)
    # nötr: dünya siyah-beyaz, renk yalnızca şişede
    g_ = a.mean(2, keepdims=True)
    a = g_ + (a - g_) * bottle
    # tepeden şişeye ışık huzmesi
    cx = 0.5 * W; topw, botw = 0.05 * W, 0.26 * W; yb = 0.66 * H if mode != "wall" else 0.75 * H
    beam = Image.new("L", (W, H), 0); dr = ImageDraw.Draw(beam)
    dr.polygon([(cx - topw, -0.02 * H), (cx + topw, -0.02 * H), (cx + botw, yb), (cx - botw, yb)], fill=120)
    beam = np.asarray(beam.filter(ImageFilter.GaussianBlur(W * 0.035))).astype(float)[..., None] / 255
    beam *= np.clip(1.05 - y * 0.6, 0, 1)
    rng = np.random.default_rng(7)
    haze = Image.fromarray((rng.random((H // 10, W // 10)) * 255).astype(np.uint8)).resize((W, H), Image.BICUBIC).filter(ImageFilter.GaussianBlur(9))
    beam *= 0.8 + 0.4 * np.asarray(haze).astype(float)[..., None] / 255
    # ışınlar: tepeden açılan ince, yumuşak çizgiler
    yy, xx = np.mgrid[0:H, 0:W].astype(float)
    th = np.arctan2(xx - cx, yy + 0.08 * H)
    rays = 0.82 + 0.18 * (0.6 * np.sin(th * 53 + 1.3) + 0.4 * np.sin(th * 131 + 0.4)) * (0.6 + 0.4 * np.sin(th * 17))
    beam = beam * rays[..., None]
    a = a + beam * WARM * 0.5 * (1 - a * 0.45) * (1 - 0.75 * bottle) * (1 - 0.65 * (m - bottle).clip(0, 1))
    # toz: huzmenin içinde çok küçük, seyrek parlak noktalar
    dust = np.zeros((H, W))
    n = int(W * H / 9000)
    xs = rng.integers(0, W, n); ys = rng.integers(0, H, n); vs = rng.random(n) ** 3
    dust[ys, xs] = vs
    dust = np.asarray(Image.fromarray((dust * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.7))).astype(float)[..., None] / 255 * 3
    a = a + dust * beam * WARM * 0.9 * (1 - bottle)
    # şişe: sahnenin en parlak objesi (hafif pozlama), sıvıdan içten çok hafif sıcak parıltı (neon değil)
    a = a * (1 + 0.1 * bottle)
    lum_b = a.mean(2, keepdims=True)
    a = a + bottle * WARM * 0.06 * np.clip(lum_b - 0.35, 0, 1)
    # şişe: cam kenarlarında ince sıcak beyaz kontur (yalnızca sağ/sol kenarlar)
    if bm is not None:
        inner = bm.filter(ImageFilter.MinFilter(9))
        edge = (np.asarray(bm).astype(float) - np.asarray(inner).astype(float)) / 255
        gx = np.abs(np.gradient(np.asarray(bm.filter(ImageFilter.GaussianBlur(4))).astype(float), axis=1))
        side = np.clip(gx / (gx.max() + 1e-6) * 3, 0, 1)
        edge = np.asarray(Image.fromarray((np.clip(edge * side, 0, 1) * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.6))).astype(float)[..., None] / 255
        a = a + edge * WARM * 0.5
    # düşük bloom (yalnız en parlak yerler)
    hi = np.clip(a.max(2, keepdims=True) - 0.86, 0, 1) * 6
    bl = np.asarray(Image.fromarray((np.clip(hi[..., 0], 0, 1) * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(W * 0.012))).astype(float)[..., None] / 255
    a = a + bl * WARM * 0.12
    # kontrast +%10, siyahlar hafif aşağı, vinyet ~%10
    a = np.clip(a, 0, 1)
    a = np.clip((a - 0.025) / 0.975, 0, 1)
    a = np.clip(a + (a - 0.5) * 0.1, 0, 1)
    d = np.sqrt(((x - 0.5) / 0.6) ** 2 + ((y - 0.5) / 0.66) ** 2)
    a = a * (1 - 0.1 * np.clip((d - 0.45) / 0.7, 0, 1) ** 1.2 * 1.6)
    if mode == "card":  # kart yazısı için altta yumuşak karartma
        a = a * (1 - 0.5 * np.clip((y - 0.82) / 0.18, 0, 1) ** 1.3)
    Image.fromarray((np.clip(a, 0, 1) * 255).astype(np.uint8)).save(f"render/out/{mode}g-{key}.jpg", quality=93)
    print(mode, key)
