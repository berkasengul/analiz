import { useEffect, useRef, useState } from "react";

import { content, flavors } from "../data";
import { useT } from "../i18n";
import { useStore } from "../store";
import { THEME } from "../theme";

import { assetUrl } from "../shared";
// Keşif seti bandı (content.discovery; demo-fabrikasi/araclar/kesif-seti.py): markanın set fotoğrafındaki
// büyük kutu (ör. altın "kitap") kaidede belirir, üzerinden altın ışık geçer; küçük koku kutuları sırayla
// yükselip önüne dizilir. Kutunun üzerine gelince kokunun adı çıkar, tıklayınca o koku açılır.
// Sağda markanın metni, fiyat ve sepete ekle.
const D = content.discovery;
export const DISCOVERY = !!D;

export default function Discovery() {
  const t = useT();
  const L = t.lang === "en" ? "en" : "tr";
  const ref = useRef(null);
  const [inView, setIn] = useState(false);
  const [added, setAdded] = useState(false);
  const addToCart = useStore((s) => s.addToCart);
  const setCartOpen = useStore((s) => s.setCartOpen);

  useEffect(() => {
    const io = new IntersectionObserver(([e]) => e.isIntersecting && (setIn(true), io.disconnect()), { threshold: 0.3 });
    io.observe(ref.current);
    return () => io.disconnect();
  }, []);

  const [x0, y0, x1, y1] = D.bbox;
  const bw = x1 - x0;
  const bh = y1 - y0;
  // Büyük kutu tam kare görselden (kesif/book.webp) kırpılır; ışık süzmesi aynı görselle maskelenir.
  const bookBg = (k) => ({
    [`${k}Image`]: `url("${assetUrl(D.book)}")`,
    [`${k}Size`]: `${100 / bw}% ${100 / bh}%`,
    [`${k}Position`]: `${(x0 / (1 - bw)) * 100}% ${(y0 / (1 - bh)) * 100}%`,
    [`${k}Repeat`]: "no-repeat",
    ...(k === "mask" ? { WebkitMaskImage: `url("${assetUrl(D.book)}")`, WebkitMaskSize: `${100 / bw}% ${100 / bh}%`, WebkitMaskPosition: `${(x0 / (1 - bw)) * 100}% ${(y0 / (1 - bh)) * 100}%`, WebkitMaskRepeat: "no-repeat" } : {}),
  });
  const pos = (b) => ({ left: `${((b.x - x0) / bw) * 100}%`, top: `${((b.y - y0) / bh) * 100}%`, width: `${(b.w / bw) * 100}%`, height: `${(b.h / bh) * 100}%` });
  const open = (b) => {
    const idx = flavors.findIndex((f) => f.handle === b.handle);
    if (idx >= 0) window.dispatchEvent(new CustomEvent("open-product", { detail: { index: idx } }));
    else window.location.hash = `#/urunler/${content.catalog.items.find((i) => i.id === b.handle)?.category ?? ""}/${b.handle}`;
  };
  const add = () => {
    addToCart(`c:${D.id}`, 1, "once", 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 1400);
    setTimeout(() => setCartOpen(true), 250);
  };
  const txt = t.ui.discoveryUi ?? (L === "en" ? { add: "Add to bag", added: "Added", hint: "Hover a story · click to open it" } : { add: "Sepete ekle", added: "Eklendi", hint: "Bir hikâyenin üzerine gel · açmak için tıkla" });

  return (
    <section id="discovery" ref={ref} className={`section disco${inView ? " is-in" : ""}`} style={{ "--plinth": THEME.plinthColor ?? "#f1ebe3" }}>
      <div className="disco__room" aria-hidden="true">
        <div className="epi-wall" />
        <div className="epi-silk">
          <i />
          <i />
          <i />
        </div>
        <div className="epi-floor" />
        <div className="epi-vignette" />
      </div>
      <div className="disco__stage">
        <div className="disco__set" style={{ aspectRatio: `${bw} / ${bh}` }}>
          <span className="disco__book" style={bookBg("background")}>
            <span className="disco__sweep" style={bookBg("mask")} />
          </span>
          {D.boxes.map((b, k) => (
            <button key={b.file} className="disco__box" style={{ ...pos(b), "--k": k }} onClick={() => open(b)} aria-label={b.name[L] ?? b.name.tr}>
              <img src={`${assetUrl(b.file)}`} alt="" loading="lazy" />
              <span className="disco__tip mono">{b.name[L] ?? b.name.tr}</span>
            </button>
          ))}
          <div className="disco__plinth" aria-hidden="true">
            <span />
          </div>
        </div>
        <p className="disco__hint mono">{txt.hint}</p>
      </div>
      <div className="disco__card">
        <p className="mono section__eyebrow">
          {D.title}
          {D.size ? ` · ${D.size}` : ""}
        </p>
        <h2 className="disco__title">{D.tagline ?? D.title}</h2>
        <p className="disco__text">{D.text}</p>
        {D.points?.length > 0 && (
          <ul className="disco__points">
            {D.points.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        )}
        <div className="disco__buy">
          <span className="disco__price">{t.money(t.price(1, "once", `c:${D.id}`))}</span>
          <button className={`pill disco__add${added ? " is-added" : ""}`} onClick={add}>
            {added ? txt.added : txt.add}
          </button>
        </div>
      </div>
    </section>
  );
}
