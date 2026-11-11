// BerkAİ 3D demo motoru: ayar.js'teki sahneleri kodla çizer (fotoğraf yok), kaydırmayla sahne değiştirir.
// ?tur=1 -> window.TUR = { sure, sahneler, kare(t) } ile deterministik kamera/kaydırma turu.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/RoomEnvironment.js';

const A = window.AYAR;
const TUR_MODU = new URLSearchParams(location.search).get('tur') === '1';
if (TUR_MODU) document.documentElement.classList.add('tur');

// ---------- yardımcılar ----------
function tohum(s) { let a = s >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const yum = x => { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); };
const lerp = (a, b, t) => a + (b - a) * t;
const C = h => new THREE.Color(h);
const FONT_B = '"Iowan Old Style","Palatino Linotype",Palatino,Georgia,"DejaVu Serif",serif';
const FONT_G = 'system-ui,-apple-system,"Segoe UI",Roboto,Arial,"DejaVu Sans",sans-serif';

function etiketDoku(o) {
  const w = o.w || 1024, h = o.h || 512, c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d'); g.fillStyle = o.zemin || '#f3ead8'; g.fillRect(0, 0, w, h);
  if (o.serit) { g.fillStyle = o.serit; g.fillRect(0, 0, w, h * .1); g.fillRect(0, h * .9, w, h * .1); }
  if (o.cerceve) { g.strokeStyle = o.cerceve; g.lineWidth = h * .012; g.strokeRect(w * .05, h * .08, w * .9, h * .84); }
  g.textAlign = 'center'; g.textBaseline = 'middle';
  if (o.cizim === 'zeytin') zeytinDali(g, w * .5, h * (o.cizimY || .26), h * .16, o.yazi || '#23301a');
  if (o.cizim === 'kakao') kakaoCiz(g, w * .5, h * (o.cizimY || .24), h * .13, o.yazi || '#3a2415');
  for (const s of o.satirlar || []) {
    g.fillStyle = s.renk || o.yazi || '#23301a';
    g.font = `${s.kalin ? 600 : 400} ${Math.round(h * s.boy)}px ${s.govde ? FONT_G : FONT_B}`;
    const t = s.aralik ? s.t.split('').join(' '.repeat(s.aralik)) : s.t;
    g.fillText(t, w * (s.x || .5), h * s.y, w * .86);
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}
function zeytinDali(g, x, y, r, renk) {
  g.save(); g.translate(x, y); g.strokeStyle = renk; g.fillStyle = renk; g.lineWidth = r * .07; g.lineCap = 'round';
  g.beginPath(); g.moveTo(-r * 1.5, r * .25); g.quadraticCurveTo(0, -r * .35, r * 1.5, r * .1); g.stroke();
  for (let i = 0; i < 7; i++) { const t = i / 6, px = lerp(-r * 1.4, r * 1.4, t), py = r * .25 - Math.sin(t * Math.PI) * r * .42 + t * -.1 * r; g.save(); g.translate(px, py); g.rotate((i % 2 ? 1 : -1) * .9 + (t - .5) * .5); g.beginPath(); g.ellipse(0, -r * .32, r * .11, r * .34, 0, 0, 7); g.fill(); g.restore(); }
  g.beginPath(); g.ellipse(-r * .3, r * .42, r * .17, r * .22, .3, 0, 7); g.fill(); g.beginPath(); g.ellipse(r * .45, r * .36, r * .17, r * .22, -.2, 0, 7); g.fill();
  g.restore();
}
function kakaoCiz(g, x, y, r, renk) {
  g.save(); g.translate(x, y); g.rotate(-.5); g.strokeStyle = renk; g.lineWidth = r * .09; g.lineJoin = 'round';
  g.beginPath(); g.ellipse(0, 0, r * .62, r * 1.25, 0, 0, 7); g.stroke();
  for (const k of [-.3, 0, .3]) { g.beginPath(); g.moveTo(0, -r * 1.22); g.quadraticCurveTo(k * r * 2.2, 0, 0, r * 1.22); g.stroke(); }
  g.restore();
}
function benekDoku(taban, benek, n, s) {
  const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d'); g.fillStyle = taban; g.fillRect(0, 0, 256, 256);
  const r = tohum(s); g.fillStyle = benek;
  for (let i = 0; i < n; i++) { g.globalAlpha = .15 + r() * .5; g.beginPath(); g.arc(r() * 256, r() * 256, .6 + r() * 1.6, 0, 7); g.fill(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}
const golge = o => { o.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } }); return o; };

