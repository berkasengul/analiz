import { flavors } from "./data";

const N = flavors.length;
const ease = (t) => t * t * (3 - 2 * t);
const clamp01 = (v) => Math.min(1, Math.max(0, v));

// Scroll durumu düz bir nesnede; sahne her karede buradan okur.
export const scrollState = { p: 0 };

// Lenis örneği (azaltılmış hareket tercihinde null kalır).
export const smooth = { lenis: null };

function flavorsRange() {
  const el = document.getElementById("flavors");
  if (!el) return null;
  return { top: el.offsetTop, range: Math.max(1, el.offsetHeight - window.innerHeight) };
}

export function measureScroll() {
  const r = flavorsRange();
  if (!r) return;
  const t = clamp01((window.scrollY - r.top) / r.range) * (N - 1);
  const i = Math.floor(t);
  // Her tat bir süre yerinde dursun; geçiş aradaki bölümde olsun.
  const frac = ease(clamp01((t - i - 0.2) / 0.6));
  scrollState.p = Math.min(i + frac, N - 1);
}

export function scrollToFlavor(i, immediate = false) {
  const r = flavorsRange();
  if (!r) return;
  const y = r.top + (i / (N - 1)) * r.range;
  if (smooth.lenis) smooth.lenis.scrollTo(y, { immediate, force: true });
  else window.scrollTo({ top: y, behavior: immediate ? "instant" : "smooth" });
}

export function scrollToElement(el) {
  if (smooth.lenis) smooth.lenis.scrollTo(el);
  else el.scrollIntoView({ behavior: "smooth" });
}
