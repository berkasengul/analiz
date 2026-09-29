import { Suspense, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { Environment, MeshReflectorMaterial } from "@react-three/drei";
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  Color,
  CurvePath,
  CylinderGeometry,
  MeshBasicMaterial,
  Object3D,
  TextureLoader,
  DoubleSide,
  LineCurve3,
  EllipseCurve,
  SRGBColorSpace,
  Shape,
  Vector3,
} from "three";

import CanMesh, { createBottleParts, useCanBody } from "./CanMesh";
import { createCanMaterial, createCanUniforms, setCanFlavor } from "./canMaterial";
import { content, flavors } from "./data";
import { THEME } from "./theme";

import envMap from "./assets/envMap/potsdamer_platz_0.256k.hdr?url";

// Kart görselleri için tek ürün çekimi (data.js ?still=<n> ile yalnızca o ürünü yükler).
//   ?still=<n>          saydam zeminde ürün (arama, sepet küçük resimleri)
//   ?still=<n>&stage=1  sinematik sergi: altın çerçeveli kemerli niş (dolly: ışık paneli), mermer kaide, yansıtıcı
//                       siyah zemin, tepeden spot ışığı ve ışık konisi; ürün kaidenin üstünde.
// demo-fabrikasi/araclar/kart-3b.py bu sayfanın ekran görüntüsünü alır.
const STAGE = new URLSearchParams(location.search).has("stage");
const PED_TOP = -0.75; // kaidenin üst yüzü
const PED = { w: 3.1, h: 1.2, d: 2.1 };

function Product() {
  const canBody = useCanBody();
  const f = flavors[0];
  const uniforms = useMemo(() => createCanUniforms(f), [f]);
  const body = useMemo(() => createCanMaterial(canBody, uniforms), [canBody, uniforms]);
  const parts = useMemo(() => createBottleParts(f), [f]);
  const group = useRef();
  const group3 = f.photo3d?.profile === "group";
  useEffect(() => {
    setCanFlavor(uniforms, f);
    uniforms.u_rim.value.set("#fff1dc").multiplyScalar(0.45);
    body.envMapIntensity = body.userData.finish.envMapIntensity * 1.35;
    let n = 0;
    const tick = () => (++n > 50 ? (window.__still = f.handle ?? "0") : requestAnimationFrame(tick));
    requestAnimationFrame(tick);
  }, [f, uniforms, body]);
  // Sergide ürün kaidenin üstüne oturur: gövdenin gerçek alt kenarı ölçülür (fotoğraf kartı
  // düzlemleri ve eksendeki boş satırlar sayılmaz).
  useLayoutEffect(() => {
    if (!STAGE) return;
    const g = group.current;
    const id = requestAnimationFrame(() => {
      g.position.y = 0;
      g.updateWorldMatrix(true, true);
      const meshes = [];
      g.traverse((o) => o.isMesh && o.geometry.type !== "PlaneGeometry" && meshes.push(o));
      const bodies = meshes.filter((o) => o.geometry.type === "ExtrudeGeometry");
      let low = Infinity;
      const v = new Vector3();
      for (const o of bodies.length ? bodies : meshes) {
        const P = o.geometry.attributes.position;
        for (let k = 0; k < P.count; k += 3) {
          if (P.getX(k) ** 2 + P.getZ(k) ** 2 < 1e-6) continue;
          low = Math.min(low, v.fromBufferAttribute(P, k).applyMatrix4(o.matrixWorld).y);
        }
      }
      if (low < Infinity) g.position.y = PED_TOP - low + 0.005;
    });
    return () => cancelAnimationFrame(id);
  }, []);
  const scale = STAGE ? (group3 ? 0.95 : 0.92) : 1;
  return (
    <group ref={group}>
      {/* Kart açısı: content.theme.cardAngle (fotoğrafı 3/4 açıdan çekilmiş markada yan yüz fotoğraftakiyle aynı tarafta). */}
      <group rotation={[0.03, group3 ? -0.18 : content.theme?.cardAngle ?? -0.42, 0]} scale={scale}>
        <CanMesh body={body} parts={parts} flavor={0} />
      </group>
    </group>
  );
}

