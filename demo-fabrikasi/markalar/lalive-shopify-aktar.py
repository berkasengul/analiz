"""Lalive: markanın sitesindeki bütün ürünleri (Shopify verisi + işlenmiş fotoğraflar)
lalive.json'a aktarır. Metin, fiyat, indirimli fiyat, görseller markanın sitesinden;
uydurma içerik yok.

Önce:  python3 demo-fabrikasi/araclar/shopify-cek.py www.lalivenatural.com lalive
       python3 demo-fabrikasi/markalar/lalive-foto.py
Sonra: python3 demo-fabrikasi/markalar/lalive-shopify-aktar.py
       python3 demo-fabrikasi/yeni-demo.py demo-fabrikasi/markalar/lalive.json

Elle modellenmiş 3B ürünler (fotoğraftan birebir çizildi) korunur: El Kremi, Dudak Balmı,
Bronzlaştırıcı Yağ, Besleyici Yüz Bakım Yağı. Diğer bütün ürünler 3B'de kendi fotoğraflarından
üretilir (form "photo"). Tekrar çalıştırmak güvenlidir.
"""
import html
import json
import os
import re

HERE = os.path.dirname(os.path.abspath(__file__))
PATH = os.path.join(HERE, "lalive.json")
SHOP = os.path.join(HERE, "lalive-shopify")
FOTO = os.path.join(HERE, "lalive-foto")

# Elle modellenmiş ürünler: etiket dosyası → Shopify ürünü.
MODELED = {
    "el-kremi.jpg": "lalive-el-kremi-50-ml",
    "dudak-balmi.jpg": "lalive-dudak-balmi",
    "bronzlastirici-yag.jpg": "lalive-bronzlastirici-yag",
    "yuz-yagi.jpg": "lalive-besleyici-yuz-bakim-yagi",
}
# Tahminle çizilmiş eski modeller: gerçek fotoğraflarıyla değiştirilir (ana sayfa sırası korunur).
REPLACE = {"gunes-kremi.jpg": "lalive-mineral-filtreli-gunes-kremi", "yuz-misti.jpg": "lalive-dogal-yuz-misti"}

# Kategoriler (markanın koleksiyonları ve ürün türlerine göre). Sıra önemli: ilk eşleşen.
CATS = [
    ("yuz", "Yüz & dudak", "Face & lips", "#e9a049", "Yüz, dudak ve göz çevresi için doğal bakım.", "Natural care for face, lips and eyes.",
     r"yuz-bakim-yagi|yuz-misti|dudak-balmi|kas-kirpik|lenfatik-yuz|goz-bandi"),
    ("hediye", "Hediye kutuları", "Gift boxes", "#b08a58", "Sevdiklerine doğal bir bakım hediyesi.", "A gift of natural care.",
     r"kutu"),
    ("set", "Ritüel & bakım setleri", "Rituals & care sets", "#7f9458", "Rutinin tamamı, tek kutuda.", "The whole routine, in one box.",
     r"set|rituel|yazin|seti"),
    ("vucut", "Vücut & güneş", "Body & sun", "#b98a5a", "Zeytinyağıyla beslenen cilt, doğal ışıltı.", "Skin nourished with olive oil, a natural glow.",
     r"vucut|bronz|gunes|el-kremi|roll-on|losyon"),
    ("sabun", "Sabun & duş", "Soap & shower", "#e0c36e", "Bitkisel, vegan ve el yapımı temizlik.", "Plant-based, vegan, handmade cleansing.",
     r"sabun|dus-jeli"),
    ("sac", "Saç bakımı", "Hair care", "#8fae8a", "Saç diplerinden uçlarına doğal bakım.", "Natural care from roots to ends.",
     r"sac-bakim|sac-derisi"),
    ("ev", "Mum & esansiyel yağ", "Candles & essential oils", "#a0826a", "Evine doğal kokular.", "Natural scents for your home.",
     r"mum|esansiyel"),
    ("arac", "Bakım araçları", "Care tools", "#a88f6a", "Kuru fırçalama ve lenf masajı ritüelleri için.", "For dry brushing and lymph massage rituals.",
     r"firca|kabak-lifi|masaj-aleti|tarak"),
    ("club", "Self-Care Club", "Self-Care Club", "#8a8f9a", "Lalive yaşam tarzı ürünleri.", "Lalive lifestyle pieces.",
     r"."),
]
# Düz yüzlü ürünler (kutu, set, tekstil): 3B'de yuvarlak kenarlı ince hacim.
FLAT = r"set|rituel|yazin|kutu|tote|canta|sapka|atlet|t-shirt|sweatshirt|bandi|goz-bandi|firca|kabak|tarak|seti"

