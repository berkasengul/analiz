// Petra Spring ürünlerinin 3B modelleri (ürün sahnesinde paketin yerine geçer)
//   card   : asma kağıt araba kokusu, blister ambalajında (ön ve arka yüz ürünün gerçek fotoğrafından, poşet kısmı hacimli)
//   vial   : 8 ml cam şişe araba kokusu: elma biçimli cam, renkli esans, oluklu ahşap kapak, askı ipi
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

/* ---------- elma biçimli şişe profili (dönen gövde) ---------- */
function appleProfile(r, h, inset = 0) {
  const pts = [];
  const N = 40;
  for (let i = 0; i <= N; i++) {
    const t = i / N; // 0 alt, 1 üst
    // alt: yuvarlak taban; orta: dolgun; üst: omuz ve boyun
    const a = t * Math.PI;
    let x = Math.sin(a) * r * (1 - 0.18 * Math.pow(t, 3));
    x += r * 0.07 * Math.sin(t * Math.PI * 2) * (t < 0.5 ? 1 : 0.4); // elma girintisi
    x = Math.max(0.001, x - inset);
    const y = (-Math.cos(a) * 0.5 + 0.5) * h;
    pts.push(new THREE.Vector2(x, y));
  }
  return pts;
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
  x.font = `700 ${brand}px 'Fraunces Variable', Fraunces, Georgia, serif`;
  x.fillText('Petra', W / 2, kind === 'reed' ? 150 : 128);
  x.font = `600 ${kind === 'reed' ? 34 : 28}px Manrope, Arial, sans-serif`;
  x.fillText('s p r i n g', W / 2, kind === 'reed' ? 196 : 166);
  x.fillRect(W / 2 - 90, kind === 'reed' ? 222 : 186, 180, 3);
  x.font = `800 ${kind === 'reed' ? 60 : 50}px Manrope, Arial, sans-serif`;
  x.fillText((md.label || '').toLocaleUpperCase('tr'), W / 2, kind === 'reed' ? 300 : 248);
  if (kind === 'reed') {
    x.font = '600 26px Manrope, Arial, sans-serif';
    x.fillText('BAMBU ÇUBUKLU ORTAM KOKUSU', W / 2, 352);
    x.font = '700 30px Manrope, Arial, sans-serif';
    x.fillText('100 ml', W / 2, 400);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

export function makePetra() {
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
  const glass = new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.03, metalness: 0, transmission: 1, thickness: 0.05, ior: 1.4, clearcoat: 0.6, clearcoatRoughness: 0.05, envMapIntensity: 0.9, transparent: true, opacity: 1, specularIntensity: 0.7, depthWrite: false });
  const liquid = new THREE.MeshPhysicalMaterial({ color: 0xff3355, roughness: 0.12, transmission: 0, ior: 1.36, emissive: 0x000000, envMapIntensity: 0.7, clearcoat: 1, clearcoatRoughness: 0.08 });
  const wood = new THREE.MeshStandardMaterial({ color: 0xa47a4c, roughness: 0.62, metalness: 0 });
  const cord = new THREE.MeshStandardMaterial({ color: 0x8a6440, roughness: 0.9 });
  const black = new THREE.MeshPhysicalMaterial({ color: 0x0d0d0e, roughness: 0.32, clearcoat: 0.6, clearcoatRoughness: 0.25, envMapIntensity: 0.8 });
  const reedMat = new THREE.MeshStandardMaterial({ color: 0x141414, roughness: 0.75 });
  const labelMat = new THREE.MeshPhysicalMaterial({ roughness: 0.32, metalness: 0.55, clearcoat: 0.8, clearcoatRoughness: 0.15, envMapIntensity: 1.1, emissive: 0xffffff, emissiveIntensity: 0.18, polygonOffset: true, polygonOffsetFactor: -2 });
  mats.push(frontMat, backMat, glass, liquid, wood, cord, black, reedMat, labelMat);

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
    // ölçüler: şişe ~0.62, kapak ~0.3, ip ilmeği ~0.55 (toplam ~1.55); orta nokta 0
    const bh = 0.62, br = 0.3;
    const total = 1.55, y0 = -total / 2;
    const bottle = add(new THREE.LatheGeometry(appleProfile(br, bh), 64), glass, 0, y0, 0);
    bottle.scale.z = 0.72;
    const liq = add(new THREE.LatheGeometry(appleProfile(br, bh * 0.9, 0.028), 64), liquid, 0, y0 + 0.03, 0, false);
    liq.scale.z = 0.7; liq.scale.y = 0.96;
    liq.renderOrder = 1; bottle.renderOrder = 2;
    // boyun
    add(new THREE.CylinderGeometry(0.07, 0.085, 0.07, 32), glass, 0, y0 + bh + 0.02, 0);
    // oluklu ahşap kapak
    const capPts = [];
    const ch = 0.3, cr = 0.105;
    for (let i = 0; i <= 60; i++) {
      const t = i / 60;
      let r = cr * (1 - 0.12 * t) + 0.007 * Math.sin(t * Math.PI * 12);
      if (t > 0.94) r *= 1 - (t - 0.94) * 6;
      capPts.push(new THREE.Vector2(Math.max(0.001, r), t * ch));
    }
    capPts.unshift(new THREE.Vector2(0.001, 0));
    add(new THREE.LatheGeometry(capPts, 48), wood, 0, y0 + bh + 0.045, 0);
    // askı ipi: kapağın tepesinden çıkan ilmek
    const top = y0 + bh + 0.045 + ch;
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.012, top - 0.01, 0), new THREE.Vector3(-0.09, top + 0.16, 0.01), new THREE.Vector3(-0.1, top + 0.38, 0),
      new THREE.Vector3(0, top + 0.5, -0.01), new THREE.Vector3(0.1, top + 0.38, 0), new THREE.Vector3(0.09, top + 0.16, -0.01), new THREE.Vector3(0.012, top - 0.01, 0),
    ]);
    add(new THREE.TubeGeometry(curve, 80, 0.011, 8, false), cord);
    // ipin düğümü
    add(new THREE.SphereGeometry(0.026, 16, 12), cord, 0, top + 0.01, 0);
    liquid.color.set(md.liquid);
    liquid.emissive.set(md.liquid).multiplyScalar(0.25);
    height = total;
  }

  function buildReed(md) {
    const bw = 0.62, bh = 0.62, total = 1.78, y0 = -total / 2;
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
    const L = 1.18;
    const tilts = [[-0.2, 0.05], [-0.09, -0.08], [0.02, 0.06], [0.12, -0.05], [0.22, 0.04]];
    tilts.forEach(([rz, rx], i) => {
      const s = add(new THREE.CylinderGeometry(0.009, 0.009, L, 10), reedMat, 0, 0, 0);
      const base = new THREE.Vector3((i - 2) * 0.012, y0 + bh - 0.05, (i % 2 ? 0.01 : -0.01));
      s.rotation.set(rx, 0, -rz);
      const dir = new THREE.Vector3(0, 1, 0).applyEuler(s.rotation);
      s.position.copy(base).addScaledVector(dir, L / 2);
    });
    liquid.color.set(md.liquid);
    liquid.emissive.set(md.liquid).multiplyScalar(0.22);
    height = total;
  }

  // sahnede görünen boy (paketle aynı alana sığsın)
  const FIT = { card: 1.24, vial: 1.2, reed: 1.26 };
  function build(md) {
    clear();
    if (md.type === 'card') buildCard(md);
    else if (md.type === 'vial') buildVial(md);
    else buildReed(md);
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
