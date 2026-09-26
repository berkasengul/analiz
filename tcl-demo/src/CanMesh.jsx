import { useMemo } from "react";
import { useTexture } from "@react-three/drei";
import {
  BoxGeometry,
  CylinderGeometry,
  LatheGeometry,
  MeshStandardMaterial,
  SRGBColorSpace,
  TorusGeometry,
  Vector2,
} from "three";

import { flavors } from "./data";

import boldIstanbul from "./assets/labels/bold-istanbul.jpg";
import silkyMardin from "./assets/labels/silky-mardin.jpg";
import pistachioZeugma from "./assets/labels/pistachio-zeugma.jpg";
import mintyCappadocia from "./assets/labels/minty-cappadocia.jpg";
import pineyAegean from "./assets/labels/piney-aegean.jpg";

// data.js'teki tat sırasıyla aynı.
const LABELS = [boldIstanbul, silkyMardin, pistachioZeugma, mintyCappadocia, pineyAegean];

// 250 ml slim kutu, koddan üretilir. Ölçüler sahnedeki eski kutu modeliyle
// aynı (yükseklik ~4,6), böylece tüm pozlar olduğu gibi çalışır.
const pts = (a) => a.map(([x, y]) => new Vector2(x, y));

const R = 0.9;
const LABEL_BOTTOM = -1.98;
const LABEL_TOP = 1.95;

const shellGeo = new LatheGeometry(
  pts([
    [0, -2.17], [0.5, -2.2], [0.7, -2.3], [0.78, -2.3], [0.86, -2.2], [R, -2.02], [R, 1.96],
    [0.87, 2.08], [0.8, 2.2], [0.79, 2.25], [0.82, 2.29], [0.8, 2.33], [0.76, 2.3], [0.74, 2.23], [0, 2.23],
  ]),
  72
);
// Baskı: u = 0.5 kameraya bakar (ön yüz), u = 0.25 arka, u = 0.75 yan.
const labelGeo = new CylinderGeometry(R + 0.004, R + 0.004, LABEL_TOP - LABEL_BOTTOM, 96, 1, true, Math.PI, Math.PI * 2);
const tabGeo = new BoxGeometry(0.34, 0.02, 0.2);
const tabRingGeo = new TorusGeometry(0.08, 0.022, 6, 20);

export function useCanBody() {
  const maps = useTexture(LABELS);
  return useMemo(() => {
    maps.forEach((map, i) => {
      map.colorSpace = SRGBColorSpace;
      map.anisotropy = 8;
      map.needsUpdate = true;
      flavors[i].texture = map;
    });
    return new MeshStandardMaterial({ map: maps[0] });
  }, [maps]);
}

// Her kutunun kendi alüminyumu olur; carousel'de tek tek karartılabilmesi için.
export function createBottleParts() {
  const metal = new MeshStandardMaterial({ color: "#d9dde2", metalness: 1, roughness: 0.22, envMapIntensity: 1.3 });
  metal.userData.base = metal.color.clone();
  return { metal };
}

export function dimBottleParts(parts, dim) {
  parts.metal.color.copy(parts.metal.userData.base).multiplyScalar(dim);
  parts.metal.envMapIntensity = 1.3 * dim;
}

export default function CanMesh({ body, parts }) {
  return (
    <group rotation={[0, 0, -0.13]} position={[0, 0.1, 0]}>
      <mesh geometry={shellGeo} material={parts.metal} />
      <mesh geometry={labelGeo} material={body} position={[0, (LABEL_TOP + LABEL_BOTTOM) / 2, 0]} />
      <mesh geometry={tabGeo} material={parts.metal} position={[0, 2.25, 0.18]} />
      <mesh geometry={tabRingGeo} material={parts.metal} position={[0, 2.255, 0.02]} rotation={[Math.PI / 2, 0, 0]} />
    </group>
  );
}

useTexture.preload(LABELS);
