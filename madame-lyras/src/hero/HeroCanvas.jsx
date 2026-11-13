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

/* paylaşılan durum: kaydırma, fare, giriş animasyonu */
export const S = { p: 0, mx: 0, my: 0, intro: 1, pouchIn: 0, fruitIn: 0, handoff: false, cilek: null, rect: null };

const PT = -1.05; // kaidenin üst yüzeyi
const ease = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const clamp01 = (x) => Math.min(1, Math.max(0, x));
const P = (id, k, b = false) => `/parca/${id}-${k}${b ? 'b' : ''}.webp`;

/* ---------------- arka plan: bordodan kırmızıya sinematik geçiş ---------------- */
function Backdrop({ mobile }) {
  const mat = useMemo(() => new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uAspect: { value: 1.6 }, uMobile: { value: mobile ? 1 : 0 }, uP: { value: 0 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.9999, 1.0); }',
    fragmentShader: /* glsl */ `
      uniform float uTime, uAspect, uMobile, uP;
      varying vec2 vUv;
      float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float noise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
        return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y); }
      float fbm(vec2 p){ float s = 0.0, a = 0.5; for (int i = 0; i < 5; i++) { s += noise(p) * a; p *= 2.02; a *= 0.5; } return s; }
      void main(){
        vec2 uv = vUv;
        vec2 q = vec2(uv.x * uAspect, uv.y);
        vec3 dark = vec3(0.16, 0.01, 0.02), wine = vec3(0.4, 0.02, 0.04), red = vec3(0.84, 0.07, 0.07), hot = vec3(1.0, 0.38, 0.14);
        vec2 c = mix(vec2(0.68, 0.56), vec2(0.5, 0.74), uMobile);
        float d = length((uv - c) * vec2(uAspect * 0.6, 1.0));
        float glow = smoothstep(1.1 + 0.07 * sin(uTime * 0.35), 0.0, d);
        // zamanla bordo ile canlı kırmızı arasında yavaşça nefes alan geçiş
        float pulse = 0.5 + 0.5 * sin(uTime * 0.22);
        vec3 col = mix(dark, wine, smoothstep(0.0, 0.5, glow));
        col = mix(col, red, smoothstep(0.42 - 0.08 * pulse, 0.95, glow));
        float sm = fbm(q * 1.5 + vec2(uTime * 0.025, -uTime * 0.018));
        float sm2 = fbm(q * 3.4 - vec2(uTime * 0.04, uTime * 0.012));
        col *= 0.78 + 0.42 * sm;
        col += hot * pow(glow, 3.0) * 0.3 * (0.55 + 0.45 * sm2);
        vec2 lp = uv - vec2(0.96, 1.12); lp.x *= uAspect;
        float ang = atan(lp.y, lp.x);
        float rays = 0.5 + 0.5 * sin(ang * 17.0 + uTime * 0.1 + sm * 3.0);
        float rf = smoothstep(1.8, 0.0, length(lp));
        col += vec3(1.0, 0.55, 0.3) * rays * rf * 0.09;
        float v = smoothstep(1.3, 0.3, length((uv - vec2(0.56, 0.52)) * vec2(1.0, 1.25)));
        col *= mix(0.42, 1.0, v);
        col *= 1.0 + uP * 0.18;
        gl_FragColor = vec4(pow(col, vec3(2.2)), 1.0);
        #include <colorspace_fragment>
      }`,
    depthWrite: false, depthTest: false, toneMapped: false,
  }), [mobile]);
  useFrame((st) => {
    mat.uniforms.uTime.value = st.clock.elapsedTime;
    mat.uniforms.uAspect.value = st.size.width / st.size.height;
    mat.uniforms.uP.value = S.p;
  });
  return <mesh frustumCulled={false} renderOrder={-100} material={mat}><planeGeometry args={[2, 2]} /></mesh>;
}

