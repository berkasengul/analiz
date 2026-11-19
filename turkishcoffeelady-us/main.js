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
const isMobile = () => innerWidth < 900;

/* ---------------- i18n ---------------- */
const TR = {
  'nav.can': 'Kutu', 'nav.films': 'Filmler', 'nav.ritual': 'Ritüel', 'nav.story': 'Hikâye', 'nav.book': 'Kitap', 'nav.notify': 'Haber ver',
  'hero.eyebrow': 'Buzlu Türk Kahvesi · İstanbul · 250 ml',
  'hero.sub': 'Koyu ve yoğun. %100 doğal, sıfır şeker, düşük kalori.',
  'hero.cta': 'İlk sen dene', 'hero.film': 'Filmi izle', 'hero.date': 'ABD lansmanı · Dünya Türk Kahvesi Günü',
  'hero.profile': 'Tat profili', 'p.1': 'Koyu &amp; yoğun', 'p.2': '%100 doğal', 'p.3': 'Sıfır şeker', 'p.4': 'Düşük kalori', scroll: 'Kaydır',
  'specs.eyebrow': 'Kutunun içinde',
  'specs.title': 'Her yudumda <em>bir İstanbul yolculuğu.</em>',
  'specs.body': 'Özenle seçilmiş en iyi kahve çekirdeklerinden; İstanbul’un beş yüz yıldır yaptığı gibi un inceliğinde öğütülür, demlenir, soğutulur ve kutulanır. Şurup yok. Kestirme yok.',
  'specs.s1': 'Şeker. Bir gram bile yok.', 'specs.s2': 'Doğal içerik', 'specs.low': 'Düşük', 'specs.s3': 'Kalori, tüm yoğunluk', 'specs.s4': '250 ml, içime hazır',
  'specs.note': 'Her kutudaki nazar boncuğu: küçük bir iyi şans sözü.',
  'j.eyebrow': 'Boğaz’dan', 'j.title': 'Dünyaya kahve içmeyi <em>öğreten şehir.</em>',
  'j.t1': 'İlk kahvehaneler', 'j.p1': 'İstanbul dünyanın ilk kahvehanelerinden bazılarını açar. Kahve sohbete dönüşür.',
  'j.t2': 'İnsanlığın mirası', 'j.p2': 'UNESCO, Türk kahvesi kültürü ve geleneğini Somut Olmayan Kültürel Miras listesine alır.',
  'j.t3': 'Dünyada bir ilk: şişede soğuk', 'j.p3': 'Turkish Coffee Lady, dünyanın ilk şişelenmiş soğuk Türk kahvesi serisini yaratır (patent başvurusu sürüyor): aynı koyu, kadifemsi lezzet, Amerika’nın bugün kahve içtiği gibi.',
  'f.eyebrow': 'Filmler', 'f.title': 'Hikâyenin <em>hayat bulduğu an.</em>', 'f.hint': 'Çevirmek için sürükle · sesli izlemek için ekrana dokun',
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
  'bk.eyebrow': 'Kitap · Gizem Şalcıgil White', 'bk.title': 'Hayalini Demle <em>Bir fincan cesaretle.</em>',
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
try { lang = localStorage.getItem('tcl-lang') || ((navigator.language || '').startsWith('tr') ? 'tr' : 'en'); } catch (e) {}
const EN = {};
document.querySelectorAll('[data-i18n]').forEach((el) => { EN[el.dataset.i18n] = el.innerHTML; });
Object.assign(EN, EN_EXTRA);
const t = (k) => (lang === 'tr' ? TR[k] : EN[k]) ?? EN[k] ?? k;

/* split headings into masked words (keeps <em>) */
function split(el) {
  let i = 0;
  const walk = (node) => {
    [...node.childNodes].forEach((n) => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
          const w = document.createElement('span'); w.className = 'w';
          const s = document.createElement('span'); s.textContent = part; s.style.setProperty('--i', i++);
          w.appendChild(s); frag.appendChild(w);
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1 && !n.classList.contains('w')) walk(n);
    });
  };
  walk(el);
}

