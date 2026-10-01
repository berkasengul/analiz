"""Ephemeral Dyadic: kurallar + marka dosyası. Metinler markanın sitesinden (ürün sayfaları, manifesto, satış noktaları);
Türkçeleri çeviri. Uydurma yok: koleksiyon üyeliği, iade koşulları ve Instagram adresi sitede yok → kullanılmadı."""
import json, copy
M = "/home/user/analiz/demo-fabrikasi/markalar/"
KEYS = ["dark-dreams", "ozymandias", "liquid-skin", "psychic-vibrations", "another-world", "lost-chemistry", "acid-aqua", "bodhi-utah", "missing-feeling", "no-taboos"]
HOME = KEYS[:5]
N = lambda tr, en: [tr, en]
P = {
 "acid-aqua": dict(name="Acid Aqua", juice="#e8d36a",
   tag=("Bir örümcek gelmiş, yanına oturmuş.", "Along came a spider, who sat down beside her."),
   desc=("Küçük Hanım Muffet / tabureye oturmuş, / lor peyniri ve peynir altı suyu yerken; / bir örümcek gelmiş, / yanına oturmuş / ve Hanım Muffet'i korkutup kaçırmış.",
         "Little Miss Muffet / Sat on a tuffet, / Eating her curds and whey; / Along came a spider, / Who sat down beside her, / And frightened Miss Muffet away."),
   top=[N("Armut", "Pear"), N("Kumkat", "Kumquat")], mid=[N("Pembe biber", "Pink pepper"), N("Müge", "Muguet"), N("Kakule", "Cardamom")],
   base=[N("Sandal ağacı", "Sandalwood"), N("Ambroksan", "Ambroxan"), N("Beyaz misk", "White musk")]),
 "another-world": dict(name="Another World", juice="#d9dcaa",
   tag=("Ağaçlar baş aşağı, su siyah mürekkep.", "Trees are upside down and water is black ink."),
   desc=("Başka bir dünyaya gitsen bile, / ağaçların baş aşağı / ve suyun siyah mürekkep olduğu bir yere. / Parmaklar ona batırılmış. / DNA değişmiş. / Ne ses ne müzik. / Gölgeler sana ihanet etmez, / çünkü onlar hep senindi.",
         "Even if you go to another world, / where trees are upside down / and water is black ink. / Fingers dipped in it. / DNA mutated. / No sound no music. / Shadows will not betray you, / cause they always belonged to you."),
   top=[N("Mürekkep", "Ink"), N("Karabiber", "Black pepper")], mid=[N("Çam", "Pine")], base=[N("Sedir", "Cedarwood"), N("Beyaz misk", "White musk")]),
 "bodhi-utah": dict(name="Bodhi & Utah", juice="#cfc34a",
   tag=("Kanunun hizmetkârı olmak neden, efendisi olabilecekken?", "Why be a servant to the law, when you can be its master?"),
   desc=("“90 saniye, Johnny. Tek istediğim bu, hayatından sadece 90 saniye.” … “İstediğini yapabilir, kendi kurallarını koyabilirsin. Kanunun hizmetkârı olmak neden, efendisi olabilecekken?”",
         "“90 seconds Johnny. That's all I ask for, just 90 seconds of your life.” … “You can do what you want, and make up your own rules. Why be a servant to the law, when you can be its master?”"),
   top=[N("Kakule", "Cardamom"), N("Adaçayı", "Sage tea")], mid=[N("İris", "Iris"), N("Tonka", "Tonka")], base=[N("Mavi amber", "Blue amber"), N("Tütsü", "Incense")]),
 "dark-dreams": dict(name="Dark Dreams", juice="#e3dca0",
   tag=("Neonlar ve sigaralar, kiralık odalar.", "The neon's and the cigarettes, rented rooms."),
   desc=("Neonlar ve sigaralar / Kiralık odalar, kiralık arabalar / Kalabalık sokaklar, boş barlar / Bacalar ve trompetler",
         "The neon's and the cigarettes / Rented rooms and rented cars / The crowded streets, the empty bars / Chimney tops and trumpets"),
   top=[N("Sardunya", "Geranium"), N("Safran", "Saffron")], mid=[N("Mandalina", "Mandarin"), N("Bergamot", "Bergamot")], base=[N("Benzin", "Gasoline")]),
 "liquid-skin": dict(name="Liquid Skin", juice="#d8c23c",
   tag=("İki ay ve bin düşünce arasında sıkışmış.", "Stuck between two moons and a thousand thoughts."),
   desc=("İki ay ve bin düşünce arasında sıkışmış.", "Stuck between two moons and a thousand thoughts."),
   top=[N("Labdanum", "Labdanum"), N("Nagarmotha", "Nagarmotha")], mid=[N("Kırmızı tarçın", "Red cinnamon")], base=[N("Vetiver", "Vetiver"), N("Kuru tütün", "Dried tobacco")]),
 "lost-chemistry": dict(name="Lost Chemistry", juice="#e8a018",
   tag=("Çılgın, deli bir aşk.", "Crazy crazy mad love."),
   desc=("Her şeyden çok aşkı hayal ediyorum, çılgın, deli bir aşkı. Kalpleri kıran, savaşlar başlatan, hayatları mahveden, ruhuna kazınan; kalbin her attığında hissettiğin, hafızanı yakan ve yalnız kaldığında, ortalık sessizleşip dünya uzaklaştığında geri gelen aşkı.",
         "More than anything, I dream of love, crazy crazy mad love. The love that breaks hearts, starts wars, ruins lives, the love that sears itself into your soul, that you can feel every time your heart beats, that scorches your memory and comes back to you whenever you're alone and it's quiet and the world falls away."),
   top=[N("Amber", "Amber"), N("Kırmızı misk", "Red musk"), N("Ud ağacı", "Agarwood")], mid=[N("Ahududu", "Raspberry"), N("İncir", "Fig")], base=[N("Sandal ağacı", "Sandalwood")]),
 "missing-feeling": dict(name="Missing Feeling", juice="#e9e4c8",
   tag=("Şeftali ağaçlarının altında bir ağustos esintisi.", "An August breeze, under peach trees."),
   desc=("Bir ağustos esintisi; şeftali ağaçlarının altında Akdeniz düşleri.", "An August breeze, under peach trees and Mediterranean daydreams."),
   top=[N("Şeftali", "Peach")], mid=[N("Beyaz misk", "White musk")], base=[N("Şampanya", "Champagne")]),
 "no-taboos": dict(name="No Taboos", juice="#ece6c9",
   tag=("Hiç tabum yok.", "I got no taboos."),
   desc=("Bahanem yok, sadece beni kullanmanı istiyorum / Al beni, hırpala beni / Hiç tabum yok, seninle takas ederim / Ne istersen yaparım",
         "I've no excuse, I just want you to use me / Take me and abuse me / I got no taboos, I'll make trade with you / Do anything you want me to"),
   top=[N("Süt", "Milk"), N("Feromon karışımı", "Pheromone mix")], mid=[N("Siyah yasemin", "Black jasmine"), N("Kırmızı amber", "Red amber")],
   base=[N("Misk", "Musk"), N("Amber", "Amber"), N("Paçuli", "Patchouli")]),
 "ozymandias": dict(name="Ozymandias", juice="#d9b84a",
   tag=("Eserlerime bakın, ey kudretliler, ve umudu kesin!", "Look on my Works, ye Mighty, and despair!"),
   desc=("Kadim bir diyardan gelen bir yolcuyla karşılaştım… Kaidede şu sözler yazılı: “Adım Ozymandias, krallar kralı; / Eserlerime bakın, ey kudretliler, ve umudu kesin!” / Yanında hiçbir şey kalmamış.",
         "I met a traveller from an antique land… And on the pedestal, these words appear: / My name is Ozymandias, King of Kings; / Look on my Works, ye Mighty, and despair! / Nothing beside remains."),
   top=[N("Elemi", "Elemi"), N("Karabiber", "Black pepper")], mid=[N("Labdanum", "Labdanum"), N("Kaşmir ağacı", "Cashmere wood")], base=[N("Amber", "Amber"), N("Vanilya", "Vanilla")]),
 "psychic-vibrations": dict(name="Psychic Vibrations", juice="#d6b030",
   tag=("Hissedebiliyor musun?", "Can you feel it?"),
   desc=("Bilinçaltı duyguların gölgeleri / Elektrik dalgaları altında yankılanan sesler / Seğiren gözler, bedenin akışkanları / Sessizlikte büyüyen sonsuzluk / Hissedebiliyor musun?",
         "Shadows of subconcious sentiments / Sounds echoeing under electric waves / Eyes twitching, fluids of body flux / Infinity growing in silence / Can you feel it?"),
   top=[N("Kenevir", "Cannabis"), N("Tütsü", "Incense")], mid=[N("Müge", "Muguet"), N("İris", "Iris")], base=[N("Yanık vanilya", "Burned vanilla")]),
}


