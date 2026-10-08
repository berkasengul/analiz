import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useStore } from '../../store';
import { copy, formatTRY } from '../../data/copy';
import { products, topNotes } from '../../data/products';
import { PlusIcon } from '../icons';

type Filter = 'all' | 'kadın' | 'erkek';

export function AllProducts() {
  const lang = useStore((s) => s.lang);
  const addToCart = useStore((s) => s.addToCart);
  const setCartOpen = useStore((s) => s.setCartOpen);
  const openDetail = useStore((s) => s.openDetail);
  const t = copy[lang];
  const [filter, setFilter] = useState<Filter>('all');
  const list = products.filter((p) => filter === 'all' || p.gender === filter);

  return (
    <section id="all" className="opaque all" aria-label={t.all.label}>
      <div className="wrap">
        <div className="all-head">
          <div>
            <p className="eyebrow accent-text">{t.all.label}</p>
            <h2 className="h-section">{t.all.title}</h2>
            <p className="muted">{t.all.desc}</p>
          </div>
          <div className="filters" role="tablist" aria-label={lang === 'tr' ? 'Filtre' : 'Filter'}>
            {(['all', 'kadın', 'erkek'] as Filter[]).map((f) => (
              <button key={f} role="tab" aria-selected={filter === f} className={`tab${filter === f ? ' is-active' : ''}`} onClick={() => setFilter(f)}>
                {t.all.filters[f]}
              </button>
            ))}
          </div>
        </div>
        <motion.ul className="grid" layout>
          <AnimatePresence initial={false}>
            {list.map((p) => (
              <motion.li
                key={p.id}
                layout
                className="card-p"
                style={{ '--c': p.color, '--tint': p.tint } as React.CSSProperties}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.4 }}
              >
                <button className="card-media" onClick={() => openDetail(p.id)} aria-label={`${p.name} — ${t.detail.open}`}>
                  <picture>
                    <source srcSet={`/cards/${p.id}.webp`} type="image/webp" />
                    <img src={`/products/${p.id}.png`} alt="" loading="lazy" width={800} height={1000} />
                  </picture>
                </button>
                <div className="card-body">
                  <p className="eyebrow">{t.gender[p.gender]} · {t.ml}</p>
                  <h3 className="card-name"><button className="card-link" onClick={() => openDetail(p.id)}>{p.name}</button></h3>
                  <p className="card-stance">{p.stance[lang]}</p>
                  <p className="card-notes">{topNotes(p, lang, 4).join(' · ')}</p>
                  <div className="card-foot">
                    <span className="price">{formatTRY(p.priceTRY)}</span>
                    <button className="plus" aria-label={`${p.name} — ${t.all.add}`} onClick={() => { addToCart(p.id); setCartOpen(true); }}>
                      <PlusIcon />
                    </button>
                  </div>
                </div>
              </motion.li>
            ))}
          </AnimatePresence>
        </motion.ul>
      </div>
    </section>
  );
}
