import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useStore } from '../store';
import { copy } from '../data/copy';
import { products } from '../data/products';
import { scrollToFlavor, scrollToSection, onScroll, getLenis } from '../scroll/scroll';
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
  const closeDetail = useStore((s) => s.closeDetail);
  const setAllFilter = useStore((s) => s.setAllFilter);
  const menu = useStore((s) => s.menuOpen);
  const setMenu = useStore((s) => s.setMenuOpen);
  const t = copy[lang];
  const [scrolled, setScrolled] = useState(false);
  const [dropdown, setDropdown] = useState(false);
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

  /** detay ya da menü açıksa kapat, sonra git */
  const go = (fn: () => void) => () => {
    setDropdown(false);
    setMenu(false);
    if (useStore.getState().detailId) { closeDetail(); setTimeout(fn, 420); }
    else fn();
  };
  const category = (f: 'all' | 'kadın' | 'erkek') => go(() => { setAllFilter(f); scrollToSection('all'); });
  const counts = { all: products.length, 'kadın': products.filter((p) => p.gender === 'kadın').length, erkek: products.filter((p) => p.gender === 'erkek').length };

  return (
    <>
      <header className={`header${scrolled ? ' is-scrolled' : ''}`}>
        <a href="#flavors" className="header-logo" onClick={(e) => { e.preventDefault(); go(() => scrollToFlavor(0))(); }} aria-label="UnBe. — No Collection">
          <img src="/brand/logo.png" alt="UnBe." width={100} height={32} />
        </a>
        <nav className="header-nav" aria-label={lang === 'tr' ? 'Ana menü' : 'Main menu'}>
          <div className="dropdown" ref={dropRef}>
            <button className="nav-link" aria-expanded={dropdown} aria-haspopup="true" aria-controls="scent-menu" onClick={() => setDropdown((v) => !v)}>
              {t.nav.scents} <ChevronDown />
            </button>
            <AnimatePresence>
              {dropdown && (
                <motion.div
                  id="scent-menu"
                  className="dropdown-menu"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.2 }}
                >
                  <ul className="navcat">
                    {(['all', 'kadın', 'erkek'] as const).map((f) => (
                      <li key={f}>
                        <button onClick={category(f)}>
                          <span>{f === 'all' ? t.nav.all : f === 'kadın' ? t.nav.women : t.nav.men}</span>
                          <small>{counts[f]}</small>
                        </button>
                      </li>
                    ))}
                  </ul>
                  <ul className="navprod">
                    {products.map((p) => (
                      <li key={p.id}>
                        <button onClick={go(() => openDetail(p.id))} style={{ '--c': p.color } as React.CSSProperties}>
                          <img src={`/products/${p.id}.png`} alt="" width={22} height={30} loading="lazy" />
                          <span>{p.name}</span>
                          <small>{p.family[lang]}</small>
                        </button>
                      </li>
                    ))}
                  </ul>
                </motion.div>
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
            <button className={lang === 'en' ? 'is-active' : ''} aria-pressed={lang === 'en'} onClick={() => setLang('en')}>EN</button>
          </div>
          <button className="icon-btn cart-btn" aria-label={`${t.navAria.cart} (${count})`} onClick={() => setCartOpen(true)}>
            <BagIcon />
            {count > 0 && <span className="badge">{count}</span>}
          </button>
          <button className="menu-btn" aria-expanded={menu} aria-controls="site-menu" onClick={() => setMenu(!menu)}>
            <span>{menu ? t.nav.close : t.nav.menu}</span>
            <i aria-hidden="true" className={menu ? 'is-open' : ''} />
          </button>
        </div>
      </header>

      <Menu go={go} category={category} />
      <Search open={search} onClose={() => setSearch(false)} />
    </>
  );
}

/** Tam ekran menü: büyük bağlantılar, koleksiyonlar; arkada 3B sahne görünür */
function Menu({ go, category }: { go: (fn: () => void) => () => void; category: (f: 'all' | 'kadın' | 'erkek') => () => void }) {
  const lang = useStore((s) => s.lang);
  const setLang = useStore((s) => s.setLang);
  const open = useStore((s) => s.menuOpen);
  const setOpen = useStore((s) => s.setMenuOpen);
  const t = copy[lang];
  useEscape(open, () => setOpen(false));
  useEffect(() => {
    const l = getLenis();
    if (!l) return;
    if (open) l.stop();
    else if (useStore.getState().sceneReady && !useStore.getState().detailId) l.start();
  }, [open]);
  const links: [string, () => void][] = [
    [t.nav.scents, () => scrollToFlavor(0)],
    [t.nav.finder, () => scrollToSection('finder')],
    [t.nav.about, () => scrollToSection('story')],
    [t.nav.faq, () => scrollToSection('faq')],
    [t.nav.contact, () => scrollToSection('contact')],
  ];
  return (
    <div id="site-menu" className={`menu${open ? ' is-open' : ''}`} role="dialog" aria-modal={open} aria-hidden={!open} aria-label={t.nav.menu}>
      <nav className="menu__links">
        {links.map(([label, fn], i) => (
          <button key={label} onClick={go(fn)} style={{ '--i': i } as React.CSSProperties} tabIndex={open ? 0 : -1}>
            <sup>{String(i + 1).padStart(2, '0')}</sup>{label}
          </button>
        ))}
      </nav>
      <div className="menu__cats">
        <p className="eyebrow">{t.nav.collections}</p>
        <button onClick={category('kadın')} tabIndex={open ? 0 : -1}>{t.nav.women}</button>
        <button onClick={category('erkek')} tabIndex={open ? 0 : -1}>{t.nav.men}</button>
      </div>
      <div className="menu__lang lang">
        <button className={lang === 'tr' ? 'is-active' : ''} onClick={() => setLang('tr')} tabIndex={open ? 0 : -1}>TR</button>
        <button className={lang === 'en' ? 'is-active' : ''} onClick={() => setLang('en')} tabIndex={open ? 0 : -1}>EN</button>
      </div>
      <p className="menu__foot">{t.slogan}</p>
    </div>
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
