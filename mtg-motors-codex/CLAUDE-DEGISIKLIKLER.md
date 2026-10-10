# Bu sürümde yapılan değişiklikler (Codex'e aktarmak için)

Codex'te düzenlenen `index.html` üzerine yapıldı. Blender salon dosyaları
(`models/web/showroom-blender.glb`, `showroom-luxury-details.glb`) ve `curated-*.glb`
dosyaları değiştirilmedi; bu klasörde yoklar, mevcut projenizdekiler kullanılır.

## Yeni dosyalar
| Dosya | İçerik |
|---|---|
| `models/web/bmw-420i-coupe.glb` | BMW 420i (G22 M430i gövdesi), meshopt, 2,2 MB |
| `models/web/vw-golf-7.glb` | VW Golf 7, meshopt, 1,5 MB |
| `models/web/ford-kuga.glb` | Ford Kuga, temizlenip statikleştirildi, meshopt, 1,8 MB |
| `models/web/extra-models.js` | Bu üç modelin base64 kopyası (`file://` ile açılış için) |

### Ford Kuga'ya yapılan temizlik
Orijinal dosya bir oyun aracı modeliydi:
- Parçaların hepsi iskelete (skin) bağlıydı. İskelet bağlama pozunda geometriye "pişirildi", iskelet kaldırıldı.
- Dosyada tek tekerlek vardı. Bu tekerlek `wheel_lf/rf/lr/rr` kemiklerine kopyalandı; sağ taraf aynalandı.
- Üst üste binen iki kaporta sürümünden biri (`bodyshell1.001`) ile birebir kopya parçalar silindi.
- Aracın önü +z'ye çevrildi. Sıkıştırmadan önce yaklaşık 300 bin üçgendi, şimdi 190 bin.

## Araç görünümleri (ilandaki gibi)
- **BMW 420i:** koyu bordo metalik, siyah jant, mavi kaliper. Kaporta normalleri yumuşatıldı (`smoothNormals`).
- **VW Golf:** beyaz, gümüş jant. Model GTI kasa: kırmızı çizgi, kaliper ve GTI rozetleri Midline'a göre karartıldı.
  Önceki eşlemede `FrontColor` boya sanılmıştı; o parça VW logosu, gerçek kaporta `Color_B06`.
- **Ford Kuga:** beyaz, Titanium jant, siyah çamurluk kaplamaları. Önceki eşlemede çamurluk kaplaması
  (`vehicle_generic_smallspecmap_PRIMARY`) boya sanılmıştı; gerçek kaporta `silver_PRIMARY`.
- Ateca ve Corsa için `curated-0/5.glb` dosyaları aynen kullanılıyor.

## Hata düzeltmesi: sıkıştırılmış modellerde geometri bozulması
`prepareCarModel` parçaları birleştirirken `applyMatrix4` çağırıyordu. Meshopt'un tam sayı (Int16)
konumlarına bu şekilde yazılınca geometri bozuluyordu. Şimdi bütün öznitelikler önce Float32'ye
çevriliyor (`toFloatAttribute`). Böylece birleştirme de çalışıyor ve konsoldaki "mergeGeometries failed" uyarıları kalktı.

## Kamera (sinematik)
- Konum yolu centripetal Catmull-Rom eğrisi; yön yaw/pitch üzerinden Catmull-Rom.
  Hız anahtar karelerde kesilmez, bakış noktası kameranın altından geçmez.
- Araç başına 3 çekim, sırasıyla:
  1. far/tampon yakın planı (FOV 32)
  2. geri çekilen açılış planı
  3. alçak yan profil

  Sağ sıradaki araçlarda sıra terstir; kamera iki araç arasında koridoru "kayarak" geçer.
- Kaydırma ataleti kritik sönümlü yay ile çalışır: yumuşak kalkış, yumuşak duruş.
- Kaydırma durunca kamera özne etrafında çok yavaş bir "steadicam" kayması yapar.
- Dönüşlerde hafif roll var; bazı karelerde hafif dutch açı.
- Araç çekimlerinde sinematik bantlar genişler; ekranda hafif film greni var.
- Yardımcı fonksiyon: `carAt(s)`. Sabit: `SHOTS_PER_CAR = 3`. Kaydırma uzunluğu: `SEG_VH = 72`.

## Atmosfer (Blender salonuyla çakışmayan katmanlar)
- Işıkta süzülen toz zerreleri.
- Araç adalarının altında hacimsel ışık huzmeleri.
- Uzakta alacakaranlık şehir silueti.
- Meydan kenarında sıcak ışıklı babalar.

---

# Oda dizisi (enfilad) düzeni — ikinci güncelleme

Araçlar artık tek salonda yan yana durmuyor. Her araç **kendi odasında** sergileniyor ve odalar
**sürgülü cam kapılarla** birbirine bağlanıyor. Kamera bir odadaki aracı gösterip sonraki kapıdan
geçiyor, bir sonraki oda kapı çerçevesinde beliriyor.

