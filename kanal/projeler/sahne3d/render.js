// Kullanım: node render.js sayfa.html cikti_onadi sure fps [stills t1 t2 ...]
const {chromium}=require('playwright'); const {open}=require('./shot.js'); const fs=require('fs'); const {spawn}=require('child_process');
(async()=>{
  const [page_, out, dur, fps, mode, ...ts]=process.argv.slice(2);
  const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  const p=await b.newPage({viewport:{width:1920,height:1080}});
  p.on('pageerror',e=>console.log('E:',e.message)); p.on('console',m=>{if(m.type()==='error')console.log('C:',m.text())});
  await open(p); await p.goto('http://yerel/sahne3d/'+page_); await p.waitForFunction('window.READY',null,{timeout:300000});
  const grab=async t=>{await p.evaluate(t=>window.renderAt(t),t); const d=await p.evaluate(()=>document.querySelector('canvas').toDataURL('image/jpeg',.95)); return Buffer.from(d.split(',')[1],'base64');};
  if(mode==='stills'){ for(const t of ts){ fs.writeFileSync(`${out}_${t}.jpg`, await grab(+t)); console.log('ok',t);} }
  else { const n=Math.round(+dur*+fps);
    const ff=spawn('ffmpeg',['-y','-v','error','-f','image2pipe','-framerate',fps,'-i','-','-c:v','libx264','-preset','medium','-crf','18','-pix_fmt','yuv420p',out+'.mp4'],{stdio:['pipe','inherit','inherit']});
    for(let f=0;f<n;f++){ ff.stdin.write(await grab(f/+fps)); if(f%30===0) console.log('kare',f,'/',n); }
    ff.stdin.end(); await new Promise(r=>ff.on('close',r)); console.log('ok',out+'.mp4'); }
  await b.close();
})();
