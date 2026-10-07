import { useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { palette, floor } from './rigState';
import { prefersReducedMotion, settleInstantly } from '../store';

/** Ufuk ışığı bandının ekrandaki yüksekliği (alttan, 0..1) */
export const HORIZON = 0.4;

const vertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.9999, 1.0);
  }
`;

const fragment = /* glsl */ `
  uniform vec3 uColor;
  uniform vec3 uDark;
  uniform float uTime;
  uniform float uAspect;
  uniform float uHorizon;
  uniform vec2 uCenter;
  varying vec2 vUv;

  float hash(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
  float noise(vec3 x) {
    vec3 i = floor(x); vec3 f = fract(x); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(hash(i + vec3(0,0,0)), hash(i + vec3(1,0,0)), f.x),
                   mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
               mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
                   mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);
  }
  // Arka planın tasarlanan rengi ekranda birebir görünsün diye: three'nin ACES eğrisinin tersi.
  // (Sahne sonunda ACES Filmic ton eşleme uygulanıyor; şişeler ACES ile, fon ise tam renginde.)
  vec3 inverseACES(vec3 srgbLinear) {
    const mat3 outInv = mat3(
      vec3(0.643038, 0.059269, 0.005962),
      vec3(0.311187, 0.931436, 0.063929),
      vec3(0.045775, 0.009295, 0.930118)
    );
    const mat3 inInv = mat3(
      vec3(1.764741, -0.147028, -0.036337),
      vec3(-0.675778, 1.160252, -0.162436),
      vec3(-0.088963, -0.013224, 1.198773)
    );
    vec3 y = clamp(outInv * clamp(srgbLinear, 0.0, 1.0), 0.0, 0.985);
    vec3 a = 0.983729 * y - 1.0;
    vec3 b = 0.4329510 * y - 0.0245786;
    vec3 c = 0.238081 * y + 0.000090537;
    vec3 v = (-b - sqrt(max(b * b - 4.0 * a * c, 0.0))) / (2.0 * a);
    return max(inInv * v, 0.0) * 0.6;
  }

  float fbm(vec3 p) {
    float v = 0.0; float a = 0.5;
    for (int i = 0; i < 4; i++) { v += a * noise(p); p *= 2.03; a *= 0.5; }
    return v;
  }

  void main() {
    vec2 uv = vUv;
    vec2 p = (uv - uCenter) * vec2(uAspect, 1.0);

    vec3 halo = mix(uColor, vec3(1.0), 0.55);
    vec3 edge = mix(uColor, uDark, 0.75);

    // kenarlara ve üste doğru koyulaşma
    float d = length(p * vec2(0.62, 0.9));
    vec3 col = mix(uColor, edge, smoothstep(0.15, 1.15, d));
    col = mix(col, edge, smoothstep(0.62, 1.0, uv.y) * 0.65);

    // şişenin arkasında yumuşak, parlak hale
    float h = exp(-dot(p * vec2(1.35, 1.05), p * vec2(1.35, 1.05)) * 5.0);
    col = mix(col, halo, h * 0.62);

    // yavaş akan fbm sis
    vec3 q = vec3(p * 1.7 + vec2(uTime * 0.03, uTime * 0.012), uTime * 0.03);
    float n = fbm(q + fbm(q * 0.7 + 3.1));
    col *= 0.86 + 0.28 * n;
    col = mix(col, halo, smoothstep(0.55, 0.85, n) * 0.08 * (1.0 - uv.y));

    // ince, parlak ufuk ışığı bandı
    float dy = uv.y - uHorizon;
    float wide = exp(-pow(dy / 0.075, 2.0));
    float thin = exp(-pow(dy / 0.0045, 2.0));
    float span = exp(-p.x * p.x * 0.55);
    vec3 bandCol = mix(uColor, vec3(1.0), 0.7);
    col += bandCol * (wide * 0.22 + thin * 0.55) * (0.35 + 0.65 * span);

    // ufkun altı: zemin tonu (yansıyan zemin bunun üstünde)
    col = mix(col, mix(edge, uColor, 0.35), smoothstep(0.0, -0.18, dy) * 0.55);

    // vinyet
    float v = length((uv - 0.5) * vec2(uAspect * 0.62, 1.0));
    col *= mix(1.0, 0.38, smoothstep(0.35, 0.95, v));

    gl_FragColor = vec4(inverseACES(col), 1.0);
    #include <colorspace_fragment>
  }
`;

export function Backdrop() {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: vertex,
        fragmentShader: fragment,
        depthWrite: false,
        depthTest: false,
        toneMapped: false,
        uniforms: {
          uColor: { value: palette.current.color },
          uDark: { value: palette.current.dark },
          uTime: { value: 0 },
          uAspect: { value: 1 },
          uHorizon: { value: HORIZON },
          uCenter: { value: palette.center },
        },
      }),
    [],
  );

  useFrame((state, dt) => {
    // renk geçişi: üstel yaklaşım (~1.2 sn'de oturur)
    const k = prefersReducedMotion() || settleInstantly() ? 1 : 1 - Math.exp(-Math.min(dt, 0.1) * 2.6);
    palette.current.color.lerp(palette.target.color, k);
    palette.current.tint.lerp(palette.target.tint, k);
    palette.current.dark.lerp(palette.target.dark, k);
    palette.center.lerp(palette.centerTarget, settleInstantly() ? 1 : 1 - Math.exp(-Math.min(dt, 0.1) * 4));
    mat.uniforms.uHorizon.value = floor.horizon;
    mat.uniforms.uTime.value = state.clock.elapsedTime;
    mat.uniforms.uAspect.value = state.size.width / Math.max(1, state.size.height);
  });

  return (
    <mesh renderOrder={-1000} frustumCulled={false} material={mat}>
      <planeGeometry args={[2, 2]} />
    </mesh>
  );
}
