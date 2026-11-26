# Petra Spring · 3B ürün sitesi (tanıtım)

Genç Anadolu Gıda sitesinin (`madame-lyras/`, dal `claude/3d-product-catalog-site-4y59c1`) tasarımı ve 3B sahnesi
üzerine kurulmuş, Petra Spring (usepetra.com) ürünleriyle çok sayfalı site (Vite). Satış usepetra.com'da kalır;
ürün sayfasındaki **Hemen satın al** düğmesi Shopify sepet bağlantısıyla (`/cart/<varyant>:1`) doğrudan markanın ödeme sayfasına gider. Bayi/teklif bölümü yoktur; menüde Online mağaza, Ürünler alt sekmesinde 23 ürün.

- **23 ürün** (`src/data.js`): 12 asma kağıt araba kokusu, 5 cam şişe araba kokusu, 6 bambu çubuklu oda kokusu.
- **3B modeller** (`src/petra3d.js`):
  - `card`: asma kağıt koku, blister kart; ön ve arka yüz ürünün gerçek fotoğrafından (beyaz zemin kesildi, askı deliği saydam), poşet kısmı hafif şişkin.
  - `blister`: cam şişe araba kokuları gerçek blister kartında: ön yüz ürünün fotoğrafı (`public/tex/bl/<id>.webp`, köşeler ve askı deliği saydam),
    arka yüz kullanım talimatı, belgeler ve uyarılar (`public/tex/bl/back/`, markanın kendi görsellerinden); şişenin üstünde hacimli saydam plastik kabarcık.
  - `vial`: kartsız elma biçimli cam şişe (kodla çizildi; şu an kullanılmıyor).
  - `reed`: kalın tabanlı kare cam şişe, renkli esans, uzun siyah kapak, süslü altın etiket, 5 siyah bambu çubuk; arkasında ürünün 3B kutusu
    (gümüş karton, altın "ORTAM KOKUSU · REED DIFFUSER" bandı, Petra logosu, dikey isim etiketi, şişe çizimi, ürün renginde alt kısım; tuvalde çizilir).
  - Ürün değişimlerinde eski model dönerken çözülür, yenisi aynı anda belirir (iki model üst üste; ani boyut/biçim değişimi olmaz).
- **Ürün sayfası**: ürün mermer kaidenin üstünde sergilenir (kaidenin alt kısmı sahnenin altına taşar); panel beyaz kartsız, ürün adı ve fiyat
  Cormorant Garamond, koyu yeşil ve altın satın alma düğmesi; ürün sırası ve oklar üstte ortada, "Kokuyu keşfet" sağ üstte.
- **Ana sayfa** (`src/pages/stream.js`): kurumsal, kaydırmalı 3B akış. Ürün baştan sona cilalı mermer kaidenin (`src/podium.js`: pahlı tabla,
  altın kakma, geniş taban, temas ve zemin gölgesi) üstünde durur; kaide hiç oynamaz (telefonda adres çubuğu açılıp kapanınca da sabit:
  tuval `100lvh`). Ürünler: Petra X (asma kağıt), Aura (cam şişe, blister kart), Agartha (bambu, kutusuyla).
  Tek kaydırma = bir sonraki ürün (Genç Anadolu ana sayfasındaki akış): ürün kaidenin üstünde hafifçe yükselip kaydırmaya
  bağlı, geri sarılabilir tam bir tur döner, dönerken eski ürün çözülüp yenisi belirir; kaidede ışık halkası, ışık sütunu ve parıltılar belirir,
  arka plan yeni ürünün rengine geçer, yazılar ürün yerine otururken sırayla gelir. Fareyle ürün tabanı etrafında eğilir.
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
