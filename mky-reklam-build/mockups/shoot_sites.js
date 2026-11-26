const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch();
for (const s of ['mola','vadi','atlas','lina']){
 const url='file://'+path.resolve('sites/'+s+'.html');
 const d=await b.newPage({viewport:{width:1440,height:900}});await d.goto(url,{waitUntil:'networkidle'});await d.waitForTimeout(400);
 await d.screenshot({path:`shots/${s}-desk.png`});await d.screenshot({path:`shots/${s}-full.png`,fullPage:true});
 const sw=await d.evaluate(()=>document.documentElement.scrollWidth);
 const m=await b.newPage({viewport:{width:390,height:844},deviceScaleFactor:2});await m.goto(url,{waitUntil:'networkidle'});await m.waitForTimeout(400);
 await m.screenshot({path:`shots/${s}-mob.png`});
 await m.evaluate(()=>scrollTo(0,900));await m.waitForTimeout(150);await m.screenshot({path:`shots/${s}-mob2.png`});await m.evaluate(()=>scrollTo(0,1900));await m.waitForTimeout(150);await m.screenshot({path:`shots/${s}-mob3.png`});
 console.log(s,sw,await m.evaluate(()=>document.documentElement.scrollWidth));}
await b.close();})();
