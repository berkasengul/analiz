# Türkler Anadolu'ya nasıl geldi? (Karga Zihni, "Claude ile Yaptım" — kodla çizilmiş animasyon)
# vis: ("map", görünüm, *işlemler)  işlemler: +emp:x -emp:x +city:x(!) +route:x +lbl:Yazı@lon,lat year:552(=metin) date:.. era:.. clear
#      ("card", tür, param)  ("battle", aşama)
SCRIPT = [
  # ---- açılış ----
  ("Ötüken'den Konya'ya kuş uçuşu beş bin altı yüz kilometre.", "Ötüken → Konya: *5.600 km*", ("map", "genel", "+city:otuken!", "+city:konya!", "+route:dunya")),
  ("Türkler bu yolu bir günde değil, beş yüz yılı aşkın bir sürede aldı.", "Bir günde değil, *500 yılda*", ("map", "genel")),
  ("Peki Orta Asya bozkırlarından çıkan boylar, nasıl oldu da Anadolu'yu yurt edindi?", "Nasıl *yurt edindiler?*", ("card", "title", 0)),
  ("Bu videoda bu hikâyeyi haritalarla, adım adım anlatıyorum.", "Haritalarla, *adım adım*", ("card", "title", 0)),
  ("Sonunda da bir sürprizim var: bu animasyonu baştan sona Claude kodla çizdi.", "Bunu *Claude çizdi*", ("card", "title", 1)),

  # ---- bozkır ve Göktürkler ----
  ("Hikâye burada, Moğolistan bozkırlarında başlıyor.", "Moğolistan *bozkırları*", ("map", "asya", "clear", "+city:otuken", "+lbl:Moğolistan bozkırı@101,44.5")),
  ("Uçsuz bucaksız otlaklar, sert kışlar ve at sırtında yaşayan göçebe boylar.", "At sırtında *göçebe boylar*", ("map", "asya")),
  ("Bu boyların hayatı sürüye bağlıydı. Otlak neredeyse, onlar da oradaydı.", "Otlak nerede, *onlar orada*", ("map", "asya")),
  ("Bozkırdan batıya göç aslında yeni değildi.", "Göç *yeni değildi*", ("map", "genel")),
  ("Dördüncü yüzyılda Hunlar Avrupa'ya kadar ulaşmış, Roma'yı sarsmıştı.", "Hunlar *Avrupa'da*", ("map", "genel", "+lbl:Hunlar → Avrupa@38,49")),
  ("Türk tarih yazımında Hunlar, Türklerin ataları arasında sayılır.", "Türklerin *ataları arasında*", ("map", "genel")),
  ("Göktürkler başlangıçta Juan-juanlara bağlı, demircilikleriyle bilinen bir boydu.", "Demirci *bir boy*", ("map", "asya", "-lbl:Hunlar")),
  ("552'de Bumin Kağan Juan-juanları yendi ve Göktürk Kağanlığı'nı kurdu.", "552: *Göktürk Kağanlığı*", ("map", "asya", "year:552", "era:Göktürk Kağanlığı", "+emp:gokturk")),
  ("Türk adını devletin adı olarak taşıyan ilk devlet buydu.", "Adında *Türk* olan ilk devlet", ("map", "asya")),
  ("Kısa sürede Mançurya'dan Hazar Denizi'ne kadar uzanan dev bir kağanlık oldu.", "Mançurya'dan *Hazar'a*", ("map", "bozkir")),
  ("Doğuyu Bumin Kağan, batıyı kardeşi İstemi Yabgu yönetti.", "Doğu ve *batı*", ("map", "bozkir")),
  ("İstemi Yabgu'nun elçileri, Bizans'ın başkenti Konstantinopolis'e kadar gitti.", "Elçiler *Bizans'ta*", ("map", "genel", "+city:kostantiniyye", "year:568", "era:Bizans'a elçiler")),
  ("Yani Türklerle Bizans'ın tanışması, Malazgirt'ten beş yüz yıl önceydi.", "Malazgirt'ten *500 yıl önce*", ("map", "genel")),

  # ---- Orhun ----
  ("Göktürkler bir süre Çin'e yenildi, sonra devletlerini yeniden kurdu.", "Yıkıldı, *yeniden kuruldu*", ("map", "asya", "-city:kostantiniyye", "year:682", "era:II. Göktürk Kağanlığı")),
  ("Bu ikinci devletten bize çok değerli bir miras kaldı: Orhun Yazıtları.", "Orhun *Yazıtları*", ("map", "asya", "+city:orhun!")),
  ("Bilge Kağan ve kardeşi Kül Tigin için dikilen bu taşlar, Türkçe yazılmış en eski uzun metinlerden.", "En eski *Türkçe metinler*", ("card", "yazit", 0)),
  ("Taşta şöyle bir cümle var:", "Taşta *şu cümle var*", ("card", "yazit", 0)),
  ("Üstte gök çökmedikçe, altta yer delinmedikçe, ey Türk milleti, ilini ve töreni kim bozabilir?", "Üstte gök, *altta yer*", ("card", "yazit", 1)),

  # ---- Uygurlar ve dağılma ----
  ("744'te Göktürklerin yerini Uygurlar aldı.", "744: *Uygurlar*", ("map", "asya", "-city:orhun", "-emp:gokturk", "+emp:uygur", "year:744", "era:Uygur Kağanlığı")),
  ("Uygurlar şehirler kurdu, yerleşik hayata geçti, kendi alfabelerini kullandı.", "Şehirler, *yazı*, yerleşik hayat", ("map", "asya")),
  ("Ama 840'ta Kırgızlar Uygur başkentini yıktı ve boylar dört bir yana dağıldı.", "840: boylar *dağıldı*", ("map", "asya", "year:840", "era:Dağılma", "+route:dag1", "+route:dag2")),
  ("Batıya göç eden boylar, Seyhun Nehri'nin ve Maveraünnehir'in topraklarına ulaştı.", "Batıya, *Seyhun'a*", ("map", "bozkir", "-emp:uygur", "+route:goc_bati", "+lbl:Maveraünnehir@66,40.4")),

  # ---- neden göç ----
  ("Peki bu boylar neden sürekli batıya gitti?", "Neden *batıya?*", ("card", "neden", 0)),
  ("Birincisi iklim. Kuraklık ve sert kışlar sürüleri öldürüyordu; yeni otlak bulmak zorundaydılar.", "1. *İklim*", ("card", "neden", 1)),
  ("İkincisi nüfus. Boylar büyüdükçe bozkır dar geliyordu.", "2. *Nüfus*", ("card", "neden", 2)),
  ("Üçüncüsü siyasi baskı. Doğuda Çin ve güçlü rakip boylar vardı; batı daha açıktı.", "3. *Siyasi baskı*", ("card", "neden", 3)),
  ("Yani bu tek bir sefer değil, kuşaklar boyu süren bir göçtü.", "Kuşaklar boyu *bir göç*", ("card", "neden", 3)),

  # ---- İslam ile tanışma ----
  ("Batıya inen Türkler burada yeni bir dünyayla karşılaştı: İslam.", "Yeni bir dünya: *İslam*", ("map", "orta", "clear", "+lbl:Maveraünnehir@66,40.4")),
  ("751'de Talas'ta Abbasi ordusuyla Çin ordusu karşı karşıya geldi.", "751: *Talas*", ("map", "orta", "year:751", "era:Talas Savaşı", "+city:talas!")),
  ("Karluk Türklerinin Abbasilerin yanında yer alması savaşın sonucunu belirledi.", "Karluklar *Abbasilerin yanında*", ("map", "orta")),
  ("Bu savaştan sonra Türklerle Müslümanlar arasındaki bağ giderek güçlendi.", "Bağ *güçlendi*", ("map", "orta")),
  ("Onuncu yüzyılda Karahanlılar İslam'ı kabul etti.", "Karahanlılar *Müslüman oldu*", ("map", "orta", "-city:talas", "+emp:karahanli", "+city:kasgar", "+city:balasagun", "year:950=10. yüzyıl", "era:Karahanlılar")),
  ("Karahanlılar, İslam'ı kabul eden ilk Türk devletlerinden biri oldu.", "İlk Müslüman *Türk devletlerinden*", ("map", "orta")),
  ("Kaşgarlı Mahmud, Türkçenin ilk sözlüğü sayılan Divanü Lügati't-Türk'ü bu dönemde yazdı.", "Divanü Lügati't-Türk", ("card", "kitap", 0)),
  ("Aynı yıllarda güneyde, bugünkü Afganistan'da da güçlü bir Türk devleti vardı: Gazneliler.", "Güneyde: *Gazneliler*", ("map", "maveraunnehir", "+emp:gazneli", "+city:gazne")),

  # ---- Oğuzlar ve Selçuklular ----
  ("Şimdi bu hikâyenin asıl kahramanlarına gelelim: Oğuzlar.", "Asıl kahramanlar: *Oğuzlar*", ("map", "orta", "-emp:karahanli", "-emp:gazneli", "-city:kasgar", "-city:balasagun", "-city:gazne", "+lbl:Oğuzlar@62,46.6")),
  ("Oğuzlar Aral Gölü'nün çevresinde, Seyhun Nehri boyunca yaşıyordu.", "Aral ve *Seyhun*", ("map", "orta")),
  ("Oğuzların Kınık boyundan Selçuk Bey, boyuyla birlikte Cend şehrine yerleşti ve İslam'ı kabul etti.", "Selçuk Bey, *Cend*", ("map", "orta", "+city:cend!", "year:985=10. yüzyıl sonu", "era:Selçuk Bey")),
  ("Selçuklular adını ondan alır.", "Adı ondan: *Selçuklu*", ("map", "orta")),
  ("Selçuk Bey'in torunları Tuğrul ve Çağrı Beyler, boylarını güneye, Horasan'a götürdü.", "Tuğrul ve Çağrı: *Horasan'a*", ("map", "horasan", "+route:oguz_guney", "year:1035", "era:Horasan'a geçiş")),
  ("Burada güçlü Gazneli Devleti ile karşı karşıya geldiler.", "Karşılarında: *Gazneliler*", ("map", "horasan", "+city:merv", "+city:nisabur")),
  ("1040'ta Dandanakan'da Gazneli ordusunu yendiler.", "1040: *Dandanakan*", ("map", "horasan", "+city:dandanakan!", "year:1040", "era:Dandanakan Savaşı")),
  ("Bu zaferle Büyük Selçuklu Devleti kuruldu.", "Büyük *Selçuklu Devleti*", ("map", "iran", "+emp:selcuklu", "era:Büyük Selçuklu")),
  ("Tuğrul Bey hızla batıya ilerledi: Nişabur, Rey, İsfahan.", "Nişabur, Rey, *İsfahan*", ("map", "iran", "+route:selcuk_bati", "+city:rey", "+city:isfahan")),
  ("1055'te Bağdat'a girdi ve Abbasi halifesini koruması altına aldı.", "1055: *Bağdat*", ("map", "iran", "+route:bagdat", "+city:bagdat!", "year:1055", "era:Bağdat")),
  ("Artık İslam dünyasının siyasi gücü Selçukluların elindeydi.", "Güç *Selçuklularda*", ("map", "iran")),

  # ---- Anadolu kapısı ----
  ("Peki Anadolu o sırada kimin elindeydi?", "Anadolu *kimdeydi?*", ("map", "anadolu", "clear", "+emp:bizans")),
  ("Anadolu yüzyıllardır Bizans İmparatorluğu'nun toprağıydı.", "Bizans *toprağı*", ("map", "anadolu", "+city:kostantiniyye")),
  ("Burada Rumlar, Ermeniler, Süryaniler ve başka pek çok halk yaşıyordu.", "Pek çok *halk*", ("map", "anadolu")),
  ("Türkmen boyları ise yeni otlaklar arıyordu. Doğu sınırına akınlar başladı.", "Doğuya *akınlar*", ("map", "anadolu", "+route:akin1", "+route:akin2")),
  ("1048'de Pasinler'de Selçuklu ve Bizans orduları ilk büyük savaşlarından birini yaptı.", "1048: *Pasinler*", ("map", "kafkas", "+city:pasinler!", "year:1048", "era:Pasinler Savaşı")),
  ("Tuğrul Bey'den sonra sultan olan Alp Arslan, 1064'te Kafkasya'nın kapısı sayılan Ani'yi aldı.", "1064: *Ani*", ("map", "kafkas", "+city:ani!", "year:1064", "era:Ani'nin alınışı")),
  ("Bizans artık sınırdaki tehlikenin farkındaydı.", "Bizans *tedirgin*", ("map", "anadolu")),

  # ---- Malazgirt ----
  ("İmparator Romen Diyojen büyük bir ordu topladı.", "Romen Diyojen *ordu topladı*", ("map", "anadolu", "-route:akin1", "-route:akin2", "+route:bizans_dogu", "year:1071", "era:Malazgirt'e yürüyüş")),
  ("Amacı, Türkmenleri Anadolu'dan tamamen çıkarmaktı.", "Amaç: *Türkmenleri çıkarmak*", ("map", "anadolu")),
  ("Ordusunda Bizans askerlerinin yanında Frank, Norman, Peçenek ve Uz paralı askerler vardı.", "Frank, Norman, *Peçenek, Uz*", ("map", "anadolu")),
  ("Alp Arslan o sırada güneyde, Suriye seferindeydi.", "Alp Arslan *güneyde*", ("map", "akdeniz", "+lbl:Suriye@37.5,35.3")),
  ("Haberi alınca hızla kuzeye döndü.", "Hızla *kuzeye*", ("map", "akdeniz", "+route:alparslan")),
  ("26 Ağustos 1071. İki ordu Malazgirt ovasında karşılaştı.", "26 Ağustos *1071*", ("map", "malazgirt", "+city:malazgirt!", "date:26 Ağustos", "era:Malazgirt Savaşı")),
  ("Kaynakların çoğuna göre Bizans ordusu Selçuklu ordusundan çok daha kalabalıktı.", "Bizans *daha kalabalık*", ("battle", 0)),
  ("Rivayete göre Alp Arslan savaştan önce beyazlar giydi; şehit düşerse bu elbiseyle gömülmek istedi.", "Beyazlar *giydi*", ("battle", 0)),
  ("Savaş başlayınca Selçuklu atlıları geri çekilir gibi yaptı.", "Geri çekilir *gibi*", ("battle", 1)),
  ("Bizans ordusu peşlerinden ilerledi ve safları açıldı.", "Saflar *açıldı*", ("battle", 2)),
  ("Bu, bozkır savaşlarının bilinen taktiğiydi: sahte geri çekilme ve hilal şeklinde kuşatma.", "Hilal *kuşatma*", ("battle", 3)),
  ("Bizans saflarındaki Uz ve Peçenek askerlerinin Selçuklu tarafına geçtiği de anlatılır.", "Uz ve Peçenekler *taraf değiştirdi*", ("battle", 3)),
  ("Akşama doğru Bizans ordusu çöktü ve imparator esir düştü.", "İmparator *esir*", ("battle", 4)),
  ("Alp Arslan imparatora iyi davrandı, bir anlaşma yaptı ve onu serbest bıraktı.", "Anlaşma ve *serbest*", ("battle", 4)),
  ("Malazgirt, Anadolu'nun kapılarını Türklere açan savaş olarak tarihe geçti.", "Anadolu'nun *kapıları açıldı*", ("map", "anadolu", "-route:bizans_dogu", "-route:alparslan", "-lbl:Suriye")),
  ("Alp Arslan bir yıl sonra, 1072'de öldü.", "1072: *Alp Arslan öldü*", ("map", "iran", "+emp:selcuklu", "year:1072", "era:Melikşah dönemi")),
  ("Oğlu Melikşah döneminde Büyük Selçuklu en geniş sınırlarına ulaştı.", "Melikşah: *en geniş sınırlar*", ("map", "iran")),
  ("Veziri Nizamülmülk'ün kurduğu Nizamiye medreseleri, dönemin en önemli okulları oldu.", "Nizamiye *medreseleri*", ("map", "iran", "+city:bagdat", "+city:isfahan")),

  # ---- beylikler ----
  ("Bu arada Türkmen boyları Anadolu'nun içlerine doğru hızla yayıldı.", "Anadolu'ya *yayılış*", ("map", "anadolu", "-emp:selcuklu", "-city:bagdat", "-city:isfahan", "+route:yay1", "+route:yay2", "+route:yay3", "+route:yay4", "era:Anadolu'ya yayılış")),
  ("Kısa sürede Anadolu'da ilk Türk beylikleri kuruldu.", "İlk *Türk beylikleri*", ("map", "anadolu", "-route:yay1", "-route:yay2", "-route:yay3", "-route:yay4", "-emp:bizans", "+emp:bizans2", "-emp:selcuklu", "-city:pasinler", "-city:ani", "-city:malazgirt")),
  ("Sivas ve Tokat'ta Danişmendliler.", "Sivas, Tokat: *Danişmendliler*", ("map", "anadolu", "+emp:dan", "+city:sivas")),
  ("Erzurum'da Saltuklular. Erzincan ve Divriği'de Mengücekliler.", "Saltuklular, *Mengücekliler*", ("map", "anadolu", "+emp:salt", "+emp:meng", "+city:erzurum", "+city:erzincan")),
  ("Güneydoğuda, Hasankeyf ve Mardin'de Artuklular.", "Mardin: *Artuklular*", ("map", "anadolu", "+emp:artuk", "+city:mardin")),
  ("İzmir'de ise ilk Türk donanmasını kuran isim olarak bilinen Çaka Bey.", "İzmir: *Çaka Bey*", ("map", "anadolu", "+emp:caka", "+city:izmir")),

  # ---- Anadolu Selçuklu ----
  ("Ve en önemlisi: Kutalmışoğlu Süleyman Şah.", "Süleyman *Şah*", ("map", "anadolu", "+route:suleyman")),
  ("Süleyman Şah batıya, Marmara kıyısına kadar ilerledi ve İznik'i başkent yaptı.", "Başkent: *İznik*", ("map", "anadolu", "+city:iznik!", "+emp:anadolu1")),
  ("1077'de Anadolu Selçuklu Devleti doğdu.", "1077: *Anadolu Selçuklu*", ("map", "anadolu", "-route:suleyman", "year:1077", "era:Anadolu Selçuklu Devleti")),
  ("Başkent İznik, Bizans'ın başkentine yalnızca doksan kilometre uzaktaydı.", "Bizans'a *90 km*", ("map", "orta_anadolu", "+city:kostantiniyye")),
  ("Bizans da yardım için Batı'ya, Papa'ya seslendi.", "Bizans *Batı'ya seslendi*", ("map", "orta_anadolu")),
  ("1096'da Haçlı orduları yola çıktı.", "1096: *Haçlılar*", ("map", "anadolu", "+route:hacli", "year:1096", "era:I. Haçlı Seferi")),
  ("Kılıç Arslan, 1096'da Haçlıların ilk dalgasını İznik yakınlarında yendi.", "İlk dalga *yenildi*", ("map", "orta_anadolu", "+city:iznik!")),
  ("1097'de İznik düştü ve Selçuklular başkenti Konya'ya taşıdı.", "Yeni başkent: *Konya*", ("map", "anadolu", "-emp:anadolu1", "+emp:anadolu2", "+route:konya", "+city:konya!", "year:1097", "era:Başkent Konya")),
  ("Asıl Haçlı ordusu Eskişehir yakınlarında Kılıç Arslan'ı yendi ve güneye yürüdü.", "Eskişehir: *Haçlılar geçti*", ("map", "anadolu", "+city:eskisehir")),
  ("Ama Türkler Anadolu'dan çıkmadı.", "Türkler *kaldı*", ("map", "anadolu", "-route:hacli", "-route:konya", "-city:eskisehir")),

  # ---- Miryokefalon ----
  ("Bizans, Anadolu'yu geri almayı bir kez daha denedi.", "Bir kez *daha*", ("map", "anadolu", "year:1176", "era:Miryokefalon")),
  ("İmparator Manuel Komnenos büyük bir orduyla Konya'ya yürüdü.", "Manuel *Konya'ya*", ("map", "orta_anadolu", "+route:manuel")),
  ("17 Eylül 1176'da Miryokefalon'da İkinci Kılıç Arslan, Bizans ordusunu dar bir geçitte bozguna uğrattı.", "17 Eylül 1176: *Miryokefalon*", ("map", "orta_anadolu", "+city:miryokefalon!", "date:17 Eylül")),
  ("Manuel bu yenilgiyi Malazgirt'e benzetti.", "Malazgirt'e *benzetti*", ("map", "orta_anadolu")),
  ("Bu savaştan sonra Bizans, Anadolu'yu geri alma umudunu büyük ölçüde yitirdi.", "Umut *bitti*", ("map", "anadolu", "-route:manuel", "-emp:anadolu2", "+emp:anadolu3")),
  ("On ikinci yüzyılın sonlarında Avrupalı kaynaklar Anadolu'ya yeni bir isim vermeye başladı:", "Yeni bir *isim*", ("card", "turchia", 0)),
  ("Turchia. Yani Türkiye.", "Turchia: *Türkiye*", ("card", "turchia", 1)),
  ("Sonraki yüzyılda Konya, Anadolu'nun parlayan başkenti oldu.", "Konya'nın *altın çağı*", ("map", "orta_anadolu", "+city:konya!", "year:1220=13. yüzyıl", "era:Konya'nın altın çağı")),
  ("Yollar boyunca kervansaraylar yapıldı; kervanlar Anadolu'yu bir uçtan öbür uca geçti.", "Kervansaraylar, *kervanlar*", ("map", "anadolu", "+route:kervan")),
  ("Mevlana da bu dönemde Konya'da yaşadı.", "Mevlana *Konya'da*", ("map", "orta_anadolu")),
  ("Ama 1243'te Kösedağ'da Moğollar geldi; Anadolu Selçuklu zayıfladı; zamanla Anadolu yeniden beyliklere bölündü.", "1243: *Kösedağ*", ("map", "anadolu", "-route:kervan", "+city:kosedag!", "year:1243", "era:Kösedağ")),
  ("Bu beyliklerden biri, Söğüt'te kurulan küçük bir beylikti: Osmanlı. Ama o, başka bir videonun konusu.", "Söğüt: *Osmanlı*", ("map", "orta_anadolu", "-city:kosedag", "+city:sogut!", "year:1299", "era:Osmanlı Beyliği")),

  # ---- özet ----
  ("Toparlayalım.", "Toparlayalım", ("card", "ozet", 0)),
  ("552'de Ötüken'de bir kağanlık kuruldu.", "552: *Göktürkler*", ("card", "ozet", 1)),
  ("840'tan sonra boylar batıya göç etti.", "840: *göç*", ("card", "ozet", 2)),
  ("1040'ta Dandanakan'la Büyük Selçuklu doğdu.", "1040: *Dandanakan*", ("card", "ozet", 3)),
  ("1071'de Malazgirt'le Anadolu'nun kapısı açıldı.", "1071: *Malazgirt*", ("card", "ozet", 4)),
  ("1077'de Anadolu Selçuklu kuruldu.", "1077: *Anadolu Selçuklu*", ("card", "ozet", 5)),
  ("1176'da Miryokefalon'la Anadolu yurt oldu.", "1176: *Miryokefalon*", ("card", "ozet", 6)),
  ("Yani Türklerin Anadolu'ya gelişi tek bir savaş değil; göçlerle, devletlerle ve kuşaklarla örülmüş uzun bir yolculuk.", "Uzun bir *yolculuk*", ("map", "genel", "clear", "+route:dunya", "+city:otuken", "+city:konya")),

  # ---- nasıl yaptım ----
  ("Şimdi gelelim bu animasyona. Bunu ben çizmedim; baştan sona Claude kodla çizdi.", "Bunu *Claude çizdi*", ("card", "kod", 0)),
  ("Haritada hazır bir görsel yok. Kara, deniz, göl ve nehirler açık bir harita verisinden, kodla çiziliyor.", "Hazır görsel *yok*", ("card", "kod", 1)),
  ("Devlet sınırları, göç yolları, şehirler ve yıl kartları da birer kod satırı.", "Hepsi *kod*", ("card", "kod", 2)),
  ("Malazgirt'teki savaş şeması bile kod: her asker bloğu bir dikdörtgen.", "Savaş şeması da *kod*", ("card", "kod", 3)),
  ("Ben ne yaptım? Claude'a konuyu anlattım, haritada neyi görmek istediğimi söyledim.", "Ben sadece *anlattım*", ("card", "kod", 3)),
  ("Tarihleri birlikte kontrol ettik; tartışmalı yerlerde temkinli anlattık.", "Tarihleri *kontrol ettik*", ("card", "kod", 3)),
  ("Sen de yapabilirsin.", "Sen de *yapabilirsin*", ("card", "nasil", 0)),
  ("Bir: Claude'a konunu ve önemli tarihleri yaz.", "1. *Konu ve tarihler*", ("card", "nasil", 1)),
  ("İki: Haritada neyin, hangi sırayla görüneceğini anlat.", "2. *Sırayla anlat*", ("card", "nasil", 2)),
  ("Üç: Ekran görüntüsüne bak, beğenmediğini söyle; renk, yazı, hız.", "3. *Bak, söyle*", ("card", "nasil", 3)),
  ("Dört: Bilgileri mutlaka kaynaklardan kontrol et. Yapay zekâ da yanılabilir.", "4. *Kaynaktan kontrol et*", ("card", "nasil", 4)),
  ("Hazır promptu açıklamaya koydum.", "Prompt *açıklamada*", ("card", "nasil", 4)),
  ("Sıradaki animasyon hangi konu olsun? İstanbul'un fethi mi, Osmanlı'nın kuruluşu mu? Yorumlara yaz.", "Sıradaki *konu?*", ("map", "genel", "+route:dunya", "+city:otuken", "+city:konya")),
]
SAY = {"Claude'a": "Klod'a", "Claude": "Klod", "Juan-juanlara": "Cuan-cuanlara", "Juan-juanları": "Cuan-cuanları", "Turchia": "Turkiya",
       "Kül Tigin": "Kül Tigin", "Divanü Lügati't-Türk": "Divanü Lügatit Türk", "Romen Diyojen": "Romen Diyojen", "Mançurya": "Mançurya"}
