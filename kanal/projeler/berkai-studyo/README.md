# BerkAİ Stüdyo

Her gün çalışan altı ekip ve çıktılarını içinde yürüyerek gördüğün 3D ofis. Dışarıya hiçbir şey göndermez; mailler taslaktır.

## Klasörler

| Yol | Ne |
|---|---|
| `gunler/<tarih>/` | O günün gerçek işleri: `01_konu`, `02_yapim`, `03_musteri`, `04_site`, `05_mail`, `06_mudur`, ve senin kaydettiğin `kararlar.json` |
| `siteler/<slug>/` | Demo siteler. Her klasör kendi başına çalışır; Netlify'a klasör olarak sürüklenir |
| `siteler/_motor/` | Demo motoru: `site.js` (kodla çizilen ürünler), `site.css`, `markalar/<slug>.json` (marka ayarı) |
| `ofis/` | 3D ofis: `index.html`, `ofis.js`, `dunya.js`, `veri.js` (otomatik üretilir) |
| `araclar/` | Ekiplerin araçları (aşağıda) |
| `veri/` | Kurallar ve ret listesi (ekip değiştirmez) |
| `GUNLUK_KOMUT.md` | Yarın aynı ekibi çalıştıran tek komut |
| `LISANSLAR.md` | Kullanılan varlıklar |

## Ofisi açmak

Ofis ve demolar tarayıcı modülü kullandığı için dosyaya çift tıklayarak açılmaz; bir web sunucusu gerekir. Kendi bilgisayarında bu klasörde:

```
python -m http.server 8000
```

Sonra `http://localhost:8000/ofis/` adresini aç. Sunucuyu `berkai-studyo/` klasöründe başlat; ofis demoları `../siteler/` yolundan açar.

- **Yürü:** W A S D ya da ok tuşları (Shift: hızlı). **Bak:** fareyi sürükle. **Panel:** masaya yaklaş, E. **Ekibe git:** 1–6.
- **Demo siteler:** 3D site ekibinin önündeki ekranlara tıkla ya da paneldeki "Demoyu aç" düğmesine bas.
- **Kararlar:** müdür odası (6), Onayla / Reddet, sonra "Kararları dışa aktar". İnen dosyayı `gunler/<tarih>/kararlar.json` olarak kaydet.
- **Video çekimi:** `ofis/index.html?tur=1` → `window.TUR = { sure: 107, sahneler, kare(t) }`, hazır olunca `window.HAZIR = true`. `kare(t)` aynı t için aynı kareyi verir. Demo siteler de `?tur=1` destekler.

Tur sahneleri: Giriş (0–7) · Konu (7–19) · Yapım (19–31) · Müşteri (31–43) · 3D site (43–55) · Demo ekranda (55–70) · Mail (70–82) · Müdür odası ve onay (82–100) · Kapanış (100–107).

## Araçlar

| Komut | Ne yapar |
|---|---|
| `node araclar/site_olc.js <klasör> <slug>=<url> …` | İşletme sitesini açar, ölçer, masaüstü ve telefon ekran görüntüsü alır |
| `node araclar/aday_tablosu.js <klasör>` | `degerlendirme.json` + ölçümler → `adaylar.json`, `aday_tablosu.csv` |
| `node araclar/site_uret.js <slug>` | Marka ayarından demo klasörü üretir |
| `node araclar/site_test.js <klasör> <slug> …` | Demoyu 8 kontrolden geçirir, ekran görüntüsü alır |
| `node araclar/site_rapor.js <klasör>` | Test sonuçlarından `test_raporu.md` yazar |
| `node araclar/ofis_veri_uret.js [tarih]` | `gunler/<tarih>/` → `ofis/veri.js` |
| `node araclar/ofis_test.js <klasör>` | Ofisi normal ve tur modunda test eder |
| `node araclar/glb_kirp.js` | Karakter dosyalarını küçültür |

Playwright gerektirenler `NODE_PATH=/opt/node-tools/node_modules` ile çalışır. Sunucu açmazlar; dosyaları diskten verirler (`araclar/yerel.js`).

## Yeni bir marka için demo

1. `siteler/_motor/markalar/<slug>.json` yaz (örnek: `o-atolye.json`). Yalnızca doğrulanmış bilgi; etikete "konsept" notu.
2. `node araclar/site_uret.js <slug>`, sonra `site_test.js`.
3. Hazır ürün modelleri: `teneke`, `sise` (düz ya da `bicim: "galon"`), `kavanoz`, `tablet`, `kakao`, `cekirdek`, `degirmen`. Yenisi `site.js` içindeki `MODEL` nesnesine eklenir.

## Bilinen eksikler
- Ofiste dokunmatik yürüme yok; telefon için değil, masaüstü için.
- Karakterler KayKit'in macera paketinden; ofis kıyafeti değil.
- Ofis başka günü göstermek için yeniden üretilir: `node araclar/ofis_veri_uret.js 2026-11-11`.
