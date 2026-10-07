import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { CanvasTexture, Color, LatheGeometry, MathUtils, MeshPhysicalMaterial, MeshStandardMaterial, PlaneGeometry, RepeatWrapping, ShaderMaterial, SRGBColorSpace, Vector2 } from "three";

import { flavors } from "./data";
import { scrollState, slotIndex } from "./scroll";
import { sceneState } from "./shared";
import { useStore } from "./store";
import { stageFrame } from "./Lake";
import { studioEnv } from "./Studio";

const HSL = {};

// "silk" (ipek): şişe kokunun renginde akan saten bir kumaşın üstünde durur. Kumaş şişenin altında düz (ayağı
// kumaşa oturur, altında yumuşak temas gölgesi ve ana ışığın arkaya düşen gölgesi), arkasında sağa doğru bir
// dalga gibi yükselir; sol üst karanlık kalır (başlığa yer). Kıvrımlar çapraz akar, yavaşça kıpırdar; kaydırınca
// kumaş dalgalanır (hız → kıvrım genliği). Renk öndeki kokudan: koyu taban, ışığı yakalayan saten parlaması.
// Kumaşın ışığı kendi gölgelendiricisinde (stüdyo ana ışığı soldan-önden, arkadan kenar ışığı, şişenin
// çevresinde tepe ışığı havuzu, kıvrım yönünde anizotropik saten parlaması).

// Sabit kaide: ipeğin üstünde mimari profilli (geniş taban basamağı, iç bükey silme, gövde, taç silmesi) cilalı
// siyah mermer; damarları koyu altın, silme çizgilerinde ince altın halkalar, üst yüzde altın kakma halka.
// Şişeler yandan gelip üstüne konar. Ölçüler ekran ölçeğiyle (stageFrame.sc / 1.55).
export const PLINTH = { H: 0.97, R: 1.95 };
const PROFILE = [
  [0, 0], [1.92, 0], [1.95, 0.03], [1.95, 0.11], [1.9, 0.14], [1.72, 0.15], [1.7, 0.2], [1.6, 0.25], [1.53, 0.3], [1.5, 0.33],
  [1.5, 0.8], [1.53, 0.83], [1.6, 0.86], [1.64, 0.9], [1.64, 0.95], [1.61, 0.97], [0, 0.97],
].map(([r, y]) => new Vector2(r, y));

// Siyah mermer: neredeyse siyah zemin, ince dallanan koyu altın ve duman grisi damarlar.
const MARBLE = (() => {
  if (typeof document === "undefined") return null;
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 512;
  const g = c.getContext("2d");
  g.fillStyle = "#0a0808";
  g.fillRect(0, 0, 1024, 512);
  let seed = 11;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const vein = (x, y, len, w, col) => {
    g.strokeStyle = col;
    g.lineWidth = w;
    g.beginPath();
    g.moveTo(x, y);
    let a = rnd() * Math.PI * 2;
    for (let k = 0; k < len; k++) {
      a += (rnd() - 0.5) * 0.5;
      x += Math.cos(a) * 9;
      y += Math.sin(a) * 4;
      g.lineTo(x, y);
      if (rnd() < 0.03) vein(x, y, len * 0.35, w * 0.6, col);
    }
    g.stroke();
  };
  for (let k = 0; k < 7; k++) vein(rnd() * 1024, rnd() * 512, 110, 1.6, "rgba(196,150,82,0.55)");
  for (let k = 0; k < 9; k++) vein(rnd() * 1024, rnd() * 512, 80, 1.1, "rgba(120,110,105,0.28)");
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  t.wrapS = RepeatWrapping;
  t.anisotropy = 8;
  return t;
})();
export const plinthTop = (F) => F.y + PLINTH.H * (F.sc / 1.55);

const W = 44; // genişlik (x)
const Z0 = 11; // ön kenar (kameraya doğru)
const Z1 = -11; // arka kenar

