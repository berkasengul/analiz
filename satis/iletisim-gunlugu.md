# İletişim günlüğü

Kime ne gönderildi, kimden ne geldi, ne konuşuldu, sırada ne var. Her yeni mesajda buraya bir satır eklenir; gelen ve giden metinlerin tam hâli `yazismalar/<firma>/` klasöründe saklanır.

**Kurallar**
- Tarih biçimi: GG.AA.YYYY. Bilinmeyen bilgi "bilinmiyor" yazılır, tahmin yazılmaz.
- Yön: **Giden** (biz gönderdik) · **Gelen** (onlar yazdı) · **Görüşme** (telefon/toplantı) · **Not** (iç karar).
- Firmanın genel durumu ayrıca `parfum-firmalari.csv`'de güncellenir.

---

## Kronolojik kayıt

| Tarih | Firma | Yön | Kanal | Kimden → Kime | Özet | Dosya |
|---|---|---|---|---|---|---|
| bilinmiyor | Parfumane | Giden | E-posta | Berka → Parfumane (muhtemelen sales@parfumane.com; doğrula) | İlk satış maili + 3D demo linki | taslak: `parfumane-mail.md` |
| 01.10.2026 | Parfumane | Gelen | E-posta | Parfumane ("PARFUMANE" imzalı) → Berka | Demo için teşekkür; teknik sorular: altyapı, WooCommerce entegrasyonu, PayTR, TRY/USD, WPML/WCML, SEO, performans, 3D doğruluğu, kaynak kod ve model hakları, bakım | `yazismalar/parfumane/2026-10-01-gelen-teknik-sorular.md` |
| 01.10.2026 | Parfumane | Not | — | — | Sitelerinde Woodmart teması + Elementor + WPML + LiteSpeed Cache olduğu tespit edildi. Karar: yeni site değil, Woodmart üzerine alt tema; WooCommerce olduğu gibi kalır, staging'de pilot | — |
| 01.10.2026 | Parfumane | Giden | E-posta | Berka → Parfumane (gelen maile yanıt) | Teknik cevap: mevcut site ve alan adı korunur, alt tema yaklaşımı, staging'de kurulum ve tek tıkla geri dönüş; her soruda demo ile canlı kurulum ayrımı; demonun eksikleri açıkça yazıldı; kaynak kod ve 3D modellerin teslimde devredileceği söylendi; bakım paketi kapsam ve ücretinin teklifte sunulacağı yazıldı; pilot önerildi | `yazismalar/parfumane/2026-10-01-giden-teknik-cevap.txt` |
| 01.10.2026 | Turkish Coffee Lady | Not | — | — | Yeni buzlu Türk kahvesi serisi için premium demo hazırlandı (her tat kendi şehir sahnesinde); eski demo ve teklif hiç gönderilmemişti. Mail taslağı hazır, gönderilmedi | `turkishcoffeelady-mail.md` |
| 01.10.2026 | Turkish Coffee Lady | Giden | E-posta | Berka → hello@turkishcoffeelady.com (taslaktaki adres) | İlk satış maili (TR + EN): Aralık ABD lansmanı için buzlu Türk kahvesi sitesi, beş şehir sahnesi, lansman listesi; 20 dakikalık görüşme önerildi | `yazismalar/turkishcoffeelady/2026-10-01-giden-ilk-mail.md` |
| 01.10.2026 | JOURE Perfume | Giden | bilinmiyor | Berka → JOURE (kanal bilinmiyor; taslakta WhatsApp, Instagram, LinkedIn) | İlk satış mesajı: NO Serisi için 3D vitrin sitesi, WhatsApp'tan sorma; 10 dakikalık gösterim önerildi | `yazismalar/joure/2026-10-01-giden-ilk-mesaj.md` |
| 01.10.2026 | ILLUSIONE | Giden | bilinmiyor | Berka → ILLUSIONE (kanal bilinmiyor; taslakta hello@illusioneperfume.com ve Instagram) | İlk satış mesajı: 15 koku, 15 renk; 3D satış sitesi | `yazismalar/illusione/2026-10-01-giden-ilk-mesaj.md` |
| 01.10.2026 | Ephemeral Dyadic | Giden | E-posta | Berka → info@ephemeraldyadic.com (Sinan Saul'a hitaben) | İlk satış maili (TR + EN): her koku kendi kutu deseninin önünde siyah-beyaz sinematik sahne, şişe çevirme ve arka etiket, şiirler, manifesto, koku bulucu, satış noktaları; 15 dakikalık görüntülü görüşme önerildi | `yazismalar/ephemeraldyadic/2026-10-01-giden-ilk-mail.md` |
| 01.10.2026 | Pekji | Giden | E-posta | Berka → contact@pekji.com (Ömer İpekçi'ye hitaben) | İlk satış maili: Reset'in dört aşaması için 3D satış sitesi, şişe çevirme ve sprey, koku bulucu, 9 parfüm ve 22 satış noktası; 10 dakikalık görüşme önerildi | `yazismalar/pekji/2026-10-01-giden-ilk-mail.md` |
| 01.10.2026 | ANYMO Paris | Giden | bilinmiyor | Berka → ANYMO Paris (taslakta info@anymoparfum.com ve @anymoparis) | İlk satış mesajı: kendi etiketli 12 extrait koku için 3D satış sitesi, sprey, kaideye inen koku bulucu; Nişantaşı mağazasında 10 dakikalık gösterim önerildi | `yazismalar/anymo/2026-10-01-giden-ilk-mesaj.md` |
| 01.10.2026 (22:48) | Çakır Parfümeri | Giden | WhatsApp | Berka → Çakır Parfümeri | 4 satış görseli + "ürünleriniz için 3D web sitesi tasarımı yaptım"; mevcut sitenin yerine daha profesyonel sunum ve sipariş önerildi. Demo linki gönderildi mi: bilinmiyor | `yazismalar/cakir/2026-10-01-whatsapp-ilk-gorusme.md` |
| 01.10.2026 (22:52–22:58) | Çakır Parfümeri | Gelen | WhatsApp | Çakır Parfümeri → Berka | "Güzel bir çalışma olmuş"; "sitemiz yaklaşık 1 yıl oldu kuralı"; maliyet soruldu | `yazismalar/cakir/2026-10-01-whatsapp-ilk-gorusme.md` |
| 01.10.2026 (22:58 sonrası) | Çakır Parfümeri | Giden | WhatsApp | Berka → Çakır Parfümeri | Teklif: 3D vitrin 8.500 ₺ (3 ay bakım ve revize hediye) ya da yıllık paket 12.000 ₺ (1 yıl bakım, sınırsız revize); mevcut ikas sitesi kalır; dosyalar teslim edilecek; Instagram @mkyreklam paylaşıldı | `yazismalar/cakir/2026-10-01-giden-teklif.md` |
| 01.10.2026 | Çakır Parfümeri | Gelen | WhatsApp | Çakır Parfümeri → Berka | Teklife cevap: "Yaptığınız bir site var mı inceleyebileceğimiz" (referans istiyor) | `yazismalar/cakir/2026-10-01-giden-teklif.md` |
| 01.10.2026 (23:22) | Çakır Parfümeri | Giden | WhatsApp | Berka → Çakır Parfümeri | 3 örnek demo görseli (Turkish Coffee Lady, Mes Bisous, Attar al Has) | `yazismalar/cakir/2026-10-01-whatsapp-altyapi-sorusu.md` |
| 01.10.2026 (23:27) | Çakır Parfümeri | Gelen | WhatsApp | Çakır Parfümeri → Berka | Site olduğu gibi kalıyor mu, müşteriyi direkt 3D mi karşılıyor yoksa ayrı bir yerden mi giriliyor? | `yazismalar/cakir/2026-10-01-whatsapp-altyapi-sorusu.md` |
| 01.10.2026 (23:28–23:31) | Çakır Parfümeri | Giden | WhatsApp | Berka → Çakır Parfümeri | Ödeme altyapısı aynı kalıyor; ikas panelinde fiyat değişince 3D'de otomatik güncellendiği ve siteye tema yüklendiği söylendi (ikisi de mevcut altyapıyla örtüşmüyor; düzeltilecek) | `yazismalar/cakir/2026-10-01-whatsapp-altyapi-sorusu.md` |
| 01.10.2026 (23:36) | Çakır Parfümeri | Gelen | WhatsApp | Çakır Parfümeri → Berka | "Tema ödemesi tek seferlik değil mi 12 bin" (12.000 ₺'nin tek seferlik olup olmadığını soruyor) | `yazismalar/cakir/2026-10-01-whatsapp-altyapi-sorusu.md` |
| 01.10.2026 (23:39) | Çakır Parfümeri | Gelen | WhatsApp | Çakır Parfümeri → Berka | "Temayı 1 kez oluşturursunuz yıllık 12 bin fazla değil mi? Alt yapı bizim sonuçta" (12.000 ₺'yi yıllık ödeme sanıyor; fiyat itirazı) | `yazismalar/cakir/2026-10-01-whatsapp-altyapi-sorusu.md` |
| 01.10.2026 (23:50) | Çakır Parfümeri | Gelen | WhatsApp | Çakır Parfümeri → Berka | "Size yarın dönüş sağlayacağım" · "Teşekkür ediyorum" | `yazismalar/cakir/2026-10-01-whatsapp-altyapi-sorusu.md` |

---

## Firma bazında durum

### Parfumane (parfumane.com)
- **Kişiler:** Bekir Kantarcı (kurucu), Yasir Kantarcı (koku uzmanı). Teknik sorular "PARFUMANE" imzasıyla geldi; yazan kişinin adı belli değil.
- **İletişim:** sales@parfumane.com, support@parfumane.com, merkez ofis 0530 400 65 77.
- **Altyapıları:** WordPress + WooCommerce, Woodmart teması, Elementor, WPML/WCML (TR/EN, TRY/USD), PayTR, LiteSpeed Cache.
- **Durum:** Teknik sorulara cevap gönderildi (01.10.2026); dönüş bekleniyor.
- **Verdiğimiz sözler (mailde yazılı):**
  - Mevcut site, alan adı, URL'ler ve WooCommerce korunacak; Woodmart üzerine alt tema.
  - Staging'de pilot, onay sonrası canlıya; eski temaya tek tıkla geri dönüş.
  - Canlı veri (fiyat, stok, dil, para birimi), gerçek sepet (çoklu ürün, varyasyon), PayTR değişmeden çalışacak.
  - Ölçüye dayalı GLB şişe modelleri; zayıf cihazlarda görsel yedeği; kurulum sonrası PageSpeed raporu.
  - Kaynak kod ve 3D modeller teslimde Parfumane'ye devredilecek.
  - GTM'e 3D etkileşim olayları gönderilecek.
- **Mailde açıkça kabul edilen demo eksikleri:** Sepete yalnızca ilk ürün aktarılıyor; veriler canlı değil; # ile çalışan adresler SEO'ya uygun değil; şişeler ölçüyle modellenmedi; zayıf telefon yedeği yok; PageSpeed ölçümü yok.
- **Sırada:**
  - Dönüş gelirse: teklif dokümanı (kurulum + aylık bakım paketleri + opsiyonel ekler; fiyatları Berka belirleyecek).
  - Pilot için onlardan istenecekler: staging erişimi, yönetici hesabı, 2–3 şişe ailesinin ölçüleri ya da numuneleri.
  - Teknik hazırlık: kendi WordPress + WooCommerce test kurulumumuzda alt temaya başlamak.
- **Takip:** Dönüş olmazsa 4–5 iş günü sonra kısa bir hatırlatma.

### Turkish Coffee Lady (turkishcoffeelady.com)
- **Kişi:** Gizem Şalcıgil White (kurucu). Mail hello@turkishcoffeelady.com adresine (Instagram duyurusunda lisanslama ve iş birliği adresi).
- **Durum:** İlk mail gönderildi (01.10.2026); dönüş bekleniyor. Instagram DM'in gönderilip gönderilmediği bilinmiyor.
- **Mailde söylenenler:**
  - Kutular duyurulan tasarıma göre, paketlerdeki şehir çizimleriyle 3B olarak yeniden çizildi; gerçek dosyalarla birebir yapılır.
  - Lansman listesi; kutular satışa çıkınca Shopify mağazasına bağlanır.
  - Site EN/TR ve telefonda da çalışıyor.
- **Sırada:**
  - Takip 1: 05.10.2026 (maile "Yanıtla").
  - Takip 2: 08.10.2026 (son).
  - Dönüş olursa aşamalı teklif hazırlanır: lansman sitesi → Shopify bağlantısı → 3B videolar. Fiyatları Berka belirler.

### JOURE Perfume
- **Kişi:** Burak Kaygusuz (kurucu).
- **Durum:** İlk mesaj gönderildi (01.10.2026, kanal bilinmiyor); dönüş bekleniyor.
- **Sırada:** Takip 1: 05.10.2026. Takip 2: 08.10.2026 (son; tek sayfalık NO Serisi vitrini ya da Instagram videoları önerilir).

### ILLUSIONE
- **İletişim:** hello@illusioneperfume.com · WhatsApp +90 532 606 69 70 · @illusioneperfume.
- **Durum:** İlk mesaj gönderildi (01.10.2026, kanal bilinmiyor); dönüş bekleniyor.
- **Sırada:** Takip 1: 05.10.2026. Takip 2: 08.10.2026 (son).

### Ephemeral Dyadic (ephemeraldyadic.com)
- **Kişi:** Sinan Saul (kurucu, sanatçı). Mail info@ephemeraldyadic.com adresine (sitenin alt kısmı). Instagram adresi bilinmiyor.
- **Durum:** İlk mail gönderildi (01.10.2026); dönüş bekleniyor.
- **Mailde söylenenler:**
  - Kutu desenleri her kokunun arkasında duvar resmi; sahne siyah-beyaz, renk yalnız şişede.
  - Şişe çevrilebiliyor, arka etikette notalar; sprey ve koku profili.
  - Şiirler, manifesto, koku bulucu, satış noktaları ve SSS; EN/TR, telefonda da çalışıyor.
  - Sepet ephemeraldyadic.com'daki ürün sayfasına bağlı; mevcut Wix mağazası değişmiyor.
- **Sırada:**
  - Takip 1: 05.10.2026 (maile "Yanıtla").
  - Takip 2: 08.10.2026 (son; tek sayfalık lansman sayfası ya da Instagram için 3D videolar önerilir).
  - Fiyat sorulursa: ilk mesajda fiyat yok; önce mevcut mağazanın önüne 3D vitrin önerilir (`ephemeraldyadic-mail.md` → "Fiyat sorarlarsa").

### Pekji (pekji.com)
- **Kişi:** Ömer İpekçi (kurucu, parfümör; eski grafik tasarımcı). Mail contact@pekji.com adresine. Telefon +90 544 845 5474, Instagram @pekji_parfum.
- **Durum:** İlk mail gönderildi (01.10.2026); dönüş bekleniyor. Instagram DM ve LinkedIn notunun gönderilip gönderilmediği bilinmiyor.
- **Mailde söylenenler:**
  - Reset'in dört aşaması sırasıyla, her şişe kendi renginde.
  - Şişe çevrilebiliyor, "Spray it" ve koku profili, koku bulucu.
  - 9 parfüm kendi metinleri, notaları ve fiyatlarıyla; EN/TR; 22 satış noktası.
  - Sepet pekji.com'a bağlı, mevcut site değişmiyor.
- **Sırada:**
  - Takip 1: 05.10.2026 (maile "Yanıtla").
  - Takip 2: 08.10.2026 (son; yeni koleksiyon için tek sayfalık lansman sayfası ya da satış noktalarına 3D şişe videoları önerilir).
  - Fiyat sorulursa: ilk mesajda fiyat yok (`pekji-mail.md` → "Fiyat sorarlarsa").

### ANYMO Paris (anymoparfum.com)
- **İletişim:** info@anymoparfum.com · WhatsApp +90 533 303 74 14 · @anymoparis · Mağaza: Nişantaşı İş Merkezi, Halaskargazi, Rumeli Cd. No:1 Kat 1, Şişli.
- **Durum:** İlk mesaj gönderildi (01.10.2026, kanal bilinmiyor); dönüş bekleniyor.
- **Dikkat:** Demoda yalnızca kendi adını taşıyan 12 koku var; Royal serisi ve karşılaştırma görselleri bilerek alınmadı.
- **Sırada:**
  - WhatsApp: 02.10.2026 (taslaktaki 2. gün mesajı).
  - Son takip: 05.10.2026 (Instagram videoları ya da boş "Hakkımızda" sayfası için 3D marka sayfası önerilir).
  - Fiyat sorulursa: ilk mesajda fiyat yok (`anymo-mail.md` → "Fiyat sorarlarsa").

### Çakır Parfümeri (cakirparfumeri.com.tr)
- **İletişim:** WhatsApp 0541 748 64 84 (işletme hesabı) · info@cakirparfumeri.com.tr · @parfumor_st. Yazan kişinin adı belli değil (kurucu Tuğrul Çakır olabilir; doğrulanmadı). Berka'ya "Berkay bey" diye hitap ediyor.
- **Altyapı:** ikas DEĞİL: UK Ajans'ın yaptığı özel (PHP) mağaza (sitenin alt kısmında "UK Ajans"; demo verisi de buradan çekildi). Sitesi yaklaşık 1 yıllık (kendi ifadesi). Teklif mesajında ve önerilen metinlerde yanlışlıkla "ikas" dendi; düzeltilmeli.
- **Durum:** Teklif gönderildi; 12.000 ₺'yi yıllık sandı (itiraz); 01.10.2026 23:50'de "yarın dönüş sağlayacağım" dedi. Düzeltme mesajının (tek seferlik ödeme, tema değil, otomatik fiyat yok) gönderilip gönderilmediği bilinmiyor.
- **Takip:** 02.10.2026'da dönüş bekleniyor; gelmezse 03.10.2026 öğleden sonra kısa hatırlatma.
- **Teklif:** 3D vitrin 8.500 ₺ + 3 ay bakım ve revize hediye · Yıllık paket 12.000 ₺ (1 yıl bakım, sınırsız revize).
- **Verdiğimiz sözler (mesajda yazılı):**
  - Mevcut site değişmez; 3D vitrin önüne eklenir, sepet/ödeme/stok/kargo mevcut sitede kalır (mesajda "ikas" dendi; site ikas değil).
  - Yıllık pakette 1 yıl boyunca yeni koku ekleme, fiyat, metin ve fotoğraf güncellemeleri.
  - Dosyalar müşteriye teslim edilecek (memnun kalmazsa tasarımı kendisi ya da başka bir tasarımcı sürdürebilir).
- **Bizim hesap:** Instagram @mkyreklam (mesajda paylaşıldı).
- **Sırada:** Cevap gelirse: paket seçimi, alan adı/alt alan adı (ör. vitrin.cakirparfumeri.com.tr), ödeme (önerilen: yarısı başta, yarısı teslimde), kurulum. Cevap gelmezse 2–3 gün sonra kısa hatırlatma.

### Diğer firmalar (demo hazır, gönderim kaydı yok)
Aşağıdakilerin demosu ve satış mesajı hazır; gönderildiklerine dair kayıt yok. Gönderdikçe yukarıdaki tabloya satır ekle.

| Firma | Demo | Mesaj taslağı | Not |
|---|---|---|---|
| MAD Parfumeur | `demolar/mad-Netlify.zip` | `mad-mail.md` | LinkedIn öncelikli |
| Parfümőrült | `demolar/parfumorult-Netlify.zip` | `parfumorult-mail.md` | Macarca |
| Mes Bisous, Regalien, Royal Platinum, Türkan, Unique, Mardini, Attar Al Has, Lalive | `demolar/` | `*-mail.md` | Önceki dönem demoları |

**Atlananlar ve bekleyenler** (gerekçeleri `parfum-firmalari.csv`'de): Marko Parfüm, Buse Parfümeri ve Suyu Parfüm atlandı; Parfumoriaa ve Kız Kulesi Parfüm veri alınamadığı için bekliyor. Anatoline, Nicheend ve Amigdala Sentimentals'ın resmi sitesi yok ya da yanıt vermiyor; Osmassino Rusya pazarına dönük (karar bekliyor).
