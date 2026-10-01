import { useLayoutEffect, useMemo, useRef } from "react";
import { useTexture } from "@react-three/drei";
import {
  Box3,
  BoxGeometry,
  Matrix4,
  BufferGeometry,
  Float32BufferAttribute,
  ExtrudeGeometry,
  Shape,
  CanvasTexture,
  Color,
  CylinderGeometry,
  LatheGeometry,
  MathUtils,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  Plane,
  Vector4,
  DoubleSide,
  RepeatWrapping,
  SRGBColorSpace,
  Quaternion,
  SphereGeometry,
  TorusGeometry,
  Vector2,
  Vector3,
} from "three";
import { RoundedBoxGeometry, mergeVertices } from "three-stdlib";
import { useFrame } from "@react-three/fiber";

import { content, flavors } from "./data";
import { SPRAY, SPRAY_SLOW, sceneState } from "./shared";

const MOBILE_GL = typeof window !== "undefined" && window.matchMedia("(max-width: 820px)").matches;

// Etiket dokuları: content.json'daki her ürünün `file` adıyla eşleşir.
const FILES = import.meta.glob("./assets/labels/*.{jpg,webp}", { eager: true, import: "default" });
const LABELS = flavors.map((f) => FILES[`./assets/labels/${f.file}`]);

// Ürün ambalajı content.json → bottle ölçüleriyle koddan üretilir. Her ürün
// `form` ("tube" krem tüpü, boş = şişe) ve kendi `bottle` / `tube` ayarlarıyla
// markanın genel ölçülerini ezebilir (renk, boy, kapak).
const B = content.bottle;
const GY = -0.4; // şişe camının merkezi

const merge = (a = {}, b = {}) => {
  const out = { ...a };
  for (const [k, v] of Object.entries(b)) out[k] = v && typeof v === "object" && !Array.isArray(v) ? { ...a[k], ...v } : v;
  return out;
};

// Biçimler: "tube" krem tüpü; "tool" ahşap/lif bakım aleti (etiket askılı kartta);
// geri kalanı kutu gövdeli ambalaj: şişe (pompa, sprey, damlalık, roll-on
// kapakları), sabun kalıbı, hediye kutusu, katlanmış sweatshirt.
export const shapeOf = (f) =>
  f.form === "photo"
    ? { kind: "photo", size: 3.3, profile: "round", depth: 0.85, tilt: -0.03, scale: 1, ...f.photo3d, file: f.file }
    : f.form === "tube" && B.tube
    ? { kind: "tube", ...merge(B.tube, f.tube) }
    : { kind: f.form === "tool" ? "tool" : "bottle", ...merge(B, f.bottle) };

// Etiket atlası: ön etiket dokunun sol yarısı, arka etiket sağ yarısı.
function labelGeo(w, h, u0) {
  const g = new PlaneGeometry(w, h);
  const uv = g.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setX(i, u0 + uv.getX(i) * 0.5);
  return g;
}

// Etiket şişenin gövdesine sarılır: yuvarlak köşeli kutunun kesitinde yay
// uzunluğuna göre ilerler (köşeleri döner), üst/alt kenar yuvarlaklığına da
// uyar. Böylece etiket havada duran düz bir yama gibi değil, basılı gibi durur.
function wrapLabelGeo(S, lw, lh, u0, yc) {
  const { width: W, height: H, depth: D, corner } = S.glass;
  if (S.glass.shape === "cylinder") {
    // Yuvarlak şişe: etiket çevre boyunca açıyla sarılır (baskılı cam gibi).
    const R = W / 2 + 0.006;
    const g = new PlaneGeometry(lw, lh, 96, 4);
    const pos = g.attributes.position;
    const uv = g.attributes.uv;
    for (let i = 0; i < pos.count; i++) {
      const a = pos.getX(i) / R;
      pos.setXYZ(i, R * Math.sin(a), pos.getY(i), R * Math.cos(a));
      uv.setX(i, u0 + uv.getX(i) * 0.5);
    }
    g.computeVertexNormals();
    return g;
  }
  const r = Math.min(corner, W / 2, D / 2, H / 2);
  const a = W / 2 - r;
  const b = H / 2 - r;
  const c = D / 2 - r;
  const g = new PlaneGeometry(lw, lh, 64, 24);
  const pos = g.attributes.position;
  const uv = g.attributes.uv;
  const arc = (Math.PI / 2) * r;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i) + yc;
    const sgn = Math.sign(x) || 1;
    const t = Math.abs(x);
    // Kesit üzerinde: ön düz yüz → köşe yayı → yan yüz.
    let X, Z;
    if (t <= a) [X, Z] = [t, D / 2];
    else if (t <= a + arc) {
      const th = (t - a) / Math.max(r, 1e-4);
      [X, Z] = [a + r * Math.sin(th), c + r * Math.cos(th)];
    } else [X, Z] = [W / 2, c - (t - a - arc)];
    // Üst/alt kenar yuvarlaklığı: o yükseklikte kesit daha küçük yarıçaplıdır.
    const iy = Math.max(0, Math.abs(y) - b);
    const k = r > 0 ? Math.sqrt(Math.max(0, r * r - Math.min(iy, r * 0.97) ** 2)) / r : 1;
    const ix = Math.min(X, a);
    const iz = Math.min(Z, c);
    let nx = X - ix;
    let nz = Z - iz;
    X = ix + nx * k;
    Z = iz + nz * k;
    let ny = Math.abs(y) > b ? (Math.abs(y) - b) * Math.sign(y) : 0;
    const len = Math.hypot(nx * k, ny, nz * k) || 1;
    const off = 0.006;
    pos.setXYZ(i, sgn * (X + ((nx * k) / len) * off), pos.getY(i), Z + ((nz * k) / len) * off);
    uv.setX(i, u0 + uv.getX(i) * 0.5);
  }
  g.computeVertexNormals();
  return g;
}

// Krem tüpü: kapağın üstünde duran, üst ucu yassı kıvrılmış tüp. Doku tüpü
// sarar: u 0–0.5 ön yüz, 0.5–1 arka yüz (etiket atlasıyla aynı düzen).
function tubeBody(T) {
  const g = new CylinderGeometry(T.radius, T.radius, T.height, 72, 28, true, -Math.PI / 2, Math.PI * 2);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const k = MathUtils.smootherstep((p.getY(i) + T.height / 2) / T.height, 0.42, 1);
    p.setX(i, p.getX(i) * (1 + 0.34 * k));
    p.setZ(i, p.getZ(i) * (1 - 0.94 * k));
  }
  g.computeVertexNormals();
  return g;
}

// Kapak biçimleri: parçalar kapağın tabanına (y = 0) göre dizilir.
function capGeometry(c) {
  const r = c.radius;
  switch (c.shape) {
    case "pump":
      return { capA: new CylinderGeometry(r, r, 0.34, 48), capB: new CylinderGeometry(0.08, 0.08, 0.4, 16), capC: new RoundedBoxGeometry(0.62, 0.22, 0.42, 3, 0.08), capD: new CylinderGeometry(0.055, 0.055, 0.5, 12) };
    case "spray":
      return { capA: new CylinderGeometry(r, r, 0.3, 48), capB: new CylinderGeometry(r * 0.72, r * 0.72, 0.42, 48), capD: new CylinderGeometry(0.05, 0.05, 0.06, 12) };
    case "dropper": {
      // Damlalık: parlak boğaz halkası ve üstte hafif daralan, yuvarlak uçlu lastik.
      const ch = c.collar ?? 0.38;
      const br = c.bulbRadius ?? r * 0.6;
      const bh = c.bulbHeight ?? c.height * 0.8;
      const pts = [[0.001, 0], [br, 0]];
      for (let i = 0; i <= 10; i++) pts.push([br * (1 - 0.14 * (i / 10)), (bh - br * 0.86) * (i / 10)]);
      for (let i = 1; i <= 10; i++) {
        const a = (i / 10) * (Math.PI / 2);
        pts.push([Math.max(0.001, br * 0.86 * Math.cos(a)), bh - br * 0.86 + br * 0.86 * Math.sin(a)]);
      }
      return { capA: new CylinderGeometry(r, r, ch, 64), capB: lathe(pts, 48), collarH: ch };
    }
    case "ball":
      return { capA: new CylinderGeometry(r, r, c.height, 64), capB: new SphereGeometry(r, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2) };
    default:
      return {};
  }
}

