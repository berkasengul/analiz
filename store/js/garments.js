// Askıdaki pijama takımlarını (üst + alt) canvas üzerinde çizer.
// Çizim alanı 400x640 birimdir; `scale` ile çözünürlük artırılır.

export const GW = 400;
export const GH = 640;

/* ---------- Desen karoları ---------- */

function tile(size, s, draw) {
  const c = document.createElement('canvas');
  c.width = c.height = Math.round(size * s);
  const x = c.getContext('2d');
  x.scale(s, s);
  draw(x, size);
  return c;
}

const rnd = (seed) => () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

function catFace(x, cx, cy, r, fur, ink = '#2b2b33') {
  x.fillStyle = fur;
  x.beginPath();
  x.moveTo(cx - r * 0.9, cy - r * 0.2);
  x.lineTo(cx - r * 0.75, cy - r * 1.2);
  x.lineTo(cx - r * 0.2, cy - r * 0.75);
  x.lineTo(cx + r * 0.2, cy - r * 0.75);
  x.lineTo(cx + r * 0.75, cy - r * 1.2);
  x.lineTo(cx + r * 0.9, cy - r * 0.2);
  x.closePath();
  x.fill();
  x.beginPath();
  x.ellipse(cx, cy, r, r * 0.82, 0, 0, Math.PI * 2);
  x.fill();
  x.fillStyle = '#fff';
  x.beginPath();
  x.arc(cx - r * 0.38, cy - r * 0.1, r * 0.24, 0, 7);
  x.arc(cx + r * 0.38, cy - r * 0.1, r * 0.24, 0, 7);
  x.fill();
  x.fillStyle = ink;
  x.beginPath();
  x.arc(cx - r * 0.36, cy - r * 0.08, r * 0.12, 0, 7);
  x.arc(cx + r * 0.4, cy - r * 0.08, r * 0.12, 0, 7);
  x.fill();
  x.fillStyle = '#f08fa0';
  x.beginPath();
  x.arc(cx, cy + r * 0.22, r * 0.09, 0, 7);
  x.fill();
  x.strokeStyle = ink;
  x.lineWidth = r * 0.06;
  x.beginPath();
  x.moveTo(cx - r * 1.05, cy + r * 0.2); x.lineTo(cx - r * 0.55, cy + r * 0.28);
  x.moveTo(cx + r * 1.05, cy + r * 0.2); x.lineTo(cx + r * 0.55, cy + r * 0.28);
  x.stroke();
}

function truck(x, cx, cy, k, body) {
  x.save();
  x.translate(cx, cy);
  x.scale(k, k);
  x.fillStyle = body;
  x.fillRect(-10, -6, 14, 8);
  x.fillRect(4, -9, 7, 11);
  x.fillStyle = '#ffd34d';
  x.beginPath();
  x.moveTo(-10, -6); x.lineTo(-16, -12); x.lineTo(-12, -14); x.lineTo(-6, -7);
  x.fill();
  x.fillStyle = '#9fd3ff';
  x.fillRect(6, -7, 4, 4);
  x.fillStyle = '#26262c';
  x.beginPath();
  x.arc(-6, 3, 3, 0, 7); x.arc(7, 3, 3, 0, 7);
  x.fill();
  x.restore();
}

function dino(x, cx, cy, k, flip, col) {
  x.save();
  x.translate(cx, cy);
  x.scale(flip ? -k : k, k);
  x.fillStyle = col;
  x.beginPath();
  x.moveTo(-22, 4);
  x.quadraticCurveTo(-12, -2, -4, -4);
  x.quadraticCurveTo(2, -16, 10, -18);
  x.quadraticCurveTo(18, -20, 18, -14);
  x.quadraticCurveTo(14, -10, 10, -10);
  x.quadraticCurveTo(10, -2, 8, 4);
  x.lineTo(8, 12); x.lineTo(4, 12); x.lineTo(3, 6);
  x.lineTo(-4, 6); x.lineTo(-5, 12); x.lineTo(-9, 12); x.lineTo(-9, 6);
  x.quadraticCurveTo(-16, 7, -22, 4);
  x.fill();
  x.fillStyle = 'rgba(255,255,255,.85)';
  x.beginPath(); x.arc(13, -15, 1.4, 0, 7); x.fill();
  x.restore();
}

