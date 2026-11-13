# Satış ekibi videosu: bölüm bölüm kurgu. Kullanım: python3 render.py [bölüm numaraları...]  (boşsa hepsi) ; python3 render.py son
import json, os, re, subprocess, sys, glob, wave
import numpy as np
S = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # scratchpad
K = f"{S}/kurgu"; KART = f"{K}/kart"; OUT = f"{K}/out"; os.makedirs(OUT, exist_ok=True)
H = f"{S}/kayit/kullanici/halare.mp4"; EM = f"{S}/kayit/eski/masa.webm"; ET = f"{S}/kayit/eski/tel.webm"; OF = f"{S}/kayit/ofis"
OT = "/home/user/analiz/kanal/projeler/berkai-studyo/gunler/2026-11-13/06_mudur/ofis_test"
EK = "/home/user/analiz/kanal/projeler/berkai-studyo/gunler/2026-11-13/03_musteri/ekran"
FPS = 30; PAD = 0.7
def sh(c): subprocess.run(c, shell=True, check=True)
def dur(p): return float(subprocess.check_output(f"ffprobe -v error -show_entries format=duration -of csv=p=0 '{p}'", shell=True))
X264 = "-c:v libx264 -preset veryfast -crf 19 -pix_fmt yuv420p -r 30 -an"

# ---- çekim türleri: her biri d saniyelik 1920x1080 sessiz mp4 üretir ----
def img(p, d, o, zoom=True):
    z = "scale=2016:1134,crop=1920:1080:'48*t/%f':'27*t/%f'" % (d, d) if zoom else "scale=1920:1080"
    sh(f"ffmpeg -y -v error -loop 1 -t {d:.3f} -i '{p}' -vf \"{z},fps={FPS}\" {X264} '{o}'")
def seq(ps, d, o):
    lst = f"{o}.txt"; per = d / len(ps)
    open(lst, "w").write("".join(f"file '{p}'\nduration {per:.3f}\n" for p in ps) + f"file '{ps[-1]}'\n")
    sh(f"ffmpeg -y -v error -f concat -safe 0 -i '{lst}' -vf \"scale=1920:1080,fps={FPS}\" -t {d:.3f} {X264} '{o}'")
def vid(src, a, b, d, o, kind):
    L = b - a; k = d / L  # >1 yavaşlat
    if kind == "H":   # kullanıcının kaydı: tarayıcı çubuğu kesilir, bulanık zemin üstünde
        vf = (f"[0:v]trim={a}:{b},setpts=(PTS-STARTPTS)*{k:.4f},crop=1920:873:0:95,split[a][b];"
              f"[a]scale=2376:1080,crop=1920:1080,boxblur=30:3,eq=brightness=-0.15[bg];[b]scale=1920:873[fg];[bg][fg]overlay=0:103,fps={FPS}")
    elif kind == "EM":
        vf = f"[0:v]trim={a}:{b},setpts=(PTS-STARTPTS)*{k:.4f},scale=1920:1080,fps={FPS}"
    else:  # telefon: ortada, koyu zemin
        vf = (f"[0:v]trim={a}:{b},setpts=(PTS-STARTPTS)*{k:.4f},crop=390:844:0:0,scale=-2:1000,pad=1920:1080:(ow-iw)/2:40:color=0xF7F3EA,fps={FPS}")
    sh(f"ffmpeg -y -v error -i '{src}' -filter_complex \"{vf}\" -t {d:.3f} {X264} '{o}'")
def ofis(t0, t1, d, o):
    fr = sorted(glob.glob(f"{OF}/f_*.jpg"))
    sec = [p for p in fr if int(p[-9:-4]) % 2 == 0 and t0 * 25 <= int(p[-9:-4]) < t1 * 25]
    if not sec: raise SystemExit(f"ofis kareleri yok: {t0}-{t1}")
    seq(sec, d, o)
