"""Akış sahne planı: script.py'deki her sahnenin istasyonunda hangi öğelerin, anlatımın hangi kelimesinde belireceği.

Koordinatlar istasyon merkezine göre (zoom 1'de ekran x ±960, y ±540). `cue`: öğenin belirdiği ifade (anlatımda aranır).
Yazılarda *yıldızlı* kelime italik vurgu olur. sync=False: kelimeler anlatımda aranmaz, art arda gelir.
"""


CHAPTER_NAMES = {"01": "2010: Özil geliyor", "02": "Asist makinesi", "03": "Mourinho'nun iki yüzü", "04": "Fenerbahçe köprüsü",
                 "05": "Aynı DNA", "06": "Tarih tekerrür ediyor", "07": "Arda'nın cevabı", "08": "Rakamlar ne diyor?",
                 "09": "Özil'in olamadığı şey"}


def P(key, x, y, w, h, cue=None, cap=None, crop=None, rot=0, at=0.0, out=None):
    return dict(k="photo", key=key, x=x, y=y, w=w, h=h, cue=cue, cap=cap, crop=crop, rot=rot, at=at, out=out)


def L(text, x, y, size=84, cue=None, sync=True, out=None, at=0.0, color=None, align="center"):
    d = dict(k="line", text=text, x=x, y=y, size=size, cue=cue, sync=sync, out=out, at=at, align=align)
    if color: d["color"] = color
    return d


def S(val, label, x, y, cue=None, pre="", suf="", w=380, h=300, size=128, at=0.0):
    return dict(k="stat", val=val, label=label, x=x, y=y, cue=cue, pre=pre, suf=suf, w=w, h=h, size=size, at=at)


def Q(text, who, cue, out=None, size=92):
    return dict(k="quote", text=text, who=who, cue=cue, out=out, size=size)


def PILL(text, cue, icon="calendar", out=None):
    return dict(k="pill", text=text, cue=cue, icon=icon, out=out)


def CAM(cue, x, y, z=1.0, d=0.8):
    return dict(k="cam", cue=cue, x=x, y=y, z=z, d=d)


# Fotoğraf odak noktaları (fx, fy, ölçek)
CR = {
    "mou_rm2010": (0.40, 0.42, 0.55),
    "ozil_rm_milan": (0.42, 0.45, 0.85),
    "ozil_portrait": (0.5, 0.35, 1.0),
    "ozil_fb": (0.62, 0.40, 0.9),
    "arda_portrait": (0.5, 0.42, 1.0),
    "arda_full": (0.5, 0.17, 0.7),
    "mou_fb": (0.5, 0.35, 1.0),
    "mou_2025": (0.5, 0.35, 0.8),
    "mou_fb_pitch": (0.5, 0.45, 0.9),
    "ozil_rm_dribble": (0.45, 0.45, 0.9),
    "ozil_rm_corner": (0.7, 0.5, 0.85),
    "ozil_ronaldo": (0.5, 0.45, 1.0),
    "ramos": (0.5, 0.4, 0.8),
    "arda_fb_bench": (0.5, 0.4, 1.0),
    "arda_fb_match": (0.5, 0.55, 1.0),
}


def p(key, x, y, w, h, cue=None, cap=None, **kw):
    return P(key, x, y, w, h, cue, cap, crop=CR.get(key), **kw)


