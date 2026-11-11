#!/usr/bin/env node
// Yayın paketi: ofisi tek kök klasörde, kendi içinde çalışır hâle getirir (_yayin/). claude.ai artifact sayfası gibi
// ortamlar için: "../" yok, importmap yok, .glb/.zip yok, ana sayfa etiketsiz gövde (sayfa.html).
// Kullanım: node araclar/yayin_paketi.js          (önce: node araclar/ofis_veri_uret.js)
//           NODE_PATH=/opt/node-tools/node_modules node araclar/yayin_paketi.js test   (paketi üretir ve tarayıcıda dener)
const fs=require('fs'),path=require('path'); const KOK=path.resolve(__dirname,'..'),Y=path.join(KOK,'_yayin');
const IZINLI=/\.(html|css|js|mjs|wasm|json|txt|md|csv|xml|svg|png|jpe?g|gif|webp|ico|woff2?|ttf|otf|mp3|wav|ogg|mp4|webm|pdf)$/i;
function uret(){
  fs.rmSync(Y,{recursive:true,force:true}); fs.mkdirSync(Y,{recursive:true});
  const yaz=(yol,veri)=>{ if(!IZINLI.test(yol)) throw new Error('servis edilmeyen uzantı: '+yol); const f=path.join(Y,yol); fs.mkdirSync(path.dirname(f),{recursive:true}); fs.writeFileSync(f,veri); };
  const oku=f=>fs.readFileSync(path.join(KOK,f),'utf8');
  const three=(s,on)=>s.replace(/from\s*'three\/addons\/([^']+)'/g,`from '${on}vendor/addons/$1'`).replace(/from\s*'three'/g,`from '${on}vendor/three.module.min.js'`);
  // ofis
  const html=oku('ofis/index.html'), govde=html.split('<!--GOVDE-->')[1].split('<!--/GOVDE-->')[0];
  yaz('sayfa.html',`<title>BerkAİ Stüdyo · 3D ofis</title>\n<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n<link rel="stylesheet" href="ofis.css">\n<script>window.OFIS_YAYIN=true;</script>\n${govde.trim()}\n`);
  yaz('ofis.css',oku('ofis/ofis.css')); yaz('ofis.js',three(oku('ofis/ofis.js'),'./')); yaz('dunya.js',three(oku('ofis/dunya.js'),'./'));
  yaz('vendor/three.module.min.js',fs.readFileSync(path.join(KOK,'ofis/vendor/three.module.min.js')));
  yaz('vendor/addons/RoomEnvironment.js',three(oku('ofis/vendor/addons/RoomEnvironment.js'),'../../').replace("'../../vendor/three.module.min.js'","'../three.module.min.js'"));
  yaz('vendor/THREE_LICENSE.txt',oku('ofis/vendor/THREE_LICENSE'));
  const veri=oku('ofis/veri.js'); yaz('veri.js',veri);
  // panellerde ve ekranlarda kullanılan görseller
  const gorseller=[...new Set(veri.match(/gunler\/[^"\\]+?\.(?:jpe?g|png|webp)/g)||[])]; for(const g of gorseller) if(fs.existsSync(path.join(KOK,g))) yaz(g,fs.readFileSync(path.join(KOK,g)));
  // demo siteler (iframe ile açılır)
  global.window={}; eval(veri.replace(/^\/\/.*\n/,'')); const V=global.window.OFIS_VERI;
  for(const s of V.siteler){ const d=path.join(KOK,'siteler',s.slug);
    yaz(`siteler/${s.slug}/index.html`,fs.readFileSync(path.join(d,'index.html'),'utf8').replace(/<script type="importmap">[^<]*<\/script>\n?/,''));
    yaz(`siteler/${s.slug}/site.js`,three(fs.readFileSync(path.join(d,'site.js'),'utf8'),'./')); yaz(`siteler/${s.slug}/site.css`,fs.readFileSync(path.join(d,'site.css')));
    yaz(`siteler/${s.slug}/vendor/three.module.min.js`,fs.readFileSync(path.join(d,'vendor/three.module.min.js')));
    yaz(`siteler/${s.slug}/vendor/addons/RoomEnvironment.js`,fs.readFileSync(path.join(d,'vendor/addons/RoomEnvironment.js'),'utf8').replace(/from\s*'three'/g,"from '../three.module.min.js'")); }
  // kalan "../" ya da çıplak modül adı olmamalı
  const liste=[]; (function gez(d,on){for(const f of fs.readdirSync(d,{withFileTypes:true})){ if(f.isDirectory())gez(path.join(d,f.name),on+f.name+'/'); else liste.push(on+f.name);}})(Y,'');
  for(const f of liste.filter(f=>/\.(js|html)$/.test(f)&&!/three\.module/.test(f))){ const s=fs.readFileSync(path.join(Y,f),'utf8'); if(/from\s*'three/.test(s)) throw new Error('çıplak modül adı kaldı: '+f); if(/["'`]\.\.\/(gunler|siteler|ofis)/.test(s)) throw new Error('üst klasör yolu kaldı: '+f); }
  const dosyalar=liste.sort().map(yol=>/\.(md|csv|txt)$/.test(yol)?{yol,contentType:'text/plain; charset=utf-8'}:{yol});
  fs.writeFileSync(path.join(Y,'dosyalar.json'),JSON.stringify({giris:'sayfa.html',tarih:V.tarih,dosyalar},null,1));
  const boyut=liste.reduce((s,f)=>s+fs.statSync(path.join(Y,f)).size,0); console.log(`_yayin/ yazıldı: ${liste.length+1} dosya, ${(boyut/1048576).toFixed(1)} MB (giriş: sayfa.html, liste: dosyalar.json)`); return V;
}
async function test(V){
  const {chromium}=require('playwright'); const TUR={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.jpg':'image/jpeg','.png':'image/png','.txt':'text/plain; charset=utf-8'};
  const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']}); const R={hatalar:[],yok:[],dis:[]};
  const ac=async(vp,dokun)=>{ const ctx=await b.newContext({viewport:vp,hasTouch:!!dokun,isMobile:!!dokun}); const p=await ctx.newPage(); p.setDefaultTimeout(90000);
    await ctx.route('**/*',r=>{const u=new URL(r.request().url()); if(u.host!=='paket'){R.dis.push(u.href.slice(0,90));return r.abort();} let yol=decodeURIComponent(u.pathname).slice(1);
      if(yol===''||yol==='index.html') return r.fulfill({status:200,contentType:TUR['.html'],body:'<!doctype html><html><head><meta charset=utf-8></head><body>'+fs.readFileSync(path.join(Y,'sayfa.html'),'utf8')+'</body></html>'});
      const f=path.join(Y,yol); if(!IZINLI.test(yol)||!fs.existsSync(f)){R.yok.push(yol);return r.fulfill({status:404,body:'yok'});} r.fulfill({status:200,contentType:TUR[path.extname(f)]||'application/octet-stream',body:fs.readFileSync(f)});});
    p.on('console',m=>{if(m.type()==='error')R.hatalar.push(m.text().slice(0,200))}); p.on('pageerror',e=>R.hatalar.push('sayfa: '+e.message.slice(0,200)));
    await p.goto('http://paket/'); await p.waitForFunction('window.HAZIR===true'); await p.waitForTimeout(1200); return p; };
  const p=await ac({width:1280,height:720}); R.nasil_karti=await p.evaluate(()=>document.querySelector('#nasil').classList.contains('acik')); await p.click('#nasil-kapat');
  await p.screenshot({path:path.join(Y,'..','gunler',V.tarih,'06_mudur','ofis_test','yayin_giris.jpg'),type:'jpeg',quality:85});
  await p.keyboard.press('4'); await p.waitForTimeout(400); await p.keyboard.press('e'); await p.waitForTimeout(500); R.panel=await p.evaluate(()=>document.querySelector('#panel.acik h2')?.innerText); R.panel_gorsel=await p.evaluate(()=>[...document.querySelectorAll('#panel img')].every(i=>i.complete&&i.naturalWidth>0));
  await p.click('#panel .kartlar button'); const fr=await (async()=>{for(let i=0;i<100;i++){const f=p.frames().find(f=>/siteler\//.test(f.url())); if(f)return f; await p.waitForTimeout(100);} })();
  if(fr){ await fr.waitForFunction('window.HAZIR===true'); await p.waitForTimeout(800); R.demo={url:fr.url(),canvas:await fr.evaluate(()=>{const c=document.getElementById('sahne');const g=c.getContext('webgl2')||c.getContext('webgl');return {w:c.width,h:c.height,gl:!!g}})}; }
  R.zip=await p.evaluate(()=>{const a=document.getElementById('site-zip');return {href:a.href,target:a.target,download:a.hasAttribute('download')}}); R.yeni_sekme=await p.evaluate(()=>document.getElementById('site-yeni').getAttribute('href'));
  await p.screenshot({path:path.join(Y,'..','gunler',V.tarih,'06_mudur','ofis_test','yayin_demo.jpg'),type:'jpeg',quality:85}); await p.close();
  const t=await ac({width:390,height:844},true); R.dokunmatik=await t.evaluate(()=>!document.getElementById('dokun').hidden); await t.tap('#nasil-kapat'); await t.waitForTimeout(300);
  const a0=await t.evaluate(()=>OFIS.oyuncu.z); const k=await t.evaluate(()=>{const r=document.getElementById('kol').getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2}});
  await t.evaluate(k=>{const e=document.getElementById('kol');const o={pointerId:7,clientX:k.x,clientY:k.y,bubbles:true};e.dispatchEvent(new PointerEvent('pointerdown',o));e.dispatchEvent(new PointerEvent('pointermove',{...o,clientY:k.y-50}));},k); await t.waitForTimeout(1500);
  R.dokunmatik_yurume_m=+Math.abs((await t.evaluate(()=>OFIS.oyuncu.z))-a0).toFixed(2); await t.screenshot({path:path.join(Y,'..','gunler',V.tarih,'06_mudur','ofis_test','yayin_telefon.jpg'),type:'jpeg',quality:85}); await t.close();
  R.gecti=!R.hatalar.length&&!R.yok.length&&!R.dis.length&&!!R.demo&&R.demo.canvas.gl&&R.demo.canvas.w>0&&/^https:\/\/github\.com\/berkasengul\/analiz\/raw\/.*-Netlify\.zip$/.test(R.zip.href)&&R.zip.target==='_blank'&&R.panel_gorsel&&R.dokunmatik&&R.dokunmatik_yurume_m>.5;
  fs.writeFileSync(path.join(KOK,'gunler',V.tarih,'06_mudur','ofis_test','yayin_test.json'),JSON.stringify(R,null,1)); console.log(JSON.stringify(R)); await b.close(); if(!R.gecti) process.exitCode=1;
}
const V=uret(); if(process.argv[2]==='test') test(V);
