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
