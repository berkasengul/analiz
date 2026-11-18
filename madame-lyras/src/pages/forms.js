// bayilik ve iletişim sayfaları: Netlify formları, ürün sayfasından gelen teklif talebi, isteğe bağlı harita
import { $, bindForm, SITE } from '../site.js';

bindForm($('#dealerForm'), $('#dealerStatus'), 'Teşekkürler, bayilik başvurunuz bize ulaştı. Bölge sorumlumuz en kısa sürede sizinle iletişime geçecek.');
bindForm($('#contactForm'), $('#formStatus'), 'Teşekkürler, mesajınız bize ulaştı. En kısa sürede dönüş yapacağız.');

// ürün sayfasındaki "Toptan teklif iste" → bayilik formu o ürünle doldurulur
const urun = new URLSearchParams(location.search).get('urun');
if (urun && $('#d-msg')) {
  $('#d-msg').value = `${urun} için toptan fiyat teklifi almak istiyorum.`;
  if (/kit|gevrek/i.test(urun) && $('#d-ilgi')) $('#d-ilgi').value = 'Hazır gıda kitleri';
}

// harita yalnızca istenince yüklenir (Google çerezleri)
$('#mapBtn')?.addEventListener('click', () => {
  $('#map').innerHTML = `<iframe title="Konum haritası" loading="lazy" referrerpolicy="no-referrer-when-downgrade" src="https://www.google.com/maps?q=${encodeURIComponent(SITE.address || SITE.mapQuery)}&output=embed"></iframe>`;
});
