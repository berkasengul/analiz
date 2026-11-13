"""3D vitrini Shopify teması olarak paketler: "Online Mağaza → Temalar → Tema yükle" ile yüklenir, mağazanın ana
sayfası doğrudan 3D vitrinle açılır. Ödeme, sepet, stok ve domain Shopify'da kalır.

Kullanım: python3 shopify-tema.py <slug> [tema-adı] [--magaza https://x.myshopify.com [--parola X]]
  örn.   python3 shopify-tema.py cakir-shopify "Çakır 3D"
  --magaza: mağazadaki ürün görsellerinin adları temaya yazılır (vitrin kurulurkenki görseller). Müşteri sonradan
  ürünün görselini değiştirirse vitrin bunu anlar (shopifyLive.js). Verilmezse markalar/<slug>-shopify/products-tr.json.
Girdi:  demolar/<slug>-Netlify.zip (yeni-demo.py ile)
Çıktı:  demolar/<slug>-tema.zip

Nasıl çalışır:
- Vitrinin dosyaları temanın assets/ klasörüne (Shopify düz klasör ister) "fon/a.webp" → "fon-a.webp" diye konur,
  koddaki adresler aynı biçimde değiştirilir. <base> etiketi göreli adresleri temanın dosya adresine yönlendirir.
- layout/theme.liquid: ana sayfa, ürün ve koleksiyon sayfaları 3D vitrinle açılır (<meta name="vitrin-shopify">):
  fiyat, varyant ve stok her açılışta /products/<handle>.js'den okunur; "Ödemeye geç" ürünleri Shopify sepetine
  ekleyip Shopify ödemesini açar (hope-demo/src/shopifyLive.js).
- layout/sade.liquid: sepet, arama, sayfa, hesap ve parola sayfaları için sade, markaya uygun Liquid sayfalar
  (Shopify'ın kendi formları; ödemeye dokunulmaz).
- Yazılar: sitedeki Türkçe yazıların hepsi tema ayarı olur. Mağaza sahibi Shopify → Temalar → Özelleştir →
  Tema ayarları'nda (bölüm bölüm, ürün ürün) değiştirir; tema bunları <script id="vitrin-metin"> ile vitrine verir
  (hope-demo/src/textOverride.js). Boş bırakılan alan sitedeki ilk yazıyı gösterir.
- Görsel ve 3B model: ürüne Shopify'da yüklenen GLB model vitrinin şişesinin yerine geçer. Ürünün görseli tema
  kurulurkenkinden (<script id="vitrin-gorsel">) farklıysa galeri ve kart o görselle; düz zeminli fotoğraftan 3B şişe
  tarayıcıda üretilir (hope-demo/src/photo3d.js). Vitrinde olmayan yeni ürünler de fotoğraflarından 3B olur, ana sayfa
  akışına eklenir; olmazsa fotoğraflı kart (hope-demo/src/shopifyLive.js)."""
import json
import os
import re
import subprocess
import sys
import zipfile

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..")
args = [a for a in sys.argv[1:]]
opt = {}
for k in ("--magaza", "--parola"):
    if k in args:
        i = args.index(k)
        opt[k] = args[i + 1]
        del args[i : i + 2]
slug = args[0]
name = args[1] if len(args) > 1 else "3D Vitrin"
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

# ------------------------------------------------------------------ düzenlenebilir yazılar
# Yazı olmayanlar (renk, dosya, adres, kimlik, 3B ayarı) ve İngilizce sürüm (en) ayar olmaz.
NOTEXT = {"slug", "en", "color", "ink", "theme", "file", "handle", "icon", "pose", "bottle", "labelBrand", "labelFinish",
          "fillLight", "commerce", "prices", "glow", "form", "logo", "href", "id", "url", "image", "images", "photo",
          "photos", "photo3d", "label", "backdrop", "particles", "nameLang", "latinTerms", "defaultLang", "hide", "home",
          "meta", "instagram", "website", "variants", "category", "cutout", "bg", "bg2", "flavor", "product", "size"}
WORD = {"name": "Ad", "sub": "Alt yazı", "title": "Başlık", "text": "Metin", "description": "Açıklama", "desc": "Açıklama",
        "tagline": "Kısa tanıtım", "notes": "Nota", "composition": "Bileşim", "family": "Aile", "short": "Kısa ad",
        "kicker": "Üst yazı", "struck": "Çizili yazı", "stat": "Alt bilgi", "lead": "Giriş", "paragraphs": "Paragraf",
        "timeline": "Kronoloji", "founder": "Kurucu", "specs": "Özellik", "disclaimer": "Bilgi notu", "quote": "Alıntı",
        "marquee": "Kayan yazı", "perks": "Avantaj", "nav": "Menü", "packUnit": "Birim", "packs": "Paket",
        "categories": "Kategori", "features": "Özellik", "ritual": "Adım", "faqs": "", "ui": "", "brand": "", "story": "",
        "catalog": "", "contactInfo": "", "stockists": "", "finder": ""}
