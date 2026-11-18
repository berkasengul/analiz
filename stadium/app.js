// Aslan Bilet — RAMS Park 3D bilet deneyimi (hayran yapımı demo)
// Saha 105x68, 3 seviye (100 alt kat / 200 VIP-loca / 400 üst kat), 84 blok.
import * as THREE from './vendor/three.module.min.js';
import { RoomEnvironment } from './vendor/addons/environments/RoomEnvironment.js';

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

/* ======================================================================
   Stadium geometry (superellipse bowl around a 105 x 68 pitch)
   ====================================================================== */
const PITCH_L = 105, PITCH_W = 68;
const A0 = PITCH_L / 2 + 8.2;  // kale arkası 1. sıra ~8 m
const B0 = PITCH_W / 2 + 6.2;  // yan tribün 1. sıra ~6 m
const SEN = 4.2;
const KA = 0.96, KB = 1.06; // bowl grows a bit faster on the sides (real footprint 232 x 205 m)
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

const TIERS = [
  { lvl: 1, name: 'Alt Kat', rows: 37, d0: 0.8, depth: 0.78, h0: 0.6, riseA: 0.27, riseB: 0.47, color: 0xd0142c },
  { lvl: 2, name: 'VIP & Loca', rows: 3, d0: 31.0, depth: 0.95, h0: 16.8, riseA: 0.42, riseB: 0.42, color: 0x232026 },
  { lvl: 4, name: 'Üst Kat', rows: 27, d0: 36.6, depth: 0.72, h0: 23.2, riseA: 0.5, riseB: 0.56, color: 0xffb800 },
];
for (const t of TIERS) {
  t.rd = []; t.rh = []; let h = t.h0;
  for (let j = 0; j < t.rows; j++) { t.rd.push(t.d0 + j * t.depth); t.rh.push(h); h += lerp(t.riseA, t.riseB, j / Math.max(1, t.rows - 1)); }
  t.dEnd = t.d0 + t.rows * t.depth; t.hEnd = t.rh[t.rows - 1];
}
const T1 = TIERS[0], T2 = TIERS[1], T4 = TIERS[2];
const GLASS_D = T2.dEnd + 0.4, LOCA_BACK = 42, LOCA_CEIL = T4.h0 - 1.6;
const FACADE_D = 57.5, ROOF_Y = 46.5, ROOF_OUT = 47.4;
const OPEN_X = 57, OPEN_Z = 42; // rectangular roof opening (from the satellite image)

/* ----- categories (gsplan.org kategori tablosu; fiyatlar örnek) ----- */
const CATS = {
  'Premium': { price: 18500, sold: 0.93 }, 'Delux': { price: 14250, sold: 0.9 }, 'Lux': { price: 10900, sold: 0.9 },
  'Classic': { price: 8400, sold: 0.91 }, '1. Kategori': { price: 6750, sold: 0.95 }, '2. Kategori': { price: 5400, sold: 0.94 },
  '3. Kategori': { price: 4350, sold: 0.93 }, '4. Kategori': { price: 3500, sold: 0.91 }, '5. Kategori': { price: 2650, sold: 0.94 },
  '6. Kategori': { price: 2150, sold: 0.92 }, '7. Kategori': { price: 1650, sold: 0.96 }, '8. Kategori': { price: 1250, sold: 0.95 },
  'Misafir': { price: 1500, sold: 0.7 }, 'Protokol': { price: 0, sold: 1 },
};
const CAT_OF = {};
const setCat = (ids, c) => ids.forEach((i) => (CAT_OF[i] = c));
const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => String(a + i));
setCat(['213'], 'Premium'); setCat(['212', '214', '201', '225'], 'Delux'); setCat(['211', '215', '202', '224'], 'Lux');
setCat(['101V', '100', '125V'], 'Classic'); setCat(['113'], '1. Kategori'); setCat(['112', '114', '101', '125'], '2. Kategori');
setCat(['111', '115', '102', '124'], '3. Kategori'); setCat(['110', '116', '103', '123', '210', '216', '203', '223'], '4. Kategori');
setCat(['413', '414', '415', '416', '417', '402', '401', '400', '429', '428'], '5. Kategori'); setCat(['412', '403', '427'], '6. Kategori');
setCat([...range(104, 109), ...range(117, 122), ...range(204, 209), ...range(217, 222)], '7. Kategori');
setCat([...range(404, 411), ...range(422, 426)], '8. Kategori'); setCat(range(418, 421), 'Misafir'); setCat(['200'], 'Protokol');

