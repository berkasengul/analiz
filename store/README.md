# SESA KIDS — 3D Scroll Pijama Mağazası

Çocuk pijama takımları için renkli, 3D vitrinli mağaza sitesi. Pijamaları
giyen çocuk modeller logo renklerindeki kaideler üzerinde duruyor; vitrin
scroll, sürükleme, oklar ve otomatik dönüşle çevriliyor. Bulutlar, yıldızlar,
odaktaki ürünün renginde ışık halesi ve modellerin hafif zıplaması vitrine
hareket katıyor.

## Referans video analizi ("Pov: Random Clothing Store in 2027")

| Videoda görülen | Sitede karşılığı |
| --- | --- |
| Beyaz, minimal arayüz; üstte ince bilgi şeridi, ortada menü, sağda arama/hesap/sepet | Aynı üst bölüm, SESA KIDS logosu ile |
| "NEW COLLECTION · PREMIUM STREETWEAR" + büyük başlık, son kelime gri gradyan | "YENİ SEZON · ÇOCUK PİJAMA TAKIMLARI" + "Tatlı rüyalar askıda." |
| Kavisli metal ip üzerinde yan yana asılı ~20 ürün; kenarlarda derinliğe doğru kıvrılıyor | Three.js sahnesi: parabolik ip, ürünler kenarlarda geriye dönüyor |
| Scroll / sürükleme ile raf yatay kayıyor, askılar hafif sallanıyor | Scroll ile raf sonsuz döngüde kayıyor; hıza göre yaylı sallanma; fareyle sürükleme |
| Ürünün üzerine gelince öne çıkıyor | Hover'da ürün öne gelir ve büyür, altta adı/fiyatı görünür |
| Tıklayınca beyaz detay ekranı: büyük askılı ürün, "Close ✕", isim, fiyat, ön/arka, beden, sepete ekle | Aynı yapı: "Kapat", 01/08 sayacı, Ön/Arka, yaş-beden seçimi, Sepete Ekle, önceki/sonraki |
| Sağdan açılan sepet: küçük görsel, adet −/+, silme | Aynı yapı; sepet tarayıcıda saklanır, ürün sepete "uçarak" gider |

## Ürünler

`js/products.js` içinde 8 takım var: İnterlok 3003, 3004, 3005, 3006 ve
D-2004, D-1001, D-1002, D-1003 (göz bandı hediyeli). Görseller şu an kodla
çiziliyor. **Fiyatlar örnektir** ve D-1003 kodu tahminidir — gerçek değerlerle
güncelleyin.

Gerçek fotoğraf kullanmak için ürüne `image` alanı ekleyin. Vitrinde ve
"Modelde" görünümünde kullanılır; arka planı silinmiş, ayakta duran çocuk
modelli dikey PNG önerilir (oran yaklaşık 1:2):

```js
{ id: '3003', ..., image: 'assets/3003.png' }
```

## Çalıştırma

Statik bir sitedir, derleme gerekmez. ES modülleri kullandığı için bir yerel
sunucu üzerinden açın:

```bash
cd store && python3 -m http.server 8000
```

Sonra tarayıcıda `http://localhost:8000` adresini açın. Netlify, Vercel,
GitHub Pages gibi herhangi bir statik barındırmaya `store/` klasörü olduğu gibi
yüklenebilir.

## Dosyalar

- `index.html` — sayfa yapısı (logo SVG olarak içeride)
- `css/style.css` — tasarım, mobil uyum
- `js/showcase.js` — 3D döner vitrin: kaideler, modeller, bulutlar, yıldızlar (Three.js)
- `js/garments.js` — pijama takımları, desenler ve çocuk modellerin çizimi
- `js/main.js` — scroll, otomatik dönüş, arama, detay ekranı, sepet
- `vendor/three.module.min.js` — Three.js r160 (MIT)

## Sonraki adımlar

- Gerçek ürün fotoğrafları ve fiyatlar
- Ödeme altyapısı (iyzico / PayTR / Shopify) — "Ödemeye Geç" şu an demo
- Üyelik ve sipariş takibi
