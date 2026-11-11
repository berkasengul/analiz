// BerkAİ Stüdyo ofisi: sahne kurulumu. Her şey kodla çizilir; karakterler KayKit (CC0).
// Rastgelelik tohumludur; hareket yalnızca t (saniye) değerine bağlıdır -> tur deterministik.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/GLTFLoader.js';
import * as SkeletonUtils from 'three/addons/SkeletonUtils.js';
import { RoomEnvironment } from 'three/addons/RoomEnvironment.js';

export function tohum(s) { let a = s >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const FB = '"Iowan Old Style","Palatino Linotype",Palatino,Georgia,"DejaVu Serif",serif';
const FG = 'system-ui,-apple-system,"Segoe UI",Roboto,Arial,"DejaVu Sans",sans-serif';
const doku = (c, tekrar) => { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; if (tekrar) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(tekrar[0], tekrar[1]); } return t; };
const tuval = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; };

// ekiplerin ofisteki yerleri (x, z) ve bakış yönleri
export const YERLER = {
  konu: { x: -10.5, z: -4.2, renk: '#e4572e' },
  yapim: { x: -2.5, z: -4.2, renk: '#f2a541' },
  musteri: { x: -10.5, z: 4.4, renk: '#4c9f70' },
  site: { x: -2.5, z: 4.4, renk: '#3d7ea6' },
  mail: { x: 5.5, z: 4.4, renk: '#b56576' },
  mudur: { x: 12.4, z: -5.6, renk: '#d9a441' },
};
export const SINIR = { x0: -15.4, x1: 15.4, z0: -9.3, z1: 9.4 };

