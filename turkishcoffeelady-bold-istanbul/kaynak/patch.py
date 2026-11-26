import sys, pathlib

src = pathlib.Path(sys.argv[1]).read_text(encoding="utf-8")
out = sys.argv[2]
extra = pathlib.Path(sys.argv[3]).read_text(encoding="utf-8")


def rep(old, new, count=1):
    global src
    n = src.count(old)
    if n != count:
        raise SystemExit(f"expected {count} of {old[:80]!r}, found {n}")
    src = src.replace(old, new)


# --- single product: Bold Istanbul only
rep("nq = [0, 1, 2, 3, 4],", "nq = [0],")
rep("      flavor: 1,\n", "      flavor: 0,\n")
rep("      flavor: 2,\n", "      flavor: 0,\n")
rep("    catalog: KY,", "    catalog: { ...KY, items: KY.items.slice(0, 1) },")
rep("ft.catalog && w.jsx(jZ, {}),", "!1 && w.jsx(jZ, {}),")

# --- multi-page: home (3D hero + short intro) and #/urun, #/hikaye, #/film, #/iletisim
rep("function NK() {", extra + "\nfunction NK() {")
rep(
    """          : w.jsxs("main", {
              children: [
                o,
                w.jsx(oK, {}),
                j2 && w.jsx(LZ, {}),
                !1 && w.jsx(jZ, {}),
                xK && w.jsx(_K, {}),
                !gf && w.jsx(gK, {}),
                w.jsxs("div", {
                  className: `epilogue${rk ? " epilogue--stage" : ""}`,
                  children: [
                    rk && w.jsx(yK, {}),
                    w.jsx(lK, {}),
                    !Za.has("story") && w.jsx(cK, {}),
                    !Za.has("stockists") && w.jsx(fK, {}),
                    w.jsx(pK, {}),
                    w.jsx(nk, {}),
                  ],
                }),
              ],
            }),""",
    """          : TclPageOf(n)
            ? w.jsx(TclPage, { route: n })
            : w.jsxs("main", {
                children: [w.jsx(TclOpening, {}), o, w.jsx(TclHome, {})],
              }),""",
)
# the hero scene only renders while its own section is on screen (the opening sits above it)
rep("      (bt.sceneVisible = i.bottom > 0),", "      (bt.sceneVisible = i.bottom > 0 && i.top < n),")
# 3D scene only renders on the home page; the loader does not wait for it on sub-pages
rep("(r(bt.sceneVisible), (i = requestAnimationFrame(s)));", "(r(bt.sceneVisible && !TclSubNow()), (i = requestAnimationFrame(s)));")
rep("    l = e ? 100 : Math.min(n, 92);", "    l = e || TclSubNow() ? 100 : Math.min(n, 92);")
rep("      if (!t && e && i >= 100) {", "      if (!t && (e || TclSubNow()) && i >= 100) {")

# --- navigation: Bold Istanbul / Story / Film / Contact as pages
rep(
    '      Ua &&\n        w.jsxs("div", {\n          className: `navcat',
    '      !1 &&\n        w.jsxs("div", {\n          className: `navcat',
)
_u0 = src.index("    u = Ua\n      ? [", src.index("function tK({ ui: n })"))
_u1 = src.index("    f = (m) => Ua.items.filter", _u0)
src = src[:_u0] + "    u = TclNavItems(n.nav),\n" + src[_u1:]
_e0 = src.index("const ek = (\n  ft.catalog")
_e1 = src.index(").filter(([n]) => !Za.has(n.slice(1)));", _e0) + len(").filter(([n]) => !Za.has(n.slice(1)));")
src = src[:_e0] + 'const ek = [\n  ["#/urun", "bold"],\n  ["#/hikaye", "journey"],\n  ["#/film", "film"],\n  ["#/iletisim", "contact"],\n];' + src[_e1:]
rep(
    '      ft.catalog &&\n        w.jsxs("nav", {\n          className: "menu__cats",',
    '      !1 &&\n        w.jsxs("nav", {\n          className: "menu__cats",',
)
rep(
    '        finder: "Tat bulucu",',
    '        finder: "Tat bulucu",\n        film: "Film",\n        journey: "Hikâye",\n        bold: "Bold Istanbul",',
)
rep(
    '        finder: "Flavor finder",',
    '        finder: "Flavor finder",\n        film: "Film",\n        journey: "Story",\n        bold: "Bold Istanbul",',
)