// Ahşap damarı ve kabak lifi dokuları koddan çizilir (dosya indirilmez).
const TEX = {};
function procTexture(kind) {
  if (TEX[kind]) return TEX[kind];
  const c = document.createElement("canvas");
  c.width = c.height = 512;
  const x = c.getContext("2d");
  let seed = kind.length * 97;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  if (kind === "wood") {
    x.fillStyle = "#b98d5c";
    x.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 90; i++) {
      x.strokeStyle = `rgba(${90 + rnd() * 40},${55 + rnd() * 25},${30 + rnd() * 15},${0.12 + rnd() * 0.25})`;
      x.lineWidth = 1 + rnd() * 4;
      x.beginPath();
      const y0 = rnd() * 512;
      x.moveTo(0, y0);
      for (let s = 0; s <= 512; s += 32) x.lineTo(s, y0 + Math.sin(s / 60 + i) * 6 + (rnd() - 0.5) * 4);
      x.stroke();
    }
  } else if (kind === "fiber") {
    x.fillStyle = "#cdb47e";
    x.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 2600; i++) {
      x.strokeStyle = `rgba(${150 + rnd() * 90},${120 + rnd() * 70},${60 + rnd() * 40},0.55)`;
      x.lineWidth = 0.6 + rnd() * 1.2;
      const px = rnd() * 512;
      x.beginPath();
      x.moveTo(px, 0);
      x.lineTo(px + (rnd() - 0.5) * 30, 512);
      x.stroke();
    }
  } else {
    // Kabak lifi: iç içe geçmiş, kıvrımlı lifler.
    x.fillStyle = "#6e5a36";
    x.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 700; i++) {
      x.strokeStyle = `rgba(${210 + rnd() * 40},${190 + rnd() * 40},${140 + rnd() * 40},${0.5 + rnd() * 0.5})`;
      x.lineWidth = 1.5 + rnd() * 3;
      x.beginPath();
      let px = rnd() * 512;
      let py = rnd() * 512;
      x.moveTo(px, py);
      for (let k = 0; k < 4; k++) {
        const nx = px + (rnd() - 0.5) * 120;
        const ny = py + (rnd() - 0.5) * 120;
        x.quadraticCurveTo(px + (rnd() - 0.5) * 80, py + (rnd() - 0.5) * 80, nx, ny);
        px = nx;
        py = ny;
      }
      x.stroke();
    }
  }
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  t.wrapS = t.wrapT = RepeatWrapping;
  TEX[kind] = t;
  return t;
}

// Askıda duran sweatshirt: önden silüet, yumuşak kenarlı kalın kumaş.
function garmentGeometry(W, H) {
  const w = W / 2;
  const sh = new Shape();
  const top = H / 2;
  const bot = -H / 2;
  sh.moveTo(-0.42, top);
  sh.quadraticCurveTo(0, top - 0.32, 0.42, top); // yaka oyuğu
  sh.lineTo(w * 0.62, top - 0.05);
  sh.quadraticCurveTo(w * 0.95, top - 0.15, w * 1.08, top - 0.55); // omuz
  sh.lineTo(w * 1.42, bot + 0.35); // kol
  sh.lineTo(w * 1.12, bot + 0.18);
  sh.lineTo(w * 0.86, top - 1.05); // koltuk altı
  sh.lineTo(w * 0.84, bot);
  sh.lineTo(-w * 0.84, bot);
  sh.lineTo(-w * 0.86, top - 1.05);
  sh.lineTo(-w * 1.12, bot + 0.18);
  sh.lineTo(-w * 1.42, bot + 0.35);
  sh.lineTo(-w * 1.08, top - 0.55);
  sh.quadraticCurveTo(-w * 0.95, top - 0.15, -w * 0.62, top - 0.05);
  sh.lineTo(-0.42, top);
  const body = new ExtrudeGeometry(sh, { depth: 0.22, bevelEnabled: true, bevelThickness: 0.12, bevelSize: 0.1, bevelSegments: 6, curveSegments: 24 });
  body.translate(0, 0, -0.11);
  return {
    garmentBody: body,
    collar: new TorusGeometry(0.44, 0.07, 12, 40, Math.PI),
    hem: new RoundedBoxGeometry(w * 1.68, 0.26, 0.5, 2, 0.08),
  };
}

// Yuvarlak şişe gövdesi: düz yan, yumuşak omuz ve taban kenarı.
function cylinderBody(R, H, rs, rb, neck) {
  const pts = [[0.001, -H / 2]];
  for (let i = 0; i <= 8; i++) {
    const a = -Math.PI / 2 + (i / 8) * (Math.PI / 2);
    pts.push([R - rb + rb * Math.cos(a), -H / 2 + rb + rb * Math.sin(a)]);
  }
  for (let i = 0; i <= 8; i++) {
    const a = (i / 8) * (Math.PI / 2);
    pts.push([R - rs + rs * Math.cos(a), H / 2 - rs + rs * Math.sin(a)]);
  }
  pts.push([neck, H / 2], [0.001, H / 2]);
  return lathe(pts, 96);
}

function lathe(points, segments = 64) {
  return new LatheGeometry(points.map(([r, y]) => new Vector2(r, y)), segments);
}

// Aletler: gövde + askılı etiket kartı (ön ve arka yüzü etiket atlasından).
function toolGeometry(S) {
  const T = S.tool;
  const tag = { front: labelGeo(S.label.width, S.label.height, 0), back: labelGeo(S.label.width, S.label.height, 0.5), card: new BoxGeometry(S.label.width + 0.02, S.label.height + 0.02, 0.02), string: new CylinderGeometry(0.012, 0.012, 1, 6) };
  if (T === "lymph") {
    // Ergonomik masaj aleti: tutma sapı ve dalgalı, yuvarlak baş.
    const pts = [[0.001, -1.9]];
    for (let i = 0; i <= 40; i++) {
      const y = -1.9 + (i / 40) * 2.2;
      pts.push([0.2 + 0.07 * Math.sin((i / 40) * Math.PI), y]);
    }
    for (let i = 0; i <= 40; i++) {
      const a = -Math.PI / 2 + (i / 40) * Math.PI;
      const rr = 0.78 * Math.cos(a) * (1 - 0.1 * Math.pow(Math.sin(a * 0.5 + 0.8), 8));
      pts.push([Math.max(0.001, rr), 1.0 + 0.78 * Math.sin(a)]);
    }
    return { ...tag, main: lathe(pts) };
  }
  if (T === "brush") {
    return {
      ...tag,
      main: new CylinderGeometry(1, 1, 0.42, 64),
      fiber: new CylinderGeometry(0.93, 0.8, 0.62, 64),
      strap: new RoundedBoxGeometry(1.95, 0.75, 0.14, 2, 0.05),
    };
  }
  // Kabak lifi: uzun, hafif kavisli doğal lif.
  const pts = [];
  for (let i = 0; i <= 48; i++) {
    const t = i / 48;
    pts.push([Math.max(0.001, 0.62 * Math.pow(Math.sin(Math.PI * t), 0.55) * (1 + 0.05 * Math.sin(t * 25))), -1.9 + t * 3.8]);
  }
  return { ...tag, main: lathe(pts, 48) };
}

// Fotoğraftan 3B. Doku atlası: sol yarı ürünün kesilmiş ön fotoğrafı, sağ yarı arka yüzü
// (aynalı hizada). Fotoğraf kare tuvale oturtulmuştur; x, y ∈ [0, 1] tuval koordinatı.
//  - "round": silüetin her satırındaki simetrik yarıçaptan dönen gövde (şişe, tüp, kavanoz);
//    ön yarıya ön fotoğraf, arka yarıya arka yüz önden izdüşümle giydirilir. Eksene simetrik
//    olmayan parçalar (pompa ağzı) gövdenin arkasındaki ince bir kartta kalır.
//  - "flat": silüetin kenar çizgisinden pahlı blok (kutu, set, sabun, fırça, tekstil).
const PHOTO = new Map();
const smoothRows = (rows) => rows.map((r, i) => (r === 0 ? 0 : (rows[i - 1] ?? r) * 0.25 + r * 0.5 + (rows[i + 1] ?? r) * 0.25));

