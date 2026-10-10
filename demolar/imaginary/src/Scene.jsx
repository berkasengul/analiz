import { Component, Suspense, useEffect, useState } from "react";
import { useStore } from "./store";
import { assetUrl } from "./shared";
import { Canvas } from "@react-three/fiber";
import { Environment, PerformanceMonitor, Preload } from "@react-three/drei";

import Background from "./Background";
import CameraRig from "./CameraRig";
import Carousel from "./Carousel";
import HeroCan from "./HeroCan";
import Particles from "./Particles";
import IceScene from "./IceScene";
import Numeral from "./Numeral";
import Pedestal from "./Pedestal";
import Spray from "./Spray";
import Boutique from "./Boutique";
import Garnish from "./Garnish";
import Cosmos from "./Cosmos";
import Lake from "./Lake";
import Studio from "./Studio";
import Silk from "./Silk";
import { FlameLight } from "./Candle";
import { flavors } from "./data";

const HAS_FLAME = flavors.some((f) => f.photo3d?.flame?.length);
import Effects, { FX } from "./Effects";
import { THEME } from "./theme";
import { scrollState } from "./scroll";
import { content } from "./data";

import envMap from "./assets/envMap/potsdamer_platz_0.256k.hdr?url";

function SceneCanvas({ onLost }) {
  // theme.cinema: masaüstünde piksel oranı en fazla 2, telefonda 1.5 (sinematik ürün ışığında kenar keskinliği).
  const maxDpr = THEME.cinema ? (window.matchMedia("(max-width: 900px)").matches ? 1.5 : 2) : 1.5;
  const [dpr, setDpr] = useState(Math.min(maxDpr, window.devicePixelRatio || 1));
  const [onScreen, setOnScreen] = useState(true);
  // Görüntü efektleri (Effects.jsx): yalnızca masaüstünde; kare hızı düşerse kapanır.
  const [fx, setFx] = useState(() => !!FX && !window.matchMedia("(max-width: 900px), (pointer: coarse)").matches);

  // Mağaza bölümü ekrandan çıkınca sahneyi çizmeyi bırak.
  useEffect(() => {
    let raf;
    const check = () => {
      setOnScreen(scrollState.sceneVisible);
      raf = requestAnimationFrame(check);
    };
    raf = requestAnimationFrame(check);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="canvas" aria-hidden="true" style={{ visibility: onScreen ? "visible" : "hidden" }}>
      <Canvas
        gl={{ powerPreference: "high-performance", antialias: true }}
        camera={{ position: [0, 0, 18], fov: 35 }}
        dpr={dpr}
        frameloop={onScreen ? "always" : "never"}
        onCreated={({ gl }) => {
          // Ekran kartı belleği yetmezse tarayıcı WebGL bağlamını kapatır (siyah ekran): yakala, sahneyi yeniden kur.
          gl.domElement.addEventListener("webglcontextlost", (e) => {
            e.preventDefault();
            onLost?.();
          });
        }}
      >
        <PerformanceMonitor
          onDecline={() => {
            setDpr(1);
            setFx(false);
          }}
          flipflops={1}
        />
        <ambientLight intensity={0.25} />
        <directionalLight position={[-6, 8, 6]} intensity={1.1} />
        <directionalLight position={[8, -2, 4]} intensity={0.55} color={content.fillLight ?? "#9fb4ff"} />
        <Suspense fallback={null}>
          <Environment files={envMap} />
          <CameraRig />
          <Background />
          {THEME.cosmos && <Cosmos />}
          <Particles />
          {THEME.numerals && !["solo", "orbit", "rise", "glide", "dolly", "lake", "silk"].includes(THEME.carousel) && <Numeral />}
          {/* "dolly": her ürünün kendi kaidesi var (Carousel → Plinth). */}
          {THEME.pedestal && THEME.carousel !== "dolly" && <Pedestal />}
          {THEME.carousel === "dolly" && <Boutique />}
          <IceScene />
          {HAS_FLAME && <FlameLight />}
          {THEME.carousel === "lake" && <Lake />}
          {["lake", "silk"].includes(THEME.carousel) && <Studio />}
          {THEME.carousel === "silk" && <Silk />}
          <Carousel />
          <Garnish />
          <HeroCan />
          {content.spray && <Spray />}
          {fx && <Effects />}
          {/* Tüm shader'ları baştan derle; ilk etkileşimde takılma olmasın. */}
          <Preload all />
        </Suspense>
      </Canvas>
    </div>
  );
}

// Sahne çizilemezse (WebGL yok ya da bir hata) boş siyah ekran yerine öndeki ürünün fotoğrafı, kendi renginde.
function StaticHero() {
  const active = useStore((s) => s.active ?? 0);
  const f = flavors[active] ?? flavors[0];
  const glow = f?.theme?.glow ?? "#222";
  return (
    <div className="canvas canvas--static" aria-hidden="true" style={{ background: `radial-gradient(ellipse at 50% 55%, ${glow} 0%, #050404 70%)` }}>
      {f?.file && <img src={assetUrl("cut/" + f.file)} alt="" style={{ position: "absolute", left: "50%", top: "54%", transform: "translate(-50%, -50%)", maxHeight: "62vh", maxWidth: "44vw", objectFit: "contain", filter: "drop-shadow(0 30px 40px rgba(0,0,0,.6))" }} />}
    </div>
  );
}

class GLBoundary extends Component {
  constructor(p) {
    super(p);
    this.state = { failed: false };
  }
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(e) {
    console.warn("3B sahne açılamadı, fotoğraf gösteriliyor:", e?.message);
  }
  render() {
    return this.state.failed ? <StaticHero /> : this.props.children;
  }
}

// WebGL bağlamı kaybolursa sahne en fazla iki kez baştan kurulur; yine olmazsa fotoğraflı görünüme geçilir.
export default function Scene() {
  const [run, setRun] = useState(0);
  const [lost, setLost] = useState(false);
  useEffect(() => {
    if (!lost) return;
    const t = setTimeout(() => {
      setRun((n) => n + 1);
      setLost(false);
    }, 600);
    return () => clearTimeout(t);
  }, [lost]);
  if (run > 2) return <StaticHero />;
  return (
    <GLBoundary key={run}>
      <SceneCanvas key={run} onLost={() => setLost(true)} />
    </GLBoundary>
  );
}
