// Hope Istanbul koku serisi (konsept). İsimler ve notalar markanın
// yayımlanmış ürün bilgilerinden; açıklamalar ve fiyatlar örnek. `color`
// kokunun arayüzdeki vurgu rengi (halka, düğmeler). `theme` her kokunun kendi
// sahnesi: `glow` arka plandaki ışık, `edge` kenar karanlığı, `drop` açılışta
// süzülen esans damlalarının rengi. Şişe dokuları assets/labels altında.
export const flavors = [
  {
    name: "Han",
    color: "#e0a060",
    ink: "#6b3210",
    theme: { glow: "#b86a2a", edge: "#0c0603", drop: "#d4903f", mood: "warm" },
    tagline: "Baharat kokan han avluları.",
    notes: ["Limon", "Tarçın", "Paçuli", "Sedir", "Amber"],
    description: "Kapalıçarşı'nın taş avlularından ilham alan odunsu, baharatlı bir koku. Limonla açılır, tarçın ve sedirle ısınır, amber ve miskle tende kalır.",
  },
  {
    name: "Queen of Palace",
    color: "#f0a8b8",
    ink: "#8a2f4c",
    theme: { glow: "#b8566f", edge: "#10050a", drop: "#f5c3cc", mood: "warm" },
    tagline: "Sarayın kraliçesi, iki kıtanın aşkı.",
    notes: ["Gül", "Yasemin", "Mango", "Vanilya", "Amber"],
    description: "Gül, yasemin ve mangoyla açılan görkemli bir çiçek buketi. Vanilya ve amber tabanı kalıcılığı ve sıcaklığı temsil eder.",
  },
  {
    name: "Narcissus",
    color: "#efd98a",
    ink: "#7a5a12",
    theme: { glow: "#b89a48", edge: "#0c0a04", drop: "#f7ecc0", mood: "warm" },
    tagline: "Tarihi Yarımada'da bir bahar sabahı.",
    notes: ["Çarkıfelek", "Sümbülteber", "Beyaz çiçekler", "Vanilya"],
    description: "Çarkıfelek ve mandalinayla ışıyan, sümbülteber ve beyaz çiçeklerle açan, vanilya ve beyaz miskle yumuşayan aydınlık bir koku.",
  },
  {
    name: "Grand Conqueror",
    color: "#b9a9e6",
    ink: "#4a3d7a",
    theme: { glow: "#6d5f9a", edge: "#07060e", drop: "#d8d0e8", mood: "cool" },
    tagline: "Liderliğin zamansız karizması.",
    notes: ["Bergamot", "İris", "Günlük", "Vetiver", "Amber"],
    description: "Bergamot, iris ve günlük ruhu yükselten güçlü akorlar kurar; vetiver ve amberle zamansız bir karizmaya dönüşür.",
  },
  {
    name: "Deep Secret",
    color: "#6fd0e0",
    ink: "#0f4262",
    theme: { glow: "#237a96", edge: "#020a10", drop: "#78c6d2", mood: "cool" },
    tagline: "Boğaz'ın en derin sırrı.",
    notes: ["Hibiskus", "Şakayık", "Deniz notaları", "Manolya", "Kaşmiran"],
    description: "Hibiskus, şakayık ve şeftali deniz esintisiyle buluşur; yasemin, menekşe ve manolyadan sonra kaşmiran ve sandal ağacına iner.",
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
    pose: { rotY: 0.02, rotZ: 0.02, y: -0.4, scale: 3.1 },
  },
  {
    icon: "pin",
    short: "İstanbul silueti",
    kicker: "Tek",
    struck: "Sıradan bir şişe",
    title: "Şişede İstanbul",
    text: "Her şişenin arka yüzüne kokunun ilham aldığı yer işlenir: Kapalıçarşı, Topkapı, Tarihi Yarımada, Rumeli Hisarı ya da Kız Kulesi.",
    pose: { rotY: 0.35, rotZ: 0.03, y: 1.7, scale: 3.2 },
  },
  {
    icon: "leaf",
    short: "Koku piramidi",
    kicker: "Üç",
    struck: "Tek boyutlu koku",
    title: "Üç katlı bir hikâye",
    text: "Üst notalar ilk dakikaları, kalp notaları ilk saatleri, taban notaları günün sonunu anlatır. Şişenin yan yüzünde hepsi yazılı.",
    pose: { rotY: Math.PI / 2 + 0.04, rotZ: 0.02, y: -0.6, scale: 3.4 },
  },
  {
    icon: "star",
    short: "Parfümörler",
    kicker: "Usta",
    struck: "Seri üretim",
    title: "Usta parfümörler",
    text: "Kokular Gökhan Şimşek ve Amouage, Creed, Frederic Malle için de çalışmış Julien Rasquinet'nin imzasını taşır.",
    pose: { rotY: -Math.PI / 2 - 0.04, rotZ: 0.02, y: -0.6, scale: 3.4 },
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
    title: "Kalıcılık",
    flavor: 4,
    text: "Extrait yoğunluğu sayesinde iki sıkım bütün güne yeter.",
    stat: "12+ saat",
  },
];

