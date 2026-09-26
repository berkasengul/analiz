import { useMemo } from "react";
import { useGLTF, useTexture } from "@react-three/drei";
import { SRGBColorSpace } from "three";

import model from "./assets/models/energy-can.glb?url";
import label from "./assets/labels/obsesso-body.png";

export const canModel = model;

// Modelin gövde malzemesi, etiket görseli Obsesso konsept etiketiyle
// değiştirilmiş olarak. Resmi tasarım gelince yalnızca PNG değişir.
export function useCanBody() {
  const { materials } = useGLTF(model);
  const map = useTexture(label);
  return useMemo(() => {
    map.flipY = false;
    map.colorSpace = SRGBColorSpace;
    map.anisotropy = 8;
    map.needsUpdate = true;
    const body = materials.Body.clone();
    body.map = map;
    return body;
  }, [materials, map]);
}

// Modelin kendi eksenleri: dik duran, ön yüzü kameraya bakan kutu.
export default function CanMesh({ body, aluminium }) {
  const { nodes } = useGLTF(model);
  return (
    <group rotation={[-Math.PI / 2, 1.7, Math.PI / 2]}>
      <group rotation={[-Math.PI / 2, 0, 0]}>
        <mesh geometry={nodes.LowRes_Can_Alluminium_0.geometry} material={aluminium} />
        <mesh geometry={nodes.LowRes_Can_Body_0.geometry} material={body} />
      </group>
    </group>
  );
}

useGLTF.preload(model);
useTexture.preload(label);
