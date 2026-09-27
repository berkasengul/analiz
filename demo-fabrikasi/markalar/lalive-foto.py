"""Lalive: Shopify'dan çekilen ürün fotoğraflarını siteye hazırlar.

Girdi: lalive-shopify/ (araclar/shopify-cek.py çıktısı, orijinal boyutlu görseller)
Çıktı: lalive-foto/
    web/<ürün>/<n>.webp     galeri görselleri (en uzun kenar 1400 px, şeffaf olanlar açık zemine)
    cut/<ürün>.webp         ürünün kesilmiş (şeffaf zeminli) ana fotoğrafı: kartlarda
    labels/<ürün>.webp      3B doku atlası: sol yarı ön yüz, sağ yarı arka yüz (alfa = ürün silüeti)
    meta.json               ürün başına en/boy oranı, baskın renk, galeri, yaşam tarzı fotoğrafı

Kullanım: python3 demo-fabrikasi/markalar/lalive-foto.py
"""
import glob
import json
import os

import numpy as np
from PIL import Image, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, "lalive-shopify")
OUT = os.path.join(HERE, "lalive-foto")
S = 1024  # atlasın bir yarısı
BG = (244, 241, 234)  # galeride şeffaf fotoğrafların zemini


def kind(im):
    """T: şeffaf zemin, W: beyaz zemin, L: yaşam tarzı / sahne fotoğrafı."""
    a = np.asarray(im.convert("RGBA"))
    b = np.concatenate([a[:8].reshape(-1, 4), a[-8:].reshape(-1, 4), a[:, :8].reshape(-1, 4), a[:, -8:].reshape(-1, 4)])
    if (b[:, 3] < 20).mean() > 0.8:
        return "T"
    if ((b[:, :3].min(1) > 235) & (b[:, 3] > 200)).mean() > 0.85:
        return "W"
    return "L"


def cutout(im, k):
    """RGBA ürün kesiti (beyaz zemin kenardan başlayarak şeffaflaştırılır)."""
    im = im.convert("RGBA")
    if k == "W":
        a = np.asarray(im).copy()
        white = a[..., :3].min(2) > 238
        # Kenara bağlı beyaz alanlar zemin; ürünün içindeki beyazlar kalır.
        from collections import deque

        h, w = white.shape
        bg = np.zeros_like(white)
        q = deque([(y, x) for y in (0, h - 1) for x in range(0, w, 4)] + [(y, x) for x in (0, w - 1) for y in range(0, h, 4)])
        while q:
            y, x = q.popleft()
            if 0 <= y < h and 0 <= x < w and white[y, x] and not bg[y, x]:
                bg[y, x] = True
                q.extend(((y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)))
        alpha = np.where(bg, 0, 255).astype(np.uint8)
        a[..., 3] = np.asarray(Image.fromarray(alpha).filter(ImageFilter.GaussianBlur(1.2)))
        im = Image.fromarray(a)
    box = im.getchannel("A").point(lambda v: 255 if v > 12 else 0).getbbox()
    return im.crop(box) if box else im


