import { createRoot } from 'react-dom/client';
import { useEffect, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import HeroCanvas, { S } from './HeroCanvas.jsx';

gsap.registerPlugin(ScrollTrigger);

// Açılış sahnesini hero alanına yerleştirir. Hazır olunca `ready` çözülür.
export function mountHero({ container, heroEl, flavors }) {
  const mobile = window.innerWidth < 760 || window.innerWidth / window.innerHeight < 0.9;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let resolveReady;
  const ready = new Promise((r) => { resolveReady = r; });

  // fare (yumuşatılmış)
  const target = { x: 0, y: 0 };
  window.addEventListener('pointermove', (e) => {
    if (e.pointerType === 'touch') return;
    target.x = (e.clientX / window.innerWidth) * 2 - 1;
    target.y = (e.clientY / window.innerHeight) * 2 - 1;
  }, { passive: true });
  gsap.ticker.add(() => {
    S.mx += (target.x - S.mx) * 0.06;
    S.my += (target.y - S.my) * 0.06;
  });

  // kaydırma: yazılar çekilir (kamera sabit; çilek paketi ürün bölümüne iner)
  ScrollTrigger.create({
    trigger: heroEl,
    start: 'top top',
    end: 'bottom top',
    scrub: true,
    onUpdate: (self) => {
      S.p = self.progress;
      heroEl.style.setProperty('--hp', self.progress.toFixed(4));
    },
  });

  function App() {
    const [active, setActive] = useState(true);
    useEffect(() => {
      const io = new IntersectionObserver(([en]) => setActive(en.isIntersecting), { rootMargin: '80px' });
      io.observe(heroEl);
      const vis = () => setActive(!document.hidden && heroEl.getBoundingClientRect().bottom > -80);
      document.addEventListener('visibilitychange', vis);
      return () => { io.disconnect(); document.removeEventListener('visibilitychange', vis); };
    }, []);
    return <HeroCanvas flavors={flavors} mobile={mobile} reduce={reduce} active={active} onReady={() => resolveReady()} />;
  }
  createRoot(container).render(<App />);
  return {
    ready,
    // ekrandaki çilek paketi (kaydırma 0'dayken ölçülen konum ve yükseklik, piksel)
    cilekRect: () => S.rect,
    setHandoff: (v) => { S.handoff = v; },
  };
}
