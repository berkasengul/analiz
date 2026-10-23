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
    brand: { green: '#3ccf3c', white: '#f2efe8' },
  },
  lightTemp: 3000,   // K — bütün spot, LED ve vitrin ışıkları
  sign: {
    capRatio: .45,          // büyük harf yüksekliği / panel yüksekliği
    depth: .04,             // kutu harf derinliği (m), pah yok
    standoff: .03,          // panel ile harf arası (m)
    faceEmissive: .62,      // harf yüzü: bloom eşiğini yalnız hafifçe geçer
    greenEmissive: .32,     // yeşil çizgi + yapraklar: harflerden daha sönük
    halo: .25,              // harf arkası hale opaklığı
    iconScale: .62,         // logo simgesinin yazıya göre ölçeği
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
    led: 1.1,              // girinti dibindeki 3000 K şerit (tabeladan sönük kalır)
    grooveGlow: .35,       // girinti yan yüzeylerine düşen LED ışığı
    plinthH: .12, plinthInset: .02, plinthGap: .03,   // metal kaide + koyu gölge boşluğu
    topGap: .03,           // kolon üstü ile saçak arası gölge boşluğu
    uplight: 10, uplightAngle: .15, uplightPenumbra: .5, uplightOffset: .22,   // yalayan ışık (gölgesiz)
    lamel: { thick: .015, depth: .04, gap: .06, core: '#151617' },
  },
  bloom: { threshold: .9, strength: .16, radius: .12 },
  sky: { top: '#0b1020', mid: '#10172a', horizon: '#2a2530', warm: .22 },
  city: { color: '#1c2335', windows: .14, distance: 170, height: 72 },
  fog: { color: '#0b1020', density: .0045 },
};

// Tanner Helland yaklaşımı: renk sıcaklığı (K) → sRGB
export function kelvinToColor(k) {
  const t = k / 100;
  const r = t <= 66 ? 255 : 329.698727446 * Math.pow(t - 60, -0.1332047592);
  const g = t <= 66 ? 99.4708025861 * Math.log(t) - 161.1195681661 : 288.1221695283 * Math.pow(t - 60, -0.0755148492);
  const b = t >= 66 ? 255 : t <= 19 ? 0 : 138.5177312231 * Math.log(t - 10) - 305.0447927307;
  const c = (v) => Math.min(255, Math.max(0, v)) / 255;
  return new THREE.Color().setRGB(c(r), c(g), c(b), THREE.SRGBColorSpace);
}

// texture(name, map, srgb) → THREE.Texture (sahne sağlar). envMap sonradan setEnv ile gelir.
export function createFacadeMaterials({ texture, wood = null, glass = null, stone = null } = {}) {
  const P = FACADE_THEME.palette, S = FACADE_THEME.sign, v2 = (k) => new THREE.Vector2(k, k);
  const tex = (name, map, srgb, rep = 1) => { const t = texture(name, map, srgb); if (!t) return null; const c = t.clone(); c.wrapS = c.wrapT = THREE.RepeatWrapping; c.repeat.set(rep, rep); return c; };
  const light = kelvinToColor(FACADE_THEME.lightTemp);
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
    const L = kelvinToColor(FACADE_THEME.lightTemp); M.lightColor.copy(L); M.led.color.copy(L).multiplyScalar(2.2);
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
