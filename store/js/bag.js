// "Çantaya at" etkileşimi: ürün detayının altında bir SESA KIDS kese kâğıdı durur.
// Tutamacı aşağı kaydırınca çanta büyür, 3D model küçülüp çantanın içine düşer, çanta
// ortaya yükselir ve onay ekranı açılır. Klavyeyle (Enter/Boşluk/Aşağı ok) ya da
// "Sepete Ekle" düğmesiyle aynı animasyon oynatılır.

const TRACK = 64; // tutamacın aşağı inebileceği mesafe (px)
const bagReduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

// Premium butik çantası, 3/4 açıdan: ön yüz + katlanma çizgili yan körük, ön ve arka ip sap,
// altın varak çerçeve ve etiket. Renkler takıma göre (--bag-*): erkekte mavi, kızda pembe.
const BACK = `<svg viewBox="0 0 240 240" aria-hidden="true">
  <defs>
    <linearGradient id="bagIn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--bag-deep)"/><stop offset="1" style="stop-color:var(--bag-mid)"/></linearGradient>
    <linearGradient id="bagRopeB" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#d9c6a4"/><stop offset=".5" stop-color="#f3e6cf"/><stop offset="1" stop-color="#cdb791"/></linearGradient>
  </defs>
  <path d="M90 66 C86 2 190 -4 190 58" fill="none" stroke="url(#bagRopeB)" stroke-width="6" stroke-linecap="round"/>
  <path d="M34 52 L206 44 L214 58 L170 70 L20 70 Z" fill="url(#bagIn)"/>
  <path d="M20 70 L170 70 L214 58 L210 52 L168 62 L26 62 Z" fill="#000" opacity=".22"/>
  <g class="bag-tissue">
    <path d="M42 72 C44 46 54 30 70 20 C76 38 86 52 94 72 Z" style="fill:var(--bag-tissue)"/>
    <path d="M128 70 C134 46 150 30 170 24 C172 42 178 56 182 66 Z" style="fill:var(--bag-tissue)"/>
    <path d="M78 72 C82 40 98 16 116 6 C128 24 138 46 142 70 Z" fill="#ffffff"/>
    <path d="M96 72 C102 50 116 34 132 28 C134 46 138 60 140 70 Z" fill="#fdf6fa"/>
  </g>
</svg>`;

