import json, copy

M = "/home/user/analiz/demo-fabrikasi/markalar/"
KEYS = ["bold-istanbul", "silky-mardin", "piney-aegean", "minty-cappadocia", "pistachio-zeugma"]
HOME = KEYS
# İçerik: markanın Shopify ürün metinleri (paketler) + Instagram duyurusundaki kutu bilgileri. TR: çeviri.
P = {
 "bold-istanbul": dict(
    name="Bold Istanbul", band="#1f2d5e", acc="#7fb2e6", city=("İstanbul", "Istanbul"),
    tag=("Koyu ve yoğun. %100 doğal, sıfır şeker, düşük kalori.", "Dark & rich. 100% natural, zero sugar, low calories."),
    desc=("Bu kadim harmanın zengin, aromatik lezzetini Bold Istanbul ile yaşayın. Elle seçilmiş en iyi kahve çekirdeklerinden yapılan bu seçkin harman, sizi Türkiye'nin hareketli şehrinin canlı sokaklarında bir yolculuğa çıkarıyor. Aralık'ta ABD lansmanının yıldızı.",
          "Experience the rich, aromatic flavors of this ancient blend with Bold Istanbul. Made from the finest handpicked coffee beans, this exquisite blend takes you on a journey through the vibrant streets of Türkiye's bustling city. The star of the US launch this December."),
    notes=(["Koyu & yoğun", "%100 doğal", "Sıfır şeker", "Düşük kalori"], ["Dark & rich", "100% natural", "Zero sugar", "Low calories"]),
    comp=(["Şehir: İstanbul · Galata, Kız Kulesi, Boğaz", "Profil: Koyu & yoğun", "%100 doğal · sıfır şeker · düşük kalori"],
          ["City: Istanbul · Galata, Maiden's Tower, the Bosphorus", "Profile: Dark & rich", "100% natural · zero sugar · low calories"])),
 "silky-mardin": dict(
    name="Silky Mardin", band="#36aae4", acc="#f6c434", city=("Mardin", "Mardin"),
    tag=("Sütlü ve kremsi: fıstık, kakao, vanilya, kakule, damla sakızı.", "Milky & creamy: pistachio, cacao, vanilla, cardamom, mastic gum."),
    desc=("Silky Mardin'in lüks kucaklayışını yaşayın: sizi Mardin'in büyüleyici manzaralarına taşıyan, rafine ve kadifemsi bir kahve. Mardin ile dinler, diller ve medeniyetler arasında bir yolculuğa çıkacaksınız.",
          "Experience the luxurious embrace of Silky Mardin, a truly refined and velvety coffee blend that transports you to the enchanting landscapes of Mardin. Immerse yourself in the opulence and elegance of this exceptional coffee."),
    notes=(["Sütlü & kremsi", "Fıstık", "Kakao", "Vanilya", "Kakule", "Damla sakızı"], ["Milky & creamy", "Pistachio", "Cacao", "Vanilla", "Cardamom", "Mastic gum"]),
    comp=(["Şehir: Mardin · taş evler ve kemerler", "Profil: Sütlü & kremsi", "Fıstık · Kakao · Vanilya · Kakule · Damla sakızı"],
          ["City: Mardin · stone houses and arches", "Profile: Milky & creamy", "Pistachio · Cacao · Vanilla · Cardamom · Mastic gum"])),
 "piney-aegean": dict(
    name="Piney Aegean", band="#e7699c", acc="#7fd0e6", city=("Ege", "Aegean"),
    tag=("Damla sakızı ve Akdeniz otları.", "Mastic gum & Mediterranean herbs."),
    desc=("Ege bölgesi lezzetli tatlılarıyla bilinir; Piney Aegean, turkuaz cennetin damla sakızı lezzetini size getiriyor. Egzotik baharat dokunuşlarıyla tatlı lezzetlerin narin dengesi, onu geleneksel Türk tatlıları ve hamur işleri için mükemmel bir eşlikçi yapıyor.",
          "The Aegean region is known for its delicious sweets, and Piney Aegean brings the mastic gum flavor of the turquoise paradise to you. The delicate balance of sweet flavors infused with hints of exotic spices makes it a perfect complement to traditional Turkish desserts and pastries."),
    notes=(["Damla sakızı", "Akdeniz otları"], ["Mastic gum", "Mediterranean herbs"]),
    comp=(["Şehir: Ege · İzmir Saat Kulesi ve antik kemerler", "Profil: Damla sakızı & Akdeniz otları"],
          ["City: Aegean · İzmir Clock Tower and ancient arches", "Profile: Mastic gum & Mediterranean herbs"])),
 "minty-cappadocia": dict(
    name="Minty Cappadocia", band="#eab431", acc="#7fd8b0", city=("Kapadokya", "Cappadocia"),
    tag=("Nane ve kakule.", "Mint & cardamom."),
    desc=("Minty Cappadocia ile duyusal bir yolculuğa çıkın: kakulenin serinleten kucaklayışı Türk kahvesinin zenginliğiyle uyum içinde buluşuyor. Gelenekten ve yenilikten bir tat sunan ferahlatıcı bir karışım.",
          "Embark on a sensory journey with Minty Cappadocia, where the cooling embrace of cardamom mingles harmoniously with the richness of Turkish coffee. This refreshing infusion offers a taste of tradition and innovation."),
    notes=(["Nane", "Kakule"], ["Mint", "Cardamom"]),
    comp=(["Şehir: Kapadokya · peri bacaları ve balonlar", "Profil: Nane & kakule"],
          ["City: Cappadocia · fairy chimneys and balloons", "Profile: Mint & cardamom"])),
 "pistachio-zeugma": dict(
    name="Pistachio Zeugma", band="#a0be5c", acc="#e9d27a", city=("Zeugma", "Zeugma"),
    tag=("Sütlü ve kafeinsiz, yabani fıstıkla.", "Milky & decaf, with wild pistachio."),
    desc=("Pistachio Zeugma'nın tadına varmak yalnızca farklı bir lezzet deneyimi değil; Akdeniz mirası boyunca bir yolculuk. Yüzyıllık fıstık geleneğinin sizi zarafet ve ihtişam dolu bir dünyaya taşımasına izin verin.",
          "Savoring Pistachio Zeugma isn't just about experiencing a different flavor; it's about embarking on a journey through Mediterranean heritage. Let the centuries-old tradition of pistachio indulgence transport you to a world of elegance and opulence."),
    notes=(["Sütlü & kafeinsiz", "Yabani fıstık"], ["Milky & decaf", "Wild pistachio"]),
    comp=(["Şehir: Zeugma · Çingene Kızı mozaiği, Gaziantep Kalesi", "Profil: Sütlü & kafeinsiz", "Yabani fıstık"],
          ["City: Zeugma · the Gypsy Girl mosaic, Gaziantep Castle", "Profile: Milky & decaf", "Wild pistachio"])),
}


