// Ürün detayında her takıma özel arka plan: takımın desenindeki motifler (kalp, kedi, çilek,
// gezegen, yaprak, araba, duba, ayıcık…) yumuşak renklerle süzülür; ekose, çizgili ve dama
// takımlarda arka planda o kumaşın dokusu belirir. Gezegenler gece gökyüzünde sergilenir.

const M = {
  heart: '<path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.5 3 4.5 6.6 4.5c2.2 0 3.6 1.3 5.4 3.2 1.8-1.9 3.2-3.2 5.4-3.2 3.6 0 5.7 4 4.2 7.3C19.5 16.4 12 21 12 21z"/>',
  star: '<path d="M12 2.5l2.9 6 6.6.8-4.9 4.5 1.3 6.5L12 17l-5.9 3.3 1.3-6.5L2.5 9.3l6.6-.8z"/>',
  cat: '<path d="M4 9.5 4.5 3l5 3.6a9 9 0 0 1 5 0L19.5 3l.5 6.5c1 1.4 1.5 3 1.5 4.6C21.5 18.5 17.3 21 12 21s-9.5-2.5-9.5-6.9c0-1.6.5-3.2 1.5-4.6z"/><circle cx="8.6" cy="13" r="1.2" fill="#fff"/><circle cx="15.4" cy="13" r="1.2" fill="#fff"/><path d="M10.8 16h2.4L12 17.3z" fill="#fff"/>',
  paw: '<ellipse cx="12" cy="15.5" rx="5" ry="4.2"/><circle cx="5.8" cy="9.6" r="2.2"/><circle cx="9.6" cy="6" r="2.2"/><circle cx="14.4" cy="6" r="2.2"/><circle cx="18.2" cy="9.6" r="2.2"/>',
  strawberry: '<path d="M12 21.5c-4.8 0-8-4.8-8-9.2 0-3 2.3-4.8 4.6-4.8 1.3 0 2.4.4 3.4 1 1-.6 2.1-1 3.4-1 2.3 0 4.6 1.8 4.6 4.8 0 4.4-3.2 9.2-8 9.2z"/><path d="M12 7.6 9 3.5l3 1.6 3-1.6z" fill="#3fa760"/><g fill="#fff" opacity=".85"><circle cx="9" cy="12" r=".7"/><circle cx="12" cy="11" r=".7"/><circle cx="15" cy="12" r=".7"/><circle cx="10.5" cy="15" r=".7"/><circle cx="13.5" cy="15" r=".7"/><circle cx="12" cy="18" r=".7"/></g>',
  flower: '<g transform="translate(12 12)"><circle r="3.6" cy="-5.4"/><circle r="3.6" cy="5.4"/><circle r="3.6" cx="-5.4"/><circle r="3.6" cx="5.4"/></g><circle cx="12" cy="12" r="3" fill="#ffd45c"/>',
  planet: '<circle cx="12" cy="12" r="6.4"/><path d="M2.5 15.8c-.8-1.6 3.4-4.4 9.4-6.2s11-2 11.8-.4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" opacity=".7"/>',
  moon: '<path d="M15.5 3.2A9 9 0 1 0 20.8 16 7.4 7.4 0 0 1 15.5 3.2z"/>',
  rocket: '<path d="M12 2c3 2.5 4.5 6 4.5 10v4h-9v-4c0-4 1.5-7.5 4.5-10z"/><circle cx="12" cy="10" r="1.8" fill="#fff"/><path d="M7.5 13 4.5 17v2l3-1.5zM16.5 13l3 4v2l-3-1.5z"/><path d="M10 17h4l-2 4.5z" fill="#ffb347"/>',
  bear: '<circle cx="6.2" cy="6.2" r="3.2"/><circle cx="17.8" cy="6.2" r="3.2"/><circle cx="12" cy="13" r="8"/><ellipse cx="12" cy="15.6" rx="3.4" ry="2.6" fill="#fff" opacity=".75"/><circle cx="9" cy="11.4" r="1" fill="#fff"/><circle cx="15" cy="11.4" r="1" fill="#fff"/>',
  leaf: '<path d="M4 20C4 10 10 4 20 4c0 10-6 16-16 16z"/><path d="M5 19 15 9" stroke="#fff" stroke-opacity=".6" stroke-width="1.2" fill="none"/>',
  sun: '<circle cx="12" cy="12" r="5"/><g stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8"/></g>',
  car: '<path d="M3 15.5V12l2.2-4.2A2 2 0 0 1 7 6.7h10a2 2 0 0 1 1.8 1.1L21 12v3.5a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z"/><path d="M6.5 11.5l1.4-3h8.2l1.4 3z" fill="#fff" opacity=".8"/><rect x="9" y="3.6" width="6" height="2.6" rx="1" fill="#e94a4a"/><rect x="12" y="3.6" width="3" height="2.6" rx="1" fill="#3f7fe0"/><circle cx="7.5" cy="16.8" r="2.2" fill="#2b2f6b"/><circle cx="16.5" cy="16.8" r="2.2" fill="#2b2f6b"/>',
  cone: '<path d="M10 3h4l5 17H5z"/><path d="M8.3 9h7.4l.9 3H7.4zM6.6 15h10.8l.8 2.6H5.8z" fill="#fff" opacity=".9"/><rect x="3" y="19.5" width="18" height="2.5" rx="1"/>',
  digger: '<rect x="2.5" y="13" width="12" height="5" rx="1.5"/><rect x="5" y="8" width="6" height="5" rx="1"/><path d="M11 10l6-4 4 4-2 2-2.5-2-4.5 3z"/><path d="M19 12l2.5 3h-5z"/><circle cx="5.5" cy="19.5" r="2" fill="#2b2f6b"/><circle cx="11.5" cy="19.5" r="2" fill="#2b2f6b"/>',
  cloud: '<path d="M7 18.5a4.5 4.5 0 0 1-.4-9A6 6 0 0 1 18 8.6a4.9 4.9 0 0 1-.5 9.9z"/>',
  button: '<circle cx="12" cy="12" r="8"/><g fill="#fff" opacity=".8"><circle cx="10" cy="10" r="1.2"/><circle cx="14" cy="10" r="1.2"/><circle cx="10" cy="14" r="1.2"/><circle cx="14" cy="14" r="1.2"/></g>',
};

