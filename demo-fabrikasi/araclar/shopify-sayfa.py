"""3D vitrini bir Shopify mağazasının kendi sayfası olarak çalıştıran tema şablonu (iframe yok).

Kullanım: python3 shopify-sayfa.py <slug> <vitrin-adresi>
  örn.   python3 shopify-sayfa.py cakir-shopify https://cakir-3d.netlify.app

Çıktı: demolar/<slug>-sayfa/page.3d.liquid (zip: demolar/<slug>-Netlify.zip, yeni-demo.py ile)
  Shopify → Online Mağaza → Temalar → ... → Kodu düzenle → templates → Yeni şablon ekle → "page", tür "liquid",
  ad "3d" → bu dosyanın içeriğini yapıştır. Sonra sayfanın "Şablon" alanında "page.3d" seçilir.

Nasıl çalışır:
- Sayfa mağazanın adresinde açılır (ör. /pages/3d-koleksiyon), tam ekran; tema başlığı/altbilgisi yok.
- <base> etiketi vitrinin dosyalarını (3D modeller, görseller, kod) vitrin adresinden (Netlify) yükler;
  dosyalarda Access-Control-Allow-Origin başlığı vardır (public/_headers).
- <meta name="vitrin-shopify"> vitrine mağazada olduğunu söyler: fiyat, varyant ve stok her açılışta
  /products/<handle>.js'den okunur, "Ödemeye geç" ürünleri mağazanın sepetine ekleyip ödemeyi açar
  (hope-demo/src/shopifyLive.js).
- Zip yine Netlify'a olduğu gibi yüklenir; vitrin adresi değişirse yalnızca bu şablondaki adres değişir."""
import os
import re
import sys
import zipfile

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..")
slug, host = sys.argv[1], sys.argv[2].rstrip("/") + "/"
html = zipfile.ZipFile(os.path.join(ROOT, "demolar", f"{slug}-Netlify.zip")).read("index.html").decode("utf-8")
head = re.search(r"<head>(.*)</head>", html, re.S).group(1)
# Vitrinin kendi meta etiketleri (başlık, robots, og) yerine mağazanınkiler; yazı tipi, stil ve kod kalır.
keep = [l for l in head.splitlines() if re.search(r"<link[^>]+(fonts\.|stylesheet|modulepreload|icon)|<script", l)]
out = f"""{{% layout none %}}
<!doctype html>
<html lang="{{{{ request.locale.iso_code }}}}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>{{{{ page.title }}}} · {{{{ shop.name }}}}</title>
  <meta name="description" content="{{{{ page.content | strip_html | truncate: 150 | escape }}}}">
  <link rel="canonical" href="{{{{ canonical_url }}}}">
  <meta name="vitrin-shopify" content="{{{{ shop.permanent_domain }}}}">
  <base href="{host}">
{chr(10).join('  ' + l.strip() for l in keep)}
</head>
<body>
  <div id="root"></div>
</body>
</html>
"""
dst = os.path.join(ROOT, "demolar", f"{slug}-sayfa")
os.makedirs(dst, exist_ok=True)
open(os.path.join(dst, "page.3d.liquid"), "w", encoding="utf-8").write(out)
print(out)
