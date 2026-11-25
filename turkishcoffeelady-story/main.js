/* Bold Istanbul · 3D story page.
   One fixed WebGL scene; each chapter adds its own 3D objects around the can as you scroll. */

const FILMS = [
  { yt: 'X8lP0j7vcnA', poster: './assets/film-2.webp', kind: 'Teaser', title: { en: 'Tales of Anatolia', tr: 'Anadolu Hikâyeleri' }, line: { en: 'Where the ritual comes from.', tr: 'Ritüelin geldiği yer.' } },
  { yt: 'zXI4Pu0NAJY', poster: './assets/film-1.webp', kind: 'Seyir', title: { en: 'A Cup of Courage', tr: 'Bir Fincan Cesaret' }, line: { en: '“Nobody in America drinks Turkish coffee.” She did it anyway.', tr: '“Amerika’da kimse Türk kahvesi içmez.” O yine de yaptı.' } },
];
const LAUNCH = new Date('2026-12-05T00:00:00-05:00');
const FORTUNES = {
  en: ['A bird in your cup: good news is on its way.', 'A road opens ahead. Take it, and take a friend.', 'Someone is thinking of you more than you think.', 'The cup shows a key. That door is not closed.', 'Forty years of friendship start with the next cup you share.', 'A small risk this week becomes a good story.'],
  tr: ['Fincanında bir kuş var: iyi haber yolda.', 'Önünde bir yol açılıyor. Git, yanına bir dost al.', 'Biri seni sandığından çok düşünüyor.', 'Fincanda bir anahtar var. O kapı kapalı değil.', 'Kırk yıllık dostluk, paylaşacağın bir sonraki fincanla başlar.', 'Bu hafta göze aldığın küçük risk güzel bir hikâye olacak.'],
};
const CALLOUTS = [
  { p: [0.0, 1.42, 0], lift: 'lid', dx: 170, dy: -30, en: ['Ready to drink', 'Pull-tab, no opener'], tr: ['İçime hazır', 'Halkalı kapak, açacak yok'] },
  { p: [0.5, 0.55, 0.15], lift: 'label', dx: 190, dy: -50, en: ['Watercolor Istanbul', 'Galata · Maiden’s Tower'], tr: ['Suluboya İstanbul', 'Galata · Kız Kulesi'] },
  { p: [0.5, -0.45, 0.1], lift: 'label', dx: 180, dy: 50, en: ['Zero sugar', '100% natural · low calories'], tr: ['Sıfır şeker', '%100 doğal · düşük kalori'] },
  { p: [0.0, -1.36, 0.2], lift: 'bottom', dx: -170, dy: 50, mdx: 150, en: ['8.5 fl oz · 250 ml', 'One cold serving'], tr: ['250 ml', 'Tek soğuk porsiyon'] },
];
const TR = {
  'nav.can': 'Kutu', 'nav.films': 'Filmler', 'nav.launch': 'Lansman', tap: 'dokun',
  'hero.k': 'Buzlu Türk kahvesi · 250 ml', h1a: 'İstanbul’u', h1b: 'sen', h1c: 'dök.',
  'hero.sub': 'Beş asırlık Türk kahvesi; soğuk ve sıfır şekerli. Kutuya dokun.', 'hero.date': 'ABD lansmanı · 5 Aralık', scroll: 'Kaydır',
  'c1.k': 'Şeker', 'c2.k': 'Soğuk', 'c3.k': 'Öğütme', 'c4.k': 'Nazar', 'c5.k': 'Kutu', 'c6.k': 'Dök',
  'c1.a': 'Sıfır şeker.', 'c1.b': 'Bir gram bile.', 'c1.p': 'Şurup yok, tatlandırıcı yok. Sadece ince öğütülmüş kahve, su ve soğuk. Kalorisi düşük, lezzeti büyük.',
  'c2.a': 'Sıcak demlenir,', 'c2.b': 'buz gibi içilir.', 'c2.p': 'Türk kahvesi ağır ağır demlenir, sonra soğutulup kutulanır. Buzdolabından ya da buzun üzerine.',
  'c3.a': 'Un inceliğinde', 'c3.b': 'öğütülür.', 'c3.p': 'İstanbul’da ilk kahvehanelerin açıldığı 1554’ten beri olduğu gibi. Koyu, yoğun ve kadifemsi tadı buradan gelir.', 'c3.s': 'İstanbul’un ilk kahvehaneleri',
  'c4.a': 'Her kutuda', 'c4.b': 'bir nazar boncuğu.', 'c4.p': 'Türkiye’de fincan hep bir falla biter. Her Bold Istanbul küçük bir iyi şans sözü taşır.',
  'c5.a': 'Bir kutuya sarılmış', 'c5.b': 'İstanbul.', 'c5.p': 'Etikette Boğaz’ın, Galata’nın ve Kız Kulesi’nin suluboyası. 250 ml, içime hazır, nerede olursan ol.',
  'c6.a': 'Çalkala.', 'c6.b': 'Soğuk iç.', 'c6.p': 'Gövdesi ve köpüğü uyansın diye iyice çalkala, sonra buzun üzerine dök. İyi kahve, iyi şans.',
  'f.k': 'Filmler', 'f.title': 'İki film,<br />bir fincan cesaret.',
  'fo.k': 'Kurucu', 'fo.q': '“Bir fincan kahvenin kırk yıl hatırı vardır.”',
  'fo.b': '2007’de Boston’da bir fincanla başladı. Sonra Amerika’yı dolaşan bir kahve kamyonu, ABD’deki ilk Türk kahvesi dükkânı, Old Town Alexandria’da bir kültür evi ve şimdi dünyanın ilk şişelenmiş soğuk Türk kahvesi (patent başvurusu sürüyor). Hikâyenin tamamı <i>Hayalini Demle</i> kitabında.',
  'c.title': 'Bir yudum<br />almadan gitme.', 'c.hint': 'Falın için kutuya dokun.', 'c.date': '5 Aralık · Dünya Türk Kahvesi Günü · ABD', 'c.btn': 'Haber ver →',
  foot: 'Bold Istanbul, buzlu Türk kahvesi · konsept demo',
};
const EXTRA = {
  en: { ok: 'Thank you. You’ll hear from us on December 5.', err: 'Something went wrong. Please try again.', sound: 'Watch with sound →', days: 'days to go', live: 'On shelves now' },
  tr: { ok: 'Teşekkürler. 5 Aralık’ta haber vereceğiz.', err: 'Bir sorun oldu, tekrar dener misin?', sound: 'Sesli izle →', days: 'gün kaldı', live: 'Şimdi raflarda' },
};
const isMobile = () => innerWidth < 820;
const clamp01 = (x) => Math.min(1, Math.max(0, x));
const sm = (a, b, x) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const win = (t, a, b, c, d) => sm(a, b, t) * (1 - sm(c, d, t));

