import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { MeshReflectorMaterial } from "@react-three/drei";
import { AdditiveBlending, CanvasTexture, Color, MathUtils, Plane, RepeatWrapping, ShaderMaterial, Vector3 } from "three";

import { flavors } from "./data";
import { scrollState, slotIndex } from "./scroll";
import { sceneState } from "./shared";
import { useStore } from "./store";
import { MOBILE } from "./canMaterial";

// "lake" (ayna su): şişe karanlık, durgun bir suyun üstünde; suda yansıması, ufukta kokunun renginde ışık.
// Kaydırınca şişe dönerek suya gömülür, sıradaki sudan yükselir; suya girip çıkarken yüzeyde ışıklı halkalar
// yayılır. Su çizgisinin altı kesilir (WATER_CLIP): şişe gerçekten suya batmış görünür, yansıması da öyle.

export function lakeFrame(aspect) {
  const phone = aspect < 0.9;
  return phone ? { x: 0, y: -1.45, sc: 1.05 } : { x: 2.55 * MathUtils.clamp(aspect / 1.9, 0.44, 1), y: -2.85, sc: 1.55 };
}

// Ürün malzemelerinin kesme düzlemi: su çizgisinin üstü görünür (Carousel malzemelere ekler).
export const WATER_CLIP = new Plane(new Vector3(0, 1, 0), 99);

// Su yüzeyinin hafif titreşimi: yansımayı bozan yumuşak gürültü.
const NOISE = (() => {
  if (typeof document === "undefined") return null;
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const g = c.getContext("2d");
  g.fillStyle = "#808080";
  g.fillRect(0, 0, 256, 256);
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let k = 0; k < 260; k++) {
    const x = rnd() * 256;
    const y = rnd() * 256;
    const r = 6 + rnd() * 26;
    const v = rnd() > 0.5 ? 255 : 0;
    const gr = g.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, `rgba(${v},${v},${v},0.22)`);
    gr.addColorStop(1, `rgba(${v},${v},${v},0)`);
    g.fillStyle = gr;
    g.fillRect(x - r, y - r, 2 * r, 2 * r);
  }
  const t = new CanvasTexture(c);
  t.wrapS = t.wrapT = RepeatWrapping;
  t.repeat.set(40, 12);
  return t;
})();

const RINGS = 8;
const rippleMaterial = () =>
  new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    uniforms: {
      u_time: { value: 0 },
      u_t0: { value: new Array(RINGS).fill(-99) },
      u_amp: { value: new Array(RINGS).fill(0) },
      u_color: { value: new Color("#f4c860") },
      u_pool: { value: 1 },
    },
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }`,
    fragmentShader: `
      varying vec2 vUv;
      uniform float u_time; uniform float u_t0[${RINGS}]; uniform float u_amp[${RINGS}];
      uniform vec3 u_color; uniform float u_pool;
      void main(){
        float r = length(vUv - .5) * 2.;
        float a = 0.;
        for (int k = 0; k < ${RINGS}; k++) {
          float age = u_time - u_t0[k];
          if (age < 0. || age > 4.) continue;
          float rad = .06 + age * .26;
          float w = .012 + age * .01;
          // Ana halka ve arkasından gelen ince ikinci halka.
          float ring = exp(-pow((r - rad) / w, 2.)) + .45 * exp(-pow((r - rad + .07) / (w * .7), 2.));
          a += ring * u_amp[k] * exp(-age * .85) * smoothstep(1., .7, r);
        }
        // Şişenin altında renkli ışık havuzu.
        float pool = exp(-r * r * 9.) * .38 * u_pool;
        vec3 col = u_color * (a * 1.3 + pool) + vec3(1.) * a * .25;
        gl_FragColor = vec4(col, 1.);
      }`,
  });

// Ufuk ışığı: suyun bittiği çizgide kokunun renginde yatay parıltı.
const horizonMaterial = () =>
  new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    uniforms: { u_color: { value: new Color("#f4c860") }, u_on: { value: 1 }, u_x: { value: 0.5 } },
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }`,
    fragmentShader: `
      varying vec2 vUv; uniform vec3 u_color; uniform float u_on; uniform float u_x;
      void main(){
        float y = (vUv.y - .5) * 2.;
        float band = exp(-y * y * 60.) + .35 * exp(-y * y * 6.);
        float sx = exp(-pow((vUv.x - u_x) * 3.2, 2.)) * .85 + .15;
        gl_FragColor = vec4(u_color * band * sx * u_on * .9, 1.);
      }`,
  });