def mix(h, k, base="#141416"):
    a = [int(h[i:i + 2], 16) for i in (1, 3, 5)]; b = [int(base[i:i + 2], 16) for i in (1, 3, 5)]
    return "#%02x%02x%02x" % tuple(int(x * k + y * (1 - k)) for x, y in zip(a, b))


A = {"domain": "www.ephemeraldyadic.com", "platform": "merx", "namePrefix": "^$", "idPrefix": "", "defaultSize": "50 ml",
     "themeGlow": 0.26, "gallery": True, "home": HOME, "profiles": {},
     "categories": [{"id": "edp", "tr": "Eau de Parfum", "en": "Eau de Parfum", "color": "#d8d4cc",
                     "descTr": "50 ml Eau de Parfum; her koku bir ruh hâli, bir hatıra.", "descEn": "50 ml Eau de Parfum; every scent a feeling, a memory.", "match": "."}],
     "rename": {}, "families": {}, "taglines": {}, "notes": [], "library": [], "palette": [], "trText": {}, "enText": {}}
for h in KEYS:
    p = P[h]
    A["rename"][h] = [p["name"], p["name"]]
    A["families"][h] = ["Eau de Parfum", "Eau de Parfum"]
    A["taglines"][h] = list(p["tag"])
    A["trText"][h], A["enText"][h] = p["desc"]
    allnotes = p["top"] + p["mid"] + p["base"]
    A["notes"].append([f"^{h}$", allnotes[:5]])
    j = lambda xs, k: ", ".join(x[k] for x in xs)
    A["library"].append({"match": f"^{h}$", "composition": {
        "tr": [f"Üst notalar: {j(p['top'], 0)}", f"Orta notalar: {j(p['mid'], 0)}", f"Alt notalar: {j(p['base'], 0)}"],
        "en": [f"Top notes: {j(p['top'], 1)}", f"Middle notes: {j(p['mid'], 1)}", f"Base notes: {j(p['base'], 1)}"]}})
    # siyah-beyaz dünya (markanın kutuları gibi): sahne nötr koyu, vurgu kırık beyaz; renk yalnızca şişede
    A["palette"].append([f"^{h}$", "#171717", "#ece8e1"])
