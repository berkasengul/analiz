import { useGLTF } from "@react-three/drei";
import model from "./assets/models/energy-can.glb?url";

export const canModel = model;

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
