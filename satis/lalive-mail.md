# Lalive: mail ve Instagram mesajı

**Mail:** bilgi@lalivenatural.com
**Instagram:** @lalive.natural (DM)
**Ekler (mail):** `lalive-gorseller/1-anasayfa.jpg`, `2-urun-detay.jpg`, `3-telefon.jpg` (zip ekleme)
**Instagram'a:** önce `3-telefon.jpg`, sonra mesaj
**Ne zaman:** Salı–Perşembe, 10:00–11:00 arası

## Konu (birini seç)

1. Lalive için hazırlanmış 3D web sitesi
2. Lalive ürünleri 3D'de: size özel site önerisi

## Mail (firmaya)

Merhaba Lalive ekibi,

Lalive için ürünlerinizi 3D olarak sergileyen bir web sitesi hazırladım, incelemeniz için paylaşıyorum:

👉 [DEMO LİNKİ]

Neler sunuyor:

- **Ürünleriniz 3D:** Kendi fotoğraflarınızdan hazırlandı. Ziyaretçi ürünü kaydırarak inceliyor, çevirip arka etiketini okuyabiliyor.
- **Tüm ürünleriniz hazır:** 77 ürün, 9 kategori; fiyat ve açıklamalar sitenizden alındı.
- **Mevcut mağazanızla çalışıyor:** Sepet Shopify'ınıza bağlı; "Ödemeye geç" müşteriyi doğrudan lalivenatural.com'daki ödeme sayfanıza götürüyor. Yeni bir altyapı gerekmiyor.
- **Telefona özel tasarım**, ürün arama ve Türkçe/İngilizce.

Amaç, ürünlerinizi diğer doğal bakım markalarından ayıran, mağazada inceler gibi bir alışveriş deneyimi sunmak.

Beğenirseniz siteyi kendi alan adınıza kurup isteklerinize göre son hâline getirebilirim. Fiyat ve süre bilgisini bu maile yanıt olarak hemen iletirim.

İyi çalışmalar,
Berka [Soyadın]
[Telefon] · [Instagram / portfolyo]

_Site size özel hazırlandı; arama motorlarına kapalıdır, yalnızca bu linkle açılır._

## Instagram mesajı (DM, firmaya)

Merhaba Lalive ekibi 🌿

Lalive için ürünlerinizi 3D olarak sergileyen bir web sitesi hazırladım. Ürünler kendi fotoğraflarınızdan 3D, 77 ürünün tamamı hazır ve sepet mevcut Shopify mağazanıza bağlı; yeni bir altyapı gerekmiyor.

Telefondan bir dakikada inceleyebilirsiniz: [DEMO LİNKİ]

Detayları bilgi@lalivenatural.com adresine de gönderdim. Beğenirseniz kendi alan adınıza kurabilirim 🙏

## Takip (cevap gelmezse 4 gün sonra, aynı mail zincirinde "Yanıtla")

Merhaba Lalive ekibi,

Geçen hafta Lalive için hazırladığım 3D web sitesini paylaşmıştım; gözden kaçmış olabileceği için tekrar iletiyorum:

👉 [DEMO LİNKİ]

Kısa bir geri dönüşünüz bile benim için değerli.

İyi çalışmalar,
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
