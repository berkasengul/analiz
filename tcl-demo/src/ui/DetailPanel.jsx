import { useEffect, useState } from "react";

import { features, flavors, money, packLabel, packPrice } from "../data";
import { scrollToFlavorOf } from "../scroll";
import { useStore } from "../store";
import { Arrow, Close, featureIcons } from "../Icons";
import { SplitChars, SplitWords } from "./Split";
import { brand } from "../brand";

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

  const f = flavors[shown.active];
  const ft = shown.feature != null ? features[shown.feature] : null;
  const tab = detail ? 0 : -1;
  const bodyClass = `detail__body${leaving ? " is-leaving" : ""}`;

  return (
    <div className={`detail${detail ? " is-open" : ""}`} aria-hidden={!detail} style={{ "--flavor": f.color }}>
      <button className="back" onClick={closeDetail} tabIndex={tab}>
        <span className="round"><Close /></span>
        <span className="mono">Tatlara dön</span>
      </button>

      {ft ? (
        <div className={bodyClass} key={shown.key}>
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
        <div className={bodyClass} key={shown.key}>
          <p className="tag">
            <i className="dot" />
            N° {pad(shown.active + 1)} — {brand.specs}
          </p>
          <h2 className="detail__title">
            <span className="detail__flavor" lang="en">
              <SplitChars text={f.name} delay={80} step={32} />
            </span>
          </h2>
          <p className="detail__desc">
            <SplitWords text={f.description} delay={420} />
          </p>
          <ul className="chips detail__notes" aria-label="Notalar">
            {f.notes.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
          <div className="buy">
            <button className="pill" tabIndex={tab} onClick={() => addToCart(shown.active, 12, "once")}>
              {packLabel(12)} paket · {money(packPrice(12, "once"))}
            </button>
            <a href="#shop" className="buy__more mono" tabIndex={tab}>
              Diğer paketler
            </a>
          </div>
        </div>
      )}

      <div className="detail__nav">
        {ft ? (
          <>
            <button className="round" onClick={() => stepFeature(-1)} tabIndex={tab} aria-label="Önceki özellik">
              <Arrow dir="left" />
            </button>
            <button className="round" onClick={() => stepFeature(1)} tabIndex={tab} aria-label="Sonraki özellik">
              <Arrow />
            </button>
            <button className="detail__reset mono" onClick={() => setFeature(null)} tabIndex={tab}>
              Tat bilgisine dön
            </button>
          </>
        ) : (
          <>
            <button className="round" onClick={() => stepFlavor(-1)} tabIndex={tab} aria-label="Önceki tat">
              <Arrow dir="left" />
            </button>
            <span className="mono">
              {pad(active + 1)} / {pad(N)}
            </span>
            <button className="round" onClick={() => stepFlavor(1)} tabIndex={tab} aria-label="Sonraki tat">
              <Arrow />
            </button>
          </>
        )}
      </div>

      <div className="features">
        <p className="features__hint mono">
          <span className="features__pulse" aria-hidden="true" />
          Kutuyu keşfet · {features.length} hikâye
        </p>
        <ul aria-label="İçinde ne var">
          {features.map((item, i) => {
            const Icon = featureIcons[item.icon];
            const on = feature === i;
            return (
              <li key={item.short} style={{ "--i": i }}>
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

      <p className="drag-hint mono">Kutuyu çevirmek için sürükle</p>
    </div>
  );
}
