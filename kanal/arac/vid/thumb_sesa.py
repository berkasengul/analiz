# SESA KIDS videosu için "Net" thumbnail (THUMBNAIL-REHBERI.md): beyaz zemin, 2–3 kelime, sağda laptop, çıkartma karga
import os, sys
V = os.path.dirname(os.path.abspath(__file__))
src = open(f"{V}/karga/karga-edit/thumbnail_net.py").read()
src = src[:src.index("# ---------------- varyantlar ----------------")]
sys.argv = ["x", f"{V}/assets", f"{V}/out/thumbs"]
exec(src)
def crow(name, h, flip=False, outline=10):     # poz görselleri yok: yuvarlak karga avatarı çıkartma olarak
    im = Image.open(f"{V}/karga/karga-edit/kanal/profil_A_turuncu_800.png").convert("RGBA")
    h = int(h); im = im.resize((h, h), Image.LANCZOS)
    m = Image.new("L", (h, h), 0); from PIL import ImageDraw; ImageDraw.Draw(m).ellipse((0, 0, h - 1, h - 1), fill=255); im.putalpha(m)
    pad = outline * 3; canvas = Image.new("RGBA", (h + 2 * pad, h + 2 * pad), (0, 0, 0, 0))
    a = Image.new("L", canvas.size, 0); a.paste(im.split()[3], (pad, pad)); ring = a.filter(ImageFilter.MaxFilter(outline * 2 + 1))
    white = Image.new("RGBA", canvas.size, (255, 255, 255, 255)); white.putalpha(ring)
    canvas = Image.alpha_composite(canvas, white); canvas.alpha_composite(im, (pad, pad)); return to_skia(canvas), pad
SHOT = Image.open(f"{V}/assets/tl/0dcfddd_a.png").convert("RGB")
SHOT2 = Image.open(f"{V}/assets/tl/2f80f95_a.png").convert("RGB")
def base(l1, l2, shot, cur=False, arr=False):
    s = surface(W, H); c = s.getCanvas(); background(c)
    lap = laptop_image(shot, "sesakids.com.tr")
    quad = [(600, 150), (1255, 118), (1268, 560), (585, 590)]
    draw_perspective(c, lap, quad)
    headline(c, l1, l2, 48, 70, s1=190, s2=150, maxw=560)
    put_crow(c, "", 70, 470, 190, rot=-6)
    if cur: cursor(c, 940, 380, 2.8)
    if arr: arrow(c, [(430, 600), (520, 520), (640, 470)])
    return s
save(base("KOD YOK", "1 GÜNDE SİTE", SHOT), "A_kod_yok_1_gunde.jpg")
save(base("SEN DE YAP", "İŞLETMEYE SAT", SHOT2, arr=True), "B_sen_de_yap_sat.jpg")
save(base("PİJAMALAR", "3D DÖNÜYOR", SHOT, cur=True), "C_pijamalar_3d.jpg")
print("ok")
