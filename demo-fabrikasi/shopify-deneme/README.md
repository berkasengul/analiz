# Shopify denemesi: 3D vitrin + Shopify sepeti

Amaç: 3D vitrinin bir Shopify mağazasına bağlı çalıştığını kendi deneme mağazamızda görmek.

- `cakir-urunler.csv`: Çakır demosundaki 7 kokunun Shopify ürün içe aktarma dosyası (ad, açıklama, notalar,
  fiyat, görsel). Görseller Netlify deneme sitesinden (`sensational-lebkuchen-d73c34.netlify.app/3d/cut/`).
  Yalnızca iç deneme içindir; şifreli geliştirme mağazasında kalır, yayınlanmaz.

Akış:
1. Shopify partner hesabı → ücretsiz geliştirme mağazası.
2. Ürünler → İçe aktar → `cakir-urunler.csv`.
3. Mağaza adresi (`xxx.myshopify.com`) ve vitrin şifresi (storefront password, yönetici şifresi değil) → varyant
   numaraları `/products.json`'dan çekilir, vitrin `commerce.shopify` ile mağazaya bağlanır.
4. Vitrinde "Sepete ekle" → "Ödemeye geç": Shopify sepeti seçilen ürünlerle açılır (`/cart/<varyant>:<adet>`).
5. Shopify'da Online Store → Navigation: "3D Koleksiyon" bağlantısı; isterseniz Pages → yeni sayfa → HTML ile
   vitrin iframe olarak gömülür.

## Tema olarak yükleme (önerilen)

`python3 demo-fabrikasi/araclar/shopify-tema.py <slug> "<tema adı>"` → `demolar/<slug>-tema.zip`.
Shopify → Online Mağaza → Temalar → Tema yükle → zip. Önizle, sonra Yayınla. Mağazanın ana sayfası 3D vitrin olur;
fiyat/stok Shopify'dan canlı, sepet ve ödeme Shopify'ın kendisi. Sepet, arama, hesap ve parola sayfaları sade
Liquid şablonlar. Netlify gerekmez.

## Yazıları müşteri değiştirir

Temadaki bütün Türkçe yazılar (menü, başlıklar, hakkımızda, SSS, iletişim, ürün adı/açıklama/notalar) tema ayarıdır:
Shopify → Online Mağaza → Temalar → **Özelleştir** → sol alttaki **Tema ayarları** (fırça/çark simgesi) → bölüm
seçilir, yazı değiştirilir, **Kaydet**. Boş bırakılan alan ilk yazıyı gösterir. `{0}` geçen yazılarda `{0}` yerine
sayı/ad gelir, silinmemeli. Fiyat ve stok zaten Shopify ürün sayfasından gelir. İngilizce sürüm ve 3B ürün eklemek bizde.
