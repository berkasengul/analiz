"""Turkish Coffee Lady yeni buzlu kahve kutuları: markanın Instagram'da tanıttığı tasarım (üst bant, TURKISH COFFEE Lady,
tat adı, nazar boncuğu, suluboya şehir, alt bilgi ve bant) markanın kendi paketlerindeki suluboya şehir çizimleriyle
yeniden kurulur. Çıktı: labels/<tat>.png (360° sarılan etiket; ön yüz ortada)."""
import json, os
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageChops
import numpy as np
F = "fonts/"
W, H = 2400, 1560
BROWN = (156, 74, 54)
DARK = (52, 40, 36)
CANS = {
 "bold-istanbul":   dict(art="Bold_Istanbul", name="BOLD ISTANBUL", band=(31, 45, 94), title=(31, 45, 94), ring=(31, 45, 94),
                         lines=["DARK & RICH", "100% Natural | Zero Sugar | Low Calories"]),
 "silky-mardin":    dict(art="Silky_Mardin", name="SILKY MARDİN", band=(54, 170, 228), title=(45, 150, 210), ring=(246, 196, 52),
                         lines=["MILKY & CREAMY", "Pistachio | Cacao | Vanilla | Cardamom | Mastic Gum"]),
 "piney-aegean":    dict(art="Sweet_Aegean", name="PINEY AEGEAN", band=(231, 105, 156), title=(218, 82, 128), ring=(250, 115, 164),
                         lines=["MASTIC GUM &", "MEDITERRANEAN HERBS"]),
 "minty-cappadocia":dict(art="Minty_Cappadocia", name="MINTY CAPPADOCIA", band=(234, 180, 49), title=(214, 134, 34), ring=(252, 191, 53),
                         lines=["MINT & CARDAMOM", ""]),
 "pistachio-zeugma":dict(art="Decaf_Zeugma", name="PISTACHIO ZEUGMA", band=(160, 190, 92), title=(78, 130, 64), ring=(170, 200, 100),
                         lines=["MILKY & DECAF", "WILD PISTACHIO"]),
}
AB = json.load(open("artbox.json"))
# Arka yüz: markanın kendi ürün metninden (turkishcoffeelady.com, aynı adlı paketler) kısa bir pasaj ve şehir.
STORY = {
 "bold-istanbul": ("ISTANBUL", "Made from the finest handpicked coffee beans, this exquisite blend takes you on a journey through the vibrant streets of Türkiye's bustling city."),
 "silky-mardin": ("MARDİN", "A truly refined and velvety coffee blend that transports you to the enchanting landscapes of Mardin."),
 "piney-aegean": ("THE AEGEAN", "Piney Aegean brings the mastic gum flavor of the turquoise paradise to you, a perfect complement to traditional Turkish desserts."),
 "minty-cappadocia": ("CAPPADOCIA", "The cooling embrace of cardamom mingles harmoniously with the richness of Turkish coffee: a taste of tradition and innovation."),
 "pistachio-zeugma": ("ZEUGMA", "A journey through Mediterranean heritage: let the centuries-old tradition of pistachio indulgence transport you to a world of elegance."),
}


def wrap(d, txt, fnt, width):
    out, cur = [], ""
    for w in txt.split():
        t = (cur + " " + w).strip()
        if d.textlength(t, font=fnt) > width and cur:
            out.append(cur)
            cur = w
        else:
            cur = t
    return out + ([cur] if cur else [])


def font(f, s):
    return ImageFont.truetype(F + f, s)


def ctext(d, cx, y, txt, fnt, fill, track=0):
    if track:
        # harf aralığı
        ws = [d.textlength(ch, font=fnt) for ch in txt]
        tw = sum(ws) + track * (len(txt) - 1)
        x = cx - tw / 2
        for ch, w in zip(txt, ws):
            d.text((x, y), ch, font=fnt, fill=fill)
            x += w + track
    else:
        w = d.textlength(txt, font=fnt)
        d.text((cx - w / 2, y), txt, font=fnt, fill=fill)