// ---------- kodla çizilen ürünler (taban y=0, boy ~2.2) ----------
const MODEL = {
  // 5 L teneke: düz yüzlü kutu + etiket
  teneke(p) {
    const g = new THREE.Group(), w = 1.2, h = 1.75, d = .78;
    const on = etiketDoku({ w: 768, h: 1120, zemin: p.zemin || '#2f4a23', yazi: p.yazi || '#f3e7c4', cerceve: p.vurgu || '#d8b24a', cizim: 'zeytin', cizimY: .2, satirlar: p.satirlar });
    const yan = etiketDoku({ w: 512, h: 1120, zemin: p.zemin || '#2f4a23', yazi: p.yazi || '#f3e7c4', satirlar: p.yanSatirlar || [] });
    const metal = new THREE.MeshStandardMaterial({ color: p.metal || '#c9c4b6', metalness: .9, roughness: .32 });
    const mOn = new THREE.MeshStandardMaterial({ map: on, metalness: .55, roughness: .38 }), mYan = new THREE.MeshStandardMaterial({ map: yan, metalness: .55, roughness: .38 });
    g.userData.salin = .5;
    const kutu = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), [mYan, mYan, metal, metal, mOn, mOn]); kutu.position.y = h / 2 + .03; g.add(kutu);
    for (const [x, z] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) { const k = new THREE.Mesh(new THREE.CylinderGeometry(.022, .022, h, 12), metal); k.position.set(x * w / 2, h / 2 + .03, z * d / 2); g.add(k); }
    for (const y of [.03, h + .03]) { const c = new THREE.Mesh(new THREE.BoxGeometry(w + .05, .05, d + .05), metal); c.position.y = y; g.add(c); }
    const kapak = new THREE.Mesh(new THREE.CylinderGeometry(.11, .11, .1, 28), new THREE.MeshStandardMaterial({ color: p.kapak || '#d8b24a', roughness: .45, metalness: .3 })); kapak.position.set(w * .26, h + .1, 0); g.add(kapak);
    const sap = new THREE.Mesh(new THREE.TorusGeometry(.2, .022, 10, 28, Math.PI), metal); sap.position.set(-w * .12, h + .06, 0); g.add(sap);
    return golge(g);
  },
  // cam şişe / galon şişe
  sise(p) {
    const g = new THREE.Group(), galon = p.bicim === 'galon';
    const pr = galon ? [[0, 0], [.5, 0], [.63, .07], [.68, .45], [.66, .85], [.52, 1.2], [.26, 1.48], [.17, 1.6], [.17, 1.92], [.2, 1.94], [.2, 2.02], [.15, 2.02]]
      : [[0, 0], [.4, 0], [.44, .04], [.44, 1.3], [.4, 1.48], [.2, 1.78], [.14, 1.88], [.14, 2.14], [.165, 2.16], [.165, 2.24], [.12, 2.24]];
    const cam = new THREE.MeshPhysicalMaterial({ color: p.cam || '#1c2a12', roughness: .07, metalness: 0, clearcoat: 1, clearcoatRoughness: .05, envMapIntensity: 1.5, side: THREE.DoubleSide });
    g.add(new THREE.Mesh(new THREE.LatheGeometry(pr.map(a => new THREE.Vector2(a[0], a[1])), 72), cam));
    const ust = pr[pr.length - 1][1];
    const tipa = new THREE.Mesh(new THREE.CylinderGeometry(galon ? .16 : .15, galon ? .14 : .15, galon ? .2 : .22, 28), new THREE.MeshStandardMaterial({ color: p.kapak || '#c9a15a', roughness: galon ? .9 : .35, metalness: galon ? 0 : .7 })); tipa.position.y = ust + .06; g.add(tipa);
    if (galon) { const h = new THREE.Mesh(new THREE.TorusGeometry(.13, .035, 12, 28), cam); h.position.set(.24, 1.72, 0); g.add(h); }
    const et = etiketDoku({ w: 1024, h: 640, zemin: p.zemin || '#f3ead8', yazi: p.yazi || '#23301a', cerceve: p.vurgu, cizim: 'zeytin', cizimY: .22, satirlar: p.satirlar });
    const r = (galon ? .68 : .44) + .004, eh = galon ? .56 : .78, ey = galon ? .5 : .68;
    const e = new THREE.Mesh(new THREE.CylinderGeometry(r, r, eh, 64, 1, true, -Math.PI * .42, Math.PI * .84), new THREE.MeshStandardMaterial({ map: et, roughness: .8, side: THREE.DoubleSide }));
    e.position.y = ey; g.add(e);
    return golge(g);
  },
  // zeytin kavanozu: saydam cam, içinde zeytinler
  kavanoz(p) {
    const g = new THREE.Group(), R = .56, H = 1.5;
    const pr = [[0, 0], [R - .04, 0], [R, .05], [R, H - .12], [R - .1, H], [R - .1, H + .08]];
    const cam = new THREE.Mesh(new THREE.LatheGeometry(pr.map(a => new THREE.Vector2(a[0], a[1])), 64), new THREE.MeshPhysicalMaterial({ color: '#e9f2ee', transparent: true, opacity: .2, roughness: .03, clearcoat: 1, envMapIntensity: 1.6, depthWrite: false, side: THREE.DoubleSide }));
    cam.renderOrder = 3; cam.castShadow = true; g.add(cam);
    const su = new THREE.Mesh(new THREE.CylinderGeometry(R - .03, R - .05, H - .2, 48), new THREE.MeshStandardMaterial({ color: p.su || '#8a8a3a', transparent: true, opacity: .32, roughness: .2, depthWrite: false })); su.position.y = (H - .2) / 2 + .03; su.renderOrder = 2; g.add(su);
    const rr = tohum(p.tohum || 7), n = 150, zg = new THREE.SphereGeometry(.105, 14, 10); zg.scale(1, 1.28, 1);
    const im = new THREE.InstancedMesh(zg, new THREE.MeshStandardMaterial({ roughness: .35 }), n), m = new THREE.Matrix4(), q = new THREE.Quaternion(), col = new THREE.Color();
    const renkler = p.zeytin || ['#6f7a2c', '#7d8a35', '#5f6a25'];
    for (let i = 0; i < n; i++) { const a = rr() * 6.283, rad = Math.sqrt(rr()) * (R - .16), y = .13 + rr() * (H - .42); q.setFromEuler(new THREE.Euler(rr() * 3, rr() * 3, rr() * 3)); m.compose(new THREE.Vector3(Math.cos(a) * rad, y, Math.sin(a) * rad), q, new THREE.Vector3(1, 1, 1)); im.setMatrixAt(i, m); im.setColorAt(i, col.set(renkler[i % renkler.length]).multiplyScalar(.8 + rr() * .4)); }
    im.instanceColor.needsUpdate = true; g.add(im);
    const kapak = new THREE.Mesh(new THREE.CylinderGeometry(R - .04, R - .04, .2, 48), new THREE.MeshStandardMaterial({ color: p.kapak || '#e2b93b', roughness: .4, metalness: .35 })); kapak.position.y = H + .1; kapak.castShadow = true; g.add(kapak);
    const et = etiketDoku({ w: 1024, h: 420, zemin: p.zemin || '#f3ead8', yazi: p.yazi || '#23301a', serit: p.vurgu, satirlar: p.satirlar });
    const e = new THREE.Mesh(new THREE.CylinderGeometry(R + .005, R + .005, .52, 64, 1, true, -Math.PI * .4, Math.PI * .8), new THREE.MeshStandardMaterial({ map: et, roughness: .85, side: THREE.DoubleSide })); e.position.y = .62; e.renderOrder = 4; g.add(e);
    g.scale.setScalar(1.25); return g;
  },
  // tablet çikolata: kareli gövde + kâğıt kuşak
  tablet(p) {
    const g = new THREE.Group(), ic = new THREE.Group(), w = 1.22, h = 2.15, t = .11;
    const cik = new THREE.MeshPhysicalMaterial({ color: p.renk || '#3b2114', roughness: .38, clearcoat: .5, clearcoatRoughness: .35, sheen: .4, sheenColor: C('#8a5a3a') });
    ic.add(new THREE.Mesh(new THREE.BoxGeometry(w, h, t), cik));
    const nx = 3, ny = 6, kw = w / nx, kh = h / ny, kg = new THREE.BoxGeometry(kw * .86, kh * .86, .05);
    const pos = kg.attributes.position; for (let i = 0; i < pos.count; i++) if (pos.getZ(i) > 0) { pos.setX(i, pos.getX(i) * .82); pos.setY(i, pos.getY(i) * .82); } kg.computeVertexNormals();
    for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) { const k = new THREE.Mesh(kg, cik); k.position.set((i - (nx - 1) / 2) * kw, (j - (ny - 1) / 2) * kh, t / 2 + .024); ic.add(k); }
    const folyo = new THREE.Mesh(new THREE.BoxGeometry(w + .03, h * .66, t + .12), new THREE.MeshStandardMaterial({ color: p.folyo || '#d9b25c', metalness: .95, roughness: .28 })); folyo.position.y = -h * .19; ic.add(folyo);
    const et = etiketDoku({ w: 640, h: 760, zemin: p.zemin || '#efe6d6', yazi: p.yazi || '#2b1a10', cerceve: p.vurgu, cizim: 'kakao', cizimY: .2, satirlar: p.satirlar });
    const arka = etiketDoku({ w: 640, h: 760, zemin: p.zemin || '#efe6d6', yazi: p.yazi || '#2b1a10', satirlar: p.arkaSatirlar || [] });
    const kagit = new THREE.MeshStandardMaterial({ color: p.zemin || '#efe6d6', roughness: .92 });
    const kusak = new THREE.Mesh(new THREE.BoxGeometry(w + .06, h * .6, t + .16), [kagit, kagit, kagit, kagit, new THREE.MeshStandardMaterial({ map: et, roughness: .92 }), new THREE.MeshStandardMaterial({ map: arka, roughness: .92 })]); kusak.position.y = -h * .2; ic.add(kusak);
    ic.position.y = h / 2 + .02; ic.rotation.x = -.1; g.add(ic); g.userData.salin = .42; return golge(g);
  },
  // kakao meyvesi + birkaç çekirdek
  kakao(p) {
    const g = new THREE.Group(), geo = new THREE.SphereGeometry(1, 72, 48), pos = geo.attributes.position, col = [], a = C(p.renk1 || '#c9641f'), b = C(p.renk2 || '#e3a531'), c = new THREE.Color();
    for (let i = 0; i < pos.count; i++) { let x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i); const th = Math.atan2(z, x), k = 1 + .075 * Math.cos(th * 10) + .012 * Math.sin(th * 31 + y * 20), ucl = 1 - .32 * Math.pow(Math.abs(y), 3) * (y > 0 ? 1.25 : .7); pos.setXYZ(i, x * .56 * k * ucl, y * 1.08, z * .56 * k * ucl); c.copy(a).lerp(b, clamp(.5 + .5 * Math.cos(th * 10) + y * .25, 0, 1)); col.push(c.r, c.g, c.b); }
    geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); geo.computeVertexNormals();
    const meyve = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .55 })); meyve.position.y = 1.22; meyve.rotation.z = .32; g.add(meyve);
    const sap = new THREE.Mesh(new THREE.CylinderGeometry(.035, .05, .3, 10), new THREE.MeshStandardMaterial({ color: '#4a3a22', roughness: .9 })); sap.position.set(-.36, 2.34, 0); sap.rotation.z = .32; g.add(sap);
    g.add(cekirdekler(26, .98, p.cekirdek || '#7a4a2a', 11, .05));
    return golge(g);
  },
  // kavrulmuş çekirdek: ahşap kapta yığın
  cekirdek(p) {
    const g = new THREE.Group();
    const kap = new THREE.Mesh(new THREE.LatheGeometry([[0, .0], [.6, .0], [.98, .22], [1.04, .34], [.98, .34], [.6, .1], [0, .1]].map(a => new THREE.Vector2(a[0], a[1])), 64), new THREE.MeshStandardMaterial({ color: p.kap || '#8a5d36', roughness: .7 })); g.add(kap);
    const y = cekirdekler(210, .86, p.renk || '#4a2a18', 5, .16, true); g.add(y);
    g.userData.egim = .3; g.scale.setScalar(1.12); return golge(g);
  },
  // melanger: çelik hazne, iki granit teker, parlak çikolata
  degirmen(p) {
    const g = new THREE.Group(), celik = new THREE.MeshStandardMaterial({ color: '#cfd3d6', metalness: 1, roughness: .22, side: THREE.DoubleSide }), tas = new THREE.MeshStandardMaterial({ map: benekDoku('#8f8a86', '#2c2a28', 900, 3), roughness: .85 });
    const govde = new THREE.Mesh(new THREE.CylinderGeometry(.62, .7, .7, 48), new THREE.MeshStandardMaterial({ color: p.govde || '#b23a2a', roughness: .5, metalness: .2 })); govde.position.y = .35; g.add(govde);
    const hazne = new THREE.Mesh(new THREE.LatheGeometry([[0, .7], [.98, .7], [1.0, .74], [1.0, 1.62], [1.04, 1.66], [.96, 1.66], [.95, .8], [0, .8]].map(a => new THREE.Vector2(a[0], a[1])), 72), celik); g.add(hazne);
    const sivi = new THREE.Mesh(new THREE.CylinderGeometry(.95, .95, .04, 64), new THREE.MeshPhysicalMaterial({ color: p.renk || '#3a1f12', roughness: .12, clearcoat: 1, clearcoatRoughness: .08 })); sivi.position.y = 1.06; g.add(sivi);
    const don = new THREE.Group(); don.position.y = 1.02; g.add(don);
    const tg = new THREE.CylinderGeometry(.36, .36, .34, 40); tg.rotateZ(Math.PI / 2);
    const tekerler = [];
    for (const s of [-1, 1]) { const tk = new THREE.Mesh(tg, tas); tk.position.set(s * .46, .36, 0); don.add(tk); tekerler.push(tk); }
    const mil = new THREE.Mesh(new THREE.CylinderGeometry(.045, .045, 1.5, 12), celik); mil.rotation.z = Math.PI / 2; mil.position.y = .36; don.add(mil);
    const orta = new THREE.Mesh(new THREE.CylinderGeometry(.07, .07, 1.0, 16), celik); orta.position.y = .5; don.add(orta);
    // çikolata izleri (dönerken hareket görünür olsun)
    const iz = new THREE.Mesh(new THREE.TorusGeometry(.46, .05, 8, 48), new THREE.MeshPhysicalMaterial({ color: '#4a2a18', roughness: .2, clearcoat: 1 })); iz.rotation.x = Math.PI / 2; iz.scale.z = .35; iz.position.y = .05; don.add(iz);
    g.userData.canli = t => { don.rotation.y = t * 1.6; for (const tk of tekerler) tk.rotation.x = t * 2.1 * Math.sign(tk.position.x); };
    g.userData.salin = .25; g.userData.egim = .34; g.scale.setScalar(1.05); return golge(g);
  },
};
function cekirdekler(n, R, renk, s, y0, yigin) {
  const rr = tohum(s), geo = new THREE.SphereGeometry(.085, 12, 8); geo.scale(1, .55, 1.55);
  const im = new THREE.InstancedMesh(geo, new THREE.MeshStandardMaterial({ roughness: .6 }), n), m = new THREE.Matrix4(), q = new THREE.Quaternion(), c = new THREE.Color();
  for (let i = 0; i < n; i++) { const a = rr() * 6.283, rad = Math.sqrt(rr()) * R, y = yigin ? y0 + (1 - rad / R) * .42 * rr() + (1 - rad / R) * .1 : y0 + rr() * .02; q.setFromEuler(new THREE.Euler((rr() - .5) * (yigin ? 1.6 : .3), rr() * 6.283, (rr() - .5) * (yigin ? 1.6 : .3))); const px = yigin ? Math.cos(a) * rad : Math.cos(a) * (R * .55 + rad * .5), pz = yigin ? Math.sin(a) * rad : Math.sin(a) * (R * .55 + rad * .5); m.compose(new THREE.Vector3(px, y, pz), q, new THREE.Vector3(1, 1, 1)); im.setMatrixAt(i, m); im.setColorAt(i, c.set(renk).multiplyScalar(.75 + rr() * .5)); }
  im.instanceColor.needsUpdate = true; im.castShadow = true; im.receiveShadow = true; return im;
}

