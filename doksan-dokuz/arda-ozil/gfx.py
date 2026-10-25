"""Grafik altyapısı: renkler, fontlar, yazı sprite'ları, arka plan, efektler, geçişler."""
import math
import os
import random
from functools import lru_cache
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

W, H = 1920, 1080
FPS = 30

FONT_DIR = Path(os.environ.get("FONT_DIR", Path(__file__).parent / "fonts"))

# Karga Zihni paleti: koyu zemin, sıcak sarı, koyu kırmızı
BG = (12, 12, 14)
YELLOW = (244, 190, 58)
RED = (196, 32, 44)
WHITE = (243, 240, 232)
GREY = (138, 136, 130)
DARK = (26, 26, 30)
COLORS = {"yellow": YELLOW, "red": RED, "white": WHITE, "grey": GREY}


# ---------------------------------------------------------------- easing
def clamp(x, a=0.0, b=1.0):
    return a if x < a else b if x > b else x


def ease_out(x):
    x = clamp(x)
    return 1 - (1 - x) ** 3


def ease_in_out(x):
    x = clamp(x)
    return 4 * x ** 3 if x < 0.5 else 1 - (-2 * x + 2) ** 3 / 2


def ease_back(x, s=1.6):
    x = clamp(x)
    return 1 + (s + 1) * (x - 1) ** 3 + s * (x - 1) ** 2


def prog(t, t0, d=0.45):
    return clamp((t - t0) / d)


# ---------------------------------------------------------------- fonts / text
@lru_cache(maxsize=64)
def font(name: str, size: int):
    files = {"display": "Anton-Regular.ttf", "bebas": "BebasNeue-Regular.ttf", "body": "Oswald-VF.ttf"}
    f = ImageFont.truetype(str(FONT_DIR / files[name]), size)
    if name == "body":
        try:
            f.set_variation_by_name("Bold")
        except Exception:
            pass
    return f


