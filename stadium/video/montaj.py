# Stadyum uzun videosu kurgusu (BerkAİ stili).
# Kullanım: python3 -I montaj.py [parça no...]   (boşsa hepsi)  ·  python3 -I montaj.py son
# Girdi: heygen/0N_*.mp4 (avatar parçaları) + heygen/0N_*.words.json (kelime zamanları)
#        $KAYIT (kullanıcının site ekran kaydı), $SP/kart/*.png, $SP/v1shots/*.png (ilk sürüm)
# Çıktı: $SP/kurgu/out/pNN.mp4 ve son video
import json, os, re, subprocess, sys, glob
D = os.path.dirname(os.path.abspath(__file__))
SP = os.environ.get("SP", "/tmp/claude-0/-home-user-analiz/e274d3af-c40a-5d41-9c98-1b82ec1aae88/scratchpad")
AV = f"{D}/heygen"; KART = f"{SP}/kart"; FILM = f"{SP}/film"; V1 = f"{SP}/v1shots"
OUT = f"{SP}/kurgu/out"; os.makedirs(OUT, exist_ok=True)
FPS = 30
X264 = "-c:v libx264 -preset veryfast -crf 18 -pix_fmt yuv420p -r 30 -an"
FONT = f"{D}/fonts/InterTight800.ttf"; BLACK = "/usr/share/fonts/opentype/inter/Inter-Black.otf"
def sh(c): subprocess.run(c, shell=True, check=True)
def dur(p): return float(subprocess.check_output(f"ffprobe -v error -show_entries format=duration -of csv=p=0 '{p}'", shell=True))
PARCA = {1: "01_giris", 2: "02_hikaye_sonuc", 3: "03_ilk_deneme", 4: "04_uc_parca", 5: "05_sorunlar", 6: "06_nasil_yapilir", 7: "07_para", 8: "08_hata_kapanis"}

def nrm(s): return re.sub(r"[^\wçğıöşüâî]", "", s.lower()).replace("ı", "i").replace("i̇", "i").replace("â", "a")
class Cue:
    def __init__(s, n): s.W = json.load(open(f"{AV}/{PARCA[n]}.words.json"))
    def __call__(s, *kelimeler, sonra=0.0, d=-0.15):
        """Art arda gelen kelimelerin başlangıcı (ilk eşleşme, 'sonra' saniyesinden sonra)."""
        k = [nrm(x) for x in kelimeler]
        for i in range(len(s.W) - len(k) + 1):
            if s.W[i]["s"] < sonra: continue
            if all(nrm(s.W[i + j]["w"]).startswith(k[j]) for j in range(len(k))): return max(0, s.W[i]["s"] + d)
        raise SystemExit(f"cue bulunamadı: {kelimeler} (> {sonra})")

# ---- içerik klipleri: d saniyelik 1920x1080 sessiz mp4 ----
PEN = "scale=1498:842,pad=1920:1080:382:119:color=0xF7F3EA"  # kartlar krem zeminde pencere: sol alt avatar dairesine yer kalır
def kart(ad, d, o):  # hafif yaklaşma
    sh(f"ffmpeg -y -v error -loop 1 -t {d:.3f} -i '{KART}/{ad}.png' -vf \"scale=2016:1134,crop=1920:1080:'48*t/{d:.3f}':'27*t/{d:.3f}',{PEN},fps={FPS}\" {X264} '{o}'")
def resim(p, d, o):
    sh(f"ffmpeg -y -v error -loop 1 -t {d:.3f} -i '{p}' -vf \"scale=2016:1134,crop=1920:1080:'48*t/{d:.3f}':'27*t/{d:.3f}',{PEN},fps={FPS}\" {X264} '{o}'")
