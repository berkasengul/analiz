// Gerçek 3D çocuk figürleri: her açıdan tutarlı, pijamalar desen ve baskılarıyla giydirilmiş.
// Figürler 10 birim boyunda kurulur, sahnede ekrana göre ölçeklenir.
import * as THREE from '../vendor/three.module.min.js';

/* ---------- Kumaş dokuları ---------- */
function tileCanvas(size, draw) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const x = c.getContext('2d');
  draw(x, size);
  // Örgü dokusu hissi: çok hafif ince çizgiler
  x.globalAlpha = 0.05;
  x.fillStyle = '#000';
  for (let i = 0; i < size; i += 4) x.fillRect(i, 0, 1, size);
  x.globalAlpha = 1;
  return c;
}

// Motifi kenarlardan taşırsa karşı kenarda da çizer (dikişsiz tekrar)
function wrapDraw(x, S, px, py, r, fn) {
  for (const dx of [-S, 0, S]) for (const dy of [-S, 0, S]) {
    if (px + dx < -r || px + dx > S + r || py + dy < -r || py + dy > S + r) continue;
    x.save();
    x.translate(px + dx, py + dy);
    fn(x);
    x.restore();
  }
}

function seeded(seed) { return () => ((seed = (seed * 16807) % 2147483647) / 2147483647); }

function heart(x, s) {
  const r = s * 0.5;
  x.beginPath();
  x.moveTo(0, s * 0.95);
  x.lineTo(-s * 0.93, -s * 0.05);
  x.arc(-r, -r * 0.45, r, Math.PI * 0.8, Math.PI * 1.95, false);
  x.arc(r, -r * 0.45, r, Math.PI * 1.05, Math.PI * 0.2, false);
  x.closePath();
  x.fill();
}

function starPath(x, r) {
  x.beginPath();
  for (let i = 0; i < 10; i++) {
    const rr = i % 2 ? r * 0.45 : r;
    const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
    x.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
  }
  x.closePath();
}

function vehicle(q, kind) {
  const wheel = (x, y) => { q.fillStyle = '#26262e'; q.beginPath(); q.arc(x, y, 7, 0, 7); q.fill(); q.fillStyle = '#c9ccd6'; q.beginPath(); q.arc(x, y, 3, 0, 7); q.fill(); };
  if (kind === 0) { // itfaiye
    q.fillStyle = '#e53935'; q.beginPath(); q.roundRect(-38, -14, 56, 24, 4); q.fill(); q.beginPath(); q.roundRect(16, -20, 22, 30, 5); q.fill();
    q.fillStyle = '#bfe8ff'; q.fillRect(22, -16, 12, 10);
    q.strokeStyle = '#ffd54a'; q.lineWidth = 3; q.beginPath(); q.moveTo(-34, -18); q.lineTo(12, -18); for (let i = -30; i < 12; i += 8) { q.moveTo(i, -21); q.lineTo(i, -15); } q.stroke();
    q.fillStyle = '#ffd54a'; q.fillRect(-38, 2, 76, 4);
    wheel(-24, 12); wheel(24, 12);
  } else if (kind === 1) { // ambulans
    q.fillStyle = '#ffffff'; q.beginPath(); q.roundRect(-34, -18, 68, 28, 6); q.fill();
    q.fillStyle = '#9be15d'; q.fillRect(-34, -2, 68, 6);
    q.fillStyle = '#bfe8ff'; q.fillRect(14, -14, 14, 9);
    q.fillStyle = '#e53935'; q.fillRect(-14, -14, 4, 12); q.fillRect(-18, -10, 12, 4);
    wheel(-20, 12); wheel(20, 12);
  } else if (kind === 2) { // koni
    q.fillStyle = '#ff8a1f'; q.beginPath(); q.moveTo(0, -22); q.lineTo(12, 14); q.lineTo(-12, 14); q.closePath(); q.fill();
    q.fillStyle = '#fff'; q.fillRect(-7, -6, 14, 5); q.fillRect(-10, 4, 20, 4);
    q.fillStyle = '#ff8a1f'; q.fillRect(-15, 14, 30, 4);
  } else { // trafik levhası
    q.fillStyle = '#7a7f8c'; q.fillRect(-2, -6, 4, 30);
    q.fillStyle = '#fff'; q.beginPath(); q.arc(0, -14, 13, 0, 7); q.fill();
    q.strokeStyle = '#e53935'; q.lineWidth = 3.5; q.stroke();
    q.strokeStyle = '#26262e'; q.lineWidth = 3; q.beginPath(); q.moveTo(-6, -14); q.lineTo(6, -14); q.lineTo(2, -18); q.moveTo(6, -14); q.lineTo(2, -10); q.stroke();
  }
}

