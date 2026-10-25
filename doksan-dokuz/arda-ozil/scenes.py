"""Sahne çizicileri. Her biri draw(canvas, t, dur, ctx) ile bir kareyi çizer.

ctx.cue(k, default): sahnenin k. cue kelimesinin seslendirmedeki zamanı (sn).
ctx.vo_start / ctx.vo_end: seslendirmenin sahne içindeki başlangıç/bitişi.
"""
import math
import random

from PIL import Image, ImageDraw

from gfx import (COLORS, DARK, GREY, H, RED, W, WHITE, YELLOW, clamp, ease_back, ease_in_out, ease_out,
                 fit_size, font, panel, prog, put, rounded_rect, text_sprite, wipe_text, wrap)

CX, CY = W // 2, H // 2


def col(name):
    return COLORS.get(name, WHITE)


def kicker(canvas, text, t, y=180, color=RED, t0=0.1):
    p = ease_out(prog(t, t0, 0.5))
    sp = text_sprite(text, "bebas", 46, color, tracking=6)
    d = ImageDraw.Draw(canvas)
    lw = int((sp.width / 2 + 40) * p)
    d.line((CX - sp.width / 2 - 40 - 90 * p, y, CX - sp.width / 2 - 40, y), fill=color, width=3) if p > 0 else None
    d.line((CX + sp.width / 2 + 40, y, CX + sp.width / 2 + 40 + 90 * p, y), fill=color, width=3) if p > 0 else None
    wipe_text(canvas, sp, CX, y, p)
    return lw


def caption_bar(canvas, text, t, t0, y=960, color=WHITE):
    p = ease_out(prog(t, t0, 0.6))
    if p <= 0:
        return
    sz = fit_size(text, "bebas", 50, W - 300)
    sp = text_sprite(text, "bebas", sz, color, tracking=3)
    bw = int((sp.width + 60) * p)
    bar = rounded_rect((max(bw, 2), sp.height - 6), 6, (0, 0, 0, 170))
    put(canvas, bar, CX, y)
    wipe_text(canvas, sp, CX, y, p)


def label_corner(canvas, text="TEMSİLİ ANİMASYON"):
    sp = text_sprite(text, "bebas", 30, GREY, tracking=4, shadow=False)
    put(canvas, sp, W - 60, 60, alpha=0.8, anchor="rm")


# ======================================================================
class DateCard:
    def __init__(s, sc):
        s.sc = sc

    def draw(s, c, t, dur, ctx):
        sc = s.sc
        p = ease_out(prog(t, 0.15, 0.9))
        big = text_sprite(sc["date"], "display", 330, YELLOW, glow=18, tracking=10)
        put(c, big, CX, CY - 60 + (1 - p) * 60, alpha=p, scale=1.15 - 0.15 * p)
        d = ImageDraw.Draw(c)
        lp = ease_out(prog(t, 0.6, 0.8))
        d.line((CX - 520 * lp, CY + 140, CX + 520 * lp, CY + 140), fill=RED, width=4)
        wipe_text(c, text_sprite(sc["place"], "bebas", 72, WHITE, tracking=8), CX, CY + 205, ease_out(prog(t, 0.9, 0.8)))
        tp = ease_back(prog(t, 1.5, 0.5))
        if tp > 0:
            tag = text_sprite(sc["sub"], "bebas", 46, WHITE, tracking=6, shadow=False)
            box = rounded_rect((tag.width + 30, tag.height - 4), 6, RED + (255,))
            put(c, box, CX, CY + 290, scale=tp)
            put(c, tag, CX, CY + 290, scale=tp)


class Quote:
    def __init__(s, sc):
        s.sc = sc
        s.size = 104
        s.lines = wrap(sc["text"], "display", s.size, 1450)
        while len(s.lines) > 3:
            s.size -= 8
            s.lines = wrap(sc["text"], "display", s.size, 1450)

    def draw(s, c, t, dur, ctx):
        q = text_sprite("“", "display", 420, YELLOW, glow=10, shadow=False)
        qp = ease_out(prog(t, 0.0, 0.6))
        put(c, q, 300, 300 - (1 - qp) * 40, alpha=0.9 * qp)
        words_all = [w for ln in s.lines for w in ln.split()]
        n = len(words_all)
        t0 = 0.35
        span = min(max(1.2, 0.26 * n), max(1.2, (ctx.vo_end - 0.5) * 0.6))
        lh = int(s.size * 1.18)
        y0 = CY - (len(s.lines) - 1) * lh / 2 - 40
        k = 0
        for li, ln in enumerate(s.lines):
            ws = ln.split()
            f = font("display", s.size)
            total = f.getlength(ln)
            x = CX - total / 2
            for w in ws:
                wt = t0 + span * k / max(n, 1)
                p = ease_out(prog(t, wt, 0.35))
                color = YELLOW if w.strip(".,?!").isdigit() else WHITE
                sp = text_sprite(w, "display", s.size, color)
                put(c, sp, x - 12, y0 + li * lh + (1 - p) * 30, alpha=p, anchor="lm")
                x += f.getlength(w + " ")
                k += 1
        ap = ease_out(prog(t, t0 + span + 0.2, 0.6))
        if ap > 0:
            yy = y0 + len(s.lines) * lh + 30
            d = ImageDraw.Draw(c)
            d.line((CX - 60 * ap, yy - 8, CX + 60 * ap, yy - 8), fill=RED, width=4)
            wipe_text(c, text_sprite(s.sc["who"], "bebas", 48, GREY, tracking=5), CX, yy + 42, ap)


