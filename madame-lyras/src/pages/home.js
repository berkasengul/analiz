// Ana sayfa: hareketsiz, düz ekran (3B ve kaydırma efekti yok)
import { $, FLAVORS, productCard, initReveal } from '../site.js';

const byId = (id) => FLAVORS.find((f) => f.id === id);
$('#featured').innerHTML = ['cilek', 'beyaz-ejder', 'ahududu', 'mango', 'mavi-yemis', 'lime', 'kirmizi-ejder', 'ananas']
  .map((id) => productCard(byId(id))).join('');
initReveal();
