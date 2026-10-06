import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, useTexture } from "@react-three/drei";
import { CanvasTexture, MathUtils, MeshPhysicalMaterial, MeshStandardMaterial, Vector3 } from "three";

import Bottle, { HEIGHT, backUrl, frontUrl } from "./Bottle";
import { PRODUCTS, state } from "./state";
import env from "./assets/env.hdr?url";

// Sahne sayfanın üstünde sabit, saydam bir katman. Şişe sayfadaki "yuvaları" (#seat-hero, #seat-card,
// #seat-notes) izler: her karede yuvaların ekrandaki yeri 3B dünyaya taşınır, şişe ekranın ortasına en yakın
// iki yuva arasında kaydırmaya göre süzülür.
// - Açılış vitrini sabitken (state.heroP) kaydırdıkça kokular değişir: şişe yan dönerek kaideden yükselir,
//   tam yan dönükken yenisine geçer, yenisi aşağıdan dönerek kaideye oturur.
// - Son kokudan sonra vitrin yukarı kayar; şişe öne eğilip dönerek ürün kartındaki kaideye iner, notalarda
//   arkasını gösterir.
// - Telefonda bölümler alt alta: şişe yazıların üstünden geçmesin diye en yakın yuvaya bağlıdır; yuva
//   değişince küçülüp yenisinde büyür.
const CAM_Z = 12;
const FOV = 30;
const TAN = Math.tan(MathUtils.degToRad(FOV / 2));
const SEATS = ["seat-hero", "seat-card", "seat-notes"];
const ease = (t) => t * t * (3 - 2 * t);
const V = new Vector3();
// Kaide (şişe boyunun birimiyle): gövdeden biraz geniş; üst yüzü yuvanın altında.
const PLINTH_R = 0.72;
const PLINTH_H = 0.24;

function seatPose(id, vw, vh) {
  const el = document.getElementById(id);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  const k = (2 * CAM_Z * TAN) / vh;
  return {
    x: (r.left + r.width / 2 - vw / 2) * k,
    y: (vh / 2 - r.bottom) * k,
    s: (r.height * k) / HEIGHT,
    cy: r.top + r.height / 2,
  };
}

function marbleTexture() {
  // Fildişi mermer: yumuşak gri damarlar (bir kez çizilir).
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 256;
  const g = c.getContext("2d");
  g.fillStyle = "#f4f0ea";
  g.fillRect(0, 0, c.width, c.height);
  for (let i = 0; i < 26; i++) {
    g.strokeStyle = `rgba(120, 110, 100, ${0.05 + Math.random() * 0.12})`;
    g.lineWidth = 0.6 + Math.random() * 2.2;
    g.beginPath();
    let x = Math.random() * c.width;
    let y = Math.random() * c.height;
    g.moveTo(x, y);
    for (let k = 0; k < 9; k++) {
      x += 40 + Math.random() * 90;
      y += (Math.random() - 0.5) * 60;
      g.quadraticCurveTo(x - 30, y + (Math.random() - 0.5) * 40, x, y);
    }
    g.stroke();
  }
  const t = new CanvasTexture(c);
  t.anisotropy = 8;
  return t;
}

// Altın kenarlı mermer kaide, altında içeri çekik koyu ayak.
function Plinth({ seat }) {
  const ref = useRef();
  const size = useThree((s) => s.size);
  const mats = useMemo(() => {
    const map = marbleTexture();
    return {
      marble: new MeshPhysicalMaterial({ map, roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.06, envMapIntensity: 0.9 }),
      gold: new MeshStandardMaterial({ color: "#d9b46a", metalness: 1, roughness: 0.22, envMapIntensity: 1.6 }),
      dark: new MeshStandardMaterial({ color: "#16130f", metalness: 0.4, roughness: 0.4 }),
    };
  }, []);
  useFrame(() => {
    const p = seatPose(seat, size.width, size.height);
    const g = ref.current;
    if (!p || !g) return;
    g.visible = Math.abs(p.y) < 14;
    g.position.set(p.x, p.y, -0.2);
    g.scale.setScalar(p.s);
  });
  return (
    <group ref={ref}>
      <mesh position={[0, -PLINTH_H / 2, 0]} material={mats.marble}>
        <cylinderGeometry args={[PLINTH_R, PLINTH_R, PLINTH_H, 96]} />
      </mesh>
      <mesh position={[0, -0.004, 0]} rotation={[Math.PI / 2, 0, 0]} material={mats.gold}>
        <torusGeometry args={[PLINTH_R, 0.012, 12, 128]} />
      </mesh>
      <mesh position={[0, -PLINTH_H + 0.004, 0]} rotation={[Math.PI / 2, 0, 0]} material={mats.gold}>
        <torusGeometry args={[PLINTH_R, 0.012, 12, 128]} />
      </mesh>
      <mesh position={[0, -PLINTH_H - 0.07, 0]} material={mats.dark}>
        <cylinderGeometry args={[PLINTH_R * 0.86, PLINTH_R * 0.9, 0.14, 96]} />
      </mesh>
      <mesh position={[0, -PLINTH_H - 0.14, 0]} rotation={[Math.PI / 2, 0, 0]} material={mats.gold}>
        <torusGeometry args={[PLINTH_R * 0.9, 0.008, 10, 128]} />
      </mesh>
    </group>
  );
}

