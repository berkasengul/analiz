import { create } from "zustand";

export const useStore = create((set) => ({
  active: 0,
  detail: false,
  menu: false,
  spin: false,
  setActive: (active) => set({ active }),
  openDetail: () => set({ detail: true }),
  closeDetail: () => set({ detail: false, spin: false }),
  setMenu: (menu) => set({ menu }),
  toggleSpin: () => set((s) => ({ spin: !s.spin })),
}));