function raccoon(q) {
  q.fillStyle = '#8f8c95'; q.beginPath(); q.moveTo(-20, -10); q.lineTo(-16, -26); q.lineTo(-6, -16); q.lineTo(6, -16); q.lineTo(16, -26); q.lineTo(20, -10); q.closePath(); q.fill();
  q.beginPath(); q.ellipse(0, 0, 22, 18, 0, 0, 7); q.fill();
  q.fillStyle = '#ffffff'; q.beginPath(); q.ellipse(0, 6, 15, 10, 0, 0, 7); q.fill();
  q.fillStyle = '#2f2d36'; q.beginPath(); q.ellipse(-9, -2, 8, 5, -0.3, 0, 7); q.ellipse(9, -2, 8, 5, 0.3, 0, 7); q.fill();
  q.fillStyle = '#fff'; q.beginPath(); q.arc(-8, -2, 2.2, 0, 7); q.arc(10, -2, 2.2, 0, 7); q.fill();
  q.fillStyle = '#2f2d36'; q.beginPath(); q.arc(0, 6, 3, 0, 7); q.fill();
  q.fillStyle = '#e57a9c'; q.beginPath(); q.ellipse(0, 26, 16, 6, 0, 0, 7); q.fill();
}

const FABRICS = {
  solid: (x, S, o) => { x.fillStyle = o.base; x.fillRect(0, 0, S, S); },
  stripes: (x, S, o) => {
    x.fillStyle = o.base; x.fillRect(0, 0, S, S);
    x.fillStyle = o.stripe;
    for (let y = 0; y < S; y += S / 4) x.fillRect(0, y + S / 8, S, S / 18);
  },
  hearts: (x, S, o) => {
    x.fillStyle = o.base; x.fillRect(0, 0, S, S);
    const cols = ['#e8457a', '#8a3fa0', '#f2c31b', '#7ac143', '#4fb3e8', '#f39a6b', '#c9c3cf', '#f7a6c4'];
    const r = seeded(5);
    let k = 0;
    for (let gy = 0; gy < 5; gy++) for (let gx = 0; gx < 5; gx++) {
      const px = (gx + 0.5 + (gy % 2) * 0.5) * (S / 5) + (r() - 0.5) * 20;
      const py = (gy + 0.5) * (S / 5) + (r() - 0.5) * 20;
      const c = cols[k++ % cols.length];
      const rot = (r() - 0.5) * 0.8;
      wrapDraw(x, S, px, py, 30, (q) => { q.rotate(rot); q.fillStyle = c; heart(q, 24); });
    }
  },
  stars: (x, S, o) => {
    x.fillStyle = o.base; x.fillRect(0, 0, S, S);
    const r = seeded(9);
    const pts = [[0.25, 0.22], [0.72, 0.38], [0.35, 0.72], [0.85, 0.85], [0.1, 0.55]];
    for (const [a, b] of pts) {
      const rot = r() * 6.28;
      const s = 34 + r() * 26;
      wrapDraw(x, S, a * S, b * S, s + 6, (q) => {
        q.rotate(rot);
        starPath(q, s);
        q.lineJoin = 'round';
        q.lineWidth = 7;
        q.strokeStyle = o.star;
        q.stroke();
      });
    }
  },
  berries: (x, S, o) => {
    x.fillStyle = o.base; x.fillRect(0, 0, S, S);
    const r = seeded(3);
    for (let i = 0; i < 9; i++) {
      const px = r() * S;
      const py = r() * S;
      const rot = (r() - 0.5) * 1;
      wrapDraw(x, S, px, py, 40, (q) => {
        q.rotate(rot);
        q.fillStyle = '#ff5b8a';
        q.beginPath();
        q.moveTo(0, 30);
        q.bezierCurveTo(-30, 10, -26, -22, 0, -18);
        q.bezierCurveTo(26, -22, 30, 10, 0, 30);
        q.fill();
        q.fillStyle = '#ffe58a';
        for (let s = 0; s < 7; s++) { q.beginPath(); q.ellipse(-12 + (s % 3) * 12, -6 + Math.floor(s / 3) * 12, 2, 3, 0, 0, 7); q.fill(); }
        q.fillStyle = '#5fbf62';
        q.beginPath();
        for (let l = 0; l < 5; l++) { const a = -Math.PI / 2 + (l - 2) * 0.55; q.ellipse(Math.cos(a) * 10, -20 + Math.sin(a) * 6, 9, 4, a, 0, 7); }
        q.fill();
      });
    }
    for (let i = 0; i < 10; i++) {
      const px = r() * S;
      const py = r() * S;
      wrapDraw(x, S, px, py, 20, (q) => {
        q.fillStyle = '#fff';
        for (let l = 0; l < 6; l++) { q.beginPath(); q.ellipse(Math.cos(l) * 8, Math.sin(l) * 8, 7, 4, l, 0, 7); q.fill(); }
        q.fillStyle = '#ffcf3d';
        q.beginPath(); q.arc(0, 0, 5, 0, 7); q.fill();
      });
    }
  },
  vehicles: (x, S, o) => {
    x.fillStyle = o.base; x.fillRect(0, 0, S, S);
    const r = seeded(21);
    for (let i = 0; i < 5; i++) {
      const px = r() * S;
      const py = r() * S;
      wrapDraw(x, S, px, py, 34, (q) => { q.fillStyle = 'rgba(255,255,255,.85)'; q.beginPath(); q.arc(-14, 0, 12, 0, 7); q.arc(0, -6, 15, 0, 7); q.arc(16, 0, 11, 0, 7); q.fill(); });
    }
    const spots = [[0.25, 0.2, 0], [0.72, 0.32, 1], [0.15, 0.62, 2], [0.5, 0.58, 3], [0.82, 0.78, 0], [0.38, 0.88, 1], [0.9, 0.08, 2]];
    for (const [a, b, k] of spots) wrapDraw(x, S, a * S, b * S, 44, (q) => { q.scale(1.15, 1.15); vehicle(q, k); });
  },
  raccoons: (x, S, o) => {
    x.fillStyle = o.base; x.fillRect(0, 0, S, S);
    const r = seeded(17);
    const spots = [[0.22, 0.2], [0.7, 0.3], [0.4, 0.62], [0.88, 0.75], [0.12, 0.86]];
    for (const [a, b] of spots) {
      const rot = (r() - 0.5) * 0.6;
      wrapDraw(x, S, a * S, b * S, 40, (q) => { q.rotate(rot); q.scale(1.3, 1.3); raccoon(q); });
    }
    x.fillStyle = '#3a3842';
    x.font = 'bold 22px Fredoka, sans-serif';
    wrapDraw(x, S, 0.62 * S, 0.06 * S, 40, (q) => q.fillText('SMILE', 0, 0));
    wrapDraw(x, S, 0.1 * S, 0.45 * S, 40, (q) => q.fillText('SMILE', 0, 0));
    for (let i = 0; i < 6; i++) wrapDraw(x, S, r() * S, r() * S, 12, (q) => { q.fillStyle = '#f2c94c'; starPath(q, 8); q.fill(); });
  },
  bears: (x, S, o) => {
    x.fillStyle = o.base; x.fillRect(0, 0, S, S);
    const r = seeded(11);
    for (let i = 0; i < 7; i++) {
      const px = r() * S;
      const py = r() * S;
      const flip = r() > 0.5 ? -1 : 1;
      wrapDraw(x, S, px, py, 60, (q) => {
        q.scale(flip, 1);
        q.fillStyle = '#ffffff';
        q.beginPath();
        q.ellipse(0, 0, 44, 22, 0, 0, 7);
        q.ellipse(42, -10, 18, 14, -0.3, 0, 7);
        q.ellipse(36, -24, 5, 5, 0, 0, 7);
        for (const lx of [-28, -10, 14, 30]) q.roundRect(lx - 7, 8, 14, 22, 6);
        q.fill();
        q.fillStyle = 'rgba(240,150,190,.55)';
        q.beginPath(); q.ellipse(-6, 6, 26, 8, 0, 0, 7); q.fill();
        q.fillStyle = '#2b2f48';
        q.beginPath(); q.arc(48, -12, 2.4, 0, 7); q.arc(58, -6, 2.6, 0, 7); q.fill();
      });
    }
  },
};

