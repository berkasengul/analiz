import { useFrame } from "@react-three/fiber";
import { MathUtils } from "three";

import { pointer } from "./pointer";
import { scrollState } from "./scroll";

// Fareye göre hafif paralaks, hızlı kaydırmada hafif geri çekilme.
export default function CameraRig() {
  useFrame(({ camera }, delta) => {
    const dt = Math.min(delta, 0.1);
    const speed = Math.min(Math.abs(scrollState.velocity) * 0.03, 1.4);
    camera.position.x = MathUtils.damp(camera.position.x, pointer.x * 0.45, 2.5, dt);
    camera.position.y = MathUtils.damp(camera.position.y, -pointer.y * 0.3, 2.5, dt);
    camera.position.z = MathUtils.damp(camera.position.z, 18 + speed, 3, dt);
    camera.lookAt(0, 0, 0);
  });
  return null;
}
