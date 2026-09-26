// Hope Istanbul koku serisi (konsept). İsimler ve notalar markanın
// yayımlanmış ürün bilgilerinden; açıklamalar ve fiyatlar örnek. `color`
// kokunun arayüzdeki vurgu rengi (halka, düğmeler). `theme` her kokunun kendi
// sahnesi: `glow` arka plandaki ışık, `edge` kenar karanlığı, `drop` açılışta
// süzülen esans damlalarının rengi. Şişe dokuları assets/labels altında.
export const flavors = [
  {
    name: "Han",
    collection: null,
    family: "Odunsu baharatlı",
    year: 2022,
    perfumer: "Gökhan Şimşek",
    color: "#3fae7e",
    ink: "#155a40",
    theme: { glow: "#1f6a4a", edge: "#020a06", drop: "#9fe0c0", mood: "warm" },
    tagline: "Baharat kokan han avluları.",
    notes: ["Limon", "Tarçın", "Paçuli", "Sedir", "Amber"],
    description: "Markanın ilk kokularından; eski İstanbul hanlarının taş avlularını anımsatan odunsu, baharatlı bir koku. Limonla açılır, tarçın ve sedirle ısınır, amber ve miskle tende kalır.",
  },
  {
    name: "Queen of Palace",
    collection: "Two Continents One Love",
    family: "Çiçeksi meyveli",
    year: 2025,
    perfumer: null,
    color: "#e6c46a",
    ink: "#6b4a10",
    theme: { glow: "#a8802e", edge: "#0c0903", drop: "#f3dc98", mood: "warm" },
    tagline: "Sarayın kraliçesi, iki kıtanın aşkı.",
    notes: ["Gül", "Yasemin", "Mango", "Vanilya", "Amber"],
    description: "Gül, yasemin ve mangoyla açılan, ihtişam ve cazibe dolu bir buket. Vanilya ve amber tabanı kalıcılığı ve sıcaklığı temsil eder; iki kıtayı birleştiren bir aşkın kokusu.",
  },
  {
    name: "Narcissus",
    collection: "Historical Peninsula",
    family: "Beyaz çiçekli",
    year: 2022,
    perfumer: "Gökhan Şimşek",
    color: "#d9506e",
    ink: "#7a1428",
    theme: { glow: "#7a1428", edge: "#0e0305", drop: "#f0a0b0", mood: "warm" },
    tagline: "Tarihi Yarımada'da bir bahar sabahı.",
    notes: ["Çarkıfelek", "Sümbülteber", "Beyaz çiçekler", "Vanilya"],
    description: "Çarkıfelek ve mandalinayla ışıyan, sümbülteber ve beyaz çiçeklerle açan, vanilya ve beyaz miskle yumuşayan aydınlık bir koku.",
  },
  {
    name: "Grand Conqueror",
    collection: null,
    family: "Pudralı odunsu",
    year: 2025,
    perfumer: "Gökhan Şimşek",
    color: "#7f9cf0",
    ink: "#1c2c68",
    theme: { glow: "#2c4596", edge: "#03050e", drop: "#b0c4f5", mood: "cool" },
    tagline: "Liderliğin zamansız karizması.",
    notes: ["Bergamot", "İris", "Günlük", "Vetiver", "Amber"],
    description: "Bergamot, iris ve günlük ruhu yükselten güçlü akorlar kurar; vetiver ve amberle zamansız bir karizmaya dönüşür.",
  },
  {
    name: "Deep Secret",
    collection: "Wonders of Istanbul",
    family: "Çiçeksi deniz",
    year: 2025,
    perfumer: "Julien Rasquinet",
    color: "#4fc0c8",
    ink: "#0c5c68",
    theme: { glow: "#0f6a74", edge: "#020a0b", drop: "#a0e4ea", mood: "cool" },
    tagline: "Boğaz'ın en derin sırrı.",
    notes: ["Hibiskus", "Şakayık", "Deniz notaları", "Manolya", "Kaşmiran"],
    description: "İstanbul'un ruhunda saklı hikâyeleri anlatır. Hibiskus, şakayık ve şeftali deniz esintisiyle buluşur; yasemin, menekşe ve manolyadan sonra kaşmiran ve sandal ağacına iner.",
  },
  {
    name: "N.E.C.O",
    collection: null,
    family: "Baharatlı ozonik",
    year: 2022,
    perfumer: "Gökhan Şimşek",
    color: "#e2764e",
    ink: "#8a3418",
    theme: { glow: "#9a3a1e", edge: "#0e0503", drop: "#f2b090", mood: "warm" },
    tagline: "Galata'dan Tophane'ye asi ve zarif.",
    notes: ["Bergamot", "Ardıç", "Zencefil", "Bal", "Sandal"],
    description: "Yoğun baharat notaları ve ozonik ferahlık, Galata'dan Tophane'ye uzanan sokakların asi ve zarif ruhunu taşır.",
  },
  {
    name: "Forza",
    collection: "7 Tepe",
    family: "Aromatik misk",
    year: 2024,
    perfumer: null,
    color: "#a07ae0",
    ink: "#4b2a7a",
    theme: { glow: "#4b2a7a", edge: "#06030e", drop: "#d0bdf2", mood: "cool" },
    tagline: "Yedi tepenin modern klasiği.",
    notes: ["Narenciye", "Menekşe", "Lavanta", "Beyaz misk"],
    description: "Narenciye ve menekşeyle açılan modern bir klasik. Lavanta ve beyaz misk saflığı ve zarafeti bir araya getirir.",
  },
  {
    name: "Submarine",
    collection: null,
    family: "Meyveli odunsu",
    year: 2024,
    perfumer: null,
    color: "#5a9af5",
    ink: "#1c54a8",
    theme: { glow: "#1f55a8", edge: "#02050e", drop: "#a8c4f8", mood: "cool" },
    tagline: "Boğaz'ın derinliklerinden.",
    notes: ["Armut", "Portakal çiçeği", "Zencefil", "Gül", "Vetiver"],
    description: "Limon, armut ve portakal çiçeğiyle ışıldar; pembe biber, zencefil ve gülle derinleşir, paçuli ve vetiverle tende kalır.",
  },
];

