p = 'render_tcl.py'; s = open(p).read()
def rep(a, b, cnt=1):
    global s
    assert s.count(a) >= 1, a[:80]
    s = s.replace(a, b) if cnt == 0 else s.replace(a, b, cnt)
# bölge anahtarı: doc sayfaları ayrı
rep('if v[0] in ("full", "shot", "phone", "clip"): return (v[0], v[1])', 'if v[0] in ("full", "shot", "phone", "clip", "doc"): return (v[0], v[1])')
# klip ofseti: "ad:saniye"
rep('''    name = r["key"][2]; cl = gm_clip(name)
    image = cl.at(t - r["t0"] + .3) if cl is not None else im(P(CLIP_FALLBACK.get(name, "g_r2_acilis.png")), 1600)''',
'''    name = r["key"][2]; off = .3
    if ":" in name: name, o = name.split(":"); off = float(o)
    cl = gm_clip(name)
    image = cl.at(t - r["t0"] + off) if cl is not None else im(P(CLIP_FALLBACK.get(name, "g_r2_acilis.png")), 1600)''')
# kurallar: 6 satır
rep('yy = y - 190 + i * 120', 'yy = y - 205 + i * 104')
rep('RULES = [(False, "Toplu reklam maili (spam)"), (True, "Her firmaya kişisel mail"), (True, "Herkese açık iletişim adresi"), (True, "KVKK ve ticari ileti kurallarına uy"), (None, "Kazanç garantisi yok")]',
    'RULES = [(False, "Toplu reklam maili (spam)"), (True, "Her markaya kişisel mail"), (True, "Herkese açık iletişim adresi"), (True, "\\"Konsept demo\\" notu"), (True, "KVKK ve ticari ileti kurallarına uy"), (None, "Kazanç garantisi yok")]')
rep('final = f"{OUT}/TurkishCoffeeLady_v2.mp4"', 'final = f"{OUT}/TurkishCoffeeLady_v3.mp4"')
# 8 adımlı yol haritası
rep('''STEPS7 = [("info", "Markayı tanıt"), ("pencil", "Etiketi çizdir"), ("cube", "3D kutuya sar"), ("star", "Sahneye koy"), ("globe", "Siteyi kur"), ("repeat", "Fabrika + Netlify"), ("mail", "E-posta")]''',
'''STEPS7 = [("search", "Markayı araştır"), ("repeat", "Şablondan başla"), ("pencil", "Etiketi çizdir"), ("cube", "3D kutu"), ("star", "Şehir + kaide"), ("globe", "Siteyi kur"), ("eye", "Kontrol ettir"), ("mail", "Yayınla + teklif")]''')
rep('yy = y - 300 + i * 104\n        with fx(c, ps, x, yy, (x - 560, yy - 50, x + 560, yy + 50)):\n            on = i == k - 1; done = i < k - 1\n            sc = 1.06',
    'yy = y - 330 + i * 96\n        with fx(c, ps, x, yy, (x - 560, yy - 50, x + 560, yy + 50)):\n            on = i == k - 1; done = i < k - 1\n            sc = 1.06')
