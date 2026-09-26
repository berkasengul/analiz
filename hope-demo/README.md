# Hope Istanbul · 3B konsept demo

> Bu klasör Hope Istanbul'a sunulmak üzere hazırlanmış **bağımsız bir konsept
> demodur** ve marka sahibiyle bağlantılı değildir. Koku isimleri ve notaları
> markanın yayımlanmış ürün bilgilerinden alınmıştır; şişe tasarımları
> temsilidir, açıklamalar ve fiyatlar örnektir. Herkese açık yayınlama;
> yalnızca markayla özel olarak paylaş.

Turkish Coffee Lady demosuyla aynı 3B altyapı, 100 ml parfüm şişeleriyle.

- **Kokular:** Han, Queen of Palace, Narcissus, Grand Conqueror, Deep Secret. Her şişede kokunun rengi, arka yüzüne işlenmiş İstanbul silueti (Kapalıçarşı, Topkapı ve Boğaz köprüsü, Tarihi Yarımada, Rumeli Hisarı, Kız Kulesi) ve altın varaklı Osmanlı kemeri etiketi var.
- **Detay:** 4 hikâye kartı şişeyi döndürür: %30 esans, İstanbul silueti, koku piramidi (yan yüz), parfümörler (diğer yan yüz).
- **Mağaza:** 10 / 50 / 100 ml, ücretsiz hediye kutusu seçeneği, keşif seti, sepet.
- **İki dil:** Türkçe (₺) ve İngilizce ($).

## Çalıştırma

```bash
npm install
npm run dev
```

## Dosyalar

- `src/data.js`: kokular, özellikler, ritüel, hikâye, SSS (Türkçe).
- `src/i18n.js`: İngilizce içerik, fiyatlar, arayüz metinleri.
- `src/CanMesh.jsx`: şişe geometrisi (cam, sıvı, bilezik, sekizgen kapak).
- `docs/label-generator.py`: şişe dokularını üretir: `python3 docs/label-generator.py src/assets/labels`.
