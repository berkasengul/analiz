import { useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { products, getProduct, type ProductId } from '../data/products';
import { useStore, now, prefersReducedMotion, settleInstantly, type SectionId } from '../store';
import { box, scrollY, viewportH, flavorFloat, progress } from '../scroll/scroll';
import { bottles, pedestal, palette, anchors, finderAnchor, floor, detailDrag, pose, lerpPose, POSE_KEYS, NEUTRAL, type Pose } from './rigState';
import { FLOOR_Y } from './Floor';
import { PEDESTAL_H } from './Pedestal';
import { BOTTLE_H } from './bottleGeometry';
import { storyPoses } from '../data/copy';

const DEG = Math.PI / 180;
const HALF = BOTTLE_H / 2;
const RITUAL_IDS: ProductId[] = ['no-tears', 'no-drama', 'no-rules'];
/** Şişenin uçarak geçtiği istasyonlar (sırayla) */
const STATIONS: SectionId[] = ['flavors', 'ritual', 'pyramid', 'finder', 'all', 'shop', 'story'];

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const smooth = (t: number) => { t = clamp01(t); return t * t * (3 - 2 * t); };
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const wrapAngle = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));

function bounceOut(t: number) {
  const n1 = 7.5625, d1 = 2.75;
  if (t < 1 / d1) return n1 * t * t;
  if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
  if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
  return n1 * (t -= 2.625 / d1) * t + 0.984375;
}
/** Koku bulucu: şişe yukarıdan kaideye iner (0.9 sn, hafif zıplama) */
function dropOffset(t: number) {
  if (t < 0) return 6;
  if (t >= 0.9) return 0;
  // zıplamayı yumuşat: ilk vuruştan sonra genliği azalt
  const b = bounceOut(t / 0.9);
  return 6 * (1 - b) * (t / 0.9 < 0.36 ? 1 : 0.45);
}

interface Ped { x: number; y: number; z: number; s: number }
interface Station {
  hero: ProductId | null;
  heroPose: Pose;
  extras: { id: ProductId; pose: Pose }[];
  ped: Ped;
  color: ProductId | null;
  center: [number, number];
  /** zemin yüksekliği */
  floorY?: number;
}

interface Ctx {
  t: number;
  visW: number;
  visH: number;
  mobile: boolean;
  shopPrev: ProductId | null;
  shopChangedAt: number;
}

const hiddenPed = (x = 0): Ped => ({ x, y: FLOOR_Y - 1.2, z: 0, s: 0 });

function flavorsStation(c: Ctx): Station {
  const af = flavorFloat();
  const lift = c.mobile ? 0.95 : 0;
  const baseS = c.mobile ? 0.8 : 1.08;
  const sideX = c.mobile ? (c.visW * (16.5 / 14)) / 2 : 5.2;
  const pedY = FLOOR_Y + lift;
  const top = pedY + PEDESTAL_H * baseS;
  const idle = Math.sin((c.t * 2 * Math.PI) / 10) * 1 * DEG;
  const heroIdx = Math.round(af);
  let heroPose = pose();
  const extras: Station['extras'] = [];
  products.forEach((p, i) => {
    const slot = i - af;
    const a = Math.abs(slot);
    if (a > 2.3) return;
    const sg = Math.sign(slot) || 1;
    const a1 = Math.min(a, 1);
    const x = sg * sideX * (a <= 1 ? Math.sin((a * Math.PI) / 2) : 1 + (a - 1) * 0.9);
    const z = -2.5 * (a <= 1 ? 1 - Math.cos((a * Math.PI) / 2) : 1 + (a - 1) * 0.8);
    const fade = a > 1.4 ? clamp01((2.3 - a) / 0.9) : 1;
    const ps = pose({
      x, z,
      y: top + 0.35 * Math.sin(Math.PI * a1),
      s: baseS * (1 - 0.3 * a1) * fade,
      dim: 1 - 0.55 * a1,
      ry: -slot * 0.22 + idle * (1 - a1),
    });
    if (i === heroIdx) heroPose = ps;
    else extras.push({ id: p.id, pose: ps });
  });
  return {
    hero: products[heroIdx].id,
    heroPose,
    extras,
    ped: { x: 0, y: pedY, z: 0, s: baseS },
    floorY: pedY,
    color: products[heroIdx].id,
    center: [0.5, c.mobile ? 0.6 : 0.56],
  };
}

