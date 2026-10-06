# Reinvented Parfums · editoryal vitrin (konsept demo)

Ürüne odaklı tek sayfalık 3B vitrin (kullanıcının paylaştığı "HydroFlow" ekran kaydındaki düzen):
açık gri stüdyo zemini, dev mono başlık ("beyond the tangible", harf harf çözülür), ortada şişe; kaydırınca
şişe öne eğilip dönerek çerçeveli ürün kartına iner (solda ad ve fiyat, sağda tanıtım), sonra notalar
bölümünde arkasını gösterir; ardından siyah manifesto, kampanya fotoğrafları, koleksiyon, SSS.

- 3B şişe markanın kendi ürün fotoğrafından kurulur (`src/Bottle.jsx`): küre kapak, boyun, yaka, omuz, gövde;
  ön/arka yüzler fotoğraftan. Ölçüler ve metinler `src/products.json` (demo-fabrikasi/markalar/reinvented-*).
- Şişe sayfadaki yuvaları izler (`#seat-hero`, `#seat-card`, `#seat-notes`; `src/Stage.jsx`). Telefonda en
  yakın yuvaya bağlıdır, yuva değişince küçülüp büyüyerek geçer.
- Alttaki şeritten ya da koleksiyondan koku seçilir; vurgu rengi kapağın rengine döner. "Sepete ekle"
  markanın Shopify sepetine gider.

Çalıştırma: `npm install && npm run dev` (ya da `../../hope-demo/node_modules` bağlantısıyla doğrudan).
Yayın: `npm run build` → `dist/` (zip: `demolar/reinvented-editoryal-Netlify.zip`).

## Kaydırmalı vitrin ve canlı sahne (2. tur)

- Açılış vitrini ekrana sabit; kaydırdıkça öne çıkan dört koku (`state.js → HOME`) sırayla gelir: şişe
  kaideden yükselir, havada yarım tur döner, tam yan dönükken yeni kokuya geçer ve kaideye oturur. Solda
  kokunun sırası, ailesi, adı, nota piramidi, fiyatı; altta ilerleme çubuklu şerit. Dördüncü kokudan sonra
  şişe ürün kartındaki kaideye iner.
- `src/Backdrop.jsx`: sayfanın arkasında ayrı bir WebGL katmanı. Kokunun renginde aydınlık fon (renk akarak
  geçer), şişenin ardında hale, tepeden ışık huzmesi, akan ipek dalgalar, vitrinde fonu yansıtan parlak
  zemin ve ufuk ışığı, vinyet, film greni, süzülen altın tozları.
- Altın kenarlı fildişi mermer kaideler (vitrin ve kart); kart cam gibi (bulanık, kokunun renginde iç ışık,
  ince altın çerçeve, ışık konisi). Manifesto ve alt bölümler kokunun tonuna boyanır.
