"""3D vitrini Shopify teması olarak paketler: "Online Mağaza → Temalar → Tema yükle" ile yüklenir, mağazanın ana
sayfası doğrudan 3D vitrinle açılır. Ödeme, sepet, stok ve domain Shopify'da kalır.

Kullanım: python3 shopify-tema.py <slug> [tema-adı]
  örn.   python3 shopify-tema.py cakir-shopify "Çakır 3D"
Girdi:  demolar/<slug>-Netlify.zip (yeni-demo.py ile)
Çıktı:  demolar/<slug>-tema.zip

Nasıl çalışır:
- Vitrinin dosyaları temanın assets/ klasörüne (Shopify düz klasör ister) "fon/a.webp" → "fon-a.webp" diye konur,
  koddaki adresler aynı biçimde değiştirilir. <base> etiketi göreli adresleri temanın dosya adresine yönlendirir.
- layout/theme.liquid: ana sayfa, ürün ve koleksiyon sayfaları 3D vitrinle açılır (<meta name="vitrin-shopify">):
  fiyat, varyant ve stok her açılışta /products/<handle>.js'den okunur; "Ödemeye geç" ürünleri Shopify sepetine
  ekleyip Shopify ödemesini açar (hope-demo/src/shopifyLive.js).
- layout/sade.liquid: sepet, arama, sayfa, hesap ve parola sayfaları için sade, markaya uygun Liquid sayfalar
  (Shopify'ın kendi formları; ödemeye dokunulmaz)."""
import json
import os
import re
import sys
import zipfile

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..")
slug = sys.argv[1]
name = sys.argv[2] if len(sys.argv) > 2 else "3D Vitrin"
src = zipfile.ZipFile(os.path.join(ROOT, "demolar", f"{slug}-Netlify.zip"))
cfg = json.load(open(os.path.join(ROOT, "demo-fabrikasi", "markalar", f"{slug}.json"), encoding="utf-8"))
SKIP = {"index.html", "_headers", "robots.txt", "fonts/OFL-Italiana.txt"}
files = [n for n in src.namelist() if not n.endswith("/") and n not in SKIP]
flat = lambda p: p[len("assets/"):] if p.startswith("assets/") else p.replace("/", "-")
public = sorted((n for n in files if not n.startswith("assets/")), key=len, reverse=True)

html = src.read("index.html").decode("utf-8")
js = re.search(r'src="\./assets/([^"]+\.js)"', html).group(1)
css = re.search(r'href="\./assets/([^"]+\.css)"', html).group(1)
fonts = "\n  ".join(re.findall(r'<link[^>]+fonts\.[^>]+>', html))
bg = cfg.get("theme", {}).get("palette", {}).get("bg") or "#0c0a09"
accent = cfg.get("theme", {}).get("accent") or "#d4b06a"

out = zipfile.ZipFile(os.path.join(ROOT, "demolar", f"{slug}-tema.zip"), "w", zipfile.ZIP_DEFLATED)
for n in files:
    data = src.read(n)
    if n.endswith((".js", ".css")):
        text = data.decode("utf-8")
        for p in public:
            text = text.replace(f'"{p}"', f'"{flat(p)}"').replace(f"'{p}'", f"'{flat(p)}'")
        data = text.encode("utf-8")
    out.writestr(f"assets/{flat(n)}", data)

HEAD = """  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>{% if template.name == 'index' %}{{ shop.name }}{% else %}{{ page_title }} · {{ shop.name }}{% endif %}</title>
  {%- if page_description %}<meta name="description" content="{{ page_description | escape }}">{% endif %}
  <link rel="canonical" href="{{ canonical_url }}">"""

out.writestr("layout/theme.liquid", f"""<!doctype html>
<html lang="{{{{ request.locale.iso_code }}}}">
<head>
{HEAD}
  {{{{ content_for_header }}}}
  <meta name="vitrin-shopify" content="{{{{ shop.permanent_domain }}}}">
  <base href="{{{{ '{js}' | asset_url | split: '{js}' | first }}}}">
  <link rel="icon" href="favicon.svg" type="image/svg+xml">
  {fonts}
  <link rel="stylesheet" href="{{{{ '{css}' | asset_url }}}}">
  <script type="module" src="{{{{ '{js}' | asset_url }}}}"></script>
</head>
<body>
  <div id="root"></div>
  <div hidden>{{{{ content_for_layout }}}}</div>
</body>
</html>
""")

