"""Lalive: 3B modeli olmayan katalog ürünlerini (vücut, saç, sabun, alet, set,
Self-Care Club) content'e 3B ürün olarak ekler ve katalog kayıtlarını bağlar.
Fotoğrafı olmayan ürünlerin ambalajı temsilidir (sayfa notunda yazıyor).

Kullanım: python3 demo-fabrikasi/markalar/lalive-urunler.py   (lalive.json güncellenir)
Tekrar çalıştırmak güvenlidir: eklenen ürünler önce silinir.
"""
import json
import os

HERE = os.path.dirname(os.path.abspath(__file__))
PATH = os.path.join(HERE, "lalive.json")
CREAM = [232, 222, 194]
GREEN = [31, 51, 38]


def rgb(h):
    h = h.lstrip("#")
    return [int(h[i:i + 2], 16) for i in (0, 2, 4)]


def label(bg, ink, en, tr, lines, volume, back, **kw):
    lv = {"bg": bg, "ink": ink, "layout": "bottle", "en": en, "tr": tr, "lines": lines, "volume": volume,
          "back": back, "backTop": kw.pop("backTop", 0.22), "lineSize": kw.pop("lineSize", 34)}
    lv.update(kw)
    return {"plate": [240, 234, 222], "ink": [60, 52, 40], "star": [120, 110, 80], "place": "ASSOS · KORUOBA",
            "scene": "none", "style": "lalive", "lalive": lv}


def bottle(w, h, d, corner, lw, lh, cap, **kw):
    b = {"glass": {"width": w, "height": h, "depth": d, "corner": corner},
         "label": {"width": lw, "height": lh, "y": kw.pop("labelY", 0.0), "back": True},
         "neck": {"radius": kw.pop("neckR", 0.3), "height": kw.pop("neckH", 0.1), "color": kw.pop("neckColor", "#101010")},
         "cap": cap, "scale": kw.pop("scale", 1.05), "tilt": -0.04}
    b.update(kw)
    return b


NONE_CAP = {"shape": "none", "radius": 0.1, "height": 0, "color": "#000000", "finish": "black"}
BAR = dict(neckH=0)

