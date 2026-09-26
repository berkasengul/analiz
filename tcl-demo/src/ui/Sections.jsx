import { useState } from "react";

import { faqs, stockists } from "../data";
import { brand } from "../brand";

export function Marquee() {
  const words = ["Şişede Türk kahvesi", "Beş şehir, beş tat", "500 yıllık gelenek", "Dijital fal", "Soğuk iç", "Kırk yıl hatır"];
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
        <p className="mono section__eyebrow">04 — Satış noktaları</p>
        <h2 className="section__title">Nerede bulunur</h2>
        <p className="tagline tagline--static">Örnek liste: satış noktaları bu bölümde gösterilir.</p>
      </header>
      <div className="table-wrap reveal">
        <table className="stock">
          <thead>
            <tr>
              <th scope="col">Şehir</th>
              <th scope="col">Semtler</th>
              <th scope="col" className="num">Mağaza</th>
            </tr>
          </thead>
          <tbody>
            {stockists.map(([city, areas, n]) => (
              <tr key={city}>
                <th scope="row">{city}</th>
                <td>{areas}</td>
                <td className="num">{n || "Yakında"}</td>
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
        <p className="mono section__eyebrow">05 — SSS</p>
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

      <footer className="footer mono">
        <span>{brand.name} · konsept demo</span>
        <nav className="footer__links" aria-label="Alt menü">
          <a href="#shop">Mağaza</a>
          <a href="#faq">SSS</a>
          <a href="#stockists">Satış noktaları</a>
          <a href="#contact">İletişim</a>
        </nav>
        <span>3B şişe koddan üretilmiştir · etiket konsepttir</span>
      </footer>
    </section>
  );
}
