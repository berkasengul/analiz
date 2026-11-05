# İstanbul'un Fethi: yerler, surlar, donanmalar, birlikler, saldırı ve kartlar (temsilî konumlar)
CITY.update({
 "ayasofya": ("Ayasofya", 41.0086, 28.9802), "rumelihisari": ("Rumeli Hisarı", 41.0847, 29.0561), "anadoluhisari": ("Anadolu Hisarı", 41.0822, 29.0669),
 "topkapi_kapi": ("Romanos Kapısı", 41.0215, 28.9240), "galata": ("Galata", 41.0256, 28.9741), "otag": ("Sultanın otağı", 41.0215, 28.9105),
 "edirne": ("Edirne", 41.677, 26.555), "bursa": ("Bursa", 40.188, 29.061), "kostantiniyye": ("Konstantinopolis", 41.01, 28.98),
})
VIEWS.update({"bogaz": (29.0, 41.055, .30), "sehir": (28.958, 41.016, .135), "kara_sur": (28.922, 41.017, .06), "halic": (28.968, 41.029, .085),
              "gemiler": (28.982, 41.035, .07), "rumeli": (29.058, 41.078, .075), "balkan": (27.5, 41.0, 13), "saldiri": (28.9205, 41.0205, .032)})
WALLS = {
 "kara": [(28.9230, 40.9935), (28.9205, 41.0045), (28.9218, 41.0125), (28.9240, 41.0215), (28.9300, 41.0265), (28.9370, 41.0310), (28.9395, 41.0365), (28.9420, 41.0430)],
 "halic": [(28.9420, 41.0430), (28.9465, 41.0385), (28.9500, 41.0338), (28.9560, 41.0295), (28.9620, 41.0250), (28.9670, 41.0215), (28.9730, 41.0178), (28.9800, 41.0168), (28.9858, 41.0150), (28.9880, 41.0130)],
 "marmara": [(28.9880, 41.0130), (28.9845, 41.0070), (28.9800, 41.0028), (28.9720, 41.0018), (28.9650, 41.0010), (28.9560, 41.0022), (28.9500, 41.0030), (28.9400, 40.9995), (28.9300, 40.9962), (28.9230, 40.9935)],
}
# deniz surları: yükseklik verisindeki gerçek kıyı çizgisinden (walls_coast.json)
_WC = os.path.join(V, "walls_coast.json")
if os.path.exists(_WC):
    _w = json.load(open(_WC))
    WALLS["halic"] = [tuple(q) for q in _w["halic"]]; WALLS["marmara"] = [tuple(q) for q in _w["marmara"]]
    WALLS["kara"] = [tuple(_w["C"])] + WALLS["kara"][1:-1] + [tuple(_w["A"])]