function latheHalf(S, back) {
  const L = S.size;
  // Performans: satırlar yarıya indirilir (yumuşatılmış profil görüntüyü bozmaz);
  // setlerde parça başına daha az dilim.
  const full = smoothRows(S.rows);
  const rows = full.filter((_, i) => i % 2 === 0).map((r, i) => Math.max(r, full[2 * i + 1] ?? 0) * (r && full[2 * i + 1] ? 1 : r ? 1 : 0));
  const N = rows.length;
  const seg = S.lite ? 28 : 40;
  const zs = S.zScale ?? 1;
  const pos = [];
  const uv = [];
  const idx = [];
  // Üst ve alt uçları kapatmak için ilk/son satırın dışına yarıçapı 0 olan satır.
  const R = [0, ...rows, 0];
  const Y = [0, ...rows.map((_, i) => (i + 0.5) / N), 1];
  // Tepe ve dip noktası silüetin tam kenarına düşer: oradaki yarı saydam, koyu kenar pikselleri
  // kapağın tepesinde leke gibi görünür. Doku o bölgede biraz içeriden alınır.
  const lit = R.map((r, j) => (r > 0 ? j : -1)).filter((j) => j >= 0);
  const yTop = lit.length ? Y[lit[0]] + 0.014 : 0;
  const yBot = lit.length ? Y[lit[lit.length - 1]] - 0.014 : 1;
  for (let j = 0; j < R.length; j++) {
    const r = R[j];
    const y = Y[j];
    const yv = Math.min(Math.max(y, yTop), Math.max(yTop, yBot));
    for (let k = 0; k <= seg; k++) {
      const t = -Math.PI / 2 + (k / seg) * Math.PI; // ön yarı: -90°..90°
      const sx = Math.sin(t) * r;
      const cz = Math.cos(t) * r;
      const xw = back ? -sx : sx;
      pos.push((S.axis + xw - 0.5) * L, (0.5 - y) * L, (back ? -cz : cz) * L * zs);
      // Silüet kenarında şeffaf piksele düşmemek için izdüşüm biraz içeriden alınır.
      const xn = S.axis + xw * 0.97;
      uv.push(back ? 0.5 + 0.5 * (1 - xn) : 0.5 * xn, 1 - yv);
    }
  }
  const W = seg + 1;
  for (let j = 0; j < R.length - 1; j++)
    for (let k = 0; k < seg; k++) {
      const a = j * W + k;
      const b = a + 1;
      const c = a + W;
      const d = c + 1;
      // Önden bakan için de arkadan bakan için de k soldan sağa ilerler: aynı sarım.
      idx.push(a, c, b, b, c, d);
    }
  const g = new BufferGeometry();
  g.setAttribute("position", new Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

// Fotoğraf kartı yalnızca ürünün sınır kutusu kadar (tüm kareyi kaplamaz: daha az çizim).
function finPlane(S, back) {
  const pts = (S.parts ?? [S]).flatMap((p) => p.outline ?? []).flat();
  let [x0, y0, x1, y1] = [0, 0, 1, 1];
  if (pts.length) {
    x0 = Math.max(0, Math.min(...pts.map((p) => p[0])) - 0.01);
    x1 = Math.min(1, Math.max(...pts.map((p) => p[0])) + 0.01);
    y0 = Math.max(0, Math.min(...pts.map((p) => p[1])) - 0.01);
    y1 = Math.min(1, Math.max(...pts.map((p) => p[1])) + 0.01);
  }
  const L = S.size;
  const g = new PlaneGeometry((x1 - x0) * L, (y1 - y0) * L);
  g.translate(((x0 + x1) / 2 - 0.5) * L * (back ? -1 : 1), (0.5 - (y0 + y1) / 2) * L, 0);
  const uv = g.attributes.uv;
  for (let i = 0; i < uv.count; i++) {
    const u = x0 + uv.getX(i) * (x1 - x0);
    uv.setXY(i, back ? 0.5 + 0.5 * (1 - (x1 - uv.getX(i) * (x1 - x0))) : 0.5 * u, 1 - (y1 - uv.getY(i) * (y1 - y0)));
  }
  return g;
}

function flatBlock(S) {
  const L = S.size;
  // Fotoğraf kenarındaki küçük girinti çıkıntılar yumuşatılır (yanlarda basamak görünmesin).
  const soften = (pts) => {
    let p = pts;
    for (let pass = 0; pass < 3; pass++)
      p = p.map((q, i) => {
        const a = p[(i - 1 + p.length) % p.length];
        const b = p[(i + 1) % p.length];
        return [(a[0] + 2 * q[0] + b[0]) / 4, (a[1] + 2 * q[1] + b[1]) / 4];
      });
    return p;
  };
  const shapes = S.outline.map(soften).map((pts) => {
    const sh = new Shape();
    pts.forEach(([x, y], i) => (i ? sh.lineTo((x - 0.5) * L, (0.5 - y) * L) : sh.moveTo((x - 0.5) * L, (0.5 - y) * L)));
    return sh;
  });
  const bevel = Math.min(0.05, S.depth * 0.3);
  const g = new ExtrudeGeometry(shapes, { depth: Math.max(0.01, S.depth - 2 * bevel), bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel * 0.6, bevelSegments: 3, curveSegments: 4 });
  g.translate(0, 0, -(S.depth - 2 * bevel) / 2);
  // Ön/arka yüz dokusu: tuval koordinatından atlas yarısına izdüşüm.
  const pos = g.attributes.position;
  const uv = g.attributes.uv;
  for (let i = 0; i < pos.count; i++) {
    const xn = pos.getX(i) / L + 0.5;
    const yn = 0.5 - pos.getY(i) / L;
    const front = pos.getZ(i) >= 0;
    uv.setXY(i, front ? 0.5 * xn : 0.5 + 0.5 * (1 - xn), 1 - yn);
  }
  // Kenar parçaları arasında yumuşak geçiş (basamaklı çizgiler görünmesin).
  g.deleteAttribute("normal");
  const m = mergeVertices(g, 1e-4);
  m.computeVertexNormals();
  return m;
}

// Şeffaf camlı şişe: kalınlık yüzlerinde parfüm görünür. Köşe renkleri (malzeme rengi sıvının rengi):
// omuzun hemen altındaki sıvı yüzeyinde parlak bir çizgi (menisküs), üstünde soluk cam (hava payı),
// altta derinleşen sıvı.
function liquidColors(g, S, top, bottom) {
  const N = S.rows.length;
  const L = S.size;
  const level = (top + 0.07 * (bottom - top)) / N;
  const base = (bottom + 0.5) / N;
  const liq = new Color(S.liquid ?? S.edge);
  const glass = new Color("#efe9dc");
  const air = [glass.r / Math.max(liq.r, 0.05), glass.g / Math.max(liq.g, 0.05), glass.b / Math.max(liq.b, 0.05)].map((v) => Math.min(v, 3.2) * 0.8);
  const pos = g.attributes.position;
  const col = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) {
    const yn = 0.5 - pos.getY(i) / L;
    const t = Math.min(1, Math.max(0, (yn - level) / Math.max(base - level, 0.01)));
    const deep = 1.08 - 0.3 * t; // aşağıda koyulaşan sıvı
    const z = ((yn - level) * N) / 1.6;
    const men = Math.exp(-z * z) * 0.55; // sıvı yüzeyi
    const k = yn < level - 0.004 ? 0 : yn < level + 0.004 ? (yn - level + 0.004) / 0.008 : 1;
    for (let c = 0; c < 3; c++) col[i * 3 + c] = air[c] * (1 - k) + (deep + men) * k;
  }
  g.setAttribute("color", new Float32BufferAttribute(col, 3));
}

// Yassı şişe (flask): boynun üstü (küre ya da silindir kapak) dönen gövde, altı ön ve arka
// yüzü düz, kenarları pahlı blok. Kalınlık gövde genişliğine oranla (depthRatio).
function flaskGeometry(S) {
  const N = S.rows.length;
  const cut = Math.round(S.neck * N);
  const cap = { ...S, rows: S.rows.map((r, i) => (i < cut ? r : 0)) };
  const rs = smoothRows(S.rows);
  const idx = rs.map((r, i) => i).filter((i) => i >= cut && rs[i] > 0);
  const y = (i) => (i + 0.5) / N;
  const left = idx.map((i) => [S.axis - rs[i], y(i)]);
  const right = idx.map((i) => [S.axis + rs[i], y(i)]).reverse();
  const width = 2 * Math.max(...idx.map((i) => rs[i])) * S.size;
  const body = { ...S, outline: [[...left, ...right]], depth: S.depth ?? width * (S.depthRatio ?? 0.42) };
  const block = flatBlock(body);
  if (S.clear) liquidColors(block, S, cut, idx[idx.length - 1] ?? N - 1);
  // Saydam camda (glass) içteki parfüm: gövdenin biraz içeride kalan kopyası (camın kalınlığı kadar), dolum
  // hizası gövdenin üstünden %15 aşağıda. Yüzey Liquid bileşeninde hareketle çalkalanır.
  let liquid = null;
  if (S.glass && idx.length) {
    const top = idx[0] / N;
    const bot = (idx[idx.length - 1] + 1) / N;
    const yc = (top + bot) / 2;
    const shrink = (pts) => pts.map(([x, y]) => [S.axis + (x - S.axis) * 0.86, yc + (y - yc) * 0.93]);
    const lBody = { ...body, outline: [shrink([...left, ...right])], depth: body.depth * 0.78 };
    const level = top + 0.2 * (bot - top);
    const li = Math.min(idx.length - 1, Math.max(0, Math.round(level * N) - cut));
    liquid = {
      geo: flatBlock(lBody),
      axisX: (S.axis - 0.5) * S.size,
      levelY: (0.5 - (top + 0.07 * (bot - top) + 0.93 * (level - top))) * S.size,
      width: 2 * rs[idx[li]] * 0.86 * S.size,
      depth: lBody.depth,
      height: (bot - top) * 0.93 * S.size,
    };
  }
  return { block, front: latheHalf(cap, false), back: latheHalf(cap, true), liquid };
}

function partGeometry(S) {
  if (S.profile === "flask" && S.neck) return flaskGeometry(S);
  return S.profile === "flat" && S.outline?.length ? { block: flatBlock(S) } : { front: latheHalf(S, false), back: latheHalf(S, true) };
}

function photoGeometry(S) {
  const key = `${S.file}|${S.profile}|${S.depth}|${S.zScale}|${S.neck}`;
  if (PHOTO.has(key)) return PHOTO.get(key);
  // Set: her ürün kendi biçimiyle ayrı parça; hepsi aynı doku atlasını paylaşır.
  const list = S.profile === "group" ? S.parts.map((p) => ({ size: S.size, lite: true, ...p })) : [S];
  const out = { parts: list.map(partGeometry), finF: finPlane(S, false), finB: finPlane(S, true) };
  PHOTO.set(key, out);
  return out;
}

const cache = new Map();
function geometry(S) {
  const key = JSON.stringify(S);
  if (cache.has(key)) return cache.get(key);
  let g;
  if (S.kind === "tube") {
    const round = S.capShape === "round";
    g = {
      body: tubeBody(S),
      seal: new BoxGeometry(S.radius * 2 * 1.36, 0.3, 0.1),
      shoulder: new CylinderGeometry(S.radius, S.capRadius * 0.92, 0.2, 72),
      // "flip": kısa düz kapak ve beyaz boğaz; "round": tüple aynı renkte kapsül kapak.
      cap: new CylinderGeometry(S.capRadius, S.capRadius, S.capHeight, 72),
      capEnd: round ? new SphereGeometry(S.capRadius, 48, 24, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2) : null,
      collar: round ? null : new CylinderGeometry(S.capRadius * 0.86, S.capRadius * 0.86, 0.14, 48),
    };
  } else {
    const { width: W, height: H, depth: D, corner } = S.glass;
    const lw = S.label.width ?? S.label.size;
    const lh = S.label.height ?? S.label.size;
    g = {
      glass: S.glass.shape === "cylinder" ? cylinderBody(W / 2, H, S.glass.shoulder ?? 0.1, S.glass.base ?? 0.12, S.neck.radius) : new RoundedBoxGeometry(W, H, D, 4, corner),
      liquid: new RoundedBoxGeometry(W - 0.3, H - 0.42, D - 0.3, 3, Math.max(0.06, corner - 0.15)),
      // Kalın taban: köşeleri yuvarlak şişelerde camın içinde kalacak kadar küçülür.
      base: new RoundedBoxGeometry(W - 0.08 - corner * 0.9, 0.26, D - 0.08 - corner * 0.9, 2, 0.05),
      neck: new CylinderGeometry(S.neck.radius, S.neck.radius, S.neck.height, 48),
      cap:
        S.cap.shape === "box"
          ? new RoundedBoxGeometry(S.cap.radius * 2, S.cap.height, S.cap.radius * 2, 3, 0.04)
          : new CylinderGeometry(S.cap.radius, S.cap.radius, S.cap.height, S.cap.shape === "octagon" ? 8 : 96),
      // Kumaş (sweatshirt) ve aletlerde etiket düz; kutu gövdelilerde sarılı.
      front: S.garment || S.kind === "tool" ? labelGeo(lw, lh, 0) : wrapLabelGeo(S, lw, lh, 0, S.label.y),
      back: S.garment || S.kind === "tool" ? labelGeo(lw, lh, 0.5) : wrapLabelGeo(S, lw, lh, 0.5, S.label.y),
      wrapped: !(S.garment || S.kind === "tool"),
      ...capGeometry(S.cap),
      ...(S.ribbon ? { ribbonV: new BoxGeometry(0.16, H + 0.03, D + 0.03), ribbonH: new BoxGeometry(W + 0.03, 0.16, D + 0.03), bow: new TorusGeometry(0.2, 0.05, 12, 32) } : {}),
      ...(S.garment ? garmentGeometry(W, H) : {}),
    };
    if (S.kind === "tool") Object.assign(g, toolGeometry(S));
  }
  cache.set(key, g);
  return g;
}

export function useCanBody() {
  const maps = useTexture(LABELS);
  return useMemo(() => {
    maps.forEach((map, i) => {
      map.colorSpace = SRGBColorSpace;
      map.anisotropy = 8;
      // Arka plan, arka etiketteki silüeti örnekler.
      map.wrapS = RepeatWrapping;
      map.needsUpdate = true;
      flavors[i].texture = map;
    });
    return new MeshStandardMaterial({ map: maps[0] });
  }, [maps]);
}

// Cam: kenarlara doğru (Fresnel) daha opak ve parlak.
function glassMaterial(opacity, color = "#ffffff") {
  const m = new MeshPhysicalMaterial({
    color,
    roughness: 0.04,
    metalness: 0,
    clearcoat: 1,
    clearcoatRoughness: 0.03,
    envMapIntensity: 2.2,
    transparent: true,
    opacity,
    depthWrite: false,
  });
  m.onBeforeCompile = (shader) => {
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <opaque_fragment>",
      /* glsl */ `
        float fres = pow(1. - abs(dot(normal, normalize(vViewPosition))), 2.5);
        diffuseColor.a = mix(diffuseColor.a, max(diffuseColor.a, 0.55), fres);
        outgoingLight += vec3(0.16) * fres;
        #include <opaque_fragment>
      `
    );
  };
  m.customProgramCacheKey = () => "hope-glass";
  return m;
}

