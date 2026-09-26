export const flavors = [
  {
    name: "Violet Rush",
    note: "Böğürtlen & mor üzüm",
    color: 0x8c75ff,
    css: "#8c75ff",
  },
  {
    name: "Lime Voltage",
    note: "Misket limonu & nane",
    color: 0x5cffab,
    css: "#5cffab",
  },
  {
    name: "Cherry Blaze",
    note: "Vişne & kan portakalı",
    color: 0xf74a8a,
    css: "#f74a8a",
  },
  {
    name: "Arctic Surge",
    note: "Buzlu mavi ahududu",
    color: 0x3df2f2,
    css: "#3df2f2",
  },
];

// Kutunun her bölümde duracağı poz. x/y/z dünya birimi, rotY radyan.
// Mobilde (dikey ekran) x değerleri sıfırlanır, kutu ortada kalır.
export const poses = [
  { x: 0, y: -0.2, z: 5, rotX: 0.15, rotY: 0, rotZ: -0.25, scale: 1 }, // hero
  { x: 3.4, y: 0, z: 4, rotX: 0, rotY: Math.PI, rotZ: 0.18, scale: 1 }, // ignite
  { x: -3.4, y: 0, z: 4.5, rotX: 0, rotY: Math.PI * 2, rotZ: -0.08, scale: 1 }, // flavors
  { x: 3.2, y: 0, z: 3, rotX: 0.2, rotY: Math.PI * 3, rotZ: 1.3, scale: 1 }, // ingredients
  { x: 0, y: -0.4, z: 4.5, rotX: 0, rotY: Math.PI * 4, rotZ: 0, scale: 1 }, // cta
];
