// Site ayarları ve ürün bilgileri. Metinler yalnızca ambalajlarda, markanın afişlerinde ve Solagron sitesinde yazan bilgilere dayanır.
export const SITE = {
  email: 'info@gencanadolugida.com.tr', // alan adı kesinleşince burayı ve index.html'deki mailto'yu güncelle
  // telefon: tel boşsa telefon düğmeleri iletişim formuna götürür. Gerçek numara gelince ikisini de doldurun.
  phone: { display: '+90 (5XX) XXX XX XX', tel: '' },
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
    id: 'seftali', parts: [0.536, 1.015, 0.855, 0.78, 0.771], name: 'Şeftali', tex: '/tex/seftali.webp', aspect: 1.424,
    bg: '#ee9a4e', ink: 'dark', piece: 'peach', poster: '/img/afis/seftali.webp',
    slogan: 'Doğal lezzetin kurutulmuş hali',
    lead: 'Yaz bahçesinden, kurutulmuş haliyle.',
    desc: 'Şeftalinin kokulu, yaz tadındaki aroması; suyu alınmış, kendisi yerinde. Şeker eklenmedi.',
    facts: [['Net', '16 g'], ['İçindekiler', 'Şeftali'], ['Biçim', 'Dilim']],
    claims: ['Sadece meyve', 'Şeker ilavesiz', '%100 doğal meyve'],
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
    id: 'hindistan-cevizi', parts: [0.596, 1.033, 0.986, 1.301, 0.955, 1.091], name: 'Hindistan Cevizi', short: 'H. Cevizi', tex: '/tex/hindistancevizi.webp', aspect: 1.401,
    bg: '#6e4329', ink: 'light', piece: 'coconut', poster: '/img/afis/hindistancevizi.webp',
    slogan: 'Meyvenin değerini koruyan teknoloji',
    lead: 'Sütü, suyu ve parçalarıyla hindistan cevizi küpleri.',
    desc: 'Hindistan cevizinin sütü, suyu ve parçaları bir araya gelip dondurularak kurutuldu. Ağızda eriyen, hafif küpler.',
    facts: [['Net', '16 g'], ['H. cevizi sütü', '%42'], ['Parça · suyu', '%26 · %20']],
    claims: ['Katkı maddesi içermez', 'Atıştırmalık küpler'],
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
    id: 'mango', parts: [0.541, 0.676, 0.545], name: 'Mango', tex: '/tex/mango.webp', aspect: 1.153,
    bg: '#f08a12', ink: 'dark', piece: 'mango',
    slogan: 'Dondurularak kurutulmuş',
    lead: 'Tropik mango, parlak rengiyle.',
    desc: 'Mangonun yoğun aroması kurutulunca daha da belirginleşir. Yoğurdun, granolanın ya da sadece avucunuzun içinde.',
    facts: [['Net', '16 g'], ['İçindekiler', '%100 mango'], ['Biçim', 'Parça']],
    claims: FRUIT_CLAIMS,
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
    id: 'dondurma', parts: [1.016, 1.014, 0.953, 0.713], name: 'Sade Dondurma', short: 'Dondurma', tex: '/tex/dondurma.webp', aspect: 1.291,
    bg: '#1d3557', ink: 'light', piece: 'icecream', poster: '/img/afis/dondurma.webp',
    slogan: 'Dondurmanın en keyifli hali',
    lead: 'Dondurma, ama elde erimeyen haliyle.',
    desc: 'Sade dondurma, dondurularak kurutulup çıtır küplere dönüştü. Ağızda yavaş yavaş dondurma tadına döner.',
    facts: [['Ürün', 'Sade dondurma'], ['Biçim', 'Küp'], ['Yöntem', 'Freeze dried']],
    claims: ['Çıtır küpler', 'Freeze dried'],
  },
];


