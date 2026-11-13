# Video kartları: 1920x1080 PNG. Kanal stili: koyu zemin, turuncu etiket, Anton başlık, Inter Tight metin.
import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter
D = os.path.dirname(os.path.abspath(__file__)); OUT = f"{D}/kart"; os.makedirs(OUT, exist_ok=True)
F = "/home/user/analiz/kanal/arac/vid/assets/fonts"
SITE = "/home/user/analiz/kanal/projeler/berkai-studyo/siteler/halare/cut"
W, H = 1920, 1080
BG, CARD, LINE = (247, 243, 234), (255, 253, 248), (222, 213, 196)
TXT, DIM, OR, YES, NO = (27, 34, 64), (120, 110, 100), (242, 140, 40), (40, 150, 80), (210, 60, 50)
def f(n, s): return ImageFont.truetype(f"{F}/{n}", s)
ANTON = lambda s: ImageFont.truetype("/usr/share/fonts/opentype/inter/Inter-Black.otf", s); B = lambda s: f("InterTight800.ttf", s); M = lambda s: f("InterTight600.ttf", s); R = lambda s: f("InterTight500.ttf", s); MONO = lambda s: f("JBMono.ttf", s)

def zemin():
    im = Image.new("RGB", (W, H), BG); d = ImageDraw.Draw(im)
    for i in range(0, W, 60): d.line([(i, 0), (i, H)], fill=(240, 235, 224))
    for j in range(0, H, 60): d.line([(0, j), (W, j)], fill=(240, 235, 224))
    return im, d
def etiket(d, x, y, t, s=40):
    w = d.textlength(t, font=ANTON(s)); d.rounded_rectangle([x, y, x + w + 36, y + s + 26], 10, fill=OR); d.text((x + 18, y + 8), t, font=ANTON(s), fill=(255, 253, 248))
def kutu(d, xy, r=22, fill=CARD, outline=LINE, w=2): d.rounded_rectangle(xy, r, fill=fill, outline=outline, width=w)
def sar(d, t, font, maxw):
    out, cur = [], ""
    for w_ in t.split():
        n = (cur + " " + w_).strip()
        if d.textlength(n, font=font) > maxw and cur: out.append(cur); cur = w_
        else: cur = n
    out.append(cur); return out
def kaydet(im, ad): im.save(f"{OUT}/{ad}.png"); return ad

# 1 şema: iki çalışan
def sema(vurgu=None):
    im, d = zemin(); etiket(d, 120, 90, "SATIŞ HATTI")
    d.text((120, 190), "Hafta içi her gün, ben dokunmadan", font=M(44), fill=DIM)
    adim = [("07:43", "Bulma ekibi", "marka bulur"), ("", "3D site", "vitrin yapar"), ("", "Yayın", "gizli link"), ("11:37", "Mail ekibi", "maili yazar"), ("", "Brevo", "gönderir"), ("", "Marka", "maili alır")]
    x0, y0, bw, gap = 120, 420, 245, 45
    for i, (saat, ad, alt) in enumerate(adim):
        x = x0 + i * (bw + gap); on = vurgu is None or i in vurgu
        kutu(d, [x, y0, x + bw, y0 + 250], outline=OR if on else LINE, w=4 if on else 2)
        if saat: d.text((x + 24, y0 + 26), saat, font=ANTON(46), fill=OR)
        d.text((x + 24, y0 + 110), ad, font=B(40), fill=TXT if on else DIM)
        d.text((x + 24, y0 + 170), alt, font=R(32), fill=DIM)
        if i < len(adim) - 1: d.text((x + bw + 6, y0 + 95), "→", font=B(46), fill=OR)
    d.text((120, 780), "Claude Code · zamanlanmış görev", font=M(40), fill=TXT)
    return im
kaydet(sema(), "sema"); kaydet(sema({4}), "sema_brevo")

# 2 kurallar (sırayla açılır)
kur = ["Günde en fazla 5 yeni firma", "Günde en fazla 15 mail", "Uydurma bilgi yok", "Bulamadıysan \"bulamadım\" de", "Kişisel adrese mail yok"]
for k in range(1, len(kur) + 1):
    im, d = zemin(); etiket(d, 120, 90, "KURALLAR")
    for i, t in enumerate(kur[:k]):
        y = 240 + i * 145; kutu(d, [120, y, 1300, y + 115])
        d.text((160, y + 22), f"{i+1}", font=ANTON(64), fill=OR); d.text((260, y + 30), t, font=B(50), fill=TXT)
    kaydet(im, f"kural_{k}")