A["ritual"] = [
    {"handle": "dark-dreams", "tr": {"title": "Ephemeral", "text": "Kısa süren şey. Koku gibi dışımızdaki her şey geçicidir; duygularımız ve anılarımız kalıcıdır.", "stat": "Geçici"},
     "en": {"title": "Ephemeral", "text": "Something that lasts for a short time. External objects such as scents are ephemeral, while our emotions and memories are permanent.", "stat": "Ephemeral"}},
    {"handle": "liquid-skin", "tr": {"title": "Dyadic", "text": "İkiye dayanan, iki yanlı. Koku ile onu taşıyan arasındaki bağ.", "stat": "İki"},
     "en": {"title": "Dyadic", "text": "Relating to or based on two; twofold. The bond between the fragrance and the wearer.", "stat": "Twofold"}},
    {"handle": "ozymandias", "tr": {"title": "Nasıl hissettirdiği", "text": "Teninizdeki kimyasalı hatırlamayacaksınız; ama size nasıl hissettirdiğini ve bütün anılarını hatırlayacaksınız.", "stat": "His"},
     "en": {"title": "How it made you feel", "text": "You will not remember the chemical on your skin, but you will remember how it made you feel, and all the memories of it.", "stat": "Feel"}},
]
K = {"foto": {"ai": True, "studio": True, "views": False, "hero": [[".", 1]], "backPhotos": False, "pedestal": True, "backHead": "NOTES"}, "aktar": A}
GB = json.load(open(M + "ephemeraldyadic-glassback.json")) if __import__("os").path.exists(M + "ephemeraldyadic-glassback.json") else None
if GB:
    K["foto"]["glassBack"] = GB