function car(x, cx, cy, k, rot) {
  x.save();
  x.translate(cx, cy);
  x.rotate(rot);
  x.scale(k, k);
  x.fillStyle = '#4a4e57';
  x.beginPath();
  x.roundRect(-16, -7, 32, 12, 4);
  x.fill();
  x.beginPath();
  x.roundRect(-8, -13, 16, 8, 3);
  x.fill();
  x.fillStyle = '#c9ccd2';
  x.fillRect(-6, -11, 5, 5);
  x.fillRect(1, -11, 5, 5);
  x.fillStyle = '#25272c';
  x.beginPath();
  x.arc(-9, 6, 4, 0, 7); x.arc(9, 6, 4, 0, 7);
  x.fill();
  x.fillStyle = '#8b8f97';
  x.beginPath();
  x.arc(-9, 6, 1.6, 0, 7); x.arc(9, 6, 1.6, 0, 7);
  x.fill();
  x.restore();
}

function bear(x, cx, cy, r) {
  x.fillStyle = '#9a6a45';
  x.beginPath();
  x.arc(cx - r * 0.75, cy - r * 0.7, r * 0.4, 0, 7);
  x.arc(cx + r * 0.75, cy - r * 0.7, r * 0.4, 0, 7);
  x.fill();
  x.beginPath(); x.arc(cx, cy, r, 0, 7); x.fill();
  x.fillStyle = '#d9b58f';
  x.beginPath(); x.ellipse(cx, cy + r * 0.3, r * 0.45, r * 0.34, 0, 0, 7); x.fill();
  x.fillStyle = '#2a1d16';
  x.beginPath();
  x.arc(cx - r * 0.38, cy - r * 0.15, r * 0.11, 0, 7);
  x.arc(cx + r * 0.38, cy - r * 0.15, r * 0.11, 0, 7);
  x.arc(cx, cy + r * 0.2, r * 0.13, 0, 7);
  x.fill();
}

function plaid(x, n, bg, bands) {
  x.fillStyle = bg;
  x.fillRect(0, 0, n, n);
  for (const b of bands) {
    x.fillStyle = b.c;
    x.fillRect(b.p, 0, b.w, n);
    x.fillRect(0, b.p, n, b.w);
  }
}