/* ---------- i18n ---------- */
let lang = 'en';
try { lang = localStorage.getItem('bi-lang') || ((navigator.language || '').startsWith('tr') ? 'tr' : 'en'); } catch (e) {}
const EN = {};
document.querySelectorAll('[data-i18n]').forEach((el) => { EN[el.dataset.i18n] = el.innerHTML; });
const tx = (k) => (lang === 'tr' ? TR[k] : EN[k]) ?? EN[k];
function applyLang(l) {
  lang = l; document.documentElement.lang = l;
  document.querySelectorAll('[data-i18n]').forEach((el) => { const v = tx(el.dataset.i18n); if (v) el.innerHTML = v; });
  document.getElementById('lang').textContent = l === 'en' ? 'TR' : 'EN';
  try { localStorage.setItem('bi-lang', l); } catch (e) {}
  renderFilms(); countdown(); buildCallouts();
}
document.getElementById('lang').addEventListener('click', () => applyLang(lang === 'en' ? 'tr' : 'en'));

/* ---------- loader ---------- */
const load = { need: 3, got: 0 };
const pct = document.getElementById('loadPct');
const loaded = () => { load.got++; pct.textContent = Math.round((load.got / load.need) * 100) + '%'; if (load.got >= load.need) ready(); };
let isReady = false, readyAt = 0;
function ready() {
  if (isReady) return; isReady = true;
  document.body.classList.remove('loading');
  setTimeout(() => { document.body.classList.add('ready'); readyAt = performance.now(); }, 200);
}
setTimeout(ready, 7000);
document.fonts && document.fonts.ready.then(loaded);

