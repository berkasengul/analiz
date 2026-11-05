# ElevenLabs (Berkay, eleven_v4) ile cümle cümle seslendirme + zaman çizelgesi
import json, os, subprocess, wave, urllib.request, hashlib
from concurrent.futures import ThreadPoolExecutor
import numpy as np
from script import SCRIPT, SAY
V = os.path.dirname(os.path.abspath(__file__))
KEY = open(f"{V}/../.xi").read().strip()
VOICE, MODEL = "KTXKO43nOuyC5Akqu7yX", "eleven_v4"
D = f"{V}/tts_cache"; os.makedirs(D, exist_ok=True)
def spoken(s):
    for a, b in SAY.items(): s = s.replace(a, b)
    return s
def synth(i, text):
    mp3 = f"{D}/h_{hashlib.sha1(text.encode()).hexdigest()[:16]}.mp3"
    if os.path.exists(mp3) and os.path.getsize(mp3) > 1000: return
    body = json.dumps({"text": spoken(text), "model_id": MODEL, "language_code": "tr",
                       "voice_settings": {"stability": 0.5, "similarity_boost": 0.8, "style": 0.25, "use_speaker_boost": True, "speed": 1.15}}).encode()
    import time
    for attempt in range(8):
        try:
            req = urllib.request.Request(f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE}?output_format=mp3_44100_128", body,
                                         {"xi-api-key": KEY, "Content-Type": "application/json"})
            open(mp3, "wb").write(urllib.request.urlopen(req, timeout=120).read()); return
        except Exception as e:
            err = e; time.sleep(min(30, 3 * 2 ** attempt))
    raise RuntimeError(f"{i}: {err}")
jobs = [(i, e[0]) for i, e in enumerate(SCRIPT) if e[0] not in ("ch", "")]
with ThreadPoolExecutor(2) as ex: list(ex.map(lambda a: synth(*a), jobs))
SR = 44100; out = []; t = 0.6; chunks = []
for i, e in enumerate(SCRIPT):
    if e[0] == "ch": out.append({"ch": e[1], "it": e[2], "t": t}); t += 2.8; continue
    if e[0] == "": out.append({"i": i, "say": "", "cap": "", "vis": list(e[2]), "t": round(t, 3), "d": e[3]}); t += e[3] + 0.3; continue
    raw = subprocess.check_output(["ffmpeg", "-v", "error", "-i", f"{D}/h_{hashlib.sha1(e[0].encode()).hexdigest()[:16]}.mp3", "-ac", "1", "-ar", str(SR), "-f", "s16le", "-"])
    a = np.frombuffer(raw, np.int16)
    nz = np.nonzero(np.abs(a) > 400)[0]
    if len(nz): a = a[max(0, nz[0] - int(.03 * SR)):nz[-1] + int(.1 * SR)]
    d = len(a) / SR
    out.append({"i": i, "say": e[0], "cap": e[1], "vis": list(e[2]), "t": round(t, 3), "d": round(d, 3)})
    chunks.append((t, a)); t += d + 0.45
total = t + 8.5
mix = np.zeros(int(total * SR), np.int16)
for st, a in chunks: k = int(st * SR); mix[k:k + len(a)] = a
with wave.open(f"{V}/tts/voice.wav", "wb") as wf:
    wf.setnchannels(1); wf.setsampwidth(2); wf.setframerate(SR); wf.writeframes(mix.tobytes())
json.dump({"sr": SR, "total": total, "items": out}, open(f"{V}/tts/timeline.json", "w"), ensure_ascii=False, indent=1)
print("toplam", round(total, 1), "sn =", round(total / 60, 2), "dk")
