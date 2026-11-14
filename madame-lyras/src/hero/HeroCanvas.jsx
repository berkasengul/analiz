import * as THREE from 'three';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, Lightformer, ContactShadows, MeshReflectorMaterial } from '@react-three/drei';
import { EffectComposer, N8AO, Bloom, Vignette, SMAA, ToneMapping } from '@react-three/postprocessing';
import { ToneMappingMode } from 'postprocessing';
import gsap from 'gsap';
import { makePouch, makeBackTexture } from '../scene.js';
import { displayPlatform } from './stone.js';
import { loadRelief, loadFlat } from './relief.js';
import { juiceMaterial } from '../juice.js';

/*
  Açılış sahnesi. Dünya ölçüsü: kaidenin üst yüzeyi y = 0, ana (çilek) paketin boyu ≈ 2.1 birim.
  Ürün grubu orijin çevresinde; kamera grubun görsel ağırlık merkezine bakar ve grubu ekranın
  sağına taşımak için "lens kaydırma" (setViewOffset) kullanır: böylece paketler perspektifle
  yana doğru esnemez, ön yüzleri kameraya dik kalır.
*/
export const S = { p: 0, mx: 0, my: 0, intro: 1, fruitIn: 0, handoff: false, cilek: null, rect: null, view: { sx: 0.69, sy: 0.52 } };

const clamp01 = (x) => Math.min(1, Math.max(0, x));
const P = (id, k, b = false) => `/parca/${id}-${k}${b ? 'b' : ''}.webp`;

/* ---------------- sahne yerleşimi ---------------- */
// kaide grubun arkasına kaydırıldı: paketler kaidenin ön yarısında, ön kenara yakın durur
const PLAT = { x: -0.12, z: -0.66, R: 2.85 };
const TARGET = new THREE.Vector3(-0.06, 1.2, 0.12); // ürün grubunun görsel ağırlık merkezi (çilek baskın)
// s: çilek paketine göre ölçek; ry: en fazla ~5°, ön yüzler kameraya dönük
const K = 1.2; // paket ölçeği ve aralıkları (büyük, baskın paketler)
const FK = 1.12; // meyve konum/boyut ölçeği
const S0 = 1.86 * K;
const POUCHES = [
  { id: 'seftali', x: -1.4, z: -0.62, ry: 0.08, s: 0.82 },
  { id: 'hindistan-cevizi', x: -0.7, z: -0.25, ry: 0.06, s: 0.88 },
  { id: 'ananas', x: 1.2, z: -0.45, ry: -0.08, s: 0.84 },
  { id: 'cilek', x: 0.2, z: 0.35, ry: -0.035, s: 1.0, hero: true },
].map((p) => ({ ...p, x: p.x * K, z: p.z * K }));

/* ---------------- kamera çözücü (masaüstü / tablet / telefon) ---------------- */
// Kaide çapının ekran genişliğine oranından mesafeyi, sonra lens kaydırmayla grubun ekrandaki yerini bulur.
function cameraPlan(w, h) {
  const A = w / h;
  if (A < 0.9) {
    // telefon: sahne üstte, yazılar altta; kaide neredeyse tam genişlikte
    // kaidenin kenarları ekrandan biraz taşabilir; paketler kesilmez
    // dikey tablette sahne biraz daha aşağıda ve küçük: paketlerin üstü menünün altına girmesin
    // telefon: yazılar üstte, sahne altta (kaide alttaki özellik satırının hemen üstünde)
    if (A > 0.6) return { fov: 38, elev: 0.06, frac: 0.9, sx: 0.5, sy: 0.7, A };
    return { fov: 38, elev: 0.06, frac: 1.06, sx: 0.5, sy: 0.69, A };
  }
  if (A < 1.35) {
    // tablet: yazılar solda, grup biraz daha küçük
    return { fov: 36, elev: 0.04, frac: 0.44, sx: 0.78, sy: 0.47, A };
  }
  // göz hizasına yakın, tam karşıdan: kaide ince bir elips, paketler zeminde duruyormuş gibi
  return { fov: 36, elev: 0.035, frac: 0.64, sx: 0.69, sy: 0.47, A };
}
function planDistance(pl) {
  const t = Math.tan((pl.fov * Math.PI) / 360);
  const dWidth = (PLAT.R * 2) / (2 * pl.frac * t * pl.A);
  // dikeyde kaidenin altı ile yörüngedeki meyvelerin üstü sığsın (≈4.3 birim)
  const dHeight = 4.8 / (2 * 0.86 * t);
  return Math.max(dWidth, dHeight);
}

/* ---------------- arka plan: ürün sayfalarıyla aynı sinematik tasarım ----------------
   Çilek renginde parlayan merkez, yavaş akan duman, ürünlerin arkasından yayılan ışık huzmeleri,
   paketlerin arkasından kıvrılarak geçen parlak meyve suyu şeridi, alttan dalgalanan meyve suyu,
   bulanık damlalar, vinyet ve ince gren (src/juice.js ile ortak). */