// Siyah mermer: koyu zemin üzerinde gri ve altın damarlar (tuvalde çizilir).
function marbleTexture(seed = 1) {
  const c = document.createElement("canvas");
  c.width = c.height = 1024;
  const x = c.getContext("2d");
  const g = x.createLinearGradient(0, 0, 1024, 1024);
  g.addColorStop(0, "#161412");
  g.addColorStop(1, "#0b0a09");
  x.fillStyle = g;
  x.fillRect(0, 0, 1024, 1024);
  let s = seed * 9301;
  const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  const vein = (color, width, alpha, n) => {
    for (let i = 0; i < n; i++) {
      x.strokeStyle = color;
      x.globalAlpha = alpha * (0.4 + rnd() * 0.6);
      x.lineWidth = width * (0.3 + rnd());
      x.beginPath();
      let px = rnd() * 1024;
      let py = rnd() * 1024;
      x.moveTo(px, py);
      const a = rnd() * Math.PI * 2;
      for (let k = 0; k < 14; k++) {
        const ang = a + (rnd() - 0.5) * 1.4;
        px += Math.cos(ang) * 80;
        py += Math.sin(ang) * 80;
        x.quadraticCurveTo(px + (rnd() - 0.5) * 60, py + (rnd() - 0.5) * 60, px, py);
      }
      x.stroke();
    }
  };
  x.filter = "blur(6px)";
  vein("#57534e", 10, 0.3, 18);
  x.filter = "blur(1.5px)";
  vein("#8d877f", 2, 0.3, 26);
  x.filter = "blur(0.8px)";
  vein("#c9a55c", 1.2, 0.3, 9);
  x.filter = "none";
  x.globalAlpha = 1;
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

// Kemerli nişin dış hattı (altın çerçeve için).
function archCurve(w, h, z) {
  const r = w / 2;
  const path = new CurvePath();
  path.add(new LineCurve3(new Vector3(-r, 0, z), new Vector3(-r, h - r, z)));
  const arc = new EllipseCurve(0, h - r, r, r, Math.PI, 0, true);
  const pts = arc.getPoints(64);
  for (let i = 1; i < pts.length; i++) path.add(new LineCurve3(new Vector3(pts[i - 1].x, pts[i - 1].y, z), new Vector3(pts[i].x, pts[i].y, z)));
  path.add(new LineCurve3(new Vector3(r, h - r, z), new Vector3(r, 0, z)));
  return path;
}

function archShape(w, h) {
  const r = w / 2;
  const s = new Shape();
  s.moveTo(-r, 0);
  s.lineTo(-r, h - r);
  s.absarc(0, h - r, r, Math.PI, 0, true);
  s.lineTo(r, 0);
  s.lineTo(-r, 0);
  return s;
}

// Osmanlı (sivri) kemeri: iki yay tepede birleşir. hw yarım genişlik, h toplam yükseklik; yay yarıçapı 1,45·hw.
const OTTOMAN = THEME.carousel === "glide";
// Karanlık sinematik stüdyo ("dolly", ana sayfayla aynı dil): kemer yok; ürünün arkasında dikey, yumuşak bir
// ışık paneli, iki yanda odak dışı ince ışık şeritleri.
const NOIR = THEME.carousel === "dolly";
function ogeePoints(w, h, n = 48) {
  const hw = w / 2;
  const r = hw * 1.45;
  const rise = Math.sqrt(r * r - (r - hw) ** 2);
  const hs = h - rise;
  const a1 = Math.acos((r - hw) / r);
  const right = [];
  for (let i = 0; i <= n; i++) {
    const a = (a1 * i) / n;
    right.push([hw - r + r * Math.cos(a), hs + r * Math.sin(a)]);
  }
  return { hs, right };
}
function ogeeCurve(w, h, z) {
  const { hs, right } = ogeePoints(w, h);
  const hw = w / 2;
  const pts = [[-hw, 0], [-hw, hs], ...[...right].map(([x, y]) => [-x, y]).slice(1), ...[...right].reverse().slice(1), [hw, 0]];
  const path = new CurvePath();
  for (let i = 1; i < pts.length; i++) path.add(new LineCurve3(new Vector3(pts[i - 1][0], pts[i - 1][1], z), new Vector3(pts[i][0], pts[i][1], z)));
  return path;
}
function ogeeShape(w, h) {
  const { hs, right } = ogeePoints(w, h);
  const hw = w / 2;
  const s = new Shape();
  s.moveTo(-hw, 0);
  s.lineTo(-hw, hs);
  [...right].map(([x, y]) => [-x, y]).slice(1).forEach(([x, y]) => s.lineTo(x, y));
  [...right].reverse().slice(1).forEach(([x, y]) => s.lineTo(x, y));
  s.lineTo(hw, 0);
  s.lineTo(-hw, 0);
  return s;
}
// Sekiz köşeli yıldız (iki dönük kare).
function starShape(r) {
  const s = new Shape();
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2 + Math.PI / 8;
    const rr = i % 2 ? r * 0.62 : r;
    i ? s.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : s.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
  }
  return s;
}