export default function Lake() {
  const gl = useThree((s) => s.gl);
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  gl.localClippingEnabled = true;
  const root = useRef();
  const water = useRef();
  const ripples = useRef();
  const horizon = useRef();
  const st = useRef({ away: 0, lastP: scrollState.p, lastRing: -9, next: 0, idleAt: 0, col: new Color(flavors[0].theme.accent), glow: new Color(flavors[0].theme.glow), landed: false });
  const M = useMemo(() => ({ ripple: rippleMaterial(), horizon: horizonMaterial() }), []);
  const tmp = useMemo(() => new Color(), []);
  const P = useMemo(() => new Vector3(), []);

  const ring = (t, amp) => {
    const s = st.current;
    const u = M.ripple.uniforms;
    u.u_t0.value[s.next] = t;
    u.u_amp.value[s.next] = amp;
    s.next = (s.next + 1) % RINGS;
    s.lastRing = t;
  };

  useFrame(({ clock }, delta) => {
    const dt = Math.min(delta, 0.1);
    const t = clock.getElapsedTime();
    const s = st.current;
    const { detail, order } = useStore.getState();
    const aspect = size.width / size.height;
    const F = lakeFrame(aspect);
    const p = scrollState.p;

    s.away = MathUtils.damp(s.away, Math.max(sceneState.spread, detail ? 1 : 0), 4, dt);
    const on = (1 - s.away) * Math.min(1, sceneState.intro * 1.4);
    // Ritüel'e geçerken ve detayda su söner, şişeler kesilmeden yukarı/kenara gidebilir.
    WATER_CLIP.constant = s.away > 0.02 ? 99 : -F.y;
    root.current.position.y = F.y - 6 * s.away * s.away;
    root.current.visible = s.away < 0.97;

    // Renkler: ortadaki ürünün vurgusu (halkalar, ufuk) ve koyu tonu (su).
    const f = flavors[order[slotIndex(p)]] ?? flavors[0];
    const k = 1 - Math.exp(-dt * 3);
    s.col.lerp(tmp.set(f.theme.accent), k);
    s.glow.lerp(tmp.set(f.theme.glow), k);
    M.ripple.uniforms.u_color.value.copy(s.col);
    M.horizon.uniforms.u_color.value.copy(s.col).lerp(tmp.set("#ffffff"), 0.15);
    M.horizon.uniforms.u_on.value = on;
    M.ripple.uniforms.u_time.value = t;
    M.ripple.uniforms.u_pool.value = on * (1 - 0.7 * Math.sin(Math.PI * Math.min(1, Math.abs(p - Math.round(p)) * 2)));
    const w = water.current;
    if (w) {
      w.color.copy(s.glow).multiplyScalar(0.55);
      w.mixStrength = 3.2 * on;
      if (NOISE) NOISE.offset.set(t * 0.012, t * 0.03);
    }
    // Ufuk ışığının parlak yeri şişenin hizasında.
    P.set(F.x, 0, -60).project(camera);
    M.horizon.uniforms.u_x.value = (P.x + 1) / 2;
    ripples.current.position.x = F.x;

    // Halkalar: şişe suya girip çıkarken sık, yerindeyken arada bir hafif damla.
    const speed = Math.abs(p - s.lastP) / Math.max(dt, 1e-3);
    s.lastP = p;
    if (!s.landed && sceneState.intro > 0.5) {
      s.landed = true;
      ring(t, 1.2);
      ring(t + 0.25, 0.7);
    }
    if (speed > 0.15 && t - s.lastRing > 0.3) ring(t, 0.8 + Math.min(0.6, speed * 0.3));
    else if (t - s.lastRing > 4.2 && on > 0.5) ring(t, 0.45);
  });

  return (
    <group ref={root}>
      {/* Durgun su: gerçek yansıma, hafif titreşimli; ufka kadar uzanır. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -70]}>
        <planeGeometry args={[420, 160]} />
        <MeshReflectorMaterial
          ref={water}
          resolution={MOBILE ? 256 : 768}
          blur={[60, 20]}
          mixBlur={0.35}
          mixStrength={3.2}
          mixContrast={1.05}
          depthScale={0}
          roughness={1}
          metalness={0}
          envMapIntensity={0.25}
          color="#100c08"
          mirror={0.85}
          distortion={0.18}
          distortionMap={NOISE}
        />
      </mesh>
      {/* Halkalar ve ışık havuzu (şişenin ayağının çevresi) */}
      <mesh ref={ripples} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]} material={M.ripple} renderOrder={2}>
        <planeGeometry args={[18, 18]} />
      </mesh>
      {/* Ufuk ışığı */}
      <mesh ref={horizon} position={[0, 0, -138]} material={M.horizon} renderOrder={1}>
        <planeGeometry args={[520, 26]} />
      </mesh>
    </group>
  );
}
