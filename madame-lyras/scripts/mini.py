# Ürün küçük resimleri: public/tex/*.webp ve public/img/kit/*.webp → public/tex/mini (doku değişince yeniden çalıştırın)
from PIL import Image
import glob, os
os.makedirs('public/tex/mini', exist_ok=True)
for f in glob.glob('public/tex/*.webp'):
    b = os.path.basename(f)
    if b.endswith('-label.webp'): continue
    im = Image.open(f).convert('RGB'); im.thumbnail((180, 252), Image.LANCZOS); im.save('public/tex/mini/' + b, 'WEBP', quality=82)
for f in glob.glob('public/img/kit/*.webp'):
    b = os.path.basename(f)
    if '-cut' in b: continue
    im = Image.open(f).convert('RGB'); im.thumbnail((200, 200), Image.LANCZOS); im.save('public/tex/mini/kit-' + b, 'WEBP', quality=82)
