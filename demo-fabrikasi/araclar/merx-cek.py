"""merxwebshop.hu altyapılı mağazalardan (ör. parfumorult.hu) ürünleri indirir; çıktı Shopify aracıyla
(shopify-cek.py) aynı biçimde, sonraki adımlar (shopify-foto.py, shopify-aktar.py) aynen çalışır.

Mağazanın herkese açık API'si yok: kategori listesi sayfa sayfa (?page=N) okunur, her ürünün sayfasından
marka, ad, fiyat, boyutlar, tür (ör. "Eau de Parfum női"), koku ailesi (Illatcsalád), açıklama ve ana notalar
(Főbb illatjegyek) alınır; görseller /handlers/product.ashx?id=<id>&i=<n> adresinden asıl boyutunda iner.

    python3 demo-fabrikasi/araclar/merx-cek.py parfumorult.hu parfumorult /hu/webshop/luxus-parfumok
    python3 demo-fabrikasi/araclar/merx-cek.py parfumorult.hu parfumorult /hu/webshop/luxus-parfumok --only 182,479

--only: yalnızca bu ürün numaralarının sayfaları ve görselleri indirilir (liste yine taranır: list.json).
Çıktı: demo-fabrikasi/markalar/<slug>-shopify/{list.json, products-tr.json, products-en.json, merx-raw.json, images/, pages/ (sayfa önbelleği)}
"""
import html
import json
import os
import re
import sys
import time
import unicodedata
import urllib.parse
import urllib.request

