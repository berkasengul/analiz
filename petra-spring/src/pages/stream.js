// Ana sayfa: Unbe tarzı kaydırmalı 3B ürün akışı.
// Açılışta büyük başlık ve ilk ürün; kaydırınca ürün ışıklı kaidenin ortasına iner, her kaydırmada
// dönerek bir sonraki ürüne geçer. Her ürünün kendi sahnesi (arka plan) var; fare ürünü eğip çevirir.
import { $, $$, FLAVORS, productUrl, reduce } from '../site.js';
import { GROUPS, fiyat } from '../data.js';
import POSTER from '../poster.json';

const IDS = ['once-vatan', 'ocean', 'kerasus'];
const STREAM = IDS.map((id) => FLAVORS.find((f) => f.id === id));
const N = STREAM.length;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const pad = (n) => String(n).padStart(2, '0');
// sahnenin yarı yüksekliği (kamera z=5, görüş açısı 30°) ve ürün + kaide yığınının boyu (ürün biriminde)
const H0 = Math.tan((15 * Math.PI) / 180) * 5;
const STACK = 1.52 + 0.6 * 0.78;
const isMobile = () => window.innerWidth / window.innerHeight < 0.9 || window.innerWidth < 760;
const ARROW = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const SPARK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5l1.6 4.6 4.9.2-3.9 3 1.4 4.7L12 12.3 8 15l1.4-4.7-3.9-3 4.9-.2z" fill="currentColor"/></svg>';

