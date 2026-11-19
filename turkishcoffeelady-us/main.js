/* Bold Istanbul · Turkish Coffee Lady — concept site */

/* =====================================================
   FILMS — YouTube video IDs. The front screen plays a muted
   preview; clicking opens the film with sound.
   ===================================================== */
const FILMS = [
  { yt: 'X8lP0j7vcnA', poster: './assets/film-2.webp', title: { en: 'Turkish Coffee Tales of Anatolia', tr: 'Anadolu’nun Türk Kahvesi Hikâyeleri' }, tag: { en: 'Documentary · Teaser', tr: 'Belgesel · Fragman' } },
  { yt: 'zXI4Pu0NAJY', poster: './assets/film-1.webp', title: { en: 'A Cup of Courage', tr: 'Bir Fincan Cesaret' }, tag: { en: 'Feature · Seyir', tr: 'Röportaj · Seyir' } },
];

const LAUNCH = new Date('2026-12-05T00:00:00-05:00');

/* ---------------- i18n ---------------- */
const TR = {
  tagline: 'Good Coffee. Good Fortune.',
  'nav.can': 'Kutu', 'nav.films': 'Filmler', 'nav.ritual': 'Ritüel', 'nav.story': 'Hikâye', 'nav.notify': 'Haber ver',
  'hero.eyebrow': 'Buzlu Türk Kahvesi',
  'hero.lead': 'Beş asırlık Türk kahvesi, soğuk olarak. Koyu, yoğun ve yalnızca iyi malzemelerle.',
  'hero.cta': 'İlk sen dene', 'hero.film': 'Filmi izle', 'hero.date': 'ABD lansmanı',
  'b.sugar': 'Sıfır şeker', 'b.natural': '%100 doğal', 'b.cal': 'Düşük kalori', scroll: 'Kaydır',
  'specs.eyebrow': 'Kutunun içinde',
  'specs.title': 'Her yudumda <em>bir İstanbul yolculuğu.</em>',
  'specs.body': 'Özenle seçilmiş en iyi kahve çekirdeklerinden; İstanbul’un beş yüz yıldır yaptığı gibi un inceliğinde öğütülür, demlenir, soğutulur ve kutulanır. Şurup yok. Kestirme yok.',
  'specs.s1': 'Şeker. Bir gram bile yok.', 'specs.s2': 'Doğal içerik', 'specs.low': 'Düşük', 'specs.s3': 'Kalori, tüm yoğunluk', 'specs.s4': '250 ml, içime hazır',
  'specs.note': 'Her kutudaki nazar boncuğu: küçük bir iyi şans sözü.',
  'j.eyebrow': 'Boğaz’dan', 'j.title': 'Dünyaya kahve içmeyi <em>öğreten şehir.</em>',
  'j.t1': 'İlk kahvehaneler', 'j.p1': 'İstanbul dünyanın ilk kahvehanelerinden bazılarını açar. Kahve sohbete dönüşür.',
  'j.t2': 'İnsanlığın mirası', 'j.p2': 'UNESCO, Türk kahvesi kültürü ve geleneğini Somut Olmayan Kültürel Miras listesine alır.',
  'j.t3': 'Dünyada bir ilk: şişede soğuk', 'j.p3': 'Turkish Coffee Lady, dünyanın ilk şişelenmiş soğuk Türk kahvesi serisini yaratır (patent başvurusu sürüyor): aynı koyu, kadifemsi lezzet, Amerika’nın bugün kahve içtiği gibi.',
  'f.eyebrow': 'Filmler', 'f.title': 'Bold Istanbul’un <em>hayat bulduğu an.</em>', 'f.hint': 'Çevirmek için sürükle · sesli izlemek için ekrana dokun',
  'r.eyebrow': 'Ritüel', 'r.title': 'Çalkala. Soğuk iç. <em>Falına bak.</em>',
  'r.t1': 'Çalkala', 'r.p1': 'Türk kahvesi yoğundur. İyi bir çalkalama gövdeyi ve köpüğü uyandırır.',
  'r.t2': 'Soğut', 'r.p2': 'En iyisi buz gibi; kutudan ya da buzun üzerine.',
  'r.t3': 'Fal', 'r.p3': 'Türkiye’de fincan hep bir falla biter. İşte seninki.',
  'r.wait': 'Falın fincanın dibinde seni bekliyor.', 'r.btn': 'Falıma bak', 'r.again': 'Bir daha bak',
  's.eyebrow': 'Hikâyemiz', 's.title': '“Bir fincan kahvenin <em>kırk yıl hatırı vardır.</em>”',
  's.p1': 'Turkish Coffee Lady, 2007’den bu yana Türk kahvesinin zengin kültürünü dünyada yaşatmak ve yeni nesillere taşımak için çalışan global bir marka.',
  's.p2': 'Buzlu seri, 2025’te InvestBev hızlandırma programıyla bir araya gelen ekiple hayata geçti ve ABD’de sıfır şekerli Bold Istanbul ile raflara çıkıyor.',
  's.role': 'Kurucu · Turkish Coffee Lady',
  's.l1': 'Her şey Boston’da bir fincan kahveyle başladı', 's.l2': 'İlk Türk Kahvesi Kamyonu Amerika’yı dolaştı', 's.l3': 'Kadınları güçlendirmek için ABD’deki ilk Türk kahvesi dükkânı',
  's.l4': 'Dünyanın ilk kahve diplomasisi vakfı: Turkish Coffee Lady Foundation', 's.l5': 'Old Town Alexandria’da bir Türk kültür evi', 's.l6': 'Dünyanın ilk şişelenmiş soğuk Türk kahvesi serisi (patent başvurusu sürüyor)',
  's.l7': 'TOA Awards tarafından Amerika’nın En Etkili 100 Türk’ünden biri seçildi',
  'nav.book': 'Kitap', 'bk.eyebrow': 'Kitap · Gizem Şalcıgil White', 'bk.sub': 'Bir fincan cesaretle.',
  'bk.p1': 'Bir kadın göçmenin Amerika’daki girişimcilik hikâyesi. Gizem, 20 yılı aşkın süredir gastrodiplomasi çalışmaları ve bir kahve kamyonuyla Türk kahvesi kültürünü dünyaya anlatıyor.',
  'bk.p2': 'Hayalini Demle; bir anne girişimcinin önyargılarla mücadelesini, göçmenliğin gerçekleriyle yüzleşirken kanseri yenmesini ve ekonomik zorlukların üstesinden gelip sıfırdan bir marka kurmasını anlatıyor. Girişimci olmak isteyen tüm kadınlara: korkuyla yüzleş, hayalinden vazgeçme.',
  'bk.q': '“Bir fincan cesaretle başlayan yolculuk.”',
  'l.eyebrow': '5 Aralık · Dünya Türk Kahvesi Günü', 'l.title': 'ABD’ye iniyor',
  'l.d': 'Gün', 'l.h': 'Saat', 'l.m': 'Dakika', 'l.s': 'Saniye', 'l.btn': 'Bana haber ver', 'l.zip': 'Posta kodu',
  'l.ok': 'Teşekkürler! Bold Istanbul raflara çıktığında ilk sen duyacaksın.', 'l.err': 'Bir sorun oldu, lütfen tekrar dene.', 'l.live': 'Şimdi raflarda',
  footer: 'Turkish Coffee Lady için hazırlanmış konsept demodur.',
};
const EN_EXTRA = {
  'r.again': 'Read again', 'l.ok': 'Thank you! You’ll be the first to know when Bold Istanbul hits shelves.',
  'l.err': 'Something went wrong. Please try again.', 'l.live': 'Now on shelves', 'l.zip': 'ZIP',
};
const FORTUNES = {
  en: [
    'A long-awaited message arrives within three days. Answer it.',
    'A bird in your cup: good news is flying your way.',
    'A road opens ahead of you. Take it, and take a friend.',
    'Someone is thinking of you more than you think.',
    'A small risk this week turns into a big story.',
    'The cup shows a key. A door you thought was closed is not.',
    'Money comes from an unexpected direction. Spend some on coffee.',
    'Forty years of friendship begins with the next cup you share.',
  ],
  tr: [
    'Uzun zamandır beklediğin bir haber üç vakte kadar geliyor. Cevapsız bırakma.',
    'Fincanında bir kuş var: iyi haberler sana doğru uçuyor.',
    'Önünde bir yol açılıyor. Git, yanına da bir dost al.',
    'Biri seni sandığından çok daha fazla düşünüyor.',
    'Bu hafta göze aldığın küçük risk büyük bir hikâyeye dönüşecek.',
    'Fincanda bir anahtar var. Kapalı sandığın kapı aslında açık.',
    'Hiç beklemediğin yerden para var. Birazını kahveye harca.',
    'Kırk yıllık bir dostluk, paylaşacağın bir sonraki fincanla başlıyor.',
  ],
};

