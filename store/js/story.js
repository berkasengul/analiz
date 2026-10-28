// Ürün sahneleri: aşağı kaydırdıkça bir sonraki model kayarak gelir,
// arka plan o ürünün rengine geçer.
import { formatPrice } from './products.js';
import { createModels3D } from './models3d.js';

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (t) => { t = clamp(t); return t * t * (3 - 2 * t); };
const LOGO = ['#79c3f6', '#f59bd6', '#f9a25c', '#ffd45c'];
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
      <p class="panel-no"><b>${pad2(i + 1)}</b> / ${pad2(N)} · ${p.code}</p>
      <h2>${a}${b ? `<br> <em>${b}</em>` : ''}</h2>
      <p class="panel-desc">${p.desc}</p>
      <div class="panel-row">
        <strong>${formatPrice(p.price)}</strong>
        <span>${p.sizes[0].split('-')[0]}–${p.sizes[p.sizes.length - 1].split('-')[1]} yaş</span>
        <span>${p.colorName}</span>
      </div>
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
  const m3d = createModels3D($('.models3d'), products);
  if (m3d) {
    root.classList.add('is-3d');
    $('.tags3d').innerHTML = products.map((p, i) => TAGS.map((t) => `<span class="tag" data-i="${i}" data-k="${t.key}"><i></i>${t.label}</span>`).join('')).join('');
  }
  const tags3d = m3d ? [...$('.tags3d').children] : [];
  const drag = { on: false, x: 0, rot: 0, vel: 0 };
  const mouse = { x: 0, y: 0, sx: 0, sy: 0 };
  const cv = $('.models3d');
  cv.addEventListener('pointerdown', (e) => { drag.on = true; drag.x = e.clientX; drag.moved = 0; cv.setPointerCapture(e.pointerId); });
  cv.addEventListener('pointermove', (e) => {
    if (e.pointerType === 'mouse') { mouse.x = e.clientX / vw - 0.5; mouse.y = e.clientY / vh - 0.5; }
    if (!drag.on) return;
    const dx = e.clientX - drag.x;
    drag.x = e.clientX;
    drag.moved += Math.abs(dx);
    drag.rot = clamp(drag.rot + dx * 0.008, -1.1, 1.1);
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
  function goTo(i) {
    window.scrollTo({ top: root.offsetTop + (i / (N - 1)) * span() + 1, behavior: reduced ? 'auto' : 'smooth' });
  }

  // Durunca en yakın ürüne yumuşakça otur
  let snapTimer;
  let lastScroll = 0;
  addEventListener('scroll', () => {
    lastScroll = performance.now();
    clearTimeout(snapTimer);
    snapTimer = setTimeout(() => {
      const r = root.getBoundingClientRect();
      if (r.top > 0 || r.bottom < vh) return;
      const c = progress() * (N - 1);
      const d = Math.round(c) - c;
      if (Math.abs(d) > 0.02 && Math.abs(d) < 0.45) goTo(Math.round(c));
    }, 260);
  }, { passive: true });

  /* ---------- Konfeti / ışık ---------- */
  let bits = [];
  let cloud = null;
  const dpr = Math.min(devicePixelRatio || 1, 2);
  function resize() {
    vw = innerWidth;
    vh = innerHeight;
    portrait = vw / vh < 0.9;
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
    const t = (now - t0) / 1000;
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    const prog = progress();
    const target = prog * (N - 1);
    shown += (target - shown) * (reduced ? 1 : 1 - Math.exp(-dt * 7.5));
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

    const cx = portrait ? 0.5 : 0.63;
    mouse.sx += (mouse.x - mouse.sx) * 0.06;
    mouse.sy += (mouse.y - mouse.sy) * 0.06;
    if (!drag.on) drag.rot *= 0.93;
    const states = [];
    products.forEach((p, i) => {
      const d = c - i;
      const u = smooth((Math.abs(d) - 0.1) / 0.8);
      const dir = Math.sign(d) || 0;
      const vis = 1 - u;
      if (m3d) {
        const idle = reduced ? 0 : Math.sin(t * 0.6 + i) * 0.18;
        const cur = Math.abs(d) < 0.5;
        states.push({
          x: cx - dir * u * (portrait ? 0.6 : 0.34),
          floor: portrait ? 0.72 : 0.9,
          height: portrait ? 0.56 : 0.76,
          rotY: dir * u * 1.1 + idle + (cur ? drag.rot + mouse.sx * 0.5 : 0),
          rotX: cur ? mouse.sy * 0.08 : 0,
          scale: 1 - u * 0.16,
          opacity: vis,
        });
      }
      const m = models[i];
      if (m3d) { m.style.visibility = 'hidden'; } else {
      m.style.opacity = vis.toFixed(3);
      m.style.visibility = vis < 0.01 ? 'hidden' : 'visible';
      const bob = reduced ? 0 : Math.sin(t * 1.2 + i) * 3;
      m.style.transform = `translate3d(calc(${(cx * 100).toFixed(2)}vw - 50% + ${(-dir * u * (portrait ? 60 : 34)).toFixed(2)}vw), ${bob.toFixed(1)}px, 0) rotateY(${(dir * u * 22).toFixed(1)}deg) scale(${(1 - u * 0.16).toFixed(3)})`;
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
    if (m3d) {
      m3d.render(states);
      const settle = clamp(1 - Math.abs(c - a) * 5);
      tags3d.forEach((tg) => {
        const i = Number(tg.dataset.i);
        if (i !== a || settle < 0.05) { tg.style.opacity = 0; return; }
        const [x, y] = products[i].spots[tg.dataset.k];
        const pt = m3d.project(i, x, y);
        if (!pt) { tg.style.opacity = 0; return; }
        tg.classList.toggle('left', x < 0.5);
        tg.style.opacity = settle.toFixed(3);
        tg.style.transform = `translate(${pt.x.toFixed(1)}px, ${pt.y.toFixed(1)}px)`;
      });
    }
    if (a !== active) {
      active = a;
      rails.forEach((r, k) => r.classList.toggle('is-active', k === a));
      hooks.onProduct?.(products[a]);
    }
    $('.intro').style.opacity = clamp(1 - c * 2.2).toFixed(3);
    $('.floor').style.opacity = (1 - Math.abs(c - a) * 1.2).toFixed(3);
    drawSky(t, prog);
  }

  addEventListener('resize', resize);
  resize();
  requestAnimationFrame(frame);

  return {
    goTo,
    setProduct: (id) => goTo(products.findIndex((p) => p.id === id)),
    next(d = 1) { goTo(clamp(Math.round(progress() * (N - 1)) + d, 0, N - 1)); },
    get product() { return products[Math.max(0, active)]; },
  };
}
