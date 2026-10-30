// "Çantaya at" etkileşimi: ürün detayının altında bir SESA KIDS kese kâğıdı durur.
// Tutamacı aşağı kaydırınca çanta büyür, 3D model küçülüp çantanın içine düşer, çanta
// ortaya yükselir ve onay ekranı açılır. Klavyeyle (Enter/Boşluk/Aşağı ok) ya da
// "Sepete Ekle" düğmesiyle aynı animasyon oynatılır.

const TRACK = 64; // tutamacın aşağı inebileceği mesafe (px)
const bagReduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

// Premium butik çantası. Renkler ürünün paletinden (--bag-*), ön yüz ürün çantaya düşünce
// o takımın kumaş deseniyle dolar (ürünün ön karesinden otomatik alınır).
const BACK = `<svg viewBox="0 0 200 230" aria-hidden="true">
  <defs>
    <linearGradient id="bagIn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--bag-deep)"/><stop offset="1" style="stop-color:var(--bag-mid)"/></linearGradient>
    <linearGradient id="bagRope" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#f3e3c8"/><stop offset=".5" stop-color="#fffaf0"/><stop offset="1" stop-color="#e6d2b0"/></linearGradient>
  </defs>
  <g fill="none" stroke-linecap="round">
    <path d="M64 92 C58 18 142 18 136 92" stroke="url(#bagRope)" stroke-width="6.5"/>
    <path d="M64 92 C58 18 142 18 136 92" stroke="#c9b48e" stroke-width="6.5" stroke-dasharray="2.2 3.4" opacity=".55"/>
  </g>
  <path d="M30 50 H170 L182 224 H18 Z" fill="url(#bagIn)"/>
  <path d="M30 50 H170 L168 60 H32 Z" fill="#000" opacity=".12"/>
  <g class="bag-tissue">
    <path d="M40 86 C42 60 50 44 64 34 C70 50 80 62 88 86 Z" style="fill:var(--bag-light)"/>
    <path d="M112 86 C118 62 132 46 150 40 C152 58 158 72 162 86 Z" style="fill:var(--bag-mid)" opacity=".85"/>
    <path d="M70 86 C74 56 88 34 104 24 C116 40 126 60 130 86 Z" fill="#ffffff"/>
    <path d="M86 86 C92 66 104 52 118 46 C120 62 124 74 126 86 Z" fill="#fdf3f8"/>
  </g>
</svg>`;

