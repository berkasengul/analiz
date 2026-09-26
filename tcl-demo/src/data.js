// Örnek ürün serisi (konsept). `ink`, kutu üzerindeki yazıların rengi.
// Beş şehir tadı. Bold Istanbul ve Silky Mardin ürün fotoğraflarından, diğer
// isim ve notalar basın haberlerinden; açıklamalar örnek. `color` kutunun
// arayüzdeki rengi (halka, düğmeler). Etiket görselleri assets/labels altında.
// `color` tadın vurgu rengi (düğmeler, halka). `theme` her tadın kendi
// sahnesi: `glow` arka plandaki ışık, `edge` kenar karanlığı, `drop`
// sıçrayan damlaların rengi (koyu kahve ya da sütlü kahve).
export const flavors = [
  {
    name: "Bold Istanbul",
    color: "#6fb0e8",
    ink: "#1e3e84",
    theme: { glow: "#3f86c8", edge: "#030a14", drop: "#2a1408", mood: "ice" },
    tagline: "Koyu ve yoğun, buz gibi.",
    notes: ["%100 doğal", "Şekersiz", "Düşük kalori"],
    description: "Geleneksel Türk kahvesinin koyu ve yoğun karakteri, buz gibi ve kutuda. Galata'da gün batımı kadar klasik.",
  },
  {
    name: "Silky Mardin",
    color: "#e0b27a",
    ink: "#2f6db5",
    theme: { glow: "#b98548", edge: "#0d0703", drop: "#c9a27c", mood: "cream" },
    tagline: "Sütlü ve kremsi.",
    notes: ["Antep fıstığı", "Kakao", "Vanilya", "Kakule"],
    description: "Dibek kahvesinden ilham alan sütlü, kremsi içim; fıstık, kakao, vanilya ve kakule notaları.",
  },
  {
    name: "Pistachio Zeugma",
    color: "#a9c877",
    ink: "#30582a",
    theme: { glow: "#6d8f3e", edge: "#050903", drop: "#9c7a4a", mood: "cream" },
    tagline: "Fıstıklı ve yumuşak.",
    notes: ["Antep fıstığı", "Menengiç"],
    description: "Menengiç aromasıyla Güneydoğu'nun fıstıklı kahve geleneğine bir selam. Yumuşak, sütlü, dengeli.",
  },
  {
    name: "Minty Cappadocia",
    color: "#86d6bf",
    ink: "#166860",
    theme: { glow: "#3c9c89", edge: "#030a09", drop: "#2a1810", mood: "ice" },
    tagline: "Ferah ve serin.",
    notes: ["Nane", "Kakule"],
    description: "Kakule ve nane ile ferahlayan, peribacaları kadar sıra dışı bir buzlu Türk kahvesi.",
  },
  {
    name: "Piney Aegean",
    color: "#5aa2e6",
    ink: "#105082",
    theme: { glow: "#2c6fb4", edge: "#020812", drop: "#2a170c", mood: "ice" },
    tagline: "Hafif ve aromatik.",
    notes: ["Damla sakızı", "Çam"],
    description: "Damla sakızı aromasıyla Ege'nin reçineli, ferah karakterini taşıyan hafif bir yudum.",
  },
];

export const specs = "Buzlu Türk kahvesi · 250 ml";

// Detay görünümündeki özellik hikâyeleri (örnek metin). `pose`, kutunun o
// özellikte nasıl duracağı: rotY = π/2 arka etiket, -π/2 fal paneli.
// Detay görünümündeki özellik hikâyeleri (örnek metin). `pose`, kutunun o
// özellikte nasıl duracağı: rotY = π/2 arka panel, -π/2 fal paneli.
export const features = [
  {
    icon: "cup",
    short: "500 yıllık tarif",
    kicker: "Yok",
    struck: "Cezve beklemek",
    title: "500 yıllık tarif",
    text: "Türk kahvesinin beş asırlık geleneği, buz gibi ve kutuda. Nazar boncuğu da cabası: good coffee, good fortune.",
    pose: { rotY: 0.04, rotZ: 0.02, y: -2.2, scale: 3.4 },
  },
  {
    icon: "pin",
    short: "Beş şehir",
    kicker: "Beş",
    struck: "Tek tip tat",
    title: "Beş şehir, beş tat",
    text: "İstanbul'dan Mardin'e, Zeugma'dan Kapadokya'ya ve Ege'ye: her kutu bir şehrin gün batımını ve kahve hikâyesini taşır.",
    pose: { rotY: 0.35, rotZ: 0.03, y: -0.8, scale: 3.1 },
  },
  {
    icon: "cube",
    short: "İçindekiler",
    kicker: "Kısa",
    struck: "Uzun içerik listesi",
    title: "Sade içerik",
    text: "Su, Türk kahvesi ve doğal aroma. Arka panelde tek nefeste okunacak kadar kısa bir liste.",
    pose: { rotY: Math.PI / 2 + 0.04, rotZ: 0.02, y: -3.6, scale: 3.3 },
  },
  {
    icon: "fal",
    short: "Dijital fal",
    kicker: "Dijital",
    struck: "Telve beklemek",
    title: "Fincanını çevir",
    text: "Kahveyi bitir, kutudaki kodu okut: yapay zekâ destekli fal deneyimi geleneği dijitale taşıyor.",
    pose: { rotY: -Math.PI / 2 - 0.04, rotZ: 0.02, y: -3.6, scale: 3.3 },
  },
];

