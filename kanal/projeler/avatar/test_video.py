# BerkAİ avatar test videosu: hazır anlatım + animasyonlar + 15 sn HeyGen avatar girişi
import json, os, subprocess, math, wave
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

S = "/tmp/claude-0/-home-user-analiz/15f5e81a-2f5a-535e-8b53-dec004b93200/scratchpad"
O = f"{S}/avatar_test"; os.makedirs(f"{O}/p", exist_ok=True)
AV = "/root/.claude/uploads/15f5e81a-2f5a-535e-8b53-dec004b93200/d9c1b7a4-b82d0d43-d224-4408-a523-9d1f9c567f06.mov"
FETIH = "/home/user/analiz/video_teslim/IstanbulunFethi_muzikli.mp4"
COP = f"{S}/format/out/cop_adam.mp4"
CF = f"{S}/format/out/sahne_fatih.mp4"
W, H, FPS = 1920, 1080, 30
FB = ImageFont.truetype("/usr/share/fonts/opentype/inter/Inter-Black.otf", 64)
FBB = ImageFont.truetype("/usr/share/fonts/opentype/inter/Inter-Bold.otf", 40)
FM = ImageFont.truetype("/usr/share/fonts/opentype/inter/Inter-SemiBold.otf", 30)
ORANGE = (242, 140, 40)

def sh(cmd): subprocess.run(cmd, shell=True, check=True)
VF = f"scale={W}:{H}:flags=lanczos,fps={FPS},format=yuv420p"
AF = "aresample=48000,aformat=channel_layouts=stereo,loudnorm=I=-14:TP=-1.5:LRA=11"
ENC = "-c:v libx264 -preset veryfast -crf 15 -c:a pcm_s16le"

def fade_af(d, fi=.12, fo=.15): return f"afade=t=in:d={fi},afade=t=out:st={max(0, d - fo):.3f}:d={fo}"

def cut(src, a, b, out, speed=1.0, overlay=None):
    d = (b - a) / speed
    vf = (f"setpts=PTS/{speed}," if speed != 1 else "") + VF
    af = (f"atempo={speed}," if speed != 1 else "") + AF + "," + fade_af(d)
    if overlay:
        sh(f'ffmpeg -v error -y -ss {a} -to {b} -i "{src}" -framerate {FPS} -i "{overlay}/f_%04d.png" -filter_complex '
           f'"[0:v]{vf}[v];[v][1:v]overlay=0:0:shortest=1,format=yuv420p[o]" -map "[o]" -map 0:a -af "{af}" {ENC} {out}')
    else:
        sh(f'ffmpeg -v error -y -ss {a} -to {b} -i "{src}" -vf "{vf}" -af "{af}" {ENC} {out}')
    return d

# ---------- avatar fotoğrafı (rozet ve bitiş kartı için) ----------
sh(f'ffmpeg -v error -y -ss 6 -i "{AV}" -frames:v 1 {O}/av_kare.png')
avk = Image.open(f"{O}/av_kare.png").convert("RGB")
def face_circle(size):
    cx, cy, r = 650, 250, 210
    c = avk.crop((cx - r, cy - r, cx + r, cy + r)).resize((size, size), Image.LANCZOS)
    m = Image.new("L", (size, size), 0); ImageDraw.Draw(m).ellipse((0, 0, size - 1, size - 1), fill=255)
    return c, m