function fabricTexture(spec, cache) {
  const key = JSON.stringify(spec);
  if (cache.has(key)) return cache.get(key);
  let tex;
  if (spec.photo) {
    tex = new THREE.TextureLoader().load(spec.photo);
    tex.wrapS = tex.wrapT = THREE.MirroredRepeatWrapping;
  } else {
    tex = new THREE.CanvasTexture(tileCanvas(512, (x, S) => FABRICS[spec.pattern || 'solid'](x, S, spec)));
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  }
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  cache.set(key, tex);
  return tex;
}

function repeated(tex, u, v, sc = 1) {
  const t = tex.clone();
  t.repeat.set(u * sc, v * sc);
  t.needsUpdate = true;
  return t;
}

/* ---------- Geometri yardımcıları ---------- */
// [r, y] noktalarından yumuşak bir dönel yüzey
function smoothProfile(pts, n = 40) {
  const curve = new THREE.CatmullRomCurve3(pts.map(([r, y]) => new THREE.Vector3(r, y, 0)));
  return curve.getPoints(n).map((p) => new THREE.Vector2(Math.max(0, p.x), p.y));
}
function lathe(pts, segs = 56) { return new THREE.LatheGeometry(smoothProfile(pts), segs); }
function radiusAt(profile, y) {
  for (let i = 1; i < profile.length; i++) {
    const a = profile[i - 1];
    const b = profile[i];
    if ((y - a.y) * (y - b.y) <= 0) return a.x + ((y - a.y) / (b.y - a.y || 1)) * (b.x - a.x);
  }
  return profile[profile.length - 1].x;
}

