import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { DoubleSide, MathUtils, SRGBColorSpace, TextureLoader } from "three";

import { flavors } from "./data";
import { pointer } from "./pointer";
import { scrollState } from "./scroll";
import { sceneState, assetUrl } from "./shared";
import { useStore } from "./store";

// Nota malzemeleri (demo-fabrikasi/araclar/garnish.py): markanın malzemeli ürün fotoğrafındaki çiçek, meyve,
// baharat… şişenin iki yanında, fotoğraftaki yerlerinde süzülür. Şişe kaideye oturunca (açılışta inerken)
// iki yandan, kameraya yakın bir yerden dönerek sırayla gelir ve hafif taşmayla yerine oturur; nefes alır,
// fareyle derinlik kazanır. Kaydırınca kaydırmaya bağlı olarak dışarı ve kameraya doğru açılıp kaybolur.
const loader = new TextureLoader();
const cache = {};
const tex = (file) => {
  if (!cache[file]) {
    cache[file] = loader.load(`${assetUrl(file)}`);
    cache[file].colorSpace = SRGBColorSpace;
    cache[file].anisotropy = 4;
  }
  return cache[file];
};
const HAS = flavors.some((f) => f.garnish?.length);

export default function Garnish() {
  const meshes = [useRef(), useRef(), useRef(), useRef()];
  const s = useRef({ shown: -1, enter: 0, out: 1, parts: [] });
  // Dokular baştan yüklenir: ürün değişince beklemeden görünsün.
  useMemo(() => flavors.forEach((f) => f.garnish?.forEach((p) => tex(p.file))), []);

  useFrame(({ clock }, delta) => {
    const S = s.current;
    const st = useStore.getState();
    const dt = Math.min(delta, 0.1);
    const active = st.active;
    const f = sceneState.focus;
    // Çıkış kaydırmaya bağlı: gösterilen ürünün yerinden uzaklaştıkça notalar dışarı ve kameraya doğru açılır
    // (geri kaydırınca geri gelir). Detay, yan ürüne tıklama, ritüel ve mağaza bölümünde hızla çekilir.
    const block = !st.loaded || st.detail || st.swapping || scrollState.ritualIn > 0.05 || scrollState.shopIn > 0.05 || sceneState.intro < 0.5 || f.bottom == null;
    const slot = S.shown >= 0 ? st.order.indexOf(S.shown) : -1;
    const dist = slot >= 0 ? Math.abs(scrollState.p - slot) : 1;
    const outT = block ? 1 : MathUtils.clamp(dist * 2.4, 0, 1);
    S.out = MathUtils.damp(S.out, outT, block ? 5 : 16, dt);
    if (S.shown !== active && (S.out > 0.97 || S.shown < 0)) {
      S.shown = active;
      S.parts = flavors[active]?.garnish ?? [];
      S.enter = 0;
      S.out = MathUtils.clamp(Math.abs(scrollState.p - st.order.indexOf(active)) * 2.4, 0, 1);
      meshes.forEach((m, k) => {
        const p = S.parts[k];
        if (!m.current) return;
        m.current.visible = false;
        if (p) {
          m.current.material.map = tex(p.file);
          m.current.material.needsUpdate = true;
        }
      });
    }
    // Giriş zamana bağlı: ürün yerine oturunca (açılışta şişe kaideye inerken) iki yandan sırayla süzülür.
    if (!block && S.shown === active && Math.abs(scrollState.p - st.order.indexOf(active)) < 0.03) S.enter = Math.min(1, S.enter + dt / 1.7);

    const H = (f.top - f.bottom) * f.scale;
    const y0 = f.position.y + f.bottom * f.scale;
    const t = clock.getElapsedTime();
    const o = Math.pow(S.out, 1.3);
    meshes.forEach((m, k) => {
      const p = S.parts[k];
      if (!m.current || !p || !isFinite(H)) return;
      const side = Math.sign(p.x) || 1;
      const depth = 0.6 + 0.4 * (k % 2);
      // Sırayla giriş: her katman biraz gecikir; hafif taşma ile yerine oturur (easeOutBack).
      const ek = MathUtils.clamp(S.enter * 1.5 - k * 0.22, 0, 1);
      const c1 = 1.25;
      const e = ek <= 0 ? 0 : 1 + (c1 + 1) * Math.pow(ek - 1, 3) + c1 * Math.pow(ek - 1, 2);
      const inv = 1 - e;
      m.current.position.set(
        f.position.x + p.x * H + side * (inv * 1.25 + o * 1.5) * H + pointer.x * 0.035 * H * depth,
        y0 + p.y * H - inv * 0.22 * H + o * 0.3 * H + Math.sin(t * 0.8 + k * 2.1) * 0.012 * H - pointer.y * 0.02 * H * depth,
        f.position.z - 0.35 + inv * 2.4 + o * 2.8
      );
      m.current.rotation.z = Math.sin(t * 0.55 + k * 1.3) * 0.025 + side * (inv * 0.65 - o * 0.45);
      const sc = 1 + inv * 0.3 + o * 0.45;
      m.current.scale.set(p.w * H * sc, p.h * H * sc, 1);
      const a = MathUtils.smoothstep(ek, 0, 0.35) * Math.pow(1 - S.out, 1.2);
      m.current.material.opacity = a;
      m.current.visible = a > 0.01;
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
