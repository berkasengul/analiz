export type Lang = 'tr' | 'en';
export type ProductId = 'no-tears' | 'no-excuse' | 'no-drama' | 'no-regrets' | 'no-filter' | 'no-rules';

export interface Product {
  id: ProductId;
  name: string;
  gender: 'kadın' | 'erkek';
  family: Record<Lang, string>;
  stance: Record<Lang, string>;
  story: string;
  dna: string[];
  pyramid: Record<Lang, [string, string, string]>;
  /** canlı sahne rengi */
  color: string;
  /** açık ton: vurgu, yazı parıltısı */
  tint: string;
  /** kenar / gölge tonu */
  dark: string;
  priceTRY: number;
  variantId: number;
  image: string;
  url: string;
}

export const products: Product[] = [
  {"id": "no-tears", "name": "NO TEARS", "gender": "kadın", "family": {"tr": "Odunsu · Amberimsi", "en": "Woody · Ambery"}, "stance": {"tr": "Yumuşak — Işıltılı — Dayanıklı", "en": "Soft — Luminous — Resilient"}, "story": "Duygusal resetleme.", "dna": ["Parlak narenciye açılışı", "Işıltılı çiçek sıcaklığı", "Kremamsı misk temeli"], "pyramid": {"tr": ["Üst: Mandalina, Şeftali, Bergamot, Yeşil", "Kalp: Portakal Çiçeği, Solar, Amberimsi", "Dip: Misk, Kremamsı, Paçuli"], "en": ["Top: Mandarin, Peach, Bergamot, Green", "Heart: Orange Blossom, Solar notes, Ambery", "Base: Musk, Creamy notes, Patchouli"]}, "color": "#2a9a88", "tint": "#bff0e6", "dark": "#06201c", "priceTRY": 1999.0, "variantId": 52728293392747, "image": "https://cdn.shopify.com/s/files/1/0953/3259/8123/files/Tearsise.png", "url": "https://unbeperfumes.com/products/no-tears"},
  {"id": "no-excuse", "name": "NO EXCUSE", "gender": "erkek", "family": {"tr": "Odunsu · Marin", "en": "Woody · Marine"}, "stance": {"tr": "Odaklı — Minimal — Güçlü", "en": "Minimal — Powerful"}, "story": "Tutarlı ve saf disiplin sahibi, kimse bakmazken bile kendi doğruları ve hedefleri için varoluşlarını taçlandıranların kokusu.", "dna": ["Narenciye ve marine ferahlığı", "Baharatlı çiçeksi sıcaklık", "Güçlü odunsu temel"], "pyramid": {"tr": ["Üst: Mandalina, Neroli, Deniz notaları, Safran", "Kalp: Cypriol, Kaşmir ağacı, Gül, Amberimsi, İsli", "Dip: Misk, Cistus (Laden), Amberimsi, Sandal Ağacı, Yosun, İsli"], "en": ["Top: Mandarin, Neroli, Marine, Saffron", "Heart: Cypriol, Cashmere, Rose, Ambery, Smoky", "Base: Musk, Cistus, Ambery, Sandalwood, Moss, Smoky"]}, "color": "#6a4ac8", "tint": "#dcd0ff", "dark": "#100828", "priceTRY": 1999.0, "variantId": 52660951023979, "image": "https://cdn.shopify.com/s/files/1/0953/3259/8123/files/noexcusesise.png", "url": "https://unbeperfumes.com/products/no-excuse"},
  {"id": "no-drama", "name": "NO DRAMA", "gender": "kadın", "family": {"tr": "Oryantal · Odunsu", "en": "Oriental · Woody"}, "stance": {"tr": "Sakin — Dengeli — Sessiz Güç", "en": "Calm — Balanced — Quiet Power"}, "story": "Gürültüyü seven bir dünyada, NO DRAMA sessiz bir başkaldırıdır.", "dna": ["Ferah akuatik açıklık", "Yumuşak pudramsı çiçekler", "Sıcak amber ve misk temeli"], "pyramid": {"tr": ["Üst: Sulu notalar, Bergamot, Davana, Rom", "Kalp: Kremamsı, Pudramsı, Gül", "Dip: Misk, Ambergris, Vanilya, Sandal Ağacı, Amberimsi"], "en": ["Top: Aqueous, Bergamot, Davana, Rum", "Heart: Creamy, Powdery , Rose", "Base: Musk, Ambergris, Vanilla, Sandalwood, Ambery"]}, "color": "#d89a30", "tint": "#ffe6b8", "dark": "#2a1a04", "priceTRY": 1999.0, "variantId": 52660950270315, "image": "https://cdn.shopify.com/s/files/1/0953/3259/8123/files/No_Drama_Sise.png", "url": "https://unbeperfumes.com/products/no-drama"},
  {"id": "no-regrets", "name": "NO REGRETS", "gender": "kadın", "family": {"tr": "Çiçeksi · Tatlı", "en": "Floral · Sweet"}, "stance": {"tr": "Cesur — Canlı — Derin", "en": "Bold — Vibrant — Deep"}, "story": "Anlık bir dürtünün nabzı.", "dna": ["Baharatlı meyvemsi açılış", "Yoğun beyaz çiçekler", "Sıcak balsamik odunsular"], "pyramid": {"tr": ["Üst: Kakule, Şeftali, Armut", "Kalp: Yasemin, Gül, Sümbülteber", "Dip: Balsamik, Sedir Ağacı, Misk"], "en": ["Top: Cardamom, Peach, Pear", "Heart: Jasmine, Rose, Tuberose", "Base: Balsamic notes, Cedarwood, Musk"]}, "color": "#9a50d0", "tint": "#ecd4ff", "dark": "#1c0a28", "priceTRY": 1999.0, "variantId": 52660948500843, "image": "https://cdn.shopify.com/s/files/1/0953/3259/8123/files/regretssise.png", "url": "https://unbeperfumes.com/products/no-regrets"},
  {"id": "no-filter", "name": "NO FILTER", "gender": "kadın", "family": {"tr": "Çiçeksi · Meyvemsi", "en": "Floral · Fruity"}, "stance": {"tr": "Gerçek — Cesur — Parlak", "en": "Authentic — Bold — Radiant"}, "story": "Şişelenmiş saf dürüstlük.", "dna": ["Canlı meyvemsi enerji", "Yumuşak çiçeksi sıcaklık", "Misk ve vanilya izi"], "pyramid": {"tr": ["Üst: Pamuk Şekeri, Tütsü, Liçi, Çilek", "Kalp: Fındık, Manolya, Gül, Yeşil", "Dip: Amberimsi, Misk, Sandal Ağacı, Vanilya"], "en": ["Top: Cotton Candy, Incense, Lychee, Strawberry", "Heart: Hazelnut, Magnolia, Rose, Green", "Base: Ambery notes, Musk, Sandalwood, Vanilla"]}, "color": "#e04a2c", "tint": "#ffd0c4", "dark": "#2a0804", "priceTRY": 1999.0, "variantId": 52660946764139, "image": "https://cdn.shopify.com/s/files/1/0953/3259/8123/files/nofiltersise.png", "url": "https://unbeperfumes.com/products/no-filter"},
  {"id": "no-rules", "name": "NO RULES", "gender": "erkek", "family": {"tr": "Meyvemsi", "en": "Fruity"}, "stance": {"tr": "Özgür — Manyetik — Modern", "en": "Free — Magnetic — Modern"}, "story": "Kalıpları kırmanın kokusu.", "dna": ["Narenciye ve egzotik meyve enerjisi", "Zarif çiçek kalbi", "Deri dokulu amber ve odunsular"], "pyramid": {"tr": ["Üst: Bergamot, Greyfurt, Liçi, Çarkıfelek Meyvesi, Ravent, Safran", "Kalp: Yasemin, Müge (İnci Çiçeği), Süsen Kökü (İris), Gül", "Dip: Ambergris, Benjoin, Kaşmir ağacı, Sedir Ağacı, Ladanyum, Deri"], "en": ["Top: Bergamot, Grapefruit, Lychee, Passionfruit, Rhubarb, Saffron", "Heart: Jasmine, Lily of the valley, Orris, Rose", "Base: Ambergris, Benzoin, Cashmere, Cedarwood, Labdanum, Leather"]}, "color": "#e07a28", "tint": "#ffdcb8", "dark": "#2a1204", "priceTRY": 1999.0, "variantId": 52658948899179, "image": "https://cdn.shopify.com/s/files/1/0953/3259/8123/files/norulessise.png", "url": "https://unbeperfumes.com/products/no-rules"}
] as Product[];

