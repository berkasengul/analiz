# Petra Spring · 3B ürün sitesi (tanıtım)

Genç Anadolu Gıda sitesinin (`madame-lyras/`, dal `claude/3d-product-catalog-site-4y59c1`) tasarımı ve 3B sahnesi
üzerine kurulmuş, Petra Spring (usepetra.com) ürünleriyle çok sayfalı site (Vite). Satış usepetra.com'da kalır;
ürün sayfasındaki **Satın al** düğmesi markanın kendi Shopify ürün sayfasına gider. Sitede bayi teklifi ve bayilik formları var.

- **23 ürün** (`src/data.js`): 12 asma kağıt araba kokusu, 5 cam şişe araba kokusu, 6 bambu çubuklu oda kokusu.
- **3B modeller** (`src/petra3d.js`):
  - `card`: asma kağıt koku, blister kart; ön ve arka yüz ürünün gerçek fotoğrafından (beyaz zemin kesildi, askı deliği saydam), poşet kısmı hafif şişkin.
  - `vial`: elma biçimli cam şişe, renkli esans, oluklu ahşap kapak, askı ipi (kodla çizildi).
  - `reed`: kare cam şişe, renkli esans, siyah kapak, altın etiket (ürün adı tuvalde yazılır), 5 siyah bambu çubuk.
- Renk: Petra logosunun yeşili (`#164c43`) ve altın; yazı tipleri ve sayfa düzeni Genç Anadolu sitesiyle aynı.
- Tanıtım sürümü: `SITE.demo = true` iken formlar markanın e-postasına iletilmez (FormSubmit kapalı); `robots.txt` ve `X-Robots-Tag` arama motorlarını engeller.

## Görselleri yeniden üretmek
```
# 1) usepetra.com/products.json ve ürün görsellerini bir klasöre indir (img/<handle>__<n>.<uzantı>)
python3 scripts/petra_assets.py <klasör>        # public/tex, tex/back, tex/md, tex/mini, img/foto
npm run build && (npx vite preview --port 4173 &)
node scripts/snap.cjs                            # public/img/snap + scripts/snap.json (sayfa açılışındaki ilk görsel)
node scripts/early.mjs                           # urun.html / urunler.html içindeki ilk görsel betiği
node scripts/hero.cjs && python3 scripts/hero.py # ana sayfa açılış görseli public/img/hero.webp
```

## Geliştirme
```
npm install
npm run dev
```
