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

/* ---------- Koleksiyon vitrini: tek sırada, eşit ölçekte, kayan premium vitrin ---------- */
// Figürler aynı boyda ve aralıkta tek sıra hâlinde durur; kamera sıranın üzerinde kayar.
// Her figürün altında ad/fiyat kartı. Oklar, sürükleme ve kısa süreli otomatik kayma.
export function createLineup(canvas, products, hooks = {}) {
  const st = makeStage(canvas, { fov: 24, shadowExtent: 60, groundOpacity: 0.14 });
  if (!st) return null;
  const { scene, camera, renderer } = st;
  const cache = new Map();
  const stage = canvas.parentElement;
  const cardsEl = document.createElement('div');
  cardsEl.className = 'lineup-cards';
  stage.append(cardsEl);
  const figs = products.map((p, i) => {
    const f = buildFigure(p, cache, { lite: true });
    f.root.userData.pedestal?.scale.set(0.78, 1, 0.78);
    scene.add(f.root);
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'lineup-card';
    card.innerHTML = `<b>${p.name}</b><span>${hooks.price ? hooks.price(p.price) : p.price}</span><em>İncele</em>`;
    card.style.setProperty('--c', p.accent);
    card.addEventListener('click', () => hooks.onOpen?.(p));
    cardsEl.append(card);
    return { f, p, i, card, lift: 0, x: 0, show: 1, on: true };
  });
  const GAP = 6;
  let filter = () => true;
  let list = figs;
  let nVis = 5;
  let focus = 0;
  let target = 0;
  let hovered = -1;
  let lastUse = 0;
  const minF = () => Math.min((nVis - 1) / 2, (list.length - 1) / 2);
  const maxF = () => Math.max(list.length - 1 - (nVis - 1) / 2, (list.length - 1) / 2);
  const clampT = (v) => Math.max(minF(), Math.min(maxF(), v));
  function layout() {
    list = figs.filter((g) => filter(g.p));
    figs.forEach((g) => { g.on = list.includes(g); });
    list.forEach((g, k) => { g.x = k * GAP; });
    target = clampT(target);
  }
  function resize() {
    sizeTo(st, canvas);
    const w = canvas.clientWidth;
    nVis = w > 1180 ? 5 : w > 860 ? 4 : w > 560 ? 3 : 1.7;
    layout();
    focus = target;
  }
  addEventListener('resize', resize);
  resize();
  focus = target = minF();

  // Oklar
  const nav = (d) => { target = clampT(Math.round(target + d)); lastUse = performance.now(); };
  stage.querySelector('.world-prev')?.addEventListener('click', () => nav(-1));
  stage.querySelector('.world-next')?.addEventListener('click', () => nav(1));

  // Sürükleme ve seçme
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2(-9, -9);
  const setNdc = (e) => {
    const r = canvas.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  };
  let drag = null;
  canvas.addEventListener('pointerdown', (e) => { drag = { x: e.clientX, f: target, moved: 0 }; canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener('pointermove', (e) => {
    setNdc(e);
    if (!drag) return;
    const dx = e.clientX - drag.x;
    drag.moved = Math.max(drag.moved, Math.abs(dx));
    const unitsPerPx = (nVis * GAP) / canvas.clientWidth / GAP;
    target = clampT(drag.f - dx * unitsPerPx);
    lastUse = performance.now();
  });
  const up = (e) => {
    if (!drag) return;
    const click = drag.moved < 6;
    drag = null;
    target = clampT(Math.round(target));
    if (click) { setNdc(e); const i = pickAt(); if (i >= 0) hooks.onOpen?.(products[i]); }
  };
  canvas.addEventListener('pointerup', up);
  canvas.addEventListener('pointercancel', () => { drag = null; });
  canvas.addEventListener('pointerleave', () => ndc.set(-9, -9));
  function pickAt() {
    ray.setFromCamera(ndc, camera);
    for (const g of list) if (ray.intersectObjects(g.f.meshes, false).length) return g.i;
    return -1;
  }

  const blink = blinker();
  const v = new THREE.Vector3();
  let lastT = 0;
  loopWhenVisible(canvas, (t) => {
    const dt = Math.min(0.1, t - lastT);
    lastT = t;
    // Etkileşim yoksa birkaç saniyede bir sonraki takıma kayar, sonda başa döner
    if (!drag && !reduced() && performance.now() - lastUse > 6000 && hovered < 0 && list.length > nVis) {
      lastUse = performance.now();
      target = target >= maxF() - 0.01 ? minF() : clampT(Math.round(target) + 1);
    }
    focus += (target - focus) * (1 - Math.exp(-dt * 6));
    const T = Math.tan((camera.fov * Math.PI) / 360);
    const dist = (nVis * GAP) / (2 * T * camera.aspect);
    const cx = focus * GAP;
    camera.position.set(cx, 5.2 + dist * 0.07, dist);
    camera.lookAt(cx, 4.4, 0);
    const h = drag ? -1 : pickAt();
    if (h !== hovered) { hovered = h; canvas.style.cursor = h >= 0 ? 'pointer' : 'grab'; }
    const b = blink(t);
    const r = canvas.getBoundingClientRect();
    figs.forEach((g) => {
      g.show += ((g.on ? 1 : 0) - g.show) * 0.15;
      g.lift += ((g.i === hovered ? 1 : 0) - g.lift) * 0.15;
      const { root } = g.f;
      root.visible = g.show > 0.02;
      if (!root.visible) { g.card.style.opacity = 0; g.card.style.pointerEvents = 'none'; return; }
      root.position.set(g.x, -(1 - g.show) * 2, g.lift * 1.2);
      root.scale.setScalar((0.92 + g.show * 0.08) * (1 + g.lift * 0.05));
      const face = Math.atan2(camera.position.x - root.position.x, camera.position.z - root.position.z);
      root.rotation.y = face + (reduced() ? 0 : Math.sin(t * 0.3 + g.i) * 0.12 * (1 - g.lift));
      animateFigure(g.f, t, g.i, b && g.i % 3 === 0, g.lift);
      // Kart: kaidenin hemen altında; görünür alanın kenarlarında söner
      v.set(g.x, -0.2, 0);
      v.project(camera);
      const sx = (v.x * 0.5 + 0.5) * r.width;
      const edge = Math.min(1, Math.max(0, Math.min(sx, r.width - sx) / 80));
      g.card.style.transform = `translate(${sx.toFixed(1)}px, ${((-v.y * 0.5 + 0.5) * r.height).toFixed(1)}px) translate(-50%, 0)`;
      g.card.style.opacity = (edge * g.show).toFixed(3);
      g.card.style.pointerEvents = edge > 0.5 ? 'auto' : 'none';
      g.card.classList.toggle('is-hover', g.i === hovered);
    });
    renderer.render(scene, camera);
    const bar = stage.querySelector('.world-progress b');
    if (bar) {
      const span = Math.max(0.0001, maxF() - minF());
      bar.style.width = `${Math.min(100, (nVis / Math.max(nVis, list.length)) * 100)}%`;
      bar.style.marginLeft = `${((focus - minF()) / span) * (100 - Math.min(100, (nVis / Math.max(nVis, list.length)) * 100))}%`;
    }
  });

  return { setFilter(fn) { filter = fn; layout(); lastUse = performance.now(); } };
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
const FEET_Y = 0.36; // figürün ayak tabanı (kaide üst yüzeyi) kök koordinatında
export function createFinale(canvas, products, hooks = {}) {
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
  for (let i = 0; i < 11; i++) {
    const m = new THREE.Mesh(extrude(starShape(1, 0.46), 0.35), gloss(cols[i % cols.length], 0.25));
    m.userData = { a: (i / 11) * Math.PI * 2, r: 8 + (i % 3) * 2.4, y: 3 + (i % 4) * 2.2, s: 0.3 + (i % 3) * 0.14 };
    scene.add(m);
    stars.push(m);
  }
  const cloudMat = gloss('#ffffff');
  cloudMat.roughness = 0.6;
  // Arka planda yavaşça kayan bulutlar (derinlik hissi)
  const farMat = gloss('#c9c2ff');
  farMat.roughness = 0.8;
  farMat.transparent = true;
  farMat.opacity = 0.45;
  const far = [0, 1, 2].map((i) => {
    const c = cloudGroup(farMat);
    c.scale.set(2.2 + i * 0.6, 0.9, 1.2);
    c.userData = { y: 12 + i * 1.6, z: -22 - i * 4, off: i * 13, v: 0.5 + i * 0.25 };
    scene.add(c);
    return c;
  });
  // Kayan yıldız
  const shoot = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.0, 4, 8), new THREE.MeshBasicMaterial({ color: '#fff6c8', transparent: true, opacity: 0 }));
  shoot.rotation.z = Math.PI / 2.6;
  scene.add(shoot);

  // Üç bulut sahne: ortada öne çıkan takım, iki yanda geride süzülen takımlar.
  // Birkaç saniyede bir üçlü sıradaki takımlara geçer; 12 takımın hepsi sırayla görünür.
  const slots = [0, 1, 2].map((k) => {
    const g = new THREE.Group();
    const cloud = cloudGroup(cloudMat);
    cloud.scale.set(k ? 2.3 : 3.1, k ? 1.05 : 1.35, k ? 1.8 : 2.3);
    // Bulutun üst yüzeyi figürün ayak hizasına (kaide yüksekliği) gelsin; ayaklar hafifçe gömülür
    const top = new THREE.Box3().setFromObject(cloud).max.y;
    cloud.position.y = FEET_Y - 0.1 - top;
    g.add(cloud);
    scene.add(g);
    return { g, k, fig: null, id: null };
  });
  const pool = new Map();
  const cache = new Map();
  const figFor = (p) => {
    let f = pool.get(p.id);
    if (!f) {
      f = buildFigure(p, cache);
      f.root.userData.pedestal && (f.root.userData.pedestal.visible = false); // bulut kaide görevi görür
      f.root.visible = false;
      scene.add(f.root);
      pool.set(p.id, f);
    }
    return f;
  };
  const N = products.length;
  const PERIOD = 7.5;
  const pick = canvas.parentElement.querySelector('.finale-pick');
  let shownCycle = -1;

  const resize = () => sizeTo(st, canvas);
  addEventListener('resize', resize);
  resize();
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  canvas.addEventListener('click', (e) => {
    const r = canvas.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    for (const sl of slots) {
      if (sl.fig && sl.fig.root.visible && ray.intersectObjects(sl.fig.meshes, false).length) { hooks.onOpen?.(products.find((p) => p.id === sl.id)); return; }
    }
  });
  canvas.addEventListener('pointermove', (e) => {
    const r = canvas.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    canvas.style.cursor = slots.some((sl) => sl.fig && sl.fig.root.visible && ray.intersectObjects(sl.fig.meshes, false).length) ? 'pointer' : '';
  });
  pick?.addEventListener('click', () => hooks.onOpen?.(products.find((p) => p.id === slots[0].id)));

  const blink = blinker();
  const v = new THREE.Vector3();
  const pop = (x) => x * x * (3 - 2 * x);
  loopWhenVisible(canvas, (t) => {
    const r = canvas.getBoundingClientRect();
    const q = clampS(1 - (r.top + r.height * 0.2) / innerHeight);
    const portrait = r.width / r.height < 0.9;
    const cycle = Math.floor(t / PERIOD);
    const local = t - cycle * PERIOD;
    // Yerleşim: masaüstünde metin kutusunun sağında, mobilde üstte
    const cx = portrait ? 0 : 7;
    const pos = portrait
      ? [[cx, 0.6, 0], [cx - 3.5, 1.6, -4], [cx + 3.5, 1.6, -4]]
      : [[cx, 0.6, 0], [cx - 6.2, 2.4, -7], [cx + 6.4, 2.4, -7]];
    const scl = portrait ? [0.62, 0.46, 0.46] : [1, 0.72, 0.72];
    slots.forEach((sl, k) => {
      const p = products[(cycle * 3 + k) % N];
      if (sl.id !== p.id) {
        if (sl.fig) sl.fig.root.visible = false;
        sl.fig = figFor(p);
        sl.id = p.id;
      }
      // Değişimde figür buluttan yükselip görünür, sonunda yumuşakça küçülür
      const appear = pop(clampS((local - k * 0.18) / 0.9)) * pop(clampS((PERIOD - local) / 0.7));
      const bob = reduced() ? 0 : Math.sin(t * 0.9 + k * 2) * 0.25;
      const [x, y, z] = pos[k];
      sl.g.position.set(x, y + bob, z);
      sl.g.scale.setScalar(scl[k]);
      const f = sl.fig;
      f.root.visible = appear > 0.01;
      f.root.position.set(x, y + bob - (1 - appear) * 1.2, z);
      f.root.scale.setScalar(scl[k] * (0.6 + 0.4 * appear));
      // Yavaş, kesintisiz dönüş; her tur karşıdan başlar
      // Ortadaki her turda tam bir dönüş yapar (karşıdan başlar, karşıda biter); yandakiler salınır
      f.root.rotation.y = reduced() ? 0 : k === 0 ? pop(clampS(local / PERIOD)) * Math.PI * 2 : Math.sin(t * 0.5 + k * 2) * 0.45;
      animateFigure(f, t, k, blink(t) && k === 0, 0);
    });
    // Sıradaki üçlünün karelerini önceden yükle: görünmez ama çizime girer
    const nextIds = new Set([0, 1, 2].map((k) => products[(cycle * 3 + 3 + k) % N].id));
    if (local > PERIOD - 2.5) for (const id of nextIds) {
      const f = figFor(products.find((p) => p.id === id));
      // görünür alanın içinde, çok küçük: çizime girer, böylece kareleri yüklenir
      if (!slots.some((sl) => sl.fig === f)) { f.root.visible = true; f.root.position.set(cx, 3, -12); f.root.scale.setScalar(0.002); }
    }
    const mx = portrait ? 3.6 : 13.5;
    moon.position.set(mx, portrait ? 7.5 + q * 2 : 9 + q * 4, -9);
    moon.rotation.set(0, Math.sin(t * 0.4) * 0.4, -0.35 + Math.sin(t * 0.6) * 0.06);
    moon.scale.setScalar(portrait ? 2.2 : 3.2);
    glow.position.set(mx - 1.5, 10 + q * 3, -4);
    stars.forEach((s, i) => {
      const u = s.userData;
      s.position.set(cx + Math.cos(u.a + t * 0.07) * u.r, u.y + Math.sin(t + i) * 0.4, -6 + Math.sin(u.a + t * 0.07) * 3);
      s.rotation.y = t * 0.6 + i;
      s.scale.setScalar(u.s * (portrait ? 0.8 : 1));
    });
    far.forEach((c) => {
      const u = c.userData;
      c.position.set(((t * u.v + u.off) % 60) - 30, u.y, u.z);
    });
    const sp = (t % 9) / 1.2; // her 9 sn'de bir kayan yıldız
    shoot.material.opacity = sp < 1 ? Math.sin(sp * Math.PI) * 0.9 : 0;
    shoot.position.set(-4 + sp * 14, 16 - sp * 5, -14);
    camera.position.set(Math.sin(t * 0.2) * 1.2, portrait ? 4 : 6.5, portrait ? 42 : 34 - q * 4);
    camera.lookAt(portrait ? 0 : 2, portrait ? 0.4 : 5.4, 0);
    renderer.render(scene, camera);
    // Ortadaki takımın adı: kaidenin altında
    if (pick) {
      const p = products.find((x) => x.id === slots[0].id);
      if (cycle !== shownCycle) {
        shownCycle = cycle;
        pick.querySelector('b').textContent = p.name;
        pick.querySelector('span').textContent = `${hooks.price ? hooks.price(p.price) : p.price} · İncele`;
        pick.hidden = false;
      }
      v.set(pos[0][0], pos[0][1] - 1.4 * scl[0], pos[0][2] + 2);
      v.project(camera);
      pick.style.left = `${(v.x * 0.5 + 0.5) * r.width}px`;
      // ekranın altında kesilmesin
      pick.style.top = `${Math.min((-v.y * 0.5 + 0.5) * r.height, r.height - pick.offsetHeight - 16)}px`;
      const a0 = pop(clampS(local / 0.9)) * pop(clampS((PERIOD - local) / 0.7));
      pick.style.opacity = a0.toFixed(3);
    }
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
  // Varsayılan kadraj: model biraz yukarıda durur, altında "Çantaya at" çantasına yer kalır
  const FY = 3.5;
  const DIST = 42;
  const view = { z: 1, fx: 0, fy: FY };
  const goal = { z: 1, fx: 0, fy: FY };
  const clampGoal = () => {
    goal.z = clampS(goal.z, 1, MAXZ);
    const spanY = 5 * (1 - 1 / goal.z);
    goal.fy = clampS(goal.fy, FY - spanY - 0.3, FY + spanY + 2.1);
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
    if (nz <= 1.001) { goal.fx = 0; goal.fy = FY; }
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
    if (goal.z > 1.2) { goal.z = 1; goal.fx = 0; goal.fy = FY; clampGoal(); }
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
      // Boşta: tam tur dönmek yerine en yakın ön görünüme döner ve çok hafif salınır
      if (now - idle > 2500 && !reduced()) {
        const front = Math.round(rot / (Math.PI * 2)) * Math.PI * 2;
        const sway = goal.z < 1.05 ? Math.sin((now - idle - 2500) / 2600) * 0.1 : 0;
        rot += (front + sway - rot) * 0.03;
      }
    }
    // Kamera yumuşakça hedefe akar
    const k = reduced() ? 1 : 1 - Math.exp(-dt * 9);
    view.z += (goal.z - view.z) * k;
    view.fx += (goal.fx - view.fx) * k;
    view.fy += (goal.fy - view.fy) * k;
    const dist = DIST / view.z;
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
      rot = 0; // her ürün tam karşıdan açılır
      vel = 0;
      Object.assign(goal, { z: 1, fx: 0, fy: FY });
      Object.assign(view, goal);
      ui.onZoom?.(1);
    },
    zoom(f) { const r = canvas.getBoundingClientRect(); zoomAt(r.left + r.width / 2, r.top + r.height * 0.42, f); },
    reset() { Object.assign(goal, { z: 1, fx: 0, fy: FY }); ui.onZoom?.(1); },
    start() { if (running) return; running = true; resize(); requestAnimationFrame(frame); },
    stop() { running = false; },
  };
}
