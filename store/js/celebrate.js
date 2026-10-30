// Sipariş kutlaması: tam ekran sahnede pijama kollu bir el, ürünlerin girdiği SESA KIDS çantasını
// uzaktan kameraya doğru uzatır; çanta sapından sallanır, konfeti saçılır ve kısa bir "ta-da" çalar.
import { bagMarkup, bagWhoosh } from './bag.js';

let ac = null;
const escC = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
function tada() {
  try {
    ac = ac || new (window.AudioContext || window.webkitAudioContext)();
    if (ac.state === 'suspended') ac.resume();
    const t = ac.currentTime + 0.02;
    const out = ac.createGain();
    out.gain.value = 0.2;
    out.connect(ac.destination);
    // Yükselen arpej (Do-Mi-Sol-Do) + parıltı
    [[1046.5, 0], [1318.5, 0.09], [1568, 0.18], [2093, 0.27], [2637, 0.36]].forEach(([f, d], k) => {
      for (const [type, gain, mul] of [['triangle', 0.7, 1], ['sine', 0.18, 2]]) {
        const o = ac.createOscillator();
        const g = ac.createGain();
        o.type = type;
        o.frequency.value = f * mul;
        const len = k === 4 ? 1.4 : 0.55;
        g.gain.setValueAtTime(0.0001, t + d);
        g.gain.exponentialRampToValueAtTime(gain, t + d + 0.015);
        g.gain.exponentialRampToValueAtTime(0.0001, t + d + len);
        o.connect(g).connect(out);
        o.start(t + d);
        o.stop(t + d + len + 0.05);
      }
    });
  } catch (e) { /* ses yoksa sessiz */ }
}

// El: tutuş noktası (60, 60); kol sağ alta doğru uzanır. Kol ucu pijama kolu (bilek manşetli).
const HAND = (sleeve, cuff) => `<svg class="cel-hand" viewBox="0 0 320 320" aria-hidden="true">
  <defs>
    <linearGradient id="celSkin" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffdcc4"/><stop offset="1" stop-color="#eeb48e"/></linearGradient>
    <linearGradient id="celSleeve" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${sleeve}"/><stop offset="1" stop-color="${cuff}"/></linearGradient>
    <pattern id="celStripe" patternUnits="userSpaceOnUse" width="14" height="14" patternTransform="rotate(45)"><rect width="7" height="14" fill="#fff" opacity=".22"/></pattern>
  </defs>
  <g stroke-linecap="round">
    <line x1="118" y1="118" x2="360" y2="360" stroke="url(#celSleeve)" stroke-width="84"/>
    <line x1="118" y1="118" x2="360" y2="360" stroke="url(#celStripe)" stroke-width="84"/>
    <line x1="104" y1="104" x2="122" y2="122" stroke="#fff" stroke-width="88"/>
    <line x1="104" y1="104" x2="122" y2="122" stroke="${cuff}" stroke-width="88" stroke-dasharray="3 5" opacity=".35"/>
    <line x1="74" y1="74" x2="100" y2="100" stroke="url(#celSkin)" stroke-width="54"/>
  </g>
  <g transform="rotate(-45 60 60)">
    <rect x="22" y="34" width="78" height="56" rx="26" fill="url(#celSkin)"/>
    <g fill="url(#celSkin)" stroke="#d99a74" stroke-width="1.6">
      <rect x="22" y="20" width="19" height="34" rx="9.5"/><rect x="41" y="17" width="19" height="36" rx="9.5"/>
      <rect x="60" y="18" width="19" height="35" rx="9.5"/><rect x="79" y="23" width="17" height="31" rx="8.5"/>
    </g>
    <path d="M30 26 h6 M49 23 h6 M68 24 h6 M85 28 h5" stroke="#fff" stroke-opacity=".55" stroke-width="2.4" stroke-linecap="round"/>
    <rect x="10" y="50" width="38" height="20" rx="10" fill="url(#celSkin)" stroke="#d99a74" stroke-width="1.6" transform="rotate(-24 29 60)"/>
  </g>
</svg>`;

