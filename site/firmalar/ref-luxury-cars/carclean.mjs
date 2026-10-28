// Araç modelini siteye hazırla: boya / cam malzemelerini rol adıyla yeniden adlandır, görünmez kenar çizgisi katmanlarını sil.
// node carclean.mjs in.glb|gltf out.glb kind
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
const [, , inp, out, kind] = process.argv;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const doc = await io.read(inp);
const root = doc.getRoot();
const col = (m) => m.getBaseColorFactor();
let n = { paint: 0, glass: 0, removed: 0 };
for (const m of root.listMaterials()) {
  const c = col(m), name = m.getName() || '';
  if (kind === 'urus') {
    if (!m.getBaseColorTexture() && c[0] > .9 && c[1] < .2 && c[2] < .05 && c[3] > .99) { m.setName('paint'); n.paint++; }
    else if (m.getAlphaMode() === 'BLEND' && c[0] < .05 && c[3] < .5 && !m.getBaseColorTexture()) { m.setName('glass'); n.glass++; }
  } else if (kind === 'escalade') {
    if (name === 'Radiant_Silver_Metallic') { m.setName('paint'); n.paint++; }
    else if (/^Windows_Glass/.test(name)) { m.setName('glass'); n.glass++; }
  }
}
if (kind === 'escalade') {   // SketchUp kenar çizgileri: alfa 0, saydam → görünmez ama ~400 bin üçgen
  for (const mesh of root.listMeshes()) for (const p of mesh.listPrimitives()) {
    const m = p.getMaterial(); if (m && /^edge_color/.test(m.getName()) && m.getBaseColorFactor()[3] < .01) { mesh.removePrimitive(p); p.dispose(); n.removed++; }
  }
  for (const m of root.listMaterials()) if (/^edge_color/.test(m.getName()) && m.listParents().length <= 1) m.dispose();
  for (const mesh of root.listMeshes()) if (!mesh.listPrimitives().length) { for (const nd of root.listNodes()) if (nd.getMesh() === mesh) nd.setMesh(null); mesh.dispose(); }
}
await io.write(out, doc);
console.log(kind, n);
