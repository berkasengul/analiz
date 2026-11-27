# Turkish Coffee Lady · Bold Istanbul (tek ürün + hikâye)

Önceki 5 tatlı konsept sitenin aynısı, tek ürüne (Bold Istanbul) indirilmiş ve
"Bir Fincan Cesaret" belgeseli üzerine kurulu bir hikâye katmanı eklenmiş hali.

## Sayfalar
Çok sayfalı (adres çubuğunda `#/...`), sade düzen:
- **Ana sayfa** (`/`): tek bir kaydırmalı 3D sahne (paket → yırt → aç → kaşık → kahve taneleri kutuya dönüşür → buğu →
  kamera geri çekilip paket ve kutuyu kemerle birlikte tam kadraja alır; kaide ve kemer sabit), ardından film bölümü,
  kısa giriş ve üç kapı: Ürün, Hikâye, Film. Kaidedeki kutuya tıklamak 3D İncele sayfasını açar.
- **Ürün** (`#/urun`): ürün hikâyesi, ön/arka kutu geçişi, içindekiler, besin değerleri, kutu bilgisi.
- **Hikâye** (`#/hikaye`): Boston'dan Alexandria'ya 8 perde; "Filmde izle" filmin o anına götürür (`#/film?t=...`).
- **Film** (`#/film`): 36 dk belgesel, 15 bölüm.
- **İletişim** (`#/iletisim`): iletişim bilgileri, form (e-posta ile), SSS.
- **3D İncele** (`#/incele`): kutu sürükleyerek çevrilir, yakınlaştırılır; Ön/Yan/Arka ve etiket bilgi noktaları
  (`site/film/open/viewer.js`).

3D sahne yalnızca ana sayfada çalışır; alt sayfalarda durdurulur. TR/EN dil düğmesi tüm sayfalarda çalışır.

## Klasörler
- `site/`: Netlify'a olduğu gibi yüklenecek klasör.
  `site/film/bir-fincan-cesaret.mp4` repoda yok (80 MB); yayından önce bu yola koyun.
- `kaynak/`: orijinal bundle (okunabilir hali), yamalar (`patch.py`) ve yeni bölümler (`extra.js`).
  Stil: `site/film/film.css`.
- `transkript/`: belgeselin zaman damgalı transkripti (alıntılar ve bölüm saatleri buradan).

## 3D kutu (gerçek ambalaj)
3D kutu, `site/assets/bold-istanbul-real-*.webp` dokusundan üretilir (2560×1280; sol yarı ön, sağ yarı arka).
- Ön yüz: markanın resmi Bold Istanbul render'ı, birebir.
- Arka yüz: gerçek kutudan yeniden çizildi: hanım logosu + "Art Work: hasankale" (fotoğraftan, ışık düzeltmeli),
  besin tablosu, "Established 2017" bloğu, içindekiler, "Discover Your Daily Coffee Wisdom", QR ve barkod.
  Panel içeriği silindire göre bükülüp ön render'ın ışığıyla gölgelendirildi.
- Gövde silüeti (`kaynak/geom.json`) gerçek kutunun kenarından hesaplandı.
- QR ve barkod fotoğraftan okunamadı; görsel olarak çizildi, taranınca çalışmaz.
  Gerçek QR bağlantısı ve barkod numarası gelirse `kaynak/kutu/` içinden yeniden üretilir.
- Yeniden üretim: `kaynak/kutu/strip.html` → `strip.png` (arka etiket), sonra `python3 compose.py`.

## Kaydırmalı açılış (paket → kutu)
Katmanlı bir film; tüm katmanlar aynı 16:9 kutuda, kaydırma ilerlemesinin saf fonksiyonu (ileri/geri kusursuz):
1. **Sahne (paket):** `site/film/open/sahne-paket.webp`: İstanbul gece manzarası, mermer masa, fincan, cezve; paket büyük ve önde.
   Üst kapama şeridi ayrı katman (`serit.webp`): "Yırt" adımında koparak uçar.
2. **Yakınlaşma ve video:** sahne pakete yaklaşır ve aynı karede Higgsfield filmine geçer
   (`acilis-1920.mp4`, telefonda `acilis-1280.mp4`, 10,5 sn). Film, İstanbul sahnesindeki 4K Higgsfield videosundan
   kurgulandı; videodaki "kaşık kahveyi pakete geri döker" hatası çıkarıldı (`kaynak/sahne/`):
   `spoon.py` + `spoonmove.py` dolu kaşığı 5,0. saniyedeki kareden ayırıp paketin dışına taşır (arka plan temizlenir),
   `pour4.py` kaşıktaki kahveyi gerçek renkleriyle toz bulutuna çevirip paketin çevresinde döndürür ve videonun
   8,1. saniyesindeki girdaba hizalı geçişle bağlar; sonrası (girdap → kutu) orijinal video.
   Kaydırma → film zamanı eşlemesi `TclOpenGeo.knots`; telefonda kamera dışarı çıkan kaşığı takip eder.
3. **Sahne (kutu):** filmin son karesi `sahne-kutu.webp` ile birebir örtüşür (ORB ile ölçüldü). Bu karedeki kutu gerçek etiketle
   yeniden kaplandı (`relabel.py`), yazılar net ve doğru.
   Kutuya tıklayınca `#/incele`.
- Hizalama değerleri `TclOpenGeo` (`kaynak/extra.js`); adım eşikleri `TclOpenSteps`.
- Sahne görsellerinin üretimi `kaynak/sahne/`: `clean.py` (referanstaki arayüz yazılarını siler), `sr.py` (EDSR 4× büyütme),
  `compose.py` (paketi kaldırıp kutuyu kahve tepeciği, gölge ve mermer yansımasıyla yerleştirir), `tear.py` (şerit katmanı).
- `site/film/open/opening.js` yalnızca 3D İncele sayfasının kutu/stüdyo parçalarını sağlar (`viewer.js`).
- Paket etiketi `site/film/open/bag-front.webp` / `bag-back.webp`; kaynakları `kaynak/paket/`.
