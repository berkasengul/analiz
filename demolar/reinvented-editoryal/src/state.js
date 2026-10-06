import { useSyncExternalStore } from "react";
import PRODUCTS_JSON from "./products.json";

// Ana sayfanın 3B sahnesiyle arayüzün paylaştığı durum. Sahne her karede okur (React'e bağlı değil);
// arayüz seçili kokuyu useCurrent ile izler.
export const PRODUCTS = PRODUCTS_JSON;
export const state = {
  current: 0,
  pointer: { x: 0, y: 0 },
  spinAt: null,
  onShown: null,
  pose: null,
};
const subs = new Set();
export function setCurrent(i) {
  if (i === state.current) return;
  state.current = i;
  document.documentElement.style.setProperty("--accent", PRODUCTS[i].color);
  subs.forEach((f) => f());
}
export function spin() {
  state.spinAt = performance.now();
}
export function useCurrent() {
  return useSyncExternalStore(
    (f) => (subs.add(f), () => subs.delete(f)),
    () => state.current
  );
}
