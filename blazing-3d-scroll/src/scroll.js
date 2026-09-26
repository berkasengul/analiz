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
  if (!flavorsEl || !ritualEl || !shopEl) return;

  const fr = flavorsEl.getBoundingClientRect();
  const range = Math.max(1, fr.height - vh);
  scrollState.p = Math.min(magnet(clamp01(-fr.top / range) * (N - 1)), N - 1);

  const rr = ritualEl.getBoundingClientRect();
  scrollState.ritualIn = ease(clamp01(1 - rr.top / vh));
  const steps = 3;
  scrollState.ritualStep = Math.min(magnet(clamp01(-rr.top / Math.max(1, rr.height - vh)) * (steps - 1)), steps - 1);

  const sr = shopEl.getBoundingClientRect();
  scrollState.shopIn = ease(clamp01(1 - sr.top / vh));
  const wide = window.innerWidth / vh >= 0.9;
  // Masaüstünde kutu mağaza bölümünün altı ekrana gelince, mobilde üstü
  // ekranın tepesini geçince bölümle birlikte yukarı kayar.
  scrollState.shopOut = Math.max(0, wide ? (vh - sr.bottom) / vh : -sr.top / vh);
  scrollState.sceneVisible = sr.bottom > 0;
  scrollState.velocity = smooth.lenis ? smooth.lenis.velocity : 0;
}

function yForFlavor(i) {
  const el = document.getElementById("flavors");
  const range = Math.max(1, el.offsetHeight - window.innerHeight);
  return el.offsetTop + (i / (N - 1)) * range;
}

export function scrollToFlavor(i, immediate = false) {
  const y = yForFlavor(i);
  if (smooth.lenis) smooth.lenis.scrollTo(y, { immediate, force: true, duration: 1.4 });
  else window.scrollTo({ top: y, behavior: immediate ? "instant" : "smooth" });
}

export function scrollToElement(el) {
  if (smooth.lenis) smooth.lenis.scrollTo(el, { duration: 1.8 });
  else el.scrollIntoView({ behavior: "smooth" });
}
