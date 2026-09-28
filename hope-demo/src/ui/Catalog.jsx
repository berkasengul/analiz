import { useEffect, useMemo, useRef, useState } from "react";

import { PAGE, SET_KEY, content, flavors } from "../data";
import { useT, termLang } from "../i18n";
import { useStore } from "../store";
import { Arrow, Bag, Plus } from "../Icons";
import { THEME, numeralOf } from "../theme";

// "gallery" kartları (content.theme.cards): ürünün kendi renginde zemin, arkada dev numara,
// ışıklı kaide, açıklama yerine koku notaları.
const GALLERY = THEME.cards === "gallery";

// Markanın tüm ürün kataloğu (content.json → catalog). Ana sayfada karışık bir
// vitrin, ayrı sayfada (#/urunler) kategorilere ayrılmış liste. Ürünlerin
// bir kısmı 3B sahnedeki ürünlerle aynıdır (`product`); diğerleri kartla gösterilir.
const C = content.catalog;
const BASE = import.meta.env.BASE_URL;

export const catalogId = (id) => `c:${id}`;

const base = {
  viewBox: "0 0 48 48",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.4,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
};

// Görseli olmayan ürünler için çizgi simgeler.
const ICONS = {
  soap: (
    <svg {...base}>
      <rect x="9" y="17" width="30" height="16" rx="7" />
      <path d="M14 22c3-2 6 2 9 0s6-2 9 0M31 12a2 2 0 1 0 0-.1M36 9a1.5 1.5 0 1 0 0-.1M26 11a1 1 0 1 0 0-.1" />
    </svg>
  ),
  dropper: (
    <svg {...base}>
      <path d="M20 6h8v6h-8zM18 12h12v4H18z" />
      <rect x="15" y="16" width="18" height="26" rx="5" />
      <path d="M24 24c-2 3-3 4.5-3 6a3 3 0 0 0 6 0c0-1.5-1-3-3-6Z" />
    </svg>
  ),
  spray: (
    <svg {...base}>
      <path d="M20 5h7v5h-7zM27 7h6M22 10v4" />
      <rect x="15" y="14" width="17" height="28" rx="5" />
      <path d="M36 5l3-1.5M36 8h3.5M36 11l3 1.5" />
    </svg>
  ),
  pump: (
    <svg {...base}>
      <path d="M22 5h9M26 5v5M22 10h8v5h-8z" />
      <rect x="14" y="15" width="20" height="28" rx="5" />
      <path d="M19 26h10M19 31h10" />
    </svg>
  ),
  rollon: (
    <svg {...base}>
      <circle cx="24" cy="9" r="4" />
      <path d="M19 12h10v5H19z" />
      <rect x="16" y="17" width="16" height="26" rx="6" />
    </svg>
  ),
  tool: (
    <svg {...base}>
      <path d="M24 4c6 0 10 5 10 12 0 5-3 8-6 10v16a4 4 0 0 1-8 0V26c-3-2-6-5-6-10 0-7 4-12 10-12Z" />
      <path d="M19 12h10M19 17h10" />
    </svg>
  ),
  brush: (
    <svg {...base}>
      <rect x="8" y="10" width="26" height="12" rx="5" />
      <path d="M11 22v8M15 22v10M19 22v9M23 22v10M27 22v9M31 22v8M34 16h8" />
    </svg>
  ),
  loofah: (
    <svg {...base}>
      <path d="M12 38c-4-6 2-20 12-26s16 0 12 8-14 20-24 18Z" />
      <path d="M17 32c5-4 10-10 14-16M16 25l6 3M21 19l6 3M27 14l5 2" />
    </svg>
  ),
  set: (
    <svg {...base}>
      <path d="M8 18h32v22H8zM6 12h36v6H6zM24 12v28" />
      <path d="M24 12c-3-6-10-6-10-2s7 2 10 2c3 0 10 2 10-2s-7-4-10 2Z" />
    </svg>
  ),
  shirt: (
    <svg {...base}>
      <path d="M17 6l-9 5-4 10 6 2v19h28V23l6-2-4-10-9-5c-1 3-4 5-7 5s-6-2-7-5Z" />
      <path d="M18 24h12" />
    </svg>
  ),
};

