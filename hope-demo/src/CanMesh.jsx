import { useMemo } from "react";
import { useTexture } from "@react-three/drei";
import {
  BoxGeometry,
  CylinderGeometry,
  MathUtils,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  RepeatWrapping,
  SRGBColorSpace,
  SphereGeometry,
} from "three";
import { RoundedBoxGeometry } from "three-stdlib";

import { content, flavors } from "./data";

// Etiket dokuları: content.json'daki her ürünün `file` adıyla eşleşir.
const FILES = import.meta.glob("./assets/labels/*.jpg", { eager: true, import: "default" });
const LABELS = flavors.map((f) => FILES[`./assets/labels/${f.file}`]);

// Ürün ambalajı content.json → bottle ölçüleriyle koddan üretilir. Her ürün
// `form` ("tube" krem tüpü, boş = şişe) ve kendi `bottle` / `tube` ayarlarıyla
// markanın genel ölçülerini ezebilir (renk, boy, kapak).
const B = content.bottle;
const GY = -0.4; // şişe camının merkezi

const merge = (a = {}, b = {}) => {
  const out = { ...a };
  for (const [k, v] of Object.entries(b)) out[k] = v && typeof v === "object" && !Array.isArray(v) ? { ...a[k], ...v } : v;
  return out;
};

export const shapeOf = (f) => (f.form === "tube" && B.tube ? { kind: "tube", ...merge(B.tube, f.tube) } : { kind: "bottle", ...merge(B, f.bottle) });

// Etiket atlası: ön etiket dokunun sol yarısı, arka etiket sağ yarısı.
function labelGeo(w, h, u0) {
  const g = new PlaneGeometry(w, h);
  const uv = g.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setX(i, u0 + uv.getX(i) * 0.5);
  return g;
}

// Krem tüpü: kapağın üstünde duran, üst ucu yassı kıvrılmış tüp. Doku tüpü
// sarar: u 0–0.5 ön yüz, 0.5–1 arka yüz (etiket atlasıyla aynı düzen).
function tubeBody(T) {
  const g = new CylinderGeometry(T.radius, T.radius, T.height, 72, 28, true, -Math.PI / 2, Math.PI * 2);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const k = MathUtils.smootherstep((p.getY(i) + T.height / 2) / T.height, 0.42, 1);
    p.setX(i, p.getX(i) * (1 + 0.34 * k));
    p.setZ(i, p.getZ(i) * (1 - 0.94 * k));
  }
  g.computeVertexNormals();
  return g;
}

