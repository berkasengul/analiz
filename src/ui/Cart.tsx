import { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useStore, cartUrl } from '../store';
import { copy, formatTRY } from '../data/copy';
import { getProduct } from '../data/products';
import { CloseIcon } from './icons';

/** Sağdan açılan sepet çekmecesi */
export function Cart() {
  const lang = useStore((s) => s.lang);
  const open = useStore((s) => s.cartOpen);
  const setOpen = useStore((s) => s.setCartOpen);
  const cart = useStore((s) => s.cart);
  const setQty = useStore((s) => s.setQty);
  const remove = useStore((s) => s.removeFromCart);
  const openDetail = useStore((s) => s.openDetail);
  const t = copy[lang].cart;
  const panel = useRef<HTMLDivElement>(null);
  const subtotal = cart.reduce((sum, l) => sum + getProduct(l.id).priceTRY * l.qty, 0);

  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
      if (e.key === 'Tab' && panel.current) {
        // odak tuzağı
        const f = panel.current.querySelectorAll<HTMLElement>('button, a[href], input');
        if (!f.length) return;
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    window.addEventListener('keydown', onKey);
    setTimeout(() => panel.current?.querySelector<HTMLElement>('button')?.focus(), 50);
    return () => { window.removeEventListener('keydown', onKey); prev?.focus?.(); };
  }, [open, setOpen]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="cart-wrap" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
          <div className="cart-scrim" onClick={() => setOpen(false)} />
          <motion.div
            ref={panel}
            className="cart"
            role="dialog"
            aria-modal="true"
            aria-label={t.title}
            data-lenis-prevent
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="cart-head">
              <h2>{t.title} <small>({cart.reduce((n, l) => n + l.qty, 0)})</small></h2>
              <button className="icon-btn" onClick={() => setOpen(false)} aria-label={t.close}><CloseIcon /></button>
            </div>
            {cart.length === 0 ? (
              <p className="cart-empty">{t.empty}</p>
            ) : (
              <ul className="cart-lines">
                {cart.map((l) => {
                  const p = getProduct(l.id);
                  return (
                    <li key={l.id} className="cart-line" style={{ '--c': p.color } as React.CSSProperties}>
                      <div className="cart-thumb"><img src={`/products/${p.id}.png`} alt="" width={52} height={70} /></div>
                      <div className="cart-info">
                        <strong><button className="card-link" onClick={() => openDetail(p.id)}>{p.name}</button></strong>
                        <span>{p.family[lang]} · 100 ML</span>
                        <div className="qty qty-sm" role="group" aria-label={`${p.name} adet`}>
                          <button onClick={() => setQty(l.id, l.qty - 1)} aria-label="−" disabled={l.qty <= 1}>−</button>
                          <output>{l.qty}</output>
                          <button onClick={() => setQty(l.id, l.qty + 1)} aria-label="+">+</button>
                        </div>
                      </div>
                      <div className="cart-right">
                        <span>{formatTRY(p.priceTRY * l.qty)}</span>
                        <button className="link-btn" onClick={() => remove(l.id)}>{t.remove}</button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
            <div className="cart-foot">
              <div className="cart-sub"><span>{t.subtotal}</span><strong>{formatTRY(subtotal)}</strong></div>
              <a
                className={`btn btn-accent btn-wide${cart.length ? '' : ' is-disabled'}`}
                href={cart.length ? cartUrl(cart) : undefined}
                aria-disabled={!cart.length}
                target="_blank"
                rel="noopener noreferrer"
              >
                {t.checkout}
              </a>
              <p className="cart-note">{t.note}</p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
