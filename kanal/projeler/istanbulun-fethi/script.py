# İstanbul'un Fethi (1453) — kodla çizilmiş gerçekçi harita animasyonu
# vis: ("map", görünüm, *işlemler)  işlemler: +emp:x +city:x(!) +route:x +lbl:Yazı@lon,lat +wall:x +chain +fleet:x +ships:x +army:x +cannons +fire:x +flag +bridge year:.. date:.. era:.. clear
#      ("card", tür, aşama)  ("assault", aşama)
SCRIPT = [
  # ---- açılış ----
  ("29 Mayıs 1453. Bin yılı aşkın süredir bir imparatorluğun başkenti olan şehir, bir sabah el değiştirdi.", "29 Mayıs *1453*", ("map", "bogaz", "+wall:kara", "+wall:halic", "+wall:marmara", "+roofs", "year:1453", "date:29 Mayıs", "era:İstanbul'un Fethi")),
  ("Peki yirmi bir yaşında bir sultan, aşılamaz denen surları nasıl aştı?", "21 yaşında *bir sultan*", ("card", "title", 0)),
  ("Bu videoda fethi haritalarla, gün gün anlatıyorum.", "Gün gün, *haritalarla*", ("card", "title", 1)),

  # ---- bağlam ----
  ("Önce büyük resme bakalım.", "Büyük *resim*", ("map", "balkan", "clear", "year:1451", "era:II. Mehmed tahtta")),
  ("1451'de Osmanlı tahtına II. Mehmed geçti. Henüz yirmi yaşına bile girmemişti.", "II. Mehmed: *çok genç*", ("map", "balkan", "+emp:osmanli1451", "+city:edirne!")),
  ("Osmanlılar o sırada hem Balkanlar'da hem Anadolu'da güçlüydü. Başkentleri Edirne'ydi.", "Başkent: *Edirne*", ("map", "balkan", "+city:bursa")),
  ("Bizans ise eski gücünden çok uzaktı. Elinde neredeyse yalnızca başkenti ve çevresi kalmıştı.", "Bizans: *bir şehir*", ("map", "balkan", "+emp:bizans1453", "+city:kostantiniyye!")),
  ("Ama o başkent, dünyanın en iyi korunan şehirlerinden biriydi.", "En iyi korunan *şehir*", ("map", "bogaz", "-city:edirne", "-city:bursa", "-city:kostantiniyye", "-emp:osmanli1451", "-emp:bizans1453", "+wall:kara", "+wall:halic", "+wall:marmara", "+roofs")),

  # ---- şehir ve surlar ----
  ("Şehir üç tarafı denizle çevrili bir yarımadanın üstündeydi: güneyde Marmara, kuzeyde Haliç, doğuda Boğaz.", "Üç tarafı *deniz*", ("map", "sehir", "+lbl:Marmara Denizi@28.955,40.985", "+lbl:Haliç@28.958,41.040", "+lbl:Boğaz@29.010,41.030")),
  ("Deniz tarafında surlar vardı; ama asıl güç karadaydı.", "Asıl güç: *kara surları*", ("map", "sehir")),
  ("Kara surları yaklaşık altı kilometre boyunca Marmara'dan Haliç'e uzanıyordu.", "6 km: *Marmara'dan Haliç'e*", ("map", "kara_sur")),
  ("Önde bir hendek, arkasında alçak bir dış sur, en arkada yüksek bir iç sur.", "Hendek, dış sur, *iç sur*", ("card", "sur", 0)),
  ("Üç katlı bir savunma. Bu surlar yüzyıllar boyunca pek çok kuşatmayı geri çevirmişti.", "Üç katlı *savunma*", ("card", "sur", 1)),
  ("Bir de Haliç'in ağzı vardı. Bizanslılar Haliç'i kalın bir zincirle kapatıyordu.", "Haliç'e *zincir*", ("map", "halic", "-lbl:Marmara Denizi", "-lbl:Boğaz", "+chain")),
  ("Böylece düşman gemileri Haliç'e giremiyordu.", "Gemiler *giremez*", ("map", "halic", "+fleet:biz_halic")),

  # ---- hazırlık ----
  ("Sultan Mehmed işe Boğaz'dan başladı.", "Önce *Boğaz*", ("map", "rumeli", "-lbl:Haliç", "year:1452", "era:Rumeli Hisarı")),
  ("1452'de, Boğaz'ın en dar yerinde, Anadolu Hisarı'nın tam karşısına Rumeli Hisarı'nı yaptırdı.", "1452: *Rumeli Hisarı*", ("map", "rumeli", "+city:anadoluhisari", "+city:rumelihisari!")),
  ("Hisar birkaç ayda tamamlandı. Artık Karadeniz'den şehre gelecek yardım Boğaz'dan geçemeyecekti.", "Boğaz *kapandı*", ("map", "rumeli", "+lbl:Karadeniz'e ↑@29.07,41.13")),
  ("Sonra toplar geldi.", "Sonra *toplar*", ("card", "top", 0)),
  ("Macar top ustası Urban, önce hizmetini Bizans'a önermiş; sonra Osmanlı için devasa toplar döktü.", "Usta *Urban*", ("card", "top", 1)),
  ("Bu toplar dev taş gülleler atıyordu. Surları dövmek için tasarlanmıştı.", "Dev *taş gülleler*", ("card", "top", 2)),

  # ---- kuşatma başlıyor ----
  ("6 Nisan 1453. Kuşatma başladı.", "6 Nisan: *kuşatma*", ("map", "sehir", "-city:anadoluhisari", "-city:rumelihisari", "-lbl:Karadeniz", "year:1453", "date:6 Nisan", "era:Kuşatma başlıyor")),
  ("Osmanlı ordusu kara surlarının önüne yerleşti.", "Surların *önünde*", ("map", "kara_sur", "+army:osm_kara")),
  ("Sultan'ın otağı, surların en zayıf görülen kısmının, Romanos Kapısı'nın karşısındaydı.", "Otağ: *Romanos Kapısı karşısı*", ("map", "kara_sur", "+city:otag!", "+city:topkapi_kapi")),
  ("Toplar ateş açtı.", "Toplar *ateş açtı*", ("map", "kara_sur", "+cannons")),
  ("Surlar gündüz yıkılıyor, savunucular geceleri gedikleri onarıyordu.", "Gündüz yıkılır, *gece onarılır*", ("map", "kara_sur")),
  ("Şehrin savunmasını İmparator Konstantinos ile Cenevizli komutan Giustiniani yönetiyordu.", "Konstantinos ve *Giustiniani*", ("map", "kara_sur", "+army:biz_kara")),
  ("Kaynaklara göre savunucular birkaç bin kişiydi; Osmanlı ordusu ise çok daha kalabalıktı.", "Birkaç bin *savunucu*", ("map", "kara_sur")),

  # ---- deniz ----
  ("Denizde ise işler kolay gitmiyordu.", "Denizde *zorluk*", ("map", "halic", "-city:otag", "-city:topkapi_kapi", "+fleet:osm_bogaz")),
  ("Osmanlı donanması Boğaz'da bekliyordu ama zincir yüzünden Haliç'e giremiyordu.", "Zincir *engeli*", ("map", "halic")),
  ("20 Nisan'da dört gemi, Osmanlı donanmasının arasından geçip Haliç'e girmeyi başardı.", "20 Nisan: *4 gemi geçti*", ("map", "halic", "date:20 Nisan", "era:Gemiler geçti", "+ships:yardim")),
  ("Bu, Osmanlı ordusunda büyük bir hayal kırıklığı yarattı. Sultan donanma komutanını görevden aldı.", "Hayal *kırıklığı*", ("map", "halic")),
  ("Ve sonra tarihin en cesur hamlelerinden biri geldi.", "En cesur *hamle*", ("card", "kizak", 0)),

  # ---- gemiler karadan ----
  ("22 Nisan sabahı, Haliç'teki Bizanslılar gözlerine inanamadı.", "22 Nisan *sabahı*", ("map", "gemiler", "-ships:yardim", "date:22 Nisan", "era:Gemiler karadan")),
  ("Osmanlı gemileri karadan yürüyordu.", "Gemiler *karadan*", ("map", "gemiler", "+route:karadan", "+ships:karadan")),
  ("Gemiler yağlanmış kızakların üstünde, Galata'nın arkasındaki tepelerden çekilerek Haliç'e indirildi.", "Yağlı *kızaklar*", ("map", "gemiler", "+city:galata")),
  ("Kaynaklar yetmiş kadar gemiden söz ediyor.", "~70 *gemi*", ("map", "gemiler")),
  ("Böylece zincir işe yaramaz hale geldi. Osmanlı gemileri artık Haliç'in içindeydi.", "Zincir *aşıldı*", ("map", "halic", "-route:karadan", "+fleet:osm_halic")),
  ("Bizans, Haliç surlarını da savunmak zorunda kaldı. Zaten az olan asker iki cepheye bölündü.", "Savunma *ikiye bölündü*", ("map", "sehir")),
  ("Osmanlılar Haliç'in üzerine yüzer bir köprü de kurdu.", "Yüzer *köprü*", ("map", "halic", "+bridge")),

  # ---- uzun haftalar ----
  ("Kuşatma haftalarca sürdü.", "Haftalarca", ("map", "kara_sur", "-ships:karadan", "date:Mayıs", "era:Uzun haftalar")),
  ("Osmanlılar surların altına tüneller kazdı; Bizanslılar karşı tünellerle bunları bozdu.", "Tüneller ve *karşı tüneller*", ("map", "kara_sur")),
  ("Surlarda gedikler açıldı ama her seferinde kapatıldı.", "Gedik açıldı, *kapatıldı*", ("map", "kara_sur", "+fire:gedik")),
  ("Şehirde yiyecek azalıyordu. Beklenen büyük Avrupa yardımı ise gelmedi.", "Yardım *gelmedi*", ("map", "sehir")),

  # ---- son saldırı ----
  ("29 Mayıs'ın ilk saatlerinde son saldırı başladı.", "29 Mayıs: *son saldırı*", ("assault", 0)),
  ("Saldırı dalgalar halindeydi.", "Dalga *dalga*", ("assault", 0)),
  ("Önce hafif birlikler surlara yüklendi.", "1. dalga: *hafif birlikler*", ("assault", 1)),
  ("Sonra Anadolu birlikleri.", "2. dalga: *Anadolu birlikleri*", ("assault", 2)),
  ("En son, sultanın seçkin askerleri yeniçeriler.", "3. dalga: *yeniçeriler*", ("assault", 3)),
  ("Bu sırada savunmanın komutanı Giustiniani ağır yaralandı ve surlardan çekildi.", "Giustiniani *yaralandı*", ("assault", 3)),
  ("Savunma dağılmaya başladı.", "Savunma *dağıldı*", ("assault", 4)),
  ("Rivayete göre surlara ilk Osmanlı sancağını Ulubatlı Hasan dikti.", "Ulubatlı *Hasan*", ("assault", 4)),
  ("Osmanlı askerleri şehre girdi. İmparator Konstantinos son savaşta hayatını kaybetti.", "Şehre *girildi*", ("assault", 5)),
  ("Bizans İmparatorluğu sona ermişti.", "Bizans *sona erdi*", ("assault", 5)),

  # ---- sonrası ----
  ("O gün Sultan Mehmed şehre girdi ve doğruca Ayasofya'ya gitti.", "Doğruca *Ayasofya'ya*", ("map", "sehir", "clear", "+wall:kara", "+wall:halic", "+wall:marmara", "+roofs", "+emp:sehir_osm", "+city:ayasofya!", "era:Fetih")),
  ("Ayasofya camiye çevrildi.", "Ayasofya *cami oldu*", ("map", "sehir")),
  ("Yirmi bir yaşındaki sultan artık Fatih olarak anılacaktı.", "Artık *Fatih*", ("card", "fatih", 0)),
  ("Kısa süre sonra İstanbul, Osmanlı'nın başkenti oldu.", "Yeni başkent: *İstanbul*", ("map", "balkan", "clear", "+emp:osmanli1453", "+city:kostantiniyye!")),
  ("Pek çok tarihçi bu olayı Orta Çağ'ın sonu, Yeni Çağ'ın başlangıcı olarak kabul eder.", "Orta Çağ'ın *sonu*", ("card", "cag", 0)),
  ("Toparlayalım.", "Toparlayalım", ("card", "ozet", 0)),
  ("1452: Rumeli Hisarı Boğaz'ı kapattı.", "1452: *Rumeli Hisarı*", ("card", "ozet", 1)),
  ("6 Nisan: kuşatma ve dev toplar.", "6 Nisan: *kuşatma*", ("card", "ozet", 2)),
  ("22 Nisan: gemiler karadan Haliç'e.", "22 Nisan: *gemiler karadan*", ("card", "ozet", 3)),
  ("29 Mayıs: son saldırı ve fetih.", "29 Mayıs: *fetih*", ("card", "ozet", 4)),
  ("Bu animasyonu da baştan sona Claude kodla çizdi; gerçek yükseklik verisinden araziyi, surları, gemileri.", "Bunu da *Claude çizdi*", ("map", "bogaz", "clear", "+wall:kara", "+wall:halic", "+wall:marmara", "+roofs", "+chain", "+city:ayasofya")),
  ("Sıradaki tarih animasyonu hangi konu olsun? Yorumlara yaz.", "Sıradaki *konu?*", ("map", "bogaz")),
]
SAY = {"Claude": "Klod", "Giustiniani": "Custiniani", "Urban": "Urban", "Konstantinos": "Konstantinos"}