const PATTERNS = {
  cats(x, n) {
    const furs = [['#7cc0e8', '#f2a541'], ['#f2c84b', '#8fa3b5'], ['#ef8a5b', '#9ad0c2'], ['#9aa3ad', '#e86e5f'], ['#5fb3a8', '#f6d36b'], ['#e9705f', '#7cc0e8']];
    const c = n / 2;
    let i = 0;
    for (let r = 0; r < 2; r++) for (let q = 0; q < 2; q++) {
      const [bg, fur] = furs[(i++ + r * 3) % furs.length];
      x.fillStyle = bg;
      x.fillRect(q * c, r * c, c, c);
      catFace(x, q * c + c / 2, r * c + c / 2 + 3, c * 0.3, fur);
    }
  },
  checker(x, n) {
    const c = n / 4;
    for (let r = 0; r < 4; r++) for (let q = 0; q < 4; q++) {
      x.fillStyle = (r + q) % 2 ? '#ffffff' : '#2d55a8';
      x.fillRect(q * c, r * c, c, c);
    }
    truck(x, n * 0.28, n * 0.32, 1.1, '#f07a2a');
    truck(x, n * 0.74, n * 0.78, 1.0, '#e5483f');
  },
  dinos(x, n) {
    x.fillStyle = '#f1ece2';
    x.fillRect(0, 0, n, n);
    const r = rnd(7);
    x.fillStyle = 'rgba(120,130,150,.35)';
    for (let i = 0; i < 26; i++) {
      x.beginPath(); x.arc(r() * n, r() * n, r() * 1.6 + 0.4, 0, 7); x.fill();
    }
    dino(x, n * 0.3, n * 0.3, 1.25, false, '#4f7fc4');
    dino(x, n * 0.75, n * 0.78, 1.1, true, '#3e6aa8');
    dino(x, n * 0.78, n * 0.22, 0.7, true, '#8f9aa8');
  },
  cars(x, n) {
    x.fillStyle = '#f2eee6';
    x.fillRect(0, 0, n, n);
    car(x, n * 0.28, n * 0.3, 1.05, -0.4);
    car(x, n * 0.75, n * 0.72, 1.0, 0.5);
    car(x, n * 0.78, n * 0.18, 0.6, 2.4);
    x.strokeStyle = 'rgba(74,78,87,.5)';
    x.lineWidth = 1.2;
    x.beginPath();
    x.arc(n * 0.2, n * 0.8, 5, 0, 7);
    x.moveTo(n * 0.5, n * 0.45); x.lineTo(n * 0.56, n * 0.5);
    x.stroke();
  },
  bearplaid(x, n) {
    plaid(x, n, '#e6dccd', [
      { p: 0, w: 6, c: 'rgba(130,100,75,.55)' },
      { p: 9, w: 2, c: 'rgba(255,255,255,.8)' },
      { p: n / 2, w: 10, c: 'rgba(160,130,105,.35)' },
      { p: n / 2 + 14, w: 2, c: 'rgba(110,80,60,.5)' },
    ]);
    bear(x, n * 0.3, n * 0.36, 9);
    bear(x, n * 0.78, n * 0.82, 8);
  },
  planets(x, n) {
    x.fillStyle = '#1d2547';
    x.fillRect(0, 0, n, n);
    const r = rnd(3);
    x.fillStyle = 'rgba(255,255,255,.8)';
    for (let i = 0; i < 18; i++) {
      x.beginPath(); x.arc(r() * n, r() * n, r() * 1 + 0.4, 0, 7); x.fill();
    }
    const pl = [[0.27, 0.3, 8, '#e98a63'], [0.75, 0.7, 7, '#7cc4ef'], [0.72, 0.22, 4, '#f3cf6a'], [0.25, 0.8, 5, '#d77fd0']];
    pl.forEach(([px, py, pr, col], i) => {
      x.fillStyle = col;
      x.beginPath(); x.arc(px * n, py * n, pr, 0, 7); x.fill();
      if (i % 2 === 0) {
        x.strokeStyle = 'rgba(255,255,255,.75)';
        x.lineWidth = 1.4;
        x.beginPath(); x.ellipse(px * n, py * n, pr * 1.7, pr * 0.45, -0.35, 0, 7); x.stroke();
      }
    });
  },
  gingham(x, n) {
    plaid(x, n, '#ffffff', [
      { p: 0, w: n / 4, c: 'rgba(120,165,220,.5)' },
      { p: n / 2, w: n / 4, c: 'rgba(120,165,220,.5)' },
    ]);
  },
  tartan(x, n) {
    plaid(x, n, '#c42127', [
      { p: 0, w: n * 0.22, c: 'rgba(20,18,22,.75)' },
      { p: n * 0.5, w: n * 0.08, c: 'rgba(20,18,22,.6)' },
      { p: n * 0.68, w: 2, c: 'rgba(255,255,255,.75)' },
      { p: n * 0.32, w: 1.5, c: 'rgba(255,220,120,.6)' },
    ]);
  },
};

const PATTERN_SIZE = { cats: 120, checker: 96, dinos: 110, cars: 100, bearplaid: 64, planets: 90, gingham: 22, tartan: 54 };

function makePattern(ctx, name, s) {
  const size = PATTERN_SIZE[name] || 80;
  const t = tile(size, s, PATTERNS[name]);
  const pat = ctx.createPattern(t, 'repeat');
  pat.setTransform(new DOMMatrix().scale(size / t.width));
  return pat;
}

/* ---------- Kalıplar ---------- */

function topPath() {
  const p = new Path2D();
  p.moveTo(165, 78);
  p.quadraticCurveTo(132, 78, 106, 90);
  p.quadraticCurveTo(76, 104, 66, 150);
  p.lineTo(48, 312);
  p.lineTo(90, 318);
  p.quadraticCurveTo(101, 240, 111, 182);
  p.lineTo(110, 338);
  p.lineTo(290, 338);
  p.lineTo(289, 182);
  p.quadraticCurveTo(299, 240, 310, 318);
  p.lineTo(352, 312);
  p.lineTo(334, 150);
  p.quadraticCurveTo(324, 104, 294, 90);
  p.quadraticCurveTo(268, 78, 235, 78);
  p.quadraticCurveTo(200, 102, 165, 78);
  p.closePath();
  return p;
}