function ritualStation(c: Ctx): Station {
  const f = progress('ritual') * 3;
  const step = Math.min(2, Math.floor(f));
  const q = clamp01(f - step);
  const W = 0.14;
  let ry = q * 40 * DEG;
  // adım değişirken şişe kendi ekseninde yan döner; değişim yandan görünürken olur
  if (step < 2 && q > 1 - W) ry = THREE.MathUtils.lerp(ry, Math.PI / 2, smooth((q - (1 - W)) / W));
  if (step > 0 && q < W) ry = THREE.MathUtils.lerp(ry, -Math.PI / 2, smooth(1 - q / W));
  const s = c.mobile ? 0.7 : 0.95;
  const cx = c.mobile ? 0 : c.visW * 0.13;
  const cy = c.mobile ? -1.55 : 0.5;
  const rz = (c.mobile ? -12 : -18) * DEG;
  // taban pivotu: eğim tepeyi sağa iter, merkezi hedefte tutmak için tabanı kaydır
  const heroPose = pose({
    x: cx + Math.sin(rz) * HALF * s,
    y: cy - Math.cos(rz) * HALF * s,
    z: 0.5,
    s, rz, ry,
  });
  return {
    hero: RITUAL_IDS[step],
    heroPose,
    extras: [],
    ped: hiddenPed(cx),
    floorY: c.mobile ? FLOOR_Y - 2.4 : FLOOR_Y - 0.5,
    color: RITUAL_IDS[step],
    center: [0.5 + cx / c.visW, c.mobile ? 0.3 : 0.55],
  };
}

export function pyramidExplode(p: number) {
  if (p < 0.06) return 0;
  if (p < 0.32) return smooth((p - 0.06) / 0.26);
  if (p < 0.8) return 1;
  if (p < 0.95) return 1 - smooth((p - 0.8) / 0.15);
  return 0;
}

function pyramidStation(c: Ctx, id: ProductId): Station {
  const p = progress('pyramid');
  const e = pyramidExplode(p);
  const s = (c.mobile ? 0.66 : 0.92) * (1 - 0.16 * e);
  const cy = c.mobile ? 0.1 : 0.42;
  const heroPose = pose({
    x: c.mobile ? 0 : c.visW * 0.02,
    y: cy - HALF * s,
    z: 0,
    s,
    explode: e,
    ry: Math.sin(c.t * 0.5) * 0.1,
  });
  return { hero: id, heroPose, extras: [], ped: hiddenPed(), floorY: FLOOR_Y - (c.mobile ? 1.6 : 1.3), color: id, center: [0.5, 0.55] };
}

function finderStation(c: Ctx, result: ProductId | null): Station {
  const pedX = c.mobile ? 0 : c.visW * 0.24;
  const pedY = c.mobile ? FLOOR_Y - 1.0 : FLOOR_Y;
  const pedS = c.mobile ? 0.62 : 0.9;
  const s = c.mobile ? 0.6 : 0.82;
  const heroPose = pose({ x: pedX, y: pedY + PEDESTAL_H * pedS, z: 0, s, ry: Math.sin(c.t * 0.6) * 0.08 });
  if (!result) heroPose.y = c.visH * 0.5 + 4; // ekranın üstünde bekler
  return {
    hero: result,
    heroPose,
    extras: [],
    ped: { x: pedX, y: pedY, z: 0, s: pedS },
    floorY: pedY,
    color: result,
    center: [0.5 + pedX / c.visW, 0.55],
  };
}

function shopStation(c: Ctx, id: ProductId): Station {
  const s = c.mobile ? 0.56 : 0.95;
  const cx = c.mobile ? 0 : c.visW * 0.21;
  const cy = c.mobile ? 2.2 : 0.5;
  const heroPose = pose({ x: cx, y: cy - HALF * s, z: 0, s, ry: Math.sin(c.t * 0.35) * 0.7 });
  const extras: Station['extras'] = [];
  const since = c.t - c.shopChangedAt;
  if (c.shopPrev && c.shopPrev !== id && since < 1.1) {
    // eskisi yana kayıp çıkar
    const k = easeInOut(clamp01(since / 1.1));
    extras.push({
      id: c.shopPrev,
      pose: pose({ ...heroPose, x: cx + k * c.visW * 0.75, ry: heroPose.ry + k * 1.2, s: s * (1 - 0.3 * k) }),
    });
    // yenisi ters yönden gelir
    heroPose.x = cx - (1 - smooth(since / 0.9)) * c.visW * 0.5;
  }
  return { hero: id, heroPose, extras, ped: hiddenPed(cx), floorY: c.mobile ? FLOOR_Y + 0.4 : FLOOR_Y, color: id, center: [0.5 + cx / c.visW, c.mobile ? 0.72 : 0.55] };
}

