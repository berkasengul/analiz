// Tüm sayfalarda ortak: üst menü, iletişim bilgileri, beliren öğeler, formlar ve ürün kartı yardımcıları
import { SITE, FLAVORS, GROUPS, fiyat } from './data.js';

export const $ = (s, el = document) => el.querySelector(s);
export const $$ = (s, el = document) => [...el.querySelectorAll(s)];
export const lower = (t) => t.toLocaleLowerCase('tr');
export const nf = (n) => n.toLocaleString('tr-TR');
export const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
export const productUrl = (f) => `/urun.html?id=${encodeURIComponent(f.id)}`;
export const mailHref = (f) => `mailto:${SITE.email}?subject=${encodeURIComponent(f ? `${f.name} hakkında bilgi` : 'Ürün bilgisi')}`;
// WhatsApp: mesaj kutusu hazır bir bilgi talebiyle açılır (ürün sayfasında ürün adıyla)
export const waText = (f) => {
  if (f) return `Merhaba, Petra Spring ${f.full} hakkında bilgi almak istiyorum.`;
  return 'Merhaba, Petra Spring ürünleriniz hakkında bilgi almak istiyorum.';
};
export const waHref = (f) => `https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(waText(f))}`;
export const telHref = () => (SITE.phone && SITE.phone.tel ? `tel:${SITE.phone.tel}` : '/iletisim.html');
export const CAT_NAMES = { kagit: 'Asma kağıt araba kokusu', cam: 'Cam şişe araba kokusu', oda: 'Bambu çubuklu oda kokusu' };

/* ---------- iletişim ve yasal bilgiler ---------- */
function fillSite() {
  $$('[data-site="mail"]').forEach((a) => { a.href = mailHref(null); });
  $$('[data-site="mailText"]').forEach((el) => { el.textContent = SITE.email; });
  $$('[data-site="tel"]').forEach((a) => { a.href = telHref(); });
  $$('[data-site="telText"]').forEach((el) => { el.textContent = SITE.phone ? SITE.phone.display : ''; });
  $$('[data-site="wa"]').forEach((a) => { if (SITE.whatsapp) a.href = waHref(); else a.hidden = true; });
  $$('[data-site="address"]').forEach((el) => { el.textContent = SITE.address || ''; el.hidden = !SITE.address; });
  $$('[data-site="year"]').forEach((el) => { el.textContent = new Date().getFullYear(); });
  const legal = [SITE.mersis && `MERSİS: ${SITE.mersis}`, SITE.taxOffice && `${SITE.taxOffice} V.D.`, SITE.taxNo && `VKN: ${SITE.taxNo}`, SITE.kep && `KEP: ${SITE.kep}`].filter(Boolean);
  $$('[data-site="legal"]').forEach((el) => { el.textContent = legal.length ? ` · ${legal.join(' · ')}` : ''; });
}

/* ---------- menü ---------- */
// Ürünler alt sekmesi: üç grup ve ürün adları (küçük görselleriyle)
function initMega() {
  const box = $('#mega');
  if (!box) return;
  box.innerHTML = Object.entries(GROUPS).map(([g, label]) => `
    <div class="mega__col">
      <a class="mega__head" href="/urunler.html?kat=${g}">${label}<small>${FLAVORS.filter((f) => f.group === g).length} ürün</small></a>
      <ul>${FLAVORS.filter((f) => f.group === g).map((f) => `<li><a href="${productUrl(f)}"><img src="${f.mini}" alt="" loading="lazy" width="28" height="28" /><span>${f.name}</span><em>${fiyat(f.price)}</em></a></li>`).join('')}</ul>
    </div>`).join('') + '<a class="mega__all" href="/urunler.html">Tüm ürünleri 3B incele →</a>';
}
function initHeader() {
  initMega();
  const page = document.body.dataset.page;
  $$('[data-nav]').forEach((a) => { if (a.dataset.nav === page) a.setAttribute('aria-current', 'page'); });
  const btn = $('#menuBtn');
  const close = () => { document.body.classList.remove('menu-open'); btn.setAttribute('aria-expanded', 'false'); btn.setAttribute('aria-label', 'Menüyü aç'); };
  btn.addEventListener('click', () => {
    const open = !document.body.classList.contains('menu-open');
    document.body.classList.toggle('menu-open', open);
    btn.setAttribute('aria-expanded', String(open));
    btn.setAttribute('aria-label', open ? 'Menüyü kapat' : 'Menüyü aç');
  });
  $$('#nav a').forEach((a) => a.addEventListener('click', close));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
  const hdr = $('#hdr');
  const onScroll = () => hdr.classList.toggle('hdr--scrolled', window.scrollY > 8);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

/* ---------- görünür olunca beliren öğeler ---------- */
export function initReveal(root = document) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
  }, { rootMargin: '0px 0px -6% 0px', threshold: 0.06 });
  $$('.reveal:not(.in)', root).forEach((el, i) => { el.style.setProperty('--d', `${(i % 4) * 70}ms`); io.observe(el); });
}

