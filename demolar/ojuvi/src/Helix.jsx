import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { AdditiveBlending, BufferAttribute, BufferGeometry, Color, Curve, DoubleSide, MathUtils, MeshPhysicalMaterial, MeshStandardMaterial, PointsMaterial, Vector3 } from "three";

import { flavors } from "./data";
import { scrollState, slotIndex } from "./scroll";
import { sceneState } from "./shared";
import { useStore } from "./store";

// "helix" (koku sarmalı): ürünler siyah camdan, altın kenarlı bir sarmal merdivenin basamaklarında durur.
// Öndeki şişe büyük ve ışıkta; bir önceki koku yukarıda-solda, sıradaki aşağıda-sağda derinlikte görünür.
// Kaydırınca sarmal kendi ekseninde döner ve alçalır: sıradaki şişe aşağıdan dönerek öne, ışığa çıkar.
// Sarmal boyunca kokunun renginde ışık zerreleri akar.

export const HELIX_A = 1.05; // bir ürün aralığında sarmalın döndüğü açı (radyan)

// Ekran oranına göre sarmalın ölçüleri: eksen (x), yarıçap, basamak yüksekliği, öndeki ürünün ayak çizgisi, ölçek.
export function helixFrame(aspect) {
  const phone = aspect < 0.9;
  return phone
    ? { x: 0, R: 1.9, H: 3.5, y0: -1.35, sc: 1.0 }
    : { x: 2.45 * MathUtils.clamp(aspect / 1.9, 0.44, 1), R: 3.3, H: 3.7, y0: -2.75, sc: 1.42 };
}

// d: ürünün öndeki ürüne uzaklığı (kesirli). Ayağının sarmal üzerindeki yeri ve açısı.
export function helixAt(d, aspect) {
  const F = helixFrame(aspect);
  const a = d * HELIX_A;
  return { x: F.x + F.R * Math.sin(a), y: F.y0 - d * F.H, z: F.R * (Math.cos(a) - 1), a, F };
}

const W = 1.5; // basamak (şerit) genişliği
const U0 = -4.2;
const U1 = 2.6;

class Edge extends Curve {
  constructor(r, F) {
    super();
    this.r = r;
    this.F = F;
  }
  getPoint(t, out = new Vector3()) {
    const u = U0 + (U1 - U0) * t;
    const a = u * HELIX_A;
    return out.set(this.r * Math.sin(a), -u * this.F.H - 0.02, this.r * Math.cos(a));
  }
}

function ribbon(F) {
  const n = 420;
  const pos = new Float32Array((n + 1) * 2 * 3);
  const idx = [];
  for (let k = 0; k <= n; k++) {
    const u = U0 + ((U1 - U0) * k) / n;
    const a = u * HELIX_A;
    const y = -u * F.H - 0.03;
    const r0 = F.R - W / 2;
    const r1 = F.R + W / 2;
    pos.set([r0 * Math.sin(a), y, r0 * Math.cos(a), r1 * Math.sin(a), y, r1 * Math.cos(a)], k * 6);
    if (k < n) {
      const i = k * 2;
      idx.push(i, i + 1, i + 2, i + 1, i + 3, i + 2);
    }
  }
  const g = new BufferGeometry();
  g.setAttribute("position", new BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

const COUNT = 220;

export default function Helix() {
  const size = useThree((s) => s.size);
  const aspect = size.width / size.height;
  const F = useMemo(() => helixFrame(aspect), [aspect]);
  const root = useRef();
  const dust = useRef();
  const st = useRef({ away: 0, col: new Color(flavors[0].theme.accent) });
  const target = useMemo(() => new Color(), []);

  const M = useMemo(
    () => ({
      glass: new MeshPhysicalMaterial({ color: "#070504", metalness: 0.25, roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.05, side: DoubleSide, transparent: true, opacity: 0.92, envMapIntensity: 0.55 }),
      gold: new MeshStandardMaterial({ color: "#dcb066", metalness: 1, roughness: 0.24, envMapIntensity: 1.6 }),
      dust: new PointsMaterial({ size: 0.075, color: new Color("#f4c860"), transparent: true, opacity: 0.9, depthWrite: false, blending: AdditiveBlending, sizeAttenuation: true }),
    }),
    []
  );
  const geo = useMemo(() => {
    const strip = ribbon(F);
    const inner = new Edge(F.R - W / 2, F);
    const outer = new Edge(F.R + W / 2, F);
    const seeds = Array.from({ length: COUNT }, (_, k) => ({ u: Math.random(), r: (Math.random() - 0.5) * 1.1 * W, h: 0.05 + Math.random() * 0.9, v: 0.6 + Math.random() * 0.8 }));
    const dustG = new BufferGeometry();
    dustG.setAttribute("position", new BufferAttribute(new Float32Array(COUNT * 3), 3));
    return { strip, inner, outer, seeds, dustG };
  }, [F]);

  useFrame(({ clock }, delta) => {
    const dt = Math.min(delta, 0.1);
    const t = clock.getElapsedTime();
    const s = st.current;
    const { detail, order } = useStore.getState();
    const p = scrollState.p;
    // Sarmal kendini tekrar eder: bir ürün aralığı kadar dönüp alçalınca aynı görünür (kesirli kısım yeter).
    const f = p - Math.floor(p);
    const intro = sceneState.intro;
    const g = root.current;
    s.away = MathUtils.damp(s.away, Math.max(sceneState.spread, detail ? 1 : 0), 4, dt);
    const away = s.away * s.away;
    // Açılışta sarmal dönerek yerine oturur; Ritüel'e geçerken ve detayda aşağı süzülüp söner.
    g.position.set(F.x, F.y0 + f * F.H - 12 * away + (1 - intro) * -3, -F.R);
    g.rotation.y = -f * HELIX_A - (1 - intro) * 2.2;
    g.visible = s.away < 0.97;
    M.glass.opacity = 0.92 * (1 - away);

    // Zerreler kokunun renginde, sarmal boyunca aşağıdan yukarı akar.
    const fl = flavors[order[slotIndex(p)]] ?? flavors[0];
    s.col.lerp(target.set(fl.theme.accent), 1 - Math.exp(-dt * 4));
    M.dust.color.copy(s.col).lerp(target.set("#ffffff"), 0.25);
    M.dust.opacity = 0.85 * Math.min(1, intro * 1.5) * (1 - away);
    const arr = geo.dustG.attributes.position.array;
    geo.seeds.forEach((q, k) => {
      const uu = (((q.u - t * 0.018 * q.v) % 1) + 1) % 1;
      const u = U0 + (U1 - U0) * uu;
      const a = u * HELIX_A;
      const r = F.R + q.r;
      arr[k * 3] = r * Math.sin(a);
      arr[k * 3 + 1] = -u * F.H + q.h + Math.sin(t * 1.3 + k) * 0.05;
      arr[k * 3 + 2] = r * Math.cos(a);
    });
    geo.dustG.attributes.position.needsUpdate = true;
  });

  return (
    <group ref={root}>
      <mesh geometry={geo.strip} material={M.glass} renderOrder={-1} />
      <mesh material={M.gold}>
        <tubeGeometry args={[geo.inner, 600, 0.028, 6, false]} />
      </mesh>
      <mesh material={M.gold}>
        <tubeGeometry args={[geo.outer, 600, 0.045, 8, false]} />
      </mesh>
      <points ref={dust} geometry={geo.dustG} material={M.dust} frustumCulled={false} />
    </group>
  );
}
