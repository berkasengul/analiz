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
