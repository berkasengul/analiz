import * as THREE from 'three';

// Açılış sahnesi: ipek dalgalı arka plan, ahşap kütük, meyve yığını, yapraklar, ön plan derinliği, bokeh ve kırıntılar.
// Hepsi `v` (1 = açılış, 0 = dağılmış) değeriyle birlikte gelir ve gider.

export const PED_TOP = -0.585; // kütüğün üst yüzeyi (paket kökü biriminde)
export const TILT = 0.04; // kütüğün kameraya doğru eğimi
// kütük yüzeyinin z derinliğine göre yüksekliği (paketler ve meyveler bu yüzeye oturur)
export const surfY = (z) => PED_TOP - z * Math.sin(TILT);

function rng(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}
function canvasTex(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

/* ---------- arka plan: ışık, vinyet, ipek ---------- */
const bgVert = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`;
const bgFrag = /* glsl */ `
  uniform vec3 uColor;
  uniform float uTime, uOpacity, uAspect, uMobile;
  varying vec2 vUv;
  float silkH(vec2 q, float t) {
    return sin(q.x * 8.0 + q.y * 13.0 + t * 0.35) * 0.5
         + sin(q.x * 15.0 - q.y * 5.0 + t * 0.27) * 0.25
         + sin((q.x + q.y) * 23.0 + t * 0.42) * 0.1;
  }
  void main() {
    vec2 uv = vUv;
    vec3 base = uColor;
    // merkezde sıcak ışık, kenarlarda koyulaşma
    vec2 c = mix(vec2(0.66, 0.56), vec2(0.5, 0.68), uMobile);
    float d = length((uv - c) * vec2(uAspect * 0.75, 1.0));
    float glow = 1.0 - smoothstep(0.0, 0.95, d);
    vec3 col = base * mix(0.4, 1.55, glow) + vec3(0.28, 0.09, 0.0) * glow * glow;
    // sağ üstten ışık huzmeleri
    vec2 lp = uv - vec2(1.02, 1.06);
    lp.x *= uAspect;
    float ang = atan(lp.y, lp.x);
    float rays = (0.5 + 0.5 * sin(ang * 23.0 + uTime * 0.12)) * (0.5 + 0.5 * sin(ang * 9.0 - uTime * 0.08));
    float rf = smoothstep(1.6, 0.0, length(lp));
    col += vec3(1.0, 0.82, 0.62) * (rays * rf * 0.13 + rf * rf * 0.16);
    // sol altta kırmızı ipek dalgaları
    float sx = uv.x, sy = uv.y;
    float edge = mix(0.52 - 0.5 * sx, 0.22 - 0.12 * sx, uMobile) + 0.05 * sin(sx * 6.0 + uTime * 0.22);
    float m = smoothstep(edge + 0.035, edge - 0.03, sy);
    vec2 q = vec2(sx * uAspect * 0.6, sy);
    float h0 = silkH(q, uTime);
    float hx = silkH(q + vec2(0.004, 0.0), uTime);
    float hy = silkH(q + vec2(0.0, 0.004), uTime);
    vec2 g = vec2(hx - h0, hy - h0) / 0.004;
    float shade = clamp(0.5 + dot(normalize(vec3(-g * 0.05, 1.0)), normalize(vec3(-0.6, 0.7, 0.6))) * 0.5, 0.0, 1.0);
    float spec = pow(shade, 9.0);
    vec3 silk = base * (0.22 + 1.25 * shade) + vec3(1.0, 0.74, 0.68) * spec * 0.9;
    float rim = smoothstep(0.025, 0.0, abs(sy - edge)) * 0.5;
    silk += vec3(1.0, 0.7, 0.6) * rim;
    col = mix(col, silk, m * 0.92);
    gl_FragColor = vec4(col, uOpacity);
  }
`;

/* ---------- ahşap kütük dokuları ---------- */
function woodTop() {
  return canvasTex(1024, 1024, (x, W) => {
    const r = rng(5);
    const c = W / 2;
    x.fillStyle = '#7b4826';
    x.fillRect(0, 0, W, W);
    const tone = x.createRadialGradient(c, c, 0, c, c, 470);
    tone.addColorStop(0, '#a8703f'); tone.addColorStop(0.55, '#8a5530'); tone.addColorStop(1, '#6a3a1d');
    x.fillStyle = tone; x.fillRect(0, 0, W, W);
    // yıllık halkalar
    for (let rad = 8; rad < 470; rad += 5 + r() * 11) {
      x.beginPath();
      for (let a = 0; a <= 64; a++) {
        const t = (a / 64) * Math.PI * 2;
        const w = rad * (1 + 0.03 * Math.sin(t * 3 + rad * 0.05) + 0.015 * Math.sin(t * 7 + rad));
        const px = c + Math.cos(t) * w, py = c + Math.sin(t) * w;
        if (a) x.lineTo(px, py); else x.moveTo(px, py);
      }
      const dark = r() > 0.5;
      x.strokeStyle = dark ? `rgba(58,28,10,${0.35 + r() * 0.4})` : `rgba(214,160,104,${0.2 + r() * 0.3})`;
      x.lineWidth = 1 + r() * 3.5;
      x.stroke();
    }
    // çatlaklar
    for (let i = 0; i < 11; i++) {
      const a = r() * Math.PI * 2;
      let px = c + Math.cos(a) * (40 + r() * 80), py = c + Math.sin(a) * (40 + r() * 80);
      x.beginPath(); x.moveTo(px, py);
      const len = 120 + r() * 300;
      for (let s = 0; s < len; s += 12) {
        px += Math.cos(a + (r() - 0.5) * 0.6) * 12; py += Math.sin(a + (r() - 0.5) * 0.6) * 12;
        x.lineTo(px, py);
      }
      x.strokeStyle = 'rgba(40,20,8,.7)'; x.lineWidth = 2 + r() * 3; x.stroke();
    }
    // lif gürültüsü
    for (let i = 0; i < 9000; i++) {
      x.fillStyle = r() > 0.5 ? 'rgba(60,30,12,.09)' : 'rgba(220,170,120,.07)';
      x.fillRect(r() * W, r() * W, 1 + r() * 4, 1 + r() * 2);
    }
    // kabuk
    const g = x.createRadialGradient(c, c, 440, c, c, 512);
    g.addColorStop(0, 'rgba(50,28,14,0)');
    g.addColorStop(0.35, 'rgba(58,32,16,.95)');
    g.addColorStop(1, 'rgba(30,16,8,1)');
    x.fillStyle = g; x.fillRect(0, 0, W, W);
    // merkezde ışık
    const l = x.createRadialGradient(c * 1.1, c * 0.85, 0, c, c, 520);
    l.addColorStop(0, 'rgba(255,210,160,.18)');
    l.addColorStop(1, 'rgba(0,0,0,.15)');
    x.fillStyle = l; x.fillRect(0, 0, W, W);
  });
}
function woodSide() {
  const t = canvasTex(1024, 256, (x, W, H) => {
    const r = rng(9);
    x.fillStyle = '#4a2c18'; x.fillRect(0, 0, W, H);
    for (let i = 0; i < 420; i++) {
      const px = r() * W, w = 2 + r() * 9;
      x.fillStyle = r() > 0.5 ? `rgba(25,12,5,${0.3 + r() * 0.4})` : `rgba(140,92,55,${0.2 + r() * 0.3})`;
      x.beginPath(); x.moveTo(px, 0);
      for (let y = 0; y <= H; y += 16) x.lineTo(px + Math.sin(y * 0.05 + i) * 4 + (r() - 0.5) * 3, y);
      x.lineTo(px + w, H); x.lineTo(px + w, 0); x.fill();
    }
    const g = x.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, 'rgba(255,200,150,.12)'); g.addColorStop(1, 'rgba(0,0,0,.45)');
    x.fillStyle = g; x.fillRect(0, 0, W, H);
  });
  t.wrapS = THREE.RepeatWrapping;
  t.repeat.set(2, 1);
  return t;
}

export function createHeroStage({ scene, root, camera, spriteTex }) {
  /* arka plan düzlemi */
  const bgMat = new THREE.ShaderMaterial({
    vertexShader: bgVert,
    fragmentShader: bgFrag,
    uniforms: {
      uColor: { value: new THREE.Color('#b90d10') },
      uTime: { value: 0 }, uOpacity: { value: 1 }, uAspect: { value: 1.6 }, uMobile: { value: 0 },
    },
    transparent: true, depthWrite: false, depthTest: true,
  });
  bgMat.toneMapped = false;
  const bg = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), bgMat);
  bg.renderOrder = -10;
  bg.position.z = -6;
  scene.add(bg);

  /* kütük ve üstündekiler (paketle birlikte hareket eder) */
  const stage = new THREE.Group();
  root.add(stage);
  const PH = 0.5, PR = 1.3;
  const geo = new THREE.CylinderGeometry(PR, PR * 1.04, PH, 72, 3);
  {
    const p = geo.attributes.position, r = rng(3);
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), z = p.getZ(i), y = p.getY(i);
      const len = Math.hypot(x, z);
      if (len > 0.01) {
        const a = Math.atan2(z, x);
        const k = 1 + 0.025 * Math.sin(a * 5) + 0.015 * Math.sin(a * 13 + y * 4) + (Math.abs(y) < PH / 2 - 0.001 ? (r() - 0.5) * 0.02 : 0);
        p.setX(i, x * k); p.setZ(i, z * k);
      }
    }
    geo.computeVertexNormals();
  }
  const sideTex = woodSide(), topTex = woodTop();
  const side = new THREE.MeshStandardMaterial({ map: sideTex, bumpMap: sideTex, bumpScale: 3, roughness: 0.95, envMapIntensity: 0.2 });
  const top = new THREE.MeshStandardMaterial({ map: topTex, bumpMap: topTex, bumpScale: 2, roughness: 0.78, envMapIntensity: 0.28 });
  const ped = new THREE.Mesh(geo, [side, top, side]);
  ped.position.set(0.05, PED_TOP - (PH / 2) * Math.cos(TILT), -0.45 + (PH / 2) * Math.sin(TILT));
  ped.position.y = surfY(-0.45) - (PH / 2) * Math.cos(TILT);
  ped.rotation.x = TILT;
  ped.receiveShadow = true;
  stage.add(ped);
  // paketlerin altındaki temas gölgesi
  const contact = new THREE.Mesh(
    new THREE.PlaneGeometry(2.6, 1.3),
    new THREE.MeshBasicMaterial({
      map: canvasTex(256, 128, (x, w, h) => {
        const g = x.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
        g.addColorStop(0, 'rgba(20,6,0,.75)'); g.addColorStop(0.5, 'rgba(20,6,0,.35)'); g.addColorStop(1, 'rgba(20,6,0,0)');
        x.setTransform(1, 0, 0, 0.5, 0, h / 4); x.fillStyle = g; x.fillRect(0, 0, w, h * 2);
      }),
      transparent: true, depthWrite: false,
    })
  );
  contact.rotation.x = -Math.PI / 2 + TILT;
  contact.position.set(0.05, surfY(-0.5) + 0.004, -0.5);
  stage.add(contact);

  // görsel yerleştirme yardımcısı
  const sprites = [];
  function addSprite(parent, url, aspect, { pos, size, rot = 0, flip = 1, opacity = 1, kind = 'pile', drift = 0, add = false, color }) {
    const mat = new THREE.SpriteMaterial({
      map: spriteTex(url), transparent: true, depthWrite: false, toneMapped: false, opacity,
      blending: add ? THREE.AdditiveBlending : THREE.NormalBlending,
    });
    if (color) mat.color = new THREE.Color(color);
    const sp = new THREE.Sprite(mat);
    sp.position.set(...pos);
    sp.scale.set(size * flip, size * aspect, 1);
    mat.rotation = rot;
    parent.add(sp);
    const item = { sp, mat, base: new THREE.Vector3(...pos), size, aspect, flip, rot, kind, drift, alpha: opacity, phase: sprites.length * 1.37 };
    sprites.push(item);
    return item;
  }
  const P = (id, k, b = false) => `/parca/${id}-${k}${b ? 'b' : ''}.webp`;
  const A = { cilek: [0.841, 0.629], ahududu: [0.918, 0.88, 0.929, 0.973, 0.919, 0.897], ananas: [1.116, 1.081, 0.995, 1.011], yaprak: [1.212, 0.557, 0.845, 1.145] };
  const blobTex = canvasTex(128, 64, (x, w, h) => {
    const g = x.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    g.addColorStop(0, 'rgba(25,8,0,.8)'); g.addColorStop(0.6, 'rgba(25,8,0,.3)'); g.addColorStop(1, 'rgba(25,8,0,0)');
    x.setTransform(1, 0, 0, 0.5, 0, h / 4); x.fillStyle = g; x.fillRect(0, 0, w, h * 2);
  });
  const blobs = [];
  function blob(x, z, w) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, w * 0.5), new THREE.MeshBasicMaterial({ map: blobTex, transparent: true, depthWrite: false, opacity: 0.7 }));
    m.rotation.x = -Math.PI / 2 + TILT;
    m.position.set(x, surfY(z) + 0.006, z);
    m.renderOrder = 1;
    stage.add(m);
    blobs.push(m);
  }

  // kütüğün üstündeki yığın: paketlerin dibine yaslanır, alt kenarlarını kapatır
  // [görsel, no, x, z, genişlik, dönüş, ayna, gömülme]
  [
    ['cilek', 0, -0.62, -0.3, 0.3, 0.1, 1, 0.02],
    ['ahududu', 1, 0.6, -0.32, 0.24, 0, 1, 0.02],
    ['yaprak', 1, -1.1, 0.12, 0.5, 0.18, 1, 0.06],
    ['ahududu', 0, -1.0, 0.0, 0.3, 0, 1, 0.03],
    ['cilek', 0, -0.76, 0.28, 0.48, 0.12, 1, 0.04],
    ['cilek', 1, -0.38, 0.42, 0.52, 0, 1, 0.16],
    ['ahududu', 2, -0.12, 0.62, 0.24, 0.3, 1, 0.03],
    ['cilek', 1, 0.08, 0.5, 0.46, -0.1, -1, 0.15],
    ['ahududu', 4, 0.3, 0.66, 0.28, 0, 1, 0.03],
    ['cilek', 0, 0.56, 0.5, 0.42, -0.18, -1, 0.04],
    ['yaprak', 2, 1.18, 0.22, 0.5, -0.5, 1, 0.08],
    ['ananas', 3, 1.08, -0.06, 0.5, 0.15, -1, 0.05],
    ['ananas', 2, 0.86, 0.3, 0.62, -0.08, 1, 0.06],
    ['ahududu', 5, 1.02, 0.58, 0.27, 0, 1, 0.03],
  ].forEach(([id, k, x, z, size, rot, flip, sink]) => {
    const asp = A[id][k];
    const sz = size * 0.68;
    blob(x, z + 0.03, sz * 1.2);
    addSprite(stage, P(id, k), asp, { pos: [x, surfY(z) + (sz * asp) / 2 - sink * 0.6, z], size: sz, rot, flip, kind: 'pile' });
  });
  // paketlerin çevresinde uçuşan meyve kümeleri ve yapraklar
  // [görsel, no, x, y, z, genişlik, dönüş]
  [
    ['cilek', 1, 0.74, 0.66, 0.32, 0.44, 0.35],
    ['cilek', 0, 1.02, 0.36, 0.42, 0.4, -0.4],
    ['ahududu', 0, 1.32, 0.8, 0.02, 0.28, 0.2],
    ['ananas', 1, 1.45, 0.18, 0.22, 0.34, -0.5],
    ['cilek', 0, 0.42, 1.2, -0.3, 0.3, 0.6],
    ['ahududu', 3, 0.98, 1.12, -0.25, 0.2, 0.3],
    ['ahududu', 4, -0.66, 1.02, -0.6, 0.22, 0],
    ['ananas', 0, -0.98, 1.18, -0.45, 0.26, 0.5],
    ['yaprak', 0, -0.22, 1.36, -0.7, 0.26, 0.8],
    ['yaprak', 3, 1.78, 0.92, -0.5, 0.3, -0.9],
    ['ahududu', 2, -0.95, 1.22, -0.9, 0.16, 0],
  ].forEach(([id, k, x, y, z, size, rot]) => {
    addSprite(stage, P(id, k), A[id][k], { pos: [x, y, z], size, rot, kind: 'float', drift: 1 });
  });

  /* kameraya sabit ön plan: bulanık iri parçalar, bokeh, kırıntılar */
  const fx = new THREE.Group();
  scene.add(fx);
  const FZ = 2.2; // ön plan derinliği
  const fg = [
    { id: 'cilek', k: 0, at: [-0.12, -1.02], size: 0.62, rot: 0.3, mobile: false },
    { id: 'yaprak', k: 2, at: [-1.02, 0.4], size: 0.5, rot: -0.6, mobile: true },
    { id: 'yaprak', k: 3, at: [-0.96, -0.82], size: 0.42, rot: 0.5, mobile: false },
    { id: 'yaprak', k: 0, at: [1.0, -0.8], size: 0.4, rot: -0.3, mobile: true },
    { id: 'yaprak', k: 1, at: [0.92, 0.98], size: 0.36, rot: 0.9, mobile: true },
    { id: 'ahududu', k: 0, at: [-0.98, 1.0], size: 0.3, rot: 0, mobile: false },
  ].map((f) => ({ ...f, item: addSprite(fx, P(f.id, f.k, true), A[f.id][f.k], { pos: [0, 0, FZ], size: f.size, rot: f.rot, kind: 'fg' }) }));

  const dot = canvasTex(64, 64, (x, w) => {
    const g = x.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
    g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.55, 'rgba(255,255,255,.5)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = g; x.fillRect(0, 0, w, w);
  });
  const ring = canvasTex(128, 128, (x, w) => {
    const g = x.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
    g.addColorStop(0, 'rgba(255,255,255,.55)'); g.addColorStop(0.82, 'rgba(255,255,255,.75)'); g.addColorStop(0.9, 'rgba(255,255,255,.9)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = g; x.fillRect(0, 0, w, w);
  });
  const r = rng(42);
  const bokeh = [];
  for (let i = 0; i < 20; i++) {
    const mat = new THREE.SpriteMaterial({ map: ring, color: new THREE.Color(r() > 0.4 ? '#ffd2a8' : '#ff8a7a'), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 });
    const sp = new THREE.Sprite(mat);
    const s = 0.15 + r() * 0.5;
    sp.scale.set(s, s, 1);
    fx.add(sp);
    bokeh.push({ sp, mat, u: r(), v: r() * 0.9 + 0.05, z: -2.5 - r() * 2, a: 0.05 + r() * 0.12, phase: r() * 6.28, sp2: 0.02 + r() * 0.04 });
  }
  const crumbs = [];
  for (let i = 0; i < 46; i++) {
    const mat = new THREE.SpriteMaterial({ map: dot, color: new THREE.Color(r() > 0.3 ? '#7a0f1c' : '#f2c14e'), transparent: true, depthWrite: false, opacity: 0 });
    const sp = new THREE.Sprite(mat);
    const s = 0.012 + r() * 0.03;
    sp.scale.set(s, s * (0.7 + r() * 0.6), 1);
    stage.add(sp);
    crumbs.push({ sp, mat, base: new THREE.Vector3(-1.6 + r() * 3.6, -0.4 + r() * 2.2, -0.6 + r() * 1.4), phase: r() * 6.28, sp2: 0.1 + r() * 0.3 });
  }

  let vNow = 1;
  function update(dt, t, v, pointer, color, reduce) {
    vNow = v;
    const out = 1 - v;
    const ease = v * v * (3 - 2 * v);
    // arka plan
    const dist = camera.position.z - bg.position.z;
    const hh = Math.tan((camera.fov * Math.PI) / 360) * dist;
    bg.scale.set(hh * camera.aspect * 1.04, hh * 1.04, 1);
    bgMat.uniforms.uTime.value = reduce ? 0 : t;
    bgMat.uniforms.uOpacity.value = ease;
    bgMat.uniforms.uAspect.value = camera.aspect;
    bgMat.uniforms.uMobile.value = camera.aspect < 0.9 ? 1 : 0;
    bgMat.uniforms.uColor.value.set(color);
    bg.visible = v > 0.005;

    // kütük aşağı iner, yığın onunla gider
    stage.visible = v > 0.005;
    stage.position.y = -out * 2.4;
    stage.position.z = -out * 0.6;
    const wob = reduce ? 0 : 1;
    for (const b of blobs) b.material.opacity = 0.7 * ease;
    for (const s of sprites) {
      if (s.kind === 'pile') {
        s.mat.opacity = Math.min(1, ease * 1.4);
      } else if (s.kind === 'float') {
        const dir = Math.sign(s.base.x) || 1;
        s.sp.position.set(
          s.base.x + dir * out * 1.8 + pointer.sx * 0.05,
          s.base.y + Math.sin(t * 0.9 + s.phase) * 0.05 * wob + out * 1.2,
          s.base.z + out * 1.5
        );
        s.mat.rotation = s.rot + Math.sin(t * 0.5 + s.phase) * 0.15 * wob + out * 1.4 * dir;
        s.mat.opacity = Math.min(1, ease * 1.3);
      }
    }
    // ön plan
    const fh = Math.tan((camera.fov * Math.PI) / 360) * (camera.position.z - FZ);
    const fw = fh * camera.aspect;
    const mobile = camera.aspect < 0.9;
    fx.visible = v > 0.005;
    for (const f of fg) {
      const it = f.item;
      const show = !mobile || f.mobile;
      it.sp.visible = show;
      if (!show) continue;
      const sx = f.at[0] * fw, sy = f.at[1] * fh * (mobile ? 0.9 : 1);
      it.sp.position.set(
        sx * (1 + out * 0.8) + pointer.sx * 0.12 + Math.sin(t * 0.4 + it.phase) * 0.02 * wob,
        sy * (1 + out * 0.6) + Math.cos(t * 0.5 + it.phase) * 0.02 * wob,
        FZ
      );
      it.mat.rotation = it.rot + Math.sin(t * 0.3 + it.phase) * 0.08 * wob;
      it.mat.opacity = ease;
    }
    const bh = (z) => Math.tan((camera.fov * Math.PI) / 360) * (camera.position.z - z);
    for (const b of bokeh) {
      const h = bh(b.z);
      b.sp.position.set((b.u * 2 - 1) * h * camera.aspect + Math.sin(t * b.sp2 + b.phase) * 0.3, (b.v * 2 - 1) * h + Math.cos(t * b.sp2 + b.phase) * 0.2, b.z);
      b.mat.opacity = b.a * ease * (0.7 + 0.3 * Math.sin(t * 0.8 + b.phase));
    }
    for (const c of crumbs) {
      c.sp.position.set(
        c.base.x + Math.sin(t * c.sp2 + c.phase) * 0.12 * wob + out * Math.sign(c.base.x) * 1.5,
        c.base.y + Math.cos(t * c.sp2 * 0.8 + c.phase) * 0.1 * wob + out,
        c.base.z + out
      );
      c.mat.opacity = 0.85 * ease;
    }
  }
  return { update, get v() { return vNow; } };
}
