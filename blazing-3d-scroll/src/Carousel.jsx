import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { MathUtils } from "three";

import CanMesh, { canModel } from "./CanMesh";
import { createCanMaterial, createCanUniforms } from "./canMaterial";
import { flavors } from "./data";
import { scrollState, scrollToFlavor } from "./scroll";
import { sceneState } from "./shared";
import { useStore } from "./store";

const N = flavors.length;
const easeOut = (t) => 1 - Math.pow(1 - t, 3);

export function useAluminium() {
  const { materials } = useGLTF(canModel);
  return useMemo(() => {
    const m = materials.Alluminium.clone();
    m.metalness = 1;
    m.roughness = 0.2;
    m.envMapIntensity = 1.3;
    return m;
  }, [materials]);
}

// Kutular sonsuz bir yay üzerinde dizilir. d = kutunun aktif tata uzaklığı.
export function arcPose(d, aspect, time, i) {
  const ad = Math.abs(d);
  const focus = Math.max(0, 1 - ad);
  const spread = MathUtils.clamp(aspect / 1.9, 0.44, 1);
  const base = aspect < 0.9 ? 0.78 : 1;
  return {
    x: 4.8 * d * (1 + 0.08 * ad) * spread,
    y: 0.5 - 0.22 * Math.min(ad, 3) + 0.4 * focus + Math.sin(time * 0.9 + i * 1.7) * 0.07,
    z: -0.8 * d * d + focus * 1.2,
    rotX: 0.08,
    rotY: -0.22 * d + (focus > 0 ? Math.sin(time * 0.6) * 0.18 * focus : 0),
    rotZ: 0.13 * d + 0.3 * focus,
    scale: base * (1 + 0.38 * focus) * (1 - MathUtils.smoothstep(ad, 3.6, 4.6)),
  };
}

export default function Carousel() {
  const { materials } = useGLTF(canModel);
  const aluminium = useAluminium();
  const size = useThree((s) => s.size);
  const openDetail = useStore((s) => s.openDetail);

  const bodies = useMemo(
    () => flavors.map((f) => createCanMaterial(materials.Body, createCanUniforms(f))),
    [materials]
  );
  // Her kutunun kendi alüminyumu var; detay açılınca kutular tek tek karartılır.
  const aluminiums = useMemo(() => flavors.map(() => aluminium.clone()), [aluminium]);

  // Bu bileşen render edildiyse model ve doku yüklenmiştir.
  useEffect(() => useStore.getState().setSceneReady(), []);

  const groups = useRef([]);
  const local = useRef({ p: scrollState.p, detail: 0, lean: 0, hovered: -1, hover: flavors.map(() => 0) });

  useFrame(({ clock }, delta) => {
    const dt = Math.min(delta, 0.1);
    const t = clock.getElapsedTime();
    const s = local.current;
    const { detail, active, loaded } = useStore.getState();

    if (loaded) sceneState.intro = Math.min(1, sceneState.intro + dt / 2.6);
    s.p = MathUtils.damp(s.p, scrollState.p, 6, dt);
    s.detail = MathUtils.damp(s.detail, detail ? 1 : 0, 4, dt);
    // Hızlı kaydırınca kutular hafifçe yatar.
    s.lean = MathUtils.damp(s.lean, MathUtils.clamp(scrollState.velocity * 0.012, -0.35, 0.35), 5, dt);

    // Sonraki bölüme geçerken kutular kenarlara dağılır; detay açılınca ise
    // yerlerinde kalıp karanlığa doğru söner (videodaki gibi).
    const spread = scrollState.ritualIn;
    const fade = s.detail;
    sceneState.spread = Math.max(spread, fade);
    const aspect = size.width / size.height;
    const nearest = ((Math.round(s.p) % N) + N) % N;
    sceneState.hoverFocus = s.hovered === nearest && !detail && spread < 0.1 && Math.abs(s.p - Math.round(s.p)) < 0.1;

    groups.current.forEach((g, i) => {
      if (!g) return;
      let d = (((i - s.p) % N) + N) % N;
      if (d >= N / 2) d -= N;
      const pose = arcPose(d, aspect, t, i);
      const intro = easeOut(MathUtils.clamp(sceneState.intro * 1.8 - Math.abs(d) * 0.16, 0, 1));
      s.hover[i] = MathUtils.damp(s.hover[i], s.hovered === i && !detail ? 1 : 0, 8, dt);
      const lift = s.hover[i];

      g.position.set(
        pose.x * (1 + 2.2 * spread + 0.25 * fade),
        pose.y - 2 * spread - (1 - intro) * 9 + lift * 0.25 - 0.4 * fade,
        pose.z - (1 - intro) * 4 - 1.5 * fade
      );
      g.rotation.set(pose.rotX, pose.rotY + (1 - intro) * 2.5, pose.rotZ + s.lean * (1 - Math.abs(d) * 0.15));
      g.scale.setScalar(pose.scale * (1 - 0.5 * spread) * (1 - 0.15 * fade) * (1 + lift * 0.06));
      const dim = 1 - fade;
      bodies[i].userData.uniforms.u_dim.value = dim;
      bodies[i].envMapIntensity = 1.35 * dim;
      bodies[i].clearcoat = Math.max(dim, 0.01); // 0 olursa shader yeniden derlenir
      aluminiums[i].envMapIntensity = 1.3 * dim;
      aluminiums[i].color.setScalar(dim);

      // Büyük kutu buradan (dağılmadan önceki pozdan) devralır.
      if (i === nearest) {
        sceneState.focus.position.set(pose.x, pose.y - (1 - intro) * 9, pose.z - (1 - intro) * 4);
        sceneState.focus.rotation.copy(g.rotation);
        sceneState.focus.scale = pose.scale;
      }

      const hidden = sceneState.heroVisible && i === active;
      g.visible = pose.scale > 0.001 && !hidden && spread < 0.9 && fade < 0.97;
    });
  });

  // Öndeki kutuya tıklamak detayı açar; yandaki bir kutuya tıklamak
  // carousel'i o kutuya döndürür.
  const onClick = (i) => (e) => {
    e.stopPropagation();
    const s = useStore.getState();
    if (s.detail || !s.loaded || scrollState.ritualIn > 0.05) return;
    if (i === s.active) openDetail();
    else scrollToFlavor(i);
  };

  const hover = (i) => (e) => {
    e.stopPropagation();
    local.current.hovered = i;
    document.body.style.cursor = useStore.getState().detail ? "" : "pointer";
  };
  const unhover = (i) => () => {
    if (local.current.hovered === i) local.current.hovered = -1;
    document.body.style.cursor = "";
  };

  return flavors.map((f, i) => (
    <group
      key={f.name}
      ref={(el) => (groups.current[i] = el)}
      onClick={onClick(i)}
      onPointerOver={hover(i)}
      onPointerOut={unhover(i)}
    >
      <CanMesh body={bodies[i]} aluminium={aluminiums[i]} />
    </group>
  ));
}
