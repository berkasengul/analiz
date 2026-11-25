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
  tex: `/tex/md/${id}.webp`, thumb: `/img/foto/${id}-0.webp`, parts: [], aspect: 1.4,
  model: { type: 'vial', liquid, label: name },
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
const CH_CARD = [
  ['istasyon', 'Kasa önü standında en çok dönen ürün: 165 ₺’lik fiyatla anlık alım, yakıt alan her sürücü potansiyel müşteri.'],
  ['yikama', 'Yıkama sonrası “arabanız mis gibi koksun” teklifi; temizlik hizmetine eklenen kolay bir satış.'],
  ['servis', 'Bakımdan çıkan araca hediye ya da tezgâh üstü satış; servis markanızla birlikte hatırlanır.'],
  ['market', 'Oto aksesuar rafında 12 farklı tasarım; renkli kartlar askılı standda kendini satar.'],
];
const CH_VIAL = [
  ['istasyon', 'Premium ürün arayan sürücü için kasa önünde cam şişe; kağıt kokudan bir üst segment.'],
  ['galeri', 'Teslim edilen araçta Petra kokusu: galeri ve kiralama firmaları için şık bir karşılama detayı.'],
  ['yikama', 'Detaylı temizlik paketlerine eklenen kalıcı koku; ahşap kapaklı cam şişe aracın içinde güzel görünür.'],
  ['hediye', 'Ahşap kapaklı, ipli cam şişe: hediye ve konsept mağazalarda kasa yanı ürünü.'],
];
const CH_REED = [
  ['ofis', 'Resepsiyon, toplantı odası ve mağaza girişinde gün boyu süren koku; kurumsal ikram olarak da uygun.'],
  ['hediye', 'Kutulu, altın etiketli 100 ml şişe; hediye ve ev dekorasyonu mağazalarında vitrin ürünü.'],
  ['market', 'Ev bakım ve dekorasyon rafında premium segment; altı farklı renk rafı canlandırır.'],
  ['eticaret', 'Kutulu, sağlam ambalaj; e-ticaret ve pazaryerlerinde kargoya uygun.'],
];
const PITCH = {
  kagit: (f) => [`Kasa önünde kendini satan ${f.name}.`, `${f.name}, ${f.scent} esanslı yoğun formülüyle 30 güne kadar kalıcı bir asma oto kokusu. Renkli blister kartı askılı standda dikkat çeker, 165 ₺’lik fiyatı anlık alımı kolaylaştırır. 12 farklı tasarım bir arada sergilendiğinde müşteri kendi kokusunu seçer.`, CH_CARD],
  cam: (f) => [`${f.name}: cam şişede premium araç kokusu.`, `Bambu ahşap kapaklı 8 ml cam şişe, kokuyu kapaktan dengeli yayar. ${f.name} üç katmanlı notalarıyla (${f.notes.join(', ').toLocaleLowerCase('tr')}) kağıt kokudan bir üst segmentte; şık görünümüyle hediye ve teslimat anlarında da tercih edilir.`, CH_VIAL],
  oda: (f) => [`${f.name}: mekânın imza kokusu.`, `${f.scent} esanslı 100 ml oda kokusu, 5 siyah bambu çubukla gün boyu yayılır. Altın etiketli kare cam şişe ve kutusuyla resepsiyon, mağaza ve ev için hem koku hem dekor; hediye olarak da kolay satılır.`, CH_REED],
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

export const VIDEO_MAP = {};
export const VIDEOS = [];

FLAVORS.forEach((f) => {
  f.short = f.name.length > 10 ? f.name.split(' ')[0] : undefined;
  f.md = `/tex/md/${f.id}.webp`;
  f.mini = `/tex/mini/${f.id}.webp`;
  f.buy = `${SITE.shop}/products/${f.handle}`;
  const [t, s, ch] = PITCH[f.group](f);
  f.storyTitle = t; f.story = s;
  f.channels = ch.map(([k, why]) => [k, CHANNELS[k], why]);
  f.benefits = BENEFITS[f.group];
  // hikâye görseli: oda ve cam şişede yaşam alanı fotoğrafı, kartlarda ambalaj
  f.storyImg = f.group === 'kagit' ? f.tex : `/img/foto/${f.id}-1.webp`;
  f.photos = f.group === 'kagit' ? [f.tex, f.back] : [`/img/foto/${f.id}-0.webp`, `/img/foto/${f.id}-1.webp`];
});
