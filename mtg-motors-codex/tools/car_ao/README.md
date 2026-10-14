# Araç AO hattı

Araç modeline Blender'da **ortam kapanması (AO)** pişirilir ve GLB'ye `_AO` vertex özniteliği olarak yazılır.
Sitede `index.html` → `carAOPatch` bu değeri kullanır. Şu yerlerde dolaylı ışığı ve yansımaları karartır:
tekerlek yuvaları, panel aralıkları, ızgara, alt gövde, iç mekân.

Araç turda yalnız dikey eksende döndüğü için AO zemin düzlemiyle birlikte pişirilir ve her açıda geçerlidir.

```bash
cd tools/car_ao && npm install
node ao_prep.mjs ../../models/web/bmw-420i-coupe.glb /tmp/bmw_plain.glb      # meshopt aç, dequantize; mesh adları M0…
blender -b --factory-startup --python ../blender/car_ao.py -- /tmp/bmw_plain.glb /tmp/bmw_ao.json 48
node ao_apply.mjs ../../models/web/bmw-420i-coupe.glb /tmp/bmw_plain.glb /tmp/bmw_ao.json /tmp/bmw_ao.glb
cp /tmp/bmw_ao.glb ../../models/web/bmw-420i-coupe.glb && python3 ../embed_models.py
```

- `ao_apply.mjs` köşeleri konuma göre eşler; eşleşmeyenler 1 (kapanma yok) alır.
- AO zaten eklenmiş bir dosyaya hattı yeniden uygulamak, eski özniteliğin üzerine yazar.