/** Ritüel sloganları (kampanya görsellerinden) */
export const ritualSlogans: Record<ProductId, Record<Lang, string>> = {
  'no-tears': { tr: 'Güç, gözyaşlarının bittiği yerde başlar.', en: 'Strength begins where the tears end.' },
  'no-excuse': { tr: 'Sonuçlar bahanelerden yüksek sesle konuşur.', en: 'Results speak louder than excuses.' },
  'no-drama': { tr: 'Varlık, her tartışmadan daha yüksek sesle konuşur.', en: 'Presence is louder than any argument.' },
  'no-regrets': { tr: 'Her seçim hikâyenin bir parçası olur.', en: 'Every choice becomes part of the story.' },
  'no-filter': { tr: 'Gerçek sen, en nadir olanısın.', en: 'The real you is the rarest flex.' },
  'no-rules': { tr: 'Yolu sen yarat. Takip etme.', en: 'Create the path. Don’t follow it.' },
};

export const productIndex = (id: ProductId) => products.findIndex((p) => p.id === id);
export const getProduct = (id: ProductId) => products[productIndex(id)];

/** Kapağı siyah küre olan şişeler */
export const blackCap: Record<ProductId, boolean> = {
  'no-tears': false, 'no-excuse': true, 'no-drama': false, 'no-regrets': false, 'no-filter': false, 'no-rules': true,
};

/** "Odunsu · Amberimsi" → piramit satırından notaları ayırır: "Üst: A, B" → ["A","B"] */
export function pyramidNotes(line: string): string[] {
  const i = line.indexOf(':');
  return line.slice(i + 1).split(',').map((s) => s.trim()).filter(Boolean);
}
export function pyramidLabel(line: string): string {
  return line.slice(0, line.indexOf(':')).trim();
}

/** Sağ bloktaki 5 nota: üst + kalp + dipten sırayla ilk beş */
export function topNotes(p: Product, lang: Lang, n = 5): string[] {
  const [a, b, c] = p.pyramid[lang].map(pyramidNotes);
  const out: string[] = [];
  const lists = [a, b, c];
  let k = 0;
  while (out.length < n && k < 12) {
    for (const l of lists) if (l[k] && out.length < n) out.push(l[k]);
    k++;
  }
  return out;
}