function applyLang(l) {
  lang = l;
  document.documentElement.lang = l;
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const v = t(el.dataset.i18n); if (!v) return;
    el.innerHTML = v;
    if (el.classList.contains('split')) split(el);
  });
  document.querySelectorAll('[data-i18n-ph]').forEach((el) => { el.placeholder = t(el.dataset.i18nPh); });
  document.querySelectorAll('.lang button').forEach((b) => b.classList.toggle('is-active', b.dataset.lang === l));
  try { localStorage.setItem('tcl-lang', l); } catch (e) {}
  films && films.relabel();
}
document.querySelectorAll('.split:not([data-i18n])').forEach(split);
document.querySelectorAll('.lang button').forEach((b) => b.addEventListener('click', () => applyLang(b.dataset.lang)));

/* ---------------- loader ---------------- */
const loader = { total: 3, done: 0, shown: 0 };
const ring = document.getElementById('loaderRing');
const count = document.getElementById('loaderCount');
const t0 = performance.now();
const tick = () => { loader.done++; };
let loaded = false;
const introStart = { t: 0 };
function loaderLoop() {
  if (loaded) return;
  const target = Math.min(100, (loader.done / loader.total) * 100);
  loader.shown += (target - loader.shown) * 0.1;
  ring.style.strokeDashoffset = 1 - loader.shown / 100;
  count.textContent = String(Math.round(loader.shown)).padStart(3, '0');
  if (loader.done >= loader.total && loader.shown > 99 && performance.now() - t0 > 1400) return finishLoading();
  requestAnimationFrame(loaderLoop);
}
function finishLoading() {
  if (loaded) return; loaded = true;
  ring.style.strokeDashoffset = 0; count.textContent = '100';
  document.body.classList.remove('is-loading');
  setTimeout(() => { document.body.classList.add('ready'); introStart.t = performance.now(); }, 250);
}
requestAnimationFrame(loaderLoop);
setTimeout(finishLoading, 8000);
document.fonts && document.fonts.ready.then(tick);

/* ---------------- smooth scroll ---------------- */
let lenis = null;
function initLenis() {
  if (!window.Lenis || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  lenis = new window.Lenis({ lerp: 0.09, smoothWheel: true });
  const raf = (time) => { lenis.raf(time); requestAnimationFrame(raf); };
  requestAnimationFrame(raf);
}
if (document.readyState === 'complete') initLenis(); else addEventListener('load', initLenis);
document.querySelectorAll('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
  if (a.dataset.openFilm != null) return;
  const target = document.querySelector(a.getAttribute('href'));
  if (!target) return;
  e.preventDefault();
  document.body.classList.remove('menu-open');
  if (lenis) lenis.scrollTo(target, { duration: 1.8 });
  else target.scrollIntoView({ behavior: 'smooth' });
}));

/* ---------------- nav, progress ---------------- */
const nav = document.getElementById('nav');
const progress = document.getElementById('progress');
const navLinks = [...document.querySelectorAll('#navLinks a')];
function onScroll() {
  nav.classList.toggle('is-scrolled', scrollY > 40);
  const max = document.documentElement.scrollHeight - innerHeight;
  progress.style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`;
  const mid = scrollY + innerHeight * 0.4;
  navLinks.forEach((a) => {
    const s = document.querySelector(a.getAttribute('href'));
    a.classList.toggle('is-active', !!s && s.offsetTop <= mid && s.offsetTop + s.offsetHeight > mid);
  });
  drawLine();
}
addEventListener('scroll', onScroll, { passive: true });
document.getElementById('burger').addEventListener('click', () => document.body.classList.toggle('menu-open'));

/* ---------------- reveals, counters ---------------- */
const io = new IntersectionObserver((es) => es.forEach((e) => {
  if (!e.isIntersecting) return;
  e.target.classList.add('in'); io.unobserve(e.target);
  e.target.querySelectorAll('[data-count]').forEach(countUp);
}), { threshold: 0.15, rootMargin: '0px 0px -6% 0px' });
document.querySelectorAll('.reveal, .split, .clip').forEach((el) => {
  if (el.classList.contains('reveal')) {
    const sib = [...el.parentElement.children].filter((c) => c.classList.contains('reveal'));
    el.style.transitionDelay = Math.min(sib.indexOf(el), 6) * 90 + 'ms';
  }
  io.observe(el);
});
function countUp(el) {
  const to = parseFloat(el.dataset.count), dec = String(el.dataset.count).includes('.') ? 1 : 0, start = performance.now();
  const step = (now) => {
    const p = Math.min(1, (now - start) / 1600), e = 1 - Math.pow(1 - p, 4);
    el.textContent = (to * e).toFixed(dec);
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

/* ---------------- magnetic buttons ---------------- */
if (matchMedia('(pointer: fine)').matches) {
  document.querySelectorAll('.magnetic').forEach((b) => {
    b.addEventListener('pointermove', (e) => {
      const r = b.getBoundingClientRect();
      b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.22}px, ${(e.clientY - r.top - r.height / 2) * 0.3}px)`;
    });
    b.addEventListener('pointerleave', () => { b.style.transform = ''; });
  });
}

