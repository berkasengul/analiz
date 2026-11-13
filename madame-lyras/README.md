# Genç Anadolu Gıda · 3B tanıtım sitesi

Genç Anadolu Gıda Pazarlama Dağıtım Limited Şirketi için tanıtım sitesi (dondurularak kurutulmuş meyve ve dondurma). Sitede firma adı kullanılır; paket fotoğraflarındaki marka logosu ürünün kendisidir. Satış yok: ürünler, tüm ürünler kataloğu ve afişler, nasıl yapılır, hakkımızda, toptan ve iletişim bölümleri var.

- **Açılış (hero):** React Three Fiber + Three.js + GSAP ile ayrı bir 3B sahne (`src/hero/`). Koyu mermer sergileme platformu (masaüstünde gerçek yansımalı yüzey) üstünde gerçek doypack geometrisiyle paketler (yan dikiş kanatları, üst kaynak tırtılları, fermuar sırtı, alt körük, film kırışıklıkları; orijinal ambalaj fotoğrafları doku olarak), her paketin altında temas gölgesi, gerçek gölgeler (masaüstünde gölge haritası + N8AO ambient occlusion, her yerde yumuşak temas gölgeleri), ışık şekillendiricilerle yansımalar, fotoğraflardan hacim verilmiş PBR meyve kabartmaları (yüzey kabartması, taze meyvede parlak cila; dengeli kompozisyon, farklı derinlik ve hızlarda), bordo–kırmızı sinematik arka plan, paketlerin arkasında ışık patlaması ve hacimli huzmeler, korlar. GSAP ile giriş animasyonu, fareyle perspektif. Kaydırma başlayınca açılıştaki çilek paketi, aynı ekran konumunda ürün sahnesindeki paketle değiştirilir; diğer paketler ve kaide açılışla yukarı kayar, çilek paketi kaydırmanın ilk pikselinden itibaren kavis çizip hafifçe dönerek ürünler bölümündeki Çilek yerine oturur. Mobilde efekt katmanı ve gölge haritası kapalı, çözünürlük düşük; hero görünmezken çizim durur.
- **Meyve görselleri:** Paketlerin çevresinde uçan parçalar markanın afişlerinden ve ürün fotoğraflarından kesildi (`public/parca/`, `-b` ile bitenler derinlik için bulanık sürüm).
- **Ürün akışı:** 9 ürün sabit bir sahnede kaydırmaya bağlı geçer. Paket süzülerek döner, arka plan rengi ve yazı katmanları kaydırma konumuna göre karışır, eski meyveler dağılıp yenileri gelir. Geri kaydırınca geçiş geri sarılır. Kaydırma durunca en yakın ürüne yumuşakça oturur; ürün ekrandayken yazılar tamamen net kalır.
- **3D inceleme:** Pakete, "3D olarak incele" düğmesine ya da katalog kartına tıklayınca açılır. Sürükleyerek çevirme, tekerlek ya da iki parmakla yakınlaştırma, Ön/Yan/Arka/Üst görünümler, önceki/sonraki ürün, Esc ve geri tuşuyla kapatma. Adres `#incele-<ürün>` ile doğrudan açılabilir.

- **3B sahne** (`src/scene.js`, Three.js): Gerçek ambalaj fotoğrafları düzleştirilip kilitli paket (doypack) modeline giydirildi. Arka etiket bu fotoğrafların renklerinden kendiliğinden çiziliyor. Etrafta her ürünün kendi kurutulmuş meyve parçaları var: çilek, elma halkası, mango küpü, ahududu. Kaydırdıkça paket dönüyor, ürün ve arka plan rengi değişiyor. Süreç bölümünde kırağı parçacıkları çıkıyor.
- **İçerik** (`src/data.js`, `index.html`): Bilgiler ambalajdan ve solagron.com.tr'den alındı (katkısız, şeker ilavesiz, 16 g, 160 g taze çilek; Silifke tesisi, BRCGS/FDA/Helal/Kosher, ihracat).
- **İletişim formu**: Netlify Forms (`name="iletisim"`). Netlify panelinde Forms → Form notifications → Email ile mesajların info@ adresine gelmesi ayarlanır.
- **E-posta**: `src/data.js` içindeki `SITE.email` ve `index.html`'deki mailto (şimdilik `info@gencanadolugida.com.tr`, alan adı kesinleşince değişecek).

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
