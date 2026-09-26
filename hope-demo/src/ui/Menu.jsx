import { useT } from "../i18n";
import { useStore } from "../store";
import { content } from "../data";
import { LangSwitch } from "./Header";

const links = ["flavors", ...(content.catalog ? ["catalog"] : []), "ritual", "shop", "story", "stockists", "faq", "contact"];

export default function Menu() {
  const menu = useStore((s) => s.menu);
  const lang = useStore((s) => s.lang);
  const { ui } = useT();
  return (
    <div id="menu" className={`menu${menu ? " is-open" : ""}`} aria-hidden={!menu}>
      <nav className="menu__links">
        {links.map((id, i) => (
          <a key={id} href={id === "catalog" ? "#/urunler" : `#${id}`} tabIndex={menu ? 0 : -1} style={{ "--i": i }}>
            <sup>{String(i + 1).padStart(2, "0")}</sup>
            {ui.nav[id]}
          </a>
        ))}
      </nav>
      {content.catalog && (
        <nav className="menu__cats" aria-label={ui.nav.categories ?? ui.categories}>
          <p className="mono">{ui.nav.categories ?? ui.categories}</p>
          {content.catalog.categories.map((c, i) => (
            <a key={c.id} href={`#/urunler/${c.id}`} tabIndex={menu ? 0 : -1} style={{ "--c": c.color, "--i": i + links.length }}>
              <i aria-hidden="true" />
              {c.name[lang] ?? c.name.tr}
            </a>
          ))}
        </nav>
      )}
      <div className="menu__lang">
        <LangSwitch />
      </div>
      <p className="menu__foot" lang="en">{ui.slogan}</p>
    </div>
  );
}
