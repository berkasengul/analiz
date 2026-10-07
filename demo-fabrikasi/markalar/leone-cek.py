#!/usr/bin/env python3
"""Leone di Fiume (leonedifiume.com, Laravel tabanlı özel mağaza): mum koleksiyonunu çeker, Shopify biçiminde yazar.

    python3 demo-fabrikasi/markalar/leone-cek.py

Yazar: markalar/leone-shopify/products-tr.json, products-en.json, images/<ürün>/<n>.jpg
Metinler İngilizce sayfadan (The Story, Scent Profile), fiyat USD.
"""
import html, json, os, re, subprocess

UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/124 Safari/537.36"
BASE = "https://leonedifiume.com"
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "leone-shopify")
JAR = os.path.join(OUT, ".cookies")


def get(url):
    return subprocess.run(["curl", "-s", "-L", "-m", "30", "-A", UA, "-c", JAR, "-b", JAR, url], capture_output=True).stdout.decode("utf-8", "replace")


def lines(t):
    t = re.sub(r"<script.*?</script>|<style.*?</style>", "", t, flags=re.S)
    t = html.unescape(re.sub("<[^>]+>", "\n", t))
    return [l.strip() for l in t.split("\n") if l.strip()]


def section(ls, start, stops):
    if start not in ls:
        return []
    i = ls.index(start) + 1
    out = []
    while i < len(ls) and ls[i] not in stops:
        out.append(ls[i])
        i += 1
    return out


def main():
    os.makedirs(os.path.join(OUT, "images"), exist_ok=True)
    col = get(BASE + "/en/collections/candles")
    links = []
    for h in re.findall(r'href="(https://leonedifiume\.com/en/[a-z0-9-]+)"', col):
        if "candle" in h and "/collections/" not in h and h not in links:
            links.append(h)
    items = []
    for k, u in enumerate(links):
        p = get(u)
        ls = lines(p)
        price = next((l for l in ls if re.match(r"^\$[\d.,]+$", l)), "$0").strip("$").replace(".", "").replace(",", ".")
        title = ls[ls.index(next(l for l in ls if re.match(r"^\$[\d.,]+$", l))) - 1] if any(re.match(r"^\$[\d.,]+$", l) for l in ls) else u.rsplit("/", 1)[1]
        code = next((l.split(":", 1)[1].strip() for l in ls if l.startswith("Product code:")), None)
        stops = {"Scent Profile", "ABOUT US", "The Story"}
        story = section(ls, "The Story", stops)
        scent = section(ls, "Scent Profile", stops)
        keys = []
        for m in re.findall(r"/storage/product/([A-Za-z0-9]+)-big", p):
            if m not in keys:
                keys.append(m)
        handle = u.rsplit("/", 1)[1]
        out_of_stock = "This product is out of stock." in ls
        body = "".join(f"<p>{x}</p>" for x in story) + ("<h3>Scent Profile</h3>" + "".join(f"<p>{x}</p>" for x in scent) if scent else "")
        it = {"id": k + 1, "handle": handle, "title": title, "body_html": body, "vendor": "", "product_type": "Candles", "tags": [],
              "permalink": u, "variants": [{"id": k + 1, "title": "Default Title", "price": f"{float(price):.2f}", "compare_at_price": None,
                                            "available": not out_of_stock, "sku": code}],
              "images": [{"src": f"{BASE}/storage/product/{x}-big.jpg"} for x in keys]}
        items.append(it)
        d = os.path.join(OUT, "images", handle)
        os.makedirs(d, exist_ok=True)
        for n, im in enumerate(it["images"], 1):
            subprocess.run(["curl", "-s", "-L", "-m", "60", "-A", UA, "-o", os.path.join(d, f"{n}.jpg"), im["src"]])
        print(f"  {handle:52} ${float(price):>8.2f}  görsel: {len(keys)}  koku profili: {'var' if scent else 'yok'}")
    json.dump(items, open(os.path.join(OUT, "products-tr.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    json.dump(items, open(os.path.join(OUT, "products-en.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(f"Tamam: {len(items)} ürün → {OUT}")


if __name__ == "__main__":
    main()
