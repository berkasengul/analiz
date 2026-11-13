"""Satış hattı: yeni firma bul → mağazasından ürün çek → 3B demo site üret → yayınla → mail gönder.

Ekipler (zamanlanmış Claude oturumları) bu aracı kullanır; talimatları EKIP-BULMA.md ve EKIP-MAIL.md.
Kayıtlar: satis-hatti/firmalar.json (tek doğru kaynak). Ayarlar: satis-hatti/ayar.json.

    python3 satis-hatti/hat.py ekle <slug> --ad "Marka" --site marka.com [--sektor parfüm --sehir İstanbul
                                   --email info@marka.com --instagram @marka --kaynak URL --neden "..."]
    python3 satis-hatti/hat.py kontrol <slug>           platform (shopify / woo / ikas) + sitedeki e-postalar
    python3 satis-hatti/hat.py urunler <slug>           mağazadaki ürünlerin listesi (seçim için)
    python3 satis-hatti/hat.py cek <slug> h1 h2 h3 [h4] seçilen ürünleri indir → yukle/<slug>/ + taslak.json
    python3 satis-hatti/hat.py uret <slug>              marka.json hazırsa siteyi üret (fotodan-site.py)
    python3 satis-hatti/hat.py yayinla <slug>           Netlify'a gizli (arama motorlarına kapalı) demo olarak yükle
    python3 satis-hatti/hat.py mail <slug> <dosya.md>   mail taslağını kaydet (ilk satır "Konu: ...")
    python3 satis-hatti/hat.py gonder [--kuru]          sırası gelen ilk mailleri ve takipleri gönder (günlük sınırla)
    python3 satis-hatti/hat.py durum [<slug> <durum> [not]]   liste ya da elle durum değiştir
    python3 satis-hatti/hat.py panel                    panel verisini yaz (satis-hatti/panel-veri.json)

Durumlar: aday → cekildi → site_hazir → yayinda → mail_hazir → gonderildi → takip_gonderildi
          (+ cevap_geldi, ilgilenmiyor, elendi, cikti)
"""
import datetime as dt
import glob
import html
import json
import os
import re
import shutil
import subprocess
import sys
import unicodedata
import urllib.request
import uuid
import zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
HAT = os.path.join(ROOT, "satis-hatti")
DB = os.path.join(HAT, "firmalar.json")
AYAR = os.path.join(HAT, "ayar.json")
FAB = os.path.join(ROOT, "demo-fabrikasi")
YUKLE = os.path.join(ROOT, "site-fabrikasi", "yukle")
UA = {"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36"}
TZ = dt.timezone(dt.timedelta(hours=3))  # İstanbul
SIRA = ["aday", "cekildi", "site_hazir", "yayinda", "mail_hazir", "gonderildi", "takip_gonderildi"]
SON = {"cevap_geldi", "ilgilenmiyor", "elendi", "cikti"}


# ---------- kayıtlar ----------

def now():
    return dt.datetime.now(TZ)


def load():
    return json.load(open(DB, encoding="utf-8")) if os.path.exists(DB) else []


def save(rows):
    json.dump(rows, open(DB, "w", encoding="utf-8"), ensure_ascii=False, indent=1)


def ayar():
    return json.load(open(AYAR, encoding="utf-8"))


def find(rows, slug):
    for r in rows:
        if r["id"] == slug:
            return r
    sys.exit(f"! kayıt yok: {slug}")


def log(r, olay, durum=None):
    if durum:
        r["durum"] = durum
    r.setdefault("gecmis", []).append({"t": now().isoformat(timespec="minutes"), "olay": olay})
    print(f"  {r['id']}: {olay}")


def norm(s):
    s = unicodedata.normalize("NFKD", s.lower().replace("ı", "i")).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]", "", s)


def domain(url):
    return re.sub(r"^(https?://)?(www\.)?", "", url or "").split("/")[0].lower()