// Kart ekrana girince yukarı süzülür; fareyle eğilir ve ışık fareyi izler.
function useCardMotion() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        el.classList.add("is-in");
        io.disconnect();
      },
      { threshold: 0.12 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const fine = typeof window !== "undefined" && window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (!fine) return { ref };
  return {
    ref,
    onPointerMove: (e) => {
      const r = e.currentTarget.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;
      const y = (e.clientY - r.top) / r.height;
      e.currentTarget.style.setProperty("--ry", `${((x - 0.5) * 10).toFixed(2)}deg`);
      e.currentTarget.style.setProperty("--rx", `${((0.5 - y) * 8).toFixed(2)}deg`);
      e.currentTarget.style.setProperty("--lx", `${(x * 100).toFixed(1)}%`);
      e.currentTarget.style.setProperty("--ly", `${(y * 100).toFixed(1)}%`);
    },
    onPointerLeave: (e) => {
      for (const k of ["--rx", "--ry", "--lx", "--ly"]) e.currentTarget.style.removeProperty(k);
    },
  };
}

function Card({ item, t, onOpen, index = 0 }) {
  const addToCart = useStore((s) => s.addToCart);
  const setCartOpen = useStore((s) => s.setCartOpen);
  const cat = C.categories.find((c) => c.id === item.category);
  const name = item.name[t.lang] ?? item.name.tr;
  const [added, setAdded] = useState(false);
  const motion = useCardMotion();
  const num = GALLERY ? numeralOf(item.name.tr) : null;
  const prod = GALLERY && item.product != null ? content.products[item.product] : null;
  const notes = prod ? (t.lang === "en" ? prod.en?.notes : null) ?? prod.notes : null;
  const add = () => {
    addToCart(catalogId(item.id), 1, "once", 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 1400);
    setTimeout(() => setCartOpen(true), 250);
  };
  // Sergi kartı: ürün 3B sahnede (kemerli niş, mermer kaide, spot ışığı); yazı görselin
  // altındaki karartmanın üstünde, sağda sepet ve ürünü açan yuvarlak düğmeler.
  if (GALLERY && item.scene)
    return (
      <article className="pcard pcard--scene" style={{ "--i": index % 4 }} {...motion}>
        <button className="pcard__scene" onClick={() => onOpen?.(item)} tabIndex={item.product != null ? 0 : -1} aria-label={name}>
          <img src={`${BASE}${item.scene}`} alt="" loading="lazy" />
          <span className="pcard__dust" aria-hidden="true" />
        </button>
        <div className="pcard__over">
          <p className="pcard__cat mono" lang={termLang(cat?.name[t.lang])}>{cat?.name[t.lang]}</p>
          <h3 className="pcard__name" lang={termLang(name) ?? t.nameLang}>{name}</h3>
          <p className="pcard__size mono">
            {item.size ? `${item.size} · ` : ""}
            {t.money(t.price(1, "once", catalogId(item.id)))}
          </p>
          <div className="pcard__acts">
            <button className={`pcard__round${added ? " is-added" : ""}`} onClick={add} aria-label={t.ui.addToCart} title={t.ui.addToCart}>
              {added ? <Plus /> : <Bag />}
            </button>
            <button className="pcard__round pcard__round--go" onClick={() => onOpen?.(item)} aria-label={name}>
              <Arrow />
            </button>
          </div>
        </div>
      </article>
    );
  return (
    <article
      className={`pcard${GALLERY ? " pcard--gallery" : ""}`}
      style={{ "--c": item.color ?? cat?.color, "--i": index % 4, "--f": index % 5, ...(item.bg ? { "--bg": item.bg, "--bg2": item.bg2 } : {}) }}
      {...motion}
    >
      <button className={`pcard__media${item.cutout ? " is-cutout" : ""}`} onClick={() => onOpen?.(item)} tabIndex={item.product != null ? 0 : -1} aria-label={name}>
        <span className="pcard__beam" aria-hidden="true" />
        {num && (
          <span className="pcard__num" aria-hidden="true">
            {num}
          </span>
        )}
        {item.cutout && <span className="pcard__floor" aria-hidden="true" />}
        <span className="pcard__float">
          {item.image ? (
            <>
              <img src={`${BASE}${item.image}`} alt="" loading="lazy" />
              {/* Kesilmiş üründe parlak zeminde silik yansıma. */}
              {item.cutout && <img className="pcard__reflect" src={`${BASE}${item.image}`} alt="" loading="lazy" aria-hidden="true" />}
              {/* Gerçek ürün fotoğrafı: üzerine gelince 3B görselin yerine geçer. */}
              {item.photo && <img className="pcard__photo" src={`${BASE}${item.photo}`} alt="" loading="lazy" />}
            </>
          ) : (
            <span className="pcard__icon">{ICONS[item.icon] ?? ICONS.set}</span>
          )}
        </span>
        {!item.image && <span className="pcard__stage" aria-hidden="true" />}
        <span className="pcard__dust" aria-hidden="true" />
      </button>
      <div className="pcard__body">
        <p className="pcard__cat mono" lang={termLang(cat?.name[t.lang])}>{cat?.name[t.lang]}</p>
        <h3 className="pcard__name" lang={termLang(name) ?? t.nameLang}>{name}</h3>
        {item.size && <p className="pcard__size mono">{item.size}</p>}
        {notes?.length ? (
          <p className="pcard__notes">{notes.slice(0, 5).join(" · ")}</p>
        ) : (
          <p className="pcard__desc">{item.desc[t.lang] ?? item.desc.tr}</p>
        )}
        <div className="pcard__foot">
          <span className="pcard__price">
            {t.money(t.price(1, "once", catalogId(item.id)))}
            {item.compareAt && <s className="pcard__was">{t.money(item.compareAt[t.lang])}</s>}
          </span>
          <button
            className={`pcard__add${added ? " is-added" : ""}`}
            onClick={add}
            aria-label={t.ui.addToCart}
          >
            <Plus />
            <span>{added ? t.ui.added : t.ui.addToCart}</span>
          </button>
        </div>
      </div>
    </article>
  );
}

