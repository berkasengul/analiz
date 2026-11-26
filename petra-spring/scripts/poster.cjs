// Ana sayfa açılış görseli: 3B sahnenin ilk karesi iki katman olarak üretilir.
//  - public/img/home-bg.webp: ürünün stüdyo arka planı (3B'deki gibi ekrana gerilir)
//  - public/img/home-pd.webp / home-pm.webp: ürün + mermer kaide, şeffaf zeminli (masaüstü / telefon)
//  - src/poster.json: katmanın çapası ve ölçeği; sayfa, 3B ile aynı poz hesabıyla katmanı yerleştirir
//    (ekran boyutu ne olursa olsun 3B gelince ürün yerinden ve boyundan oynamaz).
// Kullanım: npm run build && (npx vite preview --port 4173 &) ; node scripts/poster.cjs
const { chromium, devices } = require('playwright');
const { execFileSync } = require('child_process');
const fs = require('fs');
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const out = {};
  for (const [name, opts] of [['d', { viewport: { width: 1680, height: 880 }, deviceScaleFactor: 2 }], ['m', { ...devices['iPhone 13'] }]]) {
    const ctx = await b.newContext(opts);
    const p = await ctx.newPage();
    await p.goto('http://localhost:4173/?nosnap&poster', { waitUntil: 'domcontentloaded' });
    await p.waitForFunction(() => document.body.classList.contains('gl-ready'), null, { timeout: 180000 });
    await p.waitForTimeout(9000);
    const r = await p.evaluate(() => {
      const P = window.__pose(), vw = innerWidth, vh = innerHeight, H0 = Math.tan((15 * Math.PI) / 180) * 5, ppu = vh / (2 * H0);
      return { png: window.__scene.layerShot(), bg: window.__scene.backdropURL(), ax: vw / 2 + P.x * ppu, ay: vh / 2 - P.y * ppu, k: P.s * ppu, dpr: Math.min(devicePixelRatio, 2) };
    });
    fs.writeFileSync(`/tmp/layer-${name}.png`, Buffer.from(r.png.split(',')[1], 'base64'));
    if (name === 'd') fs.writeFileSync('/tmp/home-bg.webp', Buffer.from(r.bg.split(',')[1], 'base64'));
    const py = `
from PIL import Image
im = Image.open('/tmp/layer-${name}.png').convert('RGBA')
x0, y0, x1, y1 = im.getchannel('A').point(lambda a: 255 if a > 3 else 0).getbbox()
m = 6
x0, y0, x1, y1 = max(0, x0 - m), max(0, y0 - m), min(im.width, x1 + m), min(im.height, y1 + m)
im.crop((x0, y0, x1, y1)).save('public/img/home-p${name}.webp', 'WEBP', quality=88, method=6)
print(x0, y0, x1 - x0, y1 - y0)`;
    const [x0, y0, w, h] = execFileSync('python3', ['-c', py]).toString().trim().split(/\s+/).map(Number);
    out[name] = { w: +(w / r.dpr).toFixed(2), h: +(h / r.dpr).toFixed(2), ax: +(r.ax - x0 / r.dpr).toFixed(2), ay: +(r.ay - y0 / r.dpr).toFixed(2), k: +r.k.toFixed(3) };
    console.log(name, out[name]);
    await ctx.close();
  }
  execFileSync('python3', ['-c', "from PIL import Image; Image.open('/tmp/home-bg.webp').convert('RGB').save('public/img/home-bg.webp','WEBP',quality=80,method=6)"]);
  fs.writeFileSync('src/poster.json', JSON.stringify(out, null, 2) + '\n');
  await b.close();
})();
