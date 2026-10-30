// SEO üretici: ürün kataloğundan arama motoru ve yapay zekâ aramaları için içerik üretir.
// Kullanım (store klasöründen):  node tools/seo_build.mjs
// Üretir: index.html <head> SEO bloğu + SSS bölümü, urun/<ad>/ sayfaları, kategori sayfaları,
// sitemap.xml, robots.txt, llms.txt. Ürün veya ayar değişince yeniden çalıştırın.
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const STORE = join(dirname(fileURLToPath(import.meta.url)), '..');
const { PRODUCTS, SPOTS } = await import(join(STORE, 'js/products.js'));
const { SITE } = await import(join(STORE, 'js/config.js'));
const { STORIES, storyPath } = await import(join(STORE, 'js/stories.js'));
const BASE = SITE.url.replace(/\/$/, '');
const TODAY = new Date().toISOString().slice(0, 10);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const TR = { ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ş: 's', ü: 'u', â: 'a', î: 'i', û: 'u' };
const slug = (s) => s.toLocaleLowerCase('tr-TR').replace(/[çğıöşüâîû]/g, (c) => TR[c]).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const tl = (n) => `${n} TL`;
const ages = (p) => `${p.sizes[0].split('-')[0]}–${p.sizes[p.sizes.length - 1].split('-')[1]} yaş`;
const genderTxt = (g) => (g === 'erkek' ? 'Erkek çocuk' : 'Kız çocuk');
const pageOf = (p) => `urun/${slug(p.name)}/`;
const PRICE_VALID = `${new Date().getFullYear() + 1}-12-31`;

/* ---------- SSS (sayfada görünür + FAQPage verisi) ---------- */
const sizeRows = SITE.sizeGuide.map(([s, h]) => `${s} yaş: ${h}`).join(', ');
const FAQ = [
  { id: 'beden', q: 'Çocuk pijama bedeni nasıl seçilir?', a: `Bedenleri yaşa göre 2-3 yaştan 11-12 yaşa kadar sunuyoruz. Boy ölçüsüne göre: ${sizeRows}. İki beden arasında kalırsanız büyük olanı seçin; manşetli paçalar boyu toparlar.` },
  { id: 'kumas', q: 'SESA KIDS pijamaları hangi kumaştan?', a: SITE.fabric },
  { id: 'kargo', q: 'Kargo ne zaman gelir, ücreti ne kadar?', a: SITE.shipping },
  { id: 'iade', q: 'İade ve değişim yapabilir miyim?', a: SITE.returns },
  { id: 'odeme', q: 'Nasıl sipariş verir ve öderim?', a: `Ürün sayfasında beden seçip “Sepete Ekle”ye basın ya da sağ alttaki SESA Asistan ile sohbet ederek sipariş verin. ${SITE.payment}` },
  { id: 'yas', q: 'Hangi yaşlar için çocuk pijama takımı var?', a: `Kız ve erkek çocuklar için 2–12 yaş arası ${PRODUCTS.length} farklı desende pijama takımı var: kedili, çilekli, ayıcıklı ekose, gezegenli, safari, polis arabalı, iş makineli ve çizgili modeller.` },
];

