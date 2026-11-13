import { useEffect, useRef, useState } from "react";

import { HOME_SET, content, flavors } from "../data";
import { useT } from "../i18n";
import { scrollState } from "../scroll";
import { sceneState } from "../shared";

// Nota piramidi (content.theme.pyramid): Ritüel'deki şişe kaydırdıkça bu bölümün ortasındaki yuvaya iner
// (#pyramid-seat; HeroCan), bölüm boyunca katmanlarına ayrılır — kapak, üst, kalp, dip — ve her katmanın
// yanında notaları yazar; bölüm biterken şişe birleşip aşağıdaki koku bulucunun kaidesine iner.
// 3B çizimi ana sahne yapar (HeroCan → Slices); bu bölüm yalnızca yazıları ve yuvayı taşır. Dilimlerin ekrandaki
// yeri sceneState.pyramid.labels'tan okunur. Notalar ürünün nota piramidinden (products[].composition:
// "Üst: …", "Kalp: …", "Dip: …"), yoksa notaları üçe bölünür.
export const PYRAMID = !!content.theme?.pyramid;

function layersOf(gid, lang) {
  const p = content.products[gid] ?? {};
  const comp = (lang === "en" ? p.en?.composition : null) ?? p.composition ?? [];
  const rows = comp.map((l) => /^([^:]{2,24}):\s*(.+)$/.exec(l)).filter(Boolean);
  if (rows.length >= 3) return rows.slice(0, 3).map((m) => ({ title: m[1].trim(), notes: m[2].split(/\s*,\s*/) }));
  const notes = (lang === "en" ? p.en?.notes : null) ?? p.notes ?? [];
  const n = Math.max(1, Math.ceil(notes.length / 3));
  const names = lang === "en" ? ["Top", "Heart", "Base"] : ["Üst", "Kalp", "Dip"];
  return names.map((title, i) => ({ title, notes: notes.slice(i * n, i * n + n) }));
}

export default function NotePyramid() {
  const { ui, lang, flavor: flavorText } = useT();
  const en = lang === "en";
  const labels = useRef([]);
  const [shown, setShown] = useState(null);
  const choices = HOME_SET.map((g) => flavors.findIndex((x) => x.gid === g)).filter((i) => i >= 0);
  const picked = useRef(-1e9);
  useEffect(() => {
    let raf;
    let last = null;
    // Bölüm ekrandayken şişe bütünse (açılmadan önce ya da birleştikten sonra) kokular kendiliğinden sırayla
    // değişir; sahnenin rengi de onunla geçer. Kullanıcı bir kokuyu seçince bir süre o kokuda kalır.
    let shownAt = performance.now();
    const tick = () => {
      const now = performance.now();
      const P0 = sceneState.pyramid;
      if (scrollState.pyrOn && scrollState.pyrIn > 0.9 && (P0?.e ?? 0) < 0.02 && choices.length > 1 && now - picked.current > 12000 && now - shownAt > 4500) {
        const cur = scrollState.pyrFlavor ?? P0?.flavor ?? choices[0];
        scrollState.pyrFlavor = choices[(choices.indexOf(cur) + 1) % choices.length];
        shownAt = now;
      }
      if (!scrollState.pyrOn) shownAt = now;
      const P = sceneState.pyramid;
      if (P) {
        if (P.flavor !== last) {
          last = P.flavor;
          setShown(P.flavor);
        }
        for (let k = 0; k < 4; k++) {
          const el = labels.current[k];
          const L = P.labels[k];
          if (!el || !L) continue;
          // Katmanlar sırayla belirir (kapak önce), birleşirken birlikte kaybolur.
          // Her katmanın yazısı kendi dilimi açılırken belirir.
          el.style.opacity = String(Math.min(1, Math.max(0, ((L.e ?? P.e) - 0.35) / 0.45)));
          el.style.transform = `translate(${L.x}px, ${L.y}px) translate(${L.side < 0 ? "-100%" : "0"}, -50%)`;
          el.classList.toggle("is-left", L.side < 0);
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  const gid = shown != null ? flavors[shown]?.gid : null;
  const f = shown != null ? flavorText(shown) : null;
  const layers = gid != null ? layersOf(gid, lang) : [];
  return (
    <section id="pyramid" className="pyr">
      <div className="pyr__stage">
        <header className="pyr__head">
          <p className="mono section__eyebrow">{ui.pyramidEyebrow ?? (en ? "Fragrance pyramid" : "Nota piramidi")}</p>
          <h2 className="section__title">{f?.name ?? ""}</h2>
          <p className="pyr__hint">{ui.pyramidHint ?? (en ? "Keep scrolling: the bottle opens layer by layer." : "Kaydırmaya devam edin: şişe katman katman açılsın.")}</p>
        </header>
        <div id="pyramid-seat" className="pyr__seat" aria-hidden="true" />
        <div className="pyr__labels" aria-hidden={!f}>
          {[0, 1, 2, 3].map((k) => (
            <div key={k} ref={(el) => (labels.current[k] = el)} className="pyr__label" style={{ opacity: 0 }}>
              {k === 0 ? (
                <>
                  <span className="pyr__k mono">{f?.family}</span>
                  <strong>{f?.name}</strong>
                </>
              ) : (
                <>
                  <span className="pyr__k mono">{layers[k - 1]?.title}</span>
                  <strong>{layers[k - 1]?.notes.join(" · ")}</strong>
                </>
              )}
            </div>
          ))}
        </div>
        {choices.length > 1 && (
          <div className="pyr__chips" role="tablist" aria-label={en ? "Fragrance" : "Koku"}>
            {choices.map((i) => (
              <button key={i} role="tab" aria-selected={i === shown} className={`pyr__chip${i === shown ? " is-on" : ""}`} onClick={() => ((scrollState.pyrFlavor = i), (picked.current = performance.now()))}>
                {flavorText(i).name}
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
