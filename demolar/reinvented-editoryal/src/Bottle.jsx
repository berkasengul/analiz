import { useMemo } from "react";
import { useTexture } from "@react-three/drei";
import { BoxGeometry, CylinderGeometry, LatheGeometry, MeshPhysicalMaterial, SphereGeometry, SRGBColorSpace, Vector2 } from "three";

// Reinvented şişesi, markanın kendi ürün fotoğrafından (ön ve arka kesim) 3B olarak kurulur:
// küre kapak (mermer desenli), ince boyun, siyah cam yaka, eğimli omuz ve kare gövde.
// Ölçüler fotoğrafın silüetinden (products.json → geo, piksel) gelir; her parçanın ön yüzü fotoğrafın
// aynı yerine düz izdüşümle oturur (etiket yazısı, ışık ve yansımalar fotoğraftaki gibi), arka yüzü
// arka kesime. Şişenin boyu 3 birim; orijin tabanın ortası.
export const HEIGHT = 3;
const BASE = import.meta.env.BASE_URL;
export const frontUrl = (h) => `${BASE}assets/${h}-front.webp`;
export const backUrl = (h) => `${BASE}assets/${h}-back.webp`;

// Düz izdüşüm: köşe noktasının yeri fotoğraftaki pikseline denk gelir. Arkaya bakan yüzler arka kesimden
// (soldan sağa ters) ya da `mirrorFront` ile ön fotoğrafın aynasından okunur.
function planar(geo, g, S, yOff, { inset = 1 } = {}) {
  const p = geo.attributes.position;
  const n = geo.attributes.normal;
  const uv = geo.attributes.uv;
  const cy = (g.h - g.capRow) * S;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i) * inset;
    const y = (p.getY(i) + yOff - cy) * inset + cy;
    const back = n.getZ(i) < -0.2 || (n.getZ(i) <= 0.2 && p.getZ(i) < 0);
    const col = back ? g.w / 2 - x / S : g.w / 2 + x / S;
    uv.setXY(i, col / g.w, y / (g.h * S));
  }
  uv.needsUpdate = true;
  return geo;
}

function useParts(g) {
  return useMemo(() => {
    const S = HEIGHT / g.h;
    const yOf = (row) => (g.h - row) * S;
    const bodyW = g.bodyW * S;
    const depth = bodyW * 0.62;
    // Gövde: kare kutu; ön ve arka yüz fotoğraftan, yanlar siyah cam.
    const bodyH = yOf(g.bodyTop);
    const body = planar(new BoxGeometry(bodyW, bodyH, depth, 1, 1, 1), g, S, bodyH / 2);
    // Omuz: yakadan gövdeye genişleyen kesik piramit.
    const shH = yOf(g.shoulderRow) - yOf(g.bodyTop);
    const shoulder = new BoxGeometry(bodyW, shH, depth, 1, 1, 1);
    const k = Math.min(1, (g.collarW * S) / bodyW);
    const kz = Math.min(1, (g.collarW * S) / depth);
    const sp = shoulder.attributes.position;
    for (let i = 0; i < sp.count; i++) if (sp.getY(i) > 0) sp.setXYZ(i, sp.getX(i) * k, sp.getY(i), sp.getZ(i) * kz);
    shoulder.computeVertexNormals();
    planar(shoulder, g, S, yOf(g.bodyTop) + shH / 2);
    // Yaka: yuvarlak kenarlı siyah cam halka.
    const cr = (g.collarW / 2) * S;
    const cTop = yOf(g.neckRow + 6);
    const cBot = yOf(g.shoulderRow);
    const e = Math.min(0.04, (cTop - cBot) * 0.3);
    const collar = planar(
      new LatheGeometry(
        [new Vector2(0, cBot), new Vector2(cr - e, cBot), new Vector2(cr, cBot + e), new Vector2(cr, cTop - e), new Vector2(cr - e, cTop), new Vector2(0, cTop)],
        64
      ),
      g,
      S,
      0
    );
    // Boyun: kürenin altından yakaya.
    const nr = (g.neckW / 2) * S;
    const R = (g.capW / 2) * S;
    const capY = yOf(g.capRow);
    const nTop = capY - R * 0.6;
    const neck = new CylinderGeometry(nr, nr, nTop - cTop + 0.02, 40);
    neck.translate(0, (nTop + cTop) / 2, 0);
    // Kapak: küre; iki yarısı da ön fotoğrafın mermer desenini taşır (arka yarı aynası).
    const cap = new SphereGeometry(R, 72, 48);
    cap.translate(0, capY, 0);
    planar(cap, g, S, 0, { inset: 0.965 });
    cap.translate(0, -capY, 0);
    return { body, shoulder, collar, neck, cap, capY, bodyH, shY: yOf(g.bodyTop) + shH / 2 };
  }, [g]);
}

const glass = new MeshPhysicalMaterial({ color: "#0b0b0e", roughness: 0.16, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.06, envMapIntensity: 1.1 });

function photoMat(map) {
  // Fotoğrafın kendi ışığı korunur (emissive), üstüne sahnenin yansımaları ve parlak cila eklenir.
  return new MeshPhysicalMaterial({
    map,
    color: "#8a8a8a",
    emissiveMap: map,
    emissive: "#ffffff",
    emissiveIntensity: 0.62,
    roughness: 0.22,
    metalness: 0,
    clearcoat: 1,
    clearcoatRoughness: 0.08,
    envMapIntensity: 0.7,
  });
}

export default function Bottle({ product }) {
  const g = product.geo;
  const [front, back] = useTexture([frontUrl(product.handle), backUrl(product.handle)]);
  front.colorSpace = back.colorSpace = SRGBColorSpace;
  front.anisotropy = back.anisotropy = 8;
  const parts = useParts(g);
  const mats = useMemo(() => {
    const f = photoMat(front);
    const b = photoMat(back);
    // BoxGeometry yüz sırası: +x, -x, +y, -y, +z (ön), -z (arka).
    return { box: [glass, glass, glass, glass, f, b], f };
  }, [front, back]);
  return (
    <group>
      <mesh geometry={parts.body} material={mats.box} position={[0, parts.bodyH / 2, 0]} />
      <mesh geometry={parts.shoulder} material={mats.box} position={[0, parts.shY, 0]} />
      <mesh geometry={parts.collar} material={mats.f} />
      <mesh geometry={parts.neck} material={glass} />
      <mesh geometry={parts.cap} material={mats.f} position={[0, parts.capY, 0]} />
    </group>
  );
}
