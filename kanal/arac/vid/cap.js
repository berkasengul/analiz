// Kare kare çekim: sayfanın saati ve animasyonları elle ilerletilir, her kare ayrı yakalanır (akıcı 30 fps)
const {chromium}=require('playwright');const fs=require('fs');const {execSync}=require('child_process');
(async()=>{const [,,name]=process.argv;const dir=process.env.OUTDIR;const FPS=30, DT=1000/FPS;
const fd=dir+'/f_'+name; fs.rmSync(fd,{recursive:true,force:true}); fs.mkdirSync(fd,{recursive:true});
const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const ctx=await b.newContext({viewport:{width:1600,height:720}});
const p=await ctx.newPage();
const cdp=await ctx.newCDPSession(p);
await p.route('**/script.google.com/**',r=>r.fulfill({status:200,body:'{}'}));
await p.clock.install();
let n=0;
const step=async()=>{ await p.clock.runFor(DT);
  await p.evaluate((dt)=>{ for (const a of document.getAnimations()){ if(a.playState==='finished') continue; const end=a.effect.getComputedTiming().endTime; const ct=(a.currentTime??0)+dt; if (isFinite(end)&&ct>=end){ try{a.finish()}catch(e){} } else { a.pause(); a.currentTime=ct; } } }, DT);
};
const shoot=async(k)=>{ for(let i=0;i<k;i++){ await step(); const r=await cdp.send('Page.captureScreenshot',{format:'jpeg',quality:88}); fs.writeFileSync(`${fd}/${String(n++).padStart(5,'0')}.jpg`, Buffer.from(r.data,'base64')); } };
const idle=async(ms)=>{ for(let i=0;i<ms/DT;i++) await step(); };      // görüntü almadan ilerlet (yükleme)
const real=ms=>new Promise(r=>setTimeout(r,ms));                      // gerçek bekleme (ağ / doku çözme)
const S=s=>Math.round(s*FPS);
if(name==='hero'){ await p.goto('http://localhost:8765/index.html',{waitUntil:'domcontentloaded'}); await real(6000); await idle(3000); await real(2000);
  await shoot(S(5)); for(let i=1;i<5;i++){ await p.evaluate(i=>document.querySelector(`[data-go="${i}"]`).click(),i); await shoot(S(4.6)); } }
if(name==='bag'){ await p.goto('http://localhost:8765/index.html#urun=KC-17',{waitUntil:'domcontentloaded'}); await real(6000); await idle(2000); await real(1500);
  await shoot(S(1.5)); await p.evaluate(()=>document.querySelector('.sizes button:nth-child(3)').click()); await shoot(S(1.0));
  await p.evaluate(()=>document.querySelector('.add').click()); await shoot(S(6.5)); }
if(name==='cel'){ await p.goto('http://localhost:8765/index.html#urun=MK-18',{waitUntil:'domcontentloaded'}); await real(6000); await idle(1500);
  await p.evaluate(()=>{document.querySelector('.sizes button:nth-child(4)').click();document.querySelector('.add').click();}); await idle(4500);
  await p.evaluate(()=>document.querySelector('.bag-go').click()); await idle(1200);
  for (const [k,v] of [['name','Ayşe Yılmaz'],['phone','0532 123 45 67'],['city','İstanbul / Ümraniye'],['address','Çakmak Mah. Varan Cd. No 1']]) await p.fill(`.co [name=${k}]`, v);
  await shoot(S(1.2)); await p.evaluate(()=>document.querySelector('.checkout').click()); await real(800); await shoot(S(6.5)); }
if(name==='tale'){ await p.goto('http://localhost:8765/index.html#urun=PA-11',{waitUntil:'domcontentloaded'}); await real(6000); await idle(2000); await real(1000);
  await shoot(S(1.5)); await p.evaluate(()=>document.querySelector('.tale').scrollIntoView({block:'center'})); await shoot(S(1.2));
  await p.evaluate(()=>document.querySelector('.tale-more').click()); await shoot(S(4.5)); }
if(name==='chat'){ await p.goto('http://localhost:8765/index.html',{waitUntil:'domcontentloaded'}); await real(6000); await idle(2000); await real(1000);
  await shoot(S(1)); await p.evaluate(()=>document.querySelector('.chat-fab, [data-action="chat"], .chat button').click()); await shoot(S(1.6));
  const inp=await p.$('.chat input, .chat textarea');
  for (const ch of '5 yaşında kızım için pijama öner') { await inp.press(ch===' '?'Space':ch).catch(()=>inp.type(ch)); await shoot(2); }
  await inp.press('Enter'); await shoot(S(3.2));
  for (const ch of 'polis arabaları masalını anlat') { await inp.type(ch); await shoot(2); }
  await inp.press('Enter'); await shoot(S(4.0)); }
await b.close();
execSync(`ffmpeg -v error -y -framerate ${FPS} -i ${fd}/%05d.jpg -c:v libx264 -crf 17 -pix_fmt yuv420p ${dir}/${name}.mp4`);
fs.rmSync(fd,{recursive:true,force:true});
console.log(name,'kare',n);})();