// solagronmarket.com'daki diğer paketler (bilgiler ürün sayfalarından)
const more = (id, name, bg, src, extra = {}) => ({
  id, name, bg, ink: 'light', tex: `/tex/${id}.webp`, parts: [], aspect: 1.4,
  slogan: 'Dondurularak kurutulmuş',
  lead: `${name}, suyu alınmış haliyle.`,
  desc: `${src} Katkı maddesi, koruyucu ve renklendirici içermez; meyve en doğal haliyle freeze-drying yöntemiyle kurutuldu.`,
  facts: [['Net', '16 g'], ['İçindekiler', `%100 ${name.toLocaleLowerCase('tr')}`], ['Kaynak', src.replace(' meyvesinden üretilmiştir.', '').replace(' üretilmiştir.', '')]],
  claims: FRUIT_CLAIMS,
  ...extra,
});
FLAVORS.push(
  more('dilim-cilek', 'Dilim Çilek', '#e0525a', '160 g taze çilekten üretilmiştir.', { lead: 'İnce dilim çilek, çıtır ve hafif.' }),
  more('bogurtlen', 'Böğürtlen', '#4a3566', '94 g taze böğürtlenden üretilmiştir.'),
  more('mavi-yemis', 'Mavi Yemiş', '#3f5f91', '125 g taze mavi yemişten üretilmiştir.'),
  more('kirmizi-ejder', 'Kırmızı Ejder Meyvesi', '#5a2a5c', '115 g taze kırmızı ejder meyvesinden üretilmiştir.', { short: 'K. Ejder', facts: [['Net', '16 g'], ['İçindekiler', '%100 ejder meyvesi'], ['Kaynak', '115 g taze meyve']] }),
  more('beyaz-ejder', 'Beyaz Ejder Meyvesi', '#c2185b', '115 g taze beyaz ejder meyvesinden üretilmiştir.', { short: 'B. Ejder', facts: [['Net', '16 g'], ['İçindekiler', '%100 ejder meyvesi'], ['Kaynak', '115 g taze meyve']] }),
  more('incir', 'İncir', '#5c9a34', '76 g taze incirden üretilmiştir.'),
  more('lime', 'Lime Dilimleri', '#1f9e8f', '80 g taze lime meyvesinden üretilmiştir.', { short: 'Lime', facts: [['Net', '16 g'], ['İçindekiler', '%100 lime'], ['Kaynak', '80 g taze lime']] }),
  more('fistikli-dondurma', 'Fıstıklı Dondurma', '#8fa356', '', {
    short: 'F. Dondurma', slogan: 'Dondurmanın çıtır hali', lead: 'Fıstıklı dondurma, elde erimeyen haliyle.',
    desc: 'Fıstıklı dondurma dondurularak kurutulup çıtır küplere dönüştü. Serin ve kuru yerde saklayın; açtıktan sonra hava almayacak şekilde kapatın.',
    facts: [['Net', '16 g'], ['Ürün', 'Fıstıklı dondurma'], ['Biçim', 'Küp']], claims: ['Çıtır küpler', 'Freeze dried'],
  }),
);
// meyve parçaları (public/parca/<id>-<n>.webp) en-boy oranları
Object.assign(FLAVORS.find((f) => f.id === 'dilim-cilek'), { parts: [0.734] });
Object.assign(FLAVORS.find((f) => f.id === 'bogurtlen'), { parts: [0.686] });
Object.assign(FLAVORS.find((f) => f.id === 'mavi-yemis'), { parts: [1.004] });
Object.assign(FLAVORS.find((f) => f.id === 'kirmizi-ejder'), { parts: [0.892] });
Object.assign(FLAVORS.find((f) => f.id === 'beyaz-ejder'), { parts: [0.94] });
Object.assign(FLAVORS.find((f) => f.id === 'incir'), { parts: [0.734] });
Object.assign(FLAVORS.find((f) => f.id === 'lime'), { parts: [0.685] });
Object.assign(FLAVORS.find((f) => f.id === 'fistikli-dondurma'), { parts: [1.075] });
// bütün paketler aynı boyutta: dokular aynı tam paket oranında (1:1.40)
const FRESH = { cilek: 160, ananas: 110, ahududu: 125, elma: 100, mango: 95, muz: 76, 'dilim-cilek': 160, bogurtlen: 94, 'mavi-yemis': 125, 'kirmizi-ejder': 115, 'beyaz-ejder': 115, incir: 76, lime: 80 };
const KEEP = 'Serin ve kuru yerde saklayınız. Açtıktan sonra hava almayacak şekilde kapatınız.';
FLAVORS.forEach((f) => {
  f.aspect = 1.4;
  // ürün içeriği (Solagron ürün sayfalarındaki bilgiler)
  const ing = (f.facts.find(([k]) => k === 'İçindekiler') || [])[1];
  f.contents = [
    ['İçindekiler', f.id === 'hindistan-cevizi' ? 'Hindistan cevizi sütü %42, hindistan cevizi parçası %26, hindistan cevizi suyu %20' : /dondurma/.test(f.id) ? `${f.name}` : ing || `%100 ${f.name.toLocaleLowerCase('tr')}`],
    ['Net ağırlık', '16 g'],
    ...(FRESH[f.id] ? [['Taze meyve karşılığı', `${FRESH[f.id]} g taze meyve`]] : []),
    ['Yöntem', 'Freeze-drying (dondurularak kurutma)'],
    ...(/dondurma/.test(f.id) ? [] : [['Katkı', 'Katkı maddesi, koruyucu ve renklendirici içermez']]),
    ['Saklama', KEEP],
    ['Ambalaj', 'Kilitli doypack poşet'],
  ];
  f.cat = /dondurma/.test(f.id) ? 'tatli' : f.id === 'hindistan-cevizi' ? 'atistirmalik' : 'meyve';
});
export const CATS = [['tum', 'Tümü'], ['meyve', 'Meyveler'], ['tatli', 'Dondurmalar'], ['atistirmalik', 'Atıştırmalık'], ['kit', 'Hazır gıda']];

