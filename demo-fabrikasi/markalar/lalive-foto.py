"""Lalive: Shopify'dan çekilen ürün fotoğraflarını siteye hazırlar.

Girdi: lalive-shopify/ (araclar/shopify-cek.py çıktısı, orijinal boyutlu görseller)
Çıktı: lalive-foto/
    web/<ürün>/<n>.webp     galeri görselleri (en uzun kenar 1400 px, şeffaf olanlar açık zemine)
    cut/<ürün>.webp         ürünün kesilmiş (şeffaf zeminli) ana fotoğrafı: kartlarda
    labels/<ürün>.webp      3B doku atlası: sol yarı ön yüz, sağ yarı arka yüz (alfa = ürün silüeti)
    meta.json               ürün başına en/boy oranı, baskın renk, galeri, yaşam tarzı fotoğrafı

Kullanım: python3 demo-fabrikasi/markalar/lalive-foto.py
"""
import glob
import json
import re
import os

import cv2
import numpy as np
from PIL import Image, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, "lalive-shopify")
OUT = os.path.join(HERE, "lalive-foto")
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


def cutout(im, k):
    """RGBA ürün kesiti (beyaz zemin kenardan başlayarak şeffaflaştırılır)."""
    im = im.convert("RGBA")
    if k == "W":
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
    return {"axis": round(cx / S, 4), "rows": rows, "outline": outline, "edge": [int(v) for v in edge]}


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
HEIGHT = [(r"vucut-yagi|dus-jeli|losyon|kastil", 19), (r"lenf-masaj-aleti", 20), (r"at-kili", 22), (r"gunes-kremi", 16),
          (r"sac-bakim-suyu", 16), (r"bronz", 15), (r"yuz-misti", 14), (r"el-kremi", 13), (r"bakim-cantasi", 13),
          (r"sapka", 12), (r"sac-bakim-yagi|yuz-bakim-yagi|roll-on|kas-kirpik", 10), (r"dudak-balmi", 9.5),
          (r"kabak-lifi", 14), (r"kati-sabun", 7.5), (r"tarak", 6.5), (r"lenfatik-yuz", 6), (r"esansiyel", 7)]


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


_AKTAR = None


def back_text(handle):
    """Arka etiket metni markanın ürün sayfasından (lalive-shopify-aktar.py yardımcılarıyla)."""
    global _AKTAR
    import importlib.util
    import re
    if re.search(r"tote|atlet|t-shirt|sweatshirt|bandi|sapka|canta|firca|tarak|kabak|masaj-aleti|mug|set|seti|rituel|kutu|yazin|goz-bandi", handle):
        return None
    if _AKTAR is None:
        spec = importlib.util.spec_from_file_location("aktar", os.path.join(HERE, "lalive-shopify-aktar.py"))
        _AKTAR = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(_AKTAR)
        _AKTAR._tr = {p["handle"]: p for p in json.load(open(os.path.join(SRC, "products-tr.json"), encoding="utf-8"))}
    A = _AKTAR
    p = A._tr.get(handle)
    if not p:
        return None
    name, size = A.split_name(p["title"])
    ps = [x for x in A.paras(p["body_html"]) if len(x) > 30]
    desc = A.clip(A.lead(ps[0]) if ps else name, 170)
    usage = next((x for x in ps if re.search(r"uygula|kullan|masaj yap|sürün|sıkın", x, re.I) and x != ps[0]), None)
    chips = [A.TAGS[t][0] for t in p["tags"] if t in A.TAGS][:5]
    return {"name": name, "size": size, "desc": desc, "chips": chips, "usage": A.clip(usage, 150) if usage else None}


def main():
    meta = {}
    fronts, backs = {}, {}
    for d in sorted(glob.glob(os.path.join(SRC, "images", "*"))):
        handle = os.path.basename(d)
        files = sorted(glob.glob(os.path.join(d, "*")), key=lambda f: int(os.path.basename(f).split(".")[0]))
        if not files:
            continue
        ims = [Image.open(f) for f in files]
        kinds = [kind(im) for im in ims]
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
                if i == hero_i or k not in "TW":
                    continue
                cand = fit(cutout(ims[i], k), S)
                # Aynı ürünün başka renk seçeneği arka yüz sayılmaz (ör. lacivert çanta).
                if np.abs(np.array(dominant(cand)) - np.array(dominant(F))).sum() > 90:
                    continue
                iou = mask_iou(cand, mirror)
                if iou > best:
                    back, best = cand, iou
            if back is None or best < 0.86:
                back = None
                entry["back"] = False
            else:
                entry["back"] = True
            entry.update(shape_info(F))
            entry["accent"] = accent_of(F, entry["color"])
            # Arka yarının alfa kanalı ön silüetin aynası: iki yüz aynı sınırda buluşur.
            # Boş kalan pikseller (silüet farkı) bulanık ayna ile doldurulur.
            # Arka fotoğraf ön yüzün aynası hizasında; yoksa metinli, yazısız-renkli arka.
            fill = plain_back(F, back.transpose(Image.FLIP_LEFT_RIGHT) if back is not None else None, back_text(handle))
            fill.putalpha(mirror.getchannel("A"))
            fronts[handle], backs[handle] = F, fill
            atlas = Image.new("RGBA", (2 * S, S))
            # Dönen gövdeli ürünler (düz bloklar hariç; kural lalive-shopify-aktar.py FLAT ile aynı).
            flat = re.search(r"set|rituel|yazin|kutu|tote|canta|sapka|atlet|t-shirt|sweatshirt|bandi|firca|kabak|tarak|seti|kati-sabun", handle)
            atlas.paste(F if flat else seal_front(F), (0, 0))
            atlas.paste(fill, (S, 0))
            os.makedirs(os.path.join(OUT, "labels"), exist_ok=True)
            atlas.save(os.path.join(OUT, "labels", f"{handle}.webp"), quality=88, method=5)
        meta[handle] = entry
        print(handle, entry["kinds"], "arka" if entry.get("back") else "-")
    # Setler: kendi ürünlerinden yeniden kurulur (kutu ve zemin yok); her ürün 3B'de ayrı parça.
    sets = json.load(open(os.path.join(HERE, "lalive-setler.json"), encoding="utf-8"))
    for set_h, items in sets.items():
        if set_h.startswith("_") or set_h not in meta or any(i not in fronts for i in items):
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
        e["parts"] = [{"handle": h, **shape_info(layer)} for h, layer in layers]
        e["lifestyle"] = e["gallery"][0]  # kutulu set fotoğrafı üzerine gelince görünür
        print("set", set_h, len(items), "ürün")
    json.dump(meta, open(os.path.join(OUT, "meta.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(len(meta), "ürün hazır")


if __name__ == "__main__":
    main()
