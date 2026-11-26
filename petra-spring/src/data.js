// Site ayarları ve ürün bilgileri. Metinler usepetra.com ürün sayfalarındaki bilgilere dayanır (Kasım 2026).
export const SITE = {
  name: 'Petra Spring',
  demo: true, // tanıtım sürümü: formlar markanın adresine iletilmez
  company: 'Petray İnşaat Kimya Sanayi ve Dış Ticaret Ltd. Şti.',
  email: 'eticaret@petrayltd.com.tr',
  phone: { display: '0533 959 84 68', tel: '+905339598468' },
  whatsapp: '905339598468', // wa.me bağlantısı (başında + ve 0 olmadan)
  brand: 'Petra Spring',
  shop: 'https://usepetra.com',
  instagram: 'https://www.instagram.com/usepetraspring/',
  address: 'Giyimkent 3. Sokak No: 93, Oruçreis, 34235 Esenler / İstanbul',
  mersis: '0729124405400001',
  taxOffice: '',
  taxNo: '',
  kep: 'petray@hs01.kep.tr',
  mapQuery: 'Giyimkent 3. Sokak No 93 Oruçreis Esenler İstanbul',
};

// usepetra.com Shopify varyant numaraları: Hemen satın al → /cart/<varyant>:1 (doğrudan ödeme sayfası)
const VARIANT = {"kerasus-100ml-bambu-cubuklu-oda-kokusu": 47317044363437, "miracle-100ml-bambu-cubuklu-oda-kokusu": 47317039906989, "zeus-100ml-bambu-cubuklu-oda-kokusu": 47317025685677, "keops-100ml-bambu-cubuklu-oda-kokusu": 47317008187565, "agartha-100ml-bambu-cubuklu-oda-kokusu": 47315443941549, "art-asma-oto-kokusu": 47310918090925, "star-light-asma-oto-kokusu": 47310910718125, "gulumse-asma-oto-kokusu": 47310902624429, "sirius-vatan-asma-oto-kokusu": 47310901575853, "anka-asma-oto-kokusu": 47310892925101, "petra-x-oto-kokusu": 47310876115117, "electro": 47310872182957, "forest-asma-oto-kokusu": 47310641692845, "ocean-asma-oto-kokusu": 47310600503469, "free-asma-oto-kokusu": 47310569832621, "star-dark-asma-oto-kokusu": 47310514487469, "once-vatan-asma-oto-kokusu": 47306478944429, "petra-spring-paris-100ml-bambu-cubuklu-oda-kokusu": 47287321428141, "tutti-cam-sise-premium-kalici-araba-kokusu": 46017444118701, "ocean-cam-sise-premium-kalici-araba-kokusu": 46017385136301, "aura-cam-sise-premium-kalici-araba-kokusu": 46017378877613, "yasemen-cam-sise-premium-kalici-araba-kokusu": 46017363148973, "forest-cam-sise-premium-kalici-araba-kokusu": 45991343620269};

export const fiyat = (p) => `${Number(p).toLocaleString('tr-TR', { minimumFractionDigits: 0 })} ₺`;

// ---------------------------------------------------------------
// Ürün grupları
//   kagit → asma kağıt araba kokuları (blister ambalaj, 30 güne kadar)
//   cam   → 8 ml cam şişe, bambu kapaklı araba kokuları
//   oda   → 100 ml bambu çubuklu ortam ve oda kokuları
// ---------------------------------------------------------------
export const GROUPS = {
  kagit: 'Asma kağıt araba kokuları',
  cam: 'Cam şişe araba kokuları',
  oda: 'Bambu çubuklu oda kokuları',
};
export const GROUP_SHORT = { tum: 'Tümü', kagit: 'Asma kağıt', cam: 'Cam şişe', oda: 'Oda kokusu' };
export const CATS = [['tum', 'Tümü'], ...Object.entries(GROUPS)];
export const KITS = [];