def split(d, o):  # solda eski site, sağda 3D vitrin (krem zemin)
    fb = "/usr/share/fonts/opentype/inter/Inter-Black.otf"
    vf = (f"[0:v]trim=12:{12+d:.3f},setpts=PTS-STARTPTS,scale=900:506[l];"
          f"[1:v]trim=18:{18+min(d,6):.3f},setpts=(PTS-STARTPTS)*{max(1,d/6):.3f},crop=1920:873:0:95,scale=900:409,pad=900:506:0:48:color=0x0c0a09[r];"
          f"color=c=0xF7F3EA:s=1920x1080:d={d:.3f}[z];[z][l]overlay=40:300[z1];[z1][r]overlay=980:300,"
          f"drawtext=fontfile={fb}:text='ŞU ANKİ SİTE':x=40:y=200:fontsize=64:fontcolor=0x1B2240,"
          f"drawtext=fontfile={fb}:text='3D VİTRİN':x=980:y=200:fontsize=64:fontcolor=0xF28C28,fps={FPS}")
    sh(f"ffmpeg -y -v error -i '{EM}' -i '{H}' -filter_complex \"{vf}\" -t {d:.3f} {X264} '{o}'")

kk = lambda n: f"{KART}/{n}.png"
TERM = [kk(f"term_{i:02d}") for i in range(1, 14)]
# ---- bölümler: (çekim, ağırlık) ----
B = {
 1: [(("H", 18, 23.5), 5.5), (("img", f"{OT}/ofis_musteri_panel.jpg"), 2.5), (("img", kk("mail")), 2.5), (("H", 4, 10), 4), (("ofis", 0, 6), 4),
     (("img", kk("urunler")), 3), (("H", 0, 2), 2.5), (("seq", [kk(f"akis_{i:02d}") for i in range(61)]), 3), (("seq", TERM), 3),
     (("img", f"{OT}/ofis_mudur_panel.jpg"), 2), (("img", kk("mail_v1")), 2), (("H", 24, 36), 8), (("H", 38, 44), 6)],
 2: [(("img", kk("kanca")), 8), (("ofis", 0, 6), 6), (("ofis", 6, 12), 6)],
 3: [(("ofis", 0, 6), 6), (("ofis", 6, 18), 8), (("img", kk("sema")), 10), (("img", f"{OT}/ofis_yururken.jpg"), 4), (("seq", [kk(f"kural_{i}") for i in range(1, 6)]), 16), (("ofis", 18, 30), 6)],
 4: [(("ofis", 30, 42), 8), (("img", f"{OT}/ofis_musteri_panel.jpg"), 7), (("img", f"{OT}/ofis_musteri_masa.jpg"), 10), (("img", f"{EK}/halare_masaustu.jpg"), 8),
     (("seq", TERM[:4]), 10), (("img", kk("urunler")), 10), (("EM", 9, 20), 12), (("seq", TERM[10:]), 6), (("img", kk("elendi")), 8), (("img", f"{OT}/ofis_musteri_panel.jpg"), 6)],
 5: [(("H", 0, 2), 3), (("EM", 9, 27), 14), (("ET", 6, 20), 8), (("split",), 10), (("H", 18, 24), 6), (("ofis", 42, 54), 8), (("img", f"{OT}/ofis_demo_ekranlari.jpg"), 5),
     (("img", kk("urunler")), 8), (("H", 4, 10), 8), (("H", 20, 24), 5), (("H", 10, 18), 9), (("H", 44, 47), 5), (("img", f"{OT}/ofis_site_panel.jpg"), 6),
     (("H", 24, 36), 10), (("H", 38, 40.5), 4), (("H", 40, 43), 5), (("ofis", 54, 66), 8)],
 6: [(("ofis", 69, 81), 8), (("img", kk("mail_v1")), 10), (("img", kk("mail_v2")), 6), (("img", kk("ayar")), 8), (("img", kk("sema_brevo")), 5),
     (("seq", [kk(f"akis_{i:02d}") for i in range(61)]), 8), (("img", f"{OT}/ofis_mail_panel.jpg"), 6), (("img", kk("takip")), 10)],
 7: [(("ofis", 81, 100), 14), (("img", f"{OT}/ofis_mudur_panel.jpg"), 6)],
 8: [(("seq", [kk(f"adim_{i}") for i in range(1, 6)]), 1)],
 9: [(("img", kk(f"sss_{i}")), 1) for i in range(1, 6)],
 10: [(("img", kk("fiyat")), 1)],
 11: [(("img", kk("hata")), 1)],
 12: [(("img", kk("ozet")), 8), (("ofis", 100, 107), 6)],
}
AVTAM = {1: 0.0, 2: 0.45, 7: 0.4, 11: 0.3, 12: 0.55}  # bölümün ne kadarı tam ekran avatar (1: girişte vitrin önce, avatar köşede)
ETIKET = {1: "", 2: "", 3: "OFİS", 4: "MÜŞTERİ BULMA", 5: "3D SİTE", 6: "MAİL + BREVO", 7: "MÜDÜR ODASI", 8: "SEN NASIL KURARSIN", 9: "SIK SORULANLAR", 10: "PARA KISMI", 11: "O HATA", 12: ""}