// Ana sayfadaki 3B sahne gibi: süzülen zeytin yaprakları ve ışık tozları.
// Bir kısmı kartların arkasında, birkaçı önünde (derinlik).
const rnd = (i, k) => {
  const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453;
  return x - Math.floor(x);
};
const LEAF = "M12 .5C7 5 5.5 12 7.5 19c.8 2.8 2.6 4.5 4.5 4.5s3.7-1.7 4.5-4.5C18.5 12 17 5 12 .5Z";
const SHADE = "M12 .5v23c-1.9 0-3.7-1.7-4.5-4.5C5.5 12 7 5 12 .5Z";
function Leaves({ count, front = false }) {
  // Tema parçacıkları olan markada (content.particles "none") yaprak yağmuru yok.
  if (content.particles === "none") count = 0;
  const leaves = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        left: rnd(i, front ? 7 : 1) * 100,
        size: (front ? 28 : 16) + rnd(i, 2) * (front ? 20 : 20),
        dur: (front ? 13 : 18) + rnd(i, 3) * 14,
        delay: -rnd(i, 4) * 30,
        sway: 30 + rnd(i, 5) * 70,
        spin: rnd(i, 6) > 0.5 ? 1 : -1,
      })),
    [count, front]
  );
  return (
    <div className={`leaves${front ? " leaves--front" : ""}${content.particles === "leaves" ? "" : " leaves--petals"}`} aria-hidden="true">
      {leaves.map((l, i) => (
        <span
          key={i}
          style={{ left: `${l.left}%`, "--s": `${l.size}px`, "--d": `${l.dur}s`, "--dl": `${l.delay}s`, "--sw": `${l.sway}px`, "--sp": l.spin }}
        >
          <svg viewBox="0 0 24 24">
            <path d={LEAF} />
            <path d={SHADE} className="leaves__shade" />
            <path d="M12 2.5v20" className="leaves__vein" />
          </svg>
        </span>
      ))}
    </div>
  );
}