# 3 terminal (gerçek kayıt satırları)
term = [("$ ", "python3 hat.py ekle halare --site halarearomatherapy.com"), ("", "11:16  aday olarak eklendi"),
        ("$ ", "python3 hat.py kontrol halare"), ("", "11:17  platform=ikas · e-posta=info@halarearomatherapy.com"),
        ("$ ", "python3 hat.py cek halare h1 h2 h3 h4"), ("", "11:18  4 ürün çekildi"),
        ("$ ", "python3 hat.py uret halare"), ("", "11:25  site üretildi"),
        ("$ ", "python3 hat.py yayinla halare"), ("", "12:31  yayında: halarearomatherapy.netlify.app"),
        ("", ""), ("$ ", "python3 hat.py kontrol <parfüm markası>"), ("", "11:16  platform=shopify · e-posta=yok → elendi")]
def terminal(n):
    im, d = zemin(); kutu(d, [100, 80, 1820, 1000], fill=(12, 12, 14), outline=(50, 50, 56))
    for i, c in enumerate([(235, 85, 70), (240, 190, 60), (95, 200, 120)]): d.ellipse([140 + i * 40, 112, 164 + i * 40, 136], fill=c)
    d.text((300, 106), "satis-hatti — bulma ekibi", font=M(30), fill=DIM)
    for i, (p, t) in enumerate(term[:n]):
        y = 190 + i * 60
        if p: d.text((150, y), p, font=MONO(34), fill=OR); d.text((190, y), t, font=MONO(34), fill=(236, 236, 240))
        else: d.text((190, y), t, font=MONO(34), fill=(240, 100, 90) if "elendi" in t else (120, 210, 140))
    return im
for n in range(1, len(term) + 1): kaydet(terminal(n), f"term_{n:02d}")

