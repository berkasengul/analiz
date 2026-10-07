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
python3 demo-fabrikasi/araclar/foto-onar.py turkan           # (gerekirse) camda delik kalan kesimleri onarır, şişe profilini yeniden çıkarır
python3 demo-fabrikasi/araclar/shopify-aktar.py turkan        # ürünler, kategoriler, notalar, setler → turkan.json
python3 demo-fabrikasi/yeni-demo.py demo-fabrikasi/markalar/turkan.json
```

Markaya özgü her şey iki dosyada:
- `markalar/<marka>.json`: marka metinleri (hikâye, SSS, satış noktaları, özellik kartları, arayüz yazıları, `commerce`, `latinTerms`). İskelet olarak bir önceki markanınki kopyalanır, metinler markanın sayfalarından yazılır.
- `markalar/<marka>-kurallar.json`: `foto` (yapay zekâ kesimi, setlerin içeriği, gerçek boylar, arka fotoğraf kullanılsın mı) ve `aktar` (kategoriler, 3B biçimleri, koku notaları, ana sayfa sırası, ritüel, adlar). Alanlar araçların başındaki açıklamada.

Şeffaf cam şişeler beyaz zeminde çekildiyse 3B'de opak beyaz blok gibi görünür: `foto.glassAlpha: "<handle regex>"` ve marka dosyasında `"glass": true` ile camın içinden görünen stüdyo beyazı yarı saydam (sıvı renginde) olur, etiket (en büyük dikdörtgen kontur), kapak ve cam kenarı olduğu gibi kalır; sahne camın içinden görünür (örnek: Mardini).

3B biçimler: `round` (dönen gövde), `flat` (pahlı blok), `flask` (küre/silindir kapak dönen gövde + yassı şişe gövdesi; boyun fotoğraftan bulunur), `group` (set: her ürün ayrı parça). Sepet `commerce.shopify` ile markanın kendi ödeme sayfasına gider (`/cart/<varyant>:<adet>`).

## Sahne kimliği (tema): her marka kendine özgü

`markalar/<marka>.json` → `theme` ile şablonun görünümü markaya özelleşir (yoksa varsayılan kalır):

```json
"theme": {
  "name": "portal",                 // <html data-theme="portal">: base.css'teki tema kuralları
  "accent": "#c9a55c",              // vurgu rengi (altın)
  "particles": "gold",              // altın toz parçacıkları
  "numerals": {"font": "fonts/Italiana-Regular.ttf"},  // kokunun numarası sahnede dev altın sayı
  "intro": "mark",                  // sade ve hızlı açılış (logo + ince yükleme çizgisi); oturumda yalnızca ilk açılışta
  "fonts": {"href": "<Google Fonts bağlantısı>", "display": "...", "serif": "...", "sans": "..."},
  "studio": true,                   // stüdyo ışığı: ürün rengine göre kenar ışığı + gövdede gezen ışık süpürmesi
  "pedestal": true,                 // öndeki ürün altın halkalı parlak bir kaidede durur (ürünün altına göre ölçülür)
  "carousel": "solo",               // tek ürün sahnesi: huzme yalnızca öndeki ürüne düşer, yanlar karanlıkta silüet
  "cards": "gallery"                // ürün kartları: her ürün kendi renginde dikey vitrin, notalar ve ışık huzmesi
}
```

Ürün başına arka plan rengi aktarım kurallarından gelir: `aktar.palette: [["<handle regex>", "#zemin", "#vurgu"], ...]`. Zemin rengi ana sayfada o ürün öndeyken sahneyi, kartta vitrini boyar; vurgu rengi ışığı ve kaide parıltısını. Ana sayfada kaç ürün kaydırılacağı `aktar.home` listesidir (Türkan'da 4; Ritüel'deki ürünler bu listede olmalı). `solo` düzeninde sahnedeki dev numara kapalıdır (sol üstteki sayaç aynı işi görür).

`"particles": "none"` kristal/yaprak sahnesini kapatır. Aktarım kurallarında `themeAccent` ve `themeGlow` sahne ışığının rengini ve parlaklığını ayarlar. İlk tema: Türkan · "Sayıların Kapısı".

## Galeri çekimlerinden 3B görünümler

Kurallarda `foto.views: true` olursa `shopify-foto.py` galerideki diğer ürün çekimlerini de (kapaksız şişe, kutusunda
şişe, kutu) 3B'ye çevirir: `labels/<handle>~<n>.webp` ve `meta.json → views`. Kutu dikdörtgen silüetten tanınır
(yansıma tam genişlikteki son satırın altından kesilir, beyaz zeminle karışan yerler dışbükey zarfla geri gelir);
şişenin üstü dar olduğundan şişe biçimi alır. Silüeti düzgün çıkmayan çekim atlanır ve sitede fotoğraf olarak açılır.

```bash
python3 demo-fabrikasi/araclar/shopify-foto.py turkan --views   # yalnızca görünümleri yeniden üret (~2 dk)
python3 demo-fabrikasi/araclar/shopify-aktar.py turkan          # products[].views + heroPhoto
```

Sitede küçük görsele (üzerinde "3B") tıklayınca ürün kendi etrafında dönerek o modele geçer. Ürün sayfasında
fare tekerleğiyle ya da parmakla aşağı kaydırmak sağdaki dört hikâyeyi sırayla açar.

## Kart görselleri: sitenin 3B modelinden

Ürün kartları, arama ve sepet küçük resimleri düz fotoğraf yerine sitenin kendi 3B modelinden çekilebilir
(saydam zemin, stüdyo ışığı, hafif yan açı). Site `?still=<n>` ile yalnızca o ürünü çizer; araç bunu çeker:

```bash
python3 demo-fabrikasi/yeni-demo.py demo-fabrikasi/markalar/turkan.json   # önce derle
python3 demo-fabrikasi/araclar/kart-3b.py turkan                           # → turkan-foto/render3d/<handle>.webp (~10 dk)
python3 demo-fabrikasi/araclar/shopify-aktar.py turkan                     # kart görseli r3d/<handle>.webp olur
python3 demo-fabrikasi/yeni-demo.py demo-fabrikasi/markalar/turkan.json   # yeniden derle
```

Telefonda ürün akışı sayfa sayfadır: her kaydırma hareketi tam bir ürün ilerler ya da geri gider; son üründen
sonra sayfa doğal kaydırmayla alt bölümlere iner (son ürün konuma değil sıraya göre tanınır: adres çubuğu
açılıp kapanınca takılmaz).

### Sergi kartları (sinematik sahne)

`kart-3b.py <marka> --stage` her ürünü sitenin 3B motorunda bir sergide çeker: altın çerçeveli kemerli niş
(arkası kokunun renginde ışık), siyah mermer kaide, koyu zemin, tepeden spot ışığı, ışık konisi ve altın toz.
Çıktı `<marka>-foto/sahne/<handle>.webp` (3:4). Aktarım bunu ürünün `scene` alanına yazar; galeri teması
(`theme.cards: "gallery"`) bu görseli tam kart olarak gösterir: ince altın çerçeve, altta yazı, sepet ve ok düğmesi.
Hazır bir sahne fotoğrafı (ör. içerik notalarıyla çekilmiş) aynı dosya adıyla `sahne/` klasörüne konursa o kullanılır.

### Hazır sahne fotoğrafına ürün yerleştirme

Markanın (ya da yapay zekâyla üretilmiş) ürünsüz sahne fotoğrafları `<marka>-foto/sahne-kaynak/` klasörüne konur;
`kurallar.json → foto.sceneArt` hangi ürünün hangi sahneye gideceğini ve kaidenin yerini söyler (`match` regex,
`file`, 3:4 `crop`, kaide üst yüzünün ortası `cx`/`base`, 100 ml şişenin piksel boyu `h`, arka hâle rengi `glow`).
`araclar/sahne-birlestir.py <marka>` ürünün 3B görüntüsünü kaideye oturtur: gerçek boy oranı (`foto.heights`),
sahne spot dışında kararır (`dim`, varsayılan 0.42), tepeden ürüne ışık konisi ve kaidede ışık havuzu, ürün üstten
aydınlık, kenarında ince sıcak ışık çizgisi, temas gölgesi, silik yansıma. Net ürün için önce yüksek çözünürlüklü
çekim: `kart-3b.py <marka> --hd --only "floraison|agrumes|boi"` → `render3d-hd/` (varsa o kullanılır).
Çıktı `sahne/<handle>.webp` olur (3B sergi görselinin yerine geçer); sonra aktarım + derleme.

Her ürüne kendi renginde sahne: `"tint": "palette"` olan bir kural, sahnenin renkli bölümünü (ör. yeşil orkide
sahnesinde kemerin içi, `tintHue` aralığı) ürünün sitedeki rengine (`aktar.palette`) boyar; desen, doku, altın,
mermer ve çiçekler aynı kalır. Türkan'da Floraison/Agrumes/Boisé kendi sahnelerinde, diğer bütün ürünler
(`"match": "."`) yeşil orkide sahnesinin kendi renklerine boyanmış hâlinde.

```bash
python3 demo-fabrikasi/araclar/sahne-birlestir.py turkan
python3 demo-fabrikasi/araclar/shopify-aktar.py turkan
python3 demo-fabrikasi/yeni-demo.py demo-fabrikasi/markalar/turkan.json
```

### Ana sayfa sergisinin arka planında sahne fotoğrafı

`foto.backdropArt` (sceneArt ile aynı alanlar, `crop` yok) her ürüne bir ürünsüz sahne fotoğrafı atar;
`sahne-birlestir.py` bunları `fon/` klasörüne yazar (gerekirse ürünün rengine boyar) ve `fon/fon.json` üretir.
Aktarım ürüne `stage` alanını ekler (`src`, en/boy, kaide çizgisi, orta, ürün boyu). Site (Background.jsx)
fotoğrafı öndeki 3B ürünün arkasına koyar: fotoğraftaki kaide ürünün ayağına hizalanır, boyu ürünün ekrandaki
boyuna göre ölçeklenir, kenarları karanlığa karışır, ürün değişince yumuşakça geçer; 3B kaide gizlenir.
Detayda, Ritüel'de ve mağazada söner. Türkan: Floraison pembe gül, Agrumes mor lavanta-limon, Boisé yeşil orkide,
diğerleri orkide sahnesinin kendi renklerine boyanmış hâli. Kartların hepsi kemerli orkide sergisinde.

### Ürünler sayfasının 3B girişi

Sergi kartlı temada (`theme.cards: "gallery"`) `#/urunler` sayfası 3B bir kapak akışıyla açılır: bütün
ürünler sergi görselleriyle yan yana, öndeki dik ve aydınlık, yandakiler açılı ve kararmış. Sayfa kaydıkça
ürünler kayar (sahne 250vh boyunca sabit kalır), kendiliğinden birkaç saniyede bir ilerler (fare üstündeyken
durur, hareket azaltma ayarında hiç ilerlemez). Altta öndeki ürünün kategorisi, adı, fiyatı, sepet ve ürüne
git düğmeleri; ardından kategori çipleri ve ürün ızgarası gelir.

