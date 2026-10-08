import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useStore } from '../../store';
import { copy, formatTRY } from '../../data/copy';
import { compareAtTRY, getProduct, products } from '../../data/products';

export function Shop() {
  const lang = useStore((s) => s.lang);
  const id = useStore((s) => s.shopId);
  const setId = useStore((s) => s.setShopId);
  const addToCart = useStore((s) => s.addToCart);
  const setCartOpen = useStore((s) => s.setCartOpen);
  const openDetail = useStore((s) => s.openDetail);
  const t = copy[lang];
  const p = getProduct(id);
  const [qty, setQty] = useState(1);

  return (
    <section id="shop" className="shop" style={{ '--tint': p.tint, '--pc': p.color } as React.CSSProperties} aria-label={t.shop.label}>
      <div className="shop-left">
        <p className="eyebrow accent-text">{t.shop.label}</p>
        <h2 className="shop-title">{t.shop.title[0]}<br />{t.shop.title[1]}</h2>
        <p className="shop-desc">{t.shop.desc}</p>
        <div className="shop-scent">
          <p className="eyebrow">
            {t.shop.scent}:{' '}
            <AnimatePresence mode="wait">
              <motion.strong key={id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
                {p.name}
              </motion.strong>
            </AnimatePresence>
          </p>
          <div className="swatches" role="radiogroup" aria-label={t.shop.scent}>
            {products.map((x) => (
              <button
                key={x.id}
                role="radio"
                aria-checked={x.id === id}
                aria-label={x.name}
                title={x.name}
                className={`swatch${x.id === id ? ' is-active' : ''}`}
                style={{ '--c': x.color } as React.CSSProperties}
                onClick={() => setId(x.id)}
              />
            ))}
          </div>
        </div>
        <p className="shop-price">{formatTRY(p.priceTRY)} <s>{formatTRY(compareAtTRY[p.id])}</s></p>
        <div className="shop-buy">
          <div className="qty" role="group" aria-label={t.shop.qty}>
            <button onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="−">−</button>
            <output aria-live="polite">{qty}</output>
            <button onClick={() => setQty((q) => Math.min(20, q + 1))} aria-label="+">+</button>
          </div>
          <button className="btn btn-accent btn-wide" onClick={() => { addToCart(id, qty); setCartOpen(true); }}>
            {t.shop.add}
          </button>
        </div>
        <button className="link-btn shop-detail" onClick={() => openDetail(id)}>{t.detail.open} — {p.name} →</button>
        <ul className="perks">
          {t.shop.perks.map((x) => <li key={x}><span aria-hidden="true">✓</span> {x}</li>)}
        </ul>
      </div>
      <button className="bottle-hit shop-hit" onClick={() => openDetail(id)} aria-label={`${p.name} — ${t.detail.open}`}>
        <span className="bottle-hit-label">{t.detail.open} +</span>
      </button>
    </section>
  );
}
