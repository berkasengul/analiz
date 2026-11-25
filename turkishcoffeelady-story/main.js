/* Bold Istanbul · story page */

/* Stage photos: assets/scenes/<place>-<time>-<closed|poured>.webp
   tap: where the can sits in that place's photo (percent of the frame). */
const PLACES = {
  home: { tap: [38, 55] },
  office: { tap: [38, 55] },
  bosphorus: { tap: [38, 55] },
};
const FILMS = [
  { yt: 'X8lP0j7vcnA', poster: './assets/film-2.webp', len: 'Teaser', title: { en: 'Tales of Anatolia', tr: 'Anadolu Hikâyeleri' }, line: { en: 'Where the ritual comes from.', tr: 'Ritüelin geldiği yer.' } },
  { yt: 'zXI4Pu0NAJY', poster: './assets/film-1.webp', len: 'Seyir', title: { en: 'A Cup of Courage', tr: 'Bir Fincan Cesaret' }, line: { en: '“Nobody in America drinks Turkish coffee.” She did it anyway.', tr: '“Amerika’da kimse Türk kahvesi içmez.” O yine de yaptı.' } },
];
const LAUNCH = new Date('2026-12-05T00:00:00-05:00');
const FORTUNES = {
  en: ['A bird in your cup: good news is on its way.', 'A road opens ahead. Take it, and take a friend.', 'Someone is thinking of you more than you think.', 'The cup shows a key. That door is not closed.', 'Forty years of friendship start with the next cup you share.', 'A small risk this week becomes a good story.'],
  tr: ['Fincanında bir kuş var: iyi haber yolda.', 'Önünde bir yol açılıyor. Git, yanına bir dost al.', 'Biri seni sandığından çok düşünüyor.', 'Fincanda bir anahtar var. O kapı kapalı değil.', 'Kırk yıllık dostluk, paylaşacağın bir sonraki fincanla başlar.', 'Bu hafta göze aldığın küçük risk güzel bir hikâye olacak.'],
};
const TR = {
  'nav.places': 'Yerler', 'nav.films': 'Filmler', 'nav.details': 'Detaylar', tap: 'dokun',
  h1a: 'İstanbul’u', h1b: 'sen', h1c: 'dök.', h1sub: 'Kutuya dokun, fincan değişsin.',
  'p.home': 'Evde', 'p.office': 'Ofiste', 'p.bosphorus': 'Boğaz kıyısında', 't.morning': 'Sabah', 't.evening': 'Akşam',
  'f.title': 'İki film,<br />bir fincan cesaret.',
  'd.title': 'Yakından<br />bak.',
  'd.1t': 'Sıfır şeker. Bir gram bile.', 'd.1': 'Soğuk, temiz, düşük kalori.',
  'd.2t': 'Her kutuda bir nazar boncuğu.', 'd.2': 'Küçük bir iyi şans sözü.',
  'd.3t': 'Un inceliğinde öğütülür.', 'd.3': 'İstanbul’un 500 yıldır yaptığı gibi.',
  'd.4t': 'Çalkala. Soğuk iç.', 'd.4': 'Kutudan ya da buzun üzerine.',
  'a.1': 'Boston’da bir fincanla başladı,', 'a.2': 'Amerika için soğuk demlendi.', 'a.sub': 'Turkish Coffee Lady · 2007’den beri',
  'fo.k': 'Kurucu', 'fo.q': '“Bir fincan kahvenin kırk yıl hatırı vardır.”',
  'fo.b': 'Amerika’yı dolaşan kahve kamyonu, ABD’deki ilk Türk kahvesi dükkânı, Old Town Alexandria’da bir kültür evi ve şimdi dünyanın ilk şişelenmiş soğuk Türk kahvesi (patent başvurusu sürüyor). Hikâyenin tamamı <i>Hayalini Demle</i> kitabında.',
  'c.title': 'Bir yudum<br />almadan gitme.', 'c.date': '5 Aralık · Dünya Türk Kahvesi Günü · ABD', 'c.btn': 'Haber ver →',
  foot: 'Bold Istanbul, buzlu Türk kahvesi',
};
const EXTRA = { en: { ok: 'Thank you. You’ll hear from us on December 5.', err: 'Something went wrong. Please try again.', sound: 'Watch with sound →', days: 'days to go', live: 'On shelves now' },
  tr: { ok: 'Teşekkürler. 5 Aralık’ta haber vereceğiz.', err: 'Bir sorun oldu, tekrar dener misin?', sound: 'Sesli izle →', days: 'gün kaldı', live: 'Şimdi raflarda' } };

