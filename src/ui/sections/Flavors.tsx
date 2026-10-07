import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Swap } from '../Swap';
import { useStore } from '../../store';
import { copy } from '../../data/copy';
import { products, topNotes } from '../../data/products';
import { scrollToFlavor, scrollToSection } from '../../scroll/scroll';
import { playSpraySounds } from '../../audio/sound';
import { ArrowRight, SprayIcon } from '../icons';


/** Buğuyla birlikte 5 nota sırayla süzülerek belirir, 3 sn sonra kaybolur */
const NOTE_SPOTS = [
  { x: -150, y: -40 }, { x: 170, y: -90 }, { x: -210, y: 70 }, { x: 210, y: 40 }, { x: -60, y: -150 },
];

function SprayNotes() {
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
  const setPyramidId = useStore((s) => s.setPyramidId);
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
        <div className="fl-left">
          <div className="fl-counter">
            <Swap k={active} as="span" className="fl-num">
                {String(active + 1).padStart(2, '0')}
              </Swap>
            <i className="fl-rule" aria-hidden="true" />
            <span className="fl-total">{String(products.length).padStart(2, '0')}</span>
          </div>
          <Swap k={`${p.id}-${lang}`} className="fl-text">
              <p className="eyebrow">
                <span className="dot accent" aria-hidden="true" /> {p.family[lang]} · {t.ml}
              </p>
              <h2 className="fl-name">{p.name}</h2>
              <p className="fl-stance">{p.stance[lang]}</p>
            </Swap>
          <div className="fl-actions">
            <button
              className="btn btn-ghost"
              onClick={() => { setPyramidId(p.id); scrollToSection('pyramid'); }}
            >
              {t.flavors.discover} <ArrowRight />
            </button>
            <button className="btn btn-accent-line" onClick={spray}>
              <SprayIcon /> {t.flavors.spray}
            </button>
          </div>
        </div>

        <aside className="fl-notes" aria-label={t.flavors.notes}>
          <p className="eyebrow accent-text">{t.flavors.notes}</p>
          <Swap k={`${p.id}-${lang}`} as="ul">
              {notes.map((n) => <li key={n}>{n}</li>)}
            </Swap>
        </aside>

        <div className="fl-bottom">
          <div className="fl-bars" role="tablist" aria-label={t.nav.scents}>
            {products.map((x, i) => (
              <button
                key={x.id}
                role="tab"
                aria-selected={i === active}
                aria-label={x.name}
                className={i === active ? 'is-active' : ''}
                onClick={() => scrollToFlavor(i)}
              >
                <i style={{ background: i === active ? p.color : undefined }} />
              </button>
            ))}
          </div>
          <p className="fl-scroll">{t.flavors.scroll}</p>
        </div>
        <SprayNotes />
      </div>
    </section>
  );
}
