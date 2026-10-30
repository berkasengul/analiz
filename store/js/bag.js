// "Çantaya at" etkileşimi: ürün detayının altında bir SESA KIDS kese kâğıdı durur.
// Tutamacı aşağı kaydırınca çanta büyür, 3D model küçülüp çantanın içine düşer, çanta
// ortaya yükselir ve onay ekranı açılır. Klavyeyle (Enter/Boşluk/Aşağı ok) ya da
// "Sepete Ekle" düğmesiyle aynı animasyon oynatılır.

const TRACK = 64; // tutamacın aşağı inebileceği mesafe (px)
// Çanta ortaya oturduğunda kısa, yumuşak bir "ding" (Web Audio; ses dosyası gerekmez)
let audioCtx = null;
function chime() {
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const ac = audioCtx;
    if (ac.state === 'suspended') ac.resume();
    const t = ac.currentTime + 0.01;
    const out = ac.createGain();
    out.gain.value = 0.22;
    out.connect(ac.destination);
    // İki nota (Mi6, Si6) ve hafif üst ton: çan benzeri, kısa sönümlü
    [[1318.5, 0, 0.9], [1975.5, 0.09, 1.1], [2637, 0.09, 0.5]].forEach(([f, d, len], k) => {
      const o = ac.createOscillator();
      const g = ac.createGain();
      o.type = k === 2 ? 'sine' : 'triangle';
      o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t + d);
      g.gain.exponentialRampToValueAtTime(k === 2 ? 0.25 : 0.8, t + d + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t + d + len);
      o.connect(g).connect(out);
      o.start(t + d);
      o.stop(t + d + len + 0.05);
    });
  } catch (e) { /* ses desteklenmiyorsa sessiz geç */ }
}
// Yükselirken hafif bir "vuuş" (filtrelenmiş gürültü)
export function bagWhoosh(dur) {
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const ac = audioCtx;
    if (ac.state === 'suspended') ac.resume();
    const len = Math.floor(ac.sampleRate * dur);
    const buf = ac.createBuffer(1, len, ac.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.sin((i / len) * Math.PI);
    const src = ac.createBufferSource();
    src.buffer = buf;
    const f = ac.createBiquadFilter();
    f.type = 'bandpass';
    f.Q.value = 0.8;
    f.frequency.setValueAtTime(400, ac.currentTime);
    f.frequency.exponentialRampToValueAtTime(2200, ac.currentTime + dur);
    const g = ac.createGain();
    g.gain.value = 0.06;
    src.connect(f).connect(g).connect(ac.destination);
    src.start();
  } catch (e) { /* yok say */ }
}
const bagReduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

// Lüks butik çantası (önden): mat pastel kâğıt dokusu, altın varak kabartma logo, ince ip saplar,
// sapta saten fiyonklu hediye kartı. Renkler takıma göre (--bag-*): erkekte mavi, kızda pembe.
const BACK = `<svg viewBox="0 0 200 240" aria-hidden="true">
  <defs>
    <linearGradient id="bagIn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--bag-deep)"/><stop offset="1" style="stop-color:var(--bag-mid)"/></linearGradient>
    <linearGradient id="bagRopeB" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#cbb48c"/><stop offset=".5" stop-color="#ead9b8"/><stop offset="1" stop-color="#bfa57a"/></linearGradient>
  </defs>
  <path d="M74 62 C70 6 130 6 126 62" fill="none" stroke="url(#bagRopeB)" stroke-width="4.2" stroke-linecap="round"/>
  <path d="M26 56 H174 L176 74 H24 Z" fill="url(#bagIn)"/>
  <path d="M24 66 H176 V74 H24 Z" fill="#000" opacity=".18"/>
  <g class="bag-tissue">
    <path d="M40 72 C42 50 50 36 66 26 C72 42 80 56 88 72 Z" style="fill:var(--bag-tissue)"/>
    <path d="M114 72 C120 50 134 36 152 30 C154 46 160 60 164 72 Z" style="fill:var(--bag-tissue)"/>
    <path d="M70 72 C74 44 88 22 106 12 C118 30 128 50 132 72 Z" fill="#ffffff"/>
    <path d="M88 72 C94 52 108 38 124 32 C126 48 130 62 132 72 Z" fill="#fbf7f2"/>
  </g>
</svg>`;

