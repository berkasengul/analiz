# Parfumane: teknik sorulara cevap

> Göndermeden önce: köşeli parantezli yerleri ([…]) doldur. Kaynak kodun ve modellerin teslimi ile bakım ücreti senin ticari kararın; aşağıda yaygın kabul gören varsayılan yazıldı.

**Konu:** Re: 3D site: teknik altyapı ve işleyiş

---

Merhaba,

Detaylı sorularınız için teşekkür ederim. Önce yapının genel işleyişini kısaca anlatıp ardından sorularınızı başlık başlık yanıtlıyorum.

**Kısaca:** Sitenizi taşımıyor ya da yerine yeni bir site koymuyoruz. parfumane.com, mevcut WordPress + WooCommerce altyapınızla, aynı alan adında ve aynı sunucuda çalışmaya devam ediyor. Biz yalnızca ziyaretçinin gördüğü katmanı, yani temayı 3D tasarımla yeniliyoruz. Ürünler, fiyatlar, stoklar, siparişler, müşteri hesapları, kuponlar, WPML/WCML, kargo ve vergi kuralları ile PayTR ödeme olduğu gibi WooCommerce'ta kalıyor ve bugün nasıl yönetiyorsanız öyle yönetilmeye devam ediyor.

Bir de önemli bir ayrım: Gördüğünüz demo, tasarımı ve 3D deneyimi göstermek için hazırlanmış bağımsız bir çalışma. Ürün bilgileri sitenizden bir kez alınıp içine yerleştirildi; canlı mağazaya bağlı değil. Aşağıda her konuda hem demonun bugünkü durumunu hem de canlı kurulumun nasıl olacağını ayrı ayrı yazdım.

## Nasıl çalışacak

Sitenizde şu an Woodmart teması ve Elementor kullanıldığını gördük. Önerimiz, Woodmart'ın üzerine bir **alt tema (child theme)** olarak çalışmak:

- Ana sayfa, koleksiyon sayfaları, ürün sayfaları, header ve footer 3D tasarımla yenilenir.
- Elementor ile hazırladığınız diğer sayfalar bozulmadan çalışmaya devam eder; istenirse zamanla aynı tasarım diline uyarlanır.
- Ziyaretçi parfumane.com'a girdiğinde baştan sona yeni tasarımı görür. "Sepete ekle" ürünü doğrudan WooCommerce sepetinize ekler, ödeme WooCommerce'un kendi sayfasında PayTR ile alınır, sipariş panelinize her zamanki gibi düşer.

**Kurulum süreci:**

1. Sitenizin bir test kopyasında (staging) kurulum yapılır. Canlı site bu süreçte hiç etkilenmez.
2. Gerçek ürünler, gerçek sepet, TRY/USD, Türkçe/İngilizce ve PayTR test ödemesiyle uçtan uca test edersiniz.
3. Onayınızla tema canlı sitede etkinleştirilir.
4. Herhangi bir sorunda mevcut temanız tek tıkla geri etkinleştirilebilir; eski tema silinmez.

## 1. Teknoloji ve altyapı

- **3D katmanı:** React ve Three.js (React Three Fiber).
- **Sayfalar:** WordPress tarafından sunucuda üretilmeye devam eder. 3D sahne bu sayfaların üzerine yüklenen bir katmandır.
- **Demo:** Aynı 3D motorun Vite ile derlenmiş, bağımsız bir gösterim sürümü. Netlify'daki adres yalnızca gösterim içindir; canlı kurulumdan sonra kapatılır.
- **Hosting:** Mevcut hostinginiz yeterli; ek bir sunucu ya da yeni alan adı gerekmez. 3D modeller ve dokular daha hızlı yüklenmesi için CDN üzerinden sunulabilir (Cloudflare gibi).

## 2. WooCommerce entegrasyonu

**Ürün, fiyat, stok, varyasyon ve kampanyalar**
- *Demo:* Veriler sitenizden bir kez alındı. WooCommerce'taki değişiklikler demoya yansımaz.
- *Canlı:* Hepsi WooCommerce'tan canlı okunur. Fiyat, indirim, stok, görsel ya da açıklama WooCommerce'ta değiştiğinde 3D tarafında da anında güncellenir. Ayrıca elle yönetilen bir ürün listesi yoktur.

