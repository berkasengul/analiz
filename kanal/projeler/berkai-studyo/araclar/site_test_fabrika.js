#!/usr/bin/env node
// Site fabrikasından gelen (satış hattı) demoyu ofis için test eder: _motor sitelerindeki HAZIR/TUR olmadığından süreye göre bekler.
// Kullanım: NODE_PATH=/opt/node-tools/node_modules node araclar/site_test_fabrika.js <cikti_klasoru> <slug>
const {chromium,baglan,GL,KOK}=require('./yerel'); const fs=require('fs'),path=require('path');
const out=path.resolve(process.argv[2]), slug=process.argv[3]; fs.mkdirSync(path.join(out,'ekran'),{recursive:true});
(async()=>{
  const b=await chromium.launch({args:GL}); const R={slug,tarih:new Date().toISOString(),kaynak:'site-fabrikasi (satış hattı)',gorunumler:{}}; const url='http://yerel/siteler/'+slug+'/index.html';
  for(const [ad,vp] of [['masaustu',{width:1440,height:900}],['telefon',{width:390,height:844}]]){
    const ctx=await b.newContext({viewport:vp,deviceScaleFactor:ad==='telefon'?2:1,isMobile:ad==='telefon',hasTouch:ad==='telefon'}); await baglan(ctx);
    const p=await ctx.newPage(); const hata=[],dis=[]; p.on('console',m=>{if(m.type()==='error')hata.push(m.text().slice(0,200))}); p.on('pageerror',e=>hata.push('SAYFA: '+e.message.slice(0,200)));
    p.on('request',r=>{const u=r.url(); if(!u.startsWith('http://yerel/')&&!u.startsWith('data:')&&!u.startsWith('blob:'))dis.push(u.slice(0,120))});
    await p.goto(url,{waitUntil:'load'}); await p.waitForTimeout(20000);
    const g=await p.evaluate(()=>{const de=document.documentElement;const c=document.querySelector('canvas');return {yatay_tasma_px:Math.max(0,de.scrollWidth-innerWidth),noindex:!!document.querySelector('meta[name=robots][content*=noindex]'),canvas_dolu:!!c&&c.width>0&&c.height>0,not_var:/konsept/i.test(document.body.innerText)}});
    await p.screenshot({path:path.join(out,'ekran',`${slug}_${ad}_acilis.jpg`),type:'jpeg',quality:82});
    if(ad==='masaustu') await p.screenshot({path:path.join(out,'ekran',`${slug}_tur_0.jpg`),type:'jpeg',quality:82});
    R.gorunumler[ad]={...g,konsol_hatasi:hata,dis_istek:dis}; await ctx.close();
  }
  const m=R.gorunumler.masaustu,t=R.gorunumler.telefon;
  R.sonuc={konsol_temiz:!m.konsol_hatasi.length&&!t.konsol_hatasi.length,telefonda_tasma_yok:t.yatay_tasma_px===0,sahne_dolu:m.canvas_dolu&&t.canvas_dolu,noindex:m.noindex,konsept_notu:m.not_var};
  R.gecti=Object.values(R.sonuc).every(Boolean); R.tur={sure:0,sahneler:[]};
  const boyut=d=>fs.readdirSync(d,{withFileTypes:true}).reduce((s,f)=>s+(f.isDirectory()?boyut(path.join(d,f.name)):fs.statSync(path.join(d,f.name)).size),0); R.klasor_kb=Math.round(boyut(path.join(KOK,'siteler',slug))/1024);
  fs.writeFileSync(path.join(out,`test_${slug}.json`),JSON.stringify(R,null,1)); console.log(slug,R.gecti?'GEÇTİ':'KALAN VAR',JSON.stringify(R.sonuc),'dış istek:',m.dis_istek.length,'hata:',m.konsol_hatasi.slice(0,3));
  await b.close();
})();
