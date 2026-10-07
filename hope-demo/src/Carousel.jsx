import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { AdditiveBlending, BackSide, CanvasTexture, Color, DoubleSide, MathUtils, MeshBasicMaterial, MeshPhysicalMaterial, MeshStandardMaterial, ShaderMaterial, SRGBColorSpace, Vector3 } from "three";
import { animate } from "framer-motion";
import { easeQuadOut } from "d3-ease";

import CanMesh, { createBottleParts, dimBottleParts, useCanBody } from "./CanMesh";
import { MOBILE, createCanMaterial, createCanUniforms, setCanFlavor } from "./canMaterial";
import { THEME } from "./theme";
import { WATER_CLIP, lakePath } from "./Lake";
import { studioEnv } from "./Studio";

// Tema stüdyo ışığı: kenar ışığı ürünün kendi vurgu renginde ve güçlü, yüzeyden ışık süpürmesi geçer.
const STUDIO = !!THEME.studio;
// "solo": yan ürünler küçülüp geriye çekilir; sahne tek ürün odaklı.
// "orbit": tek ürün sahnesinin döner vitrin çeşidi: ürünler büyük bir döner platformun kenarında
// halka olarak durur, kaydırınca platform döner ve sıradaki ürün öne, ışığa gelir.
export const ORBIT = THEME.carousel === "orbit";
// "rise": ışık sütununda tek ürün; kaydırınca ürün yarım tur dönerek yukarı çıkar, sıradaki aşağıdan
// dönerek yükselip yerine oturur. Ekranda aynı anda yalnızca biri (geçişte ikisi) görünür.
export const RISE = THEME.carousel === "rise";
// "glide": tek şişe altın bir Osmanlı kemerinin içinde; kaydırınca yana süzülüp döner, sıradaki öbür yandan girer.
export const GLIDE = THEME.carousel === "glide";
// "dolly": karanlık sinematik stüdyo; şişe arkasındaki ışık panelinin önünde, geçişte karanlıkta çözülüp belirir.
export const DOLLY = THEME.carousel === "dolly";
// "lake": gece stüdyosu (Lake.jsx, Studio.jsx); ıslak siyah taş zeminde şişe; sıradaki koku ufuktan süzülerek gelir.
export const LAKE = THEME.carousel === "lake";
const SOLO = THEME.carousel === "solo" || ORBIT || RISE || GLIDE || DOLLY || LAKE;
// Kaide için her ürünün yerel alt kenarı (şişe, set, tüp farklı boyda); ilk görüldüğünde ölçülür.
const BOTTOM = [];
// Ürünün tepesi (kapak dahil): arka plan sahnesi ürünün boyuna göre ölçeklenir.
const TOP = [];
// Ürünün yarı genişliği (yerel): premium duvarın kemerli nişi ürünü içine alacak kadar genişler.
const HALF = [];
// Ürünün yerel alt/üst kenarı (HeroCan: koku bulucu kaidesine oturtma).
export const BOUNDS = { bottom: BOTTOM, top: TOP };
// Sahne fotoğraflı ürünlerin ortak ayak çizgisi: ilk ölçülen ürünün alt kenarı.
const FOOT = { ref: null };
const V = new Vector3();
import { PAGE, content, flavors } from "./data";
import { scrollState, slotIndex } from "./scroll";
import { sceneState } from "./shared";
import { useStore } from "./store";

const N = flavors.length;
// Açık renkli ambalajlarda (krem beyazı tüp, açık etiket) spot ışığı kısılır ki
// yazılar parlamada kaybolmasın. `products[].light` ile elle de verilebilir.
const lum = (hex) => {
  const c = new Color(hex);
  return 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b;
};
export const lightOf = (f) => f.light ?? 1 - 0.5 * MathUtils.smoothstep(lum(f.labelBg ?? f.color), 0.3, 0.75);
// Az ürünlü setlerde (kategori sayfaları) ürünler sonsuz yay yerine yan yana
// düz bir sırada durur; kaydırdıkça sıradaki ürün ortaya gelir.
// Az ürünlü sette düz sıra; tek ürün sahnesinde 3+ üründe halka (öndekinin iki yanında da silüet olsun).
const LINEAR = N < 5 && !(SOLO && N >= 3);
// Kategori sayfasında üstte kategori satırı var: masaüstünde sahne biraz aşağıda durur.
const CAT_DROP = SOLO && PAGE.kind === "category" ? 0.45 : 0;
const WHITE = new Color(1, 1, 1);
const KEY_WARM = new Color("#ffeedd");
const easeOut = (t) => 1 - Math.pow(1 - t, 3);
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
// ?slowmo=8 adresiyle uçuş ağır çekimde oynar (animasyonu incelemek için).
const SLOWMO = typeof window !== "undefined" ? Number(new URLSearchParams(window.location.search).get("slowmo")) || 1 : 1;
const FLIGHT = (THEME.carousel === "dolly" ? 1.45 : 1.15) * SLOWMO; // saniye
const SHOT = typeof window !== "undefined" && new URLSearchParams(window.location.search).has("shot");
const KEYS = ["x", "y", "z", "rotX", "rotY", "rotZ", "scale"];

// Döner vitrinin yarıçapı ve platform yüksekliği (ekran oranına göre).
export const orbitRadius = (aspect) => (aspect < 0.9 ? 2.9 : 4.5);
export const orbitFloor = (aspect) => (aspect < 0.9 ? -1.25 : -1.75);
// Masaüstünde halka sağa kayar: soldaki başlığa yer kalır.
export const orbitX = (aspect) => (aspect < 0.9 ? 0 : 2.3 * MathUtils.clamp(aspect / 1.9, 0.44, 1));

