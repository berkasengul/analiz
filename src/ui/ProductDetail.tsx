import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useStore } from '../store';
import { copy, dnaEn, formatTRY, storyFirst } from '../data/copy';
import { getProduct, productIndex, products, pyramidLabel, pyramidNotes, ritualSlogans, type ProductId } from '../data/products';
import { getLenis, scrollToFlavor, scrollToSection } from '../scroll/scroll';
import { ArrowRight, CloseIcon } from './icons';

const isProductId = (v: string): v is ProductId => products.some((p) => p.id === v);
const hashId = () => decodeURIComponent(window.location.hash.slice(1));

/** Ürün detayı: `#<id>` ile açılır, tarayıcının geri tuşu paneli kapatır */
function useDetailHistory() {
  const detailId = useStore((s) => s.detailId);
  const openDetail = useStore((s) => s.openDetail);
  const closeDetail = useStore((s) => s.closeDetail);
  const pushed = useRef(false);

  // ilk yüklemede #no-tears gibi bir adres varsa aç
  useEffect(() => {
    const h = hashId();
    if (isProductId(h)) openDetail(h);
    const onPop = () => {
      const id = hashId();
      pushed.current = false;
      if (isProductId(id)) openDetail(id);
      else if (useStore.getState().detailId) closeDetail();
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [openDetail, closeDetail]);

  useEffect(() => {
    const h = hashId();
    const base = window.location.pathname + window.location.search;
    if (detailId) {
      if (h === detailId) return;
      if (isProductId(h)) history.replaceState({ detail: detailId }, '', `#${detailId}`);
      else { history.pushState({ detail: detailId }, '', `#${detailId}`); pushed.current = true; }
    } else if (isProductId(h)) {
      if (pushed.current) { pushed.current = false; history.back(); }
      else history.replaceState(null, '', base);
    }
  }, [detailId]);
}

export function ProductDetail() {
  useDetailHistory();
  const lang = useStore((s) => s.lang);
  const id = useStore((s) => s.detailId);
  const close = useStore((s) => s.closeDetail);
  const open = useStore((s) => s.openDetail);
  const addToCart = useStore((s) => s.addToCart);
  const setCartOpen = useStore((s) => s.setCartOpen);
  const setPyramidId = useStore((s) => s.setPyramidId);
  const t = copy[lang];
  const panel = useRef<HTMLDivElement>(null);
  const [qty, setQty] = useState(1);

  useEffect(() => setQty(1), [id]);

  // arka plan kaymasın; Esc kapatır; ← → ürünler arasında gezer; odak panelde kalır
  const isOpen = !!id;
  useEffect(() => {
    if (!isOpen) return;
    const lenis = getLenis();
    lenis?.stop();
    const prev = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => {
      const cur = useStore.getState().detailId;
      if (!cur) return;
      if (e.key === 'Escape') { e.preventDefault(); close(); return; }
      const tag = (e.target as HTMLElement | null)?.tagName;
      if ((e.key === 'ArrowLeft' || e.key === 'ArrowRight') && tag !== 'INPUT') {
        const i = productIndex(cur);
        const n = products.length;
        open(products[(i + (e.key === 'ArrowRight' ? 1 : n - 1)) % n].id);
        return;
      }
      if (e.key === 'Tab' && panel.current) {
        const f = panel.current.querySelectorAll<HTMLElement>('button:not([disabled]), a[href]');
        if (!f.length) return;
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    window.addEventListener('keydown', onKey);
    const focusT = setTimeout(() => panel.current?.querySelector<HTMLElement>('.pd-close')?.focus(), 60);
    return () => {
      clearTimeout(focusT);
      window.removeEventListener('keydown', onKey);
      if (useStore.getState().sceneReady) getLenis()?.start();
      prev?.focus?.();
    };
  }, [isOpen, close, open]);

  const p = id ? getProduct(id) : null;
  const idx = id ? productIndex(id) : 0;
  const n = products.length;
  const go = (d: number) => open(products[(idx + d + n) % n].id);
  const dna = p ? (lang === 'tr' ? p.dna : dnaEn[p.id]) : [];

  const leaveTo = (fn: () => void) => {
    close();
    // kapanış animasyonu ve geçmiş güncellemesi bitsin, sonra kaydır
    setTimeout(fn, 380);
  };

  return (
    <AnimatePresence>
      {p && (
        <motion.div
          className="pd-wrap"
          style={{ '--c': p.color, '--tint': p.tint, '--dk': p.dark } as React.CSSProperties}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
        >
          <div className="pd-scrim" onClick={close} />
          <motion.div
            ref={panel}
            className="pd"
            role="dialog"
            aria-modal="true"
            aria-labelledby="pd-title"
            data-lenis-prevent
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 30, opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="pd-bar">
              <p className="eyebrow">
                No Collection · {String(idx + 1).padStart(2, '0')} / {String(n).padStart(2, '0')}
              </p>
              <div className="pd-nav">
                <button className="icon-btn" onClick={() => go(-1)} aria-label={t.detail.prev}>
                  <span className="pd-arrow pd-arrow-left" aria-hidden="true"><ArrowRight /></span>
                </button>
                <button className="icon-btn" onClick={() => go(1)} aria-label={t.detail.next}>
                  <ArrowRight />
                </button>
                <button className="icon-btn pd-close" onClick={close} aria-label={t.detail.close}>
                  <CloseIcon />
                </button>
              </div>
            </div>

            <div className="pd-grid" key={`${p.id}-${lang}`}>
              <div className="pd-media swap-in">
                <picture>
                  <source srcSet={`/cards/${p.id}.webp`} type="image/webp" />
                  <img src={`/products/${p.id}.png`} alt={`${p.name} — ${t.detail.edp} 100 ml`} width={800} height={1000} />
                </picture>
              </div>

              <div className="pd-info swap-in" style={{ animationDelay: '0.08s' }}>
                <p className="eyebrow pd-meta">{t.gender[p.gender]} · {t.ml} · {t.detail.edp}</p>
                <h2 className="pd-name" id="pd-title">{p.name}</h2>
                <p className="eyebrow pd-family"><span className="dot accent" aria-hidden="true" /> {p.family[lang]}</p>
                <p className="pd-stance">{p.stance[lang]}</p>

                <blockquote className="pd-quote">“{ritualSlogans[p.id][lang]}”</blockquote>

                <section className="pd-block">
                  <h3 className="eyebrow accent-text">{t.detail.story}</h3>
                  <p className="pd-story">{storyFirst[p.id][lang]}</p>
                </section>

                <section className="pd-block">
                  <h3 className="eyebrow accent-text">{t.detail.dna}</h3>
                  <ol className="pd-dna">
                    {dna.map((d, i) => <li key={d}><small>{String(i + 1).padStart(2, '0')}</small> {d}</li>)}
                  </ol>
                </section>

                <section className="pd-block">
                  <h3 className="eyebrow accent-text">{t.detail.pyramid}</h3>
                  <dl className="pd-pyramid">
                    {p.pyramid[lang].map((line) => (
                      <div key={line}>
                        <dt>{pyramidLabel(line)}</dt>
                        <dd>{pyramidNotes(line).join(' · ')}</dd>
                      </div>
                    ))}
                  </dl>
                </section>

                <div className="pd-buy">
                  <p className="pd-price">{formatTRY(p.priceTRY)}</p>
                  <div className="pd-buy-row">
                    <div className="qty" role="group" aria-label={t.detail.qty}>
                      <button onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="−" disabled={qty <= 1}>−</button>
                      <output aria-live="polite">{qty}</output>
                      <button onClick={() => setQty((q) => Math.min(20, q + 1))} aria-label="+">+</button>
                    </div>
                    <button className="btn btn-accent btn-wide" onClick={() => { addToCart(p.id, qty); close(); setCartOpen(true); }}>
                      {t.detail.add}
                    </button>
                  </div>
                </div>

                <div className="pd-links">
                  <button className="link-btn" onClick={() => leaveTo(() => scrollToFlavor(idx))}>{t.detail.see3d} →</button>
                  <button className="link-btn" onClick={() => leaveTo(() => { setPyramidId(p.id); scrollToSection('pyramid'); })}>{t.detail.open3d} →</button>
                  <a className="link-btn" href={p.url} target="_blank" rel="noopener noreferrer">{t.detail.store} ↗</a>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