// kart: [id, ad, koku, açıklama, zemin rengi, usepetra.com adresi, en/boy]
const CARDS = [
  ['anka', 'Anka', 'Holywood', 'Holywood’un çarpıcı ve karakteristik koku dokusu; her yolculukta özgüvenli, enerjik ve etkileyici bir atmosfer.', '#3b2c5c', 'anka-asma-oto-kokusu'],
  ['ocean', 'Ocean', 'Ocean Breeze', 'Ocean Breeze’in ferah kokusuyla temiz, serin ve huzur veren bir atmosfer; her yolculukta açık denizin ferahlığı.', '#17304a', 'ocean-asma-oto-kokusu'],
  ['once-vatan', 'Önce Vatan', 'Sümbül', 'Sümbül çiçeğinin ferah, doğal ve hoş kokusu; otomobilin yanı sıra yaşam alanlarında da kullanılabilir.', '#a3080d', 'once-vatan-asma-oto-kokusu'],
  ['gulumse', 'Gülümse', 'Rebul', 'Rebul’un ferah ve hoş kokusu; temiz, canlı ve keyifli bir araç atmosferi.', '#d9a90a', 'gulumse-asma-oto-kokusu'],
  ['art', 'Art', 'Cool', 'Cool’un ferah kokusu; temiz, serin ve modern bir atmosfer, her yolculukta canlılık hissi.', '#2e245b', 'art-asma-oto-kokusu'],
  ['electro', 'Electro', 'Roch', 'Roch parfümünün ferah ve etkileyici kokusu; enerjik, modern ve sofistike bir araç atmosferi.', '#2f6f66', 'electro'],
  ['forest', 'Forest', 'Rain Forest', 'Rain Forest’ın yağmur sonrası ormanları anımsatan ferah ve doğal koku karakteri.', '#8d7138', 'forest-asma-oto-kokusu'],
  ['petra-x', 'Petra X', 'My Baby Forest', 'My Baby Forest’ın yumuşak, temiz ve ferah karakteri; doğanın huzurunu çağrıştıran sakin bir atmosfer.', '#1f3a22', 'petra-x-oto-kokusu'],
  ['sirius', 'Sirius', 'Coconut Vanilla', 'Tropikal hindistan cevizi dokusu, vanilyanın sıcak ve tatlı notalarıyla buluşuyor; yumuşak ve davetkâr.', '#b58b4c', 'sirius-vatan-asma-oto-kokusu'],
  ['free', 'Free', 'Tutti', 'Tutti’nin canlı, tatlı ve meyvemsi karakteri; her yolculuğa enerjik ve keyifli bir hava.', '#c98b14', 'free-asma-oto-kokusu'],
  ['star-light', 'Star Light', 'Jön parfüm', 'Jön parfüm esanslı, aroma özlü kokusuyla aracınıza zarif ve etkileyici bir atmosfer.', '#b3242b', 'star-light-asma-oto-kokusu'],
  ['star-dark', 'Star Dark', 'Jön parfüm', 'Jön parfüm esanslı, aroma özlü kokusu; koyu ve karakterli bir görünümle aracınıza zarif bir hava.', '#2a2723', 'star-dark-asma-oto-kokusu'],
];
// kart görsellerinin en/boy oranı (scripts/petra_info.json)
const ASPECT = { art: 2.347, 'star-light': 2.202, gulumse: 2.132, sirius: 2.37, anka: 2.29, 'petra-x': 2.327, electro: 2.063, forest: 2.297, ocean: 2.257, free: 2.247, 'star-dark': 2.408, 'once-vatan': 2.407 };

// cam şişe: [id, ad, koku notaları, açıklama, esans rengi, zemin rengi, adres]
const VIALS = [
  ['cam-aura', 'Aura', ['Modern parfüm', 'Doğu esansları', 'Oriental iz'], 'Her sürüşü sofistike bir deneyime dönüştüren oriental koku: modern parfümerinin dinamik enerjisinden Doğu’nun zengin esans geleneğine, derin ve kalıcı oriental izlere.', '#c0121f', '#2a1a12', 'aura-cam-sise-premium-kalici-araba-kokusu'],
  ['cam-ocean', 'Ocean', ['Açık deniz', 'Sahil esintisi', 'Temiz serinlik'], 'Araç içinde günlerce süren temiz, serin ve kalıcı bir okyanus hissi; açık denizin serinliğinden sahil kıyısının huzuruna.', '#2f8fe0', '#18406e', 'ocean-cam-sise-premium-kalici-araba-kokusu'],
  ['cam-tutti', 'Tutti', ['Mango · kavun', 'Kremamsı çiçek', 'Vanilya · amber'], 'Taze mango ve kavunun sulu tropikal açılışı, kremamsı çiçek kalbi ve vanilya ile amberin sıcak tabanı: üç katmanlı bir yaz deneyimi.', '#f07a12', '#c2407a', 'tutti-cam-sise-premium-kalici-araba-kokusu'],
  ['cam-yasemen', 'Yasemen', ['Yasemin tomurcuğu', 'Yasemin buketi', 'Sandal · amber'], 'Yasemin tomurcuklarının ferah açılışı, egzotik yasemin buketi ve sandal ağacı ile amberin kadifemsi kalıcılığı.', '#8a2a8c', '#5a3a7a', 'yasemen-cam-sise-premium-kalici-araba-kokusu'],
  ['cam-forest', 'Forest', ['Provence lavantası', 'Mor leylak', 'Musk · sedir'], 'Provence lavantasıyla başlayan, mor leylağın sakinleştirici dengesiyle süren ve temiz musk ile sedirle biten üç katmanlı terapi.', '#58b82a', '#1f4a2a', 'forest-cam-sise-premium-kalici-araba-kokusu'],
];

