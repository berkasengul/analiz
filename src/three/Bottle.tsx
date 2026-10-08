import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import { blackCap, getProduct, type ProductId } from '../data/products';
import { getProfile, imageUrl } from './assets';
import { buildBottleGeometries } from './bottleGeometry';
import { buildAtlas } from './bottleAtlas';
import { bottles } from './rigState';
import { useStore, now } from '../store';

const DEG = Math.PI / 180;
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/** Buzlu cam hissi: hafif fresnel kenar parlaması (rim += pow(1-dot(N,V),3)*0.25*tint) */
function addRim(mat: THREE.MeshPhysicalMaterial, tint: THREE.Color, strength = 0.25) {
  const uRim = { value: tint.clone().multiplyScalar(strength) };
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uRim = uRim;
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform vec3 uRim;')
      .replace(
        '#include <opaque_fragment>',
        `{ float fr = pow(1.0 - saturate(dot(normalize(normal), normalize(vViewPosition))), 3.0);
           outgoingLight += fr * uRim; }
         #include <opaque_fragment>`,
      );
  };
  mat.customProgramCacheKey = () => 'unbe-rim';
  return mat;
}

/** Kapak kalkış/iniş eğrisi (sn): 0–0.55 kalkar · 3.1–3.8 kapanır */
export function capLift(t: number) {
  if (t < 0 || t > 3.8) return 0;
  if (t < 0.55) return easeOut(t / 0.55);
  if (t < 3.1) return 1;
  return 1 - easeInOut((t - 3.1) / 0.7);
}

/** Başlığa basma: 0.8'de 0.04 aşağı */
export function pressAmount(t: number) {
  if (t < 0.7 || t > 1.85) return 0;
  if (t < 0.8) return (t - 0.7) / 0.1;
  if (t < 1.6) return 1;
  return 1 - (t - 1.6) / 0.25;
}

