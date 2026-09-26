import { useEffect, useState } from "react";

import { DETAIL_PACK, features, flavors } from "../data";
import { useT } from "../i18n";
import { scrollToFlavorOf } from "../scroll";
import { useStore } from "../store";
import { Arrow, Close, featureIcons } from "../Icons";
import { SplitChars, SplitWords } from "./Split";

const N = flavors.length;
const pad = (n) => String(n).padStart(2, "0");

export function stepFlavor(dir) {
  const { active, order, setActive } = useStore.getState();
  const next = (active + dir + N) % N;
  setActive(next);
  scrollToFlavorOf(order, next, true);
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
        <div className={bodyClass} key={shown.key + t.lang}>
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
        <div className={bodyClass} key={shown.key + t.lang}>
          <p className="tag">
            <i className="dot" />
            N° {pad(shown.active + 1)} — {f.collection ? <span lang="en">{f.collection}</span> : t.brand.specs}
          </p>
          <h2 className="detail__title">
            <span className="detail__flavor" lang="en">
              <SplitChars text={f.name} delay={80} step={32} />
            </span>
          </h2>
          <p className="detail__desc">
            <SplitWords text={f.description} delay={420} />
          </p>
          <dl className="detail__meta mono">
            <div>
              <dt>{ui.family}</dt>
              <dd>{f.family}</dd>
            </div>
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
          {tip && t.glossary[tip] && f.notes.includes(tip) && (
            <p className="detail__tip">
              <b>{tip}</b> {t.glossary[tip]}
            </p>
          )}
          <div className="buy">
            <button className="pill" tabIndex={tab} onClick={() => addToCart(shown.active, DETAIL_PACK, "once")}>
              {ui.pack(t.packLabel(DETAIL_PACK))} · {t.money(t.price(DETAIL_PACK, "once"))}
            </button>
            <a href="#shop" className="buy__more mono" tabIndex={tab}>
              {ui.otherPacks}
            </a>
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