out.writestr("layout/sade.liquid", f"""<!doctype html>
<html lang="{{{{ request.locale.iso_code }}}}">
<head>
{HEAD}
  {{{{ content_for_header }}}}
  {fonts}
  <style>
    :root{{--bg:{bg};--fg:#f2efe9;--muted:rgba(242,239,233,.62);--accent:{accent}}}
    *{{box-sizing:border-box}}body{{margin:0;background:var(--bg);color:var(--fg);font:16px/1.6 "Jost","Helvetica Neue",Arial,sans-serif}}
    a{{color:inherit}}header{{display:flex;justify-content:space-between;align-items:center;padding:22px 5vw;border-bottom:1px solid rgba(255,255,255,.1)}}
    header a{{text-decoration:none;letter-spacing:.24em;text-transform:uppercase;font-size:.78rem}}
    main{{max-width:880px;margin:0 auto;padding:56px 5vw 96px}}h1{{font:400 clamp(2rem,4vw,3rem)/1.1 "Cormorant Garamond",Georgia,serif;letter-spacing:.04em;margin:0 0 28px}}
    .btn,button,input[type=submit]{{display:inline-block;background:var(--accent);color:#14100c;border:0;padding:14px 28px;letter-spacing:.18em;text-transform:uppercase;font:500 .78rem "Jost",sans-serif;cursor:pointer;text-decoration:none}}
    input,textarea,select{{background:rgba(255,255,255,.06);color:var(--fg);border:1px solid rgba(255,255,255,.16);padding:12px 14px;font:inherit;width:100%;margin:6px 0 14px}}
    .line{{display:flex;gap:18px;align-items:center;padding:16px 0;border-bottom:1px solid rgba(255,255,255,.08)}}.line img{{width:64px;height:64px;object-fit:contain;background:rgba(255,255,255,.04)}}
    .muted{{color:var(--muted)}}.grid{{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:24px}}.grid img{{width:100%;aspect-ratio:1;object-fit:contain;background:rgba(255,255,255,.04)}}
  </style>
</head>
<body>
  <header><a href="{{{{ routes.root_url }}}}">{{{{ shop.name }}}}</a><nav><a href="{{{{ routes.root_url }}}}">3D Koleksiyon</a> · <a href="{{{{ routes.cart_url }}}}">Sepet ({{{{ cart.item_count }}}})</a></nav></header>
  <main>{{{{ content_for_layout }}}}</main>
</body>
</html>
""")

