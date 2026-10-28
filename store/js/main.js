import { PRODUCTS, byId, formatPrice, sizeLabel } from './products.js';
import { renderSet, thumb, loadProductImage } from './garments.js';
import { createRail } from './rail.js';

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const LOOPS = 1.5; // sahne boyunca ipin kaç tur döneceği

/* ---------- Depolama (her zaman güvenli) ---------- */
const store = {
  get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* yok say */ } },
};

/* ---------- Bildirim ---------- */
let toastTimer;
function toast(msg) {
  const t = $('.toast');
  t.textContent = msg;
  t.classList.add('is-on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('is-on'), 2400);
}

/* ---------- 3D raf + scroll ---------- */
const stage = $('.stage');
const progressBar = $('.progress i');
const focusEl = $('.focus');

const rail = createRail($('.rail'), PRODUCTS, {
  onSelect: (p) => openDetail(p.id),
  onFocus: (p) => {
    $('.focus-code', focusEl).textContent = p.code;
    $('.focus-name', focusEl).textContent = p.name;
    $('.focus-price', focusEl).textContent = formatPrice(p.price);
    focusEl.classList.remove('swap');
    void focusEl.offsetWidth;
    focusEl.classList.add('swap');
  },
  onDrag: (dx) => {
    const span = stage.offsetHeight - innerHeight;
    const worldPerPx = 9 / innerWidth;
    window.scrollBy(0, (-dx * worldPerPx * span) / (rail.total * LOOPS));
  },
});

if (!rail) {
  $('.no-webgl').hidden = false;
  $('.stage-foot').hidden = true;
  stage.style.height = '100vh';
}

function stageProgress() {
  const span = stage.offsetHeight - innerHeight;
  return Math.min(1, Math.max(0, (scrollY - stage.offsetTop) / span));
}
function onScroll() {
  const p = stageProgress();
  progressBar.style.transform = `scaleX(${p})`;
  rail?.setTarget(p * rail.total * LOOPS);
}
addEventListener('scroll', onScroll, { passive: true });
addEventListener('resize', onScroll);
onScroll();

function scrollToProduct(id) {
  if (!rail) {
    document.getElementById('koleksiyon').scrollIntoView({ behavior: 'smooth' });
    return;
  }
  const max = rail.total * LOOPS;
  let o = rail.offsetFor(id);
  while (o < 0) o += rail.total;
  while (o > max) o -= rail.total;
  const span = stage.offsetHeight - innerHeight;
  window.scrollTo({ top: stage.offsetTop + (o / max) * span, behavior: 'smooth' });
}

/* ---------- Menü ve arama ---------- */
$$('[data-scroll]').forEach((a) => a.addEventListener('click', (e) => {
  e.preventDefault();
  window.scrollTo({ top: a.dataset.scroll === 'top' ? 0 : stage.offsetTop + innerHeight * 0.6, behavior: 'smooth' });
}));
$$('[data-action="account"]').forEach((b) => b.addEventListener('click', (e) => {
  e.preventDefault();
  toast('Üyelik sistemi yakında.');
}));

const norm = (s) => s.toLocaleLowerCase('tr').replace(/\s+/g, ' ').trim();
$('#product-list').innerHTML = PRODUCTS.map((p) => `<option value="${p.code} — ${p.name}">`).join('');
$('.search').addEventListener('submit', (e) => {
  e.preventDefault();
  const q = norm($('.search input').value);
  if (!q) return;
  const hit = PRODUCTS.find((p) => norm(`${p.code} ${p.name} ${p.colorName} ${p.id}`).includes(q))
    || PRODUCTS.find((p) => q.includes(norm(p.id)));
  if (hit) {
    scrollToProduct(hit.id);
    $('.search input').blur();
  } else {
    toast('Sonuç bulunamadı.');
  }
});

/* ---------- Koleksiyon ızgarası ---------- */
function renderGrid(filter = 'all') {
  const list = PRODUCTS.filter((p) => filter === 'all' || p.line === filter);
  $('.grid').innerHTML = list.map((p) => `
    <button class="card" data-id="${p.id}">
      ${p.gift ? '<span class="tag">Göz bandı hediyeli</span>' : ''}
      <img src="${p.image || thumb(p, 0.6)}" alt="${p.name}" loading="lazy" width="240" height="384">
      <small>${p.code}</small>
      <strong>${p.name}</strong>
      <span class="price">${formatPrice(p.price)}</span>
    </button>`).join('');
}
$('.grid').addEventListener('click', (e) => {
  const c = e.target.closest('.card');
  if (c) openDetail(c.dataset.id);
});
$$('.chip').forEach((c) => c.addEventListener('click', () => {
  $$('.chip').forEach((x) => x.classList.toggle('is-active', x === c));
  renderGrid(c.dataset.filter);
}));
renderGrid();

/* ---------- Ürün detayı ---------- */
const detail = $('.detail');
const dCanvas = $('.detail-canvas');
const state = { id: null, side: 'front', size: null, lastFocus: null };

async function drawDetail() {
  const p = byId(state.id);
  const img = state.side === 'front' ? await loadProductImage(p) : null;
  const src = renderSet(p, state.side, 2, img);
  dCanvas.width = src.width;
  dCanvas.height = src.height;
  dCanvas.getContext('2d').drawImage(src, 0, 0);
}

function fillDetail() {
  const p = byId(state.id);
  const i = PRODUCTS.indexOf(p);
  $('.detail-index').textContent = `${String(i + 1).padStart(2, '0')} / ${String(PRODUCTS.length).padStart(2, '0')}`;
  $('.detail-code').textContent = p.code;
  $('#detail-name').textContent = p.name;
  $('.detail-price').textContent = formatPrice(p.price);
  $('.detail-desc').textContent = p.desc;
  $('.gift-badge').hidden = !p.gift;
  $('.detail-meta').innerHTML = [
    `Renk: ${p.colorName}`,
    `Beden aralığı: ${p.sizes[0]} – ${p.sizes[p.sizes.length - 1]} yaş`,
    p.line === 'interlok' ? 'İnterlok kumaş, ribanalı bitişler' : 'Yakalı, düğmeli üst · biyeli detaylar',
    ...(p.gift ? ['Göz bandı hediye'] : []),
  ].map((t) => `<li>${t}</li>`).join('');
  $('.sizes').innerHTML = p.sizes.map((s) => `<button data-size="${s}" class="${s === state.size ? 'is-active' : ''}" aria-pressed="${s === state.size}">${s}</button>`).join('');
  $$('.seg button').forEach((b) => b.classList.toggle('is-active', b.dataset.side === state.side));
  drawDetail();
}

function openDetail(id) {
  state.id = id;
  state.side = 'front';
  state.size = null;
  if (detail.hidden) state.lastFocus = document.activeElement;
  fillDetail();
  detail.hidden = false;
  document.body.style.overflow = 'hidden';
  rail?.pause();
  dCanvas.classList.add('drop');
  requestAnimationFrame(() => {
    detail.classList.add('is-open');
    requestAnimationFrame(() => dCanvas.classList.remove('drop'));
  });
  $('.detail-close').focus({ preventScroll: true });
}

function closeDetail() {
  detail.classList.remove('is-open');
  document.body.style.overflow = '';
  rail?.resume();
  setTimeout(() => { detail.hidden = true; }, 300);
  state.lastFocus?.focus?.({ preventScroll: true });
}

function step(d) {
  const i = PRODUCTS.findIndex((p) => p.id === state.id);
  const n = PRODUCTS[(i + d + PRODUCTS.length) % PRODUCTS.length];
  state.id = n.id;
  state.size = null;
  state.side = 'front';
  dCanvas.classList.add('drop');
  fillDetail();
  requestAnimationFrame(() => requestAnimationFrame(() => dCanvas.classList.remove('drop')));
}

$('.detail-close').addEventListener('click', closeDetail);
$('.detail-nav.prev').addEventListener('click', () => step(-1));
$('.detail-nav.next').addEventListener('click', () => step(1));
$$('.seg button').forEach((b) => b.addEventListener('click', () => {
  state.side = b.dataset.side;
  $$('.seg button').forEach((x) => x.classList.toggle('is-active', x === b));
  drawDetail();
}));
$('.sizes').addEventListener('click', (e) => {
  const b = e.target.closest('button');
  if (!b) return;
  state.size = b.dataset.size;
  $$('.sizes button').forEach((x) => {
    const on = x === b;
    x.classList.toggle('is-active', on);
    x.setAttribute('aria-pressed', on);
  });
});
$('.add').addEventListener('click', () => {
  if (!state.size) {
    const s = $('.sizes');
    s.classList.remove('shake');
    void s.offsetWidth;
    s.classList.add('shake');
    toast('Lütfen bir yaş/beden seçin.');
    return;
  }
  cart.add(state.id, state.size);
  flyToCart(dCanvas);
  toast(`${byId(state.id).name} (${sizeLabel(state.size)}) sepete eklendi.`);
});

addEventListener('keydown', (e) => {
  if (!detail.hidden) {
    if (e.key === 'Escape') closeDetail();
    if (e.key === 'ArrowRight') step(1);
    if (e.key === 'ArrowLeft') step(-1);
  } else if (e.key === 'Escape' && cartEl.classList.contains('is-open')) {
    toggleCart(false);
  }
});

function flyToCart(fromEl) {
  const target = $('.cart-btn').getBoundingClientRect();
  const r = fromEl.getBoundingClientRect();
  const img = document.createElement('img');
  img.src = thumb(byId(state.id), 0.4);
  img.className = 'fly';
  const w = r.width * 0.5;
  const h = r.height * 0.5;
  Object.assign(img.style, { left: `${r.left + r.width / 4}px`, top: `${r.top + r.height / 6}px`, width: `${w}px`, height: `${h}px` });
  document.body.append(img);
  const dx = target.left + target.width / 2 - (r.left + r.width / 4 + w / 2);
  const dy = target.top + target.height / 2 - (r.top + r.height / 6 + h / 2);
  const anim = img.animate([
    { transform: 'translate(0,0) scale(1) rotate(0)', opacity: 1 },
    { transform: `translate(${dx * 0.55}px, ${dy * 0.35 - 80}px) scale(.45) rotate(-8deg)`, opacity: 1, offset: 0.55 },
    { transform: `translate(${dx}px, ${dy}px) scale(.06) rotate(8deg)`, opacity: 0.4 },
  ], { duration: 850, easing: 'cubic-bezier(.5,0,.3,1)' });
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
        return `<div class="line">
          <img src="${p.image || thumb(p, 0.4)}" alt="">
          <div>
            <h3>${p.name}</h3>
            <p>${p.code} · ${sizeLabel(x.size)} · ${formatPrice(p.price)}</p>
            <span class="qty"><button data-i="${i}" data-d="-1" aria-label="Azalt">−</button><span>${x.qty}</span><button data-i="${i}" data-d="1" aria-label="Arttır">+</button></span>
            <button class="remove" data-i="${i}" aria-label="Kaldır"><svg viewBox="0 0 24 24"><path d="M5 7h14M10 7V5h4v2M7 7l1 12h8l1-12"/></svg></button>
          </div>
          <span class="total">${formatPrice(p.price * x.qty)}</span>
        </div>`;
      }).join('')
      : '<p class="cart-empty">Sepetiniz boş. Raftan bir pijama seçin.</p>';
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
