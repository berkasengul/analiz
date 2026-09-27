import { Suspense, useEffect, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment } from "@react-three/drei";

import CanMesh, { createBottleParts, useCanBody } from "./CanMesh";
import { createCanMaterial, createCanUniforms, setCanFlavor } from "./canMaterial";
import { content, flavors } from "./data";

import envMap from "./assets/envMap/potsdamer_platz_0.256k.hdr?url";

// Kart görselleri için tek ürün çekimi: ?still=<ürün sırası> (data.js bu ürünü tek başına yükler). Saydam zeminde, sitedeki
// malzeme ve stüdyo ışığıyla 3B ürün; hafif yan açıyla derinliği görünür.
// demo-fabrikasi/araclar/kart-3b.py bu sayfanın ekran görüntüsünü alır.
function Product({ index }) {
  const canBody = useCanBody();
  const f = flavors[index];
  const uniforms = useMemo(() => createCanUniforms(f), [f]);
  const body = useMemo(() => createCanMaterial(canBody, uniforms), [canBody, uniforms]);
  const parts = useMemo(() => createBottleParts(f), [f]);
  useEffect(() => {
    setCanFlavor(uniforms, f);
    uniforms.u_rim.value.set(f.theme.accent ?? f.theme.glow).multiplyScalar(0.5);
    let n = 0;
    const tick = () => (++n > 40 ? (window.__still = f.handle ?? String(index)) : requestAnimationFrame(tick));
    requestAnimationFrame(tick);
  }, [f, index, uniforms]);
  const group = f.photo3d?.profile === "group";
  return (
    <group rotation={[0.03, group ? -0.18 : -0.42, 0]}>
      <CanMesh body={body} parts={parts} flavor={index} />
    </group>
  );
}

export default function Still() {
  const index = 0;
  return (
    <div style={{ position: "fixed", inset: 0 }}>
      <Canvas gl={{ alpha: true, antialias: true, preserveDrawingBuffer: true }} camera={{ position: [0, 0, 10.5], fov: 35 }} dpr={2}>
        <ambientLight intensity={0.3} />
        <directionalLight position={[-6, 8, 6]} intensity={1.2} />
        <directionalLight position={[8, -2, 4]} intensity={0.5} color={content.fillLight ?? "#9fb4ff"} />
        <spotLight position={[-2, 9, 8]} angle={0.5} penumbra={1} decay={0} intensity={2.2} color="#fff1dc" />
        <Suspense fallback={null}>
          <Environment files={envMap} />
          <Product index={index} />
        </Suspense>
      </Canvas>
    </div>
  );
}
