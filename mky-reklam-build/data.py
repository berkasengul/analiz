# -*- coding: utf-8 -*-
"""
MKY Reklam & Medya — site içeriği.
Telefon, adres, hizmetler ve portfolyo projeleri BURADAN düzenlenir;
sonra `python3 build.py` çalıştırılarak tüm sayfalar yeniden üretilir.
"""

# ---------------------------------------------------------------------------
# 1) FİRMA BİLGİLERİ  (↓ kendi bilgilerinizle değiştirin)
# ---------------------------------------------------------------------------
SITE = {
    "name": "MKY Reklam & Medya",
    "url": "https://www.mkyreklam.com",          # yayına alınca gerçek alan adı
    "phone": "0 (5XX) XXX XX XX",                 # ekranda görünen
    "wa": "905XXXXXXXXX",                         # WhatsApp: 90 + numara, boşluksuz
    "email": "info@mkyreklam.com",
    "address": "Mahalle, Sokak No, İlçe / Şehir",
    "city": "Şehir",
    "maps": "https://www.google.com/maps/search/?api=1&query=MKY+Reklam",
    "instagram": "https://www.instagram.com/mkyreklam/",
    "ig_handle": "@mkyreklam",
    "hours": [("Pazartesi – Cuma", "09:00 – 19:00"), ("Cumartesi", "10:00 – 17:00"), ("Pazar", "Kapalı")],
}

# ---------------------------------------------------------------------------
# 2) PORTFOLYO KATEGORİLERİ
# ---------------------------------------------------------------------------
CATS = [
    ("web", "Web Tasarım"),
    ("tabela", "Tabela & Cephe"),
    ("arac", "Araç Giydirme"),
    ("acikhava", "Billboard & Açık Hava"),
    ("kimlik", "Kurumsal Kimlik"),
    ("sosyal", "Sosyal Medya"),
]
CAT = dict(CATS)

# ---------------------------------------------------------------------------
# 3) HİZMETLER
# ---------------------------------------------------------------------------
ICONS = {
    "sosyal": '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/><path d="M9 11.5c0-1 .8-1.7 1.6-1.7.6 0 1.1.4 1.4.9.3-.5.8-.9 1.4-.9.9 0 1.6.7 1.6 1.7 0 1.8-3 3.5-3 3.5s-3-1.7-3-3.5z"/>',
    "reklam": '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/>',
    "web": '<rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8M12 17v4M3 8h18"/>',
    "kimlik": '<path d="M12 3l7 7-7 11-7-11z"/><circle cx="12" cy="11" r="2"/>',
    "tabela": '<path d="M3 9l1.5-5h15L21 9"/><path d="M4 9v11h16V9M3 9h18M9 20v-6h6v6"/>',
    "arac": '<path d="M2 7h11v9H2zM13 10h4l4 3v3h-8z"/><circle cx="6" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/>',
    "video": '<rect x="2" y="6" width="14" height="12" rx="2"/><path d="M16 10l6-3v10l-6-3z"/>',
}