def shirt_sprite(number, name, w=620):
    h = int(w * 0.92)
    im = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    u = w / 100
    poly = [(30, 2), (42, 6), (50, 8), (58, 6), (70, 2), (98, 18), (88, 38), (78, 33), (78, 92), (22, 92),
            (22, 33), (12, 38), (2, 18)]
    pts = [(x * u, y * u) for x, y in poly]
    d.polygon(pts, fill=(238, 236, 230, 255))
    d.line(pts + [pts[0]], fill=(40, 40, 44, 255), width=int(u * 0.8))
    d.arc((40 * u, -2 * u, 60 * u, 14 * u), 20, 160, fill=(200, 160, 60, 255), width=int(u * 1.3))
    nm = text_sprite(name, "bebas", int(u * 12), (30, 30, 34), tracking=int(u), shadow=False)
    im.alpha_composite(nm, (int(w / 2 - nm.width / 2), int(20 * u)))
    num = text_sprite(number, "display", int(u * 40), (30, 30, 34), shadow=False)
    im.alpha_composite(num, (int(w / 2 - num.width / 2), int(31 * u)))
    return im


class Jersey:
    def __init__(s, sc):
        s.sc = sc
        s.sp = shirt_sprite(sc["number"], sc["name"])

    def draw(s, c, t, dur, ctx):
        p = ease_out(prog(t, 0.05, 0.9))
        put(c, s.sp, CX, CY - 40 + (1 - p) * 80, alpha=p, scale=0.92 + 0.08 * p)
        # ışık süpürmesi
        sw = prog(t, 0.6, 1.4)
        if 0 < sw < 1:
            band = Image.new("RGBA", (W, H), (0, 0, 0, 0))
            d = ImageDraw.Draw(band)
            x = -400 + sw * (W + 800)
            d.polygon([(x, 0), (x + 120, 0), (x - 280, H), (x - 400, H)], fill=(255, 255, 255, 38))
            c.alpha_composite(band)
        caption_bar(c, s.sc["caption"], t, 0.9, y=980)


class Title:
    def __init__(s, sc):
        s.sc = sc
        s.sizes = [fit_size(txt, "display", 200, 1600) for txt, _ in sc["lines"]]

    def draw(s, c, t, dur, ctx):
        kicker(c, s.sc["kicker"], t, y=170)
        n = len(s.sc["lines"])
        gaps = [int(sz * 1.02) for sz in s.sizes]
        total = sum(gaps)
        y = CY - total / 2 + gaps[0] / 2 + 40
        for i, ((txt, cn), sz) in enumerate(zip(s.sc["lines"], s.sizes)):
            t0 = 0.3 + i * 0.32
            p = ease_out(prog(t, t0, 0.55))
            sp = text_sprite(txt, "display", sz, col(cn), glow=8 if cn != "white" else 0)
            dx = (1 - p) * (-120 if i % 2 == 0 else 120)
            put(c, sp, CX + dx, y, alpha=p, scale=1.0 + 0.04 * (1 - p))
            y += gaps[i] if i + 1 >= n else (gaps[i] + gaps[i + 1]) / 2


class Chapter:
    def __init__(s, sc):
        s.sc = sc

    def draw(s, c, t, dur, ctx):
        d = ImageDraw.Draw(c)
        p = ease_out(prog(t, 0.05, 0.6))
        bar_w = int(W * 0.62 * p)
        d.rectangle((0, CY - 6, bar_w, CY + 6), fill=RED)
        num = text_sprite(s.sc["n"], "display", 380, YELLOW, glow=20)
        put(c, num, 470, CY - 20 + (1 - p) * 40, alpha=p)
        small = text_sprite("BÖLÜM", "bebas", 60, GREY, tracking=12)
        wipe_text(c, small, 760, CY - 110, ease_out(prog(t, 0.25, 0.5)), anchor="lm")
        sz = fit_size(s.sc["name"], "display", 130, 1050)
        name = text_sprite(s.sc["name"], "display", sz, WHITE)
        wipe_text(c, name, 760, CY + 70, ease_out(prog(t, 0.4, 0.7)), anchor="lm")
        out = prog(t, dur - 0.35, 0.35)
        if out > 0:
            d.rectangle((0, 0, W, H), fill=None)


class Timeline:
    def __init__(s, sc):
        s.sc = sc

    def draw(s, c, t, dur, ctx):
        items = s.sc["items"]
        n = len(items)
        d = ImageDraw.Draw(c)
        x0, x1 = 230, W - 230
        lp = ease_in_out(prog(t, 0.1, 1.0))
        d.line((x0, CY, x0 + (x1 - x0) * lp, CY), fill=(90, 90, 96), width=4)
        for i, (yr, lab) in enumerate(items):
            x = x0 + (x1 - x0) * (i + 0.5) / n
            tc = ctx.cue(i, 0.6 + i * (ctx.vo_end * 0.8) / n)
            p = ease_back(prog(t, tc, 0.45))
            if p <= 0:
                continue
            active = (i == n - 1) or t < ctx.cue(i + 1, 1e9)
            colr = YELLOW if active else (150, 120, 50)
            r = 16 * p
            d.ellipse((x - r, CY - r, x + r, CY + r), fill=colr)
            if i > 0:
                px = x0 + (x1 - x0) * (i - 0.5) / n
                d.line((px, CY, px + (x - px) * clamp(p), CY), fill=YELLOW, width=5)
            if yr:
                ys = text_sprite(yr, "display", fit_size(yr, "display", 92, (x1 - x0) / n - 20), colr, glow=6 if active else 0)
                put(c, ys, x, CY - 105 - (1 - p) * 20, alpha=clamp(p))
            lines = wrap(lab, "bebas", 50, (x1 - x0) / n - 30)
            for li, ln in enumerate(lines):
                put(c, text_sprite(ln, "bebas", 50, WHITE if active else GREY, tracking=2), x, CY + 80 + li * 52,
                    alpha=clamp(p))


