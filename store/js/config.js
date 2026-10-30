// Mağaza ayarları — yayına almadan önce bu değerleri kendi bilgilerinizle doldurun.
export const SITE = {
  name: 'SESA KIDS',
  // Sitenin yayınlanacağı tam adres (SEO, paylaşım ve site haritası bunu kullanır)
  url: 'https://www.sesakids.com.tr',
  // Siparişlerin iletileceği WhatsApp numarası: ülke koduyla, boşluksuz (ör. '905551234567').
  // Boş bırakılırsa sipariş özeti müşteriye gösterilir ama mağazaya iletilmez.
  whatsapp: '',
  // İsteğe bağlı: siparişleri JSON olarak POST eden bir adres (ör. Formspree, Google Apps Script,
  // kendi sunucunuz). Doluysa siparişler buraya da gönderilir.
  orderEndpoint: '',
  email: 'merhaba@sesakids.com.tr',
  // Mağaza bilgileri (sohbet asistanı ve SEO)
  shipping: 'Siparişler 1–3 iş günü içinde kargoya verilir. 750 ₺ ve üzeri siparişlerde kargo ücretsizdir.',
  returns: 'Ürünü teslim aldıktan sonra 14 gün içinde, etiketi sökülmemiş ve kullanılmamış olarak iade edebilir ya da değiştirebilirsiniz.',
  payment: 'Sipariş onayından sonra ödeme bilgileri (havale/EFT veya kapıda ödeme) size iletilir.',
  freeShippingOver: 750,
  fabric: '%100 pamuk, yumuşak interlok kumaş; tene dost, terletmeyen ve çok yıkamada formunu koruyan dokuma.',
  sizeGuide: [
    ['2-3', '92–98 cm'], ['3-4', '98–104 cm'], ['4-5', '104–110 cm'], ['5-6', '110–116 cm'], ['6-7', '116–122 cm'],
    ['7-8', '122–128 cm'], ['8-9', '128–134 cm'], ['9-10', '134–140 cm'], ['10-11', '140–146 cm'], ['11-12', '146–152 cm'],
  ],
};
