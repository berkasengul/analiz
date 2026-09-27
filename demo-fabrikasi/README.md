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
| `fillLight` | Sahnedeki yan dolgu ışığının rengi (varsayılan soğuk mavi; doğal bakım markalarında sıcak ton) |
| `labelFinish` | Etiket yüzeyi: `metalness`, `roughness`, `clearcoat`, `envMapIntensity` (kâğıt etiket için mat; boşsa parfüm tarzı parlak) |
| `products[].light` | Spot ışık çarpanı (boşsa etiket rengine göre otomatik) |
| `bottle.glass.shape: "cylinder"` | Yuvarlak şişe (ör. damlalıklı yüz yağı); etiket çevreye sarılır. Damlalıkta `cap.collar`, `bulbRadius`, `bulbHeight` |
| `products[].photos` | Markanın gerçek ürün fotoğrafları: detayda küçük resimler, tıklayınca büyük görünüm |
| `products[].rating` | Markanın sitesindeki puan (`score`, `count`) |
| `catalog.items[].photo` | Kartın üzerine gelince 3B görselin yerine gerçek fotoğraf |
| `products[].form: "photo"` | 3B ürün markanın kendi fotoğrafından: kesilmiş ön/arka fotoğraf (`<slug>-foto/labels/<ürün>.webp`) silüete göre hacimlenir. `photo3d.profile`: `round` (şişe, kavanoz, mum: satır satır silindir) ya da `flat` (kutu, set, sabun, tekstil; `depth` kalınlık) |
| `products[].photo3d.profile: "group"` | Set: `lalive-setler.json` içeriğinden her ürün kendi biçimiyle ayrı parça (`parts`) |
| `catalog.items[].cutout`, `compareAt` | Kartta kesilmiş ürün fotoğrafı; indirimde eski fiyat üstü çizili |
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

## Shopify markaları: bütün ürünleri gerçek fotoğraflarıyla aktarma

Marka Shopify kullanıyorsa (sitenin altında "Powered by Shopify") bütün katalog tek seferde aktarılır:

```bash
python3 demo-fabrikasi/araclar/shopify-cek.py www.marka.com <slug>     # metin, fiyat, kategori, orijinal görseller
python3 demo-fabrikasi/markalar/lalive-foto.py                          # galeri, kesit, 3B doku atlası (Lalive örneği)
python3 demo-fabrikasi/markalar/lalive-shopify-aktar.py                 # ayar dosyasına ürünler ve kategoriler
python3 demo-fabrikasi/yeni-demo.py demo-fabrikasi/markalar/<slug>.json
```

Orijinal görseller ve işlenmiş kopyalar depoya girmez (`.gitignore`); komutlarla yeniden üretilir.

## Shopify markası: genel hat (Türkan ile kuruldu)

Markanın sitesi Shopify ise (adres + `/products.json` açılıyorsa) demo birkaç komutla hazırlanır:

```bash
pip install "rembg[cpu]"                                      # bir kez: yapay zekâyla arka plan silme
python3 demo-fabrikasi/araclar/shopify-cek.py turkan.com.tr turkan   # ürünler, fiyatlar, bütün görseller
python3 demo-fabrikasi/araclar/shopify-foto.py turkan         # kesim, yansıma temizliği, 3B doku atlasları, arka etiket
python3 demo-fabrikasi/araclar/shopify-aktar.py turkan        # ürünler, kategoriler, notalar, setler → turkan.json
python3 demo-fabrikasi/yeni-demo.py demo-fabrikasi/markalar/turkan.json
```

Markaya özgü her şey iki dosyada:
- `markalar/<marka>.json`: marka metinleri (hikâye, SSS, satış noktaları, özellik kartları, arayüz yazıları, `commerce`, `latinTerms`). İskelet olarak bir önceki markanınki kopyalanır, metinler markanın sayfalarından yazılır.
- `markalar/<marka>-kurallar.json`: `foto` (yapay zekâ kesimi, setlerin içeriği, gerçek boylar, arka fotoğraf kullanılsın mı) ve `aktar` (kategoriler, 3B biçimleri, koku notaları, ana sayfa sırası, ritüel, adlar). Alanlar araçların başındaki açıklamada.

3B biçimler: `round` (dönen gövde), `flat` (pahlı blok), `flask` (küre/silindir kapak dönen gövde + yassı şişe gövdesi; boyun fotoğraftan bulunur), `group` (set: her ürün ayrı parça). Sepet `commerce.shopify` ile markanın kendi ödeme sayfasına gider (`/cart/<varyant>:<adet>`).

## Sahne kimliği (tema): her marka kendine özgü

`markalar/<marka>.json` → `theme` ile şablonun görünümü markaya özelleşir (yoksa varsayılan kalır):

```json
"theme": {
  "name": "portal",                 // <html data-theme="portal">: base.css'teki tema kuralları
  "accent": "#c9a55c",              // vurgu rengi (altın)
  "particles": "gold",              // altın toz parçacıkları
  "numerals": {"font": "fonts/Italiana-Regular.ttf"},  // kokunun numarası sahnede dev altın sayı
  "intro": "portal",                // açılış: kapı çizilir, sayılar akar, kapı açılır
  "fonts": {"href": "<Google Fonts bağlantısı>", "display": "...", "serif": "...", "sans": "..."}
}
```

`"particles": "none"` kristal/yaprak sahnesini kapatır. Aktarım kurallarında `themeAccent` ve `themeGlow` sahne ışığının rengini ve parlaklığını ayarlar. İlk tema: Türkan · "Sayıların Kapısı".
