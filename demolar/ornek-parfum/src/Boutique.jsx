import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { MeshReflectorMaterial } from "@react-three/drei";
import { AdditiveBlending, Color, CylinderGeometry, DoubleSide, MathUtils, Object3D, ShaderMaterial } from "three";

import { arcPose } from "./Carousel";
import { MOBILE } from "./canMaterial";
import { flavors } from "./data";
import { scrollState } from "./scroll";
import { sceneState } from "./shared";
import { useStore } from "./store";
import { THEME } from "./theme";

// Sinematik butik ("dolly"): gerçek 3B sahne. Şişenin arkasında koyu bronz, yivli (dikey oluklu) bir duvar;
// tepeden duvara ürünün renginde bir ışık düşer, oluklar ışığı dikey parıltılarla taşır. Zemin cilalı siyah
// taş: şişeyi, kaideyi ve duvarı gerçekten yansıtır. Kaydırınca duvar yavaşça yana kayar (derinlik hissi),
// geçişte ürünün önünde ince bir duman kabarır ve şişe dumanın içinde çözülür.
const FLUTE_R = 0.2;
const PITCH = 0.44;
const COUNT = 170;
const WALL_Z = -10;
const GOLD = new Color(THEME.accent ?? "#d4b06a");
const WHITE = new Color(1, 1, 1);
// Butik fotoğrafında (theme.plate) zemin fotoğraftan gelir: 3B zemin yalnızca ürünlerin ve kaidelerin
// yansımasını fotoğraftaki mermerin üstüne ekler (toplamalı karışım; boş yerler fotoğrafı değiştirmez).
const PLATE_FLOOR = { transparent: true, depthWrite: false, blending: AdditiveBlending, color: "#ffffff", envMapIntensity: 0, roughness: 1, metalness: 0, mirror: 1 };

