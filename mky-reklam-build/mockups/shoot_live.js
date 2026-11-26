// Canlı bir siteyi (ör. gencanadolugida.com.tr) mockup için çeker → shots/<ad>-desk|full|mob|mob2|mob3.png
const {chromium}=require('playwright');
const [,,name,url]=process.argv;
(async()=>{const proxy=process.env.HTTPS_PROXY?{server:process.env.HTTPS_PROXY}:undefined;
const b=await chromium.launch({proxy});
const clean=async p=>p.evaluate(()=>{document.querySelectorAll('#nl-badge-frame,iframe[id*=badge]').forEach(e=>e.remove());for(const el of document.querySelectorAll('body *')){const cs=getComputedStyle(el);if(cs.position==='fixed'&&/netlify/i.test(el.textContent||'')&&el.textContent.length<60)el.style.display='none'}document.querySelectorAll('[class*=netlify i],[id*=netlify i],a[href*="netlify.com"]').forEach(e=>{if(e.textContent.length<60)e.style.display='none'})});
const go=async(p)=>{await p.goto(url,{waitUntil:'networkidle',timeout:90000}).catch(e=>console.log('goto',e.message));await p.waitForTimeout(2500);await clean(p);};
const d=await b.newPage({viewport:{width:1440,height:900},ignoreHTTPSErrors:true});await go(d);
console.log('title:',await d.title());
await d.screenshot({path:`shots/${name}-desk.png`});
// lazy içerikleri yüklemek için sayfayı aşağı kaydır
await d.evaluate(async()=>{for(let y=0;y<document.body.scrollHeight;y+=600){scrollTo(0,y);await new Promise(r=>setTimeout(r,150))}scrollTo(0,0)});await d.waitForTimeout(1500);
await d.screenshot({path:`shots/${name}-full.png`,fullPage:true});
const m=await b.newPage({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,ignoreHTTPSErrors:true});await go(m);
await m.screenshot({path:`shots/${name}-mob.png`});
for(const [i,y] of [[2,900],[3,1900]]){await m.evaluate(y=>scrollTo(0,y),y);await m.waitForTimeout(700);await m.screenshot({path:`shots/${name}-mob${i}.png`});}
await b.close();})();
