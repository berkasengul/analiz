# Kanal serileri

Haftada en az 2 bölüm, otomatik görevle (13:17 İstanbul):
- **Pazartesi: "Claude ile Yaptım".** Claude ile yapabildiğimiz her şey: oyun, uygulama, araç, animasyon. Planı aşağıda.
- **Perşembe: "Claude ile 3D Site".** Bir marka, bir 3D demo site.

Her bölümde bir uzun video (8–10 dk, 1.25x) ve bir Shorts olur.

## Seri A: "Claude ile Yaptım" (pazartesi)

Web sitesi dışında Claude ile yapabildiğimiz her şey: oyun, uygulama, araç, animasyon. Oyunlar ve uygulamalar sırayla gelir. İlham: başka kanalların "Claude'a GTA İstanbul yaptırdım" tarzı videoları.

Araştırmaya göre en çok izlenen formatlar:
- "Tek prompt / 1 saat / 1 gün" evrimi (aynı proje gittikçe büyür)
- "Claude'a sıfırdan … yaptırdım" denemesi
- Kodla çizilmiş animasyonlu anlatım (Claude yapımı 2 dk'lık bir tarih animasyonu X'te ~15 milyon izlendi)
- Kod bilmeyen birinin kendi işine yarayan uygulaması

Kurallar:
- Başkasının ürününün ya da var olan bir oyunun kopyası yapılmaz. İsim, karakter, harita, logo ve müzik alınmaz. Tür aynı olabilir (ör. "İstanbul'da açık dünya"), ama oyun bizim olur. Claude Code da birebir oyun kopyasını reddeder.
- Gerçek kişi, kurum ya da marka adına sahte bir şey üretilmez.
- Kişisel veri işleyen uygulamada KVKK notu olur.
- Oyunlar tarayıcıda çalışır (three.js / canvas). Oynanış kaydı Playwright ile otomatik girdiyle alınır.
- Video yapısı:
  1. İlk 30 sn bitmiş projenin en çarpıcı anı
  2. Tek promptla ilk sürüm
  3. Adım adım büyüme (Claude'a ne dedim, ne değişti)
  4. Son hali
  5. "Sen de yap" (hazır prompt açıklamada)
  6. "Bunu bir işe nasıl çevirirsin" (rakam yok)
  7. "Sıradaki ne olsun?"
- Süre ve hız kuralları 3D site serisiyle aynı (1.25x, 8–10 dk).

| Sıra | Tür | Proje | Kanca / başlık fikri |
|---|---|---|---|
| A1 | Oyun | **İstanbul açık dünya oyunu** (özgün): Boğaz köprüsü, sarı taksi, vapur, gece ışıkları | "Claude'a İstanbul'da geçen açık dünya oyunu yaptırdım: tek prompt vs 1 gün" |
| A2 | Uygulama | **Bu kanalın video motoru:** metin → ses → animasyon → video, tek komut | "Bu videoyu bile Claude yaptı" |
| A3 | Oyun | **Tavla:** yapay zekâya karşı, 3D zar, mahalle kahvesi sahnesi | "Claude'a tavla yaptırdım, sonra onu yenmeye çalıştım" |
| A4 | Animasyon | **Kodla tarih anlatımı:** "İstanbul'un 2.700 yılı, 3 dakikada" | "Bu animasyonu Claude kodla çizdi" |
| A5 | Uygulama | **Kuaför / berber randevu uygulaması** | "Kod bilmeden randevu uygulaması yaptım" |
| A6 | Oyun | **Çay ocağı işletme oyunu** (idle/tycoon) | "Claude'a çay ocağı oyunu yaptırdım" |
| A7 | Uygulama | **Restoran QR menü sistemi** | "Claude ile 1 günde QR menü sistemi" |
| A8 | Oyun | **Dolmuş şoförü simülatörü** | "Claude ile dolmuş simülatörü yaptım" |
| A9 | Uygulama | **Canlı deprem ve hava durumu haritası** (açık verilerle) | "Claude'a canlı deprem haritası yaptırdım" |
| A10 | Oyun | **Kapadokya balon uçuşu** | "Kod bilmeden 3D balon oyunu" |
| A11 | Uygulama | **Harcama bölüşme / ev arkadaşı uygulaması** | "Kod bilmeden telefon uygulaması yaptım" |
| A12 | Uygulama | **Excel'den otomatik aylık rapor** | "Saatlerce süren Excel işini Claude'a yaptırdım" |
| A13 | Uygulama | **Instagram gönderi üretici** | "Claude ile kendi Canva'mı yaptım" |
| A14 | Oyun | **Penaltı / mahalle maçı** (gerçek kulüp yok) | "Claude'a futbol oyunu yaptırdım" |
| A15 | 3D | **Kendi mahallemin 3D maketi** (izleyici isteğiyle) | "Mahallemi Claude'a 3D yaptırdım" |

Her 4–5 bölümde bir yorumlardan gelen "bunu yap" isteğiyle bölüm yapılır.

## Seri B: "Claude ile 3D Site" (perşembe)

Demolar hazır, `origin/claude/charming-dirac-aq3a53` dalında: `demolar/<marka>` ve `satis/<marka>-mail.md`. Yeni bölüme başlamadan önce demonun canlı linkini ve ekran kaydını hazırla. Mümkünse kaydı kullanıcı çeksin.

### Yayınlanan / hazır bölümler

| # | Bölüm | Dosyalar (`video_teslim/`) | Not |
|---|---|---|---|
| 1 | SESA KIDS: 3D pijama mağazası | SESA v3, SESA Shorts + kapak | çocuk pijama, Tripo 3D model |
| 2 | Garden Motors: 3D oto galeri showroom | GardenMotors_v2_*, GARDEN_ACIKLAMA.txt, Garden Shorts | Blender ışık pişirme, kullanıcı kaydı |
| 3 | Turkish Coffee Lady: 3D kahve kutusu lansman sitesi | TurkishCoffeeLady_v4_*, TURKISH_COFFEE_v4_ACIKLAMA.txt, TCL_T4 thumbnail | Kurallar listesinin son hali bu bölümde oturdu |

### Sıradaki bölümler (öneri sırası)

Türk izleyici için önce Türk markaları, sonra görsel olarak en çarpıcı olanlar. Her satırdaki kanca, demonun commit notlarından alındı. Videodan önce demoyu açıp doğrula.

| Sıra | Marka (demo klasörü) | Kanca / öne çıkan sahne | Shorts fikri |
|---|---|---|---|
| 4 | Nishane (`nishane`) | Türk niş parfüm; 3D sarnıç sahnesi, her ürüne özel renk | "Bu parfüm sarnıçta duruyor" |
| 5 | Haremlique (`haremlique`) | Kapaklı mum: kapak kalkıp kaideye iniyor, mum kendiliğinden tutuşuyor | Kapak kalkış anı |
| 6 | LA FANN (`lafann`) | Kokulu mum + parfüm, canlı alev ve duman, fon müziği | Alevin yandığı an |
| 7 | MISK+ANBER (`miskanber`) | Niş parfüm + mum, sprey efekti ve canlı alev | Sprey anı |
| 8 | Drops Parfumerie (`drops`) | 12 extrait, dalgalı duvarlı butik | Butik içinde gezinti |
| 9 | Zoologist (`zoologist`) | Ürün renginde tek renkli premium fon, 4 ürünlü akış | Renk değişimi |
| 10 | Imaginary Authors (`imaginary`) | Aynı akış, edebi marka dili | Kitap gibi parfüm |
| 11 | UnBe. (`unbe`) | No Collection, koku bulucu (gerçek sorular) | "Hangi koku sensin?" testi |
| 12+ | joure, illusione, lalive, mardini, turkan, pekji, cakir, regalien, seven-gates… | Kancalarını `git log` ve `satis/<marka>-mail.md` dosyasından çıkar | — |

Alternatif format (her 3–4 bölümde bir): "1 saatte 3 marka" hızlı derleme ya da "izleyicinin istediği marka" (yorumlardan seçilir).

## Haftalık akış (otomatik)

Her pazartesi ve perşembe yeni bir oturum açılır ve o günün serisindeki sıradaki bölümü baştan sona hazırlar:
1. Bölümü seç.
2. Projeyi kur ya da demoyu çalıştır. Ekran/oynanış kaydını kendin al; kullanıcıdan kayıt isteme.
3. Metni yaz, seslendir, render et, 1.25x hızlandır.
4. Açıklamayı, 3 başlığı, 3 thumbnail'i ve Shorts'u hazırla.
5. Hepsini kullanıcıya gönder. `SERI.md`'yi güncelle ve depoya gönder.

Kullanıcı videoyu yükler, başlığı ve thumbnail'i seçer. Yorumlardaki istekleri topla.
