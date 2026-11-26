// Petra Spring ürünlerinin 3B modelleri (ürün sahnesinde paketin yerine geçer)
//   card   : asma kağıt araba kokusu, blister ambalajında (ön ve arka yüz ürünün gerçek fotoğrafından, poşet kısmı hacimli)
//   vial   : 8 ml cam şişe araba kokusu: elma biçimli (ısırıklı) kalın cam, gömme logo, renkli esans, 4 halkalı ahşap kapak, boncuk ve bükümlü ip
//   reed   : 100 ml bambu çubuklu oda kokusu: kare cam şişe, renkli esans, siyah kapak, altın etiket, 5 siyah çubuk
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

/* ---------- blister kart: başlık düz, alttaki poşet hafifçe şişkin ---------- */
function cardSurface(w, h, side, head) {
  const SX = 40, SY = 90;
  const pos = [], uv = [], idx = [];
  for (let j = 0; j <= SY; j++) {
    const v = j / SY;
    for (let i = 0; i <= SX; i++) {
      const u = i / SX;
      // poşet: başlığın altında, kenarlara doğru incelir
      const bag = (1 - smooth(1 - head - 0.04, 1 - head + 0.02, v)) * smooth(0.0, 0.06, v);
      const bulge = Math.pow(Math.sin(Math.PI * u), 0.55) * bag * 0.045;
      const x = (u - 0.5) * w * (1 - 0.012 * bag * Math.sin(Math.PI * u));
      const y = (v - 0.5) * h;
      pos.push(x, y, side * (0.0035 + bulge));
      uv.push(side > 0 ? u : 1 - u, v);
    }
  }
  const row = SX + 1;
  for (let j = 0; j < SY; j++) for (let i = 0; i < SX; i++) {
    const a = j * row + i, b = a + 1, c = a + row, d = c + 1;
    if (side > 0) idx.push(a, b, d, a, d, c); else idx.push(a, d, b, a, c, d);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

// elma silueti (alt orta 0,0; genişlik ~1.04, boy ~0.94); k: ölçek, inset: içe kaydırma
function appleShape(k = 1, lift = 0) {
  const s = new THREE.Shape();
  const P = (x, y) => [x * k, y * k + lift + (1 - k) * 0.47];
  s.moveTo(...P(0, 0.06));
  s.bezierCurveTo(...P(0.08, 0.0), ...P(0.15, -0.01), ...P(0.25, 0.02));
  s.bezierCurveTo(...P(0.38, 0.06), ...P(0.47, 0.2), ...P(0.5, 0.32));
  // ısırık
  s.bezierCurveTo(...P(0.37, 0.38), ...P(0.35, 0.63), ...P(0.47, 0.7));
  s.bezierCurveTo(...P(0.43, 0.85), ...P(0.33, 0.94), ...P(0.2, 0.94));
  s.bezierCurveTo(...P(0.11, 0.94), ...P(0.06, 0.9), ...P(0.0, 0.9));
  s.bezierCurveTo(...P(-0.06, 0.9), ...P(-0.11, 0.94), ...P(-0.2, 0.94));
  s.bezierCurveTo(...P(-0.4, 0.94), ...P(-0.53, 0.77), ...P(-0.53, 0.53));
  s.bezierCurveTo(...P(-0.53, 0.28), ...P(-0.4, 0.0), ...P(-0.25, 0.02));
  s.bezierCurveTo(...P(-0.15, -0.01), ...P(-0.08, 0.0), ...P(0, 0.06));
  return s;
}

function embossCanvas() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const x = c.getContext('2d');
  x.strokeStyle = 'rgba(255,255,255,.75)'; x.fillStyle = 'rgba(255,255,255,.8)';
  x.lineWidth = 6; x.beginPath(); x.arc(128, 128, 116, 0, Math.PI * 2); x.stroke();
  x.lineWidth = 2; x.beginPath(); x.arc(128, 128, 104, 0, Math.PI * 2); x.stroke();
  x.textAlign = 'center';
  x.font = "700 64px Montserrat Variable, Montserrat, Arial, sans-serif"; x.fillText('Petra', 128, 140);
  x.font = '600 22px Montserrat Variable, Montserrat, Arial, sans-serif'; x.fillText('s p r i n g', 128, 172);
  // güneş ışınları (logodaki gibi)
  for (let i = 0; i < 9; i++) { const a = Math.PI + (i / 8) * Math.PI; x.fillRect(128 + Math.cos(a) * 62 - 2, 86 + Math.sin(a) * 30 - 2, 4, 4); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return t;
}

function woodCanvas() {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 128;
  const x = c.getContext('2d');
  x.fillStyle = '#d2ae7c'; x.fillRect(0, 0, 512, 128);
  let s = 11; const r = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  for (let i = 0; i < 70; i++) {
    const y = r() * 128;
    x.strokeStyle = `rgba(${120 + r() * 40},${80 + r() * 30},${40 + r() * 20},${0.08 + r() * 0.22})`;
    x.lineWidth = 0.6 + r() * 2.2;
    x.beginPath(); x.moveTo(0, y);
    for (let X = 0; X <= 512; X += 32) x.lineTo(X, y + Math.sin(X * 0.02 + i) * (2 + r() * 3));
    x.stroke();
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

function labelCanvas(md, kind) {
  const c = document.createElement('canvas');
  const W = 512, H = kind === 'reed' ? 460 : 300;
  c.width = W; c.height = H;
  const x = c.getContext('2d');
  // altın levha
  const g = x.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, '#8a6a2c'); g.addColorStop(0.25, '#e9cf8a'); g.addColorStop(0.5, '#b8913f'); g.addColorStop(0.75, '#f1dc9e'); g.addColorStop(1, '#8f6d2e');
  x.fillStyle = g; x.fillRect(0, 0, W, H);
  x.strokeStyle = 'rgba(40,28,8,.75)'; x.lineWidth = 5; x.strokeRect(14, 14, W - 28, H - 28);
  x.strokeStyle = 'rgba(40,28,8,.35)'; x.lineWidth = 2; x.strokeRect(26, 26, W - 52, H - 52);
  x.fillStyle = '#2a1d06'; x.textAlign = 'center';
  const brand = kind === 'reed' ? 110 : 96;
  x.font = `700 ${brand}px Montserrat Variable, Montserrat, Arial, sans-serif`;
  x.fillText('Petra', W / 2, kind === 'reed' ? 150 : 128);
  x.font = `600 ${kind === 'reed' ? 34 : 28}px Montserrat Variable, Montserrat, Arial, sans-serif`;
  x.fillText('s p r i n g', W / 2, kind === 'reed' ? 196 : 166);
  x.fillRect(W / 2 - 90, kind === 'reed' ? 222 : 186, 180, 3);
  x.font = `800 ${kind === 'reed' ? 60 : 50}px Montserrat Variable, Montserrat, Arial, sans-serif`;
  x.fillText((md.label || '').toLocaleUpperCase('tr'), W / 2, kind === 'reed' ? 300 : 248);
  if (kind === 'reed') {
    x.font = '600 26px Montserrat Variable, Montserrat, Arial, sans-serif';
    x.fillText('BAMBU ÇUBUKLU ORTAM KOKUSU', W / 2, 352);
    x.font = '700 30px Montserrat Variable, Montserrat, Arial, sans-serif';
    x.fillText('100 ml', W / 2, 400);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

// opts.dim: komşu ürünler için karartma çarpanı (ana sayfa kaidesinin yanlarında karanlıkta silüet)
export function makePetra(opts = {}) {
  const DIM = opts.dim || 1;
  const group = new THREE.Group();
  let parts = [];
  let key = '';
  let height = 1;
  const mats = [];

  // kart malzemeleri (ön / arka yüz fotoğrafları)
  const film = { roughness: 0.38, metalness: 0.0, clearcoat: 1, clearcoatRoughness: 0.08, envMapIntensity: 0.55, alphaTest: 0.5, side: THREE.FrontSide, emissive: 0xffffff, emissiveIntensity: 0.26 };
  const frontMat = new THREE.MeshPhysicalMaterial({ ...film });
  const backMat = new THREE.MeshPhysicalMaterial({ ...film });
  // cam ve esans
  const glass = new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.02, metalness: 0, transmission: 1, thickness: 0.12, ior: 1.45, clearcoat: 1, clearcoatRoughness: 0.03, envMapIntensity: 1.1, transparent: true, opacity: 1, specularIntensity: 1, depthWrite: false });
  const liquid = new THREE.MeshPhysicalMaterial({ color: 0xff3355, roughness: 0.18, metalness: 0, emissive: 0x000000, envMapIntensity: 0.6, clearcoat: 1, clearcoatRoughness: 0.06 });
  const embossMat = new THREE.MeshPhysicalMaterial({ map: embossCanvas(), transparent: true, opacity: 0.55, roughness: 0.15, clearcoat: 1, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3 });
  const wood = new THREE.MeshStandardMaterial({ map: woodCanvas(), color: 0xffffff, roughness: 0.68, metalness: 0 });
  const cord = new THREE.MeshStandardMaterial({ color: 0xb48c5a, roughness: 0.95 });
  const black = new THREE.MeshPhysicalMaterial({ color: 0x0d0d0e, roughness: 0.32, clearcoat: 0.6, clearcoatRoughness: 0.25, envMapIntensity: 0.8 });
  const reedMat = new THREE.MeshStandardMaterial({ color: 0x141414, roughness: 0.75 });
  const labelMat = new THREE.MeshPhysicalMaterial({ roughness: 0.32, metalness: 0.55, clearcoat: 0.8, clearcoatRoughness: 0.15, envMapIntensity: 1.1, emissive: 0xffffff, emissiveIntensity: 0.18, polygonOffset: true, polygonOffsetFactor: -2 });
  mats.push(frontMat, backMat, glass, liquid, wood, cord, black, reedMat, labelMat);
  if (DIM < 1) {
    for (const m of mats) { if (m.color) m.color.multiplyScalar(DIM); if ('emissiveIntensity' in m) m.emissiveIntensity *= DIM; if ('envMapIntensity' in m) m.envMapIntensity *= DIM; }
    embossMat.opacity *= DIM;
  }

  function clear() {
    for (const m of parts) { group.remove(m); m.geometry.dispose(); }
    parts = [];
  }
  const add = (geo, mat, x = 0, y = 0, z = 0, shadow = true) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.castShadow = shadow; m.receiveShadow = true;
    group.add(m); parts.push(m);
    return m;
  };

  function buildCard(md) {
    const h = 1.62, w = h / md.aspect;
    add(cardSurface(w, h, 1, md.head || 0.3), frontMat);
    add(cardSurface(w, h, -1, md.head || 0.3), backMat);
    height = h;
  }

  function buildVial(md) {
    // Ürün görselindeki şişe: elma biçimli (sağda ısırık), kalın cam, önde gömme yuvarlak Petra logosu;
    // boyunda 4 halkalı ahşap kapak, tepesinde ahşap boncuk ve bükümlü ip ilmeği
    const S = appleShape();
    const D = 0.3, BT = 0.085, BS = 0.07;
    const bottleGeo = new THREE.ExtrudeGeometry(S, { depth: D, bevelEnabled: true, bevelThickness: BT, bevelSize: BS, bevelSegments: 10, curveSegments: 64 });
    bottleGeo.translate(0, 0, -D / 2);
    bottleGeo.computeVertexNormals();
    const total = 1.62, y0 = -total / 2 + 0.07; // taban (bevel taşmasıyla)
    const bottle = add(bottleGeo, glass, 0, y0, 0);
    bottle.renderOrder = 2;
    // esans: camın iç hacmi (kalın cam duvar ve kalın taban)
    const L = appleShape(0.8, 0.07);
    const liqGeo = new THREE.ExtrudeGeometry(L, { depth: D * 0.62, bevelEnabled: true, bevelThickness: 0.07, bevelSize: 0.05, bevelSegments: 8, curveSegments: 48 });
    liqGeo.translate(0, 0, -D * 0.31);
    const liq = add(liqGeo, liquid, 0, y0, 0, false);
    liq.renderOrder = 1;
    // önde gömme logo (camda kabartma: yarı saydam beyaz)
    const logo = add(new THREE.PlaneGeometry(0.34, 0.34), embossMat, 0, y0 + 0.4, D / 2 + BT + 0.003, false);
    logo.renderOrder = 3;
    // boyun
    const ny = y0 + 0.9 + BS * 0.3;
    add(new THREE.CylinderGeometry(0.075, 0.09, 0.09, 40), glass, 0, ny + 0.03, 0).renderOrder = 2;
    // 4 halkalı ahşap kapak
    const ringH = 0.072, ringR = 0.135;
    const ringPts = [];
    for (let i = 0; i <= 24; i++) {
      const a = (i / 24) * Math.PI;
      const r = ringR - 0.026 * (1 - Math.sin(a)) ;
      ringPts.push(new THREE.Vector2(Math.max(0.001, r), (1 - Math.cos(a)) / 2 * ringH));
    }
    ringPts.unshift(new THREE.Vector2(0.001, 0)); ringPts.push(new THREE.Vector2(0.001, ringH));
    const ringGeo = new THREE.LatheGeometry(ringPts, 64);
    const capY = ny + 0.06;
    for (let k = 0; k < 4; k++) add(ringGeo.clone(), wood, 0, capY + k * (ringH - 0.004), 0);
    // üstte boncuk
    const topY = capY + 4 * (ringH - 0.004);
    add(new THREE.SphereGeometry(0.068, 32, 24), wood, 0, topY + 0.058, 0);
    // bükümlü ip: boncuğun içinden çıkan iki kol, yukarıda ilmek
    const by = topY + 0.1;
    const pts = [];
    for (let i = 0; i <= 40; i++) {
      const t = i / 40, a = t * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.sin(a) * 0.11 * (0.35 + 0.65 * Math.sin(t * Math.PI)), by + (1 - Math.cos(a)) * 0.17 + Math.sin(t * Math.PI) * 0.05, Math.sin(a * 2) * 0.012));
    }
    for (const tw of [0, Math.PI]) {
      const p2 = pts.map((v, i) => v.clone().add(new THREE.Vector3(Math.cos(i * 1.4 + tw) * 0.007, 0, Math.sin(i * 1.4 + tw) * 0.007)));
      add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(p2), 120, 0.011, 10, false), cord);
    }
    liquid.color.set(md.liquid);
    liquid.emissive.set(md.liquid).multiplyScalar(0.42);
    height = total;
  }

  function buildReed(md) {
    const bw = 0.62, bh = 0.62, total = 1.55, y0 = -total / 2;
    // kalın cam taban + gövde
    const body = add(new RoundedBoxGeometry(bw, bh, bw, 6, 0.06), glass, 0, y0 + bh / 2, 0);
    body.renderOrder = 2;
    const liq = add(new RoundedBoxGeometry(bw - 0.07, bh * 0.66, bw - 0.07, 4, 0.04), liquid, 0, y0 + 0.09 + bh * 0.33, 0, false);
    liq.renderOrder = 1;
    // boyun ve siyah kapak halkası
    add(new THREE.CylinderGeometry(0.075, 0.075, 0.05, 32), glass, 0, y0 + bh + 0.02, 0);
    add(new THREE.CylinderGeometry(0.105, 0.105, 0.12, 40), black, 0, y0 + bh + 0.08, 0);
    add(new THREE.TorusGeometry(0.098, 0.012, 10, 40).rotateX(Math.PI / 2), black, 0, y0 + bh + 0.14, 0);
    // ön etiket (altın levha)
    const lab = add(new THREE.PlaneGeometry(0.4, 0.36), labelMat, 0, y0 + bh * 0.47, bw / 2 + 0.002, false);
    lab.renderOrder = 3;
    // 5 siyah bambu çubuk: yelpaze gibi açılır
    const L = 0.95;
    const tilts = [[-0.2, 0.05], [-0.09, -0.08], [0.02, 0.06], [0.12, -0.05], [0.22, 0.04]];
    tilts.forEach(([rz, rx], i) => {
      const s = add(new THREE.CylinderGeometry(0.009, 0.009, L, 10), reedMat, 0, 0, 0);
      const base = new THREE.Vector3((i - 2) * 0.012, y0 + bh - 0.05, (i % 2 ? 0.01 : -0.01));
      s.rotation.set(rx, 0, -rz);
      const dir = new THREE.Vector3(0, 1, 0).applyEuler(s.rotation);
      s.position.copy(base).addScaledVector(dir, L / 2);
    });
    liquid.color.set(md.liquid);
    liquid.emissive.set(md.liquid).multiplyScalar(0.38);
    height = total;
  }

  // sahnede görünen boy (paketle aynı alana sığsın)
  const FIT = { card: 1.3, vial: 1.36, reed: 1.5 };
  function build(md) {
    clear();
    if (md.type === 'card') buildCard(md);
    else if (md.type === 'vial') buildVial(md);
    else buildReed(md);
    if (DIM < 1) { liquid.color.multiplyScalar(DIM); liquid.emissive.multiplyScalar(DIM); }
    const k = FIT[md.type] / height;
    group.scale.setScalar(k);
    height *= k;
    if (md.type !== 'card') {
      if (labelMat.map) labelMat.map.dispose();
      const t = labelCanvas(md, md.type);
      labelMat.map = t; labelMat.emissiveMap = t; labelMat.needsUpdate = true;
    }
  }

  return {
    group,
    show(md, tex, back) {
      const id = JSON.stringify(md);
      if (id !== key) { key = id; build(md); }
      if (md.type === 'card') {
        if (tex && frontMat.map !== tex) { frontMat.map = tex; frontMat.emissiveMap = tex; frontMat.needsUpdate = true; }
        if (back && backMat.map !== back) { backMat.map = back; backMat.emissiveMap = back; backMat.needsUpdate = true; }
      }
      group.visible = true;
    },
    setBack(back) {
      if (back && backMat.map !== back) { backMat.map = back; backMat.emissiveMap = back; backMat.needsUpdate = true; }
    },
    hide() { group.visible = false; },
    height: () => height,
    // kenar ışığı yoğunluğu: sahnedeki parlaklık ayarı
    setGlow(k) { frontMat.emissiveIntensity = backMat.emissiveIntensity = 0.26 + k; },
  };
}