/* ---------------- ışık ve yansıma ---------------- */
function Lights({ mobile }) {
  return (
    <>
      <ambientLight intensity={0.32} color="#ffd8c4" />
      <directionalLight
        position={[5, 6.5, 5]} intensity={3.0} color="#fff1e2"
        castShadow={!mobile}
        shadow-mapSize={[2048, 2048]} shadow-bias={-0.0004} shadow-normalBias={0.03}
        shadow-camera-left={-5} shadow-camera-right={5} shadow-camera-top={5} shadow-camera-bottom={-5} shadow-camera-far={30}
      />
      <spotLight position={[-3, 4.5, -4]} angle={0.8} penumbra={1} intensity={70} distance={20} decay={2} color="#ff7a45" />
      <pointLight position={[1.7, -0.3, 2.4]} intensity={5} distance={6} decay={2} color="#ff3a22" />
      <Environment resolution={mobile ? 64 : 256} frames={1}>
        <Lightformer form="rect" intensity={2.8} position={[0, 5, 2]} rotation-x={Math.PI / 2} scale={[10, 4, 1]} color="#fff3e6" />
        <Lightformer form="rect" intensity={4} position={[5, 1.5, 3]} rotation-y={-Math.PI / 2.5} scale={[2, 6, 1]} color="#ffffff" />
        <Lightformer form="rect" intensity={1.6} position={[-5, 1, 2]} rotation-y={Math.PI / 2.5} scale={[2, 6, 1]} color="#ffb48a" />
        <Lightformer form="ring" intensity={1.4} position={[0, 0, -6]} scale={6} color="#ff2a1a" />
      </Environment>
    </>
  );
}

/* ---------------- kaide ---------------- */
const PC = [1.85, -0.25]; // platform merkezi (x, z)
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
    </group>
  );
}

/* ---------------- ürün paketleri ---------------- */
const POUCHES = [
  { id: 'seftali', x: 0.82, z: -0.85, ry: 0.36, s: 1.68 },
  { id: 'hindistan-cevizi', x: 1.36, z: -0.4, ry: 0.22, s: 1.72 },
  { id: 'ananas', x: 2.78, z: -0.62, ry: -0.38, s: 1.68 },
  { id: 'cilek', x: 2.0, z: 0.12, ry: -0.06, s: 1.92 },
];
// zemine temas gölgesi
const blobTex = (() => {
  let t = null;
  return () => {
    if (t) return t;
    const c = document.createElement('canvas'); c.width = 256; c.height = 128;
    const x = c.getContext('2d');
    const g = x.createRadialGradient(128, 64, 0, 128, 64, 128);
    g.addColorStop(0, 'rgba(10,2,2,.9)'); g.addColorStop(0.45, 'rgba(10,2,2,.45)'); g.addColorStop(1, 'rgba(10,2,2,0)');
    x.setTransform(1, 0, 0, 0.5, 0, 32); x.fillStyle = g; x.fillRect(0, 0, 256, 256);
    t = new THREE.CanvasTexture(c);
    return t;
  };
})();
function Pouches({ flavors, onReady }) {
  const root = useMemo(() => new THREE.Group(), []);
  useEffect(() => {
    let dead = false;
    const loader = new THREE.TextureLoader();
    const logo = new Promise((res) => { const im = new Image(); im.onload = () => res(im); im.onerror = () => res(null); im.src = '/logo.svg'; });
    const holders = POUCHES.map((cfg) => {
      const fl = flavors.find((f) => f.id === cfg.id);
      const pk = makePouch();
      for (const m of [pk.frontMat, pk.backMat]) {
        m.envMapIntensity = 1.0; // açılışta ışık şekillendiricilerden parlak film yansımaları
      }
      const a = (fl.aspect || 1.153) / 1.153;
      pk.group.scale.set(1 / Math.sqrt(a), a / Math.sqrt(a), 1);
      pk.bottomMat.color.set(fl.bg).multiplyScalar(0.7);
      const holder = new THREE.Group();
      holder.add(pk.group);
      holder.scale.setScalar(cfg.s);
      holder.rotation.y = cfg.ry;
      holder.position.set(cfg.x, PT + 0.5765 * cfg.s * (a / Math.sqrt(a)) + 0.004, cfg.z);
      holder.visible = false;
      root.add(holder);
      const blob = new THREE.Mesh(new THREE.PlaneGeometry(cfg.s * 1.05, cfg.s * 0.5), new THREE.MeshBasicMaterial({ map: blobTex(), transparent: true, depthWrite: false, opacity: 0.85 }));
      blob.rotation.x = -Math.PI / 2;
      blob.rotation.z = -cfg.ry;
      blob.position.set(cfg.x, PT + 0.006, cfg.z + 0.02);
      blob.renderOrder = 2;
      root.add(blob);
      return { cfg, fl, pk, holder };
    });
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
        });
        S.cilek = holders.find((h) => h.cfg.id === 'cilek')?.holder || null;
        onReady(holders);
      });
    return () => { dead = true; };
  }, []);
  return <primitive object={root} />;
}