let lang = 'en';
try { lang = localStorage.getItem('bi-lang') || ((navigator.language || '').startsWith('tr') ? 'tr' : 'en'); } catch (e) {}
const EN = {};
document.querySelectorAll('[data-i18n]').forEach((el) => { EN[el.dataset.i18n] = el.innerHTML; });
const tx = (k) => (lang === 'tr' ? TR[k] : EN[k]) ?? EN[k];
function applyLang(l) {
  lang = l; document.documentElement.lang = l;
  document.querySelectorAll('[data-i18n]').forEach((el) => { const v = tx(el.dataset.i18n); if (v) el.innerHTML = v; });
  document.getElementById('lang').textContent = l === 'en' ? 'TR' : 'EN';
  try { localStorage.setItem('bi-lang', l); } catch (e) {}
  renderFilms(); countdown();
}
document.getElementById('lang').addEventListener('click', () => applyLang(lang === 'en' ? 'tr' : 'en'));

/* nav + reveals */
const nav = document.getElementById('nav');
addEventListener('scroll', () => nav.classList.toggle('scrolled', scrollY > 30), { passive: true });
const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.2 });
document.querySelectorAll('.reveal').forEach((el) => io.observe(el));

/* 1 · stage */
const state = { place: 'home', time: 'morning', poured: false };
const imgs = [document.getElementById('imgA'), document.getElementById('imgB')];
let front = 0;
const tap = document.getElementById('tap');
const src = () => `./assets/scenes/${state.place}-${state.time}-${state.poured ? 'poured' : 'closed'}.webp`;
function showScene() {
  const next = imgs[1 - front], url = src();
  next.onload = () => { next.classList.add('on'); imgs[front].classList.remove('on'); front = 1 - front; };
  next.src = url;
  placeTap();
  tap.classList.toggle('done', state.poured);
  document.querySelectorAll('[data-place]').forEach((b) => b.classList.toggle('on', b.dataset.place === state.place));
  document.querySelectorAll('[data-time]').forEach((b) => b.classList.toggle('on', b.dataset.time === state.time));
}
// the photos are object-fit: cover, so map the can's spot in the photo to the cropped frame
const SCENE_W = 1920, SCENE_H = 1080;
function placeTap() {
  const box = document.getElementById('stage').getBoundingClientRect();
  const s = Math.max(box.width / SCENE_W, box.height / SCENE_H);
  const [x, y] = PLACES[state.place].tap;
  tap.style.left = (box.width - SCENE_W * s) / 2 + (x / 100) * SCENE_W * s + 'px';
  tap.style.top = (box.height - SCENE_H * s) / 2 + (y / 100) * SCENE_H * s + 'px';
}
addEventListener('resize', placeTap);
tap.addEventListener('click', () => { state.poured = !state.poured; showScene(); });
document.querySelectorAll('[data-place]').forEach((b) => b.addEventListener('click', () => { state.place = b.dataset.place; state.poured = false; showScene(); }));
document.querySelectorAll('[data-time]').forEach((b) => b.addEventListener('click', () => { state.time = b.dataset.time; showScene(); }));
// preload every scene so switching is instant
Object.keys(PLACES).forEach((p) => ['morning', 'evening'].forEach((t) => ['closed', 'poured'].forEach((s) => { const i = new Image(); i.src = `./assets/scenes/${p}-${t}-${s}.webp`; })));
showScene();

