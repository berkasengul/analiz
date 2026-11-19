# Stadyum uzun videosu kartları: 1920x1080 PNG, BerkAİ stili (krem zemin, turuncu etiket, Inter Tight).
import os
from PIL import Image, ImageDraw, ImageFont
D = os.path.dirname(os.path.abspath(__file__)); OUT = os.environ.get("KART", f"{D}/kart"); os.makedirs(OUT, exist_ok=True)
F = f"{D}/fonts"
W, H = 1920, 1080
BG, CARD, LINE = (247, 243, 234), (255, 253, 248), (222, 213, 196)
TXT, DIM, OR, YES, NO = (27, 34, 64), (120, 110, 100), (242, 140, 40), (40, 150, 80), (210, 60, 50)
def f(n, s): return ImageFont.truetype(f"{F}/{n}", s)
BLACK = lambda s: ImageFont.truetype("/usr/share/fonts/opentype/inter/Inter-Black.otf", s)
B = lambda s: f("InterTight800.ttf", s); M = lambda s: f("InterTight600.ttf", s); R = lambda s: f("InterTight500.ttf", s)

def zemin():
    im = Image.new("RGB", (W, H), BG); d = ImageDraw.Draw(im)
    for i in range(0, W, 60): d.line([(i, 0), (i, H)], fill=(240, 235, 224))
    for j in range(0, H, 60): d.line([(0, j), (W, j)], fill=(240, 235, 224))
    return im, d
def etiket(d, x, y, t, s=40, fill=OR):
    w = d.textlength(t, font=BLACK(s)); d.rounded_rectangle([x, y, x + w + 36, y + s + 26], 10, fill=fill); d.text((x + 18, y + 8), t, font=BLACK(s), fill=(255, 253, 248))
def kutu(d, xy, r=22, fill=CARD, outline=LINE, w=2): d.rounded_rectangle(xy, r, fill=fill, outline=outline, width=w)
def kaydet(im, ad): im.save(f"{OUT}/{ad}.png")