const cache = new Map();
function geometry(S) {
  const key = JSON.stringify(S);
  if (cache.has(key)) return cache.get(key);
  let g;
  if (S.kind === "tube") {
    const round = S.capShape === "round";
    g = {
      body: tubeBody(S),
      seal: new BoxGeometry(S.radius * 2 * 1.36, 0.3, 0.1),
      shoulder: new CylinderGeometry(S.radius, S.capRadius * 0.92, 0.2, 72),
      // "flip": kısa düz kapak ve beyaz boğaz; "round": tüple aynı renkte kapsül kapak.
      cap: new CylinderGeometry(S.capRadius, S.capRadius, S.capHeight, 72),
      capEnd: round ? new SphereGeometry(S.capRadius, 48, 24, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2) : null,
      collar: round ? null : new CylinderGeometry(S.capRadius * 0.86, S.capRadius * 0.86, 0.14, 48),
    };
  } else {
    const { width: W, height: H, depth: D, corner } = S.glass;
    const lw = S.label.width ?? S.label.size;
    const lh = S.label.height ?? S.label.size;
    g = {
      glass: new RoundedBoxGeometry(W, H, D, 4, corner),
      liquid: new RoundedBoxGeometry(W - 0.3, H - 0.42, D - 0.3, 3, Math.max(0.06, corner - 0.15)),
      // Kalın taban: köşeleri yuvarlak şişelerde camın içinde kalacak kadar küçülür.
      base: new RoundedBoxGeometry(W - 0.08 - corner * 0.9, 0.26, D - 0.08 - corner * 0.9, 2, 0.05),
      neck: new CylinderGeometry(S.neck.radius, S.neck.radius, S.neck.height, 48),
      cap:
        S.cap.shape === "box"
          ? new RoundedBoxGeometry(S.cap.radius * 2, S.cap.height, S.cap.radius * 2, 3, 0.04)
          : new CylinderGeometry(S.cap.radius, S.cap.radius, S.cap.height, S.cap.shape === "octagon" ? 8 : 96),
      front: labelGeo(lw, lh, 0),
      back: labelGeo(lw, lh, 0.5),
    };
  }
  cache.set(key, g);
  return g;
}

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
        diffuseColor.a = mix(diffuseColor.a, max(diffuseColor.a, 0.55), fres);
        outgoingLight += vec3(0.16) * fres;
        #include <opaque_fragment>
      `
    );
  };
  m.customProgramCacheKey = () => "hope-glass";
  return m;
}

function capMaterial(color, finish) {
  // "gold" / "silver" parlatılmış metal, "black" lake, "matte" yumuşak plastik.
  if (finish === "gold" || finish === "silver")
    return new MeshStandardMaterial({ color, metalness: 1, roughness: 0.16, envMapIntensity: 2.2, emissive: finish === "gold" ? "#3a2808" : "#101214" });
  if (finish === "matte") return new MeshStandardMaterial({ color, metalness: 0, roughness: 0.62, envMapIntensity: 0.6 });
  return new MeshPhysicalMaterial({ color, metalness: 0.1, roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.1, envMapIntensity: 1.2 });
}

// Her ürünün kendi malzemeleri olur; carousel'de tek tek karartılabilmesi için.
export function createBottleParts(f = {}) {
  const S = shapeOf(f);
  const parts = {};
  if (S.kind === "tube") {
    const matte = S.finish === "matte";
    parts.tube = new MeshPhysicalMaterial({
      color: S.color,
      roughness: matte ? 0.62 : 0.3,
      clearcoat: matte ? 0 : 0.7,
      clearcoatRoughness: 0.2,
      sheen: S.finish === "pearl" ? 1 : 0,
      sheenColor: "#ffffff",
      envMapIntensity: matte ? 0.5 : 0.9,
    });
    parts.metal = capMaterial(S.capColor, S.capFinish);
    parts.collar = new MeshStandardMaterial({ color: "#f4f2ee", roughness: 0.4 });
  } else {
    parts.metal = capMaterial(S.cap.color, S.cap.finish);
    parts.cap = new MeshStandardMaterial({ color: S.neck.color, metalness: 0.9, roughness: 0.14, envMapIntensity: 1.6 });
    // Renkli (ör. kehribar) plastik ya da cam: `tint` ile opak, yoksa şeffaf cam.
    parts.glass = S.tint ? glassMaterial(S.tintOpacity ?? 0.85, S.tint) : glassMaterial(0.08);
    parts.base = glassMaterial(S.tint ? 0 : 0.3, "#e4ecee");
    parts.liquid = glassMaterial(S.tint ? 0 : 0.06, "#f6f1e4");
  }
  for (const m of Object.values(parts)) m.userData.base = { color: m.color.clone(), env: m.envMapIntensity };
  return parts;
}

export function dimBottleParts(parts, dim) {
  for (const m of Object.values(parts)) {
    m.color.copy(m.userData.base.color).multiplyScalar(dim);
    m.envMapIntensity = m.userData.base.env * dim;
  }
}

function Tube({ body, parts, S }) {
  const g = geometry(S);
  const bottom = -(S.capHeight + 0.2 + S.height) / 2;
  const yCap = bottom + S.capHeight / 2;
  const yShoulder = bottom + S.capHeight + 0.1;
  const yBody = bottom + S.capHeight + 0.2 + S.height / 2;
  const round = S.capShape === "round";
  return (
    <group rotation={[0, 0, B.tilt]} position={[0, -0.1, 0]} scale={S.scale}>
      <mesh geometry={g.cap} material={round ? parts.tube : parts.metal} position={[0, yCap, 0]} />
      {g.capEnd && <mesh geometry={g.capEnd} material={parts.tube} position={[0, bottom, 0]} scale={[1, 0.55, 1]} />}
      {g.collar && <mesh geometry={g.collar} material={parts.collar} position={[0, bottom + S.capHeight + 0.05, 0]} />}
      <mesh geometry={g.shoulder} material={parts.tube} position={[0, yShoulder, 0]} />
      <mesh geometry={g.body} material={body} position={[0, yBody, 0]} />
      <mesh geometry={g.seal} material={parts.tube} position={[0, yBody + S.height / 2 + 0.1, 0]} />
    </group>
  );
}

function Bottle({ body, parts, S }) {
  const g = geometry(S);
  const { height: H, depth: D } = S.glass;
  const labelY = GY + S.label.y;
  return (
    <group rotation={[0, 0, S.tilt]} position={[0, -0.2, 0]} scale={S.scale}>
      {S.label.back && <mesh geometry={g.back} material={body} position={[0, labelY, -D / 2 - 0.004]} rotation={[0, Math.PI, 0]} />}
      <mesh geometry={g.liquid} material={parts.liquid} position={[0, GY + 0.08, 0]} renderOrder={1} />
      <mesh geometry={g.base} material={parts.base} position={[0, GY - H / 2 + 0.15, 0]} renderOrder={2} />
      <mesh geometry={g.glass} material={parts.glass} position={[0, GY, 0]} renderOrder={3} />
      <mesh geometry={g.front} material={body} position={[0, labelY, D / 2 + 0.004]} />
      <mesh geometry={g.neck} material={parts.cap} position={[0, GY + H / 2 + S.neck.height / 2, 0]} />
      <mesh
        geometry={g.cap}
        material={parts.metal}
        position={[0, GY + H / 2 + S.neck.height + S.cap.height / 2, 0]}
        rotation={[0, S.cap.shape === "octagon" ? Math.PI / 8 : 0, 0]}
      />
    </group>
  );
}

export default function CanMesh({ body, parts, flavor = 0 }) {
  const S = shapeOf(flavors[flavor]);
  return S.kind === "tube" ? <Tube body={body} parts={parts} S={S} /> : <Bottle body={body} parts={parts} S={S} />;
}

useTexture.preload(LABELS);
