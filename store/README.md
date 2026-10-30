# SESA KIDS — 3D Pijama Mağazası

Çocuk pijama takımları için baştan sona 3D ve sinematik bir mağaza sitesi.
Ürünler, gerçek fotoğraflardaki desen ve baskılarla giydirilmiş 3D çocuk
figürleriyle sergilenir (Three.js). Figürler her açıdan tutarlıdır; nefes alır,
başını oynatır, göz kırpar, el sallar.

| Bölüm | İçerik |
| --- | --- |
| Vitrin | Her takım kendi sahnesinde; kaydırdıkça bir sonraki figür dönerek gelir, arka plan takımın rengine akar. Sürükleyince 360° döner. |
| Neden SESA KIDS | Cam kartlarda dönen parlak 3D bulut, yıldız ve kalp |
| Pijama dünyası | Altı figür aynı 3D sahnede; üzerine gelince öne çıkıp el sallar, tıklayınca ürün açılır; kız/erkek filtresi figürleri soldurur. Altında gerçek ürün fotoğrafları. |
| Final | Gece göğü, 3D ay ve yıldızlar, bulut üstünde el sallayan figür |
| Ürün detayı | 360° döndürülebilir 3D figür ya da gerçek fotoğraf |

## Gerçek 3D modeller (önerilen)

Her ürün için en iyi sonuç, ürün fotoğrafından bir görselden-3D aracıyla
(Tripo, Meshy, Rodin vb.) üretilmiş modeldir. Site iki biçimi destekler:

- **GLB dosyası (en iyisi):** `assets/models/` içine koyup ürüne
  `model3d: 'assets/models/kalpli-kedi.glb'` ekleyin. Model otomatik olarak
  figür boyuna ölçeklenir, kaideye oturur, ışık ve gölge alır, 360° döner.
- **Turntable videosu:** Tam bir tur dönen video karelere ayrılıp arka planı
  temizlenir (`assets/spin/<ad>/`, `js/spins.js`), ürüne `spin: '<ad>'`
  eklenir. Kamera açısına göre doğru kare gösterilir. Kalpli Kedi takımı şu an
  bu yolla, Tripo videosundan gösteriliyor.

Bunlar yoksa figür kodla çizilir; yüz, ürün fotoğrafındaki gerçek yüzden
çıkarılan 3D yüz yüzeyidir (`js/faces.js`, MediaPipe Face Mesh).

Desenler (kalp, yıldız, çilek, kutup ayısı, araçlar, rakun) kodla çizilen
dikişsiz kumaş dokularıdır; ön baskılar ürün fotoğraflarından kesilir
(`assets/tex/`). Detay ya da sepet açıkken arkadaki sahneler durur.

İlham alınan referans: "VAEL" mont sitesi (sinematik scroll, dev marka yazısı,
numaralı sahneler, kızılötesi mod, detay noktaları, renk seçici).

## Referans video analizi ("Pov: Random Clothing Store in 2027")

| Videoda görülen | Sitede karşılığı |
| --- | --- |
| Beyaz, minimal arayüz; üstte ince bilgi şeridi, ortada menü, sağda arama/hesap/sepet | Aynı üst bölüm, SESA KIDS logosu ile |
| "NEW COLLECTION · PREMIUM STREETWEAR" + büyük başlık, son kelime gri gradyan | "YENİ SEZON · ÇOCUK PİJAMA TAKIMLARI" + "Tatlı rüyalar askıda." |
| Kavisli metal ip üzerinde yan yana asılı ~20 ürün; kenarlarda derinliğe doğru kıvrılıyor | Three.js sahnesi: parabolik ip, ürünler kenarlarda geriye dönüyor |
| Scroll / sürükleme ile raf yatay kayıyor, askılar hafif sallanıyor | Scroll ile raf sonsuz döngüde kayıyor; hıza göre yaylı sallanma; fareyle sürükleme |
| Ürünün üzerine gelince öne çıkıyor | Hover'da ürün öne gelir ve büyür, altta adı/fiyatı görünür |
| Tıklayınca beyaz detay ekranı: büyük askılı ürün, "Close ✕", isim, fiyat, ön/arka, beden, sepete ekle | Aynı yapı: "Kapat", 01/08 sayacı, Ön/Arka, yaş-beden seçimi, Sepete Ekle, önceki/sonraki |
| Sağdan açılan sepet: küçük görsel, adet −/+, silme | Aynı yapı; sepet tarayıcıda saklanır, ürün sepete "uçarak" gider |

## Ürünler

`js/products.js` içinde 360° 3D modelli 12 takım var. Modeller Tripo turntable videolarından üretilir
(`assets/spin/<ad>/`, `js/spins.js`). **Fiyatlar ve bedenler örnektir.**