# Düz ürünlerin kalınlığı (3B birim): kalıp sabun kalın, tekstil ince.
FLAT_DEPTH = [(r"kati-sabun", 0.75), (r"firca|tarak", 0.75), (r"kutu", 0.6), (r"tote|atlet|t-shirt|sweatshirt|bandi", 0.14), (r"canta", 0.9), (r"sapka", 0.5)]


# Tüpler yandan basıktır (elips kesit).
TUBE = r"gunes-kremi|el-kremi|dudak-balmi|losyon"


def photo3d(h, m):
    """3B biçim: yuvarlak ürün fotoğraf silüetinden dönen gövde, düz ürün kenar çizgisinden blok."""
    shape = {"axis": m.get("axis", 0.5), "rows": m.get("rows", []), "outline": m.get("outline", []), "edge": hexc(m.get("edge", [120, 110, 90]))}
    if re.search(FLAT + r"|kati-sabun", h):
        return {"profile": "flat", "depth": next((d for rx, d in FLAT_DEPTH if re.search(rx, h)), 0.34), **shape}
    return {"profile": "round", "zScale": 0.72 if re.search(TUBE, h) else 1, **shape}


# Shopify etiketlerinden içerik çipleri (yalnızca anlamı net olanlar).
TAGS = {
    "zeytinyagi": ("Zeytinyağı", "Olive oil"), "vegan": ("Vegan", "Vegan"), "parabensiz": ("Parabensiz", "Paraben-free"),
    "nemlendirici": ("Nemlendirici", "Moisturising"), "hizli-emilim": ("Hızlı emilim", "Fast absorption"),
    "e-vitamini": ("E vitamini", "Vitamin E"), "sulfatsiz": ("Sülfatsız", "Sulphate-free"), "kastil": ("Kastil", "Castile"),
    "vanilya": ("Vanilya", "Vanilla"), "portakal": ("Portakal", "Orange"), "lavanta": ("Lavanta", "Lavender"),
    "biberiye": ("Biberiye", "Rosemary"), "yasemin": ("Yasemin", "Jasmine"), "lime": ("Lime", "Lime"), "nane": ("Nane", "Mint"),
    "okaliptus": ("Okaliptüs", "Eucalyptus"), "sandalagaci": ("Sandal ağacı", "Sandalwood"), "ipeksi": ("İpeksi", "Silky"),
    "kadin-kooperatifi": ("Kadın kooperatifi", "Women's cooperative"), "anti-catlak": ("Çatlak karşıtı", "Anti stretch marks"),
    "cilt-elastikiyeti": ("Cilt elastikiyeti", "Skin elasticity"), "tampiko": ("Tampiko", "Tampico"),
    "lenf-drenaj": ("Lenf drenajı", "Lymph drainage"), "detoks": ("Detoks", "Detox"), "biyobozunur": ("Biyobozunur", "Biodegradable"),
    "alüminyumsuz": ("Alüminyumsuz", "Aluminium-free"), "hassas cilt": ("Hassas cilt", "Sensitive skin"),
    "ferahlatici": ("Ferahlatıcı", "Refreshing"), "parlaklik": ("Parlaklık", "Shine"), "onarim": ("Onarım", "Repair"),
    "kuru-cilt": ("Kuru cilt", "Dry skin"), "spfsiz": ("SPF'siz", "No SPF"), "peeling": ("Peeling", "Exfoliating"),
    "eco-friendly": ("Çevre dostu", "Eco-friendly"), "rahlatici": ("Rahatlatıcı", "Relaxing"), "yenileyici": ("Yenileyici", "Renewing"),
}
# Markanın ürün sayfasındaki puanlar (kullanıcının gönderdiği sayfalar).
RATINGS = {"lalive-besleyici-yuz-bakim-yagi": (4.7, 72), "lalive-lenfatik-yuz-fircasi": (4.67, 3)}
HOME_EXTRA = ["lalive-vucut-yagi", "lalive-lenfatik-yuz-fircasi"]  # ana sayfanın 3B akışına eklenenler


