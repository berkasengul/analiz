import os
V = os.path.dirname(os.path.abspath(__file__))
exec(open(f"{V}/thumb10_tarih.py").read().split("# H1:")[0])
# K1: KANALI YAPAY ZEKÂYA DEVRETTİK
s = surface(W, H); c = s.getCanvas()
full(c, im(f"{TN}/hilal.jpg"), 1.0, zoom=1.3, cx=.5, cy=.55); topshade(c, .85, 360)
outline_text(c, "KANALI YAPAY ZEKÂYA", 40, 125, 98)
tag(c, 42, 158, "DEVRETTİK", ORANGE, 120, -3)
claude_tile(c, 1150, 560, 100); put_crow(c, "", 1010, 560, 120, rot=-6)
out(s, "KD_T1_kanali_yapay_zekaya_devrettik.jpg")
# K2: YÜZ YOK KOD YOK
s = surface(W, H); c = s.getCanvas()
full(c, im(f"{TN}/gemiler.jpg"), 1.0, zoom=1.3, cx=.55, cy=.5); topshade(c, .85, 360)
outline_text(c, "YÜZ YOK, KOD YOK", 40, 135, 118)
tag(c, 42, 168, "TARİH KANALI", ORANGE, 110, -3)
badge(c, 1150, 590, 86, "AI", size=64, rot=8)
out(s, "KD_T2_yuz_yok_kod_yok.jpg")