// Kutular sonsuz bir yay üzerinde dizilir. d = kutunun aktif tata uzaklığı.
export function arcPose(d, aspect, time, i) {
  const ad = Math.abs(d);
  const focus = Math.max(0, 1 - ad);
  const spread = MathUtils.clamp(aspect / 1.9, 0.44, 1);
  const base = aspect < 0.9 ? 0.78 : 1;
  if (SOLO) {
    // Tek ürün sahnesi: öndeki ürün büyük ve ışıkta; diğerleri iki yanda, geride ve loşta
    // hafifçe görünür. Telefonda yanlar ekranın kenarından yarım görünür. Kaydırınca sıradaki ışığa yürür.
    const phone = aspect < 0.9;
    if (DOLLY) {
      // Butik sırası: ortada tek, sabit bir kaide; öndeki ürün onun üstünde. Komşular iki yanda, biraz
      // geride, doğrudan mermer zeminde. Kaydırınca sağdaki ürün süzülerek ortaya gelir ve hafif bir
      // kavisle kaidenin üstüne konar; öndeki ürün kaideden inip yana çekilir.
      // Masaüstü (butik fotoğrafıyla ölçülmüş): öndeki ürün ekranın ortasında (fotoğraftaki kemerin içinde),
      // komşular kemerin iki yanında, çiçeklerin önünde, 12 birim geride (aynı boyda; perspektifle küçük görünür).
      const cx = 0;
      // Komşular kemerin dışında: kemerin ekrandaki yarı genişliği (fotoğrafın %12,4'ü; fotoğraf ekran boyunca
      // uzandığından 0,326/en-boy) + %12 pay; 16 birim geride (kamera 18 birim önde) ekrana izdüşümü.
      const offset = 0.326 / aspect + 0.09;
      const sp = phone ? 3.5 : offset * 11.35 * aspect * (34 / 18);
      const sc0 = dollyScale(aspect);
      const a1 = Math.min(ad, 1);
      const z = phone ? -5 * a1 - 3 * Math.max(0, ad - 1) : -16 * a1 - 6 * Math.max(0, ad - 1);
      const scale = sc0 * (phone ? 1 - 0.12 * a1 : 1);
      // Uzaktakiler (ikinci komşudan öte) karanlıkta söner.
      const alpha = 1 - MathUtils.smoothstep(ad, 1.45, 1.95);
      const idle = focus > 0 ? Math.sin(time * 0.4) * 0.07 * focus : 0;
      // Kaidenin üstü (ortada) ile zemin (yanlarda) arası; kaideye yaklaşırken ürün yükselir, yolda hafif kavis.
      const up = 1 - MathUtils.smoothstep(ad, 0.14, 0.6);
      const hop = ad < 0.85 ? Math.sin((Math.PI * ad) / 0.85) * 0.2 * sc0 : 0;
      return {
        x: cx + d * sp,
        y: dollyTop(aspect) - PLINTH_H * sc0 * (1 - up) + hop - (BOTTOM[i] ?? -1.8) * scale,
        z,
        rotX: 0.01,
        // Komşular hafifçe ortaya dönük.
        rotY: 0.1 * focus - 0.1 * MathUtils.clamp(d, -1, 1) + idle,
        rotZ: 0,
        scale: alpha > 0.004 ? scale : 0,
        alpha,
        up,
      };
    }
    if (LAKE) {
      // Gece stüdyosu (Lake.jsx → lakePath, Studio.jsx): sıradaki koku ufuktan süzülerek gelir, öndeki yana
      // çekilip söner. Şişe ıslak taş zemine oturur (salınmaz); çevresinde nefes alanı kalsın diye ölçüsü ölçülü,
      // önemini ışık verir. Yerindeyken yalnızca ±1° çok yavaş (10 sn) yalpalar ki camdaki yansımalar hafifçe kaysın.
      const q = lakePath(d, aspect);
      const sc = q.L.sc * q.vis * (phone ? 0.9 : 0.92);
      return {
        x: q.x,
        y: q.L.y - (BOTTOM[i] ?? -1.8) * sc,
        z: q.z,
        rotX: 0.01,
        rotY: -d * 1.1 + 0.07 * focus + (focus > 0 ? Math.sin((time * Math.PI * 2) / 10) * 0.0175 * focus : 0),
        rotZ: 0,
        scale: sc,
        alpha: q.vis,
      };
    }
    if (GLIDE) {
      // Komşu şişe yalnızca geçişte görünür; yerindeyken kemerde tek şişe. Sayfa ürünün tam üstünde durmasa da
      // (ör. sıra 2,06) yandaki şişe uzakta minik bir silüet olarak kalmaz.
      const vis = 1 - MathUtils.smoothstep(ad, 0.55, 0.84);
      // Kategori sayfasında üstte kategori sekmeleri var: şişe (ve kemer) biraz küçülüp aşağı iner.
      const cat = PAGE.kind === "category" ? 1 : 0;
      // theme.glideScale: şişenin boyu (kemersiz sahnede şişe daha büyük durabilir).
      const sc = base * (phone ? 1.5 : 1.8) * (THEME.glideScale ?? 1) * (1 - 0.12 * cat) * (1 - 0.3 * Math.min(ad, 1)) * vis;
      const cx = phone ? 0 : 2.55 * MathUtils.clamp(aspect / 1.9, 0.44, 1);
      return {
        x: cx + d * (phone ? 4.2 : 7.5),
        y: (phone ? 0.35 : -0.55) - 0.3 * cat - Math.min(ad, 1) * 0.35 + Math.sin(time * 0.7) * 0.04 * focus,
        z: -Math.min(ad, 1.5) * 3,
        rotX: 0.01,
        // Yerindeyken hafifçe sola dönük: fotoğraftaki yan panelin yanında 3B kalınlık da görünür.
        rotY: -d * 1.35 + 0.16 * focus + (focus > 0 ? Math.sin(time * 0.4) * 0.07 * focus : 0),
        rotZ: 0,
        scale: sc,
      };
    }
    if (RISE) {
      const ad2 = Math.min(ad, 1.5);
      // Komşu şişe yalnızca geçişte görünür; yerine oturunca ekran kenarında yarım şişe kalmaz.
      const vis = 1 - MathUtils.smoothstep(ad, 0.62, 0.9);
      const sc = base * (phone ? 1.85 : 2.55) * (1 - 0.22 * Math.min(ad, 1)) * vis;
      return {
        x: phone ? 0 : 2.75 * MathUtils.clamp(aspect / 1.9, 0.44, 1),
        y: (phone ? 0.55 : -0.28) - d * (phone ? 12.5 : 12) + Math.sin(time * 0.8) * 0.05 * focus,
        z: -ad2 * 2.2,
        rotX: 0.01,
        // Yerindeyken neredeyse tam karşıdan: etiket düz ve okunur.
        rotY: d * Math.PI + (focus > 0 ? Math.sin(time * 0.45) * 0.09 * focus : 0),
        rotZ: -0.08 * d,
        scale: sc,
      };
    }
    if (ORBIT) {
      // Döner vitrin: halka üzerinde açı; bütün ürünlerin ayağı platformun yüzeyinde.
      const a = (d / N) * Math.PI * 2;
      const R = orbitRadius(aspect);
      const sc = base * (phone ? 0.5 + 0.78 * focus : 0.5 + 0.95 * focus);
      return {
        x: orbitX(aspect) + R * Math.sin(a),
        y: orbitFloor(aspect) - (BOTTOM[i] ?? -1.9) * sc,
        z: R * (Math.cos(a) - 1) + focus * (phone ? 1.1 : 1.6),
        rotX: 0.02,
        rotY: -a * 0.55 + (focus > 0 ? Math.sin(time * 0.5) * 0.16 * focus : 0),
        rotZ: 0,
        scale: sc,
      };
    }
    const scale = base * (phone ? 0.62 + 0.72 * focus : 0.6 + 0.84 * focus) * (1 - (LINEAR ? MathUtils.smoothstep(ad, 3.4, 4.4) : MathUtils.smoothstep(ad, Math.min(3.6, N / 2 - 0.6), Math.min(4.6, N / 2))));
    // Sahne fotoğraflı üründe öndeki ürünün ayağı hep aynı çizgide (ilk ölçülen ürünün ayağı):
    // arka plandaki kaide hiç kıpırdamaz, farklı boydaki her ürün ona oturur.
    const lift = flavors[i]?.stage && FOOT.ref != null && BOTTOM[i] != null ? (FOOT.ref - BOTTOM[i]) * scale * focus : 0;
    return {
      x: phone ? 2.5 * d * (1 + 0.12 * ad) : (1.6 + 5.4 * d * (1 + 0.08 * ad)) * spread,
      y: 0.5 + (phone ? 0.1 : 0.12) * Math.min(ad, 3) + (phone ? 0.7 : 0.58) * focus + Math.sin(time * 0.9 + i * 1.7) * 0.07 * (flavors[i]?.stage ? 1 - focus : 1) - (phone ? 0 : CAT_DROP) + lift,
      z: (phone ? -2.4 : -2.6) * ad + focus * 1.6,
      rotX: 0.06,
      rotY: -0.3 * d + (focus > 0 ? Math.sin(time * 0.5) * 0.22 * focus : 0),
      rotZ: 0.06 * d + 0.05 * focus,
      scale,
    };
  }
  return {
    x: 4.8 * d * (1 + 0.08 * ad) * spread,
    // Öndeki kutu yukarıda durur; altındaki başlık için yer kalır.
    y: 0.6 - 0.22 * Math.min(ad, 3) + 0.85 * focus + Math.sin(time * 0.9 + i * 1.7) * 0.07,
    z: -0.8 * d * d + focus * 1.2,
    rotX: 0.08,
    rotY: -0.22 * d + (focus > 0 ? Math.sin(time * 0.6) * 0.18 * focus : 0),
    rotZ: 0.1 * d + 0.12 * focus,
    scale: base * (1 + 0.36 * focus) * (1 - (LINEAR ? MathUtils.smoothstep(ad, 3.4, 4.4) : MathUtils.smoothstep(ad, Math.min(3.6, N / 2 - 0.6), Math.min(4.6, N / 2)))),
  };
}

