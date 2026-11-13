import * as THREE from 'three';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, Lightformer, ContactShadows, MeshReflectorMaterial } from '@react-three/drei';
import { EffectComposer, N8AO, Bloom, Vignette, SMAA, ToneMapping } from '@react-three/postprocessing';
import { ToneMappingMode } from 'postprocessing';
import gsap from 'gsap';
import { makePouch, makeBackTexture } from '../scene.js';
import { marblePlinth } from './stone.js';
import { loadRelief, loadFlat } from './relief.js';
import { HERO_LINEUP, SHOWCASE } from '../data.js';

/*
  Tek sahne, tek kaide: açılış ve ürün vitrini aynı 3B sahnede.
  S.s: 0 = açılış, 1 = Çilek, 2 = Şeftali, 3 = Ananas (kaydırmaya bağlı).
  Kaide ve kamera yerinde durur; paketler kaidenin üstünde bir döner tabla gibi yer değiştirir.
*/
export const S = { s: 0, sNow: 0, mx: 0, my: 0, intro: 1, fruitIn: 0, hitEl: null, front: 0 };

const PT = -1.05; // kaidenin üst yüzeyi
const PC = [1.85, -0.25]; // kaide merkezi (x, z)
const clamp01 = (x) => Math.min(1, Math.max(0, x));
const smooth = (a, b, x) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const easeIO = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const P = (id, k, b = false) => `/parca/${id}-${k}${b ? 'b' : ''}.webp`;

/* ---------------- ürüne göre renk atmosferi ---------------- */
const PAL = [
  { dark: [0.16, 0.01, 0.02], mid: [0.42, 0.02, 0.04], bright: [0.86, 0.07, 0.07], hot: [1.0, 0.4, 0.16], rim: '#ff7a45', accent: '#ff3a22', fog: '#3a0509', e1: [1.0, 0.45, 0.12], e2: [1.0, 0.82, 0.45], glow: '#ffffff' },
  { dark: [0.19, 0.055, 0.012], mid: [0.5, 0.15, 0.03], bright: [0.96, 0.44, 0.1], hot: [1.0, 0.76, 0.38], rim: '#ffa860', accent: '#ff7a1a', fog: '#3d1404', e1: [1.0, 0.6, 0.2], e2: [1.0, 0.9, 0.6], glow: '#ffe2c0' },
  { dark: [0.14, 0.075, 0.01], mid: [0.44, 0.26, 0.025], bright: [0.94, 0.62, 0.08], hot: [1.0, 0.9, 0.5], rim: '#ffe08a', accent: '#e0b81c', fog: '#2c2203', e1: [1.0, 0.85, 0.3], e2: [1.0, 1.0, 0.75], glow: '#fff2b0' },
];
const M = {
  dark: new THREE.Vector3(), mid: new THREE.Vector3(), bright: new THREE.Vector3(), hot: new THREE.Vector3(),
  e1: new THREE.Vector3(), e2: new THREE.Vector3(),
  rim: new THREE.Color(), accent: new THREE.Color(), fog: new THREE.Color(), glow: new THREE.Color(),
};
const _a = new THREE.Color(), _b = new THREE.Color(), _v = new THREE.Vector3();
function updateMood(s) {
  let i = 0, t = 0;
  if (s > 2) { i = 1; t = smooth(2.3, 2.7, s); } else if (s > 1) { i = 0; t = smooth(1.3, 1.7, s); }
  const A = PAL[i], B = PAL[Math.min(2, i + 1)];
  for (const k of ['dark', 'mid', 'bright', 'hot', 'e1', 'e2']) M[k].set(...A[k]).lerp(_v.set(...B[k]), t);
  for (const k of ['rim', 'accent', 'fog', 'glow']) M[k].copy(_a.set(A[k]).lerp(_b.set(B[k]), t));
}

