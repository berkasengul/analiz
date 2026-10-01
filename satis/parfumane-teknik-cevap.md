# Parfumane: teknik sorulara cevap (taslak)

> Göndermeden önce: köşeli parantezli yerleri ([…]) doldur. Fiyat, bakım ücreti ve teslim/hak devri maddeleri senin ticari kararın; taslakta yaygın kabul gören bir varsayılan yazıldı, istersen değiştir.

**Konu:** Re: 3D site: teknik altyapı soruları

---

Merhaba,

Detaylı sorularınız için teşekkür ederim; hepsini aşağıda başlık başlık yanıtladım. Başlamadan önce önemli bir ayrım yapmak istiyorum, çünkü cevapların çoğu buna bağlı:

- **Şu an gördüğünüz demo**, tasarımı ve 3D deneyimi göstermek için hazırlanmış bağımsız bir vitrin. Ürün verisi parfumane.com'dan bir kez alınıp içine yerleştirildi; canlı bir mağaza değil.
- **Canlı kullanım için önerdiğim yapı** ise WooCommerce'u tek kaynak olarak koruyan, 3D'yi mevcut parfumane.com'un içine yerleştiren bir yapı. Aşağıda her soru için hem bugünkü durumu hem de canlı yapıyı yazdım.

## Önerilen yapı (özet)

3D katmanı ayrı bir site olarak değil, **mevcut parfumane.com'un içinde** çalışır: ana sayfa vitrini, koleksiyon sayfaları ve ürün sayfasındaki 3D görüntüleyici. WordPress/WooCommerce olduğu gibi kalır; ürün, fiyat, stok, çeviri, para birimi, sepet, kupon, kargo, vergi ve PayTR ödeme tamamen WooCommerce'ta yönetilmeye devam eder. 3D katmanı bu verileri WooCommerce'tan canlı okur ve sepete WooCommerce'un kendi sepet altyapısıyla ekler.

Bu yapının avantajı: SEO, URL'ler, ödeme ve yönetim alışkanlıklarınız değişmez; 301 yönlendirmesine gerek kalmaz; risk en düşük olur.

Alternatif olarak tamamen ayrı bir "headless" ön yüz (Next.js, sunucu tarafı render, WooCommerce arka planda) da kurulabilir. Ancak bu, URL eşleştirme, 301 yönlendirmeleri ve iki sistemin bakımı demek; sizin ihtiyaçlarınız için öncelikle ilk yapıyı öneririm.

## 1. Teknoloji ve altyapı

- **Demo:** React 18, Three.js (React Three Fiber ile), Vite ile derlenmiş statik bir tek sayfa uygulaması. Netlify'da yalnızca gösterim için duruyor.
- **Canlı yapı:** Aynı React + Three.js 3D modülü, WordPress temanıza bir bileşen (kısa kod / blok) olarak eklenir. Sayfaların kendisi WordPress tarafından sunucuda üretilmeye devam eder.
- **Hosting:** Mevcut WordPress barındırmanız yeterli; 3D dosyaları (modeller, dokular, JS paketi) bir CDN üzerinden sunulur (ör. Cloudflare veya BunnyCDN). Ek bir uygulama sunucusu gerekmez.

## 2. WooCommerce entegrasyonu

**Ürün, fiyat, stok, varyasyon, kampanya**
- *Demo:* Veriler parfumane.com'dan bir kez çekilip demoya yerleştirildi. WooCommerce'ta yapılan değişiklikler demoya yansımaz.
- *Canlı:* Hepsi WooCommerce Store API'den sayfa açıldığında canlı okunur. Fiyat, indirimli fiyat, stok durumu, varyasyonlar, görsel ve açıklama WooCommerce'ta değiştiği anda 3D tarafında da güncellenir; ayrıca manuel yönetilen bir ürün listesi olmaz.

**Sepet**
- *Demo:* Sepete eklenen **ilk ürün** WooCommerce sepetine adres üzerinden aktarılıyor. Birden fazla ürün, kupon ve kampanya aktarımı demoda yok. Bunu açıkça belirtmek isterim.
- *Canlı:* 3D katmanı aynı alan adında çalıştığı için ürünleri doğrudan WooCommerce'un kendi sepetine ekler (Store API). Böylece her ürün, varyasyon ve adet gerçek sepete düşer. Kupon, kampanya ve ödeme adımları zaten WooCommerce'un kendi sepet ve ödeme sayfalarında işler.

