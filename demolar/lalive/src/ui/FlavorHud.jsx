import { flavors } from "../data";
import { useT } from "../i18n";
import { scrollToFlavorOf } from "../scroll";
import { useStore } from "../store";
import { SplitChars } from "./Split";

const N = flavors.length;
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
        <p className="tag">
          <i className="dot" />
          {f.family} · <span lang="en">{f.sub ?? t.brand.sub}</span>
        </p>
        <button className="hud__name" lang="en" onClick={openDetail} aria-label={ui.discover(f.name)}>
          <SplitChars text={f.name} key={f.name} step={40} />
        </button>
        <p className="tagline hud__tagline" key={f.tagline + t.lang}>{f.tagline}</p>
        <button className="hud__cta mono" onClick={openDetail}>
          {ui.discoverCan}
        </button>
      </div>

      <div className="hud__count">
        <p className="count">
          <span className="count__now">{pad(active + 1)}</span>
          <span className="count__line" />
          <span className="count__total">{pad(N)}</span>
        </p>
        <ul className="chips" aria-label={ui.notes} key={f.name + t.lang}>
          {f.notes.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
      </div>

      <div className="track" aria-label={ui.flavors}>
        <p className="track__label mono" lang="en">{f.name}</p>
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
