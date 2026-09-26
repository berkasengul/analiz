import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Color, MathUtils } from "three";
import { animate } from "framer-motion";
import { easeQuadOut } from "d3-ease";

import CanMesh, { createBottleParts, dimBottleParts, useCanBody } from "./CanMesh";
import { createCanMaterial, createCanUniforms, setCanFlavor } from "./canMaterial";
import { flavors } from "./data";
import { scrollState, slotIndex } from "./scroll";
import { sceneState } from "./shared";
import { useStore } from "./store";

const N = flavors.length;
const easeOut = (t) => 1 - Math.pow(1 - t, 3);
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
// ?slowmo=8 adresiyle uçuş ağır çekimde oynar (animasyonu incelemek için).
const SLOWMO = typeof window !== "undefined" ? Number(new URLSearchParams(window.location.search).get("slowmo")) || 1 : 1;
const FLIGHT = 1.15 * SLOWMO; // saniye
const KEYS = ["x", "y", "z", "rotX", "rotY", "rotZ", "scale"];

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
    scale: base * (1 + 0.38 * focus) * (1 - MathUtils.smoothstep(ad, Math.min(3.6, N / 2 - 0.6), Math.min(4.6, N / 2))),
  };
}

export default function Carousel() {
  const canBody = useCanBody();
  const size = useThree((s) => s.size);
  const openDetail = useStore((s) => s.openDetail);

  const bodies = useMemo(
    () => flavors.map((f) => createCanMaterial(canBody, createCanUniforms(f))),
    [canBody]
  );
  // Her şişenin kendi cam/kahve/kapak malzemesi var; detay açılınca tek tek karartılır.
  const parts = useMemo(() => flavors.map((f) => createBottleParts(f)), []);

  // Bu bileşen render edildiyse model ve doku yüklenmiştir.
  useEffect(() => useStore.getState().setSceneReady(), []);

  const groups = useRef([]);
  const local = useRef({
    p: scrollState.p,
    detail: 0,
    lean: 0,
    hovered: -1,
    hover: flavors.map(() => 0),
    now: 0,
    flights: {}, // tat → { kind: "in" | "out", t0, from }
    last: flavors.map(() => null), // her kutunun son pozu (uçuş başlangıcı için)
  });

  // Ortaya oturan kutunun yüzeyinden açık renkli, gürültülü bir ışık geçer.
  const sweep = (i) => {
    const u = bodies[i].userData.uniforms;
    const f = flavors[i];
    setCanFlavor(u, f);
    u.u_color1.value.set(f.color).lerp(new Color("#ffffff"), 0.5);
    animate(0.5, 1, {
      duration: 1.2,
      ease: easeQuadOut,
      onUpdate: (v) => (u.u_progress.value = v),
      onComplete: () => setCanFlavor(u, f),
    });
  };

  useFrame(({ clock }, delta) => {
    const dt = Math.min(delta, 0.1);
    const t = clock.getElapsedTime();
    const s = local.current;
    const { detail, active, loaded, order } = useStore.getState();
    s.now = t;
    const slotOf = [];
    order.forEach((flavor, slot) => (slotOf[flavor] = slot));

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
    const nearest = order[slotIndex(s.p)];
    sceneState.hoverFocus = s.hovered === nearest && !detail && spread < 0.1 && Math.abs(s.p - Math.round(s.p)) < 0.1;

    groups.current.forEach((g, i) => {
      if (!g) return;
      let d = (((slotOf[i] - s.p) % N) + N) % N;
      if (d >= N / 2) d -= N;
      let pose = arcPose(d, aspect, t, i);

      // Yer değiştirme uçuşu: gelen kutu öne doğru kavis çizip dönerek
      // ortaya gelir, giden kutu arkadan dolaşıp boşalan slota gider.
      const flight = s.flights[i];
      if (flight) {
        const k = Math.min(1, (t - flight.t0) / FLIGHT);
        const e = easeInOut(k);
        const arc = Math.sin(Math.PI * k);
        const out = {};
        for (const key of KEYS) out[key] = MathUtils.lerp(flight.from[key], pose[key], e);
        if (flight.kind === "in") {
          out.z += 3.2 * arc;
          out.y += 0.9 * arc;
          out.rotY += Math.PI * 2 * e;
          out.rotZ += 0.45 * arc;
          out.scale *= 1 + 0.2 * arc;
        } else {
          out.z -= 2.6 * arc;
          out.y -= 0.5 * arc;
          out.rotY -= Math.PI * 2 * e;
          out.rotZ -= 0.3 * arc;
          out.scale *= 1 - 0.12 * arc;
        }
        pose = out;
        if (k >= 1) {
          delete s.flights[i];
          if (flight.kind === "in") sweep(i);
        }
      }
      s.last[i] = pose;
      const intro = easeOut(MathUtils.clamp(sceneState.intro * 1.8 - Math.abs(d) * 0.16, 0, 1));
      s.hover[i] = MathUtils.damp(s.hover[i], s.hovered === i && !detail ? 1 : 0, 8, dt);
      const lift = s.hover[i];

      g.position.set(
        pose.x * (1 + 2.2 * spread + 0.25 * fade),
        pose.y - 2 * spread - (1 - intro) * 9 + lift * 0.25 - 0.4 * fade,
        pose.z - (1 - intro) * 4 - 1.5 * fade
      );
      g.rotation.set(pose.rotX, pose.rotY + (1 - intro) * 2.5, pose.rotZ + s.lean * (1 - Math.min(Math.abs(d), 4) * 0.15));
      g.scale.setScalar(pose.scale * (1 - 0.5 * spread) * (1 - 0.15 * fade) * (1 + lift * 0.06));
      const dim = 1 - fade;
      bodies[i].userData.uniforms.u_dim.value = dim;
      bodies[i].envMapIntensity = 1.35 * dim;
      bodies[i].clearcoat = Math.max(dim, 0.01); // 0 olursa shader yeniden derlenir
      dimBottleParts(parts[i], dim);

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

  // Öndeki kutuya tıklamak detayı açar. Yandaki bir kutuya tıklamak onu
  // ortadaki kutuyla yer değiştirir (videodaki gibi); diğerleri yerinde kalır.
  const onClick = (i) => (e) => {
    e.stopPropagation();
    const st = useStore.getState();
    if (st.detail || !st.loaded || st.swapping || scrollState.ritualIn > 0.05) return;
    if (i === st.active) {
      openDetail();
      return;
    }
    // Carousel iki tat arasındayken yer değiştirme yapılmaz.
    if (Math.abs(scrollState.p - Math.round(scrollState.p)) > 0.05) return;
    const l = local.current;
    const center = slotIndex(scrollState.p);
    const current = st.order[center];
    const from = st.order.indexOf(i);
    if (!l.last[i] || !l.last[current]) return;
    l.flights[i] = { kind: "in", t0: l.now, from: { ...l.last[i] } };
    l.flights[current] = { kind: "out", t0: l.now, from: { ...l.last[current] } };
    st.swapSlots(from, center);
    st.setActive(i);
    st.setSwapping(true);
    setTimeout(() => useStore.getState().setSwapping(false), FLIGHT * 850);
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
      <CanMesh body={bodies[i]} parts={parts[i]} />
    </group>
  ));
}