Yeni model eklemek: Tripo dönüş videosunu karelere ayırıp
`spin_build.py <ad> <kare-klasörü> <kırpma>` ile işleyin (arka plan temizleme,
Real-ESRGAN netleştirme, renk eşitleme, eksen ortalama), sonra ürüne
`spin: '<ad>'` ekleyin. GLB dosyası için `model3d: 'assets/models/x.glb'`.
Koyu desenli kumaşlarda (lacivert, siyah ekose) `KEEP_DARK=1` ile çalıştırın; yoksa
koyu çizgiler arka plan sanılıp silinir.

Ardından ayakların kaideye oturması için zemin hizasını ölçün:

    python3 tools/spin_ground.py <ad> --write

Araç her ayağı tüm kareler boyunca ayrı ayrı izler; ayağın gövdedeki yerini, Tripo
kamerasının eğimini ve dönüş ekseninin zemine değdiği satırı bulur, `spins.js` içine
`ground` olarak yazar. Figür bu satırı kaidenin üst yüzeyine koyar (her model için
kendi değeri; sabit bir ofset kullanılmaz), kaideyi kameranın eğimine uydurur ve her
ayağın altına temas gölgesi çizer. Çıktıdaki `rms` 0,007'den büyükse ayak takibi
güvenilmezdir (genelde kesimde ayak kaybolmuştur); kareleri kontrol edin.

## Çalıştırma

Statik bir sitedir, derleme gerekmez. ES modülleri kullandığı için bir yerel
sunucu üzerinden açın:

```bash
cd store && python3 -m http.server 8000
```

Sonra tarayıcıda `http://localhost:8000` adresini açın. Netlify, Vercel,
GitHub Pages gibi herhangi bir statik barındırmaya `store/` klasörü olduğu gibi
yüklenebilir.

## Dosyalar

- `index.html` — sayfa yapısı (logo SVG olarak içeride)
- `css/style.css` — tasarım, mobil uyum
- `js/story.js` — vitrin: scroll geçişleri, arka plan renkleri, konfeti, etiketler
- `js/figure3d.js` — 3D figürler (GLB, 360° kare dizisi, çizilmiş figür), kumaş desenleri, kaide, ortak 3D sahne
- `js/faces.js`, `js/spins.js` — üretilmiş yüz ve 360° kare verileri
- `vendor/GLTFLoader.js` — Three.js GLB yükleyici (MIT)
- `js/scenes.js` — 3D ikonlar, koleksiyon dizilimi, final sahnesi, detay görüntüleyici
- `vendor/three.module.min.js` — Three.js r160 (MIT)
- `js/garments.js` — pijama takımları, desenler ve çocuk modellerin çizimi
- `js/main.js` — arama, koleksiyon, detay ekranı, sepet

## Sonraki adımlar

- Gerçek ürün fotoğrafları ve fiyatlar
- Ödeme altyapısı (iyzico / PayTR / Shopify) — "Ödemeye Geç" şu an demo
- Üyelik ve sipariş takibi


## Yayına alma

1. `js/config.js` dosyasını doldurun: alan adı (`url`), siparişlerin geleceği WhatsApp numarası
   (`whatsapp`, ülke koduyla, ör. `905551234567`), e-posta, kargo/iade/ödeme metinleri.
2. `node tools/seo_build.mjs` çalıştırın (ürün ya da ayar değişince her seferinde). Ana sayfa
   SEO etiketleri, SSS, `urun/` ve kategori sayfaları, `sitemap.xml`, `robots.txt`, `llms.txt`
   güncellenir. Yayın iş akışı bunu otomatik de yapar.
3. GitHub: Settings → Pages → Source: **GitHub Actions**. `main` dalına her gönderimde
   `.github/workflows/pages.yml` siteyi yayınlar.
4. Alan adı: Settings → Pages → Custom domain'e `www.sesakids.com.tr` yazın ve alan adı
   sağlayıcınızda `www` için `<kullanıcı>.github.io` adresine CNAME kaydı ekleyin.
5. Google Search Console'a siteyi ekleyip `https://www.sesakids.com.tr/sitemap.xml` adresini
   gönderin; Bing Webmaster Tools için de aynısını yapın (ChatGPT araması Bing dizinini kullanır).

## SESA Asistan

Sağ alttaki sohbet, ürünleri `js/products.js`'ten tanır; desen, renk, yaş ve cinsiyete göre
öneri yapar, sepete ekler ve sipariş bilgilerini (ad, telefon, il/ilçe, adres) alır. Sipariş
`config.js`'teki WhatsApp numarasına (müşterinin WhatsApp'ı açılır), `orderEndpoint` adresine
ya da numara yoksa e-posta taslağı olarak iletilir.
