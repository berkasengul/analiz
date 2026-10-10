import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { DETAIL_PACK, PAGE, content, features, flavors } from "../data";
import { useT, termLang } from "../i18n";
import { scrollToElement, scrollToFlavorOf } from "../scroll";
import { useStore } from "../store";
import { Arrow, Close, featureIcons } from "../Icons";
import { SplitChars, SplitWords } from "./Split";
import { SprayIcon } from "./FlavorHud";
import { sceneState, assetUrl } from "../shared";

const N = flavors.length;
const THUMBS = 6;

// Detaydaki açıklama ekrana sığsın: uzunsa cümle sonundan (yoksa kelimeden) kısaltılır.
function brief(text = "", max = 190) {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const dot = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("! "));
  return dot > max * 0.5 ? cut.slice(0, dot + 1) : `${cut.slice(0, cut.lastIndexOf(" ")).replace(/[,;:]$/, "")}…`;
}
const pad = (n) => String(n).padStart(2, "0");

export function stepFlavor(dir) {
  const { active, order, setActive } = useStore.getState();
  const next = (active + dir + N) % N;
  setActive(next);
  scrollToFlavorOf(order, next, true);
}

// Markanın gerçek ürün fotoğrafları: küçük resimler. 3B görünümü olan çekime tıklayınca sahnedeki
// ürün o modele döner (kapaksız şişe, kutusunda şişe, kutu…); olmayanlar büyük görünümde açılır.
function Gallery({ photos, views, hero = 0, name, label, tab }) {
  const [open, setOpen] = useState(null);
  const view = useStore((s) => s.view);
  const setView = useStore((s) => s.setView);
  const current = view ?? hero;
  const pick = (i) => {
    if (views && (views[i] || i === hero)) setView(i === hero ? null : i);
    else setOpen(i);
  };
  useEffect(() => {
    if (open == null) return;
    // Açıkken ok ve Esc tuşları yalnızca fotoğraflar arasında gezinir.
    const on = (e) => {
      if (!["Escape", "ArrowRight", "ArrowLeft"].includes(e.key)) return;
      e.stopPropagation();
      if (e.key === "Escape") setOpen(null);
      if (e.key === "ArrowRight") setOpen((i) => (i + 1) % photos.length);
      if (e.key === "ArrowLeft") setOpen((i) => (i - 1 + photos.length) % photos.length);
    };
    window.addEventListener("keydown", on, true);
    return () => window.removeEventListener("keydown", on, true);
  }, [open, photos.length]);
  return (
    <>
      <div className="gallery" aria-label={label}>
        <p className="gallery__label mono">{label}</p>
        <div className="gallery__row">
          {photos.slice(0, THUMBS).map((src, i) => (
            <button
              key={src}
              className={`gallery__thumb${views && current === i ? " is-on" : ""}${views?.[i] || (views && i === hero) ? " is-3d" : ""}`}
              tabIndex={tab}
              onClick={() => pick(i)}
              aria-label={`${name} ${i + 1}`}
              aria-pressed={views && (views[i] || i === hero) ? current === i : undefined}
            >
              {/* Yüklenemeyen görsel kırık simge göstermez, küçük kare gizlenir. */}
              <img src={assetUrl(src)} alt="" loading="lazy" onError={(e) => (e.currentTarget.parentElement.style.display = "none")} />
            </button>
          ))}
          {photos.length > THUMBS && (
            <button className="gallery__thumb gallery__more mono" tabIndex={tab} onClick={() => setOpen(THUMBS)} aria-label={`${name} +${photos.length - THUMBS}`}>
              +{photos.length - THUMBS}
            </button>
          )}
        </div>
      </div>
      {open != null &&
        createPortal(
        <div className="lightbox" role="dialog" aria-label={name} onClick={() => setOpen(null)}>
          <img src={assetUrl(photos[open])} alt={name} onClick={(e) => e.stopPropagation()} />
          <button className="round lightbox__close" onClick={() => setOpen(null)} aria-label="×">
            <Close />
          </button>
          <button className="round lightbox__prev" onClick={(e) => (e.stopPropagation(), setOpen((open - 1 + photos.length) % photos.length))} aria-label="‹">
            <Arrow dir="left" />
          </button>
          <button className="round lightbox__next" onClick={(e) => (e.stopPropagation(), setOpen((open + 1) % photos.length))} aria-label="›">
            <Arrow />
          </button>
          <p className="lightbox__count mono">
            {open + 1} / {photos.length}
          </p>
        </div>,
          document.body
        )}
    </>
  );
}

export function stepFeature(dir) {
  const { feature, setFeature } = useStore.getState();
  if (feature == null) return;
  setFeature((feature + dir + features.length) % features.length);
}

