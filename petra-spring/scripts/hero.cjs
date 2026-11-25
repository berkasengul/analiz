// Ana sayfa açılış görseli için ürünlerin yüksek çözünürlüklü 3B çekimi (şeffaf zemin, hafif açılı)
// Çıktı: /tmp/hero_<id>.png → scripts/hero.py birleştirir. Kullanım: (npx vite preview --port 4173 &) ; node scripts/hero.cjs
const { chromium } = require('playwright');
const fs = require('fs');
const SHOTS = [['kerasus', -0.35], ['once-vatan', 0.28], ['anka', -0.22], ['cam-aura', 0.4], ['ocean', 0.25], ['agartha', 0.3], ['cam-ocean', -0.3], ['gulumse', -0.25]];
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const ctx = await b.newContext({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 2 });
  const p = await ctx.newPage();
  for (const [id, ry] of SHOTS) {
    await p.goto(`http://localhost:4173/urun.html?id=${id}`, { waitUntil: 'domcontentloaded' });
    await p.waitForSelector('#pstage.gl-on', { timeout: 180000 });
    await p.evaluate(() => { const sp = document.querySelector('#spinBtn'); if (sp.getAttribute('aria-pressed') === 'true') sp.click(); window.__scene.setAutoRotate(false); window.__scene.resetView(); });
    await p.waitForTimeout(2500);
    // hafif yan açı: sahnenin açısını doğrudan ayarla (sürükleme)
    const box = await p.$eval('#pv', (c) => { const r = c.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; });
    const cx = box.x + box.w * 0.6, cy = box.y + box.h * 0.5;
    await p.mouse.move(cx, cy); await p.mouse.down();
    await p.mouse.move(cx + ry * 150, cy, { steps: 12 }); await p.mouse.up();
    await p.waitForTimeout(3500);
    const url = await p.evaluate(() => window.__scene.snapshot());
    fs.writeFileSync(`/tmp/hero_${id}.png`, Buffer.from(url.split(',')[1], 'base64'));
    console.log(id);
  }
  await b.close();
})();
