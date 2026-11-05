# Çizgi film tarzının "nasıl yaptık" görselleri: arka plan, ses → ağız, prompt kartı
import json, math
from fmtlib import *
import karakter as K
import sahne_fatih as SF

PROMPT = [
    "Merhaba Claude! [KONU] hakkında 30–40 saniyelik bir çizgi film",
    "sahnesi yapmak istiyorum. Kod bilmiyorum; sen yaz, ben bakayım.",
    "",
    "1. Olayı araştır, tarihleri kontrol et. Anlatıcı + 2 karakterle kısa",
    "   bir diyalog yaz; rivayet olan sözleri \"rivayete göre\" diye belirt.",
    "2. Python ile ücretsiz çiz: kalın siyah çizgi, düz renkler, hafif gölge.",
    "3. Karakterleri parça parça kur: kafa, gövde, kollar. Yüzde normal,",
    "   kızgın, gülen ifadeleri olsun; gözler kırpsın.",
    "4. Arka planı da kodla çiz: [MEKÂN]. Bir kez çiz, tekrar kullan.",
    "5. Her repliği ayrı ses dosyası yap; ağız sesin şiddetine göre",
    "   açılıp kapansın.",
    "6. Konuşana yakın çekim, alt yazı ekle; ffmpeg ile 1080p video çıkar.",
    "7. Önce karakter kartını göster; ben düzelteyim, sonra videoyu yap.",
    "",
    "Kodu ben çalıştıracağım: kurulumu (Python, ffmpeg) adım adım anlat.",
]

def surf():
    return skia.Surface.MakeRaster(skia.ImageInfo.Make(W, H, skia.ColorType.kRGBA_8888_ColorType, skia.AlphaType.kPremul_AlphaType))
def save(s, n):
    Image.fromarray(s.makeImageSnapshot().toarray(colorType=skia.ColorType.kRGBA_8888_ColorType)).convert("RGB").save(f"{D}/out/{n}", quality=92); print(n)

# 1) arka plan (karaktersiz) + katman etiketleri
s = surf(); c = s.getCanvas()
c.save(); SF.sky(c, 30, 33.2); c.drawImage(SF.bg_static(), -W * .15, -H * .15)
for x, ph in ((90, 0), (640, 1.3), (1880, 2.2)): SF.tug(c, x, 790, 300, 1, ph)
SF.fire(c, 985, 850, 1); c.restore()
def tag(s_, x, y, tx, ty):
    c.drawLine(x, y, tx, ty, paint("#FFFFFF", 1, 4)); c.drawCircle(x, y, 9, paint("#FFFFFF"))
    f = font(F_BOLD, 34); w_ = f.measureText(s_) + 40
    r = skia.RRect.MakeRectXY(skia.Rect.MakeXYWH(tx - w_ / 2, ty - 50, w_, 62), 31, 31); c.drawRRect(r, paint("#1E1A17", .85))
    text(c, s_, tx, ty - 7, F_BOLD, 34, "#FFFFFF", align="center")
tag("surlar ve kubbe", 1450, 430, 1450, 240); tag("otağ (çadır)", 360, 520, 360, 300); tag("toplar", 1100, 640, 1000, 520); tag("tuğ", 640, 560, 760, 420); tag("kamp ateşi", 985, 800, 1240, 760)
save(s, "cizgi_arka.jpg")

# 2) ses → ağız
s = surf(); c = s.getCanvas(); K.card_bg(c)
text(c, "Ses ve ağız", W / 2, 110, K.F_PLAY, 76, "#2A1E16", align="center")
TL = json.load(open(f"{D}/out/sahne_tl.json")); e = TL["env"]["F"]
it = [i for i in TL["items"] if i["who"] == "F"][1]; f0 = int(it["t"] * 30); seg = e[f0:f0 + int(it["d"] * 30)]
x0, x1, yb = 160, 1760, 930
bw = (x1 - x0) / len(seg)
for k, v in enumerate(seg):
    h = 8 + 170 * v; c.drawRoundRect(skia.Rect.MakeXYWH(x0 + k * bw + 1, yb - h, bw - 3, h), 3, 3, paint("#B3262E" if v > .45 else "#D9A93A"))
c.drawLine(x0, yb, x1, yb, paint("#2A1E16", 1, 3))
text(c, "\"Ya ben o şehri alırım, ya o şehir beni alır.\"", W / 2, 1010, K.F_PLAY, 44, "#6B5A44", align="center")
for k, (lab, tk) in enumerate((("sessiz", 0.), ("orta", .45), ("yüksek", 1.))):
    x = 480 + k * 480
    K.fatih_head(c, x, 470, .9, "normal", talk=tk)
    text(c, lab, x, 640, F_BOLD, 34, "#2A1E16", align="center")
save(s, "nasil_ses.jpg")

# 3) prompt kartı
s = surf(); c = s.getCanvas()
p = skia.Paint(); p.setShader(skia.GradientShader.MakeLinear([skia.Point(0, 0), skia.Point(0, H)], [col("#1D2433").toColor(), col("#10141D").toColor()])); c.drawRect(skia.Rect.MakeWH(W, H), p)
card = skia.RRect.MakeRectXY(skia.Rect.MakeXYWH(150, 30, 1620, 870), 28, 28)
c.drawRRect(card, paint("#F7F3EA"));
text(c, "HAZIR PROMPT · çizgi film sahnesi", 210, 100, F_BOLD, 34, "#B3262E")
text(c, "kopyala → Claude'a yapıştır", 1710, 100, F_MED, 28, "#8A7A64", align="right")
c.drawLine(210, 126, 1710, 126, paint("#D8CDB8", 1, 2))
y = 190
for ln in PROMPT:
    if ln:
        f = font(F_MED, 33)
        parts = []
        import re
        xx = 210
        for chunk in re.split(r"(\[[^\]]+\])", ln):
            if not chunk: continue
            colr = "#B3262E" if chunk.startswith("[") else "#1E1A17"
            tf = F_BOLD if chunk.startswith("[") else F_MED
            xx += text(c, chunk, xx, y, tf, 40, colr)
    y += 53 if ln else 24
text(c, "Tamamı açıklamada", W / 2, 950, F_BOLD, 30, "#F2C462", align="center")
save(s, "prompt_cizgi.jpg")
open(f"{D}/out/prompt_cizgi.txt", "w").write("\n".join(PROMPT))
