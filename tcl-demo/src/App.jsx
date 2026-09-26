import { useCallback, useEffect } from "react";
import Lenis from "lenis";

import Scene from "./Scene";
import { flavors } from "./data";
import { measureScroll, scrollState, scrollToElement, smooth } from "./scroll";
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
      if (!a) return;
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

// Aşağıdaki bölümlerde metinler ekrana girerken yukarı süzülür.
function useReveal() {
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && e.target.classList.add("is-in")),
      { threshold: 0.15 }
    );
    document.querySelectorAll(".reveal").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
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

export default function App() {
  useSmoothScroll();
  useKeys();
  useReveal();
  useMagnetic();
  const detail = useStore((s) => s.detail);
  const cinema = useStore((s) => s.detail && s.feature != null);

  return (
    <>
      <Preloader />
      <Scene />
      <Header />
      <Menu />
      <CartDrawer />
      <main>
        <section id="flavors" className="flavors" style={{ height: `calc(100vh + ${(N - 1) * 60}vh)` }}>
          <div className={`stage${detail ? " is-detail" : ""}${cinema ? " is-cinema" : ""}`}>
            <FlavorHud />
            <DetailPanel />
          </div>
        </section>
        <Ritual />
        <Shop />
        <Marquee />
        <Story />
        <Stockists />
        <Faq />
        <Footer />
      </main>
    </>
  );
}