def art_layer(key, width):
    a = Image.open("img/" + AB_KEY(key) + ".png").convert("RGB").crop(AB[AB_KEY(key)])
    h = int(a.height * width / a.width)
    a = a.resize((width, h), Image.LANCZOS)
    arr = np.asarray(a).astype(float)
    # Paketin beyaz zemini ve gölgesi: açık tonlar beyaza çekilir (etiketin beyazına karışsın).
    lum = arr.mean(2, keepdims=True)
    lift = np.clip((lum - 200) / 40, 0, 1)
    arr = arr * (1 - lift) + 255 * lift
    return Image.fromarray(arr.clip(0, 255).astype(np.uint8))


def AB_KEY(k):
    return CANS[k]["art"]


def eye(d, cx, cy, r, ring):
    d.ellipse((cx - r, cy - r, cx + r, cy + r), fill=ring)
    r2 = r * 0.74
    d.ellipse((cx - r2, cy - r2, cx + r2, cy + r2), fill=(255, 255, 255))
    r3 = r * 0.56
    d.ellipse((cx - r3, cy - r3, cx + r3, cy + r3), fill=(88, 170, 230))
    r4 = r * 0.3
    d.ellipse((cx - r4, cy - r4, cx + r4, cy + r4), fill=(22, 30, 60))
    r5 = r * 0.08
    d.ellipse((cx - r * 0.14 - r5, cy - r * 0.14 - r5, cx - r * 0.14 + r5, cy - r * 0.14 + r5), fill=(255, 255, 255))


def multiply(base, layer, xy):
    region = base.crop((xy[0], xy[1], xy[0] + layer.width, xy[1] + layer.height))
    base.paste(ImageChops.multiply(region, layer), xy)


def feather(img, top=0.18, bottom=0.08, side=0.1):
    """Kenarları beyaza yumuşakça açar (multiply ile karışınca iz bırakmaz)."""
    a = np.asarray(img).astype(float)
    h, w = a.shape[:2]
    y = np.linspace(0, 1, h)[:, None]
    x = np.linspace(0, 1, w)[None, :]
    m = np.clip(y / top, 0, 1) * np.clip((1 - y) / bottom, 0, 1) if bottom else np.clip(y / top, 0, 1) * np.ones_like(y)
    m = m * np.clip(x / side, 0, 1) * np.clip((1 - x) / side, 0, 1)
    m = m[..., None]
    return Image.fromarray((a * m + 255 * (1 - m)).astype(np.uint8))


