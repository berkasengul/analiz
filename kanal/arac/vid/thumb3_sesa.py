# İçerik odaklı thumbnail seti: videonun cevap verdiği soruları gösterir
import os, sys, math
V = os.path.dirname(os.path.abspath(__file__))
exec(open(f"{V}/thumb2_sesa.py").read().split("BIGQ = ")[0])
OUT = "/home/user/analiz/video_teslim"
S = "/home/user/analiz/store/assets"
TP = f"{V}/tp"
INTER8 = skia.Typeface.MakeFromFile(f"{V}/assets/fonts/InterTight800.ttf") if os.path.exists(f"{V}/assets/fonts/InterTight800.ttf") else INTER

def rgba(p): return Image.open(p).convert("RGBA")
def shadow_paint(a=.30, blur=16, dy=14):
    p = skia.Paint(); p.setImageFilter(skia.ImageFilters.DropShadow(0, dy, blur, blur, C("#000000", a).toColor())); return p

def put(c, im, x, y, h=None, w=None, rot=0, alpha=1.0, shadow=True):
    if h: im = im.resize((int(im.width * h / im.height), int(h)), Image.LANCZOS)
    elif w: im = im.resize((int(w), int(im.height * w / im.width)), Image.LANCZOS)
    img = to_skia(im); p = shadow_paint(.22, 12, 10) if shadow else skia.Paint()
    p.setAlphaf(alpha)
    c.save(); c.rotate(rot, x + im.width / 2, y + im.height / 2); c.drawImage(img, x, y, SAMP, p); c.restore()
    return im.width, im.height

def card(c, im, x, y, w, h, label=None, rot=0, lab_col=ORANGE, radius=18, crop=None):
    if crop: im = im.crop(crop)
    k = max(w / im.width, h / im.height); im2 = im.resize((int(im.width * k + 1), int(im.height * k + 1)), Image.LANCZOS)
    ox, oy = (im2.width - w) // 2, (im2.height - h) // 2; im2 = im2.crop((ox, oy, ox + w, oy + h))
    c.save(); c.rotate(rot, x + w / 2, y + h / 2)
    sp = paint("#000000", .28); sp.setMaskFilter(skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, 14))
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect.MakeXYWH(x + 4, y + 14, w, h), radius, radius), sp)
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect.MakeXYWH(x - 7, y - 7, w + 14, h + 14), radius + 6, radius + 6), paint("#FFFFFF"))
    c.save(); c.clipRRect(skia.RRect.MakeRectXY(skia.Rect.MakeXYWH(x, y, w, h), radius, radius), True)
    c.drawImage(to_skia(im2.convert("RGBA")), x, y, SAMP); c.restore()
    c.restore()
    if label: tag(c, x + 10, y + h - 22, label, lab_col, 34, rot)

def text(c, s, x, y, size, col=INK, face=None):
    f = skia.Font(face or INTER8, size); c.drawString(s, x, y, f, paint(col)); return f.measureText(s)

def ring(c, cx, cy, rx, ry, a0, a1, col=ORANGE, w=14):
    # perspektifte dönüş halkası + ok ucu
    path = skia.Path(); n = 40
    pts = [(cx + rx * math.cos(math.radians(a0 + (a1 - a0) * i / n)), cy + ry * math.sin(math.radians(a0 + (a1 - a0) * i / n))) for i in range(n + 1)]
    path.moveTo(*pts[0]); [path.lineTo(*q) for q in pts[1:]]
    o = paint("#FFFFFF", 1, w + 10); o.setStrokeCap(skia.Paint.kRound_Cap); c.drawPath(path, o)
    p = paint(col, 1, w); p.setStrokeCap(skia.Paint.kRound_Cap); c.drawPath(path, p)
    (x1, y1), (x2, y2) = pts[-2], pts[-1]; ang = math.atan2(y2 - y1, x2 - x1); L = w * 2.6
    head = skia.Path(); head.moveTo(x2 + math.cos(ang) * L * .6, y2 + math.sin(ang) * L * .6)
    for d in (2.4, -2.4): head.lineTo(x2 + math.cos(ang + d) * L, y2 + math.sin(ang + d) * L)
    head.close(); c.drawPath(head, paint("#FFFFFF", 1, 10)); c.drawPath(head, paint(col))

