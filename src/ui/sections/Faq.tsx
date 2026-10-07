import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useStore } from '../../store';
import { copy } from '../../data/copy';
import { PlusIcon } from '../icons';

export function Faq() {
  const lang = useStore((s) => s.lang);
  const t = copy[lang];
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="opaque faq" aria-label={t.faq.label}>
      <div className="wrap faq-grid">
        <div>
          <p className="eyebrow accent-text">{t.faq.label}</p>
          <h2 className="h-section">{t.faq.title}</h2>
        </div>
        <div className="accordion">
          {t.faq.items.map(([q, a], i) => {
            const isOpen = open === i;
            return (
              <div key={q} className={`acc-item${isOpen ? ' is-open' : ''}`}>
                <h3>
                  <button aria-expanded={isOpen} aria-controls={`faq-${i}`} id={`faq-h-${i}`} onClick={() => setOpen(isOpen ? null : i)}>
                    <span>{q}</span>
                    <i aria-hidden="true"><PlusIcon /></i>
                  </button>
                </h3>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      id={`faq-${i}`}
                      role="region"
                      aria-labelledby={`faq-h-${i}`}
                      className="acc-panel"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <p>{a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