CHAIN = [(28.9800, 41.0166), (28.9772, 41.0232)]
BRIDGE = [(28.9440, 41.0420), (28.9470, 41.0450)]
ROUTES.update({
 "karadan": [(28.9995, 41.0388), (28.9930, 41.0405), (28.9850, 41.0410), (28.9760, 41.0398), (28.9690, 41.0372), (28.9640, 41.0345), (28.9615, 41.0322)],
 "yardim": [(29.0300, 41.0050), (29.0050, 41.0120), (28.9900, 41.0180), (28.9790, 41.0200), (28.9700, 41.0250)],
})
# yaklaşık sınırlar
TERR.update({
 "osmanli1451": ("Osmanlı Devleti", [(19.6, 42.6), (21.5, 44.3), (24, 44.2), (27.5, 44.4), (28.6, 43.4), (28.2, 41.9), (28.6, 41.25), (28.85, 41.3), (29.4, 41.6), (32.5, 41.9), (34.6, 41.4), (35.2, 40.0), (33.5, 38.6), (31, 38.2), (28.5, 38.4), (26.6, 39.4), (26.2, 40.4), (24, 40.6), (22.5, 40.2), (21, 40.4), (19.8, 41.2)], (25.0, 42.6)),
 "osmanli1453": ("Osmanlı Devleti", [(19.6, 42.6), (21.5, 44.3), (24, 44.2), (27.5, 44.4), (28.6, 43.4), (28.2, 41.9), (29.0, 41.5), (29.4, 41.6), (32.5, 41.9), (34.6, 41.4), (35.2, 40.0), (33.5, 38.6), (31, 38.2), (28.5, 38.4), (26.6, 39.4), (26.2, 40.4), (24, 40.6), (22.5, 40.2), (21, 40.4), (19.8, 41.2)], (25.0, 42.6)),
 "bizans1453": ("Bizans", [(28.62, 41.06), (28.75, 41.32), (29.05, 41.28), (29.1, 41.02), (28.95, 40.96), (28.7, 40.98)], (28.82, 41.42)),
 "sehir_osm": ("", [(28.9230, 40.9935), (28.9205, 41.0045), (28.9218, 41.0125), (28.9240, 41.0215), (28.9300, 41.0265), (28.9370, 41.0310), (28.9395, 41.0365), (28.9420, 41.0430),
                    (28.9500, 41.0338), (28.9620, 41.0250), (28.9730, 41.0178), (28.9858, 41.0150), (28.9880, 41.0130), (28.9800, 41.0028), (28.9650, 41.0010), (28.9500, 41.0030), (28.9300, 40.9962)], (28.9240, 41.0215)),
})
TERR["sehir_osm"] = ("", WALLS["kara"] + WALLS["halic"][1:] + WALLS["marmara"][1:-1], (28.9240, 41.0215))
GLOW.update({"osmanli": "#FF4E3E", "bizans": "#D96AA6", "sehir_osm": "#FF4E3E"})
OSM_COL = "#B8322A"; YEN_COL = "#8E1F18"; BIZ_COL = "#7D3C8C"

# ---------- şehir dokusu: kiremit çatılar ----------
def _inside(x, y, P):
    ins = False
    for (x0, y0), (x1, y1) in zip(P, P[1:] + P[:1]):
        if (y0 > y) != (y1 > y) and x < (x1 - x0) * (y - y0) / (y1 - y0 + 1e-12) + x0: ins = not ins
    return ins
_ROOFS = None
def roofs():
    global _ROOFS
    if _ROOFS is None:
        rng = np.random.default_rng(14)
        city = TERR["sehir_osm"][1]
        gal = [(28.9705, 41.0215), (28.9790, 41.0222), (28.9775, 41.0290), (28.9715, 41.0280)]
        out = []
        for P, n in ((city, 9000), (gal, 600)):
            xs = [q[0] for q in P]; ys = [q[1] for q in P]
            while n > 0:
                x = rng.uniform(min(xs), max(xs)); y = rng.uniform(min(ys), max(ys))
                if _inside(x, y, P):
                    # surlardan biraz içeride
                    out.append((x, y, rng.uniform(.6, 1.4), rng.integers(0, 4), rng.uniform(-25, 25))); n -= 1
        _ROOFS = out
    return _ROOFS
ROOF_COLS = ["#9C4A32", "#B0603E", "#8A5A44", "#C7A27A"]
def draw_roofs(c, cam, a):
    if a <= 0 or cam[2] < 6000: return
    z = cam[2]
    c.save(); c.translate(W / 2, H / 2); c.scale(z, z); c.translate(-cam[0], -cam[1])
    sz = .000115
    pp = [paint(col, .9 * a) for col in ROOF_COLS]; sh = paint("#1A120C", .35 * a)
    for x, y, s_, k, ang in roofs():
        X, Y = x * KX, -y; w = sz * s_ * KX * 1.3; h = sz * s_
        c.drawRect(skia.Rect.MakeXYWH(X - w / 2 + w * .18, Y - h / 2 + h * .25, w, h), sh)
        c.drawRect(skia.Rect.MakeXYWH(X - w / 2, Y - h / 2, w, h), pp[k])
    c.restore()

def wall_lon(lat):
    P = WALLS["kara"]
    for (a0, b0), (a1, b1) in zip(P, P[1:]):
        if b0 <= lat <= b1: return lerp(a0, a1, (lat - b0) / max(1e-9, b1 - b0))
    return P[-1][0]

def zs(pr, lon, lat, deg=.0013, base=46):
    return clamp(pr.cam[2] * KX * deg / base * pr.scale_at(lon, lat), .35, 2.4)
