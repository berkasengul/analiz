const {chromium}=require('playwright');(async()=>{const [,,url,out]=process.argv;const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const p=await b.newPage({viewport:{width:1600,height:900}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto(url,{waitUntil:'domcontentloaded',timeout:60000});await p.waitForTimeout(8000);
await p.screenshot({path:out+'_a.png'});
await p.mouse.wheel(0,900);await p.waitForTimeout(3500);await p.screenshot({path:out+'_b.png'});
console.log('ok',out,errs.length);await b.close()})();
