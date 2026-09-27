# Devir notu: Lalive demosu (yeni oturum buradan devam eder)

Kullanıcı Türkçe yazar; cevaplar Türkçe. Çalışma dalı: `claude/charming-dirac-aq3a53`.

## Durum

- Şablon: `hope-demo/` (Vite + React + three.js). Lalive demosu `demolar/lalive/`, ayar dosyası
  `demo-fabrikasi/markalar/lalive.json`, üretim: `python3 demo-fabrikasi/yeni-demo.py demo-fabrikasi/markalar/lalive.json`.
- 3B ürünlerin çoğu `demo-fabrikasi/markalar/lalive-urunler.py` ile eklenir (tekrar çalıştırmak güvenli).
- Ana sayfa + her kategori (`#/urunler/<kategori>`) kendi 3B kaydırma akışında; `#/urunler` tüm ürünler listesi.
- Gerçek fotoğraftan birebir yapılanlar: El Kremi, Dudak Balmı, Bronzlaştırıcı Yağ (ilk 5 ürün) ve
  **Besleyici Yüz Bakım Yağı** (fotoğraflar `markalar/lalive-referans/yuz-yagi-*`, galeri + puan + gerçek fiyat).
- **Diğer 15 ürünün ambalajı tahmini (temsili)**: kullanıcı bunu "basit" buldu; hepsi gerçek fotoğraflarla yenilenecek.
- Lenfatik Yüz Fırçası (yeni ürün, ₺850, 4,67/5 · 3 değerlendirme) fotoğrafları kaydedildi:
  `markalar/lalive-referans/yuz-fircasi-{on,arka,model}.webp` (ön/arka şeffaf zeminli PNG/WebP, 1200×1800;
  ahşap yarım ay x 144–1075, y 584–970; kıllar ve alt yumrular y 970–1199). Henüz siteye eklenmedi.
  Plan: ahşap gövde ExtrudeGeometry (yarım elips), ön/arka yüze fotoğrafın kendisi doku olarak; kıllar kutu +
  alfa kesimli fotoğraf düzlemi + alt yumrular. Kullanım adımları ürün sayfasında 6 adım (Hazırla, Çene, Yanaklar,
  Göz çevresi & alın, Boyun & dekolte, Besle).

## Güncelleme (27 Eylül)

Ağ erişimi açıldı; `lalive-shopify/` içine markanın 77 ürünü (TR+EN metin, fiyat, 272 orijinal görsel) çekildi,
`lalive-foto.py` ile işlendi, `lalive-shopify-aktar.py` ile siteye aktarıldı: 9 kategori, 77 ürün, hepsi gerçek
fotoğraflı 3B (form "photo"), galeri, gerçek fiyat ve indirimli fiyat. El Kremi, Dudak Balmı, Bronzlaştırıcı Yağ ve
Besleyici Yüz Bakım Yağı elle modellenmiş hâlde kaldı. Aşağıdaki "sıradaki iş" maddeleri 1–3 tamamlandı.

## Güncelleme (27 Eylül, son tur)

- Telefonda ışık yumuşadı (`u_unlit`, spot ışıkları telefonda kısık); telefon detay pozu ürünü kartın üstünde tam gösterir.
- Arka yüzler: yazısız ambalaj rengi (±%5 yükseklik ortancası), arka fotoğrafı olmayan kozmetiklerde markanın
  metninden okunur arka etiket; kenarlarda ön/arka dikişsiz (`seal_front`).
- Ana sayfa Bronzlaştırıcı Yağ ile açılır; yükleme yazısı "Doğal bakım ritüeliniz hazırlanıyor";
  ana sayfadaki buton "Tüm ürünleri keşfet".
- Kullanıcı siteyi localhost'ta açıp bakacak; sonra satış maili (`satis/lalive-mail.md`).

## Güncelleme (27 Eylül, son analiz)

- Satış koşulları markanın sitesinden (tote hediye 3.500 ₺, ~1 iş günü kargo, 14 gün iade); uydurma indirim/kargo yok.
- Sepet Shopify'a bağlı: "Ödemeye geç" → `lalivenatural.com/cart/<varyant>:<adet>` (lalive.json → `commerce`).
- Ürün arama, "Benzer ürünler", sinematik kartlar.
- Pazarlama görselleri: `satis/lalive-gorseller/1…8`; mail `satis/lalive-mail.md` güncel.

## Güncelleme (27 Eylül): Türkan Fragrances + genel Shopify hattı

- Lalive gönderildi (mail + Instagram, 27 Eylül); takip 1 Ekim, son hatırlatma 4 Ekim.
- Sıradaki marka Türkan Fragrances (turkan.com.tr, Shopify): demo hazır, `satis/turkan-mail.md`, görseller `satis/turkan-gorseller/`.
- Yeni genel hat: `araclar/shopify-foto.py`, `araclar/shopify-aktar.py` (+ `markalar/<marka>-kurallar.json`), README'de anlatıldı.
- Listede Shopify kullanan diğerleri: Attar Al Has (attaralhas.com, 66 ürün, $), Unique'e Luxury (uniqueeluxury.com, 22 ürün, $).

## Sıradaki iş (önceki not)

1. Ağ erişimi açık yeni oturumda Lalive'ın bütün ürünlerini çek:
   `python3 demo-fabrikasi/araclar/shopify-cek.py www.lalivenatural.com lalive`
   (Shopify `products.json`; TR + EN metin, fiyat, kategoriler, bütün görseller → `markalar/lalive-shopify/`).
2. Sitedeki bütün ürünleri gerçek fotoğraf, açıklama ve fiyatlarla aktar; bizde olmayanları ekle
   (ör. Lenfatik Yüz Fırçası, Yüz Bakım Seti, Yüz Bakım & Koruma Seti, Yasemin Vücut Losyonu).
   Kategorileri markanın koleksiyonlarına göre düzenle.
3. Her ürünün 3B modelini fotoğrafa göre birebir yap (Yüz Bakım Yağı örneğindeki gibi: biçim, kapak, renk,
   etiket yazıları); gerçek fotoğrafları `products[].photos` galerisine, kartta `photo` üzerine gelince.
   Kart görselleri: `scratchpad` altında `rend2.cjs` benzeri Playwright + swiftshader ile kategori sayfasından çekilir.
4. **Netlify zip verme.** Kullanıcı hepsi bitince siteyi dosya olarak isteyecek ve kendi bilgisayarında
   `cd analiz/demolar/lalive && npm install && npm run dev` ile localhost'ta açacak.

## Kurallar

- Gerçek marka demosu herkese açık yayınlanmaz (artifact yok); yalnızca markaya özel.
- Uydurma bilgi, yorum, fiyat yok; kaynak markanın sitesi. Fotoğrafı olmayan ambalaj "temsili" diye belirtilir.
- Her değişiklikten sonra gerçek tıklama testi (masaüstü + telefon), `KONTROL-LISTESI.md` hata günlüğüne yeni
  hatalar eklenir. Commit sonuna oturumun attribution satırları.
- Satış maili: `satis/lalive-mail.md` (site güncellenince gönderilecek).