const STANDS = {
  'Güney': { gate: 'D', mid: 0 }, 'Batı': { gate: 'A', mid: Math.PI / 2 },
  'Kuzey': { gate: 'B', mid: Math.PI }, 'Doğu': { gate: 'C', mid: Math.PI * 1.5 },
};
const LAYOUT = {
  1: { 'Güney': range(117, 122), 'Batı': ['123', '124', '125', '125V', '100', '101V', '101', '102', '103'], 'Kuzey': range(104, 109), 'Doğu': range(110, 116) },
  2: { 'Güney': range(217, 222), 'Batı': ['223', '224', '225', '200', '201', '202', '203'], 'Kuzey': range(204, 209), 'Doğu': range(210, 216) },
  4: { 'Güney': range(419, 426), 'Batı': ['427', '428', '429', '400', '401', '402', '403'], 'Kuzey': range(404, 411), 'Doğu': range(412, 418) },
};

/* ======================================================================
   Renderer / scene
   ====================================================================== */
const canvas = $('#c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
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
scene.background = canvasTex(4, 256, (g, w, h) => {
  const gr = g.createLinearGradient(0, 0, 0, h);
  gr.addColorStop(0, '#2b3f63'); gr.addColorStop(0.55, '#c9a27c'); gr.addColorStop(1, '#f2d3a6');
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
});
scene.fog = new THREE.Fog(0xcdb594, 2600, 7000);

// lights
const hemi = new THREE.HemisphereLight(0xd8e6ff, 0x46523a, 0.0);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xffecd0, 0.0);
sun.position.set(300, 420, -120);
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
    g.fillStyle = '#285f28'; g.fillRect(0, 0, w, h);
    const sw = PITCH_L / 18;
    for (let i = -12; i < 12; i++) { g.fillStyle = i % 2 ? '#357c33' : '#2b6a2b'; g.fillRect(cx + m(i * sw), 0, m(sw) + 1, h); }
    // subtle noise
    const cw = PITCH_W / 10;
    for (let j = -8; j < 8; j++) { g.fillStyle = j % 2 ? 'rgba(255,255,255,0.015)' : 'rgba(0,0,0,0.015)'; g.fillRect(0, cy + m(j * cw), w, m(cw) + 1); }
    for (let i = 0; i < 120000; i++) { const v = Math.random(); g.fillStyle = v < 0.5 ? `rgba(10,40,10,${0.05 + Math.random() * 0.08})` : `rgba(150,200,90,${0.03 + Math.random() * 0.05})`; g.fillRect(Math.random() * w, Math.random() * h, 1 + Math.random() * 2, 1); }
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
  const words = ['RAMS PARK', 'ASLAN BİLET', '3D KOLTUK SEÇİMİ', 'CİMBOM'];
  g.font = '900 40px Inter, Arial'; g.textBaseline = 'middle';
  let x = 10, i = 0;
  while (x < w) { const t = words[i % words.length]; g.fillStyle = i % 2 ? '#fdb912' : '#ff2a4f'; g.fillText(t, x, h / 2 + 2); x += g.measureText(t).width + 60; i++; }
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

const SEAT_W = 0.6, AISLE = 0.8;
const tmpSeats = { x: [], y: [], z: [], yaw: [], blk: [], row: [], num: [] };

