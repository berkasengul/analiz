// Aslan Bilet — RAMS Park 3D bilet deneyimi (hayran yapımı demo)
// Saha 105x68, 3 seviye (100 alt kat / 200 VIP-loca / 400 üst kat), 84 blok.
import * as THREE from './vendor/three.module.min.js';
import { RoomEnvironment } from './vendor/addons/environments/RoomEnvironment.js';
import { STADIUMS } from './stadiums.js';
const SID = new URLSearchParams(location.search).get('s') || (location.hash || '').replace('#', '') || 'rams';
window.addEventListener('hashchange', () => location.reload());
const CFG = STADIUMS[SID] || STADIUMS.rams;

const $ = (s) => document.querySelector(s);
const REC = new URLSearchParams(location.search).has('rec');
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const fmt = (n) => n.toLocaleString('tr-TR');
const TL = (n) => '₺' + fmt(n);
function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const rand = rng(1905);
const fontsReady = document.fonts ? Promise.race([document.fonts.load('900 120px Inter'), new Promise((r) => setTimeout(r, 2500))]).catch(() => {}) : Promise.resolve();

/* ======================================================================
   Stadium geometry (superellipse bowl around a 105 x 68 pitch)
   ====================================================================== */
const PITCH_L = 105, PITCH_W = 68;
const A0 = PITCH_L / 2 + CFG.geo.A0;  // goal-end first row distance
const B0 = PITCH_W / 2 + CFG.geo.B0;  // touchline first row distance
const SEN = CFG.geo.SEN;
const KA = CFG.geo.KA, KB = CFG.geo.KB; // bowl growth per axis (matches the real footprint)
function rAt(phi, d) {
  const a = A0 + d * KA, b = B0 + d * KB;
  const c = Math.abs(Math.cos(phi)) / a, s = Math.abs(Math.sin(phi)) / b;
  return Math.pow(Math.pow(c, SEN) + Math.pow(s, SEN), -1 / SEN);
}
function pAt(phi, d) { const r = rAt(phi, d); return [r * Math.cos(phi), r * Math.sin(phi)]; }
function inwardAt(phi, d) {
  const a = A0 + d * KA, b = B0 + d * KB; const [x, z] = pAt(phi, d);
  const gx = Math.sign(x) * Math.pow(Math.abs(x) / a, SEN - 1) / a;
  const gz = Math.sign(z) * Math.pow(Math.abs(z) / b, SEN - 1) / b;
  const l = Math.hypot(gx, gz) || 1; return [-gx / l, -gz / l];
}
function arcTable(p0, p1, d, n = 96) {
  const ph = [p0], s = [0]; let prev = pAt(p0, d);
  for (let i = 1; i <= n; i++) { const p = p0 + (p1 - p0) * i / n; const q = pAt(p, d); s.push(s[i - 1] + Math.hypot(q[0] - prev[0], q[1] - prev[1])); ph.push(p); prev = q; }
  const L = s[n];
  return { L, phiAt(x) { if (x <= 0) return p0; if (x >= L) return p1; let lo = 0, hi = n; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (s[m] < x) lo = m; else hi = m; } const t = (x - s[lo]) / (s[hi] - s[lo]); return ph[lo] + (ph[hi] - ph[lo]) * t; } };
}

const TIERS = CFG.tiers.map((t) => ({ ...t, color: CFG.seatColor[t.lvl] }));
for (const t of TIERS) {
  t.rd = []; t.rh = []; let h = t.h0;
  for (let j = 0; j < t.rows; j++) { t.rd.push(t.d0 + j * t.depth); t.rh.push(h); h += lerp(t.riseA, t.riseB, j / Math.max(1, t.rows - 1)); }
  t.dEnd = t.d0 + t.rows * t.depth; t.hEnd = t.rh[t.rows - 1];
}
const T1 = TIERS[0], T2 = TIERS[1], T4 = TIERS[2];
const GLASS_D = T2.dEnd + 0.4, LOCA_BACK = T2.dEnd + 8.2, LOCA_CEIL = T4.h0 - 1.6;
const FACADE_D = CFG.geo.facadeD, ROOF_Y = CFG.geo.roofY, ROOF_OUT = ROOF_Y + 0.9;
const OPEN_X = CFG.geo.open.x, OPEN_Z = CFG.geo.open.z, OPEN_ELL = CFG.geo.open.shape === 'ellipse'; // roof opening (from the satellite image)

/* ----- categories (gsplan.org kategori tablosu; fiyatlar örnek) ----- */
const CATS = {
  'Premium': { price: 18500, sold: 0.93 }, 'Delux': { price: 14250, sold: 0.9 }, 'Lux': { price: 10900, sold: 0.9 },
  'Classic': { price: 8400, sold: 0.91 }, '1. Kategori': { price: 6750, sold: 0.95 }, '2. Kategori': { price: 5400, sold: 0.94 },
  '3. Kategori': { price: 4350, sold: 0.93 }, '4. Kategori': { price: 3500, sold: 0.91 }, '5. Kategori': { price: 2650, sold: 0.94 },
  '6. Kategori': { price: 2150, sold: 0.92 }, '7. Kategori': { price: 1650, sold: 0.96 }, '8. Kategori': { price: 1250, sold: 0.95 },
  'Misafir': { price: 1500, sold: 0.7 }, 'Protokol': { price: 0, sold: 1 },
};
const CAT_OF = CFG.cats;
const SIDE_NAMES = CFG.stands.map((x) => x.name);
const STANDS = {}; CFG.stands.forEach((x, k) => { STANDS[x.name] = { gate: x.gate, mid: k * Math.PI / 2, side: k }; });
const LAYOUT = {}; for (const [lvl, sides] of Object.entries(CFG.layout)) { LAYOUT[lvl] = {}; sides.forEach((ids, k) => { LAYOUT[lvl][SIDE_NAMES[k]] = ids; }); }

/* ======================================================================
   Renderer / scene
   ====================================================================== */
const canvas = $('#c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(REC ? Math.min(window.devicePixelRatio || 1, 2) : Math.min(2, Math.max(1.5, window.devicePixelRatio || 1)));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.88;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(36, 1, 0.5, 6000);
{
  const pm = new THREE.PMREMGenerator(renderer);
  scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.32;
}

function canvasTex(w, h, draw, opts = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); draw(g, w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  if (opts.repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(opts.repeat[0], opts.repeat[1]); }
  return t;
}

// sky
const skyDay = canvasTex(4, 256, (g, w, h) => {
  const gr = g.createLinearGradient(0, 0, 0, h);
  gr.addColorStop(0, '#2b3f63'); gr.addColorStop(0.55, '#c9a27c'); gr.addColorStop(1, '#f2d3a6');
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
});
scene.background = skyDay;
const skyNight = new THREE.Color(0x05070d);
scene.fog = new THREE.Fog(0xcdb594, 2600, 7000);

// lights
const hemi = new THREE.HemisphereLight(0xd8e6ff, 0x46523a, 0.0);
const flood = new THREE.DirectionalLight(0xfff4e6, 0); flood.position.set(30, 300, 60); scene.add(flood);
const flood2 = new THREE.DirectionalLight(0xffe9d2, 0); flood2.position.set(-60, 220, -90); scene.add(flood2);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xffecd0, 0.0);
sun.position.set(320, 300, -170);
sun.castShadow = true;
sun.shadow.mapSize.set(4096, 4096);
Object.assign(sun.shadow.camera, { left: -150, right: 150, top: 150, bottom: -150, near: 100, far: 1100 });
sun.shadow.bias = -0.0002; sun.shadow.normalBias = 0.25;
scene.add(sun);

/* ----- generic loft along the bowl ----- */
function loft(profile, phi0, phi1, segs, opt = {}) {
  const pos = [], uv = [], idx = [], col = [];
  const uS = opt.uScale || 10;
  let vAcc = 0;
  for (let k = 0; k < profile.length - 1; k++) {
    const [d0, y0] = profile[k], [d1, y1] = profile[k + 1];
    const segLen = Math.hypot(d1 - d0, y1 - y0);
    const base = pos.length / 3;
    let u0 = 0, u1 = 0, prev0 = null, prev1 = null;
    for (let i = 0; i <= segs; i++) {
      const p = phi0 + (phi1 - phi0) * i / segs;
      const a = pAt(p, d0), b = pAt(p, d1);
      if (prev0) { u0 += Math.hypot(a[0] - prev0[0], a[1] - prev0[1]); u1 += Math.hypot(b[0] - prev1[0], b[1] - prev1[1]); }
      prev0 = a; prev1 = b;
      pos.push(a[0], y0, a[1], b[0], y1, b[1]);
      if (opt.ao) {
        let c0 = 1, c1 = 1;
        if (Math.abs(y1 - y0) < 1e-4 && d1 > d0) { c0 = 1.0; c1 = 0.5; }        // tread: front lit, back (under the seat) dark
        else if (Math.abs(d1 - d0) < 1e-4 && y1 > y0) { c0 = 0.45; c1 = 0.92; } // riser: dark at the foot
        col.push(c0, c0, c0, c1, c1, c1);
      }
      if (opt.vAcross) uv.push(u0 / uS, 0, u1 / uS, 1);
      else uv.push(u0 / uS, vAcc / uS, u1 / uS, (vAcc + segLen) / uS);
      if (i > 0) { const q = base + (i - 1) * 2; idx.push(q, q + 2, q + 1, q + 1, q + 2, q + 3); }
    }
    vAcc += segLen;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  if (opt.ao) g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx); g.computeVertexNormals();
  return g;
}
const FULL = [-Math.PI, Math.PI];

/* ======================================================================
   Pitch & inner bowl floor
   ====================================================================== */
const pitchTex = (() => {
  const IW = (A0 + 1) * 2, IH = (B0 + 1) * 2, S = 16; // px per metre
  return canvasTex(Math.round(IW * S), Math.round(IH * S), (g, w, h) => {
    const cx = w / 2, cy = h / 2, m = (v) => v * S;
    g.fillStyle = '#21452f'; g.fillRect(0, 0, w, h);
    g.save(); g.beginPath(); g.rect(cx - m(PITCH_L / 2 + 3), cy - m(PITCH_W / 2 + 3), m(PITCH_L + 6), m(PITCH_W + 6)); g.clip();
    g.fillStyle = '#285f28'; g.fillRect(0, 0, w, h);
    const sw = PITCH_L / 18;
    for (let i = -12; i < 12; i++) { g.fillStyle = i % 2 ? '#357c33' : '#2b6a2b'; g.fillRect(cx + m(i * sw), 0, m(sw) + 1, h); }
    // subtle noise
    const cw = PITCH_W / 10;
    for (let j = -8; j < 8; j++) { g.fillStyle = j % 2 ? 'rgba(255,255,255,0.015)' : 'rgba(0,0,0,0.015)'; g.fillRect(0, cy + m(j * cw), w, m(cw) + 1); }
    for (let i = 0; i < 120000; i++) { const v = Math.random(); g.fillStyle = v < 0.5 ? `rgba(10,40,10,${0.05 + Math.random() * 0.08})` : `rgba(150,200,90,${0.03 + Math.random() * 0.05})`; g.fillRect(Math.random() * w, Math.random() * h, 1 + Math.random() * 2, 1); }
    g.restore();
    const vg = g.createRadialGradient(cx, cy, m(20), cx, cy, m(75)); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,20,0,0.25)'); g.fillStyle = vg; g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(255,255,255,0.92)'; g.lineWidth = m(0.12) + 0.5;
    const L = m(PITCH_L / 2), W = m(PITCH_W / 2);
    g.strokeRect(cx - L, cy - W, L * 2, W * 2);
    g.beginPath(); g.moveTo(cx, cy - W); g.lineTo(cx, cy + W); g.stroke();
    g.beginPath(); g.arc(cx, cy, m(9.15), 0, Math.PI * 2); g.stroke();
    g.fillStyle = '#fff'; g.beginPath(); g.arc(cx, cy, m(0.25), 0, Math.PI * 2); g.fill();
    for (const s of [-1, 1]) {
      const gx = cx + s * L;
      g.strokeRect(s < 0 ? gx : gx - m(16.5), cy - m(20.16), m(16.5), m(40.32));
      g.strokeRect(s < 0 ? gx : gx - m(5.5), cy - m(9.16), m(5.5), m(18.32));
      const px = gx - s * m(11);
      g.beginPath(); g.arc(px, cy, m(0.22), 0, Math.PI * 2); g.fill();
      g.beginPath(); const a = Math.acos(5.5 / 9.15);
      if (s < 0) g.arc(px, cy, m(9.15), -a, a); else g.arc(px, cy, m(9.15), Math.PI - a, Math.PI + a);
      g.stroke();
      for (const t of [-1, 1]) { g.beginPath(); g.arc(gx, cy + t * W, m(1), s < 0 ? (t < 0 ? 0 : -Math.PI / 2) : (t < 0 ? Math.PI / 2 : Math.PI), s < 0 ? (t < 0 ? Math.PI / 2 : 0) : (t < 0 ? Math.PI : -Math.PI / 2)); g.stroke(); }
    }
  });
})();
{
  const pts = []; for (let i = 0; i < 256; i++) { const [x, z] = pAt(-Math.PI + (i / 256) * Math.PI * 2, 0.9); pts.push(new THREE.Vector2(x, z)); }
  const g = new THREE.ShapeGeometry(new THREE.Shape(pts), 1);
  const p = g.attributes.position, uv = g.attributes.uv;
  for (let i = 0; i < p.count; i++) { uv.setXY(i, (p.getX(i) + A0 + 1) / ((A0 + 1) * 2), 1 - (p.getY(i) + B0 + 1) / ((B0 + 1) * 2)); }
  g.rotateX(Math.PI / 2);
  const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ map: pitchTex, roughness: 0.95, side: THREE.DoubleSide }));
  m.position.y = 0.02; m.receiveShadow = true; scene.add(m);
}
// goals
{
  const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 });
  const netMat = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.25, side: THREE.DoubleSide, depthWrite: false });
  for (const s of [-1, 1]) {
    const grp = new THREE.Group(); grp.position.x = s * PITCH_L / 2;
    const post = new THREE.CylinderGeometry(0.06, 0.06, 2.44, 8);
    for (const z of [-3.66, 3.66]) { const m = new THREE.Mesh(post, mat); m.position.set(0, 1.22, z); m.castShadow = true; grp.add(m); }
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 7.44, 8), mat); bar.rotation.x = Math.PI / 2; bar.position.y = 2.44; bar.castShadow = true; grp.add(bar);
    const net = new THREE.Mesh(new THREE.BoxGeometry(2, 2.44, 7.32), netMat); net.position.set(s * 1, 1.22, 0); grp.add(net);
    scene.add(grp);
  }
}
// LED boards
const ledTex = canvasTex(2048, 64, (g, w, h) => {
  g.fillStyle = '#0b0610'; g.fillRect(0, 0, w, h);
  const words = CFG.led;
  g.font = '900 40px Inter, Arial'; g.textBaseline = 'middle';
  let x = 10, i = 0;
  while (x < w) { const t = words[i % words.length]; g.fillStyle = i % 2 ? CFG.colors.accent : (CFG.ledAlt || '#ff2a4f'); g.fillText(t, x, h / 2 + 2); x += g.measureText(t).width + 60; i++; }
}, { repeat: [1, 1] });
{
  const mat = new THREE.MeshStandardMaterial({ color: 0x000000, emissive: 0xffffff, emissiveMap: ledTex, emissiveIntensity: 1.1, roughness: 0.6 });
  const mk = (len, x, z, ry) => { const tex = ledTex; const g = new THREE.BoxGeometry(len, 0.9, 0.15); const m = new THREE.Mesh(g, mat); m.position.set(x, 0.45, z); m.rotation.y = ry; m.castShadow = true; scene.add(m); };
  mk(100, 0, -(PITCH_W / 2 + 3.6), 0); mk(100, 0, PITCH_W / 2 + 3.6, Math.PI);
  mk(26, -(PITCH_L / 2 + 4.5), -20, Math.PI / 2); mk(26, -(PITCH_L / 2 + 4.5), 20, Math.PI / 2);
  mk(26, PITCH_L / 2 + 4.5, -20, -Math.PI / 2); mk(26, PITCH_L / 2 + 4.5, 20, -Math.PI / 2);
}

