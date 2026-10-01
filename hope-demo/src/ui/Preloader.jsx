import { useEffect, useState } from "react";
import { useProgress } from "@react-three/drei";

import { BrandIcon } from "../Icons";
import { content } from "../data";
import { useT } from "../i18n";
import { useStore } from "../store";
import { THEME } from "../theme";
import { sceneState } from "../shared";

const SEEN_KEY = "intro-seen";
// Sinematik açılış (theme.opening; ferah sahnede varsayılan): karanlıkta logo altın ışık süzmesiyle belirir,
// altında slogan; sonra perde ortadan dairesel açılır ve ilk şişe yukarıdan kaideye iner (Carousel →
// sceneState.introAt). Oturumun ilk açılışında; ?shot (ekran görüntüsü) adresinde yok.
const SHOT = typeof window !== "undefined" && new URLSearchParams(window.location.search).has("shot");
const OPENING = !SHOT && (THEME.opening ?? !!THEME.fresh);
let SEEN = false;
try {
  SEEN = sessionStorage.getItem(SEEN_KEY) === "1";
} catch {}

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
    // Oturumun ilk açılışından sonra (başka sayfaya geçiş, yenileme) perde beklemeden kalkar.
    const step = SEEN ? 25 : THEME.intro ? 6 : 3;
    const id = setInterval(() => setShown((v) => (v < target ? Math.min(target, v + step) : v)), 24);
    return () => clearInterval(id);
  }, [target]);

  useEffect(() => {
    if (!loaded && ready && shown >= 100) {
      const id = setTimeout(() => {
        // Şişeler perde açılırken insin.
        if (OPENING && !SEEN) sceneState.introAt = performance.now() + 1300;
        setLoaded();
        try {
          sessionStorage.setItem(SEEN_KEY, "1");
        } catch {}
      }, SEEN ? 0 : 150);
      return () => clearTimeout(id);
    }
  }, [loaded, ready, shown, setLoaded]);

  if (THEME.intro || OPENING) return <Mark shown={shown} loaded={loaded} ui={ui} brand={brand} cine={OPENING && !SEEN} />;

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

// Temalı markalarda sade ve hızlı açılış: karanlıkta logo, altında ince altın bir yükleme
// çizgisi; sahne hazır olunca perde yumuşakça kalkar. Oturumda yalnızca ilk açılışta görünür;
// sonraki sayfa geçişlerinde yalnızca kısa bir kararma kalır.
function Mark({ shown, loaded, ui, brand, cine }) {
  const logo = content.logo ? `${import.meta.env.BASE_URL}${content.logo}` : null;
  return (
    <div className={`mark${loaded ? " is-done" : ""}${SEEN ? " is-quick" : ""}${cine ? " mark--cine" : ""}`} aria-hidden={loaded}>
      {!SEEN && (
        <div className="mark__inner">
          <span className="mark__logowrap">
            {logo ? (
              <img className="mark__logo" src={logo} alt={brand.name} />
            ) : (
              <span className="mark__name" lang="en">{brand.name}</span>
            )}
            {cine && logo && <span className="mark__sweep" style={{ "--logo": `url("${new URL(logo, document.baseURI).href}")` }} aria-hidden="true" />}
          </span>
          {cine && ui.slogan && <p className="mark__slogan">{ui.slogan}</p>}
          <span className="mark__line" role="progressbar" aria-label={ui.loading} aria-valuenow={Math.round(shown)}>
            <span style={{ transform: `scaleX(${shown / 100})` }} />
          </span>
        </div>
      )}
    </div>
  );
}
