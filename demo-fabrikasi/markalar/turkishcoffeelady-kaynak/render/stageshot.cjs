const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs = require('fs');
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: { width: 1086, height: 1448 } });
  p.on('pageerror', (e) => console.log('ERR', e.message));
  const meta = {};
  for (const kc of process.env.K.split(',')) {
    const [k, c] = kc.split(':');
    await p.goto(`http://127.0.0.1:5210/stage.html?k=${k}&c=${encodeURIComponent('#' + c)}`);
    await p.waitForFunction(() => window.__done, null, { timeout: 120000 });
    await p.screenshot({ path: `out/stage-${k}.png` });
    meta[k] = await p.evaluate(() => window.__meta);
    console.log(k, JSON.stringify(meta[k]));
  }
  fs.writeFileSync('out/stage.json', JSON.stringify(meta, null, 1));
  process.exit(0);
})();