/* ---------------- arka plan: koyu kenarlar, ürün renginde parlayan merkez ---------------- */
function Backdrop({ mobile }) {
  const mat = useMemo(() => new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 }, uAspect: { value: 1.6 }, uMobile: { value: mobile ? 1 : 0 },
      uDark: { value: M.dark }, uMid: { value: M.mid }, uBright: { value: M.bright }, uHot: { value: M.hot },
    },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.9999, 1.0); }',
    fragmentShader: /* glsl */ `
      uniform float uTime, uAspect, uMobile;
      uniform vec3 uDark, uMid, uBright, uHot;
      varying vec2 vUv;
      float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float noise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
        return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y); }
      float fbm(vec2 p){ float s = 0.0, a = 0.5; for (int i = 0; i < 5; i++) { s += noise(p) * a; p *= 2.02; a *= 0.5; } return s; }
      void main(){
        vec2 uv = vUv;
        vec2 q = vec2(uv.x * uAspect, uv.y);
        vec2 c = mix(vec2(0.68, 0.56), vec2(0.5, 0.74), uMobile);
        float d = length((uv - c) * vec2(uAspect * 0.6, 1.0));
        float glow = smoothstep(1.1 + 0.07 * sin(uTime * 0.35), 0.0, d);
        float pulse = 0.5 + 0.5 * sin(uTime * 0.22);
        vec3 col = mix(uDark, uMid, smoothstep(0.0, 0.5, glow));
        col = mix(col, uBright, smoothstep(0.42 - 0.08 * pulse, 0.95, glow));
        // yavaş akan duman
        float sm = fbm(q * 1.5 + vec2(uTime * 0.025, -uTime * 0.018));
        float sm2 = fbm(q * 3.4 - vec2(uTime * 0.04, uTime * 0.012));
        col *= 0.76 + 0.44 * sm;
        col += uHot * pow(glow, 3.0) * 0.32 * (0.55 + 0.45 * sm2);
        // sağ üstten süzülen ışık huzmeleri
        vec2 lp = uv - vec2(0.96, 1.12); lp.x *= uAspect;
        float ang = atan(lp.y, lp.x);
        float rays = 0.5 + 0.5 * sin(ang * 17.0 + uTime * 0.1 + sm * 3.0);
        float rays2 = 0.5 + 0.5 * sin(ang * 7.0 - uTime * 0.07);
        float rf = smoothstep(1.9, 0.0, length(lp));
        col += mix(uHot, vec3(1.0), 0.3) * rays * rays2 * rf * 0.13;
        // anamorfik yatay ışık çizgisi (sinema lensi)
        float streak = exp(-abs(uv.y - c.y - 0.04) * 38.0) * smoothstep(0.75, 0.0, abs(uv.x - c.x) * (1.0 - uMobile * 0.4));
        col += uHot * streak * 0.1;
        // kenarlarda koyu sinematik vinyet
        float v = smoothstep(1.3, 0.3, length((uv - vec2(0.58, 0.52)) * vec2(1.0, 1.2)));
        col *= mix(0.36, 1.0, v);
        // ince film greni
        col += (hash(uv * 900.0 + fract(uTime) * 61.0) - 0.5) * 0.025;
        gl_FragColor = vec4(pow(max(col, 0.0), vec3(2.2)), 1.0);
        #include <colorspace_fragment>
      }`,
    depthWrite: false, depthTest: false, toneMapped: false,
  }), [mobile]);
  useFrame((st) => {
    mat.uniforms.uTime.value = st.clock.elapsedTime;
    mat.uniforms.uAspect.value = st.size.width / st.size.height;
  });
  return <mesh frustumCulled={false} renderOrder={-100} material={mat}><planeGeometry args={[2, 2]} /></mesh>;
}

/* ---------------- ışık ve yansıma ---------------- */
function Lights({ mobile }) {
  const rim = useRef(), acc = useRef();
  useFrame(() => {
    if (rim.current) rim.current.color.copy(M.rim);
    if (acc.current) acc.current.color.copy(M.accent);
  });
  return (
    <>
      <ambientLight intensity={0.3} color="#ffd8c4" />
      {/* ana ışık: sol üst önden; paketin dolgun gövdesinde ışıktan gölgeye geçiş */}
      <directionalLight
        position={[-2.5, 6.5, 6]} intensity={2.6} color="#fff3e6"
        castShadow={!mobile}
        shadow-mapSize={[2048, 2048]} shadow-bias={-0.0004} shadow-normalBias={0.03}
        shadow-camera-left={-5} shadow-camera-right={5} shadow-camera-top={5} shadow-camera-bottom={-5} shadow-camera-far={30}
      />
      <directionalLight position={[6, 3, 4]} intensity={0.9} color="#ffe6d6" />
      {/* arkadan kontur ışığı: paketlerin silüetini kesip ayırır */}
      <spotLight ref={rim} position={[4.5, 3.5, -4.5]} angle={0.9} penumbra={1} intensity={120} distance={20} decay={2} />
      <spotLight position={[-2.5, 4, -4]} angle={0.8} penumbra={1} intensity={55} distance={20} decay={2} color="#ffb070" />
      <pointLight ref={acc} position={[1.7, -0.3, 2.6]} intensity={4} distance={6} decay={2} />
      <Environment resolution={mobile ? 64 : 256} frames={1}>
        <Lightformer form="rect" intensity={2.6} position={[0, 5, 2]} rotation-x={Math.PI / 2} scale={[10, 4, 1]} color="#fff3e6" />
        <Lightformer form="rect" intensity={4.2} position={[5, 1.5, 3]} rotation-y={-Math.PI / 2.5} scale={[2, 6, 1]} color="#ffffff" />
        <Lightformer form="rect" intensity={3} position={[-5, 1.5, 3]} rotation-y={Math.PI / 2.5} scale={[1.5, 6, 1]} color="#fff0e0" />
        <Lightformer form="ring" intensity={1.4} position={[0, 0, -6]} scale={6} color="#ff2a1a" />
      </Environment>
    </>
  );
}

/* ---------------- kaide: koyu mermer, pirinç kakma halka ---------------- */
function Platform({ mobile }) {
  const pl = useMemo(() => marblePlinth({ R: 2.25, size: mobile ? 512 : 768 }), [mobile]);
  const topMap = useMemo(() => { const t = pl.map; t.repeat.set(1.3, 1.3); return t; }, [pl]);
  return (
    <group position={[PC[0], PT - pl.top, PC[1]]}>
      <mesh geometry={pl.geo} material={pl.mat} receiveShadow castShadow={!mobile} />
      <mesh rotation-x={-Math.PI / 2} position={[0, pl.top + 0.002, 0]} receiveShadow>
        <circleGeometry args={[2.24, 96]} />
        {mobile ? (
          <meshPhysicalMaterial map={topMap} roughness={0.22} clearcoat={0.9} clearcoatRoughness={0.06} envMapIntensity={0.9} />
        ) : (
          <MeshReflectorMaterial map={topMap} blur={[420, 140]} resolution={1024} mixBlur={1} mixStrength={2.4}
            roughness={0.3} depthScale={1.1} minDepthThreshold={0.35} maxDepthThreshold={1.4} metalness={0.25} mirror={0.55} color="#ffffff" />
        )}
      </mesh>
      {/* üst kenara yakın ince pirinç kakma */}
      <mesh rotation-x={-Math.PI / 2} position={[0, pl.top + 0.004, 0]}>
        <ringGeometry args={[2.02, 2.06, 128]} />
        <meshStandardMaterial color="#d8aa62" metalness={1} roughness={0.28} envMapIntensity={1.4} />
      </mesh>
    </group>
  );
}