/* ---------- smooth scroll, nav, chapter dots ---------- */
let lenis = null;
addEventListener('load', () => {
  if (!window.Lenis || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  lenis = new window.Lenis({ lerp: 0.085 });
  const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); }; requestAnimationFrame(raf);
});
const goTo = (el) => (lenis ? lenis.scrollTo(el, { duration: 1.6 }) : el.scrollIntoView({ behavior: 'smooth' }));
document.querySelectorAll('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => { const t = document.querySelector(a.getAttribute('href')); if (t) { e.preventDefault(); goTo(t); } }));
document.querySelectorAll('[data-go]').forEach((li) => li.addEventListener('click', () => goTo(document.getElementById(li.dataset.go))));
const nav = document.getElementById('nav');
const dots = document.getElementById('chapters');
const chEls = [...document.querySelectorAll('.ch')];
const io = new IntersectionObserver((es) => es.forEach((e) => e.target.classList.toggle('in', e.isIntersecting)), { threshold: 0.12 });
chEls.forEach((el) => io.observe(el));

/* section progress: 0 when its top reaches mid-screen, 1 when its bottom does */
const secs = {};
function measure() {
  ['hero', 'sugar', 'ice', 'beans', 'eye', 'parts', 'pour', 'films', 'closing'].forEach((id) => {
    const el = document.getElementById(id); const r = el.getBoundingClientRect();
    secs[id] = { top: r.top + scrollY, h: r.height };
  });
}
const prog = (id) => { const s = secs[id]; return (scrollY + innerHeight / 2 - s.top) / s.h; };
addEventListener('resize', () => { measure(); buildCallouts(); });
new ResizeObserver(measure).observe(document.body);
measure();
function onScroll() {
  nav.classList.toggle('scrolled', scrollY > 30);
  let active = -1;
  chEls.forEach((el, i) => { const p = prog(el.id); if (p >= 0 && p < 1) active = i; });
  dots.classList.toggle('on', active >= 0);
  [...dots.children].forEach((li, i) => li.classList.toggle('on', i === active));
}
addEventListener('scroll', onScroll, { passive: true });

/* ---------- callouts (filled by the 3D scene) ---------- */
const coLayer = document.getElementById('callouts');
let coEls = [];
function buildCallouts() {
  coLayer.innerHTML = '';
  coEls = CALLOUTS.map((c) => {
    const el = document.createElement('div'); el.className = 'co';
    const f = isMobile() ? 0.32 : 1, dx = isMobile() && c.mdx ? c.mdx * f : c.dx * f, dy = c.dy * (isMobile() ? 0.6 : 1);
    const len = Math.hypot(dx, dy), ang = Math.atan2(dy, dx);
    el.innerHTML = `<i class="co__dot"></i><i class="co__line" style="width:${len}px;transform:rotate(${ang}rad)"></i>
      <span class="co__txt" style="left:${dx}px;top:${dy}px;transform:translate(${dx < 0 ? '-100%' : '0'},-50%)"><b>${c[lang][0]}</b>${c[lang][1]}</span>`;
    coLayer.appendChild(el); return el;
  });
}

/* ---------- tap / fortune ---------- */
const tapBtn = document.getElementById('tap');
const fortune = document.getElementById('fortune');
let shake = 0, lastF = -1;
tapBtn.addEventListener('click', () => {
  shake = 1;
  if (prog('closing') > 0.05) {
    fortune.style.opacity = 0;
    setTimeout(() => {
      let i; do { i = Math.floor(Math.random() * FORTUNES.en.length); } while (i === lastF);
      lastF = i; fortune.removeAttribute('data-i18n'); fortune.textContent = FORTUNES[lang][i]; fortune.style.opacity = 1;
    }, 700);
  }
});

/* ---------- 3D ---------- */
init3D().catch((e) => { console.warn(e); document.body.classList.add('no-webgl'); load.got = load.need; ready(); });

async function init3D() {
  const THREE = await import('three');
  const { RGBELoader } = await import('three/addons/loaders/RGBELoader.js');
  const { RoundedBoxGeometry } = await import('three/addons/geometries/RoundedBoxGeometry.js');
  const canvas = document.getElementById('gl');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setClearColor(new THREE.Color('#f1ece3'), 1);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  camera.position.set(0, 0, 9);

  const pmrem = new THREE.PMREMGenerator(renderer);
  new RGBELoader().load('./assets/env.hdr', (hdr) => { scene.environment = pmrem.fromEquirectangular(hdr).texture; hdr.dispose(); loaded(); }, undefined, loaded);
  scene.add(new THREE.HemisphereLight(0xffffff, 0xd9cdb8, 0.6));
  const key = new THREE.DirectionalLight(0xfff4e6, 2.2); key.position.set(-4, 5, 6); scene.add(key);
  const rim = new THREE.DirectionalLight(0xdfe8ff, 1.4); rim.position.set(5, 2, -4); scene.add(rim);

  /* --- groups: stage (placement) > pivot (tilt/shake) > can (spin) --- */
  const stage = new THREE.Group(); scene.add(stage);
  const pivot = new THREE.Group(); stage.add(pivot);
  const can = new THREE.Group(); pivot.add(can);

  const label = new THREE.TextureLoader().load('./assets/label.webp', loaded, undefined, loaded);
  label.colorSpace = THREE.SRGBColorSpace; label.anisotropy = renderer.capabilities.getMaxAnisotropy(); label.wrapS = THREE.RepeatWrapping;
  const metal = new THREE.MeshStandardMaterial({ color: 0xdfe3e8, metalness: 1, roughness: 0.22, side: THREE.DoubleSide });
  const labelMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 2.44, 128, 1, true),
    new THREE.MeshPhysicalMaterial({ map: label, roughness: 0.34, metalness: 0.1, clearcoat: 1, clearcoatRoughness: 0.2, side: THREE.DoubleSide }));
  can.add(labelMesh);
  const inner = new THREE.Mesh(new THREE.CylinderGeometry(0.49, 0.49, 2.44, 96, 1, true), metal); can.add(inner);
  const lathe = (pts) => new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), 128);
  const lid = new THREE.Group(); can.add(lid);
  lid.add(new THREE.Mesh(lathe([[0.5, 1.22], [0.497, 1.26], [0.483, 1.305], [0.455, 1.35], [0.44, 1.385], [0.452, 1.405], [0.447, 1.425], [0.43, 1.422], [0.418, 1.4], [0.41, 1.385], [0.3, 1.38], [0, 1.378]]), metal));
  const tabShape = new THREE.Shape(); tabShape.absarc(0, 0, 0.11, Math.PI * 0.15, Math.PI * 1.85, false); tabShape.lineTo(0.16, -0.05); tabShape.lineTo(0.16, 0.05);
  const hole = new THREE.Path(); hole.absellipse(-0.01, 0, 0.055, 0.04, 0, Math.PI * 2); tabShape.holes.push(hole);
  const tab = new THREE.Mesh(new THREE.ExtrudeGeometry(tabShape, { depth: 0.012, bevelEnabled: true, bevelThickness: 0.006, bevelSize: 0.006, bevelSegments: 2 }), metal);
  tab.rotation.set(-Math.PI / 2, 0, -Math.PI / 2); tab.position.set(-0.04, 1.392, 0.1); lid.add(tab);
  const bottom = new THREE.Mesh(lathe([[0, -1.34], [0.28, -1.345], [0.37, -1.325], [0.44, -1.29], [0.485, -1.25], [0.5, -1.22]]), metal); can.add(bottom);

  /* soft contact shadow */
  const shTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'); const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(40,35,60,.55)'); gr.addColorStop(1, 'rgba(40,35,60,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c); })();
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 2.2), new THREE.MeshBasicMaterial({ map: shTex, transparent: true, depthWrite: false, toneMapped: false }));
  shadow.rotation.x = -Math.PI / 2; shadow.position.y = -1.37; stage.add(shadow);

  /* soft particle sprite */
  const sprite = (rgb) => { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'); const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, `rgba(${rgb},1)`); gr.addColorStop(1, `rgba(${rgb},0)`); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); };
  const rnd = (a, b) => a + Math.random() * (b - a);
  const dummy = new THREE.Object3D();

  /* 01 · sugar cubes that fly in and dissolve */
  const NS = 12;
  const sugar = new THREE.InstancedMesh(new RoundedBoxGeometry(0.26, 0.26, 0.26, 3, 0.035), new THREE.MeshStandardMaterial({ color: 0xfdfbf6, roughness: 0.85 }), NS);
  const sData = [...Array(NS)].map((_, i) => { const a = (i / NS) * Math.PI * 2; const ring = new THREE.Vector3(Math.cos(a) * 1.25, rnd(-1.1, 1.1), Math.sin(a) * 1.25); return { ring, far: ring.clone().multiplyScalar(rnd(2.6, 3.6)).add(new THREE.Vector3(0, rnd(-1, 1), 0)), rot: new THREE.Euler(rnd(0, 6), rnd(0, 6), 0), sp: rnd(0.3, 0.8) }; });
  stage.add(sugar);
  const NSD = NS * 24, sdPos = new Float32Array(NSD * 3), sdDir = [];
  for (let i = 0; i < NSD; i++) sdDir.push(new THREE.Vector3(rnd(-1, 1), rnd(-0.4, 1), rnd(-1, 1)).normalize().multiplyScalar(rnd(0.2, 0.9)));
  const sdGeo = new THREE.BufferGeometry(); sdGeo.setAttribute('position', new THREE.BufferAttribute(sdPos, 3));
  const sdMat = new THREE.PointsMaterial({ map: sprite('255,255,255'), size: 0.09, transparent: true, depthWrite: false, opacity: 0, color: 0xffffff });
  const sugarDust = new THREE.Points(sdGeo, sdMat); stage.add(sugarDust);

  /* 02 · ice cubes and condensation */
  const iceMat = new THREE.MeshPhysicalMaterial({ color: 0xf2f8ff, transmission: 1, thickness: 0.6, roughness: 0.06, ior: 1.31, clearcoat: 1, attenuationColor: new THREE.Color('#d8ecff'), attenuationDistance: 2 });
  const NI = 7;
  const ice = new THREE.InstancedMesh(new RoundedBoxGeometry(0.36, 0.36, 0.36, 4, 0.06), iceMat, NI);
  const iData = [...Array(NI)].map((_, i) => ({ a: (i / NI) * Math.PI * 2, y: rnd(-1, 1.1), r: rnd(1.15, 1.5), s: rnd(0.7, 1.15), rot: new THREE.Euler(rnd(0, 6), rnd(0, 6), rnd(0, 6)) }));
  stage.add(ice);
  const ND = isMobile() ? 260 : 520;
  const drops = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 10, 8), new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.45, roughness: 0.02, metalness: 0, clearcoat: 1, envMapIntensity: 2.2 }), ND);
  const dData = [...Array(ND)].map(() => { const a = rnd(0, Math.PI * 2), y = rnd(-1.15, 1.15), s = Math.pow(Math.random(), 2.4) * 0.022 + 0.005; return { p: new THREE.Vector3(Math.sin(a) * 0.503, y, Math.cos(a) * 0.503), a, s, d: Math.random() }; });
  can.add(drops);

  /* 03 · coffee bean helix that turns into fine powder */
  const beanGeo = new THREE.SphereGeometry(0.1, 20, 14);
  { const p = beanGeo.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i); const y = p.getY(i) * 0.72; let z = p.getZ(i) * 0.58; if (z > 0) z -= 0.03 * Math.exp(-((x / 0.016) ** 2)); p.setXYZ(i, x, y, z); } beanGeo.computeVertexNormals(); }
  const NB = 38;
  const beans = new THREE.InstancedMesh(beanGeo, new THREE.MeshStandardMaterial({ color: 0x3b1f0e, roughness: 0.32 }), NB);
  const bData = [...Array(NB)].map((_, i) => ({ k: i / NB, rot: new THREE.Euler(rnd(0, 6), rnd(0, 6), rnd(0, 6)), s: rnd(0.8, 1.2) }));
  stage.add(beans);
  const NP = 900, pwPos = new Float32Array(NP * 3), pwSeed = [...Array(NP)].map(() => ({ k: Math.random(), r: rnd(0.9, 1.6), o: rnd(0, 6) }));
  const pwGeo = new THREE.BufferGeometry(); pwGeo.setAttribute('position', new THREE.BufferAttribute(pwPos, 3));
  const pwMat = new THREE.PointsMaterial({ map: sprite('90,52,30'), size: 0.05, transparent: true, depthWrite: false, opacity: 0 });
  const powder = new THREE.Points(pwGeo, pwMat); stage.add(powder);

  /* 04 · the evil eye leaves the label as a glass bead */
  const eye = new THREE.Group();
  const disc = (r, z, color, extra = {}) => { const m = new THREE.Mesh(new THREE.SphereGeometry(r, 64, 32), new THREE.MeshPhysicalMaterial({ color, roughness: 0.08, clearcoat: 1, ...extra })); m.scale.z = 0.3; m.position.z = z; eye.add(m); return m; };
  disc(0.55, 0, 0x1d3aa8, { transmission: 0.35, thickness: 0.5 });
  disc(0.38, 0.1, 0xf6f3ea); disc(0.25, 0.16, 0x8ec5ea); disc(0.12, 0.21, 0x0d1030);
  const loop = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.018, 12, 32), metal); loop.position.y = 0.6; eye.add(loop);
  stage.add(eye);

  /* 06 · glass, coffee, stream */
  const glass = new THREE.Group(); stage.add(glass);
  glass.add(new THREE.Mesh(lathe([[0, 0], [0.34, 0], [0.37, 0.03], [0.37, 0.07], [0.42, 1.05], [0.425, 1.07], [0.405, 1.07], [0.355, 0.1], [0, 0.1]]),
    new THREE.MeshPhysicalMaterial({ color: 0xffffff, transmission: 1, roughness: 0.03, thickness: 0.15, ior: 1.5, clearcoat: 1, side: THREE.DoubleSide })));
  const coffeeMat = new THREE.MeshPhysicalMaterial({ color: 0x2b150a, roughness: 0.12, clearcoat: 1 });
  const liquidGeo = new THREE.CylinderGeometry(0.4, 0.357, 1, 48); liquidGeo.translate(0, 0.5, 0);
  const liquid = new THREE.Mesh(liquidGeo, coffeeMat); liquid.position.y = 0.1; glass.add(liquid);
  const foam = new THREE.Mesh(new THREE.CylinderGeometry(0.39, 0.39, 0.03, 48), new THREE.MeshStandardMaterial({ color: 0xc49a6c, roughness: 0.9 })); glass.add(foam);
  const gIce = new THREE.InstancedMesh(new RoundedBoxGeometry(0.2, 0.2, 0.2, 3, 0.04), iceMat, 3); glass.add(gIce);
  const gShadow = shadow.clone(); gShadow.scale.setScalar(0.5); glass.add(gShadow); gShadow.position.y = -0.005;
  const streamGeo = new THREE.CylinderGeometry(0.028, 0.04, 1, 12, 1, true); streamGeo.translate(0, -0.5, 0);
  const stream = new THREE.Mesh(streamGeo, coffeeMat); scene.add(stream);

  /* --- scroll choreography for the can itself --- */
  const KF = () => isMobile() ? [
    ['hero', 0.5, { x: 0, y: -0.12, ry: 0, sc: 0.62 }], ['sugar', 0.5, { x: 0, y: 0.3, ry: Math.PI, sc: 0.5 }],
    ['ice', 0.5, { x: 0, y: 0.3, ry: Math.PI * 2, sc: 0.5 }], ['beans', 0.5, { x: 0, y: 0.3, ry: Math.PI * 3, sc: 0.5 }],
    ['eye', 0.5, { x: -0.25, y: 0.3, ry: Math.PI * 4 - 0.2, sc: 0.5 }], ['parts', 0.5, { x: -0.3, y: 0.26, ry: Math.PI * 4 + 0.35, sc: 0.42 }],
    ['pour', 0.5, { x: -0.3, y: 0.24, ry: Math.PI * 4, sc: 0.46 }], ['closing', 0.55, { x: 0.2, y: -0.4, ry: Math.PI * 6, sc: 0.5 }],
  ] : [
    ['hero', 0.5, { x: -0.16, y: -0.02, ry: 0, sc: 0.95 }], ['sugar', 0.5, { x: 0.24, y: 0, ry: Math.PI, sc: 0.95 }],
    ['ice', 0.5, { x: -0.22, y: 0, ry: Math.PI * 2, sc: 0.95 }], ['beans', 0.5, { x: 0.24, y: 0, ry: Math.PI * 3, sc: 0.95 }],
    ['eye', 0.5, { x: -0.33, y: 0, ry: Math.PI * 4 - 0.25, sc: 0.95 }], ['parts', 0.5, { x: 0.18, y: -0.02, ry: Math.PI * 4 + 0.35, sc: 0.85 }],
    ['pour', 0.5, { x: -0.32, y: 0.02, ry: Math.PI * 4, sc: 0.85 }], ['closing', 0.5, { x: 0.22, y: -0.04, ry: Math.PI * 6, sc: 0.9 }],
  ];
  function base() {
    const f = KF().map(([id, at, s]) => ({ y: secs[id].top + secs[id].h * at, s }));
    const p = scrollY + innerHeight / 2;
    if (p <= f[0].y) return f[0].s;
    for (let i = 0; i < f.length - 1; i++) if (p <= f[i + 1].y) { const k = sm(0, 1, (p - f[i].y) / (f[i + 1].y - f[i].y)); const o = {}; for (const key in f[i].s) o[key] = f[i].s[key] + (f[i + 1].s[key] - f[i].s[key]) * k; return o; }
    return f[f.length - 1].s;
  }

  let halfW = 1, halfH = 1;
  function resize() { renderer.setSize(innerWidth, innerHeight, false); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); halfH = Math.tan(THREE.MathUtils.degToRad(15)) * 9; halfW = halfH * camera.aspect; }
  addEventListener('resize', resize); resize();

  const cur = { ...base() };
  const ptr = { x: 0, y: 0, tx: 0, ty: 0 };
  addEventListener('pointermove', (e) => { ptr.tx = e.clientX / innerWidth - 0.5; ptr.ty = e.clientY / innerHeight - 0.5; }, { passive: true });
  const clock = new THREE.Clock();
  const v = new THREE.Vector3(), mouth = new THREE.Vector3(), surf = new THREE.Vector3();
  const toScreen = (vec) => { vec.project(camera); return [(vec.x + 1) / 2 * innerWidth, (1 - vec.y) / 2 * innerHeight]; };

  function frame() {
    const dt = Math.min(clock.getDelta(), 0.05), time = clock.elapsedTime;
    const tg = base(), k = 1 - Math.exp(-dt * 6);
    for (const key in tg) cur[key] += (tg[key] - cur[key]) * k;
    ptr.x += (ptr.tx - ptr.x) * 0.05; ptr.y += (ptr.ty - ptr.y) * 0.05;
    shake *= Math.exp(-dt * 2.6);

    const T = { hero: prog('hero'), sugar: prog('sugar'), ice: prog('ice'), beans: prog('beans'), eye: prog('eye'), parts: prog('parts'), pour: prog('pour'), closing: prog('closing') };
    const intro = readyAt ? sm(0, 1, (performance.now() - readyAt - 200) / 1800) : 0;
    const idle = 1 - sm(0.5, 0.9, T.hero) + sm(0, 0.4, T.closing);

    stage.position.set(cur.x * halfW, cur.y * halfH - (1 - intro) * 1.2, 0);
    stage.scale.setScalar(cur.sc);
    stage.rotation.x = ptr.y * 0.06 + 0.04;

    /* 05 · exploded view */
    const ex = win(T.parts, 0.12, 0.34, 0.78, 0.95);
    lid.position.y = ex * 0.55; bottom.position.y = -ex * 0.4;
    labelMesh.scale.set(1 + ex * 0.22, 1 + ex * 0.04, 1 + ex * 0.22);
    labelMesh.material.opacity = 1;

    /* 06 · pour */
    const tilt = sm(0.12, 0.42, T.pour) * (1 - sm(1.02, 1.2, T.pour));
    const fill = sm(0.42, 0.85, T.pour) * (1 - sm(1.02, 1.2, T.pour));
    const gIn = sm(0, 0.18, T.pour) * (1 - sm(1.05, 1.25, T.pour));
    pivot.rotation.z = -2.05 * tilt + Math.sin(time * 38) * 0.12 * shake;
    pivot.position.set(-0.15 * tilt, 1.0 * tilt + Math.sin(time * 1.2) * 0.04 * idle, 0);
    can.rotation.y = cur.ry - (1 - intro) * Math.PI * 1.2 + Math.sin(time * 0.5) * 0.3 * idle + ptr.x * 0.4 * idle + shake * 6;
    shadow.material.opacity = 0.9 * (1 - tilt * 0.6);
    shadow.scale.setScalar(1 - tilt * 0.3);

    glass.visible = gIn > 0.01;
    glass.position.set(1.15, -1.37, 0.1); glass.scale.setScalar(Math.max(0.001, gIn));
    liquid.visible = fill > 0.01; liquid.scale.y = Math.max(0.001, fill * 0.8);
    foam.position.y = 0.1 + fill * 0.8; foam.visible = fill > 0.05;
    for (let i = 0; i < 3; i++) { dummy.position.set(Math.cos(i * 2.1) * 0.16, 0.1 + Math.max(0.1, fill * 0.8) - 0.06 + Math.sin(time + i) * 0.02, Math.sin(i * 2.1) * 0.16); dummy.rotation.set(i, time * 0.2 + i, 0); dummy.scale.setScalar(fill > 0.15 ? 1 : 0.001); dummy.updateMatrix(); gIce.setMatrixAt(i, dummy.matrix); }
    gIce.instanceMatrix.needsUpdate = true;
    stage.updateMatrixWorld(true);
    stream.visible = tilt > 0.92 && fill > 0.02 && fill < 0.98;
    if (stream.visible) {
      mouth.set(0.36, 1.39, 0); pivot.localToWorld(mouth);
      surf.set(0, 0.1 + fill * 0.8, 0); glass.localToWorld(surf);
      stream.position.copy(mouth); stream.scale.set(cur.sc, Math.max(0.01, mouth.y - surf.y), cur.sc);
      stream.rotation.z = Math.atan2(surf.x - mouth.x, mouth.y - surf.y);
    }

    /* 01 · sugar */
    const fly = sm(0.02, 0.4, T.sugar), diss = sm(0.5, 0.78, T.sugar);
    sugar.visible = fly > 0.01 && diss < 0.99;
    if (sugar.visible) sData.forEach((d, i) => { dummy.position.lerpVectors(d.far, d.ring, fly); dummy.position.y += Math.sin(time * d.sp + i) * 0.06; dummy.rotation.set(d.rot.x + time * d.sp * 0.5, d.rot.y + time * d.sp * 0.4, 0); dummy.scale.setScalar(1 - diss); dummy.updateMatrix(); sugar.setMatrixAt(i, dummy.matrix); });
    sugar.instanceMatrix.needsUpdate = true;
    sdMat.opacity = sm(0.48, 0.6, T.sugar) * (1 - sm(0.8, 0.95, T.sugar));
    sugarDust.visible = sdMat.opacity > 0.01;
    if (sugarDust.visible) for (let i = 0; i < NSD; i++) { const r = sData[Math.floor(i / 24)].ring, d = sdDir[i]; sdPos[i * 3] = r.x + d.x * diss; sdPos[i * 3 + 1] = r.y + d.y * diss + diss * 0.4; sdPos[i * 3 + 2] = r.z + d.z * diss; }
    sdGeo.attributes.position.needsUpdate = true;

    /* 02 · ice + condensation (the can stays cold until it is poured) */
    const iceIn = win(T.ice, 0.05, 0.3, 0.75, 0.95);
    ice.visible = iceIn > 0.01;
    if (ice.visible) iData.forEach((d, i) => { const a = d.a + time * 0.25 + T.ice * 2; dummy.position.set(Math.cos(a) * d.r * (1.6 - 0.6 * iceIn), d.y + Math.sin(time + i) * 0.08, Math.sin(a) * d.r * (1.6 - 0.6 * iceIn)); dummy.rotation.set(d.rot.x + time * 0.3, d.rot.y + time * 0.2, d.rot.z); dummy.scale.setScalar(d.s * iceIn); dummy.updateMatrix(); ice.setMatrixAt(i, dummy.matrix); });
    ice.instanceMatrix.needsUpdate = true;
    const wet = sm(0.25, 0.7, T.ice) * (1 - sm(0.9, 1.1, T.pour)) * (1 - ex);
    drops.visible = wet > 0.01;
    if (drops.visible) dData.forEach((d, i) => { const s = d.s * sm(d.d * 0.6, d.d * 0.6 + 0.4, wet); dummy.position.copy(d.p); dummy.position.y -= wet * d.d * 0.08; dummy.rotation.set(0, d.a, 0); dummy.scale.set(s, s * 1.25, s * 0.45); dummy.updateMatrix(); drops.setMatrixAt(i, dummy.matrix); });
    drops.instanceMatrix.needsUpdate = true;

    /* 03 · beans → powder */
    const bIn = sm(0.02, 0.35, T.beans), grind = sm(0.5, 0.75, T.beans);
    beans.visible = bIn > 0.01 && grind < 0.99;
    if (beans.visible) bData.forEach((d, i) => { const a = d.k * Math.PI * 5 + time * 0.35 + T.beans * 3; const r = 1.0 + 0.25 * Math.sin(d.k * 9); dummy.position.set(Math.cos(a) * r, -1.5 + d.k * 3.1 + (1 - bIn) * -2.5, Math.sin(a) * r); dummy.rotation.set(d.rot.x + time, d.rot.y + time * 0.6, d.rot.z); dummy.scale.setScalar(d.s * 1.25 * bIn * (1 - grind)); dummy.updateMatrix(); beans.setMatrixAt(i, dummy.matrix); });
    beans.instanceMatrix.needsUpdate = true;
    pwMat.opacity = sm(0.48, 0.62, T.beans) * (1 - sm(0.82, 0.97, T.beans));
    powder.visible = pwMat.opacity > 0.01;
    if (powder.visible) pwSeed.forEach((d, i) => { const a = d.k * Math.PI * 5 + time * 0.35 + T.beans * 3 + d.o * 0.05; const r = d.r + grind * 0.3; pwPos[i * 3] = Math.cos(a) * r; pwPos[i * 3 + 1] = -1.5 + d.k * 3.1 + Math.sin(time + d.o) * 0.05; pwPos[i * 3 + 2] = Math.sin(a) * r; });
    pwGeo.attributes.position.needsUpdate = true;

    /* 04 · evil eye */
    const eIn = win(T.eye, 0.08, 0.42, 0.8, 0.98);
    eye.visible = eIn > 0.01;
    if (eye.visible) { const m = isMobile() ? [0.95, 0.75, 0.7] : [0.95, 0.55, 0.9]; eye.position.set(m[0] * eIn, 0.25 + (m[1] - 0.25) * eIn, 0.5 + (m[2] - 0.5) * eIn); eye.scale.setScalar(0.12 + 0.78 * eIn); eye.rotation.set(Math.sin(time * 0.7) * 0.15, -0.35 + Math.sin(time * 0.5) * 0.35, Math.sin(time * 0.4) * 0.1); }

    renderer.render(scene, camera);

    /* callouts: project 3D anchor points to the screen */
    coEls.forEach((el, i) => {
      const c = CALLOUTS[i]; v.set(c.p[0] * (c.lift === 'label' ? 1 + ex * 0.22 : 1), c.p[1], c.p[2]);
      if (c.lift === 'lid') v.y += ex * 0.55; if (c.lift === 'bottom') v.y -= ex * 0.4;
      pivot.localToWorld(v); const [x, y] = toScreen(v);
      el.style.transform = `translate(${x}px, ${y}px)`; el.style.opacity = win(T.parts, 0.2, 0.36, 0.76, 0.9);
    });
    /* tap ring sits on the can in the hero and at the close */
    const tapOn = (T.hero < 0.62 || (T.closing > 0.12 && T.closing < 1.2)) && isReady;
    tapBtn.classList.toggle('on', tapOn);
    if (tapOn) { v.set(0, 0.1, 0); pivot.localToWorld(v); const [x, y] = toScreen(v); tapBtn.style.transform = `translate(${x}px, ${y}px)`; }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

/* ---------- films ---------- */
const acc = document.getElementById('acc');
let active = 0, previewTimer = 0, filmsInView = false;
const yt = (id, preview) => `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&playsinline=1&rel=0&modestbranding=1` + (preview ? `&mute=1&controls=0&loop=1&playlist=${id}&disablekb=1&iv_load_policy=3` : '');
function renderFilms() {
  acc.innerHTML = '';
  FILMS.forEach((f, i) => {
    const el = document.createElement('div');
    el.className = 'acc__item' + (i === active ? ' on' : '');
    el.innerHTML = `<div class="acc__media"><img src="${f.poster}" alt="" loading="lazy" /><span class="acc__sound">${EXTRA[lang].sound}</span></div>
      <div class="acc__cap"><span>${f.title[lang]}</span><span>${f.kind}</span><span>${f.line[lang]}</span></div>`;
    el.addEventListener('mouseenter', () => setActive(i));
    el.addEventListener('click', () => (i === active ? openFilm(i) : setActive(i)));
    acc.appendChild(el);
  });
  setActive(active, true);
}
function setActive(i, force) {
  if (i === active && !force) return;
  active = i;
  [...acc.children].forEach((el, k) => { el.classList.toggle('on', k === i); const fr = el.querySelector('iframe'); if (fr && k !== i) fr.remove(); });
  clearTimeout(previewTimer);
  previewTimer = setTimeout(() => {
    const el = acc.children[active]; if (!el || el.querySelector('iframe') || !filmsInView) return;
    const fr = document.createElement('iframe');
    fr.src = yt(FILMS[active].yt, true); fr.allow = 'autoplay; encrypted-media'; fr.tabIndex = -1; fr.title = FILMS[active].title.en;
    fr.addEventListener('load', () => setTimeout(() => fr.classList.add('on'), 1200));
    el.querySelector('.acc__media').insertBefore(fr, el.querySelector('.acc__sound'));
  }, 900);
}
new IntersectionObserver(([e]) => { filmsInView = e.isIntersecting; if (filmsInView) setActive(active, true); else acc.querySelectorAll('iframe').forEach((f) => f.remove()); }, { threshold: 0.3 }).observe(acc);
const lb = document.getElementById('lightbox'), lbFrame = document.getElementById('lbFrame');
function openFilm(i) {
  acc.querySelectorAll('iframe').forEach((f) => f.remove());
  lbFrame.innerHTML = `<iframe src="${yt(FILMS[i].yt, false)}" allow="autoplay; encrypted-media; fullscreen" allowfullscreen title="${FILMS[i].title[lang]}"></iframe>`;
  lb.hidden = false; lenis && lenis.stop();
}
function closeFilm() { lb.hidden = true; lbFrame.innerHTML = ''; lenis && lenis.start(); setActive(active, true); }
document.getElementById('lbClose').addEventListener('click', closeFilm);
lb.addEventListener('click', (e) => { if (e.target === lb) closeFilm(); });
addEventListener('keydown', (e) => { if (e.key === 'Escape' && !lb.hidden) closeFilm(); });

/* ---------- countdown + form ---------- */
const countEl = document.getElementById('count');
let cdTimer = 0;
function countdown() {
  clearTimeout(cdTimer);
  const ms = LAUNCH - Date.now();
  if (ms <= 0) { countEl.textContent = EXTRA[lang].live; return; }
  const d = Math.floor(ms / 864e5), h = Math.floor(ms % 864e5 / 36e5), m = Math.floor(ms % 36e5 / 6e4), s = Math.floor(ms % 6e4 / 1e3);
  countEl.textContent = `${d} ${EXTRA[lang].days} · ${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  cdTimer = setTimeout(countdown, 1000);
}
const form = document.getElementById('notifyForm'), msg = document.getElementById('notifyMsg');
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    const r = await fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(new FormData(form)).toString() });
    if (!r.ok) throw 0; msg.textContent = EXTRA[lang].ok; form.reset();
  } catch (err) { msg.textContent = EXTRA[lang].err; }
});

applyLang(lang);
onScroll();