// oda kokusu: [id, ad, koku, açıklama, esans rengi, zemin rengi, adres]
const REEDS = [
  ['kerasus', 'Kerasus', 'Bambu İstanbul', 'Ferah, doğal ve sofistike bambu esansı; ev, ofis, salon ve yatak odasında huzurlu ve seçkin bir atmosfer.', '#ff5c8a', '#c25a72', 'kerasus-100ml-bambu-cubuklu-oda-kokusu'],
  ['miracle', 'Miracle', 'Rebul İstanbul', 'Ferah, modern ve sofistike esans karakteri; yaşam alanlarında gün boyu kalıcı, seçkin bir atmosfer.', '#f39a1e', '#a8702a', 'miracle-100ml-bambu-cubuklu-oda-kokusu'],
  ['zeus', 'Zeus', 'Soft Linen', 'Temiz, yumuşak ve ferah çarşaf hissi; ev ve ofiste huzurlu, sofistike bir atmosfer.', '#f2d21c', '#a68a2a', 'zeus-100ml-bambu-cubuklu-oda-kokusu'],
  ['keops', 'Keops', 'Beyaz Çiçekler', 'Ferah ve zarif beyaz çiçek esansı; yaşam alanlarına gün boyu süren çiçeksi bir ferahlık.', '#e8232f', '#b0323a', 'keops-100ml-bambu-cubuklu-oda-kokusu'],
  ['agartha', 'Agartha', 'Manolya', 'Çiçeksi ve ferah manolya esansı; salon, yatak odası ve banyoda hoş bir atmosfer.', '#2c7fe0', '#3b6f9c', 'agartha-100ml-bambu-cubuklu-oda-kokusu'],
  ['paris', 'Paris', 'Blanc', 'Özel formüllü Blanc esansı: yaşam alanlarına lüks ve tertemiz bir nefes, gün boyu ferahlık ve saflık.', '#2fbf3a', '#5f8f45', 'petra-spring-paris-100ml-bambu-cubuklu-oda-kokusu'],
];

const SERT = 'CE · ISO 9001 · ISO 14000 · GMP 22716 · Hayvan deneyi yapılmamıştır';