// Osmanlı kemerinin süsleri: çerçeve boyunca yıldızlar, ayak başlıkları ve tepede hilalli alem.
function OttomanTrim({ w, h, z, floorY }) {
  const gold = useMemo(() => ({ color: "#d9b46a", metalness: 1, roughness: 0.26, envMapIntensity: 1.4 }), []);
  const star = useMemo(() => starShape(0.075), []);
  const places = useMemo(() => {
    const c = ogeeCurve(w + 0.26, h + 0.13, 0);
    const n = 38;
    return Array.from({ length: n }, (_, i) => c.getPointAt(0.04 + (0.92 * i) / (n - 1)));
  }, [w, h]);
  const { hs } = useMemo(() => ogeePoints(w, h), [w, h]);
  return (
    <group position={[0, floorY, z]}>
      {places.map((p, i) => (
        <mesh key={i} position={[p.x, p.y, 0.03]} rotation={[0, 0, (i * Math.PI) / 8]}>
          <shapeGeometry args={[star]} />
          <meshStandardMaterial {...gold} />
        </mesh>
      ))}
      {[-1, 1].map((sgn) =>
        [hs, 0.06].map((y, k) => (
          <mesh key={`${sgn}${k}`} position={[sgn * (w / 2 + 0.13), y, 0.04]}>
            <boxGeometry args={[0.4, k ? 0.1 : 0.07, 0.06]} />
            <meshStandardMaterial {...gold} />
          </mesh>
        ))
      )}
      <group position={[0, h + 0.2, 0.04]}>
        <mesh position={[0, 0.12, 0]}>
          <sphereGeometry args={[0.1, 24, 16]} />
          <meshStandardMaterial {...gold} />
        </mesh>
        <mesh position={[0, 0.36, 0]}>
          <cylinderGeometry args={[0.022, 0.022, 0.4, 12]} />
          <meshStandardMaterial {...gold} />
        </mesh>
        <mesh position={[0, 0.72, 0]} rotation={[0, 0, Math.PI * 0.62]}>
          <torusGeometry args={[0.16, 0.035, 12, 40, Math.PI * 1.35]} />
          <meshStandardMaterial {...gold} />
        </mesh>
      </group>
    </group>
  );
}