def dark(h, f):
    r, g, b = (int(h[i:i + 2], 16) for i in (1, 3, 5))
    return "#%02x%02x%02x" % tuple(int(x * f) for x in (r, g, b))


A = {"domain": "turkishcoffeelady.com", "platform": "merx", "namePrefix": "^$", "idPrefix": "", "defaultSize": "250 ml",
     "themeGlow": 0.3, "gallery": False, "home": HOME, "profiles": {},
     "categories": [{"id": "iced", "tr": "Buzlu Türk Kahvesi", "en": "Iced Turkish Coffee", "color": "#9c4a36",
                     "descTr": "Beş şehir, beş tat; 250 ml, çalkala ve soğuk iç.", "descEn": "Five cities, five flavors; 250 ml, shake well and drink cold.", "match": "."}],
     "rename": {}, "families": {}, "taglines": {}, "notes": [], "library": [], "palette": [], "trText": {}, "enText": {}}
for h in KEYS:
    p = P[h]
    A["rename"][h] = [p["name"], p["name"]]
    A["families"][h] = [f"Buzlu Türk Kahvesi · {p['city'][0]}", f"Iced Turkish Coffee · {p['city'][1]}"]
    A["taglines"][h] = list(p["tag"])
    A["trText"][h], A["enText"][h] = p["desc"]
    A["notes"].append([f"^{h}$", [[a, b] for a, b in zip(*p["notes"])][:4]])
    A["library"].append({"match": f"^{h}$", "composition": {"tr": p["comp"][0], "en": p["comp"][1]}})
    A["palette"].append([f"^{h}$", dark(p["band"], 0.55 if h != "bold-istanbul" else 1.0), p["acc"]])
