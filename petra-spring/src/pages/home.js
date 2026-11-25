// Ana sayfa: hareketsiz (3B yalnızca ürün kataloğu ve ürün sayfalarında)
import { $, FLAVORS, productCard, initReveal } from '../site.js';

const byId = (id) => FLAVORS.find((f) => f.id === id);
$('#featured').innerHTML = ['anka', 'cam-aura', 'kerasus', 'once-vatan', 'ocean', 'cam-tutti', 'agartha', 'gulumse']
  .map((id) => productCard(byId(id))).join('');
initReveal();
