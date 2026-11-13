import { Bloom, EffectComposer, Noise, ToneMapping, Vignette } from "@react-three/postprocessing";
import { BlendFunction, ToneMappingMode } from "postprocessing";

import { THEME } from "./theme";

// Sinematik görüntü katmanı (pmndrs/react-postprocessing): parlak noktalarda yumuşak parlama (kapaktaki metal,
// cam kenarı, spot ışığı), kenarlarda karartma ve çok ince film greni. content.theme.fx ile açılır:
//   "fx": true                                  varsayılanlar
//   "fx": { "bloom": 0.55, "threshold": 0.82, "vignette": 0.45, "grain": 0.035 }
// Sahne bir ara yüzeye çizildiği için renk dönüşümü (ACES) burada, efektlerden sonra yapılır.
// Scene.jsx telefonda ve kare hızı düşen cihazda bu katmanı hiç kurmaz.
const D = { bloom: 0.55, threshold: 0.82, vignette: 0.45, grain: 0.035 };
export const FX = THEME.fx ? { ...D, ...(THEME.fx === true ? {} : THEME.fx) } : null;

export default function Effects() {
  if (!FX) return null;
  return (
    <EffectComposer multisampling={4} disableNormalPass>
      {FX.bloom > 0 && <Bloom mipmapBlur intensity={FX.bloom} luminanceThreshold={FX.threshold} luminanceSmoothing={0.2} radius={0.7} />}
      {FX.vignette > 0 && <Vignette offset={0.32} darkness={FX.vignette} eskil={false} />}
      {FX.grain > 0 && <Noise premultiply blendFunction={BlendFunction.SOFT_LIGHT} opacity={FX.grain * 8} />}
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
    </EffectComposer>
  );
}