const FRONT = `<svg viewBox="0 0 200 230" aria-hidden="true">
  <defs>
    <clipPath id="bagClip"><path d="M22 74 H178 L188 226 H12 Z"/></clipPath>
    <linearGradient id="bagBase" x1="0" y1="0" x2="1" y2="1"><stop offset="0" style="stop-color:var(--bag-light)"/><stop offset=".6" style="stop-color:var(--bag-mid)"/><stop offset="1" style="stop-color:var(--bag-deep)"/></linearGradient>
    <linearGradient id="bagLight" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity=".32"/><stop offset=".35" stop-color="#fff" stop-opacity=".06"/><stop offset=".72" stop-color="#000" stop-opacity=".02"/><stop offset="1" stop-color="#000" stop-opacity=".22"/></linearGradient>
    <linearGradient id="bagShade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity=".18"/><stop offset=".12" stop-color="#000" stop-opacity="0"/><stop offset=".85" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".14"/></linearGradient>
    <linearGradient id="bagCuff" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fffdf8"/><stop offset="1" stop-color="#f4ece0"/></linearGradient>
    <radialGradient id="bagGold" cx=".35" cy=".35" r=".7"><stop offset="0" stop-color="#fff3c4"/><stop offset=".55" stop-color="#e8b84e"/><stop offset="1" stop-color="#a87a1e"/></radialGradient>
    <pattern id="bagFabric" patternUnits="userSpaceOnUse" width="64" height="64"><image class="bag-fabric-img" width="64" height="64" preserveAspectRatio="none" href=""/></pattern>
    <filter id="bagSoft" x="-20%" y="-20%" width="140%" height="160%"><feDropShadow dx="0" dy="2" stdDeviation="2.5" flood-color="#2b2f6b" flood-opacity=".22"/></filter>
  </defs>
  <g clip-path="url(#bagClip)">
    <rect x="0" y="70" width="200" height="160" fill="url(#bagBase)"/>
    <g class="bag-monogram" fill="#fff" opacity=".22">
      <path d="M40 118 l2 5 5 0.6 -3.8 3.4 1 5 -4.2-2.6 -4.2 2.6 1-5 -3.8-3.4 5-0.6z"/>
      <path d="M150 196 l2 5 5 0.6 -3.8 3.4 1 5 -4.2-2.6 -4.2 2.6 1-5 -3.8-3.4 5-0.6z"/>
      <circle cx="160" cy="124" r="3"/><circle cx="46" cy="200" r="2.4"/><circle cx="104" cy="210" r="2"/>
    </g>
    <rect class="bag-fabric" x="0" y="70" width="200" height="160" fill="url(#bagFabric)"/>
    <path d="M150 74 L178 74 L188 226 L158 226 Z" fill="#000" opacity=".14"/>
    <rect x="0" y="70" width="200" height="160" fill="url(#bagLight)"/>
    <rect x="0" y="70" width="200" height="160" fill="url(#bagShade)"/>
  </g>
  <path d="M22 74 H178 L179.7 98 H20.3 Z" fill="url(#bagCuff)"/>
  <path d="M20.3 98 H179.7" stroke="#000" stroke-opacity=".12" stroke-width="1.6"/>
  <path d="M22 74 H178" stroke="#fff" stroke-width="1.4"/>
  <g>
    <circle cx="64" cy="86" r="5" fill="url(#bagGold)"/><circle cx="64" cy="86" r="2" fill="#5a3d0c"/>
    <circle cx="136" cy="86" r="5" fill="url(#bagGold)"/><circle cx="136" cy="86" r="2" fill="#5a3d0c"/>
  </g>
  <g class="bag-logo" filter="url(#bagSoft)">
    <rect x="52" y="134" width="96" height="46" rx="11" fill="#fff"/>
    <text x="100" y="160" text-anchor="middle" font-family="Fredoka, sans-serif" font-weight="600" font-size="17" letter-spacing="1.2"><tspan fill="#3b8fe0">SESA</tspan><tspan fill="#ea6db8" dx="5">KIDS</tspan></text>
    <text x="100" y="172" text-anchor="middle" font-family="Nunito, sans-serif" font-weight="800" font-size="5.6" letter-spacing="1.6" fill="#8a8fb8">PİJAMA BUTİĞİ</text>
    <g stroke-linecap="round" stroke-width="2.6" fill="none">
      <line x1="59" y1="149" x2="64" y2="152" stroke="#ffd45c"/><line x1="58" y1="156" x2="63.5" y2="156" stroke="#f9a25c"/><line x1="59" y1="163" x2="64" y2="160" stroke="#79c3f6"/>
      <line x1="141" y1="149" x2="136" y2="152" stroke="#79c3f6"/><line x1="142" y1="156" x2="136.5" y2="156" stroke="#f9a25c"/><line x1="141" y1="163" x2="136" y2="160" stroke="#ffd45c"/>
    </g>
  </g>
  <path d="M12 226 H188" stroke="#000" stroke-opacity=".16" stroke-width="2"/>
</svg>`;

