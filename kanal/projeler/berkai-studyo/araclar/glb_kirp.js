#!/usr/bin/env node
// KayKit GLB'lerinden yalnızca gereken animasyonları tutar (dosya 3,6 MB -> ~0,4 MB).
// Kullanım: node araclar/glb_kirp.js <giris.glb> <cikis.glb> Idle,Walking_A,...
const fs=require('fs'); const [,,inp,outp,list]=process.argv; const keep=list.split(',');
const b=fs.readFileSync(inp); const jl=b.readUInt32LE(12); const j=JSON.parse(b.slice(20,20+jl).toString()); const bin=b.slice(20+jl+8);
j.animations=j.animations.filter(a=>keep.includes(a.name));
const usedAcc=new Set();
const add=i=>{if(i!==undefined)usedAcc.add(i)};
for(const m of j.meshes) for(const p of m.primitives){add(p.indices);Object.values(p.attributes).forEach(add);(p.targets||[]).forEach(t=>Object.values(t).forEach(add));}
for(const s of j.skins||[]) add(s.inverseBindMatrices);
for(const a of j.animations) for(const s of a.samplers){add(s.input);add(s.output);}
const usedBV=new Set(); usedAcc.forEach(i=>{if(j.accessors[i].bufferView!==undefined)usedBV.add(j.accessors[i].bufferView)});
for(const im of j.images||[]) if(im.bufferView!==undefined) usedBV.add(im.bufferView);
const bvMap={},accMap={}; const parts=[]; let off=0; const nbv=[];
[...usedBV].sort((a,b)=>a-b).forEach(i=>{const v=j.bufferViews[i]; const d=bin.slice(v.byteOffset||0,(v.byteOffset||0)+v.byteLength); const pad=(4-(d.length%4))%4; bvMap[i]=nbv.length; nbv.push({...v,byteOffset:off}); parts.push(d,Buffer.alloc(pad)); off+=d.length+pad;});
const nacc=[]; [...usedAcc].sort((a,b)=>a-b).forEach(i=>{accMap[i]=nacc.length; const a={...j.accessors[i]}; if(a.bufferView!==undefined)a.bufferView=bvMap[a.bufferView]; nacc.push(a);});
const m=i=>i===undefined?undefined:accMap[i];
for(const me of j.meshes) for(const p of me.primitives){if(p.indices!==undefined)p.indices=m(p.indices);for(const k in p.attributes)p.attributes[k]=m(p.attributes[k]);}
for(const s of j.skins||[]) if(s.inverseBindMatrices!==undefined)s.inverseBindMatrices=m(s.inverseBindMatrices);
for(const a of j.animations) for(const s of a.samplers){s.input=m(s.input);s.output=m(s.output);}
for(const im of j.images||[]) if(im.bufferView!==undefined) im.bufferView=bvMap[im.bufferView];
j.accessors=nacc; j.bufferViews=nbv; const nb=Buffer.concat(parts); j.buffers=[{byteLength:nb.length}];
let js=Buffer.from(JSON.stringify(j)); js=Buffer.concat([js,Buffer.alloc((4-js.length%4)%4,0x20)]);
const h=Buffer.alloc(12); h.writeUInt32LE(0x46546C67,0);h.writeUInt32LE(2,4);h.writeUInt32LE(12+8+js.length+8+nb.length,8);
const c1=Buffer.alloc(8);c1.writeUInt32LE(js.length,0);c1.writeUInt32LE(0x4E4F534A,4); const c2=Buffer.alloc(8);c2.writeUInt32LE(nb.length,0);c2.writeUInt32LE(0x004E4942,4);
fs.writeFileSync(outp,Buffer.concat([h,c1,js,c2,nb])); console.log(outp,(fs.statSync(outp).size/1024|0)+' KB',j.animations.map(a=>a.name).join(','));
