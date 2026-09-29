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
import { THEME } from "./theme";
import { scrollState } from "./scroll";
import { content } from "./data";

import envMap from "./assets/envMap/potsdamer_platz_0.256k.hdr?url";

export default function Scene() {
  const [dpr, setDpr] = useState(Math.min(1.5, window.devicePixelRatio || 1));
  const [onScreen, setOnScreen] = useState(true);

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
        <PerformanceMonitor onDecline={() => setDpr(1)} flipflops={1} />
        <ambientLight intensity={0.25} />
        <directionalLight position={[-6, 8, 6]} intensity={1.1} />
        <directionalLight position={[8, -2, 4]} intensity={0.55} color={content.fillLight ?? "#9fb4ff"} />
        <Suspense fallback={null}>
          <Environment files={envMap} />
          <CameraRig />
          <Background />
          <Particles />
          {THEME.numerals && !["solo", "orbit", "rise", "glide", "dolly"].includes(THEME.carousel) && <Numeral />}
          {/* "dolly": her ürünün kendi kaidesi var (Carousel → Plinth). */}
          {THEME.pedestal && THEME.carousel !== "dolly" && <Pedestal />}
          {THEME.carousel === "dolly" && <Boutique />}
          <IceScene />
          <Carousel />
          <HeroCan />
          {content.spray && <Spray />}
          {/* Tüm shader'ları baştan derle; ilk etkileşimde takılma olmasın. */}
          <Preload all />
        </Suspense>
      </Canvas>
    </div>
  );
}
