const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const ctx=await b.newContext({viewport:{width:1600,height:720}});const p=await ctx.newPage();const cdp=await ctx.newCDPSession(p);
await p.clock.install();
await p.goto('http://localhost:8765/index.html#urun=KC-17',{waitUntil:'domcontentloaded'});await new Promise(r=>setTimeout(r,6000));
for(let i=0;i<5;i++){ let t=Date.now(); await p.clock.runFor(33); const a=Date.now()-t; t=Date.now();
 await p.evaluate(()=>document.getAnimations().length); const b2=Date.now()-t; t=Date.now();
 await cdp.send('Page.captureScreenshot',{format:'jpeg',quality:88}); const c=Date.now()-t; console.log('runFor',a,'eval',b2,'shot',c); }
await b.close();})();
