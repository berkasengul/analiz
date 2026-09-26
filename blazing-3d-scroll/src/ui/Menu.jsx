import { useStore } from "../store";

const links = [
  ["#flavors", "Tatlar"],
  ["#ritual", "Ritüel"],
  ["#shop", "Mağaza"],
  ["#stockists", "Satış noktaları"],
  ["#faq", "SSS"],
  ["#contact", "İletişim"],
];

export default function Menu() {
  const menu = useStore((s) => s.menu);
  return (
    <div id="menu" className={`menu${menu ? " is-open" : ""}`} aria-hidden={!menu}>
      <nav className="menu__links">
        {links.map(([href, label], i) => (
          <a key={href} href={href} tabIndex={menu ? 0 : -1} style={{ "--i": i }}>
            <sup>{String(i + 1).padStart(2, "0")}</sup>
            {label}
          </a>
        ))}
      </nav>
      <p className="menu__foot">Sıfır şeker. 160 mg kafein. On tat.</p>
    </div>
  );
}
