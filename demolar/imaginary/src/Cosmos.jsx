import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { AdditiveBlending, BufferAttribute, BufferGeometry, Color, DoubleSide, MathUtils, Vector3 } from "three";

import { flavors } from "./data";
import { scrollState } from "./scroll";
import { sceneState } from "./shared";
import { useStore } from "./store";
import { THEME } from "./theme";

// Kozmik sahne (theme.cosmos): kapakları gezegene benzeyen şişeler için (Reinvented).
// - Yıldız alanı: üç derinlikte yıldızlar; parıldar, kaydırınca derinliğine göre kayar (yakındakiler hızlı),
//   ürün geçişinde hız çizgisi gibi uzar.
// - Bulutsu: öndeki kokunun renginde ağır ağır dönen gaz bulutu (fbm gürültü); koku değişince renk akar.
// - Yörünge: öndeki şişenin küre kapağının çevresinde eğik ince halkalar ve halkada dolanan küçük bir ay.
//   Kapak şişenin önünde kalan yarıyı örter (derinlik testi), arkadaki yarı kapağın ardında kaybolur.
// theme.cosmos: true ya da { stars, nebula, orbit, capRatio } (capRatio: kapak küresinin yarıçapı / şişe boyu).
const C = THEME.cosmos === true ? {} : THEME.cosmos ?? {};
const PHONE = typeof window !== "undefined" && window.matchMedia("(max-width: 900px), (pointer: coarse)").matches;
const P = new Vector3();

function Stars() {
  const ref = useRef();
  const geo = useMemo(() => {
    const n = PHONE ? 1400 : C.stars ?? 2600;
    const pos = new Float32Array(n * 3);
    const seed = new Float32Array(n * 2);
    for (let i = 0; i < n; i++) {
      // Derinlik katmanı: 0 yakın, 1 uzak. Uzaktakiler çok, yakındakiler az.
      const d = Math.pow(Math.random(), 0.6);
      const z = -8 - d * 70;
      const spread = (18 - z) * 0.62;
      pos[i * 3] = (Math.random() * 2 - 1) * spread * 1.4;
      pos[i * 3 + 1] = (Math.random() * 2 - 1) * spread;
      pos[i * 3 + 2] = z;
      seed[i * 2] = Math.random();
      seed[i * 2 + 1] = d;
    }
    const g = new BufferGeometry();
    g.setAttribute("position", new BufferAttribute(pos, 3));
    g.setAttribute("seed", new BufferAttribute(seed, 2));
    return g;
  }, []);
  const uniforms = useMemo(() => ({ u_time: { value: 0 }, u_shift: { value: 0 }, u_warp: { value: 0 }, u_tint: { value: new Color("#fff") }, u_dpr: { value: 1 }, u_alpha: { value: 1 } }), []);
  const l = useRef({ p: 0, v: 0 });
  useFrame(({ clock, gl }, delta) => {
    const dt = Math.min(delta, 0.1);
    const u = uniforms;
    u.u_time.value = clock.getElapsedTime();
    u.u_dpr.value = gl.getPixelRatio();
    // Kaydırma: ürün sırası (p) ve sayfa aşağı indikçe yıldızlar kayar; hız (geçiş) çizgileri uzatır.
    const target = scrollState.p * 3.2 + (scrollState.ritualIn + scrollState.shopIn) * 2.5;
    const prev = l.current.p;
    l.current.p = MathUtils.damp(prev, target, 5, dt);
    const v = Math.abs(l.current.p - prev) / Math.max(dt, 1e-3);
    l.current.v = MathUtils.damp(l.current.v, Math.min(v, 6), 6, dt);
    u.u_shift.value = l.current.p;
    u.u_warp.value = l.current.v;
    u.u_tint.value.set(flavors[sceneState.heroFlavor]?.theme?.drop ?? "#ffffff").lerp(new Color("#ffffff"), 0.75);
    u.u_alpha.value = MathUtils.damp(u.u_alpha.value, useStore.getState().detail ? 0.55 : 1, 3, dt);
  });
  return (
    <points ref={ref} geometry={geo} frustumCulled={false} renderOrder={-0.5}>
      <shaderMaterial
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={AdditiveBlending}
        vertexShader={/* glsl */ `
          attribute vec2 seed;
          uniform float u_time, u_shift, u_warp, u_dpr;
          varying float v_a;
          varying float v_warp;
          void main() {
            vec3 p = position;
            float near = 1.0 - seed.y;
            // Yakındaki yıldızlar daha hızlı kayar (derinlik), alan dikeyde sarılır.
            float span = (18.0 - p.z) * 1.24;
            p.y = mod(p.y + u_shift * (0.6 + 2.6 * near) + span * 0.5, span) - span * 0.5;
            p.x += sin(u_time * 0.03 + seed.x * 6.28) * 0.4 * near;
            vec4 mv = modelViewMatrix * vec4(p, 1.0);
            gl_Position = projectionMatrix * mv;
            float tw = 0.55 + 0.45 * sin(u_time * (0.6 + seed.x * 2.4) + seed.x * 40.0);
            v_a = (0.25 + 0.75 * near) * tw;
            v_warp = u_warp * near;
            gl_PointSize = (0.9 + 2.6 * near * near + v_warp * 2.5) * u_dpr * (seed.x > 0.985 ? 2.2 : 1.0);
          }
        `}
        fragmentShader={/* glsl */ `
          uniform vec3 u_tint;
          uniform float u_alpha;
          varying float v_a;
          varying float v_warp;
          void main() {
            vec2 c = gl_PointCoord - 0.5;
            // Geçişte yıldız dikey çizgiye uzar (hız hissi).
            c.x *= 1.0 + v_warp * 1.6;
            float d = length(c);
            float core = smoothstep(0.5, 0.0, d);
            float a = core * core * v_a * u_alpha;
            if (a < 0.01) discard;
            gl_FragColor = vec4(u_tint * a, a);
          }
        `}
      />
    </points>
  );
}