const smokeMaterial = () =>
  new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    side: DoubleSide,
    uniforms: { u_time: { value: 0 }, u_amount: { value: 0 }, u_color: { value: new Color(1, 0.9, 0.75) } },
    vertexShader: /* glsl */ `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
    fragmentShader: /* glsl */ `
      uniform float u_time; uniform float u_amount; uniform vec3 u_color; varying vec2 vUv;
      float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float vnoise(vec2 p) {
        vec2 i = floor(p); vec2 f = fract(p); f = f * f * (3. - 2. * f);
        return mix(mix(hash(i), hash(i + vec2(1., 0.)), f.x), mix(hash(i + vec2(0., 1.)), hash(i + vec2(1., 1.)), f.x), f.y);
      }
      float fbm(vec2 p) { float v = 0.; float a = 0.5; for (int k = 0; k < 5; k++) { v += a * vnoise(p); p = p * 2.03 + vec2(1.7, 9.2); a *= 0.5; } return v; }
      void main() {
        vec2 p = vUv * vec2(3.2, 2.4) - vec2(0., u_time * 0.05);
        float n = fbm(p + vec2(fbm(p * 1.3 + u_time * 0.03), fbm(p + 4.1)) * 1.8);
        float wisp = smoothstep(0.42, 0.95, n);
        vec2 c = (vUv - vec2(0.5, 0.42)) * vec2(1.6, 1.3);
        float mask = exp(-dot(c, c) * 3.2) * smoothstep(0., 0.12, vUv.y);
        float a = wisp * mask * u_amount;
        gl_FragColor = vec4(u_color * a, a);
      }`,
  });

export default function Boutique() {
  const size = useThree((s) => s.size);
  const root = useRef();
  const wall = useRef();
  const flutes = useRef();
  const floorMat = useRef();
  const wallLight = useRef();
  const fill = useRef();
  const smoke = useRef();
  const s = useRef({ tint: new Color(), x: null });
  const smokeMat = useMemo(smokeMaterial, []);
  const fluteGeo = useMemo(() => new CylinderGeometry(FLUTE_R, FLUTE_R, 30, 20, 1, true, -Math.PI / 2, Math.PI), []);

  // Fotoğraflı butikte zemin yalnızca yansımayı ekler (toplamalı karışım); özellik olarak verilince
  // malzemeye işlenmiyordu, burada doğrudan ayarlanır.
  useEffect(() => {
    const m = floorMat.current;
    if (!THEME.plate || !m) return;
    m.transparent = true;
    m.depthWrite = false;
    m.blending = AdditiveBlending;
    m.needsUpdate = true;
  }, []);

  // Oluklar: yarım silindirler yan yana, yüzleri kameraya dönük.
  useEffect(() => {
    const o = new Object3D();
    for (let i = 0; i < COUNT; i++) {
      o.position.set((i - COUNT / 2) * PITCH, 15, 0);
      o.updateMatrix();
      flutes.current.setMatrixAt(i, o.matrix);
    }
    flutes.current.instanceMatrix.needsUpdate = true;
  }, []);

  useFrame(({ clock }, delta) => {
    const dt = Math.min(delta, 0.1);
    const st = useStore.getState();
    const S = s.current;
    const asp = size.width / size.height;
    const r = arcPose(0, asp, 0, st.active);
    const floorY = sceneState.floorY ?? r.y - 4.2;
    // Kaydırınca duvar yavaşça sola kayar; oluklar periyodik olduğundan kayma dikişsiz.
    const shift = -((scrollState.p * 1.1) % PITCH);
    root.current.position.set(0, floorY, 0);
    wall.current.position.set(r.x + shift, 0, r.z + WALL_Z);
    // Işık ürünün renginde; Ritüel ve mağazaya geçerken söner.
    S.tint.lerp(new Color(flavors[st.active].theme.glow).lerp(WHITE, 0.45), 0.05);
    const on = (1 - scrollState.ritualIn) * (1 - scrollState.shopIn) * Math.min(1, sceneState.intro * 1.3);
    const L = wallLight.current;
    L.color.copy(S.tint);
    L.intensity = 22 * on;
    // Işık havuzu şişenin tam arkasında: duvarın ortası parlak, kenarlar ve tepe karanlık.
    L.position.set(r.x, floorY + 19, r.z + WALL_Z + 9);
    L.target.position.set(r.x, floorY + 3.8, r.z + WALL_Z);
    L.target.updateMatrixWorld();
    fill.current.color.copy(S.tint);
    fill.current.intensity = 1.4 * on;
    fill.current.position.set(r.x, 2.5, r.z + WALL_Z + 2.5);
    if (floorMat.current) floorMat.current.mixStrength = (THEME.plate ? 1.4 : 2.2) * on;
    // Duman: ürünün önünde; geçişte (kesirli kaydırma) kabarır, yerindeyken çok hafif.
    const fr = scrollState.p - Math.floor(scrollState.p);
    // Fotoğraflı butikte geçişte duman kabarmaz: arka plan sabit görünür.
    const trans = THEME.plate ? 0 : Math.sin(Math.PI * fr);
    smoke.current.position.set(r.x, r.y + 0.6, r.z + 1.4);
    smoke.current.scale.setScalar(r.scale / 2);
    smokeMat.uniforms.u_time.value = clock.getElapsedTime();
    smokeMat.uniforms.u_amount.value = MathUtils.damp(smokeMat.uniforms.u_amount.value, (0.05 + 0.5 * trans) * on * (st.detail ? 0 : 1), 5, dt);
    smokeMat.uniforms.u_color.value.copy(S.tint);
    // Butik fotoğrafı (theme.plate) varsa duvar ve zemin fotoğraftan gelir: 3B duvar, zemin ve duvar ışığı gizli.
    // Fotoğraflı butikte duvar ve zemin fotoğraftan gelir (3B duvar ve yansıtıcı zemin gizli).
    root.current.visible = on > 0.01 && !THEME.plate;
    if (THEME.plate) L.intensity = 0;
  });

  return (
    <>
      <group ref={root}>
        {/* Cilalı siyah taş zemin: gerçek yansıma (bulanık, kenara doğru sönen). */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -6]}>
          <planeGeometry args={[90, 50]} />
          <MeshReflectorMaterial
            ref={floorMat}
            resolution={MOBILE ? 256 : 640}
            blur={[140, 50]}
            mixBlur={0.6}
            mixStrength={2.2}
            mixContrast={1.1}
            depthScale={1.1}
            minDepthThreshold={0.25}
            maxDepthThreshold={1.3}
            roughness={1}
            metalness={0}
            envMapIntensity={0.55}
            color="#3d2e22"
            mirror={0.96}
            {...(THEME.plate ? PLATE_FLOOR : {})}
          />
        </mesh>
        <group ref={wall}>
          {/* Yivli bronz duvar ve arkasındaki koyu yüzey */}
          <instancedMesh ref={flutes} args={[fluteGeo, null, COUNT]}>
            <meshStandardMaterial color="#3a2819" metalness={0.45} roughness={0.38} envMapIntensity={0.05} />
          </instancedMesh>
          <mesh position={[0, 15, -FLUTE_R]}>
            <planeGeometry args={[COUNT * PITCH, 30]} />
            <meshStandardMaterial color="#0c0907" roughness={0.9} />
          </mesh>
          {/* Duvar dibinde ince altın süpürgelik */}
          <mesh position={[0, 0.09, FLUTE_R + 0.03]}>
            <boxGeometry args={[COUNT * PITCH, 0.05, 0.05]} />
            <meshStandardMaterial color={GOLD} metalness={1} roughness={0.25} envMapIntensity={1.4} />
          </mesh>
          <mesh position={[0, 0.03, FLUTE_R + 0.06]}>
            <boxGeometry args={[COUNT * PITCH, 0.06, 0.12]} />
            <meshStandardMaterial color="#070605" roughness={0.5} />
          </mesh>
        </group>
      </group>
      {/* Tepeden duvara düşen ürün renginde ışık ve duvarı yumuşakça dolduran ikinci ışık. */}
      <spotLight ref={wallLight} angle={0.36} penumbra={1} decay={0} intensity={0} />
      <pointLight ref={fill} distance={9} decay={1.6} intensity={0} />
      <mesh ref={smoke} material={smokeMat} renderOrder={4}>
        <planeGeometry args={[9, 8]} />
      </mesh>
    </>
  );
}
