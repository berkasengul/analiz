import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import { MathUtils } from "three";

import { flavors } from "./data";
import { sceneState } from "./shared";
import { useStore } from "./store";
import { THEME, numeralOf } from "./theme";

const FONT = `${import.meta.env.BASE_URL}${THEME.numerals?.font ?? "fonts/Italiana-Regular.ttf"}`;
const GOLD = THEME.accent ?? "#c9a55c";
const NUMS = flavors.map((f) => numeralOf(f.name));

// "Her his bir sayı": öndeki kokunun numarası, şişenin arkasında dev, ince çizgili altın
// bir sayı. Koku değişince eski sayı yukarı süzülüp söner, yenisi aşağıdan yükselir
// (sayı sayacı gibi). Ritüele geçerken ve detay açıkken geri çekilir.
export default function Numeral() {
  const refs = [useRef(), useRef()];
  const s = useRef({ slot: 0, shown: null, t: [1, 1], dir: [1, 1], vis: 0 });

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.1);
    const st = useStore.getState();
    const S = s.current;
    const want = NUMS[st.active] ?? null;
    if (want !== S.shown) {
      // Eski sayı çıkar, yeni sayı diğer yuvada girer.
      S.t[S.slot] = 0;
      S.dir[S.slot] = -1;
      S.slot = 1 - S.slot;
      S.shown = want;
      S.t[S.slot] = 0;
      S.dir[S.slot] = 1;
      const txt = refs[S.slot].current;
      if (txt) {
        txt.text = want ?? "";
        txt.sync();
      }
    }
    const target = (1 - sceneState.spread) * (st.detail ? 0 : 1) * Math.min(1, sceneState.intro * 1.4);
    S.vis = MathUtils.damp(S.vis, target, 3, dt);
    const f = sceneState.focus.position;
    for (let i = 0; i < 2; i++) {
      const txt = refs[i].current;
      if (!txt) continue;
      S.t[i] = Math.min(1, S.t[i] + dt / 1.1);
      const e = 1 - Math.pow(1 - S.t[i], 3);
      const inn = S.dir[i] > 0;
      const a = (inn ? e : 1 - e) * S.vis;
      const y = inn ? (1 - e) * -1.6 : e * 1.8;
      txt.position.set(f.x * 0.35, 1.5 + y, -8);
      txt.strokeOpacity = 0.85 * a;
      txt.fillOpacity = 0.07 * a;
      txt.visible = a > 0.002;
    }
  });

  return (
    <group>
      {[0, 1].map((i) => (
        <Text
          key={i}
          ref={refs[i]}
          font={FONT}
          fontSize={16}
          anchorX="center"
          anchorY="middle"
          letterSpacing={-0.02}
          color={GOLD}
          fillOpacity={0}
          strokeColor={GOLD}
          strokeWidth={0.03}
          strokeOpacity={0}
        >
          {""}
        </Text>
      ))}
    </group>
  );
}
