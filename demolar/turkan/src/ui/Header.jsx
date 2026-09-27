import { useRef, useState } from "react";

import { Bag, BrandIcon } from "../Icons";
import { useT, termLang } from "../i18n";
import { useStore } from "../store";
import { content } from "../data";
import { SearchButton } from "./Search";

// Dil düğmesinde o dilin para birimi simgesi (markanın fiyat ayarından).
const symbol = (p) => (p ? new Intl.NumberFormat(p.locale, { style: "currency", currency: p.currency, currencyDisplay: "narrowSymbol" }).formatToParts(0).find((x) => x.type === "currency")?.value : "");
const CUR = { tr: symbol(content.prices?.tr) || "₺", en: symbol(content.prices?.en) || "$" };

export function LangSwitch() {
  const lang = useStore((s) => s.lang);
  const setLang = useStore((s) => s.setLang);
  const { ui } = useT();
  return (
    <div className="lang" role="group" aria-label={ui.langLabel}>
      {[
        ["tr", "TR", CUR.tr],
        ["en", "EN", CUR.en],
      ].map(([code, label, cur]) => (
        <button
          key={code}
          className={lang === code ? "is-on" : ""}
          aria-pressed={lang === code}
          onClick={() => setLang(code)}
          lang={code}
        >
          {label}
          <small>{cur}</small>
        </button>
      ))}
    </div>
  );
}

const CAT = content.catalog;
const BASE = import.meta.env.BASE_URL;

// Üst menü: ince cam bir bar; üzerine gelinen bağlantının arkasında ışıklı bir
// hap kayar. Katalogu olan markalarda "Ürünler" açılınca kategoriler ürün
// görselleriyle bir vitrin olarak açılır.
function NavBar({ ui }) {
  const nav = useRef(null);
  const [pill, setPill] = useState(null);
  const [open, setOpen] = useState(false);
  const page = useStore((s) => s.page);
  const lang = useStore((s) => s.lang);
  const move = (e) => {
    const a = e.currentTarget.getBoundingClientRect();
    const n = nav.current.getBoundingClientRect();
    setPill({ x: a.left - n.left, w: a.width });
  };
  const hasSets = CAT?.categories.some((c) => c.id === "set");
  const links = CAT
    ? [
        ...(hasSets ? [["#/urunler/set", ui.nav.sets]] : []),
        ["#story", ui.nav.about ?? ui.nav.story],
        ["#contact", ui.nav.contact],
      ]
    : [
        ["#flavors", ui.nav.flavors],
        ["#shop", ui.nav.shop],
        ["#story", ui.nav.story],
        ["#contact", ui.nav.contact],
      ];
  const count = (id) => CAT.items.filter((i) => i.category === id).length;
  const thumb = (id) => CAT.items.find((i) => i.category === id && i.image)?.image;
  return (
    <nav
      ref={nav}
      className={`header__nav${pill ? " has-pill" : ""}`}
      aria-label={ui.sections}
      style={pill ? { "--px": `${pill.x}px`, "--pw": `${pill.w}px` } : undefined}
      onMouseLeave={() => {
        setPill(null);
        setOpen(false);
      }}
    >
      <span className="header__pill" aria-hidden="true" />
      {CAT && (
        <div className={`navcat${open ? " is-open" : ""}`} onMouseEnter={() => setOpen(true)} onFocus={() => setOpen(true)} onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && setOpen(false)}>
          <a href="#/urunler" className={page === "catalog" ? "is-current" : ""} onMouseEnter={move} onFocus={move} aria-haspopup="true" aria-expanded={open}>
            {ui.nav.products ?? ui.nav.catalog}
            <svg className="navcat__chev" viewBox="0 0 12 12" aria-hidden="true">
              <path d="M3 4.5 6 7.5 9 4.5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          </a>
          <div className="navcat__panel">
            <a href="#/urunler" className="navcat__all" onClick={() => setOpen(false)}>
              <span>{ui.nav.catalog}</span>
              <small>{CAT.items.length}</small>
            </a>
            <ul>
              {CAT.categories.map((c, i) => (
                <li key={c.id} style={{ "--c": c.color, "--i": i }}>
                  <a href={`#/urunler/${c.id}`} onClick={() => setOpen(false)}>
                    <span className="navcat__img" aria-hidden="true">
                      {thumb(c.id) && <img src={BASE + thumb(c.id)} alt="" loading="lazy" />}
                    </span>
                    <span className="navcat__name" lang={termLang(c.name[lang] ?? c.name.tr)}>{c.name[lang] ?? c.name.tr}</span>
                    <small>{count(c.id)}</small>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
      {links.map(([href, label]) => (
        <a key={href} href={href} className={href === "#/urunler/set" && page === "catalog" && location.hash.startsWith("#/urunler/set") ? "is-current" : ""} onMouseEnter={move} onFocus={move}>
          {label}
        </a>
      ))}
    </nav>
  );
}

export default function Header() {
  const menu = useStore((s) => s.menu);
  const setMenu = useStore((s) => s.setMenu);
  const count = useStore((s) => s.cart.reduce((n, i) => n + i.qty, 0));
  const setCartOpen = useStore((s) => s.setCartOpen);
  const { ui, brand } = useT();

  return (
    <header className="header">
      <a href="#flavors" className="brand" aria-label={`${brand.name}, ${ui.backToTop}`}>
        {content.logo ? (
          <img className="brand__logo" src={`${import.meta.env.BASE_URL}${content.logo}`} alt={brand.name} />
        ) : (
          <>
            <BrandIcon />
            <span className="brand__name" lang="en">{brand.name}</span>
            <span className="brand__sub" lang="en">{brand.sub}</span>
          </>
        )}
      </a>
      <NavBar ui={ui} />
      <div className="header__right">
        <SearchButton />
        <LangSwitch />
        <button className="cart-btn" onClick={() => setCartOpen(true)} aria-label={ui.openCart(count)}>
          <Bag />
          {count > 0 && <span className="cart-btn__count">{count}</span>}
        </button>
        <button className="menu-btn" aria-expanded={menu} aria-controls="menu" onClick={() => setMenu(!menu)}>
          {menu ? ui.close : ui.menu}
          <span className={`menu-btn__icon${menu ? " is-open" : ""}`} aria-hidden="true" />
        </button>
      </div>
    </header>
  );
}
