# Garden Motors — dış cephe PBR güncellemesi (taslak)

`index.html`, sitenin proje klasöründeki dosyanın yerine geçer. Yeni dokular repo kökündeki `public/` klasöründedir
(`npm run assets`); sitenin klasörüne `public/` olarak kopyalanmalıdır.

Değişiklikler (yalnız dış mekân, `EXT_CFG` ayarları):
- Yol: Poly Haven `asphalt_02` (gerçek ölçek, eski nem/parlaklık korunur)
- Plaza zemini: `granite_tile` (Blender pişmiş ışığı korunur)
- Giriş saçağı / bant / bordür: `concrete_floor_worn_001`
- Doğramalar, babalar, lambalar: `blue_metal_plate` normal + pürüzlülük, koyu grafit renk
- Gece HDRI (`modern_buildings_night`): metal ve cam yansımaları (telefonda indirilmez)

Karşılaştırma görüntüleri: `D_karsilastirma_yakin.png`, `D_karsilastirma_hero.png`.

## Mimari derinlik (cephe katmanları)
Ölçüler `src/theme/facadeTheme.js` → `depth` içinde; kod `index.html` → `facadeDepth()`.

| Katman (önden arkaya) | Konum |
|---|---|
| Çatı plağı | cephe hattından 1.5 m önde, 50 cm kalın; altı ahşap, alnında LED; üstünde 60 cm parapet + metal harpuşta |
| Kolonlar | camın 25 cm önünde, zeminden çatıya kesintisiz (bant kolonların gerisinde) |
| Üst kat bandı | camın 15 cm önünde, alt kenarında 4.5 cm koyu gölge derzi |
| Doğrama | camın 5 cm önünde; cam kenarlarında 5 mm koyu silikon derz |
| Cam | z = 0.20 |
| Giriş | cam duvar yan vitrinin 80 cm gerisinde; kasa öne çıkmaz, ahşap tavan devam eder |

Bina uçları: yan cephe 3.6 m görünür derinlikte (pahlı paneller + 3 dar cam yarığı), komşu parsele 26 m koyu duvar + çıta çit.
Çatıda sönük iki mekanik ünite. Gölge: önden-soldan sokak ışığı yıkaması (3000 K), 2048 gölge haritası, normalBias .04;
statik olduğu için akıcı modda da açık (telefonda kapalı). Panel kenarları 5 mm pahlı (RoundedBox).
Yan duvarlar ve yeni yan paneller gece HDRI'sinin gök yansımasını almaz (lavanta tonu bu yansımadan geliyordu); çatı üstü koyu membran.

Önce / sonra: `screenshots/derinlik/onceSonra_1.jpg` (önden, 3/4 sağ), `_2` (giriş yakın, 3/4 sol), `_3` (yukarıdan, sağ uç).

## Dış kolonlar (`createColumn`)
Bütün dış kolonlar (iki uç + giriş portalının iki yanı) tek fonksiyondan gelir: `createColumn(width, height, depth, variant)`;
ayarlar `facadeTheme.js` → `columns`. Eski ince plaka ızgarası, kolonlardaki aplikler ve zemin ışık diskleri kaldırıldı.
- **A (varsayılan) monolit + LED girinti:** ortada 4 × 3 cm girintiyle ayrılmış iki yarı; her yarı 3 uzun plaka (4 mm derz,
  8 mm pah, plaka başına farklı doku kaydırması); structure, roughness .35 + clearcoat .4. Girinti dibinde 3000 K şerit,
  yan yüzlerinde LED'den sönen katkılı ışık gradyanı.
- **B dikey lamel:** #151617 çekirdek, önde ve yanlarda 4 cm derin 1.5 cm kalın alüminyum lameller (6 cm aralık, InstancedMesh).
- İkisinde de: 12 cm metal kaide (2 cm içeride) + 3 cm koyu gölge boşluğu; üstte saçakla arasında 3 cm gölge boşluğu;
  önde zemine gömülü halka + yukarı bakan dar spot (0.15 rad, penumbra .5, 3000 K, gölgesiz). Spot, kendi yarı açısı kadar
  yüze eğik: ışık yüze ~70 cm'den değer, yukarı doğru söner. Telefonda spotlar yok (yalnız halka).
- lil-gui → Cephe → **Kolonlar**: varyant (A/B), LED şiddeti, girinti yan ışığı, yalayan ışık, girinti genişliği.

A / B karşılaştırma: `screenshots/kolon/AB_karsilastirma.jpg`.

## Üst kat duvarı, vitrin araçları, bant dokusu
Ayarlar `facadeTheme.js` → `upper`, `display`, `band`; kod `buildUpperGallery()`, `facBandMats()`, `displayPlinth()` / `displaySpot()`.
- **Üst kat duvarı:** düz ceviz duvar yerine cilalı koyu mermer (`dark_stone`) arka plan; nişler dışında mermerin 3 cm önünde
  dikey ceviz lameller, altta ve üstte sıcak LED çizgisi ve duvara düşen yıkama. Her aracın arkasında lamel yüzünden 15 cm geride,
  metal çerçeveli niş; arkasında araçtan yukarı ve kenarlara sönen sıcak ışıma (araç silüeti öne çıkar, tabeladan sönük).
