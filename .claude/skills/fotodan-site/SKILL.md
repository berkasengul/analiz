---
name: fotodan-site
description: 3–4 ürün fotoğrafından Turkish Coffee Lady / UnBe kalitesinde 3B marka sitesi üretir. Kullanıcı ürün fotoğrafı atıp "site yap", "fotoğraftan site", "bu markaya 3B site" dediğinde kullan.
---

# Fotoğraftan 3B site

Hat: `site-fabrikasi/yukle/<slug>/` (fotoğraflar + `marka.json`) → `python3 site-fabrikasi/fotodan-site.py <slug>`
→ `demolar/<slug>-Netlify.zip` + önizleme görüntüleri `site-fabrikasi/cikti/<slug>/onizleme_*.jpg`.
Motor: `demo-fabrikasi/` (TCL, UnBe) ve şablon site `hope-demo/`. Süre: ~20 sn + önizleme.

## Adımlar

1. **Fotoğrafları yerleştir.** Her ürünün önden, sade zeminde fotoğrafı `site-fabrikasi/yukle/<slug>/` içine
   (`limon.png` gibi kısa adlar). Slug: küçük harf, Türkçe karakter ve boşluk yok.
2. **Fotoğraflara bak (Read ile) ve `marka.json` yaz.** Örnek ve tam biçim: `site-fabrikasi/yukle/mavikoy/marka.json`.
   - Etiketten oku: marka adı (`name`, logodaki yazım `wordmark`), ürün adları, hacim (`size`), tür (`kind`).
   - `accent`: etiketteki/logodaki ana koyu renk; `products[].color`: ürünün kendi rengi (sıvı, kutu, ambalaj) → sahne ışığı.
   - `words`: ürün türüne göre ("Kolonya/Kolonyalar", "Kahve/Kahveler", "Mum/Mumlar"); `action`: ikinci buton
     ("Kolonyayı dök", "Mumu yak"); türde anlamı yoksa `"spray": false`.
   - `family`, `notes`, `tagline`, `desc`: **yalnızca fotoğrafta, markanın sitesinde ya da kullanıcının verdiği bilgide
     olan şeyler.** Bilinmiyorsa genel ve dürüst yaz ("Limon kolonyası, 80°"), nota uydurma. Hayali marka ise
     `"fictional": true`.
   - `whatsapp`: kullanıcının verdiği numara (yoksa sor; demo için `905000000000` yer tutucu).
   - `features` (tam 4 kart), `story`, `faqs`: kısa, markaya özgü, TR + EN.
   - Fiyat verme (`price: 0`), kazanç vaadi yok.
3. **Çalıştır:** `python3 site-fabrikasi/fotodan-site.py <slug>`
4. **Önizlemeye bak** (`site-fabrikasi/cikti/<slug>/onizleme_0.jpg` ana sayfa, `_1` katalog). Kontrol:
   ürün kaidede düzgün mü, etiket okunuyor mu, logo görünüyor mu, yazılar Türkçe mi. Sorun varsa `marka.json`
   (renk, `depthRatio`) ya da `foto` kurallarını (`"clear"`, `"convex"`, `"symFill"`; liste `demo-fabrikasi/araclar/shopify-foto.py` başında) düzeltip tekrar çalıştır.
5. **Teslim:** zip ve önizlemeleri kullanıcıya gönder (SendUserFile). Netlify Drop'a sürüklenince yayına çıkar.

## Kurallar

- Gerçek bir markanın demosu herkese açık yayınlanmaz; yalnızca markaya özel gönderilir. Altta "bağımsız konsept demo" notu kendiliğinden çıkar.
- Uydurma bilgi yok; markanın metni yoksa sade ve doğru yaz.
- En iyi sonuç: şişe, kavanoz, mum, kutu, sabun gibi ürünler. Cam/metal parlak ürünlerde `foto` kuralları gerekebilir.