KAYIT = os.environ.get("KAYIT", f"{SP}/insta/kayit.mp4")  # kullanıcının kendi ekran kaydı (1920x814, 30 kare/sn)
def _kayit_vf(a, b, d):
    k = min(1.4, max(0.8, d / (b - a)))  # süreye uydurmak için hafif hızlandırma/yavaşlatma
    return (f"trim={a}:{b},setpts=(PTS-STARTPTS)*{k:.4f},split[x][y];[x]scale=2546:1080,crop=1920:1080,boxblur=28:3,eq=brightness=-0.18[bg];"
            f"[bg][y]overlay=0:133,tpad=stop_mode=clone:stop_duration={d:.3f},fps={FPS}")
def kayit(a, b, d, o):  # tam genişlik, üst/alt boşluk aynı görüntünün bulanığı
    sh(f"ffmpeg -y -v error -i '{KAYIT}' -filter_complex \"[0:v]{_kayit_vf(a, b, d)}\" -t {d:.3f} {X264} '{o}'")
def seri(parcalar, d, o):  # birkaç kısa kesit art arda (süre kesitlere eşit bölünür)
    tops = sum(b - a for a, b in parcalar); ara = []
    for j, (a, b) in enumerate(parcalar):
        oo = f"{o}.{j}.mp4"; kayit(a, b, d * (b - a) / tops, oo); ara.append(oo)
    lst = f"{o}.txt"; open(lst, "w").write("".join(f"file '{x}'\n" for x in ara)); sh(f"ffmpeg -y -v error -f concat -safe 0 -i '{lst}' -c copy '{o}'")
def bolunmus(sol, sag, d, o):  # solda ilk sürüm, sağda son hali
    vf = (f"[0:v]scale=880:495:force_original_aspect_ratio=increase,crop=880:495[l];[1:v]scale=880:495:force_original_aspect_ratio=increase,crop=880:495[r];"
          f"color=c=0xF7F3EA:s=1920x1080:d={d:.3f}[z];[z][l]overlay=60:330[z1];[z1][r]overlay=980:330,"
          f"drawtext=fontfile={BLACK}:text='İLK DENEME':x=60:y=240:fontsize=60:fontcolor=0xD23C32,"
          f"drawtext=fontfile={BLACK}:text='ŞİMDİ':x=980:y=240:fontsize=60:fontcolor=0x289650,fps={FPS}")
    sh(f"ffmpeg -y -v error -loop 1 -t {d:.3f} -i '{sol}' -loop 1 -t {d:.3f} -i '{sag}' -filter_complex \"{vf}\" -t {d:.3f} {X264} '{o}'")
def bos(d, o): sh(f"ffmpeg -y -v error -f lavfi -i color=c=0xF7F3EA:s=1920x1080:d={d:.3f}:r={FPS} {X264} '{o}'")

ETIKET = {3: "İLK DENEME", 4: "NASIL YAPTIK", 5: "ÇIKAN SORUNLAR", 6: "SİZ NASIL YAPARSINIZ", 7: "PARA KISMI", 8: "O HATA"}

