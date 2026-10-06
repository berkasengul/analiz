import { useEffect, useRef, useState } from "react";
import Lenis from "lenis";

import Backdrop from "./Backdrop";
import Stage from "./Stage";
import GALLERY from "./gallery.json";
import { HOME, PRODUCTS, setCurrent, spin, state, useCurrent } from "./state";

const BASE = import.meta.env.BASE_URL;
const STORE = "https://www.reinventedparfums.com";
const cartUrl = (p) => `${STORE}/cart/${p.variant}:1`;
const money = (v) => `$${Math.round(v)}`;

const FAQ = [
  ["Kokular kimler için?", "Hepsi cinsiyetsiz (unisex) extrait de parfum, 75 ml."],
  ["Kokuları nasıl deneyebilirim?", "Her kokunun numunesi (5 $) ve hepsini bir arada sunan keşif seti (55 $) var."],
  ["Siparişim ne zaman kargoya verilir?", "Varış ülkesine göre 1–3 iş günü içinde hazırlanıp gönderilir."],
  ["Ödeme güvenli mi?", "Ödemeler Stripe ile alınır; kart bilgileri markanın sunucularından geçmez."],
  ["İade edebilir miyim?", "Ürün açılmamış, kullanılmamış ve orijinal ambalajındaysa iade kabul edilir; kargo ücreti iade edilmez."],
];

// Dev başlıklar harf harf karışık işaretlerden çözülerek belirir (videodaki "tokenizing hydration" gibi).
const GLYPHS = "abcdefghijklmnopqrstuvwxyz0123456789#%&*+=/<>";
function Scramble({ text, as: Tag = "span", className, delay = 0, trigger = "load" }) {
  const ref = useRef();
  useEffect(() => {
    const el = ref.current;
    let raf;
    let start = null;
    const run = () => {
      const step = (now) => {
        if (start == null) start = now + delay;
        const k = Math.max(0, (now - start) / 1100);
        let out = "";
        for (let i = 0; i < text.length; i++) {
          const ch = text[i];
          const at = i / text.length;
          if (ch === " " || k > at * 0.75 + 0.25) out += ch;
          else if (k > at * 0.75) out += GLYPHS[(Math.random() * GLYPHS.length) | 0];
          else out += " ";
        }
        el.textContent = out;
        if (k < 1) raf = requestAnimationFrame(step);
        else el.textContent = text;
      };
      raf = requestAnimationFrame(step);
    };
    if (trigger === "load") run();
    else {
      el.textContent = " ";
      const io = new IntersectionObserver(
        ([e]) => {
          if (e.isIntersecting) {
            io.disconnect();
            run();
          }
        },
        { threshold: 0.3 }
      );
      io.observe(el);
      return () => (io.disconnect(), cancelAnimationFrame(raf));
    }
    return () => cancelAnimationFrame(raf);
  }, [text, delay, trigger]);
  return <Tag ref={ref} className={className} aria-label={text} />;
}

function layers(p) {
  return (p.composition?.tr ?? []).map((l) => {
    const [k, v] = l.split(/:\s*/);
    return { k, v: v.split(/\s*,\s*/) };
  });
}

function Header({ p }) {
  return (
    <header className="nav">
      <a className="nav__logo" href="#top" aria-label="Reinvented Parfums">
        <img src={`${BASE}assets/logo.png`} alt="Reinvented Parfums" />
      </a>
      <nav className="nav__links">
        <a href="#urun">Koku</a>
        <a href="#notalar">Notalar</a>
        <a href="#hikaye">Hikâye</a>
        <a href="#koleksiyon">Koleksiyon</a>
        <a href="#sss">SSS</a>
      </nav>
      <a className="pill" href={p.url} target="_blank" rel="noreferrer">
        Mağaza
      </a>
    </header>
  );
}

