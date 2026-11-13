"""Fotoğraftan site: 3–4 ürün fotoğrafı + marka.json → TCL/UnBe kalitesinde 3B marka sitesi.

Kullanım:
    python3 site-fabrikasi/fotodan-site.py <slug>

Girdi:  site-fabrikasi/yukle/<slug>/
          marka.json   markanın bilgileri (Claude fotoğraflara bakarak doldurur; biçim için mavikoy örneğine bak)
          *.jpg|png    her ürünün önden fotoğrafı (marka.json → products[].photo); varsa "photos": [...] ile ek açılar
Çıktı:  demolar/<slug>/  ve  demolar/<slug>-Netlify.zip  (+ önizleme ekran görüntüleri site-fabrikasi/cikti/<slug>/)

Hat: marka.json → demo-fabrikasi girdileri (ürün listesi, fotoğraflar, kurallar, marka ayarı)
     → araclar/shopify-foto.py (arka plan silme, silüetten 3B doku)
     → araclar/shopify-aktar.py (ürünleri ayara aktarma)
     → yeni-demo.py (şablonu kopyalama, etiket, derleme, zip)
Şablon: UnBe ayarı (portal sahnesi, kaide, sayfalı 3B akış); marka metinleri marka.json'dan.
"""
import copy
import json
import os
import re
import shutil
import subprocess
import sys

from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FAB = os.path.join(ROOT, "demo-fabrikasi")
MARKALAR = os.path.join(FAB, "markalar")
BASE = os.path.join(MARKALAR, "unbe.json")
FONTS = {
    "classic": ("https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600&family=Jost:wght@300..500&display=swap&subset=latin-ext",
                "\"Cormorant Garamond\", Georgia, serif", "\"Jost\", \"Helvetica Neue\", Arial, sans-serif"),
    "modern": ("https://fonts.googleapis.com/css2?family=Syne:wght@500..800&family=Jost:wght@300..500&display=swap&subset=latin-ext",
               "\"Syne\", \"Helvetica Neue\", Arial, sans-serif", "\"Jost\", \"Helvetica Neue\", Arial, sans-serif"),
}


def run(cmd):
    print("→", " ".join(os.path.relpath(c, ROOT) if os.path.isabs(c) else c for c in cmd))
    subprocess.run(cmd, cwd=ROOT, check=True)


def tr_upper(s):
    return s.replace("i", "İ").replace("ı", "I").upper()


def wa_link(num, text):
    from urllib.parse import quote
    return f"https://wa.me/{num}?text={quote(text)}"


def shop_products(M, lang):
    """Mağaza biçiminde (Shopify JSON) ürün listesi: fabrikanın aktarma aracı bunu okur."""
    i = 0 if lang == "tr" else 1
    out = []
    for k, p in enumerate(M["products"]):
        title = p["name"][i]
        msg = (f"Merhaba, {M['name']} {p['name'][0]} ({M['size']}) sipariş vermek istiyorum." if lang == "tr"
               else f"Hello, I'd like to order {M['name']} {p['name'][1]} ({M['size']}).")
        out.append({
            "id": 1000 + k, "title": title, "handle": p["handle"],
            "body_html": "".join(f"<p>{x}</p>" for x in [p["desc"][i]]),
            "vendor": M["name"], "product_type": M["kind"], "tags": [],
            "variants": [{"id": 5000 + k, "title": "Default Title", "price": f"{p.get('price', 0):.2f}",
                          "compare_at_price": None, "available": True, "sku": p["handle"]}],
            "images": [{"src": p["photo"], "position": 1}],
            # Gerçek markada ürünün kendi mağaza sayfası (url); yoksa WhatsApp'a hazır mesaj.
            "permalink": p.get("url") or (wa_link(M["whatsapp"], msg) if M.get("whatsapp") else (M.get("website") or "")),
        })
    return out