/* ---------------- meyveler (hacimli kabartmalar) ---------------- */
// rest: kaidenin üstünde duran; float: süzülen; far: arka katman
// Dengeli kompozisyon: kaidede sol ve sağ kümeler (öndeki çilek paketinin önü açık), üstte paketleri çevreleyen bir yay
const FRUITS = [
  // kaidenin üstü: sol küme
  { u: P('yaprak', 1), x: 0.2, z: 1.1, w: 0.8, rest: true, rx: -1.2, rz: 0.5 },
  { u: P('cilek', 0), x: 0.72, z: 1.0, w: 0.64, rest: true, ry: 0.2, rz: 0.1 },
  { u: P('cilek', 0), x: 0.3, z: 0.62, w: 0.56, rest: true, ry: 0.35, flip: true },
  { u: P('hindistan-cevizi', 4), x: 1.02, z: 1.2, w: 0.36, rest: true },
  { u: P('seftali', 2), x: -0.1, z: 1.05, w: 0.5, rest: true },
  { u: P('cilek', 1), x: 0.48, z: 1.4, w: 0.42, rest: true, sink: 0.14 },
  // kaidenin üstü: sağ küme
  { u: P('ananas', 2), x: 3.35, z: 0.55, w: 0.82, rest: true, ry: -0.35 },
  { u: P('hindistan-cevizi', 1), x: 3.05, z: 1.18, w: 0.3, rest: true },
  { u: P('cilek', 0), x: 3.55, z: -0.05, w: 0.48, rest: true, ry: -0.45, flip: true },
  { u: P('yaprak', 2), x: 3.6, z: 0.95, w: 0.6, rest: true, rx: -1.25, rz: -0.6 },
  // paketlerin çevresinde yay biçiminde süzülenler (farklı hızlarda döner)
  { u: P('cilek', 0), x: 1.25, y: 1.42, z: -0.3, w: 0.58, spin: 0.3 },
  { u: P('seftali', 3), x: 0.66, y: 1.05, z: 0.2, w: 0.5, spin: 0.5 },
  { u: P('hindistan-cevizi', 2), x: 0.3, y: 0.75, z: 0.95, w: 0.3, spin: -0.45 },
  { u: P('ananas', 1), x: 3.15, y: 1.38, z: -0.4, w: 0.52, spin: 0.22 },
  { u: P('cilek', 0), x: 3.4, y: 1.05, z: 0.25, w: 0.54, spin: -0.3 },
  { u: P('seftali', 1), x: 3.35, y: 0.55, z: 0.95, w: 0.45, spin: 0.55 },
  { u: P('ananas', 0), x: 3.75, y: 1.25, z: -0.9, w: 0.42, spin: -0.25 },
  { u: P('hindistan-cevizi', 1), x: 2.45, y: 1.62, z: -1.0, w: 0.26, spin: 0.7 },
  { u: P('yaprak', 0), x: 1.95, y: 1.7, z: -1.2, w: 0.42, spin: 0.2 },
  // arka katman
  { u: P('seftali', 1), x: 3.4, y: 1.7, z: -3.8, w: 0.5, spin: 0.2, far: true },
  { u: P('cilek', 0), x: 0.9, y: 1.75, z: -4.0, w: 0.5, spin: -0.15, far: true },
  { u: P('ananas', 3), x: 4.5, y: 0.6, z: -3.6, w: 0.5, spin: -0.2, far: true },
];
const DRIED = ['cilek-1', 'seftali-1', 'seftali-2', 'seftali-3', 'hindistan-cevizi'];
// kameraya yakın, bulanık ön plan (kameraya göre konum)
const NEAR = [
  { u: P('cilek', 0, true), at: [-0.92, -0.86], z: 4.3, w: 0.95, rot: 0.4, mobile: false },
  { u: P('yaprak', 2, true), at: [-1.02, 0.42], z: 4.1, w: 0.85, rot: -0.7, mobile: true },
  { u: P('yaprak', 0, true), at: [0.98, -0.82], z: 4.0, w: 0.7, rot: 0.3, mobile: true },
  { u: P('cilek', 0, true), at: [0.62, -1.02], z: 4.4, w: 0.6, rot: -0.5, mobile: false },
];