def text(h):
    h = re.sub(r"<(br|/p|/li|/h\d)[^>]*>", "\n", h or "")
    return html.unescape(re.sub(r"<[^>]+>", "", h))


def paras(h):
    return [re.sub(r"\s+", " ", p).strip() for p in text(h).split("\n") if p.strip()]


def items(h):
    return [html.unescape(re.sub(r"<[^>]+>", "", x)).strip() for x in re.findall(r"<li[^>]*>(.*?)</li>", h or "", re.S)]


def clip(s, n):
    if len(s) <= n:
        return s
    cut = s[:n]
    m = max(cut.rfind(". "), cut.rfind("; "))
    return (cut[: m + 1] if m > n * 0.5 else cut.rsplit(" ", 1)[0] + "…").strip()


# İngilizce kelimeler: büyük harfte "i" → "I" olmalı (TİME değil TIME).
EN_I = {"time", "me-time", "shirt", "t-shirt", "sweatshirt", "mini", "kit"}


def name_lang(name):
    """Adında "i" geçen kelimelerin hepsi İngilizceyse ad İngilizce büyük harfle yazılır."""
    words = [w.strip('"“”()–-&').lower() for w in name.split()]
    iw = [w for w in words if "i" in w]
    return "en" if iw and all(w in EN_I for w in iw) else None


def lead(s):
    """Kart metni: "Lalive Ürün Adı, ..." girişi atılır, cümle büyük harfle başlar."""
    t = re.sub(r"^Lalive\b[^,.;:]*[,;:]\s*", "", s).strip()
    return (t[:1].upper() + t[1:]) if len(t) > 30 else s


def short(s):
    """Açıklamanın ilk cümlesinden kısa bir alt başlık ("Lalive X, ..." girişi atılır)."""
    s = re.sub(r"^Lalive\b[^,.;:]*[,;:]\s*", "", s).strip()
    s = s[:1].upper() + s[1:]
    first = re.split(r"(?<=[.!?])\s", s)[0]
    return clip(first, 64).rstrip(".")


SIZE = re.compile(r"\s*[-–]?\s*\(?(\d+(?:[.,]\d+)?)\s*(ml|gr|g)\)?\s*$", re.I)


def split_name(title):
    name = re.sub(r"^Lalive\s+", "", title.strip())
    size = None
    m = SIZE.search(name)
    if m:
        size = f"{m.group(1)} {'ml' if m.group(2).lower() == 'ml' else 'g'}"
        name = name[: m.start()].strip(" -–")
    return name, size


def hexc(rgb):
    return "#%02x%02x%02x" % tuple(max(0, min(255, int(v))) for v in rgb)


def theme(rgb):
    return {"glow": hexc([v * 0.42 for v in rgb]), "edge": hexc([v * 0.05 for v in rgb]),
            "drop": hexc([v + (255 - v) * 0.7 for v in rgb]), "mood": "warm"}