# ---------- H: TEK FOTOĞRAF → 3D DÖNEN SİTE ----------
s = surface(W, H); c = s.getCanvas(); background(c)
headline(c, "TEK FOTOĞRAF", "3D DÖNÜYOR", 44, 40, s1=118, s2=104, maxw=600, tilt=-2)
# polaroid fotoğraf
ph = rgba(f"{S}/photo/mavi-kareli/on.webp")
c.save(); c.rotate(-7, 190, 500)
sp = paint("#000000", .28); sp.setMaskFilter(skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, 14))
c.drawRect(skia.Rect.MakeXYWH(70, 340, 250, 340), sp); c.drawRect(skia.Rect.MakeXYWH(64, 330, 250, 340), paint("#FFFFFF"))
c.drawRect(skia.Rect.MakeXYWH(80, 346, 218, 270), paint("#EEF0F4"))
im = ph.copy(); im.thumbnail((210, 262)); c.drawImage(to_skia(im), 80 + (218 - im.width) / 2, 350, SAMP)
text(c, "1 fotoğraf", 118, 650, 30, INK)
c.restore()
arrow(c, [(340, 470), (420, 400), (520, 450)], w=20)
# dönen model: yan kareler soluk, ortada ön
cx = 900
c.drawOval(skia.Rect.MakeXYWH(cx - 300, 610, 600, 90), paint("#000000", .10))
ring(c, cx, 650, 330, 58, 200, 520)
for fr, dx, al, hh in ((45, -265, .55, 420), (60, 265, .55, 420), (20, -140, .8, 470)):
    put(c, rgba(f"{S}/spin/mavi-kareli/{fr:03d}.webp"), 0, 0, h=1, shadow=False) if False else None
    im = rgba(f"{S}/spin/mavi-kareli/{fr:03d}.webp"); im = im.resize((int(im.width * hh / im.height), hh), Image.LANCZOS)
    put(c, im, cx + dx - im.width // 2, 650 - hh, alpha=al)
im = rgba(f"{S}/spin/mavi-kareli/000.webp"); hh = 540; im = im.resize((int(im.width * hh / im.height), hh), Image.LANCZOS)
put(c, im, cx - im.width // 2 + 60, 655 - hh)
badge(c, 1185, 120, 70, "360°", size=58, rot=10)
save(s, "H_tek_fotograf_3d.jpg")

# ---------- I: SİTEYİ YAP → İŞLETMEYE NASIL SATILIR ----------
s = surface(W, H); c = s.getCanvas(); background(c)
lap_at(c, FINAL, [(640, 170), (1262, 140), (1272, 560), (628, 590)])
headline(c, "SİTEYİ YAPTIN", "NASIL SATACAKSIN?", 44, 40, s1=108, s2=84, maxw=600, tilt=-2)
# e-posta kartı
x, y, w, h = 60, 330, 560, 330
c.save(); c.rotate(-3, x + w / 2, y + h / 2)
sp = paint("#000000", .26); sp.setMaskFilter(skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, 16))
c.drawRRect(skia.RRect.MakeRectXY(skia.Rect.MakeXYWH(x + 4, y + 16, w, h), 22, 22), sp)
c.drawRRect(skia.RRect.MakeRectXY(skia.Rect.MakeXYWH(x, y, w, h), 22, 22), paint("#FFFFFF"))
c.drawRRect(skia.RRect.MakeRectXY(skia.Rect.MakeXYWH(x, y, w, 64), 22, 22), paint(NAVY)); c.drawRect(skia.Rect.MakeXYWH(x, y + 40, w, 24), paint(NAVY))
for i, col in enumerate(("#FF5F57", "#FEBC2E", "#28C840")): c.drawCircle(x + 30 + i * 26, y + 32, 8, paint(col))
text(c, "Yeni e-posta", x + 120, y + 42, 26, "#FFFFFF")
text(c, "Konu:", x + 28, y + 112, 28, "#8A8FA3"); text(c, "Mağazanıza 3D site demosu", x + 110, y + 112, 28, INK)
c.drawRect(skia.Rect.MakeXYWH(x + 28, y + 132, w - 56, 2), paint("#E4E6EC"))
for i, ww in enumerate((470, 420, 300)): c.drawRRect(skia.RRect.MakeRectXY(skia.Rect.MakeXYWH(x + 28, y + 160 + i * 30, ww, 14), 7, 7), paint("#E4E6EC"))
c.drawRRect(skia.RRect.MakeRectXY(skia.Rect.MakeXYWH(x + 28, y + 255, 380, 52), 26, 26), paint(ORANGE))
text(c, "firmaniz.netlify.app", x + 52, y + 291, 28, "#FFFFFF")
c.restore()
arrow(c, [(560, 640), (640, 690), (760, 620)], w=20)
badge(c, 1190, 560, 72, "DEMO", size=50, rot=-8)
save(s, "I_siteyi_yaptin_nasil_satacaksin.jpg")

# ---------- J: 1 GÜNDE NELER YAPILDI (özellik kolajı) ----------
s = surface(W, H); c = s.getCanvas(); background(c)
lap_at(c, FINAL, [(420, 310), (905, 292), (912, 600), (412, 616)])
headline(c, "KOD YOK", "AMA HEPSİ VAR", 44, 36, s1=110, s2=88, maxw=520, tilt=-2)
card(c, rgba(f"{TP}/bag_2.png"), 935, 30, 300, 185, "SEPET ANİMASYONU", rot=4, crop=(0, 0, 820, 720))
card(c, rgba(f"{TP}/cel_3.png"), 955, 262, 285, 175, "SİPARİŞ EKRANI", rot=-3, lab_col=NAVY, crop=(500, 120, 1500, 720))
card(c, rgba(f"{TP}/chat_2.png"), 935, 485, 300, 160, "YAPAY ZEKÂ ASİSTAN", rot=3, crop=(1000, 40, 1600, 720))
card(c, rgba(f"{V}/assets/img/qrcard.png"), 56, 400, 230, 230, "MASAL + QR", rot=-5, lab_col=NAVY)
im = rgba(f"{S}/spin/mavi-kareli/020.webp"); im = im.resize((int(im.width * 330 / im.height), 330), Image.LANCZOS)
put(c, im, 330, 380)
tag(c, 400, 640, "3D MODEL", ORANGE, 36, 3)
save(s, "J_kod_yok_ama_hepsi_var.jpg")
print("ok")