/* ======================================================================
   Stands: blocks, treads, seats
   ====================================================================== */
const blocks = [];
const blockById = {};
const concreteTex = canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = '#9a9ca2'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 4000; i++) { const v = 130 + Math.random() * 60; g.fillStyle = `rgba(${v},${v},${v + 4},0.25)`; g.fillRect(Math.random() * w, Math.random() * h, 2, 2); }
}, { repeat: [1, 1] });
concreteTex.wrapS = concreteTex.wrapT = THREE.RepeatWrapping;

function tierProfile(t) {
  const P = [];
  if (t.lvl === 1) P.push([t.d0 - 0.3, -0.1], [t.d0 - 0.3, t.h0 + 0.95], [t.d0, t.h0 + 0.95], [t.d0, t.h0]);
  else if (t.lvl === 2) P.push([t.d0 - 0.5, t.h0 - 2.0], [t.d0 - 0.5, t.h0 + 1.0], [t.d0 - 0.25, t.h0 + 1.0], [t.d0 - 0.25, t.h0], [t.d0, t.h0]);
  else P.push([t.dEnd + 1.6, t.h0 - 1.6], [t.d0 - 1.0, t.h0 - 1.6], [t.d0 - 1.0, t.h0 + 1.0], [t.d0 - 0.75, t.h0 + 1.0], [t.d0 - 0.75, t.h0], [t.d0, t.h0]);
  for (let j = 0; j < t.rows; j++) { P.push([t.rd[j], t.rh[j]], [t.rd[j] + t.depth, t.rh[j]]); }
  if (t.lvl === 1) P.push([t.dEnd, t.hEnd + 1.0], [t.dEnd + 0.8, t.hEnd + 1.0], [t.dEnd + 0.8, -0.1]);
  else if (t.lvl === 2) P.push([LOCA_BACK, t.hEnd], [LOCA_BACK, t.h0 - 2.0], [t.d0 - 0.5, t.h0 - 2.0]);
  else P.push([t.dEnd, t.hEnd + 1.4], [t.dEnd + 1.6, t.hEnd + 1.4], [t.dEnd + 1.6, t.h0 - 1.6]);
  return P;
}

const SEAT_W = CFG.seatW || 0.6, AISLE = 0.8;
const tmpSeats = { x: [], y: [], z: [], yaw: [], blk: [], row: [], num: [] };

for (const t of TIERS) {
  const prof = tierProfile(t);
  const dMid = t.rd[Math.floor(t.rows / 2)];
  const delta = Math.atan2(B0 + dMid, A0 + dMid);
  const RG = [[-delta, delta], [delta, Math.PI - delta], [Math.PI - delta, Math.PI + delta], [Math.PI + delta, 2 * Math.PI - delta]];
  const ranges = {}; SIDE_NAMES.forEach((n, k) => { ranges[n] = RG[k]; });
  for (const stand of SIDE_NAMES) {
    const ids = LAYOUT[t.lvl][stand];
    const [s0, s1] = ranges[stand];
    const arc = arcTable(s0, s1, dMid, 200);
    ids.forEach((id, i) => {
      const pa = arc.phiAt(arc.L * i / ids.length), pb = arc.phiAt(arc.L * (i + 1) / ids.length);
      const cat = CAT_OF[id] || '8. Kategori';
      const b = { id, stand, tier: t, phi0: pa, phi1: pb, cat, price: CATS[cat].price, rows: [], seatStart: tmpSeats.x.length, seatCount: 0, free: 0, index: blocks.length };
      // seats
      for (let j = 0; j < t.rows; j++) {
        const d = t.rd[j] + t.depth * 0.42;
        const ra = arcTable(pa, pb, d, 40);
        const usable = ra.L - 2 * AISLE;
        const n = Math.max(0, Math.floor(usable / SEAT_W));
        const off = AISLE + (usable - n * SEAT_W) / 2 + SEAT_W / 2;
        b.rows.push({ start: tmpSeats.x.length, count: n });
        for (let k = 0; k < n; k++) {
          const ph = ra.phiAt(off + k * SEAT_W);
          const [x, z] = pAt(ph, d); const [ix, iz] = inwardAt(ph, d);
          tmpSeats.x.push(x); tmpSeats.y.push(t.rh[j]); tmpSeats.z.push(z); tmpSeats.yaw.push(Math.atan2(ix, iz));
          tmpSeats.blk.push(blocks.length); tmpSeats.row.push(j + 1); tmpSeats.num.push(k + 1);
        }
      }
      b.seatCount = tmpSeats.x.length - b.seatStart;
      // tread mesh
      const segs = Math.max(4, Math.ceil(arc.L / ids.length / 1.6));
      const geo = loft(prof, pa, pb, segs, { uScale: 8, ao: true });
      const mat = new THREE.MeshStandardMaterial({ color: new THREE.Color(t.lvl === 2 ? 0x8c8a90 : 0xb4b5b8), map: concreteTex, roughness: 0.92, side: THREE.DoubleSide, emissive: 0x000000, vertexColors: true });
      const mesh = new THREE.Mesh(geo, mat); mesh.castShadow = true; mesh.receiveShadow = true; mesh.userData.block = b;
      scene.add(mesh); b.mesh = mesh;
      const pm = (pa + pb) / 2, jm = Math.floor(t.rows / 2);
      const [cx, cz] = pAt(pm, t.rd[jm]); const [nx, nz] = inwardAt(pm, t.rd[jm]);
      b.center = new THREE.Vector3(cx, t.rh[jm], cz); b.inward = new THREE.Vector3(nx, 0, nz);
      blocks.push(b); blockById[id] = b;
    });
  }
}

// aisle stairs: a half-step in the back of every tread, at every block boundary, with a yellow nosing
{
  const steps = [];
  for (const b of blocks) {
    const t = b.tier; if (t.lvl === 2) continue;
    for (let j = 0; j < t.rows - 1; j++) {
      const rise = t.rh[j + 1] - t.rh[j];
      const d = t.rd[j] + t.depth * 0.75;
      const [x, z] = pAt(b.phi0, d); const [ix, iz] = inwardAt(b.phi0, d);
      const [xf, zf] = pAt(b.phi0, t.rd[j] + t.depth * 0.25);
      steps.push([x, t.rh[j], z, Math.atan2(ix, iz), t.depth * 0.5, rise * 0.5, xf, zf]);
    }
  }
  const box = new THREE.BoxGeometry(1, 1, 1); box.translate(0, 0.5, 0);
  const stepMesh = new THREE.InstancedMesh(box, new THREE.MeshStandardMaterial({ color: 0xe0961a, roughness: 0.75 }), steps.length);
  const noseMesh = new THREE.InstancedMesh(box, new THREE.MeshStandardMaterial({ color: 0xffc83a, roughness: 0.6 }), steps.length);
  const plateMesh = new THREE.InstancedMesh(box, new THREE.MeshStandardMaterial({ color: 0xd88c16, roughness: 0.8 }), steps.length);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), p = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0), off = new THREE.Vector3();
  steps.forEach(([x, y, z, yaw, dep, h, xf, zf], i) => {
    q.setFromAxisAngle(up, yaw);
    p.set(x, y, z); sc.set(1.25, h, dep); m.compose(p, q, sc); stepMesh.setMatrixAt(i, m);
    off.set(0, 0, dep / 2 - 0.03).applyQuaternion(q); p.set(x + off.x, y + h, z + off.z); sc.set(1.25, 0.02, 0.06); m.compose(p, q, sc); noseMesh.setMatrixAt(i, m);
    p.set(xf, y, zf); sc.set(1.25, 0.025, dep); m.compose(p, q, sc); plateMesh.setMatrixAt(i, m);
  });
  stepMesh.castShadow = stepMesh.receiveShadow = true; noseMesh.receiveShadow = true;
  plateMesh.receiveShadow = true;
  scene.add(stepMesh, noseMesh, plateMesh);
}

const SEATS = tmpSeats.x.length;
const seatX = Float32Array.from(tmpSeats.x), seatY = Float32Array.from(tmpSeats.y), seatZ = Float32Array.from(tmpSeats.z);
const seatYaw = Float32Array.from(tmpSeats.yaw), seatBlk = Uint16Array.from(tmpSeats.blk);
const seatRow = Uint8Array.from(tmpSeats.row), seatNum = Uint8Array.from(tmpSeats.num);
const seatSold = new Uint8Array(SEATS);
const seatBase = new Float32Array(SEATS * 3);
const seatCol = new Float32Array(SEATS * 3);
// seat mosaic on the Doğu lower tier: the club crest (from assets/gs-crest.png) and the club name in yellow-orange seats
const MOSAIC = (() => {
  const mIds = LAYOUT[CFG.mosaic.tier][SIDE_NAMES[CFG.mosaic.side]], b0 = blockById[mIds[0]], b1 = blockById[mIds[mIds.length - 1]];
  const p0 = b0.phi0, p1 = b1.phi1, rows = b0.tier.rows, W = 1400, RH = 6, H = rows * RH;
  const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d');
  const top = rows * 0.11 * RH, bot = rows * 0.89 * RH, hh = bot - top;
  g.fillStyle = CFG.mosaic.color; g.font = `900 ${rows * 0.7 * RH * 1.18}px "Arial Black", "DejaVu Sans", Arial, sans-serif`; g.textBaseline = 'alphabetic';
  const txt = CFG.mosaic.text, tw = g.measureText(txt).width, x0 = W * (CFG.mosaic.crest || CFG.mosaic.year ? 0.165 : 0.06), x1 = W * 0.985;
  g.save(); g.translate(x0, rows * 0.865 * RH); g.scale((x1 - x0) / tw, 1); g.fillText(txt, 0, 0); g.restore();
  if (CFG.mosaic.year) { g.save(); g.font = `900 ${rows * 0.68 * RH * 0.62}px "Arial Black", "DejaVu Sans", Arial, sans-serif`; g.textAlign = 'center'; g.translate(W * 0.083, rows * 0.76 * RH); g.scale(0.62, 1); g.fillText(CFG.mosaic.year, 0, 0); g.restore(); }
  let img = g.getImageData(0, 0, W, H).data;
  // crest box in mosaic pixels (seat columns are ~1.25x wider per metre than rows, hence the 0.96 factor)
  const ch = hh, cw = ch * (367 / 480) * 1.256, cx0 = W * 0.083 - cw / 2;
  let crest = null; // { data, w, h }
  const PAL = [[244, 241, 234], [242, 165, 27], [196, 22, 56], [28, 24, 28]];
  const sample = (i) => {
    if (seatBlk[i] < b0.index || seatBlk[i] > b1.index) return null;
    let ph = Math.atan2(seatZ[i], seatX[i]); if (ph < 0) ph += Math.PI * 2;
    const px = ((ph - p0) / (p1 - p0)) * W, py = (rows - seatRow[i] + 0.5) * RH;
    if (crest && px >= cx0 && px < cx0 + cw && py >= top && py < bot) {
      const u = (px - cx0) / cw, v = (py - top) / ch;
      if (((u - 0.5) / 0.458) ** 2 + ((v - 0.5) / 0.462) ** 2 <= 1) {
        const o = (Math.floor(v * crest.h) * crest.w + Math.floor(u * crest.w)) * 4, d = crest.data;
        let best = 0, bd = 1e9; for (let k = 0; k < PAL.length; k++) { const e = (d[o] - PAL[k][0]) ** 2 + (d[o + 1] - PAL[k][1]) ** 2 + (d[o + 2] - PAL[k][2]) ** 2; if (e < bd) { bd = e; best = k; } }
        return PAL[best].map((x) => x / 255);
      }
    }
    const qx = Math.floor(px), qy = Math.floor(py);
    if (qx < 0 || qx >= W || qy < 0 || qy >= H) return null;
    const o = (qy * W + qx) * 4; return img[o + 3] > 110 ? [img[o] / 255, img[o + 1] / 255, img[o + 2] / 255] : null;
  };
  sample.setCrest = (im) => {
    const cc = document.createElement('canvas'); cc.width = 160; cc.height = Math.round(160 * im.height / im.width);
    const cg = cc.getContext('2d'); cg.fillStyle = '#fff'; cg.fillRect(0, 0, cc.width, cc.height); cg.drawImage(im, 0, 0, cc.width, cc.height);
    crest = { data: cg.getImageData(0, 0, cc.width, cc.height).data, w: cc.width, h: cc.height };
  };
  sample.range = [b0.seatStart, b1.seatStart + b1.seatCount];
  return sample;
})();
const seatVar = new Float32Array(SEATS);
function seatColour(i, c) {
  const b = blocks[seatBlk[i]], mos = MOSAIC(i);
  if (mos) c.setRGB(mos[0], mos[1], mos[2], THREE.SRGBColorSpace); else c.setHex(CFG.seatColor[b.tier.lvl]);
  c.multiplyScalar(seatVar[i]);
  seatBase[i * 3] = c.r; seatBase[i * 3 + 1] = c.g; seatBase[i * 3 + 2] = c.b;
}
const crestReady = new Promise((res) => {
  const im = new Image(); im.onload = () => { MOSAIC.setCrest(im); const c = new THREE.Color(); for (let i = MOSAIC.range[0]; i < MOSAIC.range[1]; i++) seatColour(i, c); paintDirty = true; res(); };
  im.onerror = () => res(); if (CFG.mosaic.crest) im.src = CFG.mosaic.crest; else res();
});
{
  const c = new THREE.Color();
  for (let i = 0; i < SEATS; i++) {
    const b = blocks[seatBlk[i]];
    // availability: clustered so free seats come in small groups
    const p = CATS[b.cat].sold;
    const n = Math.sin(seatRow[i] * 1.7 + seatNum[i] * 0.37 + b.index * 3.1) * 0.5 + 0.5;
    seatSold[i] = rand() < p * (0.85 + 0.3 * n) ? 1 : 0;
    if (b.cat === 'Protokol') seatSold[i] = 1;
    if (!seatSold[i]) b.free++;
    seatVar[i] = 0.92 + rand() * 0.14; seatColour(i, c);
  }
}
// moulded bucket seat: side profile extruded across the seat width, darker underneath (baked AO)
const seatGeo = (() => {
  // moulded shell (side profile extruded across the seat), curved backrest, rounded front lip
  const P = [[0.205, 0.405], [0.19, 0.448], [0.10, 0.462], [-0.10, 0.452], [-0.17, 0.48], [-0.205, 0.56], [-0.228, 0.70], [-0.235, 0.83], [-0.215, 0.862], [-0.19, 0.845], [-0.18, 0.70], [-0.15, 0.555], [-0.11, 0.50], [0.08, 0.492], [0.17, 0.486], [0.222, 0.445]];
  const shell = new THREE.ExtrudeGeometry(new THREE.Shape(P.map(([z, y]) => new THREE.Vector2(z, y))), { depth: 0.43, bevelEnabled: true, bevelThickness: 0.014, bevelSize: 0.014, bevelSegments: 2, curveSegments: 2 });
  shell.translate(0, 0, -0.215); shell.rotateY(-Math.PI / 2);
  const foot = new THREE.BoxGeometry(0.07, 0.4, 0.09); foot.translate(0, 0.2, -0.05);
  const bracket = new THREE.BoxGeometry(0.3, 0.035, 0.05); bracket.translate(0, 0.39, -0.02);
  const parts = [[shell, null], [foot.toNonIndexed(), 0.14], [bracket.toNonIndexed(), 0.14]];
  const pos = [], nor = [], col = [];
  for (const [g, dark] of parts) {
    const gp = (g.index ? g.toNonIndexed() : g).attributes; g.computeVertexNormals();
    const P2 = (g.index ? g.toNonIndexed() : g).attributes.position, N2 = (g.index ? g.toNonIndexed() : g).attributes.normal;
    for (let i = 0; i < P2.count; i++) {
      const y = P2.getY(i); pos.push(P2.getX(i), y, P2.getZ(i)); nor.push(N2.getX(i), N2.getY(i), N2.getZ(i));
      const k = dark != null ? dark : 0.5 + 0.5 * Math.min(1, Math.max(0, (y - 0.4) / 0.45));
      col.push(k, k, k);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  return g;
})();
const seatMat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.38, metalness: 0.0, clearcoat: 0.25, clearcoatRoughness: 0.5, vertexColors: true });
const seatMeshes = [];
{
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), s = new THREE.Vector3(1, 1, 1), p = new THREE.Vector3();
  for (const b of blocks) {
    const im = new THREE.InstancedMesh(seatGeo, seatMat, b.seatCount);
    for (let k = 0; k < b.seatCount; k++) { const i = b.seatStart + k; e.set(0, seatYaw[i] + (rand() - 0.5) * 0.05, 0); q.setFromEuler(e); p.set(seatX[i], seatY[i], seatZ[i]); m.compose(p, q, s); im.setMatrixAt(k, m); }
    im.instanceColor = new THREE.InstancedBufferAttribute(seatCol.subarray(b.seatStart * 3, (b.seatStart + b.seatCount) * 3), 3);
    im.computeBoundingSphere(); im.castShadow = true; im.receiveShadow = true;
    scene.add(im); seatMeshes.push(im); b.seats = im;
  }
}
// far LOD: one point per seat (overview), 3D chairs when the camera is close
const seatPoints = (() => {
  const pos = new Float32Array(SEATS * 3);
  for (let i = 0; i < SEATS; i++) { pos[i * 3] = seatX[i]; pos[i * 3 + 1] = seatY[i] + 0.55; pos[i * 3 + 2] = seatZ[i]; }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.BufferAttribute(seatCol, 3));
  const m = new THREE.PointsMaterial({ size: 0.86 * renderer.getPixelRatio(), vertexColors: true, sizeAttenuation: true, toneMapped: false });
  const p = new THREE.Points(g, m); p.frustumCulled = false; scene.add(p); return p;
})();
function setSeatLod() {
  const far = camera.position.length() > 300;
  seatPoints.visible = far; for (const im of seatMeshes) im.visible = !far;
}
const standStats = {};
for (const b of blocks) {
  const s = (standStats[b.stand] ||= { free: 0, seats: 0, min: Infinity });
  s.free += b.free; s.seats += b.seatCount;
  if (b.price > 0 && b.cat !== 'Misafir' && b.free > 0) s.min = Math.min(s.min, b.price);
}

