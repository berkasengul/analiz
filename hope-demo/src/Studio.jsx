import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { AdditiveBlending, BufferAttribute, BufferGeometry, Color, DoubleSide, MathUtils, Mesh, MeshBasicMaterial, PlaneGeometry, PMREMGenerator, PointsMaterial, Scene, ShaderMaterial } from "three";

import { flavors } from "./data";
import { scrollState, slotIndex } from "./scroll";
import { sceneState } from "./shared";
import { useStore } from "./store";
import { MOBILE } from "./canMaterial";
import { lakeFrame } from "./Lake";

// Gece stüdyosu ("lake" düzeninin ışık ve atmosferi): her koku aynı premium dilde, kendi renginde sergilenir.
// Kalite nesne sayısından değil ışık, malzeme ve kompozisyondan gelir:
//   arka plan  — neredeyse siyah, kesintisiz stüdyo fonu; çok uzakta kokunun renginde büyük, yumuşak bir hale
//   orta plan  — şişe: stüdyo ışık kutularını yansıtan ortam (studioEnv), önden-soldan nötr/sıcak ana ışık,
//                arkadan kokunun renginde çok hafif kenar ışığı, sağ üstten kapağa altın vurgu; altın bölgeler metal
//   zemin      — ıslak siyah taş (Lake): bulanık yansıma, temas gölgesi; halkalar yalnızca geçişte
//   atmosfer   — zemine yakın çok hafif sis, birkaç toz zerresi
// Ağırlık (0–1) sceneState.studio'da: Lake (zemin) ve Carousel (şişe ışığı ve malzemesi) okur.

// Uzaktaki hale: keskin çizgi yok; geniş, yumuşak düşen bir halka ve ortasında hafif atmosfer. Tepede biraz daha
// güçlü (mimari ışık yukarıdan), yanlara ve ufka doğru söner. Renk kokunun vurgusundan, koyulaştırılarak.
const haloMaterial = () =>
  new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    uniforms: { u_on: { value: 0 }, u_time: { value: 0 }, u_color: { value: new Color() } },
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }`,
    fragmentShader: `
      varying vec2 vUv; uniform float u_on; uniform float u_time; uniform vec3 u_color;
      void main(){
        vec2 q = (vUv - .5) * 2.;
        float r = length(q);
        float d = r - .7;
        float ring = exp(-pow(d / .075, 2.)) * .42 + exp(-pow(d / .22, 2.)) * .2;
        float inner = exp(-r * r * 2.2) * .16;
        float top = .45 + .55 * smoothstep(-.3, .95, q.y / max(r, .001));
        float edge = 1. - smoothstep(.75, 1., r);
        float breathe = .96 + .04 * sin(u_time * .4);
        vec3 col = (u_color * ring * top + u_color * .42 * inner) * edge;
        gl_FragColor = vec4(col * u_on * breathe, 1.);
      }`,
  });

const fogMaterial = () =>
  new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    uniforms: { u_on: { value: 0 }, u_time: { value: 0 }, u_amt: { value: 0.12 }, u_color: { value: new Color() } },
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }`,
    fragmentShader: `
      varying vec2 vUv; uniform float u_on; uniform float u_time; uniform float u_amt; uniform vec3 u_color;
      void main(){
        float y = vUv.y;
        float band = smoothstep(0., .12, y) * (1. - smoothstep(.12, 1., y));
        float side = smoothstep(0., .25, vUv.x) * smoothstep(1., .75, vUv.x);
        float wisp = .65 + .35 * sin(vUv.x * 9. + u_time * .12) * sin(vUv.x * 4.3 - u_time * .07 + y * 3.);
        gl_FragColor = vec4(u_color * band * side * wisp * u_amt * u_on, 1.);
      }`,
  });

const DUST = 26;

