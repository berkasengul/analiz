import { lazy, Suspense, useEffect } from 'react';
import { MotionConfig } from 'framer-motion';
import { useStore } from './store';
import { products, type ProductId } from './data/products';
import { initScroll, getLenis } from './scroll/scroll';
import { unlockAudio } from './audio/sound';
import { Loader } from './ui/Loader';
import { Header } from './ui/Header';
import { Cart } from './ui/Cart';
import { ProductDetail } from './ui/ProductDetail';
import { Flavors } from './ui/sections/Flavors';
import { Ritual } from './ui/sections/Ritual';
import { Pyramid } from './ui/sections/Pyramid';
import { Finder } from './ui/sections/Finder';
import { AllProducts } from './ui/sections/AllProducts';
import { Shop } from './ui/sections/Shop';
import { Story } from './ui/sections/Story';
import { Faq } from './ui/sections/Faq';
import { Contact } from './ui/sections/Contact';
import { Footer } from './ui/sections/Footer';

const loadScene = () => import('./three/Scene');
const Scene = lazy(loadScene);
// three ayrı chunk'ta; görsellerle paralel indirilmeye hemen başlansın
void loadScene();

/** `?card=<id>`: kart görseli üretimi için yalnız sahne (scripts/render-cards.mjs) */
const CARD_ID = (() => {
  const id = new URLSearchParams(window.location.search).get('card');
  return products.some((p) => p.id === id) ? (id as ProductId) : undefined;
})();

function CardStudio({ id }: { id: ProductId }) {
  const loaded = useStore((s) => s.loaded);
  const ready = useStore((s) => s.sceneReady);
  useEffect(() => {
    if (ready) document.documentElement.dataset.cardReady = '1';
  }, [ready]);
  return (
    <>
      {loaded && (
        <Suspense fallback={null}>
          <Scene cardId={id} />
        </Suspense>
      )}
      <Loader />
    </>
  );
}

export default function App() {
  return CARD_ID ? <CardStudio id={CARD_ID} /> : <Site />;
}

function Site() {
  const loaded = useStore((s) => s.loaded);
  const sceneReady = useStore((s) => s.sceneReady);
  const lang = useStore((s) => s.lang);

  useEffect(() => initScroll(), []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  // yükleme bitene kadar kaydırma durur
  useEffect(() => {
    const l = getLenis();
    if (!l) return;
    if (sceneReady) l.start();
    else l.stop();
  }, [sceneReady]);

  useEffect(() => {
    const once = () => unlockAudio();
    window.addEventListener('pointerdown', once, { once: true });
    window.addEventListener('keydown', once, { once: true });
    return () => {
      window.removeEventListener('pointerdown', once);
      window.removeEventListener('keydown', once);
    };
  }, []);

  return (
    <MotionConfig reducedMotion="user">
      <a className="skip" href="#flavors">{lang === 'tr' ? 'İçeriğe geç' : 'Skip to content'}</a>
      {loaded && (
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      )}
      <Header />
      <main id="main">
        <Flavors />
        <Ritual />
        <Pyramid />
        <Finder />
        <AllProducts />
        <Shop />
        <Story />
        <Faq />
        <Contact />
      </main>
      <Footer />
      <Cart />
      <ProductDetail />
      <Loader />
    </MotionConfig>
  );
}
