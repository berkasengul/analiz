# SESA KIDS — 3D Pijama Vitrini

Çocuk pijama takımları için scroll ile ilerleyen, premium bir mağaza sitesi.
Her takım kendi sahnesinde: aşağı kaydırdıkça bir sonraki çocuk modeli 3D
olarak dönerek gelir, arka plan o takımın rengine (logo paletinde) akar.

- **3D modeller:** Fotoğraflar, silüetten üretilen derinlik haritasıyla hacimli
  3D yüzeylere dönüştürülür (Three.js). Işık ve gölge alır; fareyle eğilir,
  sürükleyerek çevrilir, tıklayınca ürün detayı açılır.
- **Etiketler:** "Ön baskı", "Desenli alt", "Manşetli paça" etiketleri 3D model
  üzerindeki noktaları takip eder.
- **Arka plan:** Ürün rengine göre değişen degrade, logo renklerinde bulanık
  ışık lekeleri, yükselen konfeti/yıldızlar ve yumuşak bulut şeridi.
- WebGL yoksa aynı sahneler düz fotoğraflarla çalışır.

İlham alınan referans: "VAEL" mont sitesi (sinematik scroll, dev marka yazısı,
numaralı sahneler, kızılötesi mod, detay noktaları, renk seçici).

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

`js/products.js` içinde gerçek fotoğraflı 6 takım var: Kalpli Kedi, Helikopter,
Çilekli, Kutup Ayısı, Smile Everyday Rakun ve Little Hoglet Kirpi. Fotoğrafların
arka planı silinmiş halleri `assets/` klasöründe. **Ürün kodları, fiyatlar ve
beden aralıkları örnektir** — gerçek değerlerle güncelleyin.

Yeni ürün eklemek için arka planı silinmiş, çocuk modelli dikey bir PNG'yi
`assets/` içine koyup listeye bir satır eklemek yeterli. `spots` alanı detay
noktalarının fotoğraf üzerindeki yerleridir (0–1 arası x, y). 3D görünüm için
aynı adla `-depth.png` derinlik haritası gerekir (beyaz = öne çıkan):

```js
{ id: 'XX-07', image: 'assets/yeni.png', depth: 'assets/yeni-depth.png', gender: 'kiz', accent: '#e96bb8',
  spots: { yaka: [0.5, 0.2], baski: [0.5, 0.33], desen: [0.4, 0.7], manset: [0.6, 0.94] },
  tint: '#ffeaf6', podium: '#ffc8e8', code: 'Kız çocuk', name: '...',
  price: 449, colorName: '...', sizes: SIZES, desc: '...' },
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
- `js/story.js` — ürün sahneleri: scroll geçişleri, arka plan renkleri, konfeti, etiketler
- `js/models3d.js` — fotoğraf + derinlik haritasından 3D model (Three.js)
- `vendor/three.module.min.js` — Three.js r160 (MIT)
- `js/garments.js` — pijama takımları, desenler ve çocuk modellerin çizimi
- `js/main.js` — arama, koleksiyon, detay ekranı, sepet

## Sonraki adımlar

- Gerçek ürün fotoğrafları ve fiyatlar
- Ödeme altyapısı (iyzico / PayTR / Shopify) — "Ödemeye Geç" şu an demo
- Üyelik ve sipariş takibi
