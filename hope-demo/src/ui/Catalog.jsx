import { useEffect, useMemo, useState } from "react";

import { content } from "../data";
import { useT } from "../i18n";
import { useStore } from "../store";
import { Plus } from "../Icons";

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

function Card({ item, t, onOpen }) {
  const addToCart = useStore((s) => s.addToCart);
  const setCartOpen = useStore((s) => s.setCartOpen);
  const cat = C.categories.find((c) => c.id === item.category);
  const name = item.name[t.lang] ?? item.name.tr;
  const [added, setAdded] = useState(false);
  return (
    <article className="pcard" style={{ "--c": item.color ?? cat?.color }}>
      <button className="pcard__media" onClick={() => onOpen?.(item)} tabIndex={item.product != null ? 0 : -1} aria-label={name}>
        {item.image ? (
          <img src={`${BASE}${item.image}`} alt="" loading="lazy" />
        ) : (
          <span className="pcard__icon">{ICONS[item.icon] ?? ICONS.set}</span>
        )}
        {item.product != null && <span className="pcard__badge mono">3D</span>}
      </button>
      <div className="pcard__body">
        <p className="pcard__cat mono">{cat?.name[t.lang]}</p>
        <h3 className="pcard__name" lang={t.nameLang}>{name}</h3>
        {item.size && <p className="pcard__size mono">{item.size}</p>}
        <p className="pcard__desc">{item.desc[t.lang] ?? item.desc.tr}</p>
        <div className="pcard__foot">
          <span className="pcard__price">{t.money(t.price(1, "once", catalogId(item.id)))}</span>
          <button
            className={`pcard__add${added ? " is-added" : ""}`}
            onClick={() => {
              addToCart(catalogId(item.id), 1, "once", 1);
              setAdded(true);
              setTimeout(() => setAdded(false), 1400);
              setTimeout(() => setCartOpen(true), 250);
            }}
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

// 3B ürüne tıklanınca ana sayfaya dönüp o ürünün detayını açar.
function openProduct(item) {
  if (item.product == null) return;
  window.location.hash = "#flavors";
  setTimeout(() => {
    const s = useStore.getState();
    const slot = s.order.indexOf(item.product);
    window.dispatchEvent(new CustomEvent("open-product", { detail: { index: item.product, slot } }));
  }, 350);
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
        {mixed.slice(0, C.homeCount ?? 8).map((item) => (
          <Card key={item.id} item={item} t={t} onOpen={openProduct} />
        ))}
      </div>
      <div className="collection__more reveal">
        <a className="pill" href="#/urunler">
          {t.ui.byCategory} →
        </a>
      </div>
    </section>
  );
}

// Ayrı sayfa: kategoriler başlık başlık, üstte hızlı geçiş çipleri.
export function CatalogPage() {
  const t = useT();
  const [active, setActive] = useState("all");
  useEffect(() => {
    window.scrollTo(0, 0);
    // Bu sayfada 3B sahne yok: doğrudan linkle açılınca yükleme ekranı beklemesin.
    useStore.getState().setSceneReady();
  }, []);
  const cats = C.categories.filter((c) => C.items.some((i) => i.category === c.id));
  const shown = active === "all" ? cats : cats.filter((c) => c.id === active);
  return (
    <main className="catalog" style={{ "--accent": content.products[0]?.color }}>
      <header className="catalog__head">
        <a className="catalog__back mono" href="#flavors">
          ← {t.ui.backHome}
        </a>
        <p className="mono section__eyebrow">{t.ui.allEyebrow}</p>
        <h1 className="section__title">{t.ui.catalogTitle}</h1>
        <p className="tagline tagline--static">{t.ui.allTag(C.items.length)}</p>
        <nav className="catalog__tabs" aria-label={t.ui.categories}>
          {[{ id: "all", name: { tr: t.ui.all, en: t.ui.all } }, ...cats].map((c) => (
            <button key={c.id} className={active === c.id ? "is-on" : ""} aria-pressed={active === c.id} onClick={() => setActive(c.id)}>
              {c.name[t.lang]}
              <small>{c.id === "all" ? C.items.length : C.items.filter((i) => i.category === c.id).length}</small>
            </button>
          ))}
        </nav>
      </header>
      {shown.map((c) => (
        <section key={c.id} className="catalog__group" id={`cat-${c.id}`}>
          <div className="catalog__grouphead">
            <h2>{c.name[t.lang]}</h2>
            {c.desc && <p>{c.desc[t.lang]}</p>}
          </div>
          <div className="pgrid">
            {C.items
              .filter((i) => i.category === c.id)
              .map((item) => (
                <Card key={item.id} item={item} t={t} onOpen={openProduct} />
              ))}
          </div>
        </section>
      ))}
      <p className="catalog__note">{t.brand.disclaimer}</p>
    </main>
  );
}
