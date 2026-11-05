# kullanım: python3 clean_still.py <render.py> <çıkış_klasörü> t:ad t:ad ...
import sys, os
src, outdir = sys.argv[1], sys.argv[2]; pairs = sys.argv[3:]
sys.argv = ['x', 'stills']
os.chdir(os.path.dirname(os.path.abspath(src))); sys.path.insert(0, os.path.dirname(os.path.abspath(src)))
g = {"__file__": os.path.abspath(src), "__name__": "clean"}
exec(open(src).read().split('if __name__ == "__main__":')[0], g)
g["captions"] = lambda *a, **k: None
g["year_card"] = lambda *a, **k: None
from PIL import Image
rd = g["Renderer"]()
for p in pairs:
    t, nm = p.split(":"); Image.fromarray(rd.rgba(int(float(t) * g["FPS"]))).convert("RGB").save(os.path.join(outdir, nm), quality=92); print(nm)
