import { flavors } from "../data";
import { useT } from "../i18n";
import { useStore } from "../store";

const pad = (n) => String(n).padStart(2, "0");

// Sabitlenen bölüm: kaydırdıkça üç adım sırayla gelir, kutu sağda poz değiştirir.
export default function Ritual() {
  const step = useStore((s) => s.ritualStep);
  const t = useT();
  const { ui, ritual } = t;
  const r = ritual[step];

  return (
    <section id="ritual" className="ritual" style={{ height: `calc(100vh + ${(ritual.length - 1) * 90}vh)` }}>
      <div className="ritual__stage">
        <div className="ritual__text">
          <p className="mono section__eyebrow">{ui.ritual}</p>
          <div className="ritual__step" key={`${step}-${ui.ritual}`}>
            <p className="ritual__num">{pad(step + 1)}</p>
            <h2 className="section__title">{r.title}</h2>
            <p className="ritual__desc">{r.text}</p>
            <p className="mono ritual__can">
              <i className="dot" style={{ background: flavors[r.flavor].color }} />
              {ui.inCan}: <span lang={t.nameLang}>{t.flavor(r.flavor).name}</span>
            </p>
          </div>
          <ol className="ritual__progress" aria-label={ui.steps}>
            {ritual.map((s, i) => (
              <li key={s.title} className={i === step ? "is-active" : i < step ? "is-done" : ""}>
                <span className="mono">{pad(i + 1)}</span>
                {s.title}
              </li>
            ))}
          </ol>
        </div>
        <p className="ritual__stat" aria-hidden="true" key={`s-${step}`}>
          {r.stat}
        </p>
      </div>
    </section>
  );
}
