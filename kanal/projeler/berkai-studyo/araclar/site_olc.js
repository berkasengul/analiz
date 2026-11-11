#!/usr/bin/env node
// Müşteri bulma ekibi: işletme sitesini gerçek tarayıcıyla açar, ölçer, ekran görüntüsü alır.
// Kullanım: NODE_PATH=/opt/node-tools/node_modules node araclar/site_olc.js <cikti_klasoru> <slug>=<url> [<slug>=<url> ...]
// Çıktı: <cikti_klasoru>/olcum_<slug>.json + ekran/<slug>_masaustu.jpg + ekran/<slug>_telefon.jpg
const {chromium}=require('playwright'); const fs=require('fs'); const path=require('path');
const out=process.argv[2]; fs.mkdirSync(path.join(out,'ekran'),{recursive:true});
const UA_M='Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
const platform=h=>/cdn\.shopify|Shopify\.theme/i.test(h)?'Shopify':/ikas/i.test(h)&&/cdn\.myikas|ikas\.com/i.test(h)?'ikas':/woocommerce|wp-content/i.test(h)?(/woocommerce/i.test(h)?'WordPress + WooCommerce':'WordPress'):/ticimax/i.test(h)?'Ticimax':/ideasoft|ideacdn/i.test(h)?'IdeaSoft':/tsoft|t-soft/i.test(h)?'T-Soft':/wixstatic|wix\.com/i.test(h)?'Wix':/squarespace/i.test(h)?'Squarespace':/shopier/i.test(h)?'Shopier':/butik sistem|butiksistem/i.test(h)?'ButikSistem':/platinmarket/i.test(h)?'PlatinMarket':/opencart|route=common/i.test(h)?'OpenCart':'bilinmiyor';
async function olc(ctx,url,shot){
  const p=await ctx.newPage(); const r={}; let bytes=0,reqs=0,fail=[];
  p.on('response',async x=>{reqs++; const l=+(x.headers()['content-length']||0); bytes+=l; if(x.status()>=400) fail.push(x.status()+' '+x.url().slice(0,120));});
  const t0=Date.now();
  try{
    const resp=await p.goto(url,{timeout:45000,waitUntil:'domcontentloaded'}); r.durum=resp?resp.status():null; r.dcl_ms=Date.now()-t0;
    await p.waitForLoadState('load',{timeout:30000}).then(()=>{r.load_ms=Date.now()-t0}).catch(()=>{r.load_ms=null; r.load_notu='30 sn içinde load olayı gelmedi'});
    await p.waitForTimeout(2500);
    Object.assign(r, await p.evaluate(()=>{const fcp=performance.getEntriesByType('paint').find(e=>e.name==='first-contentful-paint');const nav=performance.getEntriesByType('navigation')[0];
      const de=document.documentElement; const vp=document.querySelector('meta[name=viewport]');
      return {son_url:location.href,baslik:document.title,fcp_ms:fcp?Math.round(fcp.startTime):null,ttfb_ms:nav?Math.round(nav.responseStart):null,
        viewport_meta:vp?vp.content:null,yatay_tasma_px:Math.max(0,de.scrollWidth-innerWidth),sayfa_yuksekligi:de.scrollHeight,
        gorsel_sayisi:document.images.length,alt_yok:[...document.images].filter(i=>!i.alt).length,
        kirik_gorsel:[...document.images].filter(i=>i.complete&&i.naturalWidth===0&&i.src&&!i.loading).length,
        canvas:document.querySelectorAll('canvas').length,model_viewer:document.querySelectorAll('model-viewer').length,video:document.querySelectorAll('video').length,
        h1:[...document.querySelectorAll('h1')].map(h=>h.innerText.trim()).filter(Boolean).slice(0,3),
        aciklama:(document.querySelector('meta[name=description]')||{}).content||null,
        metin:document.body.innerText.replace(/\s+/g,' ').slice(0,1500)}}));
    await p.screenshot({path:shot,type:'jpeg',quality:70});
    r.html=await p.content();
  }catch(e){r.hata=e.message.split('\n')[0].slice(0,200);}
  r.istek=reqs; r.aktarilan_kb_bildirilen=Math.round(bytes/1024); r.hatali_istek=fail.slice(0,8);
  return {p,r};
}
(async()=>{
  const b=await chromium.launch({proxy:process.env.HTTPS_PROXY?{server:process.env.HTTPS_PROXY}:undefined});
  for(const arg of process.argv.slice(3)){
    const i=arg.indexOf('='); const slug=arg.slice(0,i), url=arg.slice(i+1); const S={slug,url,olcum_tarihi:new Date().toISOString(),not:'Ölçüm veri merkezinden, vekil sunucu üzerinden, headless Chromium ile yapıldı; süreler Türkiye’deki bir telefondan farklı olabilir. Karşılaştırma için kullan.'};
    try{
      const cd=await b.newContext({ignoreHTTPSErrors:true,locale:'tr-TR',viewport:{width:1440,height:900}});
      const {p:pd,r:d}=await olc(cd,url,path.join(out,'ekran',slug+'_masaustu.jpg'));
      const html=d.html||''; delete d.html; S.masaustu=d; S.platform=platform(html);
      // iletişim: yalnızca sitede herkese açık kurumsal adres
      const eposta=h=>[...new Set((h.match(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi)||[]).map(x=>x.toLowerCase()).filter(x=>!/\.(png|jpg|jpeg|webp|gif|svg|css|js)$/.test(x)&&!/sentry|wixpress|example|domain\.com|email\.com|shopify|godaddy|yourname|ornek/.test(x)))];
      S.iletisim={eposta:eposta(html).map(e=>({adres:e,kaynak:d.son_url||url})),instagram:[...new Set((html.match(/https?:\/\/(?:www\.)?instagram\.com\/[A-Za-z0-9_.]+/g)||[]))].slice(0,3),iletisim_sayfasi:null};
      if(!d.hata){
        const links=await pd.evaluate(()=>[...document.querySelectorAll('a[href]')].map(a=>({h:a.href,t:(a.innerText||'').trim().slice(0,40)})).filter(a=>a.h.startsWith('http')));
        const host=new URL(d.son_url).host;
        const il=links.find(a=>/ileti[sş]im|contact|bize ula/i.test(a.t+' '+a.h)&&new URL(a.h).host===host);
        if(il){ S.iletisim.iletisim_sayfasi=il.h; try{const p2=await cd.newPage(); await p2.goto(il.h,{timeout:30000,waitUntil:'domcontentloaded'}); await p2.waitForTimeout(1500); const h2=await p2.content(); for(const e of eposta(h2)) if(!S.iletisim.eposta.find(x=>x.adres===e)) S.iletisim.eposta.push({adres:e,kaynak:il.h}); S.iletisim.sayfa_metni=(await p2.evaluate(()=>document.body.innerText.replace(/\s+/g,' '))).slice(0,900); await p2.close();}catch(e){S.iletisim.hata=e.message.slice(0,100)} }
        // kırık bağlantı: aynı alan adındaki ilk 20 farklı bağlantı
        const ic=[...new Set(links.map(a=>a.h.split('#')[0]).filter(h=>{try{return new URL(h).host===host}catch(e){return false}}))].slice(0,20);
        const kirik=[]; let bakilan=0;
        await Promise.all(ic.map(async h=>{try{const x=await cd.request.get(h,{timeout:20000,maxRedirects:5}); bakilan++; if(x.status()>=400) kirik.push({url:h,durum:x.status()});}catch(e){kirik.push({url:h,durum:'yanıt yok'});bakilan++}}));
        S.baglanti={bakilan,kirik};
      }
      await cd.close();
      const cm=await b.newContext({ignoreHTTPSErrors:true,locale:'tr-TR',viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true,userAgent:UA_M});
      const {r:m}=await olc(cm,url,path.join(out,'ekran',slug+'_telefon.jpg')); delete m.html; delete m.metin; S.telefon=m; await cm.close();
    }catch(e){S.hata=e.message.slice(0,200);}
    // cep telefonu numaraları kişisel olabilir: kayda geçirme
    fs.writeFileSync(path.join(out,'olcum_'+slug+'.json'),JSON.stringify(S,null,1).replace(/(?:\+?90[\s-]?)?\(?0?5\d{2}\)?[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2}/g,'[cep numarası kaydedilmedi]'));
    const d=S.masaustu||{},m=S.telefon||{};
    console.log(`${slug} | ${d.durum||d.hata} | ${S.platform} | ${(d.baslik||'').slice(0,50)} | M: fcp ${d.fcp_ms} load ${d.load_ms} | T: fcp ${m.fcp_ms} load ${m.load_ms} taşma ${m.yatay_tasma_px}px vp ${m.viewport_meta?'var':'YOK'} | 3D canvas ${d.canvas} | kırık ${S.baglanti?S.baglanti.kirik.length+'/'+S.baglanti.bakilan:'-'} | ${S.iletisim?S.iletisim.eposta.map(e=>e.adres).join(','):''}`);
  }
  await b.close();
})();