class Counter:
    def __init__(s, sc):
        s.sc = sc

    def draw(s, c, t, dur, ctx):
        v = s.sc["value"]
        p = ease_out(prog(t, 0.25, 1.4))
        cur = int(round(v * p))
        txt = f"{cur}{s.sc.get('suffix', '')}"
        sz = 300 if len(txt) <= 4 else 240
        put(c, text_sprite(txt, "display", sz, YELLOW, glow=16), CX, CY - 70, scale=1 + 0.06 * (1 - ease_out(prog(t, 1.6, 0.3))) if p >= 1 else 1)
        d = ImageDraw.Draw(c)
        R = 330
        d.arc((CX - R, CY - 70 - R, CX + R, CY - 70 + R), -90, -90 + 360 * p, fill=RED, width=6)
        lp = ease_out(prog(t, 1.2, 0.6))
        lab = s.sc["label"]
        wipe_text(c, text_sprite(lab, "bebas", fit_size(lab, "bebas", 66, 1500), WHITE, tracking=4), CX, CY + 330, lp)


class StatCards:
    def __init__(s, sc):
        s.sc = sc

    def draw(s, c, t, dur, ctx):
        kicker(c, s.sc["header"], t, y=170, color=YELLOW)
        cards = s.sc["cards"]
        n = len(cards)
        cw, chh, gap = 470, 470, 60
        x0 = CX - (n * cw + (n - 1) * gap) / 2 + cw / 2
        for i, (val, lab) in enumerate(cards):
            tc = ctx.cue(i, 0.5 + i * 0.7)
            p = ease_back(prog(t, tc, 0.5))
            if p <= 0:
                continue
            x = x0 + i * (cw + gap)
            put(c, panel(cw, chh), x, CY + 40, alpha=clamp(p), scale=0.85 + 0.15 * p)
            put(c, text_sprite(val, "display", 210, YELLOW, glow=10), x, CY + 10, alpha=clamp(p), scale=0.85 + 0.15 * p)
            put(c, text_sprite(lab, "bebas", 74, WHITE, tracking=8), x, CY + 185, alpha=clamp(p))
            d = ImageDraw.Draw(c)
            d.rectangle((x - cw / 2 + 30, CY + 40 - chh / 2 + 22, x - cw / 2 + 30 + 80 * clamp(p), CY + 40 - chh / 2 + 28),
                        fill=RED)


class Split:
    def __init__(s, sc):
        s.sc = sc

    def draw(s, c, t, dur, ctx):
        d = ImageDraw.Draw(c)
        lp = ease_out(prog(t, 0.1, 0.7))
        rp = ease_out(prog(t, max(1.0, ctx.vo_end * 0.42), 0.7))
        # sağ yarıyı hafif kırmızıyla boya
        if rp > 0:
            ov = Image.new("RGBA", (W, H), (0, 0, 0, 0))
            od = ImageDraw.Draw(ov)
            od.polygon([(CX + 120, 0), (W, 0), (W, H), (CX - 120, H)], fill=(RED[0], RED[1], RED[2], int(40 * rp)))
            c.alpha_composite(ov)
        sp = ease_in_out(prog(t, 0.0, 0.8))
        d.line((CX + 120, CY - (CY + 20) * sp, CX - 120, CY + (CY + 20) * sp), fill=YELLOW, width=5)
        for side, p, (ttl, big), color in (("l", lp, s.sc["left"], YELLOW), ("r", rp, s.sc["right"], RED)):
            if p <= 0:
                continue
            x = CX / 2 + 20 if side == "l" else CX + CX / 2 - 20
            put(c, text_sprite(ttl, "bebas", 58, GREY, tracking=8), x, CY - 150 - (1 - p) * 20, alpha=p)
            lines = wrap(big, "display", 92, 760)
            for i, ln in enumerate(lines):
                put(c, text_sprite(ln, "display", 92, WHITE if color == YELLOW else WHITE, glow=0), x,
                    CY - 20 + i * 104 + (1 - p) * 40, alpha=p)
            d.rectangle((x - 70 * p, CY - 95, x + 70 * p, CY - 89), fill=color)


class Triangle:
    def __init__(s, sc):
        s.sc = sc

    def draw(s, c, t, dur, ctx):
        pts = [(CX, 210), (CX - 560, 860), (CX + 560, 860)]
        d = ImageDraw.Draw(c)
        cue_c = ctx.word_time("Fenerbahçe", 1.0)
        times = [ctx.cue(i, 1 + i * 2) for i in range(3)]
        for i in range(3):
            a, b = pts[i], pts[(i + 1) % 3]
            p = ease_in_out(prog(t, max(times[i], times[(i + 1) % 3]) + 0.2, 0.8))
            if p > 0:
                d.line((a[0], a[1], a[0] + (b[0] - a[0]) * p, a[1] + (b[1] - a[1]) * p), fill=(110, 110, 116), width=4)
        cp = ease_back(prog(t, cue_c, 0.6))
        if cp > 0:
            g = text_sprite(s.sc["center"], "display", 120, YELLOW, glow=16)
            put(c, g, CX, 640, scale=cp, alpha=clamp(cp))
            for p_ in pts:
                q = ease_in_out(prog(t, cue_c + 0.3, 0.8))
                d.line((CX, 640, CX + (p_[0] - CX) * q * 0.62, 640 + (p_[1] - 640) * q * 0.62), fill=(YELLOW[0], YELLOW[1], YELLOW[2]), width=2)
        for i, (x, y) in enumerate(pts):
            p = ease_back(prog(t, times[i], 0.5))
            if p <= 0:
                continue
            R = 110 * p
            d.ellipse((x - R, y - R, x + R, y + R), fill=DARK, outline=RED, width=6)
            name = s.sc["nodes"][i]
            put(c, text_sprite(name, "display", fit_size(name, "display", 64, 200), WHITE), x, y, alpha=clamp(p), scale=clamp(p))