def ship(c, x, y, s, col, a, t=0.0, k=0, sail="#EDE3CC"):
    if a <= 0: return
    bob = math.sin(t * 2 + k) * 1.5 * s
    sh = paint("#000000", .3 * a); sh.setMaskFilter(skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, 4 * s)); c.drawOval(skia.Rect.MakeXYWH(x - 26 * s, y - 4 * s, 52 * s, 10 * s), sh)
    hull = skia.Path(); hull.moveTo(x - 26 * s, y - 8 * s + bob); hull.lineTo(x + 26 * s, y - 8 * s + bob); hull.lineTo(x + 18 * s, y + bob); hull.lineTo(x - 20 * s, y + bob); hull.close()
    c.drawPath(hull, paint("#4A2E1C", a)); c.drawLine(x - 24 * s, y - 7 * s + bob, x + 24 * s, y - 7 * s + bob, paint(col, a, 2.2 * s))
    c.drawLine(x, y - 8 * s + bob, x, y - 44 * s + bob, paint("#2A1C12", a, 2 * s))
    sl = skia.Path(); sl.moveTo(x - 1 * s, y - 42 * s + bob); sl.quadTo(x + 16 * s, y - 28 * s + bob, x - 1 * s, y - 13 * s + bob); sl.close()
    c.drawPath(sl, paint(sail, a)); c.drawPath(sl, paint("#000000", .2 * a, 1))
    fl = skia.Path(); fl.moveTo(x, y - 44 * s + bob); fl.lineTo(x + 12 * s, y - 41 * s + bob + math.sin(t * 6 + k) * 1.5 * s); fl.lineTo(x, y - 38 * s + bob); fl.close()
    c.drawPath(fl, paint(col, a))

def poly_at(pts, f):
    P = [W2(*q) for q in pts]; L = [0]
    for a_, b_ in zip(P, P[1:]): L.append(L[-1] + math.dist(a_, b_))
    d = L[-1] * clamp(f)
    for i in range(1, len(P)):
        if L[i] >= d:
            u = (d - L[i - 1]) / max(1e-12, L[i] - L[i - 1]); x = lerp(P[i - 1][0], P[i][0], u); y = lerp(P[i - 1][1], P[i][1], u)
            return x / KX, -y
    return pts[-1]

FLEETS = {"osm_bogaz": ((29.0060, 41.0425), 10, OSM_COL), "biz_halic": ((28.9660, 41.0262), 6, BIZ_COL), "osm_halic": ((28.9560, 41.0365), 10, OSM_COL)}
ARMIES = {"osm_kara": "osm", "biz_kara": "biz"}
CANNONS = [(28.9180, 41.0210), (28.9165, 41.0120), (28.9205, 41.0290), (28.9150, 41.0050)]

def fetih_world(c, cam, t, pr, live):
    for kind, name, ivs in live:
        a = alpha(ivs, t)
        if a > 0 and kind == "roofs": draw_roofs(c, cam, a)
    for kind, name, ivs in live:
        a = alpha(ivs, t)
        if a <= 0: continue
        st = started(ivs, t) or 0
        if kind == "wall":
            polyline_world(c, cam, WALLS[name], a, "#F2E2BC", 6 if name == "kara" else 4, glow=True, p=eio(prog(t, st, st + 2.6)))
            if name == "kara":   # dış sur + hendek
                off = [(x - .0006, y) for x, y in WALLS[name]]
                polyline_world(c, cam, off, a * .8, "#D8C69C", 3, glow=False, p=eio(prog(t, st + .4, st + 3.0)))
                off2 = [(x - .0011, y) for x, y in WALLS[name]]
                polyline_world(c, cam, off2, a * .6, "#3C6E7E", 3, glow=False, p=eio(prog(t, st + .8, st + 3.4)))
        elif kind == "chain":
            polyline_world(c, cam, CHAIN, a, "#FFD36A", 5, glow=True, dash=(10, 6), p=eio(prog(t, st, st + 1.5)))
        elif kind == "bridge":
            polyline_world(c, cam, BRIDGE, a, "#A0743C", 9, glow=False, p=eio(prog(t, st, st + 1.5)))