/* ---------------- paketler: döner tabla düzeni ---------------- */
const RING = { cx: PC[0], cz: PC[1] - 0.04, rx: 1.3, rz: 0.78 };
const TAU3 = (Math.PI * 2) / 3;
function ringPose(theta) {
  const depth = (Math.cos(theta) + 1) / 2; // 1 önde, 0 arkada
  return {
    x: RING.cx - Math.sin(theta) * RING.rx,
    z: RING.cz + Math.cos(theta) * RING.rz,
    ry: -0.06 + Math.sin(theta) * 0.42,
    s: 1.86 * (0.86 + 0.14 * depth),
  };
}
// kaydırma → döner tablanın konumu (0: Çilek önde, 1: Şeftali, 2: Ananas); duraklarda tutulur, arada yumuşak döner
function ringF(s) {
  if (s <= 1) return 0;
  const f = Math.min(2, s - 1);
  const i = Math.min(1, Math.floor(f));
  return i + easeIO(smooth(0.1, 0.9, f - i));
}
const HERO_POSE = { seftali: { x: 0.52, z: -0.62, ry: 0.46 } };
const HINDISTAN = { x: 1.15, z: -0.3, ry: 0.3, s: 1.68 };

// zemine temas gölgesi
let blobT = null;
function blobTex() {
  if (blobT) return blobT;
  const c = document.createElement('canvas'); c.width = 256; c.height = 128;
  const x = c.getContext('2d');
  const g = x.createRadialGradient(128, 64, 0, 128, 64, 128);
  g.addColorStop(0, 'rgba(10,2,2,.92)'); g.addColorStop(0.45, 'rgba(10,2,2,.45)'); g.addColorStop(1, 'rgba(10,2,2,0)');
  x.setTransform(1, 0, 0, 0.5, 0, 32); x.fillStyle = g; x.fillRect(0, 0, 256, 256);
  blobT = new THREE.CanvasTexture(c);
  return blobT;
}

