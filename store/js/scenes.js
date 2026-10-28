// Sayfanın alt bölümlerindeki 3D sahneler: koleksiyon dizilimi, 3D ikonlar,
// gece finali ve ürün detayındaki 3D görüntüleyici.
import { makeStage, buildFigure, animateFigure, blinker, THREE } from './figure3d.js';

const clampS = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

// Görünür olduğunda çalışan döngü
function loopWhenVisible(el, fn) {
  let on = false;
  let raf = 0;
  const t0 = performance.now();
  const tick = (now) => {
    if (!on) return;
    raf = requestAnimationFrame(tick);
    if (document.documentElement.dataset.modal) return; // detay/sepet açıkken arka planı çizme
    fn((now - t0) / 1000);
  };
  new IntersectionObserver(([e]) => {
    const was = on;
    on = e.isIntersecting;
    if (on && !was) raf = requestAnimationFrame(tick);
    if (!on) cancelAnimationFrame(raf);
  }, { rootMargin: '100px' }).observe(el);
  return { kick() { if (!on) fn((performance.now() - t0) / 1000); } };
}

function sizeTo(st, canvas) {
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  if (!w || !h) return;
  st.renderer.setSize(w, h, false);
  st.camera.aspect = w / h;
  st.camera.updateProjectionMatrix();
}

/* ---------- Koleksiyon: altı figür aynı sahnede ---------- */
export function createLineup(canvas, products, hooks = {}) {
  const st = makeStage(canvas, { fov: 26, shadowExtent: 34, groundOpacity: 0.16 });
  if (!st) return null;
  const { scene, camera, renderer } = st;
  const cache = new Map();
  const figs = products.map((p, i) => {
    const f = buildFigure(p, cache);
    f.root.userData.pedestal?.scale.set(0.55, 1, 0.55); // dizilimde kaideler sığsın
    scene.add(f.root);
    return { f, p, i, lift: 0, dim: 0, base: new THREE.Vector3() };
  });
  let filter = () => true;
  let hovered = -1;
  let portrait = false;

  function layout() {
    const n = figs.length;
    figs.forEach((g, i) => {
      if (portrait) {
        const row = i < Math.ceil(n / 2) ? 0 : 1;
        const col = row === 0 ? i : i - Math.ceil(n / 2);
        g.base.set((col - 1) * 3.9 + (row ? 1.95 : 0) - (row ? 1.95 : 0), 0, row ? -7 : 2);
      } else {
        const o = i - (n - 1) / 2;
        g.base.set(o * 3.7, 0, -o * o * 0.42);
      }
    });
  }
  function resize() {
    sizeTo(st, canvas);
    portrait = canvas.clientWidth / canvas.clientHeight < 0.9;
    layout();
  }
  addEventListener('resize', resize);
  resize();

  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2(-9, -9);
  canvas.addEventListener('pointermove', (e) => {
    const r = canvas.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  });
  canvas.addEventListener('pointerleave', () => ndc.set(-9, -9));
  function pickAt() {
    ray.setFromCamera(ndc, camera);
    for (const g of figs) {
      if (!filter(g.p)) continue;
      if (ray.intersectObjects(g.f.meshes, false).length) return g.i;
    }
    return -1;
  }
  canvas.addEventListener('click', (e) => {
    const r = canvas.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    const i = pickAt();
    if (i >= 0) hooks.onOpen?.(products[i]);
  });

  const blink = blinker();
  const v = new THREE.Vector3();
  loopWhenVisible(canvas, (t) => {
    const r = canvas.getBoundingClientRect();
    const q = clampS(1 - (r.top + r.height * 0.3) / innerHeight); // bölüme girişte kamera yaklaşır
    const e = 1 - Math.pow(1 - q, 3);
    if (portrait) {
      camera.position.set(0, 16 - e * 4, 44 - e * 10);
      camera.lookAt(0, 4.6, -2);
    } else {
      camera.position.set(Math.sin(t * 0.15) * 1.2, 11 - e * 4, 50 - e * 14);
      camera.lookAt(0, 4.8, -2);
    }
    const h = pickAt();
    if (h !== hovered) {
      hovered = h;
      canvas.style.cursor = h >= 0 ? 'pointer' : '';
    }
    const b = blink(t);
    figs.forEach((g) => {
      const on = filter(g.p);
      g.dim += ((on ? 0 : 1) - g.dim) * 0.1;
      g.lift += ((g.i === hovered ? 1 : 0) - g.lift) * 0.12;
      const { root } = g.f;
      root.position.set(g.base.x, -g.dim * 1.2, g.base.z + g.lift * 1.8 - g.dim * 3);
      root.scale.setScalar(1 + g.lift * 0.06 - g.dim * 0.15);
      const face = Math.atan2(camera.position.x - root.position.x, camera.position.z - root.position.z);
      root.rotation.y = face * (0.6 + g.lift * 0.4) + (reduced() ? 0 : Math.sin(t * 0.5 + g.i) * 0.25 * (1 - g.lift));
      animateFigure(g.f, t, g.i, b && g.i % 2 === 0, g.lift);
    });
    renderer.render(scene, camera);
    if (hovered >= 0) {
      const root = figs[hovered].f.root;
      v.set(0, 10.6, 0);
      root.localToWorld(v);
      v.project(camera);
      hooks.onHover?.(products[hovered], (v.x * 0.5 + 0.5) * r.width, (-v.y * 0.5 + 0.5) * r.height);
    } else hooks.onHover?.(null);
  });

  return { setFilter(fn) { filter = fn; } };
}

