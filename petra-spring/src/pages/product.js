import { initSense } from '../sense.js';
import { $, $$, FLAVORS as ALL, SITE, productCard, initReveal, webglOK, mailHref, waHref, nf, CAT_NAMES, contentsHTML, productUrl } from '../site.js';
import { CHANNEL_ICONS, GROUPS, fiyat } from '../data.js';

// ürün sayfası yalnızca ürünün kendi grubundaki ürünlerle çalışır (küçük resimler, oklar, 3B sahne)
const urlId = new URLSearchParams(location.search).get('id');
const own = ALL.find((x) => x.id === urlId);
const FLAVORS = own ? ALL.filter((x) => x.group === own.group) : ALL;

const pad = (n) => String(n).padStart(2, '0');
const groupLink = (f) => `/urunler.html?kat=${f.group}`;
const row = (k, v) => `<div><dt>${k}</dt><dd>${v}</dd></div>`;
const CHECK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12l4 4 10-10" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const chIcon = (k) => `<i><svg viewBox="0 0 24 24" aria-hidden="true"><path d="${CHANNEL_ICONS[k]}" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></i>`;
const N = FLAVORS.length;
let idx = FLAVORS.findIndex((x) => x.id === urlId);
if (idx < 0) { location.replace('/urunler.html'); idx = 0; }
let scene = null;

const logisticsOf = (f) => [
  ['Ürün grubu', GROUPS[f.group]],
  ['Perakende fiyatı', `${fiyat(f.price)} (usepetra.com)`],
  ['Ambalaj', f.group === 'kagit' ? 'Askılı blister kart' : f.group === 'cam' ? 'Askılı blister kart, cam şişe' : 'Kutulu cam şişe ve 5 bambu çubuk'],
  ['Koli içi adet', 'Teklifte bildirilir'],
  ['Teslimat', '1–3 iş günü; 50 desi ve üzeri siparişler 7 iş günü (anlaşmalı lojistik)'],
  ['Üretici', 'Petray Ltd. Şti. · Esenler, İstanbul'],
  ['Menşe', 'Türkiye'],
];

/* ---------- küçük resimler (tüm ürünler) ---------- */
$('#pThumbs').innerHTML = FLAVORS.map((f, i) => `<a href="${productUrl(f)}" data-i="${i}" style="--c:${f.bg}" class="${f.thumb ? 'kit' : ''}" aria-label="${f.name}"><img src="${f.mini}" alt="" ${i < 8 ? '' : 'loading="lazy" '}/></a>`).join('');
$$('#pThumbs a').forEach((a) => a.addEventListener('click', (e) => { e.preventDefault(); go(+a.dataset.i); }));
$('#pPrev').addEventListener('click', (e) => { e.preventDefault(); go(idx - 1); });
$('#pNext').addEventListener('click', (e) => { e.preventDefault(); go(idx + 1); });
document.addEventListener('keydown', (e) => {
  if (e.target.closest('input, textarea, select')) return;
  if (e.key === 'ArrowRight') go(idx + 1);
  if (e.key === 'ArrowLeft') go(idx - 1);
});

