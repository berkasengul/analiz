import { useStore } from "./store";
import * as D from "./data";
import { brand as brandTr } from "./brand";

// İki dil: Türkçe (₺, varsayılan) ve İngilizce ($). Türkçe içerik data.js ve
// brand.js'te; burada İngilizce karşılıkları, fiyatlar ve arayüz metinleri var.

// ---------------------------------------------------------------- İngilizce içerik
const C = D.content;
const EN = {
  flavors: D.SET.map((g) => C.products[g].en),
  features: C.features.map((f) => f.en),
  ritual: D.PAGE.kind === "home" ? C.ritual.map((r) => r.en) : [],
  stockists: C.stockists?.en ?? [],
  story: C.story.en,
  faqs: C.faqs.en,
  specs: C.specs.en,
  brand: C.brand.en,
  packLabels: Object.fromEntries(C.packs.map((p) => [p.size, p.label.en])),
};

// ---------------------------------------------------------------- fiyatlar
const PRICES = C.prices;

// Yabancı terimler (ör. "Extrait de Parfum", "No/9 Mystique") Türkçe büyük harf kuralıyla
// yazılmasın (EXTRAİT değil EXTRAIT): content.json → latinTerms düzenli ifadesine uyan metin lang="en".
const LATIN = C.latinTerms ? new RegExp(C.latinTerms, "i") : null;
// Türkçe harf içeren metin (ör. "Cologne du Parfumeur Özel Hediye Seti") Türkçe kalır.
export const termLang = (s) => (LATIN && typeof s === "string" && LATIN.test(s) && !/[çğıöşüÇĞİÖŞÜ]/.test(s) ? "en" : undefined);
// Slogan ve kayan bant: marka yabancı terimlerini tanımladıysa ona göre; yoksa ASCII metin İngilizce sayılır.
export const wordLang = (s = "") => (LATIN ? termLang(s) : /^[\x00-\x7F]+$/.test(s.replace(/[·%\d]/g, "")) ? "en" : undefined);