P = [
    # ---------------------------------------------------------------- vücut
    dict(id="vucut-yagi", name="Vücut Yağı", en_name="Body Oil", sub="Vücut yağı", en_sub="Body oil",
         family="Vücut bakımı", en_family="Body care", color="#b98a5a",
         theme={"glow": "#6e4a26", "edge": "#080502", "drop": "#f1dcb8", "mood": "warm"},
         tagline="Nemlendirir, yağlı his bırakmaz.", en_tagline="Moisturises without a greasy feel.",
         notes=["Zeytinyağı", "E vitamini", "Elastikiyet"], en_notes=["Olive oil", "Vitamin E", "Elasticity"],
         desc="Zeytinyağı ve E vitaminiyle cildi nemlendirir, elastikiyetini artırır; hızlı emilir ve yağlı his bırakmaz.",
         en_desc="With olive oil and vitamin E it moisturises skin and improves elasticity; absorbs fast with no greasy feel.",
         bottle=bottle(1.6, 2.9, 1.0, 0.3, 1.5, 2.2, {"shape": "pump", "radius": 0.36, "height": 0.9, "color": "#121212", "finish": "black"},
                       tint="#4a2e14", tintOpacity=0.92, labelY=-0.15),
         label=label([58, 38, 20], CREAM, "BODY OIL", "doğal vücut yağı", ["Zeytinyağı · E Vitamini"], "",
                     [{"text": "Zeytinyağı ve E vitaminiyle cildi nemlendirir, elastikiyetini artırır. Yağlı his bırakmaz."},
                      {"head": "KULLANIM", "text": "Duştan sonra nemli cilde masaj yaparak uygulayınız."}],
                     badgeY=0.16, logoY=0.46, logoSize=200, enSize=40, trSize=32)),
    dict(id="roll-on", name="Doğal Roll-On", en_name="Natural Roll-On", sub="Deodorant", en_sub="Deodorant",
         family="Vücut bakımı", en_family="Body care", color="#cfc6ae",
         theme={"glow": "#6d6a58", "edge": "#070706", "drop": "#f1ede2", "mood": "cool"},
         tagline="Alüminyumsuz, doğal koruma.", en_tagline="Aluminium-free, natural protection.",
         notes=["Alüminyumsuz", "Doğal", "Günlük"], en_notes=["Aluminium-free", "Natural", "Everyday"],
         desc="Alüminyum klorohidrat içermeyen doğal deodorant; gün boyu ferahlık için.",
         en_desc="A natural deodorant without aluminium chlorohydrate, for all-day freshness.",
         bottle=bottle(1.15, 2.3, 1.15, 0.52, 1.0, 1.7, {"shape": "ball", "radius": 0.5, "height": 1.0, "color": "#1f3326", "finish": "matte"},
                       tint="#ece6d8", finish="matte", roughness=0.5, neckR=0.46, neckH=0.12, neckColor="#e8e2d6", labelY=-0.1, scale=1.15),
         label=label([236, 230, 216], GREEN, "ROLL-ON", "doğal deodorant", ["Alüminyumsuz"], "",
                     [{"text": "Alüminyum klorohidrat içermeyen doğal formül."},
                      {"head": "KULLANIM", "text": "Temiz ve kuru cilde uygulayınız."}],
                     badge=False, logoY=0.42, logoSize=180, enSize=36, trSize=30)),
    # ---------------------------------------------------------------- saç
    dict(id="sac-bakim-suyu", name="Saç Bakım Suyu", en_name="Hair Care Water", sub="125 ml", en_sub="125 ml",
         family="Saç bakımı", en_family="Hair care", color="#8fae8a",
         theme={"glow": "#35553a", "edge": "#020503", "drop": "#d5e6d2", "mood": "cool"},
         tagline="Biberiyeyle saç diplerine bakım.", en_tagline="Rosemary care for the scalp.",
         notes=["Biberiye", "Keratin", "Biotin", "B vitamini"], en_notes=["Rosemary", "Keratin", "Biotin", "Vitamin B"],
         desc="Biberiye özlü formül; keratin, biotin ve B vitaminiyle saç diplerini besler.",
         en_desc="A rosemary formula; keratin, biotin and vitamin B nourish the scalp.",
         bottle=bottle(1.45, 3.0, 1.45, 0.62, 1.3, 2.2, {"shape": "spray", "radius": 0.36, "height": 0.8, "color": "#141414", "finish": "black"},
                       tint="#23331f", tintOpacity=0.9, labelY=-0.12),
         label=label([34, 52, 34], CREAM, "HAIR CARE WATER", "saç bakım suyu", ["Biberiye · Keratin · Biotin"], "125 ml",
                     [{"text": "Biberiye özlü; keratin, biotin ve B vitaminiyle saç diplerine bakım."},
                      {"head": "KULLANIM", "text": "Saç diplerine sıkıp parmak uçlarıyla masaj yapınız."}],
                     badgeY=0.15, logoY=0.45, logoSize=190, enSize=34, trSize=30, volumeY=0.93)),
    dict(id="sac-bakim-yagi", name="Saç Bakım Yağı · Vanilya", en_name="Hair Care Oil · Vanilla", sub="Vanilya", en_sub="Vanilla",
         family="Saç bakımı", en_family="Hair care", color="#d2a86a",
         theme={"glow": "#7a5220", "edge": "#080502", "drop": "#f5e2c0", "mood": "warm"},
         tagline="Doğal parlaklık, kabarmaya son.", en_tagline="Natural shine, no more frizz.",
         notes=["Vanilya", "Parlaklık", "Nem"], en_notes=["Vanilla", "Shine", "Moisture"],
         desc="Saçı nemlendirir ve doğal parlaklık verir; kabarma ve elektriklenmeyi önler.",
         en_desc="Moisturises hair and gives natural shine; prevents frizz and static.",
         bottle=bottle(1.3, 2.3, 1.3, 0.55, 1.2, 1.7, {"shape": "dropper", "radius": 0.36, "height": 0.9, "color": "#141414", "finish": "black"},
                       tint="#5a3312", tintOpacity=0.9, labelY=-0.1, scale=1.1),
         label=label([240, 232, 212], GREEN, "HAIR OIL", "vanilyalı saç yağı", ["Parlaklık · Nem"], "",
                     [{"text": "Saçı nemlendirir, doğal parlaklık verir; kabarma ve elektriklenmeyi önler."},
                      {"head": "KULLANIM", "text": "Birkaç damlayı saç uçlarına yayınız."}],
                     badge=False, logoY=0.4, logoSize=180, enSize=36, trSize=30)),
    # ---------------------------------------------------------------- sabun
    dict(id="zeytinyagi-sabun", name="Zeytinyağı Katı Sabun", en_name="Olive Oil Bar Soap", sub="Katı sabun", en_sub="Bar soap",
         family="Doğal sabun", en_family="Natural soap", color="#c9b77a",
         theme={"glow": "#6b6232", "edge": "#060502", "drop": "#ece2bc", "mood": "warm"},
         tagline="Zeytinyağıyla besler.", en_tagline="Nourished by olive oil.",
         notes=["Zeytinyağı", "Vegan", "El yapımı"], en_notes=["Olive oil", "Vegan", "Handmade"],
         desc="Yüz ve vücut için; zeytinyağıyla besler, cilde doğal bir ışıltı verir.",
         en_desc="For face and body; olive oil nourishes and gives skin a natural glow.",
         bottle=bottle(2.3, 2.9, 0.95, 0.38, 2.34, 1.45, NONE_CAP, tint="#c5b271", finish="matte", roughness=0.8, **BAR),
         label=label([214, 196, 160], [40, 52, 32], "OLIVE OIL SOAP", "zeytinyağlı sabun", [], "",
                     [{"text": "Yüz ve vücut için zeytinyağlı doğal sabun."}, {"head": "VEGAN", "text": "El yapımı, bitkisel."}],
                     badge=False, logoY=0.52, logoSize=150, enSize=34, trSize=28, backTop=0.3)),
    dict(id="lavanta-sabun", name="Lavanta Katı Sabun", en_name="Lavender Bar Soap", sub="Katı sabun", en_sub="Bar soap",
         family="Doğal sabun", en_family="Natural soap", color="#a99bbd",
         theme={"glow": "#4f4468", "edge": "#040306", "drop": "#e6def0", "mood": "cool"},
         tagline="Lavantayla sakinleştiren bakım.", en_tagline="Calming care with lavender.",
         notes=["Lavanta", "Zeytinyağı", "Vegan"], en_notes=["Lavender", "Olive oil", "Vegan"],
         desc="Zeytinyağlı, lavantalı doğal sabun.",
         en_desc="A natural soap with olive oil and lavender.",
         bottle=bottle(2.3, 2.9, 0.95, 0.38, 2.34, 1.45, NONE_CAP, tint="#9b8cae", finish="matte", roughness=0.8, **BAR),
         label=label([214, 196, 160], [52, 40, 70], "LAVENDER SOAP", "lavantalı sabun", [], "",
                     [{"text": "Zeytinyağlı, lavantalı doğal sabun."}, {"head": "VEGAN", "text": "El yapımı, bitkisel."}],
                     badge=False, logoY=0.52, logoSize=150, enSize=34, trSize=28, backTop=0.3)),
    dict(id="kastil-sabun", name="Sıvı Kastil Sabunu", en_name="Liquid Castile Soap", sub="Sıvı sabun", en_sub="Liquid soap",
         family="Doğal sabun", en_family="Natural soap", color="#e0c36e",
         theme={"glow": "#6e5a1e", "edge": "#060502", "drop": "#f5e8bc", "mood": "warm"},
         tagline="Nemlendiren bitkisel temizlik.", en_tagline="Moisturising plant-based cleansing.",
         notes=["Zeytinyağı", "Hindistan cevizi", "Hint yağı", "Gliserin"], en_notes=["Olive oil", "Coconut", "Castor oil", "Glycerin"],
         desc="Zeytin ve hindistan cevizi yağları, hint yağı ve gliserinle nazikçe temizler ve nemlendirir.",
         en_desc="Olive and coconut oils, castor oil and glycerin cleanse gently and moisturise.",
         bottle=bottle(1.6, 3.1, 1.6, 0.66, 1.4, 1.9, {"shape": "pump", "radius": 0.38, "height": 0.9, "color": "#141414", "finish": "black"},
                       liquid="#e2bf5c", liquidOpacity=0.55, labelY=-0.2),
         label=label([240, 232, 212], GREEN, "CASTILE SOAP", "sıvı kastil sabunu", ["Zeytinyağı · Hindistan Cevizi"], "",
                     [{"text": "Zeytin ve hindistan cevizi yağları, hint yağı ve gliserin."},
                      {"head": "KULLANIM", "text": "Islak cilde köpürterek uygulayıp durulayınız."}],
                     badge=False, logoY=0.36, logoSize=180, enSize=36, trSize=30)),
    # ---------------------------------------------------------------- aletler
    dict(id="lenf-masaj-aleti", name="Lenf Masaj Aleti", en_name="Lymph Massage Tool", sub="Ahşap", en_sub="Wood",
         family="Bakım aracı", en_family="Care tool", color="#b98d5c", form="tool",
         theme={"glow": "#5e4020", "edge": "#060402", "drop": "#ecd9bc", "mood": "warm"},
         tagline="Doğal lenf dolaşımına destek.", en_tagline="Supports natural lymph flow.",
         notes=["Ergonomik", "Masaj", "Lenf"], en_notes=["Ergonomic", "Massage", "Lymph"],
         desc="Ergonomik tasarımıyla vücudun doğal lenf dolaşımını destekler; vücut yağıyla birlikte kullanılır.",
         en_desc="Its ergonomic design supports the body's natural lymph flow; use it with the body oil.",
         bottle={"tool": "lymph", "label": {"width": 0.8, "height": 1.2, "y": 0, "back": True}, "tag": {"x": 0.95, "y": -0.6, "hang": 0.45, "anchorX": 0.24}, "scale": 1.05, "tilt": -0.12},
         label=label([214, 196, 160], GREEN, "LYMPH TOOL", "lenf masaj aleti", [], "",
                     [{"text": "Vücut yağıyla birlikte, kalpten uzağa doğru nazikçe uygulayınız."}],
                     badge=False, logoY=0.42, logoSize=150, enSize=30, trSize=26, backTop=0.3, backSize=30)),
    dict(id="tampiko-firca", name="Tampiko Otu Fırça", en_name="Tampico Body Brush", sub="Kuru fırçalama", en_sub="Dry brushing",
         family="Bakım aracı", en_family="Care tool", color="#c9a86f", form="tool",
         theme={"glow": "#5f4a24", "edge": "#060402", "drop": "#efdfbf", "mood": "warm"},
         tagline="Kuru fırçalama ritüeli.", en_tagline="The dry brushing ritual.",
         notes=["Tampiko", "%100 doğal", "Kuru fırçalama"], en_notes=["Tampico", "100% natural", "Dry brushing"],
         desc="%100 doğal tampiko kıllarıyla kuru fırçalama; cildi arındırır ve dolaşımı canlandırır.",
         en_desc="Dry brushing with 100% natural tampico fibres; refines skin and invigorates circulation.",
         bottle={"tool": "brush", "label": {"width": 0.75, "height": 1.1, "y": 0, "back": True}, "tag": {"x": 1.05, "y": -0.9, "hang": 1.4, "anchorX": 0.6}, "scale": 1.0, "tilt": -0.1},
         label=label([214, 196, 160], GREEN, "BODY BRUSH", "tampiko fırça", [], "",
                     [{"text": "Kuru cilde, ayaklardan başlayarak kalbe doğru uygulayınız."}],
                     badge=False, logoY=0.42, logoSize=150, enSize=30, trSize=26, backTop=0.3, backSize=30)),
    dict(id="kabak-lifi", name="Doğal Kabak Lifi", en_name="Natural Loofah", sub="Hatay", en_sub="Hatay",
         family="Bakım aracı", en_family="Care tool", color="#d9c79c", form="tool",
         theme={"glow": "#6a5a32", "edge": "#060502", "drop": "#efe4c8", "mood": "warm"},
         tagline="Hatay'ın kadın çiftçilerinden.", en_tagline="From women farmers in Hatay.",
         notes=["Doğal lif", "Arındırır", "Dolaşım"], en_notes=["Natural fibre", "Exfoliates", "Circulation"],
         desc="Hatay'daki kadın çiftçilerden; ölü deriden arındırır ve dolaşımı destekler.",
         en_desc="From women farmers in Hatay; clears away dead skin and supports circulation.",
         bottle={"tool": "loofah", "label": {"width": 0.75, "height": 1.1, "y": 0, "back": True}, "tag": {"x": 0.95, "y": -0.5, "hang": 1.5, "anchorX": 0.2}, "scale": 1.05, "tilt": -0.35},
         label=label([214, 196, 160], GREEN, "LOOFAH", "doğal kabak lifi", [], "",
                     [{"text": "Hatay'daki kadın çiftçilerin emeğiyle."}],
                     badge=False, logoY=0.42, logoSize=150, enSize=30, trSize=26, backTop=0.3, backSize=30)),
]


