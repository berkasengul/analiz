import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { AdditiveBlending, Color, DoubleSide, MeshBasicMaterial, InstancedMesh, MathUtils, MeshPhysicalMaterial, Object3D, OctahedronGeometry, SphereGeometry, Vector3 } from "three";

import { flavors } from "./data";
import { sceneState } from "./shared";

// Parfüm reklamlarındaki sahne: şişelerin arasında kristal parçaları ve
// gül yaprakları süzülür, koku değişince öndeki şişenin kapağından o
// kokunun renginde ince bir esans buğusu yayılır.

const iceMaterial = () =>
  new MeshPhysicalMaterial({
    color: "#e6f5ff",
    roughness: 0.06,
    metalness: 0,
    clearcoat: 1,
    clearcoatRoughness: 0.05,
    envMapIntensity: 2.6,
    transparent: true,
    opacity: 0.3,
    depthWrite: false,
  });

const cubeGeo = new OctahedronGeometry(0.42, 0);
// Gül yaprağı: yassı, hafif kıvrık bir küre parçası.
const beanGeo = new SphereGeometry(0.34, 16, 10, 0, Math.PI * 0.9, 0, Math.PI * 0.45);
const dropGeo = new SphereGeometry(0.035, 8, 6);

const rand = (() => {
  let s = 7;
  return () => ((s = (s * 16807) % 2147483647) / 2147483647);
})();

const CUBES = Array.from({ length: 5 }, (_, i) => ({
  x: (i % 2 ? 1 : -1) * (3.5 + rand() * 5),
  y: -3.5 + rand() * 7,
  z: -3 + rand() * 4,
  s: 0.35 + rand() * 0.45,
  r: rand() * 6,
  sp: 0.2 + rand() * 0.4,
}));
const BEANS = Array.from({ length: 14 }, (_, i) => ({
  x: (i % 2 ? 1 : -1) * (2.2 + rand() * 7),
  y: -4 + rand() * 8,
  z: -2 + rand() * 4.5,
  r: rand() * 6,
  sp: 0.3 + rand() * 0.6,
}));
const DROPS = 56;

export default function IceScene() {
  const floaters = useRef();
  const drops = useRef();
  const state = useRef({ show: 0, burst: -10, flavor: 0, parts: [] });

  const mats = useMemo(() => {
    const cube = iceMaterial();
    cube.opacity = 0.22;
    cube.flatShading = true;
    const bean = new MeshPhysicalMaterial({ color: flavors[0].color, roughness: 0.55, sheen: 1, sheenColor: new Color("#ffffff"), side: DoubleSide });
    const drop = new MeshBasicMaterial({ color: "#f3d9a0", transparent: true, opacity: 0.55, blending: AdditiveBlending, depthWrite: false });
    return { cube, bean, drop };
  }, []);

  const dropMesh = useMemo(() => {
    const m = new InstancedMesh(dropGeo, mats.drop, DROPS);
    m.frustumCulled = false;
    return m;
  }, [mats]);
  const dummy = useMemo(() => new Object3D(), []);
  const tmp = useMemo(() => ({ v: new Vector3(), c: new Color() }), []);

  useFrame(({ clock }, delta) => {
    const dt = Math.min(delta, 0.05);
    const t = clock.getElapsedTime();
    const st = state.current;
    const intro = 1 - Math.pow(1 - sceneState.intro, 3);
    st.show = MathUtils.damp(st.show, 1 - sceneState.spread, 4, dt);
    const show = st.show * intro;

    // Süzülen buz küpleri ve kahve çekirdekleri.
    const f = floaters.current;
    f.visible = show > 0.02;
    f.children.forEach((m, i) => {
      const d = m.userData;
      m.position.set(d.x * (1 + (1 - show) * 0.6), d.y + Math.sin(t * d.sp + d.r) * 0.35, d.z);
      m.rotation.set(t * d.sp * 0.5 + d.r, t * d.sp * 0.7, d.r);
    });
    mats.cube.opacity = 0.22 * show;
    // Yapraklar öndeki kokunun rengine yavaşça döner.
    mats.bean.color.lerp(tmp.c.set(flavors[sceneState.heroFlavor].color), 1 - Math.exp(-2 * dt));

    // Kahve sıçraması: tat oturduğunda kutunun tepesinden damlalar fırlar.
    if (sceneState.burstAt !== st.burst) {
      st.burst = sceneState.burstAt;
      const theme = flavors[sceneState.heroFlavor].theme;
      mats.drop.color.set(theme.drop);
      const fp = sceneState.focus.position;
      st.parts = Array.from({ length: DROPS }, () => {
        const a = Math.random() * Math.PI * 2;
        const up = 1 + Math.random() * 2.5;
        const out = 0.8 + Math.random() * 2.6;
        return {
          p: new Vector3(fp.x + 0.3, fp.y + 2.2, fp.z + 0.2),
          v: new Vector3(Math.cos(a) * out, up, Math.sin(a) * out * 0.6),
          s: 0.5 + Math.random() * 1.6,
          life: 0,
          max: 1.6 + Math.random() * 1.2,
        };
      });
    }
    let alive = 0;
    st.parts.forEach((q, i) => {
      q.life += dt;
      const k = q.life / q.max;
      if (k >= 1) {
        dummy.scale.setScalar(0);
      } else {
        alive++;
        // Buğu: yavaşlayarak süzülür, çok az düşer.
        q.v.multiplyScalar(1 - 1.6 * dt);
        q.v.y -= 0.6 * dt;
        q.p.addScaledVector(q.v, dt);
        dummy.position.copy(q.p);
        const sc = q.s * (1 - k * k) * show;
        // Hız yönünde hafifçe uzayan damla.
        tmp.v.copy(q.v).normalize();
        dummy.lookAt(tmp.v.add(q.p));
        dummy.scale.set(sc, sc, sc * 1.2);
      }
      dummy.updateMatrix();
      dropMesh.setMatrixAt(i, dummy.matrix);
    });
    dropMesh.count = st.parts.length;
    dropMesh.visible = alive > 0;
    dropMesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <>
      <group ref={floaters} visible={false}>
        {CUBES.map((c, i) => (
          <mesh key={`c${i}`} geometry={cubeGeo} material={mats.cube} scale={c.s} userData={c} renderOrder={4} />
        ))}
        {BEANS.map((c, i) => (
          <mesh key={`b${i}`} geometry={beanGeo} material={mats.bean} scale={[1, 1, 1]} userData={c} />
        ))}
      </group>
      <primitive ref={drops} object={dropMesh} />
    </>
  );
}
