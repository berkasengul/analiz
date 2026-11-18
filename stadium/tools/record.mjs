// Deterministic frame-by-frame recorder for the YouTube Short.
// Usage: node tools/record.mjs <framesDir> [fps] [fromSec] [toSec]
// Writes JPEG frames (1080x1920) + events.json (timestamps for sound effects).
import { serve, launch } from './shot.mjs';
import fs from 'node:fs';

const out = process.argv[2] || 'frames';
const FPS = +(process.argv[3] || 30);
const FROM = +(process.argv[4] || 0), TO = +(process.argv[5] || 1e9);
fs.mkdirSync(out, { recursive: true });

// ---------------- timeline (seconds) ----------------
const CAPTIONS = [
  [0.3, 4.6, 'Galatasaray <b>RAMS Park</b><br>3D bilet sistemi 🦁'],
  [4.8, 9.6, 'Tribünün üstüne gel:<br><b>fiyat + boş koltuk</b>'],
  [9.8, 13.4, 'Tıkla, bloğa <b>uç</b> ✈️'],
  [13.6, 17.4, 'Sıranı ve koltuğunu seç'],
  [17.6, 24.2, 'Bilet, koltuğundan<br><b>göreceğin manzarayı</b> gösteriyor 👀'],
  [24.4, 27.6, 'Şimdi <b>"BİLET"</b> yaz…'],
  [27.8, 34.4, '…ve <b>VIP locaya</b> ışınlan 🥂'],
  [34.6, 41, 'Sen hangi bloğu seçerdin?<br><b>Yorumlara yaz 👇</b>'],
];
const END = 41;

const srv = await serve(8124);
const br = await launch();
const page = await br.newPage({ viewport: { width: 540, height: 960 }, deviceScaleFactor: 2 });
page.on('pageerror', (e) => console.log('[pageerror]', e.message));
await page.goto('http://localhost:8124/index.html?rec=1');
await page.waitForFunction(() => window.__step, null, { timeout: 180000 });

// overlay: fake cursor + captions + watermark
await page.addStyleTag({ content: `
  #rec-cursor{position:fixed;z-index:99;left:0;top:0;width:26px;height:26px;pointer-events:none;transform:translate(-4px,-2px);transition:none;filter:drop-shadow(0 3px 6px rgba(0,0,0,.5))}
  #rec-cursor.down{transform:translate(-4px,-2px) scale(.85)}
  #rec-ring{position:fixed;z-index:98;width:44px;height:44px;margin:-22px 0 0 -22px;border-radius:50%;border:3px solid #fdb912;opacity:0;pointer-events:none}
  #rec-cap{position:fixed;z-index:97;left:22px;right:22px;top:118px;text-align:center;font:800 27px/1.22 Inter,system-ui,sans-serif;color:#fff;text-shadow:0 3px 14px rgba(0,0,0,.75),0 1px 2px rgba(0,0,0,.9);opacity:0;transform:translateY(10px);transition:opacity .25s,transform .25s;pointer-events:none;letter-spacing:-.01em}
  #rec-cap b{color:#fdb912}
  #rec-cap.on{opacity:1;transform:none}
  #rec-tag{position:fixed;z-index:97;right:14px;top:72px;font:700 11px Inter,sans-serif;color:#fff;background:rgba(0,0,0,.45);padding:5px 9px;border-radius:999px;pointer-events:none}
  .disclaimer{bottom:6px!important}
` });
await page.evaluate(() => {
  const c = document.createElement('div'); c.id = 'rec-cursor';
  c.innerHTML = '<svg viewBox="0 0 24 24" width="26" height="26"><path d="M4 2l16 9.5-7 1.6L9.6 20z" fill="#fff" stroke="#111" stroke-width="1.6" stroke-linejoin="round"/></svg>';
  document.body.appendChild(c);
  const r = document.createElement('div'); r.id = 'rec-ring'; document.body.appendChild(r);
  const cap = document.createElement('div'); cap.id = 'rec-cap'; document.body.appendChild(cap);
  const tag = document.createElement('div'); tag.id = 'rec-tag'; tag.textContent = 'Claude Code ile yapıldı'; document.body.appendChild(tag);
  window.__rec = {
    cursor(x, y, down) { c.style.left = x + 'px'; c.style.top = y + 'px'; c.classList.toggle('down', !!down); },
    ring(x, y, k) { r.style.left = x + 'px'; r.style.top = y + 'px'; r.style.opacity = k > 0 ? (1 - k).toFixed(2) : 0; r.style.transform = `scale(${0.5 + k})`; },
    caption(html) { if (html) { if (cap.dataset.h !== html) { cap.innerHTML = html; cap.dataset.h = html; } cap.classList.add('on'); } else cap.classList.remove('on'); },
  };
});

