"""Turkish Coffee Lady buzlu kahve kutuları: label.py etiketleri + render/index.html ile çekilen ön/arka "fotoğraflar"
→ demo hattının ürün verisi (products-tr/en.json, merx-raw.json, images/). Kutular henüz satışta değil (ABD lansmanı
Aralık): fiyat yok, site vitrin modunda."""
import json, os
from PIL import Image
S = os.path.dirname(os.path.abspath(__file__)) + "/"
OUT = "/home/user/analiz/demo-fabrikasi/markalar/turkishcoffeelady-shopify/"
KEYS = ["bold-istanbul", "silky-mardin", "piney-aegean", "minty-cappadocia", "pistachio-zeugma"]
NAMES = {"bold-istanbul": "Bold Istanbul", "silky-mardin": "Silky Mardin", "piney-aegean": "Piney Aegean", "minty-cappadocia": "Minty Cappadocia", "pistachio-zeugma": "Pistachio Zeugma"}
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
    tr.append({**base, "title": NAMES[h], "body_html": ""})
    en.append({**base, "title": NAMES[h], "body_html": ""})
json.dump(tr, open(OUT + "products-tr.json", "w"), ensure_ascii=False, indent=1)
json.dump(en, open(OUT + "products-en.json", "w"), ensure_ascii=False, indent=1)
json.dump([{"handle": h, "notes": []} for h in KEYS], open(OUT + "merx-raw.json", "w"))
# Sahneler (her tadın kendi şehri; render/sergi.html): ana sayfa fonu (kaide, kutusuz), hikâye/tat bulucu duvarı,
# sergi görseli (kutu + kaide, şeffaf), boş kaide ve koleksiyon kartı.
F = "/home/user/analiz/demo-fabrikasi/markalar/turkishcoffeelady-foto/fon/"
SAHNE = "/home/user/analiz/demo-fabrikasi/markalar/turkishcoffeelady-foto/sahne/"
os.makedirs(F, exist_ok=True); os.makedirs(SAHNE, exist_ok=True)
meta = json.load(open(S + "render/out/stage.json"))


# Sergi görselleri ve boş kaide aynı çerçeveyle kırpılır: sitede aynı ölçekte durur (kaide yerinden oynamaz).
EX = {h: Image.open(S + f"render/out/exhibit-{h}.png").convert("RGBA") for h in KEYS}
PL = Image.open(S + "render/out/plinth-gold.png").convert("RGBA")
boxes = [im.getchannel("A").point(lambda v: 255 if v > 8 else 0).getbbox() for im in [*EX.values(), PL]]
BOX = (min(b[0] for b in boxes), min(b[1] for b in boxes), max(b[2] for b in boxes), max(b[3] for b in boxes))
BOX = (max(0, BOX[0] - 16), max(0, BOX[1] - 16), min(PL.width, BOX[2] + 16), min(PL.height, BOX[3] + 8))


def trim(im):
    out = im.crop(BOX)
    out.thumbnail((900, 1100))
    return out


fon = {}
for h in KEYS:
    Image.open(S + f"render/out/stage-{h}.png").convert("RGB").save(F + f"{h}.webp", quality=88, method=5)
    wall = Image.open(S + f"render/bdc-{h}.jpg").convert("RGB"); wall.thumbnail((1600, 1600))
    wall.save(F + f"{h}-duvar.webp", quality=82, method=5)
    ex = trim(EX[h])
    ex.save(F + f"{h}-sergi.webp", quality=88, method=5)
    Image.open(S + f"render/out/cardg-{h}.jpg").convert("RGB").save(SAHNE + f"{h}.webp", quality=88, method=5)
    # base: kaidenin üst yüzü; kutunun alt kenarı mine halkanın içine oturur (görsel ölçümle)
    fon[h] = {"src": f"fon/{h}.webp", **meta[h], "base": 0.678, "wall": f"fon/{h}-duvar.webp", "exhibit": f"fon/{h}-sergi.webp"}
pl = trim(PL)
pl.save(F + "kaide.webp", quality=88, method=5)
json.dump(fon, open(F + "fon.json", "w"), indent=1)
print("ok", fon["bold-istanbul"])
