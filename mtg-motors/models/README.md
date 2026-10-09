# 3D araç modelleri

`index.html` içindeki `CARS` listesinde her aracın `glb` alanı bu klasördeki bir dosyayı gösterir.
Dosya yoksa site çalışmaya devam eder, o araç için basit yedek model çizilir.

| Dosya | İlan | Kaynak model (CC BY 4.0) |
|---|---|---|
| `seat-ateca.glb` | Seat Ateca 1.5 EcoTSI Xperience | [Seat Ateca Cupra 2019 — Nieve5677](https://sketchfab.com/3d-models/seat-ateca-cupra-2019-24615e5bc5204ae99279d9fddfb4579c) |
| `bmw-4-serisi.glb` | BMW 420i Edition M Sport | [BMW i4 (G26) 2021 — Merc_TV](https://sketchfab.com/3d-models/bmw-i4-g26-2021-97901a0eca4344c4a12f2a134d79775b) |
| `mercedes-e-w212.glb` | Mercedes-Benz E 180 AMG | [Mercedes E Class W212 — Peter_D](https://sketchfab.com/3d-models/mercedes-e-class-w212-119c5e10733142b197aa53b86f6aeb04) |
| `vw-golf-7.glb` | VW Golf 1.6 TDI Midline Plus | [Volkswagen Golf 7. — Mona x Supercars](https://sketchfab.com/3d-models/volkswagen-golf-7-364f56c79e9a4bfbb0bfa981b9abb6a3) |
| `bmw-3-f30.glb` | BMW 320i ED 40th Year Edition | [BMW 3 Series VI F30 — Merc_TV](https://sketchfab.com/3d-models/bmw-3-series-vi-f30-b94e907d247e4ade964f613d17293b31) |
| `opel-corsa-f.glb` | Opel Corsa 1.2 T Elegance | [Opel Corsa F — teenlin3](https://sketchfab.com/3d-models/opel-corsa-f-142a797a3ee54daa8f4d00c8559cddbb) |
| `ford-kuga.glb` | Ford Kuga 1.5 EcoBlue Titanium | [Ford Kuga — MattDoesBlender](https://sketchfab.com/3d-models/ford-kuga-3412188f796f46bc8db90b5e59827548) |

Hepsi ticari kullanıma izin veren CC BY 4.0 lisanslıdır; atıflar sitenin son ekranında otomatik gösterilir.
Ham modeller ağırdır (300 bin – 1,5 milyon üçgen). Siteye koymadan önce küçültülmeleri gerekir:

```bash
npx @gltf-transform/cli optimize ham-model.glb seat-ateca.glb \
  --compress meshopt --simplify true --simplify-ratio 0.35 --texture-size 1024 --texture-compress webp
```

Not: Site `fetch` ile model yüklediği için `file://` ile açılmaz; bir web sunucusu üzerinden açın
(ör. `npx serve mtg-motors` veya GitHub Pages).