def box(tint, ribbon, bg, ink, en, tr, back):
    return (bottle(2.7, 2.5, 1.2, 0.06, 2.1, 1.9, NONE_CAP, tint=tint, finish="matte", roughness=0.7, ribbon=ribbon, scale=1.0, labelY=-0.05, **BAR),
            label(bg, ink, en, tr, [], "", back, badge=False, logoY=0.44, logoSize=170, enSize=36, trSize=30, backTop=0.3))


SETS = [
    ("detoks-set", "Detoks Set", "Detox Set", "5 parça", "5 pieces", "#27402f",
     "Beş adımlık detoks ritüeli.", "A five-step detox ritual.",
     ["Tampiko fırça", "Kabak lifi", "Sabun", "Masaj aleti", "Vücut yağı"], ["Tampico brush", "Loofah", "Soap", "Massage tool", "Body oil"],
     "Tampiko fırça, kabak lifi, zeytinyağlı sabun, lenf masaj aleti ve vücut yağı bir arada.",
     "Tampico brush, loofah, olive oil soap, lymph massage tool and body oil together.",
     box("#1f3326", "#d8c7a0", GREEN, CREAM, "DETOX SET", "detoks seti", [{"text": "Tampiko fırça, kabak lifi, zeytinyağlı sabun, lenf masaj aleti ve vücut yağı."}])),
    ("lenf-drenaj-seti", "Lenf Drenaj Masaj Seti", "Lymph Drainage Set", "2 parça", "2 pieces", "#b08a58",
     "Masaj ve yağ, birlikte.", "Massage and oil, together.",
     ["Masaj aleti", "Vücut yağı", "Emilim"], ["Massage tool", "Body oil", "Absorption"],
     "Lenf masaj aleti ve vücut yağı; masaj, yağın emilimini artırır.",
     "Lymph massage tool and body oil; massage helps the oil absorb.",
     box("#c8a97a", "#27402f", [200, 169, 122], [36, 48, 32], "LYMPH SET", "lenf drenaj seti", [{"text": "Lenf masaj aleti ve vücut yağı."}])),
    ("sac-bakim-seti", "Saç Bakım Seti", "Hair Care Set", "2 parça", "2 pieces", "#8fae8a",
     "Saç derisi için ritüel.", "A ritual for the scalp.",
     ["Saç bakım suyu", "Masaj tarağı"], ["Hair care water", "Scalp comb"],
     "Saç bakım suyu (125 ml) ve saç derisi masaj tarağı.",
     "Hair care water (125 ml) and a scalp massage comb.",
     box("#e8e0cc", "#35553a", [232, 224, 204], GREEN, "HAIR CARE SET", "saç bakım seti", [{"text": "Saç bakım suyu (125 ml) ve saç derisi masaj tarağı."}])),
    ("self-care-set", "Self-Care Set", "Self-Care Set", "Set", "Set", "#7f9458",
     "Rutinin her adımı, tek kutuda.", "Every step of the routine, in one box.",
     ["Bronzlaştırıcı yağ", "El kremi", "Hediye"], ["Bronzing oil", "Hand cream", "Gift"],
     "Kişisel bakım rutininin her adımı: bronzlaştırıcı yağ, el kremi ve daha fazlası.",
     "Every step of a self-care routine: bronzing oil, hand cream and more.",
     box("#5d6b3a", "#efe6d0", [93, 107, 58], CREAM, "SELF-CARE SET", "kişisel bakım seti", [{"text": "Bronzlaştırıcı yağ, el kremi ve daha fazlası."}])),
]
for sid, name, en_name, sub, en_sub, color, tag, en_tag, notes, en_notes, desc, en_desc, (b, l) in SETS:
    P.append(dict(id=sid, name=name, nameLang="en" if sid == "self-care-set" else None, en_name=en_name, sub=sub, en_sub=en_sub, family="Bakım seti", en_family="Care set", color=color,
                  theme={"glow": "#3a5a36", "edge": "#030503", "drop": "#dfe8d4", "mood": "warm"},
                  tagline=tag, en_tagline=en_tag, notes=notes, en_notes=en_notes, desc=desc, en_desc=en_desc, bottle=b, label=l))

