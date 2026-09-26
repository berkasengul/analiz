import { useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { sceneState } from "./shared";
import { AdditiveBlending, BufferAttribute, BufferGeometry, ShaderMaterial } from "three";

const COUNT = typeof window !== "undefined" && window.innerWidth < 760 ? 180 : 420;

// Havada süzülen, odak dışı buz/kül parçacıkları.
export default function Particles() {
  const dpr = useThree((s) => s.viewport.dpr);

  const geometry = useMemo(() => {
    const g = new BufferGeometry();
    const pos = new Float32Array(COUNT * 3);
    const seed = new Float32Array(COUNT);
    for (let i = 0; i < COUNT; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 34;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 18;
      pos[i * 3 + 2] = -12 + Math.random() * 18;
      seed[i] = Math.random();
    }
    g.setAttribute("position", new BufferAttribute(pos, 3));
    g.setAttribute("aSeed", new BufferAttribute(seed, 1));
    return g;
  }, []);

  const material = useMemo(
    () =>
      new ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        uniforms: { u_time: { value: 0 }, u_dpr: { value: dpr }, u_dim: { value: 1 } },
        vertexShader: /* glsl */ `
          uniform float u_time;
          uniform float u_dpr;
          attribute float aSeed;
          varying float vSeed;
          varying float vDepth;
          void main() {
            vec3 p = position;
            p.y = mod(p.y + u_time * (0.08 + aSeed * 0.12) + 9., 18.) - 9.;
            p.x += sin(u_time * 0.25 + aSeed * 40.) * 0.4;
            vec4 mv = modelViewMatrix * vec4(p, 1.);
            gl_Position = projectionMatrix * mv;
            gl_PointSize = (14. + aSeed * 26.) * u_dpr * (12. / -mv.z);
            vSeed = aSeed;
            vDepth = -mv.z;
          }
        `,
        fragmentShader: /* glsl */ `
          uniform float u_dim;
          varying float vSeed;
          varying float vDepth;
          void main() {
            vec2 c = gl_PointCoord - 0.5;
            float a = vSeed * 6.2831;
            c = mat2(cos(a), -sin(a), sin(a), cos(a)) * c;
            c.y *= 1.8 + vSeed;
            float d = length(c);
            float alpha = smoothstep(0.5, 0.05, d);
            // Yakındakiler daha bulanık ve soluk.
            float near = smoothstep(18., 8., vDepth);
            alpha *= mix(0.16, 0.06, near) * u_dim;
            gl_FragColor = vec4(vec3(0.8, 0.82, 0.86) * alpha, alpha);
          }
        `,
      }),
    [dpr]
  );

  useFrame(({ clock }) => {
    material.uniforms.u_time.value = clock.getElapsedTime();
    material.uniforms.u_dim.value = 1 - 0.6 * sceneState.spotlight;
  });

  return <points geometry={geometry} material={material} frustumCulled={false} />;
}
