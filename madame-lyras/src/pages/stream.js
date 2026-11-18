// Ana sayfa 3B ürün akışı: açılıştaki çilek paketi kaydırınca dönerek alt bölüme iner,
// ardından Çilek → Beyaz Ejder → Ananas arasında kaydırmaya bağlı, dönerek geçer.
import { $, $$, FLAVORS, productUrl, reduce } from '../site.js';

const NS = 3;
const STREAM = FLAVORS.slice(0, NS);
const POUCH_H = 1.153 * Math.sqrt(1.4 / 1.153);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const ease = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const pad = (n) => String(n).padStart(2, '0');
const isMobile = () => window.innerWidth / window.innerHeight < 0.9 || window.innerWidth < 760;
const ARROW = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

export function initStream(heroApi) {
  const productsEl = $('#akis');
  const fadeEl = $('.hero__fade');
  const heroEl = $('#hero');
  const hdr = $('#hdr');
  if (!productsEl) return;
  productsEl.style.setProperty('--n', NS);

  /* ---------- yazı katmanları ---------- */
  $('#players').innerHTML = STREAM.map((f, i) => `
    <article class="player" data-ink="${f.ink}" aria-hidden="${i ? 'true' : 'false'}">
      <p class="player__idx" style="--k:0"><b>${pad(i + 1)}</b> / ${pad(NS)}</p>
      <p class="player__eyebrow" style="--k:1">${f.slogan}</p>
      <h2 class="player__name${f.name.length > 9 ? ' player__name--long' : ''}" style="--k:2">${f.name}</h2>
      <p class="player__lead" style="--k:3">${f.lead}</p>
      <p class="player__desc" style="--k:4">${f.desc}</p>
      <dl class="player__facts" style="--k:5">${f.facts.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl>
      <div class="player__actions" style="--k:6">
        <a class="btn btn--gold" href="${productUrl(f)}">3D incele ${ARROW}</a>
        <a class="btn btn--line" href="/bayilik.html?urun=${encodeURIComponent(f.name)}#basvuru">Teklif iste</a>
      </div>
    </article>`).join('');
  const players = $$('.player', productsEl);
  $('#flavorDots').innerHTML = STREAM.map((f, i) => `<button type="button" data-go="${i}" aria-label="${f.name}"><span>${f.short || f.name}</span></button>`).join('');
  const dots = $$('#flavorDots button');

  /* ---------- kaydırma: tarayıcının kendi (akıcı) kaydırması; duraklar arası geçiş hafif bir animasyonla ---------- */
  const easeIO = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  let anim = 0;
  function animateTo(target, seconds, done) {
    cancelAnimationFrame(anim);
    const from = window.scrollY, dist = target - from;
    if (reduce || Math.abs(dist) < 2) { window.scrollTo({ top: target, behavior: 'instant' }); done && done(); return; }
    const t0 = performance.now(), ms = seconds * 1000;
    const step = (now) => {
      const p = Math.min(1, (now - t0) / ms);
      window.scrollTo({ top: from + dist * easeIO(p), behavior: 'instant' });
      if (p < 1) anim = requestAnimationFrame(step); else done && done();
    };
    anim = requestAnimationFrame(step);
  }
  const scrollToY = (y, duration = 1.6) => animateTo(y, duration);
  const hs = () => hdr.getBoundingClientRect().height; // yapışkan menünün yüksekliği
  const docTop = (el) => el.getBoundingClientRect().top + window.scrollY;
  const productY = (i) => docTop(productsEl) - hs() + ((productsEl.offsetHeight - (window.innerHeight - hs())) * i) / (NS - 1);
  dots.forEach((d) => d.addEventListener('click', () => scrollToY(productY(+d.dataset.go), 1.8)));

  let scene = null;
  let currentProduct = 0;
  let handing = false, arrived = false, streamF = null;

  /* ---------- pozlar ---------- */
  function pose() {
    const H = scene.halfHeight(), A = window.innerWidth / window.innerHeight, W = H * A;
    const vh = window.innerHeight, u = (2 * H) / vh, top = hs();
    if (isMobile()) {
      const ph = Math.max(...players.map((p) => p.offsetHeight || 0));
      const t = top + 12, bot = Math.max(t + 160, vh - ph - 8);
      const hpx = (bot - t) * 0.86;
      return { x: 0, y: -((t + bot) / 2 - vh / 2) * u, s: Math.min(0.72, (hpx * u) / POUCH_H), ry: -0.2, rz: 0.02, cloud: 1, frost: 0, halo: 0.72, bd: 0.3 };
    }
    const big = Math.min(1.55, W * 0.72, H * 1.05) * (1 - top / vh * 0.6);
    return { x: W * 0.36, y: -0.02 - (top / 2) * u, s: big, ry: -0.22, rz: 0.03, cloud: 1, frost: 0, halo: 0.72, bd: 0.3 };
  }
  // açılıştaki çilek paketinin ekrandaki yerinden ürün yerine: önce döner ve düzelir, sonra dümdüz iner
  function handoffPose(vh, y) {
    const rect = heroApi && heroApi.cilekRect();
    if (!rect) return null;
    const H = scene.halfHeight(), u = (2 * H) / vh, vw = window.innerWidth;
    const sx = (rect.cx - vw / 2) * u, sy = -(rect.cy - vh / 2) * u;
    const start = { x: sx, y: sy, s: (rect.h * u) / POUCH_H * 0.95, rx: Math.atan2(sy, 5) - 0.035, ry: -Math.atan2(sx, 5) + (rect.ry ?? -0.035), rz: 0, cloud: 0, frost: 0, pt: 0, halo: 0, bd: 0 };
    const end = { ...pose(), rx: 0, pt: 1 };
    const raw = clamp(y / Math.max(1, docTop(productsEl) - hs()), 0, 1);
    const k = raw * raw * (3 - 2 * raw), kr = smooth(0, 0.5, raw), kx = smooth(0, 0.6, raw);
    const p = {};
    for (const key in end) p[key] = start[key] + (end[key] - start[key]) * (['rx', 'ry', 'rz', 'pt', 'halo', 'bd'].includes(key) ? kr : key === 'x' ? kx : key === 'cloud' ? 0 : k);
    // inerken kendi etrafında ağır çekimde tam bir tur döner (kaydırmaya bağlı)
    if (!reduce) p.ry += Math.PI * 2 * ease(smooth(0.04, 0.96, raw));
    return p;
  }

  /* ---------- kaydırmaya bağlı durum ---------- */
  function update() {
    if (!scene) return;
    const vh = window.innerHeight, y = window.scrollY, top = hs();
    scene.kick(0);
    const pr = productsEl.getBoundingClientRect();
    const hb = heroEl.getBoundingClientRect().bottom;
    // açılışın altı ürün arka planına yumuşakça karışır (arada çizgi kalmaz)
    if (fadeEl) fadeEl.style.opacity = Math.min(1, (y / vh) * 3).toFixed(3);
    const juiceTop = pr.top;
    const raw = clamp(y / Math.max(1, docTop(productsEl) - top), 0, 1);
    scene.setJuiceClip(Math.max(juiceTop, top) / vh, pr.bottom / vh, pr.top > top ? 0.1 + 0.2 * raw : 0.3);

    // açılış tamamen yukarıdayken ya da akış geçildiyse sahne dinlenir
    if (pr.bottom <= top || y <= 1) {
      scene.setActive(y > 1 && pr.bottom > top);
      document.body.classList.remove('gl-front');
      handing = false;
      if (y <= 1) { heroApi && heroApi.setHandoff(false); arrived = false; }
      if (pr.bottom <= top) { scene.setActive(false); }
      return;
    }
    scene.setActive(true);
    heroApi && heroApi.setHandoff(true);
    document.body.classList.toggle('gl-front', hb > top);

    const total = productsEl.offsetHeight - (vh - top);
    const f = clamp((-(pr.top - top) / total) * (NS - 1), 0, NS - 1);
    const i = Math.min(NS - 2, Math.floor(f));
    const uu = f - i;
    const r = reduce ? (uu > 0.5 ? 1 : 0) : ease(smooth(0.3, 0.7, uu));
    currentProduct = r < 0.5 ? i : i + 1;
    streamF = f;

    if (pr.top > top) {
      // açılıştan iniş
      const p = handoffPose(vh, y);
      if (!handing) { if (p) scene.snapPose({ ...p }); handing = true; }
      else if (p) scene.setPose(p);
      scene.setStream(0);
    } else {
      handing = true;
      const p = pose();
      // akışın sonu: paket bölümle birlikte yukarı kayar
      if (pr.bottom < vh) p.y += (vh - pr.bottom) * ((2 * scene.halfHeight()) / vh);
      scene.setPose(p);
      scene.setStream(f);
    }
    if (!arrived && raw >= 0.97) { arrived = true; scene.burst(); }
    if (arrived && raw < 0.6) arrived = false;

    // yazılar: ürün ekrandayken net, geçişte kayarak söner
    const leaving = smooth(0.45, 0.85, (pr.bottom - top) / (vh - top));
    players.forEach((p, k) => {
      const d = f - k, ad = Math.abs(d);
      const o = (1 - smooth(0.3, 0.47, ad)) * leaving * (pr.top > top ? smooth(0.55, 1, raw) : 1);
      p.style.setProperty('--d', (Math.sign(d) * Math.max(0, ad - 0.18)).toFixed(4));
      p.style.setProperty('--o', o.toFixed(3));
      p.style.visibility = o < 0.002 ? 'hidden' : 'visible';
      const on = ad < 0.3;
      if (p.classList.contains('on') !== on) { p.classList.toggle('on', on); p.setAttribute('aria-hidden', on ? 'false' : 'true'); }
    });
    dots.forEach((d, k) => d.classList.toggle('on', k === currentProduct));
    $('#productHit').href = productUrl(STREAM[currentProduct]);
    productsEl.classList.toggle('live', pr.top <= top + 1 && pr.bottom > vh * 0.6);
  }

  // tek kaydırma = bir sonraki durak (açılış → Çilek → Beyaz Ejder → Ananas → sonraki bölüm), sinematik ve ağır çekimde
  const stops = () => {
    const end = docTop(productsEl) + productsEl.offsetHeight - hs();
    return [0, productY(0), productY(1), productY(2), end];
  };
  const DUR = [2.6, 1.8, 1.8, 1.4]; // duraklar arası süre (sn)
  let animating = false, lastWheel = 0, settleUntil = 0;
  function page(dir) {
    const S = stops(), y = window.scrollY;
    let to = -1;
    if (dir > 0) to = S.findIndex((v) => v > y + 4);
    else for (let k = S.length - 1; k >= 0; k--) if (S[k] < y - 4) { to = k; break; }
    if (to < 0) return false;
    const from = dir > 0 ? Math.max(0, to - 1) : to;
    animating = true;
    animateTo(S[to], DUR[Math.min(DUR.length - 1, from)], () => { animating = false; settleUntil = performance.now() + 380; });
    return true;
  }
  const inZone = (dir) => {
    const end = stops()[4], y = window.scrollY;
    return dir > 0 ? y < end - 4 : y <= end + 4 && y > 4;
  };
  if (!reduce) {
    window.addEventListener('wheel', (e) => {
      const dir = Math.sign(e.deltaY);
      if (!dir || !inZone(dir)) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      const now = performance.now(), gap = now - lastWheel;
      lastWheel = now;
      // dokunmatik yüzeyin süren ataleti yeni bir kaydırma sayılmaz
      if (animating || now < settleUntil || (gap < 140 && now < settleUntil + 600)) return;
      if (Math.abs(e.deltaY) < 3) return;
      page(dir);
    }, { passive: false, capture: true });
    let ty = null;
    window.addEventListener('touchstart', (e) => { ty = e.touches[0].clientY; }, { passive: true });
    window.addEventListener('touchmove', (e) => {
      if (ty === null) return;
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
      if (e.target.closest('input, textarea, select')) return;
      const dir = ['ArrowDown', 'PageDown', ' '].includes(e.key) ? 1 : ['ArrowUp', 'PageUp'].includes(e.key) ? -1 : 0;
      if (!dir || !inZone(dir)) return;
      e.preventDefault();
      if (!animating) page(dir);
    });
  }
  // kaydırma başına en fazla bir hesaplama (her karede bir)
  let queued = false;
  window.addEventListener('scroll', () => { if (queued) return; queued = true; requestAnimationFrame(() => { queued = false; update(); }); }, { passive: true });
  window.addEventListener('resize', update);

  // tıklama alanında "3D İncele" etiketi imleci izler
  const hit = $('#productHit'), label = $('#hitLabel');
  hit.addEventListener('pointermove', (e) => { const r = hit.getBoundingClientRect(); label.style.transform = `translate(${e.clientX - r.left}px, ${e.clientY - r.top}px)`; });
  hit.addEventListener('pointerenter', () => hit.classList.add('hover'));
  hit.addEventListener('pointerleave', () => hit.classList.remove('hover'));

  import('../scene.js').then(({ createScene }) => {
    scene = createScene($('#gl'), STREAM, null, $('#juice'));
    scene.ready.then(() => { scene.setActive(false); update(); });
  }).catch(() => {});
}
