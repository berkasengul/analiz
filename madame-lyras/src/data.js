// Site ayarları ve ürün bilgileri. Metinler yalnızca ambalajlarda, markanın afişlerinde ve Solagron sitesinde yazan bilgilere dayanır.
export const SITE = {
  email: 'info@gencanadolugida.com.tr', // alan adı kesinleşince burayı ve index.html'deki mailto'yu güncelle
};

const FRUIT_CLAIMS = ['Sadece meyve', 'Şeker ilavesiz', 'Katkı maddesi yok', 'Koruyucu ve renklendirici yok'];

// aspect: paket fotoğrafının yükseklik / genişlik oranı (3B paketin boyu buna göre ayarlanır)
// parts: paketin çevresinde uçan meyve görsellerinin (public/parca/<id>-<n>.webp) yükseklik / genişlik oranları
export const FLAVORS = [
  {
    id: 'cilek', parts: [0.841, 0.629], name: 'Çilek', tex: '/tex/cilek.webp', aspect: 1.153,
    bg: '#b90d10', ink: 'light', piece: 'strawberry',
    slogan: 'Dondurularak kurutulmuş',
    lead: 'Bütün çilek, dondurularak kurutuldu.',
    desc: 'Dişlediğiniz anda çıtırdar, ağızda erirken çileğin kendi tatlılığı ve mayhoşluğu kalır. Şeker eklemedik; gerek yok.',
    facts: [['Net', '16 g'], ['İçindekiler', '%100 çilek'], ['Kaynak', '160 g taze çilek']],
    claims: FRUIT_CLAIMS,
  },
  {
    id: 'ahududu', parts: [0.918, 0.88, 0.929, 0.973, 0.919, 0.897], name: 'Ahududu', tex: '/tex/ahududu.webp', aspect: 1.153,
    bg: '#b8587f', ink: 'light', piece: 'raspberry', poster: '/img/afis/ahududu.webp',
    slogan: 'Meyveye yeni bir dokunuş',
    lead: 'Bütün ahududu, mayhoş ve aromatik.',
    desc: 'Şeklini koruyan, parmaklar arasında ufalanan ahududu. Tatlıların ve pastaların üzerinde rengiyle göz alır.',
    facts: [['Net', '16 g'], ['İçindekiler', '%100 ahududu'], ['Biçim', 'Bütün']],
    claims: FRUIT_CLAIMS,
  },
  {
    id: 'elma', parts: [1.108, 0.768, 0.856, 0.434], name: 'Elma', tex: '/tex/elma.webp', aspect: 1.153,
    bg: '#4f8a12', ink: 'light', piece: 'apple', poster: '/img/afis/elma.webp',
    slogan: 'Doğallığın yeniden keşfi',
    lead: 'İnce dilim elma, suyu alınmış haliyle.',
    desc: 'Cips kadar hafif, cips kadar çıtır; ama içinde elmadan başka bir şey yok. Beslenme çantası için birebir.',
    facts: [['Net', '16 g'], ['İçindekiler', '%100 elma'], ['Biçim', 'Dilim']],
    claims: FRUIT_CLAIMS,
  },
  {
    id: 'seftali', parts: [0.536, 1.015, 0.855, 0.78, 0.771], name: 'Şeftali', tex: '/tex/seftali.webp', aspect: 1.424,
    bg: '#ee9a4e', ink: 'dark', piece: 'peach', poster: '/img/afis/seftali.webp',
    slogan: 'Doğal lezzetin kurutulmuş hali',
    lead: 'Yaz bahçesinden, kurutulmuş haliyle.',
    desc: 'Şeftalinin kokulu, yaz tadındaki aroması; suyu alınmış, kendisi yerinde. Şeker eklenmedi.',
    facts: [['Net', '16 g'], ['İçindekiler', 'Şeftali'], ['Biçim', 'Dilim']],
    claims: ['Sadece meyve', 'Şeker ilavesiz', '%100 doğal meyve'],
  },
  {
    id: 'mango', parts: [0.541, 0.676, 0.545], name: 'Mango', tex: '/tex/mango.webp', aspect: 1.153,
    bg: '#f08a12', ink: 'dark', piece: 'mango',
    slogan: 'Dondurularak kurutulmuş',
    lead: 'Tropik mango, parlak rengiyle.',
    desc: 'Mangonun yoğun aroması kurutulunca daha da belirginleşir. Yoğurdun, granolanın ya da sadece avucunuzun içinde.',
    facts: [['Net', '16 g'], ['İçindekiler', '%100 mango'], ['Biçim', 'Parça']],
    claims: FRUIT_CLAIMS,
  },
  {
    id: 'ananas', parts: [1.116, 1.081, 0.995, 1.011], name: 'Ananas', tex: '/tex/ananas.webp', aspect: 1.361,
    bg: '#b3c21c', ink: 'dark', piece: 'pineapple', poster: '/img/afis/ananas.webp',
    slogan: 'Tropik bir atıştırmalık',
    lead: 'Ananas, güneş sarısı ve çıtır.',
    desc: 'Ananasın mayhoş tatlılığı, hafif ve çıtır bir dokuda. Kahvaltıda, yoğurtta ya da paketten doğrudan.',
    facts: [['Net', '16 g'], ['İçindekiler', 'Ananas'], ['Biçim', 'Parça']],
    claims: ['%100 doğal', 'Katkısız'],
  },
  {
    id: 'muz', parts: [0.7, 0.86, 1.006, 1.043, 0.902], name: 'Muz', tex: '/tex/muz.webp', aspect: 1.429,
    bg: '#f2cf2f', ink: 'dark', piece: 'banana', poster: '/img/afis/muz.webp',
    slogan: 'Doğallığın yeniden keşfi',
    lead: 'Dilim dilim muz, çıtır çıtır.',
    desc: 'Muzun yumuşak tatlılığı, kurutulunca hafif ve çıtır bir atıştırmalığa dönüşür. Küçüklerin de büyüklerin de elinden düşmeyecek.',
    facts: [['Net', '16 g'], ['İçindekiler', 'Muz'], ['Biçim', 'Dilim']],
    claims: ['%100 doğal', 'Katkısız'],
  },
  {
    id: 'hindistan-cevizi', parts: [0.596, 1.033, 0.986, 1.301, 0.955, 1.091], name: 'Hindistan Cevizi', short: 'H. Cevizi', tex: '/tex/hindistancevizi.webp', aspect: 1.401,
    bg: '#6e4329', ink: 'light', piece: 'coconut', poster: '/img/afis/hindistancevizi.webp',
    slogan: 'Meyvenin değerini koruyan teknoloji',
    lead: 'Sütü, suyu ve parçalarıyla hindistan cevizi küpleri.',
    desc: 'Hindistan cevizinin sütü, suyu ve parçaları bir araya gelip dondurularak kurutuldu. Ağızda eriyen, hafif küpler.',
    facts: [['Net', '16 g'], ['H. cevizi sütü', '%42'], ['Parça · suyu', '%26 · %20']],
    claims: ['Katkı maddesi içermez', 'Atıştırmalık küpler'],
  },
  {
    id: 'dondurma', parts: [1.016, 1.014, 0.953, 0.713], name: 'Sade Dondurma', short: 'Dondurma', tex: '/tex/dondurma.webp', aspect: 1.291,
    bg: '#1d3557', ink: 'light', piece: 'icecream', poster: '/img/afis/dondurma.webp',
    slogan: 'Dondurmanın en keyifli hali',
    lead: 'Dondurma, ama elde erimeyen haliyle.',
    desc: 'Sade dondurma, dondurularak kurutulup çıtır küplere dönüştü. Ağızda yavaş yavaş dondurma tadına döner.',
    facts: [['Ürün', 'Sade dondurma'], ['Biçim', 'Küp'], ['Yöntem', 'Freeze dried']],
    claims: ['Çıtır küpler', 'Freeze dried'],
  },
];
