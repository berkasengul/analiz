import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Color, InstancedMesh, MathUtils, MeshPhysicalMaterial, Object3D, SphereGeometry, Vector3 } from "three";
import { RoundedBoxGeometry } from "three-stdlib";

import { flavors } from "./data";
import { sceneState } from "./shared";

// Kahve reklamlarındaki sahne: öndeki kutu bir buz bloğunun içinde durur,
// etrafta buz küpleri ve kahve çekirdekleri süzülür, tat değişince kutudan
// o tadın renginde (koyu ya da sütlü) kahve sıçrar.

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

const blockGeo = new RoundedBoxGeometry(3.5, 2.9, 2.7, 4, 0.24);
const frostGeo = new RoundedBoxGeometry(3.2, 2.6, 2.4, 2, 0.3);
const cubeGeo = new RoundedBoxGeometry(0.6, 0.6, 0.6, 3, 0.1);
const beanGeo = new SphereGeometry(0.2, 18, 12);
const dropGeo = new SphereGeometry(0.1, 12, 10);

const rand = (() => {
  let s = 7;
  return () => ((s = (s * 16807) % 2147483647) / 2147483647);
})();

const CUBES = Array.from({ length: 9 }, (_, i) => ({
  x: (i % 2 ? 1 : -1) * (3.5 + rand() * 5),
  y: -3.5 + rand() * 7,
  z: -3 + rand() * 4,
  s: 0.55 + rand() * 0.7,
  r: rand() * 6,
  sp: 0.2 + rand() * 0.4,
}));
const BEANS = Array.from({ length: 16 }, (_, i) => ({
  x: (i % 2 ? 1 : -1) * (2.2 + rand() * 7),
  y: -4 + rand() * 8,
  z: -2 + rand() * 4.5,
  r: rand() * 6,
  sp: 0.3 + rand() * 0.6,
}));
const DROPS = 56;

export default function IceScene() {
  const size = useThree((s) => s.size);
  const block = useRef();
  const floaters = useRef();
  const drops = useRef();
  const state = useRef({ show: 0, burst: -10, flavor: 0, parts: [] });

  const mats = useMemo(() => {
    const ice = iceMaterial();
    const frost = iceMaterial();
    frost.roughness = 0.7;
    frost.opacity = 0.14;
    frost.color.set("#ffffff");
    const cube = iceMaterial();
    cube.opacity = 0.42;
    const bean = new MeshPhysicalMaterial({ color: "#3b1e0e", roughness: 0.32, clearcoat: 0.8, clearcoatRoughness: 0.2 });
    const drop = new MeshPhysicalMaterial({ color: "#2a1408", roughness: 0.05, clearcoat: 1, envMapIntensity: 1.6 });
    return { ice, frost, cube, bean, drop };
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
    const wide = size.width / size.height >= 0.9;

    // Buz bloğu: öndeki kutunun alt yarısını sarar.
    const b = block.current;
    b.visible = show > 0.02;
    b.position.set(0, (wide ? -1.35 : -0.6) - (1 - show) * 5, 1.2);
    b.rotation.set(0.04, 0.5 + Math.sin(t * 0.3) * 0.04, 0.02);
    b.scale.setScalar(wide ? 1 : 0.78);
    mats.ice.opacity = 0.3 * show;
    mats.frost.opacity = 0.14 * show;

    // Süzülen buz küpleri ve kahve çekirdekleri.
    const f = floaters.current;
    f.visible = show > 0.02;
    f.children.forEach((m, i) => {
      const d = m.userData;
      m.position.set(d.x * (1 + (1 - show) * 0.6), d.y + Math.sin(t * d.sp + d.r) * 0.35, d.z);
      m.rotation.set(t * d.sp * 0.5 + d.r, t * d.sp * 0.7, d.r);
    });
    mats.cube.opacity = 0.42 * show;

    // Kahve sıçraması: tat oturduğunda kutunun tepesinden damlalar fırlar.
    if (sceneState.burstAt !== st.burst) {
      st.burst = sceneState.burstAt;
      const theme = flavors[sceneState.heroFlavor].theme;
      mats.drop.color.set(theme.drop);
      const fp = sceneState.focus.position;
      st.parts = Array.from({ length: DROPS }, () => {
        const a = Math.random() * Math.PI * 2;
        const up = 3.5 + Math.random() * 5;
        const out = 1.2 + Math.random() * 3.2;
        return {
          p: new Vector3(fp.x + 0.3, fp.y + 2.2, fp.z + 0.2),
          v: new Vector3(Math.cos(a) * out, up, Math.sin(a) * out * 0.6),
          s: 0.5 + Math.random() * 1.6,
          life: 0,
          max: 1.1 + Math.random() * 0.7,
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
        q.v.y -= 9 * dt;
        q.p.addScaledVector(q.v, dt);
        dummy.position.copy(q.p);
        const sc = q.s * (1 - k * k) * show;
        // Hız yönünde hafifçe uzayan damla.
        tmp.v.copy(q.v).normalize();
        dummy.lookAt(tmp.v.add(q.p));
        dummy.scale.set(sc * 0.8, sc * 0.8, sc * 1.6);
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
      <group ref={block} visible={false}>
        <mesh geometry={frostGeo} material={mats.frost} renderOrder={3} />
        <mesh geometry={blockGeo} material={mats.ice} renderOrder={4} />
      </group>
      <group ref={floaters} visible={false}>
        {CUBES.map((c, i) => (
          <mesh key={`c${i}`} geometry={cubeGeo} material={mats.cube} scale={c.s} userData={c} renderOrder={4} />
        ))}
        {BEANS.map((c, i) => (
          <mesh key={`b${i}`} geometry={beanGeo} material={mats.bean} scale={[1, 0.72, 1.35]} userData={c} />
        ))}
      </group>
      <primitive ref={drops} object={dropMesh} />
    </>
  );
}
