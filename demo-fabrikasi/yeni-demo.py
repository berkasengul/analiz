"""Demo fabrikası: bir marka ayar dosyasından yeni 3B parfüm sitesi üretir.

Kullanım:
    python3 demo-fabrikasi/yeni-demo.py demo-fabrikasi/markalar/<marka>.json

Yaptıkları:
  1. hope-demo şablonunu demolar/<slug>/ klasörüne kopyalar (node_modules
     kopyalanmaz, şablondakine bağlanır).
  2. Ayar dosyasını src/content.json olarak yazar; sayfa başlığını günceller.
  3. Etiket dokularını üretir (docs/label-generator.py).
  4. Siteyi derler ve demolar/<slug>-Netlify.zip dosyasını hazırlar.

Ayar dosyasının biçimi için demo-fabrikasi/sablon.json ve README.md'ye bak.
"""
import json
import os
import shutil
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TEMPLATE = os.path.join(ROOT, "hope-demo")
OUT_ROOT = os.path.join(ROOT, "demolar")

SKIP = {"node_modules", "dist", ".git", "__pycache__"}
NPM = shutil.which("npm") or "npm"


def copy_template(dst):
    def ignore(folder, names):
        rel = os.path.relpath(folder, TEMPLATE)
        out = [n for n in names if n in SKIP]
        if rel == os.path.join("src", "assets", "labels"):
            out += [n for n in names if n.endswith(".jpg")]
        if rel == "docs":
            out += [n for n in names if n.endswith((".png", ".jpg")) or n == "reference"]
        return out

    if os.path.exists(dst):
        shutil.rmtree(dst)
    shutil.copytree(TEMPLATE, dst, ignore=ignore)
    try:
        os.symlink(os.path.join(TEMPLATE, "node_modules"), os.path.join(dst, "node_modules"), target_is_directory=True)
    except OSError:
        # Windows'ta sembolik bağ izni yoksa paketler demo klasörüne kurulur.
        print("→ Paketler kuruluyor (npm install)")
        subprocess.run([NPM, "install"], cwd=dst, check=True, stdout=subprocess.DEVNULL)


def check(cfg):
    need = ["slug", "meta", "brand", "labelBrand", "bottle", "products", "specs", "features", "ritual",
            "packs", "prices", "stockists", "story", "faqs", "ui"]
    missing = [k for k in need if k not in cfg]
    if missing:
        sys.exit(f"Ayar dosyasında eksik alanlar: {', '.join(missing)}")
    if len(cfg["features"]) != 4:
        sys.exit("features tam 4 hikâye kartı olmalı.")
    for i, p in enumerate(cfg["products"]):
        for k in ("name", "file", "color", "theme", "tagline", "notes", "description", "en", "label"):
            if k not in p:
                sys.exit(f"products[{i}] ({p.get('name', '?')}): '{k}' eksik.")
    for r in cfg["ritual"]:
        if r["flavor"] >= len(cfg["products"]):
            sys.exit("ritual.flavor ürün sayısından büyük olamaz.")