/* ---------- formlar (Netlify Forms, yedek: FormSubmit ile doğrudan e-posta) ---------- */
const FORM_TITLES = { iletisim: 'İletişim formu' };
const FIELD_NAMES = { ad: 'Ad soyad', yetkili: 'Yetkili', firma: 'Firma', isletme: 'İşletme', telefon: 'Telefon', eposta: 'E-posta', il: 'İl', konu: 'Konu', faaliyet: 'Faaliyet alanı', isletme_turu: 'İşletme türü', aylik_miktar: 'Aylık miktar', ambalaj: 'Ambalaj', not: 'Not', mesaj: 'Mesaj', 'urunler[]': 'Ürünler', kvkk: 'KVKK onayı' };
// süre sınırlı istek: yanıt gecikirse müşteri bekletilmez
function fetchT(url, opts, ms) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), ms);
  return fetch(url, { ...opts, signal: c.signal }).finally(() => clearTimeout(t));
}
// gönderilemezse: müşterinin yazdıkları hazır mesaj olarak WhatsApp ve e-postaya aktarılır
function formText(fd) {
  const kind = fd.get('form-name') || 'iletisim';
  const lines = [`${FORM_TITLES[kind] || 'Web sitesi formu'}`];
  const seen = {};
  for (const [k, v] of fd.entries()) {
    if (['form-name', 'bot-field', 'kvkk'].includes(k) || !String(v).trim()) continue;
    const label = FIELD_NAMES[k] || k;
    seen[label] = seen[label] ? `${seen[label]}, ${v}` : String(v);
  }
  for (const [k, v] of Object.entries(seen)) lines.push(`${k}: ${v}`);
  return lines.join('\n');
}
async function mailForm(fd) {
  // demo: form iletimi kapalı (müşteri onayı olmadan markanın adresine e-posta gönderilmez)
  if (SITE.demo) return false;
  const kind = fd.get('form-name') || 'iletisim';
  const data = { _subject: `${FORM_TITLES[kind] || 'Web sitesi formu'} · Petra Spring web sitesi`, _template: 'table', _captcha: 'false' };
  const seen = {};
  for (const [k, v] of fd.entries()) {
    if (k === 'form-name' || k === 'bot-field' || !String(v).trim()) continue;
    const label = FIELD_NAMES[k] || k;
    seen[label] = seen[label] ? `${seen[label]}, ${v}` : String(v);
  }
  Object.assign(data, seen);
  const mail = fd.get('eposta') || fd.get('email');
  if (mail) data._replyto = mail;
  data['Sayfa'] = location.href;
  try {
    const res = await fetchT(`https://formsubmit.co/ajax/${SITE.email}`, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(data) }, 8000);
    if (!res.ok) return false;
    // FormSubmit, etkinleştirilmemiş formda da 200 döner ama success "false" olur: o durumda iletilmemiştir
    const j = await res.json().catch(() => ({}));
    return j.success === true || j.success === 'true';
  } catch (e) { return false; }
}
export function bindForm(form, status, okText) {
  if (!form) return;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    status.className = 'form__status';
    if (!form.checkValidity()) {
      const bad = form.querySelector(':invalid');
      status.textContent = bad?.name === 'kvkk' ? 'Lütfen onay kutusunu işaretleyin.' : 'Lütfen gerekli alanları doldurun.';
      status.classList.add('err');
      bad?.focus();
      return;
    }
    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    status.textContent = 'Gönderiliyor…';
    try {
      const fd = new FormData(form);
      // bot tuzağı doluysa sessizce "gönderildi" denir, hiçbir yere gönderilmez
      // 1) Netlify Forms (sitede form algılama açıksa); 2) olmazsa doğrudan e-postaya (FormSubmit)
      let ok = !!fd.get('bot-field');
      if (!ok) try {
        const res = await fetchT('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(fd).toString() }, 5000);
        ok = res.ok;
      } catch (e2) { ok = false; }
      if (!ok) ok = await mailForm(fd);
      if (!ok) { const err = new Error('gönderilemedi'); err.fd = fd; throw err; }
      form.reset();
      status.textContent = okText;
      status.classList.add('ok');
    } catch (err) {
      const txt = err.fd ? formText(err.fd) : '';
      const wa = SITE.whatsapp ? `https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(txt)}` : '';
      const mail = `mailto:${SITE.email}?subject=${encodeURIComponent('Web sitesi formu')}&body=${encodeURIComponent(txt)}`;
      status.innerHTML = `Bağlantı şu an yanıt vermedi. Yazdıklarınızı tek dokunuşla iletebilirsiniz:<span class="form__alt">${wa ? `<a class="btn btn--wa" href="${wa}" target="_blank" rel="noopener">WhatsApp'tan gönder</a>` : ''}<a class="btn btn--outline" href="${mail}">E-postayla gönder</a></span>`;
      status.classList.add('err');
    } finally {
      btn.disabled = false;
    }
  });
}