const TORSO = [[1.2, 4.42], [1.22, 4.7], [1.15, 5.3], [1.12, 6.0], [1.14, 6.6], [1.07, 7.05], [0.86, 7.36], [0.5, 7.56], [0.36, 7.62]];
const TORSO_Z = 0.74;
const SLEEVE = [[0, 0.3], [0.32, 0.22], [0.45, 0], [0.43, -0.6], [0.39, -1.4], [0.36, -2.15], [0.35, -2.3]];
const PELVIS = [[0.98, 3.7], [1.12, 4.0], [1.15, 4.5], [1.08, 4.9], [0.9, 5.0]];
const LEG = [[0, 0.32], [0.46, 0.16], [0.58, 0], [0.56, -0.8], [0.48, -1.8], [0.43, -2.8], [0.41, -3.3]];
const HEAD_C = new THREE.Vector3(0, 8.78, 0.04);
const HEAD_R = 1.12;
const HEAD_S = new THREE.Vector3(1, 1.04, 0.97);

function headSurface(x, y, lift = 0) {
  const ny = (y - HEAD_C.y) / HEAD_S.y;
  const z = Math.sqrt(Math.max(0, HEAD_R * HEAD_R - x * x - ny * ny)) * HEAD_S.z;
  return new THREE.Vector3(x, y, HEAD_C.z + z + lift);
}

const radialTex = (() => {
  let t = null;
  return () => {
    if (t) return t;
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const x = c.getContext('2d');
    const g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = g;
    x.fillRect(0, 0, 128, 128);
    t = new THREE.CanvasTexture(c);
    return t;
  };
})();

