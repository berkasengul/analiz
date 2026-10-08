import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { MeshReflectorMaterial } from '@react-three/drei';
import { palette, floor } from './rigState';

export const FLOOR_Y = -1.15;

/** Cilalı zemin: yakında opak, uzakta sise karışarak kaybolur */
function useFadeTexture() {
  return useMemo(() => {
    const c = document.createElement('canvas');
    c.width = c.height = 256;
    const g = c.getContext('2d')!;
    const grd = g.createRadialGradient(128, 128, 0, 128, 128, 128);
    grd.addColorStop(0, '#fff');
    grd.addColorStop(0.32, '#fff');
    grd.addColorStop(0.62, '#555');
    grd.addColorStop(1, '#000');
    g.fillStyle = grd;
    g.fillRect(0, 0, 256, 256);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.NoColorSpace;
    return t;
  }, []);
}

export function Floor({ mobile }: { mobile: boolean }) {
  const alphaMap = useFadeTexture();
  const ref = useRef<THREE.MeshStandardMaterial>(null!);
  const mesh = useRef<THREE.Mesh>(null!);
  useFrame(() => {
    ref.current?.color.copy(palette.current.dark);
    mesh.current.position.y = floor.y;
  });
  return (
    <mesh ref={mesh} rotation={[-Math.PI / 2, 0, 0]} position={[0, FLOOR_Y, -2]}>
      <planeGeometry args={[34, 26]} />
      <MeshReflectorMaterial
        ref={ref as never}
        blur={[300, 80]}
        resolution={mobile ? 512 : 1024}
        mixBlur={1}
        mixStrength={0.7}
        mixContrast={1}
        roughness={1}
        metalness={0}
        envMapIntensity={0}
        depthScale={0.6}
        minDepthThreshold={0.4}
        maxDepthThreshold={1.4}
        mirror={0.75}
        color="#06201c"
        alphaMap={alphaMap}
        transparent
        depthWrite={false}
      />
    </mesh>
  );
}
