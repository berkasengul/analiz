// Site ayarları ve ürün bilgileri. Metinler yalnızca ambalajda ve Solagron sitesinde yazan bilgilere dayanır.
export const SITE = {
  email: 'info@madamelyras.com.tr', // alan adı kesinleşince burayı ve index.html'deki mailto'yu güncelle
};

export const FLAVORS = [
  {
    id: 'cilek',
    name: 'Çilek',
    tex: '/tex/cilek.webp',
    bg: '#b90d10',
    ink: 'light',
    accent: '#ffd9d2',
    piece: 'strawberry',
    lead: 'Bütün çilek, dondurularak kurutuldu.',
    desc: 'Dişlediğiniz anda çıtırdar, ağızda erirken çileğin kendi tatlılığı ve mayhoşluğu kalır. Şeker eklemedik; gerek yok.',
    facts: [
      ['Net', '16 g'],
      ['İçindekiler', '%100 çilek'],
      ['Kaynak', '160 g taze çilek'],
    ],
  },
  {
    id: 'elma',
    name: 'Elma',
    tex: '/tex/elma.webp',
    bg: '#4f8a12',
    ink: 'light',
    accent: '#e8f7c8',
    piece: 'apple',
    lead: 'İnce dilim elma, suyu alınmış haliyle.',
    desc: 'Cips kadar hafif, cips kadar çıtır; ama içinde elmadan başka bir şey yok. Beslenme çantası için birebir.',
    facts: [
      ['Net', '16 g'],
      ['İçindekiler', '%100 elma'],
      ['Biçim', 'Dilim'],
    ],
  },
  {
    id: 'mango',
    name: 'Mango',
    tex: '/tex/mango.webp',
    bg: '#e9b80b',
    ink: 'dark',
    accent: '#5a2a06',
    piece: 'mango',
    lead: 'Tropik mango, parlak rengiyle.',
    desc: 'Mangonun yoğun aroması kurutulunca daha da belirginleşir. Yoğurdun, granolanın ya da sadece avucunuzun içinde.',
    facts: [
      ['Net', '16 g'],
      ['İçindekiler', '%100 mango'],
      ['Biçim', 'Parça'],
    ],
  },
  {
    id: 'ahududu',
    name: 'Ahududu',
    tex: '/tex/ahududu.webp',
    bg: '#b8587f',
    ink: 'light',
    accent: '#ffe1ee',
    piece: 'raspberry',
    lead: 'Bütün ahududu, mayhoş ve aromatik.',
    desc: 'Şeklini koruyan, parmaklar arasında toz olup dağılan ahududu. Tatlıların ve pastaların üzerinde rengiyle göz alır.',
    facts: [
      ['Net', '16 g'],
      ['İçindekiler', '%100 ahududu'],
      ['Biçim', 'Bütün'],
    ],
  },
];

export const CLAIMS = ['Sadece meyve', 'Şeker ilavesiz', 'Katkı maddesi yok', 'Koruyucu ve renklendirici yok'];
