import os
V = os.path.dirname(os.path.abspath(__file__))
exec(open(f"{V}/thumb7_gm.py").read().split("# G1:")[0])
IM = os.path.join(os.path.dirname(V), "tcl", "img")
D = "/home/user/analiz/video_teslim"
def ld(n): return Image.open(f"{IM}/{n}").convert("RGBA")
def out(s, name):
    from PIL import Image as I
    im = I.fromarray(s.makeImageSnapshot().toarray()).convert("RGB"); im.save(f"{D}/{name}", quality=93); print(name)
def cutout(c, n, x, y, h, rot=0, glow_col=None):
    im = ld(n); bb = im.getbbox(); im = im.crop(bb); w = int(im.width * h / im.height); im = im.resize((w, h), Image.LANCZOS)
    if glow_col: glow(c, x + w / 2, y + h * .55, h * .55, glow_col, .45)
    sp = skia.Paint(); sp.setImageFilter(skia.ImageFilters.DropShadow(0, 24, 30, 30, C("#000000", .55).toColor()))
    c.save(); c.rotate(rot, x + w / 2, y + h / 2); c.drawImage(to_skia(im), x, y, SAMP, sp); c.restore()

# T1: CLAUDE İLE / 3D SİTE YAPTIM — laptop + fırlayan kutu
s = surface(W, H); c = s.getCanvas(); c.clear(C("#0B0D16"))
glow(c, 900, 380, 640, "#6A55C8", .5); glow(c, 1040, 560, 360, "#FF7A2F", .25)
lap = laptop_image(Image.open(f"{IM}/1-anasayfa.jpg").convert("RGB"), "turkishcoffeelady.netlify.app")
draw_perspective(c, lap, [(520, 170), (1150, 146), (1160, 590), (508, 622)])
cutout(c, "cut_bold-istanbul.webp", 1010, 60, 620, rot=8, glow_col="#9FB8FF")
outline_text(c, "CLAUDE İLE", 40, 165, 130)
tag(c, 42, 195, "3D SİTE", ORANGE, 120, -3)
f = skia.Font(INTER8, 46); c.drawString("Kod yazmadan,", 50, 520, f, paint("#FFFFFF")); c.drawString("sadece konuşarak", 50, 576, f, paint("#FFB27A"))
claude_tile(c, 52, 610, 84)
save_name = "TCL_T1_claude_ile_3d_site.jpg"; out(s, save_name)

# T2: BU SİTEYE / $8.900 TEKLİF — tam ekran sahne + teklif kartı
s = surface(W, H); c = s.getCanvas()
full(c, Image.open(f"{IM}/2-urun-detay.jpg").convert("RGB"), .9, zoom=1.08, cx=.62, cy=.4); leftshade(c, .92, .7)
outline_text(c, "BU SİTEYE", 44, 170, 140)
tag(c, 46, 205, "$8.900 TEKLİF", ORANGE, 112, -3)
pg = Image.open(f"{IM}/teklif_p3.jpg").convert("RGB"); pw, ph = pg.size
crop = pg.crop((int(pw * .07), int(ph * .165), int(pw * .93), int(ph * .58))).resize((560, int(560 * (ph * .415) / (pw * .86))), Image.LANCZOS)
x, y = 60, 400
c.save(); c.rotate(-4, x + 280, y + 140)
sp = paint("#000000", .5); sp.setMaskFilter(skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, 18)); c.drawRect(skia.Rect.MakeXYWH(x + 6, y + 18, crop.width, 300), sp)
c.save(); c.clipRect(skia.Rect.MakeXYWH(x, y, crop.width, 300)); c.drawImage(to_skia(crop.convert("RGBA")), x, y, SAMP); c.restore()
c.restore()
badge(c, 1170, 600, 78, "3D", size=86, rot=10)
out(s, "TCL_T2_bu_siteye_8900_teklif.jpg")

# T3: 8 ADIMDA / 3D SİTE YAP, SAT — kaidede kutu + 8 adım çipleri
s = surface(W, H); c = s.getCanvas()
full(c, Image.open(f"{IM}/sahne_pistachio-zeugma.webp").convert("RGB").filter(ImageFilter.GaussianBlur(10)), .55, zoom=1.15, cx=.5, cy=.5); leftshade(c, .85, .6)
cutout(c, "cut_pistachio-zeugma.webp", 880, 40, 650, rot=7, glow_col="#C9E29A")
outline_text(c, "8 ADIMDA", 44, 200, 170)
tag(c, 46, 235, "3D SİTE YAP, SAT", ORANGE, 92, -3)
steps = ["Araştır", "Etiket", "3D kutu", "Sahne", "Site", "Teklif"]
for k, st_ in enumerate(steps):
    xx = 52 + (k % 3) * 205; yy = 450 + (k // 3) * 92
    rrect(c, xx, yy, 190, 70, 35, "#FFFFFF"); c.drawCircle(xx + 36, yy + 35, 22, paint(ORANGE))
    f = skia.Font(INTER8, 24); c.drawString(str(k + 1), xx + 29, yy + 44, f, paint("#FFFFFF"))
    f = skia.Font(INTER8, 28); c.drawString(st_, xx + 68, yy + 45, f, paint(INK))
put_crow(c, "", 700, 560, 130, rot=-6)
out(s, "TCL_T3_8_adimda_3d_site.jpg")
