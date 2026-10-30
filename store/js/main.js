import { PRODUCTS, byId, formatPrice, sizeLabel } from './products.js';
import { renderModel, modelThumb, loadProductImage } from './garments.js';
import { createStory } from './story.js';
import { createLineup, createIcons, createFinale, createViewer } from './scenes.js';
import { createBag } from './bag.js';

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const N = PRODUCTS.length;

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

/* ---------- Sinematik hikâye ---------- */
const stage = $('.story');
const story = createStory(stage, PRODUCTS, {
  onOpen: (p) => openDetail(p.id),
  isBusy: () => !detail.hidden || cartEl.classList.contains('is-open'),
});

/* ---------- Menü, arama ---------- */
$$('[data-scroll]').forEach((a) => a.addEventListener('click', (e) => {
  e.preventDefault();
  window.scrollTo({ top: a.dataset.scroll === 'top' ? 0 : stage.offsetTop, behavior: 'smooth' });
}));
$$('[data-soon]').forEach((a) => a.addEventListener('click', (e) => { e.preventDefault(); toast('Bu sayfa yakında eklenecek.'); }));
$('.footer-news').addEventListener('submit', (e) => {
  e.preventDefault();
  e.target.reset();
  toast('Teşekkürler! Kaydınız alındı (demo, henüz bir listeye bağlı değil).');
});

/* ---------- 3D ikonlar, koleksiyon sahnesi, final ---------- */
createIcons($('.icons3d'), $$('.why-card'));
const lineup = createLineup($('.lineup'), PRODUCTS, { onOpen: (p) => openDetail(p.id), price: formatPrice });
if (!lineup) $('.world-stage').hidden = true;
createFinale($('.finale3d'), PRODUCTS, { onOpen: (p) => openDetail(p.id), price: formatPrice });
const viewer = createViewer($('.detail-3d'), {
  onZoom: (z) => {
    $('.zoom-level').textContent = `${z.toFixed(1).replace('.0', '')}×`;
    $('.zoom-in').disabled = z >= 3.15;
    $('.zoom-out').disabled = z <= 1.01;
    $('.zoom-reset').hidden = z <= 1.01;
    $('.detail').classList.toggle('is-zoomed', z > 1.05);
  },
});
$('.zoom-in').addEventListener('click', () => viewer?.zoom(1.5));
$('.zoom-out').addEventListener('click', () => viewer?.zoom(1 / 1.5));
$('.zoom-reset').addEventListener('click', () => viewer?.reset());
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
  story.setProduct(hit.id);
});

