# Marka yazısı için Cinzel SemiBold harf konturlarını çıkarır (index.html → BRAND_GLYPHS).
# Örtüşen konturlar birleştirilir (Cinzel serifleri ayrı kontur: birleştirilmezse pahlı harfte ek yerleri görünür).
# Gerekli: pip install fonttools skia-pathops
# Kullanım (proje klasöründen): python3 tools/brand_glyphs.py > glyphs.json
import json, os, sys
from fontTools.ttLib import TTFont
from fontTools.ttLib.removeOverlaps import removeOverlaps
from fontTools.pens.svgPathPen import SVGPathPen

TEXT = 'GARDEN  MOTORS' + 'MTG  |  ' + 'PRIVATE  COLLECTION'
f = TTFont(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'blender', 'assets', 'Cinzel-SemiBold.ttf'))
cmap = f.getBestCmap(); chars = sorted(set(TEXT)); names = [cmap[ord(c)] for c in chars]
removeOverlaps(f, glyphNames=names)
gs, hmtx = f.getGlyphSet(), f['hmtx']
out = {'upm': f['head'].unitsPerEm, 'cap': f['OS/2'].sCapHeight, 'g': {}}
for ch, gn in zip(chars, names):
    pen = SVGPathPen(gs, ntos=lambda v: ('%d' % v) if v == int(v) else ('%.1f' % v)); gs[gn].draw(pen)
    out['g'][ch] = [hmtx[gn][0], pen.getCommands()]
json.dump(out, sys.stdout, separators=(',', ':'))