// Ürünün ön karesinden kumaş deseni: paçadaki desenden tamamen dolu (boşluksuz) bir kare bulunur,
// aynalanarak dikişsiz bir desen parçasına çevrilir.
const fabricCache = new Map();
function fabricTile(p) {
  if (fabricCache.has(p.id)) return fabricCache.get(p.id);
  const job = new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const W = img.naturalWidth;
        const H = img.naturalHeight;
        const c = document.createElement('canvas');
        c.width = W;
        c.height = H;
        const x = c.getContext('2d', { willReadFrequently: true });
        x.drawImage(img, 0, 0);
        const a = x.getImageData(0, 0, W, H).data;
        const s = Math.max(32, Math.round(W * 0.15)); // birkaç motif sığacak kadar büyük parça
        const spot = (p.spots && (p.spots.desen || p.spots.baski)) || [0.4, 0.7];
        const cx = spot[0] * W;
        const cy = spot[1] * H;
        let best = null;
        let bestScore = -1;
        const stp = Math.max(4, Math.round(s / 4));
        for (let dy = -H * 0.12; dy <= H * 0.12; dy += stp) {
          for (let dx = -W * 0.2; dx <= W * 0.2; dx += stp) {
            const x0 = Math.round(cx + dx - s / 2);
            const y0 = Math.round(cy + dy - s / 2);
            if (x0 < 0 || y0 < 0 || x0 + s > W || y0 + s > H) continue;
            let solid = 0;
            let n = 0;
            let sum = 0;
            let sq = 0;
            for (let yy = 0; yy < s; yy += 3) for (let xx = 0; xx < s; xx += 3) {
              const o = ((y0 + yy) * W + x0 + xx) * 4;
              n++;
              if (a[o + 3] > 245) solid++;
              const l = (a[o] * 0.3 + a[o + 1] * 0.59 + a[o + 2] * 0.11) / 255;
              sum += l;
              sq += l * l;
            }
            const varc = Math.sqrt(Math.max(0, sq / n - (sum / n) ** 2)); // desen (motif) yoğunluğu
            const fill = solid / n;
            // dolu, motifli ve işaretli noktaya yakın parça
            const score = (fill > 0.92 ? 1 : fill - 0.3) + varc * 1.6 - Math.hypot(dx, dy) / (W * 3);
            if (score > bestScore) { bestScore = score; best = [x0, y0]; }
          }
        }
        if (!best) { resolve(null); return; }
        // Parçadaki boş (saydam) pikselleri kumaşın ortalama rengiyle doldur
        const crop = x.getImageData(best[0], best[1], s, s);
        const d = crop.data;
        let r = 0, g = 0, bl = 0, k = 0;
        for (let i = 0; i < d.length; i += 4) if (d[i + 3] > 245) { r += d[i]; g += d[i + 1]; bl += d[i + 2]; k++; }
        if (k) for (let i = 0; i < d.length; i += 4) {
          const al = d[i + 3] / 255;
          d[i] = d[i] * al + (r / k) * (1 - al);
          d[i + 1] = d[i + 1] * al + (g / k) * (1 - al);
          d[i + 2] = d[i + 2] * al + (bl / k) * (1 - al);
          d[i + 3] = 255;
        }
        const pc = document.createElement('canvas');
        pc.width = pc.height = s;
        pc.getContext('2d').putImageData(crop, 0, 0);
        // Dikişsiz döşeme: parçanın yarım kaydırılmış kopyası, kenarlara doğru artan bir maskeyle
        // üstüne karıştırılır; motifler düz kalır, kenarlar birbirine kaynar
        const t = document.createElement('canvas');
        t.width = t.height = s;
        const q = t.getContext('2d');
        const h = s / 2;
        for (const [ox, oy] of [[-h, -h], [h, -h], [-h, h], [h, h]]) q.drawImage(pc, ox, oy);
        const m = document.createElement('canvas');
        m.width = m.height = s;
        const mq = m.getContext('2d');
        mq.drawImage(pc, 0, 0);
        mq.globalCompositeOperation = 'destination-in';
        const gr = mq.createRadialGradient(h, h, s * 0.18, h, h, s * 0.5);
        gr.addColorStop(0, 'rgba(0,0,0,1)');
        gr.addColorStop(1, 'rgba(0,0,0,0)');
        mq.fillStyle = gr;
        mq.fillRect(0, 0, s, s);
        q.drawImage(m, 0, 0);
        resolve(t.toDataURL('image/png'));
      } catch (e) { resolve(null); }
    };
    img.onerror = () => resolve(null);
    img.src = p.image;
  });
  fabricCache.set(p.id, job);
  return job;
}

const mixHex = (h, t, k) => {
  const a = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const b = [1, 3, 5].map((i) => parseInt(t.slice(i, i + 2), 16));
  return `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * k)).join(',')})`;
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
    // 2) Çanta hafifçe zıplar, ortaya yükselir ve büyür
    front.classList.add('is-full');
    back.classList.add('is-full');
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

  // Çantayı ürünün renklerine boya, kumaş desenini hazırla
  let current = null;
  function setProduct(prod) {
    current = prod;
    for (const el of [back, front]) {
      el.style.setProperty('--bag-light', mixHex(prod.accent, '#ffffff', 0.62));
      el.style.setProperty('--bag-mid', mixHex(prod.accent, '#ffffff', 0.25));
      el.style.setProperty('--bag-deep', mixHex(prod.accent, '#2b2f6b', 0.18));
    }
    const im = front.querySelector('.bag-fabric-img');
    im.setAttribute('href', '');
    fabricTile(prod).then((url) => { if (url && current === prod) im.setAttribute('href', url); });
  }
  function reset() {
    anims.forEach((a) => a.cancel());
    anims = [];
    busy = false;
    dragging = false;
    detail.classList.remove('is-ordering');
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
  done.querySelector('.bag-go').addEventListener('click', () => { reset(); hooks.onOpenCart?.(); });
  setP(0);
  return { play, reset, setProduct };
}
