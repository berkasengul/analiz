import { content } from "./data";

// Markaya özgü sahne kimliği (content.json → theme). Hepsi isteğe bağlı; theme yoksa
// şablonun varsayılan görünümü kalır.
//   name        "portal" gibi bir ad: <html data-theme> olur, CSS bu adla özelleşir
//   fonts       { href, display, serif, sans }: Google Fonts bağlantısı ve yazı ailesi
//   accent      vurgu rengi (altın vb.): arayüz ve parçacıklar
//   particles   "gold": altın toz (varsayılan: buz/kül)
//   numerals    { font }: kokunun numarası sahnede dev ve ince bir sayı olarak durur
//   intro       "portal": açılışta kapı çizilir ve açılarak sahneyi gösterir
export const THEME = content.theme ?? {};

export function applyTheme() {
  const root = document.documentElement;
  if (THEME.name) root.dataset.theme = THEME.name;
  if (THEME.accent) root.style.setProperty("--theme-accent", THEME.accent);
  const f = THEME.fonts;
  if (f?.href && !document.querySelector(`link[href="${f.href}"]`)) {
    const l = document.createElement("link");
    l.rel = "stylesheet";
    l.href = f.href;
    document.head.appendChild(l);
  }
  if (f?.display) root.style.setProperty("--wide", f.display);
  if (f?.serif) root.style.setProperty("--serif", f.serif);
  if (f?.sans) {
    root.style.setProperty("--sans", f.sans);
    root.style.setProperty("--mono", f.sans);
  }
}

// Ürün adındaki numara ("No/3 Ambre" → "3"); yoksa null.
export const numeralOf = (name = "") => name.match(/No\s*\/?\s*(\d{1,2})\b/i)?.[1] ?? null;
