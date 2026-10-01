"""Ephemeral Dyadic (Wix mağazası) → demo hattının ürün verisi (products-tr/en.json, merx-raw.json, images/).
Ürün sayfalarındaki JSON-LD ve medya listesinden (products.json, img/). Ödeme Wix'te: ürün sayfası açılır (platform merx).
Ayrıca her kokunun kutu deseni (kutu fotoğrafının ön yüzü) art/<koku>.png olarak kırpılır: sahne fonu."""
import json, os, re
import numpy as np
from PIL import Image
S = os.path.dirname(os.path.abspath(__file__)) + "/"
OUT = "/home/user/analiz/demo-fabrikasi/markalar/ephemeraldyadic-shopify/"
P = json.load(open(S + "products.json"))
NAMES = {"acid-aqua": "Acid Aqua", "another-world": "Another World", "bodhi-utah": "Bodhi & Utah", "dark-dreams": "Dark Dreams",
         "liquid-skin": "Liquid Skin", "lost-chemistry": "Lost Chemistry", "missing-feeling": "Missing Feeling", "no-taboos": "No Taboos",
         "ozymandias": "Ozymandias", "psychic-vibrations": "Psychic Vibrations"}
BOX = {"another-world": 3}  # kutu deseni bu görselde (2. görsel şiir yazısı)
os.makedirs(S + "art", exist_ok=True)
tr, en, raw = [], [], []
for i, h in enumerate(NAMES):
    d = OUT + "images/" + h
    os.makedirs(d, exist_ok=True)
    b = BOX.get(h, 2)
    for n, src in ((1, 1), (2, b)):
        Image.open(S + f"img/{h}-{src}.jpg").convert("RGB").save(f"{d}/{n}.jpg", quality=94)
    # kutu deseni: açık zeminde kutunun ön yüzü (satır/sütunların çoğu zeminden koyu)
    im = Image.open(S + f"img/{h}-{b}.jpg").convert("RGB")
    a = np.asarray(im.convert("L")).astype(float)
    dark = a < 236
    rows = np.where(dark.mean(1) > 0.35)[0]; cols = np.where(dark.mean(0) > 0.35)[0]
    y0, y1, x0, x1 = rows[0], rows[-1], cols[0], cols[-1]
    m = int(0.025 * min(y1 - y0, x1 - x0))
    box = {"psychic-vibrations": (300, 525, 830, 1065)}.get(h, (x0 + m, y0 + m, x1 - m, y1 - m))  # küçük kutu: elle
    im.crop(box).save(S + f"art/{h}.png")
    body = P[h]["text"]
    base = {"id": 2000 + i, "handle": h, "vendor": "Ephemeral Dyadic", "product_type": "Eau de Parfum",
            "permalink": f"https://www.ephemeraldyadic.com/product-page/{h}",
            "variants": [{"id": 2000 + i, "title": "50 ml", "price": str(P[h]["price"]), "compare_at_price": None, "available": True}],
            "images": [{"src": ""}, {"src": ""}]}
    html = "".join(f"<p>{l}</p>" for l in body.split("\n"))
    tr.append({**base, "title": NAMES[h], "body_html": html})
    en.append({**base, "title": NAMES[h], "body_html": html})
    raw.append({"handle": h, "notes": []})
    print(h, (x0, y0, x1, y1))
json.dump(tr, open(OUT + "products-tr.json", "w"), ensure_ascii=False, indent=1)
json.dump(en, open(OUT + "products-en.json", "w"), ensure_ascii=False, indent=1)
json.dump(raw, open(OUT + "merx-raw.json", "w"))
