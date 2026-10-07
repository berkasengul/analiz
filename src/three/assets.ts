import { products, type ProductId } from '../data/products';

export interface BottleProfile {
  neck: number;
  rows: number[];
  edgeColor: string;
  width: number;
  height: number;
}

const profiles = new Map<ProductId, BottleProfile>();

export const imageUrl = (id: ProductId) => `/products/${id}.png`;
export const profileUrl = (id: ProductId) => `/products/${id}.json`;

export const getProfile = (id: ProductId) => {
  const p = profiles.get(id);
  if (!p) throw new Error(`profil yüklenmedi: ${id}`);
  return p;
};

/** Görselleri ve profilleri önceden yükler; ilerlemeyi bildirir */
export async function preloadAssets(onProgress: (f: number) => void) {
  const jobs: Promise<unknown>[] = [];
  let done = 0;
  const total = products.length * 2 + 1;
  const tick = () => onProgress(++done / total);
  for (const p of products) {
    jobs.push(
      fetch(profileUrl(p.id))
        .then((r) => r.json())
        .then((j: BottleProfile) => { profiles.set(p.id, j); tick(); }),
    );
    jobs.push(loadImage(imageUrl(p.id)).then(tick, tick));
  }
  jobs.push(loadImage('/brand/logo.png').then(tick, tick));
  await Promise.all(jobs);
}

function loadImage(src: string) {
  return new Promise<void>((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => resolve();
    img.onerror = () => reject(new Error(src));
    img.src = src;
  });
}