A["ritual"] = [
    {"handle": "bold-istanbul", "tr": {"title": "Aralık · ABD", "text": "Yeniden markalaştırılan buzlu Türk kahvesi serisi, Aralık'ta ABD'de sıfır şekerli Bold Istanbul ile raflarda.", "stat": "Bold Istanbul · sıfır şeker"},
     "en": {"title": "December · USA", "text": "The rebranded iced Turkish coffee line launches in the US this December, led by zero-sugar Bold Istanbul.", "stat": "Bold Istanbul · zero sugar"}},
    {"handle": "silky-mardin", "tr": {"title": "500 yıllık miras, buzlu", "text": "500 yıllık Türk kahvesi mirasını yeni zirvelere taşıyor; Türk kahvesini her zaman, her yerde erişilebilir kılıyoruz.", "stat": "Silky Mardin · sütlü & kremsi"},
     "en": {"title": "500 years, iced", "text": "Taking the 500-year heritage of Turkish coffee to new heights, and making Turkish coffee accessible anytime, anywhere.", "stat": "Silky Mardin · milky & creamy"}},
    {"handle": "piney-aegean", "tr": {"title": "Anadolu'nun Türk Kahvesi Öyküleri", "text": "500 yıllık Türk kahvesinin zengin kültürel mirası, 8 farklı şehirde, farklı kültürlerle anlatılıyor. Belgesel 5 Aralık Dünya Türk Kahvesi Günü'nde Amerika'dan yola çıkıyor.", "stat": "Piney Aegean · damla sakızı"},
     "en": {"title": "Turkish Coffee Tales of Anatolia", "text": "The rich cultural heritage of 500-year-old Turkish coffee, told across 8 cities and cultures. The documentary premieres from the US on December 5, World Turkish Coffee Day.", "stat": "Piney Aegean · mastic gum"}},
]
K = {"foto": {"ai": True, "studio": True, "views": False, "hero": [[".", 1]], "backHead": "NOTES", "pedestal": True}, "aktar": A}
json.dump(K, open(M + "turkishcoffeelady-kurallar.json", "w"), ensure_ascii=False, indent=1)

c = json.load(open(M + "illusione.json"))
c = {k: v for k, v in c.items() if k not in ("products", "home", "ritual", "discovery", "langs")}
c["slug"] = "turkishcoffeelady"
c["defaultLang"] = "en"
c["langs"] = ["en", "tr"]
c["latinTerms"] = "Bold Istanbul|Silky Mardin|Piney Aegean|Minty Cappadocia|Pistachio Zeugma|Good Coffee. Good Fortune.|Shake well. Drink cold."
c["meta"] = {"title": "Turkish Coffee Lady · Concept Demo", "description": "A 3D concept demo for Turkish Coffee Lady's new iced Turkish coffee line. Not affiliated with the brand owner.",
             "og": "Turkish Coffee Lady: Good Coffee. Good Fortune."}
den = ("This page is an independent concept demo prepared for Turkish Coffee Lady and is not affiliated with the brand owner. "
       "The cans are rendered after the brand's announced new design, using the watercolor city artwork from its own packaging; copy is taken from the brand's websites and announcement.")
dtr = ("Bu sayfa Turkish Coffee Lady için hazırlanmış bağımsız bir konsept demodur ve marka sahibiyle bağlantılı değildir. "
       "Kutular markanın duyurduğu yeni tasarıma göre, kendi paketlerindeki suluboya şehir çizimleriyle yeniden çizilmiştir; metinler markanın sitelerinden ve duyurusundan alınmıştır.")
c["brand"] = {"name": "Turkish Coffee Lady", "sub": "Good Coffee. Good Fortune.", "specs": "Iced Turkish Coffee · 250 ml", "disclaimer": dtr,
              "en": {"sub": "Good Coffee. Good Fortune.", "specs": "Iced Turkish Coffee · 8.5 fl oz", "disclaimer": den}}