function Backdrop({ mobile }) {
  const mat = useMemo(() => {
    const m = juiceMaterial();
    m.uniforms.uA.value.set('#b90d10');
    m.uniforms.uB.value.set('#b90d10');
    m.uniforms.uDark.value = 0.1;
    m.uniforms.uMobile.value = mobile ? 1 : 0;
    return m;
  }, [mobile]);
  useFrame((st) => {
    const u = mat.uniforms;
    u.uTime.value = st.clock.elapsedTime;
    u.uAspect.value = st.size.width / st.size.height;
    u.uC.value.set(S.view.sx, 1 - S.view.sy + 0.06);
  });
  return <mesh frustumCulled={false} renderOrder={-100} material={mat}><planeGeometry args={[2, 2]} /></mesh>;
}

/* ---------------- stüdyo ışıkları: key, fill, rim, top + yansıma ortamı ---------------- */
function Lights({ mobile, heroTarget }) {
  const keyRef = useRef(), topRef = useRef(), rimR = useRef(), rimL = useRef();
  useEffect(() => {
    // ışıkların hedefleri: grup merkezi ve ana paket
    for (const r of [keyRef, rimR, rimL]) if (r.current) { r.current.target.position.copy(TARGET); r.current.target.updateMatrixWorld(); }
    if (topRef.current) { topRef.current.target.position.copy(heroTarget); topRef.current.target.updateMatrixWorld(); }
  }, [heroTarget]);
  return (
    <>
      <ambientLight intensity={0.22} color="#ffdccb" />
      {/* KEY: ön üstten, sıcak beyaz, yumuşak gölgeli */}
      <directionalLight
        ref={keyRef} position={[-2.6, 6.8, 6.4]} intensity={2.3} color="#fff3e6"
        castShadow={!mobile}
        shadow-mapSize={[2048, 2048]} shadow-bias={-0.0004} shadow-normalBias={0.03} shadow-radius={4}
        shadow-camera-left={-4.5} shadow-camera-right={4.5} shadow-camera-top={4.5} shadow-camera-bottom={-4.5} shadow-camera-far={30}
      />
      {/* FILL: önden, düşük, nötr-sıcak */}
      <directionalLight position={[5, 2, 7]} intensity={0.55} color="#ffeadf" />
      {/* TOP: ana çilek paketine en güçlü ışık */}
      <spotLight ref={topRef} position={[0.5, 6.6, 3.0]} angle={0.3} penumbra={0.75} intensity={62} distance={16} decay={2} color="#fff1e2" />
      {/* RIM: arkadan amber ve kırmızı kontur */}
      <spotLight ref={rimR} position={[3.6, 3.3, -3.6]} angle={0.85} penumbra={1} intensity={95} distance={18} decay={2} color="#ffa060" />
      <spotLight ref={rimL} position={[-4.0, 3.0, -3.3]} angle={0.85} penumbra={1} intensity={70} distance={18} decay={2} color="#ff5a3c" />
      {/* kaidenin gövdesine alttan vuran düşük sıcak ışık (halkaların gerçek ışık karşılığı; parlak nokta yapmaması için geniş ve zayıf) */}
      <hemisphereLight args={['#2a0608', '#ff4a2a', 0.35]} />
      <Environment resolution={mobile ? 64 : 256} frames={1}>
        <Lightformer form="rect" intensity={2.8} position={[0, 5, 2]} rotation-x={Math.PI / 2} scale={[10, 4, 1]} color="#fff3e6" />
        <Lightformer form="rect" intensity={4} position={[5, 1.5, 3]} rotation-y={-Math.PI / 2.5} scale={[2, 6, 1]} color="#ffffff" />
        <Lightformer form="rect" intensity={1.6} position={[-5, 1, 2]} rotation-y={Math.PI / 2.5} scale={[2, 6, 1]} color="#ffb48a" />
        <Lightformer form="ring" intensity={1.4} position={[0, 0, -6]} scale={6} color="#ff2a1a" />
      </Environment>
    </>
  );
}

/* ---------------- yumuşak ışık dokuları ---------------- */
const texCache = {};
function canvasTex(key, w, h, draw) {
  if (texCache[key]) return texCache[key];
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  texCache[key] = t;
  return t;
}
// dikeyde yumuşak sönen ışık bandı (halkaların hafif parıltısı)
const bandTex = () => canvasTex('band', 4, 128, (x, w, h) => {
  const g = x.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, 'rgba(255,255,255,1)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.fillRect(0, 0, w, h);
});