def rules(M):
    hs = [p["handle"] for p in M["products"]]
    foto = {"ai": True, "studio": True, "backPhotos": False, "views": False, "edgeFrom": "side",
            "convex": 0.55, "backSolid": "."}
    foto.update(M.get("foto", {}))
    aktar = {
        "domain": "wa.me", "platform": "merx", "namePrefix": "^$", "idPrefix": "",
        "defaultSize": M["size"], "themeGlow": 0.3, "home": hs,
        "profiles": {"flask": ".", "depthRatio": M.get("depthRatio", 0.42)},
        "rename": {p["handle"]: [tr_upper(p["name"][0]), p["name"][1].upper()] for p in M["products"]},
        "categories": [{"id": "hepsi", "tr": M["words"]["tr"]["many"], "en": M["words"]["en"]["many"], "color": M["accent"],
                        "descTr": " · ".join(p["name"][0] for p in M["products"]),
                        "descEn": " · ".join(p["name"][1] for p in M["products"]), "match": "."}],
        "families": {p["handle"]: p["family"] for p in M["products"]},
        "notes": [[f"^{re.escape(p['handle'])}$", p["notes"]] for p in M["products"]],
        "taglines": {p["handle"]: p["tagline"] for p in M["products"]},
        "palette": [[f"^{re.escape(p['handle'])}$", p["color"], M["accent"]] for p in M["products"] if p.get("color")],
        # Ana sayfadaki "ritüel" bölümü: her ürün bir adım (başlık: kısa söz, metin: açıklama, alt yazı: aile).
        "ritual": [{"handle": p["handle"], "tr": {"title": p["tagline"][0], "text": p["desc"][0], "stat": p["family"][0]},
                    "en": {"title": p["tagline"][1], "text": p["desc"][1], "stat": p["family"][1]}} for p in M["products"][:4]],
    }
    aktar.update(M.get("aktar", {}))
    return {"foto": foto, "aktar": aktar}


def logo(M, path):
    """Marka adından yazı logosu (markanın kendi logosu yoksa)."""
    f = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf", 120)
    w = int(ImageDraw.Draw(Image.new("L", (1, 1))).textlength(M["wordmark"], font=f)) + 40
    for name, col in (("logo.png", (20, 22, 30, 255)), ("logo-cream.png", (247, 241, 230, 255))):
        im = Image.new("RGBA", (w, 170), (0, 0, 0, 0))
        ImageDraw.Draw(im).text((20, 10), M["wordmark"], font=f, fill=col)
        im.save(os.path.join(path, name))