/* 2 · films accordion */
const acc = document.getElementById('acc');
let active = 0, previewTimer = 0;
const yt = (id, preview) => `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&playsinline=1&rel=0&modestbranding=1` + (preview ? `&mute=1&controls=0&loop=1&playlist=${id}&disablekb=1&iv_load_policy=3` : '');
function renderFilms() {
  acc.innerHTML = '';
  FILMS.forEach((f, i) => {
    const el = document.createElement('div');
    el.className = 'acc__item' + (i === active ? ' on' : '');
    el.innerHTML = `<div class="acc__media"><img src="${f.poster}" alt="" loading="lazy" /><span class="acc__sound">${EXTRA[lang].sound}</span></div>
      <div class="acc__cap"><span>${f.title[lang]}</span><span>${f.len}</span><span>${f.line[lang]}</span></div>`;
    el.addEventListener('mouseenter', () => setActive(i));
    el.addEventListener('click', () => (i === active ? openFilm(i) : setActive(i)));
    acc.appendChild(el);
  });
  setActive(active, true);
}
function setActive(i, force) {
  if (i === active && !force) return;
  active = i;
  [...acc.children].forEach((el, k) => {
    el.classList.toggle('on', k === i);
    const fr = el.querySelector('iframe'); if (fr && k !== i) fr.remove();
  });
  clearTimeout(previewTimer);
  previewTimer = setTimeout(() => {
    const el = acc.children[active]; if (!el || el.querySelector('iframe') || !filmsInView) return;
    const fr = document.createElement('iframe');
    fr.src = yt(FILMS[active].yt, true); fr.allow = 'autoplay; encrypted-media'; fr.tabIndex = -1; fr.title = FILMS[active].title.en;
    fr.addEventListener('load', () => setTimeout(() => fr.classList.add('on'), 1200));
    el.querySelector('.acc__media').insertBefore(fr, el.querySelector('.acc__sound'));
  }, 900);
}
let filmsInView = false;
new IntersectionObserver(([e]) => { filmsInView = e.isIntersecting; if (filmsInView) setActive(active, true); else acc.querySelectorAll('iframe').forEach((f) => f.remove()); }, { threshold: 0.3 }).observe(acc);
const lb = document.getElementById('lightbox'), lbFrame = document.getElementById('lbFrame');
function openFilm(i) {
  acc.querySelectorAll('iframe').forEach((f) => f.remove());
  lbFrame.innerHTML = `<iframe src="${yt(FILMS[i].yt, false)}" allow="autoplay; encrypted-media; fullscreen" allowfullscreen title="${FILMS[i].title[lang]}"></iframe>`;
  lb.hidden = false; document.body.style.overflow = 'hidden';
}
function closeFilm() { lb.hidden = true; lbFrame.innerHTML = ''; document.body.style.overflow = ''; setActive(active, true); }
document.getElementById('lbClose').addEventListener('click', closeFilm);
lb.addEventListener('click', (e) => { if (e.target === lb) closeFilm(); });
addEventListener('keydown', (e) => { if (e.key === 'Escape' && !lb.hidden) closeFilm(); });

/* 3 · details: hovering a note swaps the photos */
const big = document.getElementById('detailBig'), small = document.getElementById('detailSmall');
const notes = [...document.querySelectorAll('#notes li')];
function pick(li) {
  notes.forEach((n) => n.classList.toggle('on', n === li));
  const i = notes.indexOf(li), nxt = notes[(i + 1) % notes.length];
  big.style.opacity = 0; small.style.opacity = 0;
  setTimeout(() => { big.src = `./assets/detail/${li.dataset.img}.webp`; small.src = `./assets/detail/${nxt.dataset.img}.webp`; big.style.opacity = 1; small.style.opacity = 1; }, 250);
}
notes.forEach((li) => { li.addEventListener('mouseenter', () => pick(li)); li.addEventListener('click', () => pick(li)); });
notes[0].classList.add('on');

/* 6 · closing: tap the can, read your fortune */
const can = document.getElementById('closingCan'), fortune = document.getElementById('fortune');
let lastF = -1;
document.getElementById('tap2').addEventListener('click', () => {
  can.classList.remove('shake'); void can.offsetWidth; can.classList.add('shake');
  fortune.style.opacity = 0;
  setTimeout(() => {
    let i; do { i = Math.floor(Math.random() * FORTUNES.en.length); } while (i === lastF);
    lastF = i; fortune.textContent = FORTUNES[lang][i]; fortune.style.opacity = 1;
  }, 700);
});
const countEl = document.getElementById('count');
let cdTimer = 0;
function countdown() {
  clearTimeout(cdTimer);
  const ms = LAUNCH - Date.now();
  if (ms <= 0) { countEl.textContent = EXTRA[lang].live; return; }
  const d = Math.floor(ms / 864e5), h = Math.floor(ms % 864e5 / 36e5), m = Math.floor(ms % 36e5 / 6e4), s = Math.floor(ms % 6e4 / 1e3);
  countEl.textContent = `${d} ${EXTRA[lang].days} · ${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  cdTimer = setTimeout(countdown, 1000);
}
const form = document.getElementById('notifyForm'), msg = document.getElementById('notifyMsg');
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    const r = await fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(new FormData(form)).toString() });
    if (!r.ok) throw 0; msg.textContent = EXTRA[lang].ok; form.reset();
  } catch (err) { msg.textContent = EXTRA[lang].err; }
});

applyLang(lang);
