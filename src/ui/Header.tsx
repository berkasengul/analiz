import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useStore } from '../store';
import { copy } from '../data/copy';
import { products } from '../data/products';
import { scrollToFlavor, scrollToSection, onScroll } from '../scroll/scroll';
import { BagIcon, ChevronDown, CloseIcon, SearchIcon } from './icons';

function useEscape(open: boolean, close: () => void) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, close]);
}

export function Header() {
  const lang = useStore((s) => s.lang);
  const setLang = useStore((s) => s.setLang);
  const cart = useStore((s) => s.cart);
  const setCartOpen = useStore((s) => s.setCartOpen);
  const openDetail = useStore((s) => s.openDetail);
  const t = copy[lang];
  const [scrolled, setScrolled] = useState(false);
  const [dropdown, setDropdown] = useState(false);
  const [menu, setMenu] = useState(false);
  const [search, setSearch] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);
  const count = cart.reduce((n, l) => n + l.qty, 0);

  useEffect(() => onScroll((y) => setScrolled(y > 8)), []);

  useEffect(() => {
    if (!dropdown) return;
    const close = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setDropdown(false);
    };
    window.addEventListener('pointerdown', close);
    return () => window.removeEventListener('pointerdown', close);
  }, [dropdown]);

  useEscape(dropdown, () => setDropdown(false));
  useEscape(menu, () => setMenu(false));

  const go = (fn: () => void) => () => {
    setDropdown(false);
    setMenu(false);
    fn();
  };

  return (
    <>
      <header className={`header${scrolled ? ' is-scrolled' : ''}`}>
        <a href="#flavors" className="header-logo" onClick={(e) => { e.preventDefault(); scrollToFlavor(0); }} aria-label="UnBe. — No Collection">
          <img src="/brand/logo.png" alt="UnBe." width={100} height={32} />
        </a>
        <nav className="header-nav" aria-label={lang === 'tr' ? 'Ana menü' : 'Main menu'}>
          <div className="dropdown" ref={dropRef}>
            <button
              className="nav-link"
              aria-expanded={dropdown}
              aria-haspopup="true"
              aria-controls="scent-menu"
              onClick={() => setDropdown((v) => !v)}
            >
              {t.nav.scents} <ChevronDown />
            </button>
            <AnimatePresence>
              {dropdown && (
                <motion.ul
                  id="scent-menu"
                  className="dropdown-menu"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.2 }}
                >
                  {products.map((p) => (
                    <li key={p.id}>
                      <button onClick={go(() => openDetail(p.id))} style={{ '--c': p.color } as React.CSSProperties}>
                        <span className="dot" /> {p.name}
                        <small>{p.family[lang]}</small>
                      </button>
                    </li>
                  ))}
                </motion.ul>
              )}
            </AnimatePresence>
          </div>
          <button className="nav-link" onClick={go(() => scrollToSection('finder'))}>{t.nav.finder}</button>
          <button className="nav-link" onClick={go(() => scrollToSection('story'))}>{t.nav.about}</button>
          <button className="nav-link" onClick={go(() => scrollToSection('contact'))}>{t.nav.contact}</button>
        </nav>
        <div className="header-tools">
          <button className="icon-btn" aria-label={t.navAria.search} onClick={() => setSearch(true)}>
            <SearchIcon />
          </button>
          <div className="lang" role="group" aria-label={t.navAria.lang}>
            <button className={lang === 'tr' ? 'is-active' : ''} aria-pressed={lang === 'tr'} onClick={() => setLang('tr')}>TR</button>
            <span aria-hidden="true">|</span>
            <button className={lang === 'en' ? 'is-active' : ''} aria-pressed={lang === 'en'} onClick={() => setLang('en')}>EN</button>
          </div>
          <button className="icon-btn cart-btn" aria-label={`${t.navAria.cart} (${count})`} onClick={() => setCartOpen(true)}>
            <BagIcon />
            {count > 0 && <span className="badge">{count}</span>}
          </button>
          <button className="menu-btn" aria-expanded={menu} aria-controls="site-menu" onClick={() => setMenu(true)}>
            <span>{t.nav.menu}</span>
            <i aria-hidden="true" />
          </button>
        </div>
      </header>

      <AnimatePresence>
        {menu && (
          <motion.div
            id="site-menu"
            className="overlay-menu"
            role="dialog"
            aria-modal="true"
            aria-label={t.nav.menu}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <button className="overlay-close" onClick={() => setMenu(false)} aria-label={t.nav.close} autoFocus>
              <CloseIcon /> <span>{t.nav.close}</span>
            </button>
            <ol>
              {(
                [
                  [t.nav.scents, () => scrollToFlavor(0)],
                  [lang === 'tr' ? 'Ritüel' : 'Ritual', () => scrollToSection('ritual')],
                  [t.pyramid.label, () => scrollToSection('pyramid')],
                  [t.nav.finder, () => scrollToSection('finder')],
                  [lang === 'tr' ? 'Tüm ürünler' : 'All products', () => scrollToSection('all')],
                  [lang === 'tr' ? 'Mağaza' : 'Shop', () => scrollToSection('shop')],
                  [t.nav.about, () => scrollToSection('story')],
                  [lang === 'tr' ? 'SSS' : 'FAQ', () => scrollToSection('faq')],
                  [t.nav.contact, () => scrollToSection('contact')],
                ] as [string, () => void][]
              ).map(([label, fn], i) => (
                <motion.li key={label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * i, duration: 0.4 }}>
                  <button onClick={go(fn)}>
                    <small>{String(i + 1).padStart(2, '0')}</small> {label}
                  </button>
                </motion.li>
              ))}
            </ol>
            <p className="overlay-foot">{t.slogan} · {t.motto}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <Search open={search} onClose={() => setSearch(false)} />
    </>
  );
}

function Search({ open, onClose }: { open: boolean; onClose: () => void }) {
  const lang = useStore((s) => s.lang);
  const openDetail = useStore((s) => s.openDetail);
  const t = copy[lang];
  const [q, setQ] = useState('');
  useEscape(open, onClose);
  useEffect(() => { if (!open) setQ(''); }, [open]);
  const results = useMemo(() => {
    const s = q.trim().toLocaleLowerCase(lang === 'tr' ? 'tr-TR' : 'en-US');
    if (!s) return products.map((p, i) => ({ p, i }));
    return products
      .map((p, i) => ({ p, i }))
      .filter(({ p }) =>
        [p.name, p.family[lang], p.stance[lang], ...p.pyramid[lang]].join(' ').toLocaleLowerCase(lang === 'tr' ? 'tr-TR' : 'en-US').includes(s),
      );
  }, [q, lang]);
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="search"
          role="dialog"
          aria-modal="true"
          aria-label={t.search.title}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <div className="search-box">
            <div className="search-input">
              <SearchIcon />
              <input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={t.search.placeholder}
                aria-label={t.search.placeholder}
              />
              <button className="icon-btn" onClick={onClose} aria-label={t.nav.close}><CloseIcon /></button>
            </div>
            <ul>
              {results.length === 0 && <li className="search-empty">{t.search.empty}</li>}
              {results.map(({ p }) => (
                <li key={p.id}>
                  <button onClick={() => { onClose(); openDetail(p.id); }} style={{ '--c': p.color } as React.CSSProperties}>
                    <span className="dot" />
                    <strong>{p.name}</strong>
                    <span>{p.family[lang]}</span>
                    <em>{p.stance[lang]}</em>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