# --- copy: one can, one story
rep('tr: "Beş şehir, beş tat; 250 ml, çalkala ve soğuk iç."', 'tr: "Bold Istanbul; 250 ml, çalkala ve soğuk iç."')
rep('en: "Five cities, five flavors; 250 ml, shake well and drink cold."', 'en: "Bold Istanbul; 250 ml, shake well and drink cold."')
src = src.replace('"Beş şehir, beş tat"', '"Bir fincan cesaret"')
src = src.replace('"Five cities, five flavors"', '"A cup of courage"')
rep('["5", "şehir, 5 tat"]', '["15", "yıllık Türk kahvesi elçiliği"]')
rep('["5", "cities, 5 flavors"]', '["15", "years as a coffee ambassador"]')
rep(
    '        ["Alexandria, VA", "Turkish Coffee Lady Culture House"],\n        ["2025", "InvestBev hızlandırma programı"],',
    '        ["2012", "Türk kahvesi kamyonu ABD turunda · ABD Kongresi kayıtlarına geçiyor"],\n'
    '        ["Alexandria, VA", "Turkish Coffee Lady Culture House"],\n        ["2025", "InvestBev hızlandırma programı"],',
)
rep(
    '        ["Alexandria, VA", "Turkish Coffee Lady Culture House"],\n        ["2025", "InvestBev accelerator program"],',
    '        ["2012", "The Turkish coffee truck tours the US · entered into the Congressional Record"],\n'
    '        ["Alexandria, VA", "Turkish Coffee Lady Culture House"],\n        ["2025", "InvestBev accelerator program"],',
)
rep(
    '        "Kaç tat var?",\n'
    '        "Beş şehir, beş tat: Bold Istanbul (koyu & yoğun), Silky Mardin (sütlü & kremsi), Piney Aegean (damla sakızı & Akdeniz otları), Minty Cappadocia (nane & kakule), Pistachio Zeugma (sütlü & kafeinsiz).",',
    '        "Bold Istanbul nasıl bir tat?",\n'
    '        "Koyu ve yoğun: yüzyıllık bir Türk kahvesi harmanı, buzlu ve kutuda. %100 doğal, sıfır şeker, düşük kalori. Çalkala, soğuk iç.",\n'
    "      ],\n      [\n"
    '        "Filmi nereden izleyebilirim?",\n'
    '        "“Bir Fincan Cesaret” belgeselinin tamamı bu sayfadaki Film bölümünde. Bölümler listesinden istediğin ana atlayabilirsin.",',
)
rep(
    '        "How many flavors are there?",\n'
    '        "Five cities, five flavors: Bold Istanbul (dark & rich), Silky Mardin (milky & creamy), Piney Aegean (mastic gum & Mediterranean herbs), Minty Cappadocia (mint & cardamom), Pistachio Zeugma (milky & decaf).",',
    '        "What does Bold Istanbul taste like?",\n'
    '        "Dark and rich: a centuries-old Turkish coffee blend, iced and canned. 100% natural, zero sugar, low calorie. Shake well, drink cold.",\n'
    "      ],\n      [\n"
    '        "Where can I watch the film?",\n'
    '        "The full “A Cup of Courage” documentary (in Turkish) is in the Film section of this page. Use the chapter list to jump to any moment.",',
)

# --- real Bold Istanbul can: new photo texture (front render + redrawn back label) and silhouette
import json as _json
_here = pathlib.Path(__file__).parent
_geom = _json.loads((_here / "geom.json").read_text())
_hash = (_here / "tex_hash").read_text().strip()
rep('new URL("bold-istanbul-jHUIzGQy.webp", import.meta.url)', f'new URL("bold-istanbul-real-{_hash}.webp", import.meta.url)')
_i = src.index('photo3d: {', src.index('name: "Bold Istanbul"'))
_e = src.index('edge: "#767675"', _i)
_block = src[_i:_e]
_j = _block.index("rows: [")
_k = _block.index("],", _j) + 2
_block = _block[:_j] + "rows: " + _json.dumps(_geom["rows"]) + "," + _block[_k:]
_o = _block.index("outline: [")
_block = _block[:_o] + "outline: " + _json.dumps(_geom["outline"]) + ",\n        "
_block = _block.replace("axis: 0.4992,", "axis: %s," % _geom["axis"], 1)
src = src[:_i] + _block + src[_e:]

pathlib.Path(out).write_text(src, encoding="utf-8")