let lang = 'en';
try { lang = localStorage.getItem('tcl-lang') || (navigator.language || '').startsWith('tr') && 'tr' || 'en'; } catch (e) {}
const EN = {};
document.querySelectorAll('[data-i18n]').forEach((el) => { EN[el.dataset.i18n] = el.innerHTML; });
Object.assign(EN, EN_EXTRA);
const t = (k) => (lang === 'tr' ? TR[k] : EN[k]) ?? EN[k] ?? k;

function applyLang(l) {
  lang = l;
  document.documentElement.lang = l;
  document.querySelectorAll('[data-i18n]').forEach((el) => { const v = t(el.dataset.i18n); if (v) el.innerHTML = v; });
  document.querySelectorAll('[data-i18n-ph]').forEach((el) => { el.placeholder = t(el.dataset.i18nPh); });
  document.querySelectorAll('.lang button').forEach((b) => b.classList.toggle('is-active', b.dataset.lang === l));
  try { localStorage.setItem('tcl-lang', l); } catch (e) {}
  films && films.relabel();
}
document.querySelectorAll('.lang button').forEach((b) => b.addEventListener('click', () => applyLang(b.dataset.lang)));

/* ---------------- loader ---------------- */
const loader = { total: 3, done: 0, shown: 0 };
const bar = document.getElementById('loaderBar');
const count = document.getElementById('loaderCount');
const t0 = performance.now();
function tick() {
  loader.done++;
}
function loaderLoop() {
  const target = Math.min(100, (loader.done / loader.total) * 100);
  loader.shown += (target - loader.shown) * 0.12;
  bar.style.width = loader.shown + '%';
  count.textContent = String(Math.round(loader.shown)).padStart(3, '0');
  if (loader.done >= loader.total && loader.shown > 99 && performance.now() - t0 > 1200) return finishLoading();
  requestAnimationFrame(loaderLoop);
}
let loaded = false;
function finishLoading() {
  if (loaded) return; loaded = true;
  bar.style.width = '100%'; count.textContent = '100';
  document.body.classList.remove('is-loading');
  setTimeout(() => document.body.classList.add('ready'), 150);
}
requestAnimationFrame(loaderLoop);
setTimeout(finishLoading, 7000);
document.fonts && document.fonts.ready.then(tick);

