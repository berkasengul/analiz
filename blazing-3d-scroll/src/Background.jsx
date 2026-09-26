import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { animate } from "framer-motion";
import { easeQuadOut } from "d3-ease";
import { Color } from "three";

import { flavors } from "./data";
import { scrollState } from "./scroll";

import "./BackgroundMaterial";

// Orijinal projedeki radyal gürültü arka planı. Renk, scroll'daki tata göre
// yumuşakça değişir; her tat değişiminde ortadan dışarı bir halka yayılır.
function Background() {
  const material = useRef();
  const [active, setActive] = useState(0);
  const { width, height } = useThree((s) => s.viewport);

  const palette = useMemo(() => flavors.map((f) => new Color(f.color)), []);
  const color = useMemo(() => new Color(flavors[0].color), []);

  useEffect(() => {
    const controls = animate(0, 1, {
      onUpdate(v) {
        if (material.current) material.current.u_progress = v;
      },
      duration: 2,
      ease: easeQuadOut,
    });
    return () => controls.stop();
  }, [active]);

  useFrame(({ clock }, delta) => {
    const f = scrollState.flavor;
    const i = Math.min(Math.floor(f), flavors.length - 2);
    const target = palette[i].clone().lerp(palette[i + 1], f - i);
    color.lerp(target, 1 - Math.exp(-4 * delta));

    material.current.u_time = clock.getElapsedTime();
    material.current.u_color = color;

    const rounded = Math.round(f);
    if (rounded !== active) setActive(rounded);
  });

  return (
    <mesh position={[0, 0, -1]} scale={1.2}>
      <planeGeometry args={[width, height]} />
      <backgroundMaterial ref={material} u_aspect={width / height} u_color={color} />
    </mesh>
  );
}

export default Background;
