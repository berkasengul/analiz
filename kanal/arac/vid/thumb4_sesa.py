# Popüler 3D-site videolarının kalıplarıyla thumbnail seti (koyu, sinematik, dev ürün)
import os, sys, math
V = os.path.dirname(os.path.abspath(__file__))
exec(open(f"{V}/thumb3_sesa.py").read().split("# ---------- H:")[0])
from PIL import ImageFilter, ImageEnhance
SITE = Image.open(f"{V}/assets/tl/0dcfddd_a.png").convert("RGB")
def spin(fr, h):
    im = rgba(f"{S}/spin/mavi-kareli/{fr:03d}.webp"); return im.resize((int(im.width * h / im.height), int(h)), Image.LANCZOS)

def dark_bg(c, blur=14, bright=.45, img=SITE):
    im = img.resize((W, int(img.height * W / img.width))).crop((0, 0, W, H)).filter(ImageFilter.GaussianBlur(blur))
    im = ImageEnhance.Brightness(im).enhance(bright)
    c.drawImage(to_skia(im.convert("RGBA")), 0, 0, SAMP)
    p = skia.Paint(); p.setShader(skia.GradientShader.MakeRadial(skia.Point(W / 2, H * .55), W * .7,
        [C("#000000", 0).toColor(), C("#000000", .55).toColor()], [0.35, 1])); c.drawRect(skia.Rect.MakeWH(W, H), p)

def glow(c, cx, cy, r, col="#FFE6C2", a=.55):
    p = skia.Paint(); p.setShader(skia.GradientShader.MakeRadial(skia.Point(cx, cy), r, [C(col, a).toColor(), C(col, 0).toColor()], [0, 1]))
    c.drawCircle(cx, cy, r, p)

def big(c, s, cx, base, size, col="#FFFFFF", stroke=None, face=None):
    f = skia.Font(face or ANTON, size); w = f.measureText(s)
    if stroke: c.drawString(s, cx - w / 2, base, f, paint(stroke, 1, 14))
    c.drawString(s, cx - w / 2, base, f, paint(col)); return w

def claude_tile(c, x, y, s):
    # turuncu yuvarlak kare + yıldız (genel "AI" simgesi)
    sp = paint("#FF7A2F", .55); sp.setMaskFilter(skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, 30)); c.drawRRect(skia.RRect.MakeRectXY(skia.Rect.MakeXYWH(x, y, s, s), s * .24, s * .24), sp)
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect.MakeXYWH(x, y, s, s), s * .24, s * .24), paint("#E8763F"))
    cx, cy = x + s / 2, y + s / 2; p = paint("#FFFFFF", 1, s * .085); p.setStrokeCap(skia.Paint.kRound_Cap)
    for k in range(12):
        a = math.radians(k * 30 + 8); r1 = s * (.10 if k % 2 else .08); r2 = s * (.33 if k % 3 else .28)
        c.drawLine(cx + math.cos(a) * r1, cy + math.sin(a) * r1, cx + math.cos(a) * r2, cy + math.sin(a) * r2, p)

# ---------- K: NASIL? (HOW? kalıbı) ----------
s = surface(W, H); c = s.getCanvas(); dark_bg(c)
glow(c, W / 2, 380, 420)
big(c, "NA", 290, 460, 290, "#FFFFFF"); big(c, "SIL?", 1010, 460, 290, "#FFFFFF")
im = spin(0, 640); put(c, im, W // 2 - im.width // 2, 70)
c.drawOval(skia.Rect.MakeXYWH(W / 2 - 170, 690, 340, 40), paint("#000000", .45))
tag(c, 470, 600, "KOD YOK • 1 GÜN", ORANGE, 52, -3)
save(s, "K_nasil.jpg")

# ---------- L: CLAUDE + TRIPO = 3D MAĞAZA (araç denklemi kalıbı) ----------
s = surface(W, H); c = s.getCanvas(); c.clear(C("#0E1018"))
glow(c, 640, 360, 640, "#3B3F6B", .55)
f = skia.Font(INTER8, 64); t = "Yapay zekâyla 3D mağaza"; c.drawString(t, (W - f.measureText(t)) / 2, 110, f, paint("#FFFFFF"))
claude_tile(c, 70, 230, 250)
big(c, "+", 375, 420, 150, "#FFFFFF")
# 3D model kutusu
c.drawRRect(skia.RRect.MakeRectXY(skia.Rect.MakeXYWH(440, 230, 250, 250), 60, 60), paint("#F2F2F4"))
im = spin(20, 230); put(c, im, 565 - im.width // 2, 240, shadow=False)
big(c, "=", 750, 420, 150, "#FFFFFF")
lap = laptop_image(SITE, "sesakids.com.tr"); draw_perspective(c, lap, [(815, 205), (1250, 190), (1258, 500), (808, 515)])
text(c, "Claude", 130, 560, 40, "#FFFFFF"); text(c, "Tripo 3D", 495, 560, 40, "#FFFFFF"); text(c, "Satış sitesi", 935, 560, 40, "#FFFFFF")
tag(c, 455, 620, "KOD YOK", ORANGE, 50, -2)
save(s, "L_claude_tripo_3d_magaza.jpg")

# ---------- M: "bana site kur?" sohbet kalıbı ----------
s = surface(W, H); c = s.getCanvas(); dark_bg(c, blur=12, bright=.55)
p = skia.Paint(); p.setShader(skia.GradientShader.MakeLinear([skia.Point(0, 0), skia.Point(W * .62, 0)], [C("#0E1018", .92).toColor(), C("#0E1018", 0).toColor()])); c.drawRect(skia.Rect.MakeWH(W, H), p)
def bubble(x, y, w, h, who, msg, col, tcol, av=None):
    sp = paint("#000000", .4); sp.setMaskFilter(skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, 18))
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect.MakeXYWH(x + 4, y + 14, w, h), 28, 28), sp)
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect.MakeXYWH(x, y, w, h), 28, 28), paint(col))
    text(c, who, x + 130, y + 52, 30, ORANGE); text(c, msg, x + 130, y + 112, 52, tcol)
bubble(50, 150, 640, 150, "SEN", "bana 3D mağaza yap", "#FFFFFF", INK)
put_crow(c, "", 66, 168, 100)
bubble(50, 340, 640, 150, "YAPAY ZEKÂ", "yaptım bile...", "#FFFFFF", INK)
claude_tile(c, 72, 365, 100)
cursor(c, 520, 450, 3.2)
im = spin(0, 600); put(c, im, 930 - im.width // 2, 110)
tag(c, 60, 560, "1 GÜNDE, KOD YOK", ORANGE, 66, -3)
save(s, "M_bana_3d_magaza_yap.jpg")

# ---------- N: siteden fırlayan model ----------
s = surface(W, H); c = s.getCanvas(); c.clear(C("#0E1018"))
glow(c, 860, 380, 560, "#5B4D9E", .5)
lap = laptop_image(SITE, "sesakids.com.tr"); draw_perspective(c, lap, [(540, 230), (1240, 205), (1250, 640), (530, 665)])
im = spin(0, 640); put(c, im, 905 - im.width // 2, 20)
f = skia.Font(ANTON, 170); c.drawString("KOD YOK", 48, 230, f, paint("#FFFFFF"))
tag(c, 52, 280, "1 GÜNDE 3D MAĞAZA", ORANGE, 64, -3)
save(s, "N_kod_yok_3d_magaza.jpg")
print("ok")