def bilinen():
    out = set()
    for line in open(os.path.join(HAT, "bilinen.txt"), encoding="utf-8"):
        line = line.strip()
        if line and not line.startswith("#"):
            out.add(norm(line.split("(")[0]))
            out.add(norm(domain(line).split(".")[0]) if "." in line else norm(line))
    for p in glob.glob(os.path.join(FAB, "markalar", "*.json")):
        out.add(norm(os.path.basename(p).split("-")[0].split(".")[0]))
    if os.path.exists(os.path.join(HAT, "cikanlar.txt")):  # bir daha yazılmasın diyenler
        for line in open(os.path.join(HAT, "cikanlar.txt"), encoding="utf-8"):
            if line.strip():
                out.add(norm(line.strip()))
                out.add(norm(line.strip().split("@")[-1].split(".")[0]))
    out.discard("")
    return out


def get(url, raw=False, timeout=25):
    with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=timeout) as r:
        data = r.read()
    return data if raw else data.decode("utf-8", "replace")


def args(argv):
    """--anahtar değer çiftleri"""
    out, rest, i = {}, [], 0
    while i < len(argv):
        if argv[i].startswith("--"):
            k = argv[i][2:]
            if i + 1 < len(argv) and not argv[i + 1].startswith("--"):
                out[k] = argv[i + 1]
                i += 2
            else:
                out[k] = True
                i += 1
        else:
            rest.append(argv[i])
            i += 1
    return out, rest


# ---------- 1. bulma ekibi ----------

def ekle(slug, o):
    rows = load()
    assert re.fullmatch(r"[a-z0-9-]+", slug), "slug: küçük harf, rakam, tire"
    site = domain(o.get("site", ""))
    known = bilinen()
    keys = {norm(o.get("ad", "")), norm(slug), norm(site.split(".")[0]) if site else ""} - {""}
    dup = [r["id"] for r in rows if r["id"] == slug or (site and domain(r.get("site")) == site) or norm(r["ad"]) == norm(o.get("ad", ""))]
    if dup:
        sys.exit(f"! zaten listede: {dup[0]}")
    if keys & known:
        sys.exit(f"! daha önce çalışılmış marka (bilinen.txt / markalar): {', '.join(keys & known)}")
    r = {"id": slug, "ad": o.get("ad", slug), "site": site, "sektor": o.get("sektor", ""), "sehir": o.get("sehir", ""),
         "email": o.get("email", ""), "instagram": o.get("instagram", ""), "kaynak": o.get("kaynak", ""),
         "neden": o.get("neden", ""), "platform": "", "demo_url": "", "durum": "aday", "eklendi": now().isoformat(timespec="minutes")}
    rows.append(r)
    log(r, "aday olarak eklendi")
    save(rows)


EMAIL_RX = re.compile(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}")
KOTU_MAIL = re.compile(r"(example|sentry|wixpress|domain|email|\.png|\.jpg|\.webp|\.svg|@2x|shopify|ikas|sentry-next|yourname|isim)", re.I)