PIP_D = 400
def badge_frames(src, a, b, outdir):
    import shutil; shutil.rmtree(outdir, ignore_errors=True)
    """Sağ altta yuvarlak 'BerkAİ' rozeti; halka anlatım sesine göre atar."""
    os.makedirs(outdir, exist_ok=True)
    raw = subprocess.check_output(["ffmpeg", "-v", "error", "-ss", str(a), "-to", str(b), "-i", src, "-ac", "1", "-ar", "16000", "-f", "s16le", "-"])
    x = np.frombuffer(raw, np.int16).astype(np.float32); hop = 16000 // FPS; n = int(round((b - a) * FPS))
    e = np.array([np.sqrt(np.mean(x[i * hop:(i + 1) * hop] ** 2)) if (i + 1) * hop <= len(x) else 0 for i in range(n)])
    e = np.convolve(e, np.ones(3) / 3, "same"); e = (e / (np.percentile(e, 95) + 1e-6)).clip(0, 1)
    size = PIP_D; X, Y = 24, H - PIP_D          # ekranın altına yaslı, sol alt (referans)
    sh_ = Image.new("RGBA", (W, H), (0, 0, 0, 0)); ImageDraw.Draw(sh_).ellipse((X - 6, Y - 6, X + size + 6, Y + size + 6), fill=(0, 0, 0, 120))
    sh_ = sh_.filter(ImageFilter.GaussianBlur(14))
    for i in range(n):
        sh_.save(f"{outdir}/f_{i + 1:04d}.png") if i == 0 else os.link(f"{outdir}/f_0001.png", f"{outdir}/f_{i + 1:04d}.png") if not os.path.exists(f"{outdir}/f_{i + 1:04d}.png") else None

