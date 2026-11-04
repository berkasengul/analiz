import os
V = os.path.dirname(os.path.abspath(__file__))
exec(open(f"{V}/thumb4_sesa.py").read().split("# ---------- K:")[0])
SR = os.path.join(os.path.dirname(V), "sr", "img")
def pic(name): return Image.open(f"{SR}/{name}").convert("RGB")
def framed(c, im, x, y, w, h, rot=0, border="#FFFFFF"):
    k = max(w / im.width, h / im.height); im2 = im.resize((int(im.width * k) + 1, int(im.height * k) + 1), Image.LANCZOS)
    ox, oy = (im2.width - w) // 2, (im2.height - h) // 2; im2 = im2.crop((ox, oy, ox + w, oy + h))
    c.save(); c.rotate(rot, x + w / 2, y + h / 2)
    sp = paint("#000000", .5); sp.setMaskFilter(skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, 18))
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect.MakeXYWH(x + 6, y + 16, w, h), 18, 18), sp)
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect.MakeXYWH(x - 8, y - 8, w + 16, h + 16), 22, 22), paint(border))
    c.save(); c.clipRRect(skia.RRect.MakeRectXY(skia.Rect.MakeXYWH(x, y, w, h), 16, 16), True)
    c.drawImage(to_skia(im2.convert("RGBA")), x, y, SAMP); c.restore(); c.restore()

# S1: HANGİSİ GERÇEK?
s = surface(W, H); c = s.getCanvas(); c.clear(C("#0B0D16")); glow(c, 640, 420, 650, "#6A55C8", .45)
framed(c, pic("g_referans_referans.jpg"), 40, 250, 580, 330, -3)
framed(c, pic("g_referans_simdi_acilis.png"), 660, 250, 580, 330, 3)
badge(c, 80, 270, 48, "A", size=60, rot=0); badge(c, 1200, 270, 48, "B", col=NAVY, size=60, rot=0)
big(c, "HANGİSİ GERÇEK?", W / 2, 190, 150, "#FFFFFF")
tag(c, 330, 610, "BİRİ WEB SİTESİ", ORANGE, 66, -2)
save(s, "S1_hangisi_gercek.jpg")

# S2: BEYAZ KUTU → SHOWROOM
s = surface(W, H); c = s.getCanvas(); c.clear(C("#0B0D16")); glow(c, 900, 380, 600, "#FF7A2F", .25)
framed(c, pic("m_faz1_d2_cephe.jpg"), 40, 300, 460, 260, -4, "#9AA0B5")
framed(c, pic("g_vitrin_vt_hero.png"), 560, 170, 680, 383, 2)
arrow(c, [(300, 600), (420, 660), (560, 560)], w=20)
tag(c, 60, 230, "1. GÜN", NAVY, 50, -4); tag(c, 990, 580, "SON HALİ", ORANGE, 56, 3)
big(c, "YAPAY ZEKÂ", 330, 130, 120, "#FFFFFF")
f = skia.Font(ANTON, 60); c.drawString("ile 3D showroom", 70, 200, f, paint("#FFB27A"))
save(s, "S2_beyaz_kutudan_showroom.jpg")
print("ok")
