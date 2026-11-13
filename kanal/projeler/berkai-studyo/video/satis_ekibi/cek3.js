const {chromium,baglan,GL}=require('/home/user/analiz/kanal/projeler/berkai-studyo/araclar/yerel.js');
const [,,url,out,fps,w,k]=process.argv.map((v,i)=>i>=4?+v:v); const fs=require('fs'); fs.mkdirSync(out,{recursive:true});
(async()=>{const b=await chromium.launch({args:GL});const p=await b.newPage({viewport:{width:1920,height:1080}});await baglan(p);
await p.goto('http://yerel/'+url);await p.waitForFunction('window.HAZIR===true && window.TUR',null,{timeout:180000});
const sure=await p.evaluate('window.TUR.sure');const n=Math.floor(sure*12.5);
for(let j=k;j<n;j+=w){const i=2*j;const f=`${out}/f_${String(i).padStart(5,'0')}.jpg`; if(fs.existsSync(f))continue; await p.evaluate(t=>window.TUR.kare(t),i/fps);await p.screenshot({path:f,quality:90});}
await b.close();console.log('bitti',k);})();