def plan(n, c, L):
    """[(başlangıç sn, görüntü)] · görüntü: ('A',) tam avatar | ('kart', ad) | ('film', stad, a, b) | ('resim', yol) | ('bolunmus', sol, sag)"""
    R = f"{SP}/insta/rams_kare.jpg"
    K = lambda a, b: ("kayit", a, b)
    if n == 1: return [(0, K(0.0, 4.3)), (c("galatasaray"), ("A",)), (c("bilet", "almadan"), K(18.0, 21.5)), (c("ama", "baştan"), ("A",))]
    if n == 2: return [(0, ("A",)), (c("instagramda"), ("kart", "instagram")), (c("ilk", "birkaç"), ("resim", f"{V1}/b-intro2.png")),
                       (c("sonra", "dedim"), ("seri", [(1.0, 2.6), (64.0, 65.6), (133.0, 134.6)])), (c("önce", "sonucu"), ("A",)),
                       (c("siteyi", "açınca"), K(0.0, 6.3)), (c("bilet", "al", "butonuna"), K(6.3, 11.0)), (c("sahanın", "kenarında"), K(40.5, 45.0)),
                       (c("bir", "bloğa"), K(12.0, 17.5)), (c("koltuğu", "seçiyorum"), K(18.0, 22.5)),
                       (c("aynısını"), K(83.0, 86.0)), (c("tüpra"), K(146.0, 151.0)), (c("bu", "arada"), ("A",))]
    if n == 3: return [(0, ("A",)), (c("şimdi", "ilk"), ("bolunmus", f"{V1}/b-intro2.png", R)), (c("ve", "burada"), ("kart", "hatam")),
                       (c("ben", "de", "gittim"), K(23.0, 32.0)), (c("yani", "yapay"), ("A",))]
    if n == 4: return [(0, ("A",)), (c("site", "3"), ("kart", "parca_1")), (c("zemin"), ("seri", [(0.0, 6.3), (200.5, 205.0)])), (c("ücretsiz"), ("kart", "kaynak")),
                       (c("ikincisi"), ("kart", "parca_2")), (c("fenerbahçe", "nin", "dışını"), K(62.0, 82.5)), (c("fenerbahçe", "nin", "modeli"), ("kart", "kaynak")),
                       (c("üçüncüsü"), ("kart", "parca_3")), (c("modeldeki", "tribünleri"), K(146.0, 162.0)), (c("bu", "arada", "sizce"), ("A",)), (c("taraftarlığı"), ("kart", "yorum"))]
    if n == 5: return [(0, ("A",)), (c("1", "kamera"), ("kart", "sorun_1")), (c("2", "içeri"), ("kart", "sorun_2")), (c("3", "hazır"), ("kart", "sorun_3")),
                       (c("4", "dosya"), ("kart", "sorun_4")), (c("şunu", "söyleyeyim"), ("kart", "ders")), (c("bu", "projede"), ("A",))]
    if n == 6: return [(0, ("A",)), (c("5", "adım"), ("kart", "adim_1")), (c("ikincisi"), ("kart", "adim_2")), (c("üçüncüsü"), ("kart", "adim_3")),
                       (c("dördüncüsü"), ("kart", "adim_4")), (c("beşincisi"), ("kart", "adim_5")), (c("maliyet"), ("kart", "maliyet")), (c("ilk", "stat"), K(104.0, 111.0))]
    if n == 7: return [(0, ("A",)), (c("galatasaray", "a", "mı"), ("kart", "kime")), (c("birincisi"), ("kart", "musteri_1")), (c("ikincisi"), ("kart", "musteri_2")),
                       (c("üçüncüsü"), ("kart", "musteri_3")), (c("dördüncüsü"), ("kart", "musteri_4")), (c("peki", "nasıl"), ("kart", "satis")),
                       (c("bir", "de", "demo"), K(131.0, 142.0)), (c("fiyatı"), ("kart", "satis")), (c("bir", "de", "her"), K(166.0, 174.0))]
    if n == 8: return [(0, ("A",)), (c("kulübün"), ("kart", "hata")), (c("peki", "demo"), ("A",))]

def filmler():
    """15 kare/sn site kayıtlarını 30 kare/sn mp4'e çevirir (hareket aradeğerleme), RAMS için tek kare çıkarır."""
    for st in ("rams", "fb", "bjk"):
        o = f"{FILM}/{st}.mp4"
        if os.path.exists(o) or not os.path.exists(f"{FILM}/{st}/events.json"): continue
        sh(f"ffmpeg -y -v error -framerate 15 -i '{FILM}/{st}/f%05d.jpg' -vf \"minterpolate=fps=30:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1\" {X264} '{o}'")
        print("film", st, f"{dur(o):.1f} sn", flush=True)
    if not os.path.exists(f"{FILM}/rams_kare.jpg"): sh(f"cp '{FILM}/rams/f00000.jpg' '{FILM}/rams_kare.jpg'")

