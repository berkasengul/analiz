// Her ürünün kendine ait, ferah stüdyo arka planı. 2B tuvalde çizilir, 3B sahnede kameranın arkasındaki düzleme doku olur
// (cam şişeler arkadaki sahneyi gerçekten kırarak gösterir).
// Stüdyo: ürünün renginde pastel duvar ve zemin (yumuşak geçişli fon), pencereden düşen ışık ve kokuya göre gölge
// (yaprak, çiçekli dal, panjur, pencere, su yansıması, güneş), ürünün arkasında yumuşak ışık. Gölgeler rüzgârda hafifçe sallanır.
const TAU = Math.PI * 2;
function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
const hexRgb = (h) => { const n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
const rgba = (h, a = 1) => { const [r, g, b] = hexRgb(h); return `rgba(${r},${g},${b},${a})`; };
const mix = (a, b, t) => { const A = hexRgb(a), B = hexRgb(b); return `#${A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join('')}`; };

// ürün → [duvar, zemin, vurgu, gölge türü, parçacık]
export const STUDIO = {
  'once-vatan': ['#f8e7e1', '#efd3c9', '#c8202a', 'branches', null],
  anka: ['#fbe6d6', '#f3d2bd', '#e8742a', 'palm', null],
  ocean: ['#dff1f6', '#c9e5ee', '#2f8fb8', 'caustic', null],
  gulumse: ['#fcf2cc', '#f5e3a6', '#e8b10a', 'sun', null],
  art: ['#e9e5f7', '#d9d3f0', '#5b4bb0', 'blinds', null],
  electro: ['#dcf3ee', '#c6e9e1', '#2f8f80', 'blinds', null],
  forest: ['#e8eed9', '#d8e2c2', '#7d8f3a', 'palm', null],
  'petra-x': ['#e2f0e0', '#cfe4cc', '#3f7a3a', 'palm', null],
  sirius: ['#f6ecdc', '#ecdcc2', '#b58b4c', 'palm', null],
  free: ['#fde8cf', '#f8d6ad', '#e08a16', 'sun', null],
  'star-light': ['#f7ebdb', '#efdcc3', '#c23a3f', 'window', null],
  'star-dark': ['#e9e6e1', '#dad5ce', '#3a3631', 'blinds', null],
  'cam-aura': ['#f8e0e2', '#efc9cd', '#c0121f', 'window', null],
  'cam-ocean': ['#ddeefb', '#c8e1f5', '#2f8fe0', 'caustic', null],
  'cam-tutti': ['#fdebd8', '#f8d8b8', '#f07a12', 'palm', null],
  'cam-yasemen': ['#eee2f5', '#e0cfec', '#8a2a8c', 'branches', null],
  'cam-forest': ['#e7ecdd', '#d6dfc6', '#58a02a', 'branches', null],
  kerasus: ['#fbe4ec', '#f4cfdb', '#e0507a', 'branches', null],
  miracle: ['#fbecd5', '#f3dbb6', '#d88a1e', 'window', null],
  zeus: ['#fbf4da', '#f2e6bb', '#c9a21c', 'blinds', null],
  keops: ['#fbe2de', '#f3cbc5', '#d8323a', 'branches', null],
  agartha: ['#e1ecf9', '#cddff3', '#2c7fe0', 'caustic', null],
  paris: ['#e5f3e3', '#d2e8cf', '#3faa3a', 'palm', null],
};
const DEFAULT = ['#f3eee6', '#e8dfd1', '#164c43', 'window', null];

export function createBackdrop(W = 1280, H = 720) {
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const x = canvas.getContext('2d');
  let cur = null, st = DEFAULT, gobo = null, parts = [];
  let fade = 1;
  const prev = document.createElement('canvas'); prev.width = W; prev.height = H;
  const px = prev.getContext('2d');
  let boost = 0, bcx = 0.58, bcy = 0.5, calm = 0;
  let flash = [];
  const goboCache = new Map();

  /* ---------- gölge ve ışık desenleri (bir kez çizilir, bulanıklaştırılır) ---------- */
  function makeGobo(kind, seed) {
    const key = `${kind}|${seed}`;
    if (goboCache.has(key)) return goboCache.get(key);
    const c = document.createElement('canvas');
    const GW = Math.round(W * 1.2), GH = Math.round(H * 1.2);
    c.width = GW; c.height = GH;
    const g = c.getContext('2d');
    const r = rng(seed);
    const shadow = document.createElement('canvas'); shadow.width = GW; shadow.height = GH;
    const s = shadow.getContext('2d');
    const light = document.createElement('canvas'); light.width = GW; light.height = GH;
    const l = light.getContext('2d');
    s.fillStyle = '#000'; l.fillStyle = '#fff';
    // pencereden düşen ışık lekesi (eğik, iki kanatlı)
    const windowPatch = (panes, cx, cy, w, h, skew) => {
      l.save(); l.translate(cx, cy); l.transform(1, 0, skew, 1, 0, 0);
      const pw = w / panes;
      for (let i = 0; i < panes; i++) for (let j = 0; j < 2; j++) l.fillRect(-w / 2 + i * pw + 6, -h / 2 + j * (h / 2) + 6, pw - 12, h / 2 - 12);
      l.restore();
    };
    if (kind === 'window') windowPatch(2, GW * 0.68, GH * 0.42, GW * 0.42, GH * 0.62, -0.45);
    if (kind === 'blinds') {
      l.save(); l.translate(GW * 0.62, GH * 0.42); l.rotate(-0.12); l.transform(1, 0, -0.5, 1, 0, 0);
      for (let i = 0; i < 16; i++) l.fillRect(-GW * 0.24, -GH * 0.34 + i * GH * 0.044, GW * 0.48, GH * 0.026);
      l.restore();
    }
    if (kind === 'sun') {
      const grd = l.createLinearGradient(GW * 0.9, 0, GW * 0.3, GH);
      grd.addColorStop(0, 'rgba(255,255,255,1)'); grd.addColorStop(1, 'rgba(255,255,255,0)');
      l.fillStyle = grd;
      for (let i = 0; i < 4; i++) {
        l.beginPath(); const o = i * GW * 0.11;
        l.moveTo(GW * 0.78 + o, -10); l.lineTo(GW * 0.86 + o, -10); l.lineTo(GW * 0.38 + o, GH + 10); l.lineTo(GW * 0.24 + o, GH + 10); l.closePath(); l.fill();
      }
    }
    // gölgeler
    const frond = (bx, by, ang, len, lw) => {
      // palmiye / eğrelti yaprağı: kavisli sap ve iki yanda ince yapraklar
      s.save(); s.translate(bx, by); s.rotate(ang);
      s.lineWidth = lw; s.strokeStyle = '#000'; s.lineCap = 'round';
      s.beginPath(); s.moveTo(0, 0); s.quadraticCurveTo(len * 0.5, len * 0.12, len, len * 0.3); s.stroke();
      const n = 22;
      for (let i = 2; i < n; i++) {
        const t = i / n, px0 = len * t, py0 = len * 0.12 * t * 2 * (1 - t / 2) + len * 0.3 * t * t * 0.4;
        const L = len * 0.36 * Math.sin(Math.PI * Math.min(1, t * 1.15)) * (0.8 + r() * 0.3);
        for (const side of [-1, 1]) {
          s.save(); s.translate(px0, py0); s.rotate(side * (0.9 + r() * 0.25) + 0.15);
          s.beginPath(); s.ellipse(L / 2, 0, L / 2, Math.max(2, L * 0.07), 0, 0, TAU); s.fill(); s.restore();
        }
      }
      s.restore();
    };
    const branch = (bx, by, ang, len, depth, flower) => {
      if (depth <= 0 || len < 14) return;
      const ex = bx + Math.cos(ang) * len, ey = by + Math.sin(ang) * len;
      s.lineWidth = Math.max(1.5, depth * 2.2); s.lineCap = 'round';
      s.beginPath(); s.moveTo(bx, by); s.quadraticCurveTo((bx + ex) / 2 + (r() - 0.5) * 20, (by + ey) / 2 + (r() - 0.5) * 20, ex, ey); s.stroke();
      if (flower && depth <= 2) for (let k = 0; k < 6; k++) { const t = r(); s.beginPath(); s.arc(bx + (ex - bx) * t + (r() - 0.5) * 18, by + (ey - by) * t + (r() - 0.5) * 18, 4 + r() * 7, 0, TAU); s.fill(); }
      else if (depth <= 2) for (let k = 0; k < 4; k++) { const t = r(); s.save(); s.translate(bx + (ex - bx) * t, by + (ey - by) * t); s.rotate(ang + (r() - 0.5) * 2); s.beginPath(); s.ellipse(10, 0, 12, 5, 0, 0, TAU); s.fill(); s.restore(); }
      const n = 2 + (r() > 0.5 ? 1 : 0);
      for (let i = 0; i < n; i++) branch(ex, ey, ang + (r() - 0.5) * 1.3, len * (0.62 + r() * 0.2), depth - 1, flower);
    };
    if (kind === 'palm') {
      frond(-GW * 0.02, GH * 0.05, 0.35, GW * 0.42, 6);
      frond(GW * 0.02, GH * 0.42, -0.12, GW * 0.3, 5);
      frond(GW * 1.02, GH * 0.08, Math.PI - 0.45, GW * 0.38, 6);
      frond(GW * 1.0, GH * 0.5, Math.PI + 0.1, GW * 0.26, 4);
      windowPatch(1, GW * 0.6, GH * 0.4, GW * 0.5, GH * 0.7, -0.3);
    }
    if (kind === 'branches') {
      branch(-10, GH * 0.12, 0.25, GW * 0.2, 5, true);
      branch(GW + 10, GH * 0.06, Math.PI - 0.35, GW * 0.18, 5, true);
      branch(GW * 0.9, -10, Math.PI / 2 + 0.6, GH * 0.22, 4, true);
      windowPatch(2, GW * 0.62, GH * 0.4, GW * 0.44, GH * 0.6, -0.35);
    }
    if (kind === 'blinds' || kind === 'window') {
      // pencerenin önünde bir dal gölgesi (derinlik)
      branch(GW * 1.02, GH * 0.02, Math.PI - 0.5, GW * 0.14, 4, false);
    }
    // birleştir: ışık yumuşak, gölge daha yumuşak (uzaktaki nesne)
    g.filter = 'blur(10px)'; g.globalAlpha = 1; g.drawImage(light, 0, 0);
    g.filter = 'blur(7px)'; g.globalCompositeOperation = 'destination-out'; g.drawImage(shadow, 0, 0);
    const res = { light: c, shadow: (() => { const d = document.createElement('canvas'); d.width = GW; d.height = GH; const q = d.getContext('2d'); q.filter = 'blur(8px)'; q.drawImage(shadow, 0, 0); return d; })(), kind };
    goboCache.set(key, res);
    return res;
  }

  function seedParts(kind, accent, seed) {
    parts = [];
    if (!kind) return;
    const r = rng(seed);
    const cols = kind === 'petal' ? ['#ffffff', mix(accent, '#ffffff', 0.55), mix(accent, '#ffffff', 0.75)] : [mix(accent, '#ffffff', 0.35), mix(accent, '#ffffff', 0.6)];
    for (let i = 0; i < 16; i++) parts.push({ x: r(), y: r(), z: 0.4 + r() * 0.9, rot: r() * TAU, vr: (r() - 0.5) * 0.8, ph: r() * TAU, c: cols[i % cols.length], kind });
  }

  function setProduct(f) {
    if (cur === f) return;
    if (cur) { px.clearRect(0, 0, W, H); px.drawImage(canvas, 0, 0); fade = 0; }
    cur = f;
    st = STUDIO[f.id] || DEFAULT;
    const seed = f.id.split('').reduce((a, ch) => a * 31 + ch.charCodeAt(0), 7) >>> 0;
    gobo = makeGobo(st[3], seed);
    seedParts(st[4], st[2], seed);
  }

  /* ---------- çizim ---------- */
  function draw(t, dt) {
    if (!cur) return;
    const [wall, floor, accent, kind] = st;
    x.globalCompositeOperation = 'source-over'; x.filter = 'none'; x.globalAlpha = 1;
    // fon: duvar → yumuşak kıvrım → zemin
    const g = x.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, mix(wall, '#ffffff', 0.35));
    g.addColorStop(0.5, wall);
    g.addColorStop(0.66, mix(wall, floor, 0.5));
    g.addColorStop(0.8, floor);
    g.addColorStop(1, mix(floor, '#ffffff', 0.25));
    x.fillStyle = g; x.fillRect(0, 0, W, H);
    // pencere ışığı ve gölge: rüzgârda hafifçe sallanır
    if (gobo) {
      const sway = Math.sin(t * 0.45) * 6 + Math.sin(t * 0.9 + 1) * 3;
      const ox = -W * 0.1 + sway, oy = -H * 0.1 + Math.sin(t * 0.35) * 3;
      x.save();
      x.globalCompositeOperation = 'soft-light'; x.globalAlpha = 0.85; x.drawImage(gobo.light, ox, oy);
      x.globalCompositeOperation = 'screen'; x.globalAlpha = 0.32; x.drawImage(gobo.light, ox, oy);
      x.globalCompositeOperation = 'multiply'; x.globalAlpha = 0.07;
      x.drawImage(gobo.shadow, ox + sway * 1.6, oy);
      x.restore();
      // gölge rengi: duvarın koyu tonu (soğuk gri yerine renkli gölge)
      x.save(); x.globalCompositeOperation = 'multiply'; x.globalAlpha = 0.1;
      x.drawImage(gobo.shadow, ox + sway * 1.6 + 8, oy + 6);
      x.restore();
    }
    // su yansıması: duvarda gezen ışık dalgaları
    if (kind === 'caustic') {
      x.save(); x.globalCompositeOperation = 'screen'; x.lineCap = 'round';
      for (let i = 0; i < 26; i++) {
        const yb = H * (0.06 + i * 0.024);
        x.strokeStyle = `rgba(255,255,255,${0.16 + 0.12 * Math.sin(t * 0.8 + i)})`;
        x.lineWidth = 2 + (i % 3);
        x.beginPath();
        for (let X = W * 0.15; X <= W; X += 18) {
          const w = Math.sin(X * 0.012 + t * 0.9 + i * 0.7) * 10 + Math.sin(X * 0.031 - t * 1.3 + i) * 5;
          x.lineTo(X, yb + w);
        }
        x.stroke();
      }
      x.restore();
    }
    // ürünün arkasında yumuşak ışık
    const kx = W * 0.58, ky = H * 0.46;
    const kg = x.createRadialGradient(kx, ky, 0, kx, ky, W * 0.42);
    kg.addColorStop(0, 'rgba(255,255,255,.75)'); kg.addColorStop(0.5, 'rgba(255,255,255,.22)'); kg.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = kg; x.fillRect(0, 0, W, H);
    // zeminde ürün renginde hafif yansıma
    const fg = x.createRadialGradient(kx, H * 0.8, 0, kx, H * 0.8, W * 0.32);
    fg.addColorStop(0, rgba(accent, 0.1)); fg.addColorStop(1, rgba(accent, 0));
    x.fillStyle = fg; x.fillRect(0, 0, W, H);
    // süzülen yapraklar (yalnızca bazı ürünlerde, çok az)
    for (const p of parts) {
      p.y += dt * (0.01 + 0.012 * p.z); p.x += dt * (0.006 + Math.sin(t * 0.4 + p.ph) * 0.006); p.rot += dt * p.vr;
      if (p.y > 1.1) { p.y -= 1.2; p.x = Math.random(); }
      if (p.x > 1.1) p.x -= 1.2;
      x.save(); x.translate(p.x * W, p.y * H); x.rotate(p.rot);
      if (p.z > 1.05) x.filter = `blur(${(p.z - 1) * 10}px)`;
      const rr = 5 + p.z * 9;
      x.fillStyle = rgba(p.c, 0.85);
      x.beginPath(); x.ellipse(0, 0, rr, rr * (p.kind === 'leaf' ? 0.4 : 0.62), 0, 0, TAU); x.fill();
      x.restore();
    }
    // kokuyu keşfet: ürünün arkasından yayılan ışık halkası ve renkli parıltılar
    if (boost > 0.002 || calm > 0.002) {
      const gc = mix(accent, '#ffffff', 0.35);
      const cg = x.createRadialGradient(bcx * W, bcy * H, 0, bcx * W, bcy * H, W * (0.22 + 0.3 * (1 - boost)));
      cg.addColorStop(0, rgba(gc, 0.35 * boost + 0.18 * calm)); cg.addColorStop(1, rgba(gc, 0));
      x.fillStyle = cg; x.fillRect(0, 0, W, H);
      x.strokeStyle = rgba(accent, 0.35 * boost); x.lineWidth = 1.5 + 3 * boost;
      x.beginPath(); x.arc(bcx * W, bcy * H, (1 - boost) * W * 0.5, 0, TAU); x.stroke();
    }
    flash = flash.filter((q) => (q.life -= dt) > 0);
    for (const q of flash) {
      q.x += q.vx * dt; q.y += q.vy * dt; q.vx *= 0.985; q.vy = q.vy * 0.985 + 0.012 * dt; q.rot += dt * 2;
      x.save(); x.translate(q.x * W, q.y * H); x.rotate(q.rot); x.globalAlpha = Math.min(1, q.life * 1.4);
      x.fillStyle = rgba(q.c, 0.9);
      x.beginPath(); x.ellipse(0, 0, q.r * 1.5, q.r * 0.7, 0, 0, TAU); x.fill();
      x.restore();
    }
    boost = Math.max(0, boost - dt * 0.55);
    // hafif kenar yumuşatma (açık tonda)
    const v = x.createRadialGradient(W * 0.55, H * 0.45, H * 0.35, W * 0.55, H * 0.45, W * 0.8);
    v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, rgba(mix(floor, '#000000', 0.5), 0.16));
    x.fillStyle = v; x.fillRect(0, 0, W, H);
    if (fade < 1) {
      fade = Math.min(1, fade + dt * 1.8);
      x.globalAlpha = 1 - fade; x.drawImage(prev, 0, 0); x.globalAlpha = 1;
    }
  }

  function burst(cx = 0.5, cy = 0.5) {
    boost = 1; bcx = cx; bcy = cy;
    const accent = st[2];
    const cols = ['#ffffff', mix(accent, '#ffffff', 0.4), accent];
    const r = rng((Math.random() * 1e9) | 0);
    for (let i = 0; i < 44; i++) {
      const a = r() * TAU, v = 0.1 + r() * 0.32;
      flash.push({ x: cx, y: cy, vx: Math.cos(a) * v * (H / W), vy: Math.sin(a) * v, life: 1.4 + r() * 1.6, r: 3 + r() * 6, c: cols[i % 3], rot: r() * TAU });
    }
  }
  function setCalm(v) { calm = v ? 1 : 0; }

  return { canvas, setProduct, draw, burst, setCalm, get ready() { return !!cur; } };
}
