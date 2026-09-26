import { useT } from "../i18n";
import { useStore } from "../store";
import { LangSwitch } from "./Header";

const links = ["flavors", "ritual", "shop", "story", "stockists", "faq", "contact"];

export default function Menu() {
  const menu = useStore((s) => s.menu);
  const { ui } = useT();
  return (
    <div id="menu" className={`menu${menu ? " is-open" : ""}`} aria-hidden={!menu}>
      <nav className="menu__links">
        {links.map((id, i) => (
          <a key={id} href={id === "flavors" ? "#flavors" : `#${id}`} tabIndex={menu ? 0 : -1} style={{ "--i": i }}>
            <sup>{String(i + 1).padStart(2, "0")}</sup>
            {ui.nav[id]}
          </a>
        ))}
      </nav>
      <div className="menu__lang">
        <LangSwitch />
      </div>
      <p className="menu__foot">Good coffee. Good fortune.</p>
    </div>
  );
}