const FRONT = `<svg viewBox="0 0 240 240" aria-hidden="true">
  <defs>
    <clipPath id="bagClip"><path d="M20 70 L170 70 L176 228 L14 228 Z"/></clipPath>
    <linearGradient id="bagBase" x1="0" y1="0" x2="1" y2="1"><stop offset="0" style="stop-color:var(--bag-light)"/><stop offset=".55" style="stop-color:var(--bag-mid)"/><stop offset="1" style="stop-color:var(--bag-deep)"/></linearGradient>
    <linearGradient id="bagSide" x1="0" y1="0" x2="1" y2="0"><stop offset="0" style="stop-color:var(--bag-deep)"/><stop offset=".5" style="stop-color:var(--bag-mid)"/><stop offset="1" style="stop-color:var(--bag-deep)"/></linearGradient>
    <linearGradient id="bagLight" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity=".34"/><stop offset=".35" stop-color="#fff" stop-opacity=".05"/><stop offset="1" stop-color="#000" stop-opacity=".12"/></linearGradient>
    <linearGradient id="bagShade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity=".16"/><stop offset=".12" stop-color="#000" stop-opacity="0"/><stop offset=".86" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".16"/></linearGradient>
    <linearGradient id="bagCuff" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fffdf8"/><stop offset="1" stop-color="#f1e8da"/></linearGradient>
    <linearGradient id="bagCuffS" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#efe5d4"/><stop offset="1" stop-color="#ddd0bb"/></linearGradient>
    <linearGradient id="bagFoil" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff1bf"/><stop offset=".45" stop-color="#e2b354"/><stop offset="1" stop-color="#b9862a"/></linearGradient>
    <linearGradient id="bagRope" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ead9ba"/><stop offset=".5" stop-color="#fffaf0"/><stop offset="1" stop-color="#dcc7a2"/></linearGradient>
    <radialGradient id="bagGold" cx=".35" cy=".35" r=".7"><stop offset="0" stop-color="#fff3c4"/><stop offset=".55" stop-color="#e8b84e"/><stop offset="1" stop-color="#a87a1e"/></radialGradient>
    <pattern id="bagStars" patternUnits="userSpaceOnUse" width="34" height="34" patternTransform="rotate(-12)">
      <path d="M8 5 l1.3 3 3.2.4 -2.4 2.1 .7 3.1 -2.8-1.6 -2.8 1.6 .7-3.1 -2.4-2.1 3.2-.4z" fill="#fff" opacity=".16"/>
      <circle cx="25" cy="24" r="1.4" fill="#fff" opacity=".2"/><circle cx="26" cy="8" r=".9" fill="#fff" opacity=".18"/>
    </pattern>
    <linearGradient id="bagRibbon" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--bag-ribbon-hi)"/><stop offset=".5" style="stop-color:var(--bag-ribbon)"/><stop offset="1" style="stop-color:var(--bag-ribbon-hi)"/></linearGradient>
    <linearGradient id="bagSheen" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".55"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
    <filter id="bagSoft" x="-20%" y="-20%" width="140%" height="160%"><feDropShadow dx="0" dy="2" stdDeviation="2.5" flood-color="#2b2f6b" flood-opacity=".22"/></filter>
  </defs>
  <path d="M170 70 L214 58 L222 212 L176 228 Z" fill="url(#bagSide)"/>
  <path d="M170 70 L192 82 L214 58 Z" fill="#000" opacity=".22"/>
  <path d="M192 82 L199 221" stroke="#fff" stroke-opacity=".22" stroke-width="1.2"/>
  <path d="M192 82 L176 228 M192 82 L222 212" stroke="#000" stroke-opacity=".08" stroke-width="1"/>
  <g clip-path="url(#bagClip)">
    <rect x="0" y="66" width="200" height="170" fill="url(#bagBase)"/>
    <rect x="0" y="66" width="200" height="170" fill="url(#bagStars)"/>
    <rect class="bag-glint" x="-70" y="66" width="44" height="170" fill="url(#bagSheen)" transform="skewX(-18)"/>
    <rect x="0" y="66" width="200" height="170" fill="url(#bagLight)"/>
    <rect x="0" y="66" width="200" height="170" fill="url(#bagShade)"/>
  </g>
  <path d="M27 100 L163 100 L168.4 220 L21.6 220 Z" fill="none" stroke="url(#bagFoil)" stroke-width="1.3" opacity=".9"/>
  <path d="M170 70 L214 58 L215 79 L171 92 Z" fill="url(#bagCuffS)"/>
  <path d="M20 70 H170 L171 92 H19 Z" fill="url(#bagCuff)"/>
  <path d="M19 92 H171 L215 79" stroke="#000" stroke-opacity=".12" stroke-width="1.4" fill="none"/>
  <path d="M20 70 H170 L214 58" stroke="#fff" stroke-width="1.3" fill="none"/>
  <path d="M58 84 C52 14 132 12 130 84" fill="none" stroke="url(#bagRope)" stroke-width="6.5" stroke-linecap="round"/>
  <path d="M58 84 C52 14 132 12 130 84" fill="none" stroke="#bfa47a" stroke-width="6.5" stroke-dasharray="2.2 3.4" opacity=".5"/>
  <g><circle cx="58" cy="82" r="5" fill="url(#bagGold)"/><circle cx="58" cy="82" r="2" fill="#5a3d0c"/><circle cx="130" cy="82" r="5" fill="url(#bagGold)"/><circle cx="130" cy="82" r="2" fill="#5a3d0c"/></g>
  <g class="bag-bow">
    <path d="M94 82 C82 68 64 70 66 80 C67 88 84 88 94 82 Z" fill="url(#bagRibbon)"/>
    <path d="M94 82 C106 68 124 70 122 80 C121 88 104 88 94 82 Z" fill="url(#bagRibbon)"/>
    <path d="M91 84 L82 102 L88 100 L91 106 L94 86 Z" style="fill:var(--bag-ribbon)"/>
    <path d="M97 84 L106 102 L100 100 L97 106 L94 86 Z" style="fill:var(--bag-ribbon)"/>
    <rect x="89.5" y="77.5" width="9" height="9" rx="3" style="fill:var(--bag-ribbon)"/>
    <path d="M72 77 C78 74 86 76 90 80" stroke="#fff" stroke-opacity=".45" stroke-width="1.4" fill="none" stroke-linecap="round"/>
  </g>
  <g class="bag-logo" filter="url(#bagSoft)">
    <rect x="41" y="130" width="108" height="48" rx="12" fill="#fff" stroke="url(#bagFoil)" stroke-width="1.4"/>
    <text x="95" y="157" text-anchor="middle" font-family="Fredoka, sans-serif" font-weight="600" font-size="17" letter-spacing="1.2"><tspan fill="#3b8fe0">SESA</tspan><tspan fill="#ea6db8" dx="5">KIDS</tspan></text>
    <text x="95" y="169" text-anchor="middle" font-family="Nunito, sans-serif" font-weight="800" font-size="5.6" letter-spacing="1.6" fill="#8a8fb8">PİJAMA BUTİĞİ</text>
    <g stroke-linecap="round" stroke-width="2.6" fill="none">
      <line x1="48" y1="146" x2="53" y2="149" stroke="#ffd45c"/><line x1="47" y1="153" x2="52.5" y2="153" stroke="#f9a25c"/><line x1="48" y1="160" x2="53" y2="157" stroke="#79c3f6"/>
      <line x1="142" y1="146" x2="137" y2="149" stroke="#79c3f6"/><line x1="143" y1="153" x2="137.5" y2="153" stroke="#f9a25c"/><line x1="142" y1="160" x2="137" y2="157" stroke="#ffd45c"/>
    </g>
  </g>
  <path d="M14 228 H176 L222 212" stroke="#000" stroke-opacity=".18" stroke-width="2" fill="none"/>
</svg>`;

