const {chromium}=require('playwright');const fs=require('fs');
(async()=>{const [,,name]=process.argv;const dir=process.env.OUTDIR;
const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const ctx=await b.newContext({viewport:{width:1600,height:720},recordVideo:{dir:dir+'/tmp_'+name,size:{width:1600,height:720}}});
const p=await ctx.newPage();
await p.route('**/script.google.com/**',r=>r.fulfill({status:200,body:'{}'}));
const W=ms=>p.waitForTimeout(ms);
const T0=Date.now(); const marks={};
const mark=k=>marks[k]=(Date.now()-T0)/1000;
if(name==='hero'){ await p.goto('http://localhost:8765/index.html',{waitUntil:'domcontentloaded'}); mark('start'); await W(9000);
  for(let i=1;i<5;i++){ await p.evaluate(i=>document.querySelector(`[data-go="${i}"]`).click(),i); await W(5200);} }
if(name==='bag'){ await p.goto('http://localhost:8765/index.html#urun=KC-17',{waitUntil:'domcontentloaded'}); mark('start'); await W(7000);
  await p.evaluate(()=>document.querySelector('.sizes button:nth-child(3)').click()); await W(900);
  await p.evaluate(()=>document.querySelector('.add').click()); await W(7000); }
if(name==='cel'){ await p.goto('http://localhost:8765/index.html#urun=MK-18',{waitUntil:'domcontentloaded'}); await W(5000);
  await p.evaluate(()=>{document.querySelector('.sizes button:nth-child(4)').click();document.querySelector('.add').click();}); await W(4500);
  await p.evaluate(()=>document.querySelector('.bag-go').click()); await W(1200);
  for (const [k,v] of [['name','Ayşe Yılmaz'],['phone','0532 123 45 67'],['city','İstanbul / Ümraniye'],['address','Çakmak Mah. Varan Cd. No 1']]) { await p.type(`.co [name=${k}]`, v, {delay:35}); }
  mark('start'); await W(600); await p.evaluate(()=>document.querySelector('.checkout').click()); await W(7500); }
if(name==='tale'){ await p.goto('http://localhost:8765/index.html#urun=PA-11',{waitUntil:'domcontentloaded'}); mark('start'); await W(6000);
  await p.evaluate(()=>document.querySelector('.tale').scrollIntoView({behavior:'smooth',block:'center'})); await W(1800);
  await p.evaluate(()=>document.querySelector('.tale-more').click()); await W(5000); }
if(name==='chat'){ await p.goto('http://localhost:8765/index.html',{waitUntil:'domcontentloaded'}); mark('start'); await W(5000);
  await p.evaluate(()=>document.querySelector('.chat-fab, [data-action="chat"], .chat button').click()); await W(2500);
  const inp=await p.$('.chat input, .chat textarea'); await inp.type('5 yaşında kızım için pijama öner',{delay:45}); await inp.press('Enter'); await W(3500);
  await inp.type('polis arabaları masalını anlat',{delay:45}); await inp.press('Enter'); await W(4500); }
const vid=await p.video().path(); await ctx.close(); await b.close();
fs.renameSync(vid, dir+'/'+name+'.webm'); fs.writeFileSync(dir+'/'+name+'.json', JSON.stringify(marks));
console.log(name,'ok',JSON.stringify(marks));})();
