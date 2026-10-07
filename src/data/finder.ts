import { products, type Product, type ProductId } from './products';

export type Family = 'fresh' | 'floral' | 'sweet' | 'warm';
export const FAMILIES: Family[] = ['fresh', 'floral', 'sweet', 'warm'];
export type Vec = Record<Family, number>;

/** Soru puanları (A–D) */
export const ANSWERS: Partial<Vec>[][] = [
  [{ fresh: 1 }, { floral: 1 }, { sweet: 1 }, { warm: 1 }],
  [{ fresh: 0.6, floral: 0.4 }, { sweet: 0.5, warm: 0.5 }, { warm: 0.7, sweet: 0.3 }, { floral: 0.5, fresh: 0.5 }],
  [{ fresh: 0.6, floral: 0.4 }, { sweet: 0.6, floral: 0.4 }, { warm: 0.7, sweet: 0.3 }, { floral: 0.6, warm: 0.4 }],
];

/** Aile sözlükleri (TR, küçük harf; kök eşleşmesi) */
const DICT: Record<Family, string[]> = {
  fresh: ['bergamot', 'mandalina', 'greyfurt', 'neroli', 'deniz', 'marin', 'akuatik', 'sulu', 'yeşil', 'kakule', 'armut', 'limon', 'narenciye', 'ravent'],
  floral: ['gül', 'yasemin', 'portakal çiçeği', 'manolya', 'müge', 'süsen', 'sümbülteber', 'pudra', 'çiçek'],
  sweet: ['şeftali', 'liçi', 'çilek', 'pamuk şekeri', 'vanilya', 'rom', 'çarkıfelek', 'meyve', 'tatlı', 'fındık', 'davana', 'kremamsı'],
  warm: ['misk', 'paçuli', 'sedir', 'sandal', 'safran', 'cypriol', 'kaşmir', 'ambergris', 'amber', 'deri', 'tütsü', 'benjoin', 'isli', 'odun', 'balsamik', 'laden', 'ladanyum', 'yosun', 'solar'],
};

const lower = (s: string) => s.toLocaleLowerCase('tr-TR');

/** Her kokunun piramit notaları ve ailesi sayılır, normalize edilir (koku profili) */
export function scentProfile(p: Product): Vec {
  const text = lower([...p.pyramid.tr, p.family.tr].join(' , '));
  const v: Vec = { fresh: 0, floral: 0, sweet: 0, warm: 0 };
  for (const f of FAMILIES) {
    for (const w of DICT[f]) {
      let i = text.indexOf(w);
      while (i !== -1) { v[f]++; i = text.indexOf(w, i + w.length); }
    }
  }
  const len = Math.hypot(v.fresh, v.floral, v.sweet, v.warm) || 1;
  for (const f of FAMILIES) v[f] /= len;
  return v;
}

const PROFILES = new Map(products.map((p) => [p.id, scentProfile(p)]));

/** Cevapların toplam vektörüyle nokta çarpımı: en yüksek sonuç + iki alternatif */
export function rank(answers: number[]): ProductId[] {
  const sum: Vec = { fresh: 0, floral: 0, sweet: 0, warm: 0 };
  answers.forEach((a, q) => {
    const w = ANSWERS[q]?.[a];
    if (w) for (const f of FAMILIES) sum[f] += w[f] ?? 0;
  });
  return products
    .map((p) => {
      const pr = PROFILES.get(p.id)!;
      return { id: p.id, s: FAMILIES.reduce((acc, f) => acc + pr[f] * sum[f], 0) };
    })
    .sort((a, b) => b.s - a.s)
    .map((x) => x.id);
}
