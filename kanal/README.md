# Karga Zihni: video üretim hafızası

Bu dosya kanalın kalıcı hafızasıdır. Yeni bir oturumda video yapmadan önce önce bunu, sonra `SERI.md`'yi ve `YAZIM_REHBERI.md`'yi oku.

- **Kanal:** Karga Zihni (@kargazihni). Yapay zekâ ile web siteleri ve 3D deneyimler. Kapanış sözü: "Kuşlar seni bekliyor, uç."
- **Dil:** Türkçe. Kullanıcı kısa ve net cevap ister.
- **Seri:** "Claude ile 3D Site". Her bölümde bir marka, o markaya Claude ile yapılmış bir 3D demo site. Plan ve bölüm kaydı `SERI.md`'de.

## Kanal adı değişiyor: BerkAİ (eski adı Karga Zihni)
- Kullanıcı kanala kendi yüzünü koyuyor. HeyGen ile yapılmış avatar videoları (kendi yüzü, konuşan) videolara ara ara eklenecek.
- Örnek avatar klibi: 1280×720, 25 fps, -17 LUFS, sağ altta HeyGen filigranı (ücretsiz plan). Teslimde: 1080p'ye büyüt, 30 fps'e çevir, sesi -14 LUFS'e eşitle.
- Kullanım yerleri: açılıştan hemen sonra 5–10 sn giriş, bölüm geçişleri, kapanış/yorum çağrısı. Animasyon üstünde köşe görüntü (ölçüleri aşağıda).
- Avatar sesi anlatıcı sesiyle aynı olmalı (ElevenLabs "Berkay" sesi).
- Gerçekçi yapay avatar: YouTube'da "değiştirilmiş veya yapay içerik" kutusu işaretlenir, açıklamaya not düşülür.
- Köşe avatarı (kullanıcının referansı, Onur Naci Öztürkler tarzı): sol altta, ekranın alt kenarına yaslı yuvarlak, çapı ~400 px (1080p), kenarlıksız, hafif gölge. Kadraj geniş: baş, omuz ve eller görünür (yüze yakın kırpma yok). Alt yazılar avatarın üstüne binmez, sağa kayar.

## Video kuralları (kullanıcının geri bildirimlerinden)

1. **Açılış sitenin kendisiyle:** İlk 30–40 saniye bizim 3D siteyi göster. Kutular, ürünler, tıklama ve telefon görünümü olsun. Sonra markayı kısaca tanıt ve şu anki sitesini göster: "Biz de bu markaya yakışan bir site yapmak istedik."
2. **Sürekli karşılaştırma yapma.** Eski site sadece girişte bir kez görünür.
3. **Nasıl yaptığımızı sıra sıra anlat.** "Claude ile konuşarak" yaptığımızı göster ama yazışma ekranı en fazla 2 kısa anda olsun. Fazlası sıkıyor. Anlatılan şey ekranda görsel olarak görünsün: site kaydı, ürün, sahne.
4. **Boş bilgi yok, detaya girme.** "Çömlekçi çarkı gibi" benzetmeler olmasın. Malzeme ayrıntısı (yivli mermer, pirinç başlık) olmasın. "Şık bir kaide" yeter.
5. **Fiyat ve kazanç rakamı verme.** Teklif dosyasını ekranda gösterme. Para kısmında sadece mantığı anlat:
   - fiyat kapsama göre değişir
   - kurulum + aylık bakım
   - ek işler
   - ödemeyi aşamalara böl
   - kazanç garantisi yok
6. **Yapı (bölüm sırası):**
   - açılış (site turu)
   - neden 3D?
   - "bu videoda 3 şey"
   - 8 adım (yol haritası kartıyla)
   - sen nasıl yaparsın (6 adım)
   - Claude ile ipuçları
   - hangi markalar, nerede bulunur
   - iş mantığı (rakamsız)
   - kurallar
   - sık sorulanlar
   - özet
   - "Sıradaki marka?"
7. **Süre ve hız:**
   - Seslendirme hızı 1.15, cümle arası 0.45 sn.
   - Sonra bütün video ve ses 1.25x hızlandırılır.
   - Final süresi 8–10 dakika. Bunun için hızlandırmadan önceki ses yaklaşık 640 sn olmalı (~125 cümle).
