# Merak odaklı yeni thumbnail seti
import os, sys, math
V = os.path.dirname(os.path.abspath(__file__))
exec(open(f"{V}/thumb_sesa.py").read().split("SHOT = ")[0])
OUT = "/home/user/analiz/video_teslim"
FINAL = Image.open(f"{V}/assets/tl/0dcfddd_a.png").convert("RGB")
FIRST = Image.open(f"{V}/assets/tl/b5a6c14_a.png").convert("RGB")
STRAW = Image.open(f"{V}/assets/tl/2f80f95_a.png").convert("RGB")

def badge(c, cx, cy, r, txt, col=ORANGE, size=None, rot=8):
    c.save(); c.rotate(rot, cx, cy)
    sp = paint("#000000", .28); sp.setMaskFilter(skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, 12))
    c.drawCircle(cx + 6, cy + 14, r, sp)
    c.drawCircle(cx, cy, r + 10, paint("#FFFFFF")); c.drawCircle(cx, cy, r, paint(col))
    f = skia.Font(ANTON, size or r * 1.5); l, t, rr, b = ink_bounds(txt, f)
    x, y = cx - (l + rr) / 2, cy - (t + b) / 2
    c.drawString(txt, x, y, f, paint(INK, 1, 9)); c.drawString(txt, x, y, f, paint("#FFFFFF")); c.restore()

def tag(c, x, y, txt, col=INK, size=46, rot=-4):
    f = skia.Font(ANTON, size); l, t, r, b = ink_bounds(txt, f)
    w, h = r - l + 40, b - t + 26
    c.save(); c.rotate(rot, x + w / 2, y + h / 2)
    sp = paint("#000000", .25); sp.setMaskFilter(skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, 8))
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect.MakeXYWH(x + 3, y + 8, w, h), 12, 12), sp)
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect.MakeXYWH(x - 5, y - 5, w + 10, h + 10), 15, 15), paint("#FFFFFF"))
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect.MakeXYWH(x, y, w, h), 12, 12), paint(col))
    c.drawString(txt, x + 20 - l, y + 13 - t, f, paint("#FFFFFF")); c.restore()

def lap_at(c, img, quad):
    draw_perspective(c, laptop_image(img, "sesakids.com.tr"), quad)

BIGQ = [(600, 150), (1255, 118), (1268, 560), (585, 590)]

# D: BUNU KİM YAPTI?  + dev soru işareti
s = surface(W, H); c = s.getCanvas(); background(c)
lap_at(c, FINAL, BIGQ)
headline(c, "BUNU", "KİM YAPTI?", 48, 70, s1=210, s2=150, maxw=560)
badge(c, 1150, 150, 95, "?", size=170, rot=10)
put_crow(c, "", 70, 470, 190, rot=-6)
save(s, "D_bunu_kim_yapti.jpg")

# E: önce / sonra — 1. sürüm küçük, son hali büyük
s = surface(W, H); c = s.getCanvas(); background(c)
lap_at(c, FIRST, [(560, 330), (850, 316), (856, 520), (552, 534)])
lap_at(c, FINAL, [(880, 170), (1262, 150), (1270, 452), (872, 470)])
arrow(c, [(700, 300), (760, 200), (860, 200)])
tag(c, 590, 560, "1. MESAJ", INK, 44, -3)
tag(c, 990, 500, "SON HALİ", ORANGE, 52, 3)
headline(c, "SADECE", "KONUŞTUM", 48, 70, s1=190, s2=150, maxw=480)
put_crow(c, "", 70, 470, 190, rot=-6)
save(s, "E_sadece_konustum.jpg")

# F: BU SİTE KAÇ PARA?  + fiyat etiketi ???
s = surface(W, H); c = s.getCanvas(); background(c)
lap_at(c, STRAW, BIGQ)
headline(c, "BU SİTE", "KAÇ PARA?", 48, 70, s1=200, s2=150, maxw=560)
badge(c, 1140, 520, 92, "???", size=95, rot=-10)
put_crow(c, "", 70, 470, 190, rot=-6)
save(s, "F_bu_site_kac_para.jpg")

# G: 0 SATIR KOD  + dev "0"
s = surface(W, H); c = s.getCanvas(); background(c)
lap_at(c, FINAL, BIGQ)
headline(c, "KOD YAZMADIM", "AMA BAK", 48, 70, s1=170, s2=160, maxw=560)
tag(c, 820, 540, "0 SATIR KOD", ORANGE, 62, 4)
cursor(c, 940, 330, 2.8)
put_crow(c, "", 70, 470, 190, rot=-6)
save(s, "G_kod_yazmadim_ama_bak.jpg")
print("ok")
