import os
V = os.path.dirname(os.path.abspath(__file__))
exec(open(f"{V}/thumb7_gm.py").read().split("# G1:")[0])
SC = os.path.dirname(V); TN = f"{SC}/tn2"; IMG = f"{SC}/tarih/img"
D = "/home/user/analiz/video_teslim"
def out(s, name):
    from PIL import Image as I
    I.fromarray(s.makeImageSnapshot().toarray()).convert("RGB").save(f"{D}/{name}", quality=93); print(name)
def im(p): return Image.open(p).convert("RGB")
def topshade(c, a=.8, h=320):
    p = skia.Paint(); p.setShader(skia.GradientShader.MakeLinear([skia.Point(0, 0), skia.Point(0, h)], [C("#05080D", a).toColor(), C("#05080D", 0).toColor()])); c.drawRect(skia.Rect.MakeWH(W, h), p)

# H1: ÖNCE / SONRA — "çok kalitesiz" → gerçekçi
s = surface(W, H); c = s.getCanvas(); c.clear(C("#0B0D16"))
a_ = im(f"{IMG}/ilk_hali.jpg"); b_ = im(f"{IMG}/son_hali.jpg")
full(c, b_, 1.05, zoom=1.25, cx=.62, cy=.45)
c.save(); pth = skia.Path(); pth.moveTo(0, 0); pth.lineTo(560, 0); pth.lineTo(420, H); pth.lineTo(0, H); pth.close(); c.clipPath(pth, doAntiAlias=True)
full(c, a_, 1.0, zoom=1.25, cx=.62, cy=.45); c.restore()
c.drawLine(560, 0, 420, H, paint("#FFFFFF", 1, 8))
topshade(c, .75, 300)
outline_text(c, "TARİH KANALI", 44, 140, 120)
tag(c, 46, 170, "KODSUZ KURDUM", ORANGE, 96, -3)
rrect(c, 40, 600, 300, 70, 35, "#FFFFFF"); f = skia.Font(INTER8, 34); c.drawString("ilk deneme", 70, 647, f, paint(INK))
rrect(c, 900, 600, 300, 70, 35, ORANGE); c.drawString("son hali", 950, 647, f, paint("#FFFFFF"))
claude_tile(c, 1170, 40, 86)
out(s, "TK_T1_tarih_kanali_kodsuz.jpg")

# H2: "BUNU YAPAY ZEKÂ ÇİZDİ" — Malazgirt hilal
s = surface(W, H); c = s.getCanvas()
full(c, im(f"{TN}/hilal.jpg"), 1.05, zoom=1.35, cx=.45, cy=.55); topshade(c, .8, 330)
outline_text(c, "BUNU YAPAY ZEKÂ", 44, 135, 112)
tag(c, 46, 168, "ÇİZDİ!", ORANGE, 120, -3)
badge(c, 1150, 590, 86, "1071", size=54, rot=8)
out(s, "TK_T2_bunu_yapay_zeka_cizdi.jpg")

# H3: Fetih — GEMİLER KARADAN
s = surface(W, H); c = s.getCanvas()
full(c, im(f"{TN}/gemiler.jpg"), 1.05, zoom=1.3, cx=.55, cy=.5); topshade(c, .8, 330)
outline_text(c, "GEMİLER", 44, 140, 130)
tag(c, 46, 175, "KARADAN YÜRÜDÜ", ORANGE, 92, -3)
badge(c, 1150, 590, 86, "1453", size=54, rot=8)
out(s, "FT_T1_gemiler_karadan.jpg")

# H4: Fetih — 53 GÜN
s = surface(W, H); c = s.getCanvas()
full(c, im(f"{TN}/saldiri.jpg"), 1.05, zoom=1.3, cx=.5, cy=.55); topshade(c, .8, 330)
outline_text(c, "53 GÜNDE", 44, 140, 130)
tag(c, 46, 175, "İSTANBUL'UN FETHİ", ORANGE, 86, -3)
out(s, "FT_T2_53_gunde_fetih.jpg")

# H5: Türkler v2 — 1071 İMPARATOR ESİR (gerçekçi)
s = surface(W, H); c = s.getCanvas()
full(c, im(f"{TN}/hilal.jpg"), 1.05, zoom=1.25, cx=.4, cy=.5); leftshade(c, .85, .55)
outline_text(c, "1071", 44, 250, 230)
tag(c, 48, 300, "İMPARATOR ESİR!", ORANGE, 84, -3)
f = skia.Font(INTER8, 44); c.drawString("Malazgirt'te ne oldu?", 56, 500, f, paint("#FFFFFF"))
out(s, "TA2_T1_1071_imparator_esir.jpg")
