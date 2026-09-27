import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { content } from "../data";
import { useT } from "../i18n";
import { openProduct, catalogId } from "./Catalog";

// Ürün arama: üst menüdeki büyüteç, "/" ya da Ctrl/⌘+K ile açılır. Ad, kategori,
// içerik notları, açıklama ve hacimde arar; Türkçe harflere duyarsızdır
// ("gunes" → "Güneş"). Sonuca tıklayınca ürün 3B akışta açılır.
const C = content.catalog;
const BASE = import.meta.env.BASE_URL;

const fold = (s) =>
  String(s ?? "")
    .toLocaleLowerCase("tr")
    .replace(/[çğıöşüâîû]/g, (ch) => ({ ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u", â: "a", î: "i", û: "u" })[ch])
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");

function buildIndex() {
  return C.items.map((item) => {
    const cat = C.categories.find((c) => c.id === item.category);
    const p = item.product != null ? content.products[item.product] : null;
    const name = fold(`${item.name.tr} ${item.name.en ?? ""}`);
    const rest = fold(
      [
        cat?.name.tr,
        cat?.name.en,
        item.size,
        p?.family,
        p?.en?.family,
        p?.tagline,
        ...(p?.notes ?? []),
        ...(p?.en?.notes ?? []),
        item.desc.tr,
        item.desc.en,
      ].join(" ")
    );
    return { item, cat, name, rest };
  });
}

function rank(entry, words) {
  let score = 0;
  for (const w of words) {
    if (entry.name.startsWith(w)) score += 6;
    else if (entry.name.includes(` ${w}`)) score += 4;
    else if (entry.name.includes(w)) score += 3;
    else if (entry.rest.includes(w)) score += 1;
    else return 0;
  }
  return score;
}

// Eşleşen kısmı vurgular (Türkçe harfler katlanmış metin üzerinden bulunur).
function Mark({ text, words }) {
  const f = fold(text);
  if (f.length !== text.length || !words.length) return text;
  const hits = [];
  for (const w of words) {
    let i = f.indexOf(w);
    while (i >= 0 && w) {
      hits.push([i, i + w.length]);
      i = f.indexOf(w, i + w.length);
    }
  }
  if (!hits.length) return text;
  hits.sort((a, b) => a[0] - b[0]);
  const out = [];
  let at = 0;
  for (const [a, b] of hits) {
    if (a < at) continue;
    if (a > at) out.push(text.slice(at, a));
    out.push(<mark key={a}>{text.slice(a, b)}</mark>);
    at = b;
  }
  out.push(text.slice(at));
  return out;
}

export function SearchButton() {
  const { ui } = useT();
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const key = (e) => {
      const typing = /input|textarea|select/i.test(e.target.tagName) || e.target.isContentEditable;
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !typing)) {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);
  if (!C) return null;
  return (
    <>
      <button className="search-btn" onClick={() => setOpen(true)} aria-label={ui.search} aria-haspopup="dialog">
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
          <circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
          <path d="m15.5 15.5 4.5 4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </button>
      {open && createPortal(<SearchPanel onClose={() => setOpen(false)} />, document.body)}
    </>
  );
}

function SearchPanel({ onClose }) {
  const t = useT();
  const { ui, lang } = t;
  const index = useMemo(buildIndex, []);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState(null);
  const [active, setActive] = useState(0);
  const [closing, setClosing] = useState(false);
  const input = useRef(null);
  const list = useRef(null);

  const words = useMemo(() => fold(q).split(/\s+/).filter(Boolean), [q]);
  const results = useMemo(() => {
    const pool = cat ? index.filter((e) => e.item.category === cat) : index;
    if (!words.length) {
      // Boş aramada öne çıkanlar: ana sayfadaki ürünler, sonra her kategoriden biri.
      const home = (content.home ?? []).map(Number);
      const featured = home.map((g) => pool.find((e) => e.item.product === g)).filter(Boolean);
      return (cat ? pool : [...featured, ...pool.filter((e) => !featured.includes(e))]).slice(0, cat ? 40 : 8);
    }
    return pool
      .map((e) => [e, rank(e, words)])
      .filter(([, s]) => s > 0)
      .sort((a, b) => b[1] - a[1])
      .map(([e]) => e)
      .slice(0, 40);
  }, [index, words, cat]);

  useEffect(() => setActive(0), [q, cat]);
  useEffect(() => {
    input.current?.focus();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => (document.body.style.overflow = prev);
  }, []);
  useEffect(() => {
    list.current?.querySelector(".is-active")?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const close = () => {
    setClosing(true);
    setTimeout(onClose, 260);
  };
  const pick = (entry) => {
    close();
    setTimeout(() => openProduct(entry.item), 280);
  };
  const onKey = (e) => {
    e.stopPropagation();
    if (e.key === "Escape") close();
    else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter" && results[active]) pick(results[active]);
  };

  return (
    <div className={`search${closing ? " is-closing" : ""}`} role="dialog" aria-modal="true" aria-label={ui.search} onKeyDown={onKey}>
      <div className="search__scrim" onClick={close} />
      <div className="search__panel">
        <div className="search__field">
          <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
            <circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.4" />
            <path d="m15.5 15.5 4.5 4.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
          <input
            ref={input}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={ui.searchPlaceholder}
            aria-label={ui.search}
            aria-controls="search-results"
            aria-activedescendant={results[active] ? `sr-${results[active].item.id}` : undefined}
            autoComplete="off"
            spellCheck="false"
            enterKeyHint="search"
          />
          {q && (
            <button className="search__clear mono" onClick={() => (setQ(""), input.current.focus())}>
              {ui.searchClear}
            </button>
          )}
          <button className="search__close" onClick={close} aria-label={ui.close}>
            <kbd className="search__esc">Esc</kbd>
            <svg className="search__x" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="search__cats" role="group" aria-label={ui.categories}>
          {[{ id: null, name: { tr: ui.all, en: ui.all }, color: C.glow }, ...C.categories].map((c) => (
            <button key={c.id ?? "all"} className={cat === c.id ? "is-on" : ""} style={{ "--c": c.color }} aria-pressed={cat === c.id} onClick={() => setCat(c.id)}>
              {c.name[lang] ?? c.name.tr}
            </button>
          ))}
        </div>

        <p className="search__meta mono" aria-live="polite">
          {words.length ? ui.searchResults(results.length) : cat ? ui.itemsCount(results.length) : ui.searchPopular}
        </p>

        <ul className="search__list" id="search-results" ref={list} role="listbox" data-lenis-prevent>
          {results.map((e, i) => {
            const name = e.item.name[lang] ?? e.item.name.tr;
            return (
              <li key={e.item.id} style={{ "--i": Math.min(i, 12), "--c": e.item.color ?? e.cat?.color }}>
                <button
                  id={`sr-${e.item.id}`}
                  role="option"
                  aria-selected={i === active}
                  className={`search__item${i === active ? " is-active" : ""}`}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => pick(e)}
                  tabIndex={-1}
                >
                  <span className="search__thumb" aria-hidden="true">
                    {e.item.image && <img src={BASE + e.item.image} alt="" loading="lazy" />}
                  </span>
                  <span className="search__text">
                    <span className="search__name">
                      <Mark text={name} words={words} />
                    </span>
                    <span className="search__sub mono">
                      {e.cat?.name[lang] ?? e.cat?.name.tr}
                      {e.item.size ? ` · ${e.item.size}` : ""}
                    </span>
                  </span>
                  <span className="search__price">
                    {t.money(t.price(1, "once", catalogId(e.item.id)))}
                    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                      <path d="M5 12h13M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        {words.length > 0 && results.length === 0 && (
          <div className="search__empty">
            <p className="search__emptyTitle">{ui.searchEmpty(q)}</p>
            <a href="#/urunler" onClick={close} className="search__emptyLink">
              {ui.exploreAll} →
            </a>
          </div>
        )}

        <p className="search__keys mono" aria-hidden="true">
          <span><kbd>↑</kbd><kbd>↓</kbd> {ui.searchMove}</span>
          <span><kbd>Enter</kbd> {ui.searchOpen}</span>
          <span><kbd>Esc</kbd> {ui.close}</span>
        </p>
      </div>
    </div>
  );
}
