# Blender showroom hattı (MTG MOTORS)

`mtg_room.py`, sitedeki odaları gerçek mimari ölçülerle Blender'da modeller, ışığı Cycles ile
**lightmap** olarak pişirir ve web için GLB dışa aktarır. Betik Blender 4.2 LTS ve 5.x ile çalışır
ve arka planda (arayüz açmadan) çalıştırılır.

## Ne üretir

| Dosya | İçerik |
|---|---|
| `models/rooms/room_car.glb` | Araç odası mimarisi. Yedi araç odasının hepsi bunu paylaşır. |
| `models/rooms/room_lounge.glb` | Son oda (MTG Lounge). |
| `models/rooms/room_*_lm_*.webp` | Pişmiş ışık haritaları: zemin, duvar atlası, tavan, kapı dolgusu. |
| `models/rooms/preview_*.png` | Cycles önizleme render'ları (kamera durakları). |
| `models/rooms/room_*.blend` | Düzenlenebilir Blender kaynağı (`--save-blend` ile). |

## Çalıştırma (Windows, PowerShell)

1. Proje klasörünü (`mtg-motors-codex`) Dosya Gezgini'nde açın.
2. Adres çubuğuna `powershell` yazıp Enter'a basın. PowerShell bu klasörde açılır.
3. Önce hızlı önizleme alın (yaklaşık 2–5 dk):

```powershell
& "C:\Program Files\Blender Foundation\Blender 5.2\blender.exe" -b --factory-startup --python tools\blender\mtg_room.py -- --variant car --mode preview
```

4. Ardından tam üretimi çalıştırın: bake, GLB ve `.blend`. Süre işlemciye göre 15–40 dk.

```powershell
& "C:\Program Files\Blender Foundation\Blender 5.2\blender.exe" -b --factory-startup --python tools\blender\mtg_room.py -- --variant car --mode full --save-blend
& "C:\Program Files\Blender Foundation\Blender 5.2\blender.exe" -b --factory-startup --python tools\blender\mtg_room.py -- --variant lounge --mode full --save-blend
```

Ekran kartı varsa Cycles'ı GPU'ya almak için `.blend` dosyasını açıp şu yolu izleyin:
Render Properties → Device: GPU Compute.

## Seçenekler

| Seçenek | Varsayılan | Açıklama |
|---|---|---|
| `--variant car / lounge` | `car` | Hangi oda üretilecek. |
| `--mode preview / full` | `preview` | `preview` yalnız render alır. `full` lightmap pişirir, GLB verir, render alır. |
| `--samples N` | 64 | Önizleme render örnek sayısı. |
| `--bake-samples N` | 192 | Bake örnek sayısı. Yüksek değer daha az gürültü verir, daha yavaştır. |
| `--lm-size N` | 2048 | Zemin ve duvar lightmap çözünürlüğü. Tavan bunun yarısı. |
| `--views bmw,wide` | hepsi | Yalnız seçilen önizleme açılarını üretir. |
| `--car FILE` | `models/web/bmw-420i-coupe.glb` | Önizlemedeki araç. Bake'e katılmaz. |
| `--extra-decor DIR` | – | Meshopt açamayan Blender 4.2 için Poly Haven glTF klasörü. |
| `--out DIR` | `models/rooms` | Çıktı klasörü. |

## Sahne düzeni ve adlandırma (kodla sözleşme)

Koordinatlar oda yereldir ve sitenin eksen düzenini kullanır (Y yukarı):

- Oda merkezi `x = 0`, ön cephe `z = 0`, arka duvar `z = -13`.
- Tavan yüksekliği 4.8 m.
- Kod, GLB'yi `roomCX(k)` kadar kaydırır.

