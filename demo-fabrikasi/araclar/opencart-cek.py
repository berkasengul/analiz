#!/usr/bin/env python3
"""OpenCart (Journal3 teması) mağazasından ürünleri çeker ve Shopify biçiminde kaydeder; sonraki adımlar
(shopify-foto.py, shopify-aktar.py) aynen çalışır.

Kullanım:
    python3 demo-fabrikasi/araclar/opencart-cek.py soleildegrace.com soleil

Yazar (markalar/<marka>-shopify/):
    products-tr.json, products-en.json   ürünler (handle, title, body_html, variants, images, product_type)
    images/<ürün>/<n>.<uzantı>           görseller; 1: dekupe (şeffaf zeminli) çekim varsa o
Ürün listesi arama sayfasından (route=product/search&search=%), koleksiyon adı görsel klasöründen gelir.
"""
import html, json, os, re, subprocess, sys, urllib.parse

UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/124 Safari/537.36"


def get(url):
    return subprocess.run(["curl", "-s", "-L", "-m", "30", "-A", UA, url], capture_output=True).stdout.decode("utf-8", "replace")


def text(h):
    h = re.sub(r"<script.*?</script>|<style.*?</style>", "", h, flags=re.S)
    h = re.sub(r"<br\s*/?>|</p>|</li>|</h\d>|</div>", "\n", h)
    t = html.unescape(re.sub("<[^>]+>", " ", h))
    return "\n".join(l.strip() for l in t.split("\n") if l.strip())


def main():
    domain, slug = sys.argv[1].replace("https://", "").strip("/"), sys.argv[2]
    base = f"https://{domain}"
    here = os.path.dirname(os.path.abspath(__file__))
    out = os.path.join(here, "..", "markalar", f"{slug}-shopify")
    os.makedirs(os.path.join(out, "images"), exist_ok=True)
    s = get(base + "/index.php?route=product/search&search=%25&limit=200")
    links = sorted(set(re.findall(r'href="(' + re.escape(base) + r'/[a-z0-9-]+-\d+-?ml[a-z0-9-]*)"', s)))
    items = []
    for k, u in enumerate(links):
        p = get(u)
        title = html.unescape(re.sub("<[^>]+>", "", (re.findall(r"<h1[^>]*>(.*?)</h1>", p, re.S) or [""])[0])).strip()
        price = (re.findall(r'"price":\s*"?([0-9.]+)', p) or ["0"])[0]
        sku = (re.findall(r"<title>[^<]*? - ([A-Z0-9]+)\s*</title>", p) or [None])[0]
        imgs = sorted(set(re.findall(re.escape(base) + r"/image/cache/catalog/[^\"' >]+?\.(?:png|jpg|jpeg|webp)", p, re.I)))
        name0 = title.split(" Exclusive")[0].strip()
        key = re.sub(r"[^a-z0-9]", "", name0.lower())
        def mine(i):
            fn = re.sub(r"[^a-z0-9]", "", urllib.parse.unquote(i.split("/")[-1]).lower())
            return fn.startswith(key[:6])
        def big(group):
            best = {}
            for i in group:
                m = re.match(r"(.*)-(\d+)x(\d+)\w?\.\w+$", i)
                if not m:
                    continue
                stem, w = m.group(1), int(m.group(2))
                if w >= best.get(stem, (0, ""))[0]:
                    best[stem] = (w, i)
            return [v[1] for v in best.values()]
        own = big([i for i in imgs if mine(i) and "logo" not in i.lower()])
        dek = [i for i in own if "dekupe" in i.lower()]
        rest = [i for i in own if i not in dek]
        col = "The Origins" if any("origins" in i.lower() for i in imgs if mine(i)) else ("Néo Collection" if any("n%c3%a9o" in i.lower() or "néo" in urllib.parse.unquote(i).lower() for i in imgs if mine(i)) else "")
        info = text((re.findall(r"INFORMATION(.*?)(?:Write a review|Yorum yaz|Related Products|</section>)", p, re.S) or [""])[0])
        handle = re.sub(r"-exclusive.*$", "", u.rsplit("/", 1)[1])
        it = {"id": k + 1, "handle": handle, "title": name0, "body_html": "<p>" + info.replace("\n", "</p><p>") + "</p>", "vendor": "",
              "product_type": col, "tags": [col] if col else [], "permalink": u,
              "variants": [{"id": k + 1, "title": "100 ML", "price": f"{float(price):.2f}", "compare_at_price": None, "available": True, "sku": sku}],
              "images": [{"src": i} for i in dek + rest]}
        items.append(it)
        d = os.path.join(out, "images", handle)
        os.makedirs(d, exist_ok=True)
        for n, im in enumerate(it["images"], 1):
            ext = im["src"].rsplit(".", 1)[1].lower()
            subprocess.run(["curl", "-s", "-L", "-m", "60", "-A", UA, "-o", os.path.join(d, f"{n}.{ext}"), im["src"].replace(" ", "%20")])
        print(f"  {handle:22} {price:>10}  {col:14} görsel: {len(it['images'])} (dekupe {len(dek)})")
    json.dump(items, open(os.path.join(out, "products-tr.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    json.dump(items, open(os.path.join(out, "products-en.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(f"Tamam: {len(items)} ürün → {out}")


if __name__ == "__main__":
    main()