T = {
    # 3D vitrin (layout/theme.liquid): ürünler ve koleksiyonlar da vitrinde açılır.
    "index": "{%- comment -%}3D vitrin: layout/theme.liquid{%- endcomment -%}",
    "product": "<h1>{{ product.title }}</h1>{{ product.description }}",
    "collection": "<h1>{{ collection.title }}</h1>",
    "list-collections": "<h1>{{ shop.name }}</h1>",
    # Sade sayfalar (layout/sade.liquid)
    "page": "{% layout 'sade' %}<h1>{{ page.title }}</h1>{{ page.content }}",
    "blog": "{% layout 'sade' %}<h1>{{ blog.title }}</h1>{% for article in blog.articles %}<p><a href=\"{{ article.url }}\">{{ article.title }}</a></p>{% endfor %}",
    "article": "{% layout 'sade' %}<h1>{{ article.title }}</h1>{{ article.content }}",
    "search": "{% layout 'sade' %}<h1>Arama</h1><form action=\"{{ routes.search_url }}\"><input name=\"q\" value=\"{{ search.terms | escape }}\"><button>Ara</button></form>"
    "<div class=\"grid\">{% for item in search.results %}<a href=\"{{ item.url }}\">{% if item.featured_image %}<img src=\"{{ item.featured_image | image_url: width: 400 }}\" alt=\"\">{% endif %}<p>{{ item.title }}</p></a>{% endfor %}</div>",
    "404": "{% layout 'sade' %}<h1>Sayfa bulunamadı</h1><p><a class=\"btn\" href=\"{{ routes.root_url }}\">3D koleksiyona dön</a></p>",
    "cart": "{% layout 'sade' %}<h1>Sepet</h1>{% if cart.item_count > 0 %}<form action=\"{{ routes.cart_url }}\" method=\"post\">"
    "{% for item in cart.items %}<div class=\"line\"><img src=\"{{ item.image | image_url: width: 160 }}\" alt=\"\"><div style=\"flex:1\"><a href=\"{{ routes.root_url }}\">{{ item.product.title }}</a><div class=\"muted\">{{ item.final_price | money }}</div></div>"
    "<input type=\"number\" name=\"updates[]\" value=\"{{ item.quantity }}\" min=\"0\" style=\"width:80px\"></div>{% endfor %}"
    "<p style=\"text-align:right;margin-top:24px\">Ara toplam: <strong>{{ cart.total_price | money }}</strong></p>"
    "<p style=\"text-align:right\"><button type=\"submit\" name=\"update\" style=\"background:transparent;color:inherit;border:1px solid rgba(255,255,255,.3)\">Güncelle</button> <button type=\"submit\" name=\"checkout\">Ödemeye geç</button></p></form>"
    "{% else %}<p class=\"muted\">Sepetiniz boş.</p><p><a class=\"btn\" href=\"{{ routes.root_url }}\">3D koleksiyona dön</a></p>{% endif %}",
    "password": "{% layout 'sade' %}<h1>{{ shop.name }}</h1><p class=\"muted\">{{ shop.password_message }}</p>{% form 'storefront_password' %}{{ form.errors | default_errors }}<input type=\"password\" name=\"password\" placeholder=\"Parola\"><button type=\"submit\">Gir</button>{% endform %}",
    "gift_card": "{% layout 'sade' %}<h1>Hediye kartı</h1><p>{{ gift_card.balance | money }}</p><p><strong>{{ gift_card.code }}</strong></p>",
    "customers/login": "{% layout 'sade' %}<h1>Giriş</h1>{% form 'customer_login' %}{{ form.errors | default_errors }}<input type=\"email\" name=\"customer[email]\" placeholder=\"E-posta\"><input type=\"password\" name=\"customer[password]\" placeholder=\"Parola\"><button type=\"submit\">Giriş yap</button>{% endform %}<p><a href=\"{{ routes.account_register_url }}\">Hesap oluştur</a></p>",
    "customers/register": "{% layout 'sade' %}<h1>Hesap oluştur</h1>{% form 'create_customer' %}{{ form.errors | default_errors }}<input name=\"customer[first_name]\" placeholder=\"Ad\"><input name=\"customer[last_name]\" placeholder=\"Soyad\"><input type=\"email\" name=\"customer[email]\" placeholder=\"E-posta\"><input type=\"password\" name=\"customer[password]\" placeholder=\"Parola\"><button type=\"submit\">Oluştur</button>{% endform %}",
    "customers/account": "{% layout 'sade' %}<h1>Hesabım</h1><p>{{ customer.name }} · {{ customer.email }}</p>{% for order in customer.orders %}<div class=\"line\"><a href=\"{{ order.customer_url }}\">{{ order.name }}</a><span class=\"muted\">{{ order.created_at | date: '%d.%m.%Y' }} · {{ order.total_price | money }}</span></div>{% endfor %}<p><a href=\"{{ routes.account_logout_url }}\">Çıkış</a></p>",
    "customers/order": "{% layout 'sade' %}<h1>Sipariş {{ order.name }}</h1>{% for line in order.line_items %}<div class=\"line\">{{ line.title }} × {{ line.quantity }} <span class=\"muted\">{{ line.final_line_price | money }}</span></div>{% endfor %}<p>Toplam: {{ order.total_price | money }}</p>",
    "customers/addresses": "{% layout 'sade' %}<h1>Adreslerim</h1>{% for address in customer.addresses %}<p>{{ address | format_address }}</p>{% endfor %}",
    "customers/activate_account": "{% layout 'sade' %}<h1>Hesabı etkinleştir</h1>{% form 'activate_customer_password' %}{{ form.errors | default_errors }}<input type=\"password\" name=\"customer[password]\" placeholder=\"Parola\"><input type=\"password\" name=\"customer[password_confirmation]\" placeholder=\"Parola (tekrar)\"><button type=\"submit\">Etkinleştir</button>{% endform %}",
    "customers/reset_password": "{% layout 'sade' %}<h1>Yeni parola</h1>{% form 'reset_customer_password' %}{{ form.errors | default_errors }}<input type=\"password\" name=\"customer[password]\" placeholder=\"Parola\"><input type=\"password\" name=\"customer[password_confirmation]\" placeholder=\"Parola (tekrar)\"><button type=\"submit\">Kaydet</button>{% endform %}",
}
for k, v in T.items():
    out.writestr(f"templates/{k}.liquid", v + "\n")

out.writestr("config/settings_schema.json", json.dumps([{
    "name": "theme_info", "theme_name": name, "theme_version": "1.0.0", "theme_author": "MKY Reklam",
    "theme_documentation_url": "https://www.instagram.com/mkyreklam/", "theme_support_url": "https://www.instagram.com/mkyreklam/",
}], ensure_ascii=False, indent=2))
out.writestr("config/settings_data.json", json.dumps({"current": "Default", "presets": {"Default": {}}}, indent=2))
out.writestr("locales/tr.default.json", json.dumps({"general": {"3d": "3D Koleksiyon"}}, ensure_ascii=False, indent=2))
out.writestr("locales/en.json", json.dumps({"general": {"3d": "3D Collection"}}, indent=2))
out.close()
print("✓", f"demolar/{slug}-tema.zip", len(files), "dosya")