const silkMaterial = () =>
  new ShaderMaterial({
    transparent: true,
    uniforms: {
      u_time: { value: 0 },
      u_wave: { value: 0 },
      u_bx: { value: 0 },
      u_fy: { value: -2.85 },
      u_sc: { value: 1 },
      u_base: { value: new Color() },
      u_sheen: { value: new Color() },
      u_on: { value: 0 },
      u_phone: { value: 0 },
    },
    vertexShader: /* glsl */ `
      uniform float u_time; uniform float u_wave; uniform float u_bx; uniform float u_fy; uniform float u_sc; uniform float u_phone;
      varying vec3 vN; varying vec3 vW; varying float vRise; varying float vEdge; varying vec3 vT;
      // Kumaşın yüksekliği (dünya x, z): şişenin altında düz, arkada sağa doğru yükselen dalga ve çapraz kıvrımlar.
      float rise(float x, float z) {
        float side = mix(smoothstep(-7., 9., x - u_bx), 0.8, u_phone);
        float back = smoothstep(-1.5, -10.5, z);
        return (1.2 + 8.5 * side) * pow(back, 1.6);
      }
      float h(float x, float z) {
        float dx = x - u_bx;
        float near = smoothstep(2.1 * u_sc, 5.2, length(vec2(dx, z * 1.3)));
        float r = rise(x, z);
        float t = u_time * (0.35 + 0.5 * u_wave);
        float amp = (0.22 + 0.5 * u_wave) * near * (0.55 + 0.25 * r);
        float f = 0.9 * sin(dx * 0.42 + z * 0.55 + t * 0.6)
                + 0.55 * sin(dx * 0.95 - z * 0.38 - t * 0.8 + 1.3)
                + 0.28 * sin(dx * 1.9 + z * 1.25 + t * 1.1 + 2.1)
                + 0.12 * sin(dx * 3.7 - z * 2.6 + t * 1.6);
        return u_fy - 0.02 + r + f * amp;
      }
      void main() {
        vec3 p = position;
        float x = p.x;
        float z = p.z;
        float y = h(x, z);
        float e = 0.06;
        float hx = h(x + e, z) - h(x - e, z);
        float hz = h(x, z + e) - h(x, z - e);
        vN = normalize(vec3(-hx, 2. * e, -hz));
        // Kıvrım yönü (saten parlaması bu yönde uzar).
        vT = normalize(vec3(0.82, hx * 0.4, -0.57));
        vRise = rise(x, z);
        vec4 w = modelMatrix * vec4(x, y, z, 1.);
        vW = w.xyz;
        // Arka ve yan kenarlar yumuşakça söner (kumaşın ucu karanlığa karışır).
        vEdge = smoothstep(${Z1.toFixed(1)}, ${(Z1 + 3).toFixed(1)}, z) * smoothstep(${(-W / 2).toFixed(1)}, ${(-W / 2 + 6).toFixed(1)}, x - u_bx) * smoothstep(${(W / 2).toFixed(1)}, ${(W / 2 - 6).toFixed(1)}, x - u_bx);
        gl_Position = projectionMatrix * viewMatrix * w;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 u_base; uniform vec3 u_sheen; uniform float u_on; uniform float u_bx; uniform float u_fy; uniform float u_sc;
      varying vec3 vN; varying vec3 vW; varying float vRise; varying float vEdge; varying vec3 vT;
      void main() {
        vec3 N = normalize(vN);
        vec3 V = normalize(cameraPosition - vW);
        if (dot(N, V) < 0.) N = -N;
        vec3 T = normalize(vT - N * dot(vT, N));
        // Işıklar: ana (soldan-önden-üstten, sıcak beyaz), kenar (arkadan, kokunun renginde), tepe havuzu (şişe).
        vec3 L1 = normalize(vec3(-0.55, 0.75, 0.55));
        vec3 L2 = normalize(vec3(0.35, 0.45, -1.));
        float d1 = max(dot(N, L1), 0.) * 0.8 + 0.2;
        float d2 = max(dot(N, L2), 0.);
        // Anizotropik saten parlaması (Kajiya-Kay): kıvrım boyunca uzun, ince ışık şeritleri.
        vec3 H1 = normalize(L1 + V);
        float th = dot(T, H1);
        float spec = pow(sqrt(max(1. - th * th, 0.)), 70.) * 0.9 + pow(sqrt(max(1. - th * th, 0.)), 12.) * 0.18;
        vec3 H2 = normalize(L2 + V);
        float th2 = dot(T, H2);
        float spec2 = pow(sqrt(max(1. - th2 * th2, 0.)), 40.);
        float fres = pow(1. - max(dot(N, V), 0.), 3.);
        // Şişenin çevresinde tepe ışığı havuzu; uzaklaştıkça kumaş karanlığa iner (ışık ürüne toplanır).
        vec2 q = vec2(vW.x - u_bx, vW.z);
        float pool = exp(-dot(q, q) / (14. * u_sc * u_sc));
        float far = exp(-dot(q, q) / 180.);
        // Temas gölgesi ve ana ışığın arkaya-sağa düşen gölgesi.
        float contact = exp(-pow(length(q) / (2.25 * u_sc), 4.));
        vec2 sq = q - vec2(1.7, -1.9) * u_sc;
        vec2 sr = vec2(sq.x * 0.8 + sq.y * 0.6, -sq.x * 0.6 + sq.y * 0.8);
        float castSh = exp(-(sr.x * sr.x / (1.6 * u_sc * u_sc) + sr.y * sr.y / (4.5 * u_sc * u_sc))) * step(vW.y, u_fy + 0.6);
        float shade = 1. - 0.75 * contact - 0.45 * castSh;
        float light = (0.25 + 0.75 * far) * (0.55 + 0.9 * pool);
        vec3 col = u_base * d1 * light
                 + u_sheen * spec * light * 0.9
                 + u_sheen * (d2 * 0.35 + spec2 * 0.55 + fres * 0.25) * (0.4 + 0.6 * smoothstep(0., 3., vRise));
        col *= shade;
        gl_FragColor = vec4(col, u_on * vEdge);
      }`,
  });

