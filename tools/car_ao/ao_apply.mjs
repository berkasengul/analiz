// Blender AO (mesh adı → [x,y,z,ao]…) → orijinal web GLB'ye _AO özniteliği (UNSIGNED_BYTE normalized), meshopt ile yeniden yaz
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { MeshoptDecoder, MeshoptEncoder } from 'meshoptimizer';
import fs from 'fs';
await MeshoptDecoder.ready; await MeshoptEncoder.ready;
const [, , webPath, plainPath, aoPath, outPath] = process.argv;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.decoder': MeshoptDecoder, 'meshopt.encoder': MeshoptEncoder });
const plain = await io.read(plainPath), web = await io.read(webPath);
const AO = JSON.parse(fs.readFileSync(aoPath, 'utf8'));
const key = (x, y, z) => `${Math.round(x * 1e4)},${Math.round(y * 1e4)},${Math.round(z * 1e4)}`;
const pm = plain.getRoot().listMeshes(), wm = web.getRoot().listMeshes();
if (pm.length !== wm.length) throw new Error('mesh sayısı farklı');
let hit = 0, miss = 0;
pm.forEach((m, mi) => {
  const flat = AO[m.getName()]; const map = new Map();
  if (flat) for (let i = 0; i < flat.length; i += 4) map.set(key(flat[i], flat[i + 1], flat[i + 2]), flat[i + 3]);
  const wp = wm[mi].listPrimitives();
  m.listPrimitives().forEach((p, pi) => {
    const pos = p.getAttribute('POSITION'), n = pos.getCount(), out = new Uint8Array(n), e = [];
    for (let i = 0; i < n; i++) {
      pos.getElement(i, e); const a = map.get(key(e[0], e[1], e[2]));
      if (a === undefined) { miss++; out[i] = 255; } else { hit++; out[i] = Math.round(Math.min(1, Math.max(0, a)) * 255); }
    }
    const acc = web.createAccessor().setType('SCALAR').setArray(out).setNormalized(true).setBuffer(web.getRoot().listBuffers()[0]);
    wp[pi].setAttribute('_AO', acc);
  });
});
await io.write(outPath, web);
console.log('AO eşleşme', hit, 'eksik', miss, '→', outPath, (fs.statSync(outPath).size / 1e6).toFixed(2), 'MB');
