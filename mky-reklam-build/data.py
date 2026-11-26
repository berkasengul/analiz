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
    ("baski", "Baskı & Uygulama"),
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
        "img": "genc-web-1.jpg", "cats": ["web"], "feature": True,
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
        "img": "real/216-barber-shop.jpg", "cats": ["tabela"], "feature": True,
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
        "img": "real/north-bayrak.jpg", "cats": ["arac", "baski", "acikhava"],
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
        "img": "genc-web-3.jpg", "cats": ["web", "sosyal"],
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
        "img": "real/uv-baski.jpg", "cats": ["baski", "sosyal"],
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
    # ------------------------- GERÇEK İŞLER -------------------------
    {
        "slug": "genc-anadolu-gida-web-sitesi", "title": "Genç Anadolu Gıda Web Sitesi", "client": "Genç Anadolu Gıda",
        "cat": "web", "year": "", "konsept": False, "featured": True, "url": "https://gencanadolugida.com.tr/",
        "services": ["Web Tasarım", "Ürün Kataloğu", "Toptan Teklif Formu"],
        "summary": "Solagron dondurularak kurutulmuş meyve ve ResQ hazır gıda ürünlerinin toptan satışını yapan Genç Anadolu Gıda için kurumsal web sitesi.",
        "need": "Firmanın ürün gruplarını, 48 ürünlük kataloğunu ve toptan satış sürecini; akaryakıt istasyonlarından otellere kadar farklı işletmelere net biçimde anlatması gerekiyordu.",
        "solution": ["Markanın bordo-krem renkleriyle sıcak ve güven veren arayüz", "Ürün grupları ve tek tek ürün detay sayfaları", "İşletme tipine göre 'kimler satıyor?' bölümü", "Toptan teklif formu ve tek dokunuşla arama", "Mobil uyumlu, hızlı ve SEO uyumlu yapı"],
        "images": [("genc-web-1.jpg", "Masaüstü ve mobil görünüm"), ("genc-web-2.jpg", "Ana sayfa — tam görünüm", "tall"), ("genc-web-3.jpg", "Mobil ekranlar")],
    },
    {
        "slug": "216-barber-shop-isikli-tabela", "pos": "50% 32%", "title": "216 Barber Shop Işıklı Tabela", "client": "216 Barber Shop",
        "cat": "tabela", "year": "", "konsept": False, "featured": True,
        "services": ["Işıklı Harf Tabela", "Cephe Uygulaması"],
        "summary": "Köşe konumdaki berber dükkânı için ön ve yan cepheye uygulanan ışıklı harf tabela.",
        "solution": ["Ön cephe ve yan cephede iki ayrı ışıklı harf uygulaması", "Gece uzaktan okunan beyaz aydınlatma", "Logoya sadık harf ve ikon üretimi", "Montaj ve elektrik bağlantısı"],
        "images": [("real/216-barber-shop.jpg", "Gece görünümü")],
    },
    {
        "slug": "efsa-saglik-cephe-tabela", "title": "Efsa Sağlık Cephe Tabelası", "client": "Efsa Sağlık · Özel Evde Bakım Merkezi",
        "cat": "tabela", "year": "", "konsept": False, "featured": True,
        "services": ["Işıklı Tabela", "LED Aydınlatma", "Cephe Uygulaması"],
        "summary": "Köşe binada iki cepheyi saran ışıklı tabela ve LED şerit aydınlatma uygulaması.",
        "solution": ["Bina köşesini dönen, iki cepheden görünen tabela", "Tabela bandı boyunca renkli LED aydınlatma", "Firma adı ve hizmet bilgisinin okunaklı yerleşimi", "Gece de dikkat çeken cephe görünümü"],
        "images": [("real/efsa-saglik.jpg", "Gece görünümü")],
    },
    {
        "slug": "sende-gel-isikli-tabela", "title": "Sende Gel Işıklı Tabela", "client": "Sende Gel",
        "cat": "tabela", "year": "", "konsept": False, "featured": True,
        "services": ["Işıklı Kutu Harf", "Figürlü Tabela"],
        "summary": "Mağaza cephesi için ışıklı kutu harf ve iki yanda karakter figürlü özel kesim tabela.",
        "solution": ["Beyaz ve kırmızı ışıklı kutu harfler", "Markanın maskot karakterleriyle özel kesim figürler", "Siyah zemin üzerinde yüksek kontrast", "Gece-gündüz okunurluk"],
        "images": [("real/sende-gel.jpg", "Gece görünümü")],
    },
    {
        "slug": "aisha-kuru-temizleme-totem", "pos": "50% 30%", "title": "Aisha Kuru Temizleme Totem & Yönlendirme", "client": "Aisha Kuru Temizleme",
        "cat": "tabela", "year": "", "konsept": False, "featured": True,
        "services": ["Totem Tabela", "Dijital Baskı", "Yönlendirme"],
        "summary": "Kuru temizleme dükkânına yönlendiren, hizmetleri listeleyen dikey totem pano.",
        "solution": ["Yoldan görünen dikey totem formu", "Logo, telefon ve yön oku ile net yönlendirme", "Hizmet listesinin okunaklı tipografisi", "Dış ortama dayanıklı baskı"],
        "images": [("real/aisha-kuru-temizleme.jpg", "Uygulama")],
    },
    {
        "slug": "viola-isikli-kabartma-harf", "title": "Viola Işıklı Kabartma Harf", "client": "Viola",
        "cat": "tabela", "year": "", "konsept": False,
        "services": ["Işıklı Kabartma Harf", "Atölye Üretimi"],
        "summary": "Arkadan aydınlatmalı altın renk kabartma harflerle üretilen tabela; atölyemizde montaj öncesi.",
        "solution": ["Altın renk kabartma harfler", "Harflerin arkasından sıcak ışık veren aydınlatma", "Çerçeveli, özel kesim tabela zemini", "Kendi atölyemizde üretim"],
        "images": [("real/viola.jpg", "Atölyede üretim")],
    },
    {
        "slug": "north-beach-restaurant", "pos": "78% 72%", "title": "North Beach & Restaurant Menü ve Bayraklar", "client": "North Beach & Restaurant",
        "cat": "baski", "year": "", "konsept": False, "featured": True,
        "services": ["Menü Tasarım & Baskı", "Yelken Bayrak"],
        "summary": "Plaj restoranı için yaldız logolu menü kabı ve sahile dikilen yelken bayraklar.",
        "solution": ["Koyu zemin üzerine altın yaldız logolu menü kabı", "Logolu, çift taraflı yelken bayraklar", "Plaj koşullarına dayanıklı malzemeler", "Marka kimliğiyle tutarlı uygulama"],
        "images": [("real/north-bayrak.jpg", "Plaj yelken bayrakları"), ("real/north-menu.jpg", "Menü kabı")],
    },
    {
        "slug": "mubi-co-baski", "pos": "35% 78%", "title": "Mubi Co. Bardak Baskı & Ekran Tasarımı", "client": "Mubi Co.",
        "cat": "baski", "year": "", "konsept": False,
        "services": ["Bardak Baskı", "Dijital Menü Tasarımı"],
        "summary": "İçecek markası için logolu bardak baskısı ve mağaza içi dijital ekran görselleri.",
        "solution": ["Şeffaf bardaklara logo baskısı", "Dijital ekranlar için ürün ve kampanya görselleri", "Marka renkleriyle tutarlı tasarım dili"],
        "images": [("real/mubi-co.jpg", "Bardak ve dijital ekran")],
    },
    {
        "slug": "tunc-balik-stant", "pos": "50% 45%", "title": "Tunç Balık Stant & Logo Uygulaması", "client": "Tunç Balık",
        "cat": "baski", "year": "", "konsept": False,
        "services": ["Logo Levha", "Stant Uygulaması"],
        "summary": "Etkinlik için hazırlanan ahşap stanta yuvarlak logo levha ve üçgen alınlık uygulaması.",
        "solution": ["Büyük ebat yuvarlak logo levha", "Alınlıkta ikinci logo uygulaması", "Ahşap stant üzerine montaj"],
        "images": [("real/tunc-balik.jpg", "Stant uygulaması")],
    },
    {
        "slug": "uv-baski-uygulamasi", "title": "UV Baskı Uygulaması", "client": "Atölye",
        "cat": "baski", "year": "", "konsept": False, "video": "uv-baski.mp4",
        "services": ["UV Baskı", "Yönlendirme Levhası"],
        "summary": "UV baskı makinemizde levha üzerine doğrudan baskı; yönlendirme ve isimlik üretimi.",
        "solution": ["Levha, ahşap, cam ve metal gibi sert yüzeylere doğrudan baskı", "Yüksek çözünürlük ve canlı renkler", "Yönlendirme, kapı isimliği ve dekoratif levha üretimi"],
        "images": [("real/uv-baski.jpg", "UV baskı makinesi")],
    },
    {
        "slug": "kibris-drift-2025-sticker", "title": "Kıbrıs 2025 Drift Yarışı Araç Stickerları", "client": "Kıbrıs Drift Yarışı",
        "cat": "arac", "year": "2025", "konsept": False, "featured": False, "video": "kibris-drift-sticker.mp4",
        "services": ["Dijital Baskı", "Araç Sticker"],
        "summary": "Kıbrıs 2025 Drift yarışında kullanılacak araçlara uygulanmak üzere stickerların baskısı.",
        "solution": ["Araç yüzeyine uygun folyoya dijital baskı", "Yarış araçları için büyük ebat sticker setleri", "Kesim ve uygulamaya hazır teslim"],
        "images": [("real/kibris-drift-sticker.jpg", "Baskı aşaması")],
    },
    # ------------------------- KONSEPT ÖRNEKLER -------------------------
    # Gerçek işiniz olmayan kategorilerde örnek olarak duruyor; istemezseniz silebilirsiniz.
    {'slug': 'atlas-oto-arac-giydirme',
     'title': 'Atlas Oto Servis Araç Giydirme',
     'client': 'Atlas Oto Servis',
     'cat': 'arac',
     'year': '2026',
     'konsept': True,
     'featured': False,
     'services': ['Araç Giydirme', 'Filo Tasarımı'],
     'summary': 'Yol yardım ve servis panelvanları için dinamik, uzaktan okunan araç giydirme.',
     'need': 'Servis araçlarının şehir içinde gezerken markayı tanıtması ve yol yardım hizmetini duyurması isteniyordu.',
     'solution': ['Hareket hissi veren çapraz sarı şeritler',
                  'İki yanda simetrik, okunaklı marka yerleşimi',
                  'Mat siyah ve sarı cast folyo, 7 yıl dayanım',
                  'Tüm filo için ölçekli uygulama şablonu'],
     'images': [('atlas-arac-1.jpg', 'Uygulama görünümü'), ('atlas-arac-2.jpg', 'Uygulama şablonu — sol ve sağ yan')]},
    {'slug': 'lina-butik-billboard',
     'title': 'Lina Butik Billboard Kampanyası',
     'client': 'Lina Butik',
     'cat': 'acikhava',
     'year': '2026',
     'konsept': True,
     'featured': False,
     'services': ['Billboard', 'Kampanya Tasarımı', 'Raket Uyarlaması'],
     'summary': 'Yeni sezon ve sezon sonu indirimini duyuran billboard ve raket kampanyası.',
     'need': 'Yeni sezon lansmanını şehir genelinde duyurup mağaza ve online satışları artırmak hedefleniyordu.',
     'solution': ['3 saniyede okunacak sade mesaj ve güçlü görsel',
                  'İndirim oranını öne çıkaran yuvarlak rozet',
                  'Billboard, raket ve sosyal medya için uyarlamalar',
                  'Online mağazaya yönlendiren tutarlı kampanya dili'],
     'images': [('lina-billboard-1.jpg', 'Billboard uygulaması'), ('lina-billboard-2.jpg', 'Kampanya görseli')]},
    {'slug': 'mola-coffee-kurumsal-kimlik',
     'title': 'Mola Coffee Co. Kurumsal Kimlik',
     'client': 'Mola Coffee Co.',
     'cat': 'kimlik',
     'year': '2026',
     'konsept': True,
     'services': ['Logo', 'Marka Kılavuzu', 'Ambalaj', 'Menü'],
     'summary': 'Kahve markası için logo, renk paleti, ambalaj, kartvizit ve menü tasarımı.',
     'need': 'Yeni açılan kahve markasının samimi ama özenli bir karakterle akılda kalması gerekiyordu.',
     'solution': ["Serif logotype ve 'm' monogramı",
                  'Espresso, terra, kum ve krem renk paleti',
                  'Kraft çanta, bardak, etiket ve kartvizit uygulamaları',
                  'Menü ve sosyal medya şablonları'],
     'images': [('mola-kimlik-1.jpg', 'Kimlik uygulamaları'), ('mola-kimlik-2.jpg', 'Logo, renk ve tipografi sistemi')],
     'featured': False},
    {'slug': 'lina-butik-sosyal-medya',
     'title': 'Lina Butik Sosyal Medya',
     'client': 'Lina Butik',
     'cat': 'sosyal',
     'year': '2026',
     'konsept': True,
     'services': ['Sosyal Medya Yönetimi', 'İçerik Tasarımı', 'Reels'],
     'summary': 'Instagram için tutarlı, editoryal görünümlü içerik dili ve aylık yönetim.',
     'need': 'Hesabın dağınık görünümünü toparlayıp markanın zarif kimliğini yansıtan bir profil oluşturmak gerekiyordu.',
     'solution': ['Ürün, tipografi ve kampanya postlarından oluşan grid kurgusu',
                  'Pudra-siyah renk dengesiyle tanınır feed',
                  'Öne çıkanlar ve biyografi düzeni',
                  "Haftalık Reels ve kampanya story'leri"],
     'images': [('lina-sosyal-1.jpg', 'Instagram profil görünümü'), ('lina-sosyal-2.jpg', 'Post tasarımları')],
     'featured': False},
]