// ---------- sahne ----------
const canvas = document.getElementById('sahne');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: TUR_MODU });
renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.08;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const scene = new THREE.Scene();
const pm = new THREE.PMREMGenerator(renderer); scene.environment = pm.fromScene(new RoomEnvironment(), .04).texture; scene.environmentIntensity = .75;
const cam = new THREE.PerspectiveCamera(32, 1, .1, 60);
scene.add(new THREE.HemisphereLight('#fff3df', '#2a1c12', .55));
const ana = new THREE.DirectionalLight('#fff0d8', 2.6); ana.position.set(-3.5, 6.5, 4.5); ana.castShadow = true; ana.shadow.mapSize.set(2048, 2048);
Object.assign(ana.shadow.camera, { left: -4, right: 4, top: 4.5, bottom: -1.5, near: 1, far: 20 }); ana.shadow.bias = -.0004; ana.shadow.radius = 5; scene.add(ana);
const kenar = new THREE.PointLight(A.tema.vurgu || '#d9a441', 22, 12); kenar.position.set(3.2, 2.6, -2.6); scene.add(kenar);

const sahneGrup = new THREE.Group(); scene.add(sahneGrup);
const kaide = new THREE.Group(); sahneGrup.add(kaide);
const kaideMat = new THREE.MeshStandardMaterial({ map: benekDoku(A.tema.kaide || '#e9dfcf', '#8f8474', 500, 9), roughness: .62 });
const kd = new THREE.Mesh(new THREE.CylinderGeometry(1.42, 1.46, .2, 96), kaideMat); kd.position.y = -.1; kd.receiveShadow = true; kd.castShadow = true; kaide.add(kd);
const halka = new THREE.Mesh(new THREE.TorusGeometry(1.43, .014, 8, 128), new THREE.MeshStandardMaterial({ color: A.tema.vurgu || '#d9a441', metalness: 1, roughness: .25 })); halka.rotation.x = Math.PI / 2; halka.position.y = .002; kaide.add(halka);
const zemin = new THREE.Mesh(new THREE.CircleGeometry(9, 64), new THREE.ShadowMaterial({ opacity: .32 })); zemin.rotation.x = -Math.PI / 2; zemin.position.y = -.2; zemin.receiveShadow = true; sahneGrup.add(zemin);