c["specs"] = {"tr": "Buzlu Türk Kahvesi · 250 ml", "en": "Iced Turkish Coffee · 8.5 fl oz"}
F = [
    ("star", {"rotY": 0.03, "rotZ": 0.02, "y": -0.2, "scale": 2.4},
     {"short": "Good Fortune", "kicker": "Nazar", "struck": "Sıradan kutu", "title": "Good Coffee. Good Fortune.", "text": "Her kutuda tadın renginde bir nazar boncuğu ve kendi şehrinin suluboya çizimi: İstanbul, Mardin, Ege, Kapadokya, Zeugma."},
     {"short": "Good Fortune", "kicker": "Evil eye", "struck": "A plain can", "title": "Good Coffee. Good Fortune.", "text": "Every can carries an evil eye in its flavor's color and a watercolor of its own city: Istanbul, Mardin, the Aegean, Cappadocia, Zeugma."}),
    ("leaf", {"rotY": 0.5, "rotZ": 0.02, "y": 0.6, "scale": 2.2},
     {"short": "Aralık lansmanı", "kicker": "ABD", "struck": "Yalnızca cezvede", "title": "Aralık'ta ABD'de", "text": "Seri Aralık'ta ABD'de raflara çıkıyor; ilk kutu %100 doğal, sıfır şekerli ve düşük kalorili Bold Istanbul."},
     {"short": "December launch", "kicker": "USA", "struck": "Only in a cezve", "title": "In the US this December", "text": "The line hits US shelves this December, led by Bold Istanbul: 100% natural, zero sugar, low calories."}),
    ("drop", {"rotY": 3.18, "rotZ": 0.02, "y": -0.2, "scale": 2.4},
     {"short": "Çalkala, soğuk iç", "kicker": "250 ml", "struck": "Cezve, ocak", "title": "Shake well. Drink cold.", "text": "500 yıllık Türk kahvesi, 250 ml'lik kutuda hazır; her zaman, her yerde."},
     {"short": "Shake well", "kicker": "8.5 fl oz", "struck": "Cezve and stove", "title": "Shake well. Drink cold.", "text": "500 years of Turkish coffee, ready in an 8.5 fl oz can; anytime, anywhere."}),
    ("bottle", {"rotY": -0.4, "rotZ": 0.02, "y": 0.2, "scale": 2.3},
     {"short": "16 yıllık marka", "kicker": "Global", "struck": "Yeni bir deneme", "title": "16 yıllık global bir marka", "text": "Türk kahvesi kültürünü dünyanın dört bir yanında yaşatmak ve yeni nesillere taşımak için kurulmuş, Amerika'da ve dünyada büyüyen bir aile."},
     {"short": "16 years", "kicker": "Global", "struck": "A newcomer", "title": "A global brand, 16 years on", "text": "Founded to keep Turkish coffee culture alive around the world and carry it to new generations, a family growing in the US and worldwide."}),
]
c["features"] = [{"icon": i, "pose": p, "tr": t, "en": e} for i, p, t, e in F]
c["prices"] = {k: {"currency": "USD", "locale": "en-US" if k == "en" else "tr-TR", "packs": {"1": 0}, "freeShipping": 0, "shipping": 0} for k in ("tr", "en")}
st = {"tr": {"lead": "Bir fincan kahvenin kırk yıl hatırı vardır.",
             "paragraphs": ["Turkish Coffee Lady, dünyanın dört bir yanında zengin Türk kahvesi kültürünü yaşatmak ve yeni nesillere taşımak için kurulmuş 16 yıllık global bir marka. Geleneksel Türk kahvesine dair zengin bilgi mirasını, özgün harmanları ve yüzyıllardır süregelen kültürel ritüelleri modern tüketici alışkanlıklarıyla buluşturuyor.",
                            "Yeniden markalaştırılan buzlu Türk kahvesi serisi, 2025'te katıldığı InvestBev hızlandırma programıyla bir araya gelen ekiple hayata geçti ve Aralık'ta ABD'de sıfır şekerli Bold Istanbul ile raflara çıkıyor.",
                            "Bayileri, kültür atölyeleri, tadım etkinlikleri ve kadın girişimcileri güçlendiren sosyal programlarla bulundukları topluluklarda fark yaratıyor."],
             "timeline": [["2009", "Kurucu Gizem Şalcıgil White'ın Türk kahvesi elçiliği başlıyor"], ["Alexandria, VA", "Turkish Coffee Lady Culture House"],
                          ["2025", "InvestBev hızlandırma programı"], ["Aralık", "Buzlu Türk kahvesi ABD lansmanı · 5 Aralık Dünya Türk Kahvesi Günü"]],
             "stats": [["5", "şehir, 5 tat"], ["500", "yıllık miras"], ["250 ml", "çalkala, soğuk iç"]]},
      "en": {"lead": "A cup of coffee is remembered for forty years.",
             "paragraphs": ["Turkish Coffee Lady is a global brand, 16 years in the making, founded to keep the rich culture of Turkish coffee alive around the world and carry it to new generations. It brings the heritage of traditional Turkish coffee, original blends and centuries-old rituals together with modern habits.",
                            "The rebranded iced Turkish coffee line came to life with the team formed through the InvestBev accelerator in 2025, and launches in the US this December with zero-sugar Bold Istanbul.",
                            "Its partners make a difference in their communities with culture workshops, tastings and social programs that empower women entrepreneurs."],
             "timeline": [["2009", "Founder Gizem Şalcıgil White begins her Turkish coffee ambassadorship"], ["Alexandria, VA", "Turkish Coffee Lady Culture House"],
                          ["2025", "InvestBev accelerator program"], ["December", "Iced Turkish coffee US launch · December 5, World Turkish Coffee Day"]],
             "stats": [["5", "cities, 5 flavors"], ["500", "years of heritage"], ["8.5 fl oz", "shake well, drink cold"]]}}