def kontrol(slug):
    rows = load()
    r = find(rows, slug)
    base = f"https://{r['site']}"
    plat = ""
    try:
        j = json.loads(get(f"{base}/products.json?limit=1"))
        if "products" in j:
            plat = "shopify"
    except Exception:
        pass
    if not plat:
        try:
            j = json.loads(get(f"{base}/wp-json/wc/store/v1/products?per_page=1"))
            if isinstance(j, list):
                plat = "woo"
        except Exception:
            pass
    # Sayfa listesi: sitemap (Shopify sitemap_pages, ikas pages.xml, WordPress page-sitemap) + bilinen adresler.
    # Türkiye'de mesafeli satış sözleşmesi / KVKK metni satıcının e-postasını yazmak zorunda: en sağlam kaynak.
    urls = [base + x for x in ["", "/iletisim", "/pages/iletisim", "/pages/contact", "/contact", "/bize-ulasin"]]
    for sm in ["/sitemap.xml", "/pages.xml", "/page-sitemap.xml", "/wp-sitemap-posts-page-1.xml"]:
        try:
            locs = re.findall(r"<loc>([^<]+)</loc>", get(base + sm, timeout=15))
        except Exception:
            continue
        for l in locs:
            l = html.unescape(l)
            if "sitemap_pages" in l or l.endswith("pages.xml"):
                try:
                    locs += re.findall(r"<loc>([^<]+)</loc>", get(l, timeout=15))
                except Exception:
                    pass
            elif re.search(r"iletisim|contact|mesafeli|kvkk|uyelik|bilgilendirme|sss|sik-sorulan|hakkimizda|about|gizlilik|privacy|kunye", l, re.I) and "/en/" not in l:
                urls.append(l)
    pages = {}
    for u in list(dict.fromkeys(urls))[:16]:
        try:
            pages[u] = get(u, timeout=15)
        except Exception:
            continue
    if not plat and any("ikas" in h.lower() and "__NEXT_DATA__" in h for h in pages.values()):
        plat = "ikas"
    mails = []
    for h in pages.values():
        for m in EMAIL_RX.findall(html.unescape(h).replace("\\u0040", "@").replace("&#64;", "@")):
            m = re.sub(r"^(u00[0-9a-f]{2})+", "", m.strip(".").lower())
            if not KOTU_MAIL.search(m) and m not in mails:
                mails.append(m)
    ig = re.findall(r"instagram\.com/([A-Za-z0-9_.]+)", " ".join(pages.values()))
    tel = re.findall(r"(?:\+?90[\s.-]?)?\(?0?(5\d{2})\)?[\s.-]?(\d{3})[\s.-]?(\d{2})[\s.-]?(\d{2})", " ".join(html.unescape(h) for h in pages.values()))
    if tel and not r.get("telefon"):
        r["telefon"] = "90" + "".join(tel[0])  # WhatsApp için cep numarası
    r["platform"] = plat or "bilinmiyor"
    r["bulunan_mailler"] = mails[:6]
    if not r.get("email"):
        same = [m for m in mails if domain(m.split("@")[1]) == r["site"]]
        mails.sort(key=lambda m: (m not in same, not re.match(r"(info|iletisim|hello|merhaba|contact|destek|support|satis|sales)@", m)))
        same.sort(key=lambda m: not re.match(r"(info|iletisim|hello|merhaba|contact|satis|sales)@", m))
        r["email"] = (same or mails or [""])[0]
    if not r.get("instagram") and ig:
        r["instagram"] = "@" + next((x for x in ig if x.lower() not in ("p", "reel", "explore")), ig[0]).strip(".")
    log(r, f"kontrol: platform={r['platform']} · e-posta={r['email'] or 'yok'} · sitede: {', '.join(mails[:4]) or '-'}")
    if r["platform"] == "bilinmiyor":
        log(r, "desteklenen mağaza altyapısı yok (shopify/woo/ikas) → elendi", "elendi")
    elif not r["email"]:
        log(r, "sitede e-posta yok → elendi", "elendi")
    save(rows)


def urunler(slug):
    r = find(load(), slug)
    base = f"https://{r['site']}"
    if r["platform"] == "shopify":
        ps = json.loads(get(f"{base}/products.json?limit=250"))["products"]
        for p in ps:
            v = p["variants"][0] if p["variants"] else {}
            print(f"{p['handle']}\t{p['title']}\t{p.get('product_type', '')}\tgörsel:{len(p['images'])}\tstok:{'var' if v.get('available', True) else 'yok'}")
    elif r["platform"] == "woo":
        page = 1
        while page < 6:
            ps = json.loads(get(f"{base}/wp-json/wc/store/v1/products?per_page=100&page={page}"))
            if not ps:
                break
            for p in ps:
                print(f"{p['slug']}\t{html.unescape(p['name'])}\t{','.join(c['name'] for c in p.get('categories', []))}\tgörsel:{len(p.get('images', []))}")
            page += 1
    elif r["platform"] == "ikas":
        xml = get(f"{base}/products.xml")
        for u in re.findall(r"<loc>([^<]+)</loc>", xml)[:400]:
            print(u.rstrip("/").split("/")[-1] + "\t" + u)
    else:
        sys.exit("! platform yok; önce: hat.py kontrol " + slug)


