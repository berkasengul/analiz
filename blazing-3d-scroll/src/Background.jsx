import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { animate } from "framer-motion";
import { easeQuadOut } from "d3-ease";
import { Color } from "three";

import { flavors } from "./data";
import { useStore } from "./store";

import "./BackgroundMaterial";

// Her tat değişiminde ortadan o tatın renginde bir halka yayılır.
export default function Background() {
  const material = useRef();
  const size = useThree((s) => s.size);
  const color = useMemo(() => new Color(flavors[0].color), []);

  useEffect(() => {
    let controls;
    const pulse = () => {
      controls?.stop();
      controls = animate(0, 1, {
        duration: 2.2,
        ease: easeQuadOut,
        onUpdate: (v) => material.current && (material.current.u_progress = v),
      });
    };
    pulse();
    const unsubscribe = useStore.subscribe((s, prev) => {
      if (s.active === prev.active) return;
      color.set(flavors[s.active].color);
      pulse();
    });
    return () => {
      controls?.stop();
      unsubscribe();
    };
  }, [color]);

  useFrame(({ clock }) => {
    material.current.u_time = clock.getElapsedTime();
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
