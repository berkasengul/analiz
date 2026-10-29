// Gerçek 3D çocuk figürleri: her açıdan tutarlı, pijamalar desen ve baskılarıyla giydirilmiş.
// Figürler 10 birim boyunda kurulur, sahnede ekrana göre ölçeklenir.
import * as THREE from '../vendor/three.module.min.js';
import { FACES, FACE_TRI, FACE_ALPHA } from './faces.js';
import { GLTFLoader } from '../vendor/GLTFLoader.js';
import { SPINS } from './spins.js';

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

// Oranlar: figür 10 birim boyunda; gerçekçi, fit çocuk oranları (yaklaşık 6 baş boyu)
const TORSO = [[0.82, 5.0], [0.84, 5.4], [0.78, 6.0], [0.79, 6.6], [0.85, 7.2], [0.84, 7.6], [0.66, 7.9], [0.36, 8.05], [0.27, 8.08]];
const TORSO_Z = 0.62;
const SLEEVE = [[0, 0.22], [0.24, 0.16], [0.3, 0], [0.28, -0.8], [0.26, -1.7], [0.23, -2.6], [0.22, -2.75]];
const PELVIS = [[0.72, 4.45], [0.84, 4.75], [0.86, 5.2], [0.8, 5.45], [0.7, 5.5]];
const LEG = [[0, 0.25], [0.36, 0.12], [0.44, 0], [0.42, -0.9], [0.36, -2.0], [0.31, -3.3], [0.29, -4.0]];
const HEAD_C = new THREE.Vector3(0, 9.08, -0.12);
const HEAD_R = 0.78;
const HEAD_S = new THREE.Vector3(0.93, 1.08, 0.86);
const FACE_W = 1.26; // yüz ovalinin genişliği

// Kafatası yüzeyinin (x, y) noktasındaki ön z değeri
function skullFrontZ(x, y) {
  const nx = x / (HEAD_R * HEAD_S.x);
  const ny = (y - HEAD_C.y) / (HEAD_R * HEAD_S.y);
  const k = 1 - nx * nx - ny * ny;
  return k > 0 ? HEAD_C.z + Math.sqrt(k) * HEAD_R * HEAD_S.z : -Infinity;
}

function tone(hex, amt) {
  const c = new THREE.Color(hex);
  c.offsetHSL(0, 0, amt);
  return c;
}

// Gerçek yüz: fotoğraftan çıkarılmış 3D yüz yüzeyi, kenarları cilde yumuşakça karışır
function faceMesh(face) {
  const n = face.pos.length / 3;
  const pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    pos[i * 3] = face.pos[i * 3] * FACE_W;
    pos[i * 3 + 1] = HEAD_C.y - 0.06 + face.pos[i * 3 + 1] * FACE_W;
    pos[i * 3 + 2] = face.pos[i * 3 + 2] * FACE_W;
  }
  // Yüzü kafatasının önüne oturt: iç noktalar kafatasının dışında kalsın
  let off = -Infinity;
  for (let i = 0; i < n; i++) {
    if (FACE_ALPHA[i] < 1) continue;
    const need = skullFrontZ(pos[i * 3], pos[i * 3 + 1]) + 0.012 - pos[i * 3 + 2];
    if (need > off) off = need;
  }
  for (let i = 0; i < n; i++) pos[i * 3 + 2] += off;
  const col = new Float32Array(n * 4);
  for (let i = 0; i < n; i++) { col[i * 4] = col[i * 4 + 1] = col[i * 4 + 2] = 1; col[i * 4 + 3] = FACE_ALPHA[i]; }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(face.uv), 2));
  g.setAttribute('color', new THREE.BufferAttribute(col, 4));
  g.setIndex(FACE_TRI);
  g.computeVertexNormals();
  return g;
}