// Açılış vitrini: bölüm uzun, içi ekrana sabit. Kaydırdıkça öne çıkan dört koku sırayla gelir (şişe yan
// dönerek değişir); solda kokunun adı, ailesi ve notaları, altta ilerleme. Sonuncusundan sonra sayfa
// aşağı akar ve şişe ürün kartına iner.
function Hero({ cur }) {
  const k = Math.max(0, HOME.indexOf(cur));
  const p = PRODUCTS[HOME[k]];
  const go = (i) => {
    const el = document.getElementById("top");
    window.__lenis?.scrollTo(el.offsetTop + i * window.innerHeight + 2);
  };
  return (
    <section className="hero" id="top" style={{ height: `${HOME.length * 100}svh` }}>
      <div className="hero__pin">
        <div className="hero__meta mono">
          <span>Extrait de Parfum · 75 ml</span>
          <span>10 koku · Unisex</span>
        </div>
        <h1 className="hero__title display">
          <Scramble text="beyond the" className="line" delay={300} />
          <Scramble text="tangible" className="line" delay={650} />
        </h1>
        <div className="hero__info" key={p.handle}>
          <p className="mono hero__count">
            <b>{String(k + 1).padStart(2, "0")}</b> / {String(HOME.length).padStart(2, "0")}
          </p>
          <p className="eyebrow mono">{p.family}</p>
          <Scramble as="h2" text={p.name.toLowerCase()} className="display hero__name" />
          <ul className="hero__notes">
            {(p.composition?.tr ?? []).map((l) => (
              <li key={l}>
                <span className="mono">{l.split(":")[0]}</span>
                {l.split(":")[1]}
              </li>
            ))}
          </ul>
          <div className="row">
            <span className="hero__price mono">${Math.round(p.price)}</span>
            <a className="pill" href={cartUrl(p)} target="_blank" rel="noreferrer">
              Sepete ekle
            </a>
          </div>
        </div>
        <div id="seat-hero" className="seat seat--hero" />
        <div className="hero__strip">
          {HOME.map((i, j) => (
            <button key={PRODUCTS[i].handle} className={`chip${j === k ? " is-on" : ""}`} onClick={() => go(j)} style={{ "--c": PRODUCTS[i].color }}>
              <i />
              {PRODUCTS[i].name}
              <em className="chip__bar" />
            </button>
          ))}
        </div>
        <div className="hero__scroll mono">Kaydır ↓</div>
      </div>
    </section>
  );
}

function Card({ p }) {
  return (
    <section className="card" id="urun">
      <div className="card__left">
        <p className="eyebrow mono">{p.family}</p>
        <h2 className="display card__name">{p.name.toLowerCase()}</h2>
        <p className="card__sub">75 ml · Extrait de Parfum</p>
        <p className="card__price">{money(p.price)}</p>
        <div className="row">
          <a className="pill" href={cartUrl(p)} target="_blank" rel="noreferrer">
            Sepete ekle
          </a>
          <a className="link" href={p.url} target="_blank" rel="noreferrer">
            Mağazada gör →
          </a>
        </div>
      </div>
      <div className="frame">
        <div id="seat-card" className="seat seat--card" />
        <span className="frame__tag mono">{p.name} · 75 ml</span>
      </div>
      <div className="card__right">
        <h3 className="display small">intro to the scent</h3>
        <p>{p.desc}</p>
        <button className="link link--spin" onClick={spin}>
          Şişeyi çevir ↻
        </button>
      </div>
    </section>
  );
}

function Notes({ p }) {
  const L = layers(p);
  return (
    <section className="notes" id="notalar">
      <div className="frame frame--wide">
        <div id="seat-notes" className="seat seat--notes" />
      </div>
      <div className="notes__body">
        <h3 className="display small">the notes</h3>
        <div className="notes__grid">
          {L.map((x) => (
            <div key={x.k}>
              <p className="eyebrow mono">{x.k}</p>
              <p>{x.v.join(" · ")}</p>
            </div>
          ))}
        </div>
        <button className="pill" onClick={spin}>
          Şişeyi çevir
        </button>
      </div>
    </section>
  );
}