// Hazır gıda (ResQ): dondurularak kurutulmuş yemek kitleri. Bilgiler solagronmarket.com ürün sayfalarından.
// menu: [ürün, porsiyon, ağırlık (g), kalori (kcal)]
const KIT_DESC = 'Şeflerin günlük kalori ve protein ihtiyacı gözetilerek hazırladığı yemekler, cryo freeze-drying sistemleriyle kurutulup nem almayan özel ambalajlara kondu. Belirtilen miktarda sıcak su ekleyin; 15 dakikada yemeğiniz hazır. Acil durum, askeri kullanım, dağcılık, kamp ve bireysel tüketim için.';
export const KITS = [
  { id: 'mini-mix', name: 'Mini Mix', title: '12 Servis Hazır Gıda Kiti', img: '/img/kit/mini-mix.webp', who: '1 kişi · 3 gün', servis: 12, gram: 660, kcal: 2705, model: {"type": "crate", "w": 1.45, "h": 0.8, "d": 0.95, "la": 0.607, "lid": "#2c2c30"},
    menu: [["Sebzeli Omlet", 1, 50, 216], ["Menemen", 1, 50, 223], ["Kuru Meyveli Kahvaltılık Gevrek", 1, 75, 292], ["Sebzeli Makarna", 1, 85, 377], ["Kıymalı Ispanak Yemeği", 1, 50, 194], ["Yeşil Mercimekli Bulgur Pilavı", 1, 60, 257], ["Sebze Çorbası", 1, 35, 159], ["Kuru Fasulye", 2, 80, 135], ["Pesto Soslu Makarna", 1, 80, 410], ["Misket Köfte", 1, 45, 237], ["Yayla Çorbası", 1, 50, 205]] },
  { id: 'mini-select', name: 'Mini Select', title: '12 Servis Hazır Gıda Kiti', img: '/img/kit/mini-select.webp', who: '1 kişi · 3 gün', servis: 12, gram: 702, kcal: 3193, model: {"type": "crate", "w": 1.45, "h": 0.8, "d": 0.95, "la": 0.792, "lid": "#2c2c30"},
    menu: [["Sebzeli Omlet", 1, 50, 216], ["Menemen", 1, 50, 223], ["Kuru Meyveli Kahvaltılık Gevrek", 1, 75, 292], ["Kremalı Mantar Çorbası", 1, 50, 291], ["Kremalı Mantarlı Tavuklu Makarna", 1, 80, 370], ["Köri Soslu Makarna", 1, 80, 350], ["Yeşil Mercimekli Bulgur Pilavı", 1, 60, 257], ["Sade Dondurma", 1, 32, 132], ["Tavuk Sote", 1, 50, 210], ["Pesto Soslu Makarna", 1, 80, 410], ["Misket Köfte", 1, 45, 237], ["Yayla Çorbası", 1, 50, 205]] },
  { id: '25-servis', name: '25 Servis', title: 'Hazır Gıda Kiti', img: '/img/kit/25-servis.webp', who: '1 kişi · 5 gün', servis: 25, gram: 1492, kcal: 6568, model: {"type": "bucket", "w": 1.02, "h": 1.12, "d": 1.0, "la": 1.001, "lid": "#d81f26"},
    menu: [["Kuru Meyveli Kahvaltılık Gevrek", 2, 150, 498], ["Sebzeli Omlet", 2, 100, 431], ["Menemen", 1, 50, 224], ["Cevizli Baklava", 1, 50, 244], ["İrmik Helvası", 1, 200, 842], ["Humus", 1, 40, 214], ["Cacık", 1, 40, 184], ["Sade Dondurma", 1, 32, 132], ["Mercimek Çorbası", 2, 100, 356], ["Şehriyeli Tavuk Çorbası", 1, 40, 177], ["Kremalı Mantar Çorbası", 2, 100, 582], ["Kremalı Mantarlı Tavuklu Makarna", 1, 80, 370], ["Pesto Soslu Makarna", 1, 80, 410], ["Köri Soslu Makarna", 1, 80, 350], ["Yeşil Mercimekli Bulgur Pilavı", 2, 120, 514], ["Taze Fasulye", 1, 40, 148], ["Tavuk Sote", 2, 100, 419], ["Misket Köfte", 2, 90, 473]] },
  { id: '35-servis', name: '35 Servis', title: 'Hazır Gıda Kiti', img: '/img/kit/35-servis.webp', who: '1 kişi · 7 gün', servis: 35, gram: 1838, kcal: 8303, model: {"type": "crate", "w": 1.32, "h": 1.0, "d": 1.0, "la": 1.122, "lid": "#1c1c1f"},
    menu: [["Kuru Meyveli Kahvaltılık Gevrek", 3, 225, 900], ["Sebzeli Omlet", 3, 150, 648], ["Menemen", 1, 50, 224], ["Mercimek Çorbası", 3, 150, 534], ["Şehriyeli Tavuk Çorbası", 1, 40, 177], ["Kremalı Mantar Çorbası", 3, 150, 873], ["Kremalı Mantarlı Tavuklu Makarna", 1, 80, 370], ["Pesto Soslu Makarna", 3, 240, 1230], ["Yeşil Mercimekli Bulgur Pilavı", 3, 180, 771], ["Taze Fasulye", 2, 80, 296], ["Tavuk Sote", 2, 100, 420], ["Misket Köfte", 3, 135, 711], ["Humus", 1, 40, 214], ["Cacık", 1, 40, 184], ["İrmik Helvası", 2, 64, 270], ["Fıstıklı Dondurma", 1, 32, 122], ["Sade Dondurma", 1, 32, 132], ["Baklava", 1, 50, 227]] },
  { id: '70-servis', name: '70 Servis', title: 'Hazır Gıda Kiti', img: '/img/kit/70-servis.webp', who: '2 kişi · 7 gün', servis: 70, gram: 3676, kcal: 16606, model: null,
    menu: [["Kuru Meyveli Kahvaltılık Gevrek", 6, 450, 1800], ["Sebzeli Omlet", 6, 300, 1296], ["Menemen", 2, 100, 448], ["Mercimek Çorbası", 6, 300, 1068], ["Şehriyeli Tavuk Çorbası", 2, 80, 354], ["Kremalı Mantar Çorbası", 6, 300, 1746], ["Kremalı Mantarlı Tavuklu Makarna", 2, 160, 740], ["Pesto Soslu Makarna", 6, 480, 2460], ["Yeşil Mercimekli Bulgur Pilavı", 6, 360, 1542], ["Taze Fasulye", 4, 160, 592], ["Tavuk Sote", 4, 200, 840], ["Misket Köfte", 6, 270, 1422], ["Humus", 2, 80, 428], ["Cacık", 2, 80, 368], ["İrmik Helvası", 4, 128, 540], ["Fıstıklı Dondurma", 2, 64, 244], ["Sade Dondurma", 2, 64, 264], ["Baklava", 2, 100, 454]] },
  { id: 'gevrek', name: 'Kahvaltılık Gevrek', title: 'Kuru Meyveli · 75 g', img: '/img/kit/gevrek.webp', who: 'Su ekle, 2 dakikada hazır', servis: 1, gram: 75, kcal: 292, model: null, menu: null },
];
// kitler de 3B vitrinde: kasalar ve kova 3B model, poşetler 3B paket
const KIT_BG = { 'mini-mix': '#a3161c', 'mini-select': '#8f1d2a', '25-servis': '#b3171d', '35-servis': '#7e1418', '70-servis': '#5f646c', gevrek: '#c46a86' };
KITS.forEach((k) => {
  const pouch = !k.model;
  const f = {
    id: `kit-${k.id}`, kit: k.id, cat: 'kit', brand: 'ResQ',
    name: k.id === 'gevrek' ? 'Kahvaltılık Gevrek' : `${k.name} Hazır Gıda Kiti`, short: k.name,
    tex: k.model ? `/tex/kit-${k.id}-label.webp` : `/tex/kit-${k.id}.webp`, thumb: k.img,
    model: k.model ? { ...k.model } : null, aspect: 1.4, parts: [], bg: KIT_BG[k.id], ink: 'light',
    slogan: k.id === 'gevrek' ? 'ResQ · Dondurularak kurutulmuş' : `ResQ · ${k.title}`,
    lead: k.id === 'gevrek' ? 'Granola, gerçek meyve parçaları ve sütlü karışım; su ekleyin, 2 dakikada hazır.' : `${k.servis} servis, ${k.who}. Sıcak su ekleyin, 15 dakikada hazır.`,
    desc: k.id === 'gevrek' ? 'Özel dondurarak kurutma teknolojisiyle lezzetini ve çıtır dokusunu korur. Kamp, doğa yürüyüşü, karavan, ofis ve okul için hızlı ve besleyici bir kahvaltı. Alerjen: süt, gluten (yulaf) ve fındık içerir.' : KIT_DESC,
    facts: [['Servis', `${k.servis}`], ['Ağırlık', `${k.gram.toLocaleString('tr-TR')} g`], ['Enerji', `${k.kcal.toLocaleString('tr-TR')} kcal`]],
    claims: k.id === 'gevrek' ? ['2 dakikada hazır', 'Freeze dried', 'Süt, gluten, fındık içerir'] : ['15 dakikada hazır', 'Uzun raf ömrü', 'Yerli üretim', 'Cryo freeze-dried'],
    menu: k.menu,
    contents: k.id === 'gevrek'
      ? [['İçindekiler', 'Granola, gerçek meyve parçaları, sütlü karışım'], ['Net ağırlık', '75 g'], ['Enerji', '292 kcal'], ['Hazırlama', 'Su ekleyin, 2 dakikada tüketime hazır'], ['Alerjen', 'Süt, gluten (yulaf) ve fındık içerir'], ['Saklama', KEEP]]
      : [['Kişi / süre', k.who], ['Toplam', `${k.servis} servis · ${k.gram.toLocaleString('tr-TR')} g · ${k.kcal.toLocaleString('tr-TR')} kcal`], ['Hazırlama', 'Belirtilen miktarda sıcak su ekleyin, 15 dakikada hazır'], ['Ambalaj', k.model ? (k.model.type === 'bucket' ? 'Kapaklı, kulplu saklama kovası' : 'Kilitli kapaklı saklama kasası') : 'Kilitli, nem geçirmez poşet']],
  };
  FLAVORS.push(f);
});
