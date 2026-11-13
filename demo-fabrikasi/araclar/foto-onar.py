"""3B şişe dokusu onarımı (shopify-foto.py sonrası, isteğe bağlı).

Arka plan silme (rembg) bazen şeffaf camın içini de "zemin" sanıp siler: cam taban, boyun halkası delik kalır.
3B gövde bu deliklerden kopuk görünür (kapak havada, tabanda "ayak"). Bu araç:
- atlasın (labels/<ürün>.webp) iki yarısında da silüetin içindeki delikleri doldurur: her satırda en soldaki ile
  en sağdaki dolu piksel arası doldurulur, delikler çevredeki camdan boyanır (cv2.inpaint);
- şişe profilini (rows, outline, axis) dolu silüetten yeniden çıkarır;
- yassı şişede (flask) boyunu gövdenin başladığı satıra alır: kapak ve boyun halkası birlikte döner, gövde
  köşeli omuzla başlar (eğik "kulak" oluşmaz);
- yassı şişede kalınlık yüzlerinin rengini (edge) camdan alır (etiket bandının renginden değil).
Kullanım: python3 foto-onar.py <marka> [ürün ...]   → <marka>-foto/meta.json ve labels/ güncellenir.
Sonra shopify-aktar.py ve yeni-demo.py yeniden çalıştırılır."""
import importlib.util
import json
import os
import sys

import cv2
import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
brand = sys.argv[1]
only = set(sys.argv[2:])
# shopify-foto.py kurallarını (RULES) markadan okur; marka adı argv'de olmalı.
sys.argv = [sys.argv[0], brand]
spec = importlib.util.spec_from_file_location("sf", os.path.join(HERE, "shopify-foto.py"))
sf = importlib.util.module_from_spec(spec)
spec.loader.exec_module(sf)

FOTO = os.path.join(HERE, "..", "markalar", f"{brand}-foto")
meta = json.load(open(os.path.join(FOTO, "meta.json"), encoding="utf-8"))


def fill(half):
    a = np.asarray(half).copy()
    m = a[..., 3] > 128
    ys = np.where(m.any(1))[0]
    if not len(ys):
        return half, 0
    full = m.copy()
    for y in range(ys[0], ys[-1] + 1):
        xs = np.where(m[y])[0]
        if len(xs):
            full[y, xs[0] : xs[-1] + 1] = True
    holes = full & ~m
    n = int(holes.sum())
    if n:
        rgb = cv2.inpaint(np.ascontiguousarray(a[..., :3]), holes.astype(np.uint8) * 255, 6, cv2.INPAINT_TELEA)
        a[holes, :3] = rgb[holes]
        a[holes, 3] = 255
    return Image.fromarray(a), n


for h, entry in meta.items():
    if only and h not in only:
        continue
    path = os.path.join(FOTO, "labels", f"{h}.webp")
    if not os.path.exists(path) or not entry.get("rows"):
        continue
    at = Image.open(path).convert("RGBA")
    S = at.height
    front, nf = fill(at.crop((0, 0, S, S)))
    back, nb = fill(at.crop((S, 0, 2 * S, S))) if at.width >= 2 * S else (None, 0)
    if nf or nb:
        at.paste(front, (0, 0))
        if back is not None:
            at.paste(back, (S, 0))
        at.save(path, quality=90, method=5)
    sf.S = S
    info = sf.shape_info(front)
    neck = entry.get("neck")
    if neck:
        rows = info["rows"]
        N = len(rows)
        nz = [i for i, r in enumerate(rows) if r > 0]
        body = float(np.median(rows[nz[0] + (nz[-1] - nz[0]) // 2 : nz[-1] + 1]))
        start = next((i for i in range(int(neck * N), nz[-1]) if rows[i] >= 0.9 * body), None)
        if start is not None:
            neck = round(start / N, 4)
        # Kalınlık yüzleri: gövdedeki açık, doygunluğu düşük cam pikselleri.
        fa = np.asarray(front)
        y0, y1 = int(neck * S) + S // 40, int((nz[-1] + 1) / N * S) - S // 40
        reg = fa[y0:y1][fa[y0:y1, :, 3] > 200][:, :3].astype(int)
        glass = reg[(reg.max(1) - reg.min(1) < 24) & (reg.mean(1) > 150)]
        if len(glass) > 200:
            # Kalınlıkta cam ön yüzden biraz koyu görünür.
            info["edge"] = [int(v * 0.84) for v in np.median(glass, 0)]
    old = entry.get("neck")
    entry.update({k: info[k] for k in ("axis", "rows", "outline")})
    if neck:
        entry["neck"] = neck
        entry["edge"] = info["edge"]
    print(f"{h}: delik ön {nf} arka {nb} px · boyun {old} → {entry.get('neck')} · kenar {entry.get('edge')}")

json.dump(meta, open(os.path.join(FOTO, "meta.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
