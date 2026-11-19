// Usage: node tools/shot.mjs <outdir> [w h] [actions]
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('/opt/node22/lib/node_modules/playwright');
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const types = { '.json': 'application/json', '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.mp3': 'audio/mpeg' };
export function serve(port = 8123) {
  return new Promise((res) => {
    const s = http.createServer((req, rsp) => {
      let p = decodeURIComponent(new URL(req.url, 'http://x').pathname); if (p.endsWith('/')) p += 'index.html';
      const f = path.join(root, p);
      if (!f.startsWith(root) || !fs.existsSync(f)) { rsp.writeHead(404); rsp.end(); return; }
      const h = { 'content-type': types[path.extname(f)] || 'application/octet-stream' };
      if (process.env.CSP) h['content-security-policy'] = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data: blob:; connect-src 'self'";
      rsp.writeHead(200, h); fs.createReadStream(f).pipe(rsp);
    }).listen(port, () => res(s));
  });
}
export async function launch() {
  return chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
}
if (process.argv[1] === new URL(import.meta.url).pathname) {
  const out = process.argv[2] || 'shots'; fs.mkdirSync(out, { recursive: true });
  const w = +(process.argv[3] || 1440), h = +(process.argv[4] || 900);
  const srv = await serve(); const br = await launch();
  const page = await br.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  page.on('console', (m) => { if (!m.text().includes('GL Driver')) console.log('[console]', m.text()); });
  page.on('pageerror', (e) => console.log('[pageerror]', e.message));
  const t0 = Date.now();
  await page.goto('http://localhost:8123/index.html?rec=1');
  await page.waitForFunction(() => window.__step, null, { timeout: 120000 });
  console.log('load ms', Date.now() - t0);
  const run = async (sec) => { const n = Math.round(sec * 10); for (let i = 0; i < n; i++) await page.evaluate(() => { window.__step(0.1); const gl = document.querySelector('canvas').getContext('webgl2'); gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(4)); }); };
  let t1 = Date.now(); await run(0.5); console.log('15 frames ms', Date.now() - t1);
  await page.screenshot({ path: `${out}/a-intro.png` });
  await run(1.8); await page.screenshot({ path: `${out}/b-intro2.png` });
  await run(4); await page.screenshot({ path: `${out}/c-overview.png` });
  const p = await page.evaluate(() => app.blockScreen('113'));
  await page.mouse.move(p.x, p.y); await run(0.3); await page.screenshot({ path: `${out}/d-hover.png` });
  await page.mouse.down(); await page.mouse.up(); await run(3); await page.screenshot({ path: `${out}/e-block.png` });
  const i = await page.evaluate(() => app.freeSeatNear('113', 14));
  await page.click(`circle[data-i="${i}"]`); await run(3.5); await page.screenshot({ path: `${out}/f-seat.png` });
  await page.keyboard.type('bilet'); await run(4); await page.screenshot({ path: `${out}/g-vip.png` });
  await br.close(); srv.close();
}
