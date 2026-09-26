import { useCallback, useEffect, useState } from "react";
import Lenis from "lenis";

import Scene from "./Scene";
import { content, flavors } from "./data";
import { measureScroll, scrollState, scrollToElement, scrollToFlavorOf, smooth } from "./scroll";
import { useStore } from "./store";

import CartDrawer from "./ui/CartDrawer";
import DetailPanel, { stepFeature, stepFlavor } from "./ui/DetailPanel";
import FlavorHud from "./ui/FlavorHud";
import Header from "./ui/Header";
import Menu from "./ui/Menu";
import Preloader from "./ui/Preloader";
import Ritual from "./ui/Ritual";
import { Faq, Footer, Marquee, Stockists, Story } from "./ui/Sections";
import Shop from "./ui/Shop";
import { CatalogPage, CollectionGrid } from "./ui/Catalog";

const N = flavors.length;

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

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // Düşük lerp = daha ağır, film gibi süzülen kaydırma.
    smooth.lenis = reduce ? null : new Lenis({ autoRaf: true, lerp: 0.07, wheelMultiplier: 0.9 });
    smooth.lenis?.on("scroll", handleScroll);

    const onClick = (e) => {
      const a = e.target.closest("a[href^='#']");
      // "#/..." sayfa bağlantılarıdır (ör. #/urunler); tarayıcı hash'i değiştirir.
      if (!a || a.getAttribute("href").startsWith("#/")) return;
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
  }, [handleScroll]);

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
      { threshold: 0.15 }
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
    document.documentElement.lang = lang;
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
  useMagnetic();
  useDocLang();
  useOpenProduct();
  const route = useRoute();
  useReveal(route);
  const [page, cat] = route.split("/");
  const isCatalog = page === "urunler" && !!content.catalog;
  useEffect(() => {
    useStore.getState().setPage(isCatalog ? "catalog" : "home");
    document.documentElement.dataset.page = isCatalog ? "catalog" : "home";
  }, [isCatalog]);
  const detail = useStore((s) => s.detail);
  const cinema = useStore((s) => s.detail && s.feature != null);

  return (
    <>
      <Preloader />
      {!isCatalog && <Scene />}
      <Header />
      <Menu />
      <CartDrawer />
      {isCatalog ? (
        <CatalogPage cat={cat} />
      ) : (
      <main>
        <section id="flavors" className="flavors" style={{ height: `calc(100vh + ${(N - 1) * 60}vh)` }}>
          <div className={`stage${detail ? " is-detail" : ""}${cinema ? " is-cinema" : ""}`}>
            <FlavorHud />
            <DetailPanel />
          </div>
        </section>
        <Ritual />
        {content.catalog && <CollectionGrid />}
        <Shop />
        <Marquee />
        <Story />
        <Stockists />
        <Faq />
        <Footer />
      </main>
      )}
    </>
  );
}
