// Dosyaları diskten servis eden (sunucusuz) headless Chromium çalıştırıcı
const {chromium}=require('playwright'); const fs=require('fs'); const path=require('path');
const ROOT=path.resolve(__dirname,'..');
const TYPES={'.html':'text/html','.js':'text/javascript','.gltf':'model/gltf+json','.glb':'model/gltf-binary','.bin':'application/octet-stream','.png':'image/png','.jpg':'image/jpeg'};
async function open(page){
  await page.route('http://yerel/**', r=>{const u=new URL(r.request().url()); const f=path.join(ROOT, decodeURIComponent(u.pathname));
    if(!f.startsWith(ROOT)||!fs.existsSync(f)) return r.fulfill({status:404,body:''});
    r.fulfill({status:200, body:fs.readFileSync(f), headers:{'content-type':TYPES[path.extname(f)]||'application/octet-stream'}});});
}
module.exports={open};
if(require.main===module)(async()=>{const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});const p=await b.newPage();
p.on('console',m=>console.log('C:',m.text()));p.on('pageerror',e=>console.log('E:',e.message));
await open(p); await p.goto('http://yerel/sahne3d/'+process.argv[2]);await p.waitForFunction('window.OUT',null,{timeout:120000});console.log(await p.evaluate('window.OUT'));await b.close();})();
