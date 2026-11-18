import { $, FLAVORS, productCard, initReveal, webglOK } from '../site.js';

const byId = (id) => FLAVORS.find((f) => f.id === id);
const count = (c) => FLAVORS.filter((f) => f.cat === c).length;
const ARROW = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';

/* ---------- ürün grupları ---------- */
const groups = [
  { href: '/urunler.html?kat=meyve', small: `${count('meyve')} çeşit`, title: 'Meyveler', text: 'Çilek, ahududu, ejder meyvesi, mango, lime ve daha fazlası; bütün, dilim ve küp.', imgs: ['ahududu', 'kirmizi-ejder', 'cilek'] },
  { href: '/urunler.html?kat=tatli', small: `${count('tatli') + count('atistirmalik')} çeşit`, title: 'Dondurma ve atıştırmalık', text: 'Sade ve fıstıklı dondurma küpleri ile hindistan cevizi atıştırmalığı.', imgs: ['dondurma', 'hindistan-cevizi', 'fistikli-dondurma'] },
  { href: '/hazir-gida.html', small: `${count('kit')} ürün · ResQ`, title: 'Hazır gıda', text: 'Sıcak su ekleyerek 15 dakikada hazır yemek kitleri; acil durum, kamp ve outdoor.', photo: '/img/kit/35-servis.webp' },
];
$('#groups').innerHTML = groups.map((g) => `
  <a class="group reveal" href="${g.href}">
    <span class="group__media${g.photo ? ' group__media--photo' : ''}">${g.photo
      ? `<img src="${g.photo}" alt="" loading="lazy" style="object-fit:contain;padding:28px;mix-blend-mode:multiply" />`
      : g.imgs.map((id) => `<img src="${byId(id).tex}" alt="" loading="lazy" />`).join('')}</span>
    <span class="group__body"><small>${g.small}</small><h3>${g.title}</h3><p>${g.text}</p><span class="link-arrow">Ürünleri gör ${ARROW}</span></span>
  </a>`).join('');

/* ---------- öne çıkan ürünler ---------- */
$('#featured').innerHTML = ['cilek', 'beyaz-ejder', 'ahududu', 'mango', 'mavi-yemis', 'lime', 'fistikli-dondurma', 'kit-35-servis']
  .map((id) => productCard(byId(id))).join('');
initReveal();

/* ---------- açılış: 3B ürün sergisi ---------- */
if (webglOK()) {
  import('../hero/index.jsx').then(({ mountHero }) => {
    mountHero({ container: $('#heroGL'), heroEl: $('#hero'), flavors: FLAVORS });
  }).catch(() => document.body.classList.add('no-gl'));
} else {
  document.body.classList.add('no-gl');
}