json.dump(K, open(M + "ephemeraldyadic-kurallar.json", "w"), ensure_ascii=False, indent=1)

c = json.load(open(M + "illusione.json"))
c = {k: v for k, v in c.items() if k not in ("products", "home", "ritual", "discovery")}
c["slug"] = "ephemeraldyadic"
c["langs"] = ["en", "tr"]; c["defaultLang"] = "en"
c["latinTerms"] = "|".join(P[h]["name"] for h in KEYS) + "|Ephemeral Dyadic|Eau de Parfum|Ephemeral|Dyadic|Manifesto"
c["meta"] = {"title": "Ephemeral Dyadic · Concept Demo", "description": "A 3D concept demo for Ephemeral Dyadic. Not affiliated with the brand owner.", "og": "Ephemeral Dyadic: you will remember how it made you feel."}
den = ("This page is an independent concept demo prepared for Ephemeral Dyadic and is not affiliated with the brand owner. "
       "Texts, notes, prices and photos are taken from ephemeraldyadic.com; checkout happens on the brand's own store.")
dtr = ("Bu sayfa Ephemeral Dyadic için hazırlanmış bağımsız bir konsept demodur ve marka sahibiyle bağlantılı değildir. "
       "Metinler, notalar, fiyatlar ve fotoğraflar ephemeraldyadic.com'dan alınmıştır; ödeme markanın kendi mağazasında tamamlanır. Türkçe metinler çeviridir.")
c["brand"] = {"name": "Ephemeral Dyadic", "sub": "Created and produced in Istanbul", "specs": "Eau de Parfum · 50 ml", "disclaimer": dtr,
              "en": {"sub": "Created and produced in Istanbul", "specs": "Eau de Parfum · 50 ml", "disclaimer": den}}
