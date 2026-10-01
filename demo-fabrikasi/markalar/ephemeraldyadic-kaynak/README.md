# Ephemeral Dyadic: kaynak betikler

Mağaza Wix (ephemeraldyadic.com): ürün sayfalarındaki JSON-LD ve medya listesi çekilir (`products.json`, `img/`).

1. `pull.py` → `ephemeraldyadic-shopify/` (ürünler, `images/<koku>/1.jpg` şişe, `2.jpg` kutu) ve `art/<koku>.png`
   (kutu fotoğrafından kırpılan mürekkep deseni; Psychic Vibrations elle kırpılır).
2. `gen.py` → `ephemeraldyadic-kurallar.json` ve `ephemeraldyadic.json` (metinler sitenin kendisinden; Türkçeleri çeviri).
   Arka etiket `ephemeraldyadic-glassback.json` (ön fotoğrafın aynası, `style: plain`).
3. `shopify-foto.py ephemeraldyadic` (kesimler), sonra sahneler:
   `render/sergishot.cjs` (`K="koku:renk,…" M="stage,card,exhibit,wall"`, boş kaide `K=gray:b0b0b0 M=plinth`),
   `grade.py` (kart son işlemi), `fon.py` → `-foto/fon/` ve `-foto/sahne/`.
4. `shopify-aktar.py ephemeraldyadic`, `yeni-demo.py`.

Sahne: koyu beton atölye duvarı, kokunun kutu deseni dev baskı olarak; ham beton kaide, şişe kapağıyla aynı
fırçalanmış çelik plaka, ön kenarda kokunun renginde ince hat; tepeden spot ışığı.
