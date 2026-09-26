import { useMemo } from "react";
import { useTexture } from "@react-three/drei";
import { MeshPhysicalMaterial, MeshStandardMaterial, CylinderGeometry, PlaneGeometry, RepeatWrapping, SRGBColorSpace } from "three";
import { RoundedBoxGeometry } from "three-stdlib";

import { flavors } from "./data";

import han from "./assets/labels/han.jpg";
import queenOfPalace from "./assets/labels/queen-of-palace.jpg";
import narcissus from "./assets/labels/narcissus.jpg";
import grandConqueror from "./assets/labels/grand-conqueror.jpg";
import deepSecret from "./assets/labels/deep-secret.jpg";
import neco from "./assets/labels/neco.jpg";
import forza from "./assets/labels/forza.jpg";
import submarine from "./assets/labels/submarine.jpg";

// data.js'teki koku sırasıyla aynı.
const LABELS = [han, queenOfPalace, narcissus, grandConqueror, deepSecret, neco, forza, submarine];

// 100 ml Hope Istanbul şişesi, ürün fotoğrafına göre koddan üretilir:
// kare, kalın şeffaf cam; önde altın-siyah geometrik etiket, arkada koku
// piramidi etiketi ve parlak altın silindir kapak.
const W = 2.3; // cam genişliği
const H = 2.3; // cam yüksekliği (y -1.55 … 0.75)
const D = 1.25; // cam derinliği
const GY = -0.4; // cam merkezi
const LABEL = 2.02;
const LABEL_Y = -0.42;

const glassGeo = new RoundedBoxGeometry(W, H, D, 4, 0.1);
const liquidGeo = new RoundedBoxGeometry(W - 0.3, H - 0.42, D - 0.3, 3, 0.06);
const baseGeo = new RoundedBoxGeometry(W - 0.08, 0.26, D - 0.08, 2, 0.05);
const neckGeo = new CylinderGeometry(0.36, 0.36, 0.18, 48);
const capGeo = new CylinderGeometry(0.5, 0.5, 1.02, 96);

// Etiket atlası: ön etiket dokunun sol yarısı, arka etiket sağ yarısı.
function labelGeo(u0) {
  const g = new PlaneGeometry(LABEL, LABEL);
  const uv = g.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setX(i, u0 + uv.getX(i) * 0.5);
  return g;
}
const frontGeo = labelGeo(0);
const backGeo = labelGeo(0.5);

export function useCanBody() {
  const maps = useTexture(LABELS);
  return useMemo(() => {
    maps.forEach((map, i) => {
      map.colorSpace = SRGBColorSpace;
      map.anisotropy = 8;
      // Arka plan, arka etiketteki silüeti örnekler.
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
  // Parlatılmış altın kapak.
  const metal = new MeshStandardMaterial({ color: "#ffdc8c", metalness: 1, roughness: 0.16, envMapIntensity: 2.2, emissive: "#3a2808" });
  const cap = new MeshStandardMaterial({ color: "#eef1f4", metalness: 0.9, roughness: 0.14, envMapIntensity: 1.6 });
  const glass = glassMaterial(0.08);
  const base = glassMaterial(0.3, "#e4ecee");
  const liquid = glassMaterial(0.06, "#f6f1e4");
  const parts = { metal, cap, glass, base, liquid };
  for (const m of [metal, cap, glass, base, liquid]) m.userData.base = { color: m.color.clone(), env: m.envMapIntensity };
  return parts;
}

export function dimBottleParts(parts, dim) {
  for (const key of ["metal", "cap", "glass", "base", "liquid"]) {
    const m = parts[key];
    m.color.copy(m.userData.base.color).multiplyScalar(dim);
    m.envMapIntensity = m.userData.base.env * dim;
  }
}

export default function CanMesh({ body, parts }) {
  return (
    <group rotation={[0, 0, -0.06]} position={[0, -0.2, 0]} scale={1.1}>
      <mesh geometry={backGeo} material={body} position={[0, LABEL_Y, -D / 2 - 0.004]} rotation={[0, Math.PI, 0]} />
      <mesh geometry={liquidGeo} material={parts.liquid} position={[0, GY + 0.08, 0]} renderOrder={1} />
      <mesh geometry={baseGeo} material={parts.base} position={[0, GY - H / 2 + 0.15, 0]} renderOrder={2} />
      <mesh geometry={glassGeo} material={parts.glass} position={[0, GY, 0]} renderOrder={3} />
      <mesh geometry={frontGeo} material={body} position={[0, LABEL_Y, D / 2 + 0.004]} />
      <mesh geometry={neckGeo} material={parts.cap} position={[0, GY + H / 2 + 0.09, 0]} />
      <mesh geometry={capGeo} material={parts.metal} position={[0, GY + H / 2 + 0.18 + 0.51, 0]} />
    </group>
  );
}

useTexture.preload(LABELS);
