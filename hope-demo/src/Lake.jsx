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
// Şişeler suyun üstünde bir geçit gibi akar: sıradaki koku ufuktaki ışığın içinden (uzakta küçük bir silüet)
// süzülerek yaklaşır, öndeki yana kayıp karanlığa çekilir. Kayan şişelerin ardında ışıklı halkalar kalır.
// Ayağı suya biraz girer; su çizgisinin altı kesilir (WATER_CLIP), yansıma da öyle.

export function lakeFrame(aspect) {
  const phone = aspect < 0.9;
  return phone ? { x: 0, y: -1.45, sc: 1.05 } : { x: 2.55 * MathUtils.clamp(aspect / 1.9, 0.44, 1), y: -2.85, sc: 1.55 };
}

// d: ürünün öndeki ürüne uzaklığı. d > 0: ufuktan yaklaşan (sıradaki), d < 0: yana çekilip giden.
export function lakePath(d, aspect) {
  const L = lakeFrame(aspect);
  const phone = aspect < 0.9;
  if (d >= 0) return { x: L.x - (phone ? 0.25 : 1.6) * d, z: -24 * d * (1 + 0.25 * d), vis: 1 - MathUtils.smoothstep(d, 1.25, 1.6), L };
  const e = -d;
  return { x: L.x + (phone ? 5 : 9) * e, z: 3.5 * e, vis: 1 - MathUtils.smoothstep(e, 0.35, 0.75), L };
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

// Temas gölgesi dokusu: ortası koyu, kenara doğru sönen elips.
const SHADOW = (() => {
  if (typeof document === "undefined") return null;
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d");
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, "rgba(0,0,0,1)");
  gr.addColorStop(0.35, "rgba(0,0,0,0.75)");
  gr.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = gr;
  g.fillRect(0, 0, 128, 128);
  return new CanvasTexture(c);
})();

