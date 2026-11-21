import { $, $$, FLAVORS, productCard, initReveal, lower, productUrl, webglOK } from '../site.js';
import { CATS, GROUPS } from '../data.js';
const SHORT = { tum: 'Tümü', atistirmalik: 'Meyve ve dondurma', kit: 'Hazır gıda kitleri', resq: 'ResQ ürünleri' };

/* ================= toplu ürün listesi (filtre + arama) ================= */
const params = new URLSearchParams(location.search);
let cat = CATS.some(([id]) => id === params.get('kat')) ? params.get('kat') : 'tum';
let q = '';

$('#cats').innerHTML = CATS.map(([id, label]) => {
  const n = id === 'tum' ? FLAVORS.length : FLAVORS.filter((f) => f.group === id).length;
  return `<button type="button" role="tab" data-cat="${id}" title="${label}">${SHORT[id] || label} <small>${n}</small></button>`;
}).join('');

function render() {
  $$('#cats button').forEach((b) => { const on = b.dataset.cat === cat; b.classList.toggle('on', on); b.setAttribute('aria-selected', String(on)); });
  const k = lower(q.trim());
  const items = FLAVORS.filter((f) => (cat === 'tum' || f.group === cat) && (!k || lower(f.name).includes(k)));
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

/* ================= 3B katalog girişi: ürünler tek tek, kendi renklerinde ================= */
const pad2 = (n) => String(n).padStart(2, '0');
let list = FLAVORS.map((_, i) => i).filter((i) => cat === 'tum' || FLAVORS[i].group === cat);
let cur = 0; // list içindeki sıra
let scene = null;
const fIdx = () => list[cur];

$('#pThumbs').innerHTML = FLAVORS.map((f, i) => `<a href="${productUrl(f)}" data-i="${i}" style="--c:${f.bg}" class="${f.thumb ? 'kit' : ''}" aria-label="${f.name}"><img src="${f.mini}" alt="" ${i < 8 ? '' : 'loading="lazy" '}/></a>`).join('');
$$('#pThumbs a').forEach((a) => { a.hidden = !list.includes(+a.dataset.i); });
$$('#pThumbs a').forEach((a) => a.addEventListener('click', (e) => { e.preventDefault(); const k = list.indexOf(+a.dataset.i); if (k >= 0) show(k); }));
$('#cCats').innerHTML = CATS.map(([id]) => `<button type="button" data-c="${id}" class="${id === cat ? 'on' : ''}">${SHORT[id]}</button>`).join('');
$$('#cCats button').forEach((b) => b.addEventListener('click', () => {
  const c = b.dataset.c;
  $$('#cCats button').forEach((x) => x.classList.toggle('on', x === b));
  list = FLAVORS.map((_, i) => i).filter((i) => c === 'tum' || FLAVORS[i].group === c);
  $$('#pThumbs a').forEach((a) => { a.hidden = !list.includes(+a.dataset.i); });
  show(0);
}));
$('#pPrev').addEventListener('click', (e) => { e.preventDefault(); show(cur - 1); });
$('#pNext').addEventListener('click', (e) => { e.preventDefault(); show(cur + 1); });

function fillStage() {
  const f = FLAVORS[fIdx()];
  $('#pstage').style.setProperty('--c', f.bg);
  // 3B arka planın önceden kaydedilmiş görüntüsü: sayfa açılır açılmaz gerçek zemin görünür
  $('#pstage').style.setProperty('--zemin', `url(/img/zemin/${f.id}.webp)`);
  $('#pCount').textContent = `${pad2(cur + 1)} / ${pad2(list.length)}`;
  $('#cEye').textContent = `${f.group === 'atistirmalik' ? 'Solagron' : 'ResQ'} · ${GROUPS[f.group]}`;
  $('#pName').textContent = f.name;
  $('#pName').classList.toggle('long', f.name.length > 14);
  $('#pLead').textContent = f.lead;
  $('#pFacts').innerHTML = f.facts.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('');
  $('#pGo').href = productUrl(f);
  if (window.__early) window.__early(f.id); else $('#pimg').src = f.model ? `/img/kit/${f.kit}-cut.webp` : f.md;
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
// masaüstünde paket, sol panel ile sağdaki küçük resimler arasındaki boşluğun tam ortasında durur
function stageCenter() {
  const st = $('#pstage').getBoundingClientRect();
  const pl = $('#pstage .pstage__panel')?.getBoundingClientRect();
  const th = $('#pThumbs')?.getBoundingClientRect();
  if (!pl || !th || !st.width || !pl.width || !th.width) return 0.585;
  const f = ((pl.right + th.left) / 2 - st.left) / st.width;
  return Math.min(0.7, Math.max(0.5, f));
}
function markCenter() { if (window.__fit) window.__fit(); else $('#pstage').style.setProperty('--cx', `${(stageCenter() * 100).toFixed(2)}%`); }
function stagePose(snap) {
  if (!scene) return;
  const pose = snap === true ? scene.snapPose : scene.setPose;
  const H = scene.halfHeight(), A = scene.aspect(), W = H * A, k = FLAVORS[fIdx()].model ? 1.05 : 1;
  if (phoneView()) pose({ x: 0, y: H * 0.13, s: Math.min(1.6, W * 1.3, H * 0.74) * k, ry: 0, rz: 0, cloud: 0, frost: 0, bd: 0 });
  else pose({ x: W * (2 * stageCenter() - 1), y: 0.02, s: Math.min(1.5, W * 0.6, H * 1.05) * k, ry: 0, rz: 0, cloud: 0, frost: 0, bd: 0 });
}
fillStage();
$('#pstage').classList.add('filled');
markCenter();
window.addEventListener('resize', markCenter);
if (webglOK()) {
  import('../scene.js').then(async ({ createScene }) => {
    scene = createScene($('#pv'), FLAVORS, null, $('#pbg'), { box: true, wheel: false, first: fIdx(), noBackdrop: true });
    await scene.ready;
    scene.setActive(true);
    scene.inspectOpen(fIdx());
    stagePose(true); // ilk görünüm: paket doğrudan yerinde (büyüyerek gelmez)
    $('#pstage').classList.add('gl-on');
    window.addEventListener('resize', () => stagePose());
    // küçük resmin üzerine gelince ürün dokusu önceden yüklenir (geçiş beklemeden başlar)
    $$('#pThumbs a').forEach((a) => a.addEventListener('pointerenter', () => scene.preload(+a.dataset.i)));
    // sahne ekrandan çıkınca çizim durur (aşağıdaki liste akıcı kayar)
    new IntersectionObserver(([en]) => scene.setActive(en.isIntersecting)).observe($('#pstage'));
  }).catch(() => {});
}