# 4 ürünler
def urunler():
    im, d = zemin(); etiket(d, 120, 80, "SEÇİLEN 4 ÜRÜN")
    ad = [("lavanta-kolonyasi-333", "Lavanta kolonyası"), ("mandalina-kolonyasi-334", "Mandalina kolonyası"), ("gul-suyu-335", "Gül suyu"), ("papatya-suyu-336", "Papatya suyu")]
    for i, (fn, t) in enumerate(ad):
        x = 120 + i * 430; kutu(d, [x, 220, x + 390, 900])
        p = Image.open(f"{SITE}/{fn}.webp").convert("RGBA"); p.thumbnail((330, 560)); im.paste(p, (x + 195 - p.width // 2, 250 + (560 - p.height) // 2), p)
        tw = d.textlength(t, font=B(34)); d.text((x + 195 - tw / 2, 840), t, font=B(34), fill=TXT)
    d.text((120, 950), "Aynı seri · farklı renkler · düz önden çekim", font=M(38), fill=DIM)
    return im
kaydet(urunler(), "urunler")

# 5 elendi
im, d = zemin(); kutu(d, [460, 300, 1460, 780], outline=NO, w=4)
d.text((520, 350), "Parfüm markası", font=B(64), fill=TXT); d.text((520, 450), "Shopify mağazası var", font=M(44), fill=DIM)
d.text((520, 520), "Sitede şirket maili yok", font=M(44), fill=NO); etiket(d, 520, 640, "ELENDİ", 50); kaydet(im, "elendi")

# 6 mail kartı (gerçek taslak; ekranda 3D)
mail = ["Merhaba,", "", "Halare'nin lavanta ve mandalina kolonyalarıyla gül ve papatya sularını 3D bir vitrine taşıdım, canlı olarak buradan bakabilirsiniz: halarearomatherapy.netlify.app", "",
        "• Şişeleriniz kendi etiket renklerinde bir sahnede kaideye iniyor; parmakla çevrilebiliyor.", "• \"Spreyi sık\" butonuyla buğu çıkıyor, ürünün içeriği beliriyor.", "• \"Satın al\" her ürünün kendi mağazanızdaki sayfasına gidiyor.", "",
        "İlginizi çekerse 10 dakikalık bir görüntülü görüşmede gösterebilirim.", "", "Bu tür mesajları almak istemezseniz \"çıkış\" yazmanız yeterli."]
def mailkart(vurgu=None):
    im, d = zemin(); etiket(d, 120, 60, "MAİL EKİBİ")
    kutu(d, [380, 60, 1800, 1030], fill=(250, 248, 244), outline=(250, 248, 244))
    ink, gri = (30, 28, 26), (110, 104, 98)
    d.text((440, 100), "Kime", font=M(30), fill=gri); d.text((560, 100), "info@halarearomatherapy.com", font=M(30), fill=ink)
    d.text((440, 150), "Konu", font=M(30), fill=gri); d.text((560, 150), "Halare'nin kolonya ve çiçek suları için 3D vitrin", font=B(30), fill=ink)
    d.line([(440, 205), (1740, 205)], fill=(220, 214, 206), width=2)
    y = 235
    for i, para in enumerate(mail):
        if not para: y += 16; continue
        for ln in sar(d, para, R(31), 1280):
            if vurgu is not None and i in vurgu: d.rectangle([432, y - 4, 1750, y + 40], fill=(255, 226, 196))
            d.text((440, y), ln, font=R(31), fill=ink); y += 44
    return im
kaydet(mailkart(), "mail"); kaydet(mailkart({2}), "mail_v1"); kaydet(mailkart({10}), "mail_v2")

# 7 ayar.json
im, d = zemin(); etiket(d, 120, 90, "AYAR.JSON")
kutu(d, [120, 220, 1300, 900], fill=(12, 12, 14), outline=(50, 50, 56))
ay = [("{", None), ('  "gonderim": ', '"brevo",'), ('  "kuru": ', 'false,'), ('  "gunluk_limit": ', '15,'), ('  "takip_gun": ', '5,'), ('  "saat": ', '[10, 17]'), ("}", None)]
for i, (k, v) in enumerate(ay):
    y = 270 + i * 82; d.text((180, y), k, font=MONO(46), fill=(236, 236, 240))
    if v: d.text((180 + d.textlength(k, font=MONO(46)), y), v, font=MONO(46), fill=OR)
d.text((1380, 320), "Brevo ile gönder", font=B(46), fill=TXT); d.text((1380, 400), "Günde en fazla 15", font=M(40), fill=DIM); d.text((1380, 460), "+5 gün tek takip", font=M(40), fill=DIM); d.text((1380, 520), "Hafta içi 10–17", font=M(40), fill=DIM)
kaydet(im, "ayar")

# 8 Brevo akışı (zarf hareketi, kareler)
def akis(t):
    im, d = zemin(); etiket(d, 120, 90, "11:37 · GÖNDERİM")
    nok = [("Mail ekibi", 260), ("Brevo", 960), ("info@halarearomatherapy.com", 1660)]
    for ad, x in nok:
        kutu(d, [x - 200, 430, x + 200, 650], outline=OR if ad == "Brevo" else LINE, w=4 if ad == "Brevo" else 2)
        fnt = B(44) if len(ad) < 15 else M(26); tw = d.textlength(ad, font=fnt); d.text((x - tw / 2, 515), ad, font=fnt, fill=TXT)
    d.line([(460, 540), (760, 540)], fill=LINE, width=6); d.line([(1160, 540), (1460, 540)], fill=LINE, width=6)
    x = 460 + (1460 - 460) * min(1, t)
    if t < 1:
        if 760 < x < 1160: x = 760 if t < .45 else 1160
        d.rounded_rectangle([x - 50, 505, x + 50, 575], 8, fill=OR); d.line([(x - 50, 505), (x, 545), (x + 50, 505)], fill=(20, 14, 10), width=4)
    else:
        d.text((1500, 690), "✓ gönderildi", font=B(44), fill=YES)
    d.text((120, 820), "Ücretsiz plan: günde 300 · bize 15 yeter", font=M(40), fill=DIM)
    return im
for k in range(0, 61): kaydet(akis(k / 50), f"akis_{k:02d}")

# 9 takip
im, d = zemin(); etiket(d, 120, 90, "TAKİP")
for i, (a, b) in enumerate([("Gün 0", "kişiye özel ilk mail"), ("Gün +5", "cevap yoksa tek kısa takip"), ("Sonra", "bırakır, yapışmaz"), ("\"Çıkış\"", "listeye alınır, bir daha yazılmaz")]):
    y = 240 + i * 170; kutu(d, [120, y, 1500, y + 130]); d.text((160, y + 36), a, font=ANTON(56), fill=OR); d.text((480, y + 42), b, font=B(48), fill=TXT)
kaydet(im, "takip")

# 10 beş adım
adimlar = [("Claude Code", "işini iş tanımı gibi yaz"), ("Hedef müşteri", "sektör, mağaza, eleme kuralı"), ("Netlify", "siteleri yayına al (ücretsiz)"), ("Brevo + alan adı", "mail gönderimi"), ("Zamanlanmış görev", "hafta içi her sabah")]
for k in range(1, 6):
    im, d = zemin(); etiket(d, 120, 70, "SEN NASIL KURARSIN")
    for i, (a, b) in enumerate(adimlar):
        y = 200 + i * 160; on = i == k - 1; kutu(d, [120, y, 1700, y + 130], outline=OR if on else LINE, w=4 if on else 2)
        d.text((160, y + 20), str(i + 1), font=ANTON(80), fill=OR if i < k else LINE)
        d.text((280, y + 22), a, font=B(48), fill=TXT if i < k else DIM); d.text((280, y + 80), b, font=M(32), fill=DIM)
    kaydet(im, f"adim_{k}")

# 11 sık sorulanlar
sss = [("Kod bilmem lazım mı?", "Hayır. Ne istediğini Türkçe anlatıyorsun, kodu Claude yazıyor."), ("Markalar kızmaz mı?", "Site gizli linkte, Google'da yok, altında \"konsept demo\" yazıyor."),
       ("Spam olmaz mı?", "Günde 15 mail, her biri markaya özel, sadece şirket adresine."), ("Her sektörde olur mu?", "En iyisi ürünü olan markalar: şişe, kavanoz, kutu."), ("Claude ücretli mi?", "Evet. Brevo ve Netlify'ın ücretsiz planı yetiyor.")]
for i, (q, a) in enumerate(sss):
    im, d = zemin(); etiket(d, 120, 90, f"SIK SORULAN {i+1}/5")
    y = 300
    for ln in sar(d, q, ANTON(110), 1650): d.text((120, y), ln, font=ANTON(110), fill=TXT); y += 135
    y += 40
    for ln in sar(d, a, M(52), 1600): d.text((120, y), ln, font=M(52), fill=DIM); y += 70
    kaydet(im, f"sss_{i+1}")

# 12 fiyat mantığı
im, d = zemin(); etiket(d, 120, 90, "PARA KISMI")
for i, t in enumerate(["Fiyat kapsama göre değişir", "Kurulum + aylık bakım", "Ek işler ayrı"]):
    y = 260 + i * 150; kutu(d, [120, y, 1400, y + 120]); d.text((170, y + 30), t, font=B(54), fill=TXT)
kutu(d, [120, 760, 1400, 900], outline=NO, w=4); d.text((170, 795), "Kazanç garantisi yok", font=B(58), fill=NO); kaydet(im, "fiyat")

# 13 hata / ipucu
im, d = zemin(); etiket(d, 120, 90, "O HATA")
kutu(d, [120, 250, 900, 820], outline=NO, w=4); d.text((170, 290), "✗", font=B(90), fill=NO)
for i, t in enumerate(["Brevo + Gmail adresi", "Hesap incelemeye alınır", "Gönderim durur"]): d.text((170, 430 + i * 100), t, font=B(46) if i == 0 else M(42), fill=TXT if i == 0 else DIM)
kutu(d, [1020, 250, 1800, 820], outline=YES, w=4); d.text((1070, 290), "✓", font=B(90), fill=YES)
for i, t in enumerate(["Kendi alan adın", "Brevo'da doğrula", "Spam'e düşmez"]): d.text((1070, 430 + i * 100), t, font=B(46) if i == 0 else M(42), fill=TXT if i == 0 else DIM)
kaydet(im, "hata")

# 14 özet + uyum
im, d = zemin(); etiket(d, 120, 90, "KISACASI")
for i, t in enumerate(["Müşteriyi bul.", "Siteyi yap.", "Maili at.", "Kararı sen ver."]): d.text((120, 220 + i * 130), t, font=ANTON(100), fill=OR if i == 3 else TXT)
uy = ["Demo siteler bağımsız konsepttir; markayla resmi bağı yoktur.", "Yalnızca sitede yayınlanmış şirket adresine, kişiye özel tek mail.", "Çıkış isteyen bir daha yazılmaz (KVKK / ticari ileti).", "Kazanç garantisi yoktur."]
for i, t in enumerate(uy): d.text((120, 800 + i * 50), "• " + t, font=R(32), fill=DIM)
kaydet(im, "ozet")

# 15 kanca metni (S2)
im, d = zemin(); d.text((120, 380), "\"Abi bunlar süslü demo,", font=ANTON(110), fill=TXT); d.text((120, 520), "gerçekte çalışmaz.\"", font=ANTON(110), fill=TXT)
d.text((120, 720), "Hepsini açıyorum: ofis, panel, mail.", font=M(52), fill=OR); kaydet(im, "kanca")
print("kartlar:", len(os.listdir(OUT)))