def parca(n):
    av = f"{AV}/{PARCA[n]}.mp4"; L = dur(av); c = Cue(n)
    P = plan(n, c, L) + [(L, None)]
    klip, avtam = [], []
    for i, (t0, g) in enumerate(P[:-1]):
        d = P[i + 1][0] - t0
        if d <= 0.05: continue
        o = f"{OUT}/p{n:02d}_{i:02d}.mp4"
        if g[0] == "A": bos(d, o); avtam.append((t0, t0 + d))
        elif g[0] == "kart": kart(g[1], d, o)
        elif g[0] == "kayit": kayit(g[1], g[2], d, o)
        elif g[0] == "seri": seri(g[1], d, o)
        elif g[0] == "resim": resim(g[1], d, o)
        elif g[0] == "bolunmus": bolunmus(g[1], g[2], d, o)
        klip.append(o)
    lst = f"{OUT}/p{n:02d}.txt"; open(lst, "w").write("".join(f"file '{p}'\n" for p in klip))
    ham = f"{OUT}/p{n:02d}_ham.mp4"; sh(f"ffmpeg -y -v error -f concat -safe 0 -i '{lst}' -c copy '{ham}'")
    tam = "+".join(f"between(t,{a:.3f},{b:.3f})" for a, b in avtam) or "0"
    et = ""
    if n in ETIKET:  # bölüm etiketi: sol üstte turuncu kutu, ilk 3.5 sn
        et = (f",drawtext=fontfile={BLACK}:text='{ETIKET[n]}':x=60:y=50:fontsize=46:fontcolor=0xFFFDF8:box=1:boxcolor=0xF28C28:boxborderw=18:"
              f"enable='between(t,0.3,3.8)'")
    # içerik krem zeminde 1498x842 pencere + sol altta yuvarlak avatar; tam avatar anlarında avatar tam ekran
    vf = (f"[0:v]fps={FPS}[base];"
          f"[1:v]scale=1920:1080,fps={FPS},split[af][ap];"
          f"[ap]crop=1080:1080:420:0,scale=340:340,format=rgba,geq=r='r(X,Y)':g='g(X,Y)':b='b(X,Y)':a='if(lte(hypot(X-170,Y-170),168),255,0)'[pip];"
          f"[base][pip]overlay=28:712[small];"
          f"[small][af]overlay=0:0:enable='{tam}'{et}")
    o = f"{OUT}/p{n:02d}.mp4"
    sh(f"ffmpeg -y -v error -i '{ham}' -i '{av}' -filter_complex \"{vf}\" -map 1:a -c:a aac -b:a 192k -t {L:.3f} -c:v libx264 -preset veryfast -crf 18 -pix_fmt yuv420p -r 30 '{o}'")
    json.dump({"kesimler": [t for t, g in P[1:-1]], "sure": L}, open(f"{OUT}/p{n:02d}.json", "w"))
    print(n, f"{L:.1f} sn", len(klip), "klip", flush=True)