// ---------------------------------------------------------------- arayüz metinleri
const UI = {
  tr: {
    backToTop: "başa dön",
    sections: "Bölümler",
    nav: { flavors: "Kokular", ritual: "Ritüel", shop: "Mağaza", story: "Hikâye", stockists: "Nerede", faq: "SSS", contact: "İletişim", catalog: "Tüm ürünler", categories: "Kategoriler", products: "Ürünler", sets: "Setler", about: "Hakkımızda", finder: "Koku bulucu" },
    openCart: (n) => `Sepeti aç, ${n} ürün`,
    menu: "Menü",
    close: "Kapat",
    loading: "Esans damıtılıyor",
    madeFor: "Hope Istanbul için hazırlanmış konsept",
    discover: (name) => `${name} kokusunu keşfet`,
    discoverCan: "Şişeyi keşfet",
    spray: "Parfümü sık",
    notes: "Notalar",
    flavors: "Kokular",
    scroll: "Keşfetmek için kaydır",
    backToFlavors: "Kokulara dön",
    pack: (label) => `${label}`,
    otherPacks: "Diğer boyutlar",
    prevFeature: "Önceki özellik",
    nextFeature: "Sonraki özellik",
    backToFlavor: "Koku bilgisine dön",
    prevFlavor: "Önceki koku",
    nextFlavor: "Sonraki koku",
    exploreCan: (n) => `Şişeyi keşfet · ${n} hikâye`,
    whatsInside: "Şişenin içinde",
    drag: "Şişeyi çevirmek için sürükle",
    ritual: "02 — Ritüel",
    steps: "Adımlar",
    inCan: "Şişede",
    shopEyebrow: "03 — Mağaza",
    shopTitle: "Kokunu seç",
    shopTag: "Kokunu ve boyutunu seç; gerisini hediye gibi paketleriz.",
    flavor: "Koku",
    mix: "Keşif seti",
    size: "Şişe boyutu",
    cans: "ml",
    perCan: (p) => `${p}`,
    delivery: "Paketleme",
    once: "Standart kutu",
    subscribe: () => "Hediye kutusu ve el yazısı not",
    subNote: "Ücretsiz · kurdeleli kutu, kişisel mesaj kartı",
    qty: "Adet",
    dec: "Adedi azalt",
    inc: "Adedi artır",
    packPerCan: (label) => `Extrait de Parfum · ${label}`,
    addToCart: "Sepete ekle",
    freeOver: (p) => `${p} üzeri ücretsiz kargo`,
    ships: "24 saatte kargoda",
    recyclable: "İstanbul'da tasarlanır, Türkiye'de üretilir",
    cart: "Sepetin",
    closeCart: "Sepeti kapat",
    emptyCart: "Sepetin henüz boş.",
    buildBox: "Koku seç",
    toFree: (p) => `Ücretsiz kargoya ${p} kaldı`,
    freeUnlocked: "Ücretsiz kargo kazandın",
    subLine: () => "Hediye kutusu · el yazısı not",
    oneTime: "Standart kutu",
    remove: "Kaldır",
    subtotal: "Ara toplam",
    shipping: "Kargo",
    free: "Ücretsiz",
    total: "Toplam",
    checkout: "Ödemeye geç",
    checkoutSoon: "Online ödeme çok yakında açılıyor. Sepetin o zamana kadar bu cihazda saklanır.",
    taxes: "KDV dahil · 1–3 iş gününde teslimat",
    goalLeft: (p) => `Hediyeye ${p} kaldı`,
    goalDone: "Hediyen sepette",
    shipLater: "Ödemede hesaplanır",
    checkoutNote: "",
    variant: "Seçenek",
    related: "Benzer ürünler",
    marquee: ["Hope in a bottle", "Her notada bir hikâye", "Her nefeste yeni bir keşif", "Doğu'nun ihtişamı, Batı'nın zarafeti", "Hiç uyumayan şehirden", "Extrait de Parfum · %30", "Esxence Milano 2024"],
    storyEyebrow: "04 — Hikâye",
    founder: "Kurucular ve parfümörler",
    perfumer: "Parfümör",
    family: "Koku ailesi",
    year: "Yıl",
    collection: "Koleksiyon",
    milestones: "Kilometre taşları",
    press: "Görüldüğü yerler",
    locator: {
      search: "Ülke, şehir ya da mağaza ara",
      country: "Ülke",
      allCountries: (n) => `Tüm ülkeler (${n})`,
      count: (n) => `${n} satış noktası`,
      none: "Seçiminize uyan satış noktası yok.",
      showAll: (n) => `Tümünü göster (${n})`,
      directions: "Yol tarifi",
      source: "Liste markanın mağaza bulucusundan alınmıştır.",
      types: { "Physical Store": "Mağaza", "Online Store": "Online mağaza", "Physical + Online": "Mağaza + online", "Retail Partner": "Satış ortağı", Distributor: "Distribütör", Warehouse: "Depo" },
    },
    composition: "Tam kompozisyon",
    whereEyebrow: "05 — Nerede",
    whereTitle: "Nerede bulunur",
    whereTag: "İstanbul'dan Milano'ya, bir sıkım uzaklıkta.",
    place: "Yer",
    spot: "Nokta",
    status: "Durum",
    faqEyebrow: "06 — SSS",
    faqTitle: "Merak edilenler",
    contact: "İletişim",
    contactTitle: "Bize yaz",
    contactTag: "Butik, otel ve kurumsal hediye siparişleri için.",
    thanks: "Teşekkürler. İki iş günü içinde dönüş yapacağız.",
    name: "Ad soyad",
    email: "E-posta",
    message: "Mesaj",
    send: "Mesajı gönder",
    newsletter: "Bülten",
    newsTitle: "Yeni kokular önce burada duyurulur.",
    joined: "Listeye eklendin.",
    emailAddress: "E-posta adresi",
    emailPh: "sen@ornek.com",
    join: "Katıl",
    caffeine: "Yalnızca harici kullanım içindir; ısı ve alevden uzak tutun.",
    footerNav: "Alt menü",
    madeForShort: (b) => `${b} için hazırlanmış konsept demo`,
    web: "Web",
    langLabel: "Dil",
    allEyebrow: "Tüm ürünler",
    allTitle: "Koleksiyonun tamamı",
    allTag: (n) => `${n} ürün.`,
    byCategory: "Kategorilere göre gör",
    exploreAll: "Tüm ürünleri keşfet",
    search: "Ürün ara",
    searchPlaceholder: "Ürün, içerik ya da kategori ara",
    searchClear: "Temizle",
    searchPopular: "Öne çıkanlar",
    searchResults: (n) => `${n} sonuç`,
    searchEmpty: (q) => `"${q}" için ürün bulunamadı`,
    searchMove: "gez",
    searchOpen: "aç",
    exploreSub: (n, c) => `${n} ürün · ${c} kategori`,
    backHome: "Ana sayfa",
    catalogTitle: "Ürünler",
    categories: "Kategoriler",
    all: "Tümü",
    itemsCount: (n) => `${n} ürün`,
    photos: "Ürün fotoğrafları",
    rating: "Puan",
    reviews: (n) => `${n} değerlendirme`,
    otherCategories: "Diğer kategoriler",
    added: "Eklendi",
  },
  en: {
    backToTop: "back to top",
    sections: "Sections",
    nav: { flavors: "Scents", ritual: "Ritual", shop: "Shop", story: "Story", stockists: "Where", faq: "FAQ", contact: "Contact", catalog: "All products", categories: "Categories", products: "Products", sets: "Sets", about: "About us", finder: "Scent finder" },
    openCart: (n) => `Open cart, ${n} items`,
    menu: "Menu",
    close: "Close",
    loading: "Distilling the essence",
    madeFor: "A concept made for Hope Istanbul",
    discover: (name) => `Discover ${name}`,
    discoverCan: "Discover the bottle",
    spray: "Spray it",
    notes: "Notes",
    flavors: "Scents",
    scroll: "Scroll to discover",
    backToFlavors: "Back to scents",
    pack: (label) => `${label}`,
    otherPacks: "Other sizes",
    prevFeature: "Previous story",
    nextFeature: "Next story",
    backToFlavor: "Back to scent",
    prevFlavor: "Previous scent",
    nextFlavor: "Next scent",
    exploreCan: (n) => `Explore the bottle · ${n} stories`,
    whatsInside: "Inside the bottle",
    drag: "Drag to turn the bottle",
    ritual: "02 — Ritual",
    steps: "Steps",
    inCan: "In the bottle",
    shopEyebrow: "03 — Shop",
    shopTitle: "Choose your scent",
    shopTag: "Pick a scent and a size; we'll wrap it like a gift.",
    flavor: "Scent",
    mix: "Discovery set",
    size: "Bottle size",
    cans: "ml",
    perCan: (p) => `${p}`,
    delivery: "Packaging",
    once: "Standard box",
    subscribe: () => "Gift box with a handwritten note",
    subNote: "Free · ribboned box, personal message card",
    qty: "Quantity",
    dec: "Decrease quantity",
    inc: "Increase quantity",
    packPerCan: (label) => `Extrait de Parfum · ${label}`,
    addToCart: "Add to bag",
    freeOver: (p) => `Free shipping over ${p}`,
    ships: "Ships in 24 h",
    recyclable: "Designed in Istanbul, made in Türkiye",
    cart: "Your bag",
    closeCart: "Close cart",
    emptyCart: "Your bag is empty.",
    buildBox: "Choose a scent",
    toFree: (p) => `${p} away from free shipping`,
    freeUnlocked: "Free shipping unlocked",
    subLine: () => "Gift box · handwritten note",
    oneTime: "Standard box",
    remove: "Remove",
    subtotal: "Subtotal",
    shipping: "Shipping",
    free: "Free",
    total: "Total",
    checkout: "Checkout",
    checkoutSoon: "Online checkout opens soon. Your bag is saved on this device until then.",
    taxes: "Taxes calculated at checkout · delivery in 1–3 business days",
    goalLeft: (p) => `${p} away from your gift`,
    goalDone: "Your gift is in the cart",
    shipLater: "Calculated at checkout",
    checkoutNote: "",
    variant: "Option",
    related: "Similar products",
    marquee: ["Hope in a bottle", "A story in every note", "A new discovery in every breath", "Eastern opulence, Western elegance", "From the city that never sleeps", "Extrait de Parfum · 30%", "Esxence Milan 2024"],
    storyEyebrow: "04 — Story",
    founder: "Founders and perfumers",
    perfumer: "Perfumer",
    family: "Family",
    year: "Year",
    collection: "Collection",
    milestones: "Milestones",
    press: "As seen at",
    locator: {
      search: "Search country, city or store",
      country: "Country",
      allCountries: (n) => `All countries (${n})`,
      count: (n) => `${n} location${n === 1 ? "" : "s"}`,
      none: "No partners match your selection.",
      showAll: (n) => `Show all (${n})`,
      directions: "Directions",
      source: "List taken from the brand's store locator.",
      types: { "Physical Store": "Store", "Online Store": "Online store", "Physical + Online": "Store + online", "Retail Partner": "Retail partner", Distributor: "Distributor", Warehouse: "Warehouse" },
    },
    composition: "Full composition",
    whereEyebrow: "05 — Where",
    whereTitle: "Where to find us",
    whereTag: "From Istanbul to Milan, one spray away.",
    place: "Place",
    spot: "Spot",
    status: "Status",
    faqEyebrow: "06 — FAQ",
    faqTitle: "Good questions",
    contact: "Contact",
    contactTitle: "Write to us",
    contactTag: "For boutiques, hotels and corporate gifting.",
    thanks: "Thank you. We'll reply within two business days.",
    name: "Full name",
    email: "Email",
    message: "Message",
    send: "Send message",
    newsletter: "Newsletter",
    newsTitle: "New scents are announced here first.",
    joined: "You're on the list.",
    emailAddress: "Email address",
    emailPh: "you@example.com",
    join: "Join",
    caffeine: "For external use only; keep away from heat and flame.",
    footerNav: "Footer",
    madeForShort: (b) => `Concept demo prepared for ${b}`,
    web: "Web",
    langLabel: "Language",
    allEyebrow: "All products",
    allTitle: "The whole collection",
    allTag: (n) => `${n} products.`,
    byCategory: "Shop by category",
    exploreAll: "Explore all products",
    search: "Search products",
    searchPlaceholder: "Search a product, ingredient or category",
    searchClear: "Clear",
    searchPopular: "Featured",
    searchResults: (n) => `${n} result${n === 1 ? "" : "s"}`,
    searchEmpty: (q) => `No products found for "${q}"`,
    searchMove: "move",
    searchOpen: "open",
    exploreSub: (n, c) => `${n} products · ${c} categories`,
    backHome: "Home",
    catalogTitle: "Products",
    categories: "Categories",
    all: "All",
    itemsCount: (n) => `${n} ${n === 1 ? "product" : "products"}`,
    photos: "Product photos",
    rating: "Rating",
    reviews: (n) => `${n} reviews`,
    otherCategories: "Other categories",
    added: "Added",
  },
};