function Nebula() {
  const size = useThree((s) => s.size);
  const uniforms = useMemo(
    () => ({ u_time: { value: 0 }, u_a: { value: new Color() }, u_b: { value: new Color() }, u_aspect: { value: 1 }, u_shift: { value: 0 }, u_alpha: { value: 1 }, u_oct: { value: PHONE ? 3 : 5 } }),
    []
  );
  const tA = useMemo(() => new Color(), []);
  const tB = useMemo(() => new Color(), []);
  const l = useRef({ init: false });
  useFrame(({ clock }, delta) => {
    const dt = Math.min(delta, 0.1);
    const u = uniforms;
    const f = flavors[sceneState.heroFlavor];
    // Gaz bulutunun iki rengi: kokunun sahne rengi (koyu) ve vurgu rengi (kapak).
    tA.set(f?.theme?.glow ?? "#20223a");
    tB.set(f?.theme?.drop ?? f?.color ?? "#d6aa5c");
    if (!l.current.init) {
      u.u_a.value.copy(tA);
      u.u_b.value.copy(tB);
      l.current.init = true;
    }
    const k = 1 - Math.exp(-1.6 * dt);
    u.u_a.value.lerp(tA, k);
    u.u_b.value.lerp(tB, k);
    u.u_time.value = clock.getElapsedTime();
    u.u_aspect.value = size.width / size.height;
    u.u_shift.value = MathUtils.damp(u.u_shift.value, scrollState.p * 0.35 + scrollState.ritualIn * 0.4, 3, dt);
    u.u_alpha.value = MathUtils.damp(u.u_alpha.value, useStore.getState().detail ? 0.5 : 1, 3, dt);
  });
  return (
    // Tam ekran, en uzak derinlikte: Background'un üstüne eklenir, şişe derinlik testiyle önünde kalır.
    <mesh renderOrder={-0.8} frustumCulled={false}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={AdditiveBlending}
        vertexShader={/* glsl */ `
          varying vec2 v_uv;
          void main() { v_uv = uv; gl_Position = vec4(position.xy, 0.999, 1.0); }
        `}
        fragmentShader={/* glsl */ `
          uniform float u_time, u_aspect, u_shift, u_alpha;
          uniform int u_oct;
          uniform vec3 u_a, u_b;
          varying vec2 v_uv;
          float h(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
          float n(vec2 p) {
            vec2 i = floor(p), f = fract(p);
            vec2 u = f * f * (3.0 - 2.0 * f);
            return mix(mix(h(i), h(i + vec2(1, 0)), u.x), mix(h(i + vec2(0, 1)), h(i + vec2(1, 1)), u.x), u.y);
          }
          float fbm(vec2 p) {
            float s = 0.0, a = 0.5;
            for (int i = 0; i < 6; i++) {
              if (i >= u_oct) break;
              s += a * n(p);
              p = mat2(1.6, 1.2, -1.2, 1.6) * p;
              a *= 0.5;
            }
            return s;
          }
          void main() {
            vec2 p = (v_uv - 0.5) * vec2(u_aspect, 1.0);
            p.y += u_shift;
            float t = u_time * 0.018;
            // Alanı kendi içinde büken gürültü: ağır dönen gaz kolları.
            vec2 q = vec2(fbm(p * 1.4 + t), fbm(p * 1.4 - t + 4.3));
            float d = fbm(p * 1.8 + q * 1.6 + vec2(t * 0.6, -t));
            float dust = fbm(p * 5.0 - q * 2.0);
            // Merkezde (şişenin arkasında) yoğun, kenarlarda söner.
            float r = length((v_uv - vec2(0.56, 0.52)) * vec2(u_aspect * 0.8, 1.0));
            float fall = smoothstep(1.15, 0.1, r);
            float gas = smoothstep(0.35, 0.95, d) * fall;
            vec3 col = mix(u_a * 2.2, u_b, smoothstep(0.42, 0.9, d)) * gas * 0.9;
            // Koyu toz şeritleri gazı keser (derinlik).
            col *= 0.55 + 0.45 * smoothstep(0.25, 0.65, dust);
            // Şişenin ardında yumuşak ışık (kapağın rengi).
            col += u_b * 0.08 * smoothstep(0.55, 0.0, r);
            gl_FragColor = vec4(col * u_alpha, 1.0);
          }
        `}
      />
    </mesh>
  );
}

