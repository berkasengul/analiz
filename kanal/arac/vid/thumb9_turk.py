import os
V = os.path.dirname(os.path.abspath(__file__))
exec(open(f"{V}/thumb7_gm.py").read().split("# G1:")[0])
TN = os.path.join(os.path.dirname(V), "turk", "tn")
D = "/home/user/analiz/video_teslim"
def out(s, name):
    from PIL import Image as I
    I.fromarray(s.makeImageSnapshot().toarray()).convert("RGB").save(f"{D}/{name}", quality=93); print(name)
def fr2(n): return Image.open(f"{TN}/{n}.png").convert("RGB")
def topshade(c, a=.85, h=330):
    p = skia.Paint(); p.setShader(skia.GradientShader.MakeLinear([skia.Point(0, 0), skia.Point(0, h)], [C("#1A140C", a).toColor(), C("#1A140C", 0).toColor()])); c.drawRect(skia.Rect.MakeWH(W, h), p)

# T1: 5.600 KM — rota haritası
s = surface(W, H); c = s.getCanvas()
full(c, fr2("rota"), 1.0, zoom=1.12, cx=.62, cy=.25); topshade(c, .55, 300)
outline_text(c, "TÜRKLER ANADOLU'YA", 40, 120, 92)
tag(c, 42, 150, "NASIL GELDİ?", ORANGE, 110, -3)
badge(c, 1110, 560, 110, "5.600\nKM", size=56, rot=8) if False else None
x, y = 860, 430
c.save(); c.rotate(6, x + 180, y + 80)
rrect(c, x, y, 380, 170, 26, "#B23A2E"); f = skia.Font(ANTON, 96); c.drawString("5.600 KM", x + 26, y + 112, f, paint("#FFFFFF"))
f = skia.Font(INTER8, 30); c.drawString("600 YIL", x + 130, y + 152, f, paint("#FFE2C8"))
c.restore()
out(s, "TA_T1_nasil_geldi_5600km.jpg")

# T2: 1071 — hilal kuşatma
s = surface(W, H); c = s.getCanvas()
full(c, fr2("hilal"), 1.0, zoom=1.32, cx=.32, cy=.62); leftshade(c, .9, .55)
outline_text(c, "1071", 44, 250, 230)
tag(c, 48, 300, "İMPARATOR ESİR!", ORANGE, 84, -3)
f = skia.Font(INTER8, 44); c.drawString("Malazgirt'te ne oldu?", 56, 500, f, paint("#FFFFFF"))
out(s, "TA_T2_1071_imparator_esir.jpg")

# T3: Anadolu nasıl Türk yurdu oldu — beylik haritası
s = surface(W, H); c = s.getCanvas()
full(c, fr2("beylik"), 1.0, zoom=1.15, cx=.55, cy=.35); topshade(c, .7, 320)
outline_text(c, "600 YILLIK YOLCULUK", 40, 125, 100)
tag(c, 42, 155, "HARİTALARLA", ORANGE, 92, -3)
claude_tile(c, 1150, 590, 90)
f = skia.Font(INTER8, 30); rrect(c, 820, 610, 310, 56, 28, "#FFFFFF"); c.drawString("kodla çizildi", 850, 648, f, paint(INK))
out(s, "TA_T3_600_yil_haritalarla.jpg")
