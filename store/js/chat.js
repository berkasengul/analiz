// SESA Asistan: sitedeki ürünleri tanıyan, öneri yapan, sepete ekleyen ve sipariş alan sohbet.
// Tamamen tarayıcıda çalışır (sunucu gerekmez). Sipariş, config.js'teki WhatsApp numarasına
// ve/veya sipariş adresine iletilir.
import { SITE } from './config.js';
import { placeOrder, normPhone } from './orders.js';

const low = (s) => s.toLocaleLowerCase('tr-TR');
const fold = (s) => low(s).replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim();
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Sorudaki kelimelerin ürünlerdeki karşılıkları (eş anlamlılar)
const SYN = {
  kedi: ['kedi', 'kedili', 'pisi'], cilek: ['çilek', 'çilekli'], ayi: ['ayı', 'ayıcık', 'ayıcıklı'],
  ekose: ['ekose', 'kareli', 'karo'], gezegen: ['gezegen', 'uzay', 'yıldız', 'roket', 'astronot'],
  polis: ['polis', 'araba', 'arabalı', 'oto'], safari: ['safari', 'fil', 'zürafa', 'orman', 'hayvan', 'palmiye'],
  dama: ['dama', 'iş makinesi', 'iş makineleri', 'kepçe', 'kamyon', 'inşaat'], cizgili: ['çizgili', 'klasik'],
  kalp: ['kalp', 'kalpli'], dugmeli: ['düğmeli', 'yakalı', 'gömlek'],
  pembe: ['pembe'], mavi: ['mavi', 'açık mavi'], lacivert: ['lacivert', 'koyu mavi'], kirmizi: ['kırmızı'],
  krem: ['krem', 'ekru', 'beyaz'], bej: ['bej', 'kahve'], gri: ['gri'], renkli: ['renkli', 'rengarenk', 'renkler'],
};