export function createCelebration({ formatPrice }) {
  const el = document.createElement('div');
  el.className = 'cel';
  el.hidden = true;
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-modal', 'true');
  el.setAttribute('aria-labelledby', 'cel-h');
  document.body.append(el);
  let lastFocus = null;

  function close() {
    el.classList.remove('is-on');
    setTimeout(() => { el.hidden = true; el.innerHTML = ''; }, 300);
    lastFocus?.focus?.({ preventScroll: true });
  }
  el.addEventListener('click', (e) => { if (e.target.closest('[data-cel-close]')) close(); });
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && !el.hidden) close(); });

  function show({ order, phone, name = '', gender, thumbs = [] }) {
    lastFocus = document.activeElement;
    const bag = bagMarkup(gender);
    const first = String(name).trim().split(/\s+/)[0] || '';
    const conf = Array.from({ length: 34 }, (_, i) => {
      const c = ['#ffd45c', '#f59bd6', '#79c3f6', '#f9a25c', '#ffffff', '#9fe0b8'][i % 6];
      return `<i style="--x:${(Math.random() * 100).toFixed(1)}%;--d:${(Math.random() * 0.9).toFixed(2)}s;--r:${(Math.random() * 720 - 360).toFixed(0)}deg;--c:${c};--s:${(6 + Math.random() * 8).toFixed(0)}px;--t:${(2.6 + Math.random() * 1.6).toFixed(2)}s"></i>`;
    }).join('');
    el.innerHTML = `
      <div class="cel-bg"></div><div class="cel-rays"></div><div class="cel-conf">${conf}</div>
      <div class="cel-stage" style="${bag.vars}">
        <div class="cel-reach">
          <div class="cel-swing">
            <div class="cel-bag"><div class="cel-layer">${bag.back}</div>
              <div class="cel-peek">${thumbs.slice(0, 2).map((src) => `<img src="${src}" alt="">`).join('')}</div>
              <div class="cel-layer">${bag.front}</div></div>
          </div>
          ${HAND(bag.set.mid, bag.set.deep)}
        </div>
      </div>
      <div class="cel-copy">
        <p class="cel-thanks">Bizi tercih ettiğiniz için<br><em>teşekkür ederiz${first ? `, ${escC(first)}` : ''}!</em></p>
        <p class="cel-sub">Pijamalarınız özenle paketlenip yola çıkmak için hazırlanıyor. Tatlı rüyalar şimdiden 🌙</p>
        <div class="cel-card">
          <svg class="cel-check" viewBox="0 0 52 52" aria-hidden="true"><circle cx="26" cy="26" r="24"/><path d="M15 27l7 7 15-16"/></svg>
          <div><h2 id="cel-h">Siparişiniz alındı</h2>
          <p class="cel-no">Sipariş no <b>${order.id}</b> · Toplam <b>${formatPrice(order.total)}</b>${order.discount ? ` <span>(üye indirimi −${formatPrice(order.discount)})</span>` : ''}</p>
          <p class="cel-msg">Ödeme ve kargo bilgisi için <b>${escC(phone)}</b> numarasından size ulaşacağız.</p></div>
        </div>
        <div class="cel-actions"><button type="button" class="btn btn-ink cel-more" data-cel-close>Alışverişe devam</button></div>
      </div>`;
    el.hidden = false;
    fit();
    requestAnimationFrame(() => el.classList.add('is-on'));
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!reduced) bagWhoosh(0.9);
    setTimeout(tada, reduced ? 0 : 950);
    setTimeout(() => el.querySelector('.cel-more')?.focus({ preventScroll: true }), 1400);
  }
  // Geniş ekranda çanta solda büyük, kart sağda; ikisi birlikte ekranın ortasında durur.
  // Dar ekranda çanta kartın üstündeki boşluğa sığacak en büyük boyutta (üst üste binmez).
  function fit() {
    const stage = el.querySelector('.cel-stage');
    const copy = el.querySelector('.cel-copy');
    if (!stage || !copy) return;
    const W = innerWidth;
    const H = innerHeight;
    const wide = W >= 900 && H >= 520;
    el.classList.toggle('is-wide', wide);
    if (wide) {
      const cw = copy.offsetWidth;
      const gap = Math.max(24, W * 0.03);
      const k = Math.max(0.9, Math.min(1.85, (H * 0.6) / 288, (W - cw - gap * 3) / 240 / 1.15));
      const sw = 240 * k;
      const total = sw + gap + cw;
      const left = (W - total) / 2;
      stage.style.left = `${left + sw / 2}px`;
      stage.style.top = `${(H - 288 * k) / 2 + 288 * k * 0.1}px`; // el yukarıdan uzandığı için biraz aşağıda
      stage.style.scale = String(k);
      copy.style.left = `${left + sw + gap}px`;
      return;
    }
    stage.style.left = '';
    copy.style.left = '';
    const top = Math.max(16, H * 0.03);
    const room = copy.getBoundingClientRect().top - top - 14;
    const k = Math.max(0.5, Math.min(1.9, room / 300, (W - 24) / 240));
    stage.style.top = `${top + (room - 300 * k) / 2}px`;
    stage.style.scale = String(k);
  }
  addEventListener('resize', () => { if (!el.hidden) fit(); });
  return { show, close };
}
