import { useCallback, useEffect, useState } from "react";
import Lenis from "lenis";

import Scene from "./Scene";
import { flavors } from "./data";
import { measureScroll, scrollState } from "./scroll";

function useSmoothScroll(onScroll) {
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const lenis = reduce ? null : new Lenis({ autoRaf: true, lerp: 0.09 });

    // Bağlantılar Lenis üzerinden kaydırılsın.
    const onClick = (e) => {
      const a = e.target.closest("a[href^='#']");
      if (!a) return;
      const el = document.querySelector(a.getAttribute("href"));
      if (!el) return;
      e.preventDefault();
      lenis ? lenis.scrollTo(el) : el.scrollIntoView();
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    document.addEventListener("click", onClick);
    onScroll();

    return () => {
      lenis?.destroy();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      document.removeEventListener("click", onClick);
    };
  }, [onScroll]);
}

function useReveal() {
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => e.isIntersecting && e.target.classList.add("is-in")),
      { threshold: 0.25 }
    );
    document.querySelectorAll(".reveal").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}

function App() {
  const [flavor, setFlavor] = useState(0);

  const handleScroll = useCallback(() => {
    measureScroll();
    // setState aynı değerde yeniden render yapmaz.
    setFlavor(Math.round(scrollState.flavor));
  }, []);

  useSmoothScroll(handleScroll);
  useReveal();

  const accent = flavors[flavor].css;

  return (
    <div className="page" style={{ "--accent": accent }}>
      <Scene />

      <header className="nav">
        <a href="#top" className="nav__logo">BLAZING</a>
        <nav className="nav__links">
          <a href="#guc">Güç</a>
          <a href="#tatlar">Tatlar</a>
          <a href="#icerik">İçerik</a>
        </nav>
        <a href="#al" className="btn btn--small">Sipariş ver</a>
      </header>

      <main>
        <section id="top" className="section hero" data-section>
          <h1 className="hero__title" aria-label="Blazing" lang="en">
            <span>BLAZ</span>
            <span>ING</span>
          </h1>
          <p className="hero__tag">Enerjini ateşle.</p>
          <div className="hero__scroll">
            <span>Kaydır</span>
            <i />
          </div>
        </section>

        <section id="guc" className="section split split--left" data-section>
          <div className="card reveal">
            <p className="eyebrow">01 — Güç</p>
            <h2>Güne alev alarak başla.</h2>
            <p>
              Doğal kafein ve B vitaminleriyle ani düşüş yaşatmayan, saatlerce
              süren temiz bir enerji. Sabah antrenmanı, gece mesaisi ya da final
              haftası — fark etmez.
            </p>
            <ul className="stats">
              <li><strong>160<small>mg</small></strong>Kafein</li>
              <li><strong>0<small>g</small></strong>Şeker</li>
              <li><strong>10<small>kcal</small></strong>Kalori</li>
            </ul>
          </div>
        </section>

        <section
          id="tatlar"
          className="section flavors"
          data-section
          data-flavors
          style={{ height: `${flavors.length * 100}vh` }}
        >
          <div className="flavors__sticky">
            <div className="card card--right">
              <p className="eyebrow">02 — Tatlar</p>
              <div className="flavors__names">
                {flavors.map((f, i) => (
                  <h2
                    key={f.name}
                    lang="en"
                    className={i === flavor ? "is-active" : ""}
                    style={{ color: f.css }}
                  >
                    {f.name}
                  </h2>
                ))}
              </div>
              <p className="flavors__note">{flavors[flavor].note}</p>
              <ol className="flavors__dots">
                {flavors.map((f, i) => (
                  <li
                    key={f.name}
                    className={i === flavor ? "is-active" : ""}
                    style={{ "--c": f.css }}
                  />
                ))}
              </ol>
            </div>
          </div>
        </section>

        <section id="icerik" className="section split split--left" data-section>
          <div className="card reveal">
            <p className="eyebrow">03 — İçerik</p>
            <h2>Sadece ihtiyacın olan.</h2>
            <ul className="ingredients">
              <li><span>Taurin</span><span>1000 mg</span></li>
              <li><span>Yeşil çay kafeini</span><span>160 mg</span></li>
              <li><span>B6 &amp; B12 vitamini</span><span>%100 RDA</span></li>
              <li><span>Elektrolitler</span><span>Na · K · Mg</span></li>
              <li><span>Tatlandırıcı</span><span>Stevia</span></li>
            </ul>
          </div>
        </section>

        <section id="al" className="section cta" data-section>
          <h2 className="cta__title reveal">Hazır mısın?</h2>
          <div className="cta__bottom reveal">
            <a href="#top" className="btn">Blazing&apos;i dene</a>
            <p className="credits">
              Kutu modeli:{" "}
              <a href="https://sketchfab.com/3d-models/energy-drink-game-ready-model-83676feb8b0a4589952cf3676299311b" target="_blank" rel="noreferrer">
                dwalsh / Sketchfab
              </a>{" "}
              (CC BY 4.0) · Doku geçişi:{" "}
              <a href="https://github.com/mohAmineBrs/codrops-noise-transition" target="_blank" rel="noreferrer">
                Codrops
              </a>
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