/* ----- loca glass band, back wall, ceiling ----- */
const glassMat = new THREE.MeshPhysicalMaterial({ color: 0x9cc3d6, metalness: 0.1, roughness: 0.05, transparent: true, opacity: 0.22, side: THREE.DoubleSide, depthWrite: false });
scene.add(new THREE.Mesh(loft([[GLASS_D, T2.hEnd], [GLASS_D, LOCA_CEIL]], ...FULL, 720), glassMat));
const locaTex = canvasTex(512, 64, (g, w, h) => {
  g.fillStyle = '#2a2018'; g.fillRect(0, 0, w, h);
  for (let x = 0; x < w; x += 64) { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#ffcf8a'); gr.addColorStop(1, '#7a4a22'); g.fillStyle = gr; g.globalAlpha = 0.55 + Math.random() * 0.4; g.fillRect(x + 4, 8, 56, h - 14); g.globalAlpha = 1; }
}, { repeat: [1, 1] });
locaTex.wrapS = THREE.RepeatWrapping;
{
  const back = new THREE.Mesh(loft([[LOCA_BACK - 0.05, T2.hEnd], [LOCA_BACK - 0.05, LOCA_CEIL]], ...FULL, 720, { uScale: 32, vAcross: true }), new THREE.MeshStandardMaterial({ color: 0x000000, emissive: 0xffffff, emissiveMap: locaTex, emissiveIntensity: 0.8, side: THREE.DoubleSide }));
  scene.add(back);
  const ceil = new THREE.Mesh(loft([[T2.dEnd - 0.2, LOCA_CEIL], [T4.d0, LOCA_CEIL]], ...FULL, 720), new THREE.MeshStandardMaterial({ color: 0x55525a, roughness: 0.9, side: THREE.DoubleSide }));
  scene.add(ceil);
  // mullions
  const mpos = [];
  for (let i = 0; i < 360; i++) { const p = -Math.PI + i * Math.PI * 2 / 360; const [x, z] = pAt(p, GLASS_D); mpos.push(x, T2.hEnd, z, x, LOCA_CEIL, z); }
  const ml = new THREE.LineSegments(new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(mpos, 3)), new THREE.LineBasicMaterial({ color: 0x30343a }));
  scene.add(ml);
}

/* ----- LED ribbon boards between the tiers ----- */
const ribbonTex = canvasTex(2048, 48, (g, w, h) => {
  g.fillStyle = '#05060c'; g.fillRect(0, 0, w, h);
  g.fillStyle = CFG.ribbon.bg; g.fillRect(0, 3, w, h - 6);
  const words = CFG.ribbon.words;
  g.font = '900 24px Inter, Arial, sans-serif'; g.textBaseline = 'middle'; g.textAlign = 'center';
  for (let k = 0; k < 8; k++) { const x = (k + 0.5) * w / 8; g.fillStyle = CFG.ribbon.fg; g.fillText(words[k % 4], x, h / 2 + 1); g.fillStyle = CFG.ribbon.dot; g.beginPath(); g.arc(x + w / 16, h / 2, 4, 0, Math.PI * 2); g.fill(); }
}, { repeat: [1, 1] });
ribbonTex.wrapS = THREE.RepeatWrapping;
{
  const mat = new THREE.MeshStandardMaterial({ color: 0x000000, emissive: 0xffffff, emissiveMap: ribbonTex, emissiveIntensity: 1.25, side: THREE.DoubleSide });
  scene.add(new THREE.Mesh(loft([[T2.d0 - 0.56, T2.h0 - 1.9], [T2.d0 - 0.56, T2.h0 + 0.85]], ...FULL, 720, { uScale: 40, vAcross: true }), mat));
  scene.add(new THREE.Mesh(loft([[T4.d0 - 1.06, T4.h0 - 1.5], [T4.d0 - 1.06, T4.h0 + 0.85]], ...FULL, 720, { uScale: 40, vAcross: true }), mat));
}

