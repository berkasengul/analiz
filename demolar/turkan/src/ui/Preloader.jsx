import { useEffect, useState } from "react";
import { useProgress } from "@react-three/drei";

import { BrandIcon } from "../Icons";
import { content } from "../data";
import { useT } from "../i18n";
import { useStore } from "../store";
import { THEME } from "../theme";

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
    // Kapı açılışında sayı sayacı en az ~2,5 saniye akar (hızlı bağlantıda da görülsün).
    const step = THEME.intro === "portal" ? 1 : 3;
    const id = setInterval(() => setShown((v) => (v < target ? Math.min(target, v + step) : v)), 24);
    return () => clearInterval(id);
  }, [target]);

  useEffect(() => {
    if (!loaded && ready && shown >= 100) {
      const id = setTimeout(setLoaded, 200);
      return () => clearTimeout(id);
    }
  }, [loaded, ready, shown, setLoaded]);

  if (THEME.intro === "portal") return <Portal shown={shown} loaded={loaded} ui={ui} brand={brand} />;

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

// Kapı açılışı: karanlıkta ince altın bir kapı (şişenin kemerli silüeti) çizilir, içinde
// sayılar 1'den 10'a akar; yükleme bitince kapı büyüyerek açılır ve sahne kapının
// içinden görünür (karanlık katman kapı biçiminde delinir).
const ARCH = "M -60 110 L -60 -40 A 60 60 0 0 1 60 -40 L 60 110 Z";
const ARCH_LEN = 150 + Math.PI * 60 + 150 + 120; // yanlar + kemer + taban

function Portal({ shown, loaded, ui, brand }) {
  const n = Math.max(1, Math.min(10, Math.ceil(shown / 10)));
  return (
    <div className={`portal${loaded ? " is-open" : ""}`} aria-hidden={loaded}>
      <svg className="portal__veil" viewBox="-500 -500 1000 1000" preserveAspectRatio="xMidYMid slice">
        <defs>
          <mask id="portal-hole">
            <rect x="-2000" y="-2000" width="4000" height="4000" fill="#fff" />
            <path className="portal__hole" d={ARCH} fill="#000" />
          </mask>
        </defs>
        <rect x="-2000" y="-2000" width="4000" height="4000" fill="var(--portal-bg, #070605)" mask="url(#portal-hole)" />
        <path className="portal__arch" d={ARCH} strokeDasharray={ARCH_LEN} strokeDashoffset={ARCH_LEN * (1 - shown / 100)} />
      </svg>
      <div className="portal__num">
        <span>No/</span>
        <b key={n}>{n}</b>
      </div>
      <div className="portal__foot">
        {content.logo ? <img className="portal__logo" src={`${import.meta.env.BASE_URL}${content.logo}`} alt={brand.name} /> : <span>{brand.name}</span>}
        <p className="mono" role="status">
          {String(Math.round(shown)).padStart(3, "0")} — {ui.loading}
        </p>
      </div>
    </div>
  );
}
