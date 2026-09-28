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
};
