import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { MathUtils } from "three";
import { animate } from "framer-motion";
import { easeQuadOut } from "d3-ease";

import CanMesh, { canModel } from "./CanMesh";
import { useAluminium } from "./Carousel";
import { createCanMaterial, createCanUniforms, setCanFlavor } from "./canMaterial";
import { VARIETY, features, flavors, ritual } from "./data";
import { pointer } from "./pointer";
import { scrollState } from "./scroll";
import { sceneState } from "./shared";
import { shopFlavorOf, useStore } from "./store";

const N = flavors.length;
const TAN = Math.tan(MathUtils.degToRad(35 / 2));
const KEYS = ["x", "y", "z", "rotX", "rotY", "rotZ", "scale"];

function lerpPose(a, b, t) {
  const out = {};
  for (const k of KEYS) out[k] = MathUtils.lerp(a[k], b[k], t);
  return out;
}

function ritualPose(step, wide, time) {
  const poses = [
    { x: 3.2, y: 0, z: 2, rotX: 0.05, rotY: Math.sin(time * 0.5) * 0.4, rotZ: -0.12, scale: 1.7 },
    { x: 3.0, y: -0.9, z: 3, rotX: 0.85, rotY: 0.5, rotZ: 0.15, scale: 2.2 },
    { x: 3.2, y: 0.1, z: 2, rotX: 0.1, rotY: time * 1.6, rotZ: 0.32, scale: 1.9 },
  ];
  const i = Math.min(Math.floor(step), 1);
  const p = lerpPose(poses[i], poses[i + 1], step - i);
  if (!wide) {
    p.x = 0;
    p.y = 1.7 + p.y * 0.4;
    p.z -= 1;
    p.scale *= 0.52;
  }
  return p;
}

function shopPose(wide, time) {
  return wide
    ? { x: 3.5, y: -0.1, z: 2.5, rotX: 0.05, rotY: Math.sin(time * 0.5) * 0.35, rotZ: -0.08, scale: 1.75 }
    : { x: 0, y: 2.4, z: 1, rotX: 0.05, rotY: Math.sin(time * 0.5) * 0.35, rotZ: -0.08, scale: 0.9 };
}

function detailPose(feature, wide, time, turn) {
  const f = feature != null ? features[feature].pose : null;
  const idle = Math.sin(time * 0.5) * 0.25 + pointer.x * 0.2;
  const base = wide
    ? { x: 1.5, y: 0.4, z: 3, rotX: 0.04 + pointer.y * 0.05, rotY: idle, rotZ: 0.06, scale: 2.5 }
    : { x: 0, y: 1.9, z: 2, rotX: 0.04, rotY: idle, rotZ: 0.08, scale: 1.25 };
  if (f) {
    base.rotY = f.rotY + Math.sin(time * 0.4) * 0.05;
    base.rotZ = f.rotZ ?? 0.03;
    base.rotX = 0.02;
    if (wide) {
      base.x = 1.5;
      base.y = f.y;
      base.scale = f.scale;
    } else {
      base.y = 1.9 + (f.y - 0.4) * 0.35;
      base.scale = 1.25 * (f.scale / 2.5);
    }
  }
  base.rotY += turn;
  return base;
}