def strip_html(h):
    t = re.sub(r"<(script|style).*?</\1>", "", h or "", flags=re.S)
    t = re.sub(r"<br\s*/?>|</p>|</li>|</h\d>", "\n", t)
    t = html.unescape(re.sub(r"<[^>]+>", " ", t))
    return re.sub(r"[ \t]+", " ", re.sub(r"\n\s*\n+", "\n", t)).strip()


def cek(slug, handles):
    rows = load()
    r = find(rows, slug)
    tool = {"shopify": "shopify-cek.py", "woo": "woo-cek.py", "ikas": "ikas-cek.py"}[r["platform"]]
    only = "^(" + "|".join(re.escape(h) for h in handles) + ")$"
    cmd = [sys.executable, os.path.join(FAB, "araclar", tool), r["site"], slug, "--only", only]
    if r["platform"] == "ikas":
        cmd.append("--pages")
    subprocess.run(cmd, cwd=ROOT, check=True, timeout=900)
    shop = os.path.join(FAB, "markalar", f"{slug}-shopify")
    ps = {p["handle"]: p for p in json.load(open(os.path.join(shop, "products-tr.json"), encoding="utf-8"))}
    en = {}
    if os.path.exists(os.path.join(shop, "products-en.json")):
        en = {p["handle"]: p for p in json.load(open(os.path.join(shop, "products-en.json"), encoding="utf-8"))}
    dst = os.path.join(YUKLE, slug)
    os.makedirs(dst, exist_ok=True)
    for f in os.listdir(dst):  # önceki çekimden kalan fotoğraflar (marka.json kalır)
        if f.rsplit(".", 1)[-1].lower() in ("jpg", "jpeg", "png", "webp"):
            os.remove(os.path.join(dst, f))
    taslak = {"ad": r["ad"], "website": "https://" + r["site"], "email": r["email"], "instagram": r["instagram"],
              "sehir": r["sehir"], "sektor": r["sektor"], "urunler": []}
    for h in handles:
        if h not in ps:
            print("  ! ürün bulunamadı:", h)
            continue
        p = ps[h]
        imgs = sorted(glob.glob(os.path.join(shop, "images", h, "*")), key=lambda x: int(re.sub(r"\D", "", os.path.basename(x)) or 0))
        photos = []
        for n, im in enumerate(imgs[:3], 1):
            name = f"{h}{'' if n == 1 else '-' + str(n)}{os.path.splitext(im)[1]}"
            shutil.copy(im, os.path.join(dst, name))
            photos.append(name)
        url = p.get("permalink") or (f"https://{r['site']}/{h}" if r["platform"] == "ikas" else f"https://{r['site']}/products/{h}")
        e = en.get(h, {})
        taslak["urunler"].append({"handle": h, "ad": p["title"], "ad_en": e.get("title", ""), "fotograflar": photos, "url": url,
                                  "tur": p.get("product_type", ""), "aciklama": strip_html(p.get("body_html"))[:1500],
                                  "aciklama_en": strip_html(e.get("body_html"))[:800]})
    json.dump(taslak, open(os.path.join(dst, "taslak.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    log(r, f"{len(taslak['urunler'])} ürün çekildi → site-fabrikasi/yukle/{slug}/taslak.json", "cekildi")
    save(rows)


def uret(slug):
    rows = load()
    r = find(rows, slug)
    M = json.load(open(os.path.join(YUKLE, slug, "marka.json"), encoding="utf-8"))
    assert not M.get("fictional"), "gerçek marka: fictional olmamalı"
    assert all(p.get("url") for p in M["products"]), "gerçek markada her ürünün url'si (mağaza sayfası) olmalı"
    assert all(not p.get("price") for p in M["products"]), "fiyat yok"
    subprocess.run([sys.executable, os.path.join(ROOT, "site-fabrikasi", "fotodan-site.py"), slug], cwd=ROOT, check=True, timeout=1200)
    out = os.path.join(ROOT, "site-fabrikasi", "cikti", slug)
    ok = os.path.exists(os.path.join(out, "onizleme_0.jpg"))
    log(r, "site üretildi" + ("" if ok else " (önizleme yok, kontrol et)"), "site_hazir")
    save(rows)


# ---------- 2. yayın ----------

def netlify(method, path, data=None, ctype="application/json"):
    tok = os.environ.get("NETLIFY_AUTH_TOKEN", "proxy-injected")  # anahtar ortamda ya da ağ vekilinde
    req = urllib.request.Request("https://api.netlify.com/api/v1" + path, data=data, method=method,
                                 headers={"Authorization": f"Bearer {tok}", "Content-Type": ctype, "User-Agent": "satis-hatti"})
    with urllib.request.urlopen(req, timeout=300) as res:
        return json.loads(res.read() or b"{}")


def yayinla(slug):
    rows = load()
    r = find(rows, slug)
    src = os.path.join(ROOT, "demolar", f"{slug}-Netlify.zip")
    tmp = os.path.join(HAT, ".tmp")
    os.makedirs(tmp, exist_ok=True)
    zp = os.path.join(tmp, f"{slug}.zip")
    with zipfile.ZipFile(src) as zi, zipfile.ZipFile(zp, "w", zipfile.ZIP_DEFLATED) as zo:
        for it in zi.infolist():
            if it.filename != "_headers":
                zo.writestr(it, zi.read(it))
        # Demo yalnızca markaya özel: arama motorlarına kapalı.
        zo.writestr("_headers", "/*\n  X-Robots-Tag: noindex, nofollow\n")
    site = r.get("netlify_id")
    if not site:
        s = netlify("POST", "/sites", json.dumps({"name": f"{slug}-3b-{uuid.uuid4().hex[:6]}"}).encode())
        site = r["netlify_id"] = s["id"]
    d = netlify("POST", f"/sites/{site}/deploys", open(zp, "rb").read(), "application/zip")
    url = d.get("ssl_url") or d.get("url") or ""
    url = re.sub(r"https://[0-9a-f]+--", "https://", url)
    r["demo_url"] = url
    log(r, f"yayında: {url}", "yayinda")
    if r.get("mail_taslak"):
        mail_hazir(r)
    save(rows)


# ---------- 3. mail ekibi ----------

FIYAT = re.compile(r"(\d[\d.,]*\s*(₺|tl\b|usd|\$|€|lira))|((₺|\$|€)\s*\d)", re.I)


def mail_kaydet(slug, path):
    rows = load()
    r = find(rows, slug)
    A = ayar()
    text = open(path, encoding="utf-8").read().strip()
    first, body = text.split("\n", 1)
    assert first.lower().startswith("konu:"), "ilk satır 'Konu: ...' olmalı"
    konu, body = first.split(":", 1)[1].strip(), body.strip()
    hatalar = []
    if "{demo}" not in body and not (r.get("demo_url") and r["demo_url"] in body):
        hatalar.append("metinde {demo} yer tutucusu yok")
    if FIYAT.search(body + konu):
        hatalar.append("fiyat geçiyor")
    if len(body.split()) > 170:
        hatalar.append(f"çok uzun ({len(body.split())} kelime; en çok 170)")
    if not r.get("email"):
        hatalar.append("alıcı e-postası yok")
    if hatalar:
        sys.exit("! mail kaydedilmedi: " + "; ".join(hatalar))
    r["mail_taslak"] = {"konu": konu, "metin": body, "hazirlandi": now().isoformat(timespec="minutes")}
    if r.get("demo_url"):
        mail_hazir(r)
    else:
        log(r, f"mail taslağı kaydedildi (yayından sonra gönderime hazır olur): {konu}")
    save(rows)


def mail_hazir(r):
    t = r["mail_taslak"]
    r["mail"] = {"konu": t["konu"], "metin": t["metin"].replace("{demo}", r["demo_url"]), "hazirlandi": t["hazirlandi"]}
    log(r, f"mail hazır: {t['konu']}", "mail_hazir")


def imza(A):
    return "\n\n" + "\n".join(A["imza"]) + "\n\n" + A["cikis_notu"]


def takip_metni(r, A):
    return (f"Merhaba,\n\nGeçen hafta {r['ad']} için hazırladığım 3B site demosunu göndermiştim, kısa bir hatırlatma: "
            f"{r['demo_url']}\n\nİlginizi çekerse 10 dakikalık bir görüntülü görüşmede canlı gösterebilirim; "
            f"çekmezse bu son mesajım.")


def resend(A, to, konu, metin):
    body = {"from": A["gonderen"], "to": [to], "subject": konu, "text": metin,
            "html": "<div style=\"font-family:Arial,sans-serif;font-size:15px;line-height:1.55;color:#222\">" +
                    re.sub(r"(https?://\S+)", r'<a href="\1">\1</a>', html.escape(metin)).replace("\n", "<br>") + "</div>",
            "reply_to": A["cevap_adresi"],
            "headers": {"List-Unsubscribe": f"<mailto:{A['cevap_adresi']}?subject=cikis>"}}
    tok = os.environ.get("RESEND_API_KEY", "proxy-injected")
    req = urllib.request.Request("https://api.resend.com/emails", data=json.dumps(body).encode(), method="POST",
                                 headers={"Authorization": f"Bearer {tok}", "Content-Type": "application/json", "User-Agent": "satis-hatti"})
    with urllib.request.urlopen(req, timeout=60) as res:
        return json.loads(res.read()).get("id", "")


def gonder(kuru=False):
    rows, A = load(), ayar()
    if A.get("gonderim") == "elle":
        sys.exit("gönderim elle: mailler panelden Gmail ile gönderiliyor (ayar.json → gonderim)")
    kuru = kuru or A.get("kuru", True)
    t = now()
    if not kuru and (t.weekday() > 4 or not (A["saat"][0] <= t.hour < A["saat"][1])):
        sys.exit(f"gönderim saati değil ({t:%a %H:%M}); hafta içi {A['saat'][0]}–{A['saat'][1]}")
    bugun = t.date().isoformat()
    sayac = sum(1 for r in rows for g in r.get("gonderimler", []) if g["t"].startswith(bugun) and not g.get("kuru"))
    kalan = A["gunluk_limit"] - sayac
    cik = bilinen()
    is_ = []
    for r in rows:
        if r["durum"] == "mail_hazir":
            is_.append((r, "ilk", r["mail"]["konu"], r["mail"]["metin"]))
        elif r["durum"] == "gonderildi" and A.get("takip_gun"):
            ilk = dt.datetime.fromisoformat(next(g["t"] for g in r["gonderimler"] if g["tur"] == "ilk" and not g.get("kuru")))
            if (t - ilk).days >= A["takip_gun"]:
                is_.append((r, "takip", "Re: " + r["mail"]["konu"], takip_metni(r, A)))
    print(f"sırada {len(is_)} mail · bugün kalan hak {kalan}{' · KURU (gönderilmez)' if kuru else ''}")
    for r, tur, konu, metin in is_[:max(kalan, 0)]:
        if norm(r["email"]) in cik or norm(r["email"].split("@")[-1].split(".")[0]) in cik:
            log(r, "çıkış listesinde → gönderilmedi", "cikti")
            continue
        full = metin + imza(A)
        if kuru:
            print(f"\n--- {r['email']} · {konu}\n{full}\n")
            r.setdefault("gonderimler", []).append({"t": now().isoformat(timespec="minutes"), "tur": tur, "kuru": True})
            continue
        mid = resend(A, r["email"], konu, full)
        r.setdefault("gonderimler", []).append({"t": now().isoformat(timespec="minutes"), "tur": tur, "id": mid})
        log(r, f"{tur} mail gönderildi → {r['email']}", "gonderildi" if tur == "ilk" else "takip_gonderildi")
    save(rows)


# ---------- durum / panel ----------

def durum(o, rest):
    rows = load()
    if rest:
        r = find(rows, rest[0])
        log(r, "elle: " + (" ".join(rest[2:]) or rest[1]), rest[1])
        if rest[1] in ("gonderildi", "takip_gonderildi"):  # çalışan Gmail'den gönderdi (panelde "Gönderdim")
            r.setdefault("gonderimler", []).append({"t": now().isoformat(timespec="minutes"),
                                                    "tur": "ilk" if rest[1] == "gonderildi" else "takip", "elle": True})
        if rest[1] == "cikti":
            open(os.path.join(HAT, "cikanlar.txt"), "a", encoding="utf-8").write(r["email"] + "\n")
        save(rows)
        return
    for r in rows:
        print(f"{r['durum']:<16} {r['id']:<22} {r['email']:<32} {r.get('demo_url', '')}")


def panel():
    rows, A = load(), ayar()
    out = []
    t = now()
    for r in rows:
        ek = {}
        if r.get("mail"):  # çalışanın Gmail'de açacağı tam metin (imza ve çıkış notuyla)
            ek["mail_tam"] = r["mail"]["metin"] + imza(A)
        ilk = [g for g in r.get("gonderimler", []) if g["tur"] == "ilk" and not g.get("kuru")]
        if r["durum"] == "gonderildi" and ilk and A.get("takip_gun") and \
                (t - dt.datetime.fromisoformat(ilk[0]["t"])).days >= A["takip_gun"]:
            ek |= {"takip_hazir": True, "takip_konu": "Re: " + r["mail"]["konu"], "takip_tam": takip_metni(r, A) + imza(A)}
        out.append(ek | {k: r.get(k) for k in ("id", "ad", "site", "sektor", "sehir", "email", "telefon", "instagram", "platform", "durum", "demo_url", "neden", "eklendi")} |
                   {"mail_konu": (r.get("mail") or r.get("mail_taslak") or {}).get("konu", ""),
                    "mail_metin": (r.get("mail") or r.get("mail_taslak") or {}).get("metin", ""),
                    "gonderimler": r.get("gonderimler", []), "gecmis": r.get("gecmis", [])[-8:]})
    data = {"guncellendi": now().isoformat(timespec="minutes"), "ayar": {k: v for k, v in ayar().items() if k in ("gunluk_limit", "takip_gun", "kuru", "gonderim")},
            "firmalar": out}
    json.dump(data, open(os.path.join(HAT, "panel-veri.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    # Panelin veritabanına yazılacak belgeler (ArtifactData batch → file_path): .panel/firmalar/<id>.json, .panel/ozet.json
    d = os.path.join(HAT, ".panel", "firmalar")
    shutil.rmtree(os.path.join(HAT, ".panel"), ignore_errors=True)
    os.makedirs(d)
    for f in out:
        json.dump({k: v for k, v in f.items() if k != "id"}, open(os.path.join(d, f["id"] + ".json"), "w", encoding="utf-8"), ensure_ascii=False)
    json.dump({"guncellendi": data["guncellendi"], "ayar": data["ayar"]}, open(os.path.join(HAT, ".panel", "ozet.json"), "w", encoding="utf-8"), ensure_ascii=False)
    print(f"panel-veri.json + .panel/: {len(out)} firma")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    cmd, (o, rest) = sys.argv[1], args(sys.argv[2:])
    if cmd == "ekle":
        ekle(rest[0], o)
    elif cmd == "kontrol":
        kontrol(rest[0])
    elif cmd == "urunler":
        urunler(rest[0])
    elif cmd == "cek":
        cek(rest[0], rest[1:])
    elif cmd == "uret":
        uret(rest[0])
    elif cmd == "yayinla":
        yayinla(rest[0])
    elif cmd == "mail":
        mail_kaydet(rest[0], rest[1])
    elif cmd == "gonder":
        gonder(bool(o.get("kuru")))
    elif cmd == "durum":
        durum(o, rest)
    elif cmd == "panel":
        panel()
    else:
        sys.exit(__doc__)
