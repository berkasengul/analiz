#!/usr/bin/env node
// 3D site ekibi testi. Kullanım: NODE_PATH=/opt/node-tools/node_modules node araclar/site_test.js <cikti_klasoru> <slug> [<slug>...]
// Ölçer: konsol hatası, dış istek (offline çalışmalı), ilk görüntü, 3D hazır süresi, telefonda yatay taşma,
// "Bağımsız konsept demo" notu, noindex, düğme bağlantıları (gerçek istek), tur (window.TUR) ve ekran görüntüleri.
const {chromium,baglan,GL,KOK}=require('./yerel.js'); const fs=require('fs'),path=require('path');
const out=path.resolve(process.argv[2]); fs.mkdirSync(path.join(out,'ekran'),{recursive:true});
(async()=>{
  const b=await chromium.launch({args:GL}); const rapor=[];
  const dis=await chromium.launch({proxy:process.env.HTTPS_PROXY?{server:process.env.HTTPS_PROXY}:undefined}); const disCtx=await dis.newContext({ignoreHTTPSErrors:true});
  for(const slug of process.argv.slice(3)){
    const R={slug,tarih:new Date().toISOString(),gorunumler:{}}; const url='http://yerel/siteler/'+slug+'/index.html';
    for(const [ad,vp] of [['masaustu',{width:1440,height:900}],['telefon',{width:390,height:844}]]){
      const ctx=await b.newContext({viewport:vp,deviceScaleFactor:ad==='telefon'?2:1,isMobile:ad==='telefon',hasTouch:ad==='telefon'}); await baglan(ctx);
      const p=await ctx.newPage(); const hata=[],disIstek=[]; p.on('console',m=>{if(m.type()==='error')hata.push(m.text().slice(0,200))}); p.on('pageerror',e=>hata.push('SAYFA: '+e.message.slice(0,200)));
      p.on('request',r=>{if(!r.url().startsWith('http://yerel/')&&!r.url().startsWith('data:')&&!r.url().startsWith('blob:'))disIstek.push(r.url().slice(0,120))});
      const t0=Date.now(); await p.goto(url,{waitUntil:'domcontentloaded'}); await p.waitForFunction('window.HAZIR===true',null,{timeout:90000}); const hazir=Date.now()-t0;
      await p.waitForTimeout(700);
      const g=await p.evaluate(()=>{const fcp=performance.getEntriesByType('paint').find(e=>e.name==='first-contentful-paint');const de=document.documentElement;return {ilk_goruntu_ms:fcp?Math.round(fcp.startTime):null,yatay_tasma_px:Math.max(0,de.scrollWidth-innerWidth),not_var:/Bağımsız konsept demo — işletmeyle resmi bir bağı yoktur/.test(document.querySelector('footer').innerText),noindex:!!document.querySelector('meta[name=robots][content*=noindex]'),canvas_dolu:(()=>{const c=document.getElementById('sahne');return c.width>0&&c.height>0})(),baglantilar:[...document.querySelectorAll('a[href]')].map(a=>a.href),en_kucuk_yazi_px:Math.min(...[...document.querySelectorAll('p,li,a,span')].filter(e=>e.innerText&&e.offsetParent).map(e=>parseFloat(getComputedStyle(e).fontSize)))}});
      await p.screenshot({path:path.join(out,'ekran',`${slug}_${ad}_acilis.jpg`),type:'jpeg',quality:80});
      // kaydırarak her bölüm
      const n=await p.evaluate(()=>document.querySelectorAll('.blok').length);
      for(let i=1;i<n;i++){ await p.evaluate(i=>{const b=document.querySelectorAll('.blok')[i];scrollTo(0,b.offsetTop+b.offsetHeight/2-innerHeight/2)},i); await p.waitForTimeout(1300); await p.screenshot({path:path.join(out,'ekran',`${slug}_${ad}_bolum${i}.jpg`),type:'jpeg',quality:80}); }
      R.gorunumler[ad]={hazir_ms:hazir,...g,konsol_hatasi:hata,dis_istek:disIstek,bolum:n}; if(ad==='masaustu')R.baglantilar=[...new Set(g.baglantilar)]; delete R.gorunumler[ad].baglantilar;
      await ctx.close();
    }
    // tur: deterministik mi? aynı t iki kez -> aynı piksel
    { const ctx=await b.newContext({viewport:{width:1920,height:1080}}); await baglan(ctx); const p=await ctx.newPage(); const hata=[]; p.on('pageerror',e=>hata.push(e.message)); await p.goto(url+'?tur=1'); await p.waitForFunction('window.HAZIR===true',null,{timeout:90000});
      const T=await p.evaluate(()=>({sure:TUR.sure,sahneler:TUR.sahneler})); const crypto=require('crypto'); const h=async t=>{await p.evaluate(t=>TUR.kare(t),t); return crypto.createHash('md5').update(await p.screenshot({type:'png'})).digest('hex')};
      const t1=T.sure*0.37; const a=await h(t1); await h(T.sure*0.8); const c=await h(t1);
      for(const [i,s] of T.sahneler.entries()){ await p.evaluate(t=>TUR.kare(t),(s.bas+s.bit)/2); await p.screenshot({path:path.join(out,'ekran',`${slug}_tur_${i}.jpg`),type:'jpeg',quality:82}); }
      R.tur={sure:T.sure,sahneler:T.sahneler,deterministik:a===c,hata}; await ctx.close(); }
    // düğme bağlantıları gerçekten açılıyor mu
    R.baglanti_kontrol=[]; for(const u of R.baglantilar){ if(u.startsWith('mailto:')){R.baglanti_kontrol.push({url:u,durum:'e-posta bağlantısı'});continue;} if(/instagram\.com/.test(u)){R.baglanti_kontrol.push({url:u,durum:'kontrol edilmedi (Instagram oturumsuz isteği engelliyor)'});continue;} try{const x=await disCtx.request.get(u,{timeout:30000}); R.baglanti_kontrol.push({url:u,durum:x.status()});}catch(e){R.baglanti_kontrol.push({url:u,durum:'yanıt yok'});} }
    const boyut=d=>fs.readdirSync(d,{withFileTypes:true}).reduce((s,f)=>s+(f.isDirectory()?boyut(path.join(d,f.name)):fs.statSync(path.join(d,f.name)).size),0); R.klasor_kb=Math.round(boyut(path.join(KOK,'siteler',slug))/1024);
    const m=R.gorunumler.masaustu,t=R.gorunumler.telefon;
    R.sonuc={konsol_temiz:!m.konsol_hatasi.length&&!t.konsol_hatasi.length,offline:!m.dis_istek.length&&!t.dis_istek.length,telefonda_tasma_yok:t.yatay_tasma_px===0,ilk_goruntu_3sn_alti:m.ilk_goruntu_ms<3000&&t.ilk_goruntu_ms<3000,not_var:m.not_var&&t.not_var,noindex:m.noindex,kirik_baglanti_yok:R.baglanti_kontrol.every(x=>typeof x.durum!=='number'||x.durum<400),tur_deterministik:R.tur.deterministik};
    R.gecti=Object.values(R.sonuc).every(Boolean);
    fs.writeFileSync(path.join(out,'test_'+slug+'.json'),JSON.stringify(R,null,1)); rapor.push(R);
    console.log(slug,R.gecti?'GEÇTİ':'KALDI',JSON.stringify(R.sonuc),'hazır',m.hazir_ms,t.hazir_ms,'fcp',m.ilk_goruntu_ms,t.ilk_goruntu_ms,'tur',R.tur.sure,'hata',JSON.stringify(m.konsol_hatasi.concat(t.konsol_hatasi).slice(0,3)),JSON.stringify(R.baglanti_kontrol.map(x=>x.durum)));
  }
  await b.close(); await dis.close();
})();