c["specs"] = {"tr": "Eau de Parfum · 50 ml", "en": "Eau de Parfum · 50 ml / 1.7 oz"}
F = [
    ("star", {"rotY": 0.03, "rotZ": 0.02, "y": -0.2, "scale": 2.4},
     {"short": "Ephemeral", "kicker": "Ad", "struck": "Kalıcı koku", "title": "Ephemeral · Dyadic", "text": "‘Ephemeral’ geçici demek, ‘Dyadic’ iki şey arasındaki ilişkiyi anlatır: koku ile onu taşıyan arasındaki bağ."},
     {"short": "Ephemeral", "kicker": "The name", "struck": "A lasting scent", "title": "Ephemeral · Dyadic", "text": "‘Ephemeral’ means temporary; ‘Dyadic’ represents the relationship between two subjects: the bond between the fragrance and the wearer."}),
    ("leaf", {"rotY": 0.5, "rotZ": 0.02, "y": 0.6, "scale": 2.2},
     {"short": "Manifesto", "kicker": "Manifesto", "struck": "Taklit, beklenen", "title": "Gölgede özgürlük", "text": "“Bir sonraki büyük şey olmak için kendini kaybetmeye değer mi? Aşkın ve içtenliğin anları bir daha yaşanamaz.”"},
     {"short": "Manifesto", "kicker": "Manifesto", "struck": "Imitated, expected", "title": "Freedom of obscurity", "text": "“Is it worth losing yourself to be the next big thing? The moments of love and sincerity can never be relived.”"}),
    ("drop", {"rotY": 3.18, "rotZ": 0.02, "y": -0.2, "scale": 2.4},
     {"short": "İstanbul", "kicker": "Atölye", "struck": "Fabrika", "title": "İstanbul'da tasarlandı ve üretildi", "text": "Sanatçı Sinan Saul'un İstanbul'un sanayi bölgesindeki küçük sanat atölyesinde kurduğu bir parfüm projesi."},
     {"short": "Istanbul", "kicker": "Studio", "struck": "Factory", "title": "Created and produced in Istanbul", "text": "A perfume project founded by artist Sinan Saul in a small art studio in the industrial area of Istanbul."}),
    ("bottle", {"rotY": -0.4, "rotZ": 0.02, "y": 0.2, "scale": 2.3},
     {"short": "Dünyaya kargo", "kicker": "Kargo", "struck": "Sınırlar", "title": "Dünyanın her yerine ücretsiz kargo", "text": "Her kutunun kendi siyah-beyaz deseni var; 50 ml Eau de Parfum ve 10 x 2 ml keşif seti."},
     {"short": "Free shipping", "kicker": "Shipping", "struck": "Borders", "title": "Free shipping worldwide", "text": "Every box carries its own black-and-white artwork; 50 ml Eau de Parfum and a 10 x 2 ml discovery set."}),
]
c["features"] = [{"icon": i, "pose": p, "tr": t, "en": e} for i, p, t, e in F]
c["prices"] = {k: {"currency": "EUR", "locale": "en-IE" if k == "en" else "tr-TR", "packs": {"1": 170}, "freeShipping": 0, "shipping": 0} for k in ("tr", "en")}
st = {"tr": {"lead": "Kokuyu değil, size nasıl hissettirdiğini hatırlarsınız.",
             "paragraphs": ["Ephemeral Dyadic, sanatçı Sinan Saul'un İstanbul'un sanayi bölgesindeki küçük bir sanat atölyesinde kurduğu bir parfüm projesi.",
                            "Ana fikir şu: koku gibi dışımızdaki şeyler geçicidir, duygularımız ve anılarımız gibi içimizdekiler kalıcıdır. ‘Ephemeral’ geçici demek; ‘Dyadic’ iki özne arasındaki ilişkiyi, koku ile onu taşıyan arasındaki bağı anlatır.",
                            "Her koku bu iç duyguları ve anıları derin bir anlamla uyandırmayı ve hayatımızdaki önemlerini hatırlatmayı amaçlıyor."],
             "timeline": [["İstanbul", "Sanayi bölgesinde küçük bir sanat atölyesi"], ["Manifesto", "Gölgede özgürlük"], ["Dünyada", "Avrupa, ABD, Körfez ve Avustralya'da satış noktaları"]],
             "stats": [["50 ml", "Eau de Parfum"], ["10 x 2 ml", "keşif seti"], ["Ücretsiz", "dünyaya kargo"]]},
      "en": {"lead": "You will not remember the chemical on your skin, but you will remember how it made you feel.",
             "paragraphs": ["Ephemeral Dyadic is a perfume project founded by artist Sinan Saul in a small art studio in the industrial area of Istanbul.",
                            "The main idea behind the project is that external objects such as scents are ephemeral, while internal events such as our emotions and memories are permanent. ‘Ephemeral’ means temporary; ‘Dyadic’ represents the relationship between two subjects: the bond between the fragrance and the wearer.",
                            "Ephemeral Dyadic aims to evoke these inner feelings and memories in a profoundly meaningful way and remind us of their importance in our lives."],
             "timeline": [["Istanbul", "A small art studio in the industrial area"], ["Manifesto", "Freedom of obscurity"], ["Worldwide", "Stockists across Europe, the US, the Gulf and Australia"]],
             "stats": [["50 ml", "Eau de Parfum"], ["10 x 2 ml", "discovery set"], ["Free", "shipping worldwide"]]}}
c["story"] = {"founder": "Sinan Saul", "instagram": "", "website": "https://www.ephemeraldyadic.com/", "press": [], "tr": st["tr"], "en": st["en"]}
c["faqs"] = {
    "tr": [["Kargo ücretli mi?", "Hayır. Ephemeral Dyadic dünyanın her yerine ücretsiz kargo gönderiyor."],
           ["Şişeler kaç ml?", "Her koku 50 ml (1.7 oz) Eau de Parfum; fiyatı 170 €."],
           ["Kokuları önce deneyebilir miyim?", "Evet: keşif seti 10 kokunun 2 ml'lik şişelerini içeriyor (80 €)."],
           ["Mağazada nerede bulunur?", "Türkiye'de Shopigo ve Wunder; İtalya, Almanya, ABD, İspanya, Avusturya, Macaristan, Suudi Arabistan, Katar, BAE, Avustralya ve daha birçok ülkede seçkin parfümerilerde."],
           ["Nerede üretiliyor?", "İstanbul'da tasarlanıp üretiliyor."],
           ["İletişim", "info@ephemeraldyadic.com"]],
    "en": [["Is shipping free?", "Yes. Ephemeral Dyadic ships worldwide free of charge."],
           ["What size are the bottles?", "Each scent is 50 ml (1.7 oz) Eau de Parfum, priced at €170."],
           ["Can I try the scents first?", "Yes: the discovery set holds 2 ml vials of all 10 scents (€80)."],
           ["Where can I find it in store?", "Shopigo and Wunder in Türkiye; selected perfumeries in Italy, Germany, the US, Spain, Austria, Hungary, Saudi Arabia, Qatar, the UAE, Australia and more."],
           ["Where is it made?", "Created and produced in Istanbul."],
           ["Contact", "info@ephemeraldyadic.com"]]}
