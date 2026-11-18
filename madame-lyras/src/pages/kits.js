import { $, FLAVORS, nf, productUrl, initReveal } from '../site.js';
import { KITS } from '../data.js';

const ARROW = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const flavorOf = (k) => FLAVORS.find((f) => f.kit === k.id);
const type = (k) => (k.model ? (k.model.type === 'bucket' ? 'Kova' : 'Kasa') : 'Poşet');

$('#kits').innerHTML = KITS.map((k) => {
  const f = flavorOf(k);
  return `<article class="kcard reveal">
    <a class="kcard__media" href="${productUrl(f)}"><img src="${k.img}" alt="ResQ ${k.name}" loading="lazy" /></a>
    <div class="kcard__body">
      <small>ResQ · ${k.title}</small>
      <h3><a href="${productUrl(f)}">${k.name}</a></h3>
      <ul class="kcard__chips"><li><b>${k.servis}</b> servis</li><li><b>${nf(k.gram)}</b> g</li><li><b>${nf(k.kcal)}</b> kcal</li></ul>
      <p>${k.menu ? `${k.who} · ${k.menu.length} çeşit yemek: ${k.menu.slice(0, 5).map((r) => r[0]).join(', ')}…` : 'Granola, gerçek meyve parçaları ve sütlü karışım; su ekleyin, 2 dakikada hazır.'}</p>
      <div class="kcard__actions">
        <a class="btn btn--primary btn--sm" href="${productUrl(f)}">Ürün sayfası ${ARROW}</a>
        <a class="btn btn--outline btn--sm" href="/bayilik.html?urun=${encodeURIComponent(f.name)}#basvuru">Teklif iste</a>
      </div>
    </div>
  </article>`;
}).join('');

$('#compare').innerHTML = `<table><caption>ResQ ürünleri</caption><thead><tr><th scope="col">Ürün</th><th scope="col">Ambalaj</th><th scope="col">Kişi / süre</th><th scope="col">Servis</th><th scope="col">Ağırlık</th><th scope="col">Enerji</th></tr></thead><tbody>${KITS.map((k) => `<tr><th scope="row"><a href="${productUrl(flavorOf(k))}">${k.name}</a></th><td>${type(k)}</td><td>${k.id === 'gevrek' ? '—' : k.who}</td><td>${k.servis}</td><td>${nf(k.gram)} g</td><td>${nf(k.kcal)} kcal</td></tr>`).join('')}</tbody></table>`;
initReveal();
