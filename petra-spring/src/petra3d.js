// Petra Spring ürünlerinin 3B modelleri (ürün sahnesinde paketin yerine geçer)
//   card   : asma kağıt araba kokusu, blister ambalajında (ön ve arka yüz ürünün gerçek fotoğrafından, poşet kısmı hacimli)
//   blister: 8 ml cam şişe araba kokusu, gerçek blister kartında (ön yüz ürünün fotoğrafı, arka yüz kullanım bilgisi;
//            şişenin üstünde hacimli, saydam plastik kabarcık)
//   vial   : 8 ml cam şişe araba kokusu (kartsız): elma biçimli (ısırıklı) kalın cam, gömme logo, renkli esans, ahşap kapak, ip
//   reed   : 100 ml bambu çubuklu oda kokusu: kare kalın cam şişe, renkli esans, siyah kapak, süslü altın etiket, 5 siyah çubuk;
//            yanında ürünün kutusu (gümüş kutu: altın bant, Petra logosu, dikey isim etiketi, şişe çizimi, ürün renginde alt kısım)
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

const FONT = 'Montserrat Variable, Montserrat, Arial, sans-serif';
const hexA = (h, a) => { const n = parseInt(h.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };
function texOf(c) { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; }
// metalik gümüş zemin, alta doğru ürün rengi
function silver(x, W, H, col, seed) {
  const g = x.createLinearGradient(0, 0, W, 0);
  g.addColorStop(0, '#9aa1a8'); g.addColorStop(0.18, '#dfe3e7'); g.addColorStop(0.45, '#c3c8cd'); g.addColorStop(0.7, '#eef0f2'); g.addColorStop(1, '#a9b0b6');
  x.fillStyle = g; x.fillRect(0, 0, W, H);
  const v = x.createLinearGradient(0, H * 0.45, 0, H);
  v.addColorStop(0, hexA(col, 0)); v.addColorStop(0.55, hexA(col, 0.38)); v.addColorStop(1, hexA(col, 0.78));
  x.fillStyle = v; x.fillRect(0, 0, W, H);
  // fırçalanmış metal dokusu
  let s = seed; const r = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  for (let i = 0; i < 260; i++) { x.fillStyle = `rgba(255,255,255,${r() * 0.07})`; x.fillRect(0, r() * H, W, 1 + r() * 2); }
}
function boxFront(md) {
  const W = 512, H = 1320, c = document.createElement('canvas'); c.width = W; c.height = H;
  const x = c.getContext('2d'), col = md.liquid || '#4a90d9';
  silver(x, W, H, col, 7);
  // altın bant
  const gb = x.createLinearGradient(0, 0, W, 0);
  gb.addColorStop(0, '#9c7a33'); gb.addColorStop(0.5, '#e6c77c'); gb.addColorStop(1, '#9c7a33');
  x.fillStyle = gb; x.fillRect(0, 44, W, 46);
  x.fillStyle = '#fff8e6'; x.font = `700 21px ${FONT}`; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillText('★  ORTAM KOKUSU  ◆  REED DIFFUSER  ★', W / 2, 68);
  // logo
  x.fillStyle = '#1b2430'; x.font = `700 122px ${FONT}`; x.textBaseline = 'alphabetic';
  x.fillText('Petra', W / 2 - 6, 232); x.font = `500 18px ${FONT}`; x.fillText('®', W / 2 + 160, 160);
  x.font = `500 40px ${FONT}`; x.fillText('spring', W / 2, 282);
  // dikey isim etiketi
  const px = W / 2 - 52, py = 330, pw = 104, ph = 470;
  x.save(); x.shadowColor = 'rgba(0,0,0,.18)'; x.shadowBlur = 10;
  x.beginPath(); x.roundRect(px, py, pw, ph, 52); x.fillStyle = '#fbfbfa'; x.fill(); x.restore();
  x.fillStyle = col; x.fillRect(px + 10, py + 22, pw - 20, 12);
  x.save(); x.translate(W / 2, py + 210); x.rotate(Math.PI / 2);
  x.fillStyle = '#111'; x.font = `800 ${md.label && md.label.length > 6 ? 60 : 70}px ${FONT}`; x.textBaseline = 'middle';
  x.fillText((md.label || '').toLocaleUpperCase('tr'), 0, 0); x.restore();
  // altın mühür
  const sg = x.createRadialGradient(W / 2 - 12, py + ph - 64, 6, W / 2, py + ph - 52, 46);
  sg.addColorStop(0, '#f6e2a2'); sg.addColorStop(0.7, '#c49a45'); sg.addColorStop(1, '#8e6b28');
  x.fillStyle = sg; x.beginPath(); x.arc(W / 2, py + ph - 52, 42, 0, Math.PI * 2); x.fill();
  x.strokeStyle = 'rgba(70,50,10,.7)'; x.lineWidth = 2; x.beginPath(); x.arc(W / 2, py + ph - 52, 34, 0, Math.PI * 2); x.stroke();
  x.fillStyle = '#4a3508'; x.font = `800 13px ${FONT}`; x.textBaseline = 'middle';
  x.fillText('ULTRA', W / 2, py + ph - 60); x.fillText('DOĞAL', W / 2, py + ph - 44);
  // duman kıvrımı
  x.strokeStyle = 'rgba(255,255,255,.55)'; x.lineWidth = 2.5;
  for (let k = 0; k < 3; k++) { x.beginPath(); x.moveTo(W / 2 - 20 + k * 14, 980); x.bezierCurveTo(W / 2 - 70 + k * 20, 920, W / 2 + 40, 900, W / 2 - 10 + k * 10, 830); x.stroke(); }
  // şişe çizimi ve çubuklar
  const bx = W / 2 - 78, by = 1060, bw = 156, bh = 150;
  x.strokeStyle = '#141414'; x.lineCap = 'round';
  [[-70, 0.9], [-30, 0.7], [20, 0.75], [60, 0.95]].forEach(([dx, w]) => { x.lineWidth = 7 * w + 3; x.beginPath(); x.moveTo(W / 2 + dx * 0.15, by + 10); x.lineTo(W / 2 + dx * 1.6, 820); x.stroke(); });
  x.fillStyle = 'rgba(255,255,255,.35)'; x.beginPath(); x.roundRect(bx, by, bw, bh, 12); x.fill();
  const lg = x.createLinearGradient(0, by + 30, 0, by + bh); lg.addColorStop(0, hexA(col, 0.75)); lg.addColorStop(1, hexA(col, 1));
  x.fillStyle = lg; x.beginPath(); x.roundRect(bx + 8, by + 34, bw - 16, bh - 48, 8); x.fill();
  x.strokeStyle = 'rgba(255,255,255,.8)'; x.lineWidth = 3; x.beginPath(); x.roundRect(bx, by, bw, bh, 12); x.stroke();
  x.fillStyle = '#121212'; x.fillRect(W / 2 - 24, by - 46, 48, 50);
  x.fillStyle = '#fff'; x.font = `700 30px ${FONT}`; x.fillText('Petra', W / 2, by + 92);
  x.font = `500 11px ${FONT}`; x.fillText('spring', W / 2, by + 112);
  // imza ve hacim
  x.fillStyle = '#20262c'; x.font = `italic 500 30px Georgia, serif`; x.textAlign = 'left';
  x.fillText('Feel', W / 2 + 92, 960); x.fillText('Yum', W / 2 + 110, 996);
  x.textAlign = 'center'; x.font = `600 30px ${FONT}`; x.fillText('100 ml ℮', W / 2, 1270);
  return texOf(c);
}
function boxSide(md, seed) {
  const W = 512, H = 1320, c = document.createElement('canvas'); c.width = W; c.height = H;
  const x = c.getContext('2d'), col = md.liquid || '#4a90d9';
  silver(x, W, H, col, seed);
  let s = seed; const r = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  x.fillStyle = '#1d242b'; x.font = `800 26px ${FONT}`; x.textAlign = 'left';
  x.fillText(`PETRA SPRING ${(md.label || '').toLocaleUpperCase('tr')}`, 40, 110);
  x.font = `600 20px ${FONT}`; x.fillText('REED DIFFUSER · 100 ml', 40, 140);
  // metin satırları (uzaktan bakınca basılı yazı)
  const lines = (y0, n) => { for (let i = 0; i < n; i++) { const w = i === n - 1 ? 140 + r() * 120 : 380 + r() * 52; x.fillStyle = 'rgba(29,36,43,.62)'; x.fillRect(40, y0 + i * 19, w, 7); } };
  x.fillStyle = '#1d242b'; x.font = `800 18px ${FONT}`; x.fillText('KULLANIM ŞEKLİ', 40, 200); lines(214, 9);
  x.fillText('UYARILAR', 40, 420); lines(434, 7);
  // simgeler
  x.strokeStyle = 'rgba(29,36,43,.75)'; x.lineWidth = 3;
  for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) { x.beginPath(); x.arc(80 + i * 110, 640 + j * 100, 34, 0, Math.PI * 2); x.stroke(); }
  // uyarı simgesi
  x.save(); x.translate(400, 1000); x.rotate(Math.PI / 4); x.strokeStyle = '#d6202a'; x.lineWidth = 6; x.strokeRect(-36, -36, 72, 72); x.restore();
  // barkod
  x.fillStyle = '#fff'; x.fillRect(40, 1080, 230, 130);
  x.fillStyle = '#111'; let bx = 52; while (bx < 258) { const w = 1 + Math.floor(r() * 4); if (r() > 0.4) x.fillRect(bx, 1092, w, 92); bx += w + 1; }
  x.font = `600 14px ${FONT}`; x.fillText('8 682 5 0 0 1 2 3 4 5', 60, 1203);
  return texOf(c);
}
function boxTop() {
  const W = 512, c = document.createElement('canvas'); c.width = c.height = W;
  const x = c.getContext('2d');
  silver(x, W, W, '#c0c6cc', 3);
  x.fillStyle = '#1b2430'; x.textAlign = 'center'; x.font = `700 92px ${FONT}`; x.fillText('Petra', W / 2, 270);
  x.font = `500 30px ${FONT}`; x.fillText('spring', W / 2, 314);
  return texOf(c);
}
// oda kokusu etiketi: süslü çerçeveli altın levha (ürün fotoğrafındaki gibi)
function reedLabel(md) {
  const W = 512, H = 470, c = document.createElement('canvas'); c.width = W; c.height = H;
  const x = c.getContext('2d');
  const g = x.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, '#c9a43c'); g.addColorStop(0.3, '#ecd27a'); g.addColorStop(0.55, '#d4b04a'); g.addColorStop(0.8, '#f0da8c'); g.addColorStop(1, '#bf9a36');
  x.fillStyle = g; x.fillRect(0, 0, W, H);
  x.strokeStyle = '#2a1d06'; x.lineWidth = 4; x.strokeRect(16, 16, W - 32, H - 32);
  x.lineWidth = 1.6; x.strokeRect(28, 28, W - 56, H - 56);
  // köşe süsleri
  [[28, 28], [W - 28, 28], [28, H - 28], [W - 28, H - 28]].forEach(([cx, cy]) => { x.beginPath(); x.arc(cx, cy, 14, 0, Math.PI * 2); x.stroke(); });
  x.fillStyle = '#2a1d06'; x.textAlign = 'center'; x.textBaseline = 'middle';
  // tepe amblemi
  x.beginPath(); x.arc(W / 2, 82, 30, 0, Math.PI * 2); x.lineWidth = 3; x.stroke();
  x.font = `800 34px ${FONT}`; x.fillText('P', W / 2, 84);
  x.lineWidth = 2; x.beginPath(); x.moveTo(W / 2 - 150, 82); x.lineTo(W / 2 - 44, 82); x.moveTo(W / 2 + 44, 82); x.lineTo(W / 2 + 150, 82); x.stroke();
  x.font = `700 96px ${FONT}`; x.fillText('Petra', W / 2, 176);
  x.font = `600 30px ${FONT}`; x.fillText('spring', W / 2, 232);
  // isim bandı (uçları sivri)
  const bw = 330, by = 300, bh = 70;
  x.beginPath(); x.moveTo(W / 2 - bw / 2, by); x.lineTo(W / 2 - bw / 2 + 26, by - bh / 2); x.lineTo(W / 2 + bw / 2 - 26, by - bh / 2); x.lineTo(W / 2 + bw / 2, by); x.lineTo(W / 2 + bw / 2 - 26, by + bh / 2); x.lineTo(W / 2 - bw / 2 + 26, by + bh / 2); x.closePath();
  x.lineWidth = 4; x.stroke();
  const nm = (md.label || '').toLocaleUpperCase('tr');
  x.font = `800 ${nm.length > 6 ? 46 : 54}px ${FONT}`; x.fillText(nm, W / 2, by + 3);
  x.font = `600 24px ${FONT}`; x.fillText('100 ml ℮ 3.4 fl.oz', W / 2, 410);
  return texOf(c);
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
  // blister kabarcığı: ince, saydam PET plastik (arkadaki kart görünür, kenarlarda parlar)
  const blisterMat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.04, metalness: 0, transparent: true, opacity: 0.16, clearcoat: 1, clearcoatRoughness: 0.03, envMapIntensity: 1.6, specularIntensity: 1, depthWrite: false, side: THREE.FrontSide });
  const blisterEdge = new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.1, transparent: true, opacity: 0.32, clearcoat: 1, envMapIntensity: 1.4, depthWrite: false, side: THREE.DoubleSide });
  // oda kokusu kutusu: yan yüzler, üst ve alt (gümüş karton, hafif parlak lak)
  const boxMats = [0, 1, 2, 3, 4, 5].map(() => new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.36, metalness: 0.25, clearcoat: 0.55, clearcoatRoughness: 0.2, envMapIntensity: 0.9, emissive: 0xffffff, emissiveIntensity: 0.12 }));
  // kalın cam taban (kare şişe)
  const thickGlass = new THREE.MeshPhysicalMaterial({ color: 0xf4fbff, roughness: 0.03, transmission: 1, thickness: 0.4, ior: 1.5, clearcoat: 1, envMapIntensity: 1.2, transparent: true, depthWrite: false });
  mats.push(frontMat, backMat, glass, liquid, wood, cord, black, reedMat, labelMat, ...boxMats);
  if (DIM < 1) {
    for (const m of mats) { if (m.color) m.color.multiplyScalar(DIM); if ('emissiveIntensity' in m) m.emissiveIntensity *= DIM; if ('envMapIntensity' in m) m.envMapIntensity *= DIM; }
    embossMat.opacity *= DIM;
  }

  function clear() {
    for (const m of parts) { group.remove(m); m.traverse((o) => { if (o.geometry) o.geometry.dispose(); }); }
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

  // blister kart: düz kart (iki yüz fotoğraf) + şişenin üstünde hacimli saydam kabarcık
  function buildBlister(md) {
    const h = 1.62, w = h / (md.aspect || 2.144);
    add(cardSurface(w, h, 1, 1), frontMat);
    add(cardSurface(w, h, -1, 1), backMat);
    // kabarcığın dış hattı (kart fotoğrafındaki konumuyla: u soldan, v üstten)
    const P = [[0.33, 0.39], [0.5, 0.385], [0.69, 0.39], [0.727, 0.43], [0.727, 0.55], [0.73, 0.592], [0.752, 0.635], [0.752, 0.66],
      [0.71, 0.7], [0.752, 0.75], [0.745, 0.815], [0.69, 0.865], [0.6, 0.868], [0.5, 0.855], [0.4, 0.868], [0.31, 0.865],
      [0.258, 0.815], [0.25, 0.72], [0.268, 0.645], [0.3, 0.6], [0.3, 0.43]];
    const sh = new THREE.Shape();
    const pts = P.map(([u, v]) => new THREE.Vector2((u - 0.5) * w, (0.5 - v) * h));
    sh.setFromPoints(new THREE.SplineCurve([...pts, pts[0]]).getPoints(160));
    const T = 0.07;
    const dome = new THREE.ExtrudeGeometry(sh, { depth: 0.02, bevelEnabled: true, bevelThickness: T, bevelSize: 0.022, bevelSegments: 10, curveSegments: 4, steps: 1 });
    dome.translate(0, 0, 0.012 + T);
    dome.computeVertexNormals();
    const m = add(dome, blisterMat, 0, 0, 0, false);
    m.renderOrder = 4;
    // kabarcığın karta yapıştığı kenar (ince parlak şerit)
    const rim = new THREE.Mesh(new THREE.ShapeGeometry(sh, 4), blisterEdge);
    rim.position.z = 0.006; rim.scale.set(1.035, 1.012, 1); rim.renderOrder = 3;
    group.add(rim); parts.push(rim);
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
    // ürün fotoğrafındaki gibi: kalın tabanlı kare cam şişe, siyah kapak, süslü altın etiket, uzun siyah çubuklar;
    // arkada solda ürünün kutusu
    const bw = 0.62, bh = 0.6, y0 = -0.95;
    const B = new THREE.Group(); B.position.set(0.27, 0, 0.1); B.rotation.y = -0.06; group.add(B); parts.push(B);
    const put = (geo, mat, x, y, z, shadow = true) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = shadow; m.receiveShadow = true; B.add(m); return m; };
    const body = put(new RoundedBoxGeometry(bw, bh, bw, 6, 0.045), glass, 0, y0 + bh / 2, 0);
    body.renderOrder = 2;
    put(new RoundedBoxGeometry(bw - 0.05, 0.11, bw - 0.05, 4, 0.03), thickGlass, 0, y0 + 0.07, 0, false).renderOrder = 1;
    const liq = put(new RoundedBoxGeometry(bw - 0.08, bh * 0.68, bw - 0.08, 4, 0.035), liquid, 0, y0 + 0.13 + bh * 0.34, 0, false);
    liq.renderOrder = 1;
    // boyun, yaka ve uzun siyah kapak
    put(new THREE.CylinderGeometry(0.08, 0.085, 0.05, 32), glass, 0, y0 + bh + 0.02, 0);
    put(new THREE.CylinderGeometry(0.125, 0.125, 0.045, 40), black, 0, y0 + bh + 0.045, 0);
    put(new THREE.CylinderGeometry(0.11, 0.115, 0.2, 40), black, 0, y0 + bh + 0.165, 0);
    put(new THREE.TorusGeometry(0.104, 0.01, 10, 40).rotateX(Math.PI / 2), black, 0, y0 + bh + 0.265, 0);
    const lab = put(new THREE.PlaneGeometry(0.47, 0.43), labelMat, 0, y0 + bh * 0.46, bw / 2 + 0.002, false);
    lab.renderOrder = 3;
    // 5 siyah çubuk: yelpaze gibi açılır
    const L = 1.32;
    const tilts = [[-0.24, 0.06], [-0.1, -0.09], [0.03, 0.07], [0.15, -0.06], [0.27, 0.04]];
    tilts.forEach(([rz, rx], i) => {
      const st = put(new THREE.CylinderGeometry(0.0095, 0.0095, L, 10), reedMat, 0, 0, 0);
      const base = new THREE.Vector3((i - 2) * 0.012, y0 + bh + 0.12, (i % 2 ? 0.01 : -0.01));
      st.rotation.set(rx, 0, -rz);
      const dir = new THREE.Vector3(0, 1, 0).applyEuler(st.rotation);
      st.position.copy(base).addScaledVector(dir, L / 2);
    });
    // kutu: kare taban, şişeden uzun; ön yüzü ve sol yanı kameraya dönük
    if (!opts.noBox) {
      const bxw = 0.6, bxh = 1.62;
      if (!boxMats[4].map || boxMats[4].userData.key !== md.label) {
        const fr = boxFront(md), sd = boxSide(md, 5), sd2 = boxSide(md, 9), tp = boxTop();
        // sağ, sol, üst, alt, ön, arka
        [sd2, sd, tp, tp, fr, fr].forEach((t, k) => { if (boxMats[k].map) boxMats[k].map.dispose(); boxMats[k].map = t; boxMats[k].emissiveMap = t; boxMats[k].needsUpdate = true; });
        boxMats[4].userData.key = md.label;
      }
      const box = new THREE.Mesh(new RoundedBoxGeometry(bxw, bxh, bxw, 3, 0.012), boxMats);
      box.position.set(-0.3, y0 + bxh / 2, -0.36); box.rotation.y = 0.24;
      box.castShadow = true; box.receiveShadow = true;
      group.add(box); parts.push(box);
    }
    liquid.color.set(md.liquid);
    liquid.emissive.set(md.liquid).multiplyScalar(0.38);
    height = Math.max(1.62, bh + 0.12 + L * 0.97);
    // grubu dikeyde ortala (taban -height/2'de)
    group.children.forEach((c) => { if (parts.includes(c)) c.position.y += -height / 2 - y0; });
  }

  // sahnede görünen boy (paketle aynı alana sığsın)
  const FIT = { card: 1.3, blister: 1.36, vial: 1.36, reed: 1.36 };
  function build(md) {
    clear();
    if (md.type === 'card') buildCard(md);
    else if (md.type === 'blister') buildBlister(md);
    else if (md.type === 'vial') buildVial(md);
    else buildReed(md);
    if (DIM < 1) { liquid.color.multiplyScalar(DIM); liquid.emissive.multiplyScalar(DIM); }
    const k = FIT[md.type] / height;
    group.scale.setScalar(k);
    height *= k;
    if (md.type === 'vial' || md.type === 'reed') {
      if (labelMat.map) labelMat.map.dispose();
      const t = md.type === 'reed' ? reedLabel(md) : labelCanvas(md, md.type);
      labelMat.map = t; labelMat.emissiveMap = t; labelMat.needsUpdate = true;
    }
  }

  // geçişte yumuşak çözülme: tüm malzemelerin saydamlığı birlikte azalır / artar
  const fadeMats = [...mats, embossMat, blisterMat, blisterEdge, thickGlass];
  fadeMats.forEach((m) => { m.userData.op = m.opacity; m.userData.tr = m.transparent; });
  let fadeNow = 1;
  function setOpacity(a) {
    a = Math.max(0, Math.min(1, a));
    if (Math.abs(a - fadeNow) < 1e-4) return;
    const full = a >= 0.999;
    fadeMats.forEach((m) => {
      const tr = full ? m.userData.tr : true;
      if (m.transparent !== tr) { m.transparent = tr; m.needsUpdate = true; }
      m.opacity = m.userData.op * (full ? 1 : a);
    });
    fadeNow = full ? 1 : a;
  }

  return {
    group,
    setOpacity,
    show(md, tex, back) {
      const id = JSON.stringify(md);
      if (id !== key) { key = id; build(md); }
      if (md.type === 'card' || md.type === 'blister') {
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
