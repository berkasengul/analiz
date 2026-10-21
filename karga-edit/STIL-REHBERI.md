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

## Var olan bir videoyu yeni stile çevirme (`edit_showroom.py`)
1. `transcribe.py`: sesi Türkçe olarak, kelime zamanlarıyla yazıya döker (faster-whisper large-v3-turbo).
2. `classify.py`: her kareyi sınıflandırır: ekran kaydı, eski slayt, telefon paneli ya da önce/sonra.
3. `edit_showroom.py`:
   - Eski slaytları ve paneller yerine yeni animasyonlu sahneler koyar.
   - Ekran kayıtlarını bantlardan kesip yüzen kart olarak yerleştirir; anlatıma göre zoom yapar.
   - Bölüm geçişleri, metin vurguları, köşede tepki veren karga, altyazı, müzik ve efektler ekler.
   - Render 4 çekirdekte paralel çalışır.

```
python3 -I edit_showroom.py <varlik_klasoru> stills 12.5 60   # tek kare kontrol
python3 -I edit_showroom.py <varlik_klasoru> render 4          # tam video
```
