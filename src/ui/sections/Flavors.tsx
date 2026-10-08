import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Swap } from '../Swap';
import { useStore } from '../../store';
import { copy } from '../../data/copy';
import { products, topNotes } from '../../data/products';
import { scrollToFlavor } from '../../scroll/scroll';
import { playSpraySounds } from '../../audio/sound';
import { ArrowRight, SprayIcon } from '../icons';


/** Buğuyla birlikte 5 nota sırayla süzülerek belirir, 3 sn sonra kaybolur */
const NOTE_SPOTS = [
  { x: -150, y: -40 }, { x: 170, y: -90 }, { x: -210, y: 70 }, { x: 210, y: 40 }, { x: -60, y: -150 },
];

export function SprayNotes() {
  const spray = useStore((s) => s.spray);
  const lang = useStore((s) => s.lang);
  const [show, setShow] = useState<{ key: number; notes: string[] } | null>(null);
  useEffect(() => {
    if (!spray) return;
    const p = products.find((x) => x.id === spray.id)!;
    const a = setTimeout(() => setShow({ key: spray.t0, notes: topNotes(p, lang) }), 850);
    const b = setTimeout(() => setShow(null), 850 + 600 + 3000);
    return () => { clearTimeout(a); clearTimeout(b); };
  }, [spray, lang]);
  return (
    <div className="spray-notes" aria-live="polite">
      <AnimatePresence>
        {show &&
          show.notes.map((n, i) => (
            <motion.span
              key={`${show.key}-${n}`}
              className="spray-note"
              style={{ left: `calc(50% + ${NOTE_SPOTS[i].x}px)`, top: `calc(46% + ${NOTE_SPOTS[i].y}px)` }}
              initial={{ opacity: 0, y: 24, filter: 'blur(6px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)', transition: { delay: i * 0.15, duration: 0.9 } }}
              exit={{ opacity: 0, y: -18, filter: 'blur(4px)', transition: { duration: 0.6, delay: i * 0.05 } }}
            >
              {n}
            </motion.span>
          ))}
      </AnimatePresence>
    </div>
  );
}

export function Flavors() {
  const lang = useStore((s) => s.lang);
  const active = useStore((s) => s.active);
  const startSpray = useStore((s) => s.startSpray);
  const openDetail = useStore((s) => s.openDetail);
  const t = copy[lang];
  const p = products[active];
  const notes = topNotes(p, lang);

  const spray = () => {
    const s = useStore.getState().spray;
    if (s && performance.now() / 1000 - s.t0 < 3.9) return;
    startSpray(p.id);
    playSpraySounds();
  };

  return (
    <section
      id="flavors"
      className="pin"
      style={{ height: `${products.length * 100}vh`, '--tint': p.tint, '--pc': p.color } as React.CSSProperties}
      aria-label={lang === 'tr' ? 'Kokular' : 'Scents'}
    >
      <div className="sticky flavors">
        {/* ortadaki 3B şişe tıklanabilir: ürün detayı */}
        <button className="bottle-hit fl-hit" onClick={() => openDetail(p.id)} aria-label={`${p.name} — ${t.detail.open}`}>
          <span className="bottle-hit-label">{t.detail.open} +</span>
        </button>

        <div className="hud__center">
          <div className="count--inline" aria-label={`${active + 1} / ${products.length}`}>
            <Swap k={active} as="span" className="count__now">{String(active + 1).padStart(2, '0')}</Swap>
            <i className="count__line" aria-hidden="true" />
            <span className="count__total">{String(products.length).padStart(2, '0')}</span>
          </div>
          <Swap k={`${p.id}-${lang}`} className="hud__text">
            <p className="tag"><span className="dot" aria-hidden="true" /> {p.family[lang]} · {t.ml}</p>
            <h2 className="hud__name">
              <button onClick={() => openDetail(p.id)} aria-label={`${p.name} — ${t.detail.open}`}>{p.name}</button>
            </h2>
            <p className="hud__tagline">{p.stance[lang]}</p>
          </Swap>
          <div className="hud__actions">
            <button className="hud__cta" onClick={() => openDetail(p.id)}>
              {t.flavors.discover} <ArrowRight />
            </button>
            <button className="hud__cta hud__cta--spray" onClick={spray}>
              <SprayIcon /> {t.flavors.spray}
            </button>
          </div>
        </div>

        <aside className="hud__notes" aria-label={t.flavors.notes}>
          <p className="hud__notes-label">{t.flavors.notes}</p>
          <Swap k={`${p.id}-${lang}`} as="ul">
            {notes.map((n) => <li key={n}>{n}</li>)}
          </Swap>
        </aside>

        <div className="track">
          <div className="track__ticks" role="tablist" aria-label={t.nav.scents}>
            {products.map((x, i) => (
              <button
                key={x.id}
                role="tab"
                aria-selected={i === active}
                aria-label={x.name}
                className={i === active ? 'is-active' : ''}
                style={{ '--c': p.color } as React.CSSProperties}
                onClick={() => scrollToFlavor(i)}
              />
            ))}
          </div>
        </div>
        <p className="hud__scroll">{t.flavors.scroll}</p>
        <SprayNotes />
      </div>
    </section>
  );
}