/* ---------- 3D ikonlar ---------- */
function starShape(r1, r2) {
  const s = new THREE.Shape();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 ? r2 : r1;
    const a = (i / 10) * Math.PI * 2 + Math.PI / 2;
    const fn = i ? 'lineTo' : 'moveTo';
    s[fn](Math.cos(a) * r, Math.sin(a) * r);
  }
  return s;
}
function heartShape(k = 1) {
  const s = new THREE.Shape();
  s.moveTo(0, -1.0 * k);
  s.bezierCurveTo(-0.4 * k, -0.6 * k, -1.2 * k, -0.2 * k, -1.1 * k, 0.45 * k);
  s.bezierCurveTo(-1.0 * k, 1.1 * k, -0.2 * k, 1.15 * k, 0, 0.55 * k);
  s.bezierCurveTo(0.2 * k, 1.15 * k, 1.0 * k, 1.1 * k, 1.1 * k, 0.45 * k);
  s.bezierCurveTo(1.2 * k, -0.2 * k, 0.4 * k, -0.6 * k, 0, -1.0 * k);
  return s;
}
function crescentShape(R1 = 1, R2 = 0.84, d = 0.48) {
  const x = (d * d + R1 * R1 - R2 * R2) / (2 * d);
  const y = Math.sqrt(R1 * R1 - x * x);
  const t1 = Math.atan2(y, x);
  const a = Math.atan2(y, x - d);
  const pts = [];
  for (let k = 0; k <= 48; k++) {
    const ang = t1 + (k / 48) * (Math.PI * 2 - 2 * t1);
    pts.push(new THREE.Vector2(Math.cos(ang) * R1, Math.sin(ang) * R1));
  }
  for (let k = 0; k <= 48; k++) {
    const ang = Math.PI * 2 - a - (k / 48) * (Math.PI * 2 - 2 * a);
    pts.push(new THREE.Vector2(d + Math.cos(ang) * R2, Math.sin(ang) * R2));
  }
  return new THREE.Shape(pts);
}
const extrude = (shape, depth = 0.45) => {
  const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelThickness: 0.18, bevelSize: 0.14, bevelSegments: 6, curveSegments: 32 });
  g.center();
  return g;
};
const gloss = (color, emissive = 0) => new THREE.MeshPhysicalMaterial({ color, roughness: 0.28, clearcoat: 1, clearcoatRoughness: 0.15, sheen: 0.3, emissive: color, emissiveIntensity: emissive });

