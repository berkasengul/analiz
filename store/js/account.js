// Üyelik: kayıt, giriş, profil ve sipariş geçmişi. Üyelere config.memberDiscount kadar indirim.
// Not: Sunucu olmadığı için hesaplar bu tarayıcıda saklanır (şifre SHA-256 ile özetlenir).
// Gerçek, cihazlar arası üyelik için bir arka uç (ör. Firebase, Supabase) bağlanmalıdır.
import { SITE } from './config.js';

const USERS = 'sesa-users';
const SESSION = 'sesa-session';
const read = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* yok say */ } };
const escA = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

async function hash(email, pass) {
  const data = new TextEncoder().encode(`sesa:${email.toLowerCase()}:${pass}`);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function createAccount({ formatPrice, onChange, toast, normPhone }) {
  const listeners = new Set([onChange].filter(Boolean));
  const emit = () => listeners.forEach((f) => f(api.user));
  const api = {
    get user() {
      const email = read(SESSION, null);
      const u = email && read(USERS, {})[email];
      return u ? { ...u, pass: undefined } : null;
    },
    // Üye indirimi: üye ve ara toplam eşik üzerindeyse sabit tutar
    discount(subtotal) {
      const d = SITE.memberDiscount;
      return api.user && d && subtotal >= d.min ? d.amount : 0;
    },
    on(f) { listeners.add(f); },
    open: (tab) => open(tab),
  };

  /* ---------- Arayüz ---------- */
  const el = document.createElement('div');
  el.className = 'acct';
  el.hidden = true;
  el.innerHTML = `
    <div class="acct-scrim"></div>
    <section class="acct-card" role="dialog" aria-modal="true" aria-labelledby="acct-h">
      <button type="button" class="acct-x" aria-label="Kapat"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg></button>
      <div class="acct-hero">
        <img src="assets/brand/logo-wordmark.png" alt="SESA KIDS" class="acct-logo">
        <h2 id="acct-h">SESA KIDS Kulübü</h2>
        <p class="acct-perk"><b>${formatPrice(SITE.memberDiscount.amount)} indirim</b> · ${formatPrice(SITE.memberDiscount.min)} ve üzeri her alışverişte üyelere özel</p>
      </div>
      <div class="acct-body"></div>
    </section>`;
  document.body.append(el);
  const body = el.querySelector('.acct-body');
  let lastFocus = null;

  function open(tab = 'login') {
    lastFocus = document.activeElement;
    el.hidden = false;
    requestAnimationFrame(() => el.classList.add('is-open'));
    render(api.user ? 'me' : tab);
  }
  function close() {
    el.classList.remove('is-open');
    setTimeout(() => { el.hidden = true; }, 250);
    lastFocus?.focus?.({ preventScroll: true });
  }
  el.querySelector('.acct-x').addEventListener('click', close);
  el.querySelector('.acct-scrim').addEventListener('click', close);
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && !el.hidden) close(); });

  const field = (name, label, type = 'text', extra = '') => `<label class="acct-f"><span>${label}</span><input name="${name}" type="${type}" ${extra}></label>`;
  function render(view) {
    if (view === 'me') {
      const u = api.user;
      const orders = read('sesa-orders', []).filter((o) => o.customer?.email === u.email || o.customer?.phone === u.phone).reverse();
      body.innerHTML = `
        <p class="acct-hi">Merhaba <b>${escA(u.name.split(' ')[0])}</b> 👋 İndiriminiz sepette otomatik uygulanır.</p>
        <form class="acct-form" data-form="profile">
          <div class="acct-grid">${field('name', 'Ad soyad', 'text', `value="${escA(u.name)}" autocomplete="name"`)}${field('phone', 'Telefon', 'tel', `value="${escA(u.phone)}" autocomplete="tel"`)}</div>
          ${field('city', 'İl / ilçe', 'text', `value="${escA(u.city || '')}" autocomplete="address-level2"`)}
          <label class="acct-f"><span>Açık adres</span><textarea name="address" rows="2" autocomplete="street-address">${escA(u.address || '')}</textarea></label>
          <p class="acct-err" role="alert"></p>
          <button class="btn btn-ink btn-block">Bilgilerimi kaydet</button>
        </form>
        <h3 class="acct-sub">Siparişlerim</h3>
        <ul class="acct-orders">${orders.length ? orders.map((o) => `<li><b>${o.id}</b><span>${new Date(o.date).toLocaleDateString('tr-TR')} · ${o.items.reduce((n, x) => n + x.qty, 0)} ürün</span><em>${formatPrice(o.total)}</em></li>`).join('') : '<li class="empty">Henüz siparişiniz yok.</li>'}</ul>
        <button type="button" class="acct-link" data-act="logout">Çıkış yap</button>`;
    } else {
      const reg = view === 'register';
      body.innerHTML = `
        <div class="acct-tabs" role="tablist"><button type="button" role="tab" data-tab="login" aria-selected="${!reg}">Giriş yap</button><button type="button" role="tab" data-tab="register" aria-selected="${reg}">Üye ol</button></div>
        <form class="acct-form" data-form="${view}" novalidate>
          ${reg ? field('name', 'Ad soyad', 'text', 'autocomplete="name" required') : ''}
          ${field('email', 'E-posta', 'email', 'autocomplete="email" required')}
          ${reg ? field('phone', 'Telefon', 'tel', 'autocomplete="tel" placeholder="05xx xxx xx xx" required') : ''}
          ${field('pass', 'Şifre', 'password', `autocomplete="${reg ? 'new-password' : 'current-password'}" minlength="6" required`)}
          ${reg ? '<label class="acct-check"><input type="checkbox" name="kvkk" required><span>Üyelik koşullarını ve kişisel verilerimin işlenmesine ilişkin aydınlatma metnini okudum, kabul ediyorum.</span></label><label class="acct-check"><input type="checkbox" name="news"><span>Yeni desen ve kampanyalardan e-posta ile haberdar olmak istiyorum.</span></label>' : ''}
          <p class="acct-err" role="alert"></p>
          <button class="btn btn-ink btn-block">${reg ? `Üye ol ve ${formatPrice(SITE.memberDiscount.amount)} indirimi aç` : 'Giriş yap'}</button>
        </form>`;
    }
    setTimeout(() => body.querySelector('input')?.focus({ preventScroll: true }), 60);
  }

  body.addEventListener('click', (e) => {
    const t = e.target.closest('[data-tab]');
    if (t) { render(t.dataset.tab); return; }
    if (e.target.closest('[data-act="logout"]')) { write(SESSION, null); emit(); toast?.('Çıkış yapıldı.'); render('login'); }
  });
  body.addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = e.target;
    const kind = f.dataset.form;
    const v = Object.fromEntries(new FormData(f));
    const err = (m, name) => { f.querySelector('.acct-err').textContent = m; if (name) f.elements[name]?.focus(); };
    const users = read(USERS, {});
    if (kind === 'register') {
      const email = String(v.email || '').trim().toLowerCase();
      const phone = normPhone(v.phone || '');
      if (String(v.name || '').trim().split(/\s+/).length < 2) return err('Ad ve soyadınızı yazın.', 'name');
      if (!/^\S+@\S+\.\S+$/.test(email)) return err('Geçerli bir e-posta adresi yazın.', 'email');
      if (!phone) return err('Telefon 05 ile başlayan 11 hane olmalı.', 'phone');
      if (String(v.pass || '').length < 6) return err('Şifre en az 6 karakter olmalı.', 'pass');
      if (!v.kvkk) return err('Devam etmek için aydınlatma metnini onaylayın.');
      if (users[email]) return err('Bu e-posta ile zaten üyesiniz. Giriş yapın.');
      users[email] = { name: v.name.trim(), email, phone, news: !!v.news, created: new Date().toISOString(), pass: await hash(email, v.pass) };
      write(USERS, users);
      write(SESSION, email);
      emit();
      toast?.(`Hoş geldiniz! ${formatPrice(SITE.memberDiscount.amount)} üye indiriminiz aktif.`);
      render('me');
    } else if (kind === 'login') {
      const email = String(v.email || '').trim().toLowerCase();
      const u = users[email];
      if (!u || u.pass !== await hash(email, v.pass || '')) return err('E-posta veya şifre hatalı.', 'pass');
      write(SESSION, email);
      emit();
      toast?.(`Tekrar hoş geldiniz, ${u.name.split(' ')[0]}!`);
      render('me');
    } else if (kind === 'profile') {
      const email = read(SESSION, null);
      const phone = normPhone(v.phone || '');
      if (!phone) return err('Telefon 05 ile başlayan 11 hane olmalı.', 'phone');
      Object.assign(users[email], { name: String(v.name).trim(), phone, city: String(v.city || '').trim(), address: String(v.address || '').trim() });
      write(USERS, users);
      emit();
      toast?.('Bilgileriniz kaydedildi.');
    }
  });
  return api;
}
