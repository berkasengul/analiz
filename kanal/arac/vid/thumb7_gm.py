import os
V = os.path.dirname(os.path.abspath(__file__))
exec(open(f"{V}/thumb5_sesa.py").read().split("s = surface(W, H); c = s.getCanvas(); c.clear")[0])
from PIL import ImageEnhance
def fr(t): return Image.open(f"/tmp/tn/f_{t}.png").convert("RGB")
def full(c, im, bright=1.0, x0=0, y0=0, w=W, h=H, zoom=1.0, cx=.5, cy=.5):
    iw, ih = im.size; k = max(w / iw, h / ih) * zoom
    im2 = im.resize((int(iw * k) + 1, int(ih * k) + 1), Image.LANCZOS)
    ox = int((im2.width - w) * cx); oy = int((im2.height - h) * cy)
    im2 = ImageEnhance.Brightness(im2.crop((ox, oy, ox + w, oy + h))).enhance(bright)
    c.drawImage(to_skia(im2.convert("RGBA")), x0, y0, SAMP)
def leftshade(c, a=.85, end=.62):
    p = skia.Paint(); p.setShader(skia.GradientShader.MakeLinear([skia.Point(0, 0), skia.Point(W * end, 0)], [C("#05060C", a).toColor(), C("#05060C", 0).toColor()])); c.drawRect(skia.Rect.MakeWH(W, H), p)
def rrect(c, x, y, w, h, r, col): c.drawRRect(skia.RRect.MakeRectXY(skia.Rect.MakeXYWH(x, y, w, h), r, r), paint(col))
def bubble(x, y, w, h, who, msg, col, tcol):
    sp = paint("#000000", .5); sp.setMaskFilter(skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, 20))
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect.MakeXYWH(x + 6, y + 16, w, h), 30, 30), sp)
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect.MakeXYWH(x, y, w, h), 30, 30), paint(col))
    text(c, who, x + 128, y + 52, 28, ORANGE); text(c, msg, x + 128, y + 110, 50, tcol)
def outline_text(c, s, x, base, size, col="#FFFFFF"):
    f = skia.Font(ANTON, size); c.drawString(s, x, base, f, paint("#000000", .55, 16)); c.drawString(s, x, base, f, paint(col))

# G1: BU GALERİ GERÇEK DEĞİL
s = surface(W, H); c = s.getCanvas(); c.clear(C("#07080E"))
full(c, fr("4.0"), 1.02, x0=0, y0=205, w=W, h=H - 205, zoom=1.0, cx=.5, cy=.0)
p = skia.Paint(); p.setShader(skia.GradientShader.MakeLinear([skia.Point(0, 200), skia.Point(0, 300)], [C("#07080E", 1).toColor(), C("#07080E", 0).toColor()])); c.drawRect(skia.Rect.MakeXYWH(0, 200, W, 100), p)
outline_text(c, "BU GALERİ", 40, 175, 150)
tag(c, 640, 38, "GERÇEK DEĞİL!", ORANGE, 98, -3)
rrect(c, 40, 610, 450, 80, 40, "#FFFFFF"); f = skia.Font(INTER8, 40); c.drawString("Bu bir web sitesi", 76, 664, f, paint(INK))
cursor(c, 700, 520, 3.0)
save(s, "G1_bu_galeri_gercek_degil.jpg")

# G2: bana oto galeri yap -> yaptım bile
s = surface(W, H); c = s.getCanvas(); c.clear(C("#0B0D16"))
glow(c, 930, 360, 620, "#6A55C8", .5); glow(c, 1000, 640, 380, "#FF7A2F", .22)
lap = laptop_image(fr("9.0"), "gardenmtrs.netlify.app"); draw_perspective(c, lap, [(560, 120), (1262, 92), (1274, 590), (548, 628)])
bubble(40, 120, 640, 148, "SEN", "bana 3D galeri yap", "#FFFFFF", INK); put_crow(c, "", 58, 140, 96)
bubble(40, 320, 560, 148, "YAPAY ZEKÂ", "yaptım bile...", "#FFFFFF", INK); claude_tile(c, 64, 344, 96)
arrow(c, [(560, 470), (640, 560), (760, 520)], w=20)
tag(c, 40, 560, "SEN DE YAP, SAT", ORANGE, 72, -3)
save(s, "G2_bana_3d_galeri_yap.jpg")

# G3: OYUN DEĞİL — E180 tam ekran + parça durumu
s = surface(W, H); c = s.getCanvas()
full(c, fr("19.0"), .95, zoom=1.05, cx=.55, cy=.5); leftshade(c, .88, .66)
outline_text(c, "OYUN", 44, 220, 190)
tag(c, 46, 260, "DEĞİL!", ORANGE, 150, -3)
f = skia.Font(INTER8, 44); c.drawString("İçinde gezilen", 54, 560, f, paint("#FFFFFF")); c.drawString("oto galeri sitesi", 54, 614, f, paint("#FFB27A"))
badge(c, 1160, 120, 80, "3D", size=90, rot=10)
save(s, "G3_oyun_degil.jpg")

# G4: GALERİLERE SAT — laptop parça durumu + e-posta
s = surface(W, H); c = s.getCanvas(); c.clear(C("#0B0D16")); glow(c, 900, 360, 620, "#2E5E3A", .45)
lap = laptop_image(fr("13.0"), "gardenmtrs.netlify.app"); draw_perspective(c, lap, [(600, 150), (1262, 122), (1272, 560), (588, 590)])
outline_text(c, "GALERİLERE", 44, 150, 120)
tag(c, 46, 180, "3D SİTE SAT", ORANGE, 100, -3)
x, y, w, h = 52, 380, 520, 250
c.save(); c.rotate(-3, x + w / 2, y + h / 2)
sp = paint("#000000", .4); sp.setMaskFilter(skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, 16)); c.drawRRect(skia.RRect.MakeRectXY(skia.Rect.MakeXYWH(x + 4, y + 16, w, h), 22, 22), sp)
c.drawRRect(skia.RRect.MakeRectXY(skia.Rect.MakeXYWH(x, y, w, h), 22, 22), paint("#FFFFFF"))
c.drawRRect(skia.RRect.MakeRectXY(skia.Rect.MakeXYWH(x, y, w, 60), 22, 22), paint(NAVY)); c.drawRect(skia.Rect.MakeXYWH(x, y + 38, w, 22), paint(NAVY))
f = skia.Font(INTER8, 26); c.drawString("Yeni e-posta", x + 28, y + 40, f, paint("#FFFFFF"))
f = skia.Font(INTER8, 28); c.drawString("Galeriniz için 3D showroom", x + 28, y + 110, f, paint(INK))
c.drawRRect(skia.RRect.MakeRectXY(skia.Rect.MakeXYWH(x + 28, y + 150, 360, 56), 28, 28), paint(ORANGE)); f = skia.Font(INTER8, 26); c.drawString("galeriniz.netlify.app", x + 50, y + 187, f, paint("#FFFFFF"))
c.restore()
badge(c, 1190, 560, 72, "DEMO", size=50, rot=-8)
save(s, "G4_galerilere_sat.jpg")
print("ok")