### Yükselen vitrin (`theme.carousel: "rise"`) ve renkli cam şişenin arka yüzü

Her marka kendi 3B kaydırma düzenini seçer. `"solo"` (Türkan): öndeki ürün ışıkta, yanlar silüet, arkada
sahne fotoğrafı. `"rise"` (Unique'e Luxury): ekranda her seferinde tek şişe, yukarıdan vuran ışık huzmesinin altında
süzülür; kaydırınca şişe yarım tur dönerek yukarı çıkar, sıradaki aşağıdan dönerek yerine gelir. Komşu şişeler
yalnızca geçişte görünür, kaide yok, hiçbir şey üst üste binmez. `"orbit"`: döner platform (denendi, ürünler
iç içe göründüğü için Unique'te bırakıldı). Arka plan ürün renginde kadife.

Butik ("dolly") ek ayarları: `"wallStill": true` duvar kaydırınca kaymaz (ürün değişince yalnız ışığın rengi değişir), `"wallCurve": 18` duvar ürünün arkasında içbükey yay (komşular duvarın önünde görünür), `"beams": 3` tepeden ürün renginde ışık huzmeleri, `"wallStyle": "marble" | "arches" | "lattice"` oluklu duvar yerine gece mermeri / ışıklı kemerler / altın kafes (kavisli duvarda; sayfada `?wall=...` ile denenir), `"paging": true` + `"pageDuration": 1.7` tek kaydırmada sıradaki ürüne yumuşak (ease-in-out) geçiş (O'JUVI).
`"silk"` (O'JUVI): ipek (Silk.jsx). Şişe, kokunun renginde akan saten bir kumaşın üstünde sabit, mimari profilli siyah mermer kaidede (altın damarlar, silmelerde altın halkalar) durur; ürün büyük ve ön planda (Lake.jsx → stageFrame); kumaş arkada sağa doğru dalga gibi yükselir, sol üst başlığa boş kalır. Ürünler yandan hafif bir yayla süzülüp kaideye konar; kaydırınca kumaş dalgalanır. Işık ve malzeme gece stüdyosundan (Studio.jsx).
`"lake"` (O'JUVI): ayna su (Lake.jsx). Şişe karanlık, durgun bir suyun üstünde; suda yansıması, ufukta kokunun renginde ışık. Şişeler suyun üstünde bir geçit gibi akar: sıradaki koku ufuktaki ışığın içinden süzülerek yaklaşır (yerindeyken ufukta küçük silüet), öndeki yana kayıp karanlığa çekilir; kayan şişelerin ardında ışıklı halkalar kalır.
"lake" düzeninin ışığı ve atmosferi: gece stüdyosu (Studio.jsx). Her koku aynı premium dilde, kendi renginde: neredeyse siyah stüdyo fonu, uzakta kokunun renginde yumuşak hale, ıslak siyah taş zemin (bulanık yansıma, temas gölgesi), şişede stüdyo ışık kutusu yansımaları ve metal altın bölgeler, önden ana ışık, arkadan renkli kenar ışığı, kapağa altın vurgu.
`"glide"` (Attar al Has; kemersiz `"arch": false` ve büyük şişe `"glideScale": 1.25` ile Reinvented): şişe altın çizgili bir Osmanlı kemerinin (sivri kemerli niş, tepede alem) içinde,
parlak zeminde durur; kaydırınca yana süzülüp döner, sıradaki öbür yandan kemere girer. Kemer ürünün ayağına ve
boyuna göre çizilir (BackgroundMaterial → `u_arch`). Satış noktası listesi olmayan marka `hide: ["stockists"]`.
Fotoğraf kuralları: `studio` (gri/renkli stüdyo zemini), `pedestal` (kaide üstü çekim; cam tabanı kesilmez),
`solidTop` (kapak bölgesi delik bırakılmadan kesilir).

`"dolly"` (Mardini): gerçek 3B butik (Boutique.jsx). Yivli koyu bronz duvar (yarım silindir oluklar), tepeden
duvara ürünün renginde düşen ışık havuzu, ürünleri ve kaideleri gerçekten yansıtan cilalı taş zemin
(MeshReflectorMaterial; arka plan shader'ı 1. katmanda, yansımaya girmez). Ürünler bir sırada, her biri kendi altın
kenarlı obsidyen kaidesinde (Carousel → `Plinth`, `PLINTH_H`; ürünün ayağı `BOTTOM` ölçülüp kaidenin üst yüzüne
oturur, bütün kaideler aynı zeminde). Öndeki ürün ortada, komşular iki yanda geride ve loşta; kaydırınca sıra yana
kayar, odak komşuya geçer; duvar daha yavaş kayar (derinlik), geçişte ürünün önünde ince duman kabarır. Yandaki ürüne
tıklamak sırayı ona kaydırır. Parçacıklar `"particles": "dust"`. Kart sergisi (`kart-3b.py --stage`, Still → `NoirSet`)
aynı dilde: yivli duvar, ışık havuzu, yansıyan zemin, yuvarlak obsidyen kaide.

**Butik fotoğrafı** (`theme.plate: { src, aspect, x, floor }`): markanın (ya da müşterinin verdiği) salon görseli
arka planı kaplar (`markalar/<marka>-assets/` içine konur, `brand/…` olarak yayınlanır). `x`: fotoğraftaki odak noktası
(ör. kemerin ortası) öndeki ürüne gelir; dikeyde fotoğraf ekranı tam kaplar; telefonda küçülür, kemerin tamamı
görünür (üstü karanlığa karışır, zemin aynalanır). Fotoğraflı modda 3B duvar ve yansıtıcı zemin gizlidir; kaidelerin
altında temas gölgesi ve zeminde soluk yansımaları çizilir. Masaüstünde komşular 16 birim geride aynı boyda durur
Hazır fotoğraf yerine çizilmiş bir sahne de verilebilir: `araclar/desen-arkaplan.py <çıktı.jpg> [--duvar --altin
--oniks --tile]` bordo (ya da verilen renkte) duvarda altın kakmalı sekiz köşeli yıldız / haç deseni, ortada sivri
kemerli niş (içi arkadan aydınlatılmış yivli cam) ve deseni yansıtan siyah mermer zemin çizer (3000×1140, `x: 0.5`,
`floor: 0.658`). Fotoğraf ürünlerden ayrı bir dünya gibi durduğunda bu kullanılır (Mardini: `desen.jpg`; eski
salon fotoğrafı `markalar/mardini-kaynak/`). Fotoğraf kaydırmada hiç oynamaz. Kaide tek: ortada sabit durur,
öndeki ürün onun üstündedir; komşular doğrudan zeminde (temas gölgesiyle), ortaya gelen ürün hafif bir kavisle
kaideye konar. Sinematik düzen: fotoğraf hafif flu (sığ alan derinliği) ve film tonunda; tepeden kaideye ışık
huzmesi, kaidenin dibinde ışık havuzu, zeminde ince sis, güçlü vinyet. Geçişte odak kayar (arka plan daha flu,
huzme kısılır), ürün kaideye konunca huzme bir an parlar (Background → `u_plateFx`, `u_plateBlur`).

Ürün ürün geçiş (`theme.paging`, "dolly"da varsayılan açık): masaüstünde tek tekerlek / dokunmatik yüzey hareketi
sıradaki ürünü doğrudan ortaya getirir (App → `pagingWheel`; atalet olayları yutulur). Telefonda zaten sayfa sayfa.

Saydam cam şişelerde ışık: `"photoUnlit": 0.8` (fotoğrafın kendi ışığının payı) ve `"photoExact": true` (etiket ton
eşlemeden geçmez) ile etiket fotoğraftaki gibi net; `foto.glassAlpha` etiketin yazısını koyulaştırır. Kalınlık yüzleri
ışığı kıran gerçek cam (transmission; telefonda yarı saydam cam). `?shot` açılış animasyonunu atlar (yavaş test
tarayıcısında ekran görüntüsü için).

**Parfümü sık** (`"spray": true`, yassı `flask` şişelerde): başlık bloğunda ve ürün sayfasında düğme. Basınca kapak
(boynun üstündeki torna, CanMesh → `Sprayer`) kalkıp yana eğilerek havada durur, altın boyun halkası ve sprey başlığı
görünür, başlığa basılır ve deliğinden parfüm buğusu çıkar (Spray.jsx: ince sis, ışıltılı damlacıklar, yavaş açılan
bulut; hareket tamamen shader'da). Zaman çizelgesi `shared.js → SPRAY`; `?slowmo=10` ile ağır çekim.

**ikas mağazaları:** `python3 demo-fabrikasi/araclar/ikas-cek.py <alan-adı> <marka> --only "regex"` ürünleri sayfaların
`__NEXT_DATA__` verisinden Shopify biçiminde çeker (products-tr/en.json, ikas-raw.json: özellikler, nota piramidi).
Aktarımda `"platform": "ikas"`: sepette "Ödemeye geç" tek ürünse ürünün mağazadaki sayfasını, değilse mağazayı açar.
Fotoğrafta `"hero": [["regex", n]]`: ürünün n. görseli ana (ön) görsel (ilk görselde ürün kutusuyla birlikteyse).

Markanın sitesindeki önemli bilgiler (marka json'ında, aktarım bunları korur):
`defaultLang: "en"` site İngilizce açılır (dil düğmesinde önce gelir; eski ziyaretçinin kayıtlı dili de sıfırlanır).
`locator: {countries: {"Italy": "İtalya"}, stores: [{name, country, city, address, phone, web, type}]}` "Mağaza bul"
bölümü (ülke seçimi, arama, yol tarifi) ve üst menüde bağlantısı; Shopify mağaza bulucusundaki
`data-store-locator-source` JSON'undan alınır. `contactInfo: {tr: [["Adres", [satırlar]]], en: [...]}` iletişimde
adres, telefon (tıklanır), WhatsApp, e-posta, saatler. `packUnit: {"tr": "adet", "en": "bottle"}` dile göre.

`foto.glassBack` (renkli cam şişe): arka yüz ön fotoğrafın aynası (cam ve renk net); ön etiketin yerine etiketin
kendi renkleriyle arka etiket (marka, ad, aile, notalar, hacim, `lines`); yan yüzler parfümün rengi.
Aktarımda `sizes` (ürün başına hacim), `defaultSize`, `trText` (İngilizce mağaza için Türkçe çeviri),
`tagline: "notes"` (kısa alt yazı notalardan); fotoğrafta `skip` (demoya alınmayacak ürünler).

## WooCommerce markaları (Régalien)

`araclar/woo-cek.py <alan-adı> <marka>` WooCommerce'in herkese açık Store API'sinden bütün ürünleri (TR ve `/en`
önekli İngilizce) Shopify biçiminde kaydeder; sonraki adımlar (`shopify-foto.py`, `shopify-aktar.py`) aynen çalışır.
Mağaza görselinde şişenin çevresinde malzemeler (çiçek, meyve, su) varsa araç sitenin medya arşivinde aynı adlı
sade çekimi (`<Ad>_1500x1500.png`; `v4_`, `_v5`, `KUTU` olmadan) bulup ilk görsel yapar; yanlış eşleşeni
`<marka>-kurallar.json → cek.cleanShot` ile elle seç. Açıklamadaki üç kısa virgüllü satır nota piramidi (üst / kalp /
alt) olarak `woo-raw.json`'a yazılır; iki dilin aynı açıklamada durduğu ürünlerde (`class="pp-tr"` / `"pp-en"`)
diller ayrılır. Aktarım kuralları: `"platform": "woo"`, `"wooCart": "sepet"` (sepete ekle bağlantısı
`/<wooCart>/?add-to-cart=<id>`), ürüne özel `"families"` ve `"taglines"`.

**Premium duvar** (`theme.decor: {"niche": true, "pattern": true}`, ferah sahnede; Parfumane): şişenin arkasında
sivri kemerli bir niş (içi ürünün renginde bir ton derin, tepeden ışık süzülür, altın çift çerçeve), nişin dışındaki
duvarda ince altın sekiz köşeli yıldız örgüsü ve kadife doku. Aynı dil koleksiyon kartlarında, koku bulucuda ve alt
bölümlerin sahnesinde de (`html.decor`): kemerli niş, desen, altın kenarlı damarlı mermer kaide ve altın ışık sızan
koyu ayak. Şişelerin hepsi aynı tondaysa (altın/amber) fotoğraftan çıkan renkler birbirine benzer: aktarım
kurallarında `palette` ile her ürüne kendi mücevher tonu verilir (bordo, safir, zümrüt…), `themeGlow: 0.3`.
Yanında puarlı pompa gibi eksenden taşan parçası olan şişeler dönen profil yerine tam silüetle (`profiles.flat`) gösterilir.

Minimal, çağdaş markalarda kemer yerine `decor.shape: "rect"`: ince altın çift çerçeveli dikey ışık panosu (Pekji);
`decor.pattern: false` deseni kapatır. Niş, öndeki ürünün ölçülen boyunu ve genişliğini izler (şişe hep içinde kalır).

**Sprey notu** (`ui/SprayNote.jsx`, `content.spray`): "Parfümü sık"a basınca buğu ekrana doğru üflenir; ardından sağdaki
nota listesinin yerinde koku profili (notalardan ve markanın açıklamasındaki koku kelimelerinden hesaplanan akorlar,
baskınlığa göre dolan altın çubuklar; sayı yok) ve nota katmanları belirir, birkaç saniye sonra dağılır. Başka dilde
başlık ve akor adları `ui.<dil>.sprayNote`.

**WooCommerce, büyük mağaza:** `woo-cek.py … --only "regex" --no-clean --no-en` yalnızca seçilen ürünleri indirir,
medya arşivinde sade çekim aramaz; İngilizce ürün (WPML) stok koduyla (SKU) eşleşir. İngilizce açıklama
`aktar.enText` ile elle seçilir.

## merxwebshop.hu mağazaları ve başka diller (Parfümőrült)

`araclar/merx-cek.py <alan-adı> <marka> <kategori-yolu> [--only id,id,…]` merxwebshop.hu altyapılı mağazanın (API yok)
kategori listesini sayfa sayfa okur (`list.json`), seçilen ürünlerin sayfalarından marka, ad, fiyat, boyutlar, koku
ailesi (Illatcsalád), açıklama ve koku piramidini (Fej / Szív / Alap ya da "Illatjegyek") alır; açıklamaya gömülü
TikTok videosunun artıkları (@hesap, #etiket, video başlığı) atılır. Çıktı Shopify biçiminde, sayfalar `pages/`
önbelleğinde. Aktarımda `"platform": "merx"`: sepetteki tek ürün mağazadaki sayfasını açar. Arka etikette notalar
`merx-raw.json`'dan, başlık `"foto": {"backHead": "ILLATJEGYEK"}`.

**Başka dilde arayüz:** metinler `ui.en` yuvasına o dilde yazılır (`langs: ["en"]`), `htmlLang: "hu"` sayfanın dilini
verir; koku bulucunun metinleri ve soruları `ui.<dil>.finder` (`{eyebrow, title, lead, …, questions}`), kaide yazısı
`ui.onPlinth`, keşif seti `ui.discoveryUi`. Koku bulucu Macarca nota adlarını ve ürünün koku ailesini de tanır.
Çok markalı mağazada `theme.cardFamily: true` koleksiyon kartlarında kategori yerine markayı (ürün ailesi) yazar.

Beyaz etiketli şeffaf şişelerde yapay zekâ kesimi etiketin beyazını delebilir: `"foto": {"convex": 0.3}` gövdenin
silüetini doldurur (kapak bölgesine dokunmaz). Renkli cam şişelerde `"glassBack": {"label": [...], "brand": "..."}`
arka yüzü ön yüzün aynası yapar, etiketin yerine markanın stilinde arka etiket çizer.

**Ana sayfa akışı 4 ürün:** kurallarda `home` yoksa 3B akışta ilk 4 ürün gösterilir; 4 üründen sonra sayfa alt
bölümlere geçer. Diğer ürünler koleksiyonda ve alt bölümlerin sahnesinde görünür.

**Alt bölümler 3B vitrinin devamı** (`ui/Epilogue.jsx`, ferah sahne ve butikte varsayılan; `theme.epilogue: false`
kapatır): hikâye, satış noktaları, SSS ve iletişimin arkasında ekrana sabit bir oda var: ürün renginde duvar, ipek
ışıklar, parlak zemin, fildişi kaide. Her bölümde kaideye başka bir ürün iner (önce ana sayfada gösterilmeyenler);
bölüm değişince şişe sağa uçarak çıkar, yenisi soldan süzülüp iner, duvar onun rengine döner. Şişe hep sağda, içerik solda cam kartlarda.

**Ses** (`sound.js`, dosyasız, Web Audio): yalnızca "Parfümü sık" (kapak tıkı, buğu fısıltısı). Geçiş hışırtısı,
kaideye iniş tınısı ve ortam tonu hazır ama kapalı: `content.sceneSounds: true` açar (üst menüde ses düğmesi de gelir).
`content.sound: false` bütün sesi kapatır. Tanı için adrese `?sounddebug`.

**Nota malzemeleri** (`araclar/garnish.py`, `src/Garnish.jsx`): markanın malzemeli ürün fotoğrafından
(`"foto": {"garnish": [["regex", n]]}`, n: ürünün kaçıncı görseli) şişe çıkarılır, iki yandaki çiçek/meyve/baharat
saydam katman olarak kesilir. 3B sahnede şişe kaideye oturunca (açılışta inerken) iki yandan, kameraya yakından
dönerek sırayla gelip yerine oturur; kaydırınca kaydırmaya bağlı olarak dışarı ve kameraya doğru açılıp kaybolur; koleksiyon kartlarında da görünür. `shopify-foto.py` sonrası çalıştırılır.

**Koku bulucu** (`ui/Finder.jsx`, notası olan en az 3 üründe açık; `content.finder: false` kapatır,
`{"categories": [...]}` öneriyi o kategorilerle sınırlar): üç soru; cevaplar koku ailelerine (ferah, çiçeksi, tatlı,
sıcak) ağırlık verir, her ürünün ailesi kendi notalarından (Türkçe/İngilizce nota adları) hesaplanır. Sonuç kendi
renginde kaideye yukarıdan iner, notaları süzülür; iki alternatif, sepete ekle ve "Kokuyu keşfet" (3B vitrinde açar).
Üst menüde ve açılır menüde "Koku bulucu".

**Sinematik açılış** (`theme.opening`, ferah sahnede varsayılan; oturumun ilk açılışında, `?shot` adresinde yok):
yüklenirken karanlıkta logo ve altın çizgi; yüklenince altın ışık logonun üstünden geçer, slogan belirir, perde
ortadan dairesel açılır, ilk şişe yukarıdan kaideye iner (inişte ışık patlaması ve duman), ardından notalar gelir.

**Keşif seti bandı** (`araclar/kesif-seti.py`, `ui/Discovery.jsx`; kurallar → `foto`dışında `"kesif"` ve aktar →
`"discovery"`): setin fotoğrafındaki büyük kutu ve önündeki küçük koku kutuları ayrı katmanlara kesilir (kutuların
yatay aralıkları, sıra yüksekliği ve büyük kutunun alanı kurallarda). Sitede büyük kutu kaidede belirir, üzerinden
altın ışık geçer, küçük kutular sırayla yükselip dizilir; üzerine gelince kokunun adı, tıklayınca o koku. Set katalogda
da ürün olur (sepete eklenir).

**Premium kaide ve tepe ışığı** (ferah sahnede varsayılan; `theme.plinthStyle: "classic"` eskisi): kalın, damarlı
cilalı mermer disk (üst ve alt kenarı altın), altında içeri çekik boşluktan sızan ışık, ince koyu ayak; tepeden inen
ışık huzmesi (yalnızca arka iç yüzü: şişenin önünü puslandırmaz) ve kaidede ışık havuzu. Ortadaki ürün çarpımsal
tepe ışığıyla aydınlanır (`u_key`: renk ve yazı kontrastı korunur), yanlar loşlaşır.

**Sahne kartları** (ferah sahnede varsayılan; `theme.cards: "gallery-dark"` eski karanlık sergi): koleksiyonda her
ürün 3B vitrinin küçük kopyasında: ürün renginde duvar, ipek ışık, parlak zemin, fildişi kaide, şişe ve notalar.

**Opak, önü illüstrasyonlu şişeler (Mes Bisous):** `"foto": {"backSolid": "."}` arka yüzü gövdenin düz renginde
(boyun altındaki omuz bandından) çizer; arka etikete kokunun şiiri ve notaları yazılır (WooCommerce kısa açıklaması).
`"neckAt": [["regex", 0.22]]` boynu elle verir (koyu şişede kapak halkası gövdeye karışınca).

**Malzemeli ürün fotoğrafları (Royal Platinum):** şişenin yanında meyve, çiçek, yazı ya da şerit varsa
`"foto": {"parts": [["^handle$", [[x0, y0, x1, y1], ...]]]}` ana fotoğrafta yalnızca bu kutuları (fotoğrafa oranla;
kapak ve gövde ayrı kutu) ürün sayar, dışını zemin rengine boyar. `"badges": "regex"` kırmızı "YENİ" rozetlerini siler
(şişenin üstüne binen kısmı şişenin simetrik öbür yanından kopyalanır). `"convexOnly": "regex"` dışbükey dolguyu
yalnızca şişelere uygular (çubuklu difüzör ve tetikli spreyin girintileri dolmasın). Mağazanın yalnızca Türkçe
olduğu markalarda marka dosyasına `"langs": ["tr"]` yazılır: dil düğmesi gizlenir.

**Ferah sahne** (`theme.fresh: true`, `theme.plinthColor`): fotoğraf yerine her kokunun kendi renginde aydınlık fon,
şişenin arkasında hale, yavaşça akan ipek dalgalar ve fonu yansıtan parlak zemin (BackgroundMaterial → `u_fresh`).
Renkler kurallar → `palette` ([regex, orta, açık, koyu]); fotoğraftan çıkan renk altın etikete kayıyorsa şişenin
rengine bakarak elle seçilir (Régalien). Kaide açık renkli ve cilalı.

## Online satışı olmayan markalar: vitrin modu (Joure)

Marka mağaza/bayi ağıyla satıyor, sitesinde fiyat ve sepet yoksa marka dosyasında
`"commerce": {"showcase": {"href": "https://wa.me/90…?text={text}", "message": {"tr": "Merhaba, JOURE {0} hakkında…", "en": "…"}}}`.
Fiyatlar gösterilmez (`t.money` boş, `t.tagPrice` yalnızca hacim), sepet düğmesi ve paket bölümü kalkar; kartlardaki,
detaydaki ve koku bulucudaki düğme (`ui.addToCart`, `ui.finder.add`: "WhatsApp'tan sor") ürünün adıyla markanın hattını açar.
Ürün verisi fiyatsız (`"price": "0"`) `products-tr/en.json` olarak yazılır, `"platform": "merx"` ile aktarılır.

Aynı şişeyle satılan seriler (Çakır'ın taç kapaklı şişesi, Joure NO Serisi): her ürüne aynı fotoğraf verilir, sahne rengi
(`palette`) kokunun karakterinden seçilir. Yaşam tarzı fotoğrafında şişe önce kırpılır (çevresindeki kutu ve çiçek kesime
girmesin); kapağın zemine yakın renkli bölümleri (taçtaki siyah mine) `solidTop` ile dolu kalır. Şeffaf cam tabanı
yansıma sanılıp kesiliyorsa `"pedestal": true` ve `"convex": 0.22`.

Vitrin modunda Mağaza bölümü yoktur; Ritüel yine çalışır (ürün Ritüel'de sağda kendi adımında döner) ve 3B sahne
Ritüel bitince kaybolur (`scroll.js`). Kategori sayfalarında Ritüel de yoktur.

## Henüz satışta olmayan ürün: render edilmiş kutular ve şehir sahneleri (Turkish Coffee Lady)

Ürünün fotoğrafı yoksa (yeni seri, yalnızca duyuru görseli var) kutu markanın kendi çizimlerinden yeniden çizilip
render edilir ve hatta fotoğraf gibi girer (`markalar/turkishcoffeelady-kaynak/README.md`). Her ürünün kendi sahnesi
(`foto/fon/fon.json`: şehir çizimi + taş kaide) ana sayfada ve detayda ürünün arkasında durur.

- `theme.carousel: "glide"` + sahne: ürün sağda Osmanlı kemerinin içinde, solda başlık; komşu ürün yalnızca geçişte.
- `theme.petals: false`: sahneli üründe süzülen yapraklar kapanır (içecek markası); kaidenin arkasındaki duman kalır.
- `aktar.gallery: false`: ürün detayında fotoğraf galerisi gösterilmez (render ön/arka görselleri 3B ürünün aynısı);
  panel kısalır, vitrin düğmesi ekrana sığar.
- `content.finder.keys`: tat bulucunun aileleri (`warm`, `sweet`, `fresh`, `floral`) markanın kendi sözcükleriyle
  genişler (ör. `"fresh": ["mint", "nane", "cardamom"]`); parfüm notası olmayan ürünler için.
- `foto.backAt: [["regex", n]]`: arka yüz olarak ürünün n. görseli (otomatik eşleştirme yerine; render edilmiş ön/arka çiftleri).
- **3B sergi görselleri** (`fon/fon.json` → `exhibit`, `wall`; aktarım bunları `catalog.items[]`'a yazar): ürün premium
  kaidesiyle birlikte render edilmiş şeffaf görsel ve ürünün sahne duvarı. Tat bulucu ve alt bölümler (`theme.epilogue: true`)
  CSS kaide yerine bunları kullanır; ürün kaidenin tam üstündedir, duvar ürünün şehri olur. `theme.plinthImage`: tat
  bulucunun boş hâlindeki kaide (sergi görselleriyle aynı çerçevede kırpılır).
- Koleksiyon kartı: `<marka>-foto/sahne/<handle>.webp` (3:4) ürün, kaide ve şehir fonuyla sinematik render
  (`turkishcoffeelady-kaynak/render/sergi.html`, kip `card` + `grade.py`).
- Ritüeldeki dev kontur yazı (`ritual[].stat`) sağ yarıyla sınırlıdır; kısa tutulur ("Aralık", "500", "8 şehir").

## Şişe dokusu onarımı (foto-onar.py)

Arka plan silme şeffaf camın içini (cam taban, boyun halkası) bazen zemin sanıp siler; 3B şişe kopuk görünür
(kapak havada, tabanda çentik). `foto-onar.py <marka> [ürün …]` atlasın iki yüzünde silüetin içindeki delikleri
çevredeki camla doldurur, profili yeniden çıkarır, yassı şişede boyunu gövdenin başladığı satıra alır (kapak ve
boyun halkası birlikte döner, omuz köşeli) ve kalınlık yüzlerinin rengini camdan alır. Sonra `shopify-aktar.py`
ve `yeni-demo.py` yeniden çalıştırılır.

## Koku bulucuya iniş

Koku bulucu CSS kaideli olduğunda (sergi görseli yoksa) Ritüel'deki 3B şişe kaydırdıkça aşağıdaki kutunun kaidesine
iner ve bölümle birlikte kayar. Bölüm ekrandayken (`html.finder-seat`) 3B sahne odanın önüne, soru kartının arkasına
alınır; fon bölümün üst kenarında biter. Sonuç seçilince şişe kalkar ve sonucun görseli kendi renginde iner; "Baştan
başla" şişeyi geri getirir.

## Marka kumaşı (ThreeUI "Woven Cloth")

`theme.cloth` verilirse ana sayfada Marquee ile Hakkımızda arasında tam genişlik bir bant çıkar: fizikle
dalgalanan ipek, üzerinde markanın adı dokunmuş (ThreeUI Community, MIT: `hope-demo/src/vendor/threeui/`,
`ui/BrandCloth.jsx`). Kendi WebGL bağlamı olan bir iframe; ekrana yaklaşınca açılır, uzaklaşınca kapanır.

```json
"cloth": { "mono": "S", "sub": "P A R F U M S", "l1": "SHAURAN", "l2": "PARIS", "tag": "E A U   D E   P A R F U M",
           "bg": "#0c0807", "sheen": "#f6cfb0", "filter": "sepia(0.85) saturate(1.25) hue-rotate(-14deg)",
           "caption": { "tr": "Varlıkların ruhu kokularıdır.", "en": "The soul of the beings is their smell." } }
```
`filter` kumaşın gökkuşağı yanardönerini markanın rengine çeker (yoksa mor-yeşil ipek). Uzun ad tek satıra sığdırılır.

## Nota piramidi (katman katman açılan şişe)

`theme.pyramid: true` → ana sayfada Ritüel'den sonra uzun bir bölüm (`ui/NotePyramid.jsx`). Kaydırdıkça şişe dört
dilime ayrılır: kapak (ad + koku ailesi), üst, kalp ve dip notalar; dilimler arasında markanın vurgu renginde halka,
her dilimin yanında notaları. Bölüm sonunda şişe yeniden birleşir; alttaki düğmelerle ana sayfadaki diğer kokulara
geçilir. Notalar ürünün `composition` satırlarından ("Üst: …", "Kalp: …", "Dip: …"; aktarım kuralları → `library`),
yoksa `notes` üçe bölünür. Şişe dört kez çizilir, her kopya kesme düzlemleriyle (clipping) yalnızca kendi dilimini
gösterir. Telefonda şişe solda, etiketler sağında.

## Lüks arayüz (`theme.lux`)

`"lux": true` → arayüz 3B sahneyle aynı kalitede (css/base.css → `html.lux`): ana düğme (`.pill`) dövme altın
(üstte parlak bant, ortada koyu kuşak, kazınmış yazı, üzerine gelince ışık süpürür); ikincil düğmeler (Kokuyu
keşfet, Sepete ekle kartta, nota piramidi seçimleri…) altın degrade kenarlı koyu cam, köşelerde altın köşebent;
simge düğmeleri altın halkalı koyu cam; büyük başlıklar fildişiden altına metal degrade (her harf ayrı canlandığı
için degrade harfe uygulanır, bölünmemiş başlıklar düz fildişi); etiketlerde elmas işaret, sayaç altın. İlk: Reinvented
(kemerli "glide", Cinzel/Cormorant).
