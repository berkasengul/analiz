import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { AdditiveBlending, Color, NormalBlending, PlaneGeometry, ShaderMaterial, Vector3 } from "three";
import { useStore } from "./store";
import { sceneState } from "./shared";

// Mum (photo3d.flame: fitil ucu, doku karesine oranla; araclar/mum-alev.py): fotoğraftaki donuk alevin yerine
// canlı alev. Sayfa açılınca mumlar sırayla kendiliğinden tutuşur (parlama ve kısa bir duman), sonra sakin
// titreyerek yanar; öndeki mum tam, diğerleri biraz kısık. Alevin ucundan ince, kıvrılan bir duman tüter.
// Sahnenin sıcak ışığı tek bir ışıkla (FlameLight) yanan alevin konumunu izler.

const NOISE = /* glsl */ `
float h1(float n){ return fract(sin(n) * 43758.5453); }
float n1(float x){ float i = floor(x); float f = fract(x); return mix(h1(i), h1(i + 1.0), f * f * (3.0 - 2.0 * f)); }
float h2(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float n2(vec2 p){ vec2 i = floor(p); vec2 f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(h2(i), h2(i + vec2(1, 0)), f.x), mix(h2(i + vec2(0, 1)), h2(i + vec2(1, 1)), f.x), f.y); }
float fbm(vec2 p){ float s = 0.0, a = 0.5; for (int i = 0; i < 4; i++){ s += a * n2(p); p *= 2.03; a *= 0.5; } return s; }
`;

const VERT = /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;

// Alev: gözyaşı biçimi; dipte ince mavi, ortada beyaz-sarı çekirdek, dışta turuncu. Yükseldikçe sağa sola salınır.
function flameMaterial(seed) {
  return new ShaderMaterial({
    uniforms: { u_time: { value: 0 }, u_lit: { value: 0 }, u_seed: { value: seed } },
    vertexShader: VERT,
    fragmentShader: /* glsl */ `
      uniform float u_time, u_lit, u_seed;
      varying vec2 vUv;
      ${NOISE}
      void main(){
        float t = u_time;
        float fl = 0.88 + 0.12 * n1(t * 9.0 + u_seed) + 0.05 * sin(t * 23.0 + u_seed);
        float H = 0.78 * u_lit * fl;
        float y = vUv.y / max(H, 0.001);
        if (y > 1.0 || u_lit < 0.01) discard;
        float sway = ((n1(t * 2.3 + u_seed) - 0.5) * 0.10 + sin(t * 6.1 + u_seed) * 0.018) * y * y;
        float x = vUv.x - 0.5 - sway;
        float w = 0.46 * pow(clamp(y, 0.0, 1.0), 0.42) * pow(1.0 - clamp(y, 0.0, 1.0), 0.75) * (0.85 + 0.25 * u_lit);
        float d = abs(x) / max(w, 0.0001);
        float body = smoothstep(1.0, 0.55, d);
        float core = smoothstep(0.75, 0.0, d) * smoothstep(0.95, 0.35, y) * smoothstep(0.02, 0.18, y);
        vec3 col = mix(vec3(1.0, 0.42, 0.08), vec3(1.0, 0.78, 0.36), smoothstep(0.0, 0.8, 1.0 - d));
        col = mix(col, vec3(1.0, 0.97, 0.88), core);
        float blue = smoothstep(0.16, 0.0, y) * smoothstep(1.0, 0.3, d);
        col = mix(col, vec3(0.35, 0.5, 1.0), blue * 0.7);
        float a = body * (1.0 - smoothstep(0.82, 1.0, y) * 0.6);
        // Toplamalı karışım (SrcAlpha, One): alfa 1, saydamlık rengin içinde.
        gl_FragColor = vec4(col * (1.4 + core * 1.6) * a, 1.0);
      }`,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    toneMapped: false,
  });
}

