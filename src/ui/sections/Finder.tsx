import { useEffect, useRef, useState } from 'react';
import { useStore } from '../../store';
import { copy } from '../../data/copy';
import { getProduct, type ProductId } from '../../data/products';
import { rank } from '../../data/finder';
import { finderAnchor } from '../../three/anchors';
import { ArrowRight } from '../icons';

const LETTERS = ['A', 'B', 'C', 'D'];

export function Finder() {
  const lang = useStore((s) => s.lang);
  const result = useStore((s) => s.finderResult);
  const setResult = useStore((s) => s.setFinderResult);
  const addToCart = useStore((s) => s.addToCart);
  const setCartOpen = useStore((s) => s.setCartOpen);
  const openDetail = useStore((s) => s.openDetail);
  const t = copy[lang].finder;
  const [answers, setAnswers] = useState<number[]>([]);
  const [alts, setAlts] = useState<ProductId[]>([]);
  const land = useRef<HTMLParagraphElement>(null);
  const q = Math.min(answers.length, 2);
  const done = answers.length >= 3 && !!result;

  const choose = (i: number) => {
    const next = [...answers.slice(0, q), i];
    setAnswers(next);
    if (next.length === 3) {
      const r = rank(next);
      setAlts(r.slice(1, 3));
      setResult(r[0]);
    }
  };
  const back = () => {
    if (done) setResult(null);
    setAnswers((a) => a.slice(0, Math.max(0, (done ? 3 : a.length) - 1)));
  };
  const restart = () => { setAnswers([]); setAlts([]); setResult(null); };

  // "KOKUN BURAYA İNECEK" yazısı kaidenin üstünde
  useEffect(() => {
    let raf = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      const el = land.current;
      if (!el) return;
      const sec = el.parentElement!.getBoundingClientRect();
      if (sec.bottom < 0 || sec.top > window.innerHeight) return;
      el.style.transform = `translate3d(${finderAnchor.x}px, ${finderAnchor.y - sec.top}px, 0) translate(-50%, -260%)`;
    };
    loop();
    return () => cancelAnimationFrame(raf);
  }, []);

  const rp = result ? getProduct(result) : null;
  const progressPct = done ? 100 : (answers.length / 3) * 100;

  return (
    <section
      id="finder"
      className="finder"
      style={rp ? ({ '--tint': rp.tint, '--pc': rp.color } as React.CSSProperties) : undefined}
      aria-label={t.label}
    >
      <div className="card fi-card">
        <p className="eyebrow accent-text">{t.label}</p>
        <h2 className="fi-title">{t.title}</h2>
        <p className="fi-desc">{t.desc}</p>
        {!done ? (
            <div key={`q${q}-${lang}`} className="swap-in">
              <p className="fi-qnum">{String(q + 1).padStart(2, '0')} / 03</p>
              <h3 className="fi-q" id={`fi-q-${q}`}>{t.questions[q].q}</h3>
              <div className="fi-options" role="radiogroup" aria-labelledby={`fi-q-${q}`}>
                {t.questions[q].a.map((a, i) => (
                  <button key={a} role="radio" aria-checked={answers[q] === i} className={`fi-opt${answers[q] === i ? ' is-picked' : ''}`} onClick={() => choose(i)}>
                    <span>{LETTERS[i]}</span> {a}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            rp && (
              <div key={`r-${result}-${lang}`} className="fi-result swap-in" style={{ animationDelay: '0.4s' }} aria-live="polite">
                <p className="eyebrow">{t.result}</p>
                <h3 className="fi-rname">{rp.name}</h3>
                <p className="fi-rstance">{rp.family[lang]} · {rp.stance[lang]}</p>
                <div className="fi-actions">
                  <button className="btn btn-ghost" onClick={() => openDetail(rp.id)}>{t.discover} <ArrowRight /></button>
                  <button className="btn btn-accent" onClick={() => { addToCart(rp.id); setCartOpen(true); }}>{t.add}</button>
                </div>
                <p className="eyebrow fi-alts-title">{t.alsoTry}</p>
                <div className="fi-alts">
                  {alts.map((a) => {
                    const ap = getProduct(a);
                    return (
                      <button key={a} className="fi-alt" style={{ '--c': ap.color } as React.CSSProperties} onClick={() => { setAlts([result!, ...alts.filter((x) => x !== a)].slice(0, 2)); setResult(a); }}>
                        <span className="dot" /> {ap.name} <small>{ap.family[lang]}</small>
                      </button>
                    );
                  })}
                </div>
              </div>
            )
          )}
        <div className="fi-progress" aria-hidden="true"><i style={{ width: `${progressPct}%` }} /></div>
        <div className="fi-nav">
          <button className="link-btn" onClick={back} disabled={answers.length === 0}>← {t.back}</button>
          <button className="link-btn" onClick={restart} disabled={answers.length === 0}>{t.restart}</button>
        </div>
      </div>
      <p className={`fi-land${result ? ' is-hidden' : ''}`} ref={land} aria-hidden={!!result}>{t.land}</p>
    </section>
  );
}