**Sepet**
- *Demo:* Sepetteki yalnızca ilk ürün WooCommerce sepetine aktarılıyor; birden fazla ürün, kupon ve kampanya aktarımı demoda yok.
- *Canlı:* Her ürün, varyasyon ve adet doğrudan WooCommerce'un kendi sepetine eklenir. Kupon, kampanya ve ödeme adımları zaten WooCommerce'un sepet ve ödeme sayfalarında işler.

**Ödeme (PayTR ve diğerleri)**
- Ödeme sayfası WooCommerce'un kendi sayfası olduğu için PayTR entegrasyonunuz değişmeden çalışır. İleride WooCommerce'a eklediğiniz her ödeme yöntemi de otomatik olarak geçerli olur.

**Çoklu para birimi (TRY / USD)**
- *Demo:* Yalnızca TRY.
- *Canlı:* 3D katmanı fiyatı, sitenin o anki para birimiyle, WCML ayarlarınıza göre okur. Ziyaretçi sitede hangi para birimini görüyorsa 3D'de de onu görür. Kurulumda sizin yapılandırmanızla test edilir.

**Türkçe / İngilizce (WPML / WCML)**
- *Demo:* Metinler sitenizden alındı, ancak demonun içinde saklanıyor.
- *Canlı:* Çeviriler WPML'de kalır; 3D katmanı içeriği sayfanın diline göre WooCommerce'tan okur. Ayrı bir çeviri yönetimi olmaz.

**Kargo, vergi ve ülkeye göre ödeme kuralları**
- Tamamen WooCommerce'ta kalır; tema bu kurallara dokunmaz.

## 3. SEO

Demonun bugünkü hâli SEO için tasarlanmadı. Canlı kurulumda SEO yapınız korunur:

- **URL'ler:** Her ürün, koleksiyon, kategori ve blog sayfası bugünkü parfumane.com adresinde kalır. URL değişmediği için 301 yönlendirmesine gerek kalmaz. (Demoda ürünler tek sayfa içinde # ile gösteriliyor; bu yalnızca demoya özgü.)
- **Sunucu tarafı içerik:** Sayfalar WordPress'te sunucuda üretildiği için ürün adı, açıklama, fiyat ve metinler JavaScript çalışmadan kaynak kodda okunur. 3D sahne bu içeriğin üzerine sonradan yüklenir.
- **Meta, canonical, Open Graph:** Mevcut SEO eklentinizden ürün bazında yönetilmeye devam eder.
- **Schema.org (Product, Organization, Breadcrumb):** WooCommerce ve SEO eklentinizin ürettiği yapılandırılmış veri korunur; eksik olan varsa kurulumda tamamlanır.
- **XML sitemap ve robots.txt:** WordPress tarafında mevcut olan devam eder.
- **Blog, kategori ve koleksiyon sayfaları:** WordPress'te bugün nasıl oluşturuyorsanız öyle oluşturmaya devam edersiniz.

## 4. Performans ve mobil

- **Demodaki boyutlar:** Ana JavaScript paketi sıkıştırılmış hâliyle yaklaşık 490 KB. Ürün başına görsel WebP formatında ortalama 30 KB (en fazla ~75 KB).
- **Canlı kurulumda kullanılacaklar:** WebP/AVIF görseller, GLB modeller (Draco/Meshopt sıkıştırma, KTX2 dokular), 3D modül ve modeller için lazy loading (önce sayfa içeriği, sonra 3D) ve CDN. Model başına hedef boyut birkaç yüz KB.
- **Düşük performanslı cihazlar:** Demoda henüz alternatif görünüm yok. Canlı kurulumda cihaz ve WebGL desteği kontrol edilir; gerekirse 3D yerine ürünün yüksek kaliteli görseli gösterilir. Telefon ayarlarında "hareketi azalt" açık olan kullanıcılar için animasyonlar zaten sadeleşiyor.
- **Core Web Vitals:** Demo için ölçülmüş bir PageSpeed raporumuz yok. Canlı kurulumda sayfa içeriği 3D'den önce geldiği için hedefimiz mobilde LCP 2,5 saniyenin altı ve düşük CLS. Kurulum sonrasında ölçüm raporu paylaşılır.

