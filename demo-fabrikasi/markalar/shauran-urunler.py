"""Shauran Paris: ürün verisi (markanın sitesi shauran.com 06.10.2026'da kapalı: Cloudflare 522/523).

Kaynak: markanın satış noktaları (Shopify mağazaları)
- vgcharme.com/collections/shauran-paris (İtalya, € fiyat; açıklama ve markanın nota piramidi görseli)
- scentsangel.com/collections/shauran-paris (ABD; 2000 px beyaz zeminli ürün fotoğrafları)
Ham veriler: shauran-shopify/vg.json, sa.json, ham/. Açıklamalar VG Charme'ın İtalyanca metninden Türkçe ve
İngilizceye çevrildi; notalar markanın kendi nota görselleriyle (ham/vg-*-3.png) aynı.

Çıktı (shopify-cek.py biçiminde): shauran-shopify/products-tr.json, products-en.json, images/<handle>/<n>.<uzantı>
Kullanım: python3 demo-fabrikasi/markalar/shauran-urunler.py
"""
import json
import os
import shutil

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, "shauran-shopify")

# handle: (ad, [ön fotoğraf, galeri...] (ham/ içinde), VG kaynağı)
P = {
    "baroque": ("Baroque", ["sa-baroque-1.png", "vg-baroque-shauran-1.webp", "sa-baroque-3.png", "sa-baroque-6.png"], "baroque-shauran"),
    "capella": ("Capella", ["sa-capella-1.png", "vg-capella-shauran-1.webp", "sa-capella-3.png"], "capella-shauran"),
    "cuir-dose": ("Cuir Dose", ["sa-cuir-dose-1.png", "vg-cuir-dose-shauran-1.jpg", "sa-cuir-dose-3.png"], "cuir-dose-shauran"),
    "dynasty": ("Dynasty", ["sa-dynasty-1.png", "vg-dynasty-shauran-1.webp", "sa-dynasty-3.png"], "dynasty-shauran"),
    # Scents Angel'daki Eclipse fotoğrafında Capella etiketi var: VG Charme'ın fotoğrafı kullanılır.
    "eclipse": ("Eclipse", ["vg-eclipse-shauran-2.jpg", "vg-eclipse-shauran-1.webp"], "eclipse-shauran"),
    "escapade": ("Escapade", ["sa-shauran-escapade-1.png", "vg-escapade-shauran-1.webp", "sa-shauran-escapade-3.png"], "escapade-shauran"),
    "mesopotamia": ("Mesopotamia", ["sa-mesopotamia-1.png", "vg-mesopotamia-shauran-1.webp", "sa-mesopotamia-3.png"], "mesopotamia-shauran"),
    "patchouli-vision": ("Patchouli Vision", ["sa-patchouli-vision-1.png", "vg-patchoulivision-shauran-1.webp", "sa-patchouli-vision-3.png"], "patchoulivision-shauran"),
    "renaissance": ("Renaissance", ["sa-renaissance-1.png", "vg-renaissance-shauran-1.webp", "sa-renaissance-3.png"], "renaissance-shauran"),
    "reverie": ("Réverie", ["vg-reverie-shauran-2.jpg", "vg-reverie-shauran-1.jpg"], "reverie-shauran"),
}