c["story"] = {"founder": "Gizem Şalcıgil White", "instagram": "https://www.instagram.com/turkishcoffeelady/", "website": "https://turkishcoffeelady.com/", "press": [], "tr": st["tr"], "en": st["en"]}
c["faqs"] = {
    "tr": [["Buzlu Türk kahvesi ne zaman satışta?", "Yeniden markalaştırılan seri Aralık'ta ABD'de, sıfır şekerli Bold Istanbul ile satışa çıkıyor."],
           ["Kaç tat var?", "Beş şehir, beş tat: Bold Istanbul (koyu & yoğun), Silky Mardin (sütlü & kremsi), Piney Aegean (damla sakızı & Akdeniz otları), Minty Cappadocia (nane & kakule), Pistachio Zeugma (sütlü & kafeinsiz)."],
           ["Kutu ne kadar?", "Her kutu 250 ml (8.5 fl oz). Çalkala, soğuk iç."],
           ["Şekerli mi?", "Bold Istanbul %100 doğal, sıfır şekerli ve düşük kalorili."],
           ["Bayilik ya da lisanslama mümkün mü?", "Evet. Lisanslama ve iş birliği fırsatları için hello@turkishcoffeelady.com adresine yazın; Türkiye'de bayilik başvurusu turkishcoffeelady.com.tr üzerinden."],
           ["Türk kahvesi paketleri nereden alınır?", "Bold Istanbul, Silky Mardin, Piney Aegean, Minty Cappadocia ve Pistachio Zeugma öğütülmüş Türk kahvesi paketleri turkishcoffeelady.com'da."]],
    "en": [["When can I buy the iced Turkish coffee?", "The rebranded line launches in the US this December, led by zero-sugar Bold Istanbul."],
           ["How many flavors are there?", "Five cities, five flavors: Bold Istanbul (dark & rich), Silky Mardin (milky & creamy), Piney Aegean (mastic gum & Mediterranean herbs), Minty Cappadocia (mint & cardamom), Pistachio Zeugma (milky & decaf)."],
           ["How big is a can?", "8.5 fl oz (250 ml). Shake well, drink cold."],
           ["Is it sweetened?", "Bold Istanbul is 100% natural, zero sugar and low calorie."],
           ["Can I stock or license it?", "Yes. For licensing and partnership opportunities write to hello@turkishcoffeelady.com; dealership applications in Türkiye via turkishcoffeelady.com.tr."],
           ["Where can I buy the ground Turkish coffee?", "Bold Istanbul, Silky Mardin, Piney Aegean, Minty Cappadocia and Pistachio Zeugma ground coffee are available at turkishcoffeelady.com."]]}