function cloudGroup(mat) {
  const g = new THREE.Group();
  [[0, 0, 0, 1], [-1.05, -0.25, 0.1, 0.72], [1.05, -0.2, 0.05, 0.78], [-0.45, 0.45, -0.1, 0.7], [0.55, 0.4, -0.1, 0.66], [0, -0.35, 0.35, 0.7]].forEach(([x, y, z, r]) => {
    const m = new THREE.Mesh(new THREE.SphereGeometry(r, 40, 28), mat);
    m.position.set(x, y, z);
    g.add(m);
  });
  return g;
}

export function createIcons(canvas, slots) {
  const st = makeStage(canvas, { fov: 30, shadows: false, exposure: 0.85 });
  if (!st) return null;
  const { scene, camera, renderer } = st;
  st.ground.visible = false;
  camera.position.set(0, 0, 30);
  const makers = {
    cloud: () => cloudGroup(gloss('#ffffff')),
    star: () => new THREE.Mesh(extrude(starShape(1.2, 0.55)), gloss('#ffd45c', 0.08)),
    heart: () => new THREE.Mesh(extrude(heartShape(1.05)), gloss('#f59bd6', 0.05)),
    moon: () => new THREE.Mesh(extrude(crescentShape(), 0.5), gloss('#ffe08a', 0.12)),
  };
  const objs = slots.map((el, i) => {
    const o = makers[el.dataset.icon || 'star']();
    scene.add(o);
    const spin = { v: 0 };
    el.addEventListener('pointerenter', () => { spin.v = 0.25; });
    return { el, o, spin, i };
  });
  const resize = () => sizeTo(st, canvas);
  addEventListener('resize', resize);
  resize();
  loopWhenVisible(canvas, (t) => {
    const cr = canvas.getBoundingClientRect();
    const visH = 2 * camera.position.z * Math.tan((camera.fov * Math.PI) / 360);
    const visW = visH * camera.aspect;
    objs.forEach(({ el, o, spin, i }) => {
      const r = el.getBoundingClientRect();
      const sx = (r.left + r.width / 2 - cr.left) / cr.width;
      const sy = (r.top + (innerWidth < 860 ? 90 : 100) - cr.top) / cr.height;
      const k = Math.min((r.width / cr.width) * visW * 0.15, (190 / cr.height) * visH * 0.42);
      o.position.set((sx - 0.5) * visW, (0.5 - sy) * visH + Math.sin(t * 1.4 + i) * k * 0.08, 0);
      o.scale.setScalar(k);
      spin.v *= 0.97;
      o.rotation.y += 0.008 + spin.v;
      o.rotation.x = Math.sin(t * 0.8 + i) * 0.2;
    });
    renderer.render(scene, camera);
  });
  return {};
}