function Atmosphere() {
  return (
    <div className="atmos" aria-hidden="true">
      <div className="atmos__beam" />
      <div className="atmos__bokeh">
        {Array.from({ length: 14 }, (_, i) => (
          <i key={i} style={{ left: `${rnd(i, 8) * 100}%`, top: `${rnd(i, 9) * 100}%`, "--b": `${6 + rnd(i, 10) * 26}px`, "--d": `${16 + rnd(i, 11) * 18}s`, "--dl": `${-rnd(i, 12) * 20}s` }} />
        ))}
      </div>
      <Leaves count={16} />
      <div className="atmos__grain" />
    </div>
  );
}

// 3B ürüne tıklanınca: ürün bu sayfanın 3B setindeyse akışta ona kayıp
// detayı açar; değilse ürünün kategori sayfası o ürünle açılır.
export function openProduct(item) {
  if (item.product == null) return;
  const index = flavors.findIndex((f) => f.gid === item.product);
  if (index < 0) {
    window.location.hash = `#/urunler/${item.category}/${item.id}`;
    return;
  }
  const home = SET_KEY === "home" ? "#flavors" : `#/urunler/${SET_KEY}`;
  const here = !document.getElementById("flavors");
  if (here) window.location.hash = home;
  setTimeout(() => window.dispatchEvent(new CustomEvent("open-product", { detail: { index } })), here ? 700 : 0);
}

const catCount = (id) => C.items.filter((i) => i.category === id).length;

// Kategori sayfasının üstünde: kategori adı ve diğer kategorilere geçiş.
export function CategoryBar({ id }) {
  const t = useT();
  const cat = C.categories.find((c) => c.id === id);
  const ref = useRef(null);
  useEffect(() => {
    const on = ref.current?.querySelector(".is-on");
    if (on) ref.current.scrollLeft = on.offsetLeft - (ref.current.clientWidth - on.offsetWidth) / 2;
  }, []);
  return (
    <div className="catbar" style={{ "--c": cat.color }}>
      <p className="catbar__title mono">
        <i aria-hidden="true" />
        <span lang={termLang(cat.name[t.lang])}>{cat.name[t.lang]}</span> · {t.ui.itemsCount ? t.ui.itemsCount(catCount(id)) : catCount(id)}
      </p>
      <nav className="catbar__chips" ref={ref} aria-label={t.ui.categories}>
        <a href="#/urunler">{t.ui.all}</a>
        {C.categories.map((c) => (
          <a key={c.id} href={`#/urunler/${c.id}`} className={c.id === id ? "is-on" : ""} aria-current={c.id === id ? "page" : undefined} style={{ "--c": c.color }}>
            <span lang={termLang(c.name[t.lang])}>{c.name[t.lang]}</span>
          </a>
        ))}
      </nav>
    </div>
  );
}

