import * as THREE from 'three';
import { products, type ProductId } from '../data/products';
import type { BottleMeta } from './bottleGeometry';

/** Şişe pozu (kök: şişenin taban merkezi) */
export interface Pose {
  x: number; y: number; z: number;
  rx: number; ry: number; rz: number;
  s: number;
  /** renk çarpanı (komşu şişeler 0.75) */
  dim: number;
  /** piramit: katmanlara ayrılma 0..1 */
  explode: number;
}

export const pose = (p: Partial<Pose> = {}): Pose => ({ x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0, s: 1, dim: 1, explode: 0, ...p });

export const POSE_KEYS: (keyof Pose)[] = ['x', 'y', 'z', 'rx', 'ry', 'rz', 's', 'dim', 'explode'];

export function lerpPose(a: Pose, b: Pose, t: number, out: Pose = pose()): Pose {
  for (const k of POSE_KEYS) out[k] = a[k] + (b[k] - a[k]) * t;
  return out;
}

export interface BottleRuntime {
  /** rig'in uyguladığı güncel poz */
  current: Pose;
  visible: boolean;
  /** inişte (koku bulucu) eklenen anlık dikey ofset */
  dropY: number;
  group: THREE.Group | null;
  meta: BottleMeta | null;
}

export const bottles = Object.fromEntries(
  products.map((p) => [p.id, { current: pose(), visible: false, dropY: 0, group: null, meta: null } as BottleRuntime]),
) as Record<ProductId, BottleRuntime>;

/** Zemin yüksekliği (istasyona göre; şişe zeminin altına girmesin) ve ekrandaki ufuk (uv.y) */
export const floor = { y: -1.15, horizon: 0.4 };

export interface PedestalRuntime { x: number; y: number; z: number; s: number; visible: boolean }
export const pedestal: PedestalRuntime = { x: 0, y: 0, z: 0, s: 1, visible: true };

/** Sahne paleti hedefi; Backdrop/Pedestal/Floor üstel yaklaşımla izler */
export const palette = {
  target: { color: new THREE.Color('#2a9a88'), tint: new THREE.Color('#bff0e6'), dark: new THREE.Color('#06201c') },
  current: { color: new THREE.Color('#2a9a88'), tint: new THREE.Color('#bff0e6'), dark: new THREE.Color('#06201c') },
  /** arka plandaki halenin merkezi (ekran uv), aktif şişenin arkasında */
  centerTarget: new THREE.Vector2(0.5, 0.56),
  center: new THREE.Vector2(0.5, 0.56),
};

/** Ürün seçilmemişken (koku bulucu, alt bölümler) nötr stüdyo */
export const NEUTRAL = { color: '#4a4650', tint: '#ece4dc', dark: '#0b0b0d' };

export { anchors, finderAnchor, detailDrag } from './anchors';