/* ---------- Premium kaide ---------- */
const PED_H = 0.36;
const PED_R = 2.3;
const SUBJECT_H = 9.6; // 360° modellerde baştan zemine figür boyu (birim)
// Kaidenin kamera açısına uyması için en fazla eğim (rad): üst yüzey fazla açılıp ekranda yer kaplamasın
const TILT_MAX = 0.18;
// Geniş, parlak, ürün renginde hafif tonlu kaide
function pedestal(p, add, root) {
  const g = new THREE.Group();
  root.add(g);
  const acc = new THREE.Color(p.accent);
  // Gövde: tek parça döner profil. Üst kenar ve taban hafif yuvarlatılmış, yan yüzey dik ve
  // her yerde aynı kalınlıkta; üst yüzey tam PED_H yüksekliğinde düz (ayak hizası buna göre).
  const BEV = 0.07; // üst kenar yuvarlaklığı
  const FOOT = 0.04; // taban kenarı yuvarlaklığı
  const R = PED_R;
  const RB = PED_R * 1.015; // tabana doğru çok hafif genişleme (fiziksel ağırlık hissi)
  const prof = [new THREE.Vector2(R - BEV, PED_H)];
  for (let k = 1; k <= 8; k++) { // üst kenar çeyrek yayı
    const a = (k / 8) * (Math.PI / 2);
    prof.push(new THREE.Vector2(R - BEV + Math.sin(a) * BEV, PED_H - BEV + Math.cos(a) * BEV));
  }
  prof.push(new THREE.Vector2(RB, FOOT));
  for (let k = 1; k <= 4; k++) { // taban kenarı yayı
    const a = (k / 4) * (Math.PI / 2);
    prof.push(new THREE.Vector2(RB - FOOT + Math.cos(a) * FOOT, FOOT - Math.sin(a) * FOOT));
  }
  prof.push(new THREE.Vector2(0, 0));
  const pearl = new THREE.Color('#ffffff').lerp(acc, 0.3);
  const side = add(g, new THREE.LatheGeometry(prof.slice().reverse(), 128), new THREE.MeshPhysicalMaterial({ color: pearl, roughness: 0.3, clearcoat: 0.5, clearcoatRoughness: 0.2, sheen: 0.4, sheenColor: acc }), false);
  side.receiveShadow = true;
  // Üst yüzey: mat saten, neredeyse beyaz (yan yüzeyden kontrollü malzeme farkı)
  const top = add(g, new THREE.CircleGeometry(R - BEV + 0.002, 128), new THREE.MeshPhysicalMaterial({ color: new THREE.Color('#ffffff').lerp(acc, 0.05), roughness: 0.5, clearcoat: 0.2, clearcoatRoughness: 0.35 }), false);
  top.rotation.x = -Math.PI / 2;
  top.position.y = PED_H + 0.0005;
  top.receiveShadow = true;
  // Üst yüzeyde çok hafif ortadan yayılan ışık (stüdyo tepe ışığının izi)
  const sheen = new THREE.Mesh(new THREE.CircleGeometry(R - BEV, 96), new THREE.MeshBasicMaterial({ map: glowTex(), color: '#ffffff', transparent: true, opacity: 0.22, depthWrite: false }));
  sheen.rotation.x = -Math.PI / 2;
  sheen.position.y = PED_H + 0.004;
  g.add(sheen);
  // İnce ışık çizgisi: üst kenarın hemen altında, ürün paletinin açık tonu (mavide buz mavisi,
  // pembede yumuşak pembe); parlamayan, sönük bir iz
  const lineCol = acc.clone().lerp(new THREE.Color('#ffffff'), 0.3);
  const line = add(g, new THREE.TorusGeometry(R + 0.004, 0.015, 8, 160), new THREE.MeshStandardMaterial({ color: lineCol, emissive: lineCol, emissiveIntensity: 0.55, roughness: 0.4 }), false);
  line.rotation.x = Math.PI / 2;
  line.position.y = PED_H - BEV - 0.035;
  // Zemine düşen renkli yansıma (ölçülü) ve temas gölgesi
  const glow = new THREE.Mesh(new THREE.CircleGeometry(PED_R * 1.6, 64), new THREE.MeshBasicMaterial({ map: glowTex(), color: p.accent, transparent: true, opacity: 0.26, depthWrite: false }));
  glow.rotation.x = -Math.PI / 2;
  glow.position.y = 0.01;
  g.add(glow);
  // Kaidenin sahne zeminine değdiği yerde yumuşak temas gölgesi (kenara yakın koyu, dışa doğru söner)
  const floorShadow = shadowDisc(0.4);
  floorShadow.scale.set(PED_R * 1.2, 1, PED_R * 1.2);
  floorShadow.position.set(0.1, 0.005, -0.08);
  floorShadow.renderOrder = -1;
  g.add(floorShadow);
  root.userData.pedestal = g;
  return g;
}
const glowTex = (() => {
  let t = null;
  return () => {
    if (t) return t;
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const x = c.getContext('2d');
    const g = x.createRadialGradient(64, 64, 20, 64, 64, 64);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = g;
    x.fillRect(0, 0, 128, 128);
    t = new THREE.CanvasTexture(c);
    return t;
  };
})();

// Yumuşak, gauss benzeri temas gölgesi dokusu (ortada koyu, kenara doğru sıfıra iner)
const shadowTex = (() => {
  let t = null;
  return () => {
    if (t) return t;
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const x = c.getContext('2d');
    const g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
    for (let i = 0; i <= 10; i++) { const r = i / 10; g.addColorStop(r, `rgba(0,0,0,${Math.exp(-r * r * 4.2) * (1 - r * r)})`); }
    x.fillStyle = g;
    x.fillRect(0, 0, 128, 128);
    t = new THREE.CanvasTexture(c);
    return t;
  };
})();
const SHADOW_GEO = new THREE.CircleGeometry(1, 40).rotateX(-Math.PI / 2);
function shadowDisc(opacity, color = '#2a2140') {
  const m = new THREE.Mesh(SHADOW_GEO, new THREE.MeshBasicMaterial({ map: shadowTex(), color, transparent: true, opacity, depthWrite: false, toneMapped: false }));
  m.renderOrder = 1;
  return m;
}

/* ---------- Gerçek 3D model (GLB): görselden-3D ya da tarama ile üretilmiş ---------- */
const gltf = new GLTFLoader();
function glbFigure(p) {
  const root = new THREE.Group();
  const body = new THREE.Group();
  body.position.y = PED_H;
  root.add(body);
  const meshes = [];
  const add = (parent, geo, mat, cast = true) => { const m = new THREE.Mesh(geo, mat); m.castShadow = cast; m.receiveShadow = true; parent.add(m); meshes.push(m); return m; };
  pedestal(p, add, root);
  const head = new THREE.Group();
  const arms = [new THREE.Group(), new THREE.Group()];
  gltf.load(p.model3d, (g) => {
    const m = g.scene;
    const box = new THREE.Box3().setFromObject(m);
    const size = box.getSize(new THREE.Vector3());
    const k = 10 / size.y; // figür boyu 10 birim: diğer sahnelerle aynı ölçek
    m.scale.setScalar(k);
    const c = box.getCenter(new THREE.Vector3());
    m.position.set(-c.x * k, -box.min.y * k, -c.z * k);
    if (p.model3dRotY) m.rotation.y = p.model3dRotY;
    m.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; meshes.push(o); } });
    body.add(m);
  });
  const anchors = { baski: new THREE.Vector3(0, 6.6, 0.75), desen: new THREE.Vector3(-0.42, 2.6, 0.45), manset: new THREE.Vector3(0.4, 0.75, 0.4) };
  return { root, body, head, arms, legs: [], eyes: [], meshes, anchors };
}

