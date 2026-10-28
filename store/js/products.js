// Ürün kataloğu. `image`: arka planı silinmiş, çocuk modelli dikey PNG.
// Fotoğrafı olmayan ürünler için garments.js içindeki çizim sistemi de
// kullanılabilir (pattern + model alanlarıyla).

const SIZES = ['2-3', '3-4', '4-5', '5-6', '6-7', '7-8', '8-9', '9-10', '10-11', '11-12'];

export const BRAND = 'SESA KIDS';

// Vitrinde sırayla dönen, gerçek fotoğraflı takımlar.
// Kodlar ve fiyatlar örnektir; gerçek değerlerle değiştirin.
export const PRODUCTS = [
  {
    id: 'KK-01', spin: 'kalpli-kedi', figure: { face: 'kalpli-kedi', skin: '#f2cdb4', hair: { color: '#6b4630', style: 'long' }, top: { pattern: 'solid', base: '#f3f0ea' }, rib: '#ece8e1', pants: { pattern: 'hearts', base: '#f6f4f0' }, print: 'assets/tex/kalpli-kedi-print.png', printAspect: 0.667, printH: 1.9 },
    spots: { yaka: [0.55, 0.2], baski: [0.55, 0.32], desen: [0.35, 0.66], manset: [0.7, 0.89] },
    image: 'assets/kalpli-kedi.png', gender: 'kiz',
    accent: '#e96bb8', tint: '#ffeaf6', podium: '#ffc8e8',
    code: 'Kız çocuk', name: 'Kalpli Kedi Takımı', price: 449,
    colorName: 'Ekru / Renkli kalpler', sizes: SIZES,
    desc: 'Ekru üst üzerinde kalpli kedi baskısı, rengârenk kalp desenli manşetli alt.',
  },
  {
    id: 'RK-07', spin: 'renkli-kediler',
    spots: { yaka: [0.5, 0.2], baski: [0.5, 0.35], desen: [0.4, 0.7], manset: [0.6, 0.94] },
    image: 'assets/spin/renkli-kediler/000.webp', gender: 'erkek',
    accent: '#f08a24', tint: '#fff1e0', podium: '#ffd7a8',
    code: 'Erkek çocuk', name: 'Renkli Kediler Takımı', price: 449,
    colorName: 'Çok renkli kedi desenli', sizes: SIZES,
    desc: 'Baştan aşağı rengârenk kedi desenli üst ve alt; beyaz ribanalı yaka, bilek ve paçalar.',
  },
  {
    id: 'HL-06', figure: { face: 'helikopter', skin: '#efc6a8', hair: { color: '#3b2a20', style: 'short' }, top: { pattern: 'stripes', base: '#55cfe2', stripe: '#1f3c8c' }, rib: '#22408f', pants: { pattern: 'vehicles', base: '#3fc6e6', scale: 0.6 }, pantsRib: '#5bd0e6', print: 'assets/tex/helikopter-print.png', printAspect: 1.222, printH: 1.4 },
    spots: { yaka: [0.55, 0.19], baski: [0.5, 0.34], desen: [0.45, 0.72], manset: [0.63, 0.94] },
    image: 'assets/helikopter.png', gender: 'erkek',
    accent: '#1f8fd0', tint: '#e0f4ff', podium: '#b5e2fa',
    code: 'Erkek çocuk', name: 'Helikopter Takımı', price: 449,
    colorName: 'Turkuaz / Lacivert çizgili', sizes: SIZES,
    desc: 'Lacivert çizgili turkuaz üstte helikopter baskısı, itfaiye ve trafik desenli alt.',
  },
  {
    id: 'CL-05', figure: { face: 'cilek', skin: '#f2cdb4', hair: { color: '#563724', style: 'long' }, top: { pattern: 'berries', base: '#f7b8d4' }, rib: '#f4a6c8', pants: { pattern: 'berries', base: '#f7b8d4' }, print: 'assets/tex/cilek-print.png', printAspect: 0.849, printH: 1.6 },
    spots: { yaka: [0.5, 0.2], baski: [0.5, 0.36], desen: [0.4, 0.72], manset: [0.78, 0.95] },
    image: 'assets/cilek.png', gender: 'kiz',
    accent: '#ec5c95', tint: '#ffe8f1', podium: '#ffc4da',
    code: 'Kız çocuk', name: 'Çilekli Takım', price: 449,
    colorName: 'Pembe', sizes: SIZES,
    desc: 'Baştan aşağı çilek ve papatya desenli, önü çilek baskılı pembe takım.',
  },
  {
    id: 'KA-02', figure: { face: 'kutup-ayisi', skin: '#f0cbb2', hair: { color: '#4e3324', style: 'long' }, top: { pattern: 'solid', base: '#c4e8f5' }, rib: '#abdff0', pants: { pattern: 'bears', base: '#bfe5f3' }, print: 'assets/tex/kutup-ayisi-print.png', printAspect: 0.991, printH: 1.4 },
    spots: { yaka: [0.45, 0.17], baski: [0.42, 0.3], desen: [0.3, 0.7], manset: [0.6, 0.9] },
    image: 'assets/kutup-ayisi.png', gender: 'kiz',
    accent: '#22aebf', tint: '#e0f7fa', podium: '#b8ecf3',
    code: 'Kız çocuk', name: 'Kutup Ayısı Takımı', price: 449,
    colorName: 'Mint', sizes: SIZES,
    desc: 'Mint rengi üstte fiyonklu ayıcık aplike, kutup ayısı desenli manşetli alt.',
  },
  {
    id: 'RK-04', figure: { face: 'rakun', skin: '#f0cbb2', hair: { color: '#5a3a26', style: 'long' }, top: { pattern: 'solid', base: '#f8c8bd' }, rib: '#f4bcae', pants: { pattern: 'raccoons', base: '#a9a5a8', scale: 0.65 }, pantsRib: '#f6c2b4', print: 'assets/tex/rakun-print.png', printAspect: 1.031, printH: 1.6 },
    spots: { yaka: [0.52, 0.19], baski: [0.5, 0.36], desen: [0.5, 0.72], manset: [0.22, 0.95] },
    image: 'assets/rakun.png', gender: 'kiz',
    accent: '#ec7f5f', tint: '#ffefe9', podium: '#ffd3c5',
    code: 'Kız çocuk', name: 'Smile Everyday Rakun Takımı', price: 449,
    colorName: 'Somon / Gri', sizes: SIZES,
    desc: 'Somon üstte "Smile everyday" rakun baskısı, gri zemin üzerine rakun desenli alt.',
  },
  {
    id: 'KR-03', figure: { face: 'kirpi', skin: '#f2cfb8', hair: { color: '#7a5236', style: 'ponytail', tie: '#f9a25c' }, top: { pattern: 'solid', base: '#f1eff2' }, rib: '#e9e6ea', pants: { pattern: 'stars', base: '#1f3a42', star: '#e3b33c' }, pantsRib: '#1f3a42', print: 'assets/tex/kirpi-print.png', printAspect: 1.083, printH: 1.7 },
    spots: { yaka: [0.5, 0.17], baski: [0.55, 0.33], desen: [0.62, 0.72], manset: [0.58, 0.96] },
    image: 'assets/kirpi.png', gender: 'kiz',
    accent: '#d1931a', tint: '#fff5dd', podium: '#ffe0a3',
    code: 'Kız çocuk', name: 'Little Hoglet Kirpi Takımı', price: 449,
    colorName: 'Ekru / Petrol yeşili', sizes: SIZES,
    desc: 'Ekru üstte "Little Hoglet" kirpi baskısı, petrol yeşili zemin üzerine sarı yıldızlı alt.',
  },
];

// Detay noktaları (fotoğraf içinde 0–1 arası x, y)
export const SPOTS = [
  { key: 'yaka', label: 'Yumuşak yaka', text: 'Boyunu sarmayan, rahat ribanalı yaka.' },
  { key: 'baski', label: 'Ön baskı', text: 'Takımın masalını anlatan ön baskı.' },
  { key: 'desen', label: 'Desenli alt', text: 'Üstle uyumlu, baştan aşağı desenli alt.' },
  { key: 'manset', label: 'Manşetli paça', text: 'Uykuda yukarı kaymayan manşetli paçalar.' },
];

export const byId = (id) => PRODUCTS.find((p) => p.id === id);

const fmt = new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 });
export const formatPrice = (n) => fmt.format(n);
export const sizeLabel = (s) => `${s} Yaş`;
