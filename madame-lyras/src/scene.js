import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

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
  const W = 1024, H = Math.round(1024 * (flavor.aspect || 1.153));
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
  const top = sample(380, Math.round(H * 0.36), 260, 100);
  const bot = sample(380, Math.round(H * 0.86), 260, 80);
  // üst kilit ve kaynak bölgesi fotoğraftan aynen kalsın, altı yeniden boyansın
  const seal = Math.round(H * 0.2);
  const grad = x.createLinearGradient(0, seal, 0, H);
  grad.addColorStop(0, top);
  grad.addColorStop(1, bot);
  x.fillStyle = grad;
  x.fillRect(0, seal, W, H - seal);
  const fade = x.createLinearGradient(0, seal - 50, 0, seal + 30);
  fade.addColorStop(0, 'rgba(0,0,0,0)');
  fade.addColorStop(1, top);
  x.fillStyle = fade;
  x.fillRect(0, seal - 50, W, 80);
  const sh = x.createLinearGradient(0, 0, W, 0);
  sh.addColorStop(0, 'rgba(0,0,0,.18)');
  sh.addColorStop(0.18, 'rgba(255,255,255,.10)');
  sh.addColorStop(0.5, 'rgba(255,255,255,0)');
  sh.addColorStop(0.85, 'rgba(0,0,0,.05)');
  sh.addColorStop(1, 'rgba(0,0,0,.2)');
  x.fillStyle = sh;
  x.fillRect(0, 0, W, H);

  // açık renkli paketlerde koyu yazı
  const m = top.match(/\d+/g).map(Number);
  const light = 0.299 * m[0] + 0.587 * m[1] + 0.114 * m[2] > 165;
  const ink = light ? '#3b2210' : '#fff';
  x.fillStyle = ink;
  const cy = seal + (H - seal) * 0.08;
  if (logo) x.drawImage(logo, W / 2 - 110, cy, 220, 220);
  x.textAlign = 'center';
  x.font = '600 60px Fraunces, Georgia, serif';
  x.fillText('Genç Anadolu Gıda', W / 2, cy + 310);
  x.font = '500 34px Manrope, Arial, sans-serif';
  x.fillText(`Dondurularak Kurutulmuş ${flavor.name}`, W / 2, cy + 362);
  x.globalAlpha = 0.5;
  x.fillRect(W / 2 - 160, cy + 400, 320, 2);
  x.globalAlpha = 1;
  x.textAlign = 'left';
  let y = cy + 470;
  for (const [k, v] of flavor.facts) {
    x.font = '700 28px Manrope, Arial, sans-serif';
    x.fillText(k.toLocaleUpperCase('tr'), 190, y);
    x.font = '500 32px Manrope, Arial, sans-serif';
    x.fillText(v, 560, y);
    y += 52;
  }
  x.font = '500 30px Manrope, Arial, sans-serif';
  y += 10;
  let line = '';
  for (const word of (flavor.claims || []).join(' · ').split(' ')) {
    const test = line ? `${line} ${word}` : word;
    if (x.measureText(test).width > W - 380 && line) { x.fillText(line, 190, y); y += 42; line = word; } else line = test;
  }
  if (line) x.fillText(line, 190, y);
  x.font = '500 22px Manrope, Arial, sans-serif';
  x.globalAlpha = 0.75;
  x.textAlign = 'center';
  x.fillText('Açtıktan sonra kilidini kapatıp serin ve kuru yerde saklayınız.', W / 2, H - 120);
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

  // meyve bulutları: markanın afişlerinden kesilmiş gerçek meyve görselleri
  const COUNT = 16;
  const texCache = new Map();
  const spriteTex = (url) => {
    if (!texCache.has(url)) {
      const t = new THREE.TextureLoader().load(url);
      t.colorSpace = THREE.SRGBColorSpace;
      texCache.set(url, t);
    }
    return texCache.get(url);
  };
  const clouds = flavors.map((fl, fi) => {
    const group = new THREE.Group();
    const r = rng(100 + fi * 17);
    const parts = fl.parts || [];
    const items = [];
    for (let i = 0; i < COUNT && parts.length; i++) {
      const k = i % parts.length;
      const a = (i / COUNT) * TAU + r() * 0.35;
      // önde (kameraya yakın) olanlar kenarlara, arkadakiler pakete yakın
      const zLayer = i % 4 === 0 ? 0.75 + r() * 0.5 : i % 4 === 1 ? -0.9 - r() * 0.7 : (r() - 0.5) * 0.9;
      const ring = zLayer > 0.6 ? 1.05 + r() * 0.5 : 0.72 + r() * 0.65;
      const blurred = zLayer > 0.6 || zLayer < -1.2;
      const mat = new THREE.SpriteMaterial({
        map: spriteTex(`/parca/${fl.id}-${k}${blurred ? 'b' : ''}.webp`),
        transparent: true,
        depthWrite: false,
        toneMapped: false,
        opacity: 0,
      });
      const sp = new THREE.Sprite(mat);
      sp.visible = false;
      group.add(sp);
      const size = (zLayer > 0.6 ? 0.32 : zLayer < -0.8 ? 0.2 : 0.25) * (0.75 + r() * 0.55);
      // yazıların durduğu sola ve alta taşmasın (sol tarafı ve alt kenarı yumuşakça sıkıştır)
      let bx = Math.cos(a) * ring * 1.2;
      if (bx < -0.75) bx = -0.75 + (bx + 0.75) * 0.3;
      let by = (r() - 0.5) * 1.9;
      if (zLayer > 0.6 && by < -0.6) by = -0.6 + (by + 0.6) * 0.4;
      items.push({
        sp, mat, aspect: parts[k], size,
        base: new THREE.Vector3(bx, by, zLayer),
        rot: r() * TAU, spin: (r() - 0.5) * 0.5,
        phase: r() * TAU,
        flip: r() > 0.5 ? -1 : 1,
      });
    }
    root.add(group);
    return { group, items, mix: fi === 0 ? 1 : 0, leaving: false };
  });

  // açılışta öndeki paketin arkasında sıralanan diğer paketler
  const FAN = [
    { i: flavors.findIndex((f) => f.id === 'ahududu'), p: [-0.36, 0.14, -0.9], ry: 0.45, rz: 0.1, s: 0.92 },
    { i: flavors.findIndex((f) => f.id === 'elma'), p: [0.44, 0.12, -0.95], ry: -0.5, rz: -0.1, s: 0.92 },
    { i: flavors.findIndex((f) => f.id === 'ananas'), p: [-0.66, 0.3, -1.95], ry: 0.6, rz: 0.16, s: 0.9 },
    { i: flavors.findIndex((f) => f.id === 'hindistan-cevizi'), p: [0.8, 0.28, -2.05], ry: -0.65, rz: -0.14, s: 0.9 },
  ].filter((f) => f.i >= 0);
  const fan = FAN.map((cfg, n) => {
    const pk = makePouch();
    const holder = new THREE.Group();
    holder.add(pk.group);
    holder.visible = false;
    root.add(holder);
    const dir = new THREE.Vector3(cfg.p[0], cfg.p[1] + 0.4, 0).normalize();
    return { ...cfg, pk, holder, dir, phase: n * 1.7 };
  });
  let fanTarget = 1, fanNow = 1;

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
        }, undefined, () => res());
      })
    )
  ).then(async () => {
    await logoReady;
    try { await document.fonts?.ready; } catch (e) { /* yedek yazı tipi */ }
    flavors.forEach((fl, i) => { if (fronts[i]) backs[i] = makeBackTexture(fronts[i].image, fl, logoImg); });
    showFront(0); showBack(0);
    fan.forEach((f) => {
      if (!fronts[f.i]) return;
      f.pk.frontMat.map = fronts[f.i]; f.pk.backMat.map = backs[f.i];
      f.pk.frontMat.needsUpdate = f.pk.backMat.needsUpdate = true;
      f.pk.bottomMat.color.copy(new THREE.Color(flavors[f.i].bg).multiplyScalar(0.75));
      const asp = (flavors[f.i].aspect || 1.153) / 1.153;
      f.pk.group.scale.set(1 / Math.sqrt(asp), asp / Math.sqrt(asp), 1);
    });
  });

  const bottomColors = flavors.map((f) => new THREE.Color(f.bg).multiplyScalar(0.75));
  const aspects = flavors.map((f) => (f.aspect || 1.153) / 1.153);
  let aspectTarget = aspects[0], aspectNow = aspects[0];
  let frontIdx = -1, backIdx = -1;
  function showFront(i) {
    if (i === frontIdx || !fronts[i]) return;
    frontIdx = i;
    pouch.frontMat.map = fronts[i];
    pouch.frontMat.needsUpdate = true;
    pouch.bottomMat.color.copy(bottomColors[i]);
    aspectTarget = aspects[i];
  }
  function showBack(i) {
    if (i === backIdx || !backs[i]) return;
    backIdx = i;
    pouch.backMat.map = backs[i];
    pouch.backMat.needsUpdate = true;
  }

  /* ---- durum ---- */
  const N = flavors.length;
  let flavor = 0;
  let pendingFront = -1;
  let spin = 0, spinTarget = 0;
  let stream = null, streamNow = 0; // ürün akışında kaydırmaya bağlı konum (0..N-1)
  const state = { x: 0, y: 0, s: 1, ry: 0, rz: 0, cloud: 1, frost: 0 };
  const target = { ...state };
  const pointer = { x: 0, y: 0, sx: 0, sy: 0 };
  let scrollVel = 0;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const cloudTarget = new Array(N).fill(0);
  cloudTarget[0] = 1;

  // inceleme modu
  const insp = { on: false, rx: 0.08, ry: 0, vx: 0, vy: 0, zoom: 1, zoomT: 1, goto: null, idle: 0, pop: 0, blend: 0 };
  const drag = { pts: new Map(), lastX: 0, lastY: 0, pinch: 0 };

  function setFlavor(i) {
    if (i === flavor || i < 0) return;
    const dir = i > flavor ? 1 : -1;
    flavor = i;
    if (reduce || stream !== null || insp.on) { showFront(i); showBack(i); return; }
    spinTarget = Math.round(spinTarget / TAU) * TAU + dir * TAU;
    showBack(i);
    pendingFront = i;
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

  /* ---- inceleme: sürükle, döndür, yakınlaştır ---- */
  canvas.addEventListener('pointerdown', (e) => {
    if (!insp.on) return;
    canvas.setPointerCapture(e.pointerId);
    drag.pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    drag.lastX = e.clientX; drag.lastY = e.clientY;
    insp.goto = null; insp.idle = 0;
    if (drag.pts.size === 2) {
      const [a, b] = [...drag.pts.values()];
      drag.pinch = Math.hypot(a.x - b.x, a.y - b.y);
    }
    canvas.classList.add('grabbing');
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!insp.on || !drag.pts.has(e.pointerId)) return;
    drag.pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (drag.pts.size === 2) {
      const [a, b] = [...drag.pts.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      if (drag.pinch) insp.zoomT = Math.min(2.4, Math.max(0.75, insp.zoomT * (d / drag.pinch)));
      drag.pinch = d;
      return;
    }
    const dx = e.clientX - drag.lastX, dy = e.clientY - drag.lastY;
    drag.lastX = e.clientX; drag.lastY = e.clientY;
    insp.vy = dx * 0.0085;
    insp.vx = dy * 0.006;
    insp.ry += insp.vy;
    insp.rx = Math.max(-0.9, Math.min(0.9, insp.rx + insp.vx));
    insp.idle = 0;
  });
  const endDrag = (e) => {
    drag.pts.delete(e.pointerId);
    if (drag.pts.size < 2) drag.pinch = 0;
    if (!drag.pts.size) canvas.classList.remove('grabbing');
  };
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);
  canvas.addEventListener('wheel', (e) => {
    if (!insp.on) return;
    e.preventDefault();
    insp.zoomT = Math.min(2.4, Math.max(0.75, insp.zoomT * Math.exp(-e.deltaY * 0.0015)));
    insp.idle = 0;
  }, { passive: false });

  function inspectOpen(i) {
    insp.on = true;
    insp.blend = 0;
    insp.rx = 0.06; insp.vx = insp.vy = 0;
    // mevcut açıdan devam et ki atlama olmasın
    insp.ry = pouchHolder.rotation.y;
    insp.goto = Math.round(insp.ry / TAU) * TAU;
    insp.zoom = insp.zoomT = 1;
    insp.idle = 0;
    flavor = i;
    pendingFront = -1;
    showFront(i); showBack(i);
    cloudTarget.fill(0);
  }
  function inspectFlavor(i) {
    if (!insp.on) return;
    insp.pop = 1;
    flavor = i;
    setTimeout(() => { showFront(i); showBack(i); }, 180);
    insp.goto = Math.round(insp.ry / TAU) * TAU;
  }
  function inspectClose() {
    insp.on = false;
    spin = spinTarget = 0;
    drag.pts.clear();
    canvas.classList.remove('grabbing');
  }
  function setView(v) {
    const base = Math.round(insp.ry / TAU) * TAU;
    insp.goto = v === 'back' ? base + Math.PI : v === 'side' ? base + Math.PI / 2 : base;
    insp.rx = v === 'top' ? 0.7 : 0.06;
    insp.idle = 0;
  }

  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e3 = new THREE.Euler(), v3 = new THREE.Vector3(), s3 = new THREE.Vector3();
  const clock = new THREE.Clock();
  let visible = true;
  document.addEventListener('visibilitychange', () => { visible = !document.hidden; });
  const ease = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

  function frame() {
    requestAnimationFrame(frame);
    if (!visible) return;
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;

    for (const k in state) state[k] = damp(state[k], target[k], insp.on ? 4 : 4.5, dt);
    pointer.sx = damp(pointer.sx, pointer.x, 2.5, dt);
    pointer.sy = damp(pointer.sy, pointer.y, 2.5, dt);
    spin = damp(spin, spinTarget, 3.4, dt);

    if (pendingFront >= 0 && Math.abs(spinTarget - spin) < Math.PI) {
      showFront(pendingFront);
      pendingFront = -1;
    }

    // ürün akışı: kaydırma konumuna bağlı, geri sarılabilir geçiş
    let streamAngle = 0, dip = 0;
    if (stream !== null && !insp.on) {
      streamNow = damp(streamNow, stream, 7, dt);
      const fi = Math.min(N - 1, Math.max(0, streamNow));
      const i = Math.min(N - 2, Math.floor(fi));
      const u = fi - i;
      const r = reduce ? (u > 0.5 ? 1 : 0) : ease(smooth(0.3, 0.7, u));
      streamAngle = r * TAU;
      dip = Math.sin(r * Math.PI);
      showFront(r < 0.5 ? i : i + 1);
      showBack(r > 0.02 ? i + 1 : i);
      flavor = r < 0.5 ? i : i + 1;
      for (let c = 0; c < N; c++) {
        cloudTarget[c] = c === i ? 1 - smooth(0.22, 0.55, u) : c === i + 1 ? smooth(0.45, 0.8, u) : 0;
      }
    } else if (!insp.on) {
      for (let c = 0; c < N; c++) cloudTarget[c] = c === flavor ? 1 : 0;
    }

    // inceleme modu
    insp.blend = damp(insp.blend, insp.on ? 1 : 0, 4, dt);
    insp.zoom = damp(insp.zoom, insp.zoomT, 6, dt);
    insp.pop = damp(insp.pop, 0, 5, dt);
    if (insp.on) {
      insp.idle += dt;
      if (!drag.pts.size) {
        if (insp.goto !== null) {
          insp.ry = damp(insp.ry, insp.goto, 4.5, dt);
          if (Math.abs(insp.ry - insp.goto) < 0.002) insp.goto = null;
          insp.vy = 0;
        } else {
          insp.vy *= Math.pow(0.04, dt);
          insp.vx *= Math.pow(0.04, dt);
          insp.ry += insp.vy;
          if (insp.idle > 3 && !reduce) insp.ry += dt * 0.35 * Math.min(1, (insp.idle - 3) / 2);
        }
      }
    }
    camera.position.z = 5 / insp.zoom;

    const bob = reduce ? 0 : Math.sin(t * 1.1) * 0.035 * (1 - insp.blend);
    root.position.set(state.x + dip * 0.18, state.y + bob - dip * 0.1, 0);
    root.scale.setScalar(state.s * (1 - 0.08 * dip) * (1 - 0.12 * insp.pop));
    if (insp.on) {
      pouchHolder.rotation.set(insp.rx, insp.ry, 0);
    } else {
      pouchHolder.rotation.set(
        0.06 + pointer.sy * 0.12 + (reduce ? 0 : Math.sin(t * 0.7) * 0.03) + dip * 0.12,
        state.ry + spin + streamAngle + pointer.sx * 0.35,
        state.rz + (reduce ? 0 : Math.sin(t * 0.9) * 0.025) - dip * 0.16
      );
    }
    shadow.material.opacity = 0.9 * Math.min(1, state.s) * (1 - 0.5 * dip);
    aspectNow = damp(aspectNow, aspectTarget, 6, dt);
    pouch.group.scale.set(1 / Math.sqrt(aspectNow), aspectNow / Math.sqrt(aspectNow), 1);
    shadow.position.y = -0.58 * aspectNow / Math.sqrt(aspectNow) - 0.24;
    shadow.visible = !insp.on || insp.rx < 0.5;

    // meyve parçaları (gerçek görseller)
    scrollVel = damp(scrollVel, 0, 2, dt);
    const cloudScale = insp.on ? 0.55 : state.cloud;
    clouds.forEach((c, ci) => {
      const tgt = (insp.on ? (ci === flavor ? 1 : 0) : cloudTarget[ci]) * cloudScale;
      c.leaving = tgt < c.mix - 0.01;
      c.mix = damp(c.mix, tgt, stream !== null ? 4.5 : 2.4, dt);
      const on = c.mix > 0.003;
      c.group.visible = on;
      if (!on) return;
      c.items.forEach((it, i) => {
        const d = Math.min(1, Math.max(0, c.mix * 1.5 - (i / COUNT) * 0.5));
        const e = d * d * (3 - 2 * d);
        const inv = 1 - e;
        const orbit = reduce ? 0 : t * 0.07 + scrollVel * 0.0015 + inv * (c.leaving ? 0.9 : -1.4);
        const ca = Math.cos(orbit), sa = Math.sin(orbit);
        let x = it.base.x * ca - it.base.z * sa * 0.3;
        let z = it.base.z + it.base.x * sa * 0.3;
        let y = it.base.y + (reduce ? 0 : Math.sin(t * 0.8 + it.phase) * 0.05);
        if (c.leaving) {
          // kameraya doğru savrulup çıkar
          x *= 1 + inv * 1.4; y *= 1 + inv * 0.8; z += inv * 2.2;
        } else {
          // arkadan, uzaktan dönerek gelir
          x *= 0.45 + 0.55 * e + inv * 0.9; z -= inv * 2.6; y += inv * 0.6 * Math.sign(it.base.y || 1);
        }
        if (insp.on) { x *= 1.45; z = Math.min(z, -0.6) - 0.3; }
        it.sp.position.set(x + pointer.sx * 0.06 * (1 + it.base.z), y, z);
        const sz = it.size * (0.55 + 0.45 * e);
        it.sp.scale.set(sz * it.flip, sz * it.aspect, 1);
        it.mat.rotation = it.rot + (reduce ? 0 : t * it.spin) + inv * (c.leaving ? -1.5 : 2.2);
        it.mat.opacity = Math.min(1, e * 1.25);
        it.sp.visible = e > 0.01;
      });
    });

    // açılış dizisi
    fanNow = damp(fanNow, insp.on ? 0 : fanTarget, 5, dt);
    fan.forEach((f) => {
      const v = fanNow;
      f.holder.visible = v > 0.01;
      if (!f.holder.visible) return;
      const out = 1 - v;
      const bobF = reduce ? 0 : Math.sin(t * 1.0 + f.phase) * 0.03;
      f.holder.position.set(
        f.p[0] + f.dir.x * out * 2.2,
        f.p[1] + bobF + f.dir.y * out * 1.6 + out * 0.6,
        f.p[2] - out * 1.5
      );
      f.holder.rotation.set(0.05, f.ry + pointer.sx * 0.25 - out * 0.8 * Math.sign(f.p[0]), f.rz + out * 0.4 * Math.sign(f.p[0]));
      f.holder.scale.setScalar(f.s * (0.35 + 0.65 * v));
    });

    // kırağı
    frostMat.opacity = state.frost * 0.9;
    frost.visible = state.frost > 0.01;
    if (frost.visible && !reduce) {
      frost.rotation.y = t * 0.03;
      frost.position.y = Math.sin(t * 0.2) * 0.1;
    }
    key.color.setRGB(1 - state.frost * 0.15, 0.96 - state.frost * 0.04, 0.9 + state.frost * 0.1);

    renderer.render(scene, camera);
  }
  requestAnimationFrame(frame);

  return {
    ready,
    setFlavor,
    setPose,
    setFan(v) { fanTarget = v; },
    setStream(f) {
      if (f === null) { if (stream !== null) { spin = spinTarget = 0; } stream = null; return; }
      if (stream === null) streamNow = f;
      stream = f;
    },
    inspectOpen, inspectClose, inspectFlavor, setView,
    zoomBy(k) { insp.zoomT = Math.min(2.4, Math.max(0.75, insp.zoomT * k)); insp.idle = 0; },
    kick(v) { scrollVel += v; },
    get flavor() { return flavor; },
    halfHeight() { return Math.tan((camera.fov * Math.PI) / 360) * 5; },
    aspect() { return camera.aspect; },
  };
}