// Mağaza boyutları: `size` ml cinsinden.
export const packs = [
  { size: 10, price: 1490, label: "Seyahat" },
  { size: 50, price: 4290, label: "En popüler" },
  { size: 100, price: 6490, label: "Koleksiyon" },
];

export const SUB_DISCOUNT = 0; // hediye paketi ücretsiz, indirim yok
export const FREE_SHIPPING = 3000;
export const SHIPPING = 99.9;
export const VARIETY = "variety";
export const DEFAULT_SHOP_FLAVOR = 1; // Queen of Palace

// Nerede bulunur. Üçüncü sütun durum etiketi.
export const stockists = [
  ["İstanbul", "Hope Istanbul by Serimu · resmi satış", "Açık"],
  ["Online", "hopeistanbulofficial.com", "Online"],
  ["Avrupa", "Lodore ve seçkin niş parfümeriler", "Açık"],
  ["Milano", "Esxence 2024 · dünya lansmanı", "Fuar"],
];

// Marka hikâyesi: yayımlanmış bilgiler.
export const story = {
  founder: "Gökhan Şimşek · Julien Rasquinet · Hüseyin Erdoğmuş",
  lead: "İstanbul her zaman bir coğrafyadan fazlası oldu: baharat çarşısının kokusu, Boğaz'ın tuzu, şafakta bir caminin sessizliği.",
  paragraphs: [
    "Hope Istanbul, 2021'de Serimu Kozmetik çatısı altında kurulan bir Türk parfüm evi. Amacı, umudu bir şişeye sığdırmak: Doğu'nun ihtişamını Batı'nın zarafetiyle buluşturan, her biri titizlikle tasarlanmış kokular.",
    "Kokuların arkasında üç isim var: Gökhan Şimşek, Hüseyin Erdoğmuş ve Amouage, Creed, Frederic Malle için de çalışmış parfümör Julien Rasquinet. Marka dünyaya açılışını 2024'te Milano'daki Esxence'ta yaptı.",
  ],
  timeline: [
    ["2021", "Hope Istanbul, Serimu Kozmetik çatısı altında kuruluyor"],
    ["2022", "İlk koleksiyon: Han, Narcissus, Queen ve N.E.C.O"],
    ["2024", "Esxence Milano'da dünya lansmanı"],
    ["2025", "Grand serisi, Queen of Palace ve Deep Secret"],
  ],
  stats: [
    ["%30", "esans oranı"],
    ["3", "parfümör"],
    ["4", "İstanbul koleksiyonu"],
  ],
  press: ["Esxence Milano", "Fragrantica", "Parfumo", "Lodore", "Level Perfume"],
  instagram: "https://www.instagram.com/hopeistanbuloffical/",
  website: "https://www.hopeistanbulofficial.com/",
};

export const faqs = [
  ["Extrait de Parfum ne demek?", "Parfümün en yoğun hali. Hope Istanbul kokuları %30 esans oranıyla hazırlanır; eau de parfum ve eau de toilette'ten çok daha kalıcıdır."],
  ["Hangi kokuyu seçmeliyim?", "Sıcak ve baharatlı sevenler için Han, çiçeksi ve görkemli için Queen of Palace, aydınlık ve tatlı için Narcissus, temiz ve karizmatik için Grand Conqueror, ferah ve denizsi için Deep Secret."],
  ["Koleksiyonlar neyi anlatıyor?", "Her koleksiyon İstanbul'un bir yüzünü anlatır: 7 Tepe, Tarihi Yarımada, İki Kıta Bir Aşk ve İstanbul'un Harikaları."],
  ["Kokular unisex mi?", "Evet. Hope Istanbul kokuları kadın ve erkek için tasarlanır."],
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