/* ---------- Ortak parçalar ---------- */
const org = {
  '@type': ['Organization', 'ClothingStore'],
  ...(SITE.geo ? { geo: { '@type': 'GeoCoordinates', latitude: SITE.geo.lat, longitude: SITE.geo.lng }, hasMap: SITE.mapLink,
    address: { '@type': 'PostalAddress', ...(SITE.address ? { streetAddress: SITE.address } : {}), addressLocality: 'Ümraniye', addressRegion: SITE.city, postalCode: '34764', addressCountry: 'TR' } } : {}), '@id': `${BASE}/#org`, name: SITE.name, url: `${BASE}/`,
  logo: `${BASE}/assets/brand/logo.png`, image: `${BASE}/assets/brand/og.jpg`, email: SITE.email, priceRange: '₺₺',
  ...(SITE.whatsapp ? { contactPoint: { '@type': 'ContactPoint', telephone: `+${SITE.whatsapp}`, contactType: 'customer service', areaServed: 'TR', availableLanguage: 'Turkish' } } : {}),
};
const productLd = (p) => ({
  '@type': 'Product', '@id': `${BASE}/${pageOf(p)}#product`, name: p.name, sku: p.id, brand: { '@type': 'Brand', name: SITE.name },
  description: `${genderTxt(p.gender)} pijama takımı, ${ages(p)}. ${p.desc} Renk: ${p.colorName}.`,
  image: [`${BASE}/${p.image}`], color: p.colorName, material: 'Pamuk', category: 'Çocuk Giyim > Pijama Takımı',
  audience: { '@type': 'PeopleAudience', suggestedGender: p.gender === 'erkek' ? 'male' : 'female', suggestedMinAge: 2, suggestedMaxAge: 12 },
  size: p.sizes.map((s) => `${s} yaş`),
  offers: {
    '@type': 'Offer', url: `${BASE}/${pageOf(p)}`, priceCurrency: 'TRY', price: p.price, priceValidUntil: PRICE_VALID,
    availability: 'https://schema.org/InStock', itemCondition: 'https://schema.org/NewCondition', seller: { '@id': `${BASE}/#org` },
    shippingDetails: { '@type': 'OfferShippingDetails', shippingDestination: { '@type': 'DefinedRegion', addressCountry: 'TR' },
      deliveryTime: { '@type': 'ShippingDeliveryTime', handlingTime: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 3, unitCode: 'DAY' }, transitTime: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 3, unitCode: 'DAY' } } },
    hasMerchantReturnPolicy: { '@type': 'MerchantReturnPolicy', applicableCountry: 'TR', returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow', merchantReturnDays: 14, returnMethod: 'https://schema.org/ReturnByMail' },
  },
});
const ld = (obj) => `<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', ...obj })}</script>`;
const head = ({ title, desc, path, image, extra = '' }) => `  <title>${esc(title)}</title>
  <meta name="description" content="${esc(desc)}">
  <link rel="canonical" href="${BASE}/${path}">
  <meta name="robots" content="index, follow, max-image-preview:large">
  <meta property="og:type" content="website">
  <meta property="og:locale" content="tr_TR">
  <meta property="og:site_name" content="${SITE.name}">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(desc)}">
  <meta property="og:url" content="${BASE}/${path}">
  <meta property="og:image" content="${BASE}/${image}">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="icon" href="${'../'.repeat(path.split('/').filter(Boolean).length)}assets/brand/icon.png">
${extra}`;

/* ---------- Ana sayfa ---------- */
const HOME_TITLE = 'Çocuk Pijama Takımları | Kız ve Erkek Çocuk Pijama – SESA KIDS';
const HOME_DESC = `SESA KIDS çocuk pijama takımları: 2–12 yaş kız ve erkek çocuklar için pamuklu, yumuşacık, manşetli pijama modelleri. Kedili, çilekli, ekose, gezegenli ${PRODUCTS.length} desen; 360° 3D inceleyin, kolayca sipariş verin.`;
const homeLd = ld({ '@graph': [
  org,
  { '@type': 'WebSite', '@id': `${BASE}/#site`, url: `${BASE}/`, name: SITE.name, inLanguage: 'tr-TR', publisher: { '@id': `${BASE}/#org` } },
  { '@type': 'ItemList', name: 'Çocuk pijama takımları', itemListElement: PRODUCTS.map((p, i) => ({ '@type': 'ListItem', position: i + 1, url: `${BASE}/${pageOf(p)}`, name: p.name })) },
  { '@type': 'FAQPage', mainEntity: FAQ.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) },
] });
const faqHtml = `    <section class="faq" id="sss" aria-labelledby="sss-h">
      <div class="faq-inner">
        <div class="faq-head">
          <h2 id="sss-h">Çocuk pijaması hakkında <em>sık sorulanlar</em></h2>
          <p>SESA KIDS kız ve erkek çocuk pijama takımları; 2–12 yaş, %100 pamuk, manşetli ve yumuşacık. Aradığınızı bulamazsanız sağ alttaki SESA Asistan'a sorun.</p>
          <p class="faq-links"><a href="kiz-cocuk-pijama/">Kız çocuk pijama takımları</a><a href="erkek-cocuk-pijama/">Erkek çocuk pijama takımları</a></p>
        </div>
        <div class="faq-list">
${FAQ.map((f) => `          <details id="sss-${f.id}"><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join('\n')}
        </div>
      </div>
    </section>