/* ---------------- night skyline ---------------- */
const skySvg = document.getElementById('skySvg');
const layers = skySvg ? { stars: skySvg.querySelector('.stars'), far: skySvg.querySelector('.l-far'), mid: skySvg.querySelector('.l-mid'), near: skySvg.querySelector('.l-near') } : null;
function frameSky() {
  if (!skySvg) return;
  // on phones, frame Galata tower and the crescent instead of the centre
  skySvg.setAttribute('viewBox', isMobile() ? '1180 0 1100 1100' : '0 0 2400 1100');
}
frameSky(); addEventListener('resize', frameSky);
if (skySvg && matchMedia('(pointer: fine)').matches) {
  addEventListener('pointermove', (e) => {
    if (scrollY > innerHeight) return;
    const x = e.clientX / innerWidth - 0.5, y = e.clientY / innerHeight - 0.5;
    layers.stars.style.transform = `translate(${x * -8}px, ${y * -6}px)`;
    layers.far.style.transform = `translate(${x * -14}px, ${y * -4}px)`;
    layers.mid.style.transform = `translate(${x * -26}px, ${y * -6}px)`;
    layers.near.style.transform = `translate(${x * -44}px, ${y * -8}px)`;
  }, { passive: true });
}
// the launch section reuses the same night sky
const launchBg = document.getElementById('launchBg');
if (skySvg && launchBg) { const c = skySvg.cloneNode(true); c.removeAttribute('id'); c.setAttribute('viewBox', '0 0 2400 1100'); launchBg.appendChild(c); }

/* gold line-art skyline draws itself as you scroll */
const lineSky = document.getElementById('lineSky');
function drawLine() {
  if (!lineSky) return;
  const r = lineSky.getBoundingClientRect();
  const p = Math.min(1, Math.max(0, (innerHeight - r.top) / (innerHeight * 0.9)));
  lineSky.style.setProperty('--draw', String(1 - p));
}

