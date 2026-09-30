import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { DoubleSide, MathUtils, SRGBColorSpace, TextureLoader } from "three";

import { flavors } from "./data";
import { pointer } from "./pointer";
import { scrollState } from "./scroll";
import { sceneState } from "./shared";
import { useStore } from "./store";

// Nota malzemeleri (demo-fabrikasi/araclar/garnish.py): markanın malzemeli ürün fotoğrafındaki çiçek, meyve,
// baharat… şişenin iki yanında, fotoğraftaki yerlerinde süzülür. Şişe kaideye oturunca iki yandan kayarak
// gelir, hafifçe nefes alır ve fareyle derinlik kazanır; ürün değişirken çekilip yenisininkiler gelir.
const BASE = import.meta.env.BASE_URL;
const loader = new TextureLoader();
const cache = {};
const tex = (file) => {
  if (!cache[file]) {
    cache[file] = loader.load(`${BASE}${file}`);
    cache[file].colorSpace = SRGBColorSpace;
    cache[file].anisotropy = 4;
  }
  return cache[file];
};
const HAS = flavors.some((f) => f.garnish?.length);
const DEBUG = typeof window !== "undefined" && new URLSearchParams(window.location.search).has("sounddebug");

export default function Garnish() {
  const meshes = [useRef(), useRef(), useRef(), useRef()];
  const s = useRef({ shown: -1, alpha: 0, parts: [] });
  // Dokular baştan yüklenir: ürün değişince beklemeden görünsün.
  useMemo(() => flavors.forEach((f) => f.garnish?.forEach((p) => tex(p.file))), []);

  useFrame(({ clock }, delta) => {
    const S = s.current;
    const st = useStore.getState();
    if (DEBUG) window.__garnish = { alpha: S.alpha, shown: S.shown, settled: sceneState.settled, intro: sceneState.intro, swapping: st.swapping, detail: st.detail, bottom: sceneState.focus.bottom, ritual: scrollState.ritualIn, shop: scrollState.shopIn };
    const active = st.active;
    const f = sceneState.focus;
    const ok =
      st.loaded && !st.detail && !st.swapping && sceneState.settled && sceneState.intro > 0.95 && scrollState.ritualIn < 0.05 && scrollState.shopIn < 0.05 && f.bottom != null;
    if (S.shown !== active) {
      // Önce eskiler çekilir, sonra yeni ürünün malzemeleri yüklenir.
      S.alpha = MathUtils.damp(S.alpha, 0, 9, delta);
      if (S.alpha < 0.02) {
        S.shown = active;
        S.parts = flavors[active]?.garnish ?? [];
        S.alpha = 0;
        meshes.forEach((m, k) => {
          const p = S.parts[k];
          if (!m.current) return;
          m.current.visible = !!p;
          if (p) {
            m.current.material.map = tex(p.file);
            m.current.material.needsUpdate = true;
          }
        });
      }
    } else S.alpha = MathUtils.damp(S.alpha, ok ? 1 : 0, ok ? 2.2 : 7, delta);

    const H = (f.top - f.bottom) * f.scale;
    const y0 = f.position.y + f.bottom * f.scale;
    const t = clock.getElapsedTime();
    const e = 1 - Math.pow(1 - S.alpha, 3);
    meshes.forEach((m, k) => {
      const p = S.parts[k];
      if (!m.current || !p || !isFinite(H)) return;
      const side = Math.sign(p.x) || 1;
      const depth = 0.6 + 0.4 * (k % 2);
      m.current.position.set(
        f.position.x + p.x * H + side * (1 - e) * 0.45 * H + pointer.x * 0.035 * H * depth,
        y0 + p.y * H + Math.sin(t * 0.8 + k * 2.1) * 0.012 * H - pointer.y * 0.02 * H * depth + (1 - e) * 0.08 * H,
        f.position.z - 0.35
      );
      m.current.rotation.z = Math.sin(t * 0.55 + k * 1.3) * 0.025 - side * (1 - e) * 0.18;
      const sc = 0.92 + 0.08 * e;
      m.current.scale.set(p.w * H * sc, p.h * H * sc, 1);
      m.current.material.opacity = e;
      m.current.visible = e > 0.01;
    });
  });

  if (!HAS) return null;
  return meshes.map((r, k) => (
    <mesh key={k} ref={r} visible={false} renderOrder={1}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial transparent depthWrite={false} toneMapped={false} side={DoubleSide} opacity={0} />
    </mesh>
  ));
}
