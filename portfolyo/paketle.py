#!/usr/bin/env python3
"""Portfolyoyu Netlify Drop için paketler: portfolyo/ + canlı örnek (demolar/ornek-parfum-Netlify.zip → ornek/).

Kullanım: python3 portfolyo/paketle.py  →  demolar/portfolyo-Netlify.zip
Canlı örneği yenilemek için önce: python3 demo-fabrikasi/yeni-demo.py demo-fabrikasi/markalar/ornek-parfum.json
"""
import os
import zipfile

KOK = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PF = os.path.join(KOK, "portfolyo")
ORNEK = os.path.join(KOK, "demolar", "ornek-parfum-Netlify.zip")
CIKTI = os.path.join(KOK, "demolar", "portfolyo-Netlify.zip")

with zipfile.ZipFile(CIKTI, "w", zipfile.ZIP_DEFLATED) as z:
    for kok, _, dosyalar in os.walk(PF):
        for d in dosyalar:
            if d in ("paketle.py", "README.md"):
                continue
            yol = os.path.join(kok, d)
            z.write(yol, os.path.relpath(yol, PF))
    with zipfile.ZipFile(ORNEK) as o:
        for ad in o.namelist():
            # Kök _headers / robots yalnızca portfolyonun kendisinde anlamlı; örnek alt klasörde durur.
            if ad.endswith("/") or ad in ("_headers", "robots.txt"):
                continue
            z.writestr("ornek/" + ad, o.read(ad))
print("✓", os.path.relpath(CIKTI, KOK))