// Ürünün yerel alt ve üst kenarı (ürün grubu biriminde). Kenar düzlemleri (fin) fotoğrafın boş alanını da
// kapsar; yalnızca gövde parçaları ölçülür. Şişe (flask) biçiminde gövde ayrı bir hacim; kapak tornası
// fotoğrafın tüm boyunu kaplar ama gövdenin altında görünmez. Gövde varsa yalnızca o ölçülür; yoksa
// eksendeki boş satırlar ve kenar düzlemleri dışarıda bırakılır. Kaide (noMeasure) ölçülmez.
function measure(g, i) {
  let low = Infinity;
  let high = -Infinity;
  g.updateWorldMatrix(true, true);
  const meshes = [];
  g.traverse((o) => o.isMesh && o.geometry.type !== "PlaneGeometry" && !o.userData.noMeasure && meshes.push(o));
  const bodies = meshes.filter((o) => o.geometry.type === "ExtrudeGeometry");
  for (const o of bodies.length ? bodies : meshes) {
    const P = o.geometry.attributes.position;
    for (let k = 0; k < P.count; k += 3) {
      if (P.getX(k) ** 2 + P.getZ(k) ** 2 < 1e-6) continue;
      low = Math.min(low, V.fromBufferAttribute(P, k).applyMatrix4(o.matrixWorld).y);
    }
  }
  let half = 0;
  for (const o of meshes) {
    const P = o.geometry.attributes.position;
    for (let k = 0; k < P.count; k += 3) {
      V.fromBufferAttribute(P, k).applyMatrix4(o.matrixWorld);
      high = Math.max(high, V.y);
      half = Math.max(half, Math.abs(V.x - g.position.x));
    }
  }
  if (half > 0) HALF[i] = half / g.scale.x;
  if (low < Infinity) BOTTOM[i] = (low - g.position.y) / g.scale.y;
  if (FOOT.ref == null && BOTTOM[i] != null && flavors[i]?.stage) FOOT.ref = BOTTOM[i];
  if (high > -Infinity) TOP[i] = (high - g.position.y) / g.scale.y;
}

// Butik kaidesi (DOLLY): cilalı siyah silindir, üst kenarda altın halka, altta ince altın çizgi. Ürün
// grubunun biriminde; üst yüzü ürünün ayağında.
// Premium kaide (ferah sahnede varsayılan; theme.plinthStyle "classic" eskisi): iki katlı.
const PREMIUM = !!THEME.fresh && THEME.plinthStyle !== "classic";
export const PLINTH_H = PREMIUM ? 0.265 : 0.26;
const PLINTH_GOLD = new MeshStandardMaterial({ color: THEME.accent ?? "#d4b06a", metalness: 1, roughness: 0.22, envMapIntensity: 1.6 });
// theme.plinthColor: ferah sahnede açık renkli (ör. fildişi) cilalı kaide.
const PLINTH_BODY = THEME.plinthColor
  ? new MeshStandardMaterial({ color: THEME.plinthColor, roughness: 0.35, metalness: 0, envMapIntensity: 0.5 })
  : new MeshStandardMaterial({ color: "#050404", roughness: 0.9, metalness: 0, envMapIntensity: 0.05 });