/* ----- facade signage helper ----- */
const sign = (text, color, glow, phi, y, w, h) => {
    const t = canvasTex(2048, 256, (g, cw, ch) => {
      g.clearRect(0, 0, cw, ch);
      g.font = `900 ${ch * 0.6}px Inter, "Arial Black", Arial, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
      const tw = Math.min(cw * 0.94, g.measureText(text).width);
      g.save(); g.translate(cw / 2, ch / 2 + 6); g.scale(tw / g.measureText(text).width, 1);
      if (glow) { g.shadowColor = color; g.shadowBlur = 26; }
      g.fillStyle = color; g.fillText(text, 0, 0);
      g.shadowBlur = 0; g.lineWidth = 3; g.strokeStyle = 'rgba(0,0,0,0.35)'; g.strokeText(text, 0, 0);
      g.restore();
    });
    t.anisotropy = 16;
    const [x, z] = pAt(phi, FACADE_D + 1.75), [ix, iz] = inwardAt(phi, FACADE_D), ry = Math.atan2(-ix, -iz);
    const panel = new THREE.Mesh(new THREE.BoxGeometry(w * 1.04, h * 1.5, 0.4), new THREE.MeshStandardMaterial({ color: 0x1d2026, roughness: 0.4, metalness: 0.5 }));
    const [px, pz] = pAt(phi, FACADE_D + 1.35); panel.position.set(px, y, pz); panel.rotation.y = ry; panel.castShadow = true; scene.add(panel);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: t, transparent: true, emissive: new THREE.Color(glow ? color : 0x555555), emissiveMap: t, emissiveIntensity: glow ? 1.5 : 0.35, roughness: 0.35, metalness: 0.2, depthWrite: false }));
    m.position.set(x, y, z); m.rotation.y = ry; scene.add(m);
  };

/* ----- facade (from the reference renders): dark clad base, glazed band behind white V-columns, pylons, signage ----- */
if (CFG.facade.style === 'rams') {
  const cladTex = canvasTex(512, 256, (g, w, h) => {
    g.fillStyle = '#3a3d43'; g.fillRect(0, 0, w, h);
    for (let x = 0; x < w; x += 32) { g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(x, 0, 2, h); }
    for (let y = 0; y < h; y += 32) { g.fillStyle = 'rgba(255,255,255,0.05)'; g.fillRect(0, y, w, 2); }
    g.fillStyle = 'rgba(205,210,215,0.55)'; for (let x = 20; x < w; x += 256) { g.fillRect(x, 70, 190, 9); g.fillRect(x + 40, 96, 150, 9); g.fillRect(x + 10, 122, 200, 9); }
    for (let x = 0; x < w; x += 64) for (let y = 0; y < h; y += 32) { g.fillStyle = `rgba(255,255,255,${Math.random() * 0.04})`; g.fillRect(x + 1, y + 1, 62, 30); }
  }, { repeat: [1, 1] });
  cladTex.wrapS = cladTex.wrapT = THREE.RepeatWrapping;
  const base = new THREE.Mesh(loft([[FACADE_D, 5.2], [FACADE_D, 13]], ...FULL, 720, { uScale: 32 }), new THREE.MeshStandardMaterial({ map: cladTex, roughness: 0.45, metalness: 0.35, side: THREE.DoubleSide }));
  base.castShadow = base.receiveShadow = true; scene.add(base);
  // glazed ground floor (entrances / shops): blue-grey glass with mullions and a dark soffit
  const lobbyTex = canvasTex(512, 128, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#2b3a48'); gr.addColorStop(0.55, '#5d7488'); gr.addColorStop(1, '#22303c'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(255,255,255,0.08)'; for (let x = 0; x < w; x += 9) g.fillRect(x, 0, 3, h);
    g.fillStyle = '#c9ccd0'; for (let x = 0; x < w; x += 64) g.fillRect(x, 0, 4, h); g.fillRect(0, 0, w, 6); g.fillRect(0, h * 0.62, w, 3);
    g.fillStyle = 'rgba(255,214,150,0.35)'; for (let x = 20; x < w; x += 128) g.fillRect(x, h * 0.66, 30, h * 0.3);
  }, { repeat: [1, 1] });
  lobbyTex.wrapS = lobbyTex.wrapT = THREE.RepeatWrapping;
  const lobby = new THREE.Mesh(loft([[FACADE_D - 1.6, 1.25], [FACADE_D - 1.6, 5.2]], ...FULL, 720, { uScale: 24, vAcross: true }), new THREE.MeshStandardMaterial({ map: lobbyTex, roughness: 0.12, metalness: 0.55, side: THREE.DoubleSide }));
  scene.add(lobby);
  scene.add(new THREE.Mesh(loft([[FACADE_D - 1.6, 5.2], [FACADE_D, 5.2]], ...FULL, 720), new THREE.MeshStandardMaterial({ color: 0x2a2d32, roughness: 0.8, side: THREE.DoubleSide })));
  const white = new THREE.MeshStandardMaterial({ color: 0xeeeff1, roughness: 0.5, side: THREE.DoubleSide });
  scene.add(new THREE.Mesh(loft([[FACADE_D + 0.4, 12.6], [FACADE_D + 0.4, 14.2], [FACADE_D - 3, 14.2]], ...FULL, 720), white));
  scene.add(new THREE.Mesh(loft([[FACADE_D - 3, 30.4], [FACADE_D + 0.4, 30.4], [FACADE_D + 0.4, 31.8]], ...FULL, 720), white));
  const glass = new THREE.Mesh(loft([[FACADE_D - 3, 14.2], [FACADE_D - 3, 30.4]], ...FULL, 720), new THREE.MeshStandardMaterial({ color: 0x8e1219, roughness: 0.55, metalness: 0.05, side: THREE.DoubleSide }));
  scene.add(glass);
  const upTex = canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#5a5e66'; g.fillRect(0, 0, w, h); for (let x = 0; x < w; x += 16) { g.fillStyle = x % 32 ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.08)'; g.fillRect(x, 0, 6, h); } }, { repeat: [1, 1] });
  upTex.wrapS = upTex.wrapT = THREE.RepeatWrapping;
  const up = new THREE.Mesh(loft([[FACADE_D - 1, 31.8], [FACADE_D - 1, 37.6]], ...FULL, 720, { uScale: 16 }), new THREE.MeshStandardMaterial({ map: upTex, roughness: 0.7, side: THREE.DoubleSide }));
  up.castShadow = true; scene.add(up);
  // white V-columns around the glazed band
  const arc = arcTable(-Math.PI, Math.PI, FACADE_D + 0.2, 720), n = Math.round(arc.L / 9);
  const vm = new THREE.Matrix4(), q = new THREE.Quaternion(), upv = new THREE.Vector3(0, 1, 0), dv = new THREE.Vector3(), mid = new THREE.Vector3(), sc = new THREE.Vector3();
  const col = new THREE.InstancedMesh(new THREE.CylinderGeometry(1, 1, 1, 8), white, n * 2);
  for (let k = 0; k < n; k++) {
    const pa = arc.phiAt(arc.L * k / n), pb = arc.phiAt(arc.L * (k + 0.5) / n), pc = arc.phiAt(arc.L * (k + 1) / n);
    const [ax, az] = pAt(pa, FACADE_D + 0.2), [bx, bz] = pAt(pb, FACADE_D + 0.2), [cx, cz] = pAt(pc, FACADE_D + 0.2);
    [[ax, 31, az, bx, 14, bz], [bx, 14, bz, cx, 31, cz]].forEach(([x0, y0, z0, x1, y1, z1], j) => {
      const A = new THREE.Vector3(x0, y0, z0), B = new THREE.Vector3(x1, y1, z1); dv.subVectors(B, A); const len = dv.length();
      q.setFromUnitVectors(upv, dv.normalize()); mid.addVectors(A, B).multiplyScalar(0.5); sc.set(0.32, len, 0.32); vm.compose(mid, q, sc); col.setMatrixAt(k * 2 + j, vm);
    });
  }
  col.castShadow = true; scene.add(col);
  // sloped concrete pylons carrying the roof (12 around the bowl)
  const concTex = canvasTex(128, 512, (g, w, h) => { g.fillStyle = '#c9c5bd'; g.fillRect(0, 0, w, h); for (let i = 0; i < 2500; i++) { const v = 170 + Math.random() * 50; g.fillStyle = `rgba(${v},${v - 4},${v - 10},0.35)`; g.fillRect(Math.random() * w, Math.random() * h, 2, 2); } g.fillStyle = 'rgba(0,0,0,0.12)'; for (let y = 64; y < h; y += 64) g.fillRect(0, y, w, 2); });
  const concMat = new THREE.MeshStandardMaterial({ map: concTex, roughness: 0.85 });
  const prof = new THREE.Shape([new THREE.Vector2(1.6, 0), new THREE.Vector2(10.5, 0), new THREE.Vector2(10.5, 2.5), new THREE.Vector2(5.6, ROOF_Y - 1), new THREE.Vector2(1.6, ROOF_Y - 1)]);
  const pyGeo = new THREE.ExtrudeGeometry(prof, { depth: 4.2, bevelEnabled: false }); pyGeo.translate(0, 0, -2.1);
  const pyArc = arcTable(-Math.PI, Math.PI, FACADE_D, 720), NP = 12; window.__pyPhis = [];
  for (let k = 0; k < NP; k++) {
    const ph = pyArc.phiAt(pyArc.L * (k + 0.5) / NP), [x, z] = pAt(ph, FACADE_D - 0.5), [ix, iz] = inwardAt(ph, FACADE_D);
    window.__pyPhis.push(ph);
    const py = new THREE.Mesh(pyGeo, concMat);
    py.position.set(x, 0, z); py.rotation.y = Math.atan2(-iz, ix) + Math.PI; // local +x points outward
    py.castShadow = py.receiveShadow = true; scene.add(py);
  }
  // podium the stadium stands on
  const podium = new THREE.Mesh(loft([[FACADE_D - 1, 1.3], [FACADE_D + 11, 1.3], [FACADE_D + 11, -0.4]], ...FULL, 720, { uScale: 6 }), new THREE.MeshStandardMaterial({ color: 0xd9d6cf, roughness: 0.9, side: THREE.DoubleSide }));
  podium.receiveShadow = true; scene.add(podium);
  // signage on the west (main) facade
  // place each sign in the middle of a bay between two pylons
  const P = window.__pyPhis.slice().sort((a, b) => a - b), bays = P.map((p, k) => { const q = k + 1 < P.length ? P[k + 1] : P[0] + Math.PI * 2; let m = (p + q) / 2; if (m > Math.PI) m -= Math.PI * 2; return m; });
  const near = (t) => bays.reduce((best, m) => (Math.abs(Math.atan2(Math.sin(m - t), Math.cos(m - t))) < Math.abs(Math.atan2(Math.sin(best - t), Math.cos(best - t))) ? m : best), bays[0]);
  const west = near(Math.PI / 2), westL = near(Math.PI / 2 + 0.55), east = near(-Math.PI / 2);
  fontsReady.then(() => {
    const at = { main: west, mainLeft: westL, back: east };
    for (const sg of CFG.facade.signs) sign(sg.text, sg.color, !!sg.glow, at[sg.at], 22.2, sg.glow ? 48 : 44, sg.glow ? 4.4 : 6.6);
  });
} else {
  // modern facade: clad base (optionally stone arches), glazed band with vertical fins, accent stripe, signage
  const F = CFG.facade, topY = T4.hEnd + 1.6;
  const baseTex = canvasTex(512, 256, (g, w, h) => {
    g.fillStyle = F.base; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 3000; i++) { g.fillStyle = `rgba(0,0,0,${Math.random() * 0.05})`; g.fillRect(Math.random() * w, Math.random() * h, 2, 2); }
    if (F.arches) { // stone arcade like the historic Dolmabahçe side
      g.fillStyle = 'rgba(0,0,0,0.12)'; for (let y = 0; y < h; y += 20) g.fillRect(0, y, w, 1);
      for (let x = 16; x < w; x += 64) { g.fillStyle = '#1d2228'; g.beginPath(); g.moveTo(x, h); g.lineTo(x, h * 0.42); g.arc(x + 16, h * 0.42, 16, Math.PI, 0); g.lineTo(x + 32, h); g.fill(); g.strokeStyle = 'rgba(255,255,255,0.35)'; g.lineWidth = 2; g.stroke(); }
    } else {
      g.fillStyle = 'rgba(0,0,0,0.18)'; for (let x = 0; x < w; x += 32) g.fillRect(x, 0, 2, h); for (let y = 0; y < h; y += 32) g.fillRect(0, y, w, 2);
      g.fillStyle = 'rgba(30,40,52,0.8)'; for (let x = 10; x < w; x += 64) g.fillRect(x, h * 0.55, 44, h * 0.42);
    }
  }, { repeat: [1, 1] });
  baseTex.wrapS = baseTex.wrapT = THREE.RepeatWrapping;
  const base = new THREE.Mesh(loft([[FACADE_D, -0.1], [FACADE_D, 11]], ...FULL, 720, { uScale: 34, vAcross: true }), new THREE.MeshStandardMaterial({ map: baseTex, roughness: 0.8, side: THREE.DoubleSide }));
  base.castShadow = base.receiveShadow = true; scene.add(base);
  const bandTex = canvasTex(512, 256, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, F.band); gr.addColorStop(0.6, '#2f3f55'); gr.addColorStop(1, F.band); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(255,255,255,0.07)'; for (let x = 0; x < w; x += 12) g.fillRect(x, 0, 4, h);
    g.fillStyle = '#d9dce0'; for (let x = 0; x < w; x += 48) g.fillRect(x, 0, 5, h);
  }, { repeat: [1, 1] });
  bandTex.wrapS = bandTex.wrapT = THREE.RepeatWrapping;
  const band = new THREE.Mesh(loft([[FACADE_D - 0.4, 11], [FACADE_D - 0.4, topY]], ...FULL, 720, { uScale: 24, vAcross: true }), new THREE.MeshStandardMaterial({ map: bandTex, roughness: 0.15, metalness: 0.55, side: THREE.DoubleSide }));
  band.castShadow = true; scene.add(band);
  scene.add(new THREE.Mesh(loft([[FACADE_D + 0.3, 10.6], [FACADE_D + 0.3, 12.0]], ...FULL, 720), new THREE.MeshStandardMaterial({ color: new THREE.Color(F.accent), roughness: 0.5, side: THREE.DoubleSide })));
  scene.add(new THREE.Mesh(loft([[FACADE_D - 0.4, topY], [FACADE_D + 0.4, topY], [FACADE_D + 0.4, topY + 1.2]], ...FULL, 720), new THREE.MeshStandardMaterial({ color: 0xe9eaec, roughness: 0.5, side: THREE.DoubleSide })));
  // slender steel columns carrying the roof
  const arc = arcTable(-Math.PI, Math.PI, FACADE_D + 1.2, 720), n = Math.round(arc.L / 12);
  const colGeo = new THREE.CylinderGeometry(0.45, 0.6, ROOF_Y + 1, 10); colGeo.translate(0, (ROOF_Y + 1) / 2, 0);
  const cols = new THREE.InstancedMesh(colGeo, new THREE.MeshStandardMaterial({ color: 0xe7e8ea, roughness: 0.4, metalness: 0.3 }), n);
  const m4 = new THREE.Matrix4();
  for (let k = 0; k < n; k++) { const [x, z] = pAt(arc.phiAt(arc.L * k / n), FACADE_D + 1.2); m4.makeTranslation(x, 0, z); cols.setMatrixAt(k, m4); }
  cols.castShadow = true; scene.add(cols);
  scene.add(new THREE.Mesh(loft([[FACADE_D - 1, 1.2], [FACADE_D + 9, 1.2], [FACADE_D + 9, -0.4]], ...FULL, 720), new THREE.MeshStandardMaterial({ color: 0xd2cfc8, roughness: 0.9, side: THREE.DoubleSide })));
  fontsReady.then(() => {
    const at = { main: Math.PI / 2, mainLeft: Math.PI / 2 + 0.5, back: -Math.PI / 2 };
    for (const sg of F.signs) sign(sg.text, sg.color, !!sg.glow, at[sg.at], (11 + topY) / 2, sg.glow ? 40 : 52, sg.glow ? 5 : 6);
  });
}

/* ----- roof: white rim, solar panels split by a "#" of white trusses, rectangular opening ----- */
// white membrane roof: radial seams, a grey truss band, painted lettering (and an eagle on the Tüpraş roof)
function drawMembrane(g, w, h, X, Z) {
  g.fillStyle = '#f2f3f4'; g.fillRect(0, 0, w, h);
  g.strokeStyle = 'rgba(120,128,140,0.28)'; g.lineWidth = 2;
  for (let i = 0; i < 160; i++) { const ph = -Math.PI + i / 80 * Math.PI, [ax, az] = pAt(ph, -4), [bx, bz] = pAt(ph, FACADE_D + 7); g.beginPath(); g.moveTo(X(ax), Z(az)); g.lineTo(X(bx), Z(bz)); g.stroke(); }
  for (const d of [FACADE_D * 0.35, FACADE_D * 0.6]) {
    g.lineWidth = d < FACADE_D * 0.5 ? 16 : 6; g.strokeStyle = d < FACADE_D * 0.5 ? 'rgba(150,158,168,0.55)' : 'rgba(150,158,168,0.35)';
    g.beginPath(); for (let i = 0; i <= 256; i++) { const [x, z] = pAt(-Math.PI + i / 128 * Math.PI, d); i ? g.lineTo(X(x), Z(z)) : g.moveTo(X(x), Z(z)); } g.closePath(); g.stroke();
  }
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const [rx, rz] = pAt(Math.atan2(sz * (B0 + 40), sx * (A0 + 40)), FACADE_D + 5); g.lineWidth = 10; g.strokeStyle = 'rgba(150,158,168,0.5)'; g.beginPath(); g.moveTo(X(sx * OPEN_X * 0.9), Z(sz * OPEN_Z * 0.9)); g.lineTo(X(rx), Z(rz)); g.stroke(); }
  const S8 = w / (2 * (A0 + (FACADE_D + 7) * KA));
  for (const t of CFG.roof.texts || []) {
    const ph = t.side * Math.PI / 2, [x, z] = pAt(ph, FACADE_D * 0.5);
    g.save(); g.translate(X(x), Z(z)); g.rotate(t.side === 1 ? 0 : t.side === 3 ? Math.PI : t.side === 0 ? -Math.PI / 2 : Math.PI / 2);
    g.fillStyle = '#2a2d33'; g.textAlign = 'center'; g.textBaseline = 'middle';
    const size = (t.side % 2 ? FACADE_D * 0.36 : FACADE_D * 0.3) * S8; g.font = `${t.lower ? 800 : 900} ${size}px Inter, "Arial Black", Arial, sans-serif`;
    const maxW = (t.side % 2 ? (A0 + FACADE_D * 0.5) * 1.5 : (B0 + FACADE_D * 0.5) * 1.4) * S8;
    const tw = g.measureText(t.text).width; const sc = Math.min(1, maxW / tw);
    g.scale(sc, 1); g.fillText(t.lower ? t.text : t.text.split('').join(String.fromCharCode(8202)), 0, 0); g.restore();
  }
  if (CFG.roof.eagle) { // stylised eagle with spread wings on the +x end
    const [x, z] = pAt(0.35, FACADE_D * 0.55); const s = FACADE_D * 0.42 * S8;
    g.save(); g.translate(X(x), Z(z)); g.rotate(-0.4); g.fillStyle = '#2a2d33';
    g.beginPath(); g.moveTo(0, -s * 0.15);
    g.bezierCurveTo(-s * 0.3, -s * 0.5, -s * 0.8, -s * 0.55, -s * 1.1, -s * 0.2); g.lineTo(-s * 0.85, -s * 0.18); g.lineTo(-s * 0.95, 0); g.lineTo(-s * 0.7, -s * 0.02); g.lineTo(-s * 0.78, s * 0.15); g.lineTo(-s * 0.45, s * 0.05);
    g.lineTo(-s * 0.15, s * 0.25); g.lineTo(-s * 0.1, s * 0.75); g.lineTo(0, s * 0.55); g.lineTo(s * 0.1, s * 0.75); g.lineTo(s * 0.15, s * 0.25);
    g.lineTo(s * 0.45, s * 0.05); g.lineTo(s * 0.78, s * 0.15); g.lineTo(s * 0.7, -s * 0.02); g.lineTo(s * 0.95, 0); g.lineTo(s * 0.85, -s * 0.18); g.lineTo(s * 1.1, -s * 0.2);
    g.bezierCurveTo(s * 0.8, -s * 0.55, s * 0.3, -s * 0.5, 0, -s * 0.15); g.fill();
    g.beginPath(); g.arc(0, -s * 0.22, s * 0.09, 0, Math.PI * 2); g.fill(); g.restore();
  }
}
const ROOF = (() => {
  const OVH = 7; // roof overhang beyond the facade
  const RX = A0 + (FACADE_D + OVH) * KA, RZ = B0 + (FACADE_D + OVH) * KB;
  const S = 8; // px per metre
  const tex = canvasTex(Math.round(RX * 2 * S), Math.round(RZ * 2 * S), (g, w, h) => {
    const X = (x) => (x + RX) * S, Z = (z) => (z + RZ) * S;
    g.fillStyle = '#eef0f2'; g.fillRect(0, 0, w, h);
    if (CFG.roof.style === 'membrane') { drawMembrane(g, w, h, X, Z); return; }
    // solar field = whole roof minus rim (drawn via clip of an inner superellipse)
    g.save(); g.beginPath();
    for (let i = 0; i <= 256; i++) { const [x, z] = pAt(-Math.PI + i / 128 * Math.PI, FACADE_D - 6.5); i ? g.lineTo(X(x), Z(z)) : g.moveTo(X(x), Z(z)); }
    g.closePath(); g.clip();
    const sg = g.createLinearGradient(0, 0, w, h); sg.addColorStop(0, '#3a4560'); sg.addColorStop(0.5, '#4b5878'); sg.addColorStop(1, '#343e57');
    g.fillStyle = sg; g.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += S * 1.1) for (let x = 0; x < w; x += S * 2.2) { g.fillStyle = `rgba(${150 + Math.random() * 40},${170 + Math.random() * 40},${210},${0.05 + Math.random() * 0.07})`; g.fillRect(x + 1, y + 1, S * 2.2 - 2, S * 1.1 - 2); }
    g.strokeStyle = 'rgba(205,212,225,0.6)'; g.lineWidth = 1;
    for (let x = 0; x < w; x += S * 2.2) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); }
    for (let y = 0; y < h; y += S * 1.1) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
    g.fillStyle = 'rgba(255,255,255,0.08)'; for (let y = 0; y < h; y += S * 9) g.fillRect(0, y, w, S * 0.9);
    // "#" trusses
    g.fillStyle = '#f4f5f6'; const bw = 7 * S;
    for (const sx of [-1, 1]) g.fillRect(X(sx * (OPEN_X + 3.5)) - bw / 2, 0, bw, h);
    for (const sz of [-1, 1]) g.fillRect(0, Z(sz * (OPEN_Z + 3.5)) - bw / 2, w, bw);
    g.restore();
  });
  // domed roof: rays from the rectangular opening out to the overhanging rim; the rim curls down like the real roof
  const NA = 288, NR = 18, P = [], UV = [], I = [];
  const roofY = (t) => ROOF_Y + 3.0 * Math.sin(Math.PI * t * 0.85) - 7.5 * Math.pow(Math.max(0, (t - 0.8) / 0.2), 2);
  for (let i = 0; i <= NA; i++) {
    const ph = -Math.PI + (i / NA) * Math.PI * 2, c = Math.cos(ph), sn = Math.sin(ph);
    const tr = OPEN_ELL ? 1 / Math.hypot(c / OPEN_X, sn / OPEN_Z) : Math.min(OPEN_X / Math.max(1e-6, Math.abs(c)), OPEN_Z / Math.max(1e-6, Math.abs(sn)));
    const ix = c * tr, iz = sn * tr; const [ox, oz] = pAt(ph, FACADE_D + OVH);
    for (let k = 0; k <= NR; k++) {
      const t = k / NR, x = lerp(ix, ox, t), z = lerp(iz, oz, t);
      P.push(x, roofY(t), z); UV.push((x + RX) / (2 * RX), 1 - (z + RZ) / (2 * RZ));
      if (i < NA && k < NR) { const a0 = i * (NR + 1) + k, b0 = (i + 1) * (NR + 1) + k; I.push(a0, a0 + 1, b0, b0, a0 + 1, b0 + 1); }
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2));
  geo.setIndex(I); geo.computeVertexNormals();
  if (geo.attributes.normal.getY(5) < 0) { for (let q = 0; q < I.length; q += 3) { const t = I[q + 1]; I[q + 1] = I[q + 2]; I[q + 2] = t; } geo.setIndex(I); geo.computeVertexNormals(); }
  const topMat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.32, metalness: 0.25, transparent: true, opacity: 1, side: THREE.FrontSide });
  const top = new THREE.Mesh(geo, topMat); top.castShadow = true; top.receiveShadow = true; scene.add(top);
  const ug = geo.clone(); { const cc = []; for (let i = 0; i <= NA; i++) for (let k = 0; k <= NR; k++) { const t = k / NR, v = t < 0.2 ? 1.0 : 0.78 - 0.1 * t; cc.push(v, v, v * (t < 0.2 ? 1.03 : 1)); } ug.setAttribute('color', new THREE.Float32BufferAttribute(cc, 3)); }
  const underMat = new THREE.MeshStandardMaterial({ color: 0xe6e3dc, roughness: 0.8, vertexColors: true, transparent: true, opacity: 1, side: THREE.BackSide });
  const under = new THREE.Mesh(ug, underMat); under.position.y = -0.08; scene.add(under);
  // white ribs under the overhang
  const ribs = [];
  for (let i = 0; i < 120; i++) { const ph = -Math.PI + (i / 120) * Math.PI * 2; const [x0, z0] = pAt(ph, FACADE_D - 0.5), [x1, z1] = pAt(ph, FACADE_D + OVH - 0.4); ribs.push([x0, roofY(0.86) - 1.6, z0, x1, roofY(0.99) - 0.9, z1]); }

  // opening edge: floodlight strip + truss fascia
  const edgeMat = new THREE.MeshStandardMaterial({ color: SID === 'rams' ? 0x40230e : 0x3a3d44, emissive: SID === 'rams' ? 0xff8a1e : 0xfff2dc, emissiveIntensity: 0, transparent: true, opacity: 1 });
  const edge = new THREE.Group();
  for (const [w, d, x, z] of [[OPEN_X * 2, 1.2, 0, -OPEN_Z], [OPEN_X * 2, 1.2, 0, OPEN_Z], [1.2, OPEN_Z * 2, -OPEN_X, 0], [1.2, OPEN_Z * 2, OPEN_X, 0]]) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, 2.2, d), edgeMat); m.position.set(x, ROOF_Y - 1.1, z); edge.add(m);
  }
  scene.add(edge);
  // white tubular space trusses under the roof (main trusses along the opening, secondary ones out to the rim)
  const ea = A0 + (FACADE_D - 2) * KA, eb = B0 + (FACADE_D - 2) * KB, ext = (u, a, b) => b * Math.pow(Math.max(0, 1 - Math.pow(Math.abs(u) / a, SEN)), 1 / SEN);
  const segs = [];
  const SEG = (a, b, r) => segs.push([a, b, r]);
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const yT = ROOF_Y - 0.5, yB = ROOF_Y - 8.5;
  const lacing = (A1, A2, B1, B2, n, r) => { for (let k = 0; k <= n; k++) { const t = k / n, t2 = Math.min(1, (k + 0.5) / n); const a = A1.clone().lerp(A2, t), b = B1.clone().lerp(B2, t2); SEG(a, b, r); if (k < n) SEG(b, A1.clone().lerp(A2, (k + 1) / n), r); } };
  const sides = [ // [axis, sign]: along x at z=±OPEN_Z, along z at x=±OPEN_X
    ...[-1, 1].map((sg) => ({ P: (u, o, y) => V(u, y, sg * (OPEN_Z + o)), L: OPEN_X + 6, rim: (u) => ext(u, ea, eb), sg })),
    ...[-1, 1].map((sg) => ({ P: (u, o, y) => V(sg * (OPEN_X + o), y, u), L: OPEN_Z + 6, rim: (u) => ext(u, eb, ea), sg })),
  ];
  for (const sd of sides) {
    const { P, L } = sd;
    // main triangular truss
    const tA1 = P(-L, 0.6, yT), tA2 = P(L, 0.6, yT), tB1 = P(-L, 5.0, yT), tB2 = P(L, 5.0, yT), bo1 = P(-L, 2.8, yB), bo2 = P(L, 2.8, yB);
    SEG(tA1, tA2, 0.5); SEG(tB1, tB2, 0.5); SEG(bo1, bo2, 0.65);
    const n = Math.round(L / 3);
    lacing(tA1, tA2, bo1, bo2, n, 0.2); lacing(tB1, tB2, bo1, bo2, n, 0.2);
    // secondary trusses out to the rim
    for (let u = -L + 4; u <= L - 4; u += 10) {
      const rimO = sd.rim(u) - (sd.L === OPEN_X + 6 ? OPEN_Z : OPEN_X); if (rimO < 8) continue;
      const a1 = P(u, 5.0, yT), a2 = P(u, rimO, yT), b1 = P(u, 5.0, yB + 1.0), b2 = P(u, rimO, ROOF_Y - 2.4);
      SEG(a1, a2, 0.22); SEG(b1, b2, 0.26); lacing(a1, a2, b1, b2, Math.round(rimO / 4), 0.1);
    }
  }
  // corner diagonals
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const ph = Math.atan2(sz * (B0 + 60), sx * (A0 + 60)); const [rx, rz] = pAt(ph, FACADE_D - 2);
    SEG(V(sx * OPEN_X, yB + 1, sz * OPEN_Z), V(rx, ROOF_Y - 2.4, rz), 0.7);
    SEG(V(sx * OPEN_X, yT, sz * OPEN_Z), V(rx, yT, rz), 0.3);
  }
  for (const [x0, y0, z0, x1, y1, z1] of ribs) SEG(V(x0, y0, z0), V(x1, y1, z1), 0.28);
  const cyl = new THREE.CylinderGeometry(1, 1, 1, 7, 1, true);
  const truss = new THREE.InstancedMesh(cyl, new THREE.MeshStandardMaterial({ color: 0xf3f4f6, roughness: 0.45, metalness: 0.25 }), segs.length);
  { const m = new THREE.Matrix4(), q = new THREE.Quaternion(), up = V(0, 1, 0), d = V(0, 0, 0), mid = V(0, 0, 0), sc = V(1, 1, 1);
    segs.forEach(([a, b, r], i) => { d.subVectors(b, a); const len = d.length(); q.setFromUnitVectors(up, d.normalize()); mid.addVectors(a, b).multiplyScalar(0.5); sc.set(r, len, r); m.compose(mid, q, sc); truss.setMatrixAt(i, m); }); }
  truss.castShadow = true; scene.add(truss);
  // floodlights along the opening (under the main trusses)
  const lamps = [];
  for (const sd of sides) for (let u = -sd.L + 3; u <= sd.L - 3; u += 2.4) lamps.push(sd.P(u, 2.8, yB - 0.7));
  const lampMat = new THREE.MeshStandardMaterial({ color: 0x222222, emissive: 0xfff6e6, emissiveIntensity: 0 });
  const lampMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1.1, 0.7, 0.9), lampMat, lamps.length);
  { const m = new THREE.Matrix4(); lamps.forEach((p, i) => { m.makeTranslation(p.x, p.y, p.z); lampMesh.setMatrixAt(i, m); }); }
  scene.add(lampMesh);
  const glowTex = canvasTex(64, 64, (g, w, h) => { const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,250,235,1)'); gr.addColorStop(0.25, 'rgba(255,240,210,0.55)'); gr.addColorStop(1, 'rgba(255,230,190,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
  const gp = []; lamps.forEach((p) => gp.push(p.x, p.y - 0.2, p.z));
  const glowMat = new THREE.PointsMaterial({ map: glowTex, size: 7 * renderer.getPixelRatio(), sizeAttenuation: true, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false });
  const glow = new THREE.Points(new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(gp, 3)), glowMat);
  glow.frustumCulled = false; scene.add(glow);
  // two scoreboards hanging from the end trusses
  const sbTex = canvasTex(512, 256, (g, w, h) => {
    g.fillStyle = '#07080c'; g.fillRect(0, 0, w, h); g.strokeStyle = '#2a2d36'; g.lineWidth = 8; g.strokeRect(4, 4, w - 8, h - 8);
    g.fillStyle = '#fdb912'; g.font = '900 64px Inter, Arial'; g.textAlign = 'center'; g.fillText(CFG.match.short.replace('–', '-'), w / 2, 118);
    g.fillStyle = '#ffffff'; g.font = '700 34px Inter, Arial'; g.fillText('00:00  ·  ' + CFG.stadium.toLocaleUpperCase('tr-TR'), w / 2, 190);
  });
  const sbMat = new THREE.MeshStandardMaterial({ color: 0x0b0c10, emissive: 0xffffff, emissiveMap: sbTex, emissiveIntensity: 0.9 });
  for (const sx of [-1, 1]) {
    const sb = new THREE.Mesh(new THREE.BoxGeometry(1.2, 8, 15), [new THREE.MeshStandardMaterial({ color: 0x15161b }), new THREE.MeshStandardMaterial({ color: 0x15161b }), new THREE.MeshStandardMaterial({ color: 0x15161b }), new THREE.MeshStandardMaterial({ color: 0x15161b }), new THREE.MeshStandardMaterial({ color: 0x15161b }), new THREE.MeshStandardMaterial({ color: 0x15161b })]);
    sb.material[sx > 0 ? 1 : 0] = sbMat;
    sb.position.set(sx * (OPEN_X + 2.8), ROOF_Y - 13, 0); scene.add(sb);
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 6, 6), new THREE.MeshStandardMaterial({ color: 0xdddddd })); rod.position.set(sx * (OPEN_X + 2.8), ROOF_Y - 6.5, 0); scene.add(rod);
  }
  let vis = 1;
  return {
    edgeMat, lampMat, glowMat,
    set(v) { // 0 = hidden, 1 = full roof
      vis = v;
      topMat.opacity = v; underMat.opacity = v;
      top.visible = v > 0.01; under.visible = v > 0.01; truss.visible = v > 0.01; edge.visible = v > 0.01; lampMesh.visible = v > 0.01;
      top.castShadow = v > 0.5; edgeMat.opacity = v;
      topMat.depthWrite = v > 0.98; underMat.depthWrite = v > 0.98;
    },
    get vis() { return vis; },
  };
})();

/* ======================================================================
   VIP loca interior (Batı, 200 seviyesi, merkez)
   ====================================================================== */
const VIP = (() => {
  const g = new THREE.Group();
  const zG = rAt(Math.PI / 2, GLASS_D), zB = rAt(Math.PI / 2, LOCA_BACK) - 0.1, y0 = T2.hEnd, y1 = LOCA_CEIL;
  const W = 6.2;
  const wood = new THREE.MeshStandardMaterial({ color: 0x3b2416, roughness: 0.55 });
  const wall = new THREE.MeshStandardMaterial({ color: 0x3a3029, roughness: 0.7 });
  const leather = new THREE.MeshPhysicalMaterial({ color: 0x6b3218, roughness: 0.42, metalness: 0.0, clearcoat: 0.35, clearcoatRoughness: 0.4, sheen: 0.3, sheenColor: 0xffc79a });
  const leatherDark = new THREE.MeshPhysicalMaterial({ color: 0x4a200e, roughness: 0.45, clearcoat: 0.3, clearcoatRoughness: 0.45 });
  const gold = new THREE.MeshStandardMaterial({ color: 0xc99a35, metalness: 0.9, roughness: 0.25 });
  const add = (geo, mat, x, y, z, sh = true) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = sh; m.receiveShadow = true; g.add(m); return m; };
  const depth = zB - zG;
  add(new THREE.BoxGeometry(W * 2, 0.06, depth), wood, 0, y0 + 0.03, zG + depth / 2, false);
  add(new THREE.BoxGeometry(0.12, y1 - y0, depth), wall, -W, (y0 + y1) / 2, zG + depth / 2);
  add(new THREE.BoxGeometry(0.12, y1 - y0, depth), wall, W, (y0 + y1) / 2, zG + depth / 2);
  add(new THREE.BoxGeometry(W * 2, y1 - y0, 0.1), wall, 0, (y0 + y1) / 2, zB);
  add(new THREE.BoxGeometry(W * 2, 0.08, depth), new THREE.MeshStandardMaterial({ color: 0x141215, roughness: 0.8 }), 0, y1 - 0.05, zG + depth / 2, false);
  // gold trim lines
  add(new THREE.BoxGeometry(W * 2, 0.04, 0.04), gold, 0, y1 - 0.25, zB - 0.06, false);
  // tv
  const tvTex = canvasTex(512, 288, (c, w, h) => {
    const gr = c.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#a90432'); gr.addColorStop(1, '#fdb912'); c.fillStyle = gr; c.fillRect(0, 0, w, h);
    c.fillStyle = 'rgba(0,0,0,0.35)'; c.fillRect(0, h - 70, w, 70);
    c.fillStyle = '#fff'; c.font = '900 54px Inter, Arial'; c.textAlign = 'center'; c.fillText(CFG.match.short, w / 2, 120);
    c.font = '700 26px Inter, Arial'; c.fillText('CANLI · ' + CFG.stadium.toLocaleUpperCase('tr-TR'), w / 2, h - 26);
  });
  add(new THREE.BoxGeometry(2.4, 1.35, 0.06), new THREE.MeshStandardMaterial({ color: 0x000000, emissive: 0xffffff, emissiveMap: tvTex, emissiveIntensity: 0.9 }), 0, y0 + 2.2, zB - 0.1, false);
  // bar counter
  add(new THREE.BoxGeometry(3.2, 1.05, 0.6), wood, -2.6, y0 + 0.52, zB - 0.9);
  add(new THREE.BoxGeometry(3.3, 0.05, 0.7), gold, -2.6, y0 + 1.07, zB - 0.9, false);
  for (let i = 0; i < 6; i++) add(new THREE.CylinderGeometry(0.05, 0.05, 0.32, 10), new THREE.MeshStandardMaterial({ color: [0x2a5b2a, 0x5b2a14, 0xd8d0b0][i % 3], roughness: 0.15, metalness: 0.2 }), -3.8 + i * 0.45, y0 + 1.25, zB - 0.95, false);
  // leather armchairs: 2 rows x 5
  const rbox = (w, h, d, r) => {
    const sh = new THREE.Shape(); const x0 = -w / 2 + r, y0_ = -h / 2 + r, x1 = w / 2 - r, y1_ = h / 2 - r;
    sh.moveTo(x0, -h / 2); sh.lineTo(x1, -h / 2); sh.quadraticCurveTo(w / 2, -h / 2, w / 2, y0_); sh.lineTo(w / 2, y1_); sh.quadraticCurveTo(w / 2, h / 2, x1, h / 2);
    sh.lineTo(x0, h / 2); sh.quadraticCurveTo(-w / 2, h / 2, -w / 2, y1_); sh.lineTo(-w / 2, y0_); sh.quadraticCurveTo(-w / 2, -h / 2, x0, -h / 2);
    const g = new THREE.ExtrudeGeometry(sh, { depth: Math.max(0.01, d - 2 * r), bevelEnabled: true, bevelThickness: r, bevelSize: r * 0.9, bevelSegments: 4, curveSegments: 6 });
    g.translate(0, 0, -(d - 2 * r) / 2); g.computeVertexNormals(); return g;
  };
  const gSeat = rbox(0.74, 0.3, 0.7, 0.09), gBack = rbox(0.8, 0.66, 0.24, 0.1), gArm = rbox(0.16, 0.36, 0.74, 0.07), gCush = rbox(0.6, 0.12, 0.56, 0.05);
  const chair = (x, z, yLift) => {
    const y = y0 + yLift;
    add(gSeat, leather, x, y + 0.26, z);
    add(gCush, leatherDark, x, y + 0.45, z - 0.03, false);
    add(gBack, leather, x, y + 0.72, z + 0.34).rotation.x = -0.18;
    add(gArm, leatherDark, x - 0.42, y + 0.46, z + 0.02);
    add(gArm, leatherDark, x + 0.42, y + 0.46, z + 0.02);
  };
  for (let i = 0; i < 6; i++) chair(-4.6 + i * 1.84, zG + 1.2, 0);
  add(new THREE.BoxGeometry(W * 2 - 0.3, 0.3, 1.6), wood, 0, y0 + 0.15, zG + 2.9, false);
  for (let i = 0; i < 6; i++) chair(-4.6 + i * 1.84, zG + 2.8, 0.3);
  // small tables
  for (let i = 0; i < 5; i++) { add(new THREE.CylinderGeometry(0.25, 0.25, 0.04, 20), gold, -3.68 + i * 1.84, y0 + 0.62, zG + 1.0, false); add(new THREE.CylinderGeometry(0.04, 0.04, 0.6, 8), gold, -3.68 + i * 1.84, y0 + 0.31, zG + 1.0, false); }
  // ceiling spots
  for (let i = 0; i < 6; i++) add(new THREE.CircleGeometry(0.12, 16), new THREE.MeshBasicMaterial({ color: 0xfff1d0 }), -3.75 + i * 1.5, y1 - 0.1, zG + 2.2, false).rotation.x = Math.PI / 2;
  const light = new THREE.PointLight(0xffd7a0, 0, 16, 1.6); light.position.set(0, y1 - 0.6, zG + 2.6); g.add(light);
  const light2 = new THREE.PointLight(0xffd7a0, 0, 10, 1.6); light2.position.set(-2.6, y1 - 0.6, zB - 1.5); g.add(light2);
  scene.add(g);
  return { group: g, light, light2, zG, zB, y0, y1 };
})();

/* ======================================================================
   Surroundings: real satellite imagery of Seyrantepe (Esri World Imagery)
   The stadium long axis points 53° east of north-east; +x = Güney (SW), +z = Batı (NW).
   ====================================================================== */
const SAT = (() => { const a = CFG.sat.axisDeg * Math.PI / 180, b = a - Math.PI / 2; return { centre: CFG.sat.centre, ax: [Math.cos(a), Math.sin(a)], az: [Math.cos(b), Math.sin(b)] }; })();
const toWorld = ([e, n]) => { const de = e - SAT.centre[0], dn = n - SAT.centre[1]; return [de * SAT.ax[0] + dn * SAT.ax[1], de * SAT.az[0] + dn * SAT.az[1]]; };
const satReady = (async () => {
  const meta = await (await fetch(`assets/${CFG.sat.prefix}.json`)).json();
  const small = Math.min(window.innerWidth, window.innerHeight) < 700 && !REC;
  const tex = await new THREE.TextureLoader().loadAsync(small ? `assets/${CFG.sat.prefix}-2k.jpg` : `assets/${CFG.sat.prefix}.jpg`);
  tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  const c = [meta.tl, meta.tr, meta.bl, meta.br].map(toWorld);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([c[0][0], 0, c[0][1], c[1][0], 0, c[1][1], c[2][0], 0, c[2][1], c[3][0], 0, c[3][1]], 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute([0, 1, 1, 1, 0, 0, 1, 0], 2));
  g.setIndex([0, 2, 1, 1, 2, 3]); g.computeVertexNormals();
  if (g.attributes.normal.getY(0) < 0) g.setIndex([0, 1, 2, 1, 3, 2]), g.computeVertexNormals();
  const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ map: tex, roughness: 1, metalness: 0 }));
  m.position.y = -0.6; m.receiveShadow = true; scene.add(m);
  outer.material.color.set(meta.mean);
})();
const outer = new THREE.Mesh(new THREE.PlaneGeometry(9000, 9000), new THREE.MeshStandardMaterial({ color: 0x656c5b, roughness: 1 }));
outer.rotation.x = -Math.PI / 2; outer.position.y = -1.2; outer.receiveShadow = true; scene.add(outer);
// thin ring of plaza right at the facade so the satellite's own roof edge does not peek out
{
  const ring = new THREE.Mesh(loft([[FACADE_D, 0.01], [FACADE_D + 7, 0.01]], ...FULL, 720), new THREE.MeshStandardMaterial({ color: 0x9c9a94, roughness: 1, side: THREE.DoubleSide }));
  ring.receiveShadow = true; scene.add(ring);
}

/* ======================================================================
   Seat painting
   ====================================================================== */
const ui = {
  state: 'landing', hover: null, focus: null, selSeat: -1, hoverSeat: -1, pickSeat: -1, pickSet: [], qty: 1, revealFront: 0, lightsOn: 0,
};
let paintDirty = true;
function paintSeats() {
  const hb = ui.hover ? ui.hover.index : -1, fb = ui.focus ? ui.focus.index : -1;
  const revealing = ui.revealFront < 200;
  const pickSet = new Set(ui.pickSet);
  for (let i = 0; i < SEATS; i++) {
    const bi = seatBlk[i]; let r = seatBase[i * 3], g = seatBase[i * 3 + 1], b = seatBase[i * 3 + 2];
    if (bi === hb && ui.state === 'overview') { r = lerp(r, 1.0, 0.8); g = lerp(g, 0.5, 0.8); b = lerp(b, 0.08, 0.8); }
    if (i === ui.hoverSeat && ui.state === 'block') { r = lerp(r, 1, 0.75); g = lerp(g, 1, 0.75); b = lerp(b, 1, 0.75); }
    if (i === ui.selSeat || (pickSet.size && pickSet.has(i))) { r = 0.1; g = 1.0; b = 0.55; }
    if (revealing) { // stadium lights coming on: a wave from the pitch outwards
      const u = Math.hypot(seatX[i] / 1.15, seatZ[i]);
      const k = sstep(ui.revealFront + 6, ui.revealFront - 10, u);
      const glow = Math.max(0, 1 - Math.abs(u - ui.revealFront) / 9) * 0.55;
      r = lerp(r * 0.16, r, k) + glow; g = lerp(g * 0.16, g, k) + glow * 0.8; b = lerp(b * 0.18, b, k) + glow * 0.55;
    }
    seatCol[i * 3] = r; seatCol[i * 3 + 1] = g; seatCol[i * 3 + 2] = b;
  }
  for (const im of seatMeshes) im.instanceColor.needsUpdate = true;
  seatPoints.geometry.attributes.color.needsUpdate = true;
  paintDirty = false;
}
const focusFx = (() => {
  const tubeMat = new THREE.MeshBasicMaterial({ color: 0xffc83a, toneMapped: false });
  const dotMat = new THREE.PointsMaterial({ color: 0x2ee59d, size: 0.42, sizeAttenuation: true, toneMapped: false, transparent: true, opacity: 0.95, depthWrite: false });
  let tube = null, dots = null;
  return {
    set(b) {
      if (tube) { scene.remove(tube); tube.geometry.dispose(); tube = null; }
      if (dots) { scene.remove(dots); dots.geometry.dispose(); dots = null; }
      if (!b) return;
      const t = b.tier, pts = [], n = 24, j1 = t.rows - 1;
      const at = (ph, j, back) => { const d = t.rd[j] + (back ? t.depth : 0); const [x, z] = pAt(ph, d); return new THREE.Vector3(x, t.rh[j] + 1.0, z); };
      for (let k = 0; k <= n; k++) pts.push(at(lerp(b.phi0, b.phi1, k / n), 0, false));
      for (let j = 1; j <= j1; j++) pts.push(at(b.phi1, j, j === j1));
      for (let k = n; k >= 0; k--) pts.push(at(lerp(b.phi0, b.phi1, k / n), j1, true));
      for (let j = j1 - 1; j >= 0; j--) pts.push(at(b.phi0, j, false));
      tube = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true, 'catmullrom', 0.05), 400, 0.13, 6, true), tubeMat);
      scene.add(tube);
      const dp = [];
      for (let i = b.seatStart; i < b.seatStart + b.seatCount; i++) if (!seatSold[i]) dp.push(seatX[i], seatY[i] + 1.15, seatZ[i]);
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(dp, 3));
      dotMat.size = 0.42 * renderer.getPixelRatio();
      dots = new THREE.Points(g, dotMat); scene.add(dots);
    },
  };
})();
function paintTreads() {
  for (const b of blocks) {
    const on = ui.hover === b && ui.state === 'overview';
    b.mesh.material.emissive.setHex(on ? 0x6a3008 : 0x000000);
  }
}

/* ======================================================================
   Camera system
   ====================================================================== */
const view = { W: 1, H: 1, insetR: 0, insetB: 0, tInsetR: 0, tInsetB: 0 };
const cam = { pos: new THREE.Vector3(), target: new THREE.Vector3(), fov: 36 };
let flight = null;
const look = { yaw: 0, pitch: 0, tYaw: 0, tPitch: 0 };
let orbitAz = 0, orbitOn = false, idleT = 0;
const mouse = { x: 0, y: 0, nx: 0, ny: 0, px: 0, py: 0, inside: false };

const isPortrait = () => view.H > view.W * 1.05;
function overviewPose(extraDist = 1, azOff = 0) {
  const portrait = isPortrait();
  const az = (portrait ? -Math.PI / 2 : 0) + orbitAz + azOff;
  const elev = THREE.MathUtils.degToRad(portrait ? 63 : 58);
  const fov = 36, vf = THREE.MathUtils.degToRad(fov / 2), hf = Math.atan(Math.tan(vf) * (view.W / view.H));
  const halfX = (portrait ? B0 + 64 : A0 + 64), halfY = (portrait ? A0 + 64 : B0 + 64);
  const dist = Math.max(halfX / Math.tan(hf) * (portrait ? 1.12 : 1), (halfY * Math.sin(elev) + 20) / Math.tan(vf)) * 1.16 * extraDist;
  const target = new THREE.Vector3(0, 6, 0);
  const pos = new THREE.Vector3(Math.cos(elev) * Math.sin(az), Math.sin(elev), Math.cos(elev) * Math.cos(az)).multiplyScalar(dist).add(target);
  // keep the stadium visually centred when the top bar takes space
  return { pos, target, fov };
}
let ovTheta = CFG.mosaic.side * Math.PI / 2; if (ovTheta > Math.PI) ovTheta -= Math.PI * 2; // interior overview: direction the camera looks at (−π/2 = Doğu, the GALATASARAY stand)
function landingPose(az = orbitAz) {
  const portrait = isPortrait();
  const el = THREE.MathUtils.degToRad(portrait ? 34 : 24), dist = portrait ? 600 : 380;
  const target = new THREE.Vector3(0, 8, 0);
  const pos = new THREE.Vector3(Math.cos(el) * Math.sin(az), Math.sin(el), Math.cos(el) * Math.cos(az)).multiplyScalar(dist).add(target);
  return { pos, target, fov: 34 };
}
function interiorPose(th = ovTheta) {
  const c = Math.cos(th), sn = Math.sin(th), portrait = isPortrait();
  return { pos: new THREE.Vector3(-c * A0 * 0.32, portrait ? 23 : 20, -sn * B0 * 0.5), target: new THREE.Vector3(c * (A0 + 14), portrait ? 9 : 11, sn * (B0 + 16)), fov: portrait ? 72 : 62 };
}
function blockPose(b) {
  const c = b.center.clone();
  const n = b.inward.clone();
  const portrait = isPortrait();
  const pos = c.clone().addScaledVector(n, portrait ? 26 : 21); pos.y = Math.min(c.y + (portrait ? 17 : 14), 40);
  return { pos, target: c.clone().addScaledVector(n, -2).add(new THREE.Vector3(0, -2, 0)), fov: portrait ? 62 : 50 };
}
function seatPose(i) {
  const b = blocks[seatBlk[i]];
  const yaw = seatYaw[i]; const fx = Math.sin(yaw), fz = Math.cos(yaw);
  const pos = new THREE.Vector3(seatX[i] - fx * 0.05, seatY[i] + 1.25, seatZ[i] - fz * 0.05);
  const target = new THREE.Vector3(-seatX[i] * 0.15, 3.5, -seatZ[i] * 0.15);
  return { pos, target, fov: b.tier.lvl === 4 ? 58 : 64 };
}
function vipPose() {
  return { pos: new THREE.Vector3(0.6, VIP.y0 + 2.25, VIP.zB - 0.7), target: new THREE.Vector3(0, 2, -12), fov: 64 };
}
function flyTo(to, dur = 2.2, arc = 0) {
  flight = { from: { pos: cam.pos.clone(), target: cam.target.clone(), fov: cam.fov }, to, t: 0, dur, arc };
  look.tYaw = look.tPitch = 0;
}
function updateCamera(dt) {
  view.insetR = lerp(view.insetR, view.tInsetR, 1 - Math.exp(-dt * 6));
  view.insetB = lerp(view.insetB, view.tInsetB, 1 - Math.exp(-dt * 6));
  if (flight) {
    flight.t += dt; const k = clamp(flight.t / flight.dur), e = ease(k);
    const f = flight.from, t = typeof flight.to === 'function' ? flight.to() : flight.to;
    const mid = f.pos.clone().lerp(t.pos, 0.5); mid.y += flight.arc;
    const a = f.pos.clone().lerp(mid, e), b = mid.clone().lerp(t.pos, e);
    cam.pos.copy(a.lerp(b, e));
    cam.target.copy(f.target).lerp(t.target, e);
    cam.fov = lerp(f.fov, t.fov, e);
    if (k >= 1) { const done = flight.onDone; flight = null; done && done(); }
  } else if (ui.state === 'landing') {
    orbitAz += dt * 0.045;
    const p = landingPose(); cam.pos.copy(p.pos); cam.target.copy(p.target); cam.fov = p.fov;
    const o = window.__dbg && window.__dbg.landingOverride; if (o) { cam.pos.set(...o.pos); cam.target.set(...o.target); cam.fov = o.fov; }
  } else if (ui.state === 'overview') {
    if (orbitOn) ovTheta += dt * 0.06;
    const p = interiorPose();
    const right = new THREE.Vector3().subVectors(p.target, p.pos).cross(new THREE.Vector3(0, 1, 0)).normalize();
    const k = 1 - Math.exp(-dt * 4);
    const goal = p.pos.clone().addScaledVector(right, mouse.nx * 3).add(new THREE.Vector3(0, mouse.ny * 1.5, 0));
    cam.pos.lerp(goal, k); cam.target.lerp(p.target, k); cam.fov = lerp(cam.fov, p.fov, k);
  } else if (ui.state === 'block' && ui.focus) {
    const p = blockPose(ui.focus); const k = 1 - Math.exp(-dt * 2.5);
    const right = new THREE.Vector3().subVectors(p.target, p.pos).cross(new THREE.Vector3(0, 1, 0)).normalize();
    cam.pos.lerp(p.pos.clone().addScaledVector(right, mouse.nx * 1.2), k); cam.target.lerp(p.target, k);
  }
  look.yaw = lerp(look.yaw, look.tYaw, 1 - Math.exp(-dt * 8));
  look.pitch = lerp(look.pitch, look.tPitch, 1 - Math.exp(-dt * 8));
  camera.position.copy(cam.pos);
  if ((ui.state === 'seat' || ui.state === 'vip') && !flight) {
    const dir = new THREE.Vector3().subVectors(cam.target, cam.pos);
    const sph = new THREE.Spherical().setFromVector3(dir); sph.theta += look.yaw; sph.phi = clamp(sph.phi - look.pitch, 0.3, Math.PI - 0.3);
    camera.lookAt(new THREE.Vector3().setFromSpherical(sph).add(cam.pos));
  } else camera.lookAt(cam.target);
  camera.fov = cam.fov;
  const iR = Math.round(view.insetR), iB = Math.round(view.insetB);
  if (iR > 1 || iB > 1) camera.setViewOffset(view.W + iR, view.H + iB, iR, iB, view.W, view.H);
  else camera.clearViewOffset();
  camera.aspect = view.W / view.H;
  camera.updateProjectionMatrix();
}

/* ======================================================================
   UI: labels, tooltip, panel, ticket
   ====================================================================== */
const labelsEl = $('#labels');
const standLabels = Object.entries(STANDS).map(([name, s]) => {
  const st = standStats[name];
  const el = document.createElement('div'); el.className = 'slabel';
  el.innerHTML = `<div class="n"><small>TRİBÜN</small><b>${name}</b><span class="left">● ${fmt(st.free)} boş</span></div><div class="p"><small>BAŞLAYAN</small><b>${TL(st.min)}</b></div>`;
  labelsEl.appendChild(el);
  const [x, z] = pAt(s.mid, 16);
  return { el, name, anchor: new THREE.Vector3(x, 15, z), on: false, delay: 0 };
});
const tooltip = $('#tooltip');
const panel = $('#panel');
const ticketWrap = $('#ticketWrap'), ticketEl = $('#ticket');
const hintEl = $('#hint'), hintText = $('#hintText');
const backBtn = $('#back');
const toast = (msg) => { const t = $('#toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove('on'), 2200); };

const tierWord = (t) => (t.lvl === 1 ? 'Alt Kat' : t.lvl === 2 ? 'VIP / Loca Katı' : 'Üst Kat');
function updateLabels() {
  const show = ui.state === 'overview';
  const v = new THREE.Vector3();
  for (const l of standLabels) {
    v.copy(l.anchor).project(camera);
    const x = (v.x * 0.5 + 0.5) * view.W, y = (-v.y * 0.5 + 0.5) * view.H;
    l.el.style.left = x.toFixed(1) + 'px'; l.el.style.top = y.toFixed(1) + 'px';
    const inView = v.z < 1 && x > 60 && x < view.W - 60 && y > 90 && y < view.H - 60;
    const want = show && inView && clock.t > l.delay && !flight;
    if (want !== l.on) { l.on = want; l.el.classList.toggle('on', want); }
  }
}
let pinned = null;
function showTooltip(b) {
  pinned = b;
  if (!b) { tooltip.classList.remove('on'); return; }
  const price = b.price ? TL(b.price) : 'Satışta değil';
  const avail = b.free ? `<span class="pin-free">● ${fmt(b.free)} boş</span>` : '<span class="pin-sold">● Tükendi</span>';
  tooltip.innerHTML = `<div class="pin-l"><small>${tierWord(b.tier).toLocaleUpperCase('tr-TR')} · ${b.stand.toLocaleUpperCase('tr-TR')}</small><b>Blok ${b.id}</b>${avail}</div>` +
    `<div class="pin-r"><small>${b.cat === 'Protokol' ? 'PROTOKOL' : 'TL'}</small><b>${price.replace('₺', '')}</b></div>`;
  tooltip.classList.add('on');
}
function placeTooltip() {
  if (!pinned) return;
  const t = pinned.tier, pm = (pinned.phi0 + pinned.phi1) / 2, j = t.rows - 1;
  const [x, z] = pAt(pm, t.rd[j]); const v = new THREE.Vector3(x, t.rh[j] + 2.5, z).project(camera);
  if (v.z > 1) { tooltip.style.opacity = 0; return; }
  tooltip.style.opacity = '';
  const right = view.W - (ui.state === 'block' && !isPortrait() && view.W >= 760 ? 420 : 0);
  const px = clamp((v.x * 0.5 + 0.5) * view.W, 130, right - 130), py = clamp((-v.y * 0.5 + 0.5) * view.H, 150, view.H - 40);
  tooltip.style.left = px.toFixed(1) + 'px'; tooltip.style.top = py.toFixed(1) + 'px';
}
const seatTip = $('#seatTip');
function showSeatTip(i) {
  if (i < 0) { seatTip.classList.remove('on'); return; }
  const b = blocks[seatBlk[i]];
  seatTip.innerHTML = `<b>Sıra ${seatRow[i]} · Koltuk ${seatNum[i]}</b><span class="${seatSold[i] ? 'st-sold' : 'st-free'}">${seatSold[i] ? 'Dolu' : TL(b.price)}</span>`;
  seatTip.classList.add('on');
  let x = mouse.px + 16, y = mouse.py - 46; if (x + 180 > view.W) x = mouse.px - 196;
  seatTip.style.left = x + 'px'; seatTip.style.top = y + 'px';
}

const svgNS = 'http://www.w3.org/2000/svg';
const seatmap = $('#seatmap');
const PERKS = {
  'Premium': ['Loca katı', 'İkram', 'Özel giriş'], 'Delux': ['Loca katı', 'İkram', 'Özel giriş'], 'Lux': ['Loca katı', 'İkram'],
  'Classic': ['Batı ana tribün', 'Orta saha'], '1. Kategori': ['Orta saha görüşü', 'Sahaya yakın'], '2. Kategori': ['Orta sahaya yakın', 'Alt kat'],
  '3. Kategori': ['Ceza sahası hizası', 'Alt kat'], '4. Kategori': ['Köşe açısı', 'Alt kat'], '5. Kategori': ['Tüm sahayı gören açı', 'Üst kat'],
  '6. Kategori': ['Üst kat', 'Geniş açı'], '7. Kategori': ['Kale arkası', 'Tribün atmosferi'], '8. Kategori': ['En uygun fiyat', 'Kale arkası'],
  'Misafir': ['Misafir taraftar bölümü'], 'Protokol': ['Satışa kapalı'],
};
function buildLocator(b) {
  const L = $('#locator'), X = (x) => (60 + x * 0.44).toFixed(1), Y = (z) => (46 + z * 0.44).toFixed(1);
  const t = b.tier; let h = '';
  const ring = (d) => { let q = ''; for (let k = 0; k <= 64; k++) { const [x, z] = pAt(-Math.PI + k / 32 * Math.PI, d); q += (k ? 'L' : 'M') + X(x) + ' ' + Y(z); } return `<path class="rg" d="${q}Z"/>`; };
  h += ring(FACADE_D); h += `<rect class="pt" x="${X(-PITCH_L / 2)}" y="${Y(-PITCH_W / 2)}" width="${(PITCH_L * 0.44).toFixed(1)}" height="${(PITCH_W * 0.44).toFixed(1)}" rx="1"/>`;
  for (const o of blocks) {
    if (o.tier !== t) continue;
    let q = ''; const n = 6;
    for (let k = 0; k <= n; k++) { const [x, z] = pAt(lerp(o.phi0, o.phi1, k / n), t.d0); q += (k ? 'L' : 'M') + X(x) + ' ' + Y(z); }
    for (let k = n; k >= 0; k--) { const [x, z] = pAt(lerp(o.phi0, o.phi1, k / n), t.dEnd); q += 'L' + X(x) + ' ' + Y(z); }
    h += `<path class="bk${o === b ? ' on' : ''}" d="${q}Z"/>`;
  }
  L.innerHTML = h;
}
function buildPanel(b) {
  $('#pStand').textContent = `${b.stand} Tribünü · ${tierWord(b.tier)}`.toLocaleUpperCase('tr-TR');
  $('#pTitle').textContent = `Blok ${b.id}`;
  $('#pPrice').textContent = b.price ? TL(b.price) : '—';
  $('#pCat').textContent = b.cat;
  $('#pFree').textContent = b.free ? `● ${fmt(b.free)} boş koltuk` : '● Tükendi';
  $('#pGate').textContent = `Kapı ${STANDS[b.stand].gate}`;
  const sold = 1 - b.free / b.seatCount;
  $('#pAvail').style.width = (sold * 100).toFixed(0) + '%';
  $('#pAvailTxt').textContent = `%${Math.round(sold * 100)}`;
  $('#pPerks').innerHTML = [...(PERKS[b.cat] || []), 'Çatı altında'].map((x) => `<li>${x}</li>`).join('');
  buildLocator(b);
  if (ui.pickSeat < 0) heroForBlock(b);
  const nRows = b.rows.length, maxN = Math.max(...b.rows.map((r) => r.count));
  const cx = 0, R0 = 300, dr = nRows > 10 ? 9.4 : 18;
  const spanBack = (maxN * 9.2) / (R0 + nRows * dr);
  let html = '', minX = 1e9, maxX = -1e9, maxY = -1e9;
  const ends = [[], []];
  b.rows.forEach((r, j) => {
    const R = R0 + j * dr, span = spanBack * (r.count / maxN) * ((R0 + nRows * dr) / R);
    for (let k = 0; k < r.count; k++) {
      const i = r.start + k, a = -span / 2 + span * (k + 0.5) / r.count;
      const x = cx + R * Math.sin(a), y = j * dr + R * (1 - Math.cos(a));
      minX = Math.min(minX, x); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
      const cls = ui.pickSet.includes(i) ? 'sel' : seatSold[i] ? 'sold' : 'free';
      html += `<g class="s ${cls}" data-i="${i}" transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${(a * 57.3).toFixed(1)})"><title>Sıra ${j + 1} · Koltuk ${k + 1}${seatSold[i] ? ' · Dolu' : ''}</title><rect x="-3.4" y="-2.8" width="6.8" height="5.8" rx="1.7"/><rect class="bk" x="-3.4" y="2.1" width="6.8" height="1.6" rx="0.8"/></g>`;
    }
    const a0 = -span / 2 - 0.035, a1 = span / 2 + 0.035;
    ends[0].push([cx + R * Math.sin(a0), j * dr + R * (1 - Math.cos(a0))]); ends[1].push([cx + R * Math.sin(a1), j * dr + R * (1 - Math.cos(a1))]);
    if (j % 4 === 0 || j === nRows - 1) html += `<text class="rl" x="${(ends[0][j][0] - 3).toFixed(1)}" y="${(ends[0][j][1] + 2).toFixed(1)}" text-anchor="end">${j + 1}</text><text class="rl" x="${(ends[1][j][0] + 3).toFixed(1)}" y="${(ends[1][j][1] + 2).toFixed(1)}">${j + 1}</text>`;
  });
  // aisles (stairs) on both sides of the block
  for (const side of [0, 1]) {
    const pts = ends[side].map(([x, y]) => `${(x + (side ? 8 : -8)).toFixed(1)},${y.toFixed(1)}`).join(' ');
    html += `<polyline class="ail" points="${pts}"/>`;
  }
  const mid = ends[0][Math.floor(nRows / 2)];
  html += `<text class="ais" x="${(mid[0] - 14).toFixed(1)}" y="${mid[1].toFixed(1)}" transform="rotate(-90 ${(mid[0] - 14).toFixed(1)} ${mid[1].toFixed(1)})" text-anchor="middle">MERDİVEN</text>`;
  const mid2 = ends[1][Math.floor(nRows / 2)];
  html += `<text class="ais" x="${(mid2[0] + 14).toFixed(1)}" y="${mid2[1].toFixed(1)}" transform="rotate(90 ${(mid2[0] + 14).toFixed(1)} ${mid2[1].toFixed(1)})" text-anchor="middle">MERDİVEN</text>`;
  html += `<text class="ais" x="${cx}" y="${(maxY + 14).toFixed(1)}" text-anchor="middle">▲ GİRİŞ · KAPI ${STANDS[b.stand].gate}</text>`;
  const pad = 26;
  seatmap.setAttribute('viewBox', `${(minX - pad).toFixed(0)} -6 ${(maxX - minX + pad * 2).toFixed(0)} ${(maxY + 24).toFixed(0)}`);
  seatmap.innerHTML = html;
  updateSelCard();
}
function updateSelCard() {
  const set = ui.pickSet, btn = $('#selBtn'), chips = $('#selChips');
  $('#qVal').textContent = ui.qty;
  if (!set.length || !ui.focus) {
    chips.innerHTML = '<span class="sel-empty">Haritadan ya da stadyumdan bir koltuk seç</span>';
    btn.disabled = true; btn.textContent = 'Koltuk seç'; $('#selTotal').textContent = '–';
    return;
  }
  const b = blocks[seatBlk[set[0]]];
  chips.innerHTML = [...set].sort((x, y) => seatNum[x] - seatNum[y]).map((i) => `<span class="seat-chip"><i>Sıra</i>${seatRow[i]}<i>Koltuk</i>${seatNum[i]}</span>`).join('');
  $('#selTotal').textContent = TL(b.price * set.length);
  btn.disabled = false; btn.textContent = set.length > 1 ? `${set.length} koltuğu seç · görünümü aç →` : 'Koltuktan görünümü aç →';
}
// preview camera for the panel: a bit above and in front of the seat so the highlighted seats are not in the way
function previewPose(i) {
  const p = seatPose(i), f = new THREE.Vector3(Math.sin(seatYaw[i]), 0, Math.cos(seatYaw[i]));
  p.pos.addScaledVector(f, 0.9); p.pos.y += 0.35; return p;
}
function heroForBlock(b) {
  const r = b.rows[Math.floor(b.rows.length / 2)], i = r.start + Math.floor(r.count / 2);
  const p = previewPose(i); snapshotReq = { pos: p.pos, target: p.target, fov: 62, canvas: $('#selView') };
  $('#heroLbl').textContent = `Blok ${b.id} · Sıra ${seatRow[i]}`;
}
function seatGroup(i, n) {
  const r = blocks[seatBlk[i]].rows[seatRow[i] - 1], lo = r.start, hi = r.start + r.count - 1;
  const g = [i];
  for (let k = i + 1; k <= hi && g.length < n && !seatSold[k]; k++) g.push(k);
  for (let k = i - 1; k >= lo && g.length < n && !seatSold[k]; k--) g.unshift(k);
  return g;
}
function pickSeat(i) {
  if (i < 0 || seatSold[i]) { if (i >= 0) toast('Bu koltuk dolu'); return; }
  const g = seatGroup(i, ui.qty);
  if (g.length < ui.qty) toast(`Bu sırada yan yana ${ui.qty} boş koltuk yok, ${g.length} koltuk seçildi`);
  ui.pickSeat = i; ui.pickSet = g; paintDirty = true;
  seatmap.querySelectorAll('g.s.sel').forEach((e) => e.classList.replace('sel', 'free'));
  for (const k of g) { const el = seatmap.querySelector(`g.s[data-i="${k}"]`); if (el) el.classList.replace('free', 'sel'); }
  const pose = previewPose(i); snapshotReq = { pos: pose.pos, target: pose.target, fov: 62, canvas: $('#selView') };
  $('#heroLbl').textContent = `Sıra ${seatRow[i]} · Koltuk ${seatNum[i]}`;
  updateSelCard();
}
$('#qMinus').addEventListener('click', () => { ui.qty = Math.max(1, ui.qty - 1); if (ui.pickSeat >= 0) pickSeat(ui.pickSeat); else updateSelCard(); });
$('#qPlus').addEventListener('click', () => { ui.qty = Math.min(6, ui.qty + 1); if (ui.pickSeat >= 0) pickSeat(ui.pickSeat); else updateSelCard(); });
seatmap.addEventListener('click', (e) => {
  const c = e.target.closest('g.s'); if (!c) return;
  pickSeat(+c.dataset.i);
});
seatmap.addEventListener('pointerover', (e) => { const c = e.target.closest('g.s'); if (c && ui.state === 'block') { ui.hoverSeat = +c.dataset.i; paintDirty = true; } });
$('#selBtn').addEventListener('click', () => { if (ui.pickSeat >= 0) selectSeat(ui.pickSeat); });