def bolum(n):
    a = f"{S}/ses/s{n:02d}.wav"; d = dur(a) + PAD
    sh_ = B[n]; tw = sum(w for _, w in sh_); parcalar = []
    for i, (c, w) in enumerate(sh_):
        dd = d * w / tw; o = f"{OUT}/b{n:02d}_{i:02d}.mp4"
        t = c[0]
        if t == "img": img(c[1], dd, o)
        elif t == "seq": seq(c[1], dd, o)
        elif t in ("H", "EM", "ET"): vid({"H": H, "EM": EM, "ET": ET}[t], c[1], c[2], dd, o, t)
        elif t == "ofis": ofis(c[1], c[2], dd, o)
        elif t == "split": split(dd, o)
        parcalar.append(o)
    lst = f"{OUT}/b{n:02d}.txt"; open(lst, "w").write("".join(f"file '{p}'\n" for p in parcalar))
    ham = f"{OUT}/b{n:02d}_ham.mp4"; sh(f"ffmpeg -y -v error -f concat -safe 0 -i '{lst}' -c copy '{ham}'")
    av = f"{S}/avatar/s{n:02d}.mp4"
    if os.path.exists(av):  # girişte tam ekran avatar, sonra sol altta yuvarlak köşe avatarı (README: çap ~400 px)
        tam = AVTAM.get(n, 0.35) * d
        vf = (f"[0:v]scale=1498:842[sv];color=c=0xF7F3EA:s=1920x1080:d={d:.3f}[cz];[cz][sv]overlay=402:119[base];"
              f"[1:v]setpts=PTS-STARTPTS+0.25/TB,scale=1920:1080,fps={FPS},split[af][ap];"
              f"[ap]crop=1080:1080:420:0,scale=360:360,format=rgba[apc];[2:v]scale=360:360[mk];[apc][mk]alphamerge[pip];"
              f"[0:v][af]overlay=0:0:enable='lt(t,{tam:.2f})'[full];[base][pip]overlay=40:690:enable='lt(t,{d-0.3:.2f})'[small];"
              f"[full][small]overlay=0:0:enable='gte(t,{tam:.2f})'")
        sh(f"ffmpeg -y -v error -i '{ham}' -i '{av}' -loop 1 -i '{K}/daire.png' -filter_complex \"{vf}\" -t {d:.3f} {X264} '{OUT}/b{n:02d}.mp4'")
    else: os.replace(ham, f"{OUT}/b{n:02d}.mp4")
    print(n, f"{d:.1f} sn", len(parcalar), "çekim", "· avatar" if os.path.exists(av) else "")

