// Site ayarları ve ürün bilgileri. Metinler yalnızca ambalajlarda, markanın afişlerinde ve Solagron sitesinde yazan bilgilere dayanır.
export const SITE = {
  email: 'info@gencanadolugida.com.tr', // alan adı kesinleşince burayı ve index.html'deki mailto'yu güncelle
  // telefon: tel boşsa telefon düğmeleri iletişim formuna götürür. Gerçek numara gelince ikisini de doldurun.
  phone: { display: '0533 055 36 86', tel: '+905330553686' },
  whatsapp: '905330553686', // wa.me bağlantısı (başında + ve 0 olmadan)
  brand: 'Solagron',
  // yasal bilgiler: boş olanlar sitede gösterilmez. Kesinleşince doldurun.
  address: '',            // örn. 'Silifke OSB, ... Mersin'
  mersis: '',             // MERSİS no
  taxOffice: '',          // vergi dairesi
  taxNo: '',              // vergi no
  kep: '',                // KEP adresi
  mapQuery: 'Silifke Organize Sanayi Bölgesi, Mersin',
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
export const CATS = [['tum', 'Tümü']]; // tek ürün grubu: meyve (14 çeşit)

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

// ürüne özel kısa başlık, giriş ve açıklama (paket üstündeki yazılar ürünle ilgili olsun)
const TEXTS = {
 "cilek": [
  "Bütün çilek · 160 g tazeden",
  "Bütün çilek, dondurularak kurutuldu.",
  "Dişlediğiniz anda çıtırdar, ağızda erirken çileğin kendi tatlılığı ve mayhoşluğu kalır. 160 g taze çilekten tek paket; şeker eklemedik, gerek yok."
 ],
 "beyaz-ejder": [
  "Tropik · 115 g tazeden",
  "Beyaz ejder meyvesi, siyah çekirdekleriyle çıtır.",
  "Pembe kabuğunun içindeki beyaz meyve, kurutulunca hafif ve çıtır bir dokuya döner; tatlılığı yumuşak, aroması ferahtır. Kahvaltı kâselerinde ve smoothie süslemesinde rengiyle öne çıkar."
 ],
 "ananas": [
  "Tropik · 110 g tazeden",
  "Ananas, güneş sarısı ve çıtır.",
  "Ananasın mayhoş tatlılığı, hafif ve çıtır bir dokuda. Kahvaltıda, yoğurtta ya da paketten doğrudan."
 ],
 "seftali": [
  "Yaz meyvesi · dilim",
  "Yaz bahçesinden, kurutulmuş haliyle.",
  "Şeftalinin kokulu, yaz tadındaki aroması; suyu alınmış, kendisi yerinde. Şeker eklenmedi."
 ],
 "hindistan-cevizi": [
  "Sütü, suyu ve parçalarıyla",
  "Sütü, suyu ve parçalarıyla hindistan cevizi küpleri.",
  "Hindistan cevizinin sütü, suyu ve parçaları bir araya gelip dondurularak kurutuldu. Ağızda eriyen, hafif küpler."
 ],
 "ahududu": [
  "Bütün ahududu · 125 g tazeden",
  "Bütün ahududu, mayhoş ve aromatik.",
  "Şeklini koruyan, parmaklar arasında ufalanan ahududu. Lifi yüksek; tatlıların ve pastaların üzerinde rengiyle göz alır."
 ],
 "elma": [
  "İnce dilim · 100 g tazeden",
  "İnce dilim elma, suyu alınmış haliyle.",
  "Cips kadar hafif, cips kadar çıtır; ama içinde elmadan başka bir şey yok. Beslenme çantası için birebir."
 ],
 "mango": [
  "Tropik · 95 g tazeden",
  "Tropik mango, parlak rengiyle.",
  "Mangonun yoğun aroması kurutulunca daha da belirginleşir. Yoğurdun, granolanın ya da sadece avucunuzun içinde."
 ],
 "muz": [
  "Dilim muz · 76 g tazeden",
  "Dilim dilim muz, çıtır çıtır.",
  "Muzun yumuşak tatlılığı, kurutulunca hafif ve çıtır bir atıştırmalığa dönüşür. Küçüklerin de büyüklerin de elinden düşmeyecek."
 ],
 "dondurma": [
  "Sade dondurma · çıtır küp",
  "Dondurma, ama elde erimeyen haliyle.",
  "Sade dondurma, dondurularak kurutulup çıtır küplere dönüştü. Ağızda yavaş yavaş dondurma tadına döner; kampa, yola, çantaya girer."
 ],
 "dilim-cilek": [
  "İnce dilim · 160 g tazeden",
  "İnce dilim çilek, çıtır ve hafif.",
  "Çilek ince dilimlenip dondurularak kurutuldu; her dilim ağızda çıtırdayıp erir. Granola, yoğurt ve pasta süslemesi için ideal."
 ],
 "bogurtlen": [
  "Orman meyvesi · 94 g tazeden",
  "Böğürtlen, koyu rengi ve derin aromasıyla.",
  "Böğürtlenin mayhoş, hafif buruk tadı kurutulunca yoğunlaşır. 100 gramında 22,4 g lif; koyu rengiyle tatlılara ve kahvaltıya karakter katar."
 ],
 "mavi-yemis": [
  "Orman meyvesi · 125 g tazeden",
  "Mavi yemiş, küçük ama yoğun.",
  "Yaban mersininin tatlı-ekşi lezzeti, bütün haliyle kurutulmuş tanelerde. Yulafa, yoğurda ya da doğrudan avuca."
 ],
 "kirmizi-ejder": [
  "Tropik · 115 g tazeden",
  "Kırmızı ejder meyvesi, eflatun rengiyle.",
  "İçi koyu pembe ejder meyvesi, kurutulunca rengini ve hafif tatlılığını korur. Smoothie kâselerinin ve tatlıların en dikkat çeken süsü."
 ],
 "incir": [
  "Akdeniz · 76 g tazeden",
  "İncir, balımsı tatlılığıyla.",
  "İncirin bal gibi tatlılığı ve çıtır çekirdekleri, suyu alınmış hafif bir dilimde. 100 gramında 21,2 g lif."
 ],
 "lime": [
  "Narenciye · 80 g tazeden",
  "Lime dilimleri, ferah ve ekşi.",
  "Lime ince dilimlenip kurutuldu: kokteyl ve mocktail süslemesinde, çayda, sularda ve tatlılarda ferah bir dokunuş. Şeker oranı düşük."
 ],
 "fistikli-dondurma": [
  "Fıstıklı dondurma · çıtır küp",
  "Fıstıklı dondurma, elde erimeyen haliyle.",
  "Fıstıklı dondurma dondurularak kurutulup çıtır küplere dönüştü; ağızda yavaş yavaş kremamsı fıstık tadına döner."
 ]
};
// besin değerleri (Solagron ürün sayfalarındaki 'Enerji ve Besin Öğeleri' tabloları): [satır, 16 g, 100 g, %RA]
const NUTRITION = {"ahududu": [["Enerji (kJ/kcal)", "225 / 54", "1422 / 340", "%17"], ["Yağ (g)", "0,3", "1,7", "%2"], ["Doymuş yağ (g)", "0", "0", "%0"], ["Karbonhidrat (g)", "13", "81", "%31"], ["Şekerler (g)", "7", "48", "%53"], ["Lif (g)", "3", "18", "%72"], ["Protein (g)", "1,5", "9", "%18"], ["Tuz (g)", "0,1", "0,3", "%5"]], "beyaz-ejder": [["Enerji (kJ/kcal)", "263 / 63", "1548 / 352", "%20"], ["Yağ (g)", "0,5", "3,1", "%4"], ["Doymuş yağ (g)", "0,2", "1,2", "%6"], ["Karbonhidrat (g)", "11,7", "72,5", "%28"], ["Şekerler (g)", "9", "55", "%61"], ["Lif (g)", "1,6", "9,7", "%39"], ["Protein (g)", "1,1", "6,7", "%13"], ["Tuz (g)", "0", "0", "%0"]], "bogurtlen": [["Enerji (kJ/kcal)", "247 / 59", "1540 / 368", "%18"], ["Yağ (g)", "0,5", "3,1", "%4"], ["Doymuş yağ (g)", "0", "0", "%0"], ["Karbonhidrat (g)", "12,6", "79", "%30"], ["Şekerler (g)", "5,9", "37", "%41"], ["Lif (g)", "3,6", "22,4", "%89"], ["Protein (g)", "0,9", "6,2", "%12"], ["Tuz (g)", "0", "0", "%0"]], "cilek": [["Enerji (kJ/kcal)", "222 / 53", "1389 / 332", "%16"], ["Yağ (g)", "0,2", "1,1", "%2"], ["Doymuş yağ (g)", "0,1", "0,1", "%1"], ["Karbonhidrat (g)", "13,7", "85,6", "%33"], ["Şekerler (g)", "8", "50,5", "%56"], ["Lif (g)", "2,8", "17,6", "%70"], ["Protein (g)", "0,9", "5,91", "%12"], ["Tuz (g)", "0", "0,1", "%2"]], "elma": [["Enerji (kJ/kcal)", "242 / 58", "1523 / 364", "%18"], ["Yağ (g)", "0", "0,6", "%1"], ["Doymuş yağ (g)", "0", "0", "%0"], ["Karbonhidrat (g)", "15", "95", "%36"], ["Şekerler (g)", "13,7", "85,5", "%95"], ["Lif (g)", "2", "13", "%52"], ["Protein (g)", "0,2", "1,1", "%2"], ["Tuz (g)", "0", "0", "%0"]], "fistikli-dondurma": [["Enerji (kJ/kcal)", "197 / 47", "1239 / 296", "%15"], ["Yağ (g)", "3,2", "20", "%31"], ["Doymuş yağ (g)", "2,5", "16", "%80"], ["Karbonhidrat (g)", "4,3", "27", "%10"], ["Şekerler (g)", "4,3", "27", "%30"], ["Lif (g)", "0,1", "0,8", "%3"], ["Protein (g)", "0,4", "2,7", "%5"], ["Tuz (g)", "0", "0,3", "%5"]], "incir": [["Enerji (kJ/kcal)", "242 / 58", "1523 / 364", "%18"], ["Yağ (g)", "0,7", "4,4", "%6"], ["Doymuş yağ (g)", "0,1", "0,8", "%4"], ["Karbonhidrat (g)", "10,4", "65", "%25"], ["Şekerler (g)", "8,9", "56", "%62"], ["Lif (g)", "3,4", "21,2", "%85"], ["Protein (g)", "0,9", "6,2", "%12"], ["Tuz (g)", "0", "0,1", "%2"]], "kirmizi-ejder": [["Enerji (kJ/kcal)", "259 / 62", "1623 / 388", "%19"], ["Yağ (g)", "0,2", "1,1", "%2"], ["Doymuş yağ (g)", "0", "0", "%0"], ["Karbonhidrat (g)", "10,8", "67,6", "%26"], ["Şekerler (g)", "8,9", "56", "%62"], ["Lif (g)", "1,6", "9,8", "%39"], ["Protein (g)", "1,1", "6,5", "%13"], ["Tuz (g)", "0", "0", "%0"]], "lime": [["Enerji (kJ/kcal)", "230 / 55", "1435 / 343", "%17"], ["Yağ (g)", "0,18", "1,1", "%2"], ["Doymuş yağ (g)", "0", "0", "%0"], ["Karbonhidrat (g)", "11", "69", "%27"], ["Şekerler (g)", "2,9", "18", "%20"], ["Lif (g)", "3", "19", "%76"], ["Protein (g)", "0,8", "5,1", "%10"], ["Tuz (g)", "0", "0,04", "%1"]], "mango": [["Enerji (kJ/kcal)", "247 / 59", "1548 / 370", "%18"], ["Yağ (g)", "0,1", "0,7", "%1"], ["Doymuş yağ (g)", "0", "0,2", "%1"], ["Karbonhidrat (g)", "14,8", "92,5", "%35"], ["Şekerler (g)", "14,3", "89,5", "%99"], ["Lif (g)", "1,4", "8,5", "%34"], ["Protein (g)", "0,4", "2,6", "%5"], ["Tuz (g)", "0", "0", "%0"]], "mavi-yemis": [["Enerji (kJ/kcal)", "238 / 57", "1502 / 359", "%18"], ["Yağ (g)", "0,2", "1,4", "%2"], ["Doymuş yağ (g)", "0", "0", "%0"], ["Karbonhidrat (g)", "12", "75", "%29"], ["Şekerler (g)", "8", "51", "%57"], ["Lif (g)", "2,9", "18", "%72"], ["Protein (g)", "0,6", "3,7", "%7"], ["Tuz (g)", "0", "0,1", "%2"]], "muz": [["Enerji (kJ/kcal)", "234 / 56", "1489 / 356", "%18"], ["Yağ (g)", "0,1", "0,2", "%0"], ["Doymuş yağ (g)", "0", "0", "%0"], ["Karbonhidrat (g)", "14", "90", "%35"], ["Şekerler (g)", "9", "61", "%68"], ["Lif (g)", "2", "14", "%56"], ["Protein (g)", "0,7", "4,9", "%10"], ["Tuz (g)", "0", "0,2", "%3"]], "dondurma": [["Enerji (kJ/kcal)", "121 / 29", "753 / 180", "%9"], ["Yağ (g)", "1,1", "6,8", "%11"], ["Doymuş yağ (g)", "0,7", "4,5", "%22"], ["Karbonhidrat (g)", "4,1", "26", "%10"], ["Şekerler (g)", "3,3", "21", "%23"], ["Lif (g)", "0,1", "0,7", "%14"], ["Protein (g)", "0,6", "3,5", "%7"], ["Tuz (g)", "0", "0,4", "%6"]], "dilim-cilek": [["Enerji (kJ/kcal)", "222 / 53", "1389 / 332", "%16"], ["Yağ (g)", "0,2", "1,1", "%2"], ["Doymuş yağ (g)", "0,1", "0,1", "%1"], ["Karbonhidrat (g)", "13,7", "85,6", "%33"], ["Şekerler (g)", "8", "50,5", "%56"], ["Lif (g)", "2,8", "17,6", "%70"], ["Protein (g)", "0,9", "5,91", "%12"], ["Tuz (g)", "0", "0,1", "%2"]], "hindistan-cevizi": [["Enerji (kJ/kcal)", "380 / 91", "2380 / 568,8", "%28"], ["Yağ (g)", "6,5", "40,6", "%58"], ["Doymuş yağ (g)", "6", "37,5", "%188"], ["Karbonhidrat (g)", "9", "56,3", "%22"], ["Şekerler (g)", "7", "43,8", "%49"], ["İlave şeker (g)", "0,6", "3,8", "%4"], ["Lif (g)", "1", "6,3", "%21"], ["Protein (g)", "1", "6,3", "%13"]]};
FLAVORS.forEach((f) => {
  const tx = TEXTS[f.id];
  if (tx) [f.slogan, f.lead, f.desc] = tx;
  if (NUTRITION[f.id]) f.nutrition = NUTRITION[f.id];
  // 3B modelin arkasındaki meyve görseli (public/bg/<id>.webp)
  if ((!f.kit || f.kit === 'gevrek') && f.id !== 'seftali') f.backdrop = `/bg/${f.kit ? 'kit-gevrek' : f.id}.webp`;
});
// ürün akışı: Çilek → Beyaz Ejder Meyvesi → Ananas
{
  const i = FLAVORS.findIndex((f) => f.id === 'beyaz-ejder');
  FLAVORS.splice(1, 0, FLAVORS.splice(i, 1)[0]);
  const j = FLAVORS.findIndex((f) => f.id === 'ananas');
  FLAVORS.splice(2, 0, FLAVORS.splice(j, 1)[0]);
}

// Firma yalnızca meyve grubunda çalışır (14 çeşit; Trendyol'daki Solagron mağazasıyla aynı):
// dondurmalar, hindistan cevizi ve hazır gıda kitleri sitede gösterilmez.
{
  const keep = FLAVORS.filter((f) => f.cat === 'meyve');
  FLAVORS.length = 0;
  FLAVORS.push(...keep);
}

// ---------------------------------------------------------------
// İşletmeler için ürün hikâyesi: bu ürünü neden alıp satmalısınız,
// hangi satış noktasında, hangi gerekçeyle satılır.
// pitch: [başlık, hikâye, [[kanal, gerekçe] × 4]]
// Kanallar (CHANNELS): istasyon, spor, restoran, kafe, pastane, market, otel, ofis
// ---------------------------------------------------------------
export const CHANNELS = {
  istasyon: 'Akaryakıt istasyonu marketleri',
  spor: 'Spor salonları',
  restoran: 'Restoranlar',
  kafe: 'Kafeler',
  pastane: 'Pastaneler',
  market: 'Marketler ve zincirler',
  otel: 'Oteller ve kahvaltı büfeleri',
  ofis: 'Ofisler ve kurumsal ikram',
};
export const CHANNEL_ICONS = {"istasyon": "M4 21V5a2 2 0 012-2h6a2 2 0 012 2v16M3 21h12M4 10h10M14 8h2a2 2 0 012 2v6a1.5 1.5 0 003 0V9l-3-3", "spor": "M6 7v10M3 9.5v5M18 7v10M21 9.5v5M6 12h12", "restoran": "M7 3v8M5 3v5a2 2 0 004 0V3M7 11v10M17 3c-2 0-3 2.5-3 6s1 4 3 4v8", "kafe": "M4 9h13v5a5 5 0 01-5 5H9a5 5 0 01-5-5zM17 10h1.5a2.5 2.5 0 010 5H17M8 3v3M12 3v3", "pastane": "M4 20h16M5 20v-6h14v6M5 14c0-2 1.5-3 3.5-3h7c2 0 3.5 1 3.5 3M12 11V8M12 8a1.5 1.5 0 100-3 1.5 1.5 0 000 3z", "market": "M3 4h2l2.4 10.2a1 1 0 001 .8h8.9a1 1 0 001-.8L20 8H6.2M9 20a1 1 0 100-2 1 1 0 000 2zM17 20a1 1 0 100-2 1 1 0 000 2z", "otel": "M3 18V7M3 14h18v4M21 14v-2a3 3 0 00-3-3h-7v5M7 12a1.5 1.5 0 100-3 1.5 1.5 0 000 3z", "ofis": "M4 8h16v11H4zM9 8V5h6v3M4 13h16"};
const PITCH = {
  cilek: ['Rafta en kolay satılan meyve.',
    "Çilek herkesin bildiği ve sevdiği meyvedir; müşteriye anlatmanız gerekmez, paket kendini satar. 16 g’lık paket 160 g taze çilekten üretilir ve şeker eklenmez. Soğuk zincir istemediği için kasa önünde, rafta ya da büfede uzun süre bozulmadan durur. Solagron ürünleriyle yeni başlayan bir satış noktası için ilk tercih.",
    [['istasyon', 'Kasa önünde yolculuk için hafif, şeker ilavesiz bir atıştırmalık; çikolata ve cipse sağlıklı alternatif.'],
      ['spor', 'Antrenman sonrası meyve isteyen üyeler için resepsiyon ve büfede kolay satış.'],
      ['kafe', 'Granola, bowl ve milkshake’te hazır topping; yıkama, doğrama ve fire yok.'],
      ['pastane', 'Pasta, tart ve makaronda mevsimden bağımsız, her zaman aynı kalitede süsleme.']]],
  'dilim-cilek': ['Sunumda fark yaratan dilim.',
    "İnce dilim çilek, kesitindeki desenle tabakta ve vitrinde hemen dikkat çeker. Bütün çileğin tanınırlığını süslemeye hazır bir biçimle birleştirir: mutfakta yıkama, doğrama ve fire yoktur. Sunumu önemseyen işletmeler için zaman ve emek kazandırır.",
    [['pastane', 'Pasta yüzeyi, cheesecake ve tartta hazır, şık bir süsleme.'],
      ['kafe', 'Latte, sıcak çikolata ve yoğurt kâselerinin üstünde göz alıcı bir detay.'],
      ['restoran', 'Tatlı ve kahvaltı tabaklarında hazırlık gerektirmeyen dekor.'],
      ['otel', 'Kahvaltı büfesinde granola ve yoğurt yanında bozulmayan meyve.']]],
  'beyaz-ejder': ['Rafa yenilik getiren egzotik meyve.',
    "Ejder meyvesi, müşterinin rafta ikinci kez baktığı ürünlerdendir: görünüşü farklı, adı merak uyandırır. Taze hali pahalı ve çabuk bozulur; dondurularak kurutulmuş hali ise yıl boyu, fire vermeden satılır. Ürün yelpazesine yenilik katmak isteyen işletmeler için.",
    [['kafe', 'Smoothie bowl ve açaí kâselerinde menüye egzotik bir seçenek.'],
      ['spor', 'Farklı bir sağlıklı atıştırmalık arayan üyelere yeni bir tat.'],
      ['market', 'Egzotik ürün rafında dikkat çeken, merak uyandıran bir paket.'],
      ['restoran', 'Tropik tatlı tabaklarında farklı ve şık bir dokunuş.']]],
  'kirmizi-ejder': ['Rengiyle kendi reklamını yapan meyve.',
    "Koyu eflatun rengi boyadan değil, meyvenin kendisinden gelir. Bu renk tabakta, bardakta ve fotoğrafta öne çıkar; müşterinin sosyal medyada paylaştığı her fotoğraf işletmenin reklamı olur. Rengiyle menüyü canlandırmak isteyen işletmeler için.",
    [['kafe', 'Pembe smoothie, bowl ve buzlu içeceklerde fotoğraflık bir sunum.'],
      ['pastane', 'Ufalanmış haliyle kremalara boya kullanmadan doğal renk.'],
      ['restoran', 'Tatlı tabaklarında ve sorbe yanında dikkat çeken renk.'],
      ['otel', 'Kahvaltı büfesine renk katan, bozulmayan bir meyve seçeneği.']]],
  ananas: ['Taze hali zahmetli, kurusu hazır.',
    "Ananas, tatlı-ekşi dengesiyle geniş bir kitleye hitap eder. Taze ananası soymak, doğramak ve saklamak zahmetlidir; kurutulmuş ananas paketi açılır ve hazırdır. Yazın içecek menülerinde, kışın atıştırmalık rafında satılır.",
    [['istasyon', 'Yol için tropik ve hafif bir atıştırmalık; kasa önünde dikkat çeker.'],
      ['kafe', 'Mocktail, smoothie ve yoğurt kâselerinde hazır meyve.'],
      ['restoran', 'Tropik tatlılar ve soslarda hazırlık gerektirmeyen ananas.'],
      ['market', 'Kuruyemiş ve atıştırmalık rafına şeker ilavesiz bir seçenek.']]],
  seftali: ['Yaz meyvesini kışın da satın.',
    "Şeftali sezonu kısadır; sezon bitince menüden ve raftan da kalkar. Dondurularak kurutulmuş şeftali bu sınırı kaldırır: yaz meyvesini yılın her ayında satabilirsiniz. Kokulu, tanıdık ve çocukların da sevdiği bir tat.",
    [['market', 'Çocuk ve aile atıştırmalıkları rafında tanıdık, sevilen bir tat.'],
      ['kafe', 'Buzlu çay ve yoğurt kâselerinde mevsim dışında da şeftali.'],
      ['otel', 'Kahvaltı büfesinde yıl boyu aynı kalitede meyve.'],
      ['istasyon', 'Aileler ve uzun yol yolcuları için hafif bir paket.']]],
  ahududu: ['Premium görünüm, sıfır fire.',
    "Taze ahududu en hassas meyvelerdendir; birkaç gün içinde bozulur, fire oranı yüksektir. Kurutulmuş ahududu bu sorunu ortadan kaldırır: şekli bütün kalır, rengi canlıdır. Pastane ve kafelerde ürünü premium gösteren detaydır.",
    [['pastane', 'Makaron, tart ve pastalarda bozulma derdi olmadan premium süsleme.'],
      ['kafe', 'Mocha, sıcak çikolata ve granola kâselerinde hazır topping.'],
      ['restoran', 'Çikolatalı tatlıların yanında renk ve mayhoş bir denge.'],
      ['spor', '100 gramında 18 g lif; sağlıklı atıştırmalık arayan üyeler için.']]],
  elma: ['Her yaşa satılan çıtırlık.',
    "Elma cipsi, cips kadar çıtırdır ama içinde elmadan başka bir şey yoktur. Ebeveynlerin çocuklarına gönül rahatlığıyla aldığı, çalışanların masasında bulundurduğu bir atıştırmalık. Tanıdık tat, kolay satış.",
    [['istasyon', 'Arabada çocuklar için cipse sağlıklı bir alternatif.'],
      ['market', 'Çocuk atıştırmalıkları rafında ebeveynlerin güvenle seçtiği ürün.'],
      ['ofis', 'Çalışanlara sunulan ikram kutularında hafif ve sağlıklı bir seçenek.'],
      ['spor', 'Büfede antrenman sonrası hafif bir atıştırmalık.']]],
  mango: ['Her siparişte aynı mango.',
    "Mango, smoothie ve bowl menülerinin en çok istenen meyvelerindendir. Taze mangonun kalitesi mevsime ve partiye göre değişir; kurutulmuş mango her siparişte aynı rengi ve aromayı verir. Menüde standart bir lezzet, stokta öngörülebilir bir ürün.",
    [['kafe', 'Mango smoothie ve bowl’da her gün aynı tat ve renk.'],
      ['spor', 'Protein bar ve shake yanında meyveli bir atıştırmalık.'],
      ['istasyon', 'Tropik ve tatlı bir paket; kasa önünde öne çıkar.'],
      ['market', 'Atıştırmalık rafında şeker ilavesiz tropik seçenek.']]],
  muz: ['Hareketli bir günün meyvesi.',
    "Muz, sporcuların ve hareketli bir gün geçirenlerin en bilinen meyvesidir. Kurutulmuş muz çantada ezilmez, kararmaz; hafif ve çıtır bir ara öğün olur. Taze muzun aksine raf ömrü uzundur, stok kaybı yaşanmaz.",
    [['spor', 'Antrenman öncesi ve sonrası çantada ezilmeyen, kararmayan meyve.'],
      ['istasyon', 'Yolculukta pratik ve tanıdık bir ara öğün.'],
      ['ofis', 'Çalışanlar için masada bozulmadan duran meyve.'],
      ['market', 'Çocuk ve aile atıştırmalıklarında tanıdık bir tat.']]],
  bogurtlen: ['Lif bakımından en zengin seçenek.',
    "Böğürtlen, ürünlerimiz arasında 100 gramında 22,4 g lifle lif bakımından en zengin olanıdır. Sağlıklı beslenmeye dikkat eden müşteriye anlatması kolay, satışı destekleyen bir bilgidir. Koyu rengi ve mayhoş tadıyla tatlılara da karakter katar.",
    [['spor', 'Lif değeri yüksek bir atıştırmalık; beslenmeye dikkat eden üyeler için.'],
      ['kafe', 'Granola, yoğurt kâsesi ve sıcak çikolatada orman meyvesi tadı.'],
      ['pastane', 'Orman meyveli tart ve cheesecake’te bozulmayan böğürtlen.'],
      ['market', 'Sağlıklı yaşam rafında öne çıkan bir ürün.']]],
  'mavi-yemis': ['Sağlıklı beslenmenin bilinen meyvesi.',
    "Mavi yemiş (yaban mersini), sağlıklı beslenme denince akla gelen meyvelerdendir. Taze hali pahalı ve hassastır; kurutulmuş hali uzun süre saklanır ve bütün haliyle şeklini korur. Fitness menüleri ve kahvaltı kâseleri için.",
    [['spor', 'Fitness menülerinde ve büfede sağlıklı bir atıştırmalık.'],
      ['kafe', 'Bowl, granola ve muffin üstünde hazır topping.'],
      ['otel', 'Kahvaltı büfesinde yoğurt ve yulaf yanında bozulmayan meyve.'],
      ['market', 'Sağlıklı yaşam ve kahvaltılık rafında.']]],
  incir: ['Herkesin güvendiği Anadolu meyvesi.',
    "İncir, Türkiye’de herkesin bildiği ve güvendiği bir meyvedir; 100 gramında 21,2 g lifle lif bakımından da güçlüdür. Peynir tabağından kahvaltıya, şarküteri rafından otel büfesine kadar geniş bir kullanım alanı vardır.",
    [['restoran', 'Peynir ve şarküteri tabaklarında hazır, şık bir eşlikçi.'],
      ['otel', 'Kahvaltı büfesinde yıl boyu sunulabilen incir.'],
      ['market', 'Şarküteri ve kahvaltılık reyonunda tanıdık bir ürün.'],
      ['kafe', 'Kahvaltı tabağı ve granola kâselerinde.']]],
  lime: ['Barın ve kafenin yıldızı.',
    "Lime dilimleri içecek menülerinin süsüdür: limonata, soda, kokteyl ve buzlu çayda. Taze lime kesildikten sonra çabuk kurur ve kararır; kurutulmuş lime şeklini ve rengini korur, bardağa hazırdır. Bar ve kafelere hazırlık süresi ve fireden tasarruf sağlar.",
    [['kafe', 'Limonata, soda, mocktail ve buzlu çayda hazır garnitür.'],
      ['restoran', 'Kokteyl, balık ve deniz ürünleri sunumunda kurumayan lime.'],
      ['otel', 'Lobi ve havuz barında, su ve içecek servislerinde.'],
      ['spor', 'Aromalı su istasyonlarına ferah bir dokunuş.']]],
};
// sayı yazımı: '17,6' → 17.6
const num = (v) => parseFloat(String(v).replace(',', '.'));
FLAVORS.forEach((f) => {
  const st = PITCH[f.id];
  if (!st) return;
  [f.storyTitle, f.story] = st;
  f.channels = st[2].map(([k, why]) => [k, CHANNELS[k], why]);
  f.storyImg = f.backdrop || f.poster || f.tex;
  // yararları: ambalaj bilgileri ve besin değerleri tablosuna dayanır
  const n = Object.fromEntries((f.nutrition || []).map(([k, , g100]) => [k, g100]));
  const fiber = n['Lif (g)'] && num(n['Lif (g)']);
  const fat = n['Yağ (g)'] && num(n['Yağ (g)']);
  f.benefits = [
    ['Sadece meyve', 'İçinde meyveden başka bir şey yok; katkı maddesi, koruyucu ve renklendirici içermez.'],
    ['Şeker ilavesiz', 'Tatlılığı meyvenin kendi şekerinden gelir.'],
    ...(fiber >= 6 ? [['Yüksek lif', `100 gramında ${String(fiber).replace('.', ',')} g lif bulunur.`]] : []),
    ...(fat !== undefined && fat <= 3 ? [['Düşük yağ', `100 gramında ${String(fat).replace('.', ',')} g yağ bulunur.`]] : []),
    ...(FRESH[f.id] ? [['Hafif ve pratik', `16 g’lık paket, ${FRESH[f.id]} g taze meyveye karşılık gelir.`]] : [['Hafif ve pratik', 'Suyu alındığı için hafiftir; çantada, masada, tezgâhta kolayca taşınır.']]),
    ['Rengi ve aroması korunur', 'Dondurarak kurutmada meyve pişmez; rengini, kokusunu ve dokusunu korur.'],
    ['Uzun raf ömrü', 'Soğuk zincir gerekmez; serin ve kuru yerde saklanır.'],
  ];
  f.benefits = f.benefits.slice(0, 6);
});
