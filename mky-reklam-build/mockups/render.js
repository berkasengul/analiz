// Konsept proje görsellerini üretir → ../../mky-reklam-site/assets/img/work/
const {chromium}=require('playwright');const path=require('path');const fs=require('fs');
const OUT=path.resolve(__dirname,'../../mky-reklam-site/assets/img/work');fs.mkdirSync(OUT,{recursive:true});
const sc=(f,q)=>'file://'+path.resolve(__dirname,'scenes',f)+'?'+new URLSearchParams(q);
const BG={mola:'linear-gradient(135deg,#C8693B,#8f4424)',vadi:'linear-gradient(135deg,#1C4038,#0c221e)',atlas:'linear-gradient(135deg,#FFC400,#e0a800)',lina:'linear-gradient(135deg,#E9CFC4,#cfa597)'};
const URL={mola:'molacoffee.co',vadi:'vadigayrimenkul.com',atlas:'atlasoto.com',lina:'linabutik.com'};
const jobs=[];
for(const s of ['mola','vadi','atlas','lina']){
 jobs.push([`${s}-web-1`,sc('devices.html',{mode:'laptop',site:s,bg:BG[s]}),1600,1200]);
 jobs.push([`${s}-web-2`,sc('devices.html',{mode:'browser',site:s,bg:'#e9e6e3',url:URL[s],h:2300}),1400,2500]);
 jobs.push([`${s}-web-3`,sc('devices.html',{mode:'trio',site:s,bg:BG[s]}),1600,1100]);
}
for(const b of ['mola','vadi','atlas']){
 jobs.push([`${b}-tabela-1`,sc('storefront.html',{brand:b,mode:'night'}),1600,1100]);
 jobs.push([`${b}-tabela-2`,sc('storefront.html',{brand:b,mode:'day'}),1600,1100]);
 jobs.push([`${b}-tabela-3`,sc('storefront.html',{brand:b,mode:'night',zoom:'1.75,240,40'}),1600,1100]);
}
jobs.push(['atlas-arac-1',sc('van.html',{mode:'street'}),1600,1000]);
jobs.push(['atlas-arac-2',sc('van.html',{mode:'flat'}),1600,1000]);
jobs.push(['lina-billboard-1',sc('billboard.html',{mode:'scene'}),1600,1000]);
jobs.push(['lina-billboard-2',sc('billboard.html',{mode:'flat'}),1600,1000]);
jobs.push(['mola-kimlik-1',sc('identity.html',{mode:'flatlay'}),1600,1200]);
jobs.push(['mola-kimlik-2',sc('identity.html',{mode:'sheet'}),1600,1200]);
jobs.push(['lina-sosyal-1',sc('social.html',{mode:'phone'}),1600,1200]);
jobs.push(['lina-sosyal-2',sc('social.html',{mode:'grid'}),1600,1200]);
(async()=>{const b=await chromium.launch();
 const only=process.argv[2];
 for(const [name,url,w,h] of jobs){ if(only&&!name.startsWith(only))continue;
  const p=await b.newPage({viewport:{width:w,height:h}});await p.goto(url,{waitUntil:'networkidle'});await p.waitForTimeout(300);
  await p.screenshot({path:`${OUT}/${name}.jpg`,type:'jpeg',quality:84});await p.close();console.log(name);}
 await b.close();})();
