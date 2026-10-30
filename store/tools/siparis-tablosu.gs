/**
 * SESA KIDS sipariş paneli — Google E-Tablo + e-posta bildirimi (ücretsiz).
 *
 * Kurulum (5 dakika):
 * 1. Google Drive'da yeni bir E-Tablo açın, adını "SESA KIDS Siparişler" yapın.
 * 2. Uzantılar → Apps Script. Açılan sayfadaki kodu silip bu dosyanın tamamını yapıştırın.
 * 3. Aşağıdaki BILDIRIM_EPOSTA satırına siparişlerin bildirileceği e-postayı yazın, kaydedin.
 * 4. Dağıt → Yeni dağıtım → Tür: Web uygulaması.
 *    "Şu kullanıcı olarak çalıştır: Ben", "Erişimi olanlar: Herkes" seçip Dağıt'a basın,
 *    izinleri onaylayın.
 * 5. Verilen "Web uygulaması URL'si"ni kopyalayıp sitedeki store/js/config.js dosyasında
 *    orderEndpoint: '...' alanına yapıştırın.
 *
 * Her sipariş E-Tablo'ya yeni bir satır olarak düşer ve size e-posta gelir. "Durum" sütununu
 * (Yeni / Hazırlanıyor / Kargoda / Teslim edildi) siz güncellersiniz.
 */
const BILDIRIM_EPOSTA = 'siparis@ornek.com';

const BASLIKLAR = ['Tarih', 'Sipariş no', 'Durum', 'Ad soyad', 'Telefon', 'İl / ilçe', 'Adres', 'Ödeme',
  'Ürünler', 'Adet', 'Ara toplam', 'Üye indirimi', 'Toplam', 'Üye e-posta', 'Not'];

function doPost(e) {
  const o = JSON.parse(e.postData.contents);
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(BASLIKLAR);
    sheet.getRange(1, 1, 1, BASLIKLAR.length).setFontWeight('bold').setBackground('#ffe3f1');
    sheet.setFrozenRows(1);
  }
  const c = o.customer || {};
  const adet = (o.items || []).reduce((n, x) => n + x.qty, 0);
  sheet.appendRow([new Date(o.date), o.id, 'Yeni', c.name, "'" + c.phone, c.city, c.address, c.payment || '',
    o.summary, adet, o.subtotal, o.discount || 0, o.total, c.email || '', c.note || '']);
  if (BILDIRIM_EPOSTA && BILDIRIM_EPOSTA.indexOf('@') > 0) {
    MailApp.sendEmail({
      to: BILDIRIM_EPOSTA,
      subject: 'Yeni sipariş ' + o.id + ' – ' + o.total + ' TL',
      body: 'Yeni SESA KIDS siparişi\n\n' + o.summary + '\n\nToplam: ' + o.total + ' TL'
        + (o.discount ? ' (üye indirimi ' + o.discount + ' TL)' : '')
        + '\n\n' + c.name + '\n' + c.phone + '\n' + c.address + ', ' + c.city
        + '\nÖdeme: ' + (c.payment || '-') + (c.note ? '\nNot: ' + c.note : ''),
    });
  }
  return ContentService.createTextOutput(JSON.stringify({ ok: true, id: o.id })).setMimeType(ContentService.MimeType.JSON);
}
