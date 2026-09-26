import { flavors, specs } from "../data";
import { scrollToFlavor } from "../scroll";
import { useStore } from "../store";
import { SplitChars } from "./Split";

const N = flavors.length;
const pad = (n) => String(n).padStart(2, "0");

export default function FlavorHud() {
  const active = useStore((s) => s.active);
  const detail = useStore((s) => s.detail);
  const loaded = useStore((s) => s.loaded);
  const moving = useStore((s) => s.moving);
  const openDetail = useStore((s) => s.openDetail);
  const f = flavors[active];

  return (
    <div className={`hud${detail ? " is-hidden" : ""}${loaded ? " is-ready" : ""}`} aria-hidden={detail}>
      <div className={`hud__center${moving ? " is-moving" : ""}`}>
        <p className="tag">
          <i className="dot" />
          {specs}
        </p>
        <button className="hud__name" onClick={openDetail} aria-label={`${f.name} tadını keşfet`}>
          <SplitChars text={f.name} key={f.name} step={40} />
        </button>
        <p className="tagline hud__tagline" key={f.tagline}>{f.tagline}</p>
        <button className="hud__cta mono" onClick={openDetail}>
          Kutuyu keşfet
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

      <div className="track" aria-label="Tatlar">
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

      <p className="hud__scroll mono">Keşfetmek için kaydır</p>
    </div>
  );
}