def fetih_screen(c, t, pr, live, in_assault):
    items = []
    for kind, name, ivs in live:
        a = alpha(ivs, t)
        if a <= 0: continue
        st = started(ivs, t) or 0
        if kind == "fleet":
            (lon, lat), n, col = FLEETS[name]
            for k in range(n):
                lo = lon + ((k % 4) - 1.5) * .0035 + (k // 4) * .0012; la = lat + (k // 4) * .0022 - ((k % 4) % 2) * .0008
                items.append((pr(lo, la), "ship", col, a, k, zs(pr, lo, la, .0017, 52)))
        elif kind == "ships":
            n = 12 if name == "karadan" else 4; dur = 7.0 if name == "karadan" else 5.0
            for k in range(n):
                f = clamp((t - st - k * (.45 if name == "karadan" else .5)) / dur)
                if f <= 0: continue
                lon, lat = poly_at(ROUTES[name], f)
                items.append((pr(lon, lat), "ship", OSM_COL if name == "karadan" else "#C8A040", a, k, zs(pr, lon, lat, .0017, 52)))
        elif kind == "army" and not in_assault:
            if name == "osm_kara":
                for k in range(14):
                    la = 40.998 + k * .0028; lo = wall_lon(la) - .0062 - (k % 2) * .0018
                    items.append((pr(lo, la), "unit", OSM_COL if k % 3 else YEN_COL, a, k, zs(pr, lo, la)))
            else:
                for k in range(9):
                    la = 41.000 + k * .0042; lo = wall_lon(la) + .0012
                    items.append((pr(lo, la), "unit", BIZ_COL, a * .95, k, zs(pr, lo, la)))
        elif kind == "cannons":
            for k, (lo, la) in enumerate(CANNONS):
                x, y = pr(lo, la); sc = zs(pr, lo, la, .0012, 40)
                cannon(c, x, y, sc, a, t, k)
        elif kind == "fire":
            lo, la = 28.9240, 41.0215; x, y = pr(lo, la); smoke_fire(c, x, y, zs(pr, lo, la, .0015, 30), a, t, 3)
    items.sort(key=lambda it: it[0][1])
    for (x, y), what, col, a, k, sc in items:
        if not (-100 < x < W + 100 and -100 < y < H + 100): continue
        if what == "ship": ship(c, x, y, sc, col, a, t, k)
        else: unit(c, x, y, sc, col, a, flag=(k % 3 == 0), t=t, k=k)

def cannon(c, x, y, s, a, t, k):
    per = 2.6; ph = ((t + k * .7) % per) / per
    rrect(c, x - 18 * s, y - 10 * s, 36 * s, 12 * s, 5 * s, "#2B2B2B", a)
    c.drawCircle(x - 12 * s, y + 2 * s, 6 * s, paint("#4A2E1C", a)); c.drawCircle(x + 10 * s, y + 2 * s, 6 * s, paint("#4A2E1C", a))
    if ph < .12:
        g = paint("#FFD36A", a * (1 - ph / .12)); g.setMaskFilter(skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, 14 * s)); c.drawCircle(x + 26 * s, y - 6 * s, 22 * s, g)
    for i in range(4):
        q = (ph + i * .18) % 1
        g = paint("#D9D2C8", .35 * (1 - q) * a); g.setMaskFilter(skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, 10 * s))
        c.drawCircle(x + 26 * s + q * 70 * s, y - 10 * s - q * 50 * s, (8 + 30 * q) * s, g)