SERVICES = [
    {
        "slug": "web-tasarim", "icon": "web", "title": "Web Tasarım",
        "short": "Hızlı, mobil uyumlu ve Google'da bulunabilir kurumsal siteler.",
        "lead": "Sitenizi yalnızca güzel görünsün diye değil, ziyaretçiyi müşteriye çevirsin diye tasarlıyoruz. Mobil uyumlu, hızlı ve yönetmesi kolay.",
        "img": "mola-web-1.jpg", "cats": ["web"], "feature": True,
        "about": "Kurumsal tanıtım sitesinden e-ticarete, kampanya açılış sayfasından randevu sistemine kadar işinize uygun yapıyı kuruyoruz. Tasarım, metin, fotoğraf, alan adı, hosting ve SEO altyapısı dahil, anahtar teslim.",
        "checks": ["Mobil öncelikli tasarım", "Google SEO altyapısı", "WhatsApp & form entegrasyonu", "Alan adı & hosting kurulumu", "Hız optimizasyonu", "Kolay içerik yönetimi"],
        "subs": [
            ("Kurumsal Web Sitesi", "Firmanızı, hizmetlerinizi ve referanslarınızı profesyonelce anlatan çok sayfalı site."),
            ("E-Ticaret", "Ürün kataloğu, sepet, online ödeme ve kargo entegrasyonlu satış sitesi."),
            ("Açılış Sayfası", "Reklam kampanyaları için tek amaca odaklı, yüksek dönüşümlü landing page."),
            ("Randevu & Rezervasyon", "Klinik, servis, restoran gibi işletmeler için online randevu altyapısı."),
            ("SEO & Google İşletme", "Google'da üst sıralar için teknik SEO ve Google İşletme Profili kurulumu."),
            ("Bakım & Güncelleme", "Aylık güvenlik, yedekleme ve içerik güncelleme desteği."),
        ],
        "faq": [
            ("Bir web sitesi kaç günde hazır olur?", "Kurumsal tanıtım siteleri içerikler hazır olduğunda genellikle 2–3 haftada, e-ticaret siteleri 4–6 haftada yayına alınır."),
            ("Siteyi sonradan kendim güncelleyebilir miyim?", "Evet. Teslimde size kısa bir eğitim veriyoruz; dilerseniz güncellemeleri aylık bakım paketiyle biz de yapabiliriz."),
            ("Alan adı ve hosting dahil mi?", "Teklifimizde ilk yıl alan adı, hosting ve SSL sertifikası dahil olarak hesaplanır, kurulumları biz yaparız."),
            ("Site Google'da çıkacak mı?", "Tüm sitelerimiz teknik SEO altyapısıyla teslim edilir ve Google Search Console'a kaydedilir. Rekabetçi kelimeler için ayrıca SEO çalışması öneriyoruz."),
        ],
    },
    {
        "slug": "tabela", "icon": "tabela", "title": "Tabela & Cephe",
        "short": "Işıklı kutu harf, cephe giydirme, totem ve iç mekân yönlendirme.",
        "lead": "İşletmenizin sokaktaki yüzünü tasarlıyor, üretiyor ve monte ediyoruz. Gündüz dikkat çeken, gece parlayan tabelalar.",
        "img": "mola-tabela-1.jpg", "cats": ["tabela"], "feature": True,
        "about": "Tasarımdan imalata, montajdan belediye ruhsat sürecine kadar tüm işi tek elden yürütüyoruz. Malzemeyi bütçenize ve dış ortam koşullarına göre birlikte seçiyoruz; kalıcı ve garantili.",
        "checks": ["Ücretsiz keşif & ölçü", "3D tasarım önizleme", "Kendi atölyemizde üretim", "Profesyonel montaj", "Ruhsat danışmanlığı", "Garantili LED aydınlatma"],
        "subs": [
            ("Işıklı Kutu Harf", "Paslanmaz, pleksi veya alüminyum gövdeli, LED aydınlatmalı 3 boyutlu harfler."),
            ("Cephe Giydirme", "Kompozit panel (Alucobond) kaplama ile mağaza cephesine bütünlüklü görünüm."),
            ("Işıklı Kutu Tabela", "Tek veya çift taraflı, branda ya da pleksi yüzeyli ekonomik ışıklı tabelalar."),
            ("Totem & Yönlendirme", "Otopark, site girişi ve AVM'ler için totem ve yön tabelaları."),
            ("Cam Giydirme", "Vitrin folyo, buzlu cam ve kampanya yazıları ile camlarınızı reklam alanına çevirin."),
            ("İç Mekân & Ofis", "Resepsiyon logoları, ofis duvar grafikleri ve kapı isimlikleri."),
        ],
        "faq": [
            ("Tabela için ruhsat gerekiyor mu?", "Çoğu belediyede cephe tabelaları için ilan-reklam ruhsatı gerekir. Ölçü ve teknik çizimleri hazırlayıp başvuru sürecinde size destek oluyoruz."),
            ("Keşif ücretli mi?", "Hayır. Yerinde ölçü ve keşif ücretsizdir; ardından fotoğraf üzerinde 3D önizleme ile birlikte teklif sunarız."),
            ("Üretim ve montaj ne kadar sürer?", "Tasarım onayından sonra çoğu tabela 5–10 iş gününde üretilip monte edilir."),
            ("LED'ler bozulursa ne oluyor?", "Kullandığımız LED modül ve trafolar garantilidir. Garanti süresince arızaları ücretsiz gideriyoruz."),
        ],
    },
    {
        "slug": "arac-giydirme-acik-hava", "icon": "arac", "title": "Araç Giydirme & Açık Hava",
        "short": "Filo giydirme, billboard, raket, branda ve tüm büyük baskılar.",
        "lead": "Markanızı yola, caddeye ve şehrin en görünür noktalarına taşıyoruz. Araçlarınız gezen birer reklam panosuna dönüşsün.",
        "img": "atlas-arac-1.jpg", "cats": ["arac", "acikhava"],
        "about": "Araç giydirmede uzun ömürlü cast folyolar ve laminasyon kullanıyor, araç boyasına zarar vermeyen uygulama yapıyoruz. Açık hava kampanyalarında tasarımı her mecraya (billboard, raket, megalight) uyarlıyoruz.",
        "checks": ["Araca özel şablon", "Boyaya zarar vermeyen folyo", "UV dayanımlı baskı", "Filo indirimleri", "Kampanya uyarlamaları", "Montaj & söküm"],
        "subs": [
            ("Tam / Yarım Araç Giydirme", "Ticari araç, panelvan ve otomobillerde komple ya da kısmi kaplama."),
            ("Filo Giydirme", "Servis, kargo ve satış ekiplerinin tüm araçlarında tutarlı marka görünümü."),
            ("Billboard & Megalight", "Billboard, raket ve megalight için kampanya tasarımı ve baskı."),
            ("Branda & Vinil Baskı", "İnşaat, mağaza açılışı ve etkinlikler için büyük ebat baskılar."),
            ("Fuar & Etkinlik", "Stand grafikleri, roll-up, örümcek stand ve yönlendirme ürünleri."),
            ("Matbaa Ürünleri", "Kartvizit, broşür, katalog, menü, etiket ve ambalaj baskıları."),
        ],
        "faq": [
            ("Araç giydirme boyaya zarar verir mi?", "Hayır. Kaliteli cast folyolar doğru uygulandığında boyayı korur, söküldüğünde iz bırakmaz."),
            ("Giydirme kaç yıl dayanır?", "Kullandığımız folyo ve laminasyona bağlı olarak 5–7 yıl renk ve yapışma garantisi sunuyoruz."),
            ("Kaç günde uygulanır?", "Tasarım onayından sonra tek bir panelvanın baskı ve uygulaması genellikle 2–3 iş günü sürer."),
            ("Billboard yeri de ayarlıyor musunuz?", "Evet. Bütçe ve hedef bölgenize göre uygun açık hava alanlarını araştırıp kiralama sürecini yönetiyoruz."),
        ],
    },
    {
        "slug": "sosyal-medya", "icon": "sosyal", "title": "Sosyal Medya Yönetimi",
        "short": "İçerik stratejisi, tasarım, paylaşım ve topluluk yönetimi.",
        "lead": "Instagram, TikTok ve Facebook hesaplarınızı markanıza yakışan bir dille, düzenli ve ölçülebilir şekilde yönetiyoruz.",
        "img": "lina-sosyal-1.jpg", "cats": ["sosyal"],
        "about": "Her ay başında içerik takvimini birlikte onaylıyor; post, story ve Reels üretimini, paylaşımı ve mesaj/yorum yönetimini üstleniyoruz. Ay sonunda neyin işe yaradığını rakamlarla raporluyoruz.",
        "checks": ["Aylık içerik takvimi", "Post, story & Reels tasarımı", "Metin & hashtag yazımı", "Yorum / DM yönetimi", "Aylık performans raporu", "Rakip analizi"],
        "subs": [
            ("İçerik Stratejisi", "Hedef kitlenize ve markanıza uygun ton, tema ve paylaşım planı."),
            ("Tasarım & Prodüksiyon", "Marka kimliğinize uygun post, carousel, story ve Reels üretimi."),
            ("Hesap Yönetimi", "Planlı paylaşım, profil düzeni, öne çıkanlar ve biyografi optimizasyonu."),
            ("Topluluk Yönetimi", "Yorum ve mesajlara hızlı, markanıza uygun dilde dönüş."),
            ("Influencer İş Birlikleri", "Doğru içerik üreticileri bulup kampanya sürecini yönetiyoruz."),
            ("Raporlama", "Erişim, etkileşim ve takipçi büyümesini aylık raporla takip."),
        ],
        "faq": [
            ("Ayda kaç paylaşım yapılıyor?", "Paketlere göre değişmekle birlikte genellikle ayda 12–20 post ve düzenli story paylaşımı yapıyoruz."),
            ("İçerikleri paylaşmadan önce görebilir miyim?", "Evet. Aylık içerik takvimi ve tasarımlar sizin onayınızdan sonra yayına alınır."),
            ("Fotoğraf ve video çekimi dahil mi?", "Paketlere göre aylık çekim günü dahil edilebilir; ürün ve mekân çekimlerini kendi ekibimizle yapıyoruz."),
            ("Reklam bütçesi pakete dahil mi?", "Hayır. Reklam bütçesi doğrudan Meta'ya ödenir; reklam yönetimini ayrı bir hizmet olarak sunuyoruz."),
        ],
    },
    {
        "slug": "dijital-reklam", "icon": "reklam", "title": "Dijital Reklam",
        "short": "Meta ve Google reklamlarıyla ölçülebilir müşteri kazanımı.",
        "lead": "Reklam bütçenizin her kuruşunun nereye gittiğini bilin. Doğru kitleye, doğru mesajla ulaşan, ölçülebilir kampanyalar kuruyoruz.",
        "img": "atlas-web-1.jpg", "cats": ["sosyal", "web"],
        "about": "Kampanya hedefini (satış, mesaj, arama, form) birlikte belirliyor, piksel ve dönüşüm takibini kuruyor, kreatifleri test ederek bütçeyi en iyi sonuç veren reklamlara yönlendiriyoruz.",
        "checks": ["Meta (Instagram & Facebook) Ads", "Google Arama & Haritalar", "YouTube reklamları", "Piksel & dönüşüm kurulumu", "A/B kreatif testleri", "Haftalık optimizasyon"],
        "subs": [
            ("Meta Reklamları", "Instagram ve Facebook'ta mesaj, satış ve form odaklı kampanyalar."),
            ("Google Ads", "Arama, Haritalar ve Performance Max ile sizi arayan müşteriye ulaşın."),
            ("Yeniden Pazarlama", "Sitenizi ziyaret eden ama dönüşmeyen kişilere tekrar ulaşın."),
            ("Reklam Kreatifleri", "Kaydırmayı durduran reklam görselleri ve kısa videolar."),
            ("Dönüşüm Takibi", "Piksel, Google Analytics ve etiket kurulumlarıyla net ölçüm."),
            ("Raporlama", "Harcama, maliyet ve dönüşümleri sade bir panelde görün."),
        ],
        "faq": [
            ("Minimum reklam bütçesi ne kadar olmalı?", "Sektöre göre değişir; yerel işletmeler için günlük küçük bütçelerle başlayıp sonuç geldikçe ölçeklendirmeyi öneriyoruz."),
            ("Sonuçları ne zaman görürüm?", "İlk veriler birkaç gün içinde gelir; kampanyaların optimize olması genellikle 2–4 hafta sürer."),
            ("Reklam hesabı kimin adına açılıyor?", "Hesaplar her zaman sizin işletmenize aittir; biz yönetici olarak erişim alırız."),
            ("Sadece reklam yönetimi alabilir miyim?", "Evet, sosyal medya yönetiminden bağımsız olarak yalnızca reklam yönetimi hizmeti sunuyoruz."),
        ],
    },
    {
        "slug": "kurumsal-kimlik", "icon": "kimlik", "title": "Kurumsal Kimlik",
        "short": "Logo, renk ve tipografi sistemi, kartvizitten ambalaja.",
        "lead": "Markanızın ilk izlenimini tasarlıyoruz. Logodan kartvizite, ambalajdan tabelaya kadar her yerde tutarlı, akılda kalan bir kimlik.",
        "img": "mola-kimlik-1.jpg", "cats": ["kimlik"],
        "about": "Önce markanızı, rakiplerinizi ve hedef kitlenizi anlıyor; ardından logo alternatifleri, renk paleti, tipografi ve kullanım kurallarını içeren bir kimlik sistemi oluşturuyoruz. Tüm dosyalar baskıya ve dijitale hazır teslim edilir.",
        "checks": ["Marka analizi", "3 farklı logo konsepti", "Renk & tipografi sistemi", "Kurumsal kimlik kılavuzu", "Baskıya hazır dosyalar", "Sosyal medya şablonları"],
        "subs": [
            ("Logo Tasarımı", "Özgün, ölçeklenebilir ve her zeminde çalışan logo tasarımı."),
            ("Marka Kılavuzu", "Logo kullanımı, renkler, yazı tipleri ve örnek uygulamalar."),
            ("Kurumsal Evrak", "Kartvizit, antetli kâğıt, zarf, dosya ve e-posta imzası."),
            ("Ambalaj & Etiket", "Ürün ambalajı, etiket, paket ve kutu tasarımları."),
            ("Menü & Katalog", "Restoran menüleri, ürün katalogları ve fiyat listeleri."),
            ("Yeniden Markalama", "Mevcut markanızı koruyarak modern bir görünüme taşıma."),
        ],
        "faq": [
            ("Kaç logo alternatifi sunuyorsunuz?", "İlk sunumda 3 farklı konsept sunuyor, seçtiğiniz konsept üzerinden revizyonlarla ilerliyoruz."),
            ("Logonun telif hakları kime ait?", "Teslimden sonra logonun tüm kullanım hakları size aittir; kaynak dosyalar da teslim edilir."),
            ("Hangi dosya formatlarını teslim ediyorsunuz?", "Vektörel (AI, PDF, SVG) ve dijital (PNG, JPG) formatlarda, renkli/tek renk/negatif versiyonlarla teslim ediyoruz."),
            ("Marka tescili yapıyor musunuz?", "Tescil işlemlerini anlaşmalı marka vekillerimiz aracılığıyla yönlendirebiliyoruz."),
        ],
    },
    {
        "slug": "video-produksiyon", "icon": "video", "title": "Video & Fotoğraf",
        "short": "Reels, tanıtım filmi, ürün ve mekân çekimleri.",
        "lead": "İlk 3 saniyede dikkat çeken, markanızı hikâyeyle anlatan videolar ve satış getiren profesyonel fotoğraflar üretiyoruz.",
        "img": "lina-sosyal-2.jpg", "cats": ["sosyal"],
        "about": "Senaryo, çekim, kurgu, renk düzenleme, müzik ve altyazı dahil tüm prodüksiyonu ekibimizle yürütüyoruz. Dikey (Reels/TikTok) ve yatay (YouTube/tanıtım) formatlarda teslim ediyoruz.",
        "checks": ["Senaryo & storyboard", "4K çekim ekipmanı", "Drone çekimi", "Kurgu & renk düzenleme", "Müzik & altyazı", "Dikey + yatay format"],
        "subs": [
            ("Reels & TikTok", "Trendlere uygun, hızlı kurgulu dikey kısa videolar."),
            ("Tanıtım Filmi", "Firmanızı ve üretim sürecinizi anlatan kurumsal filmler."),
            ("Ürün Fotoğrafı", "E-ticaret ve katalog için stüdyo ürün çekimleri."),
            ("Mekân & Yemek Çekimi", "Restoran, kafe, otel ve mağazalar için atmosfer çekimleri."),
            ("Drone Çekimi", "İnşaat, gayrimenkul ve etkinlikler için havadan görüntüler."),
            ("Animasyon & Motion", "Logo animasyonu, infografik ve hareketli reklam görselleri."),
        ],
        "faq": [
            ("Bir Reels videosu ne kadar sürede hazır olur?", "Çekimden sonra kurgu ve revizyonlar dahil genellikle 2–4 iş günü içinde teslim ediyoruz."),
            ("Çekim için stüdyonuza mı gelmeliyiz?", "Ürün çekimlerini stüdyoda, mekân ve tanıtım çekimlerini yerinde yapıyoruz."),
            ("Müzik telifleri ne olacak?", "Videolarda lisanslı ya da telifsiz müzik kullanıyoruz; reklamlarda gönül rahatlığıyla kullanabilirsiniz."),
            ("Ham görüntüleri de alabilir miyim?", "Talep halinde ham çekim dosyalarını da teslim edebiliyoruz."),
        ],
    },
]
SVC = {s["slug"]: s for s in SERVICES}