// Butik sergisi ("dolly", ana sayfadaki Boutique ile aynı dil): yivli koyu bronz duvar, tepeden ürünün
// renginde duvara düşen ışık havuzu, ürünü ve kaideyi yansıtan cilalı taş zemin, altın kenarlı yuvarlak
// obsidyen kaide.
const FL = { r: 0.16, pitch: 0.35, n: 60 };
function NoirSet({ floorY, z, glow }) {
  const inst = useRef();
  const light = useRef();
  const geo = useMemo(() => new CylinderGeometry(FL.r, FL.r, 16, 16, 1, true, -Math.PI / 2, Math.PI), []);
  const tint = useMemo(() => glow.clone().lerp(new Color(1, 1, 1), 0.45), [glow]);
  useLayoutEffect(() => {
    const o = new Object3D();
    for (let i = 0; i < FL.n; i++) {
      o.position.set((i - FL.n / 2 + 0.5) * FL.pitch, 8, 0);
      o.updateMatrix();
      inst.current.setMatrixAt(i, o.matrix);
    }
    inst.current.instanceMatrix.needsUpdate = true;
    light.current.target.position.set(0, floorY + 3.4, z - 0.6);
    light.current.target.updateMatrixWorld();
  }, [floorY, z]);
  const h = PED.h;
  return (
    <>
      <group position={[0, floorY, z - 0.6]}>
        <instancedMesh ref={inst} args={[geo, null, FL.n]}>
          <meshStandardMaterial color="#3a2819" metalness={0.45} roughness={0.38} envMapIntensity={0.05} />
        </instancedMesh>
        <mesh position={[0, 8, -FL.r]}>
          <planeGeometry args={[FL.n * FL.pitch, 16]} />
          <meshStandardMaterial color="#0c0907" roughness={0.9} />
        </mesh>
        <mesh position={[0, 0.07, FL.r + 0.03]}>
          <boxGeometry args={[FL.n * FL.pitch, 0.04, 0.04]} />
          <meshStandardMaterial color="#d9b46a" metalness={1} roughness={0.25} />
        </mesh>
      </group>
      <spotLight ref={light} position={[0, floorY + 11, z + 5]} angle={0.42} penumbra={1} decay={0} intensity={16} color={tint} />
      {/* Obsidyen kaide, üst ve alt kenarda altın halka */}
      <mesh position={[0, PED_TOP - h / 2, 0]}>
        <cylinderGeometry args={[1.5, 1.55, h, 96]} />
        <meshStandardMaterial color="#050404" roughness={0.9} metalness={0} envMapIntensity={0.05} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, PED_TOP - 0.004, 0]}>
        <torusGeometry args={[1.505, 0.018, 12, 160]} />
        <meshStandardMaterial color="#d9b46a" metalness={1} roughness={0.22} envMapIntensity={1.6} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, PED_TOP - h + 0.03, 0]}>
        <torusGeometry args={[1.552, 0.008, 8, 160]} />
        <meshStandardMaterial color="#d9b46a" metalness={1} roughness={0.3} envMapIntensity={1.2} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, floorY, -2]}>
        <planeGeometry args={[40, 30]} />
        <MeshReflectorMaterial resolution={512} blur={[140, 50]} mixBlur={0.6} mixStrength={2.2} mixContrast={1.1} depthScale={1.1} minDepthThreshold={0.25} maxDepthThreshold={1.3} roughness={1} metalness={0} envMapIntensity={0.55} color="#3d2e22" mirror={0.96} />
      </mesh>
    </>
  );
}