const T = {
  'kalpli-kedi': { m: ['heart', 'cat', 'heart', 'star'], cols: ['#f59bd6', '#ffb3d9', '#ffd45c', '#9fd3ff'] },
  'renkli-kediler': { m: ['cat', 'paw', 'heart', 'cat'], cols: ['#f9a25c', '#ffd45c', '#79c3f6', '#f59bd6'] },
  'dama-is-makineleri': { m: ['cone', 'digger', 'cone', 'star'], cols: ['#f9a25c', '#ffd45c', '#2f5fb3', '#79c3f6'], tex: 'checker' },
  'ayicikli-beyaz-ekose': { m: ['bear', 'heart', 'bear', 'button'], cols: ['#c0392b', '#b5652f', '#e98a7e', '#2b2f6b'], tex: 'plaid' },
  'renkli-cilekler': { m: ['strawberry', 'heart', 'flower', 'strawberry'], cols: ['#ef5a7a', '#f59bd6', '#ffd45c', '#7fd0a0'] },
  'polis-arabalari': { m: ['car', 'star', 'car', 'cloud'], cols: ['#3f7fe0', '#5b6472', '#ffd45c', '#a9b6c8'] },
  'ayicikli-bej-ekose': { m: ['bear', 'moon', 'bear', 'star'], cols: ['#b5652f', '#d9a46c', '#c0392b', '#ffd45c'], tex: 'plaid' },
  'safari-dostlari': { m: ['leaf', 'flower', 'sun', 'leaf'], cols: ['#4fae7a', '#3aa0c8', '#f59bd6', '#ffd45c'] },
  gezegenler: { m: ['planet', 'star', 'moon', 'rocket', 'star'], cols: ['#ffd45c', '#f59bd6', '#79c3f6', '#ffffff'], night: true },
  'kirmizi-ekose': { m: ['star', 'moon', 'button', 'star'], cols: ['#c0283a', '#2b2f6b', '#ffd45c', '#e98a7e'], tex: 'plaid' },
  'mavi-cizgili': { m: ['cloud', 'star', 'moon', 'cloud'], cols: ['#2f62d0', '#79c3f6', '#ffd45c', '#ffffff'], tex: 'stripes' },
  'krem-cilekler': { m: ['strawberry', 'flower', 'heart', 'strawberry'], cols: ['#d9455f', '#f59bd6', '#7fd0a0', '#ffd45c'] },
};

// Sabit tohumlu rastgele: her ürün her açılışta aynı düzende
const rng = (seed) => () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

export function paintBackdrop(el, p) {
  const th = T[p.spin] || { m: ['star', 'heart', 'cloud'], cols: [p.accent, '#ffd45c', '#79c3f6'] };
  const r = rng([...p.id].reduce((a, c) => a + c.charCodeAt(0) * 131, 7) % 2147483646 + 1);
  el.dataset.tex = th.tex || '';
  el.classList.toggle('is-night', !!th.night);
  el.style.setProperty('--acc', p.accent);
  const n = 18;
  let html = '';
  for (let i = 0; i < n; i++) {
    // Motifler merkezdeki figürün çevresinde bir halka üzerine dağılır, ortası boş kalır
    const a = (i / n) * Math.PI * 2 + r() * 0.5;
    const rad = 0.36 + r() * 0.16;
    const x = 50 + Math.cos(a) * rad * 100;
    const y = 50 + Math.sin(a) * rad * 92;
    const size = 26 + r() * 46;
    const motif = th.m[i % th.m.length];
    const col = th.cols[Math.floor(r() * th.cols.length)];
    html += `<svg class="bd-m" viewBox="0 0 24 24" aria-hidden="true" style="left:${x.toFixed(1)}%;top:${y.toFixed(1)}%;width:${size.toFixed(0)}px;color:${col};fill:${col};--r:${(r() * 50 - 25).toFixed(0)}deg;--d:${(r() * -9).toFixed(1)}s;--t:${(7 + r() * 6).toFixed(1)}s;opacity:${(0.45 + r() * 0.4).toFixed(2)}">${M[motif]}</svg>`;
  }
  if (th.night) for (let i = 0; i < 40; i++) html += `<i class="bd-s" style="left:${(r() * 100).toFixed(1)}%;top:${(r() * 100).toFixed(1)}%;--d:${(r() * -4).toFixed(1)}s"></i>`;
  el.innerHTML = `<div class="bd-tex"></div><div class="bd-disc"></div>${html}`;
}