UA = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36", "Accept": "text/html,*/*"}


def get(url, raw=False):
    for k in range(4):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=60) as r:
                d = r.read()
                return d if raw else d.decode("utf-8", "replace")
        except Exception:
            time.sleep(2 ** k)
    return None


def text(h):
    h = re.sub(r"(?is)<(script|style)\b.*?</\1>", "", h or "")
    h = re.sub(r"<(br|/p|/li|/h\d|/div)[^>]*>", "\n", h)
    return [re.sub(r"\s+", " ", x).strip() for x in html.unescape(re.sub(r"<[^>]+>", "\n", h)).split("\n") if x.strip()]


def listing(base, path):
    out, page = [], 1
    while True:
        s = get(f"{base}{path}?page={page}")
        if not s:
            break
        got = re.findall(
            r"<a id='(\d+)'\s+href='([^']+)'><div class='product-box'>(.*?)</div></a>", s, re.S)
        for pid, href, box in got:
            price = re.findall(r"<span>([\d\s\xa0]+),-</span>", box)
            brand = re.search(r"<figcaption><span>(.*?)</span>", box, re.S)
            name = re.search(r"class='product-name'>(.*?)</span>", box, re.S)
            out.append({"id": int(pid), "href": html.unescape(href), "price": [int(re.sub(r"\D", "", p)) for p in price],
                        "brand": html.unescape(brand.group(1).strip()) if brand else "", "name": html.unescape(name.group(1).strip()) if name else ""})
        print(f"  sayfa {page}: {len(got)} ürün")
        if "id='next'" not in s or not got:
            break
        page += 1
    seen, uniq = set(), []
    for x in out:
        if x["id"] not in seen:
            seen.add(x["id"])
            uniq.append(x)
    return uniq


def product(base, it, cache):
    f = os.path.join(cache, f"{it['id']}.html")
    s = open(f, encoding="utf-8").read() if os.path.exists(f) else get(base + it["href"])
    if s and not os.path.exists(f):
        open(f, "w", encoding="utf-8").write(s)
    if not s:
        return None
    body = s[s.find("<article"):] if "<article" in s else s
    L = text(body)
    raw = {"id": it["id"], "brand": it["brand"]}
    # Tür satırı (ör. "Eau de Parfum női újratölthető"): fiyatın hemen altındaki satır.
    fi = next((k for k, x in enumerate(L) if re.fullmatch(r"[\d\s\xa0]+Ft", x)), None)
    raw["type"] = L[fi + 1] if fi is not None and fi + 1 < len(L) else ""
    if "Méret" in L:
        k = L.index("Méret") + 1
        sizes = []
        while k < len(L) and re.search(r"\bml\b|minta|utántöltő", L[k]) and not L[k].startswith("Előrendel"):
            if L[k] not in sizes:
                sizes.append(L[k])
            k += 1
        raw["sizes"] = sizes
    if "Illatcsalád" in L:
        raw["family"] = L[L.index("Illatcsalád") + 1]
    desc = []
    if "Leírás" in L:
        k = L.index("Leírás") + 1
        while k < len(L) and not re.match(r"(Kattin|Ajánlott termékek|Információ)", L[k]):
            # "Fej" / ": Bergamott, Citrom" gibi bölünmüş satırlar birleşir.
            if L[k].startswith(":") and desc:
                desc[-1] += L[k]
            # Sayfada satır sonuyla bölünmüş cümle (küçük harfle devam eden satır) önceki satıra eklenir.
            elif desc and not desc[-1].rstrip().endswith((".", "!", "?", ":")) and (
                    L[k][:1].islower() or re.search(r"\s(a|az|egy|és|the)$", desc[-1].rstrip())):
                desc[-1] += " " + L[k]
            else:
                desc.append(L[k])
            k += 1
    # Gömülü TikTok videosunun artıkları (@hesap, #etiket, ♬ müzik, "Marka - Ad" başlığı) metinden atılır.
    # Videonun başlığı da atılır: "@" ya da "Unboxing" geçen kısa satır, ürünün adıyla biten kısa satır.
    pname = re.sub(r"\s*-\s*[\d,.]+\s*ml.*$", "", it["name"]).strip().lower()
    pname = re.sub(r"^the\s+", "", pname)
    desc = [x for x in desc if not re.match(r"[@#♬]", x) and not re.fullmatch(r"Illatjegyek:?", x) and len(x) > 2
            and not (len(x) < 60 and it["brand"].strip() and x.lower().startswith(it["brand"].strip().lower()))
            and not (len(x) < 110 and (re.search(r"@\w|unboxing", x, re.I) or (pname and x.lower().rstrip(" .!").endswith(pname))))]
    # Koku piramidi: "Fej: …", "Szív: …", "Alap: …" (üst, kalp, dip) ya da "Főbb illatjegyek: …".
    pyr = {}
    for x in desc:
        m = re.match(r"(Fej(?:jegy)?|Szív(?:jegy)?|Alap(?:jegy)?|Főbb illatjegyek|Illatjegyek)\w*\s*:\s*(.+)", x)
        if m:
            key = {"F": "top", "S": "heart", "A": "base"}[m.group(1)[0]] if not m.group(1).endswith("illatjegyek") and m.group(1)[0] != "I" else "main"
            pyr[key] = [n.strip(" .\"") for n in re.split(r",| és ", m.group(2)) if n.strip(" .\"")]
    # Başlıksız piramit: metnin sonundaki virgüllü kısa listeler (üst / kalp / dip).
    if not pyr:
        tail = []
        for x in reversed([x for x in desc if not re.match(r"Illat(család|világ)", x) and not re.fullmatch(r"[A-ZÁÉÍÓÖŐÚÜŰa-záéíóöőúüű, ]+", x) or "," in x]):
            if "," in x and len(x) < 220 and not x.rstrip().endswith(".") and not re.search(r"[.!?] ", x):
                tail.insert(0, x)
            else:
                break
        tail = tail[-3:]
        if tail:
            keys = ["top", "heart", "base"][-len(tail):] if len(tail) == 3 else ["main"] * len(tail)
            for k, x in zip(keys, tail):
                pyr.setdefault(k, []).extend(n.strip(" .") for n in x.split(",") if n.strip(" ."))
            desc = [x for x in desc if x not in tail]
    raw["pyramid"] = pyr
    raw["notes"] = pyr.get("main") or (pyr.get("top", []) + pyr.get("heart", []) + pyr.get("base", []))
    raw["desc"] = [x for x in desc if not re.match(r"(Fej|Szív|Alap|Főbb illatjegyek|Illatjegyek|Illatcsalád|Illatvilág)\w*\s*:", x)]
    og = re.search(r'<meta property="og:title" content="([^"]+)"', s)
    raw["ogTitle"] = html.unescape(og.group(1)) if og else ""
    n = len(set(re.findall(rf"handlers/product\.ashx\?id={it['id']}(?:&amp;|&|\\u0026)i=(\d+)", s)))
    raw["images"] = [f"{base}/handlers/product.ashx?id={it['id']}&i={i}" for i in range(max(1, n))]
    return raw


def main():
    if len(sys.argv) < 4:
        sys.exit(__doc__)
    domain, slug, path = sys.argv[1], sys.argv[2], sys.argv[3]
    only = set(int(x) for x in sys.argv[sys.argv.index("--only") + 1].split(",")) if "--only" in sys.argv else None
    base = f"https://www.{domain}" if not domain.startswith("www.") else f"https://{domain}"
    here = os.path.dirname(os.path.abspath(__file__))
    out = os.path.join(here, "..", "markalar", f"{slug}-shopify")
    os.makedirs(os.path.join(out, "images"), exist_ok=True)
    os.makedirs(os.path.join(out, "pages"), exist_ok=True)
    items = listing(base, path)
    json.dump(items, open(os.path.join(out, "list.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(len(items), "ürün listede")
    if only is not None:
        items = [x for x in items if x["id"] in only]
    prods, raws = [], []
    for it in items:
        r = product(base, it, os.path.join(out, "pages"))
        if not r:
            continue
        # Adres parçası dosya adı olur: %C3%A8 → è → e, "!" gibi işaretler atılır.
        slugname = urllib.parse.unquote(it["href"].split("?")[0].rstrip("/").split("/")[-1])
        slugname = re.sub(r"[^a-z0-9]+", "-", unicodedata.normalize("NFKD", slugname).encode("ascii", "ignore").decode().lower()).strip("-")
        handle = f"{slugname}-{it['id']}"
        cat = it["href"].split("?")[0].split("/")[-2]
        name = re.sub(r"\s*-\s*[\d,.]+\s*ml.*$", "", it["name"]).strip()
        r.update(handle=handle, category=cat, name=name, listName=it["name"])
        raws.append(r)
        body = "".join(f"<p>{html.escape(x)}</p>" for x in r["desc"])
        price = it["price"][-1] if it["price"] else 0
        prods.append({"id": it["id"], "handle": handle, "title": f"{it['brand']} {it['name']}", "vendor": it["brand"], "product_type": cat,
                      "body_html": body, "permalink": base + it["href"],
                      "variants": [{"id": it["id"], "title": (r.get("sizes") or ["Default Title"])[0], "price": f"{price}.00", "compare_at_price": f"{it['price'][0]}.00" if len(it["price"]) > 1 else None, "available": True}],
                      "images": [{"src": u} for u in r["images"]]})
        d = os.path.join(out, "images", handle)
        os.makedirs(d, exist_ok=True)
        for i, u in enumerate(r["images"], 1):
            f = os.path.join(d, f"{i}.jpg")
            if not os.path.exists(f):
                data = get(u, raw=True)
                if data:
                    open(f, "wb").write(data)
        print(f"  {handle:44} {price:>7} Ft  {len(r['images'])} görsel  notalar: {len(r['notes'])}")
    for f in ("products-tr.json", "products-en.json"):
        json.dump(prods, open(os.path.join(out, f), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    json.dump(raws, open(os.path.join(out, "merx-raw.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print("Tamam:", len(prods), "ürün →", out)


if __name__ == "__main__":
    main()