// Kategori sayfasında 3B akışın altında: o kategorinin kartları ve diğer kategoriler.
export function CategoryGrid({ id }) {
  const t = useT();
  const cat = C.categories.find((c) => c.id === id);
  const items = C.items.filter((i) => i.category === id);
  const others = C.categories.filter((c) => c.id !== id);
  return (
    <section className="catgrid" style={{ "--c": cat.color }}>
      <Leaves count={10} />
      <header className="catgrid__head">
        <p className="mono section__eyebrow">{t.ui.allEyebrow}</p>
        <h2 className="catalog__title" lang={termLang(cat.name[t.lang])}>{cat.name[t.lang]}</h2>
        {cat.desc && <p className="tagline tagline--static">{cat.desc[t.lang]}</p>}
      </header>
      <div className="pgrid">
        {items.map((item, i) => (
          <Card key={item.id} item={item} t={t} onOpen={openProduct} index={i} />
        ))}
      </div>
      <div className="catgrid__others">
        <p className="mono">{t.ui.otherCategories ?? t.ui.categories}</p>
        <nav className="catalog__tabs">
          {others.map((c) => (
            <a key={c.id} href={`#/urunler/${c.id}`} style={{ "--c": c.color }}>
              <i aria-hidden="true" />
              <span lang={termLang(c.name[t.lang])}>{c.name[t.lang]}</span>
              <small>{catCount(c.id)}</small>
            </a>
          ))}
          <a href="#/urunler">
            {t.ui.all}
            <small>{C.items.length}</small>
          </a>
        </nav>
      </div>
    </section>
  );
}

// Ana sayfa: kategoriler karışık, sırayla birinden birer ürün.
export function CollectionGrid() {
  const t = useT();
  const mixed = useMemo(() => {
    const groups = C.categories.map((c) => C.items.filter((i) => i.category === c.id));
    const out = [];
    for (let k = 0; out.length < C.items.length; k++) groups.forEach((g) => g[k] && out.push(g[k]));
    return out;
  }, []);
  return (
    <section id="all" className="section collection">
      <header className="section__head reveal">
        <p className="mono section__eyebrow">{t.ui.allEyebrow}</p>
        <h2 className="section__title">{t.ui.allTitle}</h2>
        <p className="tagline tagline--static">{t.ui.allTag(C.items.length)}</p>
      </header>
      <div className="pgrid reveal">
        {mixed.slice(0, C.homeCount ?? 8).map((item, i) => (
          <Card key={item.id} item={item} t={t} onOpen={openProduct} index={i} />
        ))}
      </div>
      <div className="collection__more reveal">
        <a className="explore" href="#/urunler">
          <span className="explore__text">
            <span className="explore__label">{t.ui.exploreAll}</span>
            <span className="explore__sub">{t.ui.exploreSub(C.items.length, C.categories.length)}</span>
          </span>
          <span className="explore__arrow" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="18" height="18">
              <path d="M5 12h13M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </a>
      </div>
    </section>
  );
}