const SAHNE = A.sahneler, N = SAHNE.length, modeller = [];
for (let i = 0; i < N; i++) { const s = SAHNE[i], m = MODEL[s.model](s.parca || {}); const sar = new THREE.Group(); sar.add(m); sar.userData = { ic: m, baz: s.aci || 0 }; sahneGrup.add(sar); modeller.push(sar); }

// toz / ışık zerreleri (tohumlu)
const zr = tohum(42), ZN = 90, zp = new Float32Array(ZN * 3), zt = [];
for (let i = 0; i < ZN; i++) { zt.push([(zr() - .5) * 9, zr() * 5, (zr() - .5) * 5 - 1, .2 + zr() * .5, zr() * 6.28]); }
const zg = new THREE.BufferGeometry(); zg.setAttribute('position', new THREE.BufferAttribute(zp, 3));
const zerre = new THREE.Points(zg, new THREE.PointsMaterial({ color: '#ffe9c4', size: .035, transparent: true, opacity: .55, depthWrite: false })); scene.add(zerre);

// ---------- düzen ----------
const bloklar = [...document.querySelectorAll('.blok')], noktalar = [...document.querySelectorAll('.sira i')];
const fon = document.documentElement.style;
let W = 0, H = 0, dikey = false, surukle = 0, hedefSurukle = 0;
function boyut() {
  W = innerWidth; H = innerHeight; dikey = W / H < .9 || W < 820;
  renderer.setPixelRatio(TUR_MODU ? 1 : Math.min(devicePixelRatio || 1, 2)); renderer.setSize(W, H, false);
  cam.aspect = W / H; cam.updateProjectionMatrix();
}
function kaydirmaDurumu() {
  // p: hangi sahne (0..N-1, kesirli), L: son bölümde dizilim (0..1)
  const y = scrollY, son = bloklar[bloklar.length - 1];
  let p = 0;
  for (let i = 0; i < N; i++) { const b = bloklar[i]; const c = b.offsetTop + b.offsetHeight / 2 - H / 2; if (i === 0 && y <= c) { p = 0; break; } const nb = bloklar[i + 1]; if (!nb || i === N - 1) { p = N - 1; break; } const nc = nb.offsetTop + nb.offsetHeight / 2 - H / 2; if (y < nc) { p = i + yum(clamp((y - c) / (nc - c), 0, 1) * 1.5 - .25); break; } }
  const sc = son.offsetTop + son.offsetHeight / 2 - H / 2, oc = bloklar[N - 1].offsetTop + bloklar[N - 1].offsetHeight / 2 - H / 2;
  const L = yum(clamp((y - oc) / Math.max(1, sc - oc), 0, 1) * 1.4 - .2);
  return { p, L, y };
}
const rk = { a: new THREE.Color(), b: new THREE.Color(), c: new THREE.Color(), d: new THREE.Color() };
function guncelle(t) {
  const { p, L, y } = kaydirmaDurumu();
  const i0 = Math.floor(p), i1 = Math.min(N - 1, i0 + 1), f = p - i0;
  rk.c.copy(rk.a.set(SAHNE[i0].fon[0])).lerp(rk.b.set(SAHNE[i1].fon[0]), f); rk.d.copy(rk.a.set(SAHNE[i0].fon[1])).lerp(rk.b.set(SAHNE[i1].fon[1]), f);
  fon.setProperty('--zemin1', '#' + rk.c.getHexString()); fon.setProperty('--zemin2', '#' + rk.d.getHexString());
  // kamera: geniş ekranda ürün sağda, dikeyde üstte
  const ox = dikey ? 0 : lerp(1.7, 0, L), z = dikey ? 12.2 : 7.9;
  cam.position.set(dikey ? 0 : lerp(.35, 0, L), dikey ? 2.2 : lerp(1.8, 2.3, L), z); cam.lookAt(dikey ? 0 : lerp(-.1, 0, L), dikey ? .1 : lerp(1.0, .75, L), 0);
  sahneGrup.position.x = ox; sahneGrup.position.y = dikey ? lerp(1.15, 1.5, L) : lerp(0, .95, L);
  surukle += (hedefSurukle - surukle) * (TUR_MODU ? 1 : .12);
  for (let i = 0; i < N; i++) {
    const g = modeller[i], u = i - p, au = Math.abs(u), ic = g.userData.ic, ud = ic.userData;
    const dx = (i - (N - 1) / 2) * (dikey ? Math.min(1.0, 3.3 / (N - 1)) : Math.min(1.9, 6.6 / (N - 1))), ds = dikey ? (N > 3 ? .28 : .36) : (N > 3 ? .5 : .56);
    const tek = 1 - yum(Math.min(au, 1) * 1.25);            // sahnedeyken 1, komşuyken 0
    const x = lerp(u * 2.6, dx, L), sc = lerp(tek, ds, L);
    g.visible = sc > .012;
    g.position.set(x, lerp((1 - tek) * .5, -.2, L), lerp(-(1 - tek) * 1.5, 0, L)); g.scale.setScalar(Math.max(sc, .001));
    const don = (ud.salin || .55) * Math.sin(t * .55 + i);   // sürekli dönmez, etiket hep öne yakın kalır; tam tur için sürükle
    g.rotation.y = g.userData.baz * (1 - L) + lerp(don, .25 * Math.sin(t * .4 + i), L) + (au < .5 ? surukle : 0) + u * 1.4 * (1 - L);
    g.rotation.x = (ud.egim || 0) * (1 - L * .5);
    if (ud.canli) ud.canli(t);
  }
  kaide.scale.setScalar(Math.max(.001, 1 - yum(L * 1.6))); kaide.visible = L < .62;
  for (let i = 0; i < ZN; i++) { const q = zt[i]; zp[i * 3] = q[0] + Math.sin(t * q[3] + q[4]) * .3; zp[i * 3 + 1] = (q[1] + t * q[3] * .12) % 5; zp[i * 3 + 2] = q[2]; } zg.attributes.position.needsUpdate = true;
  const orta = y + H * .5;
  bloklar.forEach((b, i) => { const g = orta > b.offsetTop + H * .12 && orta < b.offsetTop + b.offsetHeight + H * .3; b.classList.toggle('gorunur', g); });
  const ak = Math.round(p); noktalar.forEach((n, i) => n.classList.toggle('a', i === ak && L < .5));
  renderer.render(scene, cam);
}

