import { useCallback, useEffect, useState } from "react";
import Lenis from "lenis";

import Scene from "./Scene";
import { flavors, specs } from "./data";
import { measureScroll, scrollState, scrollToElement, scrollToFlavor, smooth } from "./scroll";
import { useStore } from "./store";
import { Arrow, Bolt, Close, Cube, Flame, HexB, Leaf } from "./Icons";

const N = flavors.length;
const pad = (n) => String(n).padStart(2, "0");

function useSmoothScroll() {
  const handleScroll = useCallback(() => {
    measureScroll();
    const idx = Math.round(scrollState.p);
    const { active, setActive } = useStore.getState();
    if (idx !== active) setActive(idx);
  }, []);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    smooth.lenis = reduce ? null : new Lenis({ autoRaf: true, lerp: 0.085 });

    const onClick = (e) => {
      const a = e.target.closest("a[href^='#']");
      if (!a) return;
      const el = document.querySelector(a.getAttribute("href"));
      if (!el) return;
      e.preventDefault();
      useStore.getState().setMenu(false);
      useStore.getState().closeDetail();
      scrollToElement(el);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);
    document.addEventListener("click", onClick);
    handleScroll();

    return () => {
      smooth.lenis?.destroy();
      smooth.lenis = null;
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
      document.removeEventListener("click", onClick);
    };
  }, [handleScroll]);

  // Detay veya menü açıkken sayfa kaymasın.
  const locked = useStore((s) => s.detail || s.menu);
  useEffect(() => {
    if (!smooth.lenis) {
      document.documentElement.style.overflow = locked ? "hidden" : "";
      return;
    }
    locked ? smooth.lenis.stop() : smooth.lenis.start();
  }, [locked]);
}

