// 3D vitrin: modeller renkli kaideler üzerinde, dönen bir carousel'de.
import * as THREE from '../vendor/three.module.min.js';
import { renderModel, alphaMask, loadProductImage, MW, MH } from './garments.js';

const RADIUS = 5.6;
const MODEL_W = 1.75;
const MODEL_H = MODEL_W * (MH / MW);
const LOGO = [0x79c3f6, 0xf59bd6, 0xf9a25c, 0xffd45c];

function canvasTex(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

const radial = (inner, outer) => canvasTex(256, 256, (x, w) => {
  const g = x.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
  g.addColorStop(0, inner);
  g.addColorStop(1, outer);
  x.fillStyle = g;
  x.fillRect(0, 0, w, w);
});

const cloudTex = () => canvasTex(512, 256, (x) => {
  const puffs = [[130, 170, 70], [210, 130, 90], [300, 120, 80], [380, 165, 62], [250, 180, 75]];
  x.fillStyle = 'rgba(160,190,230,.35)';
  for (const [cx, cy, r] of puffs) { x.beginPath(); x.arc(cx + 6, cy + 10, r, 0, 7); x.fill(); }
  x.fillStyle = '#ffffff';
  for (const [cx, cy, r] of puffs) { x.beginPath(); x.arc(cx, cy, r, 0, 7); x.fill(); }
});

const starTex = () => canvasTex(128, 128, (x) => {
  x.translate(64, 64);
  x.fillStyle = '#fff';
  x.beginPath();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 ? 22 : 54;
    const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
    x.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  x.closePath();
  x.lineJoin = 'round';
  x.lineWidth = 12;
  x.strokeStyle = '#fff';
  x.stroke();
  x.fill();
});

export function createShowcase(canvas, products, hooks = {}) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  } catch (e) {
    return null;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const N = products.length;
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0xfde7f3, 17, 38);
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 120);

  scene.add(new THREE.HemisphereLight(0xffffff, 0xffd6ec, 2.0));
  const sun = new THREE.DirectionalLight(0xffffff, 1.6);
  sun.position.set(4, 9, 7);
  scene.add(sun);

  const center = new THREE.Vector3(0, 0, -RADIUS);

  // Zemin: yumuşak beyaz ışık havuzu + noktalı halka
  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(RADIUS + 4, 64),
    new THREE.MeshBasicMaterial({ map: radial('rgba(255,255,255,.95)', 'rgba(255,255,255,0)'), transparent: true, depthWrite: false }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.copy(center);
  scene.add(floor);
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(RADIUS - 0.03, RADIUS + 0.03, 128),
    new THREE.MeshBasicMaterial({ color: 0xf59bd6, transparent: true, opacity: 0.45, depthWrite: false }),
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.copy(center).setY(0.01);
  scene.add(ring);

  // Odaktaki modelin arkasında renkli ışık halesi
  const haloMat = new THREE.SpriteMaterial({ map: radial('rgba(255,255,255,1)', 'rgba(255,255,255,0)'), color: 0xf59bd6, transparent: true, opacity: 0.75, depthWrite: false });
  const halo = new THREE.Sprite(haloMat);
  halo.scale.set(7.5, 7.5, 1);
  halo.position.set(0, 2.2, -1.6);
  halo.renderOrder = -1;
  scene.add(halo);

  // Bulutlar
  const cTex = cloudTex();
  const clouds = [];
  for (let i = 0; i < 9; i++) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: cTex, transparent: true, opacity: 0.85, depthWrite: false, fog: false }));
    const k = 2.4 + Math.random() * 3;
    s.scale.set(k * 2, k, 1);
    s.position.set(-22 + i * 5.4 + Math.random() * 2, 5.5 + Math.random() * 3.5, -18 - Math.random() * 10);
    s.userData.speed = 0.15 + Math.random() * 0.25;
    scene.add(s);
    clouds.push(s);
  }

  // Yıldızlar
  const sTex = starTex();
  const stars = [];
  for (let i = 0; i < 34; i++) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: sTex, color: LOGO[i % LOGO.length], transparent: true, depthWrite: false, fog: false }));
    let x;
    do { x = (Math.random() - 0.5) * 22; } while (Math.abs(x) < 2.2);
    s.position.set(x, 0.8 + Math.random() * 6, -9 + Math.random() * 8);
    const k = 0.18 + Math.random() * 0.28;
    s.scale.set(k, k, 1);
    s.userData = { k, phase: Math.random() * 6.28, base: s.position.y };
    scene.add(s);
    stars.push(s);
  }

  // Kaideler + modeller
  const podGeo = new THREE.CylinderGeometry(1.05, 1.15, 0.42, 64);
  const capGeo = new THREE.CylinderGeometry(0.98, 0.98, 0.04, 64);
  const rimGeo = new THREE.TorusGeometry(1.06, 0.05, 12, 64);
  const shadowTex = radial('rgba(60,30,70,.35)', 'rgba(60,30,70,0)');
  const modelGeo = new THREE.PlaneGeometry(MODEL_W, MODEL_H);
  modelGeo.translate(0, MODEL_H / 2, 0);

  const items = products.map((p, i) => {
    const group = new THREE.Group();
    const podColor = new THREE.Color(p.podium);
    const pod = new THREE.Mesh(podGeo, new THREE.MeshStandardMaterial({ color: podColor, roughness: 0.45, metalness: 0.05 }));
    pod.position.y = 0.21;
    const cap = new THREE.Mesh(capGeo, new THREE.MeshStandardMaterial({ color: podColor.clone().lerp(new THREE.Color(0xffffff), 0.55), roughness: 0.3 }));
    cap.position.y = 0.44;
    const rim = new THREE.Mesh(rimGeo, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.25, metalness: 0.2 }));
    rim.rotation.x = Math.PI / 2;
    rim.position.y = 0.43;
    const shadow = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 0.6), new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false }));
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.465;

    const cvs = renderModel(p, 'front', 1.4);
    const tex = new THREE.CanvasTexture(cvs);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
    const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, alphaTest: 0.04 });
    const model = new THREE.Mesh(modelGeo, mat);
    model.position.y = 0.46;
    model.userData.index = i;

    group.add(pod, cap, rim, shadow, model);
    scene.add(group);
    const it = { p, group, model, mat, pod, mask: alphaMask(cvs), lift: 0, jump: 0, phase: i * 0.9 };
    loadProductImage(p).then((img) => {
      if (!img) return;
      const c2 = renderModel(p, 'front', 1.4, img);
      tex.image = c2;
      tex.needsUpdate = true;
      it.mask = alphaMask(c2);
    });
    return it;
  });

  // Durum
  let rot = 0;
  let target = 0;
  let focusIdx = -1;
  let hovered = null;
  let running = true;
  const pointer = new THREE.Vector2(-9, -9);
  const mouse = { x: 0, y: 0, sx: 0, sy: 0 };
  const ray = new THREE.Raycaster();
  const haloTarget = new THREE.Color(products[0].accent);
  const start = performance.now();
  let camBase = { y: 3.4, z: 15, ly: 2.65 };

  function resize() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    const portrait = w / h < 0.9;
    camera.fov = portrait ? 40 : 32;
    camBase = portrait ? { y: 3.2, z: 12.2, ly: 2.75 } : { y: 3.4, z: 15, ly: 2.65 };
    camera.updateProjectionMatrix();
  }

  const mod = (a, n) => ((a % n) + n) % n;

  function pick() {
    ray.setFromCamera(pointer, camera);
    const hits = ray.intersectObjects(items.map((it) => it.model), false);
    for (const h of hits) {
      const it = items[h.object.userData.index];
      if (it.mask.hit(h.uv.x, h.uv.y)) return it;
    }
    return null;
  }

  function frame(now) {
    if (!running) return;
    requestAnimationFrame(frame);
    const t = (now - start) / 1000;
    const prev = rot;
    rot += (target - rot) * (reduced ? 0.3 : 0.075);
    const vel = rot - prev;

    mouse.sx += (mouse.x - mouse.sx) * 0.05;
    mouse.sy += (mouse.y - mouse.sy) * 0.05;
    camera.position.set(mouse.sx * 0.5, camBase.y + mouse.sy * 0.25, camBase.z);
    camera.lookAt(0, camBase.ly, -1.2);

    const h = pick();
    if (h !== hovered) {
      hovered = h;
      canvas.style.cursor = h ? 'pointer' : '';
    }

    const fi = mod(Math.round(rot), N);
    if (fi !== focusIdx) {
      focusIdx = fi;
      items[fi].jump = 1;
      haloTarget.set(products[fi].accent);
      hooks.onFocus?.(products[fi], fi);
    }
    haloMat.color.lerp(haloTarget, 0.06);

    items.forEach((it, i) => {
      const a = ((i - rot) / N) * Math.PI * 2;
      const x = Math.sin(a) * RADIUS;
      const z = Math.cos(a) * RADIUS - RADIUS;
      it.group.position.set(x, 0, z);
      it.group.rotation.y = a;
      const depth = (1 - Math.cos(a)) / 2;
      it.lift += ((it === hovered ? 1 : 0) - it.lift) * 0.12;
      it.jump *= 0.94;
      const bob = reduced ? 0 : Math.sin(t * 2.2 + it.phase) * 0.035;
      const hop = reduced ? 0 : Math.abs(Math.sin(it.jump * Math.PI * 2.5)) * it.jump * 0.45;
      it.model.position.y = 0.46 + bob + hop + it.lift * 0.08;
      // Model her zaman kameraya bakar
      const wx = x;
      const wz = z;
      it.model.rotation.y = Math.atan2(camera.position.x - wx, camera.position.z - wz) - a;
      it.model.rotation.z = reduced ? 0 : (-vel * 2.2 * Math.cos(a)) + Math.sin(t * 1.3 + it.phase) * 0.012;
      const sc = 1 + it.lift * 0.05 + (1 - depth) * 0.04;
      it.model.scale.set(sc, sc, 1);
      it.mat.color.setScalar(1 - depth * 0.18);
    });

    halo.position.y = 2.2 + Math.sin(t * 0.8) * 0.08;
    clouds.forEach((c) => {
      c.position.x += c.userData.speed * 0.01 + vel * 0.6;
      if (c.position.x > 26) c.position.x = -26;
      if (c.position.x < -26) c.position.x = 26;
    });
    stars.forEach((s) => {
      const u = s.userData;
      const k = u.k * (0.75 + 0.25 * Math.sin(t * 2 + u.phase));
      s.scale.set(k, k, 1);
      s.material.rotation = Math.sin(t * 0.7 + u.phase) * 0.4;
      s.position.y = u.base + (reduced ? 0 : Math.sin(t * 0.9 + u.phase) * 0.15);
      s.position.x += vel * 0.9;
      if (s.position.x > 12) s.position.x -= 24;
      if (s.position.x < -12) s.position.x += 24;
    });

    renderer.render(scene, camera);
  }

  // Etkileşim
  let down = null;
  const setPointer = (e) => {
    const r = canvas.getBoundingClientRect();
    pointer.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  };
  canvas.addEventListener('pointermove', (e) => {
    if (e.pointerType === 'mouse') {
      setPointer(e);
      mouse.x = pointer.x;
      mouse.y = pointer.y;
    }
    if (down) {
      const dx = e.clientX - down.lx;
      down.lx = e.clientX;
      if (Math.abs(e.clientX - down.x) > 8) down.moved = true;
      if (down.moved) hooks.onDrag?.(dx / Math.max(140, canvas.clientWidth / 6));
    }
  });
  canvas.addEventListener('pointerleave', () => {
    pointer.set(-9, -9);
    mouse.x = mouse.y = 0;
  });
  canvas.addEventListener('pointerdown', (e) => {
    down = { x: e.clientX, y: e.clientY, lx: e.clientX, moved: false };
  });
  const end = (e) => {
    if (!down) return;
    const moved = down.moved;
    down = null;
    if (moved) { hooks.onDragEnd?.(); return; }
    setPointer(e);
    const it = pick();
    if (e.pointerType !== 'mouse') pointer.set(-9, -9);
    if (it) hooks.onSelect?.(it.p);
  };
  canvas.addEventListener('pointerup', end);
  canvas.addEventListener('pointercancel', () => { down = null; hooks.onDragEnd?.(); });

  window.addEventListener('resize', resize);
  resize();
  requestAnimationFrame(frame);

  return {
    count: N,
    setTarget(v) { target = v; },
    get target() { return target; },
    pause() { running = false; },
    resume() {
      if (running) return;
      running = true;
      requestAnimationFrame(frame);
    },
  };
}
