import { useEffect, useRef } from 'react';
import { Swap } from '../Swap';
import { useStore } from '../../store';
import { copy } from '../../data/copy';
import { getProduct, products, pyramidNotes } from '../../data/products';
import { progress } from '../../scroll/scroll';
import { anchors } from '../../three/anchors';


/** Etiketlerin sırayla belirdiği ilerleme eşikleri: ÜST · KALP · DİP */
const SHOW_AT = [0.24, 0.36, 0.48];
const HIDE_AT = 0.82;

export function Pyramid() {
  const lang = useStore((s) => s.lang);
  const id = useStore((s) => s.pyramidId);
  const setId = useStore((s) => s.setPyramidId);
  const t = copy[lang];
  const p = getProduct(id);
  const labels = useRef<(HTMLDivElement | null)[]>([]);
  const root = useRef<HTMLDivElement>(null);

  // etiketler 3B katmanların yanında: her karede ekran konumunu izle
  useEffect(() => {
    let raf = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      const el = root.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      if (r.bottom < 0 || r.top > window.innerHeight) return;
      const pr = progress('pyramid');
      const mobile = window.innerWidth < 760;
      const gap = mobile ? 14 : 44;
      const half = anchors.halfPx;
      const spots = [
        { a: anchors.cap, side: 1, off: half * 0.55 },
        { a: anchors.top, side: -1, off: half },
        { a: anchors.bottom, side: 1, off: half },
      ];
      spots.forEach((s, i) => {
        const l = labels.current[i];
        if (!l) return;
        const on = pr >= SHOW_AT[i] && pr < HIDE_AT && anchors.explode > 0.5;
        l.classList.toggle('is-on', on);
        const x = s.a.x + s.side * (s.off + gap);
        l.style.transform = `translate3d(${x}px, ${s.a.y}px, 0) translate(${s.side > 0 ? '0' : '-100%'}, -50%)`;
      });
    };
    loop();
    return () => cancelAnimationFrame(raf);
  }, []);

  const heads = [t.pyramid.top, t.pyramid.heart, t.pyramid.base];

  return (
    <section
      id="pyramid"
      className="pin"
      style={{ height: '480vh', '--tint': p.tint, '--pc': p.color } as React.CSSProperties}
      aria-label={t.pyramid.label}
    >
      <div className="sticky pyramid" ref={root}>
        <div className="py-tabs" role="tablist" aria-label={t.nav.scents}>
          {products.map((x) => (
            <button
              key={x.id}
              role="tab"
              aria-selected={x.id === id}
              className={`tab${x.id === id ? ' is-active' : ''}`}
              onClick={() => setId(x.id)}
            >
              {x.name}
            </button>
          ))}
        </div>
        <div className="py-title">
          <p className="eyebrow accent-text">{t.pyramid.label}</p>
          <Swap k={id} as="h2" className="py-name">{p.name}</Swap>
          <p className="py-hint">{t.pyramid.hint}</p>
        </div>
        <Swap k={`${id}-${lang}`} className="py-meta">
            <p className="eyebrow"><span className="dot accent" aria-hidden="true" /> {p.family[lang]}</p>
            <p className="py-meta-name">{p.name}</p>
          </Swap>
        <div className="py-labels">
          {p.pyramid[lang].map((line, i) => (
            <div key={i} className={`py-label side-${i === 1 ? 'left' : 'right'}`} ref={(el) => { labels.current[i] = el; }}>
              <p className="eyebrow accent-text">{heads[i]}</p>
              <p className="py-notes">{pyramidNotes(line).join(' · ')}</p>
            </div>
          ))}
        </div>
        {/* ekran okuyucular için tam piramit */}
        <dl className="sr-only">
          {p.pyramid[lang].map((line, i) => (
            <div key={i}><dt>{heads[i]}</dt><dd>{pyramidNotes(line).join(', ')}</dd></div>
          ))}
        </dl>
      </div>
    </section>
  );
}
