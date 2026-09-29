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

`"glide"` (Attar al Has): şişe altın çizgili bir Osmanlı kemerinin (sivri kemerli niş, tepede alem) içinde,
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
