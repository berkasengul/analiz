// BerkAİ Stüdyo ofisi: sahne. Plan: ortada koridor, iki yanda ekip bölmeleri, koridorun sonunda müdür odası.
// Her şey kodla çizilir (karakterler dahil). Hareket yalnızca t (saniye) değerine bağlıdır -> tur deterministik.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/RoomEnvironment.js';

export function tohum(s) { let a = s >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const FB = '"Iowan Old Style","Palatino Linotype",Palatino,Georgia,"DejaVu Serif",serif';
const FG = 'system-ui,-apple-system,"Segoe UI",Roboto,Arial,"DejaVu Sans",sans-serif';
const doku = (c, tekrar) => { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; if (tekrar) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(tekrar[0], tekrar[1]); } return t; };
const tuval = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; };

// ---- plan ----
export const BOLME = {
  konu: { no: 1, yan: -1, z0: 5.5, z1: 11, renk: '#d9673f' },
  yapim: { no: 2, yan: -1, z0: 0, z1: 5.5, renk: '#e0a13c' },
  musteri: { no: 3, yan: -1, z0: -5.5, z1: 0, renk: '#4f9a72' },
  site: { no: 4, yan: 1, z0: 3.5, z1: 11, renk: '#4a86ad' },
  mail: { no: 5, yan: 1, z0: -2, z1: 3.5, renk: '#b3677a' },
  mudur: { no: 6, yan: 0, z0: -12, z1: -6.5, renk: '#c99a3e' },
};
export const YERLER = Object.fromEntries(Object.entries(BOLME).map(([k, b]) => [k, { x: b.yan * 6.7, z: (b.z0 + b.z1) / 2, renk: b.renk, no: b.no }]));
export const SINIR = { x0: -10.5, x1: 10.5, z0: -11.5, z1: 11.5 };
export const hangiBolme = (x, z) => { if (Math.abs(x) < 4.5 && z < -6.5) return 'mudur'; for (const [k, b] of Object.entries(BOLME)) if (b.yan && x * b.yan > 2.6 && z > b.z0 && z < b.z1) return k; return null; };

