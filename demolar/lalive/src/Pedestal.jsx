import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { AdditiveBlending, Color, MathUtils, ShaderMaterial } from "three";

import { flavors } from "./data";
import { sceneState } from "./shared";
import { useStore } from "./store";
import { THEME } from "./theme";

const GOLD = new Color(THEME.accent ?? "#c9a55c");
const tmp = new Color();

// Stüdyo kaidesi: öndeki ürünün altında cilalı koyu bir disk, altın kenar halkası ve
// üstünde ürünün kendi renginde bir ışık havuzu. Ürün kaidenin üzerinde süzülür.
export default function Pedestal() {
  const group = useRef();
  const glow = useRef();
  const ring = useRef();
  const disc = useRef();
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

  useFrame(({ clock }, delta) => {
    const dt = Math.min(delta, 0.1);
    const st = useStore.getState();
    const S = s.current;
    const target = (1 - Math.min(1, sceneState.spread * 3)) * (st.detail ? 0 : 1) * Math.min(1, sceneState.intro * 1.2);
    S.vis = MathUtils.damp(S.vis, target, 3, dt);
    const f = sceneState.focus;
    const sc = f.scale || 1;
    group.current.position.set(f.position.x, f.position.y + (f.bottom != null ? f.bottom * sc - 0.04 : -1.95 * sc + 0.15), f.position.z);
    group.current.scale.setScalar(sc);
    group.current.visible = S.vis > 0.01;
    tmp.set(flavors[st.active].theme.accent);
    S.color.lerp(tmp, 0.06);
    glowMat.uniforms.u_color.value.copy(S.color);
    glowMat.uniforms.u_alpha.value = 0.75 * S.vis;
    glowMat.uniforms.u_time.value = clock.getElapsedTime();
    ring.current.material.opacity = 0.9 * S.vis;
    disc.current.material.opacity = 0.92 * S.vis;
  });

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
