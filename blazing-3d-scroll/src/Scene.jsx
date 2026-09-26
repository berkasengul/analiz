import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment } from "@react-three/drei";

import Model from "./Model";
import Background from "./Background";

import envMap from "./assets/envMap/potsdamer_platz_0.256k.hdr?url";

const Scene = () => (
  <div className="canvas" aria-hidden="true">
    <Canvas camera={{ position: [0, 0, 16], fov: 45 }} dpr={[1, 2]}>
      <ambientLight intensity={0.5} />
      <Suspense fallback={null}>
        <Environment files={envMap} />
        <Background />
        <Model />
      </Suspense>
    </Canvas>
  </div>
);

export default Scene;