for (const t of TIERS) {
  const prof = tierProfile(t);
  const dMid = t.rd[Math.floor(t.rows / 2)];
  const delta = Math.atan2(B0 + dMid, A0 + dMid);
  const ranges = { 'Güney': [-delta, delta], 'Batı': [delta, Math.PI - delta], 'Kuzey': [Math.PI - delta, Math.PI + delta], 'Doğu': [Math.PI + delta, 2 * Math.PI - delta] };
  for (const stand of ['Güney', 'Batı', 'Kuzey', 'Doğu']) {
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
  const b0 = blockById['110'], b1 = blockById['116'];
  const p0 = b0.phi0, p1 = b1.phi1, rows = T1.rows, W = 1400, RH = 6, H = rows * RH;
  const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d');
  const top = (rows - 33) * RH, bot = (rows - 4) * RH, hh = bot - top;
  g.fillStyle = '#f2a21c'; g.font = `900 ${(rows - 6 - 5) * RH * 1.18}px "Arial Black", "DejaVu Sans", Arial, sans-serif`; g.textBaseline = 'alphabetic';
  const txt = 'GALATASARAY', tw = g.measureText(txt).width, x0 = W * 0.165, x1 = W * 0.985;
  g.save(); g.translate(x0, (rows - 5) * RH); g.scale((x1 - x0) / tw, 1); g.fillText(txt, 0, 0); g.restore();
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
  if (mos) c.setRGB(mos[0], mos[1], mos[2], THREE.SRGBColorSpace); else c.setHex(b.tier.lvl === 2 ? 0x6a1019 : 0x7c1521);
  c.multiplyScalar(seatVar[i]);
  seatBase[i * 3] = c.r; seatBase[i * 3 + 1] = c.g; seatBase[i * 3 + 2] = c.b;
}
const crestReady = new Promise((res) => {
  const im = new Image(); im.onload = () => { MOSAIC.setCrest(im); const c = new THREE.Color(); for (let i = MOSAIC.range[0]; i < MOSAIC.range[1]; i++) seatColour(i, c); paintDirty = true; res(); };
  im.onerror = () => res(); im.src = 'assets/gs-crest.png';
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
  const P = [[0.20, 0.40], [0.17, 0.445], [-0.12, 0.425], [-0.19, 0.47], [-0.235, 0.84], [-0.205, 0.855], [-0.16, 0.50], [-0.10, 0.46], [0.16, 0.475], [0.215, 0.44]];
  const shape = new THREE.Shape(P.map(([z, y]) => new THREE.Vector2(z, y)));
  const g = new THREE.ExtrudeGeometry(shape, { depth: 0.42, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.012, bevelSegments: 1, curveSegments: 1 });
  // extrude axis is +z: rotate so the width runs along x and the profile's first coord is z (facing +z)
  g.translate(0, 0, -0.21); g.rotateY(-Math.PI / 2);
  const p = g.attributes.position, c = [];
  for (let i = 0; i < p.count; i++) { const y = p.getY(i); const k = 0.55 + 0.45 * Math.min(1, Math.max(0, (y - 0.4) / 0.42)); c.push(k, k, k); }
  g.setAttribute('color', new THREE.Float32BufferAttribute(c, 3));
  g.computeVertexNormals();
  return g;
})();
const seatMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.38, metalness: 0.0, vertexColors: true });
const seatMeshes = [];
{
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), s = new THREE.Vector3(1, 1, 1), p = new THREE.Vector3();
  for (const b of blocks) {
    const im = new THREE.InstancedMesh(seatGeo, seatMat, b.seatCount);
    for (let k = 0; k < b.seatCount; k++) { const i = b.seatStart + k; e.set(0, seatYaw[i], 0); q.setFromEuler(e); p.set(seatX[i], seatY[i], seatZ[i]); m.compose(p, q, s); im.setMatrixAt(k, m); }
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
  const segs = [['#1b2cc9', 'RAMS PARK'], ['#0b0b10', 'ASLAN BİLET'], ['#6d1fd1', 'İSTANBUL'], ['#c8102e', 'CİMBOM'], ['#f2f2f2', '3D KOLTUK SEÇİMİ'], ['#10151f', 'RAMS PARK']];
  let x = 0; let i = 0;
  while (x < w) { const [bg, t] = segs[i % segs.length]; const sw = 300; g.fillStyle = bg; g.fillRect(x + 2, 4, sw - 4, h - 8); g.fillStyle = bg === '#f2f2f2' ? '#0b0b10' : '#ffffff'; g.font = '800 22px Inter, Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(t, x + sw / 2, h / 2 + 1); x += sw; i++; }
}, { repeat: [1, 1] });
ribbonTex.wrapS = THREE.RepeatWrapping;
{
  const mat = new THREE.MeshStandardMaterial({ color: 0x000000, emissive: 0xffffff, emissiveMap: ribbonTex, emissiveIntensity: 1.25, side: THREE.DoubleSide });
  scene.add(new THREE.Mesh(loft([[T2.d0 - 0.56, T2.h0 - 1.9], [T2.d0 - 0.56, T2.h0 + 0.85]], ...FULL, 720, { uScale: 40, vAcross: true }), mat));
  scene.add(new THREE.Mesh(loft([[T4.d0 - 1.06, T4.h0 - 1.5], [T4.d0 - 1.06, T4.h0 + 0.85]], ...FULL, 720, { uScale: 40, vAcross: true }), mat));
}

