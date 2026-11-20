// Ürün videolarını kare kare çizer (studio.html) ve ffmpeg ile mp4'e çevirir.
// Kullanım: node render.cjs <id> [<id> ...]   (ürün bilgileri: products.json)
const { chromium } = require('playwright');
const fs = require('fs');
const { execFileSync } = require('child_process');
const DIR = __dirname;
const SITE = require('path').resolve(DIR, '../../public');
const FPS = 30, T = 6;
const products = JSON.parse(fs.readFileSync(`${DIR}/products.json`, 'utf8'));

(async () => {
  const ids = process.argv.slice(2);
  const b = await chromium.launch();
  const page = await b.newPage({ viewport: { width: 720, height: 900 }, deviceScaleFactor: 1 });
  await page.goto(`file://${DIR}/studio.html`);
  for (const id of ids) {
    const p = products[id];
    if (!p) { console.log('yok', id); continue; }
    const f = (u) => (u ? (u.startsWith('/') ? `file://${SITE}${u}` : `file://${DIR}/${u}`) : null);
    await page.evaluate((q) => window.setup(q), { ...p, fruit: f(p.fruit), art: f(p.art), pouch: f(p.pouch), parts: p.parts.map(f) });
    const out = require('os').tmpdir() + `/urun-videosu/${id}`;
    fs.rmSync(out, { recursive: true, force: true });
    fs.mkdirSync(out, { recursive: true });
    const st = await page.$('#st');
    const N = FPS * T;
    for (let i = 0; i < N; i++) {
      await page.evaluate((t) => window.render(t), i / FPS);
      await st.screenshot({ path: `${out}/${String(i).padStart(4, '0')}.jpg`, type: 'jpeg', quality: 92 });
    }
    const mp4 = `${SITE}/video/${id}.mp4`;
    execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-framerate', String(FPS), '-i', `${out}/%04d.jpg`, '-c:v', 'libx264', '-preset', 'slow', '-crf', '24', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', mp4]);
    // ilk kare görseli: paketin göründüğü an
    execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-ss', '4.2', '-i', mp4, '-frames:v', '1', '-q:v', '82', `${SITE}/video/${id}.webp`]);
    console.log(id, fs.statSync(mp4).size);
  }
  await b.close();
})();