function capMaterial(color, finish) {
  // "gold" / "silver" parlatılmış metal, "black" lake, "matte" yumuşak plastik.
  if (finish === "gold" || finish === "silver")
    return new MeshStandardMaterial({ color, metalness: 1, roughness: 0.16, envMapIntensity: 2.2, emissive: finish === "gold" ? "#3a2808" : "#101214" });
  if (finish === "matte") return new MeshStandardMaterial({ color, metalness: 0, roughness: 0.62, envMapIntensity: 0.6 });
  return new MeshPhysicalMaterial({ color, metalness: 0.1, roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.1, envMapIntensity: 1.2 });
}

// Her ürünün kendi malzemeleri olur; carousel'de tek tek karartılabilmesi için.
export function createBottleParts(f = {}) {
  const S = shapeOf(f);
  const parts = {};
  if (S.kind === "photo") {
    // Fotoğraflı üründe yalnızca etiket malzemesi var; sahne "metal"e dokunduğu için boş bir malzeme.
    parts.metal = new MeshStandardMaterial({ color: "#000000" });
    // Düz bloğun kenarları: ürünün kenar rengi.
    // Telefonda gerçek kırılma (ek çizim geçişi) kapalı: yarı saydam cam.
    parts.side = S.glass && !MOBILE_GL
      ? // Saydam cam (glass): kalınlık yüzleri ışığı gerçekten kıran cam; arkadaki sahne kırılarak görünür,
        // parfümün rengi camın derinliğinde koyulaşır (attenuation). Kenarlarda ortam yansıması.
        new MeshPhysicalMaterial({
          color: new Color(S.liquid ?? "#f2ead8").lerp(new Color(1, 1, 1), 0.55),
          transmission: 1,
          thickness: 0.9,
          ior: 1.5,
          roughness: 0.05,
          metalness: 0,
          clearcoat: 1,
          clearcoatRoughness: 0.03,
          envMapIntensity: 1.3,
          attenuationColor: new Color(S.liquid ?? "#f2ead8"),
          attenuationDistance: 2.2,
        })
      : S.clear
      ? // Şeffaf cam içinde parfüm: parlak, ışığı içinde taşıyan sıvı rengi (köşe renkleri: hava payı, sıvı yüzeyi).
        new MeshPhysicalMaterial({
          color: S.liquid ?? S.edge,
          vertexColors: true,
          roughness: 0.08,
          metalness: 0,
          clearcoat: 1,
          clearcoatRoughness: 0.04,
          envMapIntensity: 1.5,
          emissive: new Color(S.liquid ?? S.edge).multiplyScalar(0.22),
          transparent: !!S.glass,
          opacity: S.glass ? 0.22 : 1,
        })
      : new MeshStandardMaterial({ color: S.edge ?? "#8a7a60", roughness: 0.55, envMapIntensity: 0.6 });
    if (!S.clear) parts.side.color.multiplyScalar(0.78); // kenar ışığı fotoğraftakinden biraz koyu dursun
    (S.parts ?? []).forEach((p, i) => {
      parts[`side${i}`] = new MeshStandardMaterial({ color: p.edge ?? "#8a7a60", roughness: 0.55, envMapIntensity: 0.6 });
      parts[`side${i}`].color.multiplyScalar(0.78);
    });
    // Saydam camlı markada (content.glass) bütün parçalar saydam çizilir: geçişte şişe bütünüyle çözülür.
    if (content.glass) for (const m of Object.values(parts)) m.transparent = true;
    for (const m of Object.values(parts)) m.userData.base = { color: m.color.clone(), env: m.envMapIntensity, opacity: m.opacity };
    return parts;
  }
  if (S.kind === "tube") {
    const matte = S.finish === "matte";
    parts.tube = new MeshPhysicalMaterial({
      color: S.color,
      roughness: matte ? 0.62 : 0.3,
      clearcoat: matte ? 0 : 0.7,
      clearcoatRoughness: 0.2,
      sheen: S.finish === "pearl" ? 1 : 0,
      sheenColor: "#ffffff",
      envMapIntensity: matte ? 0.5 : 0.9,
    });
    parts.metal = capMaterial(S.capColor, S.capFinish);
    parts.collar = new MeshStandardMaterial({ color: "#f4f2ee", roughness: 0.4 });
  } else {
    parts.metal = capMaterial(S.cap.color, S.cap.finish);
    parts.cap = new MeshStandardMaterial({ color: S.neck.color, metalness: 0.9, roughness: 0.14, envMapIntensity: 1.6 });
    // Renkli (ör. kehribar) plastik ya da cam: `tint` ile opak, yoksa şeffaf cam.
    parts.glass =
      S.finish === "matte"
        ? new MeshStandardMaterial({ color: S.tint ?? "#dddddd", roughness: S.roughness ?? 0.85, envMapIntensity: 0.5 })
        : S.tint
          ? glassMaterial(S.tintOpacity ?? 0.85, S.tint)
          : glassMaterial(0.08);
    parts.rubber = new MeshStandardMaterial({ color: S.cap.bulb ?? "#161616", roughness: 0.55, envMapIntensity: 0.4 });
    if (S.ribbon) parts.ribbon = new MeshPhysicalMaterial({ color: S.ribbon, roughness: 0.35, sheen: 1, sheenColor: "#ffffff", envMapIntensity: 0.8 });
    if (S.garment) parts.rib = new MeshStandardMaterial({ color: S.tint, roughness: 0.95, envMapIntensity: 0.3 });
    if (S.kind === "tool") {
      const wood = S.tool !== "loofah";
      parts.main = new MeshStandardMaterial({
        color: wood ? "#ffffff" : "#f2e6c8",
        map: procTexture(wood ? "wood" : "loofah"),
        bumpMap: wood ? null : procTexture("loofah"),
        bumpScale: 3,
        roughness: wood ? 0.55 : 0.95,
        envMapIntensity: 0.6,
      });
      if (S.tool === "lymph") parts.main.map = procTexture("wood");
      parts.fiber = new MeshStandardMaterial({ color: "#ffffff", map: procTexture("fiber"), roughness: 1, envMapIntensity: 0.3 });
      parts.strap = new MeshStandardMaterial({ color: "#d9ccb0", roughness: 0.9, envMapIntensity: 0.3 });
      parts.card = new MeshStandardMaterial({ color: "#efe6d2", roughness: 0.8 });
      parts.string = new MeshStandardMaterial({ color: "#8a7650", roughness: 0.9 });
    }
    parts.base = glassMaterial(S.tint ? 0 : 0.3, "#e4ecee");
    // Şeffaf şişede içeriğin rengi (ör. altın sarısı sıvı sabun): `liquid`.
    parts.liquid = glassMaterial(S.tint ? 0 : (S.liquidOpacity ?? 0.06), S.liquid ?? "#f6f1e4");
  }
  for (const m of Object.values(parts)) m.userData.base = { color: m.color.clone(), env: m.envMapIntensity, opacity: m.opacity };
  return parts;
}