// sürükleyerek çevirme
let basX = null, basS = 0;
canvas.addEventListener('pointerdown', e => { basX = e.clientX; basS = hedefSurukle; canvas.setPointerCapture(e.pointerId); });
canvas.addEventListener('pointermove', e => { if (basX !== null) hedefSurukle = basS + (e.clientX - basX) * .012; });
const birak = () => { basX = null; }; canvas.addEventListener('pointerup', birak); canvas.addEventListener('pointercancel', birak);
addEventListener('resize', boyut);
boyut();

// ---------- tur (deterministik) ----------
function turKur() {
  const DUR = 4.2, GEC = 1.3, sahneler = [], anahtar = []; let t = 0;
  bloklar.forEach((b, i) => { const ad = b.dataset.ad || ('Bölüm ' + (i + 1)); sahneler.push({ ad, bas: +t.toFixed(2), bit: +(t + DUR).toFixed(2) }); anahtar.push([t, i], [t + DUR, i]); t += DUR + (i < bloklar.length - 1 ? GEC : 0); });
  const sure = +t.toFixed(2);
  const hedefY = i => { const b = bloklar[i]; return clamp(b.offsetTop + b.offsetHeight / 2 - innerHeight / 2, 0, document.documentElement.scrollHeight - innerHeight); };
  function kare(tt) {
    tt = clamp(tt, 0, sure); let y = hedefY(anahtar[anahtar.length - 1][1]);
    for (let k = 0; k < anahtar.length - 1; k++) { const [ta, ia] = anahtar[k], [tb, ib] = anahtar[k + 1]; if (tt >= ta && tt <= tb) { y = lerp(hedefY(ia), hedefY(ib), ia === ib ? 0 : yum((tt - ta) / (tb - ta))); break; } }
    document.documentElement.scrollTop = y; document.body.scrollTop = y;
    hedefSurukle = surukle = Math.sin(tt * .9) * .22;
    guncelle(tt); return tt;
  }
  window.TUR = { sure, sahneler, kare };
}

function hazir() { window.HAZIR = true; document.documentElement.classList.add('hazir'); }
if (TUR_MODU) {
  turKur(); (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => { boyut(); window.TUR.kare(0); hazir(); });
} else {
  const t0 = performance.now(); let ilk = true;
  const dongu = () => { guncelle((performance.now() - t0) / 1000); if (ilk) { ilk = false; hazir(); } requestAnimationFrame(dongu); };
  requestAnimationFrame(dongu);
}
