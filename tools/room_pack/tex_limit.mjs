// Oda GLB'lerindeki malzeme dokularını en çok 1024 px'e indirir (webp yeniden kodlanır; geometri ve meshopt sıkıştırma aynen kalır).
// Neden: 2048 px mermer/taş dokuları ekran kartında oda başına ~30 MPix (mip'lerle ~160 MB) tutuyordu; tüm salonlar toplamı
// dahili GPU'larda belleği doldurup geçişlerde donmaya yol açıyordu. Oda ölçeğinde (3.6 m karo) 1024 px ≈ 3.5 mm/piksel.
// Lightmap'ler GLB'de değil (ayrı webp), dokunulmaz. Kullanım: node tex_limit.mjs giriş.glb çıkış.glb [boyut] [malzeme=boyut ...]
// İstisna: ör. MTG_brand_marble=2048 → o malzemenin dokuları 2048'de kalır; MTG_brand_marble__Diffuse=2048 → yalnız renk dokusu
// (BMW salonu marka duvarı, büyük levha taş; normal / pürüzlülük 1024'te: GPU belleği).
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
const keep = Object.fromEntries(process.argv.slice(5).map((a) => a.split('=')).map(([m, n]) => [m, +n]));
if (!Object.keys(keep).length) await doc.transform(textureCompress({ encoder: sharp, targetFormat: 'webp', resize: [max, max], quality: 88 }));
else {
  // dokuya kullanan malzemenin adını ver (aynı doku birden çok malzemede ise istisna malzemesi öncelikli), sonra iki geçiş
  const tag = new Map();
  for (const m of doc.getRoot().listMaterials()) for (const t of [m.getBaseColorTexture(), m.getNormalTexture(), m.getMetallicRoughnessTexture()])
    if (t && (!tag.has(t) || Object.keys(keep).some((k) => k === m.getName() || k.startsWith(m.getName() + '__')))) tag.set(t, m.getName());
  for (const [t, n] of tag) { const id = n + '__' + (t.getName() || 'tex'); t.setName(id); t.setURI(id); }   // desen hem ada hem URI'ye bakar
  const esc = (x) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), names = Object.keys(keep);
  await doc.transform(textureCompress({ encoder: sharp, targetFormat: 'webp', resize: [max, max], quality: 88,
    pattern: new RegExp(`^(?!(${names.map(esc).join('|')}))`) }));
  for (const n of names) await doc.transform(textureCompress({ encoder: sharp, targetFormat: 'webp', resize: [keep[n], keep[n]], quality: 90,
    pattern: new RegExp(`^${esc(n)}`) }));
}
await io.write(process.argv[3], doc);
console.log('ok', process.argv[3]);
