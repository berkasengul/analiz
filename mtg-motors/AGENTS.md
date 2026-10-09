# MTG MOTORS 3D showroom: proje rehberi (Codex / AI ajanları için)

Bu klasör, MTG MOTORS oto galerisinin kaydırmaya bağlı sinematik 3D web sitesidir.
Ziyaretçi aşağı kaydırdıkça kamera binanın dışından kapıya gelir, kapılar açılır,
içeri girer ve ilandaki araçları sırayla gösterir. Sonunda iletişim ekranı çıkar.

- Teknoloji: tek dosya `index.html`, Three.js **r160** (CDN, importmap), build adımı yok.
- Dil: arayüz ve kod yorumları Türkçe.

## Dosyalar

| Yol | İçerik |
|---|---|
| `index.html` | Tüm site: CSS, HTML arayüz, 3D sahne, kamera, döngü |
| `models/*.glb` | Araç 3D modelleri (meshopt sıkıştırmalı GLB) |
| `models/models.js` | Aynı modellerin base64 gömülü kopyası (`file://` ile açılış için) |
| `models/README.md` | Model kaynakları ve CC BY 4.0 atıfları, sıkıştırma komutu |
| `photos/*.webp` | İlan fotoğrafları (araç kartındaki galeri) |
| `cutouts/*` | Arka planı silinmiş araç fotoğrafları (3D model yoksa yedek gösterim) |

## Çalıştırma

```bash
npx serve .          # veya: python3 -m http.server
```

`index.html` dosyasına çift tıklamak da çalışır, çünkü modeller `models.js` içinde gömülü.
Testte kamerayı ataletsiz anında konumlandırmak için adrese `#test` ekleyin.

## index.html haritası (bölüm başlıkları `// ---------- ... ----------`)

1. **GALERİ VE İLAN BİLGİLERİ**: `GALLERY` (mağaza linki, telefonlar) ve `CARS` dizisi.
   Her araç: `brand, model, title, ilanNo, year, km, colorName, price, color, type, url,
   photos, glb, length, materials, rimColor, caliperColor, credit`.
   Araç eklemek ya da çıkarmak salonu ve kamera turunu otomatik uzatır ya da kısaltır.
2. **Renderer**: ACES tone mapping, `scene.environment` (RoomEnvironment PMREM), sis.
3. **Ölçüler**: `HALL_W=30`, `HALL_H=5.6`, `CAR_SPACING=9`, `FIRST_CAR_Z=-13`.
   Koordinatlar: ön cephe `z=0`, salon `-z` yönüne uzanır, arka duvar `BACK_Z`; zemin `y=0`.
   Birim metredir. Araçlar zikzak dizilir: `x=±7.2`, `z = FIRST_CAR_Z - i*CAR_SPACING`.
4. **Doku yardımcıları**: canvas ile prosedürel mermer, taş, sıva, ahşap ve altıgen doku.
5. **Gökyüzü ve dış mekan**: `buildSky`, `buildStreet` (yol, meydan, bahçe, ağaç, totem tabela).
6. **Bina**: `buildBuilding`. Cam pavyon, taş kolonlar, saçak, ışıklı tabela, sürgülü kapılar (`doors`).
7. **İç mekan**: `buildInterior`. Mermer zemin + `Reflector`, siyah tavan ve LED'ler,
   ahşap kiriş, taş kolonlar, bitki duvarı, bekleme köşesi, kahve barı.
