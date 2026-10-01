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
  // Koku bulucu (#finder-seat varsa): Ritüel'deki şişe kaydırdıkça aşağıdaki kutunun kaidesine iner.
  finderIn: 0, // bölüm ekrana girerken 0 → 1
  finderTop: 2, // bölümün üst kenarı (ekran yüksekliği cinsinden)
  finderOn: false, // bölüm ekranda ve şişe kaidede (sonuç seçilmemiş)
  finderHold: true, // Finder: sonuç yokken true (şişe kaidede durur)
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
  measureFinder(vh);
  const steps = 3;
  scrollState.ritualStep = Math.min(magnet(clamp01(-rr.top / Math.max(1, rr.height - vh)) * (steps - 1)), steps - 1);

  if (!shopEl) {
    scrollState.shopIn = scrollState.shopOut = 0;
    const ar = document.getElementById("all")?.getBoundingClientRect();
    scrollState.sceneVisible = (rr.bottom > 0 || scrollState.finderOn) && !(ar && ar.top <= 0 && ar.bottom >= vh);
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
  scrollState.sceneVisible = (sr.bottom > 0 || scrollState.finderOn) && !covered;
  scrollState.velocity = smooth.lenis ? smooth.lenis.velocity : 0;
}

// Koku bulucu kaidesi (#finder-seat: Finder'da kaidenin üstündeki şişe kutusu). Bölüm ekrandayken
// 3B sahne odanın önüne, soru kartının arkasına alınır (html.finder-seat; css), fon bölümün üstünde kalır.
function measureFinder(vh) {
  const fe = document.getElementById("finder");
  // Sonuç seçilince (ya da sergi görselli markada) kaide çapası yoktur: şişe kaideye inmez.
  const seat = fe && document.getElementById("finder-seat");
  if (fe) {
    const r = fe.getBoundingClientRect();
    scrollState.finderTop = r.top / vh;
    scrollState.finderIn = ease(clamp01((vh - r.top) / (vh * 0.85)));
    scrollState.finderOn = !!seat && scrollState.finderHold && r.top < vh && r.bottom > 0;
  } else {
    scrollState.finderIn = 0;
    scrollState.finderOn = false;
  }
  document.documentElement.classList.toggle("finder-seat", scrollState.finderOn);
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