/* ---------------- nav ---------------- */
const nav = document.getElementById('nav');
addEventListener('scroll', () => nav.classList.toggle('is-scrolled', scrollY > 40), { passive: true });
document.getElementById('burger').addEventListener('click', () => document.body.classList.toggle('menu-open'));
document.querySelectorAll('#navLinks a').forEach((a) => a.addEventListener('click', () => document.body.classList.remove('menu-open')));

/* ---------------- reveals ---------------- */
const io = new IntersectionObserver((es) => es.forEach((e) => {
  if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
}), { threshold: 0.15, rootMargin: '0px 0px -6% 0px' });
document.querySelectorAll('.reveal').forEach((el, i) => {
  const sib = [...el.parentElement.children].filter((c) => c.classList.contains('reveal'));
  el.style.transitionDelay = Math.min(sib.indexOf(el), 5) * 90 + 'ms';
  io.observe(el);
});

/* ---------------- parallax skyline ---------------- */
const sky = document.querySelector('.journey__sky');
const journey = document.getElementById('istanbul');
function parallax() {
  const r = journey.getBoundingClientRect();
  if (r.bottom > 0 && r.top < innerHeight) sky.style.transform = `translate3d(0, ${(r.top + r.height / 2 - innerHeight / 2) * -0.15}px, 0)`;
}
addEventListener('scroll', parallax, { passive: true });

/* ---------------- 3D can ---------------- */
let scene3d = null;
initThree().catch((err) => { console.warn(err); document.body.classList.add('no-webgl'); loader.done = loader.total; });

