import { Euler, Vector3 } from "three";

// Bileşenler arasında her karede paylaşılan sahne durumu.
export const sceneState = {
  heroVisible: false,
  heroFlavor: 0, // büyük kutunun o an gösterdiği tat
  focus: { position: new Vector3(), rest: new Vector3(), rotation: new Euler(), scale: 1 },
  // Öndeki ürün yerine oturdu mu (akış durdu, detay kapalı): arka plan sahnesi yalnızca o an konumlanır.
  settled: false,
  intro: 0, // açılış animasyonu 0 → 1
  spread: 0, // carousel'in dağılma oranı
  hoverFocus: false, // fare öndeki kutunun üzerinde mi
  spotlight: 0, // özellik yakın çekiminde sinematik mod 0 → 1
  burstAt: 0, // kahve sıçramasının tetiklendiği an
  // Parfüm sıkma (content.spray): düğme sprayReq'e ürünü yazar; Spray bileşeni saati başlatır.
  // spray.t0: başlangıç (sahne saati), flavor: sıkılan ürün; nozzle/nozzleDir: sprey ağzının dünya konumu ve yönü.
  sprayReq: -1,
  spray: { t0: -100, flavor: -1 },
  nozzle: new Vector3(),
  nozzleDir: new Vector3(0, 0, 1),
  nozzleAt: -100,
};
// Sıkma zaman çizelgesi (saniye): kapak kalkar, başlığa basılır, buğu çıkar, kapak geri kapanır.
// ?slowmo=8 adresiyle sıkma ağır çekimde oynar (incelemek için); sprey saati = sahne saati / SPRAY_SLOW.
export const SPRAY_SLOW = typeof window !== "undefined" ? Number(new URLSearchParams(window.location.search).get("slowmo")) || 1 : 1;
export const SPRAY = { lift: 0.55, press: 0.8, emit: 0.85, emitDur: 0.75, back: 3.1, end: 3.8 };

// Dosya adresi: sitenin kendi dosyası (BASE_URL'e göre) ya da tam adres (Shopify CDN: https://… veya //…).
export const assetUrl = (p) => (/^(https?:)?\/\//.test(p) ? p : import.meta.env.BASE_URL + p);