/* ---------- ürün kartı ---------- */
export function productCard(f, i = 0) {
  const photo = f.group !== 'kagit';
  return `<a class="pcard reveal${photo ? ' pcard--photo' : ' pcard--card'}" href="${productUrl(f)}" style="--c:${f.bg}">
    <span class="pcard__media${photo ? ' pcard__media--kit' : ''}"><img src="${f.md}" alt="Petra Spring ${f.full}" loading="lazy" /></span>
    <span class="pcard__body">
      <small><b class="sola">PETRA</b> · ${GROUPS[f.group].replace(/ kokuları$/, '')}</small>
      <b>${f.name}</b>
      <span class="pcard__price">${f.scent && f.group !== 'cam' ? `<i>${f.scent}</i>` : '<i>8 ml</i>'}<em>${fiyat(f.price)}</em></span>
      <span class="pcard__more">Ürünü incele <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
    </span>
  </a>`;
}

/* ---------- ürün içeriği: bilgi satırları, besin tablosu, kit menüsü ---------- */
export function contentsHTML(f) {
  let h = `<dl class="spec">${(f.contents || []).map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl>`;
  if (f.nutrition) {
    h += `<div class="tbl"><table><caption>Enerji ve besin öğeleri</caption><thead><tr><th scope="col">Besin öğesi</th><th scope="col">16 g</th><th scope="col">100 g</th><th scope="col">%RA*</th></tr></thead><tbody>${f.nutrition.map((r) => `<tr${/^(Doymuş|Şeker|İlave)/.test(r[0]) ? ' class="sub"' : ''}><th scope="row">${r[0]}</th><td>${r[1]}</td><td>${r[2]}</td><td>${r[3]}</td></tr>`).join('')}</tbody></table><p class="tbl__note">*Ortalama bir yetişkinin referans alım düzeyi (8400 kJ / 2000 kcal). İçindekiler: Dondurularak kurutulmuş ${lower(f.name)}.</p></div>`;
  }
  if (f.menu) {
    const t = f.menu.reduce((a, r) => [a[0] + r[1], a[1] + r[2], a[2] + r[3]], [0, 0, 0]);
    h += `<div class="tbl"><table><caption>Kit içeriği · ${f.menu.length} çeşit yemek</caption><thead><tr><th scope="col">Ürün</th><th scope="col">Porsiyon</th><th scope="col">Gram</th><th scope="col">kcal</th></tr></thead><tbody>${f.menu.map((r) => `<tr><th scope="row">${r[0]}</th><td>${r[1]}</td><td>${r[2]}</td><td>${nf(r[3])}</td></tr>`).join('')}</tbody><tfoot><tr><th scope="row">Toplam</th><td>${t[0]}</td><td>${nf(t[1])}</td><td>${nf(t[2])}</td></tr></tfoot></table></div>`;
  }
  return h;
}

export function webglOK() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch (e) { return false; }
}

fillSite();
initHeader();
initReveal();
export { SITE, FLAVORS };
