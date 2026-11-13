"""ikas mağazasındaki bütün ürünleri (metin, fiyat, görseller, çeviriler) indirir.

ikas siteleri (Next.js) her ürün sayfasında ürünün tüm verisini __NEXT_DATA__ içinde taşır. Araç
sitenin products.xml haritasından ürün adreslerini alır, her sayfadaki veriyi okur ve Shopify
aracının (shopify-cek.py) çıktısıyla aynı biçimde kaydeder; böylece sonraki adımlar
(shopify-foto.py, shopify-aktar.py) aynen çalışır.

    python3 demo-fabrikasi/araclar/ikas-cek.py mardinikozmetik.com mardini
    python3 demo-fabrikasi/araclar/ikas-cek.py mardinikozmetik.com mardini --only "regex"   (görseller yalnızca bu ürünler için)
    python3 demo-fabrikasi/araclar/ikas-cek.py anymoparfum.com anymo --only "regex" --pages   (büyük mağaza: yalnızca bu ürünlerin sayfaları da)

Çıktı: demo-fabrikasi/markalar/<slug>-shopify/
    products-tr.json, products-en.json   ürünler (Shopify biçiminde: handle, title, body_html, variants, images)
    ikas-raw.json                        ürünlerin ham ikas verisi (özellikler, notalar, kategoriler)
    images/<ürün>/<n>.webp               ürünün bütün görselleri (1080 px)
"""
import json
import os
import re
import sys
import time
import urllib.request

UA = {"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36"}


def get(url, raw=False):
    for attempt in range(4):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=40) as r:
                data = r.read()
                return data if raw else data.decode("utf-8", "replace")
        except Exception as e:  # ağ hatasında birkaç kez dene
            if attempt == 3:
                print("  ! alınamadı:", url, e)
                return None
            time.sleep(2 ** attempt)


def next_data(html):
    m = re.search(r'<script id="__NEXT_DATA__"[^>]*>(.*?)</script>', html or "", re.S)
    return json.loads(m.group(1)) if m else None


def main():
    if len(sys.argv) < 3:
        print(__doc__)
        sys.exit(1)
    domain, slug = sys.argv[1].replace("https://", "").strip("/"), sys.argv[2]
    here = os.path.dirname(os.path.abspath(__file__))
    out = os.path.join(here, "..", "markalar", f"{slug}-shopify")
    os.makedirs(os.path.join(out, "images"), exist_ok=True)
    base = f"https://{domain}"

    urls = re.findall(r"<loc>([^<]+)</loc>", get(f"{base}/products.xml") or "")
    # --pages: yüzlerce ürünlü mağazada yalnızca --only'ye uyan ürünlerin sayfaları indirilir.
    if "--pages" in sys.argv and "--only" in sys.argv:
        rx = sys.argv[sys.argv.index("--only") + 1]
        urls = [u for u in urls if re.search(rx, u.rstrip("/").rsplit("/", 1)[-1])]
    print(len(urls), "ürün adresi")
    tr, en, raw = [], [], []
    for n, url in enumerate(urls, 1):
        handle = url.rstrip("/").rsplit("/", 1)[-1]
        d = next_data(get(url))
        p = (d or {}).get("props", {}).get("pageProps", {}).get("pageSpecificData")
        if not p or not p.get("variants"):
            print("  ! ürün verisi yok:", handle)
            continue
        # Görsel adresleri: cdn.myikas.com/images/<mağaza>/<görsel>/image_1080.webp
        m = re.search(r"cdn\.myikas\.com/images/([0-9a-f-]{36})/", json.dumps(d))
        store = m.group(1) if m else None
        variants, images = [], []
        for v in p["variants"]:
            pr = (v.get("prices") or [{}])[0]
            sell, disc = pr.get("sellPrice"), pr.get("discountPrice")
            price = disc if disc else sell
            stock = sum(s.get("stockCount") or 0 for s in (v.get("stocks") or []))
            title = " / ".join(x.get("name", "") for x in (v.get("variantValues") or []) if isinstance(x, dict)) or "Default Title"
            variants.append({"id": v["id"], "title": title, "price": f"{price:.2f}" if price else "0",
                             "compare_at_price": f"{sell:.2f}" if disc and sell and sell > disc else None,
                             "available": stock > 0 or bool(v.get("sellIfOutOfStock")), "sku": v.get("sku")})
            for im in sorted(v.get("images") or [], key=lambda i: i.get("order") or 0):
                if im.get("isVideo"):
                    continue
                src = f"https://cdn.myikas.com/images/{store}/{im['imageId']}/image_1080.webp"
                if store and src not in [i["src"] for i in images]:
                    images.append({"src": src})
        cats = [c.get("name") for c in (p.get("categories") or []) if isinstance(c, dict)]
        tags = [t.get("name") if isinstance(t, dict) else t for t in (p.get("tags") or [])]
        item = {"id": p["id"], "handle": handle, "title": p.get("name", handle), "body_html": p.get("description") or "",
                "vendor": (p.get("brand") or {}).get("name") or "", "product_type": cats[0] if cats else "",
                "tags": tags, "variants": variants, "images": images}
        tr.append(item)
        t_en = next((t for t in (p.get("translations") or []) if isinstance(t, dict) and t.get("locale") == "en"), None)
        en.append({**item, "title": (t_en or {}).get("name") or item["title"], "body_html": (t_en or {}).get("description") or ""})
        raw.append({"handle": handle, "attributes": [{"name": (a.get("productAttribute") or {}).get("name"), "value": a.get("value")} for a in (p.get("attributes") or [])],
                    "categories": cats, "tags": tags, "metaDescription": (p.get("metaData") or {}).get("description")})
        print(f"{n:3} {handle}: {len(images)} görsel")
        time.sleep(0.6)

    json.dump(tr, open(os.path.join(out, "products-tr.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    json.dump(en, open(os.path.join(out, "products-en.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    json.dump(raw, open(os.path.join(out, "ikas-raw.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    only = sys.argv[sys.argv.index("--only") + 1] if "--only" in sys.argv else None
    got = 0
    for p in tr:
        if only and not re.search(only, p["handle"]):
            continue
        d = os.path.join(out, "images", p["handle"])
        os.makedirs(d, exist_ok=True)
        for i, im in enumerate(p["images"], 1):
            f = os.path.join(d, f"{i}.webp")
            if os.path.exists(f):
                continue
            data = get(im["src"], raw=True)
            if data:
                open(f, "wb").write(data)
                got += 1
    print(f"Tamam: {len(tr)} ürün, {got} görsel indirildi → {out}")


if __name__ == "__main__":
    main()
