import { useEffect, useMemo, useRef, useState } from "react";

import { content } from "../data";
import { useStore } from "../store";
import silk from "../vendor/threeui/cloth-silk.html?raw";

// Marka kumaşı (content.theme.cloth): ThreeUI Community'nin "Woven Cloth" sahnesi (MIT, vendor/threeui/):
// fizikle dalgalanan ipek, üzerinde markanın adı dokunmuş. Kendi WebGL bağlamı olan bir iframe; yalnızca ekrana
// yaklaşınca açılır, uzaklaşınca kapanır (ekran kartı ana sahneyle paylaşılır).
//   { "mono": "SH", "sub": "P A R I S", "l1": "SHAURAN", "l2": "", "tag": "E A U   D E   P A R F U M",
//     "bg": "#0c0807", "sheen": "#f3c9a8", "rimCool": "#d9a07a", "rimWarm": "#ff9a6a", "fill": "#b07a5a",
//     "ambient": "#3a2a24", "key": "#fff1e4", "caption": {"tr": "...", "en": "..."},
//     "filter": "sepia(.8) saturate(1.2) hue-rotate(-12deg)" }   kumaşın gökkuşağı yanardönerini markanın rengine çeker
export const CLOTH = content.theme?.cloth ?? null;

export default function BrandCloth() {
  const lang = useStore((s) => s.lang);
  const ref = useRef();
  const [near, setNear] = useState(false);
  const doc = useMemo(() => (CLOTH ? silk.replace("/*CLOTH*/", `window.CLOTH = ${JSON.stringify(CLOTH)};`) : null), []);
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => setNear(e.isIntersecting), { rootMargin: "300px 0px" });
    io.observe(ref.current);
    return () => io.disconnect();
  }, []);
  if (!CLOTH) return null;
  const caption = CLOTH.caption?.[lang] ?? CLOTH.caption?.tr;
  return (
    <section ref={ref} className="cloth" aria-label={content.brand?.name} style={{ background: CLOTH.bg ?? "#05060d" }}>
      {near && <iframe className="cloth__frame" title={content.brand?.name} srcDoc={doc} sandbox="allow-scripts" loading="lazy" tabIndex={-1} style={CLOTH.filter ? { filter: CLOTH.filter } : undefined} />}
      {caption && <p className="cloth__caption">{caption}</p>}
    </section>
  );
}
