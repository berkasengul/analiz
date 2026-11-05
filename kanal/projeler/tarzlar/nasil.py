# "Nasıl yaptık" açıklama görselleri (3 adet, 1920x1080)
import math
from fmtlib import *
import cop, tahta, veri

def surface():
    s = skia.Surface.MakeRaster(skia.ImageInfo.Make(W, H, skia.ColorType.kRGBA_8888_ColorType, skia.AlphaType.kPremul_AlphaType)); return s
def save(s, name):
    Image.fromarray(s.makeImageSnapshot().toarray(colorType=skia.ColorType.kRGBA_8888_ColorType)).convert("RGB").save(f"{D}/out/{name}", quality=92)
INK = "#1B1B1B"; RED = "#D23A2E"; BLUE = "#2C6FB7"; GREY = "#7A7A7A"

def label(c, s, x, y, tx, ty, color=RED):
    c.drawCircle(x, y, 9, paint(color)); c.drawLine(x, y, tx, ty, paint(color, 1, 3))
    text(c, s, tx + (10 if tx > x else -10), ty + 14, F_CAV, 54, color, align="left" if tx > x else "right")

# 1) çöp adam
s = surface(); c = s.getCanvas(); c.drawImage(paper_texture("#FBF8F1"), 0, 0)
text(c, "Çöp adam = 1 daire + birkaç çizgi", 110, 140, F_CAV, 88, INK)
g = lambda x: 820
hip = (520, 820 - 150)
info = cop.stick(c, hip, [(470, 820), (575, 820)], .0, 1, [(420, 620), (640, 600)], hat="sarik", s=2.0)
c.drawLine(300, 822, 760, 822, paint(INK, 1, 5))
hc, sh = info["head"], info["sh"]
for p_ in (hip, sh): c.drawCircle(*p_, 10, paint(RED))
label(c, "baş", hc[0] + 40, hc[1], 800, hc[1] - 60)
label(c, "omuz", sh[0], sh[1], 800, sh[1] + 30)
label(c, "kalça", hip[0], hip[1], 800, hip[1] + 10)
label(c, "diz", 561, 745, 800, 770)
# yürüyüş döngüsü
text(c, "Yürüme: 4 poz, sürekli tekrar", 1080, 360, F_HAND, 48, INK)
for k in range(4):
    ph = k * math.pi / 2; x = 1160 + k * 180
    cop.walker(c, x, 0, .2, 1, None, amp=26, phase=ph, ground=lambda X: 640, hat=None)
    text(c, f"{k + 1}", x, 690, F_CAV, 44, GREY, align="center")
c.drawLine(1060, 642, 1820, 642, paint(INK, .4, 3))
text(c, "Kod her karede bacağı biraz", 1080, 800, F_HAND, 42, GREY)
text(c, "ileri-geri sallıyor; hepsi bu.", 1080, 850, F_HAND, 42, GREY)
save(s, "nasil_cop.jpg")

# 2) beyaz tahta
s = surface(); c = s.getCanvas(); c.drawImage(paper_texture("#FAFAF8", amt=3), 0, 0)
text(c, "Beyaz tahta: çizgiyi adım adım aç", 110, 140, F_CAV, 88, INK)
c.save(); c.translate(-60, 60); c.scale(.92, .92)
for fn, a_, b_ in tahta.STRUCT[:4]:
    tahta.stroke(c, fn, 99, a_, b_)
d = skia.Path(tahta.path_of(tahta.annex_l)); pk = paint(RED, 1, 5); pk.setPathEffect(skia.DashPathEffect.Make([18, 14], 0)); c.drawPath(d, pk)
pt = tahta.trimmed(tahta.path_of(tahta.annex_r), .55); c.drawPath(pt, paint(INK, 1, 5.5))
e = tahta.path_end(tahta.path_of(tahta.annex_r), .55); tahta.pen(c, e, INK)
c.restore()
for k, s_ in enumerate(["1. Şekli çizgi olarak tarif et", "2. Çizgiyi yavaş yavaş aç", "3. Kalem ucu çizginin ucunu izlesin", "4. Yazılar da harf harf görünsün"]):
    text(c, s_, 1180, 380 + k * 120, F_HAND, 50, INK if k else RED)
text(c, "- - -  sıradaki çizgi", 140, 1000, F_HAND, 38, RED)
save(s, "nasil_tahta.jpg")

# 3) veri
s = surface(); c = s.getCanvas(); c.clear(col(veri.BGC))
text(c, "Veri animasyonu: tablo → çubuk", 110, 140, F_BLACK, 66, veri.INK)
x0, y0 = 110, 250
c.drawRRect(skia.RRect.MakeRectXY(skia.Rect.MakeXYWH(x0 - 20, y0 - 40, 760, 700), 18, 18), paint("#161D2E"))
hdr = ["Devlet", "Kuruluş", "Yıkılış", "Yıl"]; cx = [x0, x0 + 330, x0 + 480, x0 + 630]
for h, x in zip(hdr, cx): text(c, h, x, y0 + 10, F_BOLD, 28, veri.MUTED)
for k, (n, a_, b_) in enumerate(veri.DATA):
    y = y0 + 80 + k * 78
    c.drawLine(x0, y - 44, x0 + 720, y - 44, paint(veri.FAINT, 1, 2, cap=False))
    for v, x in zip([n.replace(" (Doğu Roma)", ""), veri.yr(a_), str(b_), str(veri.life(a_, b_))], cx): text(c, v, x, y, F_SEMI, 30, veri.INK)
c.drawLine(900, 600, 1010, 600, paint(veri.BAR, 1, 8)); ar = skia.Path(); ar.moveTo(1030, 600); ar.lineTo(1000, 580); ar.lineTo(1000, 620); ar.close(); c.drawPath(ar, paint(veri.BAR))
for k, (n, a_, b_) in enumerate(veri.DATA):
    L = veri.life(a_, b_); y = 300 + k * 74; w = 640 * L / 1100
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect.MakeXYWH(1080, y, w, 46), 6, 6), paint(veri.BAR))
    text(c, f"{L}", 1080 + w + 14, y + 34, F_BOLD, 28, veri.INK)
text(c, "Önce tarihleri kontrol et, sonra çubuk sayıyla birlikte büyüsün.", 110, 1040, F_MED, 30, veri.MUTED)
save(s, "nasil_veri.jpg")
print("ok")