// Ürünler sayfasının girişi (sergi kartlı temalar): bütün ürünler kemerli sergi görselleriyle 3B bir
// kapak akışında (coverflow) durur. Sayfa kaydıkça ürünler kayar; öndeki ürün aydınlık ve dik, yandakiler
// açılı ve kararmış. Öndeki ürünün adı, fiyatı ve düğmeleri altta yazar. Hareket azaltma ayarında
// kendiliğinden ilerlemez.
function CatalogHero({ items, t, title, children }) {
  const sec = useRef(null);
  const ring = useRef(null);
  const [front, setFront] = useState(0);
  const addToCart = useStore((s) => s.addToCart);
  const setCartOpen = useStore((s) => s.setCartOpen);
  const N = items.length;
  useEffect(() => {
    const el = sec.current;
    const cards = [...ring.current.children];
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf;
    let last = performance.now();
    let cur = -1;
    let hover = false;
    // Kendiliğinden ilerleme: her birkaç saniyede bir sonraki ürün yumuşakça öne gelir
    // (fare sergideyken durur); kaydırma bunun üstüne ürünleri ilerletir.
    let goal = 0;
    let auto = 0;
    let wait = 3.2;
    const on = () => (hover = true);
    const off = () => (hover = false);
    ring.current.addEventListener("pointerenter", on);
    ring.current.addEventListener("pointerleave", off);
    const tick = (now) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const r = el.getBoundingClientRect();
      if (r.bottom < 0 || r.top > window.innerHeight) return;
      if (!still && !hover && (wait -= dt) <= 0) {
        goal += 1;
        wait = 3.2;
      }
      auto += (goal - auto) * (1 - Math.exp(-dt * 3.2));
      const p = Math.min(1, Math.max(0, -r.top / Math.max(1, r.height - window.innerHeight)));
      el.style.setProperty("--p", p.toFixed(4));
      const pos = auto + p * 8;
      const cw = cards[0].offsetWidth;
      cards.forEach((c, i) => {
        // Öndeki ürüne uzaklık (halka gibi başa sarar): -N/2 … N/2.
        let d = (((i - pos) % N) + N) % N;
        if (d > N / 2) d -= N;
        const ad = Math.abs(d);
        const sg = Math.sign(d);
        const near = Math.min(ad, 1);
        const far = Math.max(0, ad - 1);
        const x = sg * (near * 0.86 + far * 0.5) * cw;
        const z = -(near * 0.62 + far * 0.3) * cw;
        const ry = -sg * near * 42;
        c.style.transform = `translate3d(${x.toFixed(1)}px, 0, ${z.toFixed(1)}px) rotateY(${ry.toFixed(2)}deg)`;
        c.style.zIndex = String(100 - Math.round(ad * 10));
        c.style.opacity = String(Math.max(0, Math.min(1, 4.6 - ad)).toFixed(3));
        c.style.visibility = ad > 4.7 ? "hidden" : "visible";
        c.style.setProperty("--lit", (0.16 + 0.84 * Math.max(0, 1 - ad) ** 1.6).toFixed(3));
      });
      const best = ((Math.round(pos) % N) + N) % N;
      if (best !== cur) {
        cur = best;
        setFront(best);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      ring.current?.removeEventListener("pointerenter", on);
      ring.current?.removeEventListener("pointerleave", off);
    };
  }, [N]);
  const item = items[front];
  const cat = C.categories.find((c) => c.id === item.category);
  const name = item.name[t.lang] ?? item.name.tr;
  return (
    <section className="cathero" ref={sec} style={{ "--n": N }}>
      <div className="cathero__pin">
        <div className="cathero__beam" aria-hidden="true" />
        <div className="cathero__head">{children}</div>
        <div className="cathero__stage">
          <div className="cathero__ring" ref={ring}>
            {items.map((it, i) => (
              <button
                key={it.id}
                className="cathero__card"
                style={{ "--i": i }}
                onClick={() => openProduct(it)}
                aria-label={it.name[t.lang] ?? it.name.tr}
                tabIndex={i === front ? 0 : -1}
              >
                <img src={`${BASE}${it.scene}`} alt="" loading={i < 6 || i > N - 4 ? "eager" : "lazy"} />
              </button>
            ))}
          </div>
          <div className="cathero__floor" aria-hidden="true" />
        </div>
        <div className="cathero__now" key={item.id}>
          <p className="mono" lang={termLang(cat?.name[t.lang])}>{cat?.name[t.lang]}</p>
          <h2 lang={termLang(name) ?? t.nameLang}>{name}</h2>
          <p className="cathero__price mono">
            {item.size ? `${item.size} · ` : ""}
            {t.money(t.price(1, "once", catalogId(item.id)))}
          </p>
          <div className="pcard__acts">
            <button
              className="pcard__round"
              onClick={() => {
                addToCart(catalogId(item.id), 1, "once", 1);
                setTimeout(() => setCartOpen(true), 250);
              }}
              aria-label={t.ui.addToCart}
              title={t.ui.addToCart}
            >
              <Bag />
            </button>
            <button className="pcard__round pcard__round--go" onClick={() => openProduct(item)} aria-label={name}>
              <Arrow />
            </button>
          </div>
        </div>
        <p className="cathero__hint mono" aria-hidden="true">{title}</p>
      </div>
    </section>
  );
}

