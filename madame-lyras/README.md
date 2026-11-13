# Madame Lyra's · 3B tanıtım sitesi

Dondurularak kurutulmuş meyve markası için tanıtım sitesi. Satış yok: ürünler, nasıl yapılır, hakkımızda, toptan ve iletişim bölümleri var.

- **3B sahne** (`src/scene.js`, Three.js): Gerçek ambalaj fotoğrafları düzleştirilip kilitli paket (doypack) modeline giydirildi. Arka etiket bu fotoğrafların renklerinden kendiliğinden çiziliyor. Etrafta her ürünün kendi kurutulmuş meyve parçaları var: çilek, elma halkası, mango küpü, ahududu. Kaydırdıkça paket dönüyor, ürün ve arka plan rengi değişiyor. Süreç bölümünde kırağı parçacıkları çıkıyor.
- **İçerik** (`src/data.js`, `index.html`): Bilgiler ambalajdan ve solagron.com.tr'den alındı (katkısız, şeker ilavesiz, 16 g, 160 g taze çilek; Silifke tesisi, BRCGS/FDA/Helal/Kosher, ihracat).
- **İletişim formu**: Netlify Forms (`name="iletisim"`). Netlify panelinde Forms → Form notifications → Email ile mesajların info@ adresine gelmesi ayarlanır.
- **E-posta**: `src/data.js` içindeki `SITE.email` ve `index.html`'deki mailto (şimdilik `info@madamelyras.com.tr`, alan adı kesinleşince değişecek).

## Çalıştırma

```bash
npm install
npm run dev      # geliştirme
npm run build    # dist/ → Netlify'a yüklenecek klasör
```

## Görseller

- `public/tex/*.webp`: ambalaj fotoğrafları (solagron.com.tr/urunler), düzleştirilmiş ve kırpılmış
- `public/img/*`: kase ve tabak fotoğrafları (solagron.com.tr)

Daha yüksek çözünürlüklü ambalaj fotoğrafları gelirse aynı adla `public/tex/` içine koymak yeterli (oran ~1024×1180).
