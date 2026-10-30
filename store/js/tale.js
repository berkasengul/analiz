// Ürün sayfasındaki "Bu pijamanın masalı" kartı ve sesli okuma (tarayıcının Türkçe sesiyle, ücretsiz).
import { STORIES, storyPath } from './stories.js';

const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
let talePlaying = null;

function trVoice() {
  const vs = synth?.getVoices?.() || [];
  return vs.find((v) => /^tr/i.test(v.lang) && /yelda|seda|female|kadın/i.test(v.name)) || vs.find((v) => /^tr/i.test(v.lang)) || null;
}
export const narrator = {
  supported: !!synth && typeof SpeechSynthesisUtterance !== 'undefined',
  get playing() { return !!talePlaying; },
  // Masalı paragraf paragraf okur; bitince ya da durdurulunca onEnd çağrılır
  speak(parts, onEnd) {
    narrator.stop();
    if (!narrator.supported) return;
    const token = {};
    talePlaying = token;
    const voice = trVoice();
    let i = 0;
    const next = () => {
      if (talePlaying !== token) return;
      if (i >= parts.length) { talePlaying = null; onEnd?.(); return; }
      const u = new SpeechSynthesisUtterance(parts[i++]);
      u.lang = 'tr-TR';
      if (voice) u.voice = voice;
      u.rate = 0.88;
      u.pitch = 1.05;
      u.onend = () => setTimeout(next, 450);
      u.onerror = () => { if (talePlaying === token) { talePlaying = null; onEnd?.(); } };
      synth.speak(u);
    };
    next();
    token.onEnd = onEnd;
  },
  stop() {
    if (!talePlaying) return;
    const t = talePlaying;
    talePlaying = null;
    try { synth.cancel(); } catch { /* yok say */ }
    t.onEnd?.();
  },
};
// Sesler bazı tarayıcılarda geç yüklenir
synth?.getVoices?.();

const escT = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const taleParts = (s) => [s.title, ...s.text, `Uyumadan önce sor: ${s.ask}`];

// Ürün sayfasındaki kartı doldurur
export function renderTale(el, p) {
  narrator.stop();
  const s = STORIES[p.id];
  el.hidden = !s;
  if (!s) return;
  const preview = !!window.__spinSource; // tek dosyalık önizlemede ayrı masal sayfası yok
  el.style.setProperty('--tale-c', p.accent);
  el.innerHTML = `
    <div class="tale-head"><span class="tale-emoji" aria-hidden="true">${s.emoji}</span>
      <div><p class="tale-kicker">Bu pijamanın masalı</p><h3 class="tale-title">${escT(s.title)}</h3></div></div>
    <div class="tale-body">${s.text.map((t) => `<p>${escT(t)}</p>`).join('')}</div>
    <p class="tale-ask"><b>Uyumadan önce sor:</b> ${escT(s.ask)}</p>
    <div class="tale-actions">
      ${narrator.supported ? '<button type="button" class="tale-listen" aria-pressed="false"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg><span>Sesli dinle</span></button>' : ''}
      <button type="button" class="tale-more">Devamını oku</button>
      ${preview ? '' : `<a class="tale-link" href="${storyPath(p)}" target="_blank" rel="noopener">Masal sayfası ↗</a>`}
    </div>`;
  el.classList.remove('is-open');
  const btn = el.querySelector('.tale-listen');
  const setBtn = (on) => {
    if (!btn) return;
    btn.setAttribute('aria-pressed', String(on));
    btn.classList.toggle('is-on', on);
    btn.querySelector('span').textContent = on ? 'Durdur' : 'Sesli dinle';
    btn.querySelector('path').setAttribute('d', on ? 'M7 5h4v14H7zM13 5h4v14h-4z' : 'M8 5v14l11-7z');
  };
  btn?.addEventListener('click', () => {
    if (btn.classList.contains('is-on')) { narrator.stop(); return; }
    el.classList.add('is-open');
    setBtn(true);
    narrator.speak(taleParts(s), () => setBtn(false));
  });
  el.querySelector('.tale-more').addEventListener('click', (e) => {
    el.classList.toggle('is-open');
    e.currentTarget.textContent = el.classList.contains('is-open') ? 'Kısalt' : 'Devamını oku';
  });
}