// Çanta setleri: erkek takımlarda mavi, kız takımlarda pembe
const BAG_SETS = {
  erkek: { light: '#d6e9ff', mid: '#6ea6ea', deep: '#2c5aa8', ribbon: '#1f3d86', ribbonHi: '#5b86d6', tissue: '#eaf4ff' },
  kiz: { light: '#ffdcef', mid: '#f39bd2', deep: '#c94594', ribbon: '#b0306f', ribbonHi: '#f18cc4', tissue: '#fff0f8' },
};

export function createBag(media, canvas, hooks = {}) {
  const back = document.createElement('div');
  back.className = 'bag bag-back';
  back.innerHTML = BACK;
  const front = document.createElement('div');
  front.className = 'bag bag-front';
  front.innerHTML = `${FRONT}
    <button class="bag-pull" type="button" aria-label="Çantaya at: tutamacı aşağı kaydırın ya da Enter'a basın">
      <span class="bag-knob"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 8h12l-1 12H7z"/><path d="M9 8V7a3 3 0 0 1 6 0v1"/></svg><i></i><i></i><i></i></span>
    </button>
    <span class="bag-tip">Aşağı kaydır · Çantaya at</span>`;
  const done = document.createElement('div');
  done.className = 'bag-done';
  done.hidden = true;
  done.innerHTML = `
    <svg class="bag-check" viewBox="0 0 52 52" aria-hidden="true"><circle cx="26" cy="26" r="24"/><path d="M15 27l7 7 15-16"/></svg>
    <p class="bag-title" role="status">Sepete eklendi</p>
    <p class="bag-sub"></p>
    <p class="bag-cart"></p>
    <div class="bag-actions"><button class="btn btn-ink bag-go" type="button">Siparişi tamamla <span aria-hidden="true">→</span></button><button class="btn bag-more" type="button">Alışverişe devam</button></div>`;
  const ups = document.createElement('div');
  ups.className = 'bag-upsell';
  ups.hidden = true;
  ups.innerHTML = '<p>Bunlara da göz at</p><div class="bag-ups"></div>';
  const spot = document.createElement('div');
  spot.className = 'bag-spot';
  spot.setAttribute('aria-hidden', 'true');
  const sparks = document.createElement('div');
  sparks.className = 'bag-sparks';
  sparks.setAttribute('aria-hidden', 'true');
  canvas.before(spot, back);
  canvas.after(front, sparks, done, ups);
  ups.addEventListener('click', (e) => { const b = e.target.closest('[data-pick]'); if (b) hooks.onPick?.(b.dataset.pick); });
  const pull = front.querySelector('.bag-pull');
  const knob = front.querySelector('.bag-knob');
  const detail = media.closest('.detail');
  let p = 0;
  let busy = false;
  let anims = [];

  function setP(v, smooth = false) {
    p = Math.max(0, Math.min(1, v));
    for (const el of [back, front]) {
      el.style.transition = smooth ? 'transform .45s cubic-bezier(.3,1.4,.5,1)' : 'none';
      el.style.transform = `translate(-50%, ${-p * 34}px) scale(${1 + p * 0.18})`;
    }
    knob.style.transition = smooth ? 'transform .45s cubic-bezier(.3,1.4,.5,1)' : 'none';
    knob.style.transform = `translateY(${p * TRACK}px)`;
    front.classList.toggle('is-ready', p > 0.75);
  }

  function refuse() {
    pull.classList.remove('shake');
    void pull.offsetWidth;
    pull.classList.add('shake');
    hooks.onNeedSize?.();
  }

  // Sürükleme
  let startY = 0;
  let dragging = false;
  pull.addEventListener('pointerdown', (e) => {
    if (busy) return;
    if (hooks.canStart && !hooks.canStart()) { refuse(); return; }
    dragging = true;
    startY = e.clientY - p * TRACK;
    pull.setPointerCapture(e.pointerId);
    e.preventDefault();
  });
  pull.addEventListener('pointermove', (e) => { if (dragging) setP((e.clientY - startY) / TRACK); });
  const release = () => {
    if (!dragging) return;
    dragging = false;
    if (p > 0.75) complete(); else setP(0, true);
  };
  pull.addEventListener('pointerup', release);
  pull.addEventListener('pointercancel', release);
  pull.addEventListener('keydown', (e) => {
    if (['Enter', ' ', 'ArrowDown'].includes(e.key)) { e.preventDefault(); play(); }
  });
  pull.addEventListener('click', (e) => e.preventDefault()); // sürüklemeden sonraki tıklama

  // Tutamaç kendiliğinden iner (Sepete Ekle düğmesi ve klavye)
  function play() {
    if (busy) return;
    if (hooks.canStart && !hooks.canStart()) { refuse(); return; }
    busy = true;
    const t0 = performance.now();
    const step = (now) => {
      const k = Math.min(1, (now - t0) / 480);
      setP(k * k * (3 - 2 * k));
      if (k < 1) requestAnimationFrame(step); else { busy = false; complete(); }
    };
    requestAnimationFrame(step);
  }

  async function complete() {
    if (busy) return;
    busy = true;
    const info = hooks.onComplete?.() || {};
    detail.classList.add('is-ordering');
    const m = media.getBoundingClientRect();
    const b = front.getBoundingClientRect();
    const fast = bagReduced();
    // 1) Model küçülüp çantanın ağzına düşer
    const toX = b.left + b.width / 2 - (m.left + m.width / 2);
    const toY = b.top + b.height * 0.32 - (m.top + m.height / 2);
    const fall = canvas.animate([
      { transform: 'translate(0,0) scale(1)', opacity: 1 },
      { transform: `translate(${toX * 0.6}px, ${toY * 0.35 - 40}px) scale(.42)`, opacity: 1, offset: 0.45 },
      { transform: `translate(${toX}px, ${toY + 30}px) scale(.12)`, opacity: 0 },
    ], { duration: fast ? 1 : 900, easing: 'cubic-bezier(.55,0,.35,1)', fill: 'forwards' });
    anims.push(fall);
    await fall.finished.catch(() => {});
    // 2) Sinematik giriş: spot ışığı yanar, çanta esneyip dönerek ortaya süzülür
    front.classList.add('is-full');
    back.classList.add('is-full');
    media.classList.add('is-spot');
    const small = m.width < 560;
    const lift = -(b.top + b.height / 2 - (m.top + m.height * (small ? 0.7 : 0.6)));
    const y0 = -p * 34;
    const tf = (y, r, sx, sy = sx) => `translate(-50%, ${y}px) perspective(900px) rotateY(${r}deg) scale(${sx}, ${sy})`;
    const rise = [
      { transform: tf(y0, 0, 1.18) },
      { transform: tf(y0 + 12, 0, 1.26, 1.08), offset: 0.14 },
      { transform: tf(lift - 26, -18, small ? 1.4 : 1.64), offset: 0.55 },
      { transform: tf(lift + 6, 7, small ? 1.28 : 1.5), offset: 0.8 },
      { transform: tf(lift, -4, small ? 1.32 : 1.54) },
    ];
    const opts = { duration: fast ? 1 : 1300, easing: 'cubic-bezier(.22,.9,.25,1)', fill: 'forwards' };
    anims.push(back.animate(rise, opts), front.animate(rise, opts));
    if (!fast) setTimeout(() => burst(m, lift, b), 760);
    await anims[anims.length - 1].finished.catch(() => {});
    // Havada yavaş salınım
    if (!fast) for (const el of [back, front]) anims.push(el.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(-7px)' }], { duration: 2400, iterations: Infinity, direction: 'alternate', easing: 'ease-in-out', composite: 'add' }));
    // 3) Onay ve satışa yönlendirme
    done.querySelector('.bag-sub').textContent = info.text || '';
    done.querySelector('.bag-cart').innerHTML = info.count ? `Sepetinde <b>${info.count} ürün</b> · Toplam <b>${info.total}</b>` : '';
    done.hidden = false;
    done.classList.remove('is-on');
    void done.offsetWidth;
    done.classList.add('is-on');
    const picks = info.picks || [];
    ups.querySelector('.bag-ups').innerHTML = picks.map((x) => `<button type="button" data-pick="${x.id}"><img src="${x.img}" alt=""><span><b>${x.name}</b><i>${x.price}</i></span></button>`).join('');
    ups.hidden = !picks.length || media.clientHeight < 620;
    ups.classList.toggle('is-on', !ups.hidden);
    done.querySelector('.bag-go').focus({ preventScroll: true });
    busy = false;
  }

  // Çanta indiğinde marka renklerinde ışıltılar saçılır
  function burst(m, lift, b) {
    sparks.innerHTML = '';
    const cx = b.left + b.width / 2 - m.left;
    const cy = b.top + b.height / 2 - m.top + lift;
    const cols = ['#ffd45c', '#f59bd6', '#79c3f6', '#f9a25c', '#ffffff'];
    for (let i = 0; i < 18; i++) {
      const a = (i / 18) * Math.PI * 2 + Math.random() * 0.3;
      const r = 120 + Math.random() * 110;
      const el = document.createElement('i');
      el.className = i % 3 ? 'dot' : 'star';
      el.style.cssText = `left:${cx}px;top:${cy}px;--dx:${Math.cos(a) * r}px;--dy:${Math.sin(a) * r * 0.8 - 30}px;--c:${cols[i % cols.length]};animation-delay:${Math.random() * 0.12}s`;
      sparks.append(el);
    }
  }

  // Çantayı ürüne göre boya: erkek takımlarda mavi set, kız takımlarda pembe set
  function setProduct(prod) {
    const set = BAG_SETS[prod.gender === 'erkek' ? 'erkek' : 'kiz'];
    for (const el of [back, front]) {
      el.style.setProperty('--bag-light', set.light);
      el.style.setProperty('--bag-mid', set.mid);
      el.style.setProperty('--bag-deep', set.deep);
      el.style.setProperty('--bag-ribbon', set.ribbon);
      el.style.setProperty('--bag-ribbon-hi', set.ribbonHi);
      el.style.setProperty('--bag-tissue', set.tissue);
    }
  }
  function reset() {
    anims.forEach((a) => a.cancel());
    anims = [];
    busy = false;
    dragging = false;
    detail.classList.remove('is-ordering');
    media.classList.remove('is-spot');
    sparks.innerHTML = '';
    ups.hidden = true;
    ups.classList.remove('is-on');
    front.classList.remove('is-full');
    back.classList.remove('is-full');
    done.hidden = true;
    done.classList.remove('is-on');
    setP(0);
  }
  done.querySelector('.bag-more').addEventListener('click', () => {
    reset();
    canvas.animate([{ opacity: 0, transform: 'scale(.92)' }, { opacity: 1, transform: 'scale(1)' }], { duration: 500, easing: 'cubic-bezier(.2,.8,.2,1)' });
    pull.focus({ preventScroll: true });
  });
  done.querySelector('.bag-go').addEventListener('click', () => { reset(); hooks.onCheckout?.(); });
  setP(0);
  return { play, reset, setProduct };
}
