import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { useStore, now } from '../store';
import { getProduct } from '../data/products';
import { bottles } from './rigState';
import { pressAmount } from './Bottle';

const vertex = /* glsl */ `
  attribute vec4 aSeed;
  attribute float aType;
  uniform float uT;
  uniform vec3 uOrigin;
  uniform vec3 uDir;
  uniform float uScale;
  varying float vAlpha;
  varying float vMix;
  varying float vType;

  void main() {
    float emit = aSeed.x * 0.75;            // buğu 0.85–1.6 sn
    float age = uT - emit;
    float mist = step(aType, 0.5);
    float drop = step(0.5, aType) * step(aType, 1.5);
    float cloud = step(1.5, aType);
    float life = mist * mix(0.45, 0.9, aSeed.y) + drop * mix(0.6, 1.1, aSeed.y) + cloud * mix(1.5, 2.3, aSeed.y);
    float k = age / life;
    if (age < 0.0 || k > 1.0) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); gl_PointSize = 0.0; vAlpha = 0.0; return; }

    vec3 d = normalize(uDir);
    vec3 up = abs(d.y) > 0.9 ? vec3(1.0, 0.0, 0.0) : vec3(0.0, 1.0, 0.0);
    vec3 t1 = normalize(cross(d, up));
    vec3 t2 = cross(d, t1);
    float cone = radians(mist * 22.0 + drop * 15.0 + cloud * 30.0);
    float ang = aSeed.z * 6.2831853;
    float rad = tan(cone) * sqrt(aSeed.w);
    vec3 dir = normalize(d + (t1 * cos(ang) + t2 * sin(ang)) * rad);

    float speed = mist * mix(3.4, 5.2, aSeed.y) + drop * mix(2.2, 3.8, aSeed.w) + cloud * mix(0.45, 0.9, aSeed.z);
    float drag = mist * 2.8 + drop * 1.1 + cloud * 1.5;
    float dist = speed * (1.0 - exp(-drag * age)) / drag;
    vec3 pos = uOrigin + dir * dist;
    pos.y -= (drop * 1.5 + mist * 0.12 - cloud * 0.08) * age * age;
    pos += vec3(sin(age * 3.0 + aSeed.z * 20.0), cos(age * 2.3 + aSeed.w * 17.0), sin(age * 2.7 + aSeed.y * 13.0))
           * 0.05 * age * (1.0 + cloud * 3.0);

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;
    float size = mist * mix(0.02, 0.05, aSeed.w)
               + drop * mix(0.04, 0.075, aSeed.z)
               + cloud * mix(0.3, 0.7, aSeed.w) * (0.35 + k * 1.5);
    gl_PointSize = size * uScale / -mv.z;
    float fadeIn = smoothstep(0.0, 0.05, age);
    vAlpha = fadeIn * (1.0 - k) * (mist * 0.55 + drop * 0.95 + cloud * 0.2 * (1.0 - k));
    vMix = k;
    vType = aType;
  }
`;

const fragment = /* glsl */ `
  uniform vec3 uColor0;
  uniform vec3 uColor1;
  varying float vAlpha;
  varying float vMix;
  varying float vType;
  void main() {
    float d = length(gl_PointCoord - 0.5) * 2.0;
    if (d > 1.0) discard;
    float a;
    if (vType > 0.5 && vType < 1.5) {
      // parlayan damlacık: parlak çekirdek
      a = smoothstep(1.0, 0.55, d) + smoothstep(0.35, 0.0, d) * 0.8;
    } else {
      a = pow(1.0 - d, vType > 1.5 ? 1.6 : 2.2);
    }
    vec3 col = mix(uColor0, uColor1, clamp(vMix * 1.3, 0.0, 1.0));
    if (vType > 0.5 && vType < 1.5) col = mix(col, vec3(1.0), 0.5) * 1.6;
    gl_FragColor = vec4(col, a * vAlpha);
  }
`;

const _v = new THREE.Vector3();
const _c = new THREE.Vector3();

/** Parfüm buğusu: 1500 parçacık (telefonda 700); hareket tamamen shader'da */
export function Spray({ count }: { count: number }) {
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const dpr = useThree((s) => s.viewport.dpr);

  const { geo, mat } = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const seed = new Float32Array(count * 4);
    const type = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      for (let j = 0; j < 4; j++) seed[i * 4 + j] = Math.random();
      const r = Math.random();
      type[i] = r < 0.73 ? 0 : r < 0.93 ? 1 : 2; // %73 sis · %20 damlacık · %7 bulut
    }
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 4));
    g.setAttribute('aType', new THREE.BufferAttribute(type, 1));
    const m = new THREE.ShaderMaterial({
      vertexShader: vertex,
      fragmentShader: fragment,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uT: { value: -1 },
        uOrigin: { value: new THREE.Vector3() },
        uDir: { value: new THREE.Vector3(0, 0.25, 1) },
        uScale: { value: 500 },
        uColor0: { value: new THREE.Color('#ffffff') },
        uColor1: { value: new THREE.Color('#ffffff') },
      },
    });
    return { geo: g, mat: m };
  }, [count]);

  const lastT0 = useRef(-1);
  useFrame(() => {
    const sp = useStore.getState().spray;
    const t = sp ? now() - sp.t0 - 0.85 : -1;
    const active = !!sp && t > -0.05 && t < 2.8;
    mat.visible = active;
    if (!active || !sp) return;
    const rt = bottles[sp.id];
    if (rt.group && rt.meta) {
      // başlığın ön yüzündeki meme (dünya koordinatı)
      const press = pressAmount(t + 0.85);
      _v.set(0, rt.meta.neckY + 0.2 - 0.04 * press, 0.13);
      rt.group.localToWorld(_v);
      if (lastT0.current !== sp.t0 || t < 0.05) {
        mat.uniforms.uOrigin.value.copy(_v);
        // yön: ekrana doğru + hafif yukarı
        _c.copy(camera.position).sub(_v).normalize().multiplyScalar(0.85);
        _c.x += 0.42;
        _c.y += 0.3;
        mat.uniforms.uDir.value.copy(_c.normalize());
        mat.uniforms.uColor1.value.set(getProduct(sp.id).tint);
        lastT0.current = sp.t0;
      }
    }
    mat.uniforms.uT.value = t;
    mat.uniforms.uScale.value = (size.height * dpr) / (2 * Math.tan((32 * Math.PI) / 360));
  });

  return <points geometry={geo} material={mat} frustumCulled={false} renderOrder={10} />;
}
