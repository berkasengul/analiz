// Ürün kataloğu. `image`: arka planı silinmiş, çocuk modelli dikey PNG.
// Fotoğrafı olmayan ürünler için garments.js içindeki çizim sistemi de
// kullanılabilir (pattern + model alanlarıyla).

const SIZES = ['2-3', '3-4', '4-5', '5-6', '6-7', '7-8', '8-9', '9-10', '10-11', '11-12'];

export const BRAND = 'SESA KIDS';

// Vitrinde sırayla dönen, gerçek fotoğraflı takımlar.
// Kodlar ve fiyatlar örnektir; gerçek değerlerle değiştirin.
export const PRODUCTS = [
  {
    id: 'KK-01', image: 'assets/kalpli-kedi.png', gender: 'kiz',
    accent: '#e96bb8', tint: '#ffeaf6', podium: '#ffc8e8',
    code: 'Kız çocuk', name: 'Kalpli Kedi Takımı', price: 449,
    colorName: 'Ekru / Renkli kalpler', sizes: SIZES,
    desc: 'Ekru üst üzerinde kalpli kedi baskısı, rengârenk kalp desenli manşetli alt.',
  },
  {
    id: 'HL-06', image: 'assets/helikopter.png', gender: 'erkek',
    accent: '#1f8fd0', tint: '#e0f4ff', podium: '#b5e2fa',
    code: 'Erkek çocuk', name: 'Helikopter Takımı', price: 449,
    colorName: 'Turkuaz / Lacivert çizgili', sizes: SIZES,
    desc: 'Lacivert çizgili turkuaz üstte helikopter baskısı, itfaiye ve trafik desenli alt.',
  },
  {
    id: 'CL-05', image: 'assets/cilek.png', gender: 'kiz',
    accent: '#ec5c95', tint: '#ffe8f1', podium: '#ffc4da',
    code: 'Kız çocuk', name: 'Çilekli Takım', price: 449,
    colorName: 'Pembe', sizes: SIZES,
    desc: 'Baştan aşağı çilek ve papatya desenli, önü çilek baskılı pembe takım.',
  },
  {
    id: 'KA-02', image: 'assets/kutup-ayisi.png', gender: 'kiz',
    accent: '#22aebf', tint: '#e0f7fa', podium: '#b8ecf3',
    code: 'Kız çocuk', name: 'Kutup Ayısı Takımı', price: 449,
    colorName: 'Mint', sizes: SIZES,
    desc: 'Mint rengi üstte fiyonklu ayıcık aplike, kutup ayısı desenli manşetli alt.',
  },
  {
    id: 'RK-04', image: 'assets/rakun.png', gender: 'kiz',
    accent: '#ec7f5f', tint: '#ffefe9', podium: '#ffd3c5',
    code: 'Kız çocuk', name: 'Smile Everyday Rakun Takımı', price: 449,
    colorName: 'Somon / Gri', sizes: SIZES,
    desc: 'Somon üstte "Smile everyday" rakun baskısı, gri zemin üzerine rakun desenli alt.',
  },
  {
    id: 'KR-03', image: 'assets/kirpi.png', gender: 'kiz',
    accent: '#d1931a', tint: '#fff5dd', podium: '#ffe0a3',
    code: 'Kız çocuk', name: 'Little Hoglet Kirpi Takımı', price: 449,
    colorName: 'Ekru / Petrol yeşili', sizes: SIZES,
    desc: 'Ekru üstte "Little Hoglet" kirpi baskısı, petrol yeşili zemin üzerine sarı yıldızlı alt.',
  },
];

export const byId = (id) => PRODUCTS.find((p) => p.id === id);

const fmt = new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 });
export const formatPrice = (n) => fmt.format(n);
export const sizeLabel = (s) => `${s} Yaş`;
