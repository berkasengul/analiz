import { useMemo } from "react";
import { useTexture } from "@react-three/drei";
import { BoxGeometry, MathUtils, MeshPhysicalMaterial, MeshStandardMaterial, CylinderGeometry, PlaneGeometry, RepeatWrapping, SRGBColorSpace } from "three";
import { RoundedBoxGeometry } from "three-stdlib";

import { content, flavors } from "./data";

// Etiket dokuları: content.json'daki her ürünün `file` adıyla eşleşir.
const FILES = import.meta.glob("./assets/labels/*.jpg", { eager: true, import: "default" });
const LABELS = flavors.map((f) => FILES[`./assets/labels/${f.file}`]);

// Parfüm şişesi, content.json → bottle ölçüleriyle koddan üretilir: kalın
// şeffaf cam, önde etiket, arkada koku piramidi etiketi, boyun ve kapak.
const B = content.bottle;
const W = B.glass.width; // cam genişliği
const H = B.glass.height;
const D = B.glass.depth;
const GY = -0.4; // cam merkezi
const LABEL = B.label.size;
const LABEL_Y = GY + B.label.y;

const glassGeo = new RoundedBoxGeometry(W, H, D, 4, B.glass.corner);
const liquidGeo = new RoundedBoxGeometry(W - 0.3, H - 0.42, D - 0.3, 3, Math.max(0.06, B.glass.corner - 0.15));
// Kalın taban: köşeleri yuvarlak şişelerde camın içinde kalacak kadar küçülür.
const baseGeo = new RoundedBoxGeometry(W - 0.08 - B.glass.corner * 0.9, 0.26, D - 0.08 - B.glass.corner * 0.9, 2, 0.05);
const neckGeo = new CylinderGeometry(B.neck.radius, B.neck.radius, B.neck.height, 48);
const capGeo =
  B.cap.shape === "box"
    ? new RoundedBoxGeometry(B.cap.radius * 2, B.cap.height, B.cap.radius * 2, 3, 0.04)
    : new CylinderGeometry(B.cap.radius, B.cap.radius, B.cap.height, B.cap.shape === "octagon" ? 8 : 96);

// Krem tüpü (content.json → bottle.tube, ürünlerde `form: "tube"`): kapağın
// üstünde duran, üst ucu yassı kıvrılmış tüp. Doku tüpü sarar: u 0–0.5 ön
// yüz, 0.5–1 arka yüz (etiket atlasıyla aynı düzen).
const T = B.tube;
function makeTube() {
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
const tube = T && {
  body: makeTube(),
  seal: new BoxGeometry(T.radius * 2 * 1.36, 0.3, 0.1),
  shoulder: new CylinderGeometry(T.radius, T.capRadius * 0.92, 0.2, 72),
  cap: new CylinderGeometry(T.capRadius, T.capRadius, T.capHeight, 72),
};

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
  // Kapak: "gold" / "silver" parlatılmış metal, "black" lake.
  const finish = B.cap.finish;
  const metal =
    finish === "black"
      ? new MeshStandardMaterial({ color: B.cap.color, metalness: 0.3, roughness: 0.18, envMapIntensity: 1.2 })
      : new MeshStandardMaterial({ color: B.cap.color, metalness: 1, roughness: 0.16, envMapIntensity: 2.2, emissive: finish === "gold" ? "#3a2808" : "#101214" });
  const cap = new MeshStandardMaterial({ color: B.neck.color, metalness: 0.9, roughness: 0.14, envMapIntensity: 1.6 });
  const glass = glassMaterial(0.08);
  const base = glassMaterial(0.3, "#e4ecee");
  const liquid = glassMaterial(0.06, "#f6f1e4");
  // Tüpün kıvrık ucu, omuzu ve kapağı.
  const tubeMat = new MeshPhysicalMaterial({ color: T?.color ?? "#f3eee6", roughness: 0.35, clearcoat: 0.6, clearcoatRoughness: 0.2, envMapIntensity: 0.9 });
  const tubeCap = new MeshPhysicalMaterial({ color: T?.capColor ?? "#1a1a1a", metalness: T?.capFinish === "gold" ? 1 : 0.1, roughness: T?.capFinish === "gold" ? 0.18 : 0.3, clearcoat: 1, envMapIntensity: 1.2 });
  const parts = { metal, cap, glass, base, liquid, tube: tubeMat, tubeCap };
  for (const m of Object.values(parts)) m.userData.base = { color: m.color.clone(), env: m.envMapIntensity };
  return parts;
}

export function dimBottleParts(parts, dim) {
  for (const key of Object.keys(parts)) {
    const m = parts[key];
    m.color.copy(m.userData.base.color).multiplyScalar(dim);
    m.envMapIntensity = m.userData.base.env * dim;
  }
}

function Tube({ body, parts }) {
  const bottom = -(T.capHeight + 0.2 + T.height) / 2;
  const yCap = bottom + T.capHeight / 2;
  const yShoulder = bottom + T.capHeight + 0.1;
  const yBody = bottom + T.capHeight + 0.2 + T.height / 2;
  return (
    <group rotation={[0, 0, B.tilt]} position={[0, -0.1, 0]} scale={T.scale}>
      <mesh geometry={tube.cap} material={parts.tubeCap} position={[0, yCap, 0]} />
      <mesh geometry={tube.shoulder} material={parts.tube} position={[0, yShoulder, 0]} />
      <mesh geometry={tube.body} material={body} position={[0, yBody, 0]} />
      <mesh geometry={tube.seal} material={parts.tube} position={[0, yBody + T.height / 2 + 0.1, 0]} />
    </group>
  );
}

export default function CanMesh({ body, parts, form }) {
  if (form === "tube" && tube) return <Tube body={body} parts={parts} />;
  return (
    <group rotation={[0, 0, B.tilt]} position={[0, -0.2, 0]} scale={B.scale}>
      {B.label.back && <mesh geometry={backGeo} material={body} position={[0, LABEL_Y, -D / 2 - 0.004]} rotation={[0, Math.PI, 0]} />}
      <mesh geometry={liquidGeo} material={parts.liquid} position={[0, GY + 0.08, 0]} renderOrder={1} />
      <mesh geometry={baseGeo} material={parts.base} position={[0, GY - H / 2 + 0.15, 0]} renderOrder={2} />
      <mesh geometry={glassGeo} material={parts.glass} position={[0, GY, 0]} renderOrder={3} />
      <mesh geometry={frontGeo} material={body} position={[0, LABEL_Y, D / 2 + 0.004]} />
      <mesh geometry={neckGeo} material={parts.cap} position={[0, GY + H / 2 + B.neck.height / 2, 0]} />
      <mesh geometry={capGeo} material={parts.metal} position={[0, GY + H / 2 + B.neck.height + B.cap.height / 2, 0]} rotation={[0, B.cap.shape === "octagon" ? Math.PI / 8 : 0, 0]} />
    </group>
  );
}

useTexture.preload(LABELS);
