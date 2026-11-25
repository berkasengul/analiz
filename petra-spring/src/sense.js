// "Kokuyu keşfet": 3B sahnenin üzerinde kokunun tarifi. Düğmeye basınca bilgi paneli kenara çekilir, ürün ortaya gelir,
// ağır bir tur atar; arkasında ışık ve kokuya uygun parçacıklar yayılır; ekranda kokunun hikâyesi, üç adımlı tarifi,
// karakter etiketleri ve ferahlık / sıcaklık / yoğunluk göstergeleri sırayla belirir.
const METERS = ['Ferahlık', 'Sıcaklık', 'Yoğunluk'];
const STEP_LABEL = ['İlk an', 'Yolculukta', 'Kalıcı iz'];

export function initSense({ stage, getFlavor, getScene, onToggle }) {
  const view = stage.querySelector('.pstage__view') || stage;
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'sense-btn';
  btn.setAttribute('aria-expanded', 'false');
  btn.innerHTML = `<span class="sense-btn__halo" aria-hidden="true"></span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5l1.6 4.6 4.9.2-3.9 3 1.4 4.7L12 12.3 8 15l1.4-4.7-3.9-3 4.9-.2zM5 17.5l.8 2.2 2.2.8-2.2.8L5 23.5l-.8-2.2-2.2-.8 2.2-.8zM19 15l.6 1.6 1.6.6-1.6.6L19 19.4l-.6-1.6-1.6-.6 1.6-.6z" fill="currentColor"/></svg><span class="sense-btn__t">Kokuyu keşfet</span>`;
  const box = document.createElement('div');
  box.className = 'sense';
  box.setAttribute('aria-live', 'polite');
  box.hidden = true;
  view.append(btn, box);

  let on = false;
  function render(f) {
    const s = f.sense;
    if (!s) return;
    const official = f.group === 'cam';
    box.style.setProperty('--sc', f.model?.liquid || f.bg);
    box.innerHTML = `
      <header class="sense__head">
        <p class="sense__eye"><span></span>Petra ${f.name} · ${official ? 'koku notaları' : 'kokunun hikâyesi'}</p>
        <p class="sense__mood">${s.mood.split(' ').map((w, i) => `<span style="--w:${i}">${w}</span>`).join(' ')}</p>
      </header>
      ${s.steps.map(([t, d], i) => `<div class="snote snote--${i}" style="--i:${i}"><small>0${i + 1} · ${official ? ['Açılış', 'Kalp', 'Taban'][i] : STEP_LABEL[i]}</small><b>${((x) => x.charAt(0).toLocaleUpperCase('tr') + x.slice(1))(t.replace(/^(Açılış|Kalp|Taban) · /, ''))}</b><p>${d}</p></div>`).join('')}
      <div class="sense__meta">
        <ul class="sense__tags">${s.tags.map((t, i) => `<li style="--i:${i}">${t}</li>`).join('')}</ul>
        <dl class="sense__meters">${s.meters.map((v, i) => `<div style="--i:${i}"><dt>${METERS[i]}</dt><dd aria-label="5 üzerinden ${v}">${[1, 2, 3, 4, 5].map((k) => `<i class="${k <= v ? 'on' : ''}" style="--k:${k}"></i>`).join('')}</dd></div>`).join('')}</dl>
      </div>`;
  }
  function set(v) {
    on = v;
    btn.setAttribute('aria-expanded', String(on));
    btn.querySelector('.sense-btn__t').textContent = on ? 'Kokuyu kapat' : 'Kokuyu keşfet';
    btn.classList.toggle('on', on);
    stage.classList.toggle('sensing', on);
    if (on) {
      render(getFlavor());
      box.hidden = false;
      box.classList.remove('in'); void box.offsetWidth; box.classList.add('in');
    } else {
      box.classList.remove('in');
      setTimeout(() => { if (!on) box.hidden = true; }, 450);
    }
    getScene()?.discover(on);
    onToggle?.(on);
  }
  btn.addEventListener('click', () => set(!on));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && on) set(false); });
  return {
    // ürün değişince açık tarif yeni ürünle yenilenir
    update() { if (on) { render(getFlavor()); box.classList.remove('in'); void box.offsetWidth; box.classList.add('in'); getScene()?.discover(true); } },
    close() { if (on) set(false); },
    open() { if (!on) set(true); },
    get on() { return on; },
  };
}
