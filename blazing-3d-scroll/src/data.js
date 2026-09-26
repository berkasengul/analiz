// On tat, halkadaki sırasıyla. `ink`, kutu üzerindeki yazıların rengi.
export const flavors = [
  {
    name: "Krom",
    color: "#8e9399",
    ink: "#141416",
    tagline: "Parlak, asla sessiz değil.",
    notes: ["Narenciye kabuğu", "Ginseng"],
    description: "İlk tadımız. Temiz bir ginseng tabanı üzerinde parlak narenciye; soğuk ve kuru bir bitiş.",
  },
  {
    name: "Kiraz",
    color: "#c0121f",
    ink: "#fff4f4",
    tagline: "Kutuda ateş.",
    notes: ["Kara kiraz", "Pembe biber"],
    description: "Pembe biberin kıvılcımıyla koyu kiraz. Önce tatlı, yudumun sonunda sıcak.",
  },
  {
    name: "Misket",
    color: "#6a9418",
    ink: "#0f1504",
    tagline: "Keskin, elektrikli.",
    notes: ["Misket limonu", "Yuzu"],
    description: "Yuzu ile keskinleşen misket limonu. Dilinin her yerini uyandıran ekşi bir çıtırtı.",
  },
  {
    name: "Buz",
    color: "#1fb4e4",
    ink: "#04161d",
    tagline: "Sıfırın altında voltaj.",
    notes: ["Buzul nanesi", "Mavi ahududu"],
    description: "Buzul nanesi ve mavi ahududu. Oda sıcaklığında bile serinin en soğuk kutusu.",
  },
  {
    name: "Böğürtlen",
    color: "#2c1a4f",
    ink: "#d9cff2",
    tagline: "Gece mesaisinin yakıtı.",
    notes: ["Frenk üzümü", "Menekşe", "Açai"],
    description: "Frenk üzümü ve açai, üstünde çiçeksi bir menekşe notası. Derin, biraz ekşi; uzun geceler için.",
  },
  {
    name: "Mango",
    color: "#f06510",
    ink: "#1f0b01",
    tagline: "Gazlı gün doğumu.",
    notes: ["Alphonso mango", "Kan portakalı"],
    description: "Kan portakalıyla canlanan Alphonso mango. Yoğun, sulu ve gür.",
  },
  {
    name: "Dalga",
    color: "#1b2ea6",
    ink: "#d5dbff",
    tagline: "Gelgit gibi, mayhoş.",
    notes: ["Yaban mersini", "Deniz tuzu"],
    description: "Bir tutam deniz tuzuyla yaban mersini. Tadı yazın son yüzüşü gibi.",
  },
  {
    name: "Altın",
    color: "#a8760f",
    ink: "#1a1203",
    tagline: "Sıvı altın.",
    notes: ["Ananas", "Bal", "Safran"],
    description: "Közlenmiş ananas ve bir damla bal, üstünde safran. Zengin ama şekersiz.",
  },
  {
    name: "Pitaya",
    color: "#df1476",
    ink: "#fff1f7",
    tagline: "Karanlıkta neon.",
    notes: ["Ejder meyvesi", "Liçi", "Gül"],
    description: "Ejder meyvesi ve liçi, yumuşak bir gül yaprağı bitişiyle.",
  },
  {
    name: "Oniks",
    color: "#121214",
    ink: "#76767e",
    tagline: "Karartma, tam şarj.",
    notes: ["Siyah üzüm", "Açai"],
    description: "Mat siyah kutuda siyah üzüm ve açai. On tadın en cüretkârı.",
  },
];

export const specs = "Sıfır şeker — 160 mg kafein";