**Ödeme (PayTR ve diğerleri)**
- Ödeme adımı WooCommerce'un kendi ödeme sayfasında kaldığı için mevcut PayTR entegrasyonunuz değişmeden çalışır. İleride WooCommerce'a ekleyeceğiniz her ödeme yöntemi de otomatik olarak geçerli olur; 3D tarafında ayrıca bir iş gerekmez.

**Çoklu para birimi (TRY / USD)**
- *Demo:* Yalnızca TRY.
- *Canlı:* 3D katmanı fiyatı WooCommerce'tan, sitenin o anki para birimiyle (WCML ayarınıza göre) okur; ziyaretçi sitede hangi para birimini görüyorsa 3D'de de onu görür. Kurulumda sizin WCML yapılandırmanızla birlikte test edilir.

**Türkçe / İngilizce (WPML / WCML)**
- *Demo:* Türkçe ve İngilizce metinler sizin sitenizden alındı, ancak demonun içinde saklanıyor.
- *Canlı:* Çeviriler WPML'de kalır; 3D katmanı sayfanın diline göre (/en/ vb.) içeriği WooCommerce'tan o dilde okur. Ayrıca bir çeviri yönetimi olmaz.

**Kargo, vergi ve ülkeye göre ödeme kuralları**
- Tamamen WooCommerce'ta kalır; 3D katmanı bu kurallara dokunmaz.

## 3. SEO

Bu konuda demonun bugünkü hâli SEO için uygun **değildir**; canlı yapının en önemli gerekçesi de bu.

- **Taranabilir URL:** Demoda ürünler tek sayfa içinde, adres çubuğundaki # ile gösteriliyor; Google bunları ayrı sayfa olarak görmez. Canlı yapıda her ürün ve koleksiyon, bugünkü parfumane.com adresinde kalır.
- **Sunucu tarafı render:** Canlı yapıda sayfalar WordPress tarafından sunucuda üretilir; ürün adı, açıklama, fiyat ve metinler JavaScript çalışmadan kaynak kodda okunur. 3D sahne bu içeriğin üzerine sonradan yüklenen bir katmandır.
- **Meta title, description, canonical, Open Graph:** Mevcut SEO eklentinizden (Yoast / Rank Math vb.) ürün bazında yönetilmeye devam eder.
- **Schema.org (Product, Organization, Breadcrumb):** WooCommerce ve SEO eklentinizin ürettiği yapılandırılmış veri olduğu gibi kalır; eksik olan varsa kurulumda tamamlanır.
- **XML sitemap ve robots.txt:** WordPress tarafında mevcut olan devam eder.
- **URL yapısı ve 301:** Önerilen yapıda URL'ler değişmediği için yönlendirme gerekmez. Ayrı bir ön yüz tercih edilirse tüm eski adresler için 301 eşleştirme tablosu hazırlanır.
- **Blog, kategori, koleksiyon sayfaları:** WordPress'te nasıl oluşturuyorsanız öyle oluşturulmaya devam eder; istenen sayfalara 3D vitrin bileşeni eklenir.

## 4. Performans ve mobil

- **Bugünkü demo:** Ana JS paketi sıkıştırılmış hâliyle yaklaşık 490 KB. Ürün başına görsel, WebP formatında ortalama 30 KB (en fazla ~75 KB). Demoda ayrı bir 3D model dosyası yok; 3D form, ürün fotoğrafından tarayıcıda üretiliyor (aşağıda açıklıyorum).
- **Canlı yapıda optimizasyonlar:** WebP/AVIF görseller, GLB modeller Draco/Meshopt ile sıkıştırılmış ve dokular KTX2 formatında, 3D modülü ve modeller lazy loading ile (sayfa içeriği önce, 3D sonra), tüm statik dosyalar CDN üzerinden. Model başına hedef boyut birkaç yüz KB.
- **Düşük performanslı cihazlar:** Demoda henüz alternatif görünüm yok. Canlı yapıda cihaz ve WebGL desteği kontrol edilir; gerekirse 3D yerine ürünün yüksek kaliteli görseli (veya kısa döngü videosu) gösterilir. "Hareketi azalt" ayarı açık olan kullanıcılarda animasyonlar zaten sadeleşiyor.
- **Core Web Vitals:** Demo için ölçülmüş bir PageSpeed raporum yok. Canlı yapıda sayfa içeriği WordPress'ten geldiği için LCP, 3D'den bağımsız olarak ürün görseli ve metinle oluşur; hedefimiz mobilde LCP 2,5 saniyenin altı ve düşük CLS. Kurulum sonrasında ölçüm raporu paylaşılır.