/* ---------- Figür ---------- */
function buildFigure(p, cache) {
  const f = p.figure;
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);
  const meshes = [];
  const add = (parent, geo, mat, cast = true) => {
    const m = new THREE.Mesh(geo, mat);
    m.castShadow = cast;
    m.receiveShadow = true;
    parent.add(m);
    meshes.push(m);
    return m;
  };
  const cloth = (tex, color = '#ffffff') => new THREE.MeshPhysicalMaterial({
    map: tex, color, roughness: 0.82, sheen: 0.7, sheenRoughness: 0.75, sheenColor: new THREE.Color('#ffffff'), side: THREE.DoubleSide,
  });
  const skin = new THREE.MeshPhysicalMaterial({ color: f.skin, roughness: 0.5, sheen: 0.35, sheenColor: new THREE.Color('#ffd8c8'), clearcoat: 0.08 });
  const hairMat = new THREE.MeshPhysicalMaterial({ color: f.hair.color, roughness: 0.42, sheen: 0.5, sheenColor: new THREE.Color('#fff2e0'), clearcoat: 0.15 });
  const ribTop = new THREE.MeshPhysicalMaterial({ color: f.rib, roughness: 0.75, sheen: 0.5 });
  const ribPants = new THREE.MeshPhysicalMaterial({ color: f.pantsRib || f.rib, roughness: 0.75, sheen: 0.5 });
  const sock = new THREE.MeshPhysicalMaterial({ color: f.sock || '#f6f6f8', roughness: 0.8, sheen: 0.6 });

  const topTex = fabricTexture(f.top, cache);
  const pantsTex = fabricTexture(f.pants, cache);

  // Gövde (üst)
  const torsoProfile = smoothProfile(TORSO);
  const torso = add(body, new THREE.LatheGeometry(torsoProfile, 64), cloth(repeated(topTex, 3, 1.6, f.top.scale)));
  torso.scale.z = TORSO_Z;
  // Ön baskı: gövde yüzeyini izleyen ince kaplama
  if (f.print) {
    const ph = f.printH || 1.55;
    const y0 = 6.95 - ph;
    const y1 = 6.95;
    const halfW = Math.min(1.25, ((f.printAspect || 1) * ph) / 2 / 1.02);
    const cols = 40;
    const rows = 30;
    const geo = new THREE.PlaneGeometry(1, 1, cols, rows);
    const pos = geo.attributes.position;
    const uv = geo.attributes.uv;
    for (let k = 0; k < pos.count; k++) {
      const u = uv.getX(k);
      const v = uv.getY(k);
      const y = y0 + v * (y1 - y0);
      const phi = (u - 0.5) * 2 * halfW;
      const r = radiusAt(torsoProfile, y) + 0.015;
      pos.setXYZ(k, Math.sin(phi) * r, y, Math.cos(phi) * r * TORSO_Z + 0.004);
    }
    geo.computeVertexNormals();
    const tex = new THREE.TextureLoader().load(f.print);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    const m = add(body, geo, new THREE.MeshStandardMaterial({ map: tex, transparent: true, roughness: 0.85, polygonOffset: true, polygonOffsetFactor: -2 }), false);
    m.renderOrder = 2;
  }
  // Yaka
  const collar = add(body, new THREE.TorusGeometry(0.42, 0.085, 16, 48), ribTop);
  collar.rotation.x = Math.PI / 2;
  collar.position.y = 7.58;
  collar.scale.set(1, 0.88, 1);
  // Alt: bel + bacaklar
  const pelvis = add(body, lathe(PELVIS), cloth(repeated(pantsTex, 3, 0.7, f.pants.scale)));
  pelvis.scale.z = 0.78;
  const legs = [];
  for (const side of [-1, 1]) {
    const g = new THREE.Group();
    g.position.set(side * 0.5, 4.02, 0);
    g.rotation.z = side * 0.05;
    body.add(g);
    add(g, lathe(LEG, 40), cloth(repeated(pantsTex, 2, 1.9, f.pants.scale)));
    const cuff = add(g, new THREE.CylinderGeometry(0.42, 0.4, 0.34, 32), ribPants);
    cuff.position.y = -3.46;
    const foot = add(g, new THREE.SphereGeometry(1, 32, 20), sock);
    foot.scale.set(0.34, 0.26, 0.5);
    foot.position.set(0, -3.76, 0.14);
    legs.push(g);
  }
  // Kollar
  const arms = [];
  for (const side of [-1, 1]) {
    const g = new THREE.Group();
    g.position.set(side * 1.0, 6.95, 0);
    g.rotation.z = side * 0.2;
    body.add(g);
    add(g, lathe(SLEEVE, 40), cloth(repeated(topTex, 1.5, 1.4, f.top.scale)));
    const cuff = add(g, new THREE.TorusGeometry(0.33, 0.075, 12, 36), ribTop);
    cuff.rotation.x = Math.PI / 2;
    cuff.position.y = -2.3;
    const hand = add(g, new THREE.SphereGeometry(0.27, 28, 20), skin);
    hand.scale.set(0.85, 1.12, 0.75);
    hand.position.y = -2.62;
    arms.push(g);
  }
  // Boyun + baş
  const neck = add(body, new THREE.CylinderGeometry(0.31, 0.34, 0.6, 24), skin);
  neck.position.y = 7.62;
  const head = new THREE.Group();
  head.position.set(0, 7.75, 0);
  body.add(head);
  const H = (v) => v.clone().sub(new THREE.Vector3(0, 7.75, 0));
  const skull = add(head, new THREE.SphereGeometry(HEAD_R, 64, 48), skin);
  skull.position.copy(H(HEAD_C));
  skull.scale.copy(HEAD_S);
  for (const side of [-1, 1]) {
    const ear = add(head, new THREE.SphereGeometry(0.2, 20, 16), skin);
    ear.position.copy(H(new THREE.Vector3(side * 1.08, 8.68, 0)));
    ear.scale.set(0.55, 1, 0.8);
  }
  // Yüz
  const eyeMat = new THREE.MeshPhysicalMaterial({ color: '#2a2030', roughness: 0.15, clearcoat: 1 });
  const white = new THREE.MeshBasicMaterial({ color: '#ffffff' });
  const eyes = [];
  for (const side of [-1, 1]) {
    const ep = headSurface(side * 0.4, 8.64, -0.075);
    const eye = add(head, new THREE.SphereGeometry(0.19, 24, 18), eyeMat, false);
    eye.position.copy(H(ep));
    eye.scale.set(0.92, 1.22, 0.42);
    eye.lookAt(eye.position.clone().add(ep.clone().sub(HEAD_C).normalize()));
    const hl = add(head, new THREE.SphereGeometry(0.055, 12, 10), white, false);
    hl.position.copy(H(headSurface(side * 0.4 + 0.06, 8.73, 0.0)));
    eyes.push(eye, hl);
    const brow = add(head, new THREE.CapsuleGeometry(0.03, 0.22, 4, 8), new THREE.MeshStandardMaterial({ color: f.hair.brow || f.hair.color, roughness: 0.6 }), false);
    brow.position.copy(H(headSurface(side * 0.4, 8.97, 0.01)));
    brow.rotation.z = Math.PI / 2 + side * 0.18;
    const cheek = add(head, new THREE.CircleGeometry(0.2, 24), new THREE.MeshBasicMaterial({ map: radialTex(), color: '#ff8fa8', transparent: true, opacity: 0.55, depthWrite: false }), false);
    const cp = headSurface(side * 0.66, 8.33, 0.006);
    cheek.position.copy(H(cp));
    cheek.lookAt(H(cp).add(cp.clone().sub(HEAD_C).normalize()));
  }
  const nose = add(head, new THREE.SphereGeometry(0.085, 16, 12), skin, false);
  nose.position.copy(H(headSurface(0, 8.4, -0.05)));
  const smile = new THREE.CatmullRomCurve3([[-0.25, 8.15], [-0.12, 8.04], [0, 8.01], [0.12, 8.04], [0.25, 8.15]].map(([x, y]) => H(headSurface(x, y, 0.005))));
  add(head, new THREE.TubeGeometry(smile, 24, 0.034, 8, false), new THREE.MeshStandardMaterial({ color: '#b84a60', roughness: 0.5 }), false);
  // Saç
  const style = f.hair.style;
  const cap = add(head, new THREE.SphereGeometry(HEAD_R * (style === 'short' ? 1.085 : 1.07), 64, 32, 0, Math.PI * 2, 0, style === 'short' ? 1.72 : 1.8), hairMat);
  cap.position.copy(H(HEAD_C));
  cap.scale.copy(HEAD_S);
  cap.rotation.x = style === 'short' ? -0.66 : -0.55;
  if (style === 'long') {
    const back = add(head, new THREE.CapsuleGeometry(0.95, 1.4, 10, 28), hairMat);
    back.position.copy(H(new THREE.Vector3(0, 7.95, -0.6)));
    back.scale.set(1.12, 1, 0.5);
    for (const side of [-1, 1]) {
      const strand = add(head, new THREE.CapsuleGeometry(0.25, 1.2, 8, 16), hairMat);
      strand.position.copy(H(new THREE.Vector3(side * 0.98, 8.0, -0.1)));
      strand.rotation.z = side * 0.08;
      strand.scale.set(1, 1, 0.7);
    }
  }
  if (style === 'ponytail') {
    const tie = add(head, new THREE.TorusGeometry(0.16, 0.06, 10, 24), new THREE.MeshStandardMaterial({ color: f.hair.tie || '#e96bb8' }));
    tie.position.copy(H(new THREE.Vector3(0, 9.05, -1.08)));
    tie.rotation.x = 0.9;
    const tail = add(head, new THREE.CapsuleGeometry(0.26, 1.3, 8, 20), hairMat);
    tail.position.copy(H(new THREE.Vector3(0, 8.4, -1.35)));
    tail.rotation.x = 0.35;
  }

  // Etiket noktaları (figür yerel koordinatları)
  const anchors = {
    baski: new THREE.Vector3(0, 6.2, radiusAt(torsoProfile, 6.2) * TORSO_Z + 0.05),
    desen: new THREE.Vector3(-0.52, 2.4, 0.5),
    manset: new THREE.Vector3(0.56, 0.6, 0.45),
  };
  meshes.forEach((m) => { if (m.material.envMapIntensity !== undefined) m.material.envMapIntensity = 0.55; });
  return { root, body, head, arms, legs, eyes, meshes, anchors };
}

