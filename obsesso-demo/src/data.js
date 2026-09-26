// Örnek ürün serisi (konsept). `ink`, kutu üzerindeki yazıların rengi.
export const flavors = [
  {
    name: "Sade",
    color: "#1b130e",
    ink: "#e2cfb4",
    tagline: "Siyah, yumuşak, derin.",
    notes: ["Bitter çikolata", "Kavrulmuş fındık"],
    description: "Sütsüz, şekersiz soğuk demleme. Saatlerce demlenmiş kahvenin yumuşak, az asidik hali.",
  },
  {
    name: "Latte",
    color: "#c49a73",
    ink: "#26170d",
    tagline: "Sütlü, dengeli, her an.",
    notes: ["Soğuk demleme", "Süt"],
    description: "Soğuk demlenmiş kahve ve süt. Serinin en dengeli, en kolay içilen kutusu.",
  },
  {
    name: "Karamel",
    color: "#b86a23",
    ink: "#fff1e0",
    tagline: "Tuzlu karamelin yumuşaklığı.",
    notes: ["Karamel", "Bir tutam deniz tuzu"],
    description: "Karamelin tatlılığını bir tutam tuzla dengeleyen, kremsi bir soğuk latte.",
  },
  {
    name: "Vanilya",
    color: "#eadcc3",
    ink: "#3a2616",
    tagline: "Açık, kremsi, sakin.",
    notes: ["Madagaskar vanilyası", "Süt"],
    description: "Vanilyanın yumuşak aroması, soğuk demlemenin tatlımsı karakteriyle buluşuyor.",
  },
  {
    name: "Fındık",
    color: "#7a4726",
    ink: "#f5e3cc",
    tagline: "Karadeniz'den bir yudum.",
    notes: ["Kavrulmuş fındık", "Süt"],
    description: "Kavrulmuş fındık notalarıyla zenginleşen, tok içimli bir soğuk latte.",
  },
  {
    name: "Mocha",
    color: "#43271a",
    ink: "#efd7bd",
    tagline: "Kahve ve kakao, soğuk.",
    notes: ["Kakao", "Süt"],
    description: "Kakao ile soğuk demlemenin buluşması. Tatlı ama ağır değil.",
  },
  {
    name: "Yulaf",
    color: "#d6bf98",
    ink: "#34240f",
    tagline: "Bitkisel, hafif, kremsi.",
    notes: ["Yulaf içeceği", "Soğuk demleme"],
    description: "Sütsüz isteyenler için yulaf içeceğiyle hazırlanan, hafif ve kremsi bir latte.",
  },
  {
    name: "Espresso",
    color: "#2a1b13",
    ink: "#c9a06c",
    tagline: "Yoğun, kısa, net.",
    notes: ["Çift shot", "Az süt"],
    description: "Daha yoğun bir kahve isteyenler için çift shot, az sütlü soğuk kahve.",
  },
];

export const specs = "Soğuk demlenmiş kahve";

// Detay görünümündeki özellik hikâyeleri (örnek metin). `pose`, kutunun o
// özellikte nasıl duracağı: rotY = arka etiketi göstermek için döndürme.
export const features = [
  {
    icon: "bolt",
    short: "Doğal kafein",
    kicker: "Sıfır",
    struck: "Enerji karışımı",
    title: "Doğal kafein",
    text: "Kafeini yalnızca kahveden gelir. Yavaş yükselir, uzun sürer; ek enerji karışımı ya da taurin yok.",
    pose: { rotY: 0.06, rotZ: 0.03, y: 2.1, scale: 3.2 },
  },
  {
    icon: "bean",
    short: "Soğuk demleme",
    kicker: "Sıfır",
    struck: "Acılık",
    title: "Soğuk demleme",
    text: "Kahve saatlerce soğuk suda demlenir. Sonuç daha yumuşak, daha az asidik ve doğal olarak tatlımsı bir yudum.",
    pose: { rotY: Math.PI + 0.1, rotZ: 0.03, y: 4.2, scale: 2.9 },
  },
  {
    icon: "cube",
    short: "Daha az şeker",
    kicker: "Daha az",
    struck: "Şurup",
    title: "Daha az şeker",
    text: "Tatlılığını sütten ve kahvenin kendisinden alır; şurupla boğulmaz. Besin değerleri arka yüzde.",
    pose: { rotY: Math.PI + 0.02, rotZ: 0.02, y: 0.9, scale: 2.9 },
  },
  {
    icon: "drop",
    short: "Gerçek süt",
    kicker: "Artı",
    struck: "Krema tozu",
    title: "Gerçek süt",
    text: "Latte serisi gerçek sütle hazırlanır; kıvamını krema tozundan değil, sütün kendisinden alır.",
    pose: { rotY: Math.PI + 0.25, rotZ: 0.09, y: 2.4, scale: 3.1 },
  },
];

// Ritüel bölümündeki adımlar. Kutu her adımda farklı bir poza ve tada geçer.
export const ritual = [
  {
    title: "Soğut",
    flavor: 0,
    text: "Buzdolabında, 4 °C. Soğuk demleme en iyi soğukken içilir.",
    stat: "4 °C",
  },
  {
    title: "Çalkala",
    flavor: 2,
    text: "Açmadan önce birkaç kez çalkala; süt ve kahve yeniden buluşsun.",
    stat: "3×",
  },
  {
    title: "Aç",
    flavor: 3,
    text: "Kutudan iç ya da buzlu bir bardağa dök. Gerisi senin ritmin.",
    stat: "Aç",
  },
];

export const packs = [
  { size: 6, price: 389.9, label: "Dene" },
  { size: 12, price: 739.9, label: "En popüler" },
  { size: 24, price: 1379.9, label: "En avantajlı" },
];

export const SUB_DISCOUNT = 0.15;
export const FREE_SHIPPING = 1000;
export const SHIPPING = 89.9;
export const VARIETY = "variety";
export const DEFAULT_SHOP_FLAVOR = 1; // Latte

export const stockists = [
  ["İstanbul", "Kadıköy, Beşiktaş, Nişantaşı", 0],
  ["Ankara", "Çankaya, Kızılay", 0],
  ["İzmir", "Alsancak, Karşıyaka", 0],
  ["Antalya", "Konyaaltı, Muratpaşa", 0],
  ["Bursa", "Nilüfer", 0],
  ["Eskişehir", "Odunpazarı", 0],
];

export const faqs = [
  ["Soğuk demleme nedir?", "Kahvenin sıcak su yerine soğuk suda, saatlerce demlenmesiyle hazırlanır. Daha yumuşak ve daha az asidik bir tat verir."],
  ["Bir kutuda ne kadar kafein var?", "Bu konsept demoda gösterilen değerler örnektir. Gerçek değerler ürün etiketinde yer alır."],
  ["Nasıl saklanmalı?", "Serin ve kuru bir yerde saklayın; en iyi tadı için soğuk için. Açıldıktan sonra hemen tüketin."],
  ["Kargo ne kadar sürer?", "Örnek akış: saat 14:00'e kadar verilen siparişler aynı gün kargoya verilir, 1–3 iş gününde teslim edilir."],
  ["Abonelik nasıl çalışır?", "Örnek akış: %15 tasarruf edersin, paketin her dört haftada bir gönderilir; istediğin zaman atlayabilir ya da iptal edebilirsin."],
  ["Sütsüz seçenek var mı?", "Sade ve Espresso sütsüz, Yulaf ise bitkisel içecekle hazırlanır (örnek seri)."],
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
