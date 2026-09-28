import { useT, termLang, wordLang } from "../i18n";
import { useStore } from "../store";
import { HIDDEN, content } from "../data";
import { LangSwitch } from "./Header";

// Katalogu olan markalarda: ürünler, setler, hakkımızda, satış noktaları, SSS, iletişim.
// Markanın kapattığı bölümler (content.hide) menüde görünmez.
const links = (
  content.catalog
    ? [["#/urunler", "products"], ...(content.catalog.categories.some((c) => c.id === "set") ? [["#/urunler/set", "sets"]] : []), ["#story", "about"], ["#stockists", "stockists"], ["#faq", "faq"], ["#contact", "contact"]]
    : ["flavors", "ritual", "shop", "story", "stockists", "faq", "contact"].map((id) => [`#${id}`, id])
).filter(([href]) => !HIDDEN.has(href.slice(1)));

export default function Menu() {
  const menu = useStore((s) => s.menu);
  const lang = useStore((s) => s.lang);
  const { ui } = useT();
  return (
    <div id="menu" className={`menu${menu ? " is-open" : ""}`} aria-hidden={!menu}>
      <nav className="menu__links">
        {links.map(([href, id], i) => (
          <a key={href} href={href} tabIndex={menu ? 0 : -1} style={{ "--i": i }}>
            {ui.nav[id] ?? ui.nav.story}
          </a>
        ))}
      </nav>
      {content.catalog && (
        <nav className="menu__cats" aria-label={ui.nav.categories ?? ui.categories}>
          <p className="mono">{ui.nav.categories ?? ui.categories}</p>
          {content.catalog.categories.map((c, i) => (
            <a key={c.id} href={`#/urunler/${c.id}`} tabIndex={menu ? 0 : -1} style={{ "--c": c.color, "--i": i + links.length }}>
              <i aria-hidden="true" />
              <span lang={termLang(c.name[lang] ?? c.name.tr)}>{c.name[lang] ?? c.name.tr}</span>
            </a>
          ))}
        </nav>
      )}
      <div className="menu__lang">
        <LangSwitch />
      </div>
      <p className="menu__foot" lang={wordLang(ui.slogan)}>{ui.slogan}</p>
    </div>
  );
}
