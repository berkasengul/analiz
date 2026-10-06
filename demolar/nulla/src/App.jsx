import { useCallback, useEffect, useRef, useState } from "react";
import Lenis from "lenis";

import Scene from "./Scene";
import { HIDDEN, PAGE, SET_KEY, SHOWCASE, content, features, flavors, setKey } from "./data";
import { measureScroll, scrollState, scrollToElement, scrollToFlavor, scrollToFlavorOf, smooth } from "./scroll";
import { startSound } from "./sound";
import { useStore } from "./store";
import { THEME } from "./theme";

import CartDrawer from "./ui/CartDrawer";
import DetailPanel, { stepFeature, stepFlavor } from "./ui/DetailPanel";
import FlavorHud from "./ui/FlavorHud";
import SprayNote from "./ui/SprayNote";
import Header from "./ui/Header";
import Menu from "./ui/Menu";
import Preloader from "./ui/Preloader";
import Ritual from "./ui/Ritual";
import { Faq, Footer, Marquee, Stockists, Story } from "./ui/Sections";
import Shop from "./ui/Shop";
import { EPILOGUE, EpilogueStage } from "./ui/Epilogue";
import BrandCloth, { CLOTH } from "./ui/BrandCloth";
import NotePyramid, { PYRAMID } from "./ui/NotePyramid";
import Finder, { FINDER } from "./ui/Finder";
import Discovery, { DISCOVERY } from "./ui/Discovery";
import { CatalogPage, CategoryBar, CategoryGrid, CollectionGrid } from "./ui/Catalog";

const N = flavors.length;

// Masaüstünde fare tekerleği / dokunmatik yüzeyle ürün ürün geçiş (theme.paging; "dolly" butikte açık):
// tek kaydırma hareketi sıradaki ürünü doğrudan ortaya getirir, iki ürün arasında kalınmaz. Bir hareketin
// ardından gelen atalet olayları yutulur; son üründen sonra (ilkinden önce) sayfa doğal akar.
const PAGING = THEME.paging ?? THEME.carousel === "dolly";
const wheel = { at: 0, acc: 0, stepped: false, lockUntil: 0, target: -1 };
function pagingWheel(e) {
  if (!PAGING || N < 2 || e.ctrlKey) return false;
  const s = useStore.getState();
  if (s.detail || s.menu || s.cartOpen || !s.loaded || s.swapping) return false;
  if (e.target?.closest?.("[data-lenis-prevent]")) return false;
  const el = document.getElementById("flavors");
  const range = el ? el.offsetHeight - window.innerHeight : 0;
  if (range <= 0) return false;
  const now = performance.now();
  const busy = now < wheel.lockUntil;
  const raw = ((window.scrollY - el.offsetTop) / range) * (N - 1);
  if (!busy && (raw < -0.02 || raw > N - 1 + 0.02)) return false;
  const dy = e.deltaMode === 1 ? e.deltaY * 40 : e.deltaY;
  const dir = Math.sign(dy);
  if (!dir) return false;
  // Yeni hareket: önceki olaydan beri kısa bir sessizlik var ya da yön değişti.
  const fresh = now - wheel.at > 140 || Math.sign(wheel.acc) !== dir;
  wheel.at = now;
  if (fresh) {
    wheel.acc = 0;
    wheel.stepped = false;
  }
  wheel.acc += dy;
  const cur = busy ? wheel.target : Math.round(raw);
  // Uçlarda (yeni bir hareketle) doğal kaydırma: alt bölümlere iner ya da sayfa başına çıkar.
  if (!busy && !wheel.stepped && ((dir > 0 && cur >= N - 1) || (dir < 0 && cur <= 0))) return false;
  e.preventDefault();
  if (busy || wheel.stepped || Math.abs(wheel.acc) < 24) return true;
  const next = Math.max(0, Math.min(N - 1, cur + dir));
  wheel.stepped = true;
  wheel.target = next;
  wheel.lockUntil = now + 1150;
  scrollToFlavor(next);
  return true;
}

