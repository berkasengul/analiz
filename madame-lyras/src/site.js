// Tüm sayfalarda ortak: üst menü, iletişim bilgileri, beliren öğeler, formlar ve ürün kartı yardımcıları
import { SITE, FLAVORS } from './data.js';

export const $ = (s, el = document) => el.querySelector(s);
export const $$ = (s, el = document) => [...el.querySelectorAll(s)];
export const lower = (t) => t.toLocaleLowerCase('tr');
export const nf = (n) => n.toLocaleString('tr-TR');
export const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
export const productUrl = (f) => `/urun.html?id=${encodeURIComponent(f.id)}`;
export const mailHref = (f) => `mailto:${SITE.email}?subject=${encodeURIComponent(f ? `${f.name} hakkında bilgi` : 'Ürün bilgisi')}`;
export const telHref = () => (SITE.phone && SITE.phone.tel ? `tel:${SITE.phone.tel}` : '/iletisim.html');
export const CAT_NAMES = { meyve: 'Meyve', tatli: 'Dondurma', atistirmalik: 'Atıştırmalık', kit: 'Hazır gıda' };

/* ---------- iletişim ve yasal bilgiler ---------- */
function fillSite() {
  $$('[data-site="mail"]').forEach((a) => { a.href = mailHref(null); });
  $$('[data-site="mailText"]').forEach((el) => { el.textContent = SITE.email; });
  $$('[data-site="tel"]').forEach((a) => { a.href = telHref(); });
  $$('[data-site="telText"]').forEach((el) => { el.textContent = SITE.phone ? SITE.phone.display : ''; });
  $$('[data-site="wa"]').forEach((a) => { if (SITE.whatsapp) a.href = `https://wa.me/${SITE.whatsapp}`; else a.hidden = true; });
  $$('[data-site="address"]').forEach((el) => { el.textContent = SITE.address || ''; el.hidden = !SITE.address; });
  $$('[data-site="year"]').forEach((el) => { el.textContent = new Date().getFullYear(); });
  const legal = [SITE.mersis && `MERSİS: ${SITE.mersis}`, SITE.taxOffice && `${SITE.taxOffice} V.D.`, SITE.taxNo && `VKN: ${SITE.taxNo}`, SITE.kep && `KEP: ${SITE.kep}`].filter(Boolean);
  $$('[data-site="legal"]').forEach((el) => { el.textContent = legal.length ? ` · ${legal.join(' · ')}` : ''; });
}

/* ---------- menü ---------- */
function initHeader() {
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

/* ---------- formlar (Netlify Forms) ---------- */
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
      const body = new URLSearchParams(new FormData(form)).toString();
      const res = await fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body });
      if (!res.ok) throw new Error(res.status);
      form.reset();
      status.textContent = okText;
      status.classList.add('ok');
    } catch (err) {
      status.innerHTML = `Mesaj şu an gönderilemedi. Lütfen <a href="mailto:${SITE.email}">${SITE.email}</a> adresine yazın.`;
      status.classList.add('err');
    } finally {
      btn.disabled = false;
    }
  });
}

/* ---------- ürün kartı ---------- */
export function productCard(f, i = 0) {
  const img = f.thumb || f.tex;
  return `<a class="pcard reveal" href="${productUrl(f)}" style="--c:${f.bg}">
    <span class="pcard__media${f.thumb ? ' pcard__media--kit' : ''}"><img src="${img}" alt="${f.name} ürün görseli" loading="lazy" /></span>
    <span class="pcard__body">
      <small>${f.kit ? `${CAT_NAMES[f.cat]} · ResQ` : '<b class="sola">SOLAGRON</b> · 16 g'}</small>
      <b>${f.name}</b>
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
