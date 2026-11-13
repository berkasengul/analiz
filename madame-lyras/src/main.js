import Lenis from 'lenis';
import { FLAVORS, CLAIMS, SITE } from './data.js';

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];

/* ---------- ürün panelleri ---------- */
const productsEl = $('#urunler');
productsEl.innerHTML = FLAVORS.map((f, i) => `
  <section class="sec product" id="urun-${f.id}" data-bg="${f.bg}" data-ink="${f.ink}" data-stage="product" data-flavor="${i}" style="--accent:${f.accent}">
    <div class="wrap product__inner">
      <div class="product__text">
        <p class="product__idx reveal"><b>${String(i + 1).padStart(2, '0')}</b> / ${String(FLAVORS.length).padStart(2, '0')}</p>
        <p class="eyebrow reveal">Dondurularak kurutulmuş</p>
        <h2 class="product__name reveal">${f.name}</h2>
        <p class="product__lead reveal">${f.lead}</p>
        <p class="product__desc reveal">${f.desc}</p>
        <dl class="facts reveal">${f.facts.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl>
        <ul class="badges badges--small reveal">${CLAIMS.map((c) => `<li>${c}</li>`).join('')}</ul>
      </div>
      <img class="product__fallback" src="${f.tex}" alt="Madame Lyra's dondurularak kurutulmuş ${f.name.toLocaleLowerCase('tr')} paketi" width="1024" height="1180" loading="lazy" />
    </div>
  </section>`).join('');

/* ---------- e-posta ---------- */
const mail = $('#mailLink');
mail.href = `mailto:${SITE.email}`;
mail.textContent = SITE.email;
$('#year').textContent = new Date().getFullYear();

/* ---------- yumuşak kaydırma ---------- */
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const lenis = reduce ? null : new Lenis({ lerp: 0.1, smoothWheel: true });
if (lenis) {
  const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
  requestAnimationFrame(raf);
}
function goTo(target) {
  const el = typeof target === 'string' ? $(target) : target;
  if (!el) return;
  if (lenis) lenis.scrollTo(el, { offset: 0, duration: 1.4 });
  else el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
}
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href^="#"]');
  if (!a) return;
  const id = a.getAttribute('href');
  if (id.length < 2 && id !== '#') return;
  e.preventDefault();
  closeMenu();
  if (a.dataset.topic) $('#f-topic').value = a.dataset.topic;
  goTo(id === '#' || id === '#top' ? document.body : id);
});

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
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });

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
    scene.ready.then(() => { update(true); setTimeout(hideLoader, 250); });
  }).catch(() => { document.body.classList.add('no-gl'); hideLoader(); });
  setTimeout(hideLoader, 7000);
} else {
  document.body.classList.add('no-gl');
  hideLoader();
}

/* ---------- kaydırmaya bağlı sahne ve renk ---------- */
const bgEl = $('.bg');
const flavorDots = $$('#flavorDots button');
const sections = () => $$('main .sec, .ftr');
let lastSection = null;

function pose(stage, flavor) {
  const H = scene ? scene.halfHeight() : 1.34;
  const A = window.innerWidth / window.innerHeight;
  const W = H * A;
  const mobile = A < 0.9;
  const off = { y: H * 2.6, s: 0.7, cloud: 0, frost: 0 };
  if (mobile) {
    switch (stage) {
      case 'hero': return { x: 0, y: H * 0.5, s: 0.6, ry: -0.3, rz: 0.04, cloud: 1, frost: 0 };
      case 'product': return { x: 0, y: H * 0.46, s: 0.7, ry: flavor % 2 ? 0.28 : -0.28, rz: 0, cloud: 1, frost: 0 };
      case 'process': return { x: 0, y: H * 2.4, s: 0.6, ry: 0.5, rz: 0, cloud: 0, frost: 1 };
      default: return { x: 0, ...off, ry: 0, rz: 0 };
    }
  }
  const s = Math.min(1.35, Math.max(0.95, W * 0.48));
  switch (stage) {
    case 'hero': return { x: W * 0.4, y: -0.03, s, ry: -0.5, rz: 0.05, cloud: 1, frost: 0 };
    case 'product': return { x: W * 0.38, y: 0, s: s * 0.98, ry: flavor % 2 ? 0.42 : -0.42, rz: flavor % 2 ? -0.03 : 0.03, cloud: 1, frost: 0 };
    case 'process': return { x: W * 0.55, y: H * 0.28, s: s * 0.62, ry: -0.65, rz: 0.12, cloud: 0, frost: 1 };
    default: return { x: W * 0.3, ...off, ry: -0.4, rz: 0 };
  }
}

let lastY = window.scrollY;
function update(force) {
  const mid = window.innerHeight * 0.5;
  const list = sections();
  let active = list[0];
  for (const s of list) {
    const r = s.getBoundingClientRect();
    if (r.top <= mid && r.bottom > mid) { active = s; break; }
  }
  const y = window.scrollY;
  if (scene) scene.kick((y - lastY) * 0.4);
  lastY = y;
  document.querySelector('.hdr').classList.toggle('hdr--scrolled', y > 40);
  if (active === lastSection && !force) return;
  lastSection = active;
  const bg = active.dataset.bg || '#f4ecdf';
  bgEl.style.backgroundColor = bg;
  document.documentElement.dataset.ink = active.dataset.ink || 'light';
  document.querySelector('meta[name="theme-color"]').setAttribute('content', bg);
  const fl = active.dataset.flavor;
  const stage = active.dataset.stage || 'off';
  document.body.dataset.stage = stage;
  if (scene) {
    if (fl !== undefined) scene.setFlavor(+fl);
    scene.setPose(pose(stage, scene.flavor));
  }
  flavorDots.forEach((d, i) => d.classList.toggle('on', fl !== undefined && +fl === i && stage === 'product'));
}
window.addEventListener('scroll', () => update(false), { passive: true });
window.addEventListener('resize', () => update(true));
update(true);

flavorDots.forEach((d) => d.addEventListener('click', () => goTo(`#urun-${FLAVORS[+d.dataset.go].id}`)));

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