function pantsPath(jogger) {
  const p = new Path2D();
  if (jogger) {
    p.moveTo(130, 300); p.lineTo(270, 300);
    p.quadraticCurveTo(284, 450, 280, 596);
    p.lineTo(278, 618); p.lineTo(212, 618); p.lineTo(212, 596);
    p.quadraticCurveTo(206, 500, 200, 420);
    p.quadraticCurveTo(194, 500, 188, 596);
    p.lineTo(188, 618); p.lineTo(122, 618); p.lineTo(120, 596);
    p.quadraticCurveTo(116, 450, 130, 300);
  } else {
    p.moveTo(130, 300); p.lineTo(270, 300);
    p.lineTo(288, 618); p.lineTo(210, 620);
    p.quadraticCurveTo(205, 500, 200, 420);
    p.quadraticCurveTo(195, 500, 190, 620);
    p.lineTo(112, 618);
    p.lineTo(130, 300);
  }
  p.closePath();
  return p;
}

function shade(ctx, path, x0, x1, y0, y1) {
  ctx.save();
  ctx.clip(path);
  const g = ctx.createLinearGradient(x0, 0, x1, 0);
  g.addColorStop(0, 'rgba(0,0,0,.22)');
  g.addColorStop(0.18, 'rgba(0,0,0,.04)');
  g.addColorStop(0.5, 'rgba(255,255,255,.07)');
  g.addColorStop(0.82, 'rgba(0,0,0,.04)');
  g.addColorStop(1, 'rgba(0,0,0,.24)');
  ctx.fillStyle = g;
  ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
  const v = ctx.createLinearGradient(0, y0, 0, y1);
  v.addColorStop(0, 'rgba(255,255,255,.08)');
  v.addColorStop(1, 'rgba(0,0,0,.1)');
  ctx.fillStyle = v;
  ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
  ctx.restore();
}

function folds(ctx, path, lines) {
  ctx.save();
  ctx.clip(path);
  ctx.lineCap = 'round';
  for (const [x0, y0, x1, y1, dark] of lines) {
    ctx.strokeStyle = dark ? 'rgba(0,0,0,.13)' : 'rgba(255,255,255,.12)';
    ctx.lineWidth = dark ? 5 : 4;
    ctx.filter = 'blur(2.5px)';
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.quadraticCurveTo((x0 + x1) / 2 + 4, (y0 + y1) / 2, x1, y1);
    ctx.stroke();
  }
  ctx.filter = 'none';
  ctx.restore();
}

function band(ctx, pts, color, ribbed) {
  ctx.save();
  const p = new Path2D();
  p.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) p.lineTo(pts[i][0], pts[i][1]);
  p.closePath();
  ctx.fillStyle = color;
  ctx.fill(p);
  ctx.clip(p);
  if (ribbed) {
    ctx.strokeStyle = 'rgba(0,0,0,.09)';
    ctx.lineWidth = 1;
    const xs = pts.map((q) => q[0]);
    for (let x = Math.min(...xs) - 20; x < Math.max(...xs) + 20; x += 3.2) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + 2, 700); ctx.stroke();
    }
  }
  ctx.fillStyle = 'rgba(0,0,0,.06)';
  ctx.fill(p);
  ctx.restore();
}

function hanger(ctx) {
  // Kanca
  ctx.strokeStyle = '#9ca0a8';
  ctx.lineWidth = 3.2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(200, 74);
  ctx.lineTo(200, 22);
  ctx.arc(188, 22, 12, 0, Math.PI, true);
  ctx.stroke();
  // Ahşap askı (yaka açıklığında görünen kısım)
  const g = ctx.createLinearGradient(0, 70, 0, 92);
  g.addColorStop(0, '#b77b4a');
  g.addColorStop(1, '#7f4f2c');
  ctx.strokeStyle = g;
  ctx.lineWidth = 9;
  ctx.beginPath();
  ctx.moveTo(150, 92);
  ctx.quadraticCurveTo(200, 66, 250, 92);
  ctx.stroke();
}

/* ---------- Ana çizim ---------- */

