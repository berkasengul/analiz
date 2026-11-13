import Lenis from 'lenis';
import { FLAVORS, SITE } from './data.js';

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const pad = (n) => String(n).padStart(2, '0');
const lower = (t) => t.toLocaleLowerCase('tr');
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const ease = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const N = FLAVORS.length;
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isMobile = () => window.innerWidth / window.innerHeight < 0.9 || window.innerWidth < 760;

/* ---------- ürün katmanları (sabit sahne içinde) ---------- */
$('#players').innerHTML = FLAVORS.map((f, i) => `
  <article class="player" id="urun-${f.id}" data-ink="${f.ink}" aria-hidden="${i ? 'true' : 'false'}">
    <p class="player__idx" style="--k:0"><b>${pad(i + 1)}</b> / ${pad(N)}</p>
    <p class="eyebrow" style="--k:1">${f.slogan}</p>
    <h2 class="player__name${f.name.length > 9 ? ' player__name--long' : ''}" style="--k:2">${f.name}</h2>
    <p class="player__lead" style="--k:3">${f.lead}</p>
    <p class="player__desc" style="--k:4">${f.desc}</p>
    <dl class="facts" style="--k:5">${f.facts.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl>
    <div class="player__actions" style="--k:6">
      <button class="btn btn--light" type="button" data-inspect="${i}">3D olarak incele</button>
      <a class="btn btn--ghost" href="#iletisim" data-ask="${i}">Bilgi al</a>
    </div>
    <img class="product__fallback" src="${f.tex}" alt="Dondurularak kurutulmuş ${lower(f.name)} paketi" width="1024" height="${Math.round(1024 * f.aspect)}" loading="lazy" />
  </article>`).join('');
const players = $$('.player');
const productsEl = $('#urunler');
productsEl.style.setProperty('--n', N);

/* ---------- katalog ve afişler ---------- */
$('#catalog').innerHTML = FLAVORS.map((f, i) => `
  <button class="card reveal" type="button" data-inspect="${i}" style="--c:${f.bg}" aria-label="${f.name}: 3D olarak incele">
    <span class="card__img"><img src="${f.tex}" alt="" loading="lazy" width="1024" height="${Math.round(1024 * f.aspect)}" /></span>
    <span class="card__n">${pad(i + 1)}</span>
    <b class="card__name">${f.name}</b>
    <span class="card__slogan">${f.slogan}</span>
    <span class="card__go">3D incele →</span>
  </button>`).join('');
$('#posters').innerHTML = FLAVORS.filter((f) => f.poster).map((f) => `
  <figure class="poster"><img src="${f.poster}" alt="${f.name} afişi" loading="lazy" width="880" height="1100" /></figure>`).join('');

/* ---------- ürün noktaları ---------- */
const dotsEl = $('#flavorDots');
dotsEl.innerHTML = FLAVORS.map((f, i) => `<button type="button" data-go="${i}" aria-label="${f.name}"><span>${f.short || f.name}</span></button>`).join('');
const dots = $$('button', dotsEl);

/* ---------- e-posta ---------- */
const mail = $('#mailLink');
mail.href = `mailto:${SITE.email}`;
mail.textContent = SITE.email;
$('#year').textContent = new Date().getFullYear();

/* ---------- yumuşak kaydırma ---------- */
const lenis = reduce ? null : new Lenis({ lerp: 0.085, smoothWheel: true, wheelMultiplier: 0.9 });
if (lenis) {
  const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
  requestAnimationFrame(raf);
  lenis.on('scroll', () => update(false));
}
function scrollToY(y, duration = 1.6) {
  if (lenis) lenis.scrollTo(y, { duration });
  else window.scrollTo({ top: y, behavior: reduce ? 'auto' : 'smooth' });
}
function goTo(target) {
  const el = typeof target === 'string' ? $(target) : target;
  if (!el) return;
  scrollToY(el.getBoundingClientRect().top + window.scrollY);
}
// ürün akışında i. ürünün tam ortalandığı kaydırma konumu
function productY(i) {
  const top = productsEl.getBoundingClientRect().top + window.scrollY;
  const total = productsEl.offsetHeight - window.innerHeight;
  return top + (total * i) / (N - 1);
}