- **Tur sırası:** `TOUR = [1, 6, 3, 0, 5, 2, 4]`: BMW 420i ilk, ardından Kuga, Golf, Ateca, Corsa, Mercedes ve 320i. Son oda lounge ve kahve barı.
- **Oda ölçüsü:** `ROOM_W=14`, `ROOM_D=12`, kapı genişliği 3 m, yüksekliği 3.3 m.
- **Her odanın kendi teması var (`THEMES`):** ceviz-bronz, traverten, beton stüdyo, taş-yeşil, beyaz minimal, deri-ceviz, granit-bronz.
- **Odaların ortak öğeleri:**
  - zemin ve duvarlarda gerçek PBR dokular (renk, pürüzlülük ve normal haritası)
  - bronz derzler, gölge boşluklu süpürgelik ve LED kovesi
  - aracın üstünde gömme ışık kasası
  - arka duvarda oda numarası ve araç künyesi
  - koltuk, yan sehpa ve saksılar
- **Kamera:** her odada dört çekim (`SHOTS_PER_CAR = 4`):
  1. giriş: oda ve aracın tamamı
  2. far yakın planı
  3. alçak yan profil
  4. sonraki kapıya dönüş
- **Kapılar:** odalar arasındaki kapılar kamera yaklaşınca duvarın içine kayar (`updateRooms`).
- **Performans:** yalnızca kameranın bulunduğu odanın bir öncesi ve iki sonrası çizilir. İki alan ışığı (`RectAreaLight`) bulunulan odaya ve sonrakine taşınır; ışık sayısı sabit kaldığı için shader yeniden derlenmez.
- **Kodla çizilen bina:** dış kabuk, taş kolonlu giriş cephesi, cam saçak ve ışıklı tabela.
- **Blender salon dosyası:** `showroom-blender.glb` tek salon düzenine göre yapılmış olduğu için bu modda yüklenmiyor; `buildRooms()` onun yerini alıyor.

## Yeni varlıklar (Poly Haven, CC0)
- `textures/`: 10 PBR doku seti (marble_01, walnut_veneer, smoked_walnut_veneer, plastered_wall_04,
  stone_tile_wall, velour_velvet, brown_leather, granite_tile_03, concrete_floor_01, slab_tiles);
  WebP formatında, `textures/textures.js` içinde gömülü kopyaları var.
- `models/decor/`: 13 mobilya/bitki modeli (kanepe, koltuklar, sehpalar, saksı bitkileri, sarkıt lamba,
  bar tabureleri, kahve arabası), meshopt + WebP; `models/decor/decor.js` içinde gömülü kopyaları var.

---

# Üçüncü güncelleme: yan yana odalar, sağdan kapı, durak tabanlı gezinme

## Hata düzeltmesi: "360° İncele" yanlış aracı açıyordu
Bütün araç kartları ekranda üst üste duruyor; görünmeyenler yalnızca `opacity: 0` ile gizleniyordu.
`.btn { pointer-events: auto }` kuralı, gizli kartların düğmelerini de tıklanabilir bırakıyordu.
En üstteki (son) kart tıklamayı yakaladığı için hep başka bir araç açılıyordu.
Artık görünmeyen katmanlara `data-hidden` (`visibility: hidden`) uygulanıyor (`setOverlay`).

## Düzen
- Odalar x ekseni boyunca yan yana (`roomCX(k)`). Her odadan **sağ duvardaki** sürgülü cam kapıyla
  bir sonrakine geçiliyor. Kapı `DOOR_Z = -2.3`'te, ön cama yakın; kamera aracın önünden geçip kapıya dönüyor.
- Ölçüler: `ROOM_W = 13`, `ROOM_D = 13`, `DOOR_W = 2.6`, `DOOR_H = 3.1`. Giriş ilk odanın cephesinde
  (`ENTRANCE_X`); diğer odaların ön yüzü vitrin camı.
- **Araç sunumu (referans BMW showroom fotoğrafları gibi):**
  - araç zeminde, büyük yuvarlak halı üstünde, 3/4 önden duruyor
  - tavanda halka lamba ve/veya akustik disk, koyu tavanda spot ızgarası (bazı odalarda siyah ızgara tavan)
  - sağ arka köşede oturma grubu: kanepe, kabuk koltuklar, yuvarlak sehpa, koni sarkıt lambalar
  - arka duvarda ekran, kadife perde, sanat panosu veya bahçeye bakan pencere
  - beton kolon ve saksı bitkileri
- Temalar (`THEMES`): Galeri, Mor Lounge, Beton & Halka, Bahçe, Mavi Salon, Ceviz, Taş. Son oda MTG Lounge.

## Gezinme
- Sayfa artık kaymıyor. **Bir tekerlek hareketi, bir parmak kaydırması veya ↓ / ↑ tuşu bir durak ilerletir.**
  Duraklar sırasıyla: dış plan → her araç → lounge.
- İki durak arasındaki geçiş `easeInOut` ile oynatılır (1,4–5,2 sn); geçiş sırasında yeni girdi alınmaz.
- İlgili kod: `STOPS`, `goToStop(i)`, `step(dir)`, tween. Sağdaki araç listesi ve "Tura baştan başla" da
  `goToStop` kullanır. Test için `window.mtgGo(i)` var.
- Yalnızca bulunulan oda ve iki komşusu çizilir; dışarıdayken bütün odalar görünür.
  İki alan ışığı bulunulan ve sonraki odaya taşınır.
