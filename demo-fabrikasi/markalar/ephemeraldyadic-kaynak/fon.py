"""Ephemeral Dyadic sahneleri (render/sergi.html) → demo hattı: ana sayfa fonu (kaide, şişesiz), hikâye duvarı,
sergi görseli (şişe + kaide, şeffaf; boş kaideyle aynı çerçevede kırpılır) ve koleksiyon kartı."""
import json, os
from PIL import Image
S = os.path.dirname(os.path.abspath(__file__)) + "/"
R = S + "render/out/"
FOTO = "/home/user/analiz/demo-fabrikasi/markalar/ephemeraldyadic-foto/"
F, SAHNE = FOTO + "fon/", FOTO + "sahne/"
os.makedirs(F, exist_ok=True); os.makedirs(SAHNE, exist_ok=True)
KEYS = ["acid-aqua", "another-world", "bodhi-utah", "dark-dreams", "liquid-skin", "lost-chemistry", "missing-feeling", "no-taboos", "ozymandias", "psychic-vibrations"]
meta = json.load(open(R + "stage.json"))
EX = {h: Image.open(R + f"exhibit-{h}.png").convert("RGBA") for h in KEYS}
PL = Image.open(R + "plinth-gray.png").convert("RGBA")
bx = [im.getchannel("A").point(lambda v: 255 if v > 8 else 0).getbbox() for im in [*EX.values(), PL]]
BOX = (max(0, min(b[0] for b in bx) - 16), max(0, min(b[1] for b in bx) - 16), min(PL.width, max(b[2] for b in bx) + 16), min(PL.height, max(b[3] for b in bx) + 8))


def trim(im):
    out = im.crop(BOX); out.thumbnail((900, 1100)); return out


fon = {}
for h in KEYS:
    Image.open(R + f"stageg-{h}.jpg").convert("RGB").save(F + f"{h}.webp", quality=90, method=5)
    Image.open(R + f"wallg-{h}.jpg").convert("RGB").save(F + f"{h}-duvar.webp", quality=86, method=5)
    trim(EX[h]).save(F + f"{h}-sergi.webp", quality=88, method=5)
    Image.open(R + f"cardg-{h}.jpg").convert("RGB").save(SAHNE + f"{h}.webp", quality=88, method=5)
    # vivid: aydınlık galeri fotoğrafı sitede karartılmadan, net gösterilir
    fon[h] = {"src": f"fon/{h}.webp", **meta[h], "vivid": 1, "wall": f"fon/{h}-duvar.webp", "exhibit": f"fon/{h}-sergi.webp"}
trim(PL).save(F + "kaide.webp", quality=88, method=5)
json.dump(fon, open(F + "fon.json", "w"), indent=1)
print("ok", fon[KEYS[0]])