export function drawSet(ctx, p, side = 'front', s = 1, opts = {}) {
  const hang = opts.hanger !== false;
  const jogger = p.line === 'interlok';
  const shirt = p.style === 'shirt';
  const pat = makePattern(ctx, p.pattern, s);
  const top = topPath();
  const pants = pantsPath(jogger);

  if (hang) ctx.clearRect(0, 0, GW, GH);

  // Alt
  ctx.save();
  ctx.shadowColor = 'rgba(30,30,40,.18)';
  ctx.shadowBlur = 22;
  ctx.shadowOffsetY = 10;
  ctx.fillStyle = pat;
  ctx.fill(pants);
  ctx.restore();
  shade(ctx, pants, 112, 288, 300, 620);
  folds(ctx, pants, [[200, 430, 202, 610, 1], [150, 360, 146, 600, 0], [252, 360, 256, 600, 0], [170, 330, 160, 420, 1]]);
  ctx.save();
  ctx.clip(pants);
  ctx.strokeStyle = 'rgba(0,0,0,.16)';
  ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.moveTo(200, 340); ctx.lineTo(200, 420); ctx.stroke();
  const sh = ctx.createLinearGradient(0, 336, 0, 372);
  sh.addColorStop(0, 'rgba(0,0,0,.28)');
  sh.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = sh;
  ctx.fillRect(100, 336, 200, 40);
  ctx.restore();
  if (jogger) {
    band(ctx, [[120, 596], [188, 596], [188, 618], [122, 618]], p.trim, true);
    band(ctx, [[212, 596], [280, 596], [278, 618], [212, 618]], p.trim, true);
  } else {
    ctx.strokeStyle = p.trim;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(114, 610); ctx.lineTo(189, 612);
    ctx.moveTo(211, 612); ctx.lineTo(286, 610);
    ctx.stroke();
  }

  // Üst
  if (side === 'front' && hang) hanger(ctx);
  ctx.save();
  ctx.shadowColor = 'rgba(30,30,40,.2)';
  ctx.shadowBlur = 24;
  ctx.shadowOffsetY = 10;
  ctx.fillStyle = pat;
  ctx.fill(top);
  ctx.restore();
  shade(ctx, top, 48, 352, 78, 338);
  folds(ctx, top, [[112, 190, 104, 300, 1], [288, 190, 296, 300, 1], [160, 200, 150, 330, 0], [240, 210, 252, 330, 0], [75, 170, 62, 300, 0], [325, 170, 338, 300, 0]]);

  // Kol ayrımı gölgesi
  ctx.save();
  ctx.clip(top);
  ctx.strokeStyle = 'rgba(0,0,0,.22)';
  ctx.lineWidth = 3;
  ctx.filter = 'blur(1.5px)';
  ctx.beginPath();
  ctx.moveTo(111, 182); ctx.quadraticCurveTo(101, 240, 90, 318);
  ctx.moveTo(289, 182); ctx.quadraticCurveTo(299, 240, 310, 318);
  ctx.stroke();
  ctx.filter = 'none';
  ctx.restore();

  if (!shirt) {
    band(ctx, [[50, 296], [91, 302], [90, 318], [48, 312]], p.trim, true);
    band(ctx, [[309, 302], [350, 296], [352, 312], [310, 318]], p.trim, true);
    band(ctx, [[110, 324], [290, 324], [290, 338], [110, 338]], p.trim, true);
    // Yaka
    ctx.save();
    ctx.lineWidth = 10;
    ctx.strokeStyle = p.trim;
    ctx.beginPath();
    ctx.moveTo(163, 80);
    ctx.quadraticCurveTo(200, side === 'front' ? 106 : 88, 237, 80);
    ctx.stroke();
    ctx.restore();
  } else {
    // Biyeli bilekler
    ctx.strokeStyle = p.trim;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(50, 304); ctx.lineTo(90, 310);
    ctx.moveTo(310, 310); ctx.lineTo(350, 304);
    ctx.stroke();
    if (side === 'front') {
      // Patlet + düğmeler
      ctx.strokeStyle = 'rgba(0,0,0,.2)';
      ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(207, 104); ctx.lineTo(207, 338); ctx.stroke();
      for (const y of [136, 176, 216, 256, 296]) {
        ctx.fillStyle = '#f7f4ee';
        ctx.beginPath(); ctx.arc(201, y, 4.2, 0, 7); ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,.25)';
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }
      // Göğüs cebi
      ctx.save();
      ctx.strokeStyle = p.trim;
      ctx.lineWidth = 2;
      ctx.strokeRect(232, 140, 32, 34);
      ctx.restore();
      // Yaka kanatları
      for (const dir of [-1, 1]) {
        const cp = new Path2D();
        cp.moveTo(200 + dir * 36, 76);
        cp.lineTo(200 + dir * 2, 106);
        cp.lineTo(200 + dir * 26, 128);
        cp.lineTo(200 + dir * 50, 88);
        cp.closePath();
        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,.25)';
        ctx.shadowBlur = 5;
        ctx.shadowOffsetY = 2;
        ctx.fillStyle = pat;
        ctx.fill(cp);
        ctx.restore();
        ctx.strokeStyle = p.trim;
        ctx.lineWidth = 2.5;
        ctx.stroke(cp);
      }
    } else {
      ctx.strokeStyle = p.trim;
      ctx.lineWidth = 6;
      ctx.beginPath(); ctx.moveTo(165, 80); ctx.quadraticCurveTo(200, 90, 235, 80); ctx.stroke();
    }
  }

  if (side === 'back' && hang) {
    ctx.strokeStyle = '#9ca0a8';
    ctx.lineWidth = 3.2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(200, 78); ctx.lineTo(200, 22); ctx.arc(188, 22, 12, 0, Math.PI, true);
    ctx.stroke();
  }
}

