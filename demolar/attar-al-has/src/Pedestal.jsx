import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { AdditiveBlending, Color, MathUtils, ShaderMaterial } from "three";

import { flavors } from "./data";
import { sceneState } from "./shared";
import { useStore } from "./store";
import { THEME } from "./theme";
import { DOLLY, GLIDE, ORBIT, RISE, arcPose, orbitFloor, orbitRadius, orbitX } from "./Carousel";

// "dolly" kaidesi: ürünün yerel biriminde yükseklik (arka plandaki zemin kaidenin altına hizalanır).
export const PLINTH_H = DOLLY ? 0.26 : 0;

const GOLD = new Color(THEME.accent ?? "#c9a55c");
const tmp = new Color();

// Stüdyo kaidesi: öndeki ürünün altında cilalı koyu bir disk, altın kenar halkası ve
// üstünde ürünün kendi renginde bir ışık havuzu. Ürün kaidenin üzerinde süzülür.
export default function Pedestal() {
  const group = useRef();
  const glow = useRef();
  const ring = useRef();
  const disc = useRef();
  const ring2 = useRef();
  const s = useRef({ vis: 0, color: new Color() });

  const glowMat = useMemo(
    () =>
      new ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        uniforms: { u_color: { value: new Color() }, u_alpha: { value: 0 }, u_time: { value: 0 } },
        vertexShader: /* glsl */ `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
        fragmentShader: /* glsl */ `
          uniform vec3 u_color; uniform float u_alpha; uniform float u_time; varying vec2 vUv;
          void main() {
            float d = length(vUv - 0.5) * 2.;
            float pool = smoothstep(1., 0., d);
            float breathe = 0.85 + 0.15 * sin(u_time * 0.8);
            gl_FragColor = vec4(u_color * pool * pool * u_alpha * breathe, 1.);
          }`,
      }),
    []
  );

  const size = useThree((s) => s.size);
  useFrame(({ clock }, delta) => {
    const dt = Math.min(delta, 0.1);
    const st = useStore.getState();
    const S = s.current;
    // Ürünün sahne fotoğrafı varsa ürün fotoğraftaki kaidede durur; 3B kaide gizlenir.
    const target = (RISE || GLIDE ? 0 : 1) * (flavors[st.active]?.stage ? 0 : 1) * (1 - Math.min(1, sceneState.spread * 3)) * (st.detail ? 0 : 1) * Math.min(1, sceneState.intro * 1.2);
    S.vis = MathUtils.damp(S.vis, target, 3, dt);
    const f = sceneState.focus;
    const sc = f.scale || 1;
    if (ORBIT) {
      // Döner vitrin: halkanın merkezinde, bütün ürünleri taşıyan büyük platform; kaydırmayla döner.
      const asp = size.width / size.height;
      const R = orbitRadius(asp);
      group.current.position.set(orbitX(asp), orbitFloor(asp) - 0.02, -R);
      group.current.scale.setScalar((R + 1.15) / 1.4);
      group.current.rotation.y = -(sceneState.ringAngle ?? 0);
    } else if (DOLLY) {
      // Sinematik stüdyo: kaide ürünün dinlenme yerinde sabit durur; geçişte şişeler onun üstünde çözülüp belirir.
      const r = arcPose(0, size.width / size.height, 0, st.active);
      const y = r.y + (f.bottom != null ? f.bottom * r.scale : -1.9 * r.scale);
      S.y = S.y == null ? y : MathUtils.damp(S.y, y, 4, dt);
      // Butik zemini (Boutique) kaidenin altında.
      sceneState.floorY = S.y - PLINTH_H * r.scale;      // Opak kaide: detaya geçerken ve açılışta yumuşakça küçülüp büyür (saydamlık yerine).
      group.current.position.set(r.x, S.y, r.z);
      group.current.scale.setScalar(r.scale * MathUtils.smootherstep(S.vis, 0, 1));
    } else {
      group.current.position.set(f.position.x, f.position.y + (f.bottom != null ? f.bottom * sc - 0.04 : -1.95 * sc + 0.15), f.position.z);
      group.current.scale.setScalar(sc);
    }
    group.current.visible = S.vis > 0.01;
    tmp.set(flavors[st.active].theme.accent);
    S.color.lerp(tmp, 0.06);
    glowMat.uniforms.u_color.value.copy(S.color);
    glowMat.uniforms.u_alpha.value = (ORBIT ? 0.55 : DOLLY ? 0.3 : 0.75) * S.vis;
    if (ORBIT) {
      // Işık havuzu platformla dönmez: öndeki ürünün altında durur.
      const k = group.current.scale.x;
      const ry = group.current.rotation.y;
      const r = orbitRadius(size.width / size.height) / k;
      glow.current.position.set(r * Math.sin(-ry), 0.012, r * Math.cos(-ry));
      glow.current.rotation.set(-Math.PI / 2, 0, 0);
      glow.current.scale.setScalar(0.55);
    }
    glowMat.uniforms.u_time.value = clock.getElapsedTime();
    ring.current.material.opacity = 0.9 * S.vis;
    disc.current.material.opacity = 0.92 * S.vis;
    if (ring2.current) ring2.current.material.opacity = 0.7 * S.vis;
  });

  if (DOLLY)
    return (
      <group ref={group}>
        {/* Obsidyen kaide: cilalı siyah silindir, üst kenarda altın halka, altta ince altın çizgi. */}
        <mesh ref={disc} position={[0, -PLINTH_H / 2, 0]}>
          <cylinderGeometry args={[1.18, 1.22, PLINTH_H, 128]} />
          <meshStandardMaterial color="#050404" roughness={0.9} metalness={0} envMapIntensity={0.05} />
        </mesh>
        <mesh ref={ring} rotation={[Math.PI / 2, 0, 0]} position={[0, -0.004, 0]}>
          <torusGeometry args={[1.185, 0.014, 12, 160]} />
          <meshStandardMaterial color={GOLD} metalness={1} roughness={0.22} envMapIntensity={1.6} transparent />
        </mesh>
        <mesh ref={ring2} rotation={[Math.PI / 2, 0, 0]} position={[0, -PLINTH_H + 0.02, 0]}>
          <torusGeometry args={[1.222, 0.006, 8, 160]} />
          <meshStandardMaterial color={GOLD} metalness={1} roughness={0.3} envMapIntensity={1.2} transparent />
        </mesh>
        {/* Ürünün renginde ışık havuzu (kaidenin üstünde) */}
        <mesh ref={glow} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.006, 0]} material={glowMat} scale={0.72}>
          <planeGeometry args={[3.2, 3.2]} />
        </mesh>
      </group>
    );

  return (
    <group ref={group}>
      {/* Cilalı koyu disk */}
      <mesh ref={disc} position={[0, -0.06, 0]}>
        <cylinderGeometry args={[1.35, 1.42, 0.12, 96]} />
        <meshPhysicalMaterial color="#0b0908" roughness={0.18} metalness={0.2} clearcoat={1} clearcoatRoughness={0.08} envMapIntensity={0.9} transparent />
      </mesh>
      {/* Altın kenar halkası */}
      <mesh ref={ring} rotation={[Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
        <torusGeometry args={[1.36, 0.012, 12, 128]} />
        <meshBasicMaterial color={GOLD} transparent toneMapped={false} />
      </mesh>
      {/* Ürünün renginde ışık havuzu */}
      <mesh ref={glow} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]} material={glowMat}>
        <planeGeometry args={[3.2, 3.2]} />
      </mesh>
    </group>
  );
}
