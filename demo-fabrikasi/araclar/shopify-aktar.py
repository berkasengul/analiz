"""Shopify markası: çekilen ürünleri (metin, fiyat, varyant) ve işlenmiş fotoğrafları
markanın ayar dosyasına (markalar/<marka>.json) aktarır. Her marka için ortak.

Önce:  python3 demo-fabrikasi/araclar/shopify-cek.py <alan-adı> <marka>
       python3 demo-fabrikasi/araclar/shopify-foto.py <marka>
Sonra: python3 demo-fabrikasi/araclar/shopify-aktar.py <marka>
       python3 demo-fabrikasi/yeni-demo.py demo-fabrikasi/markalar/<marka>.json

Kurallar: markalar/<marka>-kurallar.json → "aktar":
    "domain": "turkan.com.tr"             sepet bu mağazanın ödeme sayfasına gider
    "namePrefix": "^Türkan\\s+"            ürün adından atılacak marka öneki
    "idPrefix": "turkan-"                  ürün kimliğinden atılacak önek
    "categories": [{"id", "tr", "en", "color", "descTr", "descEn", "match": "regex"}]  (sıra önemli)
    "family": {"Shopify vendor/product_type": ["tr", "en"]}   ürün ailesi (yoksa kategori adı)
    "profiles": {"flask": "regex", "flat": "regex", "tube": "regex", "depthRatio": 0.42,
                 "flatDepth": [["regex", 0.3]]}
    "notes": [["regex", [["tr", "en"], ...]]]   ürün çipleri (markanın metninden)
    "home": ["handle", ...]                 ana sayfanın 3B akışı (sırayla)
    "ritual": [{"handle", "tr": {title, text, stat}, "en": {...}}]
    "rename": {"handle": ["tr", "en"]}
    "tagline": "notes"                     kısa alt yazı: ürünün ilk üç notası (uzun açıklama cümlesi yerine)
    "defaultSize": "100 ml"                 ürün adında hacim yoksa (bütün ürünler aynı hacimde)
    "sizes": [["regex", "50 ml"]]           tek tek ürünlerin hacmi (defaultSize'dan önce)
    "trText": {"handle": "Türkçe açıklama"}   mağaza yalnızca İngilizceyse: markanın metninin Türkçe çevirisi
                                             (İngilizce metin mağazadan olduğu gibi kalır)
    "platform": "ikas"              mağaza ikas (ikas-cek.py ile çekildi): sepette ödeme, ürünün mağazadaki sayfasında tamamlanır
    "library": [{"match": "regex", "composition": {"tr": [..], "en": [..]}, "year": {"tr": "Ocak 2026", "en": "January 2026"}}]
                                             markanın koku kütüphanesi: tam kompozisyon ve çıkış tarihi (ürün sayfasında)
    "themeAccent": "#c9a55c"                 sahne ışığının ikinci rengi bütün ürünlerde bu olur
    "themeGlow": 0.27                        sahne ışığının parlaklığı (koyu, kadife sahne için düşük)
    "palette": [["regex", "#ana", "#vurgu"]]  ürüne özel sahne ve kart rengi (ilk eşleşen)      aynı adlı ürünleri ayırt etmek için markanın kendi adları
Uydurma içerik yok: metin, fiyat, görsel markanın sitesinden.
"""
import html
import json
import os
import re
import sys

if len(sys.argv) < 2:
    sys.exit(__doc__)
SLUG = sys.argv[1]
HERE = os.path.dirname(os.path.abspath(__file__))
MARKA = os.path.join(HERE, "..", "markalar")
PATH = os.path.join(MARKA, f"{SLUG}.json")
SHOP = os.path.join(MARKA, f"{SLUG}-shopify")
FOTO = os.path.join(MARKA, f"{SLUG}-foto")
R = json.load(open(os.path.join(MARKA, f"{SLUG}-kurallar.json"), encoding="utf-8"))["aktar"]


def text(h):
    # Açıklamaya gömülü stil ve betik blokları (ör. tema CSS'i) metne karışmasın.
    h = re.sub(r"(?is)<(style|script)\b.*?</\1>", "", h or "")
    h = re.sub(r"<(br|/p|/li|/h\d|/div)[^>]*>", "\n", h)
    return html.unescape(re.sub(r"<[^>]+>", "", h))


def paras(h):
    return [re.sub(r"\s+", " ", p).strip() for p in text(h).split("\n") if p.strip()]


