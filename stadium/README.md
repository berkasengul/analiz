# Aslan Bilet · RAMS Park 3D (hayran yapımı demo)

Galatasaray'ın RAMS Park stadyumu için 3D bilet seçme deneyimi. Tamamen statik bir site (three.js), sunucu gerekmez.

- Açılış: gerçek çatı (güneş panelleri + "#" kirişler) uydu görüntüsünün üstünde → çatı açılır, tribünler yukarıdan aşağı yanar, her tribünün başlangıç fiyatı ve boş koltuk sayısı çıkar.
- Bir bloğun üstüne gel → blok, kategori, fiyat, boş koltuk. Tıkla → bloğa uç.
- Koltuk haritasından sıra/koltuk seç → kamera koltuğa iner, bilet o koltuktan görünen manzarayı gösterir.
- Klavyeden **BİLET** yaz (veya "VIP" butonu) → bilet döner, VIP locaya (deri koltuklar, cam cephe) ışınlanırsın.

## Veri
- 84 blok, 100 (alt kat, 37 sıra) / 200 (VIP-loca) / 400 (üst kat, 27 sıra) seviyeleri ve blok sıralaması: gsplan.org (resmi olmayan rehber).
- Kategori eşleşmesi gsplan.org tablosundan; **fiyatlar örnektir**.
- Stadyum ayak izi ve yönü OpenStreetMap (way 342828509): ~232 × 205 m, uzun eksen kuzeydoğu–güneybatı.
- Çevre: Esri World Imagery uydu görüntüsü (Esri, Maxar, Earthstar Geographics) — `tools/fetch_satellite.py`.

## Çalıştırma
```
npx serve .        # veya: python3 -m http.server
```

## Video
- `tools/record.mjs` — Short için kare kare kayıt (1080×1920, 30 fps, sahte imleç + altyazılar).
- `tools/soundtrack.py` — numpy ile sentezlenmiş özgün müzik + efektler.

Galatasaray SK, RAMS veya Passo ile bağlantısı yoktur.
