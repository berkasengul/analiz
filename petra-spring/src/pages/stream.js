// Ana sayfa: Unbe tarzı kaydırmalı 3B ürün akışı.
// Açılışta büyük başlık ve ilk ürün; kaydırınca ürün ışıklı kaidenin ortasına iner, her kaydırmada
// dönerek bir sonraki ürüne geçer. Her ürünün kendi sahnesi (arka plan) var; fare ürünü eğip çevirir.
import { $, $$, FLAVORS, productUrl, reduce } from '../site.js';
import { GROUPS, fiyat } from '../data.js';

const IDS = ['anka', 'cam-aura', 'kerasus', 'ocean', 'cam-tutti', 'once-vatan', 'agartha', 'electro'];
const STREAM = IDS.map((id) => FLAVORS.find((f) => f.id === id));
const N = STREAM.length;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const pad = (n) => String(n).padStart(2, '0');
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
      <p class="player__idx" style="--k:0"><b>${pad(i + 1)}</b> / ${pad(N)} <span>· ${GROUPS[f.group]}</span></p>
      <h2 class="player__name${f.name.length > 8 ? ' player__name--long' : ''}" style="--k:1">${f.name}</h2>
      <p class="player__lead" style="--k:2">${f.sense.mood}</p>
      <ul class="player__tags" style="--k:3">${f.sense.tags.map((t) => `<li>${t}</li>`).join('')}<li class="price">${fiyat(f.price)}</li></ul>
      <div class="player__actions" style="--k:4">
        <a class="btn btn--gold" href="${productUrl(f)}">3B incele ${ARROW}</a>
        <a class="btn btn--line" href="${productUrl(f)}&kesfet=1">${SPARK} Kokuyu keşfet</a>
      </div>
    </article>`).join(''));
  const players = $$('.player', sec);
  $('#flavorList').innerHTML = STREAM.map((f, i) => `<button type="button" data-go="${i}"><i style="--c:${f.model.liquid || f.bg}"></i><span>${f.name}</span></button>`).join('');
  const dots = $$('#flavorList button');

  const hs = () => hdr.getBoundingClientRect().height;
  const docTop = (el) => el.getBoundingClientRect().top + window.scrollY;
  // akıştaki k. durak (0: açılış, 1..N: ürünler) için kaydırma konumu
  const stopY = (k) => docTop(sec) + ((sec.offsetHeight - window.innerHeight) * k) / N;
  dots.forEach((d) => d.addEventListener('click', () => window.scrollTo({ top: stopY(+d.dataset.go + 1), behavior: reduce ? 'auto' : 'smooth' })));
  $('#introNext')?.addEventListener('click', () => window.scrollTo({ top: stopY(1), behavior: reduce ? 'auto' : 'smooth' }));

  let scene = null, f = 0, cur = 0;

  /* ---------- pozlar ---------- */
  // ekran birimi: sahne düzleminde 1 px kaç birim
  function poses() {
    const H = scene.halfHeight(), vh = window.innerHeight, vw = window.innerWidth, u = (2 * H) / vh, W = H * (vw / vh);
    const top = hs();
    const cy = -((top + vh) / 2 - vh / 2) * u; // menünün altında kalan alanın ortası
    if (isMobile()) {
      const ph = Math.max(...players.map((p) => p.offsetHeight || 0));
      const t = top + 10, bot = Math.max(t + 200, vh - ph - 10);
      const y = -((t + bot) / 2 - vh / 2) * u, s = Math.min(1.05, ((bot - t) * u) / 1.75);
      return { intro: { x: 0, y, s, ry: -0.25, rz: 0, podium: 0, halo: 0.2 }, stage: { x: 0, y: y - 0.06 * s, s: s * 0.9, ry: 0, rz: 0, podium: 1, halo: 0.25 } };
    }
    const s = Math.min(1.3, H * 0.92, W * 0.5);
    return {
      intro: { x: W * 0.34, y: cy - 0.02, s: s * 1.05, ry: -0.3, rz: 0.04, podium: 0, halo: 0.25 },
      stage: { x: W * 0.17, y: cy + 0.1, s: s * 1.0, ry: 0, rz: 0, podium: 1, halo: 0.3 },
    };
  }

  /* ---------- kaydırmaya bağlı durum ---------- */
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
    const m = smooth(0, 1, f); // açılış → kaide
    const p = {};
    for (const k in P.stage) p[k] = P.intro[k] + (P.stage[k] - P.intro[k]) * m;
    // akışın sonu: ürün bölümle birlikte yukarı kayar
    if (r.bottom < vh) p.y += (vh - r.bottom) * ((2 * scene.halfHeight()) / vh);
    scene.setPose({ ...p, cloud: 0, frost: 0, bd: 0 });
    scene.setStream(clamp(f - 1, 0, N - 1));
    cur = Math.round(clamp(f - 1, 0, N - 1));

    players.forEach((pl, k) => {
      const d = f - k, ad = Math.abs(d);
      const o = 1 - smooth(0.28, 0.48, ad);
      pl.style.setProperty('--d', (Math.sign(d) * Math.max(0, ad - 0.15)).toFixed(4));
      pl.style.setProperty('--o', o.toFixed(3));
      pl.style.setProperty('--b', ad < 0.3 ? '0px' : `${Math.min(8, (ad - 0.3) * 40).toFixed(1)}px`);
      pl.style.visibility = o < 0.002 ? 'hidden' : 'visible';
      const on = ad < 0.3;
      if (pl.classList.contains('on') !== on) { pl.classList.toggle('on', on); pl.setAttribute('aria-hidden', on ? 'false' : 'true'); }
    });
    dots.forEach((d, k) => d.classList.toggle('on', f > 0.5 && k === cur));
    $('#flavorList').classList.toggle('show', f > 0.55);
    $('#streamCount').innerHTML = f > 0.55 ? `<b>${pad(cur + 1)}</b> / ${pad(N)}` : '';
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
    scene = createScene($('#gl'), STREAM, null, null, { backdrop: true });
    scene.setSides(STREAM.map((_, i) => i));
    scene.ready.then(() => {
      const P = poses();
      scene.snapPose({ ...P.intro, cloud: 0, frost: 0, bd: 0 });
      update();
      document.body.classList.add('gl-ready');
      // açılış: ürün ağır bir tur atarak belirir
      if (!reduce) scene.spinOnce(1, 2.4);
    });
  }).catch(() => { document.body.classList.add('no-gl'); });
}