function storyStation(c: Ctx, id: ProductId): Station {
  const st = shopStation(c, id);
  st.heroPose.y = c.visH * 0.5 + 5;
  st.extras = [];
  st.color = null;
  return st;
}

/** Kart görseli: kokunun renginde sisli stüdyo, kaidede tek şişe */
function cardStation(id: ProductId): Station {
  const top = FLOOR_Y + PEDESTAL_H;
  return {
    hero: id,
    heroPose: pose({ y: top }),
    extras: [],
    ped: { x: 0, y: FLOOR_Y, z: 0, s: 1 },
    floorY: FLOOR_Y - 3,
    color: id,
    center: [0.5, 0.58],
  };
}

/** Ürün detayı: şişe sahnenin ortasında büyür; hikâyeye göre poz, sürükleyerek döner */
function detailStation(c: Ctx, id: ProductId, story: number | null): Station {
  const sp = story != null ? storyPoses[story] : { ry: 0, y: 0, s: 1 };
  const s = (c.mobile ? 0.52 : 1.1) * sp.s;
  const cx = c.mobile ? 0 : c.visW * 0.05;
  const cy = (c.mobile ? 2.05 : 0.62) + sp.y * 0.5;
  const ry = sp.ry + detailDrag.ry + (story == null ? Math.sin(c.t * 0.35) * 0.12 : 0);
  return {
    hero: id,
    heroPose: pose({ x: cx, y: cy - HALF * s, z: 0, s, ry }),
    extras: [],
    ped: hiddenPed(cx),
    floorY: FLOOR_Y - 1.4,
    color: id,
    center: [0.5 + cx / c.visW, c.mobile ? 0.78 : 0.56],
  };
}

function stationState(id: SectionId, c: Ctx): Station {
  const s = useStore.getState();
  switch (id) {
    case 'flavors': return flavorsStation(c);
    case 'ritual': return ritualStation(c);
    case 'pyramid': return pyramidStation(c, s.pyramidId);
    case 'finder': return finderStation(c, s.finderResult);
    case 'all':
    case 'shop': return shopStation(c, s.shopId);
    default: return storyStation(c, s.shopId);
  }
}

function hold(id: SectionId): [number, number] {
  const b = box(id);
  return [b.top, b.top + Math.max(0, b.height - viewportH())];
}

const _colA = new THREE.Color();
const _colB = new THREE.Color();
const _m = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const _e = new THREE.Euler();
const _p = new THREE.Vector3();
const _s = new THREE.Vector3();
const _v = new THREE.Vector3();

function setPaletteFrom(id: ProductId | null, out: { color: THREE.Color; tint: THREE.Color; dark: THREE.Color }) {
  const src = id ? getProduct(id) : NEUTRAL;
  out.color.set(src.color);
  out.tint.set(src.tint);
  out.dark.set(src.dark);
}
const palA = { color: new THREE.Color(), tint: new THREE.Color(), dark: new THREE.Color() };
const palB = { color: new THREE.Color(), tint: new THREE.Color(), dark: new THREE.Color() };

function poseMatrix(p: Pose, dropY = 0) {
  _p.set(p.x, p.y + dropY, p.z);
  _e.set(p.rx, p.ry, p.rz, 'ZYX');
  _q.setFromEuler(_e);
  _s.setScalar(p.s);
  return _m.compose(_p, _q, _s);
}