function Pouches({ flavors, mobile, onReady }) {
  const root = useMemo(() => new THREE.Group(), []);
  const list = useRef([]);
  const { camera, size } = useThree();
  const box = useMemo(() => new THREE.Box3(), []);
  const v = useMemo(() => new THREE.Vector3(), []);
  const last = useRef('');
  useEffect(() => {
    let dead = false;
    const loader = new THREE.TextureLoader();
    const logo = new Promise((res) => { const im = new Image(); im.onload = () => res(im); im.onerror = () => res(null); im.src = '/logo.svg'; });
    const holders = HERO_LINEUP.map((id) => {
      const fl = flavors.find((f) => f.id === id);
      const pk = makePouch();
      for (const m of [pk.frontMat, pk.backMat]) {
        // daha az kendinden ışık, daha çok gerçek gölgelendirme: fotoğraf gibi değil, hacimli dursun
        m.emissiveIntensity = mobile ? 0.2 : 0.13;
        m.envMapIntensity = 1.15;
        m.normalScale.set(0.8, 0.8);
      }
      const a = (fl.aspect || 1.153) / 1.153;
      pk.group.scale.set(1 / Math.sqrt(a), a / Math.sqrt(a), 1);
      pk.bottomMat.color.set(fl.bg).multiplyScalar(0.7);
      pk.group.updateMatrixWorld(true);
      const minY = new THREE.Box3().setFromObject(pk.group).min.y;
      const holder = new THREE.Group();
      holder.add(pk.group);
      holder.visible = false;
      root.add(holder);
      const blob = new THREE.Mesh(new THREE.PlaneGeometry(1.08, 0.52), new THREE.MeshBasicMaterial({ map: blobTex(), transparent: true, depthWrite: false, opacity: mobile ? 0.95 : 0.8 }));
      blob.rotation.x = -Math.PI / 2;
      blob.renderOrder = 2;
      blob.visible = false;
      root.add(blob);
      return { id, fl, pk, holder, blob, minY, ring: SHOWCASE.indexOf(id), drop: 0, tilt: 0 };
    });
    list.current = holders;
    Promise.all(holders.map((h) => new Promise((res) => loader.load(h.fl.tex, (t) => { t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; res(t); }, undefined, () => res(null)))))
      .then(async (texes) => {
        const im = await logo;
        try { await document.fonts?.ready; } catch (e) { /* yedek yazı tipi */ }
        if (dead) return;
        holders.forEach((h, i) => {
          if (!texes[i]) return;
          h.pk.setFront(texes[i]);
          h.pk.setBack(makeBackTexture(texes[i].image, h.fl, im));
          h.holder.visible = true;
          h.blob.visible = true;
        });
        onReady(holders);
      });
    return () => { dead = true; };
  }, []);
  useFrame(() => {
    const s = S.sNow;
    const F = ringF(s);
    const intro = clamp01(s); // açılıştan Çilek'e geçiş
    let best = -2, front = null;
    for (const h of list.current) {
      let x, z, ry, sc, y = 0, rz = h.tilt, k = 1;
      if (h.ring >= 0) {
        const p = ringPose((h.ring - F) * TAU3);
        x = p.x; z = p.z; ry = p.ry; sc = p.s;
        // açılışta bazı paketlerin yeri biraz farklı; vitrine geçerken tabladaki yerlerine kayarlar
        const hp = HERO_POSE[h.id];
        if (hp && s < 1) {
          const e = easeIO(smooth(0.0, 0.85, s));
          x = hp.x + (x - hp.x) * e; z = hp.z + (z - hp.z) * e; ry = hp.ry + (ry - hp.ry) * e;
        }
        // açılıştan vitrine geçerken öndeki paket ağırbaşlı bir dönüşle kendini gösterir
        if (h.ring === 0 && s < 1) ry += Math.sin(Math.PI * easeIO(intro)) * 0.55;
        const c = Math.cos((h.ring - F) * TAU3);
        if (c > best) { best = c; front = h; }
      } else {
        // hindistan cevizi yalnızca açılışta: vitrine geçerken arkaya süzülüp sahneden çıkar
        const e = easeIO(smooth(0.0, 0.75, s));
        x = HINDISTAN.x - 1.4 * e; z = HINDISTAN.z - 3.2 * e; y = 2.2 * e * e;
        ry = HINDISTAN.ry + 1.1 * e; rz += 0.35 * e; sc = HINDISTAN.s; k = 1 - e;
      }
      h.holder.visible = k > 0.01 && !!h.pk.frontMat.map;
      h.holder.scale.setScalar(sc * k);
      h.holder.position.set(x, PT - h.minY * sc * k - 0.012 + y + h.drop, z);
      h.holder.rotation.set(0, ry, rz);
      // temas gölgesi pakete göre
      const lift = y + h.drop;
      h.blob.visible = h.holder.visible;
      h.blob.position.set(x, PT + 0.006, z + 0.03);
      h.blob.rotation.z = -ry;
      h.blob.scale.set(sc * k * (1 + lift * 0.4), sc * k * (1 + lift * 0.4), 1);
      h.blob.material.opacity = (mobile ? 0.95 : 0.8) * clamp01(1 - lift * 1.6);
    }
    // öndeki paketin ekrandaki alanı → tıklayınca 3B inceleme
    if (front) {
      S.front = front.ring;
      const el = S.hitEl;
      if (el && front.holder.visible) {
        box.setFromObject(front.holder);
        let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
        for (const [bx, by, bz] of [[box.min.x, box.min.y, box.max.z], [box.max.x, box.max.y, box.max.z], [box.min.x, box.max.y, box.max.z], [box.max.x, box.min.y, box.max.z]]) {
          v.set(bx, by, bz).project(camera);
          const px = (v.x + 1) / 2 * size.width, py = (1 - v.y) / 2 * size.height;
          x0 = Math.min(x0, px); x1 = Math.max(x1, px); y0 = Math.min(y0, py); y1 = Math.max(y1, py);
        }
        const key = `${x0 | 0},${y0 | 0},${x1 | 0},${y1 | 0}`;
        if (key !== last.current) {
          last.current = key;
          el.style.left = `${x0}px`; el.style.top = `${y0}px`;
          el.style.width = `${x1 - x0}px`; el.style.height = `${y1 - y0}px`;
        }
      }
    }
  });
  return <primitive object={root} />;
}