`;
let index = readFileSync(join(STORE, 'index.html'), 'utf8');
// Hız: kod dosyalarını zincirleme beklemeden paralel iste, ilk ürünün ön karesini hemen indir
const MODULES = ['main', 'products', 'garments', 'faces', 'spins', 'figure3d', 'config', 'orders', 'account', 'scenes', 'story', 'bag', 'celebrate', 'chat', 'themes'];
const preload = [
  `  <link rel="preload" as="fetch" href="${PRODUCTS[0].image}" crossorigin="anonymous" fetchpriority="high">`,
  '  <link rel="modulepreload" href="vendor/three.module.min.js">',
  '  <link rel="modulepreload" href="vendor/GLTFLoader.js">',
  '  <link rel="modulepreload" href="vendor/BufferGeometryUtils.js">',
  ...MODULES.map((m) => `  <link rel="modulepreload" href="js/${m}.js">`),
].join('\n');
index = index.replace(/<!-- SEO:BEGIN -->[\s\S]*?<!-- SEO:END -->/, `<!-- SEO:BEGIN -->\n${head({ title: HOME_TITLE, desc: HOME_DESC, path: '', image: 'assets/brand/og.jpg', extra: `  ${homeLd}\n${preload}\n` })}  <!-- SEO:END -->`);
index = index.replace(/<!-- FAQ:BEGIN -->[\s\S]*?<!-- FAQ:END -->/, `<!-- FAQ:BEGIN -->\n${faqHtml}    <!-- FAQ:END -->`);
writeFileSync(join(STORE, 'index.html'), index);

/* ---------- Statik sayfalar (ürün + kategori) ---------- */
const shell = ({ depth, headHtml, body }) => `<!doctype html>
<html lang="tr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
${headHtml}  <meta name="theme-color" content="#f9a25c">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600;700&family=Nunito:wght@500;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="${depth}css/seo.css">
</head>
<body>
  <header class="s-head"><a class="s-logo" href="${depth}"><span class="b">SESA</span> <span class="p">KIDS</span></a>
    <nav><a href="${depth}#vitrin">Vitrin</a><a href="${depth}kiz-cocuk-pijama/">Kız çocuk</a><a href="${depth}erkek-cocuk-pijama/">Erkek çocuk</a><a href="${depth}#sss">SSS</a></nav></header>
${body}
  <footer class="s-foot"><p>© ${new Date().getFullYear()} ${SITE.name} · Çocuk pijama takımları · <a href="mailto:${SITE.email}">${SITE.email}</a></p></footer>
