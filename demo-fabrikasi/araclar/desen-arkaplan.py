#!/usr/bin/env python3
"""Parfüm butiği için çizilmiş arka plan (theme.plate olarak kullanılır).

Duvar: kabartma sekiz köşeli yıldız ve haç deseni (Selçuklu / Mardin taş işçiliği), yıldızların kenarında
altın kakma çizgi, ortalarında sekiz yapraklı gül. Ortada sivri kemerli niş: içi arkadan aydınlatılmış bal
rengi oniks, çevresinde altın kenarlı taş çerçeve. Zemin: cilalı siyah mermer, duvarı bulanık yansıtır.
Işık nişten ve tepeden gelir; kenarlar karanlığa iner. Görsel ürünlerle aynı sıcak ışıkta, fotoğraf değil.

Kullanım:
  python3 desen-arkaplan.py çıktı.jpg [--duvar "#2a0c10"] [--altin "#d9b27a"] [--oniks "#f0b25a"]
Çıktı 3000×1140 (en/boy 2.632); zemin çizgisi v = 0.658, kemerin ortası x = 0.5.
"""
import argparse

import cv2
import numpy as np

W, H = 3000, 1140
SEAM = 0.658  # duvar dibi (v)


def hexrgb(h):
    h = h.lstrip("#")
    return np.array([int(h[i : i + 2], 16) / 255 for i in (0, 2, 4)], np.float32)


def lin(c):
    return np.power(c, 2.2)


def smooth(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0, 1)
    return t * t * (3 - 2 * t)


