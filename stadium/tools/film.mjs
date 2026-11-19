// 16:9 film recorder (default 1280x720, W/H env to change) for the long YouTube video: one continuous take per stadium.
// landing orbit → "Bilet Al" click → fly-in → block click → seat click → ticket.
// Usage: node tools/film.mjs <stadiumId> <framesDir> [fps=30] [fromSec] [toSec]
// Writes JPEG frames + events.json (click times, for sound effects).
import { serve, launch } from './shot.mjs';
import fs from 'node:fs';

const SID = process.argv[2] || 'rams';
const out = process.argv[3] || `frames-${SID}`;
const FPS = +(process.argv[4] || 30);
const FROM = +(process.argv[5] || 0), TO = +(process.argv[6] || 1e9);
fs.mkdirSync(out, { recursive: true });
const innerW = +(process.env.W || 1280), innerH = +(process.env.H || 720);
const END = +(process.env.END || 26);

const port = 8130 + Math.floor(Math.random() * 50);
const srv = await serve(port);
const br = await launch();
const page = await br.newPage({ viewport: { width: +(process.env.W || 1280), height: +(process.env.H || 720) }, deviceScaleFactor: 1 });
page.on('pageerror', (e) => console.log('[pageerror]', e.message));
await page.goto(`http://localhost:${port}/index.html?rec=1&s=${SID}`);
await page.waitForFunction(() => window.__step, null, { timeout: 300000 });

await page.addStyleTag({ content: `
  #rec-cursor{position:fixed;z-index:99;left:0;top:0;width:26px;height:26px;pointer-events:none;transform:translate(-5px,-3px);filter:drop-shadow(0 3px 8px rgba(0,0,0,.55));opacity:0}
  #rec-cursor.on{opacity:1}
  #rec-cursor.down{transform:translate(-5px,-3px) scale(.86)}
  #rec-ring{position:fixed;z-index:98;width:44px;height:44px;margin:-22px 0 0 -22px;border-radius:50%;border:3px solid #fdb912;opacity:0;pointer-events:none}
` });
await page.evaluate(() => {
  const c = document.createElement('div'); c.id = 'rec-cursor';
  c.innerHTML = '<svg viewBox="0 0 24 24" width="26" height="26"><path d="M4 2l16 9.5-7 1.6L9.6 20z" fill="#fff" stroke="#111" stroke-width="1.6" stroke-linejoin="round"/></svg>';
  document.body.appendChild(c);
  const r = document.createElement('div'); r.id = 'rec-ring'; document.body.appendChild(r);
  window.__rec = {
    cursor(x, y, d, on) { c.style.left = x + 'px'; c.style.top = y + 'px'; c.classList.toggle('down', !!d); c.classList.toggle('on', !!on); },
    ring(x, y, k) { r.style.left = x + 'px'; r.style.top = y + 'px'; r.style.opacity = k >= 0 ? (1 - k).toFixed(2) : 0; r.style.transform = `scale(${0.5 + Math.max(0, k)})`; },
  };
});

const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const cur = { x: innerW * 0.78, y: innerH * 0.93, down: false, on: false };
let ring = null, move = null, blockId = null, seatIdx = -1;
const events = [];
const ev = (type, t) => events.push({ type, t: +t.toFixed(3) });
const moveTo = (to, t0, dur) => { move = { from: { x: cur.x, y: cur.y }, to, t0, t1: t0 + dur }; };
const elCenter = (sel) => page.evaluate((sel) => { const r = document.querySelector(sel).getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; }, sel);
// a sellable block near the middle of the screen (the overview camera differs per stadium)
const pickBlock = () => page.evaluate(() => {
  let best = null, bd = 1e9;
  for (const b of app.blocks) {
    if (b.cat === 'Protokol') continue;
    const p = app.blockScreen(b.id); const d = Math.hypot(p.x - innerWidth * 0.42, p.y - innerHeight * 0.58);
    if (d < bd) { bd = d; best = b.id; }
  }
  return best;
});
async function click(t) {
  ring = { x: cur.x, y: cur.y, t0: t }; ev('click', t);
  await page.mouse.move(cur.x, cur.y); await page.mouse.down(); await page.mouse.up();
}
const beats = [
  [4.6, async (t) => { cur.on = true; moveTo(await elCenter('#ctaBtn'), t, 1.6); }],
  [6.6, async (t) => { cur.down = true; }],
  [6.8, async (t) => { cur.down = false; await click(t); ev('whoosh', t + 0.1); }],
  [12.4, async (t) => { blockId = await pickBlock(); moveTo(await page.evaluate((id) => app.blockScreen(id), blockId), t, 1.3); }],
  [14.2, async (t) => { await click(t); ev('whoosh', t + 0.1); }],
  [18.0, async (t) => { seatIdx = await page.evaluate((id) => app.freeSeatNear(id, 8), blockId); moveTo(await elCenter(`circle[data-i="${seatIdx}"]`), t, 1.3); }],
  [19.6, async (t) => { const p = await elCenter(`circle[data-i="${seatIdx}"]`); cur.x = p.x; cur.y = p.y; ring = { x: cur.x, y: cur.y, t0: t }; ev('click', t); ev('whoosh', t + 0.1); await page.click(`circle[data-i="${seatIdx}"]`); }],
  [20.2, async (t) => moveTo({ x: innerW * 0.88, y: innerH * 0.95 }, t, 1.4)],
  [21.8, async (t) => { cur.on = false; }],
];

const N = Math.round(END * FPS);
let bi = 0; const t0 = Date.now();
for (let f = 0; f < N; f++) {
  const t = f / FPS;
  while (bi < beats.length && beats[bi][0] <= t) { await beats[bi][1](t); bi++; }
  if (move) {
    const k = Math.min(1, Math.max(0, (t - move.t0) / (move.t1 - move.t0))); const e = ease(k);
    const arc = Math.sin(Math.PI * e) * 40;
    cur.x = move.from.x + (move.to.x - move.from.x) * e; cur.y = move.from.y + (move.to.y - move.from.y) * e - arc;
    await page.mouse.move(cur.x, cur.y);
    if (k >= 1) move = null;
  }
  const rk = ring ? (t - ring.t0) / 0.45 : -1;
  await page.evaluate(([x, y, d, on, rx, ry, rk]) => { window.__rec.cursor(x, y, d, on); window.__rec.ring(rx, ry, rk > 1 ? -1 : rk); }, [cur.x, cur.y, cur.down, cur.on, ring?.x || 0, ring?.y || 0, rk]);
  await page.evaluate((dt) => { window.__step(dt); const gl = document.querySelector('canvas').getContext('webgl2'); gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(4)); }, 1 / FPS);
  if (t >= FROM && t <= TO) await page.screenshot({ path: `${out}/f${String(f).padStart(5, '0')}.jpg`, type: 'jpeg', quality: 92 });
  if (f % 30 === 0) console.log(`${SID} frame ${f}/${N} t=${t.toFixed(1)}s elapsed ${((Date.now() - t0) / 1000).toFixed(0)}s`);
}
fs.writeFileSync(`${out}/events.json`, JSON.stringify({ blockId, seatIdx, events }, null, 1));
await br.close(); srv.close();
console.log('done', SID, N, 'frames');
