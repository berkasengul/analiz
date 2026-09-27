import { useEffect, useState } from "react";
import { useProgress } from "@react-three/drei";

import { BrandIcon } from "../Icons";
import { content } from "../data";
import { useT } from "../i18n";
import { useStore } from "../store";

// Model ve ortam haritası yüklenene kadar görünen açılış perdesi.
export default function Preloader() {
  const { progress } = useProgress();
  const ready = useStore((s) => s.sceneReady);
  const loaded = useStore((s) => s.loaded);
  const setLoaded = useStore((s) => s.setLoaded);
  const [shown, setShown] = useState(0);
  const { ui, brand } = useT();

  const target = ready ? 100 : Math.min(progress, 92);

  useEffect(() => {
    const id = setInterval(() => setShown((v) => (v < target ? Math.min(target, v + 3) : v)), 24);
    return () => clearInterval(id);
  }, [target]);

  useEffect(() => {
    if (!loaded && ready && shown >= 100) {
      const id = setTimeout(setLoaded, 200);
      return () => clearTimeout(id);
    }
  }, [loaded, ready, shown, setLoaded]);

  return (
    <div className={`loader${loaded ? " is-done" : ""}`} aria-hidden={loaded}>
      <div className="loader__mark">
        {content.logo ? (
          <img className="loader__logo" src={`${import.meta.env.BASE_URL}${content.logo}`} alt={brand.name} />
        ) : (
          <>
            <BrandIcon />
            <span className="brand__name" lang="en">{brand.name}</span>
          </>
        )}
      </div>
      <div className="loader__bar">
        <span style={{ transform: `scaleX(${shown / 100})` }} />
      </div>
      <p className="mono" role="status">
        {String(Math.round(shown)).padStart(3, "0")} — {ui.loading}
      </p>
      <p className="mono loader__note">{ui.madeFor}</p>
    </div>
  );
}
