import * as THREE from 'three';

/*
  Ürün akışının sinematik arka planı (ayrı, sabit bir tuval; paketin arkasında, yazıların altında):
  ürün renginde parlayan merkez, yavaş akan duman, alttan dalgalanan parlak meyve suyu katmanları,
  paketin arkasından kıvrılarak geçen bir su şeridi, bulanık damlalar ve ince gren.
  Yalnızca ürünler bölümünün ekrandaki alanına (ve 3B incelemede tüm ekrana) çizilir.
*/
export function createJuice(canvas) {
  const mobile = () => window.innerWidth / window.innerHeight < 0.9 || window.innerWidth < 760;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true, premultipliedAlpha: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(mobile() ? 1 : Math.min(window.devicePixelRatio, 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const U = {
    uTime: { value: 0 }, uAspect: { value: 1.6 }, uMobile: { value: 0 },
    uA: { value: new THREE.Color() }, uB: { value: new THREE.Color() }, uBlend: { value: 0 },
    uC: { value: new THREE.Vector2(0.66, 0.5) }, uClip: { value: new THREE.Vector2(0, 1) },
  };
  const mat = new THREE.ShaderMaterial({
    uniforms: U,
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
    fragmentShader: /* glsl */ `
      uniform float uTime, uAspect, uMobile, uBlend;
      uniform vec3 uA, uB;
      uniform vec2 uC, uClip;
      varying vec2 vUv;
      float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float noise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
        return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y); }
      float fbm(vec2 p){ float s = 0.0, a = 0.5; for (int i = 0; i < 4; i++) { s += noise(p) * a; p *= 2.03; a *= 0.5; } return s; }

      void main(){
        vec2 uv = vUv;
        if (uv.y < uClip.x || uv.y > uClip.y) discard;
        float t = uTime;
        vec3 base = mix(uA, uB, uBlend);
        vec3 deep = base * vec3(0.38, 0.32, 0.3);
        vec3 sat = clamp(base * 1.4, 0.0, 1.0);
        vec3 light = mix(sat, vec3(1.0, 0.88, 0.7), 0.12);
        vec3 hi = mix(sat, vec3(1.0, 0.97, 0.92), 0.6);
        vec2 q = vec2(uv.x * uAspect, uv.y);

        // zemin: paketin arkasında parlayan hale, kenarlara doğru derinleşen renk
        vec2 p = (uv - uC) * vec2(uAspect, 1.0);
        float r = length(p);
        vec3 col = mix(light, base, smoothstep(0.0, 0.62, r));
        col = mix(col, deep * 1.6, smoothstep(0.5, 1.7, r) * 0.7);
        // yavaş akan duman
        float sm = fbm(q * 1.8 + vec2(t * 0.03, -t * 0.02));
        col *= 0.86 + 0.26 * sm;
        // paketin arkasından yayılan ışık huzmeleri
        float ang = atan(p.y, p.x);
        float rays = pow(0.5 + 0.5 * sin(ang * 11.0 + t * 0.12 + sm * 2.0), 3.0);
        col += hi * rays * smoothstep(1.1, 0.1, r) * 0.1;

        // paketin arkasından kıvrılarak geçen meyve suyu şeridi
        float rx = (uv.x - uC.x) * uAspect;
        float ry = uC.y - mix(0.14, 0.2, uMobile) + 0.16 * sin(rx * 2.4 + t * 0.35) + 0.05 * sin(rx * 6.0 - t * 0.5);
        float w = (0.028 + 0.022 * sin(rx * 3.0 + t * 0.4 + 1.0)) * smoothstep(1.6, 0.0, abs(rx));
        float dr = uv.y - ry;
        float band = smoothstep(w, w * 0.6, abs(dr));
        float side = mix(0.25, 1.0, smoothstep(-w, w, dr));
        vec3 rc = mix(deep * 1.3, sat, side);
        rc += hi * exp(-abs(dr - w * 0.55) * 300.0) * 0.6;
        float rmask = smoothstep(0.3, 0.55, uv.x) * (1.0 - uMobile * 0.35);
        col = mix(col, rc, band * rmask * 0.85);

        // alttan dalgalanan parlak meyve suyu (arkadan öne üç katman)
        float lift = smoothstep(0.15, 1.0, uv.x) * 0.1;
        for (int i = 0; i < 3; i++) {
          float fi = float(i);
          float y0 = mix(0.24 - fi * 0.075 + lift, uC.y - 0.3 - fi * 0.05, uMobile);
          float y = y0 + 0.032 * sin(q.x * 2.3 + t * (0.45 + fi * 0.12) + fi * 1.9)
                       + 0.014 * sin(q.x * 5.7 - t * (0.7 + fi * 0.1) + fi * 3.1);
          float d = uv.y - y;
          float body = smoothstep(0.003, -0.003, d);
          float depth = clamp(-d / 0.22, 0.0, 1.0);
          vec3 lc = mix(sat * 1.08, deep * 1.25, pow(depth, 0.7));
          // sıvının içinde ışık kırılmaları
          float caust = pow(0.5 + 0.5 * sin(q.x * 4.0 - uv.y * 22.0 + t * 0.8 + fi * 2.3 + sin(q.x * 9.0 + t) * 0.6), 14.0);
          lc += hi * caust * (1.0 - depth) * 0.3;
          col = mix(col, lc, body * (0.9 - fi * 0.08));
          // yüzeydeki parlak çizgi ve ince köpük
          float rim = exp(-abs(d) * 320.0) + exp(-abs(d + 0.01) * 110.0) * 0.28;
          col += hi * rim * (0.55 - fi * 0.1);
        }

        // bulanık damlalar (bokeh)
        float dmask = mix(smoothstep(0.38, 0.62, uv.x), 1.0 - smoothstep(0.42, 0.3, uv.y), uMobile);
        for (int k = 0; k < 2; k++) {
          float fk = float(k);
          vec2 g = q * (5.0 + fk * 4.0) + vec2(fk * 3.7, t * (0.04 + fk * 0.03));
          vec2 id = floor(g), f = fract(g) - 0.5;
          float h = hash(id + fk * 17.0);
          if (h > 0.72) {
            vec2 o = (vec2(hash(id + 3.1), hash(id + 7.7)) - 0.5) * 0.5;
            float rad = 0.1 + 0.16 * hash(id + 1.3);
            float dd = length(f - o);
            float disc = smoothstep(rad, rad * 0.55, dd);
            float ring = smoothstep(rad * 0.75, rad, dd) * smoothstep(rad * 1.12, rad, dd);
            float spec = smoothstep(rad * 0.35, 0.0, length(f - o - vec2(-rad, rad) * 0.38));
            float a = dmask * (0.6 - fk * 0.2);
            col = mix(col, light * 1.08, disc * 0.22 * a);
            col += hi * (ring * 0.22 + spec * 0.5) * a;
          }
        }

        // sinematik vinyet ve gren
        float v = smoothstep(1.45, 0.35, length((uv - vec2(0.55, 0.52)) * vec2(1.0, 1.15)));
        col *= mix(0.72, 1.0, v);
        col += (hash(uv * 800.0 + fract(t) * 37.0) - 0.5) * 0.02;
        gl_FragColor = vec4(max(col, 0.0), 1.0);
        #include <colorspace_fragment>
      }`,
    depthTest: false, depthWrite: false, toneMapped: false,
  });
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat);
  quad.frustumCulled = false;
  scene.add(quad);

  let shown = true;
  const show = (v) => { if (v !== shown) { shown = v; canvas.style.visibility = v ? 'visible' : 'hidden'; } };
  function resize() {
    renderer.setPixelRatio(mobile() ? 1 : Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    U.uAspect.value = window.innerWidth / window.innerHeight;
    U.uMobile.value = mobile() ? 1 : 0;
  }
  window.addEventListener('resize', resize);
  resize();

  return {
    // clip: ekranda görünen bant (alttan 0..1); boşsa çizilmez
    render({ a, b, blend, cx, cy, clipLo, clipHi, time }) {
      if (clipHi <= 0.001 || clipLo >= 0.999 || clipHi <= clipLo) { show(false); return; }
      show(true);
      U.uA.value.copy(a); U.uB.value.copy(b); U.uBlend.value = blend;
      U.uC.value.set(cx, cy);
      U.uClip.value.set(clipLo, clipHi);
      U.uTime.value = time;
      renderer.render(scene, camera);
    },
    hide() { show(false); },
  };
}