/* ---------------- meyveler: açılış karışımı ve her ürünün kendi meyveleri ---------------- */
// Ortak yerleşim: kaidenin üstünde sol ve sağ kümeler (öndeki paketin önü açık), paketlerin çevresinde bir yay
const REST = [
  { x: 0.45, z: 1.08, w: 0.68 },
  { x: 0.12, z: 0.62, w: 0.54, flip: true, ry: 0.35 },
  { x: 0.72, z: 1.42, w: 0.42, sink: 0.12 },
  { x: 3.3, z: 0.86, w: 0.72, ry: -0.35 },
  { x: 3.02, z: 1.34, w: 0.42 },
  { x: 3.62, z: 1.1, w: 0.58, rx: -1.25, rz: -0.6, leaf: true },
  { x: 0.02, z: 1.12, w: 0.7, rx: -1.2, rz: 0.5, leaf: true },
];
const FLOAT = [
  { x: 0.95, y: 1.5, z: -0.3, w: 0.58, spin: 0.3 },
  { x: 0.5, y: 0.95, z: 0.4, w: 0.48, spin: -0.45 },
  { x: 3.3, y: 1.38, z: -0.3, w: 0.58, spin: 0.22 },
  { x: 3.62, y: 0.5, z: 0.78, w: 0.46, spin: 0.5 },
  { x: 3.85, y: 1.66, z: -1.0, w: 0.38, spin: -0.3, desk: true },
  { x: 2.35, y: 1.8, z: -1.15, w: 0.42, spin: 0.2, leaf: true },
  { x: 1.55, y: 1.95, z: -1.6, w: 0.32, spin: 0.6, desk: true },
];
const FAR = [
  { x: 3.4, y: 1.7, z: -3.8, w: 0.5, spin: 0.2 },
  { x: 0.9, y: 1.75, z: -4.0, w: 0.5, spin: -0.15 },
  { x: 4.5, y: 0.6, z: -3.6, w: 0.5, spin: -0.2 },
];
// her kümenin parçaları (REST, FLOAT, FAR sırasıyla)
const SETS = [
  { // açılış: dört ürünün meyveleri bir arada
    rest: [P('cilek', 0), P('seftali', 2), P('cilek', 1), P('ananas', 2), P('hindistan-cevizi', 4), P('yaprak', 2), P('yaprak', 1)],
    float: [P('cilek', 0), P('seftali', 3), P('ananas', 1), P('cilek', 0), P('hindistan-cevizi', 1), P('yaprak', 0), P('ananas', 0)],
    far: [P('cilek', 0), P('seftali', 1), P('ananas', 3)],
  },
  { // Çilek
    rest: [P('cilek', 0), P('cilek', 0), P('cilek', 1), P('cilek', 0), P('cilek', 1), P('yaprak', 2), P('yaprak', 1)],
    float: [P('cilek', 0), P('cilek', 1), P('cilek', 0), P('cilek', 0), P('cilek', 1), P('yaprak', 0), P('cilek', 0)],
    far: [P('cilek', 0), P('cilek', 1), P('cilek', 0)],
  },
  { // Şeftali
    rest: [P('seftali', 0), P('seftali', 2), P('seftali', 4), P('seftali', 1), P('seftali', 3), P('yaprak', 3), P('yaprak', 1)],
    float: [P('seftali', 3), P('seftali', 1), P('seftali', 2), P('seftali', 0), P('seftali', 4), P('yaprak', 0), P('seftali', 1)],
    far: [P('seftali', 2), P('seftali', 1), P('seftali', 3)],
  },
  { // Ananas
    rest: [P('ananas', 2), P('ananas', 0), P('ananas', 1), P('ananas', 3), P('ananas', 0), P('yaprak', 2), P('yaprak', 1)],
    float: [P('ananas', 1), P('ananas', 0), P('ananas', 2), P('ananas', 0), P('ananas', 1), P('yaprak', 0), P('ananas', 3)],
    far: [P('ananas', 0), P('ananas', 2), P('ananas', 1)],
  },
];
const MATTE = ['cilek-1', 'seftali-1', 'seftali-2', 'seftali-3', 'seftali-4', 'hindistan-cevizi'];
const SLICE = ['seftali-1', 'seftali-2', 'seftali-3', 'seftali-4', 'yaprak'];
const BURST = new THREE.Vector3(PC[0], 0.3, PC[1]);

function setWeight(set, s) {
  if (set === 0) return 1 - smooth(0.1, 0.5, s);
  return 1 - smooth(0.3, 0.62, Math.abs(s - set));
}

function Fruits({ mobile }) {
  const root = useMemo(() => new THREE.Group(), []);
  const items = useRef([]);
  useEffect(() => {
    let dead = false;
    const specs = [];
    SETS.forEach((set, si) => {
      REST.forEach((slot, k) => specs.push({ si, u: set.rest[k], ...slot, rest: true }));
      FLOAT.forEach((slot, k) => { if (!(mobile && slot.desk)) specs.push({ si, u: set.float[k], ...slot }); });
      if (!mobile) FAR.forEach((slot, k) => specs.push({ si, u: set.far[k], ...slot, far: true }));
    });
    Promise.all(specs.map((f) => loadRelief(f.u, {
      seg: mobile ? 28 : 44,
      depth: f.u.includes('yaprak') ? 0.08 : SLICE.some((d) => f.u.includes(d)) ? 0.18 : 0.3,
      glossy: !MATTE.some((d) => f.u.includes(d)),
    }))).then((res) => {
      if (dead) return;
      res.forEach((r, i) => {
        if (!r) return;
        const f = specs[i];
        const m = new THREE.Mesh(r.geo, r.mat);
        m.customDepthMaterial = r.depthMat;
        m.castShadow = !mobile && !f.far;
        const h = f.w * r.aspect;
        const y = f.rest ? PT + h / 2 - (f.sink || 0) * h - (f.rx ? h * 0.42 : 0) : f.y;
        m.position.set(f.x, y, f.z);
        m.rotation.set(f.rx || 0, f.ry || 0, f.rz || 0);
        if (f.far) { m.material = r.mat.clone(); m.material.color.setRGB(0.55, 0.42, 0.4); m.material.emissiveIntensity = 0.12; }
        m.visible = false;
        root.add(m);
        items.current.push({ m, f, base: m.position.clone(), rot: m.rotation.clone(), phase: i * 1.73, delay: ((i * 7) % 9) / 9 * 0.35 });
      });
    });
    return () => { dead = true; };
  }, [mobile]);
  const tmp = useMemo(() => new THREE.Vector3(), []);
  useFrame((st) => {
    const t = st.clock.elapsedTime;
    const s = S.sNow;
    const W = SETS.map((_, si) => setWeight(si, s) * (si === 0 ? clamp01(S.fruitIn * 1.6) : 1));
    for (const it of items.current) {
      const w = W[it.f.si];
      const k = clamp01((w - it.delay) / 0.65);
      if (k <= 0.001) { it.m.visible = false; continue; }
      it.m.visible = true;
      const e = 1 - Math.pow(1 - k, 3);
      const sx = it.f.flip ? -it.f.w : it.f.w;
      it.m.scale.set(sx * e, it.f.w * e, it.f.w * e);
      if (it.f.rest) {
        // kaidenin üstündekiler hafifçe yukarıdan yerine konur
        it.m.position.set(it.base.x, it.base.y + (1 - e) * 0.9, it.base.z);
        it.m.rotation.set(it.rot.x, it.rot.y + (1 - e) * 1.2, it.rot.z);
        continue;
      }
      // süzülenler sahnenin merkezinden açılarak yerlerine yayılır, sonra hafifçe salınır
      tmp.copy(it.base).sub(BURST).multiplyScalar(0.3 + 0.7 * e).add(BURST);
      const sp = it.f.spin || 0.3;
      it.m.position.set(
        tmp.x + Math.cos(t * 0.45 + it.phase) * 0.04,
        tmp.y + Math.sin(t * 0.7 + it.phase) * 0.08,
        tmp.z
      );
      it.m.rotation.y = Math.sin(t * sp + it.phase) * 0.75 + (1 - e) * 2.4;
      it.m.rotation.z = it.rot.z + t * sp * 0.35;
      it.m.rotation.x = Math.sin(t * sp * 0.6 + it.phase) * 0.25;
    }
  });
  return <primitive object={root} />;
}