UI = {"tr": copy.deepcopy(c["ui"]["tr"]), "en": copy.deepcopy(c["ui"]["tr"])}
UI["tr"].update({
    "loading": "Ephemeral Dyadic", "madeFor": "Ephemeral Dyadic için hazırlanmış konsept", "recyclable": "Eau de Parfum · 50 ml",
    "founder": "Kurucu · sanatçı", "contactTag": "Soru, sipariş ve satış noktaları için info@ephemeraldyadic.com.",
    "newsTitle": "Yeni kokular önce burada.", "slogan": "Nasıl hissettirdiğini hatırlayacaksın.",
    "marquee": ["Ephemeral Dyadic", "İstanbul'da üretildi", "Gölgede özgürlük", "Eau de Parfum", "Dünyaya ücretsiz kargo"],
    "shopTitle": "Kokunu seç", "shopTag": "Ödeme ephemeraldyadic.com'da tamamlanır.", "packPerCan": "Ephemeral Dyadic · {0}",
    "perks": ["Dünyaya ücretsiz kargo", "50 ml Eau de Parfum", "İstanbul'da üretildi"], "taxes": "Dünyaya ücretsiz kargo",
    "checkoutNote": "Ödeme ephemeraldyadic.com'da tamamlanır", "ships": "Ücretsiz kargo", "allTag": "{0} koku; her biri bir ruh hâli.",
    "whereEyebrow": "Satış noktaları", "whereTitle": "Ephemeral Dyadic'i nerede bulursunuz", "whereTag": "Dünyanın dört bir yanında seçkin parfümerilerde.",
    "place": "Ülke", "spot": "Mağaza", "status": "Web",
    "nav": {"flavors": "Kokular", "catalog": "Tüm kokular", "categories": "Kategoriler", "products": "Kokular", "sets": "Koleksiyon", "about": "Manifesto", "contact": "İletişim", "finder": "Koku bulucu", "story": "Manifesto", "faq": "SSS", "stockists": "Satış noktaları", "ritual": "Ephemeral"},
    "ritual": "Ephemeral · Dyadic", "storyEyebrow": "Manifesto", "composition": "Nota piramidi", "family": "Seri", "perfumer": "Kurucu",
    "finder": {"eyebrow": "Koku bulucu", "title": "Ruh hâlini bul", "lead": "Üç soru; cevaplarına göre kokun kaideye iniyor.", "empty": "Kokun buraya inecek",
               "result": "Senin kokun", "discover": "Kokuyu keşfet", "add": "Sepete ekle", "added": "Eklendi", "again": "Baştan başla", "also": "Bunları da dene", "back": "Geri",
               "questions": [["Hangi an?", [["Sabaha karşı, neonların altında", {"warm": 1}], ["Ağustos, şeftali ağaçlarının altında", {"fresh": 0.6, "sweet": 0.4}], ["Atölyede, mürekkep ve ahşap", {"warm": 0.6, "fresh": 0.4}], ["Bir sırrın içinde", {"floral": 0.6, "sweet": 0.4}]]],
                             ["Seni ne çeker?", [["Deli bir aşk", {"sweet": 1}], ["Kuralları kendin koymak", {"warm": 0.7, "fresh": 0.3}], ["Sessizlikte büyüyen sonsuzluk", {"floral": 0.6, "warm": 0.4}], ["Başka bir dünya", {"fresh": 1}]]],
                             ["Tende ne kalsın?", [["Amber ve vanilya", {"sweet": 0.6, "warm": 0.4}], ["Tütsü ve tütün", {"warm": 1}], ["Beyaz misk", {"fresh": 0.5, "floral": 0.5}], ["Sandal ağacı", {"warm": 0.5, "sweet": 0.5}]]]]},
})
UI["en"].update({
    "loading": "Ephemeral Dyadic", "madeFor": "Concept prepared for Ephemeral Dyadic", "recyclable": "Eau de Parfum · 50 ml",
    "founder": "Founder · artist", "contactTag": "Questions, orders and stockists: info@ephemeraldyadic.com.",
    "newsTitle": "New scents land here first.", "slogan": "You will remember how it made you feel.",
    "marquee": ["Ephemeral Dyadic", "Created and produced in Istanbul", "Freedom of obscurity", "Eau de Parfum", "Free shipping worldwide"],
    "shopTitle": "Choose your scent", "shopTag": "Checkout completes on ephemeraldyadic.com.", "packPerCan": "Ephemeral Dyadic · {0}",
    "perks": ["Free shipping worldwide", "50 ml Eau de Parfum", "Created and produced in Istanbul"], "taxes": "Free shipping worldwide",
    "checkoutNote": "Checkout completes on ephemeraldyadic.com", "ships": "Free shipping", "allTag": "{0} scents; every one a feeling.",
    "whereEyebrow": "Stockists", "whereTitle": "Where to find Ephemeral Dyadic", "whereTag": "Selected perfumeries around the world.",
    "place": "Country", "spot": "Store", "status": "Web",
    "nav": {"flavors": "Scents", "catalog": "All scents", "categories": "Categories", "products": "Scents", "sets": "Collection", "about": "Manifesto", "contact": "Contact", "finder": "Scent finder", "story": "Manifesto", "faq": "FAQ", "stockists": "Stockists", "ritual": "Ephemeral"},
    "flavors": "Scents", "notes": "Notes", "discover": "Discover {0}", "discoverCan": "Discover the scent", "backToFlavors": "Back to scents",
    "prevFlavor": "Previous scent", "nextFlavor": "Next scent", "backToFlavor": "Back to scent", "exploreCan": "Explore · {0} stories",
    "whatsInside": "Notes", "drag": "Drag to turn the bottle", "inCan": "In this step", "flavor": "Scent", "mix": "Discovery set", "size": "Size", "cans": "item",
    "family": "Series", "caffeine": "For external use only.", "variant": "Option", "related": "Similar scents", "buildBox": "Explore the scents",
    "freeUnlocked": "Free shipping", "year": "Launch", "composition": "Notes pyramid", "perfumer": "Founder",
    "ritual": "Ephemeral · Dyadic", "storyEyebrow": "Manifesto", "allEyebrow": "All scents", "allTitle": "The collection", "exploreAll": "Explore all scents",
    "catalogTitle": "Scents", "searchPlaceholder": "Search a scent or a note", "scroll": "Scroll to discover", "faqTitle": "Good questions", "contactTitle": "Write to us",
    "finder": {"eyebrow": "Scent finder", "title": "Find your feeling", "lead": "Three questions; your scent lands on the plinth.", "empty": "Your scent will land here",
               "result": "Your scent", "discover": "Discover the scent", "add": "Add to bag", "added": "Added", "again": "Start over", "also": "Also try", "back": "Back",
               "questions": [["Which moment?", [["Before dawn, under neon", {"warm": 1}], ["August, under peach trees", {"fresh": 0.6, "sweet": 0.4}], ["In the studio, ink and wood", {"warm": 0.6, "fresh": 0.4}], ["Inside a secret", {"floral": 0.6, "sweet": 0.4}]]],
                             ["What pulls you?", [["Crazy mad love", {"sweet": 1}], ["Making your own rules", {"warm": 0.7, "fresh": 0.3}], ["Infinity growing in silence", {"floral": 0.6, "warm": 0.4}], ["Another world", {"fresh": 1}]]],
                             ["What should stay on skin?", [["Amber and vanilla", {"sweet": 0.6, "warm": 0.4}], ["Incense and tobacco", {"warm": 1}], ["White musk", {"fresh": 0.5, "floral": 0.5}], ["Sandalwood", {"warm": 0.5, "sweet": 0.5}]]]]},
})
c["ui"] = UI
c["hide"] = []
SK = [["Türkiye", "Turkey", "Shopigo · Wunder", "shopigo.com · wunder.com.tr"],
      ["İtalya", "Italy", "Antonioli (Milano), Profumi di Nicchia (Napoli), Valtellini (Rovato), Profumix (Modena), Poetry / Venom (Ravenna) ve diğerleri", ""],
      ["Almanya", "Germany", "Voo Store Berlin · 15 West Berlin · Woodberg Darmstadt", "voostore.com · 15west.de · woodberg.de"],
      ["ABD", "U.S.A.", "The Scentroom (Dallas, LA) · ZGO San Francisco · LRCHQEV NYC", "beautyliv.com"],
      ["İspanya", "Spain", "Linda Vuela a Río", "lindavuelaario.com"],
      ["Avusturya", "Austria", "Osmotheca", ""],
      ["Macaristan", "Hungary", "Epic Perfumes", "epicperfumery.com"],
      ["Suudi Arabistan", "KSA", "Lomary Boutique", "lomaryboutique.com"],
      ["Katar · BAE", "Qatar · UAE", "Jovoy", ""],
      ["Avustralya", "Australia", "The Garden of Spring", ""],
      ["Baltık", "Baltics", "Creme de la Creme (Estonya, Letonya, Litvanya)", ""],
      ["Diğer", "More", "Createur 5 d'Emotions (Romanya) · Footshop (Çekya) · Crime Passionel (Danimarka) · Mood Scent Bar (Polonya) · Perfumist (Belarus)", ""]]
