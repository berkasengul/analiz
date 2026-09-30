"""WooCommerce mağazasındaki bütün ürünleri (metin, fiyat, görseller, İngilizce çeviri) indirir.

WooCommerce'in herkese açık Store API'si (/wp-json/wc/store/v1/products) ürünleri, fiyatları ve görselleri
verir. Araç bunları Shopify aracının (shopify-cek.py) çıktısıyla aynı biçimde kaydeder; böylece sonraki adımlar
(shopify-foto.py, shopify-aktar.py) aynen çalışır.

Birçok markanın mağaza görselinde şişenin çevresinde malzemeler (çiçek, meyve, su sıçraması) olur. Araç her
ürün için sitenin medya arşivinde (/wp-json/wp/v2/media) aynı adlı sade çekimi arar ("<Ad>_1500x1500.png"
gibi, "v4_"/"v5"/"KUTU" ekleri olmadan) ve bulursa ilk görsel olarak koyar.

    python3 demo-fabrikasi/araclar/woo-cek.py regalien.com regalien
    python3 demo-fabrikasi/araclar/woo-cek.py regalien.com regalien --en /en   (İngilizce mağaza öneki; varsayılan /en)
    python3 demo-fabrikasi/araclar/woo-cek.py parfumane.com parfumane --only "^(galiya-oud|ahbab)" --no-clean --no-en

Yanlış eşleşen sade çekim markalar/<slug>-kurallar.json → "cek": {"cleanShot": {"<handle>": "<görsel adresi>"}}
ile elle seçilir.

Çıktı: demo-fabrikasi/markalar/<slug>-shopify/
    products-tr.json, products-en.json   ürünler (Shopify biçiminde: handle, title, body_html, variants, images, permalink)
    woo-raw.json                         kısa açıklama satırları, kategoriler, nota piramidi (üst / kalp / alt)
    images/<ürün>/<n>.<uzantı>           ürünün görselleri (1: sade çekim varsa o)
"""
import html
import json
import os
import re
import sys
import time
import urllib.parse
import urllib.request

UA = {"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36"}


def get(url, raw=False):
    for attempt in range(4):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=60) as r:
                data = r.read()
                return data if raw else data.decode("utf-8", "replace")
        except Exception as e:  # ağ hatasında birkaç kez dene
            if attempt == 3:
                print("  ! alınamadı:", url, e)
                return None
            time.sleep(2 ** attempt)


def products(base):
    out, page = [], 1
    while True:
        d = json.loads(get(f"{base}/wp-json/wc/store/v1/products?per_page=100&page={page}") or "[]")
        out += d
        if len(d) < 100:
            return out
        page += 1


def only_lang(h, lang):
    """Bazı ürünlerde iki dil aynı açıklamada durur (sitede dile göre gizlenen class="pp-tr" / "pp-en"
    paragrafları): istenmeyen dilin blokları atılır."""
    other = "en" if lang == "tr" else "tr"
    return re.sub(rf'(?is)<(p|div|span|h\d)\b[^>]*class="[^"]*\bpp-{other}\b[^"]*"[^>]*>.*?</\1>', "", h or "")


def lines(h):
    h = re.sub(r"(?is)<(style|script)\b.*?</\1>", "", h or "")
    t = html.unescape(re.sub(r"<[^>]+>", "\n", h))
    return [re.sub(r"\s+", " ", x).strip() for x in t.split("\n") if x.strip()]


def pyramid(desc):
    """Açıklamadaki art arda üç virgüllü kısa satır: üst, kalp ve alt notalar."""
    L = lines(desc)
    # Ayraç virgül ya da "·"; satır sonundaki nokta sayılmaz (ör. "Vanilya, Ambergris, Agar Ağacı.").
    parts = lambda s: [n.strip() for n in re.split(r"[,·]", s.rstrip(". ")) if n.strip()]
    # Nota adları kısa (en çok 4 kelime); virgüllü bir cümle ("A rich, warm, and lingering …") nota sayılmaz.
    ok = lambda s: (2 <= len(parts(s)) <= 9 and len(s) < 140 and "." not in s.rstrip(". ")
                    and all(len(n.split()) <= 4 for n in parts(s)))
    for i in range(len(L) - 2):
        if ok(L[i]) and ok(L[i + 1]) and ok(L[i + 2]):
            return [parts(L[i + k]) for k in range(3)]
    return None


def clean_shot(base, p):
    """Ürünün sade çekimi: medya arşivinde ürünün adıyla eşleşen "<Ad>_1500x1500.png" (ya da 1500x1750).
    Adlar harf, boşluk ve bağlaçtan bağımsız karşılaştırılır (HeartofRose = Heart of Rose, Club-Of-Iris =
    Clubs of Iris Reverie); "v4_", "_v5" ve "KUTU" (kutulu) çekimler atlanır."""
    norm = lambda s: re.sub(r"[^a-z0-9]", "", html.unescape(s).lower().replace("ş", "s").replace("â", "a").replace("ı", "i"))
    keys = {norm(p["name"]), norm(p["slug"])}
    if p["images"]:
        name = p["images"][0]["src"].rsplit("/", 1)[-1]
        keys.add(norm(re.sub(r"^(v\d+_)", "", re.split(r"_\d{3,4}x\d{3,4}", name)[0])))
    # Arama hem adın hem de adresin (slug) ilk kelimesiyle: Türkçe harfli adlar (Hatır) dosya adında ASCII yazılır.
    media = []
    for word in {re.split(r"[\s-]+", html.unescape(p["name"]))[0], p["slug"].split("-")[0]}:
        got = json.loads(get(f"{base}/wp-json/wp/v2/media?search={urllib.parse.quote(word)}&per_page=100") or "[]")
        media += got if isinstance(got, list) else []
    best = None
    for m in media:
        u = m.get("source_url") or ""
        if not isinstance(u, str):
            continue
        g = re.search(r"/([^/]+)_(1500x1500|1500x1750)(-\d)?\.(png|jpg|webp)$", u)
        if not g or re.match(r"v\d+_", g.group(1)) or re.search(r"kutu|_v\d", u, re.I):
            continue
        k = norm(g.group(1))
        if not k or not any(k == x or (len(k) >= 6 and (x.startswith(k) or k.startswith(x))) for x in keys):
            continue
        score = (g.group(2) == "1500x1500", k in keys, m.get("date", ""))
        if best is None or score > best[0]:
            best = (score, u)
    return best[1] if best else None