export function dimBottleParts(parts, dim, alpha = 1) {
  for (const m of Object.values(parts)) {
    m.color.copy(m.userData.base.color).multiplyScalar(dim);
    m.envMapIntensity = m.userData.base.env * dim;
    if (m.transparent) m.opacity = m.userData.base.opacity * alpha;
  }
}

function Tube({ body, parts, S }) {
  const g = geometry(S);
  const bottom = -(S.capHeight + 0.2 + S.height) / 2;
  const yCap = bottom + S.capHeight / 2;
  const yShoulder = bottom + S.capHeight + 0.1;
  const yBody = bottom + S.capHeight + 0.2 + S.height / 2;
  const round = S.capShape === "round";
  return (
    <group rotation={[0, 0, B.tilt]} position={[0, -0.1, 0]} scale={S.scale}>
      <mesh geometry={g.cap} material={round ? parts.tube : parts.metal} position={[0, yCap, 0]} />
      {g.capEnd && <mesh geometry={g.capEnd} material={parts.tube} position={[0, bottom, 0]} scale={[1, 0.55, 1]} />}
      {g.collar && <mesh geometry={g.collar} material={parts.collar} position={[0, bottom + S.capHeight + 0.05, 0]} />}
      <mesh geometry={g.shoulder} material={parts.tube} position={[0, yShoulder, 0]} />
      <mesh geometry={g.body} material={body} position={[0, yBody, 0]} />
      <mesh geometry={g.seal} material={parts.tube} position={[0, yBody + S.height / 2 + 0.1, 0]} />
    </group>
  );
}

