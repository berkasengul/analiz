# Demo fabrikası (parfüm)

Bir marka için 3B parfüm sitesi demosunu tek bir ayar dosyasından üretir.
Şablon `hope-demo/` (Hope Istanbul); her yeni demo onun kopyasıdır.

## Tek komut

```bash
python3 demo-fabrikasi/yeni-demo.py demo-fabrikasi/markalar/<marka>.json
```

Sonuç:

- `demolar/<slug>/`: markanın site klasörü (`npm run dev` ile açılır)
- `demolar/<slug>-Netlify.zip`: Netlify Drop'a sürüklenecek dosya

Süre: ~20 saniye (etiket çizimi + derleme).

## Yeni marka için adımlar

1. **Ürün fotoğrafları:** Markanın sitesinden ya da Instagram'ından 2–3 ürünün beyaz
   fonda fotoğrafını al. Şişenin biçimini, kapağını ve etiketini göreceğiz.
2. **Ayar dosyası:** `sablon.json`'ı `markalar/<marka>.json` olarak kopyala ve doldur
   (aşağıdaki tablo). Claude'a "şu markanın ayar dosyasını hazırla" diyip fotoğrafları
   ve sitelerini vermen yeterli.
3. **Üret:** Yukarıdaki komut.
4. **Kontrol:** `cd demolar/<slug> && npm run dev`, tarayıcıda bak.
5. **Yayınla:** zip'i Netlify Drop'a yükle, linki mesaja koy.

## Ayar dosyasının alanları

| Alan | Ne işe yarar |
|---|---|
| `slug` | Klasör ve zip adı (`seven-gates` gibi, Türkçe karakter yok) |
| `meta` | Tarayıcı sekmesindeki başlık ve paylaşım açıklaması |
| `brand` | Marka adı, `sub` (Extrait de Parfum / Eau de Parfum), sorumluluk notu (TR + `en`) |
| `labelBrand` | Etiketteki logo yazıları: `wordmark`, `submark`, `concentration`, `volume` |
| `bottle` | Şişe ölçüleri: `glass` (genişlik, yükseklik, derinlik, `corner` köşe yuvarlaklığı: 0.1 kare, 0.9 yuvarlak), `label` (boyut, konum, arka etiket var mı), `neck`, `cap` (`shape`: cylinder / octagon / box, `finish`: gold / silver / black, renk), `scale`, `tilt` |
| `products[].form` | Ürünün biçimi: boş (şişe) ya da `"tube"` (krem tüpü, ölçüler `bottle.tube` içinde) |
| `products[]` | Her koku: `name`, `file` (etiket dosya adı), `color` (arayüz rengi), `theme` (sahne ışığı: glow / edge / drop), `collection`, `family`, `year`, `perfumer`, `tagline`, `notes`, `description`, İngilizcesi `en` içinde |
| `products[].label` | Etiket: `style` (`star` Hope tarzı, `art` sanat eseri, `tube` krem/bakım, `classic` sade, `lalive` fotoğraftan birebir marka stili: rozet, logo, dikey yazı düzeni), `plate` ("gold" ya da [r,g,b]), `star` / `ink` renkleri, `place` ve `scene` (arka etiket silüeti: han, palace, peninsula, walls, tower, galata, hills, sea, none), `pyramid` (TOP / HEART / BASE notaları) |
| `features` | Detaydaki 4 hikâye kartı (ikon, şişe pozu, TR/EN metin) |
| `ritual` | 3 adım (hangi koku, TR/EN metin) |
| `packs`, `prices` | Boyutlar ve ₺ / $ fiyatlar, kargo |
| `stockists`, `story`, `faqs` | Satış noktaları, marka hikâyesi, SSS (TR/EN) |
| `ui` | Markaya özel arayüz yazıları: yükleme yazısı, kayan bant, slogan, menü adları ("Kokular" yerine "Ürünler"), kalıplı metinler (`"{0} ürününü keşfet"`) |
| `packUnit`, `detailPack` | Mağaza birimi (ml / adet) ve detaydaki sepete ekle boyutu |
| `products[].tube`, `products[].bottle` | Ürüne özel ambalaj: tüp rengi/boyu, kapak biçimi (`flip` / `round`), yüzey (`pearl` / `matte`), renkli şişe (`tint`) ve etiket boyutu |
| `particles` | `"leaves"`: süzülen zeytin yaprakları |
| `glossary` | İçerik sözlüğü: çiplerin üstünde açılan kısa açıklamalar (TR/EN) |
| `backdrop` | `false` ise arka planda etiketten bulanık manzara gösterilmez |
| `home` | Ana sayfanın 3B akışındaki ürünler (`products` sırası, ör. `[0,1,2,3,4]`). Katalogdaki diğer 3B ürünler kategori sayfalarında (`#/urunler/<kategori>`) kendi 3B akışlarında görünür |
| `products[].form: "tool"` | Ahşap/lif bakım aleti (`bottle.tool`: `lymph`, `brush`, `loofah`), etiket askılı kartta (`bottle.tag`) |
| `bottle.cap.shape` | `cylinder`, `octagon`, `box`, `pump` (pompa), `spray`, `dropper` (damlalık), `ball` (roll-on), `none` |
| `bottle.finish: "matte"` | Opak gövde (sabun, kutu, kumaş); `ribbon` hediye kurdelesi, `garment` sweatshirt silüeti, `liquid` şeffaf şişede içerik rengi |
| `products[].nameLang` | Tek ürünün ad dili (ör. İngilizce "Sweatshirt" → `"en"`) |
| `catalog` | Tüm ürün kataloğu: `categories` (ad, renk, açıklama), `items` (fiyat, kategori, simge ya da görsel, 3B ürüne bağlantı `product`), `homeCount` (ana sayfa vitrini), `glow` (katalog sayfasının ışık rengi). Menüde "Kategoriler" paneli ve `#/urunler/<kategori>` adresleri bundan oluşur |

## Notlar

- Etiket stili markaya göre değişir. `classic` her marka için hızlı bir başlangıçtır;
  gerçeğe benzemesi için etiket çizimini markanın fotoğrafına göre
  `hope-demo/docs/label-generator.py` içine yeni bir stil olarak eklemek gerekir
  (Hope'taki `star` stili gibi). Bu, marka başına yaklaşık 1 saatlik iştir.
- Demo klasörleri şablonun `node_modules` klasörünü kullanır (sembolik bağ); şablonda
  bir kez `npm install` yapılmış olmalı.
- Demolar gerçek marka adı ve tasarım içerir: herkese açık yayınlama, yalnızca
  markaya özel gönder.