// Kaidenin altında yumuşak temas gölgesi (fotoğraflı zeminde kaide havada durmasın).
const SHADOW_TEX = (() => {
  if (typeof document === "undefined") return null;
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d");
  const r = g.createRadialGradient(64, 64, 10, 64, 64, 64);
  r.addColorStop(0, "rgba(0,0,0,0.85)");
  r.addColorStop(0.55, "rgba(0,0,0,0.45)");
  r.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = r;
  g.fillRect(0, 0, 128, 128);
  return new CanvasTexture(c);
})();

function Plinth({ refFn }) {
  // Her kaidenin kendi malzemesi: uzaktaki ürünle birlikte kaidesi de soluklaşır (userData.mats; oran
  // userData.base). Fotoğraflı butikte (theme.plate) altında temas gölgesi ve zeminde soluk yansıması.
  const mats = useMemo(() => {
    const body = PLINTH_BODY.clone();
    const gold = PLINTH_GOLD.clone();
    const rBody = PLINTH_BODY.clone();
    const rGold = PLINTH_GOLD.clone();
    const shadow = new MeshBasicMaterial({ map: SHADOW_TEX, transparent: true, depthWrite: false, color: "#000000" });
    for (const m of [body, gold, rBody, rGold, shadow]) m.transparent = true;
    for (const m of [rBody, rGold]) m.side = DoubleSide;
    body.userData.base = 1;
    gold.userData.base = 1;
    rBody.userData.base = 0.35;
    rGold.userData.base = 0.3;
    shadow.userData.base = 0.9;
    return { body, gold, rBody, rGold, shadow, list: [body, gold, rBody, rGold, shadow] };
  }, []);
  const H = PLINTH_H;
  const plate = !!THEME.plate || !!THEME.fresh;
  return (
    <group ref={refFn} visible={false} userData={{ mats: mats.list }}>
      <mesh material={mats.body} position={[0, -H / 2, 0]} userData={{ noMeasure: true }}>
        <cylinderGeometry args={[1.18, 1.22, H, 96]} />
      </mesh>
      <mesh material={mats.gold} rotation={[Math.PI / 2, 0, 0]} position={[0, -0.004, 0]} userData={{ noMeasure: true }}>
        <torusGeometry args={[1.185, 0.014, 12, 128]} />
      </mesh>
      <mesh material={mats.gold} rotation={[Math.PI / 2, 0, 0]} position={[0, -H + 0.02, 0]} userData={{ noMeasure: true }}>
        <torusGeometry args={[1.222, 0.006, 8, 128]} />
      </mesh>
      {plate && (
        <>
          <mesh material={mats.shadow} rotation={[-Math.PI / 2, 0, 0]} position={[0, -H + 0.004, 0]} userData={{ noMeasure: true }}>
            <planeGeometry args={[3.6, 3.6]} />
          </mesh>
          {/* Zemindeki yansıma: kaidenin zemin düzlemine göre aynası */}
          <group position={[0, -2 * H, 0]} scale={[1, -1, 1]}>
            <mesh material={mats.rBody} position={[0, -H / 2, 0]} userData={{ noMeasure: true }}>
              <cylinderGeometry args={[1.18, 1.22, H, 96]} />
            </mesh>
            <mesh material={mats.rGold} rotation={[Math.PI / 2, 0, 0]} position={[0, -0.004, 0]} userData={{ noMeasure: true }}>
              <torusGeometry args={[1.185, 0.014, 12, 128]} />
            </mesh>
          </group>
        </>
      )}
    </group>
  );
}

// ---------------------------------------------------------------- Premium kaide ve tepe ışığı
// Üstte damarlı, cilalı fildişi mermer disk; altında fırçalanmış altın bant ve bandın altından sızan sıcak
// gömme ışık çizgisi; altta daha geniş koyu lake taban, üzerinde ince altın kakma. Tepeden inen ışık huzmesi
// (yalnızca iç arka yüzü çizilir: şişenin arkasında kalır, önünü puslandırmaz) ve kaidenin üstünde ışık havuzu.
const MARBLE_TEX = (() => {
  if (typeof document === "undefined") return null;
  const c = document.createElement("canvas");
  c.width = c.height = 512;
  const g = c.getContext("2d");
  g.fillStyle = "#ffffff";
  g.fillRect(0, 0, 512, 512);
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  g.filter = "blur(1.2px)";
  for (let k = 0; k < 26; k++) {
    let x = rnd() * 512, y = rnd() * 512, a = rnd() * Math.PI * 2;
    g.strokeStyle = `rgba(120,108,96,${0.05 + rnd() * 0.12})`;
    g.lineWidth = 0.6 + rnd() * 2.2;
    g.beginPath();
    g.moveTo(x, y);
    for (let i = 0; i < 40; i++) {
      a += (rnd() - 0.5) * 0.6;
      x += Math.cos(a) * 9;
      y += Math.sin(a) * 9;
      g.lineTo(x, y);
    }
    g.stroke();
  }
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  t.anisotropy = 4;
  return t;
})();
const POOL_TEX = (() => {
  if (typeof document === "undefined") return null;
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const g = c.getContext("2d");
  const r = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  r.addColorStop(0, "rgba(255,246,228,1)");
  r.addColorStop(0.45, "rgba(255,240,215,0.5)");
  r.addColorStop(1, "rgba(255,236,210,0)");
  g.fillStyle = r;
  g.fillRect(0, 0, 256, 256);
  return new CanvasTexture(c);
})();
const beamMaterial = () =>
  new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    side: BackSide,
    uniforms: { u_op: { value: 0 }, u_color: { value: new Color(1, 0.95, 0.86) }, u_time: { value: 0 } },
    vertexShader: /* glsl */ `
      varying float vY; varying vec3 vN; varying vec3 vV; varying vec2 vUv;
      void main() {
        vY = uv.y; vUv = uv;
        vec4 mv = modelViewMatrix * vec4(position, 1.);
        vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform float u_op; uniform vec3 u_color; uniform float u_time;
      varying float vY; varying vec3 vN; varying vec3 vV; varying vec2 vUv;
      void main() {
        float edge = 1. - abs(dot(vN, vV));
        float a = u_op * smoothstep(0., 0.12, vY) * (1. - smoothstep(0.55, 1., vY)) * (0.25 + 0.75 * pow(edge, 1.6));
        // İnce, yavaş kayan toz şeritleri
        a *= 0.85 + 0.15 * sin(vUv.x * 40. + u_time * 0.6 + vY * 6.);
        gl_FragColor = vec4(u_color * a, a);
      }`,
  });