c["stockists"] = {"tr": [[a, s.replace(" ve diğerleri", " ve diğerleri"), w] for a, _, s, w in SK],
                  "en": [[b, s.replace(" ve diğerleri", " and more").replace("(Estonya, Letonya, Litvanya)", "(Estonia, Latvia, Lithuania)").replace("(Romanya)", "(Romania)").replace("(Çekya)", "(Czech Republic)").replace("(Danimarka)", "(Denmark)").replace("(Polonya)", "(Poland)"), w] for _, b, s, w in SK]}
ci = {"tr": [["E-posta", ["info@ephemeraldyadic.com"]], ["Web", ["ephemeraldyadic.com"]], ["Kargo", ["Dünyaya ücretsiz"]], ["Atölye", ["İstanbul"]]],
      "en": [["Email", ["info@ephemeraldyadic.com"]], ["Web", ["ephemeraldyadic.com"]], ["Shipping", ["Free worldwide"]], ["Studio", ["Istanbul"]]]}
c["contactInfo"] = ci
c["logo"] = "brand/logo-white.png"
c["icon"] = "drop"
c["labelBrand"] = {"wordmark": "EPHEMERAL DYADIC", "submark": "", "concentration": "EAU DE PARFUM", "volume": "50 ml", "logoFile": "docs/brand/logo-white.png"}
c["commerce"] = {"packs": False, "plans": False, "variety": False, "goal": None, "shippingAtCheckout": True, "ikas": "https://www.ephemeraldyadic.com/category/all-products"}
c["spray"] = True
c["finder"] = {}
t = c["theme"]
for k in ("decor", "fresh", "plinthColor", "numerals"): t.pop(k, None)
t.update({"accent": "#ece8e1", "carousel": "glide", "arch": False, "brightWalls": True, "particles": "none", "petals": False, "epilogue": True, "plinthImage": "fon/kaide.webp", "pedestal": True, "studio": True,
          "fonts": {"href": "https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600&family=Cormorant+Garamond:ital,wght@0,400..600;1,400..600&family=Jost:wght@300..500&display=swap",
                    "display": "\"Oswald\", \"Helvetica Neue\", Arial, sans-serif", "serif": "\"Cormorant Garamond\", Georgia, serif", "sans": "\"Jost\", \"Helvetica Neue\", Arial, sans-serif"}})
c["catalog"] = {"homeCount": 10, "glow": "#1a1a1c", "categories": [], "items": []}
json.dump(c, open(M + "ephemeraldyadic.json", "w"), ensure_ascii=False, indent=2)
print("ok")
