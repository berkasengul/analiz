import { useMemo } from "react";
import { useTexture } from "@react-three/drei";
import {
  CircleGeometry,
  CylinderGeometry,
  LatheGeometry,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  RepeatWrapping,
  SRGBColorSpace,
  Vector2,
} from "three";

import { flavors } from "./data";

import han from "./assets/labels/han.jpg";
import queenOfPalace from "./assets/labels/queen-of-palace.jpg";
import narcissus from "./assets/labels/narcissus.jpg";
import grandConqueror from "./assets/labels/grand-conqueror.jpg";
import deepSecret from "./assets/labels/deep-secret.jpg";

// data.js'teki koku sırasıyla aynı.
const LABELS = [han, queenOfPalace, narcissus, grandConqueror, deepSecret];

// 100 ml parfüm şişesi, koddan üretilir: kalın cam gövde, içinde parfüm
// (etiket dokusu), altın bilezik ve sekizgen lake kapak. Eski kutuyla aynı
// sahne ölçüsünde durur, böylece tüm pozlar olduğu gibi çalışır.
const pts = (a) => a.map(([x, y]) => new Vector2(x, y));

const R = 1.0; // sıvı yarıçapı
const LIQ_BOTTOM = -1.85;
const LIQ_TOP = 1.15;

const glassGeo = new LatheGeometry(
  pts([
    [0, -2.2], [0.95, -2.2], [1.1, -2.13], [1.16, -1.97], [1.16, 1.2], [1.12, 1.4], [0.9, 1.56],
    [0.5, 1.66], [0.4, 1.7], [0.38, 1.82], [0, 1.82],
  ]),
  96
);
// Baskı: u = 0.5 kameraya bakar (ön yüz), u = 0.25 ve 0.75 yan paneller.
const liquidGeo = new CylinderGeometry(R, R, LIQ_TOP - LIQ_BOTTOM, 96, 1, true, Math.PI, Math.PI * 2);
const liquidTopGeo = new CircleGeometry(R, 64);
const baseGeo = new CylinderGeometry(1.1, 1.1, 0.3, 96);
const collarGeo = new CylinderGeometry(0.46, 0.46, 0.2, 48);
const capGeo = new CylinderGeometry(0.72, 0.72, 1.2, 8);
const bandGeo = new CylinderGeometry(0.745, 0.745, 0.07, 8);

export function useCanBody() {
  const maps = useTexture(LABELS);
  return useMemo(() => {
    maps.forEach((map, i) => {
      map.colorSpace = SRGBColorSpace;
      map.anisotropy = 8;
      // Arka plan dokunun arka yüzündeki silüeti örnekler; yatayda sarmalı.
      map.wrapS = RepeatWrapping;
      map.needsUpdate = true;
      flavors[i].texture = map;
    });
    return new MeshStandardMaterial({ map: maps[0] });
  }, [maps]);
}

// Cam: kenarlara doğru (Fresnel) daha opak ve parlak.
function glassMaterial(opacity, color = "#ffffff") {
  const m = new MeshPhysicalMaterial({
    color,
    roughness: 0.04,
    metalness: 0,
    clearcoat: 1,
    clearcoatRoughness: 0.03,
    envMapIntensity: 2.2,
    transparent: true,
    opacity,
    depthWrite: false,
  });
  m.onBeforeCompile = (shader) => {
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <opaque_fragment>",
      /* glsl */ `
        float fres = pow(1. - abs(dot(normal, normalize(vViewPosition))), 2.5);
        diffuseColor.a = mix(diffuseColor.a, 0.55, fres);
        outgoingLight += vec3(0.16) * fres;
        #include <opaque_fragment>
      `
    );
  };
  m.customProgramCacheKey = () => "hope-glass";
  return m;
}

// Her şişenin kendi malzemeleri olur; carousel'de tek tek karartılabilmesi için.
export function createBottleParts() {
  const metal = new MeshStandardMaterial({ color: "#e2bd72", metalness: 1, roughness: 0.2, envMapIntensity: 1.3 });
  const cap = new MeshPhysicalMaterial({
    color: "#15110d",
    metalness: 0.2,
    roughness: 0.22,
    clearcoat: 1,
    clearcoatRoughness: 0.05,
    envMapIntensity: 1.2,
    flatShading: true,
  });
  const glass = glassMaterial(0.07);
  const base = glassMaterial(0.28, "#dfe6e8");
  const top = new MeshStandardMaterial({ color: "#ffffff", transparent: true, opacity: 0.12, roughness: 0.1 });
  const parts = { metal, cap, glass, base, top };
  for (const m of [metal, cap, glass, base]) m.userData.base = { color: m.color.clone(), env: m.envMapIntensity };
  return parts;
}

export function dimBottleParts(parts, dim) {
  for (const key of ["metal", "cap", "glass", "base"]) {
    const m = parts[key];
    m.color.copy(m.userData.base.color).multiplyScalar(dim);
    m.envMapIntensity = m.userData.base.env * dim;
  }
}

export default function CanMesh({ body, parts }) {
  return (
    <group rotation={[0, 0, -0.13]} position={[0, -0.42, 0]} scale={0.86}>
      <mesh geometry={liquidGeo} material={body} position={[0, (LIQ_TOP + LIQ_BOTTOM) / 2, 0]} />
      <mesh geometry={liquidTopGeo} material={parts.top} position={[0, LIQ_TOP, 0]} rotation={[-Math.PI / 2, 0, 0]} />
      <mesh geometry={baseGeo} material={parts.base} position={[0, -2.03, 0]} renderOrder={2} />
      <mesh geometry={glassGeo} material={parts.glass} renderOrder={3} />
      <mesh geometry={collarGeo} material={parts.metal} position={[0, 1.88, 0]} />
      <mesh geometry={capGeo} material={parts.cap} position={[0, 2.58, 0]} rotation={[0, Math.PI / 8, 0]} />
      <mesh geometry={bandGeo} material={parts.metal} position={[0, 2.03, 0]} rotation={[0, Math.PI / 8, 0]} />
      <mesh geometry={bandGeo} material={parts.metal} position={[0, 3.15, 0]} rotation={[0, Math.PI / 8, 0]} />
    </group>
  );
}

useTexture.preload(LABELS);