/* ---------- 360° model: turntable karelerinden, kameraya göre doğru açı ---------- */
const TAU = Math.PI * 2;
// Kareler iki katmanda tutulur:
//  1) Sıkıştırılmış dosya (webp Blob, ~50 KB): görünen modelin tüm kareleri arka planda indirilir.
//  2) Ekran kartında açılmış doku: yalnızca o anki açının çevresindeki birkaç kare (halka).
// 120 karelik bir model böylece yüzlerce MB yerine ~60 MB ekran belleğiyle akıcı döner.
const EMPTY = new THREE.DataTexture(new Uint8Array([0, 0, 0, 0]), 1, 1);
EMPTY.needsUpdate = true;
const SPIN_FIGS = new Set();
// Önizleme gibi farklı paketlemelerde kare kaynağı window.__spinSource ile değiştirilebilir
const fetchBlob = (url) => (window.__spinSource ? window.__spinSource(url) : fetch(url).then((r) => r.blob()));
const fetchQueue = [];
let fetching = 0;
function queueFetch(url) { // aynı anda en fazla 6 indirme
  return new Promise((res, rej) => { fetchQueue.push({ url, res, rej }); pumpFetch(); });
}
function pumpFetch() {
  while (fetching < 6 && fetchQueue.length) {
    const job = fetchQueue.shift();
    fetching++;
    fetchBlob(job.url).then(job.res, job.rej).finally(() => { fetching--; pumpFetch(); });
  }
}
async function decodeFrame(blob, maxH) {
  const bmp = await createImageBitmap(blob, { premultiplyAlpha: 'none', colorSpaceConversion: 'none' });
  if (!maxH || bmp.height <= maxH) return bmp;
  // Küçük görünümler (koleksiyon) için küçültülmüş kopya: ekran belleği tasarrufu
  const k = maxH / bmp.height;
  const c = document.createElement('canvas');
  c.width = Math.round(bmp.width * k);
  c.height = maxH;
  const x = c.getContext('2d');
  x.imageSmoothingQuality = 'high';
  x.drawImage(bmp, 0, 0, c.width, c.height);
  bmp.close();
  return c;
}
setInterval(() => { for (const f of SPIN_FIGS) if (f.idle()) f.drop(); }, 3000);

