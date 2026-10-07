"""Mum fotoğraflarındaki alevi dokudan siler ve fitilin yerini kaydeder: sitede yerine canlı 3B alev yanar.

Ürün fotoğraflarında alev çoğunlukla aşırı pozlanmış beyaz bir şerittir (üstü de kesimde kırpılır); 3B'de
mumun üstünde donuk bir leke gibi durur. Araç, doku atlasının ön yarısında (labels/<ürün>.webp) fitili
(turuncu-kahve, yanık uç) bulur, üstündeki parlak alevi çevresinden doldurur (cv2.inpaint) ve fitilin ucunu
meta.json'a "flame": [[x, y]] (doku karesine oranla) olarak yazar. shopify-aktar bunu photo3d.flame'e taşır.

    python3 demo-fabrikasi/araclar/mum-alev.py lafann "kokulu-mum|scented-candle"

shopify-foto.py her çalıştığında labels/ yeniden üretilir: bu aracı ondan sonra, aktar'dan önce çalıştırın.
Elle düzeltme: markalar/<marka>-kurallar.json → "foto": {"wick": [["regex", [x, y]]]}.
"""
import json
import os
import re
import sys

import cv2
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
SLUG, RX = sys.argv[1], re.compile(sys.argv[2])
FOTO = os.path.join(HERE, "..", "markalar", f"{SLUG}-foto")
_rules = os.path.join(HERE, "..", "markalar", f"{SLUG}-kurallar.json")
MANUAL = json.load(open(_rules, encoding="utf-8")).get("foto", {}).get("wick", []) if os.path.exists(_rules) else []
meta = json.load(open(os.path.join(FOTO, "meta.json"), encoding="utf-8"))
items = meta if isinstance(meta, list) else meta.get("products", meta)


def wick_of(rgb, alpha, S):
    ys, xs = np.nonzero(alpha > 128)
    top, bot = ys.min(), ys.max()
    y0, y1 = top, top + int((bot - top) * 0.3)
    x0, x1 = int(S * 0.36), int(S * 0.64)
    r, g, b = [rgb[y0:y1, x0:x1, c].astype(int) for c in range(3)]
    m = ((r - g) > 55) & ((g - b) > 5) & (r > 100) & (alpha[y0:y1, x0:x1] > 200)
    n, lab, st, cen = cv2.connectedComponentsWithStats(m.astype(np.uint8), 8)
    if n < 2:
        return None
    k = 1 + int(np.argmax(st[1:, cv2.CC_STAT_AREA]))
    x = st[k, cv2.CC_STAT_LEFT] + st[k, cv2.CC_STAT_WIDTH] / 2 + x0
    # Turuncu bölge alevin dibi ve fitil: alev, alttan dörtte biri yukarıdan başlar (kalanını 3B alev örter).
    y = st[k, cv2.CC_STAT_TOP] + 0.72 * st[k, cv2.CC_STAT_HEIGHT] + y0
    comp = np.zeros(alpha.shape, bool)
    comp[y0:y1, x0:x1] = lab == k
    comp[int(y):, :] = False  # fitil (alt kısım) kalır; üstündeki turuncu alev dibi silinir
    return x / S, y / S, comp


def main():
    for name in sorted(os.listdir(os.path.join(FOTO, "labels"))):
        h = name.rsplit(".", 1)[0]
        if not RX.search(h):
            continue
        path = os.path.join(FOTO, "labels", name)
        im = cv2.imread(path, cv2.IMREAD_UNCHANGED)
        S = im.shape[0]
        front = im[:, :S]
        bgr, alpha = front[..., :3], front[..., 3]
        rgb = bgr[..., ::-1]
        found = wick_of(rgb, alpha, S)
        manual = next((tuple(p) for rx, p in MANUAL if re.search(rx, h)), None)
        w = manual or (found[:2] if found else None)
        if not w:
            print(f"  {h}: fitil bulunamadı (kurallar → foto.wick ile elle verin)")
            continue
        wx, wy = int(w[0] * S), int(w[1] * S)
        # Alev: fitilin üstünde, dar bir sütunda parlak (neredeyse beyaz) pikseller.
        ys = np.nonzero(alpha > 128)[0]
        top = ys.min()
        half = int(S * 0.055)
        reg = bgr[top:wy + int(S * 0.012), wx - half:wx + half].astype(int)
        bright = (reg.min(2) > 175) | (reg.mean(2) > 215)
        mask = np.zeros(alpha.shape, np.uint8)
        mask[top:wy + int(S * 0.012), wx - half:wx + half][bright] = 255
        mask = cv2.dilate(mask, np.ones((9, 9), np.uint8))
        mask[alpha < 128] = 0
        fixed = cv2.inpaint(np.ascontiguousarray(bgr), mask, 7, cv2.INPAINT_TELEA)
        im[:, :S, :3] = fixed
        cv2.imwrite(path, im, [cv2.IMWRITE_WEBP_QUALITY, 95])
        for it in items if isinstance(items, list) else []:
            if it.get("handle") == h:
                it["flame"] = [[round(w[0], 4), round(w[1], 4)]]
        if isinstance(items, dict) and h in items:
            items[h]["flame"] = [[round(w[0], 4), round(w[1], 4)]]
        print(f"  {h:52} fitil {w[0]:.3f} {w[1]:.3f}  alev pikseli {int((mask > 0).sum())}")
    json.dump(meta, open(os.path.join(FOTO, "meta.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)


if __name__ == "__main__":
    main()
