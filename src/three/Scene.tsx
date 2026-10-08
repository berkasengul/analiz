import { Suspense, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import { products, type ProductId } from '../data/products';
import { useStore, prefersReducedMotion } from '../store';
import { box, onScroll, viewportH } from '../scroll/scroll';
import { Backdrop } from './Backdrop';
import { Floor } from './Floor';
import { Pedestal } from './Pedestal';
import { Dust } from './Dust';
import { Effects } from './Effects';
import { Bottle } from './Bottle';
import { BottleRig } from './BottleRig';
import { Spray } from './Spray';
import { palette } from './rigState';

const TARGET = new THREE.Vector3(0, 0.6, 0);
const pointer = { x: 0, y: 0 };

/** Kamera: fov 32, (0, 1.2, 14) → (0, 0.6, 0); fareyle çok hafif paralaks (±0.3) */
function CameraRig({ still = false }: { still?: boolean }) {
  const camera = useThree((s) => s.camera);
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, []);
  useFrame((_, dt) => {
    const k = still ? 1 : 1 - Math.exp(-Math.min(dt, 0.1) * 2.5);
    if (still) { pointer.x = 0; pointer.y = 0; }
    camera.position.x += (pointer.x * 0.3 - camera.position.x) * k;
    camera.position.y += (1.2 - pointer.y * 0.3 - camera.position.y) * k;
    if (still) camera.position.z = 11.2;
    camera.lookAt(TARGET);
  });
  return null;
}

/** Üstten yumuşak beyaz spot, iki yandan tint renginde kenar ışığı */
function Lights() {
  const left = useRef<THREE.PointLight>(null!);
  const right = useRef<THREE.PointLight>(null!);
  const spot = useRef<THREE.SpotLight>(null!);
  const target = useRef<THREE.Object3D>(null!);
  useEffect(() => {
    spot.current.target = target.current;
  }, []);
  useFrame(() => {
    left.current.color.copy(palette.current.tint);
    right.current.color.copy(palette.current.tint);
  });
  return (
    <>
      <object3D ref={target} position={[0, -0.5, 0]} />
      <spotLight ref={spot} position={[0, 9, 3.5]} angle={0.45} penumbra={1} intensity={42} distance={30} decay={1.6} color="#ffffff" />
      <pointLight ref={left} position={[-5, 2.4, 1.5]} intensity={14} distance={14} decay={1.5} />
      <pointLight ref={right} position={[5, 2.4, 1.5]} intensity={14} distance={14} decay={1.5} />
      <ambientLight intensity={0.15} />
    </>
  );
}

/** İlk kare çizilince yükleyiciye haber ver */
function ReadySignal() {
  const set = useStore((s) => s.setSceneReady);
  const frames = useRef(0);
  useFrame(() => {
    if (++frames.current === 3) set(true);
  });
  return null;
}

/** Sahne tamamen opak HTML bölümlerinin arkasında kaldığında çizimi durdur */
function Pauser() {
  const setFrameloop = useThree((s) => s.setFrameloop);
  useEffect(() => {
    let state: 'always' | 'never' = 'always';
    let y = 0;
    const update = () => {
      const vh = viewportH();
      const all = box('all');
      const story = box('story');
      const s = useStore.getState();
      // ürün detayı ya da menü açıkken sahne her zaman görünür
      const covered =
        !s.detailId && !s.menuOpen &&
        ((y >= all.top && y + vh <= all.top + all.height) || (story.top > 0 && y >= story.top));
      const next = covered ? 'never' : 'always';
      if (next !== state) {
        state = next;
        setFrameloop(next);
      }
    };
    const offScroll = onScroll((v) => { y = v; update(); });
    const offStore = useStore.subscribe(update);
    return () => { offScroll(); offStore(); };
  }, [setFrameloop]);
  return null;
}

export default function Scene({ cardId }: { cardId?: ProductId }) {
  const mobile = !cardId && typeof window !== 'undefined' && window.innerWidth < 760;
  const reduced = prefersReducedMotion();
  return (
    <Canvas
      className="scene"
      dpr={mobile ? [1, 1.5] : [1, 1.75]}
      camera={{ fov: 32, position: [0, 1.2, 14], near: 0.1, far: 80 }}
      gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, powerPreference: 'high-performance', alpha: false }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
      }}
      aria-hidden="true"
    >
      <CameraRig still={!!cardId} />
      {!cardId && <Pauser />}
      <Backdrop />
      <Lights />
      <Suspense fallback={null}>
        <Environment files="/hdri/studio.hdr" environmentIntensity={0.6} />
      </Suspense>
      <BottleRig mobile={mobile} cardId={cardId} />
      <Floor mobile={mobile} />
      <Pedestal />
      {!reduced && <Dust count={cardId ? 90 : mobile ? 160 : 260} />}
      <Suspense fallback={null}>
        {products.map((p) => (
          <Bottle key={p.id} id={p.id} />
        ))}
        {!reduced && !cardId && <Spray count={mobile ? 700 : 1500} />}
        <ReadySignal />
      </Suspense>
      <Effects mobile={mobile} />
    </Canvas>
  );
}