| Ad | Tür | Kodda yapılacak |
|---|---|---|
| `MTG_Floor`, `MTG_Walls`, `MTG_Ceiling` | Pişmiş mesh | `extras.lightmap` dosyasını `lightMap` olarak bağla (`channel = 1`, `flipY = false`, sRGB), şiddet `extras.lmScale`. |
| `MTG_WallL_Filler` | Pişmiş mesh | Yalnız ilk odada görünür; sol duvarda kapı yok. |
| `MTG_DoorFrame_L / _R` | Mesh | İlk odada `_L` gizlenir. |
| `MTG_Glass_*`, `MTG_Mullion_*` | Mesh | Cam galeri kutusu (yerden tavana cam + bronz dikmeler); cama kodun cam malzemesi atanır. |
| `MTG_LED_*`, `MTG_Stage_LED` | Mesh | Işık yüzeyi: `MeshBasicMaterial` (bloom'a girer). |
| `MTG_Brand`, `MTG_Brand_Halo` | Mesh | Arkadan aydınlatmalı pirinç "MTG \| MOTORS" harfleri (Cinzel) + hale ışığı. |
| `MTG_Stage*` | Mesh | Aracın altındaki zemine gömülü grafit disk, çelik kenar ve ince ışık çizgisi. |
| `MTG_Decor_*` | Empty | `extras.decor` adlı dekor modeli (`models/decor/*.glb`) bu çapaya eklenir. |
| `MTG_CarSpot` | Empty | Araç konumu ve yönü. |
| `MTG_SecondCar` | Empty | Cam galerideki ikinci araç (koyu renkli; kod mevcut modellerden birini klonlar). |
| `MTG_Display` | Empty | Marka duvarına gömülü dijital ekran (`extras.w / h`, ilan verisi canvas ile çizilir). |
| `MTG_Light` | Empty | Gerçek zamanlı alan ışığı (`extras.w / h`). |

Sürgülü cam kapılar, ekran içeriği, araçlar ve kamera kodda kalır. GLB yalnız sabit mimariyi
ve mobilyayı taşır.

## Bake ayrıntıları

- Yalnız ışık pişirilir (Diffuse: Direct + Indirect, renk hariç). Doku rengi gerçek zamanlı kalır,
  bu yüzden dokular keskin kalır.
- Lightmap UV'leri düzlemseldir; otomatik açılım kullanılmaz:
  - zemin ve tavan: üstten izdüşüm
  - duvarlar: tek atlas (arka / sol / sağ alt alta)
- Araç bake'e girmez, çünkü turda 360° döner. Mobilya ve dekor gölge verir.
- Komşu odalar ve cam cephe `PX_` vekilleriyle temsil edilir: kapıdan sızan ışık doğru çıkar.
  Bu vekiller dışa aktarılmaz.
- Gölge boşlukları ve ışık kanalları (neredeyse siyah) `MTG_Reveals` olarak pişirilmeden verilir.

## Oda tasarımı (2. aşama)

- **Zemin:** 2.6 × 1.3 m porselen plakalar, 4 mm koyu derz, iki hafif ton, plaka başına farklı doku başlangıcı.
  Aracın altında zemine gömülü r = 3 m cilalı grafit disk, fırçalanmış çelik kenar ve ince ışık çizgisi var.
- **Sol arka duvar (marka duvarı):** 1.35 × 2.36 m koyu taş paneller, arkadan aydınlatmalı pirinç
  "MTG | MOTORS" harfleri, bronz çerçeveli gömme dikey ekran.
- **Sağ arka (cam galeri):** yerden tavana L biçimli cam kutu, bronz dikmeler.
  - İçeride grafit renkli ikinci bir araç duruyor.
  - Arkada ceviz lamel vurgu duvarı var; her 9. lamel bronz.
  - Lameller tabandan ve tavandan ışıkla yalanıyor.
- **Sağ duvar:** kapı çevresinde düzenli bölünmüş traverten paneller, bronz kapı kasası.
- **Tavan:** zemin ızgarasıyla hizalı 2.6 × 1.3 m koyu paneller.
  - Panel derzlerine gömülü lineer ışıklar (araç üstünde 4 hat, galeride 2 hat).
  - Duvar çevresinde 16 cm gölge boşluğu ve içinde gizli LED.
- **Lounge:** iki tonlu yün halı, modüler kanepe (3 oturum + eğik sırt minderleri + kırlentler), iki koltuk,
  yuvarlak traverten sehpa (3 kitap, bronz heykelcik, vazo), bronz halka sarkıt, büyük saksılı bitkiler.

Dokular `textures/` altında: `porcelain_slab`, `dark_stone`, `travertine_clean`, `warm_stone`.
Kaynakları Poly Haven ve ambientCG, hepsi CC0. Yazı tipi `assets/Cinzel-SemiBold.ttf`, SIL OFL lisanslı.