# Markanın metni (VG Charme'dan çeviri): kısa açıklama, Türkçe ve İngilizce.
TEXT = {
    "baroque": (
        "Baroque, Barok üslubun ihtişamını ve zenginliğini kokuyla yeniden yorumlayan unisex bir parfüm. Gül ve neroli; labdanum, oud ve mür gibi zengin notalarla birleşerek görkemli, etkileyici bir iz bırakıyor.",
        "Baroque is a unisex perfume that embodies the splendour and opulence of the Baroque style, reinterpreted in scent. Rose and neroli meet rich notes of labdanum, oud and myrrh for a sumptuous, striking trail.",
    ),
    "capella": (
        "2021'de çıkan Capella, deniz ferahlığını yeşil aromatik notalarla birleştiren; odunlar, paçuli ve amberden derin bir dibe oturan rafine bir unisex koku.",
        "Launched in 2021, Capella is a refined unisex blend of marine freshness and green aromatic notes over a deep base of woods, patchouli and amber.",
    ),
    "cuir-dose": (
        "Cuir Dose, deri akorunu tüm yoğunluğu ve asaletiyle kutlayan cesur ve rafine bir unisex koku. Ferah narenciye açılışın ardından deri sıcak baharatlar ve çiçeksi dokunuşlarla iç içe geçiyor; odunsu, misk dip kalıcı bir iz bırakıyor.",
        "Cuir Dose is a bold, refined unisex fragrance that celebrates the leather accord in all its intensity and nobility. After a fresh citrus opening, leather intertwines with warm spices and floral touches, while a woody, musky base leaves a lasting trail.",
    ),
    "dynasty": (
        "Dynasty asaleti, gücü ve duyusallığı çağrıştırıyor; bir sarayın kapılarından içeri adım atar gibi. Narenciye ve frenk üzümüyle açılıyor, ylang-ylang, yasemin ve gülle çiçekleniyor, değerli odunlar ve amberle derinleşiyor.",
        "Dynasty evokes nobility, power and sensuality, like stepping through the gates of a palace. It opens with citrus and blackcurrant, blooms with ylang-ylang, jasmine and rose, and deepens into precious woods and ambergris.",
    ),
    "eclipse": (
        "Eclipse kokusal bir tutulma anını yakalıyor: paçuli ve vetiver; reçineler, vanilya ve menekşeyle iç içe geçerek gizemli ve yoğun bir hava yaratıyor.",
        "Eclipse captures a moment of olfactory eclipse: patchouli and vetiver intertwine with resins, vanilla and violet, creating an aura of mystery and intensity.",
    ),
    "escapade": (
        "Escapade kaçışa bir davet: baharatlar ve meyvemsi dokunuşlarla sarılmış deri, odunlar ve vanilya arasında bir koku yolculuğu.",
        "Escapade is an invitation to escape: a journey through leather, woods and vanilla, wrapped in spices and fruity accents.",
    ),
    "mesopotamia": (
        "Mesopotamia medeniyetlerin kadim topraklarını çağrıştırıyor; derinliği, zarafeti ve gizemi bir araya getiren bir koku krallığı. Deniz notaları bergamot, gül ve miskle buluşuyor.",
        "Mesopotamia evokes the ancient land of civilisations, a realm of scent uniting depth, elegance and mystery. Marine notes merge with bergamot, rose and musk.",
    ),
    "patchouli-vision": (
        "Patchouli Vision değerli paçulinin büyüleyici bir yorumu: paçulinin her akorda öne çıktığı; sedir, misk, amber ve bir dokunuş deriyle sarılmış bir kompozisyon.",
        "Patchouli Vision is an enchanting vision of precious patchouli: a composition in which the iconic patchouli note leads every accord, wrapped in cedar, musk, amber and a touch of leather.",
    ),
    "renaissance": (
        "Renaissance yeniden doğuşu ve modernliği zarafetle kutluyor. Beyaz biber, pembe biber, ardıç ve kakuleyle baharatlı açılıyor; oud, deri, iris ve gülden zengin bir kalbe, tütün, sedir, vanilya ve paçuliden bir dibe iniyor.",
        "Renaissance celebrates rebirth and modernity with elegance. A spicy opening of white pepper, pink pepper, juniper and cardamom leads to a rich heart of oud, leather, iris and rose, over tobacco, cedar, vanilla and patchouli.",
    ),
    "reverie": (
        "Réverie zengin ve sofistike bir koku yolculuğu: rafine içkiler, tatlılık ve derin odunlardan örülü dekadan bir rüya.",
        "Réverie is a rich, sophisticated olfactory journey, evoking a decadent dream of fine spirits, sweetness and deep woods.",
    ),
}


def main():
    vg = {p["handle"]: p for p in json.load(open(os.path.join(SRC, "vg.json"), encoding="utf-8"))["products"]}
    shutil.rmtree(os.path.join(SRC, "images"), ignore_errors=True)
    tr, en = [], []
    for n, (h, (name, photos, vh)) in enumerate(P.items(), 1):
        d = os.path.join(SRC, "images", h)
        os.makedirs(d)
        for i, f in enumerate(photos, 1):
            shutil.copy(os.path.join(SRC, "ham", f), os.path.join(d, f"{i}.{f.rsplit('.', 1)[1]}"))
        v = vg[vh]["variants"][0]
        base = {
            "id": n, "handle": h, "vendor": "Shauran Paris", "product_type": "Eau de Parfum",
            "variants": [{"id": n, "title": "50 ml", "price": v["price"], "compare_at_price": None, "available": True}],
            "images": [{"src": f"images/{h}/{i}"} for i in range(1, len(photos) + 1)],
            "permalink": f"https://vgcharme.com/products/{vh}",
        }
        t_tr, t_en = TEXT[h]
        tr.append({**base, "title": f"{name} 50 ml", "body_html": f"<p>{t_tr}</p>"})
        en.append({**base, "title": f"{name} 50 ml", "body_html": f"<p>{t_en}</p>"})
    json.dump(tr, open(os.path.join(SRC, "products-tr.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    json.dump(en, open(os.path.join(SRC, "products-en.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(len(tr), "ürün")


main()