UI = {"tr": copy.deepcopy(c["ui"]["tr"]), "en": copy.deepcopy(c["ui"]["en"])}
UI["tr"].update({
    "loading": "Good Coffee. Good Fortune.", "madeFor": "Turkish Coffee Lady için hazırlanmış konsept", "recyclable": "Buzlu Türk Kahvesi · 250 ml",
    "founder": "Kurucu · Turkish Coffee Lady", "contactTag": "Lisanslama, bayilik ve iş birliği için hello@turkishcoffeelady.com.",
    "newsTitle": "Lansmandan ilk sen haberdar ol.", "slogan": "Good Coffee. Good Fortune.",
    "marquee": ["Good Coffee. Good Fortune.", "Buzlu Türk kahvesi", "Shake well. Drink cold.", "Beş şehir, beş tat", "Aralık · ABD", "500 yıllık miras"],
    "shopTag": "Lansman Aralık'ta; listeye katıl, ilk sen haberdar ol.", "packPerCan": "Turkish Coffee Lady · {0}",
    "perks": ["Aralık'ta ABD'de", "Bold Istanbul: sıfır şeker", "Beş şehir, beş tat"],
    "addToCart": "Lansman listesine katıl", "added": "Lansman listesine katıl", "taxes": "", "checkoutNote": "", "ships": "Aralık'ta ABD'de",
    "allTag": "{0} tat; beş şehir.", "whereEyebrow": "Nerede", "whereTitle": "Turkish Coffee Lady'yi nerede bulursunuz", "whereTag": "ABD'de ve Türkiye'de.",
    "place": "Yer", "spot": "Adres", "status": "Durum",
    "finder": {"eyebrow": "Tat bulucu", "title": "Şehrini bul", "lead": "Üç soru; cevaplarına göre kutun kendi şehrinde kaideye iniyor.", "empty": "Kutun buraya inecek",
               "result": "Senin kutun", "discover": "Tadı keşfet", "add": "Lansman listesine katıl", "added": "Lansman listesine katıl", "again": "Baştan başla", "also": "Bunları da dene", "back": "Geri",
               "questions": [["Kahveni nasıl seversin?", [["Koyu ve sade", {"warm": 1}], ["Sütlü ve kremsi", {"sweet": 1}], ["Ferah, naneli", {"fresh": 1}], ["Bitkisel, sakızlı", {"floral": 1}]]],
                             ["En çok ne zaman lazım?", [["Sabah, güne başlarken", {"warm": 0.7, "fresh": 0.3}], ["Öğleden sonra keyfi", {"sweet": 0.7, "floral": 0.3}], ["Yazın, deniz kenarında", {"floral": 0.6, "fresh": 0.4}], ["Akşam, kafeinsiz", {"sweet": 1}]]],
                             ["Hangi şehir seni çağırıyor?", [["İstanbul", {"warm": 1}], ["Mardin", {"sweet": 0.7, "warm": 0.3}], ["Ege", {"floral": 1}], ["Kapadokya", {"fresh": 1}]]]]},
})
UI["en"].update({
    "loading": "Good Coffee. Good Fortune.", "madeFor": "Concept prepared for Turkish Coffee Lady", "recyclable": "Iced Turkish Coffee · 8.5 fl oz",
    "founder": "Founder · Turkish Coffee Lady", "contactTag": "Licensing, partnerships and wholesale: hello@turkishcoffeelady.com.",
    "newsTitle": "Be the first to know at launch.", "slogan": "Good Coffee. Good Fortune.",
    "marquee": ["Good Coffee. Good Fortune.", "Iced Turkish coffee", "Shake well. Drink cold.", "Five cities, five flavors", "December · USA", "500 years of heritage"],
    "shopTag": "Launching in December; join the list and be the first to know.", "packPerCan": "Turkish Coffee Lady · {0}",
    "perks": ["Launching in the US in December", "Bold Istanbul: zero sugar", "Five cities, five flavors"],
    "addToCart": "Join the launch list", "added": "Join the launch list", "taxes": "", "checkoutNote": "", "ships": "In the US this December",
    "allTag": "{0} flavors; five cities.", "whereEyebrow": "Where", "whereTitle": "Where to find Turkish Coffee Lady", "whereTag": "In the US and in Türkiye.",
    "place": "Place", "spot": "Address", "status": "Status",
    "finder": {"eyebrow": "Flavor finder", "title": "Find your city", "lead": "Three questions; your can lands on the plinth in its own city.", "empty": "Your can will land here",
               "result": "Your can", "discover": "Discover the flavor", "add": "Join the launch list", "added": "Join the launch list", "again": "Start over", "also": "Also try", "back": "Back",
               "questions": [["How do you take your coffee?", [["Dark, no sugar", {"warm": 1}], ["Milky and creamy", {"sweet": 1}], ["Fresh and minty", {"fresh": 1}], ["Herbal, with mastic", {"floral": 1}]]],
                             ["When do you need it most?", [["Morning kick-off", {"warm": 0.7, "fresh": 0.3}], ["An afternoon treat", {"sweet": 0.7, "floral": 0.3}], ["Summer by the sea", {"floral": 0.6, "fresh": 0.4}], ["Evening, no caffeine", {"sweet": 1}]]],
                             ["Which city calls you?", [["Istanbul", {"warm": 1}], ["Mardin", {"sweet": 0.7, "warm": 0.3}], ["The Aegean", {"floral": 1}], ["Cappadocia", {"fresh": 1}]]]]},
})
UI["tr"].update({
    "nav": {"flavors": "Tatlar", "catalog": "Beş şehir", "categories": "Kategoriler", "products": "Tatlar", "sets": "Seri", "about": "Hikâye", "contact": "İletişim", "finder": "Tat bulucu", "story": "Hikâye", "faq": "SSS", "stockists": "Nerede", "ritual": "Lansman"},
    "flavors": "Tatlar", "notes": "Tat profili", "discover": "{0} tadını keşfet", "discoverCan": "Tadı keşfet", "backToFlavors": "Tatlara dön",
    "prevFlavor": "Önceki şehir", "nextFlavor": "Sonraki şehir", "backToFlavor": "Tada dön", "exploreCan": "Kutuyu keşfet · {0} hikâye",
    "whatsInside": "Kutunun içinde", "drag": "Kutuyu çevirmek için sürükle", "inCan": "Kutunun içinde", "shopTitle": "Şehrini seç", "flavor": "Tat",
    "mix": "Beş şehir seti", "caffeine": "Çalkala, soğuk iç.", "variant": "Tat", "related": "Diğer şehirler", "buildBox": "Tatları keşfet",
    "freeUnlocked": "Lansman listesi", "year": "Lansman", "composition": "Şehir ve tat", "family": "Seri", "perfumer": "Kurucu",
    "allEyebrow": "Beş şehir, beş tat", "allTitle": "Buzlu Türk kahvesi serisi", "exploreAll": "Beş şehri keşfet", "catalogTitle": "Tatlar",
    "searchPlaceholder": "Tat, şehir ya da içerik ara", "storyEyebrow": "Hikâye", "ritual": "Lansman", "shopEyebrow": "Lansman listesi",
    "scroll": "Keşfetmek için kaydır", "milestones": "Kilometre taşları", "press": "Basında", "faqTitle": "Merak edilenler", "contactTitle": "Bize yaz",
})
UI["en"].update({
    "nav": {"flavors": "Flavors", "catalog": "Five cities", "categories": "Categories", "products": "Flavors", "sets": "Series", "about": "Our story", "contact": "Contact", "finder": "Flavor finder", "story": "Story", "faq": "FAQ", "stockists": "Where", "ritual": "Launch"},
    "flavors": "Flavors", "notes": "Flavor profile", "discover": "Discover {0}", "discoverCan": "Discover the flavor", "backToFlavors": "Back to flavors",
    "prevFlavor": "Previous city", "nextFlavor": "Next city", "backToFlavor": "Back to flavor", "exploreCan": "Explore the can · {0} stories",
    "whatsInside": "Inside the can", "drag": "Drag to turn the can", "inCan": "Inside the can", "shopTitle": "Pick your city", "flavor": "Flavor",
    "mix": "Five-city set", "caffeine": "Shake well. Drink cold.", "variant": "Flavor", "related": "Other cities", "buildBox": "Explore the flavors",
    "freeUnlocked": "Launch list", "year": "Launch", "composition": "City and flavor", "family": "Series", "perfumer": "Founder",
    "allEyebrow": "Five cities, five flavors", "allTitle": "The iced Turkish coffee line", "exploreAll": "Explore all five cities", "catalogTitle": "Flavors",
    "searchPlaceholder": "Search a flavor, city or ingredient", "storyEyebrow": "Story", "ritual": "Launch", "shopEyebrow": "Launch list",
    "scroll": "Scroll to discover", "milestones": "Milestones", "press": "As seen at", "faqTitle": "Good questions", "contactTitle": "Write to us",
})
c["ui"] = UI
c["hide"] = []
c["stockists"] = {"tr": [["ABD", "Turkish Coffee Lady Culture House · Old Town Alexandria, VA", "Açık"], ["ABD", "Buzlu Türk kahvesi lansmanı", "Aralık"], ["Online", "turkishcoffeelady.com · öğütülmüş Türk kahvesi", "Açık"], ["Türkiye", "Bayilik başvurusu · turkishcoffeelady.com.tr", "Açık"]],
                  "en": [["USA", "Turkish Coffee Lady Culture House · Old Town Alexandria, VA", "Open"], ["USA", "Iced Turkish coffee launch", "December"], ["Online", "turkishcoffeelady.com · ground Turkish coffee", "Open"], ["Türkiye", "Dealership applications · turkishcoffeelady.com.tr", "Open"]]}
