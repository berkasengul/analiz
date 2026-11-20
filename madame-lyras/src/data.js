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
// Her ürünün hikâyesi ve restoran / kafe / pastanede kullanımı.
// story: [başlık, metin]; uses: [restoran, kafe, pastane]
// ---------------------------------------------------------------
const STORIES = {
  cilek: [['Haziranı paketledik.', "Çileğin en güzel hali, dalında kızardığı o kısa haftalardır. Biz o haftaları pakete aldık: olgun çilek bütün haliyle dondurulur, içindeki su buz olarak çekilir; geriye rengi, kokusu ve çıtır bir doku kalır. Kış ortasında açtığınız paketten yine haziran kokar."],
    ['Tatlı tabaklarında süsleme, peynir tabağı ve salatalarda renk', 'Granola ve yoğurt kâsesi, smoothie bowl, milkshake üstü', 'Pasta ve tart üstü, ufalanmış haliyle krema ve makaron dolgusu']],
  'dilim-cilek': [['İçindeki kalbi gösteren dilim.', "Aynı olgun çilek, bu kez ince dilimlerle. Her dilim kurutulunca bir yaprak kadar hafifler; kesiti, çileğin içindeki o kalp desenini olduğu gibi gösterir. Sunumda göz, ağızda çıtırtı arayanlar için."],
    ['Tatlı ve kahvaltı tabaklarında dekor', 'Latte, sıcak çikolata ve yoğurt kâsesi üstü', 'Pasta yüzeyi, cheesecake ve tart süslemesi']],
  'beyaz-ejder': [['Kabuğunun altındaki sürpriz.', "Ejder meyvesi, pullu pembe kabuğuyla tezgâhın en dikkat çeken meyvesidir; asıl sürpriz ise içindedir: siyah çekirdeklerle bezeli bembeyaz bir meyve. Kurutulunca o desen bozulmaz, tadı yumuşak ve ferah kalır."],
    ['Tropik tatlı tabakları, salatalarda farklı bir dokunuş', 'Smoothie bowl, açaí kâsesi ve buzlu içecekler', 'Egzotik tart, pavlova ve mus süslemesi']],
  'kirmizi-ejder': [['Rengi boyadan değil, meyveden.', "Kırmızı ejder meyvesinin içi, adının hakkını veren koyu bir eflatundur. Bu renk hiçbir boyadan gelmez; meyvenin kendisidir. Dondurarak kurutma o rengi soldurmadan saklar; tabağa koyduğunuz anda sunumun rengi değişir."],
    ['Renkli tatlı tabakları, sorbe ve dondurma yanında', 'Pembe smoothie, bowl ve buzlu çay', 'Ufalanmış haliyle doğal renkli krema, makaron ve tart süslemesi']],
  ananas: [['Güneşin tadı, yıl boyu.', "Ananas, tatlılığı ile ekşiliği arasındaki dengeyle tanınır. Kurutulunca bu denge kaybolmaz, yoğunlaşır. Parça parça, çıtır ve hafif: tropik bir tadı yılın her günü tezgâhınızda tutmanın en kolay yolu."],
    ['Tropik tatlılar, soslar ve salatalar', 'Smoothie, mocktail süsü ve yoğurt kâsesi', 'Tropik kek, tart ve dondurma üstü']],
  seftali: [['Yaz bahçesinin kokusu.', "Şeftali, yazın kokusudur; olgunlaştığında bütün bahçeyi sarar. O kokuyu kışa taşımak için dilimlerini dondurup suyunu buz olarak çektik. Paketi açtığınızda gelen ilk şey, yine o yaz bahçesidir."],
    ['Peynir tabağı, salata ve tatlı tabakları', 'Buzlu çay, yoğurt kâsesi ve kahvaltı tabağı', 'Şeftalili tart, kek ve krema']],
  ahududu: [['Hasat gününün tadında.', "Ahududu, dalından koparıldığı gün en güzelidir; ertesi gün bile aynı değildir. Bu yüzden onu olgunluğunun tam zirvesinde, bütün haliyle donduruyoruz. Parmaklar arasında ufalanan mayhoş, kokulu taneler hasat gününü anlatır."],
    ['Çikolatalı tatlıların yanında, sos ve süsleme', 'Mocha ve sıcak çikolata üstü, granola kâsesi', 'Makaron, tart ve pasta süslemesi; ufalanmış haliyle krema']],
  elma: [['Çocukluğun meyvesi, çıtır haliyle.', "Elma, hepimizin çocukluk meyvesidir. Onu ince dilimledik ve dondurarak kuruttuk: cips kadar hafif, cips kadar çıtır, ama içinde elmadan başka bir şey yok. Masada, tabakta, çantada; sade ve tanıdık bir lezzet."],
    ['Peynir tabağı, salatalarda çıtırlık', 'Çay ve kahve yanında atıştırmalık, yulaf kâsesi', 'Tarçınlı tart, kek ve kurabiye süslemesi']],
  mango: [['Altın sarısı bir aroma.', "Mango, tropiklerin en kokulu meyvelerinden biridir; olgunlaştığında rengi altına döner. Kurutulunca aroması kaybolmaz, yoğunlaşır. Her parça, mangonun en olgun halini taşır."],
    ['Tropik tatlılar, salata ve soslar', 'Mango smoothie, bowl ve buzlu içecekler', 'Mangolu cheesecake, mus ve tart süslemesi']],
  muz: [['Tanıdık meyve, yeni doku.', "Muz, en tanıdık meyvelerdendir; ama çıtır hali pek bilinmez. Dondurularak kurutulan muz dilimleri hafifler, tatlılığını korur ve ağızda yumuşacık erir. Küçükler için de büyükler için de pratik bir ara öğün."],
    ['Kahvaltı tabağı ve tatlıların yanında', 'Yulaf kâsesi, smoothie ve pankek üstü', 'Muzlu kek, tart ve çikolata kaplama']],
  bogurtlen: [['Çalıların arasından gelen renk.', "Böğürtlen, çalılar arasında kendiliğinden büyüyen yaban bir meyvedir; parmakları morartan o koyu renkle tanınır. Kurutulunca mayhoş ve hafif buruk tadı yoğunlaşır; tabağa derin bir renk ve karakter katar."],
    ['Et yemekleri için sos, peynir tabağı', 'Granola, yoğurt kâsesi ve sıcak çikolata', 'Orman meyveli tart, cheesecake ve pasta süslemesi']],
  'mavi-yemis': [['Küçük tane, büyük lezzet.', "Mavi yemiş, küçük taneleriyle büyük bir lezzet taşır; tatlı ile ekşi arasında ince bir çizgide durur. Bütün haliyle kurutulan taneler yuvarlak şeklini korur. Yulafın, yoğurdun ve kahvaltının en sevilen eşlikçisi."],
    ['Kahvaltı tabağı, salata ve tatlı süsü', 'Bowl, granola ve muffin üstü', 'Muffin, cheesecake ve tart süslemesi']],
  incir: [['Anadolu’nun bal tadı.', "İncir, Anadolu'nun en eski meyvelerinden biridir; bal gibi tatlılığı ve çıtır çekirdekleriyle tanınır. Taze inciri uzun süre saklamak zordur; dondurarak kurutma onu ilk günkü tadıyla tutar. Hafif bir dilimde, bütün Akdeniz."],
    ['Peynir ve şarküteri tabağı, salata', 'Kahvaltı tabağı, yoğurt ve granola', 'İncirli tart, kek ve kurabiye']],
  lime: [['Bardağa düşen ferahlık.', "Lime, küçük ama keskin bir meyvedir; kokusu bulunduğu yere yayılır. İnce dilimlenip kurutulan lime, şeklini ve rengini korur; bardağa düştüğünde hem göze hem damağa ferahlık verir."],
    ['Balık ve deniz ürünleri sunumu, kokteyl süsü', 'Limonata, soda, mocktail ve buzlu çay', 'Limonlu tart, cheesecake ve kek süslemesi']],
};
// sayı yazımı: '17,6' → 17.6
const num = (v) => parseFloat(String(v).replace(',', '.'));
FLAVORS.forEach((f) => {
  const st = STORIES[f.id];
  if (!st) return;
  [f.storyTitle, f.story] = st[0];
  f.uses = st[1];
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