/* ---------- Ortam ışığı (yansımalar için) ---------- */
function envMap(renderer) {
  const pm = new THREE.PMREMGenerator(renderer);
  const s = new THREE.Scene();
  const sky = new THREE.Mesh(new THREE.SphereGeometry(10, 32, 16), new THREE.ShaderMaterial({
    side: THREE.BackSide,
    uniforms: {},
    vertexShader: 'varying vec3 p; void main(){ p = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }',
    fragmentShader: 'varying vec3 p; void main(){ float h = normalize(p).y; vec3 top = vec3(1.0,0.97,0.99); vec3 mid = vec3(1.0,0.86,0.93); vec3 bot = vec3(0.72,0.84,1.0); gl_FragColor = vec4(h > 0. ? mix(mid, top, h) : mix(mid, bot, -h), 1.); }',
  }));
  s.add(sky);
  const panel = (x, y, z, w, h, c) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: c, side: THREE.DoubleSide }));
    m.position.set(x, y, z);
    m.lookAt(0, 0, 0);
    s.add(m);
  };
  panel(-5, 4, 6, 5, 4, '#ffffff');
  panel(6, 2, -3, 3, 6, '#ffd2ec');
  panel(-6, 1, -4, 3, 6, '#cfe9ff');
  const tex = pm.fromScene(s, 0.04).texture;
  pm.dispose();
  return tex;
}

