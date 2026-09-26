import { shaderMaterial } from "@react-three/drei";
import { extend } from "@react-three/fiber";
import { noise } from "./Noise";

// Ekranı kaplayan arka plan: koyu grafit degrade, alt köşelerde mor ve
// mavi ışık, üstünde Codrops projesindeki radyal gürültü halkası.
export const BackgroundMaterial = shaderMaterial(
  {
    u_time: 0,
    u_progress: 1,
    u_aspect: 1,
    u_color: null,
    u_center: null,
    u_dark: 0,
  },
  /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = vec4(position.xy, 0.9999, 1.0);
    }
  `,
  /* glsl */ `
    uniform float u_time;
    uniform float u_progress;
    uniform float u_aspect;
    uniform vec3 u_color;
    uniform vec2 u_center;
    uniform float u_dark;

    varying vec2 vUv;

    ${noise}

    void main() {
      vec2 newUv = (vUv - u_center) * vec2(u_aspect, 1.);
      float dist = length(newUv);
      float screenDist = length((vUv - vec2(0.5)) * vec2(u_aspect, 1.));

      // Taban: ortası hafif açık grafit, kenarlara doğru siyah.
      vec3 base = mix(vec3(0.05, 0.05, 0.055), vec3(0.004, 0.004, 0.005), smoothstep(0.05, 0.95, screenDist));
      vec2 bl = (vUv - vec2(0.12, -0.08)) * vec2(u_aspect, 1.);
      vec2 br = (vUv - vec2(0.9, -0.08)) * vec2(u_aspect, 1.);
      base += vec3(0.17, 0.03, 0.05) * (1. - smoothstep(0., 0.75, length(bl)));
      base += vec3(0.13, 0.09, 0.035) * (1. - smoothstep(0., 0.75, length(br)));

      float grain = fract(sin(dot(vUv, vec2(12.9898, 78.233) * 2000.0)) * 43758.5453);

      float radius = 1.5;
      float outerProgress = clamp(1.1 * u_progress, 0., 1.);
      float innerProgress = clamp(1.1 * u_progress - 0.05, 0., 1.);
      float innerCircle = 1. - smoothstep((innerProgress - 0.4) * radius, innerProgress * radius, dist);
      float outerCircle = 1. - smoothstep((outerProgress - 0.1) * radius, innerProgress * radius, dist);
      float displacement = outerCircle - innerCircle;

      // Pahalı gürültü yalnızca halkanın geçtiği piksellerde hesaplanır.
      float ring = 0.;
      if (displacement > 0.001) {
        float density = 1.8 - dist;
        float nz = cnoise(vec4(newUv * 40. * density, u_time, 1.));
        float dots = smoothstep(0.1, 0.15, nz);
        float n = 1. - step(.2, nz * 2.) * dots;
        ring = max(displacement - (n + nz) - grain * 0.3, 0.);
      }
      vec3 col = base + ring * u_color * 1.6 + (grain - 0.5) * 0.012;
      // Sinematik mod: sahne kararır, kenarlarda koyu bir vinyet oluşur.
      col *= mix(1., 0.35 + 0.65 * (1. - smoothstep(0.25, 1.0, screenDist)), u_dark);

      gl_FragColor = vec4(col, 1.0);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }
  `
);

extend({ BackgroundMaterial });
