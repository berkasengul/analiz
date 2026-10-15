// Blender oda GLB'si → web: meshopt geometri sıkıştırma (EXT_meshopt_compression + KHR_mesh_quantization).
// Düğüm adları ve extras (lightmap bilgisi, çapalar) korunur; boş çapa düğümleri silinmez (prune yok).
// Lightmap UV (TEXCOORD_1) 14 bit: 2048 lightmap'te texel'in ~1/8'i hassasiyet (derz/kenar sızması olmaz).
// Kullanım: node room_pack.mjs giriş.glb çıkış.glb
import { NodeIO, PropertyType, Logger } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { dedup, meshopt } from '@gltf-transform/functions';
import { MeshoptEncoder, MeshoptDecoder } from 'meshoptimizer';
await MeshoptEncoder.ready; await MeshoptDecoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.encoder': MeshoptEncoder, 'meshopt.decoder': MeshoptDecoder });
const doc = await io.read(process.argv[2]);
doc.setLogger(new Logger(Logger.Verbosity.ERROR));   // "TEXCOORD_0 aralık dışı" uyarıları: doku UV'si tekrarlı, bilerek nicemlenmez
await doc.transform(dedup({ propertyTypes: [PropertyType.ACCESSOR, PropertyType.TEXTURE] }),
  meshopt({ encoder: MeshoptEncoder, level: 'medium', quantizePosition: 16, quantizeTexcoord: 14, quantizeNormal: 10 }));
await io.write(process.argv[3], doc);
console.log('ok', process.argv[3]);