def clip(s, n):
    if len(s) <= n:
        return s
    cut = s[:n]
    m = max(cut.rfind(". "), cut.rfind("; "), cut.rfind("… "), cut.rfind("? "))
    return (cut[: m + 1] if m > n * 0.5 else cut.rsplit(" ", 1)[0] + "…").strip()


def first_sentence(s, n=64):
    first = re.split(r"(?<=[.!?…])\s", s)[0]
    return clip(first, n).rstrip(".")


SIZE = re.compile(r"\s*[-–]?\s*\(?(\d+(?:[.,]\d+)?)\s*(ml|gr|g)\)?\s*$", re.I)


def split_name(title):
    name = re.sub(R.get("namePrefix", r"^$"), "", title.strip())
    m = SIZE.search(name)
    size = None
    if m:
        size = f"{m.group(1)} {'ml' if m.group(2).lower() == 'ml' else 'g'}"
        name = name[: m.start()].strip(" -–")
    return name, size


def hexc(rgb):
    return "#%02x%02x%02x" % tuple(max(0, min(255, int(v))) for v in rgb)


def theme(rgb, accent=None, glow_l=0.27):
    import colorsys

    def hsl(c):
        h, l, s_ = colorsys.rgb_to_hls(*[v / 255 for v in c])
        return h, s_, l

    def from_hsl(h, s_, l):
        return hexc([v * 255 for v in colorsys.hls_to_rgb(h, l, max(0, min(1, s_)))])

    h, s_, _ = hsl(rgb)
    ah, as_, _ = hsl(accent or rgb)
    return {"glow": from_hsl(h, s_ * 1.1 + 0.08, glow_l), "edge": from_hsl(h, s_ * 0.6, 0.035),
            "drop": from_hsl(h, s_ * 0.5, 0.86), "accent": from_hsl(ah, as_ * 1.1 + 0.1, 0.34), "mood": "warm"}


def photo3d(h, m):
    P = R.get("profiles", {})
    if m.get("parts"):
        return {"profile": "group", "parts": [photo3d(p["handle"], p) for p in m["parts"]]}
    shape = {"axis": m.get("axis", 0.5), "rows": m.get("rows", []), "outline": m.get("outline", []), "edge": hexc(m.get("edge", [120, 110, 90]))}
    if m.get("clear"):
        shape.update(clear=True, liquid=hexc(m["liquid"]))
    if m.get("glass"):
        shape["glass"] = True
    if P.get("flask") and re.search(P["flask"], h) and m.get("neck"):
        return {"profile": "flask", "neck": m["neck"], "depthRatio": P.get("depthRatio", 0.42), **shape}
    if P.get("flat") and re.search(P["flat"], h):
        return {"profile": "flat", "depth": next((d for rx, d in P.get("flatDepth", []) if re.search(rx, h)), 0.34), **shape}
    return {"profile": "round", "zScale": 0.72 if P.get("tube") and re.search(P["tube"], h) else 1, **shape}


def views3d(h, m):
    """Galeri çekimlerinin 3B görünümleri (shopify-foto → views): galeri sırasıyla, olmayan yerde None."""
    V = m.get("views") or {}
    out = []
    for i in range(len(m.get("gallery", []))):
        v = V.get(str(i))
        if not v:
            out.append(None)
            continue
        shape = {"axis": v.get("axis", 0.5), "rows": v.get("rows", []), "outline": v.get("outline", []), "edge": hexc(v.get("edge", [120, 110, 90]))}
        p3 = {"profile": "flat", "depth": 0.32, **shape} if v.get("flat") else photo3d(h, v)
        out.append({"file": v["file"], "photo3d": p3})
    return out if any(out) else None


def dump(c, path):
    s = json.dumps(c, ensure_ascii=False, indent=2)
    s = re.sub(r"\[\s+([-\d.eE,\s]+?)\s+\]", lambda m: "[" + ", ".join(x.strip() for x in m.group(1).split(",")) + "]", s)
    open(path, "w", encoding="utf-8").write(s + "\n")