// kameraya yakın, bulanık ön plan (kameraya göre konum); çilekler yalnızca açılışta
const NEAR = [
  { u: P('cilek', 0, true), at: [-0.92, -0.86], z: 4.3, w: 0.95, rot: 0.4, mobile: false, hero: true },
  { u: P('yaprak', 2, true), at: [-1.02, 0.42], z: 4.1, w: 0.85, rot: -0.7, mobile: true },
  { u: P('yaprak', 0, true), at: [0.98, -0.82], z: 4.0, w: 0.7, rot: 0.3, mobile: true },
  { u: P('cilek', 0, true), at: [0.62, -1.02], z: 4.4, w: 0.6, rot: -0.5, mobile: false, hero: true },
];
function NearLayer({ mobile }) {
  const { camera, size } = useThree();
  const group = useMemo(() => new THREE.Group(), []);
  const items = useRef([]);
  useEffect(() => {
    let dead = false;
    const list = NEAR.filter((n) => !mobile || n.mobile);
    Promise.all(list.map((n) => loadFlat(n.u))).then((res) => {
      if (dead) return;
      res.forEach((r, i) => {
        if (!r) return;
        const m = new THREE.Mesh(r.geo, r.mat.clone());
        m.renderOrder = 10;
        group.add(m);
        items.current.push({ m, n: list[i], phase: i * 2.1 });
      });
    });
    return () => { dead = true; };
  }, [mobile]);
  useFrame((st) => {
    const t = st.clock.elapsedTime;
    for (const it of items.current) {
      const dist = 8.4 - it.n.z;
      const hh = Math.tan((camera.fov * Math.PI) / 360) * dist;
      const hw = hh * (size.width / size.height);
      it.m.position.set(
        camera.position.x + it.n.at[0] * hw - S.mx * 0.25,
        camera.position.y - 0.3 + it.n.at[1] * hh + S.my * 0.15 + Math.sin(t * 0.5 + it.phase) * 0.03,
        camera.position.z - dist
      );
      it.m.rotation.set(0, 0, it.n.rot + Math.sin(t * 0.3 + it.phase) * 0.06);
      const e = clamp01(S.fruitIn * 1.3);
      it.m.scale.setScalar(it.n.w * (0.6 + 0.4 * e));
      // telefonda vitrin yazılarının üstüne gelmesin: yalnızca açılışta
      it.m.material.opacity = e * (it.n.hero || mobile ? 1 - smooth(0.1, 0.5, S.sNow) : 1 - 0.4 * smooth(0.1, 0.5, S.sNow));
      it.m.visible = it.m.material.opacity > 0.01;
    }
  });
  return <primitive object={group} />;
}