def make(key):
    C = CANS[key]
    L = Image.new("RGB", (W, H), (252, 250, 246))
    d = ImageDraw.Draw(L)
    cx = W // 2
    # Ön yüz: suluboya şehir (kutunun ortası); arkaya doğru aynalanarak devam eder.
    fw = int(W * 0.37)
    art = art_layer(key, fw)
    ay = int(H * 0.335)
    vis = int(H * 0.44)
    # Çizim yüksekse üstünden (gökyüzü) kırpılır; deniz ve şehrin alt kısmı kalır.
    art = art.crop((0, max(0, art.height - vis - int(art.height * 0.04)), fw, art.height - int(art.height * 0.04)))
    front = feather(art, top=0.25, bottom=0.14, side=0.14)
    back = feather(art.transpose(Image.FLIP_LEFT_RIGHT), top=0.25, bottom=0.14, side=0.14)
    for k in (-1, 1):
        multiply(L, back, (cx - fw // 2 + k * (fw - 80), ay))
    multiply(L, front, (cx - fw // 2, ay))
    # Arka yüz (doku kenarları 0/W'de birleşir): ortası dikişte olan ayrı bir panel.
    P = Image.new("RGB", (int(W * 0.34), H), (252, 250, 246))
    pd = ImageDraw.Draw(P)
    pcx = P.width // 2
    city, story = STORY[key]
    pa = feather(art_layer(key, P.width - 40).crop((0, 0, P.width - 40, int(H * 0.25))), top=0.35, bottom=0.3, side=0.18)
    multiply(P, pa, (20, int(H * 0.535)))
    # Marka ve tat
    eye(pd, pcx, int(H * 0.098), int(H * 0.022), C["ring"])
    ctext(pd, pcx, int(H * 0.130), "TURKISH COFFEE", font("Nunito_wght_900.ttf", int(H * 0.026)), BROWN, track=3)
    ctext(pd, pcx + 4, int(H * 0.160), "Lady", font("Great_Vibes.ttf", int(H * 0.026)), BROWN)
    fn = font("Oswald_wght_600.ttf", int(H * 0.040))
    while pd.textlength(C["name"], font=fn) > P.width * 0.74:
        fn = font("Oswald_wght_600.ttf", fn.size - 2)
    ctext(pd, pcx, int(H * 0.205), C["name"], fn, C["title"], track=3)
    fc = font("Oswald_wght_500.ttf", int(H * 0.017))
    lab = f"A JOURNEY THROUGH {city}"
    ctext(pd, pcx, int(H * 0.262), lab, fc, DARK, track=4)
    lw = pd.textlength(lab, font=fc) + 4 * len(lab)
    for k in (-1, 1):
        x0 = pcx + k * (lw / 2 + 18)
        pd.line((x0, int(H * 0.272), x0 + k * 70, int(H * 0.272)), fill=C["title"], width=2)
    # Hikâye (markanın metninden)
    fs = font("Playfair_Display_ital_wght_1_500.ttf", int(H * 0.0215))
    y = int(H * 0.305)
    for ln in wrap(pd, story, fs, P.width * 0.78):
        ctext(pd, pcx, y, ln, fs, DARK)
        y += int(H * 0.030)
    # Tat profili
    y += int(H * 0.012)
    pd.line((pcx - 60, y, pcx + 60, y), fill=C["title"], width=2)
    y += int(H * 0.014)
    ctext(pd, pcx, y, "FLAVOR PROFILE", font("Oswald_wght_500.ttf", int(H * 0.015)), C["title"], track=5)
    y += int(H * 0.026)
    prof = " · ".join(l for l in C["lines"] if l).replace(" | ", " · ").replace("& ·", "&")
    fp = font("Oswald_wght_500.ttf", int(H * 0.019))
    items = prof.upper().split(" · ")
    rows = [" · ".join(items)] if pd.textlength(" · ".join(items), font=fp) < P.width * 0.8 else [" · ".join(items[:(len(items) + 1) // 2]), " · ".join(items[(len(items) + 1) // 2:])]
    for ln in rows:
        ctext(pd, pcx, y, ln, fp, DARK, track=2)
        y += int(H * 0.026)
    # Alt: imza, miras, hacim, adres
    fq = font("Playfair_Display_ital_wght_1_500.ttf", int(H * 0.036))
    ctext(pd, pcx, int(H * 0.775), "Good Coffee. Good Fortune.", fq, C["title"])
    fm = font("Oswald_wght_500.ttf", int(H * 0.0165))
    ctext(pd, pcx, int(H * 0.828), "500 YEARS OF TURKISH COFFEE HERITAGE", fm, DARK, track=3)
    ctext(pd, pcx, int(H * 0.852), "ICED  ·  READY TO DRINK  ·  8.5 FL OZ (250 ml)", fm, DARK, track=2)
    pd.line((pcx - 150, int(H * 0.884), pcx + 150, int(H * 0.884)), fill=(200, 190, 175), width=1)
    ctext(pd, pcx, int(H * 0.895), "turkishcoffeelady.com  ·  @turkishcoffeelady", font("Oswald_wght_500.ttf", int(H * 0.018)), C["title"], track=1)
    half = P.width // 2
    L.paste(P.crop((half, 0, P.width, H)), (0, 0))
    L.paste(P.crop((0, 0, half, H)), (W - half, 0))
    d = ImageDraw.Draw(L)
    # Üst bant
    bh = int(H * 0.058)
    d.rectangle((0, 0, W, bh), fill=C["band"])
    f = font("Oswald_wght_500.ttf", int(bh * 0.6))
    step = W // 3
    for i in range(3):
        ctext(d, step * i + step // 2, int(bh * 0.08), "GOOD COFFEE. GOOD FORTUNE.", f, (255, 255, 255), track=2)
    # TURKISH COFFEE / Lady
    ft = font("Nunito_wght_900.ttf", int(H * 0.072))
    ctext(d, cx, int(H * 0.085), "TURKISH", ft, BROWN, track=3)
    ctext(d, cx, int(H * 0.155), "COFFEE", ft, BROWN, track=3)
    ctext(d, cx + 10, int(H * 0.225), "Lady", font("Great_Vibes.ttf", int(H * 0.05)), BROWN)
    # Tat adı
    fn = font("Oswald_wght_600.ttf", int(H * 0.058))
    name = C["name"]
    while d.textlength(name, font=fn) > W * 0.36:
        fn = font("Oswald_wght_600.ttf", fn.size - 4)
    ctext(d, cx, int(H * 0.285), name, fn, C["title"], track=2)
    # Nazar boncuğu
    eye(d, cx, int(H * 0.45), int(H * 0.07), C["ring"])
    # Alt bilgi
    fi = font("Oswald_wght_600.ttf", int(H * 0.040))
    ctext(d, cx, int(H * 0.775), "ICED TURKISH COFFEE", fi, C["title"], track=2)
    fl = font("Oswald_wght_500.ttf", int(H * 0.032))
    y = int(H * 0.828)
    for ln in C["lines"]:
        if not ln:
            continue
        f2 = fl if ln.isupper() else font("Playfair_Display_ital_wght_1_500.ttf", int(H * 0.026))
        while d.textlength(ln, font=f2) > W * 0.3:
            f2 = font("Playfair_Display_ital_wght_1_500.ttf", f2.size - 2)
        ctext(d, cx, y, ln, f2, C["title"] if ln.isupper() else DARK, track=1 if ln.isupper() else 0)
        y += int(H * 0.036)
    ctext(d, cx, max(y, int(H * 0.885)), "8.5 FL OZ (250 ml)", font("Oswald_wght_500.ttf", int(H * 0.028)), DARK, track=1)
    # Alt bant
    d.rectangle((0, int(H * 0.94), W, H), fill=C["band"])
    fb = font("Oswald_wght_500.ttf", int(H * 0.034))
    for i in range(3):
        ctext(d, step * i + step // 2, int(H * 0.945), "SHAKE WELL. DRINK COLD.", fb, (255, 255, 255), track=2)
    # Arka yüz: marka satırı (kenarlarda; doku 0/W'de birleşir)
    fq = font("Playfair_Display_ital_wght_1_500.ttf", int(H * 0.04))
    for bx in (W * 0.0, W * 1.0):
        pass
    os.makedirs("labels", exist_ok=True)
    L.save(f"labels/{key}.png")
    return L


if __name__ == "__main__":
    ims = [make(k) for k in CANS]
    s = Image.new("RGB", (W // 4 * 5, H // 4), "white")
    for i, im in enumerate(ims):
        s.paste(im.resize((W // 4, H // 4)), (i * W // 4, 0))
    s.save("labels_sheet.jpg")
    f = Image.new("RGB", (1500, 780), "white")
    for i, k in enumerate([0, 1, 2]):
        f.paste(ims[k].crop((int(W * .3), 0, int(W * .7), H)).resize((480, 780)), (i * 500, 0))
    f.save("label_front.jpg")