# Ortak süreç adımları
PROCESS = [
    ("Keşif", "Markanızı, hedef kitlenizi ve rakiplerinizi dinliyoruz. Mevcut durumunuzu ücretsiz analiz ediyoruz."),
    ("Strateji & Teklif", "Hedeflerinize göre kapsamı, takvimi ve bütçeyi netleştirip şeffaf bir teklif sunuyoruz."),
    ("Tasarım & Üretim", "Onayladığınız tasarımı kendi ekibimiz ve atölyemizle hayata geçiriyoruz."),
    ("Teslim & Destek", "Uygulama, yayın ve montajı yapıyor; sonrasında da yanınızda olmaya devam ediyoruz."),
]

# ---------------------------------------------------------------------------
# 4) PORTFOLYO
#   Gerçek bir proje eklemek için: görselleri assets/img/work/ klasörüne koyun,
#   aşağıya yeni bir sözlük ekleyin ve "konsept": False yapın.
# ---------------------------------------------------------------------------
PROJECTS = [
    {
        "slug": "mola-coffee-web-sitesi", "title": "Mola Coffee Co. Web Sitesi", "client": "Mola Coffee Co.",
        "cat": "web", "year": "2026", "konsept": True, "featured": True,
        "services": ["Web Tasarım", "Fotoğraf", "SEO"],
        "summary": "Üç şubeli bir kahve markası için sıcak, davetkâr ve mobilde hızlı bir web sitesi.",
        "need": "Marka, Instagram'daki samimi atmosferini web'e taşımak; menüyü, şubeleri ve çalışma saatlerini tek yerde göstermek istiyordu.",
        "solution": ["Kahve tonlarında, serif tipografili sıcak bir arayüz", "Mobilde tek elle gezilebilen menü ve şube bilgileri", "Google Haritalar ve paket servis bağlantıları", "Hızlı yüklenen, SEO uyumlu yapı"],
        "images": [("mola-web-1.jpg", "Masaüstü ve mobil görünüm"), ("mola-web-2.jpg", "Ana sayfa — tam görünüm", "tall"), ("mola-web-3.jpg", "Mobil ekranlar")],
    },
    {
        "slug": "vadi-gayrimenkul-web-sitesi", "title": "Vadi Gayrimenkul Web Sitesi", "client": "Vadi Gayrimenkul",
        "cat": "web", "year": "2026", "konsept": True, "featured": True,
        "services": ["Web Tasarım", "İlan Altyapısı", "SEO"],
        "summary": "Premium konut portföyü için güven veren, ilan aramayı kolaylaştıran bir emlak sitesi.",
        "need": "Ofis, portföyünü sahibinden ilanlarından bağımsız, kendi markasıyla sunabileceği prestijli bir vitrine ihtiyaç duyuyordu.",
        "solution": ["Koyu yeşil ve altın tonlarında lüks bir görsel dil", "Durum, konum, tip ve bütçeye göre hızlı ilan arama", "Öne çıkan portföy kartları ve ücretsiz ekspertiz formu", "Her ilan için paylaşılabilir detay sayfası"],
        "images": [("vadi-web-1.jpg", "Masaüstü ve mobil görünüm"), ("vadi-web-2.jpg", "Ana sayfa — tam görünüm", "tall"), ("vadi-web-3.jpg", "Mobil ekranlar")],
    },
    {
        "slug": "atlas-oto-web-sitesi", "title": "Atlas Oto Servis Web Sitesi", "client": "Atlas Oto Servis",
        "cat": "web", "year": "2026", "konsept": True,
        "services": ["Web Tasarım", "Online Randevu", "Google Ads"],
        "summary": "Oto servis için online randevu odaklı, güçlü ve dinamik bir web sitesi.",
        "need": "Telefonla gelen randevu yükünü azaltmak ve Google aramalarından daha fazla müşteri kazanmak istiyordu.",
        "solution": ["Sarı-siyah, sanayi ruhunu yansıtan güçlü tasarım", "Her sayfadan erişilen hızlı randevu formu", "Hizmet sayfaları ve kampanya alanları", "Google Ads açılış sayfası entegrasyonu"],
        "images": [("atlas-web-1.jpg", "Masaüstü ve mobil görünüm"), ("atlas-web-2.jpg", "Ana sayfa — tam görünüm", "tall"), ("atlas-web-3.jpg", "Mobil ekranlar")],
    },
    {
        "slug": "lina-butik-e-ticaret", "title": "Lina Butik E-Ticaret Sitesi", "client": "Lina Butik",
        "cat": "web", "year": "2026", "konsept": True,
        "services": ["E-Ticaret", "Ürün Fotoğrafı", "Meta Ads"],
        "summary": "Butik giyim markası için zarif, satış odaklı bir e-ticaret deneyimi.",
        "need": "Instagram'dan DM ile yürüyen satışları, ödeme ve kargo entegrasyonlu bir online mağazaya taşımak gerekiyordu.",
        "solution": ["Editoryal dergi hissi veren minimal arayüz", "Koleksiyon, kategori ve indirim kurgusu", "Online ödeme ve kargo entegrasyonu", "Instagram mağazası ve Meta piksel kurulumu"],
        "images": [("lina-web-1.jpg", "Masaüstü ve mobil görünüm"), ("lina-web-2.jpg", "Ana sayfa — tam görünüm", "tall"), ("lina-web-3.jpg", "Mobil ekranlar")],
    },
    {
        "slug": "mola-coffee-isikli-tabela", "title": "Mola Coffee Co. Işıklı Tabela", "client": "Mola Coffee Co.",
        "cat": "tabela", "year": "2026", "konsept": True, "featured": True,
        "services": ["Işıklı Kutu Harf", "Bayrak Tabela", "Cam Giydirme"],
        "summary": "Tuğla cephe üzerinde sıcak beyaz LED'li kutu harf, yuvarlak bayrak tabela ve vitrin yazıları.",
        "need": "Kafenin gece de sokaktan fark edilmesi ve tuğla cepheyle uyumlu, sıcak bir görünüm elde edilmesi isteniyordu.",
        "solution": ["Ahşap görünümlü zemin üzerine krem renkli ışıklı kutu harf", "Yaya trafiğine dik, çift taraflı yuvarlak bayrak tabela", "Camlarda kesim folyo menü ve çalışma saati yazıları", "Sıcak beyaz LED ile atmosfere uygun aydınlatma"],
        "images": [("mola-tabela-1.jpg", "Gece görünümü"), ("mola-tabela-2.jpg", "Gündüz görünümü"), ("mola-tabela-3.jpg", "Kutu harf detayı")],
    },
    {
        "slug": "vadi-gayrimenkul-cephe", "title": "Vadi Gayrimenkul Cephe & Vitrin", "client": "Vadi Gayrimenkul",
        "cat": "tabela", "year": "2026", "konsept": True, "featured": True,
        "services": ["Cephe Giydirme", "Paslanmaz Harf", "Vitrin Tasarımı"],
        "summary": "Kompozit panel cephe kaplama, arkadan aydınlatmalı altın paslanmaz harfler ve ilan vitrini.",
        "need": "Ofisin, sattığı lüks konutlara yakışan prestijli bir cephe ile caddede güven vermesi gerekiyordu.",
        "solution": ["Koyu yeşil kompozit panel ile bütünlüklü cephe", "Altın renk paslanmaz, arkadan aydınlatmalı (halo) harfler", "Vitrinde değiştirilebilir ilan çerçeveleri", "Buzlu cam folyo ile 'Ücretsiz Ekspertiz' alanı"],
        "images": [("vadi-tabela-1.jpg", "Gece görünümü"), ("vadi-tabela-2.jpg", "Gündüz görünümü"), ("vadi-tabela-3.jpg", "Halo harf detayı")],
    },
    {
        "slug": "atlas-oto-servis-tabela", "title": "Atlas Oto Servis Tabela", "client": "Atlas Oto Servis",
        "cat": "tabela", "year": "2026", "konsept": True,
        "services": ["Işıklı Kutu Tabela", "Bayrak Tabela", "Cephe"],
        "summary": "Sanayi sitesinde uzaktan okunan, yüksek kontrastlı sarı ışıklı kutu tabela.",
        "need": "Aynı caddede onlarca servis arasında uzaktan fark edilen, gece de okunan bir tabela gerekiyordu.",
        "solution": ["Markanın sarı-siyah renkleriyle yüksek kontrast", "Gece-gündüz okunurluk için iç aydınlatmalı kutu tabela", "Yan yoldan görünür bayrak tabela", "Kepenk ve cam yüzeylerde yönlendirme yazıları"],
        "images": [("atlas-tabela-1.jpg", "Gece görünümü"), ("atlas-tabela-2.jpg", "Gündüz görünümü"), ("atlas-tabela-3.jpg", "Tabela detayı")],
    },
    {
        "slug": "atlas-oto-arac-giydirme", "title": "Atlas Oto Servis Araç Giydirme", "client": "Atlas Oto Servis",
        "cat": "arac", "year": "2026", "konsept": True, "featured": True,
        "services": ["Araç Giydirme", "Filo Tasarımı"],
        "summary": "Yol yardım ve servis panelvanları için dinamik, uzaktan okunan araç giydirme.",
        "need": "Servis araçlarının şehir içinde gezerken markayı tanıtması ve yol yardım hizmetini duyurması isteniyordu.",
        "solution": ["Hareket hissi veren çapraz sarı şeritler", "İki yanda simetrik, okunaklı marka yerleşimi", "Mat siyah ve sarı cast folyo, 7 yıl dayanım", "Tüm filo için ölçekli uygulama şablonu"],
        "images": [("atlas-arac-1.jpg", "Uygulama görünümü"), ("atlas-arac-2.jpg", "Uygulama şablonu — sol ve sağ yan")],
    },
    {
        "slug": "lina-butik-billboard", "title": "Lina Butik Billboard Kampanyası", "client": "Lina Butik",
        "cat": "acikhava", "year": "2026", "konsept": True, "featured": True,
        "services": ["Billboard", "Kampanya Tasarımı", "Raket Uyarlaması"],
        "summary": "Yeni sezon ve sezon sonu indirimini duyuran billboard ve raket kampanyası.",
        "need": "Yeni sezon lansmanını şehir genelinde duyurup mağaza ve online satışları artırmak hedefleniyordu.",
        "solution": ["3 saniyede okunacak sade mesaj ve güçlü görsel", "İndirim oranını öne çıkaran yuvarlak rozet", "Billboard, raket ve sosyal medya için uyarlamalar", "Online mağazaya yönlendiren tutarlı kampanya dili"],
        "images": [("lina-billboard-1.jpg", "Billboard uygulaması"), ("lina-billboard-2.jpg", "Kampanya görseli")],
    },
    {
        "slug": "mola-coffee-kurumsal-kimlik", "title": "Mola Coffee Co. Kurumsal Kimlik", "client": "Mola Coffee Co.",
        "cat": "kimlik", "year": "2026", "konsept": True,
        "services": ["Logo", "Marka Kılavuzu", "Ambalaj", "Menü"],
        "summary": "Kahve markası için logo, renk paleti, ambalaj, kartvizit ve menü tasarımı.",
        "need": "Yeni açılan kahve markasının samimi ama özenli bir karakterle akılda kalması gerekiyordu.",
        "solution": ["Serif logotype ve 'm' monogramı", "Espresso, terra, kum ve krem renk paleti", "Kraft çanta, bardak, etiket ve kartvizit uygulamaları", "Menü ve sosyal medya şablonları"],
        "images": [("mola-kimlik-1.jpg", "Kimlik uygulamaları"), ("mola-kimlik-2.jpg", "Logo, renk ve tipografi sistemi")],
    },
    {
        "slug": "lina-butik-sosyal-medya", "title": "Lina Butik Sosyal Medya", "client": "Lina Butik",
        "cat": "sosyal", "year": "2026", "konsept": True,
        "services": ["Sosyal Medya Yönetimi", "İçerik Tasarımı", "Reels"],
        "summary": "Instagram için tutarlı, editoryal görünümlü içerik dili ve aylık yönetim.",
        "need": "Hesabın dağınık görünümünü toparlayıp markanın zarif kimliğini yansıtan bir profil oluşturmak gerekiyordu.",
        "solution": ["Ürün, tipografi ve kampanya postlarından oluşan grid kurgusu", "Pudra-siyah renk dengesiyle tanınır feed", "Öne çıkanlar ve biyografi düzeni", "Haftalık Reels ve kampanya story'leri"],
        "images": [("lina-sosyal-1.jpg", "Instagram profil görünümü"), ("lina-sosyal-2.jpg", "Post tasarımları")],
    },
]
