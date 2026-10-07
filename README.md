# UnBe. — No Collection (3B kaydırmalı vitrin)

Tek sayfalık, arkasında tek bir sabit WebGL sahnesi olan parfüm vitrini. Ayrıntılı spesifikasyon: [AGENTS.md](AGENTS.md).

## Komutlar

| Komut | Ne yapar |
| --- | --- |
| `npm run dev` | Geliştirme sunucusu |
| `npm run build` | Tip denetimi + üretim derlemesi (`dist/`) |
| `npm run preview` | Derlemeyi sunar |
| `npm run images` | Ürün fotoğraflarını indirir, arka planı siler, `public/products/<id>.png` + `<id>.json` üretir |
| `npm run cards` | #all kart görsellerini sahneden render eder → `public/cards/<id>.webp` |
| `npm run shots` | 1440×810 ve 390×844'te her bölümün ekran görüntüsü → `shots/` (konsol hata/uyarılarını raporlar) |

`npm run shots -- desktop` veya `npm run shots -- mobile` tek görünüm alır.

## Yapı

- `src/scroll/scroll.ts` — Lenis, bölüm ölçümleri, `progress(id)`, #flavors sayfalı kaydırma (tekerlek, swipe, klavye)
- `src/three/BottleRig.tsx` — istasyon tabanlı koreografi: her bölüm bir poz üretir, bölümler arasında pozlar
  ease-in-out ile karışır; ürün değişiyorsa değişim şişe yandan görünürken yapılır
- `src/three/Bottle.tsx` + `bottleGeometry.ts` — fotoğraf profilinden kapak (torna) ve gövde (ekstrüzyon)
- `src/ui/sections/*` — HTML bölümleri

## Spesifikasyondan bilinçli farklar

- **Ortam haritası:** drei `preset="studio"` çalışma anında harici CDN'den 1.6 MB HDR indiriyor. Aynı HDR
  (`studio_small_03`) 256×128'e küçültülüp `public/hdri/studio.hdr` (130 KB) olarak yerelden yükleniyor.
- **Arka plan rengi ve ACES:** Sahne sonunda ACES Filmic ton eşleme var (şişeler ACES ile görünür). ACES
  doygun renkleri kaydırdığı için (mor → mavi, kırmızı → pembe) arka plan shader'ı three'nin ACES eğrisinin
  tam tersini uygular; böylece fon, ürünün `color`'ında birebir görünür.
- **Piramit kesitleri:** Clipping plane yerine gövde, kesit hizasından ikiye ayrılmış iki ekstrüzyon olarak
  üretilir; kesit yüzeyleri kapalı ve dolu görünür (clipping planes içi boş kabuk gösterirdi).
- **Yumuşak normaller:** `mergeVertices` yerine `toCreasedNormals` kullanılır: ön yüz keskin kalır, pah ve
  yan yüzler yumuşar (UV/grup bilgisi korunur).
- **Mağaza dönüşü:** Ekstrüzyon gövde tam yandan bakınca kalıp gibi göründüğü için şişe ±40° salınarak döner.
- **Zemin:** Şişe kaidesiz/aşağıda durduğu bölümlerde (ritüel, piramit) zemin aşağı iner ki şişe zeminin
  içinden geçmesin; ufuk bandı zeminin uzak kenarıyla birlikte hareket eder.
- **EN metinler:** Koku hikâyeleri ve marka metni yalnız TR verilmişti; EN için sadık çeviriler kullanıldı.