## 5. 3D ürün doğruluğu

- **Demodaki yöntem:** Şişeler, sitenizdeki ürün fotoğraflarından üretildi: fotoğrafın arka planı yapay zekâ ile ayrılıyor, şişenin silüetinden 3D bir form oluşturuluyor ve fotoğraf bu formun üzerine giydiriliyor. Hızlı ve ürün başına hafif bir yöntem; ancak ölçüye dayalı değil. Fark ettiğiniz şişe, kapak ve form farklılıkları bu yüzden (özellikle Dolmabahçe serisinin puarlı pompası gibi simetrik olmayan formlarda).
- **Canlı yapı için:** Her şişe ailesi gerçek ölçüler ve referans fotoğraflar üzerinden ayrıca modellenir (GLB). Ölçüleri sizin paylaşmanız ya da birer numune göndermeniz en doğru sonucu verir. Aynı şişeyi kullanan ürünler aynı modeli paylaşır; etiket ve renk ürüne göre değişir. Demodaki tüm farklılıklar birebir modellerle değiştirilebilir.
- **Kaynak dosyalar ve kullanım hakları:** Proje tesliminde 3D model kaynak dosyaları (GLB ve düzenlenebilir kaynak) ile kullanım hakları Parfumane'ye devredilir. [Bu maddeyi kendi koşuluna göre kontrol et.]

## 6. Yönetim ve sürdürülebilirlik

- **Ürün ekleme / değiştirme:** Ürünler WooCommerce panelinizden yönetilir. Mevcut bir şişe ailesine yeni bir koku eklemek için yazılımcıya gerek kalmaz; ürün düzenleme ekranına eklenecek bir alandan şişe modeli ve sahne rengi seçilir. Yeni bir şişe formu geldiğinde yalnızca o şişenin modellenmesi gerekir.
- **Yönetim paneli:** Ayrı bir panel yok; bilinçli olarak WooCommerce paneliniz kullanılır.
- **GA4, GTM, Meta Pixel, Merchant Center:** Sitenizdeki mevcut kurulumlar aynen çalışır. 3D etkileşimleri (ürün görüntüleme, sepete ekleme, "parfümü sık", koku bulucu sonucu) dataLayer olayı olarak GTM'e gönderilir; GA4 ve Meta tarafında ölçülebilir. Merchant Center ürün akışı WooCommerce'tan geldiği için etkilenmez.
- **Kaynak kod:** Proje tesliminde 3D modülünün kaynak kodu size teslim edilir. [Kontrol et.]
- **Bakım ve destek:** [Aylık bakım paketi: güncellemeler, yeni şişe modelleri, teknik destek; kapsam ve ücret.] WordPress ve WooCommerce güncellemelerinde 3D modülünün uyumluluğu bu kapsamda takip edilir.
- **Domain:** Ayrı bir domain veya ön yüz gerekmez; proje doğrudan parfumane.com üzerinde çalışır.

## Sonraki adım

İsterseniz önce tek bir ürün sayfası ve ana sayfa vitrini üzerinde, sizin test (staging) ortamınızda bir pilot kurabiliriz: canlı WooCommerce verisi, gerçek sepet, PayTR ve TRY/USD ile uçtan uca test edersiniz, ardından bütün siteye yayarız. Bunun için staging erişimi ve 2–3 şişe ailesinin ölçüleri yeterli.

Uygun olursanız bunları 20–30 dakikalık bir görüşmede ekranda da gösterebilirim.

Saygılarımla,
Berka [Soyadın]
[Telefon] · [Portfolyo]