function Fruits({ mobile }) {
  const root = useMemo(() => new THREE.Group(), []);
  const items = useRef([]);
  useEffect(() => {
    let dead = false;
    const list = FRUITS.filter((f) => !(mobile && f.far && f.x > 4));
    Promise.all(list.map((f) => loadRelief(f.u, { seg: mobile ? 28 : 44, depth: f.u.includes('yaprak') ? 0.08 : 0.3, glossy: !DRIED.some((d) => f.u.includes(d)) }))).then((res) => {
      if (dead) return;
      res.forEach((r, i) => {
        if (!r) return;
        const f = list[i];
        const m = new THREE.Mesh(r.geo, r.mat);
        m.customDepthMaterial = r.depthMat;
        m.castShadow = !mobile && !f.far;
        m.receiveShadow = false;
        const h = f.w * r.aspect;
        const y = f.rest ? PT + h / 2 - (f.sink || 0) * h - (f.rx ? h * 0.42 : 0) : f.y;
        m.position.set(f.x, y, f.z);
        m.rotation.set(f.rx || 0, f.ry || 0, f.rz || 0);
        m.scale.set(f.w * (f.flip ? -1 : 1), f.w, f.w);
        if (f.far) { m.material = r.mat.clone(); m.material.color.setRGB(0.55, 0.4, 0.4); m.material.emissiveIntensity = 0.12; }
        root.add(m);
        items.current.push({ m, f, base: m.position.clone(), rot: m.rotation.clone(), w: f.w, phase: i * 1.73, delay: (i % 8) * 0.07 });
      });
    });
    return () => { dead = true; };
  }, [mobile]);
  useFrame((st) => {
    const t = st.clock.elapsedTime;
    for (const it of items.current) {
      const k = clamp01(S.fruitIn * 1.6 - it.delay);
      const e = 1 - Math.pow(1 - k, 3);
      const sx = it.f.flip ? -it.w : it.w;
      it.m.scale.set(sx * e, it.w * e, it.w * e);
      if (it.f.rest) continue;
      const sp = it.f.spin || 0.3;
      it.m.position.y = it.base.y + Math.sin(t * 0.7 + it.phase) * 0.08 + (1 - e) * 0.6;
      it.m.position.x = it.base.x + Math.cos(t * 0.45 + it.phase) * 0.04;
      it.m.rotation.y = Math.sin(t * sp + it.phase) * 0.75;
      it.m.rotation.z = it.rot.z + t * sp * 0.35;
      it.m.rotation.x = Math.sin(t * sp * 0.6 + it.phase) * 0.25;
    }
  });
  return <primitive object={root} />;
}

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
    const dir = new THREE.Vector3();
    camera.getWorldDirection(dir);
    for (const it of items.current) {
      const dist = 8.4 - it.n.z;
      const hh = Math.tan((camera.fov * Math.PI) / 360) * dist;
      const hw = hh * (size.width / size.height);
      // kameraya göre sabit konum, fare ile kuvvetli paralaks
      it.m.position.set(
        camera.position.x + it.n.at[0] * hw - S.mx * 0.25,
        camera.position.y - 0.3 + it.n.at[1] * hh + S.my * 0.15 + Math.sin(t * 0.5 + it.phase) * 0.03,
        camera.position.z - dist
      );
      it.m.rotation.set(0, 0, it.n.rot + Math.sin(t * 0.3 + it.phase) * 0.06);
      const e = clamp01(S.fruitIn * 1.3);
      it.m.scale.setScalar(it.n.w * (0.6 + 0.4 * e));
      it.m.material.opacity = e * (1 - S.p * 0.9);
    }
  });
  return <primitive object={group} />;
}