export const FLAVORS = [];
CARDS.forEach(([id, name, scent, desc, bg, handle]) => FLAVORS.push({
  id, name, scent, group: 'kagit', cat: 'kagit', price: '165', handle, bg, ink: 'light',
  tex: `/tex/${id}.webp`, back: `/tex/back/${id}.webp`, parts: [], aspect: 1.4,
  model: { type: 'card', aspect: ASPECT[id], head: 0.36 },
  full: `${name} Asma Oto Kokusu`,
  slogan: `${scent} esanslı · 30 gün`,
  lead: `${scent} esanslı asma kağıt araba kokusu.`,
  desc: `${desc} Yoğun esanslı yapısıyla 30 güne kadar kalıcı; asılabilir tasarımıyla pratik.`,
  facts: [['Koku', scent], ['Etki süresi', '30 güne kadar'], ['Fiyat', '165 ₺']],
  claims: ['Yoğun esans', '30 güne kadar', 'Asılabilir', 'Araç ve yaşam alanı'],
  contents: [
    ['Ürün', `Petra Spring ${name} asma oto kokusu`],
    ['Koku', scent],
    ['Biçim', 'Esans emdirilmiş asma kağıt, şeffaf poşetli blister kartta'],
    ['Etki süresi', '30 güne kadar (kullanım koşullarına göre değişir)'],
    ['Kullanım', 'Poşetin üst kısmını açın, kokuyu yavaşça dışarı çekerek yoğunluğu ayarlayın ve ipinden asın.'],
    ['Uyarı', 'Kağıdın plastik ve boyalı yüzeylere temas etmemesine dikkat edin; çocukların erişemeyeceği yerde saklayın.'],
  ],
}));
VIALS.forEach(([id, name, notes, desc, liquid, bg, handle]) => FLAVORS.push({
  id, name, scent: notes.join(' · '), notes, group: 'cam', cat: 'cam', price: '120', handle, bg, ink: 'light',
  tex: `/tex/bl/${id}.webp`, back: `/tex/bl/back/${id}.webp`, thumb: `/img/foto/${id}-0.webp`, parts: [], aspect: 1.4,
  model: { type: 'blister', aspect: 2.144, liquid, label: name },
  full: `${name} Cam Şişe Araba Kokusu`,
  slogan: '8 ml · bambu kapaklı cam şişe',
  lead: `Üç katmanlı ${name.toLocaleLowerCase('tr')} kokusu, bambu kapaklı cam şişede.`,
  desc,
  facts: [['Hacim', '8 ml'], ['Kapak', 'Bambu ahşap'], ['Fiyat', '120 ₺']],
  claims: ['Üç katmanlı koku', 'Ahşap kapaktan dengeli yayılım', 'Cam şişe', 'Asılabilir'],
  contents: [
    ['Ürün', `Petra Spring ${name} cam şişe araba kokusu`],
    ['Koku notaları', `Açılış: ${notes[0]} · Kalp: ${notes[1]} · Taban: ${notes[2]}`],
    ['Hacim', '8 ml'],
    ['Ambalaj', 'Bambu ahşap kapaklı cam şişe, askı ipi; blister kartta'],
    ['Kullanım', 'Ahşap kapağı açıp iç tıpayı çıkarın, kapağı kapatın; şişeyi kısa süre ters çevirip kapağa esans emdirin ve dikiz aynasına asın.'],
    ['Belgeler', SERT],
  ],
}));
REEDS.forEach(([id, name, scent, desc, liquid, bg, handle]) => FLAVORS.push({
  id, name, scent, group: 'oda', cat: 'oda', price: '865', handle, bg, ink: 'light',
  tex: `/tex/md/${id}.webp`, thumb: `/img/foto/${id}-0.webp`, parts: [], aspect: 1.4,
  model: { type: 'reed', liquid, label: name },
  full: `${name} 100 ml Bambu Çubuklu Oda Kokusu`,
  slogan: `${scent} · 100 ml`,
  lead: `${scent} esanslı bambu çubuklu oda kokusu.`,
  desc: `${desc} Doğal bambu çubuklar esansı ortama dengeli şekilde yayar.`,
  facts: [['Koku', scent], ['Hacim', '100 ml'], ['Fiyat', '865 ₺']],
  claims: ['Premium esans', 'Doğal bambu çubuklar', 'Gün boyu kalıcı', 'Ev ve ofis için'],
  contents: [
    ['Ürün', `Petra Spring ${name} bambu çubuklu oda kokusu`],
    ['Koku', scent],
    ['Hacim', '100 ml'],
    ['Ambalaj', 'Kare cam şişe, 5 siyah bambu çubuk, kutulu'],
    ['Kullanım', 'Şişenin kapağını açın, koruyucu tıpayı çıkarın ve çubukları şişeye yerleştirin. İlk kullanımda çubukların esansı emmesi için birkaç saat bekleyin; yoğun koku için çubukları haftada 1–2 kez ters çevirin.'],
    ['Belgeler', SERT],
  ],
}));

