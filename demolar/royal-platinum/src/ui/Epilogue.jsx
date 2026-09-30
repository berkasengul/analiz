import { useEffect, useMemo, useRef, useState } from "react";

import { HOME_SET, content } from "../data";
import { useT } from "../i18n";
import { chime, whoosh } from "../sound";
import { THEME } from "../theme";

// Alt bölümlerin (hikâye, satış noktaları, SSS, iletişim) arkasındaki sahne: 3B vitrinin devamı.
// Ekrana sabitlenmiş bir "oda": ürünün renginde duvar, yavaşça akan ipek ışıklar, parlak zemin ve
// 3B sahnedeki fildişi kaide. Her bölümde kaideye başka bir ürün konur (vitrinde gösterilmeyenlerden
// başlayarak): bölüm değişince şişe uçarak çıkar, yenisi kaideye iner, duvar onun rengine döner ve
// geçiş sesi çalar. Bölümün içeriği cam kartlarda, şişenin karşı tarafında durur.
// theme.epilogue === false ile kapanır (varsayılan: ferah sahne ve butik).
export const EPILOGUE = THEME.epilogue ?? (!!THEME.fresh || THEME.carousel === "dolly");

// Bölüm → şişenin tarafı ("none": geniş bölüm, şişe sahneden çekilir).
const SIDES = { top: "right", story: "right", stockists: "none", faq: "left", contact: "right" };
const BASE = import.meta.env.BASE_URL;

function exhibits() {
  const items = (content.catalog?.items ?? []).filter((i) => i.image && i.cutout !== false);
  const pal = (i) => {
    const t = i.product != null ? content.products[i.product]?.theme : null;
    return { glow: i.bg ?? t?.glow ?? "#6b4a3a", drop: i.bg2 ?? t?.drop ?? "#e8d8c8", edge: t?.edge ?? "#120c0a" };
  };
  const home = new Set(HOME_SET);
  // Önce ana sayfa vitrininde gösterilmeyen ürünler: ziyaretçi yeni kokular görsün.
  const rest = items.filter((i) => i.product == null || !home.has(i.product));
  const list = (rest.length >= 3 ? rest : items).slice();
  return list.map((i) => ({ id: i.id, name: i.name, family: { tr: content.products[i.product]?.family, en: content.products[i.product]?.en?.family }, image: `${BASE}${i.image}`, gid: i.product, ...pal(i) }));
}

export function EpilogueStage() {
  const { lang } = useT();
  const list = useMemo(exhibits, []);
  const [state, setState] = useState({ k: 0, side: "right", prev: null });
  const last = useRef({ k: 0, side: "right" });

  useEffect(() => {
    if (!list.length) return;
    const ids = Object.keys(SIDES);
    const els = ids.map((id) => (id === "top" ? document.querySelector(".epilogue > .marquee") : document.getElementById(id))).filter(Boolean);
    const io = new IntersectionObserver(
      (entries) => {
        const hit = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!hit) return;
        const id = hit.target.id || "top";
        const order = els.map((e) => e.id || "top").filter((x) => SIDES[x] !== "none");
        const side = SIDES[id] ?? "right";
        const k = side === "none" ? last.current.k : Math.max(0, order.indexOf(id)) % list.length;
        if (k === last.current.k && side === last.current.side) return;
        const changed = k !== last.current.k;
        setState({ k, side, prev: changed ? last.current.k : null });
        if (changed) {
          whoosh(k > last.current.k ? 1 : -1, 0.9);
          setTimeout(() => chime(list[k].gid ?? k, 0.9), 720);
        }
        last.current = { k, side };
      },
      { rootMargin: "-42% 0px -42% 0px", threshold: [0, 0.01] }
    );
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }, [list]);

  if (!list.length) return null;
  const cur = list[state.k];
  const prev = state.prev != null ? list[state.prev] : null;
  return (
    <div
      className={`epi-stage is-${state.side}`}
      aria-hidden="true"
      style={{ "--glow": cur.glow, "--drop": cur.drop, "--edge": cur.edge, "--plinth": THEME.plinthColor ?? "#f1ebe3" }}
    >
      <div className="epi-wall" />
      <div className="epi-silk">
        <i />
        <i />
        <i />
      </div>
      <div className="epi-floor" />
      <div className="epi-exhibit">
        <div className="epi-halo" />
        {prev && (
          <div key={`out-${state.prev}-${state.k}`} className="epi-bottle is-out">
            <img src={prev.image} alt="" />
          </div>
        )}
        <div key={`in-${state.k}`} className="epi-bottle is-in">
          <img src={cur.image} alt="" />
        </div>
        <div key={`puff-${state.k}`} className="epi-puff" />
        <div className="epi-plinth">
          <span />
        </div>
        <p key={`cap-${state.k}`} className="epi-caption mono">
          <span>{lang === "en" ? "On the plinth" : "Kaidede"}</span>
          <strong lang="en">{cur.name[lang] ?? cur.name.tr}</strong>
          {(cur.family[lang] ?? cur.family.tr) && <em>{cur.family[lang] ?? cur.family.tr}</em>}
        </p>
      </div>
      <div className="epi-vignette" />
    </div>
  );
}
