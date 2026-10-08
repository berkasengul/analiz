import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useStore } from '../store';
import { copy, formatTRY, storyFirst, stories } from '../data/copy';
import {
  compareAtTRY, galleryUrl, GALLERY_SIZE, getProduct, productIndex, products, pyramidLabel, pyramidNotes, topNotes,
  type ProductId,
} from '../data/products';
import { getLenis } from '../scroll/scroll';
import { playSpraySounds } from '../audio/sound';
import { detailDrag } from '../three/anchors';
import { SprayNotes } from './sections/Flavors';
import { ArrowLeft, ArrowRight, BottleIcon, CloseIcon, DropIcon, LeafIcon, PlusIcon, SprayIcon, StarIcon } from './icons';

const isProductId = (v: string): v is ProductId => products.some((p) => p.id === v);
const hashId = () => decodeURIComponent(window.location.hash.slice(1));
const ICONS = { drop: DropIcon, star: StarIcon, leaf: LeafIcon, bottle: BottleIcon };
const pad = (n: number) => String(n).padStart(2, '0');

/** Ürün detayı `#<id>` adresiyle açılır; tarayıcının geri tuşu kapatır */
function useDetailHistory() {
  const detailId = useStore((s) => s.detailId);
  const openDetail = useStore((s) => s.openDetail);
  const closeDetail = useStore((s) => s.closeDetail);
  const pushed = useRef(false);

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

/** Şişeyi sürükleyerek çevirme alanı */
function DragZone() {
  const last = useRef<{ x: number; t: number } | null>(null);
  return (
    <div
      className="detail__drag"
      aria-hidden="true"
      onPointerDown={(e) => {
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
        detailDrag.dragging = true;
        detailDrag.vel = 0;
        last.current = { x: e.clientX, t: performance.now() };
      }}
      onPointerMove={(e) => {
        if (!last.current) return;
        const now = performance.now();
        const dx = e.clientX - last.current.x;
        const d = dx * 0.009;
        detailDrag.ry += d;
        detailDrag.vel = d / Math.max(0.008, (now - last.current.t) / 1000);
        last.current = { x: e.clientX, t: now };
      }}
      onPointerUp={() => { detailDrag.dragging = false; last.current = null; }}
      onPointerCancel={() => { detailDrag.dragging = false; last.current = null; }}
    />
  );
}

function Lightbox({ id, index, onClose, onStep }: { id: ProductId; index: number; onClose: () => void; onStep: (d: number) => void }) {
  const lang = useStore((s) => s.lang);
  const t = copy[lang].detail;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); onClose(); }
      else if (e.key === 'ArrowRight') onStep(1);
      else if (e.key === 'ArrowLeft') onStep(-1);
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [onClose, onStep]);
  return (
    <motion.div className="lightbox" role="dialog" aria-modal="true" aria-label={`${t.photos} ${index + 1} / ${GALLERY_SIZE}`}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <img key={index} src={galleryUrl(id, index + 1)} alt={`${getProduct(id).name} — ${t.photo} ${index + 1}`} className="swap-in" />
      <button className="round lightbox__close" onClick={onClose} aria-label={t.close}><CloseIcon /></button>
      <button className="round lightbox__prev" onClick={() => onStep(-1)} aria-label="←"><ArrowLeft /></button>
      <button className="round lightbox__next" onClick={() => onStep(1)} aria-label="→"><ArrowRight /></button>
      <p className="lightbox__count">{pad(index + 1)} / {pad(GALLERY_SIZE)}</p>
    </motion.div>
  );
}

