import { useMemo } from "react";
import { useTexture } from "@react-three/drei";
import {
  Color,
  CylinderGeometry,
  LatheGeometry,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  SRGBColorSpace,
  TorusGeometry,
  Vector2,
} from "three";

import label from "./assets/labels/tcl-label.png";

// Şişe, kutu modeliyle aynı ölçülerde koddan üretilir (yükseklik ~4,6,
// yarıçap ~1), böylece sahnedeki tüm pozlar olduğu gibi çalışır.
const pts = (a) => a.map(([x, y]) => new Vector2(x, y));

const glassGeo = new LatheGeometry(
  pts([
    [0, -2.3], [0.8, -2.3], [0.92, -2.24], [0.965, -2.08], [0.965, 0.95], [0.93, 1.18],
    [0.78, 1.42], [0.56, 1.66], [0.44, 1.86], [0.42, 2.02], [0.45, 2.08], [0.45, 2.16],
  ]),
  72
);
const liquidGeo = new LatheGeometry(
  pts([[0, -2.24], [0.8, -2.24], [0.9, -2.17], [0.935, -2.02], [0.935, 1.0], [0.9, 1.16], [0.8, 1.3], [0, 1.3]]),
  48
);
// Etiket: u = 0.5 kameraya bakar, u = 0.25 arka etiket, u = 0.75 fal paneli.
const labelGeo = new CylinderGeometry(0.978, 0.978, 2.55, 96, 1, true, Math.PI, Math.PI * 2);
const capGeo = new CylinderGeometry(0.47, 0.47, 0.5, 48);
const capRimGeo = new TorusGeometry(0.47, 0.03, 8, 48);

export function useCanBody() {
  const map = useTexture(label);
  return useMemo(() => {
    map.colorSpace = SRGBColorSpace;
    map.anisotropy = 8;
    map.needsUpdate = true;
    return new MeshStandardMaterial({ map });
  }, [map]);
}

// Her şişenin kendi cam, kahve ve kapak malzemesi olur; carousel'de tek
// tek karartılabilmeleri için.
export function createBottleParts(flavor) {
  const cap = new MeshStandardMaterial({ color: "#b8925a", metalness: 1, roughness: 0.28, envMapIntensity: 1.3 });
  const liquid = new MeshStandardMaterial({ color: flavor.liquid, metalness: 0.1, roughness: 0.15, envMapIntensity: 0.9 });
  const glass = new MeshPhysicalMaterial({
    color: "#ffffff",
    metalness: 0,
    roughness: 0.05,
    clearcoat: 1,
    clearcoatRoughness: 0.04,
    transparent: true,
    opacity: 0.2,
    envMapIntensity: 2.2,
    depthWrite: false,
  });
  cap.userData.base = new Color("#b8925a");
  liquid.userData.base = new Color(flavor.liquid);
  return { cap, liquid, glass };
}

export function dimBottleParts(parts, dim) {
  parts.cap.color.copy(parts.cap.userData.base).multiplyScalar(dim);
  parts.cap.envMapIntensity = 1.3 * dim;
  parts.liquid.color.copy(parts.liquid.userData.base).multiplyScalar(dim);
  parts.glass.opacity = 0.2 * dim;
  parts.glass.envMapIntensity = 2.2 * dim;
}

export default function CanMesh({ body, parts }) {
  return (
    <group rotation={[0, 0, -0.13]} position={[0, 0.13, 0]}>
      <mesh geometry={liquidGeo} material={parts.liquid} />
      <mesh geometry={labelGeo} material={body} position={[0, -0.5, 0]} />
      <mesh geometry={capGeo} material={parts.cap} position={[0, 2.4, 0]} />
      <mesh geometry={capRimGeo} material={parts.cap} position={[0, 2.16, 0]} rotation={[Math.PI / 2, 0, 0]} />
      <mesh geometry={glassGeo} material={parts.glass} renderOrder={2} />
    </group>
  );
}

useTexture.preload(label);
