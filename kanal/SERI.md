# Kanal serileri

Haftada en az 2 bölüm, otomatik görevle (13:17 İstanbul):
- **Pazartesi: "Claude ile Yaptım".** Oyun, uygulama, animasyon; web sitesi dışında her şey. Planı aşağıda.
- **Perşembe: "Claude ile 3D Site".** Bir marka, bir 3D demo site.

Her bölümde bir uzun video (8–10 dk, 1.25x) ve bir Shorts olur.

## Seri A: "Claude ile Yaptım" (pazartesi)

Araştırmaya göre en çok izlenen formatlar:
- "Tek prompt / 1 saat / 1 gün" evrimi (aynı proje gittikçe büyür)
- "Claude'a sıfırdan … yaptırdım" denemesi
- Kodla çizilmiş animasyonlu anlatım (Claude yapımı 2 dk'lık bir tarih animasyonu X'te ~15 milyon izlendi)
- Kod bilmeyen birinin kendi işine yarayan uygulaması

Kurallar:
- **Var olan bir oyunun kopyası yapılmaz.** İsim, karakter, harita, logo ve müzik alınmaz. Tür aynı olabilir, oyun bizim olur. (Claude Code da birebir kopyayı reddeder.)
- Gerçek kulüp, marka ve ünlü logosu kullanılmaz.
- Proje tarayıcıda çalışır (three.js / canvas). Oynanış kaydı Playwright ile otomatik girdiyle alınır.
- Video yapısı:
  1. İlk 30 sn bitmiş projenin en çarpıcı anı
  2. Tek promptla ilk sürüm (çoğu zaman komik derecede kötü)
  3. Adım adım büyüme (Claude'a ne dedim, ne değişti)
  4. Son hali
  5. "Sen de yap" (hazır prompt açıklamada)
  6. "Sıradaki ne olsun?"
- Süre ve hız kuralları 3D site serisiyle aynı (1.25x, 8–10 dk). Uygun yerde "Bunu bir işe nasıl çevirirsin" eklenir; rakam verilmez.

| Sıra | Proje | Kanca / başlık fikri |
|---|---|---|
| A1 | **İstanbul açık dünya oyunu** (özgün): Boğaz köprüsü, sarı taksi, vapur, dolmuş, gece ışıkları | "Claude'a İstanbul'da geçen açık dünya oyunu yaptırdım: tek prompt vs 1 gün" |
| A2 | **Tavla:** yapay zekâya karşı, 3D zar, mahalle kahvesi sahnesi | "Claude'a tavla yaptırdım, sonra onu yenmeye çalıştım" |
| A3 | **Kodla animasyonlu tarih anlatımı:** "İstanbul'un 2.700 yılı, 3 dakikada" | "Bu animasyonu Claude kodla çizdi" |
| A4 | **Çay ocağı işletme oyunu** (idle/tycoon): simit, çay, müşteri, dükkânı büyüt | "Claude'a çay ocağı oyunu yaptırdım, bağımlılık yaptı" |
| A5 | **Dolmuş şoförü simülatörü:** durak, yolcu, "inecek var" | "Claude ile dolmuş simülatörü yaptım" |
| A6 | **Kapadokya balon uçuşu:** gün doğumu, peri bacaları, rüzgârla yön | "Kod bilmeden 3D balon oyunu" |
| A7 | **Kişisel uygulama:** market fiyat karşılaştırma / ders programı / harcama bölüşme | "Kod bilmeden 1 günde telefon uygulaması yaptım" |
| A8 | **Penaltı / mahalle maçı oyunu** (gerçek kulüp yok) | "Claude'a futbol oyunu yaptırdım" |
| A9 | **Kendi mahallemin 3D maketi** (izleyici isteğiyle) | "Mahallemi Claude'a 3D yaptırdım" |

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
2. Projeyi kur ya da demoyu çalıştır. Ekran ve oynanış kaydını kendin al; kullanıcıdan kayıt isteme.
3. Metni yaz, seslendir, render et, 1.25x hızlandır.
4. Açıklamayı, 3 başlığı, 3 thumbnail'i ve Shorts'u hazırla.
5. Hepsini kullanıcıya gönder. `SERI.md`'yi güncelle ve depoya gönder.

Kullanıcı videoyu yükler, başlığı ve thumbnail'i seçer. Yorumlardaki istekleri topla.
