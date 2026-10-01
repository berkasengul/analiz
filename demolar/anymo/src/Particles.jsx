import { useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { sceneState } from "./shared";
import { scrollState } from "./scroll";
import { AdditiveBlending, BufferAttribute, BufferGeometry, Color, ShaderMaterial } from "three";

import { flavors } from "./data";
import { THEME } from "./theme";

// Tema "gold": yuvarlak, ışıldayan altın toz (her tanecik kendi ritminde parlar).
// Tema "dust": sinematik sahne için çok ince, uzakta asılı altın toz (yakında büyük, bulanık yuvarlaklar olmaz).
const DUST = THEME.particles === "dust";
const GOLD = THEME.particles === "gold" || DUST;
const goldColor = new Color(THEME.accent ?? "#c9a55c");

const target = new Color();
const white = new Color(1, 1, 1);

const COUNT = (typeof window !== "undefined" && window.innerWidth < 760 ? 180 : 420) * (DUST ? 0.7 : GOLD ? 1.6 : 1);

// Tema "none": parçacık yok (toz, sahne fotoğrafının ışık huzmesinde).
export default function Particles() {
  return THEME.particles === "none" ? null : <FloatingParticles />;
}

// Havada süzülen, odak dışı buz/kül parçacıkları.
function FloatingParticles() {
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
        uniforms: { u_time: { value: 0 }, u_dpr: { value: dpr }, u_dim: { value: 1 }, u_tint: { value: new Color(0.8, 0.82, 0.86) }, u_gold: { value: GOLD ? 1 : 0 }, u_dust: { value: DUST ? 1 : 0 } },
        vertexShader: /* glsl */ `
          uniform float u_time;
          uniform float u_dpr;
          uniform float u_gold;
          uniform float u_dust;
          attribute float aSeed;
          varying float vSeed;
          varying float vDepth;
          void main() {
            vec3 p = position;
            p.y = mod(p.y + u_time * (0.08 + aSeed * 0.12) + 9., 18.) - 9.;
            p.x += sin(u_time * 0.25 + aSeed * 40.) * 0.4;
            vec4 mv = modelViewMatrix * vec4(p, 1.);
            gl_Position = projectionMatrix * mv;
            gl_PointSize = (14. + aSeed * 26.) * u_dpr * (12. / -mv.z) * (u_gold > 0.5 ? 0.45 : 1.);
            if (u_dust > 0.5) gl_PointSize = (2. + aSeed * 3.) * u_dpr;
            vSeed = aSeed;
            vDepth = -mv.z;
          }
        `,
        fragmentShader: /* glsl */ `
          uniform float u_dim;
          uniform float u_gold;
          uniform float u_dust;
          uniform float u_time;
          uniform vec3 u_tint;
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
            if (u_gold > 0.5) {
              // Altın toz: yuvarlak, parlak çekirdek; her tanecik kendi ritminde ışıldar.
              float r = length(gl_PointCoord - 0.5);
              float core = smoothstep(0.5, 0.0, r);
              float tw = 0.35 + 0.65 * pow(0.5 + 0.5 * sin(u_time * (1.2 + vSeed * 2.5) + vSeed * 60.), 3.);
              alpha = core * core * mix(0.9, 0.35, near) * tw * u_dim;
              // İnce toz: yakındakiler hiç görünmez, uzaktakiler soluk ışıltı.
              if (u_dust > 0.5) alpha = core * mix(0.55, 0., near) * tw * u_dim;
            }
            gl_FragColor = vec4(u_tint * alpha, alpha);
          }
        `,
      }),
    [dpr]
  );

  useFrame(({ clock }) => {
    material.uniforms.u_time.value = clock.getElapsedTime();
    // Koku bulucuda parçacıklar odanın önüne düşmesin.
    material.uniforms.u_dim.value = (1 - 0.6 * sceneState.spotlight) * (scrollState.finderOn ? 1 - scrollState.finderIn : 1);
    // Parçacıklar tadın ışığına doğru hafifçe renklenir.
    if (GOLD) target.copy(goldColor).lerp(white, 0.15);
    else target.set(flavors[sceneState.heroFlavor].theme.glow).lerp(white, 0.55);
    material.uniforms.u_tint.value.lerp(target, 0.03);
  });

  return <points geometry={geometry} material={material} frustumCulled={false} />;
}
