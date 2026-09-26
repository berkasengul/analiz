import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { animate } from "framer-motion";
import { easeQuadOut } from "d3-ease";
import { Color, Vector2 } from "three";

import { flavors } from "./data";
import { scrollState } from "./scroll";
import { sceneState } from "./shared";
import { useStore } from "./store";

import "./BackgroundMaterial";

// Carousel yeni bir kutuya oturduğunda (ya da fare öndeki kutuya
// geldiğinde) kutunun etrafından o tatın renginde gürültülü bir halka
// doğar ve ekranın kenarlarına doğru yayılır.
export default function Background() {
  const material = useRef();
  const size = useThree((s) => s.size);
  const color = useMemo(() => new Color(flavors[0].color), []);
  // Her tadın kendi sahne rengi; tat değişince yumuşakça geçer.
  const glow = useMemo(() => new Color(flavors[0].theme.glow), []);
  const edge = useMemo(() => new Color(flavors[0].theme.edge), []);
  const target = useMemo(() => ({ glow: new Color(), edge: new Color() }), []);
  const center = useMemo(() => new Vector2(0.5, 0.6), []);
  const last = useRef({ key: "", controls: null, at: -10, hover: false });

  const pulse = (time) => {
    const l = last.current;
    l.at = time;
    l.controls?.stop();
    l.controls = animate(0, 1, {
      duration: 2.4,
      ease: easeQuadOut,
      onUpdate: (v) => material.current && (material.current.u_progress = v),
    });
  };

  useEffect(() => () => last.current.controls?.stop(), []);

  useFrame(({ clock }, delta) => {
    const l = last.current;
    const time = clock.getElapsedTime();
    const theme = flavors[sceneState.heroFlavor].theme;
    const k = 1 - Math.exp(-2.2 * Math.min(delta, 0.1));
    glow.lerp(target.glow.set(theme.glow), k);
    edge.lerp(target.edge.set(theme.edge), k);
    material.current.u_time = time;
    material.current.u_dark = sceneState.spotlight;
    const st = useStore.getState();

    // Ritüel'de halka ekranın ortasından, carousel'de öndeki kutudan çıkar.
    center.y = scrollState.ritualIn > 0.5 || st.detail ? 0.5 : 0.62;

    const step = scrollState.ritualIn > 0.5 ? Math.round(scrollState.ritualStep) : -1;
    const key = `${sceneState.heroFlavor}-${step}`;
    // Tat değiştiyse, carousel durduğunda halka yayılır.
    if (key !== l.key && !st.moving && st.loaded) {
      l.key = key;
      color.set(flavors[sceneState.heroFlavor].color);
      // Carousel'de yeni tat oturunca kutudan kahve sıçrar.
      if (step < 0 && !st.detail) sceneState.burstAt = time;
      const hsl = {};
      color.getHSL(hsl);
      if (hsl.l < 0.45) color.setHSL(hsl.h, Math.max(hsl.s, 0.45), 0.45);
      pulse(time);
    }
    // Fare öndeki kutuya yeni geldiyse ve son halka bittiyse yeniden yayılır.
    if (sceneState.hoverFocus && !l.hover && time - l.at > 2.4) pulse(time);
    l.hover = sceneState.hoverFocus;
  });

  return (
    <mesh renderOrder={-1} frustumCulled={false}>
      <planeGeometry args={[2, 2]} />
      <backgroundMaterial
        ref={material}
        depthWrite={false}
        u_aspect={size.width / size.height}
        u_color={color}
        u_center={center}
        u_glow={glow}
        u_edge={edge}
      />
    </mesh>
  );
}