def assault_map(c, t, r, a, pr):
    p = param(r, t)
    def tp(k):
        v = first_t(r, lambda x: x >= k); return 1e9 if v is None else v
    q = [eio(prog(t, tp(k), tp(k) + 3.0)) for k in range(6)]
    items = []
    # savunucular surda
    for k in range(14):
        la = 41.0115 + k * .0015; lo = wall_lon(la) + .0008
        items.append(((lo, la), "unit", BIZ_COL, a * (1 - q[4] * .85), k))
    waves = [(1, "#C8564A"), (2, OSM_COL), (3, YEN_COL)]
    for w, col in waves:
        for k in range(16):
            row = k // 8; la = 41.0140 + (k % 8) * .0016 + row * .0007
            wl = wall_lon(la)
            x0 = wl - .0095 - (w - 1) * .0020 - row * .0011
            adv = q[w]; ret = q[w + 1] if w < 3 else 0
            tgt = wl - .0014 - row * .0009
            lo = x0 + (tgt - x0) * adv - (tgt - x0) * .55 * ret
            if w == 3 and q[4] > 0:
                lo = lerp(lo, wl + .0025 + (k % 4) * .0011, q[4]); la = lerp(la, 41.0215 + ((k % 8) - 3.5) * .0007, q[4])
            if w == 3 and q[5] > 0: lo += .004 * q[5]
            al = 0 if (adv <= 0 and w > 1 and p < w) else 1
            items.append(((lo, la), "unit", col, a * al * (1 if w == 3 or ret < .9 else .45), k + 20 * w))
    items.sort(key=lambda it: pr(*it[0])[1])
    for (lo, la), what, col, al, k in items:
        x, y = pr(lo, la); sc = zs(pr, lo, la, .0011)
        if al > 0:
            moving = any(0 < qq < 1 for qq in q[1:5])
            if moving and col != BIZ_COL: dust(c, x, y, sc, a * al, t, k)
            unit(c, x, y, sc, col, al, flag=(k % 4 == 0), t=t, k=k)
    for k, (lo, la) in enumerate(CANNONS[:3]):
        x, y = pr(lo, la); cannon(c, x, y, zs(pr, lo, la, .0012, 40), a * (1 - q[4]), t, k)
    if q[3] > 0:
        x, y = pr(28.9240, 41.0215); smoke_fire(c, x, y, zs(pr, 28.924, 41.0215, .0015, 30), a * q[3], t, 5)
    if q[4] > 0:   # sancak
        x, y = pr(28.9242, 41.0215); h = 70 * eout(q[4])
        c.drawLine(x, y, x, y - h, paint("#1A1A1A", a, 3))
        fl = skia.Path(); fl.moveTo(x, y - h); fl.lineTo(x + 34, y - h + 8 + math.sin(t * 6) * 3); fl.lineTo(x, y - h + 18); fl.close()
        c.drawPath(fl, paint("#C8302A", a * q[4]))
    if q[5] > 0:
        c.save(); c.concat(pr.M); terr_world(c, pr.cam, "sehir_osm", a * q[5], q[5], t); c.restore()
    labs = {0: "Saldırı başlıyor", 1: "1. dalga", 2: "2. dalga", 3: "3. dalga: yeniçeriler", 4: "Gedik", 5: "Şehir düştü"}
    text(c, labs.get(p, ""), W / 2, 205, "i", 46, "#FFB27A", a, align="center")
    text(c, "temsilî şema", W - 60, 160, "i", 30, "#FFFFFF", .75 * a, align="right")

# ---------- kartlar ----------
def card_title_f(c, t, r, a):
    text(c, "İstanbul'un", W / 2, 400, "b", 132, PAPER_INK, a, align="center", track=-2)
    text(c, "Fethi", W / 2, 590, "i", 210, RED, a, align="center")
    q = eout(prog(t, r["t0"] + .6, r["t0"] + 1.2))
    for k, s_ in enumerate(["6 Nisan → 29 Mayıs 1453", "53 gün", "21 yaşında bir sultan"]):
        chip(c, W / 2 - 520 + k * 520, 730, s_, ["#1B2636", "#C0392B", "#1B2636"][k], 32, a * q)