// ---------------------------------------------------------------- yardımcılar
const cache = {};

// content.json'daki arayüz yazıları varsayılanların üzerine yazılır. Varsayılanı
// fonksiyon olan metinler JSON'da "{0} ürününü keşfet" gibi kalıpla verilir.
function mergeUi(base, over = {}) {
  const out = { ...base };
  for (const [k, v] of Object.entries(over)) {
    if (typeof base[k] === "function" && typeof v === "string") out[k] = (...a) => v.replace(/\{(\d)\}/g, (_, i) => a[i]);
    else if (base[k] && typeof base[k] === "object" && !Array.isArray(base[k]) && typeof v === "object") out[k] = { ...base[k], ...v };
    else out[k] = v;
  }
  return out;
}

export function getT(lang) {
  if (cache[lang]) return cache[lang];
  const en = lang === "en";
  const P = PRICES[lang];
  // Tam sayılarda kuruş gösterilmez (₺890, $25); kuruşlu fiyatlarda iki hane (₺1.333,90).
  const fmt0 = new Intl.NumberFormat(P.locale, { style: "currency", currency: P.currency, currencyDisplay: "narrowSymbol", minimumFractionDigits: 0, maximumFractionDigits: 0 });
  const fmt2 = new Intl.NumberFormat(P.locale, { style: "currency", currency: P.currency, currencyDisplay: "narrowSymbol", minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const money = (n) => (Math.abs(n - Math.round(n)) < 0.005 ? fmt0 : fmt2).format(n);
  // Fiyat: ürünün kendi fiyatı varsa (content.json → products[].price) adet × fiyat ×
  // paket indirimi; yoksa markanın paket fiyat tablosu (prices.packs).
  const factor = Object.fromEntries(C.packs.map((p) => [p.size, p.factor ?? 1]));
  const own = D.flavors.map((f) => f.price?.[lang]);
  const avg = own.every(Boolean) ? own.reduce((a, b) => a + b, 0) / own.length : null;
  const catalog = Object.fromEntries((C.catalog?.items ?? []).map((i) => [`c:${i.id}`, i]));
  const price = (size, plan, flavor) => {
    const base = catalog[flavor] ? catalog[flavor].price[lang] : flavor === D.VARIETY ? avg : own[flavor];
    const p = base ? base * size * factor[size] : P.packs[size];
    const v = p * (plan === "sub" ? 1 - D.SUB_DISCOUNT : 1);
    // İndirimli set fiyatları yuvarlanır: ₺ 10'luk, $ tam sayı.
    if (!base || size === 1) return Math.round(v * 100) / 100;
    return P.currency === "TRY" ? Math.round(v / 10) * 10 : Math.round(v);
  };
  const packLabel = (size) => D.packLabel(size, lang);
  const flavorText = D.flavors.map((f, i) => (en ? { ...f, ...EN.flavors[i] } : f));

  const t = {
    lang,
    contactInfo: C.contactInfo?.[lang] ?? null,
    ui: mergeUi(UI[lang], C.ui?.[lang]),
    money: C.commerce?.showcase ? () => "" : money,
    price,
    // "50 ml · ₺1.350"; vitrin modunda yalnızca hacim.
    tagPrice: (size, id) => [size, C.commerce?.showcase ? null : money(price(1, "once", id))].filter(Boolean).join(" · "),
    showcase: !!C.commerce?.showcase,
    packLabel,
    flavor: (i) => flavorText[i],
    flavorName: (id) => (id === D.VARIETY ? t.ui.mix : catalog[id] ? catalog[id].name[lang] ?? catalog[id].name.tr : flavorText[id].name),
    catalogItem: (id) => catalog[id],
    // Ürün adının dili (İngilizce modda ad İngilizcedir).
    nameLang: en ? "en" : D.NAME_LANG,
    features: D.features.map((f, i) => (en ? { ...f, ...EN.features[i] } : f)),
    ritual: D.ritual.map((r, i) => (en ? { ...r, ...EN.ritual[i] } : r)),
    stockists: en ? EN.stockists : D.stockists,
    story: en ? { ...D.story, ...EN.story } : D.story,
    faqs: en ? EN.faqs : D.faqs,
    glossary: C.glossary?.[lang] ?? {},
    specs: en ? EN.specs : D.specs,
    brand: en ? { ...brandTr, ...EN.brand } : brandTr,
    packs: D.packs.map((p) => ({ ...p, label: en ? EN.packLabels[p.size] : p.label })),
    freeShipping: P.freeShipping,
    // Markaya özel satış kuralları (content.json → commerce): paket/paketleme seçimi,
    // sepet hedefi (ör. hediye eşiği), kargonun ödemede hesaplanması, Shopify ödemesi.
    commerce: C.commerce ?? {},
    shipping: P.shipping,
    subPct: Math.round(D.SUB_DISCOUNT * 100),
  };
  cache[lang] = t;
  return t;
}

export function useT() {
  const lang = useStore((s) => s.lang);
  return getT(lang);
}