class Compare:
    def __init__(s, sc):
        s.sc = sc

    def draw(s, c, t, dur, ctx):
        hp = ease_out(prog(t, 0.1, 0.6))
        put(c, text_sprite(s.sc["left"], "display", 140, YELLOW, glow=10), CX - 520, 170, alpha=hp)
        put(c, text_sprite(s.sc["right"], "display", 140, RED, glow=10), CX + 520, 170, alpha=hp)
        put(c, text_sprite("VS", "bebas", 70, GREY), CX, 175, alpha=hp)
        rows = s.sc["rows"]
        n = len(rows)
        span = max(2.0, ctx.vo_end * 0.85)
        for i, (lab, a, b) in enumerate(rows):
            tc = 0.7 + span * i / n
            p = ease_out(prog(t, tc, 0.45))
            if p <= 0:
                continue
            y = 330 + i * 140
            put(c, panel(1500, 112, radius=10), CX, y, alpha=p * 0.9)
            put(c, text_sprite(lab, "bebas", 44, GREY, tracking=4), CX, y, alpha=p)
            put(c, text_sprite(a, "display", 66, WHITE), CX - 520 - (1 - p) * 60, y, alpha=p)
            put(c, text_sprite(b, "display", 66, WHITE), CX + 520 + (1 - p) * 60, y, alpha=p)
            if a == b:
                mk = text_sprite("=", "display", 60, YELLOW)
                put(c, mk, CX - 260, y, alpha=p)
                put(c, mk, CX + 260, y, alpha=p)


class Results:
    def __init__(s, sc):
        s.sc = sc

    def draw(s, c, t, dur, ctx):
        kicker(c, s.sc["header"], t, y=190, color=YELLOW)
        rows = s.sc["rows"]
        for i, (opp, sc_, res) in enumerate(rows):
            p = ease_out(prog(t, 0.6 + i * max(0.8, ctx.vo_end * 0.18), 0.5))
            if p <= 0:
                continue
            y = 380 + i * 190
            put(c, panel(1300, 150, radius=12), CX + (1 - p) * 80, y, alpha=p)
            put(c, text_sprite("TÜRKİYE", "display", 72, WHITE), CX - 300 + (1 - p) * 80, y, alpha=p)
            put(c, text_sprite(sc_ if sc_ else "—", "display", 80, YELLOW), CX + (1 - p) * 80, y, alpha=p)
            put(c, text_sprite(opp, "display", 72, WHITE), CX + 300 + (1 - p) * 80, y, alpha=p)
            badge = rounded_rect((96, 96), 14, (RED if res == "M" else (46, 160, 90)) + (255,))
            put(c, badge, CX + 560 + (1 - p) * 80, y, alpha=p)
            put(c, text_sprite("M" if res == "M" else "G", "display", 60, WHITE, shadow=False), CX + 560 + (1 - p) * 80, y, alpha=p)


class Poll:
    def __init__(s, sc):
        s.sc = sc

    def draw(s, c, t, dur, ctx):
        kicker(c, s.sc["title"], t, y=190, color=YELLOW)
        d = ImageDraw.Draw(c)
        bx, bw = 360, 1200
        for i, (lab, pct) in enumerate(s.sc["options"]):
            t0 = 0.6 + i * 0.5
            p = ease_out(prog(t, t0, 1.2))
            if p <= 0:
                continue
            y = 380 + i * 200
            put(c, text_sprite(lab, "bebas", 56, WHITE if i == 0 else GREY, tracking=3), bx, y - 50, anchor="lm", alpha=clamp(p * 2))
            d.rounded_rectangle((bx, y, bx + bw, y + 54), radius=8, fill=(40, 40, 46))
            fw = bw * pct / 100 * p
            if fw > 4:
                d.rounded_rectangle((bx, y, bx + fw, y + 54), radius=8, fill=YELLOW if i == 0 else (120, 118, 112))
            put(c, text_sprite(f"%{int(round(pct * p))}", "display", 80, YELLOW if i == 0 else WHITE), bx + bw + 40, y + 27,
                anchor="lm")


