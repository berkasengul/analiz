// Garden Motors — dış cephe teması. Cephedeki bütün malzeme, ışık rengi, tabela, gökyüzü ve bloom değerleri buradan gelir.
// Sahne kodu malzeme üretmez; createFacadeMaterials() ile paylaşılan örnekleri alır. lil-gui ("Cephe") bu nesneyi değiştirir.
import * as THREE from 'three';

export const FACADE_THEME = {
  palette: {
    // antrasit mat kompozit panel: bant, çatı alnı, bütün kolonlar, saksılar, tabela zemini, harf yanları
    structure: { color: '#2a2c2e', metalness: .5, roughness: .55, texture: 'panel_metal', textureMeters: 2.0, normalScale: .22, envIntensity: .3, bakedEnvIntensity: .08 },
    // mat siyah alüminyum: doğramalar, profiller, kapı kasası, babalar, lambalar, tabela çerçevesi
    metal: { color: '#1a1b1c', metalness: .7, roughness: .45, envIntensity: .55 },
    // derz boşlukları (panel arası gölge)
    joint: { color: '#060708', roughness: .95 },
    wood: { source: 'MTG_wood_smoked_walnut_veneer' },   // mevcut tavan ahşabı: iç ve dış tavanlarda tek ahşap
    glass: { source: 'mevcut cam ayarları' },
    stone: { texture: 'stone', usage: 'yalnız yaya zemini (kaldırım, giriş eşiği)' },
    // Bilgin Kuyumculuk: harfler ve pırlantanın taç fasetleri şampanya altını, alt çizgi ve köşk fasetleri koyu altın
    // (anahtar adları Garden Motors'tan kaldı: white = birinci renk, green = ikinci renk)
    brand: { green: '#c99a3b', white: '#f3dd9e' },
  },
  lightTemp: 3000,   // K — bütün spot, LED ve vitrin ışıkları (cephe ışıklarının hepsi kelvinToColor'dan)
  whiteBalance: 6500,   // K — kamera beyaz dengesi. Referans: canlı sıcak turuncu ışık → düzeltme yok (3000 K ≈ #ffbd73). 4700 = nötr, taş gri kalır
  sign: {
    words: ['BİLGİN', 'KUYUMCULUK'],   // tabela yazısı (her kelimenin ilk harfi büyük, gerisi küçük büyük harf)
    width: 12.4, height: 1.56, boxDepth: .22,   // tabela kutusu: bant önüne 22 cm çıkar, bantdan 18 cm yüksek, önü aynı lamel
    capRatio: .45,          // büyük harf yüksekliği / panel yüksekliği
    depth: .04,             // kutu harf derinliği (m), pah yok
    standoff: .03,          // panel ile harf arası (m)
    faceEmissive: 1.05,     // harf yüzü: referanstaki gibi parlak beyaz, bloom eşiğini geçer
    greenEmissive: .55,     // alt çizgi + pırlantanın alt fasetleri: harflerden biraz sönük
    halo: .42,              // harf arkası hale opaklığı (lamellere vuran ışıma)
    iconScale: .5,          // logo simgesinin (pırlanta) yazıya göre ölçeği
  },
  // mimari derinlik (m). z: sokağa doğru +. Katmanlar önden arkaya: çatı plağı → kolonlar → üst kat bandı → doğrama → cam → giriş.
  depth: {
    glass: .20,            // vitrin camı düzlemi (Blender cephesi)
    column: .25,           // kolon ön yüzü camın bu kadar önünde (= cephe hattı)
    mullion: .05,          // doğrama profili camın önüne bu kadar çıkar
    band: .15,             // üst kat bandı alt kat camının bu kadar önünde (kolonların gerisinde kalır)
    bandShadow: .045,      // bandın alt kenarındaki gölge derzi yüksekliği
    portalRecess: .80,     // giriş camı yan vitrin camına göre bu kadar içeride
    roofOverhang: 1.5,     // çatı plağı cephe hattından bu kadar öne çıkar
    roofThick: .50,        // çatı plağı kalınlığı
    roofBottom: 8.48,      // çatı plağı alt kotu
    parapet: .60,          // parapet yüksekliği (plak üstünden)
    sideReturn: 3.6,       // bina uçlarında yan cephenin görünen derinliği
    neighbourWall: 26,     // komşu parsele uzanan koyu duvar / çit uzunluğu
    shadowMap: 2048, shadowNormalBias: .04, shadowBias: -.0002, keyLight: 1.3,
  },
  // dış kolonlar: createColumn() — A: monolit + LED girinti, B: dikey alüminyum lamel
  columns: {
    variant: 'A',
    plates: 3,             // yarı başına uzun plaka (yükseklik boyunca)
    joint: .004,           // plakalar arası yatay derz
    radius: .008,          // plaka köşe pahı
    roughness: .35, clearcoat: .4, clearcoatRoughness: .3,   // bantlardan bir tık rafine
    grooveW: .04, grooveD: .03,      // orta girinti
    led: 3.6,              // girinti dibindeki şerit (referans: zemin kat kolonlarında parlak dikey LED)
    grooveGlow: 1.2,       // girinti yan yüzeylerine düşen LED ışığı
    ledTop: 4.30,          // LED yalnız zemin katta (bant altına kadar), giriş kolonlarında
    faceGlow: .22,         // LED'in kolon ön yüzüne yaydığı sıcak ışıma (ortada parlak, kenarlara söner)
    baseUplight: 14,       // uç kolonlar: zeminden yukarı ışık (referanstaki gibi altta parlak)
    plinthH: .12, plinthInset: .02, plinthGap: .03,   // metal kaide + koyu gölge boşluğu
    topGap: .03,           // kolon üstü ile saçak arası gölge boşluğu
    uplight: 24, uplightAngle: .26, uplightPenumbra: .8, uplightOffset: .22,   // kolon ışığı şiddeti / açısı (gölgesiz)
    fixtures: [4.30, 8.30],   // referans: kolon yüzüne monte silindir armatür, aşağı bakan dar ışın (bant altı + saçak altı)
    fixtureZ: .14,          // armatür yüzden 10 cm dışarıda (kısa kol): ışın yüze armatürün ~40 cm altında değer, aşağı söner
    lamel: { thick: .015, depth: .04, gap: .06, core: '#151617' },
  },
  // üst kat bandı (tabelanın arkası): fırçalanmış koyu alüminyum kompozit, panel başına hafif ton farkı
  // style: 'stone' = kolonlardaki koyu damarlı taş (varsayılan, kanal sahibinin isteği) | 'louver' = siyah alüminyum lamel
  // stoneAlbedo: kolon taşıyla aynı koyu antrasit; stoneRoughMin: hafif cilalı; stonePlate/Joint: 240 cm plaka, 3 mm derz;
  // wash: üst başlığın altındaki gizli LED'den her plakaya aşağı yayılan sıcak ışık konisinin şiddeti (kolon spotlarının bantta karşılığı)
  band: { style: 'stone', stoneAlbedo: '#45423f', stoneRoughMin: .3, stonePlate: 2.4, stoneJoint: .003, wash: 1.6, texture: 'brushed_metal', textureMeters: 1.0, normalScale: .35, roughness: .42, metalness: .6, envIntensity: .35, toneJitter: .06,
    // referans: boydan boya siyah yatay alüminyum lamel. Bant kolonların önünden geçer, uç kolonlara dayanır.
    louver: { front: .10, pitch: .07, slatH: .05, slatD: .06, tilt: 12, color: '#141414', metalness: .6, roughness: .3, envIntensity: .2, normal: 0,
      x: 15.9, y0: 4.40, y1: 5.60, led: 1.6 } },
  // üst kat iç duvarı: cilalı koyu mermer + ceviz lamel bölgeleri + her aracın arkasında arkadan aydınlatmalı niş
  upper: {
    stone: 'dark_stone', stoneMeters: 2.4, stoneTint: .62, stoneRough: .5, stoneNormal: .22,
    finW: .05, finD: .12, finPitch: .17,
    niches: [[-10.4, 6.4], [0, 6.4, 2.4], [10.4, 6.4]],   // [merkez x, genişlik, ek derinlik] — araçların arkası (orta: tabelanın üstündeki vitrin aracı)
    lightBox: 1.0,         // niş arka panelinin parlaklığı (referans: mermer arkadan parlak aydınlatmalı)
    wash: 1.3,             // lamel bölgesinde taş duvara düşen sıcak yıkama (ahşap lameller ışıl ışıl)
    ceilLED: 3.0,          // üst kat tavanında boydan boya iki çizgi LED
  },
  // vitrin araçları: tavan spotu + üst ışık + kaide altında yüzen ışık
  display: { spot: 48, spotAngle: .5, spotPenumbra: .65, topLight: 4.2, groundTopLight: 3.2, trim: .75, floorGlow: .45 },
  // dış duvarlar (kolon, yan duvar, parapet, bina uçları; tabela yanındaki kompozit bant HARİÇ): taranmış PBR, dünya koordinatlı
  walls: {
    material: 'stone',                 // 'stone' | 'concrete'
    // albedo: dokunun ortalama rengi bu tona çekilir (kanal başına çarpan = hedef / avg). avg: doku renginin doğrusal ortalaması.
    // aspect: doku piksel en/boyu (2048×1024 → 2), dünya ölçeği iki eksende de doğru kalsın diye
    albedo: '#3d3c3a',                 // referans: koyu antrasit damarlı taş (kolon + çatı alnı); ışık huzmesinde griye açılır
    stone: { texture: 'wall_stone', worldSize: 2.0, aspect: 2, avg: [.160, .142, .1057], roughMul: .8 },        // ambientCG Rock041
    concrete: { texture: 'wall_concrete', worldSize: 2.4, aspect: 1, avg: [.1397, .1291, .1195], roughMul: .8 }, // ambientCG Concrete029
    normalScale: 1.5, antiTile: .3, roughMin: .45,   // honlanmış taş: parlak noktalar titreşmesin    // ikinci (döndürülmüş, düşük frekanslı) örnekleme oranı
    plateW: 1.2, plateH: 3.0, joint: .005,
    variation: 1.0, tint: .06, roughVar: .035,    // plaka başına ton ±%7, pürüzlülük ±.08: yakından plakalar ayrışır
    grime: { texture: 'grime_mask', opacity: .4, height: .7, width: 2.0 },                  // ambientCG Leaking005 (Opacity)
    base: { height: .25, dark: .35 },
    uplight: { intensity: 2.2, angle: .3, penumbra: .8, offset: .22 },
  },
  // yaya zemini (giriş önü kaldırım): duvar taşı, dünya ızgarasına oturan 60 × 60 cm karolar, ince derz. Pişmiş ışık haritası korunur.
  // referans: açık-orta gri, 120 × 60 cm büyük ıslak karolar (60 cm sokağa doğru)
  paving: { texture: 'wall_stone', worldSize: 0.9, tint: .035, tile: [1.2, .6], joint: .003, jointDark: .55, albedo: '#7a766f', albedoDark: '#4a4743', normalScale: .8, gain: 2.3 },
  soffit: { led: 5.0, glow: 1.0, glowDepth: 1.6 },   // saçak ön kenarı: parlak sürekli LED + ahşaba yayılan ışık
  // ıslak zemin (referans: yağmur sonrası gece): yol + kaldırım yansıması, birikinti, koyulaşma. Yalnız HD modda ve dışarıdayken.
  wet: { reflect: 1.5, wetness: 1.0, streak: 1.0, res: .5, road: { darken: .45, puddle: .5, minWet: .82 }, paving: { darken: .35, puddle: .45, minWet: .6 } },
  bollard: { led: 10, pool: 1.1, poolR: 1.4 },   // baba tepesi ışık halkası + zemindeki ışık havuzu
  bloom: { threshold: .9, strength: .16, radius: .12 },
  // time: 'day' | 'night'. Kanal sahibi: "gece yapma, gündüz yap, gerçek bir dünya ortamı, bulutlar olsun".
  time: 'day',
  // gündüz: Poly Haven "Docklands 01" (CC0, Savva Zakharov): bulutlu gök + modern şehir. day.hdr (1k) yansıma ortamı,
  // day_bg.jpg (6144 px, telefonda 3072 px) görünen arka plan (fotoğrafın kendi tonu, ek ton eşleme yok).
  // Güneş HDRI'deki güneşle aynı yönde (önden-sağdan, 29°), gölgeli. Pişmiş gece ışığı (Blender lightmap) cephede kısılır.
  // theme: gündüzde üzerine yazılan tema değerleri (LED, ışık havuzları, ıslaklık).
  day: {
    hdri: 'public/hdri/day.hdr', bg: 'public/hdri/day_bg.jpg', bgMobile: 'public/hdri/day_bg_m.jpg', bgGain: 1.0,
    sun: { color: '#fff1dd', intensity: 10.0, dir: [.69, .48, .54] }, hemi: { sky: '#b9d0ec', ground: '#6f6458', intensity: 3.0 },
    exposure: .8, grade: [1, 1, 1, 1, 1.03], fog: { color: '#b7c2ca', density: .0012 },
    bakedLM: .12, lightScale: .3, glassEnv: .55,
    theme: { bollard: { led: 3, pool: .25 }, soffit: { led: 2.0, glow: .25 }, band: { wash: .45 }, upper: { wash: .5, ceilLED: 1.6 }, display: { floorGlow: .2 }, paving: { gain: 1.35 } },
  },
  sky: { top: '#0b1020', mid: '#10172a', horizon: '#2a2530', warm: .22, clouds: .6, cloud: '#1f2638' },   // clouds: referanstaki bulutlu gece
  city: { color: '#1c2335', windows: .14, distance: 170, height: 72 },
  fog: { color: '#0b1020', density: .0045 },
};

