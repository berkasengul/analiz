# MTG MOTORS — Araca Özel Koleksiyon Odaları

Önceki sürümde yedi araç salonunun hepsi aynı Signature Gallery odasıydı (grafit mermer, ceviz çıta, bronz).
Bu sürümde her araç kendi karakterine göre tasarlanmış ayrı bir koleksiyon odasında sergileniyor.
Odalar yine aynı MTG MOTORS ailesine ait.

## Ortak marka dili (tüm odalarda aynı)

- **Marka duvarı:** Arka duvarda 3B harflerle MTG | MOTORS ve altında PRIVATE COLLECTION yazısı var.
- **Ortak plan:** Sergileme alanı, private vault (camlı raf bölmesi), dijital ilan ekranı ve gizli LED derzler her odada aynı yerde.
- **Cam geçişler:** Kamera turu, araç yerleşimi ve odalar arası cam geçişler değişmedi.
- **Arayüz:** Sağ bilgi paneli, üst menü, alt araç menüsü, 360° inceleme ve ekspertiz raporu aynen korunuyor.

## Odalar

| Oda | Araç | Zemin | Duvar / detay | Tavan | Lounge | Işık |
|---|---|---|---|---|---|---|
| Sport Coupé Collection | BMW 420i | Grafit mermer, siyah-altın Portoro sergileme alanı | Portoro mermer marka duvarı, kömür sıva, ceviz çıta, altın | Stüdyo ışık paneli + 2 ışık kanalı | Siyah deri kanepe, konyak koltuklar | Dramatik, sıcak; düşük ortam ışığı |
| Explorer SUV Lounge | Ford Kuga | Koyu arduvaz, Emperador mermer sergileme alanı | Emperador (kahve) mermer marka duvarı, toprak sıva, koyu meşe paneller, koyu bronz | Koyu meşe kirişler + ışık paneli | Konyak deri kanepe, bitki kasaları | Güçlü ve sıcak |
| Urban Collection | VW Golf | Koyu gri porselen, yeşil mermer sergileme alanı | Orman yeşili mermer marka duvarı, yeşil sıva, siyah meşe nervürler, pirinç | Enine lineer ışık hatları | Koyu yeşil-gri kadife kanepe, modern koltuk, lineer sarkıt | Nötr-sıcak, derin |
| Dynamic City Collection | SEAT Ateca | Koyu beton | Antrasit taş, terracotta zemin üstünde bakır kanatlar | Çapraz geometrik LED şeritler | Terracotta kanepe, modern koltuk | Nötr-serin, bakır vurgu |
| Compact Studio | Opel Corsa | Sıcak grafit porselen, bordo mermer yuvarlak platform | Bordo mermer marka duvarı, bordo sıva, bordo deri duvar panelleri, rose-gold | Aracın üstünde ışık halkası | Kompakt: üç modern koltuk, yuvarlak sehpa | Sıcak, butik |
| Executive Lounge | Mercedes E 180 | Nero Marquina (siyah-beyaz damarlı) mermer, yuvarlak platform | Nero Marquina marka duvarı, grafit traverten yivli duvar, altın | Kasetli tavan + yumuşak panel | Krem deri kanepe, altın halka avize | Yumuşak, zarif, kontrastlı |
| Executive Sedan Gallery | BMW 320i | Antrasit taş, lacivert mermer sergileme alanı | Mavi-gri sıva, çelik kanatlar, lacivert mermer marka duvarı | Boyuna ışık bıçakları + çerçeve | Lacivert kadife kanepe, lineer sarkıt | Serin ve keskin |

Son oda olan MTG Lounge, ortak Signature dilinde kalıyor (turun kapanışı).

### 2. tur: tüm odalar koyu premium dilde

Seat (Dynamic) ve BMW 320i (Sedan) odaları referans alındı: koyu zemin, damarlı taş marka duvarı, düşük ortam ışığı, sıcak vurgu ışıkları.
Diğer beş oda bu seviyeye çıkarıldı; her biri kendi taşı ve rengiyle ayrışıyor (Portoro, Emperador, yeşil mermer, bordo mermer, Nero Marquina).
- **Yeni duvar detayları:** Golf'te geniş aralıklı siyah meşe nervürler (`ribs`), Corsa'da bordo deri duvar panelleri (`panels`).
- **Medya duvarı:** Her salonun sağ duvarında, tema taşından yüzen panel üstünde ince bir TV var.
  TV o salondaki aracın sinematik filmini oynatır.
  - Araç sahnede ikinci bir kamerayla canlı çekilir: ön 3/4 yaklaşma, yan profil kaydırma, jant yakın planı, arka 3/4 vinç, üstten yörünge ve far detayı.
  - Görüntüde sinema bantları ve MTG MOTORS imzası var.
  - `CARS[].video` alanına bir mp4/webm yolu yazılırsa canlı çekim yerine o video oynatılır.
  - Yalnız kameranın bulunduğu salonun TV'si ve yalnız ekran kadrajdayken çizilir (masaüstü ~30 kare/sn, mobil ~12).