PLAN = {
    # ---------- soğuk açılış ----------
    0: [p("bernabeu", -400, -10, 980, 620, "Santiago", "Santiago Bernabéu"),
        L("*2012*", 560, -250, 140, cue="İki bin", sync=False),
        L("Real Madrid *3–1*", 560, -110, 64, cue="üçe bir", sync=False),
        PILL("Devre arası · Real Madrid 3–1 Deportivo", "devre arasına", "clock", out="Ama Jose"),
        p("mou_rm2010", 560, 170, 520, 400, "Jose Mourinho öfkeli", "Jose Mourinho", rot=2.5),
        CAM("öfkeli", 250, 40, 1.06)],
    1: [p("ozil_rm_milan", 0, -40, 1080, 640, None, "Mesut Özil · Real Madrid"),
        Q("İki güzel pas *yeterli mi* sanıyorsun?", "Mourinho'dan Özil'e · 2012", "İki güzel", out="Özil formasını"),
        L("Özil formasını *fırlatıyor*", 0, 420, 66, cue="Özil formasını")],
    2: [p("ramos", -430, -20, 600, 740, "Sergio Ramos", "Sergio Ramos"),
        L("Özil'in *forması*", 430, -90, 84, cue="Özil'in formasını"),
        L("kendi formasının *altında*", 430, 30, 60, cue="kendi formasının"),
        PILL("Kaynak: Mesut Özil'in otobiyografisi", "kitabında", "book")],
    3: [L("On dört yıl *sonra*", 0, -330, 110, cue="Aradan on dört"),
        p("mou_2025", -460, 140, 520, 520, "Mourinho yeniden", "Jose Mourinho"),
        L("21 *yaşında*", 430, -10, 64, cue="yirmi bir yaşında", sync=False),
        L("*Sol* ayaklı", 430, 90, 64, cue="sol ayaklı"),
        L("Fenerbahçe'den *yetişmiş*", 430, 190, 64, cue="Fenerbahçe'den"),
        L("bir *10 numara*", 430, 290, 64, cue="on numara", sync=False)],
    4: [p("arda_portrait", 0, -30, 600, 700, "Arda", "Arda Güler"), dict(k="hold", sec=1.6)],
    5: [L("Mourinho bunu *daha önce* yaptı", 0, -400, 76, cue="Mourinho bunu"),
        p("ozil_rm_dribble", -470, 20, 760, 500, "asist kralı", "Özil · 2010"),
        p("arda_full", 470, 20, 480, 560, "Peki Arda", "Arda · 2026"),
        Q("Arda Güler, Mourinho'nun *yeni Özil'i mi?*", "Bu videonun sorusu", "Peki Arda", out="Bu videoda"),
        L("iki oyuncu, *tek kulüp*", 0, 420, 60, cue="iki oyuncunun", sync=False)],

    # ---------- bölüm 1 ----------
    7: [L("Önce *Özil*", 0, -320, 96, cue="Önce Özil'i", out="O yaz"),
        L("Mourinho onu *hemen istedi.*", 0, -320, 80, cue="Mourinho, Özil'i hemen"),
        dict(k="steps", y=110, gap=460, icons=["shirt", "shirt", "trophy", "star"],
             items=[("2006", "Schalke", "Schalke'de"), ("2008", "Werder Bremen", "Werder Bremen'de"),
                    ("2010", "Dünya Kupası", "Dünya Kupası'nda"), ("Ağu 2010", "Real Madrid", "Real Madrid'e"),
                    ])],
    8: [p("ozil_portrait", -460, -10, 540, 680, "Özil Madrid'e", "Mesut Özil · 2010"),
        S(21, "Madrid'e geldiği yaş", 400, -170, cue="yirmi bir", suf="yaş"),
        L("Tıpkı *Arda* gibi.", 400, 80, 66, cue="Tıpkı bugün"),
        L("Dünya Kupası *yıldızı*", 400, 200, 58, cue="Dünya Kupası yıldızı"),
        PILL("Bekleme süresi: neredeyse hiç", "Bekleme süresi", "clock")],

    # ---------- bölüm 2 ----------
    10: [L("Özil · *Real Madrid*", 0, -330, 86, cue="Sonraki üç", sync=False),
         S(159, "Maç", -460, 10, cue="yüz elli dokuz"),
         S(27, "Gol", 0, 10, cue="yirmi yedi gol"),
         S(80, "Asist (tüm turnuvalar)", 460, 10, cue="seksen", pre="~"),
         L("LaLiga'da *asist zirvesi*", 0, 330, 62, cue="LaLiga'da", sync=False)],
    11: [dict(k="pitch", play="ozil_counter", y=-10, at=0.1), PILL("Mourinho'nun kontra atak makinesi", "kontra", "ball")],
    12: [L("makine *tarihe geçti*", 0, -410, 72, cue="makine tarihe"),
         S(100, "2011–12 · LaLiga", -320, 20, cue="yüz puanla", suf="puan", w=560, h=380, size=170),
         p("ozil_ronaldo", 430, 20, 560, 620, "Barcelona'nın", "Özil & Ronaldo"),
         PILL("Barcelona'nın en güçlü döneminde gelen şampiyonluk", "Barcelona'nın", "trophy")],
    13: [p("mou_rm2010", 0, -30, 1080, 640, None, "Jose Mourinho · Real Madrid"),
         Q("Onun bir kopyası yok. *Kötü bir kopyası bile.*", "Jose Mourinho · 2012", "Onun bir")],

    # ---------- bölüm 3 ----------
    15: [p("mou_fb", 0, -30, 380, 500, None, "Jose Mourinho"),
         L("Kamera önünde *övgü*", -560, -60, 54, cue="Kameraların", sync=False),
         L("\"dünyanın en iyi 10 numarası\"", -560, 20, 30, cue="göklere", sync=False, color="#7D8296"),
         L("Soyunma odasında *baskı*", 560, -60, 54, cue="Soyunma odasında", sync=False),
         L("daha çok koşu, daha çok mücadele", 560, 20, 30, cue="Daha çok koşu", color="#7D8296")],
    16: [p("ozil_rm_corner", -440, -10, 760, 520, None, "Özil · Real Madrid"),
         L("takımın önünde *sert sözler*", 470, -100, 56, cue="takımın önünde"),
         L("en parlak *yılları*", 470, 20, 56, cue="en parlak yılları"),
         L("övgü ve baskı *aynı anda.*", 470, 140, 60, cue="övgü ve baskı"),
         PILL("Kaynak: Mesut Özil'in otobiyografisi", "kitabında", "book")],
    17: [L("Zirvedeyken *bitti.*", 0, -310, 96, cue="zirvedeyken", sync=False),
         dict(k="steps", y=150, gap=520, icons=["door", "plane", "star"],
              items=[("Haz 2013", "Mourinho ayrıldı", "Mourinho Real Madrid'den ayrıldı"), ("Eyl 2013", "Özil Arsenal'e satıldı", "Arsenal'e"),
                     ("", "\"Dünyanın en iyi 10 numarası\"", "dünyanın en iyi")])],

    # ---------- bölüm 4 ----------
    19: [dict(k="nodes", cx=0, cy=40, r=115, center="Fenerbahçe", center_cue="kulüp var",
              nodes=[("ozil_fb", "Özil", 0, -320, "Özil, kariyerinin"), ("arda_fb_bench", "Arda", -620, 300, "Arda Güler"),
                     ("mou_fb", "Mourinho", 620, 300, "Mourinho da")],
              crops={"ozil_fb": (0.62, 0.32, 0.55), "arda_fb_bench": (0.5, 0.42, 0.7), "mou_fb": (0.5, 0.28, 0.6)})],
    20: [L("1 gol · *1 asist*", 0, -410, 62, cue="bir gol ve", sync=False),
         p("arda_fb_bench", -380, 20, 420, 600, "Arda oyuna", "Arda Güler · Fenerbahçe"),
         p("ozil_fb", 360, 20, 720, 480, "Dönüş uçağında", "Mesut Özil"),
         Q("Dünya starı *olacak* kardeşim.", "Mesut Özil · Fenerbahçe", "Dünya starı")],
    21: [p("arda_fb_match", 0, -30, 1080, 620, None, "Arda · Fenerbahçe"),
         Q("O benim *küçük kardeşim* gibiydi.", "Mesut Özil · Marca", "küçük bir kardeş", out="Örnek olarak"),
         PILL("Ødegaard: Real Madrid'de şans bulamadı, Arsenal'in kaptanı oldu", "Ødegaard", "star")],
    22: [L("Yollar *kesişiyor*", 0, -320, 96, cue="Arda, iki bin", sync=False),
         dict(k="steps", y=110, gap=450, icons=["plane", "shirt", "plane", "star"],
              items=[("2023", "Arda Real Madrid'de", "Real Madrid'e transfer"), ("2024", "Mourinho Fenerbahçe'de", "Fenerbahçe'nin teknik"),
                     ("2025", "Mourinho Benfica'da", "Benfica'ya"), ("11 Haz 2026", "Mourinho Real Madrid'de", "on bir Haziran")]),
         PILL("Sözleşme: 2029'a kadar", "iki bin yirmi dokuza", "pen")],

    # ---------- bölüm 5 ----------
    24: [dict(k="compare", lkey="ozil_portrait", rkey="arda_portrait", lname="Özil", rname="Arda", y=60,
              lcrop=(0.5, 0.3, 0.6), rcrop=(0.5, 0.35, 0.7), cue="Benzerlikler",
              rows=[("Mourinho ile başladığı yaş", "21", "21"), ("Ayak", "Sol", "Sol"), ("Köken", "Türk", "Türk"),
                    ("Fenerbahçe", "Oynadı", "Yetişti"), ("Rol", "10 numara", "10 / 8 numara")])],
    25: [L("Arda · *Xabi Alonso* dönemi", 0, -330, 80, cue="Xabi Alonso", sync=False),
         S(51, "Maç", -460, 10, cue="elli bir"),
         S(6, "Gol", 0, 10, cue="altı gol"),
         S(14, "Asist", 460, 10, cue="on dört asist"),
         L("LaLiga asistte *ilk üç*", 0, 330, 60, cue="LaLiga'da asist", sync=False)],
    26: [L("24 yıl sonra *Dünya Kupası*", 0, -390, 76, cue="yirmi dört yıl", sync=False),
         dict(k="results", y=-150, title="Türkiye · 2026 Dünya Kupası · D Grubu", cue="Dünya Kupası",
              rows=[("Avustralya", "0–2", "M", "grupta kaldı"), ("Paraguay", "", "M", "grupta kaldı"), ("ABD", "3–2", "G", "ABD'yi")])],
    27: [S(24, "sonra Dünya Kupası'nda Türk golü", -390, -40, cue="yirmi dört yıl", suf="yıl", w=600, h=400, size=180),
         p("arda_full", 430, -20, 440, 680, "Arda'nın o maçtaki", "Arda Güler · Milli Takım"),
         PILL("Dünya Kupası'nda gol atan en genç Türk futbolcu", "en genç", "star")],

    # ---------- bölüm 6 ----------
    29: [dict(k="lineup", x=-380, y=40, title="5. hafta · Rayo Vallecano", out_name="Arda Güler", in_name="Yan Diomande",
              swap_cue="Yan Diomande", cue="Rayo"),
         L("Basın: *Arda ilk 11'de*", 520, -80, 54, cue="İspanyol basını", sync=False),
         L("Mourinho: *Diomande*", 520, 40, 54, cue="Mourinho herkesi", sync=False)],
    30: [dict(k="poll", title="Marca anketi", sub="8.000+ oy", cue="Marca'nın",
              options=[("Arda'yı dışarıda bırakamazsın", 67), ("Mourinho haklı", 23), ("Diğer", 10)])],
    31: [dict(k="score", home="Elche", away="Real Madrid", label="LaLiga · 6. hafta", y=-300, at=0.1, start=(0, 0),
              steps=[("serbest vuruşunda", 0, 1), ("Mbappé", 0, 2), ("ikiye iki", 2, 2), ("uzatma", 2, 3)],
              events=[("25'", "Arda'nın serbest vuruşu · kk", "serbest vuruşunda"), ("33'", "Mbappé", "Mbappé"),
                      ("68'", "Arda oyundan çıktı", "altmış sekizinci"), ("71' 83'", "Elche eşitledi", "ikiye iki"),
                      ("90+1'", "Espi · galibiyet", "uzatma")]),
         PILL("Maçın oyuncusu: Arda Güler", "maçın oyuncusu", "star", out="altmış sekizinci")],
    32: [p("mou_2025", 0, -30, 620, 640, None, "Jose Mourinho"),
         Q("Hayır, vazgeçilmez değil. Futbolda kimse *vazgeçilmez değildir.*", "Jose Mourinho · Eylül 2026", "Hayır, vazgeçilmez")],
    33: [p("mou_fb", -580, 0, 400, 520, None, "Mourinho"),
         p("arda_portrait", 580, 0, 400, 520, None, "Arda"),
         Q("Arda Güler benim *en önemli* oyuncularımdan biri.", "Jose Mourinho · aynı basın toplantısı", "Arda Güler benim", out="Tanıdık"),
         L("Kamerada *övgü*,", 0, -40, 84, cue="Kamerada"),
         L("sahada *baskı.*", 0, 80, 84, cue="sahada baskı"),
         PILL("On dört yıl önce Özil'e yaptığının aynısı", "On dört yıl önce", "clock")],
    34: [dict(k="score", home="Roma", away="Real Madrid", label="Şampiyonlar Ligi · 14 Ekim 2026", y=-300, at=0.1, start=(3, 1),
              steps=[("Espi'nin", 3, 2), ("Endrick", 3, 3), ("Rüdiger", 3, 4)],
              events=[("59'", "Arda oyuna girdi", "elli dokuzuncu"), ("83'", "Espi", "Espi'nin"),
                      ("85'", "Endrick · asist Arda", "Endrick"), ("90'", "Rüdiger · asist Arda", "Rüdiger")]),
         PILL("Arda yine yedek", "Arda yine yedek", "clock", out="elli dokuzuncu")],
    35: [dict(k="pitch", play="roma_assists", y=-10, at=0.1)],
    36: [p("mou_fb_pitch", -500, -10, 600, 640, None, "Jose Mourinho"),
         Q("Bernardo ve Arda ile başlasaydık, bize *beş gol* atarlardı.", "Jose Mourinho · Leipzig maçı öncesi", "Roma'da Bernardo",
           out="Yani Mourinho'nun"),
         L("topsuz oyunda *fedakârlık.*", 400, 0, 72, cue="topsuz oyunda")],

    # ---------- bölüm 7 ----------
    38: [dict(k="score", home="Real Madrid", away="Sevilla", label="LaLiga · 9. hafta", y=-300, at=0.1, start=(0, 0),
              steps=[("ceza sahası", 1, 0), ("Mbappé iki", 2, 0), ("penaltıdan", 3, 0), ("Diomande", 4, 1)],
              events=[("30'", "Arda Güler · ceza sahası dışı", "ceza sahası"), ("37'", "Mbappé", "Mbappé iki"),
                      ("63'", "Mbappé · penaltı", "penaltıdan"), ("82'", "Diomande", "Diomande")]),
         PILL("Cevap soyunma odasında değil, sahada", "Ama Özil'den", "ball", out="ceza sahası")],
    39: [dict(k="pitch", play="leipzig", y=-10, at=0.1)],
    40: [p("mou_2025", -500, -10, 560, 620, None, "Jose Mourinho"),
         Q("Arda çok yetenekli. Henüz tam anlamıyla *olgunlaşmış* bir oyuncu değil.", "Jose Mourinho · Ekim 2026", "Arda çok", out="Çok yönlü"),
         L("Çok yönlü *bir oyuncu*", 400, 0, 72, cue="Çok yönlü")],

    # ---------- bölüm 8 ----------
    42: [L("Opta *verileri*", 0, -330, 90, cue="Opta"),
         S(646, "Arda sahada", -320, 30, cue="altı yüz kırk", suf="dk", w=520, h=340, size=150),
         S(524, "Arda yok", 320, 30, cue="beş yüz yirmi", suf="dk", w=520, h=340, size=150)],
    43: [dict(k="bars", y=-360, gap=150, cue="Arda sahadayken",
              rows=[("Topa sahip olma", 53.6, 35.6, "%", "topa yüzde"), ("Şut", 130, 78, "", "yüz otuz"),
                    ("İsabetli şut", 59, 33, "", "İsabetli"), ("Net gol pozisyonu", 31, 21, "", "Net gol")])],
    44: [L("Asıl sürpriz: *savunma*", 0, -400, 72, cue="asıl şaşırtıcı", sync=False),
         dict(k="bars", y=-170, gap=190, cue="Arda sahadayken", dec=2,
              rows=[("Yenilen gol", 3, 11, "", "sadece üç"), ("Rakibin gol beklentisi (xGA)", 5.92, 7.85, "", "gol beklentisi")])],
    45: [p("ozil_portrait", -580, -10, 420, 540, "Özil'e yıllarca", "Özil"),
         p("arda_full", 580, -10, 400, 600, "Arda ise", "Arda"),
         L("Topsuz *oyun*", 0, -60, 90, cue="eleştiri topsuz"),
         L("artık *güçlü yön*", 0, 60, 72, cue="takımını savunmada", sync=False)],

    # ---------- bölüm 9 ----------
    47: [L("Kulüp *geleceği* Arda'ya kuruyor", 0, -400, 60, cue="geleceği Arda", sync=False),
         p("ozil_rm_dribble", -470, 20, 700, 480, "Özil, Real Madrid'de", "Özil · 2013: zirvedeyken satıldı"),
         p("arda_portrait", 470, 20, 460, 540, "Arda için", "Arda · 2026: yeni sözleşme"),
         PILL("Basına yansıyan haberlere göre yeni imza", "Ekim ayında", "pen")],
    48: [L("Mourinho'yla *ilk sezon*", 0, -330, 84, cue="Mourinho'yla ilk", sync=False),
         S(11, "Maç", -460, 10, cue="On bir maçta"),
         S(3, "Gol", 0, 10, cue="üç gol"),
         S(4, "Asist", 460, 10, cue="dört asist"),
         PILL("Eylül: Real Madrid'de ayın oyuncusu", "Eylül ayında", "star")],
    49: [L("En büyük *sahne*", 0, -420, 76, cue="en büyük sahne", sync=False),
         dict(k="versus", a=("Barcelona", "27 puan"), b=("Real Madrid", "21 puan"), label="El Clásico · Camp Nou", cue="El Clásico", y=20)],
    50: [p("ozil_portrait", -620, -40, 420, 520, "Mourinho, Özil'i", "Özil"),
         p("mou_2025", 0, -40, 420, 520, "Şimdi aynı adam", "Mourinho"),
         p("arda_portrait", 620, -40, 420, 520, "yeni bir on numarayla", "Arda"),
         Q("Belki de *soru yanlış.*", "Doksan Dokuz", "Belki de soru", out="Arda yeni Özil"),
         L("Özil'in *olamadığı* şey", 0, 410, 66, cue="Özil'in olamadığını", sync=False),
         Q("Real Madrid'in *yıllarca lideri.*", "Doksan Dokuz", "Real Madrid'in yıllarca")],
    51: [L("Yeni Özil mi, *daha büyüğü mü?*", 0, -300, 74, cue="Siz ne düşünüyorsunuz", sync=False),
         L("Yorumlarda *buluşalım.*", 0, -170, 70, cue="Yorumlarda"),
         dict(k="outro", y=110, cue="abone"),
         L("Bir sonraki *hikâyede görüşmek üzere.*", 0, 390, 54, cue="Bir sonraki")],
}