8. **Prosedürel araç modeli**: `buildCar`. GLB yoksa kullanılan basit gövde (saten örtülü gösterilir).
9. **Gerçekçi GLB modeller**: `loadCarModels`, `prepareCarModel` (ölçek/yön/merkez),
   `makeCarMaterials` (boya, cam, jant, kaliper, far, stop, plaka), `carEnv` (araç yansıma ortamı),
   `updateFocusLights` (odaktaki araca eşlik eden RectAreaLight'lar).
10. **Döner platformlar**: `buildStations`. Platform, araç, bilgi panosu. `stations[]` dizisini doldurur.
11. **Kamera yolu**: `buildCameraPath`. Anahtar kareler (aşağıda).
12. **Arayüz**: `buildUI`. Araç kartları, sağ menü, fotoğraf görüntüleyici, telefon butonları.
13. **Kaydırma → kamera**: `readScroll`, `shapedS`, `updateCamera`, `updateDoors`, `updateUI`.
14. **Döngü**: `frame()`. Atalet, platform dönüşü, kamera, ışıklar, bloom'lu çizim.

## Kamera sistemi

Kamera kaydırmaya bağlı ilerler; zamanla değil. Akış şöyle:

1. `keys[]`: her anahtar kare `{ pos, look, fov, tag }`. `K([x,y,z], [lookX,lookY,lookZ], fov, tag)` ile eklenir.
2. Konum ve bakış noktası için iki ayrı `CatmullRomCurve3` (centripetal) kurulur: `posCurve`, `lookCurve`.
3. Kaydırma: `s = scrollY / maxScroll * (keys.length - 1)` → `targetS`.
   Sayfa yüksekliği = `(keys.length - 1) * SEG_VH + 100vh` (`SEG_VH = 85`, yani her geçiş için 85vh kaydırma).
4. Atalet: `currentS += (targetS - currentS) * (1 - exp(-dt * 3.2))`. Sinematik gecikme buradan gelir.
5. `shapedS`: her geçişte yumuşak hızlanma ve yavaşlama, anahtar karelerde hafif duraksama.
6. FOV anahtar kareler arasında yumuşak geçer. Dikey ekranda yatay görüş açısı korunur.
7. "El kamerası" hissi: hafif nefes salınımı ve fare paralaksı. `prefers-reduced-motion` açıksa kapanır.
8. Bilgi kartı açıkken `camera.setViewOffset` ile kadraj kaydırılır, araç kartın karşı tarafında kalır.

### Anahtar kareler (sırasıyla)

| # | Tag | Kamera konumu | Bakış noktası | FOV | Sahne |
|---|---|---|---|---|---|
| 0 | `hero` | (-15, 2.2, 42) | (-8, 4.6, 0) | 40 | Dış geniş plan, açılış başlığı |
| 1 | – | (6, 1.6, 22) | (0, 4.2, 0) | 40 | Cepheye yaklaşma |
| 2 | `door` | (0, 1.75, 7.5) | (0, 2.1, 0) | 46 | Kapının önü (kapılar `s` 1.15→2.35 arasında açılır) |
| 3 | – | (0, 1.8, 1.2) | (0, 1.9, -12) | 52 | Kapıdan geçiş |
| 4 | `welcome` | (0, 4.6, -4) | (0, .8, -26) | 50 | Salona geniş bakış, "Hoş geldiniz" |
| 5+2i | `car{i}` | (x + a·7.6, 1.45, z + 4.2) | (x, .75, z) | 40 | Araç i: ön çapraz |
| 6+2i | `car{i}` | (x + a·6.2, .95, z − 2.6) | (x, .7, z + .3) | 38 | Araç i: yan/arka alçak açı |
| son-1 | `finale` | (0, 2.2, BACK_Z + 21) | (0, 2.4, BACK_Z) | 46 | Arka duvara yaklaşma |
| son | `finale` | (-1, 1.5, BACK_Z + 15) | (-1.5, .9, BACK_Z) | 48 | Bitki duvarı + kapanış ekranı |

`x, z` = aracın platform merkezi, `a = -side` (kameranın durduğu koridor tarafı: sol sıradaki araç için +1).
Araç başına iki kare vardır; kart bu iki kare boyunca görünür (`updateUI` → `fade`).

**Kamera değiştirirken dikkat:** `buildStations` içindeki `yawA/yawB` değerleri araç kameralarının
açılarıyla aynı olmalı. Bunlar fotoğraf kesimi yedek gösterimi için kullanılır.
Yeni bir sahne eklerseniz `updateUI` içindeki metin katmanı aralıklarını (`fade(s, a, b)`) da kaydırın.

## Ortamı gerçek 3D modelle değiştirmek (önerilen yol)

Bina ve iç mekân şu an kodla, basit geometrilerle çiziliyor. Blender'da modellenmiş bir showroom ile değiştirmek için:

1. Showroom'u Blender'da modelleyin. Ölçekler: 1 birim = 1 m, Y yukarı (glTF), ön cephe `z=0`,
   kapı ortası `x=0`, salon `-z` yönünde, genişlik 30 m, tavan 5.6 m.
   Araç platformlarını boş bırakın; araçlar koddan yerleştirilir.
2. Işığı Blender'da "bake" edin (lightmap). Gerçek zamanlı çok sayıda ışıktan hem daha güzel hem daha hızlıdır.
3. `models/showroom.glb` olarak dışa aktarın, sonra sıkıştırın:
   `npx @gltf-transform/cli optimize in.glb models/showroom.glb --compress meshopt --texture-compress webp --texture-size 2048`
4. `index.html` → Kurulum bölümünde `buildStreet()`, `buildBuilding()` ve `buildInterior()` yerine
   GLTFLoader ile bu dosyayı yükleyin. Sürgülü kapı nesnelerine isim verin (örn. `Door_L`, `Door_R`)
   ve `doors[]` dizisine ekleyin: `userData.side = -1 / +1`.
5. `file://` desteği istenirse modeli `models/models.js` içine base64 olarak ekleyin
   (`window.MTG_MODELS['models/showroom.glb'] = '...'`). Mevcut yükleme koduna bakın.

Araç modelleri için aynı kural geçerli: `CARS[i].glb` dosyası. `materials` eşlemesi modelin
materyal adlarını (`name.endsWith(key)`) hazır görünümlere bağlar.

## Bilinen notlar

- Sadece BMW 420i'nin gerçek GLB modeli var. Diğer 6 araç örtülü yedek gövdeyle gösteriliyor
  (model linkleri `models/README.md` içinde).
- Sahibinden.com bot erişimini engelliyor (403). İlan bilgileri `CARS` dizisine elle girilir.
- `#test` kipinde atalet kapalıdır (ekran görüntüsü testleri için).
- Mobilde `Reflector` (zemin yansıması) kapalı, piksel oranı 1.5 ile sınırlı.