// Butik fotoğraflı marka (theme.plate): kart, ana sayfadaki salon fotoğrafının önünde çekilir. Fotoğraf
// kemerin ortası ürünün arkasına, duvar dibi kaidenin altına gelecek biçimde sisten etkilenmeyen bir düzlemde;
// ürün ana sayfadaki gibi ince, altın kenarlı yuvarlak obsidyen kaidede, altında temas gölgesi.
const PLATE = THEME.plate;
const PLINTH = 0.32;
function PlateSet() {
  const tex = useMemo(() => {
    const t = new TextureLoader().load(`${import.meta.env.BASE_URL}${PLATE.src}`);
    t.colorSpace = SRGBColorSpace;
    return t;
  }, []);
  const mat = useMemo(() => new MeshBasicMaterial({ map: tex, fog: false, toneMapped: false }), [tex]);
  const shadow = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const g = c.getContext("2d");
    const r = g.createRadialGradient(64, 64, 10, 64, 64, 64);
    r.addColorStop(0, "rgba(0,0,0,0.85)");
    r.addColorStop(0.55, "rgba(0,0,0,0.4)");
    r.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = r;
    g.fillRect(0, 0, 128, 128);
    return new CanvasTexture(c);
  }, []);
  // Düzlem: z = -6, genişlik 30 (kemer kartın ~%90'ı); duvar dibi (floor) kaidenin altındaki zeminle aynı hizada.
  const W = 30;
  const H = W / (PLATE.aspect ?? 2.63);
  const floorY = PED_TOP - PLINTH;
  const camY = 0.55;
  const yFloorPlane = camY + (floorY - camY) * (18.5 / 12.5);
  const cy = yFloorPlane + ((PLATE.floor ?? 0.66) - 0.5) * H;
  const cx = (0.5 - (PLATE.x ?? 0.5)) * W;
  return (
    <>
      <mesh position={[cx, cy, -6]} material={mat}>
        <planeGeometry args={[W, H]} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, floorY + 0.004, 0]}>
        <planeGeometry args={[4.4, 4.4]} />
        <meshBasicMaterial map={shadow} transparent depthWrite={false} color="#000000" fog={false} />
      </mesh>
      <mesh position={[0, PED_TOP - PLINTH / 2, 0]}>
        <cylinderGeometry args={[1.5, 1.55, PLINTH, 96]} />
        <meshStandardMaterial color="#050404" roughness={0.9} metalness={0} envMapIntensity={0.05} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, PED_TOP - 0.004, 0]}>
        <torusGeometry args={[1.505, 0.018, 12, 160]} />
        <meshStandardMaterial color="#d9b46a" metalness={1} roughness={0.22} envMapIntensity={1.6} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, floorY + 0.03, 0]}>
        <torusGeometry args={[1.552, 0.008, 8, 160]} />
        <meshStandardMaterial color="#d9b46a" metalness={1} roughness={0.3} envMapIntensity={1.2} />
      </mesh>
    </>
  );
}

