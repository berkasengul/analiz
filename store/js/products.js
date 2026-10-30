// Ürün kataloğu. `image`: arka planı silinmiş, çocuk modelli dikey PNG.
// Fotoğrafı olmayan ürünler için garments.js içindeki çizim sistemi de
// kullanılabilir (pattern + model alanlarıyla).

const SIZES = ['2-3', '3-4', '4-5', '5-6', '6-7', '7-8', '8-9', '9-10', '10-11', '11-12'];

export const BRAND = 'SESA KIDS';

// Vitrinde sırayla dönen, 360° 3D modelli takımlar (Tripo turntable videolarından).
// Kodlar ve fiyatlar örnektir; gerçek değerlerle değiştirin.
const CATALOG = [
  {
    id: 'KK-01', spin: 'kalpli-kedi',
    spots: { yaka: [0.55, 0.2], baski: [0.55, 0.32], desen: [0.35, 0.66], manset: [0.7, 0.89] },
    image: 'assets/spin/kalpli-kedi/000.webp', gender: 'kiz',
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
    id: 'DM-08', spin: 'dama-is-makineleri',
    spots: { yaka: [0.5, 0.2], baski: [0.5, 0.35], desen: [0.4, 0.7], manset: [0.6, 0.94] },
    image: 'assets/spin/dama-is-makineleri/000.webp', gender: 'erkek',
    accent: '#2f5fb3', tint: '#e6eeff', podium: '#bcd0f5',
    code: 'Erkek çocuk', name: 'Dama İş Makineleri Takımı', price: 449,
    colorName: 'Lacivert / Beyaz dama', sizes: SIZES,
    desc: 'Lacivert-beyaz dama zemin üzerinde kepçe, kamyon ve iş makineleri; lacivert ribanalı bilek ve paçalar.',
  },
  {
    id: 'AE-09', spin: 'ayicikli-beyaz-ekose',
    spots: { yaka: [0.5, 0.2], baski: [0.5, 0.35], desen: [0.4, 0.7], manset: [0.6, 0.94] },
    image: 'assets/spin/ayicikli-beyaz-ekose/000.webp', gender: 'kiz',
    accent: '#c0392b', tint: '#fdeceb', podium: '#f3c4bf',
    code: 'Kız çocuk', name: 'Ayıcıklı Ekose Takım', price: 449,
    colorName: 'Beyaz ekose / Ayıcıklı', sizes: SIZES,
    desc: 'Beyaz-siyah ekose zemin üzerinde ayıcıklar; kırmızı biyeli, yakalı düğmeli pijama takımı.',
  },
  {
    id: 'RC-10', spin: 'renkli-cilekler',
    spots: { yaka: [0.5, 0.2], baski: [0.5, 0.35], desen: [0.4, 0.7], manset: [0.6, 0.94] },
    image: 'assets/spin/renkli-cilekler/000.webp', gender: 'kiz',
    accent: '#e8559a', tint: '#ffe8f2', podium: '#ffc2dc',
    code: 'Kız çocuk', name: 'Renkli Çilekler Takımı', price: 449,
    colorName: 'Pembe / Renkli çilekler', sizes: SIZES,
    desc: 'Pembe zemin üzerinde rengârenk çilekler; manşetli paçalı yumuşak takım.',
  },
  {
    id: 'PA-11', spin: 'polis-arabalari',
    spots: { yaka: [0.5, 0.2], baski: [0.5, 0.35], desen: [0.4, 0.7], manset: [0.6, 0.94] },
    image: 'assets/spin/polis-arabalari/000.webp', gender: 'erkek',
    accent: '#5b6472', tint: '#f1f2f4', podium: '#d4d8de',
    code: 'Erkek çocuk', name: 'Polis Arabaları Takımı', price: 449,
    colorName: 'Krem / Gri', sizes: SIZES,
    desc: 'Krem zemin üzerinde polis arabaları, kelepçe ve telsizler; manşetli paçalar.',
  },
  {
    id: 'BE-12', spin: 'ayicikli-bej-ekose',
    spots: { yaka: [0.5, 0.2], baski: [0.5, 0.35], desen: [0.4, 0.7], manset: [0.6, 0.94] },
    image: 'assets/spin/ayicikli-bej-ekose/000.webp', gender: 'kiz',
    accent: '#b5652f', tint: '#fbefe5', podium: '#efd2b8',
    code: 'Kız çocuk', name: 'Ayıcıklı Bej Ekose Takım', price: 449,
    colorName: 'Bej ekose / Ayıcıklı', sizes: SIZES,
    desc: 'Bej ekose zemin üzerinde ayıcıklar; kırmızı biyeli, yakalı düğmeli pijama takımı.',
  },
  {
    id: 'SD-13', spin: 'safari-dostlari',
    spots: { yaka: [0.5, 0.2], baski: [0.5, 0.35], desen: [0.4, 0.7], manset: [0.6, 0.94] },
    image: 'assets/spin/safari-dostlari/000.webp', gender: 'kiz',
    accent: '#3aa0c8', tint: '#e6f5fb', podium: '#bfe3f1',
    code: 'Kız çocuk', name: 'Safari Dostları Takımı', price: 449,
    colorName: 'Açık mavi / Desenli', sizes: SIZES,
    desc: 'Açık mavi zemin üzerinde filler, zürafalar, palmiye yaprakları ve çiçekler; manşetli bilek ve paçalar.',
  },
  {
    id: 'GZ-14', spin: 'gezegenler',
    spots: { yaka: [0.5, 0.2], baski: [0.5, 0.35], desen: [0.4, 0.7], manset: [0.6, 0.94] },
    image: 'assets/spin/gezegenler/000.webp', gender: 'erkek',
    accent: '#3b4fa8', tint: '#e9ecfb', podium: '#c4ccf2',
    code: 'Erkek çocuk', name: 'Gezegenler Takımı', price: 449,
    colorName: 'Lacivert / Uzay desenli', sizes: SIZES,
    desc: 'Lacivert zemin üzerinde gezegenler ve yıldızlar; yakalı, düğmeli pijama takımı.',
  },
  {
    id: 'KE-15', spin: 'kirmizi-ekose',
    spots: { yaka: [0.5, 0.2], baski: [0.5, 0.35], desen: [0.4, 0.7], manset: [0.6, 0.94] },
    image: 'assets/spin/kirmizi-ekose/000.webp', gender: 'erkek',
    accent: '#c0283a', tint: '#fde9eb', podium: '#f4c0c6',
    code: 'Erkek çocuk', name: 'Kırmızı Ekose Takım', price: 449,
    colorName: 'Kırmızı / Siyah ekose', sizes: SIZES,
    desc: 'Kırmızı-siyah ekose, yakalı düğmeli klasik pijama takımı.',
  },
  {
    id: 'MC-16', spin: 'mavi-cizgili',
    spots: { yaka: [0.5, 0.2], baski: [0.5, 0.35], desen: [0.4, 0.7], manset: [0.6, 0.94] },
    image: 'assets/spin/mavi-cizgili/000.webp', gender: 'erkek',
    accent: '#2f62d0', tint: '#e7eefe', podium: '#bfd0f8',
    code: 'Erkek çocuk', name: 'Mavi Çizgili Takım', price: 449,
    colorName: 'Mavi / Beyaz çizgili', sizes: SIZES,
    desc: 'Mavi-beyaz çizgili, göğüs cepli, yakalı düğmeli klasik pijama takımı.',
  },
  {
    id: 'KC-17', spin: 'krem-cilekler',
    spots: { yaka: [0.5, 0.2], baski: [0.5, 0.35], desen: [0.4, 0.7], manset: [0.6, 0.94] },
    image: 'assets/spin/krem-cilekler/000.webp', gender: 'kiz',
    accent: '#d9455f', tint: '#fdecef', podium: '#f5c6cf',
    code: 'Kız çocuk', name: 'Krem Çilekler Takımı', price: 449,
    colorName: 'Krem / Renkli çilekler', sizes: SIZES,
    desc: 'Krem zemin üzerinde rengârenk çilekler; manşetli bilek ve paçalar.',
  },
];

// Vitrin sırası: önce Krem Çilekler, sonra Kırmızı Ekose; ardından bir kız bir erkek.
// Ana sayfadaki büyük vitrin ilk HERO_COUNT ürünü gösterir, tümü aşağıdaki bölümlerde.
const ORDER = ['KC-17', 'KE-15', 'KK-01', 'GZ-14', 'SD-13', 'PA-11', 'AE-09', 'DM-08', 'RC-10', 'RK-07', 'BE-12', 'MC-16'];
export const PRODUCTS = [...CATALOG].sort((a, b) => (ORDER.indexOf(a.id) + 1 || 99) - (ORDER.indexOf(b.id) + 1 || 99));
export const HERO_COUNT = 5;

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
