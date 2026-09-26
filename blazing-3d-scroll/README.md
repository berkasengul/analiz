# Blazing Energy: 3B scroll carousel

On tatlı bir enerji içeceği için tanıtım sayfası. Sayfa kaydırıldıkça kutular
bir yay üzerinde döner, öndeki kutu büyür ve tat bilgileri değişir. Öndeki kutuya
ya da tat adına tıklanınca detay görünümü açılır; burada oklarla tat
değiştirildiğinde kutunun rengi gürültülü bir geçişle değişir.

Temel olarak [mohAmineBrs/codrops-noise-transition](https://github.com/mohAmineBrs/codrops-noise-transition)
(MIT) projesindeki kutu modeli, doku geçiş shader'ı ve radyal gürültü arka planı kullanıldı.

![Carousel](docs/carousel.png)
![Detay](docs/detail.png)

## Çalıştırma

```bash
git clone -b claude/charming-dirac-aq3a53 https://github.com/berkasengul/analiz.git
cd analiz/blazing-3d-scroll
npm install
npm run dev      # http://localhost:5173
npm run build    # dist/ klasörü; Netlify Drop'a sürükleyip yayınlayabilirsin
```

## Yapı

| Dosya | Görevi |
| --- | --- |
| `src/data.js` | On tat: isim, kutu rengi, yazı rengi (`ink`), slogan, içerik notları, açıklama. |
| `src/scroll.js` | Scroll konumunu kesirli bir tat indeksine (`p`) çevirir. Her tat bir süre yerinde durur. |
| `src/Carousel.jsx` | On kutuyu sonsuz bir yay üzerine dizer (`arcPose`). Öndeki kutuya tıklamak detayı açar, yandakine tıklamak ona kaydırır. |
| `src/DetailCan.jsx` | Detay görünümündeki büyük kutu. Tat değişince Codrops gürültü geçişini oynatır. |
| `src/canMaterial.js` | Kutu shader'ı: dokudaki siyah zemini tat rengine, yazıları `ink` rengine boyar, iki tat arasında gürültülü geçiş yapar. |
| `src/Background.jsx` | Grafit degrade, alt köşelerde mor/mavi ışık ve her tat değişiminde yayılan renkli halka. |
| `src/Props.jsx` | Üstteki parlak siyah disk ve alttaki cam mercek. |
| `src/Particles.jsx` | Havada süzülen odak dışı parçacıklar. |
| `src/App.jsx` | Arayüz: header, menü, tat bilgileri, detay paneli, Ritual / Stockists / Contact bölümleri. |

Klavye: detay görünümünde ← → tat değiştirir, Esc kapatır.

### Özelleştirme

- **Tat eklemek/değiştirmek:** `src/data.js` içindeki diziyi düzenle. Scroll uzunluğu tat sayısına göre ayarlanır.
- **Yay şekli:** `src/Carousel.jsx` içindeki `arcPose` fonksiyonu (aralık, derinlik, eğim).
- **Kutu parlaklığı:** `src/canMaterial.js` içindeki `metalness` / `roughness`.

![Mobil](docs/mobile.png)

## Lisanslar

- Kutu modeli: [Energy Drink Game Ready Model](https://sketchfab.com/3d-models/energy-drink-game-ready-model-83676feb8b0a4589952cf3676299311b), dwalsh, CC BY 4.0
- Doku geçişi ve arka plan shader'ı: Codrops / Mohammed Amine Bourouis, MIT
- HDR ortam haritası: Poly Haven "Potsdamer Platz" (CC0)
