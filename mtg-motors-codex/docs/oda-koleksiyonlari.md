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
| Sport Coupé Collection | BMW 420i | Grafit mermer, cilalı sergileme alanı | Füme mermer marka duvarı, ceviz çıta, şampanya | Stüdyo ışık paneli + 2 ışık kanalı | Siyah deri kanepe, konyak koltuklar | Dramatik, sıcak; düşük ortam ışığı |
| Explorer SUV Lounge | Ford Kuga | Kum rengi taş (büyük kare plaka) | Doğal koyu taş, geniş koyu meşe paneller, koyu bronz | Koyu meşe kirişler + ışık paneli | Konyak deri kanepe, bitki kasaları | Güçlü ve sıcak |
| Urban Collection | VW Golf | Orta gri porselen | Açık sıva, açık meşe çıta, çelik | Enine lineer ışık hatları | Gri kumaş kanepe, modern koltuk, ahşap sehpa | Nötr ve temiz |
| Dynamic City Collection | SEAT Ateca | Koyu beton | Antrasit taş, terracotta zemin üstünde bakır kanatlar | Çapraz geometrik LED şeritler | Terracotta kanepe, modern koltuk | Nötr-serin, bakır vurgu |
| Compact Studio | Opel Corsa | Açık sıcak gri porselen (küçük plaka) | Traverten, geniş açık meşe paneller | Aracın üstünde ışık halkası | Kompakt: üç modern koltuk, yuvarlak sehpa | Aydınlık ve ferah |
| Executive Lounge | Mercedes E 180 | Fildişi mermer, yuvarlak platform | Fildişi traverten yivli duvar, pirinç | Kasetli tavan + yumuşak panel | Krem deri kanepe, pirinç halka avize | Yumuşak ve sakin |
| Executive Sedan Gallery | BMW 320i | Antrasit taş, lacivert mermer sergileme alanı | Mavi-gri sıva, çelik kanatlar, lacivert mermer marka duvarı | Boyuna ışık bıçakları + çerçeve | Lacivert kadife kanepe, lineer sarkıt | Serin ve keskin |

Son oda olan MTG Lounge, ortak Signature dilinde kalıyor (turun kapanışı).

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
