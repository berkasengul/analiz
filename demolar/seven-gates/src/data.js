// Markanın bütün içeriği content.json'da (demo fabrikası bu dosyayı üretir).
// Burada Türkçe içerik uygulamanın beklediği biçime çevrilir; İngilizcesi
// i18n.js'te aynı dosyadan okunur. `color` kokunun arayüz rengi, `theme` her
// kokunun sahnesi (`glow` ışık, `edge` kenar karanlığı, `drop` buğu rengi).
import C from "./content.json";

export const content = C;

export const flavors = C.products.map(({ en, label, file, ...f }) => ({ ...f, file }));

export const specs = C.specs.tr;

// Detay görünümündeki özellik hikâyeleri. `pose`, şişenin o özellikte duruşu.
export const features = C.features.map(({ icon, pose, tr }) => ({ icon, pose, ...tr }));

// Ritüel bölümündeki adımlar. Şişe her adımda farklı bir poza ve kokuya geçer.
export const ritual = C.ritual.map(({ flavor, tr }) => ({ flavor, ...tr }));

// Mağaza boyutları: `size` ml cinsinden, fiyatlar content.json → prices.
export const packs = C.packs.map((p) => ({ size: p.size, price: C.prices.tr.packs[p.size], label: p.label.tr }));

export const SUB_DISCOUNT = C.subDiscount;
export const FREE_SHIPPING = C.prices.tr.freeShipping;
export const SHIPPING = C.prices.tr.shipping;
export const VARIETY = "variety";
export const DEFAULT_SHOP_FLAVOR = C.defaultShopFlavor;

export const stockists = C.stockists.tr;

export const story = {
  founder: C.story.founder,
  instagram: C.story.instagram,
  website: C.story.website,
  press: C.story.press,
  ...C.story.tr,
};

export const faqs = C.faqs.tr;

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
