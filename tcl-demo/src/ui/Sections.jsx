import { useState } from "react";

import { faqs, stockists, story } from "../data";
import { Cup } from "../Icons";
import { brand } from "../brand";

export function Marquee() {
  const words = ["Good coffee. Good fortune.", "Dünyanın ilk buzlu Türk kahvesi", "Shake well. Drink cold.", "UNESCO kültürel mirası", "Coffee Sayer AI", "Beş şehir, beş tat"];
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

export function Story() {
  return (
    <section id="story" className="section story">
      <div className="story__grid">
        <div className="story__main">
          <header className="section__head reveal">
            <p className="mono section__eyebrow">04 — Hikâye</p>
            <h2 className="section__title">Good coffee. Good fortune.</h2>
          </header>
          <p className="story__lead reveal">{story.lead}</p>
          {story.paragraphs.map((t) => (
            <p key={t} className="story__text reveal">
              {t}
            </p>
          ))}
          <div className="story__founder reveal">
            <span className="story__avatar" aria-hidden="true">
              <Cup />
            </span>
            <div>
              <p className="story__name">{story.founder}</p>
              <p className="mono">Kurucu · Turkish Coffee Lady</p>
            </div>
          </div>
        </div>

        <ol className="timeline reveal" aria-label="Kilometre taşları">
          {story.timeline.map(([year, text]) => (
            <li key={year}>
              <span className="timeline__year">{year}</span>
              <span className="timeline__text">{text}</span>
            </li>
          ))}
        </ol>
      </div>

      <ul className="stats reveal">
        {story.stats.map(([n, label]) => (
          <li key={label}>
            <strong>{n}</strong>
            <span className="mono">{label}</span>
          </li>
        ))}
      </ul>

      <div className="press reveal">
        <p className="mono">Basında</p>
        <ul>
          {story.press.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function Stockists() {
  return (
    <section id="stockists" className="section stockists">
      <header className="section__head reveal">
        <p className="mono section__eyebrow">05 — Nerede</p>
        <h2 className="section__title">Nerede bulunur</h2>
        <p className="tagline tagline--static">Alexandria'dan İstanbul'a, bir fincanlık mesafede.</p>
      </header>
      <div className="table-wrap reveal">
        <table className="stock">
          <thead>
            <tr>
              <th scope="col">Yer</th>
              <th scope="col">Nokta</th>
              <th scope="col" className="num">Durum</th>
            </tr>
          </thead>
          <tbody>
            {stockists.map(([city, areas, n]) => (
              <tr key={city}>
                <th scope="row">{city}</th>
                <td>{areas}</td>
                <td className="num">
                  <span className="status">{n}</span>
                </td>
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
        <p className="mono section__eyebrow">06 — SSS</p>
        <h2 className="section__title">Merak edilenler</h2>
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
          <p className="mono section__eyebrow">İletişim</p>
          <h2 className="section__title">Bize yaz</h2>
          <p className="tagline tagline--static">Kafe, otel ya da market için toptan sipariş.</p>
          {sent ? (
            <p className="contact__done">Teşekkürler. İki iş günü içinde dönüş yapacağız.</p>
          ) : (
            <form
              className="contact__form"
              onSubmit={(e) => {
                e.preventDefault();
                setSent(true);
              }}
            >
              <label>
                <span className="mono">Ad soyad</span>
                <input id="c-name" name="name" required autoComplete="name" />
              </label>
              <label>
                <span className="mono">E-posta</span>
                <input id="c-email" name="email" type="email" required autoComplete="email" />
              </label>
              <label className="contact__wide">
                <span className="mono">Mesaj</span>
                <textarea id="c-msg" name="message" rows={3} required />
              </label>
              <button type="submit" className="pill">Mesajı gönder</button>
            </form>
          )}
        </div>

        <div className="news reveal">
          <p className="mono section__eyebrow">Bülten</p>
          <p className="news__title">Yeni tatlar önce burada duyurulur.</p>
          {joined ? (
            <p className="contact__done">Listeye eklendin.</p>
          ) : (
            <form
              className="news__form"
              onSubmit={(e) => {
                e.preventDefault();
                setJoined(true);
              }}
            >
              <label htmlFor="n-email" className="sr-only">E-posta adresi</label>
              <input id="n-email" type="email" placeholder="sen@ornek.com" required autoComplete="email" />
              <button type="submit" className="pill">Katıl</button>
            </form>
          )}
        </div>
      </div>

      <p className="warning">
        Kafein içerir. {brand.disclaimer}
      </p>

      <div className="social reveal">
        <a className="social__card" href={story.instagram} target="_blank" rel="noreferrer">
          <span className="mono">Instagram</span>
          <strong>@turkishcoffeelady</strong>
          <span className="social__arrow" aria-hidden="true">↗</span>
        </a>
        <a className="social__card" href={story.website} target="_blank" rel="noreferrer">
          <span className="mono">Web</span>
          <strong>turkishcoffeelady.com</strong>
          <span className="social__arrow" aria-hidden="true">↗</span>
        </a>
      </div>

      <footer className="footer mono">
        <span>{brand.name} · Good coffee. Good fortune.</span>
        <nav className="footer__links" aria-label="Alt menü">
          <a href="#shop">Mağaza</a>
          <a href="#faq">SSS</a>
          <a href="#story">Hikâye</a>
          <a href="#stockists">Nerede</a>
          <a href="#contact">İletişim</a>
        </nav>
        <span>{brand.name} için hazırlanmış konsept demo</span>
      </footer>
    </section>
  );
}