/* ---------------- kaide + ışık halkaları + stüdyo zemini ---------------- */
function Platform({ mobile }) {
  const pl = useMemo(() => displayPlatform({ R: PLAT.R, size: mobile ? 512 : 768 }), [mobile]);
  const topMap = useMemo(() => { const t = pl.map; t.repeat.set(1.25, 1.25); return t; }, [pl]);
  // zemin: koyu kırmızı, hafif parlak, kenarlara doğru arka plana karışır; kaidenin altında temas gölgesi ve ışık havuzu
  const floor = useMemo(() => {
    const alpha = canvasTex('floorA', 256, 256, (x, w) => {
      const g = x.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
      g.addColorStop(0, '#fff'); g.addColorStop(0.42, '#fff'); g.addColorStop(1, '#000');
      x.fillStyle = g; x.fillRect(0, 0, w, w);
    });
    alpha.colorSpace = THREE.NoColorSpace;
    const pool = canvasTex('pool', 512, 512, (x, w) => {
      const c = w / 2, r = (PLAT.R - 0.03) / 7 * c; // zemin 14 birim çapında
      // kaidenin hemen dibinde koyu temas
      let g = x.createRadialGradient(c, c, r * 0.9, c, c, r * 1.12);
      g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      // halka biçimli kırmızı-altın ışık havuzu
      g = x.createRadialGradient(c, c, r * 0.98, c, c, r * 1.75);
      g.addColorStop(0, 'rgba(255,170,90,0.95)'); g.addColorStop(0.12, 'rgba(255,70,40,0.7)'); g.addColorStop(0.45, 'rgba(200,20,15,0.22)'); g.addColorStop(1, 'rgba(120,0,0,0)');
      x.fillStyle = g; x.fillRect(0, 0, w, w);
    });
    const ao = canvasTex('ao', 256, 256, (x, w) => {
      const c = w / 2, r = (PLAT.R - 0.03) / 3.6 * c; // 7.2 birimlik düzlem
      const g = x.createRadialGradient(c, c, r * 0.85, c, c, r * 1.12);
      g.addColorStop(0, 'rgba(8,0,0,0.85)'); g.addColorStop(0.6, 'rgba(8,0,0,0.5)'); g.addColorStop(1, 'rgba(8,0,0,0)');
      x.fillStyle = g; x.fillRect(0, 0, w, w);
    });
    return { alpha, pool, ao };
  }, []);
  const glowRefs = useRef([]);
  useFrame((st) => {
    const t = st.clock.elapsedTime;
    const k = clamp01(S.fruitIn * 1.4);
    glowRefs.current.forEach((m, i) => { if (m) m.material.opacity = m.userData.o * k * (0.9 + 0.1 * Math.sin(t * 0.8 + i)); });
  });
  const ring = (r, y, tube, color, key, glow, gh, go) => (
    <group key={key}>
      <mesh position={[0, y, 0]} rotation-x={Math.PI / 2}>
        <torusGeometry args={[r, tube, 8, 220]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
      {glow && (
        <mesh position={[0, y, 0]} ref={(m) => { if (m) { m.userData.o = go; glowRefs.current[glowRefs.current.length] = m; } }}>
          <cylinderGeometry args={[r + 0.012, r + 0.012, gh, 160, 1, true]} />
          <meshBasicMaterial color={glow} alphaMap={bandTex()} transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} side={THREE.DoubleSide} />
        </mesh>
      )}
    </group>
  );
  const red = new THREE.Color(1.0, 0.14, 0.07).multiplyScalar(4.2);
  const gold = new THREE.Color(1.0, 0.68, 0.32).multiplyScalar(2.6);
  const goldSoft = new THREE.Color(1.0, 0.72, 0.4).multiplyScalar(1.5);
  return (
    <group position={[PLAT.x, 0, PLAT.z]}>
      <mesh geometry={pl.slabGeo} material={pl.slabMat} castShadow={!mobile} receiveShadow />
      <mesh geometry={pl.bodyGeo} material={pl.bodyMat} receiveShadow />
      <mesh geometry={pl.baseGeo} material={pl.baseMat} receiveShadow />
      {/* üst yüzey: kontrollü parlaklıkta yansıma (ürünlerin altında yansımalar görünür) */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.001, 0]} receiveShadow>
        <circleGeometry args={[PLAT.R - 0.034, 128]} />
        {mobile ? (
          <meshPhysicalMaterial map={topMap} roughness={0.2} clearcoat={1} clearcoatRoughness={0.05} envMapIntensity={1.0} />
        ) : (
          <MeshReflectorMaterial map={topMap} blur={[360, 120]} resolution={1024} mixBlur={1} mixStrength={2.2}
            roughness={0.26} depthScale={1.1} minDepthThreshold={0.35} maxDepthThreshold={1.4} metalness={0.3} mirror={0.55} color="#ffffff" />
        )}
      </mesh>
      {/* pirinç kenar bantları */}
      <mesh position={[0, pl.yBodyTop - 0.012, 0]} rotation-x={Math.PI / 2} material={pl.brass}><torusGeometry args={[pl.Rb + 0.004, 0.014, 8, 200]} /></mesh>
      <mesh position={[0, pl.yBaseTop + 0.06, 0]} rotation-x={Math.PI / 2} material={pl.brass}><torusGeometry args={[pl.Rb - 0.03, 0.009, 8, 200]} /></mesh>
      {/* ışık 1: tablanın altında ince sıcak altın çizgi */}
      {ring(PLAT.R - 0.06, pl.yBodyTop - 0.004, 0.006, goldSoft, 'g0', goldSoft, 0.06, 0.25)}
      {/* ışık 2: tabanı çevreleyen kırmızı halka, ışık 3: biraz altında sıcak altın çizgi */}
      {ring(pl.Rbase + 0.004, pl.yBaseTop, 0.011, red, 'r1', new THREE.Color(1, 0.18, 0.08), 0.22, 0.55)}
      {ring(pl.Rbase + 0.002, pl.yBottom + 0.035, 0.007, gold, 'g1', new THREE.Color(1, 0.62, 0.3), 0.12, 0.35)}
      {/* stüdyo zemini */}
      <mesh rotation-x={-Math.PI / 2} position={[0, pl.yBottom - 0.002, 0]} receiveShadow>
        <circleGeometry args={[7, 96]} />
        <meshStandardMaterial color="#3a060a" roughness={0.3} metalness={0.25} envMapIntensity={0.6} alphaMap={floor.alpha} transparent depthWrite={false} />
      </mesh>
      {/* kaidenin zemine temas gölgesi */}
      <mesh rotation-x={-Math.PI / 2} position={[0, pl.yBottom + 0.002, 0]} renderOrder={1}>
        <planeGeometry args={[7.2, 7.2]} />
        <meshBasicMaterial map={floor.ao} transparent depthWrite={false} toneMapped={false} />
      </mesh>
      {/* zemindeki yumuşak kırmızı-altın ışık havuzu (halkaların yansıması) */}
      <mesh rotation-x={-Math.PI / 2} position={[0, pl.yBottom + 0.004, 0]} renderOrder={2}
        ref={(m) => { if (m) { m.userData.o = mobile ? 0.55 : 0.7; glowRefs.current[glowRefs.current.length] = m; } }}>
        <planeGeometry args={[14, 14]} />
        <meshBasicMaterial map={floor.pool} transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
      </mesh>
    </group>
  );
}