function PremiumTiers({ m }) {
  // Kalın mermer disk (üst ve alt kenarında altın çizgi), altında içeri çekik koyu bir boşluk ve oradan
  // sızan sıcak ışık (mermer havada asılı gibi), en altta ince koyu lake ayak.
  return (
    <>
      <mesh material={m.top} position={[0, -0.085, 0]} userData={{ noMeasure: true }}>
        <cylinderGeometry args={[1.14, 1.14, 0.17, 128]} />
      </mesh>
      <mesh material={m.gold} rotation={[Math.PI / 2, 0, 0]} position={[0, -0.003, 0]} userData={{ noMeasure: true }}>
        <torusGeometry args={[1.14, 0.011, 12, 160]} />
      </mesh>
      <mesh material={m.gold} rotation={[Math.PI / 2, 0, 0]} position={[0, -0.168, 0]} userData={{ noMeasure: true }}>
        <torusGeometry args={[1.14, 0.009, 12, 160]} />
      </mesh>
      <mesh material={m.base} position={[0, -0.205, 0]} userData={{ noMeasure: true }}>
        <cylinderGeometry args={[0.98, 0.98, 0.07, 96]} />
      </mesh>
      <mesh material={m.glow} rotation={[Math.PI / 2, 0, 0]} position={[0, -0.185, 0]} userData={{ noMeasure: true }}>
        <torusGeometry args={[0.99, 0.018, 10, 160]} />
      </mesh>
      <mesh material={m.base} position={[0, -0.2475, 0]} userData={{ noMeasure: true }}>
        <cylinderGeometry args={[1.2, 1.22, 0.035, 128]} />
      </mesh>
      <mesh material={m.gold} rotation={[Math.PI / 2, 0, 0]} position={[0, -0.23, 0]} userData={{ noMeasure: true }}>
        <torusGeometry args={[1.2, 0.005, 8, 160]} />
      </mesh>
    </>
  );
}

function PremiumPlinth({ refFn }) {
  const mats = useMemo(() => {
    const top = new MeshPhysicalMaterial({ color: THEME.plinthColor ?? "#f3ede4", map: MARBLE_TEX, roughness: 0.2, clearcoat: 1, clearcoatRoughness: 0.08, envMapIntensity: 0.7 });
    const gold = new MeshStandardMaterial({ color: THEME.accent ?? "#d4b06a", metalness: 1, roughness: 0.3, envMapIntensity: 1.5 });
    const glow = new MeshBasicMaterial({ color: new Color(1, 0.86, 0.62), blending: AdditiveBlending, depthWrite: false, toneMapped: false });
    const base = new MeshPhysicalMaterial({ color: "#16110d", roughness: 0.28, clearcoat: 1, clearcoatRoughness: 0.12, envMapIntensity: 0.9 });
    const refl = { top: top.clone(), gold: gold.clone(), glow: glow.clone(), base: base.clone() };
    const shadow = new MeshBasicMaterial({ map: SHADOW_TEX, transparent: true, depthWrite: false, color: "#000000" });
    const pool = new MeshBasicMaterial({ map: POOL_TEX, transparent: true, depthWrite: false, blending: AdditiveBlending, toneMapped: false });
    const list = [top, gold, glow, base, ...Object.values(refl), shadow, pool];
    for (const x of list) x.transparent = true;
    for (const x of Object.values(refl)) x.side = DoubleSide;
    [top, gold, glow, base].forEach((x) => (x.userData.base = 1));
    Object.values(refl).forEach((x) => (x.userData.base = 0.3));
    shadow.userData.base = 0.9;
    pool.userData.base = 0.32;
    return { main: { top, gold, glow, base }, refl, shadow, pool, list };
  }, []);
  const beam = useMemo(beamMaterial, []);
  useFrame(({ clock }) => {
    const st = useStore.getState();
    const f = flavors[st.active];
    const o = mats.main.top.opacity;
    beam.uniforms.u_time.value = clock.getElapsedTime();
    beam.uniforms.u_op.value = MathUtils.damp(beam.uniforms.u_op.value, o * (st.detail ? 0.25 : 1) * 0.32, 3, 1 / 60);
    if (f) beam.uniforms.u_color.value.set(f.theme.drop ?? "#fff4e0").lerp(WHITE, 0.55);
    if (f) mats.main.glow.color.set(f.theme.drop ?? "#ffd9a0").lerp(WHITE, 0.35);
  });
  const H = PLINTH_H;
  return (
    <group ref={refFn} visible={false} userData={{ mats: mats.list }}>
      <PremiumTiers m={mats.main} />
      <mesh material={mats.pool} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.003, 0]} userData={{ noMeasure: true }}>
        <planeGeometry args={[2.3, 2.3]} />
      </mesh>
      <mesh material={beam} position={[0, 4.2, 0]} userData={{ noMeasure: true }} renderOrder={2}>
        <cylinderGeometry args={[0.32, 1.2, 8.4, 64, 1, true]} />
      </mesh>
      <mesh material={mats.shadow} rotation={[-Math.PI / 2, 0, 0]} position={[0, -H + 0.004, 0]} userData={{ noMeasure: true }}>
        <planeGeometry args={[3.8, 3.8]} />
      </mesh>
      <group position={[0, -2 * H, 0]} scale={[1, -1, 1]}>
        <PremiumTiers m={mats.refl} />
      </group>
    </group>
  );
}

// Butik sırasında kaidelerin üst yüzü (dünya y) ve öndeki ürünün ölçeği.
export const dollyTop = (aspect) => (aspect < 0.9 ? -1.35 : -3.4);
export const dollyScale = (aspect) => (aspect < 0.9 ? 0.78 * 1.45 : 2.15 * MathUtils.clamp(aspect / 2.3, 0.88, 1));

