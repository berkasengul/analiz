"""Per-material placement of an imported model in bowl coordinates (d = distance out from the pitch edge, y = height).
Usage: python3 -I tools/measure_model.py <stadium-id> model1.gltf.json [model2 ...]
Reads geometry/placement constants from the matching config (passed via env-free args below).
"""
import json, base64, sys, math
import numpy as np

CFG = {  # A0, B0, SEN, KA, KB, pitch(x,y,z), rotY, scale
    'fb': (7.0, 6.0, 7.0, 1.0, 1.02, (158.5, 0, -110.5), 0, 0.94),
    'bjk': (7.5, 6.5, 3.0, 1.0, 0.86, (0, 0, 0), 90, 1.0),
    'fbw': (7.0, 6.0, 7.0, 1.0, 1.02, (81.2, 0, -103.3), 90, (1.16, 1.2, 1.266)),
}
a0, b0, SEN, KA, KB, pitch, rot, scale = CFG[sys.argv[1]]
A0 = 105 / 2 + a0; B0 = 68 / 2 + b0


def rAt(phi, d):
    a = A0 + d * KA; b = B0 + d * KB
    return ((abs(math.cos(phi)) / a) ** SEN + (abs(math.sin(phi)) / b) ** SEN) ** (-1 / SEN)


def dOf(x, z):
    ph = math.atan2(z, x); r = math.hypot(x, z); lo, hi = -35, 140
    for _ in range(28):
        m = (lo + hi) / 2
        if rAt(ph, m) < r: lo = m
        else: hi = m
    return lo


th = math.radians(rot); c, s = math.cos(th), math.sin(th)
for path in sys.argv[2:]:
    J = json.load(open(path)); B = base64.b64decode(J['buffers'][0]['uri'].split(',', 1)[1])
    for p in J['meshes'][0]['primitives']:
        a = J['accessors'][p['attributes']['POSITION']]; v = J['bufferViews'][a['bufferView']]
        P = np.frombuffer(B, dtype=np.float32, count=a['count'] * 3, offset=v.get('byteOffset', 0) + a.get('byteOffset', 0)).reshape(-1, 3).astype(float)
        sc = scale if isinstance(scale, tuple) else (scale, scale, scale)
        x = (P[:, 0] - pitch[0]) * sc[0]; y = (P[:, 1] - pitch[1]) * sc[1]; z = (P[:, 2] - pitch[2]) * sc[2]
        wx = x * c + z * s; wz = -x * s + z * c
        idx = np.random.default_rng(0).choice(len(P), min(1200, len(P)), replace=False)
        D = np.array([dOf(wx[i], wz[i]) for i in idx]); Y = y[idx]
        name = J['materials'][p['material']].get('name') if 'material' in p else '-'
        print(f"{name[:26]:26s} n{len(P):7d} d[{D.min():6.1f},{np.median(D):6.1f},{D.max():6.1f}] y[{Y.min():5.1f},{np.median(Y):5.1f},{Y.max():5.1f}]")
