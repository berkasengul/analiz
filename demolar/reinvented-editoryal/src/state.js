import { useSyncExternalStore } from "react";
import PRODUCTS_JSON from "./products.json";

// Ana sayfanın 3B sahnesiyle arayüzün paylaştığı durum. Sahne her karede okur (React'e bağlı değil);
// arayüz seçili kokuyu useCurrent ile izler.
export const PRODUCTS = PRODUCTS_JSON;
// Açılıştaki kaydırmalı vitrin: bu sıradaki kokular (markanın öne çıkardığı dört koku) kaydırdıkça değişir;
// sonuncusundan sonra şişe aşağıdaki ürün kartına iner.
export const HOME = ["enigmatic-aura", "lucid-dream", "eureka", "sacred-bond"].map((h) => PRODUCTS.findIndex((p) => p.handle === h));
export const state = {
  current: HOME[0],
  instant: false, // vitrinde kaydırmayla değişince şişe yan dönükken anında değişir (küçülüp büyümez)
  heroP: 0, // vitrindeki kesirli sıra (0 … HOME.length-1)
  heroOn: 1, // vitrin sabitken 1, sayfa aşağı inince 0
  pointer: { x: 0, y: 0 },
  spinAt: null,
  onShown: null,
  pose: null,
};
const subs = new Set();
export function setCurrent(i, { instant = false } = {}) {
  if (i === state.current) return;
  state.current = i;
  state.instant = instant;
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

// Kokunun sahne renkleri: kapağın renginden açık fon, orta ton ve derin ton.
export function paletteOf(p) {
  const hex = p.color.replace("#", "");
  const c = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const mix = (a, t, k) => a.map((v, i) => v + (t[i] - v) * k);
  return {
    light: mix(c, [1, 1, 1], 0.72),
    mid: mix(c, [1, 1, 1], 0.3),
    deep: mix(c, [0.02, 0.02, 0.04], 0.55),
    accent: c,
  };
}