// Stüdyo ortamı: karanlık bir oda içinde yumuşak dikdörtgen ışık kutuları (solda büyük sıcak ana kutu, sağda ince
// şerit, tepede yumuşak panel, arkada loş sıcak fon). Şişenin camı ve altın bölgeleri bunları yansıtır: ürün
// fotoğrafçılığındaki gibi koyu alanlar arasında net, sıcak parlamalar. Bir kez üretilir.
let STUDIO_ENV = null;
export function studioEnv(gl) {
  if (STUDIO_ENV) return STUDIO_ENV;
  const scene = new Scene();
  scene.background = new Color("#020102");
  const box = (w, h, color, k, pos) => {
    const m = new Mesh(new PlaneGeometry(w, h), new MeshBasicMaterial({ color: new Color(color).multiplyScalar(k), side: DoubleSide }));
    m.position.set(...pos);
    m.lookAt(0, 0, 0);
    scene.add(m);
  };
  box(3.2, 4.2, "#fff1e0", 5.5, [-4.2, 1.6, 4.2]);
  box(0.7, 5.2, "#ffd9a8", 4.2, [4.6, 0.6, 2.4]);
  box(4.5, 2.2, "#fff6ec", 2.2, [0, 6, 0.5]);
  box(9, 4, "#ffe2c4", 0.35, [0, 0.5, -6]);
  box(1.2, 1.2, "#ffc070", 3, [3.2, 3.4, 3.4]);
  const pm = new PMREMGenerator(gl);
  STUDIO_ENV = pm.fromScene(scene, 0.035).texture;
  pm.dispose();
  return STUDIO_ENV;
}