def srt():
    """YouTube için altyazı dosyası (videoya gömülmez)."""
    t0, satir, k = 0.0, [], 1
    ts = lambda t: f"{int(t//3600):02d}:{int(t%3600//60):02d}:{int(t%60):02d},{int(round(t%1*1000))%1000:03d}"
    for n in PARCA:
        W = json.load(open(f"{AV}/{PARCA[n]}.words.json")); buf = []
        if any(w["w"].startswith("Altyazı") for w in W): W = W[:[w["w"].startswith("Altyazı") for w in W].index(True)]  # whisper uydurması
        for i, w in enumerate(W):
            buf.append(w)
            if w["w"].endswith((".", "?", "!")) or len(buf) >= 9 or i == len(W) - 1:
                satir.append(f"{k}\n{ts(t0 + buf[0]['s'])} --> {ts(t0 + buf[-1]['e'])}\n{' '.join(x['w'] for x in buf)}\n"); k += 1; buf = []
        t0 += dur(f"{AV}/{PARCA[n]}.mp4")
    txt = "\n".join(satir)
    for a, b in [(" 'ın", "'ın"), (" 'nin", "'nin"), (" 'ın", "'ın"), (" 'a", "'a"), (" 'e", "'e"), (" 'un", "'un"), (" 'yu", "yu"), (" 'ten", "'ten"),
                 ("Cloud Code", "Claude Code"), ("Cloud", "Claude"), ("Tridiver House", "3D Warehouse"), ("Tridibis", "3D bir"), ("tridi", "3D"), ("Tridi", "3D"),
                 ("Remspark", "RAMS Park"), ("Ramspark", "RAMS Park"), ("Rams Park", "RAMS Park"), ("Tüpraç", "Tüpraş"), ("Saracoglu", "Saracoğlu"), ("altlik", "alt lig"),
                 ("maile atıyor", "maili atıyor"), ("shortsa", "Shorts'a"), ("shorts", "Shorts"), ("Ligindeki", "Ligi'ndeki"), ("open street map", "OpenStreetMap"),
                 ("Bilet al butonuna", "\"Bilet Al\" butonuna"), ("bilet ala basınca", "\"Bilet Al\"a basınca"), ("Yapay Zeka", "Yapay zekâ"), ("yapay zeka", "yapay zekâ")]:
        txt = txt.replace(a, b)
    open(f"{D}/stadyum_uzun.srt", "w").write(txt)

def son():
    parcalar = [f"{OUT}/p{n:02d}.mp4" for n in PARCA]
    lst = f"{OUT}/hepsi.txt"; open(lst, "w").write("".join(f"file '{p}'\n" for p in parcalar))
    ham = f"{OUT}/hepsi_ham.mp4"; sh(f"ffmpeg -y -v error -f concat -safe 0 -i '{lst}' -c copy '{ham}'")
    # ses: hafif ses iyileştirme (alçak kesim, varlık bandı), yayın seviyesi; geçişlerde çok hafif "whoosh"
    bas, kes = 0.0, []
    for p in parcalar:
        j = json.load(open(p.replace(".mp4", ".json"))); kes += [bas + t for t in j["kesimler"]] + [bas]; bas += dur(p)
    import numpy as np, wave
    SR = 48000; raw = subprocess.check_output(["ffmpeg", "-v", "error", "-i", ham, "-af", "highpass=f=75,equalizer=f=3200:t=q:w=1.2:g=2.5,equalizer=f=250:t=q:w=1:g=-1.5", "-ac", "1", "-ar", str(SR), "-f", "s16le", "-"])
    v = np.frombuffer(raw, np.int16).astype(np.float32) / 32768; rng = np.random.default_rng(3)
    Lw = int(.36 * SR); x = np.convolve(rng.normal(0, 1, Lw), np.ones(14) / 14, "same") * np.sin(np.pi * np.arange(Lw) / Lw) ** 2 * .05
    for t in kes:
        i = int(max(0, t - .18) * SR)
        if 0 < i and i + Lw < len(v): v[i:i + Lw] += x
    a = f"{OUT}/ses.wav"; w = wave.open(a, "wb"); w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((np.clip(v, -1, 1) * 32767).astype(np.int16).tobytes()); w.close()
    o = f"{D}/BerkAI_Stadyum_Uzun.mp4"
    sh(f"ffmpeg -y -v error -i '{ham}' -i '{a}' -filter_complex \"[1:a]loudnorm=I=-14:TP=-1.5:LRA=11[a]\" -map 0:v -map '[a]' -c:v libx264 -preset medium -b:v 8000k -maxrate 10000k -bufsize 16000k -pix_fmt yuv420p -c:a aac -b:a 192k -ar 48000 -movflags +faststart '{o}'")
    srt(); print("bitti", o, f"{dur(o):.1f} sn")

if __name__ == "__main__":
    if sys.argv[1:] == ["son"]: son()
    elif sys.argv[1:] == ["film"]: filmler()
    else:
        for n in ([int(x) for x in sys.argv[1:]] or PARCA): parca(n)