// Tek büyük kutu: carousel'deki aktif kutunun yerinden devralır ve sayfa
// boyunca detay, Ritual ve Shop bölümlerinde farklı pozlara geçer.
// Gösterdiği tat değişince Codrops gürültülü doku geçişini oynatır.
export default function HeroCan() {
  const { materials } = useGLTF(canModel);
  const aluminium = useAluminium();
  const size = useThree((s) => s.size);

  const uniforms = useMemo(() => createCanUniforms(flavors[0]), []);
  const body = useMemo(() => createCanMaterial(materials.Body, uniforms), [materials, uniforms]);

  const group = useRef();
  const l = useRef({ detailT: 0, target: 0, controls: null, drag: 0, dragTarget: 0, dragging: null, feature: null });

  // Detayda kutuyu sürükleyerek döndürme.
  useEffect(() => {
    const move = (e) => {
      const s = l.current;
      if (s.dragging == null) return;
      s.dragTarget += (e.clientX - s.dragging) * 0.012;
      s.dragging = e.clientX;
    };
    const up = () => {
      l.current.dragging = null;
      document.body.style.cursor = "";
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, []);

  const showFlavor = (next, animated) => {
    const s = l.current;
    s.target = next;
    s.controls?.stop();
    const f = flavors[next];
    if (!animated) {
      setCanFlavor(uniforms, f);
      return;
    }
    uniforms.u_color1.value.copy(uniforms.u_color2.value);
    uniforms.u_ink1.value.copy(uniforms.u_ink2.value);
    uniforms.u_color2.value.set(f.color);
    uniforms.u_ink2.value.set(f.ink);
    s.controls = animate(0.5, 1, {
      duration: 1.1,
      ease: easeQuadOut,
      onUpdate: (v) => (uniforms.u_progress.value = v),
      onComplete: () => setCanFlavor(uniforms, f),
    });
  };

  useFrame(({ clock }, delta) => {
    const dt = Math.min(delta, 0.1);
    const time = clock.getElapsedTime();
    uniforms.u_time.value = time;

    const st = useStore.getState();
    const s = l.current;
    const r = scrollState;
    s.detailT = MathUtils.damp(s.detailT, st.detail ? 1 : 0, 3.6, dt);
    if (st.feature !== s.feature) {
      s.feature = st.feature;
      s.dragTarget = 0;
    }
    if (!st.detail) s.dragTarget = 0;
    s.drag = MathUtils.damp(s.drag, s.dragTarget, 6, dt);

    const visible = r.ritualIn > 0.002 || s.detailT > 0.01;
    sceneState.heroVisible = visible;
    group.current.visible = visible;

    // Gösterilecek tat: mağazada seçilen, yoksa carousel'deki aktif tat.
    // Gösterilecek tat: mağazada seçilen, Ritual'da adımın tadı,
    // aksi halde carousel'deki aktif tat.
    let want = st.active;
    if (!st.detail && r.shopIn > 0.5) {
      const shop = shopFlavorOf(st);
      want = shop === VARIETY ? Math.floor(time / 1.8) % N : shop;
    } else if (!st.detail && r.ritualIn > 0.5) {
      want = ritual[Math.round(r.ritualStep)].flavor;
    }
    if (want !== s.target) showFlavor(want, visible);
    sceneState.heroFlavor = want;
    if (!visible) return;

    const wide = size.width / size.height >= 0.9;
    const focus = sceneState.focus;
    let pose = {
      x: focus.position.x,
      y: focus.position.y,
      z: focus.position.z,
      rotX: focus.rotation.x,
      rotY: focus.rotation.y,
      rotZ: focus.rotation.z,
      scale: focus.scale,
    };
    pose = lerpPose(pose, ritualPose(r.ritualStep, wide, time), r.ritualIn);
    pose = lerpPose(pose, shopPose(wide, time), r.shopIn);
    pose.y += r.shopOut * 2 * (18 - pose.z) * TAN;
    pose = lerpPose(pose, detailPose(st.feature, wide, time, s.drag), s.detailT);

    group.current.position.set(pose.x, pose.y, pose.z);
    group.current.rotation.set(pose.rotX, pose.rotY, pose.rotZ);
    group.current.scale.setScalar(pose.scale);
  });

  return (
    <group
      ref={group}
      visible={false}
      onPointerDown={(e) => {
        if (!useStore.getState().detail) return;
        e.stopPropagation();
        l.current.dragging = e.clientX;
        document.body.style.cursor = "grabbing";
      }}
    >
      <CanMesh body={body} aluminium={aluminium} />
    </group>
  );
}