/* ---------- Koleksiyon ---------- */
function renderGrid(filter = 'all') {
  const list = PRODUCTS.filter((p) => filter === 'all' || p.gender === filter);
  $('.grid').innerHTML = list.map((p) => `
    <button class="card" data-id="${p.id}" style="--accent:${p.accent};--tint:${p.tint}">
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
  lineup?.setFilter((p) => f === 'all' || p.gender === f);
}
$$('.chip').forEach((c) => c.addEventListener('click', () => setFilter(c.dataset.filter)));
$('[data-goto="all"]').addEventListener('click', () => {
  setFilter('all');
  document.getElementById('koleksiyon').scrollIntoView({ behavior: 'smooth' });
});
renderGrid();

/* ---------- Ürün detayı ---------- */
const detail = $('.detail');
const dCanvas = $('.detail-canvas');
const state = { id: null, view: '3d', size: null, lastFocus: null };

async function drawDetail() {
  const p = byId(state.id);
  const has3d = !!(p.spin || p.model3d);
  const view = viewer && has3d ? state.view : 'photo';
  detail.dataset.view = view;
  $('.seg').hidden = true;
  if (view === '3d') { viewer.show(p); viewer.start(); return; }
  viewer?.stop();
  const img = await loadProductImage(p);
  const src = img || renderModel(p, 'front', 2);
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
    'Manşetli paçalar, rahat kalıp',
    ...(p.pattern ? [p.line === 'interlok' ? 'İnterlok kumaş, ribanalı yaka ve paçalar' : 'Yakalı, düğmeli üst, biyeli detaylar'] : []),
    ...(p.gift ? ['Uyku göz bandı hediye'] : []),
  ].map((t) => `<li>${t}</li>`).join('');
  $('.sizes').innerHTML = p.sizes.map((s) => `<button data-size="${s}" class="${s === state.size ? 'is-active' : ''}" aria-pressed="${s === state.size}">${s}</button>`).join('');
  $$('.seg button').forEach((b) => b.classList.toggle('is-active', b.dataset.view === state.view));
  drawDetail();
}

function openDetail(id) {
  if (detail.hidden) state.lastFocus = document.activeElement;
  Object.assign(state, { id, view: '3d', size: null });
  bag.reset();
  bag.setProduct(byId(state.id));
  fillDetail();
  detail.hidden = false;
  document.body.style.overflow = 'hidden';
  document.documentElement.dataset.modal = '1';
  requestAnimationFrame(() => detail.classList.add('is-open'));
  $('.detail-close').focus({ preventScroll: true });
}
function closeDetail() {
  detail.classList.remove('is-open');
  document.body.style.overflow = '';
  delete document.documentElement.dataset.modal;
  viewer?.stop();
  setTimeout(() => { detail.hidden = true; }, 300);
  state.lastFocus?.focus?.({ preventScroll: true });
}
function step(d) {
  const i = PRODUCTS.findIndex((p) => p.id === state.id);
  Object.assign(state, { id: PRODUCTS[(i + d + N) % N].id, size: null });
  bag.reset();
  bag.setProduct(byId(state.id));
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
function needSize() {
  const s = $('.sizes');
  s.classList.remove('shake');
  void s.offsetWidth;
  s.classList.add('shake');
  toast('Önce yaş / beden seçin.');
}
function bumpBadge() {
  const b = $('.badge');
  b.classList.remove('bump');
  void b.offsetWidth;
  b.classList.add('bump');
}
// "Çantaya at": tutamacı aşağı kaydırınca model çantaya düşer ve ürün sepete eklenir
const bag = createBag($('.detail-media'), $('.detail-3d'), {
  canStart: () => !!state.size,
  onNeedSize: needSize,
  onComplete: () => {
    const p = byId(state.id);
    cart.add(state.id, state.size);
    bumpBadge();
    // Satışa yönlendirme: sepet özeti ve aynı gruptan iki öneri
    const pool = PRODUCTS.filter((x) => x.id !== p.id && x.gender === p.gender);
    const at = PRODUCTS.indexOf(p);
    const picks = pool.sort((a, b) => ((PRODUCTS.indexOf(a) - at + N) % N) - ((PRODUCTS.indexOf(b) - at + N) % N)).slice(0, 2)
      .map((x) => ({ id: x.id, name: x.name, price: formatPrice(x.price), img: x.image }));
    return { text: `${p.name} · ${sizeLabel(state.size)} · ${formatPrice(p.price)}`, count: cart.count(), total: formatPrice(cart.total()), picks };
  },
  onPick: (id) => openDetail(id),
  onCheckout: () => { closeDetail(); startCheckout(); },
});
$('.add').addEventListener('click', () => {
  if (!state.size) { needSize(); return; }
  if (detail.dataset.view === '3d') { bag.play(); return; }
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
    story.next(e.key === 'ArrowRight' ? 1 : -1);
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

// Siparişi tamamla: sohbet asistanındaki sipariş akışını başlatır (yoksa sepeti açar)
function startCheckout() {
  if (window.sesaChat) window.sesaChat.checkout();
  else toggleCart(true);
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
  if (open) document.documentElement.dataset.modal = '1';
  else if (detail.hidden) delete document.documentElement.dataset.modal;
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