// Renk sıcaklığı (K) → renk. Kara cisim (Planck) eğrisinin CIE 1931 xy yaklaşımı (Kim ve ark.) → XYZ → doğrusal sRGB.
// wb: beyaz dengesi (K). Kamera gibi: ışık rengi wb sıcaklığındaki kara cisim rengine bölünür (von Kries).
// En parlak kanal 1'e normalize edilir: renk tonunu verir, şiddet ışığın intensity değerindedir.
// 3500 K: wb yok → #ffc78b · wb 5500 → #ffd69e · wb 4700 → #ffe1b6 (Tanner Helland yaklaşımı aynı K'de daha turuncu çıkıyordu)
function planckLinear(k) {
  const T = Math.min(25000, Math.max(1667, k));
  const x = T <= 4000 ? -0.2661239e9 / T ** 3 - 0.2343589e6 / T ** 2 + 0.8776956e3 / T + 0.179910
                      : -3.0258469e9 / T ** 3 + 2.1070379e6 / T ** 2 + 0.2226347e3 / T + 0.240390;
  const y = T <= 2222 ? -1.1063814 * x ** 3 - 1.34811020 * x ** 2 + 2.18555832 * x - 0.20219683
          : T <= 4000 ? -0.9549476 * x ** 3 - 1.37418593 * x ** 2 + 2.09137015 * x - 0.16748867
                      : 3.0817580 * x ** 3 - 5.87338670 * x ** 2 + 3.75112997 * x - 0.37001483;
  const X = x / y, Z = (1 - x - y) / y;
  return [3.2404542 * X - 1.5371385 - 0.4985314 * Z, -0.9692660 * X + 1.8760108 + 0.0415560 * Z, 0.0556434 * X - 0.2040259 + 1.0572252 * Z]
    .map((v) => Math.max(1e-4, v));
}
export function kelvinToColor(k, wb = null) {
  let c = planckLinear(k);
  if (wb) { const w = planckLinear(wb); c = c.map((v, i) => v / w[i]); }
  const m = Math.max(...c);
  return new THREE.Color().setRGB(c[0] / m, c[1] / m, c[2] / m, THREE.LinearSRGBColorSpace);
}
export const facadeLightColor = () => kelvinToColor(FACADE_THEME.lightTemp, FACADE_THEME.whiteBalance);