// ---------------------------------------------------------------
// İşletmeler için: hangi satış noktasında, hangi gerekçeyle satılır
// ---------------------------------------------------------------
export const CHANNELS = {
  istasyon: 'Akaryakıt istasyonu marketleri',
  yikama: 'Oto yıkama ve detaylı temizlik',
  servis: 'Oto servis, lastik ve aksesuar',
  galeri: 'Oto galeri ve araç kiralama',
  market: 'Marketler ve zincirler',
  ofis: 'Ofis, otel ve mağazalar',
  hediye: 'Hediyelik ve konsept mağazalar',
  eticaret: 'E-ticaret ve pazaryerleri',
};
export const CHANNEL_ICONS = {
  istasyon: 'M4 21V5a2 2 0 012-2h6a2 2 0 012 2v16M3 21h12M4 10h10M14 8h2a2 2 0 012 2v6a1.5 1.5 0 003 0V9l-3-3',
  yikama: 'M5 16l1.6-4.4A2 2 0 018.5 10h7a2 2 0 011.9 1.6L19 16M4 16h16v3H4zM7 19v1.5M17 19v1.5M8 3c0 1.2-1 1.8-1 3a1 1 0 002 0c0-1.2-1-1.8-1-3zM16 3c0 1.2-1 1.8-1 3a1 1 0 002 0c0-1.2-1-1.8-1-3z',
  servis: 'M14.5 6.5a4 4 0 00-5.2 5.2L3 18l3 3 6.3-6.3a4 4 0 005.2-5.2L15 12l-3-3z',
  galeri: 'M8 15a4 4 0 110-8 4 4 0 010 8zM11.5 12H21M18 12v3M21 12v2',
  market: 'M3 4h2l2.4 10.2a1 1 0 001 .8h8.9a1 1 0 001-.8L20 8H6.2M9 20a1 1 0 100-2 1 1 0 000 2zM17 20a1 1 0 100-2 1 1 0 000 2z',
  ofis: 'M4 8h16v11H4zM9 8V5h6v3M4 13h16',
  hediye: 'M4 11h16v9H4zM3 7h18v4H3zM12 7v13M12 7c-1.5-3-5-3-5-1s3 1 5 1zM12 7c1.5-3 5-3 5-1s-3 1-5 1z',
  eticaret: 'M4 5h16v11H4zM2 19h20M9 9l2 2 4-4',
};
const PITCH = {
  kagit: (f) => [`${f.name}: her yolculukta ${f.scent.toLocaleLowerCase('tr')} ferahlığı.`, `Petra Spring ${f.name}, ${f.scent} esanslı yoğun formülüyle aracınıza 30 güne kadar kalıcı bir koku taşır. Poşetten çektiğiniz miktarla yoğunluğu siz ayarlarsınız; ipinden dikiz aynasına asmanız yeterli. Otomobilin yanı sıra dolapta ve küçük yaşam alanlarında da kullanılabilir.`],
  cam: (f) => [`${f.name}: kaliteden ödün vermeyenler için.`, `Yolculuklarında kaliteden ödün vermeyenler için tasarlanan cam şişe asma araba kokuları, özel ahşap kapak mekanizması sayesinde kokuyu her an dengeli bir şekilde yayar. ${f.name}, ${f.notes.join(', ').toLocaleLowerCase('tr')} notalarıyla üç katmanlı bir koku yolculuğu sunar.`],
  oda: (f) => [`${f.name}: yaşam alanlarınıza zarif bir dokunuş.`, `${f.scent} esanslı ${f.name}, uzun süre hissedebileceğiniz premium bir oda kokusu deneyimi sunar. Doğal bambu çubuklar sayesinde esans ortama dengeli şekilde yayılır; ev, ofis, salon, yatak odası, banyo ve çalışma alanlarında gün boyu kalıcılığını korur.`],
};
const BENEFITS = {
  kagit: [
    ['Yoğun esans', 'Yoğun esanslı yapısıyla 30 güne kadar kalıcı koku.'],
    ['Pratik kullanım', 'Asılabilir tasarım; dikiz aynasına ya da kancaya takılır.'],
    ['Ayarlanabilir', 'Poşetten çekilen miktara göre koku yoğunluğu ayarlanır.'],
    ['Araç ve ev', 'Araçta, dolapta ve küçük yaşam alanlarında kullanılır.'],
  ],
  cam: [
    ['Üç katmanlı koku', 'Açılış, kalp ve taban notalarıyla zamanla değişen koku.'],
    ['Ahşap kapak', 'Bambu ahşap kapak esansı emer ve dengeli yayar.'],
    ['Cam şişe', '8 ml cam şişe; aracın içinde şık bir aksesuar.'],
    ['Belgeli üretim', 'CE, ISO 9001 ve GMP belgeli; hayvan deneyi yapılmamıştır.'],
  ],
  oda: [
    ['Doğal bambu çubuk', 'Esansı ortama dengeli şekilde yayar; alev ve elektrik gerekmez.'],
    ['Gün boyu kalıcı', 'Premium esans gün boyunca kalıcılığını korur.'],
    ['Her mekâna', 'Ev, ofis, salon, yatak odası, banyo ve çalışma alanları.'],
    ['Hediye kutusu', 'Kutulu, altın etiketli kare cam şişe.'],
  ],
};

