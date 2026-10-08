import { useEffect, useState } from 'react';
import { useStore, prefersReducedMotion } from '../store';
import { copy } from '../data/copy';
import { preloadAssets } from '../three/assets';

/**
 * Açılış: siyah zemin, logo ve ince ilerleme çizgisi. Yükleme bitince logonun üstünden ışık süzülür,
 * "Duruşunu seç." belirir ve sahne ortadan dairesel olarak açılır (portal).
 */
export function Loader() {
  const [p, setP] = useState(0);
  const [gone, setGone] = useState(false);
  const loaded = useStore((s) => s.loaded);
  const ready = useStore((s) => s.sceneReady);
  const lang = useStore((s) => s.lang);
  const setLoaded = useStore((s) => s.setLoaded);
  const setSceneReady = useStore((s) => s.setSceneReady);

  useEffect(() => {
    let alive = true;
    preloadAssets((f) => alive && setP(f))
      .catch(() => { /* görsel eksikse yine de devam */ })
      .finally(() => alive && setLoaded(true));
    return () => { alive = false; };
  }, [setLoaded]);

  // WebGL açılamazsa sayfa yine kullanılabilir olsun
  useEffect(() => {
    if (!loaded) return;
    const t = setTimeout(() => setSceneReady(true), 12000);
    return () => clearTimeout(t);
  }, [loaded, setSceneReady]);

  const done = loaded && ready;
  useEffect(() => {
    if (!done) return;
    const t = setTimeout(() => setGone(true), prefersReducedMotion() ? 400 : 2600);
    return () => clearTimeout(t);
  }, [done]);

  if (gone) return null;
  return (
    <div
      className={`mark${done ? ' is-done' : ''}`}
      role="progressbar"
      aria-label="UnBe."
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round((done ? 1 : p * 0.9) * 100)}
    >
      <div className="mark__inner">
        <span className="mark__logowrap">
          <img src="/brand/logo.png" alt="UnBe." className="mark__logo" width={138} height={44} />
          <i className="mark__sweep" aria-hidden="true" />
        </span>
        <div className="mark__line"><span style={{ transform: `scaleX(${done ? 1 : p * 0.9})` }} /></div>
        <p className="mark__slogan">{copy[lang].slogan}</p>
        <p className="mark__sub">No Collection</p>
      </div>
    </div>
  );
}
