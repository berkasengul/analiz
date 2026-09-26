import { shaderMaterial } from "@react-three/drei";
import { extend } from "@react-three/fiber";
import { noise } from "./Noise";

// Ekranı kaplayan sinematik sahne: tadın şehir resmi arkada bulanık bir
// alacakaranlık manzarası olur; tepeden inen ışık huzmesi, kutunun altında
// ışık havuzu, süzülen bokeh ışıkları ve kenar karartması. Üstünde Codrops
// projesindeki radyal gürültü halkası.
export const BackgroundMaterial = shaderMaterial(
  {
    u_time: 0,
    u_progress: 1,
    u_aspect: 1,
    u_color: null,
    u_center: null,
    u_dark: 0,
    u_glow: null,
    u_edge: null,
    u_map1: null,
    u_map2: null,
    u_mix: 1,
    u_hasMap: 0,
    u_stage: 1,
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
    uniform vec3 u_glow;
    uniform vec3 u_edge;
    uniform sampler2D u_map1;
    uniform sampler2D u_map2;
    uniform float u_mix;
    uniform float u_hasMap;
    uniform float u_stage;

    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
    }

    varying vec2 vUv;

    ${noise}

    void main() {
      vec2 newUv = (vUv - u_center) * vec2(u_aspect, 1.);
      float dist = length(newUv);
      float screenDist = length((vUv - vec2(0.5)) * vec2(u_aspect, 1.));

      vec2 asp = vec2(u_aspect, 1.);
      float center = length((vUv - vec2(0.5, 0.55)) * vec2(u_aspect * 0.7, 1.));
      vec3 light = mix(u_glow, vec3(1.), 0.45);

      // Taban: ortada tadın ışığı, kenarlarda derin karanlık.
      vec3 base = mix(u_glow * 0.34, u_edge, smoothstep(0.0, 0.95, center));

      // Tadın şehri: etiketteki resim, bulanık ve alacakaranlıkta.
      if (u_hasMap > 0.5) {
        float band = smoothstep(0.0, 0.14, vUv.y) * (1. - smoothstep(0.44, 0.6, vUv.y));
        vec2 tuv = vec2(0.5 + (vUv.x - 0.5) * 0.5, mix(0.25, 0.49, clamp((vUv.y + 0.02) / 0.6, 0., 1.)));
        vec3 city = mix(texture2D(u_map1, tuv, 4.).rgb, texture2D(u_map2, tuv, 4.).rgb, u_mix);
        city = mix(city, u_glow, 0.3) * 0.27 * (1. - smoothstep(0.25, 1.15, center));
        base = mix(base, city, band * 0.9 * u_stage);
      }

      // Tepeden inen ışık huzmesi.
      vec2 bp = (vUv - vec2(0.5, 1.08)) * asp;
      float depth = -bp.y;
      float width = 0.06 + depth * 0.3;
      float beam = (1. - smoothstep(width * 0.35, width, abs(bp.x))) * smoothstep(0.0, 0.3, depth) * (1. - smoothstep(0.6, 1.1, depth));
      base += light * beam * 0.16 * u_stage;

      // Kutunun altında yumuşak ışık havuzu.
      float pool = 1. - smoothstep(0., 0.45, length((vUv - vec2(0.5, 0.1)) * vec2(u_aspect * 0.45, 2.4)));
      base += light * pool * 0.12 * u_stage;

      // Süzülen bokeh ışıkları (iki derinlik katmanı).
      for (int L = 0; L < 2; L++) {
        float fl = float(L);
        float sc = 7. + fl * 7.;
        vec2 p = vUv * asp * sc + vec2(fl * 3.7, u_time * (0.025 + 0.02 * fl));
        vec2 id = floor(p);
        vec2 f = fract(p) - 0.5;
        float h = hash(id + fl * 17.3);
        vec2 off = (vec2(hash(id + 3.1), hash(id + 7.7)) - 0.5) * 0.45;
        float r = 0.1 + 0.16 * hash(id + 11.9);
        float bok = (1. - smoothstep(r * 0.55, r, length(f - off))) * step(0.7, h);
        base += light * bok * (0.07 - 0.03 * fl) * smoothstep(0.15, 0.75, center);
      }

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
      vec3 col = base + ring * u_color * 1.6 + (grain - 0.5) * 0.018;
      // Kenar karartması.
      col *= 1. - 0.7 * smoothstep(0.35, 1.2, screenDist);
      // Sinematik mod: sahne kararır, kenarlarda koyu bir vinyet oluşur.
      col *= mix(1., 0.35 + 0.65 * (1. - smoothstep(0.25, 1.0, screenDist)), u_dark);

      gl_FragColor = vec4(col, 1.0);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }
  `
);

extend({ BackgroundMaterial });
