import { $, $$, FLAVORS, productCard, initReveal, lower, productUrl, webglOK } from '../site.js';
import { CATS } from '../data.js';

/* ================= toplu ürün listesi (filtre + arama) ================= */
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
  const items = FLAVORS.filter((f) => (cat === 'tum' || f.cat === cat) && (!k || lower(f.name).includes(k)));
  $('#grid').innerHTML = items.map((f) => productCard(f)).join('');
  $('#count').textContent = `${items.length} ürün listeleniyor`;
  $('#empty').hidden = items.length > 0;
  initReveal($('#grid'));
  const url = new URL(location.href);
  if (cat === 'tum') url.searchParams.delete('kat'); else url.searchParams.set('kat', cat);
  history.replaceState(null, '', url);
}
$$('#cats button').forEach((b) => b.addEventListener('click', () => { cat = b.dataset.cat; render(); }));
$('#q').addEventListener('input', (e) => { q = e.target.value; render(); });
if (CATS.length < 2) { $('#cats').hidden = true; $('#cCats').hidden = true; }
render();
// kategoriyle gelindiyse (ana sayfadaki ürün grupları) doğrudan listeye in
if (params.get('kat')) requestAnimationFrame(() => $('#liste').scrollIntoView({ block: 'start' }));

/* ================= 3B katalog girişi: ürünler tek tek, kendi renklerinde ================= */
const pad2 = (n) => String(n).padStart(2, '0');
let list = FLAVORS.map((_, i) => i);
let cur = 0; // list içindeki sıra
let scene = null;
const fIdx = () => list[cur];

$('#pThumbs').innerHTML = FLAVORS.map((f, i) => `<a href="${productUrl(f)}" data-i="${i}" style="--c:${f.bg}" class="${f.thumb ? 'kit' : ''}" aria-label="${f.name}"><img src="${f.thumb || f.tex}" alt="" loading="lazy" /></a>`).join('');
$$('#pThumbs a').forEach((a) => a.addEventListener('click', (e) => { e.preventDefault(); const k = list.indexOf(+a.dataset.i); if (k >= 0) show(k); }));
$('#cCats').innerHTML = CATS.map(([id, label]) => `<button type="button" data-c="${id}" class="${id === 'tum' ? 'on' : ''}">${label}</button>`).join('');
$$('#cCats button').forEach((b) => b.addEventListener('click', () => {
  const c = b.dataset.c;
  $$('#cCats button').forEach((x) => x.classList.toggle('on', x === b));
  list = FLAVORS.map((_, i) => i).filter((i) => c === 'tum' || FLAVORS[i].cat === c);
  $$('#pThumbs a').forEach((a) => { a.hidden = !list.includes(+a.dataset.i); });
  show(0);
}));
$('#pPrev').addEventListener('click', (e) => { e.preventDefault(); show(cur - 1); });
$('#pNext').addEventListener('click', (e) => { e.preventDefault(); show(cur + 1); });

function fillStage() {
  const f = FLAVORS[fIdx()];
  $('#pstage').style.setProperty('--c', f.bg);
  $('#pCount').textContent = `${pad2(cur + 1)} / ${pad2(list.length)}`;
  $('#pName').textContent = f.name;
  $('#pName').classList.toggle('long', f.name.length > 14);
  $('#pLead').textContent = f.lead;
  $('#pFacts').innerHTML = f.facts.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('');
  $('#pGo').href = productUrl(f);
  $('#pimg').src = f.thumb || f.tex;
  const n = list.length;
  const prev = FLAVORS[list[(cur - 1 + n) % n]], next = FLAVORS[list[(cur + 1) % n]];
  $('#pPrev span').textContent = prev.short || prev.name;
  $('#pNext span').textContent = next.short || next.name;
  $('.pstage__side').hidden = n < 2;
  $$('#pThumbs a').forEach((a) => a.classList.toggle('on', +a.dataset.i === fIdx()));
  const on = $(`#pThumbs a[data-i="${fIdx()}"]`), box = $('#pThumbs');
  if (on) box.scrollTo({ top: on.offsetTop - box.clientHeight / 2 + on.offsetHeight / 2, left: on.offsetLeft - box.clientWidth / 2 + on.offsetWidth / 2, behavior: 'smooth' });
  const panel = $('#pPanel'); panel.classList.remove('swap'); void panel.offsetWidth; panel.classList.add('swap');
}
function show(k) {
  cur = (k + list.length) % list.length;
  fillStage();
  if (scene) { scene.inspectFlavor(fIdx()); stagePose(); }
}
const phoneView = () => window.innerWidth < 760 || window.innerWidth / window.innerHeight < 0.9;
function stagePose() {
  if (!scene) return;
  const H = scene.halfHeight(), A = scene.aspect(), W = H * A, k = FLAVORS[fIdx()].model ? 1.05 : 1;
  if (phoneView()) scene.setPose({ x: 0, y: H * 0.06, s: Math.min(1.15, W * 0.95) * k, ry: 0, rz: 0, cloud: 0, frost: 0, bd: 0 });
  else scene.setPose({ x: W * 0.17, y: 0.02, s: Math.min(1.5, W * 0.6, H * 1.05) * k, ry: 0, rz: 0, cloud: 0, frost: 0, bd: 0 });
}
fillStage();
if (webglOK()) {
  import('../scene.js').then(async ({ createScene }) => {
    scene = createScene($('#pv'), FLAVORS, null, $('#pbg'), { box: true, wheel: false, first: fIdx(), noBackdrop: true });
    await scene.ready;
    scene.setActive(true);
    scene.inspectOpen(fIdx());
    stagePose();
    $('#pstage').classList.add('gl-on');
    window.addEventListener('resize', stagePose);
    // sahne ekrandan çıkınca çizim durur (aşağıdaki liste akıcı kayar)
    new IntersectionObserver(([en]) => scene.setActive(en.isIntersecting)).observe($('#pstage'));
  }).catch(() => {});
}
