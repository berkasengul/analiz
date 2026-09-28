"""Shopify markası: çekilen ürün fotoğraflarını 3B siteye hazırlar (her marka için ortak).

Girdi: markalar/<marka>-shopify/  (araclar/shopify-cek.py çıktısı)
Kurallar: markalar/<marka>-kurallar.json → "foto" (hepsi isteğe bağlı):
    "ai": true                      arka planı yapay zekâyla sil (rembg, isnet); yoksa beyaz zemin taşması
    "heights": [["regex", cm], ...]  setlerde ürünlerin gerçek boyları (yan yana orantı)
    "noBackText": "regex"           arka etiket yazılmayacak ürünler (kutu, tekstil…)
    "flat": "regex"                 düz yüzlü ürünler (kenar bandı düz renge bağlanmaz)
    "backPhotos": false             markanın fotoğraflarında arka yüz yok: arka etiket metinden üretilir
    "views": true                   galerideki diğer ürün çekimleri (kapaksız şişe, kutu…) de 3B'ye çevrilir;
                                     sitede küçük görsele tıklayınca sahnedeki ürün o modele döner
    "noViews": "regex"              3B görünüm üretilmeyecek ürünler (ör. setler)
    "skip": "regex"                 demoya alınmayacak ürünler (ör. deneme setleri, kutu ürünleri)
    "studio": true                  renkli/gri stüdyo zeminindeki ürün çekimleri de ürün fotoğrafı sayılır (yapay zekâyla kesilir)
    "pedestal": true                ürün bir kaide üstünde çekilmiş (zeminde yansıma yok): şeffaf camın açık renkli
                                     tabanı yansıma sanılıp kesilmez
    "solidTop": 0.25                ürünün üst bölümü (oran) delik bırakılmadan dolu kesilir (zemine yakın renkli kapak)
    "glassBack": {"label": [x0, y0, x1, y1], "labels": [["regex", [x0, y0, x1, y1]]], "lines": ["...", ...]}
                                     renkli cam şişe: arka yüz ön fotoğrafın aynası (cam ve renk net), ön etiketin
                                     yerine markanın etiket stilinde arka etiket (ad, aile, notalar, hacim; notalar ve
                                     hacim aktar kurallarından: aktar.notes, aktar.sizes/defaultSize). Koordinatlar
                                     ön yüz karesine oranla.
    "sets": {"set-handle": ["ürün-handle", "başka-handle#3", ...]}
                                     setin içindekiler; "#n" o ürünün n. fotoğrafı (setin kendisi de olabilir)
Çıktı: markalar/<marka>-foto/{web,cut,labels,meta.json}

Kullanım: python3 demo-fabrikasi/araclar/shopify-foto.py turkan
          python3 demo-fabrikasi/araclar/shopify-foto.py turkan --views   (yalnızca galeri 3B görünümleri)
"""
import glob
import json
import re
import os
import sys

import cv2
import numpy as np
from PIL import Image, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
if len(sys.argv) < 2:
    sys.exit(__doc__)
SLUG = sys.argv[1]
MARKA = os.path.join(HERE, "..", "markalar")
SRC = os.path.join(MARKA, f"{SLUG}-shopify")
OUT = os.path.join(MARKA, f"{SLUG}-foto")
_rules = os.path.join(MARKA, f"{SLUG}-kurallar.json")
_ALL = json.load(open(_rules, encoding="utf-8")) if os.path.exists(_rules) else {}
RULES = _ALL.get("foto", {})
S = 1280  # atlasın bir yarısı (yazılar okunur kalsın diye yüksek)
BG = (244, 241, 234)  # galeride şeffaf fotoğrafların zemini


def kind(im):
    """T: şeffaf zemin, W: beyaz zemin, L: yaşam tarzı / sahne fotoğrafı."""
    a = np.asarray(im.convert("RGBA"))
    b = np.concatenate([a[:8].reshape(-1, 4), a[-8:].reshape(-1, 4), a[:, :8].reshape(-1, 4), a[:, -8:].reshape(-1, 4)])
    if (b[:, 3] < 20).mean() > 0.8:
        return "T"
    if ((b[:, :3].min(1) > 235) & (b[:, 3] > 200)).mean() > 0.85:
        return "W"
    return "L"


_SESSION = None


