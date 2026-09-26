import { flavors, specs } from "../data";
import { scrollToFlavor } from "../scroll";
import { useStore } from "../store";

const N = flavors.length;
const pad = (n) => String(n).padStart(2, "0");

export default function FlavorHud() {
  const active = useStore((s) => s.active);
  const detail = useStore((s) => s.detail);
  const loaded = useStore((s) => s.loaded);
  const openDetail = useStore((s) => s.openDetail);
  const f = flavors[active];

  return (
    <div className={`hud${detail ? " is-hidden" : ""}${loaded ? " is-ready" : ""}`} aria-hidden={detail}>
      <div className="hud__center">
        <p className="tag">
          <i className="dot" />
          {specs}
        </p>
        <button className="hud__name" key={f.name} onClick={openDetail} aria-label={`Discover ${f.name}`}>
          {f.name}
        </button>
        <p className="tagline" key={f.tagline}>{f.tagline}</p>
        <button className="hud__cta mono" onClick={openDetail}>
          Discover the can
        </button>
      </div>

      <div className="hud__count">
        <p className="count">
          <span className="count__now">{pad(active + 1)}</span>
          <span className="count__line" />
          <span className="count__total">{pad(N)}</span>
        </p>
        <p className="mono">{f.notes.join(" · ")}</p>
      </div>

      <div className="track" aria-label="Flavors">
        <p className="track__label mono">{f.name}</p>
        <div className="track__ticks">
          {flavors.map((fl, i) => (
            <button
              key={fl.name}
              aria-label={fl.name}
              aria-current={i === active}
              className={i === active ? "is-active" : ""}
              style={{ "--c": fl.color }}
              onClick={() => scrollToFlavor(i)}
            />
          ))}
        </div>
      </div>

      <p className="hud__scroll mono">Scroll to discover</p>
    </div>
  );
}
