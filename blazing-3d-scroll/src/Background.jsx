import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { animate } from "framer-motion";
import { easeQuadOut } from "d3-ease";
import { Color } from "three";

import { flavors } from "./data";
import { scrollState } from "./scroll";
import { sceneState } from "./shared";
import { useStore } from "./store";

import "./BackgroundMaterial";

export default function Background() {
  const material = useRef();
  const size = useThree((s) => s.size);
  const color = useMemo(() => new Color(flavors[0].color), []);
  const last = useRef({ flavor: -1, step: -1, controls: null });

  const pulse = () => {
    const l = last.current;
    l.controls?.stop();
    l.controls = animate(0, 1, {
      duration: 2.2,
      ease: easeQuadOut,
      onUpdate: (v) => material.current && (material.current.u_progress = v),
    });
  };

  useEffect(() => () => last.current.controls?.stop(), []);

  useFrame(({ clock }) => {
    const l = last.current;
    material.current.u_time = clock.getElapsedTime();
    // Tat değiştiğinde ya da Ritual'da adım değiştiğinde halka yayılır.
    const step = scrollState.ritualIn > 0.5 ? Math.round(scrollState.ritualStep) : -1;
    if (sceneState.heroFlavor !== l.flavor || step !== l.step) {
      l.flavor = sceneState.heroFlavor;
      l.step = step;
      color.set(flavors[l.flavor].color);
      if (useStore.getState().loaded) pulse();
    }
  });

  return (
    <mesh renderOrder={-1} frustumCulled={false}>
      <planeGeometry args={[2, 2]} />
      <backgroundMaterial
        ref={material}
        depthWrite={false}
        u_aspect={size.width / size.height}
        u_color={color}
      />
    </mesh>
  );
}