def card_sur(c, t, r, a):
    p = param(r, t)
    text(c, "Kara surlarının kesiti", W / 2, 210, "b", 64, PAPER_INK, a, align="center")
    gy = 760
    g = skia.Paint(); g.setShader(skia.GradientShader.MakeLinear([skia.Point(0, gy), skia.Point(0, H)], [C("#4A3A28", a).toColor(), C("#2A2016", a).toColor()]))
    c.drawRect(skia.Rect.MakeLTRB(160, gy, W - 160, gy + 140), g)
    parts = [("Hendek", 360, "moat"), ("Dış sur", 800, "outer"), ("İç sur", 1300, "inner")]
    for k, (nm, x, kind) in enumerate(parts):
        tk = r["t0"] + .3 + k * .7
        qq = eback(prog(t, tk, tk + .6))
        if qq <= 0: continue
        c.save(); c.translate(x, gy); c.scale(1, qq)
        if kind == "moat":
            pth = skia.Path(); pth.moveTo(-200, 0); pth.lineTo(-170, 110); pth.lineTo(170, 110); pth.lineTo(200, 0); pth.close()
            c.drawPath(pth, paint("#2E5E6E", a)); c.drawPath(pth, paint("#86AEB5", .6 * a, 3))
        else:
            hh = 210 if kind == "outer" else 360; ww = 70 if kind == "outer" else 110
            stone = skia.Paint(); stone.setShader(skia.GradientShader.MakeLinear([skia.Point(-ww, -hh), skia.Point(ww, 0)], [C("#D8C7A0", a).toColor(), C("#9C8A68", a).toColor()]))
            c.drawRect(skia.Rect.MakeLTRB(-ww / 2, -hh, ww / 2, 0), stone)
            for i in range(-2, 3): c.drawRect(skia.Rect.MakeXYWH(i * ww / 5 - 6, -hh - 22, 14, 22), stone)
            tw_ = ww * 1.5; c.drawRect(skia.Rect.MakeLTRB(-tw_ / 2 + (90 if kind == "inner" else 60), -hh - 60, tw_ / 2 + (90 if kind == "inner" else 60), 0), stone) if False else None
            for yy in range(-hh + 30, 0, 34): c.drawLine(-ww / 2, yy, ww / 2, yy, paint("#7C6C50", .5 * a, 2))
        c.restore()
        text(c, nm, x, gy + 190, "b", 44, PAPER_INK, a * eout(prog(t, tk + .3, tk + .8)), align="center")
    if p >= 1:
        t1 = first_t(r, lambda v: v >= 1); q2 = eout(prog(t, t1 + .3, t1 + .9))
        text(c, "yaklaşık 6 km · Marmara'dan Haliç'e", W / 2, 300, "i", 44, ORANGE_T, a * q2, align="center")

def card_top(c, t, r, a):
    p = param(r, t)
    cx, cy = 720, 600
    q = eback(prog(t, r["t0"] + .2, r["t0"] + .8))
    c.save(); c.translate(cx, cy); c.scale(q, q); c.rotate(-8)
    barrel = skia.Paint(); barrel.setShader(skia.GradientShader.MakeLinear([skia.Point(0, -60), skia.Point(0, 60)], [C("#8C6A3C", a).toColor(), C("#3E2C16", a).toColor()]))
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect.MakeLTRB(-380, -62, 330, 62), 30, 30), barrel)
    for x in (-300, -120, 80, 250): c.drawRect(skia.Rect.MakeLTRB(x, -70, x + 26, 70), paint("#5A3E1C", a))
    c.drawCircle(330, 0, 50, paint("#1A120A", a)); c.drawCircle(330, 0, 62, paint("#6A4C24", a, 10))
    c.drawRect(skia.Rect.MakeLTRB(-320, 62, 260, 110), paint("#3A2A18", a))
    c.restore()
    if p >= 2:
        t2 = first_t(r, lambda v: v >= 2); qq = eio(prog(t, t2 + .2, t2 + 1.4))
        bx = lerp(1080, 1500, qq)
        st_ = skia.Paint(); st_.setShader(skia.GradientShader.MakeRadial(skia.Point(bx - 20, 520), 90, [C("#D8D0C0", a).toColor(), C("#7A7268", a).toColor()]))
        c.drawCircle(bx, 540, 80, st_)
        text(c, "taş gülle", bx, 680, "i", 40, PAPER_INK, a, align="center")
    text(c, "Dev toplar", 1240, 300, "b", 70, PAPER_INK, a)
    if p >= 1:
        t1 = first_t(r, lambda v: v >= 1); q1 = eout(prog(t, t1 + .2, t1 + .8))
        text(c, "Top ustası Urban", 1244, 360, "m", 36, MUTED, a * q1)