8. **Telaffuz (SAY sözlüğü):**
   - Claude → Klod
   - Netlify → Netlifay
   - BMW → bemeve
   - Instagram → İnstagram
   - Marka adları okunuşuyla yazılır (Turkish Coffee Lady → Törkiş Kofi Leydi).
9. **Uyum (her videoda):**
   - "Bağımsız konsept demo" notu
   - toplu mail yok
   - herkese açık adres
   - KVKK ve ticari ileti kuralları
   - kazanç garantisi yok
   - logo sadece o markaya teklif için
10. **Teslim:**
    - Müzikli ve müziksiz iki dosya.
    - İki geçişli x264, 1150k: yaklaşık 80 MB. Kullanıcının indirmesi ~345 MB'ta kopuyor, büyük dosya verme.
    - YouTube'a otomatik yükleme yok; kullanıcı kendisi yükler.
11. **Açıklama:**
    - İlk 2 satır aranan anahtar kelimelerle başlar.
    - Bölüm damgaları zaman çizelgesinden hesaplanır ve 1.25'e bölünür.
    - Sonra araçlar, hazır prompt, uyum notu, yorum sorusu, hashtag ve etiketler gelir.
    - Şablon: `sablon/ACIKLAMA_SABLONU.txt`.
12. **Thumbnail:**
    - Anton yazı, turuncu etiket, laptop veya ürün kesiti, karga avatarı.
    - 2–3 kelime, videoya cevap veren merak cümlesi.
    - Fiyat yazma.
13. **Görüntü kaynağı:**
    - Kullanıcının kendi ekran kayıtları her zaman önceliklidir. Google Drive linkiyle gelir; kullanıcının Windows bilgisayarına erişilemiyor.
    - Masaüstü kaydında site alanı y=152–1020; mobil kayıtta x=40–394 kırpılır.

## Tarih animasyonları (Seri A)
- **Gerçekçilik şart:** Kullanıcı düz, çizim tarzı haritayı "çok kalitesiz" buldu.
  - Motor: `projeler/turkler-anadolu/{arazi,sinema}.py`. Gerçek yükseklik verisi, eğik kamera, atmosfer.
  - Kodla ve ücretsiz yapılır; yapay zekâ görüntü servisi kullanılmaz (kullanıcının seçimi).
- **Tarih doğruluğu:**
  - Tarihleri yaygın kabul gören bilgilerle sınırla.
  - Tartışmalı yerde "kaynaklara göre" / "rivayete göre" de.
  - Yaş, tarih gibi bilgileri hesapla. Örnek hata: Fatih 1451'de 18 yaşındaydı, 19 değil.
- **Tanıtım videoları** animasyonların tamamını anlatmaz: kısa fragman + kanal nasıl açılır ve sürdürülür.
- **Çizgi film tarzı (kullanıcı onayladı):** Kalın çizgi, düz renk, konuşan karakterler (Fatih, yeniçeri). Kodla ve ücretsiz. Yarı gerçekçi yüzler kodla olmaz; temiz çizgi film yüzü kullan. Her karakterin kendi sesi, ağız sese bağlı. Kod: `projeler/tarzlar/{cizgi,karakter,sahne_fatih}.py`.
- **Kullanıcı tek kare/hareketsiz tasarımları "slayt gibi" buldu:** Her tarz gerçekten hareketli olmalı.
- **Sadece savaş haritası değil:** Kullanıcı her şeyin harita/savaş olmasını eleştirdi. Çöp adam, beyaz tahta ve veri animasyonu da kullan (`projeler/tarzlar/`). Ana tarz tek olsun; diğerleri özellikle kısa videolarda.
- **Açıklamaya kaynak yaz:** Natural Earth (kamu malı), Mapzen/Tilezen Terrain Tiles (AWS Open Data).

## Araçlar (`arac/`)

