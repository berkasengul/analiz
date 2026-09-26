import { Euler, Vector3 } from "three";

// Carousel ile detay kutusu arasında paylaşılan kare durumu.
export const sceneState = {
  detailVisible: false,
  focus: { position: new Vector3(), rotation: new Euler(), scale: 1 },
};