function Rig() {
  const group = useRef();
  const spin = useRef();
  const size = useThree((s) => s.size);
  const camera = useThree((s) => s.camera);
  const l = useRef({ pose: null, swapT: 1, shown: state.current });
  useFrame(({ clock }, delta) => {
    const dt = Math.min(delta, 0.1);
    const t = clock.getElapsedTime();
    const vw = size.width;
    const vh = size.height;
    const L = l.current;
    const poses = SEATS.map((id) => seatPose(id, vw, vh));
    if (poses.some((p) => !p)) return;
    const c = vh * 0.5;
    let a = 0;
    let b = 0;
    let f = 0;
    const narrow = vw < 860;
    if (narrow) {
      let k = 0;
      poses.forEach((p, i) => Math.abs(p.cy - c) < Math.abs(poses[k].cy - c) && (k = i));
      if (L.seat == null) L.seat = k;
      if (k !== L.seat && L.hopT == null) L.hopT = 0;
      if (L.hopT != null) {
        L.hopT = Math.min(1, L.hopT + dt / 0.55);
        if (L.hopT >= 0.5 && L.seat !== k) {
          L.seat = k;
          L.pose = null;
        }
        if (L.hopT >= 1) L.hopT = null;
      }
      a = b = L.seat;
    } else if (c <= poses[0].cy) a = b = 0;
    else if (c >= poses[2].cy) a = b = 2;
    else {
      a = c < poses[1].cy ? 0 : 1;
      b = a + 1;
      f = ease(MathUtils.clamp((c - poses[a].cy) / (poses[b].cy - poses[a].cy), 0, 1));
    }
    const px = state.pointer;
    // Yuvaların duruşu: vitrinde hafif salınan, kartta yarı profil, notalarda arkası dönük.
    const rot = [
      { x: 0.04 + px.y * 0.04, y: Math.sin(t * 0.45) * 0.35 + px.x * 0.25, z: 0 },
      { x: 0.03, y: -0.38 + Math.sin(t * 0.35) * 0.08 + px.x * 0.1, z: 0 },
      { x: 0.03, y: Math.PI - 0.3 + Math.sin(t * 0.35) * 0.1, z: 0 },
    ];
    const A = poses[a];
    const B = poses[b];
    const target = {
      x: MathUtils.lerp(A.x, B.x, f),
      y: MathUtils.lerp(A.y, B.y, f),
      s: MathUtils.lerp(A.s, B.s, f),
      rx: MathUtils.lerp(rot[a].x, rot[b].x, f),
      ry: MathUtils.lerp(rot[a].y, rot[b].y, f),
      rz: MathUtils.lerp(rot[a].z, rot[b].z, f),
    };
    // Vitrin: kesirli sıraya bağlı geçiş.
    const inHero = a === 0 && b === 0 ? 1 : a === 0 ? 1 - f : 0;
    state.heroOn = inHero;
    const fr = state.heroP - Math.round(state.heroP);
    const ph = Math.sin(Math.PI * Math.abs(fr));
    // Şişe kaideden yükselir, havada yarım tur döner (tam yan dönükken yeni koku), yeniden kaideye oturur.
    target.ry += fr * Math.PI * inHero;
    target.y += ph * HEIGHT * target.s * 0.17 * inHero;
    target.s *= 1 - 0.12 * ph * inHero;
    target.rz += fr * 0.18 * inHero;
    // Vitrinden karta inerken öne devrilir ve yana döner, sonra dikilir.
    const arc = Math.sin(Math.PI * f);
    target.rx += arc * (a === 0 ? 0.55 : 0.2);
    target.rz += arc * (a === 0 ? 0.35 : -0.15);
    target.x += arc * (a === 0 ? 0.6 : -0.4) * target.s;
    // Açılışta şişe yukarıdan kaideye iner.
    const intro = Math.min(1, t / 1.8);
    target.y += (1 - ease(intro)) * 4;
    const p = L.pose ?? (L.pose = { ...target });
    // Vitrindeki geçiş sıkı izlenir (kesirli sıra zaten yumuşak); diğer hareketler yumuşatılır.
    const damp = narrow ? 18 : inHero > 0.5 ? 12 : 7;
    for (const k of Object.keys(target)) p[k] = MathUtils.damp(p[k], target[k], damp, dt);
    // Koku değişimi: vitrinde kaydırmayla (yan dönükken) anında; başka yerden seçilince küçülüp büyür.
    if (state.current !== L.shown && state.instant) {
      L.shown = state.current;
      state.onShown?.(state.current);
    }
    if (state.current !== L.shown && L.swapT >= 1) L.swapT = 0;
    if (L.swapT < 1) {
      L.swapT = Math.min(1, L.swapT + dt / 0.7);
      if (L.swapT >= 0.5 && L.shown !== state.current) {
        L.shown = state.current;
        state.onShown?.(state.current);
      }
    }
    const hop = L.hopT != null ? 1 - Math.sin(Math.PI * L.hopT) : 1;
    const sw = (1 - Math.sin(Math.PI * L.swapT) * 0.92) * hop;
    const g = group.current;
    g.position.set(p.x, p.y, 0);
    g.rotation.set(p.rx, p.ry, p.rz);
    g.scale.setScalar(Math.max(0.001, p.s * sw));
    // "Şişeyi çevir": bir tam tur.
    const sp = state.spinAt != null ? Math.min(1, (performance.now() - state.spinAt) / 1300) : 1;
    const e = sp < 0.5 ? 4 * sp * sp * sp : 1 - Math.pow(-2 * sp + 2, 3) / 2;
    spin.current.rotation.y = e * Math.PI * 2;
    // Arka plan (Backdrop) için şişenin ekrandaki yeri ve vitrin kaidesinin zemini.
    V.set(p.x, p.y + HEIGHT * p.s * 0.45, 0).project(camera);
    state.focus = [(V.x + 1) / 2, (V.y + 1) / 2];
    V.set(poses[0].x, poses[0].y - (PLINTH_H + 0.21) * poses[0].s, 0).project(camera);
    state.floor = (V.y + 1) / 2;
  });
  return (
    <group ref={group}>
      <group ref={spin}>
        <Suspense fallback={null}>
          <Shown />
        </Suspense>
      </group>
    </group>
  );
}