/* ---------------- ışık patlaması, tepeden hacimli ışık konisi, huzmeler ---------------- */
function LightBurst({ mobile }) {
  const { glow, shaft } = useMemo(() => {
    const mk = (w, h, draw) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; };
    return {
      glow: mk(256, 256, (x, w) => {
        const g = x.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
        g.addColorStop(0, 'rgba(255,236,200,1)'); g.addColorStop(0.18, 'rgba(255,170,90,.75)'); g.addColorStop(0.45, 'rgba(240,60,30,.28)'); g.addColorStop(1, 'rgba(200,20,10,0)');
        x.fillStyle = g; x.fillRect(0, 0, w, w);
      }),
      shaft: mk(64, 512, (x, w, h) => {
        const g = x.createLinearGradient(0, 0, 0, h);
        g.addColorStop(0, 'rgba(255,200,150,0)'); g.addColorStop(0.35, 'rgba(255,190,140,.55)'); g.addColorStop(1, 'rgba(255,120,80,0)');
        x.fillStyle = g; x.fillRect(0, 0, w, h);
        const s = x.createLinearGradient(0, 0, w, 0);
        s.addColorStop(0, 'rgba(0,0,0,1)'); s.addColorStop(0.5, 'rgba(0,0,0,0)'); s.addColorStop(1, 'rgba(0,0,0,1)');
        x.globalCompositeOperation = 'destination-out'; x.fillStyle = s; x.fillRect(0, 0, w, h);
      }),
    };
  }, []);
  const beamMat = useMemo(() => new THREE.ShaderMaterial({
    uniforms: { uColor: { value: new THREE.Color() }, uOpacity: { value: 0 }, uTime: { value: 0 } },
    vertexShader: /* glsl */ `
      varying vec2 vUv; varying vec3 vN; varying vec3 vV;
      void main(){
        vUv = uv;
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vN = normalize(mat3(modelMatrix) * normal);
        vV = normalize(cameraPosition - wp.xyz);
        gl_Position = projectionMatrix * viewMatrix * wp;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor; uniform float uOpacity, uTime; varying vec2 vUv; varying vec3 vN; varying vec3 vV;
      void main(){
        float f = pow(abs(dot(normalize(vN), normalize(vV))), 2.2);
        float h = vUv.y;
        float dust = 0.85 + 0.15 * sin(vUv.x * 40.0 + uTime * 0.6 + h * 9.0);
        float a = f * smoothstep(0.32, 0.62, h) * (1.0 - smoothstep(0.82, 1.0, h)) * uOpacity * dust;
        gl_FragColor = vec4(uColor * a, a);
      }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false,
  }), []);
  const glowRef = useRef();
  const shafts = useRef([]);
  const SH = mobile ? [] : [
    { x: 3.2, y: 2.6, z: -2.6, r: 0.62, w: 0.9, h: 8, o: 0.16 },
    { x: 2.4, y: 2.8, z: -2.8, r: 0.5, w: 0.5, h: 8, o: 0.12 },
    { x: 1.4, y: 3.0, z: -3.0, r: 0.36, w: 1.2, h: 9, o: 0.09 },
  ];
  useFrame((st) => {
    const t = st.clock.elapsedTime;
    const k = clamp01(S.fruitIn * 1.2);
    if (glowRef.current) {
      glowRef.current.material.opacity = (0.62 + 0.08 * Math.sin(t * 0.6)) * k;
      glowRef.current.material.color.copy(M.glow);
      glowRef.current.scale.setScalar(1 + 0.03 * Math.sin(t * 0.45));
    }
    shafts.current.forEach((m, i) => { if (m) { m.material.opacity = SH[i].o * k * (0.75 + 0.25 * Math.sin(t * 0.3 + i * 2)); m.material.color.copy(M.glow); } });
    beamMat.uniforms.uTime.value = t;
    beamMat.uniforms.uOpacity.value = 0.2 * k;
    beamMat.uniforms.uColor.value.set(M.hot.x, M.hot.y, M.hot.z).lerp(_a.setRGB(1, 1, 1), 0.45);
  });
  return (
    <group>
      <mesh ref={glowRef} position={[2.0, 0.7, -2.0]} renderOrder={-5}>
        <planeGeometry args={[6.5, 6.5]} />
        <meshBasicMaterial map={glow} transparent depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} opacity={0} />
      </mesh>
      {SH.map((sh, i) => (
        <mesh key={i} ref={(m) => (shafts.current[i] = m)} position={[sh.x, sh.y, sh.z]} rotation-z={sh.r} renderOrder={-4}>
          <planeGeometry args={[sh.w, sh.h]} />
          <meshBasicMaterial map={shaft} transparent depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} opacity={0} />
        </mesh>
      ))}
      {/* öndeki paketin üstüne tepeden düşen sahne ışığı */}
      <mesh position={[RING.cx + 0.05, PT + 3.1, RING.cz + RING.rz - 0.15]} rotation-z={-0.05} material={beamMat} renderOrder={5}>
        <cylinderGeometry args={[0.22, 1.75, 6.2, 48, 1, true]} />
      </mesh>
    </group>
  );
}

/* ---------------- korlar / kırıntılar ---------------- */
function Embers({ mobile }) {
  const count = mobile ? 70 : 170;
  const { geo, mat } = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3), seed = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = -1 + Math.random() * 6.5;
      pos[i * 3 + 1] = -2 + Math.random() * 6;
      pos[i * 3 + 2] = -3.5 + Math.random() * 5.5;
      seed[i] = Math.random();
    }
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
    const m = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uPix: { value: 1 }, uIn: { value: 0 }, uC1: { value: M.e1 }, uC2: { value: M.e2 } },
      vertexShader: /* glsl */ `
        attribute float aSeed; uniform float uTime, uPix; varying float vA; varying float vS;
        void main(){
          vec3 p = position;
          float t = uTime * (0.08 + aSeed * 0.18);
          p.y = mod(p.y + t * 1.4 + 2.0, 6.0) - 2.0;
          p.x += sin(t * 2.0 + aSeed * 20.0) * 0.18;
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = (0.007 + aSeed * 0.022) * uPix / -mv.z;
          vA = smoothstep(-2.0, -1.2, p.y) * (1.0 - smoothstep(3.0, 4.0, p.y));
          vS = aSeed;
        }`,
      fragmentShader: /* glsl */ `
        uniform float uIn; uniform vec3 uC1, uC2; varying float vA; varying float vS;
        void main(){
          float d = length(gl_PointCoord - 0.5);
          float a = smoothstep(0.5, 0.0, d);
          vec3 c = mix(uC1, uC2, vS);
          gl_FragColor = vec4(c * a, a * vA * uIn * (0.45 + 0.55 * vS));
        }`,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false,
    });
    return { geo: g, mat: m };
  }, [count]);
  useFrame((st) => {
    mat.uniforms.uTime.value = st.clock.elapsedTime;
    mat.uniforms.uPix.value = st.viewport.dpr * st.size.height / (2 * Math.tan((st.camera.fov * Math.PI) / 360));
    mat.uniforms.uIn.value = clamp01(S.fruitIn);
  });
  return <points geometry={geo} material={mat} frustumCulled={false} />;
}

/* ---------------- kamera: yerinde, yalnızca giriş süzülmesi ve çok hafif fare paralaksı ---------------- */
function Rig({ mobile }) {
  const { camera, size, scene } = useThree();
  const look = useMemo(() => new THREE.Vector3(), []);
  const tmp = useMemo(() => ({ pos: new THREE.Vector3(), look: new THREE.Vector3() }), []);
  useFrame((st, dt) => {
    // kaydırmayı yumuşak takip eden sahne konumu
    S.sNow += (S.s - S.sNow) * (1 - Math.exp(-5.5 * Math.min(dt, 0.05)));
    if (Math.abs(S.s - S.sNow) < 0.0005) S.sNow = S.s;
    updateMood(S.sNow);
    if (scene.fog) scene.fog.color.copy(M.fog);
    const t = st.clock.elapsedTime;
    const aspect = size.width / size.height;
    const narrow = aspect < 0.9;
    const rest = narrow
      ? { pos: [1.85, 0.9, 17.2], look: [1.85, -1.3, 0] }
      : { pos: [0.5, 0.75, 7.9], look: [0.5, -0.02, 0] };
    if (!narrow && aspect < 1.35) { rest.pos = [1.2, 0.8, 9.4]; rest.look = [1.2, -0.05, 0]; }
    // sis kameranın uzaklığına göre: paketler hep net, yalnızca arka katman puslu
    if (scene.fog) { scene.fog.near = rest.pos[2] + 1.4; scene.fog.far = rest.pos[2] + 14; }
    const sway = mobile ? 0 : 1;
    tmp.pos.set(
      rest.pos[0] + S.mx * 0.22 + Math.sin(t * 0.16) * 0.04 * sway,
      rest.pos[1] - S.my * 0.12 + Math.sin(t * 0.13) * 0.025 * sway + S.intro * 0.9,
      rest.pos[2] + S.intro * 3.4
    );
    tmp.look.set(rest.look[0], rest.look[1] + S.intro * 0.4, rest.look[2]);
    const k = 1 - Math.exp(-3 * Math.min(dt, 0.05));
    camera.position.lerp(tmp.pos, k);
    look.lerp(tmp.look, k);
    camera.lookAt(look);
  }, -1);
  useEffect(() => {
    camera.position.set(0.5, 1.7, 10.7);
    look.set(0.5, 0.7, 0);
  }, []);
  return null;
}

/* ---------------- sahne ---------------- */
function Scene({ flavors, mobile, reduce, onReady }) {
  const { gl } = useThree();
  const handleReady = (holders) => {
    // GSAP giriş: kamera süzülür, paketler kaideye iner, meyveler belirir
    const tl = gsap.timeline();
    if (reduce) { S.intro = 0; S.fruitIn = 1; }
    else {
      tl.to(S, { intro: 0, duration: 2.6, ease: 'power3.out' }, 0);
      holders.forEach((h, i) => {
        h.drop = 2.2; h.tilt = (i % 2 ? 1 : -1) * 0.25;
        tl.to(h, { drop: 0, duration: 1.35, ease: 'back.out(1.25)' }, 0.25 + i * 0.12);
        tl.to(h, { tilt: 0, duration: 1.35, ease: 'power3.out' }, 0.25 + i * 0.12);
      });
      tl.to(S, { fruitIn: 1, duration: 2.2, ease: 'power2.out' }, 0.7);
    }
    requestAnimationFrame(() => onReady());
  };
  useEffect(() => { gl.toneMapping = THREE.NeutralToneMapping; gl.toneMappingExposure = 1.0; }, [gl]);
  return (
    <>
      <fog attach="fog" args={['#3a0509', 9, 22]} />
      <Backdrop mobile={mobile} />
      <Lights mobile={mobile} />
      <Platform mobile={mobile} />
      <Pouches flavors={flavors} mobile={mobile} onReady={handleReady} />
      <LightBurst mobile={mobile} />
      <Fruits mobile={mobile} />
      <NearLayer mobile={mobile} />
      <Embers mobile={mobile} />
      {!mobile && (
        <ContactShadows position={[PC[0], PT + 0.004, PC[1]]} scale={[6, 4.4]} resolution={512}
          blur={2.4} far={2.4} opacity={0.85} color="#1a0503" />
      )}
      <Rig mobile={mobile} />
      {!mobile && (
        <EffectComposer multisampling={0} enableNormalPass={false}>
          <N8AO aoRadius={0.55} intensity={2.4} distanceFalloff={0.7} halfRes quality="medium" color="#200403" />
          <Bloom mipmapBlur luminanceThreshold={0.86} luminanceSmoothing={0.2} intensity={0.42} />
          <ToneMapping mode={ToneMappingMode.NEUTRAL} />
          <Vignette offset={0.32} darkness={0.5} />
          <SMAA />
        </EffectComposer>
      )}
    </>
  );
}

export default function HeroCanvas({ flavors, mobile, reduce, active, onReady }) {
  return (
    <Canvas
      shadows={!mobile}
      dpr={mobile ? [1, 1.5] : [1, 2]}
      gl={{ antialias: mobile, powerPreference: 'high-performance', alpha: false, stencil: false }}
      camera={{ fov: 30, near: 0.1, far: 60, position: [0.5, 1.7, 10.7] }}
      frameloop={active ? 'always' : 'never'}
      onCreated={({ gl }) => { gl.setClearColor('#3a0509'); }}
    >
      <Scene flavors={flavors} mobile={mobile} reduce={reduce} onReady={onReady} />
    </Canvas>
  );
}
