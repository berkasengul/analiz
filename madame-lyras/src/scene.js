import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

const TAU = Math.PI * 2;
const smooth = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const damp = (a, b, k, dt) => a + (b - a) * (1 - Math.exp(-k * dt));

// Basit, tekrarlanabilir rastgele sayı
function rng(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

// Pürüzlü yüzey için köşe noktalarını hafifçe oynatır
function roughen(geo, amount, seed = 1) {
  const r = rng(seed);
  const p = geo.attributes.position;
  const n = geo.attributes.normal;
  const map = new Map();
  for (let i = 0; i < p.count; i++) {
    const key = `${p.getX(i).toFixed(4)}|${p.getY(i).toFixed(4)}|${p.getZ(i).toFixed(4)}`;
    let d = map.get(key);
    if (d === undefined) { d = (r() - 0.5) * amount; map.set(key, d); }
    p.setXYZ(i, p.getX(i) + n.getX(i) * d, p.getY(i) + n.getY(i) * d, p.getZ(i) + n.getZ(i) * d);
  }
  geo.computeVertexNormals();
  return geo;
}

/* ------------------------------------------------------------------ */
/* Kilitli ayaklı paket (doypack)                                      */
/* ------------------------------------------------------------------ */
function pouchSurface({ w, h, depth, side }) {
  const SX = 56, SY = 72;
  const pos = [], uv = [], idx = [];
  for (let j = 0; j <= SY; j++) {
    const v = j / SY;
    for (let i = 0; i <= SX; i++) {
      const u = i / SX;
      const bulgeU = Math.pow(Math.sin(Math.PI * u), 0.5);
      const top = 1 - smooth(0.8, 0.915, v);
      const bottom = 0.62 + 0.38 * smooth(0.0, 0.22, v) - 0.22 * smooth(0.3, 0.8, v);
      const t = depth * bulgeU * top * bottom;
      // dolu kısım yanlardan hafif içe çekilir
      const pinch = 1 - 0.07 * (t / depth);
      // üst kısımda hafif kırışıklık
      const wrinkle = 0.004 * Math.sin(u * 23 + v * 7) * top * (1 - v * 0.5);
      const x = (u - 0.5) * w * pinch;
      const y = (v - 0.5) * h;
      pos.push(x, y, side * (t + wrinkle * bulgeU));
      uv.push(side > 0 ? u : 1 - u, v);
    }
  }
  const row = SX + 1;
  for (let j = 0; j < SY; j++) {
    for (let i = 0; i < SX; i++) {
      const a = j * row + i, b = a + 1, c = a + row, d = c + 1;
      if (side > 0) idx.push(a, b, d, a, d, c);
      else idx.push(a, d, b, a, c, d);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return { g, SX };
}

function pouchBottom(front, back, SX) {
  // ön ve arka yüzün alt sıralarını birleştiren taban
  const fp = front.attributes.position, bp = back.attributes.position;
  const pos = [], idx = [];
  for (let i = 0; i <= SX; i++) {
    pos.push(fp.getX(i), fp.getY(i), fp.getZ(i));
    pos.push(bp.getX(i), bp.getY(i), bp.getZ(i));
  }
  for (let i = 0; i < SX; i++) {
    const a = i * 2, b = a + 1, c = a + 2, d = a + 3;
    idx.push(a, b, c, b, d, c);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

// Arka etiket: ön dokunun renklerinden üretilir
function makeBackTexture(img, flavor, logo) {
  const W = 1024, H = 1180;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const x = c.getContext('2d', { willReadFrequently: true });
  x.drawImage(img, 0, 0, W, H);
  const sample = (sx, sy, sw, sh) => {
    const d = x.getImageData(sx, sy, sw, sh).data;
    let r = 0, g = 0, b = 0, n = 0;
    for (let i = 0; i < d.length; i += 16) { r += d[i]; g += d[i + 1]; b += d[i + 2]; n++; }
    return `rgb(${(r / n) | 0},${(g / n) | 0},${(b / n) | 0})`;
  };
  const top = sample(380, 420, 260, 120);
  const bot = sample(380, 1000, 260, 100);
  // üst kilit ve kaynak bölgesi fotoğraftan aynen kalsın, altı yeniden boyansın
  const grad = x.createLinearGradient(0, 230, 0, H);
  grad.addColorStop(0, top);
  grad.addColorStop(1, bot);
  x.fillStyle = grad;
  x.fillRect(0, 230, W, H - 230);
  const fade = x.createLinearGradient(0, 180, 0, 260);
  fade.addColorStop(0, 'rgba(0,0,0,0)');
  fade.addColorStop(1, top);
  x.fillStyle = fade;
  x.fillRect(0, 180, W, 80);
  // parlama
  const sh = x.createLinearGradient(0, 0, W, 0);
  sh.addColorStop(0, 'rgba(0,0,0,.18)');
  sh.addColorStop(0.18, 'rgba(255,255,255,.10)');
  sh.addColorStop(0.5, 'rgba(255,255,255,0)');
  sh.addColorStop(0.85, 'rgba(0,0,0,.05)');
  sh.addColorStop(1, 'rgba(0,0,0,.2)');
  x.fillStyle = sh;
  x.fillRect(0, 0, W, H);

  const ink = flavor.ink === 'dark' ? '#3b1d05' : '#fff';
  x.fillStyle = ink;
  x.strokeStyle = ink;
  if (logo) x.drawImage(logo, W / 2 - 110, 290, 220, 220);
  x.textAlign = 'center';
  x.font = '600 64px Fraunces, Georgia, serif';
  x.fillText("Madame Lyra's", W / 2, 600);
  x.font = '500 34px Manrope, Arial, sans-serif';
  x.fillText(`Dondurularak Kurutulmuş ${flavor.name}`, W / 2, 652);
  x.globalAlpha = 0.5;
  x.fillRect(W / 2 - 160, 690, 320, 2);
  x.globalAlpha = 1;
  x.textAlign = 'left';
  const lines = [
    ['İçindekiler', `%100 ${flavor.name.toLocaleLowerCase('tr')}`],
    ['Net ağırlık', '16 g'],
    ['', 'Şeker ilavesizdir.'],
    ['', 'Katkı maddesi, koruyucu ve'],
    ['', 'renklendirici içermez.'],
  ];
  let y = 760;
  for (const [k, v] of lines) {
    if (k) {
      x.font = '700 30px Manrope, Arial, sans-serif';
      x.fillText(k.toUpperCase(), 190, y);
      x.font = '500 32px Manrope, Arial, sans-serif';
      x.fillText(v, 470, y);
    } else {
      x.font = '500 30px Manrope, Arial, sans-serif';
      x.fillText(v, 190, y);
    }
    y += 52;
  }
  x.font = '500 22px Manrope, Arial, sans-serif';
  x.globalAlpha = 0.75;
  x.textAlign = 'center';
  x.fillText('Açtıktan sonra kilidini kapatıp serin ve kuru yerde saklayınız.', W / 2, 1060);
  x.fillText('Üretim: Solagron Tarım Ürünleri · Silifke OSB, Mersin', W / 2, 1096);
  x.globalAlpha = 1;
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

function makePouch() {
  const w = 1, h = 1.153, depth = 0.2;
  const f = pouchSurface({ w, h, depth, side: 1 });
  const b = pouchSurface({ w, h, depth, side: -1 });
  const bottomGeo = pouchBottom(f.g, b.g, f.SX);
  const film = {
    roughness: 0.34,
    metalness: 0.12,
    clearcoat: 0.7,
    clearcoatRoughness: 0.28,
    envMapIntensity: 0.55,
  };
  const frontMat = new THREE.MeshPhysicalMaterial({ ...film });
  const backMat = new THREE.MeshPhysicalMaterial({ ...film });
  const bottomMat = new THREE.MeshPhysicalMaterial({ ...film, color: 0x8a0a0a, side: THREE.DoubleSide });
  const group = new THREE.Group();
  const front = new THREE.Mesh(f.g, frontMat);
  const back = new THREE.Mesh(b.g, backMat);
  const bottom = new THREE.Mesh(bottomGeo, bottomMat);
  group.add(front, back, bottom);
  return { group, frontMat, backMat, bottomMat };
}

/* ------------------------------------------------------------------ */
/* Kurutulmuş meyve parçaları                                          */
/* ------------------------------------------------------------------ */
function canvasTex(size, draw) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  draw(c.getContext('2d'), size);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function strawberryPiece() {
  const pts = [];
  const N = 22;
  for (let i = 0; i <= N; i++) {
    const t = i / N; // 0 = uç, 1 = sap tarafı
    const r = 0.078 * Math.pow(Math.sin(Math.PI * Math.pow(t, 2.1)), 0.62) * (0.55 + 0.45 * t);
    pts.push(new THREE.Vector2(Math.max(0.0005, r), -0.085 + t * 0.165));
  }
  const g = new THREE.LatheGeometry(pts, 26);
  roughen(g, 0.008, 7);
  const map = canvasTex(256, (x, s) => {
    const r = rng(3);
    x.fillStyle = '#a8172a';
    x.fillRect(0, 0, s, s);
    for (let i = 0; i < 900; i++) {
      x.fillStyle = `rgba(${170 + r() * 60},${30 + r() * 50},${45 + r() * 40},${0.25 + r() * 0.3})`;
      x.beginPath(); x.arc(r() * s, r() * s, 2 + r() * 7, 0, TAU); x.fill();
    }
    for (let i = 0; i < 160; i++) {
      x.fillStyle = `rgba(250,${200 + r() * 40},${120 + r() * 40},.85)`;
      x.beginPath(); x.ellipse(r() * s, r() * s, 1.6, 2.6, r() * 3, 0, TAU); x.fill();
    }
  });
  return { geo: g, mat: new THREE.MeshStandardMaterial({ map, roughness: 0.92, metalness: 0, envMapIntensity: 0.35 }), scale: 1 };
}

function appleRing() {
  const shape = new THREE.Shape();
  const R = 0.105;
  for (let i = 0; i <= 48; i++) {
    const a = (i / 48) * TAU;
    const rr = R * (1 + 0.04 * Math.sin(a * 3) + 0.02 * Math.cos(a * 5));
    if (i === 0) shape.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
    else shape.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
  }
  const hole = new THREE.Path();
  hole.absarc(0, 0, 0.022, 0, TAU, true);
  shape.holes.push(hole);
  const g = new THREE.ExtrudeGeometry(shape, { depth: 0.012, bevelEnabled: true, bevelThickness: 0.004, bevelSize: 0.004, bevelSegments: 2, curveSegments: 40 });
  g.translate(0, 0, -0.006);
  roughen(g, 0.004, 11);
  const map = canvasTex(256, (x, s) => {
    const r = rng(9);
    const c = s / 2;
    const gr = x.createRadialGradient(c, c, 0, c, c, c);
    gr.addColorStop(0, '#efe2c2');
    gr.addColorStop(0.8, '#f6ecd3');
    gr.addColorStop(0.9, '#e9d6ad');
    gr.addColorStop(0.95, '#b3242a');
    gr.addColorStop(1, '#7e1418');
    x.fillStyle = gr;
    x.fillRect(0, 0, s, s);
    x.strokeStyle = 'rgba(190,160,110,.35)';
    x.lineWidth = 2;
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * TAU;
      x.beginPath(); x.ellipse(c + Math.cos(a) * 34, c + Math.sin(a) * 34, 16, 6, a, 0, TAU); x.stroke();
    }
    for (let i = 0; i < 500; i++) {
      x.fillStyle = `rgba(${170 + r() * 50},${140 + r() * 40},${90 + r() * 40},.12)`;
      x.fillRect(r() * s, r() * s, 2 + r() * 4, 1 + r() * 2);
    }
  });
  map.repeat.set(1 / 0.24, 1 / 0.24);
  map.offset.set(0.5, 0.5);
  map.wrapS = map.wrapT = THREE.ClampToEdgeWrapping;
  const face = new THREE.MeshStandardMaterial({ map, roughness: 0.95, envMapIntensity: 0.4 });
  const side = new THREE.MeshStandardMaterial({ color: 0xa3262a, roughness: 0.85 });
  return { geo: g, mat: [face, side], scale: 1 };
}

function mangoCube() {
  const g = new RoundedBoxGeometry(0.1, 0.085, 0.09, 3, 0.022);
  roughen(g, 0.01, 5);
  const col = [];
  const r = rng(21);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const k = 0.85 + r() * 0.15;
    col.push(1 * k, (0.36 + p.getY(i) * 1.1) * k, 0.03 * k);
  }
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  return { geo: g, mat: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.88, envMapIntensity: 0.4 }), scale: 1 };
}

function raspberry() {
  const parts = [];
  const r = rng(13);
  const rows = 6;
  for (let j = 0; j < rows; j++) {
    const t = j / (rows - 1);
    const ring = Math.max(1, Math.round(4 + 7 * Math.sin(Math.PI * (0.25 + t * 0.6))));
    const radius = 0.058 * Math.sin(Math.PI * (0.18 + t * 0.62)) + 0.006;
    const y = -0.06 + t * 0.11;
    for (let i = 0; i < ring; i++) {
      const a = (i / ring) * TAU + j * 0.5;
      const s = new THREE.SphereGeometry(0.019 + r() * 0.004, 9, 7);
      s.translate(Math.cos(a) * radius, y, Math.sin(a) * radius);
      parts.push(s);
    }
  }
  const top = new THREE.SphereGeometry(0.02, 9, 7);
  top.translate(0, -0.068, 0);
  parts.push(top);
  const g = mergeGeometries(parts);
  const col = [];
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const k = 0.8 + 0.2 * Math.sin(i * 0.37);
    col.push(0.62 * k, 0.07 * k, 0.17 * k);
  }
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  return { geo: g, mat: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, envMapIntensity: 0.35 }), scale: 1 };
}