export function ProductDetail() {
  useDetailHistory();
  const lang = useStore((s) => s.lang);
  const id = useStore((s) => s.detailId);
  const story = useStore((s) => s.detailStory);
  const setStory = useStore((s) => s.setDetailStory);
  const close = useStore((s) => s.closeDetail);
  const open = useStore((s) => s.openDetail);
  const addToCart = useStore((s) => s.addToCart);
  const setCartOpen = useStore((s) => s.setCartOpen);
  const startSpray = useStore((s) => s.startSpray);
  const cart = useStore((s) => s.cart);
  const t = copy[lang];
  const [pyrOpen, setPyrOpen] = useState(false);
  const [photo, setPhoto] = useState<number | null>(null);
  const [last, setLast] = useState<ProductId>('no-tears');
  const isOpen = !!id;

  useEffect(() => { if (id) setLast(id); setPyrOpen(false); setPhoto(null); }, [id]);

  // arka plan kaymasın, sayfa içeriği gizlensin; klavye
  useEffect(() => {
    document.documentElement.classList.toggle('is-detail', isOpen);
    if (!isOpen) return;
    getLenis()?.stop();
    const prev = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => {
      const s = useStore.getState();
      if (!s.detailId || s.cartOpen) return;
      if (e.key === 'Escape') {
        if (document.querySelector('.lightbox')) return;
        e.preventDefault();
        if (s.detailStory != null) s.setDetailStory(null);
        else close();
        return;
      }
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      if (document.querySelector('.lightbox')) return;
      const d = e.key === 'ArrowRight' ? 1 : -1;
      if (s.detailStory != null) s.setDetailStory((s.detailStory + d + 4) % 4);
      else open(products[(productIndex(s.detailId) + d + products.length) % products.length].id);
    };
    window.addEventListener('keydown', onKey);
    const ft = setTimeout(() => document.querySelector<HTMLElement>('.detail .back')?.focus(), 80);
    return () => {
      clearTimeout(ft);
      window.removeEventListener('keydown', onKey);
      document.documentElement.classList.remove('is-detail');
      if (useStore.getState().sceneReady) getLenis()?.start();
      prev?.focus?.();
    };
  }, [isOpen, close, open]);

  const p = getProduct(id ?? last);
  const idx = productIndex(p.id);
  const n = products.length;
  const go = (d: number) => open(products[(idx + d + n) % n].id);
  const inCart = cart.find((l) => l.id === p.id)?.qty ?? 0;
  const st = story != null ? stories[lang][story] : null;

  const spray = () => {
    const s = useStore.getState().spray;
    if (s && performance.now() / 1000 - s.t0 < 3.9) return;
    startSpray(p.id);
    playSpraySounds();
  };

  return (
    <div className={`detail${isOpen ? ' is-open' : ''}`} style={{ '--c': p.color, '--tint': p.tint } as React.CSSProperties}
      role="dialog" aria-modal={isOpen} aria-hidden={!isOpen} aria-labelledby="detail-title">
      <DragZone />

      <button className="back" onClick={close}>
        <span className="round"><CloseIcon /></span>
        <span className="eyebrow">{t.detail.back}</span>
      </button>

      {st == null ? (
        <div className="detail__body" key={`info-${p.id}-${lang}`}>
          <p className="tag"><span className="dot" aria-hidden="true" /> {t.detail.no} {pad(idx + 1)} — {t.detail.edp} · {t.ml}</p>
          <h2 className="detail__title" id="detail-title">{p.name}</h2>
          <p className="detail__stance">{p.stance[lang]}</p>
          <p className="detail__desc">{storyFirst[p.id][lang]}</p>
          <dl className="detail__meta">
            <div><dt>{t.detail.familyLabel}</dt><dd>{p.family[lang]}</dd></div>
            <div><dt>{t.gender[p.gender]}</dt><dd>{t.ml}</dd></div>
          </dl>
          <ul className="chips" aria-label={t.flavors.notes}>
            {topNotes(p, lang).map((x) => <li key={x}>{x}</li>)}
          </ul>
          <div className="detail__comp">
            <button className="detail__comp-toggle" aria-expanded={pyrOpen} onClick={() => setPyrOpen((v) => !v)}>
              {t.detail.pyramid} <span className={pyrOpen ? 'is-open' : ''}><PlusIcon /></span>
            </button>
            <AnimatePresence initial={false}>
              {pyrOpen && (
                <motion.dl className="detail__layers" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                  {p.pyramid[lang].map((line) => (
                    <div key={line}><dt>{pyramidLabel(line)}</dt><dd>{pyramidNotes(line).join(' · ')}</dd></div>
                  ))}
                </motion.dl>
              )}
            </AnimatePresence>
          </div>
          <div className="gallery">
            <p className="eyebrow gallery__label">{t.detail.photos}</p>
            <div className="gallery__row">
              {Array.from({ length: GALLERY_SIZE }, (_, i) => (
                <button key={i} className="gallery__thumb" onClick={() => setPhoto(i)} aria-label={`${t.detail.photo} ${i + 1}`}>
                  <img src={galleryUrl(p.id, i + 1)} alt="" loading="lazy" width={52} height={52} />
                </button>
              ))}
            </div>
          </div>
          <div className="buy">
            <button className="pill" onClick={() => { addToCart(p.id, 1); setCartOpen(true); }}>
              1 {t.detail.pcs} · {formatTRY(p.priceTRY)}
            </button>
            <s className="buy__was">{formatTRY(compareAtTRY[p.id])}</s>
            <button className="hud__cta" onClick={spray}><SprayIcon /> {t.flavors.spray}</button>
            {inCart > 0 && <span className="buy__in">{t.detail.inCart}: {inCart}</span>}
          </div>
        </div>
      ) : (
        <div className="detail__body detail__body--story" key={`story-${story}-${lang}`}>
          <p className="story__kicker">
            <span>{pad((story ?? 0) + 1)}</span>
            <span className="strike"><i aria-hidden="true">✕</i><s>{st.struck}</s></span>
          </p>
          <h2 className="detail__title detail__title--story" id="detail-title">{st.title}</h2>
          <p className="detail__desc">{st.text}</p>
          <p className="story__count">{pad((story ?? 0) + 1)} / 04</p>
        </div>
      )}

      <div className="features">
        <p className="features__hint"><span className="features__pulse" aria-hidden="true" /> <span className="eyebrow">{t.detail.explore} · {t.detail.storiesCount}</span></p>
        <ul>
          {stories[lang].map((s, i) => {
            const Icon = ICONS[s.icon];
            const on = story === i;
            return (
              <li key={s.short} style={{ '--i': i } as React.CSSProperties}>
                <button className={`feat${on ? ' is-on' : ''}`} aria-pressed={on} onClick={() => setStory(on ? null : i)}>
                  <span className="feat__icon"><Icon /></span>
                  <span className="feat__text"><span className="feat__num">{pad(i + 1)}</span><span className="feat__title">{s.short}</span></span>
                  <span className="feat__arrow" aria-hidden="true">{on ? '✕' : '→'}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="detail__nav">
        {st == null ? (
          <>
            <button className="round" onClick={() => go(-1)} aria-label={t.detail.prev}><ArrowLeft /></button>
            <span className="detail__count">{pad(idx + 1)} / {pad(n)}</span>
            <button className="round" onClick={() => go(1)} aria-label={t.detail.next}><ArrowRight /></button>
          </>
        ) : (
          <>
            <button className="round" onClick={() => setStory(((story ?? 0) + 3) % 4)} aria-label="←"><ArrowLeft /></button>
            <button className="round" onClick={() => setStory(((story ?? 0) + 1) % 4)} aria-label="→"><ArrowRight /></button>
            <button className="detail__reset" onClick={() => setStory(null)}>{t.detail.backToScent}</button>
          </>
        )}
      </div>
      <p className="drag-hint eyebrow">{t.detail.drag}</p>
      {isOpen && <SprayNotes />}

      <AnimatePresence>
        {photo != null && (
          <Lightbox id={p.id} index={photo} onClose={() => setPhoto(null)} onStep={(d) => setPhoto((i) => ((i ?? 0) + d + GALLERY_SIZE) % GALLERY_SIZE)} />
        )}
      </AnimatePresence>
    </div>
  );
}
