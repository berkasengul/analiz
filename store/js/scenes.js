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
    const f = buildFigure(p, cache, { lite: true });
    f.root.userData.pedestal?.scale.set(0.72, 1, 0.72); // dizilimde kaideler sığsın (ayak açıklığı en geniş pozda da üstte kalır)
    scene.add(f.root);
    return { f, p, i, lift: 0, dim: 0, base: new THREE.Vector3() };
  });
  let filter = () => true;
  let hovered = -1;
  let portrait = false;

  function layout() {
    // Sıralar: masaüstünde 2 sıra (arkadaki sıra boşluklara kayar), mobilde 3 sıra
    const n = figs.length;
    const perRow = portrait ? Math.ceil(n / 3) : Math.ceil(n / 2);
    const gap = portrait ? 4.2 : 4.4;
    figs.forEach((g, i) => {
      const row = Math.floor(i / perRow);
      const col = i % perRow;
      const inRow = Math.min(perRow, n - row * perRow);
      const o = col - (inRow - 1) / 2 + (row % 2 ? 0.5 : 0) * (inRow === perRow ? 1 : 0) - (row % 2 ? 0.25 : 0);
      g.base.set(o * gap, 0, 4 - row * 9 - Math.abs(o) * 0.6);
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
      camera.position.set(0, 24 - e * 4, 92 - e * 12);
      camera.lookAt(0, 3.4, -9);
    } else {
      camera.position.set(Math.sin(t * 0.12) * 1.2, 16 - e * 4, 60 - e * 12);
      camera.lookAt(0, 3.6, -6);
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
      root.rotation.y = face * (0.6 + g.lift * 0.4) + (reduced() ? 0 : Math.sin(t * 0.25 + g.i) * 0.18 * (1 - g.lift));
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
    fig.root.rotation.y = Math.sin(t * 0.2) * 0.25 + 0.2;
    animateFigure(fig, t, 0, blink(t), clampS(q * 1.3));
    renderer.render(scene, camera);
  });
  return {};
}

