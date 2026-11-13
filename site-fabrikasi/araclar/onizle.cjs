const {chromium}=require('playwright');const http=require('http'),fs=require('fs'),path=require('path');
const root=process.argv[2], out=process.argv[3]; const hashes=(process.argv[4]||'').split(',');
const MT={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.woff2':'font/woff2','.glb':'model/gltf-binary','.hdr':'application/octet-stream'};
const srv=http.createServer((q,r)=>{let f=path.join(root,decodeURIComponent(q.url.split('?')[0]));if(fs.existsSync(f)&&fs.statSync(f).isDirectory())f=path.join(f,'index.html');if(!fs.existsSync(f)){r.writeHead(404);return r.end();}r.writeHead(200,{'content-type':MT[path.extname(f)]||'application/octet-stream'});fs.createReadStream(f).pipe(r);}).listen(4719);
(async()=>{const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await b.newPage({viewport:{width:1600,height:900}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
for(const [i,h] of hashes.entries()){await p.goto('http://localhost:4719/'+(h?('#'+h):''));await p.waitForTimeout(14000);await p.screenshot({path:`${out}_${i}.jpg`,quality:80,timeout:180000});}
console.log('hatalar:',errs.slice(0,5));await b.close();srv.close();})();
