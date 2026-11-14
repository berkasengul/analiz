# Genç Anadolu Gıda · 3B tanıtım sitesi

Genç Anadolu Gıda Pazarlama Dağıtım Limited Şirketi için tanıtım sitesi (dondurularak kurutulmuş meyve ve dondurma). Sitede firma adı kullanılır; paket fotoğraflarındaki marka logosu ürünün kendisidir. Satış yok: ürünler, tüm ürünler kataloğu ve afişler, nasıl yapılır, hakkımızda, toptan ve iletişim bölümleri var.

- **Açılış (hero):** React Three Fiber + Three.js + GSAP ile 3B sahne (`src/hero/`). Göz hizasında, lens kaydırmalı kamera (ürün grubu sağda, paketler perspektifle esnemez); masaüstü, tablet ve telefon için ayrı kadraj (`cameraPlan`). Üç katmanlı ışıklı kaide (`stone.js displayPlatform`: yansımalı mermer tabla, pirinç bantlı gövde, kırmızı ve altın ışık halkalı taban) ve kaidenin altında ışık havuzlu stüdyo zemini. Paketler gerçek sınır kutusuyla kaideye oturur (Çilek önde, Şeftali, Hindistan Cevizi, Ananas arkada; adlar görünür). Key/fill/rim ışıklar, ana pakete tepe spotu. Ürünleri çevreleyen altın yörünge çizgisi ve üzerinde kontrollü meyve kompozisyonu. Arka plan ürün sayfalarıyla ortak (`src/juice.js juiceMaterial`). Ana çilek paketi ağır çekimde, çok az döner ve süzülür. Kaydırınca çilek paketi aynı ekran konumu, boyu, bakış açısı ve ışığıyla ürün sahnesine devredilir ve yana savrulmadan ürünler bölümüne iner.
- **Meyve görselleri:** Paketlerin çevresinde uçan parçalar markanın afişlerinden ve ürün fotoğraflarından kesildi (`public/parca/`, `-b` ile bitenler derinlik için bulanık sürüm).
- **Ürün akışı:** 3 ürün (Çilek, Şeftali, Ananas; `src/data.js` listesinin ilk üçü, sayı `src/main.js` içinde `NS`) sabit bir sahnede kaydırmaya bağlı geçer. Paket süzülerek döner, arka plan rengi ve yazı katmanları kaydırma konumuna göre karışır, eski meyveler dağılıp yenileri gelir. Geri kaydırınca geçiş geri sarılır. Kaydırma durunca en yakın ürüne yumuşakça oturur; meyve parçaları paketin önüne gelmez; son ürün kesilmeden aşağıdaki 3B vitrine iner; ürün ekrandayken yazılar tamamen net kalır. Arka planı `src/juice.js`: ürün renginde parlayan merkez, alttan dalgalanan meyve suyu, paketin arkasından geçen su şeridi, bulanık damlalar; paketin çevresinde parlak damlalar. Açılışla ürün sahnesi aynı ışık ortamını kullanır (paket geçişte parlaklık değiştirmez).
- **Tüm ürünler (3B vitrin):** 9 ürün bir şeritte; seçtikçe 3B paket döner ve değişir, bilgileri ve arka plan rengi güncellenir. "3D olarak incele", "E-posta ile sor" ve telefon düğmeleri.
- **3D inceleme:** Pakete, "3D olarak incele" düğmesine ya da vitrindeki pakete tıklayınca açılır. Cam yüzeyli bilgi paneli (e-posta ve telefon düğmeleri), alt kontrol çubuğu (Ön/Yan/Arka/Üst, yakınlaştırma yüzdesi, kendiliğinden dönme, sıfırlama), yanda tüm ürünlerin küçük resimleri ve önceki/sonraki okları. Sürükleyerek çevirme, tekerlek ya da iki parmakla yakınlaştırma, Esc ve geri tuşuyla kapatma. Adres `#incele-<ürün>` ile doğrudan açılabilir.