export function Bottle({ id }: { id: ProductId }) {
  const product = getProduct(id);
  const profile = getProfile(id);
  const photo = useTexture(imageUrl(id));
  const gl = useThree((s) => s.gl);
  // ön fotoğraf + arka etiket atlası
  const map = useMemo(() => buildAtlas(photo.image as HTMLImageElement, product, profile), [photo, product, profile]);
  const geo = useMemo(() => buildBottleGeometries(profile), [profile]);
  const m = geo.meta;
  const black = blackCap[id];

  useLayoutEffect(() => {
    map.anisotropy = Math.min(8, gl.capabilities.getMaxAnisotropy());
    map.needsUpdate = true;
    return () => map.dispose();
  }, [map, gl]);

  const mats = useMemo(() => {
    const tint = new THREE.Color(product.tint);
    const front = addRim(
      new THREE.MeshPhysicalMaterial({
        map, roughness: 0.28, clearcoat: 1, clearcoatRoughness: 0.12, envMapIntensity: 1.0, transmission: 0,
        emissive: new THREE.Color('#ffffff'), emissiveMap: map, emissiveIntensity: 0.12,
      }),
      tint,
    );
    const side = addRim(
      new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(profile.edgeColor), roughness: 0.28, clearcoat: 1, clearcoatRoughness: 0.12,
        envMapIntensity: 1.0, emissive: new THREE.Color(profile.edgeColor), emissiveIntensity: 0.1,
      }),
      tint,
    );
    const cap = new THREE.MeshPhysicalMaterial({
      map,
      roughness: black ? 0.18 : 0.42,
      clearcoat: black ? 1 : 0.35,
      clearcoatRoughness: black ? 0.08 : 0.3,
      sheen: black ? 0 : 0.6,
      sheenRoughness: 0.5,
      sheenColor: new THREE.Color('#ffffff'),
      envMapIntensity: 1.0,
      emissive: new THREE.Color('#ffffff'), emissiveMap: map, emissiveIntensity: black ? 0.05 : 0.16,
    });
    const metal = new THREE.MeshStandardMaterial({ color: '#e4e4e6', metalness: 1, roughness: 0.22, envMapIntensity: 1.2 });
    const metalDark = new THREE.MeshStandardMaterial({ color: '#b9babd', metalness: 1, roughness: 0.3, envMapIntensity: 1.1 });
    const nozzle = new THREE.MeshBasicMaterial({ color: '#111111' });
    const ring = new THREE.MeshBasicMaterial({
      color: new THREE.Color(product.tint), transparent: true, opacity: 0, blending: THREE.AdditiveBlending,
      depthWrite: false, toneMapped: false,
    });
    return { front, side, cap, metal, metalDark, nozzle, ring, edge: new THREE.Color(profile.edgeColor) };
  }, [map, product.tint, profile.edgeColor, black]);

  useEffect(() => () => {
    Object.values(mats).forEach((v) => v instanceof THREE.Material && v.dispose());
    Object.values(geo).forEach((v) => v instanceof THREE.BufferGeometry && v.dispose());
  }, [mats, geo]);

  const ringGeo = useMemo(() => new THREE.TorusGeometry(1, 0.012, 8, 128), []);
  const root = useRef<THREE.Group>(null!);
  const capPivot = useRef<THREE.Group>(null!);
  const actuator = useRef<THREE.Group>(null!);
  const body = useRef<THREE.Mesh>(null!);
  const top = useRef<THREE.Group>(null!);
  const bottom = useRef<THREE.Mesh>(null!);
  const rings = useRef<THREE.Mesh[]>([]);

  useLayoutEffect(() => {
    bottles[id].group = root.current;
    bottles[id].meta = m;
    return () => { bottles[id].group = null; };
  }, [id, m]);

  const capMid = (m.neckY + m.topY) / 2;
  const capR = m.capHalf;
  const topMid = (m.neckY + m.midY) / 2;
  const botMid = (m.midY + m.bottomY) / 2;
  const ringZ = (r: number) => Math.max(m.depth * 0.5 + 0.22, r * 0.42);

  useFrame(() => {
    const rt = bottles[id];
    const g = root.current;
    g.visible = rt.visible;
    if (!rt.visible) return;
    const c = rt.current;
    g.position.set(c.x, c.y + rt.dropY, c.z);
    g.rotation.set(c.rx, c.ry, c.rz, 'ZYX');
    g.scale.setScalar(Math.max(0.0001, c.s));

    // renk çarpanı
    mats.front.color.setScalar(c.dim);
    mats.front.emissiveIntensity = 0.12 * c.dim;
    mats.cap.color.setScalar(c.dim);
    mats.side.color.copy(mats.edge).multiplyScalar(c.dim);

    // piramit: üç katman
    const e = c.explode;
    const gap = 1.1 * e;
    const split = e > 0.01;
    body.current.visible = !split;
    top.current.visible = true;
    (top.current.children[0] as THREE.Mesh).visible = split;
    bottom.current.visible = split;
    bottom.current.position.y = -gap;

    // parfümü sık: kapak kalkar, başlığa basılır
    const sp = useStore.getState().spray;
    const t = sp && sp.id === id ? now() - sp.t0 : -1;
    const lift = capLift(t);
    const sway = lift * (t > 0.55 && t < 3.1 ? Math.sin((t - 0.55) * 3.2) : 0);
    capPivot.current.position.set(0.25 * lift + sway * 0.02, m.neckY + 0.5 * lift + gap + sway * 0.012, 0);
    capPivot.current.rotation.z = -8 * DEG * lift + sway * 0.6 * DEG;
    actuator.current.position.y = m.neckY + 0.12 - 0.04 * pressAmount(t);

    // katman halkaları
    const ro = Math.min(1, e * 1.6);
    mats.ring.opacity = ro * 0.95;
    const rs = rings.current;
    if (rs[0]) {
      rs[0].visible = rs[1].visible = rs[2].visible = ro > 0.01;
      rs[0].position.y = capMid + gap;
      rs[1].position.y = topMid;
      rs[2].position.y = botMid - gap;
    }
  });

  return (
    <group ref={root} visible={false}>
      {/* gövde (tam) */}
      <mesh ref={body} geometry={geo.body} material={[mats.front, mats.side]} castShadow />
      {/* piramit: gövdenin üst yarısı + sprey başlığı */}
      <group ref={top}>
        <mesh geometry={geo.bodyTop} material={[mats.front, mats.side]} visible={false} />
        {/* gümüş yaka + aktüatör (kapağın altında) */}
        <mesh position={[0, m.neckY + 0.06, 0]} material={mats.metal}>
          <cylinderGeometry args={[0.16, 0.16, 0.12, 40]} />
        </mesh>
        <group ref={actuator} position={[0, m.neckY + 0.12, 0]}>
          <mesh position={[0, 0.07, 0]} material={mats.metalDark}>
            <cylinderGeometry args={[0.12, 0.12, 0.14, 40]} />
          </mesh>
          <mesh position={[0, 0.08, 0.118]} rotation={[Math.PI / 2, 0, 0]} material={mats.nozzle}>
            <cylinderGeometry args={[0.018, 0.018, 0.01, 16]} />
          </mesh>
        </group>
      </group>
      <mesh ref={bottom} geometry={geo.bodyBottom} material={[mats.front, mats.side]} visible={false} />
      {/* kapak: pivot alt kenarında */}
      <group ref={capPivot} position={[0, m.neckY, 0]}>
        <mesh geometry={geo.cap} material={mats.cap} position={[0, -m.neckY, 0]} />
      </group>
      {/* katman halkaları */}
      {[capR * 1.25 + 0.12, m.bodyHalf * 1.12 + 0.14, m.bodyHalf * 1.12 + 0.14].map((r, i) => (
        <mesh
          key={i}
          ref={(el) => { if (el) rings.current[i] = el; }}
          geometry={ringGeo}
          material={mats.ring}
          rotation={[Math.PI / 2, 0, 0]}
          scale={[r, ringZ(r), 1]}
          visible={false}
        />
      ))}
    </group>
  );
}
