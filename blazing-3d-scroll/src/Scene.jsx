import { Suspense, useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment } from "@react-three/drei";

import Background from "./Background";
import Carousel from "./Carousel";
import DetailCan from "./DetailCan";
import Particles from "./Particles";
import Props from "./Props";

import envMap from "./assets/envMap/potsdamer_platz_0.256k.hdr?url";

export default function Scene() {
  const ref = useRef();
  const [onScreen, setOnScreen] = useState(true);

  // Sahne ekran dışındayken çizimi durdur.
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => setOnScreen(e.isIntersecting));
    io.observe(ref.current);
    return () => io.disconnect();
  }, []);

  return (
    <div className="canvas" ref={ref}>
      <Canvas
        camera={{ position: [0, 0, 18], fov: 35 }}
        dpr={[1, 2]}
        frameloop={onScreen ? "always" : "never"}
      >
        <ambientLight intensity={0.25} />
        <directionalLight position={[-6, 8, 6]} intensity={1.6} />
        <directionalLight position={[8, -2, 4]} intensity={0.8} color="#9fb4ff" />
        <Suspense fallback={null}>
          <Environment files={envMap} />
          <Background />
          <Particles />
          <Props />
          <Carousel />
          <DetailCan />
        </Suspense>
      </Canvas>
    </div>
  );
}