export default function Carousel() {
  const canBody = useCanBody();
  const size = useThree((s) => s.size);
  const gl = useThree((s) => s.gl);
  const openDetail = useStore((s) => s.openDetail);

  const bodies = useMemo(
    () => flavors.map((f) => createCanMaterial(canBody, createCanUniforms(f))),
    [canBody]
  );
  // Her kutunun kendi alüminyumu var; detay açılınca tek tek karartılır.
  const parts = useMemo(() => flavors.map((f) => createBottleParts(f)), []);
  // Ayna suda (LAKE) şişenin su çizgisinin altı kesilir.
  useMemo(() => {
    if (!LAKE) return;
    bodies.forEach((b, i) => {
      for (const m of [b, ...Object.values(parts[i])]) if (m?.isMaterial) m.clippingPlanes = [WATER_CLIP];
    });
  }, [bodies, parts]);

  // Bu bileşen render edildiyse model ve doku yüklenmiştir.
  useEffect(() => useStore.getState().setSceneReady(), []);

  const groups = useRef([]);
  const shadows = useRef([]);
  const plinth = useRef();
  const spot = useRef();
  const rimColor = useMemo(() => new Color(), []);
  const local = useRef({
    p: scrollState.p,
    detail: 0,
    lean: 0,
    hovered: -1,
    hover: flavors.map(() => 0),
    now: 0,
    flights: {}, // tat → { kind: "in" | "out", t0, from }
    last: flavors.map(() => null), // her kutunun son pozu (uçuş başlangıcı için)
  });

  // Ortaya oturan kutunun yüzeyinden açık renkli, gürültülü bir ışık geçer.
  const sweep = (i) => {
    const u = bodies[i].userData.uniforms;
    const f = flavors[i];
    setCanFlavor(u, f);
    u.u_color1.value.setScalar(1.8);
    animate(0.5, 1, {
      duration: 1.2,
      ease: easeQuadOut,
      onUpdate: (v) => (u.u_progress.value = v),
      onComplete: () => setCanFlavor(u, f),
    });
  };

  useFrame(({ clock }, delta) => {
    const dt = Math.min(delta, 0.1);
    const t = clock.getElapsedTime();
    const s = local.current;
    const { detail, active, loaded, order } = useStore.getState();
    s.now = t;
    const slotOf = [];
    order.forEach((flavor, slot) => (slotOf[flavor] = slot));

    // ?shot: açılış animasyonu atlanır (yavaş test tarayıcısında ekran görüntüsü için).
    // Sinematik açılışta (Preloader → introAt) şişeler perde açılırken iner; inişte ışık ve duman.
    if (loaded && performance.now() >= (sceneState.introAt ?? 0)) {
      const was = sceneState.intro;
      sceneState.intro = SHOT ? 1 : Math.min(1, sceneState.intro + dt / (sceneState.introAt ? 1.6 : 2.6));
      if (sceneState.introAt && was < 0.56 && sceneState.intro >= 0.56) {
        sceneState.landAt = t;
        sceneState.swapAt = t - 0.5 * SLOWMO;
      }
    }
    s.p = MathUtils.damp(s.p, scrollState.p, 6, dt);
    s.detail = MathUtils.damp(s.detail, detail ? 1 : 0, 4, dt);
    // Hızlı kaydırınca kutular hafifçe yatar.
    s.lean = MathUtils.damp(s.lean, MathUtils.clamp(scrollState.velocity * 0.012, -0.35, 0.35), 5, dt);

    // Sonraki bölüme geçerken kutular kenarlara dağılır; detay açılınca ise
    // karanlığa doğru sönerek küçülür ve kenarlara çekilir.
    const spread = scrollState.ritualIn;
    const fade = s.detail;
    sceneState.spread = Math.max(spread, fade);
    const aspect = size.width / size.height;
    // Butik zemini (Boutique) kaidelerin altında.
    if (DOLLY) {
      sceneState.floorY = dollyTop(aspect) - PLINTH_H * dollyScale(aspect);
      sceneState.plinthTop = dollyTop(aspect);
    }
    const nearest = order[slotIndex(s.p)];
    sceneState.ringAngle = (s.p / N) * Math.PI * 2;
    sceneState.settled = !detail && spread < 0.02 && Math.abs(s.p - Math.round(s.p)) < 0.01;
    sceneState.hoverFocus = s.hovered === nearest && !detail && spread < 0.1 && Math.abs(s.p - Math.round(s.p)) < 0.1;

    // Kenar parıltısı ve spot ışık tadın rengini alır.
    if (STUDIO) rimColor.set(flavors[active].theme.accent).lerp(WHITE, 0.15).multiplyScalar(1.15);
    else rimColor.set(flavors[active].theme.glow).lerp(WHITE, 0.25).multiplyScalar(0.55);
    const L = spot.current;
    if (L) {
      const fp = sceneState.focus.position;
      // Sahne fotoğraflı üründe ışık tepeden, huzmeyle aynı yönden ve biraz daha güçlü vurur.
      const staged = flavors[active].stage ? 1 : 0;
      L.intensity = 7 * (MOBILE ? 0.55 : 1) * (content.glass ? 0.45 : 1) * (1 - 0.4 * staged) * lightOf(flavors[active]) * (1 - fade) * (1 - spread) * sceneState.intro;
      L.color.set(STUDIO ? flavors[active].theme.accent : flavors[active].theme.glow).lerp(WHITE, STUDIO ? 0.5 : 0.65);
      // Gece stüdyosunda tepe ışığı nötr-sıcak (ürünü boyamaz) ve dar: zemini değil şişeyi aydınlatır.
      const cr = sceneState.studio ?? 0;
      if (cr > 0) {
        L.color.lerp(KEY_WARM, cr);
        L.intensity *= 1 - 0.45 * cr;
      }
      L.angle = 0.42 - 0.1 * cr;
      if (staged) L.position.set(fp.x - 0.4, fp.y + 9.5, fp.z + 3.2);
      else L.position.set(fp.x - 1.2, fp.y + 7.5, fp.z + 7);
      L.target.position.set(fp.x, fp.y + 0.2, fp.z);
      L.target.updateMatrixWorld();
    }

    // Ortadaki sabit kaide: kaydırmada yerinden oynamaz; Ritüel'e geçerken ve detayda karanlığa söner.
    const pl = plinth.current;
    if (pl) {
      const a = Math.min(1, sceneState.intro * 1.3) * (1 - spread) * (1 - MathUtils.smoothstep(fade, 0, 0.5));
      pl.position.set(0, dollyTop(aspect) - 2 * spread - 0.4 * fade, 0);
      pl.scale.setScalar(dollyScale(aspect) * (1 - 0.5 * spread));
      pl.visible = a > 0.01;
      for (const m of pl.userData.mats) m.opacity = a * m.userData.base;
    }

    groups.current.forEach((g, i) => {
      if (!g) return;
      // Ölçü (ayak, tepe, genişlik) her ürün için baştan alınır; ekranda hiç görünmemiş ürün de (sayfa doğrudan
      // nota piramidine ya da koku bulucuya atlanınca) yuvasına doğru boyda oturur. Gizli ürünün ölçeği 0
      // olabildiği için ölçerken geçici olarak 1 yapılır.
      if (BOTTOM[i] == null && fade < 0.001 && spread < 0.001) {
        const s0 = g.scale.x;
        g.scale.setScalar(1);
        measure(g, i);
        g.scale.setScalar(s0);
      }
      let d = slotOf[i] - s.p;
      if (!LINEAR) {
        d = ((d % N) + N) % N;
        if (d >= N / 2) d -= N;
      }
      let pose = arcPose(d, aspect, t, i);

      // Yer değiştirme uçuşu: gelen kutu öne doğru kavis çizip dönerek
      // ortaya gelir, giden kutu arkadan dolaşıp boşalan slota gider.
      const flight = s.flights[i];
      if (flight) {
        const k = Math.min(1, (t - flight.t0) / FLIGHT);
        const e = easeInOut(k);
        const arc = Math.sin(Math.PI * k);
        const out = {};
        for (const key of KEYS) out[key] = MathUtils.lerp(flight.from[key], pose[key], e);
        out.alpha = pose.alpha;
        out.up = MathUtils.lerp(flight.from.up ?? 0, pose.up ?? 0, e);
        if (DOLLY) {
          // Butikte (videodaki gibi): gelen şişe büyüyerek öne doğru geniş bir kavis çizer, kendi etrafında
          // bir tur döner ve hafif yatarak kaideye konar; giden şişe küçülüp geriye, boşalan yana çekilir.
          const sc = dollyScale(aspect);
          if (flight.kind === "in") {
            out.z += 4.2 * arc;
            out.y += 0.25 * sc * arc;
            out.rotY += Math.PI * 2 * easeInOut(Math.min(1, k * 1.08));
            out.rotZ += 0.32 * arc;
            out.rotX += 0.12 * arc;
            out.scale *= 1 + 0.12 * arc;
          } else {
            out.z -= 3 * arc;
            out.y += 0.2 * sc * arc;
            out.rotY -= Math.PI * e;
            out.rotZ -= 0.22 * arc;
            out.scale *= 1 - 0.18 * arc;
          }
        } else if (flight.kind === "in") {
          out.z += 3.2 * arc;
          out.y += 0.9 * arc;
          out.rotY += Math.PI * 2 * e;
          out.rotZ += 0.45 * arc;
          out.scale *= 1 + 0.2 * arc;
        } else {
          out.z -= 2.6 * arc;
          out.y -= 0.5 * arc;
          out.rotY -= Math.PI * 2 * e;
          out.rotZ -= 0.3 * arc;
          out.scale *= 1 - 0.12 * arc;
        }
        pose = out;
        if (k >= 1) {
          delete s.flights[i];
          if (flight.kind === "in") {
            sweep(i);
            // Kaideye iniş: arka planda kısa bir ışık patlaması (Background → landAt).
            sceneState.landAt = t;
          }
        }
      }
      s.last[i] = pose;
      const intro = easeOut(MathUtils.clamp(sceneState.intro * 1.8 - Math.abs(d) * 0.16, 0, 1));
      s.hover[i] = MathUtils.damp(s.hover[i], s.hovered === i && !detail ? 1 : 0, 8, dt);
      const lift = s.hover[i];

      g.position.set(
        pose.x * (1 + 2.2 * spread + 0.9 * fade),
        pose.y - 2 * spread + (1 - intro) * (sceneState.introAt ? 7 : -9) + lift * 0.25 - 0.4 * fade,
        pose.z - (1 - intro) * 4 - 1.5 * fade
      );
      // Butik sırasında ürünler kaidede durur: kaydırırken yatmaz.
      g.rotation.set(pose.rotX, pose.rotY + (1 - intro) * 2.5, pose.rotZ + (DOLLY || LAKE ? 0 : s.lean) * (1 - Math.min(Math.abs(d), 4) * 0.15));
      // Detay açılınca yan ürünler kararırken küçülüp kenarlara çekilir: metnin arkasında siyah leke kalmaz.
      g.scale.setScalar(pose.scale * (1 - 0.5 * spread) * (SOLO ? 1 - MathUtils.smoothstep(fade, 0, 0.6) : 1 - 0.7 * fade) * (1 + lift * 0.06));
      // Vitrin ışığı: öndeki kutu tam aydınlık, yanlar kademeli olarak kararır.
      // Tek ürün sahnesinde ışık öndekine düşer: yanlar loşta kalır ama renkli kenar ışığıyla
      // biçimleri ve etiketleri hafifçe seçilir.
      const lit = DOLLY
        ? (PREMIUM ? 0.4 : 0.5) + (PREMIUM ? 0.6 : 0.5) * Math.max(0, 1 - Math.abs(d))
        : SOLO
        ? 0.16 + 0.84 * Math.pow(Math.max(0, 1 - Math.abs(d)), 1.4)
        : 0.14 + 0.86 * Math.pow(Math.max(0, 1 - Math.min(Math.abs(d), 1.6) / 1.6), 1.6);
      const dim = (1 - fade) * lit;
      bodies[i].userData.uniforms.u_rim.value.copy(rimColor).multiplyScalar(SOLO ? (1 - fade) * (0.5 + 0.5 * lit * lit) * (flavors[i]?.stage ? 0.55 : 1) : dim * (0.35 + 0.65 * lit));
      // Gece stüdyosu: stüdyo ortam yansıması, altın bölgeler metal, renkli kenar parıltısı ve
      // ışıktan bağımsız (unlit) pay kısılır: şişe kendinden parlayan kırmızı plastik gibi görünmez.
      const sw = LAKE ? sceneState.studio ?? 0 : 0;
      if (LAKE) {
        const B = bodies[i];
        if (!B.userData.studio) {
          B.userData.studio = true;
          B.userData.unlit0 = B.userData.uniforms.u_unlit.value;
          const env = studioEnv(gl);
          for (const m of [B, ...Object.values(parts[i])]) {
            if (!m?.isMaterial) continue;
            m.envMap = env;
            m.needsUpdate = true;
          }
        }
        B.userData.uniforms.u_rim.value.multiplyScalar(1 - 0.8 * sw);
        B.userData.uniforms.u_unlit.value = B.userData.unlit0 * (1 - 0.65 * sw);
        B.userData.uniforms.u_gold.value = sw;
      }
      // Gece stüdyosunda genel parlaklık biraz kısık ki renkli cam patlamasın.
      bodies[i].userData.uniforms.u_dim.value = dim * (1 - 0.12 * sw);
      // Tepe ışığı yalnızca odaktaki (ortadaki) üründe.
      // Gece stüdyosunda fotoğrafçı ışığı: üstte (kapak, omuz) aydınlık, alta doğru camda koyulaşan düşüş.
      bodies[i].userData.uniforms.u_key.value = Math.max(PREMIUM ? Math.pow(Math.max(0, 1 - Math.abs(d)), 2) * (1 - fade) * (1 - spread) * Math.min(1, sceneState.intro * 1.4) : 0, 0.9 * sw);
      if (STUDIO) {
        const U = bodies[i].userData.uniforms;
        U.u_time.value = t;
        // Saydam camlı markada süpürme çok hafif: etiket beyazlamasın.
        U.u_sweep.value = dim * lit * lit * (content.glass ? 0.15 : 0.6) * (1 - 0.45 * sw);
        U.u_sweepColor.value.set(flavors[i].theme.accent).lerp(WHITE, 0.55);
      }
      const F = bodies[i].userData.finish;
      // Sahne fotoğraflı üründe yansıma biraz kısık: beyaz şişe parlamadan net görünür.
      bodies[i].envMapIntensity = F.envMapIntensity * 1.23 * dim * (flavors[i]?.stage ? 0.8 : 1) * (1 + 0.8 * sw);
      bodies[i].clearcoat = Math.max(F.clearcoat * dim, 0.01); // 0 olursa shader yeniden derlenir
      dimBottleParts(parts[i], dim, pose.alpha ?? 1);
      // Saydam camlı ürünlerde (content.glass) geçişte şişe karanlıkta çözülür.
      if (bodies[i].transparent) bodies[i].opacity = pose.alpha ?? 1;

      // Butik sırasında (DOLLY) her ürün kendi kaidesinde: ayağı ölçülür, kaide ayağın altına oturur.
      if (DOLLY) {
        if (BOTTOM[i] == null && pose.scale > 0.01 && fade < 0.001 && spread < 0.001) measure(g, i);
        // Ayağın altında yumuşak temas gölgesi: zemindeki komşularda koyu, kaidedeki üründe hafif.
        const sh = shadows.current[i];
        if (sh) {
          sh.position.y = (BOTTOM[i] ?? -1.8) + 0.004;
          const a = (pose.alpha ?? 1) * (0.3 + 0.6 * (1 - (pose.up ?? 0))) * (1 - fade);
          sh.visible = BOTTOM[i] != null && a > 0.01;
          sh.material.opacity = a;
        }
      }

      // Büyük kutu buradan (dağılmadan önceki pozdan) devralır.
      if (i === nearest) {
        sceneState.focus.position.set(pose.x, pose.y + (1 - intro) * (sceneState.introAt ? 7 : -9), pose.z - (1 - intro) * 4);
        sceneState.focus.rest.set(pose.x, pose.y, pose.z);
        sceneState.focus.rotation.copy(g.rotation);
        sceneState.focus.scale = pose.scale;
        if (BOTTOM[i] == null && fade < 0.001 && spread < 0.001) measure(g, i);
        sceneState.focus.bottom = BOTTOM[i];
        sceneState.focus.top = TOP[i];
        sceneState.focus.half = HALF[i];
      }

      const hidden = sceneState.heroVisible && i === active;
      g.visible = pose.scale > 0.001 && !hidden && spread < 0.9 && fade < 0.97;
    });
  });

  // Öndeki kutuya tıklamak detayı açar. Yandaki bir kutuya tıklamak onu
  // ortadaki kutuyla yer değiştirir (videodaki gibi); diğerleri yerinde kalır.
  const onClick = (i) => (e) => {
    e.stopPropagation();
    const st = useStore.getState();
    if (st.detail || !st.loaded || st.swapping || scrollState.ritualIn > 0.05) return;
    if (i === st.active) {
      openDetail();
      return;
    }
    // Butikte yalnızca iki yandaki komşuya tıklanır (uzaktakiler karanlıkta); onlar uçarak ortaya gelir.
    // Carousel iki tat arasındayken yer değiştirme yapılmaz.
    if (Math.abs(scrollState.p - Math.round(scrollState.p)) > 0.05) return;
    const l = local.current;
    const center = slotIndex(scrollState.p);
    const current = st.order[center];
    const from = st.order.indexOf(i);
    if (!l.last[i] || !l.last[current]) return;
    l.flights[i] = { kind: "in", t0: l.now, from: { ...l.last[i] } };
    l.flights[current] = { kind: "out", t0: l.now, from: { ...l.last[current] } };
    st.swapSlots(from, center);
    st.setActive(i);
    st.setSwapping(true);
    // Geçişte duman bulutu (Boutique).
    sceneState.swapAt = l.now;
    setTimeout(() => useStore.getState().setSwapping(false), FLIGHT * 850);
  };

  const hover = (i) => (e) => {
    e.stopPropagation();
    local.current.hovered = i;
    document.body.style.cursor = useStore.getState().detail ? "" : "pointer";
  };
  const unhover = (i) => () => {
    if (local.current.hovered === i) local.current.hovered = -1;
    document.body.style.cursor = "";
  };

  return (
    <>
      {/* Öndeki kutuya düşen vitrin ışığı; ışık sayısı sabit kalsın diye hep sahnede. */}
      <spotLight ref={spot} intensity={0} angle={0.42} penumbra={1} decay={0} />
      {/* Butikte tek kaide: ortada sabit; ürünler sırayla üstüne gelir. */}
      {DOLLY && (PREMIUM ? <PremiumPlinth refFn={(el) => (plinth.current = el)} /> : <Plinth refFn={(el) => (plinth.current = el)} />)}
      {flavors.map((f, i) => (
        <group
          key={f.name}
          ref={(el) => (groups.current[i] = el)}
          onClick={onClick(i)}
          onPointerOver={hover(i)}
          onPointerOut={unhover(i)}
        >
          <CanMesh body={bodies[i]} parts={parts[i]} flavor={i} />
          {DOLLY && (
            <mesh ref={(el) => (shadows.current[i] = el)} rotation={[-Math.PI / 2, 0, 0]} visible={false} userData={{ noMeasure: true }} renderOrder={-1}>
              <planeGeometry args={[2.3, 2.3]} />
              <meshBasicMaterial map={SHADOW_TEX} color="#000000" transparent depthWrite={false} />
            </mesh>
          )}
        </group>
      ))}
    </>
  );
}
