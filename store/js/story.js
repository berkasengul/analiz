// Ürün sahneleri: aşağı kaydırdıkça bir sonraki model kayarak gelir,
// arka plan o ürünün rengine geçer.
import { formatPrice } from './products.js';
import { createFigures } from './figure3d.js';

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (t) => { t = clamp(t); return t * t * (3 - 2 * t); };
const LOGO = ['#79c3f6', '#f59bd6', '#f9a25c', '#ffd45c'];
// Etiketin yüksekliğinde figürün yarım genişliği (boyun oranı): yazı bunun dışına konur
const EDGE = { baski: 0.2, desen: 0.15, manset: 0.13 };
const TAGS = [
  { key: 'baski', label: 'Ön baskı' },
  { key: 'desen', label: 'Desenli alt' },
  { key: 'manset', label: 'Manşetli paça' },
];

const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
const rgb = (c) => `rgb(${c[0]},${c[1]},${c[2]})`;
const WHITE = [255, 255, 255];
const INK = [43, 47, 107];

export function createStory(root, products, hooks = {}) {
  const $ = (s) => root.querySelector(s);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const N = products.length;
  root.style.height = `${Math.max(600, N * 75 + 100)}vh`; // ürün başına yaklaşık bir ekran kaydırma
  const pin = $('.story-pin');
  const canvas = $('.sky');
  const ctx = canvas.getContext('2d');
  const pad2 = (n) => String(n).padStart(2, '0');
  const split = (name) => {
    const m = name.match(/^(.*)\s(Takımı|Takım)$/);
    return m ? [m[1], m[2]] : [name, ''];
  };

  // Paletler: her ürün için açık, orta ve koyu ton
  const pal = products.map((p) => {
    const a = hex(p.accent);
    return { light: mix(a, WHITE, 0.78), mid: mix(a, WHITE, 0.42), deep: mix(mix(a, INK, 0.12), WHITE, 0.08), acc: a };
  });

  /* ---------- İşaretleme ---------- */
  $('.names').innerHTML = products.map((p) => `<span>${split(p.name)[0]}</span>`).join('');
  $('.models').innerHTML = products.map((p) => `
    <figure class="model">
      <img src="${p.image}" alt="${p.name} pijama takımı" decoding="async" ${p === products[0] ? '' : 'loading="lazy"'}>
      ${TAGS.map((t) => `<span class="tag" data-k="${t.key}"><i></i>${t.label}</span>`).join('')}
    </figure>`).join('');
  $('.panels').innerHTML = products.map((p, i) => {
    const [a, b] = split(p.name);
    return `
    <article class="panel">
      <h2>${a}${b ? `<br> <em>${b}</em>` : ''}</h2>
      <p class="panel-desc">${p.desc}</p>
      <div class="panel-row">
        <strong>${formatPrice(p.price)}</strong>
        <span>${p.code}</span>
        <span>${p.sizes[0].split('-')[0]}–${p.sizes[p.sizes.length - 1].split('-')[1]} yaş</span>
      </div>
      <p class="panel-no" aria-label="${i + 1}. takım, toplam ${N}"><b>${pad2(i + 1)}</b> / ${pad2(N)}</p>
      <button class="btn btn-ink" data-open="${p.id}">İncele ve beden seç</button>
    </article>`;
  }).join('');
  $('.rail').innerHTML = products.map((p, i) => `
    <button data-go="${i}" style="--c:${p.accent}"><b>${pad2(i + 1)}</b><span>${split(p.name)[0]}</span></button>`).join('');
  $('.bar').innerHTML = products.map(() => '<i><b></b></i>').join('');

  const names = [...$('.names').children];
  const models = [...$('.models').children];
  const panels = [...$('.panels').children];
  const rails = [...$('.rail').children];
  const bars = [...$('.bar').children].map((el) => el.firstElementChild);
  const imgs = models.map((m) => m.querySelector('img'));

  // 3D katman (WebGL yoksa düz fotoğraflar kullanılır)
  const m3d = createFigures($('.models3d'), products);
  if (m3d) {
    root.classList.add('is-3d');
    $('.tags3d').innerHTML = products.map((p, i) => TAGS.map((t) => `<button type="button" class="tag" data-i="${i}" data-k="${t.key}" aria-label="${t.label}: yakınlaştır"><i></i>${t.label}</button>`).join('')).join('');
  }
  const tags3d = m3d ? [...$('.tags3d').children] : [];
  const drag = { on: false, x: 0, rot: 0, vel: 0, last: 0 };
  // Etikete basınca o bölgeye yakınlaşma: model tam karşıya döner, kamera bölgeye süzülür
  const focus = { on: false, i: -1, key: null, amt: 0 };
  const back = $('.focus-back');
  function setFocus(i, key) {
    Object.assign(focus, { on: true, i, key });
    drag.vel = 0; // model en yakın ön görünüme yumuşakça döner (frame içinde)
    root.classList.add('is-focus');
    back.hidden = false;
  }
  function unfocus() {
    if (!focus.on) return false;
    focus.on = false;
    root.classList.remove('is-focus');
    back.hidden = true;
    return true;
  }
  back.addEventListener('click', unfocus);
  $('.tags3d').addEventListener('click', (e) => {
    const tg = e.target.closest('.tag');
    if (!tg) return;
    if (focus.on && focus.key === tg.dataset.k) unfocus();
    else setFocus(Number(tg.dataset.i), tg.dataset.k);
  });
  let settledAt = 0;
  const TURN_SPEED = (Math.PI * 2) / 14; // rad/sn
  const turn = { v: 0 };
  const turnA = products.map(() => 0);
  let prevActive = -1;
  const mouse = { x: 0, y: 0, sx: 0, sy: 0 };
  const cv = $('.models3d');
  cv.addEventListener('pointerdown', (e) => { if (unfocus()) return; drag.last = performance.now(); drag.on = true; drag.x = e.clientX; drag.moved = 0; cv.setPointerCapture(e.pointerId); });
  cv.addEventListener('pointermove', (e) => {
    if (e.pointerType === 'mouse') { mouse.x = e.clientX / vw - 0.5; mouse.y = e.clientY / vh - 0.5; }
    if (!drag.on) return;
    const dx = e.clientX - drag.x;
    drag.x = e.clientX;
    drag.moved += Math.abs(dx);
    drag.last = performance.now();
    drag.rot += dx * 0.012;
  });
  const end = (e) => {
    if (!drag.on) return;
    drag.on = false;
    if (drag.moved < 6 && m3d) {
      const i = m3d.pick(e.clientX, e.clientY);
      if (i >= 0) hooks.onOpen?.(products[i]);
    }
  };
  cv.addEventListener('pointerup', end);
  cv.addEventListener('pointercancel', () => { drag.on = false; });
  cv.addEventListener('pointerleave', () => { mouse.x = 0; mouse.y = 0; });

  root.addEventListener('click', (e) => {
    const o = e.target.closest('[data-open]');
    if (o) hooks.onOpen?.(products.find((p) => p.id === o.dataset.open));
    const g = e.target.closest('[data-go]');
    if (g) goTo(Number(g.dataset.go));
    const m = e.target.closest('.model img');
    if (m) hooks.onOpen?.(products[imgs.indexOf(m)]);
  });

  /* ---------- Etiketleri fotoğrafa yerleştir ---------- */
  function placeTags(i) {
    const img = imgs[i];
    if (!img.naturalWidth) return;
    const w = img.offsetWidth;
    const h = img.offsetHeight;
    models[i].querySelectorAll('.tag').forEach((t) => {
      const [x, y] = products[i].spots[t.dataset.k];
      const left = x < 0.5;
      t.classList.toggle('left', left);
      t.style.left = `${(img.offsetLeft + x * w).toFixed(1)}px`;
      t.style.top = `${(y * h).toFixed(1)}px`;
    });
  }
  imgs.forEach((img, i) => { img.onload = () => placeTags(i); if (img.complete) placeTags(i); });

  /* ---------- Kaydırma ---------- */
  let vw = innerWidth;
  let vh = innerHeight;
  let portrait = vw / vh < 0.9;
  const span = () => root.offsetHeight - vh;
  const progress = () => (span() > 0 ? clamp((scrollY - root.offsetTop) / span()) : 0);
  // Tek hareket = tek ürün: kaydırma kendi yumuşak animasyonumuzla, ürünün tam üstünde durur
  const easeIO = (x) => (x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2);
  let anim = null;
  const posOf = (i) => root.offsetTop + (i / (N - 1)) * span();
  const index = () => Math.round(progress() * (N - 1));
  function goTo(i, dur = 1150) {
    i = clamp(i, 0, N - 1);
    const from = scrollY;
    const to = posOf(i);
    if (anim) cancelAnimationFrame(anim.raf);
    if (reduced || Math.abs(to - from) < 2) { window.scrollTo(0, to); anim = null; return; }
    const t0 = performance.now();
    anim = { to, raf: 0 };
    const step = (now) => {
      const k = Math.min(1, (now - t0) / dur);
      window.scrollTo(0, from + (to - from) * easeIO(k));
      if (k < 1) anim.raf = requestAnimationFrame(step);
      else { anim = null; unlockAt = performance.now() + 120; }
    };
    anim.raf = requestAnimationFrame(step);
  }
  const pinned = () => {
    const r = root.getBoundingClientRect();
    return r.top <= 1 && r.bottom >= vh - 1;
  };
  let unlockAt = 0;
  let lastWheel = 0;
  // Bir adım at; vitrinin başı/sonundaysa sayfanın normal kaydırılmasına izin ver
  function stepBy(dir) {
    if (unfocus()) return true; // yakınken ilk hareket tam görünüme döndürür
    const i = index();
    if ((dir > 0 && i >= N - 1) || (dir < 0 && i <= 0)) return false;
    goTo(i + dir);
    return true;
  }
  // Sepet, ürün detayı ya da sohbet açıkken (veya imleç onların üstündeyken) vitrin kaydırmayı yakalamaz
  const elsewhere = (e) => document.documentElement.dataset.modal || e.target.closest?.('.cart, .chat, .detail');
  addEventListener('wheel', (e) => {
    if (elsewhere(e) || !pinned() || Math.abs(e.deltaY) < 2) return;
    const now = performance.now();
    const quietGap = now - lastWheel;
    lastWheel = now;
    const dir = Math.sign(e.deltaY);
    const i = index();
    if (!anim && !focus.on && ((dir > 0 && i >= N - 1) || (dir < 0 && i <= 0))) return; // dışarı çıkış serbest
    e.preventDefault();
    // Dokunmatik yüzeyin ataletli olaylarını tek harekete say: animasyon bitip olaylar dinene kadar bekle
    if (anim || now < unlockAt || quietGap < 160) { if (!anim) unlockAt = now + 160; return; }
    stepBy(dir);
  }, { passive: false });

  let touchY = null;
  addEventListener('touchstart', (e) => { touchY = pinned() && !elsewhere(e) ? e.touches[0].clientY : null; }, { passive: true });
  addEventListener('touchmove', (e) => {
    if (touchY === null) return;
    const dy = touchY - e.touches[0].clientY;
    const i = index();
    if (!anim && !focus.on && ((dy > 0 && i >= N - 1) || (dy < 0 && i <= 0))) { touchY = null; return; }
    e.preventDefault();
  }, { passive: false });
  addEventListener('touchend', (e) => {
    if (touchY === null) return;
    const dy = touchY - (e.changedTouches[0]?.clientY ?? touchY);
    touchY = null;
    if (!anim && Math.abs(dy) > 30) stepBy(Math.sign(dy));
  }, { passive: true });

  addEventListener('keydown', (e) => {
    if (!pinned() || elsewhere(e) || e.target.closest?.('input, textarea, select, [contenteditable]')) return;
    if (!document.querySelector('.detail')?.hidden) return;
    if (e.key === 'Escape' && unfocus()) { e.preventDefault(); return; }
    const map = { ArrowDown: 1, PageDown: 1, ' ': 1, ArrowUp: -1, PageUp: -1 };
    const dir = map[e.key] ?? (e.key === ' ' && e.shiftKey ? -1 : 0);
    if (!dir || anim) { if (dir) e.preventDefault(); return; }
    if (stepBy(e.shiftKey && e.key === ' ' ? -1 : dir)) e.preventDefault();
  });

  // Kaydırma çubuğuyla sürüklenip bırakılırsa en yakın ürüne otur
  let snapTimer;
  addEventListener('scroll', () => {
    if (anim) return;
    clearTimeout(snapTimer);
    snapTimer = setTimeout(() => {
      if (anim || !pinned()) return;
      const c = progress() * (N - 1);
      if (Math.abs(Math.round(c) - c) > 0.01) goTo(Math.round(c), 700);
    }, 220);
  }, { passive: true });

  /* ---------- Konfeti / ışık ---------- */
  let bits = [];
  let cloud = null;
  const dpr = Math.min(devicePixelRatio || 1, 2);
  // Kadraj sınırları gerçek yerleşimden ölçülür: başın tepesi menünün (mobilde giriş başlığının)
  // hemen altına, kaidenin alt kenarı ilerleme çubuğunun (mobilde ürün kartının) hemen üstüne.
  const frameBox = { top: 0.14, bottom: 0.94, maxHalf: 0 };
  function measure() {
    const hdr = document.querySelector('.site-header')?.getBoundingClientRect().bottom || 100;
    if (portrait) {
      const intro = $('.intro').getBoundingClientRect();
      const tallest = Math.max(...panels.map((p) => p.offsetHeight));
      const panelTop = vh - parseFloat(getComputedStyle($('.panels')).bottom || '44') - tallest;
      frameBox.top = (Math.max(hdr, intro.bottom) + 10) / vh;
      frameBox.bottom = (panelTop - 12) / vh;
      frameBox.maxHalf = vw * 0.47;
    } else {
      const card = $('.panels').getBoundingClientRect();
      // Menü kapsülleri modelin baş sütununu kesmiyorsa baş, duyuru bandının altına kadar çıkabilir
      const mx = cx() * vw;
      const half = Math.max(90, vw * 0.06);
      const pills = [...document.querySelectorAll('.nav > .logo, .nav > .menu, .nav > .actions')].map((el) => el.getBoundingClientRect());
      const blocked = pills.some((r) => r.right > mx - half && r.left < mx + half);
      const band = document.querySelector('.marquee')?.getBoundingClientRect().bottom || 0;
      frameBox.top = ((blocked ? hdr : band) + 12) / vh;
      frameBox.bottom = ($('.bar').getBoundingClientRect().top - 6) / vh;
      frameBox.maxHalf = Math.min(cx() * vw - card.right - 16, vw * 0.3);
    }
  }
  const cx = () => (portrait ? 0.5 : 0.57);
  function resize() {
    vw = innerWidth;
    vh = innerHeight;
    portrait = vw / vh < 0.9;
    measure();
    canvas.width = vw * dpr;
    canvas.height = vh * dpr;
    const n = Math.round((vw * vh) / 26000);
    bits = Array.from({ length: n }, (_, k) => ({
      x: Math.random(), y: Math.random(), s: 3 + Math.random() * 7, v: 0.00012 + Math.random() * 0.00035,
      r: Math.random() * 6.28, vr: (Math.random() - 0.5) * 0.02, c: LOGO[k % LOGO.length], shape: k % 3, ph: Math.random() * 6.28,
    }));
    // Alt bulut şeridi (bir kez çizilir)
    const sw = Math.round(Math.max(vw, 900));
    const sh = Math.round(vh * 0.3);
    const pad = 60; // bulanıklık kenarda soluklaşmasın diye fazladan alan
    const c = document.createElement('canvas');
    c.width = (sw + pad * 2) * dpr;
    c.height = sh * dpr;
    c.pad = pad;
    c.sw = sw;
    const x = c.getContext('2d');
    x.scale(dpr, dpr);
    x.translate(pad, 0);
    x.filter = 'blur(16px)';
    x.fillStyle = '#fff';
    const puff = (cx, cy, w, al) => {
      x.globalAlpha = al;
      for (let k = 0; k < 7; k++) {
        x.beginPath();
        x.arc(cx + (k - 3) * w * 0.16, cy - Math.sin((k / 6) * Math.PI) * w * 0.1, w * (0.1 + Math.sin((k / 6) * Math.PI) * 0.06), 0, 7);
        x.fill();
      }
    };
    // Kenarlar dikişsiz birleşsin diye her bulut iki yana da çizilir
    for (const shift of [-sw, 0, sw]) {
      for (let i = 0; i < 4; i++) puff(shift + i * sw * 0.25, sh * 0.75, sw * 0.36, 0.45);
      for (let i = 0; i < 4; i++) puff(shift + i * sw * 0.25 + sw * 0.125, sh * 1.0, sw * 0.34, 0.75);
    }
    cloud = c;
    imgs.forEach((_, i) => placeTags(i));
    m3d?.resize(vw, vh);
  }

  const GOLD = [
    { dx: -0.2, dy: 0.17, r: 0.022, ph: 0 },
    { dx: 0.2, dy: 0.28, r: 0.016, ph: 1.3 },
    { dx: -0.19, dy: 0.7, r: 0.018, ph: 2.1 },
    { dx: 0.16, dy: 0.6, r: 0.02, ph: 3.4 },
    { dx: 0.24, dy: 0.72, r: 0.026, ph: 4.2 },
    { dx: -0.26, dy: 0.46, r: 0.012, ph: 5.1 },
  ];
  function star(x, y, r) {
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const rr = i % 2 ? r * 0.45 : r;
      const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
      ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
    }
    ctx.closePath();
    ctx.fill();
  }

  function drawSky(t, prog) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, vw, vh);
    // Modelin çevresinde süzülen büyük altın yıldızlar (figürün silüetinin dışında kalır)
    const cxs = cx();
    for (const g of GOLD) {
      const x = (cxs + g.dx * (portrait ? 1.65 : 1)) * vw;
      const y = (g.dy + (reduced ? 0 : Math.sin(t * 0.8 + g.ph) * 0.012) - prog * 0.04) * vh;
      const r = g.r * Math.min(vw, vh) * (portrait ? 0.8 : 1);
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(Math.sin(t * 0.5 + g.ph) * 0.25);
      ctx.globalAlpha = 0.95;
      ctx.shadowColor = 'rgba(160, 90, 0, .35)';
      ctx.shadowOffsetY = r * 0.18;
      ctx.shadowBlur = r * 0.5;
      const gr = ctx.createLinearGradient(-r, -r, r, r);
      gr.addColorStop(0, '#fff3b8');
      gr.addColorStop(0.45, '#ffd45c');
      gr.addColorStop(1, '#f0a020');
      ctx.fillStyle = gr;
      ctx.beginPath();
      for (let i = 0; i < 10; i++) {
        const rr = i % 2 ? r * 0.48 : r;
        const a2 = (i / 10) * Math.PI * 2 - Math.PI / 2;
        ctx.lineTo(Math.cos(a2) * rr, Math.sin(a2) * rr);
      }
      ctx.closePath();
      ctx.lineJoin = 'round';
      ctx.lineWidth = r * 0.22;
      ctx.strokeStyle = gr;
      ctx.stroke();
      ctx.fill();
      ctx.shadowColor = 'transparent';
      ctx.fillStyle = 'rgba(255,255,255,.55)';
      ctx.beginPath();
      ctx.ellipse(-r * 0.22, -r * 0.3, r * 0.18, r * 0.09, -0.6, 0, 7);
      ctx.fill();
      ctx.restore();
    }
    for (const b of bits) {
      if (!reduced) { b.y -= b.v; b.r += b.vr; }
      if (b.y < -0.05) { b.y = 1.05; b.x = Math.random(); }
      const x = (b.x + Math.sin(t * 0.4 + b.ph) * 0.01) * vw;
      const y = ((b.y + prog * 0.25) % 1.1) * vh;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(b.r);
      ctx.globalAlpha = 0.75;
      ctx.fillStyle = b.c;
      if (b.shape === 0) star(0, 0, b.s);
      else if (b.shape === 1) { ctx.beginPath(); ctx.roundRect(-b.s * 0.9, -b.s * 0.35, b.s * 1.8, b.s * 0.7, b.s * 0.35); ctx.fill(); }
      else { ctx.beginPath(); ctx.arc(0, 0, b.s * 0.5, 0, 7); ctx.fill(); }
      ctx.restore();
    }
    if (cloud) {
      const sw = cloud.sw;
      const sh = cloud.height / dpr;
      const off = (prog * 400 + t * 10) % sw;
      ctx.globalAlpha = 1;
      for (let x = -Math.round(off); x < vw; x += sw) ctx.drawImage(cloud, cloud.pad * dpr, 0, sw * dpr, cloud.height, x, vh - sh, sw, sh);
    }
  }

  /* ---------- Ana döngü ---------- */
  let shown = 0;
  let active = -1;
  const t0 = performance.now();
  let last = t0;
  function frame(now) {
    requestAnimationFrame(frame);
    if (document.documentElement.dataset.modal) { last = now; return; }
    // Bazı mobil tarayıcılar ilk ölçümden sonra genişliği resize olayı olmadan düzeltir
    if (innerWidth !== vw) resize();
    const t = (now - t0) / 1000;
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    const prog = progress();
    const target = prog * (N - 1);
    shown += (target - shown) * (reduced ? 1 : 1 - Math.exp(-dt * 9));
    const c = shown;

    // Arka plan rengi iki ürün arasında akar
    const i0 = Math.min(N - 2, Math.floor(c));
    const f = smooth((c - i0 - 0.15) / 0.7);
    const A = pal[i0];
    const B = pal[i0 + 1];
    pin.style.setProperty('--bg-light', rgb(mix(A.light, B.light, f)));
    pin.style.setProperty('--bg-mid', rgb(mix(A.mid, B.mid, f)));
    pin.style.setProperty('--bg-deep', rgb(mix(A.deep, B.deep, f)));
    pin.style.setProperty('--acc', rgb(mix(A.acc, B.acc, f)));
    pin.style.setProperty('--acc-ink', rgb(mix(mix(A.acc, B.acc, f), INK, 0.42)));

    const cxv = cx();
    mouse.sx += (mouse.x - mouse.sx) * 0.025;
    mouse.sy += (mouse.y - mouse.sy) * 0.06;
    // Otomatik tam tur: ürün yerine oturunca kısa bir an karşıdan durur, sonra sabit ve yavaş
    // hızla döner (yaklaşık 14 sn'de bir tur). Sürüklerken durur, bırakınca kaldığı yerden sürer;
    // etikete yakınlaşırken en yakın ön görünüme döner.
    if (active >= 0) {
      const go = !reduced && !focus.on && !drag.on && t - settledAt > 1.6 && now - drag.last > 1200;
      turn.v += ((go ? TURN_SPEED : 0) - turn.v) * (1 - Math.exp(-dt * 1.4));
      turnA[active] += turn.v * dt;
      if (focus.on) {
        const total = turnA[active] + drag.rot;
        turnA[active] += (Math.round(total / (Math.PI * 2)) * Math.PI * 2 - total) * (1 - Math.exp(-dt * 5));
      }
    }
    const states = [];
    products.forEach((p, i) => {
      const d = c - i;
      const u = smooth((Math.abs(d) - 0.1) / 0.8);
      const dir = Math.sign(d) || 0;
      const vis = 1 - u;
      if (m3d) {
        // Sakin, akıcı sağa-sola salınım; ilk açılışta tam bir tur dönerek sahneye girer
        const calm = 1 - focus.amt; // yakınlaşırken model kıpırdamaz
        const intro = reduced ? 1 : Math.min(1, t / 3.4);
        const ease = intro < 0.5 ? 4 * intro ** 3 : 1 - (-2 * intro + 2) ** 3 / 2; // yavaş başla, yavaş bitir
        // Açılışta tam tur dönüş yok: ön kare önceden indirildiği için model anında, karşıdan görünür
        const entrance = 0;
        const cur = Math.abs(d) < 0.5;
        states.push({
          x: cxv - dir * u * (portrait ? 0.7 : 0.42),
          top: frameBox.top,
          bottom: frameBox.bottom,
          maxHalf: frameBox.maxHalf,
          rotY: -dir * u * 0.7 + turnA[i] + entrance + (cur ? drag.rot + mouse.sx * 0.12 * calm : 0),
          rotX: cur ? mouse.sy * 0.06 * calm : 0,
          scale: (1 - u * 0.25) * (i === 0 ? 0.9 + ease * 0.1 : 1),
          opacity: vis,
        });
      }
      const m = models[i];
      if (m3d) { m.style.visibility = 'hidden'; } else {
      m.style.opacity = vis.toFixed(3);
      m.style.visibility = vis < 0.01 ? 'hidden' : 'visible';
      const bob = reduced ? 0 : Math.sin(t * 1.2 + i) * 3;
      m.style.transform = `translate3d(calc(${(cxv * 100).toFixed(2)}vw - 50% + ${(-dir * u * (portrait ? 60 : 34)).toFixed(2)}vw), ${bob.toFixed(1)}px, 0) rotateY(${(dir * u * 22).toFixed(1)}deg) scale(${(1 - u * 0.16).toFixed(3)})`;
      m.style.filter = u > 0.01 ? `blur(${(u * 6).toFixed(1)}px)` : 'none';
      m.classList.toggle('is-current', Math.abs(d) < 0.25);
      }

      const nv = clamp(1 - Math.abs(d) * 1.6);
      names[i].style.opacity = nv.toFixed(3);
      names[i].style.transform = `translate(-50%, -50%) translateX(${(-d * 18).toFixed(2)}vw)`;

      const pv = clamp(1 - Math.abs(d) * 2.6);
      panels[i].style.opacity = pv.toFixed(3);
      panels[i].style.transform = `translateY(${(d * -50).toFixed(1)}px)`;
      panels[i].inert = pv < 0.5;
      bars[i].style.transform = `scaleX(${clamp(c - i + 1).toFixed(3)})`;
    });

    const a = Math.round(c);
    if (focus.on && focus.i !== a) unfocus(); // başka ürüne geçildiyse
    focus.amt += ((focus.on ? 1 : 0) - focus.amt) * (reduced ? 1 : 1 - Math.exp(-dt * 4.5));
    if (focus.amt < 0.001) focus.amt = 0;
    if (m3d) {
      m3d.render(states, t, focus.amt > 0 ? { i: focus.i, key: focus.key, amt: focus.amt, sx: cx(), sy: portrait ? 0.4 : 0.5 } : null);
      const settle = clamp(1 - Math.abs(c - a) * 5);
      tags3d.forEach((tg) => {
        const i = Number(tg.dataset.i);
        if (i !== a || settle < 0.05 || focus.amt > 0.02) { tg.style.opacity = 0; tg.style.pointerEvents = 'none'; return; }
        const [x, y] = products[i].spots[tg.dataset.k];
        const pt = m3d.project(i, tg.dataset.k);
        if (!pt || pt.facing < 0.35) { tg.style.opacity = 0; tg.style.pointerEvents = 'none'; return; }
        tg.style.pointerEvents = 'auto';
        const left = x < 0.5;
        tg.classList.toggle('left', left);
        // Etiket yazısı figürün silüetinin dışında dursun: nokta detayda, bağlantı çizgisi uzar
        const H = (frameBox.bottom - frameBox.top) * vh * 0.86;
        const edge = cx() * vw + (left ? -1 : 1) * (EDGE[tg.dataset.k] || 0.15) * H;
        let lead = Math.min(180, Math.max(18, left ? pt.x - edge + 10 : edge - pt.x + 10));
        // Dar ekranda yazı ekranın dışına taşmasın
        const tw = Number(tg.dataset.w) || (tg.dataset.w = tg.offsetWidth);
        const room = left ? pt.x - tw - 8 : vw - 8 - tw - pt.x;
        lead = Math.max(12, Math.min(lead, room));
        tg.style.setProperty('--lead', `${lead.toFixed(0)}px`);
        tg.style.opacity = (settle * clamp((pt.facing - 0.35) * 3)).toFixed(3);
        tg.style.transform = `translate(${pt.x.toFixed(1)}px, ${pt.y.toFixed(1)}px)`;
      });
    }
    if (a !== active) {
      active = a;
      settledAt = t;
      // Sıradaki ve önceki ürünü önceden hazırla: geçişte model beklemeden görünsün
      if (m3d) { m3d.warm(a + 1, 'full'); m3d.warm(a - 1, 'front'); m3d.warm(a + 2, 'front'); }
      if (prevActive >= 0) turnA[prevActive] += drag.rot; // giden ürün olduğu açıda kalır
      prevActive = a;
      turnA[a] = 0; // her ürün tam karşıdan açılır
      turn.v = 0;
      drag.rot = 0; // önceki ürünü çevirmek yeni ürüne taşınmasın
      drag.vel = 0;
      rails.forEach((r, k) => r.classList.toggle('is-active', k === a));
      hooks.onProduct?.(products[a]);
    }
    $('.intro').style.opacity = clamp(1 - c * 2.2).toFixed(3);
    $('.floor').style.opacity = (1 - Math.abs(c - a) * 1.2).toFixed(3);
    drawSky(t, prog);
  }

  addEventListener('resize', resize);
  resize();
  // Açılışta ilk ürünü hemen yüklemeye başla; sayfa sakinleşince tüm ürünlerin ön görünümünü hazırla
  if (m3d) {
    m3d.warm(0, 'full');
    m3d.warm(1, 'front');
    const idle = window.requestIdleCallback || ((f) => setTimeout(f, 1500));
    setTimeout(() => idle(() => products.forEach((_, i) => m3d.warm(i, 'fetch'))), 2500);
  }
  document.fonts?.ready.then(measure); // yazı tipleri yüklenince kart ve başlık ölçüleri değişir
  requestAnimationFrame(frame);

  return {
    goTo,
    setProduct: (id) => goTo(products.findIndex((p) => p.id === id)),
    next(d = 1) { goTo(index() + d); },
    get product() { return products[Math.max(0, active)]; },
  };
}