export default function Silk() {
  const size = useThree((s) => s.size);
  const aspect = size.width / size.height;
  const mesh = useRef();
  const plinth = useRef();
  const gl = useThree((s) => s.gl);
  const P = useMemo(() => {
    const env = studioEnv(gl);
    return {
      marble: new MeshPhysicalMaterial({ map: MARBLE, color: "#ffffff", roughness: 0.14, metalness: 0.05, clearcoat: 1, clearcoatRoughness: 0.04, envMap: env, envMapIntensity: 1.2 }),
      gold: new MeshStandardMaterial({ color: "#c79c5c", metalness: 1, roughness: 0.2, envMap: env, envMapIntensity: 2.4 }),
      lathe: new LatheGeometry(PROFILE, 128),
    };
  }, [gl]);
  const st = useRef({ wave: 0, on: 0, last: scrollState.p, base: new Color(), sheen: new Color() });
  const tmp = useMemo(() => new Color(), []);
  const M = useMemo(() => silkMaterial(), []);
  const geo = useMemo(() => {
    const g = new PlaneGeometry(W, Z0 - Z1, aspect < 0.9 ? 140 : 220, aspect < 0.9 ? 90 : 140);
    g.rotateX(-Math.PI / 2);
    g.translate(0, 0, (Z0 + Z1) / 2);
    return g;
  }, [aspect]);

  useFrame(({ clock }, delta) => {
    const dt = Math.min(delta, 0.1);
    const s = st.current;
    const { detail, order } = useStore.getState();
    const F = stageFrame(aspect);
    const u = M.uniforms;
    // Kaydırma hızı kumaşı dalgalandırır; durunca yavaşça yatışır.
    const v = Math.abs(scrollState.p - s.last) / Math.max(dt, 1e-3);
    s.last = scrollState.p;
    s.wave = MathUtils.damp(s.wave, Math.min(1, v * 0.9), v * 0.9 > s.wave ? 6 : 1.2, dt);
    u.u_time.value += dt * (1 + 2.5 * s.wave);
    u.u_wave.value = s.wave;
    u.u_bx.value = F.x;
    u.u_fy.value = F.y;
    u.u_sc.value = F.sc / 1.55;
    u.u_phone.value = aspect < 0.9 ? 1 : 0;
    // Renk: öndeki kokunun vurgusu → koyu taban ve saten parlaması.
    const f = flavors[order[slotIndex(scrollState.p)]] ?? flavors[0];
    const k = 1 - Math.exp(-dt * 2.5);
    // Renk kokunun vurgusunun tonundan: taban çok koyu, saten parlaması doygun ve orta parlaklıkta (açık renkli
    // vurgu, ör. altın, bej-gri kum gibi değil derin kehribar saten olur).
    tmp.set(f.theme.accent);
    const lum = 0.2126 * tmp.r + 0.7152 * tmp.g + 0.0722 * tmp.b;
    tmp.getHSL(HSL);
    s.base.lerp(tmp.setHSL(HSL.h, Math.min(1, HSL.s * 0.9), 0.05 - 0.015 * lum), k);
    s.sheen.lerp(tmp.setHSL(HSL.h, Math.max(HSL.s, 0.8), 0.4 - 0.13 * lum), k);
    u.u_base.value.copy(s.base);
    u.u_sheen.value.copy(s.sheen);
    // Ritüel'e geçerken ve detayda söner.
    const off = Math.max(sceneState.spread, detail ? 1 : 0);
    s.on = MathUtils.damp(s.on, (1 - off) * Math.min(1, sceneState.intro * 1.4), 3, dt);
    u.u_on.value = s.on;
    mesh.current.visible = s.on > 0.01;
    mesh.current.position.y = -4 * off * off;
    // Kaide: öndeki şişenin yerinde, sabit; Ritüel'e geçerken ve detayda kumaşla birlikte aşağı iner.
    const g = plinth.current;
    const k2 = F.sc / 1.55;
    g.position.set(F.x, F.y - 4 * off * off, 0);
    g.scale.setScalar(k2);
    g.visible = s.on > 0.01;
  });

  const { H } = PLINTH;
  return (
    <>
      <mesh ref={mesh} geometry={geo} material={M} frustumCulled={false} renderOrder={1} />
      <group ref={plinth} visible={false}>
        <mesh geometry={P.lathe} material={P.marble} position={[0, -0.03, 0]} />
        {/* İnce altın halkalar: taban basamağı, gövdenin altı ve taç silmesi; üst yüzde kakma halka */}
        <mesh material={P.gold} position={[0, 0.1, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.955, 0.012, 10, 160]} />
        </mesh>
        <mesh material={P.gold} position={[0, 0.3, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.525, 0.016, 10, 160]} />
        </mesh>
        <mesh material={P.gold} position={[0, 0.89, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.632, 0.02, 10, 160]} />
        </mesh>
        <mesh material={P.gold} position={[0, H - 0.024, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.32, 0.008, 8, 160]} />
        </mesh>
      </group>
    </>
  );
}
