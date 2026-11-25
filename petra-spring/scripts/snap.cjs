// Ürün sayfası açılış görseli: her ürünün 3B paketinin kendi render'ı (şeffaf zemin) ve ekrandaki yeri.
// Çıktı: public/img/snap/<id>.webp ve scripts/snap.json  →  sonra: node scripts/early.mjs && npm run build
// Kullanım: (npx vite preview --port 4173 &) ; node scripts/snap.cjs
const { chromium, devices } = require('playwright');
const fs = require('fs');
const { execFileSync } = require('child_process');
const OUT = 'public/img/snap';
fs.mkdirSync(OUT, { recursive: true });
const GROUPS = (process.env.GROUPS || 'anka,cam-aura,kerasus').split(',');
// telefon ölçümü yalnızca farklı paket tiplerinde (aynı tip paketlerin yeri ve boyu aynıdır)
const ONLY = ['anka', 'once-vatan', 'electro', 'cam-aura', 'kerasus'];
const REDO = (process.env.REDO || '').split(',').filter(Boolean);
const meta = fs.existsSync('scripts/snap.json') ? JSON.parse(fs.readFileSync('scripts/snap.json', 'utf8')) : {};

async function run(b, ctxOpts, key, saveImg) {
  for (const first of GROUPS) {
    const ctx = await b.newContext(ctxOpts);
    const p = await ctx.newPage();
    await p.goto(`http://localhost:4173/urun.html?id=${first}`, { waitUntil: 'domcontentloaded' });
    await p.waitForSelector('#pstage.gl-on', { timeout: 180000 });
    await p.evaluate(() => { const sp = document.querySelector('#spinBtn'); if (sp.getAttribute('aria-pressed') === 'true') sp.click(); });
    const n = await p.$$eval('#pThumbs a', (a) => a.length);
    for (let i = 0; i < n; i++) {
      const id = await p.$eval(`#pThumbs a[data-i="${i}"]`, (a) => new URL(a.href).searchParams.get('id'));
      if (i > 0 || first !== id) { await p.click(`#pThumbs a[data-i="${i}"]`); }
      await p.waitForTimeout(i === 0 ? 1500 : 2200);
      // tam önden: görünümü sıfırla, dönüş kapalı kalsın
      await p.evaluate(() => { const sp = document.querySelector('#spinBtn'); if (sp.getAttribute('aria-pressed') === 'true') sp.click(); window.__scene.setAutoRotate(false); window.__scene.resetView(); });
      if (REDO.length && !REDO.includes(id)) continue;
      if (!saveImg && !ONLY.includes(id)) continue;
      // paket tam önden durana kadar bekle (geçiş animasyonu yavaş cihazda uzun sürer): genişlik/yükseklik oranı sabitlenmeli
      let prev = 0, same = 0;
      for (let t = 0; t < 40 && same < 3; t++) {
        await p.waitForTimeout(700);
        const q = await p.evaluate(() => { const b = window.__scene.screenBox(); return b.w * window.__scene.aspect() / b.h; });
        same = Math.abs(q - prev) < 0.002 ? same + 1 : 0; prev = q;
      }
      const r = await p.evaluate((want) => {
        const s = window.__scene; const box = s.screenBox();
        return { box, url: want ? s.snapshot() : null, bg: want ? s.backdropURL() : null, cw: s.aspect() };
      }, saveImg);
      // ürünün arka planı: sayfa açılır açılmaz görünen zemin (public/img/zemin/<id>.webp)
      if (r.bg) { fs.mkdirSync('public/img/zemin', { recursive: true }); fs.writeFileSync(`public/img/zemin/${id}.webp`, Buffer.from(r.bg.split(',')[1], 'base64')); }
      meta[id] = meta[id] || {};
      meta[id][key] = { cx: +r.box.cx.toFixed(4), cy: +r.box.cy.toFixed(4), h: +r.box.h.toFixed(4), w: +r.box.w.toFixed(4) };
      if (saveImg) {
        const png = `/tmp/snap_${id}.png`;
        fs.writeFileSync(png, Buffer.from(r.url.split(',')[1], 'base64'));
        execFileSync('python3', ['-c', `
from PIL import Image
im=Image.open('${png}').convert('RGBA'); W,H=im.size
bx=im.getbbox()
c=im.crop(bx)
c.save('${OUT}/${id}.webp','WEBP',quality=84,method=6)
print('${id}', c.size)`], { stdio: 'inherit' });
      }
    }
    await ctx.close();
  }
}

(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  await run(b, { viewport: { width: 1920, height: 960 }, deviceScaleFactor: 1 }, 'd', true);
  await run(b, { ...devices['iPhone 13'], deviceScaleFactor: 1 }, 'm', false);
  for (const [id, v] of Object.entries(meta)) if (!v.m) v.m = { ...meta[id.startsWith('cam-') ? 'cam-aura' : ['kerasus','miracle','zeus','keops','agartha','paris'].includes(id) ? 'kerasus' : 'anka'].m };
  fs.writeFileSync('scripts/snap.json', JSON.stringify(meta, null, 1));
  await b.close();
})();
