# Portfolyo

Tek sayfalık portfolyo: parfüm ve kozmetik markaları için 3D ürün siteleri. İçinde canlı örnek olarak hayali
**Selvi Atelier** markası var (`ornek/`). Gerçek markaların demoları bilerek konmadı: izinleri olmadan logolarını ve
ürünlerini herkese açık bir sayfada göstermek hukuken riskli ve o markalar görürse ters teper. Bir markaya
hazırlanan demo yalnızca o markaya gönderilir.

## Yayına almadan önce

`index.html` dosyasının en altındaki `KISI` bloğunu doldur (başka bir yere dokunmana gerek yok):

```js
const KISI = {
  ad: "Berka [Soyadın]",
  unvan: "Web tasarım · 3D ürün deneyimleri",
  whatsapp: "905XXXXXXXXX", // ülke koduyla, boşluksuz
  eposta: "[e-posta adresin]",
  instagram: "[instagram kullanıcı adın]",
};
```

Sonra paketle ve yükle:

```
python3 portfolyo/paketle.py            # → demolar/portfolyo-Netlify.zip
```

`demolar/portfolyo-Netlify.zip` dosyasını açmadan app.netlify.com/drop sayfasına sürükle. Site adını
`berka-3d` gibi sade bir şey yap. Canlı örnek `<adres>/ornek/` altında açılır.

## Canlı örneği değiştirmek

Selvi Atelier'in ayarları `demo-fabrikasi/markalar/ornek-parfum.json` dosyasında (duvar: `ornek-parfum-assets/desen.jpg`,
`desen-arkaplan.py` ile zümrüt yeşili). Değiştirdikten sonra:

```
python3 demo-fabrikasi/yeni-demo.py demo-fabrikasi/markalar/ornek-parfum.json
python3 portfolyo/paketle.py
```

## Hizmetler hakkında

"Reels için 3D videolar" ve "3D ürün görünümü" (mevcut siteye eklenen çevrilebilir şişe) sayfada hizmet olarak
yazıyor ama henüz hazır bir ürün değil; biri isterse ayrıca hazırlanır. İstemezsen `index.html`'de
`#hizmetler` bölümünden ilgili kartı sil.
