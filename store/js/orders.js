// Sipariş oluşturma ve mağazaya iletme (sepet formu ve SESA Asistan ortak kullanır).
// Sipariş, müşteri hiçbir ek adım atmadan config.orderEndpoint adresine gönderilir.
// Önerilen kurulum: tools/siparis-tablosu.gs (Google E-Tablo + e-posta bildirimi, ücretsiz).
import { SITE } from './config.js';

// Telefonu 05xx… biçimine getirir; geçersizse null
export function normPhone(v) {
  const d = String(v).replace(/\D/g, '').replace(/^90/, '').replace(/^0/, '');
  return /^5\d{9}$/.test(d) ? `0${d}` : null;
}

// customer: { name, phone, city, address, payment, note, email? }; lines: [{ id, name, size, qty, price }]
// Dönüş: { order, sent, configured } — configured: sipariş adresi tanımlı mı (değilse önizleme/demo)
export async function placeOrder(customer, lines, fmt, discount = 0) {
  const id = `SK-${Date.now().toString(36).toUpperCase().slice(-6)}`;
  const subtotal = lines.reduce((n, x) => n + x.price * x.qty, 0);
  const total = subtotal - discount;
  const order = {
    id, date: new Date().toISOString(), items: lines, subtotal, discount, total, customer,
    // E-Tablo ve e-posta bildirimi için okunur özet
    summary: lines.map((x) => `${x.name} – ${x.size} yaş × ${x.qty} = ${fmt(x.price * x.qty)}`).join('\n'),
  };
  const configured = !!SITE.orderEndpoint;
  let sent = false;
  if (configured) {
    try {
      if (/script\.google(usercontent)?\.com/.test(SITE.orderEndpoint)) {
        // Google Apps Script: ön kontrol (CORS) istemeyen basit istek; yanıt okunamaz ama kayıt düşer
        await fetch(SITE.orderEndpoint, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(order) });
        sent = true;
      } else {
        const r = await fetch(SITE.orderEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(order) });
        sent = r.ok;
      }
    } catch { sent = false; }
  }
  // Gönderildiyse (ya da önizlemede) siparişi "Siparişlerim" için bu tarayıcıda da sakla
  if (sent || !configured) {
    try {
      const all = JSON.parse(localStorage.getItem('sesa-orders') || '[]');
      all.push(order);
      localStorage.setItem('sesa-orders', JSON.stringify(all));
    } catch { /* yok say */ }
  }
  return { order, sent, configured };
}