/* ---------- Gece finali: ay, yıldızlar ve el sallayan figür ---------- */
export function createFinale(canvas, product) {
  const st = makeStage(canvas, { fov: 28, exposure: 1, groundOpacity: 0.25 });
  if (!st) return null;
  const { scene, camera, renderer, key } = st;
  key.color.set('#e9e4ff');
  key.intensity = 1.5;
  const moon = new THREE.Mesh(extrude(crescentShape(), 0.55), gloss('#ffe08a', 0.35));
  scene.add(moon);
  const glow = new THREE.PointLight(0xffd98a, 40, 40, 1.6);
  scene.add(glow);
  const stars = [];
  const cols = ['#ffd45c', '#f59bd6', '#79c3f6', '#ffffff'];
  for (let i = 0; i < 9; i++) {
    const m = new THREE.Mesh(extrude(starShape(1, 0.46), 0.35), gloss(cols[i % cols.length], 0.25));
    m.userData = { a: (i / 9) * Math.PI * 2, r: 7 + (i % 3) * 2.2, y: 4 + (i % 4) * 2, s: 0.35 + (i % 3) * 0.15 };
    scene.add(m);
    stars.push(m);
  }
  const cloudMat = gloss('#ffffff');
  cloudMat.roughness = 0.6;
  const cloud = cloudGroup(cloudMat);
  cloud.scale.set(3.2, 1.4, 2.4);
  cloud.position.set(0, -0.4, 0);
  const fig = buildFigure(product, new Map());
  fig.root.position.set(0, 0.6, 0);
  const holder = new THREE.Group();
  scene.add(holder);
  holder.add(cloud, fig.root);
  scene.add(fig.root);
  st.ground.position.y = 0.55;
  const resize = () => sizeTo(st, canvas);
  addEventListener('resize', resize);
  resize();
  const blink = blinker();
  loopWhenVisible(canvas, (t) => {
    const r = canvas.getBoundingClientRect();
    const q = clampS(1 - (r.top + r.height * 0.2) / innerHeight);
    const portrait = r.width / r.height < 0.9;
    const mx = portrait ? 3.2 : 11;
    holder.position.x = portrait ? 0 : 4.5;
    moon.position.set(mx, 6 + q * 6, -6);
    moon.rotation.set(0, Math.sin(t * 0.4) * 0.4, -0.35 + Math.sin(t * 0.6) * 0.06);
    moon.scale.setScalar(portrait ? 2.6 : 3.4);
    glow.position.set(mx - 1.5, 9 + q * 4, -2);
    stars.forEach((s, i) => {
      const u = s.userData;
      s.position.set(Math.cos(u.a + t * 0.08) * u.r, u.y + Math.sin(t + i) * 0.4, -4 + Math.sin(u.a + t * 0.08) * 3);
      s.rotation.y = t * 0.6 + i;
      s.scale.setScalar(u.s * (portrait ? 0.8 : 1));
    });
    camera.position.set(Math.sin(t * 0.2) * 1.5, 7, portrait ? 40 : 32 - q * 4);
    camera.lookAt(portrait ? 0.8 : 1.5, 6.5, 0);
    fig.root.rotation.y = Math.sin(t * 0.4) * 0.3 + 0.25;
    animateFigure(fig, t, 0, blink(t), clampS(q * 1.3));
    renderer.render(scene, camera);
  });
  return {};
}

/* ---------- Ürün detayında 360° görüntüleyici ---------- */
export function createViewer(canvas) {
  const st = makeStage(canvas, { fov: 26, groundOpacity: 0.2 });
  if (!st) return null;
  const { scene, camera, renderer } = st;
  const cache = new Map();
  const built = new Map();
  let cur = null;
  let rot = 0.4;
  let vel = 0;
  let dragging = false;
  let lastX = 0;
  let idle = 0;
  canvas.addEventListener('pointerdown', (e) => { dragging = true; lastX = e.clientX; canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    vel = (e.clientX - lastX) * 0.012;
    rot += vel;
    lastX = e.clientX;
    idle = performance.now();
  });
  const up = () => { dragging = false; };
  canvas.addEventListener('pointerup', up);
  canvas.addEventListener('pointercancel', up);
  const resize = () => sizeTo(st, canvas);
  addEventListener('resize', resize);
  const blink = blinker();
  let running = false;
  const t0 = performance.now();
  const size = new THREE.Vector2();
  function frame(now) {
    if (!running) return;
    requestAnimationFrame(frame);
    renderer.getSize(size);
    if (Math.abs(size.x - canvas.clientWidth) > 1 || Math.abs(size.y - canvas.clientHeight) > 1) resize();
    const t = (now - t0) / 1000;
    if (!dragging) {
      vel *= 0.94;
      rot += vel;
      if (now - idle > 2500 && !reduced()) rot += 0.006;
    }
    if (cur) {
      cur.root.rotation.y = rot;
      animateFigure(cur, t, 0, blink(t));
    }
    renderer.render(scene, camera);
  }
  return {
    show(p) {
      if (cur) cur.root.visible = false;
      if (!built.has(p.id)) {
        const f = buildFigure(p, cache);
        scene.add(f.root);
        built.set(p.id, f);
      }
      cur = built.get(p.id);
      cur.root.visible = true;
      rot = 0.35;
      camera.position.set(0, 6.2, 37);
      camera.lookAt(0, 5, 0);
    },
    start() { if (running) return; running = true; resize(); requestAnimationFrame(frame); },
    stop() { running = false; },
  };
}