// Işıltı: alevin çevresinde sıcak, yumuşak hale (bloom ile birlikte mumun ağzını aydınlatır).
function glowMaterial() {
  return new ShaderMaterial({
    uniforms: { u_lit: { value: 0 }, u_fl: { value: 1 } },
    vertexShader: VERT,
    fragmentShader: /* glsl */ `
      uniform float u_lit, u_fl;
      varying vec2 vUv;
      void main(){
        vec2 p = (vUv - vec2(0.5, 0.42)) * vec2(1.0, 0.85);
        float r = length(p) * 2.0;
        float a = exp(-r * r * 5.0) * 0.45 + exp(-r * 9.0) * 0.6;
        a *= u_lit * u_fl * 1.5;
        gl_FragColor = vec4(vec3(1.0, 0.6, 0.24) * a, 1.0);
      }`,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    toneMapped: false,
  });
}

// Duman: alevin ucundan (sönünce fitilden) yükselen, kıvrılan ince bir iz; yukarı doğru genişleyip dağılır.
function smokeMaterial(seed) {
  return new ShaderMaterial({
    uniforms: { u_time: { value: 0 }, u_amt: { value: 0 }, u_base: { value: 0 }, u_seed: { value: seed } },
    vertexShader: VERT,
    fragmentShader: /* glsl */ `
      uniform float u_time, u_amt, u_base, u_seed;
      varying vec2 vUv;
      ${NOISE}
      void main(){
        float y = (vUv.y - u_base) / (1.0 - u_base);
        if (y < 0.0 || u_amt < 0.005) discard;
        float t = u_time * 0.55 + u_seed;
        float curl = (fbm(vec2(y * 2.2 - t * 0.9, t * 0.3)) - 0.5) * 1.1 * y + sin(y * 7.0 - t * 2.4) * 0.09 * y;
        float x = vUv.x - 0.5 - curl;
        float w = 0.018 + 0.16 * y * y;
        float line = exp(-x * x / (w * w));
        float breakup = smoothstep(0.25, 0.75, fbm(vec2(x * 7.0, y * 5.0 - u_time * 0.8 + u_seed)));
        float a = line * mix(1.0, breakup, smoothstep(0.1, 0.6, y)) * smoothstep(0.0, 0.06, y) * (1.0 - smoothstep(0.45, 1.0, y));
        a *= u_amt;
        gl_FragColor = vec4(vec3(0.86, 0.84, 0.82), a * 0.7);
      }`,
    transparent: true,
    depthWrite: false,
    blending: NormalBlending,
    toneMapped: false,
  });
}

const PLANE = new PlaneGeometry(1, 1);
const _w = new Vector3();
const now = () => performance.now() / 1000;

