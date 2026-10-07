import { useMemo } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';

/** 260 küçük beyaz toz zerresi, yavaşça yükselir */
export function Dust({ count = 260 }: { count?: number }) {
  const size = useThree((s) => s.size);
  const dpr = useThree((s) => s.viewport.dpr);
  const { geo, mat } = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const seed = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() * 2 - 1) * 10;
      pos[i * 3 + 1] = Math.random() * 7;
      pos[i * 3 + 2] = -7 + Math.random() * 11;
      seed[i] = Math.random();
    }
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
    const m = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { uTime: { value: 0 }, uScale: { value: 400 } },
      vertexShader: /* glsl */ `
        attribute float aSeed;
        uniform float uTime;
        uniform float uScale;
        varying float vA;
        void main() {
          vec3 p = position;
          p.y = mod(p.y + uTime * (0.05 + aSeed * 0.09), 7.0) - 1.6;
          p.x += sin(uTime * 0.2 + aSeed * 30.0) * 0.25;
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = (0.012 + aSeed * 0.02) * uScale / -mv.z;
          vA = (0.25 + 0.5 * fract(aSeed * 7.13)) * smoothstep(-1.6, -0.8, p.y) * (1.0 - smoothstep(4.4, 5.4, p.y));
        }
      `,
      fragmentShader: /* glsl */ `
        varying float vA;
        void main() {
          float d = length(gl_PointCoord - 0.5);
          float a = smoothstep(0.5, 0.0, d) * vA;
          gl_FragColor = vec4(vec3(1.0), a);
        }
      `,
    });
    return { geo: g, mat: m };
  }, [count]);

  useFrame((s) => {
    mat.uniforms.uTime.value = s.clock.elapsedTime;
    mat.uniforms.uScale.value = (size.height * dpr) / (2 * Math.tan((32 * Math.PI) / 360));
  });

  return <points geometry={geo} material={mat} frustumCulled={false} />;
}