P.append(dict(id="sweatshirt", name="Self-Care Club Sweatshirt", en_name="Self-Care Club Sweatshirt", sub="Pamuklu", en_sub="Cotton", nameLang="en",
              family="Self-Care Club", en_family="Self-Care Club", color="#9a9c98",
              theme={"glow": "#4a4e52", "edge": "#040405", "drop": "#e4e6e8", "mood": "cool"},
              tagline="Kendine iyi bak.", en_tagline="Take good care of yourself.",
              notes=["Self-Care Club", "Lalive"], en_notes=["Self-Care Club", "Lalive"],
              desc="Lalive'ın Self-Care Club koleksiyonundan.", en_desc="From Lalive's Self-Care Club collection.",
              bottle=bottle(2.6, 2.6, 0.55, 0.26, 1.5, 1.1, NONE_CAP, tint="#9a9c98", finish="matte", roughness=0.95, garment=True, labelY=0.25, scale=0.9, **BAR),
              label=label(GREEN, CREAM, "SELF-CARE CLUB", "", [], "",
                          [{"text": "Lalive Self-Care Club koleksiyonu."}], badge=False, logoY=0.5, logoSize=200, enSize=44, trSize=30, backTop=0.4)))


def product(p):
    L = p["label"]
    L.update({"sub": p["sub"], "claims": p["notes"][:3], "ingredients": "", "usage": "", "pyramid": [], "volume": p["sub"]})
    out = {
        "name": p["name"], "form": p.get("form"), "sub": p["sub"], "collection": None, "family": p["family"],
        "year": None, "perfumer": None, "color": p["color"], "ink": "#1f3326", "theme": p["theme"],
        "tagline": p["tagline"], "notes": p["notes"], "description": p["desc"], "file": f"{p['id']}.jpg",
        "en": {"name": p["en_name"], "family": p["en_family"], "tagline": p["en_tagline"], "notes": p["en_notes"],
               "description": p["en_desc"], "sub": p["en_sub"]},
        "label": L, "bottle": p["bottle"],
    }
    if p.get("nameLang"):
        out["nameLang"] = p["nameLang"]
    return out


c = json.load(open(PATH, encoding="utf-8"))
items = {i["id"]: i for i in c["catalog"]["items"]}
BASE = 5  # ilk 5 ürün ana sayfanın 3B ürünleri
c["products"] = c["products"][:BASE]
c["home"] = list(range(BASE))
for p in P:
    item = items[p["id"]]
    prod = product(p)
    prod["price"] = item["price"]
    c["products"].append(prod)
    item["product"] = len(c["products"]) - 1
    item["image"] = f"catalog/{p['id']}.jpg"
    item.pop("icon", None)
json.dump(c, open(PATH, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
open(PATH, "a").write("\n")
print(len(c["products"]), "ürün")
