import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { DEFAULT_SHOP_FLAVOR, DETAIL_PACK, VARIETY, catalogIdOf, content, flavors } from "./data";

// Sepette 3B ürünler katalog kimliğiyle tutulur ("c:el-kremi"): sayfalar farklı
// ürün setleri gösterse de sepet aynı kalır.
const cartKey = (f) => (typeof f === "number" && flavors[f]?.cid ? `c:${flavors[f].cid}` : f);

// Gizli sekme gibi durumlarda localStorage hata verebilir.
const safeStorage = {
  getItem: (k) => {
    try {
      return localStorage.getItem(k);
    } catch {
      return null;
    }
  },
  setItem: (k, v) => {
    try {
      localStorage.setItem(k, v);
    } catch {
      /* yok say */
    }
  },
  removeItem: (k) => {
    try {
      localStorage.removeItem(k);
    } catch {
      /* yok say */
    }
  },
};

export const useStore = create(
  persist(
    (set) => ({
      loaded: false,
      sceneReady: false,
      lang: content.defaultLang ?? "tr",
      active: 0,
      moving: false,
      swapping: false,
      // Slot → tat eşlemesi. Yan kutuya tıklanınca iki slotun tadı yer değiştirir.
      order: flavors.map((_, i) => i),
      ritualStep: 0,
      detail: false,
      feature: null,
      // Ürün sayfasında seçilen galeri çekiminin 3B görünümü (null = ana ürün).
      view: null,
      spin: false,
      menu: false,
      page: "home",
      cartOpen: false,
      shopFlavor: null, // null = detayda en son bakılan tat
      picked: null,
      shopPack: DETAIL_PACK,
      shopPlan: "once",
      cart: [],

      setLoaded: () => set({ loaded: true }),
      setSceneReady: () => set({ sceneReady: true }),
      setLang: (lang) => set({ lang }),
      setPage: (page) => set({ page }),
      setActive: (active) => set((s) => (s.active === active ? {} : { active, view: null })),
      setMoving: (moving) => set({ moving }),
      setSwapping: (swapping) => set({ swapping }),
      swapSlots: (a, b) =>
        set((s) => {
          const order = [...s.order];
          [order[a], order[b]] = [order[b], order[a]];
          return { order };
        }),
      setRitualStep: (ritualStep) => set({ ritualStep }),
      openDetail: () => set((s) => ({ detail: true, feature: null, view: null, picked: s.active })),
      closeDetail: () => set({ detail: false, feature: null, view: null, spin: false }),
      setFeature: (feature) => set({ feature, spin: false, view: null }),
      setView: (view) => set({ view, feature: null, spin: false }),
      toggleSpin: () => set((s) => ({ spin: !s.spin, feature: null, view: null })),
      setMenu: (menu) => set({ menu }),
      setCartOpen: (cartOpen) => set({ cartOpen, menu: false }),
      setShop: (patch) => set(patch),

      addToCart: (flavor, pack, plan, qty = 1) =>
        set((s) => {
          flavor = cartKey(flavor);
          const id = `${flavor}-${pack}-${plan}`;
          const found = s.cart.find((i) => i.id === id);
          const cart = found
            ? s.cart.map((i) => (i.id === id ? { ...i, qty: i.qty + qty } : i))
            : [...s.cart, { id, flavor, pack, plan, qty }];
          return { cart, cartOpen: true };
        }),
      // Çok seçenekli üründe (renk, beden, koku) seçilen Shopify varyantı.
      setVariant: (id, variant) => set((s) => ({ cart: s.cart.map((i) => (i.id === id ? { ...i, variant } : i)) })),
      setQty: (id, qty) =>
        set((s) => ({
          cart: qty <= 0 ? s.cart.filter((i) => i.id !== id) : s.cart.map((i) => (i.id === id ? { ...i, qty } : i)),
        })),
    }),
    {
      name: `${content.slug}-cart`,
      storage: createJSONStorage(() => safeStorage),
      partialize: (s) => ({ cart: s.cart, lang: s.lang }),
      // Markanın desteklemediği kayıtlı dil (content.langs) varsayılana döner.
      merge: (saved, cur) => {
        const m = { ...cur, ...saved };
        if (content.langs && !content.langs.includes(m.lang)) m.lang = content.defaultLang ?? content.langs[0];
        return m;
      },
      // Eski sepetlerdeki ürün numaraları katalog kimliğine çevrilir.
      // v2: varsayılan dili değişen markalarda eski ziyaretçinin kayıtlı dili de varsayılana döner.
      version: 2,
      migrate: (state, from) => {
        if (from < 2 && content.defaultLang) state = { ...state, lang: content.defaultLang };
        const cart = (state?.cart ?? []).map((i) => {
          const cid = typeof i.flavor === "number" ? catalogIdOf(i.flavor) : null;
          return cid ? { ...i, flavor: `c:${cid}`, id: `c:${cid}-${i.pack}-${i.plan}` } : i;
        });
        return { ...state, cart };
      },
    }
  )
);

export const isVariety = (f) => f === VARIETY;

export const shopFlavorOf = (s) => s.shopFlavor ?? s.picked ?? DEFAULT_SHOP_FLAVOR;