@lru_cache(maxsize=512)
def text_sprite(text: str, fname: str, size: int, color=WHITE, glow=0, tracking=0, shadow=True):
    """Yazıyı bir kez çizip RGBA sprite olarak önbelleğe alır (glow + gölge dahil)."""
    f = font(fname, size)
    if tracking:
        widths = [f.getlength(c) + tracking for c in text]
        tw = int(sum(widths) - tracking) if text else 1
    else:
        tw = int(f.getlength(text)) if text else 1
    asc, desc = f.getmetrics()
    th = asc + desc
    pad = max(12, glow * 3)
    im = Image.new("RGBA", (tw + pad * 2, th + pad * 2), (0, 0, 0, 0))
    mask = Image.new("L", im.size, 0)
    md = ImageDraw.Draw(mask)
    if tracking:
        x = pad
        for c, w_ in zip(text, widths):
            md.text((x, pad), c, font=f, fill=255)
            x += w_
    else:
        md.text((pad, pad), text, font=f, fill=255)
    if shadow:
        sh = mask.filter(ImageFilter.GaussianBlur(size * 0.06 + 2))
        shadow_layer = Image.new("RGBA", im.size, (0, 0, 0, 255))
        shadow_layer.putalpha(sh.point(lambda v: int(v * 0.75)))
        im = Image.alpha_composite(im, _offset(shadow_layer, 0, max(2, size // 30)))
    if glow:
        g = mask.filter(ImageFilter.GaussianBlur(glow))
        gl = Image.new("RGBA", im.size, color + (255,))
        gl.putalpha(g.point(lambda v: int(v * 0.55)))
        im = Image.alpha_composite(im, gl)
    solid = Image.new("RGBA", im.size, color + (255,))
    solid.putalpha(mask)
    im = Image.alpha_composite(im, solid)
    return im


def _offset(im, dx, dy):
    out = Image.new("RGBA", im.size, (0, 0, 0, 0))
    out.paste(im, (dx, dy))
    return out


def fit_size(text, fname, size, max_w):
    while size > 20 and font(fname, size).getlength(text) > max_w:
        size -= 4
    return size


def wrap(text, fname, size, max_w):
    words, lines, cur = text.split(), [], ""
    for w_ in words:
        t = (cur + " " + w_).strip()
        if font(fname, size).getlength(t) <= max_w:
            cur = t
        else:
            if cur:
                lines.append(cur)
            cur = w_
    if cur:
        lines.append(cur)
    return lines


# ---------------------------------------------------------------- compositing
def put(canvas: Image.Image, sprite: Image.Image, cx, cy, alpha=1.0, scale=1.0, anchor="mm"):
    """Sprite'ı tuvale yerleştirir. anchor: mm (orta), lm (sol-orta), rm (sağ-orta)."""
    if alpha <= 0.003:
        return
    sp = sprite
    if abs(scale - 1) > 0.002:
        nw, nh = max(1, int(sp.width * scale)), max(1, int(sp.height * scale))
        sp = sp.resize((nw, nh), Image.BILINEAR)
    if alpha < 0.997:
        a = sp.getchannel("A").point(lambda v: int(v * alpha))
        sp = sp.copy()
        sp.putalpha(a)
    if anchor == "mm":
        x, y = cx - sp.width / 2, cy - sp.height / 2
    elif anchor == "lm":
        x, y = cx, cy - sp.height / 2
    else:
        x, y = cx - sp.width, cy - sp.height / 2
    canvas.alpha_composite(sp, (int(round(x)), int(round(y)))) if _inside(canvas, sp, x, y) else \
        canvas.paste(sp, (int(round(x)), int(round(y))), sp)


def _inside(c, s, x, y):
    return x >= 0 and y >= 0 and x + s.width <= c.width and y + s.height <= c.height


def wipe_text(canvas, sprite, cx, cy, p, anchor="mm", alpha=1.0):
    """Yazıyı soldan sağa maskeyle açar (kinetik reveal)."""
    if p <= 0:
        return
    w = int(sprite.width * clamp(p))
    if w < 1:
        return
    cropped = sprite.crop((0, 0, w, sprite.height))
    if anchor == "mm":
        x = cx - sprite.width / 2
    elif anchor == "lm":
        x = cx
    else:
        x = cx - sprite.width
    put(canvas, cropped, x, cy, alpha=alpha, anchor="lm")


def rounded_rect(size, radius, fill, outline=None, width=0):
    im = Image.new("RGBA", size, (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle((0, 0, size[0] - 1, size[1] - 1), radius=radius, fill=fill, outline=outline, width=width)
    return im


@lru_cache(maxsize=64)
def panel(w, h, color=(22, 22, 26), border=(60, 60, 66), radius=14):
    return rounded_rect((w, h), radius, color + (235,), border + (255,), 2)


# ---------------------------------------------------------------- background
_rng = np.random.default_rng(99)


@lru_cache(maxsize=1)
def _bg_layers():
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    # vignette
    nx, ny = (xx - W / 2) / (W / 2), (yy - H / 2) / (H / 2)
    r = np.sqrt(nx ** 2 * 0.9 + ny ** 2)
    vig = np.clip(1.15 - 0.55 * r ** 1.6, 0.25, 1.0)
    # grain kareleri
    grains = [(_rng.normal(0, 7.5, (H, W, 1))).astype(np.int16) for _ in range(6)]
    # glow lekesi (büyük, kaydırılarak kullanılır)
    gh, gw = H * 2, W * 2
    gy, gx = np.mgrid[0:gh, 0:gw].astype(np.float32)
    d = np.sqrt(((gx - gw / 2) / (W * 0.55)) ** 2 + ((gy - gh / 2) / (H * 0.55)) ** 2)
    blob = np.clip(1 - d, 0, 1) ** 2.2
    return vig[..., None], grains, blob


def background(t, tint=RED, strength=0.22, seed=0):
    """Koyu zemin + yavaş gezen renkli ışık + toz parçacıkları."""
    vig, _, blob = _bg_layers()
    base = np.empty((H, W, 3), np.float32)
    base[:] = BG
    ox = int(W / 2 + math.sin(t * 0.21 + seed) * W * 0.28)
    oy = int(H / 2 + math.cos(t * 0.17 + seed * 1.7) * H * 0.22)
    gl = blob[oy:oy + H, ox:ox + W]
    base += gl[..., None] * np.array(tint, np.float32) * strength
    # ikinci, zıt ışık (sarı)
    ox2 = int(W / 2 + math.cos(t * 0.13 + seed) * W * 0.35)
    oy2 = int(H / 2 + math.sin(t * 0.19 + seed) * H * 0.3)
    gl2 = blob[oy2:oy2 + H, ox2:ox2 + W]
    base += gl2[..., None] * np.array(YELLOW, np.float32) * strength * 0.25
    img = Image.fromarray(np.clip(base, 0, 255).astype(np.uint8)).convert("RGBA")
    _dust(img, t, seed)
    return img


_DUST = [(random.Random(i).random(), random.Random(i * 7 + 1).random(), random.Random(i * 13 + 2).random())
         for i in range(55)]


def _dust(img, t, seed):
    d = ImageDraw.Draw(img)
    for (a, b, c) in _DUST:
        x = (a * W + t * (8 + c * 22) + seed * 97) % W
        y = (b * H - t * (4 + c * 10)) % H
        r = 1 + c * 2.2
        alpha = int(40 + 70 * (0.5 + 0.5 * math.sin(t * (0.6 + c) + a * 10)))
        d.ellipse((x - r, y - r, x + r, y + r), fill=(255, 230, 190, alpha))


def finish(img: Image.Image, frame_idx: int) -> np.ndarray:
    """Vignette + film grain uygular, RGB numpy döndürür."""
    vig, grains, _ = _bg_layers()
    a = np.asarray(img.convert("RGB"), dtype=np.int16)
    a = (a * vig).astype(np.int16) + grains[frame_idx % len(grains)]
    return np.clip(a, 0, 255).astype(np.uint8)


def camera(img: Image.Image, t, dur, zoom=0.045, drift=10, shake=0.0):
    """Yavaş push-in + hafif sürüklenme + isteğe bağlı sarsıntı."""
    p = clamp(t / max(dur, 0.01))
    s = 1 + zoom * ease_in_out(p)
    dx = math.sin(t * 0.5) * drift + (random.uniform(-1, 1) * shake)
    dy = math.cos(t * 0.37) * drift * 0.6 + (random.uniform(-1, 1) * shake)
    if s == 1 and dx == 0 and dy == 0:
        return img
    nw, nh = int(W * s), int(H * s)
    big = img.resize((nw, nh), Image.BILINEAR)
    x0 = int((nw - W) / 2 + dx)
    y0 = int((nh - H) / 2 + dy)
    x0, y0 = max(0, min(nw - W, x0)), max(0, min(nh - H, y0))
    return big.crop((x0, y0, x0 + W, y0 + H))


# ---------------------------------------------------------------- transitions
def _motion_blur_shift(a: np.ndarray, shift: int, taps=6):
    if shift == 0:
        return a
    acc = np.zeros_like(a, dtype=np.float32)
    for k in range(taps):
        acc += np.roll(a, int(shift * k / taps), axis=1)
    return (acc / taps).astype(np.uint8)


def transition(a: np.ndarray, b: np.ndarray, p: float, kind: str) -> np.ndarray:
    """İki karenin arasında geçiş. p: 0 → a, 1 → b."""
    if kind == "whip":
        e = ease_in_out(p)
        off = int(e * W)
        blur = int(math.sin(p * math.pi) * 260)
        out = np.concatenate([a[:, off:], b[:, :off]], axis=1) if off < W else b
        return _motion_blur_shift(out, -blur)
    if kind == "zoom":
        e = ease_in_out(p)
        if p < 0.5:
            s = 1 + e * 0.35
            im = Image.fromarray(a).resize((int(W * s), int(H * s)), Image.BILINEAR)
            x0, y0 = (im.width - W) // 2, (im.height - H) // 2
            fr = np.asarray(im.crop((x0, y0, x0 + W, y0 + H)))
        else:
            s = 1.25 - (e - 0.5) * 0.5
            im = Image.fromarray(b).resize((int(W * s), int(H * s)), Image.BILINEAR)
            x0, y0 = (im.width - W) // 2, (im.height - H) // 2
            fr = np.asarray(im.crop((x0, y0, x0 + W, y0 + H)))
        flash = math.sin(p * math.pi) ** 6 * 140
        return np.clip(fr.astype(np.int16) + int(flash), 0, 255).astype(np.uint8)
    if kind == "flash":
        src = a if p < 0.5 else b
        w = math.sin(p * math.pi) ** 2
        return np.clip(src * (1 - w) + 255 * w * 0.92, 0, 255).astype(np.uint8)
    if kind == "glitch":
        src = (a if p < 0.5 else b).copy()
        amt = math.sin(p * math.pi)
        rnd = random.Random(int(p * 1000))
        for _ in range(int(10 * amt) + 1):
            y = rnd.randrange(0, H - 40)
            hgt = rnd.randrange(8, 60)
            sh = int(rnd.uniform(-1, 1) * 160 * amt)
            src[y:y + hgt] = np.roll(src[y:y + hgt], sh, axis=1)
        s = int(18 * amt)
        if s:
            src[..., 0] = np.roll(src[..., 0], s, axis=1)
            src[..., 2] = np.roll(src[..., 2], -s, axis=1)
        return src
    # dissolve
    return (a * (1 - p) + b * p).astype(np.uint8)
