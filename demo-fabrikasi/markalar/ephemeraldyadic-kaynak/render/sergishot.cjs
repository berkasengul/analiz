const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs = require('fs');
// K="bold-istanbul:1f2d5e,..." M="stage,card,exhibit" → out/<m>-<k>.png (+ out/stage.json)
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const sizes = { stage: [1086, 1448], card: [900, 1200], exhibit: [1000, 1400], plinth: [1000, 1400], wall: [1600, 1000] };
  const meta = fs.existsSync('out/stage.json') ? JSON.parse(fs.readFileSync('out/stage.json')) : {};
  for (const m of (process.env.M || 'stage').split(',')) {
    const p = await b.newPage({ viewport: { width: sizes[m][0], height: sizes[m][1] } });
    p.on('pageerror', (e) => console.log('ERR', e.message));
    for (const kc of process.env.K.split(',')) {
      const [k, c] = kc.split(':');
      await p.goto(`http://127.0.0.1:5220/sergi.html?m=${m}&k=${k}&c=${encodeURIComponent('#' + c)}`);
      await p.waitForFunction(() => window.__done, null, { timeout: 240000 });
      await p.screenshot({ path: `out/${m}-${k}.png`, omitBackground: m === 'exhibit' || m === 'plinth' });
      if (m === 'stage') meta[k] = await p.evaluate(() => window.__meta);
      console.log(m, k, m === 'stage' ? JSON.stringify(meta[k]) : '');
    }
    await p.close();
  }
  fs.writeFileSync('out/stage.json', JSON.stringify(meta, null, 1));
  process.exit(0);
})();