def avatar_overlay(outdir, dur):
    """İsim etiketi + kelime kelime alt yazı (STT zamanlarıyla)."""
    os.makedirs(outdir, exist_ok=True)
    words = [w for w in json.load(open(f"{S}/avatar/stt.json"))["words"] if w.get("type") == "word"]
    # cümlelere böl
    lines, cur = [], []
    for w in words:
        cur.append(w)
        if w["text"].endswith((".", ",")) and len(cur) >= 3 or len(cur) >= 6: lines.append(cur); cur = []
    if cur: lines.append(cur)
    n = int(round(dur * FPS))
    for i in range(n):
        t = i / FPS
        f = Image.new("RGBA", (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(f)
        # isim etiketi (ilk 5 sn)
        if t < 5.0:
            a = min(1, t / .4, (5.0 - t) / .4)
            x0 = 90 - int((1 - min(1, t / .4)) * 60)
            d.rounded_rectangle((x0, 760, x0 + 430, 850), radius=14, fill=(18, 18, 22, int(235 * a)))
            d.rectangle((x0, 760, x0 + 12, 850), fill=(*ORANGE, int(255 * a)))
            d.text((x0 + 34, 770), "Berkay", font=FBB, fill=(255, 255, 255, int(255 * a)))
            d.text((x0 + 34, 815), "BerkAİ · yapay zekâ ile projeler", font=ImageFont.truetype("/usr/share/fonts/opentype/inter/Inter-Medium.otf", 24), fill=(220, 220, 225, int(255 * a)))
        ln = next((l for l in lines if l[0]["start"] - .1 <= t <= l[-1]["end"] + .25), None)
        if ln:
            txt = [w["text"] for w in ln]; cw = [d.textlength(s + " ", font=FB) for s in txt]; tot = sum(cw)
            x = W / 2 - tot / 2; y = 930
            box = (x - 30, y - 14, x + tot + 10, y + 80); d.rounded_rectangle(box, radius=18, fill=(10, 10, 12, 150))
            for w, s, ww in zip(ln, txt, cw):
                on = w["start"] <= t
                col = ORANGE if (w["start"] <= t <= w["end"] + .05) else ((255, 255, 255) if on else (255, 255, 255, 110))
                d.text((x + 2, y + 3), s, font=FB, fill=(0, 0, 0, 160)); d.text((x, y), s, font=FB, fill=col); x += ww
        f.save(f"{outdir}/f_{i + 1:04d}.png")

def caption_card(outdir, dur, title, sub):
    os.makedirs(outdir, exist_ok=True); n = int(round(dur * FPS))
    for i in range(n):
        t = i / FPS; a = min(1, t / .3, (dur - t) / .3)
        f = Image.new("RGBA", (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(f)
        tw = d.textlength(title, font=FBB) + 60
        d.rounded_rectangle((W / 2 - tw / 2, 60, W / 2 + tw / 2, 140), radius=40, fill=(18, 18, 22, int(225 * a)))
        d.text((W / 2 - tw / 2 + 30, 76), title, font=FBB, fill=(*ORANGE, int(255 * a)))
        sw = d.textlength(sub, font=FM)
        d.text((W / 2 - sw / 2, 152), sub, font=FM, fill=(60, 50, 40, int(255 * a)))
        f.save(f"{outdir}/f_{i + 1:04d}.png")

def music(dur, path, fade_in=.3):
    sr = 48000; n = int(dur * sr); t = np.arange(n) / sr
    ch = [(146.83, 220.0, 261.63, 329.63), (130.81, 196.0, 261.63, 311.13)]
    sig = np.zeros(n)
    for k in range(int(dur / 2) + 1):
        fr = ch[k % 2]; i0 = int(k * 2 * sr); seg = np.arange(min(n - i0, int(2.6 * sr))) / sr
        if len(seg) <= 0: continue
        env = np.minimum(1, seg / .4) * np.exp(-seg * .6)
        sig[i0:i0 + len(seg)] += sum(np.sin(2 * np.pi * f * seg) for f in fr) * env * .05
        for j, f in enumerate((fr[2] * 2, fr[3] * 2, fr[1] * 2, fr[3] * 2)):
            p0 = i0 + int(j * .5 * sr); ps = np.arange(min(n - p0, int(.5 * sr))) / sr
            if len(ps) > 0: sig[p0:p0 + len(ps)] += np.sin(2 * np.pi * f * ps) * np.exp(-ps * 7) * .06
    sig *= np.minimum(1, t / fade_in) * np.minimum(1, (dur - t) / .8)
    st = (np.stack([sig, sig], 1) * 32767 * .6).astype(np.int16)
    with wave.open(path, "wb") as wf: wf.setnchannels(2); wf.setsampwidth(2); wf.setframerate(sr); wf.writeframes(st.tobytes())


from PIL import Image as _I
_mk = _I.new("L", (800, 800), 0); ImageDraw.Draw(_mk).ellipse((0, 0, 799, 799), fill=255); _mk.resize((PIP_D, PIP_D), _I.LANCZOS).save(f"{O}/mask300.png")
def cut_badge(src, a, b, out, ovdir, avoff):
    """Halka karelerinin üstüne döngüdeki hareketli avatar (sessiz) yuvarlak olarak konur."""
    d = b - a
    af = AF + "," + fade_af(d)
    sh(f'ffmpeg -v error -y -ss {a} -to {b} -i "{src}" -framerate {FPS} -i "{ovdir}/f_%04d.png" -stream_loop -1 -ss {avoff} -i "{AV}" -loop 1 -i {O}/mask300.png -filter_complex '
       f'"[0:v]{VF}[v];[v][1:v]overlay=0:0:shortest=1[v1];[2:v]fps={FPS},crop=630:630:330:90,scale=400:400:flags=lanczos,format=rgba[av];[3:v]format=gray[mk];[av][mk]alphamerge[avc];'
       f'[v1][avc]overlay=24:{H - PIP_D}:shortest=1,format=yuv420p[o]" -map "[o]" -map 0:a -t {d:.3f} -af "{af}" {ENC} {out}')
    return d
P = []
ONLY = os.environ.get('ONLY')
# 1) kanca
P.append(("p01", cut(FETIH, 7.0, 11.3, f"{O}/p/p01.mov")))
# 2) avatar girişi
avatar_overlay(f"{O}/ov_av", 15.04)
sh(f'ffmpeg -v error -y -i "{AV}" -framerate {FPS} -i "{O}/ov_av/f_%04d.png" -filter_complex "[0:v]{VF}[v];[v][1:v]overlay=0:0:shortest=1,format=yuv420p[o]" '
   f'-map "[o]" -map 0:a -af "{AF},{fade_af(15.04)}" {ENC} {O}/p/p02.mov')
P.append(("p02", 15.04))
# 3–4) fetih: zincir + 20/22 Nisan (rozetli)
for name, a, b, ao in (("p03", 59.6, 66.7, 0.0), ("p04", 117.7, 156.4, 3.0)):
    badge_frames(FETIH, a, b, f"{O}/ov_{name}"); P.append((name, cut_badge(FETIH, a, b, f"{O}/p/{name}.mov", f"{O}/ov_{name}", ao)))
# 5) aynı an çöp adam tarzında (müzikli, kendi sesi yok)
d5 = (17.6 - 9.4) / 1.25
caption_card(f"{O}/ov_p05", d5, "Aynı an, çöp adam tarzında", "Claude ile kodla, ücretsiz")
music(d5, f"{O}/m05.wav")
sh(f'ffmpeg -v error -y -ss 9.4 -to 17.6 -i "{COP}" -i {O}/m05.wav -framerate {FPS} -i "{O}/ov_p05/f_%04d.png" -filter_complex '
   f'"[0:v]setpts=PTS/1.25,{VF}[v];[v][2:v]overlay=0:0:shortest=1,format=yuv420p[o]" -map "[o]" -map 1:a -af "{AF},{fade_af(d5)}" -t {d5:.3f} {ENC} {O}/p/p05.mov')
P.append(("p05", d5))
# 6) Bizans iki cepheye bölündü (rozetli)
badge_frames(FETIH, 156.4, 161.5, f"{O}/ov_p06"); P.append(("p06", cut_badge(FETIH, 156.4, 161.5, f"{O}/p/p06.mov", f"{O}/ov_p06", 9.0)))
# 7) çizgi film: Fatih ve yeniçeri (kendi sesleri)
P.append(("p07", cut(CF, 14.8, 27.9, f"{O}/p/p07.mov")))
# 8–10) son saldırı, Ayasofya, kapanış (rozetli)
for name, a, b, ao in (("p08", 178.8, 208.8, 5.0), ("p09", 208.7, 217.9, 1.0), ("p10", 238.6, 247.9, 7.0)):
    badge_frames(FETIH, a, b, f"{O}/ov_{name}"); P.append((name, cut_badge(FETIH, a, b, f"{O}/p/{name}.mov", f"{O}/ov_{name}", ao)))
# 11) bitiş kartı
card = Image.new("RGB", (W, H), (14, 15, 20)); d = ImageDraw.Draw(card)
gr = Image.new("L", (W, H)); ImageDraw.Draw(gr).ellipse((W / 2 - 700, H / 2 - 500, W / 2 + 700, H / 2 + 500), fill=90); gr = gr.filter(ImageFilter.GaussianBlur(160))
card.paste((60, 30, 10), (0, 0), gr); d = ImageDraw.Draw(card)
face, m = face_circle(360); d.ellipse((W / 2 - 192, 160 - 12, W / 2 + 192, 160 + 372), fill=ORANGE); card.paste(face, (int(W / 2 - 180), 160), m)
big = ImageFont.truetype("/usr/share/fonts/opentype/inter/Inter-Black.otf", 96)
for s_, y, f_, c_ in (("BerkAİ", 600, big, (255, 255, 255)), ("Sıradaki konu ne olsun? Yorumlara yaz", 735, FBB, (230, 230, 235))):
    tw = d.textlength(s_, font=f_); d.text((W / 2 - tw / 2, y), s_, font=f_, fill=c_)
bw = 340; d.rounded_rectangle((W / 2 - bw / 2, 830, W / 2 + bw / 2, 920), radius=45, fill=(220, 30, 30))
tw = d.textlength("ABONE OL", font=FBB); d.text((W / 2 - tw / 2, 851), "ABONE OL", font=FBB, fill=(255, 255, 255))
card.save(f"{O}/bitis.png"); music(4.5, f"{O}/m11.wav", .05)
sh(f'ffmpeg -v error -y -loop 1 -framerate {FPS} -i {O}/bitis.png -i {O}/m11.wav -t 4.5 -vf "zoompan=z=\'min(1.06,1+0.0006*on)\':d=1:s={W}x{H}:fps={FPS},format=yuv420p,fade=t=out:st=4.0:d=0.5" -af "{AF},{fade_af(4.5, .05, .5)}" {ENC} {O}/p/p11.mov')
P.append(("p11", 4.5))

open(f"{O}/list.txt", "w").write("".join(f"file '{O}/p/{n}.mov'\n" for n, _ in P))
tot = sum(d for _, d in P); print("toplam", round(tot, 1), "sn")
json.dump(P, open(f"{O}/parcalar.json", "w"))