// Ortak 3D sahne: renderer, ortam ışığı, stüdyo ışıkları, gölge zemini
export function makeStage(canvas, opts = {}) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  } catch (e) {
    return null;
  }
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = opts.exposure ?? 0.92;
  renderer.shadowMap.enabled = opts.shadows !== false;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene();
  scene.environment = envMap(renderer);
  const camera = new THREE.PerspectiveCamera(opts.fov ?? 28, 1, 0.1, 300);
  camera.position.set(0, 0, 24);
  scene.add(new THREE.HemisphereLight(0xffffff, 0xf2dcff, 0.45));
  const key = new THREE.DirectionalLight(0xffffff, opts.keyIntensity ?? 1.9);
  key.position.set(-6, 10, 10);
  key.castShadow = opts.shadows !== false;
  key.shadow.mapSize.set(1024, 1024);
  const ext = opts.shadowExtent ?? 14;
  Object.assign(key.shadow.camera, { left: -ext, right: ext, top: ext, bottom: -ext, far: 120 });
  key.shadow.bias = -0.0004;
  key.shadow.radius = 6;
  scene.add(key, key.target);
  const rimA = new THREE.DirectionalLight(0xffb8e2, 1.6);
  rimA.position.set(8, 4, -8);
  const rimB = new THREE.DirectionalLight(0xa6d8ff, 1.3);
  rimB.position.set(-9, 3, -6);
  scene.add(rimA, rimB);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.ShadowMaterial({ opacity: opts.groundOpacity ?? 0.18 }));
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);
  return { THREE, renderer, scene, camera, key, ground, rimA, rimB };
}