// Gösterilen koku: Rig değiştirir (vitrinde anında, başka yerde şişe en küçükken).
function Shown() {
  const [i, setI] = useState(state.current);
  useEffect(() => {
    state.onShown = setI;
    return () => (state.onShown = null);
  }, []);
  return <Bottle product={PRODUCTS[i]} />;
}

function Preload() {
  // Bütün kokuların dokuları baştan yüklenir: koku değişince şişe beklemeden gelir.
  useTexture.preload(PRODUCTS.flatMap((p) => [frontUrl(p.handle), backUrl(p.handle)]));
  return null;
}

export default function Stage() {
  return (
    <div className="stage" aria-hidden="true">
      <Canvas
        dpr={[1, Math.min(2, window.devicePixelRatio || 1)]}
        camera={{ position: [0, 0, CAM_Z], fov: FOV }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      >
        <ambientLight intensity={0.35} />
        <directionalLight position={[-5, 7, 6]} intensity={1.4} />
        <directionalLight position={[6, 2, 3]} intensity={0.6} color="#dfe6ff" />
        <spotLight position={[0, 9, 4]} angle={0.5} penumbra={1} intensity={30} decay={1.6} />
        <Suspense fallback={null}>
          <Environment files={env} />
          <Plinth seat="seat-hero" />
          <Plinth seat="seat-card" />
          <Rig />
          <Preload />
        </Suspense>
      </Canvas>
    </div>
  );
}