document.addEventListener('click', (e) => {
  const ins = e.target.closest('[data-inspect]');
  if (ins) { e.preventDefault(); openDetail(+ins.dataset.inspect); return; }
  const ask = e.target.closest('[data-ask]');
  if (ask) { e.preventDefault(); askAbout(+ask.dataset.ask); return; }
  const a = e.target.closest('a[href^="#"]');
  if (!a) return;
  const id = a.getAttribute('href');
  e.preventDefault();
  closeMenu();
  if (a.dataset.topic) $('#f-topic').value = a.dataset.topic;
  if (id === '#' || id === '#top') scrollToY(0);
  else if (id === '#urunler') scrollToY(productY(0));
  else goTo(id);
});

function askAbout(i) {
  const f = FLAVORS[i];
  $('#f-topic').value = 'Ürün bilgisi';
  const msg = $('#f-msg');
  if (!msg.value.trim()) msg.value = `Merhaba, ${f.name} ürünü hakkında bilgi almak istiyorum.`;
  goTo('#iletisim');
}

/* ---------- menü ---------- */
const menuBtn = $('#menuBtn');
function closeMenu() {
  document.body.classList.remove('menu-open');
  menuBtn.setAttribute('aria-expanded', 'false');
  menuBtn.setAttribute('aria-label', 'Menüyü aç');
}
menuBtn.addEventListener('click', () => {
  const open = !document.body.classList.contains('menu-open');
  document.body.classList.toggle('menu-open', open);
  menuBtn.setAttribute('aria-expanded', String(open));
  menuBtn.setAttribute('aria-label', open ? 'Menüyü kapat' : 'Menüyü aç');
});

/* ---------- görünürken beliren öğeler ---------- */
const io = new IntersectionObserver((entries) => {
  entries.forEach((en) => {
    if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
  });
}, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
$$('.reveal').forEach((el, i) => {
  el.style.setProperty('--d', `${(i % 6) * 70}ms`);
  io.observe(el);
});

/* ---------- 3B sahne ---------- */
const loaderEl = $('#loader');
const bar = $('#loaderBar');
let scene = null;
const hideLoader = () => {
  loaderEl.classList.add('done');
  document.body.classList.add('ready');
};
function webglOK() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch (e) { return false; }
}
if (webglOK()) {
  import('./scene.js').then(({ createScene }) => {
    scene = createScene($('#gl'), FLAVORS, (p) => { bar.style.transform = `scaleX(${p})`; });
    scene.ready.then(() => { lastKey = ''; update(true); setTimeout(hideLoader, 250); });
  }).catch(() => { document.body.classList.add('no-gl'); hideLoader(); });
  setTimeout(hideLoader, 7000);
} else {
  document.body.classList.add('no-gl');
  hideLoader();
}

/* ---------- sahne pozları ---------- */
function pose(stage) {
  const H = scene ? scene.halfHeight() : 1.34;
  const A = window.innerWidth / window.innerHeight;
  const W = H * A;
  const off = { y: H * 2.6, s: 0.7, cloud: 0, frost: 0 };
  if (isMobile()) {
    switch (stage) {
      case 'hero': return { x: 0.08, y: H * 0.47, s: 0.44, ry: -0.1, rz: 0, cloud: 0, frost: 0 };
      case 'product': return { x: 0, y: H * 0.43, s: 0.78, ry: -0.3, rz: 0.02, cloud: 1, frost: 0 };
      case 'inspect': return { x: 0, y: H * 0.33, s: 0.74, ry: 0, rz: 0, cloud: 0.35, frost: 0 };
      case 'process': return { x: 0, y: H * 2.4, s: 0.6, ry: 0.5, rz: 0, cloud: 0, frost: 1 };
      default: return { x: 0, ...off, ry: 0, rz: 0 };
    }
  }
  const big = Math.min(1.55, W * 0.72);
  switch (stage) {
    case 'hero': return { x: W * 0.53, y: -0.04, s: big * 0.76, ry: -0.1, rz: 0, cloud: 0, frost: 0 };
    case 'product': return { x: W * 0.36, y: -0.02, s: big, ry: -0.38, rz: 0.03, cloud: 1, frost: 0 };
    case 'inspect': return { x: W * 0.2, y: 0.1, s: big * 0.86, ry: 0, rz: 0, cloud: 0.35, frost: 0 };
    case 'process': return { x: W * 0.55, y: H * 0.28, s: big * 0.6, ry: -0.65, rz: 0.12, cloud: 0, frost: 1 };
    default: return { x: W * 0.3, ...off, ry: -0.4, rz: 0 };
  }
}

