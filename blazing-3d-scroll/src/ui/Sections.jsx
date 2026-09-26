import { useState } from "react";

import { faqs, stockists } from "../data";

export function Marquee() {
  const words = ["Zero sugar", "160 mg caffeine", "Ten flavours", "Vegan", "Recyclable aluminium", "Brewed in the EU"];
  const row = [...words, ...words];
  return (
    <div className="marquee" aria-hidden="true">
      <div className="marquee__track">
        {row.map((w, i) => (
          <span key={i}>
            {w}
            <i>✦</i>
          </span>
        ))}
      </div>
    </div>
  );
}

export function Stockists() {
  return (
    <section id="stockists" className="section stockists">
      <header className="section__head reveal">
        <p className="mono section__eyebrow">04 — Stockists</p>
        <h2 className="section__title">Find a cold one</h2>
        <p className="tagline tagline--static">In fridges across six cities, and counting.</p>
      </header>
      <div className="table-wrap reveal">
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

export function Faq() {
  return (
    <section id="faq" className="section faq">
      <header className="section__head reveal">
        <p className="mono section__eyebrow">05 — FAQ</p>
        <h2 className="section__title">Good questions</h2>
      </header>
      <div className="faq__list reveal">
        {faqs.map(([q, a]) => (
          <details key={q}>
            <summary>
              {q}
              <span aria-hidden="true" />
            </summary>
            <p>{a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

export function Footer() {
  const [sent, setSent] = useState(false);
  const [joined, setJoined] = useState(false);

  return (
    <section id="contact" className="section contact">
      <div className="contact__grid">
        <div className="reveal">
          <p className="mono section__eyebrow">Contact</p>
          <h2 className="section__title">Stock Blazing</h2>
          <p className="tagline tagline--static">Wholesale, events, or just a hello.</p>
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
        </div>

        <div className="news reveal">
          <p className="mono section__eyebrow">Newsletter</p>
          <p className="news__title">New flavours land here first, plus 10% off your first box.</p>
          {joined ? (
            <p className="contact__done">You&apos;re on the list.</p>
          ) : (
            <form
              className="news__form"
              onSubmit={(e) => {
                e.preventDefault();
                setJoined(true);
              }}
            >
              <label htmlFor="n-email" className="sr-only">Email address</label>
              <input id="n-email" type="email" placeholder="you@example.com" required autoComplete="email" />
              <button type="submit" className="pill">Join</button>
            </form>
          )}
        </div>
      </div>

      <p className="warning">
        High caffeine content (72.7 mg/100 ml). Not recommended for children or for women who are pregnant or
        breastfeeding. Enjoy as part of a varied, balanced diet.
      </p>

      <footer className="footer mono">
        <span>© {new Date().getFullYear()} Blazing Energy</span>
        <nav className="footer__links" aria-label="Footer">
          <a href="#shop">Shop</a>
          <a href="#faq">FAQ</a>
          <a href="#stockists">Stockists</a>
          <a href="#contact">Contact</a>
        </nav>
        <span>
          Can model by{" "}
          <a href="https://sketchfab.com/3d-models/energy-drink-game-ready-model-83676feb8b0a4589952cf3676299311b" target="_blank" rel="noreferrer">
            dwalsh
          </a>{" "}
          (CC BY 4.0)
        </span>
      </footer>
    </section>
  );
}
