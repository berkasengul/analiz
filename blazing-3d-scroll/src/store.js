import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { DEFAULT_SHOP_FLAVOR, VARIETY } from "./data";

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
      active: 0,
      moving: false,
      ritualStep: 0,
      detail: false,
      feature: null,
      spin: false,
      menu: false,
      cartOpen: false,
      shopFlavor: null, // null = detayda en son bakılan tat
      picked: null,
      shopPack: 12,
      shopPlan: "once",
      cart: [],

      setLoaded: () => set({ loaded: true }),
      setSceneReady: () => set({ sceneReady: true }),
      setActive: (active) => set({ active }),
      setMoving: (moving) => set({ moving }),
      setRitualStep: (ritualStep) => set({ ritualStep }),
      openDetail: () => set((s) => ({ detail: true, feature: null, picked: s.active })),
      closeDetail: () => set({ detail: false, feature: null, spin: false }),
      setFeature: (feature) => set({ feature, spin: false }),
      toggleSpin: () => set((s) => ({ spin: !s.spin, feature: null })),
      setMenu: (menu) => set({ menu }),
      setCartOpen: (cartOpen) => set({ cartOpen, menu: false }),
      setShop: (patch) => set(patch),

      addToCart: (flavor, pack, plan, qty = 1) =>
        set((s) => {
          const id = `${flavor}-${pack}-${plan}`;
          const found = s.cart.find((i) => i.id === id);
          const cart = found
            ? s.cart.map((i) => (i.id === id ? { ...i, qty: i.qty + qty } : i))
            : [...s.cart, { id, flavor, pack, plan, qty }];
          return { cart, cartOpen: true };
        }),
      setQty: (id, qty) =>
        set((s) => ({
          cart: qty <= 0 ? s.cart.filter((i) => i.id !== id) : s.cart.map((i) => (i.id === id ? { ...i, qty } : i)),
        })),
    }),
    {
      name: "blazing-cart",
      storage: createJSONStorage(() => safeStorage),
      partialize: (s) => ({ cart: s.cart }),
    }
  )
);

export const isVariety = (f) => f === VARIETY;

export const shopFlavorOf = (s) => s.shopFlavor ?? s.picked ?? DEFAULT_SHOP_FLAVOR;
