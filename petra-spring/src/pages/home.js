// Ana sayfa: açılış ve kaydırmalı 3B ürün akışı (src/pages/stream.js), altında ürün grupları ve vitrin
import { $, FLAVORS, productCard, initReveal, webglOK } from '../site.js';
import { initStream } from './stream.js';

const byId = (id) => FLAVORS.find((f) => f.id === id);
$('#featured').innerHTML = ['anka', 'cam-aura', 'kerasus', 'once-vatan', 'ocean', 'cam-tutti', 'agartha', 'gulumse']
  .map((id) => productCard(byId(id))).join('');
initReveal();
if (webglOK()) initStream(); else document.body.classList.add('no-gl');
