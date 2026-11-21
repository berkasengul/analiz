// Tüm sayfalarda ortak: üst menü, iletişim bilgileri, beliren öğeler, formlar ve ürün kartı yardımcıları
import { SITE, FLAVORS } from './data.js';

export const $ = (s, el = document) => el.querySelector(s);
export const $$ = (s, el = document) => [...el.querySelectorAll(s)];
export const lower = (t) => t.toLocaleLowerCase('tr');
export const nf = (n) => n.toLocaleString('tr-TR');
export const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
export const productUrl = (f) => `/urun.html?id=${encodeURIComponent(f.id)}`;
export const mailHref = (f) => `mailto:${SITE.email}?subject=${encodeURIComponent(f ? `${f.name} hakkında bilgi` : 'Ürün bilgisi')}`;
// WhatsApp: mesaj kutusu hazır bir bilgi talebiyle açılır (ürün sayfasında ürün adıyla)
export const waText = (f) => {
  if (f) return `Merhaba, ${f.group === 'atistirmalik' ? 'Solagron' : 'ResQ'} ${f.name} ürünü hakkında bilgi almak istiyorum. Toptan fiyat, koli içi adet ve teslimat koşullarını paylaşabilir misiniz?`;
  const page = document.body.dataset.page;
  if (page === 'teklif') return 'Merhaba, Solagron ve ResQ ürünleriniz için toptan fiyat teklifi almak istiyorum. Ürün listesi, koli içi adetler ve teslimat koşulları hakkında bilgi verebilir misiniz?';
  if (page === 'bayilik') return 'Merhaba, Solagron ve ResQ ürünlerinin bayiliği hakkında bilgi almak istiyorum.';
  return 'Merhaba, Solagron ve ResQ ürünleriniz hakkında bilgi almak istiyorum. Ürün çeşitleri, toptan fiyatlar ve teslimat koşulları hakkında bilgi verebilir misiniz?';
};
export const waHref = (f) => `https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(waText(f))}`;
export const telHref = () => (SITE.phone && SITE.phone.tel ? `tel:${SITE.phone.tel}` : '/iletisim.html');
export const CAT_NAMES = { meyve: 'Meyve', tatli: 'Dondurma', atistirmalik: 'Atıştırmalık', kit: 'Hazır gıda kiti', resq: 'ResQ' };

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