GROUPS = [("brand", "Marka"), ("specs", "Marka"), ("ui", "Menü ve genel yazılar"), ("features", "Öne çıkanlar"),
          ("ritual", "Ritüel"), ("story", "Hakkımızda"), ("faqs", "Sık sorulanlar"), ("contactInfo", "İletişim"),
          ("stockists", "İletişim"), ("catalog", "Kategoriler")]
texts = {}  # grup → {yazı-anahtarı: [yollar, etiket, yazı]}


def visible(v):
    return bool(re.search(r"[A-Za-zÇĞİÖŞÜçğıöşü]{2}", v)) and not re.match(r"^(#|https?:|/|\./|[\w./-]+\.\w{3,4}$)", v)


def label(path, value):
    keys = [k for k in path if k != "tr"]
    snip = (value[:38] + "…") if len(value) > 40 else value
    # Arayüz yazılarının kod adları (ui.prevFlavor) anlamsız: etiket yazının başı olur.
    if keys[0] == "ui":
        return ("Menü: " + snip) if "nav" in keys else snip
    words = []
    for i, k in enumerate(keys):
        if isinstance(k, int):
            if keys[0] == "faqs" and i == len(keys) - 1:
                words[-1:] = [("Soru " if k == 0 else "Cevap ") + words[-1]] if words else []
                continue
            words.append(str(k + 1))
        elif k in WORD:
            words.append(WORD[k])
        else:
            # Kod adı olan yazı (ör. ui.prevFlavor): etiket yazının başı olur.
            return (value[:38] + "…") if len(value) > 40 else value
    text = " ".join(w for w in words if w)
    # Yalnızca sıra numarası kaldıysa (ör. iletişim satırı) etiket yazının başı olur.
    return text if re.search(r"[^\d ]", text) else ((value[:38] + "…") if len(value) > 40 else value)


def engine_ui():
    """Motorun Türkçe arayüz yazıları (hope-demo/src/i18n.js → UI.tr): markada yazılmamış olanlar da düzenlenebilsin.
    Fonksiyon olan metinler "{0} ürün" kalıbına çevrilir (i18n.js mergeUi bu kalıbı kabul eder)."""
    src = open(os.path.join(ROOT, "hope-demo", "src", "i18n.js"), encoding="utf-8").read()
    a = src.index("const UI = {")
    js = src[a : src.index("\n};", a) + 3] + r"""
const pat = (f) => {
  const m = f.toString().match(/^\(?([\w,\s]*)\)?\s*=>\s*`([^`]*)`$/);
  if (!m) return null;
  const args = m[1].split(",").map((x) => x.trim()).filter(Boolean);
  let ok = true;
  const t = m[2].replace(/\$\{(\w+)\}/g, (_, v) => { const i = args.indexOf(v); if (i < 0) ok = false; return `{${i}}`; });
  return ok ? t : null;
};
const out = {};
for (const [k, v] of Object.entries(UI.tr)) {
  if (typeof v === "string") out[k] = v;
  else if (typeof v === "function") { const p = pat(v); if (p) out[k] = p; }
  else if (v && typeof v === "object" && !Array.isArray(v))
    out[k] = Object.fromEntries(Object.entries(v).filter(([, x]) => typeof x === "string"));
}
console.log(JSON.stringify(out));"""
    try:
        return json.loads(subprocess.run(["node", "--input-type=module", "-e", js], capture_output=True, text=True, check=True).stdout)
    except Exception as e:  # node yoksa yalnızca markanın yazıları düzenlenir
        print("! motor yazıları okunamadı:", e)
        return {}


def collect(x, path, group, key, skip=NOTEXT):
    if isinstance(x, str):
        if visible(x):
            k = (key, x) if key is not None else tuple(path)
            e = texts.setdefault(group, {}).setdefault(k, [[], None, x])
            e[0].append(path)
            if e[1] is None:
                e[1] = label(path if key is None else path[2:], x)
    elif isinstance(x, dict):
        for k, v in x.items():
            if k not in skip:
                collect(v, path + [k], group, key, skip)
    elif isinstance(x, list):
        for i, v in enumerate(x):
            collect(v, path + [i], group, key, skip)