const viewCanvas = $('#viewCanvas');
let snapshotReq = null;
function fillTicket(i) {
  const b = blocks[seatBlk[i]];
  $('#tStand').textContent = `${b.stand} ${b.tier.lvl === 4 ? 'Üst' : b.tier.lvl === 2 ? 'VIP' : 'Alt'}`;
  $('#tBlock').textContent = b.id; $('#tRow').textContent = seatRow[i]; $('#tSeat').textContent = seatNum[i];
  $('#tCat').textContent = `${b.cat} · Kapı ${STANDS[b.stand].gate}`; $('#tPrice').textContent = TL(b.price);
}

/* ======================================================================
   State transitions
   ====================================================================== */
function setInsets() {
  const portrait = isPortrait() || view.W < 760;
  view.tInsetR = 0; view.tInsetB = 0;
  if (ui.state === 'block') { if (portrait) view.tInsetB = view.H * 0.52 + 10; else view.tInsetR = 410; }
  if (ui.state === 'seat' || ui.state === 'vip') { if (portrait) view.tInsetB = Math.min(ticketWrap.offsetHeight || 420, view.H * 0.55) * 0.9; else view.tInsetR = 0; }
}
function setHint() {
  const map = {
    overview: 'Sürükle: stadı çevir · bloğa tıkla',
    block: 'Koltuğunu seç, manzarayı gör',
    seat: 'Sürükleyerek etrafa bak',
    vip: 'VIP Loca · sürükleyerek etrafa bak',
  };
  hintText.textContent = map[ui.state] || '';
  hintEl.classList.toggle('hide', ui.state !== 'overview');
  backBtn.classList.toggle('on', ui.state !== 'landing' && ui.state !== 'enter');
  ctaEl.classList.toggle('on', ui.state === 'landing');
}
function goOverview() {
  ui.state = 'overview'; ui.focus = null; ui.selSeat = -1; ui.hover = null; ui.pickSeat = -1; ui.pickSet = []; ui.hoverSeat = -1; focusFx.set(null); showSeatTip(-1);
  panel.classList.remove('open'); ticketWrap.classList.remove('on'); ticketEl.classList.remove('flip');
  showTooltip(null); setInsets(); setHint(); paintDirty = true; paintTreads();
  flyTo(() => interiorPose(), 2.4, 8);
}
const ctaEl = $('#cta');
function enterStadium() {
  if (ui.state !== 'landing') return;
  ui.state = 'enter'; setHint(); idleT = 0;
  const above = { pos: new THREE.Vector3(0, 175, 2), target: new THREE.Vector3(0, 0, 0), fov: 48 };
  flyTo(above, 2.0, 30);
  flight.onDone = () => {
    lightsT0 = clock.t;
    flyTo(() => interiorPose(), 3.0, 0);
    flight.onDone = () => { ui.state = 'overview'; setHint(); standLabels.forEach((l, i) => { l.delay = clock.t + 0.2 + i * 0.15; }); };
  };
}
function goLanding() {
  lightsT0 = -1; ui.state = 'landing'; ui.focus = null; ui.selSeat = -1; ui.hover = null; ui.pickSeat = -1; ui.pickSet = []; focusFx.set(null);
  panel.classList.remove('open'); ticketWrap.classList.remove('on'); ticketEl.classList.remove('flip');
  showTooltip(null); setInsets(); paintDirty = true; paintTreads();
  const p = landingPose(); flyTo(p, 2.6, 40); flight.onDone = () => setHint();
  setHint(); ctaEl.classList.remove('on');
}
$('#ctaBtn').addEventListener('click', enterStadium);
function selectBlock(b) {
  if (!b) return;
  if (b.cat === 'Protokol') { toast('Protokol bloğu satışa kapalı'); return; }
  ui.state = 'block'; ui.focus = b; ui.selSeat = -1; ui.hover = null; ui.hoverSeat = -1;
  if (ui.pickSeat >= 0 && seatBlk[ui.pickSeat] !== b.index) { ui.pickSeat = -1; ui.pickSet = []; }
  showTooltip(b); focusFx.set(b); buildPanel(b); panel.classList.add('open'); ticketWrap.classList.remove('on'); ticketEl.classList.remove('flip');
  setInsets(); setHint(); paintDirty = true; paintTreads();
  flyTo(() => blockPose(b), 2.4, 6);
  idleT = 0;
}
function selectSeat(i) {
  const b = blocks[seatBlk[i]];
  if (!ui.pickSet.includes(i)) ui.pickSet = [i];
  ui.focus = b; ui.selSeat = i; ui.pickSeat = i; ui.state = 'seat'; ui.hover = null; ui.hoverSeat = -1; showTooltip(null); showSeatTip(-1); focusFx.set(null);
  buildPanel(b);
  panel.classList.remove('open');
  fillTicket(i); ticketEl.classList.remove('flip');
  setHint(); paintDirty = true; paintTreads();
  const pose = seatPose(i);
  flyTo(pose, 2.8, 12);
  flight.onDone = () => {
    snapshotReq = { pos: pose.pos, target: pose.target, fov: 60 };
    ticketWrap.classList.add('on'); setInsets();
  };
}
let vipActive = false;
function triggerVip() {
  if (ui.state === 'landing' || ui.state === 'enter') return;
  vipActive = true;
  if (!ticketWrap.classList.contains('on')) {
    if (ui.selSeat < 0) { $('#tStand').textContent = `${SIDE_NAMES[1]} VIP`; $('#tBlock').textContent = '201'; $('#tRow').textContent = 'L'; $('#tSeat').textContent = '12'; $('#tCat').textContent = 'Delux · Kapı A'; $('#tPrice').textContent = TL(CATS['Delux'].price); snapshotReq = { pos: vipPose().pos, target: vipPose().target, fov: 62 }; }
    ticketWrap.classList.add('on');
  }
  panel.classList.remove('open');
  setTimeout(() => ticketEl.classList.add('flip'), REC ? 0 : 60);
  ui.state = 'vip'; ui.hover = null; showTooltip(null); showSeatTip(-1); focusFx.set(null); setHint(); paintDirty = true; paintTreads();
  setInsets();
  const p = vipPose();
  flyTo(p, 3.4, 10);
}
function back() {
  if (ui.state === 'seat') { const b = ui.focus; ticketWrap.classList.remove('on'); selectBlock(b); }
  else if (ui.state === 'block' || ui.state === 'vip') goOverview();
  else if (ui.state === 'overview') goLanding();
}
backBtn.addEventListener('click', back);
$('#btnOther').addEventListener('click', () => back());
$('#btnBuy').addEventListener('click', () => toast('Demo: gerçek satış yapılmaz 🦁'));
$('#vipBtn').addEventListener('click', () => { showTyped('BİLET', true); });

