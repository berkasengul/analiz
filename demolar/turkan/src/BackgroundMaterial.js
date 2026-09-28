import { shaderMaterial } from "@react-three/drei";
import { extend } from "@react-three/fiber";
import { Vector4 } from "three";
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
    u_accent: null,
    u_map1: null,
    u_map2: null,
    u_mix: 1,
    u_hasMap: 0,
    u_stage: 1,
    u_focusX: 0.5,
    u_studio: 0,
    // Ürünün sahne fotoğrafı (content → products[].stage): kaidesi 3B ürünün ayağına hizalanır.
    u_scene1: null,
    u_scene2: null,
    u_sp1: new Vector4(1, 0.6, 0.5, 0.35),
    u_sp2: new Vector4(1, 0.6, 0.5, 0.35),
    u_sceneMix: 1,
    u_sceneOn: 0,
    u_baseY: 0.4,
    u_bottleH: 0.35,
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
    uniform vec3 u_accent;
    uniform sampler2D u_map1;
    uniform sampler2D u_map2;
    uniform float u_mix;
    uniform float u_hasMap;
    uniform float u_stage;
    uniform float u_focusX;
    uniform float u_studio;
    uniform sampler2D u_scene1;
    uniform sampler2D u_scene2;
    uniform vec4 u_sp1;
    uniform vec4 u_sp2;
    uniform float u_sceneMix;
    uniform float u_sceneOn;
    uniform float u_baseY;
    uniform float u_bottleH;

    varying vec2 vUv;

    // Sahne fotoğrafı tek parça, ekranın tamamında: fotoğraftaki kaide çizgisi ürünün ayağına, kaidenin
    // ortası ürünün ortasına gelir. Boyu, en az ürünün ekrandaki boyuna uyacak kadar; ekranın dört kenarı da
    // dolacak kadar büyütülür (hiçbir yerde kenar ya da boşluk kalmaz).
    // sp = (en/boy, kaide çizgisi (üstten), orta (soldan), ürün boyu) — hepsi fotoğrafa oranla.
    vec3 sceneCover(sampler2D map, vec4 sp) {
      float b = sp.y;
      // Boy: ürünün ekrandaki boyuna uyar; üst ve alt kenar dolacak kadar büyütülür.
      float sH = u_bottleH / max(sp.w, 0.05);
      sH = max(sH, u_baseY / max(1. - b, 0.05));
      sH = max(sH, (1. - u_baseY) / max(b, 0.05));
      sH *= 1.01;
      float v = (1. - b) + (vUv.y - u_baseY) / sH;
      float u = sp.z + (vUv.x - u_focusX) * u_aspect / (sH * sp.x);
      // Yanlar: fotoğraf genişliği yetmezse sahnenin ayna yansımasıyla devam eder; kenara doğru daha
      // bulanık (alan derinliği), böylece dikiş görünmez ve ekranın her yeri dolar.
      float out_ = max(0., abs(u - 0.5) - 0.5);
      u = 1. - abs(mod(u, 2.) - 1.);
      float blur = 1.1 + 3.2 * smoothstep(0.0, 0.35, out_) + 1.2 * smoothstep(0.25, 0.5, abs(u - 0.5)) * step(0.0001, out_);
      return texture2D(map, clamp(vec2(u, v), 0.002, 0.998), blur).rgb * (1. - 0.35 * smoothstep(0., 0.5, out_));
    }

    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
    }

    ${noise}

    void main() {
      vec2 newUv = (vUv - u_center) * vec2(u_aspect, 1.);
      float dist = length(newUv);
      float screenDist = length((vUv - vec2(0.5)) * vec2(u_aspect, 1.));

      vec2 asp = vec2(u_aspect, 1.);
      float center = length((vUv - vec2(mix(0.5, u_focusX, 0.7), 0.55)) * vec2(u_aspect * 0.7, 1.));
      vec3 light = mix(u_glow, vec3(1.), 0.45);

      // Taban: ortada tadın ışığı, kenarlarda derin karanlık.
      vec3 base = mix(u_glow * 0.34, u_edge, smoothstep(0.0, 0.95, center));

      // Ürünün kendi atmosferi: ana ve ikinci renginden iki yumuşak, yavaş salınan
      // ışık bulutu ve kadife gibi düşük frekanslı doku (her ürün kendi tonlarında).
      float t = u_time * 0.06;
      vec2 pa = (vUv - vec2(0.22 + 0.06 * sin(t * 1.7), 0.72 + 0.05 * cos(t * 1.3))) * vec2(u_aspect * 0.8, 1.);
      vec2 pb = (vUv - vec2(0.8 + 0.05 * cos(t * 1.1), 0.3 + 0.06 * sin(t * 1.9))) * vec2(u_aspect * 0.8, 1.);
      // Hafif kadife dokusu (ucuz: birkaç sinüs, tam ekran gürültü yerine).
      vec2 vq = vUv * vec2(u_aspect, 1.);
      float velvet = 0.5 + 0.25 * sin(vq.x * 3.1 + t * 3.) * sin(vq.y * 2.3 - t * 2.1) + 0.25 * sin((vq.x + vq.y) * 1.7 + t * 1.3);
      base += u_accent * exp(-dot(pa, pa) * 3.2) * (0.22 + 0.1 * velvet);
      base += mix(u_glow, vec3(1.), 0.2) * exp(-dot(pb, pb) * 3.8) * (0.14 + 0.08 * velvet);
      base *= 0.9 + 0.2 * velvet;

      // Tadın şehri: etiketteki resim, bulanık ve alacakaranlıkta.
      if (u_hasMap > 0.5) {
        float band = smoothstep(0.0, 0.14, vUv.y) * (1. - smoothstep(0.44, 0.6, vUv.y));
        vec2 tuv = vec2(0.75 + (vUv.x - 0.5) * 0.46, mix(0.22, 0.56, clamp((vUv.y + 0.02) / 0.6, 0., 1.)));
        vec3 city = mix(texture2D(u_map1, tuv, 4.).rgb, texture2D(u_map2, tuv, 4.).rgb, u_mix);
        city = mix(city, u_glow, 0.3) * 0.27 * (1. - smoothstep(0.25, 1.15, center));
        base = mix(base, city, band * 0.9 * u_stage);
      }

      // Ürünün sahne fotoğrafı: stüdyo gibi hafif karanlık; tepeden inen ışık huzmesi ortadaki ürüne ve
      // kaideye vurur, ışığın düştüğü yerde sahne aydınlanır. Ürün değişince sahneler yumuşakça birbirine
      // karışır ve sahnenin tonu ürünün rengine doğru akar (renk geçişi).
      if (u_sceneOn > 0.001) {
        float k = smoothstep(0., 1., u_sceneMix);
        vec3 s2 = sceneCover(u_scene2, u_sp2);
        vec3 sc = k < 0.999 ? mix(sceneCover(u_scene1, u_sp1), s2, k) : s2;
        vec3 tint = u_glow / max(max(u_glow.r, max(u_glow.g, u_glow.b)), 0.001);
        float lum = dot(sc, vec3(0.299, 0.587, 0.114));
        sc = mix(sc, lum * tint * 1.35, 0.3);
        // Işık huzmesi: tepeden ürüne doğru genişleyen koni.
        float dx = (vUv.x - u_focusX) * u_aspect;
        float tt = clamp((1.12 - vUv.y) / max(1.12 - u_baseY, 0.1), 0., 1.4);
        float hw = 0.06 + tt * max(u_bottleH, 0.2) * 0.62;
        float cone = (1. - smoothstep(hw * 0.45, hw, abs(dx))) * smoothstep(0.05, 0.4, tt) * (1. - smoothstep(1.02, 1.3, tt));
        // Kaidede ışık havuzu (ürünün ayağının çevresi).
        vec2 q = vec2(dx, vUv.y - u_baseY) / vec2(max(u_bottleH, 0.2) * 0.95, max(u_bottleH, 0.2) * 0.3);
        float pool = exp(-dot(q, q) * 1.6);
        // Ürünün arkasında yumuşak parlaklık.
        vec2 g = vec2(dx, vUv.y - u_baseY - u_bottleH * 0.5) / vec2(max(u_bottleH, 0.2) * 0.9, max(u_bottleH, 0.2) * 0.8);
        float halo = exp(-dot(g, g) * 1.2);
        float read = u_aspect > 1. ? mix(0.62, 1., smoothstep(0.08, 0.5, vUv.x)) : mix(0.7, 1., smoothstep(0.08, 0.5, vUv.y));
        float lit = 0.3 + 0.5 * cone + 0.45 * pool + 0.3 * halo;
        base = mix(base, sc * lit * read, u_sceneOn);
      }

      // Stüdyo: sahne ürünün çevresi dışında kararır; ışık yalnızca öndeki ürünün olduğu yerde.
      // Hafif karartma: ürünün çevresi ürünün renginde parlak, kenarlara doğru koyulaşır (telefonda da).
      float spotD = length((vUv - vec2(u_focusX, 0.52)) * vec2(max(u_aspect * 0.62, 0.85), 0.9));
      base *= mix(1., 0.3 + 0.7 * (1. - smoothstep(0.1, 0.8, spotD)), u_studio * u_stage);

      // Tepeden inen ışık huzmesi (stüdyoda daha dar, daha parlak, içinde yavaş süzülen toz).
      vec2 bp = (vUv - vec2(u_focusX, 1.08)) * asp;
      float depth = -bp.y;
      float width = mix(0.06 + depth * 0.3, 0.05 + depth * 0.2, u_studio);
      float beam = (1. - smoothstep(width * 0.35, width, abs(bp.x))) * smoothstep(0.0, 0.3, depth) * (1. - smoothstep(mix(0.6, 0.5, u_studio), mix(1.1, 0.74, u_studio), depth));
      float haze = 0.75 + 0.25 * sin(bp.y * 9. + u_time * 0.35) * sin(bp.x * 23. - u_time * 0.2);
      base += light * beam * mix(0.16, 0.3 * haze, u_studio) * u_stage * (1. + 0.25 * u_sceneOn);

      // Kutunun altında yumuşak ışık havuzu.
      float pool = 1. - smoothstep(0., mix(0.45, 0.3, u_studio), length((vUv - vec2(u_focusX, mix(0.1, 0.37, u_studio))) * vec2(u_aspect * 0.45, 2.4)));
      base += light * pool * mix(0.12, 0.16, u_studio) * u_stage * (1. - u_sceneOn);

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

      // Ürün değişince: öndeki üründen yayılan yumuşak bir ışık dalgası. Kenarı
      // düşük frekanslı gürültüyle hafifçe dalgalanır; içinde ürünün renginde bir
      // parıltı kısa süre kalır ve söner (grenli halka yerine sinematik geçiş).
      vec3 col = base + (grain - 0.5) * 0.014;
      if (u_progress < 0.999) {
        float pr = u_progress;
        float ang = atan(newUv.y, newUv.x);
        float wob = 0.035 * sin(ang * 5. + u_time * 0.9) + 0.025 * sin(ang * 9. - u_time * 1.3);
        float R = pr * 1.55;
        float d = dist + wob;
        float wave = exp(-pow((d - R) / (0.07 + 0.16 * pr), 2.)) * pow(1. - pr, 1.3);
        float fill = (1. - smoothstep(0., max(R, 0.001), d)) * pow(1. - pr, 2.) * 0.5;
        vec3 wc = mix(u_color, vec3(1.), 0.3);
        col += wc * (wave * 0.42 + fill * 0.22);
      }
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