/* ---------------- ürün paketleri ---------------- */
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
  // Ana çilek paketi ağır çekimde, çok az hareketle kendini gösterir: yavaşça sağa sola döner, hafifçe yükselip iner
  useFrame((st) => {
    const t = st.clock.elapsedTime;
    const k = clamp01(S.fruitIn * 1.2);
    for (const h of list.current) {
      if (!h.cfg.hero) continue;
      const lift = (1 - Math.cos(t * 0.5)) * 0.022 * k;
      h.sway.rotation.set(Math.sin(t * 0.31) * 0.012 * k, Math.sin(t * 0.33) * 0.17 * k, Math.sin(t * 0.27 + 1) * 0.01 * k);
      h.sway.position.y = lift / h.holder.scale.y;
      h.blob.material.opacity = (mobile ? 0.95 : 0.8) * (1 - lift * 4);
    }
  });
  useEffect(() => {
    let dead = false;
    const loader = new THREE.TextureLoader();
    const logo = new Promise((res) => { const im = new Image(); im.onload = () => res(im); im.onerror = () => res(null); im.src = '/logo.svg'; });
    const holders = POUCHES.map((cfg) => {
      const fl = flavors.find((f) => f.id === cfg.id);
      const pk = makePouch();
      for (const m of [pk.frontMat, pk.backMat]) {
        // ana ürün en parlak; arkadakiler bir kademe daha sakin
        m.envMapIntensity = cfg.hero ? 1.0 : 0.85;
        m.emissiveIntensity = cfg.hero ? 0.3 : 0.22;
      }
      const a = (fl.aspect || 1.153) / 1.153;
      pk.group.scale.set(1 / Math.sqrt(a), a / Math.sqrt(a), 1);
      pk.bottomMat.color.set(fl.bg).multiplyScalar(0.7);
      // gerçek sınır kutusundan alt temas noktası: paket tabanı kaide yüzeyine tam oturur
      pk.group.updateMatrixWorld(true);
      const bb = new THREE.Box3().setFromObject(pk.group);
      const sc = S0 * cfg.s;
      const holder = new THREE.Group();
      // iç grup: ana paketin ağır çekim salınımı (giriş animasyonu dış grubu, salınım iç grubu oynatır)
      const sway = new THREE.Group();
      sway.add(pk.group);
      holder.add(sway);
      holder.scale.setScalar(sc);
      holder.rotation.y = cfg.ry;
      holder.position.set(cfg.x, -bb.min.y * sc - 0.008, cfg.z);
      holder.visible = false;
      root.add(holder);
      const w = (bb.max.x - bb.min.x) * sc;
      const blob = new THREE.Mesh(new THREE.PlaneGeometry(w * 1.12, w * 0.5), new THREE.MeshBasicMaterial({ map: blobTex(), transparent: true, depthWrite: false, opacity: mobile ? 0.95 : 0.8 }));
      blob.rotation.x = -Math.PI / 2;
      blob.rotation.z = -cfg.ry;
      blob.position.set(cfg.x, 0.004, cfg.z + 0.03);
      blob.renderOrder = 2;
      root.add(blob);
      return { cfg, fl, pk, holder, sway, blob };
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
        });
        S.cilek = holders.find((h) => h.cfg.id === 'cilek')?.holder || null;
        onReady(holders);
      });
    return () => { dead = true; };
  }, []);
  return <primitive object={root} />;
}

