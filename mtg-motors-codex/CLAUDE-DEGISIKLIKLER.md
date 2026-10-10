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

---

# Dördüncü güncelleme: premium, fotogerçekçi showroom

## Analiz: önceki sahnenin zayıf noktaları
1. **Mobilya:** Prosedürel kutu kanepe ve küre parçası "kabuk" koltuklar oyun objesi gibi duruyordu. `planter_box_02` (ahşap sandık) showroom'a uymuyordu.
2. **Duvarlar:** Oda başına değişen mor perde, spiral poster, neon ekran ve renkli halılar fuar standı hissi veriyordu.
3. **Işık:** Halka lamba ince bir çember gibiydi, koyu tavandaki nokta spotlar yıldız gibiydi. Işık düzdü ve temas gölgesi zayıftı.
4. **Zemin:** Yansıma yoktu; halılar kalınlıksız düz dairelerdi.
5. **Mimari detay:** Panel derzi, gölge boşluğu, gömme tavan kasası yoktu; odalar boş kutu gibiydi.
6. **Mekân içi bilgi:** Dijital ekran ya da marka paneli yoktu.

## Yeni düzen (her odada aynı sakin malzeme dili)
- **Zemin:** 1,2 × 1,2 m büyük ebat açık gri taş/cilalı beton, derzler dokuda (`textures/showroom_floor`). Tek bir
  `Reflector` bütün binanın zeminini kapsıyor; zemin %93 opak katman olarak üstünde. Bu katman masaüstünde açık, mobilde kapalı.
- **Duvarlar:** sıcak açık gri mikro çimento (`textures/microcement`). Aracın arkası 1,2 × 2,4 m traverten paneller (`textures/travertine_panel`).
  Zemin ve tavan birleşimlerinde siyah gölge boşlukları var.
- **Tavan:** antrasit. Aracın üstünde 7,2 × 4,2 m gömme ışık kasası (difüzör + alan ışığı), iki paralel lineer LED hattı ve traverten duvarı yalayan gizli LED.
- **Sergi alanı:** araç doğrudan cilalı zeminde; zemine gömülü ince fırçalanmış metal halka sergi alanını tanımlıyor.
- **Oturma köşesi (sağ arka):** siyah profilli cam bölme, arkasında füme ceviz panel. Önünde alçak modüler kanepe (2,6 m, oturum 0,42 m), Eames tarzı lounge koltuğu (Poly Haven modeli), traverten blok sehpa (0,9 × 0,9 × 0,35 m) ve seramik vazo. Üstünde lineer sarkıt lamba.
- **Dijital bilgi totemi:** 0,6 × 1,9 m siyah cam; marka, model, yıl, km, renk, ilan no ve fiyat gösteriyor.
- **Marka paneli:** traverten duvarda, arkadan aydınlatmalı koyu bronz MTG | MOTORS paneli.
- **Bitkiler:** taş (mikro çimento) silindir saksılarda büyük bitkiler.
- **Lounge (son oda):** aynı malzemeler, büyük marka paneli, kanepe ve iki lounge koltuğu, traverten banko ve bar tabureleri.

## Kaldırılanlar
Kutu kanepe, kabuk koltuklar, ahşap sandık, posterler/sanat panoları, perdeler, renkli halılar, halka lambalar,
nokta spot ızgarası, koni sarkıtlar, beton kolon ve kahve arabası.

## Dosyalar
- `textures/`: `showroom_floor`, `microcement`, `travertine_panel` (CC0 kaynaklardan üretildi: ambientCG Travertine009,
  Poly Haven plaster_grey_04), `smoked_walnut_veneer`, `velour_velvet`, `granite_tile_03`, `stone_tile_wall`.
- `models/decor/`: yalnızca `potted_plant_02`, `mid_century_lounge_chair`, `ceramic_vase_01`, `brass_vase_02`, `bar_chair_round_01`.