export const specs = "Extrait de Parfum · 100 ml";

// Detay görünümündeki özellik hikâyeleri. `pose`, şişenin o özellikte nasıl
// duracağı: rotY = π/2 notalar paneli, -π/2 hikâye paneli.
export const features = [
  {
    icon: "drop",
    short: "%30 esans",
    kicker: "%30",
    struck: "Eau de toilette",
    title: "Extrait de Parfum",
    text: "Her koku en yüksek yoğunlukta, %30 esans oranıyla hazırlanır. Tende saatlerce, kumaşta günlerce kalır.",
    pose: { rotY: 0.03, rotZ: 0.02, y: -0.3, scale: 2.3 },
  },
  {
    icon: "star",
    short: "Sekiz köşeli yıldız",
    kicker: "Altın",
    struck: "Sıradan bir etiket",
    title: "Şişede İstanbul geometrisi",
    text: "Altın ve siyah etiketteki sekiz köşeli yıldız, İstanbul'un çinilerini ve kündekari kapılarını hatırlatır. Kalın cam, onu bir mücevher gibi taşır.",
    pose: { rotY: 0.55, rotZ: 0.02, y: 0.1, scale: 2.1 },
  },
  {
    icon: "leaf",
    short: "Koku piramidi",
    kicker: "Üç",
    struck: "Tek boyutlu koku",
    title: "Üç katlı bir hikâye",
    text: "Üst notalar ilk dakikaları, kalp notaları ilk saatleri, taban notaları günün sonunu anlatır. Şişeyi çevir: hepsi arka etikette.",
    pose: { rotY: Math.PI + 0.04, rotZ: 0.02, y: -0.3, scale: 2.3 },
  },
  {
    icon: "bottle",
    short: "Parfümörler",
    kicker: "Usta",
    struck: "Seri üretim",
    title: "Usta parfümörler",
    text: "Kokular Gökhan Şimşek ve Amouage, Creed, Frederic Malle için de çalışmış Julien Rasquinet'nin imzasını taşır.",
    pose: { rotY: -0.5, rotZ: 0.02, y: -2.3, scale: 2.3 },
  },
];

// Ritüel bölümündeki adımlar. Şişe her adımda farklı bir poza ve kokuya geçer.
export const ritual = [
  {
    title: "Nabız noktaları",
    flavor: 0,
    text: "Bilek içi, boyun ve kulak arkası: sıcak noktalar kokuyu gün boyu yayar.",
    stat: "3 nokta",
  },
  {
    title: "Ovuşturma",
    flavor: 1,
    text: "Sıktıktan sonra bileklerini birbirine sürtme; üst notalar kendi hızında açılsın.",
    stat: "15 cm",
  },
  {
    title: "Katmanla",
    flavor: 4,
    text: "Hope Istanbul kokuları birbiriyle özgürce birleştirilebilir. İki kokuyu üst üste sık, kendi imzanı yarat.",
    stat: "1 + 1",
  },
];

// Mağaza boyutları: `size` ml cinsinden.
export const packs = [
  { size: 10, price: 1490, label: "Seyahat" },
  { size: 50, price: 5900, label: "Günlük" },
  { size: 100, price: 9500, label: "En popüler" },
];

export const SUB_DISCOUNT = 0; // hediye paketi ücretsiz, indirim yok
export const FREE_SHIPPING = 5000;
export const SHIPPING = 99.9;
export const VARIETY = "variety";
export const DEFAULT_SHOP_FLAVOR = 1; // Queen of Palace

// Nerede bulunur. Üçüncü sütun durum etiketi.
export const stockists = [
  ["İstanbul", "Hope Istanbul by Serimu · resmi satış", "Açık"],
  ["Online", "hopeistanbulofficial.com", "Online"],
  ["Uluslararası", "Lodore, Level Perfume ve seçkin niş parfümeriler", "Açık"],
  ["Milano", "Esxence 2024 · dünya lansmanı", "Fuar"],
];