class Lineup:
    """Yarım saha + 4-3-3 dizilişi; tek isimli slotta oyuncu değişir."""

    def __init__(s, sc):
        s.sc = sc

    def draw(s, c, t, dur, ctx):
        kicker(c, s.sc["title"], t, y=120, color=YELLOW)
        d = ImageDraw.Draw(c)
        px0, py0, px1, py1 = 460, 200, 1460, 1020
        pp = ease_out(prog(t, 0.1, 0.7))
        d.rounded_rectangle((px0, py0, px1, py1), radius=8, outline=(70, 90, 78), width=3, fill=(14, 26, 20))
        d.line((px0, py0 + 4, px1, py0 + 4), fill=(70, 90, 78), width=3)
        d.rectangle((CX - 230, py1 - 170, CX + 230, py1), outline=(70, 90, 78), width=3)
        d.arc((CX - 140, py0 - 140, CX + 140, py0 + 140), 0, 180, fill=(70, 90, 78), width=3)
        pos = [(0.5, 0.92), (0.15, 0.72), (0.38, 0.75), (0.62, 0.75), (0.85, 0.72), (0.3, 0.5), (0.5, 0.55),
               (0.7, 0.5), (0.18, 0.22), (0.5, 0.17), (0.82, 0.22)]
        slot = 10  # sağ kanat
        swap = ctx.word_time("Diomande", max(1.5, ctx.vo_end * 0.65))
        for i, (fx, fy) in enumerate(pos):
            x = px0 + (px1 - px0) * fx
            y = py0 + (py1 - py0) * fy
            p = ease_back(prog(t, 0.3 + i * 0.06, 0.4))
            if p <= 0:
                continue
            r = 30 * p
            if i == slot:
                sw = prog(t, swap, 0.5)
                colr = YELLOW if sw < 0.5 else RED
                d.ellipse((x - r * 1.2, y - r * 1.2, x + r * 1.2, y + r * 1.2), fill=colr, outline=WHITE, width=3)
                name = s.sc["out_name"] if sw < 0.5 else s.sc["in_name"]
                a = abs(1 - 2 * sw) if 0 < sw < 1 else 1
                put(c, text_sprite(name, "bebas", 52, colr, tracking=3), x, y + 68, alpha=a)
                if sw >= 1:
                    xs = text_sprite(s.sc["out_name"], "bebas", 40, GREY, tracking=3)
                    put(c, xs, x, y - 75, alpha=0.8)
                    d.line((x - xs.width / 2 + 10, y - 75, x + xs.width / 2 - 10, y - 75), fill=RED, width=4)
            else:
                d.ellipse((x - r, y - r, x + r, y + r), fill=WHITE, outline=(60, 60, 60), width=2)


class Score:
    def __init__(s, sc):
        s.sc = sc
        evs = sc["events"]
        steps = sc.get("steps")
        if steps is None:
            steps = []
        s.steps = steps

    def score_at(s, t, ctx):
        hs, as_ = s.sc.get("start", (s.sc["hs"], s.sc["as_"]))
        for (k, h_, a_) in s.steps:
            if t >= ctx.cue(k, 1e9):
                hs, as_ = h_, a_
        return hs, as_

    def draw(s, c, t, dur, ctx):
        sc = s.sc
        put(c, text_sprite(sc["label"], "bebas", 46, GREY, tracking=6), CX, 150, alpha=ease_out(prog(t, 0.1, 0.5)))
        p = ease_out(prog(t, 0.15, 0.7))
        put(c, panel(1500, 230, color=(20, 20, 24)), CX, 330 + (1 - p) * -40, alpha=p)
        hs, as_ = s.score_at(t, ctx)
        hn = text_sprite(sc["home"], "display", fit_size(sc["home"], "display", 96, 520), WHITE)
        an = text_sprite(sc["away"], "display", fit_size(sc["away"], "display", 96, 520), WHITE)
        put(c, hn, CX - 420, 330, alpha=p)
        put(c, an, CX + 420, 330, alpha=p)
        # skor değişince parlayan rakamlar
        flash = 0
        for (k, _, _) in s.steps:
            tk = ctx.cue(k, 1e9)
            if 0 <= t - tk < 0.5:
                flash = 1 - (t - tk) / 0.5
        sc_txt = f"{hs}  –  {as_}"
        put(c, text_sprite(sc_txt, "display", 150, YELLOW, glow=14), CX, 330, alpha=p, scale=1 + 0.12 * flash)
        evs = sc["events"]
        for i, (mn, txt) in enumerate(evs):
            tc = ctx.cue(i, 0.8 + i * max(0.7, (ctx.vo_end - 1) / max(len(evs), 1)))
            ep = ease_out(prog(t, tc, 0.45))
            if ep <= 0:
                continue
            y = 560 + i * 92
            hl = ("ARDA" in txt)
            put(c, text_sprite(mn, "display", 58, YELLOW), CX - 520 - (1 - ep) * 40, y, alpha=ep, anchor="rm")
            put(c, text_sprite(txt, "bebas", 58, WHITE if hl else GREY, tracking=3), CX - 470 + (1 - ep) * 40, y, alpha=ep,
                anchor="lm")
            if hl:
                d = ImageDraw.Draw(c)
                d.rectangle((CX - 495, y - 24, CX - 488, y + 24), fill=RED)


class DualCounter:
    def __init__(s, sc):
        s.sc = sc

    def draw(s, c, t, dur, ctx):
        kicker(c, s.sc["header"], t, y=190, color=YELLOW)
        d = ImageDraw.Draw(c)
        lp = ease_in_out(prog(t, 0.3, 0.6))
        d.line((CX, CY - 200 * lp, CX, CY + 200 * lp), fill=(80, 80, 86), width=3)
        times = [ctx.word_time("altı yüz", 0.6), ctx.word_time("beş yüz", 2.0)]
        for i, ((val, lab), x, color) in enumerate(((s.sc["a"], CX - 420, YELLOW), (s.sc["b"], CX + 420, GREY))):
            num = int(val.strip("'"))
            p = ease_out(prog(t, times[i], 1.2))
            if p <= 0:
                continue
            put(c, text_sprite(f"{int(num * p)}'", "display", 230, color, glow=12 if i == 0 else 0), x, CY - 30)
            put(c, text_sprite(lab, "bebas", 64, WHITE, tracking=6), x, CY + 140, alpha=clamp(p * 2))


