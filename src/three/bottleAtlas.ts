import * as THREE from 'three';
import type { Product } from '../data/products';
import type { BottleProfile } from './assets';

const titleCase = (s: string) => s.toLowerCase().replace(/(^|\s)\S/g, (m) => m.toUpperCase());

/**
 * Şişe dokusu atlası: sol yarı ön fotoğraf (birebir), sağ yarı arka yüz.
 * Arka yüz: buzlu camın gölgelenmesi korunsun diye fotoğraf aynalanıp çok bulanıklaştırılır,
 * üstüne arka etiket yazılır (ad, EDP, kadın/erkek, 100 ml).
 */
export function buildAtlas(img: HTMLImageElement | ImageBitmap, product: Product, profile: BottleProfile) {
  const w = img.width;
  const h = img.height;
  const c = document.createElement('canvas');
  c.width = w * 2;
  c.height = h;
  const g = c.getContext('2d')!;
  g.drawImage(img, 0, 0, w, h);

  // arka yüz zemini: baskısız buzlu cam. Gövdenin baskı olmayan sol kenarından bir piksellik sütun
  // tüm genişliğe yayılır (camın dikey gölgelenmesi korunur), üstüne silindirik yan gölge eklenir.
  g.save();
  g.imageSmoothingEnabled = true;
  g.drawImage(img, Math.round(w * 0.12), 0, 2, h, w, 0, w, h);
  const side = g.createLinearGradient(w, 0, w * 2, 0);
  side.addColorStop(0, 'rgba(60, 64, 62, 0.22)');
  side.addColorStop(0.18, 'rgba(60, 64, 62, 0)');
  side.addColorStop(0.82, 'rgba(60, 64, 62, 0)');
  side.addColorStop(1, 'rgba(60, 64, 62, 0.22)');
  g.fillStyle = side;
  g.fillRect(w, 0, w, h);
  g.restore();

  // etiket: gövdenin ortasında
  const neck = profile.neck;
  const cx = w * 1.5;
  const cy = h * (neck + (1 - neck) * 0.47);
  const bodyW = w * 0.62;
  const gender = product.gender === 'kadın' ? 'KADIN' : 'ERKEK';
  const name = product.name;
  g.fillStyle = 'rgba(48, 46, 44, 0.86)';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  const serif = 'Georgia, "Times New Roman", serif';
  const fit = (text: string, size: number, maxW: number, weight = '400') => {
    let s = size;
    do { g.font = `${weight} ${s}px ${serif}`; s -= 2; } while (g.measureText(text).width > maxW && s > 10);
  };
  const L = h * 0.05;
  fit(`UNBE. ${name} EDP`, L, bodyW);
  g.fillText(`UNBE. ${name} EDP`, cx, cy - L * 1.6);
  fit(`${gender} PARFÜM`, L, bodyW);
  g.fillText(`${gender} PARFÜM`, cx, cy - L * 0.4);
  const small = `UnBe. ${titleCase(name)} EDP ${titleCase(gender)} Parfüm`;
  fit(small, L * 0.55, bodyW);
  g.fillText(small, cx, cy + L * 0.9);
  g.font = `400 ${L * 0.52}px ${serif}`;
  g.fillText('100 ml', cx, cy + L * 2.3);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.generateMipmaps = true;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  return tex;
}