// ürünlere özel arka plan sahnesi (src/backdrop.js)
const SCENE = {
  anka: 'embers', ocean: 'ocean', 'once-vatan': 'silk', gulumse: 'sun', art: 'stars', electro: 'neon',
  forest: 'forest', 'petra-x': 'pine', sirius: 'snow', free: 'fruit', 'star-light': 'velvet', 'star-dark': 'noir',
};
// oda kokuları: kokuya uygun parçacık [tür, renkler]
const ROOM_FX = {
  kerasus: ['petal', ['#ffc2d6', '#ff8fb3', '#ffe4ee']], miracle: ['dust', ['#ffd27a', '#fff1c4']], zeus: ['bokeh', ['#fff8e0', '#fff3b0']],
  keops: ['petal', ['#ffffff', '#ffe9e6']], agartha: ['petal', ['#ffffff', '#f6d6ff', '#d9ecff']], paris: ['leaf', ['#9fd36b', '#c8ec8f', '#e8ffe0']],
};

// ---------------------------------------------------------------
// Kokuyu keşfet: kokunun tarifi (3B sahnede gösterilir)
// mood: tek cümlelik his; steps: [başlık, tarif] × 3 (cam şişelerde markanın açılış / kalp / taban notaları);
// tags: karakter; meters: [ferahlık, sıcaklık, yoğunluk] 1–5
// ---------------------------------------------------------------
const SENSE = {
  anka: ['Küllerinden doğan bir ateşin sıcaklığı: cesur, çarpıcı, unutulmaz.', [['Kıvılcım', 'Holywood esintili parlak ve canlı bir açılış; ilk nefeste dikkat çeker.'], ['Alev', 'Sıcak, karakterli ve özgüvenli bir gövde; aracın içini doldurur.'], ['Kor', 'Yolculuk boyunca kalan derin, etkileyici bir iz.']], ['Sıcak', 'Karakterli', 'Enerjik'], [2, 5, 5]],
  ocean: ['Açık denizde, rüzgârın yüzünüze çarptığı o ilk an.', [['Deniz esintisi', 'Ocean Breeze’in serin, tuzlu ve temiz açılışı.'], ['Dalga', 'Ferah ve hafif; aracın havası tazelenmiş gibi gelir.'], ['Kıyı', 'Güneşte kurumuş bir sahil gibi temiz ve huzurlu bir iz.']], ['Ferah', 'Temiz', 'Serin'], [5, 1, 3]],
  'once-vatan': ['Bahar sabahı açan sümbüllerin zarif, doğal kokusu.', [['Tomurcuk', 'Sümbül çiçeğinin taze, yeşil ve ferah ilk dokunuşu.'], ['Çiçek', 'Çiçeksi, doğal ve hoş; aracı da evi de ferahlatır.'], ['Bahçe', 'Uzun süre kalan yumuşak ve temiz bir çiçek izi.']], ['Çiçeksi', 'Doğal', 'Ferah'], [4, 2, 3]],
  gulumse: ['Güneşli bir sabah, temiz çarşaflar ve iyi bir ruh hali.', [['Ferahlık', 'Rebul esintili parlak, temiz ve canlı bir açılış.'], ['Neşe', 'Keyifli ve hafif; her yolculuğa güler yüz katar.'], ['Huzur', 'Arkasında temiz ve ferahlatıcı bir his bırakır.']], ['Canlı', 'Temiz', 'Neşeli'], [5, 2, 3]],
  art: ['Serin bir gece, yıldızların altında sakin bir sürüş.', [['Serinlik', 'Cool’un ferah ve modern açılışı.'], ['Canlılık', 'Temiz ve serin bir hava; zihni açar.'], ['Modern iz', 'Hafif, şık ve kalıcı bir ferahlık.']], ['Serin', 'Modern', 'Ferah'], [5, 1, 3]],
  electro: ['Şehrin ışıkları altında enerjik, modern bir parfüm.', [['Elektrik', 'Roch parfümünün ferah ve etkileyici açılışı.'], ['Enerji', 'Dinamik ve sofistike; araca parfüm hissi verir.'], ['Şıklık', 'Temiz ve zarif bir parfüm izi.']], ['Enerjik', 'Sofistike', 'Ferah'], [4, 3, 4]],
  forest: ['Yağmurdan sonra ormanda derin bir nefes.', [['Yağmur', 'Rain Forest’ın ıslak toprak ve taze yaprak açılışı.'], ['Orman', 'Yeşil, doğal ve tazeleyici bir gövde.'], ['Yosun', 'Şehirde bile doğanın huzurunu hatırlatan bir iz.']], ['Doğal', 'Yeşil', 'Tazeleyici'], [5, 2, 3]],
  'petra-x': ['Sabahın erken saatinde, sisli bir çam ormanında yürüyüş.', [['Temizlik', 'My Baby Forest’ın yumuşak ve temiz açılışı.'], ['Orman esintisi', 'Ferah, sakin ve hafif yeşil bir karakter.'], ['Sükûnet', 'Aracınızda huzur veren yumuşak bir iz.']], ['Yumuşak', 'Temiz', 'Sakin'], [4, 2, 2]],
  sirius: ['Tropik bir sahilde, gün batımında vanilyalı bir tatlılık.', [['Hindistan cevizi', 'Kremamsı, tropikal ve davetkâr bir açılış.'], ['Vanilya', 'Sıcak ve tatlı notalar kokuyu yumuşatır.'], ['Gün batımı', 'Huzurlu, yumuşak ve sarmalayan bir iz.']], ['Tatlı', 'Kremamsı', 'Sıcak'], [2, 5, 4]],
  free: ['Yazın ilk meyve kasesi: tatlı, canlı ve özgür.', [['Meyve', 'Tutti’nin sulu ve canlı meyve açılışı.'], ['Tatlılık', 'Tatlı ve meyvemsi; yolculuğa enerji katar.'], ['Pozitif', 'Dinamik ve ferah bir koku hissi bırakır.']], ['Meyvemsi', 'Tatlı', 'Enerjik'], [4, 3, 3]],
  'star-light': ['Gala gecesi, kırmızı halıda zarif bir giriş.', [['Parıltı', 'Jön parfüm esanslı, parlak ve etkileyici açılış.'], ['Zarafet', 'Aroma özlü, karakterli ve şık bir gövde.'], ['Alkış', 'Yolculuk boyunca kalan zarif bir parfüm izi.']], ['Zarif', 'Parfümsü', 'Karakterli'], [3, 3, 4]],
  'star-dark': ['Gece yarısı, siyah takım ve sessiz bir özgüven.', [['Gölge', 'Jön parfüm esanslı, derin ve etkileyici açılış.'], ['Karakter', 'Aroma özlü, koyu ve maskülen bir gövde.'], ['Gece', 'Uzun süren güçlü ve karakterli bir iz.']], ['Koyu', 'Maskülen', 'Etkileyici'], [2, 4, 5]],
  'cam-aura': ['Her sürüşü bir prestij anına çeviren oriental bir büyü.', [['Açılış · modern parfüm', 'Modern parfümerinin dinamik ve enerjik ilk dokunuşu.'], ['Kalp · Doğu esansları', 'Doğu’nun zengin esans geleneği; sofistike ve lüks.'], ['Taban · oriental iz', 'Derin, sıcak ve kalıcı oriental izler.']], ['Oriental', 'Lüks', 'Derin'], [2, 5, 5]],
  'cam-ocean': ['Günlerce süren temiz, serin ve kalıcı bir okyanus hissi.', [['Açılış · açık deniz', 'Açık denizin serinliği; ilk nefeste ferahlık.'], ['Kalp · sahil esintisi', 'Kıyıya vuran dalgalar, temiz ve hafif bir hava.'], ['Taban · temiz serinlik', 'Sahil kıyısının huzuru; uzun süren tazelik.']], ['Ferah', 'Serin', 'Temiz'], [5, 1, 3]],
  'cam-tutti': ['Tropik meyve bahçesinden güneşli bir yaz gününe.', [['Açılış · mango ve kavun', 'Taze mango ve kavunun sulu, tropikal patlaması.'], ['Kalp · kremamsı çiçek', 'Olgun meyve ve kremamsı çiçeklerle dolu bir kalp.'], ['Taban · vanilya ve amber', 'Sıcak ve yumuşak vanilya, amber tabanı.']], ['Tropikal', 'Meyvemsi', 'Yaz'], [4, 4, 4]],
  'cam-yasemen': ['Akdeniz gecesinde, çiçek açmış bir yasemin bahçesi.', [['Açılış · yasemin tomurcuğu', 'Yasemin tomurcuklarının ferah ve canlı açılışı.'], ['Kalp · yasemin buketi', 'Egzotik ve büyüleyici bir yasemin buketi.'], ['Taban · sandal ve amber', 'Sandal ağacı ve amberin kadifemsi kalıcılığı.']], ['Çiçeksi', 'Romantik', 'Zarif'], [3, 4, 4]],
  'cam-forest': ['Lavanta tarlasından sakin bir spa anına uzanan terapi.', [['Açılış · Provence lavantası', 'Aromatik lavantanın canlandırıcı ilk dokunuşu.'], ['Kalp · mor leylak', 'Sakinleştirici, pudralı bir leylak dengesi.'], ['Taban · musk ve sedir', 'Temiz musk ve sedirle zarif bir bitiş.']], ['Aromatik', 'Sakin', 'Temiz'], [4, 2, 3]],
  kerasus: ['İstanbul’da bir bambu bahçesinde sakin bir öğleden sonra.', [['Bambu', 'Ferah, doğal ve yeşil bir açılış.'], ['Sofistike', 'Gün boyu dengeli yayılan zarif bir koku.'], ['Huzur', 'Evi ve ofisi saran sakin, seçkin bir atmosfer.']], ['Ferah', 'Doğal', 'Zarif'], [4, 2, 3]],
  miracle: ['Işığın içeri dolduğu, modern ve aydınlık bir salon.', [['Ferahlık', 'Rebul esintili temiz ve modern açılış.'], ['Modern', 'Sofistike, dengeli ve kalıcı bir karakter.'], ['Seçkinlik', 'Mekâna gün boyu süren seçkin bir hava.']], ['Modern', 'Temiz', 'Sofistike'], [4, 3, 3]],
  zeus: ['Güneşte kurumuş, yeni serilmiş temiz çarşaflar.', [['Temiz pamuk', 'Soft Linen’in yumuşak ve temiz açılışı.'], ['Yumuşaklık', 'Hafif, pudramsı ve ferah bir gövde.'], ['Huzur', 'Evde sakin ve sofistike bir atmosfer.']], ['Temiz', 'Yumuşak', 'Ferah'], [5, 2, 2]],
  keops: ['Bembeyaz çiçeklerle dolu, zarif bir vazo.', [['Beyaz çiçek', 'Ferah ve zarif çiçek açılışı.'], ['Buket', 'Yumuşak, çiçeksi ve sofistike bir kalp.'], ['Zarafet', 'Gün boyu süren hafif bir çiçek izi.']], ['Çiçeksi', 'Zarif', 'Ferah'], [4, 2, 3]],
  agartha: ['Baharda açan manolyaların kremamsı, ferah kokusu.', [['Manolya', 'Çiçeksi ve ferah bir manolya açılışı.'], ['Kremamsı çiçek', 'Yumuşak ve sarmalayan bir kalp.'], ['Hoş atmosfer', 'Salonda ve yatak odasında hoş bir iz.']], ['Çiçeksi', 'Kremamsı', 'Hoş'], [4, 3, 3]],
  paris: ['Paris’te bir otel odası: lüks, beyaz ve tertemiz.', [['Blanc', 'Özel formüllü, tertemiz ve parlak bir açılış.'], ['Saflık', 'Gün boyu süren ferahlık ve saflık hissi.'], ['Lüks', 'Yaşam alanlarına lüks bir nefes.']], ['Temiz', 'Lüks', 'Ferah'], [5, 2, 3]],
};

