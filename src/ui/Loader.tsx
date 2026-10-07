import { useEffect, useState } from 'react';
import { useStore } from '../store';
import { preloadAssets } from '../three/assets';

/** Siyah zemin, logo, 160 px ilerleme çizgisi, "No Collection"; hazır olunca 0.8 sn'de söner */
export function Loader() {
  const [p, setP] = useState(0);
  const [gone, setGone] = useState(false);
  const loaded = useStore((s) => s.loaded);
  const ready = useStore((s) => s.sceneReady);
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
    const t = setTimeout(() => setGone(true), 850);
    return () => clearTimeout(t);
  }, [done]);

  if (gone) return null;
  return (
    <div className={`loader${done ? ' is-done' : ''}`} role="progressbar" aria-label="UnBe." aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round((done ? 1 : p * 0.9) * 100)}>
      <img src="/brand/logo.png" alt="UnBe." className="loader-logo" width={138} height={44} />
      <div className="loader-bar"><span style={{ transform: `scaleX(${done ? 1 : p * 0.9})` }} /></div>
      <p className="loader-label">No Collection</p>
    </div>
  );
}
