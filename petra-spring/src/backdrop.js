// Her ürünün kendine ait hareketli arka planı. 2B tuvalde çizilir, 3B sahnede kameranın arkasındaki düzleme doku olur
// (cam şişeler arkadaki sahneyi gerçekten kırarak gösterir).
// Tema (f.scene): kart kokularında kokuya göre çizilmiş sahne; cam şişe ve oda kokularında markanın kendi
// çekiminden bulanık mekân fotoğrafı + kokuya uygun parçacıklar.
const TAU = Math.PI * 2;
function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
const hex = (h, a = 1) => { const n = parseInt(h.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };

// temalar: zemin renkleri [üst, orta, alt], parçacık türü, parçacık renkleri, ışık
export const THEMES = {
  embers: { g: ['#120726', '#2b0f45', '#5a1a12'], glow: ['#ff7a1a', 0.55, 0.5, 1.05], p: 'ember', c: ['#ffb347', '#ff6a00', '#ffd27a'], n: 90, rays: 0 },
  ocean: { g: ['#04121f', '#0b2c4a', '#0f5770'], glow: ['#5fd3ff', 0.35, 0.6, -0.1], p: 'bubble', c: ['#bdf2ff', '#7fd8ff'], n: 55, rays: 0.5, rayC: '#9fe6ff', waves: '#1d7fa6' },
  silk: { g: ['#2a0204', '#7d0a10', '#b5121a'], glow: ['#ffcf6a', 0.32, 0.55, 0.15], p: 'dust', c: ['#ffd98a', '#fff0c8'], n: 70, rays: 0, silk: ['#d4161f', '#8e0a10', '#ff4a3a'] },
  sun: { g: ['#fff3b0', '#f7cf2a', '#e5a50a'], glow: ['#fffbe6', 0.6, 0.78, 0.0], p: 'petal', c: ['#ffffff', '#fff6d6'], n: 34, rays: 0.9, rayC: '#fffbe0' },
  stars: { g: ['#0b0820', '#231a52', '#3c1d5c'], glow: ['#ff5f6d', 0.3, 0.25, 0.85], p: 'star', c: ['#ffd36b', '#fff3c4'], n: 110, rays: 0, blobs: ['#c2185b', '#5e35b1', '#ff7043'] },
  neon: { g: ['#02100f', '#06302c', '#0b4a43'], glow: ['#5fffd0', 0.3, 0.6, 0.6], p: 'spark', c: ['#b8fff0', '#4fffd0'], n: 60, rays: 0, neon: ['#3dffd0', '#7dfcff', '#a6ff6b'] },
  forest: { g: ['#0b1a0d', '#29401a', '#6b5a24'], glow: ['#ffe39a', 0.5, 0.75, -0.1], p: 'leaf', c: ['#7da33a', '#a8c45a', '#c9a24a'], n: 26, rays: 1, rayC: '#fff0b8' },
  pine: { g: ['#030c06', '#0d2412', '#163a1a'], glow: ['#a6ff3d', 0.25, 0.65, 0.3], p: 'bokeh', c: ['#a6ff3d', '#d6ff8a'], n: 40, rays: 0.4, rayC: '#d9ffb0', fog: 1 },
  snow: { g: ['#3a2410', '#8a6236', '#d8b27a'], glow: ['#fff1d6', 0.45, 0.6, 0.2], p: 'flake', c: ['#ffffff', '#fff3dc'], n: 46, rays: 0.3, rayC: '#fff4dc' },
  fruit: { g: ['#3a1802', '#9a5208', '#e39a18'], glow: ['#ffd27a', 0.45, 0.6, 0.2], p: 'fruit', c: ['#ff5a3c', '#ffb020', '#ff2d6f', '#ffe14d', '#8bd13a'], n: 30, rays: 0.3, rayC: '#fff0c0' },
  velvet: { g: ['#1a0405', '#5a0c10', '#b92a2a'], glow: ['#fff2c8', 0.5, 0.5, -0.2], p: 'star', c: ['#ffd36b', '#fff6d8'], n: 60, rays: 0, spot: '#fff4d6', floor: '#f3e6cf' },
  noir: { g: ['#020202', '#0d0c0a', '#1c1a16'], glow: ['#ffcf6a', 0.4, 0.5, -0.2], p: 'star', c: ['#d9a84a', '#ffe3a0'], n: 70, rays: 0, spot: '#ffdca0', smoke: 1 },
  // fotoğraflı (cam şişe ve oda kokuları): parçacık türü ürüne göre
  photo: { g: ['#000', '#000', '#000'], glow: ['#ffffff', 0.25, 0.55, 0.2], p: 'bokeh', c: ['#ffffff'], n: 34, rays: 0 },
};

export function createBackdrop(W = 1280, H = 720) {
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const x = canvas.getContext('2d');
  let cur = null, curTheme = null, parts = [], photo = null, photoKey = '';
  let fade = 1; // ürün değişince yeni sahne yumuşakça belirir
  let boost = 0, bcx = 0.5, bcy = 0.5, calm = 0; // kokuyu keşfet: ışık patlaması ve sakin, parlak sahne
  let flash = [];
  const prev = document.createElement('canvas'); prev.width = W; prev.height = H;
  const px = prev.getContext('2d');
  const photoCache = new Map();

  function loadPhoto(f) {
    const key = f.bgPhoto ? `${f.bgPhoto}|${(f.bgCrop || []).join(',')}` : '';
    if (key === photoKey) return;
    photoKey = key; photo = null;
    if (!key) return;
    if (photoCache.has(key)) { photo = photoCache.get(key); return; }
    const im = new Image();
    im.onload = () => {
      // bulanık, renkleri ürüne göre ısıtılmış mekân fotoğrafı (bir kez hazırlanır)
      const c = document.createElement('canvas'); c.width = W; c.height = H;
      const g = c.getContext('2d');
      const [cx0, cy0, cw, ch] = f.bgCrop || [0, 0, 1, 1];
      let sw = im.width * cw, sh = im.height * ch, sx = im.width * cx0, sy = im.height * cy0;
      const want = W / H;
      if (sw / sh > want) { const n = sh * want; sx += (sw - n) / 2; sw = n; } else { const n = sw / want; sy += (sh - n) / 2; sh = n; }
      g.filter = `blur(${f.bgBlur ?? 16}px) saturate(1.25)`;
      g.drawImage(im, sx, sy, sw, sh, -40, -40, W + 80, H + 80);
      g.filter = 'none';
      photoCache.set(key, c);
      if (photoKey === key) photo = c;
    };
    im.src = f.bgPhoto;
  }

  function seed(f) {
    const th = THEMES[f.scene] || THEMES.photo;
    const r = rng(f.id.split('').reduce((a, ch) => a * 31 + ch.charCodeAt(0), 7));
    const cols = f.sceneColors || th.c;
    const n = f.sceneN || th.n;
    const kind = f.particle || th.p;
    parts = [];
    for (let i = 0; i < n; i++) {
      parts.push({
        x: r(), y: r(), z: 0.25 + r() * 0.95, // z: yakınlık (büyük = önde, bulanık)
        vx: (r() - 0.5) * 0.02, vy: 0, rot: r() * TAU, vr: (r() - 0.5) * 0.8,
        c: cols[i % cols.length], ph: r() * TAU, s: 0.6 + r() * 0.8, kind,
      });
    }
    return th;
  }

  function setProduct(f) {
    if (cur === f) return;
    if (cur) { px.clearRect(0, 0, W, H); px.drawImage(canvas, 0, 0); fade = 0; }
    cur = f;
    curTheme = seed(f);
    loadPhoto(f);
  }

  /* ---------- çizim yardımcıları ---------- */
  function glow(col, a, gx, gy, rad) {
    const g = x.createRadialGradient(gx * W, gy * H, 0, gx * W, gy * H, rad * W);
    g.addColorStop(0, hex(col, a)); g.addColorStop(1, hex(col, 0));
    x.fillStyle = g; x.fillRect(0, 0, W, H);
  }
  function rays(col, a, t) {
    x.save();
    x.globalCompositeOperation = 'lighter';
    const ox = W * 0.72, oy = -H * 0.15;
    for (let i = 0; i < 7; i++) {
      const ang = 1.75 + i * 0.13 + Math.sin(t * 0.15 + i) * 0.03;
      const len = H * 1.7, wdt = 0.035 + (i % 3) * 0.02;
      const g = x.createLinearGradient(ox, oy, ox + Math.cos(ang) * len, oy + Math.sin(ang) * len);
      const k = a * (0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * 0.4 + i * 1.7)));
      g.addColorStop(0, hex(col, 0.32 * k)); g.addColorStop(1, hex(col, 0));
      x.fillStyle = g;
      x.beginPath(); x.moveTo(ox, oy);
      x.lineTo(ox + Math.cos(ang - wdt) * len, oy + Math.sin(ang - wdt) * len);
      x.lineTo(ox + Math.cos(ang + wdt) * len, oy + Math.sin(ang + wdt) * len);
      x.closePath(); x.fill();
    }
    x.restore();
  }
  function bokeh(px0, py0, rad, col, a) {
    const g = x.createRadialGradient(px0, py0, 0, px0, py0, rad);
    g.addColorStop(0, hex(col, a)); g.addColorStop(0.7, hex(col, a * 0.6)); g.addColorStop(1, hex(col, 0));
    x.fillStyle = g; x.beginPath(); x.arc(px0, py0, rad, 0, TAU); x.fill();
  }
  function starShape(r1, r2) {
    x.beginPath();
    for (let i = 0; i < 10; i++) { const rr = i % 2 ? r2 : r1, a = -Math.PI / 2 + (i * Math.PI) / 5; x.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
    x.closePath();
  }

  /* ---------- parçacıklar ---------- */
  function particles(t, dt) {
    const sp = 1 + boost * 3.5;
    dt *= sp;
    for (const p of parts) {
      const sz = p.z * p.s;
      // hareket
      if (p.kind === 'ember' || p.kind === 'bubble' || p.kind === 'spark') p.y -= dt * (0.025 + 0.05 * p.z);
      else if (p.kind === 'petal' || p.kind === 'leaf' || p.kind === 'flake' || p.kind === 'star') p.y += dt * (0.012 + 0.025 * p.z);
      else p.y += dt * 0.004 * Math.sin(t * 0.3 + p.ph);
      p.x += dt * (p.vx + Math.sin(t * 0.5 + p.ph) * 0.006);
      p.rot += dt * p.vr;
      if (p.y < -0.1) p.y += 1.2; if (p.y > 1.1) p.y -= 1.2;
      if (p.x < -0.1) p.x += 1.2; if (p.x > 1.1) p.x -= 1.2;
      const X = p.x * W, Y = p.y * H;
      const tw = 0.55 + 0.45 * Math.sin(t * 2.2 + p.ph * 3);
      x.save();
      x.translate(X, Y);
      switch (p.kind) {
        case 'ember': {
          x.globalCompositeOperation = 'lighter';
          bokeh(0, 0, 3 + sz * 9, p.c, 0.85 * tw);
          bokeh(0, 0, 1 + sz * 2.2, '#fff4d0', tw);
          break;
        }
        case 'spark': {
          x.globalCompositeOperation = 'lighter';
          x.strokeStyle = hex(p.c, 0.8 * tw); x.lineWidth = 1 + sz;
          x.beginPath(); x.moveTo(0, 0); x.lineTo(Math.sin(p.ph + t) * 8, 10 + sz * 16); x.stroke();
          bokeh(0, 0, 2 + sz * 6, p.c, 0.7 * tw);
          break;
        }
        case 'bubble': {
          const r = 3 + sz * 12;
          x.strokeStyle = hex(p.c, 0.35 + 0.25 * p.z); x.lineWidth = 1.2;
          x.beginPath(); x.arc(0, 0, r, 0, TAU); x.stroke();
          bokeh(-r * 0.35, -r * 0.35, r * 0.35, '#ffffff', 0.5);
          break;
        }
        case 'dust': case 'bokeh': {
          x.globalCompositeOperation = 'lighter';
          bokeh(0, 0, 2 + sz * (p.kind === 'bokeh' ? 26 : 5), p.c, (p.kind === 'bokeh' ? 0.22 : 0.7) * tw);
          break;
        }
        case 'star': {
          x.globalCompositeOperation = 'lighter';
          x.rotate(p.rot * 0.2);
          x.fillStyle = hex(p.c, 0.85 * tw);
          const r = 2 + sz * 6; starShape(r, r * 0.42); x.fill();
          bokeh(0, 0, r * 2.4, p.c, 0.18 * tw);
          break;
        }
        case 'petal': case 'leaf': {
          x.rotate(p.rot);
          const r = 6 + sz * 14;
          x.fillStyle = hex(p.c, p.kind === 'petal' ? 0.85 : 0.8);
          if (p.z > 1) x.filter = `blur(${(p.z - 1) * 10}px)`;
          x.beginPath(); x.ellipse(0, 0, r, r * (p.kind === 'leaf' ? 0.42 : 0.58), 0, 0, TAU); x.fill();
          if (p.kind === 'leaf') { x.strokeStyle = 'rgba(40,60,10,.35)'; x.lineWidth = 1; x.beginPath(); x.moveTo(-r, 0); x.lineTo(r, 0); x.stroke(); }
          break;
        }
        case 'flake': {
          x.rotate(p.rot * 0.3);
          x.strokeStyle = hex(p.c, 0.75); x.lineWidth = 1 + sz * 0.8;
          const r = 4 + sz * 10;
          for (let k = 0; k < 6; k++) {
            x.rotate(TAU / 6); x.beginPath(); x.moveTo(0, 0); x.lineTo(0, r);
            x.moveTo(0, r * 0.55); x.lineTo(r * 0.22, r * 0.75); x.moveTo(0, r * 0.55); x.lineTo(-r * 0.22, r * 0.75); x.stroke();
          }
          break;
        }
        case 'fruit': {
          // meyve dilimi: renkli halka, dilim çizgileri, su damlası parıltısı
          const r = 8 + sz * 20;
          if (p.z > 1) x.filter = `blur(${(p.z - 1) * 12}px)`;
          x.rotate(p.rot * 0.3);
          x.fillStyle = hex(p.c, 0.9); x.beginPath(); x.arc(0, 0, r, 0, TAU); x.fill();
          x.fillStyle = 'rgba(255,255,255,.35)'; x.beginPath(); x.arc(0, 0, r * 0.82, 0, TAU); x.fill();
          x.fillStyle = hex(p.c, 0.85); x.beginPath(); x.arc(0, 0, r * 0.74, 0, TAU); x.fill();
          x.strokeStyle = 'rgba(255,255,255,.55)'; x.lineWidth = 1.5;
          for (let k = 0; k < 8; k++) { x.beginPath(); x.moveTo(0, 0); x.lineTo(Math.cos((k * TAU) / 8) * r * 0.74, Math.sin((k * TAU) / 8) * r * 0.74); x.stroke(); }
          break;
        }
        default: break;
      }
      x.restore();
    }
  }

  /* ---------- sahne ---------- */
  function draw(t, dt) {
    if (!cur) return;
    const th = curTheme;
    x.globalCompositeOperation = 'source-over';
    x.filter = 'none';
    if (photo) {
      x.drawImage(photo, 0, 0);
      // ürün rengiyle hafif renk ve koyulaşma (ürün ve yazılar öne çıksın)
      x.fillStyle = hex(cur.bg, 0.28); x.fillRect(0, 0, W, H);
    } else {
      const g = x.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, th.g[0]); g.addColorStop(0.55, th.g[1]); g.addColorStop(1, th.g[2]);
      x.fillStyle = g; x.fillRect(0, 0, W, H);
    }
    // renkli bulutlar (resim tuvali gibi)
    if (th.blobs) th.blobs.forEach((c, i) => glow(c, 0.28, 0.2 + i * 0.32 + Math.sin(t * 0.1 + i) * 0.04, 0.3 + (i % 2) * 0.4, 0.38));
    // ipek kurdeleler
    if (th.silk) {
      th.silk.forEach((c, i) => {
        x.save();
        const g = x.createLinearGradient(0, 0, W, H);
        g.addColorStop(0, hex(c, 0)); g.addColorStop(0.5, hex(c, 0.55)); g.addColorStop(1, hex(c, 0));
        x.fillStyle = g;
        x.beginPath();
        const yb = H * (0.25 + i * 0.25), amp = H * 0.16;
        x.moveTo(0, yb);
        for (let X = 0; X <= W; X += 20) x.lineTo(X, yb + Math.sin(X / W * 3.2 + t * 0.25 + i * 1.3) * amp);
        for (let X = W; X >= 0; X -= 20) x.lineTo(X, yb + H * 0.14 + Math.sin(X / W * 3.2 + t * 0.25 + i * 1.3 + 0.6) * amp);
        x.closePath(); x.fill();
        x.restore();
      });
    }
    // deniz dalgaları
    if (th.waves) {
      x.save(); x.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 5; i++) {
        x.strokeStyle = hex(th.waves, 0.18 - i * 0.025); x.lineWidth = 30 - i * 4;
        x.beginPath();
        const yb = H * (0.62 + i * 0.08);
        for (let X = 0; X <= W; X += 16) x.lineTo(X, yb + Math.sin(X / W * 6 + t * (0.5 + i * 0.1) + i) * 14);
        x.stroke();
      }
      x.restore();
    }
    // neon çizgiler
    if (th.neon) {
      x.save(); x.globalCompositeOperation = 'lighter'; x.lineCap = 'round';
      th.neon.forEach((c, i) => {
        const yb = H * (0.2 + i * 0.28);
        for (const [lw, a] of [[18, 0.08], [7, 0.25], [2, 0.9]]) {
          x.strokeStyle = hex(c, a * (0.7 + 0.3 * Math.sin(t * 3 + i))); x.lineWidth = lw;
          x.beginPath();
          for (let X = -20; X <= W + 20; X += 40) x.lineTo(X, yb + Math.sin(X / W * 2.4 + t * 0.4 + i * 2) * H * 0.08);
          x.stroke();
        }
      });
      x.restore();
    }
    glow(th.glow[0], th.glow[1], th.glow[2], th.glow[3] + Math.sin(t * 0.3) * 0.01, 0.75);
    if (th.rays) rays(th.rayC || '#ffffff', th.rays, t);
    // spot ışığı ve zemin (sahne)
    if (th.spot) {
      x.save(); x.globalCompositeOperation = 'lighter';
      const g = x.createLinearGradient(W * 0.6, 0, W * 0.6, H);
      g.addColorStop(0, hex(th.spot, 0.5)); g.addColorStop(1, hex(th.spot, 0));
      x.fillStyle = g;
      x.beginPath(); x.moveTo(W * 0.55, -10); x.lineTo(W * 0.65, -10); x.lineTo(W * 0.86, H); x.lineTo(W * 0.34, H); x.closePath(); x.fill();
      const e = x.createRadialGradient(W * 0.6, H * 0.92, 0, W * 0.6, H * 0.92, W * 0.3);
      e.addColorStop(0, hex(th.spot, 0.45)); e.addColorStop(1, hex(th.spot, 0));
      x.fillStyle = e; x.fillRect(0, 0, W, H);
      x.restore();
    }
    if (th.smoke || th.fog) {
      for (let i = 0; i < 4; i++) glow(th.fog ? '#cfe8d0' : '#9a8f80', 0.07, (0.15 + i * 0.27 + t * 0.008 * (i + 1)) % 1.2, 0.55 + Math.sin(t * 0.2 + i) * 0.1, 0.35);
    }
    // kokuyu keşfet: üründen yayılan ışık ve parçacıklar
    if (boost > 0.002 || calm > 0.002) {
      x.save(); x.globalCompositeOperation = 'lighter';
      const gc = th.glow[0] === '#ffffff' ? (cur.sceneColors || ['#ffffff'])[0] : th.glow[0];
      glow(gc, 0.55 * boost + 0.16 * calm, bcx, bcy, 0.25 + 0.35 * (1 - boost));
      const R0 = (1 - boost) * W * 0.55;
      x.strokeStyle = hex(gc, 0.5 * boost); x.lineWidth = 2 + 6 * boost;
      x.beginPath(); x.arc(bcx * W, bcy * H, R0, 0, TAU); x.stroke();
      x.restore();
    }
    flash = flash.filter((q) => (q.life -= dt) > 0);
    for (const q of flash) {
      q.x += q.vx * dt; q.y += q.vy * dt; q.vx *= 0.985; q.vy = q.vy * 0.985 + (q.kind === 'ember' || q.kind === 'spark' || q.kind === 'bubble' ? -0.02 : 0.015) * dt;
      x.save(); x.translate(q.x * W, q.y * H); x.globalAlpha = Math.min(1, q.life * 1.5);
      x.globalCompositeOperation = 'lighter';
      if (q.kind === 'petal' || q.kind === 'leaf') { x.globalCompositeOperation = 'source-over'; x.rotate(q.rot += dt * 2); x.fillStyle = hex(q.c, 0.9); x.beginPath(); x.ellipse(0, 0, q.r * 1.6, q.r * (q.kind === 'leaf' ? 0.6 : 0.9), 0, 0, TAU); x.fill(); }
      else if (q.kind === 'star') { x.rotate(q.rot); x.fillStyle = hex(q.c, 0.95); starShape(q.r * 1.3, q.r * 0.55); x.fill(); bokeh(0, 0, q.r * 3, q.c, 0.25); }
      else if (q.kind === 'flake') { x.strokeStyle = hex(q.c, 0.9); x.lineWidth = 1.4; for (let k = 0; k < 6; k++) { x.rotate(TAU / 6); x.beginPath(); x.moveTo(0, 0); x.lineTo(0, q.r * 1.4); x.stroke(); } }
      else { bokeh(0, 0, q.r * 2.2, q.c, 0.8); bokeh(0, 0, q.r * 0.7, '#ffffff', 0.9); }
      x.restore();
    }
    particles(t, dt);
    boost = Math.max(0, boost - dt * 0.55);
    // kenar koyulaşması
    const v = x.createRadialGradient(W * 0.58, H * 0.5, H * 0.25, W * 0.58, H * 0.5, W * 0.75);
    v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, `rgba(0,0,0,${photo ? 0.55 : 0.45})`);
    x.fillStyle = v; x.fillRect(0, 0, W, H);
    // geçiş
    if (fade < 1) {
      fade = Math.min(1, fade + dt * 1.6);
      x.globalAlpha = 1 - fade; x.drawImage(prev, 0, 0); x.globalAlpha = 1;
    }
  }

  // kokuyu keşfet: (cx, cy) ürünün ekrandaki yeri (0..1)
  function burst(cx = 0.5, cy = 0.5) {
    boost = 1; bcx = cx; bcy = cy;
    const th = curTheme || THEMES.photo;
    const cols = cur.sceneColors || th.c;
    const kind = cur.particle || th.p;
    const r = rng((Math.random() * 1e9) | 0);
    for (let i = 0; i < 70; i++) {
      const a = r() * TAU, v = 0.12 + r() * 0.4;
      flash.push({ x: cx, y: cy, vx: Math.cos(a) * v * (H / W), vy: Math.sin(a) * v, life: 1.6 + r() * 1.8, r: 3 + r() * 9, c: cols[i % cols.length], kind, rot: r() * TAU });
    }
  }
  function setCalm(v) { calm = v ? 1 : 0; }

  return { canvas, setProduct, draw, burst, setCalm, get ready() { return !!cur && (!photoKey || !!photo); } };
}