export const VIDEO_MAP = {};
export const VIDEOS = [];

FLAVORS.forEach((f) => {
  f.short = f.name.length > 10 ? f.name.split(' ')[0] : undefined;
  f.md = `/tex/md/${f.id}.webp`;
  f.mini = `/tex/mini/${f.id}.webp`;
  f.shopUrl = `${SITE.shop}/products/${f.handle}`;
  f.buy = VARIANT[f.handle] ? `${SITE.shop}/cart/${VARIANT[f.handle]}:1` : f.shopUrl;
  const [t, s] = PITCH[f.group](f);
  f.storyTitle = t; f.story = s;
  f.benefits = BENEFITS[f.group];
  f.usage = (f.contents.find(([k]) => k === 'Kullanım') || [, ''])[1];
  // hikâye görseli: oda ve cam şişede yaşam alanı fotoğrafı, kartlarda ambalaj
  f.storyImg = f.group === 'kagit' ? f.tex : `/img/foto/${f.id}-1.webp`;
  { const [mood, steps, tags, meters] = SENSE[f.id]; f.sense = { mood, steps, tags, meters }; }
  if (f.group === 'kagit') f.scene = SCENE[f.id];
  else {
    f.scene = 'photo';
    f.bgPhoto = `/img/foto/${f.id}-1.webp`;
    if (f.group === 'oda') { f.bgCrop = [0, 0.04, 0.36, 0.92]; f.bgBlur = 10; [f.particle, f.sceneColors] = ROOM_FX[f.id]; f.sceneN = 40; }
    else { f.bgBlur = 12; f.particle = 'bokeh'; f.sceneColors = [f.model.liquid, '#ffffff']; }
  }
  f.photos = f.group === 'kagit' ? [f.tex, f.back] : [`/img/foto/${f.id}-0.webp`, `/img/foto/${f.id}-1.webp`];
});