// Nefes, baş ve kol hareketi, göz kırpma
export function animateFigure(fig, t, i, blink, wave = 0) {
  const ph = t * 1.6 + i;
  fig.body.scale.y = 1 + Math.sin(ph) * 0.006;
  fig.head.rotation.z = Math.sin(t * 0.7 + i) * 0.05;
  fig.head.rotation.y = Math.sin(t * 0.45 + i) * 0.12;
  fig.head.rotation.x = Math.sin(t * 0.6 + i) * 0.03;
  fig.arms[0].rotation.x = Math.sin(ph * 0.5) * 0.06;
  fig.arms[1].rotation.x = -Math.sin(ph * 0.5) * 0.06;
  // El sallama (sağ kol)
  fig.arms[1].rotation.z = 0.2 + wave * (2.5 + Math.sin(t * 7) * 0.25);
  fig.eyes.forEach((e, n) => { if (n % 2 === 0) e.scale.y = blink ? 0.12 : 1.22; else e.visible = !blink; });
}

export function blinker() {
  let at = 1.5 + Math.random() * 2;
  return (t) => {
    const b = t > at && t < at + 0.13;
    if (t > at + 0.13) at = t + 2.5 + Math.random() * 3;
    return b;
  };
}

export { buildFigure, THREE };

export function createFigures(canvas, products) {
  const st = makeStage(canvas);
  if (!st) return null;
  const { renderer, scene, camera, key, ground } = st;

  const cache = new Map();
  const figs = products.map((p) => {
    const fig = buildFigure(p, cache);
    fig.root.visible = false;
    scene.add(fig.root);
    return fig;
  });

  let vw = 1;
  let vh = 1;
  let visH = 1;
  let visW = 1;
  function resize(w, h) {
    vw = w;
    vh = h;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    visH = 2 * camera.position.z * Math.tan((camera.fov * Math.PI) / 360);
    visW = visH * camera.aspect;
  }

  const blinkNow = blinker();
  // states[i] = { x, floor, height (ekran oranları), rotY, rotX, scale, opacity, t }
  function render(states, t) {
    let floorY = 0;
    const blink = blinkNow(t);
    figs.forEach((fig, i) => {
      const s = states[i];
      const on = s.opacity > 0.02;
      fig.root.visible = on;
      if (!on) return;
      const Hw = visH * s.height * s.scale;
      const k = Hw / 10;
      floorY = (0.5 - s.floor) * visH;
      fig.root.position.set((s.x - 0.5) * visW, floorY - (1 - s.opacity) * 0.6, 0);
      fig.root.scale.setScalar(k);
      fig.root.rotation.y = s.rotY;
      fig.body.rotation.x = s.rotX || 0;
      animateFigure(fig, t, i, blink);
    });
    ground.position.y = floorY;
    key.target.position.set(0, floorY, 0);
    renderer.render(scene, camera);
  }

  const v3 = new THREE.Vector3();
  const camDir = new THREE.Vector3();
  function project(i, keyName) {
    const fig = figs[i];
    if (!fig.root.visible) return null;
    v3.copy(fig.anchors[keyName]);
    fig.body.localToWorld(v3);
    // Etiket figürün arka yüzünde kaldıysa gizle
    camDir.set(Math.sin(fig.root.rotation.y), 0, Math.cos(fig.root.rotation.y));
    const facing = camDir.z;
    v3.project(camera);
    return { x: (v3.x * 0.5 + 0.5) * vw, y: (-v3.y * 0.5 + 0.5) * vh, facing };
  }

  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  function pick(px, py) {
    ndc.set((px / vw) * 2 - 1, -(py / vh) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    for (let i = 0; i < figs.length; i++) {
      if (!figs[i].root.visible) continue;
      if (ray.intersectObjects(figs[i].meshes, false).length) return i;
    }
    return -1;
  }

  return { resize, render, project, pick };
}