function ahsapDoku() {
  const [c, g] = tuval(1024, 1024), r = tohum(5); g.fillStyle = '#9a6a42'; g.fillRect(0, 0, 1024, 1024);
  for (let i = 0; i < 8; i++) { let x = 0; while (x < 1024) { const w = 200 + r() * 260, k = .9 + r() * .16; g.fillStyle = `rgb(${154 * k | 0},${106 * k | 0},${66 * k | 0})`; g.fillRect(x, i * 128, w - 2, 126); x += w; } }
  return doku(c, [6, 6]);
}
function manzaraDoku() {
  const W = 4096, H = 1024, [c, g] = tuval(W, H), r = tohum(1453), uf = H * .6;
  let gr = g.createLinearGradient(0, 0, 0, uf); gr.addColorStop(0, '#16224a'); gr.addColorStop(.38, '#5b3f77'); gr.addColorStop(.68, '#d76b6b'); gr.addColorStop(.9, '#f6a85e'); gr.addColorStop(1, '#ffd08a'); g.fillStyle = gr; g.fillRect(0, 0, W, uf);
  const gx = W * .58, gy = uf - 46; gr = g.createRadialGradient(gx, gy, 0, gx, gy, 620); gr.addColorStop(0, 'rgba(255,244,210,1)'); gr.addColorStop(.06, 'rgba(255,225,160,.95)'); gr.addColorStop(.3, 'rgba(255,170,100,.35)'); gr.addColorStop(1, 'rgba(255,150,90,0)'); g.fillStyle = gr; g.fillRect(0, 0, W, uf);
  for (let i = 0; i < 46; i++) { const x = r() * W, y = 60 + r() * uf * .6, w = 160 + r() * 520, h = 10 + r() * 26; gr = g.createRadialGradient(x, y, 0, x, y, w); gr.addColorStop(0, `rgba(255,${170 + r() * 50 | 0},${150 + r() * 40 | 0},.3)`); gr.addColorStop(1, 'rgba(255,190,160,0)'); g.save(); g.translate(x, y); g.scale(1, h / w * 3); g.translate(-x, -y); g.fillStyle = gr; g.fillRect(x - w, y - w, w * 2, w * 2); g.restore(); }
  for (let i = 0; i < 90; i++) { g.fillStyle = `rgba(255,255,255,${.2 + r() * .5})`; g.fillRect(r() * W, r() * uf * .32, 2, 2); }
  gr = g.createLinearGradient(0, uf, 0, H); gr.addColorStop(0, '#f0a069'); gr.addColorStop(.12, '#b96a6e'); gr.addColorStop(.5, '#4a4474'); gr.addColorStop(1, '#1c2348'); g.fillStyle = gr; g.fillRect(0, uf, W, H - uf);
  for (let i = 0; i < 1500; i++) { const y = uf + Math.pow(r(), 1.6) * (H - uf), yak = (y - uf) / (H - uf), sp = 60 + yak * 520, x = gx + (r() - .5) * sp * 2 * (r() < .7 ? 1 : 3.2); g.fillStyle = `rgba(255,${205 + r() * 40 | 0},${140 + r() * 50 | 0},${(.22 + r() * .5) * (1 - yak * .5)})`; g.fillRect(x, y, 10 + r() * 46 * (0.4 + yak), 1.5 + yak * 2.5); }
  for (let i = 0; i < 900; i++) { const y = uf + r() * (H - uf); g.fillStyle = `rgba(20,20,60,${.05 + r() * .1})`; g.fillRect(r() * W, y, 20 + r() * 90, 1.5); }
  const tepe = (y0, amp, renk, s) => { const q = tohum(s); const f = [q() * 6, q() * 6, q() * 6]; g.fillStyle = renk; g.beginPath(); g.moveTo(0, uf + 2); for (let x = 0; x <= W; x += 8) g.lineTo(x, y0 - amp * (.5 + .5 * Math.sin(x * .0016 + f[0])) - amp * .35 * Math.sin(x * .0052 + f[1]) - amp * .12 * Math.sin(x * .019 + f[2])); g.lineTo(W, uf + 2); g.fill(); };
  tepe(uf - 6, 62, '#6e4a78', 3); tepe(uf - 2, 40, '#4a3563', 4);
  for (let i = 0; i < 1300; i++) { const x = r() * W, y = uf - 4 - r() * 44; g.fillStyle = `rgba(255,${200 + r() * 55 | 0},${120 + r() * 80 | 0},${.35 + r() * .6})`; g.fillRect(x, y, 2, 2); }
  const kx0 = W * .50, kx1 = W * .80, ky = uf - 40, kule = [kx0 + (kx1 - kx0) * .2, kx0 + (kx1 - kx0) * .8], ku = 128;
  g.strokeStyle = '#2a2140'; g.lineWidth = 6; g.beginPath(); g.moveTo(kx0 - 60, ky); g.lineTo(kx1 + 60, ky); g.stroke();
  g.fillStyle = '#2a2140'; for (const x of kule) { g.fillRect(x - 9, ky - ku, 6, ku + 44); g.fillRect(x + 3, ky - ku, 6, ku + 44); g.fillRect(x - 9, ky - ku, 18, 5); g.fillRect(x - 9, ky - ku * .55, 18, 4); }
  g.lineWidth = 3; g.beginPath(); for (let i = 0; i <= 80; i++) { const u = i / 80, x = kule[0] + (kule[1] - kule[0]) * u, y = ky - ku + (ku - 14) * (1 - Math.pow(2 * u - 1, 2)); i ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke();
  g.beginPath(); g.moveTo(kx0 - 60, ky); g.lineTo(kule[0], ky - ku); g.moveTo(kule[1], ky - ku); g.lineTo(kx1 + 60, ky); g.stroke();
  g.lineWidth = 1; for (let i = 1; i < 40; i++) { const u = i / 40, x = kule[0] + (kule[1] - kule[0]) * u, y = ky - ku + (ku - 14) * (1 - Math.pow(2 * u - 1, 2)); g.beginPath(); g.moveTo(x, y); g.lineTo(x, ky); g.stroke(); }
  for (let x = kx0 - 50; x < kx1 + 50; x += 14) { g.fillStyle = 'rgba(255,220,150,.95)'; g.fillRect(x, ky - 5, 3, 3); }
  const sil = '#1a1530', isik = () => `rgba(255,${190 + r() * 60 | 0},${110 + r() * 70 | 0},${.5 + r() * .5})`;
  const binalar = (xa, xb, taban, yuk) => { let x = xa; while (x < xb) { const w = 26 + r() * 60, h = yuk * (.35 + r() * .65); g.fillStyle = sil; g.fillRect(x, taban - h, w, h + 30); for (let i = 0; i < w * h / 240; i++) { g.fillStyle = isik(); g.fillRect(x + 4 + r() * (w - 9), taban - h + 5 + r() * (h - 6), 3, 4); } x += w + r() * 5; } };
  const cami = (cx, taban, s) => { g.fillStyle = sil; g.fillRect(cx - 150 * s, taban - 70 * s, 300 * s, 100 * s); g.beginPath(); g.arc(cx, taban - 70 * s, 92 * s, Math.PI, 0); g.fill(); for (const d of [-112, 112]) { g.beginPath(); g.arc(cx + d * s, taban - 62 * s, 52 * s, Math.PI, 0); g.fill(); } g.fillRect(cx - 2, taban - 182 * s, 4, 24 * s);
    for (const d of [-210, -168, 168, 210]) { const mh = (Math.abs(d) > 200 ? 240 : 285) * s, x = cx + d * s; g.fillRect(x - 5 * s, taban - mh, 10 * s, mh + 20); g.beginPath(); g.moveTo(x - 7 * s, taban - mh); g.lineTo(x, taban - mh - 44 * s); g.lineTo(x + 7 * s, taban - mh); g.fill(); g.fillRect(x - 9 * s, taban - mh * .62, 18 * s, 5 * s); }
    for (let i = 0; i < 26; i++) { g.fillStyle = isik(); g.fillRect(cx - 140 * s + r() * 280 * s, taban - 60 * s + r() * 60 * s, 3, 5); } };
  const galata = (cx, taban, s) => { g.fillStyle = sil; g.fillRect(cx - 30 * s, taban - 190 * s, 60 * s, 200 * s); g.fillRect(cx - 36 * s, taban - 200 * s, 72 * s, 12 * s); g.fillRect(cx - 26 * s, taban - 226 * s, 52 * s, 28 * s); g.beginPath(); g.moveTo(cx - 32 * s, taban - 226 * s); g.lineTo(cx, taban - 312 * s); g.lineTo(cx + 32 * s, taban - 226 * s); g.fill(); for (let i = 0; i < 7; i++) { g.fillStyle = isik(); g.fillRect(cx - 22 * s + i * 7 * s, taban - 216 * s, 4 * s, 9 * s); } };
  const kiyi = uf + 26;
  binalar(0, W * .46, kiyi, 130); binalar(W * .86, W, kiyi, 120); binalar(0, W * .2, kiyi + 8, 190);
  cami(W * .30, kiyi, 1.0); cami(W * .115, kiyi, .72); galata(W * .405, kiyi, .95); cami(W * .93, kiyi, .6);
  g.fillStyle = sil; g.fillRect(0, kiyi, W * .47, 14); g.fillRect(W * .855, kiyi, W * .15, 14);
  const qx = W * .485, qy = uf + 70; g.fillStyle = '#221a38'; g.fillRect(qx - 34, qy - 12, 68, 14); g.fillRect(qx - 12, qy - 58, 24, 48); g.fillRect(qx - 16, qy - 62, 32, 6); g.beginPath(); g.moveTo(qx - 12, qy - 62); g.lineTo(qx, qy - 92); g.lineTo(qx + 12, qy - 62); g.fill(); g.fillStyle = 'rgba(255,220,150,.95)'; g.fillRect(qx - 4, qy - 44, 8, 9);
  const t = doku(c); t.wrapS = THREE.ClampToEdgeWrapping; return t;
}
function sar(g, s, x, y, w, lh, max = 9) { let l = '', n = 0; for (const k of s.split(' ')) { if (g.measureText(l + k).width > w && l) { g.fillText(l.trim(), x, y); y += lh; l = ''; if (++n >= max) return y; } l += k + ' '; } g.fillText(l.trim(), x, y); return y + lh; }
function tabelaDoku(no, ad, satir, renk) {
  const [c, g] = tuval(1400, 400); g.fillStyle = '#1b1612'; g.fillRect(0, 0, 1400, 400); g.fillStyle = renk; g.fillRect(0, 0, 330, 400);
  g.fillStyle = '#1b1612'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `600 300px ${FB}`; g.fillText(String(no), 165, 215);
  g.textAlign = 'left'; g.fillStyle = '#f6efe4'; g.font = `500 118px ${FB}`; g.fillText(ad, 380, 150, 980); g.fillStyle = renk; g.font = `500 62px ${FG}`; g.fillText(satir || '', 384, 300, 980);
  return doku(c);
}
function panoDoku(ekip, renk) {
  const [c, g] = tuval(1280, 720); g.fillStyle = '#f5efe4'; g.fillRect(0, 0, 1280, 720); g.fillStyle = renk; g.fillRect(0, 0, 1280, 18);
  g.fillStyle = '#2a1c12'; g.textBaseline = 'middle'; g.font = `500 64px ${FB}`; g.fillText('Bugün', 56, 92); g.font = `400 44px ${FG}`; let y = 196;
  for (const s of (ekip.pano || []).slice(0, 4)) { g.fillStyle = renk; g.beginPath(); g.arc(74, y, 11, 0, 7); g.fill(); g.fillStyle = '#2a1c12'; y = sar(g, s, 108, y, 1110, 56, 2) + 34; if (y > 650) break; }
  return doku(c);
}
function monitorDoku(renk, s) {
  const [c, g] = tuval(256, 160), r = tohum(s); g.fillStyle = '#f2f0ea'; g.fillRect(0, 0, 256, 160); g.fillStyle = renk; g.fillRect(0, 0, 256, 18);
  for (let i = 0; i < 9; i++) { g.fillStyle = i % 4 === 0 ? renk : `rgba(60,60,70,${.3 + r() * .4})`; g.fillRect(14 + (i % 3 === 1 ? 14 : 0), 32 + i * 13, 50 + r() * 160, 6); }
  return doku(c);
}
function yaziDoku(yazi, alt) { const [c, g] = tuval(1024, 320); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#3a281a'; g.font = `500 190px ${FB}`; g.fillText(yazi, 512, 135); g.fillStyle = '#8a6a4a'; g.font = `500 44px ${FG}`; g.fillText(alt, 512, 270); return doku(c); }
function etiketDoku(yazi) { const [c, g] = tuval(1024, 110); g.fillStyle = '#1b1612'; g.fillRect(0, 0, 1024, 110); g.fillStyle = '#f6efe4'; g.font = `500 56px ${FG}`; g.textBaseline = 'middle'; g.textAlign = 'center'; g.fillText(yazi, 512, 58, 980); return doku(c); }

// ---- kodla çizilen insanlar (ofis kıyafetli) ----
const TEN = ['#f0c9a4', '#e2b08a', '#c98e62', '#f4d3b5', '#a8744c', '#e8bd98'], SAC = ['#2b1d14', '#5a3a22', '#111111', '#8a5a2e', '#c9a25a', '#3a2a22', '#7a7a80'];
const matCache = {}; const MAT = (renk, o) => { const k = renk + JSON.stringify(o || ''); return matCache[k] || (matCache[k] = new THREE.MeshStandardMaterial({ color: renk, roughness: .82, ...(o || {}) })); };
const UYLUK = .42, BALDIR = .44, AYAK = .09, KALCA = UYLUK + BALDIR + AYAK, GOVDE = .5;
export function insan(o) {
  const kok = new THREE.Group(), ten = MAT(o.ten), ust = MAT(o.ust), alt = MAT(o.alt || '#34384a'), ayk = MAT(o.ayakkabi || '#2a2422'), sac = MAT(o.sac);
  const mesh = (geo, mat, x = 0, y = 0, z = 0, eb = kok) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; eb.add(m); return m; };
  const beden = new THREE.Group(); beden.position.y = KALCA; kok.add(beden);
  const govde = new THREE.Group(); beden.add(govde);
  const gg = new THREE.CapsuleGeometry(.165, GOVDE - .2, 6, 16); const gm = mesh(gg, ust, 0, GOVDE / 2 + .02, 0, govde); gm.scale.set(1.22, 1, .82);
  mesh(new THREE.CylinderGeometry(.19, .185, .12, 16), alt, 0, .02, 0, govde).scale.set(1.12, 1, .8);       // bel
  if (o.kiyafet === 'ceket') { mesh(new THREE.BoxGeometry(.13, .4, .02), MAT(o.ic || '#f2f0ea'), 0, GOVDE / 2 + .05, .135, govde); for (const s of [-1, 1]) { const y = mesh(new THREE.BoxGeometry(.07, .2, .02), MAT(o.yaka || o.ust), s * .085, GOVDE - .1, .142, govde); y.rotation.z = s * .35; } }
  else if (o.kiyafet === 'gomlek') { for (const s of [-1, 1]) { const y = mesh(new THREE.BoxGeometry(.075, .05, .03), MAT('#ffffff'), s * .05, GOVDE - .005, .115, govde); y.rotation.z = s * .5; } for (let i = 0; i < 3; i++) mesh(new THREE.SphereGeometry(.011, 8, 6), MAT('#ffffff'), 0, GOVDE - .12 - i * .1, .14, govde); }
  else if (o.kiyafet === 'kazak') { mesh(new THREE.TorusGeometry(.085, .028, 8, 20), ust, 0, GOVDE + .005, 0, govde).rotation.x = Math.PI / 2; }
  mesh(new THREE.CylinderGeometry(.055, .06, .08, 12), ten, 0, GOVDE + .04, 0, govde);
  const bas = new THREE.Group(); bas.position.y = GOVDE + .22; govde.add(bas);
  mesh(new THREE.SphereGeometry(.165, 24, 18), ten, 0, 0, 0, bas).scale.set(1, 1.05, 1);
  for (const s of [-1, 1]) { mesh(new THREE.SphereGeometry(.021, 10, 8), MAT('#1c1410', { roughness: .3 }), s * .06, .015, .15, bas); mesh(new THREE.SphereGeometry(.03, 8, 6), ten, s * .165, -.01, 0, bas); }
  const agiz = mesh(new THREE.TorusGeometry(.035, .008, 6, 12, Math.PI), MAT('#9a4a3a'), 0, -.05, .148, bas); agiz.rotation.z = Math.PI;
  const st = o.sacTipi || 0;
  if (st !== 4) { const sg = new THREE.SphereGeometry(.176, 24, 14, 0, Math.PI * 2, 0, Math.PI * (st === 1 ? .56 : .5)); const sm = mesh(sg, sac, 0, .012, -.012, bas); sm.rotation.x = -.28; sm.scale.set(1.02, 1.06, 1.04); }
  if (st === 1) mesh(new THREE.SphereGeometry(.075, 12, 10), sac, 0, .14, -.13, bas);                        // topuz
  if (st === 2) { const u = mesh(new THREE.CapsuleGeometry(.13, .16, 4, 12), sac, 0, -.1, -.075, bas); u.scale.set(1.2, 1, .6); }      // uzun
  if (st === 3) mesh(new THREE.BoxGeometry(.3, .06, .1), sac, 0, .1, .1, bas).rotation.x = .3;                                       // perçem
  if (o.gozluk) { for (const s of [-1, 1]) mesh(new THREE.TorusGeometry(.04, .008, 6, 16), MAT('#111', { roughness: .3 }), s * .062, .015, .158, bas); mesh(new THREE.BoxGeometry(.05, .008, .008), MAT('#111'), 0, .02, .16, bas); }
  const uzuv = (x, y, ustBoy, altBoy, r, mUst, mAlt, uc) => { const p = new THREE.Group(); p.position.set(x, y, 0); const a = mesh(new THREE.CapsuleGeometry(r, ustBoy - r * 2, 4, 10), mUst, 0, -ustBoy / 2, 0, p); const d = new THREE.Group(); d.position.y = -ustBoy; p.add(d); mesh(new THREE.CapsuleGeometry(r * .9, altBoy - r * 1.8, 4, 10), mAlt, 0, -altBoy / 2, 0, d); uc(d); return { p, d }; };
  const kolAlt = o.kisaKol ? ten : ust;
  const kol = [-1, 1].map(s => { const k = uzuv(s * .245, GOVDE - .06, .28, .25, .055, ust, kolAlt, d => mesh(new THREE.SphereGeometry(.05, 10, 8), ten, 0, -.27, 0, d)); govde.add(k.p); return k; });
  const bacak = [-1, 1].map(s => { const b = uzuv(s * .1, 0, UYLUK, BALDIR, .08, alt, alt, d => { const a = mesh(new THREE.BoxGeometry(.11, AYAK, .25), ayk, 0, -BALDIR - AYAK / 2 + .01, .05, d); }); beden.add(b.p); return b; });
  const faz = o.faz || 0;
  // poz: 'otur' | 'yuru' | 'dur' | 'anlat' ; ek: {sevinc}
  function poz(t, mod, ek = {}) {
    const n = Math.sin(t * 1.6 + faz) * .012;
    if (mod === 'otur') {
      beden.position.y = (o.minder || .46) + .085; govde.rotation.x = .1 + n; bas.rotation.set(-.06 + Math.sin(t * .37 + faz) * .05, Math.sin(t * .43 + faz * 2) * .32 * (Math.sin(t * .11 + faz) > .2 ? 1 : .15), 0);
      bacak.forEach((b, i) => { b.p.rotation.set(-Math.PI / 2 + .04, 0, (i ? -1 : 1) * .06); b.d.rotation.x = Math.PI / 2 - .04; });
      kol.forEach((k, i) => { if (ek.sevinc) { k.p.rotation.set(-2.7 + Math.sin(t * 9 + i) * .15, 0, (i ? 1 : -1) * .35); k.d.rotation.x = -.3; } else { k.p.rotation.set(-.62, 0, (i ? -1 : 1) * .1); k.d.rotation.x = -1.02 + Math.sin(t * 11 + faz * 3 + i * 1.9) * .07; } });
    } else if (mod === 'yuru') {
      const w = t * 7.2 + faz, s = Math.sin(w); beden.position.y = KALCA + Math.abs(Math.cos(w)) * .025 - .012; govde.rotation.x = .06; bas.rotation.set(0, 0, 0);
      bacak.forEach((b, i) => { const q = i ? s : -s; b.p.rotation.set(q * .62, 0, 0); b.d.rotation.x = Math.max(0, -q) * .9 + .05; });
      kol.forEach((k, i) => { const q = i ? -s : s; k.p.rotation.set(q * .5, 0, (i ? 1 : -1) * .06); k.d.rotation.x = -.35 - Math.max(0, q) * .3; });
    } else {
      beden.position.y = KALCA; govde.rotation.x = n; bas.rotation.set(0, Math.sin(t * .5 + faz) * .25, 0);
      bacak.forEach(b => { b.p.rotation.set(0, 0, 0); b.d.rotation.x = 0; });
      kol.forEach((k, i) => { if (ek.sevinc) { k.p.rotation.set(-2.7 + Math.sin(t * 9 + i) * .15, 0, (i ? 1 : -1) * .35); k.d.rotation.x = -.3; } else if (mod === 'anlat' && i === 1) { k.p.rotation.set(-1.25 + Math.sin(t * 1.3 + faz) * .18, 0, .25); k.d.rotation.x = -.5 + Math.sin(t * 2.1 + faz) * .2; } else { k.p.rotation.set(Math.sin(t * .9 + faz + i) * .04, 0, (i ? 1 : -1) * .07); k.d.rotation.x = -.12; } });
    }
  }
  return { g: kok, poz };
}

export async function kur(renderer, VERI, ilerleme, KOK) {
  const scene = new THREE.Scene(); scene.background = new THREE.Color('#1b1626');
  const pm = new THREE.PMREMGenerator(renderer); scene.environment = pm.fromScene(new RoomEnvironment(), .04).texture; scene.environmentIntensity = .3;
  const M = (renk, o = {}) => new THREE.MeshStandardMaterial({ color: renk, roughness: .85, ...o });
  const kutu = (w, h, d, mat, x, y, z, ebeveyn = scene) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; ebeveyn.add(m); return m; };
  const engeller = [];           // [x0,x1,z0,z1, yüksek mi]
  const engel = (x, z, w, d, yuksek = false) => engeller.push([x - w / 2, x + w / 2, z - d / 2, z + d / 2, yuksek]);

  scene.add(new THREE.HemisphereLight('#ffe6c6', '#5a4030', 1.0));
  const gunes = new THREE.DirectionalLight('#ffb878', 2.0); gunes.position.set(5, 10, -18); gunes.target.position.set(0, 0, 2); scene.add(gunes, gunes.target);
  gunes.castShadow = true; gunes.shadow.mapSize.set(2048, 2048); Object.assign(gunes.shadow.camera, { left: -16, right: 16, top: 18, bottom: -18, near: 1, far: 60 }); gunes.shadow.bias = -.0006; gunes.shadow.normalBias = .03;

  // ---- kabuk ----
  const zemin = new THREE.Mesh(new THREE.PlaneGeometry(22, 24), new THREE.MeshStandardMaterial({ map: ahsapDoku(), roughness: .7 })); zemin.rotation.x = -Math.PI / 2; zemin.receiveShadow = true; scene.add(zemin);
  const duvar = M('#efe3d0', { roughness: .95 }), koyu = M('#4a3626'), acikAhsap = M('#d2a877', { roughness: .65 }), metal = M('#2e2e33', { roughness: .45, metalness: .6 }), beyaz = M('#f4eee4');
  const tavan = new THREE.Mesh(new THREE.PlaneGeometry(22, 24), M('#f1e7d6', { roughness: 1 })); tavan.rotation.x = Math.PI / 2; tavan.position.y = 4.2; scene.add(tavan);
  for (let z = -9; z <= 9; z += 4.5) kutu(22, .22, .26, koyu, 0, 4.08, z).castShadow = false;
  kutu(.3, 4.2, 24, duvar, -11.15, 2.1, 0); kutu(.3, 4.2, 24, duvar, 11.15, 2.1, 0);
  kutu(9, 4.2, .3, duvar, -6.5, 2.1, 12.15); kutu(9, 4.2, .3, duvar, 6.5, 2.1, 12.15); kutu(4, 1.2, .3, duvar, 0, 3.6, 12.15);
  kutu(22, .3, .3, duvar, 0, .15, -12.15); kutu(22, .5, .3, duvar, 0, 3.95, -12.15);
  for (let x = -11; x <= 11; x += 2.75) kutu(.1, 3.4, .14, metal, x, 2.0, -12.1);
  const manz = new THREE.Mesh(new THREE.CylinderGeometry(60, 60, 34, 64, 1, true, Math.PI * .68, Math.PI * .64), new THREE.MeshBasicMaterial({ map: manzaraDoku(), side: THREE.BackSide, toneMapped: false })); manz.position.set(0, 3.2, 20); scene.add(manz);
  const vapur = new THREE.Group(); const vg = new THREE.MeshBasicMaterial({ color: '#f1e6d6', toneMapped: false }), vk = new THREE.MeshBasicMaterial({ color: '#2a2038', toneMapped: false });
  vapur.add(new THREE.Mesh(new THREE.BoxGeometry(5.2, .7, 1.2), vk)); const u1 = new THREE.Mesh(new THREE.BoxGeometry(4, .7, 1), vg); u1.position.y = .7; vapur.add(u1); const u2 = new THREE.Mesh(new THREE.BoxGeometry(2.4, .5, .9), vg); u2.position.y = 1.3; vapur.add(u2); const baca = new THREE.Mesh(new THREE.CylinderGeometry(.22, .26, .9, 12), new THREE.MeshBasicMaterial({ color: '#e4572e', toneMapped: false })); baca.position.set(-.3, 1.95, 0); vapur.add(baca); vapur.scale.setScalar(1.4); scene.add(vapur);
  const martilar = [], mr = tohum(9), mg = new THREE.BufferGeometry(); mg.setAttribute('position', new THREE.Float32BufferAttribute([-.5, .12, 0, 0, 0, 0, 0, 0, .14, .5, .12, 0, 0, 0, 0, 0, 0, .14], 3));
  for (let i = 0; i < 8; i++) { const m = new THREE.Mesh(mg, new THREE.MeshBasicMaterial({ color: '#fff4e6', side: THREE.DoubleSide, toneMapped: false })); m.userData = { r: 5 + mr() * 10, h: 4 + mr() * 5, f: mr() * 6.28, hz: .12 + mr() * .14, cx: (mr() - .5) * 20, cz: -24 - mr() * 10 }; scene.add(m); martilar.push(m); }

  const hali = (x, z, w, d, renk) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), M(renk, { roughness: 1 })); m.rotation.x = -Math.PI / 2; m.position.set(x, .012, z); m.receiveShadow = true; scene.add(m); };
  const sakin = renk => new THREE.Color(renk).lerp(new THREE.Color('#d8c4a6'), .62).getStyle();
  hali(0, 2.5, 3.2, 17.5, '#b9a184');   // koridor yolluğu
  const lambalar = [];
  const lamba = (x, z, guc = 20) => { kutu(.02, .9, .02, metal, x, 3.75, z).castShadow = false; const k = new THREE.Mesh(new THREE.ConeGeometry(.4, .3, 24, 1, true), M('#3a3230', { side: THREE.DoubleSide })); k.position.set(x, 3.2, z); scene.add(k); const a = new THREE.Mesh(new THREE.SphereGeometry(.1, 12, 8), new THREE.MeshBasicMaterial({ color: '#fff0c8', toneMapped: false })); a.position.set(x, 3.1, z); scene.add(a); const l = new THREE.PointLight('#ffd49a', guc, 12, 1.6); l.position.set(x, 3.0, z); l.userData.g0 = guc; scene.add(l); lambalar.push(l); };
  const bitki = (x, z, s = 1) => { const g = new THREE.Group(); g.position.set(x, 0, z); g.scale.setScalar(s); scene.add(g); const sak = new THREE.Mesh(new THREE.CylinderGeometry(.26, .2, .45, 20), M('#c9794e')); sak.position.y = .225; sak.castShadow = true; g.add(sak); const r = tohum((x * 31 + z * 7) | 0); for (let i = 0; i < 9; i++) { const y = new THREE.Mesh(new THREE.SphereGeometry(.22, 10, 8), M(i % 2 ? '#3f7d4a' : '#4f9458')); y.scale.set(.5, 1.6 + r(), .22); y.position.set((r() - .5) * .3, .9 + r() * .5, (r() - .5) * .3); y.rotation.set((r() - .5) * .9, r() * 6, (r() - .5) * .9); y.castShadow = true; g.add(y); } engel(x, z, .6, .6); };

  // masa + sandalye; oturan kişi yerel +z tarafında, -z'ye (masaya) bakar. Minder üstü 0.46 m.
  const oturanlar = [];
  function masa(x, z, ry, renk, s, id) {
    const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; scene.add(g);
    kutu(1.6, .05, .8, acikAhsap, 0, .735, 0, g); for (const [a, b] of [[-.74, -.34], [.74, -.34], [-.74, .34], [.74, .34]]) kutu(.05, .71, .05, metal, a, .355, b, g);
    kutu(.74, .46, .035, metal, 0, 1.17, -.22, g); const e = new THREE.Mesh(new THREE.PlaneGeometry(.69, .41), new THREE.MeshBasicMaterial({ map: monitorDoku(renk, s), toneMapped: false })); e.position.set(0, 1.17, -.2); g.add(e); kutu(.05, .2, .05, metal, 0, .86, -.24, g); kutu(.26, .02, .18, metal, 0, .77, -.24, g);
    kutu(.44, .02, .15, M('#e2ddd4'), 0, .77, .16, g); kutu(.09, .1, .09, M(renk), .6, .81, -.1, g);
    const sz = .66; kutu(.46, .06, .46, M('#3a3634'), 0, .43, sz, g); kutu(.44, .5, .06, M('#3a3634'), 0, .8, sz + .26, g); kutu(.05, .38, .05, metal, 0, .21, sz, g); kutu(.42, .04, .42, metal, 0, .02, sz, g);
    const c = Math.abs(Math.cos(ry)), n = Math.abs(Math.sin(ry)); engel(x + Math.sin(ry) * .3, z + Math.cos(ry) * .3, c * 1.7 + n * 1.5, n * 1.7 + c * 1.5);
    oturanlar.push({ id, x: x + Math.sin(ry) * sz, z: z + Math.cos(ry) * sz, ry: ry + Math.PI });
  }
  const levha = (doku_, w, h, x, y, z, ry, cerceve = true) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: doku_, toneMapped: false })); m.position.set(x, y, z); m.rotation.y = ry; scene.add(m); if (cerceve) { const k = kutu(w + .1, h + .1, .05, koyu, x - Math.sin(ry) * .03, y, z - Math.cos(ry) * .03); k.rotation.y = ry; k.castShadow = false; } return m; };

  const E = Object.fromEntries(VERI.ekipler.map(e => [e.id, e])), ekranlar = [], ayaktakiler = [];
  for (const [id, b] of Object.entries(BOLME)) {
    if (!b.yan || !E[id]) continue; const y = YERLER[id], d = b.z1 - b.z0, e = E[id];
    hali(y.x, y.z, 7.6, d - .7, sakin(b.renk));
    for (const z of [b.z0, b.z1]) if (Math.abs(z) < 10.9) { kutu(7.4, 1.2, .1, beyaz, b.yan * 7.25, .6, z); kutu(7.4, .04, .14, acikAhsap, b.yan * 7.25, 1.22, z); engel(b.yan * 7.25, z, 7.4, .3); }
    // tabela: koridora ve girişe dönük, iki yüzlü
    const td = tabelaDoku(b.no, e.ad, e.tek_satir, b.renk), ry = -b.yan * .95;
    for (const k of [0, Math.PI]) { const t = new THREE.Mesh(new THREE.PlaneGeometry(3.5, 1.0), new THREE.MeshBasicMaterial({ map: td, toneMapped: false })); t.position.set(b.yan * 3.9, 3.15, y.z + .3); t.rotation.y = ry + k; scene.add(t); }
    for (const s of [-1.5, 1.5]) { const ip = kutu(.015, .55, .015, metal, b.yan * 3.9 + Math.cos(ry) * s, 3.92, y.z + .3 - Math.sin(ry) * s); ip.castShadow = false; }
    // duvar panosu
    const pz = id === 'site' ? b.z0 + 1.5 : y.z; levha(panoDoku(e, b.renk), 2.5, 1.4, b.yan * 10.97, 1.95, pz, -b.yan * Math.PI / 2);
    // masalar: sıra hâlinde, oturanlar koridordan yandan görünür
    const n = id === 'site' || id === 'mail' ? 2 : 3, mz = id === 'site' ? y.z + .6 : y.z - .35;
    for (let i = 0; i < n; i++) masa(b.yan * (4.7 + i * 2.05), mz, 0, b.renk, b.no * 7 + i, id);
    if (id !== 'konu' && id !== 'musteri') ayaktakiler.push({ id, x: b.yan * 9.6, z: pz + (id === 'site' ? 1.9 : 1.5), ry: -b.yan * Math.PI / 2 - b.yan * .5 * (id === 'site' ? -1 : 1), mod: 'anlat' });
    lamba(y.x, y.z, 22);
  }
  // 3D site bölmesi: duvarda demo ekranları
  const yukle = new THREE.TextureLoader(), sb = BOLME.site, ss = (VERI.siteler || []).slice(0, 3), sw = ss.length > 2 ? 1.75 : 2.3;
  ss.forEach((s, i) => {
    const z = sb.z0 + 3.2 + sw / 2 + i * (sw + .35) + (ss.length > 2 ? -.3 : .2), x = 10.97, mat = new THREE.MeshBasicMaterial({ color: '#2a2f3a', toneMapped: false });
    if (s.gorsel) yukle.load(KOK + s.gorsel, t => { t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; mat.map = t; mat.color.set('#fff'); mat.needsUpdate = true; }, undefined, () => { });
    const e = new THREE.Mesh(new THREE.PlaneGeometry(sw, sw * 9 / 16), mat); e.position.set(x, 2.0, z); e.rotation.y = -Math.PI / 2; scene.add(e); const k = kutu(.06, sw * 9 / 16 + .1, sw + .1, metal, x + .03, 2.0, z); k.castShadow = false;
    const et = new THREE.Mesh(new THREE.PlaneGeometry(sw, sw * .11), new THREE.MeshBasicMaterial({ map: etiketDoku(s.ad), toneMapped: false })); et.position.set(x, 2.0 - sw * 9 / 32 - sw * .08, z); et.rotation.y = -Math.PI / 2; scene.add(et);
    e.userData.site = et.userData.site = s; ekranlar.push(e, et); s._x = x - 1.6; s._z = z;
  });
  // müdür odası
  const camMat = new THREE.MeshPhysicalMaterial({ color: '#cfe6ea', transparent: true, opacity: .14, roughness: .05, depthWrite: false, side: THREE.DoubleSide });
  const camDuvar = (w, x, z, yat) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, 3.6), camMat); m.position.set(x, 1.9, z); if (yat) m.rotation.y = Math.PI / 2; scene.add(m); kutu(yat ? .07 : w, .08, yat ? w : .07, metal, x, 3.74, z).castShadow = false; kutu(yat ? .07 : w, .12, yat ? w : .07, metal, x, .06, z); engel(x, z, yat ? .2 : w, yat ? w : .2, true); };
  camDuvar(3.3, -2.85, -6.5, false); camDuvar(3.3, 2.85, -6.5, false); camDuvar(5.5, -4.5, -9.25, true); camDuvar(5.5, 4.5, -9.25, true);
  for (const x of [-1.2, 1.2]) kutu(.08, 3.7, .08, metal, x, 1.85, -6.5);
  if (E.mudur) { const b = BOLME.mudur, td = tabelaDoku(6, E.mudur.ad + ' odası', E.mudur.tek_satir, b.renk); const t = new THREE.Mesh(new THREE.PlaneGeometry(3.3, .94), new THREE.MeshBasicMaterial({ map: td, toneMapped: false })); t.position.set(0, 3.2, -6.42); scene.add(t);
    hali(0, -9.3, 7.6, 4.6, sakin(b.renk)); masa(0, -9.9, Math.PI, b.renk, 99, 'mudur'); levha(panoDoku(E.mudur, b.renk), 2.3, 1.3, 4.42, 1.95, -9.2, -Math.PI / 2); bitki(-3.8, -11.3, 1.2); bitki(3.8, -11.3, 1.2); lamba(0, -8.6, 22); }
  // dinlenme köşesi (doğu) ve manzara köşeleri
  hali(6.8, -4, 6.4, 3, '#cdb89a'); const kanepe = M('#b8846a');
  kutu(2.4, .42, .9, kanepe, 6.8, .21, -5.2); kutu(2.4, .5, .18, kanepe, 6.8, .62, -5.56); engel(6.8, -5.2, 2.6, 1.1);
  const sehpa = new THREE.Mesh(new THREE.CylinderGeometry(.55, .55, .05, 32), acikAhsap); sehpa.position.set(6.8, .42, -3.7); sehpa.castShadow = true; scene.add(sehpa); kutu(.07, .4, .07, metal, 6.8, .2, -3.7); engel(6.8, -3.7, 1.1, 1.1);
  kutu(.7, .95, 2.0, koyu, 10.6, .475, -4); kutu(.8, .05, 2.1, acikAhsap, 10.6, .98, -4); kutu(.3, .4, .3, metal, 10.6, 1.2, -4.5); engel(10.6, -4, .9, 2.2);
  for (const [x, z, s] of [[-10.3, -11.3, 1.4], [-6, -11.3, 1.1], [10.3, -11.3, 1.4], [6, -11.3, 1.1], [-2.6, 11.4, 1.1], [2.6, 11.4, 1.1], [10.4, -6.6, 1.1]]) bitki(x, z, s);
  kutu(2.6, .42, .6, koyu, -7.8, .21, -9.6); engel(-7.8, -9.6, 2.8, .8); kutu(2.6, .42, .6, koyu, 7.8, .21, -9.6); engel(7.8, -9.6, 2.8, .8);
  lamba(0, 9, 16); lamba(0, 3, 16); lamba(0, -3, 16); lamba(6.8, -4, 16);
  const logo = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 1.44), new THREE.MeshBasicMaterial({ map: yaziDoku('BerkAİ', 'S T Ü D Y O  ·  İ S T A N B U L'), transparent: true })); logo.position.set(-6.5, 2.3, 11.98); logo.rotation.y = Math.PI; scene.add(logo);
  const logo2 = logo.clone(); logo2.position.x = 6.5; scene.add(logo2);

  // ---- çalışanlar ----
  const GIYSI = { konu: ['#c9d6e8', '#d9673f', '#f1ede4'], yapim: ['#e0a13c', '#f1ede4', '#3f4a5e'], musteri: ['#4f9a72', '#dfe9df', '#2f5a48'], site: ['#4a86ad', '#e4ecf2', '#2b4a66'], mail: ['#b3677a', '#f0e2e4', '#5e3a48'], mudur: ['#3a3f52'] };
  const TUR = ['gomlek', 'kazak', 'ceket'], kisiler = []; let ki = 0;
  const kisiEkle = (id, o) => { const i = ki++, pal = GIYSI[id], k = insan({ ten: TEN[(i * 5 + 1) % TEN.length], sac: SAC[(i * 3 + 2) % SAC.length], sacTipi: [0, 2, 3, 1, 0, 2][i % 6], ust: pal[i % pal.length], kiyafet: id === 'mudur' ? 'ceket' : TUR[i % 3], ic: '#f2f0ea', alt: ['#34384a', '#4a4038', '#2e3440', '#5a5148'][i % 4], gozluk: i % 5 === 3, kisaKol: i % 4 === 1 && TUR[i % 3] !== 'ceket', faz: i * 1.37 }); k.g.position.set(o.x, 0, o.z); k.g.rotation.y = o.ry; scene.add(k.g); kisiler.push({ ...k, ...o, id }); };
  oturanlar.forEach(o => kisiEkle(o.id, { ...o, mod: 'otur' })); ayaktakiler.forEach(o => kisiEkle(o.id, o));
  const mudur = kisiler.find(k => k.id === 'mudur');
  // oyuncu: beyaz ceket, siyah tişört, gözlük
  const oyuncu = insan({ ten: '#e8bd98', sac: '#2b1d14', sacTipi: 3, ust: '#f4f2ec', kiyafet: 'ceket', ic: '#15151a', yaka: '#e6e2d8', alt: '#22242c', ayakkabi: '#f2f0ea', gozluk: true, faz: .4 }); scene.add(oyuncu.g);
  const halka = new THREE.Mesh(new THREE.RingGeometry(.3, .36, 32), new THREE.MeshBasicMaterial({ color: '#ffd27a', transparent: true, opacity: .7, toneMapped: false })); halka.rotation.x = -Math.PI / 2; halka.position.y = .02; oyuncu.g.add(halka);
  ilerleme && ilerleme(1);

  function guncelle(t, durum = {}) {
    vapur.position.set(((t * 1.1 + 30) % 80) - 40, -2.9, -34);
    for (const m of martilar) { const u = m.userData, a = t * u.hz + u.f; m.position.set(u.cx + Math.cos(a) * u.r, u.h + Math.sin(a * 1.7) * .6, u.cz + Math.sin(a) * u.r * .5); m.rotation.y = -a; m.scale.set(1.3, 1 + Math.sin(t * 9 + u.f) * 2.2, 1.3); }
    lambalar.forEach((l, i) => { l.intensity = l.userData.g0 * (1 + .03 * Math.sin(t * 2.1 + i * 1.7)); });
    for (const K of kisiler) K.poz(t, K.mod, { sevinc: K === mudur && durum.sevinc });
    if (durum.oyuncu) { const o = durum.oyuncu; oyuncu.g.position.set(o.x, 0, o.z); oyuncu.g.rotation.y = o.yaw; oyuncu.poz(o.adimT !== undefined ? o.adimT : t, o.yuruyor ? 'yuru' : 'dur'); }
  }
  return { scene, engeller, ekranlar, guncelle, kisiler };
}