function Stage() {
  const f = flavors[0];
  const accent = useMemo(() => new Color(f.theme?.accent ?? "#c9a55c"), [f]);
  const glow = useMemo(() => new Color(f.theme?.glow ?? "#6b2f4b"), [f]);
  const marble = useMemo(() => marbleTexture(3), []);
  const camera = useThree((s) => s.camera);
  useEffect(() => {
    camera.lookAt(0, 0.2, 0);
  }, [camera]);
  const floorY = PED_TOP - PED.h;
  const archW = 4.6;
  // Osmanlı kemerinde tepe ve alem kadraja sığsın.
  const archH = OTTOMAN ? 5.75 : 7.6;
  const archZ = -3.2;
  const frame = useMemo(() => (OTTOMAN ? ogeeCurve : archCurve)(archW, archH, archZ + 0.02), []);
  const frame2 = useMemo(() => (OTTOMAN ? ogeeCurve : archCurve)(archW + 0.5, archH + 0.25, archZ - 0.05), []);
  const niche = useMemo(() => (OTTOMAN ? ogeeShape : archShape)(archW, archH), []);
  // Nişin içi: ürünün renginde, tepeden aşağı yumuşak ışık.
  const nicheMat = useMemo(
    () => ({
      uniforms: { u_a: { value: glow.clone().lerp(accent, 0.25) }, u_top: { value: archH } },
      vertexShader: "varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }",
      fragmentShader:
        "uniform vec3 u_a; uniform float u_top; varying vec3 vP; void main(){ float y = clamp(vP.y / u_top, 0., 1.); float cx = 1. - smoothstep(0., 2.3, abs(vP.x)); vec3 c = u_a * (0.18 + 0.75 * pow(1. - abs(y - 0.55), 2.) * cx); gl_FragColor = vec4(c, 1.); }",
    }),
    [glow, accent]
  );
  // Işık paneli (NOIR): üstte parlak, gövdeye doğru kısılan dikey ışık; iki yanda ince şeritler.
  const panelMat = useMemo(
    () => ({
      uniforms: { u_a: { value: glow.clone().lerp(accent, 0.25).lerp(new Color(1, 1, 1), 0.2) } },
      vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }",
      fragmentShader:
        "uniform vec3 u_a; varying vec2 vUv; void main(){ float x = (vUv.x - 0.5) * 8.; float y = vUv.y * 9.; float panel = exp(-pow(abs(x) / 1.5, 2.2) - pow(abs(y - 3.2) / 2.9, 2.6)); float grad = 0.5 + 0.5 * smoothstep(1., 5.5, y); float strip = exp(-pow((abs(x) - 2.6) / 0.06, 2.)) * smoothstep(0.3, 1.5, y) * (1. - smoothstep(4.5, 6.5, y)); vec3 c = vec3(0.02, 0.017, 0.015) + u_a * (panel * grad * 1.05 + strip * 0.28); gl_FragColor = vec4(c, 1.); }",
    }),
    [glow, accent]
  );
  // Işık konisi: spotun havada görünen izi.
  const coneMat = useMemo(
    () => ({
      uniforms: { u_c: { value: new Color("#ffe9c9") } },
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      side: DoubleSide,
      vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }",
      fragmentShader: "uniform vec3 u_c; varying vec2 vUv; void main(){ float a = smoothstep(0., 0.9, vUv.y) * 0.16 * (1. - smoothstep(0.92, 1., vUv.y)); gl_FragColor = vec4(u_c * a, a); }",
    }),
    []
  );
  const dust = useMemo(() => {
    const g = new BufferGeometry();
    const n = 260;
    const p = new Float32Array(n * 3);
    let s = 7;
    const r = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
    for (let i = 0; i < n; i++) {
      p[i * 3] = (r() - 0.5) * 7;
      p[i * 3 + 1] = floorY + r() * 8;
      p[i * 3 + 2] = (r() - 0.5) * 5;
    }
    g.setAttribute("position", new BufferAttribute(p, 3));
    return g;
  }, [floorY]);
  return (
    <>
      <color attach="background" args={["#060504"]} />
      <fog attach="fog" args={["#050403", 12.5, 19]} />
      {/* Arka duvar ve kemerli niş (butik fotoğrafında duvar fotoğraftan gelir) */}
      {!PLATE && (
        <mesh position={[0, 2, archZ - 0.3]}>
          <planeGeometry args={[30, 20]} />
          <meshStandardMaterial color="#0d0b0a" roughness={0.9} />
        </mesh>
      )}
      {PLATE ? (
        <PlateSet />
      ) : NOIR ? (
        <NoirSet floorY={floorY} z={archZ} glow={glow} />
      ) : (
        <>
          <mesh position={[0, floorY, archZ]}>
            <shapeGeometry args={[niche, 48]} />
            <shaderMaterial args={[nicheMat]} />
          </mesh>
          <mesh position={[0, floorY, 0]}>
            <tubeGeometry args={[frame, 400, 0.035, 8, false]} />
            <meshStandardMaterial color="#d9b46a" metalness={1} roughness={0.28} />
          </mesh>
          <mesh position={[0, floorY, 0]}>
            <tubeGeometry args={[frame2, 400, 0.018, 8, false]} />
            <meshStandardMaterial color="#b8903f" metalness={1} roughness={0.35} />
          </mesh>
        </>
      )}
      {OTTOMAN && <OttomanTrim w={archW} h={archH} z={archZ} floorY={floorY} />}
      {!NOIR && (
        <>
          {/* Mermer kaide ve altın kenar */}
          <mesh position={[0, PED_TOP - PED.h / 2, 0]}>
            <boxGeometry args={[PED.w, PED.h, PED.d]} />
            <meshPhysicalMaterial map={marble} roughness={0.16} metalness={0.1} clearcoat={1} clearcoatRoughness={0.06} envMapIntensity={0.8} />
          </mesh>
          <mesh position={[0, PED_TOP - 0.01, PED.d / 2]}>
            <boxGeometry args={[PED.w + 0.01, 0.022, 0.022]} />
            <meshStandardMaterial color="#d9b46a" metalness={1} roughness={0.3} />
          </mesh>
          {/* Parlak siyah zemin: ışık yalnızca ürünün önünde hafifçe yansır. */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, floorY, 0]}>
            <planeGeometry args={[40, 40]} />
            <meshStandardMaterial color="#050404" roughness={1} metalness={0} envMapIntensity={0} />
          </mesh>
          {/* Işık konisi */}
          <mesh position={[0, PED_TOP + 3.9, 0.2]}>
            <coneGeometry args={[2.4, 8, 48, 1, true]} />
            <shaderMaterial args={[coneMat]} />
          </mesh>
        </>
      )}
      <points geometry={dust}>
        <pointsMaterial color="#e8c77a" size={0.035} transparent opacity={0.7} depthWrite={false} blending={AdditiveBlending} />
      </points>
      {/* Işıklar: tepeden sıcak spot, önden yumuşak ana ışık, arkadan ürün renginde kenar ışıkları */}
      <spotLight position={[0, 8.5, 2.5]} angle={0.26} penumbra={0.9} decay={0} intensity={NOIR ? 2.2 : 4.6} color="#fff0dc" />
      <pointLight position={[-3, 1.5, -1.5]} intensity={6} distance={9} color={accent} />
      <pointLight position={[3, 1.5, -1.5]} intensity={6} distance={9} color={accent} />
      <pointLight position={[0, 3, archZ + 0.6]} intensity={5} distance={7} color={glow.clone().lerp(accent, 0.5)} />
    </>
  );
}

