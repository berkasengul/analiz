// Ana sayfa açılış görseli: 3B sahnenin ilk karesi (stüdyo + ilk ürün), yazılar olmadan.
// Sayfa açılır açılmaz bu görsel görünür, 3B hazır olunca fark edilmeden yerini alır (kırmızı/boş ekran yok).
// Çıktı: public/img/home-d.webp (masaüstü), public/img/home-m.webp (telefon)
// Kullanım: (npx vite preview --port 4173 &) ; node scripts/poster.cjs
const { chromium, devices } = require('playwright');
const { execFileSync } = require('child_process');
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  for (const [name, opts] of [['d', { viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1.5 }], ['m', { ...devices['iPhone 13'] }]]) {
    const ctx = await b.newContext(opts);
    const p = await ctx.newPage();
    await p.goto('http://localhost:4173/?nosnap', { waitUntil: 'domcontentloaded' });
    await p.waitForFunction(() => document.body.classList.contains('gl-ready'), null, { timeout: 180000 });
    await p.waitForTimeout(5500);
    await p.addStyleTag({ content: '.ph .player, .products__hit, .ph__next, .ph__list, .ph__count, .ph__poster, .hdr { visibility: hidden !important; }' });
    await p.waitForTimeout(400);
    const el = await p.$('.ph__stick');
    await el.screenshot({ path: `/tmp/home-${name}.png` });
    execFileSync('python3', ['-c', `from PIL import Image; Image.open('/tmp/home-${name}.png').convert('RGB').save('public/img/home-${name}.webp','WEBP',quality=82,method=6)`]);
    console.log('home', name);
    await ctx.close();
  }
  await b.close();
})();