/* ----- BİLET typing ----- */
const typedEl = $('#typed');
let typedBuf = '', typedTimer = 0;
function showTyped(str, fire) {
  typedEl.classList.remove('out');
  typedEl.innerHTML = [...str].map((ch) => `<span>${ch}</span>`).join('');
  clearTimeout(typedTimer);
  if (fire) { setTimeout(() => typedEl.classList.add('out'), REC ? 500 : 650); setTimeout(() => { typedEl.innerHTML = ''; }, 1400); triggerVip(); }
  else typedTimer = setTimeout(() => { typedEl.classList.add('out'); typedBuf = ''; }, 1600);
}
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') { back(); return; }
  if (e.key.length !== 1 || e.metaKey || e.ctrlKey) return;
  let ch = e.key.toLocaleUpperCase('tr-TR'); if (ch === 'I') ch = 'İ';
  const target = 'BİLET';
  const next = typedBuf + ch;
  if (target.startsWith(next)) { typedBuf = next; showTyped(typedBuf, typedBuf === target); if (typedBuf === target) typedBuf = ''; }
  else if (ch === 'B') { typedBuf = 'B'; showTyped('B', false); }
  else typedBuf = '';
});

/* ======================================================================
   Pointer
   ====================================================================== */
const raycaster = new THREE.Raycaster();
const pickMeshes = blocks.map((b) => b.mesh);
let pointerDirty = false, drag = null;
canvas.addEventListener('pointermove', (e) => {
  mouse.px = e.clientX; mouse.py = e.clientY; mouse.inside = true;
  mouse.x = (e.clientX / view.W) * 2 - 1; mouse.y = -(e.clientY / view.H) * 2 + 1;
  mouse.nx = mouse.x; mouse.ny = mouse.y;
  pointerDirty = true; idleT = 0;
  if (drag && ui.state === 'overview') { ovTheta = drag.theta - (e.clientX - drag.x) * 0.0045; }
  if (drag && (ui.state === 'seat' || ui.state === 'vip')) {
    look.tYaw = drag.yaw - (e.clientX - drag.x) * 0.004; look.tPitch = clamp(drag.pitch + (e.clientY - drag.y) * 0.003, -0.6, 0.6);
  }
});
canvas.addEventListener('pointerleave', () => { mouse.inside = false; if (ui.state === 'overview') { ui.hover = null; showTooltip(null); } ui.hoverSeat = -1; showSeatTip(-1); paintDirty = true; paintTreads(); });
canvas.addEventListener('pointerdown', (e) => { drag = { x: e.clientX, y: e.clientY, yaw: look.tYaw, pitch: look.tPitch, theta: ovTheta, moved: 0 }; });
canvas.addEventListener('pointerup', (e) => {
  const moved = drag ? Math.hypot(e.clientX - drag.x, e.clientY - drag.y) : 0; drag = null;
  if (moved > 6 || flight) return;
  if (ui.state === 'overview' && ui.hover) selectBlock(ui.hover);
  else if (ui.state === 'block') {
    const hit = pick();
    if (hit && hit.block !== ui.focus) selectBlock(hit.block);
    else if (hit) { const i = nearestSeat(hit); if (i >= 0) pickSeat(i); }
  }
});
function nearestSeat(hit) {
  let best = -1, bd = 1e9; const b = hit.block;
  for (let i = b.seatStart; i < b.seatStart + b.seatCount; i++) { const d = (seatX[i] - hit.point.x) ** 2 + (seatY[i] + 0.4 - hit.point.y) ** 2 + (seatZ[i] - hit.point.z) ** 2; if (d < bd) { bd = d; best = i; } }
  return bd < 1.2 ? best : -1;
}
function pick() {
  raycaster.setFromCamera(new THREE.Vector2(mouse.x, mouse.y), camera);
  const h = raycaster.intersectObjects(pickMeshes, false)[0];
  return h ? { block: h.object.userData.block, point: h.point } : null;
}
function updateHover() {
  if (!pointerDirty || flight) return; pointerDirty = false;
  if (!mouse.inside || (ui.state !== 'overview' && ui.state !== 'block')) return;
  const h = pick(); const b = h ? h.block : null;
  if (ui.state === 'block') {
    const i = h && b === ui.focus ? nearestSeat(h) : -1;
    if (i !== ui.hoverSeat) { ui.hoverSeat = i; paintDirty = true; }
    showSeatTip(i);
    document.getElementById('app').classList.toggle('pointer', i >= 0 || (!!b && b !== ui.focus));
    return;
  }
  if (b !== ui.hover) { ui.hover = b; paintDirty = true; paintTreads(); showTooltip(b); }
  document.getElementById('app').classList.toggle('pointer', !!b);
}