- **3B sahne** (`src/scene.js`, Three.js): Gerçek ambalaj fotoğrafları düzleştirilip kilitli paket (doypack) modeline giydirildi. Arka etiket bu fotoğrafların renklerinden kendiliğinden çiziliyor. Etrafta her ürünün kendi kurutulmuş meyve parçaları var: çilek, elma halkası, mango küpü, ahududu. Kaydırdıkça paket dönüyor, ürün ve arka plan rengi değişiyor. Süreç bölümünde kırağı parçacıkları çıkıyor.
- **İçerik** (`src/data.js`, `index.html`): Bilgiler ambalajdan ve solagron.com.tr'den alındı (katkısız, şeker ilavesiz, 16 g, 160 g taze çilek; Silifke tesisi, BRCGS/FDA/Helal/Kosher, ihracat).
- **İletişim formu**: Netlify Forms (`name="iletisim"`). Netlify panelinde Forms → Form notifications → Email ile mesajların info@ adresine gelmesi ayarlanır.
- **E-posta ve telefon**: `src/data.js` içindeki `SITE.email` ve `SITE.phone` (şimdilik e-posta `info@gencanadolugida.com.tr`, telefon yer tutucu `+90 (5XX) XXX XX XX`; `phone.tel` boşken telefon düğmeleri iletişim formuna götürür). Sayfa boyunca sağ altta sabit E-posta / Ara düğmeleri; ürün e-postaları ürün adıyla konu satırı doldurulmuş olarak açılır.
- **Ürünler**: 17 paket (solagronmarket.com'daki tüm meyve ve dondurma paketleri; `src/data.js`), hepsi aynı boyutta (dokular 1:1.40). Yeni paket dokuları ve meyve parçaları mağaza görsellerinden üretildi. Vitrinde kategori sekmeleri (Meyveler, Dondurmalar, Atıştırmalık).
- **Hazır gıda (ResQ)**: 6 ürün kartı (`KITS`, görseller `public/img/kit/`), 3D inceleme, toptan teklif ve e-posta düğmeleri. Kitler 3B vitrinde "Hazır gıda" kategorisinde: kasalar ve kova `src/kit3d.js` ile 3B model (ön etiket `public/tex/kit-*-label.webp`), Gevrek ve 70 servis 3B poşet.
- **Ürün içeriği**: Her ürünün `contents` bilgisi (içindekiler, taze meyve karşılığı, saklama vb.) vitrinde ve 3D incelemede "İçerik bilgisi" panelinde; kitlerde yemek menü tablosu (porsiyon, gram, kcal).
- **Açılıştan geçiş**: Kaydırma başlayınca çilek paketi kendiliğinden bir tur döner, düzelir ve dümdüz aşağı iner.
- **Bayilik başvurusu**: Netlify Forms (`name="bayilik"`), Netlify panelinde e-posta bildirimi ayarlanmalı.
- **Sayfa yapısı**: Açılış → 3 ürünlük akış → 3B vitrin → Hazır gıda → Bayilik → Nasıl yapılır → Hakkımızda → İletişim. Tümü aynı koyu bordo / altın tasarım dilinde.

## Çalıştırma

```bash
npm install
npm run dev      # geliştirme
npm run build    # dist/ → Netlify'a yüklenecek klasör
```

## Görseller

- `public/tex/*.webp`: ambalaj fotoğrafları. Çilek, ahududu, elma ve mango solagron.com.tr'den; şeftali, ananas, muz, hindistan cevizi ve dondurma markanın afişlerinden kesildi (önüne meyve gelen alt kısım paket rengiyle tamamlandı)
- `public/img/afis/*.webp`: markanın afişleri
- `public/img/*`: kase ve tabak fotoğrafları (solagron.com.tr)

Daha yüksek çözünürlüklü ambalaj fotoğrafları gelirse aynı adla `public/tex/` içine koymak yeterli (oran ~1024×1180).

## Son güncellemeler
- **Açılış sahnesi**: 7 paket (Çilek önde; Hindistan Cevizi, Kırmızı Ejder, Şeftali, Ananas, Lime, Fıstıklı Dondurma iki yana kademeli yelpaze). Yerleşim `src/hero/HeroCanvas.jsx` içindeki `POUCHES` listesinde.
- **Ürün akışı**: Çilek → Beyaz Ejder Meyvesi → Ananas. İlk kaydırmada çilek paketi ~3 sn'lik ağır çekim bir tur döner; akışa varınca paket "açılır" (meyve parçaları paketten saçılır, ışık halkası yayılır).
- **Geçiş**: Açılışın altı ürün arka planına yumuşakça karışır (`--fade` maskesi), arada çizgi kalmaz.
- **Meyve arka planları**: Solagron ürün görsellerinden `public/bg/<id>.webp`; 3B paketin arkasında görünür.
- **Besin değerleri**: Solagron "Enerji ve Besin Öğeleri" tabloları `data.js` → `NUTRITION`; vitrinde ve 3D incelemede "İçerik ve besin değerleri" panelinde.
- **Hazır gıda (ResQ)**: 3B kit sergisi (sağda büyük 3B kasa/kova/poşet, solda bilgi, menü, teklif; altta kit seçici).
- **Nasıl yapılır**: Ortada büyük 3B Ahududu, 4 adım paketten çıkan oklarla çevresinde; 125 g → 16 g.
- **Yazı tipleri**: Cormorant Garamond (başlıklar) + Jost (metin).
- **Telefon açılışı**: Unbe tarzı; ürünler ortada büyük ve tepeden ışık huzmesi altında, yazılar altta (açıklama ve özellikler telefonda gizli).
- **Vitrine iniş**: Ananas aşağı iner, vitrindeki yerine otururken Fıstıklı Dondurma'ya dönüşür; vitrinde otomatik değişim yok.
- **Bayilik**: Ortalanmış başlık, rakamlar şeridi, 4 avantaj kartı, 4 adımlı süreç ve 3 bölümlü premium başvuru formu (yüzen etiketler).
- **İletişim**: Premium form; bu bölümde 3B paket yok. Bayilik ve iletişimde arka plan marka bordosu.
