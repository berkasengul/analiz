import { content, flavors } from "../data";
import { sceneState } from "../shared";
import { useT, termLang } from "../i18n";
import { scrollToFlavorOf } from "../scroll";
import { useStore } from "../store";
import { SplitChars } from "./Split";

const N = flavors.length;

// Sprey buğusu simgesi: başlık ve önünde yayılan noktalar.
export function SprayIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true">
      <rect x="3.5" y="9" width="7" height="11" rx="1.5" />
      <rect x="5" y="5.5" width="4" height="3.5" rx="0.8" />
      <circle cx="14.5" cy="7" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="17.5" cy="5" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="17.5" cy="9" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="20.5" cy="3.5" r="0.8" fill="currentColor" stroke="none" />
      <circle cx="20.5" cy="7" r="0.8" fill="currentColor" stroke="none" />
      <circle cx="20.5" cy="10.5" r="0.8" fill="currentColor" stroke="none" />
    </svg>
  );
}
const pad = (n) => String(n).padStart(2, "0");

export default function FlavorHud() {
  const active = useStore((s) => s.active);
  const detail = useStore((s) => s.detail);
  const loaded = useStore((s) => s.loaded);
  const moving = useStore((s) => s.moving || s.swapping);
  const order = useStore((s) => s.order);
  const openDetail = useStore((s) => s.openDetail);
  const t = useT();
  const { ui } = t;
  const f = t.flavor(active);

  return (
    <div className={`hud${detail ? " is-hidden" : ""}${loaded ? " is-ready" : ""}`} aria-hidden={detail}>
      <div className={`hud__center${moving ? " is-moving" : ""}`}>
        {/* Sayaç başlık bloğunun üstünde (portal temasında gösterilir; diğerlerinde sağ üstteki sayaç). */}
        <p className="count count--inline" aria-hidden="true">
          <span className="count__now">{pad(active + 1)}</span>
          <span className="count__line" />
          <span className="count__total">{pad(N)}</span>
        </p>
        <p className="tag">
          <i className="dot" />
          <span lang={termLang(f.family)}>{f.family}</span>
          {/* Hacmi olmayan üründe alt yazı kategoriyle aynı olabilir: tekrar yazılmaz. */}
          {(f.sub ?? t.brand.sub) && (f.sub ?? t.brand.sub) !== f.family && (
            <>
              {" · "}
              <span lang="en">{f.sub ?? t.brand.sub}</span>
            </>
          )}
        </p>
        <button style={{ "--lw": Math.max(4, ...f.name.split(/\s+/).map((w) => w.length)) }} className={`hud__name${f.name.length > 30 ? " is-longer" : f.name.length > 18 ? " is-long" : ""}`} lang={termLang(f.name) ?? f.nameLang ?? t.nameLang} onClick={openDetail} aria-label={ui.discover(f.name)}>
          <SplitChars text={f.name.replace(/\s*\/\s*/, "\u2009/\u2009")} key={f.name} step={40} />
        </button>
        <p className="tagline hud__tagline" key={f.tagline + t.lang}>{f.tagline}</p>
        <div className="hud__actions">
          <button className="hud__cta mono" onClick={openDetail}>
            {ui.discoverCan}
          </button>
          {/* Parfümü sık (content.spray): kapak kalkar, başlıktan buğu çıkar. Yalnızca şişelerde. */}
          {content.spray && flavors[active]?.photo3d?.profile === "flask" && (
            <button className="hud__spray mono" onClick={() => (sceneState.sprayReq = active)} aria-label={ui.spray} disabled={moving}>
              <SprayIcon />
              <span>{ui.spray}</span>
            </button>
          )}
        </div>
      </div>

      <div className="hud__count">
        <p className="count">
          <span className="count__now">{pad(active + 1)}</span>
          <span className="count__line" />
          <span className="count__total">{pad(N)}</span>
        </p>
        <ul className="chips" aria-label={ui.notes} key={f.name + t.lang}>
          {f.notes.map((n) => (
            <li key={n} data-tip={t.glossary[n]} tabIndex={t.glossary[n] ? 0 : undefined}>
              {n}
            </li>
          ))}
        </ul>
      </div>

      <div className="track" aria-label={ui.flavors}>
        <p className="track__label mono" lang={termLang(f.name) ?? f.nameLang ?? t.nameLang}>{f.name}</p>
        <div className="track__ticks">
          {flavors.map((fl, i) => (
            <button
              key={fl.name}
              aria-label={fl.name}
              aria-current={i === active}
              className={i === active ? "is-active" : ""}
              style={{ "--c": fl.color }}
              onClick={() => scrollToFlavorOf(order, i)}
            />
          ))}
        </div>
      </div>

      <p className="hud__scroll mono">{ui.scroll}</p>
    </div>
  );
}