/* ---------- Yardımcılar ---------- */

const imageCache = new Map();

export function loadProductImage(p) {
  if (!p.image) return Promise.resolve(null);
  if (!imageCache.has(p.image)) {
    imageCache.set(p.image, new Promise((res) => {
      const img = new Image();
      img.onload = () => res(img);
      img.onerror = () => res(null);
      img.src = p.image;
    }));
  }
  return imageCache.get(p.image);
}

export function renderSet(p, side = 'front', s = 1, img = null) {
  const c = document.createElement('canvas');
  c.width = Math.round(GW * s);
  c.height = Math.round(GH * s);
  const ctx = c.getContext('2d');
  ctx.scale(s, s);
  if (img) {
    const k = Math.min(GW / img.width, GH / img.height);
    const w = img.width * k;
    const h = img.height * k;
    ctx.drawImage(img, (GW - w) / 2, (GH - h) / 2, w, h);
  } else {
    drawSet(ctx, p, side, s);
  }
  return c;
}

// Tıklama testleri için düşük çözünürlüklü saydamlık maskesi
export function alphaMask(canvas, w = 80) {
  const h = Math.round((w * canvas.height) / canvas.width);
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const x = c.getContext('2d');
  x.drawImage(canvas, 0, 0, w, h);
  const d = x.getImageData(0, 0, w, h).data;
  const m = new Uint8Array(w * h);
  for (let i = 0; i < m.length; i++) m[i] = d[i * 4 + 3] > 40 ? 1 : 0;
  return { w, h, m, hit: (u, v) => m[Math.min(h - 1, Math.floor((1 - v) * h)) * w + Math.min(w - 1, Math.floor(u * w))] === 1 };
}

const thumbs = new Map();
export function thumb(p, s = 0.5) {
  if (p.image) return p.image;
  const k = `${p.id}@${s}`;
  if (!thumbs.has(k)) thumbs.set(k, renderSet(p, 'front', s).toDataURL('image/png'));
  return thumbs.get(k);
}

/* ---------- Model (pijamayı giyen çocuk) ---------- */

export const MW = 400;
export const MH = 840;
const DY = 172; // takımın model üzerindeki dikey konumu