def brand_config(M):
    """UnBe ayarını şablon alır; marka metinleri, renkler ve yazılar marka.json'dan."""
    c = json.load(open(BASE, encoding="utf-8"))
    name, w = M["name"], M["words"]
    for k in ("products", "ritual", "home"):
        c.pop(k, None)
    c["slug"] = M["slug"]
    c["meta"] = {"title": f"{name} · 3B Konsept Demo", "description": f"{name} için 3B konsept demo.", "og": f"{name}: {M['tagline']['en']}"}
    note_tr = ("Bu sayfa hayali bir marka için hazırlanmış konsept demodur." if M.get("fictional") else
               f"Bu sayfa {name} için hazırlanmış bağımsız bir konsept demodur ve marka sahibiyle bağlantılı değildir.")
    note_en = ("This page is a concept demo for a fictional brand." if M.get("fictional") else
               f"This page is an independent concept demo prepared for {name} and is not affiliated with the brand owner.")
    c["brand"] = {"name": name, "sub": M["sub"], "specs": M["specs"]["tr"], "disclaimer": note_tr,
                  "en": {"sub": M["sub"], "specs": M["specs"]["en"], "disclaimer": note_en}}
    c["labelBrand"] = {"wordmark": M["wordmark"], "submark": M["sub"].upper(), "concentration": M["specs"]["en"].split("·")[0].strip().upper(), "volume": M["size"]}
    c["specs"] = M["specs"]
    c["packs"] = [{"size": 1, "factor": 1, "label": {"tr": M["size"], "en": M["size"]}}]
    for i, f in enumerate(M["features"]):
        for lang in ("tr", "en"):
            short, struck, title, text = f[lang]
            c["features"][i][lang] = {"short": short, "kicker": f"0{i + 1}", "struck": struck, "title": title, "text": text}
    c["story"] = {"founder": f"{name} · {M['city']}", "instagram": M.get("instagram", ""), "website": M.get("website", ""), "press": [],
                  "tr": {**M["story"]["tr"], "timeline": [[p["name"][0], p["family"][0]] for p in M["products"]],
                         "stats": [[str(len(M["products"])), w["tr"]["one"].lower()], [M["size"], M["specs"]["tr"].split("·")[0].strip()]]},
                  "en": {**M["story"]["en"], "timeline": [[p["name"][1], p["family"][1]] for p in M["products"]],
                         "stats": [[str(len(M["products"])), w["en"]["many"].lower()], [M["size"], M["specs"]["en"].split("·")[0].strip()]]}}
    c["faqs"] = M["faqs"]
    # Arayüz yazıları: UnBe'ye özgü olanlar marka.json'a göre yeniden yazılır.
    wa = bool(M.get("whatsapp")) and not any(p.get("url") for p in M["products"])
    dom = re.sub(r"^https?://(www\.)?", "", M.get("website", "")).strip("/")
    for lang in ("tr", "en"):
        u, ww = c["ui"][lang], w[lang]
        tr = lang == "tr"
        if wa:
            order = {"contactTag": ("Sipariş ve sorularınız için WhatsApp'tan yazın." if tr else "Message us on WhatsApp for orders and questions."),
                     "shopTag": order["shopTag"],
                     "ships": ("WhatsApp'tan sipariş" if tr else "Order on WhatsApp"),
                     "addToCart": ("WhatsApp'tan sipariş ver" if tr else "Order on WhatsApp"),
                     "perk": ("WhatsApp'tan kolay sipariş" if tr else "Easy order on WhatsApp")}
        else:  # gerçek marka: butonlar markanın kendi mağazasındaki ürün sayfasına gider
            order = {"contactTag": ("Sorularınız için bize yazın." if tr else "Write to us with your questions."),
                     "shopTag": (f"Seç, {dom} üzerinden satın al." if tr else f"Choose and buy on {dom}."),
                     "ships": (f"{dom} üzerinden" if tr else f"Via {dom}"),
                     "addToCart": ("Satın al" if tr else "Buy now"),
                     "perk": (f"Sipariş: {dom}" if tr else f"Order at {dom}")}
        perks = (M.get("perks") or {}).get(lang) or [M["specs"][lang], M["sub"], order["perk"]]
        u.update({
            "loading": M["sub"], "madeFor": (f"{name} için hazırlanmış konsept" if tr else f"Concept prepared for {name}"),
            "recyclable": M["specs"][lang], "founder": f"{name} · {M['city']}",
            "contactTag": order["contactTag"],
            "newsTitle": ("Yeni ürünler önce burada." if tr else "New products, first here."),
            "marquee": M["marquee"][lang], "slogan": M["tagline"][lang],
            "nav": {"flavors": ww["many"], "catalog": ("Tüm ürünler" if tr else "All products"), "categories": ww["many"],
                    "products": ww["many"], "sets": ww["many"], "about": (f"{name} hakkında" if tr else f"About {name}"),
                    "contact": ("İletişim" if tr else "Contact")},
            "flavors": ww["many"], "notes": ww["notes"], "whatsInside": ww["notes"], "family": ww["family"], "drag": ww["drag"],
            "discover": ("{0} ürününü keşfet" if tr else "Discover {0}"), "discoverCan": ("Ürünü keşfet" if tr else "Discover"),
            "backToFlavors": (f"{ww['many']} sayfasına dön" if tr else f"Back to {ww['many'].lower()}"),
            "prevFlavor": ("Önceki" if tr else "Previous"), "nextFlavor": ("Sonraki" if tr else "Next"),
            "backToFlavor": ("Ürün bilgisine dön" if tr else "Back to product"), "exploreCan": ("Ürünü keşfet · {0} hikâye" if tr else "Explore · {0} stories"),
            "shopTitle": (f"{ww['one']} seç" if tr else f"Choose your {ww['one'].lower()}"),
            "shopTag": order["shopTag"],
            "flavor": ww["one"], "packPerCan": f"{name} · {{0}}", "caffeine": "",
            "perks": perks,
            "related": ("Diğer ürünler" if tr else "Other products"), "buildBox": ("Ürünleri keşfet" if tr else "Explore the products"),
            "allTag": (f"{{0}} {ww['one'].lower()}." if tr else f"{{0}} {ww['many'].lower()}."),
            "ships": order["ships"], "addToCart": order["addToCart"],
            "added": ("Açılıyor" if tr else "Opening"),
        })
        if ww.get("action"):
            u["spray"] = ww["action"]
    ci = ([["WhatsApp", [f"+{M['whatsapp']}"]]] if M.get("whatsapp") else []) + \
         ([["E-posta", [M["email"]]]] if M.get("email") else []) + \
         ([["Instagram", [M["instagram"]]]] if M.get("instagram") else []) + ([["Web", [dom]]] if dom else [])
    c["contactInfo"] = {"tr": ci, "en": [[("E-mail" if k == "E-posta" else k), v] for k, v in ci]}
    href, serif, sans = FONTS.get(M.get("fonts", "classic"), FONTS["classic"])
    c["theme"].update({"accent": M["accent"], "plinthColor": M.get("plinth", "#f3ece2"),
                       "fonts": {"href": href, "display": serif, "serif": serif, "sans": sans}})
    c["latinTerms"] = "|".join([re.escape(name), re.escape(M["wordmark"])] + [re.escape(p["name"][1]) for p in M["products"]])
    c["prices"]["tr"]["packs"] = {"1": 0}
    c["prices"]["en"]["packs"] = {"1": 0}
    c.setdefault("hide", [])
    for h in ("stockists",):
        if h not in c["hide"]:
            c["hide"].append(h)
    return c