function useSmoothScroll() {
  const handleScroll = useCallback(() => {
    measureScroll();
    const s = useStore.getState();
    const idx = Math.round(scrollState.p);
    const flavor = s.order[((idx % s.order.length) + s.order.length) % s.order.length];
    if (flavor !== s.active) s.setActive(flavor);
    // Carousel iki tat arasındayken başlık gizlenir, durunca harf harf gelir.
    const moving = Math.abs(scrollState.p - idx) > 0.04;
    if (moving !== s.moving) s.setMoving(moving);
    const step = Math.round(scrollState.ritualStep);
    if (step !== s.ritualStep) s.setRitualStep(step);
  }, []);

  // Kaydırma durunca carousel iki ürün arasında kalmaz: en yakın ürüne süzülür.
  const snapTimer = useRef(0);
  const snap = useCallback(() => {
    const s = useStore.getState();
    const el = document.getElementById("flavors");
    if (!el || s.detail || !s.loaded || s.menu || s.cartOpen || s.swapping || N < 2) return;
    const L = smooth.lenis;
    // Kaydırma hâlâ sürüyorsa (yavaş cihazda kareler seyrek gelebilir) bekle.
    if (L?.isScrolling) return void (snapTimer.current = setTimeout(snap, 150));
    const range = el.offsetHeight - window.innerHeight;
    if (range <= 0) return;
    const y = L ? L.targetScroll : window.scrollY;
    const raw = ((y - el.offsetTop) / range) * (N - 1);
    if (raw < 0.02 || raw > N - 1 - 0.02) return;
    // Kullanıcının kaydırdığı yöne oturur: ileri doğru biraz itmek sonraki ürüne
    // geçirir, hiçbir zaman kullanıcıyı geldiği yere geri çekmez.
    const dir = L?.direction ?? 0;
    const idx = dir > 0 ? Math.ceil(raw - 0.1) : dir < 0 ? Math.floor(raw + 0.1) : Math.round(raw);
    if (Math.abs(raw - idx) > 0.02) scrollToFlavor(Math.min(N - 1, Math.max(0, idx)));
  }, []);
  const queueSnap = useCallback(() => {
    clearTimeout(snapTimer.current);
    snapTimer.current = setTimeout(snap, window.matchMedia("(pointer: coarse)").matches ? 450 : 380);
  }, [snap]);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // Düşük lerp = daha ağır, film gibi süzülen kaydırma.
    smooth.lenis = reduce ? null : new Lenis({
          autoRaf: true,
          lerp: 0.07,
          wheelMultiplier: 0.9,
          // Ürün akışında tekerlek ürün ürün ilerletir (pagingWheel); Lenis o olayı kaydırmaz.
          virtualScroll: (d) => !(d.event.type === "wheel" && pagingWheel(d.event)),
        });
    smooth.lenis?.on("scroll", handleScroll);
    smooth.lenis?.on("scroll", queueSnap);

    const onClick = (e) => {
      const a = e.target.closest("a[href^='#']");
      // "#/..." sayfa bağlantılarıdır (ör. #/urunler); tarayıcı hash'i değiştirir.
      if (!a || a.getAttribute("href").startsWith("#/")) return;
      // Kategori sayfasında ana sayfa bölümlerine giden bağlantılar ana sayfayı açar.
      if (PAGE.kind === "category" && !a.closest(".stage")) return;
      const el = document.querySelector(a.getAttribute("href"));
      if (!el) return;
      e.preventDefault();
      const s = useStore.getState();
      s.setMenu(false);
      s.setCartOpen(false);
      s.closeDetail();
      scrollToElement(el);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);
    document.addEventListener("click", onClick);
    handleScroll();

    return () => {
      smooth.lenis?.destroy();
      smooth.lenis = null;
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
      document.removeEventListener("click", onClick);
    };
  }, [handleScroll, queueSnap]);

  // Detay, menü, sepet açıkken ya da açılış bitmeden sayfa kaymasın.
  const locked = useStore((s) => s.detail || s.menu || s.cartOpen || !s.loaded);
  useEffect(() => {
    if (!smooth.lenis) {
      document.documentElement.style.overflow = locked ? "hidden" : "";
      return;
    }
    locked ? smooth.lenis.stop() : smooth.lenis.start();
  }, [locked]);
}