## 5. 3D ürün doğruluğu

- **Demodaki yöntem:** Şişeler sitenizdeki ürün fotoğraflarından üretildi. Fotoğrafın arka planı yapay zekâ ile ayrılıyor, şişenin silüetinden 3D bir form oluşturuluyor ve fotoğraf bu formun üzerine giydiriliyor. Hızlı bir yöntem ama ölçüye dayalı değil; fark ettiğiniz şişe, kapak ve form farklılıkları bundan kaynaklanıyor (özellikle Dolmabahçe serisinin puarlı pompası gibi simetrik olmayan formlarda).
- **Canlı kurulumda:** Her şişe ailesi gerçek ölçüler ve referans fotoğraflar üzerinden ayrıca modellenir (GLB). Ölçüleri paylaşmanız ya da her şişe ailesinden birer numune göndermeniz en doğru sonucu verir. Aynı şişeyi kullanan ürünler aynı modeli paylaşır; etiket ve renk ürüne göre değişir. Demodaki tüm farklılıklar birebir modellerle değiştirilir.
- **Kaynak dosyalar ve haklar:** Proje tesliminde 3D model kaynak dosyaları ve kullanım hakları Parfumane'ye devredilir.

## 6. Yönetim ve sürdürülebilirlik

- **Ürün yönetimi:** Ürünleri WooCommerce panelinizden bugünkü gibi yönetirsiniz. Ürün düzenleme ekranına küçük bir "3D" alanı eklenir; buradan ürünün kullandığı şişe modeli ve sahne rengi seçilir.
- **Yazılımcı ihtiyacı:** Mevcut bir şişeyle yeni bir koku eklemek için yazılımcıya gerek yoktur. Yalnızca yeni bir şişe formu geldiğinde o şişenin modellenmesi gerekir.
- **Yönetim paneli:** Ayrı bir panel yok; bilinçli olarak alıştığınız WordPress/WooCommerce paneli kullanılır.
- **GA4, GTM, Meta Pixel, Merchant Center:** Mevcut kurulumlarınız aynen çalışır. 3D etkileşimleri (ürün görüntüleme, sepete ekleme, "parfümü sık", koku bulucu sonucu) GTM'e olay olarak gönderilir; GA4 ve Meta'da ölçülebilir. Merchant Center ürün akışı WooCommerce'tan geldiği için etkilenmez.
- **Kaynak kod:** Proje tesliminde temanın kaynak kodu size teslim edilir; ileride farklı bir ekip de devam edebilir.
- **Bakım ve destek:** Kurulum sonrasında aylık bakım paketiyle WordPress/WooCommerce güncellemelerine uyum, yeni şişe modelleri ve teknik destek sağlanır. Paketlerin kapsamını ve ücretlerini teklifimde ayrıca sunacağım.
- **Domain ve frontend:** Ayrı bir domain ya da frontend gerekmez; çalışma doğrudan parfumane.com üzerinde yapılır.

## Sonraki adım

Önerim, önce sitenizin test kopyasında ana sayfa vitrini ve birkaç ürün sayfasıyla bir pilot kurmak. Canlı WooCommerce verisi, gerçek sepet, PayTR ve TRY/USD ile uçtan uca test edersiniz; onaylarsanız bütün siteye yayarız. Bunun için:

- WordPress test kopyası (staging) ve bir yönetici hesabı,
- 2–3 şişe ailesinin ölçüleri ya da numuneleri

yeterli olur.

Uygun olursanız bu yapıyı 20–30 dakikalık bir görüşmede ekranda da gösterebilirim.

Saygılarımla,
Berka [Soyadın]
[Telefon] · [Portfolyo]
