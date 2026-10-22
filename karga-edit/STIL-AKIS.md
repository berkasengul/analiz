# Karga Zihni: "Akış" stili (v3)

Referans: Efe Cpp, "Kendi Kendine Çalışan Bir Yapay Zeka Şirketi Kurdum" (110 sn, telefondan ekran kaydı olarak incelendi).
Motor: `render_akis.py` (skia ile çizim, 60 fps).

## 1. Referansın analizi (ölçülen)

| Ölçüm | Değer | Ne demek |
|---|---|---|
| Sert kesme sayısı | **4** (110 sn içinde: 3.9 s, 36.5 s karartma, 37.8 s, 99.3 s kapanış) | Video tek bir sürekli plan gibi akıyor. Kesmek yerine kamera hareket ediyor. |
| Yeni görsel öğe sıklığı | Yaklaşık **her 0,8–1,2 sn**'de bir | Göz sürekli yeni bir şey görüyor. Sahne değişmiyor, sahneye bir şey ekleniyor. |
| Büyük kamera hareketi | 9 tane (7 s, 16 s, 22 s, 43–46 s, 54 s, 78 s, 99 s) | Sakin bölümlerin arasına yerleştirilmiş hızlı hareketler: tempo dalgalanıyor. |
| Hareket şiddeti | Zamanın %70'inde çok düşük (yalnızca tek bir öğe hareket ediyor) | Ekran sakin. Hareket yalnızca anlatılan şeyde oluyor. |
| Senkron | Her öğe, adı söylendiği anda beliriyor ("bir CEO, bir araştırmacı…") | Görüntü anlatımın altyazısı gibi çalışıyor, ayrıca altyazıya gerek kalmıyor. |

### Görsel dil
- **Zemin:** Açık lavanta beyazı, ortası daha aydınlık radyal geçiş. Doku ya da desen yok.
- **Renk:** Tek vurgu rengi (indigo), koyu lacivert üst düğüm, açık indigo bağlantı çizgileri.
- **Tipografi:** Sıkı aralıklı, kalın ve siyah bir sans serif. Anahtar kelimeler **italik serif** ve vurgu renginde
  ("Şirket *kurma* mantığı", "takip etmek *zorlaşıyor.*").
- **Kartlar:** Beyaz, büyük köşe yarıçaplı, çok yumuşak ve geniş gölgeli. Hiç çerçeve çizgisi yok.

### Hareketler (tekrar eden 8 kalıp)
1. **Blur-in:** Öğe bulanık, saydam ve %6 büyük başlar. 0,45–0,55 sn'de netleşir ve yerine oturur (ease-out).
   Yazı **kelime kelime**, söylendiği anda gelir. Satır baştan son haline göre dizilmiştir; kelimeler yerinde belirir.
2. **Blur-out:** Çıkışta bütün satır birlikte bulanıklaşıp söner (0,3 sn).
3. **Çizilen çizgi:** Bağlantı çizgisi merkezden dışa doğru uzar. Ucunda parlayan küçük bir nokta vardır.
   Çizgi bir düğüme ulaştığında düğüm blur-in ile belirir.
4. **Kendini düzenleyen yerleşim:** Yeni düğüm gelince eskiler yumuşakça kayarak yeniden ortalanır.
5. **Odak geçişi (rack focus):** Önemli bir cümle gelince arkadaki diyagram bulanıklaşır ve açılır. Cümle ekranda tek başına kalır.
6. **Kamera:** Tek bir sonsuz tuval vardır. Kamera bir diyagramdan diğerine kayar (ease-in-out, kayarken hareket bulanıklığı),
   bir alt dala yakınlaşır ya da bir cihazın ekranının içine girer.
7. **Arayüz taklidi:** Açılır kart ("CEO karar bekliyor"), animasyonlu imleç, basılan buton ve onay işareti.
8. **Karartma:** Bölümler arasında 1 sn'lik siyah ve ardından "Bölüm 1: *Paperclip nedir?*".

Kapanış: Kanal sayfası karartılır ve bulanıklaşır. Önce yuvarlak avatar zıplayarak gelir, sonra bir hap şeklinde sağa açılır
(beğen, beğenme, Abone Ol, zil). İmleç sırayla tıklar: beğen → "Abone Olundu" → zil sallanır. Sonra hap kapanır.

## 2. Karga Zihni'ye uyarlama

