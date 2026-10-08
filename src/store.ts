import { create } from 'zustand';
import { persist, createJSONStorage, type StateStorage } from 'zustand/middleware';
import { products, type Lang, type ProductId } from './data/products';

export type SectionId = 'flavors' | 'ritual' | 'pyramid' | 'finder' | 'all' | 'shop' | 'story' | 'faq' | 'contact';

export interface CartLine { id: ProductId; qty: number }

export interface Spray { id: ProductId; t0: number }

interface State {
  lang: Lang;
  setLang: (l: Lang) => void;

  /** #flavors içindeki aktif koku (0..5) */
  active: number;
  setActive: (i: number) => void;

  section: SectionId;
  setSection: (s: SectionId) => void;

  ritualStep: number;
  setRitualStep: (i: number) => void;

  pyramidId: ProductId;
  setPyramidId: (id: ProductId) => void;

  shopId: ProductId;
  setShopId: (id: ProductId) => void;

  finderResult: ProductId | null;
  /** sonucun geldiği an (performance.now()/1000), iniş animasyonu için */
  finderAt: number;
  setFinderResult: (id: ProductId | null) => void;

  /** ürün detay paneli */
  detailId: ProductId | null;
  /** detayda seçili hikâye (0..3) ya da koku bilgisi (null) */
  detailStory: number | null;
  openDetail: (id: ProductId) => void;
  closeDetail: () => void;
  setDetailStory: (i: number | null) => void;

  /** #all filtresi (üst menüdeki kategoriler de bunu ayarlar) */
  allFilter: 'all' | 'kadın' | 'erkek';
  setAllFilter: (f: 'all' | 'kadın' | 'erkek') => void;

  menuOpen: boolean;
  setMenuOpen: (o: boolean) => void;

  spray: Spray | null;
  startSpray: (id: ProductId) => void;

  cart: CartLine[];
  cartOpen: boolean;
  setCartOpen: (o: boolean) => void;
  addToCart: (id: ProductId, qty?: number) => void;
  setQty: (id: ProductId, qty: number) => void;
  removeFromCart: (id: ProductId) => void;

  loaded: boolean;
  setLoaded: (v: boolean) => void;
  sceneReady: boolean;
  setSceneReady: (v: boolean) => void;
}

/** localStorage erişimi gizli pencerede vb. hata atabilir */
const safeStorage: StateStorage = {
  getItem: (k) => { try { return localStorage.getItem(k); } catch { return null; } },
  setItem: (k, v) => { try { localStorage.setItem(k, v); } catch { /* yoksay */ } },
  removeItem: (k) => { try { localStorage.removeItem(k); } catch { /* yoksay */ } },
};

export const now = () => performance.now() / 1000;

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      lang: 'tr',
      setLang: (lang) => set({ lang }),

      active: 0,
      setActive: (active) => get().active !== active && set({ active }),

      section: 'flavors',
      setSection: (section) => get().section !== section && set({ section }),

      ritualStep: 0,
      setRitualStep: (ritualStep) => get().ritualStep !== ritualStep && set({ ritualStep }),

      pyramidId: 'no-tears',
      setPyramidId: (pyramidId) => set({ pyramidId }),

      shopId: 'no-tears',
      setShopId: (shopId) => set({ shopId }),

      finderResult: null,
      finderAt: 0,
      setFinderResult: (finderResult) => set({ finderResult, finderAt: now() }),

      detailId: null,
      detailStory: null,
      openDetail: (detailId) => set({ detailId, detailStory: null, cartOpen: false, menuOpen: false }),
      closeDetail: () => set({ detailId: null, detailStory: null }),
      setDetailStory: (detailStory) => set({ detailStory }),

      allFilter: 'all',
      setAllFilter: (allFilter) => set({ allFilter }),

      menuOpen: false,
      setMenuOpen: (menuOpen) => set({ menuOpen }),

      spray: null,
      startSpray: (id) => {
        const s = get().spray;
        // devam eden bir sıkma varsa (3.8 sn) yenisini başlatma
        if (s && now() - s.t0 < 3.9) return;
        set({ spray: { id, t0: now() } });
      },

      cart: [],
      cartOpen: false,
      setCartOpen: (cartOpen) => set({ cartOpen }),
      addToCart: (id, qty = 1) => {
        const cart = get().cart.slice();
        const line = cart.find((l) => l.id === id);
        if (line) line.qty = Math.min(20, line.qty + qty);
        else cart.push({ id, qty });
        set({ cart: cart.map((l) => ({ ...l })) });
      },
      setQty: (id, qty) =>
        set({ cart: get().cart.map((l) => (l.id === id ? { ...l, qty: Math.max(1, Math.min(20, qty)) } : l)) }),
      removeFromCart: (id) => set({ cart: get().cart.filter((l) => l.id !== id) }),

      loaded: false,
      setLoaded: (loaded) => set({ loaded }),
      sceneReady: false,
      setSceneReady: (sceneReady) => set({ sceneReady }),
    }),
    {
      name: 'unbe-store',
      storage: createJSONStorage(() => safeStorage),
      partialize: (s) => ({ cart: s.cart, lang: s.lang }),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<State>;
        const valid = new Set(products.map((x) => x.id));
        return {
          ...current,
          lang: p.lang === 'en' ? 'en' : 'tr',
          cart: Array.isArray(p.cart) ? p.cart.filter((l) => valid.has(l.id) && l.qty > 0) : [],
        };
      },
    },
  ),
);

export const cartUrl = (cart: CartLine[]) =>
  'https://unbeperfumes.com/cart/' +
  cart.map((l) => `${products.find((p) => p.id === l.id)!.variantId}:${l.qty}`).join(',');

const reducedMql = typeof window !== 'undefined' ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
export const prefersReducedMotion = () => !!reducedMql?.matches;

/** Ekran görüntüsü betiği (scripts/shots.mjs) yavaş başsız tarayıcıda yerleşmiş durumu yakalasın diye */
export const settleInstantly = () => typeof window !== 'undefined' && !!(window as unknown as { __unbeSettle?: boolean }).__unbeSettle;

export const isMobile = () => typeof window !== 'undefined' && window.innerWidth < 760;