- **Marka yazısı:** MTG | MOTORS ve PRIVATE COLLECTION artık sitede, Cinzel fontunun konturlarından üretiliyor.
  - Harfler pahlı metal: ön yüz fırçalanmış, kenarlar cilalı.
  - Duvarda yumuşak gölge ve tema rengiyle arkadan aydınlatma var.
  - Fırında yazı gölgesi yok; harf geometrisi bozulmuyor (eski sürümde E harfinin kolları eksikti).
  - Alan derinliği efekti aracın arkasındaki salonu (marka duvarı dahil) keskin bırakır.

## Geçiş deneyimi

- **Kamera:** Komşu odaya cam geçişten girilir; karşı sıradaki odaya cam vitrinden çıkılıp girilir.
- **Başlık:** Geçişin ortasında ekranın üstünde "Koleksiyon 04 / 07 — Dynamic City Collection" yazısı belirip kaybolur.
  Alt menüde de girilen odanın adı görünür.
- **Işık:** Araç ışıklarının rengi, yoğunluğu ve sahne pozlaması yeni odanın temasına yumuşakça geçer.
  Örneğin sport odada sıcak ve dramatik, sedan odada serin ışık var.
- **Kadraj:** Kamera gövde tipine göre ayarlanır.
  - Coupe: daha alçak ve yakın.
  - SUV: daha yüksek ve geniş.
  - Hatchback: hafif yüksek.
  - Sedan: göz hizası.

  Bunun üstüne aracın boyutuna göre otomatik mesafe ayarı yapılır.

## Teknik yapı (modüler)

- **Blender:** `tools/blender/mtg_room.py --variant signature --theme <ad>`.
  - `THEMES` tablosu her oda için zemini, duvarı, marka duvarını, duvar detayını, tavan kurgusunu, sergileme alanını, lounge mobilyasını ve ışık karakterini tanımlar.
  - Duvar detayı tipleri: slats, planks, fins, blades, fluted.
  - Tavan tipleri: softbox, beams, linear, geo, halo, coffer, blades.
  - Mimari plan ortaktır; her tema ayrı fırınlanır (lightmap) ve `models/rooms/room_<tema>.glb` olarak kaydedilir.
- **Dokular:** Mevcut doku kütüphanesinden renk türetilerek üretilir (`tools/make_theme_textures.py`, `tools/make_marble.py`).
  Pürüzlülük ve normal haritaları kaynak dokudan aynen gelir.
- **Web için sıkıştırma:** `tools/room_pack` (meshopt).
  Düğüm adları, çapalar ve lightmap UV'leri korunur.
  Örnek: oda GLB'si 7.4 MB'tan 3.0 MB'a iner.
- **Site:**
  - `CARS[].room` aracın odasını seçer; `ROOM_THEMES` harf rengini, ışık renklerini, pozlamayı ve zemin yansımasını belirler.
  - Eksik bir tema dosyası olursa Sport odası kullanılır.
  - Aynı doku birden fazla odada gömülüyse GPU'ya tek kopya yüklenir.
  - Mobilde lightmap'ler yarı çözünürlükte yüklenir.
  - `file://` ile açılışta her oda kendi `room_<tema>.js` dosyasından yüklenir; eski tek `rooms.js` kaldırıldı.

## Önce / sonra

Ölçümler yazılım tabanlı GPU (swiftshader) üzerinde, test modunda alındı (`__perf`).
Gerçek cihazdaki kare hızı daha yüksektir; burada iki sürüm aynı koşulda karşılaştırılıyor.

| | Önce (tek tip oda) | Sonra (7 koleksiyon odası) |
|---|---|---|
| Farklı oda tasarımı | 1 | 7 (+ lounge) |
| İlk açılışta indirilen veri | 39 MB | 45 MB |
| Draw call (masaüstü, BMW salonu) | 346 | 341 |
| Üçgen (masaüstü) | 636 bin | 683 bin |
| Draw call / üçgen (mobil) | 195 / 218 bin | 183 / 224 bin |
| GPU doku sayısı (masaüstü) | 141 | 245 |
| JS bellek (masaüstü) | 169 MB | 223 MB |
| Hazır olma süresi (swiftshader, masaüstü) | 45 sn | 40 sn |

İndirilen veri ve doku sayısı arttı, çünkü her odanın kendi malzemesi ve lightmap'i var.
Bunu dengelemek için:
- Oda, lounge, resepsiyon ve cephe dosyaları meshopt ile sıkıştırıldı (toplam yaklaşık 10 MB kazanç).
- Odalar arasında ortak dokular tekilleştirildi.
- Mobilde lightmap'ler yarı çözünürlükte yükleniyor.

Draw call sayısı aynı kaldı, üçgen sayısı %7 arttı (tavan kirişleri, kanatlar, yivler).

## Bilinen eksikler

- **Eksik araç modelleri:** Seat Ateca, Opel Corsa, Mercedes E 180 ve BMW 320i'nin 3D modelleri depoda yok.
  Bu odalarda örtülü araç gösteriliyor.
  Modeller eklenince `CARS[].glb` alanına yazılması yeterli; oda temaları hazır.
