import { flavors } from "./data";

const N = flavors.length;
const ease = (t) => t * t * (3 - 2 * t);
const clamp01 = (v) => Math.min(1, Math.max(0, v));

// Scroll'dan türetilen sahne zaman çizelgesi. Sahne her karede buradan okur.
export const scrollState = {
  p: 0, // carousel'de kesirli tat indeksi
  ritualIn: 0, // Ritual bölümü ekrana girerken 0 → 1
  ritualStep: 0, // Ritual adımı, 0..2
  shopIn: 0, // Shop bölümü ekrana girerken 0 → 1
  shopOut: 0, // Shop yukarı kayarken, ekran yüksekliği cinsinden
  sceneVisible: true,
  velocity: 0,
};

export const smooth = { lenis: null };

const magnet = (t) => {
  const i = Math.floor(t);
  return i + ease(clamp01((t - i - 0.18) / 0.64));
};

export function measureScroll() {
  const vh = window.innerHeight;
  const flavorsEl = document.getElementById("flavors");
  const ritualEl = document.getElementById("ritual");
  const shopEl = document.getElementById("shop");
  if (!flavorsEl) return;

  const fr = flavorsEl.getBoundingClientRect();
  const range = Math.max(1, fr.height - vh);
  scrollState.p = Math.min(magnet(clamp01(-fr.top / range) * (N - 1)), N - 1);

  // Kategori sayfalarında Ritüel ve Mağaza yok: sahne akış bitince kaybolur.
  // Vitrin modunda (commerce.showcase) yalnızca Mağaza yok: Ritüel çalışır, sahne Ritüel bitince kaybolur.
  if (!ritualEl) {
    scrollState.ritualIn = scrollState.ritualStep = scrollState.shopIn = scrollState.shopOut = 0;
    scrollState.sceneVisible = fr.bottom > 0;
    scrollState.velocity = smooth.lenis ? smooth.lenis.velocity : 0;
    return;
  }
  const rr = ritualEl.getBoundingClientRect();
  scrollState.ritualIn = ease(clamp01(1 - rr.top / vh));
  const steps = 3;
  scrollState.ritualStep = Math.min(magnet(clamp01(-rr.top / Math.max(1, rr.height - vh)) * (steps - 1)), steps - 1);

  if (!shopEl) {
    scrollState.shopIn = scrollState.shopOut = 0;
    const ar = document.getElementById("all")?.getBoundingClientRect();
    scrollState.sceneVisible = rr.bottom > 0 && !(ar && ar.top <= 0 && ar.bottom >= vh);
    scrollState.velocity = smooth.lenis ? smooth.lenis.velocity : 0;
    return;
  }
  const sr = shopEl.getBoundingClientRect();
  scrollState.shopIn = ease(clamp01(1 - sr.top / vh));
  const wide = window.innerWidth / vh >= 0.9;
  // Masaüstünde kutu mağaza bölümünün altı ekrana gelince, mobilde üstü
  // ekranın tepesini geçince bölümle birlikte yukarı kayar.
  scrollState.shopOut = Math.max(0, wide ? (vh - sr.bottom) / vh : -sr.top / vh);
  // Ürün vitrini (#all, opak zemin) ekranı tamamen kaplarken arkadaki 3B sahne çizilmez: telefonda
  // kaydırma ve kartların açılması takılmasın.
  const ar = document.getElementById("all")?.getBoundingClientRect();
  const covered = !!ar && ar.top <= 0 && ar.bottom >= vh;
  scrollState.sceneVisible = sr.bottom > 0 && !covered;
  scrollState.velocity = smooth.lenis ? smooth.lenis.velocity : 0;
}

function yForFlavor(i) {
  const el = document.getElementById("flavors");
  const range = Math.max(1, el.offsetHeight - window.innerHeight);
  return el.offsetTop + (N > 1 ? i / (N - 1) : 0) * range;
}

export const slotIndex = (p) => ((Math.round(p) % N) + N) % N;

// Tatın şu an bulunduğu slota kaydırır.
export function scrollToFlavorOf(order, flavor, immediate = false) {
  scrollToFlavor(order.indexOf(flavor), immediate);
}

export function scrollToFlavor(i, immediate = false, onComplete) {
  const y = yForFlavor(i);
  if (smooth.lenis) {
    smooth.lenis.scrollTo(y, { immediate, force: true, duration: 1.2, onComplete });
  } else {
    window.scrollTo({ top: y, behavior: immediate ? "instant" : "smooth" });
    if (onComplete) setTimeout(onComplete, immediate ? 0 : 900);
  }
}

export function scrollToElement(el) {
  if (smooth.lenis) smooth.lenis.scrollTo(el, { duration: 1.8 });
  else el.scrollIntoView({ behavior: "smooth" });
}
