// Sinematik ürün hikâyesi: kaydırdıkça kamera ürüne yaklaşır, sahneler değişir.
import { SPOTS, formatPrice } from './products.js';

const CH = 5;
const BOX_ASPECT = 0.68; // tüm fotoğrafları içine alan kutu oranı (en / boy)
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (t) => { t = clamp(t); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;
const PASTEL = ['#79c3f6', '#f59bd6', '#f9a25c', '#ffd45c', '#ffffff'];

export function createStory(root, products, hooks = {}) {
  const $ = (s) => root.querySelector(s);
  const $$ = (s) => [...root.querySelectorAll(s)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const cam = $('.cam');
  const layers = $$('.cam-img');
  const spotsEl = $('.spots');
  const canvas = $('.sky');
  const ctx = canvas.getContext('2d');
  const word = $('.wordmark');
  const fog = $('.fog');
  const chaps = $$('.chap');
  const railItems = $$('.rail button');

  let cur = products[0];
  let layer = 0;
  let spotKey = 'desen';
  let holding = false;
  let night = 0;
  let lastInput = performance.now();
  const sizes = new Map(); // ürün → en/boy oranı
  const state = { s: 1, fx: 0.5, fy: 0.5, tx: 0.6, ty: 0.55, ready: false };
  let vw = innerWidth;
  let vh = innerHeight;
  let portrait = vw / vh < 0.9;

  /* ---------- Ürün değiştirme ---------- */
  products.forEach((p) => {
    const im = new Image();
    im.onload = () => {
      sizes.set(p.id, im.naturalWidth / im.naturalHeight);
      if (p === cur) placeSpots();
    };
    im.src = p.image;
  });

  function aspectOf(p) { return sizes.get(p.id) || 0.45; }

  function bind(p) {
    root.style.setProperty('--accent', p.accent);
    root.style.setProperty('--tint', p.tint);
    $$('[data-bind]').forEach((el) => {
      const k = el.dataset.bind;
      if (k === 'price') el.textContent = formatPrice(p.price);
      else if (k === 'age') el.textContent = `${p.sizes[0].split('-')[0]}–${p.sizes[p.sizes.length - 1].split('-')[1]} yaş`;
      else el.textContent = p[k] ?? '';
    });
    $$('[data-pick]').forEach((b) => {
      const on = b.dataset.pick === p.id;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-pressed', on);
    });
    $$('.chap-text').forEach((el) => { el.classList.remove('swap'); void el.offsetWidth; el.classList.add('swap'); });
  }

  function setProduct(p) {
    if (!p || p === cur && state.ready) return;
    cur = p;
    const next = layers[1 - layer];
    next.src = p.image;
    next.alt = `${p.name} pijama takımı`;
    const show = () => {
      next.classList.add('is-on');
      layers[layer].classList.remove('is-on');
      layer = 1 - layer;
      placeSpots();
    };
    if (next.complete && next.naturalWidth) show(); else next.onload = show;
    bind(p);
    hooks.onProduct?.(p);
  }

  /* ---------- Detay noktaları ---------- */
  spotsEl.innerHTML = SPOTS.map((s, i) => `<button class="spot-dot" data-spot="${s.key}" aria-label="${s.label}"><span>${i + 1}</span></button>`).join('');
  $('.spot-list').innerHTML = SPOTS.map((s, i) => `
    <li><button data-spot="${s.key}"><b>0${i + 1}</b><span>${s.label}</span></button></li>`).join('');

  function setSpot(key) {
    spotKey = key;
    const s = SPOTS.find((x) => x.key === key);
    $$('[data-spot]').forEach((b) => b.classList.toggle('is-active', b.dataset.spot === key));
    $('.spot-caption').textContent = s.text;
  }
  root.addEventListener('click', (e) => {
    const b = e.target.closest('[data-spot]');
    if (b) { setSpot(b.dataset.spot); lastInput = performance.now(); }
    const pick = e.target.closest('[data-pick]');
    if (pick) { setProduct(products.find((p) => p.id === pick.dataset.pick)); lastInput = performance.now(); }
    if (e.target.closest('[data-open]')) hooks.onOpen?.(cur);
    const r = e.target.closest('.rail button');
    if (r) goChapter(Number(r.dataset.ch));
  });

  function placeSpots() {
    const a = aspectOf(cur);
    const w = (a / BOX_ASPECT) * 100;
    spotsEl.style.left = `${(100 - w) / 2}%`;
    spotsEl.style.width = `${w}%`;
    $$('.spot-dot').forEach((d) => {
      const [x, y] = cur.spots[d.dataset.spot];
      d.style.left = `${x * 100}%`;
      d.style.top = `${y * 100}%`;
    });
  }

  /* ---------- Rüya modu (basılı tut) ---------- */
  const hold = $('.hold');
  const on = (e) => { e.preventDefault(); holding = true; hold.classList.add('is-holding'); lastInput = performance.now(); };
  const off = () => { holding = false; hold.classList.remove('is-holding'); };
  hold.addEventListener('pointerdown', on);
  ['pointerup', 'pointerleave', 'pointercancel', 'blur'].forEach((ev) => hold.addEventListener(ev, off));
  hold.addEventListener('keydown', (e) => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) on(e); });
  hold.addEventListener('keyup', off);

  /* ---------- Kamera anahtar kareleri ---------- */
  function key(i) {
    const center = [0.5, 0.5];
    const p = cur.spots;
    if (portrait) {
      return [
        { s: 1, f: center, t: [0.5, 0.42] },
        { s: 1.45, f: p.baski, t: [0.5, 0.3] },
        { s: 1, f: center, t: [0.5, 0.42] },
        { s: 1.2, f: p[spotKey], t: [0.5, 0.3] },
        { s: 0.8, f: center, t: [0.5, 0.33] },
      ][i];
    }
    return [
      { s: 1, f: center, t: [0.66, 0.56] },
      { s: 1.7, f: p.baski, t: [0.66, 0.5] },
      { s: 1.02, f: center, t: [0.64, 0.56] },
      { s: 1.4, f: p[spotKey], t: [0.66, 0.52] },
      { s: 0.95, f: center, t: [0.68, 0.6] },
    ][i];
  }

  function progress() {
    const span = root.offsetHeight - vh;
    return span > 0 ? clamp((scrollY - root.offsetTop) / span) : 0;
  }

  function goChapter(i) {
    const span = root.offsetHeight - vh;
    window.scrollTo({ top: root.offsetTop + (i / (CH - 1)) * span + 2, behavior: reduced ? 'auto' : 'smooth' });
  }

  /* ---------- Gökyüzü ---------- */
  let stars = [];
  let sparks = [];
  let shoot = null;
  const dpr = Math.min(devicePixelRatio || 1, 2);
  function resize() {
    vw = innerWidth;
    vh = innerHeight;
    portrait = vw / vh < 0.9;
    canvas.width = vw * dpr;
    canvas.height = vh * dpr;
    const h0 = vh * (portrait ? 0.56 : 0.8);
    cam.style.height = `${h0}px`;
    cam.style.width = `${h0 * BOX_ASPECT}px`;
    const n = Math.round((vw * vh) / 5200);
    stars = Array.from({ length: n }, () => ({ x: Math.random(), y: Math.random() * 0.75, r: Math.random() * 1.3 + 0.3, ph: Math.random() * 6.28, sp: 0.6 + Math.random() * 1.6 }));
    sparks = Array.from({ length: Math.round(n / 4) }, () => newSpark(true));
    buildClouds();
  }
  function newSpark(any) {
    return { x: Math.random(), y: any ? Math.random() : -0.05, r: Math.random() * 2.2 + 0.8, v: 0.0004 + Math.random() * 0.0009, sw: Math.random() * 6.28, c: PASTEL[(Math.random() * PASTEL.length) | 0] };
  }

  let cloudStrip = null;
  function buildClouds() {
    const sw = Math.max(vw, 900);
    const sh = vh * 0.32;
    const c = document.createElement('canvas');
    c.width = sw * dpr;
    c.height = sh * dpr;
    const x = c.getContext('2d');
    x.scale(dpr, dpr);
    x.filter = 'blur(14px)';
    x.fillStyle = '#fff';
    const draw = (cx, cy, w, al) => {
      x.globalAlpha = al;
      for (let k = 0; k < 7; k++) {
        x.beginPath();
        x.arc(cx + (k - 3) * w * 0.16, cy - Math.sin((k / 6) * Math.PI) * w * 0.1, w * (0.1 + Math.sin((k / 6) * Math.PI) * 0.06), 0, 7);
        x.fill();
      }
    };
    for (let i = -1; i <= 4; i++) draw(i * sw * 0.28, sh * 0.72, sw * 0.36, 0.28);
    for (let i = -1; i <= 4; i++) draw(i * sw * 0.26 + sw * 0.13, sh * 0.98, sw * 0.34, 0.5);
    cloudStrip = c;
  }

  function drawSky(t, prog) {
    const W = canvas.width;
    const H = canvas.height;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.scale(dpr, dpr);
    const glow = 0.55 + night * 0.6;
    for (const s of stars) {
      const a = (0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * s.sp + s.ph))) * glow;
      ctx.globalAlpha = clamp(a);
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(s.x * vw, (s.y - prog * 0.06) * vh, s.r * (1 + night * 0.5), 0, 7);
      ctx.fill();
    }
    // Kayan yıldız
    if (!reduced && !shoot && Math.random() < 0.004 + night * 0.02) shoot = { x: Math.random() * 0.6 + 0.3, y: Math.random() * 0.3, l: 0 };
    if (shoot) {
      shoot.l += 0.025;
      const x = (shoot.x - shoot.l * 0.35) * vw;
      const y = (shoot.y + shoot.l * 0.18) * vh;
      const g = ctx.createLinearGradient(x, y, x + 120, y - 60);
      g.addColorStop(0, 'rgba(255,255,255,.95)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.globalAlpha = 1 - shoot.l;
      ctx.strokeStyle = g;
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 120, y - 60); ctx.stroke();
      if (shoot.l >= 1) shoot = null;
    }
    // Süzülen pırıltılar
    for (const p of sparks) {
      if (!reduced) {
        p.y += p.v * (1 + night);
        p.sw += 0.01;
      }
      if (p.y > 1.05) Object.assign(p, newSpark(false));
      ctx.globalAlpha = 0.55 + night * 0.4;
      ctx.fillStyle = p.c;
      ctx.beginPath();
      ctx.arc((p.x + Math.sin(p.sw) * 0.01) * vw, p.y * vh, p.r * (1 + night * 0.6), 0, 7);
      ctx.fill();
    }
    // Bulut denizi: önceden çizilmiş yumuşak şerit kaydırılarak çizilir
    if (cloudStrip) {
      const sw = cloudStrip.width / dpr;
      const off = (prog * 320 + t * 8) % sw;
      ctx.globalAlpha = 0.9 - night * 0.25;
      for (let x = -off; x < vw; x += sw) ctx.drawImage(cloudStrip, x, vh - cloudStrip.height / dpr, sw, cloudStrip.height / dpr);
    }
    ctx.globalAlpha = 1;
  }

  /* ---------- Ana döngü ---------- */
  const start = performance.now();
  function frame(now) {
    requestAnimationFrame(frame);
    const t = (now - start) / 1000;
    const prog = progress();
    const c = prog * (CH - 1);
    const i = Math.min(CH - 2, Math.floor(c));
    const f = smooth((c - i - 0.18) / 0.64);
    const a = key(i);
    const b = key(i + 1);
    const goal = {
      s: lerp(a.s, b.s, f), fx: lerp(a.f[0], b.f[0], f), fy: lerp(a.f[1], b.f[1], f),
      tx: lerp(a.t[0], b.t[0], f), ty: lerp(a.t[1], b.t[1], f),
    };
    const k = state.ready && !reduced ? 0.09 : 1;
    for (const n of ['s', 'fx', 'fy', 'tx', 'ty']) state[n] += (goal[n] - state[n]) * k;
    state.ready = true;

    // Kamera
    const h0 = cam.offsetHeight;
    const boxW = cam.offsetWidth;
    const imgW = h0 * aspectOf(cur);
    const Fx = (boxW - imgW) / 2 + state.fx * imgW;
    const Fy = state.fy * h0;
    const bob = reduced ? 0 : Math.sin(t * 1.1) * 4;
    cam.style.transform = `translate3d(${state.tx * vw - state.s * Fx}px, ${state.ty * vh - state.s * Fy + bob}px, 0) scale(${state.s})`;
    cam.style.setProperty('--inv', (1 / state.s).toFixed(3));

    // Sahne yazıları
    const active = Math.round(c);
    chaps.forEach((el, n) => {
      const vis = clamp(1 - Math.abs(c - n) * 2.4);
      el.style.opacity = vis.toFixed(3);
      el.style.transform = `translateY(${(c - n) * -40}px)`;
      el.classList.toggle('is-active', n === active);
      el.inert = vis < 0.4;
    });
    railItems.forEach((r, n) => r.classList.toggle('is-active', n === active));
    root.dataset.ch = active;

    // Rüya modu, dev yazı, sis
    const dream = clamp(1 - Math.abs(c - 2) * 1.6) * 0.45;
    night += ((holding ? 1 : dream) - night) * 0.08;
    root.style.setProperty('--night', night.toFixed(3));
    const zoom = clamp((state.s - 1) / 0.7);
    const intro = clamp(1 - c * 1.5);
    word.style.opacity = ((0.3 + intro * 0.35) * (1 - zoom * 0.7) * (1 - night * 0.4)).toFixed(3);
    word.style.setProperty('--spread', `${c * 1.6}vw`);
    word.style.transform = `translate(-50%, -50%) translateY(${-prog * 6}vh) scale(${1 + zoom * 0.15})`;
    fog.style.opacity = (1 - zoom).toFixed(3);
    $('.spots').classList.toggle('is-on', Math.abs(c - 3) < 0.35);

    // Koleksiyon sahnesinde boşta kalınca sıradaki takıma geç
    if (!reduced && active === CH - 1 && now - lastInput > 4500 && !document.hidden && !hooks.isBusy?.()) {
      const idx = products.indexOf(cur);
      setProduct(products[(idx + 1) % products.length]);
      lastInput = now;
    }

    drawSky(t, prog);
  }

  addEventListener('resize', resize);
  addEventListener('scroll', () => { lastInput = performance.now(); }, { passive: true });
  resize();
  setSpot(spotKey);
  layers[0].src = cur.image;
  layers[0].classList.add('is-on');
  bind(cur);
  placeSpots();
  requestAnimationFrame(frame);

  return {
    setProduct: (id) => setProduct(products.find((p) => p.id === id)),
    goChapter,
    get product() { return cur; },
    next(d = 1) {
      const idx = products.indexOf(cur);
      setProduct(products[(idx + d + products.length) % products.length]);
      lastInput = performance.now();
    },
  };
}
