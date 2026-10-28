import { PRODUCTS, byId, formatPrice, sizeLabel } from './products.js';
import { renderSet, renderModel, modelThumb, loadProductImage } from './garments.js';
import { createShowcase } from './showcase.js';

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const N = PRODUCTS.length;
const AUTO_MS = 3800;

const store = {
  get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* yok say */ } },
};

let toastTimer;
function toast(msg) {
  const t = $('.toast');
  t.textContent = msg;
  t.classList.add('is-on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('is-on'), 2600);
}

const paint = (el, p) => {
  el.style.setProperty('--accent', p.accent);
  el.style.setProperty('--tint', p.tint);
};
const ageRange = (p) => `${p.sizes[0].split('-')[0]}–${p.sizes[p.sizes.length - 1].split('-')[1]} yaş`;

/* ---------- 3D vitrin ---------- */
const stage = $('.stage');
const spot = $('.spot');
let focused = PRODUCTS[0];

$('.dots').innerHTML = PRODUCTS.map((p, i) => `<button role="tab" style="--c:${p.accent}" data-i="${i}" aria-label="${p.name}"></button>`).join('');

function showFocus(p, i) {
  focused = p;
  paint(spot, p);
  $('.spot-code').textContent = p.code;
  $('.spot-name').textContent = p.name;
  $('.spot-desc').textContent = p.desc;
  $('.spot-price').textContent = formatPrice(p.price);
  $('.spot-age').textContent = ageRange(p);
  spot.classList.remove('swap');
  void spot.offsetWidth;
  spot.classList.add('swap');
  $$('.dots button').forEach((d, k) => {
    d.classList.toggle('is-active', k === i);
    d.setAttribute('aria-selected', k === i);
  });
}
showFocus(PRODUCTS[0], 0);

// Hedef = scroll'dan gelen konum + oklar/sürükleme/otomatik dönüşten gelen ek
let extra = 0;
let lastInput = 0;
let autoplay = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const show = createShowcase($('.showcase'), PRODUCTS, {
  onFocus: showFocus,
  onSelect: (p) => openDetail(p.id),
  onDrag: (d) => { extra -= d; touch(); update(); },
  onDragEnd: () => snapSoon(0),
});

if (!show) {
  $('.no-webgl').hidden = false;
  $('.stage-ui').hidden = true;
  stage.style.height = '100vh';
}

function stageProgress() {
  const span = stage.offsetHeight - innerHeight;
  return span > 0 ? Math.min(1, Math.max(0, (scrollY - stage.offsetTop) / span)) : 0;
}
const raw = () => stageProgress() * N + extra;
function update() { show?.setTarget(raw()); }
function touch() { lastInput = performance.now(); }

let snapTimer;
function snapSoon(ms = 180) {
  clearTimeout(snapTimer);
  snapTimer = setTimeout(() => {
    const r = raw();
    extra += Math.round(r) - r;
    update();
  }, ms);
}

addEventListener('scroll', () => { touch(); update(); snapSoon(); }, { passive: true });
addEventListener('resize', update);
update();

function go(d) {
  extra = Math.round(raw() + d) - stageProgress() * N;
  touch();
  update();
}
function goTo(i) {
  const cur = Math.round(raw());
  let d = ((i - cur) % N + N) % N;
  if (d > N / 2) d -= N;
  go(d);
}
$('.stage-ui .prev').addEventListener('click', () => go(-1));
$('.stage-ui .next').addEventListener('click', () => go(1));
$('.dots').addEventListener('click', (e) => {
  const b = e.target.closest('button');
  if (b) goTo(Number(b.dataset.i));
});
$('.auto').addEventListener('click', (e) => {
  autoplay = !autoplay;
  const b = e.currentTarget;
  b.classList.toggle('is-on', autoplay);
  b.setAttribute('aria-pressed', autoplay);
  b.setAttribute('aria-label', autoplay ? 'Otomatik dönüşü durdur' : 'Otomatik dönüşü başlat');
});
$('.spot-open').addEventListener('click', () => openDetail(focused.id));

// Otomatik dönüş: kullanıcı birkaç saniye dokunmazsa sıradaki modele geçer
setInterval(() => {
  if (!show || !autoplay || !detail.hidden || document.hidden) return;
  if (performance.now() - lastInput < AUTO_MS) return;
  const r = stage.getBoundingClientRect();
  if (r.bottom < innerHeight * 0.5 || r.top > innerHeight * 0.5) return;
  extra += 1;
  update();
}, AUTO_MS);

/* ---------- Menü, arama ---------- */
$$('[data-scroll]').forEach((a) => a.addEventListener('click', (e) => {
  e.preventDefault();
  window.scrollTo({ top: a.dataset.scroll === 'top' ? 0 : stage.offsetTop, behavior: 'smooth' });
}));
$$('[data-action="account"]').forEach((b) => b.addEventListener('click', () => toast('Üyelik sistemi yakında açılıyor.')));

const norm = (s) => s.toLocaleLowerCase('tr').replace(/\s+/g, ' ').trim();
$('#product-list').innerHTML = PRODUCTS.map((p) => `<option value="${p.name}">`).join('');
$('.search').addEventListener('submit', (e) => {
  e.preventDefault();
  const q = norm($('#search').value);
  if (!q) return;
  const words = q.split(' ');
  const hit = PRODUCTS.find((p) => {
    const hay = norm(`${p.code} ${p.name} ${p.colorName} ${p.id} ${p.desc}`);
    return words.every((w) => hay.includes(w));
  });
  if (!hit) { toast('Aramanıza uygun pijama bulunamadı.'); return; }
  $('#search').blur();
  const top = stage.offsetTop;
  if (Math.abs(scrollY - top) > innerHeight) window.scrollTo({ top, behavior: 'smooth' });
  goTo(PRODUCTS.indexOf(hit));
});

/* ---------- Koleksiyon ---------- */
function renderGrid(filter = 'all') {
  const list = PRODUCTS.filter((p) => filter === 'all' || p.line === filter);
  $('.grid').innerHTML = list.map((p) => `
    <button class="card" data-id="${p.id}" style="--accent:${p.accent};--tint:${p.tint}">
      ${p.gift ? '<span class="tag">Göz bandı hediyeli</span>' : ''}
      <span class="card-media"><img src="${modelThumb(p, 0.6)}" alt="${p.name} pijama takımı" loading="lazy" width="240" height="504"></span>
      <span class="card-body">
        <small>${p.code}</small>
        <strong>${p.name}</strong>
        <span class="card-foot">
          <span class="price">${formatPrice(p.price)}</span>
          <span class="plus" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg></span>
        </span>
      </span>
    </button>`).join('');
}
$('.grid').addEventListener('click', (e) => {
  const c = e.target.closest('.card');
  if (c) openDetail(c.dataset.id);
});
function setFilter(f) {
  $$('.chip').forEach((x) => x.classList.toggle('is-active', x.dataset.filter === f));
  renderGrid(f);
}
$$('.chip').forEach((c) => c.addEventListener('click', () => setFilter(c.dataset.filter)));
$('[data-goto="d"]').addEventListener('click', () => {
  setFilter('d');
  document.getElementById('koleksiyon').scrollIntoView({ behavior: 'smooth' });
});
renderGrid();

/* ---------- Ürün detayı ---------- */
const detail = $('.detail');
const dCanvas = $('.detail-canvas');
const state = { id: null, view: 'model', size: null, lastFocus: null };

async function drawDetail() {
  const p = byId(state.id);
  const img = state.view === 'model' ? await loadProductImage(p) : null;
  const src = state.view === 'model' ? renderModel(p, 'front', 2, img) : renderSet(p, state.view, 2);
  dCanvas.width = src.width;
  dCanvas.height = src.height;
  dCanvas.getContext('2d').drawImage(src, 0, 0);
  dCanvas.classList.remove('drop');
  void dCanvas.offsetWidth;
  dCanvas.classList.add('drop');
}

function fillDetail() {
  const p = byId(state.id);
  const i = PRODUCTS.indexOf(p);
  paint(detail, p);
  $('.detail-index').textContent = `${i + 1} / ${N}`;
  $('.detail-code').textContent = p.code;
  $('#detail-name').textContent = p.name;
  $('.detail-price').textContent = formatPrice(p.price);
  $('.detail-desc').textContent = p.desc;
  $('.gift-badge').hidden = !p.gift;
  $('.size-note').textContent = state.size ? sizeLabel(state.size) : 'Seçiniz';
  $('.detail-meta').innerHTML = [
    `Renk: ${p.colorName}`,
    `Beden aralığı: ${ageRange(p)}`,
    p.line === 'interlok' ? 'İnterlok kumaş, ribanalı yaka ve paçalar' : 'Yakalı, düğmeli üst, biyeli detaylar',
    ...(p.gift ? ['Uyku göz bandı hediye'] : []),
  ].map((t) => `<li>${t}</li>`).join('');
  $('.sizes').innerHTML = p.sizes.map((s) => `<button data-size="${s}" class="${s === state.size ? 'is-active' : ''}" aria-pressed="${s === state.size}">${s}</button>`).join('');
  $$('.seg button').forEach((b) => b.classList.toggle('is-active', b.dataset.view === state.view));
  drawDetail();
}

function openDetail(id) {
  if (detail.hidden) state.lastFocus = document.activeElement;
  Object.assign(state, { id, view: 'model', size: null });
  fillDetail();
  detail.hidden = false;
  document.body.style.overflow = 'hidden';
  show?.pause();
  requestAnimationFrame(() => detail.classList.add('is-open'));
  $('.detail-close').focus({ preventScroll: true });
}
function closeDetail() {
  detail.classList.remove('is-open');
  document.body.style.overflow = '';
  show?.resume();
  touch();
  setTimeout(() => { detail.hidden = true; }, 300);
  state.lastFocus?.focus?.({ preventScroll: true });
}
function step(d) {
  const i = PRODUCTS.findIndex((p) => p.id === state.id);
  Object.assign(state, { id: PRODUCTS[(i + d + N) % N].id, size: null });
  fillDetail();
}

$('.detail-close').addEventListener('click', closeDetail);
$('.detail .prev').addEventListener('click', () => step(-1));
$('.detail .next').addEventListener('click', () => step(1));
$$('.seg button').forEach((b) => b.addEventListener('click', () => {
  state.view = b.dataset.view;
  $$('.seg button').forEach((x) => x.classList.toggle('is-active', x === b));
  drawDetail();
}));
$('.sizes').addEventListener('click', (e) => {
  const b = e.target.closest('button');
  if (!b) return;
  state.size = b.dataset.size;
  $('.size-note').textContent = sizeLabel(state.size);
  $$('.sizes button').forEach((x) => {
    x.classList.toggle('is-active', x === b);
    x.setAttribute('aria-pressed', x === b);
  });
});
$('.add').addEventListener('click', () => {
  if (!state.size) {
    const s = $('.sizes');
    s.classList.remove('shake');
    void s.offsetWidth;
    s.classList.add('shake');
    toast('Önce yaş / beden seçin.');
    return;
  }
  cart.add(state.id, state.size);
  flyToCart(dCanvas, byId(state.id));
  toast(`${byId(state.id).name} (${sizeLabel(state.size)}) sepete eklendi.`);
});

addEventListener('keydown', (e) => {
  if (!detail.hidden) {
    if (e.key === 'Escape') closeDetail();
    if (e.key === 'ArrowRight') step(1);
    if (e.key === 'ArrowLeft') step(-1);
  } else if (cartEl.classList.contains('is-open')) {
    if (e.key === 'Escape') toggleCart(false);
  } else if (e.target === document.body && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) {
    go(e.key === 'ArrowRight' ? 1 : -1);
  }
});

function flyToCart(fromEl, p) {
  const target = $('.cart-btn').getBoundingClientRect();
  const r = fromEl.getBoundingClientRect();
  const img = document.createElement('img');
  img.src = modelThumb(p, 0.4);
  img.className = 'fly';
  const w = r.width * 0.55;
  const h = r.height * 0.55;
  const x0 = r.left + (r.width - w) / 2;
  const y0 = r.top + (r.height - h) / 2;
  Object.assign(img.style, { left: `${x0}px`, top: `${y0}px`, width: `${w}px`, height: `${h}px` });
  document.body.append(img);
  const dx = target.left + target.width / 2 - (x0 + w / 2);
  const dy = target.top + target.height / 2 - (y0 + h / 2);
  const anim = img.animate([
    { transform: 'translate(0,0) scale(1) rotate(0)', opacity: 1 },
    { transform: `translate(${dx * 0.5}px, ${dy * 0.3 - 90}px) scale(.45) rotate(-10deg)`, offset: 0.55 },
    { transform: `translate(${dx}px, ${dy}px) scale(.05) rotate(10deg)`, opacity: 0.5 },
  ], { duration: 900, easing: 'cubic-bezier(.5,0,.3,1)' });
  anim.onfinish = () => {
    img.remove();
    const b = $('.badge');
    b.classList.remove('bump');
    void b.offsetWidth;
    b.classList.add('bump');
  };
}

/* ---------- Sepet ---------- */
const cartEl = $('.cart');
const scrim = $('.scrim');

const cart = {
  items: store.get('sesa-cart', []).filter((it) => byId(it.id)),
  save() { store.set('sesa-cart', this.items); this.render(); },
  add(id, size) {
    const f = this.items.find((x) => x.id === id && x.size === size);
    if (f) f.qty += 1; else this.items.push({ id, size, qty: 1 });
    this.save();
  },
  setQty(i, q) {
    if (q <= 0) this.items.splice(i, 1); else this.items[i].qty = Math.min(q, 99);
    this.save();
  },
  count() { return this.items.reduce((n, x) => n + x.qty, 0); },
  total() { return this.items.reduce((n, x) => n + x.qty * byId(x.id).price, 0); },
  render() {
    const n = this.count();
    const badge = $('.badge');
    badge.hidden = n === 0;
    badge.textContent = n;
    $('.cart-count').textContent = n;
    $('.cart-sub').textContent = formatPrice(this.total());
    $('.checkout').disabled = n === 0;
    $('.cart-items').innerHTML = this.items.length
      ? this.items.map((x, i) => {
        const p = byId(x.id);
        return `<div class="line" style="--tint:${p.tint}">
          <img src="${modelThumb(p, 0.4)}" alt="">
          <div>
            <h3>${p.name}</h3>
            <p>${p.code} · ${sizeLabel(x.size)}</p>
            <span class="qty"><button data-i="${i}" data-d="-1" aria-label="Azalt">−</button><span>${x.qty}</span><button data-i="${i}" data-d="1" aria-label="Arttır">+</button></span>
            <button class="remove" data-i="${i}" aria-label="Kaldır"><svg viewBox="0 0 24 24"><path d="M5 7h14M10 7V5h4v2M7 7l1 12h8l1-12"/></svg></button>
          </div>
          <span class="total">${formatPrice(p.price * x.qty)}</span>
        </div>`;
      }).join('')
      : '<p class="cart-empty">Sepetiniz şimdilik boş.<br>Vitrinden bir pijama seçin.</p>';
  },
};

function toggleCart(open) {
  cartEl.classList.toggle('is-open', open);
  cartEl.setAttribute('aria-hidden', String(!open));
  if (open) {
    scrim.hidden = false;
    requestAnimationFrame(() => scrim.classList.add('is-open'));
    $('.cart-close').focus({ preventScroll: true });
  } else {
    scrim.classList.remove('is-open');
    setTimeout(() => { scrim.hidden = true; }, 300);
  }
}
$('.cart-btn').addEventListener('click', () => toggleCart(true));
$('.cart-close').addEventListener('click', () => toggleCart(false));
scrim.addEventListener('click', () => toggleCart(false));
$('.cart-items').addEventListener('click', (e) => {
  const b = e.target.closest('button');
  if (!b) return;
  const i = Number(b.dataset.i);
  if (b.classList.contains('remove')) cart.setQty(i, 0);
  else cart.setQty(i, cart.items[i].qty + Number(b.dataset.d));
});
$('.checkout').addEventListener('click', () => toast('Ödeme altyapısı henüz bağlanmadı (demo).'));
cart.render();

$('.year').textContent = new Date().getFullYear();