def main():
    c = json.load(open(PATH, encoding="utf-8"))
    tr = {p["handle"]: p for p in json.load(open(os.path.join(SHOP, "products-tr.json"), encoding="utf-8"))}
    en = {p["handle"]: p for p in json.load(open(os.path.join(SHOP, "products-en.json"), encoding="utf-8"))}
    meta = json.load(open(os.path.join(FOTO, "meta.json"), encoding="utf-8"))

    def cat_of(h):
        return next(k for k, *_, rx in CATS if re.search(rx, h))

    def info(h):
        p, q = tr[h], en.get(h, {})
        name, size = split_name(p["title"])
        en_name, _ = split_name(q.get("title") or p["title"])
        ps, qs = paras(p["body_html"]), paras(q.get("body_html"))
        li = items(p["body_html"])
        qli = items(q.get("body_html"))
        # Açıklama: ilk dolu paragraf (yalnızca ürün adından ibaret satırlar atlanır).
        desc = clip(next((x for x in ps if len(x) > 40), ps[0] if ps else name), 330)
        en_desc = clip(next((x for x in qs if len(x) > 40), qs[0] if qs else desc), 330)
        # Alt başlık: kısa bir fayda cümlesi. Setlerde liste içeriktir, alınmaz.
        is_set = re.search(r"set|rituel|kutu|yazin", h)
        tag = (None if is_set else next((x for x in li if 12 < len(x) <= 60), None)) or short(desc)
        en_tag = (None if is_set else next((x for x in qli if 12 < len(x) <= 60), None)) or short(en_desc)
        chips = [TAGS[t] for t in p["tags"] if t in TAGS][:4]
        v = p["variants"][0]
        price = float(v["price"])
        cmp_ = float(v["compare_at_price"]) if v.get("compare_at_price") and float(v["compare_at_price"]) > price else None
        m = meta.get(h, {})
        return dict(name=name, en_name=en_name, size=size, desc=desc, en_desc=en_desc, tag=tag.rstrip("."), en_tag=en_tag.rstrip("."),
                    chips=chips, price=price, compare=cmp_, m=m, cat=cat_of(h))

    cats = {k: dict(id=k, name={"tr": n, "en": ne}, color=col, desc={"tr": d, "en": de}) for k, n, ne, col, d, de, _ in CATS}

    def photo_product(h):
        i = info(h)
        rgb = i["m"].get("color", [150, 120, 90])
        cat = cats[i["cat"]]
        prod = {
            "name": i["name"], "form": "photo", "sub": i["size"] or cat["name"]["tr"], "collection": None,
            "family": cat["name"]["tr"], "year": None, "perfumer": None, "color": hexc(rgb), "ink": "#1f3326",
            "theme": theme(rgb), "tagline": i["tag"], "notes": [a for a, _ in i["chips"]] or [cat["name"]["tr"]],
            "description": i["desc"], "file": f"{h}.webp",
            "en": {"name": i["en_name"], "family": cat["name"]["en"], "tagline": i["en_tag"],
                   "notes": [b for _, b in i["chips"]] or [cat["name"]["en"]], "description": i["en_desc"],
                   "sub": i["size"] or cat["name"]["en"]},
            "label": {"style": "photo"},
            "photo3d": photo3d(h, i["m"]),
        }
        if name_lang(i["name"]):
            prod["nameLang"] = "en"
        return prod

    # Ana sayfanın ilk 6 ürünü sabit sırada (ritüel ve mağaza bu sıraya bakar). Program tekrar
    # çalıştırıldığında da aynı sonuç: elle modellenenler dosya adından, diğerleri Shopify'dan.
    BASE = ["lalive-el-kremi-50-ml", "lalive-mineral-filtreli-gunes-kremi", "lalive-dudak-balmi",
            "lalive-bronzlastirici-yag", "lalive-dogal-yuz-misti", "lalive-besleyici-yuz-bakim-yagi"]
    modeled = {MODELED[p["file"]]: p for p in c["products"] if p["file"] in MODELED}
    products, handles = [], []
    for h in BASE:
        if h in modeled:
            p = modeled[h]
            i = info(h)
            p["description"] = i["desc"]
            p["en"]["description"] = i["en_desc"]
            p.pop("rating", None)
        else:
            p = photo_product(h)
        products.append(p)
        handles.append(h)
    for h in sorted(tr, key=lambda x: (cat_of(x), x)):
        if h in handles or h not in meta or "cut" not in meta[h]:
            continue
        products.append(photo_product(h))
        handles.append(h)

    # Ortak alanlar: fiyat, galeri, puan; katalog kaydı.
    items_out = []
    for idx, (p, h) in enumerate(zip(products, handles)):
        i = info(h)
        p["price"] = {"tr": i["price"], "en": round(i["price"] / 40)}
        p["photos"] = i["m"].get("gallery", [])
        if h in RATINGS:
            p["rating"] = {"score": RATINGS[h][0], "count": RATINGS[h][1]}
        item = {
            "id": h.replace("lalive-", ""), "name": {"tr": p["name"], "en": p["en"]["name"]}, "category": i["cat"],
            "size": i["size"], "price": p["price"], "exactPrice": True,
            "desc": {"tr": clip(lead(i["desc"]), 120), "en": clip(lead(i["en_desc"]), 120)}, "color": p["color"], "product": idx,
            "image": i["m"].get("cut"), "cutout": True,
        }
        if i["compare"]:
            item["compareAt"] = {"tr": i["compare"], "en": round(i["compare"] / 40)}
        if i["m"].get("lifestyle"):
            item["photo"] = i["m"]["lifestyle"]
        items_out.append(item)

    order_cats = [k for k, *_ in CATS]
    items_out.sort(key=lambda x: order_cats.index(x["category"]))
    c["products"] = products
    # Ritüel: elle modellenmiş kremler ve yağ (sırası BASE'e göre: 0 el kremi, 5 yüz yağı, 2 dudak balmı).
    c["ritual"] = [
        {"flavor": 0, "tr": {"title": "Ferahla", "text": "Güne zeytinyağlı el kremiyle ferah ve yumuşak bir başlangıç yap.", "stat": "50 ml"},
         "en": {"title": "Refresh", "text": "Start the day fresh and soft with the olive oil hand cream.", "stat": "50 ml"}},
        {"flavor": 5, "tr": {"title": "Besle", "text": "Akşam birkaç damla yüz bakım yağıyla cildini besle.", "stat": "30 ml"},
         "en": {"title": "Nourish", "text": "In the evening, nourish your skin with a few drops of face oil.", "stat": "30 ml"}},
        {"flavor": 2, "tr": {"title": "Koru", "text": "Dudaklarını gün boyu doğal dudak balmıyla koru.", "stat": "10 ml"},
         "en": {"title": "Protect", "text": "Protect your lips all day with the natural lip balm.", "stat": "10 ml"}},
    ]
    c["home"] = [0, 1, 2, 3, 4, 5] + [handles.index(h) for h in HOME_EXTRA if h in handles]
    c["catalog"]["categories"] = [cats[k] for k in order_cats if any(x["category"] == k for x in items_out)]
    c["catalog"]["items"] = items_out
    c["defaultShopFlavor"] = 0
    # Artık bütün ürün görselleri gerçek; "temsili" notu kalkar.
    c["brand"]["disclaimer"] = ("Bu sayfa Lalive için hazırlanmış bağımsız bir konsept demodur ve marka sahibiyle bağlantılı değildir. "
                                "Ürün fotoğrafları, açıklamaları ve fiyatları markanın sitesinden (lalivenatural.com) alınmıştır.")
    c["brand"]["en"]["disclaimer"] = ("This page is an independent concept demo prepared for Lalive and is not affiliated with the brand owner. "
                                      "Product photos, copy and prices are taken from the brand's website (lalivenatural.com).")
    json.dump(c, open(PATH, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    open(PATH, "a").write("\n")
    for k in order_cats:
        n = sum(x["category"] == k for x in items_out)
        if n:
            print(f"{k:7} {n:3} ürün")
    print(len(products), "ürün,", "ana sayfa:", c["home"])


if __name__ == "__main__":
    main()
