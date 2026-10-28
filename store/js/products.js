// Ürün kataloğu. Fiyatlar örnek değerdir; gerçek fiyatlarla değiştirin.
// `image` alanına gerçek ürün fotoğrafı (şeffaf PNG önerilir) yolu verilirse
// çizim yerine o görsel kullanılır.

const INTERLOK_SIZES = ['1-2', '2-3', '3-4', '4-5', '5-6', '6-7', '7-8', '8-9', '9-10', '10-11', '11-12', '12-13'];
const D_SIZES = ['5-6', '6-7', '7-8', '8-9', '9-10', '10-11', '11-12', '12-13'];

export const BRAND = 'SESA KIDS';

export const PRODUCTS = [
  {
    id: '3003', code: 'İnterlok 3003', name: 'Renkli Kediler Takımı', line: 'interlok',
    style: 'crew', pattern: 'cats', trim: '#f4f2ee', price: 449,
    colorName: 'Çok renkli', sizes: INTERLOK_SIZES,
    desc: 'Rengârenk kedi desenli, yumuşak interlok kumaş. Ribanalı yaka, bilek ve paçalar.',
  },
  {
    id: '3004', code: 'İnterlok 3004', name: 'Dama Kepçeler Takımı', line: 'interlok',
    style: 'crew', pattern: 'checker', trim: '#22408a', price: 449,
    colorName: 'Lacivert / Beyaz', sizes: INTERLOK_SIZES,
    desc: 'Mavi-beyaz dama zemin üzerinde iş makineleri. Lacivert ribana detaylar.',
  },
  {
    id: '3005', code: 'İnterlok 3005', name: 'Dinozor Takımı', line: 'interlok',
    style: 'crew', pattern: 'dinos', trim: '#efe9dd', price: 449,
    colorName: 'Krem / Mavi', sizes: INTERLOK_SIZES,
    desc: 'Krem zemin, mavi dinozorlar. Nefes alan pamuklu interlok.',
  },
  {
    id: '3006', code: 'İnterlok 3006', name: 'Arabalar Takımı', line: 'interlok',
    style: 'crew', pattern: 'cars', trim: '#efe9dd', price: 449,
    colorName: 'Krem / Antrasit', sizes: INTERLOK_SIZES,
    desc: 'Krem zemin üzerinde antrasit arabalar. Lastikli bel, manşetli paça.',
  },
  {
    id: 'D-2004', code: 'D-2004', name: 'Ayıcıklı Ekose Takım', line: 'd',
    style: 'shirt', pattern: 'bearplaid', trim: '#8a6a4f', price: 549, gift: true,
    colorName: 'Bej ekose', sizes: D_SIZES,
    desc: 'Bej ekose zemin, ayıcık desenli düğmeli pijama takımı. Göz bandı hediyeli.',
  },
  {
    id: 'D-1001', code: 'D-1001', name: 'Gezegenler Takımı', line: 'd',
    style: 'shirt', pattern: 'planets', trim: '#e9e6f2', price: 549, gift: true,
    colorName: 'Lacivert', sizes: D_SIZES,
    desc: 'Lacivert zemin, gezegen ve yıldız desenli düğmeli takım. Göz bandı hediyeli.',
  },
  {
    id: 'D-1002', code: 'D-1002', name: 'Mavi Pötikare Takım', line: 'd',
    style: 'shirt', pattern: 'gingham', trim: '#ffffff', price: 549, gift: true,
    colorName: 'Açık mavi', sizes: D_SIZES,
    desc: 'Açık mavi pötikare, klasik yakalı düğmeli pijama takımı. Göz bandı hediyeli.',
  },
  {
    id: 'D-1003', code: 'D-1003', name: 'Kırmızı Ekose Takım', line: 'd',
    style: 'shirt', pattern: 'tartan', trim: '#1b1b1f', price: 549, gift: true,
    colorName: 'Kırmızı ekose', sizes: D_SIZES,
    desc: 'Kırmızı-siyah ekose, yakalı düğmeli takım. Göz bandı hediyeli.',
  },
];

export const byId = (id) => PRODUCTS.find((p) => p.id === id);

const fmt = new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 });
export const formatPrice = (n) => fmt.format(n);
export const sizeLabel = (s) => `${s} Yaş`;