/**
 * Şişelerin bölüme göre poz koreografisi.
 * Her bölüm (istasyon) bir "tutma" aralığında kendi pozunu üretir; iki istasyon arasındaki
 * geçişte pozlar ease-in-out ile karıştırılır ve şişe bir öncekinin son pozundan sonrakinin
 * ilk pozuna uçar. Ürün değişiyorsa değişim, şişe yandan görünürken (90°) yapılır.
 * Gerçek şişeler hedef poza üstel yaklaşımla gider (k = 6/sn).
 */
export function BottleRig({ mobile, cardId }: { mobile: boolean; cardId?: ProductId }) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const size = useThree((s) => s.size);
  const shop = useRef<{ id: ProductId; prev: ProductId | null; at: number }>({ id: useStore.getState().shopId, prev: null, at: -10 });
  const targets = useRef(new Map<ProductId, Pose>());
  const scratch = useRef(pose());

  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 0.1);
    const t = now();
    const st = useStore.getState();
    if (st.shopId !== shop.current.id) {
      shop.current = { id: st.shopId, prev: shop.current.id, at: t };
    }
    const dist = camera.position.distanceTo(_v.set(0, 0.6, 0));
    const visH = 2 * dist * Math.tan((camera.fov * DEG) / 2);
    const visW = visH * (size.width / Math.max(1, size.height));
    const ctx: Ctx = { t, visW, visH, mobile, shopPrev: shop.current.prev, shopChangedAt: shop.current.at };

    // --- hangi istasyon / geçiş? ---
    const y = scrollY();
    let a = 0;
    let b = 0;
    let mix = 0;
    for (let i = 0; i < STATIONS.length; i++) {
      const [h0, h1] = hold(STATIONS[i]);
      if (y < h0) {
        if (i === 0) { a = b = 0; mix = 0; break; }
        const prevEnd = hold(STATIONS[i - 1])[1];
        a = i - 1; b = i;
        mix = easeInOut(clamp01((y - prevEnd) / Math.max(1, h0 - prevEnd)));
        break;
      }
      if (y <= h1 || i === STATIONS.length - 1) { a = b = i; mix = 0; break; }
    }
    if (cardId) { a = b = 0; mix = 0; }
    // detay açıkken tüm bölümlerin yerine geçer
    if (st.detailId) { a = b = 0; mix = 0; }
    // sürükleme ataleti
    if (!detailDrag.dragging) {
      detailDrag.ry += detailDrag.vel * dt;
      detailDrag.vel *= Math.exp(-3.2 * dt);
      if (!st.detailId) { detailDrag.ry *= Math.exp(-4 * dt); detailDrag.vel = 0; }
    }
    const A = cardId ? cardStation(cardId) : st.detailId ? detailStation(ctx, st.detailId, st.detailStory) : stationState(STATIONS[a], ctx);
    const B = a === b ? A : stationState(STATIONS[b], ctx);

    // --- kahraman şişe: karıştır + gerekiyorsa yan dönüşte değiştir ---
    const tg = targets.current;
    tg.clear();
    const heroPose = lerpPose(A.heroPose, B.heroPose, mix, scratch.current);
    heroPose.ry = A.heroPose.ry + wrapAngle(B.heroPose.ry - A.heroPose.ry) * mix;
    let hero: ProductId | null = mix < 0.5 ? A.hero : B.hero;
    if (!A.hero) hero = B.hero;
    if (!B.hero) hero = A.hero;
    if (A.hero && B.hero && A.hero !== B.hero) {
      heroPose.ry += mix < 0.5 ? (Math.PI / 2) * (mix / 0.5) : -(Math.PI / 2) * (1 - (mix - 0.5) / 0.5);
    }
    if (hero) tg.set(hero, { ...heroPose });
    for (const ex of A.extras) if (!tg.has(ex.id) && mix < 0.999) tg.set(ex.id, { ...ex.pose, s: ex.pose.s * (1 - mix) });
    if (b !== a) for (const ex of B.extras) if (!tg.has(ex.id) && mix > 0.001) tg.set(ex.id, { ...ex.pose, s: ex.pose.s * mix });

    // --- uygula: üstel yaklaşım ---
    const reduced = prefersReducedMotion() || settleInstantly();
    const k = reduced ? 1 : 1 - Math.exp(-6 * dt);
    for (const p of products) {
      const rt = bottles[p.id];
      const target = tg.get(p.id);
      if (!target || target.s < 0.004) { rt.visible = false; rt.dropY = 0; continue; }
      if (!rt.visible || cardId) {
        Object.assign(rt.current, target);
        rt.visible = true;
      } else {
        for (const key of POSE_KEYS) {
          if (key === 'ry') rt.current.ry += wrapAngle(target.ry - rt.current.ry) * k;
          else rt.current[key] += (target[key] - rt.current[key]) * k;
        }
      }
      // keşfet akışı: şişeler arasındaki kayma kaydırmaya zaten bağlı; gecikmeyi azalt
      rt.dropY = 0;
    }

    // koku bulucu: iniş
    const finderIdx = STATIONS.indexOf('finder');
    const wFinder = (a === finderIdx ? 1 - mix : 0) + (b === finderIdx && b !== a ? mix : 0);
    if (st.finderResult && wFinder > 0) {
      bottles[st.finderResult].dropY = dropOffset(t - st.finderAt) * wFinder;
    }

    // --- kaide ---
    const pk = reduced ? 1 : 1 - Math.exp(-7 * dt);
    const ped = {
      x: A.ped.x + (B.ped.x - A.ped.x) * mix,
      y: A.ped.y + (B.ped.y - A.ped.y) * mix,
      z: A.ped.z + (B.ped.z - A.ped.z) * mix,
      s: A.ped.s + (B.ped.s - A.ped.s) * mix,
    };
    if (cardId) Object.assign(pedestal, ped);

    // --- zemin ve ufuk bandı ---
    const fA = A.floorY ?? FLOOR_Y;
    const fB = B.floorY ?? FLOOR_Y;
    const fy = fA + (fB - fA) * mix;
    floor.y = cardId ? fy : floor.y + (fy - floor.y) * pk;
    // ufuk: zeminin solduğu uzak kenarın ekrandaki yüksekliği
    _v.set(0, floor.y, -9).project(camera);
    floor.horizon = Math.min(0.7, Math.max(0.12, (_v.y + 1) / 2));
    pedestal.x += (ped.x - pedestal.x) * pk;
    pedestal.y += (ped.y - pedestal.y) * pk;
    pedestal.z += (ped.z - pedestal.z) * pk;
    pedestal.s += (ped.s - pedestal.s) * pk;
    pedestal.visible = pedestal.s > 0.04;

    // --- palet ve hale merkezi ---
    setPaletteFrom(A.color, palA);
    setPaletteFrom(B.color, palB);
    palette.target.color.copy(_colA.copy(palA.color)).lerp(_colB.copy(palB.color), mix);
    palette.target.tint.copy(palA.tint).lerp(palB.tint, mix);
    palette.target.dark.copy(palA.dark).lerp(palB.dark, mix);
    palette.centerTarget.set(
      A.center[0] + (B.center[0] - A.center[0]) * mix,
      A.center[1] + (B.center[1] - A.center[1]) * mix,
    );

    // --- piramit etiket çapaları (ekran px) ---
    const pid = st.pyramidId;
    const prt = bottles[pid];
    if (prt.visible && prt.meta) {
      const m = prt.meta;
      const c = prt.current;
      const gap = 1.1 * c.explode;
      const M = poseMatrix(c, prt.dropY);
      const proj = (lx: number, ly: number, out: { x: number; y: number }) => {
        _v.set(lx, ly, 0).applyMatrix4(M).project(camera);
        out.x = ((_v.x + 1) / 2) * size.width;
        out.y = ((1 - _v.y) / 2) * size.height;
      };
      proj(0, (m.neckY + m.topY) / 2 + gap, anchors.cap);
      proj(0, (m.neckY + m.midY) / 2, anchors.top);
      proj(0, (m.midY + m.bottomY) / 2 - gap, anchors.bottom);
      const tmp = { x: 0, y: 0 };
      proj(m.bodyHalf, (m.neckY + m.midY) / 2, tmp);
      anchors.halfPx = Math.abs(tmp.x - anchors.top.x);
      anchors.explode = c.explode;
    }

    // koku bulucu kaidesinin ekran konumu
    _v.set(pedestal.x, pedestal.y + PEDESTAL_H * pedestal.s, pedestal.z).project(camera);
    finderAnchor.x = ((_v.x + 1) / 2) * size.width;
    finderAnchor.y = ((1 - _v.y) / 2) * size.height;
  });

  return null;
}