export default function Studio() {
  const size = useThree((s) => s.size);
  const scene = useThree((s) => s.scene);
  const aspect = size.width / size.height;
  const root = useRef();
  // Sahnenin genel (düz beyaz) ortam ve yön ışıkları: stüdyoda kısılır; ürünü stüdyonun kendi ışıkları aydınlatır,
  // zemin de bu ışıkların geniş gri parlamasıyla açılmaz.
  const globals = useRef(null);
  const key = useRef();
  const rimL = useRef();
  const rimR = useRef();
  const gold = useRef();
  const halo = useRef();
  const fog = useRef();
  const st = useRef({ w: 0, col: new Color(flavors[0].theme.accent) });
  const tmp = useMemo(() => new Color(), []);

  const M = useMemo(
    () => ({
      veil: new MeshBasicMaterial({ color: "#050304", transparent: true, opacity: 0, depthWrite: false }),
      halo: haloMaterial(),
      fog: fogMaterial(),
      dust: new PointsMaterial({ size: 0.045, color: new Color("#e2b878"), transparent: true, opacity: 0, depthWrite: false, blending: AdditiveBlending, sizeAttenuation: true }),
    }),
    []
  );
  const G = useMemo(() => {
    const n = MOBILE ? 14 : DUST;
    const dustG = new BufferGeometry();
    dustG.setAttribute("position", new BufferAttribute(new Float32Array(n * 3), 3));
    const seeds = Array.from({ length: n }, () => ({ x: (Math.random() - 0.5) * 14, y: Math.random() * 8, z: -Math.random() * 10 + 2, v: 0.03 + Math.random() * 0.06, ph: Math.random() * 6.28 }));
    return { dustG, seeds };
  }, []);

  useFrame(({ clock }, delta) => {
    const dt = Math.min(delta, 0.1);
    const t = clock.getElapsedTime();
    const s = st.current;
    const { detail, order } = useStore.getState();
    const F = lakeFrame(aspect);
    const phone = aspect < 0.9;
    const off = Math.max(sceneState.spread, detail ? 1 : 0);
    s.w = MathUtils.damp(s.w, (1 - off) * Math.min(1, sceneState.intro * 1.3), 3.2, dt);
    const e = s.w * s.w * (3 - 2 * s.w);
    sceneState.studio = s.w;
    if (!globals.current) {
      globals.current = [];
      scene.traverse((o) => (o.isAmbientLight || o.isDirectionalLight) && globals.current.push({ L: o, base: o.intensity }));
    }
    for (const g of globals.current) g.L.intensity = g.base * (1 - 0.8 * e);
    root.current.visible = s.w > 0.003;

    // Renk: öndeki kokunun vurgusu (geçişte yumuşakça diğerine).
    const f = flavors[order[slotIndex(scrollState.p)]] ?? flavors[0];
    s.col.lerp(tmp.set(f.theme.accent), 1 - Math.exp(-dt * 3));
    const bx = F.x;
    const fy = F.y;
    const by = fy + 2.3 * (F.sc / 1.55);
    const top = fy + 4.8 * (F.sc / 1.55);

    // Işık: önden-soldan yumuşak nötr/sıcak ana ışık; arkadan kokunun renginde çok hafif kenar; sağ üstten kapağa altın.
    key.current.position.set(bx - 6, top + 4, 11);
    key.current.target.position.set(bx, by, 0);
    key.current.intensity = 1.6 * e;
    rimL.current.position.set(bx - 3.5, top + 1.5, -7);
    rimL.current.target.position.set(bx, by, 0);
    rimL.current.intensity = 1.8 * e;
    rimR.current.position.set(bx + 3.5, top + 0.5, -7);
    rimR.current.target.position.set(bx, by, 0);
    rimR.current.intensity = 1.3 * e;
    rimL.current.color.copy(s.col);
    rimR.current.color.copy(s.col).lerp(tmp.set("#ffffff"), 0.15);
    gold.current.position.set(bx + 4.5, top + 3.5, 4);
    gold.current.target.position.set(bx, top - 0.4, 0);
    gold.current.intensity = 2.2 * e;
    for (const L of [key, rimL, rimR, gold]) L.current.target.updateMatrixWorld();

    // Hale: şişenin ekrandaki hizasında, çok uzakta; alt yarısı ufkun arkasında kalır.
    halo.current.position.set(bx * (148 / 18) * (phone ? 1 : 0.95), fy * 0.8 + 2, -130);
    halo.current.scale.setScalar(phone ? 1.05 : 1.55);
    M.halo.uniforms.u_on.value = e;
    M.halo.uniforms.u_time.value = t;
    M.halo.uniforms.u_color.value.copy(s.col).multiplyScalar(0.62);
    M.veil.opacity = (phone ? 0.9 : 0.86) * e;
    fog.current.position.set(bx * 0.5, fy + 3.2, -16);
    M.fog.uniforms.u_on.value = e;
    M.fog.uniforms.u_time.value = t;
    M.fog.uniforms.u_amt.value = 0.06;
    M.fog.uniforms.u_color.value.copy(s.col).multiplyScalar(0.55);

    const arr = G.dustG.attributes.position.array;
    G.seeds.forEach((q, k) => {
      const yy = ((q.y + t * q.v) % 8) - 0.5;
      arr[k * 3] = bx + q.x * (phone ? 0.45 : 1) + Math.sin(t * 0.2 + q.ph) * 0.25;
      arr[k * 3 + 1] = fy + yy;
      arr[k * 3 + 2] = q.z;
    });
    G.dustG.attributes.position.needsUpdate = true;
    M.dust.opacity = 0.16 * e;
  });

  return (
    <>
      <group ref={root} visible={false}>
        {/* Gökyüzünü neredeyse siyaha indiren perde (arka plan katmanının önünde, sahnenin arkasında). */}
        <mesh position={[0, 0, -149]} material={M.veil} renderOrder={-0.5}>
          <planeGeometry args={[700, 260]} />
        </mesh>
        <mesh ref={halo} material={M.halo} renderOrder={2}>
          <planeGeometry args={[64, 64]} />
        </mesh>
        <mesh ref={fog} material={M.fog} renderOrder={1}>
          <planeGeometry args={[70, 7]} />
        </mesh>
        <points geometry={G.dustG} material={M.dust} frustumCulled={false} />
      </group>
      {/* Işık sayısı sabit kalsın diye ışıklar hep sahnede. */}
      <spotLight ref={key} color="#fff2e4" angle={0.3} penumbra={1} decay={0} intensity={0} />
      <spotLight ref={rimL} angle={0.32} penumbra={1} decay={0} intensity={0} />
      <spotLight ref={rimR} angle={0.32} penumbra={1} decay={0} intensity={0} />
      <spotLight ref={gold} color="#ffc27a" angle={0.22} penumbra={1} decay={0} intensity={0} />
    </>
  );
}
