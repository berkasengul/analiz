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
    u_floor: 0,
    u_arch: 0,
    u_tunnel: 0,
    u_tp: 0,
    u_bottleH: 0.35,
    u_sceneX: 0.5,
    u_sceneLight: 1,
    u_vivid: 0,
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
    uniform float u_floor;
    uniform float u_arch;
    uniform float u_tunnel;
    uniform float u_tp;
    uniform float u_bottleH;
    uniform float u_sceneX;
    uniform float u_sceneLight;
    uniform float u_vivid;

    varying vec2 vUv;

    // Sahne fotoğrafı tek parça, ekranın tamamında: fotoğraftaki kaide çizgisi ürünün ayağına, kaidenin
    // ortası ürünün ortasına gelir. Boyu, en az ürünün ekrandaki boyuna uyacak kadar; ekranın dört kenarı da
    // dolacak kadar büyütülür (hiçbir yerde kenar ya da boşluk kalmaz).
    // sp = (en/boy, kaide çizgisi (üstten), orta (soldan), ürün boyu) — hepsi fotoğrafa oranla.
    // Sinematik sahne: kademeli alan derinliği (ürünün çevresi keskin, uzağı yumuşak), suda canlı
    // dalgalanma, parlak altın detaylarda hafif ışıltı ve film tonu.
    float hash1(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
    }
    vec3 sceneCover(sampler2D map, vec4 sp) {
      float b = sp.y;
      // Boy: ürünün ekrandaki boyuna uyar; üst ve alt kenar dolacak kadar büyütülür.
      float sH = u_bottleH / max(sp.w, 0.05);
      sH = max(sH, u_baseY / max(1. - b, 0.05));
      sH = max(sH, (1. - u_baseY) / max(b, 0.05));
      sH *= 1.01;
      float v = (1. - b) + (vUv.y - u_baseY) / sH;
      float outv = 0.;
      float u = sp.z + (vUv.x - u_sceneX) * u_aspect / (sH * sp.x);
      // Kaidenin altındaki su: yansıma yavaşça dalgalanır.
      float below = smoothstep(0.02, 0.12, (1. - b) - v);
      u += below * (sin(v * 140. + u_time * 1.3) * 0.0022 + sin(v * 57. - u_time * 0.8) * 0.0016);
      // Yanlar: fotoğraf genişliği yetmezse ayna yansımasıyla devam eder (kenara doğru daha bulanık).
      float out_ = max(max(0., abs(u - 0.5) - 0.5), outv);
      u = 1. - abs(mod(u, 2.) - 1.);
      vec2 uv = clamp(vec2(u, v), 0.002, 0.998);
      // Alan derinliği: ürüne uzaklığa göre bulanıklık.
      float fd = length(vec2((vUv.x - u_sceneX) * u_aspect, vUv.y - u_baseY - u_bottleH * 0.3)) / max(u_bottleH * 2.2, 0.3);
      float blur = mix(mix(0.3, 2.3, smoothstep(0.25, 1.1, fd)), -0.2, u_vivid) + 3.2 * smoothstep(0.0, 0.35, out_);
      vec3 c = texture2D(map, uv, blur).rgb;
      // Işıltı: parlak altın detayların çevresine yumuşak ışık taşar.
      vec3 glow = texture2D(map, uv, blur + 3.5).rgb;
      c += max(glow - 0.32, 0.) * mix(0.55, 0.3, u_vivid);
      // Film tonu: gölgeler derin, ışıklar sıcak (canlı sahnede fotoğrafın kendi tonu).
      c = pow(max(c, 0.), vec3(mix(1.12, 1.02, u_vivid))) * 1.08;
      c *= vec3(1.03, 1.0, 0.95);
      return c * (1. - 0.35 * smoothstep(0., 0.5, out_));
    }

    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
    }

    // Ucuz değer gürültüsü ve fbm (duman için).
    float vnoise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      f = f * f * (3. - 2. * f);
      return mix(mix(hash(i), hash(i + vec2(1., 0.)), f.x), mix(hash(i + vec2(0., 1.)), hash(i + vec2(1., 1.)), f.x), f.y);
    }
    float fbm(vec2 p) {
      float v = 0.;
      float a = 0.5;
      for (int k = 0; k < 4; k++) {
        v += a * vnoise(p);
        p = p * 2.03 + vec2(1.7, 9.2);
        a *= 0.5;
      }
      return v;
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
        sc = mix(sc, lum * tint * 1.35, 0.3 * (1. - u_vivid));
        // Işık huzmesi: tepeden ürüne doğru genişleyen koni.
        float dx = (vUv.x - u_sceneX) * u_aspect;
        float tt = clamp((1.12 - vUv.y) / max(1.12 - u_baseY, 0.1), 0., 1.4);
        float hw = 0.06 + tt * max(u_bottleH, 0.2) * 0.62;
        float cone = (1. - smoothstep(hw * 0.45, hw, abs(dx))) * smoothstep(0.05, 0.4, tt) * (1. - smoothstep(1.02, 1.3, tt));
        // Huzmenin içinde ışık çizgileri (tepeden inen ince ışınlar), yavaşça kıpırdar.
        float rx = dx / max(hw, 0.02);
        cone *= 0.8 + 0.2 * sin(rx * 21. + sin(u_time * 0.3) * 2.) * sin(rx * 8.3 - u_time * 0.25);
        // Kaidede ışık havuzu (ürünün ayağının çevresi).
        vec2 q = vec2(dx, vUv.y - u_baseY) / vec2(max(u_bottleH, 0.2) * 0.95, max(u_bottleH, 0.2) * 0.3);
        float pool = exp(-dot(q, q) * 1.6);
        // Ürünün arkasında yumuşak parlaklık.
        vec2 g = vec2(dx, vUv.y - u_baseY - u_bottleH * 0.5) / vec2(max(u_bottleH, 0.2) * 0.9, max(u_bottleH, 0.2) * 0.8);
        float halo = exp(-dot(g, g) * 1.2);
        // Yazıların arkası (solda başlık, sağda notalar; telefonda altta) biraz daha koyu: yazılar net okunur.
        float read = u_aspect > 1.
          ? mix(0.5, 1., smoothstep(0.06, 0.46, vUv.x)) * mix(0.62, 1., smoothstep(0.97, 0.8, vUv.x))
          : mix(0.55, 1., smoothstep(0.06, 0.42, vUv.y));
        float lit = mix(0.36, 0.32 + 0.45 * cone + 0.4 * pool + 0.14 * halo, u_sceneLight);
        lit = mix(lit, mix(0.6, 0.97 + 0.08 * cone + 0.1 * pool, u_sceneLight), u_vivid);
        read = mix(read, sqrt(read), u_vivid * step(1., u_aspect));
        base = mix(base, sc * lit * read, u_sceneOn);
      }

      // Stüdyo: sahne ürünün çevresi dışında kararır; ışık yalnızca öndeki ürünün olduğu yerde.
      // Hafif karartma: ürünün çevresi ürünün renginde parlak, kenarlara doğru koyulaşır (telefonda da).
      float spotD = length((vUv - vec2(u_focusX, 0.52)) * vec2(max(u_aspect * 0.62, 0.85), 0.9));
      base *= mix(1., 0.3 + 0.7 * (1. - smoothstep(0.1, 0.8, spotD)), u_studio * u_stage * (1. - 0.8 * u_vivid * u_sceneOn));

      // Tepeden inen ışık huzmesi (stüdyoda daha dar, daha parlak, içinde yavaş süzülen toz).
      vec2 bp = (vUv - vec2(u_focusX, 1.08)) * asp;
      float depth = -bp.y;
      float width = mix(0.06 + depth * 0.3, 0.05 + depth * 0.2, u_studio);
      float beam = (1. - smoothstep(width * 0.35, width, abs(bp.x))) * smoothstep(0.0, 0.3, depth) * (1. - smoothstep(mix(0.6, 0.5, u_studio), mix(1.1, 0.74, u_studio), depth));
      float haze = 0.75 + 0.25 * sin(bp.y * 9. + u_time * 0.35) * sin(bp.x * 23. - u_time * 0.2);
      base += light * beam * mix(0.16, 0.3 * haze, u_studio) * u_stage * (1. - 0.4 * u_sceneOn - 0.45 * u_vivid * u_sceneOn);

      // Sahneli üründe atmosfer: kaidenin arkasından yükselen, ürünün renginde yavaş duman ve ekranda
      // süzülerek düşen yapraklar (iki derinlik: arkadakiler küçük ve yumuşak).
      if (u_sceneOn > 0.001) {
        vec3 tint = u_glow / max(max(u_glow.r, max(u_glow.g, u_glow.b)), 0.001);
        float bw = max(u_bottleH, 0.2);
        float sdx = (vUv.x - u_sceneX) * u_aspect;
        float sy = vUv.y - u_baseY;
        vec2 sp_ = vec2(sdx * 2.4, sy * 2.2 - u_time * 0.045);
        float sm = fbm(sp_ + vec2(fbm(sp_ * 1.3 + u_time * 0.02), 0.) * 1.4);
        float smMask = exp(-pow(sdx / (bw * 1.6), 2.)) * smoothstep(-0.12, 0.02, sy) * (1. - smoothstep(0.1, bw * 1.5, sy));
        float smoke = smoothstep(0.38, 0.85, sm) * smMask;
        base += mix(tint, vec3(1.), 0.35) * smoke * 0.2 * u_sceneOn * mix(0.5, 1., u_sceneLight);

        vec3 petalCol = mix(tint, vec3(1., 0.78, 0.86), 0.45);
        for (int L = 0; L < 2; L++) {
          float fl = float(L);
          float cells = 4.5 - fl * 1.6;
          vec2 pp = vUv * asp * cells + vec2(fl * 5.3, u_time * (0.05 + 0.04 * fl));
          vec2 id = floor(pp);
          vec2 f = fract(pp) - 0.5;
          float h = hash(id + fl * 13.1);
          if (h > 0.76) {
            float h2 = hash(id + 4.7);
            vec2 off = vec2((hash(id + 1.3) - 0.5) * 0.5 + 0.14 * sin(u_time * (0.6 + h2) + h * 6.28), (hash(id + 2.9) - 0.5) * 0.4);
            float ang = u_time * (0.4 + 0.6 * h2) + h * 6.28;
            vec2 q = f - off;
            q = mat2(cos(ang), -sin(ang), sin(ang), cos(ang)) * q;
            // Yaprak biçimi: bir ucu yuvarlak, öbür ucu sivri; telefonda daha küçük.
            vec2 r = vec2(0.075, 0.04) * (0.7 + 0.6 * h2) * (u_aspect < 1. ? 0.7 : 1.);
            r.y *= 0.45 + 0.55 * smoothstep(-1.1, 0.6, q.x / r.x);
            float e = length(q / r);
            float edge = mix(0.12, 0.3, 1. - fl);
            float petal = 1. - smoothstep(1. - edge, 1., e);
            float shade = 0.65 + 0.35 * clamp(q.x / r.x * 0.5 + 0.5, 0., 1.);
            base = mix(base, petalCol * shade * mix(0.55, 0.95, fl), petal * mix(0.4, 0.7, fl) * u_sceneOn);
          }
        }
      }

      // Kutunun altında yumuşak ışık havuzu.
      float pool = 1. - smoothstep(0., mix(0.45, 0.3, u_studio), length((vUv - vec2(u_focusX, mix(0.1, 0.37, u_studio))) * vec2(u_aspect * 0.45, 2.4)));
      base += light * pool * mix(0.12, 0.16, u_studio) * u_stage * (1. - u_sceneOn) * (1. - u_floor);

      // Parlak zemin (theme.carousel "rise", "glide"): ürünün arkasında renginde ışık patlaması, ayağının altında
      // koyu, cilalı bir zemin; ayakta ışık havuzu, zeminde ürünün renginde yumuşak yansıma ve ufuk parıltısı.
      if (u_floor > 0.001) {
        vec3 tint = u_glow / max(max(u_glow.r, max(u_glow.g, u_glow.b)), 0.001);
        float bw = max(u_bottleH, 0.2);
        float fdx = (vUv.x - u_sceneX) * u_aspect;
        float fy = vUv.y - u_baseY;
        vec2 c = vec2(fdx, fy - bw * 0.52);
        float ang = atan(c.y, c.x);
        float rays = 0.6 + 0.4 * (0.5 + 0.5 * sin(ang * 9. + 1.7 * sin(ang * 4. + u_time * 0.08)));
        float burst = exp(-pow(length(c / vec2(1.05, 1.2)) / (bw * 0.78), 2.)) * rays;
        base += mix(tint, vec3(1.), 0.2) * burst * 0.2 * u_floor * u_stage;
        // Mardin taşından kemerli koridor ("dolly"): iç içe yuvarlak kemerler ürünün ardındaki kaçış
        // noktasına doğru küçülür; kaydırınca (u_tp) bir sonraki kemer yaklaşır, en yakını kameranın
        // yanından geçip söner. Taş bal renginde; iç kenarı ürünün renginde ışık alır. Havada gül yaprakları.
        if (u_tunnel > 0.001) {
          vec2 vp = vec2(fdx, fy - bw * 0.42);
          float fr = fract(u_tp);
          for (int i = 0; i < 6; i++) {
            float s = 0.5 * pow(1.62, float(i) - fr);
            vec2 q = vp / s;
            vec2 a = vec2(abs(q.x), q.y + 0.42);
            float hs = 0.58, w = 0.6;
            float d = (a.y < hs ? max(a.x - w, -a.y) : length(vec2(a.x, a.y - hs)) - w) * s;
            float th = 0.05 * s;
            float band = smoothstep(-0.003, 0.002, d) * (1. - smoothstep(th - 0.003, th + 0.002, d));
            float near = 1. - smoothstep(1.7, 2.7, s);
            float far = smoothstep(0.14, 0.34, s);
            float lit = 1. - clamp(d / max(th, 0.001), 0., 1.);
            float depthC = 0.3 + 0.7 * smoothstep(0.2, 1.6, s);
            vec3 stone = vec3(0.74, 0.58, 0.39) * depthC * (0.55 + 0.6 * lit) + tint * lit * 0.12;
            // Taş dokusu: ince blok derzleri.
            float joint = smoothstep(0.93, 0.99, abs(fract(atan(a.y - hs, a.x) * 3.2 + (a.y < hs ? a.y * 5. : 0.)) * 2. - 1.));
            stone *= 1. - joint * 0.28;
            base = mix(base, stone, band * near * far * 0.92 * u_tunnel);
            // Kemerin içi biraz daha aydınlık (derinlikte ışık).
            base += tint * (1. - smoothstep(-0.02, 0.0, d)) * 0.012 * far * u_tunnel;
          }
          // Gül yaprakları: yavaşça süzülüp dönen, ürünün renginde ve pembe.
          vec3 petalC = mix(tint, vec3(1., 0.72, 0.8), 0.55);
          for (int L = 0; L < 2; L++) {
            float fl = float(L);
            float cells = 5. - fl * 1.8;
            vec2 pp = vUv * asp * cells + vec2(fl * 4.1, u_time * (0.05 + 0.035 * fl));
            vec2 id = floor(pp);
            vec2 f = fract(pp) - 0.5;
            float h = hash(id + fl * 9.7);
            if (h > 0.8) {
              float h2 = hash(id + 3.3);
              vec2 off = vec2((hash(id + 1.7) - 0.5) * 0.5 + 0.12 * sin(u_time * (0.5 + h2) + h * 6.28), (hash(id + 2.3) - 0.5) * 0.4);
              float ang = u_time * (0.35 + 0.5 * h2) + h * 6.28;
              vec2 q = mat2(cos(ang), -sin(ang), sin(ang), cos(ang)) * (f - off);
              vec2 r = vec2(0.07, 0.042) * (0.7 + 0.5 * h2) * (u_aspect < 1. ? 0.7 : 1.);
              r.y *= 0.45 + 0.55 * smoothstep(-1.1, 0.6, q.x / r.x);
              float e = length(q / r);
              float petal = 1. - smoothstep(0.75, 1., e);
              base = mix(base, petalC * (0.6 + 0.4 * clamp(q.x / r.x * 0.5 + 0.5, 0., 1.)) * mix(0.5, 0.9, fl), petal * mix(0.35, 0.65, fl) * u_tunnel);
            }
          }
        }
        float below = 1. - smoothstep(-0.02, 0.012, fy);
        base *= mix(1., 0.5 + 0.5 * smoothstep(-0.4, 0., fy), below * u_floor * exp(-pow(fdx / (bw * 3.), 2.)));
        vec2 q = vec2(fdx / (bw * 0.95), (fy + 0.018) / (bw * 0.1));
        base += mix(tint, vec3(1.), 0.45) * exp(-dot(q, q)) * 0.3 * u_floor * u_stage;
        float refl = exp(-pow(fdx / (bw * 0.24), 4.)) * below * exp(fy / (bw * 0.3));
        base += tint * refl * 0.14 * u_floor * u_stage;
        float hz = exp(-pow(fy / 0.006, 2.)) * exp(-pow(fdx / (bw * 1.3), 2.));
        base += mix(tint, vec3(1.), 0.6) * hz * 0.1 * u_floor * u_stage;

        // Osmanlı kemeri ("glide"): ürünün çevresinde sivri kemerli bir niş. İçi ürünün renginde ışıkla
        // dolar, tepesinde mukarnası andıran ince oluklar; kenarında iki altın çizgi ve aralarında sekiz
        // köşeli yıldız dizisi; çizgilerde yavaşça yukarı süzülen bir parıltı, kemer ayaklarında başlıklar,
        // tepede hilalli alem.
        if (u_arch > 0.001) {
          float w = bw * 0.45;
          float r = w * 1.45;
          float h0 = bw * 0.5;
          float peak = h0 + 1.38 * w;
          float ax = abs(fdx);
          float dArc = length(vec2(ax - (w - r), fy - h0)) - r;
          float dSide = ax - w;
          float dA = fy < h0 ? max(dSide, -fy - 0.02) : dArc;
          float inside = 1. - smoothstep(-0.03, 0.004, dA);
          float top = clamp(fy / peak, 0., 1.);
          float fadeB = smoothstep(-0.03, 0.05, fy);

          // Nişin içi: üstte daha derin, ürünün renginde yumuşak ışık; tepede ince dikey oluklar.
          float flute = (0.5 + 0.5 * cos(fdx / w * 3.14159 * 7.)) * smoothstep(h0 * 0.9, peak, fy);
          base = mix(base, base * 0.68 + tint * (0.09 + 0.17 * (1. - top)) + tint * flute * 0.05, inside * 0.6 * u_arch);
          // İç kenarda ince ışık (nişin derinliği).
          base += tint * exp(-pow((dA + 0.012) / 0.01, 2.)) * 0.12 * inside * u_arch * u_stage;

          // Metalik altın: dikeyde koyudan açığa, zamanla çizgi boyunca yukarı süzülen parıltı.
          vec3 goldD = vec3(0.55, 0.38, 0.17);
          vec3 goldL = vec3(1., 0.86, 0.58);
          float glint = exp(-pow((top - fract(u_time * 0.06) * 1.25 + 0.1) / 0.06, 2.));
          vec3 gold = mix(goldD, goldL, 0.45 + 0.35 * sin(fy * 38. + fdx * 9.) * 0.5 + 0.3 * top) + goldL * glint * 1.6;

          float band = 0.022;
          float line1 = exp(-pow(dA / 0.0024, 2.));
          float line2 = exp(-pow((dA - band) / 0.0016, 2.));
          float line0 = exp(-pow((dA + 0.009) / 0.0009, 2.)) * 0.5;
          // Çizgiler arasında sekiz köşeli yıldızlar (iki dönük kare) ve aralarında küçük noktalar.
          float inBand = smoothstep(0.003, 0.006, dA) * (1. - smoothstep(band - 0.006, band - 0.003, dA));
          vec2 sp = vec2(fdx, fy) / (band * 0.95);
          vec2 cell = fract(sp) - 0.5;
          vec2 q1 = abs(cell);
          vec2 q2 = abs(mat2(0.7071, -0.7071, 0.7071, 0.7071) * cell);
          float star = 1. - smoothstep(0.2, 0.26, min(max(q1.x, q1.y), max(q2.x, q2.y)));
          float starEdge = star - (1. - smoothstep(0.12, 0.18, min(max(q1.x, q1.y), max(q2.x, q2.y))));
          float pattern = inBand * (starEdge * 0.8 + star * 0.12);
          float bloom = exp(-abs(dA) / 0.018) * 0.08;
          base += gold * (line1 * 0.7 + line2 * 0.45 + line0 + pattern * 0.55 + bloom) * fadeB * u_arch * u_stage;

          // Kemer ayaklarında başlıklar (kemerin başladığı yerde ve zeminde).
          for (int k = 0; k < 2; k++) {
            float yy = k == 0 ? h0 : 0.004;
            vec2 cp = vec2(ax - (w + band * 0.5), fy - yy);
            float capital = 1. - smoothstep(0., 0.0018, max(abs(cp.x) - band * 0.62, abs(cp.y) - 0.0026));
            base += gold * capital * 0.4 * u_arch * u_stage;
          }

          // Alem: tepede küçük bir top, ince çubuk ve hilal.
          vec2 al = vec2(fdx, fy - peak - band);
          float ball = 1. - smoothstep(0.003, 0.0045, length(al - vec2(0., 0.009)));
          float rod = (1. - smoothstep(0.0009, 0.0018, abs(al.x))) * step(0., al.y) * step(al.y, 0.028);
          float moon = (1. - smoothstep(0.0065, 0.0078, length(al - vec2(0., 0.036)))) * smoothstep(0.0052, 0.0066, length(al - vec2(0.003, 0.039)));
          base += gold * max(max(ball, rod * 0.8), moon) * 0.8 * u_arch * u_stage;
        }
      }

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
      col *= 1. - 0.7 * (1. - 0.6 * u_vivid * u_sceneOn) * smoothstep(0.35, 1.2, screenDist);
      // Sinematik mod: sahne kararır, kenarlarda koyu bir vinyet oluşur.
      col *= mix(1., 0.35 + 0.65 * (1. - smoothstep(0.25, 1.0, screenDist)), u_dark);

      gl_FragColor = vec4(col, 1.0);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }
  `
);

extend({ BackgroundMaterial });