prods = cfg.get("products") or []
for top, grp in GROUPS:
    if top == "catalog":
        for i, c in enumerate(cfg.get("catalog", {}).get("categories", [])):
            collect(c, ["catalog", "categories", i], grp, None)
    elif top == "ui":
        # Markanın yazısı motorun varsayılanının önüne geçer (i18n.js mergeUi gibi, iç nesnelerde bir düzey).
        ui = engine_ui()
        for k, v in ((cfg.get("ui") or {}).get("tr") or {}).items():
            ui[k] = {**ui[k], **v} if isinstance(ui.get(k), dict) and isinstance(v, dict) else v
        collect(ui, ["ui", "tr"], grp, None, set())
    elif top in cfg:
        collect(cfg[top], [top], grp, None)
# Ürün başına bir grup; katalog kartındaki aynı yazı (ad, açıklama) tek alandan değişir.
for i, pr in enumerate(prods):
    collect(pr, ["products", i], f"Ürün: {pr.get('name', i + 1)}", i)
for j, it in enumerate(cfg.get("catalog", {}).get("items", [])):
    i = it.get("product")
    grp = f"Ürün: {prods[i].get('name', i + 1)}" if isinstance(i, int) and i < len(prods) else f"Ürün: {it.get('handle', j + 1)}"
    collect(it, ["catalog", "items", j], grp, i if isinstance(i, int) else f"c{j}")
for top in ("packs", "packUnit", "finder"):
    if top in cfg:
        collect(cfg[top], [top], "Diğer yazılar", None)

schema, pairs, n = [], [], 0
for grp, entries in texts.items():
    sets = [{"type": "paragraph", "content": "Boş bırakılan alan sitedeki ilk yazıyı gösterir."}]
    for paths, lab, value in entries.values():
        sid = f"m{n}"
        n += 1
        sets.append({"type": "text" if len(value) <= 60 and "\n" not in value else "textarea", "id": sid,
                     "label": lab, "default": value})
        pairs.append(f"[{json.dumps(paths)},{{{{ settings.{sid} | json }}}}]")
    schema.append({"name": grp if len(grp) <= 50 else grp[:49] + "…", "settings": sets})
# ------------------------------------------------------------------ vitrin kurulurkenki ürün görselleri
def image_name(u):
    """shopifyLive.js nameOf ile aynı: adres, uzantı ve Shopify'ın _<uuid> eki olmadan, küçük harf."""
    from urllib.parse import unquote
    n = unquote(u.split("?")[0].rsplit("/", 1)[-1])
    n = re.sub(r"\.[a-z0-9]+$", "", n, flags=re.I)
    return re.sub(r"_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$", "", n, flags=re.I).lower()


def store_products():
    if "--magaza" in opt:
        import http.cookiejar
        import urllib.parse
        import urllib.request
        base = opt["--magaza"].rstrip("/")
        op = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))
        op.addheaders = [("User-Agent", "Mozilla/5.0")]
        if "--parola" in opt:
            data = urllib.parse.urlencode({"form_type": "storefront_password", "utf8": "✓", "password": opt["--parola"]}).encode()
            op.open(f"{base}/password", data, timeout=30).read()
        return json.loads(op.open(f"{base}/products.json?limit=250", timeout=30).read())["products"]
    for d in (f"{slug}-shopify", slug):
        f = os.path.join(ROOT, "demo-fabrikasi", "markalar", d, "products-tr.json")
        if os.path.exists(f):
            return json.load(open(f, encoding="utf-8"))
    return []


try:
    snap = {p["handle"]: sorted({image_name(i["src"]) for i in p.get("images", []) if i.get("src")}) for p in store_products()}
except Exception as e:
    print("! mağaza görselleri okunamadı:", e)
    snap = {}
GORSEL = '<script type="application/json" id="vitrin-gorsel">' + json.dumps(snap, ensure_ascii=False).replace("</", "<\\/") + "</script>"

METIN = '<script type="application/json" id="vitrin-metin">[' + ",".join(pairs) + "]</script>"

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
  {METIN}
  {GORSEL}
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
}] + schema, ensure_ascii=False, indent=2))
out.writestr("config/settings_data.json", json.dumps({"current": "Default", "presets": {"Default": {}}}, indent=2))
out.writestr("locales/tr.default.json", json.dumps({"general": {"3d": "3D Koleksiyon"}}, ensure_ascii=False, indent=2))
out.writestr("locales/en.json", json.dumps({"general": {"3d": "3D Collection"}}, indent=2))
out.close()
print("✓", f"demolar/{slug}-tema.zip", len(files), "dosya,", n, "düzenlenebilir yazı,", len(schema), "grup")
