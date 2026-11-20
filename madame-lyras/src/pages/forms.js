// bayilik ve iletişim sayfaları: Netlify formları, ürün sayfasından gelen teklif talebi, isteğe bağlı harita
import { $, $$, bindForm, SITE } from '../site.js';

bindForm($('#dealerForm'), $('#dealerStatus'), 'Teşekkürler, mesajınız bize ulaştı. En kısa sürede sizi arayıp tanışmak isteriz.');
bindForm($('#quoteForm'), $('#quoteStatus'), 'Teşekkürler, teklif talebiniz bize ulaştı. En kısa sürede sizi arayacağız.');
bindForm($('#contactForm'), $('#formStatus'), 'Teşekkürler, mesajınız bize ulaştı. En kısa sürede dönüş yapacağız.');

// ürün sayfasındaki "Toptan teklif iste" → teklif formunda o ürün seçili gelir
const urun = new URLSearchParams(location.search).get('urun');
if (urun) {
  const box = $(`#pick input[data-id="${CSS.escape(urun)}"]`) || (urun.startsWith('resq-') ? $('#pick input[data-id="resq-yemek"]') : null);
  if (box) box.checked = true;
  // ResQ yemeği: hangi çeşit olduğu not alanına yazılır
  if (urun.startsWith('resq-') && box && box.dataset.id === 'resq-yemek' && $('#q-msg')) {
    const name = new URLSearchParams(location.search).get('ad');
    if (name) $('#q-msg').value = `${name} için teklif almak istiyorum.`;
  }
}
$$('.pick__grpall').forEach((btn) => btn.addEventListener('click', () => {
  const boxes = [...btn.closest('.pick__grp').querySelectorAll('input')];
  const all = boxes.every((b) => b.checked);
  boxes.forEach((b) => { b.checked = !all; });
  btn.textContent = all ? 'Tümünü seç' : 'Seçimi temizle';
}));
$('#pickAll')?.addEventListener('click', (e) => {
  const boxes = $$('#pick input');
  const all = boxes.every((b) => b.checked);
  boxes.forEach((b) => { b.checked = !all; });
  e.currentTarget.textContent = all ? 'Tümünü seç' : 'Seçimi temizle';
});

// harita yalnızca istenince yüklenir (Google çerezleri)
$('#mapBtn')?.addEventListener('click', () => {
  $('#map').innerHTML = `<iframe title="Konum haritası" loading="lazy" referrerpolicy="no-referrer-when-downgrade" src="https://www.google.com/maps?q=${encodeURIComponent(SITE.address || SITE.mapQuery)}&output=embed"></iframe>`;
});
