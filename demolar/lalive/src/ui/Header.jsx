import { Bag, BrandIcon } from "../Icons";
import { useT } from "../i18n";
import { useStore } from "../store";
import { content } from "../data";

export function LangSwitch() {
  const lang = useStore((s) => s.lang);
  const setLang = useStore((s) => s.setLang);
  const { ui } = useT();
  return (
    <div className="lang" role="group" aria-label={ui.langLabel}>
      {[
        ["tr", "TR", "₺"],
        ["en", "EN", "$"],
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
      <nav className="header__nav" aria-label={ui.sections}>
        <a href="#flavors"><sup>01</sup>{ui.nav.flavors}</a>
        <a href="#ritual"><sup>02</sup>{ui.nav.ritual}</a>
        <a href="#shop"><sup>03</sup>{ui.nav.shop}</a>
        {content.catalog ? (
          <a href="#/urunler"><sup>04</sup>{ui.nav.catalog}</a>
        ) : (
          <a href="#story"><sup>04</sup>{ui.nav.story}</a>
        )}
      </nav>
      <div className="header__right">
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
