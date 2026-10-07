import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { AdditiveBlending, BufferAttribute, BufferGeometry, Color, IcosahedronGeometry, MathUtils, MeshBasicMaterial, MeshPhysicalMaterial, PointsMaterial, ShaderMaterial } from "three";

import { flavors } from "./data";
import { scrollState } from "./scroll";
import { sceneState } from "./shared";
import { useStore } from "./store";
import { MOBILE } from "./canMaterial";
import { lakeFrame } from "./Lake";

// Ürüne özel sinematik sahne (ürün verisinde "scene": "crimson"; ör. O'JUVI Red Passion). Ürün öne gelirken
// (ufuktan yaklaşırken) sahne kurulur, giderken söner. Katmanlar:
//   arka plan  — uzakta, ufkun üstünde büyük kırmızı ışık kemeri (portal); taş zeminde yansır
//   orta plan  — şişe; önden yumuşak ana ışık, arkadan kırmızı kenar ışıkları, kapağa sıcak altın vurgu
//   ön plan    — iki yanda obsidyen kayalar (yüzeylerinde kırmızı ve altın yansımalar), zeminden yükselir
//   atmosfer   — zemine yakın çok hafif kırmızı sis bantları, az sayıda altın ve kırmızı zerre
// Ağırlık (0–1) sceneState.crimson'da: Lake (zemin taşa döner) ve Carousel (şişe zemine oturur) okur.

export const sceneWeight = (name) => {
  const { order } = useStore.getState();
  const N = order.length;
  const p = scrollState.p;
  let w = 0;
  order.forEach((fi, slot) => {
    if (flavors[fi]?.scene !== name) return;
    let d = slot - p;
    d = ((d % N) + N) % N;
    if (d >= N / 2) d -= N;
    w = Math.max(w, 1 - MathUtils.smoothstep(Math.abs(d), 0.12, 0.8));
  });
  return w;
};

// Obsidyen kaya: düzensiz, ince yüzey kırıklı; tohumla her kaya farklı.
function rockGeometry(seed) {
  const g = new IcosahedronGeometry(1, 4);
  const pos = g.attributes.position;
  const s1 = seed * 1.7;
  const s2 = seed * 3.1;
  for (let k = 0; k < pos.count; k++) {
    const x = pos.getX(k);
    const y = pos.getY(k);
    const z = pos.getZ(k);
    const n =
      0.22 * Math.sin(x * 2.3 + s1) * Math.cos(z * 2.1 + s2) +
      0.12 * Math.sin(y * 4.1 + z * 3.3 + s2) +
      0.07 * Math.sin(x * 7.3 - y * 5.9 + s1) +
      0.035 * Math.sin(x * 13.1 + z * 11.7 - s2) * Math.cos(y * 12.3 + s1);
    const f = 1 + n;
    // Tepe sivri, taban düz: zemine oturan kaya.
    pos.setXYZ(k, x * f, Math.max(y * f * (1 + 0.25 * Math.max(0, y)), -0.25), z * f);
  }
  // Çokyüzlü geometri köşeleri paylaşmaz: birleştirilir ki yüzey yumuşak gölgelensin (köşeli "low-poly" görünmesin).
  g.deleteAttribute("normal");
  g.deleteAttribute("uv");
  const m = mergeVertices(g);
  m.computeVertexNormals();
  return m;
}

// [dx, z, sx, sy, sz, rotY, tohum]: dx öndeki şişeye göre yatay uzaklık (telefonda daralır).
const ROCKS = [
  // ön plan: kadrajın iki alt köşesi, alçak (şişeyi ve yazıları kapatmaz)
  [8.8, 5.2, 2.2, 1.35, 1.8, 0.4, 1],
  [-14, 5.5, 2.8, 0.9, 2.0, -0.3, 2],
  // orta plan: şişenin arkasında, iki yanda
  [5.8, -8, 1.5, 3.0, 1.4, 0.9, 3],
  [-3.2, -16, 1.5, 1.8, 1.3, -0.6, 4],
  [8.4, -11, 2.0, 1.7, 1.8, 0.2, 5],
  // arka plan: kemerin önünde silüetler
  [20, -34, 6, 6, 5, 0.5, 6],
  [-26, -42, 6, 4.2, 5, -0.4, 7],
  [38, -70, 13, 11, 9, 0.1, 8],
  [-36, -74, 12, 14, 9, -0.2, 9],
];

