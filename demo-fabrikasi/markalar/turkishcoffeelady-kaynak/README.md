# Turkish Coffee Lady: kutu ve sahne kaynakları

Markanın yeni buzlu Türk kahvesi kutuları henüz satışta değil; elimizde yalnızca Instagram duyurusundaki
kutu tasarımı ve Shopify mağazasındaki öğütülmüş kahve paketlerinin suluboya şehir çizimleri var. Bu yüzden
kutular bu kaynaklardan yeniden çizilip 3B olarak render edilir, sonra genel hattan (foto → aktar → derleme)
geçer.

Sıra (betikler çalışma klasöründe; yollar betiklerin başında):

1. `img/<Ad>.png`: markanın Shopify'daki paket görselleri (shopify-cek ile ya da elle). `artbox.json`
   her paketteki suluboya çizimin kesim kutusu.
2. `label.py` → `labels/<tat>.png`: kutunun etiket açılımı (Instagram'daki yeni tasarım: üst bant
   "GOOD COFFEE. GOOD FORTUNE.", logo, tat adı, nazar, şehir çizimi, tat tanımı, alt bant; arka yüzde
   marka satırları). Renkler ve metinler `CANS` sözlüğünde.
3. `render/index.html` + `render/shot.cjs` → `out/<tat>-front.png`, `-back.png`: three.js kutu
   (LatheGeometry), şeffaf zeminde ön ve arka.
4. `backdrop.py` → `render/bd-<tat>.jpg`: krem kâğıt üzerinde tadın şehir çizimi.
   `render/stage.html` + `render/stageshot.cjs` → `out/stage-<tat>.png` ve `stage.json`: şehir fonu,
   taş kaide (tat renginde halka), yumuşak gölge.
5. `pull.py`: renderları `turkishcoffeelady-shopify/` (ürünler + `images/<tat>/1.jpg`, `2.jpg`) ve
   `turkishcoffeelady-foto/fon/` olarak yazar.
6. `gen.py`: `turkishcoffeelady-kurallar.json` ve `turkishcoffeelady.json` (metinler markanın sitelerinden
   ve duyurusundan; Türkçeleri çeviri). Sonra:

```bash
python3 demo-fabrikasi/araclar/shopify-foto.py turkishcoffeelady
python3 demo-fabrikasi/araclar/shopify-aktar.py turkishcoffeelady
python3 demo-fabrikasi/yeni-demo.py demo-fabrikasi/markalar/turkishcoffeelady.json
```

Sahne kaidesi `fon.json` → `base` ile kutunun ayağına hizalanır (0.678).
