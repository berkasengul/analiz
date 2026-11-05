# Harita dışı tarzlar (kodla, ücretsiz)

| Dosya | Tarz | Örnek |
|---|---|---|
| `cop.py` | Çöp adam: kâğıt doku, çizgi karakterler, konuşma balonları, yürüme döngüsü | 22 Nisan 1453, gemiler karadan (18 sn) |
| `tahta.py` | Beyaz tahta: çizgiler adım adım açılır, kalem ucu izler, yazı harf harf | Ayasofya'nın 1.500 yılı (18 sn) |
| `veri.py` | Veri animasyonu: sayaçla büyüyen çubuklar | Hangi devlet kaç yıl yaşadı? (16 sn) |
| `nasil.py` | "Nasıl yaptık" açıklama görselleri | |
| `fmtlib.py` | Ortak: yazı, kolaylaştırma, kısmi yol çizimi, ffmpeg çıkışı | |

Yazı tipleri (OFL, depoya girmez): `fonts/Caveat.ttf`, `fonts/PatrickHand.ttf`, raw.githubusercontent.com/google/fonts/main/ofl/ altından.

```bash
python3 cop.py stills 1.5 7.5 13.6   # kontrol kareleri
python3 cop.py                       # out/cop_adam.mp4
```

Hangi konuya hangi tarz: savaş ve sınırlar → harita; komik olay, Shorts → çöp adam; yapı ya da kişi hikâyesi → beyaz tahta; karşılaştırma, sıralama → veri.

## Çizgi film (kukla) tarzı — kullanıcının seçtiği
Kalın siyah çizgi, düz renk, mimari arka plan, konuşan karakterler. Hepsi kodla, ücretsiz.

| Dosya | Ne yapar |
|---|---|
| `cizgi.py` | Cami avlusu arka planı (kubbe, revak, minare, şadırvan), `fillo`, `arm` yardımcıları |
| `karakter.py` | Karakterler: `fatih()`, `yeniceri()`; `face2` yüzü (ifade: normal / kizgin / gulen, `talk` ile sese bağlı ağız, göz kırpma). `python3 karakter.py` karakter kartlarını çizer |
| `sahne_fatih.py` | Örnek sahne: 29 Mayıs 1453 ordugâhı. `tts` → karakter başına ses + ağız zarfı (`out/sahne_tl.json`), sonra render |

Sesler (ElevenLabs, `eleven_v4`): anlatıcı Berkay `KTXKO43nOuyC5Akqu7yX`, Fatih "Fatih Yıldırım" `7VqWGAWwo2HMrylfKrcm`, yeniçeri "Berkay Ozboler" `nBnvrVUbHrIrA5DpT4vp`.
Yeni karakter = yeni fonksiyon (gövde + kafa + `face2` ayarları). Yeni mekân = `background()` gibi bir arka plan fonksiyonu.

## Diğer denemeler (kullanıcı beğenmedi: "slayt gibi")
`golge.py` gölge oyunu, `parsomen.py` eski harita, `kure.py` 3D küre (NE1 dokusu `world_5400.jpg`, depoya girmez), `kagit.py` kâğıt kesik, `soy.py` soy ağacı.

## 3D (`../sahne3d/`)
KayKit CC0 paketleri (GitHub: KayKit-Game-Assets, karakterler 76 animasyonlu) + three.js, headless Chromium (swiftshader). Sunucu açmadan, `shot.js` dosyaları diskten servis eder. `node render.js kusatma.html çıktı 12 30`.