const FRONT = `<svg viewBox="0 0 200 240" aria-hidden="true">
  <defs>
    <linearGradient id="bagBase" x1="0" y1="0" x2="1" y2="1"><stop offset="0" style="stop-color:var(--bag-light)"/><stop offset=".6" style="stop-color:var(--bag-mid)"/><stop offset="1" style="stop-color:var(--bag-deep)"/></linearGradient>
    <linearGradient id="bagVig" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#000" stop-opacity=".16"/><stop offset=".1" stop-color="#000" stop-opacity="0"/><stop offset=".55" stop-color="#fff" stop-opacity=".12"/><stop offset=".9" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".2"/></linearGradient>
    <linearGradient id="bagFoot" x1="0" y1="0" x2="0" y2="1"><stop offset=".8" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".16"/></linearGradient>
    <linearGradient id="bagFoil" gradientUnits="userSpaceOnUse" x1="40" y1="130" x2="160" y2="185"><stop offset="0" stop-color="#fff4c9"/><stop offset=".35" stop-color="#e9c46a"/><stop offset=".6" stop-color="#c8963a"/><stop offset="1" stop-color="#f2d48a"/></linearGradient>
    <linearGradient id="bagRope" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#e2cfa8"/><stop offset=".5" stop-color="#fffaf0"/><stop offset="1" stop-color="#d6bf93"/></linearGradient>
    <radialGradient id="bagGold" cx=".35" cy=".35" r=".7"><stop offset="0" stop-color="#fff3c4"/><stop offset=".55" stop-color="#e2b354"/><stop offset="1" stop-color="#9c6f1c"/></radialGradient>
    <linearGradient id="bagRibbon" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--bag-ribbon-hi)"/><stop offset=".5" style="stop-color:var(--bag-ribbon)"/><stop offset="1" style="stop-color:var(--bag-ribbon-hi)"/></linearGradient>
    <linearGradient id="bagSheen" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".5"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
    <filter id="bagGrain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="1.6" numOctaves="2" seed="3"/><feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 .09 0"/><feComposite in2="SourceGraphic" operator="in"/></filter>
    <filter id="bagEmboss" x="-10%" y="-30%" width="120%" height="160%"><feDropShadow dx="0" dy="-.6" stdDeviation=".3" flood-color="#fff" flood-opacity=".7"/><feDropShadow dx="0" dy=".9" stdDeviation=".5" flood-color="#5a3d0c" flood-opacity=".45"/></filter>
    <clipPath id="bagClip"><rect x="24" y="62" width="152" height="170" rx="3"/></clipPath>
  </defs>
  <g clip-path="url(#bagClip)">
    <rect x="24" y="62" width="152" height="170" fill="url(#bagBase)"/>
    <rect x="24" y="62" width="152" height="170" fill="#fff" filter="url(#bagGrain)"/>
    <rect class="bag-glint" x="-40" y="62" width="40" height="170" fill="url(#bagSheen)" transform="skewX(-16)"/>
    <rect x="24" y="62" width="152" height="170" fill="url(#bagVig)"/>
    <rect x="24" y="62" width="152" height="170" fill="url(#bagFoot)"/>
    <path d="M24 62 H176 V78 H24 Z" fill="#fff" opacity=".22"/>
    <path d="M24 78 H176" stroke="#000" stroke-opacity=".1" stroke-width="1"/>
    <path d="M36 232 L44 214 L156 214 L164 232" fill="none" stroke="#000" stroke-opacity=".07" stroke-width="1.2"/>
  </g>
  <path d="M24 62 H176" stroke="#fff" stroke-opacity=".75" stroke-width="1.2"/>
  <path d="M72 70 C66 4 134 4 128 70" fill="none" stroke="url(#bagRope)" stroke-width="4.6" stroke-linecap="round"/>
  <path d="M72 70 C66 4 134 4 128 70" fill="none" stroke="#b49768" stroke-width="4.6" stroke-dasharray="1.6 2.6" opacity=".45"/>
  <g><circle cx="72" cy="70" r="4.2" fill="url(#bagGold)"/><circle cx="72" cy="70" r="1.6" fill="#4a3208"/><circle cx="128" cy="70" r="4.2" fill="url(#bagGold)"/><circle cx="128" cy="70" r="1.6" fill="#4a3208"/></g>
  <g class="bag-logo">
    <image href="assets/brand/logo-wordmark.png" x="27" y="126" width="146" height="31.3" preserveAspectRatio="xMidYMid meet"/>
    <path d="M74 166 H126" stroke="url(#bagFoil)" stroke-width="1.1"/>
    <text x="100" y="178" text-anchor="middle" font-family="Nunito, sans-serif" font-weight="800" font-size="7" letter-spacing="2.6" style="fill:var(--bag-ribbon)" paint-order="stroke" stroke="#fff" stroke-width="2" stroke-opacity=".7">PİJAMA BUTİĞİ</text>
  </g>
  <g class="bag-bow">
    <path d="M128 72 C140 62 156 66 152 76 C149 83 136 80 128 72 Z" fill="url(#bagRibbon)"/>
    <path d="M128 72 C120 60 106 62 108 72 C110 80 122 78 128 72 Z" fill="url(#bagRibbon)"/>
    <path d="M127 74 L122 96 L127 93 L130 98 L130 75 Z" style="fill:var(--bag-ribbon)"/>
    <path d="M130 74 L140 92 L134 91 L133 96 L130 75 Z" style="fill:var(--bag-ribbon)"/>
    <circle cx="128.5" cy="73" r="3.6" style="fill:var(--bag-ribbon)"/>
    <g class="bag-tag" transform="translate(140 88) rotate(14)">
      <path d="M-3 -6 L0 2" stroke="#d8c39a" stroke-width="1"/>
      <path d="M-8 2 H14 V30 H-8 Z" fill="#fffdf8"/><circle cx="3" cy="6" r="1.4" style="fill:var(--bag-deep)"/>
      <text x="3" y="18" text-anchor="middle" font-family="Quicksand, sans-serif" font-weight="600" font-size="6" style="fill:var(--bag-deep)">SK</text>
      <path d="M-4 23 H10" stroke="url(#bagFoil)" stroke-width=".8"/>
    </g>
  </g>
</svg>`;

