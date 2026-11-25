# Ana sayfa açılış görseli: 3B çekimlerden (/tmp/hero_<id>.png) ürün dizisi → public/img/hero.webp
from PIL import Image, ImageDraw, ImageFilter
W, H, BASE = 1400, 1000, 950
# [id, boy, yatay merkez, taban kayması] arkadan öne
LAY = [('once-vatan', 600, 115, -40), ('gulumse', 600, 1285, -40), ('anka', 740, 330, -20), ('ocean', 740, 1070, -20),
       ('kerasus', 860, 700, 0), ('cam-aura', 410, 455, 16), ('cam-ocean', 400, 950, 18)]
out = Image.new('RGBA', (W, H), (0, 0, 0, 0))
for pid, h, cx, dy in LAY:
    im = Image.open(f'/tmp/hero_{pid}.png').convert('RGBA')
    im = im.crop(im.getbbox())
    w = round(im.width * h / im.height)
    im = im.resize((w, h), Image.LANCZOS)
    x, y = cx - w // 2, BASE + dy - h
    # temas gölgesi
    sh = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    ImageDraw.Draw(sh).ellipse((cx - w * 0.45, BASE + dy - 14, cx + w * 0.45, BASE + dy + 14), fill=(10, 40, 34, 110))
    out.alpha_composite(sh.filter(ImageFilter.GaussianBlur(12)))
    out.alpha_composite(im, (x, y))
out = out.crop(out.getbbox())
out.save('public/img/hero.webp', 'WEBP', quality=86, method=6)
print(out.size)