const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const cur = { x: 270, y: 1010, down: false };
let ring = null;
const events = [];
const ev = (type, t) => events.push({ type, t: +t.toFixed(3) });

// scripted beats; each runs when the clock passes its time
const blockPt = (id) => page.evaluate((id) => app.blockScreen(id), id);
const seatEl = async (i) => page.evaluate((i) => { const r = document.querySelector(`circle[data-i="${i}"]`).getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; }, i);
let move = null; // {from,to,t0,t1}
const moveTo = (to, t0, dur) => { move = { from: { x: cur.x, y: cur.y }, to, t0, t1: t0 + dur }; };
let seatIdx = -1;
const beats = [
  [4.9, async (t) => moveTo(await blockPt('106'), t, 1.3)],
  [6.6, async (t) => moveTo(await blockPt('407'), t, 1.0)],
  [8.0, async (t) => moveTo(await blockPt('113'), t, 1.2)],
  [9.9, async (t) => { await click(t); }],
  [12.6, async (t) => { seatIdx = await page.evaluate(() => app.freeSeatNear('113', 14)); }],
  [12.7, async (t) => moveTo(await seatEl(seatIdx), t, 1.6)],
  [14.7, async (t) => { const p = await seatEl(seatIdx); cur.x = p.x; cur.y = p.y; await page.mouse.move(cur.x, cur.y); }],
  [15.0, async (t) => { ring = { x: cur.x, y: cur.y, t0: t }; ev('click', t); await page.click(`circle[data-i="${seatIdx}"]`); }],
  [15.4, async (t) => moveTo({ x: 470, y: 330 }, t, 1.2)],
  [20.6, async (t) => { await page.mouse.move(cur.x, cur.y); await page.mouse.down(); cur.down = true; moveTo({ x: 300, y: 340 }, t, 1.5); }],
  [22.2, async (t) => { moveTo({ x: 420, y: 335 }, t, 1.2); }],
  [23.5, async (t) => { await page.mouse.up(); cur.down = false; }],
  [24.8, async (t) => type('b', t)], [25.05, async (t) => type('i', t)], [25.3, async (t) => type('l', t)], [25.55, async (t) => type('e', t)], [25.8, async (t) => type('t', t)],
  [26.0, async (t) => ev('flip', t)],
  [26.6, async (t) => ev('whoosh', t)],
  [35.0, async (t) => { ev('whoosh', t); await page.evaluate(() => { app.goOverview(); }); }],
  [37.2, async (t) => { await page.evaluate(() => app.setOrbit(true)); }],
];
async function click(t) { ring = { x: cur.x, y: cur.y, t0: t }; ev('click', t); ev('whoosh', t + 0.1); await page.mouse.move(cur.x, cur.y); await page.mouse.down(); await page.mouse.up(); }
async function type(k, t) { ev('key', t); await page.keyboard.press(k); }
ev('whoosh', 0.2); ev('reveal', 1.3); ev('whoosh', 17.6);

const N = Math.round(END * FPS);
let bi = 0; const t0 = Date.now();
for (let f = 0; f < N; f++) {
  const t = f / FPS;
  while (bi < beats.length && beats[bi][0] <= t) { await beats[bi][1](t); bi++; }
  if (move) {
    const k = Math.min(1, Math.max(0, (t - move.t0) / (move.t1 - move.t0)));
    const e = ease(k);
    const arc = Math.sin(Math.PI * e) * 30;
    cur.x = move.from.x + (move.to.x - move.from.x) * e; cur.y = move.from.y + (move.to.y - move.from.y) * e - arc;
    await page.mouse.move(cur.x, cur.y);
    if (k >= 1) move = null;
  }
  const cap = CAPTIONS.find(([a, b]) => t >= a && t < b);
  const rk = ring ? (t - ring.t0) / 0.45 : -1;
  await page.evaluate(([x, y, d, cap, rx, ry, rk]) => { window.__rec.cursor(x, y, d); window.__rec.caption(cap); window.__rec.ring(rx, ry, rk > 1 ? -1 : rk); }, [cur.x, cur.y, cur.down, cap ? cap[2] : '', ring?.x || 0, ring?.y || 0, rk]);
  await page.evaluate((dt) => { window.__step(dt); const gl = document.querySelector('canvas').getContext('webgl2'); gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(4)); }, 1 / FPS);
  if (t >= FROM && t <= TO) await page.screenshot({ path: `${out}/f${String(f).padStart(5, '0')}.jpg`, type: 'jpeg', quality: 93 });
  if (f % 30 === 0) console.log(`frame ${f}/${N}  t=${t.toFixed(1)}s  elapsed ${((Date.now() - t0) / 1000).toFixed(0)}s`);
}
fs.writeFileSync(`${out}/events.json`, JSON.stringify(events, null, 1));
await br.close(); srv.close();
console.log('done', N, 'frames');
