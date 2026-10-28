"""Doksan Dokuz | "Mourinho Bunu Daha Önce Yaptı: Arda Güler, Yeni Özil mi?"

Her sahne: görsel tipi (v), seslendirme metni (vo) ve görsel parametreleri.
Seslendirmede skorlar ve oranlar yazıyla yazıldı ki TTS doğru okusun.
`cue` alanları, ekrandaki öğelerin seslendirmede hangi kelimeyle birlikte
belireceğini belirler.
"""

TITLE = "Mourinho Bunu Daha Önce Yaptı: Arda Güler, Yeni Özil mi?"

SCENES = [
    # ---------------- SOĞUK AÇILIŞ ----------------
    dict(v="datecard", date="2012", place="SANTIAGO BERNABÉU", sub="DEVRE ARASI",
         vo="İki bin on iki. Santiago Bernabéu. Real Madrid devre arasına Deportivo karşısında üçe bir önde giriyor. "
            "Soyunma odasında her şey yolunda görünüyor. Ama Jose Mourinho öfkeli. Hedefinde ise yirmi üç yaşındaki bir oyuncu var."),
    dict(v="quote", text="İKİ GÜZEL PAS YETERLİ Mİ SANIYORSUN?", who="JOSE MOURINHO'DAN MESUT ÖZİL'E",
         vo="Mourinho, Mesut Özil'in üstüne yürüyor: İki güzel pas yeterli mi sanıyorsun? "
            "Özil formasını çıkarıp Mourinho'nun ayaklarının dibine fırlatıyor ve duşa gidiyor."),
    dict(v="jersey", number="10", name="ÖZİL", caption="İKİNCİ YARIDA RAMOS, ÖZİL'İN FORMASINI ALTINA GİYDİ",
         vo="İkinci yarıda Sergio Ramos sahaya Özil'in formasını kendi formasının altına giyerek çıkıyor. "
            "Bu hikâyeyi yıllar sonra Özil kendi kitabında anlatacaktı."),
    dict(v="title", kicker="2026 · REAL MADRID",
         lines=[("ON DÖRT YIL SONRA", "white"), ("AYNI KULÜBE", "yellow"), ("AYNI ADAM", "red")],
         vo="Aradan on dört yıl geçti. Mourinho yeniden Real Madrid'in kulübesinde. "
            "Ve karşısında yine yirmi bir yaşında, sol ayaklı, Fenerbahçe'den yetişmiş, Türk kökenli bir on numara var."),
    dict(v="jersey", number="15", name="GÜLER", caption="REAL MADRID · 21 YAŞINDA · SOL AYAK",
         vo="Arda Güler."),
    dict(v="title", kicker="DOKSAN DOKUZ SUNAR",
         lines=[("MOURINHO", "white"), ("BUNU DAHA ÖNCE", "yellow"), ("YAPTI", "red")],
         vo="Mourinho bunu daha önce bir kez yaptı. Sonunda Avrupa'nın asist kralı çıktı. Ama o hikâye mutlu bitmedi. "
            "Peki Arda Güler, Mourinho'nun yeni Özil'i mi? Yoksa Özil'in olamadığı bir şey mi? "
            "Bu videoda iki oyuncunun, bir teknik direktörün ve tek bir kulübün hikâyesini anlatıyoruz."),

    # ---------------- BÖLÜM 1 ----------------
    dict(v="chapter", n="01", name="2010: ÖZİL GELİYOR", vo=""),
    dict(v="timeline", items=[("2006", "SCHALKE'DE PROFESYONEL"), ("2008", "WERDER BREMEN"),
                              ("2010", "DÜNYA KUPASI"), ("AĞU 2010", "REAL MADRID")],
         cues=["Schalke", "Bremen", "Dünya", "Madrid'e"],
         vo="Önce Özil'i hatırlayalım. Gelsenkirchen'de doğan Mesut, profesyonel kariyerine Schalke'de başladı. "
            "Asıl patlamayı ise Werder Bremen'de yaptı. İki bin on Dünya Kupası'nda Almanya formasıyla bütün dünyaya kendini gösterdi. "
            "O yaz Real Madrid'e gelen ilk sezonunun teknik direktörü Jose Mourinho'ydu. Ve Mourinho, Özil'i hemen istedi."),
    dict(v="counter", value=21, suffix="", label="ÖZİL'İN REAL MADRID'E GELDİĞİ YAŞ",
         vo="Özil Madrid'e geldiğinde yirmi bir yaşındaydı. Tıpkı bugün Arda gibi. "
            "Ama aralarında büyük bir fark vardı. Özil, Bernabéu'ya bir Dünya Kupası yıldızı olarak geldi. Bekleme süresi neredeyse hiç olmadı."),

    # ---------------- BÖLÜM 2 ----------------
    dict(v="chapter", n="02", name="ASİST MAKİNESİ", vo=""),
    dict(v="statcards", cards=[("159", "MAÇ"), ("27", "GOL"), ("~80", "ASİST")], header="ÖZİL · REAL MADRID · 2010–2013",
         cues=["yüz elli", "yirmi yedi", "seksen"],
         vo="Sonraki üç sezonda Özil, Real Madrid formasıyla yüz elli dokuz maça çıktı, yirmi yedi gol attı ve tüm turnuvalarda yaklaşık seksen asist yaptı. "
            "LaLiga'da asist listesinin zirvesi neredeyse her sezon onundu."),
    dict(v="pitch", play="ozil_counter",
         vo="Mourinho'nun Real Madrid'i bir kontra atak makinesiydi. Top kazanılıyor, saniyeler içinde Özil'e ulaşıyor, "
            "Özil tek dokunuşla Ronaldo'yu ya da Benzema'yı kaleciyle karşı karşıya bırakıyordu."),
    dict(v="counter", value=100, suffix=" PUAN", label="2011–12 · LALİGA ŞAMPİYONLUĞU",
         vo="İki bin on bir, on iki sezonunda bu makine tarihe geçti. Real Madrid, LaLiga'yı tam yüz puanla şampiyon tamamladı. "
            "Barcelona'nın en güçlü döneminde gelen bu şampiyonluğun mimarlarından biri Özil'di."),
    dict(v="quote", text="ONUN BİR KOPYASI YOK. KÖTÜ BİR KOPYASI BİLE.", who="JOSE MOURINHO · 2012",
         vo="Mourinho da bunu herkesten iyi biliyordu. İki bin on ikide Özil için söylediği cümle hâlâ hatırlanıyor: "
            "Onun bir kopyası yok. Kötü bir kopyası bile."),

    # ---------------- BÖLÜM 3 ----------------
    dict(v="chapter", n="03", name="MOURINHO'NUN İKİ YÜZÜ", vo=""),
    dict(v="split", left=("KAMERA ÖNÜNDE", "\"DÜNYANIN EN İYİ 10 NUMARASI\""),
         right=("SOYUNMA ODASINDA", "\"İKİ GÜZEL PAS YETERLİ Mİ?\""),
         vo="Ama Mourinho'nun iki yüzü vardı. Kameraların önünde Özil'i göklere çıkarıyordu. "
            "Soyunma odasında ise ondan hiç durmadan daha fazlasını istiyordu. Daha çok koşu, daha çok mücadele, topsuz oyunda daha çok fedakârlık."),
    dict(v="title", kicker="ÖZİL'İN KİTABINDAN",
         lines=[("ÖVGÜ", "yellow"), ("VE", "white"), ("BASKI", "red")],
         vo="Özil kitabında, Mourinho'nun kendisini bazen bütün takımın önünde sert sözlerle eleştirdiğini anlatıyor. "
            "Ama Özil'in kariyerinin en parlak yılları da tam bu dönemdi. Mourinho'nun yöntemi buydu: övgü ve baskı aynı anda."),
    dict(v="timeline", items=[("HAZ 2013", "MOURINHO AYRILDI"), ("EYL 2013", "ÖZİL ARSENAL'E SATILDI"), ("", "\"DÜNYANIN EN İYİ 10 NUMARASI\"")],
         cues=["ayrıldı", "Arsenal", "dünyanın"],
         vo="İki bin on üç yazında Mourinho Real Madrid'den ayrıldı. Sadece birkaç ay sonra Özil de Arsenal'e satıldı. "
            "Mourinho bu karara şaşırdığını saklamadı ve Özil'i yine dünyanın en iyi on numarası olarak tanımladı. "
            "Özil'in Real Madrid hikâyesi, daha zirvedeyken bitmişti."),

    # ---------------- BÖLÜM 4 ----------------
    dict(v="chapter", n="04", name="FENERBAHÇE KÖPRÜSÜ", vo=""),
    dict(v="triangle", nodes=["ÖZİL", "ARDA", "MOURINHO"], center="FENERBAHÇE",
         cues=["Özil", "Arda", "Mourinho"],
         vo="Şimdi hikâyenin en ilginç kısmına geliyoruz. Bu üç ismi birbirine bağlayan bir kulüp var: Fenerbahçe. "
            "Özil, kariyerinin son yıllarında Fenerbahçe'ye geldi. Orada, on altı yaşında A takımda forma giymeye başlayan bir genç vardı: Arda Güler. "
            "Ve yıllar sonra Mourinho da Fenerbahçe'nin kulübesine oturacaktı."),
    dict(v="quote", text="DÜNYA STARI OLACAK KARDEŞİM.", who="MESUT ÖZİL · FENERBAHÇE",
         vo="Fenerbahçe'nin Alanyaspor karşısında beş gol attığı bir maçta Arda oyuna sonradan girip bir gol ve bir asist yaptı. "
            "Dönüş uçağında Özil, genç takım arkadaşı için şunu söyledi: Dünya starı olacak kardeşim."),
    dict(v="quote", text="O BENİM KÜÇÜK KARDEŞİM GİBİYDİ. SABIRLI OLMALI, ZAMANI GELECEK.", who="MESUT ÖZİL · MARCA",
         vo="Yıllar sonra Arda Real Madrid'de az süre alırken Özil, Marca'ya konuştu. "
            "Fenerbahçe'de Arda'nın kendisi için küçük bir kardeş gibi olduğunu, sabırlı olması gerektiğini ve zamanının geleceğini söyledi. "
            "Örnek olarak da Real Madrid'de şans bulamayıp Arsenal'in kaptanı olan Ødegaard'ı gösterdi."),
    dict(v="timeline", items=[("2023", "ARDA REAL MADRID'DE"), ("2024", "MOURINHO FENERBAHÇE'DE"),
                              ("2025", "MOURINHO BENFICA'DA"), ("11 HAZ 2026", "MOURINHO REAL MADRID'DE")],
         cues=["iki bin yirmi üç", "Fenerbahçe'nin", "Benfica", "Haziran"],
         vo="Arda, iki bin yirmi üç yazında Fenerbahçe'den Real Madrid'e transfer oldu. "
            "Ertesi yıl Mourinho, Fenerbahçe'nin teknik direktörü oldu. Ağustos iki bin yirmi beşte bu görev sona erdi, Mourinho Benfica'ya geçti. "
            "Ve on bir Haziran iki bin yirmi altıda Real Madrid resmi açıklamayı yaptı: Jose Mourinho, iki bin yirmi dokuza kadar yeniden Real Madrid'in teknik direktörü."),

    # ---------------- BÖLÜM 5 ----------------
    dict(v="chapter", n="05", name="AYNI DNA", vo=""),
    dict(v="compare", left="ÖZİL", right="ARDA",
         rows=[("MOURINHO İLE BAŞLADIĞI YAŞ", "21", "21"), ("AYAK", "SOL", "SOL"), ("KÖKEN", "TÜRK", "TÜRK"),
               ("FENERBAHÇE", "OYNADI", "YETİŞTİ"), ("ROL", "10 NUMARA", "10 / 8 NUMARA")],
         vo="Benzerlikler gerçekten şaşırtıcı. İkisi de Mourinho ile çalışmaya yirmi bir yaşında başladı. İkisi de sol ayaklı. İkisi de Türk kökenli. "
            "İkisinin de yolu Fenerbahçe'den geçti. Ve ikisi de oyunu topla düşünen, son pası seven klasik on numaralar."),
    dict(v="statcards", cards=[("51", "MAÇ"), ("6", "GOL"), ("14", "ASİST")], header="ARDA · 2025–26 · TÜM TURNUVALAR",
         cues=["elli bir", "altı gol", "on dört"],
         vo="Arda'nın geçen sezonu da Özil'in Madrid yıllarını hatırlatıyordu. Xabi Alonso döneminde oyunun merkezine yerleşen Arda, "
            "tüm turnuvalarda elli bir maçta altı gol ve on dört asist üretti. LaLiga'da asist sıralamasında ilk üçteydi."),
    dict(v="results", header="TÜRKİYE · 2026 DÜNYA KUPASI · D GRUBU",
         rows=[("AVUSTRALYA", "0–2", "M"), ("PARAGUAY", "", "M"), ("ABD", "3–2", "G")],
         vo="Yazın ise Dünya Kupası vardı. Türkiye yirmi dört yıl sonra turnuvaya döndü ama grupta kaldı. "
            "Son maçta Los Angeles'ta ev sahibi ABD'yi üçe iki yenen milli takımın yıldızı Arda'ydı."),
    dict(v="counter", value=24, suffix=" YIL", label="SONRA DÜNYA KUPASI'NDA İLK TÜRK GOLÜ",
         vo="Arda'nın o maçtaki golü, İlhan Mansız'ın iki bin ikide Senegal'e attığı golden yirmi dört yıl sonra Türkiye'nin Dünya Kupası'ndaki ilk golüydü. "
            "Arda, Dünya Kupası'nda gol atan en genç Türk futbolcu oldu."),

    # ---------------- BÖLÜM 6 ----------------
    dict(v="chapter", n="06", name="TARİH TEKERRÜR EDİYOR", vo=""),
    dict(v="lineup", title="5. HAFTA · RAYO VALLECANO", out_name="ARDA GÜLER", in_name="YAN DIOMANDE",
         vo="Ve Mourinho geliyor. Sezonun beşinci haftasında, Rayo Vallecano maçında İspanyol basını Arda'yı ilk on birde bekliyor. "
            "Ama Mourinho herkesi şaşırtıyor ve Arda'nın yerine genç Yan Diomande'yi sahaya sürüyor."),
    dict(v="poll", title="MARCA ANKETİ · 8.000+ OY",
         options=[("ARDA'YI DIŞARIDA BIRAKAMAZSIN", 67), ("MOURINHO HAKLI", 23), ("DİĞER", 10)],
         vo="Marca'nın anketine sekiz binden fazla kişi katılıyor. Yüzde altmış yedisi aynı şeyi söylüyor: "
            "Arda'yı dışarıda bırakamazsın, takımı oynatan o. Mourinho'yu destekleyenler ise sadece yüzde yirmi üç."),
    dict(v="score", home="ELCHE", away="REAL MADRID", hs=2, as_=3, label="LALİGA · 6. HAFTA", start=(0, 0), steps=[(0, 0, 1), (1, 0, 2), (3, 2, 2), (4, 2, 3)],
         events=[("25'", "ARDA'NIN SERBEST VURUŞU · KK"), ("33'", "MBAPPÉ"), ("68'", "ARDA OYUNDAN ÇIKTI"),
                 ("71' 83'", "ELCHE BERABERLİĞİ YAKALADI"), ("90+1'", "ESPI · GALİBİYET")],
         cues=["serbest", "Mbappé", "altmış sekizinci", "ikiye iki", "uzatma"],
         vo="Bir hafta sonra Elche deplasmanı. Arda'nın serbest vuruşunda gelen kendi kalesine golle Real Madrid öne geçiyor, Mbappé farkı ikiye çıkarıyor. "
            "Arda maçın oyuncusu seçiliyor, ama altmış sekizinci dakikada oyundan alınıyor. Elche skoru ikiye iki yapıyor. "
            "Real Madrid ancak uzatma dakikalarında kazanabiliyor."),
    dict(v="quote", text="HAYIR, VAZGEÇİLMEZ DEĞİL. FUTBOLDA KİMSE VAZGEÇİLMEZ DEĞİLDİR.", who="JOSE MOURINHO · EYLÜL 2026",
         vo="Maçtan sonra Mourinho'ya Arda'nın vazgeçilmez olup olmadığı soruluyor. Cevap manşet oluyor: "
            "Hayır, vazgeçilmez değil. Futbolda kimse vazgeçilmez değildir."),
    dict(v="quote", text="ARDA GÜLER BENİM EN ÖNEMLİ OYUNCULARIMDAN BİRİ.", who="JOSE MOURINHO · AYNI BASIN TOPLANTISI",
         vo="Ama aynı basın toplantısında şunu da ekliyor: Arda Güler benim en önemli oyuncularımdan biri. Vizyonu ve teknik yeteneği inanılmaz. "
            "Tanıdık geldi mi? Kamerada övgü, sahada baskı. On dört yıl önce Özil'e yaptığının aynısı."),
    dict(v="score", home="ROMA", away="REAL MADRID", hs=3, as_=4, label="ŞAMPİYONLAR LİGİ · 14 EKİM 2026",
         start=(3, 1), steps=[(1, 3, 2), (2, 3, 3), (3, 3, 4)],
         events=[("59'", "ARDA OYUNA GİRDİ"), ("83'", "ESPI"), ("85'", "ENDRICK · ASİST ARDA"), ("90'", "RÜDIGER · ASİST ARDA")],
         cues=["elli dokuzuncu", "Espi", "Endrick", "Rüdiger"],
         vo="Ekim ayında Roma deplasmanı. Arda yine yedek. Real Madrid üçe bir geride. Arda elli dokuzuncu dakikada oyuna giriyor. "
            "Önce Espi'nin golü geliyor. Sonra Arda'nın paslarıyla Endrick ve Rüdiger skoru çeviriyor. Real Madrid dörde üç kazanıyor."),
    dict(v="pitch", play="roma_assists",
         vo="Son yedi dakikada üç gol ve bunların ikisinde Arda'nın imzası var. Kulübede başlayan oyuncu, gecenin kahramanı oluyor."),
    dict(v="quote", text="BERNARDO VE ARDA İLE BAŞLASAYDIK, BİZE 5 GOL ATARLARDI.", who="JOSE MOURINHO · LEIPZIG MAÇI ÖNCESİ",
         vo="Mourinho ise kararının arkasında duruyor: Roma'da Bernardo ve Arda ile başlasaydık, bize beş gol atarlardı. "
            "Yani Mourinho'nun Arda'dan istediği, Özil'den istediğinin aynısı: topsuz oyunda fedakârlık."),

    # ---------------- BÖLÜM 7 ----------------
    dict(v="chapter", n="07", name="ARDA'NIN CEVABI", vo=""),
    dict(v="score", home="REAL MADRID", away="SEVILLA", hs=4, as_=1, label="LALİGA · 9. HAFTA", start=(0, 0), steps=[(0, 1, 0), (1, 2, 0), (2, 3, 0), (3, 4, 1)],
         events=[("30'", "ARDA GÜLER · CEZA SAHASI DIŞI"), ("37'", "MBAPPÉ"), ("63'", "MBAPPÉ · PEN"), ("82'", "DIOMANDE")],
         cues=["ceza sahası", "Mbappé", "penaltı", "Diomande"],
         vo="Ama Özil'den farklı olarak Arda'nın cevabı soyunma odasında değil, sahada geliyor. "
            "Roma'dan dört gün sonra Sevilla maçında ceza sahası dışından muhteşem bir gol atıyor. Ardından Mbappé iki kez, biri penaltıdan, sonra da Diomande. Real Madrid dörde bir kazanıyor."),
    dict(v="pitch", play="leipzig",
         vo="Üç gün sonra Şampiyonlar Ligi'nde RB Leipzig. Bu kez ilk on birde. Önce şutuyla Bernardo Silva'nın golünü hazırlıyor, "
            "elli ikinci dakikada da kendi golünü atıyor. Real Madrid dörde bir kazanıyor ve Şampiyonlar Ligi'nde üçte üç yapıyor."),
    dict(v="quote", text="ARDA ÇOK YETENEKLİ. HENÜZ TAM OLGUNLAŞMADI, 21 YAŞINDA.", who="JOSE MOURINHO · EKİM 2026",
         vo="Mourinho ise hâlâ temkinli: Arda çok yetenekli, bunu biliyoruz. Henüz tam anlamıyla olgunlaşmış bir oyuncu değil, yirmi bir yaşında. "
            "Çok yönlü bir oyuncu olmak için gereken niteliklere sahip."),

    # ---------------- BÖLÜM 8 ----------------
    dict(v="chapter", n="08", name="RAKAMLAR NE DİYOR?", vo=""),
    dict(v="dualcounter", a=("646'", "ARDA SAHADA"), b=("524'", "ARDA YOK"), header="BU SEZON · LALİGA + ŞAMPİYONLAR LİGİ · OPTA",
         vo="Peki Mourinho'nun endişesi rakamlarda karşılık buluyor mu? Opta verilerine göre Arda bu sezon LaLiga ve Şampiyonlar Ligi'nde altı yüz kırk altı dakika sahada kaldı. "
            "Oynamadığı süre ise beş yüz yirmi dört dakika. İki dönemi karşılaştıralım."),
    dict(v="stats", header="HÜCUM", left="ARDA SAHADA", right="ARDA YOK",
         rows=[("TOPA SAHİP OLMA", 53.6, 35.6, "%"), ("ŞUT", 130, 78, ""), ("İSABETLİ ŞUT", 59, 33, ""), ("NET GOL POZİSYONU", 31, 21, "")],
         cues=["topa", "yüz otuz", "isabet", "net gol"],
         vo="Arda sahadayken Real Madrid topa yüzde elli üç virgül altı oranında sahip oluyor. Arda yokken bu oran yüzde otuz beş virgül altıya düşüyor. "
            "Arda'yla yüz otuz şut, onsuz yetmiş sekiz. İsabetli şut elli dokuza otuz üç. Net gol pozisyonu otuz bire yirmi bir."),
    dict(v="stats", header="SAVUNMA", left="ARDA SAHADA", right="ARDA YOK",
         rows=[("YENİLEN GOL", 3, 11, ""), ("GOL BEKLENTİSİ (xGA)", 5.92, 7.85, "")], lower_better=True,
         cues=["üç gol", "gol beklentisi"],
         vo="Ama asıl şaşırtıcı olan savunma. Mourinho'nun korkusu denge ise rakamlar tam tersini söylüyor. "
            "Arda sahadayken Real Madrid sadece üç gol yedi. Arda yokken tam on bir. Rakibin gol beklentisi bile Arda sahadayken daha düşük."),
    dict(v="title", kicker="ÖZİL'DEN FARKI",
         lines=[("TOPSUZ OYUN", "white"), ("ARTIK", "yellow"), ("ZAYIF YÖN DEĞİL", "red")],
         vo="İşte Özil ile Arda arasındaki en büyük fark bu olabilir. Özil'e yıllarca yöneltilen eleştiri topsuz oyundu. "
            "Arda ise oyun kuruluşunda daha geriye geliyor, top kaybından sonra baskıya katılıyor ve takımını savunmada da ayakta tutuyor."),

    # ---------------- BÖLÜM 9 ----------------
    dict(v="chapter", n="09", name="ÖZİL'İN OLAMADIĞI ŞEY", vo=""),
    dict(v="split", left=("ÖZİL · 2013", "ZİRVEDEYKEN SATILDI"), right=("ARDA · 2026", "YENİ SÖZLEŞME"),
         vo="Bir fark daha var. Özil, Real Madrid'de zirvedeyken satıldı. Arda için ise kulüp tam tersi bir mesaj veriyor. "
            "Ekim ayında basına yansıyan haberlere göre Arda, Real Madrid ile sözleşmesini uzatan yeni bir imza attı. Real Madrid geleceği Arda üzerine kuruyor."),
    dict(v="statcards", cards=[("11", "MAÇ"), ("3", "GOL"), ("4", "ASİST")], header="ARDA · 2026–27 · ŞU ANA KADAR",
         cues=["on bir", "üç gol", "dört asist"],
         vo="Ve Mourinho'yla ilk sezonunda rakamlar şimdiden konuşuyor. On bir maçta üç gol, dört asist. Eylül ayında Real Madrid'de ayın oyuncusu. "
            "Özil'in o efsane ilk sezonuna benzer bir başlangıç."),
    dict(v="versus", a=("BARCELONA", "27 PUAN"), b=("REAL MADRID", "21 PUAN"), label="EL CLÁSICO · CAMP NOU",
         vo="Ve şimdi önünde en büyük sahne var: El Clásico. Barcelona yirmi yedi puanla lider, Real Madrid yirmi bir puanla üçüncü. "
            "Özil'in Mourinho'yla yaşadığı en büyük anların çoğu da Barcelona'ya karşı gelmişti."),
    dict(v="title", kicker="SON SÖZ",
         lines=[("YENİ ÖZİL Mİ?", "yellow"), ("YOKSA", "white"), ("İLK ARDA MI?", "red")],
         vo="Mourinho, Özil'i dünyanın en iyi on numaralarından birine dönüştürdü. Ama o hikâye erken bitti. "
            "Şimdi aynı adam, aynı kulüpte, Fenerbahçe'den gelen yeni bir on numarayla aynı yolda yürüyor. "
            "Belki de soru yanlış. Arda yeni Özil olmak zorunda değil. Belki de Özil'in olamadığını olacak: Real Madrid'in yıllarca lideri."),
    dict(v="outro",
         vo="Siz ne düşünüyorsunuz? Arda Güler Mourinho'nun yeni Özil'i mi, yoksa ondan daha büyük bir oyuncu mu olacak? Yorumlarda buluşalım. "
            "Videoyu beğenmeyi ve Doksan Dokuz'a abone olmayı unutmayın. Bir sonraki hikâyede görüşmek üzere."),
]
