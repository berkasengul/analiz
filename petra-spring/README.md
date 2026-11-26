# Petra Spring · 3B ürün sitesi (tanıtım)

Genç Anadolu Gıda sitesinin (`madame-lyras/`, dal `claude/3d-product-catalog-site-4y59c1`) tasarımı ve 3B sahnesi
üzerine kurulmuş, Petra Spring (usepetra.com) ürünleriyle çok sayfalı site (Vite). Satış usepetra.com'da kalır;
ürün sayfasındaki **Hemen satın al** düğmesi Shopify sepet bağlantısıyla (`/cart/<varyant>:1`) doğrudan markanın ödeme sayfasına gider. Bayi/teklif bölümü yoktur; menüde Online mağaza, Ürünler alt sekmesinde 23 ürün.

- **23 ürün** (`src/data.js`): 12 asma kağıt araba kokusu, 5 cam şişe araba kokusu, 6 bambu çubuklu oda kokusu.
- **3B modeller** (`src/petra3d.js`):
  - `card`: asma kağıt koku, blister kart; ön ve arka yüz ürünün gerçek fotoğrafından (beyaz zemin kesildi, askı deliği saydam), poşet kısmı hafif şişkin.
  - `vial`: ürün görselindeki elma biçimli cam şişe (sağda ısırık, kalın cam, önde gömme yuvarlak Petra logosu), renkli esans, 4 halkalı ahşap kapak, ahşap boncuk ve bükümlü ip (kodla çizildi).
  - `reed`: kare cam şişe, renkli esans, siyah kapak, altın etiket (ürün adı tuvalde yazılır), 5 siyah bambu çubuk.
- **Ana sayfa** (`src/pages/stream.js`): kurumsal, kaydırmalı 3B akış. Ürün baştan sona cilalı mermer kaidenin (`src/podium.js`: pahlı tabla,
  altın kakma, geniş taban, temas ve zemin gölgesi) üstünde durur. Kaydırınca 3 ürün (Önce Vatan, Ocean, Kerasus) sinematik bir geçişle değişir:
  ürün dönerek kaidenin içine iner, kaidede ışık halkası, yükselen ışık sütunu ve parıltılar belirir, arka plan yeni ürünün rengine geçer,
  yeni ürün dönerek kaideden yükselip hafifçe yaylanarak oturur; yazılar ürünle birlikte sırayla gelir. Fareyle ürün tabanı etrafında eğilir.
- **Ürüne özel arka plan** (`src/backdrop.js`): ferah stüdyo; ürünün renginde pastel duvar ve zemin, pencere ışığı ve kokuya göre gölge
  (çiçekli dal, palmiye, panjur, pencere, su yansıması, güneş), rüzgârda hafifçe sallanır. 3B sahnenin içinde çizilir (cam arkadaki sahneyi kırar).
  Renkler ve gölge türü `STUDIO` tablosunda.
- **Kokuyu keşfet** (`src/sense.js`): ürün sahnesindeki düğme. Bilgi paneli çekilir, ürün ortaya gelip tur atar, arkasında ışık ve parçacık
  patlaması olur; kokunun hikâyesi, 3 adımlı tarifi (cam şişelerde markanın açılış / kalp / taban notaları), karakter etiketleri ve
  ferahlık / sıcaklık / yoğunluk göstergeleri sırayla belirir. Metinler `src/data.js` → `SENSE`.
- Renk: Petra logosunun yeşili (`#164c43`) ve altın; yazı tipi Montserrat; şeffaf cam üst menü. Metinler usepetra.com'dan.
- Ana sayfa açılış görseli (`node scripts/poster.cjs`): arka plan `public/img/home-bg.webp` + şeffaf ürün/kaide katmanı `home-pd.webp` / `home-pm.webp`
  ve `src/poster.json` (çapa ve ölçek). Katman 3B ile aynı poz hesabıyla yerleşir; ekran boyutu ne olursa olsun 3B gelince ürün yerinden ve boyundan oynamaz.
- Tanıtım sürümü: `SITE.demo = true` iken formlar markanın e-postasına iletilmez (FormSubmit kapalı); `robots.txt` ve `X-Robots-Tag` arama motorlarını engeller.

## Görselleri yeniden üretmek
```
# 1) usepetra.com/products.json ve ürün görsellerini bir klasöre indir (img/<handle>__<n>.<uzantı>)
python3 scripts/petra_assets.py <klasör>        # public/tex, tex/back, tex/md, tex/mini, img/foto
npm run build && (npx vite preview --port 4173 &)
node scripts/snap.cjs                            # public/img/snap, public/img/zemin + scripts/snap.json (sayfa açılışındaki ilk görsel ve zemin)
node scripts/early.mjs                           # urun.html / urunler.html içindeki ilk görsel betiği
node scripts/hero.cjs && python3 scripts/hero.py # ana sayfa açılış görseli public/img/hero.webp
```

## Geliştirme
```
npm install
npm run dev
```