def fbm(h, w, seed, base=6, octaves=6):
    rng = np.random.default_rng(seed)
    out = np.zeros((h, w), np.float32)
    amp, tot = 1.0, 0.0
    for o in range(octaves):
        gh, gw = base * 2**o, int(base * 2**o * w / h) + 1
        g = rng.random((gh + 1, gw + 1)).astype(np.float32)
        out += amp * cv2.resize(g, (w, h), interpolation=cv2.INTER_CUBIC)
        tot += amp
        amp *= 0.5
    return out / tot


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("out")
    ap.add_argument("--duvar", default="#3a0a18")
    ap.add_argument("--altin", default="#d9b27a")
    ap.add_argument("--oniks", default="#f2b25e")
    ap.add_argument("--tile", type=float, default=140)
    a = ap.parse_args()

    wall_c = lin(hexrgb(a.duvar))
    gold_c = lin(hexrgb(a.altin))
    onyx_c = lin(hexrgb(a.oniks))

    y, x = np.mgrid[0:H, 0:W].astype(np.float32)
    cx = W / 2
    ys_floor = SEAM * H

    # --- Kemer (sivri): yarım genişlik aw, yay yarıçapı R; üzengi hattı ys.
    aw, R = 320.0, 320.0 * 1.55
    apex = 90.0
    ys = apex + np.sqrt(R * R - (R - aw) ** 2)
    c1, c2 = cx - (R - aw), cx + (R - aw)
    d_top = np.maximum(np.hypot(x - c1, y - ys) - R, np.hypot(x - c2, y - ys) - R)
    d_side = np.abs(x - cx) - aw
    arch = np.where(y > ys, d_side, d_top)  # < 0: niş içi
    FRAME = 44.0

    # --- Duvar deseni: yıldız ve haç. Hücre boyu T; yıldız = kare ∪ 45° dönük kare.
    T = a.tile
    X = (x - cx) / T + 0.5
    Y = (y - ys_floor) / T
    px = X - np.floor(X) - 0.5
    py = Y - np.floor(Y) - 0.5
    h = 0.3536
    d1 = np.maximum(np.abs(px), np.abs(py)) - h
    qx, qy = (px + py) / np.sqrt(2), (px - py) / np.sqrt(2)
    d2 = np.maximum(np.abs(qx), np.abs(qy)) - h
    star = np.minimum(d1, d2) * np.float32(0.92)  # < 0: yıldız
    r = np.hypot(px, py)
    th = np.arctan2(py, px)
    petal = r - 0.12 * (0.72 + 0.28 * np.cos(8 * th))

    # Yükseklik alanı: yıldızlar kabarık (pahlı), haçlar düz ve biraz gömük, gül yıldızın içinde kabarık.
    # Yıldız yastık gibi kabarık (ortası yüksek), kenarı pahlı; ortasındaki gül ayrıca kabarık.
    hs = smooth(0.0, -0.05, star) * 0.7 + smooth(-0.02, -0.22, star) * 0.9
    hs += smooth(0.0, -0.025, petal) * 0.5
    groove = 1 - smooth(0.0, 0.013, np.abs(star))  # altın kakma
    rose_line = 1 - smooth(0.0, 0.008, np.abs(petal))
    dot = 1 - smooth(0.018, 0.03, r)

    # Çerçeve: nişi saran kabartma taş bant, iki kenarında altın çizgi.
    band = (arch > 0) & (arch < FRAME)
    frame_h = smooth(0, 10, arch) * smooth(FRAME, FRAME - 10, arch)
    hs = np.where(arch < FRAME + 6, frame_h * 1.2, hs)
    frame_gold = (1 - smooth(0, 3.2, np.abs(arch - 2))) + (1 - smooth(0, 2.6, np.abs(arch - FRAME + 3)))
    # Çerçevenin ortasında ince boncuk dizisi.
    s_along = np.where(y > ys, y, np.arctan2(y - ys, x - cx) * (aw + FRAME / 2)) / 18.0
    bead = (1 - smooth(0.18, 0.32, np.hypot(s_along - np.round(s_along), (arch - FRAME / 2) / 18.0))) * band

    hs = cv2.GaussianBlur(hs.astype(np.float32), (0, 0), 1.2)
    gy, gx = np.gradient(hs)
    k = 9.0
    nx, ny, nz = -gx * k, -gy * k, np.ones_like(hs)
    nl = np.sqrt(nx * nx + ny * ny + nz * nz)
    nx, ny, nz = nx / nl, ny / nl, nz / nl

    # Işıklar: niş içinden taşan sıcak ışık (kemerin ağzından), tepeden yumuşak bir spot.
    def light(lx, ly, lz):
        vx, vy, vz = lx - x, ly - y, lz - hs * 20
        vl = np.sqrt(vx * vx + vy * vy + vz * vz)
        vx, vy, vz = vx / vl, vy / vl, vz / vl
        diff = np.clip(nx * vx + ny * vy + nz * vz, 0, 1)
        hx, hy, hz = vx, vy, vz + 1
        hl = np.sqrt(hx * hx + hy * hy + hz * hz)
        spec = np.clip((nx * hx + ny * hy + nz * hz) / hl, 0, 1)
        return diff, spec

    dA, sA = light(cx, ys + 60, 260)
    dB, sB = light(cx, -400, 500)
    pool = np.exp(-(((x - cx) / 640) ** 2) - (((y - ys) / 480) ** 2))
    side = np.exp(-(((x - cx) / 1300) ** 2))
    Lw = 0.02 + 1.0 * pool + 0.22 * side

    # Duvar malzemesi: koyu lake (yıldızlar biraz daha açık, kadife parıltı), altın kakma.
    veil = fbm(H, W, 3, base=4, octaves=5)
    lacq = wall_c[None, None, :] * (0.85 + 0.3 * veil[..., None])
    stars_in = smooth(0.0, -0.02, star)[..., None]
    base = lacq * (0.75 + 0.45 * stars_in)
    shade = (0.45 * dA + 0.25 * dB)[..., None] * Lw[..., None]
    col = base * (0.12 + 3.2 * shade)
    col += base * 1.4 * (np.power(sA, 30) * 0.5)[..., None] * Lw[..., None]
    gold_amt = np.clip(groove * 0.95 + rose_line * 0.8 + dot * 0.7, 0, 1)
    # Altın parıltısı yere göre değişir (fırçalanmış metal): ışığa bakan kenarlar parlar, uzakta söner.
    shimmer = 0.6 + 0.8 * fbm(H, W, 31, base=10, octaves=3)
    gspec = np.power(sA, 14) * 1.8 + np.power(sB, 20) * 0.5
    gold = gold_c[None, None, :] * ((0.04 + 0.7 * dA * Lw + gspec * Lw * shimmer)[..., None])
    col = col * (1 - gold_amt[..., None]) + gold * gold_amt[..., None]

    # Çerçeve taşı: sıcak kum rengi (Mardin taşı), ışıkta bal gibi.
    stone = lin(np.array([0.42, 0.3, 0.2], np.float32))
    fcol = stone[None, None, :] * (0.08 + 1.3 * (0.5 * dA + 0.3 * dB)[..., None] * (0.25 + Lw[..., None]))
    fcol = fcol * (1 - bead[..., None] * 0.0) + gold_c * bead[..., None] * (0.3 + 1.2 * Lw[..., None])
    fg = np.clip(frame_gold, 0, 1)[..., None]
    fcol = fcol * (1 - fg) + gold_c * fg * (0.35 + 1.5 * Lw[..., None] + np.power(sA, 20)[..., None])
    inF = ((arch >= 0) & (arch < FRAME + 1))[..., None]
    col = np.where(inF, fcol, col)

    # Niş içi: arkadan aydınlatılmış oniks. Damarlar fbm; merkez parlak, kenarlara ve tepeye doğru kararır.
    n1 = fbm(H, W, 11, base=3, octaves=6)
    n2 = fbm(H, W, 17, base=5, octaves=5)
    veins = np.abs(np.sin((n1 * 16 + n2 * 4 + (y - ys) / 700 + (x - cx) / 1600) * np.pi))
    vein = 1 - smooth(0.0, 0.09, veins)
    band_o = 0.5 + 0.5 * np.sin((n1 * 14 + y / 260) * 1.3)
    # Işık nişin dibinden (ürünün arkasından) yükselir: altta ve ortada sıcak, tepeye doğru koyu kehribar.
    glow = np.exp(-(((x - cx) / (aw * 0.8)) ** 2) - (((y - (ys_floor - 170)) / 330) ** 2))
    glow2 = np.exp(-(((x - cx) / (aw * 1.3)) ** 2) - (((y - (ys + 60)) / 520) ** 2))
    inner_dark = smooth(0, -90, arch)  # kenarda gölge (niş derinliği)
    # Niş içi: arkadan aydınlatılmış dikey yivli buzlu cam. Her yiv ortasında parlak, kenarında koyu;
    # yivin tepesinde ince parıltı. Işık nişin dibinden yükselir, tepeye doğru koyu kehribara iner.
    P = 26.0
    u = ((x - cx) / P) % 1.0
    rib = np.sqrt(np.clip(1 - (2 * u - 1) ** 2, 0, 1))
    ridge = np.exp(-(((u - 0.5) / 0.08) ** 2))
    frost = 0.9 + 0.2 * n2
    lum = 0.02 + 0.34 * glow + 0.09 * glow2
    onyx = onyx_c[None, None, :] * (lum * (0.68 + 0.36 * rib) * frost)[..., None]
    onyx += lin(np.array([1.0, 0.86, 0.6], np.float32)) * (ridge * lum * 0.2)[..., None]
    onyx *= (0.15 + 0.85 * inner_dark)[..., None]
    col = np.where((arch < 0)[..., None], onyx, col)
    # Nişten taşan ışık çerçeveyi ve duvarı yalar.
    spill = np.exp(-np.clip(arch, 0, None) / 120) * (arch >= 0) * smooth(ys_floor, ys_floor - 400, y) * 0 + np.exp(
        -np.clip(arch, 0, None) / 160
    ) * (arch >= 0)
    col += onyx_c * (spill * 0.06)[..., None]

    # --- Zemin: cilalı siyah mermer; duvarın aynası, uzaklaştıkça bulanık ve soluk.
    fl = y >= ys_floor
    dy = (y - ys_floor).astype(np.float32)
    src = np.clip(ys_floor - dy * 1.0, 0, H - 1).astype(np.int32)
    wall_img = col.copy()
    mir = [wall_img, cv2.GaussianBlur(wall_img, (0, 0), 4), cv2.GaussianBlur(wall_img, (0, 0), 12), cv2.GaussianBlur(wall_img, (0, 0), 28)]
    mir = [m[src, x.astype(np.int32)] for m in mir]
    tq = np.clip(dy / (H - ys_floor), 0, 1)[..., None] * 3
    i0 = np.clip(np.floor(tq), 0, 2).astype(np.int32)
    f = tq - i0
    stack = np.stack(mir, 0)
    ii = i0[..., 0]
    a0 = np.take_along_axis(stack, ii[None, ..., None].repeat(3, -1), 0)[0]
    a1 = np.take_along_axis(stack, (ii + 1)[None, ..., None].repeat(3, -1), 0)[0]
    refl = a0 * (1 - f) + a1 * f
    m1 = fbm(H, W, 23, base=4, octaves=6)
    mv = 1 - smooth(0.0, 0.05, np.abs(np.sin((m1 * 7 + x / 1400) * np.pi)))
    marble = lin(np.array([0.05, 0.04, 0.037], np.float32)) * (0.8 + 0.4 * m1[..., None]) + gold_c * (mv * 0.035)[..., None]
    fres = 0.55 * np.exp(-dy / 260)[..., None] + 0.12
    floor_pool = np.exp(-(((x - cx) / 800) ** 2) - (((y - ys_floor - 90) / 160) ** 2))
    fcol2 = marble * (0.4 + 1.6 * floor_pool[..., None]) + refl * fres
    col = np.where(fl[..., None], fcol2, col)
    # Süpürgelik: duvar dibinde koyu bant ve üstünde ince altın çizgi.
    skirt = (y > ys_floor - 22) & (y < ys_floor)
    col = np.where(skirt[..., None], col * 0.35, col)
    gl = (1 - smooth(0, 2.2, np.abs(y - (ys_floor - 23)))) * (arch >= FRAME)
    col += gold_c * (gl * (0.2 + 1.2 * pool))[..., None]

    # Kenarlar karanlığa iner.
    vig = np.exp(-(((x - cx) / 1350) ** 4)) * (0.3 + 0.7 * smooth(-150, 320, y))
    col *= (0.25 + 0.75 * vig)[..., None]

    # Ton eşleme (ACES yaklaşımı) ve sRGB.
    col = np.clip(col * 1.35, 0, None)
    col = (col * (2.51 * col + 0.03)) / (col * (2.43 * col + 0.59) + 0.14)
    col = np.power(np.clip(col, 0, 1), 1 / 2.2)
    col += (np.random.default_rng(5).random(col.shape[:2]).astype(np.float32)[..., None] - 0.5) / 255
    out = (np.clip(col, 0, 1) * 255 + 0.5).astype(np.uint8)
    cv2.imwrite(a.out, cv2.cvtColor(out, cv2.COLOR_RGB2BGR), [cv2.IMWRITE_JPEG_QUALITY, 92])
    print("✓", a.out, out.shape)


if __name__ == "__main__":
    main()
