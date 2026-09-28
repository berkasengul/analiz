"""Ürün kartları için 3B görüntüler: sitenin kendi 3B modeli saydam zeminde çekilir.

Önce site derlenmiş olmalı (yeni-demo.py → demolar/<marka>-Netlify.zip). Araç zip'i geçici bir klasöre açar,
yerel sunucuda ?still=<n> sayfasını Playwright + Chromium ile açar, ürünü kırpar ve
markalar/<marka>-foto/render3d/<handle>.webp olarak kaydeder. Sonra aktarım ve derleme tekrarlanır:

    python3 demo-fabrikasi/yeni-demo.py demo-fabrikasi/markalar/turkan.json
    python3 demo-fabrikasi/araclar/kart-3b.py turkan
    python3 demo-fabrikasi/araclar/shopify-aktar.py turkan      # kart görselleri r3d/…
    python3 demo-fabrikasi/yeni-demo.py demo-fabrikasi/markalar/turkan.json

    python3 demo-fabrikasi/araclar/kart-3b.py turkan --stage     # sinematik sergi sahnesi → <marka>-foto/sahne/

--stage: ürün altın çerçeveli kemerli nişte, mermer kaidenin üstünde, spot ışığı altında (tam kare, 3:4).

Gerekenler: node + playwright (Chromium), Pillow.
"""
import json
import os
import subprocess
import sys
import tempfile
import zipfile

from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(HERE, "..", "..")
if len(sys.argv) < 2:
    sys.exit(__doc__)
SLUG = sys.argv[1]
MARKA = os.path.join(HERE, "..", "markalar")
STAGE = "--stage" in sys.argv
OUT = os.path.join(MARKA, f"{SLUG}-foto", "sahne" if STAGE else "render3d")

SHOT = r"""
const pw = (() => { try { return require('playwright'); } catch { return require(process.env.PLAYWRIGHT || '/opt/node22/lib/node_modules/playwright'); } })();
const [url, n, dir, stage] = process.argv.slice(2);
(async () => {
  const b = await pw.chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  for (let i = 0; i < +n; i++) {
    // Her ürün ayrı sekmede; dış istekler (yazı tipi vb.) çekimi bekletmesin diye kapalı.
    const p = await b.newPage(stage ? { viewport: { width: 600, height: 800 }, deviceScaleFactor: 1.5 } : { viewport: { width: 640, height: 800 }, deviceScaleFactor: 1 });
    await p.route((u) => !u.href.startsWith(url), (r) => r.abort());
    for (let k = 0; k < 10; k++) {
      try { await p.goto(`${url}/?still=${i}${stage ? '&stage=1' : ''}`, { waitUntil: 'domcontentloaded' }); break; } catch { await new Promise((r) => setTimeout(r, 500)); }
    }
    await p.waitForFunction(() => window.__still, null, { timeout: 180000 });
    const h = await p.evaluate(() => window.__still);
    await p.waitForTimeout(stage ? 800 : 0);
    await p.screenshot({ path: `${dir}/${h}.png`, omitBackground: !stage, timeout: 180000 });
    console.log(i, h);
    await p.close();
  }
  await b.close();
})();
"""


def main():
    cfg = json.load(open(os.path.join(MARKA, f"{SLUG}.json"), encoding="utf-8"))
    n = len(cfg["products"])
    tmp = tempfile.mkdtemp()
    zipfile.ZipFile(os.path.join(ROOT, "demolar", f"{SLUG}-Netlify.zip")).extractall(tmp)
    port = 5311
    srv = subprocess.Popen([sys.executable, "-m", "http.server", str(port), "--bind", "127.0.0.1", "--directory", tmp],
                           stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    shots = os.path.join(tmp, "_shots")
    os.makedirs(shots)
    js = os.path.join(tmp, "_shot.cjs")
    open(js, "w").write(SHOT)
    try:
        subprocess.run(["node", js, f"http://127.0.0.1:{port}", str(n), shots] + (["1"] if STAGE else []), check=True)
    finally:
        srv.terminate()
    os.makedirs(OUT, exist_ok=True)
    for f in sorted(os.listdir(shots)):
        if STAGE:
            Image.open(os.path.join(shots, f)).convert("RGB").save(os.path.join(OUT, f[:-4] + ".webp"), quality=84, method=5)
            continue
        im = Image.open(os.path.join(shots, f)).convert("RGBA")
        box = im.getchannel("A").point(lambda v: 255 if v > 8 else 0).getbbox()
        if not box:
            continue
        pad = 6
        im = im.crop((max(0, box[0] - pad), max(0, box[1] - pad), min(im.width, box[2] + pad), min(im.height, box[3] + pad)))
        im.save(os.path.join(OUT, f[:-4] + ".webp"), quality=88, method=5)
    print(len(os.listdir(OUT)), "kart görseli →", os.path.relpath(OUT, ROOT))


if __name__ == "__main__":
    main()
