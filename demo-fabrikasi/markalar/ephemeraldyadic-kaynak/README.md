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

Sahne (sinematik galeri, `render/sergi.html`): karanlık, sıcak altın ışık; köşedeki lambadan kaideye spot ışığı,
altın damarlı parlak siyah mermer zemin (yansımalı), çelik basamaklı gri taş silindir kaide, duvarda gölgede kalan
çerçeveli baskılar (kokunun ve komşu kokunun kutu deseni), iki yanda kaya heykeller. `?mask=1` ön planı (kaide + şişe)
ayrı çeker; `cine2.py <kip>` arka planı bulanıklaştırır (alan derinliği), hacimsel ışık huzmesi, parlama, sıcak renk
ayarı ve vinyet ekler. `K="koku:renk:komşu,…"`.

## Sinematik ürün reklamı ışığı (güncel)

`render/sergi.html`: tepe spotu (şişe + kaide üstü), kameranın sol üstünden büyük yumuşak alan ışığı, arkadan sıcak beyaz
(~4000K) kenar ışığı, sağdan düşük dolgu; kaide taş dokusu kabartmalı (roughness ~0.7, düşük parlaklık), zemin ~%15 yansıma.
`cine3.py <kip>`: arka plan pozlaması ~%18 düşük ve çok hafif yumuşak (desen okunur), dünya nötr siyah-beyaz, renk yalnız
şişede; tepeden yumuşak ışık huzmesi, hafif pus ve toz; cam kenarlarında ince kontur; düşük bloom, +%10 kontrast, ~%10 vinyet.
Sitede (`theme.cinema`): şişe shader'ında ince kenar ışığı, sol üst ana ışık ve speküler, fırçalanmış kapak, cam taban
parıltısı; piksel oranı masaüstünde 2, telefonda 1.5.

Ek ayrıntılar:
- `art2k.py`: ~700 px'lik kutu desenleri → `render/art2k/` (2048 px, Lanczos + kenar keskinleştirme; desen aynı).
  Sahne bunları kullanır.
- Ana sayfa fonu geniş (2400x1350): ekranın yanlarında ayna/bulanık tekrar olmaz.
- Bloom yalnızca ön planda (duvar resminin beyaz kâğıdı hale yapmaz).
- Kaide üst yüzeyinin parlak ışığı sıkıştırılır (kaide < şişe).
- Motor (`theme.cinema`): fonda ek parıltı, sıcak filtre, ikinci huzme/ışık havuzu ve bokeh yok; duman %20.
- `particles: "none"` parçacıkları tamamen kapatır.
