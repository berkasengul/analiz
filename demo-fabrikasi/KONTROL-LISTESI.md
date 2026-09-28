# Demo kontrol listesi

Her demo markaya gönderilmeden önce bu liste baştan sona kontrol edilir. Liste,
önceki demolarda yaptığımız hatalardan çıkarıldı; yeni bir hata bulunca aşağıdaki
"Hata günlüğü"ne ekle ve listeye bir madde olarak yaz.

## 1. Ürün ve ambalaj

- [ ] Ambalaj markanın gerçek ürün fotoğrafına göre yapıldı mı? (biçim, renk, kapak, etiket düzeni)
- [ ] Fotoğrafı olmayan ürünler sayfadaki notta "temsili" diye belirtildi mi?
- [ ] Fotoğrafı olan ürünlerde gerçek fotoğraflar detay galerisinde ve kartta görünüyor mu?
- [ ] Her ürün farklı mı görünüyor? (aynı etiketin rengi değişmiş kopyası değil, gerçekteki farklar)
- [ ] Arka yüz (koku piramidi / içerik) okunuyor mu?
- [ ] Logo ve yazı tipi markanınkine yakın mı?
- [ ] Etiket şişenin yüzeyine oturuyor mu (kenarlarda havada kalmıyor)? Açık renkli üründe yazılar ışıkta okunuyor mu?

## 2. Sahne ve renk

- [ ] Arka plan ışığı (`theme.glow`) ürünün ambalaj rengiyle uyumlu mu? (açık renk tüp → açık, sıcak ışık)
- [ ] Sektöre uymayan süsler kaldırıldı mı? (parfüm kristali kremde yok; `particles`, `crystals`)
- [ ] Arka plandaki bulanık manzara anlamlı mı? Etiketteki yazılar görünüyorsa `backdrop: false`.
- [ ] Marka simgesi (başlık, yükleme ekranı, favicon) sektöre uygun mu? (`icon`)

## 3. Yazılar

- [ ] Menü ve düğmeler sektöre göre mi? ("Kokular" / "Ürünler", "Şişeyi keşfet" / "Ürünü keşfet")
- [ ] Türkçe büyük harf hataları yok mu? ("HOPE İN", "EXTRAİT", "KREMI" gibi) İngilizce adlar `lang="en"`, Türkçe adlar `nameLang: "tr"`.
- [ ] İngilizce modda ürün adları İngilizce mi? (`products[].en.name`)
- [ ] Başka markadan kalan yazı var mı? (slogan, kayan bant, SSS, yükleme yazısı, sepet adı)
- [ ] Zaman çizelgesinde aynı yıl iki kez geçmiyor mu? (tekrar eden anahtar hatası)

## 4. Doğruluk

- [ ] Her bilgi bir kaynaktan mı? (kuruluş yılı, kurucu, notalar, fiyat, satış noktaları)
- [ ] Uydurma müşteri yorumu, basın alıntısı ya da rakam yok.
- [ ] Emin olunmayan bilgi (kurucunun annesi, parfümör adı vb.) yazılmadı ya da yumuşatıldı.
- [ ] Instagram ve web adresleri doğrulandı mı? Doğrulanmadıysa gizli (`null`).

## 5. Mağaza

- [ ] Fiyatlar ürün bazında mı? (`products[].price`) Farklı ürünler aynı fiyatta görünmüyor.
- [ ] Set fiyatları yuvarlak mı? (₺1.690, ₺1.691 değil) Kuruşsuz mu? (₺890, ₺890,00 değil)
- [ ] Ücretsiz seçenekler "Ücretsiz" yazıyor mu? (hediye kutusu fiyat tekrar etmiyor)
- [ ] Sepete ekleme, adet değiştirme ve ücretsiz kargo eşiği doğru mu?

## 6. Teknik

- [ ] Tarayıcı konsolunda hata yok.
- [ ] Tıklamalar gerçek fare/dokunma ile test edildi (kodla `.click()` yetmez; `pointer-events` hatalarını gizler).
- [ ] Ek sayfalar (ör. `#/urunler`) doğrudan linkle açılınca yükleme ekranı kapanıyor mu? Oradan ana sayfaya dönünce bütün bölümler görünüyor mu?
- [ ] Her kategori sayfası (`#/urunler/<kategori>`) 3B akışla açılıyor; kategori değiştirince ve ana sayfaya dönünce sepet korunuyor.
- [ ] Masaüstü ve telefon: ana sayfa, detay, 4 hikâye kartı, ritüel, mağaza, sepet, hikâye, SSS.
- [ ] Telefonda detay kartı ürünü kapatmıyor; içerik açıklaması dokununca çıkıyor.
- [ ] Netlify zip güncel (`yeni-demo.py` en son çalıştırıldı), `noindex` var.