class Stats:
    def __init__(s, sc):
        s.sc = sc

    def draw(s, c, t, dur, ctx):
        sc = s.sc
        hp = ease_out(prog(t, 0.1, 0.5))
        put(c, text_sprite(sc["header"], "display", 110, WHITE), CX, 140, alpha=hp)
        put(c, text_sprite(sc["left"], "bebas", 54, YELLOW, tracking=5), CX - 430, 250, alpha=hp)
        put(c, text_sprite(sc["right"], "bebas", 54, GREY, tracking=5), CX + 430, 250, alpha=hp)
        d = ImageDraw.Draw(c)
        rows = sc["rows"]
        n = len(rows)
        top = 380 if n > 2 else 470
        gap = 170 if n > 2 else 230
        maxw = 620
        for i, (lab, a, b, suf) in enumerate(rows):
            tc = ctx.cue(i, 0.6 + i * 1.6)
            p = ease_out(prog(t, tc, 0.9))
            if p <= 0:
                continue
            y = top + i * gap
            put(c, text_sprite(lab, "bebas", 46, WHITE, tracking=4), CX, y - 50, alpha=clamp(p * 2))
            m = max(a, b)
            wa, wb = maxw * a / m * p, maxw * b / m * p
            d.rounded_rectangle((CX - 30 - wa, y - 4, CX - 30, y + 44), radius=6, fill=YELLOW)
            d.rounded_rectangle((CX + 30, y - 4, CX + 30 + wb, y + 44), radius=6, fill=(110, 108, 104))

            def fmt(v):
                return (f"{v * p:.1f}" if isinstance(v, float) else f"{int(round(v * p))}").replace(".", ",")

            put(c, text_sprite(f"{suf}{fmt(a)}", "display", 72, YELLOW), CX - 60 - wa, y + 20, anchor="rm")
            put(c, text_sprite(f"{suf}{fmt(b)}", "display", 72, WHITE), CX + 60 + wb, y + 20, anchor="lm")


class Versus:
    def __init__(s, sc):
        s.sc = sc

    def draw(s, c, t, dur, ctx):
        put(c, text_sprite(s.sc["label"], "bebas", 56, YELLOW, tracking=8), CX, 170, alpha=ease_out(prog(t, 0.1, 0.5)))
        lp = ease_out(prog(t, 0.3, 0.7))
        rp = ease_out(prog(t, 0.5, 0.7))
        (an, ap), (bn, bp) = s.sc["a"], s.sc["b"]
        put(c, text_sprite(an, "display", 130, WHITE), CX - 470 - (1 - lp) * 300, CY - 30, alpha=lp)
        put(c, text_sprite(ap, "display", 90, (70, 120, 200)), CX - 470 - (1 - lp) * 300, CY + 110, alpha=lp)
        put(c, text_sprite(bn, "display", 130, WHITE), CX + 470 + (1 - rp) * 300, CY - 30, alpha=rp)
        put(c, text_sprite(bp, "display", 90, YELLOW), CX + 470 + (1 - rp) * 300, CY + 110, alpha=rp)
        vp = ease_back(prog(t, 0.8, 0.5))
        if vp > 0:
            d = ImageDraw.Draw(c)
            R = 95 * vp
            d.ellipse((CX - R, CY - 30 - R, CX + R, CY - 30 + R), fill=RED)
            put(c, text_sprite("VS", "display", 90, WHITE, shadow=False), CX, CY - 30, scale=vp)


class Outro:
    def __init__(s, sc):
        s.sc = sc

    def draw(s, c, t, dur, ctx):
        qp = ease_back(prog(t, 0.1, 0.6))
        put(c, text_sprite("?", "display", 360, YELLOW, glow=24), CX, 300, scale=qp, alpha=clamp(qp))
        wipe_text(c, text_sprite("YORUMLARDA BULUŞALIM", "display", 110, WHITE), CX, 560, ease_out(prog(t, 0.6, 0.8)))
        tb = ctx.word_time("abone", max(2.0, ctx.vo_end * 0.6))
        bp = ease_back(prog(t, tb - 0.3, 0.5))
        if bp > 0:
            press = 1 - 0.06 * math.sin(clamp((t - tb - 0.4) / 0.3) * math.pi)
            btn = rounded_rect((520, 130), 18, RED + (255,))
            put(c, btn, CX + 80, 780, scale=bp * press)
            put(c, text_sprite("ABONE OL", "display", 78, WHITE, shadow=False), CX + 80, 780, scale=bp * press)
            # 99 logosu
            d = ImageDraw.Draw(c)
            R = 72 * bp
            lx = CX - 290
            d.ellipse((lx - R, 780 - R, lx + R, 780 + R), fill=(18, 18, 20), outline=WHITE, width=5)
            put(c, text_sprite("99", "display", 76, WHITE, shadow=False), lx, 780, scale=bp)
        lp = ease_out(prog(t, tb + 0.6, 0.6))
        if lp > 0:
            put(c, text_sprite("DOKSAN DOKUZ", "bebas", 60, GREY, tracking=12), CX, 940, alpha=lp)


