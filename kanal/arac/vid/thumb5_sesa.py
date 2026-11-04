import os
V = os.path.dirname(os.path.abspath(__file__))
exec(open(f"{V}/thumb4_sesa.py").read().split("# ---------- K:")[0])
s = surface(W, H); c = s.getCanvas(); c.clear(C("#0B0D16"))
glow(c, 930, 360, 620, "#6A55C8", .55); glow(c, 1000, 640, 380, "#FF7A2F", .22)
# ince ızgara
gp = paint("#FFFFFF", .04, 1)
for x in range(0, W, 48): c.drawLine(x, 0, x, H, gp)
for y in range(0, H, 48): c.drawLine(0, y, W, y, gp)
# site: büyük tarayıcı penceresi, hafif perspektif
lap = laptop_image(SITE, "sesakids.com.tr")
draw_perspective(c, lap, [(560, 120), (1262, 92), (1274, 590), (548, 628)])
# sohbet balonları
def bubble(x, y, w, h, who, msg, col, tcol):
    sp = paint("#000000", .5); sp.setMaskFilter(skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, 20))
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect.MakeXYWH(x + 6, y + 16, w, h), 30, 30), sp)
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect.MakeXYWH(x, y, w, h), 30, 30), paint(col))
    text(c, who, x + 128, y + 52, 28, ORANGE); text(c, msg, x + 128, y + 110, 50, tcol)
bubble(40, 120, 620, 148, "SEN", "bana 3D mağaza yap", "#FFFFFF", INK)
put_crow(c, "", 58, 140, 96)
bubble(40, 320, 560, 148, "YAPAY ZEKÂ", "yaptım bile...", "#FFFFFF", INK)
claude_tile(c, 64, 344, 96)
arrow(c, [(560, 470), (640, 560), (760, 520)], w=20)
cursor(c, 920, 380, 3.0)
tag(c, 40, 560, "1 GÜNDE, KOD YOK", ORANGE, 72, -3)
save(s, "M_bana_3d_magaza_yap.jpg")
print("ok")
