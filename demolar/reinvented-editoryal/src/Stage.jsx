import { Suspense, useEffect, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, useTexture } from "@react-three/drei";
import { MathUtils } from "three";

import Bottle, { HEIGHT, backUrl, frontUrl } from "./Bottle";
import { PRODUCTS, state } from "./state";
import env from "./assets/env.hdr?url";

// Sahne sayfanın üstünde sabit, saydam bir katman. Şişe sayfadaki "yuvaları" (#seat-hero, #seat-card,
// #seat-notes) izler: her karede yuvaların ekrandaki yeri 3B dünyaya taşınır, şişe ekranın ortasına en yakın
// iki yuva arasında kaydırmaya göre süzülür. Yuvalar sayfayla kaydığı için şişe bölümle birlikte iner,
// başlıktan karta geçerken öne eğilip döner (videodaki gibi), notalarda arkasını gösterir.
const CAM_Z = 12;
const FOV = 30;
const TAN = Math.tan(MathUtils.degToRad(FOV / 2));
const SEATS = ["seat-hero", "seat-card", "seat-notes"];
const ease = (t) => t * t * (3 - 2 * t);

function seatPose(id, vw, vh) {
  const el = document.getElementById(id);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  const hW = 2 * CAM_Z * TAN; // z=0 düzleminde görünen yükseklik
  const k = hW / vh;
  return {
    x: (r.left + r.width / 2 - vw / 2) * k,
    y: (vh / 2 - r.bottom) * k,
    s: (r.height * k) / HEIGHT,
    cy: r.top + r.height / 2,
  };
}

function Rig() {
  const group = useRef();
  const spin = useRef();
  const size = useThree((s) => s.size);
  const l = useRef({ pose: null, swapT: 1, shown: state.current, spinFrom: 0 });
  useFrame(({ clock }, delta) => {
    const dt = Math.min(delta, 0.1);
    const t = clock.getElapsedTime();
    const vw = size.width;
    const vh = size.height;
    const poses = SEATS.map((id) => seatPose(id, vw, vh));
    if (poses.some((p) => !p)) return;
    // Hangi iki yuvanın arasındayız: ekranın ortası yuvaların ortalarına göre.
    const c = vh * 0.5;
    let a = 0;
    let b = 0;
    let f = 0;
    const L = l.current;
    // Telefonda bölümler alt alta: şişe yazıların üstünden geçmesin diye en yakın yuvaya bağlıdır; yuva
    // değişince küçülüp yenisinde büyür (hop).
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
    // Her yuvanın duruşu: başlıkta hafif eğik ve salınan, kartta yarı profil, notalarda arkası dönük.
    const rot = [
      { x: 0.1 + px.y * 0.06, y: Math.sin(t * 0.45) * 0.55 + px.x * 0.25, z: -0.14 },
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
    // Geçişte şişe öne devrilir ve yana döner (başlıktan karta inerken), sonra dikilir.
    const arc = Math.sin(Math.PI * f);
    target.rx += arc * (a === 0 ? 0.55 : 0.2);
    target.rz += arc * (a === 0 ? 0.35 : -0.15);
    target.x += arc * (a === 0 ? 0.6 : -0.4) * target.s;
    // Yuvanın (başlıkta dev, ekranın tamamı) sabit kalan pozu: sayfa ilk açılınca yukarıdan iner.
    const intro = Math.min(1, t / 1.8);
    target.y += (1 - ease(intro)) * 4;
    const p = l.current.pose ?? (l.current.pose = { ...target });
    for (const k of Object.keys(target)) p[k] = MathUtils.damp(p[k], target[k], narrow ? 18 : 7, dt);
    // Koku değişince şişe küçülüp yenisiyle büyür.
    if (state.current !== l.current.shown && l.current.swapT >= 1) l.current.swapT = 0;
    if (l.current.swapT < 1) {
      l.current.swapT = Math.min(1, l.current.swapT + dt / 0.7);
      if (l.current.swapT >= 0.5 && l.current.shown !== state.current) {
        l.current.shown = state.current;
        state.onShown?.(state.current);
      }
    }
    const hop = L.hopT != null ? 1 - Math.sin(Math.PI * L.hopT) : 1;
    const sw = (1 - Math.sin(Math.PI * l.current.swapT) * 0.92) * hop;
    const g = group.current;
    g.position.set(p.x, p.y, 0);
    g.rotation.set(p.rx, p.ry, p.rz);
    g.scale.setScalar(Math.max(0.001, p.s * sw));
    // "Şişeyi çevir": bir tam tur.
    const sp = state.spinAt != null ? Math.min(1, (performance.now() - state.spinAt) / 1300) : 1;
    const e = sp < 0.5 ? 4 * sp * sp * sp : 1 - Math.pow(-2 * sp + 2, 3) / 2;
    spin.current.rotation.y = e * Math.PI * 2;
    state.pose = p;
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

// Gösterilen koku: Rig yarı geçişte (şişe en küçükken) değiştirir.
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
          <Rig />
          <Preload />
        </Suspense>
      </Canvas>
    </div>
  );
}
