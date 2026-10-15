// Oda GLB'lerindeki malzeme dokularını en çok 1024 px'e indirir (webp yeniden kodlanır; geometri ve meshopt sıkıştırma aynen kalır).
// Neden: 2048 px mermer/taş dokuları ekran kartında oda başına ~30 MPix (mip'lerle ~160 MB) tutuyordu; tüm salonlar toplamı
// dahili GPU'larda belleği doldurup geçişlerde donmaya yol açıyordu. Oda ölçeğinde (3.6 m karo) 1024 px ≈ 3.5 mm/piksel.
// Lightmap'ler GLB'de değil (ayrı webp), dokunulmaz. Kullanım: node tex_limit.mjs giriş.glb çıkış.glb [boyut]
import { NodeIO, Logger } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { textureCompress } from '@gltf-transform/functions';
import { MeshoptEncoder, MeshoptDecoder } from 'meshoptimizer';
import sharp from 'sharp';
await MeshoptEncoder.ready; await MeshoptDecoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.encoder': MeshoptEncoder, 'meshopt.decoder': MeshoptDecoder });
const doc = await io.read(process.argv[2]);
doc.setLogger(new Logger(Logger.Verbosity.ERROR));
const max = +(process.argv[4] || 1024);
await doc.transform(textureCompress({ encoder: sharp, targetFormat: 'webp', resize: [max, max], quality: 88 }));
await io.write(process.argv[3], doc);
console.log('ok', process.argv[3]);
