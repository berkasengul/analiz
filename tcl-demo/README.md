# Turkish Coffee Lady · 3B konsept demo

> Bu klasör Turkish Coffee Lady'ye sunulmak üzere hazırlanmış **bağımsız bir
> konsept demodur**. Marka sahibiyle bağlantılı değildir.
>
> - Bold Istanbul ve Silky Mardin kutuları, markanın ürün fotoğraflarından esinlenerek yeniden çizilmiştir.
> - Diğer üç tadın kutuları aynı tasarım dilinde konsept önerileridir.
> - Besin değerleri, açıklamalar ve fiyatlar örnektir.
>
> Onay alınmadan herkese açık bir adreste yayınlanmamalıdır. Sayfa `noindex` etiketlidir.

**Blazing ile aynı 3B yapı, 250 ml slim kutularla:**

- **Carousel:** Beş şehir tadı var: Bold Istanbul (gümüş), Silky Mardin (altın), Pistachio Zeugma, Minty Cappadocia ve Piney Aegean. Kutular scroll ile döner; yan kutuya tıklayınca ortadakiyle yer değiştirir, öndekine tıklayınca detay açılır.
- **Detay:** Dört hikâye var: 500 yıllık tarif (fincan yakın çekimi), Beş şehir (siluet), Sade içerik (besin değerleri) ve Dijital fal. Her birinde kutu dönüp yakınlaşır, spot ışık vurur.
- **Diğer bölümler:** Ritüel (Soğut, Çalkala, Paylaş), mağaza, sepet ve SSS.

![Carousel](docs/carousel.png)
![Detay](docs/detail.png)
![Fincan](docs/cup.png)
![Besin değerleri](docs/label.png)
![Dijital fal](docs/fal.png)

## Çalıştırma

```powershell
cd analiz\tcl-demo
npm install
npm run dev
```

Tarayıcıda `http://localhost:5173` adresini aç. Yan kutuya tıklama animasyonunu
ağır çekimde görmek için adresin sonuna `?slowmo=8` ekle.

## Nasıl yapıldı

- **Kutu** (`src/CanMesh.jsx`): Ayrı bir 3B dosya yok; kutu koddan üretilir. Alüminyum gövde ve kapak dönen bir profilden (lathe) çıkar, açma halkası eklenir, baskı gövdeyi saran bir banttır. Ölçüler slim kutu oranındadır.
- **Etiketler** (`src/assets/labels/*.jpg`): `docs/label-generator.py` ile tam renkli olarak üretilir (fontlar `docs/label-fonts` altında, SIL OFL). Etiket kutuyu şöyle sarar: u = 0.5 ön yüz, u = 0.25 arka (besin değerleri), u = 0.75 yan (dijital fal). Düz hallerini görmek için: `docs/labels-flat.png`.
- **Tat geçişi** (`src/canMaterial.js`): Tat değişirken iki etiket görseli arasında Codrops projesindeki gürültülü geçiş oynar.
- **Marka, tatlar, metinler:** `src/brand.js` ve `src/data.js`.

## Resmi tasarım gelince

1. **Etiketler:** Markanın gerçek kutu baskı dosyaları (düz, açılmış etiket; PDF ya da PNG) 2048×1418 oranında `src/assets/labels` altına konur; kod değişmez.
2. **Metinler:** Gerçek ürün açıklamaları, fiyatlar ve satış noktaları `src/data.js` dosyasına yazılır. Ödeme bağlantısı `src/config.js` dosyasına eklenir.