// Detay görünümündeki özellik hikâyeleri. `pose`, kutunun o özellikte
// nasıl duracağı: rotY = arka etiketi göstermek için döndürme.
export const features = [
  {
    icon: "bolt",
    short: "Kafein + enerji",
    kicker: "Sıfır",
    struck: "Şeker çöküşü",
    title: "Kafein + enerji",
    text: "Taurin ve ginsengle birlikte 160 mg doğal kafein. Yirmi dakikada yükselen, saatlerce süren dengeli bir enerji; ani sıçrama ve ardından gelen düşüş yok.",
    // Kutu yukarı kayar, ön yüzün alt yarısı (ENERGY DRINK, 220 ML) görünür.
    pose: { rotY: 0.06, rotZ: 0.03, y: 2.1, scale: 3.2 },
  },
  {
    icon: "leaf",
    short: "Doğal aromalar",
    kicker: "Sıfır",
    struck: "Yapay aroma",
    title: "Doğal aromalar",
    text: "Meyve suyu ve bitkisel özlerden yapılır. Sentetik hiçbir şey yok; arka yüzdeki içerik listesi tek nefeste okunacak kadar kısa.",
    // Arkaya döner, etiketin alt kısmı ve kutunun dibi görünür.
    pose: { rotY: Math.PI + 0.1, rotZ: 0.03, y: 4.2, scale: 2.9 },
  },
  {
    icon: "cube",
    short: "Daha az şeker",
    kicker: "Daha az",
    struck: "Fazla şeker",
    title: "Daha az şeker",
    text: "Kutu başına yarım gramdan az şeker. Tatlılık meyveden ve biraz steviadan gelir; enerji arkasından bir düşüş getirmez.",
    // Aşağı kayar, "Supplement Facts" başlığı görünür.
    pose: { rotY: Math.PI + 0.02, rotZ: 0.02, y: 0.9, scale: 2.9 },
  },
  {
    icon: "hex",
    short: "B vitamini kompleksi",
    kicker: "Artı",
    struck: "Boş kalori",
    title: "B vitamini kompleksi",
    text: "Günlük ihtiyacın %100'ü kadar B2, B3, B6 ve B12. Besinleri enerjiye dönüştürmene yardım ederler; formülün sessiz ama çalışan kısmı.",
    // Hafifçe dönüp eğilir, vitamin listesine yakınlaşır.
    pose: { rotY: Math.PI + 0.25, rotZ: 0.09, y: 2.4, scale: 3.1 },
  },
];

// Ritüel bölümündeki adımlar. Kutu her adımda farklı bir poza ve tada geçer.
export const ritual = [
  {
    title: "Soğut",
    flavor: 3,
    text: "Buzdolabı soğukluğunda, 4 °C. Kutu ne kadar soğuksa ilk yudum o kadar keskin.",
    stat: "4 °C",
  },
  {
    title: "Aç",
    flavor: 1,
    text: "Tıslama sesini bekle. Buzun üzerine dök ya da doğrudan kutudan iç.",
    stat: "220 ml",
  },
  {
    title: "Ateşle",
    flavor: 5,
    text: "Yirmi dakika sonra etkisini gösterir ve öğleden sonraya kadar seninle kalır.",
    stat: "160 mg",
  },
];

export const packs = [
  { size: 6, price: 449.9, label: "Dene" },
  { size: 12, price: 849.9, label: "En popüler" },
  { size: 24, price: 1549.9, label: "En avantajlı" },
];

export const SUB_DISCOUNT = 0.15;
export const FREE_SHIPPING = 1000;
export const SHIPPING = 89.9;
export const VARIETY = "variety";
export const DEFAULT_SHOP_FLAVOR = 5; // Mango

export const stockists = [
  ["İstanbul", "Kadıköy, Beşiktaş, Karaköy", 128],
  ["Ankara", "Çankaya, Kızılay, Bahçelievler", 74],
  ["İzmir", "Alsancak, Karşıyaka, Bornova", 61],
  ["Antalya", "Konyaaltı, Muratpaşa, Kaleiçi", 38],
  ["Bursa", "Nilüfer, Osmangazi", 27],
  ["Eskişehir", "Odunpazarı, Tepebaşı", 19],
];

export const faqs = [
  [
    "Bir kutuda ne kadar kafein var?",
    "220 ml'lik bir kutuda 160 mg; büyük bir filtre kahveyle hemen hemen aynı. Günde ikiden fazla kutu önermiyoruz.",
  ],
  [
    "Neyle tatlandırılıyor?",
    "Stevia yaprağı özü ve her tattaki meyve suyuyla. İlave şeker, aspartam ya da sukraloz yok.",
  ],
  [
    "Kimler Blazing içmemeli?",
    "Kafein oranı yüksek olduğu için çocuklar, hamile ve emziren kadınlar için uygun değildir.",
  ],
  [
    "Kargo ne kadar sürer?",
    "Saat 14:00'e kadar verilen siparişler aynı gün kargoya verilir ve 1–3 iş gününde Türkiye'nin her yerine ulaşır. ₺1.000 üzeri kargo ücretsiz.",
  ],
  [
    "Abonelik nasıl çalışır?",
    "%15 tasarruf edersin ve her dört haftada bir yeni paketin gönderilir. Gönderimden iki gün öncesine kadar atlayabilir, tat değiştirebilir ya da iptal edebilirsin.",
  ],
  ["Vegan mı?", "Evet. On tadın hepsi vegan ve glütensiz."],
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