def main():
    c = json.load(open(PATH, encoding="utf-8"))
    tr = {p["handle"]: p for p in json.load(open(os.path.join(SHOP, "products-tr.json"), encoding="utf-8"))}
    en_list = json.load(open(os.path.join(SHOP, "products-en.json"), encoding="utf-8"))
    en = {p["handle"]: p for p in en_list}
    # İngilizce mağazada kimlik aynı ürün numarasıyla eşleşir (handle farklı olabilir).
    en_by_id = {p["id"]: p for p in en_list}
    meta = json.load(open(os.path.join(FOTO, "meta.json"), encoding="utf-8"))
    CATS = R["categories"]
    cats = {k["id"]: dict(id=k["id"], name={"tr": k["tr"], "en": k["en"]}, color=k["color"], desc={"tr": k["descTr"], "en": k["descEn"]}) for k in CATS}

    def cat_of(h):
        p = tr[h]
        key = f"{h} {p.get('vendor', '')} {p.get('product_type', '')}"
        return next(k["id"] for k in CATS if re.search(k["match"], key, re.I))

    def notes_of(h):
        return next((n for rx, n in R.get("notes", []) if re.search(rx, h)), None)

    def info(h):
        p = tr[h]
        q = en.get(h) or en_by_id.get(p["id"], {})
        name, size = split_name(p["title"])
        size = size or next((v for rx, v in R.get("sizes", []) if re.search(rx, h)), None) or R.get("defaultSize")
        en_name, _ = split_name(q.get("title") or p["title"])
        if h in R.get("rename", {}):
            name, en_name = R["rename"][h]
        ps = [x for x in paras(p["body_html"]) if len(x) > 40 and not re.match(r"(kullanım|uyarı|set içeriği)", x, re.I)]
        qs = [x for x in paras(q.get("body_html")) if len(x) > 40]
        desc = clip(ps[0] if ps else name, 330)
        en_desc = clip(qs[0] if qs else desc, 330)
        if h in R.get("trText", {}):
            desc = clip(R["trText"][h], 330)
        v = p["variants"][0]
        price = float(v["price"])
        cmp_ = float(v["compare_at_price"]) if v.get("compare_at_price") and float(v["compare_at_price"]) > price else None
        fam = R.get("family", {}).get(p.get("vendor") or p.get("product_type") or "")
        variants = [{"id": x["id"], "title": x["title"]} for x in p["variants"] if x.get("available", True)] or [{"id": v["id"], "title": v["title"]}]
        return dict(name=name, en_name=en_name, size=size, desc=desc, en_desc=en_desc, tag=first_sentence(desc), en_tag=first_sentence(en_desc),
                    price=price, compare=cmp_, m=meta.get(h, {}), cat=cat_of(h), fam=fam, variants=variants)

    def palette_of(h):
        """Ürüne özel sahne rengi (kurallar → palette: [["regex", "#zemin", "#vurgu", "#kenar"?], ...])."""
        return next(((e[1], e[2], e[3] if len(e) > 3 else "#050404") for e in R.get("palette", []) if re.search(e[0], h)), None)

    def photo_product(h):
        i = info(h)
        rgb = i["m"].get("color", [150, 120, 90])
        pal = palette_of(h)
        cat = cats[i["cat"]]
        fam = i["fam"] or [cat["name"]["tr"], cat["name"]["en"]]
        notes = notes_of(h) or [[cat["name"]["tr"], cat["name"]["en"]]]
        return {
            "name": i["name"], "form": "photo", "sub": i["size"] or fam[0], "collection": None,
            "family": fam[0], "year": None, "perfumer": None, "color": hexc(rgb), "ink": "#1f1a17",
            # Sahne ışığının ikinci rengi: markanın tema vurgusu (ör. altın) ya da ürünün kendi rengi.
            # Sahne ışığı: ürüne özel renk (palette) ya da ürün rengi + tema vurgusu.
            "theme": ({"glow": pal[0], "edge": pal[2], "drop": pal[1], "accent": pal[1], "mood": "warm"} if pal else
                      theme(rgb, [int(R["themeAccent"][k:k + 2], 16) for k in (1, 3, 5)] if R.get("themeAccent") else i["m"].get("accent"),
                            R.get("themeGlow", 0.27))), "tagline": " · ".join(a for a, _ in notes[:3]) if R.get("tagline") == "notes" and notes_of(h) else i["tag"], "notes": [a for a, _ in notes],
            "description": i["desc"], "file": f"{h}.webp", "handle": h,
            "en": {"name": i["en_name"], "family": fam[1], "tagline": " · ".join(b for _, b in notes[:3]) if R.get("tagline") == "notes" and notes_of(h) else i["en_tag"], "notes": [b for _, b in notes],
                   "description": i["en_desc"], "sub": i["size"] or fam[1]},
            "label": {"style": "photo"},
            "photo3d": photo3d(h, i["m"]),
        }

    order = [k["id"] for k in CATS]
    fon_json = os.path.join(FOTO, "fon", "fon.json")
    FON = json.load(open(fon_json)) if os.path.exists(fon_json) else {}
    handles = [h for h in R.get("home", []) if h in meta and "cut" in meta[h]]
    handles += [h for h in sorted(tr, key=lambda x: (order.index(cat_of(x)), x)) if h not in handles and h in meta and "cut" in meta[h]]
    products = [photo_product(h) for h in handles]

    items_out = []
    for idx, (p, h) in enumerate(zip(products, handles)):
        i = info(h)
        p["price"] = {"tr": i["price"], "en": i["price"]}
        p["photos"] = i["m"].get("gallery", [])
        # Ana sayfa sergisinin arka planı: ürünsüz sahne fotoğrafı (araclar/sahne-birlestir.py → fon/fon.json).
        if h in FON:
            p["stage"] = FON[h]
        # Markanın koku kütüphanesinden: tam kompozisyon ve çıkış tarihi (kurallar → library).
        lib = next((e for e in R.get("library", []) if re.search(e["match"], h)), None)
        if lib:
            for k in ("composition", "year"):
                if k in lib:
                    p[k], p["en"][k] = lib[k]["tr"], lib[k]["en"]
        views = views3d(h, i["m"])
        if views:
            p["views"] = views
            p["heroPhoto"] = i["m"].get("hero", 0)
        item = {
            "id": re.sub("^" + re.escape(R.get("idPrefix", "")), "", h), "name": {"tr": p["name"], "en": p["en"]["name"]},
            "category": i["cat"], "size": i["size"], "price": p["price"], "exactPrice": True,
            "desc": {"tr": clip(i["desc"], 120), "en": clip(i["en_desc"], 120)}, "color": p["color"], "product": idx,
            # Kart görseli: sitenin 3B modelinden çekilen görüntü (araclar/kart-3b.py) varsa o, yoksa fotoğraf kesiti.
            # Kart sahnesi: ürün 3B sergide (kart-3b.py --stage) — varsa kart bu tam kare görseli kullanır.
            **({"scene": f"sahne/{h}.webp"} if os.path.exists(os.path.join(FOTO, "sahne", f"{h}.webp")) else {}),
            "image": f"r3d/{h}.webp" if os.path.exists(os.path.join(FOTO, "render3d", f"{h}.webp")) else i["m"].get("cut"), "cutout": True,
            **({"bg": palette_of(h)[0], "bg2": palette_of(h)[1]} if palette_of(h) else {}),
            "variants": [{"id": x["id"], "title": x["title"]} for x in i["variants"]] if len(i["variants"]) > 1 else [{"id": i["variants"][0]["id"]}],
            "url": f"https://{R['domain']}/{h}" if R.get("platform") == "ikas" else f"https://{R['domain']}/products/{h}",
        }
        if i["compare"]:
            item["compareAt"] = {"tr": i["compare"], "en": i["compare"]}
        items_out.append(item)
    items_out.sort(key=lambda x: order.index(x["category"]))

    c["products"] = products
    c["home"] = list(range(len(R.get("home", [])))) if R.get("home") else list(range(min(8, len(products))))
    # Ritüel adımları yalnızca ana sayfadaki ürünleri gösterebilir (sahnede yalnızca onlar var).
    n_home = len(c["home"])
    for r in R.get("ritual", []):
        if r["handle"] not in handles[:n_home]:
            print(f"! ritüel adımı ana sayfada olmayan ürünü gösteriyor, atlandı: {r['handle']}")
    c["ritual"] = [{"flavor": handles.index(r["handle"]), "tr": r["tr"], "en": r["en"]} for r in R.get("ritual", []) if r["handle"] in handles[:n_home]]
    c["catalog"]["categories"] = [cats[k] for k in order if any(x["category"] == k for x in items_out)]
    c["catalog"]["items"] = items_out
    c["defaultShopFlavor"] = 0
    # Mağaza altyapısı: Shopify (sepet bağlantısı) ya da ikas (sepet bağlantısı yok: ürün sayfası açılır).
    if R.get("platform") == "ikas":
        c.setdefault("commerce", {}).pop("shopify", None)
        c["commerce"]["ikas"] = f"https://{R['domain']}"
    else:
        c.setdefault("commerce", {})["shopify"] = f"https://{R['domain']}"
    dump(c, PATH)
    for k in order:
        n = sum(x["category"] == k for x in items_out)
        if n:
            print(f"{k:10} {n:3} ürün")
    print(len(products), "ürün; ana sayfa:", [products[i]["name"] for i in c["home"]])


if __name__ == "__main__":
    main()