// texture(name, map, srgb) → THREE.Texture (sahne sağlar). envMap sonradan setEnv ile gelir.
export function createFacadeMaterials({ texture, wood = null, glass = null, stone = null } = {}) {
  const P = FACADE_THEME.palette, S = FACADE_THEME.sign, v2 = (k) => new THREE.Vector2(k, k);
  const tex = (name, map, srgb, rep = 1) => { const t = texture(name, map, srgb); if (!t) return null; const c = t.clone(); c.wrapS = c.wrapT = THREE.RepeatWrapping; c.repeat.set(rep, rep); return c; };
  const light = facadeLightColor();
  const M = {
    theme: FACADE_THEME, lightColor: light,
    structure: new THREE.MeshStandardMaterial({ name: 'GM_structure', color: P.structure.color, metalness: P.structure.metalness, roughness: P.structure.roughness,
      roughnessMap: tex(P.structure.texture, 'roughness'), normalMap: tex(P.structure.texture, 'normal'), normalScale: v2(P.structure.normalScale) }),
    metal: new THREE.MeshStandardMaterial({ name: 'GM_metal', color: P.metal.color, metalness: P.metal.metalness, roughness: P.metal.roughness }),
    joint: new THREE.MeshStandardMaterial({ name: 'GM_joint', color: P.joint.color, roughness: P.joint.roughness }),
    signFace: new THREE.MeshStandardMaterial({ name: 'GM_signFace', color: P.brand.white, roughness: .9, emissive: P.brand.white, emissiveIntensity: S.faceEmissive }),
    signGreen: new THREE.MeshStandardMaterial({ name: 'GM_signGreen', color: P.brand.green, roughness: .8, emissive: P.brand.green, emissiveIntensity: S.greenEmissive }),
    led: new THREE.MeshBasicMaterial({ name: 'GM_led3000K', color: light.clone().multiplyScalar(2.2) }),
    wood, glass, stone,
  };
  M.structure.userData.env = P.structure.envIntensity; M.metal.userData.env = P.metal.envIntensity;
  // ışık haritalı / farklı UV ölçekli mesh'ler için paylaşılan değişkenler: aynı (taban, ışık haritası, tekrar) üçlüsü tek örnek
  const cache = new Map();
  M.variant = (key, { lightMap = null, lightMapIntensity = 1, rep = 1, onBeforeCompile = null, cacheKey = null, matte = false } = {}) => {
    const base = M[key]; if (!base) return null;
    const r = Math.max(.25, Math.round(rep * 4) / 4);
    if (!lightMap && !matte && Math.abs(r - 1) < .01 && !onBeforeCompile) return base;
    const id = `${key}|${lightMap?.uuid || '-'}|${lightMapIntensity.toFixed(2)}|${r}|${matte ? 'm' : ''}`;
    if (cache.has(id)) return cache.get(id);
    const m = base.clone();
    for (const k of ['map', 'normalMap', 'roughnessMap']) if (base[k] && Math.abs(r - 1) > .01) { m[k] = base[k].clone(); m[k].repeat.multiplyScalar(r); }
    if (lightMap) { m.lightMap = lightMap; m.lightMapIntensity = lightMapIntensity; m.userData.env = P[key]?.bakedEnvIntensity ?? m.userData.env; }   // pişmiş yüzey: yansıma çok düşük (yan yüzler gök rengine boyanmasın)
    if (onBeforeCompile) { m.onBeforeCompile = onBeforeCompile; m.customProgramCacheKey = cacheKey || (() => 'gm-baked'); }
    m.userData = { env: m.userData.env, ...base.userData, ...(lightMap || matte ? { env: P[key]?.bakedEnvIntensity ?? base.userData.env } : {}), variantOf: key }; cache.set(id, m); return m;
  };
  M.all = () => [M.structure, M.metal, M.joint, M.signFace, M.signGreen, ...cache.values()];
  // tema değişince (lil-gui) bütün örnekler güncellenir
  M.sync = () => {
    const L = facadeLightColor(); M.lightColor.copy(L); M.led.color.copy(L).multiplyScalar(2.2);
    for (const m of [M.structure, ...[...cache.values()].filter((x) => x.userData.variantOf === 'structure')]) {
      m.color.set(P.structure.color); m.metalness = P.structure.metalness; m.roughness = P.structure.roughness; m.normalScale?.setScalar(P.structure.normalScale); m.envMapIntensity = m.lightMap || m.userData.env === P.structure.bakedEnvIntensity ? P.structure.bakedEnvIntensity : P.structure.envIntensity; }
    for (const m of [M.metal, ...[...cache.values()].filter((x) => x.userData.variantOf === 'metal')]) {
      m.color.set(P.metal.color); m.metalness = P.metal.metalness; m.roughness = P.metal.roughness; m.envMapIntensity = P.metal.envIntensity; }
    M.signFace.color.set(P.brand.white); M.signFace.emissive.set(P.brand.white); M.signFace.emissiveIntensity = S.faceEmissive;
    M.signGreen.color.set(P.brand.green); M.signGreen.emissive.set(P.brand.green); M.signGreen.emissiveIntensity = S.greenEmissive;
  };
  M.setEnv = (env) => {
    for (const m of M.all()) if (m.userData.env != null || m.userData.variantOf) { m.envMap = env; m.envMapIntensity = m.userData.env ?? .4; m.needsUpdate = true; }
  };
  return M;
}