const SIMPLE_CAPS = ["cylinder", "octagon", "box"];

// Pompa, sprey, damlalık ve roll-on kapakları; y0 kapağın tabanı.
function Cap({ g, parts, S, y0 }) {
  const c = S.cap;
  if (SIMPLE_CAPS.includes(c.shape))
    return <mesh geometry={g.cap} material={parts.metal} position={[0, y0 + c.height / 2, 0]} rotation={[0, c.shape === "octagon" ? Math.PI / 8 : 0, 0]} />;
  if (c.shape === "pump")
    return (
      <group position={[0, y0, 0]}>
        <mesh geometry={g.capA} material={parts.metal} position={[0, 0.17, 0]} />
        <mesh geometry={g.capB} material={parts.metal} position={[0, 0.54, 0]} />
        <mesh geometry={g.capC} material={parts.metal} position={[0.06, 0.8, 0]} />
        <mesh geometry={g.capD} material={parts.metal} position={[0.5, 0.82, 0]} rotation={[0, 0, Math.PI / 2]} />
      </group>
    );
  if (c.shape === "spray")
    return (
      <group position={[0, y0, 0]}>
        <mesh geometry={g.capA} material={parts.metal} position={[0, 0.15, 0]} />
        <mesh geometry={g.capB} material={parts.metal} position={[0, 0.51, 0]} />
        <mesh geometry={g.capD} material={parts.rubber} position={[0, 0.58, c.radius * 0.72]} rotation={[Math.PI / 2, 0, 0]} />
      </group>
    );
  if (c.shape === "dropper")
    return (
      <group position={[0, y0, 0]}>
        <mesh geometry={g.capA} material={parts.metal} position={[0, g.collarH / 2, 0]} />
        <mesh geometry={g.capB} material={parts.rubber} position={[0, g.collarH - 0.01, 0]} />
      </group>
    );
  if (c.shape === "ball")
    return (
      <group position={[0, y0, 0]}>
        <mesh geometry={g.capA} material={parts.metal} position={[0, c.height / 2, 0]} />
        <mesh geometry={g.capB} material={parts.metal} position={[0, c.height, 0]} />
      </group>
    );
  return null;
}

function Bottle({ body, parts, S }) {
  const g = geometry(S);
  const { width: W, height: H, depth: D } = S.glass;
  const labelY = GY + S.label.y;
  const solid = S.finish === "matte" || S.glass.shape === "cylinder";
  const top = GY + H / 2;
  return (
    <group rotation={[0, 0, S.tilt]} position={[0, -0.2, 0]} scale={S.scale}>
      {S.label.back && <mesh geometry={g.back} material={body} position={[0, labelY, g.wrapped ? 0 : -(g.garmentBody ? 0.23 : D / 2) - 0.004]} rotation={[0, Math.PI, 0]} />}
      {!solid && <mesh geometry={g.liquid} material={parts.liquid} position={[0, GY + 0.08, 0]} renderOrder={1} />}
      {!solid && <mesh geometry={g.base} material={parts.base} position={[0, GY - H / 2 + 0.15, 0]} renderOrder={2} />}
      {g.garmentBody ? (
        <mesh geometry={g.garmentBody} material={parts.glass} position={[0, GY, 0]} />
      ) : (
        <mesh geometry={g.glass} material={parts.glass} position={[0, GY, 0]} renderOrder={3} />
      )}
      <mesh geometry={g.front} material={body} position={[0, labelY, g.wrapped ? 0 : (g.garmentBody ? 0.23 : D / 2) + 0.004]} />
      {S.neck.height > 0 && <mesh geometry={g.neck} material={parts.cap} position={[0, top + S.neck.height / 2, 0]} />}
      <Cap g={g} parts={parts} S={S} y0={top + S.neck.height} />
      {g.ribbonV && (
        <>
          <mesh geometry={g.ribbonV} material={parts.ribbon} position={[W * 0.3, GY, 0]} />
          <mesh geometry={g.ribbonH} material={parts.ribbon} position={[0, GY + H * 0.3, 0]} />
          <mesh geometry={g.bow} material={parts.ribbon} position={[W * 0.3 - 0.18, top + 0.12, 0]} rotation={[0, 0, 0.5]} />
          <mesh geometry={g.bow} material={parts.ribbon} position={[W * 0.3 + 0.18, top + 0.12, 0]} rotation={[0, 0, -0.5]} />
        </>
      )}
      {g.collar && (
        <>
          <mesh geometry={g.collar} material={parts.rib} position={[0, top - 0.02, 0.1]} rotation={[0, 0, Math.PI]} scale={[1, 0.62, 1]} />
          <mesh geometry={g.hem} material={parts.rib} position={[0, GY - H / 2 + 0.13, 0]} />
        </>
      )}
    </group>
  );
}

function Tool({ body, parts, S }) {
  const g = geometry(S);
  const { width: lw, height: lh } = S.label;
  // Etiket kartı gövdenin önünde, ipiyle tepeden sarkar.
  const tagY = S.tag?.y ?? 0.2;
  const tagX = S.tag?.x ?? 0.9;
  const tagTop = tagY + lh / 2;
  const hang = S.tag?.hang ?? 1.3;
  // İp: kartın tepesinden aletin üst ucuna.
  const a = new Vector3(tagX, tagTop, 0.75);
  const b = new Vector3(S.tag?.anchorX ?? 0, tagTop + hang, 0.25);
  const dir = b.clone().sub(a);
  const q = new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), dir.clone().normalize());
  const string = <mesh geometry={g.string} material={parts.string} position={a.clone().add(b).multiplyScalar(0.5)} quaternion={q} scale={[1, dir.length(), 1]} />;
  const tag = (
    <group position={[tagX, tagY, 0.75]} rotation={[0, -0.12, S.tag?.rot ?? 0.06]}>
      <mesh geometry={g.card} material={parts.card} />
      <mesh geometry={g.front} material={body} position={[0, 0, 0.012]} />
      <mesh geometry={g.back} material={body} position={[0, 0, -0.012]} rotation={[0, Math.PI, 0]} />
    </group>
  );
  return (
    <group rotation={[0, 0, S.tilt]} position={[0, -0.2, 0]} scale={S.scale}>
      {S.tool === "brush" ? (
        <group rotation={[Math.PI / 2, 0, 0]} scale={[0.95, 1, 1.3]}>
          <mesh geometry={g.main} material={parts.main} />
          <mesh geometry={g.fiber} material={parts.fiber} position={[0, -0.5, 0]} />
        </group>
      ) : (
        <mesh geometry={g.main} material={parts.main} rotation={[0, 0, S.tool === "loofah" ? 0.12 : 0]} />
      )}
      {S.tool === "brush" && <mesh geometry={g.strap} material={parts.strap} position={[0, 0, 0.26]} />}
      {string}
      {tag}
    </group>
  );
}

function Photo({ body, parts, S, flavor }) {
  const g = photoGeometry(S);
  const cap = useRef();
  // Parfüm sıkma (content.spray): yassı şişede kapak (boynun üstündeki torna) ayrı bir grupta kalkar.
  const spray = content.spray && S.profile === "flask" && S.neck;
  const pivot = useMemo(() => (spray ? capPivot(S) : null), [spray, S]);
  return (
    <group rotation={[0, 0, S.tilt]} scale={S.scale}>
      {g.parts.map((p, i) => (
        <group key={i}>
          {p.block && <mesh geometry={p.block} material={[body, parts[`side${i}`] ?? parts.side]} />}
          {pivot && i === 0 ? (
            <group ref={cap} position={[pivot.x, pivot.y, 0]}>
              <group position={[-pivot.x, -pivot.y, 0]}>
                {p.front && <mesh geometry={p.front} material={body} />}
                {p.back && <mesh geometry={p.back} material={body} />}
              </group>
            </group>
          ) : (
            <>
              {p.front && <mesh geometry={p.front} material={body} />}
              {p.back && <mesh geometry={p.back} material={body} />}
            </>
          )}
        </group>
      ))}
      {pivot && <Sprayer S={S} pivot={pivot} cap={cap} flavor={flavor} />}
      {g.parts[0]?.liquid && <Liquid L={g.parts[0].liquid} S={S} body={body} />}
      {/* Gövdelerin dışında kalan ince parçalar (pompa ağzı, sap): fotoğraf kartı. Saydam camda kart camın
          içinden görünürdü (ikinci bir etiket gibi); orada çizilmez. */}
      {/* Parfüm sıkmada (pivot) kart çizilmez: kapağın fotoğrafı kartta kalır ve kapak kalkınca yerinde
          ikinci bir kapak gibi görünürdü; sprey başlığını Sprayer çizer. */}
      {!S.glass && !pivot && (
        <>
          <mesh geometry={g.finF} material={body} position={[0, 0, 0.002]} userData={{ noFit: true }} />
          <mesh geometry={g.finB} material={body} position={[0, 0, -0.002]} rotation={[0, Math.PI, 0]} userData={{ noFit: true }} />
        </>
      )}
    </group>
  );
}