## Hata günlüğü

| Demo | Hata | Nasıl düzeldi / önlem |
|---|---|---|
| TCL | Ürün şişe diye çizildi, gerçekte ince kutu | Önce ürün fotoğrafı iste; ambalaj fotoğrafa göre |
| TCL | Kutu yazıları fotoğraftakine benzemiyordu | Etiketi fotoğraftan birebir çiz |
| Hope | Tüm şişeler aynı altın renkte çizildi | Her ürünün fotoğrafına bak; renkler ürün bazında |
| Hope | "HOPE İN A BOTTLE", "EXTRAİT" | İngilizce metinlerde `lang="en"` |
| Hope | Sayfa yazıları ürünle ilgisizdi | İçerik markanın kendi metinlerinden |
| Lalive | Arka planda etiket yazıları bulanık göründü | `backdrop: false` |
| Lalive | Güneş kremi fildişi, arka plan kahverengi | `theme.glow` ambalaj renginden |
| Lalive | "GÜNEŞ KREMI" (Türkçe İ yok) | `nameLang: "tr"` |
| Lalive | Kremde parfüm kristalleri, şişe ikonu | `particles: "leaves"`, kristaller kapalı, `icon: "leaf"` |
| Lalive | Tüm ürünler aynı fiyat, ₺1.691,00 | Ürün bazlı fiyat, yuvarlama, kuruşsuz gösterim |
| Lalive | Hediye kutusu ücretli sanılıyordu | "Ücretsiz" yazısı |
| Lalive | Katalog sayfasında kartlara tıklanamıyordu (`main` pointer-events) | Gerçek tıklama testi; `.catalog { pointer-events: auto }` |
| Lalive | `#/urunler` doğrudan açılınca yükleme ekranı kapanmıyordu | Katalog sayfası açılınca yükleme tamamlanır |
| Lalive | ₺1.333,9 (tek haneli kuruş) | Kuruşlu fiyatlar iki haneli |
| Lalive | Katalogdan ana sayfaya dönünce alt bölümler görünmez kalıyordu (`.reveal` yeniden izlenmiyordu) | Sayfa değişince görünme izleyicisi yeniden kurulur; dönüş testi eklendi |
| Lalive | "Ürünler" ve "Tüm ürünler" menüde karışıyordu; katalog başlığı menünün altında kalıyordu | Menü: "Öne çıkanlar" + "Kategoriler" açılır paneli; katalogda buzlu cam üst bant |
| Lalive | Kategori sayfasında üstteki kategori çubuğu ürünün tepesini kapattı | Masaüstünde kategoriler solda dikey dizin |
| Lalive | Sepette ürün numarası tutuluyordu; sayfalar farklı ürün seti gösterince yanlış ürün çıkardı | Sepet katalog kimliğiyle (`c:<id>`); eski sepetler dönüştürülür |
| Lalive | Az ürünlü kategoride sonsuz yay yan ürünleri gizliyordu | 5'ten az üründe ürünler yan yana düz sırada |
| Lalive | Etiketler yuvarlak şişenin önünde düz yama gibi duruyordu | Etiket gövdenin kavisine sarılır (`wrapLabelGeo`) |
| Lalive | Açık renkli ambalajlarda spot ışığı yazıları siliyordu; etiket parfüm gibi parlaktı | Işık ambalaj rengine göre kısılır; `labelFinish` ile mat kâğıt etiket |
| Lalive | Ürüne oturma, tekerleği yavaş çevirince kullanıcıyı geri çekiyordu | Oturma kaydırma yönünde ve kaydırma bittikten sonra |
| Lalive | 15 ürün fotoğrafsız, tahminle çizildi; basit görünüyordu | Marka sitesine erişim yoksa kullanıcıdan ürün sayfası fotoğrafları istenir; ilk ürün (Yüz Bakım Yağı) fotoğraftan birebir |
| Lalive | Fiyatlar eski arama sonuçlarındandı | Markanın ürün sayfasındaki güncel fiyatlar |
| Lalive | Kategori yuvarlak hacimde köşeli ürünler (mum, sabun) yastık gibi "X" gölgeli | Yuvarlak ürünlerde satır satır silindir kesiti; kalıp sabun ve kutular düz profil |
| Lalive | Kart görseli kesit fotoğrafı büyütüp kırpıyordu | Kesitli kartta görsel mutlak konumlu, `contain` |
| Lalive | Fotoğraftan şişirilen ürünler "ortadan yarılmış", kenarları tırtıklı, tüplerde yatay çizgiler | Yuvarlak ürün: silüetten dönen gövde + önden izdüşüm doku; düz ürün: kenar çizgisinden pahlı blok; arka fotoğrafı yoksa yazısız arka |
| Lalive | Aktarma tekrar çalışınca ana sayfa sırası kaydı; ritüelde fırça çıktı | Ana sayfanın ilk 6 ürünü sabit liste; ritüel kremlerle |
| Lalive | Başka renk seçeneğinin fotoğrafı arka yüz sanıldı | Arka fotoğraf rengi ön yüze yakın olmalı |
| Lalive | Setler kutulu fotoğrafın düz bloğuydu; kartta kutu ve zemin görünüyordu | Set içerikleri (`lalive-setler.json`) kendi ürünlerinden kurulur: her ürün ayrı 3B parça, kartta kutusuz |
| Lalive | Uzun ürünler ekranın tepesinden taştı, geniş ürünler dev, setler küçük | Ürünler ölçülüp benzer görsel alana getirilir (yükseklik/genişlik sınırı, setlere geniş alan) |
| Lalive | Ürün geçişinde grenli turuncu halka ucuz görünüyordu | Ürün renginde yumuşak ışık dalgası; her ürünün iki renkli kendi atmosferi |
| Lalive | Menüde numaralar ve "Ritüel" | Ürünler (görselli kategori vitrini), Setler, Hakkımızda, İletişim |
| Lalive | Uzun ürün adı iki satır olup ürünün üstüne bindi | Uzun adlarda küçük punto, tek satır |
| Lalive | Telefonda ürünlere çok ışık vuruyordu; arka yazılar parlamada kayboluyordu | Fotoğraflı ürünlerde ışığın bir kısmı fotoğrafın kendi rengiyle karışır (`u_unlit`, telefonda daha fazla); telefonda spot ışık yarıya iner |
| Lalive | Telefonda ürün detayı açılınca ürünün üstü/altı kesiliyordu | Telefon detay pozu küçük ve bilgi kartının üstünde; özellik pozları da bu alanda kalır |
| Lalive | Vücut yağı / yüz misti arkasında ön logonun hayaleti ve yatay şeritler | Arka yüz rengi ±%5 yükseklikteki piksellerin ortancasıyla; kenar bandı 28 px, bantta yazı pikselleri alınmaz |
| Lalive | Arka yüzü fotoğrafsız ürünlerde içerik yazısı yoktu ya da okunmuyordu | Markanın metninden arka etiket (ad, açıklama, özellikler, kullanım, hacim), gövdenin düz kısmında ortalı; sığmazsa önce metin kısalır |
| Lalive | Yükleme yazısı "Zeytinler toplanıyor" anlamsızdı; ana sayfa el kremiyle açılıyordu | "Doğal bakım ritüeliniz hazırlanıyor"; ana sayfa Bronzlaştırıcı Yağ ile açılır |
| Lalive | Yandan bakınca ön/arka birleşiminde dikiş çizgisi, ön fotoğrafın kenarı yana gerilmiş | Dönen gövdelerde ön ve arka yüzün kenar bandı ambalajın düz rengine geçer (`seal_front`) |
| Lalive | "Kategorilere göre gör →" sade bir linkti | Cam, ince altın çerçeveli "Tüm ürünleri keşfet" butonu (ürün/kategori sayısıyla) |
| Lalive | Kartlarda ürünün arkasında yeşil zemin; üzerine gelince kutulu, beyaz zeminli fotoğraf çıkıyordu | Kart sinematik stüdyo: koyu sıcak zemin, üstten spot, parlak zemin çizgisi, temas gölgesi, silik yansıma; ürün zeminde durur; kesilmiş ürünlerde üzerine gelince fotoğraf yok; ürünler sayfası zemini de nötr koyu |
| Lalive | Sitede ürün arama yoktu | Üst menüde büyüteç (ve "/", Ctrl/⌘+K): ad, kategori, içerik notları ve açıklamada Türkçe harfe duyarsız arama; kategori çipleri, klavyeyle gezinme, sonuç 3B akışta açılır. Test: `touchscreen.tap` ile (Playwright `tap` sürekli animasyonlu başlıkta bekleyip zaman aşımına düşebiliyor) |
| Lalive | Detayda "Diğer boyutlar" şablondaki paket bölümüne gidiyordu | "Benzer ürünler →": ana sayfada ürünün kategori sayfası, kategori sayfasında alttaki ürünler |
| Lalive | Mağaza ve sepette şablondan kalma uydurma koşullar (ikili/üçlü indirim, ücretsiz hediye kutusu, 1.500 ₺ ücretsiz kargo, 24 saatte kargo) | `commerce` ayarı: paket/paketleme/karışık set gizli; markanın gerçek koşulları (3.500 ₺ tote hediye, ~1 iş gününde kargo, 14 gün iade); kargo "ödemede hesaplanır" |
| Lalive | "Vegan · tüm ürünler" yanlıştı (at kılı fırça vegan değil) | Markanın SSS'sine göre: cruelty-free istatistiği, SSS'de doğru vegan cevabı; kargo/iade/üretim soruları markanın metninden |
| Lalive | İngilizce fiyatlar TL/40 ile uydurma dolar | Markanın İngilizce sitesi de TL: iki dilde aynı ₺ fiyat; dil düğmesi para birimini ayardan alır |
| Lalive | "Ödemeye geç" hiçbir yere gitmiyordu; sepette renk karesi ve "Standart kutu" | Shopify sepet bağlantısı (`/cart/<varyant>:<adet>`), çok seçenekli üründe seçenek menüsü; sepette ürün görseli |
| Lalive | Hero'da "Vücut & güneş · Vücut & güneş" tekrar | Alt yazı kategoriyle aynıysa yazılmaz |
| Lalive | Detayda uzun içerik geri butonunun altına giriyordu; yan ürünler siyah leke gibi kalıyordu | Metin bloğu güvenli ortalama; yan ürünler kararırken küçülüp kenara çekilir |
| Lalive | Kategori sayfasında sol dizin 3B ürünün üstüne biniyordu; beyaz kayan bant koyu sitede sırıtıyordu; telefonda satış noktası başlıkları kaymıştı | Dizin arkasında yumuşak karartma; bant koyu, ince altın çizgili; mobil tablo başlığı düzeltildi |
| Genel | Render'lar sandbox'ta yedek yazı tipiyle çıkıyordu | Render betiği Google Fonts isteklerini curl ile karşılar (`scratchpad/final.cjs` yöntemi) |
| Lalive | Uzun açıklamalı/uzun adlı ürünlerde detay metni ekrana sığmıyor, sepet butonu aşağıda kayboluyor ya da oklarla çakışıyordu | Açıklama cümle sonundan kısaltılır, uzun adlar küçük punto, en fazla 6 küçük görsel + "+N", kategori tekrarı çip gösterilmez; alçak ekranda sıkı düzen; yine sığmazsa panel kendi içinde kayar. 1366×700 ve 1900×850'de 16 üründe kaydırmasız doğrulandı |
| Lalive | Kullanıcının bilgisayarında galeri küçük görselleri kırık göründü (temiz kopyada tekrarlanamadı) | Yüklenemeyen küçük görsel gizlenir; Netlify dosyasında görseller içinde |
| Türkan | Beyaz şişe beyaz zeminde; zemin yansıması ürüne katılıyordu | Yapay zekâyla kesim (rembg isnet) + alttan yarı saydam/beyaza yakın satırları kesen yansıma temizliği |
| Türkan | Kapaksız ya da kutulu ön çekim "arka yüz" sanıldı | `foto.backPhotos: false`; aynı yüz korelasyon kontrolü (`same_face`) |
| Türkan | Küre kapak etiket alanına girdi, arka yazı küçüldü; "Kullanım"a yanlış paragraf düştü | Etiket alanı gövdenin kesintisiz en uzun bölümü; kullanım yalnızca "Kullanım Şekli" satırından |
| Türkan | Yassı şişe dönen gövde olunca silindir gibi görünüyordu | Yeni `flask` 3B biçimi: kapak dönen gövde, gövde pahlı blok (kalınlık genişliğe oranla) |
| Türkan | "EXTRAİT DE PARFUM", "HER KOKU BIR HIS": Türkçe/İngilizce büyük harf karışıyordu | `latinTerms` + `termLang`/`wordLang`: yabancı terimler lang="en", Türkçe harfli metin Türkçe |
| Türkan | İki set aynı adla görünüyordu; Lalive'dan kalma "tek bir doğal rutin" yazısı; boş "Görüldüğü yerler" | `aktar.rename` (markanın koleksiyon adları); `allTag` markaya taşındı; basın listesi boşsa bölüm gizli |
| Genel | Bütün demolar aynı şablonun renk değiştirilmiş hâliydi | `theme` sahne kimliği: yazı tipleri, vurgu rengi, parçacık, dev sayılar, açılış sahnesi, arayüz stili markaya özel (ilk: Türkan "portal") |
| Türkan | Kapı çizgisi ters ve eksik çiziliyordu (`pathLength` + `non-scaling-stroke`) | Gerçek çevre uzunluğuyla `strokeDasharray/offset` özniteliği |
| Türkan | Açılış sayacı her değişimde baştan animasyona girip görünmüyordu | Sayı sabit, yalnızca rakam kısa "tık" hareketiyle değişir; sayaç en az ~2,5 sn akar |
| Türkan | Tasarım hâlâ şablona benziyordu; ürün kartları sade; ışık düz | `carousel: "solo"` editoryal sahne, `pedestal`, `studio` ışık süpürmesi, `cards: "gallery"` ve `aktar.palette` ile ürün başına renk |
| Türkan | Yan şişeler başlığın ve nota listesinin üstüne biniyordu | Yanlar öndeki ürünün arkasında derinliğe dizilir; detayda tamamen kaybolur |
| Türkan | Kaide sette ürünün çok altında kalıyordu (kapak tornası fotoğrafın tüm boyunu kaplıyor) | Alt kenar yalnızca gövde hacminden ölçülür (`BOTTOM`), kaide ona oturur |
| Türkan | Sol kategori dizini uzun ürün adının üstüne biniyordu | Portal temasında kategori dizini üstte yatay ince satır |
| Türkan | Yan şişeler de ışıkta, öndeki ürün yeterince öne çıkmıyordu; huzme ürünün yanına düşüyordu | Solo sahnede yanlar neredeyse siyah silüet (ince renkli kenar ışığı); huzme ve ışık havuzu öndeki ürünün ekrandaki yerine hizalı, çevre kararır (`u_studio`) |
| Türkan | Ana sayfada 8 ürün kaydırılıyordu, alt bölüme geç iniliyordu | `aktar.home` 4 koku (Ritüel'deki üçü dahil); 3+ ürünlü solo sahnede halka düzeni (iki yanda silüet) |
| Türkan | Ritüel'e geçince nota listesi (fixed) ve kaide ekranda kalıyordu | Nota listesi HUD içinde absolute; kaide sahne dağılırken hızla söner |
| Türkan | Telefonda tek ürün görünüyordu; yan ürünler karanlıkta hiç seçilmiyordu | Telefonda yanlar ekranın kenarından yarım görünür; yanlar loş (%24 ışık) ve renkli kenar ışıklı |
| Türkan | Zemine denenen baklava kabartma "çikolata" gibi durdu (istenen: hafif karartma) | Kabartma tamamen kaldırıldı; zemin ürünün renginde, kenarlara doğru hafif kararır (telefonda da) |
| Türkan | Ürün zeminlerinde kahverengi tonu baskındı | `aktar.palette` notalara göre canlı renkler (+ kenar rengi); site Floraison'la, markanın seçtiği gül-mürdüm tonunda açılır |
| Türkan | Telefonda ürün sayfasında şişe küçük, yazı kartı üstüne biniyordu | Telefonda şişe ekranın üst yarısını doldurur; kart kısa (2 satır açıklama, küçük başlık ve görseller) |
| Türkan | Ürün sayfasında sağdaki 4 hikâyeye yalnızca tıklanarak geçiliyordu | Tekerlek/parmakla aşağı kaydırma hikâyeleri sırayla açar, yukarı kaydırma geri döner |
| Türkan | Galeri görselleri yalnızca fotoğraf olarak açılıyordu | `foto.views`: kapaksız şişe, kutulu şişe, kutu 3B; tıklayınca ürün dönerek o modele geçer |
| Türkan | Beyaz kutunun beyaz alt kısmı yansıma sanılıp kesildi; beyaz yerler silindi, siyah doldu | Kutu kipinde yansıma tam genişlikteki son satırın altından; dışbükey zarf + opak piksellerden doldurma |
| Türkan | Kategori sayfasında solda siyah bant kalıyordu (eski dikey dizinin karartması) | Portal temasında o karartma kapalı; sahne kategori satırının altına iner |
| Türkan | Kapı açılışı uzundu ve her sayfa geçişinde tekrar görünüyordu | Sade logo + çizgi açılışı; oturumda bir kez, sonraki geçişlerde yalnızca kısa kararma |
| Genel | Telefonda kaydırma iki ürün arasında takılıyordu, bazen iki ürün birden geçiyordu | Dokunmatikte ürün akışı sayfa sayfa: her hareket tam bir ürün; son üründen sonra doğal kaydırma |
| Türkan | Ürün kartlarında düz fotoğraf vardı, sitenin 3B görünümüyle uyumsuzdu | `araclar/kart-3b.py`: kartlar sitenin 3B modelinden saydam zeminde çekilir (`?still=<n>`) |
| Türkan | Çekim sayfası ana sayfanın 4 ürünlük setini kullandığı için 4'ten sonrası hep aynı ürün çıktı | `?still=<n>` sayfası yalnızca o ürünü yükler (data.js); her ürün ayrı sekmede, dış istekler kapalı |
| Genel | Telefonda adres çubuğu açılıp kapanınca son ürün tanınmıyor, Ritüel'e inilemiyordu | Serbest kaydırma konuma göre değil ürün sırasına göre: son üründe ileri, ilk üründe geri her zaman doğal |
| Türkan | Ürün kartları hâlâ sade; renkli zeminler istenmedi, sinematik sergi istendi | `kart-3b.py --stage`: 3B sergi sahnesi (kemerli niş, mermer kaide, spot); kart tam görsel + altta yazı, ok ve sepet |
| Türkan | Sergi zemini gri çıktı (parlak yüzey dar açıda ışığı ayna gibi yansıttı); çekim çok yavaştı | Zemin mat koyu; sahne çiziminde piksel oranı 1 (ürün başına ~40 sn) |
| Türkan | Kullanıcı ürünsüz sahne görselleri verdi (pembe gül, mor lavanta-limon, yeşil orkide) | `araclar/sahne-birlestir.py`: ürünün 3B görüntüsü kaideye oturtulur (boy oranı, sıcak ton, spot gölgesi, temas gölgesi, yansıma, arka hâle); Floraison/Agrumes/Boisé kartları bu sahnelerde |
| Türkan | Sahne kartlarında ürünler net görünmüyordu, sahne ürünü bastırıyordu | Sahne spot dışında kararır, ışık konisi ve kaide havuzu ürüne vurur; ürün `kart-3b.py --hd` ile 2,5 kat çözünürlükte çekilir, kenar ışığı ve keskinleştirme |
| Türkan | Diğer ürünler için de sahne istendi: aynı desenli tasarım, renk ürüne özel | `sahne-birlestir.py` `tint`: sahnenin renkli bölümü ürünün palet rengine boyanır (desen, altın, mermer, çiçek aynı); 20 ürünün hepsi sahneli |
| Türkan | Kartların hepsi kemerli sergi olsun; hikâye sahneleri ana sayfadaki 3B ürünlerin arkasına | Kartlar orkide sergisi (renk ürüne özel); `products[].stage`: sahne fotoğrafı shader arka planında, kaidesi 3B ürünün ayağına hizalı, geçişli, 3B kaide gizli; detay/Ritüel/mağazada söner |
| Türkan | Ürünler sayfasının girişi sade/basitti; 3B kaydırmalı tasarım istendi | `CatalogHero` (sergi kartlı tema): bütün ürünler sergi görselleriyle 3B kapak akışında; sayfa kaydıkça kayar, kendiliğinden ilerler (fare üstündeyken durur), öndeki ürün aydınlık, altta adı/fiyatı/düğmeleri |
| Genel | Ring (silindir) düzeni perspektifte yanlardaki kartları öndekinden büyük gösterdi (içbükey görünüm) | Her kartın konumu JS ile ayrı hesaplanan kapak akışı (x, z, açı, ışık, sıra) |
| Türkan | Arka plan tüm ekranı kaplasın, geçiş sinematik olsun; ortadaki ürün biraz büyüsün, odak tamamen üründe | Sahnenin bulanık, ürün renginde tam ekran dolgusu + keskin sahne; geçişte giden sahne yaklaşıp kararır, gelen yakından oturur. Öndeki ürün masaüstünde ~%12, telefonda ~%6 büyük; sahnede hafif alan derinliği, ürün çevresi daha koyu, yan ürünler daha kısık |
| Türkan | Arka plan hâlâ yarım kalıyordu (keskin sahne/bulanık dolgu sınırı), geçiş kalitesizdi; tepeden sinematik ışık ve hafif karanlık sahne istendi | Sahne tek parça: gerçek boyunda, üst/alt ekranı doldurur, yanlarda ayna yansımasıyla kenara doğru bulanıklaşarak devam eder. Stüdyo gibi koyu; tepeden ürüne ışık konisi, kaidede ışık havuzu, ürün arkasında parıltı; 3B spot ışık tepeden. Geçiş: yumuşak karışım + tonu ürün rengine akan renk geçişi (yakınlaşma/kararma yok) |
| Türkan | Geçişte arka plan sallanıyordu; ilk açılışta geç geliyordu; tasarım dili tek olsun; yazılar net değildi; ürün detayında arka plan farklıydı | Sahne yalnızca ürün yerine oturmuşken (dinlenme pozuna göre) konumlanır, geçişte/detayda sabit; öndeki sahneli ürün süzülmez. Görseller açılışta önceden yüklenir, ölçüm girişi beklemez. Bütün ürünler kemerli orkide sahnesi (renk ürüne özel). Yazılara gölge, yazı arkaları koyu. Detayda sahne kalır (kararır, huzme söner) |
| Türkan | Yazılar tasarım yönergesindeki görsel gibi olsun | Solda tek blok: altın sayaç (01 — 04) en üstte, altın etiket, krem başlık ("NO / 8", ince boşluklu), krem italik kısa açıklama, ince çerçeveli düğme; sağda altın NOTALAR ve krem italik notalar. Renkler #D4B06A altın, #F5E6D8 krem |
| Türkan | Yaprak ve duman istendi; yeni geniş mor duman-orkide sahnesi test edilsin | Agrumes arka planı yeni geniş sahne (2,4:1; masaüstünde ekranı kendisi kaplar, kaide ürünün ayağında). Shader: kaidenin arkasından yükselen ürün renginde fbm duman, iki katmanda süzülerek dönen yapraklar (bir ucu sivri, telefonda küçük) |
| Türkan | Yeni mor sahne beğenilmedi, eski kemerli sahne kalsın ama daha sinematik; ürüne fazla ışık vuruyordu (parlama) | Agrumes yeniden orkide sahnesinde (mor). Sahne: kademeli alan derinliği, suda dalgalanma, altın ışıltı, film tonu, huzmede ışık çizgileri. Işık: sahneli üründe tepe ışığı %40, yansıma %20, kenar ışığı %45 kısık; arka parıltı ve huzme azaltıldı |
| Türkan | Kapak tepesinde koyu leke; 2. görseldeki gibi canlı/net arka plan ve ürün duruşu istendi | Döner kapakta tepe/dip noktası dokuyu silüet kenarından değil biraz içeriden alır (leke yok). Floraison: altın halkalı orkide sahnesi `vivid` (karartma, bulanıklık, renk boyaması yok, net). Masaüstünde öndeki ürün 1,28 kat büyük ve aşağıda (ekranın ~%64 boyu, ayağı ~%78de); sahne altta su yansımasıyla aynalanır |
| Türkan | Altın halkalı canlı sahne beğenilmedi (geri alındı); ürün değişirken arka plan oynuyordu; üst düğmeler "WordPress gibi" | Floraison yeniden pembe orkide sahnesi, ürün eski boyunda. Sahne konumu bir kez alınır ve sabit kalır (yalnızca pencere boyutu değişince); sahneli ürünlerin ayağı ortak çizgiye kaldırılır, her ürün aynı kaideye oturur. Üst menü: çerçeve/hap/cam yok, ince geniş harfler, altın kıl çizgi; arama/sepet ince ikon, dil "TR &#124; EN", menü yazı + iki çizgi; altta ince altın ayırıcı. Ürünler sayfası sekmeleri aynı dilde |