/* ---------------- paketlerin arkasında ışık patlaması ve hacimli huzmeler ---------------- */
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
      glowRef.current.scale.setScalar(1 + 0.03 * Math.sin(t * 0.45));
    }
    shafts.current.forEach((m, i) => { if (m) m.material.opacity = SH[i].o * k * (0.75 + 0.25 * Math.sin(t * 0.3 + i * 2)); });
  });
  return (
    <group>
      <mesh ref={glowRef} position={[2.05, 0.75, -1.9]} renderOrder={-5}>
        <planeGeometry args={[6.5, 6.5]} />
        <meshBasicMaterial map={glow} transparent depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} opacity={0} />
      </mesh>
      {SH.map((sh, i) => (
        <mesh key={i} ref={(m) => (shafts.current[i] = m)} position={[sh.x, sh.y, sh.z]} rotation-z={sh.r} renderOrder={-4}>
          <planeGeometry args={[sh.w, sh.h]} />
          <meshBasicMaterial map={shaft} transparent depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} opacity={0} />
        </mesh>
      ))}
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
      uniforms: { uTime: { value: 0 }, uPix: { value: 1 }, uIn: { value: 0 } },
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
        uniform float uIn; varying float vA; varying float vS;
        void main(){
          float d = length(gl_PointCoord - 0.5);
          float a = smoothstep(0.5, 0.0, d);
          vec3 c = mix(vec3(1.0, 0.45, 0.12), vec3(1.0, 0.82, 0.45), vS);
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

/* ---------------- kamera: giriş, fare, nefes, kaydırmada yaklaşma ---------------- */
function Rig({ mobile }) {
  const { camera, size } = useThree();
  const look = useMemo(() => new THREE.Vector3(), []);
  const tmp = useMemo(() => ({ pos: new THREE.Vector3(), look: new THREE.Vector3() }), []);
  useFrame((st, dt) => {
    const t = st.clock.elapsedTime;
    const aspect = size.width / size.height;
    const narrow = aspect < 0.9;
    // dinlenme ve yakın plan kadrajları
    const rest = narrow
      ? { pos: [1.9, 0.3, 14.2], look: [1.9, -1.55, 0] }
      : { pos: [0.5, 0.75, 7.9], look: [0.5, -0.02, 0] };
    if (!narrow && aspect < 1.35) { rest.pos = [1.2, 0.8, 9.4]; rest.look = [1.2, -0.05, 0]; }
    const close = narrow
      ? { pos: [1.72, 0.35, 6.4], look: [1.74, -0.35, 0] }
      : { pos: [1.55, 0.55, 4.4], look: [1.72, 0.12, 0.2] };
    const p = 0; // kaydırmada kamera yaklaşmaz; yalnızca çilek paketi aşağı iner
    const sway = mobile ? 0 : 1;
    tmp.pos.set(
      rest.pos[0] + (close.pos[0] - rest.pos[0]) * p + S.mx * 0.32 + Math.sin(t * 0.16) * 0.05 * sway,
      rest.pos[1] + (close.pos[1] - rest.pos[1]) * p - S.my * 0.18 + Math.sin(t * 0.13) * 0.03 * sway + S.intro * 0.9,
      rest.pos[2] + (close.pos[2] - rest.pos[2]) * p + S.intro * 3.4
    );
    tmp.look.set(
      rest.look[0] + (close.look[0] - rest.look[0]) * p,
      rest.look[1] + (close.look[1] - rest.look[1]) * p + S.intro * 0.4,
      rest.look[2] + (close.look[2] - rest.look[2]) * p
    );
    if (st.scene.fog) { st.scene.fog.near = rest.pos[2] + 1.4; st.scene.fog.far = rest.pos[2] + 14; }
    const k = 1 - Math.exp(-3 * Math.min(dt, 0.05)); // yumuşak, kontrollü takip
    camera.position.lerp(tmp.pos, k);
    look.lerp(tmp.look, k);
    camera.lookAt(look);
  });
  useEffect(() => {
    // ilk karede doğrudan doğru yere
    camera.position.set(0.5, 1.7, 10.7);
    look.set(0.5, 0.7, 0);
  }, []);
  return null;
}

/* ---------------- çilek paketinin ekrandaki yeri (ürün bölümüne aktarım için) ---------------- */
function Handoff() {
  const { camera, gl } = useThree();
  const box = useMemo(() => new THREE.Box3(), []);
  const v = useMemo(() => new THREE.Vector3(), []);
  useFrame(() => {
    const h = S.cilek;
    if (!h) return;
    // kaydırma başlayınca bu paket gizlenir; yerine aynı konumda ürün bölümündeki paket geçer
    h.visible = !S.handoff;
    if (S.handoff) return;
    box.setFromObject(h);
    const r = gl.domElement.getBoundingClientRect();
    const toPx = (x, y, z) => { v.set(x, y, z).project(camera); return [r.left + (v.x + 1) / 2 * r.width, r.top + (1 - v.y) / 2 * r.height]; };
    const cx = (box.min.x + box.max.x) / 2, cz = h.position.z;
    const top = toPx(cx, box.max.y, cz), bot = toPx(cx, box.min.y, cz);
    S.rect = { cx: (top[0] + bot[0]) / 2, cy: (top[1] + bot[1]) / 2 + r.top * 0 - window.scrollY * 0, h: bot[1] - top[1], scrollY: window.scrollY };
  });
  return null;
}

/* ---------------- sahne ---------------- */
function Scene({ flavors, mobile, reduce, onReady }) {
  const [introDone, setIntroDone] = useState(false);
  const { gl } = useThree();
  const handleReady = (holders) => {
    // GSAP giriş: kamera süzülür, paketler kaideye iner, meyveler belirir
    const tl = gsap.timeline({ onComplete: () => setIntroDone(true) });
    if (reduce) { S.intro = 0; S.pouchIn = 1; S.fruitIn = 1; tl.call(() => {}); }
    else {
      tl.to(S, { intro: 0, duration: 2.6, ease: 'power3.out' }, 0);
      holders.forEach((h, i) => {
        const y = h.holder.position.y;
        tl.from(h.holder.position, { y: y + 2.2, duration: 1.35, ease: 'back.out(1.25)' }, 0.25 + i * 0.12);
        tl.from(h.holder.rotation, { z: (i % 2 ? 1 : -1) * 0.25, duration: 1.35, ease: 'power3.out' }, 0.25 + i * 0.12);
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
      <Pouches flavors={flavors} onReady={handleReady} />
      <LightBurst mobile={mobile} />
      <Fruits mobile={mobile} />
      <NearLayer mobile={mobile} />
      <Embers mobile={mobile} />
      {(!mobile || introDone) && (
        <ContactShadows position={[PC[0], PT + 0.004, PC[1]]} scale={[6, 4.4]} resolution={mobile ? 256 : 512}
          blur={2.6} far={2.6} opacity={0.85} color="#1a0503" frames={mobile ? 1 : Infinity} />
      )}
      <Rig mobile={mobile} />
      <Handoff />
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