| Yol | Ne yapar |
|---|---|
| `arac/vid/akis_core.py` | Akış stili çizim çekirdeği (skia): palet, ikonlar, kamera, alt yazı |
| `arac/tclv/render_tcl.py` | Son bölümün (Turkish Coffee Lady v4) render motoru. Yeni bölüm için kopyala. |
| `arac/tclv/script.py` | Örnek metin: `(cümle, "alt *yazı*", (sahne, parametre))` |
| `arac/tclv/tts_xi.py` | ElevenLabs seslendirme + `tts/timeline.json` |
| `arac/vid/rec2.js`, `rec2m.js` | Siteyi ağır çekimde kaydeder (masaüstü / mobil) |
| `arac/vid/thumb*.py` | Thumbnail üreticileri (`thumb8_tcl.py` en yenisi) |
| `arac/short/render_short.py` | 1080×1920 Shorts motoru (tarayıcı çerçeveli klip, büyük alt yazı, "TAM VİDEO ↓") |
| `arac/vid/karga/karga-edit/` | Kanal görselleri, karga avatarı, kapanış, stil rehberleri |

Sahne türleri:
- **Görüntü:** clip (ad:saniye), full, shot, phone (@klip:saniye), ab (önce/sonra), labels, flash
- **Anlatım kartları:** talk (sohbet), howto2 (8 adımlık yol haritası), howto, list (LISTS sözlüğü), qa (QAS), pipe, bug, loop, rstats, three
- **Satış ve kapanış:** netlify, mail, price, sell, follow, rules, targets, montage, comment

### Üretim adımları

```bash
# 1) Yeni bölüm klasörü
cp -r kanal/arac/tclv kanal/arac/<marka>v && cd kanal/arac/<marka>v
# img/ ve clips_u/ klasörlerine bölümün görsellerini ve kayıtlarını koy (depoya girmez)
# 2) Metni yaz: script.py   3) Seslendirme (anahtar ortam değişkeninde)
ELEVENLABS_API_KEY=... python3 tts_xi.py
# 4) Kontrol kareleri
python3 render_tcl.py stills 12.5 40.0 ...
# 5) Tam render (out/ altına, müzikli ses dahil)
python3 render_tcl.py render 4
# 6) 1.25x hızlandır + sıkıştır
cd out && ffmpeg -i TurkishCoffeeLady_v4.mp4 -an -vf "setpts=PTS/1.25,fps=30" -c:v libx264 -preset slow -b:v 1150k -maxrate 3500k -bufsize 7000k -pass 1 -f null /dev/null
ffmpeg -i TurkishCoffeeLady_v4.mp4 -an -vf "setpts=PTS/1.25,fps=30" -c:v libx264 -preset slow -b:v 1150k -maxrate 3500k -bufsize 7000k -pass 2 -pix_fmt yuv420p v.mp4
ffmpeg -i v.mp4 -i ses_muzikli.wav -map 0:v -map 1:a -af atempo=1.25 -c:v copy -c:a aac -b:a 128k -shortest -movflags +faststart final_muzikli.mp4
```

Bilinen tuzaklar:
- Kod değişince eski `out/part_*.done` parçaları yeniden kullanılır. Render'dan önce sil.
- Skia yüzeyi kRGBA_8888 olmalı, yoksa renkler ters çıkar.
- Türkçe büyük harf için `tr_up` (i→İ, ı→I) kullan.
- Ağır WebGL sitesi headless kayıtta takılıyorsa kullanıcıdan ekran kaydı iste.
- YouTube'dan veri çekerken bot korumasını aşmaya çalışma. Video metni gerekiyorsa kullanıcıdan iste.

### Gizli bilgiler
- **ElevenLabs anahtarı:**
  - Depoya asla girmez.
  - `ELEVENLABS_API_KEY` ortam değişkeninde (bulut ortamında "environment secret") ya da çalışma klasörünün bir üstündeki `.xi` dosyasında durur.
  - Ses: Berkay (`KTXKO43nOuyC5Akqu7yX`), model `eleven_v4`, dil `tr`.
- **Bölüm görselleri:**
  - Demo siteler ve satış görselleri `origin/claude/charming-dirac-aq3a53` dalındadır: `demolar/<marka>`, `satis/<marka>-gorseller/`, `satis/<marka>-mail.md`, `demo-fabrikasi/markalar/<marka>*`.