ci = {"tr": [["E-posta", ["hello@turkishcoffeelady.com"]], ["Web", ["turkishcoffeelady.com", "turkishcoffeelady.com.tr"]], ["Instagram", ["@turkishcoffeelady"]], ["İş birliği", ["Lisanslama ve bayilik"]]],
      "en": [["Email", ["hello@turkishcoffeelady.com"]], ["Web", ["turkishcoffeelady.com", "turkishcoffeelady.com.tr"]], ["Instagram", ["@turkishcoffeelady"]], ["Partnerships", ["Licensing and wholesale"]]]}
c["contactInfo"] = ci
c["logo"] = "brand/logo-cream.png"
c["icon"] = "drop"
c["labelBrand"] = {"wordmark": "TURKISH COFFEE", "submark": "LADY", "concentration": "ICED TURKISH COFFEE", "volume": "250 ml", "logoFile": "docs/brand/logo-cream.png"}
c["commerce"] = {"packs": False, "plans": False, "variety": False, "goal": None, "shippingAtCheckout": True,
                 "showcase": {"href": "mailto:hello@turkishcoffeelady.com?subject={text}",
                              "message": {"tr": "Lansman listesi · {0}", "en": "Launch list · {0}"}}}
c["spray"] = False
c["finder"] = {"keys": {"warm": ["dark", "koyu", "rich", "yoğun", "zero sugar", "sıfır şeker"], "sweet": ["milky", "sütlü", "creamy", "kremsi", "pistachio", "fıstık", "decaf", "kafeinsiz"],
                        "fresh": ["mint", "nane", "cardamom", "kakule"], "floral": ["mastic", "sakız", "herbs", "otları"]}}
t = c["theme"]
for k in ("decor", "fresh", "plinthColor", "numerals"): t.pop(k, None)
t.update({"accent": "#e8c79a", "carousel": "glide", "particles": "none", "petals": False, "pedestal": True, "studio": True,
          "fonts": {"href": "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..700;1,400..700&family=Nunito:wght@600;800;900&family=Jost:wght@300..500&display=swap",
                    "display": "\"Playfair Display\", Georgia, serif", "serif": "\"Playfair Display\", Georgia, serif", "sans": "\"Jost\", \"Helvetica Neue\", Arial, sans-serif"}})
c["catalog"] = {"homeCount": 8, "glow": "#2a2220", "categories": [], "items": []}
json.dump(c, open(M + "turkishcoffeelady.json", "w"), ensure_ascii=False, indent=2)
print("ok")
