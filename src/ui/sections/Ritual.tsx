import { useEffect, useRef } from 'react';
import { Swap } from '../Swap';
import { useStore } from '../../store';
import { copy, storyFirst } from '../../data/copy';
import { getProduct, ritualSlogans, type ProductId } from '../../data/products';
import { box, onScroll, progress, scrollToY, viewportH } from '../../scroll/scroll';

export const RITUAL_IDS: ProductId[] = ['no-tears', 'no-drama', 'no-rules'];


export function Ritual() {
  const lang = useStore((s) => s.lang);
  const step = useStore((s) => s.ritualStep);
  const t = copy[lang];
  const id = RITUAL_IDS[step];
  const p = getProduct(id);
  const outline = useRef<HTMLDivElement>(null);

  // dev kontur yazı adımla yatay kayar
  useEffect(
    () =>
      onScroll(() => {
        const f = progress('ritual') * 3;
        const q = f - Math.min(2, Math.floor(f));
        if (outline.current) outline.current.style.transform = `translate3d(${8 - q * 34}%, 0, 0)`;
      }),
    [],
  );

  const goStep = (i: number) => {
    const b = box('ritual');
    scrollToY(b.top + ((b.height - viewportH()) * (i + 0.5)) / 3, 1.2);
  };

  return (
    <section
      id="ritual"
      className="pin"
      style={{ height: '300vh', '--tint': p.tint, '--pc': p.color } as React.CSSProperties}
      aria-label={t.ritual.label}
    >
      <div className="sticky ritual">
        <div className="ri-left">
          <p className="eyebrow accent-text">{t.ritual.label}</p>
          <Swap k={`${id}-${lang}`}>
              <p className="ri-step">{String(step + 1).padStart(2, '0')}</p>
              <h2 className="ri-slogan">{ritualSlogans[id][lang]}</h2>
              <p className="ri-story">{storyFirst[id][lang]}</p>
              <p className="eyebrow ri-now">
                <span className="dot accent" aria-hidden="true" /> {t.ritual.thisStep} <strong>{p.name}</strong>
              </p>
            </Swap>
          <ol className="ri-steps">
            {RITUAL_IDS.map((rid, i) => (
              <li key={rid} className={i === step ? 'is-active' : ''}>
                <button onClick={() => goStep(i)} aria-current={i === step ? 'step' : undefined}>
                  <small>{String(i + 1).padStart(2, '0')}</small>
                  <span>{ritualSlogans[rid][lang]}</span>
                </button>
              </li>
            ))}
          </ol>
        </div>
        <div className="ri-outline-wrap" aria-hidden="true">
          <div className="ri-outline" ref={outline}>
            {p.stance[lang]}
          </div>
        </div>
      </div>
    </section>
  );
}