// Çanta setleri: erkek takımlarda mavi, kız takımlarda pembe
const BAG_SETS = {
  erkek: { light: '#dde9fb', mid: '#8fb2ea', deep: '#4a70bd', ribbon: '#25408a', ribbonHi: '#6d8fd8', tissue: '#f2f7ff' },
  kiz: { light: '#fde3ef', mid: '#f0a7cb', deep: '#cc679f', ribbon: '#a8326f', ribbonHi: '#ee8fc1', tissue: '#fff3f9' },
};

// Başka sahnelerde (sipariş kutlaması) aynı çantayı çizmek için: arka + ön katman ve renk seti
export function bagMarkup(gender) {
  const set = BAG_SETS[gender === 'erkek' ? 'erkek' : 'kiz'];
  const vars = `--bag-light:${set.light};--bag-mid:${set.mid};--bag-deep:${set.deep};--bag-ribbon:${set.ribbon};--bag-ribbon-hi:${set.ribbonHi};--bag-tissue:${set.tissue}`;
  // Aynı sayfada iki çanta olunca SVG tanım kimlikleri çakışmasın (gizli çantanın tanımı seçilmesin)
  const uniq = (svg) => svg.replace(/id="([^"]+)"/g, 'id="$1Cel"').replace(/url\(#([^)]+)\)/g, 'url(#$1Cel)');
  return { vars, back: uniq(BACK), front: uniq(FRONT), set };
}

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
    // Ölçmeden önce içerik doldurulur (sonradan eklenen satırlar boşluğu daraltmasın)
    done.querySelector('.bag-sub').textContent = info.text || '';
    done.querySelector('.bag-cart').innerHTML = info.count ? `Sepetinde <b>${info.count} ürün</b> · Toplam <b>${info.total}</b>` : '';
    const picks = info.picks || [];
    ups.querySelector('.bag-ups').innerHTML = picks.map((x) => `<button type="button" data-pick="${x.id}"><img src="${x.img}" alt=""><span><b>${x.name}</b><i>${x.price}</i></span></button>`).join('');
    // Onay metni ve öneriler için yer ayır: çanta ikisinin arasına sığacak şekilde ölçeklenir
    done.hidden = false; done.style.visibility = 'hidden'; done.classList.remove('is-on');
    ups.hidden = false; ups.style.visibility = 'hidden';
    const topLimit = done.getBoundingClientRect().bottom + 18;
    const botLimit = (info.picks?.length && m.height >= 620 ? ups.getBoundingClientRect().top - 30 : m.bottom - 8);
    done.hidden = true; done.style.visibility = '';
    ups.hidden = true; ups.style.visibility = '';
    const room = Math.max(120, botLimit - topLimit);
    // Ölçüler çantanın doğal (dönüşümsüz) boyundan: alt kenar orijinli ölçekte üst = alt − h0·fit
    const h0 = front.offsetHeight || b.height;
    const w0 = front.offsetWidth || b.width;
    const fit = Math.min(small ? 1.9 : 2.3, (room - 16) / h0, (m.width * 0.6) / w0);
    const y0 = -p * 34;
    const B0 = b.bottom - y0; // çantanın dönüşümsüz alt kenarı
    const lift = topLimit + (room + h0 * fit) / 2 - B0;
    const tf = (y, r, sx, sy = sx) => `translate(-50%, ${y}px) perspective(900px) rotateY(${r}deg) scale(${sx}, ${sy})`;
    const rise = [
      { transform: tf(y0, 0, 1.18) },
      { transform: tf(y0 + 12, 0, 1.26, 1.08), offset: 0.14 },
      { transform: tf(lift - 26, -18, fit * 1.07), offset: 0.55 },
      { transform: tf(lift + 6, 7, fit * 0.97), offset: 0.8 },
      { transform: tf(lift, -4, fit) },
    ];
    const opts = { duration: fast ? 1 : 1300, easing: 'cubic-bezier(.22,.9,.25,1)', fill: 'forwards' };
    anims.push(back.animate(rise, opts), front.animate(rise, opts));
    if (!fast) { bagWhoosh(0.7); setTimeout(() => burst(m, lift, b), 760); }
    setTimeout(chime, fast ? 0 : 1040);
    await anims[anims.length - 1].finished.catch(() => {});
    // Havada yavaş salınım: ayrı 'translate' özelliğinde, böylece yukarıdaki transform'u ezmez
    // (composite:'add' desteklemeyen iOS'ta çanta bu yüzden aşağıda kalıyordu)
    if (!fast) for (const el of [back, front]) anims.push(el.animate([{ translate: '0 0' }, { translate: '0 -7px' }], { duration: 2400, iterations: Infinity, direction: 'alternate', easing: 'ease-in-out' }));
    // 3) Onay ve satışa yönlendirme
    done.hidden = false;
    done.classList.remove('is-on');
    void done.offsetWidth;
    done.classList.add('is-on');
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
