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