function spinFigure(p, opts = {}) {
  const spin = SPINS[p.spin];
  const root = new THREE.Group();
  // tiltG: kaidenin üst yüzeyinin merkezinde (dönüş ekseninin zemine değdiği nokta) döner.
  // Kaide ve gölgeler, modelin çekildiği Tripo kamera eğimiyle aynı perspektifte görünsün diye
  // kameraya doğru hafifçe eğilir; figür düzlemi bu eğimi geri alıp dünyada dik kalır.
  const tiltG = new THREE.Group();
  tiltG.position.y = PED_H;
  root.add(tiltG);
  const pedG = new THREE.Group();
  pedG.position.y = -PED_H;
  tiltG.add(pedG);
  const body = new THREE.Group();
  tiltG.add(body);
  const meshes = [];
  const add = (parent, geo, mat, cast = true) => { const m = new THREE.Mesh(geo, mat); m.castShadow = cast; m.receiveShadow = true; parent.add(m); meshes.push(m); return m; };
  pedestal(p, add, pedG);
  root.userData.pedestal = pedG.userData.pedestal;
  const n = spin.frames.length;
  const step = opts.lite ? Math.max(1, Math.round(n / 15)) : 1; // küçük görünümlerde ~15 kare yeter
  const CAP = opts.lite ? Math.ceil(n / step) : 14; // ekran kartında aynı anda açık kare sayısı
  const MAXH = opts.lite ? 420 : 0;
  const ring = new Map(); // kare → { tex, used }
  const pending = new Set();
  let blobs = null;
  let lastSeen = 0;
  let rendererRef = null;
  const blobOf = (i) => {
    if (!blobs) blobs = new Array(n);
    if (!blobs[i]) blobs[i] = queueFetch(spin.frames[i]);
    return blobs[i];
  };
  const prefetch = () => { if (blobs) return; for (let i = 0; i < n; i += step) blobOf(i); };
  const keep = new Set();
  function evict() {
    if (ring.size <= CAP) return;
    const list = [...ring.entries()].filter(([i]) => !keep.has(i)).sort((a, b) => a[1].used - b[1].used);
    for (const [i, e] of list) {
      if (ring.size <= CAP) break;
      e.tex.dispose();
      e.tex.image.close?.();
      ring.delete(i);
    }
  }
  async function decode(i) {
    try {
      const img = await decodeFrame(await blobOf(i), MAXH);
      if (!blobs) { img.close?.(); return; } // bu arada bellekten bırakıldıysa
      const tex = new THREE.Texture(img);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.flipY = false; // ImageBitmap çevrilemez: kaydırma gölgelendiricide yapılır
      tex.anisotropy = 4;
      tex.generateMipmaps = true;
      tex.minFilter = THREE.LinearMipmapLinearFilter;
      tex.needsUpdate = true;
      if (rendererRef) rendererRef.initTexture(tex); // ilk kullanımda takılmasın
      ring.set(i, { tex, used: performance.now() });
      evict();
    } catch (e) { /* ağ hatası: bir sonraki istekte yeniden denenir */ if (blobs) blobs[i] = null; }
    pending.delete(i);
  }
  const norm = (i) => { i = ((i % n) + n) % n; return i - (i % step); };
  const need = (i) => { // kareyi iste; hazırsa dokusunu ver
    i = norm(i);
    const e = ring.get(i);
    if (e) { e.used = performance.now(); return e.tex; }
    if (!pending.has(i) && pending.size < 4) { pending.add(i); decode(i); }
    return null;
  };
  // Ekranda görünmeyen modelin kareleri bellekten bırakılır, görününce yeniden yüklenir
  SPIN_FIGS.add({ idle: () => performance.now() - lastSeen > 6000, drop: () => {
    if (!blobs && !ring.size) return;
    blobs = null;
    for (const e of ring.values()) { e.tex.dispose(); e.tex.image.close?.(); }
    ring.clear();
  } });
  // Zemin hizası (spin_ground.py ile turntable karelerinden ölçülür, boy oranı cinsinden):
  //  g    : dönüş ekseninin zemine değdiği noktanın karenin altından yüksekliği
  //  top  : başın en üst noktasının karenin üstünden uzaklığı
  //  tilt : Tripo kamerasının eğimi (öndeki zemin noktası karede tilt × derinlik kadar aşağıda)
  //  feet : her ayağın gövde koordinatı [x, z, kalkıklık] (ölçüm raporu için)
  //  soles: her karede görünen ayak tabanları [x, yarı genişlik, taban boşluğu]; gölgeler bunlardan
  // Model katı bir dönüş tablası üzerinde çekildiği için bu değer tüm kareler için sabittir:
  // ayaklar dönüş sırasında yukarı-aşağı oynamaz, eksen satırı kaidenin üst yüzeyine oturur.
  const G = spin.ground || { g: 0, top: 0, tilt: 0.28, feet: [], soles: [] };
  // Baştan zemine boy her modelde SUBJECT_H: ürün değişince figür aynı görsel büyüklükte kalır
  const Hh = SUBJECT_H / Math.max(0.5, 1 - (G.top || 0) - G.g);
  const geo = new THREE.PlaneGeometry(Hh * spin.aspect, Hh);
  geo.translate(0, Hh / 2 - G.g * Hh, 0);
  // İki komşu kare arasında yumuşak geçiş: dönüş titremeden akar.
  // zBias: karede eksenin önünde kalan ayak parmakları kaidenin üst yüzeyine gömülmesin diye
  // yalnızca derinlik değeri kameraya doğru kaydırılır (ekrandaki konum değişmez).
  // Kenarlar: alfa kenarı ekran pikseline göre keskinleştirilip MSAA örneklerine dağıtılır
  // (alphaToCoverage) — tırtıklı kesik yerine pürüzsüz, halesiz bir kontur.
  // Doku örneklemesi hafif negatif LOD sapmasıyla: küçültülmüş karelerde desenler yumuşamaz.
  // Işık: kare içindeki fotoğraf ışığı korunur; yalnızca sahnenin arka ışıklarıyla uyumlu ince
  // bir kenar ışığı (saç/omuz) ve ayak tabanında hafif temas gölgesi eklenir.
  const rimL = new THREE.Color('#d9ecff');
  const rimR = new THREE.Color('#ffe1f2');
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      mapA: { value: null }, mapB: { value: null }, mixT: { value: 0 }, zBias: { value: 0 },
      texel: { value: new THREE.Vector2(1 / 480, 1 / 1600) }, axisV: { value: G.g },
      rimL: { value: rimL }, rimR: { value: rimR }, rimK: { value: opts.lite ? 0 : 0.18 },
    },
    vertexShader: `uniform float zBias; varying vec2 vUv;
      void main(){ vUv = uv; vec4 mv = modelViewMatrix * vec4(position, 1.0); vec4 c = projectionMatrix * mv;
        vec4 b = projectionMatrix * vec4(mv.xy, mv.z + zBias, 1.0); gl_Position = vec4(c.xy, b.z / b.w * c.w, c.w); }`,
    fragmentShader: `uniform sampler2D mapA; uniform sampler2D mapB; uniform float mixT; uniform vec2 texel;
      uniform float axisV; uniform vec3 rimL; uniform vec3 rimR; uniform float rimK; varying vec2 vUv;
      vec2 fl(vec2 uv){ return vec2(uv.x, 1.0 - uv.y); } // kareler üstten alta yüklenir
      float alphaAt(vec2 uv, float t){ return mix(texture2D(mapA, fl(uv)).a, texture2D(mapB, fl(uv)).a, t); }
      void main(){
        float t = smoothstep(0.12, 0.88, mixT); // 3° aralıklı karelerde yumuşak, kesintisiz geçiş
        vec4 c = mix(texture2D(mapA, fl(vUv), -0.5), texture2D(mapB, fl(vUv), -0.5), t);
        if (c.a < 0.03) discard;
        vec3 col = c.rgb;
        if (vUv.y < axisV + 0.05) { // ayak tabanı: altı boş olan pikseller hafifçe koyulaşır
          float below = alphaAt(vUv - vec2(0.0, texel.y * 3.0), t) * alphaAt(vUv - vec2(0.0, texel.y * 9.0), t);
          col *= 1.0 - 0.16 * (1.0 - below) * (1.0 - smoothstep(axisV, axisV + 0.05, vUv.y));
        }
        if (rimK > 0.0 && vUv.y > 0.5) { // arka ışık: saç ve omuz konturunda ince açık çizgi
          float up = smoothstep(0.5, 0.78, vUv.y) * rimK;
          float l = alphaAt(vUv + vec2(-texel.x * 4.0, texel.y * 2.0), t);
          float r = alphaAt(vUv + vec2(texel.x * 4.0, texel.y * 2.0), t);
          // beyaza çekmek yerine kendi rengini hafifçe aydınlatır (hale oluşturmaz)
          col += (col * 0.5 + rimL * 0.25) * (1.0 - l) * up + (col * 0.5 + rimR * 0.25) * (1.0 - r) * up;
        }
        float aa = clamp((c.a - 0.5) / max(fwidth(c.a), 1e-3) + 0.5, 0.0, 1.0);
        gl_FragColor = vec4(col, aa);
        #include <colorspace_fragment>
      }`,
    side: THREE.DoubleSide,
    toneMapped: false,
    alphaToCoverage: true,
  });
  const plane = new THREE.Mesh(geo, mat);
  plane.castShadow = false;
  plane.renderOrder = 2;
  body.add(plane);
  meshes.push(plane);
  // Temas gölgeleri: her ayağın altında koyu çekirdek + yumuşak yayılım, figürün altında hafif ortam gölgesi
  const contact = new THREE.Group();
  contact.position.y = 0.006;
  body.add(contact);
  const ao = shadowDisc(0.16);
  ao.scale.set(Hh * 0.17, 1, Hh * 0.11);
  contact.add(ao);
  // Her ayak lekesi için bir çift gölge (koyu çekirdek + yumuşak yayılım); karede en fazla 3 leke
  const soles = [0, 1, 2].map(() => {
    const soft = shadowDisc(0.3);
    const core = shadowDisc(0.6);
    contact.add(soft, core);
    return { soft, core };
  });
  const E = 0.04; // ayağın en alt noktası, ayak merkezinin bu kadar önünde (boy oranı)
  const ws = new THREE.Vector3();
  const camR = new THREE.Vector3();
  const tiltAxis = new THREE.Vector3();
  const TILT_T = Math.atan(G.tilt); // Tripo kamerasının zemine bakış açısı
  let lastF = 0;
  let dirF = 1;
  // Her karede (ve her kamera için) bir kez: figürün ilk çizilen parçası eğimi, kare seçimini ve
  // gölgeleri hesaplar; böylece kaide, gölgeler ve figür aynı karede aynı dönüşümle çizilir.
  let syncFrame = -1;
  let syncCam = null;
  const sync = (renderer, scene, camera) => {
    const fr = renderer.info.render.frame;
    if (fr === syncFrame && camera === syncCam) return;
    syncFrame = fr;
    syncCam = camera;
    lastSeen = performance.now();
    rendererRef = renderer;
    prefetch();
    root.getWorldScale(ws);
    // Kamera, kaide merkezine göre (kök koordinatında): yön açısı ve yükseklik açısı
    camR.copy(camera.position);
    root.worldToLocal(camR);
    const phi = Math.atan2(camR.x, camR.z);
    const horiz = Math.max(1e-3, Math.hypot(camR.x, camR.z));
    const elev = Math.atan2(camR.y - PED_H, horiz);
    // Zemini Tripo kamerasının açısına getiren eğim (kd = 1 olacak şekilde), makul sınırlar içinde
    const want = Math.asin(Math.min(0.95, G.tilt * Math.cos(elev)));
    const delta = Math.max(-0.12, Math.min(TILT_MAX, want - elev));
    tiltAxis.set(Math.cos(phi), 0, -Math.sin(phi));
    tiltG.quaternion.setFromAxisAngle(tiltAxis, delta);
    // Karedeki derinlik z, tilt·z kadar aşağıda çizilir; ekranda aynı yere düşen zemin derinliği z·kd
    const kd = Math.max(0.5, Math.min(3.2, (G.tilt * Math.cos(elev)) / Math.max(0.05, Math.sin(elev + delta))));
    const ang = ((phi % TAU) + TAU) % TAU;
    const f = (ang / TAU) * (n / step);
    let i0 = (Math.floor(f) * step) % n;
    let i1 = (i0 + step) % n;
    let t = f - Math.floor(f);
    // Dönüş yönünü izle ve sıradaki kareleri önceden aç
    const df = ((f - lastF + n / step / 2) % (n / step) + n / step) % (n / step) - n / step / 2;
    if (Math.abs(df) > 1e-4) dirF = Math.sign(df);
    lastF = f;
    keep.clear();
    keep.add(i0).add(i1);
    let A = need(i0);
    let B = need(i1);
    for (let k = 1; k <= 4; k++) need(i0 + dirF * step * (k + (dirF > 0 ? 1 : 0)));
    if (!A || !B) { // henüz açılmadıysa en yakın hazır kare; hiçbiri yoksa görünmez kal
      let best = null;
      let bd = Infinity;
      for (const [i, e] of ring) {
        const d = Math.min(Math.abs(i - i0), n - Math.abs(i - i0));
        if (d < bd) { bd = d; best = e; }
      }
      A = B = best ? best.tex : null;
      t = 0;
      if (best) best.used = performance.now();
    }
    mat.uniforms.mapA.value = A || EMPTY;
    mat.uniforms.mapB.value = B || EMPTY;
    mat.uniforms.mixT.value = t;
    i1 = A && B ? i1 : i0;
    const im = A && A.image;
    if (im && im.width) mat.uniforms.texel.value.set(1 / im.width, 1 / im.height);
    plane.rotation.set(-delta, phi, 0, 'YXZ'); // kameraya dönük, dünyada dik
    contact.rotation.y = phi;
    const ped = root.userData.pedestal;
    const pedR = PED_R * (ped ? ped.scale.x : 1); // dizilimde kaide küçültülmüş olabilir
    mat.uniforms.zBias.value = pedR * 0.92 * ws.z;
    // Gölgeler o karede görünen ayak tabanlarının altına: karedeki yatay konum + tabandan bulunan derinlik
    const fi = t < 0.5 || i1 < 0 ? i0 : i1;
    const row = (fi >= 0 && G.soles && G.soles[fi]) || [];
    soles.forEach((sh, k) => {
      const on = k * 3 + 2 < row.length;
      sh.core.visible = sh.soft.visible = on;
      if (!on) return;
      const x = row[k * 3] * Hh;
      const hw = row[k * 3 + 1] * Hh;
      const z = ((G.g - row[k * 3 + 2]) / G.tilt - E) * Hh * kd;
      const zv = Math.max(-pedR * 0.85, Math.min(pedR * 0.85, z));
      const d = Math.min(kd, 1.6);
      sh.core.position.set(x, 0.001, zv);
      sh.core.scale.set(hw * 1.05, 1, 0.34 * d);
      sh.soft.position.set(x + 0.06, 0, zv - 0.06);
      sh.soft.scale.set(hw * 1.9 + 0.2, 1, 0.75 * d);
    });
    tiltG.updateMatrixWorld(true);
  };
  tiltG.traverse((o) => { if (o.isMesh) o.onBeforeRender = sync; });
  const head = new THREE.Group();
  const arms = [new THREE.Group(), new THREE.Group()];
  const anchors = { baski: new THREE.Vector3(0, 6.9, 0.6), desen: new THREE.Vector3(-0.8, 2.8, 0.3), manset: new THREE.Vector3(0.45, 0.7, 0.3) };
  // Etiket ve yakınlaşma noktaları: ürünün ön karesindeki konumdan (p.spots, 0–1) figür düzlemine
  const anchorWorld = (key, out) => {
    const sp = p.spots && p.spots[key];
    if (!sp) return out.copy(anchors[key] || anchors.baski).applyMatrix4(body.matrixWorld);
    out.set((sp[0] - 0.5) * Hh * spin.aspect, Hh * (1 - G.g - sp[1]), 0);
    return plane.localToWorld(out);
  };
  // Kadraj için: verilen kamera yükseklik açısında başın tepesi ve kaidenin en alt ön noktası
  // (kök koordinatında, ölçeksiz). Eğim, sync() ile aynı formülden hesaplanır.
  const fit = (elev) => {
    const want = Math.asin(Math.min(0.95, G.tilt * Math.cos(elev)));
    const d = Math.max(-0.12, Math.min(TILT_MAX, want - elev));
    const ped = root.userData.pedestal;
    const r = PED_R * 1.03 * (ped ? ped.scale.x : 1);
    return { hy: PED_H + SUBJECT_H, hz: 0, by: PED_H - PED_H * Math.cos(d) - r * Math.sin(d), bz: -PED_H * Math.sin(d) + r * Math.cos(d), r };
  };
  return { root, body, head, arms, legs: [], eyes: [], meshes, anchors, anchorWorld, spin: true, fit };
}

