# Lalive: mail ve Instagram mesajı

**Mail:** bilgi@lalivenatural.com
**Instagram:** @lalive.natural (DM)
**Ekler (mail):** `lalive-gorseller/1-anasayfa.jpg`, `2-urun-detay.jpg`, `3-telefon.jpg` (zip ekleme)
**Instagram'a:** önce `3-telefon.jpg`, sonra mesaj
**Ne zaman:** Salı–Perşembe, 10:00–11:00 arası

## Konu (birini seç)

1. Lalive için bir site hazırladım
2. Lalive ürünleri 3D'de: size özel hazırladığım site
3. Lal Hanım, Lalive için küçük bir sürprizim var

## Mail

Merhaba Lal Hanım,

Ben Berka. Markalar için 3D ürün siteleri hazırlıyorum. Lalive'ın Koruoba'daki zeytinliklerden başlayan hikâyesini okuyunca, bu ürünlerin internette de elde tutuluyormuş gibi görünmesi gerektiğini düşündüm ve size bir site hazırladım:

👉 [DEMO LİNKİ]

Telefondan açıp bir dakika kaydırmanız yeterli. Kısaca neler var:

- Ürünleriniz kendi fotoğraflarınızdan 3D hâle getirildi. Sayfayı kaydırdıkça sırayla öne çıkıyorlar; ürünü parmağınızla çevirince arka etiketi okunuyor.
- Sitenizdeki 77 ürünün tamamı; fiyatlar, açıklamalar ve kategoriler sizin sitenizden.
- Ürün arama, Türkçe/İngilizce ve telefona özel tasarım.
- Sepet mevcut Shopify mağazanıza bağlı. "Ödemeye geç" dediğinizde ürünler lalivenatural.com'daki kendi ödeme sayfanıza geçiyor. Yani yeni bir altyapı ya da ek bir sistem gerekmiyor.

Derdim şu: Lalive'ın ürünleri çok güzel ama internette hâlâ düz fotoğraflarla, diğer markalarla aynı şekilde sergileniyor. Bu site, ziyaretçinin ürünü mağazadaki gibi yakından görmesini ve Lalive'ı ilk bakışta ayırt etmesini sağlıyor.

Beğenirseniz siteyi kendi alan adınıza kurar, son rötuşları sizin isteklerinize göre yaparım. Fiyat ve süre bilgisini isterseniz hemen iletirim. Beğenmezseniz de kısa bir "şimdilik değil" cevabı benim için yeterli.

Sevgiler,
Berka [Soyadın]
[Telefon] · [Instagram / portfolyo]

_Not: Bu site size özel ve bağımsız olarak hazırlandı. Arama motorlarına kapalı, yalnızca bu linkle açılıyor ve siz istediğiniz an kaldırılır._

## Instagram mesajı (DM)

Merhaba Lal Hanım 🌿

Ben Berka, markalar için 3D ürün siteleri yapıyorum. Lalive için size özel bir site hazırladım: ürünleriniz kendi fotoğraflarınızdan 3D, kaydırdıkça sırayla öne çıkıyor, sepet de mevcut Shopify mağazanıza bağlı.

Telefondan bir dakikada bakabilirsiniz: [DEMO LİNKİ]

Beğenirseniz kendi alan adınıza kurarım; detayları mailinize de yazdım (bilgi@lalivenatural.com). Görüşünüzü duymak çok sevindirir 🙏

## Takip (cevap gelmezse 4 gün sonra, aynı mail zincirinde "Yanıtla")

Merhaba Lal Hanım,

Geçen hafta Lalive için hazırladığım siteyi paylaşmıştım, gözünüzden kaçmış olabilir diye kısaca tekrar yazıyorum:

👉 [DEMO LİNKİ]

Bir dakikalık bir bakış yeter. İlgilenmezseniz bir satırlık cevap bile benim için değerli.

Sevgiler,
Berka

## Göndermeden önce

- [ ] Siteyi yayınla (aşağıdaki adımlar) ve linki kendi telefonunda ve bilgisayarında aç.
- [ ] Linkte bir ürünü sepete ekleyip "Ödemeye geç"e bas: Lalive'ın ödeme sayfası açılmalı (ödeme yapma).
- [ ] `[DEMO LİNKİ]`, soyadını, telefonunu ve Instagram/portfolyo linkini doldur.
- [ ] Mailde üç görseli ekle; Instagram'da önce telefon görselini, sonra mesajı at.
- [ ] Kendine bir test maili at: link tıklanıyor mu, görseller açılıyor mu?
- [ ] Gönderdikten sonra `satis/parfum-firmalari.csv` dosyasında Lalive satırına tarihi yaz.

## Siteyi yayınlama (gizli link, Netlify)

1. `demolar/lalive` klasöründe terminalde: `npm run build` (içinde `dist` klasörü oluşur).
2. https://app.netlify.com/drop adresine git; ücretsiz hesap aç ya da giriş yap (hesapsız yüklenen site 1 saat sonra silinir).
3. `dist` klasörünü sayfaya sürükle bırak. Birkaç dakika içinde `rastgele-isim.netlify.app` gibi bir link verir.
4. İstersen Site configuration → Change site name ile `lalive-3d-demo` gibi bir adla değiştir.
5. Link arama motorlarına kapalı (noindex + robots). Marka istemezse Netlify'da siteyi silmen yeterli.

## Fiyat sorarlarsa

Hope Istanbul teklifindeki paketler temel alınır (₺59.000 / ₺99.000 / ₺159.000). Lalive'a özel teklif PDF'i hazırlanabilir.