function shadeColor(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const f = (c) => Math.max(0, Math.min(255, Math.round(c + amt * 255)));
  return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`;
}

function backHair(ctx, m) {
  if (m.style !== 'long') return;
  ctx.fillStyle = shadeColor(m.hair, -0.05);
  ctx.beginPath();
  ctx.moveTo(128, 130);
  ctx.quadraticCurveTo(116, 260, 136, 330);
  ctx.quadraticCurveTo(200, 350, 264, 330);
  ctx.quadraticCurveTo(284, 260, 272, 130);
  ctx.closePath();
  ctx.fill();
}

function head(ctx, m) {
  const skin = m.skin;
  // Boyun
  ctx.fillStyle = shadeColor(skin, -0.06);
  ctx.beginPath();
  ctx.roundRect(181, 196, 38, 50, 12);
  ctx.fill();
  // Saç (arka hacim)
  ctx.fillStyle = m.hair;
  ctx.beginPath();
  ctx.ellipse(200, 122, 76, 74, 0, 0, Math.PI * 2);
  ctx.fill();
  if (m.style === 'curly') {
    for (let i = 0; i < 11; i++) {
      const a = Math.PI * (1.02 + (i / 10) * 0.96);
      ctx.beginPath();
      ctx.arc(200 + Math.cos(a) * 74, 124 + Math.sin(a) * 72, 17, 0, 7);
      ctx.fill();
    }
  }
  // Kulaklar
  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.ellipse(135, 150, 13, 17, 0, 0, 7);
  ctx.ellipse(265, 150, 13, 17, 0, 0, 7);
  ctx.fill();
  // Yüz
  const g = ctx.createRadialGradient(186, 132, 10, 200, 150, 80);
  g.addColorStop(0, shadeColor(skin, 0.05));
  g.addColorStop(1, shadeColor(skin, -0.05));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(200, 148, 64, 68, 0, 0, Math.PI * 2);
  ctx.fill();
  // Ön saç / perçem
  ctx.fillStyle = m.hair;
  ctx.beginPath();
  if (m.style === 'long') {
    ctx.moveTo(134, 150);
    ctx.quadraticCurveTo(132, 66, 200, 62);
    ctx.quadraticCurveTo(268, 66, 266, 150);
    ctx.quadraticCurveTo(254, 112, 214, 104);
    ctx.quadraticCurveTo(206, 118, 196, 104);
    ctx.quadraticCurveTo(156, 108, 134, 150);
  } else if (m.style === 'curly') {
    ctx.moveTo(136, 132);
    ctx.quadraticCurveTo(136, 64, 200, 60);
    ctx.quadraticCurveTo(264, 64, 264, 132);
    for (let i = 0; i <= 6; i++) {
      const x = 264 - i * 21.3;
      ctx.quadraticCurveTo(x - 10, 92 + (i % 2) * 6, x - 21, 112 + ((i + 1) % 2) * 6);
    }
  } else {
    ctx.moveTo(136, 134);
    ctx.quadraticCurveTo(138, 62, 200, 60);
    ctx.quadraticCurveTo(262, 62, 264, 134);
    ctx.quadraticCurveTo(252, 104, 230, 104);
    ctx.quadraticCurveTo(216, 90, 198, 104);
    ctx.quadraticCurveTo(180, 92, 162, 108);
    ctx.quadraticCurveTo(146, 112, 136, 134);
  }
  ctx.closePath();
  ctx.fill();
  // Saç parlaması
  ctx.strokeStyle = 'rgba(255,255,255,.18)';
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(200, 120, 56, Math.PI * 1.2, Math.PI * 1.45);
  ctx.stroke();
  if (m.bow) {
    ctx.fillStyle = m.bow;
    ctx.beginPath();
    ctx.moveTo(244, 74); ctx.lineTo(228, 56); ctx.lineTo(226, 88); ctx.closePath();
    ctx.moveTo(244, 74); ctx.lineTo(262, 58); ctx.lineTo(264, 92); ctx.closePath();
    ctx.fill();
    ctx.fillStyle = shadeColor(m.bow, -0.12);
    ctx.beginPath(); ctx.arc(245, 74, 7, 0, 7); ctx.fill();
  }
  // Kaşlar
  ctx.strokeStyle = shadeColor(m.hair, -0.1);
  ctx.lineWidth = 3.4;
  ctx.beginPath();
  ctx.moveTo(165, 128); ctx.quadraticCurveTo(176, 122, 187, 127);
  ctx.moveTo(213, 127); ctx.quadraticCurveTo(224, 122, 235, 128);
  ctx.stroke();
  // Gözler
  for (const x of [176, 224]) {
    ctx.fillStyle = '#2a2230';
    ctx.beginPath(); ctx.ellipse(x, 149, 8, 10.5, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(x + 2.6, 145, 3.2, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.arc(x - 2.4, 153, 1.4, 0, 7); ctx.fill();
  }
  // Yanaklar
  ctx.fillStyle = 'rgba(245,120,150,.32)';
  ctx.beginPath();
  ctx.ellipse(158, 172, 13, 8, 0, 0, 7);
  ctx.ellipse(242, 172, 13, 8, 0, 0, 7);
  ctx.fill();
  // Burun + gülümseme
  ctx.strokeStyle = shadeColor(skin, -0.2);
  ctx.lineWidth = 2.6;
  ctx.beginPath(); ctx.moveTo(198, 160); ctx.quadraticCurveTo(202, 166, 197, 168); ctx.stroke();
  ctx.fillStyle = '#9b3b4a';
  ctx.beginPath();
  ctx.moveTo(184, 180);
  ctx.quadraticCurveTo(200, 200, 216, 180);
  ctx.quadraticCurveTo(200, 186, 184, 180);
  ctx.fill();
  ctx.fillStyle = '#f08a9c';
  ctx.beginPath(); ctx.ellipse(200, 190, 6, 3, 0, 0, 7); ctx.fill();
}

function hands(ctx, skin) {
  ctx.fillStyle = skin;
  for (const [x, r] of [[67, -0.15], [333, 0.15]]) {
    ctx.save();
    ctx.translate(x, DY + 330);
    ctx.rotate(r);
    ctx.beginPath(); ctx.ellipse(0, 0, 15, 19, 0, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.ellipse(r > 0 ? -11 : 11, -4, 6, 9, r > 0 ? -0.6 : 0.6, 0, 7); ctx.fill();
    ctx.restore();
  }
}

function slippers(ctx, m, jogger) {
  const y = DY + (jogger ? 622 : 624);
  for (const x of [154, 246]) {
    ctx.fillStyle = 'rgba(0,0,0,.12)';
    ctx.beginPath(); ctx.ellipse(x, y + 18, 40, 7, 0, 0, 7); ctx.fill();
    ctx.fillStyle = m.slippers;
    ctx.beginPath(); ctx.ellipse(x + (x < 200 ? -6 : 6), y + 6, 36, 15, 0, 0, 7); ctx.fill();
    ctx.fillStyle = shadeColor(m.slippers, 0.18);
    ctx.beginPath(); ctx.ellipse(x + (x < 200 ? -14 : 14), y + 1, 13, 8, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(x + (x < 200 ? -20 : 20), y - 2, 6, 0, 7); ctx.fill();
  }
}

export function drawModel(ctx, p, side = 'front', s = 1) {
  const m = p.model;
  const jogger = p.line === 'interlok';
  ctx.clearRect(0, 0, MW, MH);
  ctx.save(); ctx.translate(0, 20); backHair(ctx, m); ctx.restore();
  // Ayaklar ve eller giysinin altında kalır
  ctx.save();
  ctx.translate(0, 0);
  slippers(ctx, m, jogger);
  hands(ctx, m.skin);
  ctx.restore();
  if (side === 'front') {
    ctx.save();
    ctx.fillStyle = shadeColor(m.skin, -0.06);
    ctx.beginPath(); ctx.roundRect(181, 214, 38, 50, 12); ctx.fill();
    ctx.restore();
  }
  ctx.save();
  ctx.translate(0, DY);
  drawSet(ctx, p, side, s, { hanger: false });
  ctx.restore();
  ctx.save();
  ctx.translate(0, 20);
  if (side === 'front') {
    head(ctx, m);
  } else {
    ctx.fillStyle = m.hair;
    ctx.beginPath(); ctx.ellipse(135, 150, 13, 17, 0, 0, 7); ctx.fill();
    ctx.fillStyle = m.skin;
    ctx.beginPath(); ctx.ellipse(135, 150, 13, 17, 0, 0, 7); ctx.ellipse(265, 150, 13, 17, 0, 0, 7); ctx.fill();
    ctx.fillStyle = m.hair;
    ctx.beginPath(); ctx.ellipse(200, 128, 74, 80, 0, 0, Math.PI * 2); ctx.fill();
    if (m.style === 'long') {
      ctx.beginPath(); ctx.roundRect(128, 130, 144, 200, [0, 0, 40, 40]); ctx.fill();
    }
  }
  ctx.restore();
}

export function renderModel(p, side = 'front', s = 1, img = null) {
  const c = document.createElement('canvas');
  c.width = Math.round(MW * s);
  c.height = Math.round(MH * s);
  const ctx = c.getContext('2d');
  ctx.scale(s, s);
  if (img) {
    const k = Math.min(MW / img.width, MH / img.height);
    ctx.drawImage(img, (MW - img.width * k) / 2, MH - img.height * k, img.width * k, img.height * k);
  } else if (p.model) {
    drawModel(ctx, p, side, s);
  }
  return c;
}

const modelThumbs = new Map();
export function modelThumb(p, s = 0.5) {
  if (p.image) return p.image;
  const k = `${p.id}@${s}`;
  if (!modelThumbs.has(k)) modelThumbs.set(k, renderModel(p, 'front', s).toDataURL('image/png'));
  return modelThumbs.get(k);
}