/* ---------- Gerçek fotoğraf modeli: netleştirilmiş fotoğraf kaidede, kameraya dönük ---------- */
function photoFigure(p) {
  const root = new THREE.Group();
  const body = new THREE.Group();
  body.position.y = PED_H;
  root.add(body);
  const meshes = [];
  const add = (parent, geo, mat, cast = true) => { const m = new THREE.Mesh(geo, mat); m.castShadow = cast; m.receiveShadow = true; parent.add(m); meshes.push(m); return m; };
  pedestal(p, add, root);
  const mat = new THREE.MeshBasicMaterial({ transparent: true, alphaTest: 0.4, side: THREE.DoubleSide, toneMapped: false });
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
  body.add(plane);
  meshes.push(plane);
  new THREE.TextureLoader().load(p.photo, (tex) => {
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    const H = 10;
    const W = H * (tex.image.width / tex.image.height);
    plane.geometry.dispose();
    const g = new THREE.PlaneGeometry(W, H);
    g.translate(0, H / 2, 0);
    plane.geometry = g;
    mat.map = tex;
    mat.needsUpdate = true;
  });
  const shadow = new THREE.Mesh(new THREE.CircleGeometry(1.3, 48), new THREE.MeshBasicMaterial({ map: glowTex(), color: '#2b2f6b', transparent: true, opacity: 0.35, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.012;
  shadow.scale.set(1, 0.6, 1);
  body.add(shadow);
  const wp = new THREE.Vector3();
  const wq = new THREE.Quaternion();
  const e = new THREE.Euler();
  plane.onBeforeRender = (renderer, scene, camera) => {
    root.getWorldPosition(wp);
    root.getWorldQuaternion(wq);
    e.setFromQuaternion(wq, 'YXZ');
    plane.rotation.y = Math.atan2(camera.position.x - wp.x, camera.position.z - wp.z) - e.y;
    plane.updateMatrixWorld();
  };
  return { root, body, head: new THREE.Group(), arms: [new THREE.Group(), new THREE.Group()], legs: [], eyes: [], meshes, photo: true,
    anchors: { baski: new THREE.Vector3(0, 6.8, 0.2), desen: new THREE.Vector3(-0.9, 3, 0.2), manset: new THREE.Vector3(0.6, 0.8, 0.2) } };
}

/* ---------- Figür ---------- */
function buildFigure(p, cache, opts = {}) {
  if (p.model3d) return glbFigure(p);
  if (p.spin && SPINS[p.spin]) return spinFigure(p, opts);
  if (p.photo) return photoFigure(p);
  if (!p.figure) { // 3D verisi henüz yok: sadece kaide
    const root = new THREE.Group(); const body = new THREE.Group(); root.add(body); const meshes = [];
    pedestal(p, (parent, geo, mat) => { const m = new THREE.Mesh(geo, mat); parent.add(m); meshes.push(m); return m; }, root);
    return { root, body, head: new THREE.Group(), arms: [new THREE.Group(), new THREE.Group()], legs: [], eyes: [], meshes, anchors: { baski: new THREE.Vector3(0, 6, 0), desen: new THREE.Vector3(0, 3, 0), manset: new THREE.Vector3(0, 1, 0) } };
  }
  const f = p.figure;
  const face = FACES[f.face];
  const root = new THREE.Group();
  const body = new THREE.Group();
  body.position.y = PED_H;
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
  pedestal(p, add, root);
  const cloth = (tex, color = '#ffffff') => new THREE.MeshPhysicalMaterial({
    map: tex, color, roughness: 0.82, sheen: 0.7, sheenRoughness: 0.75, sheenColor: new THREE.Color('#ffffff'), side: THREE.DoubleSide,
  });
  const skinColor = face ? tone(face.skin, -0.02) : new THREE.Color(f.skin);
  const skin = new THREE.MeshPhysicalMaterial({ color: skinColor, roughness: 0.55, sheen: 0.3, sheenColor: new THREE.Color('#ffd8c8') });
  const hairMat = new THREE.MeshPhysicalMaterial({ color: f.hair.color, roughness: 0.5, sheen: 0.6, sheenColor: new THREE.Color('#fff2e0'), clearcoat: 0.1 });
  const ribTop = new THREE.MeshPhysicalMaterial({ color: f.rib, roughness: 0.75, sheen: 0.5 });
  const ribPants = new THREE.MeshPhysicalMaterial({ color: f.pantsRib || f.rib, roughness: 0.75, sheen: 0.5 });
  const sock = new THREE.MeshPhysicalMaterial({ color: f.sock || '#f6f6f8', roughness: 0.8, sheen: 0.6 });
  const topTex = fabricTexture(f.top, cache);
  const pantsTex = fabricTexture(f.pants, cache);

  // Gövde
  const torsoProfile = smoothProfile(TORSO);
  const torso = add(body, new THREE.LatheGeometry(torsoProfile, 64), cloth(repeated(topTex, 2.6, 1.5, f.top.scale)));
  torso.scale.z = TORSO_Z;
  if (f.print) {
    const ph = (f.printH || 1.55) * 0.72;
    const y1 = 7.5;
    const y0 = y1 - ph;
    const halfW = Math.min(1.05, ((f.printAspect || 1) * ph) / 2 / 0.8);
    const geo = new THREE.PlaneGeometry(1, 1, 40, 30);
    const pos = geo.attributes.position;
    const uv = geo.attributes.uv;
    for (let k = 0; k < pos.count; k++) {
      const y = y0 + uv.getY(k) * (y1 - y0);
      const phi = (uv.getX(k) - 0.5) * 2 * halfW;
      const r = radiusAt(torsoProfile, y) + 0.012;
      pos.setXYZ(k, Math.sin(phi) * r, y, Math.cos(phi) * r * TORSO_Z + 0.004);
    }
    geo.computeVertexNormals();
    const tex = new THREE.TextureLoader().load(f.print);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    const m = add(body, geo, new THREE.MeshStandardMaterial({ map: tex, transparent: true, roughness: 0.85, polygonOffset: true, polygonOffsetFactor: -2 }), false);
    m.renderOrder = 2;
  }
  const collar = add(body, new THREE.TorusGeometry(0.29, 0.06, 16, 48), ribTop);
  collar.rotation.x = Math.PI / 2;
  collar.position.y = 8.05;
  collar.scale.set(1, 0.85, 1);
  // Alt
  const pelvis = add(body, lathe(PELVIS), cloth(repeated(pantsTex, 2.6, 0.6, f.pants.scale)));
  pelvis.scale.z = 0.74;
  const legs = [];
  for (const side of [-1, 1]) {
    const g = new THREE.Group();
    g.position.set(side * 0.38, 4.75, 0);
    g.rotation.z = side * 0.035;
    body.add(g);
    add(g, lathe(LEG, 40), cloth(repeated(pantsTex, 1.5, 2.1, f.pants.scale)));
    const cuff = add(g, new THREE.CylinderGeometry(0.3, 0.29, 0.3, 32), ribPants);
    cuff.position.y = -4.13;
    const foot = add(g, new THREE.SphereGeometry(1, 32, 20), sock);
    foot.scale.set(0.24, 0.19, 0.4);
    foot.position.set(0, -4.5, 0.11);
    legs.push(g);
  }
  // Kollar
  const arms = [];
  for (const side of [-1, 1]) {
    const g = new THREE.Group();
    g.position.set(side * 0.76, 7.72, 0);
    g.rotation.z = side * 0.12;
    body.add(g);
    add(g, lathe(SLEEVE, 40), cloth(repeated(topTex, 1.2, 1.4, f.top.scale)));
    const cuff = add(g, new THREE.TorusGeometry(0.22, 0.05, 12, 36), ribTop);
    cuff.rotation.x = Math.PI / 2;
    cuff.position.y = -2.75;
    const hand = add(g, new THREE.SphereGeometry(0.17, 28, 20), skin);
    hand.scale.set(0.8, 1.15, 0.62);
    hand.position.y = -2.97;
    arms.push(g);
  }
  // Boyun + baş
  const neck = add(body, new THREE.CylinderGeometry(0.2, 0.23, 0.55, 24), skin);
  neck.position.y = 8.22;
  const head = new THREE.Group();
  head.position.set(0, 8.2, 0);
  body.add(head);
  const H = (v) => v.clone().sub(new THREE.Vector3(0, 8.2, 0));
  const skull = add(head, new THREE.SphereGeometry(HEAD_R, 64, 48), skin);
  skull.position.copy(H(HEAD_C));
  skull.scale.copy(HEAD_S);
  for (const side of [-1, 1]) {
    const ear = add(head, new THREE.SphereGeometry(0.13, 20, 16), skin);
    ear.position.copy(H(new THREE.Vector3(side * 0.71, 9.0, -0.08)));
    ear.scale.set(0.5, 1, 0.75);
  }
  const eyes = [];
  if (face) {
    const tex = new THREE.TextureLoader().load(face.img);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    // Fotoğrafın kendi ışığı korunur, sahne ışığı hafifçe eklenir
    const mat = new THREE.MeshStandardMaterial({ map: tex, emissiveMap: tex, emissive: '#ffffff', emissiveIntensity: 0.42, color: '#c4c4c4', roughness: 0.62, vertexColors: true, transparent: true, depthWrite: true });
    const fm = add(head, faceMesh(face), mat, false);
    fm.position.copy(H(new THREE.Vector3(0, 0, 0)));
    fm.renderOrder = 1;
  }
  // Saç: alından enseye kapak
  const style = f.hair.style;
  const capGeo = new THREE.SphereGeometry(HEAD_R * 1.07, 64, 40, 0, Math.PI * 2, 0, style === 'short' ? 1.42 : 1.5);
  const cap = add(head, capGeo, hairMat);
  cap.position.copy(H(HEAD_C.clone().add(new THREE.Vector3(0, 0.02, 0.05))));
  cap.scale.set(HEAD_S.x, HEAD_S.y, 1.0);
  cap.rotation.x = style === 'short' ? -0.58 : -0.66;
  if (style === 'long') {
    const back = add(head, new THREE.CapsuleGeometry(0.62, 1.1, 10, 28), hairMat);
    back.position.copy(H(new THREE.Vector3(0, 8.45, -0.42)));
    back.scale.set(1.05, 1, 0.48);
    for (const side of [-1, 1]) {
      const strand = add(head, new THREE.CapsuleGeometry(0.17, 1.0, 8, 16), hairMat);
      strand.position.copy(H(new THREE.Vector3(side * 0.66, 8.55, -0.12)));
      strand.rotation.z = side * 0.06;
      strand.scale.set(1, 1, 0.7);
    }
  }
  if (style === 'ponytail') {
    const tie = add(head, new THREE.TorusGeometry(0.11, 0.045, 10, 24), new THREE.MeshStandardMaterial({ color: f.hair.tie || '#e96bb8' }));
    tie.position.copy(H(new THREE.Vector3(0, 9.3, -0.8)));
    tie.rotation.x = 0.9;
    const tail = add(head, new THREE.CapsuleGeometry(0.17, 1.0, 8, 20), hairMat);
    tail.position.copy(H(new THREE.Vector3(0, 8.75, -0.98)));
    tail.rotation.x = 0.32;
  }

  const anchors = {
    baski: new THREE.Vector3(0, 6.9, radiusAt(torsoProfile, 6.9) * TORSO_Z + 0.05),
    desen: new THREE.Vector3(-0.42, 2.6, 0.38),
    manset: new THREE.Vector3(0.4, 0.75, 0.32),
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

  // Kadraj: figürün başının tepesi `top`, kaidenin en alt ön kenarı `bottom` ekran satırına
  // (0 = üst, 1 = alt) gelecek şekilde ölçek ve yükseklik, perspektif kamera için çözülür.
  // Kaide eğimi kamera açısına bağlı olduğundan birkaç adımda yakınsatılır.
  // `maxHalf`: kaidenin ekranda kaplayabileceği en fazla yarım genişlik (px), kartla çakışmasın.
  function frame(fig, s, X) {
    const T = Math.tan((camera.fov * Math.PI) / 360);
    const D = camera.position.z;
    const a = 1 - 2 * s.top;
    const b = 1 - 2 * s.bottom;
    let elev = 0.2;
    let k = 1;
    let Y = 0;
    let f = null;
    for (let it = 0; it < 4; it++) {
      f = fig.fit ? fig.fit(elev) : { hy: PED_H + 10.2, hz: 0, by: 0, bz: PED_R * 1.03, r: PED_R * 1.03 };
      const c1 = f.hy + a * T * f.hz;
      const c2 = f.by + b * T * f.bz;
      k = ((a - b) * T * D) / (c1 - c2);
      if (s.maxHalf) { // çok genişse küçült, alt kenarı yerinde tut
        const half = ((f.r * k) / (D * T * camera.aspect)) * (vw / 2);
        if (half > s.maxHalf) k *= s.maxHalf / half;
      }
      k *= s.scale ?? 1;
      Y = b * T * (D - k * f.bz) - k * f.by;
      elev = Math.atan2(-(Y + k * PED_H), Math.hypot(D, X));
    }
    return { k, Y };
  }

  const blinkNow = blinker();
  // states[i] = { x, top, bottom (ekran oranları), maxHalf (px), rotY, rotX, scale, opacity }
  // focus = { i, key, amt (0–1), sx, sy }: etiketin gösterdiği bölgeye yakınlaşma
  const CAM_Z = camera.position.z;
  const FOCUS_ZOOM = 2.6; // karelerin çözünürlüğü bu yakınlıkta hâlâ net
  const target = new THREE.Vector3();
  function render(states, t, focus = null) {
    camera.position.set(0, 0, CAM_Z); // kadraj hesabı sabit kameraya göre yapılır
    let floorY = 0;
    const blink = blinkNow(t);
    figs.forEach((fig, i) => {
      const s = states[i];
      const on = s.opacity > 0.02;
      fig.root.visible = on;
      if (!on) return;
      const X = (s.x - 0.5) * visW;
      const { k, Y } = frame(fig, s, X);
      floorY = Y;
      fig.root.position.set(X, Y - (1 - s.opacity) * 0.6, 0);
      fig.root.scale.setScalar(k);
      fig.root.rotation.y = s.rotY;
      fig.body.rotation.x = s.rotX || 0;
      animateFigure(fig, t, i, blink);
    });
    ground.position.y = floorY;
    key.target.position.set(0, floorY, 0);
    if (focus && figs[focus.i] && figs[focus.i].root.visible) {
      // Hedef noktayı ekranda (sx, sy) konumuna getirip kamerayı ona doğru yaklaştır; kamera
      // dönmez, yalnızca ilerler: figür kameraya dönük kalır, ayak/kaide hizası bozulmaz
      const fig = figs[focus.i];
      fig.root.updateMatrixWorld(true);
      if (fig.anchorWorld) fig.anchorWorld(focus.key, target);
      else target.set(fig.root.position.x, fig.root.position.y + 5 * fig.root.scale.y, 0);
      const T = Math.tan((camera.fov * Math.PI) / 360);
      const dz = (CAM_Z - target.z) / FOCUS_ZOOM;
      const ex = target.x - (focus.sx * 2 - 1) * dz * T * camera.aspect;
      const ey = target.y + (focus.sy * 2 - 1) * dz * T;
      const e = focus.amt * focus.amt * (3 - 2 * focus.amt);
      camera.position.set(ex * e, ey * e, CAM_Z + (target.z + dz - CAM_Z) * e);
    }
    renderer.render(scene, camera);
  }

  const v3 = new THREE.Vector3();
  const camDir = new THREE.Vector3();
  function project(i, keyName) {
    const fig = figs[i];
    if (!fig.root.visible) return null;
    if (fig.anchorWorld) fig.anchorWorld(keyName, v3);
    else { v3.copy(fig.anchors[keyName]); fig.body.localToWorld(v3); }
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