// Ritüel bölümündeki adımlar. Kutu her adımda farklı bir poza ve tada geçer.
export const ritual = [
  {
    title: "Soğut",
    flavor: 0,
    text: "Buzdolabında, 4 °C. Buzlu Türk kahvesi en iyi soğukken içilir.",
    stat: "4 °C",
  },
  {
    title: "Çalkala",
    flavor: 1,
    text: "Açmadan önce hafifçe çalkala; kahve ve aromalar yeniden buluşsun.",
    stat: "3×",
  },
  {
    title: "Paylaş",
    flavor: 4,
    text: "Bir fincan kahvenin kırk yıl hatırı vardır. Bir kutununki de az değil.",
    stat: "40 yıl",
  },
];

export const packs = [
  { size: 6, price: 599.9, label: "Dene" },
  { size: 12, price: 1119.9, label: "En popüler" },
  { size: 24, price: 2099.9, label: "En avantajlı" },
];

export const SUB_DISCOUNT = 0.15;
export const FREE_SHIPPING = 1000;
export const SHIPPING = 89.9;
export const VARIETY = "variety";
export const DEFAULT_SHOP_FLAVOR = 1; // Silky Mardin

export const stockists = [
  ["İstanbul", "Lansman şehri", 0],
  ["Ankara", "Çankaya", 0],
  ["İzmir", "Alsancak", 0],
  ["Washington DC", "Alexandria, VA", 0],
  ["Kuzey Carolina", "Apex", 0],
];

export const faqs = [
  ["Soğuk Türk kahvesi nedir?", "Geleneksel Türk kahvesinin soğuk içime uygun, kutulanmış hali. Telvesi yoktur, açıp hemen içebilirsin."],
  ["Tatlar neden şehir adı taşıyor?", "Her tat, bir şehrin kahve geleneğinden ilham alıyor: İstanbul'un klasiği, Mardin'in dibeği, Zeugma'nın fıstığı, Kapadokya'nın ferahlığı, Ege'nin sakızı."],
  ["Dijital fal nasıl çalışır?", "Konsept akış: kahveni bitirdikten sonra etiketteki kodu okutursun, yapay zekâ destekli fal deneyimi telefonunda açılır."],
  ["Nasıl saklanmalı?", "Serin ve kuru bir yerde saklayın; en iyi tadı için soğuk için. Açıldıktan sonra hemen tüketin."],
  ["Kargo ne kadar sürer?", "Örnek akış: saat 14:00'e kadar verilen siparişler aynı gün kargoya verilir, 1–3 iş gününde teslim edilir."],
  ["Abonelik nasıl çalışır?", "Örnek akış: %15 tasarruf edersin, paketin her dört haftada bir gönderilir; istediğin zaman atlayabilir ya da iptal edebilirsin."],
];

export function flavorName(id) {
  return id === VARIETY ? "Karışık" : flavors[id].name;
}

export function packPrice(size, plan) {
  const pack = packs.find((p) => p.size === size);
  return pack.price * (plan === "sub" ? 1 - SUB_DISCOUNT : 1);
}

// "6'lı", "12'li", "24'lü" gibi Türkçe sayı ekleri.
export function packLabel(size) {
  const suffix = { 6: "lı", 12: "li", 24: "lü" }[size] ?? "li";
  return `${size}'${suffix}`;
}

const fmt = new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" });
export const money = (n) => fmt.format(n);