// Telefonda ürün akışı sayfa sayfa: her kaydırma hareketi tam bir ürün ileri ya da geri götürür,
// iki ürün arasında takılı kalınmaz. Son üründen sonra sayfa doğal kaydırmayla alt bölümlere iner.
function useTouchPaging() {
  useEffect(() => {
    if (!window.matchMedia("(pointer: coarse)").matches || N < 2) return;
    let t = null;
    let last = { idx: -1, at: -1e9 }; // hâlâ kayan bir geçiş varsa yeni hareket onun hedefinden sayılır
    const where = () => {
      const el = document.getElementById("flavors");
      if (!el) return null;
      const range = el.offsetHeight - window.innerHeight;
      if (range <= 0) return null;
      return ((window.scrollY - el.offsetTop) / range) * (N - 1);
    };
    const onStart = (e) => {
      const s = useStore.getState();
      t = null;
      if (e.touches.length !== 1 || s.detail || s.menu || s.cartOpen || !s.loaded || e.target.closest?.("[data-lenis-prevent]")) return;
      const raw = where();
      if (raw == null || raw < -0.05 || raw > N - 1 + 0.02) return;
      const busy = performance.now() - last.at < 1000;
      const idx = busy ? last.idx : Math.max(0, Math.min(N - 1, Math.round(raw)));
      t = { y: e.touches[0].clientY, idx, raw: busy ? idx : raw, held: false };
    };
    const onMove = (e) => {
      if (!t) return;
      const dy = t.y - e.touches[0].clientY;
      if (!t.held && Math.abs(dy) < 6) return;
      // Son üründe ileri, ilk üründe geri kaydırma doğal akar (alt bölümlere / sayfa başına).
      // (Adres çubuğu açılıp kapanınca ekran yüksekliği değişir; konuma değil ürün sırasına bakılır,
      // yoksa son üründe takılıp Ritüel'e inilemez.)
      const free = (dy > 0 && t.idx >= N - 1) || (dy < 0 && t.idx <= 0);
      if (free && !t.held) {
        t = null;
        return;
      }
      t.held = true;
      e.preventDefault();
    };
    const onEnd = (e) => {
      if (!t?.held) return (t = null);
      const dy = t.y - e.changedTouches[0].clientY;
      const next = Math.max(0, Math.min(N - 1, Math.abs(dy) > 28 ? t.idx + Math.sign(dy) : t.idx));
      t = null;
      last = { idx: next, at: performance.now() };
      scrollToFlavor(next);
    };
    window.addEventListener("touchstart", onStart, { passive: true });
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend", onEnd, { passive: true });
    window.addEventListener("touchcancel", onEnd, { passive: true });
    return () => {
      window.removeEventListener("touchstart", onStart);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onEnd);
      window.removeEventListener("touchcancel", onEnd);
    };
  }, []);
}

