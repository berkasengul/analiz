import { useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { AdditiveBlending, BufferAttribute, BufferGeometry, Color, Vector2 } from "three";

import { PRODUCTS, paletteOf, state } from "./state";

// Sayfanın arkasındaki canlı sahne (ayrı, sabit bir katman; şişenin ve yazıların arkasında):
// - kokunun kendi renginde aydınlık fon; koku değişince renk akarak geçer,
// - şişenin ardında ışık halesi, tepeden şişeye inen ışık huzmesi,
// - yavaşça akan ipek dalgalar (parlak sırtlar, yumuşak kıvrımlar),
// - vitrinde kaidenin altında fonu yansıtan parlak zemin ve ufuk çizgisinde ince ışık,
// - süzülen altın tozları.
// Şişenin ekrandaki yeri ve kaidenin zemini sahneden (Stage → state.focus, state.floor) okunur.
const PAL = PRODUCTS.map(paletteOf);

function Sky() {
  const size = useThree((s) => s.size);
  const u = useMemo(
    () => ({
      u_time: { value: 0 },
      u_aspect: { value: 1 },
      u_light: { value: new Color() },
      u_mid: { value: new Color() },
      u_deep: { value: new Color() },
      u_acc: { value: new Color() },
      u_focus: { value: new Vector2(0.5, 0.5) },
      u_floor: { value: 0.12 },
      u_floorOn: { value: 1 },
      u_page: { value: 0 },
    }),
    []
  );
  const init = useRef(false);
  const tgt = useMemo(() => ({ light: new Color(), mid: new Color(), deep: new Color(), acc: new Color() }), []);
  useFrame(({ clock }, delta) => {
    const dt = Math.min(delta, 0.1);
    const P = PAL[state.current];
    tgt.light.setRGB(...P.light);
    tgt.mid.setRGB(...P.mid);
    tgt.deep.setRGB(...P.deep);
    tgt.acc.setRGB(...P.accent);
    const k = init.current ? 1 - Math.exp(-2.4 * dt) : 1;
    init.current = true;
    u.u_light.value.lerp(tgt.light, k);
    u.u_mid.value.lerp(tgt.mid, k);
    u.u_deep.value.lerp(tgt.deep, k);
    u.u_acc.value.lerp(tgt.acc, k);
    u.u_time.value = clock.getElapsedTime();
    u.u_aspect.value = size.width / size.height;
    if (state.focus) u.u_focus.value.lerp(new Vector2(...state.focus), 1 - Math.exp(-6 * dt));
    if (state.floor != null) u.u_floor.value = state.floor;
    u.u_floorOn.value += ((state.heroOn ?? 1) - u.u_floorOn.value) * (1 - Math.exp(-6 * dt));
    u.u_page.value = window.scrollY / window.innerHeight;
  });
  return (
    <mesh frustumCulled={false} renderOrder={-1}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        uniforms={u}
        depthWrite={false}
        depthTest={false}
        vertexShader={/* glsl */ `
          varying vec2 v_uv;
          void main() { v_uv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
        `}
        fragmentShader={/* glsl */ `
          uniform float u_time, u_aspect, u_floor, u_floorOn, u_page;
          uniform vec3 u_light, u_mid, u_deep, u_acc;
          uniform vec2 u_focus;
          varying vec2 v_uv;
          float h(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
          float n(vec2 p) {
            vec2 i = floor(p), f = fract(p);
            vec2 w = f * f * (3.0 - 2.0 * f);
            return mix(mix(h(i), h(i + vec2(1, 0)), w.x), mix(h(i + vec2(0, 1)), h(i + vec2(1, 1)), w.x), w.y);
          }
          // İpek: birbirine karışan eğik dalgalar; sırtlar parlak, çukurlar gölgeli.
          float silk(vec2 p, float t) {
            float a = sin(p.x * 2.1 + p.y * 1.3 + sin(p.y * 1.7 - t * 0.21) * 1.9 + t * 0.12);
            float b = sin(p.x * 1.2 - p.y * 2.4 + sin(p.x * 1.1 + t * 0.17) * 2.3 - t * 0.09);
            float c = sin((p.x + p.y) * 3.3 + n(p * 1.4 + t * 0.05) * 3.0 - t * 0.15);
            return a * 0.5 + b * 0.35 + c * 0.15;
          }
          vec3 scene(vec2 uv) {
            vec2 p = (uv - u_focus) * vec2(u_aspect, 1.0);
            float t = u_time;
            // Fon: kenarlarda kokunun orta tonu, şişenin ardında aydınlık.
            float halo = exp(-dot(p, p) * 2.2);
            float core = exp(-dot(p, p) * 9.0);
            vec3 col = mix(u_mid, u_light, 0.25 + 0.75 * halo);
            col += vec3(1.0) * core * 0.18;
            // İpek dalgalar (sayfa kaydıkça yavaşça yukarı akar).
            vec2 q = vec2(uv.x * u_aspect, uv.y + u_page * 0.35);
            float s = silk(q * 1.25, t);
            float ridge = smoothstep(0.55, 0.98, s);
            float fold = smoothstep(-0.25, -0.9, s);
            col += vec3(1.0) * ridge * 0.16;
            col = mix(col, u_deep, fold * 0.22);
            col += u_acc * ridge * 0.05;
            // Tepeden şişeye inen ışık huzmesi.
            float bx = abs(uv.x - u_focus.x) * u_aspect;
            float width = 0.08 + (1.0 - uv.y) * 0.28;
            float beam = smoothstep(width, 0.0, bx) * smoothstep(u_focus.y - 0.25, 1.0, uv.y);
            col += vec3(1.0, 0.98, 0.94) * beam * 0.16;
            return col;
          }
          void main() {
            vec2 uv = v_uv;
            vec3 col = scene(uv);
            // Parlak zemin: kaidenin altından itibaren fonun yansıması; ufukta ince ışık.
            float fl = u_floor;
            if (u_floorOn > 0.01 && uv.y < fl) {
              float d = fl - uv.y;
              vec2 m = vec2(uv.x + sin(uv.y * 80.0 + u_time) * 0.0015, fl + d * 1.6);
              vec3 refl = scene(m);
              vec3 floorCol = mix(u_mid * 0.92, u_light, 0.25);
              vec3 f = mix(refl, floorCol, clamp(0.45 + d * 2.2, 0.0, 0.92));
              // Kaidenin altında ışık havuzu.
              vec2 pp = (uv - vec2(u_focus.x, fl)) * vec2(u_aspect * 0.6, 3.0);
              f += vec3(1.0) * exp(-dot(pp, pp) * 3.0) * 0.12;
              col = mix(col, f, u_floorOn);
            }
            float hz = exp(-pow((uv.y - fl) * 140.0, 2.0)) * u_floorOn;
            col += vec3(1.0) * hz * 0.18;
            // Köşeler kokunun derin tonuna kayar (sinematik vinyet).
            float vg = smoothstep(0.45, 1.25, length((uv - 0.5) * vec2(u_aspect * 0.75, 1.0)));
            col = mix(col, u_deep, vg * 0.55);
            // Film greni.
            col += (h(uv * 900.0 + fract(u_time) * 31.0) - 0.5) * 0.025;
            gl_FragColor = vec4(col, 1.0);
          }
        `}
      />
    </mesh>
  );
}

function Motes() {
  const geo = useMemo(() => {
    const n = 160;
    const pos = new Float32Array(n * 3);
    const seed = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      pos[i * 3] = Math.random() * 2 - 1;
      pos[i * 3 + 1] = Math.random() * 2 - 1;
      pos[i * 3 + 2] = 0;
      seed[i] = Math.random();
    }
    const g = new BufferGeometry();
    g.setAttribute("position", new BufferAttribute(pos, 3));
    g.setAttribute("seed", new BufferAttribute(seed, 1));
    return g;
  }, []);
  const u = useMemo(() => ({ u_time: { value: 0 }, u_dpr: { value: 1 }, u_page: { value: 0 } }), []);
  useFrame(({ clock, gl }) => {
    u.u_time.value = clock.getElapsedTime();
    u.u_dpr.value = gl.getPixelRatio();
    u.u_page.value = window.scrollY / window.innerHeight;
  });
  return (
    <points geometry={geo} frustumCulled={false}>
      <shaderMaterial
        uniforms={u}
        transparent
        depthWrite={false}
        depthTest={false}
        blending={AdditiveBlending}
        vertexShader={/* glsl */ `
          attribute float seed;
          uniform float u_time, u_dpr, u_page;
          varying float v_a;
          void main() {
            vec2 p = position.xy;
            p.y = mod(p.y + 1.0 + u_time * (0.012 + seed * 0.03) + u_page * (0.2 + seed * 0.5), 2.0) - 1.0;
            p.x += sin(u_time * 0.3 + seed * 20.0) * 0.03;
            gl_Position = vec4(p, 0.0, 1.0);
            v_a = (0.35 + 0.65 * seed) * (0.6 + 0.4 * sin(u_time * (1.0 + seed * 2.0) + seed * 30.0));
            gl_PointSize = (1.5 + seed * 3.5) * u_dpr;
          }
        `}
        fragmentShader={/* glsl */ `
          varying float v_a;
          void main() {
            float d = length(gl_PointCoord - 0.5);
            float a = smoothstep(0.5, 0.0, d) * v_a;
            gl_FragColor = vec4(vec3(1.0, 0.86, 0.55) * a, a);
          }
        `}
      />
    </points>
  );
}

export default function Backdrop() {
  return (
    <div className="backdrop" aria-hidden="true">
      <Canvas dpr={[1, 1.5]} gl={{ antialias: false, powerPreference: "high-performance" }} flat>
        <Sky />
        <Motes />
      </Canvas>
    </div>
  );
}