/* ---------- Ürün detayında 360° görüntüleyici ---------- */
export function createViewer(canvas, ui = {}) {
  const st = makeStage(canvas, { fov: 26, groundOpacity: 0.2 });
  if (!st) return null;
  const { scene, camera, renderer } = st;
  const cache = new Map();
  const built = new Map();
  let cur = null;
  let rot = 0.4;
  let vel = 0;
  let idle = 0;
  // Yakınlaştırma: zoom 1 = tüm figür; odak noktası figür düzleminde (x, y)
  const MAXZ = 3.2;
  const view = { z: 1, fx: 0, fy: 5 };
  const goal = { z: 1, fx: 0, fy: 5 };
  const clampGoal = () => {
    goal.z = clampS(goal.z, 1, MAXZ);
    const spanY = 5 * (1 - 1 / goal.z);
    goal.fy = clampS(goal.fy, 5 - spanY - 0.3, 5 + spanY + 0.6);
    goal.fx = clampS(goal.fx, -2.6 * (1 - 1 / goal.z), 2.6 * (1 - 1 / goal.z));
    ui.onZoom?.(goal.z);
  };
  const ray = new THREE.Raycaster();
  const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  const hit = new THREE.Vector3();
  function pointAt(cx, cy) {
    const r = canvas.getBoundingClientRect();
    ray.setFromCamera(new THREE.Vector2(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1), camera);
    return ray.ray.intersectPlane(plane, hit) ? hit.clone() : null;
  }
  // İmlecin altındaki nokta yerinde kalacak şekilde yakınlaş
  function zoomAt(cx, cy, factor) {
    const p = pointAt(cx, cy);
    const nz = clampS(goal.z * factor, 1, MAXZ);
    if (p) {
      const k = 1 - goal.z / nz;
      goal.fx += (p.x - goal.fx) * k;
      goal.fy += (p.y - goal.fy) * k;
    }
    goal.z = nz;
    if (nz <= 1.001) { goal.fx = 0; goal.fy = 5; }
    clampGoal();
    idle = performance.now();
  }
  const pointers = new Map();
  let pinch = null;
  let lastTap = 0;
  canvas.addEventListener('pointerdown', (e) => {
    canvas.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), z: goal.z };
    }
    const now = performance.now();
    if (e.pointerType !== 'mouse' && now - lastTap < 300 && pointers.size === 1) toggleAt(e.clientX, e.clientY);
    lastTap = now;
  });
  canvas.addEventListener('pointermove', (e) => {
    const prev = pointers.get(e.pointerId);
    if (!prev) return;
    const dx = e.clientX - prev.x;
    const dy = e.clientY - prev.y;
    prev.x = e.clientX; prev.y = e.clientY;
    idle = performance.now();
    if (pointers.size === 2 && pinch) {
      const [a, b] = [...pointers.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      zoomAt((a.x + b.x) / 2, (a.y + b.y) / 2, (pinch.z * d / pinch.d) / goal.z);
      return;
    }
    if (goal.z > 1.05) { // yakındayken sürükle = gezin
      const r = canvas.getBoundingClientRect();
      const worldPerPx = (2 * camera.position.distanceTo(new THREE.Vector3(view.fx, view.fy, 0)) * Math.tan((camera.fov * Math.PI) / 360)) / r.height;
      goal.fx -= dx * worldPerPx;
      goal.fy += dy * worldPerPx;
      clampGoal();
    } else { // uzakken sürükle = çevir
      vel = dx * 0.012;
      rot += vel;
    }
  });
  const up = (e) => { pointers.delete(e.pointerId); if (pointers.size < 2) pinch = null; };
  canvas.addEventListener('pointerup', up);
  canvas.addEventListener('pointercancel', up);
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    zoomAt(e.clientX, e.clientY, Math.exp(-e.deltaY * 0.0022));
  }, { passive: false });
  function toggleAt(cx, cy) {
    if (goal.z > 1.2) { goal.z = 1; goal.fx = 0; goal.fy = 5; clampGoal(); }
    else zoomAt(cx, cy, 2.6 / goal.z);
  }
  canvas.addEventListener('dblclick', (e) => toggleAt(e.clientX, e.clientY));

  const resize = () => sizeTo(st, canvas);
  addEventListener('resize', resize);
  const blink = blinker();
  let running = false;
  const t0 = performance.now();
  let last = t0;
  const size = new THREE.Vector2();
  function frame(now) {
    if (!running) return;
    requestAnimationFrame(frame);
    renderer.getSize(size);
    if (Math.abs(size.x - canvas.clientWidth) > 1 || Math.abs(size.y - canvas.clientHeight) > 1) resize();
    const t = (now - t0) / 1000;
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    if (pointers.size === 0) {
      vel *= 0.94;
      rot += vel;
      if (now - idle > 2500 && goal.z < 1.05 && !reduced()) rot += 0.006;
    }
    // Kamera yumuşakça hedefe akar
    const k = reduced() ? 1 : 1 - Math.exp(-dt * 9);
    view.z += (goal.z - view.z) * k;
    view.fx += (goal.fx - view.fx) * k;
    view.fy += (goal.fy - view.fy) * k;
    const dist = 37 / view.z;
    camera.position.set(view.fx, view.fy + 1.2 / view.z, dist);
    camera.lookAt(view.fx, view.fy, 0);
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
      Object.assign(goal, { z: 1, fx: 0, fy: 5 });
      Object.assign(view, goal);
      ui.onZoom?.(1);
    },
    zoom(f) { const r = canvas.getBoundingClientRect(); zoomAt(r.left + r.width / 2, r.top + r.height * 0.42, f); },
    reset() { Object.assign(goal, { z: 1, fx: 0, fy: 5 }); ui.onZoom?.(1); },
    start() { if (running) return; running = true; resize(); requestAnimationFrame(frame); },
    stop() { running = false; },
  };
}