/* ---------------- ürünleri çevreleyen altın yörünge çizgisi ---------------- */
// Arkada yüksek, önde alçak eğik bir elips. Ön kısmı (ana ürünün önünden geçen yay) söner.
const ORBIT = { x: -0.06, y: 1.78, z: -0.17, rx: 2.85, rz: 1.5, a: 0.95, b: 0.13 };
function orbitPoint(th, out = new THREE.Vector3()) {
  return out.set(ORBIT.x + ORBIT.rx * Math.cos(th), ORBIT.y + ORBIT.a * Math.sin(th) + ORBIT.b * Math.cos(th), ORBIT.z - ORBIT.rz * Math.sin(th));
}
function Orbit() {
  const { geo, geoGlow, mat, matGlow } = useMemo(() => {
    const pts = [];
    for (let i = 0; i < 256; i++) pts.push(orbitPoint((i / 256) * Math.PI * 2));
    const curve = new THREE.CatmullRomCurve3(pts, true);
    const mk = (core, glowAmt) => new THREE.ShaderMaterial({
      uniforms: { uIn: { value: 0 }, uTime: { value: 0 } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: /* glsl */ `
        uniform float uIn, uTime; varying vec2 vUv;
        void main(){
          float u = vUv.x;
          // ön yay (u ≈ 0.75) söner; yörünge boyunca hafif ışık akışı
          float front = smoothstep(0.1, 0.17, abs(u - 0.75));
          float flow = 0.75 + 0.25 * sin(u * 37.7 - uTime * 0.9);
          float across = ${core ? '1.0' : 'pow(1.0 - abs(vUv.y - 0.5) * 2.0, 2.0)'};
          vec3 c = mix(vec3(1.0, 0.62, 0.3), vec3(1.0, 0.86, 0.6), 0.5 + 0.5 * sin(u * 12.0));
          float a = front * flow * across * uIn * ${glowAmt.toFixed(2)};
          gl_FragColor = vec4(c * a * ${core ? '2.2' : '1.0'}, a);
        }`,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false,
    });
    return {
      geo: new THREE.TubeGeometry(curve, 400, 0.008, 6, true),
      geoGlow: new THREE.TubeGeometry(curve, 400, 0.045, 8, true),
      mat: mk(true, 1.0),
      matGlow: mk(false, 0.22),
    };
  }, []);
  useFrame((st) => {
    const k = clamp01(S.fruitIn * 1.3 - 0.2);
    for (const m of [mat, matGlow]) { m.uniforms.uIn.value = k; m.uniforms.uTime.value = st.clock.elapsedTime; }
  });
  return (
    <group>
      <mesh geometry={geo} material={mat} renderOrder={4} />
      <mesh geometry={geoGlow} material={matGlow} renderOrder={4} />
    </group>
  );
}

/* ---------------- meyveler: bilinçli kompozisyon ---------------- */
// rest: kaide üstünde (ön kenara yakın, ana paketin önünü kapatmadan sol ve sağ kümeler)
// orbit: yörünge çizgisi üzerinde (açı derece; paketlerin logo ve yazılarının üstünde değil)
const REST = [
  // sol küme: şeftali ve hindistan cevizinin önü (hepsi kaide yüzeyinin içinde, ana paketin önü açık)
  { u: P('seftali', 0), x: -1.68, z: 0.95, w: 0.66, ry: 0.25 },
  { u: P('cilek', 0), x: -1.25, z: 0.95, w: 0.56, ry: -0.2 },
  { u: P('cilek', 0), x: -1.05, z: 1.45, w: 0.46, ry: 0.4, flip: true },
  { u: P('cilek', 1), x: -1.45, z: 1.2, w: 0.46, sink: 0.12 },
  { u: P('hindistan-cevizi', 4), x: -0.92, z: 1.15, w: 0.34, ry: 0.3 },
  { u: P('yaprak', 1), x: -1.9, z: 0.75, w: 0.7, rx: -1.25, rz: 0.55, leaf: true, desk: true },
  // sağ küme: ananasın önü
  { u: P('ananas', 2), x: 1.62, z: 0.62, w: 0.78, ry: -0.3 },
  { u: P('hindistan-cevizi', 1), x: 1.25, z: 1.25, w: 0.3, ry: -0.4 },
  { u: P('seftali', 2), x: 1.95, z: 0.15, w: 0.5, ry: -0.5, desk: true },
  { u: P('yaprak', 2), x: 1.4, z: 1.15, w: 0.55, rx: -1.25, rz: -0.6, leaf: true },
].map((f) => ({ ...f, x: f.x * FK, z: f.z * FK, w: f.w * FK }));
const ON_ORBIT = [
  { u: P('cilek', 0), th: 175, w: 0.5, off: [0, 0.05, 0.05] },
  { u: P('seftali', 3), th: 150, w: 0.52, off: [0, 0.1, 0] },
  { u: P('cilek', 0), th: 125, w: 0.5, off: [0, 0.12, 0], desk: true },
  { u: P('yaprak', 0), th: 108, w: 0.3, off: [0, 0.05, 0], desk: true },
  { u: P('hindistan-cevizi', 2), th: 92, w: 0.28, off: [0, 0.08, 0] },
  { u: P('cilek', 0), th: 72, w: 0.48, off: [0, 0.1, 0], desk: true },
  { u: P('ananas', 1), th: 50, w: 0.56, off: [0, 0.12, 0] },
  { u: P('cilek', 0), th: 22, w: 0.52, off: [0.05, 0.08, 0] },
  { u: P('cilek', 0), th: 0, w: 0.46, off: [0.1, 0, 0], desk: true },
  { u: P('hindistan-cevizi', 1), th: -18, w: 0.26, off: [0.08, -0.05, 0] },
];
const ON_ORBIT_S = ON_ORBIT.map((f) => ({ ...f, w: f.w * FK }));
const DRIED = ['cilek-1', 'seftali-1', 'seftali-2', 'seftali-3', 'hindistan-cevizi'];

function Fruits({ mobile }) {
  const root = useMemo(() => new THREE.Group(), []);
  const items = useRef([]);
  useEffect(() => {
    let dead = false;
    const list = [
      ...REST.filter((f) => !(mobile && f.desk)).map((f) => ({ ...f, rest: true })),
      ...ON_ORBIT_S.filter((f) => !(mobile && f.desk)).map((f) => ({ ...f, orbit: true })),
    ];
    Promise.all(list.map((f) => loadRelief(f.u, {
      seg: mobile ? 28 : 44,
      depth: f.u.includes('yaprak') ? 0.08 : (f.u.includes('seftali-') && !f.u.includes('seftali-0')) ? 0.18 : 0.3,
      glossy: !DRIED.some((d) => f.u.includes(d)),
    }))).then((res) => {
      if (dead) return;
      res.forEach((r, i) => {
        if (!r) return;
        const f = list[i];
        const m = new THREE.Mesh(r.geo, r.mat);
        m.customDepthMaterial = r.depthMat;
        m.castShadow = !mobile;
        const h = f.w * r.aspect;
        let pos;
        if (f.rest) pos = new THREE.Vector3(f.x, h / 2 - (f.sink || 0) * h - (f.rx ? h * 0.42 : 0), f.z);
        else pos = orbitPoint((f.th * Math.PI) / 180).add(new THREE.Vector3(...(f.off || [0, 0, 0])));
        m.position.copy(pos);
        m.rotation.set(f.rx || 0, f.ry || 0, f.rz || 0);
        root.add(m);
        items.current.push({ m, f, base: pos.clone(), rot: m.rotation.clone(), phase: i * 1.73, delay: (i % 9) * 0.06 });
      });
    });
    return () => { dead = true; };
  }, [mobile]);
  useFrame((st) => {
    const t = st.clock.elapsedTime;
    for (const it of items.current) {
      const k = clamp01(S.fruitIn * 1.6 - it.delay);
      const e = 1 - Math.pow(1 - k, 3);
      const w = it.f.w;
      it.m.scale.set((it.f.flip ? -w : w) * e, w * e, w * e);
      if (it.f.rest) { it.m.position.y = it.base.y + (1 - e) * 0.5; continue; }
      // yörüngedekiler yerinde nazikçe salınır (rastgele uçuşmaz)
      it.m.position.set(it.base.x, it.base.y + Math.sin(t * 0.6 + it.phase) * 0.05 + (1 - e) * 0.4, it.base.z);
      it.m.rotation.y = Math.sin(t * 0.35 + it.phase) * 0.45;
      it.m.rotation.z = it.rot.z + Math.sin(t * 0.25 + it.phase * 0.7) * 0.25 + it.phase;
      it.m.rotation.x = Math.sin(t * 0.3 + it.phase) * 0.15;
    }
  });
  return <primitive object={root} />;
}

/* ---------------- ön plan: kameraya yakın, bulanık meyve ve yapraklar ---------------- */
// at: ekran konumu (-1..1), dist: kameradan uzaklık
const NEAR = [
  { u: P('cilek', 0, true), at: [-0.93, -0.72], dist: 3.0, w: 0.9, rot: 0.35, mobile: false },
  { u: P('yaprak', 2, true), at: [-0.98, 0.78], dist: 3.2, w: 0.75, rot: -0.7, mobile: true },
  { u: P('cilek', 0, true), at: [0.8, -0.95], dist: 2.8, w: 0.75, rot: -0.5, mobile: false },
  { u: P('yaprak', 0, true), at: [0.97, -0.55], dist: 3.0, w: 0.6, rot: 0.3, mobile: false },
  { u: P('yaprak', 0, true), at: [1.0, 0.1], dist: 3.6, w: 0.5, rot: 0.6, mobile: true, only: 'mobile' },
];
function NearLayer({ mobile }) {
  const { camera } = useThree();
  const group = useMemo(() => new THREE.Group(), []);
  const items = useRef([]);
  const v = useMemo(() => new THREE.Vector3(), []);
  useEffect(() => {
    let dead = false;
    const list = NEAR.filter((n) => (mobile ? n.mobile : n.only !== 'mobile'));
    Promise.all(list.map((n) => loadFlat(n.u))).then((res) => {
      if (dead) return;
      res.forEach((r, i) => {
        if (!r) return;
        const m = new THREE.Mesh(r.geo, r.mat.clone());
        m.renderOrder = 10;
        m.frustumCulled = false;
        group.add(m);
        items.current.push({ m, n: list[i], phase: i * 2.1 });
      });
    });
    return () => { dead = true; };
  }, [mobile]);
  useFrame((st) => {
    const t = st.clock.elapsedTime;
    for (const it of items.current) {
      // ekranda sabit bir köşede: ekran noktasından ışın, kameradan belli uzaklıkta
      v.set(it.n.at[0] - S.mx * 0.03, it.n.at[1] + S.my * 0.02 + Math.sin(t * 0.5 + it.phase) * 0.01, 0.5).unproject(camera);
      v.sub(camera.position).normalize().multiplyScalar(it.n.dist).add(camera.position);
      it.m.position.copy(v);
      it.m.quaternion.copy(camera.quaternion);
      it.m.rotateZ(it.n.rot + Math.sin(t * 0.3 + it.phase) * 0.05);
      const e = clamp01(S.fruitIn * 1.3);
      it.m.scale.setScalar(it.n.w * (0.7 + 0.3 * e));
      it.m.material.opacity = e * 0.95;
    }
  });
  return <primitive object={group} />;
}

/* ---------------- grubun arkasında yumuşak ışık yoğunluğu ---------------- */
function BackGlow() {
  const tex = useMemo(() => canvasTex('glow', 256, 256, (x, w) => {
    const g = x.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
    g.addColorStop(0, 'rgba(255,200,150,0.9)'); g.addColorStop(0.25, 'rgba(255,110,60,0.5)'); g.addColorStop(0.6, 'rgba(200,30,20,0.16)'); g.addColorStop(1, 'rgba(150,10,10,0)');
    x.fillStyle = g; x.fillRect(0, 0, w, w);
  }), []);
  const ref = useRef();
  useFrame((st) => {
    if (!ref.current) return;
    ref.current.material.opacity = (0.5 + 0.04 * Math.sin(st.clock.elapsedTime * 0.5)) * clamp01(S.fruitIn * 1.2);
  });
  return (
    <mesh ref={ref} position={[0.1, 1.5, -2.9]} renderOrder={-5}>
      <planeGeometry args={[8.5, 7]} />
      <meshBasicMaterial map={tex} transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
    </mesh>
  );
}

/* ---------------- az sayıda sıcak toz parçacığı ---------------- */
function Embers({ mobile }) {
  const count = mobile ? 24 : 50;
  const { geo, mat } = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3), seed = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = -3.2 + Math.random() * 6.4;
      pos[i * 3 + 1] = -0.5 + Math.random() * 4;
      pos[i * 3 + 2] = -3 + Math.random() * 3.5;
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
          float t = uTime * (0.05 + aSeed * 0.1);
          p.y = mod(p.y + t + 0.5, 4.0) - 0.5;
          p.x += sin(t * 2.0 + aSeed * 20.0) * 0.12;
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = (0.006 + aSeed * 0.014) * uPix / -mv.z;
          vA = smoothstep(-0.5, 0.0, p.y) * (1.0 - smoothstep(2.8, 3.5, p.y));
          vS = aSeed;
        }`,
      fragmentShader: /* glsl */ `
        uniform float uIn; varying float vA; varying float vS;
        void main(){
          float d = length(gl_PointCoord - 0.5);
          float a = smoothstep(0.5, 0.0, d);
          vec3 c = mix(vec3(1.0, 0.5, 0.2), vec3(1.0, 0.85, 0.55), vS);
          gl_FragColor = vec4(c * a, a * vA * uIn * (0.3 + 0.4 * vS));
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

/* ---------------- kamera: lens kaydırmalı, kontrollü, çok hafif paralaks ---------------- */
function Rig({ mobile }) {
  const { camera, size } = useThree();
  const look = useMemo(() => new THREE.Vector3(), []);
  const tmp = useMemo(() => ({ pos: new THREE.Vector3(), look: new THREE.Vector3() }), []);
  const first = useRef(true);
  useFrame((st, dt) => {
    const t = st.clock.elapsedTime;
    const w = size.width, h = size.height;
    const pl = cameraPlan(w, h);
    const d = planDistance(pl);
    S.view.sx = pl.sx; S.view.sy = pl.sy;
    // lens kaydırma: görüntü merkezi (TARGET) ekranda sx, sy noktasına düşer
    let fw = w, fh = h, ox = 0, oy = 0;
    if (pl.sx >= 0.5) fw = 2 * pl.sx * w; else { fw = 2 * (1 - pl.sx) * w; ox = fw - w; }
    if (pl.sy >= 0.5) fh = 2 * pl.sy * h; else { fh = 2 * (1 - pl.sy) * h; oy = fh - h; }
    const fovFull = (2 * Math.atan(Math.tan((pl.fov * Math.PI) / 360) * (fh / h)) * 180) / Math.PI;
    if (Math.abs(camera.fov - fovFull) > 1e-4 || camera.aspect !== fw / fh || !camera.view || camera.view.fullWidth !== fw || camera.view.fullHeight !== fh) {
      camera.fov = fovFull;
      camera.aspect = fw / fh;
      camera.setViewOffset(fw, fh, ox, oy, w, h);
      camera.updateProjectionMatrix();
    }
    const sway = mobile ? 0 : 1;
    tmp.pos.set(
      TARGET.x + S.mx * 0.22 * sway + Math.sin(t * 0.15) * 0.03 * sway,
      TARGET.y + Math.sin(pl.elev) * d - S.my * 0.1 * sway + S.intro * 0.9,
      TARGET.z + Math.cos(pl.elev) * d + S.intro * 3.4
    );
    tmp.look.set(TARGET.x, TARGET.y + S.intro * 0.4, TARGET.z);
    if (st.scene.fog) { st.scene.fog.near = d + 2.5; st.scene.fog.far = d + 16; }
    if (first.current) { camera.position.copy(tmp.pos); look.copy(tmp.look); first.current = false; }
    const k = 1 - Math.exp(-3 * Math.min(dt, 0.05)); // yumuşak, kontrollü takip
    camera.position.lerp(tmp.pos, k);
    look.lerp(tmp.look, k);
    camera.lookAt(look);
  }, -1);
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
    const sw = h.children[0];
    S.rect = { cx: (top[0] + bot[0]) / 2, cy: (top[1] + bot[1]) / 2, h: bot[1] - top[1], scrollY: window.scrollY, ry: h.rotation.y + (sw ? sw.rotation.y : 0) };
  });
  return null;
}

