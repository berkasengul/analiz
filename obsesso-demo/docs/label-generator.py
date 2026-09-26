from PIL import Image, ImageDraw, ImageFont, ImageOps
import statistics

src = Image.open("energy-can-body.png").convert("RGB")
W, H = src.size
out = src.copy()
px = src.load()
# zemin rengi: etiketsiz bir bölgeden ortalama
samples = [px[x, y] for x in range(260, 320) for y in range(450, 600)]
bg = tuple(int(statistics.median(c[i] for c in samples)) for i in range(3))
d = ImageDraw.Draw(out)
# ön yüz ve arka etiket bölgelerini temizle
d.rectangle([300, 55, 620, 420], fill=bg)
d.rectangle([18, 12, 240, 262], fill=bg)

F = "fonts"
def font(name, size):
    return ImageFont.truetype(f"{F}/{name}", size)

def fit(draw, text, name, width, start=120):
    size = start
    while size > 6:
        f = font(name, size)
        l, t, r, b = draw.textbbox((0, 0), text, font=f)
        if r - l <= width:
            return f
        size -= 1
    return font(name, 6)

def centered(draw, y, text, f, W, fill=(255, 255, 255)):
    l, t, r, b = draw.textbbox((0, 0), text, font=f)
    draw.text(((W - (r - l)) / 2 - l, y - t), text, font=f, fill=fill)
    return y + (b - t)

# ---------- ön yüz (kutunun üstü = görselin üstü), sonra dikey çevrilir ----------
FW, FH = 270, 350
front = Image.new("RGB", (FW, FH), bg)
fd = ImageDraw.Draw(front)
# kahve çekirdeği işareti
cx, cy = FW // 2, 26
fd.ellipse([cx - 11, cy - 15, cx + 11, cy + 15], outline=(255, 255, 255), width=3)
fd.arc([cx - 6, cy - 15, cx + 8, cy + 15], 100, 260, fill=(255, 255, 255), width=3)
y = 58
y = centered(fd, y, "OBSESSO", fit(fd, "OBSESSO", "Boldonse-Regular.ttf", 220, 40), FW) + 26
y = centered(fd, y, "COLD", fit(fd, "COLD", "Boldonse-Regular.ttf", 250, 80), FW) + 14
y = centered(fd, y, "BREW", fit(fd, "BREW", "Outfit-Regular.ttf", 200, 90), FW) + 26
y = centered(fd, y, "— SOĞUK DEMLENMİŞ KAHVE —", font("IBMPlexMono-Bold.ttf", 11), FW) + 18
y = centered(fd, y, "COLD COFFEE", font("IBMPlexMono-Regular.ttf", 13), FW)
fd.line([FW / 2 - 22, y + 8, FW / 2 + 22, y + 8], fill=(255, 255, 255), width=2)
out.paste(ImageOps.flip(front), (325, 62))

# ---------- arka etiket: örnek besin değerleri ----------
BW, BH = 128, 238
back = Image.new("RGB", (BW, BH), bg)
bd = ImageDraw.Draw(back)
bd.rectangle([1, 1, BW - 2, BH - 2], outline=(255, 255, 255), width=2)
x0 = 7
bd.text((x0, 6), "Besin Değerleri", font=font("Outfit-Bold.ttf", 14), fill="white")
bd.text((x0, 24), "100 ml için · örnek değerler", font=font("IBMPlexMono-Regular.ttf", 7), fill="white")
bd.line([x0, 36, BW - 8, 36], fill="white", width=3)
rows = [("Enerji", "38 kcal"), ("Yağ", "1,2 g"), ("  Doymuş yağ", "0,8 g"), ("Karbonhidrat", "5,1 g"),
        ("  Şeker", "4,6 g"), ("Protein", "1,9 g"), ("Tuz", "0,08 g"), ("Kafein", "45 mg")]
yy = 42
for k, v in rows:
    f = font("Outfit-Regular.ttf", 10)
    bd.text((x0, yy), k, font=f, fill="white")
    l, t, r, b = bd.textbbox((0, 0), v, font=f)
    bd.text((BW - 8 - (r - l), yy), v, font=f, fill="white")
    yy += 14
bd.line([x0, yy + 2, BW - 8, yy + 2], fill="white", width=2)
yy += 8
for line in ["İçindekiler: soğuk", "demlenmiş kahve (su,", "kahve), süt, doğal", "aroma.", "", "*Konsept etiket; değerler", "örnektir."]:
    bd.text((x0, yy), line, font=font("Outfit-Regular.ttf", 9), fill="white")
    yy += 12
out.paste(ImageOps.flip(back), (26, 20))

# barkod ve geri dönüşüm işaretini orijinalden geri koy
out.paste(src.crop((158, 24, 225, 108)), (158, 24))
out.paste(src.crop((205, 112, 232, 140)), (205, 112))

out.save("obsesso-body.png", optimize=True)
out.resize((1024, 1024)).crop((0, 0, 660, 460)).save("preview.png")
ImageOps.flip(out.crop((0, 0, 660, 460))).save("preview-upright.png")
print("ok", bg)