// Şişedeki parfüm: gövdenin içinde yarı saydam, ürünün renginde sıvı ve yüzeyi. Şişe hareket ettikçe
// (kaydırma, dönme, detayda sürükleme) yüzey eylemsizlikle ters yöne yatar, yay-sönüm ile sağa sola çalkalanıp
// durulur. Sıvının üstü, eğik yüzey düzlemiyle kırpılır (sıvının shader'ında, dünya uzayındaki düzlemle).
const _p = new Vector3();
const _v = new Vector3();
const _a = new Vector3();
const _qi = new Quaternion();
const _n = new Vector3();
const _up = new Vector3(0, 1, 0);
const _qx = new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), -Math.PI / 2);
function liquidTint(hex) {
  // Fotoğraftaki sıvı rengi çok açık (neredeyse beyaz): sahnede seçilsin diye doygunlaşır ve koyulaşır.
  // Rengi belirgin olanın tonu korunur (Hicaz sarı, Babel pembe); neredeyse renksiz olan altın-amber olur.
  const c = new Color(hex ?? "#e9dcb0");
  const hsl = {};
  c.getHSL(hsl);
  const colored = hsl.s > 0.25 && hsl.l < 0.97;
  return c.setHSL(colored ? hsl.h : 0.1, colored ? Math.min(0.9, hsl.s * 1.6 + 0.2) : 0.75, 0.42);
}
function Liquid({ L, S, body }) {
  const vol = useRef();
  const surf = useRef();
  const st = useRef({ init: false, prev: new Vector3(), vel: new Vector3(), yaw: 0, tx: 0, vx: 0, tz: 0, vz: 0 });
  const plane = useMemo(() => new Plane(), []);
  const mats = useMemo(() => {
    const tint = liquidTint(S.liquid);
    // Sıvı ışıksız (MeshBasic): her sahnede kendi amber tonunda; güçlü sergi ışığında krem blok olmaz.
    const volume = new MeshBasicMaterial({
      color: tint.clone().multiplyScalar(0.75),
      transparent: true,
      opacity: 0.42,
      depthWrite: false,
      side: DoubleSide,
      toneMapped: false,
    });
    // Yüzeyin üstü kendi shader'ımızda atılır (dünya uzayında düzlem: u_liq.xyz normal, u_liq.w sabit).
    volume.userData.plane = { value: new Vector4(0, -1, 0, 0) };
    volume.onBeforeCompile = (sh) => {
      sh.uniforms.u_liq = volume.userData.plane;
      sh.vertexShader = sh.vertexShader
        .replace("#include <common>", "#include <common>\nvarying vec3 vLiqW;")
        .replace("#include <worldpos_vertex>", "#include <worldpos_vertex>\nvLiqW = (modelMatrix * vec4(transformed, 1.0)).xyz;");
      sh.fragmentShader = sh.fragmentShader
        .replace("#include <common>", "#include <common>\nuniform vec4 u_liq;\nvarying vec3 vLiqW;")
        .replace("void main() {", "void main() {\n  if (dot(u_liq.xyz, vLiqW) + u_liq.w < 0.0) discard;");

    };
    volume.customProgramCacheKey = () => "mardini-liquid";
    const top = new MeshBasicMaterial({
      color: tint.clone().lerp(new Color(1, 0.95, 0.85), 0.45),
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
      side: DoubleSide,
      toneMapped: false,
    });
    return { volume, top };
  }, [S.liquid, plane]);
  useFrame(({ clock }, delta) => {
    const m = vol.current;
    if (!m) return;
    const dt = Math.min(Math.max(delta, 1 / 240), 1 / 20);
    const s = st.current;
    m.updateWorldMatrix(true, false);
    m.getWorldPosition(_p);
    m.getWorldQuaternion(_qi);
    // Yerel eksen etrafındaki dönüş (yaw) de sıvıyı sallar.
    _n.set(0, 0, 1).applyQuaternion(_qi);
    const yaw = Math.atan2(_n.x, _n.z);
    if (!s.init) {
      s.prev.copy(_p);
      s.yaw = yaw;
      s.init = true;
    }
    _v.copy(_p).sub(s.prev).divideScalar(dt);
    _a.copy(_v).sub(s.vel).divideScalar(dt);
    s.prev.copy(_p);
    s.vel.copy(_v);
    let dyaw = yaw - s.yaw;
    if (dyaw > Math.PI) dyaw -= 2 * Math.PI;
    if (dyaw < -Math.PI) dyaw += 2 * Math.PI;
    s.yaw = yaw;
    // İvme yerel eksenlere çevrilir (dünya ölçeğine göre normalize).
    _a.applyQuaternion(_qi.invert());
    const scale = m.matrixWorld.getMaxScaleOnAxis() || 1;
    const ax = MathUtils.clamp(_a.x / scale, -60, 60);
    const az = MathUtils.clamp(_a.z / scale, -60, 60);
    // Yay-sönüm: yüzey ivmenin tersine yatar, sonra salınarak durulur.
    const k = 55;
    const c = 3.2;
    s.vx += (-k * s.tx - c * s.vx - ax * 0.9 - (dyaw / dt) * 0.35) * dt;
    s.vz += (-k * s.tz - c * s.vz + az * 0.9) * dt;
    s.tx = MathUtils.clamp(s.tx + s.vx * dt, -0.45, 0.45);
    s.tz = MathUtils.clamp(s.tz + s.vz * dt, -0.35, 0.35);
    // Çok hafif, sürekli canlılık (durgun sıvıda da ışık oynar).
    const t = clock.getElapsedTime();
    const wob = 0.012 * Math.sin(t * 1.7);
    const sx = Math.tan(s.tx + wob);
    const sz = Math.tan(s.tz);
    // Yerel yüzey: y = level - sx·(x - axis) - sz·z; normal (sx, 1, sz).
    _n.set(sx, 1, sz).normalize();
    const p0 = _v.set(L.axisX, L.levelY, 0);
    plane.setFromNormalAndCoplanarPoint(_n.clone().negate(), p0);
    plane.applyMatrix4(m.matrixWorld);
    mats.volume.userData.plane.value.set(plane.normal.x, plane.normal.y, plane.normal.z, plane.constant);
    const q = surf.current.quaternion.setFromUnitVectors(_up, _n);
    q.multiply(_qx);
    surf.current.position.copy(p0);
    // Geçişte şişeyle birlikte soluklaşır.
    const o = body.transparent ? body.opacity : 1;
    mats.volume.opacity = 0.42 * o;
    mats.top.opacity = 0.55 * o;
  });
  return (
    <>
      {/* Sıvı camdan önce çizilir (cam derinliğe yazar; sonra çizilirse camın arkasında kalırdı). */}
      <mesh ref={vol} geometry={L.geo} material={mats.volume} renderOrder={-2} userData={{ noMeasure: true, noFit: true }} />
      <mesh ref={surf} material={mats.top} renderOrder={-1} userData={{ noMeasure: true, noFit: true }}>
        <planeGeometry args={[L.width, L.depth]} />
      </mesh>
    </>
  );
}

