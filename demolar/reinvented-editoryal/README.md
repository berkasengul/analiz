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