// Uzaktaki ışık kemeri: ince parlak çekirdek, geniş yumuşak hale, içinde çok hafif kızıl sis.
const archMaterial = () =>
  new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    uniforms: { u_on: { value: 0 }, u_time: { value: 0 } },
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }`,
    fragmentShader: `
      varying vec2 vUv; uniform float u_on; uniform float u_time;
      void main(){
        vec2 q = (vUv - .5) * 2.;
        float r = length(q);
        float R = .72;
        float d = r - R;
        float core = exp(-pow(d / .006, 2.));
        float halo = exp(-pow(d / .05, 2.)) * .45 + exp(-pow(d / .16, 2.)) * .16;
        float inner = smoothstep(R, 0., r) * .07 * (1. - smoothstep(0., .9, -q.y + .2));
        // Işık tepede güçlü, yanlara doğru söner (portal tepeden aydınlanır).
        float top = .55 + .45 * smoothstep(-.2, .9, q.y / max(r, .001));
        float breathe = .94 + .06 * sin(u_time * .5);
        vec3 crimson = vec3(.95, .06, .1);
        vec3 deep = vec3(.42, .01, .04);
        vec3 col = crimson * core * 1.6 * top + mix(deep, crimson, .45) * halo * top + deep * inner;
        col += vec3(1., .55, .45) * core * .35 * top;
        gl_FragColor = vec4(col * u_on * breathe, 1.);
      }`,
  });

// Zemine yakın sis bandı (dikey düzlem): ortası hafif kızıl, kenarlara ve yukarı doğru söner.
const fogMaterial = () =>
  new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    uniforms: { u_on: { value: 0 }, u_time: { value: 0 }, u_amt: { value: 0.12 } },
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }`,
    fragmentShader: `
      varying vec2 vUv; uniform float u_on; uniform float u_time; uniform float u_amt;
      void main(){
        float y = vUv.y;
        float band = smoothstep(0., .12, y) * (1. - smoothstep(.12, 1., y));
        float side = smoothstep(0., .25, vUv.x) * smoothstep(1., .75, vUv.x);
        float wisp = .65 + .35 * sin(vUv.x * 9. + u_time * .12) * sin(vUv.x * 4.3 - u_time * .07 + y * 3.);
        gl_FragColor = vec4(vec3(.55, .05, .07) * band * side * wisp * u_amt * u_on, 1.);
      }`,
  });

const DUST = 90;

