# Turkish Coffee Lady v4: fiyat yok, detay yok; 3D site → Claude ile 8 adım → ipuçları → sen nasıl yaparsın → SSS → iş mantığı
SCRIPT = [
  # ---- açılış: bizim 3D site ----
  ("Arkadaşlar, bu bir web sitesi.", "Bu bir *web sitesi*", ("clip", "tcl_tour")),
  ("Aşağı kaydırdıkça her kahve kutusu kendi şehrine geliyor: İstanbul, Mardin, İzmir.", "Her kutu *kendi şehrinde*", ("clip", "tcl_tour")),
  ("Her tadın kendi rengi, kendi ışığı var. Sayfa kaydıkça arka plan da değişiyor.", "Her tadın *kendi rengi*", ("clip", "tcl_tour")),
  ("Kutuya tıklayınca dönüyor, arkasında o şehrin hikâyesi açılıyor.", "Tıkla, *arkasını gör*", ("full", "5-kutu-arka.jpg")),
  ("Yanda dört kısa hikâye var; her birinde kutu dönüp yakınlaşıyor.", "Kutu *döner, anlatır*", ("full", "5-kutu-arka.jpg")),
  ("Bütün koleksiyon tek sayfada; her kutu kendi şehrinin önünde.", "Bütün *koleksiyon*", ("full", "6-koleksiyon.jpg")),
  ("Telefonda da aynı sahneler var.", "Telefonda da *aynısı*", ("phone", "@tcl_mobil:0")),
  ("Bu siteyi Turkish Coffee Lady için yaptık. Amerika'da Türk kahvesini tanıtan, on altı yıllık bir marka.", "Turkish Coffee *Lady*", ("clip", "tcl_tour:12")),
  ("Yeni ürünleri buzlu Türk kahvesi; kutuda, soğuk içiliyor. Bu da markanın şu anki sitesi.", "Şu anki *site*", ("clip", "eski_iced")),
  ("Temiz bir mağaza; ama kutuların arkasındaki şehirleri, hikâyeyi anlatmıyor.", "Hikâye *eksik*", ("clip", "eski_iced")),
  ("Biz de bu kutulara yakışan, üç boyutlu bir lansman sitesi yapmak istedik.", "Kutulara yakışan *3D site*", ("clip", "tcl_tour:24")),

  # ---- neden 3D ----
  ("Peki neden üç boyutlu?", "Neden *3D?*", ("clip", "tcl_tour:6")),
  ("Yeni bir ürünü ilk kez gören biri onu eline alıp çevirmek ister. Fotoğraf bunu yapamıyor.", "Eline alıp *çevirmek*", ("clip", "tcl_tour:6")),
  ("Burada ziyaretçi kutuyu ekranda çeviriyor, şehrini görüyor, hikâyesini okuyor.", "Çevir, gör, *oku*", ("clip", "tcl_tour:6")),
  ("Ve böyle siteleri yapan çok az kişi var. Fırsat da burada.", "Fırsat *burada*", ("full", "sahne_bold-istanbul.webp")),
  ("Tek satır kod yazmadım. Baştan sona Claude ile konuşarak yaptım.", "Kod yok, *Claude ile*", ("clip", "tcl_tour:18")),
  ("Bu videoda üç şey var: nasıl yaptım, sen nasıl yaparsın ve bu işten nasıl para kazanılır. Sonda da en çok sorulanları cevaplıyorum.", "Yaptım, yaparsın, *kazanırsın*", ("three",)),

  # ---- 1: araştır ----
  ("Bir. Önce Claude'a markayı araştırttım.", "1. *Markayı araştır*", ("howto2", 1)),
  ("Sitelerine ve Instagram hesaplarına bak, yeni ne var bul dedim.", "Siteye, Instagram'a *bak*", ("talk", 0, 1)),
  ("Claude buldu: bir Ekim'de, Uluslararası Kahve Günü'nde buzlu Türk kahvesi serisini duyurmuşlar. Beş şehir, beş tat, ince kutu.", "5 şehir, 5 tat, *ince kutu*", ("talk", 0, 2)),
  ("Aralık'ta Amerika'da satışa çıkacakmış. Ama sitelerinde bu kutuları tanıtan bir sayfa yokmuş.", "Lansman sayfası *yok*", ("clip", "tcl_2:0")),
  ("Fırsat buydu: yeni ürün var, sahnesi yok. Bu kutular için bir lansman sitesi yapalım dedim.", "Yeni ürün var, *sahnesi yok*", ("full", "1-anasayfa.jpg")),
  ("Claude markanın renklerini, tat adlarını, her tadın şehrini ve tanımını tek bir dosyada topladı. Sitenin bütün metni oradan geliyor.", "Hepsi *tek dosyada*", ("pipe", 0)),

  # ---- 2: şablon + şişe hatası ----
  ("İki. Sıfırdan başlamadım.", "2. *Şablondan başla*", ("howto2", 2)),
  ("Daha önce başka bir soğuk kahve markası için üç boyutlu bir demo yapmıştık. Claude'a onu şablon al, bu markaya uyarla dedim.", "Eski demo = *şablon*", ("talk", 1, 1)),
  ("İlk sürüm hızlı geldi. Ama bir sorun vardı.", "Ama bir *sorun* var", ("talk", 1, 2)),
  ("Claude ürünü cam şişe yapmıştı. Oysa gerçek ürün ince bir alüminyum kutu.", "Şişe değil, *kutu*", ("bug", 10)),
  ("Duyurudaki fotoğrafı attım: bu şişe değil, ince kutu dedim.", "Fotoğrafı *at*", ("labels", 1)),
  ("Claude kutuyu yeniden kurdu. Tek mesajda düzeldi.", "Tek mesajda *düzeldi*", ("labels", 1)),
  ("Ders şu: Claude'a ne kadar net görsel verirsen, sonuç o kadar doğru oluyor.", "Net görsel, *doğru sonuç*", ("bug", 11)),

  # ---- 3: etiket ----
  ("Üç. Kutunun etiketi.", "3. *Etiket*", ("howto2", 3)),
  ("Elimde gerçek kutu yoktu. Sadece Instagram duyurusundaki kutu fotoğrafı vardı.", "Elimde *sadece fotoğraf*", ("labels", 0)),
  ("Bir de markanın kahve paketlerinde suluboya şehir çizimleri vardı.", "Suluboya *şehirler*", ("full", "sahne_bold-istanbul.webp")),
  ("Claude'a dedim ki: duyurudaki tasarımı yeniden çiz, şehirleri de paketlerdeki çizimlerden al.", "Yeniden *çiz*", ("full", "labels_silky-mardin.webp")),
  ("Etiketi çizdi: logo, tat adı, nazar boncuğu ve şehir.", "Logo, nazar, *şehir*", ("full", "labels_silky-mardin.webp")),
  ("Arka yüzde de şehrin hikâyesi var.", "Arka yüz: *hikâye*", ("full", "5-kutu-arka.jpg")),
  ("Beş tat, beş etiket. Her biri kendi renginde.", "5 tat, *5 etiket*", ("labels", 0)),

  # ---- 4: 3D kutu ----
  ("Dört. Etiketi kutuya sarmak.", "4. *3D kutu*", ("howto2", 4)),
  ("Claude etiketi üç boyutlu bir kutunun üstüne sardı. Önü de arkası da gerçek gibi.", "Etiket *kutuda*", ("labels", 1)),
  ("Beş tadın beşi de aynı kutuda; sadece etiket değişiyor.", "Aynı kutu, *5 etiket*", ("labels", 1)),
  ("Sitede bu kutu canlı: parmağınla çevirebiliyorsun.", "Parmakla *çevir*", ("clip", "tcl_tour:3")),

  # ---- 5: sahne ----
  ("Beş. Her tada bir sahne.", "5. *Sahne*", ("howto2", 5)),
  ("Her kutu kendi şehrinin önünde, şık bir kaidenin üstünde dursun dedim.", "Kendi *şehrinde*", ("full", "sahne_silky-mardin.webp")),
  ("Birkaç denemede oturdu. Beğenmediğim yeri söyledim, Claude düzeltti.", "Söyle, *düzeltsin*", ("full", "sahne_pistachio-zeugma.webp")),
  ("Sonuç bu. İstanbul'da Galata, Mardin'de taş kemerler, Kapadokya'da peri bacaları.", "Her tat *kendi şehrinde*", ("flash", 0)),
  ("Ben hiçbir şey çizmedim. Sadece baktım ve ne istediğimi söyledim.", "Bak, *söyle*", ("loop", 3)),

  # ---- 6: site ----
  ("Altı. Siteyi kurmak.", "6. *Site*", ("howto2", 6)),
  ("Kaydırınca kutular sırayla gelsin, tıklayınca kutu dönsün ve hikâyesi açılsın dedim.", "Kaydır, *tıkla*", ("clip", "tcl_tour")),
  ("Bir de üç soruluk bir tat bulucu istedim: kahveni nasıl seversin, ne zaman lazım, hangi şehir seni çağırıyor.", "3 soruluk *tat bulucu*", ("clip", "tcl_3:2")),
  ("Cevaplara göre senin kutun kendi şehrinde kaideye iniyor.", "Kutun *kaideye iner*", ("full", "sahne_minty-cappadocia.webp")),
  ("Kutular o sırada henüz satışta değildi. O yüzden sepet yerine lansman listesi koyduk.", "Sepet yerine *lansman listesi*", ("full", "2-urun-detay.jpg")),
  ("İlgilenen herkes adresini bırakıyor, liste markaya gidiyor.", "Liste *markaya gider*", ("full", "2-urun-detay.jpg")),
  ("Bir de lansman bölümü ekledik: Aralık'taki çıkış, beş yüz yıllık miras ve markanın belgeseli.", "Aralık, miras, *belgesel*", ("full", "4-lansman.jpg")),
  ("Hepsi kutu dönerek anlatılıyor.", "Kutu döner, *hikâye akar*", ("clip", "tcl_2:0")),
  ("Sağ üstte dil düğmesi var: İngilizce ve Türkçe.", "İngilizce + *Türkçe*", ("clip", "tcl_2:0")),
  ("Telefonda menü sadeleşiyor, kutu ekranın ortasına geliyor.", "Telefona *özel*", ("phone", "@tcl_mobil:20")),
  ("İlk sürümle son hali arasındaki fark bu.", "İlk sürüm → *son hali*", ("ab", "ilk_surum.jpg", "2-urun-detay.jpg", "İlk sürüm", "Son hali")),
  ("Aynı Claude, aynı proje. Fark, verdiğim geri bildirimlerde.", "Fark: *geri bildirim*", ("ab", "ilk_surum.jpg", "2-urun-detay.jpg", "İlk sürüm", "Son hali")),

  # ---- 7: kontrol ----
  ("Yedi. Kontrol.", "7. *Kontrol ettir*", ("howto2", 7)),
  ("Claude'dan her değişiklikten sonra masaüstünde ve telefonda ekran görüntüsü almasını istedim.", "Her değişiklikte *ekran görüntüsü*", ("phone", "@tcl_mobil:15")),
  ("Ekran görüntülerinde bir hata çıktı: telefonda tat bulucunun kenar boşluğu bozulmuştu. Claude düzeltti, tekrar baktı.", "Hata → *düzeldi*", ("phone", "@tcl_mobil:15")),
  ("Bu adımı atlama. Claude'a kendi işini kontrol ettirmek seni saatlerce uğraşmaktan kurtarıyor.", "Bu adımı *atlama*", ("phone", "@tcl_mobil:15")),

  # ---- 8: yayın + teklif ----
  ("Sekiz. Yayınla ve teklif et.", "8. *Yayınla + teklif*", ("howto2", 8)),
  ("Bu siteyi tekrar kullanılabilir yaptık: Claude ile bir demo fabrikası kurduk.", "Demo *fabrikası*", ("pipe", 0)),
  ("Ayar dosyasına markanın bilgilerini yazıyorsun, tek komut veriyorsun.", "1 dosya, *1 komut*", ("pipe", 2)),
  ("Yaklaşık yirmi saniyede etiketler çiziliyor, sahneler hazırlanıyor, site derleniyor.", "~20 saniyede *hazır*", ("pipe", 3)),
  ("Bir ayar dosyası, bir komut, yirmi saniye.", "1 dosya, *20 saniye*", ("rstats", 0)),
  ("Netlify'a ücretsiz üye ol, çıkan klasörü sürükleyip bırak. Birkaç saniyede link hazır.", "Sürükle bırak, *link*", ("netlify", 2)),
  ("Sonra Claude'a markaya kısa bir mail yazdırdım.", "Kısa bir *mail*", ("mail", 1)),
  ("Yeni serinizi görünce bu kutuların hak ettiği siteyi hazırladım, linki burada.", "Linki *burada*", ("mail", 2)),
  ("Lansmandan önce yirmi dakikalık bir görüntülü görüşmede canlı gösterebilir miyim?", "20 dakika *görüşelim*", ("mail", 3)),
  ("Linki ve kısa bir ekran videosunu ekledim. Gönder. Maili kısa tut; uzun mail okunmaz.", "Kısa tut, *gönder*", ("mail", 4)),
  ("Ekran videosunu bilgisayarın ekran kaydıyla çek; sitede gezdiğin otuz saniye yeter.", "30 saniyelik *ekran videosu*", ("clip", "tcl_tour:9")),
  ("Bir de Claude'a kısa bir teklif dosyası hazırlattım: neler yapılacak, ne kadar sürecek, nasıl ilerleyeceğiz.", "Teklif *dosyası*", ("list", "offer", 0)),

  # ---- sen nasıl yaparsın ----
  ("Şimdi sen nasıl yaparsın.", "Sen nasıl *yaparsın?*", ("howto", 0)),
  ("Bir. Yeni ürün duyuran bir marka bul. Instagram'da yeni seri, lansman, yakında gibi paylaşımlara bak.", "1. *Yeni ürün duyuran marka*", ("howto", 1)),
  ("İki. Claude'a markayı araştırt: siteleri, ürünleri, renkleri, duyurusu.", "2. *Claude araştırsın*", ("howto", 2)),
  ("Üç. Açıklamadaki hazır promptu doldur, ürün görsellerini ekle.", "3. *Prompt + görsel*", ("howto", 3)),
  ("Dört. Ekran görüntüsü aldır, beğenmediğin yeri tek tek yaz.", "4. *Bak, yaz*", ("howto", 4)),
  ("Beş. Netlify'a yükle, linkini al.", "5. *Netlify linki*", ("howto", 5)),
  ("Altı. Markaya kişisel bir mail at, linki ekle.", "6. *Kişisel mail*", ("howto", 6)),

  # ---- ipuçları ----
  ("Claude ile çalışırken işime yarayan yedi şey var.", "Claude ile *7 ipucu*", ("list", "tips", 0)),
  ("Bir: görsel ver. Ürünü anlatmak yerine fotoğrafını at; şişe hatası böyle düzeldi.", "1. *Görsel ver*", ("list", "tips", 1)),
  ("İki: tek mesajda tek iş iste. Önce etiket, sonra kutu, sonra sahne.", "2. *Tek mesaj, tek iş*", ("list", "tips", 2)),
  ("Üç: beğenmediğini net söyle. Güzel olmamış deme; daha sıcak olsun, yazı büyüsün de.", "3. *Net söyle*", ("list", "tips", 3)),
  ("Dört: her seferinde telefonda da kontrol ettir. İnsanların çoğu siteye telefondan bakıyor.", "4. *Telefonda kontrol*", ("list", "tips", 4)),
  ("Beş: iyi çıkan işi şablon yap. Bir sonraki marka çok daha hızlı biter.", "5. *Şablon yap*", ("list", "tips", 5)),
  ("Altı: küçük başla. Önce tek ürünlü bir sayfa, sonra büyüt.", "6. *Küçük başla*", ("list", "tips", 6)),
  ("Yedi: örnek göster. Beğendiğin bir sitenin ekran görüntüsünü at, bunun gibi olsun de.", "7. *Örnek göster*", ("list", "tips", 7)),

  # ---- hangi markalar ----
  ("Hangi markalar? Yeni ürün çıkaran her marka.", "Yeni ürün çıkaran *her marka*", ("targets", 0)),
  ("Kahve, parfüm, kozmetik, takı, çikolata, içecek. Ürünü güzel ama sitesi sıradan olanlar.", "Ürünü güzel, *sitesi sıradan*", ("targets", 0)),
  ("Nerede bulursun?", "Nerede *bulursun?*", ("list", "where", 0)),
  ("Instagram'da yeni seri, yakında, lansman diye paylaşım yapan markalar.", "Instagram'da *yeni seri*", ("list", "where", 1)),
  ("Fuarlara katılan markalar; fuardan önce yeni ürün hazırlarlar.", "Fuar *öncesi*", ("list", "where", 2)),
  ("Kendi mağazası olan küçük markalar; sitesi var ama sıradan.", "Küçük *markalar*", ("list", "where", 3)),

  # ---- iş mantığı (rakam yok) ----
  ("Gelelim para kısmına. Rakam vermeyeceğim; fiyat işin kapsamına, markaya ve senin deneyimine göre değişir.", "Rakam yok: *kapsama göre*", ("price", 0)),
  ("Ama mantık aynı: bir kurulum ücreti, bir de aylık bakım.", "Kurulum + *bakım*", ("price", 0)),
  ("Düzenli gelir bakımdan gelir. Yeni ürün geldikçe siteyi sen güncellersin.", "Düzenli gelir: *bakım*", ("price", 1)),
  ("Bir de ek işler çıkıyor: yeni ürün ekleme, sitedeki sahneden sosyal medya videosu, yeni bir dil, mağazaya bağlama.", "Ek *işler*", ("list", "extras", 0)),
  ("Ödemeyi de aşamalara böl: başta, önizlemede ve yayında.", "Ödemeyi *böl*", ("list", "pay", 0)),
  ("İlk işlerde uygun başla, portföyünü büyüt. Her iş bir sonrakini kolaylaştırır.", "Uygun başla, *portföy yap*", ("clip", "tcl_tour:27")),
  ("En önemlisi: önce demo, sonra teklif. Marka kendi kutusunu ekranda görünce ne sattığını hemen anlıyor.", "Önce *demo*, sonra teklif", ("full", "1-anasayfa.jpg")),
  ("Zamanlama da çok önemli. Ürün çıkmadan önce gidersen, site lansmana yetişir.", "Lansmandan *önce* git", ("sell", 4)),
  ("Bir hafta cevap gelmezse bir kere kibarca hatırlat.", "Kibar *hatırlatma*", ("follow", 0)),
  ("Hayır diyene ısrar etme.", "Israr *yok*", ("follow", 1)),
  ("İlk evet diyen marka, senin vitrinin olur.", "İlk müşteri = *vitrinin*", ("follow", 2)),

  # ---- kurallar ----
  ("Kurallar da var. Toplu reklam maili atma.", "Toplu mail *yok*", ("rules", 1)),
  ("Her markaya ayrı, kişisel yaz. Sadece herkese açık iletişim adreslerini kullan.", "Kişisel, *açık adres*", ("rules", 3)),
  ("Markayla bağlantın yoksa sitenin altına bunun bağımsız bir konsept demo olduğunu yaz.", "Konsept demo: *açıkça yaz*", ("rules", 4)),
  ("Kişisel verilerin korunması ve ticari ileti kurallarına uy.", "KVKK'ya *uy*", ("rules", 5)),
  ("Ve kimse sana kazanç garantisi veremez. Ben de vermiyorum.", "Kazanç *garantisi yok*", ("rules", 6)),

  # ---- sık sorulanlar ----
  ("En çok sorulanlar. Kod bilmem gerekiyor mu? Hayır; ne istediğini Türkçe yazman yeterli.", "Kod *gerekmez*", ("qa", 0)),
  ("İngilizce bilmem lazım mı? Hayır; Claude iki dilde de yazıyor.", "İngilizce *gerekmez*", ("qa", 1)),
  ("Ne kadar sürüyor? İlk site birkaç gün. Şablonla sonrakiler çok daha hızlı.", "İlk site *birkaç gün*", ("qa", 2)),
  ("Demo için para lazım mı? Hayır; Netlify'ın ücretsiz planı yeterli.", "Demo *ücretsiz*", ("qa", 3)),
  ("Telefonda çalışıyor mu? Evet; her değişiklikte telefonda kontrol ettirdik.", "Telefonda *çalışır*", ("qa", 4)),
  ("Markanın logosunu kullanabilir miyim? Sadece o markaya teklif için, konsept demo notuyla.", "Logo: *sadece teklif için*", ("qa", 5)),
  ("Kaç markaya yazmalıyım? Toplu değil; haftada birkaç marka, her birine özel demo.", "Haftada *birkaç marka*", ("qa", 6)),
  ("Claude hata yaparsa? Ekran görüntüsünü at, neyin yanlış olduğunu tek cümleyle yaz.", "Hata: *görüntü + tek cümle*", ("qa", 7)),

  # ---- kapanış ----
  ("Özet: araştır, şablondan başla, etiketi çizdir, kutuya sar, sahneye koy, siteyi kur, kontrol ettir, linki gönder.", "Araştır, kur, *gönder*", ("montage", 0)),
  ("Bu hafta bir marka seç ve demosunu yap. Hazır promptu açıklamaya koydum.", "Bu hafta *bir marka seç*", ("montage", 0)),
  ("Sıradaki üç boyutlu site hangi marka için olsun? Yorumlara yaz.", "Sıradaki *marka?*", ("comment", 0)),
]
SAY = {"Turkish Coffee Lady'nin": "Törkiş Kofi Leydi'nin", "Turkish Coffee Lady": "Törkiş Kofi Leydi", "Claude'a": "Klod'a", "Claude'dan": "Klod'dan",
       "Claude": "Klod", "Netlify'ın": "Netlifay'ın", "Netlify'a": "Netlifay'a", "Instagram": "İnstagram"}