def item(p, lang="tr"):
    price = p["prices"]["price"]
    minor = int(p["prices"].get("currency_minor_unit") or 0)
    price = int(price) / (10 ** minor) if price else 0
    reg = p["prices"].get("regular_price")
    reg = int(reg) / (10 ** minor) if reg else None
    return {"id": p["id"], "handle": p["slug"], "title": html.unescape(p["name"]), "body_html": only_lang(p.get("description"), lang),
            "vendor": "", "product_type": (p.get("categories") or [{}])[0].get("name", ""), "tags": [t.get("name") for t in p.get("tags", [])],
            "permalink": p.get("permalink"),
            "variants": [{"id": p["id"], "title": "Default Title", "price": f"{price:.2f}",
                          "compare_at_price": f"{reg:.2f}" if reg and reg > price else None, "available": bool(p.get("is_in_stock", True)), "sku": p.get("sku")}],
            "images": [{"src": i["src"]} for i in p.get("images", [])]}


def main():
    if len(sys.argv) < 3:
        print(__doc__)
        sys.exit(1)
    domain, slug = sys.argv[1].replace("https://", "").strip("/"), sys.argv[2]
    en_prefix = sys.argv[sys.argv.index("--en") + 1] if "--en" in sys.argv else "/en"
    base = f"https://{domain}"
    here = os.path.dirname(os.path.abspath(__file__))
    out = os.path.join(here, "..", "markalar", f"{slug}-shopify")
    os.makedirs(os.path.join(out, "images"), exist_ok=True)

    kpath = os.path.join(here, "..", "markalar", f"{slug}-kurallar.json")
    PICK = (json.load(open(kpath, encoding="utf-8")).get("cek", {}).get("cleanShot", {}) if os.path.exists(kpath) else {})
    tr_raw = products(base)
    # --only "regex": yalnızca adresi (slug) uyan ürünler (büyük mağazada bütün görselleri indirmemek için).
    if "--only" in sys.argv:
        rx = re.compile(sys.argv[sys.argv.index("--only") + 1])
        tr_raw = [p for p in tr_raw if rx.search(p["slug"])]
    en_list = products(base + en_prefix) if "--no-en" not in sys.argv else []
    en_raw = {p["id"]: p for p in en_list}
    # WPML gibi çeviri eklentilerinde İngilizce ürünün numarası ve adresi farklı: stok koduyla (SKU) eşleşir.
    en_sku = {p["sku"]: p for p in en_list if p.get("sku")}
    for p in tr_raw:
        if p["id"] not in en_raw and p.get("sku") in en_sku:
            en_raw[p["id"]] = en_sku[p["sku"]]
    print(len(tr_raw), "ürün,", len(en_raw), "İngilizce")
    tr, en, raw = [], [], []
    for p in tr_raw:
        it = item(p)
        # --no-clean: medya arşivinde sade çekim aranmaz (arşivde "<Ad>_1500x1500" düzeni olmayan mağazalar).
        shot = PICK.get(p["slug"]) or (None if "--no-clean" in sys.argv else clean_shot(base, p))
        if shot:
            it["images"].insert(0, {"src": shot})
        tr.append(it)
        q = en_raw.get(p["id"])
        e = item(q, "en") if q else dict(it)
        e["images"] = it["images"]
        e["handle"] = it["handle"]  # çeviride adres farklı olabilir (galiya-oud-50ml-perfume); ürün Türkçe adresle eşleşir
        en.append(e)
        raw.append({"handle": it["handle"], "categories": [c["name"] for c in p.get("categories", [])],
                    "short": lines(only_lang(p.get("short_description"), "tr")), "shortEn": lines(only_lang((q or {}).get("short_description"), "en")),
                    "pyramid": pyramid(only_lang(p.get("description"), "tr")), "pyramidEn": pyramid(only_lang((q or {}).get("description"), "en")),
                    "cleanShot": shot})
        print(f"  {it['handle']:28} {it['variants'][0]['price']:>9}  sade çekim: {'var' if shot else 'YOK'}  piramit: {'var' if raw[-1]['pyramid'] else 'yok'}")

    json.dump(tr, open(os.path.join(out, "products-tr.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    json.dump(en, open(os.path.join(out, "products-en.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    json.dump(raw, open(os.path.join(out, "woo-raw.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    got = 0
    for p in tr:
        d = os.path.join(out, "images", p["handle"])
        os.makedirs(d, exist_ok=True)
        for i, im in enumerate(p["images"], 1):
            ext = os.path.splitext(urllib.parse.urlparse(im["src"]).path)[1] or ".jpg"
            f = os.path.join(d, f"{i}{ext}")
            if os.path.exists(f):
                continue
            data = get(im["src"], raw=True)
            if data:
                open(f, "wb").write(data)
                got += 1
    print(f"Tamam: {len(tr)} ürün, {got} görsel indirildi → {out}")


if __name__ == "__main__":
    main()
