// web GLB (meshopt + quantize) → düz, dequantize edilmiş GLB; her mesh benzersiz adlı (M0, M1, …), sıra korunur
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS, EXTMeshoptCompression, KHRMeshQuantization } from '@gltf-transform/extensions';
import { dequantize } from '@gltf-transform/functions';
import { MeshoptDecoder } from 'meshoptimizer';
await MeshoptDecoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.decoder': MeshoptDecoder });
const doc = await io.read(process.argv[2]);
await doc.transform(dequantize());
doc.getRoot().listExtensionsUsed().forEach((e) => { if (e instanceof EXTMeshoptCompression || e instanceof KHRMeshQuantization) e.dispose(); });
const meshes = doc.getRoot().listMeshes();
meshes.forEach((m, i) => m.setName('M' + i));
let v = 0; meshes.forEach((m) => m.listPrimitives().forEach((p) => (v += p.getAttribute('POSITION').getCount())));
await io.write(process.argv[3], doc);
console.log('meshes', meshes.length, 'verts', v);
