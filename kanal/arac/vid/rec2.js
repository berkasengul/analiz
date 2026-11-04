// Ağır çekim kayıt: sayfa 10 kat yavaşlatılır, ekran gerçek zamanlı kaydedilir, sonra 10 kat hızlandırılır.
const {chromium}=require('playwright');const fs=require('fs');const {execSync}=require('child_process');
const K=10; // yavaşlatma katsayısı
(async()=>{const [,,name]=process.argv;const dir=process.env.OUTDIR;
const fd=dir+'/s_'+name; fs.rmSync(fd,{recursive:true,force:true}); fs.mkdirSync(fd,{recursive:true});
const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const ctx=await b.newContext({viewport:{width:1600,height:720}});
await ctx.addInitScript((K)=>{const S=1/K;const pn=performance.now.bind(performance);const t0=pn();performance.now=()=>t0+(pn()-t0)*S;
 const D=Date.now;const d0=D();Date.now=()=>d0+(D()-d0)*S;
 const raf=window.requestAnimationFrame.bind(window);window.requestAnimationFrame=cb=>raf(()=>cb(performance.now()));
 const st=window.setTimeout.bind(window);window.setTimeout=(f,ms,...a)=>st(f,(ms||0)*K,...a);
 const si=window.setInterval.bind(window);window.setInterval=(f,ms,...a)=>si(f,(ms||0)*K,...a);},K);
const p=await ctx.newPage();
await p.route('**/script.google.com/**',r=>r.fulfill({status:200,body:'{}'}));
const cdp=await ctx.newCDPSession(p);
await cdp.send('Animation.enable'); await cdp.send('Animation.setPlaybackRate',{playbackRate:1/K});
const frames=[]; let rec=false;
cdp.on('Page.screencastFrame',async(f)=>{ if(rec){ const i=frames.length; fs.writeFileSync(`${fd}/${String(i).padStart(5,'0')}.jpg`,Buffer.from(f.data,'base64')); frames.push(f.metadata.timestamp);} cdp.send('Page.screencastFrameAck',{sessionId:f.sessionId}).catch(()=>{}); });
const real=ms=>new Promise(r=>setTimeout(r,ms));
const W=s=>real(s*1000*K);                 // sahne zamanında s saniye
const start=async()=>{ await cdp.send('Page.startScreencast',{format:'jpeg',quality:90,maxWidth:1600,maxHeight:720,everyNthFrame:1}); rec=true; };
if(name==='tour'){ await p.goto('http://localhost:8765/index.html',{waitUntil:'domcontentloaded'}); await real(9000); await W(0.5);
  const H=await p.evaluate(()=>document.documentElement.scrollHeight-innerHeight);
  const story=await p.evaluate(()=>{const s=document.querySelector('.story');return s.offsetTop+s.offsetHeight-innerHeight;});
  await start(); await W(3.0);
  // vitrin: ürünler tek tek gelsin (yavaş), sonra alt bölümler akıcı aksın; her bölümde kısa duraklama
  const N=30*9; for(let i=1;i<=N;i++){ const u=i/N; await p.evaluate(y=>window.scrollTo(0,y), story*u); await W(1/30); }
  await W(1.0);
  const secs=await p.evaluate(()=>['#koleksiyon','#yeni','.why','#sss','#magaza','.site-footer'].map(q=>{const e=document.querySelector(q);return e?Math.min(document.documentElement.scrollHeight-innerHeight,e.getBoundingClientRect().top+scrollY-60):null}).filter(v=>v!==null));
  let y0=story;
  for(const y1 of secs){ const n=Math.max(20,Math.round(Math.abs(y1-y0)/70)); for(let i=1;i<=n;i++){ const u=i/n; const e=u<.5?4*u*u*u:1-Math.pow(-2*u+2,3)/2; await p.evaluate(y=>window.scrollTo(0,y), y0+(y1-y0)*e); await W(1/30);} y0=y1; await W(1.4); }
  await W(0.8); }
if(name==='hero'){ await p.goto('http://localhost:8765/index.html',{waitUntil:'domcontentloaded'}); await real(9000); await W(1.0);
  await start(); await W(5); for(let i=1;i<5;i++){ await p.evaluate(i=>document.querySelector(`[data-go="${i}"]`).click(),i); await W(4.6);} }
if(name==='bag'){ await p.goto('http://localhost:8765/index.html#urun=KC-17',{waitUntil:'domcontentloaded'}); await real(8000); await W(0.5);
  await start(); await W(1.5); await p.evaluate(()=>document.querySelector('.sizes button:nth-child(3)').click()); await W(1.0);
  await p.evaluate(()=>document.querySelector('.add').click()); await W(6.5); }
if(name==='cel'){ await p.goto('http://localhost:8765/index.html#urun=MK-18',{waitUntil:'domcontentloaded'}); await real(8000);
  await p.evaluate(()=>{document.querySelector('.sizes button:nth-child(4)').click();document.querySelector('.add').click();}); await W(4.5);
  await p.evaluate(()=>document.querySelector('.bag-go').click()); await W(1.2);
  for (const [k,v] of [['name','Ayşe Yılmaz'],['phone','0532 123 45 67'],['city','İstanbul / Ümraniye'],['address','Çakmak Mah. Varan Cd. No 1']]) await p.fill(`.co [name=${k}]`, v);
  await start(); await W(1.2); await p.evaluate(()=>document.querySelector('.checkout').click()); await W(6.5); }
if(name==='tale'){ await p.goto('http://localhost:8765/index.html#urun=PA-11',{waitUntil:'domcontentloaded'}); await real(8000); await W(0.5);
  await start(); await W(1.5); await p.evaluate(()=>document.querySelector('.tale').scrollIntoView({behavior:'smooth',block:'center'})); await W(1.4);
  await p.evaluate(()=>document.querySelector('.tale-more').click()); await W(4.5); }
if(name==='chat'){ await p.goto('http://localhost:8765/index.html',{waitUntil:'domcontentloaded'}); await real(8000); await W(0.5);
  await start(); await W(1); await p.evaluate(()=>document.querySelector('.chat-fab, [data-action="chat"], .chat button').click()); await W(1.6);
  const inp=await p.$('.chat input, .chat textarea');
  for (const ch of '5 yaşında kızım için pijama öner') { await inp.type(ch); await W(0.06); }
  await inp.press('Enter'); await W(3.2);
  for (const ch of 'polis arabaları masalını anlat') { await inp.type(ch); await W(0.06); }
  await inp.press('Enter'); await W(4.0); }
rec=false; await cdp.send('Page.stopScreencast').catch(()=>{}); await real(500); await b.close();
// zaman damgalarına göre kare süreleri (K kat hızlandırılmış), 30 fps sabit kare hızına çevrilir
let lst=''; for(let i=0;i<frames.length;i++){ const d=i<frames.length-1?(frames[i+1]-frames[i])/K:1/30; lst+=`file '${fd}/${String(i).padStart(5,'0')}.jpg'\nduration ${d.toFixed(5)}\n`; }
lst+=`file '${fd}/${String(frames.length-1).padStart(5,'0')}.jpg'\n`; fs.writeFileSync(fd+'/list.txt',lst);
execSync(`ffmpeg -v error -y -f concat -safe 0 -i ${fd}/list.txt -vf "fps=30,scale=1600:720" -c:v libx264 -crf 17 -pix_fmt yuv420p ${dir}/${name}.mp4`);
const dur=(frames[frames.length-1]-frames[0])/K; fs.rmSync(fd,{recursive:true,force:true});
console.log(name,'kare',frames.length,'süre',dur.toFixed(1),'efektif fps',(frames.length/dur).toFixed(1));})();
