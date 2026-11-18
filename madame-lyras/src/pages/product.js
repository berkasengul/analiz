import { $, $$, FLAVORS, SITE, productCard, initReveal, webglOK, mailHref, nf, lower, CAT_NAMES, contentsHTML, productUrl } from '../site.js';
import { KITS } from '../data.js';

const id = new URLSearchParams(location.search).get('id');
const f = FLAVORS.find((x) => x.id === id);
if (!f) location.replace('/urunler.html');

const CAT_LINK = { meyve: '/urunler.html?kat=meyve', tatli: '/urunler.html?kat=tatli', atistirmalik: '/urunler.html?kat=atistirmalik', kit: '/hazir-gida.html' };
const kit = f.kit ? KITS.find((k) => k.id === f.kit) : null;
const img = f.thumb || f.tex;

/* ---------- başlık ve özet ---------- */
document.title = `${f.name} · Genç Anadolu Gıda`;
document.querySelector('meta[name="description"]')?.setAttribute('content', `${f.name}: ${f.lead}`);
$('#crumbs').insertAdjacentHTML('beforeend', `<li><a href="${CAT_LINK[f.cat]}">${CAT_NAMES[f.cat]}</a></li><li aria-current="page">${f.name}</li>`);
$('#pCat').textContent = f.kit ? `ResQ · ${CAT_NAMES[f.cat]}` : `${CAT_NAMES[f.cat]} · Dondurularak kurutulmuş`;
$('#pName').textContent = f.name;
$('#pLead').textContent = f.lead;
$('#pDesc').textContent = f.desc;
$('#pFacts').innerHTML = f.facts.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('');
$('#pClaims').innerHTML = f.claims.map((c) => `<li>${c}</li>`).join('');
$('#pQuote').href = `/bayilik.html?urun=${encodeURIComponent(f.name)}#basvuru`;
$('#pMail').href = mailHref(f);
$('#pimg').src = img;
$('#pimg').alt = `${f.name} ürün görseli`;

/* ---------- sekmeler: ürün bilgileri, besin değerleri, kit içeriği, ambalaj ve lojistik ---------- */
const row = (k, v) => `<div><dt>${k}</dt><dd>${v}</dd></div>`;
const packing = kit ? (kit.model ? (kit.model.type === 'bucket' ? 'Kapaklı, kulplu saklama kovası' : 'Kilitli kapaklı saklama kasası') : 'Kilitli, nem geçirmez poşet') : 'Kilitli, ışık geçirmeyen doypack poşet';
const logistics = [
  ['Net ağırlık', kit ? `${nf(kit.gram)} g` : '16 g'],
  ['Ambalaj', packing],
  ['Koli içi adet', 'Teklifte bildirilir'],
  ['Raf ömrü', 'Tavsiye edilen tüketim tarihi ambalaj üzerindedir'],
  ['Saklama', 'Serin ve kuru yerde, açtıktan sonra hava almayacak şekilde'],
  ['Üretim yeri', 'Solagron Tarım Ürünleri · Silifke OSB, Mersin'],
  ['Menşe', 'Türkiye'],
];
const tabs = [['bilgi', 'Ürün bilgileri', `<dl class="spec">${(f.contents || []).map(([k, v]) => row(k, v)).join('')}</dl>`]];
if (f.nutrition) tabs.push(['besin', 'Besin değerleri', contentsHTML({ nutrition: f.nutrition, name: f.name })]);
if (f.menu) tabs.push(['menu', 'Kit içeriği', contentsHTML({ menu: f.menu })]);
tabs.push(['lojistik', 'Ambalaj ve lojistik', `<dl class="spec">${logistics.map(([k, v]) => row(k, v)).join('')}</dl><p class="tbl__note">Koli içi adet, palet düzeni ve barkod bilgileri bayi teklifinde ve ürün föyünde paylaşılır.</p>`]);
$('#tabs').innerHTML = tabs.map(([k, label], i) => `<button type="button" role="tab" id="t-${k}" aria-controls="p-${k}" aria-selected="${i === 0}">${label}</button>`).join('');
$('#panels').innerHTML = tabs.map(([k, , html], i) => `<div class="panel" role="tabpanel" id="p-${k}" aria-labelledby="t-${k}"${i ? ' hidden' : ''}>${html.replace(/<dl class="spec"><\/dl>/, '')}</div>`).join('');
$$('#tabs button').forEach((b) => b.addEventListener('click', () => {
  $$('#tabs button').forEach((x) => x.setAttribute('aria-selected', String(x === b)));
  $$('#panels .panel').forEach((p) => { p.hidden = p.id !== b.getAttribute('aria-controls'); });
}));

