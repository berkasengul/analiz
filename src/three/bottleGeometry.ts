import * as THREE from 'three';
import { toCreasedNormals } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { BottleProfile } from './assets';

/** Şişe boyu (dünya birimi) */
export const BOTTLE_H = 3.3;

export interface BottleMeta {
  /** görselin dünya genişliği (u = 0.5 + x / imgW) */
  imgW: number;
  topY: number;
  neckY: number;
  /** gövdenin ortası: piramitte üst/alt yarıların kesiti */
  midY: number;
  bottomY: number;
  bodyHalf: number;
  capHalf: number;
  depth: number;
  neckRow: number;
  firstRow: number;
  lastRow: number;
}

export function bottleMeta(p: BottleProfile): BottleMeta {
  const N = p.rows.length;
  const imgW = (p.width / p.height) * BOTTLE_H;
  let firstRow = 0;
  while (firstRow < N - 1 && p.rows[firstRow] <= 0.002) firstRow++;
  let lastRow = N - 1;
  while (lastRow > 0 && p.rows[lastRow] <= 0.002) lastRow--;
  const neckRow = Math.max(firstRow + 2, Math.min(lastRow - 4, Math.round(p.neck * N)));
  let bodyHalf = 0;
  for (let r = neckRow; r <= lastRow; r++) bodyHalf = Math.max(bodyHalf, p.rows[r] * imgW);
  let capHalf = 0;
  for (let r = firstRow; r < neckRow; r++) capHalf = Math.max(capHalf, p.rows[r] * imgW);
  const yOfEdge = (r: number) => BOTTLE_H * (1 - r / N);
  const neckY = yOfEdge(neckRow);
  const bottomY = yOfEdge(lastRow + 1);
  return {
    imgW,
    topY: yOfEdge(firstRow),
    neckY,
    midY: (neckY + bottomY) / 2,
    bottomY,
    bodyHalf,
    capHalf,
    depth: bodyHalf * 2 * 0.42,
    neckRow,
    firstRow,
    lastRow,
  };
}

/**
 * Doku atlası: sol yarı ön fotoğraf, sağ yarı arka etiket.
 * Ön yüz u = (0.5 + x / imgW) / 2; arka yüz arkadan okunacak şekilde aynalanır.
 */
const frontU = (x: number, imgW: number) => (0.5 + x / imgW) * 0.5;
const backU = (x: number, imgW: number) => 0.5 + (0.5 - x / imgW) * 0.5;

function photoUV(imgW: number, depth: number) {
  return {
    generateTopUV(_g: THREE.ExtrudeGeometry, v: number[], a: number, b: number, c: number) {
      // ExtrudeGeometry: arka kapak z < 0, ön kapak z > depth (pah dahil)
      const back = v[a * 3 + 2] < depth / 2;
      return [a, b, c].map((i) => new THREE.Vector2(back ? backU(v[i * 3], imgW) : frontU(v[i * 3], imgW), v[i * 3 + 1] / BOTTLE_H));
    },
    generateSideWallUV(_g: THREE.ExtrudeGeometry, v: number[], a: number, b: number, c: number, d: number) {
      // yan yüzler düz renk; yine de kenar pikselini örnekleyen anlamlı bir UV ver
      return [a, b, c, d].map((i) => new THREE.Vector2(frontU(v[i * 3], imgW), v[i * 3 + 1] / BOTTLE_H));
    },
  };
}

function bodyShape(p: BottleProfile, m: BottleMeta, fromRow: number, toRow: number, fromY: number, toY: number) {
  const N = p.rows.length;
  const yOf = (r: number) => BOTTLE_H * (1 - (r + 0.5) / N);
  const half = (r: number) => Math.max(0.02, p.rows[Math.min(N - 1, Math.max(0, r))] * m.imgW);
  const right: THREE.Vector2[] = [];
  right.push(new THREE.Vector2(half(fromRow), fromY));
  for (let r = fromRow; r <= toRow; r++) {
    const y = yOf(r);
    if (y >= fromY || y <= toY) continue;
    // düz bölgelerde gereksiz noktaları atla (eğrilik yoksa)
    const prev = right[right.length - 1];
    const h = half(r);
    if (r > fromRow + 2 && r < toRow - 2 && Math.abs(h - prev.x) < 0.0015 && Math.abs(half(r + 1) - h) < 0.0015) continue;
    right.push(new THREE.Vector2(h, y));
  }
  right.push(new THREE.Vector2(half(toRow), toY));
  const shape = new THREE.Shape();
  shape.moveTo(-right[0].x, right[0].y);
  for (const pt of right) shape.lineTo(pt.x, pt.y);
  for (let i = right.length - 1; i >= 1; i--) shape.lineTo(-right[i].x, right[i].y);
  return shape;
}

function extrude(shape: THREE.Shape, m: BottleMeta) {
  const g = new THREE.ExtrudeGeometry(shape, {
    depth: m.depth,
    bevelEnabled: true,
    bevelSize: 0.04,
    bevelThickness: 0.05,
    bevelSegments: 3,
    curveSegments: 4,
    steps: 1,
    UVGenerator: photoUV(m.imgW, m.depth),
  });
  g.translate(0, 0, -m.depth / 2);
  // keskin ön yüz kalsın, pah ve yan yüzler yumuşasın
  const smooth = toCreasedNormals(g, Math.PI / 4.5);
  g.dispose();
  return smooth;
}

export interface BottleGeometries {
  cap: THREE.LatheGeometry;
  body: THREE.BufferGeometry;
  bodyTop: THREE.BufferGeometry;
  bodyBottom: THREE.BufferGeometry;
  meta: BottleMeta;
}

export function buildBottleGeometries(p: BottleProfile): BottleGeometries {
  const m = bottleMeta(p);
  const N = p.rows.length;
  const yOf = (r: number) => BOTTLE_H * (1 - (r + 0.5) / N);

  // Kapak: profil satırlarından torna (48 dilim), alttan üste
  const pts: THREE.Vector2[] = [new THREE.Vector2(0, m.neckY)];
  const lastCapRow = m.neckRow - 1;
  pts.push(new THREE.Vector2(p.rows[lastCapRow] * m.imgW * 0.96, m.neckY));
  for (let r = lastCapRow; r >= m.firstRow; r--) pts.push(new THREE.Vector2(Math.max(0.001, p.rows[r] * m.imgW), yOf(r)));
  pts.push(new THREE.Vector2(0, m.topY));
  const cap = new THREE.LatheGeometry(pts, 48);
  // Ön yarıya fotoğraf: u = 0.5 + sinθ·r (görsel genişliğine oranla), v = y / H
  const pos = cap.attributes.position as THREE.BufferAttribute;
  const uv = cap.attributes.uv as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) uv.setXY(i, frontU(pos.getX(i), m.imgW), pos.getY(i) / BOTTLE_H);
  uv.needsUpdate = true;

  const midRow = Math.round(N * (1 - m.midY / BOTTLE_H));
  const body = extrude(bodyShape(p, m, m.neckRow, m.lastRow, m.neckY, m.bottomY), m);
  const bodyTop = extrude(bodyShape(p, m, m.neckRow, midRow, m.neckY, m.midY), m);
  const bodyBottom = extrude(bodyShape(p, m, midRow, m.lastRow, m.midY, m.bottomY), m);
  return { cap, body, bodyTop, bodyBottom, meta: m };
}