function Manifesto() {
  return (
    <section className="manifesto" id="hikaye">
      <h2 className="display">
        <Scramble text="welcome to reinvented" className="line" trigger="view" />
        <Scramble text="where scent meets memory" className="line" trigger="view" delay={250} />
      </h2>
      <p>
        Reinvented hayatın özü: zihnin, enerjinin, duygunun, ruhun ve bedenin birbirinden ayrılmadığı, her birinin ötekini tanımladığı ilk an. Sınırları
        olmayan akışkan bir dünyaya kaçış; görünür ile görünmez, mümkün ile imkânsız, geçici ile sonsuz arasında gizemli simyalar.
      </p>
      <div className="stats">
        <div>
          <b className="display">10</b>
          <span>extrait de parfum</span>
        </div>
        <div>
          <b className="display">75ml</b>
          <span>her şişe</span>
        </div>
        <div>
          <b className="display">vegan</b>
          <span>ftalatsız, hayvanlarda test edilmemiş</span>
        </div>
      </div>
    </section>
  );
}

function Gallery() {
  return (
    <section className="gallery" id="galeri">
      <div className="sec-head">
        <h2 className="display">moments</h2>
        <p className="mono">Markanın kampanya fotoğrafları</p>
      </div>
      <div className="gallery__grid">
        {GALLERY.map((g) => {
          const i = PRODUCTS.findIndex((p) => p.handle === g.handle);
          return (
            <figure key={g.src} className="shot" style={{ aspectRatio: `${g.w} / ${g.h}` }}>
              <img src={`${BASE}assets/${g.src}`} alt={PRODUCTS[i]?.name} loading="lazy" />
              <figcaption className="mono">{PRODUCTS[i]?.name}</figcaption>
            </figure>
          );
        })}
      </div>
    </section>
  );
}