export function createChat(api) {
  const { products, cart, openDetail, formatPrice, sizeLabel } = api;
  const index = products.map((p) => ({ p, text: fold(`${p.name} ${p.desc} ${p.colorName} ${p.code}`) }));
  const state = { step: null, pending: null, order: {} };

  /* ---------- Arayüz ---------- */
  const root = document.createElement('div');
  root.className = 'chat';
  root.innerHTML = `
    <button class="chat-fab" type="button" aria-expanded="false" aria-controls="chat-panel">
      <span class="chat-fab-ico"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16v11H9l-5 4z"/><path d="M8 10h.01M12 10h.01M16 10h.01"/></svg></span>
      <span class="chat-fab-txt">Asistan</span><i class="chat-dot" aria-hidden="true"></i>
    </button>
    <section class="chat-panel" id="chat-panel" role="dialog" aria-label="SESA Asistan" hidden>
      <header class="chat-head">
        <span class="chat-ava" aria-hidden="true">S</span>
        <div><b>SESA Asistan</b><small>Pijama seçimi ve sipariş</small></div>
        <button class="chat-x" type="button" aria-label="Sohbeti kapat"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg></button>
      </header>
      <div class="chat-log" aria-live="polite"></div>
      <div class="chat-quick"></div>
      <form class="chat-form">
        <input class="chat-in" type="text" autocomplete="off" placeholder="Mesajınızı yazın…" aria-label="Mesaj">
        <button class="chat-send" type="submit" aria-label="Gönder"><svg viewBox="0 0 24 24"><path d="M4 12l16-8-6 16-2-7z"/></svg></button>
      </form>
    </section>`;
  document.body.append(root);
  const fab = root.querySelector('.chat-fab');
  const panel = root.querySelector('.chat-panel');
  const log = root.querySelector('.chat-log');
  const quickEl = root.querySelector('.chat-quick');
  const input = root.querySelector('.chat-in');
  let greeted = false;

  function open(v = true) {
    panel.hidden = !v;
    root.classList.toggle('is-open', v);
    fab.setAttribute('aria-expanded', String(v));
    if (v) {
      if (!greeted) { greeted = true; greet(); }
      setTimeout(() => input.focus({ preventScroll: true }), 50);
    }
  }
  fab.addEventListener('click', () => open(panel.hidden));
  root.querySelector('.chat-x').addEventListener('click', () => open(false));
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && !panel.hidden) open(false); });

  const scroll = () => { log.scrollTop = log.scrollHeight; };
  function bubble(html, who = 'bot') {
    const el = document.createElement('div');
    el.className = `msg msg-${who}`;
    el.innerHTML = html;
    log.append(el);
    scroll();
    return el;
  }
  // Yazıyor… göstergesiyle bot cevabı
  function say(html, extra) {
    const t = bubble('<span class="typing"><i></i><i></i><i></i></span>', 'bot');
    return new Promise((res) => setTimeout(() => {
      t.innerHTML = html;
      if (extra) t.after(extra);
      scroll();
      res(t);
    }, Math.min(900, 280 + html.length * 3)));
  }
  function quick(items) {
    quickEl.innerHTML = items.map((q) => `<button type="button" data-q="${esc(q)}">${esc(q)}</button>`).join('');
  }
  quickEl.addEventListener('click', (e) => { const b = e.target.closest('[data-q]'); if (b) send(b.dataset.q); });
  root.querySelector('.chat-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const v = input.value.trim();
    if (!v) return;
    input.value = '';
    send(v);
  });

  function cards(list) {
    const wrap = document.createElement('div');
    wrap.className = 'chat-cards';
    wrap.innerHTML = list.map((p) => `
      <article class="chat-card" style="--c:${p.accent};--t:${p.tint}">
        <img src="${p.image}" alt="${esc(p.name)}" loading="lazy">
        <div><b>${esc(p.name)}</b><span>${p.code} · ${formatPrice(p.price)}</span><small>${esc(p.colorName)}</small>
          <p><button type="button" data-view="${p.id}">İncele</button><button type="button" class="pri" data-add="${p.id}">Sepete ekle</button></p></div>
      </article>`).join('');
    return wrap;
  }
  log.addEventListener('click', (e) => {
    const v = e.target.closest('[data-view]');
    if (v) { openDetail(v.dataset.view); return; }
    const a = e.target.closest('[data-add]');
    if (a) { askSize(products.find((p) => p.id === a.dataset.add)); return; }
    const s = e.target.closest('[data-size]');
    if (s) { addToCart(s.dataset.size); }
  });

  /* ---------- Anlama ---------- */
  const has = (q, words) => words.some((w) => q.includes(fold(w)));
  function ageOf(q) {
    const m = q.match(/(\d{1,2})\s*(yaş|yas|yaşında|yasinda|yaşındaki|yaşlarında)?/);
    if (!m) return null;
    const n = Number(m[1]);
    return n >= 1 && n <= 14 ? n : null;
  }
  const sizeForAge = (n) => { const a = Math.min(11, Math.max(2, n)); return `${a}-${a + 1}`; };
  function genderOf(q) {
    if (has(q, ['kız', 'kızım', 'kız çocuk', 'kızıma', 'kızlar'])) return 'kiz';
    if (has(q, ['erkek', 'oğlum', 'oğluma', 'oğlan', 'erkek çocuk'])) return 'erkek';
    return null;
  }
  function match(q) {
    const words = q.split(' ').filter((w) => w.length > 2);
    const keys = Object.entries(SYN).filter(([, ws]) => has(q, ws)).map(([k]) => SYN[k]);
    const scored = index.map(({ p, text }) => {
      let s = 0;
      for (const ws of keys) if (ws.some((w) => text.includes(fold(w)))) s += 3;
      for (const w of words) if (text.includes(w)) s += 1;
      return { p, s };
    }).filter((x) => x.s >= (keys.length ? 3 : 2)).sort((a, b) => b.s - a.s);
    return scored.map((x) => x.p);
  }

  /* ---------- Akış ---------- */
  async function greet() {
    await say(`Merhaba! Ben <b>SESA Asistan</b>. ${products.length} pijama takımımızı tanıyorum: desen, renk ya da yaşa göre öneri yapabilir, beden seçip siparişinizi buradan oluşturabilirim.`);
    quick(['Kız çocuk pijamaları', 'Erkek çocuk pijamaları', '5 yaş için öneri', 'Beden rehberi', 'Kargo ve iade']);
  }

  async function send(text) {
    bubble(esc(text), 'me');
    quick([]);
    const q = fold(text);
    if (state.step) { await orderStep(text, q); return; }

    if (has(q, ['sipariş', 'satın al', 'ödeme', 'tamamla', 'sepeti onayla'])) { await checkout(); return; }
    if (has(q, ['sepet', 'sepetim', 'sepette'])) { await showCart(); return; }
    if (has(q, ['beden', 'ölçü', 'boy', 'kaç numara', 'hangi beden'])) { await sizeGuide(ageOf(q)); return; }
    if (has(q, ['kargo', 'teslim', 'ne zaman gelir', 'gönderim'])) {
      await say(SITE.shipping);
      quick(['İade koşulları', 'Ödeme seçenekleri', 'Ürünleri göster']); return;
    }
    if (has(q, ['iade', 'değişim', 'değiştir'])) { await say(SITE.returns); quick(['Kargo', 'Ürünleri göster']); return; }
    if (has(q, ['ödeme', 'kapıda', 'havale', 'kredi', 'taksit'])) { await say(SITE.payment); quick(['Sipariş ver', 'Ürünleri göster']); return; }
    if (has(q, ['kumaş', 'pamuk', 'malzeme', 'terletir', 'yıkama'])) { await say(SITE.fabric); quick(['Ürünleri göster', 'Beden rehberi']); return; }
    if (has(q, ['fiyat', 'kaç para', 'ne kadar', 'ucuz', 'pahalı'])) {
      const ps = products.map((p) => p.price);
      const lo = Math.min(...ps);
      const hi = Math.max(...ps);
      await say(lo === hi ? `Tüm takımlarımız <b>${formatPrice(lo)}</b>. ${formatPrice(SITE.freeShippingOver)} ve üzeri siparişlerde kargo ücretsiz.` : `Takımlarımız ${formatPrice(lo)} – ${formatPrice(hi)} arasında.`);
      quick(['Kız çocuk pijamaları', 'Erkek çocuk pijamaları']); return;
    }
    if (has(q, ['merhaba', 'selam', 'günaydın', 'iyi akşamlar', 'hey'])) { await greet(); return; }
    if (has(q, ['teşekkür', 'sağ ol', 'sağol', 'eyvallah'])) { await say('Rica ederim! Başka bir konuda yardımcı olabilir miyim?'); quick(['Ürünleri göster', 'Sepetim']); return; }
    if (has(q, ['mağaza', 'adres', 'konum', 'nerede', 'yol tarifi', 'ziyaret'])) {
      await say(`Mağazamız ${SITE.address ? `${esc(SITE.address)}, ` : ''}${SITE.city}'da. <a href="${SITE.mapLink}" target="_blank" rel="noopener">Haritada aç ve yol tarifi al</a>`); quick(['Ürünleri göster']); return;
    }
    if (has(q, ['iletişim', 'telefon', 'e posta', 'mail', 'whatsapp'])) {
      await say(`Bize ${SITE.email}${SITE.whatsapp ? ` veya WhatsApp üzerinden +${SITE.whatsapp}` : ''} adresinden ulaşabilirsiniz.`); return;
    }

    // Ürün önerisi
    const g = genderOf(q);
    const age = ageOf(q);
    let list = match(q);
    if (g) list = (list.length ? list : products).filter((p) => p.gender === g);
    if (!list.length && (age || has(q, ['ürün', 'pijama', 'takım', 'göster', 'öner', 'model', 'hepsi', 'tümü']))) list = g ? products.filter((p) => p.gender === g) : products.slice();
    if (list.length) {
      const top = list.slice(0, 4);
      const intro = age ? `${age} yaş için <b>${sizeLabel(sizeForAge(age))}</b> bedeni öneririm. ` : '';
      state.pending = { age };
      await say(`${intro}${list.length > 4 ? `Size uygun ${list.length} takım buldum, en uygun dördü:` : list.length === 1 ? 'Tam aradığınız takım:' : `Size uygun ${list.length} takım:`}`, cards(top));
      quick(list.length > 4 ? ['Daha fazla göster', 'Beden rehberi', 'Sepetim'] : ['Başka desenler', 'Beden rehberi', 'Sepetim']);
      state.more = list.slice(4);
      return;
    }
    if (has(q, ['daha fazla', 'diğer', 'başka']) && state.more?.length) {
      const next = state.more.slice(0, 4);
      state.more = state.more.slice(4);
      await say('İşte diğerleri:', cards(next));
      quick(state.more.length ? ['Daha fazla göster', 'Sepetim'] : ['Sepetim', 'Sipariş ver']);
      return;
    }
    await say('Bunu tam anlayamadım. Desen (kedi, çilek, ayıcık, gezegen, safari…), renk, yaş ya da kız/erkek yazarak arayabilirsiniz.');
    quick(['Kız çocuk pijamaları', 'Erkek çocuk pijamaları', 'Çilekli', 'Gezegenler', 'Sepetim']);
  }

  async function sizeGuide(age) {
    const rows = SITE.sizeGuide.map(([s, h]) => `<tr${age && s === sizeForAge(age) ? ' class="on"' : ''}><td>${sizeLabel(s)}</td><td>${h}</td></tr>`).join('');
    await say(`${age ? `${age} yaş için genellikle <b>${sizeLabel(sizeForAge(age))}</b> uygundur. ` : ''}Boy ölçüsüne göre beden tablosu:<table class="chat-table"><tbody>${rows}</tbody></table>İki beden arasında kalırsanız büyük olanı seçin; manşetli paçalar boyu toparlar.`);
    quick(['Ürünleri göster', 'Sepetim']);
  }

  let sizeFor = null;
  async function askSize(p) {
    sizeFor = p;
    const sug = state.pending?.age ? sizeForAge(state.pending.age) : null;
    const wrap = document.createElement('div');
    wrap.className = 'chat-sizes';
    wrap.innerHTML = p.sizes.map((s) => `<button type="button" data-size="${s}" class="${s === sug ? 'sug' : ''}">${s}</button>`).join('');
    await say(`<b>${esc(p.name)}</b> için yaş / beden seçin:${sug ? ` (önerim <b>${sizeLabel(sug)}</b>)` : ''}`, wrap);
  }
  async function addToCart(size) {
    if (!sizeFor) return;
    const p = sizeFor;
    sizeFor = null;
    cart.add(p.id, size);
    bubble(`${sizeLabel(size)}`, 'me');
    await say(`<b>${esc(p.name)}</b> (${sizeLabel(size)}) sepete eklendi. Sepetinizde ${cart.count()} ürün, toplam <b>${formatPrice(cart.total())}</b>.${cart.total() >= SITE.freeShippingOver ? ' Kargo ücretsiz!' : ` ${formatPrice(SITE.freeShippingOver - cart.total())} daha ekleyin, kargo ücretsiz olsun.`}`);
    quick(['Sipariş ver', 'Başka ürün göster', 'Sepetim']);
  }
  async function showCart() {
    if (!cart.count()) { await say('Sepetiniz şimdilik boş. Size bir takım önereyim mi?'); quick(['Kız çocuk pijamaları', 'Erkek çocuk pijamaları']); return; }
    await say(`Sepetiniz:${summary()}`);
    quick(['Sipariş ver', 'Ürün ekle']);
  }
  const summary = () => `<ul class="chat-sum">${cart.items.map((x) => {
    const p = products.find((y) => y.id === x.id);
    return `<li><span>${esc(p.name)} · ${sizeLabel(x.size)} × ${x.qty}</span><b>${formatPrice(p.price * x.qty)}</b></li>`;
  }).join('')}<li class="tot"><span>Toplam</span><b>${formatPrice(cart.total())}</b></li></ul>`;

  /* ---------- Sipariş ---------- */
  async function checkout() {
    open(true);
    if (!cart.count()) { await say('Sipariş için önce sepete bir takım ekleyelim. Hangi deseni sevdiniz?'); quick(['Kız çocuk pijamaları', 'Erkek çocuk pijamaları']); return; }
    await say(`Harika, siparişinizi oluşturalım.${summary()}Önce <b>adınız ve soyadınız</b>?`);
    state.step = 'name';
    state.order = {};
    quick(['Vazgeç']);
  }
  async function orderStep(text, q) {
    if (has(q, ['vazgeç', 'iptal', 'dur'])) { state.step = null; await say('Sipariş iptal edildi, ürünler sepetinizde duruyor.'); quick(['Ürünleri göster', 'Sepetim']); return; }
    const o = state.order;
    if (state.step === 'name') {
      if (text.trim().split(/\s+/).length < 2) { await say('Lütfen ad ve soyadınızı birlikte yazın.'); return; }
      o.name = text.trim();
      state.step = 'phone';
      await say(`Teşekkürler ${esc(o.name.split(' ')[0])}. <b>Telefon numaranız</b>? (05xx xxx xx xx)`);
    } else if (state.step === 'phone') {
      const ph = normPhone(text);
      if (!ph) { await say('Numara geçerli görünmüyor. 05 ile başlayan 11 haneli numaranızı yazar mısınız?'); return; }
      o.phone = ph;
      state.step = 'city';
      await say('<b>İl / ilçe</b>?');
    } else if (state.step === 'city') {
      if (text.trim().length < 3) { await say('İl ve ilçe yazar mısınız? (ör. İstanbul / Kadıköy)'); return; }
      o.city = text.trim();
      state.step = 'address';
      await say('<b>Açık adresiniz</b>? (mahalle, sokak, bina ve daire no)');
    } else if (state.step === 'address') {
      if (text.trim().length < 10) { await say('Kargonun ulaşabilmesi için adresi biraz daha ayrıntılı yazar mısınız?'); return; }
      o.address = text.trim();
      state.step = 'note';
      await say('Eklemek istediğiniz bir not var mı? (yoksa "yok" yazın)');
      quick(['Yok']);
    } else if (state.step === 'note') {
      o.note = has(q, ['yok', 'hayır']) ? '' : text.trim();
      state.step = 'confirm';
      await say(`Kontrol edelim:${summary()}<p class="chat-addr"><b>${esc(o.name)}</b> · ${esc(o.phone)}<br>${esc(o.address)}, ${esc(o.city)}${o.note ? `<br>Not: ${esc(o.note)}` : ''}</p>${SITE.payment}<br><br>Siparişi onaylıyor musunuz?`);
      quick(['Onaylıyorum', 'Vazgeç']);
    } else if (state.step === 'confirm') {
      if (!has(q, ['onay', 'evet', 'tamam', 'olur'])) { await say('Onaylamak için "Onaylıyorum" yazın ya da "Vazgeç" deyin.'); quick(['Onaylıyorum', 'Vazgeç']); return; }
      await place();
    }
  }
  async function place() {
    const o = state.order;
    state.step = null;
    const lines = cart.items.map((x) => { const p = products.find((y) => y.id === x.id); return { id: p.id, name: p.name, size: x.size, qty: x.qty, price: p.price }; });
    const { order, link, via } = await placeOrder(o, lines, formatPrice);
    cart.clear();
    if (via === 'endpoint') await say(`Siparişiniz alındı! Sipariş no: <b>${order.id}</b>. Ödeme ve kargo bilgisi için ${esc(o.phone)} numarasından size ulaşacağız.`);
    else await say(`Siparişiniz hazır! Sipariş no: <b>${order.id}</b>.<br>Son adım: siparişi ${via === 'whatsapp' ? "WhatsApp'tan" : 'e-postayla'} bize gönderin, ödeme ve kargo bilgisini hemen iletelim.<p><a class="chat-wa" href="${link}" target="_blank" rel="noopener">${via === 'whatsapp' ? 'WhatsApp ile gönder' : 'E-postayla gönder'}</a></p>`);
    api.onOrder?.(order);
    quick(['Ürünleri göster']);
  }

  // Başka yerlerden asistanı açmak için
  return {
    open: () => open(true),
    checkout: () => { open(true); checkout(); },
    ask: (text) => { open(true); setTimeout(() => send(text), greeted ? 0 : 1200); },
  };
}