/* ---------------- sahne ---------------- */
const HERO_TARGET = new THREE.Vector3(0.24, 1.3, 0.42);
function Scene({ flavors, mobile, reduce, onReady }) {
  const [introDone, setIntroDone] = useState(false);
  const { gl } = useThree();
  const handleReady = (holders) => {
    // GSAP giriş: kamera süzülür, paketler kaideye iner, meyveler ve ışıklar belirir
    const tl = gsap.timeline({ onComplete: () => setIntroDone(true) });
    if (reduce) { S.intro = 0; S.fruitIn = 1; tl.call(() => {}); }
    else {
      tl.to(S, { intro: 0, duration: 2.6, ease: 'power3.out' }, 0);
      holders.forEach((h, i) => {
        const y = h.holder.position.y;
        tl.from(h.holder.position, { y: y + 2.2, duration: 1.35, ease: 'back.out(1.2)' }, 0.25 + i * 0.12);
        tl.from(h.holder.rotation, { z: (i % 2 ? 1 : -1) * 0.2, duration: 1.35, ease: 'power3.out' }, 0.25 + i * 0.12);
      });
      tl.to(S, { fruitIn: 1, duration: 2.2, ease: 'power2.out' }, 0.7);
    }
    requestAnimationFrame(() => onReady());
  };
  useEffect(() => { gl.toneMapping = THREE.NeutralToneMapping; gl.toneMappingExposure = 1.0; }, [gl]);
  return (
    <>
      <fog attach="fog" args={['#5a0a0c', 12, 26]} />
      <Backdrop mobile={mobile} />
      <Lights mobile={mobile} heroTarget={HERO_TARGET} />
      <BackGlow />
      <Platform mobile={mobile} />
      <Pouches flavors={flavors} mobile={mobile} onReady={handleReady} />
      <Orbit />
      <Fruits mobile={mobile} />
      <NearLayer mobile={mobile} />
      <Embers mobile={mobile} />
      {/* yumuşak temas gölgeleri: giriş animasyonu boyunca canlı, sonra sabitlenir (performans) */}
      {(!mobile || introDone) && (
        <ContactShadows position={[PLAT.x, 0.003, PLAT.z]} scale={[5.8, 5.8]} resolution={mobile ? 256 : 512}
          blur={2.4} far={2.4} opacity={0.85} color="#1a0503" frames={introDone ? 1 : Infinity} />
      )}
      <Rig mobile={mobile} />
      <Handoff />
      {!mobile && (
        <EffectComposer multisampling={0} enableNormalPass={false}>
          <N8AO aoRadius={0.5} intensity={2.2} distanceFalloff={0.7} halfRes quality="medium" color="#200403" />
          <Bloom mipmapBlur luminanceThreshold={0.9} luminanceSmoothing={0.15} intensity={0.55} radius={0.7} />
          <ToneMapping mode={ToneMappingMode.NEUTRAL} />
          <Vignette offset={0.3} darkness={0.45} />
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
      camera={{ fov: 36, near: 0.1, far: 80, position: [0, 3, 14] }}
      frameloop={active ? 'always' : 'never'}
      onCreated={({ gl }) => { gl.setClearColor('#5a0a0c'); }}
    >
      <Scene flavors={flavors} mobile={mobile} reduce={reduce} onReady={onReady} />
    </Canvas>
  );
}