- **Araçlar:** her araca cam önü tavanından gölgesiz spot, üst ışıklar güçlendirildi; kaide tabanında geri çekilmiş ışık çizgisi
  ve zeminde yumuşak hale (araç yüzer gibi), pirinç kenar çizgisi daha belirgin.
- **Bant (tabelanın arkası):** düz boya yerine fırçalanmış koyu alüminyum kompozit (`brushed_metal` normal + pürüzlülük,
  yatay fırça izi), komşu paneller ±%6 farklı tonda.

Önce / sonra: `screenshots/ust-kat/onceSonra_ust1.jpg` (önden, 3/4), `onceSonra_ust2.jpg` (üst kat yakın, zemin vitrin).

## Dış duvarlar: taranmış PBR, dünya koordinatlı (`src/materials/worldUV.js`)
Kolonlar, yan duvarlar, parapet ve bina uçları (tabela yanındaki kompozit bant hariç) ambientCG taramalarıyla kaplıdır:
**taş Rock041 (varsayılan)**, beton Concrete029 (lil-gui seçeneği), kir maskesi Leaking005. Dokular repo kökündeki
`public/textures/wall_stone|wall_concrete|grime_mask` klasörlerindedir, sitenin `public/textures/` klasörüne kopyalanmalıdır.
Ayarlar `facadeTheme.js` → `walls`, `paving`, `lightTemp`, `whiteBalance`.

- **Triplanar örnekleme:** UV yok, doku dünya koordinatından gelir (her yüzeyde aynı ölçek, gerilme yok). Normal haritası
  "whiteout" karışımıyla dünya uzayına çevrilir. Türevler dallanmanın dışında hesaplanıp `textureGrad` ile verilir (köşelerde
  yanlış mip seçimi olmaz); doku en/boy oranı (`aspect`, Rock041 2:1) düzeltilir; anizotropi en yüksek değerde.
- **Renk:** her dokunun doğrusal ortalaması (`avg`) kayıtlı; kanal başına çarpan ortalamayı `albedo` hedefine çeker
  (duvar `#5a5652`, açık-orta gri). lil-gui'de renk seçici var.
- **Plakalama:** 120 × 300 cm plakalar, 5 mm derz; plaka başına doku kaydırması, 180° döndürme, ±%7 ton ve ±.08 pürüzlülük.
  Parapet ve saçak kenarlarının altında 70 cm'lik kir akıntısı (opaklık .4), zemine değen 25 cm'de koyulaşma.
- **Işık:** `kelvinToColor` artık Planck eğrisinin CIE 1931 yaklaşımı (eski Tanner Helland formülü aynı K'de daha turuncuydu).
  Bütün dış cephe ışıkları aynı renkten gelir: `facadeLightColor() = kelvinToColor(lightTemp 3500, whiteBalance 4700)`.
  Beyaz dengesi kamera gibi çalışır. 3500 K tek başına doğrusal uzayda (1, .57, .25) demektir ve gri taşı turuncuya boyar;
  4700 K beyaz dengesiyle ışık `#ffe1b6` olur ve taş sıcak ışık altında gri kalır (lil-gui → ışık / gök → beyaz dengesi).
- **Yalayan ışık:** kolon ve duvar dibinde gölgesiz spot; açı .3, penumbra .8, şiddet 2.2 (en parlak nokta tone mapping'de patlamaz).
- **Yaya zemini:** giriş önü kaldırım aynı taş dokusuyla, dünya ızgarasına oturan 60 × 60 cm karolar, 3 mm derz, karo başına
  ofset/ton; orta-koyu gri (`#4a4845`, giriş şeridi `#33312f`). Blender'ın pişmiş ışık haritası korunur.
- **Saksılar:** palet dışı terakota saksılar (vitrin ve resepsiyon) structure malzemesinde mat, dikdörtgen saksılarla değiştirildi.
- lil-gui → Cephe → **Duvarlar**: malzeme (taş/beton), ortalama renk, textureWorldSize, normalScale (1.5), kir opaklığı,
  yalayan ışık, plaka varyasyonu.

Teşhis (kolon, 2 m): `screenshots/duvar/teshis_ab.jpg`: uplight'lar kapalı ve nötr yan ışık altında bile kolon turuncuydu
(sebep: 3000 K cephe ışığı ve dokunun sıcak kahve ortalaması). Renk haritası tek başına net ve doğru ölçekteydi.
Önce / sonra (açılış, kapıya yarı yol, kolona 2 m): `screenshots/duvar/once_sonra_duvar.jpg`; taş / beton: `tas_beton_yeni.jpg`.
