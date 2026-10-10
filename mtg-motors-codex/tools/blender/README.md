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
| `MTG_Glass_*` | Mesh | Kodun cam malzemesi atanır. |
| `MTG_Diffuser`, `MTG_LED_*` | Mesh | Işık yüzeyi: `MeshBasicMaterial` (bloom'a girer). |
| `MTG_Decor_*` | Empty | `extras.decor` adlı dekor modeli (`models/decor/*.glb`) bu çapaya eklenir. |
| `MTG_CarSpot` | Empty | Araç konumu ve yönü. |
| `MTG_Totem` | Empty | Dijital bilgi totemi (yazısı ilan verisinden). |
| `MTG_BrandPanel` | Empty | Arkadan aydınlatmalı logo paneli (`extras.w / h`). |
| `MTG_Light` | Empty | Gerçek zamanlı alan ışığı (`extras.w / h`). |

Sürgülü cam kapılar, totem yazısı, logo, araçlar ve kamera kodda kalır. GLB yalnız sabit mimariyi
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
