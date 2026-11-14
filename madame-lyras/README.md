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
- **Sayfa yapısı**: Açılış → 3 ürünlük akış → 3B vitrin → Nasıl yapılır → Hakkımızda → İletişim. Tümü aynı koyu bordo / altın tasarım dilinde.

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