def liste(baslik, alt, satirlar, k, ad, sol=120, gen=1680, yuk=150, bas=250):
    """Numaralı kart, satırlar sırayla açılır: satirlar = [(başlık, açıklama, renk)]"""
    im, d = zemin(); etiket(d, sol, 90, baslik)
    if alt: d.text((sol + d.textlength(baslik, font=BLACK(40)) + 70, 100), alt, font=M(40), fill=DIM)
    for i, (t, a, c) in enumerate(satirlar[:k]):
        y = bas + i * (yuk + 22); son = i == k - 1
        kutu(d, [sol, y, sol + gen, y + yuk], outline=OR if son else LINE, w=4 if son else 2)
        d.text((sol + 40, y + (yuk - 80) // 2), f"{i+1}", font=BLACK(72), fill=c or OR)
        ty = y + 26 if a else y + (yuk - 56) // 2
        d.text((sol + 150, ty), t, font=B(52), fill=TXT)
        if a: d.text((sol + 150, y + 92), a, font=R(36), fill=DIM)
    kaydet(im, ad)

# 1 · Instagram hikâyesi (genel, hesap adı yok)
im, d = zemin(); etiket(d, 120, 90, "NASIL BAŞLADI")
kutu(d, [120, 230, 1000, 470]); d.text((170, 260), "Instagram'daki video:", font=M(38), fill=DIM)
d.text((170, 320), "“Yorum bırakın, nasıl", font=B(54), fill=TXT); d.text((170, 390), "yapıldığını mesaj atacağım”", font=B(54), fill=TXT)
kutu(d, [920, 520, 1800, 680], fill=(232, 240, 255), outline=(190, 205, 235)); d.text((970, 565), "Ben: “Mesaj attım”", font=B(50), fill=TXT)
kutu(d, [120, 730, 1000, 890]); d.text((170, 775), "Cevap: … gelmedi", font=B(54), fill=NO)
d.text((1100, 790), "→ Ben de kendim yaptım.", font=B(56), fill=OR)
kaydet(im, "instagram")

# 2 · Hata: "kalitesiz" demek yetmedi
im, d = zemin(); etiket(d, 120, 90, "BENİM HATAM")
kutu(d, [120, 250, 900, 820], outline=NO, w=4); d.text((170, 290), "✗ Böyle dedim", font=B(56), fill=NO)
d.text((170, 400), "“Çok kalitesiz,", font=B(60), fill=TXT); d.text((170, 480), "çok basit olmuş.”", font=B(60), fill=TXT)
d.text((170, 640), "Neyin kötü olduğu belli değil", font=R(38), fill=DIM)
kutu(d, [1020, 250, 1800, 820], outline=YES, w=4); d.text((1070, 290), "✓ Böyle düzeldi", font=B(56), fill=YES)
for i, t in enumerate(["Stadın gerçek fotoğrafları", "İçi, dışı, tribünler", "Koltuklar, yazılar"]): d.text((1070, 410 + i * 85), "• " + t, font=B(48), fill=TXT)
d.text((1070, 690), "Yapay zekâ ne verirsen onu yapar", font=R(38), fill=DIM)
kaydet(im, "hatam")

# 3 · Üç parça
P = [("Statın etrafı", "Uydu fotoğrafı + OpenStreetMap binaları ve yolları", None),
     ("Statın dışı", "Hazır 3D model (SketchUp 3D Warehouse)", None),
     ("Koltuklar", "Claude kendi dizdi · her koltuk tek tek tıklanıyor", None)]
for k in range(1, 4): liste("SİTE 3 PARÇA", "", P, k, f"parca_{k}", yuk=170, bas=270)
im, d = zemin(); etiket(d, 120, 90, "KAYNAK YAZ")
kutu(d, [120, 260, 1800, 520]); d.text((170, 300), "Fenerbahçe modeli: Ahmet Ş.", font=B(60), fill=TXT); d.text((170, 400), "SketchUp 3D Warehouse · lisansına bak", font=M(42), fill=DIM)
kutu(d, [120, 580, 1800, 840]); d.text((170, 620), "Harita © OpenStreetMap", font=B(60), fill=TXT); d.text((170, 720), "Ücretsiz · tek şartı sitede kaynağı yazmak", font=M(42), fill=DIM)
kaydet(im, "kaynak")

# 4 · Yorum sorusu
im, d = zemin(); etiket(d, 120, 90, "SİZCE?")
d.text((120, 210), "Hangi stat daha güzel olmuş?", font=B(78), fill=TXT)
for i, (t, c) in enumerate([("RAMS Park", (169, 30, 45)), ("Şükrü Saracoğlu", (26, 47, 143)), ("Tüpraş Stadyumu", (23, 24, 28))]):
    x = 120 + i * 570; kutu(d, [x, 400, x + 530, 700], outline=c, w=6)
    tw = d.textlength(t, font=B(50)); d.text((x + 265 - tw / 2, 520), t, font=B(50), fill=c)
d.text((120, 800), "Taraftarlığı bırakın, yorumlara yazın", font=M(52), fill=OR)
kaydet(im, "yorum")

# 5 · Dört sorun
S = [("Kamera donuyor, dönüyordu", "→ Tek, yumuşak bir hareket", None), ("Koltuk renkleri değişiyordu", "→ Açılış efekti kaldırıldı", None),
     ("Model parçaları koltuktan çıkıyordu", "→ Ekran görüntüsüyle gösterdim", None), ("Dosya çok büyüktü", "→ İkiye bölündü", None)]
for k in range(1, 5): liste("4 SORUN", "", S, k, f"sorun_{k}", yuk=150)
im, d = zemin(); etiket(d, 120, 90, "EN ÇOK İŞE YARAYAN")
kutu(d, [120, 260, 900, 760], outline=NO, w=4); d.text((170, 300), "✗", font=B(80), fill=NO); d.text((170, 440), "“Olmamış.”", font=B(70), fill=TXT)
kutu(d, [1020, 260, 1800, 760], outline=YES, w=4); d.text((1070, 300), "✓", font=B(80), fill=YES)
d.text((1070, 420), "Ekran görüntüsü", font=B(60), fill=TXT); d.text((1070, 500), "+ tek cümle:", font=B(60), fill=TXT); d.text((1070, 600), "“Şuradan çıkıyor.”", font=M(50), fill=OR)
kaydet(im, "ders")

# 6 · Beş adım + maliyet
A = [("Referans bul", "“Bunun gibi olsun”", None), ("Gerçek bir yer seç", "“Bir stat” değil, “şu stat”", None), ("Veriyi topla", "Uydu · OpenStreetMap · 3D model ya da fotoğraf", None),
     ("Claude Code'a anlat", "Komut açıklamada", None), ("Telefonda dene", "Kasıyorsa anlamı yok", None)]
for k in range(1, 6): liste("5 ADIM", "", A, k, f"adim_{k}", yuk=140, bas=215)
im, d = zemin(); etiket(d, 120, 90, "MALİYET")
for i, (t, a, c) in enumerate([("Claude", "ücretli plan", TXT), ("OpenStreetMap", "ücretsiz", YES), ("3D modeller", "ücretsiz", YES), ("Netlify", "ücretsiz plan yetiyor", YES)]):
    y = 240 + i * 135; kutu(d, [120, y, 1300, y + 112]); d.text((160, y + 26), t, font=B(52), fill=TXT); tw = d.textlength(a, font=B(44)); d.text((1260 - tw, y + 32), a, font=B(44), fill=c)
etiket(d, 120, 820, "ASIL MALİYET: ZAMAN", 54)
kaydet(im, "maliyet")

# 7 · Para
im, d = zemin(); etiket(d, 120, 90, "KİME SATILIR?")
kutu(d, [120, 260, 1800, 560], outline=NO, w=4); d.text((170, 300), "✗ Galatasaray'a mı?", font=B(70), fill=NO); d.text((170, 420), "Büyük kulüplerin kendi bilet sistemleri var", font=M(46), fill=DIM)
kutu(d, [120, 620, 1800, 920], outline=OR, w=4); d.text((170, 660), "✓ Bu site senin vitrinin", font=B(70), fill=TXT); d.text((170, 780), "Fikir: almadan önce oradan nasıl göründüğünü gör", font=M(46), fill=OR)
kaydet(im, "kime")
MU = [("Konser salonu · tiyatro · spor salonu", "“Sahneyi görebilecek miyim?”", None), ("Alt lig kulüpleri · organizasyon", "Böyle bir sistemleri yok", None),
      ("Konut projeleri", "Koltuk yerine daire: balkondan manzara · bence en büyüğü", None), ("Oteller", "Oda manzarası", None)]
for k in range(1, 5): liste("4 MÜŞTERİ", "", MU, k, f"musteri_{k}", yuk=150)
im, d = zemin(); etiket(d, 120, 90, "NASIL SATILIR")
adim = [("1", "Önce demo", "o yerin kendisi"), ("2", "Link at", "“Salonunuz böyle”"), ("3", "İlk 5 saniye", "en güzel açı")]
for i, (n, t, a) in enumerate(adim):
    x = 120 + i * 590; kutu(d, [x, 260, x + 520, 600], outline=OR if i == 0 else LINE, w=4 if i == 0 else 2)
    d.text((x + 40, 290), n, font=BLACK(80), fill=OR); d.text((x + 40, 420), t, font=B(56), fill=TXT); d.text((x + 40, 510), a, font=R(38), fill=DIM)
    if i < 2: d.text((x + 535, 400), "→", font=B(50), fill=OR)
kutu(d, [120, 680, 1800, 900]); d.text((170, 715), "Kurulum ücreti + aylık bakım", font=B(56), fill=TXT); d.text((170, 805), "Kazanç garantisi yok · telefonu açıp konuşmak şart", font=M(42), fill=NO)
kaydet(im, "satis")

# 8 · Hata
im, d = zemin(); etiket(d, 120, 90, "BAŞTAKİ HATA", fill=NO)
kutu(d, [120, 250, 1800, 560], outline=NO, w=5); d.text((170, 290), "Kulüp adı ve logosuyla", font=B(76), fill=TXT); d.text((170, 390), "para kazanmaya çalışmak", font=B(76), fill=NO)
d.text((170, 490), "Tescilli marka → site kapanır, başın belaya girer", font=M(40), fill=DIM)
kutu(d, [120, 620, 1800, 900], outline=YES, w=4); d.text((170, 660), "✓ Bilet satışını sen yapma", font=B(60), fill=TXT); d.text((170, 770), "Resmi satış sitesine yönlendir · sen vitrini sat", font=M(46), fill=YES)
kaydet(im, "hata")
print("kartlar:", len(os.listdir(OUT)))
