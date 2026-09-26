import { features, flavors, money, packPrice } from "../data";
import { scrollToFlavor } from "../scroll";
import { useStore } from "../store";
import { Arrow, Close, featureIcons } from "../Icons";

const N = flavors.length;
const pad = (n) => String(n).padStart(2, "0");

export function stepFlavor(dir) {
  const next = (useStore.getState().active + dir + N) % N;
  useStore.getState().setActive(next);
  scrollToFlavor(next, true);
}

export function stepFeature(dir) {
  const { feature, setFeature } = useStore.getState();
  if (feature == null) return;
  setFeature((feature + dir + features.length) % features.length);
}

export default function DetailPanel() {
  const active = useStore((s) => s.active);
  const detail = useStore((s) => s.detail);
  const feature = useStore((s) => s.feature);
  const closeDetail = useStore((s) => s.closeDetail);
  const setFeature = useStore((s) => s.setFeature);
  const addToCart = useStore((s) => s.addToCart);
  const f = flavors[active];
  const ft = feature != null ? features[feature] : null;
  const tab = detail ? 0 : -1;

  return (
    <div className={`detail${detail ? " is-open" : ""}`} aria-hidden={!detail} style={{ "--flavor": f.color }}>
      <button className="back" onClick={closeDetail} tabIndex={tab}>
        <span className="round"><Close /></span>
        <span className="mono">Back to flavors</span>
      </button>

      {ft ? (
        <div className="detail__body" key={`f-${feature}`}>
          <p className="strike">
            <span>{ft.kicker}</span>
            <span className="strike__x" aria-hidden="true">×</span>
            <s>{ft.struck}</s>
          </p>
          <h2 className="detail__title">{ft.title}</h2>
          <p className="detail__desc">{ft.text}</p>
          <p className="detail__notes mono">
            {pad(feature + 1)} / {pad(features.length)}
          </p>
        </div>
      ) : (
        <div className="detail__body" key={`c-${f.name}`}>
          <p className="tag">
            <i className="dot" />
            N° {pad(active + 1)} — Zero sugar · 160 mg caffeine
          </p>
          <h2 className="detail__title">
            Blazing
            <br />
            <span className="detail__flavor">{f.name}</span>
          </h2>
          <p className="detail__desc">{f.description}</p>
          <p className="detail__notes mono">{f.notes.join(" · ")}</p>
          <div className="buy">
            <button className="pill" tabIndex={tab} onClick={() => addToCart(active, 12, "once")}>
              Add 12-pack · {money(packPrice(12, "once"))}
            </button>
            <a href="#shop" className="buy__more mono" tabIndex={tab}>
              More pack sizes
            </a>
          </div>
        </div>
      )}

      <div className="detail__nav">
        {ft ? (
          <>
            <button className="round" onClick={() => stepFeature(-1)} tabIndex={tab} aria-label="Previous feature">
              <Arrow dir="left" />
            </button>
            <button className="round" onClick={() => stepFeature(1)} tabIndex={tab} aria-label="Next feature">
              <Arrow />
            </button>
            <button className="detail__reset mono" onClick={() => setFeature(null)} tabIndex={tab}>
              Back to {f.name}
            </button>
          </>
        ) : (
          <>
            <button className="round" onClick={() => stepFlavor(-1)} tabIndex={tab} aria-label="Previous flavor">
              <Arrow dir="left" />
            </button>
            <span className="mono">
              {pad(active + 1)} / {pad(N)}
            </span>
            <button className="round" onClick={() => stepFlavor(1)} tabIndex={tab} aria-label="Next flavor">
              <Arrow />
            </button>
          </>
        )}
      </div>

      <ul className="features" aria-label="What's inside">
        {features.map((item, i) => {
          const Icon = featureIcons[item.icon];
          const on = feature === i;
          return (
            <li key={item.short}>
              <button
                className={`round round--lg${on ? " is-on" : ""}`}
                onClick={() => setFeature(on ? null : i)}
                aria-pressed={on}
                tabIndex={tab}
              >
                <Icon />
                <span className="features__label mono">{item.short}</span>
              </button>
            </li>
          );
        })}
      </ul>

      <p className="drag-hint mono">Drag to turn the can</p>
    </div>
  );
}