async function initThree() {
  const THREE = await import('three');
  const { RGBELoader } = await import('three/addons/loaders/RGBELoader.js');
  const canvas = document.getElementById('gl');
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' }); }
  catch (e) { throw new Error('WebGL unavailable'); }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  camera.position.set(0, 0, 9);

  // environment
  const pmrem = new THREE.PMREMGenerator(renderer);
  new RGBELoader().load('./assets/env.hdr', (hdr) => {
    scene.environment = pmrem.fromEquirectangular(hdr).texture;
    hdr.dispose(); tick();
  }, undefined, () => tick());

  // lights
  scene.add(new THREE.AmbientLight(0xfff1e0, 0.25));
  const key = new THREE.DirectionalLight(0xffe2bf, 2.2); key.position.set(-4, 3, 5); scene.add(key);
  const rimGold = new THREE.SpotLight(0xe6b874, 60, 20, 0.6, 0.8); rimGold.position.set(4, 2, -3); scene.add(rimGold);
  const rimBlue = new THREE.SpotLight(0x5a74ff, 45, 20, 0.6, 0.8); rimBlue.position.set(-4, -1, -3); scene.add(rimBlue);

  // can
  const can = new THREE.Group();
  const label = new THREE.TextureLoader().load('./assets/label.webp', () => tick(), undefined, () => tick());
  label.colorSpace = THREE.SRGBColorSpace;
  label.anisotropy = renderer.capabilities.getMaxAnisotropy();
  label.wrapS = THREE.RepeatWrapping;
  const R = 0.5, H = 2.44;
  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(R, R, H, 128, 1, true),
    new THREE.MeshPhysicalMaterial({ map: label, roughness: 0.34, metalness: 0.12, clearcoat: 1, clearcoatRoughness: 0.22, envMapIntensity: 0.9 })
  );
  can.add(body);
  const metal = new THREE.MeshStandardMaterial({ color: 0xdfe3e8, metalness: 1, roughness: 0.2, envMapIntensity: 1.25, side: THREE.DoubleSide });
  const top = new THREE.LatheGeometry([
    [0.5, 1.22], [0.497, 1.26], [0.483, 1.305], [0.455, 1.35], [0.44, 1.385], [0.452, 1.405], [0.447, 1.425], [0.43, 1.422], [0.418, 1.4], [0.41, 1.385], [0.3, 1.38], [0, 1.378],
  ].map(([x, y]) => new THREE.Vector2(x, y)), 128);
  can.add(new THREE.Mesh(top, metal));
  const bottom = new THREE.LatheGeometry([
    [0, -1.34], [0.28, -1.345], [0.37, -1.325], [0.44, -1.29], [0.485, -1.25], [0.5, -1.22],
  ].map(([x, y]) => new THREE.Vector2(x, y)), 128);
  can.add(new THREE.Mesh(bottom, metal));
  // pull tab
  const tabShape = new THREE.Shape();
  tabShape.absarc(0, 0, 0.11, Math.PI * 0.15, Math.PI * 1.85, false);
  tabShape.lineTo(0.16, -0.05); tabShape.lineTo(0.16, 0.05);
  const hole = new THREE.Path(); hole.absellipse(-0.01, 0, 0.055, 0.04, 0, Math.PI * 2); tabShape.holes.push(hole);
  const tab = new THREE.Mesh(new THREE.ExtrudeGeometry(tabShape, { depth: 0.012, bevelEnabled: true, bevelThickness: 0.006, bevelSize: 0.006, bevelSegments: 2 }), metal);
  tab.rotation.x = -Math.PI / 2; tab.position.set(-0.04, 1.392, 0.1); tab.rotation.z = -Math.PI / 2;
  can.add(tab);
  const rivet = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.02, 24), metal); rivet.position.set(0, 1.39, 0); can.add(rivet);

  // pedestal (launch)
  const ped = new THREE.Group();
  const marble = new THREE.MeshPhysicalMaterial({ color: 0xf1e9dc, roughness: 0.28, clearcoat: 0.6, envMapIntensity: 0.7 });
  const gold = new THREE.MeshStandardMaterial({ color: 0xd2ad6a, metalness: 1, roughness: 0.25 });
  const p1 = new THREE.Mesh(new THREE.CylinderGeometry(1.25, 1.32, 0.18, 96), marble); p1.position.y = -0.38;
  const p2 = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.95, 0.5, 96), marble); p2.position.y = -0.05;
  const g1 = new THREE.Mesh(new THREE.TorusGeometry(0.95, 0.018, 12, 128), gold); g1.rotation.x = Math.PI / 2; g1.position.y = 0.2;
  const g2 = new THREE.Mesh(new THREE.TorusGeometry(1.3, 0.014, 12, 128), gold); g2.rotation.x = Math.PI / 2; g2.position.y = -0.29;
  ped.add(p1, p2, g1, g2);
  ped.position.y = -1.34 - 0.2;
  const stage = new THREE.Group();
  stage.add(can, ped);
  scene.add(stage);

  // coffee beans
  const beanGeo = new THREE.SphereGeometry(0.1, 20, 14);
  const pos = beanGeo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    let x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    y *= 0.72; z *= 0.58;
    if (z > 0) z -= 0.03 * Math.exp(-((x / 0.016) ** 2));
    pos.setXYZ(i, x, y, z);
  }
  beanGeo.computeVertexNormals();
  const N_BEANS = innerWidth < 900 ? 18 : 34;
  const beans = new THREE.InstancedMesh(beanGeo, new THREE.MeshStandardMaterial({ color: 0x3a1f0f, roughness: 0.38, metalness: 0.05 }), N_BEANS);
  const bData = [];
  for (let i = 0; i < N_BEANS; i++) {
    let x, y;
    do { x = (Math.random() - 0.5) * 9; y = (Math.random() - 0.5) * 5.5; } while (Math.abs(x) < 1.1 && Math.abs(y) < 1.8);
    bData.push({ x, y, z: -3 + Math.random() * 4.2, s: 0.6 + Math.random() * 0.9, r: new THREE.Euler(Math.random() * 6, Math.random() * 6, Math.random() * 6), sp: 0.2 + Math.random() * 0.5, ph: Math.random() * 6 });
  }
  scene.add(beans);
  const dummy = new THREE.Object3D();

  // keyframes
  const mob = () => innerWidth < 900;
  const KF = () => mob() ? [
    { sel: '#hero', at: 0.5, s: { x: 0, y: 0.0, ry: 0, rz: 0, sc: 0.56, ped: 0, beans: 1, idle: 1, h: 0 } },
    { sel: '#can', at: 0.12, s: { x: 0, y: 0.42, ry: Math.PI, rz: -0.1, sc: 0.72, ped: 0, beans: 0.5, idle: 0 } },
    { sel: '#can', at: 0.9, s: { x: 0, y: 1.6, ry: Math.PI * 1.3, rz: -0.1, sc: 0.6, ped: 0, beans: 0.3, idle: 0 } },
    { sel: '#istanbul', at: 0.1, s: { x: 0, y: 0.42, ry: Math.PI * 2, rz: 0.1, sc: 0.72, ped: 0, beans: 0.4, idle: 0 } },
    { sel: '#films', at: 0, s: { x: 0, y: 2.6, ry: Math.PI * 2.5, rz: 0, sc: 0.7, ped: 0, beans: 0, idle: 0 } },
    { sel: '#films', at: 0.25, s: { x: 0, y: 2.6, ry: Math.PI * 2.5, rz: 0, sc: 0.7, ped: 0, beans: 0, idle: 0, h: 1 } },
    { sel: '#story', at: 1, s: { x: 0, y: -2.6, ry: Math.PI * 3, rz: 0, sc: 0.62, ped: 1, beans: 0, idle: 0, h: 1 } },
    { sel: '.launch__spacer', at: 0, s: { x: 0, y: -2.6, ry: Math.PI * 3, rz: 0, sc: 0.62, ped: 1, beans: 0, idle: 0 } },
    { sel: '.launch__spacer', at: 0.5, s: { x: 0, y: 0.1, ry: Math.PI * 4, rz: 0, sc: 0.6, ped: 1, beans: 0.6, idle: 1 } },
  ] : [
    { sel: '#hero', at: 0.5, s: { x: 0, y: -0.06, ry: 0, rz: 0, sc: 1, ped: 0, beans: 1, idle: 1 } },
    { sel: '#can', at: 0.5, s: { x: 0.4, y: 0, ry: Math.PI, rz: -0.1, sc: 1.08, ped: 0, beans: 0.6, idle: 0 } },
    { sel: '#istanbul', at: 0.5, s: { x: -0.4, y: 0, ry: Math.PI * 2, rz: 0.12, sc: 1.02, ped: 0, beans: 0.6, idle: 0.3 } },
    { sel: '#films', at: 0, s: { x: -0.2, y: 1.45, ry: Math.PI * 2.6, rz: 0.2, sc: 0.95, ped: 0, beans: 0, idle: 0 } },
    { sel: '#films', at: 0.25, s: { x: -0.2, y: 1.45, ry: Math.PI * 2.6, rz: 0.2, sc: 0.95, ped: 0, beans: 0, idle: 0, h: 1 } },
    { sel: '#story', at: 1, s: { x: 0, y: -1.5, ry: Math.PI * 3, rz: 0, sc: 0.72, ped: 1, beans: 0, idle: 0, h: 1 } },
    { sel: '.launch__spacer', at: 0, s: { x: 0, y: -1.5, ry: Math.PI * 3, rz: 0, sc: 0.72, ped: 1, beans: 0, idle: 0 } },
    { sel: '.launch__spacer', at: 0.5, s: { x: 0, y: 0.12, ry: Math.PI * 4, rz: 0, sc: 0.72, ped: 1, beans: 0.7, idle: 1 } },
  ];
  let frames = [];
  function measure() {
    frames = KF().map((k) => {
      const el = document.querySelector(k.sel);
      const r = el.getBoundingClientRect();
      return { y: r.top + scrollY + r.height * k.at, s: { h: 0, ...k.s } };
    }).sort((a, b) => a.y - b.y);
  }
  const ease = (x) => x * x * (3 - 2 * x);
  function targetAt(sy) {
    const p = sy + innerHeight / 2;
    if (p <= frames[0].y) return frames[0].s;
    for (let i = 0; i < frames.length - 1; i++) {
      const a = frames[i], b = frames[i + 1];
      if (p <= b.y) {
        const f = ease((p - a.y) / Math.max(1, b.y - a.y));
        const o = {}; for (const k in a.s) o[k] = a.s[k] + (b.s[k] - a.s[k]) * f; return o;
      }
    }
    return frames[frames.length - 1].s;
  }

  let halfW = 1, halfH = 1;
  function resize() {
    const w = innerWidth, h = innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
    halfH = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z;
    halfW = halfH * camera.aspect;
    measure();
  }
  addEventListener('resize', resize);
  new ResizeObserver(() => measure()).observe(document.body);
  resize();

  const cur = { ...targetAt(scrollY) };
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  addEventListener('pointermove', (e) => { pointer.tx = e.clientX / innerWidth - 0.5; pointer.ty = e.clientY / innerHeight - 0.5; }, { passive: true });
  let lastY = scrollY, vel = 0, spin = 0;
  const clock = new THREE.Clock();

  function frame() {
    const dt = Math.min(clock.getDelta(), 0.05), time = clock.elapsedTime;
    const tg = targetAt(scrollY);
    const k = 1 - Math.exp(-dt * 5.5);
    for (const key in tg) cur[key] += (tg[key] - cur[key]) * k;
    vel += ((scrollY - lastY) - vel) * 0.2; lastY = scrollY;
    spin += vel * 0.0012; spin *= 0.94;
    pointer.x += (pointer.tx - pointer.x) * 0.05; pointer.y += (pointer.ty - pointer.y) * 0.05;

    const visible = cur.h < 0.5 && (Math.abs(cur.y) < 1.4 || cur.ped > 0.5);
    if (visible) {
      stage.position.set(cur.x * halfW, cur.y * halfH + Math.sin(time * 1.1) * 0.05 * cur.idle, 0);
      stage.scale.setScalar(cur.sc);
      can.rotation.y = cur.ry + Math.sin(time * 0.45) * 0.38 * cur.idle + pointer.x * 0.5 + spin;
      stage.rotation.z = cur.rz + pointer.x * -0.04;
      stage.rotation.x = pointer.y * 0.12;
      ped.visible = cur.ped > 0.02;
      ped.scale.setScalar(Math.max(0.001, cur.ped));
      beans.visible = cur.beans > 0.02;
      for (let i = 0; i < N_BEANS; i++) {
        const b = bData[i];
        dummy.position.set(b.x + pointer.x * b.z * -0.2, b.y + Math.sin(time * b.sp + b.ph) * 0.15 + (scrollY * 0.0006 * (b.z + 3)), b.z);
        dummy.rotation.set(b.r.x + time * b.sp * 0.4, b.r.y + time * b.sp * 0.3, b.r.z);
        dummy.scale.setScalar(b.s * cur.beans);
        dummy.updateMatrix(); beans.setMatrixAt(i, dummy.matrix);
      }
      beans.instanceMatrix.needsUpdate = true;
      renderer.render(scene, camera);
      canvas.style.visibility = 'visible';
    } else {
      canvas.style.visibility = 'hidden';
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  scene3d = { measure };
}

/* ---------------- films: 3D ring ---------------- */
const ytSrc = (id, preview) => preview
  ? `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&mute=1&controls=0&loop=1&playlist=${id}&playsinline=1&rel=0&iv_load_policy=3&disablekb=1&modestbranding=1`
  : `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&playsinline=1&rel=0&modestbranding=1`;
const films = (() => {
  const ring = document.getElementById('ring');
  const stage = document.getElementById('stage3d');
  const nameEl = document.getElementById('filmName');
  const countEl = document.getElementById('filmCount');
  const NF = FILMS.length;
  // repeat the list so the ring always has screens on both sides
  const slots = []; while (slots.length < 4) FILMS.forEach((_, i) => slots.push(i));
  const N = slots.length;
  const STEP = 38;
  let pw = 0, ph = 0, radius = 0, cur = 0, target = 0, front = -1, moved = false;
  const mod = (a, n) => ((a % n) + n) % n;
  const panels = slots.map((fi, i) => {
    const f = FILMS[fi];
    const el = document.createElement('div');
    el.className = 'panel';
    el.innerHTML = `<img src="${f.poster}" alt="" loading="lazy" />
      <div class="panel__label"><span><small></small><b></b></span><i class="panel__play"></i></div>`;
    el.addEventListener('click', () => { if (moved) return; if (i === Math.round(mod(cur, N))) open(fi); else go(i); });
    ring.appendChild(el);
    return { el, fi, iframe: null };
  });

  function setPreview(p, on) {
    if (on && !p.iframe) {
      const fr = document.createElement('iframe');
      fr.allow = 'autoplay; encrypted-media; picture-in-picture';
      fr.title = FILMS[p.fi].title.en; fr.tabIndex = -1;
      fr.src = ytSrc(FILMS[p.fi].yt, true);
      fr.addEventListener('load', () => setTimeout(() => fr.classList.add('on'), 1400));
      p.el.insertBefore(fr, p.el.querySelector('.panel__label'));
      p.iframe = fr;
    } else if (!on && p.iframe) { p.iframe.remove(); p.iframe = null; }
  }

  function layout() {
    pw = Math.min(760, stage.clientWidth * (innerWidth < 900 ? 0.78 : 0.56));
    ph = pw * 9 / 16;
    radius = (pw / 2) / Math.tan((STEP * Math.PI / 180) / 2) * 1.12;
    panels.forEach((p) => { p.el.style.setProperty('--pw', pw + 'px'); p.el.style.setProperty('--ph', ph + 'px'); });
  }
  function relabel() {
    panels.forEach((p) => {
      p.el.querySelector('small').textContent = FILMS[p.fi].tag[lang];
      p.el.querySelector('b').textContent = FILMS[p.fi].title[lang];
    });
    update(true);
  }
  let previewTimer = 0;
  function update(force) {
    panels.forEach((p, i) => {
      let d = i - cur; d = d - Math.round(d / N) * N;
      const op = Math.max(0, 1 - Math.max(0, Math.abs(d) - 1.2) * 0.9);
      p.el.style.transform = `rotateY(${d * STEP}deg) translateZ(${radius}px)`;
      p.el.style.opacity = op;
      p.el.style.visibility = op <= 0.01 ? 'hidden' : 'visible';
    });
    ring.style.transform = `translateZ(${-radius}px)`;
    const f = Math.round(mod(cur, N));
    if (f !== front || force) {
      front = f;
      panels.forEach((p, i) => { p.el.classList.toggle('is-front', i === f); if (i !== f) setPreview(p, false); });
      clearTimeout(previewTimer);
      previewTimer = setTimeout(() => { if (inView && lb.hidden) setPreview(panels[front], true); }, 700);
      const fi = panels[f].fi;
      countEl.textContent = `${String(fi + 1).padStart(2, '0')} / ${String(NF).padStart(2, '0')}`;
      nameEl.textContent = FILMS[fi].title[lang];
    }
  }
  function go(i) { let d = i - mod(target, N); d = d - Math.round(d / N) * N; target += d; }
  document.getElementById('prevFilm').addEventListener('click', () => { target = Math.round(target) - 1; });
  document.getElementById('nextFilm').addEventListener('click', () => { target = Math.round(target) + 1; });

  let dragging = false, sx = 0, st = 0;
  stage.addEventListener('pointerdown', (e) => { dragging = true; moved = false; sx = e.clientX; st = target; });
  addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const dx = e.clientX - sx; if (Math.abs(dx) > 6) moved = true;
    target = st - dx / (pw * 0.9);
  });
  addEventListener('pointerup', () => { if (!dragging) return; dragging = false; target = Math.round(target); setTimeout(() => (moved = false), 0); });

  let inView = false;
  new IntersectionObserver(([e]) => {
    inView = e.isIntersecting;
    if (!inView) panels.forEach((p) => setPreview(p, false)); else update(true);
  }, { threshold: 0.25 }).observe(stage);
  (function loop() {
    if (inView) { const d = target - cur; if (Math.abs(d) > 0.0005) { cur += d * 0.1; update(); } }
    requestAnimationFrame(loop);
  })();
  addEventListener('resize', () => { layout(); update(true); });

  const lb = document.getElementById('lightbox');
  const frame = document.getElementById('lbFrame');
  function open(fi) {
    const f = FILMS[fi];
    frame.innerHTML = '';
    const fr = document.createElement('iframe');
    fr.src = ytSrc(f.yt, false); fr.title = f.title[lang];
    fr.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen'; fr.allowFullscreen = true;
    frame.appendChild(fr);
    panels.forEach((p) => setPreview(p, false));
    lb.hidden = false; document.body.style.overflow = 'hidden';
  }
  function close() { lb.hidden = true; frame.innerHTML = ''; document.body.style.overflow = ''; update(true); }
  document.getElementById('lbClose').addEventListener('click', close);
  lb.addEventListener('click', (e) => { if (e.target === lb) close(); });
  addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !lb.hidden) close();
    if (lb.hidden && inView && e.key === 'ArrowRight') target = Math.round(target) + 1;
    if (lb.hidden && inView && e.key === 'ArrowLeft') target = Math.round(target) - 1;
  });
  document.querySelectorAll('[data-open-film]').forEach((a) => a.addEventListener('click', (e) => { e.preventDefault(); open(+a.dataset.openFilm); }));
  layout(); relabel();
  return { relabel };
})();