# ---------------------------------------------------------------- pitch plays
class Pitch:
    """Üstten görünüm saha; oyuncu ve top animasyonu (temsili)."""

    PX0, PY0, PX1, PY1 = 160, 150, 1760, 950

    def __init__(s, sc):
        s.sc = sc
        s.play = PLAYS[sc["play"]]
        s.base = s._pitch()

    def _pitch(s):
        im = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        d = ImageDraw.Draw(im)
        x0, y0, x1, y1 = s.PX0, s.PY0, s.PX1, s.PY1
        for k in range(10):  # çim şeritleri
            xa = x0 + (x1 - x0) * k / 10
            xb = x0 + (x1 - x0) * (k + 1) / 10
            d.rectangle((xa, y0, xb, y1), fill=(16, 32, 24, 255) if k % 2 == 0 else (19, 37, 28, 255))
        lc = (120, 150, 130, 255)
        d.rectangle((x0, y0, x1, y1), outline=lc, width=3)
        d.line((CX, y0, CX, y1), fill=lc, width=3)
        d.ellipse((CX - 115, CY - 115 + 0, CX + 115, CY + 115), outline=lc, width=3)
        bh = (y1 - y0) * 0.6
        for side in (0, 1):
            xa = x0 if side == 0 else x1
            sgn = 1 if side == 0 else -1
            d.rectangle(sorted([xa, xa + sgn * 250]) + [0, 0], outline=None) if False else None
            d.rectangle((min(xa, xa + sgn * 250), CY - bh / 2, max(xa, xa + sgn * 250), CY + bh / 2), outline=lc, width=3)
            d.rectangle((min(xa, xa + sgn * 90), CY - bh / 4, max(xa, xa + sgn * 90), CY + bh / 4), outline=lc, width=3)
            d.rectangle((min(xa, xa - sgn * 18), CY - 55, max(xa, xa - sgn * 18), CY + 55), outline=(230, 230, 230, 255), width=3)
        return im

    def P(s, x, y):
        return s.PX0 + (s.PX1 - s.PX0) * x, s.PY0 + (s.PY1 - s.PY0) * y

    def draw(s, c, t, dur, ctx):
        bp = ease_out(prog(t, 0.0, 0.5))
        c.alpha_composite(s.base) if bp >= 1 else put(c, s.base, CX, CY, alpha=bp)
        label_corner(c)
        play = s.play
        span = max(dur - 0.6, 1.0)
        f = clamp((t - 0.3) / span)  # oynanış ilerlemesi 0..1
        d = ImageDraw.Draw(c)
        # pas izleri
        for (a, b, f0, f1, kind) in play["ball"]:
            if f < f0:
                continue
            q = clamp((f - f0) / (f1 - f0))
            (x0, y0), (x1, y1) = s.P(*a), s.P(*b)
            xe, ye = x0 + (x1 - x0) * q, y0 + (y1 - y0) * q
            color = YELLOW if kind == "pass" else RED
            _dashed(d, x0, y0, xe, ye, color, 5 if kind == "pass" else 7)
        # oyuncular
        for pl in play["players"]:
            team, num, keys = pl[0], pl[1], pl[2]
            x, y = _interp(keys, f)
            X, Y = s.P(x, y)
            r = 24
            if team == "H":
                fill, txtc = WHITE, (25, 25, 30)
            elif team == "K":
                fill, txtc = (60, 60, 66), WHITE
            else:
                fill, txtc = RED, WHITE
            star = len(pl) > 3 and pl[3]
            if star:
                pulse = 1 + 0.15 * math.sin(t * 6)
                R = 40 * pulse
                d.ellipse((X - R, Y - R, X + R, Y + R), outline=YELLOW, width=4)
            d.ellipse((X - r, Y - r, X + r, Y + r), fill=fill, outline=(0, 0, 0), width=2)
            put(c, text_sprite(str(num), "display", 26, txtc, shadow=False), X, Y)
            if star:
                put(c, text_sprite(pl[3], "bebas", 40, YELLOW, tracking=3), X, Y - 58)
        # top
        bx, by = s._ball(f)
        BX, BY = s.P(bx, by)
        d.ellipse((BX - 11, BY - 11, BX + 11, BY + 11), fill=(255, 255, 255), outline=(0, 0, 0), width=2)
        # olay yazıları
        for (fe, txt) in play.get("events", []):
            ep = clamp((f - fe) / 0.06)
            if 0 < ep and f < fe + 0.22:
                fade = 1 - clamp((f - fe - 0.17) / 0.05)
                big = text_sprite(txt, "display", 150 if txt == "GOL!" else 90, YELLOW, glow=20)
                put(c, big, CX, 120 + 0, scale=0.7 + 0.3 * ease_back(ep), alpha=fade)

    def _ball(s, f):
        segs = s.play["ball"]
        for (a, b, f0, f1, kind) in segs:
            if f0 <= f <= f1:
                q = ease_in_out((f - f0) / (f1 - f0)) if kind == "pass" else (f - f0) / (f1 - f0)
                return a[0] + (b[0] - a[0]) * q, a[1] + (b[1] - a[1]) * q
        last = None
        for (a, b, f0, f1, kind) in segs:
            if f > f1:
                last = b
            elif f < f0:
                return last if last else a
        return last


def _interp(keys, f):
    if f <= keys[0][0]:
        return keys[0][1], keys[0][2]
    for (f0, x0, y0), (f1, x1, y1) in zip(keys, keys[1:]):
        if f0 <= f <= f1:
            q = ease_in_out((f - f0) / (f1 - f0))
            return x0 + (x1 - x0) * q, y0 + (y1 - y0) * q
    return keys[-1][1], keys[-1][2]


