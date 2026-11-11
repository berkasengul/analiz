# 3D site test raporu

Test: headless Chromium (yazılım WebGL), dosyalar diskten; masaüstü 1440×900, telefon 390×844, tur 1920×1080. Kaynak: `araclar/site_test.js`.

Süreler yerel diskten ölçüldü; gerçek ağda ilk görüntü daha geç gelir. Netlify'a yükledikten sonra telefonda bir kez dene.

## coskun-zeytincilik — 8 kontrolün 8'i geçti

Klasör: `siteler/coskun-zeytincilik/` (710 KB, dış istek yok, internetsiz çalışır)

| Kontrol | Sonuç | Ölçüm |
|---|---|---|
| Konsol hatası yok | geçti | masaüstü 0, telefon 0 |
| Dış istek yok (offline) | geçti | 0 dış istek |
| Telefonda yatay taşma yok | geçti | 0 px |
| İlk görüntü 3 sn altında | geçti | masaüstü 32 ms, telefon 40 ms (yerel) |
| "Bağımsız konsept demo" notu | geçti | alt bilgide |
| Arama motoruna kapalı | geçti | noindex + robots.txt |
| Kırık bağlantı yok | geçti | 200, 200, 200, 200, 200, 200 |
| Tur deterministik | geçti | aynı t iki kez → aynı kare; 20.7 sn, 4 sahne |

3D sahne hazır: masaüstü 408 ms, telefon 461 ms. En küçük yazı: masaüstü 12 px, telefon 11 px.

Tur sahneleri (`index.html?tur=1`): Açılış: 5 L teneke (0–4.2 sn) · İlk hasat: galon cam şişe (5.5–9.7 sn) · Zeytin: taze acı kırma (11–15.2 sn) · Kapanış: aile hikâyesi (16.5–20.7 sn)

Bağlantılar:
- https://coskunzeytincilik.com/urun/5-l-teneke-erken-hasat-tas-baski-zeytinyagi-500-ml-zeytin-sutu-2023-2024-yeni-hasat/ → 200
- https://coskunzeytincilik.com/urun/galon-cam-sise-ilk-hasat-tas-baski-zeytinyagi-yuksek-polifenollu-2026-2027-yeni-mahsul-filtresiz-1-lt/ → 200
- https://coskunzeytincilik.com/urun/galon-cam-sise-ilk-hasat-tas-baski-zeytinyagi-yuksek-polifenollu-2026-2027-yeni-mahsul-flitresiz-500-ml/ → 200
- https://coskunzeytincilik.com/urun/taze-aci-kirma-zeytin-1000-gr/ → 200
- https://coskunzeytincilik.com/urun-kategori/zeytinyaglar/ → 200
- https://coskunzeytincilik.com/hikayemiz/ → 200

Ekran görüntüleri: `ekran/coskun-zeytincilik_masaustu_*.jpg`, `ekran/coskun-zeytincilik_telefon_*.jpg`, `ekran/coskun-zeytincilik_tur_*.jpg`

## o-atolye — 8 kontrolün 8'i geçti

Klasör: `siteler/o-atolye/` (710 KB, dış istek yok, internetsiz çalışır)

| Kontrol | Sonuç | Ölçüm |
|---|---|---|
| Konsol hatası yok | geçti | masaüstü 0, telefon 0 |
| Dış istek yok (offline) | geçti | 0 dış istek |
| Telefonda yatay taşma yok | geçti | 0 px |
| İlk görüntü 3 sn altında | geçti | masaüstü 132 ms, telefon 60 ms (yerel) |
| "Bağımsız konsept demo" notu | geçti | alt bilgide |
| Arama motoruna kapalı | geçti | noindex + robots.txt |
| Kırık bağlantı yok | geçti | e-posta bağlantısı, kontrol edilmedi (Instagram oturumsuz isteği engelliyor) |
| Tur deterministik | geçti | aynı t iki kez → aynı kare; 31.7 sn, 6 sahne |

3D sahne hazır: masaüstü 782 ms, telefon 579 ms. En küçük yazı: masaüstü 12 px, telefon 11 px.

Tur sahneleri (`index.html?tur=1`): Açılış: tablet (0–4.2 sn) · 1. Kakao meyvesi (5.5–9.7 sn) · 2. Kavurma (11–15.2 sn) · 3. Taş değirmen (16.5–20.7 sn) · 4. Tablet (22–26.2 sn) · Kapanış: bütün yolculuk (27.5–31.7 sn)

Bağlantılar:
- mailto:o@oatolye.com → e-posta bağlantısı
- https://www.instagram.com/o_atolye → kontrol edilmedi (Instagram oturumsuz isteği engelliyor)

Ekran görüntüleri: `ekran/o-atolye_masaustu_*.jpg`, `ekran/o-atolye_telefon_*.jpg`, `ekran/o-atolye_tur_*.jpg`

## Elle bakılanlar
- Ekran görüntüleri tek tek açılıp kontrol edildi: etiket yazıları okunuyor, ürün kaidede, telefonda kart ürünü kapatmıyor.
- Test edilemeyen: gerçek telefon (dokunmatik sürükleme), Safari, yavaş ağ.