def card_kizak(c, t, r, a):
    text(c, "22 Nisan 1453", W / 2, 220, "i", 56, ORANGE_T, a, align="center")
    text(c, "Gemiler karadan", W / 2, 320, "b", 96, PAPER_INK, a, align="center")
    hill = skia.Path(); hill.moveTo(160, 860); hill.cubicTo(600, 560, 1300, 560, W - 160, 860); hill.close()
    c.drawPath(hill, paint("#3E4A2E", a)); c.drawPath(hill, paint("#6E7A4E", .7 * a, 3))
    f = eio(prog(t, r["t0"] + .3, r["t0"] + 4.5))
    def hp(u):
        x = lerp(160, W - 160, u); y = 860 - 300 * (4 * u * (1 - u)) * .75 - 6; return x, y
    for i in range(14):
        x, y = hp(i / 13); c.drawLine(x - 22, y + 4, x + 22, y + 4, paint("#7A5A30", a, 7))
    x, y = hp(.12 + .76 * f); ship(c, x, y - 4, 2.2, "#C8302A", a, t, 1)
    text(c, "yağlanmış kızaklar · ~70 gemi", W / 2, 960, "i", 40, PAPER_INK, .85 * a, align="center")

def card_fatih(c, t, r, a):
    q = eout(prog(t, r["t0"] + .2, r["t0"] + 1.4))
    c.save(); c.translate(W / 2, 560); s_ = .9 + .1 * q; c.scale(s_, s_)
    text(c, "FATİH", 0, 0, "b", 260, RED, a * q, align="center", track=24)
    c.restore()
    text(c, "II. Mehmed · 21 yaşında", W / 2, 700, "i", 56, PAPER_INK, a * q, align="center")

def card_cag(c, t, r, a):
    q = eio(prog(t, r["t0"] + .3, r["t0"] + 2.0))
    x0, x1, y = 300, W - 300, 560
    c.drawLine(x0, y, x1, y, paint("#4A5466", a, 8)); c.drawLine(x0, y, lerp(x0, W / 2, q), y, paint(MUTED, a, 8))
    c.drawLine(W / 2, y, lerp(W / 2, x1, clamp(q * 2 - 1)), y, paint(RED, a, 8))
    text(c, "Orta Çağ", (x0 + W / 2) / 2, y - 50, "b", 56, PAPER_INK, a, align="center")
    text(c, "Yeni Çağ", (W / 2 + x1) / 2, y - 50, "b", 56, RED, a * clamp(q * 2 - 1), align="center")
    c.drawCircle(W / 2, y, 26, paint(RED, a)); text(c, "1453", W / 2, y + 90, "b", 64, PAPER_INK, a, align="center")
    text(c, "pek çok tarihçiye göre", W / 2, y + 160, "i", 38, MUTED, a, align="center")

OZET_F = [("1452", "Rumeli Hisarı"), ("6 Nisan", "Kuşatma"), ("22 Nisan", "Gemiler karadan"), ("29 Mayıs", "Fetih")]
def card_ozet_f(c, t, r, a):
    p = param(r, t)
    text(c, "53 günde fetih", W / 2, 260, "b", 84, PAPER_INK, a, align="center")
    x0, x1, y = 300, W - 300, 560
    c.drawLine(x0, y, x1, y, paint("#4A5466", a, 6))
    for k, (yr, s_) in enumerate(OZET_F):
        tk = first_t(r, lambda v, k=k: v >= k + 1)
        if tk is None: continue
        qq = eback(prog(t, tk + .05, tk + .5)); xx = lerp(x0, x1, k / (len(OZET_F) - 1)); on_ = p == k + 1
        c.drawLine(x0, y, xx, y, paint(RED, a, 6))
        c.save(); c.translate(xx, y); c.scale(qq, qq)
        c.drawCircle(0, 0, 30 if on_ else 22, paint(RED if on_ else "#2A3546", a)); c.drawCircle(0, 0, 10, paint("#141C28", a))
        text(c, yr, 0, -60, "b", 52 if on_ else 44, RED if on_ else PAPER_INK, a, align="center")
        text(c, s_, 0, 80, "s", 32, PAPER_INK, a, align="center")
        c.restore()
FETIH_CARDS = {"title": card_title_f, "sur": card_sur, "top": card_top, "kizak": card_kizak, "fatih": card_fatih, "cag": card_cag, "ozet": card_ozet_f}