function ahsapDoku() {
  const [c, g] = tuval(1024, 1024), r = tohum(5); g.fillStyle = '#8a5a34'; g.fillRect(0, 0, 1024, 1024);
  for (let i = 0; i < 8; i++) { let x = 0; while (x < 1024) { const w = 180 + r() * 260, k = .82 + r() * .3; g.fillStyle = `rgb(${138 * k | 0},${90 * k | 0},${52 * k | 0})`; g.fillRect(x, i * 128, w - 3, 125); g.strokeStyle = 'rgba(60,35,15,.25)'; for (let q = 0; q < 5; q++) { g.beginPath(); const y = i * 128 + 10 + r() * 105; g.moveTo(x, y); g.bezierCurveTo(x + w * .3, y + r() * 8 - 4, x + w * .6, y + r() * 8 - 4, x + w, y); g.stroke(); } x += w; } }
  return doku(c, [8, 5]);
}
function manzaraDoku() {
  const W = 4096, H = 1024, [c, g] = tuval(W, H), r = tohum(1453), uf = H * .6;
  let gr = g.createLinearGradient(0, 0, 0, uf); gr.addColorStop(0, '#16224a'); gr.addColorStop(.38, '#5b3f77'); gr.addColorStop(.68, '#d76b6b'); gr.addColorStop(.9, '#f6a85e'); gr.addColorStop(1, '#ffd08a'); g.fillStyle = gr; g.fillRect(0, 0, W, uf);
  const gx = W * .58, gy = uf - 46; gr = g.createRadialGradient(gx, gy, 0, gx, gy, 620); gr.addColorStop(0, 'rgba(255,244,210,1)'); gr.addColorStop(.06, 'rgba(255,225,160,.95)'); gr.addColorStop(.3, 'rgba(255,170,100,.35)'); gr.addColorStop(1, 'rgba(255,150,90,0)'); g.fillStyle = gr; g.fillRect(0, 0, W, uf);
  for (let i = 0; i < 46; i++) { const x = r() * W, y = 60 + r() * uf * .6, w = 160 + r() * 520, h = 10 + r() * 26; gr = g.createRadialGradient(x, y, 0, x, y, w); gr.addColorStop(0, `rgba(255,${170 + r() * 50 | 0},${150 + r() * 40 | 0},.3)`); gr.addColorStop(1, 'rgba(255,190,160,0)'); g.save(); g.translate(x, y); g.scale(1, h / w * 3); g.translate(-x, -y); g.fillStyle = gr; g.fillRect(x - w, y - w, w * 2, w * 2); g.restore(); }
  for (let i = 0; i < 90; i++) { g.fillStyle = `rgba(255,255,255,${.2 + r() * .5})`; g.fillRect(r() * W, r() * uf * .32, 2, 2); }
  // su
  gr = g.createLinearGradient(0, uf, 0, H); gr.addColorStop(0, '#f0a069'); gr.addColorStop(.12, '#b96a6e'); gr.addColorStop(.5, '#4a4474'); gr.addColorStop(1, '#1c2348'); g.fillStyle = gr; g.fillRect(0, uf, W, H - uf);
  for (let i = 0; i < 1500; i++) { const y = uf + Math.pow(r(), 1.6) * (H - uf), yak = (y - uf) / (H - uf), sp = 60 + yak * 520, x = gx + (r() - .5) * sp * 2 * (r() < .7 ? 1 : 3.2); g.fillStyle = `rgba(255,${205 + r() * 40 | 0},${140 + r() * 50 | 0},${(.22 + r() * .5) * (1 - yak * .5)})`; g.fillRect(x, y, 10 + r() * 46 * (0.4 + yak), 1.5 + yak * 2.5); }
  for (let i = 0; i < 900; i++) { const y = uf + r() * (H - uf); g.fillStyle = `rgba(20,20,60,${.05 + r() * .1})`; g.fillRect(r() * W, y, 20 + r() * 90, 1.5); }
  // karşı kıyı tepeleri
  const tepe = (y0, amp, renk, s) => { const q = tohum(s); const f = [q() * 6, q() * 6, q() * 6]; g.fillStyle = renk; g.beginPath(); g.moveTo(0, uf + 2); for (let x = 0; x <= W; x += 8) g.lineTo(x, y0 - amp * (.5 + .5 * Math.sin(x * .0016 + f[0])) - amp * .35 * Math.sin(x * .0052 + f[1]) - amp * .12 * Math.sin(x * .019 + f[2])); g.lineTo(W, uf + 2); g.fill(); };
  tepe(uf - 6, 62, '#6e4a78', 3); tepe(uf - 2, 40, '#4a3563', 4);
  for (let i = 0; i < 1300; i++) { const x = r() * W, y = uf - 4 - r() * 44; g.fillStyle = `rgba(255,${200 + r() * 55 | 0},${120 + r() * 80 | 0},${.35 + r() * .6})`; g.fillRect(x, y, 2, 2); }
  // köprü
  const kx0 = W * .50, kx1 = W * .80, ky = uf - 40, kule = [kx0 + (kx1 - kx0) * .2, kx0 + (kx1 - kx0) * .8], ku = 128;
  g.strokeStyle = '#2a2140'; g.lineWidth = 6; g.beginPath(); g.moveTo(kx0 - 60, ky); g.lineTo(kx1 + 60, ky); g.stroke();
  g.fillStyle = '#2a2140'; for (const x of kule) { g.fillRect(x - 9, ky - ku, 6, ku + 44); g.fillRect(x + 3, ky - ku, 6, ku + 44); g.fillRect(x - 9, ky - ku, 18, 5); g.fillRect(x - 9, ky - ku * .55, 18, 4); }
  g.lineWidth = 3; g.beginPath(); for (let i = 0; i <= 80; i++) { const u = i / 80, x = kule[0] + (kule[1] - kule[0]) * u, y = ky - ku + (ku - 14) * (1 - Math.pow(2 * u - 1, 2)); i ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke();
  for (const [a, b] of [[kx0 - 60, kule[0]], [kule[1], kx1 + 60]]) { g.beginPath(); g.moveTo(a === kx0 - 60 ? a : a, a === kx0 - 60 ? ky : ky - ku); g.lineTo(b, b === kule[0] ? ky - ku : ky); g.stroke(); }
  g.lineWidth = 1; for (let i = 1; i < 40; i++) { const u = i / 40, x = kule[0] + (kule[1] - kule[0]) * u, y = ky - ku + (ku - 14) * (1 - Math.pow(2 * u - 1, 2)); g.beginPath(); g.moveTo(x, y); g.lineTo(x, ky); g.stroke(); }
  for (let x = kx0 - 50; x < kx1 + 50; x += 14) { g.fillStyle = 'rgba(255,220,150,.95)'; g.fillRect(x, ky - 5, 3, 3); }
  for (const x of kule) { g.fillStyle = 'rgba(255,90,70,.95)'; g.fillRect(x - 2, ky - ku - 8, 5, 5); }
  // yakın kıyı silueti: binalar, cami, kule
  const sil = '#1a1530', isik = () => `rgba(255,${190 + r() * 60 | 0},${110 + r() * 70 | 0},${.5 + r() * .5})`;
  const binalar = (xa, xb, taban, yuk) => { let x = xa; while (x < xb) { const w = 26 + r() * 60, h = yuk * (.35 + r() * .65); g.fillStyle = sil; g.fillRect(x, taban - h, w, h + 30); if (r() < .3) { g.beginPath(); g.moveTo(x - 3, taban - h); g.lineTo(x + w / 2, taban - h - 14); g.lineTo(x + w + 3, taban - h); g.fill(); } for (let i = 0; i < w * h / 240; i++) { g.fillStyle = isik(); g.fillRect(x + 4 + r() * (w - 9), taban - h + 5 + r() * (h - 6), 3, 4); } x += w + r() * 5; } };
  const cami = (cx, taban, s) => { g.fillStyle = sil; g.fillRect(cx - 150 * s, taban - 70 * s, 300 * s, 100 * s); g.beginPath(); g.arc(cx, taban - 70 * s, 92 * s, Math.PI, 0); g.fill(); for (const d of [-112, 112]) { g.beginPath(); g.arc(cx + d * s, taban - 62 * s, 52 * s, Math.PI, 0); g.fill(); } g.fillRect(cx - 2, taban - 182 * s, 4, 24 * s);
    for (const d of [-210, -168, 168, 210]) { const mh = (Math.abs(d) > 200 ? 240 : 285) * s, x = cx + d * s; g.fillRect(x - 5 * s, taban - mh, 10 * s, mh + 20); g.beginPath(); g.moveTo(x - 7 * s, taban - mh); g.lineTo(x, taban - mh - 44 * s); g.lineTo(x + 7 * s, taban - mh); g.fill(); g.fillRect(x - 9 * s, taban - mh * .62, 18 * s, 5 * s); g.fillRect(x - 9 * s, taban - mh * .82, 18 * s, 4 * s); }
    for (let i = 0; i < 26; i++) { g.fillStyle = isik(); g.fillRect(cx - 140 * s + r() * 280 * s, taban - 60 * s + r() * 60 * s, 3, 5); } };
  const galata = (cx, taban, s) => { g.fillStyle = sil; g.fillRect(cx - 30 * s, taban - 190 * s, 60 * s, 200 * s); g.fillRect(cx - 36 * s, taban - 200 * s, 72 * s, 12 * s); g.fillRect(cx - 26 * s, taban - 226 * s, 52 * s, 28 * s); g.beginPath(); g.moveTo(cx - 32 * s, taban - 226 * s); g.lineTo(cx, taban - 312 * s); g.lineTo(cx + 32 * s, taban - 226 * s); g.fill(); for (let i = 0; i < 7; i++) { g.fillStyle = isik(); g.fillRect(cx - 22 * s + i * 7 * s, taban - 216 * s, 4 * s, 9 * s); } };
  const kiyi = uf + 26;
  binalar(0, W * .46, kiyi, 130); binalar(W * .86, W, kiyi, 120); binalar(0, W * .2, kiyi + 8, 190);
  cami(W * .30, kiyi, 1.0); cami(W * .115, kiyi, .72); galata(W * .405, kiyi, .95); cami(W * .93, kiyi, .6);
  g.fillStyle = sil; g.fillRect(0, kiyi, W * .47, 14); g.fillRect(W * .855, kiyi, W * .15, 14);
  // Kız Kulesi
  const qx = W * .485, qy = uf + 70; g.fillStyle = '#221a38'; g.fillRect(qx - 34, qy - 12, 68, 14); g.fillRect(qx - 12, qy - 58, 24, 48); g.fillRect(qx - 16, qy - 62, 32, 6); g.beginPath(); g.moveTo(qx - 12, qy - 62); g.lineTo(qx, qy - 92); g.lineTo(qx + 12, qy - 62); g.fill(); g.fillStyle = 'rgba(255,220,150,.95)'; g.fillRect(qx - 4, qy - 44, 8, 9);
  const t = doku(c); t.wrapS = THREE.ClampToEdgeWrapping; return t;
}
function panoDoku(ekip, renk) {
  const [c, g] = tuval(1280, 720); g.fillStyle = '#14110f'; g.fillRect(0, 0, 1280, 720); g.fillStyle = renk; g.fillRect(0, 0, 1280, 150);
  g.fillStyle = '#17110b'; g.font = `600 30px ${FG}`; g.textBaseline = 'middle'; g.fillText((ekip.kisa || '').toUpperCase(), 54, 46);
  g.font = `500 68px ${FB}`; g.fillText(ekip.ad, 52, 102);
  g.fillStyle = '#f6efe4'; g.font = `400 40px ${FG}`; let y = 220;
  for (const s of (ekip.pano || []).slice(0, 5)) { g.fillStyle = renk; g.beginPath(); g.arc(70, y, 9, 0, 7); g.fill(); g.fillStyle = '#f6efe4'; satirYaz(g, s, 100, y, 1120, 50); y += satirSay(g, s, 1120) * 50 + 28; if (y > 650) break; }
  g.fillStyle = 'rgba(246,239,228,.55)'; g.font = `400 26px ${FG}`; g.fillText('Yaklaş · E ile aç', 54, 690);
  return doku(c);
}
function satirSay(g, s, w) { let n = 1, l = ''; for (const k of s.split(' ')) { if (g.measureText(l + k).width > w && l) { n++; l = ''; } l += k + ' '; } return n; }
function satirYaz(g, s, x, y, w, lh) { let l = ''; for (const k of s.split(' ')) { if (g.measureText(l + k).width > w && l) { g.fillText(l, x, y); y += lh; l = ''; } l += k + ' '; } g.fillText(l, x, y); }
function monitorDoku(renk, s) {
  const [c, g] = tuval(256, 160), r = tohum(s); g.fillStyle = '#101418'; g.fillRect(0, 0, 256, 160); g.fillStyle = renk; g.fillRect(0, 0, 256, 16);
  for (let i = 0; i < 9; i++) { g.fillStyle = i % 4 === 0 ? renk : `rgba(220,230,240,${.35 + r() * .4})`; g.fillRect(14 + (i % 3 === 1 ? 14 : 0), 30 + i * 13, 50 + r() * 160, 6); }
  return doku(c);
}
function yaziDoku(yazi, alt) {
  const [c, g] = tuval(1024, 320); g.clearRect(0, 0, 1024, 320); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#3a281a'; g.font = `500 190px ${FB}`; g.fillText(yazi, 512, 135); g.fillStyle = '#8a6a4a'; g.font = `500 44px ${FG}`; g.fillText(alt.split('').join(' '), 512, 270); return doku(c);
}

export async function kur(renderer, VERI, ilerleme) {
  const scene = new THREE.Scene(); scene.background = new THREE.Color('#1b1626');
  const pm = new THREE.PMREMGenerator(renderer); scene.environment = pm.fromScene(new RoomEnvironment(), .04).texture; scene.environmentIntensity = .28;
  const M = (renk, o = {}) => new THREE.MeshStandardMaterial({ color: renk, roughness: .8, ...o });
  const kutu = (w, h, d, mat, x, y, z, ebeveyn = scene) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; ebeveyn.add(m); return m; };
  const engeller = [];           // [x0,x1,z0,z1]
  const engel = (x, z, w, d) => engeller.push([x - w / 2, x + w / 2, z - d / 2, z + d / 2]);

  // ---- ışık: gün batımı penceresinden + sıcak sarkıtlar ----
  scene.add(new THREE.HemisphereLight('#ffe2bd', '#4a3020', .85));
  const gunes = new THREE.DirectionalLight('#ffb070', 2.3); gunes.position.set(6, 9, -16); gunes.target.position.set(-2, 0, 3); scene.add(gunes, gunes.target);
  gunes.castShadow = true; gunes.shadow.mapSize.set(2048, 2048); Object.assign(gunes.shadow.camera, { left: -22, right: 22, top: 16, bottom: -16, near: 1, far: 50 }); gunes.shadow.bias = -.0006; gunes.shadow.normalBias = .03;

  // ---- kabuk ----
  const zemin = new THREE.Mesh(new THREE.PlaneGeometry(32, 20), new THREE.MeshStandardMaterial({ map: ahsapDoku(), roughness: .62, metalness: .02 })); zemin.rotation.x = -Math.PI / 2; zemin.receiveShadow = true; scene.add(zemin);
  const duvar = M('#ead9c2', { roughness: .95 }), koyu = M('#3b2a1e', { roughness: .7 }), acikAhsap = M('#c79a68', { roughness: .6 }), beyaz = M('#f4eee4'), metal = M('#2a2a2e', { roughness: .4, metalness: .7 });
  const tavan = new THREE.Mesh(new THREE.PlaneGeometry(32, 20), M('#2e2119', { roughness: 1 })); tavan.rotation.x = Math.PI / 2; tavan.position.y = 4.2; scene.add(tavan);
  for (let x = -14; x <= 14; x += 4) kutu(.22, .28, 20, koyu, x, 4.06, 0).castShadow = false;
  kutu(.3, 4.2, 20, duvar, -16.1, 2.1, 0); kutu(.3, 4.2, 20, duvar, 16.1, 2.1, 0);                 // batı, doğu
  kutu(13.6, 4.2, .3, duvar, -9.2, 2.1, 10.1); kutu(13.6, 4.2, .3, duvar, 9.2, 2.1, 10.1); kutu(4.8, 1.3, .3, duvar, 0, 3.55, 10.1); // güney + kapı boşluğu
  kutu(32, .3, .3, duvar, 0, .15, -10.1); kutu(32, .5, .3, duvar, 0, 3.95, -10.1);                // kuzey: korkuluk + üst
  for (let x = -16; x <= 16; x += 3.2) kutu(.12, 3.3, .16, metal, x, 2.1, -10.05);
  const cam = new THREE.Mesh(new THREE.PlaneGeometry(32, 3.3), new THREE.MeshPhysicalMaterial({ color: '#ffd9b0', transparent: true, opacity: .07, roughness: .02, metalness: 0, depthWrite: false })); cam.position.set(0, 2.1, -10.0); scene.add(cam);
  // manzara
  const manz = new THREE.Mesh(new THREE.CylinderGeometry(60, 60, 34, 64, 1, true, Math.PI * .68, Math.PI * .64), new THREE.MeshBasicMaterial({ map: manzaraDoku(), side: THREE.BackSide, toneMapped: false, fog: false })); manz.position.set(0, 3.2, 22); scene.add(manz);
  // vapur + martılar (3B, hareketli)
  const vapur = new THREE.Group(); const vg = new THREE.MeshBasicMaterial({ color: '#f1e6d6', toneMapped: false }), vk = new THREE.MeshBasicMaterial({ color: '#2a2038', toneMapped: false });
  vapur.add(new THREE.Mesh(new THREE.BoxGeometry(5.2, .7, 1.2), vk)); const ust = new THREE.Mesh(new THREE.BoxGeometry(4, .7, 1), vg); ust.position.y = .7; vapur.add(ust); const us2 = new THREE.Mesh(new THREE.BoxGeometry(2.4, .5, .9), vg); us2.position.y = 1.3; vapur.add(us2); const baca = new THREE.Mesh(new THREE.CylinderGeometry(.22, .26, .9, 12), new THREE.MeshBasicMaterial({ color: '#e4572e', toneMapped: false })); baca.position.set(-.3, 1.95, 0); vapur.add(baca);
  for (let i = 0; i < 9; i++) { const p = new THREE.Mesh(new THREE.PlaneGeometry(.22, .22), new THREE.MeshBasicMaterial({ color: '#ffd27a', toneMapped: false })); p.position.set(-1.7 + i * .42, .72, .51); vapur.add(p); }
  scene.add(vapur);
  const martilar = [], mr = tohum(9), mg = new THREE.BufferGeometry(); mg.setAttribute('position', new THREE.Float32BufferAttribute([-.5, .12, 0, 0, 0, 0, 0, 0, .14, .5, .12, 0, 0, 0, 0, 0, 0, .14], 3));
  for (let i = 0; i < 9; i++) { const m = new THREE.Mesh(mg, new THREE.MeshBasicMaterial({ color: '#fff4e6', side: THREE.DoubleSide, toneMapped: false })); m.userData = { r: 5 + mr() * 12, h: 4 + mr() * 6, f: mr() * 6.28, hz: .12 + mr() * .14, cx: (mr() - .5) * 26, cz: -22 - mr() * 12 }; scene.add(m); martilar.push(m); }

  // ---- müdür odası (cam bölme) ----
  const camMat = new THREE.MeshPhysicalMaterial({ color: '#bfe0e8', transparent: true, opacity: .16, roughness: .05, depthWrite: false, side: THREE.DoubleSide });
  const camDuvar = (w, x, z, yat) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, 3.3), camMat); m.position.set(x, 1.85, z); if (yat) m.rotation.y = Math.PI / 2; scene.add(m); kutu(yat ? .08 : w, .1, yat ? w : .08, metal, x, 3.55, z); kutu(yat ? .08 : w, .2, yat ? w : .08, metal, x, .1, z); engel(x, z, yat ? .25 : w, yat ? w : .25); };
  camDuvar(7.3, 12.35, -1.6, false);              // güney cam duvar
  camDuvar(2.6, 8.7, -8.6, true); camDuvar(3.4, 8.7, -3.3, true);   // batı cam duvar, ortada kapı boşluğu (z -7.3..-5.0)
  for (const z of [-7.3, -5.0]) kutu(.1, 3.5, .1, metal, 8.7, 1.75, z);
  const halı = (x, z, w, d, renk) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), M(renk, { roughness: 1 })); m.rotation.x = -Math.PI / 2; m.position.set(x, .012, z); m.receiveShadow = true; scene.add(m); };

  // ---- mobilya parçaları ----
  const ekranlar = [];   // tıklanabilir yüzeyler
  function masa(x, z, ry, renk, s) {
    const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; scene.add(g);
    kutu(1.7, .06, .85, acikAhsap, 0, .76, 0, g); for (const [a, b] of [[-.78, -.36], [.78, -.36], [-.78, .36], [.78, .36]]) kutu(.05, .76, .05, metal, a, .38, b, g);
    const mon = kutu(.82, .5, .04, metal, 0, 1.2, -.2, g); const e = new THREE.Mesh(new THREE.PlaneGeometry(.76, .44), new THREE.MeshBasicMaterial({ map: monitorDoku(renk, s), toneMapped: false })); e.position.set(0, 1.2, -.178); g.add(e); kutu(.06, .22, .06, metal, 0, .9, -.22, g); kutu(.3, .02, .2, metal, 0, .8, -.22, g);
    kutu(.5, .02, .18, M('#d8d2c8'), 0, .8, .14, g); kutu(.1, .12, .1, M(renk), .62, .85, .1, g);
    // sandalye
    kutu(.5, .07, .5, M('#2f2a2a'), 0, .5, .72, g); kutu(.5, .55, .07, M('#2f2a2a'), 0, .86, .96, g); kutu(.06, .46, .06, metal, 0, .25, .72, g); kutu(.46, .04, .46, metal, 0, .03, .72, g);
    engel(x, z, Math.abs(Math.cos(ry)) * 1.7 + Math.abs(Math.sin(ry)) * .85 + .2, Math.abs(Math.sin(ry)) * 1.7 + Math.abs(Math.cos(ry)) * .85 + .2);
    return g;
  }
  function bitki(x, z, s = 1) { const g = new THREE.Group(); g.position.set(x, 0, z); g.scale.setScalar(s); scene.add(g); const sak = new THREE.Mesh(new THREE.CylinderGeometry(.26, .2, .45, 20), M('#c9794e')); sak.position.y = .225; sak.castShadow = true; g.add(sak); const r = tohum(x * 31 + z * 7 | 0); for (let i = 0; i < 9; i++) { const y = new THREE.Mesh(new THREE.SphereGeometry(.22, 10, 8), M(i % 2 ? '#3f7d4a' : '#4f9458')); y.scale.set(.5, 1.6 + r(), .22); y.position.set((r() - .5) * .3, .9 + r() * .5, (r() - .5) * .3); y.rotation.set((r() - .5) * .9, r() * 6, (r() - .5) * .9); y.castShadow = true; g.add(y); } engel(x, z, .6, .6); }
  const lambalar = [];
  function lamba(x, z, renk = '#ffcf8a', guc = 26) { kutu(.02, 1.0, .02, metal, x, 3.7, z).castShadow = false; const k = new THREE.Mesh(new THREE.ConeGeometry(.42, .34, 24, 1, true), new THREE.MeshStandardMaterial({ color: '#2b2622', side: THREE.DoubleSide, roughness: .6 })); k.position.set(x, 3.1, z); scene.add(k); const a = new THREE.Mesh(new THREE.SphereGeometry(.11, 14, 10), new THREE.MeshBasicMaterial({ color: '#fff0c8', toneMapped: false })); a.position.set(x, 3.0, z); scene.add(a); const l = new THREE.PointLight(renk, guc, 11, 1.6); l.position.set(x, 2.9, z); scene.add(l); lambalar.push(l); }
  function pano(ekip, x, z, ry, renk) {
    const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; scene.add(g);
    kutu(3.36, 1.96, .08, metal, 0, 2.05, 0, g); kutu(.08, 1.1, .08, metal, -1.2, .55, 0, g); kutu(.08, 1.1, .08, metal, 1.2, .55, 0, g); kutu(3.0, .06, .5, metal, 0, .03, 0, g);
    const e = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 1.8), new THREE.MeshBasicMaterial({ map: panoDoku(ekip, renk), toneMapped: false })); e.position.set(0, 2.05, .045); g.add(e);
    engel(x, z, Math.abs(Math.cos(ry)) * 3.2 + .3, Math.abs(Math.sin(ry)) * 3.2 + .3); return e;
  }

  // ---- ekip alanları ----
  const E = Object.fromEntries(VERI.ekipler.map(e => [e.id, e]));
  const oturanlar = [];   // {x,z,ry}
  const alan = (id, pz, masalar) => { const y = YERLER[id]; halı(y.x, y.z, 6.6, 5.4, new THREE.Color(y.renk).lerp(new THREE.Color('#3a2a20'), .55).getStyle()); pano(E[id], y.x + (id === 'mail' ? 3.15 : -3.15), y.z, id === 'mail' ? -Math.PI / 2 : Math.PI / 2, y.renk); masalar.forEach(([dx, dz, ry], i) => { masa(y.x + dx, y.z + dz, ry, y.renk, id.length * 7 + i); oturanlar.push({ id, x: y.x + dx + Math.sin(ry) * .72, z: y.z + dz + Math.cos(ry) * .72, ry: ry + Math.PI }); }); lamba(y.x, y.z, '#ffcf8a', 24); };
  alan('konu', -1, [[-1.6, .2, 0], [1.6, .2, 0], [0, 1.9, Math.PI]]);
  alan('yapim', -1, [[-1.6, .2, 0], [1.6, .2, 0], [0, 1.9, Math.PI]]);
  alan('musteri', 1, [[-1.6, -.2, Math.PI], [1.6, -.2, Math.PI], [0, -1.9, 0]]);
  alan('site', 1, [[-1.6, -.2, Math.PI], [1.6, -.2, Math.PI]]);
  alan('mail', 1, [[-1.6, -.2, Math.PI], [1.6, -.2, Math.PI]]);
  // 3D site ekibinin demo ekranları (tıklanınca site açılır)
  const yukle = new THREE.TextureLoader();
  (VERI.siteler || []).slice(0, 3).forEach((s, i) => {
    const x = YERLER.site.x - 2.1 + i * 4.2 - ((VERI.siteler.length - 1) * 2.1 - 2.1), z = YERLER.site.z - 3.6;
    const g = new THREE.Group(); g.position.set(x, 0, z); scene.add(g);
    kutu(3.5, 2.06, .1, metal, 0, 1.75, 0, g); kutu(.1, .7, .1, metal, 0, .36, 0, g); kutu(1.2, .05, .5, metal, 0, .03, 0, g);
    const mat = new THREE.MeshBasicMaterial({ color: '#223', toneMapped: false }); if (s.gorsel) yukle.load(s.gorsel, t => { t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; mat.map = t; mat.color.set('#fff'); mat.needsUpdate = true; });
    const e = new THREE.Mesh(new THREE.PlaneGeometry(3.36, 1.89), mat); e.position.set(0, 1.75, -.056); e.rotation.y = Math.PI; g.add(e); e.userData.site = s; ekranlar.push(e);
    const [c2, g2] = tuval(1024, 96); g2.fillStyle = '#17110b'; g2.fillRect(0, 0, 1024, 96); g2.fillStyle = '#f6efe4'; g2.font = `500 44px ${FG}`; g2.textBaseline = 'middle'; g2.fillText(s.ad + ' · tıkla, aç', 28, 50);
    const et = new THREE.Mesh(new THREE.PlaneGeometry(3.36, .3), new THREE.MeshBasicMaterial({ map: doku(c2), toneMapped: false })); et.position.set(0, .62, -.056); et.rotation.y = Math.PI; g.add(et); et.userData.site = s; ekranlar.push(et);
    engel(x, z, 3.6, .5);
  });
  // müdür odası
  { const y = YERLER.mudur; halı(y.x, y.z, 6.4, 6.6, '#5a4326'); masa(y.x + .6, y.z - 1.4, 0, y.renk, 99); kutu(2.6, .06, 1.1, koyu, y.x + .6, .77, y.z - 1.4); pano(E.mudur, 15.85, y.z + .4, -Math.PI / 2, y.renk); lamba(y.x, y.z, '#ffd9a0', 22); bitki(15.2, -9.2, 1.3); bitki(9.4, -2.3, 1.1);
    kutu(1.6, .42, .7, M('#6b4a3a'), y.x - 1.6, .21, y.z + 2.6); kutu(1.6, .5, .16, M('#6b4a3a'), y.x - 1.6, .6, y.z + 2.95); engel(y.x - 1.6, y.z + 2.7, 1.8, .9); }
  // ortak alan: kahve köşesi, raflar, bitkiler, logo
  halı(5.5, -4.6, 5.2, 4.6, '#4a3a30'); kutu(2.2, .9, .7, koyu, 5.5, .45, -8.9); kutu(2.3, .05, .8, acikAhsap, 5.5, .92, -8.9); engel(5.5, -8.9, 2.4, .9);
  kutu(.34, .44, .3, metal, 5.0, 1.17, -8.95); for (let i = 0; i < 4; i++) kutu(.09, .11, .09, beyaz, 5.7 + i * .16, 1.0, -8.8);
  const sehpa = new THREE.Mesh(new THREE.CylinderGeometry(.6, .6, .06, 32), acikAhsap); sehpa.position.set(5.5, .46, -4.6); sehpa.castShadow = true; scene.add(sehpa); kutu(.08, .44, .08, metal, 5.5, .22, -4.6); engel(5.5, -4.6, 1.2, 1.2);
  for (const [dx, dz] of [[-1.5, 0], [1.5, 0]]) { kutu(.9, .42, .9, M('#b56b4a'), 5.5 + dx, .21, -4.6 + dz); kutu(.9, .5, .16, M('#b56b4a'), 5.5 + dx + (dx < 0 ? -.37 : .37), .6, -4.6).rotation.y = Math.PI / 2; engel(5.5 + dx, -4.6, 1, 1); }
  lamba(5.5, -4.6, '#ffc27a', 20); lamba(0, 7.2, '#ffd9a0', 18); lamba(-6.5, 0, '#ffd9a0', 14);
  for (const [x, z, s] of [[-15.2, -9.1, 1.4], [-6.6, -9.1, 1.2], [1.4, -9.1, 1.2], [-15.2, 9.2, 1.3], [-6.5, 9.2, 1.1], [15.2, 9.2, 1.4], [9.6, 9.2, 1.1], [3.2, 9.3, 1.0], [-3.2, 9.3, 1.0]]) bitki(x, z, s);
  // batı duvarı: logo + raf
  const logo = new THREE.Mesh(new THREE.PlaneGeometry(6.4, 2), new THREE.MeshBasicMaterial({ map: yaziDoku('BerkAİ', 'STÜDYO · İSTANBUL'), transparent: true })); logo.position.set(-15.94, 2.5, 0); logo.rotation.y = Math.PI / 2; scene.add(logo);
  { const r = tohum(77); for (const z of [6.2, -6.2]) { for (let k = 0; k < 3; k++) { kutu(.32, .05, 2.6, koyu, -15.78, 1.0 + k * .62, z); let p = z - 1.2; while (p < z + 1.1) { const w = .05 + r() * .07, h = .28 + r() * .2; kutu(.22, h, w, M(['#e4572e', '#f2a541', '#4c9f70', '#3d7ea6', '#b56576', '#efe6d6'][r() * 6 | 0]), -15.76, 1.03 + k * .62 + h / 2, p).castShadow = false; p += w + .012 + (r() < .12 ? .25 : 0); } } } }
  // doğu duvarı (müdür odası dışı): günün panosu
  { const [c, g] = tuval(1024, 640); g.fillStyle = '#f4eee4'; g.fillRect(0, 0, 1024, 640); g.fillStyle = '#3a281a'; g.font = `500 64px ${FB}`; g.fillText('Bugün', 50, 90); g.font = `400 34px ${FG}`; g.fillStyle = '#6a5140'; g.fillText(VERI.tarih_yazi || VERI.tarih, 50, 140); let y = 215; g.font = `400 34px ${FG}`; for (const e of VERI.ekipler) { g.fillStyle = YERLER[e.id].renk; g.fillRect(50, y - 22, 14, 34); g.fillStyle = '#2a1c12'; g.fillText(e.kisa + ': ' + (e.tek_satir || ''), 84, y, 900); y += 66; }
    const p = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 2.25), new THREE.MeshBasicMaterial({ map: doku(c), toneMapped: false })); p.position.set(15.93, 2.1, 4.6); p.rotation.y = -Math.PI / 2; scene.add(p); kutu(.06, 2.37, 3.72, koyu, 15.96, 2.1, 4.6); }
  // giriş: karşılama bankosu
  kutu(2.4, 1.05, .6, koyu, -3.6, .52, 8.2); kutu(2.5, .05, .7, acikAhsap, -3.6, 1.07, 8.2); engel(-3.6, 8.2, 2.6, .8);

  // ---- karakterler ----
  const yukleyici = new GLTFLoader(), adlar = ['Rogue', 'Mage', 'Knight', 'Barbarian', 'Rogue_Hooded'], modeller = {};
  let n = 0; await Promise.all(adlar.map(a => new Promise((ok, hata) => yukleyici.load('varlik/' + a + '.glb', g => { modeller[a] = g; ilerleme && ilerleme(++n / adlar.length); ok(); }, undefined, hata))));
  const GIZLE = /Sword|Shield|Axe|Mug|Knife|Crossbow|Throwable|Wand|Staff|Spellbook|Cape|Helmet|Hat/i;
  const kisiler = [];
  function kisi(model, renk, o) {
    const src = modeller[model], k = SkeletonUtils.clone(src.scene), ton = new THREE.Color(renk);
    k.traverse(m => { if (m.isMesh || m.isSkinnedMesh) { if (GIZLE.test(m.name)) { m.visible = false; return; } m.castShadow = true; m.frustumCulled = false; m.material = m.material.clone(); m.material.color.lerp(ton, .38); m.material.roughness = .85; m.material.metalness = 0; } });
    const kutuB = new THREE.Box3().setFromObject(k), boy = kutuB.max.y - kutuB.min.y; k.scale.setScalar(1.72 / boy);
    const mixer = new THREE.AnimationMixer(k), klip = ad => THREE.AnimationClip.findByName(src.animations, ad);
    const eylem = {}; for (const ad of ['Idle', 'Walking_A', 'Sit_Chair_Idle', 'Interact', 'Cheer']) { const c = klip(ad); if (c) { eylem[ad] = mixer.clipAction(c); eylem[ad].play(); eylem[ad].setEffectiveWeight(0); } }
    scene.add(k); const K = { k, mixer, eylem, faz: (kisiler.length * 1.37) % 5, ...o }; kisiler.push(K); return K;
  }
  const tonlar = ['#e8b89a', '#9ab8e8', '#b8e89a', '#e89ab8', '#e8dc9a', '#b89ae8', '#9ae8dc'];
  oturanlar.forEach((o, i) => kisi(adlar[i % adlar.length], tonlar[i % tonlar.length], { tur: 'otur', x: o.x, z: o.z, ry: o.ry, ekip: o.id }));
  // yürüyenler: masalar arasında dolaşan iki çalışan
  kisi('Mage', '#f2a541', { tur: 'yuru', yol: [[-14.2, -8.1], [3.0, -8.1]], hiz: 1.05, ekip: 'site', gidisDonus: true });
  kisi('Rogue', '#4c9f70', { tur: 'yuru', yol: [[4.0, 7.5], [14.2, 7.5], [14.2, 0.5], [10.2, 0.5]], hiz: .95, ekip: 'mail', gidisDonus: true });
  const mudur = kisi('Knight', '#d9a441', { tur: 'ayakta', x: YERLER.mudur.x - .9, z: YERLER.mudur.z - .7, ry: -.5, ekip: 'mudur' });
  kisi('Barbarian', '#b56576', { tur: 'ayakta', x: 4.6, z: -8.2, ry: Math.PI, ekip: 'yapim', anim: 'Interact' });

  function guncelle(t, durum = {}) {
    vapur.position.set(((t * 1.1 + 30) % 90) - 45, -2.9, -34); vapur.scale.setScalar(1.4);
    for (const m of martilar) { const u = m.userData, a = t * u.hz + u.f; m.position.set(u.cx + Math.cos(a) * u.r, u.h + Math.sin(a * 1.7) * .6, u.cz + Math.sin(a) * u.r * .5); m.rotation.y = -a; m.scale.set(1.3, 1 + Math.sin(t * 9 + u.f) * 2.2, 1.3); }
    lambalar.forEach((l, i) => { l.intensity = l.userData.g0 === undefined ? (l.userData.g0 = l.intensity) : l.userData.g0 * (1 + .03 * Math.sin(t * 2.1 + i * 1.7)); });
    for (const K of kisiler) {
      const e = K.eylem; let ad = 'Idle';
      if (K.tur === 'otur') { ad = 'Sit_Chair_Idle'; K.k.position.set(K.x, .13, K.z); K.k.rotation.y = K.ry; }
      else if (K.tur === 'yuru') {
        const P = K.gidisDonus ? K.yol.concat(K.yol.slice(1, -1).reverse()) : K.yol, L = []; let top = 0; for (let i = 0; i < P.length; i++) { const a = P[i], b = P[(i + 1) % P.length], d = Math.hypot(b[0] - a[0], b[1] - a[1]); L.push(d); top += d; }
        let s = (t * K.hiz + K.faz * 7) % top, i = 0; while (s > L[i]) { s -= L[i]; i++; } const a = P[i], b = P[(i + 1) % P.length], u = s / L[i];
        K.k.position.set(a[0] + (b[0] - a[0]) * u, 0, a[1] + (b[1] - a[1]) * u); K.k.rotation.y = Math.atan2(b[0] - a[0], b[1] - a[1]); ad = 'Walking_A';
      } else { K.k.position.set(K.x, 0, K.z); K.k.rotation.y = K.ry; ad = K.anim || 'Idle'; if (K === mudur && durum.sevinc) ad = 'Cheer'; }
      for (const k in e) e[k].setEffectiveWeight(k === ad ? 1 : 0);
      K.mixer.setTime(t * (ad === 'Walking_A' ? K.hiz * 1.05 : 1) + K.faz);
    }
  }
  return { scene, engeller, ekranlar, guncelle, kisiler };
}