def main(path):
    cfg = json.load(open(path, encoding="utf-8"))
    check(cfg)
    slug = cfg["slug"]
    dst = os.path.join(OUT_ROOT, slug)
    os.makedirs(OUT_ROOT, exist_ok=True)
    print(f"→ Şablon kopyalanıyor: demolar/{slug}")
    copy_template(dst)

    content = os.path.join(dst, "src", "content.json")
    json.dump(cfg, open(content, "w", encoding="utf-8"), ensure_ascii=False, indent=2)

    index = os.path.join(dst, "index.html")
    html = open(index, encoding="utf-8").read()
    tmpl = json.load(open(os.path.join(TEMPLATE, "src", "content.json"), encoding="utf-8"))["meta"]
    for key in ("title", "description", "og"):
        html = html.replace(tmpl[key], cfg["meta"][key])
    open(index, "w", encoding="utf-8").write(html)

    if cfg.get("icon") == "leaf":
        open(os.path.join(dst, "public", "favicon.svg"), "w").write(
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect width="24" height="24" rx="6" fill="#16201a"/>'
            '<g fill="none" stroke="#e8dfc2" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">'
            '<path d="M5 20c4-4 8-9 13-16"/><path d="M9.5 15.5c-3 .2-4.8-1.3-5-3.6 2.8-.3 4.6.9 5 3.6ZM12.8 11.3c.2-3 2-4.6 4.3-4.6.1 2.8-1.3 4.5-4.3 4.6ZM14.8 8.6c-2.6-.8-3.5-2.6-3-4.6 2.6.6 3.6 2.4 3 4.6Z"/></g></svg>'
        )

    readme = os.path.join(dst, "README.md")
    open(readme, "w", encoding="utf-8").write(
        f"# {cfg['brand']['name']} · 3B konsept demo\n\n"
        f"> {cfg['brand']['disclaimer']}\n\n"
        "Demo fabrikasıyla (demo-fabrikasi/) üretildi. İçerik `src/content.json` dosyasında.\n\n"
        "```bash\nnpm install\nnpm run dev\n```\n"
    )

    # Katalog görselleri (markalar/<slug>-katalog/*.jpg → public/catalog/).
    shots = os.path.join(os.path.dirname(os.path.abspath(path)), f"{slug}-katalog")
    if os.path.isdir(shots):
        shutil.copytree(shots, os.path.join(dst, "public", "catalog"), dirs_exist_ok=True)

    # Markanın gerçek ürün fotoğrafları (markalar/<slug>-foto/, <slug>-foto.py ile hazırlanır):
    # galeri → public/foto, kesitler → public/cut, 3B doku atlasları → src/assets/labels.
    foto = os.path.join(os.path.dirname(os.path.abspath(path)), f"{slug}-foto")
    if os.path.isdir(foto):
        shutil.copytree(os.path.join(foto, "web"), os.path.join(dst, "public", "foto"), dirs_exist_ok=True)
        shutil.copytree(os.path.join(foto, "cut"), os.path.join(dst, "public", "cut"), dirs_exist_ok=True)
        if os.path.isdir(os.path.join(foto, "render3d")):  # kart görselleri: 3B modelden çekim (araclar/kart-3b.py)
            shutil.copytree(os.path.join(foto, "render3d"), os.path.join(dst, "public", "r3d"), dirs_exist_ok=True)
        if os.path.isdir(os.path.join(foto, "sahne")):  # kart sahneleri: 3B sergi (araclar/kart-3b.py --stage)
            shutil.copytree(os.path.join(foto, "sahne"), os.path.join(dst, "public", "sahne"), dirs_exist_ok=True)
        if os.path.isdir(os.path.join(foto, "fon")):  # ana sayfa sergisinin arka plan sahneleri (araclar/sahne-birlestir.py)
            shutil.copytree(os.path.join(foto, "fon"), os.path.join(dst, "public", "fon"), dirs_exist_ok=True, ignore=shutil.ignore_patterns("*.json"))
        used = {p["file"] for p in cfg["products"]} | {v["file"] for p in cfg["products"] for v in (p.get("views") or []) if v}
        for n in os.listdir(os.path.join(foto, "labels")):
            if n in used:
                shutil.copy(os.path.join(foto, "labels", n), os.path.join(dst, "src", "assets", "labels"))

    # Marka görselleri (logo vb.): markalar/<slug>-assets/*.png → public/brand/ ve docs/brand/.
    assets = os.path.join(os.path.dirname(os.path.abspath(path)), f"{slug}-assets")
    if os.path.isdir(assets):
        for sub in (("public", "brand"), ("docs", "brand")):
            out = os.path.join(dst, *sub)
            os.makedirs(out, exist_ok=True)
            for n in os.listdir(assets):
                if n.endswith(".png"):
                    shutil.copy(os.path.join(assets, n), out)

    print("→ Etiketler çiziliyor")
    labels = os.path.join(dst, "src", "assets", "labels")
    env = dict(os.environ, CONTENT=content)
    subprocess.run([sys.executable, os.path.join(dst, "docs", "label-generator.py"), labels], check=True, env=env)

    print("→ Site derleniyor")
    subprocess.run([NPM, "run", "build"], cwd=dst, check=True, stdout=subprocess.DEVNULL)
    zip_base = os.path.join(OUT_ROOT, f"{slug}-Netlify")
    shutil.make_archive(zip_base, "zip", os.path.join(dst, "dist"))
    shutil.rmtree(os.path.join(dst, "dist"))
    print(f"✓ Hazır: demolar/{slug}/  ve  demolar/{slug}-Netlify.zip")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    main(sys.argv[1])