/* ======================================================================
   Loop
   ====================================================================== */
const clock = { t: 0 };
let roofTarget = 1;
function resize() {
  view.W = window.innerWidth; view.H = window.innerHeight;
  renderer.setSize(view.W, view.H, false);
  setInsets();
}
window.addEventListener('resize', resize);
resize();

// start: outside, roof on, lights off inside
let lightsT0 = -1, nightK = 0;
function startIntro() {
  ui.state = 'landing'; ui.revealFront = 0;
  const p = landingPose(); cam.pos.copy(p.pos); cam.target.copy(p.target); cam.fov = p.fov;
  setHint();
}

function step(dt) {
  dt = Math.min(dt, 0.1);
  clock.t += dt; idleT += dt;
  // intro lighting + sweep
  const lt = lightsT0 < 0 ? 0 : sstep(0, 2.8, clock.t - lightsT0);
  const night = nightK;
  hemi.intensity = lerp(0.8, 0.32, night); sun.intensity = lerp(2.5, 0.0, night);
  flood.intensity = 2.3 * night; flood2.intensity = 0.9 * night;
  scene.environmentIntensity = lerp(0.32, 0.22, night);
  scene.background = night > 0.5 ? skyNight : skyDay;
  ROOF.edgeMat.emissiveIntensity = 0.22 * lt; ROOF.lampMat.emissiveIntensity = 1.6 * lt; ROOF.glowMat.opacity = 0.9 * lt * night;
  const front = lightsT0 < 0 ? 0 : lerp(20, 210, sstep(0.1, 2.8, clock.t - lightsT0));
  if (front !== ui.revealFront) { ui.revealFront = front; paintDirty = true; }
  const wantNight = 0;
  nightK = lerp(nightK, wantNight, 1 - Math.exp(-dt * 2.2)); if (Math.abs(nightK - wantNight) < 0.002) nightK = wantNight;
  // ambient effects
  ledTex.offset.x = (clock.t * 0.04) % 1; ribbonTex.offset.x = (clock.t * 0.012) % 1;
  const vipOn = ui.state === 'vip' ? 1 : 0;
  VIP.light.intensity = lerp(VIP.light.intensity, vipOn ? 26 : 6, 1 - Math.exp(-dt * 2));
  VIP.light2.intensity = lerp(VIP.light2.intensity, vipOn ? 12 : 2, 1 - Math.exp(-dt * 2));
  if (ui.state === 'vip' && !flight && !drag) look.tYaw = Math.sin(clock.t * 0.25) * 0.35;
  if (ui.state === 'overview' && idleT > 8 && !REC) orbitOn = true; else if (idleT < 1) orbitOn = false;

  updateHover();
  updateCamera(dt);
  setSeatLod();
  if (paintDirty) paintSeats();
  updateLabels();
  placeTooltip();
  render();
}
function render() {
  if (snapshotReq) {
    const pr = renderer.getPixelRatio();
    const out = snapshotReq.canvas || viewCanvas;
    const W = Math.min(out.width, renderer.domElement.width), H = Math.round(W * 9 / 16);
    const sc = new THREE.PerspectiveCamera(snapshotReq.fov, W / H, 0.25, 6000);
    sc.position.copy(snapshotReq.pos); sc.lookAt(snapshotReq.target); sc.updateProjectionMatrix();
    const vw = W / pr, vh = H / pr;
    renderer.setScissorTest(true); renderer.setViewport(0, 0, vw, vh); renderer.setScissor(0, 0, vw, vh);
    const pv = seatPoints.visible; seatPoints.visible = false; seatMeshes.forEach((m) => (m.visible = true));
    renderer.render(scene, sc);
    setSeatLod();
    const ctx = out.getContext('2d');
    ctx.drawImage(renderer.domElement, 0, renderer.domElement.height - H, W, H, 0, 0, out.width, out.height);
    renderer.setScissorTest(false); renderer.setViewport(0, 0, view.W, view.H);
    snapshotReq = null;
  }
  renderer.render(scene, camera);
}