/* ---------- kaydırmaya bağlı durum ---------- */
const bgEl = $('.bg');
const hdr = $('.hdr');
const themeMeta = $('meta[name="theme-color"]');
const sections = $$('main .sec, .ftr');
const hex = (h) => [1, 3, 5].map((k) => parseInt(h.slice(k, k + 2), 16));
const mix = (a, b, t) => { const A = hex(a), B = hex(b); return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * t)).join(',')})`; };
let lastKey = '';
let lastY = window.scrollY;
let currentProduct = 0;
let inspecting = false;
let streamF = null;

function update(force) {
  if (inspecting) return;
  const vh = window.innerHeight;
  const mid = vh * 0.5;
  const y = window.scrollY;
  if (scene) scene.kick((y - lastY) * 0.4);
  lastY = y;
  hdr.classList.toggle('hdr--scrolled', y > 40);

  // ürün akışı
  const pr = productsEl.getBoundingClientRect();
  const inProducts = pr.top <= mid && pr.bottom > mid;
  if (inProducts) {
    const total = productsEl.offsetHeight - vh;
    const f = clamp((-pr.top / total) * (N - 1), 0, N - 1);
    const i = Math.min(N - 2, Math.floor(f));
    const u = f - i;
    const r = reduce ? (u > 0.5 ? 1 : 0) : ease(smooth(0.3, 0.7, u));
    currentProduct = r < 0.5 ? i : i + 1;
    bgEl.classList.add('bg--live');
    bgEl.style.backgroundColor = mix(FLAVORS[i].bg, FLAVORS[i + 1].bg, r);
    document.documentElement.dataset.ink = FLAVORS[currentProduct].ink;
    document.body.dataset.stage = 'product';
    players.forEach((p, k) => {
      const d = f - k;
      const ad = Math.abs(d);
      // ürün ekrandayken yazı tamamen net ve sabit; yalnızca geçiş anında kayar ve solar
      const o = 1 - smooth(0.3, 0.47, ad);
      const moved = Math.sign(d) * Math.max(0, ad - 0.18);
      p.style.setProperty('--d', moved.toFixed(4));
      p.style.setProperty('--o', o.toFixed(3));
      p.style.setProperty('--b', ad < 0.32 ? '0px' : `${Math.min(6, (ad - 0.32) * 40).toFixed(1)}px`);
      p.style.visibility = o < 0.002 ? 'hidden' : 'visible';
      const active = Math.abs(d) < 0.3;
      if (p.classList.contains('on') !== active) {
        p.classList.toggle('on', active);
        p.setAttribute('aria-hidden', active ? 'false' : 'true');
      }
    });
    dots.forEach((d, k) => d.classList.toggle('on', k === currentProduct));
    if (scene) {
      scene.setStream(f);
      scene.setPose(pose('product'));
      scene.setFan(0);
    }
    streamF = f;
    const key = `p${currentProduct}`;
    if (key !== lastKey) { lastKey = key; themeMeta.setAttribute('content', FLAVORS[currentProduct].bg); }
    return;
  }

  bgEl.classList.remove('bg--live');
  streamF = null;
  if (scene) scene.setStream(null);
  // açılış: öndeki paket kaydırdıkça aşağı süzülüp ilk ürünün yerine oturur, arkadakiler dağılır
  const above = pr.top > mid;
  if (scene && above) {
    const end = productsEl.offsetTop - mid;
    const h = clamp(y / Math.max(1, end), 0, 1);
    const k = ease(smooth(0.08, 1, h));
    const a = pose('hero'), b = pose('product');
    const p = {};
    for (const key in a) p[key] = a[key] + (b[key] - a[key]) * k;
    scene.setPose(p);
    scene.setFan(1 - smooth(0, 0.45, h));
  } else if (scene) scene.setFan(0);
  let active = sections[0];
  for (const s of sections) {
    const r = s.getBoundingClientRect();
    if (r.top <= mid && r.bottom > mid) { active = s; break; }
  }
  // ürünlerin altındaki bölümlerde son ürün kalsın, üstündekilerde ilk ürün
  const below = pr.bottom <= mid;
  const key = `${active.dataset.stage}|${below}`;
  if (key === lastKey && !force) return;
  lastKey = key;
  const bg = active.dataset.bg || '#f4ecdf';
  bgEl.style.backgroundColor = bg;
  document.documentElement.dataset.ink = active.dataset.ink || 'light';
  themeMeta.setAttribute('content', bg);
  const stage = active.dataset.stage || 'off';
  document.body.dataset.stage = stage;
  if (scene) {
    scene.setFlavor(below ? N - 1 : 0);
    if (!above) scene.setPose(pose(stage));
  }
}
window.addEventListener('scroll', () => { if (!lenis) update(false); }, { passive: true });
window.addEventListener('resize', () => { lastKey = ''; update(true); if (inspecting && scene) scene.setPose(pose('inspect')); });
update(true);

dots.forEach((d) => d.addEventListener('click', () => scrollToY(productY(+d.dataset.go), 1.8)));

// kaydırma durunca en yakın ürüne yumuşakça oturt
let snapTimer = 0;
let snapping = false;
function scheduleSnap() {
  clearTimeout(snapTimer);
  if (snapping || reduce || inspecting) return;
  snapTimer = setTimeout(() => {
    if (streamF === null || inspecting) return;
    const pr = productsEl.getBoundingClientRect();
    if (pr.top > 0 || pr.bottom < window.innerHeight) return;
    const n = Math.round(streamF);
    if (Math.abs(streamF - n) < 0.01) return;
    snapping = true;
    scrollToY(productY(n), 0.9);
    setTimeout(() => { snapping = false; }, 950);
  }, 200);
}
if (lenis) lenis.on('scroll', scheduleSnap);
else window.addEventListener('scroll', scheduleSnap, { passive: true });

/* ---------- paketin üstündeki tıklama alanı ---------- */
const hit = $('#productHit');
const hitLabel = $('#hitLabel');
hit.addEventListener('click', () => openDetail(currentProduct));
hit.addEventListener('pointermove', (e) => {
  const r = hit.getBoundingClientRect();
  hitLabel.style.transform = `translate(${e.clientX - r.left}px, ${e.clientY - r.top}px)`;
});
hit.addEventListener('pointerenter', () => hit.classList.add('hover'));
hit.addEventListener('pointerleave', () => hit.classList.remove('hover'));

/* ---------- 3B inceleme ---------- */
const detail = $('#detail');
let detailIndex = 0;
let returnFocus = null;

function fillDetail(i) {
  const f = FLAVORS[i];
  detailIndex = i;
  $('#detailSlogan').textContent = f.slogan;
  $('#detailName').textContent = f.name;
  $('#detailName').classList.toggle('detail__name--long', f.name.length > 9);
  $('#detailLead').textContent = f.lead;
  $('#detailDesc').textContent = f.desc;
  $('#detailFacts').innerHTML = f.facts.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('');
  $('#detailClaims').innerHTML = f.claims.map((c) => `<li>${c}</li>`).join('');
  const prev = FLAVORS[(i - 1 + N) % N], next = FLAVORS[(i + 1) % N];
  $('#detailPrev span').textContent = prev.short || prev.name;
  $('#detailNext span').textContent = next.short || next.name;
  $('#detailCount').textContent = `${pad(i + 1)} / ${pad(N)}`;
  bgEl.classList.remove('bg--live');
  bgEl.style.backgroundColor = f.bg;
  document.documentElement.dataset.ink = f.ink;
  themeMeta.setAttribute('content', f.bg);
  $$('.seg [data-view]').forEach((b) => b.classList.toggle('on', b.dataset.view === 'front'));
  detail.classList.remove('swap');
  void detail.offsetWidth;
  detail.classList.add('swap');
}

function openDetail(i) {
  if (!scene) { askAbout(i); return; }
  if (inspecting) { switchDetail(i); return; }
  inspecting = true;
  returnFocus = document.activeElement;
  closeMenu();
  lenis?.stop();
  scene.setStream(null);
  fillDetail(i);
  scene.inspectOpen(i);
  scene.setPose(pose('inspect'));
  detail.hidden = false;
  detail.setAttribute('aria-hidden', 'false');
  requestAnimationFrame(() => document.body.classList.add('inspect'));
  setTimeout(() => $('#detailClose').focus({ preventScroll: true }), 50);
  history.pushState({ inspect: i }, '', `#incele-${FLAVORS[i].id}`);
}
function switchDetail(i) {
  i = (i + N) % N;
  fillDetail(i);
  scene.inspectFlavor(i);
  history.replaceState({ inspect: i }, '', `#incele-${FLAVORS[i].id}`);
}
function closeDetail(fromPop) {
  if (!inspecting) return;
  if (!fromPop && history.state && history.state.inspect !== undefined) { history.back(); return; }
  inspecting = false;
  document.body.classList.remove('inspect');
  detail.setAttribute('aria-hidden', 'true');
  setTimeout(() => { if (!inspecting) detail.hidden = true; }, 600);
  scene.inspectClose();
  lenis?.start();
  lastKey = '';
  update(true);
  if (returnFocus && document.contains(returnFocus)) returnFocus.focus({ preventScroll: true });
}
window.addEventListener('popstate', () => { if (inspecting) closeDetail(true); });