const RINGS = 14;
const rippleMaterial = () =>
  new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    uniforms: {
      u_time: { value: 0 },
      u_t0: { value: new Array(RINGS).fill(-99) },
      u_c: { value: Array.from({ length: RINGS }, () => new Vector3()) },
      u_pc: { value: new Vector3() },
      u_amp: { value: new Array(RINGS).fill(0) },
      u_color: { value: new Color("#f4c860") },
      u_pool: { value: 1 },
    },
    vertexShader: `varying vec2 vW; void main(){ vec4 w = modelMatrix * vec4(position,1.); vW = w.xz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: `
      varying vec2 vW;
      uniform float u_time; uniform float u_t0[${RINGS}]; uniform float u_amp[${RINGS}]; uniform vec3 u_c[${RINGS}];
      uniform vec3 u_color; uniform float u_pool; uniform vec3 u_pc;
      void main(){
        float a = 0.;
        for (int k = 0; k < ${RINGS}; k++) {
          float age = u_time - u_t0[k];
          if (age < 0. || age > 4.) continue;
          // Halka dünya biriminde: şişenin ayağından yayılır (uzaktaki halkalar perspektifle incelir).
          float r = length(vW - u_c[k].xz);
          float rad = .9 + age * 1.6;
          float w = .07 + age * .06;
          float ring = exp(-pow((r - rad) / w, 2.)) + .45 * exp(-pow((r - rad + .45) / (w * .7), 2.));
          a += ring * u_amp[k] * exp(-age * .95);
        }
        // Öndeki şişenin altında renkli ışık havuzu.
        float rp = length(vW - u_pc.xz) / 4.5;
        float pool = exp(-rp * rp * 9.) * .38 * u_pool;
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
  const shadow = useRef();
  const st = useRef({ away: 0, lastP: scrollState.p, lastRing: -9, next: 0, idleAt: 0, col: new Color(flavors[0].theme.accent), glow: new Color(flavors[0].theme.glow), landed: false });
  const M = useMemo(() => ({ ripple: rippleMaterial(), horizon: horizonMaterial() }), []);
  const tmp = useMemo(() => new Color(), []);
  const P = useMemo(() => new Vector3(), []);

  const ring = (t, amp, x, z) => {
    const s = st.current;
    const u = M.ripple.uniforms;
    u.u_t0.value[s.next] = t;
    u.u_c.value[s.next].set(x, 0, z);
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
    M.horizon.uniforms.u_on.value = on * (1 - 0.65 * (sceneState.crimson ?? 0));
    M.ripple.uniforms.u_time.value = t;
    M.ripple.uniforms.u_pool.value = (1 - (sceneState.crimson ?? 0)) * on * (1 - 0.7 * Math.sin(Math.PI * Math.min(1, Math.abs(p - Math.round(p)) * 2)));
    M.ripple.uniforms.u_pc.value.set(F.x, 0, 0);
    // Ürüne özel sahnede (Crimson) su cilalı siyah taşa döner: titreşim yok, yansıma bulanık ve kısık.
    const cr = sceneState.crimson ?? 0;
    const w = water.current;
    if (w) {
      w.color.copy(s.glow).multiplyScalar(0.55 * (1 - cr)).lerp(tmp.set("#0a0506"), cr);
      w.mixStrength = (3.2 - 1.2 * cr) * on;
      w.mixBlur = 0.35 + 0.55 * cr;
      w.distortion = 0.18 * (1 - cr);
      if (NOISE) NOISE.offset.set(t * 0.012, t * 0.03);
    }
    // Temas gölgesi: şişenin ayağının altında yumuşak koyu leke (taş zeminde; suda yok).
    if (shadow.current) {
      shadow.current.position.set(F.x, 0.012, 0);
      shadow.current.scale.set(F.sc * 1.9, F.sc * 1.05, 1);
      shadow.current.material.opacity = 0.85 * cr * on;
      shadow.current.visible = cr > 0.01;
    }
    // Ufuk ışığının parlak yeri şişenin hizasında.
    P.set(F.x, 0, -60).project(camera);
    M.horizon.uniforms.u_x.value = (P.x + 1) / 2;


    // Halkalar: şişe suya girip çıkarken sık, yerindeyken arada bir hafif damla.
    const speed = Math.abs(p - s.lastP) / Math.max(dt, 1e-3);
    s.lastP = p;
    if (!s.landed && sceneState.intro > 0.5) {
      s.landed = true;
      ring(t, 1.2, F.x, 0);
      ring(t + 0.25, 0.7, F.x, 0);
    }
    // Taş zeminde halka yok (Crimson); su yüzeyine dönerken yeniden başlar.
    if ((sceneState.crimson ?? 0) > 0.4) s.lastRing = t;
    else if (speed > 0.15 && t - s.lastRing > 0.22) {
      // Kayan şişelerin ayağında (ufuktan gelen ve yana çekilen) iz halkaları.
      const N = order.length;
      order.forEach((_, slot) => {
        let d = slot - p;
        d = ((d % N) + N) % N;
        if (d >= N / 2) d -= N;
        if (Math.abs(d) < 0.04 || Math.abs(d) > 0.97) return;
        const q = lakePath(d, aspect);
        if (q.vis > 0.3) ring(t, 0.55 + Math.min(0.5, speed * 0.25), q.x, q.z);
      });
    } else if (t - s.lastRing > 4.2 && on > 0.5) ring(t, 0.45, F.x, 0);
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
      <mesh ref={ripples} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, -30]} material={M.ripple} renderOrder={2}>
        <planeGeometry args={[90, 90]} />
      </mesh>
      <mesh ref={shadow} rotation={[-Math.PI / 2, 0, 0]} renderOrder={3} visible={false}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial map={SHADOW} color="#000000" transparent depthWrite={false} opacity={0} />
      </mesh>
      {/* Ufuk ışığı */}
      <mesh ref={horizon} position={[0, 0, -138]} material={M.horizon} renderOrder={1}>
        <planeGeometry args={[520, 26]} />
      </mesh>
    </group>
  );
}
