import { Suspense, useEffect, useState } from "react";
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
import Effects, { FX } from "./Effects";
import { THEME } from "./theme";
import { scrollState } from "./scroll";
import { content } from "./data";

import envMap from "./assets/envMap/potsdamer_platz_0.256k.hdr?url";

export default function Scene() {
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