function fill() {
  const f = FLAVORS[idx];
  const img = f.thumb || f.tex;
  const stageImg = f.md;
  document.title = `${f.full} · Petra Spring`;
  document.querySelector('meta[name="description"]')?.setAttribute('content', `${f.full}: ${f.lead}`);
  $('#pstage').style.setProperty('--c', f.bg);
  // 3B arka planın önceden kaydedilmiş görüntüsü: sayfa açılır açılmaz gerçek zemin görünür
  $('#pstage').style.setProperty('--zemin', `url(/img/zemin/${f.id}.webp)`);
  $('#crumbs').innerHTML = `<li><a href="/">Ana sayfa</a></li><li><a href="/urunler.html">Ürünler</a></li><li><a href="${groupLink(f)}">${GROUPS[f.group]}</a></li>`;
  $('#pCount').textContent = `${pad(idx + 1)} / ${pad(N)}`;
  $('#pCat').textContent = `${CAT_NAMES[f.group]} · ${f.slogan}`;
  $('#pName').textContent = f.name;
  $('#pName').classList.toggle('long', f.name.length > 14);
  $('#pLead').textContent = f.lead;
  $('#pDesc').textContent = f.desc;
  $('#pFacts').innerHTML = f.facts.map(([k, v]) => row(k, v)).join('');
  $('#pClaims').innerHTML = f.claims.map((c) => `<li>${c}</li>`).join('');
  $('#pQuote').href = `/teklif.html?urun=${encodeURIComponent(f.id)}#form`;
  $('#pBuy').href = f.buy;
  $('#pBuyPrice').textContent = fiyat(f.price);
  $('#sQuote').href = $('#pQuote').href;
  $('#pQuote').dataset.urun = $('#sQuote').dataset.urun = `Petra Spring ${f.full}`;
  $('#pMail').href = mailHref(f);
  if (SITE.whatsapp) document.querySelectorAll('[data-site="wa"]').forEach((a) => { a.href = waHref(f); });
  if (window.__early) window.__early(f.id); else $('#pimg').src = stageImg;
  $('#pimg').alt = `${f.name} ürün görseli`;
  const prev = FLAVORS[(idx - 1 + N) % N], next = FLAVORS[(idx + 1) % N];
  $('#pPrev span').textContent = prev.short || prev.name;
  $('#pNext span').textContent = next.short || next.name;
  $('#pPrev').href = productUrl(prev);
  $('#pNext').href = productUrl(next);
  $$('#pThumbs a').forEach((a) => { const on = +a.dataset.i === idx; a.classList.toggle('on', on); if (on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
  const on = $(`#pThumbs a[data-i="${idx}"]`);
  const box = $('#pThumbs');
  if (on) box.scrollTo({ top: on.offsetTop - box.clientHeight / 2 + on.offsetHeight / 2, left: on.offsetLeft - box.clientWidth / 2 + on.offsetWidth / 2, behavior: 'smooth' });
  const panel = $('#pPanel');
  panel.classList.remove('swap'); void panel.offsetWidth; panel.classList.add('swap');

  /* hikâye, yararlar, kullanım */
  $('#sMedia').style.setProperty('--c', f.bg);
  $('#sImg').src = f.storyImg || img;
  $('#sImg').alt = `${f.name}`;
  // video varsa görselin yerine video (sessiz, döngü; yalnızca görünürken oynar)
  {
    const v = $('#sVid');
    $('#sMedia').classList.toggle('has-video', !!f.video);
    v.hidden = !f.video;
    if (f.video) {
      v.muted = true; v.autoplay = true; v.poster = f.videoPoster || f.storyImg;
      if (!v.src.endsWith(f.video)) { v.src = f.video; v.load(); }
      v.play().catch(() => {});
    } else { v.pause(); v.removeAttribute('src'); }
  }
  // video hissi: meyve parçaları görselin önünde ve arkasında ağır ağır süzülür
  {
    const n = f.video ? 0 : (f.parts || []).length;
    const spots = [[8, 14, 1], [78, 10, 0], [84, 62, 1], [6, 70, 0], [46, 84, 1], [64, 30, 0], [22, 40, 0]];
    $('#sParts').innerHTML = n ? spots.map(([x, y, front], k) => {
      const i = k % n, blur = front ? 'b' : '';
      const w = front ? 18 + (k % 3) * 4 : 9 + (k % 3) * 3;
      return `<img src="/parca/${f.id}-${i}${blur}.webp" alt="" style="left:${x}%;top:${y}%;width:${w}%;--d:${(k * 1.3).toFixed(1)}s;--t:${(7 + (k % 4) * 1.6).toFixed(1)}s;--r:${k % 2 ? 14 : -12}deg" class="${front ? 'fg' : 'bk'}" loading="lazy" />`;
    }).join('') : '';
  }
  $('#sEyebrow').textContent = `İşletmeler için · Neden Petra ${f.name}?`;
  $('#sChHead').textContent = `Petra ${f.name} nerede satılır?`;
  $('#sTitle').textContent = f.storyTitle || f.lead;
  $('#sText').textContent = f.story || f.desc;
  $('#sBens').innerHTML = (f.benefits || []).map(([b, t]) => `<li>${CHECK}<span><b>${b}</b>${t}</span></li>`).join('');
  $('#sUses').innerHTML = (f.channels || []).map(([k, name, why]) => `<div class="puse">${chIcon(k)}<b>${name}</b><p>${why}</p></div>`).join('');
  $('#hikaye').hidden = !f.story;

  /* sekmeler */
  const tabs = [['bilgi', 'Ürün bilgileri', `<dl class="spec">${(f.contents || []).map(([k, v]) => row(k, v)).join('')}</dl>`]];
  if (f.nutrition) tabs.push(['besin', 'Besin değerleri', contentsHTML({ nutrition: f.nutrition, name: f.name })]);
  if (f.menu) tabs.push(['menu', 'Kit içeriği', contentsHTML({ menu: f.menu })]);
  tabs.push(['lojistik', 'Ambalaj ve lojistik', `<dl class="spec">${logisticsOf(f).map(([k, v]) => row(k, v)).join('')}</dl><p class="tbl__note">Koli içi adet, bayi fiyatı ve barkod bilgileri bayi teklifinde paylaşılır.</p>`]);
  $('#tabs').innerHTML = tabs.map(([k, label], i) => `<button type="button" role="tab" id="t-${k}" aria-controls="p-${k}" aria-selected="${i === 0}">${label}</button>`).join('');
  $('#panels').innerHTML = tabs.map(([k, , html], i) => `<div class="panel" role="tabpanel" id="p-${k}" aria-labelledby="t-${k}"${i ? ' hidden' : ''}>${html.replace(/<dl class="spec"><\/dl>/, '')}</div>`).join('');
  $$('#tabs button').forEach((b) => b.addEventListener('click', () => {
    $$('#tabs button').forEach((x) => x.setAttribute('aria-selected', String(x === b)));
    $$('#panels .panel').forEach((p) => { p.hidden = p.id !== b.getAttribute('aria-controls'); });
  }));

  /* benzer ürünler */
  $('#related').innerHTML = [1, 2, 3, 4].map((k) => FLAVORS[(idx + k) % N]).map((x) => productCard(x)).join('');
  initReveal($('#related'));
}

function go(i) {
  idx = (i + N) % N;
  history.replaceState(null, '', productUrl(FLAVORS[idx]));
  fill();
  if (scene) { scene.inspectFlavor(idx); setPose(); }
  sense.update();
}

/* ---------- ürün föyü (yazdırılır, PDF olarak kaydedilir) ---------- */
function buildSheet() {
  const f = FLAVORS[idx];
  const today = new Date().toLocaleDateString('tr-TR');
  $('#sheet').innerHTML = `
    <header class="sheet__head"><img src="/logo-g.svg" alt="" width="120" height="50" /><div><b>Petra Spring</b><span>Araba ve oda kokuları</span></div><p>Ürün föyü<br /><small>${today}</small></p></header>
    <div class="sheet__top">
      <img class="sheet__img" src="${f.thumb || f.tex}" alt="" />
      <div>
        <p class="sheet__cat">Petra Spring · ${CAT_NAMES[f.group]}</p>
        <h1>${f.name}</h1>
        <p class="sheet__lead">${f.lead}</p>
        <p>${f.desc}</p>
        <dl class="spec">${f.facts.map(([k, v]) => row(k, v)).join('')}</dl>
      </div>
    </div>
    ${f.story ? `<h2>${f.storyTitle}</h2><p>${f.story}</p>` : ''}
    ${f.benefits ? `<h2>Yararları</h2><dl class="spec">${f.benefits.map(([k, v]) => row(k, v)).join('')}</dl>` : ''}
    ${f.channels ? `<h2>Nerede satılır</h2><dl class="spec">${f.channels.map(([, name, why]) => row(name, why)).join('')}</dl>` : ''}
    <h2>Ürün bilgileri</h2><dl class="spec">${(f.contents || []).map(([k, v]) => row(k, v)).join('')}</dl>
    ${f.nutrition ? `<h2>Besin değerleri</h2>${contentsHTML({ nutrition: f.nutrition, name: f.name }).replace('<dl class="spec"></dl>', '')}` : ''}
    ${f.menu ? `<h2>Kit içeriği</h2>${contentsHTML({ menu: f.menu }).replace('<dl class="spec"></dl>', '')}` : ''}
    <h2>Ambalaj ve lojistik</h2><dl class="spec">${logisticsOf(f).map(([k, v]) => row(k, v)).join('')}</dl>
    <footer class="sheet__foot">${SITE.company} · ${SITE.email}${SITE.phone && SITE.phone.tel ? ` · ${SITE.phone.display}` : ''} · ${location.origin}${productUrl(f)}</footer>`;
}
$('#pPrint').addEventListener('click', () => { buildSheet(); setTimeout(() => window.print(), 80); });
window.addEventListener('beforeprint', buildSheet);

fill();
$('#pstage').classList.add('filled');
// hareket yalnızca görünürken çalışır
new IntersectionObserver(([en]) => {
  $('#sMedia').classList.toggle('play', en.isIntersecting);
  const v = $('#sVid');
  if (!v.hidden) { if (en.isIntersecting) v.play().catch(() => {}); else v.pause(); }
}, { threshold: 0.15 }).observe($('#sMedia'));

/* ---------- 3B sahne: ürünün renginde arka plan, meyve parçaları, sürüklenebilir paket ---------- */
const phone = () => window.innerWidth < 760 || window.innerWidth / window.innerHeight < 0.9;
// masaüstünde paket, sol panel ile sağdaki küçük resimler arasındaki boşluğun tam ortasında durur
function stageCenter() {
  if ($('#pstage').classList.contains('sensing')) return 0.5;
  const st = $('#pstage').getBoundingClientRect();
  const pl = $('#pstage .pstage__panel')?.getBoundingClientRect();
  const th = $('#pThumbs')?.getBoundingClientRect();
  if (!pl || !th || !st.width || !pl.width || !th.width) return 0.585;
  const f = ((pl.right + th.left) / 2 - st.left) / st.width;
  return Math.min(0.7, Math.max(0.5, f));
}
function markCenter() { if (window.__fit) window.__fit(); else $('#pstage').style.setProperty('--cx', `${(stageCenter() * 100).toFixed(2)}%`); }
function setPose(snap) {
  if (!scene) return;
  const pose = snap === true ? scene.snapPose : scene.setPose;
  const H = scene.halfHeight(), A = scene.aspect(), W = H * A;
  const f = FLAVORS[idx];
  const k = f.model ? 1.05 : 1;
  if (phone()) pose({ x: 0, y: $('#pstage').classList.contains('sensing') ? H * 0.44 : H * 0.13, s: Math.min(1.6, W * 1.3, H * 0.74) * k * ($('#pstage').classList.contains('sensing') ? 0.5 : 1), ry: 0, rz: 0, cloud: 0, frost: 0, bd: 0 });
  else pose({ x: W * (2 * stageCenter() - 1), y: $('#pstage').classList.contains('sensing') ? -H * 0.1 : 0.02, s: Math.min(1.5, W * 0.6, H * 1.05) * k * ($('#pstage').classList.contains('sensing') ? 0.8 : 1), ry: 0, rz: 0, cloud: 0, frost: 0, bd: 0 });
}
markCenter();
window.addEventListener('resize', markCenter);
const sense = initSense({ stage: $('#pstage'), getFlavor: () => FLAVORS[idx], getScene: () => scene, onToggle: () => setPose() });
if (webglOK()) {
  import('../scene.js').then(async ({ createScene }) => {
    scene = createScene($('#pv'), FLAVORS, null, null, { backdrop: true, box: true, wheel: false, first: idx, noBackdrop: true });
    window.__scene = scene;
    await scene.ready;
    scene.setActive(true);
    scene.inspectOpen(idx);
    setPose(true);
    $('#pstage').classList.add('gl-on');
    window.addEventListener('resize', () => setPose());
    $$('#pThumbs a').forEach((a) => a.addEventListener('pointerenter', () => scene.preload(+a.dataset.i)));
    const zoomText = () => { $('#pZoom').textContent = `${Math.round(scene.zoom() * 100)}%`; };
    $$('.pstage__dock [data-view]').forEach((b) => b.addEventListener('click', () => {
      scene.setView(b.dataset.view);
      $$('.pstage__dock [data-view]').forEach((x) => x.classList.toggle('on', x === b));
    }));
    $$('.pstage__dock [data-zoom]').forEach((b) => b.addEventListener('click', () => { scene.zoomBy(+b.dataset.zoom); zoomText(); }));
    const spin = $('#spinBtn');
    spin.addEventListener('click', () => {
      const on = spin.getAttribute('aria-pressed') !== 'true';
      spin.setAttribute('aria-pressed', String(on));
      spin.classList.toggle('on', on);
      scene.setAutoRotate(on);
    });
    // telefonda yakınlaştır düğmesi: 1× → 1,7× → 2,4× → 1×; yakınlaşınca dönüş durur, yazılar okunur
    const LV = [1, 1.7, 2.4];
    let lv = 0;
    const fab = $('#zoomFab');
    const fabShow = () => {
      $('#zoomFabLv').textContent = `${String(LV[lv]).replace('.', ',')}×`;
      $('#zoomFabTx').textContent = lv === LV.length - 1 ? 'Uzaklaştır' : 'Yakınlaştır';
      fab.classList.toggle('on', lv > 0);
    };
    fab.addEventListener('click', () => {
      lv = (lv + 1) % LV.length;
      scene.zoomBy(LV[lv] / scene.zoomTarget());
      if (lv > 0 && spin.getAttribute('aria-pressed') === 'true') spin.click();
      fabShow(); zoomText();
    });
    $('#resetBtn').addEventListener('click', () => {
      scene.resetView(); zoomText(); lv = 0; fabShow();
      $$('.pstage__dock [data-view]').forEach((x) => x.classList.toggle('on', x.dataset.view === 'front'));
    });
  }).catch(() => {});
}
