# Hope Istanbul · 3B konsept demo

> Bu klasör Hope Istanbul'a sunulmak üzere hazırlanmış **bağımsız bir konsept
> demodur** ve marka sahibiyle bağlantılı değildir. Koku isimleri ve notaları
> markanın yayımlanmış ürün bilgilerinden alınmıştır; şişe tasarımları
> temsilidir, açıklamalar ve fiyatlar örnektir. Herkese açık yayınlama;
> yalnızca markayla özel olarak paylaş.

Turkish Coffee Lady demosuyla aynı 3B altyapı. Şişe, markanın ürün fotoğrafına (docs/reference) göre modellendi: kare kalın cam, parlak altın silindir kapak, altın plaka üzerinde siyah sekiz köşeli yıldız ve ortada siyah pano.

- **Kokular (8):** Han, Queen of Palace, Narcissus, Grand Conqueror, Deep Secret, N.E.C.O, Forza, Submarine. Ön etiket fotoğraftaki tasarım; arka etiket (konsept) koku piramidi ve kokunun ilham aldığı yerin altın silüetini taşır.
- **Detay:** 4 hikâye kartı şişeyi döndürür: %30 esans, sekiz köşeli yıldız, koku piramidi (arka etiket), parfümörler (kapak yakın çekim).
- **Mağaza:** 10 / 50 / 100 ml (100 ml ₺9.500, markanın sitesindeki fiyat; diğerleri örnek), 5.000 ₺ üzeri ücretsiz kargo, hediye kutusu seçeneği, keşif seti, sepet.
- **İki dil:** Türkçe (₺) ve İngilizce ($).

## Çalıştırma

```bash
npm install
npm run dev
```

## Dosyalar

- `src/data.js`: kokular, özellikler, ritüel, hikâye, SSS (Türkçe).
- `src/i18n.js`: İngilizce içerik, fiyatlar, arayüz metinleri.
- `src/CanMesh.jsx`: şişe geometrisi (kare cam, iç sıvı, kalın taban, boyun, altın kapak, ön/arka etiket).
- `docs/label-generator.py`: şişe dokularını üretir: `python3 docs/label-generator.py src/assets/labels`.