export default function Crimson() {
  const size = useThree((s) => s.size);
  const aspect = size.width / size.height;
  const root = useRef();
  const rocks = useRef([]);
  const key = useRef();
  const rimL = useRef();
  const rimR = useRef();
  const gold = useRef();
  const fillRed = useRef();
  const fillGold = useRef();
  const arch = useRef();
  const dust = useRef();
  const fog = useRef();
  const fogFar = useRef();
  const st = useRef({ w: 0 });

  const has = useMemo(() => flavors.some((f) => f.scene === "crimson"), []);
  const M = useMemo(
    () => ({
      // Obsidyen: neredeyse siyah; parlaklık yalnızca sahnenin kırmızı ve altın ışıklarından gelir (gökyüzü
      // ortam haritası griye çekmesin diye çok kısık).
      rock: new MeshPhysicalMaterial({ color: "#030202", roughness: 0.36, metalness: 0, specularIntensity: 0.8, specularColor: new Color("#c0483a"), envMapIntensity: 0.04 }),
      veil: new MeshBasicMaterial({ color: "#050203", transparent: true, opacity: 0, depthWrite: false }),
      arch: archMaterial(),
      fog: fogMaterial(),
      fogFar: fogMaterial(),
      dust: new PointsMaterial({ size: 0.06, vertexColors: true, transparent: true, opacity: 0, depthWrite: false, blending: AdditiveBlending, sizeAttenuation: true }),
    }),
    []
  );
  const G = useMemo(() => {
    const geos = ROCKS.map((r) => rockGeometry(r[6]));
    const n = MOBILE ? 50 : DUST;
    const pos = new Float32Array(n * 3);
    const col = new Float32Array(n * 3);
    const seeds = [];
    const g = new Color("#e8b562");
    const r = new Color("#d0202c");
    for (let k = 0; k < n; k++) {
      const c = k % 3 === 0 ? r : g;
      col.set([c.r, c.g, c.b], k * 3);
      seeds.push({ x: (Math.random() - 0.5) * 16, y: Math.random() * 9, z: -Math.random() * 12 + 3, v: 0.05 + Math.random() * 0.12, ph: Math.random() * 6.28 });
    }
    const dustG = new BufferGeometry();
    dustG.setAttribute("position", new BufferAttribute(pos, 3));
    dustG.setAttribute("color", new BufferAttribute(col, 3));
    return { geos, dustG, seeds, n };
  }, []);

  useFrame(({ clock }, delta) => {
    if (!has) return;
    const dt = Math.min(delta, 0.1);
    const t = clock.getElapsedTime();
    const s = st.current;
    const { detail } = useStore.getState();
    const F = lakeFrame(aspect);
    const phone = aspect < 0.9;
    const off = Math.max(sceneState.spread, detail ? 1 : 0);
    const target = sceneWeight("crimson") * (1 - off) * Math.min(1, sceneState.intro * 1.3);
    s.w = MathUtils.damp(s.w, target, 3.2, dt);
    const w = s.w;
    sceneState.crimson = w;
    root.current.visible = w > 0.003;
    if (!root.current.visible) {
      for (const L of [key, rimL, rimR, gold, fillRed, fillGold]) if (L.current) L.current.intensity = 0;
      return;
    }
    const e = w * w * (3 - 2 * w);
    const bx = F.x;
    const fy = F.y;
    const top = fy + 5.6 * (F.sc / 1.55);
    const spread = phone ? 0.5 : MathUtils.clamp(aspect / 1.78, 0.75, 1.15);

    // Kayalar zeminden yükselir (ürün yaklaşırken sahne kurulur).
    ROCKS.forEach((r, k) => {
      const m = rocks.current[k];
      if (!m) return;
      const far = r[1] < -20;
      const x = far ? bx * 0.4 + r[0] * (phone ? 0.6 : 1) : bx + r[0] * spread;
      const rise = MathUtils.smoothstep(e, k * 0.035, 0.75 + k * 0.025);
      m.position.set(x, fy - 0.02 - (1 - rise) * r[3] * 1.3, r[1]);
      const rs = phone && !far ? 0.62 : 1;
      m.scale.set(r[2] * rs, r[3] * rs, r[4] * rs);
      m.rotation.y = r[5];
      m.visible = rise > 0.01;
    });

    // Işıklar: ana (önden-üstten yumuşak), iki kırmızı kenar (arkadan), altın vurgu (kapak hizası), kayalara dolgu.
    const by = fy + 2.6 * (F.sc / 1.55);
    key.current.position.set(bx - 3.5, top + 5, 10);
    key.current.target.position.set(bx, by, 0);
    key.current.intensity = 2.6 * e;
    rimL.current.position.set(bx - 4.5, by + 2.5, -6);
    rimL.current.target.position.set(bx, by, 0);
    rimL.current.intensity = 9 * e;
    rimR.current.position.set(bx + 4.5, by + 1.5, -6);
    rimR.current.target.position.set(bx, by, 0);
    rimR.current.intensity = 7 * e;
    for (const L of [key, rimL, rimR]) L.current.target.updateMatrixWorld();
    gold.current.position.set(bx + 2.2, top - 0.2, 3.2);
    gold.current.intensity = (MOBILE ? 5 : 7) * e;
    fillRed.current.position.set(bx, fy + 4, -22);
    fillRed.current.intensity = 26 * e;
    fillGold.current.position.set(bx - 5, fy + 1.2, 5);
    fillGold.current.intensity = 9 * e;

    // Kemer: şişenin ekrandaki hizasında, ufkun üstünde; alt yarısı suyun/taşın arkasında kalır.
    arch.current.position.set(bx * (128 / 18) * (phone ? 1 : 0.92), fy * 0.9 + 1, -110);
    arch.current.scale.setScalar(phone ? 0.95 : 1.2);
    // Gökyüzü neredeyse siyah bordoya iner: ışığın çoğu kemerden ve şişeden gelir.
    M.veil.opacity = (phone ? 0.9 : 0.84) * e;
    M.arch.uniforms.u_on.value = e;
    M.arch.uniforms.u_time.value = t;
    fog.current.position.set(bx * 0.5, fy + 3.2, -14);
    fogFar.current.position.set(bx, fy + 6.4, -40);
    M.fog.uniforms.u_on.value = e;
    M.fog.uniforms.u_time.value = t;
    M.fogFar.uniforms.u_on.value = e;
    M.fogFar.uniforms.u_time.value = t + 40;

    // Zerreler: çok az, yavaşça yükselir ve süzülür.
    const arr = G.dustG.attributes.position.array;
    G.seeds.forEach((q, k) => {
      const yy = ((q.y + t * q.v) % 9) - 0.5;
      arr[k * 3] = bx + q.x * spread + Math.sin(t * 0.3 + q.ph) * 0.3;
      arr[k * 3 + 1] = fy + yy;
      arr[k * 3 + 2] = q.z;
    });
    G.dustG.attributes.position.needsUpdate = true;
    M.dust.opacity = 0.55 * e;
  });

  if (!has) return null;
  return (
    <>
      <group ref={root} visible={false}>
        {ROCKS.map((r, k) => (
          <mesh key={k} ref={(el) => (rocks.current[k] = el)} geometry={G.geos[k]} material={M.rock} visible={false} />
        ))}
        <mesh position={[0, 0, -149]} material={M.veil} renderOrder={-0.5}>
          <planeGeometry args={[700, 260]} />
        </mesh>
        <mesh ref={arch} material={M.arch} renderOrder={2}>
          <planeGeometry args={[64, 64]} />
        </mesh>
        <mesh ref={fog} material={M.fog} renderOrder={1}>
          <planeGeometry args={[70, 7]} />
        </mesh>
        <mesh ref={fogFar} material={M.fogFar} renderOrder={1}>
          <planeGeometry args={[160, 14]} />
        </mesh>
        <points ref={dust} geometry={G.dustG} material={M.dust} frustumCulled={false} />
      </group>
      {/* Işık sayısı sabit kalsın diye ışıklar hep sahnede (kapalıyken şiddet 0). */}
      <spotLight ref={key} color="#fff1e2" angle={0.42} penumbra={1} decay={0} intensity={0} />
      <spotLight ref={rimL} color="#ff2236" angle={0.5} penumbra={0.9} decay={0} intensity={0} />
      <spotLight ref={rimR} color="#ff3a2a" angle={0.5} penumbra={0.9} decay={0} intensity={0} />
      <pointLight ref={gold} color="#ffb862" distance={9} decay={2} intensity={0} />
      <pointLight ref={fillRed} color="#ff1a28" distance={60} decay={1.4} intensity={0} />
      <pointLight ref={fillGold} color="#ffa94d" distance={14} decay={2} intensity={0} />
    </>
  );
}