/* ----- facade ----- */
{
  const facadeTex = canvasTex(512, 512, (g, w, h) => {
    g.fillStyle = '#c9ccd2'; g.fillRect(0, 0, w, h);
    for (let x = 0; x < w; x += 16) { g.fillStyle = x % 32 ? '#aeb2b9' : '#e1e3e7'; g.fillRect(x, 0, 8, h); }
    g.fillStyle = 'rgba(30,30,40,0.55)'; for (let y = 60; y < h; y += 128) g.fillRect(0, y, w, 10);
  }, { repeat: [1, 1] });
  facadeTex.wrapS = facadeTex.wrapT = THREE.RepeatWrapping;
  const f = new THREE.Mesh(loft([[FACADE_D, -0.1], [FACADE_D, ROOF_Y - 0.3]], ...FULL, 720, { uScale: 24 }), new THREE.MeshStandardMaterial({ map: facadeTex, roughness: 0.7, metalness: 0.0, side: THREE.DoubleSide }));
  f.castShadow = true; f.receiveShadow = true; scene.add(f);
  // red band at top of facade
  scene.add(new THREE.Mesh(loft([[FACADE_D + 0.05, ROOF_Y - 7], [FACADE_D + 0.05, ROOF_Y - 5.2]], ...FULL, 720), new THREE.MeshStandardMaterial({ color: 0xa90432, roughness: 0.5, side: THREE.DoubleSide })));
}

