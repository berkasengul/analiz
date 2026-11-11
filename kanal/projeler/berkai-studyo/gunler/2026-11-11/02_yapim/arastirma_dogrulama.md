# Araştırma ve doğrulama: "Claude Fable 5.2'ye şirket kurdurdum"

Senaryodaki her iddia, kaynağı ve durumu. "Bugünün dosyası" = `gunler/2026-11-11/` altındaki çıktı.

## Doğrulananlar

| Senaryoda | Kaynak | Durum |
|---|---|---|
| Ofiste 17 çalışan | Ekip panellerindeki roller: 3 + 4 + 3 + 3 + 3 + 1; ofiste 17 karakter | Doğru |
| 5 konu önerisi | `01_konu/konu_raporu.md` (Ö1–Ö5; biri elendi) | Doğru |
| 14 işletme sitesi ölçüldü | `03_musteri/adaylar.json` (14 kayıt; biri ölçüm anında 502 verdi) | Doğru; "ölçüldü" yerine "açıldı" demek daha kesin |
| 6 işletme "sitesi iyi" diye elendi | `03_musteri/aday_tablosu.csv`, Durum = Elendi | Doğru (biri ayrıca adres doğrulanamadığı için) |
| 3 güçlü aday | Aynı tablo, öncelik A | Doğru |
| Çikolata atölyesinin sitesinde yalnızca "çok yakında" yazıyor | `03_musteri/ekran/oatolye_masaustu.jpg`, 11.11.2026 | Doğru; yayından önce siteyi bir daha aç, değişmiş olabilir |
| Zeytinyağı üreticisinde telefonda ilk görüntü 5 sn | `03_musteri/olcum_coskun.json`: 5.012 ms | Tek ölçüm, veri merkezinden. Senaryoda bu uyarı var (cümle 111–112) |
| 2 demo site, 16 kontrolün 16'sı geçti | `04_site/test_raporu.md` | Doğru |
| Kavanozda 150 zeytin | `siteler/_motor/site.js`, `kavanoz` modeli (n = 150) | Doğru |
| Demolar internetsiz çalışıyor | Test: dış istek 0 | Doğru |
| 4 mail taslağı, 80 kelimenin altında, gönderilmedi | `05_mail/*.md`; gövdeler 44–67 kelime | Doğru |
| Müdür 5 karar soruyor | `06_mudur/kararlar_bekleyen.json` | Doğru |
| Kanal ortalaması 485, en iyi video 986 | vidIQ, @kargazihni son 7 uzun video, 11.11.2026 | Doğru; sayılar her gün değişir |
| Sektör adıyla açılan başlıklar altta | Aynı veri: oto galeri videoları 231 ve 309 | 7 videoluk örnek; senaryoda "eğilim" gibi söyleniyor, kural gibi değil |
| 3 binden az aboneli kanal bir günde 10 bin | vidIQ: Forn AI, 2.930 abone, 10.834 izlenme, 10.11.2026 yayın | Doğru |
| Ajan ekibi videosu 49 bin | vidIQ: Avenox, 49.103 | Doğru |
| Tablet yan döndü, kareler ambalajı deldi | Bugünkü ilk test ekran görüntülerinde görüldü, sonra düzeltildi | Doğru (ilk sürümün görüntüleri saklanmadı; istersen yeniden üretilebilir) |
| Arama motoru ekibi bot sandı | Bugün: tarayıcıyla yapılan aramalar alakasız sonuç döndürdü | Doğru |
| Bir sitede şablondan kalma örnek mail adresi | `03_musteri/olcum_modabakir.json`: "email@adresiniz.com" | Doğru |
| Seramik dükkânında 5 ürünün 5'i tükenmiş | `03_musteri/ekran/kapseramik_masaustu.jpg` | Doğru |

## Tek kaynaklı: böyle söyle

| Senaryoda | Kaynak | Not |
|---|---|---|
| Fable 5.2 pazartesi çıktı | Silicon Report haberi (9 Kasım 2026); vidIQ'da 10 Kasım tarihli onlarca video | Anthropic'in kendi duyurusu açılmadı. Tarih dışında rakam söyleme |
| Atölye çekirdeği kendi kavuruyor, taş değirmende ~24 saat | Saatolog söyleşisi, 28.01.2026 | Mail taslağında "söyleşinizi okudum" diye geçiyor; videoda işletme adı yok |

## Senaryodan çıkarılanlar
- "Fable 5.2 yüzde 30 daha hızlı": Anthropic'in iddiası, tek haberde geçiyor. Çıkarıldı.
- Model fiyatları: kural 7 (fiyat söylenmez). Çıkarıldı.
- "Bu şirketi kurmak şu kadar sürdü": süre ölçülmedi. Çıkarıldı.
- İşletme adları: mail henüz gitmedi. Senaryoda "bir çikolata atölyesi", "bir zeytinyağı üreticisi".

## Senin kontrol edeceklerin
- Cümle 180–183 ("ilk denememde tersini yapmıştım… hepsini sildim"): depo geçmişindeki "uydurma test verisi kaldırıldı" kaydına dayanıyor. Hikâye senin; yanlışsa düzelt.
- Avatar klipleri: YouTube'da "değiştirilmiş veya yapay içerik" kutusunu işaretle (kural 5).
- Kanal "çocuklara yönelik değil" (kural 6).
