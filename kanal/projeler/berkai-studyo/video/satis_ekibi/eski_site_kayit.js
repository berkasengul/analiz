const { chromium } = require('playwright');
const out = process.argv[2];
(async () => {
  const b = await chromium.launch();
  for (const [ad, opt] of [['masa', { viewport: { width: 1920, height: 1080 } }], ['tel', { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }]]) {
    const c = await b.newContext({ ...opt, locale: 'tr-TR', recordVideo: { dir: out + '/' + ad, size: ad === 'masa' ? { width: 1920, height: 1080 } : { width: 780, height: 1688 } } });
    const p = await c.newPage();
    await p.goto('https://www.halarearomatherapy.com/', { waitUntil: 'load', timeout: 60000 }).catch(() => {});
    await p.waitForTimeout(4000);
    // açılır pencereleri kapat
    await p.evaluate(() => { for (const t of [...document.querySelectorAll('button,a')]) if (/şimdi değil|kapat|×/i.test(t.innerText||'')) t.click(); });
    await p.waitForTimeout(1500);
    for (let i = 0; i < 70; i++) { await p.mouse.wheel(0, ad === 'masa' ? 45 : 30); await p.waitForTimeout(110); }
    await p.waitForTimeout(1500);
    await c.close();
  }
  await b.close();
})();
