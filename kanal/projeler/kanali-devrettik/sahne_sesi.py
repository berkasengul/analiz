# tts_xi.py'den sonra çalıştır: "cfilm" anına çizgi film sahnesinin kendi sesini (0.8 hızda) yerleştirir
import json, subprocess, wave, numpy as np, os
V = os.path.dirname(os.path.abspath(__file__))
TL = json.load(open(f"{V}/tts/timeline.json"))
SRC = f"{V}/../format/out/sahne_ses.wav"
w = wave.open(f"{V}/tts/voice.wav"); sr = w.getframerate(); v = np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(np.float32); w.close()
for it in TL["items"]:
    if "i" in it and it["vis"][0] == "cfilm":
        off = float(it["vis"][1]); dur = it["d"] * .8
        raw = subprocess.check_output(["ffmpeg", "-v", "error", "-ss", str(off), "-t", str(dur), "-i", SRC, "-af", "atempo=0.8", "-ac", "1", "-ar", str(sr), "-f", "s16le", "-"])
        a = np.frombuffer(raw, np.int16).astype(np.float32) * .9
        n = len(a); f = int(.25 * sr); a[:f] *= np.linspace(0, 1, f); a[-f:] *= np.linspace(1, 0, f)
        k = int(it["t"] * sr); v[k:k + n] += a[:len(v) - k]
        print("sahne sesi eklendi", it["t"], round(n / sr, 2), "sn")
with wave.open(f"{V}/tts/voice.wav", "wb") as wf:
    wf.setnchannels(1); wf.setsampwidth(2); wf.setframerate(sr); wf.writeframes(v.clip(-32767, 32767).astype(np.int16).tobytes())
