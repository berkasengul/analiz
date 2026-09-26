import { Bag, Cup } from "../Icons";
import { brand } from "../brand";
import { useStore } from "../store";

export default function Header() {
  const menu = useStore((s) => s.menu);
  const setMenu = useStore((s) => s.setMenu);
  const count = useStore((s) => s.cart.reduce((n, i) => n + i.qty, 0));
  const setCartOpen = useStore((s) => s.setCartOpen);

  return (
    <header className="header">
      <a href="#flavors" className="brand" aria-label={`${brand.name}, başa dön`}>
        <Cup />
        <span className="brand__name" lang="en">{brand.name}</span>
        <span className="brand__sub" lang="en">{brand.sub}</span>
      </a>
      <nav className="header__nav" aria-label="Bölümler">
        <a href="#flavors"><sup>01</sup>Tatlar</a>
        <a href="#ritual"><sup>02</sup>Ritüel</a>
        <a href="#shop"><sup>03</sup>Mağaza</a>
        <a href="#story"><sup>04</sup>Hikâye</a>
      </nav>
      <div className="header__right">
        <a href="#contact" className="header__contact">İletişim</a>
        <button className="cart-btn" onClick={() => setCartOpen(true)} aria-label={`Sepeti aç, ${count} ürün`}>
          <Bag />
          {count > 0 && <span className="cart-btn__count">{count}</span>}
        </button>
        <button className="menu-btn" aria-expanded={menu} aria-controls="menu" onClick={() => setMenu(!menu)}>
          {menu ? "Kapat" : "Menü"}
          <span className={`menu-btn__icon${menu ? " is-open" : ""}`} aria-hidden="true" />
        </button>
      </div>
    </header>
  );
}