export function initStream() {
  const sec = $('#akis');
  if (!sec) return;
  sec.style.setProperty('--n', N + 1);
  const hdr = $('#hdr');

  /* ---------- yazı katmanları: açılış + her ürün ---------- */
  $('#players').insertAdjacentHTML('beforeend', STREAM.map((f, i) => `
    <article class="player player--p" data-k="${i + 1}" aria-hidden="true">
      <p class="player__idx" style="--k:0"><b>${pad(i + 1)}</b><i></i>${GROUPS[f.group].replace(/ları$|leri$/, 'su')}</p>
      <h2 class="player__name${f.name.length > 8 ? ' player__name--long' : ''}" style="--k:1"><span>${f.name}</span></h2>
      <p class="player__lead" style="--k:2">${f.sense.mood}</p>
      <dl class="player__facts" style="--k:3">${f.facts.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl>
      <div class="player__actions" style="--k:4">
        <a class="btn btn--primary" href="${productUrl(f)}">Ürünü 3B incele ${ARROW}</a>
        <a class="btn btn--outline" href="${productUrl(f)}&kesfet=1">${SPARK} Kokuyu keşfet</a>
      </div>
    </article>`).join(''));
  const players = $$('.player', sec);
  $('#flavorList').innerHTML = STREAM.map((f, i) => `<button type="button" data-go="${i}"><small>${pad(i + 1)}</small><span>${f.name}</span></button>`).join('');
  const dots = $$('#flavorList button');

  const hs = () => hdr.getBoundingClientRect().height;
  const docTop = (el) => el.getBoundingClientRect().top + window.scrollY;
  // akıştaki k. durak (0: açılış, 1..N: ürünler) için kaydırma konumu
  const stopY = (k) => docTop(sec) + ((sec.offsetHeight - window.innerHeight) * k) / N;
  dots.forEach((d) => d.addEventListener('click', () => window.scrollTo({ top: stopY(+d.dataset.go + 1), behavior: reduce ? 'auto' : 'smooth' })));
  $('#introNext')?.addEventListener('click', () => window.scrollTo({ top: stopY(1), behavior: reduce ? 'auto' : 'smooth' }));

  let scene = null, f = 0, cur = 0;

  /* ---------- pozlar ---------- */
  // Ürün her zaman mermer kaidenin üstünde: ürün + kaide yığını menünün altındaki alana sığdırılır.
  // Sahne hazır olmadan da hesaplanır (açılış görseli aynı hesapla yerleşir, 3B gelince boyut değişmez).
  function poses() {
    const vh = window.innerHeight, vw = window.innerWidth, u = (2 * H0) / vh, W = H0 * (vw / vh);
    const top = hs();
    if (isMobile()) {
      const ph = Math.max(...players.map((p) => p.offsetHeight || 0));
      const t = top + 6, bot = Math.max(t + 220, vh - ph + 4);
      const R = (bot - t) * u;
      const s = Math.min(1.0, (R * 0.9) / STACK, W * 0.62);
      const stackTop = H0 - t * u - (R - STACK * s) / 2;
      const y = stackTop - 0.76 * s;
      return { intro: { x: 0, y, s, ry: -0.3, rz: 0, podium: 1, halo: 0 }, stage: { x: 0, y, s, ry: 0, rz: 0, podium: 1, halo: 0 } };
    }
    const A = (vh - top) * u;
    const s = Math.min((0.86 * A) / STACK, W * 0.5);
    const stackTop = H0 - top * u - 0.05 * A - (0.86 * A - STACK * s) / 2;
    const y = stackTop - 0.76 * s;
    return {
      intro: { x: W * 0.3, y, s, ry: -0.3, rz: 0, podium: 1, halo: 0 },
      stage: { x: W * 0.2, y, s, ry: 0, rz: 0, podium: 1, halo: 0 },
    };
  }

  /* ---------- açılış görseli: 3B'nin ilk karesiyle birebir aynı yerde ve boyda ---------- */
  const layer = $('#posterLayer');
  function placePoster() {
    if (!layer || document.body.classList.contains('gl-ready')) return;
    const meta = POSTER[isMobile() ? 'm' : 'd'];
    if (!meta) return;
    const P = poses().intro, vh = window.innerHeight, vw = window.innerWidth, ppu = vh / (2 * H0);
    const k = (P.s * ppu) / meta.k;
    const ax = vw / 2 + P.x * ppu, ay = vh / 2 - P.y * ppu;
    Object.assign(layer.style, { width: `${meta.w * k}px`, height: `${meta.h * k}px`, left: `${ax - meta.ax * k}px`, top: `${ay - meta.ay * k}px` });
    layer.classList.add('placed');
  }
  placePoster();
  document.fonts?.ready.then(placePoster);
  window.addEventListener('resize', placePoster);

  /* ---------- kaydırmaya bağlı durum ---------- */
  let shown = -1, outTimers = new Map();
  function showPlayer(k) {
    if (k === shown) return;
    const prev = shown;
    shown = k;
    // ürünler arası geçişte yazı, yeni ürün kaideden yükselirken gelir
    sec.style.setProperty('--in', prev >= 1 && k >= 1 ? '0.95s' : '0.15s');
    players.forEach((pl, i) => {
      if (i === 0) return;
      const on = i === k;
      if (on) { clearTimeout(outTimers.get(pl)); pl.classList.remove('out'); }
      else if (pl.classList.contains('on')) {
        pl.classList.add('out');
        clearTimeout(outTimers.get(pl));
        outTimers.set(pl, setTimeout(() => pl.classList.remove('out'), 700));
      }
      pl.classList.toggle('on', on);
      pl.setAttribute('aria-hidden', on ? 'false' : 'true');
    });
  }
  function update() {
    if (!scene) return;
    const vh = window.innerHeight, top = hs();
    const r = sec.getBoundingClientRect();
    const total = sec.offsetHeight - vh;
    f = clamp((-r.top / total) * N, 0, N); // 0: açılış, 1..N: ürünler
    const live = r.bottom > top + 40;
    scene.setActive(live);
    sec.classList.toggle('live', live);
    if (!live) return;
    const P = poses();
    const m = smooth(0, 1, f); // açılış → sahne
    const p = {};
    for (const k in P.stage) p[k] = P.intro[k] + (P.stage[k] - P.intro[k]) * m;
    // akışın sonu: ürün bölümle birlikte yukarı kayar
    if (r.bottom < vh) p.y += (vh - r.bottom) * ((2 * H0) / vh);
    scene.setPose({ ...p, cloud: 0, frost: 0, bd: 0 });
    cur = Math.round(clamp(f - 1, 0, N - 1));
    scene.setStream(cur);

    // açılış yazısı kaydırmayla çekilir; ürün yazıları geçişle birlikte gelir
    const intro = players[0], d = f, ad = Math.abs(d);
    const o = 1 - smooth(0.18, 0.42, ad);
    intro.style.setProperty('--d', Math.max(0, ad - 0.05).toFixed(4));
    intro.style.setProperty('--o', o.toFixed(3));
    intro.style.setProperty('--b', ad < 0.2 ? '0px' : `${Math.min(8, (ad - 0.2) * 40).toFixed(1)}px`);
    intro.style.visibility = o < 0.002 ? 'hidden' : 'visible';
    intro.classList.toggle('on', ad < 0.3);
    intro.setAttribute('aria-hidden', ad < 0.3 ? 'false' : 'true');
    showPlayer(f < 0.5 ? 0 : cur + 1);

    dots.forEach((dd, k) => dd.classList.toggle('on', f > 0.5 && k === cur));
    $('#flavorList').classList.toggle('show', f > 0.55);
    $('#streamCount').innerHTML = `<b>${pad(cur + 1)}</b><i><span style="width:${(cur / (N - 1)) * 100}%"></span></i>${pad(N)}`;
    $('#streamCount').classList.toggle('show', f > 0.55);
    $('#productHit').href = productUrl(STREAM[f < 0.5 ? 0 : cur]);
  }

  // kaydırma durunca en yakın durağa yumuşakça otur
  let snapTimer = 0, snapping = false;
  function scheduleSnap() {
    clearTimeout(snapTimer);
    if (snapping || reduce || /[?&]nosnap\b/.test(location.search)) return;
    snapTimer = setTimeout(() => {
      const r = sec.getBoundingClientRect();
      if (r.top > 2 || r.bottom < window.innerHeight - 2) return;
      const n = Math.round(f);
      if (Math.abs(f - n) < 0.02) return;
      snapping = true;
      window.scrollTo({ top: stopY(n), behavior: 'smooth' });
      setTimeout(() => { snapping = false; }, 800);
    }, 260);
  }
  window.addEventListener('scroll', () => { update(); scheduleSnap(); }, { passive: true });
  window.addEventListener('resize', update);

  // ürünün üzerinde "3B incele" etiketi imleci izler
  const hit = $('#productHit'), label = $('#hitLabel');
  hit.addEventListener('pointermove', (e) => { const r = hit.getBoundingClientRect(); label.style.transform = `translate(${e.clientX - r.left}px, ${e.clientY - r.top}px)`; });
  hit.addEventListener('pointerenter', () => hit.classList.add('hover'));
  hit.addEventListener('pointerleave', () => hit.classList.remove('hover'));

  import('../scene.js').then(({ createScene }) => {
    const still = /[?&]poster\b/.test(location.search);
    scene = createScene($('#gl'), STREAM, null, null, { backdrop: true, still });
    window.__scene = scene;
    window.__pose = () => poses().intro;
    scene.ready.then(() => {
      const P = poses();
      scene.snapPose({ ...P.intro, cloud: 0, frost: 0, bd: 0 });
      update();
      // ilk kare çizildikten sonra açılış görseli yumuşakça çekilir; ardından kaidede hafif bir ışık belirir
      requestAnimationFrame(() => requestAnimationFrame(() => {
        document.body.classList.add('gl-ready');
        if (!reduce && !still) setTimeout(() => scene.glow(0.75), 700);
      }));
    });
  }).catch(() => { document.body.classList.add('no-gl'); });
}
