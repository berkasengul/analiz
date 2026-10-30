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
  // Mağaza konumu (Google Haritalar'daki "Sesa Kids" kaydı). Açık adresi buraya yazın.
  address: 'Çakmak Mah., Varan Cd. No:1 D:B, 34764 Ümraniye',
  city: 'İstanbul',
  geo: { lat: 41.0161585, lng: 29.1272508 },
  mapEmbed: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3010.4157884191945!2d29.12467587551427!3d41.016158518940365!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x14cac95b29e00031%3A0x7e4e00a0f7aa343e!2sSesa%20Kids!5e0!3m2!1str!2str!4v1793348902243!5m2!1str!2str',
  mapLink: 'https://maps.google.com/?cid=9101212588312245310',
  // Mağaza bilgileri (sohbet asistanı ve SEO)
  shipping: 'Siparişler 1–3 iş günü içinde kargoya verilir. 750 ₺ ve üzeri siparişlerde kargo ücretsizdir.',
  returns: 'Ürünü teslim aldıktan sonra 14 gün içinde, etiketi sökülmemiş ve kullanılmamış olarak iade edebilir ya da değiştirebilirsiniz.',
  payment: 'Sipariş onayından sonra ödeme bilgileri (havale/EFT veya kapıda ödeme) size iletilir.',
  freeShippingOver: 750,
  // Üyelere özel indirim: ara toplam `min` ve üzeriyse `amount` TL düşülür
  memberDiscount: { amount: 100, min: 800 },
  fabric: '%100 pamuk, yumuşak interlok kumaş; tene dost, terletmeyen ve çok yıkamada formunu koruyan dokuma.',
  sizeGuide: [
    ['2-3', '92–98 cm'], ['3-4', '98–104 cm'], ['4-5', '104–110 cm'], ['5-6', '110–116 cm'], ['6-7', '116–122 cm'],
    ['7-8', '122–128 cm'], ['8-9', '128–134 cm'], ['9-10', '134–140 cm'], ['10-11', '140–146 cm'], ['11-12', '146–152 cm'],
  ],
};
