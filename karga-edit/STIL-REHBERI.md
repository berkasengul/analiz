# Karga Zihni — Kurgu Stil Rehberi (v2, sinematik)

Referans: Isaac (@isaacverse) — "How I Actually Edit Viral Videos", "I Blew Up a Shorts Channel in 7 Days!"

## Eski kurgudaki sorunlar
- Krem zemin üzerinde sabit slaytlar: sunum (PowerPoint) hissi veriyor.
- Karga sabit bir PNG. Hareket etmediği için "yapay zekâ üretimi" gibi görünüyor.
- Düz sans-serif yazılar; sahneler arasında sert kesmeler var, geçiş yok.
- Ses tasarımı yok: müzik, vuruş ve geçiş efektleri eksik.
- Marka adı tutarsız: "Karga Zihni" ve "Karga Atölye" birlikte kullanılıyor.

## Yeni stil
| Öğe | Kural |
|---|---|
| Zemin | Koyu lacivert-siyah radyal gradyan, film greni, vinyet, hafif renk kayması (chromatic aberration) |
| Vurgu rengi | Turuncu #FF8028 (kargının atkısıyla aynı), parıltılı |
| Yazı | Karışık font: italik serif (Playfair Display Italic) + kalın sans (Montserrat Black). Bulanıktan nete gelerek açılır |
| Altyazı | Küçük, küçük harf, ortada alt kısımda (Montserrat SemiBold 34px) |
| Karga | Turuncu arkadan ışık (rim glow); zıplama, yere inince esneme, konuşurken kıpırdama; poz değişimleri |
| İmza öğe | Altın çizgili karga kendi kendini çizer, sonra flaşla renklenir |
| Ekran kaydı | Arkasında bulanık ve karartılmış kopyası (ambient), eğik açıdan düzleşerek gelir, yavaş yakınlaşma |
| Geçişler | Zoom-through (zoom blur ile), whip pan (yatay hareket bulanıklığı), vuruş + flaş + sarsıntı |
| Ses | Minör pad ve arpej müzik, sub-bass vuruşlar, riser, whoosh, tık sesleri |
| Tempo | 2–4 saniyede bir görsel değişim |

## Çalıştırma
```
python3 -I render_sinematik.py <varlik_klasoru>
```
`<varlik_klasoru>` içinde şunlar olmalı:
- `poses/karga-pozlari-v1/*.png`
- `fonts/`: PlayfairItalic.ttf, Montserrat.ttf (Google Fonts)
- `yt/xhb_KI1HHt4.jpg`: geçici site görüntüsü. Gerçek ekran kaydı gelince değiştirilecek.
