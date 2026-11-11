// Sunucu açmadan test: Playwright isteklerini diskten karşılar (http://yerel/<proje köküne göre yol>).
const {chromium}=require('playwright'); const fs=require('fs'),path=require('path');
const KOK=path.resolve(__dirname,'..');
const TUR={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.glb':'model/gltf-binary','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.md':'text/plain; charset=utf-8','.txt':'text/plain; charset=utf-8'};
async function baglan(hedef){ // hedef: page ya da context
  await hedef.route('http://yerel/**',r=>{const u=new URL(r.request().url()); let f=path.join(KOK,decodeURIComponent(u.pathname)); if(fs.existsSync(f)&&fs.statSync(f).isDirectory()) f=path.join(f,'index.html');
    if(!f.startsWith(KOK)||!fs.existsSync(f)) return r.fulfill({status:404,body:'yok'});
    r.fulfill({status:200,body:fs.readFileSync(f),headers:{'content-type':TUR[path.extname(f)]||'application/octet-stream'}});});
}
const GL=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'];
module.exports={chromium,baglan,GL,KOK};