NEW = r'''
# ===================== v3: sohbet, teklif sayfası, üç başlık =====================
HOWTO = [("search", "Yeni ürün duyuran markayı bul"), ("sparkle", "Claude'a markayı araştırt"), ("pencil", "Hazır promptu doldur, görsel ekle"),
         ("eye", "Ekran görüntüsü aldır, düzelttir"), ("globe", "Netlify'a yükle, link al"), ("mail", "Kişisel mail + link")]
TARGETS = [("coffee", "Kahve"), ("sparkle", "Parfüm"), ("heart", "Kozmetik"), ("gem", "Takı"), ("cake", "Çikolata"), ("bag", "İçecek")]
BUGS.update({10: ("x", "Cam şişe", "Gerçek ürün: 250 ml ince alüminyum kutu", "r"), 11: ("check", "İnce kutu", "Duyurudaki fotoğrafı attım, tek mesajda düzeldi", "g")})
MONT_SR = [("1-anasayfa.jpg", "araştır"), ("ilk_surum.jpg", "şablon"), ("labels_bold-istanbul.webp", "etiket"), ("cut_bold-istanbul.webp", "3D kutu"),
           ("sahne_bold-istanbul.webp", "şehir + kaide"), ("2-urun-detay.jpg", "site"), ("3-telefon.jpg", "kontrol"), ("6-koleksiyon.jpg", "yayın"), ("teklif_p3.jpg", "teklif")]
TALKS = {
 9: [("user", ["Bu kahve markasına 3D bir", "lansman sitesi yapalım."]), ("ai", ["Harika! Önce markayı araştırayım."])],
 0: [("user", ["Turkish Coffee Lady'nin sitelerine ve", "Instagram'ına bak. Yeni ne var?"]),
     ("ai", ["1 Ekim'de buzlu Türk kahvesi serisini", "duyurmuşlar: 5 şehir, 5 tat, 250 ml kutu.", "Aralık'ta ABD'de satışa çıkıyor.", "Sitelerinde lansman sayfası yok."]),
     ("user", ["Süper. Bu kutular için bir", "lansman sitesi yapalım."])],
 1: [("user", ["Önceki soğuk kahve demomuzu şablon al,", "bu markaya uyarla."]),
     ("ai", ["İlk sürüm hazır: cam şişe, etiket,", "beş tat sahnesi."]),
     ("user", ["Ürün şişe değil! 250 ml ince kutu.", "Duyurudaki fotoğrafı ekledim."]),
     ("ai", ["Haklısın. İnce alüminyum kutu, açma", "halkası ve etiketle yeniden kurdum."])],
 2: [("user", ["Duyurudaki kutu tasarımını yeniden çiz.", "Şehirleri paketlerdeki çizimlerden al."]),
     ("ai", ["Etiketi düz açılım olarak çiziyorum:", "slogan, logo, tat adı, nazar, şehir."]),
     ("user", ["Arka yüz de olsun: şehrin hikâyesi", "ve tat profili."])],
 3: [("user", ["Her kutu kendi şehrinin önünde,", "premium bir kaidede dursun."]),
     ("ai", ["Şehir çizimi krem kâğıtta, kenarlar", "karanlık, kaidenin arkasında sıcak ışık."]),
     ("user", ["Kaide basit duruyor. Daha pahalı olsun."]),
     ("ai", ["Yivli mermer, pirinç başlık, tadın", "renginde halka, etrafta kahve çekirdeği."])],
 4: [("user", ["Kaydırınca kutular sırayla gelsin.", "Tıklayınca dönsün, hikâyesi açılsın."]),
     ("user", ["3 soruluk tat bulucu ekle. Fiyat yerine", "\"Lansman listesine katıl\" koy. EN + TR."]),
     ("ai", ["Tamam. Lansman bölümünü de ekliyorum:", "Aralık, 500 yıllık miras, belgesel."])],
 5: [("user", ["Her değişiklikten sonra masaüstü ve", "telefonda ekran görüntüsü al, kontrol et."]),
     ("ai", ["Telefonda tat bulucunun kenar boşluğu", "bozuk. Düzelttim, tekrar kontrol ettim."])],
 6: [("user", ["Markaya kısa bir mail yaz. Bir de 3", "paketli bir teklif dosyası hazırla."]),
     ("ai", ["Mail hazır: Türkçe ve İngilizce.", "Teklif: 3 paket, ek hizmetler, takvim,", "ödeme planı. PDF olarak verdim."])],
}
def talk_shown_before(conv, m, t0):
    return any(bb["t"] < t0 - .01 and bb["vis"][0] == "talk" and bb["vis"][1] == conv and bb["vis"][2] > m for bb in BEATS)
def sc_talk(c, t, r, x, y, st, b):
    conv = r["beats"][0]["vis"][1]
    for bb in r["beats"]:
        if t >= bb["t"] - .05: conv = bb["vis"][1]
    msgs = TALKS[conv]
    T, D = [], []
    end_prev = -9
    for m, (who, lines_) in enumerate(msgs):
        if talk_shown_before(conv, m, r["t0"]): T.append(r["t0"] - 5); D.append(0); continue
        ts = next((bb["t"] for bb in r["beats"] if bb["vis"][1] == conv and bb["vis"][2] > m), None)
        if ts is None: T.append(None); D.append(0); continue
        st0 = max(ts + .15, end_prev + .45)
        d = min(2.0, sum(map(len, lines_)) * .026) if who == "user" else .85
        T.append(st0); D.append(d); end_prev = st0 + d
    w, h = 1320, 780; wx, wy = x - w / 2, y - 350
    with fx(c, st, x, y + 40, (wx - 20, wy - 20, wx + w + 20, wy + h + 20)):
        card(c, wx, wy, w, h, 30, sh=.14)
        c.drawCircle(wx + 54, wy + 48, 20, paint(ORANGE)); icon(c, "sparkle", wx + 54, wy + 48, 24)
        text(c, "Claude", wx + 88, wy + 58, "b", 28, INK); text(c, "ile sohbet", wx + 88 + tw("Claude", "b", 28) + 10, wy + 58, "m", 26, MUTED)
        c.drawLine(wx, wy + 96, wx + w, wy + 96, paint("#EFEBE4", 1, 2, cap=False))
    size = 30; lh = size * 1.42
    top, bot = wy + 122, wy + h - 28
    hs = [len(l) * lh + 46 for _, l in msgs]
    tot = 0
    for m in range(len(msgs)):
        if T[m] is not None and t >= T[m]: tot += (hs[m] + 22) * eio(prog(t, T[m], T[m] + .35))
    scroll = max(0, tot - (bot - top))
    c.save(); c.clipRect(skia.Rect.MakeLTRB(wx, top - 8, wx + w, bot + 4))
    yy = top - scroll
    for m, (who, lines_) in enumerate(msgs):
        if T[m] is None or t < T[m]: continue
        ps = appear(t, T[m], .4, rise=18)
        if not ps: yy += hs[m] + 22; continue
        bw = max(tw(s_, "s" if who == "user" else "m", size) for s_ in lines_) + 64
        if who == "user":
            bx = wx + w - bw - 40
            full = " / ".join(lines_); n = int(len(full) * prog(t, T[m] + .1, T[m] + .1 + D[m]))
            typed = full[:n].split(" / ")
            with fx(c, ps, bx + bw / 2, yy + 40, (bx, yy, bx + bw, yy + hs[m])):
                rrect(c, bx, yy, bw, hs[m], 26, NAVY)
                for k2, s_ in enumerate(typed): text(c, s_, bx + 32, yy + 23 + size * .95 + k2 * lh, "s", size, "#FFFFFF")
        else:
            bx = wx + 96
            with fx(c, ps, bx + bw / 2, yy + 40, (wx, yy, bx + bw, yy + hs[m])):
                c.drawCircle(wx + 58, yy + 30, 20, paint(ORANGE)); icon(c, "sparkle", wx + 58, yy + 30, 22)
                if t < T[m] + D[m]:
                    rrect(c, bx, yy, 130, 64, 26, "#F2EEE7")
                    for j in range(3):
                        a_ = .35 + .65 * (.5 + .5 * math.sin((t - T[m]) * 9 - j * 1.1))
                        c.drawCircle(bx + 40 + j * 25, yy + 32, 7, paint(MUTED, a_))
                else:
                    q = eio(prog(t, T[m] + D[m], T[m] + D[m] + .3))
                    rrect(c, bx, yy, bw, hs[m], 26, "#F2EEE7")
                    for k2, s_ in enumerate(lines_): text(c, s_, bx + 32, yy + 23 + size * .95 + k2 * lh, "m", size, INK, q)
        yy += hs[m] + 22
    c.restore()

DOCS = {"teklif_p3.jpg": [(0, 0, 909, 1287), (70, 228, 256, 524), (326, 220, 258, 534), (585, 228, 256, 524), (62, 762, 786, 246)],
        "teklif_p4.jpg": [(0, 0, 909, 1287), (60, 176, 790, 150), (452, 330, 400, 410)]}
def sc_doc(c, t, r, x, y, st, b):
    name = r["key"][2]; R = DOCS[name]
    cur = prev = r["beats"][0]["vis"][2] if len(r["beats"][0]["vis"]) > 2 else 0; tc = r["t0"]
    for bb in r["beats"]:
        v = bb["vis"][2] if len(bb["vis"]) > 2 else 0
        if t >= bb["t"] - .05 and v != cur: prev, cur, tc = cur, v, bb["t"]
    u = eio(prog(t, tc, tc + .8))
    def view(i):
        rx, ry, rw, rh = R[i]; sc_ = min(1560 / rw, 880 / rh); return sc_, rx + rw / 2, ry + rh / 2
    s0, cx0, cy0 = view(prev); s1, cx1, cy1 = view(cur)
    sc_ = math.exp(lerp(math.log(s0), math.log(s1), u)); cx_, cy_ = lerp(cx0, cx1, u), lerp(cy0, cy1, u)
    fw, fh = 1760, 960; fx0, fy0 = x - fw / 2, y + 40 - fh / 2
    with fx(c, st, x, y + 40, (fx0 - 20, fy0 - 20, fx0 + fw + 20, fy0 + fh + 20)):
        card(c, fx0, fy0, fw, fh, 28, color="#E9E5DD", sh=.16)
        c.save(); c.clipRRect(skia.RRect.MakeRectXY(skia.Rect.MakeXYWH(fx0, fy0, fw, fh), 28, 28), True)
        pw, ph = 909 * sc_, 1287 * sc_; px, py = x - cx_ * sc_, y + 40 - cy_ * sc_
        shadow(c, px, py, pw, ph, 6, .25, 30, 12)
        draw_img(c, P(name), px, py, pw, ph, 4, maxw=1700)
        c.restore()

def sc_three(c, t, r, x, y, st, b):
    items = [("cube", "Nasıl yaptım"), ("sparkle", "Sen nasıl yaparsın"), ("tag", "Nasıl para kazanılır")]
    ws = b["words"] if "words" in b else []
    for k, (ic, s_) in enumerate(items):
        tk = r["t0"] + .4 + k * 1.3
        node(c, t, tk, x - 560 + k * 560, y + 20, 92, ic, ORANGE if k != 1 else NAVY, s_, lsize=34)

SCENES.update({"talk": sc_talk, "doc": sc_doc, "three": sc_three})
'''
rep('SCENES.update({"howto2": sc_howto2})', 'SCENES.update({"howto2": sc_howto2})\n' + NEW)
open(p, 'w').write(s); print("ok")