def ai_alpha(im, box=False):
    """Yapay zekâyla ürün maskesi (rembg · isnet). Zemindeki silik yansıma ve gölge atılır:
    yarı saydam pikseller kesilir, ana gövdeye bağlı olmayan küçük parçalar silinir.
    box=True: dikdörtgen kutu; tam genişlikteki son satırın altı yansımadır (beyaz kutunun
    açık renkli alt kısmı yansıma sanılıp kesilmez)."""
    global _SESSION
    from rembg import new_session, remove
    if _SESSION is None:
        _SESSION = new_session("isnet-general-use")
    rgb = im.convert("RGB")
    small = rgb.copy()
    small.thumbnail((1600, 1600))
    raw = np.asarray(remove(small, session=_SESSION, only_mask=True)).astype(np.float32) / 255
    # Zemin yansıması şişeye bitişikse: alttan yukarı, maskesi yarı saydam ya da rengi beyaza
    # neredeyse eşit satırlar (şişe gövdesinden çok soluk) kesilir.
    px = np.asarray(small).astype(np.float32)
    m0 = raw > 0.5
    rows = np.where(m0.any(1))[0]
    if box and len(rows) > 20:
        widths = m0.sum(1)
        med = np.median(widths[rows[0] + (rows[-1] - rows[0]) // 4 : rows[-1] - (rows[-1] - rows[0]) // 4])
        full = np.where(widths >= 0.9 * med)[0]
        raw[full[-1] + 1 :] = 0
    elif len(rows) > 20 and not RULES.get("pedestal"):
        # Kaide üstündeki çekimde zeminde yansıma yok: şeffaf camın açık renkli tabanı kesilmez.
        top, bot = rows[0], rows[-1]
        alpha = np.array([raw[y][m0[y]].mean() if m0[y].any() else 0 for y in range(len(raw))])
        dark = np.array([(255 - px[y][m0[y]].min(1)).mean() if m0[y].any() else 0 for y in range(len(raw))])
        med = np.median(dark[top:bot + 1])
        y = bot
        while y > top + 0.6 * (bot - top) and (alpha[y] < 0.93 or dark[y] < 0.35 * med):
            y -= 1
        if bot - y > 3:
            raw[y + 2:] = 0
    a = np.clip((raw * 255 - 90) / 110, 0, 1)
    m = (a > 0.5).astype(np.uint8)
    n, lab, st, _ = cv2.connectedComponentsWithStats(m, 8)
    if n > 1:
        big = st[1:, cv2.CC_STAT_AREA].max()
        keep = [i for i in range(1, n) if st[i, cv2.CC_STAT_AREA] >= big * 0.04]
        a *= np.isin(lab, keep)
    a = cv2.resize(a, rgb.size, interpolation=cv2.INTER_LINEAR)
    return (a * 255).astype(np.uint8)


def cutout(im, k, box=False):
    """RGBA ürün kesiti (beyaz zemin kenardan başlayarak şeffaflaştırılır)."""
    im = im.convert("RGBA")
    if k in "WL" and RULES.get("ai"):
        a = np.asarray(im).copy()
        a[..., 3] = ai_alpha(im, box)
        # Kapak zemine yakın renkteyse maskede delik kalır: üst bölümde (solidTop oranı) her satır
        # soldan sağa dolu sayılır.
        if RULES.get("solidTop"):
            al = a[..., 3]
            rows = np.where((al > 128).any(1))[0]
            if len(rows):
                y0 = rows[0]
                y1 = y0 + int((rows[-1] - y0) * RULES["solidTop"])
                for y in range(y0, y1):
                    xs = np.where(al[y] > 128)[0]
                    if len(xs) > 1:
                        al[y, xs[0]:xs[-1] + 1] = 255
        im = Image.fromarray(a)
    elif k == "W":
        a = np.asarray(im).copy()
        white = a[..., :3].min(2) > 238
        # Kenara bağlı beyaz alanlar zemin; ürünün içindeki beyazlar kalır.
        from collections import deque

        h, w = white.shape
        bg = np.zeros_like(white)
        q = deque([(y, x) for y in (0, h - 1) for x in range(0, w, 4)] + [(y, x) for x in (0, w - 1) for y in range(0, h, 4)])
        while q:
            y, x = q.popleft()
            if 0 <= y < h and 0 <= x < w and white[y, x] and not bg[y, x]:
                bg[y, x] = True
                q.extend(((y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)))
        alpha = np.where(bg, 0, 255).astype(np.uint8)
        a[..., 3] = np.asarray(Image.fromarray(alpha).filter(ImageFilter.GaussianBlur(1.2)))
        im = Image.fromarray(a)
    box = im.getchannel("A").point(lambda v: 255 if v > 12 else 0).getbbox()
    return im.crop(box) if box else im


def fit(im, size, margin=0.03):
    """Kesiti kare tuvale ortalar (en uzun kenar tuvalin %94'ü)."""
    w, h = im.size
    k = size * (1 - 2 * margin) / max(w, h)
    im = im.resize((max(1, round(w * k)), max(1, round(h * k))), Image.LANCZOS)
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    canvas.paste(im, ((size - im.width) // 2, (size - im.height) // 2), im)
    return canvas


def shape_info(F):
    """3B için silüet bilgisi (kare tuvale göre 0–1):
    rows: her satırda ürün ekseni etrafındaki simetrik yarıçap (dönen gövde için),
    axis: eksenin x konumu, outline: dış kenar çokgenleri (düz blok için), edge: kenar rengi."""
    a = np.asarray(F)
    m = a[..., 3] > 128
    ys = np.where(m.any(1))[0]
    if not len(ys):
        return {}
    # Eksen: gövdenin orta kısmındaki satırlarda en geniş parçanın ortası.
    centers = []
    for y in range(ys[0] + (ys[-1] - ys[0]) // 5, ys[-1] - (ys[-1] - ys[0]) // 5, 4):
        xs = np.where(m[y])[0]
        if len(xs):
            runs = np.split(xs, np.where(np.diff(xs) > 1)[0] + 1)
            big = max(runs, key=len)
            centers.append((big[0] + big[-1]) / 2)
    cx = int(round(np.median(centers))) if centers else S // 2
    N = 240
    rows = []
    for i in range(N):
        y = min(S - 1, int((i + 0.5) / N * S))
        if not m[y, cx]:
            rows.append(0.0)
            continue
        left = cx
        while left > 0 and m[y, left - 1]:
            left -= 1
        right = cx
        while right < S - 1 and m[y, right + 1]:
            right += 1
        rows.append(round(min(cx - left, right - cx) / S, 4))
    small = cv2.resize(m.astype(np.uint8) * 255, (640, 640), interpolation=cv2.INTER_AREA)
    _, small = cv2.threshold(small, 127, 255, cv2.THRESH_BINARY)
    cs, _ = cv2.findContours(small, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    total = small.sum() / 255
    outline = []
    for c in cs:
        if cv2.contourArea(c) < total * 0.004:
            continue
        c = cv2.approxPolyDP(c, 0.7, True)[:, 0, :]
        outline.append([[round(float(x) / 640, 4), round(float(y) / 640, 4)] for x, y in c])
    band = m & ~cv2.erode(m.astype(np.uint8), np.ones((9, 9), np.uint8)).astype(bool)
    edge = np.median(a[band][:, :3], 0) if band.any() else np.array([120, 110, 90])
    # Boyun: kapağın bittiği yer (üst yarıda genişliğin en dar olduğu satır; küre kapaklı şişeler).
    neck = None
    nz = [i for i, r in enumerate(rows) if r > 0]
    if nz:
        top, bot = nz[0], nz[-1]
        body = max(rows[top + (bot - top) // 2 : bot + 1] or [0])
        upper = list(range(top, top + (bot - top) // 2))
        if len(upper) > 8:
            peak = max(upper[: len(upper) * 2 // 3], key=lambda i: rows[i])
            after = [i for i in upper if i > peak]
            if after:
                low = min(after, key=lambda i: rows[i])
                if rows[low] < 0.8 * rows[peak] and rows[low] < 0.6 * body:
                    neck = round((low + 0.5) / N, 4)
        # Köşeli omuzlu şişe (dar boyun halkasından gövde birden genişler): genişliğin birden
        # ~2 katına çıktığı satır boyundur.
        if neck is None:
            jump = next((i for i in upper[:-2] if 0 < rows[i] < 0.6 * body and rows[i + 2] > 1.8 * rows[i]), None)
            if jump is not None and jump - top > 8:
                neck = round((jump + 1.5) / N, 4)
        # Taç kapaklı şişe (geniş kapak, dar boyun, omuzdan yavaşça genişleyen gövde): kapak ile gövde
        # arasındaki en dar satır; üstünde kapak ondan belirgin geniş, altında gövde en az iki katı.
        if neck is None:
            span = bot - top
            mid = [i for i in range(top + span // 10, top + span * 45 // 100) if rows[i] > 0.02 * body]
            if mid:
                low = min(mid, key=lambda i: rows[i])
                if max(rows[top:low]) > 1.5 * rows[low] and body > 2 * rows[low]:
                    neck = round((low + 0.5) / N, 4)
    return {"axis": round(cx / S, 4), "rows": rows, "outline": outline, "edge": [int(v) for v in edge], "neck": neck}


def _soft(F, sigma):
    """Alfaya duyarlı bulanıklık (kenarda kararma olmadan)."""
    a = np.asarray(F).astype(np.float32)
    al = a[..., 3:4] / 255
    num = cv2.GaussianBlur(a[..., :3] * al, (0, 0), sigma)
    den = cv2.GaussianBlur(al, (0, 0), sigma)[..., None]
    return num / np.maximum(den, 1e-3)


def _edge_weight(F):
    """0 silüet kenarında, 1 içeride (kenardan ~38 px, yumuşak): arka yüz kenarda ön yüzle birleşsin."""
    m = (np.asarray(F)[..., 3] > 128).astype(np.uint8)
    d = cv2.distanceTransform(m, cv2.DIST_L2, 5)
    t = np.clip(d / (0.03 * S), 0, 1)
    return (t * t * (3 - 2 * t))[..., None], d


def _row_fill(F):
    """Ambalajın yazısız rengi, satır satır: her satır için çevresindeki ±%5 yükseklikteki
    bütün ürün piksellerinin ortancası. Logo ve yazı bu alanın küçük bir kısmı olduğu için
    arkaya hayalet ya da şerit olarak geçmez; kapak/gövde gibi keskin geçişler korunur."""
    a = np.asarray(F).astype(np.float32)
    m = a[..., 3] > 128
    H = a.shape[0]
    R = max(8, int(H * 0.05))
    step = max(1, a.shape[1] // 120)
    sub, msub = a[:, ::step, :3], m[:, ::step]
    rows = np.zeros((H, 3), np.float32)
    ok = np.zeros(H, bool)
    for y in range(0, H, 2):
        if not m[y].any():
            continue
        lo, hi = max(0, y - R), min(H, y + R + 1)
        px = sub[lo:hi][msub[lo:hi]]
        if len(px) >= 5:
            rows[y] = np.median(px, axis=0)
            ok[y] = True
    if not ok.any():
        return _soft(F, S * 0.05)
    idx = np.where(ok)[0]
    for c in range(3):
        rows[:, c] = np.interp(np.arange(H), idx, rows[idx, c])
    rows = cv2.GaussianBlur(rows[:, None, :], (0, 0), sigmaX=0.1, sigmaY=S * 0.004)[:, 0, :]
    return np.repeat(rows[:, None, :], a.shape[1], axis=1)


def seal_front(F):
    """Ön yüzün silüet kenarındaki bant ambalajın düz rengine yumuşakça geçer.
    Dönen gövdede bu bant ürünün yan tarafına gerilir; kenardaki parlama,
    gölge ve yazı yanda uzamış çizgi gibi görünmez, arka yüzle dikişsiz birleşir."""
    a = np.asarray(F).astype(np.float32)
    w, _ = _edge_weight(F)
    rgb = _row_fill(F) * (1 - w) + a[..., :3] * w
    return Image.fromarray(np.concatenate([rgb, a[..., 3:4]], axis=2).clip(0, 255).astype(np.uint8))


def plain_back(F, back_photo=None, text=None):
    """Arka yüz (arkadan bakana göre çizilir, sonra aynalanmış ön yüz hizasında):
    - arka fotoğraf varsa o; yoksa ön yüzün yazısız, yumuşak renkleri,
    - kenarlarda ön fotoğrafın kenar renkleriyle kaynaşır (yanda dikiş görünmez),
    - arka fotoğrafı olmayan kozmetiklerde okunur bir içerik/kullanım etiketi."""
    a = np.asarray(F).astype(np.float32)
    w, _ = _edge_weight(F)
    base = _row_fill(F)
    inner = base
    if back_photo is not None:  # ön yüz hizasında verilir; boş kalan yerler yumuşak renkle dolar
        bp = np.asarray(back_photo).astype(np.float32)
        ab = bp[..., 3:4] / 255
        inner = base * (1 - ab) + bp[..., :3] * ab
    # Kenarda iki yüz de aynı düz renkte buluşur (seal_front ile aynı bant): yanda dikiş yok.
    rgb = base * (1 - w) + inner * w
    out = np.concatenate([rgb, a[..., 3:4]], axis=2).clip(0, 255).astype(np.uint8)
    img = Image.fromarray(out).transpose(Image.FLIP_LEFT_RIGHT)
    if text and back_photo is None:
        draw_back_label(img, text)
    return img


FONTS = os.path.join(HERE, "..", "..", "hope-demo", "docs", "label-fonts")


def _font(name, size):
    from PIL import ImageFont
    return ImageFont.truetype(os.path.join(FONTS, name), max(8, int(size)))


def draw_back_label(img, text):
    """Arka etiket: ürün adı, kısa açıklama, özellikler, kullanım, hacim (markanın metinlerinden).

    Metin yalnızca gövdenin düz (en geniş) kısmına yazılır, omuza ve kapağa taşmaz;
    blok o alanda dikeyde ortalanır."""
    from PIL import ImageDraw
    m = np.asarray(img)[..., 3] > 128
    rows = m.sum(1)
    if rows.max() < 60:
        return
    body = np.where(rows >= rows.max() * 0.72)[0]
    # Kesintisiz en uzun bölüm gövdedir (küre kapak gibi geniş parçalar boyunla ayrılır).
    runs = np.split(body, np.where(np.diff(body) > 2)[0] + 1)
    body = max(runs, key=len)
    top, bot = body[0], body[-1]
    y0, y1 = int(top + (bot - top) * 0.1), int(bot - (bot - top) * 0.06)
    if y1 - y0 < 80:
        return
    left = max(np.where(m[y])[0][0] for y in range(y0, y1, 4) if m[y].any())
    right = min(np.where(m[y])[0][-1] for y in range(y0, y1, 4) if m[y].any())
    W = (right - left) * 0.8
    if W < 110:
        return
    cx = (left + right) / 2
    region = np.asarray(img)[y0:y1, int(cx - W / 2):int(cx + W / 2), :3]
    dark = region.mean() < 128
    ink = (246, 239, 224) if dark else (34, 28, 22)
    d = ImageDraw.Draw(img)

    def wrap(t, f, width):
        out, line = [], ""
        for word in t.split():
            test = (line + " " + word).strip()
            if d.textlength(test, font=f) > width and line:
                out.append(line)
                line = word
            else:
                line = test
        return out + ([line] if line else [])

    # Yazı alana sığana kadar küçült (okunaklı bir alt sınırla).
    variants = [text, {**text, "usage": None}, {**text, "usage": None, "chips": []}]
    for base, text in [(b, v) for v in variants for b in np.linspace(W / 12, W / 15.5, 4)]:
        f_head = _font("Lato-Bold.ttf", base * 0.6)
        f_title = _font("Marcellus-Regular.ttf", base * 1.05)
        f_body = _font("Lato-Bold.ttf", base * 0.7)
        items = []  # (metin, yazı tipi, satır yüksekliği)
        for line in wrap(text["name"].upper(), f_title, W)[:3]:
            items.append((line, f_title, base * 1.3))
        items.append((None, None, base * 0.45))
        blocks = [(None, text["desc"])]
        if text.get("chips"):
            blocks.append(("ÖZELLİKLER", " · ".join(text["chips"])))
        if text.get("usage"):
            blocks.append(("KULLANIM", text["usage"]))
        for head, bodytxt in blocks:
            if head:
                items.append((head, f_head, base * 0.95))
            for line in wrap(bodytxt, f_body, W):
                items.append((line, f_body, base * 0.95))
            items.append((None, None, base * 0.5))
        total = sum(h for _, _, h in items) + (base * 1.4 if text.get("size") else 0)
        if total <= y1 - y0:
            break
    else:
        items = items[: max(1, int((y1 - y0) / (base * 0.95)))]
        total = sum(h for _, _, h in items)
    y = y0 + max(0, (y1 - y0 - total) / 2)
    for line, f, h in items:
        if line:
            d.text((cx, y), line, font=f, fill=ink, anchor="mt")
        y += h
    if text.get("size"):
        d.text((cx, min(y1, y + base * 0.6)), text["size"], font=f_head, fill=ink, anchor="mt")


def accent_of(F, primary):
    """Ürünün ikinci rengi (arka plan paleti için): baskın renkten en farklı küme."""
    a = np.asarray(F.resize((160, 160))).reshape(-1, 4)
    px = a[a[:, 3] > 200][:, :3].astype(np.float32)
    if len(px) < 50:
        return primary
    k = min(4, len(px))
    _, lab, cen = cv2.kmeans(px, k, None, (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 20, 1.0), 3, cv2.KMEANS_PP_CENTERS)
    counts = np.bincount(lab.ravel(), minlength=k) / len(px)
    best, score = None, 0
    for c, n in zip(cen, counts):
        d = np.abs(c - np.array(primary)).sum()
        if n > 0.06 and d * n ** 0.3 > score:
            best, score = c, d * n ** 0.3
    if best is None or np.abs(best - np.array(primary)).sum() < 45:
        best = np.array(primary) * 0.55 + 255 * 0.45 * np.array([1.0, 0.95, 0.85])
    return [int(v) for v in best]


# Setlerde ürünlerin gerçek boyları (cm, yaklaşık): yan yana dizilirken orantılı dursun.
HEIGHT = [tuple(x) for x in RULES.get("heights", [])]


def real_height(h):
    import re
    return next((v for rx, v in HEIGHT if re.search(rx, h)), 12)


def compose_set(items, fronts, backs):
    """Setin ürünlerini kutusuz ve zeminsiz, gerçek boy oranlarıyla yan yana dizer.
    Dönüş: ön ve arka tuval (S×S RGBA) ve her ürünün tuvaldeki katmanı."""
    crops = []
    for h in items:
        F, Bk = fronts[h], backs[h]
        x0, y0, x1, y1 = F.getchannel("A").point(lambda v: 255 if v > 12 else 0).getbbox()
        crops.append((h, F.crop((x0, y0, x1, y1)), Bk.crop((S - x1, y0, S - x0, y1)), real_height(h)))
    # En büyük ortada, diğerleri sırayla sağa ve sola (kenarlarda küçükler).
    crops.sort(key=lambda c: -c[3])
    order = []
    for i, c in enumerate(crops):
        order.append(c) if i % 2 == 0 else order.insert(0, c)
    # Ölçü: ürünün en uzun kenarı gerçek boyuna (cm) eşitlenir (yatay aletler de doğru boyda).
    dims = [(c[1].width * c[3] / max(c[1].size), c[1].height * c[3] / max(c[1].size)) for c in order]
    gap = 0.035 * S
    tw = sum(w for w, _ in dims)
    mh = max(h for _, h in dims)
    k = min((0.94 * S - gap * (len(order) - 1)) / tw, 0.8 * S / mh)
    base = S / 2 + mh * k / 2
    x = (S - (tw * k + gap * (len(order) - 1))) / 2
    front = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    back = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    layers = []
    for (h, fc, bc, _), (dw, dh) in zip(order, dims):
        W = max(1, int(round(dw * k)))
        H = max(1, int(round(dh * k)))
        w = dw * k
        fi = fc.resize((W, H), Image.LANCZOS)
        bi = bc.resize((W, H), Image.LANCZOS)
        px, py = int(round(x)), int(round(base - H))
        front.alpha_composite(fi, (px, py))
        back.alpha_composite(bi, (S - px - W, py))
        layer = Image.new("RGBA", (S, S), (0, 0, 0, 0))
        layer.alpha_composite(fi, (px, py))
        layers.append((h, layer))
        x += w + gap
    return front, back, layers


def same_face(a, b):
    """İki kesit aynı yüzü mü gösteriyor? Ortak alanda gri tonların korelasyonu yüksekse evet."""
    ga = np.asarray(a.convert("L").resize((256, 256))).astype(np.float32)
    gb = np.asarray(b.convert("L").resize((256, 256))).astype(np.float32)
    m = (np.asarray(a.getchannel("A").resize((256, 256))) > 128) & (np.asarray(b.getchannel("A").resize((256, 256))) > 128)
    if m.sum() < 500:
        return False
    x, y = ga[m] - ga[m].mean(), gb[m] - gb[m].mean()
    corr = (x * y).sum() / max(1e-6, np.sqrt((x * x).sum() * (y * y).sum()))
    return corr > 0.6


def mask_iou(a, b):
    a = np.asarray(a.getchannel("A")) > 128
    b = np.asarray(b.getchannel("A")) > 128
    return (a & b).sum() / max(1, (a | b).sum())


def dominant(im):
    a = np.asarray(im.convert("RGBA").resize((96, 96))).reshape(-1, 4).astype(float)
    a = a[a[:, 3] > 200][:, :3]
    if not len(a):
        return [120, 110, 90]
    sat = a.max(1) - a.min(1)
    lum = a.mean(1)
    pick = a[(sat > 25) & (lum > 30) & (lum < 235)]
    return [int(v) for v in np.median(pick if len(pick) > 50 else a, 0)]


_TR = None


def _paras(h):
    import html as _h
    t = re.sub(r"(?is)<(style|script)\b.*?</\1>", "", h or "")
    t = re.sub(r"<(br|/p|/li|/h\d|/div)[^>]*>", "\n", t)
    t = _h.unescape(re.sub(r"<[^>]+>", "", t))
    return [re.sub(r"\s+", " ", p).strip() for p in t.split("\n") if p.strip()]


def _clip(s, n):
    if len(s) <= n:
        return s
    cut = s[:n]
    m = max(cut.rfind(". "), cut.rfind("; "), cut.rfind("… "))
    return (cut[: m + 1] if m > n * 0.5 else cut.rsplit(" ", 1)[0] + "…").strip()


def back_text(handle):
    """Arka etiket metni markanın ürün sayfasından: ad, kısa açıklama, kullanım, hacim."""
    global _TR
    if RULES.get("noBackText") and re.search(RULES["noBackText"], handle):
        return None
    if _TR is None:
        _TR = {p["handle"]: p for p in json.load(open(os.path.join(SRC, "products-tr.json"), encoding="utf-8"))}
    p = _TR.get(handle)
    if not p:
        return None
    title = re.sub(RULES.get("namePrefix", r"^$"), "", p["title"]).strip()
    m = re.search(r"\s*[-–]?\s*\(?(\d+(?:[.,]\d+)?)\s*(ml|gr|g)\)?\s*$", title, re.I)
    size = f"{m.group(1)} {'ml' if m.group(2).lower() == 'ml' else 'g'}" if m else None
    name = title[: m.start()].strip(" -–") if m else title
    ps = [x for x in _paras(p["body_html"]) if len(x) > 30]
    desc = _clip(ps[0], 120) if ps else name
    # Kullanım: önce "Kullanım Şekli:" satırı; yoksa uygulama tarif eden bir paragraf.
    usage = next((x for x in ps if re.match(r"kullanım şekli", x, re.I)), None) or next(
        (x for x in ps if re.search(r"\b(uygulayın|uygulanır|püskürtün|sürün|masaj yap)", x, re.I) and x != ps[0]), None)
    if usage:
        usage = re.split(r"\s*Uyarılar:", re.sub(r"^Kullanım Şekli:\s*", "", usage, flags=re.I))[0]
    return {"name": name, "size": size, "desc": desc, "chips": [], "usage": _clip(usage, 150) if usage else None}


def glass_back(F, handle):
    """Renkli cam şişenin arka yüzü: ön fotoğrafın aynası (arkadan bakınca cam ve parfümün rengi görünür)
    ve ön etiketin yerinde, etiketin kendi renkleriyle çizilmiş okunur bir arka etiket."""
    from PIL import ImageDraw
    G = RULES["glassBack"]
    x0, y0, x1, y1 = next((r for rx, r in G.get("labels", []) if re.search(rx, handle)), G["label"])
    img = F.transpose(Image.FLIP_LEFT_RIGHT).copy()
    W, H = img.size
    # Aynada etiket x ekseninde yansır.
    L, T, Rr, B = int((1 - x1) * W), int(y0 * H), int((1 - x0) * W), int(y1 * H)
    fa = np.asarray(F)[int(y0 * H):int(y1 * H), int(x0 * W):int(x1 * W), :3].reshape(-1, 3).astype(float)
    lum = fa.mean(1)
    paper = np.median(fa[lum > np.percentile(lum, 60)], 0)
    ink = np.median(fa[lum < np.percentile(lum, 4)], 0)
    # Koyu etikette (ör. bronz) yazı açık altın: etiketin en parlak pikselleri (ön yüzdeki altın baskı).
    if paper.mean() < 120:
        paper = np.median(fa[lum < np.percentile(lum, 40)], 0)
        ink = np.median(fa[lum > np.percentile(lum, 97)], 0)
    d = ImageDraw.Draw(img)
    r = int((Rr - L) * 0.04)
    top, bot = np.array(paper) * 1.02, np.array(paper) * 0.9
    for yy in range(T, B):
        t = (yy - T) / max(1, B - T)
        c = tuple(int(min(255, v)) for v in top * (1 - t) + bot * t)
        d.line([(L, yy), (Rr, yy)], fill=c + (255,))
    inkc = tuple(int(v) for v in ink) + (255,)
    m1, m2 = int((Rr - L) * 0.035), int((Rr - L) * 0.06)
    d.rectangle([L + m1, T + m1, Rr - m1, B - m1], outline=inkc, width=max(2, int((Rr - L) * 0.008)))
    d.rectangle([L + m2, T + m2, Rr - m2, B - m2], outline=inkc, width=1)
    A = _ALL.get("aktar", {})
    name = next((v[1] for k, v in A.get("rename", {}).items() if k == handle), None) or re.sub(RULES.get("namePrefix", r"^$"), "", _TR_title(handle))
    notes = next((n for rx, n in A.get("notes", []) if re.search(rx, handle)), [])
    size = next((v for rx, v in A.get("sizes", []) if re.search(rx, handle)), None) or A.get("defaultSize") or ""
    wide = Rr - L - 2 * m2 - int((Rr - L) * 0.08)
    cx = (L + Rr) / 2

    def fit_font(t, name_, size_, width):
        f = _font(name_, size_)
        while d.textlength(t, font=f) > width and size_ > 10:
            size_ *= 0.94
            f = _font(name_, size_)
        return f

    u = (Rr - L) / 7.2
    # Uzun ad küçülmesin: iki satıra bölünür.
    title = [name.upper()]
    if d.textlength(title[0], font=_font("Cinzel-Bold.ttf", u * 0.95)) > wide * 1.15 and " " in name:
        words = name.upper().split()
        k = min(range(1, len(words)), key=lambda i: abs(len(" ".join(words[:i])) - len(" ".join(words[i:]))))
        title = [" ".join(words[:k]), " ".join(words[k:])]
    blocks = [(G.get("brand", "UNIQUE'E LUXURY"), "Cinzel-Medium.ttf", u * 0.62), ("", None, u * 0.35)]
    blocks += [(t, "Cinzel-Bold.ttf", u * 0.95) for t in title]
    blocks += [(G.get("family", "Extrait de Parfum"), "Marcellus-Regular.ttf", u * 0.62),
              ("—", "Marcellus-Regular.ttf", u * 0.6)]
    blocks += [(n[1], "Marcellus-Regular.ttf", u * 0.56) for n in notes[:5]]
    ml = re.sub(r"\s*ml", "", size)
    oz = {"100": "3.4", "50": "1.7", "30": "1.0"}.get(ml)
    blocks += [("", None, u * 0.35), (f"e {ml}ml" + (f"  ·  {oz} fl.oz" if oz else ""), "Lato-Bold.ttf", u * 0.5)]
    blocks += [(line, "Lato-Regular.ttf", u * 0.42) for line in G.get("lines", [])]
    fonts = [(t, fit_font(t, fn, sz, wide) if fn else None, sz) for t, fn, sz in blocks]
    heights = [(f.getbbox("Hg")[3] - f.getbbox("Hg")[1]) * 1.45 if f else sz for t, f, sz in fonts]
    y = T + (B - T - sum(heights)) / 2
    for (t, f, _), hgt in zip(fonts, heights):
        if f and t:
            d.text((cx, y + hgt / 2), t, font=f, fill=inkc, anchor="mm")
        y += hgt
    return img


def _TR_title(handle):
    global _TR
    if _TR is None:
        _TR = {p["handle"]: p for p in json.load(open(os.path.join(SRC, "products-tr.json"), encoding="utf-8"))}
    return (_TR.get(handle) or {}).get("title", handle)


def largest_part(F):
    """Yalnızca en büyük parça kalır (şişenin yanında kalan kutu/yansıma kırıntıları silinir)."""
    a = np.asarray(F).copy()
    a[..., 3] = np.where(a[..., 3] >= 110, a[..., 3], 0)  # yarı saydam kutu/zemin kalıntısı
    m = (a[..., 3] > 0).astype(np.uint8)
    n, lab, st, _ = cv2.connectedComponentsWithStats(m, 8)
    if n > 2:
        big = 1 + int(np.argmax(st[1:, cv2.CC_STAT_AREA]))
        a[..., 3] = np.where(lab == big, a[..., 3], 0)
    return Image.fromarray(a)


def box_alpha(F):
    """Kutu: silüet dışbükey dikdörtgendir; beyaz kutunun beyaz zeminle karışıp silinen
    yerleri (renkleri kesimde durur) dışbükey zarfla geri gelir. Zarf dikdörtgene benzemiyorsa
    ya da maske çok delikliyse None (bu çekim 3B'ye çevrilmez)."""
    a = np.asarray(F).copy()
    m = (a[..., 3] > 128).astype(np.uint8)
    cs, _ = cv2.findContours(m, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    if not cs:
        return None
    hull = cv2.convexHull(np.concatenate(cs))
    hm = np.zeros_like(m)
    cv2.fillPoly(hm, [hull], 1)
    x, y, w, h = cv2.boundingRect(hull)
    if hm.sum() / (w * h) < 0.9 or m.sum() / max(1, hm.sum()) < 0.7:
        return None
    # Geri gelen yerlerin rengi kesimde yok (saydam = siyah): çevresinden doldurulur.
    # Kaynak yalnızca kutunun sağlam (opak) pikselleri; dışarıdaki saydam siyah sızmasın.
    hole = ((hm == 1) & (a[..., 3] < 200)).astype(np.uint8) * 255
    if hole.any():
        known = (a[..., 3] >= 200).astype(np.uint8) * 255
        small = cv2.resize(np.ascontiguousarray(a[..., :3]), (320, 320), interpolation=cv2.INTER_AREA)
        ks = cv2.resize(known, (320, 320), interpolation=cv2.INTER_NEAREST)
        fill = cv2.inpaint(small, 255 - ks, 5, cv2.INPAINT_TELEA)
        fill = cv2.resize(fill, (a.shape[1], a.shape[0]), interpolation=cv2.INTER_CUBIC)
        a[..., :3] = np.where(hole[..., None] > 0, fill, a[..., :3])
    soft = cv2.GaussianBlur(hm.astype(np.float32), (3, 3), 0)
    a[..., 3] = np.maximum(a[..., 3], (soft * 255).astype(np.uint8))
    return Image.fromarray(a)


def solid(F):
    """Silüetin dolgunluğu (alan / dışbükey zarf): şişe ve kutu ~1, parçalı kesim düşük."""
    m = (np.asarray(F)[..., 3] > 128).astype(np.uint8)
    cs, _ = cv2.findContours(m, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    if not cs:
        return 0
    hull = cv2.convexHull(np.concatenate(cs))
    return m.sum() / max(1.0, cv2.contourArea(hull))


def view_neck(rows):
    """Kapaksız şişe: dar sprey başlığının bittiği, gövdenin genişlediği satır."""
    nz = [i for i, r in enumerate(rows) if r > 0]
    if not nz:
        return None
    body = max(rows)
    top = nz[0]
    for i in range(top, top + (nz[-1] - top) // 2):
        if rows[i] >= 0.55 * body:
            return round((i + 0.5) / len(rows), 4) if i - top > 4 else None
    return None


def make_views(meta):
    """Galerideki diğer ürün çekimlerinden 3B görünümler: aynı kesim ve biçim bilgisiyle
    (kutu ve kutulu şişe düz blok, kapaksız şişe şişe biçimi). Doku: labels/<handle>~<n>.webp."""
    if not RULES.get("views"):
        return
    skip = RULES.get("noViews")
    for handle, entry in meta.items():
        if entry.get("parts") or (skip and re.search(skip, handle)):
            continue
        d = os.path.join(SRC, "images", handle)
        files = sorted(glob.glob(os.path.join(d, "*")), key=lambda f: int(os.path.basename(f).split(".")[0]))
        kinds = entry.get("kinds", "")
        hero = next((i for i, k in enumerate(kinds) if k in "TW"), None)
        if hero is None:
            continue
        views = {}
        for i, (f, k) in enumerate(zip(files, kinds)):
            if i == hero or k not in "TW":
                continue
            im = Image.open(f)
            F = fit(cutout(im, k), S)
            m = np.asarray(F)[..., 3] > 128
            if not m.any():
                continue
            # Şişe mi kutu mu: şişenin üstü (kapak ya da sprey başlığı) gövdeden belirgin dar.
            ys, xs = np.where(m)
            y0, y1 = ys.min(), ys.max()
            widths = m.sum(1)
            top = widths[y0 + int(0.06 * (y1 - y0))]
            flat = bool(top > 0.6 * widths.max())
            if flat:
                F = box_alpha(fit(cutout(im, k, box=True), S))
                if F is None:
                    print("  görünüm atlandı (kutu silüeti düzgün değil):", handle, i + 1)
                    continue
            else:
                F = largest_part(F)
                if solid(F) < 0.8:
                    print("  görünüm atlandı (silüet parçalı):", handle, i + 1)
                    continue
            info = shape_info(F)
            if not info:
                continue
            if not flat and not info.get("neck"):
                info["neck"] = view_neck(info["rows"])
            if flat:
                # Kutunun arkası: kenar renginde düz yüzey (satır şeritleri yok).
                back = Image.new("RGBA", F.size, tuple(info["edge"]) + (255,))
            else:
                back = plain_back(F, None, None)
            back.putalpha(F.transpose(Image.FLIP_LEFT_RIGHT).getchannel("A"))
            atlas = Image.new("RGBA", (2 * S, S))
            atlas.paste(F if flat else seal_front(F), (0, 0))
            atlas.paste(back, (S, 0))
            name = f"{handle}~{i + 1}.webp"
            atlas.save(os.path.join(OUT, "labels", name), quality=88, method=5)
            views[str(i)] = {"file": name, "flat": flat, **info}
        entry["views"] = views
        entry["hero"] = hero
        print("görünüm", handle, sorted(int(k) + 1 for k in views))


def main():
    meta = {}
    fronts, backs = {}, {}
    for d in sorted(glob.glob(os.path.join(SRC, "images", "*"))):
        handle = os.path.basename(d)
        if RULES.get("skip") and re.search(RULES["skip"], handle):
            continue
        files = sorted(glob.glob(os.path.join(d, "*")), key=lambda f: int(os.path.basename(f).split(".")[0]))
        if not files:
            continue
        ims = [Image.open(f) for f in files]
        kinds = [kind(im) for im in ims]
        if RULES.get("studio"):
            kinds = ["W" if k == "L" else k for k in kinds]
        os.makedirs(os.path.join(OUT, "web", handle), exist_ok=True)
        gallery = []
        for i, (im, k) in enumerate(zip(ims, kinds), 1):
            g = im.convert("RGBA")
            g.thumbnail((1200, 1200), Image.LANCZOS)
            if k == "T":
                bg = Image.new("RGBA", g.size, BG + (255,))
                bg.alpha_composite(g)
                g = bg
            path = f"foto/{handle}/{i}.webp"
            g.convert("RGB").save(os.path.join(OUT, "web", handle, f"{i}.webp"), quality=78, method=5)
            gallery.append(path)

        # Ana (ön) fotoğraf: ilk şeffaf ya da beyaz zeminli çekim.
        hero_i = next((i for i, k in enumerate(kinds) if k in "TW"), None)
        life_i = next((i for i, k in enumerate(kinds) if k == "L"), None)
        entry = {"gallery": gallery, "lifestyle": gallery[life_i] if life_i is not None else None, "kinds": "".join(kinds)}
        if hero_i is not None:
            front = cutout(ims[hero_i], kinds[hero_i])
            entry["aspect"] = round(front.height / front.width, 4)
            entry["color"] = dominant(front)
            c = front.copy()
            c.thumbnail((1200, 1200), Image.LANCZOS)
            os.makedirs(os.path.join(OUT, "cut"), exist_ok=True)
            c.save(os.path.join(OUT, "cut", f"{handle}.webp"), quality=86, method=5)
            entry["cut"] = f"cut/{handle}.webp"

            F = fit(front, S)
            # Arka yüz: silüeti ön yüzün aynasıyla örtüşen başka bir ürün çekimi.
            mirror = F.transpose(Image.FLIP_LEFT_RIGHT)
            back, best = None, 0.0
            for i, k in enumerate(kinds):
                if i == hero_i or k not in "TW" or RULES.get("backPhotos") is False:
                    continue
                cand = fit(cutout(ims[i], k), S)
                # Aynı ürünün başka renk seçeneği arka yüz sayılmaz (ör. lacivert çanta).
                if np.abs(np.array(dominant(cand)) - np.array(dominant(F))).sum() > 90:
                    continue
                iou = mask_iou(cand, mirror)
                # Aynı yüzün başka bir çekimi (ör. kapaksız) arka yüz değildir: baskı ön yüzle aynıysa atlanır.
                if same_face(cand, F):
                    continue
                if iou > best:
                    back, best = cand, iou
            if back is None or best < 0.86:
                back = None
                entry["back"] = False
            else:
                entry["back"] = True
            entry.update(shape_info(F))
            if RULES.get("glassBack"):
                # Renkli cam: yan yüzler parfümün rengini taşır (kenardaki beyaz parlama değil).
                fa = np.asarray(F)
                x0, y0, x1, y1 = RULES["glassBack"]["label"]
                reg = fa[int(0.45 * S):int(0.72 * S), int((x0 - 0.1) * S):int((x0 - 0.02) * S)]
                reg = reg[reg[..., 3] > 200][:, :3]
                if len(reg):
                    entry["edge"] = [int(v) for v in np.median(reg, 0)]
            entry["accent"] = accent_of(F, entry["color"])
            # Arka yarının alfa kanalı ön silüetin aynası: iki yüz aynı sınırda buluşur.
            # Boş kalan pikseller (silüet farkı) bulanık ayna ile doldurulur.
            # Arka fotoğraf ön yüzün aynası hizasında; yoksa metinli, yazısız-renkli arka.
            if RULES.get("glassBack"):
                fill = glass_back(F, handle)
            else:
                fill = plain_back(F, back.transpose(Image.FLIP_LEFT_RIGHT) if back is not None else None, back_text(handle))
            fill.putalpha(mirror.getchannel("A"))
            fronts[handle], backs[handle] = F, fill
            atlas = Image.new("RGBA", (2 * S, S))
            # Dönen gövdeli ürünler (düz bloklar hariç; kural <marka>-kurallar.json → foto.flat).
            flat = RULES.get("flat") and re.search(RULES["flat"], handle)
            atlas.paste(F if flat else seal_front(F), (0, 0))
            atlas.paste(fill, (S, 0))
            os.makedirs(os.path.join(OUT, "labels"), exist_ok=True)
            atlas.save(os.path.join(OUT, "labels", f"{handle}.webp"), quality=88, method=5)
        meta[handle] = entry
        print(handle, entry["kinds"], "arka" if entry.get("back") else "-")
    # Setler: kendi ürünlerinden yeniden kurulur (kutu ve zemin yok); her ürün 3B'de ayrı parça.
    sets = RULES.get("sets", {})
    for set_h, items in sets.items():
        if set_h.startswith("_") or set_h not in meta:
            continue
        # "handle#n": o ürünün n. fotoğrafı ayrı bir parça olarak kesilir (setin kendi çekimleri).
        for it in items:
            if "#" in it and it not in fronts:
                h, n = it.split("#")
                f = sorted(glob.glob(os.path.join(SRC, "images", h, f"{n}.*")))
                if not f:
                    continue
                im = Image.open(f[0])
                F = fit(cutout(im, kind(im)), S)
                fronts[it] = F
                fill = plain_back(F, None, None)
                fill.putalpha(F.transpose(Image.FLIP_LEFT_RIGHT).getchannel("A"))
                backs[it] = fill
        if any(i not in fronts for i in items):
            print("! set atlandı (eksik parça):", set_h)
            continue
        front, back, layers = compose_set(items, fronts, backs)
        atlas = Image.new("RGBA", (2 * S, S))
        atlas.paste(front, (0, 0))
        atlas.paste(back, (S, 0))
        atlas.save(os.path.join(OUT, "labels", f"{set_h}.webp"), quality=88, method=5)
        c = cutout(front, "T")
        c.thumbnail((1200, 1200), Image.LANCZOS)
        c.save(os.path.join(OUT, "cut", f"{set_h}.webp"), quality=86, method=5)
        e = meta[set_h]
        e["aspect"] = round(c.height / c.width, 4)
        e["color"] = dominant(front)
        e["accent"] = accent_of(front, e["color"])
        e["back"] = True
        e["parts"] = [{"handle": h.split("#")[0], **shape_info(layer)} for h, layer in layers]
        e["lifestyle"] = e["gallery"][0]  # kutulu set fotoğrafı üzerine gelince görünür
        print("set", set_h, len(items), "ürün")
    make_views(meta)
    json.dump(meta, open(os.path.join(OUT, "meta.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(len(meta), "ürün hazır")


if __name__ == "__main__":
    if "--views" in sys.argv:
        _meta_path = os.path.join(OUT, "meta.json")
        _meta = json.load(open(_meta_path, encoding="utf-8"))
        make_views(_meta)
        json.dump(_meta, open(_meta_path, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    else:
        main()
