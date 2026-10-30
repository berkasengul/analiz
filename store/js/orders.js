// Sipariş oluşturma ve mağazaya iletme (sepet formu ve SESA Asistan ortak kullanır).
// İletim sırası: config.orderEndpoint (POST JSON) → WhatsApp → e-posta taslağı.
import { SITE } from './config.js';

// Telefonu 05xx… biçimine getirir; geçersizse null
export function normPhone(v) {
  const d = String(v).replace(/\D/g, '').replace(/^90/, '').replace(/^0/, '');
  return /^5\d{9}$/.test(d) ? `0${d}` : null;
}

// customer: { name, phone, city, address, note }; lines: [{ id, name, size, qty, price }]
// Dönüş: { order, sent, link, via } — link: müşterinin son adımda açacağı WhatsApp/e-posta adresi
export async function placeOrder(customer, lines, fmt) {
  const id = `SK-${Date.now().toString(36).toUpperCase().slice(-6)}`;
  const total = lines.reduce((n, x) => n + x.price * x.qty, 0);
  const order = { id, date: new Date().toISOString(), items: lines, total, customer };
  try {
    const all = JSON.parse(localStorage.getItem('sesa-orders') || '[]');
    all.push(order);
    localStorage.setItem('sesa-orders', JSON.stringify(all));
  } catch { /* yok say */ }
  let sent = false;
  if (SITE.orderEndpoint) {
    try {
      const r = await fetch(SITE.orderEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(order) });
      sent = r.ok;
    } catch { sent = false; }
  }
  const c = customer;
  const msg = `Merhaba, SESA KIDS sipariş vermek istiyorum.\nSipariş no: ${id}\n${lines.map((x) => `• ${x.name} – ${x.size} yaş × ${x.qty} = ${fmt(x.price * x.qty)}`).join('\n')}\nToplam: ${fmt(total)}\n\n${c.name}\n${c.phone}\n${c.address}, ${c.city}${c.payment ? `\nÖdeme: ${c.payment}` : ''}${c.note ? `\nNot: ${c.note}` : ''}`;
  let link = '';
  let via = sent ? 'endpoint' : '';
  if (SITE.whatsapp) { link = `https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(msg)}`; via = sent ? 'endpoint' : 'whatsapp'; }
  else if (!sent) { link = `mailto:${SITE.email}?subject=${encodeURIComponent(`SESA KIDS sipariş ${id}`)}&body=${encodeURIComponent(msg)}`; via = 'email'; }
  return { order, sent, link, via };
}