export default function DetailPanel() {
  const active = useStore((s) => s.active);
  const detail = useStore((s) => s.detail);
  const feature = useStore((s) => s.feature);
  const closeDetail = useStore((s) => s.closeDetail);
  const setFeature = useStore((s) => s.setFeature);
  const addToCart = useStore((s) => s.addToCart);
  // Yazı değişince önce eskisi yukarı kayıp çıkar, sonra yenisi harf harf gelir.
  const want = feature != null ? `f-${feature}` : `c-${active}`;
  const [shown, setShown] = useState({ key: want, feature, active });
  const [leaving, setLeaving] = useState(false);
  // Dokunmatik ekranlar için: seçilen içeriğin açıklaması çiplerin altında görünür.
  const [tip, setTip] = useState(null);
  useEffect(() => {
    if (want === shown.key) return;
    if (!detail) {
      setShown({ key: want, feature, active });
      return;
    }
    setLeaving(true);
    const id = setTimeout(() => {
      setShown({ key: want, feature, active });
      setLeaving(false);
    }, 320);
    return () => clearTimeout(id);
  }, [want, detail, feature, active, shown.key]);

  const t = useT();
  const { ui } = t;
  const f = t.flavor(shown.active);
  const ft = shown.feature != null ? t.features[shown.feature] : null;
  const tab = detail ? 0 : -1;
  const bodyClass = `detail__body${leaving ? " is-leaving" : ""}`;

  return (
    <div className={`detail${detail ? " is-open" : ""}`} aria-hidden={!detail} style={{ "--flavor": f.color }}>
      <button className="back" onClick={closeDetail} tabIndex={tab}>
        <span className="round"><Close /></span>
        <span className="mono">{ui.backToFlavors}</span>
      </button>

      {ft ? (
        <div className={bodyClass} key={shown.key + t.lang} data-lenis-prevent>
          <p className="strike">
            <span>{ft.kicker}</span>
            <span className="strike__x" aria-hidden="true">×</span>
            <s>{ft.struck}</s>
          </p>
          <h2 className="detail__title">
            <SplitChars text={ft.title} delay={80} />
          </h2>
          <p className="detail__desc">
            <SplitWords text={ft.text} delay={260} />
          </p>
          <p className="detail__notes mono">
            {pad(shown.feature + 1)} / {pad(features.length)}
          </p>
        </div>
      ) : (
        <div className={bodyClass} key={shown.key + t.lang} data-lenis-prevent>
          <p className="tag">
            <i className="dot" />
            N° {pad(shown.active + 1)} — {f.collection ? <span lang="en">{f.collection}</span> : t.brand.specs}
          </p>
          <h2 className={`detail__title${f.name.length > 32 ? " is-longer" : f.name.length > 20 ? " is-long" : ""}`}>
            <span className="detail__flavor" lang={termLang(f.name) ?? f.nameLang ?? t.nameLang}>
              <SplitChars text={f.name} delay={80} step={32} />
            </span>
          </h2>
          <p className="detail__desc">
            <SplitWords text={brief(f.description)} delay={420} />
          </p>
          <dl className="detail__meta mono">
            <div>
              <dt>{ui.family}</dt>
              <dd lang={termLang(f.family)}>{f.family}</dd>
            </div>
            {f.rating && (
              <div>
                <dt>{ui.rating}</dt>
                <dd>
                  <span className="stars" aria-hidden="true" style={{ "--r": f.rating.score / 5 }} /> {f.rating.score.toLocaleString(t.lang === "en" ? "en-US" : "tr-TR")} · {ui.reviews(f.rating.count)}
                </dd>
              </div>
            )}
            {f.perfumer && (
              <div>
                <dt>{ui.perfumer}</dt>
                <dd lang={/^[\x00-\x7F]+$/.test(f.perfumer) ? "en" : undefined}>{f.perfumer}</dd>
              </div>
            )}
            {f.year && (
              <div>
                <dt>{ui.year}</dt>
                <dd>{f.year}</dd>
              </div>
            )}
          </dl>
          {/* İçerik notu yoksa tek çip kategorinin tekrarı olur: gösterilmez. */}
          {!(f.notes.length === 1 && f.notes[0] === f.family) && (
          <ul className="chips detail__notes" aria-label={ui.notes}>
            {f.notes.map((n) => (
              <li
                key={n}
                data-tip={t.glossary[n]}
                tabIndex={t.glossary[n] ? 0 : undefined}
                className={tip === n ? "is-on" : undefined}
                onClick={() => t.glossary[n] && setTip(tip === n ? null : n)}
              >
                {n}
              </li>
            ))}
          </ul>
          )}
          {f.composition?.length > 0 && (
            <details className="detail__comp">
              <summary className="mono">{ui.composition}</summary>
              {/* Katmanlı nota listesi ("Üst: …", "Kalp: …") satır satır; düz liste tek satır. */}
              {f.composition.some((c) => c.includes(": ")) ? (
                <p className="detail__layers">
                  {f.composition.map((c) => {
                    const [k, v] = c.split(": ");
                    return (
                      <span key={c}>
                        <b>{k}</b> {v}
                      </span>
                    );
                  })}
                </p>
              ) : (
                <p>{f.composition.join(" · ")}</p>
              )}
            </details>
          )}
          {/* Tek fotoğraf sahnedeki 3B modelin aynısı: galeri yalnızca birden çok çekim varsa. */}
          {f.photos?.length > 1 && <Gallery photos={f.photos} views={f.views} hero={f.heroPhoto} name={f.name} label={ui.photos} tab={tab} />}
          {tip && t.glossary[tip] && f.notes.includes(tip) && (
            <p className="detail__tip">
              <b>{tip}</b> {t.glossary[tip]}
            </p>
          )}
          <div className="buy">
            <button className="pill" tabIndex={tab} onClick={() => addToCart(shown.active, DETAIL_PACK, "once")}>
              {t.showcase ? ui.addToCart : `${ui.pack(t.packLabel(DETAIL_PACK))} · ${t.money(t.price(DETAIL_PACK, "once", shown.active))}`}
            </button>
            {content.spray && flavors[shown.active]?.photo3d?.profile === "flask" && (
              <button className="hud__spray mono" tabIndex={tab} onClick={() => (sceneState.sprayReq = shown.active)} aria-label={ui.spray}>
                <SprayIcon />
                <span>{ui.spray}</span>
              </button>
            )}
            {/* Katalogu olan markalarda: aynı kategorideki diğer ürünler. Ana sayfada
                kategori sayfası açılır; kategori sayfasında detay kapanıp alttaki ürünlere inilir. */}
            {content.catalog ? (
              (() => {
                const cat = content.catalog.items.find((i) => i.product === flavors[shown.active]?.gid)?.category;
                if (!cat) return null;
                return PAGE.kind === "category" ? (
                  <button
                    className="buy__more mono"
                    tabIndex={tab}
                    onClick={() => {
                      closeDetail();
                      setTimeout(() => scrollToElement(document.querySelector(".catgrid")), 450);
                    }}
                  >
                    {ui.related} →
                  </button>
                ) : (
                  <a href={`#/urunler/${cat}`} className="buy__more mono" tabIndex={tab}>
                    {ui.related} →
                  </a>
                );
              })()
            ) : (
              PAGE.kind === "home" && (
                <a href="#shop" className="buy__more mono" tabIndex={tab}>
                  {ui.otherPacks}
                </a>
              )
            )}
          </div>
        </div>
      )}

      <div className="detail__nav">
        {ft ? (
          <>
            <button className="round" onClick={() => stepFeature(-1)} tabIndex={tab} aria-label={ui.prevFeature}>
              <Arrow dir="left" />
            </button>
            <button className="round" onClick={() => stepFeature(1)} tabIndex={tab} aria-label={ui.nextFeature}>
              <Arrow />
            </button>
            <button className="detail__reset mono" onClick={() => setFeature(null)} tabIndex={tab}>
              {ui.backToFlavor}
            </button>
          </>
        ) : (
          <>
            <button className="round" onClick={() => stepFlavor(-1)} tabIndex={tab} aria-label={ui.prevFlavor}>
              <Arrow dir="left" />
            </button>
            <span className="mono">
              {pad(active + 1)} / {pad(N)}
            </span>
            <button className="round" onClick={() => stepFlavor(1)} tabIndex={tab} aria-label={ui.nextFlavor}>
              <Arrow />
            </button>
          </>
        )}
      </div>

      <div className="features">
        <p className="features__hint mono">
          <span className="features__pulse" aria-hidden="true" />
          {ui.exploreCan(features.length)}
        </p>
        <ul aria-label={ui.whatsInside}>
          {t.features.map((item, i) => {
            const Icon = featureIcons[item.icon];
            const on = feature === i;
            return (
              <li key={item.icon} style={{ "--i": i }}>
                <button
                  className={`feat${on ? " is-on" : ""}`}
                  onClick={() => setFeature(on ? null : i)}
                  aria-pressed={on}
                  aria-label={item.short}
                  tabIndex={tab}
                >
                  <span className="feat__icon">
                    <Icon />
                  </span>
                  <span className="feat__text">
                    <span className="feat__num">{pad(i + 1)}</span>
                    <span className="feat__title">{item.short}</span>
                  </span>
                  <span className="feat__arrow" aria-hidden="true">
                    {on ? "×" : "→"}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <p className="drag-hint mono">{ui.drag}</p>
    </div>
  );
}
