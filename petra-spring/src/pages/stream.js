// Ana sayfa: Unbe tarzı kaydırmalı 3B ürün akışı.
// Açılışta büyük başlık ve ilk ürün; kaydırınca ürün ışıklı kaidenin ortasına iner, her kaydırmada
// dönerek bir sonraki ürüne geçer. Her ürünün kendi sahnesi (arka plan) var; fare ürünü eğip çevirir.
import { $, $$, FLAVORS, productUrl, reduce } from '../site.js';
import { GROUPS, fiyat } from '../data.js';
import POSTER from '../poster.json';

const IDS = ['petra-x', 'cam-aura', 'agartha'];
const STREAM = IDS.map((id) => FLAVORS.find((f) => f.id === id));
const N = STREAM.length;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const easeIO = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const TAU = Math.PI * 2;
// kaidenin genişliği (ürün biriminde)
const POD_W = 2 * 0.734 * 0.78;
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
  const gl = $('#gl'), stick = $('.ph__stick', sec);

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

  let scene = null, f = 0, cur = 0;

  /* ---------- pozlar ---------- */
  // Kaide hep aynı yerde durur (açılışta da, ürünler arasında da); yalnızca üstündeki ürün döner ve değişir.
  // Ürün + kaide yığını menünün altındaki alana sığdırılır. Ölçüler sabit yükseklikten alınır: telefonda adres
  // çubuğu açılıp kapanınca kaide oynamaz. Sahne hazır olmadan da hesaplanır (açılış görseli aynı hesapla yerleşir).
  // vh: tuvalin (sabit) yüksekliği; vis: her zaman görünen alanın alt kenarı
  const dims = () => {
    const vw = window.innerWidth, vh = (gl && gl.clientHeight) || window.innerHeight;
    const top = hs(), vis = Math.min(vh, top + (stick ? stick.offsetHeight : vh - top));
    return { vw, vh, top, vis };
  };
  function poses() {
    const { vw, vh, top, vis } = dims();
    const u = (2 * H0) / vh, W = H0 * (vw / vh);
    let s, stackTop, x;
    if (isMobile()) {
      const ph = Math.max(...players.map((p) => p.offsetHeight || 0));
      const t = top + 10, bot = Math.max(t + 240, vis - ph - 2);
      const R = (bot - t) * u;
      s = Math.min(1.25, (R * 0.95) / STACK, (2 * W * 0.8) / POD_W);
      stackTop = H0 - t * u - (R - STACK * s) / 2;
      x = 0;
    } else {
      const A = (vis - top) * u;
      s = Math.min((0.86 * A) / STACK, W * 0.5);
      stackTop = H0 - top * u - 0.05 * A - (0.86 * A - STACK * s) / 2;
      x = W * 0.26;
    }
    const y = stackTop - 0.76 * s;
    const base = { x, y, s, rz: 0, podium: 1, halo: 0 };
    return { intro: { ...base, ry: -0.3 }, stage: { ...base, ry: reduce ? 0 : TAU } };
  }
  // "3B incele" tıklama alanı ürünün ve kaidenin üstünde
  const hit = $('#productHit');
  function placeHit() {
    const P = poses().intro, { vw, vh, top } = dims(), ppu = vh / (2 * H0);
    const w = POD_W * P.s * ppu * 1.05, h = STACK * P.s * ppu;
    const cx = vw / 2 + P.x * ppu, ty = vh / 2 - (P.y + 0.76 * P.s) * ppu;
    Object.assign(hit.style, { left: `${cx - w / 2}px`, top: `${ty - top}px`, width: `${w}px`, height: `${h}px` });
  }

  /* ---------- açılış görseli: 3B'nin ilk karesiyle birebir aynı yerde ve boyda ---------- */
  const layer = $('#posterLayer');
  function placePoster() {
    if (!layer || document.body.classList.contains('gl-ready')) return;
    const meta = POSTER[isMobile() ? 'm' : 'd'];
    if (!meta) return;
    const P = poses().intro, { vw, vh } = dims(), ppu = vh / (2 * H0);
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
    // ürünler arası geçişte eski yazı ürün dönmeye başlarken çekilir, yenisi ürün yerine otururken gelir
    sec.style.setProperty('--in', prev >= 1 || k >= 1 ? '0.12s' : '0.15s');
    players.forEach((pl, i) => {
      if (i === 0 || (i !== k && i !== prev)) return;
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
    const { top } = dims();
    const r = sec.getBoundingClientRect();
    const total = sec.offsetHeight - window.innerHeight;
    f = clamp((-r.top / total) * N, 0, N); // 0: açılış, 1..N: ürünler (ara değerler geçiş)
    const live = r.bottom > top + 40;
    scene.setActive(live);
    sec.classList.toggle('live', live);
    // akışın sonu: sahne bölümle birlikte, sayfayla aynı hızda yukarı kayar (kaide yerinde, gecikmesiz)
    const shift = Math.min(0, r.bottom - window.innerHeight);
    gl.style.transform = shift ? `translate3d(0, ${shift.toFixed(1)}px, 0)` : '';
    if (!live) return;
    const P = poses();
    const m = smooth(0, 1, f); // açılış → ilk ürün: ürün kaidenin üstünde bir tur döner
    const p = {};
    for (const k in P.stage) p[k] = P.intro[k] + (P.stage[k] - P.intro[k]) * m;
    scene.setPose({ ...p, cloud: 0, frost: 0, bd: 0 });
    scene.setStream(clamp(f - 1, 0, N - 1));
    cur = Math.round(clamp(f - 1, 0, N - 1));

    // açılış yazısı kaydırmayla çekilir; ürün yazıları ürün yerine otururken gelir
    const intro = players[0], ad = Math.abs(f);
    const o = 1 - smooth(0.18, 0.42, ad);
    intro.style.setProperty('--d', Math.max(0, ad - 0.05).toFixed(4));
    intro.style.setProperty('--o', o.toFixed(3));
    intro.style.setProperty('--b', ad < 0.2 ? '0px' : `${Math.min(8, (ad - 0.2) * 40).toFixed(1)}px`);
    intro.style.visibility = o < 0.002 ? 'hidden' : 'visible';
    intro.classList.toggle('on', ad < 0.3);
    intro.setAttribute('aria-hidden', ad < 0.3 ? 'false' : 'true');
    const near = Math.round(f);
    showPlayer(f < 0.5 ? 0 : Math.abs(f - near) < 0.3 && near >= 1 ? near : -1);

    dots.forEach((dd, k) => dd.classList.toggle('on', f > 0.5 && k === cur));
    $('#flavorList').classList.toggle('show', f > 0.55);
    $('#streamCount').innerHTML = `<b>${pad(cur + 1)}</b><i><span style="width:${(cur / (N - 1)) * 100}%"></span></i>${pad(N)}`;
    $('#streamCount').classList.toggle('show', f > 0.55);
    hit.href = productUrl(STREAM[f < 0.5 ? 0 : cur]);
  }

  // tek kaydırma = bir sonraki durak (açılış → ürünler → sayfanın devamı), sinematik ve ağır çekimde
  // (Genç Anadolu ana sayfasındaki akışla aynı): ürün bu sürede kaidenin üstünde bir tur dönerek değişir
  let anim = 0, animating = false, lastWheel = 0, settleUntil = 0;
  function animateTo(target, seconds, done) {
    cancelAnimationFrame(anim);
    const from = window.scrollY, dist = target - from;
    if (reduce || Math.abs(dist) < 2) { window.scrollTo({ top: target, behavior: 'instant' }); done && done(); return; }
    const t0 = performance.now(), ms = seconds * 1000;
    const step = (now) => {
      const q = Math.min(1, (now - t0) / ms);
      window.scrollTo({ top: from + dist * easeIO(q), behavior: 'instant' });
      if (q < 1) anim = requestAnimationFrame(step); else done && done();
    };
    anim = requestAnimationFrame(step);
  }
  const stops = () => [...Array(N + 1).keys()].map(stopY).concat(docTop(sec) + sec.offsetHeight - hs());
  const DUR = [1.7, 1.9, 1.9, 1.3];
  function go(to, from) {
    const S = stops();
    animating = true;
    animateTo(S[to], DUR[Math.min(DUR.length - 1, Math.max(0, from))] * (to === S.length - 1 ? 0.7 : 1), () => { animating = false; settleUntil = performance.now() + 380; });
  }
  function page(dir) {
    const S = stops(), y = window.scrollY;
    let to = -1;
    if (dir > 0) to = S.findIndex((v) => v > y + 4);
    else for (let k = S.length - 1; k >= 0; k--) if (S[k] < y - 4) { to = k; break; }
    if (to < 0) return false;
    go(to, dir > 0 ? to - 1 : to);
    return true;
  }
  const inZone = (dir) => {
    const S = stops(), end = S[S.length - 1], y = window.scrollY;
    return dir > 0 ? y < end - 4 : y <= end + 4 && y > 4;
  };
  dots.forEach((d) => d.addEventListener('click', () => { if (!animating) go(+d.dataset.go + 1, Math.round(f)); }));
  $('#introNext')?.addEventListener('click', () => { if (!animating) go(1, 0); });
  if (!reduce && !/[?&]nosnap\b/.test(location.search)) {
    window.addEventListener('wheel', (e) => {
      if (document.body.classList.contains('menu-open')) return;
      const dir = Math.sign(e.deltaY);
      if (!dir || !inZone(dir)) return;
      e.preventDefault();
      const now = performance.now(), gap = now - lastWheel;
      lastWheel = now;
      // dokunmatik yüzeyin süren ataleti yeni bir kaydırma sayılmaz
      if (animating || now < settleUntil || (gap < 140 && now < settleUntil + 600)) return;
      if (Math.abs(e.deltaY) < 3) return;
      page(dir);
    }, { passive: false });
    let ty = null;
    window.addEventListener('touchstart', (e) => { ty = e.touches.length === 1 ? e.touches[0].clientY : null; }, { passive: true });
    window.addEventListener('touchmove', (e) => {
      if (ty === null || document.body.classList.contains('menu-open')) return;
      const dir = Math.sign(ty - e.touches[0].clientY);
      if (dir && inZone(dir)) e.preventDefault();
    }, { passive: false });
    window.addEventListener('touchend', (e) => {
      if (ty === null) return;
      const dy = ty - e.changedTouches[0].clientY;
      ty = null;
      const dir = Math.sign(dy);
      if (Math.abs(dy) > 24 && inZone(dir) && !animating) page(dir);
    }, { passive: true });
    window.addEventListener('keydown', (e) => {
      if (e.target.closest && e.target.closest('input, textarea, select, button, a')) return;
      const dir = ['ArrowDown', 'PageDown', ' '].includes(e.key) ? 1 : ['ArrowUp', 'PageUp'].includes(e.key) ? -1 : 0;
      if (!dir || !inZone(dir)) return;
      e.preventDefault();
      if (!animating) page(dir);
    });
  }
  // kaydırma çubuğuyla bırakılırsa en yakın durağa otur
  let snapTimer = 0;
  function scheduleSnap() {
    clearTimeout(snapTimer);
    if (animating || reduce || /[?&]nosnap\b/.test(location.search)) return;
    snapTimer = setTimeout(() => {
      if (animating) return;
      const r = sec.getBoundingClientRect();
      if (r.top > 2 || r.bottom < window.innerHeight - 2) return;
      const n = Math.round(f);
      if (Math.abs(f - n) < 0.02) return;
      go(n, Math.min(n, Math.floor(f)));
    }, 260);
  }
  let queued = false;
  window.addEventListener('scroll', () => {
    scheduleSnap();
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; update(); });
  }, { passive: true });
  window.addEventListener('resize', () => { placeHit(); update(); });
  placeHit();
  document.fonts?.ready.then(placeHit);

  // ürünün üzerinde "3B incele" etiketi imleci izler
  const label = $('#hitLabel');
  hit.addEventListener('pointermove', (e) => { const r = hit.getBoundingClientRect(); label.style.transform = `translate(${e.clientX - r.left}px, ${e.clientY - r.top}px)`; });
  hit.addEventListener('pointerenter', () => hit.classList.add('hover'));
  hit.addEventListener('pointerleave', () => hit.classList.remove('hover'));

  import('../scene.js').then(({ createScene }) => {
    const still = /[?&]poster\b/.test(location.search);
    scene = createScene(gl, STREAM, null, null, { backdrop: true, still, fixed: true });
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
