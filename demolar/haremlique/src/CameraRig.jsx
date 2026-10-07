import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { MathUtils } from "three";

import { pointer } from "./pointer";
import { scrollState } from "./scroll";
import { useStore } from "./store";
import { THEME } from "./theme";

// Döner vitrinde kamera biraz yukarıdan bakar: platformun parlak yüzeyi görünür.
const HIGH = THEME.carousel === "orbit" ? 2.3 : 0;

// Sinematik kamera: fareye göre hafif paralaks, elde tutulan kamera gibi çok
// yavaş bir salınım, kaydırırken geri çekilip hızla orantılı hafif yatma;
// ürün ortaya oturunca yavaşça ürüne yaklaşma (push-in).
export default function CameraRig() {
  const l = useRef({ roll: 0, push: 0 });
  useFrame(({ camera, clock }, delta) => {
    camera.layers.enable(1); // arka plan katmanı (Background)
    const dt = Math.min(delta, 0.1);
    const t = clock.getElapsedTime();
    const s = l.current;
    const st = useStore.getState();
    const v = scrollState.velocity;
    const speed = Math.min(Math.abs(v) * 0.03, 1.4);
    // Ürün durduğunda 0 → 1 (yaklaşma), hareket başlayınca hızla geri.
    const settled = !st.moving && !st.detail && Math.abs(v) < 0.5 ? 1 : 0;
    s.push = MathUtils.damp(s.push, settled, settled ? 0.6 : 3, dt);
    s.roll = MathUtils.damp(s.roll, MathUtils.clamp(v * 0.0016, -0.035, 0.035), 3, dt);
    camera.position.x = MathUtils.damp(camera.position.x, pointer.x * 0.45 + Math.sin(t * 0.21) * 0.1, 2.5, dt);
    camera.position.y = MathUtils.damp(camera.position.y, HIGH * (1 - (st.detail ? 1 : 0)) - pointer.y * 0.3 + Math.sin(t * 0.27 + 1.3) * 0.07, 2.5, dt);
    camera.position.z = MathUtils.damp(camera.position.z, 18 + speed - 0.55 * s.push, 3, dt);
    camera.lookAt(0, HIGH * 0.12, 0);
    camera.rotateZ(s.roll);
  });
  return null;
}