def _dashed(d, x0, y0, x1, y1, color, w):
    L = math.hypot(x1 - x0, y1 - y0)
    if L < 1:
        return
    n = int(L / 22)
    for k in range(n + 1):
        a = k / max(n, 1)
        b = min(1, (k + 0.6) / max(n, 1))
        d.line((x0 + (x1 - x0) * a, y0 + (y1 - y0) * a, x0 + (x1 - x0) * b, y0 + (y1 - y0) * b), fill=color, width=w)


# Oyuncu: (takım, numara, [(f, x, y), ...], yıldız_etiketi)
# Top: (başlangıç, bitiş, f0, f1, "pass"/"shot")
PLAYS = {
    "ozil_counter": {
        "players": [
            ("H", 4, [(0, 0.22, 0.55), (0.3, 0.3, 0.55)]),
            ("H", 10, [(0, 0.35, 0.45), (0.2, 0.5, 0.48), (0.45, 0.62, 0.5)], "ÖZİL"),
            ("H", 7, [(0, 0.4, 0.15), (0.4, 0.65, 0.2), (0.75, 0.86, 0.38)]),
            ("H", 9, [(0, 0.45, 0.7), (0.6, 0.72, 0.62)]),
            ("A", 5, [(0, 0.3, 0.5), (0.4, 0.4, 0.5)]),
            ("A", 4, [(0, 0.7, 0.35), (0.6, 0.78, 0.45)]),
            ("A", 3, [(0, 0.72, 0.62), (0.6, 0.8, 0.58)]),
            ("K", 1, [(0, 0.97, 0.5), (0.8, 0.94, 0.45)]),
        ],
        "ball": [((0.22, 0.55), (0.42, 0.47), 0.05, 0.2, "pass"),
                 ((0.42, 0.47), (0.62, 0.5), 0.2, 0.45, "pass"),
                 ((0.62, 0.5), (0.84, 0.38), 0.5, 0.72, "pass"),
                 ((0.84, 0.38), (0.995, 0.47), 0.78, 0.86, "shot")],
        "events": [(0.86, "GOL!")],
    },
    "roma_assists": {
        "players": [
            ("H", 15, [(0, 0.62, 0.3), (0.08, 0.68, 0.22), (0.5, 0.7, 0.1)], "ARDA"),
            ("H", 9, [(0, 0.72, 0.55), (0.2, 0.86, 0.48), (0.5, 0.84, 0.52)], ),
            ("H", 22, [(0, 0.6, 0.62), (0.5, 0.82, 0.62), (0.75, 0.9, 0.58)]),
            ("A", 23, [(0, 0.8, 0.4), (0.25, 0.86, 0.42)]),
            ("A", 5, [(0, 0.84, 0.6), (0.7, 0.88, 0.55)]),
            ("A", 6, [(0, 0.7, 0.45)]),
            ("K", 1, [(0, 0.97, 0.5), (0.3, 0.95, 0.46), (0.8, 0.96, 0.53)]),
        ],
        "ball": [((0.62, 0.3), (0.86, 0.48), 0.08, 0.22, "pass"),
                 ((0.86, 0.48), (0.995, 0.44), 0.24, 0.3, "shot"),
                 ((0.7, 0.1), (0.9, 0.58), 0.55, 0.72, "pass"),
                 ((0.9, 0.58), (0.995, 0.55), 0.74, 0.8, "shot")],
        "events": [(0.3, "GOL! ENDRICK"), (0.8, "GOL! RÜDIGER")],
    },
    "leipzig": {
        "players": [
            ("H", 15, [(0, 0.62, 0.42), (0.1, 0.72, 0.45), (0.5, 0.7, 0.5), (0.65, 0.76, 0.42)], "ARDA"),
            ("H", 8, [(0, 0.55, 0.6), (0.5, 0.6, 0.55)]),
            ("H", 20, [(0, 0.75, 0.65), (0.25, 0.9, 0.55)]),
            ("A", 4, [(0, 0.82, 0.45), (0.6, 0.84, 0.44)]),
            ("A", 5, [(0, 0.84, 0.6)]),
            ("K", 1, [(0, 0.97, 0.5), (0.2, 0.95, 0.48), (0.7, 0.96, 0.5)]),
        ],
        "ball": [((0.55, 0.6), (0.72, 0.45), 0.02, 0.1, "pass"),
                 ((0.72, 0.45), (0.95, 0.5), 0.12, 0.18, "shot"),
                 ((0.95, 0.5), (0.9, 0.56), 0.18, 0.22, "pass"),
                 ((0.9, 0.56), (0.995, 0.53), 0.23, 0.28, "shot"),
                 ((0.6, 0.55), (0.76, 0.42), 0.55, 0.65, "pass"),
                 ((0.76, 0.42), (0.995, 0.4), 0.67, 0.74, "shot")],
        "events": [(0.28, "GOL! BERNARDO"), (0.74, "GOL! ARDA")],
    },
}

REGISTRY = {"datecard": DateCard, "quote": Quote, "jersey": Jersey, "title": Title, "chapter": Chapter,
            "timeline": Timeline, "counter": Counter, "statcards": StatCards, "split": Split, "triangle": Triangle,
            "compare": Compare, "results": Results, "poll": Poll, "lineup": Lineup, "score": Score,
            "dualcounter": DualCounter, "stats": Stats, "versus": Versus, "outro": Outro, "pitch": Pitch}
