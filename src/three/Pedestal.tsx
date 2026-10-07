import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { palette, pedestal } from './rigState';

/** Krem-beyaz iki katlı alçak kaide; kat kenarlarında ürün renginde halka, altta krom halka */
export const PEDESTAL_H = 0.4;

export function Pedestal() {
  const root = useRef<THREE.Group>(null!);
  const mats = useMemo(
    () => ({
      cream: new THREE.MeshPhysicalMaterial({ color: '#f3ece2', roughness: 0.38, clearcoat: 0.5, clearcoatRoughness: 0.25, envMapIntensity: 0.9 }),
      ring: new THREE.MeshStandardMaterial({ color: '#2a9a88', emissive: '#2a9a88', emissiveIntensity: 0.9, roughness: 0.4 }),
      chrome: new THREE.MeshStandardMaterial({ color: '#f2f2f2', metalness: 1, roughness: 0.12, envMapIntensity: 1.4 }),
    }),
    [],
  );
  useFrame(() => {
    const g = root.current;
    g.visible = pedestal.visible;
    g.position.set(pedestal.x, pedestal.y, pedestal.z);
    g.scale.setScalar(Math.max(0.0001, pedestal.s));
    mats.ring.color.copy(palette.current.color);
    mats.ring.emissive.copy(palette.current.color);
  });
  return (
    <group ref={root}>
      {/* alt kat */}
      <mesh position={[0, 0.09, 0]} material={mats.cream} receiveShadow>
        <cylinderGeometry args={[1.7, 1.7, 0.18, 96]} />
      </mesh>
      <mesh position={[0, 0.18, 0]} rotation={[Math.PI / 2, 0, 0]} material={mats.ring}>
        <torusGeometry args={[1.7, 0.012, 8, 160]} />
      </mesh>
      {/* üst kat */}
      <mesh position={[0, 0.18 + 0.11, 0]} material={mats.cream} receiveShadow>
        <cylinderGeometry args={[1.55, 1.55, 0.22, 96]} />
      </mesh>
      <mesh position={[0, 0.4, 0]} rotation={[Math.PI / 2, 0, 0]} material={mats.ring}>
        <torusGeometry args={[1.55, 0.012, 8, 160]} />
      </mesh>
      {/* krom taban halkası */}
      <mesh position={[0, 0.012, 0]} rotation={[Math.PI / 2, 0, 0]} material={mats.chrome}>
        <torusGeometry args={[1.71, 0.016, 10, 160]} />
      </mesh>
    </group>
  );
}