export function CandleFlame({ S, flavor }) {
  const L = S.size;
  // Yassı blokta ön yüzün hemen önü; tornada (round) gövdenin ön yüzeyi (fitil satırındaki yarıçap).
  const front = (S.profile === "flat" ? (S.depth ?? 0.34) / 2 : 0) + 0.02;
  const wicks = S.flame;
  const mats = useMemo(
    () => wicks.map((_, i) => ({ flame: flameMaterial(flavor * 3.1 + i * 7.7), glow: glowMaterial(), smoke: smokeMaterial(flavor * 1.7 + i * 4.3) })),
    [wicks, flavor]
  );
  const st = useRef({ lit: 0, on: false, since: now(), lightAt: 0 });
  const anchor = useRef();
  useFrame(({ clock }) => {
    const s = st.current;
    const t = now();
    const store = useStore.getState();
    // Sayfa açılınca mumlar sırayla kendiliğinden tutuşur (ürün sırasına göre 0.45 sn arayla).
    if (!s.lightAt && store.loaded && (sceneState.intro ?? 1) > 0.5) {
      const rank = Math.max(0, store.order?.indexOf(flavor) ?? flavor);
      s.lightAt = t + 0.4 + Math.min(rank, 8) * 0.45;
    }
    const want = store.active === flavor && !store.swapping;
    if (want !== s.on) {
      s.on = want;
      s.since = t;
    }
    const ign = s.lightAt ? t - s.lightAt : -1;
    // Tutuşma anında kısa bir parlama; öne gelen mum da yerine oturunca bir an canlanır. Öndeki tam, diğerleri kısık.
    const flare = (ign >= 0 && ign < 0.3) || (s.on && t - s.since > 0.25 && t - s.since < 0.55);
    const target = ign < 0 ? 0 : flare ? 1.35 : s.on ? 1 : 0.78;
    // Gerçek zamana göre (kare hızından bağımsız) yaklaşır.
    const dt = Math.min(0.1, t - (s.last ?? t));
    s.last = t;
    s.lit += (target - s.lit) * (1 - Math.exp(-dt * 7));
    if (s.lit < 0.002) s.lit = 0;
    const fl = 0.85 + 0.15 * Math.sin(t * 11 + flavor) * Math.sin(t * 7.3 + flavor * 2);
    // Alevin ucundan ince, kıvrılan bir duman; tutuşurken (kibrit gibi) bir an yoğunlaşır.
    const smoke = (s.lit > 0.05 ? (s.on ? 0.5 : 0.3) * Math.min(s.lit, 1) : 0) + (ign >= 0 && ign < 3 ? 0.6 * (1 - ign / 3) : 0);
    mats.forEach((m) => {
      m.flame.uniforms.u_time.value = clock.getElapsedTime();
      m.flame.uniforms.u_lit.value = Math.min(s.lit, 1.35);
      m.glow.uniforms.u_lit.value = Math.min(s.lit, 1.2) * (s.on ? 1 : 0.7);
      m.glow.uniforms.u_fl.value = fl;
      m.smoke.uniforms.u_time.value = clock.getElapsedTime();
      m.smoke.uniforms.u_amt.value = smoke;
      m.smoke.uniforms.u_base.value = 0.12 * Math.min(s.lit, 1);
    });
    // Sahnenin sıcak ışığı öndeki mumun alevini izler.
    if (s.on && s.lit > 0.05 && anchor.current) {
      anchor.current.getWorldPosition(_w);
      sceneState.flame = sceneState.flame ?? { pos: new Vector3(), lit: 0, fl: 1 };
      sceneState.flame.pos.copy(_w);
      sceneState.flame.lit = Math.min(s.lit, 1.2);
      sceneState.flame.fl = fl;
      sceneState.flame.at = t;
    }
  });
  const fh = 0.3 * L; // alev boyu
  return (
    <group>
      {wicks.map(([x, y], i) => {
        const px = (x - 0.5) * L;
        const py = (0.5 - y) * L;
        return (
          <group key={i} position={[px, py, front]}>
            {i === 0 && <group ref={anchor} position={[0, fh * 0.35, 0]} />}
            <mesh geometry={PLANE} material={mats[i].glow} position={[0, fh * 0.32, 0.01]} scale={[fh * 3.2, fh * 3.4, 1]} renderOrder={20} userData={{ noFit: true }} />
            <mesh geometry={PLANE} material={mats[i].flame} position={[0, fh * 0.5 - 0.01 * L, 0.02]} scale={[fh * 0.9, fh, 1]} renderOrder={21} userData={{ noFit: true }} />
            <mesh geometry={PLANE} material={mats[i].smoke} position={[0, fh * 0.15 + fh * 2.6, 0]} scale={[fh * 1.6, fh * 5.2, 1]} renderOrder={19} userData={{ noFit: true }} />
          </group>
        );
      })}
    </group>
  );
}

// Sahnede tek sıcak ışık: yanan alevin konumunu izler, alevle birlikte titrer (çevreyi ve kaideyi aydınlatır).
export function FlameLight() {
  const light = useRef();
  const col = useMemo(() => new Color("#ffae5c"), []);
  useFrame(() => {
    const l = light.current;
    const f = sceneState.flame;
    if (!l) return;
    const fresh = f && now() - f.at < 0.25;
    const target = fresh ? f.lit * f.fl * 2.4 : 0;
    l.intensity += (target - l.intensity) * 0.2;
    if (fresh) l.position.copy(f.pos);
    sceneState.flicker = fresh ? f.lit * f.fl : 0;
  });
  return <pointLight ref={light} color={col} intensity={0} distance={9} decay={1.6} />;
}
