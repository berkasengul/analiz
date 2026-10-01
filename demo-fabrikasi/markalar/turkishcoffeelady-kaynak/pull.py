"""Turkish Coffee Lady buzlu kahve kutuları: label.py etiketleri + render/index.html ile çekilen ön/arka "fotoğraflar"
→ demo hattının ürün verisi (products-tr/en.json, merx-raw.json, images/). Kutular henüz satışta değil (ABD lansmanı
Aralık): fiyat yok, site vitrin modunda."""
import json, os
from PIL import Image
S = os.path.dirname(os.path.abspath(__file__)) + "/"
OUT = "/home/user/analiz/demo-fabrikasi/markalar/turkishcoffeelady-shopify/"
KEYS = ["bold-istanbul", "silky-mardin", "piney-aegean", "minty-cappadocia", "pistachio-zeugma"]
tr, en = [], []
for i, h in enumerate(KEYS):
    d = OUT + "images/" + h
    os.makedirs(d, exist_ok=True)
    for n, side in ((1, "front"), (2, "back")):
        im = Image.open(S + f"render/out/{h}-{side}.png").convert("RGBA")
        bg = Image.new("RGBA", im.size, (255, 255, 255, 255))
        bg.alpha_composite(im)
        bg.convert("RGB").save(f"{d}/{n}.jpg", quality=95)
    base = {"id": 1000 + i, "handle": h, "vendor": "Turkish Coffee Lady", "product_type": "Iced Turkish Coffee",
            "permalink": "https://turkishcoffeelady.com/",
            "variants": [{"id": 1000 + i, "title": "250 ml", "price": "0", "compare_at_price": None, "available": True}],
            "images": [{"src": ""}, {"src": ""}]}
    tr.append({**base, "title": h, "body_html": ""})
    en.append({**base, "title": h, "body_html": ""})
json.dump(tr, open(OUT + "products-tr.json", "w"), ensure_ascii=False, indent=1)
json.dump(en, open(OUT + "products-en.json", "w"), ensure_ascii=False, indent=1)
json.dump([{"handle": h, "notes": []} for h in KEYS], open(OUT + "merx-raw.json", "w"))
# Sahneler (her tadın kendi şehri): demo hattının fon klasörüne.
F = "/home/user/analiz/demo-fabrikasi/markalar/turkishcoffeelady-foto/fon/"
os.makedirs(F, exist_ok=True)
meta = json.load(open(S + "render/out/stage.json"))
fon = {}
for h in KEYS:
    Image.open(S + f"render/out/stage-{h}.png").convert("RGB").save(F + f"{h}.webp", quality=88, method=5)
    fon[h] = {"src": f"fon/{h}.webp", **meta[h]}
json.dump(fon, open(F + "fon.json", "w"), indent=1)
print("ok", fon["bold-istanbul"])