function Collection({ cur }) {
  const go = (i) => {
    setCurrent(i);
    document.getElementById("urun")?.scrollIntoView({ behavior: "smooth" });
  };
  return (
    <section className="collection" id="koleksiyon">
      <div className="sec-head">
        <h2 className="display">the collection</h2>
        <p className="mono">On koku · 75 ml · Extrait de Parfum</p>
      </div>
      <div className="collection__grid">
        {PRODUCTS.map((p, i) => (
          <article key={p.handle} className={`pcard${i === cur ? " is-on" : ""}`} style={{ "--c": p.color }}>
            <button className="pcard__img" onClick={() => go(i)} aria-label={`${p.name} kokusunu incele`}>
              <img src={`${BASE}assets/${p.handle}-card.webp`} alt={p.name} loading="lazy" />
            </button>
            <div className="pcard__info">
              <h3 className="display">{p.name.toLowerCase()}</h3>
              <p className="mono">{p.family}</p>
              <div className="row">
                <span className="pcard__price">{money(p.price)}</span>
                <a className="pill pill--sm" href={cartUrl(p)} target="_blank" rel="noreferrer">
                  Sepete ekle
                </a>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function Faq() {
  const [open, setOpen] = useState(0);
  return (
    <section className="faq" id="sss">
      <div className="sec-head">
        <h2 className="display">faq</h2>
        <p className="mono">Sık sorulanlar</p>
      </div>
      {FAQ.map(([q, a], i) => (
        <div key={q} className={`faq__item${open === i ? " is-open" : ""}`}>
          <button onClick={() => setOpen(open === i ? -1 : i)}>
            <span>{q}</span>
            <i>{open === i ? "–" : "+"}</i>
          </button>
          <p>{a}</p>
        </div>
      ))}
    </section>
  );
}

function Footer() {
  return (
    <footer className="foot">
      <div className="foot__big display">reinvented</div>
      <div className="foot__row mono">
        <a href="mailto:orders@reinventedparfums.com">orders@reinventedparfums.com</a>
        <a href="https://www.instagram.com/reinventedparfums/" target="_blank" rel="noreferrer">
          @reinventedparfums
        </a>
        <a href={STORE} target="_blank" rel="noreferrer">
          reinventedparfums.com
        </a>
      </div>
      <p className="foot__note">
        Bu sayfa Reinvented Parfums için hazırlanmış bağımsız bir konsept demodur ve marka sahibiyle bağlantılı değildir. Ürün görselleri, notalar, fiyatlar
        ve metinler markanın kendi sitesinden (reinventedparfums.com) alınmıştır.
      </p>
    </footer>
  );
}

function Cursor() {
  const ref = useRef();
  useEffect(() => {
    if (window.matchMedia("(pointer: coarse)").matches) return;
    let x = innerWidth / 2;
    let y = innerHeight / 2;
    let cx = x;
    let cy = y;
    let raf;
    const move = (e) => {
      x = e.clientX;
      y = e.clientY;
      state.pointer.x = (x / innerWidth) * 2 - 1;
      state.pointer.y = (y / innerHeight) * 2 - 1;
      const t = e.target.closest?.("a,button");
      ref.current?.classList.toggle("is-hot", !!t);
    };
    const tick = () => {
      cx += (x - cx) * 0.2;
      cy += (y - cy) * 0.2;
      if (ref.current) ref.current.style.transform = `translate(${cx}px, ${cy}px)`;
      raf = requestAnimationFrame(tick);
    };
    addEventListener("pointermove", move);
    raf = requestAnimationFrame(tick);
    return () => (removeEventListener("pointermove", move), cancelAnimationFrame(raf));
  }, []);
  return <div ref={ref} className="cursor" aria-hidden="true" />;
}

// Vitrinin kesirli sırası: bölümün sabit kaldığı aralıkta her ekran boyu bir koku. Sıra değişince koku
// anında değişir (şişe o an yan dönük); vitrinden çıkınca son kokuda kalır.
let lastK = 0;
function heroProgress() {
  const el = document.getElementById("top");
  if (!el) return;
  const vh = window.innerHeight;
  const raw = (window.scrollY - el.offsetTop) / vh;
  state.heroP = Math.max(0, Math.min(HOME.length - 1, raw));
  const k = Math.round(state.heroP);
  if (raw < HOME.length - 0.5 && k !== lastK) {
    lastK = k;
    setCurrent(HOME[k], { instant: true });
  } else if (raw >= HOME.length - 0.5) lastK = -1;
  document.querySelectorAll(".chip__bar").forEach((b, j) => (b.style.transform = `scaleX(${Math.max(0, Math.min(1, state.heroP - j + 0.5))})`));
}

export default function App() {
  const cur = useCurrent();
  const p = PRODUCTS[cur];
  useEffect(() => {
    document.documentElement.style.setProperty("--accent", PRODUCTS[state.current].color);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      addEventListener("scroll", heroProgress, { passive: true });
      return () => removeEventListener("scroll", heroProgress);
    }
    const lenis = new Lenis({ lerp: 0.1 });
    window.__lenis = lenis;
    let raf;
    const loop = (t) => {
      lenis.raf(t);
      heroProgress();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    const onClick = (e) => {
      const a = e.target.closest?.('a[href^="#"]');
      if (!a) return;
      e.preventDefault();
      lenis.scrollTo(a.getAttribute("href") === "#top" ? 0 : a.getAttribute("href"), { offset: -60 });
    };
    document.addEventListener("click", onClick);
    return () => (cancelAnimationFrame(raf), lenis.destroy(), document.removeEventListener("click", onClick));
  }, []);
  return (
    <>
      <Backdrop />
      <Stage />
      <Header p={p} />
      <main>
        <Hero cur={cur} />
        <Card p={p} />
        <Notes p={p} />
        <Manifesto />
        <Gallery />
        <Collection cur={cur} />
        <Faq />
      </main>
      <Footer />
      <Cursor />
    </>
  );
}
