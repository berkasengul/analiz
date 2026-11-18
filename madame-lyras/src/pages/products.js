import { $, $$, FLAVORS, productCard, initReveal, lower } from '../site.js';
import { CATS } from '../data.js';

const params = new URLSearchParams(location.search);
let cat = CATS.some(([id]) => id === params.get('kat')) ? params.get('kat') : 'tum';
let q = '';

$('#cats').innerHTML = CATS.map(([id, label]) => {
  const n = id === 'tum' ? FLAVORS.length : FLAVORS.filter((f) => f.cat === id).length;
  return `<button type="button" role="tab" data-cat="${id}">${label} <small>${n}</small></button>`;
}).join('');

function render() {
  $$('#cats button').forEach((b) => { const on = b.dataset.cat === cat; b.classList.toggle('on', on); b.setAttribute('aria-selected', String(on)); });
  const k = lower(q.trim());
  const list = FLAVORS.filter((f) => (cat === 'tum' || f.cat === cat) && (!k || lower(f.name).includes(k)));
  $('#grid').innerHTML = list.map((f) => productCard(f)).join('');
  $('#count').textContent = `${list.length} ürün listeleniyor`;
  $('#empty').hidden = list.length > 0;
  initReveal($('#grid'));
  const url = new URL(location.href);
  if (cat === 'tum') url.searchParams.delete('kat'); else url.searchParams.set('kat', cat);
  history.replaceState(null, '', url);
}
$$('#cats button').forEach((b) => b.addEventListener('click', () => { cat = b.dataset.cat; render(); }));
$('#q').addEventListener('input', (e) => { q = e.target.value; render(); });
render();
