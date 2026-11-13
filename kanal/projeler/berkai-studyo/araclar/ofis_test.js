#!/usr/bin/env node
// Ofis testi. Kullanım: NODE_PATH=/opt/node-tools/node_modules node araclar/ofis_test.js <cikti_klasoru> [hizli]
// Normal mod: yükleme, konsol hatası, ekiplere ışınlanma, E ile panel, karar onayı + localStorage, dışa aktarma, demo ekranı.
// Tur modu: window.TUR sahneleri, her sahneden kare, aynı t -> aynı piksel.
const {chromium,baglan,GL}=require('./yerel.js'); const fs=require('fs'),path=require('path'),crypto=require('crypto');
const out=path.resolve(process.argv[2]); fs.mkdirSync(out,{recursive:true}); const hizli=process.argv[3]==='hizli';
(async()=>{
  const b=await chromium.launch({args:GL}); const R={tarih:new Date().toISOString(),hatalar:[]};
  const ctx=await b.newContext({viewport:{width:1920,height:1080},acceptDownloads:true}); await baglan(ctx);
  const p=await ctx.newPage(); await p.setViewportSize({width:1280,height:720}); p.setDefaultTimeout(90000); p.on('console',m=>{if(m.type()==='error')R.hatalar.push('konsol: '+m.text().slice(0,200))}); p.on('pageerror',e=>R.hatalar.push('sayfa: '+e.message.slice(0,300)));
  const dis=[]; p.on('request',r=>{if(!/^(http:\/\/yerel\/|data:|blob:|about:)/.test(r.url()))dis.push(r.url().slice(0,100))});
  let t0=Date.now(); await p.goto('http://yerel/ofis/index.html'); await p.waitForFunction('window.HAZIR===true',null,{timeout:120000}); R.normal_hazir_ms=Date.now()-t0; await p.waitForTimeout(1500);
  R.nasil_karti=await p.evaluate(()=>document.querySelector('#nasil').classList.contains('acik')); await p.screenshot({path:path.join(out,'ofis_nasil_karti.jpg'),type:'jpeg',quality:85}); await p.click('#nasil-kapat'); await p.waitForTimeout(600);
  await p.screenshot({path:path.join(out,'ofis_giris.jpg'),type:'jpeg',quality:85});
  R.paneller={};
  for(const [i,id] of ['konu','yapim','musteri','site','mail','mudur'].entries()){
    await p.keyboard.press(String(i+1)); await p.waitForTimeout(900); const ip=await p.evaluate(()=>{const e=document.getElementById('ipucu');return e.hidden?null:e.innerText});
    await p.screenshot({path:path.join(out,`ofis_${id}_masa.jpg`),type:'jpeg',quality:85});
    await p.keyboard.press('e'); await p.waitForTimeout(700);
    R.paneller[id]={ipucu:ip,baslik:await p.evaluate(()=>{const h=document.querySelector('#panel.acik h2');return h?h.innerText:null}),belge:await p.evaluate(()=>document.querySelectorAll('#panel .isler button').length),yazi:await p.evaluate(()=>document.querySelector('#panel .govde').innerText.length)};
    await p.screenshot({path:path.join(out,`ofis_${id}_panel.jpg`),type:'jpeg',quality:85});
    if(id==='konu'){ await p.click('#panel .isler li:nth-child(2) button'); await p.waitForTimeout(400); R.okur=await p.evaluate(()=>document.querySelector('#okur.acik #okur-ic').innerText.length); await p.screenshot({path:path.join(out,'ofis_belge_okuyucu.jpg'),type:'jpeg',quality:85}); await p.click('#okur-kapat'); }
    if(id==='mudur'){ await p.click('#panel .karar .onayla'); await p.waitForTimeout(300); const kayit=await p.evaluate(()=>{try{return Object.keys(localStorage).filter(k=>k.startsWith('berkai_kararlar_')).map(k=>localStorage.getItem(k))}catch(e){return 'HATA'}});
      const [dl]=await Promise.all([p.waitForEvent('download'),p.click('.aktar button')]); const f=path.join(out,'ornek_kararlar_disa_aktarim.json'); await dl.saveAs(f); const j=JSON.parse(fs.readFileSync(f,'utf8'));
      R.karar={localStorage:kayit,dosya_adi:dl.suggestedFilename(),ilk:j.kararlar[0],adet:j.kararlar.length}; await p.screenshot({path:path.join(out,'ofis_mudur_onay.jpg'),type:'jpeg',quality:85}); await p.click('#panel .karar .onayla'); }
    await p.keyboard.press('e'); await p.waitForTimeout(400);
  }
  // yürüme: W ile ilerliyor mu
  await p.keyboard.press('1'); await p.waitForTimeout(500); const a=await p.evaluate(()=>({x:OFIS.oyuncu.x,z:OFIS.oyuncu.z})); await p.keyboard.down('w'); await p.waitForTimeout(900); await p.screenshot({path:path.join(out,'ofis_yururken.jpg'),type:'jpeg',quality:85}); await p.keyboard.up('w'); const c=await p.evaluate(()=>({x:OFIS.oyuncu.x,z:OFIS.oyuncu.z})); R.yurume_m=+Math.hypot(c.x-a.x,c.z-a.z).toFixed(2);
  // demo ekranı: panelden aç
  await p.keyboard.press('4'); await p.waitForTimeout(1200); await p.keyboard.press('e'); await p.waitForTimeout(900); await p.click('#panel .kartlar button'); await p.waitForTimeout(600);
  const fr=p.frames().find(f=>/siteler\//.test(f.url())); if(fr){await fr.waitForFunction('window.HAZIR===true',null,{timeout:60000}).catch(()=>p.waitForTimeout(15000)); await p.waitForTimeout(900);} // satış hattı demolarında HAZIR yok: süreyle bekle R.demo_cerceve=fr?fr.url():null; R.zip=await p.evaluate(()=>{const a=document.getElementById('site-zip');return {href:a.getAttribute('href'),download:a.getAttribute('download')}}); R.zip_var=require('fs').existsSync(path.join(__dirname,'..','ofis',R.zip.href)); await p.screenshot({path:path.join(out,'ofis_demo_acik.jpg'),type:'jpeg',quality:85}); await p.keyboard.press('Escape');
  // demo ekranına yürüyüp E ile açma + oturuş yakın çekimi
  await p.evaluate(()=>{const s=OFIS_VERI.siteler[0];OFIS.oyuncu.x=s._x;OFIS.oyuncu.z=s._z;OFIS.panelAc(null)}); await p.waitForTimeout(700); R.ekran_ipucu=await p.evaluate(()=>document.getElementById('ipucu').innerText); await p.screenshot({path:path.join(out,'ofis_demo_ekranlari.jpg'),type:'jpeg',quality:85});
  R.dis_istek=dis; await p.close();
  // tur
  const q=await ctx.newPage(); await q.setViewportSize({width:1920,height:1080}); q.setDefaultTimeout(120000); q.on('pageerror',e=>R.hatalar.push('tur sayfa: '+e.message.slice(0,300))); q.on('console',m=>{if(m.type()==='error')R.hatalar.push('tur konsol: '+m.text().slice(0,200))});
  t0=Date.now(); await q.goto('http://yerel/ofis/index.html?tur=1'); await q.waitForFunction('window.HAZIR===true',null,{timeout:180000}); R.tur_hazir_ms=Date.now()-t0;
  const T=await q.evaluate(()=>({sure:TUR.sure,sahneler:TUR.sahneler})); R.tur=T;
  const kare=async(t,ad)=>{const ms=Date.now(); await q.evaluate(t=>TUR.kare(t),t); const buf=await q.screenshot({type:'jpeg',quality:85}); if(ad)fs.writeFileSync(path.join(out,ad),buf); return {h:crypto.createHash('md5').update(buf).digest('hex'),ms:Date.now()-ms}};
  await q.evaluate(()=>OFIS_BAK([-2.9,1.25,7.55],[-6.5,0.75,7.9])); await q.screenshot({path:path.join(out,'oturus_yandan.jpg'),type:'jpeg',quality:88}); await q.evaluate(()=>OFIS_BAK([1.6,1.5,10.4],[0,1.0,9])); await q.screenshot({path:path.join(out,'oyuncu_yakin.jpg'),type:'jpeg',quality:88});
  const zamanlar=hizli?[3,15,50,64,94.5]:[1,3,5,8,12,16,24,36,44,50,55,60,64,68,75,84,88,92,94.5,97,103,106];
  for(const t of zamanlar) await kare(t,`tur_${String(t).padStart(5,'0')}.jpg`);
  const x=await kare(64),y=(await kare(20),await kare(94.5)),z=await kare(64); R.tur_deterministik=x.h===z.h; R.kare_ms=z.ms;
  R.gecti=!R.hatalar.length&&!R.dis_istek.length&&R.tur_deterministik&&Object.values(R.paneller).every(x=>x.baslik&&x.ipucu)&&R.yurume_m>1&&!!R.demo_cerceve&&R.zip_var&&R.nasil_karti&&R.okur>200&&/demosunu aç/.test(R.ekran_ipucu||'')&&R.karar&&R.karar.ilk.karar==='onay';
  fs.writeFileSync(path.join(out,'ofis_test.json'),JSON.stringify(R,null,1)); console.log(JSON.stringify({gecti:R.gecti,hatalar:R.hatalar.slice(0,5),hazir:R.normal_hazir_ms,tur_hazir:R.tur_hazir_ms,det:R.tur_deterministik,kare_ms:R.kare_ms,yurume:R.yurume_m,zip:R.zip,ipucu:R.ekran_ipucu,okur:R.okur,demo:R.demo_cerceve,karar:R.karar,paneller:R.paneller,dis:R.dis_istek.length},null,0));
  await b.close();
})();
