// Kavisli ip üzerinde asılı ürünler — scroll ile kayan 3D sahne.
import * as THREE from '../vendor/three.module.min.js';
import { renderSet, alphaMask, loadProductImage, GW, GH } from './garments.js';

const PLANE_W = 1.5;
const PLANE_H = PLANE_W * (GH / GW);
const SPACING = 0.98;
const COPIES = 3;

const ropeY = (x, base) => base + 0.009 * x * x;
const ropeZ = (x) => -0.034 * x * x;

export function createRail(canvas, products, hooks = {}) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  } catch (e) {
    return null;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  scene.add(new THREE.HemisphereLight(0xffffff, 0xd8d8de, 2.2));
  const sun = new THREE.DirectionalLight(0xffffff, 1.4);
  sun.position.set(3, 6, 8);
  scene.add(sun);

  let ropeBase = 1.25;
  let rope;
  function buildRope() {
    if (rope) {
      scene.remove(rope);
      rope.geometry.dispose();
    }
    const pts = [];
    for (let x = -18; x <= 18; x += 0.5) pts.push(new THREE.Vector3(x, ropeY(x, ropeBase) + 0.02, ropeZ(x)));
    const geo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 240, 0.028, 10, false);
    rope = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: 0xb9bcc4, metalness: 0.6, roughness: 0.35 }));
    scene.add(rope);
  }
  buildRope();

  // Ürün örnekleri (her ürün ipte birden çok kez yer alır)
  const cache = new Map();
  function assetsFor(p) {
    if (!cache.has(p.id)) {
      const cvs = renderSet(p, 'front', 1.3);
      const tex = new THREE.CanvasTexture(cvs);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
      const entry = { tex, mask: alphaMask(cvs) };
      cache.set(p.id, entry);
      loadProductImage(p).then((img) => {
        if (!img) return;
        const c2 = renderSet(p, 'front', 1.3, img);
        entry.tex.image = c2;
        entry.tex.needsUpdate = true;
        entry.mask = alphaMask(c2);
      });
    }
    return cache.get(p.id);
  }

  const geo = new THREE.PlaneGeometry(PLANE_W, PLANE_H);
  geo.translate(0, -PLANE_H / 2, 0);
  const items = [];
  const list = [];
  for (let c = 0; c < COPIES; c++) list.push(...products);
  list.forEach((p, i) => {
    const a = assetsFor(p);
    const mat = new THREE.MeshBasicMaterial({ map: a.tex, transparent: true, side: THREE.DoubleSide, depthWrite: false });
    const mesh = new THREE.Mesh(geo, mat);
    const swing = new THREE.Group();
    const holder = new THREE.Group();
    swing.add(mesh);
    holder.add(swing);
    scene.add(holder);
    mesh.userData.index = i;
    items.push({
      p, mesh, swing, holder, mat, base: i * SPACING,
      ang: 0, angV: 0, twist: 0, lift: 0, intro: 0,
      delay: 0.15 + i * 0.035, phase: Math.random() * 6.28,
    });
  });
  const TOTAL = items.length * SPACING;

  // Durum
  let offset = 0;
  let target = 0;
  let prevOffset = 0;
  let hovered = null;
  let started = performance.now();
  const pointer = new THREE.Vector2(-9, -9);
  const mouse = { x: 0, y: 0, sx: 0, sy: 0 };
  const ray = new THREE.Raycaster();
  let pointerDirty = false;
  let running = true;

  function resize() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    const portrait = w / h < 0.9;
    camera.fov = portrait ? 32 : 30;
    camera.userData.z = portrait ? 13 : 14;
    ropeBase = portrait ? 0.95 : 0.6;
    buildRope();
    camera.updateProjectionMatrix();
  }

  const wrap = (x) => ((((x + TOTAL / 2) % TOTAL) + TOTAL) % TOTAL) - TOTAL / 2;
  const smooth = (a, b, x) => {
    const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
    return t * t * (3 - 2 * t);
  };

  function pick() {
    ray.setFromCamera(pointer, camera);
    const hits = ray.intersectObjects(items.map((it) => it.mesh), false);
    for (const h of hits) {
      const it = items[h.object.userData.index];
      if (it.mat.opacity < 0.5) continue;
      if (cache.get(it.p.id).mask.hit(h.uv.x, h.uv.y)) return it;
    }
    return null;
  }

  function centered() {
    let best = null;
    let bd = 1e9;
    for (const it of items) {
      const d = Math.abs(wrap(it.base - offset));
      if (d < bd) { bd = d; best = it; }
    }
    return best;
  }

  let lastInfo = null;
  function frame(now) {
    if (!running) return;
    requestAnimationFrame(frame);
    const t = (now - started) / 1000;

    offset += (target - offset) * (reduced ? 0.3 : 0.08);
    const vel = offset - prevOffset;
    prevOffset = offset;

    mouse.sx += (mouse.x - mouse.sx) * 0.05;
    mouse.sy += (mouse.y - mouse.sy) * 0.05;
    camera.position.set(mouse.sx * 0.35, 0.35 + mouse.sy * 0.18, camera.userData.z);
    camera.lookAt(0, 0.1, -1);

    if (pointerDirty) {
      const h = pick();
      if (h !== hovered) {
        hovered = h;
        canvas.style.cursor = h ? 'pointer' : '';
      }
    }

    for (const it of items) {
      const x = wrap(it.base - offset);
      const intro = reduced ? 1 : smooth(it.delay, it.delay + 0.9, t);
      it.intro = intro;
      // Salınım: scroll hızı askıları sallar
      if (!reduced) {
        const force = vel * 0.4 + Math.sin(t * 0.9 + it.phase) * 0.0006;
        it.angV += -it.ang * 0.045 - it.angV * 0.09 + force;
        it.ang = Math.max(-0.35, Math.min(0.35, it.ang + it.angV));
      }
      const liftT = it === hovered ? 1 : 0;
      it.lift += (liftT - it.lift) * 0.12;

      const y = ropeY(x, ropeBase);
      const z = ropeZ(x);
      it.holder.position.set(x, y + (1 - intro) * 4.5 + it.lift * 0.1, z + it.lift * 0.55);
      it.holder.rotation.y = Math.atan(-2 * 0.034 * x) * -0.85 * (1 - it.lift * 0.8);
      it.swing.rotation.z = it.ang + (1 - intro) * 0.25 * Math.sin(t * 6 + it.phase);
      it.swing.rotation.x = -it.lift * 0.08;
      const sc = 1 + it.lift * 0.05;
      it.swing.scale.set(sc, sc, 1);

      const fade = 1 - smooth(TOTAL / 2 - 2.2, TOTAL / 2 - 0.4, Math.abs(x));
      it.mat.opacity = fade * intro;
      it.holder.visible = it.mat.opacity > 0.01;
      const tint = 1 - Math.min(0.22, -z * 0.055) + it.lift * 0.05;
      it.mat.color.setScalar(Math.min(1, tint));
      it.mesh.renderOrder = Math.round((z + it.lift) * 100);
    }

    renderer.render(scene, camera);

    const info = hovered || centered();
    if (info && info.p !== lastInfo) {
      lastInfo = info.p;
      hooks.onFocus?.(info.p, !!hovered);
    }
  }

  // Etkileşim
  let down = null;
  canvas.addEventListener('pointermove', (e) => {
    const r = canvas.getBoundingClientRect();
    pointer.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    mouse.x = pointer.x;
    mouse.y = pointer.y;
    pointerDirty = e.pointerType === 'mouse';
    if (down && e.pointerType === 'mouse' && e.buttons === 1) {
      const dx = e.clientX - down.lx;
      down.lx = e.clientX;
      if (Math.abs(e.clientX - down.x) > 6) down.moved = true;
      hooks.onDrag?.(dx);
    }
  });
  canvas.addEventListener('pointerleave', () => {
    pointer.set(-9, -9);
    pointerDirty = true;
    mouse.x = mouse.y = 0;
  });
  canvas.addEventListener('pointerdown', (e) => {
    down = { x: e.clientX, y: e.clientY, lx: e.clientX, moved: false };
  });
  canvas.addEventListener('pointerup', (e) => {
    if (!down) return;
    const moved = down.moved || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 8;
    down = null;
    if (moved) return;
    const r = canvas.getBoundingClientRect();
    pointer.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    const it = pick();
    if (it) hooks.onSelect?.(it.p);
  });

  window.addEventListener('resize', resize);
  resize();
  requestAnimationFrame(frame);

  return {
    total: TOTAL,
    setTarget(v) { target = v; },
    // Ürünü ortalamak için gereken offset (mevcut konuma en yakın kopya)
    offsetFor(id) {
      let best = null;
      let bd = 1e9;
      for (const it of items) {
        if (it.p.id !== id) continue;
        const d = wrap(it.base - target);
        if (Math.abs(d) < Math.abs(bd)) { bd = d; best = it; }
      }
      return best ? target + bd : target;
    },
    pause() { running = false; },
    resume() {
      if (running) return;
      running = true;
      requestAnimationFrame(frame);
    },
  };
}