/* ---------------- fortune ---------------- */
const fortuneBox = document.getElementById('fortune');
const fortuneText = document.getElementById('fortuneText');
const fortuneBtn = document.getElementById('fortuneBtn');
let lastFortune = -1;
fortuneBtn.addEventListener('click', () => {
  fortuneBox.classList.add('is-spinning');
  fortuneText.style.opacity = 0;
  setTimeout(() => {
    let i; do { i = Math.floor(Math.random() * FORTUNES.en.length); } while (i === lastFortune);
    lastFortune = i;
    fortuneText.removeAttribute('data-i18n');
    fortuneText.textContent = FORTUNES[lang][i];
    fortuneText.style.opacity = 1;
    fortuneBtn.textContent = t('r.again');
    fortuneBtn.dataset.i18n = 'r.again';
    fortuneBox.classList.remove('is-spinning');
  }, 900);
});

/* ---------------- countdown ---------------- */
const cd = ['cdD', 'cdH', 'cdM', 'cdS'].map((id) => document.getElementById(id));
function countdown() {
  let s = Math.max(0, Math.floor((LAUNCH - Date.now()) / 1000));
  if (s === 0) { document.getElementById('countdown').innerHTML = `<div><b>${t('l.live')}</b></div>`; return; }
  const v = [Math.floor(s / 86400), Math.floor(s % 86400 / 3600), Math.floor(s % 3600 / 60), s % 60];
  v.forEach((n, i) => (cd[i].textContent = String(n).padStart(2, '0')));
  setTimeout(countdown, 1000);
}
countdown();

/* ---------------- notify form (Netlify Forms) ---------------- */
const form = document.getElementById('notifyForm');
const msg = document.getElementById('notifyMsg');
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = form.querySelector('button'); btn.disabled = true;
  try {
    const res = await fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(new FormData(form)).toString() });
    if (!res.ok) throw new Error(res.status);
    msg.textContent = t('l.ok'); form.reset();
  } catch (err) { msg.textContent = t('l.err'); }
  btn.disabled = false;
});

applyLang(lang);
