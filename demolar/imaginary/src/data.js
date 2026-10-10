// Markanın bütün içeriği content.json'da (demo fabrikası bu dosyayı üretir).
// Burada Türkçe içerik uygulamanın beklediği biçime çevrilir; İngilizcesi
// i18n.js'te aynı dosyadan okunur. `color` kokunun arayüz rengi, `theme` her
// kokunun sahnesi (`glow` ışık, `edge` kenar karanlığı, `drop` buğu rengi).
import C from "./content.json";

export const content = C;
// Markanın kapattığı ana sayfa bölümleri (content.hide, ör. ["story"]): sayfada, menüde ve altlıkta görünmez.
export const HIDDEN = new Set(C.hide ?? []);
// Vitrin modu (content.commerce.showcase): markanın online satışı yok (mağaza/bayi ağıyla satıyor). Fiyatlar
// gösterilmez, sepet yoktur; "Sepete ekle" yerine ürünün adıyla markanın hattı (WhatsApp) açılır:
//   { "href": "https://wa.me/90...?text={text}", "message": { "tr": "Merhaba, {0} hakkında bilgi almak istiyorum.", "en": "…" } }
export const SHOWCASE = C.commerce?.showcase ?? null;
export function inquire(name, lang = "tr") {
  const msg = (SHOWCASE.message?.[lang] ?? SHOWCASE.message?.tr ?? "{0}").replace("{0}", name);
  window.open(SHOWCASE.href.replace("{text}", encodeURIComponent(msg)), "_blank", "noopener");
}

// Sayfanın ürün seti. Ana sayfa öne çıkan ürünleri (`home`), bir kategori sayfası
// (#/urunler/<kategori>) yalnızca o kategorinin ürünlerini 3B akışta gösterir.
// Set sayfa açılırken bir kez seçilir; başka bir sete geçişte sayfa yeniden yüklenir.
const ROUTE = /^#\/urunler\/([^/?#]+)(?:\/([^/?#]+))?/.exec(typeof window !== "undefined" ? window.location.hash : "");
const catItems = ROUTE && C.catalog ? C.catalog.items.filter((i) => i.category === ROUTE[1] && i.product != null) : [];
export const PAGE = catItems.length ? { kind: "category", id: ROUTE[1], focus: ROUTE[2] ?? null } : { kind: "home" };
export const HOME_SET = C.home ?? C.products.map((_, i) => i);
// ?still=<n>: kart görseli çekimi (Still.jsx) yalnızca o ürünü yükler.
const STILL = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("still") : null;
export const SET =
  STILL != null ? [Math.max(0, Math.min(C.products.length - 1, Number(STILL) || 0))] : PAGE.kind === "category" ? catItems.map((i) => i.product) : HOME_SET;
export const setKey = (hash) => {
  const m = /^#\/urunler\/([^/?#]+)/.exec(hash);
  return m && C.catalog?.items.some((i) => i.category === m[1] && i.product != null) ? m[1] : "home";
};
export const SET_KEY = PAGE.kind === "category" ? PAGE.id : "home";
// 3B ürün → katalog kaydı (sepet, sayfalar arasında bu kimliği kullanır).
const CID = Object.fromEntries((C.catalog?.items ?? []).filter((i) => i.product != null).map((i) => [i.product, i.id]));
export const catalogIdOf = (g) => CID[g];

export const flavors = SET.map((g) => {
  const { en, label, file, ...f } = C.products[g];
  const bg = label?.lalive?.bg;
  return { ...f, file, gid: g, cid: CID[g], labelBg: bg ? `rgb(${bg.join(",")})` : null };
});
export const localIndex = (g) => SET.indexOf(g);

export const specs = C.specs.tr;

// Detay görünümündeki özellik hikâyeleri. `pose`, şişenin o özellikte duruşu.
export const features = C.features.map(({ icon, pose, tr }) => ({ icon, pose, ...tr }));

// Ritüel bölümündeki adımlar. Şişe her adımda farklı bir poza ve kokuya geçer.
// Kategori sayfalarında Ritüel bölümü yok.
export const ritual = PAGE.kind === "home" ? C.ritual.map(({ flavor, tr }) => ({ flavor: localIndex(flavor), ...tr })) : [];

// Mağaza boyutları: `size` ml cinsinden, fiyatlar content.json → prices.
export const packs = C.packs.map((p) => ({ size: p.size, price: C.prices.tr.packs[p.size], label: p.label.tr }));

export const SUB_DISCOUNT = C.subDiscount;
export const FREE_SHIPPING = C.prices.tr.freeShipping;
export const SHIPPING = C.prices.tr.shipping;
export const VARIETY = "variety";
// Ürün adlarının dili: büyük harfe çevirirken doğru kural için ("Güneş Kremi" → tr).
export const NAME_LANG = C.nameLang ?? "en";
// Marka simgesi (başlık, yükleme ekranı): "bottle" ya da "leaf".
export const BRAND_ICON = C.icon ?? "bottle";
export const DEFAULT_SHOP_FLAVOR = Math.max(0, localIndex(C.defaultShopFlavor));
// Detaydaki "sepete ekle" düğmesinin boyutu; yoksa en büyük paket.
export const DETAIL_PACK = C.detailPack ?? C.packs[C.packs.length - 1].size;

export const stockists = C.stockists?.tr ?? [];

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

// packUnit: "ml" ya da dile göre {"tr": "adet", "en": "pc"}.
export function packLabel(size, lang = "tr") {
  const u = C.packUnit ?? "ml";
  return `${size} ${typeof u === "object" ? u[lang] ?? u.tr : u}`;
}

const fmt = new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" });
export const money = (n) => fmt.format(n);