/* ---------- teklif iste: e-posta, WhatsApp ya da form ---------- */
// sayfadaki "Toptan teklif" düğmeleri (menü bağlantısı hariç) küçük bir seçim penceresi açar;
// ürün sayfasında düğmenin data-urun değeri mesaja yazılır
function quoteMail(urun) {
  const subject = `Toptan teklif talebi${urun ? ` · ${urun}` : ''}`;
  const body = `Merhaba,\n\n${urun ? `${urun} ürünü` : 'Solagron ve ResQ ürünleriniz'} için toptan fiyat teklifi almak istiyorum.\n\nFirma adı:\nYetkili:\nTelefon:\nİl / ilçe:\nİşletme türü:\nÜrün(ler) ve tahmini miktar:\n\nTeşekkürler.`;
  return `mailto:${SITE.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
function quoteWa(urun) {
  const t = `Merhaba, ${urun ? `${urun} ürünü` : 'Solagron ve ResQ ürünleriniz'} için toptan fiyat teklifi almak istiyorum. Fiyat listesi, koli içi adetler ve teslimat koşullarını paylaşabilir misiniz?`;
  return `https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(t)}`;
}
function initQuoteChooser() {
  const btns = $$('a[href^="/teklif.html"]');
  if (!btns.length || document.body.dataset.page === 'teklif') return;
  const dlg = document.createElement('dialog');
  dlg.className = 'qdlg';
  dlg.setAttribute('aria-labelledby', 'qdlgTitle');
  dlg.innerHTML = `<button class="qdlg__x" type="button" aria-label="Kapat">×</button>
    <p class="qdlg__eyebrow">Toptan teklif</p>
    <h2 id="qdlgTitle">Nasıl ulaşmak istersiniz?</h2>
    <p class="qdlg__sub" id="qdlgSub"></p>
    <div class="qdlg__opts">
      <a class="qopt qopt--wa" id="qWa" target="_blank" rel="noopener"><i><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20l1.2-3.6A8 8 0 1112 20a8 8 0 01-4-1.1zM9 8.5c0 3 2.5 6.5 6 6.8l1-1.3-1.8-1-1 .8c-1-.5-2-1.5-2.4-2.4l.8-1-1-1.9z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg></i><span><b>WhatsApp'tan yazın</b><small>Hazır mesajla, hemen yanıt</small></span></a>
      <a class="qopt qopt--mail" id="qMail"><i><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2.5" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M4 7l8 6 8-6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg></i><span><b>E-posta gönderin</b><small>${SITE.email}</small></span></a>
      <a class="qopt qopt--form" id="qForm"><i><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3h7l4 4v14H7z M14 3v4h4 M10 12h6 M10 16h6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg></i><span><b>Teklif formunu doldurun</b><small>Ürünleri seçin, size dönelim</small></span></a>
    </div>`;
  document.body.appendChild(dlg);
  const close = () => dlg.close();
  dlg.querySelector('.qdlg__x').addEventListener('click', close);
  dlg.addEventListener('click', (e) => { if (e.target === dlg) close(); });
  dlg.querySelectorAll('.qopt').forEach((o) => o.addEventListener('click', () => setTimeout(close, 150)));
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="/teklif.html"]');
    if (!a || a.closest('.qdlg') || e.metaKey || e.ctrlKey || e.shiftKey) return;
    e.preventDefault();
    const urun = a.dataset.urun || '';
    $('#qdlgSub').textContent = urun ? `${urun} için fiyat teklifi isteyin.` : 'Fiyat listesi ve teslimat koşulları için bize ulaşın.';
    $('#qWa').href = quoteWa(urun);
    $('#qWa').hidden = !SITE.whatsapp;
    $('#qMail').href = quoteMail(urun);
    $('#qForm').href = a.getAttribute('href');
    dlg.showModal();
  });
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

/* ---------- formlar (Netlify Forms, yedek: FormSubmit ile doğrudan e-posta) ---------- */
const FORM_TITLES = { iletisim: 'İletişim formu', bayilik: 'Bayilik / iş birliği başvurusu', 'toptan-teklif': 'Toptan teklif talebi' };
const FIELD_NAMES = { ad: 'Ad soyad', yetkili: 'Yetkili', firma: 'Firma', isletme: 'İşletme', telefon: 'Telefon', eposta: 'E-posta', il: 'İl', konu: 'Konu', faaliyet: 'Faaliyet alanı', isletme_turu: 'İşletme türü', aylik_miktar: 'Aylık miktar', ambalaj: 'Ambalaj', not: 'Not', mesaj: 'Mesaj', 'urunler[]': 'Ürünler', kvkk: 'KVKK onayı' };
async function mailForm(fd) {
  const kind = fd.get('form-name') || 'iletisim';
  const data = { _subject: `${FORM_TITLES[kind] || 'Web sitesi formu'} · gencanadolugida.com.tr`, _template: 'table', _captcha: 'false' };
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
    const res = await fetch(`https://formsubmit.co/ajax/${SITE.email}`, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(data) });
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
        const res = await fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(fd).toString() });
        ok = res.ok;
      } catch (e2) { ok = false; }
      if (!ok) ok = await mailForm(fd);
      if (!ok) throw new Error('gönderilemedi');
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
  const img = f.thumb || f.md || f.tex;
  return `<a class="pcard reveal" href="${productUrl(f)}" style="--c:${f.bg}">
    <span class="pcard__media${f.thumb ? ' pcard__media--kit' : ''}"><img src="${img}" alt="${f.name} ürün görseli" loading="lazy" /></span>
    <span class="pcard__body">
      <small>${f.group === 'atistirmalik' ? '<b class="sola">SOLAGRON</b> · 16 g' : `<b class="sola">RESQ</b> · ${f.cat === 'kit' ? f.facts[0][1] + ' servis' : f.kit === 'gevrek' ? '75 g' : f.facts[0][1]}`}</small>
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
initQuoteChooser();
initReveal();
export { SITE, FLAVORS };
