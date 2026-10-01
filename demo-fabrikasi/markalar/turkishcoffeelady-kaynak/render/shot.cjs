const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: { width: 1000, height: 1800 } });
  p.on('pageerror', (e) => console.log('ERR', e.message));
  const keys = (process.env.K || 'bold-istanbul').split(',');
  for (const k of keys) for (const [r, n] of [[0, 'front'], [Math.PI, 'back']]) {
    await p.goto(`http://127.0.0.1:5210/index.html?k=${k}&r=${r}`);
    await p.waitForFunction(() => window.__done, null, { timeout: 120000 });
    await p.waitForTimeout(300);
    await p.screenshot({ path: `out/${k}-${n}.png`, omitBackground: true });
    console.log('ok', k, n);
  }
  process.exit(0);
})();
