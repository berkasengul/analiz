// iletişim sayfası: Netlify formu, isteğe bağlı harita
import { $, $$, bindForm, SITE } from '../site.js';

bindForm($('#contactForm'), $('#formStatus'), 'Teşekkürler, mesajınız bize ulaştı. En kısa sürede dönüş yapacağız.');

// harita yalnızca istenince yüklenir (Google çerezleri)
$('#mapBtn')?.addEventListener('click', () => {
  $('#map').innerHTML = `<iframe title="Konum haritası" loading="lazy" referrerpolicy="no-referrer-when-downgrade" src="https://www.google.com/maps?q=${encodeURIComponent(SITE.address || SITE.mapQuery)}&output=embed"></iframe>`;
});