let last = performance.now();
function loop(now) { step((now - last) / 1000); last = now; requestAnimationFrame(loop); }

// page texts + club colours
{
  const r = document.documentElement.style;
  r.setProperty('--red', CFG.colors.primary); r.setProperty('--red-2', CFG.colors.primary2); r.setProperty('--yellow', CFG.colors.accent);
  document.title = `${CFG.stadium} 3D Bilet`;
  document.querySelectorAll('.brand b').forEach((e) => (e.textContent = CFG.brand));
  document.querySelectorAll('.brand small').forEach((e) => (e.textContent = `${CFG.stadium} · 3D bilet deneyimi`));
  document.querySelectorAll('.teams, .cta-teams, .t-match').forEach((e) => { e.innerHTML = `<b>${CFG.match.home}</b><span>vs</span><b>${CFG.match.away}</b>`; });
  document.querySelectorAll('.match small, .cta-card small').forEach((e) => (e.textContent = `${CFG.match.league}${e.closest('.match') ? ' · ' + CFG.match.time : ''}`));
  document.querySelectorAll('.cta-meta, .t-sub').forEach((e) => (e.textContent = `${CFG.stadium} · ${CFG.place} · ${CFG.match.time}`));
  document.querySelectorAll('.switch a').forEach((e) => e.classList.toggle('on', e.dataset.s === SID));
  if (CFG.sketchfab) {
    const sk = CFG.sketchfab, btn = $('#skfbBtn'), box = $('#skfb'), fr = $('#skfbFrame');
    btn.hidden = false; $('#skfbTitle').textContent = sk.title;
    $('#skfbLink').textContent = sk.title; $('#skfbLink').href = sk.url; $('#skfbAuthor').textContent = sk.author; $('#skfbAuthor').href = sk.authorUrl;
    btn.addEventListener('click', () => { fr.src = `https://sketchfab.com/models/${sk.id}/embed?autostart=1`; box.hidden = false; });
    $('#skfbClose').addEventListener('click', () => { box.hidden = true; fr.src = 'about:blank'; });
  }
  const lt = $('#loader span'); if (lt) lt.textContent = `${CFG.stadium} yükleniyor…`;
  const disc = $('.disclaimer'); if (disc) disc.textContent = `Hayran yapımı demo · Kulüpler, stadyum işletmesi veya Passo ile bağlantısı yoktur · Fiyatlar örnektir`;
}

// boot
paintSeats();
Promise.all([satReady.catch((e) => console.warn('satellite', e)), crestReady, fontsReady]).finally(() => {
  $('#loader').classList.add('done');
  startIntro();
  if (REC) window.__step = (dt) => step(dt);
  else requestAnimationFrame((t) => { last = t; requestAnimationFrame(loop); });
});

// public API (used by the demo recorder and for debugging)
window.__dbg = { setAz: (a) => { orbitAz = a; }, renderer, scene, seatMeshes, camera, seat: { x: seatX, y: seatY, z: seatZ } };
window.app = {
  blocks, SEATS, standStats,
  get state() { return ui.state; },
  get flying() { return !!flight; },
  blockScreen(id) { const b = blockById[id]; const v = b.center.clone().project(camera); return { x: (v.x * 0.5 + 0.5) * view.W, y: (-v.y * 0.5 + 0.5) * view.H }; },
  seatScreen(i) { const SX = window.__dbg.seat; const v = new THREE.Vector3(SX.x[i], SX.y[i] + 0.6, SX.z[i]).project(camera); return { x: (v.x * 0.5 + 0.5) * view.W, y: (-v.y * 0.5 + 0.5) * view.H }; },
  pointScreen(x, y, z) { const v = new THREE.Vector3(x, y, z).project(camera); return { x: (v.x * 0.5 + 0.5) * view.W, y: (-v.y * 0.5 + 0.5) * view.H }; },
  seatIndex(blockId, row, num) { const b = blockById[blockId]; const r = b.rows[row - 1]; return r.start + num - 1; },
  freeSeatNear(blockId, row) { const b = blockById[blockId]; for (let d = 0; d < 20; d++) for (const rr of [row + d, row - d]) { const r = b.rows[rr - 1]; if (!r) continue; const mid = Math.floor(r.count / 2); for (let k = 0; k < r.count; k++) { const kk = mid + (k % 2 ? -(k + 1) / 2 : k / 2); const i = r.start + kk; if (kk >= 0 && kk < r.count && !seatSold[i]) return i; } } return -1; },
  selectBlock: (id) => selectBlock(blockById[id]), selectSeat, triggerVip, goOverview, back, enterStadium, goLanding, pickSeat,
  setOrbit(v) { orbitOn = v; idleT = v ? 99 : 0; },
};
console.log(`[${CFG.stadium}] ${blocks.length} blok, ${SEATS} koltuk modellendi`);