// Marka hikâyesi: yayımlanmış bilgiler.
export const story = {
  founder: "Gökhan Şimşek · Julien Rasquinet · Hüseyin Erdoğmuş",
  lead: "İstanbul her zaman bir coğrafyadan fazlası oldu: baharat çarşısının kokusu, Boğaz'ın tuzu, şafakta bir caminin sessizliği.",
  paragraphs: [
    "Hikâye yedi yaşında bir çocuğun kokulara duyduğu merakla başladı ve yıllar içinde bir parfüm evine dönüştü. Markanın adı kurucunun annesinden geliyor: Umut. Hope Istanbul, 2021'de Serimu Kozmetik çatısı altında bu sevgi ve aile bağıyla kuruldu.",
    "Amaç, umudu bir şişeye sığdırmak. Tarihin kokusunun modern hayatın nabzıyla buluştuğu İstanbul'da doğan her koku, Doğu'nun ihtişamını Batı'nın zarafetiyle harmanlayan, hiç uyumayan şehirden ilham alan bir yolculuk. Her notada bir hikâye, her nefeste yeni bir keşif.",
    "Kokuların arkasında üç isim var: Gökhan Şimşek, Hüseyin Erdoğmuş ve Amouage, Creed, Frederic Malle için de çalışmış parfümör Julien Rasquinet. Marka dünyaya açılışını 2024'te Milano'daki Esxence'ta yaptı.",
  ],
  timeline: [
    ["2021", "Hope Istanbul, kurucunun annesi Umut'un adıyla kuruluyor"],
    ["2022", "İlk koleksiyon: Han, Narcissus, Queen ve N.E.C.O"],
    ["2024", "Esxence Milano'da dünya lansmanı; Forza ve Submarine"],
    ["2025", "Grand serisi, Queen of Palace ve Deep Secret"],
  ],
  stats: [
    ["%30", "esans oranı"],
    ["20", "koku"],
    ["4", "İstanbul koleksiyonu"],
  ],
  press: ["Esxence Milano", "Fragrantica", "Parfumo", "Lodore", "Level Perfume"],
  instagram: "https://www.instagram.com/hopeistanbuloffical/",
  website: "https://www.hopeistanbulofficial.com/",
};

export const faqs = [
  ["Hope adı nereden geliyor?", "Kurucunun annesinin adından: Umut. Yedi yaşında başlayan koku tutkusu, 2021'de annesinin adını taşıyan bir parfüm evine dönüştü."],
  ["Extrait de Parfum ne demek?", "Parfümün en yoğun hali. Hope Istanbul kokuları %30 esans oranıyla hazırlanır; eau de parfum ve eau de toilette'ten çok daha kalıcıdır."],
  ["Hangi kokuyu seçmeliyim?", "Sıcak ve baharatlı sevenler için Han, çiçeksi ve görkemli için Queen of Palace, aydınlık ve tatlı için Narcissus, temiz ve karizmatik için Grand Conqueror, ferah ve denizsi için Deep Secret, baharatlı ve asi için N.E.C.O, lavantalı ve zarif için Forza, meyveli ve derin için Submarine."],
  ["Koleksiyonlar neyi anlatıyor?", "Her koleksiyon İstanbul'un bir yüzünü anlatır: 7 Tepe, Tarihi Yarımada, İki Kıta Bir Aşk ve İstanbul'un Harikaları."],
  ["Koleksiyonda başka hangi kokular var?", "Bu sayfada sekiz koku var. Markanın koleksiyonunda Amber Delight, Mango Crush, Addictive, Rare, Miss Miris ve Grand Han gibi başka kokular da bulunuyor."],
  ["Kokular unisex mi?", "Evet. Hope Istanbul kokuları kadın ve erkek için tasarlanır."],
  ["Kokuları birleştirebilir miyim?", "Evet. Hope Istanbul kokuları birbiriyle özgürce katmanlanabilir; örneğin Han'ın baharatını Queen of Palace'ın gülüyle birleştirip kendi imzanı yaratabilirsin."],
  ["10 ml seyahat boyu ne işe yarar?", "Kokuyu tende birkaç gün denemek ya da çantada taşımak için. Beğenirsen büyük şişeye geçersin."],
  ["Kargo ve hediye paketi nasıl işliyor?", "Bu demo sayfada örnek akış gösteriliyor: aynı gün kargo, ücretsiz hediye kutusu ve el yazısı not. Gerçek koşullar markayla birlikte belirlenecek."],
];

export function flavorName(id) {
  return id === VARIETY ? "Keşif seti" : flavors[id].name;
}

export function packPrice(size, plan) {
  const pack = packs.find((p) => p.size === size);
  return pack.price * (plan === "sub" ? 1 - SUB_DISCOUNT : 1);
}

export function packLabel(size) {
  return `${size} ml`;
}

const fmt = new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" });
export const money = (n) => fmt.format(n);
