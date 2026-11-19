// High-resolution stills for thumbnails: UI hidden, tighter landing camera, optional interior shot.
// Usage: node tools/still.mjs <stadiumId> <outDir> [fov=24] [az=0]
// Writes <id>_dis.png (exterior, 2560x1440) and <id>_ic.png (interior overview after "Bilet Al").
import { serve, launch } from './shot.mjs';
import fs from 'node:fs';

const SID = process.argv[2] || 'rams', out = process.argv[3] || 'stills';
const FOV = +(process.argv[4] || 24), AZ = +(process.argv[5] || 0);
fs.mkdirSync(out, { recursive: true });
const port = 8200 + Math.floor(Math.random() * 50);
const srv = await serve(port); const br = await launch();
const page = await br.newPage({ viewport: { width: +(process.env.W || 1280), height: +(process.env.H || 720) }, deviceScaleFactor: 2 });
page.on('pageerror', (e) => console.log('[pageerror]', e.message));
await page.goto(`http://localhost:${port}/index.html?rec=1&s=${SID}`);
await page.waitForFunction(() => window.__step, null, { timeout: 300000 });
const hideUI = () => page.evaluate(() => {
  const cv = document.querySelector('canvas');
  document.querySelectorAll('body *').forEach((e) => { e.style.visibility = 'hidden'; });
  let n = cv; while (n && n !== document.body) { n.style.visibility = 'visible'; n = n.parentElement; }
});
const step = (sec) => page.evaluate((sec) => { for (let i = 0; i < Math.round(sec / 0.1); i++) window.__step(0.1); const gl = document.querySelector('canvas').getContext('webgl2'); gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(4)); }, sec);
// exterior: same elevation as the landing view, closer framing (smaller fov)
await page.evaluate(([fov, az, elDeg, dist]) => {
  const el = elDeg * Math.PI / 180, tg = [0, 8, 0];
  window.__dbg.landingOverride = { pos: [tg[0] + dist * Math.cos(el) * Math.sin(az), tg[1] + dist * Math.sin(el), tg[2] + dist * Math.cos(el) * Math.cos(az)], target: tg, fov };
}, [FOV, AZ, +(process.env.EL || 24), +(process.env.DIST || 380)]);
await step(0.3); await hideUI(); await step(0.1);
await page.screenshot({ path: `${out}/${SID}_dis.png` });
console.log(SID, 'dış ok');
if (process.env.NOIC) { await br.close(); srv.close(); process.exit(0); }
// interior: fly in and wait for the flight to finish
await page.evaluate(() => { window.__dbg.landingOverride = null; app.enterStadium(); });
await step(5.5); await hideUI(); await step(0.1);
await page.screenshot({ path: `${out}/${SID}_ic.png` });
console.log(SID, 'iç ok');
await br.close(); srv.close();