export default function Still() {
  return (
    <div style={{ position: "fixed", inset: 0 }}>
      <Canvas
        gl={{ alpha: !STAGE, antialias: true, preserveDrawingBuffer: true }}
        camera={STAGE ? { position: [0, 0.55, 12.5], fov: 33 } : { position: [0, 0, 10.5], fov: 35 }}
        dpr={STAGE ? 1 : 2}
        onCreated={({ gl }) => (gl.toneMappingExposure = STAGE ? 1.15 : 1.25)}
      >
        {/* Stüdyo: önden yumuşak ana ışık, üstten sıcak spot, yanlardan kenar ışığı; ürün aydınlık. */}
        <ambientLight intensity={STAGE ? 0.35 : 0.55} />
        <directionalLight position={[-5, 7, 8]} intensity={STAGE ? 1.3 : 1.6} />
        <directionalLight position={[0, 2, 10]} intensity={0.7} />
        <directionalLight position={[7, 1, -3]} intensity={0.9} color="#ffe2c0" />
        <directionalLight position={[8, -2, 4]} intensity={0.35} color={content.fillLight ?? "#9fb4ff"} />
        {!STAGE && <spotLight position={[-1, 10, 7]} angle={0.45} penumbra={1} decay={0} intensity={3.2} color="#fff3e2" />}
        <Suspense fallback={null}>
          <Environment files={envMap} />
          {STAGE && <Stage />}
          <Product />
        </Suspense>
      </Canvas>
    </div>
  );
}
