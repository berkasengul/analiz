import { useMemo, useRef } from "react";
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

export function useAluminium() {
  const { materials } = useGLTF(canModel);
  return useMemo(() => {
    const m = materials.Alluminium.clone();
    m.metalness = 1;
    m.roughness = 0.22;
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
    x: 5.2 * d * (1 + 0.08 * ad) * spread,
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

  const groups = useRef([]);
  const local = useRef({ p: scrollState.p, detail: 0 });

  useFrame(({ clock }, delta) => {
    const dt = Math.min(delta, 0.1);
    const t = clock.getElapsedTime();
    const s = local.current;
    const { detail, active } = useStore.getState();

    s.p = MathUtils.damp(s.p, scrollState.p, 5, dt);
    s.detail = MathUtils.damp(s.detail, detail ? 1 : 0, 4, dt);
    const aspect = size.width / size.height;
    const nearest = ((Math.round(s.p) % N) + N) % N;

    groups.current.forEach((g, i) => {
      if (!g) return;
      let d = (((i - s.p) % N) + N) % N;
      if (d >= N / 2) d -= N;
      const pose = arcPose(d, aspect, t, i);

      g.position.set(pose.x * (1 + 2.2 * s.detail), pose.y - 2 * s.detail, pose.z);
      g.rotation.set(pose.rotX, pose.rotY, pose.rotZ);
      // Detay açıkken carousel küçülerek kenarlara dağılır ve gizlenir.
      g.scale.setScalar(pose.scale * (1 - 0.5 * s.detail));

      if (i === nearest) {
        sceneState.focus.position.copy(g.position);
        sceneState.focus.rotation.copy(g.rotation);
        sceneState.focus.scale = pose.scale;
      }

      const hidden = sceneState.detailVisible && i === active;
      g.visible = pose.scale > 0.001 && !hidden && s.detail < 0.9;
    });
  });

  const onClick = (i) => (e) => {
    e.stopPropagation();
    if (useStore.getState().detail) return;
    if (i === useStore.getState().active) openDetail();
    else scrollToFlavor(i);
  };

  return flavors.map((f, i) => (
    <group
      key={f.name}
      ref={(el) => (groups.current[i] = el)}
      onClick={onClick(i)}
      onPointerOver={() => (document.body.style.cursor = "pointer")}
      onPointerOut={() => (document.body.style.cursor = "")}
    >
      <CanMesh body={bodies[i]} aluminium={aluminium} />
    </group>
  ));
}
