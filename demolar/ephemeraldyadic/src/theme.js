import { content } from "./data";

// Markaya özgü sahne kimliği (content.json → theme). Hepsi isteğe bağlı; theme yoksa
// şablonun varsayılan görünümü kalır.
//   name        "portal" gibi bir ad: <html data-theme> olur, CSS bu adla özelleşir
//   fonts       { href, display, serif, sans }: Google Fonts bağlantısı ve yazı ailesi
//   accent      vurgu rengi (altın vb.): arayüz ve parçacıklar
//   particles   "gold": altın toz, "dust": ince toz, "none": yok (varsayılan: buz/kül)
//   numerals    { font }: kokunun numarası sahnede dev ve ince bir sayı olarak durur
//   intro       "mark": sade ve hızlı açılış (logo + ince yükleme çizgisi), oturumda bir kez
//   decor       { niche, pattern, shape }: premium duvar (kemerli ya da dikdörtgen niş, altın yıldız deseni, mermer ve altın kaide)
export const THEME = content.theme ?? {};

export function applyTheme() {
  const root = document.documentElement;
  if (THEME.name) root.dataset.theme = THEME.name;
  // Vitrin modu (content.commerce.showcase): sepet düğmesi ve boş fiyat alanları gizlenir.
  if (content.commerce?.showcase) root.classList.add("showcase");
  if (THEME.accent) root.style.setProperty("--theme-accent", THEME.accent);
  // theme.brightWalls: aydınlık sahne duvarları (tat bulucu, alt bölümler) karartılmadan gösterilir.
  if (THEME.brightWalls) root.classList.add("bright-walls");
  // theme.decor: 3B sahnedeki kemerli niş, altın desen ve mermer kaide koleksiyon kartlarında, koku bulucuda ve
  // alt bölümlerin sahnesinde de (css/base.css → html.decor).
  if (THEME.decor) {
    root.classList.add("decor");
    // Niş şekli: "arch" (sivri kemer, varsayılan) ya da "rect" (ince altın çerçeveli dikey ışık panosu); desen isteğe bağlı.
    if (THEME.decor.niche !== false) root.classList.add(THEME.decor.shape === "rect" ? "decor-rect" : "decor-arch");
    if (THEME.decor.pattern !== false) root.classList.add("decor-pattern");
  }
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
