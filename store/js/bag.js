// "Çantaya at" etkileşimi: ürün detayının altında bir SESA KIDS kese kâğıdı durur.
// Tutamacı aşağı kaydırınca çanta büyür, 3D model küçülüp çantanın içine düşer, çanta
// ortaya yükselir ve onay ekranı açılır. Klavyeyle (Enter/Boşluk/Aşağı ok) ya da
// "Sepete Ekle" düğmesiyle aynı animasyon oynatılır.

const TRACK = 64; // tutamacın aşağı inebileceği mesafe (px)
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

const BACK = `<svg viewBox="0 0 200 230" aria-hidden="true">
  <defs><linearGradient id="bagIn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c95aa3"/><stop offset="1" stop-color="#e98bc8"/></linearGradient></defs>
  <path d="M64 58 C60 4 140 4 136 58" fill="none" stroke="#f9a25c" stroke-width="9" stroke-linecap="round"/>
  <path d="M64 58 C60 4 140 4 136 58" fill="none" stroke="#ffd45c" stroke-width="3" stroke-linecap="round" stroke-dasharray="2 7"/>
  <path d="M30 52 H170 L182 224 H18 Z" fill="url(#bagIn)"/>
</svg>`;

const FRONT = `<svg viewBox="0 0 200 230" aria-hidden="true">
  <defs>
    <linearGradient id="bagFace" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffc4e8"/><stop offset=".55" stop-color="#f59bd6"/><stop offset="1" stop-color="#e87cc3"/></linearGradient>
    <linearGradient id="bagFold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd9ef"/><stop offset="1" stop-color="#f7b3df"/></linearGradient>
  </defs>
  <path d="M22 78 H178 L188 226 H12 Z" fill="url(#bagFace)"/>
  <path d="M22 78 H178 L180 96 H20 Z" fill="url(#bagFold)"/>
  <path d="M22 78 H178" stroke="#fff" stroke-opacity=".7" stroke-width="2"/>
  <path d="M150 96 L180 96 L188 226 L156 226 Z" fill="#c95aa3" opacity=".18"/>
  <path d="M12 226 H188" stroke="#c0509a" stroke-opacity=".35" stroke-width="3"/>
  <path d="M40 104 L36 214" stroke="#fff" stroke-opacity=".35" stroke-width="5" stroke-linecap="round"/>
  <g class="bag-logo">
    <text x="100" y="168" text-anchor="middle" font-family="Fredoka, sans-serif" font-weight="600" font-size="23" letter-spacing="1.5"><tspan fill="#2f7fd0">SESA</tspan><tspan fill="#fff" dx="7">KIDS</tspan></text>
    <g stroke-linecap="round" stroke-width="4.5" fill="none">
      <line x1="22" y1="150" x2="31" y2="155" stroke="#ffd45c"/><line x1="20" y1="162" x2="30" y2="162" stroke="#f9a25c"/><line x1="22" y1="174" x2="31" y2="169" stroke="#79c3f6"/>
      <line x1="178" y1="150" x2="169" y2="155" stroke="#79c3f6"/><line x1="180" y1="162" x2="170" y2="162" stroke="#f9a25c"/><line x1="178" y1="174" x2="169" y2="169" stroke="#ffd45c"/>
    </g>
  </g>
</svg>`;

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
    <p class="bag-title" role="status">Çantanda!</p>
    <p class="bag-sub"></p>
    <div class="bag-actions"><button class="btn btn-ink bag-go" type="button">Sepete git</button><button class="btn bag-more" type="button">Alışverişe devam</button></div>`;
  canvas.before(back);
  canvas.after(front, done);
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
    const fast = reduced();
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
    // 2) Çanta hafifçe zıplar, ortaya yükselir ve büyür
    front.classList.add('is-full');
    const lift = -(b.top + b.height / 2 - (m.top + m.height * 0.46));
    const rise = [
      { transform: `translate(-50%, ${-p * 34}px) scale(1.18)` },
      { transform: `translate(-50%, ${-p * 34 + 14}px) scale(1.24, 1.1)`, offset: 0.18 },
      { transform: `translate(-50%, ${lift}px) scale(1.7)` },
    ];
    const opts = { duration: fast ? 1 : 850, easing: 'cubic-bezier(.3,1.25,.5,1)', fill: 'forwards' };
    anims.push(back.animate(rise, opts), front.animate(rise, opts));
    await anims[anims.length - 1].finished.catch(() => {});
    // 3) Onay
    done.querySelector('.bag-sub').textContent = info.text || '';
    done.hidden = false;
    done.classList.remove('is-on');
    void done.offsetWidth;
    done.classList.add('is-on');
    done.querySelector('.bag-go').focus({ preventScroll: true });
    busy = false;
  }

  function reset() {
    anims.forEach((a) => a.cancel());
    anims = [];
    busy = false;
    dragging = false;
    detail.classList.remove('is-ordering');
    front.classList.remove('is-full');
    done.hidden = true;
    done.classList.remove('is-on');
    setP(0);
  }
  done.querySelector('.bag-more').addEventListener('click', () => {
    reset();
    canvas.animate([{ opacity: 0, transform: 'scale(.92)' }, { opacity: 1, transform: 'scale(1)' }], { duration: 500, easing: 'cubic-bezier(.2,.8,.2,1)' });
    pull.focus({ preventScroll: true });
  });
  done.querySelector('.bag-go').addEventListener('click', () => { reset(); hooks.onOpenCart?.(); });
  setP(0);
  return { play, reset };
}
