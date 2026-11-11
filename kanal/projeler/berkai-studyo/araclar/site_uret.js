#!/usr/bin/env node
// 3D site ekibi: siteler/_motor/markalar/<slug>.json ayarından kendi başına çalışan demo klasörü üretir.
// Kullanım: node araclar/site_uret.js <slug> [<slug> ...]   (çıktı: siteler/<slug>/ ; Netlify'a klasör olarak atılabilir)
const fs=require('fs'),path=require('path'); const KOK=path.resolve(__dirname,'..'),M=path.join(KOK,'siteler','_motor');
const e=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const kopya=(a,b)=>{fs.mkdirSync(path.dirname(b),{recursive:true});fs.copyFileSync(a,b)};
for(const slug of process.argv.slice(2)){
  const A=JSON.parse(fs.readFileSync(path.join(M,'markalar',slug+'.json'),'utf8')); const D=path.join(KOK,'siteler',slug);
  const dug=d=>(d||[]).map((x,i)=>`<a class="dugme${i?' ikinci':''}" href="${e(x.url)}" target="_blank" rel="noopener">${e(x.t)}</a>`).join('');
  const blok=(s,i)=>`<section class="blok" data-ad="${e(s.ad)}"><div class="kart">${s.kucuk?`<p class="kucuk">${e(s.kucuk)}</p>`:''}<${i?'h2':'h1'}>${e(s.baslik)}</${i?'h2':'h1'}>${(s.metin||[]).map(p=>`<p>${e(p)}</p>`).join('')}${s.notlar?`<ul class="notlar">${s.notlar.map(n=>`<li>${e(n)}</li>`).join('')}</ul>`:''}${dug(s.dugmeler)}${i===0?'<p class="ipucu">Kaydır · ürünü sürükleyip çevir</p>':''}</div></section>`;
  const html=`<!doctype html>
<html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>${e(A.baslik)}</title><meta name="description" content="${e(A.aciklama)}">
<link rel="stylesheet" href="site.css">
<style>:root{--vurgu:${A.tema.vurgu};--zemin1:${A.sahneler[0].fon[0]};--zemin2:${A.sahneler[0].fon[1]}}</style>
<script type="importmap">{"imports":{"three":"./vendor/three.module.min.js","three/addons/":"./vendor/addons/"}}</script>
</head><body>
<div id="fon"></div><div id="isik"></div><canvas id="sahne" aria-label="${e(A.marka)} ürünlerinin kodla çizilmiş üç boyutlu sahnesi"></canvas>
<header class="ust"><span class="marka">${e(A.marka)}</span><span class="rozet">Konsept demo</span></header>
<nav class="sira" aria-hidden="true">${A.sahneler.map(()=>'<i></i>').join('')}</nav>
<main>
${A.sahneler.map(blok).join('\n')}
<section class="blok son" data-ad="${e(A.son.ad)}"><div class="kart">${A.son.kucuk?`<p class="kucuk">${e(A.son.kucuk)}</p>`:''}<h2>${e(A.son.baslik)}</h2>${(A.son.metin||[]).map(p=>`<p>${e(p)}</p>`).join('')}${dug(A.son.dugmeler)}</div></section>
</main>
<footer><p><strong>Bağımsız konsept demo — işletmeyle resmi bir bağı yoktur.</strong> Bu sayfa ${e(A.marka)} için BerkAİ tarafından hazırlanmış bir tasarım önerisidir; yalnızca işletmeye sunulmak içindir, arama motorlarına kapalıdır.</p><p>${e(A.kaynak_notu)}</p></footer>
<script>window.AYAR=${JSON.stringify({marka:A.marka,tema:A.tema,sahneler:A.sahneler.map(s=>({model:s.model,parca:s.parca,fon:s.fon,aci:s.aci||0}))})};</script>
<script type="module" src="site.js"></script>
</body></html>`;
  fs.mkdirSync(D,{recursive:true}); fs.writeFileSync(path.join(D,'index.html'),html);
  for(const f of ['site.js','site.css','vendor/three.module.min.js','vendor/THREE_LICENSE','vendor/addons/RoomEnvironment.js']) kopya(path.join(M,f),path.join(D,f));
  fs.writeFileSync(path.join(D,'robots.txt'),'User-agent: *\nDisallow: /\n');
  // Netlify Drop paketi: index.html kökte
  const zlib=require('zlib'); const dosyalar=[]; (function gez(d,on){for(const f of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,f.name); if(f.isDirectory())gez(p,on+f.name+'/'); else dosyalar.push([on+f.name,fs.readFileSync(p)]);}})(D,'');
  const parca=[],merkez=[]; let ofs=0;
  for(const [ad,veri] of dosyalar.sort((a,b)=>a[0]<b[0]?-1:1)){ const n=Buffer.from(ad,'utf8'),z=zlib.deflateRawSync(veri,{level:9}),crc=zlib.crc32(veri)>>>0; const h=Buffer.alloc(30); h.writeUInt32LE(0x04034b50,0);h.writeUInt16LE(20,4);h.writeUInt16LE(0x0800,6);h.writeUInt16LE(8,8);h.writeUInt16LE(0,10);h.writeUInt16LE(0x5a21,12);h.writeUInt32LE(crc,14);h.writeUInt32LE(z.length,18);h.writeUInt32LE(veri.length,22);h.writeUInt16LE(n.length,26);
    const c=Buffer.alloc(46); c.writeUInt32LE(0x02014b50,0);c.writeUInt16LE(20,4);c.writeUInt16LE(20,6);c.writeUInt16LE(0x0800,8);c.writeUInt16LE(8,10);c.writeUInt16LE(0,12);c.writeUInt16LE(0x5a21,14);c.writeUInt32LE(crc,16);c.writeUInt32LE(z.length,20);c.writeUInt32LE(veri.length,24);c.writeUInt16LE(n.length,28);c.writeUInt32LE(ofs,42);
    parca.push(h,n,z); merkez.push(c,n); ofs+=30+n.length+z.length; }
  const ms=merkez.reduce((s,b)=>s+b.length,0),son=Buffer.alloc(22); son.writeUInt32LE(0x06054b50,0);son.writeUInt16LE(dosyalar.length,8);son.writeUInt16LE(dosyalar.length,10);son.writeUInt32LE(ms,12);son.writeUInt32LE(ofs,16);
  fs.writeFileSync(path.join(KOK,'siteler',slug+'-Netlify.zip'),Buffer.concat([...parca,...merkez,son]));
  console.log('üretildi: siteler/'+slug+'/ ve siteler/'+slug+'-Netlify.zip ('+dosyalar.length+' dosya)');
}
