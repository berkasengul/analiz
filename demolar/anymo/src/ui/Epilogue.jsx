import { useEffect, useMemo, useRef, useState } from "react";

import { HOME_SET, content } from "../data";
import { useT } from "../i18n";
import { THEME } from "../theme";

// Alt bölümlerin (hikâye, satış noktaları, SSS, iletişim) arkasındaki sahne: 3B vitrinin devamı.
// Ekrana sabitlenmiş bir "oda": ürünün renginde duvar, yavaşça akan ipek ışıklar, parlak zemin ve
// 3B sahnedeki fildişi kaide. Her bölümde kaideye başka bir ürün konur (vitrinde gösterilmeyenlerden
// başlayarak): bölüm değişince şişe sağa uçarak çıkar, yenisi soldan süzülüp kaideye iner, duvar onun
// rengine döner. Bölümün içeriği solda cam kartlarda durur.
// theme.epilogue === false ile kapanır (varsayılan: ferah sahne ve butik).
export const EPILOGUE = THEME.epilogue ?? (!!THEME.fresh || THEME.carousel === "dolly");

// Bölüm → şişenin tarafı ("none": geniş bölüm, şişe sahneden çekilir).
// Şişe hep sağda (yazılar solda, üstüne binmez); yeni şişe soldan süzülerek gelir.
const SIDES = { top: "right", story: "right", stockists: "none", faq: "right", contact: "right" };
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
  return list.map((i) => ({
    id: i.id, name: i.name, family: { tr: content.products[i.product]?.family, en: content.products[i.product]?.en?.family }, image: `${BASE}${i.image}`, gid: i.product, ...pal(i),
    // 3B sergi görseli (ürün kaidesiyle) ve ürünün sahne duvarı: varsa CSS kaide ve renk duvarı yerine.
    ...(i.exhibit ? { exhibit: `${BASE}${i.exhibit}` } : {}),
    ...(i.wall ? { wall: `${BASE}${i.wall}` } : {}),
  }));
}

export function EpilogueStage() {
  const { lang, ui } = useT();
  const list = useMemo(exhibits, []);
  const [state, setState] = useState({ k: 0, side: "right", prev: null });
  const last = useRef({ k: 0, side: "right" });

  useEffect(() => {
    if (!list.length) return;
    const ids = Object.keys(SIDES);
    const els = ids.map((id) => (id === "top" ? document.querySelector(".epilogue > .marquee") : document.getElementById(id))).filter(Boolean);
    // Ekranın ortasındaki bölüm (kesişme oranı uzun bölümde yanıltır: orta çizgiyi içeren bölüm seçilir).
    let raf = 0;
    const pick = () => {
      raf = 0;
      const mid = window.innerHeight * 0.5;
      const el = els.find((e) => {
        const r = e.getBoundingClientRect();
        return r.top <= mid && r.bottom > mid;
      });
      if (!el) return;
      const id = el.id || "top";
      const order = els.map((e) => e.id || "top").filter((x) => SIDES[x] !== "none");
      const side = SIDES[id] ?? "right";
      const k = side === "none" ? last.current.k : Math.max(0, order.indexOf(id)) % list.length;
      if (k === last.current.k && side === last.current.side) return;
      const changed = k !== last.current.k;
      setState({ k, side, prev: changed ? last.current.k : null });
      last.current = { k, side };
    };
    const on = () => raf || (raf = requestAnimationFrame(pick));
    window.addEventListener("scroll", on, { passive: true });
    window.addEventListener("resize", on);
    pick();
    return () => {
      window.removeEventListener("scroll", on);
      window.removeEventListener("resize", on);
      cancelAnimationFrame(raf);
    };
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
      {cur.wall && <div key={`w-${state.k}`} className="epi-photo" style={{ backgroundImage: `url(${cur.wall})` }} />}
      <div className="epi-silk">
        <i />
        <i />
        <i />
      </div>
      <div className="epi-floor" />
      <div className={`epi-exhibit${cur.exhibit ? " has-img" : ""}`}>
        <div className="epi-halo" />
        {prev && (
          <div key={`out-${state.prev}-${state.k}`} className="epi-bottle is-out">
            <img src={prev.exhibit ?? prev.image} alt="" />
          </div>
        )}
        <div key={`in-${state.k}`} className="epi-bottle is-in">
          <img src={cur.exhibit ?? cur.image} alt="" />
        </div>
        <div key={`puff-${state.k}`} className="epi-puff" />
        {!cur.exhibit && (
          <div className="epi-plinth">
            <span />
          </div>
        )}
        <p key={`cap-${state.k}`} className="epi-caption mono">
          <span>{ui.onPlinth ?? (lang === "en" ? "On the plinth" : "Kaidede")}</span>
          <strong lang="en">{cur.name[lang] ?? cur.name.tr}</strong>
          {(cur.family[lang] ?? cur.family.tr) && <em>{cur.family[lang] ?? cur.family.tr}</em>}
        </p>
      </div>
      <div className="epi-vignette" />
    </div>
  );
}