const PIECES = { strawberry: strawberryPiece, apple: appleRing, mango: mangoCube, raspberry };

/* ------------------------------------------------------------------ */
/* Sahne                                                               */
/* ------------------------------------------------------------------ */
export function createScene(canvas, flavors, onProgress) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
  camera.position.set(0, 0, 5);

  const key = new THREE.DirectionalLight(0xfff4e6, 2.2);
  key.position.set(2.5, 3, 4);
  const rim = new THREE.DirectionalLight(0xffffff, 1.4);
  rim.position.set(-3, 1.5, -2);
  scene.add(key, rim, new THREE.AmbientLight(0xffffff, 0.35));

  // sahne kökü: paket + meyve bulutu birlikte hareket eder
  const root = new THREE.Group();
  scene.add(root);

  const pouch = makePouch();
  const pouchHolder = new THREE.Group();
  pouchHolder.add(pouch.group);
  root.add(pouchHolder);

  // yumuşak gölge
  const shadowTex = canvasTex(128, (x, s) => {
    const g = x.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    g.addColorStop(0, 'rgba(0,0,0,.45)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = g; x.fillRect(0, 0, s, s);
  });
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.35), new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false }));
  shadow.position.set(0, -0.82, -0.2);
  root.add(shadow);

  // meyve bulutları
  const COUNT = 18;
  const clouds = flavors.map((fl, fi) => {
    const def = PIECES[fl.piece]();
    const mesh = new THREE.InstancedMesh(def.geo, def.mat, COUNT);
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    mesh.frustumCulled = false;
    const r = rng(100 + fi * 17);
    const items = [];
    for (let i = 0; i < COUNT; i++) {
      const a = (i / COUNT) * TAU + r() * 0.5;
      const ring = 0.85 + r() * 0.9;
      items.push({
        base: new THREE.Vector3(Math.cos(a) * ring * 1.15, (r() - 0.5) * 1.9, Math.sin(a) * ring * 0.8 - 0.15),
        rot: new THREE.Euler(r() * TAU, r() * TAU, r() * TAU),
        spin: new THREE.Vector3((r() - 0.5) * 0.9, (r() - 0.5) * 0.9, (r() - 0.5) * 0.6),
        phase: r() * TAU,
        size: 0.8 + r() * 0.75,
      });
    }
    root.add(mesh);
    return { mesh, items, mix: fi === 0 ? 1 : 0 };
  });

  // soğuk süreç bölümü için kırağı parçacıkları
  const frostCount = 500;
  const fpos = new Float32Array(frostCount * 3);
  {
    const r = rng(77);
    for (let i = 0; i < frostCount; i++) {
      fpos[i * 3] = (r() - 0.5) * 7;
      fpos[i * 3 + 1] = (r() - 0.5) * 4.5;
      fpos[i * 3 + 2] = (r() - 0.5) * 3 - 0.5;
    }
  }
  const frostGeo = new THREE.BufferGeometry();
  frostGeo.setAttribute('position', new THREE.BufferAttribute(fpos, 3));
  const frostMat = new THREE.PointsMaterial({
    size: 0.03,
    map: canvasTex(64, (x, s) => {
      const g = x.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
      g.addColorStop(0, 'rgba(235,248,255,1)');
      g.addColorStop(0.4, 'rgba(200,230,255,.5)');
      g.addColorStop(1, 'rgba(200,230,255,0)');
      x.fillStyle = g; x.fillRect(0, 0, s, s);
    }),
    transparent: true,
    depthWrite: false,
    opacity: 0,
    blending: THREE.AdditiveBlending,
  });
  const frost = new THREE.Points(frostGeo, frostMat);
  scene.add(frost);

  /* ---- dokular ---- */
  const loader = new THREE.TextureLoader();
  const fronts = [], backs = [];
  let logoImg = null;
  const logoReady = new Promise((res) => {
    const im = new Image();
    im.onload = () => { logoImg = im; res(); };
    im.onerror = () => res();
    im.src = '/logo.svg';
  });
  let loaded = 0;
  const ready = Promise.all(
    flavors.map((fl, i) =>
      new Promise((res) => {
        loader.load(fl.tex, (t) => {
          t.colorSpace = THREE.SRGBColorSpace;
          t.anisotropy = renderer.capabilities.getMaxAnisotropy();
          fronts[i] = t;
          loaded++;
          onProgress?.(loaded / flavors.length);
          res();
        });
      })
    )
  ).then(async () => {
    await logoReady;
    try { await document.fonts?.ready; } catch (e) { /* yazı tipi yüklenemezse yedek kullanılır */ }
    flavors.forEach((fl, i) => { backs[i] = makeBackTexture(fronts[i].image, fl, logoImg); });
    applyFlavor(0, true);
  });

  const bottomColors = flavors.map((f) => new THREE.Color(f.bg).multiplyScalar(0.75));

  /* ---- durum ---- */
  let flavor = 0;
  let pendingFront = -1;
  let spin = 0, spinTarget = 0;
  const state = { x: 0, y: 0, s: 1, ry: 0, rz: 0, cloud: 1, frost: 0 };
  const target = { ...state };
  const pointer = { x: 0, y: 0, sx: 0, sy: 0 };
  let scrollVel = 0;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function applyFlavor(i, instant) {
    if (!fronts[i]) return;
    if (instant) {
      pouch.frontMat.map = fronts[i];
      pouch.backMat.map = backs[i];
      pouch.frontMat.needsUpdate = pouch.backMat.needsUpdate = true;
      pouch.bottomMat.color.copy(bottomColors[i]);
      return;
    }
    // arka yüz hemen değişir; ön yüz paket arkasını dönünce değişir
    pouch.backMat.map = backs[i];
    pouch.backMat.needsUpdate = true;
    pendingFront = i;
  }

  function setFlavor(i) {
    if (i === flavor || i < 0) return;
    const dir = i > flavor ? 1 : -1;
    flavor = i;
    if (reduce) { applyFlavor(i, true); return; }
    spinTarget = Math.round(spinTarget / TAU) * TAU + dir * TAU;
    applyFlavor(i, false);
  }

  function setPose(p) { Object.assign(target, p); }

  function resize() {
    const w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize);
  resize();

  window.addEventListener('pointermove', (e) => {
    pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
  }, { passive: true });

  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e3 = new THREE.Euler(), v3 = new THREE.Vector3(), s3 = new THREE.Vector3();
  const clock = new THREE.Clock();
  let visible = true;
  document.addEventListener('visibilitychange', () => { visible = !document.hidden; });

  function frame() {
    requestAnimationFrame(frame);
    if (!visible) return;
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;

    for (const k in state) state[k] = damp(state[k], target[k], 3.2, dt);
    pointer.sx = damp(pointer.sx, pointer.x, 2.5, dt);
    pointer.sy = damp(pointer.sy, pointer.y, 2.5, dt);
    spin = damp(spin, spinTarget, 3.4, dt);

    if (pendingFront >= 0 && Math.abs(spinTarget - spin) < Math.PI) {
      pouch.frontMat.map = fronts[pendingFront];
      pouch.frontMat.needsUpdate = true;
      pouch.bottomMat.color.copy(bottomColors[pendingFront]);
      pendingFront = -1;
    }

    const bob = reduce ? 0 : Math.sin(t * 1.1) * 0.035;
    root.position.set(state.x, state.y + bob, 0);
    root.scale.setScalar(state.s);
    pouchHolder.rotation.set(
      0.06 + pointer.sy * 0.12 + (reduce ? 0 : Math.sin(t * 0.7) * 0.03),
      state.ry + spin + pointer.sx * 0.35,
      state.rz + (reduce ? 0 : Math.sin(t * 0.9) * 0.025)
    );
    shadow.material.opacity = 0.9 * Math.min(1, state.s);

    // meyve parçaları
    scrollVel = damp(scrollVel, 0, 2, dt);
    clouds.forEach((c, ci) => {
      c.mix = damp(c.mix, ci === flavor ? state.cloud : 0, 2.6, dt);
      const visibleCloud = c.mix > 0.002;
      c.mesh.visible = visibleCloud;
      if (!visibleCloud) return;
      c.items.forEach((it, i) => {
        const delay = Math.min(1, Math.max(0, c.mix * 1.6 - (i / COUNT) * 0.6));
        const ease = delay * delay * (3 - 2 * delay);
        const orbit = reduce ? 0 : t * 0.08 + scrollVel * 0.002;
        const ca = Math.cos(orbit), sa = Math.sin(orbit);
        const bx = it.base.x * ca - it.base.z * sa;
        const bz = it.base.x * sa + it.base.z * ca;
        v3.set(
          bx * (0.6 + 0.4 * ease) + pointer.sx * 0.08 * it.size,
          it.base.y + (reduce ? 0 : Math.sin(t * 0.8 + it.phase) * 0.06) - (1 - ease) * 0.4,
          bz
        );
        e3.set(
          it.rot.x + (reduce ? 0 : t * it.spin.x),
          it.rot.y + (reduce ? 0 : t * it.spin.y),
          it.rot.z + (reduce ? 0 : t * it.spin.z)
        );
        q.setFromEuler(e3);
        s3.setScalar(it.size * ease);
        m4.compose(v3, q, s3);
        c.mesh.setMatrixAt(i, m4);
      });
      c.mesh.instanceMatrix.needsUpdate = true;
    });

    // kırağı
    frostMat.opacity = state.frost * 0.9;
    frost.visible = state.frost > 0.01;
    if (frost.visible && !reduce) {
      frost.rotation.y = t * 0.03;
      frost.position.y = Math.sin(t * 0.2) * 0.1;
    }
    // soğuk bölümde ışık mavimsi
    key.color.setRGB(1 - state.frost * 0.15, 0.96 - state.frost * 0.04, 0.9 + state.frost * 0.1);

    renderer.render(scene, camera);
  }
  requestAnimationFrame(frame);

  return {
    ready,
    setFlavor,
    setPose,
    kick(v) { scrollVel += v; },
    get flavor() { return flavor; },
    halfHeight() { return Math.tan((camera.fov * Math.PI) / 360) * camera.position.z; },
    aspect() { return camera.aspect; },
  };
}
