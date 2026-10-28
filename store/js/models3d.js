// Ürün fotoğraflarını derinlik haritasıyla hacimli 3D yüzeylere dönüştürür.
import * as THREE from '../vendor/three.module.min.js';

const THICK = 0.17; // model boyuna göre gövde kalınlığı
const SEG_X = 120;

function loadImage(src) {
  return new Promise((res, rej) => {
    const im = new Image();
    im.onload = () => res(im);
    im.onerror = rej;
    im.src = src;
  });
}

function sampler(img) {
  const c = document.createElement('canvas');
  c.width = img.width;
  c.height = img.height;
  const x = c.getContext('2d');
  x.drawImage(img, 0, 0);
  const d = x.getImageData(0, 0, c.width, c.height).data;
  const W = c.width;
  const H = c.height;
  // Çift doğrusal örnekleme (u, v: 0–1, v aşağıdan yukarı)
  return (u, v) => {
    const fx = Math.min(W - 1.001, Math.max(0, u * (W - 1)));
    const fy = Math.min(H - 1.001, Math.max(0, (1 - v) * (H - 1)));
    const x0 = fx | 0;
    const y0 = fy | 0;
    const tx = fx - x0;
    const ty = fy - y0;
    const g = (xx, yy) => d[(yy * W + xx) * 4] / 255;
    return (g(x0, y0) * (1 - tx) + g(x0 + 1, y0) * tx) * (1 - ty) + (g(x0, y0 + 1) * (1 - tx) + g(x0 + 1, y0 + 1) * tx) * ty;
  };
}

export function createModels3D(canvas, products) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  } catch (e) {
    return null;
  }
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  camera.position.set(0, 0, 12);

  // Işık: fotoğraf renklerini koruyan yumuşak stüdyo ışığı + renkli kenar ışığı
  scene.add(new THREE.HemisphereLight(0xffffff, 0xf3e6ff, 1.55));
  const key = new THREE.DirectionalLight(0xffffff, 1.05);
  key.position.set(-3, 4, 8);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xffc6ea, 1.4);
  rim.position.set(5, 2, -4);
  scene.add(rim);
  const rim2 = new THREE.DirectionalLight(0xa9dcff, 1.1);
  rim2.position.set(-6, 1, -3);
  scene.add(rim2);

  const items = products.map((p) => {
    const group = new THREE.Group();
    const spin = new THREE.Group();
    group.add(spin);
    group.visible = false;
    scene.add(group);
    const it = { p, group, spin, mesh: null, depth: null, aspect: 0.45, ready: false };
    Promise.all([loadImage(p.image), loadImage(p.depth)]).then(([img, dimg]) => {
      const aspect = img.width / img.height;
      const depth = sampler(dimg);
      const segY = Math.round(SEG_X / aspect);
      const geo = new THREE.PlaneGeometry(aspect, 1, SEG_X, segY);
      geo.translate(0, 0.5, 0);
      const pos = geo.attributes.position;
      const uv = geo.attributes.uv;
      for (let k = 0; k < pos.count; k++) {
        pos.setZ(k, depth(uv.getX(k), uv.getY(k)) * THICK);
      }
      geo.computeVertexNormals();
      const tex = new THREE.Texture(img);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
      tex.needsUpdate = true;
      const mat = new THREE.MeshLambertMaterial({ map: tex, transparent: true, alphaTest: 0.45, side: THREE.DoubleSide });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.x = 0; // merkez: x = 0
      spin.add(mesh);
      // Arka yüz: aynı silüet, koyu ve hafif içeride (yan dönüşte boşluk görünmesin)
      const back = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ map: tex, color: 0x9a90b8, transparent: true, alphaTest: 0.45, side: THREE.DoubleSide }));
      back.scale.z = -0.35;
      spin.add(back);
      Object.assign(it, { mesh, back, depth, aspect, ready: true });
    });
    return it;
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

  const v3 = new THREE.Vector3();
  // states[i] = { x: ekran oranı, floor: ekran oranı, height: ekran oranı, rotY, scale, opacity }
  function render(states) {
    items.forEach((it, i) => {
      const s = states[i];
      it.group.visible = it.ready && s.opacity > 0.01;
      if (!it.group.visible) return;
      const H = visH * s.height * s.scale;
      it.group.position.set((s.x - 0.5) * visW, (0.5 - s.floor) * visH, 0);
      it.group.scale.set(H, H, H);
      it.spin.rotation.y = s.rotY;
      it.spin.rotation.x = s.rotX || 0;
      it.mesh.material.opacity = s.opacity;
      it.back.material.opacity = s.opacity;
      it.mesh.material.depthWrite = s.opacity > 0.6;
    });
    renderer.render(scene, camera);
  }

  // Fotoğraf üzerindeki (x, y) noktasının ekrandaki yeri
  function project(i, x, y) {
    const it = items[i];
    if (!it.ready || !it.group.visible) return null;
    v3.set((x - 0.5) * it.aspect, 1 - y, it.depth(x, 1 - y) * THICK + 0.01);
    it.mesh.localToWorld(v3);
    v3.project(camera);
    return { x: (v3.x * 0.5 + 0.5) * vw, y: (-v3.y * 0.5 + 0.5) * vh, front: v3.z < 1 };
  }

  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  function pick(px, py) {
    ndc.set((px / vw) * 2 - 1, -(py / vh) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const meshes = items.filter((it) => it.ready && it.group.visible).map((it) => it.mesh);
    const hit = ray.intersectObjects(meshes, false).find((h) => {
      const it = items.find((x) => x.mesh === h.object);
      return it.depth(h.uv.x, h.uv.y) > 0.02;
    });
    return hit ? items.findIndex((x) => x.mesh === hit.object) : -1;
  }

  return { resize, render, project, pick };
}
