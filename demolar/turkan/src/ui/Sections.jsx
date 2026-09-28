import { useState } from "react";

import { HIDDEN } from "../data";
import { useT, wordLang } from "../i18n";
import { BrandIcon } from "../Icons";

export function Marquee() {
  const words = useT().ui.marquee;
  const row = [...words, ...words];
  return (
    <div className="marquee" aria-hidden="true">
      <div className="marquee__track">
        {row.map((w, i) => (
          <span key={i} lang={wordLang(w)}>
            {w}
            <i>✦</i>
          </span>
        ))}
      </div>
    </div>
  );
}

export function Story() {
  const { ui, story, stockists, faqs } = useT();
  return (
    <section id="story" className="section story">
      <div className="story__grid">
        <div className="story__main">
          <header className="section__head reveal">
            <p className="mono section__eyebrow">{ui.storyEyebrow}</p>
            <h2 className="section__title" lang={wordLang(ui.slogan)}>{ui.slogan}</h2>
          </header>
          <p className="story__lead reveal">{story.lead}</p>
          {story.paragraphs.map((t) => (
            <p key={t} className="story__text reveal">
              {t}
            </p>
          ))}
          <div className="story__founder reveal">
            <span className="story__avatar" aria-hidden="true">
              <BrandIcon />
            </span>
            <div>
              <p className="story__name">{story.founder}</p>
              <p className="mono">{ui.founder}</p>
            </div>
          </div>
        </div>

        <ol className="timeline reveal" aria-label={ui.milestones}>
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

      {story.press?.length > 0 && (
      <div className="press reveal">
        <p className="mono">{ui.press}</p>
        <ul>
          {story.press.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      </div>
      )}
    </section>
  );
}

export function Stockists() {
  const { ui, story, stockists, faqs } = useT();
  return (
    <section id="stockists" className="section stockists">
      <header className="section__head reveal">
        <p className="mono section__eyebrow">{ui.whereEyebrow}</p>
        <h2 className="section__title">{ui.whereTitle}</h2>
        <p className="tagline tagline--static">{ui.whereTag}</p>
      </header>
      <div className="table-wrap reveal">
        <table className="stock">
          <thead>
            <tr>
              <th scope="col">{ui.place}</th>
              <th scope="col">{ui.spot}</th>
              <th scope="col" className="num">{ui.status}</th>
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
  const { ui, story, stockists, faqs } = useT();
  return (
    <section id="faq" className="section faq">
      <header className="section__head reveal">
        <p className="mono section__eyebrow">{ui.faqEyebrow}</p>
        <h2 className="section__title">{ui.faqTitle}</h2>
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
  const { ui, story, brand } = useT();
  const [sent, setSent] = useState(false);
  const [joined, setJoined] = useState(false);

  return (
    <section id="contact" className="section contact">
      <div className="contact__grid">
        <div className="reveal">
          <p className="mono section__eyebrow">{ui.contact}</p>
          <h2 className="section__title">{ui.contactTitle}</h2>
          <p className="tagline tagline--static">{ui.contactTag}</p>
          {sent ? (
            <p className="contact__done">{ui.thanks}</p>
          ) : (
            <form
              className="contact__form"
              onSubmit={(e) => {
                e.preventDefault();
                setSent(true);
              }}
            >
              <label>
                <span className="mono">{ui.name}</span>
                <input id="c-name" name="name" required autoComplete="name" />
              </label>
              <label>
                <span className="mono">{ui.email}</span>
                <input id="c-email" name="email" type="email" required autoComplete="email" />
              </label>
              <label className="contact__wide">
                <span className="mono">{ui.message}</span>
                <textarea id="c-msg" name="message" rows={3} required />
              </label>
              <button type="submit" className="pill">{ui.send}</button>
            </form>
          )}
        </div>

        <div className="news reveal">
          <p className="mono section__eyebrow">{ui.newsletter}</p>
          <p className="news__title">{ui.newsTitle}</p>
          {joined ? (
            <p className="contact__done">{ui.joined}</p>
          ) : (
            <form
              className="news__form"
              onSubmit={(e) => {
                e.preventDefault();
                setJoined(true);
              }}
            >
              <label htmlFor="n-email" className="sr-only">{ui.emailAddress}</label>
              <input id="n-email" type="email" placeholder={ui.emailPh} required autoComplete="email" />
              <button type="submit" className="pill">{ui.join}</button>
            </form>
          )}
        </div>
      </div>

      <p className="warning">
        {ui.caffeine} {brand.disclaimer}
      </p>

      <div className="social reveal">
        {story.instagram && (
          <a className="social__card" href={story.instagram} target="_blank" rel="noreferrer">
            <span className="mono">Instagram</span>
            <strong>@{story.instagram.replace(/\/$/, "").split("/").pop()}</strong>
            <span className="social__arrow" aria-hidden="true">↗</span>
          </a>
        )}
        {story.website && (
          <a className="social__card" href={story.website} target="_blank" rel="noreferrer">
            <span className="mono">{ui.web}</span>
            <strong>{new URL(story.website).hostname.replace(/^www\./, "")}</strong>
            <span className="social__arrow" aria-hidden="true">↗</span>
          </a>
        )}
      </div>

      <footer className="footer mono">
        <span>{brand.name} · <span lang={wordLang(ui.slogan)}>{ui.slogan}</span></span>
        <nav className="footer__links" aria-label={ui.footerNav}>
          <a href="#shop">{ui.nav.shop}</a>
          <a href="#faq">{ui.nav.faq}</a>
          {!HIDDEN.has("story") && <a href="#story">{ui.nav.story}</a>}
          <a href="#stockists">{ui.nav.stockists}</a>
          <a href="#contact">{ui.nav.contact}</a>
        </nav>
        <span>{ui.madeForShort(brand.name)}</span>
      </footer>
    </section>
  );
}