def fit(im, size, margin=0.03):
    """Kesiti kare tuvale ortalar (en uzun kenar tuvalin %94'ü)."""
    w, h = im.size
    k = size * (1 - 2 * margin) / max(w, h)
    im = im.resize((max(1, round(w * k)), max(1, round(h * k))), Image.LANCZOS)
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    canvas.paste(im, ((size - im.width) // 2, (size - im.height) // 2), im)
    return canvas


def mask_iou(a, b):
    a = np.asarray(a.getchannel("A")) > 128
    b = np.asarray(b.getchannel("A")) > 128
    return (a & b).sum() / max(1, (a | b).sum())


def dominant(im):
    a = np.asarray(im.convert("RGBA").resize((96, 96))).reshape(-1, 4).astype(float)
    a = a[a[:, 3] > 200][:, :3]
    if not len(a):
        return [120, 110, 90]
    sat = a.max(1) - a.min(1)
    lum = a.mean(1)
    pick = a[(sat > 25) & (lum > 30) & (lum < 235)]
    return [int(v) for v in np.median(pick if len(pick) > 50 else a, 0)]


def main():
    meta = {}
    for d in sorted(glob.glob(os.path.join(SRC, "images", "*"))):
        handle = os.path.basename(d)
        files = sorted(glob.glob(os.path.join(d, "*")), key=lambda f: int(os.path.basename(f).split(".")[0]))
        if not files:
            continue
        ims = [Image.open(f) for f in files]
        kinds = [kind(im) for im in ims]
        os.makedirs(os.path.join(OUT, "web", handle), exist_ok=True)
        gallery = []
        for i, (im, k) in enumerate(zip(ims, kinds), 1):
            g = im.convert("RGBA")
            g.thumbnail((1400, 1400), Image.LANCZOS)
            if k == "T":
                bg = Image.new("RGBA", g.size, BG + (255,))
                bg.alpha_composite(g)
                g = bg
            path = f"foto/{handle}/{i}.webp"
            g.convert("RGB").save(os.path.join(OUT, "web", handle, f"{i}.webp"), quality=82, method=5)
            gallery.append(path)

        # Ana (ön) fotoğraf: ilk şeffaf ya da beyaz zeminli çekim.
        hero_i = next((i for i, k in enumerate(kinds) if k in "TW"), None)
        life_i = next((i for i, k in enumerate(kinds) if k == "L"), None)
        entry = {"gallery": gallery, "lifestyle": gallery[life_i] if life_i is not None else None, "kinds": "".join(kinds)}
        if hero_i is not None:
            front = cutout(ims[hero_i], kinds[hero_i])
            entry["aspect"] = round(front.height / front.width, 4)
            entry["color"] = dominant(front)
            c = front.copy()
            c.thumbnail((1200, 1200), Image.LANCZOS)
            os.makedirs(os.path.join(OUT, "cut"), exist_ok=True)
            c.save(os.path.join(OUT, "cut", f"{handle}.webp"), quality=86, method=5)
            entry["cut"] = f"cut/{handle}.webp"

            F = fit(front, S)
            # Arka yüz: silüeti ön yüzün aynasıyla örtüşen başka bir ürün çekimi.
            mirror = F.transpose(Image.FLIP_LEFT_RIGHT)
            back, best = None, 0.0
            for i, k in enumerate(kinds):
                if i == hero_i or k not in "TW":
                    continue
                cand = fit(cutout(ims[i], k), S)
                iou = mask_iou(cand, mirror)
                if iou > best:
                    back, best = cand, iou
            if back is None or best < 0.86:
                # Arka fotoğraf yoksa: ön yüzün aynası, bulanık ve biraz koyu (okunmayan arka etiket).
                back = mirror.filter(ImageFilter.GaussianBlur(22))
                arr = np.asarray(back).astype(np.float32)
                arr[..., :3] *= 0.8
                back = Image.fromarray(arr.clip(0, 255).astype(np.uint8))
                entry["back"] = False
            else:
                entry["back"] = True
            # Arka yarının alfa kanalı ön silüetin aynası: iki yüz aynı sınırda buluşur.
            # Boş kalan pikseller (silüet farkı) bulanık ayna ile doldurulur.
            fill = mirror.filter(ImageFilter.GaussianBlur(10))
            fill.alpha_composite(back)
            fill.putalpha(mirror.getchannel("A"))
            atlas = Image.new("RGBA", (2 * S, S))
            atlas.paste(F, (0, 0))
            atlas.paste(fill, (S, 0))
            os.makedirs(os.path.join(OUT, "labels"), exist_ok=True)
            atlas.save(os.path.join(OUT, "labels", f"{handle}.webp"), quality=86, method=5)
        meta[handle] = entry
        print(handle, entry["kinds"], "arka" if entry.get("back") else "-")
    json.dump(meta, open(os.path.join(OUT, "meta.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(len(meta), "ürün hazır")


if __name__ == "__main__":
    main()
