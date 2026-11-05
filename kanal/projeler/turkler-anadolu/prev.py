import sys, time
from harita import *
from PIL import Image
def snap(view, items, name, t=1.0):
    cam = view_cam(view); s = skia.Surface.MakeRaster(skia.ImageInfo.Make(W, H, skia.ColorType.kRGBA_8888_ColorType, skia.AlphaType.kPremul_AlphaType)); c = s.getCanvas()
    t0 = time.time(); draw_base(c, cam)
    for it in items:
        k, v = it.split(":")
        if k == "emp": draw_terr(c, cam, v, 1.0, 1.0, t)
        elif k == "route": draw_route(c, cam, v, 1.0)
        elif k == "city": draw_city(c, cam, v, 1.0, t, big=v in ("malazgirt", "otuken"))
    Image.fromarray(s.makeImageSnapshot().toarray()).convert("RGB").save(name, quality=90); print(name, round(time.time() - t0, 2), "sn")
snap("genel", ["emp:gokturk", "route:dunya", "city:otuken", "city:konya", "city:malazgirt", "city:cend"], "p_genel.jpg")
snap("anadolu", ["emp:bizans", "route:akin1", "route:akin2", "city:malazgirt", "city:kostantiniyye", "city:konya", "city:iznik"], "p_anadolu.jpg")
