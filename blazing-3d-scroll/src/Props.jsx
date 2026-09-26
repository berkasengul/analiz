import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { MathUtils } from "three";

import { sceneState } from "./shared";

// Üstteki parlak siyah disk ve alttaki cam mercek.
export default function Props() {
  const top = useRef();
  const bottom = useRef();
  const t = useRef(0);
  const size = useThree((s) => s.size);

  useFrame(({ clock }, delta) => {
    const time = clock.getElapsedTime();
    // Carousel dağıldığında (detay ya da sonraki bölüm) disk ve mercek çekilir.
    t.current = MathUtils.damp(t.current, sceneState.spread, 5, Math.min(delta, 0.1));
    const intro = 1 - Math.pow(1 - sceneState.intro, 3);
    const k = size.width / size.height < 0.9 ? 0.6 : 1;

    top.current.position.y = 6.7 + t.current * 4 + (1 - intro) * 4;
    top.current.rotation.z = time * 0.05;
    top.current.scale.setScalar(k);
    bottom.current.position.y = -6.1 - t.current * 4 - (1 - intro) * 4;
    bottom.current.rotation.z = -time * 0.04;
    bottom.current.scale.setScalar(k);
  });

  return (
    <>
      <group ref={top} position={[0, 6.7, -3]} rotation={[1.05, 0, 0]}>
        <mesh>
          <torusGeometry args={[3.1, 1.15, 64, 128]} />
          <meshStandardMaterial color="#060607" metalness={1} roughness={0.14} />
        </mesh>
        <mesh position={[0, 0, -0.2]}>
          <circleGeometry args={[2.2, 96]} />
          <meshStandardMaterial color="#0b0b0d" metalness={0.9} roughness={0.3} />
        </mesh>
      </group>

      <group ref={bottom} position={[0, -6.1, 1]} rotation={[-1.2, 0, 0]}>
        <mesh>
          <torusGeometry args={[4.3, 0.55, 64, 160]} />
          <meshPhysicalMaterial
            color="#d9d9ff"
            metalness={0}
            roughness={0.04}
            transmission={1}
            thickness={1.6}
            ior={1.45}
            clearcoat={1}
            envMapIntensity={1.4}
          />
        </mesh>
        <mesh>
          <cylinderGeometry args={[4.1, 4.1, 0.25, 128, 1]} />
          <meshPhysicalMaterial
            color="#c9c9e6"
            roughness={0.08}
            transmission={1}
            thickness={0.8}
            ior={1.4}
            transparent
            opacity={0.7}
          />
        </mesh>
      </group>
    </>
  );
}
