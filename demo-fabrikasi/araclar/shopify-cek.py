"""Shopify mağazasındaki bütün ürünleri (metin, fiyat, kategori, görseller) indirir.

Shopify sitelerinin herkese açık `products.json` adresini kullanır; ek kurulum
gerekmez (yalnızca Python 3). Kendi bilgisayarında çalıştır:

    python3 demo-fabrikasi/araclar/shopify-cek.py www.lalivenatural.com lalive

Çıktı: demo-fabrikasi/markalar/<slug>-shopify/
    products-tr.json, products-en.json   ürünler (başlık, açıklama, fiyat, görseller)
    collections.json                     kategoriler
    collection-<ad>.json                 her kategorideki ürünler
    images/<ürün>/<n>.<uzantı>           ürünün bütün görselleri, orijinal boyutta
"""
import json
import os
import sys
import time
import urllib.request

UA = {"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36"}


def get(url, raw=False):
    for attempt in range(4):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=30) as r:
                data = r.read()
                return data if raw else json.loads(data)
        except Exception as e:  # ağ hatasında birkaç kez dene
            if attempt == 3:
                print("  ! alınamadı:", url, e)
                return None
            time.sleep(2 ** attempt)


def all_products(base):
    out, page = [], 1
    while True:
        data = get(f"{base}/products.json?limit=250&page={page}")
        items = (data or {}).get("products", [])
        if not items:
            return out
        out += items
        page += 1


def main():
    if len(sys.argv) < 3:
        print(__doc__)
        sys.exit(1)
    domain, slug = sys.argv[1].replace("https://", "").strip("/"), sys.argv[2]
    here = os.path.dirname(os.path.abspath(__file__))
    out = os.path.join(here, "..", "markalar", f"{slug}-shopify")
    os.makedirs(os.path.join(out, "images"), exist_ok=True)
    base = f"https://{domain}"

    tr = all_products(base)
    print(f"{len(tr)} ürün (TR)")
    json.dump(tr, open(os.path.join(out, "products-tr.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    en = all_products(f"{base}/en")
    print(f"{len(en)} ürün (EN)")
    json.dump(en, open(os.path.join(out, "products-en.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)

    cols = (get(f"{base}/collections.json?limit=250") or {}).get("collections", [])
    json.dump(cols, open(os.path.join(out, "collections.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    for c in cols:
        items = all_products(f"{base}/collections/{c['handle']}")
        json.dump([p["handle"] for p in items], open(os.path.join(out, f"collection-{c['handle']}.json"), "w", encoding="utf-8"), ensure_ascii=False)
        print(f"  kategori {c['handle']}: {len(items)} ürün")

    n = 0
    for p in tr:
        folder = os.path.join(out, "images", p["handle"])
        os.makedirs(folder, exist_ok=True)
        for i, img in enumerate(p.get("images", []), 1):
            src = img["src"].split("?")[0]
            ext = os.path.splitext(src)[1] or ".jpg"
            path = os.path.join(folder, f"{i}{ext}")
            if os.path.exists(path):
                continue
            data = get(src, raw=True)  # orijinal boyut, küçültmeden
            if data:
                open(path, "wb").write(data)
                n += 1
        print(f"  {p['handle']}: {len(p.get('images', []))} görsel")
    print(f"\nTamam: {n} görsel indirildi → {os.path.normpath(out)}")


if __name__ == "__main__":
    main()