// Ayrı sayfa: kategoriler başlık başlık, üstte hızlı geçiş çipleri. Seçili
// kategori adreste durur (#/urunler/sac), üst menüden doğrudan açılabilir.
export function CatalogPage({ cat }) {
  const t = useT();
  const tabs = useRef(null);
  const cats = C.categories.filter((c) => C.items.some((i) => i.category === c.id));
  const active = cats.some((c) => c.id === cat) ? cat : "all";
  useEffect(() => {
    window.scrollTo(0, 0);
    // Bu sayfada 3B sahne yok: doğrudan linkle açılınca yükleme ekranı beklemesin.
    useStore.getState().setSceneReady();
  }, []);
  // Kategori değişince sekmeler görünür kalsın; telefonda seçili sekme ortaya kayar.
  const first = useRef(true);
  useEffect(() => {
    const on = tabs.current.querySelector(".is-on");
    if (on) tabs.current.scrollTo({ left: on.offsetLeft - (tabs.current.clientWidth - on.offsetWidth) / 2, behavior: first.current ? "auto" : "smooth" });
    if (first.current) return void (first.current = false);
    const top = tabs.current.getBoundingClientRect().top + window.scrollY - 110;
    if (window.scrollY > top) window.scrollTo({ top, behavior: "smooth" });
  }, [active]);
  const shown = active === "all" ? cats : cats.filter((c) => c.id === active);
  const tint = active === "all" ? C.glow ?? content.products[0]?.theme?.glow : cats.find((c) => c.id === active)?.color;
  let n = 0;
  // Sergi kartlı temada girişte 3B dönen sergi (yalnızca "tümü" görünümünde).
  const showcase = GALLERY ? C.items.filter((i) => i.scene) : [];
  const intro = (
    <>
      <a className="catalog__back mono" href="#flavors">
        ← {t.ui.backHome}
      </a>
      <p className="mono section__eyebrow">{t.ui.allEyebrow}</p>
      <h1 className="catalog__title">{active === "all" ? t.ui.catalogTitle : cats.find((c) => c.id === active).name[t.lang]}</h1>
      <p className="tagline tagline--static">{t.ui.allTag(C.items.length)}</p>
    </>
  );
  const tabsNav = (
      <nav className="catalog__tabs" aria-label={t.ui.categories} ref={tabs}>
        {[{ id: "all", color: C.glow, name: { tr: t.ui.all, en: t.ui.all } }, ...cats].map((c) => (
          <a
            key={c.id}
            href={c.id === "all" ? "#/urunler" : `#/urunler/${c.id}`}
            className={active === c.id ? "is-on" : ""}
            aria-current={active === c.id ? "page" : undefined}
            style={{ "--c": c.color }}
          >
            {c.id !== "all" && <i aria-hidden="true" />}
            <span lang={termLang(c.name[t.lang])}>{c.name[t.lang]}</span>
            <small>{c.id === "all" ? C.items.length : C.items.filter((i) => i.category === c.id).length}</small>
          </a>
        ))}
      </nav>
  );
  return (
    <main className="catalog" style={{ "--accent": C.glow ?? content.products[0]?.color, "--tint": tint }}>
      <Atmosphere />
      {showcase.length > 2 && active === "all" ? (
        <>
          <CatalogHero items={showcase} t={t} title={t.ui.scroll}>
            {intro}
          </CatalogHero>
          <header className="catalog__head catalog__head--tabs">{tabsNav}</header>
        </>
      ) : (
        <header className="catalog__head">
          {intro}
          {tabsNav}
        </header>
      )}
      <div className="catalog__groups" key={active}>
        {shown.map((c) => (
          <section key={c.id} className="catalog__group" id={`cat-${c.id}`} style={{ "--c": c.color }}>
            <div className="catalog__grouphead">
              <h2 lang={termLang(c.name[t.lang])}>{c.name[t.lang]}</h2>
              {c.desc && <p>{c.desc[t.lang]}</p>}
            </div>
            <div className="pgrid">
              {C.items
                .filter((i) => i.category === c.id)
                .map((item) => (
                  <Card key={item.id} item={item} t={t} onOpen={openProduct} index={n++} />
                ))}
            </div>
          </section>
        ))}
      </div>
      <p className="catalog__note">{t.brand.disclaimer}</p>
      <Leaves count={5} front />
    </main>
  );
}