def main(slug):
    src = os.path.join(ROOT, "site-fabrikasi", "yukle", slug)
    M = json.load(open(os.path.join(src, "marka.json"), encoding="utf-8"))
    assert M["slug"] == slug, "marka.json içindeki slug klasör adıyla aynı olmalı"

    shop = os.path.join(MARKALAR, f"{slug}-shopify")
    if os.path.exists(shop):
        shutil.rmtree(shop)
    os.makedirs(os.path.join(shop, "images"))
    for p in M["products"]:
        d = os.path.join(shop, "images", p["handle"])
        os.makedirs(d)
        for n, ph in enumerate([p["photo"]] + p.get("photos", []), 1):
            Image.open(os.path.join(src, ph)).convert("RGB").save(os.path.join(d, f"{n}.jpg"), quality=95)
    for lang in ("tr", "en"):
        json.dump(shop_products(M, lang), open(os.path.join(shop, f"products-{lang}.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    json.dump(rules(M), open(os.path.join(MARKALAR, f"{slug}-kurallar.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)

    assets = os.path.join(MARKALAR, f"{slug}-assets")
    os.makedirs(assets, exist_ok=True)
    if os.path.exists(os.path.join(src, "logo.png")):
        shutil.copy(os.path.join(src, "logo.png"), os.path.join(assets, "logo.png"))
    else:
        logo(M, assets)
    cfg = brand_config(M)
    cfg["logo"] = "brand/logo-cream.png" if os.path.exists(os.path.join(assets, "logo-cream.png")) else "brand/logo.png"
    cfg["spray"] = bool(M.get("spray", True))
    json.dump(cfg, open(os.path.join(MARKALAR, f"{slug}.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=2)

    py = sys.executable
    run([py, os.path.join(FAB, "araclar", "shopify-foto.py"), slug])
    run([py, os.path.join(FAB, "araclar", "shopify-aktar.py"), slug])
    run([py, os.path.join(FAB, "yeni-demo.py"), os.path.join(MARKALAR, f"{slug}.json")])
    # Önizleme: zip'i açıp ana sayfa, katalog ve hakkında bölümünün ekran görüntüsü (headless Chromium).
    out = os.path.join(ROOT, "site-fabrikasi", "cikti", slug)
    site = os.path.join(out, "site")
    if os.path.exists(site):
        shutil.rmtree(site)
    os.makedirs(site)
    shutil.unpack_archive(os.path.join(ROOT, "demolar", f"{slug}-Netlify.zip"), site)
    env = dict(os.environ, NODE_PATH=os.environ.get("NODE_PATH", "/opt/node-tools/node_modules"))
    try:
        subprocess.run(["node", os.path.join(ROOT, "site-fabrikasi", "araclar", "onizle.cjs"), site, os.path.join(out, "onizleme"), ",/urunler"],
                       cwd=ROOT, check=True, env=env, timeout=400)
    except Exception as e:  # önizleme isteğe bağlı; site yine hazır
        print("! önizleme alınamadı:", e)
    print(f"✓ {M['name']}: demolar/{slug}/  ·  demolar/{slug}-Netlify.zip  ·  önizleme: site-fabrikasi/cikti/{slug}/")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    main(sys.argv[1])
