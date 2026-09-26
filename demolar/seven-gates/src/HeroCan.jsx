import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Color, MathUtils } from "three";

const WHITE = new Color(1, 1, 1);
import { animate } from "framer-motion";
import { easeQuadOut } from "d3-ease";

import CanMesh, { createBottleParts, useCanBody } from "./CanMesh";
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
    { x: 3.2, y: 0, z: 2, rotX: 0.05, rotY: Math.sin(time * 0.5) * 0.4, rotZ: -0.08, scale: 1.4 },
    { x: 3.1, y: -0.3, z: 2.2, rotX: 0.45, rotY: 0.4, rotZ: 0.08, scale: 1.45 },
    { x: 3.2, y: 0.1, z: 2, rotX: 0.1, rotY: Math.sin(time * 0.6) * 0.35, rotZ: 0.14, scale: 1.55 },
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
    ? { x: 3.3, y: -0.1, z: 2.5, rotX: 0.05, rotY: Math.sin(time * 0.5) * 0.35, rotZ: -0.05, scale: 1.4 }
    : { x: 0, y: 2.4, z: 1, rotX: 0.05, rotY: Math.sin(time * 0.5) * 0.35, rotZ: -0.05, scale: 0.75 };
}

// Videodan ölçülen detay kompozisyonu: kutu ekranın ~%58'inde, üstü
// kesik, altı ekranın dibine yakın. Özelliklerde kutu dönüp kayar.
function detailPose(feature, wide, time, turn) {
  const f = feature != null ? features[feature].pose : null;
  const idle = Math.sin(time * 0.5) * 0.2 + pointer.x * 0.15;
  const base = wide
    ? { x: 1.3, y: -0.7, z: 3, rotX: 0.03 + pointer.y * 0.04, rotY: idle, rotZ: 0.03, scale: 2.05 }
    : { x: 0, y: 1.9, z: 2, rotX: 0.04, rotY: idle, rotZ: 0.04, scale: 1.05 };
  if (f) {
    base.rotY = f.rotY + Math.sin(time * 0.4) * 0.04 + pointer.x * 0.05;
    base.rotZ = f.rotZ;
    base.rotX = 0.02;
    if (wide) {
      base.y = f.y;
      base.scale = f.scale;
    } else {
      base.y = 1.9 + (f.y + 0.9) * 0.3;
      base.scale = 1.05 * (f.scale / 2.05);
    }
  }
  base.rotY += turn;
  return base;
}