// Kapağın ölçüleri (yerel birim): tepesi, boyu, ortası ve boyundaki halkanın yarıçapı.
function capPivot(S) {
  const L = S.size;
  const N = S.rows.length;
  const cut = Math.round(S.neck * N);
  let top0 = S.rows.findIndex((r) => r > 0);
  if (top0 < 0 || top0 >= cut) top0 = Math.max(0, cut - Math.round(0.15 * N));
  const neckR = Math.max(...S.rows.slice(Math.max(top0, cut - 4), cut)) * L;
  const capR = Math.max(...S.rows.slice(top0, cut)) * L;
  return {
    x: (S.axis - 0.5) * L,
    y: (0.5 - (top0 + cut) / 2 / N) * L,
    h: ((cut - top0) / N) * L,
    r: capR,
    neckTop: (0.5 - S.neck) * L,
    collar: MathUtils.clamp(neckR * 0.9, 0.035 * L, 0.09 * L),
    L,
  };
}

const easeOutC = (t) => 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 3);
const easeIO = (t) => {
  const x = Math.min(1, Math.max(0, t));
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};
const GOLD_M = new MeshStandardMaterial({ color: "#d9b66c", metalness: 1, roughness: 0.2, envMapIntensity: 1.7 });
const STEEL_M = new MeshStandardMaterial({ color: "#c9c9c9", metalness: 1, roughness: 0.25, envMapIntensity: 1.4 });
const HOLE_M = new MeshStandardMaterial({ color: "#050505", roughness: 0.6 });
const _q = new Quaternion();
const _d = new Vector3();
const shownInScene = (o) => {
  for (let x = o; x; x = x.parent) if (!x.visible) return false;
  return true;
};

// Sprey başlığı: kapak kalkınca görünen altın boyun halkası, ince sap ve basmalı başlık (önünde püskürtme
// deliği). Sıkma zaman çizelgesi (SPRAY): kapak kalkıp yana döner, başlığa basılır, buğu çıkar, kapak kapanır.
function Sprayer({ S, pivot, cap, flavor }) {
  const group = useRef();
  const act = useRef();
  const nozzle = useRef();
  const P = pivot;
  const L = P.L;
  const actR = P.collar * 0.62;
  const actY = P.neckTop + 0.095 * L;
  // Püskürtme yönü (yerel): buğu ekrana doğru, ortaya (izleyicinin yüzüne) üflenir; hafifçe yukarı.
  const dir = useMemo(() => new Vector3(0, 0.14, 1).normalize(), []);
  const hole = Math.atan2(dir.x, dir.z);
  useFrame(({ clock }) => {
    const sp = sceneState.spray;
    const now = clock.getElapsedTime() / SPRAY_SLOW;
    const t = sp.flavor === flavor ? now - sp.t0 : 99;
    const lift = t < SPRAY.lift ? easeOutC(t / SPRAY.lift) : t < SPRAY.back ? 1 : t < SPRAY.end ? 1 - easeIO((t - SPRAY.back) / (SPRAY.end - SPRAY.back)) : 0;
    const c = cap.current;
    if (c) {
      const bob = lift > 0.99 ? Math.sin(t * 2.2) * 0.012 * L : 0;
      // Kapak görünmez bir elle kaldırılmış gibi: biraz yukarı ve yana, hafifçe eğik havada asılı kalır.
      c.position.set(P.x + lift * P.r * 0.75, P.y + lift * P.h * 0.75 + bob, lift * 0.06 * L);
      c.rotation.set(0, -0.35 * lift, -0.3 * lift);
    }
    group.current.visible = lift > 0.02;
    // Basma: başlık kısa bir an aşağı iner, buğu bitince kalkar.
    const down = t > SPRAY.press && t < SPRAY.emit + SPRAY.emitDur ? Math.min(1, (t - SPRAY.press) / 0.08) : 0;
    act.current.position.y = actY - down * 0.014 * L;
    if (t < SPRAY.end && group.current.visible && shownInScene(group.current)) {
      nozzle.current.getWorldPosition(sceneState.nozzle);
      nozzle.current.getWorldQuaternion(_q);
      sceneState.nozzleDir.copy(_d.copy(dir).applyQuaternion(_q).normalize());
      sceneState.nozzleAt = now;
    }
  });
  return (
    <group ref={group} visible={false}>
      <mesh material={GOLD_M} position={[P.x, P.neckTop + 0.024 * L, 0]}>
        <cylinderGeometry args={[P.collar, P.collar * 1.04, 0.048 * L, 48]} />
      </mesh>
      <mesh material={STEEL_M} position={[P.x, P.neckTop + 0.058 * L, 0]}>
        <cylinderGeometry args={[P.collar * 0.16, P.collar * 0.16, 0.022 * L, 16]} />
      </mesh>
      <group ref={act} position={[P.x, actY, 0]}>
        <mesh material={GOLD_M}>
          <cylinderGeometry args={[actR, actR, 0.055 * L, 40]} />
        </mesh>
        <group rotation={[0, hole, 0]}>
          <mesh material={HOLE_M} position={[0, 0.006 * L, actR * 0.99]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[actR * 0.16, actR * 0.16, 0.004 * L, 16]} />
          </mesh>
          <object3D ref={nozzle} position={[0, 0.006 * L, actR * 1.05]} />
        </group>
      </group>
    </group>
  );
}

// Her ürün ekranda orantılı ve rahat görünsün: gerçek sınır kutusu ölçülür ve ürünler
// benzer bir görsel alana getirilir (uzun şişe tam boy, geniş çanta ya da set
// taşmadan); yükseklik ve genişlik sınırı aşılmaz, ürün ortalanır.
const MAX_H = 3.6;
const MAX_W = 4.4;
const AREA = 6.6;
const _inv = new Matrix4();
const _m = new Matrix4();
function Fit({ children, k, wide }) {
  const ref = useRef();
  useLayoutEffect(() => {
    const g = ref.current;
    g.scale.setScalar(1);
    g.position.set(0, 0, 0);
    g.updateWorldMatrix(true, true);
    _inv.copy(g.matrixWorld).invert();
    const box = new Box3();
    g.traverse((o) => {
      if (!o.isMesh || !o.geometry || o.userData.noFit) return; // fotoğraf kartı tüm kareyi kaplar, ölçülmez
      if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
      _m.multiplyMatrices(_inv, o.matrixWorld);
      box.union(o.geometry.boundingBox.clone().applyMatrix4(_m));
    });
    if (box.isEmpty()) return;
    const h = box.max.y - box.min.y;
    const w = box.max.x - box.min.x;
    // Setler (birkaç ürün yan yana) daha geniş bir alan kaplar ki içindekiler rahat görünsün.
    const sc = Math.min(1.6, MAX_H / h, (wide ? 5.2 : MAX_W) / w, Math.sqrt((wide ? 9 : AREA) / (w * h)));
    g.scale.setScalar(sc);
    g.position.set(-((box.max.x + box.min.x) / 2) * sc, -((box.max.y + box.min.y) / 2) * sc + 0.1, 0);
  }, [k]);
  return <group ref={ref}>{children}</group>;
}

// Galeri çekiminin 3B görünümü: ürünün kendisi, yalnızca biçim ve doku o çekimden.
export const viewOf = (flavor, view) => {
  const v = view != null ? flavors[flavor].views?.[view] : null;
  return v ? { ...flavors[flavor], photo3d: v.photo3d, file: v.file } : flavors[flavor];
};
export const viewUrl = (file) => FILES[`./assets/labels/${file}`];

export default function CanMesh({ body, parts, flavor = 0, view = null }) {
  const f = viewOf(flavor, view);
  return (
    <Fit k={`${flavor}:${view}`} wide={f.photo3d?.profile === "group"}>
      <ProductShape body={body} parts={parts} f={f} flavor={flavor} />
    </Fit>
  );
}

function ProductShape({ body, parts, f, flavor }) {
  const S = shapeOf(f);
  if (S.kind === "photo") return <Photo body={body} parts={parts} S={S} flavor={flavor} />;
  if (S.kind === "tube") return <Tube body={body} parts={parts} S={S} />;
  if (S.kind === "tool") return <Tool body={body} parts={parts} S={S} />;
  return <Bottle body={body} parts={parts} S={S} />;
}

useTexture.preload(LABELS);
