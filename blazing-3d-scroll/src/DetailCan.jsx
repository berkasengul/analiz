import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { MathUtils } from "three";
import { animate } from "framer-motion";
import { easeQuadOut } from "d3-ease";

import CanMesh, { canModel } from "./CanMesh";
import { useAluminium } from "./Carousel";
import { createCanMaterial, createCanUniforms, setCanFlavor } from "./canMaterial";
import { flavors } from "./data";
import { pointer } from "./pointer";
import { sceneState } from "./shared";
import { useStore } from "./store";

// Detay görünümündeki büyük kutu. Açılırken carousel'deki aktif kutunun
// yerinden başlar; tat değiştirildiğinde gürültülü doku geçişi oynar.
export default function DetailCan() {
  const { materials } = useGLTF(canModel);
  const aluminium = useAluminium();
  const size = useThree((s) => s.size);

  const uniforms = useMemo(() => createCanUniforms(flavors[0]), []);
  const body = useMemo(() => createCanMaterial(materials.Body, uniforms), [materials, uniforms]);

  const group = useRef();
  const local = useRef({ t: 0, spin: 0 });

  useEffect(() => {
    let controls;
    return useStore.subscribe((s, prev) => {
      if (s.active === prev.active) return;
      const next = flavors[s.active];
      controls?.stop();
      if (!s.detail) {
        setCanFlavor(uniforms, next);
        return;
      }
      // Yarım kalan bir geçiş varsa önce onu bitmiş say.
      uniforms.u_color1.value.copy(uniforms.u_color2.value);
      uniforms.u_ink1.value.copy(uniforms.u_ink2.value);
      uniforms.u_color2.value.set(next.color);
      uniforms.u_ink2.value.set(next.ink);
      controls = animate(0.5, 1, {
        duration: 1.1,
        ease: easeQuadOut,
        onUpdate: (v) => (uniforms.u_progress.value = v),
        onComplete: () => setCanFlavor(uniforms, next),
      });
    });
  }, [uniforms]);

  useFrame(({ clock }, delta) => {
    const dt = Math.min(delta, 0.1);
    const time = clock.getElapsedTime();
    uniforms.u_time.value = time;

    const { detail, spin } = useStore.getState();
    const l = local.current;
    l.t = MathUtils.damp(l.t, detail ? 1 : 0, 4, dt);
    if (spin) l.spin += dt * 1.2;
    else l.spin = MathUtils.damp(l.spin, Math.round(l.spin / (Math.PI * 2)) * Math.PI * 2, 3, dt);

    const visible = detail || l.t > 0.01;
    sceneState.detailVisible = visible;
    group.current.visible = visible;
    if (!visible) return;

    const wide = size.width / size.height >= 0.9;
    const from = sceneState.focus;
    const to = wide
      ? { x: 3.3, y: -0.4, z: 3, rotX: 0.04, rotZ: 0.06, scale: 2.35 }
      : { x: 0, y: 1.9, z: 2, rotX: 0.04, rotZ: 0.08, scale: 1.25 };
    const t = l.t;
    const idleY = Math.sin(time * 0.5) * 0.25 + pointer.x * 0.2 + l.spin;

    group.current.position.set(
      MathUtils.lerp(from.position.x, to.x, t),
      MathUtils.lerp(from.position.y, to.y + Math.sin(time) * 0.06, t),
      MathUtils.lerp(from.position.z, to.z, t)
    );
    group.current.rotation.set(
      MathUtils.lerp(from.rotation.x, to.rotX + pointer.y * 0.06, t),
      MathUtils.lerp(from.rotation.y, idleY, t),
      MathUtils.lerp(from.rotation.z, to.rotZ, t)
    );
    group.current.scale.setScalar(MathUtils.lerp(from.scale, to.scale, t));
  });

  return (
    <group ref={group} visible={false}>
      <CanMesh body={body} aluminium={aluminium} />
    </group>
  );
}