/* ---------- benzer ürünler ---------- */
const same = FLAVORS.filter((x) => x.cat === f.cat && x !== f);
const others = FLAVORS.filter((x) => x.cat !== f.cat && x.cat !== 'kit');
$('#related').innerHTML = [...same, ...others].slice(0, 4).map((x) => productCard(x)).join('');
initReveal($('#related'));

/* ---------- ürün föyü (yazdırılır, PDF olarak kaydedilir) ---------- */
function buildSheet() {
  const today = new Date().toLocaleDateString('tr-TR');
  $('#sheet').innerHTML = `
    <header class="sheet__head"><img src="/logo.svg" alt="" width="52" height="52" /><div><b>Genç Anadolu Gıda</b><span>Pazarlama Dağıtım Limited Şirketi</span></div><p>Ürün föyü<br /><small>${today}</small></p></header>
    <div class="sheet__top">
      <img class="sheet__img" src="${img}" alt="" />
      <div>
        <p class="sheet__cat">${$('#pCat').textContent}</p>
        <h1>${f.name}</h1>
        <p class="sheet__lead">${f.lead}</p>
        <p>${f.desc}</p>
        <dl class="spec">${f.facts.map(([k, v]) => row(k, v)).join('')}</dl>
      </div>
    </div>
    <h2>Ürün bilgileri</h2><dl class="spec">${(f.contents || []).map(([k, v]) => row(k, v)).join('')}</dl>
    ${f.nutrition ? `<h2>Besin değerleri</h2>${contentsHTML({ nutrition: f.nutrition, name: f.name }).replace('<dl class="spec"></dl>', '')}` : ''}
    ${f.menu ? `<h2>Kit içeriği</h2>${contentsHTML({ menu: f.menu }).replace('<dl class="spec"></dl>', '')}` : ''}
    <h2>Ambalaj ve lojistik</h2><dl class="spec">${logistics.map(([k, v]) => row(k, v)).join('')}</dl>
    <footer class="sheet__foot">Genç Anadolu Gıda Pazarlama Dağıtım Ltd. Şti. · ${SITE.email}${SITE.phone && SITE.phone.tel ? ` · ${SITE.phone.display}` : ''} · ${location.origin}${productUrl(f)}</footer>`;
}
$('#pPrint').addEventListener('click', () => { buildSheet(); setTimeout(() => window.print(), 80); });
window.addEventListener('beforeprint', buildSheet);

/* ---------- 3B görüntüleyici ---------- */
if (webglOK()) {
  import('../scene.js').then(async ({ createScene }) => {
    const scene = createScene($('#pv'), [f], null, null, { box: true, plain: true, wheel: false });
    await scene.ready;
    scene.setActive(true);
    scene.inspectOpen(0);
    const pose = () => scene.setPose({ x: 0, y: -0.02, s: f.model ? 1.5 : 1.42, ry: 0, rz: 0, cloud: 0, frost: 0, bd: 0 });
    pose();
    $('#viewer').classList.add('gl-on');
    $$('.viewer__bar [data-view]').forEach((b) => b.addEventListener('click', () => {
      scene.setView(b.dataset.view);
      $$('.viewer__bar [data-view]').forEach((x) => x.classList.toggle('on', x === b));
    }));
    $$('.viewer__bar [data-zoom]').forEach((b) => b.addEventListener('click', () => scene.zoomBy(+b.dataset.zoom)));
    const spin = $('#spinBtn');
    spin.addEventListener('click', () => {
      const on = spin.getAttribute('aria-pressed') !== 'true';
      spin.setAttribute('aria-pressed', String(on));
      spin.classList.toggle('on', on);
      scene.setAutoRotate(on);
    });
  }).catch(() => {});
}
void lower;
