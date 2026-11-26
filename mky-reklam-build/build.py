#!/usr/bin/env python3
"""MKY Reklam & Medya — statik site üretici.

Kullanım:  python3 build.py
İçerik:    data.py  (iletişim bilgileri, hizmetler, portfolyo)
Şablonlar: templates/
Çıktı:     ../mky-reklam-site/  (Netlify bu klasörü yayınlar)
"""
import os, time
from pathlib import Path
from jinja2 import Environment, FileSystemLoader, StrictUndefined
from data import SITE, CATS, CAT, ICONS, SERVICES, PROCESS, PROJECTS

ROOT = Path(__file__).parent
OUT = ROOT.parent / "mky-reklam-site"

WA_PATH = ("M16 3C8.8 3 3 8.8 3 16c0 2.3.6 4.5 1.7 6.5L3 29l6.7-1.7c1.9 1 4.1 1.6 6.3 1.6 7.2 0 13-5.8 13-13S23.2 3 16 3zm0 23.7"
           "c-2 0-4-.5-5.7-1.6l-.4-.2-4 1 1.1-3.9-.3-.4C5.6 19.9 5.1 18 5.1 16 5.1 10 10 5.2 16 5.2S26.8 10 26.8 16 22 26.7 16 26.7z"
           "m6-8c-.3-.2-1.9-1-2.2-1-.3-.1-.5-.2-.7.2-.2.3-.8 1-1 1.2-.2.2-.4.2-.7.1-.3-.2-1.4-.5-2.6-1.6-1-.9-1.6-1.9-1.8-2.3-.2-.3 0-.5.1-.7"
           "l.5-.6c.2-.2.2-.3.3-.6.1-.2 0-.4 0-.6l-1-2.4c-.3-.6-.5-.5-.7-.5h-.6c-.2 0-.6.1-.9.4-.3.3-1.2 1.2-1.2 2.9s1.2 3.3 1.4 3.6"
           "c.2.2 2.4 3.7 5.8 5.1 2.9 1.1 3.4.9 4.1.8.6-.1 1.9-.8 2.2-1.5.3-.7.3-1.4.2-1.5-.1-.2-.3-.3-.6-.4z")

env = Environment(loader=FileSystemLoader(ROOT / "templates"), undefined=StrictUndefined,
                  trim_blocks=True, lstrip_blocks=True)
counts = {k: sum(p["cat"] == k for p in PROJECTS) for k, _ in CATS}
env.globals.update(SITE=SITE, CATS=CATS, CAT=CAT, ICONS=ICONS, SERVICES=SERVICES, PROCESS=PROCESS,
                   PROJECTS=PROJECTS, counts=counts, WA_PATH=WA_PATH, ver=str(int(time.time())))

pages = []  # sitemap için


def render(tpl, path, **ctx):
    depth = path.count("/")
    ctx.setdefault("r", "../" * depth)
    ctx.setdefault("path", path)
    html = env.get_template(tpl).render(**ctx)
    dst = OUT / path
    dst.parent.mkdir(parents=True, exist_ok=True)
    dst.write_text(html, encoding="utf-8")
    if not path.startswith(("404", "tesekkurler")):
        pages.append(path)
    print("  ✓", path)


print("Sayfalar üretiliyor →", OUT)
featured = [p for p in PROJECTS if p.get("featured")][:6]
render("index.html", "index.html", page="home", title=SITE["name"], featured=featured,
       desc="Tabela, araç giydirme, web tasarım, sosyal medya ve dijital reklam. MKY Reklam & Medya markanızı sokaktan ekrana tek ekipte büyütür.")
render("hakkimizda.html", "hakkimizda.html", page="hakkimizda", title="Hakkımızda",
       desc="MKY Reklam & Medya: tasarım, üretim, montaj ve dijital pazarlamayı tek çatı altında birleştiren reklam ajansı.")
render("hizmetler.html", "hizmetler.html", page="hizmetler", title="Hizmetler",
       desc="Web tasarım, tabela, araç giydirme, sosyal medya yönetimi, dijital reklam, kurumsal kimlik ve video prodüksiyon hizmetleri.")
for s in SERVICES:
    related = [p for p in PROJECTS if p["cat"] in s["cats"]][:3]
    render("hizmet.html", f"hizmetler/{s['slug']}.html", page="hizmet", title=s["title"], s=s,
           related=related, desc=f"{s['title']}: {s['short']} {SITE['name']} ile ücretsiz keşif ve teklif.", og=f"work/{s['img']}")
render("portfolyo.html", "portfolyo.html", page="portfolyo", title="Portfolyo",
       desc="Web siteleri, ışıklı tabelalar, araç giydirme, billboard, kurumsal kimlik ve sosyal medya çalışmalarımız.")
for i, p in enumerate(PROJECTS):
    prev, nxt = PROJECTS[i - 1], PROJECTS[(i + 1) % len(PROJECTS)]
    similar = [q for q in PROJECTS if q["cat"] == p["cat"] and q is not p]
    similar += [q for q in PROJECTS if q["client"] == p["client"] and q is not p and q not in similar]
    similar += [q for q in PROJECTS if q is not p and q not in similar]
    render("proje.html", f"portfolyo/{p['slug']}.html", page="proje", title=p["title"], p=p, prev=prev,
           next=nxt, similar=similar[:3], desc=p["summary"], og=f"work/{p['images'][0][0]}")
render("iletisim.html", "iletisim.html", page="iletisim", title="İletişim",
       desc=f"{SITE['name']} iletişim: {SITE['phone']} · {SITE['email']} · {SITE['address']}")
render("teklif-al.html", "teklif-al.html", page="teklif", title="Teklif Al",
       desc="3 adımda ihtiyacınızı anlatın, 24 saat içinde ücretsiz ve şeffaf teklifinizi alın.")
render("simple.html", "tesekkurler.html", page="tesekkurler", title="Teşekkürler", desc="Mesajınız bize ulaştı.")
render("simple.html", "404.html", page="404", title="Sayfa bulunamadı", desc="Sayfa bulunamadı.", r="/")

# sitemap + robots + netlify
today = time.strftime("%Y-%m-%d")
urls = "\n".join(f"  <url><loc>{SITE['url']}/{'' if p == 'index.html' else p}</loc><lastmod>{today}</lastmod></url>" for p in pages)
(OUT / "sitemap.xml").write_text(f'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n{urls}\n</urlset>\n', encoding="utf-8")
(OUT / "robots.txt").write_text(f"User-agent: *\nAllow: /\nSitemap: {SITE['url']}/sitemap.xml\n", encoding="utf-8")
(OUT / "netlify.toml").write_text('[build]\n  publish = "."\n\n[[headers]]\n  for = "/assets/*"\n  [headers.values]\n    Cache-Control = "public, max-age=604800"\n', encoding="utf-8")

# paylaşım (Open Graph) görseli
og = OUT / "assets/img/og.jpg"
if not og.exists():
    from PIL import Image
    im = Image.new("RGB", (1200, 630), (104, 28, 32))
    logo = Image.open(OUT / "assets/logo.png").convert("RGBA")
    logo = logo.resize((840, int(840 * logo.height / logo.width)))
    im.paste(logo, ((1200 - logo.width) // 2, (630 - logo.height) // 2), logo)
    im.save(og, quality=90)
print(f"Tamam: {len(pages)} sayfa + sitemap.xml")