/* ----- roof: white rim, solar panels split by a "#" of white trusses, rectangular opening ----- */
const ROOF = (() => {
  const RX = A0 + (FACADE_D + 1.5) * KA, RZ = B0 + (FACADE_D + 1.5) * KB;
  const S = 8; // px per metre
  const tex = canvasTex(Math.round(RX * 2 * S), Math.round(RZ * 2 * S), (g, w, h) => {
    const X = (x) => (x + RX) * S, Z = (z) => (z + RZ) * S;
    g.fillStyle = '#eef0f2'; g.fillRect(0, 0, w, h);
    // solar field = whole roof minus rim (drawn via clip of an inner superellipse)
    g.save(); g.beginPath();
    for (let i = 0; i <= 256; i++) { const [x, z] = pAt(-Math.PI + i / 128 * Math.PI, FACADE_D - 6.5); i ? g.lineTo(X(x), Z(z)) : g.moveTo(X(x), Z(z)); }
    g.closePath(); g.clip();
    g.fillStyle = '#39404c'; g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(190,200,215,0.55)'; g.lineWidth = 1;
    for (let x = 0; x < w; x += S * 2.2) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); }
    for (let y = 0; y < h; y += S * 1.1) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
    g.fillStyle = 'rgba(255,255,255,0.08)'; for (let y = 0; y < h; y += S * 9) g.fillRect(0, y, w, S * 0.9);
    // "#" trusses
    g.fillStyle = '#f4f5f6'; const bw = 7 * S;
    for (const sx of [-1, 1]) g.fillRect(X(sx * (OPEN_X + 3.5)) - bw / 2, 0, bw, h);
    for (const sz of [-1, 1]) g.fillRect(0, Z(sz * (OPEN_Z + 3.5)) - bw / 2, w, bw);
    g.restore();
  });
  const shape = new THREE.Shape();
  for (let i = 0; i <= 256; i++) { const [x, z] = pAt(-Math.PI + i / 128 * Math.PI, FACADE_D + 1.5); i ? shape.lineTo(x, -z) : shape.moveTo(x, -z); }
  const hole = new THREE.Path(); hole.moveTo(-OPEN_X, -OPEN_Z); hole.lineTo(-OPEN_X, OPEN_Z); hole.lineTo(OPEN_X, OPEN_Z); hole.lineTo(OPEN_X, -OPEN_Z); hole.lineTo(-OPEN_X, -OPEN_Z);
  shape.holes.push(hole);
  const geo = new THREE.ShapeGeometry(shape, 64); geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position, uv = geo.attributes.uv;
  for (let i = 0; i < pos.count; i++) uv.setXY(i, (pos.getX(i) + RX) / (2 * RX), 1 - (pos.getZ(i) + RZ) / (2 * RZ));
  const topMat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.45, metalness: 0.0, transparent: true, opacity: 1, side: THREE.FrontSide });
  const top = new THREE.Mesh(geo, topMat); top.position.y = ROOF_Y; top.castShadow = true; top.receiveShadow = true; scene.add(top);
  const underMat = new THREE.MeshStandardMaterial({ color: 0x8e9197, emissive: 0x2a0406, roughness: 0.85, transparent: true, opacity: 1, side: THREE.BackSide });
  const under = new THREE.Mesh(geo, underMat); under.position.y = ROOF_Y - 0.05; scene.add(under);
  // white rim (stays visible in the ticketing view, like the real roof edge)
  const rimMat = new THREE.MeshStandardMaterial({ color: 0xf1f2f4, roughness: 0.5, side: THREE.DoubleSide, transparent: true, opacity: 1 });
  const rim = new THREE.Mesh(loft([[FACADE_D - 1.2, ROOF_Y + 0.02], [FACADE_D + 1.5, ROOF_Y + 0.02], [FACADE_D + 1.5, ROOF_Y - 2.4]], ...FULL, 720), rimMat);
  rim.castShadow = true; scene.add(rim);
  // opening edge: floodlight strip + truss fascia
  const edgeMat = new THREE.MeshStandardMaterial({ color: 0x401014, emissive: 0xff2236, emissiveIntensity: 0, transparent: true, opacity: 1 });
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
  const yT = ROOF_Y - 0.5, yB = ROOF_Y - 6.5;
  const lacing = (A1, A2, B1, B2, n, r) => { for (let k = 0; k <= n; k++) { const t = k / n, t2 = Math.min(1, (k + 0.5) / n); const a = A1.clone().lerp(A2, t), b = B1.clone().lerp(B2, t2); SEG(a, b, r); if (k < n) SEG(b, A1.clone().lerp(A2, (k + 1) / n), r); } };
  const sides = [ // [axis, sign]: along x at z=±OPEN_Z, along z at x=±OPEN_X
    ...[-1, 1].map((sg) => ({ P: (u, o, y) => V(u, y, sg * (OPEN_Z + o)), L: OPEN_X + 6, rim: (u) => ext(u, ea, eb), sg })),
    ...[-1, 1].map((sg) => ({ P: (u, o, y) => V(sg * (OPEN_X + o), y, u), L: OPEN_Z + 6, rim: (u) => ext(u, eb, ea), sg })),
  ];
  for (const sd of sides) {
    const { P, L } = sd;
    // main triangular truss
    const tA1 = P(-L, 0.6, yT), tA2 = P(L, 0.6, yT), tB1 = P(-L, 5.0, yT), tB2 = P(L, 5.0, yT), bo1 = P(-L, 2.8, yB), bo2 = P(L, 2.8, yB);
    SEG(tA1, tA2, 0.35); SEG(tB1, tB2, 0.35); SEG(bo1, bo2, 0.42);
    const n = Math.round(L / 3);
    lacing(tA1, tA2, bo1, bo2, n, 0.14); lacing(tB1, tB2, bo1, bo2, n, 0.14);
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
  let vis = 1;
  return {
    edgeMat, lampMat,
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
    c.fillStyle = '#fff'; c.font = '900 54px Inter, Arial'; c.textAlign = 'center'; c.fillText('GS  0 – 0  FB', w / 2, 120);
    c.font = '700 26px Inter, Arial'; c.fillText('CANLI · RAMS PARK', w / 2, h - 26);
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
const SAT = { centre: [-3.6, 0.6], ax: [-0.6018, -0.7986], az: [-0.7986, 0.6018] };
const toWorld = ([e, n]) => { const de = e - SAT.centre[0], dn = n - SAT.centre[1]; return [de * SAT.ax[0] + dn * SAT.ax[1], de * SAT.az[0] + dn * SAT.az[1]]; };
const satReady = (async () => {
  const meta = await (await fetch('assets/sat.json')).json();
  const small = Math.min(window.innerWidth, window.innerHeight) < 700 && !REC;
  const tex = await new THREE.TextureLoader().loadAsync(small ? 'assets/sat-2k.jpg' : 'assets/sat.jpg');
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
  state: 'landing', hover: null, focus: null, selSeat: -1, hoverSeat: -1, pickSeat: -1, revealFront: 0, lightsOn: 0,
};
let paintDirty = true;
function paintSeats() {
  const hb = ui.hover ? ui.hover.index : -1, fb = ui.focus ? ui.focus.index : -1;
  const revealing = ui.revealFront < 200;
  for (let i = 0; i < SEATS; i++) {
    const bi = seatBlk[i]; let r = seatBase[i * 3], g = seatBase[i * 3 + 1], b = seatBase[i * 3 + 2];
    if (bi === hb && ui.state === 'overview') { r = lerp(r, 1.0, 0.8); g = lerp(g, 0.5, 0.8); b = lerp(b, 0.08, 0.8); }
    if (i === ui.hoverSeat && ui.state === 'block') { r = lerp(r, 1, 0.75); g = lerp(g, 1, 0.75); b = lerp(b, 1, 0.75); }
    if (i === ui.pickSeat || i === ui.selSeat) { r = 0.1; g = 1.0; b = 0.55; }
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
let ovTheta = -Math.PI / 2; // interior overview: direction the camera looks at (−π/2 = Doğu, the GALATASARAY stand)
function landingPose(az = orbitAz) {
  const portrait = isPortrait();
  const el = THREE.MathUtils.degToRad(portrait ? 40 : 30), dist = portrait ? 640 : 430;
  const target = new THREE.Vector3(0, 8, 0);
  const pos = new THREE.Vector3(Math.cos(el) * Math.sin(az), Math.sin(el), Math.cos(el) * Math.cos(az)).multiplyScalar(dist).add(target);
  return { pos, target, fov: 34 };
}
function interiorPose(th = ovTheta) {
  const c = Math.cos(th), sn = Math.sin(th), portrait = isPortrait();
  return { pos: new THREE.Vector3(-c * A0 * 0.55, portrait ? 27 : 24, -sn * B0 * 0.85), target: new THREE.Vector3(c * (A0 + 10), portrait ? 8 : 10, sn * (B0 + 12)), fov: portrait ? 72 : 58 };
}
function blockPose(b) {
  const c = b.center.clone();
  const n = b.inward.clone();
  const portrait = isPortrait();
  const pos = c.clone().addScaledVector(n, portrait ? 36 : 31); pos.y = Math.min(c.y + (portrait ? 26 : 23), 41);
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
function buildPanel(b) {
  $('#pStand').textContent = `${b.stand} Tribünü · ${tierWord(b.tier)}`;
  $('#pTitle').textContent = `Blok ${b.id}`;
  $('#pPrice').textContent = b.price ? TL(b.price) : '—';
  $('#pCat').textContent = b.cat;
  $('#pFree').textContent = b.free ? `● ${fmt(b.free)} boş / ${fmt(b.seatCount)}` : '● Tükendi';
  $('#pGate').textContent = `Kapı ${STANDS[b.stand].gate}`;
  const nRows = b.rows.length, maxN = Math.max(...b.rows.map((r) => r.count));
  const W = 400, cx = W / 2, R0 = 320, dr = nRows > 10 ? 8.6 : 16, top = 10;
  const spanBack = Math.min(1.25, (maxN * 8.9) / (R0 + nRows * dr)); // angular span of the back row
  let html = '';
  b.rows.forEach((r, j) => {
    const R = R0 + j * dr, span = spanBack * (r.count / maxN) * ((R0 + nRows * dr) / R);
    const yRow = top + j * dr;
    if (j % 4 === 0 || j === nRows - 1) {
      const a0 = -span / 2 - 0.03, lx = cx + R * Math.sin(a0), ly = yRow + R * (1 - Math.cos(a0));
      html += `<text class="rl" x="${(lx - 4).toFixed(1)}" y="${(ly + 2).toFixed(1)}" text-anchor="end">${j + 1}</text>`;
    }
    for (let k = 0; k < r.count; k++) {
      const i = r.start + k, a = -span / 2 + span * (k + 0.5) / r.count;
      const x = cx + R * Math.sin(a), y = yRow + R * (1 - Math.cos(a));
      const cls = i === ui.pickSeat ? 'sel' : seatSold[i] ? 'sold' : 'free';
      html += `<g class="s ${cls}" data-i="${i}" transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${(a * 57.3).toFixed(1)})"><rect x="-3.2" y="-2.6" width="6.4" height="5.4" rx="1.6"/><rect class="bk" x="-3.2" y="2" width="6.4" height="1.5" rx="0.7"/></g>`;
    }
  });
  const lastR = R0 + (nRows - 1) * dr, H = top + (nRows - 1) * dr + lastR * (1 - Math.cos(spanBack / 2)) + 14;
  seatmap.setAttribute('viewBox', `0 0 ${W} ${H.toFixed(0)}`);
  seatmap.innerHTML = html;
  updateSelCard();
}
function updateSelCard() {
  const i = ui.pickSeat, card = $('#selCard');
  if (i < 0 || !ui.focus) { card.classList.remove('on'); $('#selBtn').disabled = true; return; }
  const b = blocks[seatBlk[i]];
  $('#selRow').textContent = seatRow[i]; $('#selSeat').textContent = seatNum[i]; $('#selPrice').textContent = TL(b.price);
  card.classList.add('on'); $('#selBtn').disabled = false;
}
function pickSeat(i) {
  if (i < 0 || seatSold[i]) { if (i >= 0) toast('Bu koltuk dolu'); return; }
  ui.pickSeat = i; paintDirty = true;
  seatmap.querySelectorAll('g.s.sel').forEach((e) => e.classList.replace('sel', 'free'));
  const el = seatmap.querySelector(`g.s[data-i="${i}"]`); if (el) el.classList.replace('free', 'sel');
  updateSelCard();
}
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
  ui.state = 'overview'; ui.focus = null; ui.selSeat = -1; ui.hover = null; ui.pickSeat = -1; ui.hoverSeat = -1; focusFx.set(null); showSeatTip(-1);
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
  ui.state = 'landing'; ui.focus = null; ui.selSeat = -1; ui.hover = null; ui.pickSeat = -1; focusFx.set(null);
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
  if (ui.pickSeat >= 0 && seatBlk[ui.pickSeat] !== b.index) ui.pickSeat = -1;
  showTooltip(b); focusFx.set(b); buildPanel(b); panel.classList.add('open'); ticketWrap.classList.remove('on'); ticketEl.classList.remove('flip');
  setInsets(); setHint(); paintDirty = true; paintTreads();
  flyTo(() => blockPose(b), 2.4, 6);
  idleT = 0;
}
function selectSeat(i) {
  const b = blocks[seatBlk[i]];
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
    if (ui.selSeat < 0) { $('#tStand').textContent = 'Batı VIP'; $('#tBlock').textContent = '201'; $('#tRow').textContent = 'L'; $('#tSeat').textContent = '12'; $('#tCat').textContent = 'Delux · Kapı A'; $('#tPrice').textContent = TL(CATS['Delux'].price); snapshotReq = { pos: vipPose().pos, target: vipPose().target, fov: 62 }; }
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
let lightsT0 = -1;
function startIntro() {
  ui.state = 'landing'; ui.revealFront = 0;
  const p = landingPose(); cam.pos.copy(p.pos); cam.target.copy(p.target); cam.fov = p.fov;
  setHint();
}

function step(dt) {
  dt = Math.min(dt, 0.1);
  clock.t += dt; idleT += dt;
  // intro lighting + sweep
  hemi.intensity = 0.8; sun.intensity = 2.5;
  const lt = lightsT0 < 0 ? 0 : sstep(0, 2.8, clock.t - lightsT0);
  ROOF.edgeMat.emissiveIntensity = 1.4 * lt; ROOF.lampMat.emissiveIntensity = 3.0 * lt;
  const front = lightsT0 < 0 ? 0 : lerp(20, 210, sstep(0.1, 2.8, clock.t - lightsT0));
  if (front !== ui.revealFront) { ui.revealFront = front; paintDirty = true; }
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
    const W = Math.min(viewCanvas.width, renderer.domElement.width), H = Math.round(W * 9 / 16);
    const sc = new THREE.PerspectiveCamera(snapshotReq.fov, W / H, 0.25, 6000);
    sc.position.copy(snapshotReq.pos); sc.lookAt(snapshotReq.target); sc.updateProjectionMatrix();
    const vw = W / pr, vh = H / pr;
    renderer.setScissorTest(true); renderer.setViewport(0, 0, vw, vh); renderer.setScissor(0, 0, vw, vh);
    const pv = seatPoints.visible; seatPoints.visible = false; seatMeshes.forEach((m) => (m.visible = true));
    renderer.render(scene, sc);
    setSeatLod();
    const ctx = viewCanvas.getContext('2d');
    ctx.drawImage(renderer.domElement, 0, renderer.domElement.height - H, W, H, 0, 0, viewCanvas.width, viewCanvas.height);
    renderer.setScissorTest(false); renderer.setViewport(0, 0, view.W, view.H);
    snapshotReq = null;
  }
  renderer.render(scene, camera);
}

let last = performance.now();
function loop(now) { step((now - last) / 1000); last = now; requestAnimationFrame(loop); }

// boot
paintSeats();
Promise.all([satReady.catch((e) => console.warn('satellite', e)), crestReady]).finally(() => {
  $('#loader').classList.add('done');
  startIntro();
  if (REC) window.__step = (dt) => step(dt);
  else requestAnimationFrame((t) => { last = t; requestAnimationFrame(loop); });
});

// public API (used by the demo recorder and for debugging)
window.__dbg = { renderer, scene, seatMeshes, camera, seat: { x: seatX, y: seatY, z: seatZ } };
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
console.log(`[RAMS Park] ${blocks.length} blok, ${SEATS} koltuk modellendi`);
