import { flavors } from "./data";

// Scroll durumu React state yerine düz bir nesnede tutulur;
// useFrame her karede buradan okur, gereksiz render olmaz.
export const scrollState = {
  section: 0, // 0..sections-1 arası kesirli değer
  flavor: 0, // 0..flavors.length-1 arası kesirli değer
};

const ease = (t) => t * t * (3 - 2 * t);
const clamp01 = (v) => Math.min(1, Math.max(0, v));

export function measureScroll() {
  const sections = document.querySelectorAll("[data-section]");
  const vh = window.innerHeight;
  const y = window.scrollY;

  let section = 0;
  sections.forEach((el, i) => {
    if (i === 0) return;
    // Bir sonraki bölümün üst kenarı ekranın tepesine gelmeden önceki
    // son 1 ekran yüksekliği boyunca geçiş yapılır. Böylece uzun
    // (sticky) bölümlerde kutu sabit kalır.
    const top = el.offsetTop;
    section += ease(clamp01((y - (top - vh)) / vh));
  });
  scrollState.section = section;

  const flavorEl = document.querySelector("[data-flavors]");
  if (flavorEl) {
    const range = flavorEl.offsetHeight - vh;
    const raw = clamp01((y - flavorEl.offsetTop) / range) * (flavors.length - 1);
    const i = Math.floor(raw);
    // Her tat bir süre sabit kalsın, geçiş ortada olsun.
    const frac = ease(clamp01((raw - i - 0.3) / 0.4));
    scrollState.flavor = Math.min(i + frac, flavors.length - 1);
  }
}