$('#detailClose').addEventListener('click', () => closeDetail(false));
$('#detailPrev').addEventListener('click', () => switchDetail(detailIndex - 1));
$('#detailNext').addEventListener('click', () => switchDetail(detailIndex + 1));
$('#detailCta').addEventListener('click', () => {
  const i = detailIndex;
  closeDetail(false);
  setTimeout(() => askAbout(i), 350);
});
$$('.seg [data-view]').forEach((b) => b.addEventListener('click', () => {
  scene.setView(b.dataset.view);
  $$('.seg [data-view]').forEach((x) => x.classList.toggle('on', x === b));
}));
$$('.seg [data-zoom]').forEach((b) => b.addEventListener('click', () => scene.zoomBy(+b.dataset.zoom)));

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') { if (inspecting) closeDetail(false); else closeMenu(); }
  if (!inspecting) return;
  if (e.key === 'ArrowRight') switchDetail(detailIndex + 1);
  if (e.key === 'ArrowLeft') switchDetail(detailIndex - 1);
  if (e.key === 'Tab') {
    const f = $$('button, a[href]', detail).filter((el) => el.offsetParent !== null);
    if (!f.length) return;
    if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
    else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
  }
});

/* ---------- iletişim formu (Netlify Forms) ---------- */
const form = $('#contactForm');
const status = $('#formStatus');
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  status.className = 'form__status';
  if (!form.checkValidity()) {
    const bad = form.querySelector(':invalid');
    status.textContent = bad?.name === 'kvkk' ? 'Lütfen onay kutusunu işaretleyin.' : 'Lütfen gerekli alanları doldurun.';
    status.classList.add('err');
    bad?.focus();
    return;
  }
  const btn = form.querySelector('button[type="submit"]');
  btn.disabled = true;
  status.textContent = 'Gönderiliyor…';
  try {
    const body = new URLSearchParams(new FormData(form)).toString();
    const res = await fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body });
    if (!res.ok) throw new Error(res.status);
    form.reset();
    status.textContent = 'Teşekkürler, mesajınız bize ulaştı. En kısa sürede dönüş yapacağız.';
    status.classList.add('ok');
  } catch (err) {
    status.innerHTML = `Mesaj şu an gönderilemedi. Lütfen <a href="mailto:${SITE.email}">${SITE.email}</a> adresine yazın.`;
    status.classList.add('err');
  } finally {
    btn.disabled = false;
  }
});

// sayfa #incele-... ile açılırsa doğrudan inceleme açılır
const startHash = location.hash.match(/^#incele-(.+)$/);
if (startHash) {
  history.replaceState(null, '', location.pathname);
  const idx = FLAVORS.findIndex((f) => f.id === startHash[1]);
  if (idx >= 0) {
    const tryOpen = () => (scene ? scene.ready.then(() => openDetail(idx)) : setTimeout(tryOpen, 200));
    tryOpen();
  }
}