function useKeys() {
  useEffect(() => {
    const onKey = (e) => {
      const s = useStore.getState();
      if (e.key === "Escape") {
        s.setMenu(false);
        s.closeDetail();
      }
      if (!s.detail) return;
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
}

function step(dir) {
  const next = (useStore.getState().active + dir + N) % N;
  useStore.getState().setActive(next);
  scrollToFlavor(next, true);
}

function Header() {
  const menu = useStore((s) => s.menu);
  const setMenu = useStore((s) => s.setMenu);
  return (
    <header className="header">
      <a href="#flavors" className="brand" aria-label="Blazing Energy, back to top">
        <Flame />
        <span className="brand__name">Blazing</span>
        <span className="brand__sub">Energy</span>
      </a>
      <nav className="header__nav" aria-label="Sections">
        <a href="#flavors"><sup>01</sup>Flavors</a>
        <a href="#ritual"><sup>02</sup>Ritual</a>
        <a href="#stockists"><sup>03</sup>Stockists</a>
      </nav>
      <div className="header__right">
        <a href="#contact" className="header__contact">Contact</a>
        <button
          className="menu-btn"
          aria-expanded={menu}
          aria-controls="menu"
          onClick={() => setMenu(!menu)}
        >
          {menu ? "Close" : "Menu"}
          <span className={`menu-btn__icon${menu ? " is-open" : ""}`} aria-hidden="true" />
        </button>
      </div>
    </header>
  );
}

function Menu() {
  const menu = useStore((s) => s.menu);
  return (
    <div id="menu" className={`menu${menu ? " is-open" : ""}`} aria-hidden={!menu}>
      <nav className="menu__links">
        {[
          ["#flavors", "Flavors"],
          ["#ritual", "Ritual"],
          ["#stockists", "Stockists"],
          ["#contact", "Contact"],
        ].map(([href, label], i) => (
          <a key={href} href={href} tabIndex={menu ? 0 : -1} style={{ "--i": i }}>
            <sup>{pad(i + 1)}</sup>
            {label}
          </a>
        ))}
      </nav>
      <p className="menu__foot">Zero sugar. 160 mg caffeine. Ten flavors.</p>
    </div>
  );
}

function FlavorHud() {
  const active = useStore((s) => s.active);
  const detail = useStore((s) => s.detail);
  const openDetail = useStore((s) => s.openDetail);
  const f = flavors[active];

  return (
    <div className={`hud${detail ? " is-hidden" : ""}`} aria-hidden={detail}>
      <div className="hud__center">
        <p className="tag">
          <i className="dot" />
          {specs}
        </p>
        <button className="hud__name" key={f.name} onClick={openDetail} aria-label={`Open ${f.name}`}>
          {f.name}
        </button>
        <p className="tagline" key={f.tagline}>{f.tagline}</p>
      </div>

      <div className="hud__count">
        <p className="count">
          <span className="count__now">{pad(active + 1)}</span>
          <span className="count__line" />
          <span className="count__total">{pad(N)}</span>
        </p>
        <p className="mono">{f.notes.join(" · ")}</p>
      </div>

      <div className="track" role="tablist" aria-label="Flavors">
        <p className="track__label mono">{f.name}</p>
        <div className="track__ticks">
          {flavors.map((fl, i) => (
            <button
              key={fl.name}
              role="tab"
              aria-selected={i === active}
              aria-label={fl.name}
              className={i === active ? "is-active" : ""}
              onClick={() => scrollToFlavor(i)}
            />
          ))}
        </div>
      </div>

      <p className="hud__scroll mono">Scroll to discover</p>
    </div>
  );
}

const features = [
  { icon: Bolt, label: "160 mg natural caffeine" },
  { icon: Leaf, label: "Plant-based, zero sugar" },
  { icon: Cube, label: "Spin the can", action: "spin" },
  { icon: HexB, label: "B-vitamin complex" },
];

function DetailPanel() {
  const active = useStore((s) => s.active);
  const detail = useStore((s) => s.detail);
  const spin = useStore((s) => s.spin);
  const closeDetail = useStore((s) => s.closeDetail);
  const toggleSpin = useStore((s) => s.toggleSpin);
  const f = flavors[active];
  const tab = detail ? 0 : -1;

  return (
    <div className={`detail${detail ? " is-open" : ""}`} aria-hidden={!detail}>
      <button className="back" onClick={closeDetail} tabIndex={tab}>
        <span className="round"><Close /></span>
        <span className="mono">Back to flavors</span>
      </button>

      <div className="detail__body" key={f.name}>
        <p className="tag">
          <i className="dot" />
          N° {pad(active + 1)} — Zero sugar · 160 mg caffeine
        </p>
        <h2 className="detail__title">
          Blazing
          <br />
          {f.name}
        </h2>
        <p className="detail__desc">{f.description}</p>
        <p className="detail__notes mono">{f.notes.join(" · ")}</p>
      </div>

      <div className="detail__nav">
        <button className="round" onClick={() => step(-1)} tabIndex={tab} aria-label="Previous flavor">
          <Arrow dir="left" />
        </button>
        <span className="mono">
          {pad(active + 1)} / {pad(N)}
        </span>
        <button className="round" onClick={() => step(1)} tabIndex={tab} aria-label="Next flavor">
          <Arrow />
        </button>
      </div>

      <ul className="features">
        {features.map(({ icon: Icon, label, action }) => (
          <li key={label}>
            <button
              className={`round round--lg${action === "spin" && spin ? " is-on" : ""}`}
              onClick={action === "spin" ? toggleSpin : undefined}
              aria-pressed={action === "spin" ? spin : undefined}
              tabIndex={tab}
            >
              <Icon />
              <span className="features__label mono">{label}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

const ritual = [
  ["Chill", "Fridge-cold, 4 °C. The colder the can, the sharper the first sip."],
  ["Crack", "Wait for the hiss. Pour over ice if you like, straight from the can if you don't."],
  ["Ignite", "160 mg of caffeine from green coffee and guarana. It builds for 20 minutes and holds."],
];

const stockists = [
  ["Istanbul", "Kadıköy, Beşiktaş, Karaköy", 128],
  ["Berlin", "Kreuzberg, Neukölln, Mitte", 94],
  ["London", "Shoreditch, Peckham, Soho", 86],
  ["Paris", "Le Marais, Belleville, Pigalle", 77],
  ["Barcelona", "El Born, Gràcia, Poblenou", 52],
  ["Amsterdam", "De Pijp, Jordaan, Noord", 41],
  ["Milan", "Navigli, Isola, Brera", 39],
  ["Lisbon", "Alfama, Bairro Alto, Cais do Sodré", 23],
];

function Ritual() {
  return (
    <section id="ritual" className="section ritual">
      <header className="section__head">
        <p className="mono section__eyebrow">02 — Ritual</p>
        <h2 className="section__title">The Ritual</h2>
        <p className="tagline tagline--static">Three steps. No shortcuts.</p>
      </header>
      <ol className="steps">
        {ritual.map(([title, text], i) => (
          <li key={title}>
            <span className="steps__n mono">{pad(i + 1)}</span>
            <h3>{title}</h3>
            <p>{text}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

function Stockists() {
  return (
    <section id="stockists" className="section stockists">
      <header className="section__head">
        <p className="mono section__eyebrow">03 — Stockists</p>
        <h2 className="section__title">Find a can</h2>
        <p className="tagline tagline--static">In fridges across eight cities, and counting.</p>
      </header>
      <div className="table-wrap">
        <table className="stock">
          <thead>
            <tr>
              <th scope="col">City</th>
              <th scope="col">Neighbourhoods</th>
              <th scope="col" className="num">Stores</th>
            </tr>
          </thead>
          <tbody>
            {stockists.map(([city, areas, n]) => (
              <tr key={city}>
                <th scope="row">{city}</th>
                <td>{areas}</td>
                <td className="num">{n}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Contact() {
  const [sent, setSent] = useState(false);
  return (
    <section id="contact" className="section contact">
      <header className="section__head">
        <p className="mono section__eyebrow">Contact</p>
        <h2 className="section__title">Stock Blazing</h2>
        <p className="tagline tagline--static">Wholesale, events, or just a hello.</p>
      </header>
      {sent ? (
        <p className="contact__done">Thanks. We&apos;ll reply within two working days.</p>
      ) : (
        <form
          className="contact__form"
          onSubmit={(e) => {
            e.preventDefault();
            setSent(true);
          }}
        >
          <label>
            <span className="mono">Name</span>
            <input id="c-name" name="name" required autoComplete="name" />
          </label>
          <label>
            <span className="mono">Email</span>
            <input id="c-email" name="email" type="email" required autoComplete="email" />
          </label>
          <label className="contact__wide">
            <span className="mono">Message</span>
            <textarea id="c-msg" name="message" rows={3} required />
          </label>
          <button type="submit" className="pill">Send message</button>
        </form>
      )}
      <footer className="footer mono">
        <span>© Blazing Energy — concept site</span>
        <span>
          Can model by{" "}
          <a href="https://sketchfab.com/3d-models/energy-drink-game-ready-model-83676feb8b0a4589952cf3676299311b" target="_blank" rel="noreferrer">
            dwalsh
          </a>{" "}
          (CC BY 4.0) · Noise transition from{" "}
          <a href="https://github.com/mohAmineBrs/codrops-noise-transition" target="_blank" rel="noreferrer">
            Codrops
          </a>
        </span>
      </footer>
    </section>
  );
}

export default function App() {
  useSmoothScroll();
  useKeys();
  const detail = useStore((s) => s.detail);

  return (
    <>
      <Header />
      <Menu />
      <main>
        <section id="flavors" className="flavors" style={{ height: `calc(100vh + ${(N - 1) * 60}vh)` }}>
          <div className={`stage${detail ? " is-detail" : ""}`}>
            <Scene />
            <FlavorHud />
            <DetailPanel />
          </div>
        </section>
        <Ritual />
        <Stockists />
        <Contact />
      </main>
    </>
  );
}
