import sys, json, time
from faster_whisper import WhisperModel
src, out, model = sys.argv[1], sys.argv[2], sys.argv[3]
t0 = time.time()
m = WhisperModel(model, device="cpu", compute_type="int8", cpu_threads=4)
import wave, numpy as np
wf = wave.open(src); audio = np.frombuffer(wf.readframes(wf.getnframes()), np.int16).astype(np.float32) / 32768
segs, info = m.transcribe(audio, language="tr", word_timestamps=True, vad_filter=False, beam_size=5)
res = []
for s in segs:
    res.append({"start": s.start, "end": s.end, "text": s.text.strip(),
                "words": [{"w": w.word, "s": w.start, "e": w.end, "p": w.probability} for w in (s.words or [])]})
    print(f"[{s.start:7.2f}-{s.end:7.2f}] {s.text.strip()}", flush=True)
json.dump(res, open(out, "w"), ensure_ascii=False, indent=1)
print("DONE", time.time() - t0)
