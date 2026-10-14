# MTG MOTORS showroom: mimari geliştirme planı (1. aşama: analiz)

Hedef, konsept görseldeki ("MTG | MOTORS" traverten cephe, vitrinler, resepsiyon + koridor, camlı araç odaları)
mimari kaliteye aşamalı olarak yaklaşmak. Bu belge yalnız analiz ve plandır. Sahne geometrisi, kamera ve ışık
bu aşamada değiştirilmedi.

Tarih: 2026-10-14. İncelenen dal: `claude/nice-lamport-3x8mnt`.

---

## 0. Önce düzeltilmesi gereken varsayım: hangi sürüm "güncel"?

Brifte adı geçen yapılar (`moduleXform()`, `modLocal()`, `buildRoomFallback()`, `buildCameraRig()`,
`showcasePose()`, hub GLB'si, `tools/embed_rooms.py`, `models/rooms/rooms.js`) **çalışma kopyasında yok**.
Bunlar koridorlu "galeri kompleksi" sürümüne aittir. O sürüm, kullanıcı isteğiyle ("araçlar niye gözükmüyor,
eski stile dön") geri alındı.

| Commit | İçerik |
|---|---|
| `e94c572` | Yan yana oda dizisi + Blender odaları + sinematik kamera ("eski gerçekçi stil") |
| `1e18761` … `623c7f6` | Koridorlu kompleks: resepsiyon + 6 m koridor + 8 modül, kamera rig'i, `embed_rooms.py` |
| `4db925b` | Koridorlu kompleks geri alındı → `e94c572` ile birebir aynı duruma dönüldü |
| `0476a9e` (**HEAD**) | Modeli olmayan araçlar örtülü gövdeyle gösteriliyor |

Fonksiyon varlığı (sayılar = `index.html` içindeki geçiş sayısı):

| Fonksiyon | HEAD | 623c7f6 |
|---|---|---|
| `moduleXform`, `modLocal`, `buildCameraRig`, `showcasePose`, `buildRoomFallback` | 0 | var |
| `buildBuilding`, `glassWall`, `updateDoors`, `buildRooms`, `loadBlenderRooms`, `buildRoomGLB` | var | var |
| `buildPartition`, `buildDoorPanels` (odalar arası kapılar) | var | kullanılmıyor |

**Sonuç:** konsept görselin planı (giriş → resepsiyon → koridor → iki yanda camlı odalar) koridorlu
sürümün planıyla örtüşüyor. HEAD'deki yan yana oda dizisi bu planı karşılamıyor: resepsiyon ve koridor yok,
kapıdan doğrudan BMW odasına giriliyor. Bu belge, uygulamanın **koridorlu sürümün planı üzerine**
kurulmasını önerir. Ancak "araç görünürlüğü" sorunu (§2.1) önce çözülmelidir. Bu bir **karar noktasıdır**
(§7).

---

## 1. Mevcut yapı özeti

### 1.1 Dosya ağacı (HEAD, `mtg-motors-codex/`)

```
index.html                     tüm site (CSS + arayüz + Three.js sahnesi, ~2400 satır, tek <script type="module">)
CLAUDE-DEGISIKLIKLER.md        eski Codex aktarım notu (güncel değil, bkz. §5)
models/web/                    bmw-420i-coupe.glb, vw-golf-7.glb, ford-kuga.glb (meshopt) + extra-models.js (base64)
models/decor/                  5 Poly Haven dekor GLB'si + decor.js (base64)
models/rooms/                  room_car.glb, room_lounge.glb (+ JSON ve lightmap .webp; *_filler dahil)
textures/                      PBR dokular (webp) + textures.js
tools/blender/mtg_room.py      Blender 4.2/5.x oda üreticisi (HEAD: car/lounge, yan kapılı oda)
tools/blender/README.md        kullanım ve adlandırma sözleşmesi (HEAD düzenini anlatır)
tools/blender/previews/        Cycles önizlemeleri (v2, v3, final)
tools/blender/assets/          Cinzel yazı tipi (OFL), ekran önizleme görseli
```

Koridorlu sürümde (`623c7f6`) ayrıca `models/rooms/room_hub.*`, `models/rooms/rooms.js` (14 MB) ve
`tools/embed_rooms.py` vardır. O sürümdeki oda GLB'leri **yalnızca düşük kaliteli test bake'idir**
(256 px, 6 örnek). Tam kalite bake yarıda durduruldu.

### 1.2 Teknoloji ve başlangıç akışı

- Three.js **r160** (`cdn.jsdelivr.net/npm/three@0.160.0`, importmap). Build adımı yok.
- Kullanılan eklentiler: GLTFLoader + DRACO + Meshopt, Reflector, RectAreaLight, RoomEnvironment, RoundedBoxGeometry, BufferGeometryUtils.
- Kurulum sırası (`// ---------- Kurulum ----------`):
  1. Fontlar yüklenir.
  2. `loadCarModels()` ve `loadCarViews()` çalışır.
  3. `preloadTextures()`, `loadDecor()` ve `loadBlenderRooms()` birlikte çalışır.
  4. Sahne kurulur: `buildSky()`, `buildStreet()`, `buildBuilding()`, `buildRooms()`, `captureRoomEnv()`, `buildStations()`.
  5. Ardından `buildAtmosphere()`, `buildCameraPath()`, `buildUI()` ve `layoutScroller()` gelir; en son `frame()` döngüsü başlar.
- **Gerçek üretim noktaları:**
  - Dış cephe: JavaScript (`buildBuilding()`, `glassWall()`).
  - İç odalar ve hub: Blender GLB'leri (`loadBlenderRooms()` → `buildRoomGLB()`).
  - `buildRoom()` GLB yüklenince erken döner. Altındaki eski prosedürel kod yalnız yedek yoldur.

### 1.3 İlan verisi ve araç eşlemesi

- `GALLERY`: mağaza linki `https://mtgmotors34.sahibinden.com/`, telefonlar `0554 579 86 13`, `0538 438 26 41`.
- `CARS[0..6]`: Ateca, BMW 420i, E 180, Golf, BMW 320i, Corsa, Kuga.
- Override'lar: `Object.assign(CARS[1])` BMW, `CARS[3]` Golf ve `CARS[6]` Kuga için malzeme eşlemesi, renk ve jant bilgisi verir.
  BMW eşlemesine far katmanları (`lens`, `reflector`, `ledw`) da eklenmiştir.
- `TOUR = [1, 6, 3, 0, 5, 2, 4]` (BMW önce). Modeli olmayan araçlar (`0476a9e`): donör gövde + saten örtü (`donorFor()`, `coveredCar()`).

### 1.4 Ölçüler (gerçek değerler, aynı koordinat sistemi: m, y yukarı, cephe z = 0, sokak z > 0)

| Ölçü | Brif | HEAD (`index.html`) | 623c7f6 JS | 623c7f6 Blender (`mtg_room.py`) |
|---|---|---|---|---|
| Bina | ~33 × 62 | **104 × 13** (8 oda yan yana, `HALL_W = NROOMS·13`) | `HALL_W = 2·16.5 = 33`, `HALL_D = 10 + 13·4 = 62` | `HUB_W_OUT = 16.5`, `HUB_D = 62` ✓ |
| Resepsiyon derinliği | 10 | yok | `REC_D = 10` | `REC_D = 10.0` ✓ |
| Koridor genişliği | 6 | yok | `CORR = 3` (yarı) | `CW = 3.0` ✓ |
| Oda modülü | 13 × 13 | 13 × 13 | `ROOM_W = ROOM_D = 13` | `W, D = 13, 13` ✓ |
| İç yükseklik | 4,8 | 4,8 | `HALL_H = 4.8` | `H = 4.8` ✓ (duvarlar 4.95'e, tavan boşluğu 4.89) |
| Oda sayısı | 7 + lounge | 7 + lounge | `NROOMS = 8`, `N_ROWS = 4` | `N_ROWS = 4` ✓ |
| Araç (oda yereli) | — | `(−1, −6.2)` | `carPos(k) = modLocal(k, −1, 0, −6.2)` | `CAR = (−1.0, −6.2)` ✓ |
| Oda girişi (koridor yüzü) | — | yan duvar kapısı 2.6 × 3.1, z = −2.3 | vitrin: açıklık yerel x −6.35 … −2.2, cam −2.2 … 6.35 | `OPEN_X1 = −2.2` ✓ |
| Bina giriş kapısı | — | oda 0 önünde, x = roomCX(0) | 2 × 2.76 m sürgülü kanat, x = 0 | yalnız vekil cam (`PX_Facade_Glass`) |

`moduleXform(k)`:
- Modül 0, 2, 4, 6 koridorun solunda (`rotY = +π/2`, yerel +z → dünya +x), 1, 3, 5, 7 sağında (`rotY = −π/2`).
- Sıra `row = ⌊k/2⌋`, merkez `zc = −10 − 6.5 − 13·row` (−16.5, −29.5, −42.5, −55.5).
- `modLocal(k, lx, ly, lz) = origin + R(rotY)·(lx, lz)`. JS ve Blender ölçüleri birebir uyuşuyor.

### 1.5 Kamera bağlantıları (623c7f6)

| Anahtar kare | Konum → hedef | Bağlı işlev |
|---|---|---|
| K0 `hero` (durak 0) | (−31, 9.5, 33) → (1, 2.4, −16), 36° | açılış başlığı (`ovHero`), `updateUI` s < 0.6 |
| K1 | (−12, 3.1, 17) → (0, 2.4, −2), 40° | — |
| K2 `door` | (0.3, 1.75, 6.0) → (0, 1.65, −8), 44° | `updateDoors`: kapılar s = 1.15 … 2.35 arasında açılır |
| K3 | (0, 1.68, −3.2) → (0, 1.5, −24), 50° | "Hoş geldiniz" `fade(s, 2.4, 3.2)` |
| Oda k | koridor dolly → `overview` → `hero` (durak) → `corridor` | `carKeyIndex[k]`, kart görünürlüğü, `showcasePose()` |

Giriş bölümünde **4 anahtar kare** olmalıdır. `updateDoors` ve "Hoş geldiniz" katmanı bu indekslere sabit
bağlıdır. Dış cephe değişikliğinde bu sayı korunmalı ya da bu iki aralık birlikte kaydırılmalıdır.

### 1.6 Etkileşim (her iki sürümde aynı, korunacak)

- **Gezinme:** `goToStop()` ve `step()` (tekerlek eşiği 35, dokunma 45 px, klavye ↑/↓, PageUp/Down, boşluk; koridorlu sürümde ←/→ ve `#room-nav` düğmeleri de var).
- **360° inceleme:** `openInspect(index)` ve `closeInspect()`; doğru aracı açar (`stations[index]`).
- **Gizli kartlar:** `setOverlay()`, opaklık 0.02'nin altına inince `data-hidden` ekler. CSS kuralı `.overlay[data-hidden]{visibility:hidden}` gizli kartların tıklama yakalamasını engeller. Bu düzeltme her iki sürümde mevcut ve **geri alınmayacak**.
- **Arayüz:** fotoğraf galerisi `openLightbox()`; telefon ve ilan bağlantıları `GALLERY` ve `linkFor(spec)` ile.

---

## 2. Bulgular

### 2.1 Kesin sorunlar

1. **Plan uyuşmazlığı (HEAD).**
   - Konsepteki resepsiyon ve koridor HEAD'de yok.
   - Bina 104 m uzunluğunda, 13 m derinliğinde bir şerit.
   - Giriş doğrudan BMW odasına açılıyor (`buildCameraPath`: dış → kapı → oda 0).
2. **Koridorlu sürümde araçlar dışarıdan görünmüyor.**
   - Ön cephenin arkası resepsiyon (banko, lounge).
   - Yan cepheler opak taş kütleler ve buzlu ışık bandı (`buildBuilding`, `for (r < N_ROWS)` döngüsü).
   - Koridordan araçlar yalnız oda önüne gelince seçiliyor.
   - Konsepte ise araçlar cephe vitrinlerinden ve yan cephe camlarından görünüyor.
   - Kullanıcının "araçlar görünmüyor" tepkisinin en olası nedeni bu (§2.2-1).
3. **Açılan giriş kapıları duvarın içine giriyor (623c7f6 `buildBuilding` + `updateDoors`).**
   - Kanat 2.76 m. Kapalı konum x = ±1.41, açık konum x = ±(1.41 + 2.88) = ±4.29; kanat 2.91 … 5.67'yi kaplıyor.
   - Aynı aralıkta bronz portal kanadı (±3.62, 0.28 m), taş pilastr (3.6 … 4.2) ve yan cam duvar (4.2'den itibaren) var.
   - Kapı cebi, sabit yan panel ve ray sonu çözülmemiş.
4. **Sahte pencere.** Resepsiyonun yan cephesinde cam var (`glassWall` x = ±16.65). Hemen arkasında hub'ın opak mikro çimento duvarı duruyor (`RecWall_L/R` x = ±16.35).
5. **Cam ve profil kalitesi (`glassWall`).**
   - Cam sıfır kalınlıklı `PlaneGeometry`.
   - Profil malzemesi `frameMat` siyah (`#151515`), konseptteki koyu bronz değil.
   - Dikmeler hep aynı kesitte (0.07 × 0.12); denizlik, eşik ve köşe birleşimi yok.
6. **Tabela.**
   - Saçaktaki "MTG | MOTORS" bir canvas dokusu (`logoTexture(…, {phones:true})`); üzerinde telefon numaraları da var.
   - Konseptte tabela taşa monte 3B harfler ve telefon yok.
   - İç mekândaki marka harfleri Blender'da gerçek geometri; dışarıda değil.
7. **Taş kaplama derzsiz.** Dış cephede tek kutulara tekrarlı doku (`pbr('travertine_clean', w/2.4, h/2.4)`) uygulanmış; panel derzi ve aks düzeni geometride yok. İç odalarda var (`stone_panels` Blender).
8. **Giriş portalı.**
   - Cam kanopi, şeffaf bir düzlem.
   - Konseptte derin, içe çekilmiş bir portal, ahşap tavan alnı ve gömme spotlar var.
   - Kapı üstündeki tepe camı (transom) ve rayların (z 0.04 / 0.25) uçları açıkta.
9. **Hub ışık hesabı cepheyi vekil camla yaptı.** Cephe değişirse resepsiyonun ışığının yeniden pişirilmesi gerekir.
10. **Kalite durumu.**
    - Koridorlu sürümün `room_car` (modül), `room_lounge` ve `room_hub` dosyaları yalnızca düşük kaliteli test bake'i.
    - HEAD'deki `room_lounge` da düşük kaliteli.
11. **Dokümantasyon güncel değil.**
    - `CLAUDE-DEGISIKLIKLER.md`: "`curated-0/5.glb` dosyaları aynen kullanılıyor" diyor, bu dosyalar repoda yok.
    - `tools/blender/README.md`: HEAD'in yan kapılı oda düzenini anlatıyor, modül ve hub'ı anlatmıyor.

### 2.2 Test edilmesi gereken riskler

1. **"Araçlar görünmüyor" bildirimi bu ortamda üretilemedi.**
   - `623c7f6` hem sunucuyla hem `file://` ile açıldı (Playwright, yazılımsal WebGL).
   - BMW ve Kuga duraklarında araçlar görünüyor (`docs/img/koridor_k6_bmw.jpg`).
   - Olası nedenler:
     - (a) Mimari görünürlük (§2.1-2).
     - (b) Kullanıcının GPU'sunda bellek veya bağlam kaybı: ikinci araç kopyaları, 33 × 62 m tek `Reflector`, 14 MB `rooms.js`.
     - (c) Eski zip ya da önbellek.
   - Gerçek tarayıcıda (masaüstü + mobil) konsol ve `webglcontextlost` kontrolü yapılmalı.
2. **Performans.**
   - Bina boyunca tek `Reflector` tüm sahneyi ikinci kez çiziyor.
   - Koridorlu sürümde 7 adet ikinci araç (cam galeri) klonlanıyor.
   - `captureRoomEnv` küp çekimi var.
3. **Mobil.** `isMobile` durumunda `Reflector` ve ikinci araç kapalı. Kart, kadraj kaydırma (`frameShift`) ve `#room-nav` çakışması kontrol edilmeli.
4. **`file://` açılışı.**
   - `models/models.js` repoda yok; `loadEmbeddedModels` sessizce geçiyor.
   - Eksik GLB'ler `fetch` hatası veriyor, örtülü gövde ise çalışıyor.
5. **360° inceleme ve kart eşleşmesi.** Tur sırası (`TOUR`) ile `stations[index]` ve kart indeksleri her yeni sahne düzeninde yeniden doğrulanmalı.

### 2.3 Eksik varlıklar (başka araçlarla değiştirilmeyecek)

| Varlık | Referans | Durum |
|---|---|---|
| `models/web/seat-ateca.glb` | `CARS[0].glb` | yok (404). Şu an Kuga gövdesi + örtü gösteriliyor |
| `models/web/mercedes-e-w212.glb` | `CARS[2].glb` | yok. BMW gövdesi + örtü |
| `models/web/bmw-3-f30.glb` | `CARS[4].glb` | yok. BMW gövdesi + örtü |
| `models/web/opel-corsa-f.glb` / `curated-5.glb` | `CARS[5]` | yok. Golf gövdesi + örtü |
| `models/models.js` | `loadEmbeddedModels()` | yok (yalnız `file://` için) |
| `photos/bmw-420i-1…4.webp` | `CARS[1].photos` | yok. Fotoğraf galerisi boş açılır |
| `cutouts/bmw-420i-{on,yan,arka}.webp` | `CARS[1].views` | yok (yalnız 3B model yokken kullanılır) |

**Not:** örtülü donör gövde (`0476a9e`) bir "değiştirme" sayılabilir. E 180 ve 320i'de BMW ızgarası örtünün
altından seçiliyor. Brifteki "başka araçlarla değiştirme" kuralına göre bu davranışın korunması da
**karar noktasıdır** (§7). Alternatif: tipine göre nötr bir örtü silueti.

---

## 3. Konsepte yaklaşmak için mimari değişiklikler

| # | Değişiklik | Dosya / fonksiyon / Blender nesnesi |
|---|---|---|
| A1 | Plan: koridorlu kompleks (resepsiyon + koridor + modüller) temel alınır, HEAD'deki gerçekçi oda kalitesi korunur | `index.html`: `moduleXform`, `modLocal`, `buildRooms`, `buildRoomGLB`, `updateRooms` (623c7f6'dan); `mtg_room.py` modül + `hub` varyantı |
| A2 | Cephe kurgusu: girişin iki yanında **sokağa bakan vitrinler**; ilk iki oda (sıra 0) cepheden görünür. Seçenek: (a) resepsiyon kanatları vitrin olur, (b) sıra 0 modülleri cepheye döndürülür | `moduleXform` (sıra 0 için `rotY`), `buildBuilding` ön cephe bölümü; hub'ta `RecSofa`/`MTG_Desk` yerleşimi |
| A3 | Traverten cephe: 1.2 × 2.4 m paneller, 6 mm derz, kolon akslarıyla hizalı ızgara | Yeni Blender varyantı `facade` (`stone_panels` yeniden kullanılır) → `models/rooms/room_facade.glb`; `buildBuilding` bunu yükler, yedek yol mevcut kutular |
| A4 | İçe çekilmiş giriş portalı: 1.5–2 m derinlik, sıcak ahşap tavan alnı (ceviz), gömme spotlar, taş yan yanaklar | `facade` GLB: `MTG_Portal_*`; JS'deki `canopy`/`transom` düzlemleri kaldırılır |
| A5 | Sürgülü giriş: üst ray kutusu + zemin rayı + eşik; iki **sabit yan panel** ve arkalarında kanat cebi (≥ 2.85 m) | `facade` GLB: `MTG_EntryRail`, `MTG_EntryFixed_L/R`, `MTG_Threshold`; JS: `doors[]` kanatları, `updateDoors` hareket mesafesi = kanat genişliği |
| A6 | Cam: 20–24 mm kalınlıklı kutu, kenar tonu (yeşilimsi), çift yüz yansıması; profiller koyu bronz, 50 mm görünür yüz | `glassWall()` → kutu cam + bronz profil malzemesi (`frameMat` yerine bronz); GLB tarafında `MTG_Glass_*` (zaten kutu) |
| A7 | 3B tabela: taşa monte bronz/pirinç "MTG \| MOTORS" harfleri (Cinzel), arkadan hale ışığı; telefonlar cepheden kalkar | Blender `text_mesh` + `brand_wall` (iç mekânda mevcut) → `facade` GLB `MTG_FacadeBrand` (+ `_Halo`); JS `logoTexture(..., {phones:true})` tabelası kaldırılır |
| A8 | Yan cephe: resepsiyon bölümünde sahte cam kalkar ya da arkası gerçek iç mekâna açılır; oda kütlelerinde konseptteki gibi kat yüksekliğinde vitrin camı (iç feature wall'ın yeri değerlendirilir) | `buildBuilding` yan cephe döngüsü; hub `RecWall_L/R`; modülün arka duvarı (`stone_panels('Dark'…)`, `Walnut_Back`) |
| A9 | Çevre: servi ve zeytin ağaçlı taş saksılar, alçak çalı bandı, zemin ışıkları, ıslak görünümlü granit parke | `buildStreet` (saksılar, ağaçlar), yeni dekor GLB'leri (CC0) `models/decor/`; `buildBuilding` zemin ışıkları |
| A10 | Resepsiyon: koyu mermer marka duvarı + banko, alt LED; koridor sonu manzara/bahçe camı | `mtg_room.py` `build_hub()` (`MTG_Desk`, `brand_wall`, `EndDark`) |
| A11 | Oda içi: koyu mermer feature wall + ceviz raf nişi + duvar ekranları; araç çevresinde dolaşım boşluğu ≥ 2 m | `mtg_room.py` modül arka duvarı (`Dark`, `Walnut_*`), `MTG_Display` çapası |
| A12 | Zemin: büyük ebat açık taş, derzler kolon aksları ve oda giriş açıklıklarıyla hizalı | `slab_floor()` (hub), modül `Slab_*` ızgarası |

---

## 4. Korunacak ölçüler, açıklıklar ve kamera bağlantıları

- **Ölçüler:** bina 33 × 62 m; resepsiyon 10 m; koridor 6 m (|x| < 3); modül 13 × 13 m; iç yükseklik 4,8 m;
  dış yükseklik (saçak) 5,9 m.
- **Açıklıklar:**
  - Modül giriş açıklığı yerel x −6.35 … −2.2 (4.15 m). Kahraman kamera (yerel −4.6, 1.5, −0.9) bu açıklıktan girer; daraltılmamalı.
  - Bina girişi x = ±2.8 m (kapalı kanatlar) korunur. Portal iç genişliği ≥ 6.9 m.
- **Araç konumu:** yerel (−1, −6.2), sergi diski r = 3.0. Araç ile feature wall arası ≥ 4 m dolaşım.
- **Kamera:**
  - Giriş bölümünde 4 anahtar kare (K0–K3).
  - `updateDoors` aralığı s 1.15–2.35 ve "Hoş geldiniz" s 2.4–3.2.
  - K2 kapı karesi (0.3, 1.75, 6.0): yeni portal derinliği kameranın önünde kalmalı (portal z ≤ 4).
- **Ad sözleşmesi:** `MTG_*` adlandırması korunur (`MTG_CarSpot`, `MTG_SecondCar`, `MTG_Display`, `MTG_Light`, `MTG_Decor_*`). Yeni cephe nesneleri aynı öneki kullanır.

---

## 5. Eski notlar ile güncel kod farkları

| Not | Güncel durum |
|---|---|
| `CLAUDE-DEGISIKLIKLER.md`: "Ateca ve Corsa için `curated-0/5.glb` aynen kullanılıyor" | Dosyalar repoda yok; örtülü donör gövde gösteriliyor |
| Aynı not: Blender salon dosyaları `showroom-blender.glb`, `showroom-luxury-details.glb` | Kurulumda çağrılmıyor (`buildBlenderInterior`, `buildLuxuryDetails` tanımlı ama kullanılmıyor); yerlerini `models/rooms/*.glb` aldı |
| `tools/blender/README.md`: "kapı dolgusu `MTG_WallL_Filler`, `MTG_DoorFrame_L/R`" | Yalnız HEAD (yan kapılı oda) için geçerli; koridorlu sürümde bu nesneler yok |
| Koridorlu sürüm özeti (önceki rapor): "tam kalite bake" | Yarıda durduruldu; o sürümdeki GLB'ler düşük kaliteli test bake'i |

---

## 6. İlk uygulama aşaması: yalnız dış cephe ve giriş

Kapsam dışı: oda içi, koridor, kamera hareket dili, ışık ayarı, efektler.

1. **Temel:**
   - 623c7f6'daki koridorlu planı ayrı bir dalda geri getir (`moduleXform`…`showcasePose`, `mtg_room.py` modül + hub).
   - HEAD'deki örtülü gövde (`coveredCar`) ve BMW far katmanlarını taşı.
   - Karar §7-1 ile.
2. **Kapılar ve ray:**
   - Sürgülü giriş: kanat genişliği 2.76 m. İki sabit yan panel ve arkasında cep oluştur.
   - Üst ray kutusu (bronz, 0.18 × 0.12) ekle; zemine gömülü ray ve taş eşik ekle.
   - `updateDoors` açılma mesafesi kanat genişliği kadar olsun; kanat sabit panelin arkasına girsin.
   - Kabul: açık ve kapalı konumda hiçbir kesişme olmasın (§6.1).
3. **Cam ve profil:**
   - `glassWall` kutu cam (0.022 m) + bronz profil yapılacak.
   - Profil görünür yüzü 0.05 m, derinliği 0.12 m olacak.
   - Denizlik ve eşik profili eklenecek.
4. **Traverten cephe (Blender `facade` varyantı):**
   - Ön cephe ve giriş portalı panel ızgarasıyla modellenecek; kolon aksları x = ±16.5, ±10.4, ±3.9.
   - Portal içe çekilecek, ceviz tavan alnı ve gömme spotlar eklenecek.
   - Saçak 4.8–5.9 m'de olacak. Tabela 3B harflerle yapılacak (`text_mesh`).
   - GLB ve lightmap olarak dışa aktarılacak; `buildBuilding` önce GLB'yi dener, yoksa mevcut kutulara düşer.
5. **Vitrin görünürlüğü (§2.1-2):** girişin iki yanındaki camların arkasında araç görünmesini sağlayacak
   plan seçeneği uygulanacak (§7-2).
6. **Sahte yan pencere (§2.1-4):** resepsiyon yan cephesi taşa çevrilecek ya da iç mekânla tutarlı hale getirilecek.
7. **Tabela:** telefonlu canvas tabela kaldırılacak; telefonlar arayüzde zaten var.
8. **Hub ışığı:** yeni cepheyle `hub` yeniden pişirilecek (tam kalite, 2048 px).
9. **Dokümantasyon:** README'ye `facade` varyantı ve yeni adlar eklenecek; `CLAUDE-DEGISIKLIKLER.md` güncellenecek.

### 6.1 Önce/sonra kontrol açıları ve kabul ölçütleri

| Açı | Kamera (konum → hedef, FOV) | Ölçüt |
|---|---|---|
| D1 dış 3/4 | K0 (−31, 9.5, 33) → (1, 2.4, −16), 36° | Traverten panel ızgarası ve kolon aksları okunur; tabela 3B ve okunaklı; en az bir vitrinde araç görünür |
| D2 cephe görünüşü | (0, 1.7, 24) → (0, 3.0, 0), 38° | Simetri; derzler akslarla hizalı; portal derinliği gölgeyle okunur |
| D3 giriş yaklaşımı | K2 (0.3, 1.75, 6.0) → (0, 1.65, −8), 44° | Bronz profiller ince ve koyu; cam kalınlığı ve kenarı seçilir; ray, eşik, sabit panel görünür |
| D4 kapı açık | aynı açı, s = 2.35 | Kanatlar sabit panelin arkasında; hiçbir nesneyle kesişmez |
| D5 eşik / resepsiyon | K3 (0, 1.68, −3.2) → (0, 1.5, −24), 50° | Resepsiyon ve koridor ekseni anlaşılır; "Hoş geldiniz" katmanı doğru zamanda |
| D6 yan cephe | (−34, 2.0, −20) → (−16, 2.5, −30), 40° | Sahte pencere yok; oda kütleleri ayrı okunur |
| D7 portal detay | (−2.2, 1.6, 2.6) → (1.0, 2.8, 0.4), 50° | Ahşap tavan alnı, spotlar, ray kutusu ve taş yanak birleşimi temiz |

**Genel ölçütler:**
- Masaüstünde 60 fps'e yakın; mobilde mevcut performanstan düşük olmamalı.
- Tüm duraklarda araçlar görünür; 360° inceleme doğru aracı açar.
- Gizli kartlar tıklama yakalamaz.
- Konsolda yeni hata çıkmaz; eksik GLB'lere ait 404 uyarıları dışında.

---

## 7. Karar noktaları (uygulamadan önce)

1. **Temel sürüm:**
   - Koridorlu plan (konsepte uygun, önerilen).
   - Ya da HEAD'deki yan yana oda dizisi; bunda resepsiyon ve koridor eklemek büyük yeniden yerleşim gerektirir.
2. **Vitrin:** girişin iki yanında sokağa bakan araçlar:
   - (a) Resepsiyon kanatlarına vitrin (ilk iki tur aracı orada, kendi odaları koridorda kalır).
   - (b) Sıra 0 modüllerinin cepheye dönmesi.
3. **Eksik araçlar:**
   - Örtülü donör gövde (şu anki) korunsun mu, yoksa tipine göre nötr örtü silueti mi?
   - Gerçek GLB'ler gelince ikisi de kalkar.

---

## 8. Ekran görüntüleri (bu ortamda alındı)

Playwright + yazılımsal WebGL (SwiftShader), 1280 × 720, `#test` kipinde:
- HEAD: `docs/img/head_k0_dis_cephe.jpg`, `head_k2_kapi.jpg`, `head_k3_iceri.jpg`, `head_oda_bmw.jpg`.
- Koridorlu sürüm (`623c7f6`): `docs/img/koridor_k0_dis_cephe.jpg`, `koridor_k3_resepsiyon.jpg`, `koridor_k6_bmw.jpg`.

Gerçek GPU'lu tarayıcıda ve mobil cihazda test **yapılmadı**.