/* ---------------- 3D can ---------------- */
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

  const pmrem = new THREE.PMREMGenerator(renderer);
  new RGBELoader().load('./assets/env.hdr', (hdr) => {
    scene.environment = pmrem.fromEquirectangular(hdr).texture;
    hdr.dispose(); tick();
  }, undefined, () => tick());

  // moonlit lighting: warm key, gold rim, blue rim
  scene.add(new THREE.HemisphereLight(0xcfd8ff, 0x1a1430, 0.35));
  const key = new THREE.DirectionalLight(0xfff0dc, 2.1); key.position.set(-3.5, 3, 5); scene.add(key);
  const rimGold = new THREE.SpotLight(0xf0c27a, 70, 20, 0.6, 0.8); rimGold.position.set(4, 2.5, -3); scene.add(rimGold);
  const rimBlue = new THREE.SpotLight(0x6f86ff, 60, 20, 0.6, 0.8); rimBlue.position.set(-4, -0.5, -3); scene.add(rimBlue);

  /* can */
  const can = new THREE.Group();
  const label = new THREE.TextureLoader().load('./assets/label.webp', () => tick(), undefined, () => tick());
  label.colorSpace = THREE.SRGBColorSpace;
  label.anisotropy = renderer.capabilities.getMaxAnisotropy();
  label.wrapS = THREE.RepeatWrapping;
  can.add(new THREE.Mesh(
    new THREE.CylinderGeometry(0.5, 0.5, 2.44, 128, 1, true),
    new THREE.MeshPhysicalMaterial({ map: label, roughness: 0.34, metalness: 0.12, clearcoat: 1, clearcoatRoughness: 0.22, envMapIntensity: 0.9 })
  ));
  const metal = new THREE.MeshStandardMaterial({ color: 0xdfe3e8, metalness: 1, roughness: 0.2, envMapIntensity: 1.25, side: THREE.DoubleSide });
  const lathe = (pts) => new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), 128);
  can.add(new THREE.Mesh(lathe([[0.5, 1.22], [0.497, 1.26], [0.483, 1.305], [0.455, 1.35], [0.44, 1.385], [0.452, 1.405], [0.447, 1.425], [0.43, 1.422], [0.418, 1.4], [0.41, 1.385], [0.3, 1.38], [0, 1.378]]), metal));
  can.add(new THREE.Mesh(lathe([[0, -1.34], [0.28, -1.345], [0.37, -1.325], [0.44, -1.29], [0.485, -1.25], [0.5, -1.22]]), metal));
  const tabShape = new THREE.Shape();
  tabShape.absarc(0, 0, 0.11, Math.PI * 0.15, Math.PI * 1.85, false);
  tabShape.lineTo(0.16, -0.05); tabShape.lineTo(0.16, 0.05);
  const hole = new THREE.Path(); hole.absellipse(-0.01, 0, 0.055, 0.04, 0, Math.PI * 2); tabShape.holes.push(hole);
  const tab = new THREE.Mesh(new THREE.ExtrudeGeometry(tabShape, { depth: 0.012, bevelEnabled: true, bevelThickness: 0.006, bevelSize: 0.006, bevelSegments: 2 }), metal);
  tab.rotation.x = -Math.PI / 2; tab.rotation.z = -Math.PI / 2; tab.position.set(-0.04, 1.392, 0.1);
  can.add(tab);
  const rivet = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.02, 24), metal); rivet.position.set(0, 1.39, 0); can.add(rivet);

  /* pedestal: fluted marble column, navy inlay, gold rims */
  const marbleTex = (() => {
    const c = document.createElement('canvas'); c.width = 1024; c.height = 512;
    const g = c.getContext('2d');
    g.fillStyle = '#f1ebe0'; g.fillRect(0, 0, 1024, 512);
    for (let i = 0; i < 26; i++) {
      g.strokeStyle = `rgba(${120 + Math.random() * 40},${118 + Math.random() * 30},${130 + Math.random() * 30},${0.06 + Math.random() * 0.12})`;
      g.lineWidth = 0.6 + Math.random() * 2.2;
      g.beginPath(); let x = Math.random() * 1024, y = Math.random() * 512; g.moveTo(x, y);
      for (let k = 0; k < 7; k++) { x += (Math.random() - 0.3) * 160; y += (Math.random() - 0.5) * 120; g.quadraticCurveTo(x - 40, y + 30, x, y); }
      g.stroke();
    }
    const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace; tx.wrapS = tx.wrapT = THREE.RepeatWrapping; return tx;
  })();
  const marble = new THREE.MeshPhysicalMaterial({ color: 0xffffff, map: marbleTex, roughness: 0.3, clearcoat: 0.7, clearcoatRoughness: 0.2, envMapIntensity: 0.6 });
  const gold = new THREE.MeshStandardMaterial({ color: 0xd8b26a, metalness: 1, roughness: 0.22 });
  const navyMat = new THREE.MeshPhysicalMaterial({ color: 0x1f2c75, roughness: 0.25, clearcoat: 1 });
  const ped = new THREE.Group();
  const top = -1.34;
  const slab = new THREE.Mesh(new THREE.CylinderGeometry(0.74, 0.74, 0.08, 128), marble); slab.position.y = top - 0.04;
  const inlay = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.012, 12, 160), navyMat); inlay.rotation.x = Math.PI / 2; inlay.position.y = top + 0.002;
  const rimTop = new THREE.Mesh(new THREE.TorusGeometry(0.74, 0.014, 12, 160), gold); rimTop.rotation.x = Math.PI / 2; rimTop.position.y = top - 0.002;
  const CR = 0.62, CH = 0.78;
  const flutedGeo = new THREE.CylinderGeometry(CR, CR, CH, 192, 1, false);
  { const p = flutedGeo.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), z = p.getZ(i), r = Math.hypot(x, z); if (r < CR * 0.6) continue;
      const a = Math.atan2(z, x), k = CR - 0.025 * Math.pow(Math.abs(Math.cos(a * 14)), 0.6);
      p.setXYZ(i, Math.cos(a) * k, p.getY(i), Math.sin(a) * k);
    }
    flutedGeo.computeVertexNormals(); }
  const column = new THREE.Mesh(flutedGeo, marble); column.position.y = top - 0.08 - CH / 2;
  const capital = new THREE.Mesh(new THREE.CylinderGeometry(0.68, 0.64, 0.06, 128), marble); capital.position.y = top - 0.08 - 0.03;
  const ringMid = new THREE.Mesh(new THREE.TorusGeometry(CR + 0.01, 0.011, 10, 160), gold); ringMid.rotation.x = Math.PI / 2; ringMid.position.y = top - 0.08 - CH;
  const plinth = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.96, 0.14, 128), marble); plinth.position.y = top - 0.08 - CH - 0.07;
  const rimBot = new THREE.Mesh(new THREE.TorusGeometry(0.9, 0.012, 10, 160), gold); rimBot.rotation.x = Math.PI / 2; rimBot.position.y = top - 0.08 - CH;
  ped.add(slab, inlay, rimTop, column, capital, ringMid, plinth, rimBot);

  const stage = new THREE.Group();
  stage.add(can, ped);
  scene.add(stage);

  /* light dust motes */
  const dustTex = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const g = c.getContext('2d'); const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, 'rgba(255,240,210,1)'); gr.addColorStop(0.3, 'rgba(255,230,190,.5)'); gr.addColorStop(1, 'rgba(255,230,190,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c);
  })();
  const ND = isMobile() ? 90 : 180;
  const dGeo = new THREE.BufferGeometry();
  const dPos = new Float32Array(ND * 3), dSeed = [];
  for (let i = 0; i < ND; i++) { dPos[i * 3] = (Math.random() - 0.5) * 10; dPos[i * 3 + 1] = (Math.random() - 0.5) * 6; dPos[i * 3 + 2] = -3 + Math.random() * 5; dSeed.push(Math.random() * 10); }
  dGeo.setAttribute('position', new THREE.BufferAttribute(dPos, 3));
  const dMat = new THREE.PointsMaterial({ map: dustTex, size: 0.07, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 });
  const dust = new THREE.Points(dGeo, dMat); scene.add(dust);

  /* a few coffee beans for the specs/journey scenes */
  const beanGeo = new THREE.SphereGeometry(0.1, 20, 14);
  { const p = beanGeo.attributes.position;
    for (let i = 0; i < p.count; i++) { const x = p.getX(i); const y = p.getY(i) * 0.72; let z = p.getZ(i) * 0.58; if (z > 0) z -= 0.03 * Math.exp(-((x / 0.016) ** 2)); p.setXYZ(i, x, y, z); }
    beanGeo.computeVertexNormals(); }
  const NB = isMobile() ? 10 : 18;
  const beans = new THREE.InstancedMesh(beanGeo, new THREE.MeshStandardMaterial({ color: 0x3a1f0f, roughness: 0.38 }), NB);
  const bData = [];
  for (let i = 0; i < NB; i++) {
    let x, y; do { x = (Math.random() - 0.5) * 9; y = (Math.random() - 0.5) * 5.5; } while (Math.abs(x) < 1.3 && Math.abs(y) < 1.9);
    bData.push({ x, y, z: -3 + Math.random() * 4, s: 0.6 + Math.random() * 0.8, r: new THREE.Euler(Math.random() * 6, Math.random() * 6, Math.random() * 6), sp: 0.2 + Math.random() * 0.5, ph: Math.random() * 6 });
  }
  scene.add(beans);
  const dummy = new THREE.Object3D();

  /* scroll choreography: a state per anchor, interpolated between anchors */
  const KF = () => isMobile() ? [
    { sel: '#hero', at: 0.5, s: { x: 0, y: -0.02, ry: 0, rz: 0, sc: 0.56, ped: 1, beans: 0, dust: 1, idle: 1 } },
    { sel: '#can', at: 0.12, s: { x: 0, y: 0.42, ry: Math.PI, rz: -0.1, sc: 0.72, ped: 0, beans: 0.5, dust: 0.3, idle: 0 } },
    { sel: '#can', at: 0.9, s: { x: 0, y: 1.6, ry: Math.PI * 1.3, rz: -0.1, sc: 0.6, ped: 0, beans: 0.3, dust: 0.2, idle: 0 } },
    { sel: '#istanbul', at: 0.1, s: { x: 0, y: 0.42, ry: Math.PI * 2, rz: 0.1, sc: 0.72, ped: 0, beans: 0.4, dust: 0.3, idle: 0 } },
    { sel: '#films', at: 0, s: { x: 0, y: 2.6, ry: Math.PI * 2.5, rz: 0, sc: 0.7, ped: 0, beans: 0, dust: 0, idle: 0 } },
    { sel: '#films', at: 0.25, s: { x: 0, y: 2.6, ry: Math.PI * 2.5, rz: 0, sc: 0.7, ped: 0, beans: 0, dust: 0, idle: 0, h: 1 } },
    { sel: '#book', at: 1, s: { x: 0, y: -2.6, ry: Math.PI * 3, rz: 0, sc: 0.56, ped: 1, beans: 0, dust: 0, idle: 0, h: 1 } },
    { sel: '.launch__spacer', at: 0, s: { x: 0, y: -2.6, ry: Math.PI * 3, rz: 0, sc: 0.56, ped: 1, beans: 0, dust: 0, idle: 0 } },
    { sel: '.launch__spacer', at: 0.5, s: { x: 0, y: 0.12, ry: Math.PI * 4, rz: 0, sc: 0.56, ped: 1, beans: 0, dust: 1, idle: 1 } },
  ] : [
    { sel: '#hero', at: 0.5, s: { x: 0, y: 0.07, ry: 0, rz: 0, sc: 0.8, ped: 1, beans: 0, dust: 1, idle: 1 } },
    { sel: '#can', at: 0.5, s: { x: 0.4, y: 0, ry: Math.PI, rz: -0.1, sc: 1.08, ped: 0, beans: 0.7, dust: 0.4, idle: 0 } },
    { sel: '#istanbul', at: 0.45, s: { x: -0.42, y: 0.08, ry: Math.PI * 2, rz: 0.12, sc: 1.0, ped: 0, beans: 0.6, dust: 0.4, idle: 0.3 } },
    { sel: '#films', at: 0, s: { x: -0.2, y: 1.45, ry: Math.PI * 2.6, rz: 0.2, sc: 0.95, ped: 0, beans: 0, dust: 0, idle: 0 } },
    { sel: '#films', at: 0.25, s: { x: -0.2, y: 1.45, ry: Math.PI * 2.6, rz: 0.2, sc: 0.95, ped: 0, beans: 0, dust: 0, idle: 0, h: 1 } },
    { sel: '#book', at: 1, s: { x: 0, y: -1.6, ry: Math.PI * 3, rz: 0, sc: 0.72, ped: 1, beans: 0, dust: 0, idle: 0, h: 1 } },
    { sel: '.launch__spacer', at: 0, s: { x: 0, y: -1.6, ry: Math.PI * 3, rz: 0, sc: 0.72, ped: 1, beans: 0, dust: 0, idle: 0 } },
    { sel: '.launch__spacer', at: 0.5, s: { x: 0, y: 0.14, ry: Math.PI * 4, rz: 0, sc: 0.72, ped: 1, beans: 0, dust: 1, idle: 1 } },
  ];
  let frames = [];
  function measure() {
    frames = KF().map((k) => {
      const r = document.querySelector(k.sel).getBoundingClientRect();
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
    renderer.setSize(innerWidth, innerHeight, false);
    camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
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
    const k = 1 - Math.exp(-dt * 5);
    for (const key in tg) cur[key] += (tg[key] - cur[key]) * k;
    vel += ((scrollY - lastY) - vel) * 0.2; lastY = scrollY;
    spin += vel * 0.0012; spin *= 0.94;
    pointer.x += (pointer.tx - pointer.x) * 0.05; pointer.y += (pointer.ty - pointer.y) * 0.05;

    // intro: the can descends onto the pedestal with a turn
    const it = introStart.t ? Math.min(1, (performance.now() - introStart.t - 600) / 2200) : 0;
    const ie = it <= 0 ? 0 : 1 - Math.pow(1 - it, 3);
    const visible = cur.h < 0.5 && (Math.abs(cur.y) < 1.45 || cur.ped > 0.5);
    if (visible) {
      stage.position.set(cur.x * halfW, cur.y * halfH + Math.sin(time * 1.1) * 0.03 * cur.idle, 0);
      stage.scale.setScalar(cur.sc);
      can.position.y = (1 - ie) * 2.4 + Math.sin(time * 1.3) * 0.035 * cur.idle;
      can.rotation.y = cur.ry - (1 - ie) * Math.PI * 1.5 + Math.sin(time * 0.45) * 0.32 * cur.idle + pointer.x * 0.45 + spin;
      stage.rotation.z = cur.rz + pointer.x * -0.03;
      stage.rotation.x = pointer.y * 0.08;
      const ps = Math.max(0.001, cur.ped);
      ped.visible = cur.ped > 0.02;
      ped.scale.set(ps, ps, ps);
      ped.position.y = -(1 - ie) * 0.3;
      ped.rotation.y = time * 0.05;
      beans.visible = cur.beans > 0.02;
      if (beans.visible) {
        for (let i = 0; i < NB; i++) {
          const b = bData[i];
          dummy.position.set(b.x + pointer.x * b.z * -0.2, b.y + Math.sin(time * b.sp + b.ph) * 0.15, b.z);
          dummy.rotation.set(b.r.x + time * b.sp * 0.4, b.r.y + time * b.sp * 0.3, b.r.z);
          dummy.scale.setScalar(b.s * cur.beans);
          dummy.updateMatrix(); beans.setMatrixAt(i, dummy.matrix);
        }
        beans.instanceMatrix.needsUpdate = true;
      }
      dMat.opacity = 0.75 * cur.dust * ie;
      for (let i = 0; i < ND; i++) {
        const s = dSeed[i];
        dPos[i * 3 + 1] += dt * (0.05 + (s % 1) * 0.08);
        dPos[i * 3] += Math.sin(time * 0.3 + s) * dt * 0.04;
        if (dPos[i * 3 + 1] > 3.2) dPos[i * 3 + 1] = -3.2;
      }
      dGeo.attributes.position.needsUpdate = true;
      renderer.render(scene, camera);
      canvas.style.visibility = 'visible';
    } else {
      canvas.style.visibility = 'hidden';
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

/* ---------------- films: 3D ring ---------------- */
const ytSrc = (id, preview) => preview
  ? `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&mute=1&controls=0&loop=1&playlist=${id}&playsinline=1&rel=0&iv_load_policy=3&disablekb=1&modestbranding=1`
  : `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&playsinline=1&rel=0&modestbranding=1`;
const films = (() => {
  const ringEl = document.getElementById('ring');
  const stage = document.getElementById('stage3d');
  const nameEl = document.getElementById('filmName');
  const countEl = document.getElementById('filmCount');
  const lb = document.getElementById('lightbox');
  const lbFrame = document.getElementById('lbFrame');
  const NF = FILMS.length;
  const slots = []; while (slots.length < 4) FILMS.forEach((_, i) => slots.push(i));
  const N = slots.length;
  const STEP = 38;
  let pw = 0, radius = 0, cur = 0, target = 0, front = -1, moved = false, inView = false, previewTimer = 0;
  const mod = (a, n) => ((a % n) + n) % n;
  const panels = slots.map((fi, i) => {
    const f = FILMS[fi];
    const el = document.createElement('div');
    el.className = 'panel';
    el.innerHTML = `<img src="${f.poster}" alt="" loading="lazy" /><div class="panel__label"><span><small></small><b></b></span><i class="panel__play"></i></div>`;
    el.addEventListener('click', () => { if (moved) return; if (i === Math.round(mod(cur, N))) open(fi); else go(i); });
    ringEl.appendChild(el);
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
    pw = Math.min(760, stage.clientWidth * (isMobile() ? 0.78 : 0.56));
    const ph = pw * 9 / 16;
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
  function update(force) {
    panels.forEach((p, i) => {
      let d = i - cur; d = d - Math.round(d / N) * N;
      const op = Math.max(0, 1 - Math.max(0, Math.abs(d) - 1.2) * 0.9);
      p.el.style.transform = `rotateY(${d * STEP}deg) translateZ(${radius}px)`;
      p.el.style.opacity = op;
      p.el.style.visibility = op <= 0.01 ? 'hidden' : 'visible';
    });
    ringEl.style.transform = `translateZ(${-radius}px)`;
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
  addEventListener('pointermove', (e) => { if (!dragging) return; const dx = e.clientX - sx; if (Math.abs(dx) > 6) moved = true; target = st - dx / (pw * 0.9); });
  addEventListener('pointerup', () => { if (!dragging) return; dragging = false; target = Math.round(target); setTimeout(() => (moved = false), 0); });
  new IntersectionObserver(([e]) => { inView = e.isIntersecting; if (!inView) panels.forEach((p) => setPreview(p, false)); else update(true); }, { threshold: 0.25 }).observe(stage);
  (function loop() {
    if (inView) { const d = target - cur; if (Math.abs(d) > 0.0005) { cur += d * 0.1; update(); } }
    requestAnimationFrame(loop);
  })();
  addEventListener('resize', () => { layout(); update(true); });
  function open(fi) {
    const f = FILMS[fi];
    lbFrame.innerHTML = '';
    const fr = document.createElement('iframe');
    fr.src = ytSrc(f.yt, false); fr.title = f.title[lang];
    fr.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen'; fr.allowFullscreen = true;
    lbFrame.appendChild(fr);
    panels.forEach((p) => setPreview(p, false));
    lb.hidden = false; document.body.style.overflow = 'hidden'; lenis && lenis.stop();
  }
  function close() { lb.hidden = true; lbFrame.innerHTML = ''; document.body.style.overflow = ''; lenis && lenis.start(); update(true); }
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
  fortuneText.style.opacity = 0; fortuneText.style.transform = 'translateY(10px)';
  setTimeout(() => {
    let i; do { i = Math.floor(Math.random() * FORTUNES.en.length); } while (i === lastFortune);
    lastFortune = i;
    fortuneText.removeAttribute('data-i18n');
    fortuneText.textContent = FORTUNES[lang][i];
    fortuneText.style.opacity = 1; fortuneText.style.transform = '';
    fortuneBtn.dataset.i18n = 'r.again'; fortuneBtn.textContent = t('r.again');
    fortuneBox.classList.remove('is-spinning');
  }, 1000);
});

/* ---------------- countdown ---------------- */
const cd = ['cdD', 'cdH', 'cdM', 'cdS'].map((id) => document.getElementById(id));
function countdown() {
  const s = Math.max(0, Math.floor((LAUNCH - Date.now()) / 1000));
  if (s === 0) { document.getElementById('countdown').innerHTML = `<div><b>${t('l.live')}</b></div>`; return; }
  [Math.floor(s / 86400), Math.floor(s % 86400 / 3600), Math.floor(s % 3600 / 60), s % 60].forEach((n, i) => (cd[i].textContent = String(n).padStart(2, '0')));
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
onScroll();