// Kapak küresinin çevresinde eğik yörünge halkaları ve dolanan ay.
function Orbit() {
  const group = useRef();
  const moon = useRef();
  const rings = useRef([]);
  const color = useMemo(() => new Color(), []);
  const l = useRef({ on: 0 });
  const capRatio = C.capRatio ?? 0.125;
  useFrame(({ clock }, delta) => {
    const dt = Math.min(delta, 0.1);
    const st = useStore.getState();
    const f = sceneState.focus;
    const g = group.current;
    if (!g) return;
    const on =
      f.top != null && f.bottom != null && !st.detail && st.loaded
        ? (1 - scrollState.ritualIn) * (1 - scrollState.shopIn) * Math.min(1, sceneState.intro ?? 1)
        : 0;
    // Geçişte (kesirli sıra) halka söner, yeni şişe yerine oturunca yeniden belirir.
    const fr = scrollState.p - Math.floor(scrollState.p);
    const settle = 1 - Math.sin(Math.PI * fr);
    l.current.on = MathUtils.damp(l.current.on, on * settle * settle, 5, dt);
    const o = l.current.on;
    g.visible = o > 0.01;
    if (!g.visible) return;
    const sc = f.scale || 1;
    const H = (f.top - f.bottom) * sc;
    const R = capRatio * H;
    // Kapağın ortası: şişenin tepesinden bir yarıçap aşağı.
    P.copy(f.position);
    P.y += f.top * sc - R;
    g.position.copy(P);
    g.scale.setScalar(R);
    const t = clock.getElapsedTime();
    g.rotation.set(1.22 + Math.sin(t * 0.21) * 0.05, 0, 0.32 + Math.sin(t * 0.17) * 0.04);
    color.set(flavors[sceneState.heroFlavor]?.theme?.drop ?? THEME.accent ?? "#d6aa5c").lerp(new Color("#ffffff"), 0.25);
    rings.current.forEach((m, i) => {
      if (!m) return;
      m.material.color.copy(color);
      m.material.opacity = o * [0.75, 0.32, 0.18][i];
      m.rotation.z = t * [0.12, -0.07, 0.04][i];
    });
    if (moon.current) {
      const a = t * 0.55;
      moon.current.position.set(Math.cos(a) * 1.75, Math.sin(a) * 1.75, 0);
      moon.current.material.opacity = o;
      moon.current.material.color.copy(color);
    }
  });
  const ring = (r0, r1, i, seg = 160) => (
    <mesh key={i} ref={(m) => (rings.current[i] = m)} renderOrder={2}>
      <ringGeometry args={[r0, r1, seg, 1]} />
      <meshBasicMaterial transparent depthWrite={false} side={DoubleSide} blending={AdditiveBlending} toneMapped={false} />
    </mesh>
  );
  return (
    <group ref={group} visible={false}>
      {ring(1.72, 1.76, 0)}
      {ring(2.05, 2.065, 1)}
      {ring(2.5, 2.51, 2)}
      <mesh ref={moon} renderOrder={3}>
        <sphereGeometry args={[0.06, 16, 12]} />
        <meshBasicMaterial transparent depthWrite={false} toneMapped={false} />
      </mesh>
    </group>
  );
}

export default function Cosmos() {
  return (
    <>
      {C.nebula !== false && <Nebula />}
      {C.stars !== 0 && <Stars />}
      {C.orbit !== false && <Orbit />}
    </>
  );
}