# ---- altyazı (bölüm içinde karakter oranıyla) ----
def ass_zaman(t): h = int(t // 3600); m = int(t % 3600 // 60); s = t % 60; return f"{h}:{m:02d}:{s:05.2f}"
def altyazi(baslangic):
    an = json.load(open(f"{S}/anlatim.json"))
    st = ("[Script Info]\nScriptType: v4.00+\nPlayResX: 1920\nPlayResY: 1080\n\n[V4+ Styles]\n"
          "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding\n"
          "Style: A,Inter Tight SemiBold,54,&H00FFFFFF,&H00FFFFFF,&H00000000,&H96000000,0,0,0,0,100,100,0,0,1,4,1,2,160,160,70,1\n"
          "Style: E,Anton,46,&H00140E0A,&H00140E0A,&H001A7AFF,&H001A7AFF,0,0,0,0,100,100,1,0,3,16,0,7,60,60,50,1\n\n"
          "[Events]\nFormat: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n")
    for n, o in enumerate(an, 1):
        t0 = baslangic[n] + 0.25; d = dur(f"{S}/ses/s{n:02d}.wav") - 0.4
        metin = " ".join(o["satirlar"]).replace('"', "")
        parca = []
        for cumle in re.split(r"(?<=[.?!:])\s+", metin):
            kel = cumle.split(); buf = []
            for w in kel:
                buf.append(w)
                if (len(buf) >= 7 and w.endswith(",")) or len(buf) >= 10: parca.append(" ".join(buf)); buf = []
            if buf: parca.append(" ".join(buf))
        top = sum(len(p) + 6 for p in parca); t = t0
        for p in parca:
            dd = d * (len(p) + 6) / top; st += f"Dialogue: 0,{ass_zaman(t)},{ass_zaman(t + dd)},A,,0,0,0,,{p}\n"; t += dd
        if ETIKET.get(n): st += f"Dialogue: 1,{ass_zaman(baslangic[n])},{ass_zaman(baslangic[n] + 4)},E,,0,0,0,,{{\\fad(200,300)}}{ETIKET[n]}\n"
    open(f"{OUT}/altyazi.ass", "w").write(st)

# ---- ses: anlatım + alttan müzik ----
def ses(baslangic, toplam, muzik=True):
    SR = 44100; n = int((toplam + 1) * SR); v = np.zeros(n, np.float32)
    for k, t in baslangic.items():
        w = wave.open(f"{S}/ses/s{k:02d}.wav"); sr = w.getframerate(); x = np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(np.float32) / 32768
        if sr != SR: x = np.interp(np.arange(int(len(x) * SR / sr)) / SR, np.arange(len(x)) / sr, x).astype(np.float32)
        i = int((t + 0.25) * SR); v[i:i + len(x)] += x[:n - i]
    rng = np.random.default_rng(3); L = int(.38 * SR); x = np.convolve(rng.normal(0, 1, L), np.ones(18) / 18, "same") * np.sin(np.pi * np.arange(L) / L) ** 2 * .10
    for c in KESIMLER:
        i = int(max(0, c - .19) * SR)
        if i + L < n: v[i:i + L] += x
    if muzik:
        st = np.arange(n) / SR; m = np.zeros(n, np.float32); bar = 60 / 92 * 4
        akor = [(174.61, 220.0, 261.63), (220.0, 261.63, 329.63), (146.83, 174.61, 220.0), (196.0, 246.94, 293.66)]
        for b in range(int(toplam / bar) + 1):
            i0 = int(b * bar * SR); i1 = min(n, int((b + 1) * bar * SR)); tt = np.arange(i1 - i0) / SR
            env = np.minimum(1, tt / .6) * np.minimum(1, (bar - tt) / .6)
            m[i0:i1] += sum(np.sin(2 * np.pi * f * tt) + .25 * np.sin(4 * np.pi * f * tt) for f in akor[b % 4]) * env * .012
            for q in range(4):
                j = i0 + int(q * bar / 4 * SR); L = min(int(.35 * SR), n - j)
                if L > 0: tq = np.arange(L) / SR; m[j:j + L] += np.sin(2 * np.pi * akor[b % 4][q % 3] * 2 * tq) * np.exp(-tq * 9) * .02
        m *= np.minimum(1, st / 2) * np.minimum(1, (toplam - st).clip(0) / 3)
        v += m
    v = np.clip(v, -1, 1); o = f"{OUT}/ses_{'muzikli' if muzik else 'muziksiz'}.wav"
    w = wave.open(o, "wb"); w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((v * 32767).astype(np.int16).tobytes()); w.close(); return o

KESIMLER = []
def son():
    bas = {}; t = 0
    for n in range(1, 13):
        bas[n] = t; kt = t
        for p in sorted(glob.glob(f"{OUT}/b{n:02d}_[0-9][0-9].mp4")): KESIMLER.append(kt); kt += dur(p)
        t += dur(f"{OUT}/b{n:02d}.mp4")
    lst = f"{OUT}/hepsi.txt"; open(lst, "w").write("".join(f"file '{OUT}/b{n:02d}.mp4'\n" for n in range(1, 13)))
    sh(f"ffmpeg -y -v error -f concat -safe 0 -i '{lst}' -c copy '{OUT}/goruntu.mp4'")
    a = ses(bas, t, False); ad = "BerkAI_Satis_Ekibi"
    sh(f"ffmpeg -y -v error -i '{OUT}/goruntu.mp4' -i '{a}' -filter_complex \"[1:a]loudnorm=I=-14:TP=-1.5:LRA=11[a]\" "
       f"-map 0:v -map '[a]' -c:v libx264 -preset medium -b:v 6000k -maxrate 8000k -bufsize 12000k -pix_fmt yuv420p -c:a aac -b:a 192k -movflags +faststart '{OUT}/{ad}.mp4'")
    print("süre", f"{t:.1f} sn = {t/60:.2f} dk")

if __name__ == "__main__":
    if sys.argv[1:] == ["son"]: son()
    else:
        for n in ([int(x) for x in sys.argv[1:]] or range(1, 13)): bolum(n)
