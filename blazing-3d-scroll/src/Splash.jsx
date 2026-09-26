import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { AdditiveBlending, Color, MathUtils, ShaderMaterial } from "three";

import { flavors } from "./data";
import { noise } from "./Noise";
import { sceneState } from "./shared";
import { useStore } from "./store";

// Fare öndeki kutunun üzerine gelince kutunun arkasında, tatın renginde
// gürültülü bir sıçrama belirir.
export default function Splash() {
  const mesh = useRef();
  const amount = useRef(0);

  const material = useMemo(
    () =>
      new ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        uniforms: { u_time: { value: 0 }, u_hover: { value: 0 }, u_color: { value: new Color() } },
        vertexShader: /* glsl */ `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: /* glsl */ `
          uniform float u_time;
          uniform float u_hover;
          uniform vec3 u_color;
          varying vec2 vUv;
          ${noise}
          void main() {
            vec2 p = (vUv - 0.5) * vec2(1.0, 1.35);
            float r = length(p);
            float n = cnoise(vec4(vUv * vec2(6.0, 8.0), u_time * 0.6, 1.0)) * 0.5 + 0.5;
            float edge = mix(0.12, 0.5, u_hover);
            float shape = smoothstep(edge, edge - 0.14, r + (n - 0.5) * 0.4);
            float blobs = smoothstep(0.42, 0.6, n);
            float a = shape * blobs * u_hover;
            gl_FragColor = vec4(u_color * 2.2 * a, a);
          }
        `,
      }),
    []
  );

  useFrame(({ clock }, delta) => {
    amount.current = MathUtils.damp(amount.current, sceneState.hoverFocus ? 1 : 0, 5, Math.min(delta, 0.1));
    const m = mesh.current;
    m.visible = amount.current > 0.01;
    if (!m.visible) return;
    const f = sceneState.focus;
    m.position.set(f.position.x, f.position.y, f.position.z - 0.9);
    m.rotation.set(0, 0, f.rotation.z);
    m.scale.set(4.4 * f.scale, 6.4 * f.scale, 1);
    material.uniforms.u_time.value = clock.getElapsedTime();
    material.uniforms.u_hover.value = amount.current;
    material.uniforms.u_color.value.set(flavors[useStore.getState().active].color);
  });

  return (
    <mesh ref={mesh} material={material} visible={false} renderOrder={1}>
      <planeGeometry args={[1, 1]} />
    </mesh>
  );
}