| Referans | Karga Zihni karşılığı |
|---|---|
| Lavanta beyazı zemin | Sıcak kırık beyaz `#F6F4EF`, kenarları `#EAE6DE` (krem kanal kimliğiyle uyumlu) |
| İndigo vurgu | Atkı turuncusu `#FF741E` (düğümler, butonlar); yazı için koyu turuncu `#E2560A` |
| Lacivert CEO düğümü | Karga lacivert `#1A1F36` (üst düğümler, firmalar) |
| Açık indigo çizgiler | Şeftali `#FFC09A` |
| Sans | **Inter Tight** ExtraBold (800), harf aralığı −%1,2 |
| İtalik serif | **Instrument Serif Italic**, sans boyutunun 1,2 katı |
| "efe" avatarı | Turuncu zeminli karga profil fotoğrafı |
| Kırmızı "Abone Ol" | Turuncu "Abone Ol" → bej "Abone Olundu" |
| Kapanış | Sonunda "kuşlar seni bekliyor, *uç.*" |

Fark olarak eklenenler (referansta yok, bizim kanal için gerekli):
- **Ekran kaydı tarayıcı penceresinde.** Kamera pencerenin içine girer (adres çubuğu `gardenmotor.netlify.app` yazılırken).
  Sonra pencere küçülüp diyagramın merkez kartına dönüşür (eşleşen geçiş).
- **Bilgi hapları:** Ekran kaydı oynarken altta beliren, ikonlu kısa etiketler ("Kapıdan içeri gir").
- **Çok hafif film greni:** Açık zeminde renk bantlaşmasını engeller.
- **Silik nokta ızgarası:** Dünyayla birlikte kayar, böylece kamera hareketi hissedilir.

## 3. Kurallar (yeni video kurarken)
1. Her cümleye **bir görsel olay** düşmeli: bir kelime, bir düğüm, bir kart ya da bir kamera hareketi. 2 sn'den uzun boşluk olmamalı.
2. Bir satırda en fazla **4 kelime**. Cümlenin anahtar kelimesi italik turuncu, kalanı kalın lacivert.
3. Görüntüde kesme olmamalı. Yeni konu = kamera başka bir tuval bölgesine kayar. Yeni bölüm = karartma.
4. Aynı anda yalnızca **bir şey** hareket etmeli. Kamera hareket ediyorsa öğeler sabit durmalı.
5. Süreler: görünme 0,45–0,55 sn, kaybolma 0,3 sn, kamera kayması 0,6–0,9 sn, karartma 0,9 sn.
6. Ekran kaydı her zaman bir çerçevenin (tarayıcı, laptop) içinde durmalı ve dünyada bir yeri olmalı.
7. Ses: düğüm başına yumuşak "pop", tıklamada click, adım tamamlanınca kısa zil.
   Müzik konuşmanın altında %60 kısılmalı. Whoosh, darbe (boom) ve riser gibi gürültü tabanlı efektler kullanılmaz: patlama gibi duyuluyor.

## 4. Motor (`render_akis.py`)

Yapı taşları:

| Fonksiyon | Ne yapar |
|---|---|
| `appear(t, t0, dur, t1)` | Görünme/kaybolma durumunu verir: (saydamlık, bulanıklık, kayma, ölçek) |
| `fx(c, st, px, py, bounds)` | Durumu bir çizim grubuna uygular (skia `saveLayer` + blur) |
| `line(c, t, [(kelime, 'b'/'i', zaman)], x, y, boyut, t1)` | Kelime kelime yazı |
| `node(...)`, `grow(...)` | Düğüm, uzayan çizgi |
| `card(...)`, `cursor(...)` | Gölgeli kart, tıklayan imleç |
| `CAM = [(t, x, y, zoom), ...]` | Kamera anahtar kareleri (hareket bulanıklığı otomatik) |
| `FOCUS = [(t0, t1)]` | Odak geçişi aralıkları |
| `sfx(t, tür, kazanç)` | Ses efektini görüntüyle aynı yerde işaretler |

Zamanlar `transcribe.py` çıktısındaki kelime zamanlarından alınır. Yeni video için:
`transcript.json` içinden kelime zamanlarını okuyun, sahne fonksiyonlarındaki zamanları ve metinleri değiştirin.

```
pip install skia-python numpy pillow     # Linux'ta: apt-get install libegl1
python3 -I render_akis.py <varlik_klasoru> stills 3.6 22.6 31.1   # kontrol kareleri
python3 -I render_akis.py <varlik_klasoru> render 4                # tam video (4 çekirdek)
```

Demo: 3D Showroom videosunun ilk 46 sn'si (anlatım aynen korunur) ve 7 sn'lik abone kapanışı, toplam 53,6 sn.