</body>
</html>
`;
const card = (p, depth) => `<a class="s-card" href="${depth}${pageOf(p)}" style="--c:${p.accent};--t:${p.tint}"><img src="${depth}${p.image}" alt="${esc(p.name)} – ${genderTxt(p.gender).toLowerCase()} pijama takımı" loading="lazy" width="240" height="320"><b>${esc(p.name)}</b><span>${tl(p.price)} · ${ages(p)}</span></a>`;
const crumbs = (items) => ld({ '@type': 'BreadcrumbList', itemListElement: items.map(([name, url], i) => ({ '@type': 'ListItem', position: i + 1, name, item: url })) });

if (existsSync(join(STORE, 'urun'))) rmSync(join(STORE, 'urun'), { recursive: true });
for (const p of PRODUCTS) {
  const path = pageOf(p);
  const depth = '../../';
  const g = genderTxt(p.gender);
  const title = `${p.name} – ${p.gender === 'erkek' ? 'Erkek Çocuk' : 'Kız Çocuk'} Pijama Takımı | SESA KIDS`;
  const desc = `${p.name}: ${p.desc} ${p.gender === 'erkek' ? 'Erkek' : 'Kız'} çocuklar için ${ages(p)}, pamuklu, manşetli pijama takımı. ${tl(p.price)}. 360° 3D inceleyin, beden seçip sipariş verin.`;
  const others = PRODUCTS.filter((x) => x.id !== p.id && x.gender === p.gender).slice(0, 4);
  const catPath = p.gender === 'erkek' ? 'erkek-cocuk-pijama/' : 'kiz-cocuk-pijama/';
  const body = `  <main class="s-main">
    <nav class="s-crumb" aria-label="Konum"><a href="${depth}">Ana sayfa</a> › <a href="${depth}${catPath}">${g} pijama</a> › <span>${esc(p.name)}</span></nav>
    <article class="s-product" style="--c:${p.accent};--t:${p.tint}">
      <div class="s-media"><img src="${depth}${p.image}" alt="${esc(p.name)} – ${g.toLowerCase()} pijama takımı, ön görünüm" width="480" height="640"></div>
      <div class="s-info">
        <span class="s-tag">${g}</span>
        <h1>${esc(p.name)}</h1>
        <p class="s-price">${tl(p.price)}</p>
        <p>${esc(p.desc)}</p>
        <ul><li>Renk: ${esc(p.colorName)}</li><li>Yaş / beden: ${p.sizes.map((s) => `${s}`).join(', ')} yaş</li><li>%100 pamuk, manşetli bilek ve paçalar</li>${SPOTS.map((s) => `<li>${esc(s.label)}: ${esc(s.text)}</li>`).join('')}</ul>
        <a class="s-btn" href="${depth}#urun=${p.id}">360° 3D incele ve sipariş ver</a>
        <p class="s-note">${esc(SITE.shipping)}</p>
      </div>
    </article>
    <section class="s-more"><h2>Benzer ${g.toLowerCase()} pijama takımları</h2><div class="s-grid">${others.map((x) => card(x, depth)).join('')}</div></section>
  </main>`;
  const headHtml = head({ title, desc, path, image: p.image, extra: `  ${ld({ '@graph': [org, productLd(p)] })}\n  ${crumbs([['Ana sayfa', `${BASE}/`], [`${g} pijama`, `${BASE}/${catPath}`], [p.name, `${BASE}/${path}`]])}\n` });
  mkdirSync(join(STORE, path), { recursive: true });
  writeFileSync(join(STORE, path, 'index.html'), shell({ depth, headHtml, body }));
}

/* ---------- Masal sayfaları (paketteki karekod buraya açılır) ---------- */
const TALE_JS = `(()=>{const b=document.querySelector('.m-listen');const s=window.speechSynthesis;if(!b||!s||!window.SpeechSynthesisUtterance){b&&b.remove();return}
const parts=[...document.querySelectorAll('[data-say]')].map(e=>e.textContent.trim());let on=false;
const voice=()=>{const v=s.getVoices();return v.find(x=>/^tr/i.test(x.lang))||null};s.getVoices();
const set=x=>{on=x;b.classList.toggle('is-on',x);b.querySelector('span').textContent=x?'Durdur':'Masalı sesli dinle';b.setAttribute('aria-pressed',x);b.querySelector('path').setAttribute('d',x?'M7 5h4v14H7zM13 5h4v14h-4z':'M8 5v14l11-7z')};
b.addEventListener('click',()=>{if(on){s.cancel();set(false);return}set(true);let i=0;const next=()=>{if(!on)return;if(i>=parts.length){set(false);return}
const u=new SpeechSynthesisUtterance(parts[i++]);u.lang='tr-TR';const v=voice();if(v)u.voice=v;u.rate=.88;u.pitch=1.05;u.onend=()=>setTimeout(next,450);u.onerror=()=>set(false);s.speak(u)};next()});})();`;
const TALE_CSS = `*{box-sizing:border-box}body{margin:0;min-height:100vh;background:radial-gradient(120% 70% at 80% 0%,color-mix(in srgb,var(--c) 30%,transparent),transparent 60%),linear-gradient(180deg,#24276a,#14163d 70%);color:#e9ebff;font:600 17px/1.75 Nunito,system-ui,sans-serif;-webkit-font-smoothing:antialiased}
body:before{content:"";position:fixed;inset:0;pointer-events:none;opacity:.6;background-image:radial-gradient(1.6px 1.6px at 10% 12%,#fff,transparent),radial-gradient(1.2px 1.2px at 82% 8%,#fff,transparent),radial-gradient(1.4px 1.4px at 90% 46%,#fff,transparent),radial-gradient(1.1px 1.1px at 24% 70%,#fff,transparent),radial-gradient(1.3px 1.3px at 60% 28%,#fff,transparent),radial-gradient(1px 1px at 46% 92%,#fff,transparent)}
a{color:inherit}.m-wrap{position:relative;max-width:680px;margin:0 auto;padding:22px 20px 60px}
.m-top{display:flex;justify-content:space-between;align-items:center}.m-logo img{height:30px;display:block}.m-top a.m-all{font-size:14px;color:#c9ccff}
.m-fig{position:relative;width:min(260px,62vw);aspect-ratio:3/4;margin:18px auto 6px}.m-fig:before{content:"";position:absolute;inset:12% 2% 0;border-radius:50%;background:radial-gradient(closest-side,color-mix(in srgb,var(--c) 55%,#fff 10%),transparent);filter:blur(10px);opacity:.75}
.m-fig img{position:relative;width:100%;height:100%;object-fit:contain;filter:drop-shadow(0 18px 24px rgba(0,0,0,.35))}
.m-kick{margin:0;text-align:center;font-size:12px;font-weight:800;letter-spacing:.16em;text-transform:uppercase;color:#ffd45c}
h1{margin:6px 0 4px;text-align:center;font:600 clamp(28px,7vw,40px)/1.15 Fredoka,system-ui,sans-serif;color:#fff;text-wrap:balance}
.m-hero{margin:0 0 20px;text-align:center;color:#c9ccff;font-size:15px}
.m-listen{display:flex;align-items:center;justify-content:center;gap:10px;width:100%;max-width:340px;height:56px;margin:0 auto 26px;border:0;border-radius:999px;background:#ffd45c;color:#1b1d4f;font:600 18px Fredoka,system-ui,sans-serif;cursor:pointer;box-shadow:0 10px 26px rgba(255,212,92,.25)}
.m-listen svg{width:22px;height:22px;fill:currentColor}.m-listen.is-on{background:#fff}
.m-text p{margin:0 0 18px}.m-text p:first-child:first-letter{float:left;font:600 3.1em/0.9 Fredoka,system-ui,sans-serif;margin:.06em .08em 0 0;color:#ffd45c}
.m-ask{margin:26px 0;padding:16px 18px;border-radius:18px;background:rgba(255,255,255,.08);box-shadow:inset 0 0 0 1px rgba(255,255,255,.12)}.m-ask b{display:block;font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#ffd45c}
.m-end{text-align:center;font:600 22px Fredoka,system-ui,sans-serif;color:#fff;margin:30px 0}
.m-cta{display:block;max-width:340px;margin:0 auto;padding:15px 20px;border-radius:999px;background:#fff;color:#1b1d4f;text-align:center;text-decoration:none;font:600 17px Fredoka,system-ui,sans-serif}
.m-more{margin-top:44px}.m-more h2{font:600 20px Fredoka,system-ui,sans-serif;color:#fff;text-align:center;margin:0 0 14px}
.m-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:10px}.m-grid a{display:flex;gap:10px;align-items:center;padding:10px 12px;border-radius:16px;background:rgba(255,255,255,.07);text-decoration:none;font-size:14px;line-height:1.3}.m-grid a span{font-size:22px}
.m-foot{margin-top:40px;text-align:center;font-size:13px;color:#9da1d6}`;
const taleShell = ({ depth, title, desc, path, image, accent, body, extra = '' }) => `<!doctype html>
<html lang="tr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(desc)}">
  <link rel="canonical" href="${BASE}/${path}">
  <meta property="og:type" content="article"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:image" content="${BASE}/${image}"><meta property="og:url" content="${BASE}/${path}"><meta property="og:locale" content="tr_TR">
  <meta name="theme-color" content="#1b1d4f">
  <link rel="icon" href="${depth}assets/brand/icon.png">
  <link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@600&family=Nunito:wght@600;800&display=swap" rel="stylesheet">
  <style>:root{--c:${accent}}${TALE_CSS}</style>
${extra}</head>
<body>
${body}
<script>${TALE_JS}</script>
</body>
</html>
`;
const taleProducts = PRODUCTS.filter((p) => STORIES[p.id]);
const taleList = (except, depth) => taleProducts.filter((x) => x.id !== except).map((x) => `<a href="${depth}${storyPath(x)}"><span>${STORIES[x.id].emoji}</span>${esc(STORIES[x.id].title)}</a>`).join('');
if (existsSync(join(STORE, 'masal'))) rmSync(join(STORE, 'masal'), { recursive: true });
for (const p of taleProducts) {
  const t = STORIES[p.id];
  const path = storyPath(p);
  const depth = '../../';
  const title = `${t.title} – ${p.name} Uyku Masalı | SESA KIDS`;
  const desc = `${t.text[0].slice(0, 140)}… ${p.name} pijamasının uyku masalını okuyun ya da sesli dinleyin.`;
  const body = `<div class="m-wrap">
  <header class="m-top"><a class="m-logo" href="${depth}" aria-label="SESA KIDS ana sayfa"><img src="${depth}assets/brand/logo-wordmark.png" alt="SESA KIDS"></a><a class="m-all" href="${depth}masal/">Tüm masallar</a></header>
  <main>
    <div class="m-fig"><img src="${depth}${p.image}" alt="${esc(p.name)}" width="300" height="400"></div>
    <p class="m-kick">SESA KIDS uyku masalı</p>
    <h1 data-say>${esc(t.title)}</h1>
    <p class="m-hero">Kahramanımız: <b>${esc(t.hero)}</b> ${t.emoji} · ${esc(p.name)}</p>
    <button type="button" class="m-listen" aria-pressed="false"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg><span>Masalı sesli dinle</span></button>
    <article class="m-text">${t.text.map((x) => `<p data-say>${esc(x)}</p>`).join('')}</article>
    <p class="m-ask"><b>Uyumadan önce sor</b><span data-say>${esc(t.ask)}</span></p>
    <p class="m-end">İyi geceler, tatlı rüyalar 🌙</p>
    <a class="m-cta" href="${depth}#urun=${p.id}">${esc(p.name)} pijamasını incele</a>
    <section class="m-more"><h2>Diğer pijamaların masalları</h2><div class="m-grid">${taleList(p.id, depth)}</div></section>
  </main>
  <footer class="m-foot">© ${new Date().getFullYear()} ${SITE.name} · Çocuk pijama takımları</footer>
</div>`;
  const extra = `  ${ld({ '@type': 'ShortStory', name: t.title, headline: t.title, inLanguage: 'tr', url: `${BASE}/${path}`, image: `${BASE}/${p.image}`, text: t.text.join(' '), character: { '@type': 'Person', name: t.hero }, audience: { '@type': 'PeopleAudience', suggestedMinAge: 2, suggestedMaxAge: 12 }, publisher: { '@id': `${BASE}/#org` }, about: { '@id': `${BASE}/${pageOf(p)}#product` } })}\n`;
  mkdirSync(join(STORE, path), { recursive: true });
  writeFileSync(join(STORE, path, 'index.html'), taleShell({ depth, title, desc, path, image: p.image, accent: p.accent, body, extra }));
}
{
  const depth = '../';
  const body = `<div class="m-wrap">
  <header class="m-top"><a class="m-logo" href="${depth}" aria-label="SESA KIDS ana sayfa"><img src="${depth}assets/brand/logo-wordmark.png" alt="SESA KIDS"></a><a class="m-all" href="${depth}">Mağaza</a></header>
  <main>
    <p class="m-kick" style="margin-top:34px">Her pijamanın bir masalı var</p>
    <h1>SESA KIDS uyku masalları</h1>
    <p class="m-hero">Pijamasını giyen, masalını dinler. Her gece yeni bir masal 🌙</p>
    <div class="m-grid">${taleList(null, depth)}</div>
  </main>
  <footer class="m-foot">© ${new Date().getFullYear()} ${SITE.name}</footer>
</div>`;
  writeFileSync(join(STORE, 'masal', 'index.html'), taleShell({ depth, title: 'Çocuklar için uyku masalları | SESA KIDS', desc: 'Her SESA KIDS pijamasının kendine ait bir uyku masalı var. Okuyun ya da sesli dinleyin; uyku vaktini bir ritüele dönüştürün.', path: 'masal/', image: 'assets/brand/og.jpg', accent: '#f59bd6', body }));
}

const CATS = [
  { path: 'kiz-cocuk-pijama/', h1: 'Kız çocuk pijama takımları', g: 'kiz', title: 'Kız Çocuk Pijama Takımları 2–12 Yaş | SESA KIDS',
    intro: 'Kız çocuklar için pamuklu, yumuşacık ve rengârenk pijama takımları. Kalpli kedi, çilekli, ayıcıklı ekose ve safari desenleri; 2–12 yaş bedenler, manşetli paçalar.' },
  { path: 'erkek-cocuk-pijama/', h1: 'Erkek çocuk pijama takımları', g: 'erkek', title: 'Erkek Çocuk Pijama Takımları 2–12 Yaş | SESA KIDS',
    intro: 'Erkek çocuklar için pamuklu, rahat pijama takımları. Gezegenler, iş makineleri, polis arabaları, renkli kediler, ekose ve çizgili modeller; 2–12 yaş bedenler.' },
  { path: 'cocuk-pijama-takimi/', h1: 'Çocuk pijama takımları', g: null, title: 'Çocuk Pijama Takımı Modelleri – Kız ve Erkek | SESA KIDS',
    intro: `Kız ve erkek çocuklar için ${PRODUCTS.length} desende çocuk pijama takımı. %100 pamuk, tene dost, manşetli; 2–12 yaş. Bedeninizi seçin, 360° inceleyin, kolayca sipariş verin.` },
];
for (const c of CATS) {
  const list = PRODUCTS.filter((p) => !c.g || p.gender === c.g);
  const depth = '../';
  const body = `  <main class="s-main">
    <nav class="s-crumb" aria-label="Konum"><a href="${depth}">Ana sayfa</a> › <span>${c.h1}</span></nav>
    <section class="s-cat"><h1>${c.h1}</h1><p>${c.intro}</p></section>
    <div class="s-grid">${list.map((p) => card(p, depth)).join('')}</div>
    <section class="s-faq"><h2>Sık sorulanlar</h2>${FAQ.slice(0, 4).map((f) => `<details><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join('')}</section>
  </main>`;
  const headHtml = head({ title: c.title, desc: c.intro, path: c.path, image: 'assets/brand/og.jpg', extra: `  ${ld({ '@type': 'CollectionPage', name: c.h1, url: `${BASE}/${c.path}`, mainEntity: { '@type': 'ItemList', itemListElement: list.map((p, i) => ({ '@type': 'ListItem', position: i + 1, url: `${BASE}/${pageOf(p)}`, name: p.name })) } })}\n` });
  mkdirSync(join(STORE, c.path), { recursive: true });
  writeFileSync(join(STORE, c.path, 'index.html'), shell({ depth, headHtml, body }));
}

/* ---------- Site haritası, robots, llms.txt ---------- */
const urls = ['', ...CATS.map((c) => c.path), ...PRODUCTS.map(pageOf), 'masal/', ...taleProducts.map(storyPath)];
writeFileSync(join(STORE, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls.map((u) => {
  const p = PRODUCTS.find((x) => pageOf(x) === u);
  return `  <url><loc>${BASE}/${u}</loc><lastmod>${TODAY}</lastmod><priority>${u === '' ? '1.0' : p ? '0.8' : '0.9'}</priority>${p ? `<image:image><image:loc>${BASE}/${p.image}</image:loc></image:image>` : ''}</url>`;
}).join('\n')}
</urlset>
`);
writeFileSync(join(STORE, 'robots.txt'), `# Arama motorları ve yapay zekâ asistanları siteyi tarayabilir
User-agent: *
Allow: /

User-agent: GPTBot
Allow: /

User-agent: OAI-SearchBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: Google-Extended
Allow: /

Sitemap: ${BASE}/sitemap.xml
`);
writeFileSync(join(STORE, 'llms.txt'), `# ${SITE.name}

> ${SITE.name}, Türkiye'de kız ve erkek çocuklar için 2–12 yaş pamuklu pijama takımları satan bir çocuk giyim markasıdır. Tüm takımlar ${tl(PRODUCTS[0].price)}; site üzerinden veya SESA Asistan sohbetiyle sipariş verilir.

- Web: ${BASE}/
- E-posta: ${SITE.email}
- Mağaza: ${SITE.address}, ${SITE.city} (${SITE.mapLink})
- Kargo: ${SITE.shipping}
- İade: ${SITE.returns}
- Kumaş: ${SITE.fabric}
- Bedenler: ${sizeRows}

## Uyku masalları
Her pijamanın kendine ait bir uyku masalı vardır (paketteki karekodla açılır): ${BASE}/masal/
${PRODUCTS.filter((p) => STORIES[p.id]).map((p) => `- [${STORIES[p.id].title}](${BASE}/${storyPath(p)}): ${p.name} masalı, kahramanı ${STORIES[p.id].hero}.`).join('\n')}

## Kategoriler
${CATS.map((c) => `- [${c.h1}](${BASE}/${c.path}): ${c.intro}`).join('\n')}

## Ürünler
${PRODUCTS.map((p) => `- [${p.name}](${BASE}/${pageOf(p)}): ${genderTxt(p.gender)}, ${ages(p)}, ${tl(p.price)}. ${p.desc} Renk: ${p.colorName}.`).join('\n')}

## Sık sorulanlar
${FAQ.map((f) => `- **${f.q}** ${f.a}`).join('\n')}
`);
console.log(`SEO: ${PRODUCTS.length} ürün sayfası, ${CATS.length} kategori, ${urls.length} adres site haritasında (${BASE})`);