// Tek büyük kutu: carousel'deki aktif kutunun yerinden devralır ve sayfa
// boyunca detay, Ritual ve Shop bölümlerinde farklı pozlara geçer.
// Gösterdiği tat değişince Codrops gürültülü doku geçişini oynatır.
export default function HeroCan() {
  const canBody = useCanBody();
  const parts = useMemo(() => createBottleParts(flavors[0]), []);
  const size = useThree((s) => s.size);

  const uniforms = useMemo(() => createCanUniforms(flavors[0]), []);
  const body = useMemo(() => createCanMaterial(canBody, uniforms), [canBody, uniforms]);

  const group = useRef();
  const spot = useRef();
  const l = useRef({
    detailT: 0,
    target: 0,
    controls: null,
    drag: 0,
    dragTarget: 0,
    dragging: null,
    feature: null,
    poseFeature: null,
    featureAt: 0,
    pose: null,
    wasDetail: false,
    spot: 0,
    sweepAt: 0,
  });

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
    uniforms.u_color2.value.setScalar(1);
    uniforms.u_map1.value = uniforms.u_map2.value;
    uniforms.u_map2.value = f.texture;
    uniforms.u_ink2.value.set(f.ink);
    s.controls = animate(0.5, 1, {
      duration: 1.1,
      ease: easeQuadOut,
      onUpdate: (v) => (uniforms.u_progress.value = v),
      onComplete: () => setCanFlavor(uniforms, f),
    });
  };

  const sweep = () => {
    const s = l.current;
    const f = flavors[s.target];
    s.controls?.stop();
    setCanFlavor(uniforms, f);
    uniforms.u_color1.value.setScalar(1.8);
    uniforms.u_ink1.value.set(f.ink);
    s.controls = animate(0.5, 1, {
      delay: 0.35,
      duration: 1.3,
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
    s.detailT = MathUtils.damp(s.detailT, st.detail ? 1 : 0, 4.2, dt);
    // Özellik değişince önce eski yazı çıkar; kutu kısa bir gecikmeyle hareket eder.
    if (st.feature !== s.feature) {
      s.feature = st.feature;
      s.featureAt = time;
      s.dragTarget = 0;
    }
    if (s.poseFeature !== s.feature && time - s.featureAt > 0.22) {
      s.poseFeature = s.feature;
      s.sweepAt = time;
    }

    // Sinematik mod: özellik yakın çekiminde etikete spot ışık düşer, arka
    // plan kararır. Işık kısa bir süzülmeyle soldan etiketin üstüne gelir.
    const focusOn = st.detail && s.poseFeature != null;
    s.spot = MathUtils.damp(s.spot, focusOn ? 1 : 0, 3, dt);
    sceneState.spotlight = s.spot;
    const sweepK = 1 - Math.pow(1 - Math.min(1, (time - s.sweepAt) / 1.4), 3);
    const light = spot.current;
    light.intensity = s.spot * 9;
    light.position.set(group.current.position.x - 2.8 + sweepK * 2.6, group.current.position.y * 0.2 + 2.2, 11);
    light.target.position.set(group.current.position.x, 0.2, group.current.position.z);
    light.target.updateMatrixWorld();
    // Ortam yansımaları azalır ki spot ışığın kontrastı öne çıksın.
    body.envMapIntensity = 1.35 - 0.75 * s.spot;
    parts.metal.envMapIntensity = 1.3 - 0.7 * s.spot;
    // Detay açılınca kutunun yüzeyinden açık renkli bir ışık süpürmesi geçer.
    if (st.detail && !s.wasDetail) sweep();
    s.wasDetail = st.detail;
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
    uniforms.u_rim.value.set(flavors[want].theme.glow).lerp(WHITE, 0.25).multiplyScalar(0.5 * (1 - 0.6 * s.spot));
    if (!visible) {
      s.scrollPose = null;
      return;
    }

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
    // Kaydırmaya bağlı poz yumuşatılır: hızlı kaydırmada kutu savrulmaz,
    // düzenli ve ağır bir hareketle yeni yerine süzülür.
    if (!s.scrollPose) s.scrollPose = { ...pose };
    else for (const k of KEYS) s.scrollPose[k] = MathUtils.damp(s.scrollPose[k], pose[k], 4.5, dt);
    pose = { ...s.scrollPose };
    // Detay içindeki pozlar arasında yumuşak ama hızlı geçiş (~0,7 sn).
    const target = detailPose(s.poseFeature, wide, time, s.drag);
    if (!s.pose || !st.detail) s.pose = { ...target };
    else for (const k of KEYS) s.pose[k] = MathUtils.damp(s.pose[k], target[k], 5.5, dt);
    pose = lerpPose(pose, s.pose, s.detailT);

    group.current.position.set(pose.x, pose.y, pose.z);
    group.current.rotation.set(pose.rotX, pose.rotY, pose.rotZ);
    group.current.scale.setScalar(pose.scale);
  });

  return (
    <>
    {/* Hep sahnede; yoğunluğu 0 iken görünmez. Işık sayısı sabit kaldığı
        için shader'lar yeniden derlenmez. */}
    <spotLight
      ref={spot}
      intensity={0}
      angle={0.32}
      penumbra={1}
      decay={0}
      color="#ffe6c7"
    />
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
      <CanMesh body={body} parts={parts} />
    </group>
    </>
  );
}
