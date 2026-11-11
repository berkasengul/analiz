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

Ofis ve demolar tarayıcı modülü kullandığı için dosyaya çift tıklayarak açılmaz; bir web sunucusu gerekir. Kendi bilgisayarında `berkai-studyo/` klasöründe:

```
python -m http.server 8000
```

Sonra `http://localhost:8000/ofis/` adresini aç.

**Plan:** girişten müdür odasına uzanan bir koridor. Solda 1 Konu, 2 Yapım, 3 Müşteri; sağda 4 3D Site, 5 Mail ve dinlenme köşesi; koridorun sonunda 6 Müdür odası. Her bölmenin girişinde numaralı tabela, duvarında "Bugün" panosu var.

- **Yürü:** W A S D ya da ok tuşları (Shift: hızlı). Karakterin (beyaz ceket, gözlük) önünde görünür; kamera arkasından izler. **Bak:** fareyi sürükle. **Aç:** bölmeye gir, E. **Ekibe git:** 1–6.
- **Telefonda:** sol alttaki kol ile yürü, ekranı sürükleyerek bak, sağdaki E düğmesiyle aç.
- **Paneller:** üstte özet ve dört sayı, altında "Bugünün işleri". Bir işe tıklayınca dosya büyük pencerede açılır.
- **Demo siteler:** 3D Site bölmesinin duvarındaki ekranlara tıkla, yanına gidip E'ye bas ya da paneldeki "Demoyu aç"ı kullan. Pencerenin başlığında "Yeni sekmede aç" ve "ZIP indir" var.
- **Kararlar:** müdür odası (6), Onayla / Reddet, sonra "Kararları dışa aktar". Dosyayı `gunler/<tarih>/kararlar.json` olarak kaydet.
- **Video çekimi:** `ofis/index.html?tur=1` (ya da `#tur`) → `window.TUR = { sure: 107, sahneler, kare(t) }`, hazır olunca `window.HAZIR = true`. `kare(t)` aynı t için aynı kareyi verir. Demo siteler de `?tur=1` destekler.

Tur sahneleri: Giriş (0–6) · Konu (6–18) · Yapım (18–30) · Müşteri (30–42) · 3D site (42–54) · Demo ekranda (54–69) · Mail (69–81) · Müdür odası ve onay (81–100) · Kapanış (100–107). Karakter koridorda yürür, her bölmeye girer.

## ZIP ve yayın paketi

- `node araclar/site_uret.js <slug>` demo klasörüyle birlikte `siteler/<slug>-Netlify.zip` üretir (index.html kökte; Netlify Drop'a sürükle).
- `node araclar/yayin_paketi.js` ofisi `_yayin/` klasörüne tek köklü paket olarak yazar (git'e girmez): `sayfa.html` (etiketsiz gövde), ofis ve demo dosyaları, görseller, `dosyalar.json` (dosya listesi). Pakette `window.OFIS_YAYIN = true` olur: "ZIP indir" GitHub'daki dosyaya gider, kararlar indirme yerine kopyalanacak metin olarak gösterilir.
- `node araclar/yayin_paketi.js test` paketi tarayıcıda dener (404, konsol hatası, demo penceresi, ZIP bağlantısı, dokunmatik).
- GitHub bağlantısının çalışması için ZIP dosyalarının dala gönderilmiş olması gerekir.

## Araçlar

| Komut | Ne yapar |
|---|---|
| `node araclar/site_olc.js <klasör> <slug>=<url> …` | İşletme sitesini açar, ölçer, masaüstü ve telefon ekran görüntüsü alır |
| `node araclar/aday_tablosu.js <klasör>` | `degerlendirme.json` + ölçümler → `adaylar.json`, `aday_tablosu.csv` |
| `node araclar/site_uret.js <slug>` | Marka ayarından demo klasörü ve `<slug>-Netlify.zip` üretir |
| `node araclar/site_test.js <klasör> <slug> …` | Demoyu 8 kontrolden geçirir, ekran görüntüsü alır |
| `node araclar/site_rapor.js <klasör>` | Test sonuçlarından `test_raporu.md` yazar |
| `node araclar/ofis_veri_uret.js [tarih]` | `gunler/<tarih>/` → `ofis/veri.js` |
| `node araclar/ofis_test.js <klasör>` | Ofisi normal ve tur modunda test eder |
| `node araclar/yayin_paketi.js [test]` | Yayın paketini `_yayin/` altına yazar, isteğe bağlı dener |

Playwright gerektirenler `NODE_PATH=/opt/node-tools/node_modules` ile çalışır. Sunucu açmazlar; dosyaları diskten verirler (`araclar/yerel.js`).

## Yeni bir marka için demo

1. `siteler/_motor/markalar/<slug>.json` yaz (örnek: `o-atolye.json`). Yalnızca doğrulanmış bilgi; etikete "konsept" notu.
2. `node araclar/site_uret.js <slug>`, sonra `site_test.js`.
3. Hazır ürün modelleri: `teneke`, `sise` (düz ya da `bicim: "galon"`), `kavanoz`, `tablet`, `kakao`, `cekirdek`, `degirmen`. Yenisi `site.js` içindeki `MODEL` nesnesine eklenir.

## Bilinen eksikler
- Karakterler kodla çizilmiş sade figürler; yüz ifadesi ve parmak yok.
- Ofis başka günü göstermek için yeniden üretilir: `node araclar/ofis_veri_uret.js 2026-11-11`.
- Yayın sayfasında dosya indirme engelli olduğu için kararlar kopyala-yapıştır ile kaydedilir.