// Ürün sayfasında aşağı kaydırmak (fare tekerleği ya da parmakla yukarı çekmek) sağdaki
// hikâyeleri sırayla açar; şişe her birinde kendi pozuna döner. Yukarı kaydırmak geri götürür,
// ilk hikâyeden yukarı kaydırınca koku bilgisine dönülür.
function useDetailScroll() {
  useEffect(() => {
    let acc = 0;
    let lockUntil = 0;
    let touchY = null;
    const step = (dir) => {
      const s = useStore.getState();
      if (!s.detail || s.menu || s.cartOpen) return false;
      const now = performance.now();
      if (now < lockUntil) return true;
      const last = features.length - 1;
      const cur = s.feature;
      let next = cur;
      if (dir > 0) next = cur == null ? 0 : Math.min(cur + 1, last);
      else next = cur == null ? null : cur === 0 ? null : cur - 1;
      if (next !== cur) {
        s.setFeature(next);
        lockUntil = now + 900;
      }
      return true;
    };
    // İçinde kendi kaydırması olan bir panelde (uzun açıklama vb.) kaydırma o panele kalır.
    const scrollsInside = (el, dir) => {
      const box = el?.closest?.("[data-lenis-prevent]");
      if (!box || box.scrollHeight <= box.clientHeight + 2) return false;
      return dir > 0 ? box.scrollTop + box.clientHeight < box.scrollHeight - 1 : box.scrollTop > 0;
    };
    const onWheel = (e) => {
      const s = useStore.getState();
      if (!s.detail || s.menu || s.cartOpen) return;
      const dir = Math.sign(e.deltaY);
      if (!dir || scrollsInside(e.target, dir)) return;
      acc = Math.sign(acc) === dir ? acc + e.deltaY : e.deltaY;
      if (Math.abs(acc) < 40) return;
      acc = 0;
      step(dir);
    };
    const onTouchStart = (e) => {
      touchY = useStore.getState().detail ? e.touches[0].clientY : null;
    };
    const onTouchEnd = (e) => {
      if (touchY == null) return;
      const dy = touchY - e.changedTouches[0].clientY;
      touchY = null;
      if (Math.abs(dy) < 50 || scrollsInside(e.target, Math.sign(dy))) return;
      step(Math.sign(dy));
    };
    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, []);
}

function useKeys() {
  useEffect(() => {
    const onKey = (e) => {
      const s = useStore.getState();
      if (e.key === "Escape") {
        s.setMenu(false);
        s.setCartOpen(false);
        if (s.feature != null) s.setFeature(null);
        else s.closeDetail();
      }
      if (!s.detail) return;
      const dir = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
      if (!dir) return;
      s.feature != null ? stepFeature(dir) : stepFlavor(dir);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
}

// Aşağıdaki bölümlerde metinler ekrana girerken yukarı süzülür. Sayfa değişince
// (katalogdan ana sayfaya dönüş) yeni öğeler yeniden izlenir; yoksa görünmez kalırlar.
function useReveal(route) {
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && e.target.classList.add("is-in")),
      // Eşik oran değil kenar: uzun öğeler (telefonda alt alta kart ızgarası) ekrana girer girmez açılır.
      { threshold: 0, rootMargin: "0px 0px -6% 0px" }
    );
    document.querySelectorAll(".reveal").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [route]);
}

// Butonlar fareye doğru hafifçe çekilir (mıknatıs etkisi).
function useMagnetic() {
  useEffect(() => {
    if (window.matchMedia("(pointer: coarse), (prefers-reduced-motion: reduce)").matches) return;
    const SEL = ".pill, .round, .menu-btn, .cart-btn, .hud__cta, .feat";
    let current = null;
    const reset = (el) => {
      el.style.removeProperty("--mx");
      el.style.removeProperty("--my");
    };
    const onMove = (e) => {
      const el = e.target.closest?.(SEL);
      if (current && current !== el) reset(current);
      current = el;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const dx = (e.clientX - (r.left + r.width / 2)) / r.width;
      const dy = (e.clientY - (r.top + r.height / 2)) / r.height;
      el.style.setProperty("--mx", `${(dx * 10).toFixed(1)}px`);
      el.style.setProperty("--my", `${(dy * 8).toFixed(1)}px`);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);
}

// Sayfa dili: büyük harf dönüşümleri (i → İ) ve ekran okuyucular için.
function useDocLang() {
  const lang = useStore((s) => s.lang);
  useEffect(() => {
    // content.htmlLang: arayüz başka bir dile çevrildiyse (ör. Macarca metinler "en" yuvasında) sayfanın dili.
    document.documentElement.lang = content.htmlLang ?? lang;
  }, [lang]);
}

// Basit sayfa yönlendirmesi: "#/urunler" katalog sayfası ("#/urunler/<kategori>"
// o kategoriyle açılır), geri kalanı ana sayfa.
function useRoute() {
  const read = () => (window.location.hash.startsWith("#/") ? window.location.hash.slice(2) : "");
  const [route, setRoute] = useState(read);
  useEffect(() => {
    const on = () => {
      const next = read();
      // 3B sahnesi olan bir sayfa başka bir ürün setini gösteriyorsa (ana sayfa ↔
      // kategori, kategori ↔ kategori) sayfa o setle yeniden açılır.
      const scenePage = !next || setKey(window.location.hash) !== "home";
      if (scenePage && setKey(window.location.hash) !== SET_KEY) {
        window.location.reload();
        return;
      }
      setRoute(next);
      const s = useStore.getState();
      s.setMenu(false);
      s.setCartOpen(false);
      s.closeDetail();
      // Ana sayfaya bir bölüm bağlantısıyla dönüldüyse o bölüme kay.
      if (!next) {
        const id = window.location.hash.slice(1);
        setTimeout(() => {
          const el = id && document.getElementById(id);
          if (el && id !== "flavors") scrollToElement(el);
          else window.scrollTo(0, 0);
        }, 80);
      }
    };
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);
  return route;
}

// Sayfa yeniden açıldıktan sonra: adresteki bölüme ya da ürüne git
// (#ritual, #/urunler/sac/sac-bakim-suyu).
function useLanding() {
  const loaded = useStore((s) => s.loaded);
  useEffect(() => {
    if (!loaded) return;
    if (PAGE.focus) {
      const item = content.catalog.items.find((i) => i.id === PAGE.focus);
      const index = item ? flavors.findIndex((f) => f.gid === item.product) : -1;
      if (index > 0) setTimeout(() => scrollToFlavorOf(useStore.getState().order, index, false), 300);
      return;
    }
    const id = window.location.hash.slice(1);
    const el = id && !id.startsWith("/") && id !== "flavors" && document.getElementById(id);
    if (el) setTimeout(() => scrollToElement(el), 300);
  }, [loaded]);
}

// Katalogdan bir 3B ürüne tıklanınca: carousel'de o ürüne kay ve detayı aç.
function useOpenProduct() {
  useEffect(() => {
    const on = (e) => {
      const s = useStore.getState();
      scrollToFlavorOf(s.order, e.detail.index, false);
      setTimeout(() => useStore.getState().openDetail(), 1300);
    };
    window.addEventListener("open-product", on);
    return () => window.removeEventListener("open-product", on);
  }, []);
}

export default function App() {
  useSmoothScroll();
  useKeys();
  useDetailScroll();
  useTouchPaging();
  useMagnetic();
  useDocLang();
  useOpenProduct();
  useEffect(() => startSound(), []);
  const route = useRoute();
  useReveal(route);
  useLanding();
  const [page, cat] = route.split("/");
  // "#/urunler": tüm ürünler listesi (3B sahne yok). "#/urunler/<kategori>":
  // o kategorinin ürünleri ana sayfadaki gibi 3B akışta, altında kartları.
  const isCategory = PAGE.kind === "category" && page === "urunler" && cat === PAGE.id;
  const isCatalog = page === "urunler" && !!content.catalog && !isCategory;
  useEffect(() => {
    useStore.getState().setPage(isCatalog || isCategory ? "catalog" : "home");
    document.documentElement.dataset.page = isCatalog ? "catalog" : isCategory ? "category" : "home";
  }, [isCatalog, isCategory]);
  const detail = useStore((s) => s.detail);
  const cinema = useStore((s) => s.detail && s.feature != null);

  const stage = (
    <section id="flavors" className="flavors" style={{ height: `calc(100vh + ${(N - 1) * 60}vh)` }}>
      <div className={`stage${detail ? " is-detail" : ""}${cinema ? " is-cinema" : ""}`}>
        {isCategory && <CategoryBar id={PAGE.id} />}
        <FlavorHud />
        <DetailPanel />
        {content.spray && <SprayNote />}
      </div>
    </section>
  );

  return (
    <>
      <Preloader />
      {!isCatalog && <Scene />}
      <Header />
      <Menu />
      <CartDrawer />
      {isCatalog ? (
        <CatalogPage cat={cat} />
      ) : isCategory ? (
        <main className="is-category">
          {stage}
          <CategoryGrid id={PAGE.id} />
          <Footer />
        </main>
      ) : (
        <main>
          {stage}
          <Ritual />
          {PYRAMID && <NotePyramid />}
          {FINDER && <Finder />}
          {content.catalog && <CollectionGrid />}
          {DISCOVERY && <Discovery />}
          {!SHOWCASE && <Shop />}
          <div className={`epilogue${EPILOGUE ? " epilogue--stage" : ""}`}>
            {EPILOGUE && <EpilogueStage />}
            <Marquee />
            {CLOTH && <BrandCloth />}
            {!HIDDEN.has("story") && <Story />}
            {!HIDDEN.has("stockists") && <Stockists />}
            <Faq />
            <Footer />
          </div>
        </main>
      )}
    </>
  );
}