- **Ekspertiz verisi:** Örnek ekspertiz verisi yalnız BMW 420i'de var (`ornek: true`).
  Gerçek raporlar ilan sahibinden alınıp eklenmelidir.

## Kamera hareketleri ve giriş akışı (güncelleme)

**Önceki sorunlar:**
- **Hız:** İlk kaydırmada kamera dış cepheden BMW salonuna kadar yaklaşık 60 metreyi tek hamlede, en fazla 8,5 saniyede geçiyordu. Ortalama hız 7 m/sn, tepe hız yaklaşık 13 m/sn'ydi.
- **Açılış:** Kuş bakışı bir açıydı; maket hissi veriyor, düz çatı kadrajın büyük kısmını kaplıyordu.

**Yeni sistem:**
- **Yeni duraklar:** Kapı önünde "varış" durağı (kapılar açılır, camdan koridor görünür) ve resepsiyonda karşılama durağı eklendi.
- **Hız sınırı:** Her geçişin süresi üç ölçüden büyük olanına göre hesaplanır: yol uzunluğu, bakış dönüşü ve bölge hızı.
  - Dışarıdan kapıya: ortalama 2,5 m/sn.
  - Kapıdan resepsiyona: 1,5 m/sn.
  - Koridor ve salonlar: 1,9 m/sn.
  - Dönüş: en fazla ortalama 22°/sn.

  Geçişlerin tepe hızı artık 4,7 m/sn'nin altında.
- **Yumuşak geçiş:** Hareket smootherstep eğrisiyle yapılır; başta ve sonda hız ve ivme sıfırdır, bu yüzden ani kalkış ve fren hissi olmaz.
- **Açılış kadrajı:** Kamera karşı kaldırımda, göz hizasında. Giriş ve tabela sağda, başlık solda gökyüzünün üstünde, ıslak yol önde.
- **Açılışta dolly:** Açılış sahnesinde kamera çok yavaş ilerler (30 saniyede yaklaşık 1,6 m); kullanıcı kaydırınca 1,6 saniyede yumuşakça bırakılır.
- **Cephe camı:** Gece ortamı bir kez küp kamerayla çekilir; cam şehri, sokak lambalarını ve babaları yansıtır. Camın yüzey rengi koyu ve hafif bronz tonlu olduğu için iç mekân ve araçlar camdan net okunur.

## Performans: HD ve Akıcı mod

Sol alttaki düğme iki mod arasında geçiş yapar; seçim tarayıcıda hatırlanır.
- **HD:** Tüm efektler açık (alan derinliği, parlama, zemin ve yol yansıması, TV'de canlı araç çekimi).
- **Akıcı:** Efekt zinciri yerine doğrudan çizim (donanım kenar yumuşatma açık), yansımalar kapalı, TV'de sabit afiş, çözünürlük 1x.
  Sahne her karede yalnız bir kez çizilir.
- **Otomatik seçim:** Dahili / zayıf ekran kartında (Intel UHD/Iris, AMD Radeon Graphics, GeForce MX vb.) site Akıcı modda açılır.
  HD'de en düşük çözünürlükte bile kareler ağır kalırsa (~22 fps altı) Akıcı moda kendiliğinden geçer ve kısa bir bildirim gösterir.
- **Tanı:** Adresin sonuna `#fps` eklenirse sol üstte kare hızı, en yavaş kare, mod ve ekran kartı adı görünür.
- **Doku belleği:** Oda dokuları 1024 px ile sınırlı (`tools/room_pack/tex_limit.mjs`); masaüstünde duvar/tavan lightmap'leri yarı çözünürlükte.

## Brütalist galeri (varsayılan düzen)

Site artık varsayılan olarak tek hacimli brütalist beton galeriyle açılır; önceki tema odaları adrese `#rooms` eklenerek açılır.

- **Mimari** (`tools/blender/mtg_brutal.py`): lobi (h 4.8 m) → 1.2 m kalın geçiş duvarında bronz çerçeveli portal → 12 m yüksekliğinde salon.
  Tavanda 6.5 m arayla kirişler, ortada ışıklık yarığı, sonda büyük ışıklık; duvarlarda derz ve gölge boşlukları, modül sınırlarında dikey LED çizgileri.
  Işık Blender'da pişirilir (zemin / duvar / tavan lightmap'leri); sitede yansıma kamerası ve ağır post-process yok.
- **Araçlar**: her araç zeminde ince ışık halkasının üzerinde. Tur sırası, ilan bilgileri, 360° inceleme, ekspertiz ve galeri değişmedi.
- **Kamera durakları** (araç başına): kahraman → yakın → detay; araçlar arasında koridora geri çekilip sonraki araca süzülme; final: marka duvarına genel bakış.
- **Araç şeridi** (`#car-strip`): alttaki küçük resimli kartlar (görsel sahneden çekilir) aracın kahraman karesine götürür. Mobilde yalnız küçük resimler gösterilir.
- **Marka duvarı**: arka duvarda koyu bronz 3B harfler (MTG | MOTORS · PRIVATE COLLECTION).
- **Dış cephe ve giriş**: korunur. Eski cephenin çatısı ve iç duvar yüzleri galerinin içinde kaldığı için yalnız bu düzende çizilmez.
